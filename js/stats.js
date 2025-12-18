/**
 * Módulo de Estadísticas de Lectura
 * Muestra progreso, tiempo de lectura y métricas del libro
 */

// Tiempo en que se inició la sesión de lectura
let sessionStartTime = null;

/**
 * Inicia el tracking de tiempo de lectura
 */
function startReadingSession() {
    if (!sessionStartTime) {
        sessionStartTime = Date.now();
    }
}

/**
 * Guarda el tiempo de lectura acumulado
 */
function saveReadingTime() {
    if (!sessionStartTime) return;

    const sessionTime = Date.now() - sessionStartTime;
    const totalTime = parseInt(localStorage.getItem('totalReadingTime') || '0');
    localStorage.setItem('totalReadingTime', totalTime + sessionTime);
    sessionStartTime = Date.now(); // Reiniciar para la próxima sesión
}

/**
 * Obtiene el tiempo total de lectura formateado
 */
function getFormattedReadingTime() {
    const totalMs = parseInt(localStorage.getItem('totalReadingTime') || '0');
    const currentSession = sessionStartTime ? Date.now() - sessionStartTime : 0;
    const totalMinutes = Math.floor((totalMs + currentSession) / 60000);

    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
}

/**
 * Obtiene estadísticas de lectura
 */
function getReadingStats() {
    const readChaptersStr = localStorage.getItem('readChapters');
    const readChapters = readChaptersStr ? JSON.parse(readChaptersStr) : {};

    const totalChapters = 30;
    const completedCount = Object.values(readChapters).filter(v => v === 'read').length;
    const inProgressCount = Object.values(readChapters).filter(v => v === 'reading').length;
    const percentage = Math.round((completedCount / totalChapters) * 100);

    const bookmarksStr = localStorage.getItem('bookmarks');
    const bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : {};
    const bookmarksCount = Object.keys(bookmarks).length;

    return {
        totalChapters,
        completedCount,
        inProgressCount,
        percentage,
        bookmarksCount,
        readingTime: getFormattedReadingTime()
    };
}

/**
 * Abre el modal de estadísticas
 */
function openStats() {
    const modal = document.getElementById('statsModal');
    if (modal) {
        updateStatsDisplay();
        modal.classList.add('show');
    }
}

/**
 * Cierra el modal de estadísticas
 */
function closeStats() {
    const modal = document.getElementById('statsModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Actualiza la visualización de estadísticas
 */
function updateStatsDisplay() {
    const stats = getReadingStats();

    // Actualizar valores
    const completedEl = document.getElementById('statCompleted');
    const inProgressEl = document.getElementById('statInProgress');
    const bookmarksEl = document.getElementById('statBookmarks');
    const timeEl = document.getElementById('statTime');
    const progressFill = document.getElementById('statsProgressFill');
    const progressText = document.getElementById('statsProgressText');

    if (completedEl) completedEl.textContent = stats.completedCount;
    if (inProgressEl) inProgressEl.textContent = stats.inProgressCount;
    if (bookmarksEl) bookmarksEl.textContent = stats.bookmarksCount;
    if (timeEl) timeEl.textContent = stats.readingTime;
    if (progressFill) progressFill.style.width = `${stats.percentage}%`;
    if (progressText) progressText.textContent = `${stats.percentage}% completado (${stats.completedCount}/${stats.totalChapters} capítulos)`;
}

/**
 * Exporta el progreso como JSON
 */
function exportProgress() {
    const data = {
        readChapters: JSON.parse(localStorage.getItem('readChapters') || '{}'),
        bookmarks: JSON.parse(localStorage.getItem('bookmarks') || '{}'),
        currentChapter: localStorage.getItem('chapter'),
        totalReadingTime: localStorage.getItem('totalReadingTime'),
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progreso_libro_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (typeof showNotification === 'function') {
        showNotification('✅', 'Progreso exportado correctamente');
    }
}

/**
 * Importa el progreso desde un archivo JSON
 */
function importProgress(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            if (data.readChapters) {
                localStorage.setItem('readChapters', JSON.stringify(data.readChapters));
            }
            if (data.bookmarks) {
                localStorage.setItem('bookmarks', JSON.stringify(data.bookmarks));
            }
            if (data.currentChapter) {
                localStorage.setItem('chapter', data.currentChapter);
            }
            if (data.totalReadingTime) {
                localStorage.setItem('totalReadingTime', data.totalReadingTime);
            }

            if (typeof showNotification === 'function') {
                showNotification('✅', 'Progreso importado. Recarga la página para ver los cambios.');
            }

            // Actualizar UI
            if (typeof updateChapterStates === 'function') updateChapterStates();
            if (typeof updateProgressBar === 'function') updateProgressBar();
            updateStatsDisplay();

        } catch (err) {
            console.error('Error importando progreso:', err);
            if (typeof showNotification === 'function') {
                showNotification('❌', 'Error al importar el archivo');
            }
        }
    };
    reader.readAsText(file);
}

/**
 * Reinicia todas las estadísticas
 */
function resetStats() {
    if (typeof showConfirm === 'function') {
        showConfirm('¿Estás seguro de que quieres reiniciar todo el progreso? Esta acción no se puede deshacer.', (confirmed) => {
            if (confirmed) {
                localStorage.removeItem('readChapters');
                localStorage.removeItem('bookmarks');
                localStorage.removeItem('totalReadingTime');
                localStorage.removeItem('scrollPosition');

                if (typeof updateChapterStates === 'function') updateChapterStates();
                if (typeof updateProgressBar === 'function') updateProgressBar();
                updateStatsDisplay();

                if (typeof showNotification === 'function') {
                    showNotification('🗑️', 'Progreso reiniciado');
                }
            }
        });
    }
}

// Guardar tiempo al salir de la página
window.addEventListener('beforeunload', saveReadingTime);

// Iniciar tracking cuando se carga
document.addEventListener('DOMContentLoaded', startReadingSession);

// Guardar tiempo periódicamente (cada 5 minutos)
setInterval(saveReadingTime, 300000);

// Exportar funciones globales
window.openStats = openStats;
window.closeStats = closeStats;
window.exportProgress = exportProgress;
window.importProgress = importProgress;
window.resetStats = resetStats;
window.getReadingStats = getReadingStats;
