# Galería administrable con Supabase

El panel `admin.html` permite subir, ordenar, ocultar, mover y borrar las imágenes y
vídeos de la galería sin tocar código. Los ficheros se guardan en **Supabase Storage**
y la lista en una base de datos de **Supabase**. La web (GitHub Pages) los lee de ahí.

Mientras Supabase no esté configurado, la web sigue funcionando con los datos locales
de `assets/js/gallery-data.js`. Si Supabase falla o tarda más de 6 s, también vuelve a
esos datos automáticamente.

## Qué gestiona el panel

| Sí | No (siguen en el repo) |
|---|---|
| Grupos e ítems de las 4 categorías (Flyers, Animaciones, Social Media, Diseño de Marca) | Banners de cabecera, portadas de `index.html` / `projects.html` |
| Lo que se ve en `gallery.html` y en los carruseles de `projects-detail.html` | Textos y descripciones de las páginas |

## Puesta en marcha (una sola vez, ~15 min)

### 1. Crear el proyecto
1. Entra en <https://supabase.com> → **New project**.
2. Región: la más cercana a tus clientes (p. ej. *East US*). Guarda la contraseña de la base de datos en un gestor de contraseñas.

### 2. Crear tablas, permisos y bucket
1. **SQL Editor → New query**.
2. Pega todo el contenido de [`schema.sql`](schema.sql) y pulsa **Run**.
   Crea las tablas, las reglas de seguridad (RLS), el bucket `gallery` (público, máx. 50 MB
   por fichero, solo imágenes y vídeos) y las 4 categorías. Se puede volver a ejecutar sin problema.

### 3. Cerrar el registro público
**Authentication → Sign In / Providers**: deja *Email* activado y **desactiva
"Allow new users to sign up"**. (Aunque alguien se registrara, no podría tocar nada sin
estar en la lista de admins, pero así ni siquiera puede crear cuenta.)

### 4. Crear tu usuario y hacerlo admin
1. **Authentication → Users → Add user → Create new user**: email + contraseña, marca *Auto Confirm User*.
2. En **SQL Editor** ejecuta (con tu email):
   ```sql
   insert into public.gallery_admins (user_id)
   select id from auth.users where email = 'tu@correo.com';
   ```
   Repite el paso 4 para cada persona del equipo que deba usar el panel.
   Para quitarle el acceso a alguien: `delete from public.gallery_admins where user_id = (select id from auth.users where email = '...');`

### 5. Conectar la web
En **Project Settings → API** copia:
- **Project URL**
- **anon public** (o *publishable*) key

y pégalos en [`assets/js/md-config.js`](../assets/js/md-config.js):
```js
window.MD_SUPABASE = {
  url: 'https://xxxx.supabase.co',
  anonKey: 'eyJ...',
  bucket: 'gallery'
};
```
> La anon key es **pública** (va en el navegador; la seguridad la dan las reglas RLS).
> La **service_role / secret key** NO se pone nunca en el código ni se sube a GitHub.

### 6. Pasar la galería actual a Supabase
Desde la carpeta del proyecto, en PowerShell:
```powershell
# 1) Ver qué haría, sin tocar nada
node scripts/migrate-to-supabase.mjs --dry-run

# 2) Migrar de verdad (sube ~300 MB, tarda unos minutos)
$env:MD_ADMIN_EMAIL="tu@correo.com"; $env:MD_ADMIN_PASSWORD="tu-contraseña"
node scripts/migrate-to-supabase.mjs
Remove-Item Env:MD_ADMIN_PASSWORD
```
- Usa tu usuario admin, no ninguna clave secreta.
- Se niega a ejecutarse dos veces (para no duplicar). `--force` lo obliga.
- `--keep-local` registra los ficheros sin subirlos (siguen sirviéndose desde el repo).

### 7. Probar y publicar
1. `npm run serve` y abre `http://localhost:3000/admin.html` → entra con tu usuario.
2. Abre `gallery.html` y `projects-detail.html?project=flyers`: deben verse igual que antes.
3. Commit de `assets/js/md-config.js` y push. El panel quedará en
   `https://<tu-dominio>/admin.html` (no está enlazado desde la web y tiene `noindex`).

## Uso diario del panel
- **Subir**: arrastra ficheros a la zona punteada del grupo (o haz clic). Varios a la vez.
- **Ordenar**: flechas ← → en cada archivo; ↑ ↓ en cada grupo.
- **Ocultar** (ojo): desaparece de la web pero no se borra.
- **Mover a…**: cambia el archivo de grupo o de categoría.
- **Horizontal**: el grupo se muestra en carrusel 16:9 (para vídeos apaisados).
- **Borrar grupo**: solo si está vacío. Un grupo vacío aparece como "Próximamente".
- Los cambios se ven en la web al recargar; no hace falta commit.

## Límites del plan gratuito (a vigilar)
- 1 GB de almacenamiento y **5 GB de descarga al mes**. Los vídeos son lo que más gasta.
- Máx. 50 MB por archivo (lo impone el bucket).
- Recomendado: exportar vídeos en **1080p H.264, ~5–10 MB** (p. ej. HandBrake, preset
  *Fast 1080p30*) e imágenes a **≤ 2000 px en JPG/WEBP**. El panel no las comprime.
- Los proyectos gratuitos se **pausan tras 1 semana sin actividad** en la base de datos;
  con visitas a la web no debería pasar, y si pasa la web usa los datos locales.

## Problemas frecuentes
| Síntoma | Causa |
|---|---|
| El panel dice "Falta configurar Supabase" | `md-config.js` sin `url`/`anonKey` |
| "Sin permiso" tras entrar | Falta el paso 4.2 para ese usuario |
| Error `new row violates row-level security` | El usuario no está en `gallery_admins` |
| Error `mime type ... is not supported` | Formato no permitido (usa JPG, PNG, WEBP, GIF, MP4 o WEBM) |
| La web muestra la galería antigua | Mira la consola del navegador: `[galeria] Supabase no disponible…` indica el motivo |

## Ficheros
- `supabase/schema.sql`: tablas, RLS, bucket y categorías.
- `assets/js/md-config.js`: URL y anon key.
- `assets/js/gallery-source.js`: lectura de la galería (Supabase → respaldo local).
- `assets/js/gallery-data.js`: datos locales de respaldo.
- `admin.html` + `assets/js/admin.js`: panel.
- `scripts/migrate-to-supabase.mjs`: migración inicial.
