/**
 * Módulo de Edición
 * Funciones para el modo de edición del libro
 */

// Variables de estado
let editMode = false;
let cambiosPendientes = {};
let parrafosEliminados = new Set();
let currentSelection = null;
let deleteNoteMode = false;
let pendingNoteSelection = null;
// currentNotesData está definida en app.js

// Sistema de deshacer/rehacer
const MAX_HISTORY = 30;
let undoStack = [];
let redoStack = [];
let isUndoRedo = false;

// Sistema de backup automático
let autoBackupInterval = null;
const AUTO_BACKUP_INTERVAL_MS = 60000; // Backup cada 1 minuto
let hasUnsavedChanges = false;

// Contraseña de edición (cambiar según necesidad)
const EDIT_PASSWORD = '26716975';

// ========== BACKUP AUTOMÁTICO Y CONFIRMACIÓN AL SALIR ==========

// Guardar backup automático cada minuto cuando hay cambios
function startAutoBackup() {
    if (autoBackupInterval) return; // Ya está corriendo

    autoBackupInterval = setInterval(() => {
        if (editMode && hasUnsavedChanges) {
            const content = document.getElementById('content');
            if (content) {
                const backup = {
                    chapter: currentChapter,
                    content: content.innerHTML,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('autoBackup_' + currentChapter, JSON.stringify(backup));
                console.log('Backup automático guardado - Cap', currentChapter);
            }
        }
    }, AUTO_BACKUP_INTERVAL_MS);
}

function stopAutoBackup() {
    if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
        autoBackupInterval = null;
    }
}

// Restaurar backup si existe
function checkForBackup() {
    const backup = localStorage.getItem('autoBackup_' + currentChapter);
    if (backup) {
        const data = JSON.parse(backup);
        const backupTime = new Date(data.timestamp).toLocaleString('es-ES');
        showConfirm(`Se encontró un backup del ${backupTime}. ¿Deseas restaurarlo?`, (confirmed) => {
            if (confirmed) {
                const content = document.getElementById('content');
                if (content) {
                    content.innerHTML = data.content;
                    showNotification('✅', 'Backup restaurado');
                    makeContentEditable();
                }
            }
            // Limpiar backup después de preguntar
            localStorage.removeItem('autoBackup_' + currentChapter);
        });
    }
}

// Marcar que hay cambios sin guardar
function markUnsavedChanges() {
    hasUnsavedChanges = true;
}

// Limpiar marca de cambios sin guardar
function clearUnsavedChanges() {
    hasUnsavedChanges = false;
}

// Confirmación antes de cerrar ventana si hay cambios pendientes
window.addEventListener('beforeunload', (e) => {
    if (editMode && hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '¿Seguro que deseas salir? Hay cambios sin guardar.';
        return e.returnValue;
    }
});

// ========== MODALES PERSONALIZADOS ==========
function showNotification(icon, message) {
    const overlay = document.getElementById('notificationOverlay');
    const notification = document.getElementById('customNotification');
    const iconEl = document.getElementById('notificationIcon');
    const messageEl = document.getElementById('notificationMessage');

    if (!notification) return;

    iconEl.textContent = icon;
    messageEl.textContent = message;

    overlay.classList.add('show');
    notification.classList.add('show');
}

function hideNotification() {
    const overlay = document.getElementById('notificationOverlay');
    const notification = document.getElementById('customNotification');

    if (overlay) overlay.classList.remove('show');
    if (notification) notification.classList.remove('show');
}

let confirmCallback = null;

function showConfirm(message, callback) {
    const overlay = document.getElementById('confirmOverlay');
    const confirmEl = document.getElementById('customConfirm');
    const messageEl = document.getElementById('confirmMessage');

    if (!confirmEl) return;

    messageEl.textContent = message;
    confirmCallback = callback;

    overlay.classList.add('show');
    confirmEl.classList.add('show');
}

