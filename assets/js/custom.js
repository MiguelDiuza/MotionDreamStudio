$(function () {

    // Header Scroll
    $(window).scroll(function () {
        if ($(window).scrollTop() >= 60) {
            $("header").addClass("fixed-header");
        } else {
            $("header").removeClass("fixed-header");
        }
    });


    // Featured Owl Carousel — en mobile NO se inicializa (se muestra como grid, todo visible)
    if (window.innerWidth < 992) {
        $('.featured-projects-slider').addClass('md-no-carousel');
    } else
    $('.featured-projects-slider .owl-carousel').owlCarousel({
        center: true,
        loop: true,
        margin: 30,
        nav: true,
        navText: [
            '<iconify-icon icon="lucide:chevron-left" class="fs-7"></iconify-icon>',
            '<iconify-icon icon="lucide:chevron-right" class="fs-7"></iconify-icon>'
        ],
        dots: false,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: false,
        mouseDrag: true,
        touchDrag: true,
        pullDrag: true,
        freeDrag: false,
        responsive: {
            0: {
                items: 1,
                margin: 0
            },
            600: {
                items: 2.5,
                margin: 20
            },
            1000: {
                items: 3
            },
            1200: {
                items: 4
            }
        }
    })


    // Count
    $('.count').each(function () {
        $(this).prop('Counter', 0).animate({
            Counter: $(this).text()
        }, {
            duration: 1000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });


    // ScrollToTop
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    const btn = document.getElementById("scrollToTopBtn");
    btn.addEventListener("click", scrollToTop);

    window.onscroll = function () {
        const btn = document.getElementById("scrollToTopBtn");
        if (document.documentElement.scrollTop > 100 || document.body.scrollTop > 100) {
            btn.style.display = "flex";
        } else {
            btn.style.display = "none";
        }
    };


    // Precios en mobile: animar desde los lados (no desde abajo)
    window.mdPricingAnim = function () {
        if (window.innerWidth > 575) return;
        document.querySelectorAll('.pricing-section .card[data-aos]').forEach(function (c, i) {
            c.setAttribute('data-aos', (i % 2) ? 'fade-left' : 'fade-right');
        });
    };
    window.mdPricingAnim();

    // Aos
    AOS.init({
        once: true,
    });


    // Dynamic Pricing System (Show/Hide Logic)
    function showPricingCategory(category) {
        // Hide all categories
        $('.pricing-category').addClass('d-none').removeClass('d-flex');

        // Show selected category with animation
        const selected = $(`#pricing-${category}`);
        selected.removeClass('d-none').addClass('d-flex');

        // Refresh CSS animations if libraries like AOS are used
        if (typeof AOS !== 'undefined') {
            setTimeout(() => AOS.refresh(), 100);
        }
    }

    // Handle product type selection
    $('.dropdown-item.product-type-option').on('click', function (e) {
        e.preventDefault();

        // Get data
        const productType = $(this).data('product');
        const productName = $(this).find('span.fw-bold').text();

        // Update Dropdown Text
        $('#selectedProductType').text(productName);

        // Update Active State in Dropdown
        $('.dropdown-item.product-type-option').removeClass('active');
        $(this).addClass('active');

        // Show corresponding pricing section
        showPricingCategory(productType);
    });

    // Initialize: Show default category (Flyers) loops ensure only one is visible
    // This runs on load to ensure correct state
    showPricingCategory('flyers');

    /* --- Lighbox & Examples Modal Logic --- */
    const modal = $('#custom-modal');
    const modalContent = modal.find('.modal-content-wrapper');

    // Data for pricing examples
    window.pricingExamples = {
        'flyer-individual': {
            title: 'Flyer Individual',
            desc: 'Impacto visual inmediato en una sola pieza. Incluye diseño personalizado con hasta 2 revisiones, optimización para redes sociales (Feed y Stories) y entrega de archivos en alta resolución (JPG/PNG). Ideal para lanzamientos rápidos o anuncios puntuales que requieren profesionalismo absoluto.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/im1.jpeg', label: 'Propuesta Personalizada' }
            ]
        },
        'flyer-paquete-4': {
            title: 'Paquete de 4 Flyers',
            desc: 'Mantén una estética coherente en todas tus promociones mensuales.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/im1.jpeg', label: 'Promoción #1', size: 'size-tall' },
                { type: 'image', src: '../assets/images/portfolio/im2.jpeg', label: 'Lanzamiento #2', size: 'size-tall' },
                { type: 'image', src: '../assets/images/portfolio/im3.png', label: 'Evento #3' },
                { type: 'image', src: '../assets/images/portfolio/fly.png', label: 'Preventa #4' }
            ]
        },
        'flyer-concierto': {
            title: 'Paquete Concierto',
            desc: 'Solución integral para eventos masivos: desde el mapa hasta el reel promocional.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/im1.jpeg', label: 'Flyer Principal', size: 'size-tall' },
                { type: 'image', src: '../assets/images/portfolio/fly.png', label: 'Mapa de ubicación' },
                { type: 'image', src: '../assets/images/portfolio/im3.png', label: 'Lista de servicios' },
                { type: 'image', src: '../assets/images/portfolio/im2.jpeg', label: 'Métodos de pago' }
            ]
        },
        'animado-basico': {
            title: 'Flyer Animado Básico',
            desc: 'Dale vida a tus diseños con movimientos sutiles y efectivos.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/im2.jpeg', label: 'Flyer Animado (Video)', size: 'size-tall' },
                { type: 'image', src: '../assets/images/portfolio/im1.jpeg', label: 'Versión Estática Incluida' }
            ]
        },
        'animado-profesional': {
            title: 'Flyer Animado Profesional',
            desc: 'Motion graphics avanzados para un impacto visual cinemático.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/im2.jpeg', label: 'Animación Avanzada', size: 'size-tall' },
                { type: 'image', src: '../assets/images/portfolio/portfolio-img-2.jpg', label: 'Versión Estática' }
            ]
        },
        'animado-premium': {
            title: 'Flyer Animado Premium',
            desc: 'Experiencia audiovisual completa con locución y máxima calidad.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/social.jpg', label: 'Reel Premium', size: 'size-large' },
                { type: 'image', src: '../assets/images/portfolio/im2.jpeg', label: 'Voz en Off / Locución', size: 'size-tall' },
                { type: 'image', src: '../assets/images/portfolio/im1.jpeg', label: 'Versión Estática' }
            ]
        },
        'diseno-marca-bronce': {
            title: 'Branding Bronce',
            desc: 'Sentamos las bases visuales de tu marca personal o negocio.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/marca.jpg', label: 'Diseño de Logo', size: 'size-large' }
            ]
        },
        'social-media-iniciante': {
            title: 'Social Media Iniciante',
            desc: 'Presencia profesional básica para tu marca personal o negocio. Incluye 1 carrusel estratégico y 2 diseños de historias activas.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/social.jpg', label: 'Carrusel Estratégico', size: 'size-large' },
                { type: 'image', src: '../assets/images/portfolio/im3.png', label: 'Diseño de Historia' },
                { type: 'image', src: '../assets/images/portfolio/im1.jpeg', label: 'Post de Feed' }
            ]
        },
        'social-media-intermedio': {
            title: 'Social Media Intermedio',
            desc: 'Aumenta tu impacto visual con contenido variado y profesional.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/social.jpg', label: 'Estrategia Visual', size: 'size-large' },
                { type: 'image', src: '../assets/images/portfolio/im2.jpeg', label: 'Post de Feed' },
                { type: 'image', src: '../assets/images/portfolio/im3.png', label: 'Historias' }
            ]
        },
        'social-media-recurrente': {
            title: 'Gestión Mensual',
            desc: 'Tu equipo de diseño dedicado para un crecimiento constante en redes sociales.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/social.jpg', label: 'Contenido Semanal', size: 'size-large' },
                { type: 'image', src: '../assets/images/portfolio/im1.jpeg', label: 'Piezas Gráficas' },
                { type: 'image', src: '../assets/images/portfolio/im3.png', label: 'Historias Diarias' }
            ]
        },
        'diseno-marca-plata': {
            title: 'Branding Plata',
            desc: 'Identidad completa para marcas en crecimiento.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/marca.jpg', label: 'Manual de Marca', size: 'size-large' },
                { type: 'image', src: '../assets/images/portfolio/portfolio-img-1.jpg', label: 'Papelería' }
            ]
        },
        'diseno-marca-oro': {
            title: 'Branding Oro',
            desc: 'Solución integral de branding para empresas.',
            items: [
                { type: 'image', src: '../assets/images/portfolio/marca.jpg', label: 'Estrategia Completa', size: 'size-large' },
                { type: 'image', src: '../assets/images/portfolio/portfolio-img-2.jpg', label: 'Video Branding' },
                { type: 'image', src: '../assets/images/portfolio/portfolio-img-3.jpg', label: 'Manual Corporativo' }
            ]
        }
    };

    function openModal(content) {
        modalContent.html(content);
        modal.addClass('active');
        $('body').addClass('modal-open-blur');
    }

    function closeModal() {
        modal.removeClass('active');
        $('body').removeClass('modal-open-blur');
        setTimeout(() => modalContent.empty(), 300);
    }

    // Expose to global scope for projects-detail.html
    window.openLightboxModal = openModal;
    window.closeLightboxModal = closeModal;

    // Lightbox for gallery images
    $(document).on('click', '.gallery-img, .portfolio-img img, .gallery-item-wrapper', function (e) {
        // Stop propagation to prevent potential conflicts
        e.stopPropagation();

        // Find the image source
        let img = $(this).is('img') ? $(this) : $(this).find('img');
        if (img.length === 0) return;

        const src = img.attr('src');
        if (!src) return;

        const content = `<img src="${src}" class="lightbox-img">`;
        openModal(content);
    });

    // Examples Modal for Pricing (Simplified - Single Horizontal Image)
    $(document).on('click', '.btn-view-examples', function (e) {
        e.preventDefault();
        const planId = $(this).data('plan');
        const data = window.pricingExamples[planId];

        if (data && data.items && data.items.length > 0) {
            // User requested to show only one image (horizontal/feature)
            // We take the first image from the set
            const item = data.items[0];
            const src = item.src;

            // Reusing the simple lightbox structure
            const content = `<img src="${src}" class="lightbox-img" alt="${data.title}">`;
            openModal(content);
        } else {
            // Fallback if no images
            const content = `<div class="text-white text-center p-5"><h3>${data ? data.title : 'Ejemplos'}</h3><p>Próximamente</p></div>`;
            openModal(content);
        }
    });

    // Close buttons
    modal.on('click', function (e) {
        if ($(e.target).hasClass('custom-modal-overlay') || $(e.target).closest('.modal-close').length) {
            closeModal();
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === "Escape") closeModal();
    });


    // EmailJS Configuration
    (function () {
        emailjs.init("f8tqC3UKNx_OrJjed"); // Public Key
    })();

    // Handle Contact Form Submission
    $('form').on('submit', function (e) {
        e.preventDefault();

        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.find('.btn-text').text();

        btn.prop('disabled', true);
        btn.find('.btn-text').text('Enviando...');

        const name = $(this).find('#name').val();
        const email = $(this).find('#email').val();
        const message = $(this).find('#message').val();
        const time = new Date().toLocaleString();

        const templateParams = {
            name: name,
            correo: email,
            mensaje: message,
            time: time
        };

        emailjs.send('service_tt2o7fl', 'template_amljm5k', templateParams)
            .then(function () {
                alert('¡Mensaje enviado con éxito!');
                $('form')[0].reset();
                btn.prop('disabled', false);
                btn.find('.btn-text').text(originalText);
            }, function (error) {
                alert('Error al enviar el mensaje: ' + JSON.stringify(error));
                btn.prop('disabled', false);
                btn.find('.btn-text').text(originalText);
            });
    });

    // Handle Preloader Hiding (oculta del todo, no bloquea la página)
    function hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader || preloader.classList.contains('fade-out')) return;
        preloader.classList.add('fade-out');
        preloader.style.pointerEvents = 'none';
        setTimeout(function () { preloader.style.display = 'none'; }, 600);
        if (typeof AOS !== 'undefined') setTimeout(function () { AOS.refresh(); }, 100);
    }

    // Reproducir el video del hero (best-effort, mobile)
    const heroVideo = $('.banner-section video')[0];
    if (heroVideo) {
        const startVideo = function () { heroVideo.play().catch(function () {}); };
        if (heroVideo.readyState >= 2) startVideo();
        else heroVideo.addEventListener('canplay', startVideo, { once: true });
    }

    // Preloader: SOLO en la primera carga de la sesión.
    // Al navegar entre páginas se oculta al instante (no reaparece).
    if (sessionStorage.getItem('md-loaded')) {
        hidePreloader();
    } else {
        sessionStorage.setItem('md-loaded', '1');
        $(window).on('load', function () { setTimeout(hidePreloader, 400); });
        // Cierre garantizado pase lo que pase con los recursos
        setTimeout(hidePreloader, 2500);
    }

});

