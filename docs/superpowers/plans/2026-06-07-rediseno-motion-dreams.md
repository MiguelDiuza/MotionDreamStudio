# Rediseño Motion Dreams — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) o superpowers:subagent-driven-development. Steps usan checkbox (`- [ ]`).

**Goal:** Rediseñar el sitio estático de Motion Dreams a un tema oscuro con glassmorphism Apple (refracción SVG), botones/escalado estandarizados, mobile-first, selector de monedas, y portafolio reorganizado (flyers unificado + galerías "Ver todos").

**Architecture:** Sistema de cristal centralizado en `styles.css` (tokens + clase `.md-glass` con sub-capas) + un filtro SVG inyectado una vez por `custom.js`. Las páginas consumen estas primitivas. Sin React/Tailwind. Verificación visual en el companion/navegador (no hay test runner).

**Tech Stack:** HTML5, Bootstrap 5, JS vanilla, AOS, Owl Carousel, filtro SVG `feDisplacementMap`, `backdrop-filter`.

**Spec:** `docs/superpowers/specs/2026-06-07-rediseno-motion-dreams-design.md`

---

## Convención de verificación

No hay framework de tests. Cada tarea se verifica abriendo la página afectada en el navegador
(servidor estático ya disponible / `file://` o el companion) y comprobando los criterios listados.
Commits frecuentes por tarea.

---

## Task 1: Fundación del sistema de diseño (tokens + cristal + tema oscuro) en CSS

**Files:**
- Modify: `assets/css/styles.css` (añadir bloque al final, marcado `/* === MD REDESIGN === */`)

- [ ] **Step 1: Añadir tokens y primitiva de cristal**

```css
/* === MD REDESIGN === */
:root{
  --md-red:#F20F0F; --md-red-d:#c40c0c; --md-dark:#1F2A2E; --md-ink:#07090a;
  --md-surface:#0d1316; --md-text:#ffffff; --md-text-dim:rgba(255,255,255,.7);
  --r-card:12px; --r-btn:9px; --r-ctrl:8px; --r-img:8px;
  --md-glow:0 0 60px rgba(242,15,15,.35);
  --md-shadow:0 12px 30px rgba(0,0,0,.45);
}
/* Cristal Apple: capas dentro de un contenedor .md-glass */
.md-glass{ position:relative; overflow:hidden; isolation:isolate; border-radius:var(--r-card); }
.md-glass > .mg-distort{ position:absolute; inset:0; z-index:0;
  backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px); filter:url(#md-glass-distortion); }
.md-glass > .mg-tint{ position:absolute; inset:0; z-index:1; background:rgba(255,255,255,.10); }
.md-glass > .mg-edge{ position:absolute; inset:0; z-index:2; pointer-events:none;
  box-shadow:inset 0 0 0 0.5px rgba(255,255,255,.12), inset 0 1px 0 rgba(255,255,255,.22); }
.md-glass > .mg-content{ position:relative; z-index:3; }
.md-glass--red > .mg-tint{ background:rgba(242,15,15,.16); }
.md-glass--btn{ border-radius:var(--r-btn); }
.md-glass--btn > .mg-edge{ border-radius:var(--r-btn); }
.md-glass--ctrl{ border-radius:var(--r-ctrl); }
.md-glass--ctrl > .mg-edge{ border-radius:var(--r-ctrl); }
/* Fallback sin backdrop-filter (Safari/otros) */
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .md-glass > .mg-distort{ background:rgba(255,255,255,.06); filter:none; }
}
```

- [ ] **Step 2: Tema oscuro base + tipografía fluida + glow utilitario**

```css
body{ background:var(--md-ink); color:var(--md-text); }
.bg-light-gray, .bg-white{ background:var(--md-surface) !important; }
.md-section-dark{ background:var(--md-ink); color:var(--md-text); }
h1,h2,h3,h4,h5,h6{ color:var(--md-text); }
.md-fluid-h1{ font-size:clamp(2.4rem,8vw,6rem); line-height:1.02; }
.md-fluid-h2{ font-size:clamp(1.7rem,4.5vw,3rem); }
.md-glow-red{ position:relative; }
.md-glow-red::after{ content:""; position:absolute; inset:0; z-index:-1; box-shadow:var(--md-glow); }
```

- [ ] **Step 3: Sistema de botones estandarizado (cristal)**

