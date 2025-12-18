/**
 * Módulo Principal del Lector
 * Configuración, navegación y funciones core
 */

// ========== CONFIGURACIÓN ==========
const FOLDER = 'capitulos_html';
const PREFIX = 'Capitulo ';
const HTML_EXT = '.html';
const JSON_EXT = '.json';
const TOTAL_CHAPTERS = 30;

// Variables de estado
let currentChapter = 1;
let fontSize = 1.15;
let currentNotesData = null;

// Secciones especiales
const SPECIAL_SECTIONS = {
    'introduccion': { title: 'Introducción', file: 'secciones/introduccion.html', icon: 'info' },
    'sobre-autor': { title: 'Sobre el Autor', file: 'secciones/sobre-autor.html', icon: 'user' }
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);

    // Cargar tamaño de fuente
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        fontSize = parseFloat(savedFontSize);
        const content = document.getElementById('content');
        if (content) content.style.fontSize = fontSize + 'rem';
    }

    // Generar lista de capítulos
    buildChapterList();

    // Cargar estados de capítulos
    updateChapterStates();
    updateProgressBar();

    // Mostrar portada principal con pequeño delay
    setTimeout(() => {
        showMainCover();
    }, 100);

    // Inicializar iconos Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Inicializar selector de temas
    initThemePicker();

    // Guardar posición de scroll periódicamente
    const reader = document.getElementById('reader');
    if (reader) {
        reader.addEventListener('scroll', debounce(saveScrollPosition, 500));
    }
});

// ========== LISTA DE CAPÍTULOS ==========
function buildChapterList() {
    const list = document.getElementById('chapterList');
    if (!list) return;

    list.innerHTML = '';

    // Secciones especiales primero
    const dividerSpecial = document.createElement('li');
    dividerSpecial.className = 'chapter-list-divider';
    dividerSpecial.textContent = 'Secciones Especiales';
    list.appendChild(dividerSpecial);

    for (const [key, section] of Object.entries(SPECIAL_SECTIONS)) {
        addSpecialSectionItem(list, key, section);
    }

    // Capítulos del libro
    const arcs = [
        { name: 'Descubrimiento', start: 1, end: 10 },
        { name: 'Infiltración', start: 11, end: 19 },
        { name: 'Confrontación', start: 20, end: 24 },
        { name: 'Resolución', start: 25, end: 30 }
    ];

    arcs.forEach(arc => {
        const divider = document.createElement('li');
        divider.className = 'chapter-list-divider';
        divider.textContent = `${arc.name} (${arc.start}-${arc.end})`;
        list.appendChild(divider);

        for (let i = arc.start; i <= arc.end; i++) {
            addChapterItem(list, i);
        }
    });
}

function addChapterItem(list, n) {
    const num = n.toString().padStart(2, '0');
    const li = document.createElement('li');
    li.id = 'ch-' + n;
    li.className = 'chapter-item';

    li.innerHTML = `
        <img src="imagenes/cap_${num}.jpg" 
             alt="Cap ${num}" 
             class="chapter-thumbnail" 
             loading="lazy" 
             onerror="this.style.display='none'">
        <span>Capítulo ${num}</span>
    `;

    li.onclick = () => {
        loadChapter(n);
        if (window.innerWidth < 900) toggleSidebar();
    };

    list.appendChild(li);
}

