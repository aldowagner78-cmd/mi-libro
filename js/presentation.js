/**
 * Módulo de Modo Presentación
 * Vista de diapositivas para presentaciones o lectura enfocada
 */

let presentationMode = false;
let presentationSlides = [];
let currentSlide = 0;

/**
 * Activa el modo presentación
 */
function startPresentation() {
    const content = document.getElementById('content');
    if (!content || content.innerHTML.trim() === '') {
        if (typeof showNotification === 'function') {
            showNotification('⚠️', 'Carga un capítulo primero para iniciar la presentación');
        }
        return;
    }

    // Preparar slides (cada párrafo es una slide)
    const elements = content.querySelectorAll('p, h1, h2, h3, blockquote');
    presentationSlides = [];

    elements.forEach(el => {
        const text = el.textContent.trim();
        if (text && text.length > 0) {
            presentationSlides.push({
                html: el.outerHTML,
                tag: el.tagName.toLowerCase()
            });
        }
    });

    if (presentationSlides.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('⚠️', 'No hay contenido para presentar');
        }
        return;
    }

    presentationMode = true;
    currentSlide = 0;

    // Mostrar modal de presentación
    const modal = document.getElementById('presentationModal');
    if (modal) {
        modal.classList.add('show');
        renderSlide();
        updateSlideCounter();
    }

    // Añadir listeners de teclado
    document.addEventListener('keydown', handlePresentationKeys);
}

/**
 * Cierra el modo presentación
 */
function endPresentation() {
    presentationMode = false;
    presentationSlides = [];
    currentSlide = 0;

    const modal = document.getElementById('presentationModal');
    if (modal) {
        modal.classList.remove('show');
    }

    document.removeEventListener('keydown', handlePresentationKeys);
}

/**
 * Renderiza la slide actual
 */
function renderSlide() {
    const slideContent = document.getElementById('slideContent');
    if (!slideContent || !presentationSlides[currentSlide]) return;

    const slide = presentationSlides[currentSlide];

    // Aplicar clase según tipo de elemento
    let slideClass = 'slide-paragraph';
    if (slide.tag === 'h1') slideClass = 'slide-title';
    if (slide.tag === 'h2') slideClass = 'slide-subtitle';
    if (slide.tag === 'h3') slideClass = 'slide-heading';
    if (slide.tag === 'blockquote') slideClass = 'slide-quote';

    slideContent.innerHTML = `<div class="${slideClass}">${slide.html}</div>`;
    slideContent.style.animation = 'none';
    slideContent.offsetHeight; // Trigger reflow
    slideContent.style.animation = 'slideIn 0.3s ease';
}

/**
 * Actualiza el contador de slides
 */
function updateSlideCounter() {
    const counter = document.getElementById('slideCounter');
    if (counter) {
        counter.textContent = `${currentSlide + 1} / ${presentationSlides.length}`;
    }

    // Actualizar progreso
    const progress = document.getElementById('slideProgress');
    if (progress) {
        const percent = ((currentSlide + 1) / presentationSlides.length) * 100;
        progress.style.width = `${percent}%`;
    }

    // Actualizar estado de botones
    const prevBtn = document.getElementById('slidePrev');
    const nextBtn = document.getElementById('slideNext');

    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === presentationSlides.length - 1;
}

/**
 * Navega a la siguiente slide
 */
function nextSlide() {
    if (currentSlide < presentationSlides.length - 1) {
        currentSlide++;
        renderSlide();
        updateSlideCounter();
    }
}

/**
 * Navega a la slide anterior
 */
function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        renderSlide();
        updateSlideCounter();
    }
}

/**
 * Salta a una slide específica
 */
function goToSlide(index) {
    if (index >= 0 && index < presentationSlides.length) {
        currentSlide = index;
        renderSlide();
        updateSlideCounter();
    }
}

/**
 * Maneja teclas en modo presentación
 */
function handlePresentationKeys(e) {
    if (!presentationMode) return;

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
            e.preventDefault();
            nextSlide();
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
            e.preventDefault();
            prevSlide();
            break;
        case 'Home':
            e.preventDefault();
            goToSlide(0);
            break;
        case 'End':
            e.preventDefault();
            goToSlide(presentationSlides.length - 1);
            break;
        case 'Escape':
            e.preventDefault();
            endPresentation();
            break;
    }
}

/**
 * Toggle pantalla completa
 */
function toggleFullscreen() {
    const modal = document.getElementById('presentationModal');
    if (!modal) return;

    if (!document.fullscreenElement) {
        modal.requestFullscreen().catch(err => {
            console.log('Error al activar pantalla completa:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Exportar funciones globales
window.startPresentation = startPresentation;
window.endPresentation = endPresentation;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goToSlide = goToSlide;
window.toggleFullscreen = toggleFullscreen;