function hideConfirm(result) {
    const overlay = document.getElementById('confirmOverlay');
    const confirmEl = document.getElementById('customConfirm');

    if (overlay) overlay.classList.remove('show');
    if (confirmEl) confirmEl.classList.remove('show');

    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

// ========== MODO EDICIÓN ==========
function showEditModal() {
    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('editPassword').value = '';
    document.getElementById('editPassword').focus();
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Exportar inmediatamente para evitar "undefined"
window.showEditModal = showEditModal;
window.closeEditModal = closeEditModal;

function activateEditMode() {
    const password = document.getElementById('editPassword').value;
    if (password === EDIT_PASSWORD) {
        editMode = true;
        cambiosPendientes = {};
        parrafosEliminados = new Set();
        hasUnsavedChanges = false;
        document.body.classList.add('edit-mode-active');
        document.getElementById('editControls').classList.add('active');

        const editBtn = document.querySelector('.edit-mode-btn');
        if (editBtn) editBtn.style.display = 'none';

        makeContentEditable();
        closeEditModal();
        loadSavedEdits();
        updateChangeCounter();

        // Iniciar backup automático
        startAutoBackup();

        // Verificar si hay backup pendiente
        setTimeout(() => checkForBackup(), 500);

        showNotification('✅', 'Modo edición activado. Haz clic en cualquier párrafo para editarlo.');
    } else {
        showNotification('❌', 'Contraseña incorrecta');
        document.getElementById('editPassword').value = '';
    }
}

function makeContentEditable() {
    const paragraphs = document.querySelectorAll('#content p');
    paragraphs.forEach((p, index) => {
        const originalHTML = p.innerHTML;
        p.setAttribute('data-index', index);
        p.setAttribute('contenteditable', 'true');
        setTimeout(() => {
            p.setAttribute('data-original', p.innerHTML);
            // También guardar estilo original para detectar cambios de alineación, etc.
            p.setAttribute('data-original-style', p.getAttribute('style') || '');
        }, 0);

        // Listener para guardar estado antes de cambio
        p.addEventListener('focus', () => saveStateForUndo());
        p.addEventListener('input', () => {
            if (!isUndoRedo) {
                markAsEdited(p);
            }
        });

        if (!p.querySelector('.delete-paragraph-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-paragraph-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Eliminar párrafo';
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                saveStateForUndo();
                deleteParagraph(p);
            };
            p.style.position = 'relative';
            p.appendChild(deleteBtn);
        }
    });

    // Guardar estado inicial
    saveStateForUndo();
}

function markAsEdited(element) {
    element.style.borderLeft = '3px solid #10b981';
    markUnsavedChanges(); // Para activar confirmación al cerrar ventana
}

// ========== SISTEMA DE DESHACER/REHACER ==========
function saveStateForUndo() {
    if (isUndoRedo) return;

    const content = document.getElementById('content');
    if (!content) return;

    const state = {
        html: content.innerHTML,
        timestamp: Date.now()
    };

    // No guardar si es igual al último estado
    if (undoStack.length > 0 && undoStack[undoStack.length - 1].html === state.html) {
        return;
    }

    undoStack.push(state);

    // Limitar tamaño del historial
    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }

    // Limpiar redo stack cuando hay nuevo cambio
    redoStack = [];

    updateUndoRedoButtons();
}

function undo() {
    if (undoStack.length <= 1) {
        showNotification('ℹ️', 'No hay más acciones para deshacer');
        return;
    }

    isUndoRedo = true;

    // Guardar estado actual en redo
    const currentState = undoStack.pop();
    redoStack.push(currentState);

    // Restaurar estado anterior
    const previousState = undoStack[undoStack.length - 1];
    const content = document.getElementById('content');
    content.innerHTML = previousState.html;

    // Reactivar funcionalidad
    reactivateAfterUndoRedo();

    isUndoRedo = false;
    updateUndoRedoButtons();
    showNotification('↩️', 'Cambio deshecho');
}

function redo() {
    if (redoStack.length === 0) {
        showNotification('ℹ️', 'No hay acciones para rehacer');
        return;
    }

    isUndoRedo = true;

    // Restaurar estado desde redo
    const nextState = redoStack.pop();
    undoStack.push(nextState);

    const content = document.getElementById('content');
    content.innerHTML = nextState.html;

    // Reactivar funcionalidad
    reactivateAfterUndoRedo();

    isUndoRedo = false;
    updateUndoRedoButtons();
    showNotification('↪️', 'Cambio rehecho');
}

function reactivateAfterUndoRedo() {
    // Reactivar contenteditable y listeners
    const paragraphs = document.querySelectorAll('#content p');
    paragraphs.forEach((p, index) => {
        p.setAttribute('data-index', index);
        p.setAttribute('contenteditable', 'true');

        // Reañadir botón de eliminar si no existe
        if (!p.querySelector('.delete-paragraph-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-paragraph-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Eliminar párrafo';
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                saveStateForUndo();
                deleteParagraph(p);
            };
            p.style.position = 'relative';
            p.appendChild(deleteBtn);
        }
    });

    // Reactivar notas
    if (typeof reactivateNotesInElement === 'function') {
        const content = document.getElementById('content');
        reactivateNotesInElement(content, currentNotesData);
    }
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) {
        undoBtn.disabled = undoStack.length <= 1;
        undoBtn.title = `Deshacer (Ctrl+Z) - ${undoStack.length - 1} acciones`;
    }
    if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
        redoBtn.title = `Rehacer (Ctrl+Y) - ${redoStack.length} acciones`;
    }
}

function deleteParagraph(paragraph) {
    showConfirm('¿Eliminar este párrafo?', (confirmed) => {
        if (confirmed) {
            const index = paragraph.getAttribute('data-index');
            parrafosEliminados.add(index);

            paragraph.style.opacity = '0.3';
            paragraph.style.textDecoration = 'line-through';
            paragraph.style.borderLeft = '3px solid #ef4444';
            paragraph.setAttribute('contenteditable', 'false');

            showNotification('🗑️', 'Párrafo marcado para eliminar. Guarda cambios para aplicar.');
        }
    });
}

function updateChangeCounter() {
    const counter = document.getElementById('changeCounter');
    if (counter) {
        const total = Object.keys(cambiosPendientes).length + parrafosEliminados.size;
        if (total > 0) {
            counter.textContent = `${total} cambio${total !== 1 ? 's' : ''} pendiente${total !== 1 ? 's' : ''}`;
            counter.classList.add('active');
        } else {
            counter.classList.remove('active');
        }
    }
}

function saveEdits() {
    const edits = {};
    const paragraphs = document.querySelectorAll('#content p[contenteditable="true"]');

    const titleText = document.getElementById('chapterTitle').textContent;
    let prefix = `cap${currentChapter}`;
    let storageKey = `bookEdits_cap${currentChapter}`;

    if (!titleText.startsWith('Capítulo')) {
        const sectionKey = titleText.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
        prefix = `sec_${sectionKey}`;
        storageKey = `bookEdits_${sectionKey}`;
    }

    let changesCount = 0;

    paragraphs.forEach((p) => {
        const index = p.getAttribute('data-index');
        const key = `${prefix}_p${index}`;
        const originalContent = p.getAttribute('data-original') || '';
        const currentContent = p.innerHTML;
        const originalStyle = p.getAttribute('data-original-style') || '';
        const currentStyle = p.getAttribute('style') || '';

        // Filtrar estilos que no queremos guardar (ej: borderLeft que es visual del editor)
        const stylesToSave = currentStyle
            .split(';')
            .filter(s => s.trim() && !s.includes('border-left') && !s.includes('position'))
            .join(';');

        // Detectar cambios en contenido O en estilo
        const contentChanged = currentContent !== originalContent;
        const styleChanged = stylesToSave !== '' && stylesToSave !== originalStyle;

        if (parrafosEliminados.has(index)) {
            edits[key] = { content: "", style: "", deleted: true };
            changesCount++;
        }
        else if (contentChanged || styleChanged) {
            // Guardar contenido Y estilo como objeto
            edits[key] = {
                content: currentContent,
                style: stylesToSave || ''
            };
            changesCount++;
            if (!p.style.borderLeft.includes('10b981')) {
                p.style.borderLeft = '3px solid #10b981';
            }
        }
    });

    if (changesCount > 0) {
        cambiosPendientes = edits;

        // Guardar por capítulo específico
        localStorage.setItem(storageKey, JSON.stringify(edits));

        // También guardar en el objeto global para exportación
        const allEdits = JSON.parse(localStorage.getItem('bookEdits') || '{}');
        Object.assign(allEdits, edits);
        localStorage.setItem('bookEdits', JSON.stringify(allEdits));

        // Marcar capítulo como editado en sidebar
        markChapterAsEdited(currentChapter);

        // Limpiar backup y marca de cambios sin guardar
        clearUnsavedChanges();
        localStorage.removeItem('autoBackup_' + currentChapter);

        updateChangeCounter();
        showNotification('💾', `${changesCount} cambio(s) guardado(s) en capítulo ${currentChapter}`);
    } else {
        showNotification('ℹ️', 'No hay cambios para guardar');
    }
}