function addSpecialSectionItem(list, key, section) {
    const li = document.createElement('li');
    li.className = 'chapter-item special-section';

    li.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        ${section.title}
    `;

    li.onclick = () => {
        loadSpecialSection(key);
        if (window.innerWidth < 900) toggleSidebar();
    };

    list.appendChild(li);
}

function loadSpecialSection(key) {
    const section = SPECIAL_SECTIONS[key];
    if (!section.file) return;

    const content = document.getElementById('content');
    const loading = document.getElementById('loading');

    loading.classList.add('show');

    fetch(section.file)
        .then(r => r.text())
        .then(html => {
            content.innerHTML = html;
            loading.classList.remove('show');
            document.getElementById('reader').scrollTop = 0;
            document.getElementById('chapterTitle').textContent = section.title;

            if (typeof editMode !== 'undefined' && editMode) {
                makeContentEditable();
                loadSavedEdits();
            }
        })
        .catch(err => {
            console.error('Error cargando sección:', err);
            loading.classList.remove('show');
        });
}

// ========== CARGA DE CAPÍTULOS ==========
async function loadChapter(n) {
    currentChapter = n;
    localStorage.setItem('chapter', n);
    highlightChapter(n);
    showCoverScreen(n);
}

async function loadChapterDirectly(n) {
    currentChapter = n;
    localStorage.setItem('chapter', n);
    highlightChapter(n);

    const content = document.getElementById('content');
    const loading = document.getElementById('loading');

    const num = n.toString().padStart(2, '0');
    document.getElementById('chapterTitle').textContent = 'Capítulo ' + num;

    const htmlFile = FOLDER + '/' + PREFIX + num + HTML_EXT;
    const jsonFile = FOLDER + '/' + PREFIX + num + JSON_EXT;

    try {
        const htmlRes = await fetch(htmlFile);
        if (!htmlRes.ok) throw new Error('HTML no encontrado');

        const html = await htmlRes.text();
        content.innerHTML = html;
        loading.classList.remove('show');

        loadChapterNotes(jsonFile);
        addNavButtons(n);
        updateBookmarkButton();
        markChapterAsReading(n);

    } catch (e) {
        console.error('❌ Error cargando capítulo:', e);
        loading.classList.remove('show');
    }
}

function loadChapterNotes(jsonFile) {
    const content = document.getElementById('content');

    fetch(jsonFile)
        .then(r => r.ok ? r.json() : null)
        .then(notes => {
            currentNotesData = notes;
            if (notes) setupNotesWithJSON(notes);

            const allDataNotes = content.querySelectorAll('sup[data-note]');
            allDataNotes.forEach(sup => {
                const definition = sup.getAttribute('data-note');
                if (definition) {
                    sup.style.cursor = 'pointer';
                    sup.style.color = 'var(--accent)';
                    sup.style.textDecoration = 'none';
                    sup.style.borderBottom = '1px dotted var(--accent)';

                    sup.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showNote(definition);
                    });
                }
            });

            if (typeof editMode !== 'undefined' && editMode) {
                makeContentEditable();
                loadSavedEdits();
            }
        })
        .catch(() => {
            if (typeof editMode !== 'undefined' && editMode) {
                makeContentEditable();
                loadSavedEdits();
            }
        });
}

function showCoverScreen(n) {
    const num = n.toString().padStart(2, '0');
    const coverScreen = document.getElementById('coverScreen');
    const coverImg = document.getElementById('coverImageFull');
    const chapterTitle = document.getElementById('coverChapterTitle');

    chapterTitle.textContent = `Capítulo ${num}`;

    const newSrc = n <= 30 ? `imagenes/cap_${num}.jpg` : `imagenes/cover_opt.jpg`;
    if (!coverImg.src.endsWith(newSrc.split('/').pop())) {
        coverImg.src = newSrc;
    }

    const editBtn = document.querySelector('.edit-mode-btn');
    if (editBtn) editBtn.style.display = 'none';

    coverScreen.classList.add('show');
}

async function startReading() {
    const coverScreen = document.getElementById('coverScreen');
    coverScreen.classList.remove('show');

    const editBtn = document.querySelector('.edit-mode-btn');
    if (editBtn) editBtn.style.display = 'flex';

    const n = currentChapter;
    const content = document.getElementById('content');
    const loading = document.getElementById('loading');

    loading.classList.add('show');
    content.innerHTML = '';

    const num = n.toString().padStart(2, '0');
    document.getElementById('chapterTitle').textContent = 'Capítulo ' + num;

    const htmlFile = FOLDER + '/' + PREFIX + num + HTML_EXT;
    const jsonFile = FOLDER + '/' + PREFIX + num + JSON_EXT;

    try {
        const htmlRes = await fetch(htmlFile);
        if (!htmlRes.ok) throw new Error('HTML no encontrado');

        const html = await htmlRes.text();
        content.innerHTML = html;
        loading.classList.remove('show');
        document.getElementById('reader').scrollTop = 0;

        loadChapterNotes(jsonFile);
        addNavButtons(n);
        updateBookmarkButton();
        markChapterAsReading(n);

    } catch (e) {
        console.error('Error cargando capítulo:', e);
        loading.classList.remove('show');
        content.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:20px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                <h2 style="font-family:var(--font-ui); margin-bottom:8px;">Capítulo ${num} no disponible</h2>
                <p style="color:var(--text-soft); font-family:var(--font-ui);">Este capítulo aún no ha sido publicado.</p>
            </div>
        `;
        addNavButtons(n);
    }
}

