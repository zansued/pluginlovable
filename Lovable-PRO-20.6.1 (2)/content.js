// ─────────────────────────────────────────────────────────────
// Nexus PRO — content script (ISOLATED world, document_start)  [PATCH 20.5.23]
// Bundles são 100% REMOTOS: o content script publica apenas metadados de marca
// (versão, nome, ícone, site). Nenhuma URL de core local é exposta — payload.js
// carrega o core exclusivamente de /_dist.
// ─────────────────────────────────────────────────────────────

(function injectPayload() {
  // [PATCH 20.5.22] Antes saíamos cedo em QUALQUER subframe (fix de sidebar
  // duplicada do 20.5.11) — isso deixava iframes de lovable.dev sem nenhum
  // guard de rede, um caminho de escape para POST de chat. Agora injetamos o
  // payload também em subframes: o próprio payload instala apenas o guard e
  // aborta o boot de UI/core fora do top frame.

  var MAX_ATTEMPTS = 20;
  var attempts = 0;

  // [PATCH 20.5.9] Sem inline <script> — o CSP do Lovable (script-src 'self') bloqueia
  // qualquer textContent. Publicamos versão + coreUrl como data-* em <html>, e o
  // payload.js (MAIN world) lê essas atributos antes de qualquer coisa.
  function injectInlineMeta() {
    try {
      var manifest = chrome.runtime.getManifest && chrome.runtime.getManifest();
      var version = (manifest && manifest.version) || "20.6.0";
      // Metadados de marca vindos do manifest (nome, ícone e site de suporte).
      // A UI de ativação lê estes data-* para se manter white-label.
      var extName = (manifest && manifest.name) || "";
      var homeUrl = (manifest && manifest.homepage_url) || "";
      var iconUrl = "";
      try {
        var iconRel = manifest && manifest.icons
          ? (manifest.icons["128"] || manifest.icons["48"] || manifest.icons["16"])
          : null;
        if (iconRel) iconUrl = chrome.runtime.getURL(iconRel);
      } catch (_) {}
      var root = document.documentElement;
      if (root && root.setAttribute) {
        root.setAttribute("data-nexus-ext-version", version);
        // [PATCH 20.6.0] Sinaliza ao core que este instalador tem a permissão
        // browsingData (limpeza profunda). Instaladores antigos não publicam
        // este atributo → o core cai no fallback (limpeza só via JS da página).
        try {
          var hasBD = !!(chrome.browsingData ||
            (manifest && manifest.permissions &&
             manifest.permissions.indexOf("browsingData") !== -1));
          if (hasBD) root.setAttribute("data-nexus-ext-deepclean", "1");
        } catch (_) {}
        if (extName) root.setAttribute("data-nexus-ext-name", extName);
        if (iconUrl) root.setAttribute("data-nexus-ext-icon", iconUrl);
        if (homeUrl) root.setAttribute("data-nexus-ext-home", homeUrl);
      }
    } catch (_) {}
  }

  function tryInject() {
    var host = document.head || document.documentElement || document.body;
    if (!host) {
      if (++attempts >= MAX_ATTEMPTS) {
        document.addEventListener("DOMContentLoaded", tryInject, { once: true });
        return;
      }
      if (typeof queueMicrotask === "function") queueMicrotask(tryInject);
      else Promise.resolve().then(tryInject);
      return;
    }

    try {
      injectInlineMeta();
      var script = document.createElement("script");
      script.src = chrome.runtime.getURL("payload.js");
      // Blocking + prepend: payload.js instala o GUARD SÍNCRONO de fetch/XHR
      // ANTES de qualquer bundle da página capturar window.fetch. É o guard —
      // não o core — que agora garante a interceptação já no document_start.
      script.async = false;
      script.defer = false;
      script.onload = function () { this.remove(); };
      if (host.firstChild) host.insertBefore(script, host.firstChild);
      else host.appendChild(script);
    } catch (_) { /* noop */ }
  }

  tryInject();
})();

window.addEventListener("message", function (event) {
  if (event.source !== window) return;
  const TOKEN_KEY = "lovable_pro_license";
  if (event.data && event.data.type === "NEXXUS_CHECK_TOKEN") {
    chrome.storage.local.get([TOKEN_KEY], function (result) {
      let token = result[TOKEN_KEY] || null;
      try { if (!token) token = localStorage.getItem(TOKEN_KEY); } catch (_) {}
      window.postMessage({ type: "NEXXUS_TOKEN_READY", token: token }, "*");
    });
  }
  if (event.data && event.data.type === "NEXXUS_SAVE_TOKEN") {
    chrome.storage.local.set({ [TOKEN_KEY]: event.data.token });
    try { localStorage.setItem(TOKEN_KEY, event.data.token); } catch (_) {}
  }

  // [PATCH 20.6.0] Ponte de limpeza profunda (chrome.browsingData).
  // A página não pode chamar chrome.* — ela pede aqui e nós repassamos ao
  // service worker. Sempre respondemos (mesmo em falha) para o core não
  // ficar preso esperando antes do reload.
  if (event.data && event.data.source === "nexus-pro" && event.data.type === "NX_DEEP_CLEAN") {
    var reqId = event.data.reqId || null;
    var reply = function (ok, detail) {
      try {
        window.postMessage(
          { source: "nexus-pro-ext", type: "NX_DEEP_CLEAN_DONE", reqId: reqId, ok: !!ok, detail: detail || null },
          "*"
        );
      } catch (_) {}
    };
    try {
      chrome.runtime.sendMessage(
        { type: "NX_DEEP_CLEAN", origin: location.origin },
        function (res) {
          if (chrome.runtime.lastError) return reply(false);
          reply(res && res.ok, res && res.detail);
        }
      );
    } catch (_) { reply(false); }
  }

  // Limpeza do chrome.storage.local preservando a licença/sessão.
  if (event.data && event.data.source === "nexus-pro" && event.data.type === "NX_CLEAR_EXT_STORAGE") {
    try {
      chrome.storage.local.get(null, function (all) {
        var keep = {};
        if (all && all[TOKEN_KEY]) keep[TOKEN_KEY] = all[TOKEN_KEY];
        chrome.storage.local.clear(function () {
          if (keep[TOKEN_KEY]) chrome.storage.local.set(keep);
        });
      });
    } catch (_) {}
  }
});