/**
 * Marca un capítulo como editado en el sidebar
 */
function markChapterAsEdited(n) {
    const chapterItem = document.getElementById('ch-' + n);
    if (chapterItem && !chapterItem.classList.contains('edited')) {
        chapterItem.classList.add('edited');
    }
}

/**
 * Actualiza los indicadores de capítulos editados
 */
function updateEditedChaptersIndicators() {
    for (let i = 1; i <= 30; i++) {
        const storageKey = `bookEdits_cap${i}`;
        const edits = localStorage.getItem(storageKey);
        if (edits && Object.keys(JSON.parse(edits)).length > 0) {
            markChapterAsEdited(i);
        }
    }
}

function loadSavedEdits() {
    const titleText = document.getElementById('chapterTitle').textContent;
    let prefix = `cap${currentChapter}`;
    let storageKey = `bookEdits_cap${currentChapter}`;

    if (!titleText.startsWith('Capítulo')) {
        const sectionKey = titleText.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
        prefix = `sec_${sectionKey}`;
        storageKey = `bookEdits_${sectionKey}`;
    }

    // Primero intentar cargar ediciones específicas del capítulo
    let edits = {};
    const chapterEdits = localStorage.getItem(storageKey);
    if (chapterEdits) {
        edits = JSON.parse(chapterEdits);
    } else {
        // Fallback a ediciones globales
        const globalEdits = localStorage.getItem('bookEdits');
        if (globalEdits) {
            edits = JSON.parse(globalEdits);
        }
    }

    if (Object.keys(edits).length === 0) return;

    const paragraphs = document.querySelectorAll('#content p[contenteditable="true"]');

    paragraphs.forEach((p) => {
        const index = p.getAttribute('data-index');
        const key = `${prefix}_p${index}`;
        const editData = edits[key];

        if (editData) {
            // Manejar tanto formato antiguo (string) como nuevo (objeto)
            if (typeof editData === 'string') {
                // Formato antiguo
                p.innerHTML = editData;
            } else if (typeof editData === 'object') {
                // Formato nuevo con contenido y estilo
                if (editData.deleted) {
                    p.style.display = 'none';
                    p.innerHTML = '<em>[Párrafo eliminado]</em>';
                } else {
                    if (editData.content !== undefined) {
                        p.innerHTML = editData.content;
                    }
                    if (editData.style) {
                        // Aplicar estilos guardados
                        const styles = editData.style.split(';').filter(s => s.trim());
                        styles.forEach(style => {
                            const [prop, val] = style.split(':').map(s => s.trim());
                            if (prop && val) {
                                p.style.setProperty(prop, val);
                            }
                        });
                    }
                }
            }
            markAsEdited(p);
            reactivateNotesInElement(p, currentNotesData);
        }
    });
}

function exportEdits() {
    const editsToExport = Object.keys(cambiosPendientes).length > 0
        ? cambiosPendientes
        : JSON.parse(localStorage.getItem('bookEdits') || '{}');

    if (Object.keys(editsToExport).length === 0) {
        showNotification('⚠️', 'No hay cambios para exportar');
        return;
    }

    const blob = new Blob([JSON.stringify(editsToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ediciones_libro_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const total = Object.keys(editsToExport).length;
    showNotification('✅', `${total} cambio(s) exportado(s). Ejecuta el script PowerShell para aplicarlos.`);
}

function exitEditMode() {
    const totalChanges = Object.keys(cambiosPendientes).length;

    if (totalChanges > 0) {
        showConfirm(`Tienes ${totalChanges} cambio(s) sin guardar. ¿Deseas guardarlos antes de salir?`, (confirmed) => {
            if (confirmed) {
                saveEdits();
                showNotification('✅', 'Cambios guardados localmente.');
            } else {
                cambiosPendientes = {};
                updateChangeCounter();
                clearUnsavedChanges();
            }
            finalizarSalidaModoEdicion();
        });
    } else {
        finalizarSalidaModoEdicion();
    }
}


function finalizarSalidaModoEdicion() {
    editMode = false;
    cambiosPendientes = {};
    parrafosEliminados = new Set();
    document.body.classList.remove('edit-mode-active');
    document.getElementById('editControls').classList.remove('active');

    const editBtn = document.querySelector('.edit-mode-btn');
    if (editBtn) editBtn.style.display = 'flex';

    const paragraphs = document.querySelectorAll('#content p');
    paragraphs.forEach(p => {
        p.setAttribute('contenteditable', 'false');
        p.style.borderLeft = '';
        p.style.opacity = '';
        p.style.textDecoration = '';

        const deleteBtn = p.querySelector('.delete-paragraph-btn');
        if (deleteBtn) deleteBtn.remove();
    });

    updateChangeCounter();
}

// ========== SISTEMA DE RESALTADO ==========
function handleTextSelection(e) {
    if (!editMode) return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const contentDiv = document.getElementById('content');

        if (contentDiv && contentDiv.contains(container)) {
            currentSelection = {
                selection: selection,
                range: range.cloneRange(),
                text: selectedText
            };
            showHighlightMenu(e);
        }
    } else {
        hideHighlightMenu();
    }
}

function showHighlightMenu(e) {
    const menu = document.getElementById('highlightMenu');
    if (!menu) return;

    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    menu.style.left = x + 'px';
    menu.style.top = (y + 10) + 'px';
    menu.classList.add('show');
}

function hideHighlightMenu() {
    const menu = document.getElementById('highlightMenu');
    if (menu) {
        menu.classList.remove('show');
    }
}

function applyHighlight(type) {
    if (!currentSelection || !currentSelection.range) {
        hideHighlightMenu();
        return;
    }

    try {
        const range = currentSelection.range;
        const span = document.createElement('span');

        switch (type) {
            case 'yellow': span.className = 'highlight-yellow'; break;
            case 'green': span.className = 'highlight-green'; break;
            case 'pink': span.className = 'highlight-pink'; break;
            case 'blue': span.className = 'highlight-blue'; break;
            case 'review': span.className = 'highlight-review'; break;
            case 'underline': span.className = 'text-underline'; break;
            case 'strikethrough': span.className = 'text-strikethrough'; break;
        }

        span.appendChild(range.extractContents());
        range.insertNode(span);

        window.getSelection().removeAllRanges();
        currentSelection = null;
        hideHighlightMenu();
        saveHighlights();

    } catch (error) {
        console.error('Error al aplicar resaltado:', error);
        hideHighlightMenu();
    }
}

function clearHighlight() {
    if (!currentSelection || !currentSelection.range) {
        hideHighlightMenu();
        return;
    }

    try {
        const range = currentSelection.range;
        const container = range.commonAncestorContainer;

        let parent = container.parentElement;
        while (parent && parent.tagName === 'SPAN') {
            if (parent.className.includes('highlight-') ||
                parent.className.includes('text-underline') ||
                parent.className.includes('text-strikethrough')) {

                const text = document.createTextNode(parent.textContent);
                parent.parentNode.replaceChild(text, parent);
                break;
            }
            parent = parent.parentElement;
        }

        window.getSelection().removeAllRanges();
        currentSelection = null;
        hideHighlightMenu();
        saveHighlights();

    } catch (error) {
        console.error('Error al quitar resaltado:', error);
        hideHighlightMenu();
    }
}

function saveHighlights() {
    const content = document.getElementById('content');
    if (content) {
        localStorage.setItem('highlighted_content', content.innerHTML);
    }
}

// ========== SISTEMA DE NOTAS AL PIE ==========
function insertFootnote() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        showNotification('⚠️', 'Por favor, selecciona el texto al que quieres agregar la nota');
        return;
    }

    const range = selection.getRangeAt(0);
    pendingNoteSelection = {
        range: range.cloneRange(),
        text: selection.toString()
    };

    const currentNotes = document.querySelectorAll('#content sup');
    const nextNumber = currentNotes.length + 1;

    document.getElementById('noteNumber').textContent = nextNumber;
    document.getElementById('noteDefinition').value = '';
    document.getElementById('noteModal').style.display = 'flex';
    document.getElementById('noteDefinition').focus();
}