function highlightChapter(n) {
    document.querySelectorAll('.chapter-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('ch-' + n);
    if (el) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ========== NOTAS AL PIE ==========
function setupNotesWithJSON(notesData) {
    const content = document.getElementById('content');
    if (!content) return;

    const allSups = content.querySelectorAll('sup');

    allSups.forEach((sup) => {
        const text = sup.textContent.trim();
        const numMatch = text.match(/\((\d+)\)/);

        if (numMatch) {
            const noteNum = numMatch[1];

            if (notesData[noteNum]) {
                let safeDefinition = notesData[noteNum].replace(/'/g, "&#39;");
                sup.setAttribute('data-note', safeDefinition);

                sup.style.cursor = 'pointer';
                sup.style.color = 'var(--accent)';
                sup.style.textDecoration = 'none';
                sup.style.borderBottom = '1px dotted var(--accent)';
                sup.title = `Ver nota ${noteNum}`;

                const newSup = sup.cloneNode(true);
                sup.parentNode.replaceChild(newSup, sup);

                newSup.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const def = newSup.getAttribute('data-note');
                    showNote(def);
                });
            }
        }
    });
}

function showNote(html) {
    document.getElementById('noteBody').innerHTML = html;
    document.getElementById('overlay').classList.add('show');
    document.getElementById('note-popup').classList.add('show');
}

function closeNote() {
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('note-popup').classList.remove('show');
}

// ========== BOOKMARKS & PROGRESS ==========
function toggleBookmark() {
    const bookmarks = getBookmarks();
    const key = `ch-${currentChapter}`;
    const scrollPos = document.getElementById('reader').scrollTop;

    if (bookmarks[key]) {
        delete bookmarks[key];
        showToast('Marcador eliminado');
    } else {
        bookmarks[key] = {
            chapter: currentChapter,
            scroll: scrollPos,
            date: new Date().toISOString()
        };
        showToast('✓ Marcador guardado');
    }

    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarkButton();
    updateChapterStates();
}

function getBookmarks() {
    const saved = localStorage.getItem('bookmarks');
    return saved ? JSON.parse(saved) : {};
}

function updateBookmarkButton() {
    const btn = document.getElementById('bookmarkBtn');
    if (!btn) return;

    const bookmarks = getBookmarks();
    const key = `ch-${currentChapter}`;

    if (bookmarks[key]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

function markChapterAsReading(n) {
    setTimeout(() => {
        const readChapters = getReadChapters();
        readChapters[`ch-${n}`] = 'reading';
        localStorage.setItem('readChapters', JSON.stringify(readChapters));
        updateChapterStates();
        updateProgressBar();
    }, 50);
}

function markChapterAsRead(n) {
    const readChapters = getReadChapters();
    if (readChapters[`ch-${n}`] === 'read') return;
    readChapters[`ch-${n}`] = 'read';
    localStorage.setItem('readChapters', JSON.stringify(readChapters));
    updateChapterStates();
    updateProgressBar();
}

function getReadChapters() {
    const saved = localStorage.getItem('readChapters');
    return saved ? JSON.parse(saved) : {};
}

function updateChapterStates() {
    const readChapters = getReadChapters();
    const bookmarks = getBookmarks();

    for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
        const el = document.getElementById('ch-' + i);
        if (!el) continue;

        el.classList.remove('read', 'reading', 'bookmarked');

        const key = `ch-${i}`;
        if (readChapters[key] === 'read') el.classList.add('read');
        if (readChapters[key] === 'reading') el.classList.add('reading');
        if (bookmarks[key]) el.classList.add('bookmarked');
    }
}

function updateProgressBar() {
    const readChapters = getReadChapters();
    const totalRead = Object.values(readChapters).filter(v => v === 'read').length;
    const percentage = (totalRead / TOTAL_CHAPTERS) * 100;

    const progressBar = document.getElementById('globalProgress');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
}

function saveScrollPosition() {
    if (currentChapter) {
        const scrollPos = document.getElementById('reader').scrollTop;
        localStorage.setItem('scrollPosition', scrollPos);

        const reader = document.getElementById('reader');
        const scrollPercentage = (reader.scrollTop + reader.clientHeight) / reader.scrollHeight;
        if (scrollPercentage > 0.95) {
            markChapterAsRead(currentChapter);
        }
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--text);
        color: var(--bg);
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function addNavButtons(n) {
    const nav = document.createElement('div');
    nav.className = 'nav-chapter';

    const prev = n > 1 ? n - 1 : null;
    const next = n < TOTAL_CHAPTERS ? n + 1 : null;

    nav.innerHTML = `
        <button class="nav-btn" onclick="loadChapter(${prev})" ${!prev ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Anterior
        </button>
        <button class="nav-btn" onclick="loadChapter(${next})" ${!next ? 'disabled' : ''}>
            Siguiente
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
    `;
    document.getElementById('content').appendChild(nav);
}

// ========== TEMAS ==========
function initThemePicker() {
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.onclick = () => setTheme(dot.dataset.theme);
    });
}

function setTheme(t) {
    document.body.setAttribute('data-theme', t === 'light' ? '' : t);
    document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
    document.querySelector(`.theme-dot[data-theme="${t}"]`)?.classList.add('active');
    localStorage.setItem('theme', t);
}

// ========== FONT ==========
function changeFont(delta) {
    fontSize = Math.max(0.9, Math.min(1.6, fontSize + delta * 0.1));
    document.getElementById('content').style.fontSize = fontSize + 'rem';
    localStorage.setItem('fontSize', fontSize);
}

// ========== SIDEBAR ==========
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Cerrar sidebar al click fuera (móvil)
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 900 && sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !e.target.closest('.btn-menu')) {
            sidebar.classList.remove('open');
        }
    }
});

