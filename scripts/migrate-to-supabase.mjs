#!/usr/bin/env node
/**
 * Migra la galería actual (assets/js/gallery-data.js) a Supabase:
 * crea los grupos, sube los ficheros al bucket "gallery" y registra cada ítem.
 *
 * Se ejecuta UNA vez, después de:
 *   1) ejecutar supabase/schema.sql
 *   2) rellenar assets/js/md-config.js (url + anonKey)
 *   3) crear tu usuario admin (ver supabase/README.md)
 *
 * Usa TU usuario admin (email + contraseña), no la service_role key:
 * las políticas RLS se aplican igual que en el panel.
 *
 * PowerShell:
 *   $env:MD_ADMIN_EMAIL="tu@correo.com"; $env:MD_ADMIN_PASSWORD="..."; node scripts/migrate-to-supabase.mjs
 *
 * Opciones:
 *   --dry-run     solo muestra lo que haría, sin tocar Supabase
 *   --keep-local  no sube ficheros: registra las rutas "assets/..." del repo tal cual
 *   --force       continúa aunque ya existan grupos en Supabase (puede duplicar)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run');
const KEEP_LOCAL = args.has('--keep-local');
const FORCE = args.has('--force');
const CATEGORIES = ['flyers', 'animaciones', 'social-media', 'diseno-marca'];
const MAX_BYTES = 50 * 1024 * 1024;
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm'
};

function loadBrowserFile(rel) {
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { window });
  return window;
}

function safeName(name) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, path.extname(name))
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'archivo';
  return base + ext;
}

function die(msg) { console.error('\n✖ ' + msg); process.exit(1); }

// ---------- config ----------
const cfg = loadBrowserFile('assets/js/md-config.js').MD_SUPABASE || {};
const URL_ = (process.env.MD_SUPABASE_URL || cfg.url || '').replace(/\/+$/, '');
const KEY = process.env.MD_SUPABASE_ANON_KEY || cfg.anonKey || '';
const BUCKET = cfg.bucket || 'gallery';
const gallery = loadBrowserFile('assets/js/gallery-data.js').MD_GALLERY;
if (!gallery) die('No se pudo leer assets/js/gallery-data.js');

// ---------- plan ----------
const plan = [];
for (const cat of CATEGORIES) {
  (gallery[cat]?.groups || []).forEach((g, gi) => {
    plan.push({ cat, title: g.title, landscape: !!g.landscape, sort: gi + 1, items: g.items || [] });
  });
}
const uniqueFiles = [...new Set(plan.flatMap(g => g.items))];
console.log(`Plan: ${plan.length} grupos, ${plan.reduce((n, g) => n + g.items.length, 0)} ítems, ${uniqueFiles.length} ficheros únicos.`);
if (DRY) {
  for (const g of plan) console.log(`  [${g.cat}] ${g.title}${g.landscape ? ' (horizontal)' : ''}: ${g.items.length}`);
  const missing = uniqueFiles.filter(p => !fs.existsSync(path.join(ROOT, p)));
  if (missing.length) console.log('Ficheros que no existen (se omitirán):', missing);
  process.exit(0);
}

if (!URL_ || !KEY) die('Rellena url y anonKey en assets/js/md-config.js');
const EMAIL = process.env.MD_ADMIN_EMAIL, PASSWORD = process.env.MD_ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) die('Define MD_ADMIN_EMAIL y MD_ADMIN_PASSWORD (ver cabecera del script).');

// ---------- auth ----------
let session = null;
async function authRequest(grant, body) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) die(`Login fallido: ${j.error_description || j.msg || r.status}`);
  session = { token: j.access_token, refresh: j.refresh_token, expiresAt: Date.now() + (j.expires_in || 3600) * 1000 };
}
async function token() {
  if (Date.now() > session.expiresAt - 5 * 60 * 1000) await authRequest('refresh_token', { refresh_token: session.refresh });
  return session.token;
}
async function api(method, p, body, extraHeaders = {}) {
  const r = await fetch(`${URL_}${p}`, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

await authRequest('password', { email: EMAIL, password: PASSWORD });
const me = await api('GET', '/rest/v1/gallery_admins?select=user_id');
if (!me?.length) die('Ese usuario no está en gallery_admins. Añádelo con el SQL del README.');
const existing = await api('GET', '/rest/v1/gallery_groups?select=id&limit=1');
if (existing.length && !FORCE) die('Ya hay grupos en Supabase. Si de verdad quieres repetir la migración usa --force.');

// ---------- subida ----------
const uploaded = new Map(); // ruta local -> ruta en bucket
async function upload(localRel, cat) {
  if (KEEP_LOCAL) return localRel;
  if (uploaded.has(localRel)) return uploaded.get(localRel);
  const abs = path.join(ROOT, localRel);
  if (!fs.existsSync(abs)) { console.warn(`  ⚠ no existe, se omite: ${localRel}`); return null; }
  const size = fs.statSync(abs).size;
  if (size > MAX_BYTES) { console.warn(`  ⚠ supera 50 MB, se omite: ${localRel}`); return null; }
  const mime = MIME[path.extname(abs).toLowerCase()];
  if (!mime) { console.warn(`  ⚠ tipo no permitido, se omite: ${localRel}`); return null; }
  const dest = `${cat}/${safeName(path.basename(abs))}`;
  const r = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${dest.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      apikey: KEY, Authorization: `Bearer ${await token()}`,
      'Content-Type': mime, 'x-upsert': 'true', 'cache-control': 'max-age=31536000'
    },
    body: fs.readFileSync(abs)
  });
  if (!r.ok) throw new Error(`Subida fallida ${localRel}: ${r.status} ${await r.text()}`);
  console.log(`  ↑ ${dest} (${(size / 1048576).toFixed(1)} MB)`);
  uploaded.set(localRel, dest);
  return dest;
}

for (const g of plan) {
  console.log(`\n[${g.cat}] ${g.title}`);
  const [group] = await api('POST', '/rest/v1/gallery_groups',
    { category_slug: g.cat, title: g.title, landscape: g.landscape, sort: g.sort },
    { Prefer: 'return=representation' });
  const rows = [];
  for (const [i, local] of g.items.entries()) {
    const p = await upload(local, g.cat);
    if (!p) continue;
    rows.push({ group_id: group.id, path: p, media_type: /\.(mp4|webm|mov)$/i.test(local) ? 'video' : 'image', sort: i + 1 });
  }
  if (rows.length) await api('POST', '/rest/v1/gallery_items', rows);
  console.log(`  ✓ ${rows.length} ítems`);
}
console.log(`\nListo. ${uploaded.size} ficheros subidos. Abre gallery.html para comprobarlo.`);