function closeNoteModal() {
    document.getElementById('noteModal').style.display = 'none';
    pendingNoteSelection = null;
}

function confirmFootnote() {
    const definition = document.getElementById('noteDefinition').value.trim();
    if (!definition) {
        showNotification('⚠️', 'Por favor, escribe la definición de la nota');
        return;
    }

    if (!pendingNoteSelection) {
        showNotification('⚠️', 'Error: no se encontró la selección de texto');
        closeNoteModal();
        return;
    }

    const noteNumber = document.getElementById('noteNumber').textContent;

    // Crear <sup> LIMPIO (solo número, sin estilos ni data-note)
    // Los estilos se aplicarán via setupNotesWithJSON cuando cargue la nota
    const sup = document.createElement('sup');
    sup.textContent = `(${noteNumber})`;

    // Aplicar estilos inmediatamente para preview visual
    sup.style.cursor = 'pointer';
    sup.style.color = 'var(--accent)';
    sup.style.borderBottom = '1px dotted var(--accent)';
    sup.title = `Ver nota ${noteNumber}`;
    sup.setAttribute('data-note', definition); // Para que funcione con delegación

    try {
        pendingNoteSelection.range.deleteContents();
        const textNode = document.createTextNode(pendingNoteSelection.text);
        pendingNoteSelection.range.insertNode(textNode);
        pendingNoteSelection.range.collapse(false);
        pendingNoteSelection.range.insertNode(sup);

        // Guardar nota en localStorage para el JSON
        saveEditedNote(noteNumber, definition);

        closeNoteModal();
        showNotification('✅', `Nota ${noteNumber} insertada. Recuerda publicar para guardarla.`);

        const paragraph = sup.closest('p');
        if (paragraph) markAsEdited(paragraph);

    } catch (error) {
        console.error('Error insertando nota:', error);
        closeNoteModal();
        showNotification('❌', 'Error al insertar la nota. Intenta de nuevo.');
    }
}

// Guardar nota editada en localStorage
function saveEditedNote(noteNumber, definition) {
    const storageKey = `editedNotes_cap${currentChapter}`;
    let editedNotes = JSON.parse(localStorage.getItem(storageKey) || '{}');
    editedNotes[noteNumber] = definition;
    localStorage.setItem(storageKey, JSON.stringify(editedNotes));
    console.log(`Nota ${noteNumber} guardada en localStorage`);
}

// Obtener notas combinadas (originales + editadas)
function getCombinedNotesData() {
    const storageKey = `editedNotes_cap${currentChapter}`;
    const editedNotes = JSON.parse(localStorage.getItem(storageKey) || '{}');

    // Combinar con notas originales (currentNotesData viene de app.js)
    const combined = { ...(currentNotesData || {}), ...editedNotes };
    return combined;
}

// Eliminar nota del localStorage
function deleteEditedNote(noteNumber) {
    const storageKey = `editedNotes_cap${currentChapter}`;
    let editedNotes = JSON.parse(localStorage.getItem(storageKey) || '{}');
    delete editedNotes[noteNumber];
    localStorage.setItem(storageKey, JSON.stringify(editedNotes));
}

