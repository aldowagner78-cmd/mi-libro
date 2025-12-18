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
let currentNotesData = null;

// Contraseña de edición (cambiar según necesidad)
const EDIT_PASSWORD = 'admin2024';

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

function activateEditMode() {
    const password = document.getElementById('editPassword').value;
    if (password === EDIT_PASSWORD) {
        editMode = true;
        cambiosPendientes = {};
        parrafosEliminados = new Set();
        document.body.classList.add('edit-mode-active');
        document.getElementById('editControls').classList.add('active');

        const editBtn = document.querySelector('.edit-mode-btn');
        if (editBtn) editBtn.style.display = 'none';

        makeContentEditable();
        closeEditModal();
        loadSavedEdits();
        updateChangeCounter();
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
        }, 0);
        p.addEventListener('input', () => markAsEdited(p));

        if (!p.querySelector('.delete-paragraph-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-paragraph-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Eliminar párrafo';
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteParagraph(p);
            };
            p.style.position = 'relative';
            p.appendChild(deleteBtn);
        }
    });
}

function markAsEdited(element) {
    element.style.borderLeft = '3px solid #10b981';
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

    if (!titleText.startsWith('Capítulo')) {
        const sectionKey = titleText.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
        prefix = `sec_${sectionKey}`;
    }

    let changesCount = 0;

    paragraphs.forEach((p) => {
        const index = p.getAttribute('data-index');
        const key = `${prefix}_p${index}`;
        const originalContent = p.getAttribute('data-original') || '';
        const currentContent = p.innerHTML;

        if (parrafosEliminados.has(index)) {
            edits[key] = "";
            changesCount++;
        }
        else if (currentContent !== originalContent) {
            edits[key] = currentContent;
            changesCount++;
            if (!p.style.borderLeft.includes('10b981')) {
                p.style.borderLeft = '3px solid #10b981';
            }
        }
    });

    if (changesCount > 0) {
        cambiosPendientes = edits;
        localStorage.setItem('bookEdits', JSON.stringify(edits));
        updateChangeCounter();
        showNotification('💾', `${changesCount} cambio(s) guardado(s) temporalmente. Salir del modo edición para exportar.`);
    } else {
        showNotification('ℹ️', 'No hay cambios para guardar');
    }
}

function loadSavedEdits() {
    const saved = localStorage.getItem('bookEdits');
    if (!saved) return;

    const edits = JSON.parse(saved);
    const paragraphs = document.querySelectorAll('#content p[contenteditable="true"]');

    const titleText = document.getElementById('chapterTitle').textContent;
    let prefix = `cap${currentChapter}`;

    if (!titleText.startsWith('Capítulo')) {
        const sectionKey = titleText.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
        prefix = `sec_${sectionKey}`;
    }

    paragraphs.forEach((p) => {
        const index = p.getAttribute('data-index');
        const key = `${prefix}_p${index}`;
        if (edits[key]) {
            p.innerHTML = edits[key];
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
        showConfirm(`Tienes ${totalChanges} cambio(s) sin exportar. ¿Deseas exportar antes de salir?`, (confirmed) => {
            if (confirmed) {
                const blob = new Blob([JSON.stringify(cambiosPendientes, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ediciones_libro_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);

                showNotification('✅', `${totalChanges} cambio(s) exportados correctamente.`);
                finalizarSalidaModoEdicion();
            } else {
                showConfirm('¿Descartar todos los cambios sin exportar?', (discardConfirmed) => {
                    if (discardConfirmed) {
                        localStorage.removeItem('bookEdits');
                        cambiosPendientes = {};
                        parrafosEliminados = new Set();
                        finalizarSalidaModoEdicion();
                        showNotification('🗑️', 'Cambios descartados');
                    }
                });
            }
        });
    } else {
        showConfirm('¿Salir del modo edición?', (confirmed) => {
            if (confirmed) {
                finalizarSalidaModoEdicion();
            }
        });
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

    const sup = document.createElement('sup');
    sup.style.cursor = 'pointer';
    sup.style.color = 'var(--accent)';
    sup.style.textDecoration = 'none';
    sup.style.borderBottom = '1px dotted var(--accent)';
    sup.title = `Ver nota ${noteNumber}`;
    sup.textContent = `(${noteNumber})`;
    sup.setAttribute('data-note', definition);

    sup.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showNote(sup.getAttribute('data-note'));
    });

    try {
        pendingNoteSelection.range.deleteContents();
        const textNode = document.createTextNode(pendingNoteSelection.text);
        pendingNoteSelection.range.insertNode(textNode);
        pendingNoteSelection.range.collapse(false);
        pendingNoteSelection.range.insertNode(sup);

        closeNoteModal();
        showNotification('✅', `Nota ${noteNumber} insertada correctamente`);

        const paragraph = sup.closest('p');
        if (paragraph) markAsEdited(paragraph);

    } catch (error) {
        console.error('Error insertando nota:', error);
        closeNoteModal();
        showNotification('❌', 'Error al insertar la nota. Intenta de nuevo.');
    }
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

        allSups.forEach((sup, index) => {
            const newNumber = index + 1;
            sup.textContent = `(${newNumber})`;
            sup.title = `Ver nota ${newNumber}`;

            const paragraph = sup.closest('p');
            if (paragraph) markAsEdited(paragraph);
        });

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
        if (editMode && e.ctrlKey && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            insertFootnote();
        }
    });
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
