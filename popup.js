/**
 * popup.js
 * Lógica para la interfaz Tuff interactiva coherente.
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const adsCountEl = document.getElementById('adsCount');
    const themeBtns = document.querySelectorAll('.theme-btn');

    // 1. Nueva Función: Aplicar Tema Dinámico a toda la ventana Popup
    function applyPopupTheme(colorCode) {
        document.body.classList.remove('theme-dorado', 'theme-plateado', 'theme-negro', 'theme-rojo');
        
        if (colorCode === '#e0e0e0') {
            document.body.classList.add('theme-plateado');
        } else if (colorCode === '#555555' || colorCode === '#282828') {
            document.body.classList.add('theme-negro');
        } else if (colorCode === '#ff0000') {
            document.body.classList.add('theme-rojo');
        } else {
            // Default / Fallback a Dorado
            document.body.classList.add('theme-dorado');
        }
    }

    // Inicialización del estado
    chrome.storage.local.get(['adSkipperEnabled', 'adsSkippedCount', 'playerTheme'], (data) => {
        const isEnabled = data.adSkipperEnabled !== false;
        const count = data.adsSkippedCount || 0;
        
        // Migrar el viejo negro (#282828) al nuevo gris carbono ultra visible (#555555) si es necesario
        let currentTheme = data.playerTheme || '#d4af37';
        if (currentTheme === '#282828') currentTheme = '#555555';

        toggleSwitch.checked = isEnabled;
        adsCountEl.textContent = count;

        themeBtns.forEach(btn => {
            if (btn.dataset.color === currentTheme) {
                btn.classList.add('active');
            }
        });
        
        applyPopupTheme(currentTheme);
    });

    toggleSwitch.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ adSkipperEnabled: isEnabled });
    });

    themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = e.target.dataset.color;
            
            themeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            applyPopupTheme(color);
            chrome.storage.local.set({ playerTheme: color });
        });
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.adsSkippedCount) {
            adsCountEl.textContent = changes.adsSkippedCount.newValue;
        }
    });
});