function renumberFootnotes() {
    showConfirm('¿Renumerar todas las notas del capítulo en orden de aparición?', (confirmed) => {
        if (!confirmed) return;

        const contentDiv = document.getElementById('content');
        const allSups = contentDiv.querySelectorAll('sup');

        if (allSups.length === 0) {
            showNotification('ℹ️', 'No hay notas para renumerar en este capítulo');
            return;
        }

        // Crear nuevo mapa de notas renumeradas
        const newNotesMap = {};

        allSups.forEach((sup, index) => {
            const newNumber = index + 1;
            const oldDefinition = sup.getAttribute('data-note');

            // Actualizar número visual
            sup.textContent = `(${newNumber})`;
            sup.title = `Ver nota ${newNumber}`;

            // Si tiene definición, guardarla con el nuevo número
            if (oldDefinition) {
                newNotesMap[newNumber] = oldDefinition;
                sup.setAttribute('data-note', oldDefinition); // Mantener para delegación
            }

            const paragraph = sup.closest('p');
            if (paragraph) markAsEdited(paragraph);
        });

        // Guardar el nuevo mapa de notas en localStorage (reemplaza completamente)
        const storageKey = `editedNotes_cap${currentChapter}`;
        localStorage.setItem(storageKey, JSON.stringify(newNotesMap));
        console.log('Notas renumeradas:', newNotesMap);

        saveEdits();
        showNotification('✅', `${allSups.length} notas renumeradas correctamente`);
    });
}

function toggleDeleteNoteMode() {
    deleteNoteMode = !deleteNoteMode;
    const btn = document.querySelector('.btn-delete-note');
    const content = document.getElementById('content');

    if (deleteNoteMode) {
        btn.style.background = '#e74c3c';
        btn.style.color = 'white';
        btn.textContent = '🗑️ Modo Eliminar ON';
        content.style.cursor = 'crosshair';

        content.querySelectorAll('sup').forEach(sup => {
            sup.style.outline = '2px dashed #e74c3c';
        });

        showNotification('ℹ️', 'Haz clic en cualquier nota para eliminarla. Presiona el botón de nuevo para salir del modo eliminar.');
    } else {
        btn.style.background = '';
        btn.style.color = '';
        btn.textContent = '🗑️ Eliminar Nota';
        content.style.cursor = '';

        content.querySelectorAll('sup').forEach(sup => {
            sup.style.outline = '';
        });
    }
}

function deleteNoteAtClick(e) {
    if (!deleteNoteMode || !editMode) return;

    const target = e.target;
    if (target.tagName === 'SUP') {
        e.preventDefault();
        e.stopPropagation();

        const noteText = target.textContent;
        showConfirm(`¿Eliminar nota ${noteText}?`, (confirmed) => {
            if (confirmed) {
                const paragraph = target.closest('p');
                target.remove();

                if (paragraph) {
                    markAsEdited(paragraph);
                }

                showNotification('✅', `Nota ${noteText} eliminada. Recuerda renumerar las notas restantes si es necesario.`);
            }
        });
    }
}

function reactivateNotesInElement(element, notesData) {
    const allSups = element.querySelectorAll('sup');

    allSups.forEach((sup) => {
        const dataNote = sup.getAttribute('data-note');
        if (dataNote) {
            const newSup = sup.cloneNode(true);
            sup.parentNode.replaceChild(newSup, sup);

            newSup.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showNote(dataNote);
            });
            return;
        }

        const text = sup.textContent.trim();
        const numMatch = text.match(/\((\d+)\)/);

        if (numMatch && notesData) {
            const noteNum = numMatch[1];
            if (notesData[noteNum]) {
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
                    showNote(notesData[noteNum]);
                });
            }
        }
    });
}

// Inicializar eventos
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);

    document.addEventListener('click', (e) => {
        const highlightMenu = document.getElementById('highlightMenu');
        if (highlightMenu && !highlightMenu.contains(e.target) && !window.getSelection().toString()) {
            hideHighlightMenu();
        }
    });

    document.addEventListener('click', deleteNoteAtClick, true);

    document.getElementById('editPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') activateEditMode();
    });

    document.getElementById('noteDefinition')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            confirmFootnote();
        }
    });

    document.addEventListener('keydown', (e) => {
        // Deshacer/Rehacer
        if (editMode && e.ctrlKey && !e.shiftKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if (editMode && e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
            e.preventDefault();
            redo();
        }
        // Insertar nota
        if (editMode && e.ctrlKey && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            insertFootnote();
        }
        // Guardar
        if (editMode && e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveEdits();
        }
    });
});

// ========== BUSCAR Y REEMPLAZAR ==========
let searchReplaceMatches = [];
let currentMatchIndex = -1;

function openSearchReplace() {
    const modal = document.getElementById('searchReplaceModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('searchReplaceInput').value = '';
        document.getElementById('replaceInput').value = '';
        clearSearchReplaceHighlights();
        updateSearchReplaceCount(0);
        document.getElementById('searchReplaceInput').focus();
    }
}

function closeSearchReplace() {
    const modal = document.getElementById('searchReplaceModal');
    if (modal) {
        modal.classList.remove('show');
    }
    clearSearchReplaceHighlights();
}

