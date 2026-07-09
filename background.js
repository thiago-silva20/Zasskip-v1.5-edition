/**
 * background.js
 * Service worker for persistent stats.
 */

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['adSkipperEnabled', 'adsSkippedCount'], (data) => {
        if (data.adSkipperEnabled === undefined) {
            chrome.storage.local.set({ adSkipperEnabled: true });
        }
        if (data.adsSkippedCount === undefined) {
            chrome.storage.local.set({ adsSkippedCount: 0 });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'adSkipped') {
        chrome.storage.local.get(['adsSkippedCount'], (data) => {
            const newCount = (data.adsSkippedCount || 0) + 1;
            chrome.storage.local.set({ adsSkippedCount: newCount });
        });
    }
});
