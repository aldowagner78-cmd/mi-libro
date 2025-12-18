/**
 * Módulo de Diccionario Integrado
 * Permite buscar definiciones de palabras seleccionadas
 */

// API de diccionario (usando DictionaryAPI.dev - gratis, sin API key)
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries';

/**
 * Busca la definición de una palabra
 */
async function lookupWord(word) {
    if (!word || word.length < 2) return null;

    // Limpiar la palabra
    const cleanWord = word.toLowerCase().trim().replace(/[^a-záéíóúñü]/gi, '');

    if (cleanWord.length < 2) return null;

    try {
        // Intentar primero en español
        let response = await fetch(`${DICTIONARY_API}/es/${cleanWord}`);

        if (!response.ok) {
            // Si no encuentra en español, intentar en inglés
            response = await fetch(`${DICTIONARY_API}/en/${cleanWord}`);
        }

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return formatDictionaryResult(data[0]);

    } catch (error) {
        console.error('Error buscando definición:', error);
        return null;
    }
}

/**
 * Formatea el resultado del diccionario
 */
function formatDictionaryResult(entry) {
    if (!entry) return null;

    const result = {
        word: entry.word,
        phonetic: entry.phonetic || '',
        meanings: []
    };

    if (entry.meanings) {
        entry.meanings.forEach(meaning => {
            const def = {
                partOfSpeech: meaning.partOfSpeech,
                definitions: []
            };

            if (meaning.definitions) {
                meaning.definitions.slice(0, 3).forEach(d => {
                    def.definitions.push({
                        definition: d.definition,
                        example: d.example || null
                    });
                });
            }

            result.meanings.push(def);
        });
    }

    return result;
}

/**
 * Muestra el popup del diccionario
 */
function showDictionaryPopup(word, x, y) {
    const popup = document.getElementById('dictionaryPopup');
    if (!popup) return;

    // Mostrar loading
    popup.innerHTML = `
        <div class="dict-loading">
            <div class="spinner"></div>
            <span>Buscando "${word}"...</span>
        </div>
    `;

    // Posicionar popup
    popup.style.left = `${Math.min(x, window.innerWidth - 350)}px`;
    popup.style.top = `${Math.min(y + 20, window.innerHeight - 300)}px`;
    popup.classList.add('show');

    // Buscar definición
    lookupWord(word).then(result => {
        if (result) {
            renderDictionaryResult(result);
        } else {
            popup.innerHTML = `
                <div class="dict-not-found">
                    <span>📖</span>
                    <p>No se encontró definición para "<strong>${escapeHtml(word)}</strong>"</p>
                </div>
            `;
        }
    });
}

/**
 * Renderiza el resultado del diccionario
 */
function renderDictionaryResult(result) {
    const popup = document.getElementById('dictionaryPopup');
    if (!popup) return;

    let html = `
        <div class="dict-header">
            <span class="dict-word">${escapeHtml(result.word)}</span>
            ${result.phonetic ? `<span class="dict-phonetic">${escapeHtml(result.phonetic)}</span>` : ''}
            <button class="dict-close" onclick="closeDictionary()">✕</button>
        </div>
        <div class="dict-body">
    `;

    result.meanings.forEach(meaning => {
        html += `<div class="dict-meaning">`;
        html += `<span class="dict-pos">${escapeHtml(meaning.partOfSpeech)}</span>`;
        html += `<ol class="dict-definitions">`;

        meaning.definitions.forEach(def => {
            html += `<li>`;
            html += `<span class="dict-def">${escapeHtml(def.definition)}</span>`;
            if (def.example) {
                html += `<span class="dict-example">"${escapeHtml(def.example)}"</span>`;
            }
            html += `</li>`;
        });

        html += `</ol></div>`;
    });

    html += `</div>`;
    popup.innerHTML = html;
}

/**
 * Cierra el popup del diccionario
 */
function closeDictionary() {
    const popup = document.getElementById('dictionaryPopup');
    if (popup) {
        popup.classList.remove('show');
    }
}

/**
 * Escapa HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Maneja doble clic para buscar palabras
 */
function handleWordLookup(e) {
    // Solo si no estamos en modo edición
    if (typeof editMode !== 'undefined' && editMode) return;

    const content = document.getElementById('content');
    if (!content || !content.contains(e.target)) return;

    const selection = window.getSelection();
    const word = selection.toString().trim();

    if (word && word.length >= 2 && word.length <= 30 && !word.includes(' ')) {
        showDictionaryPopup(word, e.clientX, e.clientY);
    }
}

// Cerrar diccionario al hacer clic fuera
document.addEventListener('click', (e) => {
    const popup = document.getElementById('dictionaryPopup');
    if (popup && popup.classList.contains('show') && !popup.contains(e.target)) {
        closeDictionary();
    }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Doble clic para buscar palabra
    document.addEventListener('dblclick', handleWordLookup);
});

// Exportar funciones globales
window.lookupWord = lookupWord;
window.showDictionaryPopup = showDictionaryPopup;
window.closeDictionary = closeDictionary;