function performSearchReplace() {
    const searchText = document.getElementById('searchReplaceInput').value;
    if (!searchText || searchText.length < 2) {
        updateSearchReplaceCount(0);
        return;
    }

    clearSearchReplaceHighlights();

    const content = document.getElementById('content');
    const paragraphs = content.querySelectorAll('p');
    searchReplaceMatches = [];

    paragraphs.forEach((p, pIndex) => {
        const text = p.textContent;
        const regex = new RegExp(escapeRegexForSearch(searchText), 'gi');
        let match;

        while ((match = regex.exec(text)) !== null) {
            searchReplaceMatches.push({
                paragraph: p,
                paragraphIndex: pIndex,
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }
    });

    if (searchReplaceMatches.length > 0) {
        currentMatchIndex = 0;
        highlightCurrentMatch();
    }

    updateSearchReplaceCount(searchReplaceMatches.length);
}

function updateSearchReplaceCount(count) {
    const countEl = document.getElementById('searchReplaceCount');
    if (countEl) {
        if (count > 0) {
            countEl.textContent = `${currentMatchIndex + 1}/${count} coincidencias`;
        } else {
            countEl.textContent = 'Sin coincidencias';
        }
    }
}

function highlightCurrentMatch() {
    if (searchReplaceMatches.length === 0) return;

    const match = searchReplaceMatches[currentMatchIndex];
    if (match && match.paragraph) {
        match.paragraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
        match.paragraph.style.outline = '3px solid var(--accent)';
        match.paragraph.style.outlineOffset = '4px';
    }

    updateSearchReplaceCount(searchReplaceMatches.length);
}

function clearSearchReplaceHighlights() {
    const content = document.getElementById('content');
    if (content) {
        content.querySelectorAll('p').forEach(p => {
            p.style.outline = '';
            p.style.outlineOffset = '';
        });
    }
    searchReplaceMatches = [];
    currentMatchIndex = -1;
}

function nextMatch() {
    if (searchReplaceMatches.length === 0) return;

    // Quitar highlight anterior
    if (searchReplaceMatches[currentMatchIndex]) {
        searchReplaceMatches[currentMatchIndex].paragraph.style.outline = '';
    }

    currentMatchIndex = (currentMatchIndex + 1) % searchReplaceMatches.length;
    highlightCurrentMatch();
}

function prevMatch() {
    if (searchReplaceMatches.length === 0) return;

    // Quitar highlight anterior
    if (searchReplaceMatches[currentMatchIndex]) {
        searchReplaceMatches[currentMatchIndex].paragraph.style.outline = '';
    }

    currentMatchIndex = (currentMatchIndex - 1 + searchReplaceMatches.length) % searchReplaceMatches.length;
    highlightCurrentMatch();
}

function replaceCurrentMatch() {
    if (searchReplaceMatches.length === 0 || currentMatchIndex < 0) {
        showNotification('⚠️', 'No hay coincidencia seleccionada');
        return;
    }

    const replaceText = document.getElementById('replaceInput').value;
    const match = searchReplaceMatches[currentMatchIndex];

    if (match && match.paragraph) {
        saveStateForUndo();

        const searchText = document.getElementById('searchReplaceInput').value;
        const regex = new RegExp(escapeRegexForSearch(searchText), 'i');

        match.paragraph.innerHTML = match.paragraph.innerHTML.replace(regex, replaceText);
        markAsEdited(match.paragraph);

        // Actualizar búsqueda
        searchReplaceMatches.splice(currentMatchIndex, 1);
        if (currentMatchIndex >= searchReplaceMatches.length) {
            currentMatchIndex = 0;
        }

        updateSearchReplaceCount(searchReplaceMatches.length);

        if (searchReplaceMatches.length > 0) {
            highlightCurrentMatch();
        }

        showNotification('✅', 'Reemplazo realizado');
    }
}

function replaceAllMatches() {
    if (searchReplaceMatches.length === 0) {
        showNotification('⚠️', 'No hay coincidencias para reemplazar');
        return;
    }

    const replaceText = document.getElementById('replaceInput').value;
    const searchText = document.getElementById('searchReplaceInput').value;
    const count = searchReplaceMatches.length;

    showConfirm(`¿Reemplazar las ${count} coincidencias de "${searchText}" por "${replaceText}"?`, (confirmed) => {
        if (confirmed) {
            saveStateForUndo();

            const regex = new RegExp(escapeRegexForSearch(searchText), 'gi');
            const processedParagraphs = new Set();

            searchReplaceMatches.forEach(match => {
                if (!processedParagraphs.has(match.paragraph)) {
                    match.paragraph.innerHTML = match.paragraph.innerHTML.replace(regex, replaceText);
                    markAsEdited(match.paragraph);
                    processedParagraphs.add(match.paragraph);
                }
            });

            clearSearchReplaceHighlights();
            showNotification('✅', `${count} reemplazos realizados`);
        }
    });
}

function escapeRegexForSearch(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========== FORMATO DE TEXTO ==========
function formatText(command) {
    if (!editMode) return;

    saveStateForUndo();
    document.execCommand(command, false, null);

    // Marcar párrafo como editado
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const paragraph = range.commonAncestorContainer.closest ?
            range.commonAncestorContainer.closest('p') :
            range.commonAncestorContainer.parentElement?.closest('p');
        if (paragraph) markAsEdited(paragraph);
    }
}

function changeFontSize(size) {
    if (!editMode || !size) return;

    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        showNotification('⚠️', 'Selecciona el texto al que quieres cambiar el tamaño');
        document.getElementById('fontSizeSelect').value = '';
        return;
    }

    saveStateForUndo();

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = size;
    span.appendChild(range.extractContents());
    range.insertNode(span);

    // Marcar párrafo como editado
    const paragraph = span.closest('p');
    if (paragraph) markAsEdited(paragraph);

    document.getElementById('fontSizeSelect').value = '';
    selection.removeAllRanges();
}

function alignText(alignment) {
    if (!editMode) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    saveStateForUndo();

    const range = selection.getRangeAt(0);
    const paragraph = range.commonAncestorContainer.closest ?
        range.commonAncestorContainer.closest('p') :
        range.commonAncestorContainer.parentElement?.closest('p');

    if (paragraph) {
        paragraph.style.textAlign = alignment;
        markAsEdited(paragraph);
    }
}

function clearAllFormatting() {
    if (!editMode) return;

    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        showNotification('⚠️', 'Selecciona el texto al que quieres quitar el formato');
        return;
    }

    saveStateForUndo();
    document.execCommand('removeFormat', false, null);

    // También quitar resaltados
    clearHighlight();
}

// ========== PUBLICACIÓN A GITHUB ==========
const GITHUB_CONFIG = {
    owner: 'aldowagner78-cmd',
    repo: 'mi-libro',
    branch: 'main',
    token: null // Se carga desde config.local.js o localStorage
};

function getGitHubToken() {
    // Prioridad 1: Token ya cargado en memoria
    if (GITHUB_CONFIG.token && GITHUB_CONFIG.token.length > 10) {
        return GITHUB_CONFIG.token;
    }

    // Prioridad 2: Token desde config.local.js (archivo local)
    if (typeof LOCAL_CONFIG !== 'undefined' && LOCAL_CONFIG.github_token) {
        GITHUB_CONFIG.token = LOCAL_CONFIG.github_token;
        return GITHUB_CONFIG.token;
    }

    // Prioridad 3: Token desde localStorage
    const storedToken = localStorage.getItem('github_token');
    if (storedToken && storedToken.length > 10 && storedToken !== 'null' && storedToken !== 'undefined') {
        GITHUB_CONFIG.token = storedToken;
        return GITHUB_CONFIG.token;
    }

    return null;
}

function setGitHubToken(token) {
    GITHUB_CONFIG.token = token;
    localStorage.setItem('github_token', token);
}

