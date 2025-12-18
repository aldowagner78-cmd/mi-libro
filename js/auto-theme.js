/**
 * Módulo de Tema Automático
 * Cambia automáticamente entre tema claro y oscuro según la hora del día
 */

// Horas de cambio de tema
const LIGHT_THEME_START = 7;  // 7 AM
const DARK_THEME_START = 19; // 7 PM

/**
 * Verifica si el tema automático está habilitado
 */
function isAutoThemeEnabled() {
    return localStorage.getItem('autoTheme') === 'true';
}

/**
 * Activa/desactiva el tema automático
 */
function toggleAutoTheme() {
    const current = isAutoThemeEnabled();
    localStorage.setItem('autoTheme', (!current).toString());

    if (!current) {
        // Activando tema automático
        applyAutoTheme();
        if (typeof showNotification === 'function') {
            showNotification('🌗', 'Tema automático activado. El tema cambiará según la hora del día.');
        }
    } else {
        if (typeof showNotification === 'function') {
            showNotification('🎨', 'Tema automático desactivado');
        }
    }

    updateAutoThemeButton();
}

/**
 * Aplica el tema según la hora actual
 */
function applyAutoTheme() {
    if (!isAutoThemeEnabled()) return;

    const hour = new Date().getHours();
    const isDayTime = hour >= LIGHT_THEME_START && hour < DARK_THEME_START;

    // Preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let theme;
    if (isDayTime) {
        theme = 'light';
    } else {
        theme = prefersDark ? 'midnight' : 'dark';
    }

    if (typeof setTheme === 'function') {
        setTheme(theme);
    } else {
        // Fallback si setTheme no existe
        document.body.setAttribute('data-theme', theme === 'light' ? '' : theme);
        localStorage.setItem('theme', theme);
    }
}

/**
 * Actualiza el estado del botón de tema automático
 */
function updateAutoThemeButton() {
    const btn = document.getElementById('autoThemeBtn');
    if (btn) {
        if (isAutoThemeEnabled()) {
            btn.classList.add('active');
            btn.title = 'Tema automático: Activado';
        } else {
            btn.classList.remove('active');
            btn.title = 'Tema automático: Desactivado';
        }
    }
}

// Escuchar cambios en la preferencia del sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (isAutoThemeEnabled()) {
        applyAutoTheme();
    }
});

// Verificar tema cada hora
setInterval(applyAutoTheme, 3600000);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    updateAutoThemeButton();

    // Aplicar tema automático si está habilitado
    if (isAutoThemeEnabled()) {
        applyAutoTheme();
    }
});

// Exportar funciones globales
window.toggleAutoTheme = toggleAutoTheme;
window.isAutoThemeEnabled = isAutoThemeEnabled;
window.applyAutoTheme = applyAutoTheme;
