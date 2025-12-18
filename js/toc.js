/**
 * Módulo de Tabla de Contenidos
 * Muestra subtítulos dentro de cada capítulo para navegación rápida
 */

// Cache de tabla de contenidos por capítulo
let tocCache = {};

/**
 * Abre el panel de tabla de contenidos
 */
function openTOC() {
    const modal = document.getElementById('tocModal');
    if (modal) {
        buildTOC();
        modal.classList.add('show');
    }
}

/**
 * Cierra el panel de tabla de contenidos
 */
function closeTOC() {
    const modal = document.getElementById('tocModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Construye la tabla de contenidos del capítulo actual
 */
function buildTOC() {
    const container = document.getElementById('tocList');
    if (!container) return;

    const content = document.getElementById('content');
    if (!content) {
        container.innerHTML = '<p class="toc-empty">Carga un capítulo primero</p>';
        return;
    }

    // Buscar encabezados y párrafos relevantes
    const headings = content.querySelectorAll('h1, h2, h3, p strong:first-child');

    if (headings.length === 0) {
        container.innerHTML = '<p class="toc-empty">No hay secciones en este capítulo</p>';
        return;
    }

    let html = '<ul class="toc-list">';
    let sectionCount = 0;

    headings.forEach((el, index) => {
        let text = '';
        let level = 1;

        if (el.tagName === 'H1') {
            text = el.textContent.trim();
            level = 1;
        } else if (el.tagName === 'H2') {
            text = el.textContent.trim();
            level = 2;
        } else if (el.tagName === 'H3') {
            text = el.textContent.trim();
            level = 3;
        } else if (el.tagName === 'STRONG' && el.parentElement.tagName === 'P') {
            // Párrafos que empiezan con negrita pueden ser subtítulos
            text = el.textContent.trim();
            if (text.length > 50) return; // Ignorar si es muy largo
            level = 3;
        }

        if (text && text.length > 0) {
            // Añadir ID al elemento para navegación
            const id = `toc-section-${sectionCount}`;
            el.id = id;

            html += `
                <li class="toc-item toc-level-${level}" onclick="goToSection('${id}')">
                    <span class="toc-number">${sectionCount + 1}</span>
                    <span class="toc-text">${escapeHTML(text)}</span>
                </li>
            `;
            sectionCount++;
        }
    });

    html += '</ul>';

    if (sectionCount === 0) {
        container.innerHTML = '<p class="toc-empty">No hay secciones en este capítulo</p>';
    } else {
        container.innerHTML = html;
    }

    // Actualizar título del capítulo en el modal
    const chapterTitle = document.getElementById('chapterTitle');
    const tocTitle = document.getElementById('tocChapterTitle');
    if (chapterTitle && tocTitle) {
        tocTitle.textContent = chapterTitle.textContent;
    }
}

/**
 * Navega a una sección específica
 */
function goToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        closeTOC();

        // Scroll suave al elemento
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // Resaltar temporalmente la sección
        element.style.transition = 'background 0.3s';
        element.style.background = 'var(--accent-soft)';
        element.style.borderRadius = '4px';
        element.style.padding = '4px 8px';
        element.style.marginLeft = '-8px';

        setTimeout(() => {
            element.style.background = '';
            element.style.padding = '';
            element.style.marginLeft = '';
        }, 2000);
    }
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exportar funciones globales
window.openTOC = openTOC;
window.closeTOC = closeTOC;
window.goToSection = goToSection;
