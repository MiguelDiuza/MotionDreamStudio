# Rediseño Motion Dreams — Diseño / Spec

**Fecha:** 2026-06-07
**Stack:** HTML estático + Bootstrap 5 + JS vanilla + AOS + Owl Carousel. **No** se migra a React/Tailwind/shadcn.

## 1. Objetivo

Modernizar el sitio de Motion Dreams (estudio de diseño y motion) hacia una experiencia
oscura, premium y "menos lineal", con glassmorphism realista estilo Apple, prioridad mobile,
botones y escalado estandarizados, selector de monedas en los planes, y una reorganización
del portafolio (unificación de flyers + galerías "Ver todos" por categoría).

Se mantiene la paleta: **rojo `#F20F0F` + negro/oscuro `#1F2A2E`**.

## 2. Sistema de diseño visual

### 2.1 Tokens (en `assets/css/styles.css` como `:root`)
- Colores: `--md-red:#F20F0F`, `--md-dark:#1F2A2E`, `--md-ink:#07090a` (fondo base casi negro),
  blancos translúcidos para texto/superficies.
- Radios estilo macOS: `--r-card:12px`, `--r-btn:9px`, `--r-ctrl:8px`, `--r-img:8px`, `--r-pill:999px` (solo badges).
- Tipografía fluida con `clamp()` para escalar mobile→desktop de forma uniforme.
- Sombras de profundidad en 2 niveles + glow rojo reutilizable.

### 2.2 Cristal "Apple" (refracción real) — primitiva reutilizable
Portado del componente `liquid-glass` (técnica, no el código React):
- **Un filtro SVG** `#md-glass-distortion` (`feTurbulence` + `feGaussianBlur` + `feDisplacementMap`)
  inyectado una sola vez vía `custom.js` al cargar el DOM (evita duplicarlo en cada HTML).
- Clase `.md-glass` con sub-capas:
  - capa distorsión: `backdrop-filter: blur(3px); filter:url(#md-glass-distortion)`
  - capa tinte: `rgba(255,255,255,.09–.10)` (variante roja: `rgba(242,15,15,.16–.55)`)
  - **borde hairline sutil** (aprobado): `inset 0 0 0 0.5px rgba(255,255,255,.12), inset 0 1px 0 rgba(255,255,255,.22)`
  - contenido en `z-index:3`
- Variantes: `.md-glass--red` (CTAs), `.md-glass--card`, `.md-glass--btn`, `.md-glass--ctrl`.

### 2.3 Botones (estandarización total)
- **Todos** los botones usan la primitiva de cristal Apple (no metal, no WebGL).
  - Primario/CTA: cristal tintado rojo (`.md-glass--red`).
  - Secundario: cristal oscuro/neutro.
- Un único sistema: misma altura, padding, `--r-btn:9px` (rounded-rect, no píldora), tamaño de
  ícono, y estados hover/active/focus consistentes en todo el sitio y mobile (touch ≥44px).
- Se eliminan `btn-hero-custom` y los `!important`/estilos sueltos del `<style>` inline de `index.html`.

### 2.4 Movimiento
AOS para entradas + micro-interacciones limpias (hover lift, press, transición de cristal).
Animaciones discretas y elegantes, sin exceso.

### 2.5 Rendimiento y compatibilidad
- El cristal usa `backdrop-filter` + filtro SVG: óptimo en Chrome/Edge/Firefox.
- **Fallback Safari/no-soporte:** `@supports not (backdrop-filter: blur(1px))` → cristal degradado a
  superficie sólida translúcida (`rgba` + borde sutil), sin romper layout.
- Limitar nº de capas de cristal animadas simultáneas; reusar una sola definición de filtro.
- Mantener el fix de autoplay de video mobile ya existente.

## 3. Cambios globales (todas las páginas)

### 3.1 Menú hamburguesa
- Añadir ítem **"Precios"** (ancla `index.html#pricing`) en el menú de todas las páginas.
- Reestilizar el dropdown con cristal oscuro.

### 3.2 Teléfono / contacto → nuevo número **+57 321 8431014**
- `wa.me/573128555441` → `wa.me/573218431014` (en `index.html` y `contact.html`).
- `tel:+1-212-456-7890` → `tel:+573218431014` (en `privacy-policy.html`, `terms-and-conditions.html`, `blog-detail.html`).
- Mantener email `creatik.motion@gmail.com`, Instagram y Behance.

### 3.3 Tema oscuro global
Header, footer y secciones migran al fondo oscuro con superficies de cristal. Secciones hoy
claras (`bg-light-gray`, `bg-white`) pasan a oscuro coherente.

## 4. Sistema de monedas (planes)

- **Default visible: USD.** Toggle segmentado de cristal `USD | COP | EUR` (activo en rojo) encima de los planes.
- Regla: **COP fijo**; USD/EUR ≈ conversión +~20% redondeada (ratio calibrado a 60k→19); **1 € = 1 $** (mismo número, símbolo distinto).
- Implementación: precios en `data-usd` / `data-cop` / `data-eur` en cada `.num`; JS cambia el
  texto al togglear. Preferencia recordada con `localStorage` (default USD si no hay).

### 4.1 Tabla de precios (a confirmar el redondeo)

