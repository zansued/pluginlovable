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

  // ─── Direct Monaco Editor Code Injector ─────────────────────────────────────
  function injectCodeIntoEditor(filePath, codeContent) {
    try {
      if (!codeContent) return { success: false, error: 'Código vazio' };

      // 1. Monaco Editor Models
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          let targetModel = null;
          if (filePath) {
            const cleanPath = filePath.replace(/^[./\\]+/, '').toLowerCase();
            targetModel = models.find(m => m.uri && m.uri.path && m.uri.path.toLowerCase().includes(cleanPath));
          }
          if (!targetModel) {
            const editors = window.monaco.editor.getEditors();
            if (editors && editors.length > 0) {
              targetModel = editors[0].getModel();
            } else {
              targetModel = models[0];
            }
          }
          if (targetModel) {
            targetModel.setValue(codeContent);
            return { success: true, method: 'monaco_model', path: targetModel.uri?.path || filePath };
          }
        }
      }

      // 2. DOM Textarea Fallback
      const textareas = document.querySelectorAll('.monaco-editor textarea, [data-editor-id] textarea, textarea.inputarea');
      for (const ta of textareas) {
        if (ta.offsetParent !== null) {
          ta.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, codeContent);
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, method: 'dom_textarea' };
        }
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Editor não encontrado' };
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.type !== '__INFINITY_APPLY_CODE_TO_EDITOR__') return;
    const { path, code, requestId } = event.data;
    const result = injectCodeIntoEditor(path, code);
    window.postMessage({
      type: '__INFINITY_CODE_APPLIED_RESULT__',
      requestId,
      result
    }, '*');
  });
})();