```css
.md-btn{ display:inline-flex; align-items:center; justify-content:center; gap:10px;
  min-height:46px; padding:12px 22px; border:none; cursor:pointer; border-radius:var(--r-btn);
  font-weight:700; font-size:clamp(.85rem,1.4vw,1rem); color:#fff; text-decoration:none;
  transition:transform .15s cubic-bezier(.34,1.56,.64,1), filter .2s ease; }
.md-btn:hover{ transform:translateY(-2px); }
.md-btn:active{ transform:translateY(1px) scale(.99); }
.md-btn:focus-visible{ outline:2px solid var(--md-red); outline-offset:3px; }
.md-btn .md-btn-ico{ display:inline-flex; }
@media (max-width:576px){ .md-btn{ width:100%; } .md-btn.md-btn--auto{ width:auto; } }
```

- [ ] **Step 4: Verificar**

Abrir cualquier página tras enlazar (Task 2). Criterios: no errores de sintaxis CSS (DevTools),
variables disponibles. Visual real se valida al aplicar en páginas.

- [ ] **Step 5: Commit**

```bash
git add assets/css/styles.css
git commit -m "feat(css): sistema de diseño glass oscuro + tokens + botones"
```

---

## Task 2: Inyección del filtro SVG + helpers JS (toggle monedas, acordeón, ver-todos)

**Files:**
- Modify: `assets/js/custom.js` (añadir al final)

- [ ] **Step 1: Inyectar el filtro SVG una sola vez**

```js
// === MD REDESIGN ===
(function injectGlassFilter(){
  if (document.getElementById('md-glass-svg')) return;
  var ns='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(ns,'svg');
  svg.id='md-glass-svg'; svg.setAttribute('aria-hidden','true');
  svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML='<filter id="md-glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">'
    +'<feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="17" result="t"/>'
    +'<feGaussianBlur in="t" stdDeviation="2.2" result="m"/>'
    +'<feDisplacementMap in="SourceGraphic" in2="m" scale="48" xChannelSelector="R" yChannelSelector="G"/>'
    +'</filter>';
  document.body.appendChild(svg);
})();
```

- [ ] **Step 2: Toggle de monedas con localStorage (default USD)**

```js
(function currencyToggle(){
  var KEY='md-currency';
  function apply(cur){
    document.querySelectorAll('[data-usd]').forEach(function(n){
      var v=n.getAttribute('data-'+cur); if(v) n.textContent=v;
    });
    document.querySelectorAll('.md-cur-btn').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-cur')===cur);
    });
  }
  var saved=localStorage.getItem(KEY)||'usd';
  document.addEventListener('DOMContentLoaded', function(){
    if(!document.querySelector('.md-cur-btn')) return;
    apply(saved);
    document.querySelectorAll('.md-cur-btn').forEach(function(b){
      b.addEventListener('click', function(){
        var cur=b.getAttribute('data-cur'); localStorage.setItem(KEY,cur); apply(cur);
      });
    });
  });
})();
```

- [ ] **Step 3: Acordeón de servicios (mobile)**

```js
(function servicesAccordion(){
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.md-acc-item .md-acc-head').forEach(function(h){
      h.addEventListener('click', function(){
        var item=h.closest('.md-acc-item');
        var open=item.classList.contains('open');
        item.closest('.md-acc')?.querySelectorAll('.md-acc-item.open').forEach(function(i){i.classList.remove('open');});
        if(!open) item.classList.add('open');
      });
    });
  });
})();
```

- [ ] **Step 4: Verificar**

Abrir `index.html` en navegador → DevTools: confirmar que `#md-glass-distortion` existe en el DOM
y sin errores JS en consola.

- [ ] **Step 5: Commit**

```bash
git add assets/js/custom.js
git commit -m "feat(js): filtro SVG glass + toggle monedas + acordeón"
```

---

## Task 3: Header (menú + "Precios"), footer y teléfono global

**Files:** Modify: `index.html`, `about-us.html`, `projects.html`, `projects-detail.html`, `contact.html`, `privacy-policy.html`, `terms-and-conditions.html`, `blog-detail.html`

- [ ] **Step 1: Añadir ítem "Precios" al menú** (en cada `.header-menu`, tras "Servicios"):

```html
<li class="header-item">
  <a href="index.html#pricing" class="header-link hstack gap-2 fs-7 fw-bold text-dark"><img
      src="assets/images/svgs/secondary-leaf.svg" alt="" width="20" height="20"
      class="img-fluid animate-spin">Precios</a>
</li>
```