/* ===================================================================
   === MD REDESIGN — filtro SVG glass + toggle monedas + acordeón ===
   =================================================================== */

// 0) Inyectar tipografía display (Space Grotesk) una sola vez
(function injectFont() {
    if (document.getElementById('md-font')) return;
    var pre1 = document.createElement('link'); pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
    var pre2 = document.createElement('link'); pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = 'anonymous';
    var l = document.createElement('link'); l.id = 'md-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(pre1); document.head.appendChild(pre2); document.head.appendChild(l);
})();

// 1) Inyectar el filtro SVG de refracción una sola vez
(function injectGlassFilter() {
    function inject() {
        if (document.getElementById('md-glass-svg')) return;
        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg');
        svg.id = 'md-glass-svg';
        svg.setAttribute('aria-hidden', 'true');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        svg.innerHTML =
            '<filter id="md-glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">' +
            '<feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="17" result="t"/>' +
            '<feGaussianBlur in="t" stdDeviation="2.2" result="m"/>' +
            '<feDisplacementMap in="SourceGraphic" in2="m" scale="48" xChannelSelector="R" yChannelSelector="G"/>' +
            '</filter>';
        document.body.appendChild(svg);
    }
    if (document.body) inject();
    else document.addEventListener('DOMContentLoaded', inject);
})();

// 3) Acordeón de servicios (mobile)
(function servicesAccordion() {
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.md-acc-item .md-acc-head').forEach(function (h) {
            h.addEventListener('click', function () {
                var item = h.closest('.md-acc-item');
                var acc = item.closest('.md-acc');
                var isOpen = item.classList.contains('open');
                if (acc) acc.querySelectorAll('.md-acc-item.open').forEach(function (i) { i.classList.remove('open'); });
                if (!isOpen) item.classList.add('open');
            });
        });
    });
})();