| Categoría | Plan | COP | USD/EUR |
|---|---|---|---|
| Flyers | Individual | $60k | $19 |
| Flyers | Paquete de 4 | $200k | $63 |
| Flyers | Paquete Concierto | $480k | $152 |
| Animaciones | Básico | $100k | $32 |
| Animaciones | Profesional | $150k | $48 |
| Animaciones | Premium | $200k | $63 |
| Diseño de Marca | Bronce | $450k | $143 |
| Diseño de Marca | Plata | $850k | $270 |
| Diseño de Marca | Oro | $1.5M | $475 |
| Social Media | Iniciante | $60k | $19 |
| Social Media | Intermedio | $200k | $63 |
| Social Media | Recurrente Mensual | $350k | $110 |

## 5. Taxonomía del portafolio (4 categorías top-level)

`projects-detail.html` usa un objeto JS `projectsData` por slug (title, gallery por grupos, pricing).
Se reorganiza así:

1. **Flyers** = unión de `flyers` + `flyer-eventos`. Sub-galerías:
   Conciertos y Festivales · Flyers Urbanos · Night Clubs · Cantina · **Flyers Animados**
   (lo que hoy es el contenido de `flyers-animados`, como categoría dentro de Flyers).
2. **Animaciones** (renombre de "flyers animados", ampliado). Sub-categorías con nombres profesionales (aprobados):
   - Flyers Animados
   - Spots con Locución (antes "animación con cuña")
   - Motion Esencial (antes "animación sencilla")
   - Branding en Movimiento *(nueva — "Próximamente")*
   - Comerciales / Ads *(nueva — "Próximamente")*
   - Motion Corporativo *(nueva — "Próximamente")*
   - Visuales para Eventos (VJ) *(nueva — "Próximamente")*
   - Assets de video disponibles (~13): `motionBasic1–4`, `motionProfesional1–4`, `motionPremium1,2,4,5`, `motiomPremium3`.
     Las categorías sin material se muestran con estado elegante **"Próximamente"**.
3. **Social Media** (se mantiene).
4. **Diseño de Marca** (se mantiene).

`projects.html` muestra estas 4 categorías como tarjetas de cristal. Se eliminan/redirigen los
slugs viejos `flyers`, `flyer-eventos`, `flyers-animados` hacia la nueva estructura (`flyers`, `animaciones`).

## 6. Galería "Ver todos" (por categoría)

- En el detalle de cada proyecto, la mini-galería (carrusel) tiene un botón **"Ver todos"**.
- "Ver todos" abre una **galería completa de esa categoría** (página dedicada dentro del flujo de proyectos),
  agrupada por sub-categorías, con filtros por grupo. Una galería por: Flyers, Animaciones, Social Media, Diseño de Marca.
- Implementación: `gallery.html?cat=flyers` (etc.), reutilizando los datos de grupos de `projectsData`
  para no duplicar listas de imágenes. Layout masonry/grid de cristal, lightbox existente reutilizado.

## 7. Cambios por página

- **index.html:** hero (mantiene video) con tarjeta glass; portafolio carrusel; "Sobre Motion Dreams";
  **Servicios → acordeón glass en mobile** (cards apilables expandibles con imagen + CTA; en desktop se
  mantiene/mejora el patrón de tabs); marquee de logos; **precios con toggle de monedas**; contacto; footer.
  Eliminar `<style>` inline y mover a `styles.css`.
- **projects.html:** grid de 4 categorías en cristal, oscuro.
- **projects-detail.html:** `projectsData` reorganizado (Flyers unificado, Animaciones), botón "Ver todos"
  en cada galería, precios con toggle, todo en cristal.
- **gallery.html (NUEVA):** galería por categoría agrupada + filtros + lightbox.
- **about-us.html:** **eliminar la sección "Conoce nuestro equipo"** (tarjeta de Miguel Diuza: foto + descripción).
  El resto (intro, stats, imagen `about-img.jpg`, marquee) se mantiene y se reestiliza a oscuro/cristal.
- **contact.html:** nuevo número, tema oscuro/cristal, formulario reestilizado.
- **privacy / terms / blog / 404 / sign-in / sign-up:** actualizar teléfono donde aplique y tema oscuro coherente (mínimo).

## 8. Mobile (prioridad)
- Mobile-first en todas las secciones; tipografía fluida; touch targets ≥44px.
- Servicios = **acordeón glass** (decisión aprobada).
- Carruseles con swipe; toggle de monedas accesible y visible; menús y CTAs cómodos al pulgar.

## 9. Fuera de alcance / abierto
- No se migra a React/Tailwind.
- Categorías de Animaciones sin assets → "Próximamente" (no se inventan videos).
- Redondeo exacto de USD/EUR: a confirmar en revisión.
- Backend del formulario de contacto: sin cambios (sigue como está).

## 10. Archivos afectados (resumen)
- `assets/css/styles.css` — sistema glass, tokens, botones, tema oscuro, acordeón, toggle, responsive.
- `assets/js/custom.js` — inyección del filtro SVG, lógica del toggle de monedas (+localStorage), acordeón, "Ver todos".
- `index.html`, `projects.html`, `projects-detail.html`, `about-us.html`, `contact.html` — estructura/tema.
- `gallery.html` — nueva.
- `privacy-policy.html`, `terms-and-conditions.html`, `blog-detail.html` — teléfono.