// ========== PORTADA PRINCIPAL ==========
function showMainCover() {
    document.getElementById('mainCoverScreen').classList.add('show');
}

function hideMainCover() {
    document.getElementById('mainCoverScreen').classList.remove('show');
}

function enterBook() {
    hideMainCover();

    const savedChapter = localStorage.getItem('chapter');
    if (savedChapter) {
        loadChapterDirectly(parseInt(savedChapter));
    } else {
        loadChapter(1);
    }
}

function flipBook() {
    document.getElementById('bookFlipContainer').classList.toggle('flipped');
}

function flipSidebarCover() {
    document.getElementById('sidebarCoverFlip').classList.toggle('flipped');
}

// ========== TECLAS ==========
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentChapter > 1) loadChapter(currentChapter - 1);
    if (e.key === 'ArrowRight' && currentChapter < TOTAL_CHAPTERS) loadChapter(currentChapter + 1);
    if (e.key === 'Escape') closeNote();
    if (e.key === ' ' && document.getElementById('audioPlayer')?.classList.contains('show')) {
        e.preventDefault();
        if (typeof togglePlayPause === 'function') togglePlayPause();
    }
});

// ========== UTILIDADES ==========
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funciones globales
window.loadChapter = loadChapter;
window.loadChapterDirectly = loadChapterDirectly;
window.startReading = startReading;
window.showNote = showNote;
window.closeNote = closeNote;
window.toggleBookmark = toggleBookmark;
window.toggleSidebar = toggleSidebar;
window.showMainCover = showMainCover;
window.enterBook = enterBook;
window.flipBook = flipBook;
window.flipSidebarCover = flipSidebarCover;
window.setTheme = setTheme;
window.changeFont = changeFont;
window.currentChapter = currentChapter;
window.TOTAL_CHAPTERS = TOTAL_CHAPTERS;
window.currentNotesData = currentNotesData;
window.updateChapterStates = updateChapterStates;
window.updateProgressBar = updateProgressBar;
