// ─────────────────────────────────────────────────────────────
// Nexus PRO — background service worker (MV3)  [PATCH 20.6.0]
//
// Único propósito: expor a API chrome.browsingData para a limpeza profunda
// disparada pelo botão "Atualizar" da extensão. O content script (ISOLATED)
// faz a ponte entre a página (MAIN world) e este worker.
//
// REGRA DE SEGURANÇA DE SESSÃO: NUNCA removemos cookies nem localStorage.
// Isso mantém o usuário logado no Lovable (e a licença Nexus intacta) —
// limpamos apenas caches que causam bundle/chunk velho:
//   • cacheStorage  (Cache API / SW)
//   • indexedDB     (estado persistido de terceiros)
//   • serviceWorkers(registros que servem HTML/JS antigo)
//   • cache         (HTTP cache — global, não aceita `origins`)
// ─────────────────────────────────────────────────────────────

const NX_ORIGINS = [
  "https://lovable.dev",
  "https://gptengineer.app",
];

function removeScoped(origins) {
  return new Promise((resolve) => {
    try {
      chrome.browsingData.remove(
        { origins: origins, since: 0 },
        { cacheStorage: true, indexedDB: true, serviceWorkers: true },
        () => resolve(!chrome.runtime.lastError)
      );
    } catch (_) { resolve(false); }
  });
}

function removeHttpCache() {
  return new Promise((resolve) => {
    try {
      chrome.browsingData.remove({ since: 0 }, { cache: true }, () =>
        resolve(!chrome.runtime.lastError)
      );
    } catch (_) { resolve(false); }
  });
}

async function deepClean(extraOrigin) {
  const origins = NX_ORIGINS.slice();
  if (extraOrigin && origins.indexOf(extraOrigin) === -1) origins.push(extraOrigin);
  const scoped = await removeScoped(origins);
  const http = await removeHttpCache();
  return { scoped: scoped, httpCache: http };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "NX_DEEP_CLEAN") return false;
  deepClean(msg.origin)
    .then((r) => sendResponse({ ok: true, detail: r }))
    .catch(() => sendResponse({ ok: false }));
  return true; // resposta assíncrona
});