- [ ] **Step 2: Actualizar teléfono**
  - `index.html` y `contact.html`: `wa.me/573128555441` → `wa.me/573218431014`.
  - `privacy-policy.html`, `terms-and-conditions.html`, `blog-detail.html`: `tel:+1-212-456-7890` → `tel:+573218431014` y texto visible → `+57 321 8431014`.

- [ ] **Step 3: Verificar** Abrir cada página; menú muestra "Precios"; links de WhatsApp/tel apuntan al nuevo número.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: añadir Precios al menú y actualizar teléfono +57 321 8431014"
```

---

## Task 4: index.html — hero y secciones a tema oscuro + cristal

**Files:** Modify: `index.html`

- [ ] **Step 1:** Eliminar el `<style>` inline (líneas ~14-176) y mover lo aún necesario a `styles.css`. Quitar clases `btn-hero-custom`; los CTAs del hero usan `.md-btn` + `.md-glass--btn .md-glass--red` (primario) / cristal neutro.
- [ ] **Step 2:** Hero: envolver el bloque de título en una tarjeta `.md-glass` opcional; mantener `<video>`. Tipografía `md-fluid-h1`.
- [ ] **Step 3:** Secciones "Productos Destacados", "Sobre Motion Dreams", marquee, contacto: cambiar `bg-light-gray`/`bg-white` por tema oscuro; tarjetas de portafolio con `.md-glass`.
- [ ] **Step 4: Verificar** Abrir `index.html`: fondo oscuro coherente, cristal con refracción visible sobre el video/fondos, botones uniformes, hero legible en mobile (DevTools responsive 375px).
- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/styles.css
git commit -m "feat(index): hero y secciones a tema oscuro con cristal"
```

---

## Task 5: index.html — Servicios → acordeón glass (mobile) + tabs (desktop)

**Files:** Modify: `index.html`

- [ ] **Step 1:** Reestructurar la sección `#services`. En mobile, render acordeón:

```html
<div class="md-acc d-lg-none">
  <div class="md-acc-item md-glass open">
    <span class="mg-distort"></span><span class="mg-tint"></span><span class="mg-edge"></span>
    <div class="mg-content">
      <button class="md-acc-head">
        <span><small>01</small> Piezas para eventos</span><i class="md-acc-ico">+</i>
      </button>
      <div class="md-acc-body">
        <img src="assets/images/flyers/bannerEventos.jpg" class="img-fluid" alt="">
        <p>Flyers, posters y visuales para conciertos.</p>
        <a href="./projects.html" class="md-btn md-glass md-glass--btn md-glass--red">
          <span class="mg-distort"></span><span class="mg-tint"></span><span class="mg-edge"></span>
          <span class="mg-content">Ver proyectos ↗</span>
        </a>
      </div>
    </div>
  </div>
  <!-- repetir para 02 Redes sociales, 03 Animaciones & motion, 04 Marca & identidad -->
</div>
```

CSS de acordeón (añadir a styles.css):

```css
.md-acc{ display:flex; flex-direction:column; gap:12px; }
.md-acc-head{ width:100%; display:flex; align-items:center; justify-content:space-between;
  background:transparent; border:none; color:#fff; font-weight:700; padding:16px; cursor:pointer; }
.md-acc-body{ max-height:0; overflow:hidden; transition:max-height .35s ease; padding:0 16px; }
.md-acc-item.open .md-acc-body{ max-height:600px; padding-bottom:16px; }
.md-acc-ico{ transition:transform .3s; } .md-acc-item.open .md-acc-ico{ transform:rotate(45deg); }
```

- [ ] **Step 2:** Mantener los tabs existentes para desktop con `.d-none .d-lg-block`, reestilizados a oscuro/cristal.
- [ ] **Step 3: Verificar** DevTools 375px: tocar cada item expande/colapsa con imagen + CTA; desktop muestra tabs.
- [ ] **Step 4: Commit**

```bash
git add index.html assets/css/styles.css
git commit -m "feat(index): servicios acordeón glass mobile"
```

---

## Task 6: index.html — Precios + toggle de monedas

**Files:** Modify: `index.html`

- [ ] **Step 1:** Insertar el toggle sobre los planes:

```html
<div class="md-seg md-glass md-glass--ctrl mx-auto">
  <span class="mg-distort"></span><span class="mg-tint"></span><span class="mg-edge"></span>
  <div class="mg-content d-flex gap-1">
    <button class="md-cur-btn on" data-cur="usd">USD $</button>
    <button class="md-cur-btn" data-cur="cop">COP $</button>
    <button class="md-cur-btn" data-cur="eur">EUR €</button>
  </div>
</div>
```

CSS:

```css
.md-seg{ width:fit-content; padding:4px; }
.md-seg .md-cur-btn{ border:none; background:transparent; color:var(--md-text-dim);
  font-weight:700; font-size:.85rem; padding:8px 18px; border-radius:6px; cursor:pointer; }
.md-seg .md-cur-btn.on{ color:#fff; background:var(--md-red); box-shadow:0 5px 14px rgba(242,15,15,.45); }
```

- [ ] **Step 2:** En cada precio `<h3 class="mb-0">$60k</h3>` → añadir spans con data y default USD:

```html
<h3 class="mb-0"><span class="num" data-usd="$19" data-cop="$60k" data-eur="€19">$19</span></h3>
```

Aplicar la tabla del spec §4.1 a las 4 categorías (Flyers, Animados→Animaciones, Marca, Social).

- [ ] **Step 3:** Tarjetas de planes con `.md-glass`; la "Popular" con `.md-glass--red`; botones "Elegir plan" con `.md-btn` glass.
- [ ] **Step 4: Verificar** Togglear USD/COP/EUR cambia todos los precios; recarga recuerda la última (localStorage); default USD en primera visita (borrar localStorage para probar).
- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/styles.css
git commit -m "feat(index): precios glass con toggle de monedas"
```

---

## Task 7: projects.html — 4 categorías en cristal, tema oscuro

**Files:** Modify: `projects.html`

- [ ] **Step 1:** Reescribir las tarjetas a 4 categorías: **Flyers**, **Animaciones**, **Social Media**, **Diseño de Marca**. Cada `.portfolio` envuelta en `.md-glass`. Links:
  - Flyers → `projects-detail.html?project=flyers`
  - Animaciones → `projects-detail.html?project=animaciones`
  - Social Media → `projects-detail.html?project=social-media`
  - Diseño de Marca → `projects-detail.html?project=diseno-marca`
- [ ] **Step 2:** Tema oscuro en `.project` y footer; banner reestilizado.
- [ ] **Step 3: Verificar** 4 tarjetas con cristal; cada link abre el detalle correcto.
- [ ] **Step 4: Commit**

```bash
git add projects.html
git commit -m "feat(projects): 4 categorías glass (flyers unificado, animaciones)"
```

---

## Task 8: projects-detail.html — reorganizar projectsData + "Ver todos" + precios toggle

**Files:** Modify: `projects-detail.html`

- [ ] **Step 1: Reorganizar `projectsData`** (script al final del archivo):
  - **`flyers`**: unir gallery de `flyer-eventos` (Conciertos, Urbanos, Night clubs, Cantina) + un grupo **"Flyers Animados"** con los flyers animados actuales. Title "Flyers". Mantener su `pricing` (tabla Flyers del spec).
  - **`animaciones`**: grupos con nombres profesionales: Flyers Animados, Spots con Locución, Motion Esencial (con videos `motionBasic*`/`motionProfesional*`/`motionPremium*` distribuidos), y Branding en Movimiento / Comerciales-Ads / Motion Corporativo / Visuales para Eventos (VJ) marcados **"Próximamente"**. Pricing = tabla Animaciones.
  - `social-media` y `diseno-marca`: mantener; pricing según spec.
  - Alias: si `?project=flyer-eventos` o `flyers-animados` → mapear a `flyers`/`animaciones`.
- [ ] **Step 2:** En el render de cada galería, añadir botón **"Ver todos"**:

```html
<a class="md-btn md-glass md-glass--btn" href="gallery.html?cat=${slug}">
  <span class="mg-distort"></span><span class="mg-tint"></span><span class="mg-edge"></span>
  <span class="mg-content">Ver todos ↗</span></a>