// Permitir resetear token manualmente desde consola o botón futuro
function resetGitHubToken() {
    localStorage.removeItem('github_token');
    GITHUB_CONFIG.token = null;
    showNotification('ℹ️', 'Token eliminado. Se pedirá uno nuevo al publicar.');
}

async function publishToGitHub() {
    let token = getGitHubToken();

    if (!token) {
        // Pedir token por primera vez
        const inputToken = prompt('Ingresa tu GitHub Token para publicar:\n(Solo se pide una vez, se guarda en tu navegador)\n\nPuedes obtenerlo en: github.com/settings/tokens');
        if (!inputToken || inputToken.trim() === '') {
            showNotification('⚠️', 'Publicación cancelada - Token requerido');
            return;
        }
        setGitHubToken(inputToken.trim());
        token = inputToken.trim();
    }

    // Primero guardar cambios localmente
    saveEdits();

    const edits = JSON.parse(localStorage.getItem('bookEdits') || '{}');
    const hasEdits = Object.keys(edits).length > 0;

    // Verificar también si hay notas editadas
    let hasNotes = false;
    for (let i = 1; i <= 30; i++) {
        if (localStorage.getItem(`editedNotes_cap${i}`)) {
            hasNotes = true;
            break;
        }
    }

    if (!hasEdits && !hasNotes) {
        showNotification('ℹ️', 'No hay cambios nuevos para publicar');
        return;
    }

    showNotification('⏳', 'Publicando cambios a GitHub...');

    try {
        // Obtener los cambios organizados por capítulo
        const changesByChapter = organizeEditsByChapter(edits);
        let successCount = 0;
        let errorMessages = [];

        for (const [chapterKey, changes] of Object.entries(changesByChapter)) {
            try {
                // Formatear número de capítulo con cero (01, 02, ... 09, 10, 11...)
                const chapterNum = chapterKey.padStart(2, '0');

                // Actualizar archivo HTML
                const htmlPath = `capitulos_html/Capitulo ${chapterNum}.html`;
                await updateFileOnGitHub(htmlPath, changes, 'html');

                // Actualizar archivo MD
                const mdPath = `capitulos_md/Capitulo ${chapterNum}.md`;
                await updateFileOnGitHub(mdPath, changes, 'md');

                successCount++;
            } catch (error) {
                console.error(`Error actualizando capítulo ${chapterKey}:`, error);
                throw error; // Re-lanzar para manejar autenticación en el catch principal
            }
        }

        // Publicar notas editadas al JSON
        let notesPublished = 0;
        for (let i = 1; i <= 30; i++) {
            const notesKey = `editedNotes_cap${i}`;
            const editedNotes = localStorage.getItem(notesKey);
            if (editedNotes && editedNotes !== '{}') {
                try {
                    const chapterNum = i.toString().padStart(2, '0');
                    const jsonPath = `capitulos_html/Capitulo ${chapterNum}_notas.json`;
                    await updateNotesJSONOnGitHub(jsonPath, JSON.parse(editedNotes));
                    notesPublished++;
                    localStorage.removeItem(notesKey); // Limpiar después de publicar
                } catch (error) {
                    console.error(`Error publicando notas cap ${i}:`, error);
                    throw error; // Re-lanzar para manejar autenticación
                }
            }
        }

        if (successCount > 0 || notesPublished > 0) {
            // Limpiar ediciones locales después de publicar
            localStorage.removeItem('bookEdits');
            for (let i = 1; i <= 30; i++) {
                localStorage.removeItem(`bookEdits_cap${i}`);
            }
            cambiosPendientes = {};
            updateChangeCounter();
            clearUnsavedChanges();

            const msg = [];
            if (successCount > 0) msg.push(`${successCount} capítulo(s)`);
            if (notesPublished > 0) msg.push(`${notesPublished} JSON de notas`);
            showNotification('✅', `¡Publicado! ${msg.join(' + ')} actualizado(s) en GitHub.`);
        } else {
            // Si llegamos aquí sin éxito y sin catch, algo raro pasó
            showNotification('ℹ️', 'No se realizaron actualizaciones.');
        }

    } catch (error) {
        console.error('Error en publicación:', error);

        // Detectar error de autenticación (GitHub devuelve "Bad credentials" o 401)
        if (error.message.includes('Bad credentials') || error.message.includes('401') || error.message.toLowerCase().includes('token')) {
            localStorage.removeItem('github_token');
            GITHUB_CONFIG.token = null;

            if (confirm('⚠️ Error de autenticación: El token es inválido o expiró.\n\n¿Quieres ingresar uno nuevo e intentar de nuevo?')) {
                // Reintentar recursivamente (pedirá el token porque ya lo borramos)
                setTimeout(() => publishToGitHub(), 500);
                return;
            }
        }

        showNotification('❌', 'Error al publicar: ' + error.message);
    }
}

function organizeEditsByChapter(edits) {
    const byChapter = {};

    for (const [key, value] of Object.entries(edits)) {
        // Extraer número de capítulo del key (ej: "cap12_p5" -> "12")
        const match = key.match(/cap(\d+)_p(\d+)/);
        if (match) {
            const chapterNum = match[1];
            const paragraphNum = match[2];

            if (!byChapter[chapterNum]) {
                byChapter[chapterNum] = {};
            }
            byChapter[chapterNum][paragraphNum] = value;
        }
    }

    return byChapter;
}

// ========== FUNCIONES DE CODIFICACIÓN UTF-8 ==========
// Necesarias para manejar correctamente caracteres especiales (ñ, á, é, etc.)

function decodeBase64UTF8(base64) {
    // Limpiar saltos de línea del base64
    const cleanBase64 = base64.replace(/\s/g, '');
    // Decodificar base64 a bytes
    const binaryString = atob(cleanBase64);
    // Convertir bytes a array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    // Decodificar UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
}

function encodeBase64UTF8(text) {
    // Codificar texto a UTF-8
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    // Convertir bytes a string binario
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    // Codificar a base64
    return btoa(binaryString);
}

