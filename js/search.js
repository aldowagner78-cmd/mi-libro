/**
 * Módulo de Búsqueda Global
 * Permite buscar texto en todos los capítulos del libro
 */

// Cache de contenido para búsqueda más rápida
let searchCache = {};
let isSearchIndexed = false;

/**
 * Abre el modal de búsqueda
 */
function openSearch() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.add('show');
        const input = document.getElementById('searchInput');
        if (input) {
            input.value = '';
            input.focus();
        }
        clearSearchResults();
    }
}

/**
 * Cierra el modal de búsqueda
 */
function closeSearch() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Limpia los resultados de búsqueda
 */
function clearSearchResults() {
    const results = document.getElementById('searchResults');
    const stats = document.getElementById('searchStats');
    if (results) results.innerHTML = '';
    if (stats) stats.textContent = '';
}

/**
 * Indexa todos los capítulos para búsqueda rápida
 */
async function indexChapters() {
    if (isSearchIndexed) return;
    
    const FOLDER = 'capitulos_html';
    const TOTAL = 30;
    
    for (let i = 1; i <= TOTAL; i++) {
        const num = i.toString().padStart(2, '0');
        try {
            const response = await fetch(`${FOLDER}/Capitulo ${num}.html`);
            if (response.ok) {
                const html = await response.text();
                // Extraer solo el texto sin HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                searchCache[i] = {
                    chapter: i,
                    title: `Capítulo ${num}`,
                    content: tempDiv.textContent || tempDiv.innerText
                };
            }
        } catch (e) {
            console.warn(`No se pudo indexar capítulo ${i}:`, e);
        }
    }
    
    isSearchIndexed = true;
    console.log('✅ Índice de búsqueda creado');
}

/**
 * Realiza la búsqueda en todos los capítulos
 */
async function performSearch() {
    const input = document.getElementById('searchInput');
    const query = input ? input.value.trim().toLowerCase() : '';
    
    if (query.length < 2) {
        clearSearchResults();
        return;
    }
    
    // Indexar si no está hecho
    if (!isSearchIndexed) {
        showSearchLoading();
        await indexChapters();
    }
    
    const results = [];
    const maxContextLength = 150;
    
    for (const [chapter, data] of Object.entries(searchCache)) {
        const content = data.content.toLowerCase();
        let pos = 0;
        
        while ((pos = content.indexOf(query, pos)) !== -1) {
            // Extraer contexto alrededor de la coincidencia
            const start = Math.max(0, pos - maxContextLength / 2);
            const end = Math.min(content.length, pos + query.length + maxContextLength / 2);
            
            let context = data.content.substring(start, end);
            if (start > 0) context = '...' + context;
            if (end < content.length) context = context + '...';
            
            results.push({
                chapter: parseInt(chapter),
                title: data.title,
                text: context,
                position: pos
            });
            
            pos += query.length;
            
            // Limitar resultados por capítulo
            if (results.filter(r => r.chapter === parseInt(chapter)).length >= 3) break;
        }
    }
    
    displaySearchResults(results, query);
}

/**
 * Muestra indicador de carga
 */
function showSearchLoading() {
    const results = document.getElementById('searchResults');
    if (results) {
        results.innerHTML = `
            <div class="search-no-results">
                <div class="spinner"></div>
                <p style="margin-top: 12px;">Indexando capítulos...</p>
            </div>
        `;
    }
}

/**
 * Muestra los resultados de búsqueda
 */
function displaySearchResults(results, query) {
    const container = document.getElementById('searchResults');
    const stats = document.getElementById('searchStats');
    
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="search-no-results">
                <p>🔍 No se encontraron resultados para "<strong>${escapeHtml(query)}</strong>"</p>
            </div>
        `;
        if (stats) stats.textContent = '0 resultados';
        return;
    }
    
    // Agrupar por capítulo
    const grouped = {};
    results.forEach(r => {
        if (!grouped[r.chapter]) grouped[r.chapter] = [];
        grouped[r.chapter].push(r);
    });
    
    let html = '';
    for (const [chapter, items] of Object.entries(grouped)) {
        items.forEach((item, idx) => {
            // Resaltar el término de búsqueda
            const highlightedText = highlightSearchTerm(item.text, query);
            
            html += `
                <div class="search-result-item" onclick="goToSearchResult(${item.chapter})">
                    <div class="search-result-chapter">${item.title}</div>
                    <div class="search-result-text">${highlightedText}</div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
    
    const totalChapters = Object.keys(grouped).length;
    if (stats) {
        stats.textContent = `${results.length} resultado${results.length !== 1 ? 's' : ''} en ${totalChapters} capítulo${totalChapters !== 1 ? 's' : ''}`;
    }
}

/**
 * Resalta el término de búsqueda en el texto
 */
function highlightSearchTerm(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

/**
 * Escapa caracteres especiales para regex
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Navega al capítulo del resultado de búsqueda
 */
function goToSearchResult(chapter) {
    closeSearch();
    if (typeof loadChapter === 'function') {
        loadChapter(chapter);
    }
}

/**
 * Maneja el input de búsqueda con debounce
 */
let searchTimeout = null;
function handleSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Atajo de teclado Ctrl+F para búsqueda
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            openSearch();
        }
        if (e.key === 'Escape') {
            closeSearch();
        }
    });
});

// Exportar funciones globales
window.openSearch = openSearch;
window.closeSearch = closeSearch;
window.performSearch = performSearch;
window.handleSearchInput = handleSearchInput;
window.goToSearchResult = goToSearchResult;