```

- [ ] **Step 3:** Categorías "Próximamente": render de placeholder glass con etiqueta, sin lightbox.
- [ ] **Step 4:** Precios del detalle con toggle de monedas (reusar markup Task 6) y tarjetas glass.
- [ ] **Step 5: Verificar** `?project=flyers` muestra grupos unificados + "Flyers Animados"; `?project=animaciones` muestra grupos con "Próximamente"; "Ver todos" enlaza a `gallery.html?cat=...`; toggle de monedas funciona.
- [ ] **Step 6: Commit**

```bash
git add projects-detail.html
git commit -m "feat(detail): flyers unificado, animaciones, ver-todos, precios toggle"
```

---

## Task 9: gallery.html — galería por categoría (NUEVA)

**Files:** Create: `gallery.html`

- [ ] **Step 1:** Crear página con header/footer estándar (oscuro) y un contenedor `#galleryGrid`.
- [ ] **Step 2:** Script: leer `?cat=`, reutilizar los grupos de imágenes de `projectsData` (extraer a un archivo/script compartido `assets/js/gallery-data.js` para DRY, importado por `projects-detail.html` y `gallery.html`). Render: título de categoría + secciones por sub-grupo + grid masonry de cristal + filtros por grupo + lightbox existente.
- [ ] **Step 3:** Filtros: botones glass por sub-categoría que muestran/ocultan grupos.
- [ ] **Step 4: Verificar** `gallery.html?cat=flyers` lista todos los grupos de flyers; filtros funcionan; lightbox abre; mobile 1 columna.
- [ ] **Step 5: Commit**

```bash
git add gallery.html assets/js/gallery-data.js projects-detail.html
git commit -m "feat(gallery): galería ver-todos por categoría con filtros"
```

---

## Task 10: about-us.html — quitar "Conoce nuestro equipo" + tema oscuro

**Files:** Modify: `about-us.html`

- [ ] **Step 1:** Eliminar por completo la sección "Meet our team" / "Conoce nuestro equipo" (tarjeta de Miguel Diuza: foto + descripción), aprox. líneas 419-end de esa sección.
- [ ] **Step 2:** Reestilizar intro, stats, imagen `about-img.jpg` y marquee a tema oscuro/cristal.
- [ ] **Step 3: Verificar** No aparece el bloque de equipo; resto coherente y oscuro.
- [ ] **Step 4: Commit**

```bash
git add about-us.html
git commit -m "feat(about): quitar sección equipo y tema oscuro"
```

---

## Task 11: contact.html — tema oscuro + cristal + teléfono

**Files:** Modify: `contact.html`

- [ ] **Step 1:** Tema oscuro; tarjetas/formulario con cristal; botones `.md-btn`; WhatsApp ya actualizado en Task 3.
- [ ] **Step 2: Verificar** Formulario legible en mobile, contraste correcto, links sociales OK.
- [ ] **Step 3: Commit**

```bash
git add contact.html
git commit -m "feat(contact): tema oscuro y cristal"
```

---

## Task 12: Páginas secundarias — coherencia mínima

**Files:** Modify: `privacy-policy.html`, `terms-and-conditions.html`, `blog.html`, `blog-detail.html`, `404.html`, `sign-in.html`, `sign-up.html`

- [ ] **Step 1:** Aplicar tema oscuro base (header/footer/fondo) sin rediseño profundo; teléfono ya actualizado donde aplica.
- [ ] **Step 2: Verificar** Cada página carga sin secciones blancas rotas; header/footer coherentes.
- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: tema oscuro coherente en páginas secundarias"
```

---

## Task 13: Pase final — mobile, fallback y pulido

- [ ] **Step 1:** Revisar en DevTools 360/390/768px: touch targets ≥44px, sin overflow horizontal, tipografía fluida OK.
- [ ] **Step 2:** Probar fallback de cristal (simular sin `backdrop-filter`): superficies translúcidas sólidas, sin layout roto.
- [ ] **Step 3:** Revisar consola sin errores JS en todas las páginas; AOS y carruseles funcionan.
- [ ] **Step 4:** Quitar assets/CSS muertos del `<style>` inline migrado.
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: pulido mobile, fallback de cristal y limpieza"
```

---

## Self-review (cobertura del spec)

- §2 sistema visual → Task 1,2,5,6,8,9 ✓
- §3 menú/teléfono/tema → Task 3,4,10,11,12 ✓
- §4 monedas → Task 2,6,8 ✓
- §5 taxonomía (flyers unificado, animaciones, nombres, "Próximamente") → Task 7,8 ✓
- §6 "Ver todos" galerías → Task 8,9 ✓
- §7 cambios por página → Task 4-12 ✓
- §8 mobile → Task 5,13 ✓
- §2.5 rendimiento/Safari → Task 1 (fallback), Task 13 ✓
