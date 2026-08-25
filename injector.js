/* ============================================================================
 * Infinity Claude AI - Content Script Injector v5.1.0
 * ============================================================================ */

(function () {
  console.log("[Infinity Claude AI] Injector Script v5.1.0 loaded.");

  // Listen for configuration updates or options from Extension Popup / Background
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request && request.action === 'PING') {
        sendResponse({ status: 'OK', version: '5.1.0' });
      }
    });
  }
})();