async function updateFileOnGitHub(filePath, changes, fileType) {
    const token = getGitHubToken();
    const { owner, repo, branch } = GITHUB_CONFIG;

    // 1. Obtener el archivo actual
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
    const getResponse = await fetch(getUrl, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!getResponse.ok) {
        throw new Error(`No se pudo obtener ${filePath}`);
    }

    const fileData = await getResponse.json();

    // Decodificar Base64 a UTF-8 correctamente
    let content = decodeBase64UTF8(fileData.content);

    // 2. Aplicar los cambios al contenido
    content = applyEditsToContent(content, changes, fileType);

    // 3. Subir el archivo actualizado
    const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `edit: Actualización desde editor web - ${new Date().toLocaleString('es-ES')}`,
            content: encodeBase64UTF8(content),
            sha: fileData.sha,
            branch: branch
        })
    });

    if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Error al actualizar archivo');
    }

    return true;
}

// Función para actualizar el JSON de notas en GitHub
async function updateNotesJSONOnGitHub(jsonPath, editedNotes) {
    const token = getGitHubToken();
    const { owner, repo, branch } = GITHUB_CONFIG;

    // 1. Obtener el archivo JSON actual
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonPath}?ref=${branch}`;
    const getResponse = await fetch(getUrl, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    let currentNotes = {};
    let sha = null;

    if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
        // Decodificar contenido actual
        const currentContent = decodeBase64UTF8(fileData.content);
        try {
            currentNotes = JSON.parse(currentContent);
        } catch (e) {
            console.warn('No se pudo parsear JSON actual, se creará nuevo');
        }
    }

    // 2. Combinar notas: las editadas tienen prioridad
    const mergedNotes = { ...currentNotes, ...editedNotes };

    // 3. Formatear JSON bonito
    const newContent = JSON.stringify(mergedNotes, null, 2);

    // 4. Subir al repositorio
    const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonPath}`;
    const body = {
        message: `notes: Actualización de notas desde editor web - ${new Date().toLocaleString('es-ES')}`,
        content: encodeBase64UTF8(newContent),
        branch: branch
    };

    if (sha) {
        body.sha = sha; // Incluir SHA solo si el archivo existe
    }

    const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Error al actualizar JSON de notas');
    }

    console.log(`JSON de notas actualizado: ${jsonPath}`);
    return true;
}

function applyEditsToContent(content, changes, fileType) {
    // Para HTML: buscar párrafos por índice y aplicar contenido + estilos
    // Para MD: convertir HTML a MD y aplicar

    if (fileType === 'html') {
        // Parsear el HTML y aplicar cambios
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
        const paragraphs = doc.querySelectorAll('p');

        for (const [pIndex, editData] of Object.entries(changes)) {
            const idx = parseInt(pIndex);
            if (paragraphs[idx]) {
                // Manejar tanto formato antiguo (string) como nuevo (objeto)
                if (typeof editData === 'string') {
                    // Formato antiguo (retrocompatibilidad)
                    if (editData === '') {
                        paragraphs[idx].remove();
                    } else {
                        paragraphs[idx].innerHTML = editData;
                    }
                } else if (typeof editData === 'object') {
                    // Formato nuevo con contenido y estilo separados
                    if (editData.deleted) {
                        paragraphs[idx].remove();
                    } else {
                        // Aplicar contenido
                        if (editData.content !== undefined) {
                            paragraphs[idx].innerHTML = editData.content;
                        }
                        // Aplicar estilos al párrafo
                        if (editData.style) {
                            paragraphs[idx].setAttribute('style', editData.style);
                        }
                    }
                }
            }
        }

        return doc.body.firstChild.innerHTML;
    } else {
        // Para MD, convertimos el HTML editado a texto plano con formato MD básico
        let mdContent = content;

        for (const [pIndex, editData] of Object.entries(changes)) {
            // Extraer contenido (soportar ambos formatos)
            const newContent = typeof editData === 'string' ? editData : (editData.content || '');

            if (newContent && newContent !== '') {
                // Convertir HTML básico a MD
                let mdParagraph = newContent
                    .replace(/<strong>|<b>/gi, '**')
                    .replace(/<\/strong>|<\/b>/gi, '**')
                    .replace(/<em>|<i>/gi, '*')
                    .replace(/<\/em>|<\/i>/gi, '*')
                    .replace(/<u>/gi, '')
                    .replace(/<\/u>/gi, '')
                    .replace(/<[^>]+>/g, '') // Quitar otras etiquetas HTML
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&mdash;/g, '—')
                    .replace(/&ndash;/g, '–')
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&');

                // Por ahora, dejamos el contenido MD sin modificar (los cambios principales van al HTML)
            }
        }

        return mdContent;
    }
}

// Atajos de teclado para formato
document.addEventListener('keydown', (e) => {
    if (!editMode) return;

    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        formatText('bold');
    }
    if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        formatText('italic');
    }
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        formatText('underline');
    }
});

// Exportar funciones globales
window.showNotification = showNotification;
window.hideNotification = hideNotification;
window.showConfirm = showConfirm;
window.hideConfirm = hideConfirm;
window.showEditModal = showEditModal;
window.closeEditModal = closeEditModal;
window.activateEditMode = activateEditMode;
window.saveEdits = saveEdits;
window.exportEdits = exportEdits;
window.exitEditMode = exitEditMode;
window.applyHighlight = applyHighlight;
window.clearHighlight = clearHighlight;
window.insertFootnote = insertFootnote;
window.closeNoteModal = closeNoteModal;
window.confirmFootnote = confirmFootnote;
window.renumberFootnotes = renumberFootnotes;
window.toggleDeleteNoteMode = toggleDeleteNoteMode;
window.makeContentEditable = makeContentEditable;
window.loadSavedEdits = loadSavedEdits;
window.reactivateNotesInElement = reactivateNotesInElement;
window.markAsEdited = markAsEdited;
window.undo = undo;
window.redo = redo;
window.saveStateForUndo = saveStateForUndo;
window.openSearchReplace = openSearchReplace;
window.closeSearchReplace = closeSearchReplace;
window.performSearchReplace = performSearchReplace;
window.nextMatch = nextMatch;
window.prevMatch = prevMatch;
window.replaceCurrentMatch = replaceCurrentMatch;
window.replaceAllMatches = replaceAllMatches;
window.updateEditedChaptersIndicators = updateEditedChaptersIndicators;
// Nuevas funciones
window.formatText = formatText;
window.changeFontSize = changeFontSize;
window.alignText = alignText;
window.clearAllFormatting = clearAllFormatting;
window.publishToGitHub = publishToGitHub;
