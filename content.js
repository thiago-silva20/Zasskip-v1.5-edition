/**
 * content.js
 * Versión Definitiva "Tuff" V3.5: Salto invisible, eventos nativos, y 4 colores dinámicos.
 */

const SKIP_BUTTON_SELECTORS = [
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-text.ytp-ad-skip-button-text',
    '.ytp-ad-skip-button-slot',
    'button.ytp-ad-skip-button-modern',
    'button.ytp-skip-ad-button'
];

let lastClickTime = 0;

/**
 * Inyección dinámica de colores para la barra del reproductor de YouTube.
 */
function applyPlayerTheme(color) {
    // Si el usuario tenía el negro obsoleto (#282828), forzamos al nuevo #555555 más visible
    if (color === '#282828') color = '#555555';

    let styleEl = document.getElementById('tuff-dynamic-theme');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'tuff-dynamic-theme';
        (document.head || document.documentElement).appendChild(styleEl);
    }

    styleEl.textContent = `
        /* Color principal de la barra de reproducción y SHORTS */
        .ytp-play-progress,
        .ytp-play-progress.ytp-swatch-background-color,
        .ytp-swatch-background-color,
        ytd-reel-video-renderer #progress-bar,
        ytd-reel-video-renderer .progress-bar-line {
            background-color: ${color} !important;
            background: ${color} !important;
        }

        /* Botón deslizable redondo de la barra de tiempo */
        .ytp-scrubber-button {
            background-color: ${color} !important;
            border-color: ${color} !important;
        }

        /* Mini barra inferior de las miniaturas */
        #progress.ytd-thumbnail-overlay-resume-playback-renderer {
            background-color: ${color} !important;
        }
    `;
}

/**
 * Muestra el badge "Tuff" de anuncio destruido sobre el video.
 */
function showDestructionBadge() {
    const player = document.querySelector('.html5-video-player') || document.body;
    
    const badge = document.createElement('div');
    badge.textContent = "+1 Anuncio Destruido";
    badge.style.position = 'absolute';
    badge.style.bottom = '60px';
    badge.style.left = '20px';
    badge.style.backgroundColor = '#1e1e1e';
    badge.style.color = '#d4af37'; // Siempre dorado para el badge
    badge.style.padding = '8px 16px';
    badge.style.borderRadius = '4px';
    badge.style.fontFamily = '"Segoe UI", Roboto, Arial, sans-serif';
    badge.style.fontSize = '14px';
    badge.style.fontWeight = 'bold';
    badge.style.border = '1px solid #e0e0e0'; 
    badge.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
    badge.style.zIndex = '99999';
    badge.style.transition = 'opacity 0.5s ease-out';
    badge.style.opacity = '1';
    badge.style.pointerEvents = 'none';

    player.appendChild(badge);

    setTimeout(() => {
        badge.style.opacity = '0';
        setTimeout(() => badge.remove(), 500);
    }, 1500);
}

function simulateTrustedClick(element) {
    try {
        const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        events.forEach(eventType => {
            const event = new MouseEvent(eventType, {
                bubbles: true,
                cancelable: true,
                view: window,
                buttons: 1
            });
            element.dispatchEvent(event);
        });
    } catch (error) {
        if (typeof element.click === 'function') element.click();
    }
}

function attemptSkipAd() {
    try {
        const adContainer = document.querySelector('.ad-showing, .ad-interrupting, .html5-video-player.ad-showing');
        let skipped = false;

        if (adContainer) {
            const video = document.querySelector('video.html5-main-video');
            if (video && isFinite(video.duration) && video.duration > 0) {
                video.currentTime = video.duration;
            }
        }

        for (const selector of SKIP_BUTTON_SELECTORS) {
            const button = document.querySelector(selector);
            if (button) {
                const now = Date.now();
                if (now - lastClickTime > 500) {
                    lastClickTime = now;
                    simulateTrustedClick(button);
                    skipped = true;
                }
            }
        }

        if (skipped) {
            chrome.runtime.sendMessage({ action: 'adSkipped' }).catch(() => {});
            showDestructionBadge();
        }
    } catch (err) {
        console.error('[YouTube Adblocker] Error in attemptSkipAd:', err);
    }
}

const observer = new MutationObserver((mutationsList, observer) => {
    attemptSkipAd();
});

function initObserver() {
    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
        attemptSkipAd();
    } else {
        requestAnimationFrame(initObserver);
    }
}

window.addEventListener('yt-navigate-finish', () => {
    attemptSkipAd();
});

// Comprobar estado inicial en el Storage (Motor y Tema)
chrome.storage.local.get(['adSkipperEnabled', 'playerTheme'], (data) => {
    const isEnabled = data.adSkipperEnabled !== false;
    const themeColor = data.playerTheme || '#d4af37'; // Dorado por defecto

    applyPlayerTheme(themeColor);

    if (isEnabled) {
        initObserver();
    }
});

// Escuchar cambios desde el Popup en tiempo real
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.adSkipperEnabled) {
            if (changes.adSkipperEnabled.newValue) {
                initObserver();
            } else {
                observer.disconnect();
            }
        }

        if (changes.playerTheme) {
            applyPlayerTheme(changes.playerTheme.newValue);
        }
    }
});
