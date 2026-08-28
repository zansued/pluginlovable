// Dev. OppsEvo
(() => {
  if (window.__LL_PAGE_BRIDGE_READY__) return;
  window.__LL_PAGE_BRIDGE_READY__ = true;

  // ─── Token Capture (intercepts fetch/XHR to grab Lovable auth token) ────────
  let capturedToken = null;
  let capturedProjectId = null;

  function extractProjectId(url) {
    try {
      const m = String(url).match(/projects\/([0-9a-fA-F-]{36})/i);
      return m ? m[1] : null;
    } catch (e) { return null; }
  }

  function notifyTokenFound(token, projectId, force) {
    const newProject = projectId || extractProjectId(window.location.pathname);
    const normalized = typeof token === 'string' ? token.replace(/^Bearer\s+/i, '').trim() : null;
    let changed = false;
    if (normalized && normalized !== capturedToken) { capturedToken = normalized; changed = true; }
    if (newProject && newProject !== capturedProjectId) { capturedProjectId = newProject; changed = true; }
    if (!changed && !force) return;
    window.postMessage({ type: 'LL_TOKEN_CAPTURED', token: capturedToken, projectId: capturedProjectId }, '*');
  }

  // Listen for explicit token request from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'LL_REQUEST_TOKEN') {
      notifyTokenFound(capturedToken, capturedProjectId, true);
    }
  });

  // Wrap fetch to capture Authorization headers
  try {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        let reqUrl = typeof args[0] === 'string' ? args[0] : ((args[0] && args[0].url) || '');
        let opts = args[1] || {};
        let auth = null;
        if (args[0] instanceof Request) {
          reqUrl = args[0].url || reqUrl;
          auth = (args[0].headers && typeof args[0].headers.get === 'function')
            ? (args[0].headers.get('Authorization') || args[0].headers.get('authorization'))
            : null;
        }
        if (opts.headers) {
          if (opts.headers instanceof Headers) auth = opts.headers.get('Authorization');
          else if (typeof opts.headers === 'object') auth = opts.headers.Authorization || opts.headers.authorization;
        }
        const pid = extractProjectId(reqUrl);
        if (auth && auth.startsWith('Bearer ')) {
          notifyTokenFound(auth.slice(7), pid);
        }
      } catch (e) {}
      return originalFetch.apply(this, args);
    };
  } catch (e) {}

  // Wrap XHR to capture Authorization headers
  try {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function (method, url) {
      this._ll_url = url;
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      if (name && name.toLowerCase() === 'authorization' && value && value.startsWith('Bearer ')) {
        notifyTokenFound(value.slice(7), extractProjectId(this._ll_url));
      }
      return origSetHeader.apply(this, arguments);
    };
  } catch (e) {}

  // Periodically check project ID from URL
  setInterval(() => {
    const p = extractProjectId(window.location.pathname);
    if (p && p !== capturedProjectId) {
      capturedProjectId = p;
      window.postMessage({ type: 'LL_TOKEN_CAPTURED', token: capturedToken, projectId: p }, '*');
    }
  }, 1500);

  // ─── Page Fetch Proxy (existing functionality) ──────────────────────────────
  window.addEventListener('message', async (event) => {
    const data = event.data || {};
    if (event.source !== window) return;
    if (data.type !== 'LL_PAGE_FETCH') return;

    const { requestId, url, options } = data;
    try {
      const resp = await fetch(url, {
        method: options?.method || 'GET',
        headers: options?.headers || {},
        body: options?.body || undefined,
        credentials: 'include',
      });
      const body = await resp.text();
      window.postMessage({
        type: 'LL_PAGE_FETCH_RESULT',
        requestId,
        ok: resp.ok,
        status: resp.status,
        body
      }, '*');
    } catch (err) {
      window.postMessage({
        type: 'LL_PAGE_FETCH_RESULT',
        requestId,
        ok: false,
        status: 0,
        body: JSON.stringify({ error: err?.message || 'page fetch failed' })
      }, '*');
    }
  });

  // ─── Unified CodeMirror 6 & Monaco Bridge ─────────────────────────────────
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === '__INFINITY_APPLY_CODE_TO_EDITOR__') {
      const { path, code, requestId } = event.data;
      if (typeof window.injectCodeIntoEditor === 'function') {
        const result = window.injectCodeIntoEditor(path, code);
        window.postMessage({
          type: '__INFINITY_CODE_APPLIED_RESULT__',
          requestId,
          result
        }, '*');
      }
    }
  });
})();
