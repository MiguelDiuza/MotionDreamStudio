# 🎬 Motion Dreams Studio

<div align="center">

![Motion Dreams](https://img.shields.io/badge/Motion-Dreams-F20F0F?style=for-the-badge)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

**Estudio creativo especializado en diseño gráfico, motion graphics y producción audiovisual**

[🌐 Ver Sitio Web](https://migueldiuza.github.io/MotionDreamStudio/) • [📧 Contacto](mailto:creatik.motion@gmail.com) • [📸 Instagram](https://www.instagram.com/motion_dreams.co/)

</div>

---

## 📋 Tabla de Contenidos

- [Sobre el Proyecto](#-sobre-el-proyecto)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Inicio Rápido](#-inicio-rápido)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#️-scripts-disponibles)
- [Servicios](#-servicios)
- [Despliegue](#-despliegue)
- [Contacto](#-contacto)

---

## 🎯 Sobre el Proyecto

Motion Dreams Studio es un portafolio web profesional que muestra nuestros servicios de diseño gráfico y producción audiovisual. El sitio está construido con tecnologías modernas y optimizado para ofrecer una experiencia de usuario excepcional.

### ✨ Características Principales

- 🎨 **Diseño Moderno y Responsivo**: Interfaz adaptable a todos los dispositivos
- ⚡ **Rendimiento Optimizado**: Carga rápida y navegación fluida
- 🎭 **Animaciones Suaves**: Efectos visuales con AOS (Animate On Scroll)
- 📱 **Mobile First**: Diseñado primero para dispositivos móviles
- 🎪 **Carruseles Interactivos**: Galerías de proyectos con Owl Carousel
- 📧 **Formularios de Contacto**: Integración con redes sociales
- 🎬 **Lightbox para Medios**: Visualización de imágenes y videos en modal

---

## 🛠️ Tecnologías

### Frontend
- **HTML5** - Estructura semántica
- **CSS3/SCSS** - Estilos personalizados con preprocesador
- **JavaScript (ES6+)** - Interactividad y funcionalidad
- **Bootstrap 5.3** - Framework CSS responsivo

### Librerías y Plugins
- **AOS (Animate On Scroll)** - Animaciones al hacer scroll
- **Owl Carousel 2** - Carruseles de contenido
- **Iconify** - Sistema de iconos
- **jQuery** - Manipulación del DOM

### Herramientas de Desarrollo
- **Node.js & NPM** - Gestión de dependencias
- **SASS** - Preprocesador CSS
- **Browser-sync** - Servidor de desarrollo con live reload
- **Git** - Control de versiones

---

## 🚀 Inicio Rápido

### Prerequisitos

Asegúrate de tener instalado:
- [Node.js](https://nodejs.org/) (v14 o superior)
- [Git](https://git-scm.com/)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/MiguelDiuza/MotionDreamStudio.git
   cd MotionDreamStudio
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```
   
   El sitio se abrirá automáticamente en `http://localhost:3000`

---

## 🖼️ Galería administrable (Supabase)

Las imágenes y vídeos de la galería se gestionan desde `admin.html` (subir, ordenar, ocultar, mover, borrar),
guardados en Supabase. Puesta en marcha y uso: [`supabase/README.md`](supabase/README.md).
Sin configurar, la web usa los datos locales de `assets/js/gallery-data.js`.

---

## 📁 Estructura del Proyecto

```
motion_dreamStudio/
├── src/
│   ├── html/                    # Páginas HTML
│   │   ├── index.html          # Página principal
│   │   ├── about-us.html       # Sobre nosotros
│   │   ├── projects.html       # Portafolio de proyectos
│   │   ├── projects-detail.html # Detalle de proyectos
│   │   ├── contact.html        # Página de contacto
│   │   ├── gallery.html        # Galería completa por categoría
│   │   └── admin.html          # Panel de la galería (Supabase)
│   │
│   ├── assets/
│   │   ├── scss/               # Archivos fuente SASS
│   │   │   ├── styles.scss     # Archivo principal
│   │   │   └── components/     # Componentes parciales
│   │   │
│   │   ├── css/                # CSS compilado
│   │   │   └── styles.css      # ⚠️ No editar (auto-generado)
│   │   │
│   │   ├── js/                 # JavaScript personalizado
│   │   │   └── custom.js       # Scripts principales
│   │   │
│   │   ├── images/             # Recursos gráficos
│   │   │   ├── flyers/         # Galería de flyers
│   │   │   ├── logos/          # Logos y branding
│   │   │   ├── portfolio/      # Imágenes de portafolio
│   │   │   └── backgrounds/    # Fondos y banners
│   │   │
│   │   └── libs/               # Librerías externas
│   │       ├── bootstrap/      # Bootstrap 5.3
│   │       ├── aos-master/     # Animate On Scroll
│   │       └── owl.carousel/   # Owl Carousel
│   │
├── node_modules/               # Dependencias (no versionar)
├── package.json                # Configuración NPM
├── .gitignore                  # Archivos ignorados por Git
└── README.md                   # Este archivo
```

---

## 🛠️ Scripts Disponibles

### Desarrollo

```bash
# Iniciar servidor de desarrollo con live reload
npm run dev

# Compilar SCSS a CSS manualmente
npm run build:css

# Watch mode para SCSS (compilación automática)
npm run watch:css
```

### Producción

```bash
# Construir versión optimizada para producción
npm run build

# Limpiar archivos de compilación
npm run clean
```

---

## 🎨 Servicios

### Diseño Gráfico
- **Flyers para Eventos** - Diseños impactantes para conciertos, fiestas y eventos corporativos
- **Flyers Personalizados** - Adaptados a cualquier necesidad comercial o personal
- **Social Media** - Contenido visual estratégico para redes sociales
- **Diseño de Marca** - Identidad visual completa

### Motion Graphics
- **Flyers Animados** - Animaciones básicas, profesionales y premium
- **Video Reels** - Contenido dinámico para Instagram y TikTok
- **Cuñas Profesionales** - Locuciones y efectos de sonido

### Paquetes Especiales
- **Paquete Concierto** - Solución completa para eventos masivos
- **Gestión Mensual** - Contenido recurrente para tu marca

---

## 🚀 Despliegue

### GitHub Pages

El sitio está configurado para desplegarse automáticamente en GitHub Pages:

1. **Rama principal**: `main` - Código fuente
2. **Rama de despliegue**: `gh-pages` - Sitio publicado

**URL del sitio**: [https://migueldiuza.github.io/MotionDreamStudio/](https://migueldiuza.github.io/MotionDreamStudio/)

### Configuración de GitHub Pages

1. Ve a **Settings** → **Pages**
2. Selecciona la rama `gh-pages`
3. Carpeta: `/` (root)
4. Guarda los cambios

### Actualizar el sitio publicado

```bash
# Hacer cambios en la rama main
git add .
git commit -m "Descripción de cambios"
git push origin main

# Actualizar gh-pages
git checkout gh-pages
git merge main
git push origin gh-pages
git checkout main
```

---

## 📞 Contacto

### Motion Dreams Studio

- **Email**: [creatik.motion@gmail.com](mailto:creatik.motion@gmail.com)
- **Instagram**: [@motion_dreams.co](https://www.instagram.com/motion_dreams.co/)
- **Behance**: [Portafolio de Diseño](https://www.behance.net/gallery/168997485/Diseno-de-Flyers)
- **WhatsApp**: [+57 312 855 5441](https://wa.me/573128555441)

---

## 📝 Notas Importantes

### Edición de Estilos

⚠️ **IMPORTANTE**: No edites directamente `src/assets/css/styles.css`

Este archivo se genera automáticamente desde los archivos SCSS. Para modificar estilos:

1. Edita los archivos en `src/assets/scss/`
2. El compilador generará automáticamente el CSS
3. Los cambios se reflejarán en tiempo real con `npm run dev`

### Estructura de Colores

El proyecto utiliza una paleta de colores personalizada:

- **Primary**: `#F20F0F` (Rojo Motion Dreams)
- **Dark**: `#0b1215` (Fondo oscuro)
- **Light**: `#f6f6f6` (Fondo claro)

### Fuentes

- **Principal**: Inter (Google Fonts)
- **Alternativa**: System fonts

---

## 🤝 Contribuciones

Este es un proyecto privado de Motion Dreams Studio. Para colaboraciones o consultas, contacta a través de nuestros canales oficiales.

---

## 📄 Licencia

© 2025 Motion Dreams Studio. Todos los derechos reservados.

---

<div align="center">

**Hecho con ❤️ por Motion Dreams Studio**

[⬆ Volver arriba](#-motion-dreams-studio)

</div>