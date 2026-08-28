// Dev. OppsEvo & Infinity Claude AI
(function () {
console.log("[LovifyHook] Iniciando");

let capturedToken = null;
let capturedProjectId = null;

function lovifySafePostMessage(payload){
  try { window.postMessage(payload, "*"); } catch(e) {}
}

function lovifyHeadersToObject(headers){
  const out = {};
  try{
    if(!headers) return out;
    if(headers instanceof Headers){ headers.forEach((v,k)=>{ out[k]=v; }); return out; }
    if(Array.isArray(headers)){ headers.forEach(([k,v])=>{ out[String(k)]=String(v); }); return out; }
    if(typeof headers === "object"){
      Object.keys(headers).forEach(k=>{ out[k]=headers[k]; });
    }
  }catch(e){}
  return out;
}

function lovifyLooksLikePublishUrl(url){
  const u = String(url || "").toLowerCase();
  return /api\.lovable\.dev/.test(u) && /(publish|published|deploy|deployment|website|hosting)/.test(u);
}

function lovifyCapturePublishRequest(url, method, headers, body){
  try{
    if(!lovifyLooksLikePublishUrl(url)) return;
    const m = String(method || "GET").toUpperCase();
    if(!/^(POST|PUT|PATCH)$/i.test(m)) return;
    const h = lovifyHeadersToObject(headers);
    const pid = extractProjectIdFromUrl(url) || getProjectFromPage() || capturedProjectId;
    lovifySafePostMessage({
      type: "LOVIFY_PUBLISH_REQUEST_CAPTURED",
      url: String(url || ""),
      method: m,
      headers: h,
      body: (typeof body === "string" ? body : (body == null ? null : String(body))),
      projectId: pid,
      at: Date.now()
    });
  }catch(e){}
}

function getProjectFromPage(){
  try{
    const m = window.location.pathname.match(/projects\/([0-9a-fA-F-]{36})/i);
    return m ? m[1] : null;
  }catch{ return null; }
}

function extractProjectIdFromUrl(url){
  try{
    const m = String(url).match(/projects\/([0-9a-fA-F-]{36})/i);
    return m ? m[1] : null;
  }catch{ return null; }
}

function notifyFound(token, projectId, force = false){
  const newProject = projectId || getProjectFromPage();
  const normalizedToken = typeof token === "string" ? token.replace(/^Bearer\s+/i, "").trim() : null;
  let changed = false;
  if(normalizedToken && normalizedToken !== capturedToken){ capturedToken = normalizedToken; changed = true; }
  if(newProject && newProject !== capturedProjectId){ capturedProjectId = newProject; changed = true; }
  if(!changed && !force) return;
  console.log("[LovifyHook] ✅ Token capturado!", capturedToken || "null");
  console.log("[LovifyHook] ProjectId:", capturedProjectId);
  window.postMessage({ type:"lovableTokenFound", token:capturedToken, projectId:capturedProjectId },"*");
}

window.addEventListener("message", (event)=>{
  if(event.source !== window) return;
  if(!event.data || event.data.type !== "lovableRequestToken") return;
  notifyFound(capturedToken, getProjectFromPage() || capturedProjectId, true);
});

// ─── Direct CodeMirror & Monaco Injector Bridge ──────────────────────────────
function tryOpenCodeView() {
  try {
    const allButtons = Array.from(document.querySelectorAll('button, [role="tab"], div[role="button"], a'));
    for (const btn of allButtons) {
      const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
      const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      const hasCodeSvg = btn.querySelector('svg.lucide-code, svg[class*="code"], svg[data-icon="code"]');

      if (
        text === 'code' ||
        text === 'código' ||
        text.startsWith('code ') ||
        aria.includes('code') ||
        aria.includes('editor') ||
        hasCodeSvg
      ) {
        if (!btn.disabled && btn.getAttribute('data-state') !== 'active' && btn.getAttribute('aria-selected') !== 'true') {
          btn.click();
          console.log("[Infinity Claude AI] 🖥️ Alternado para visualização de Código via:", text || aria || 'SVG Code');
          return true;
        }
      }
    }
  } catch (_) {}
  return false;
}

function tryExpandParentFolders(filePath) {
  try {
    if (!filePath) return;
    const parts = filePath.split('/');
    parts.pop(); // Remove o nome do arquivo
    const allNodes = document.querySelectorAll('div, span, button, li, p');
    for (const folder of parts) {
      for (const node of allNodes) {
        const text = (node.textContent || '').trim().toLowerCase();
        if (text === folder.toLowerCase()) {
          const clickable = node.closest('button, [role="button"], div[tabindex], div[class*="folder"], div[class*="item"], div[class*="tree"]') || node;
          clickable.click();
          break;
        }
      }
    }
  } catch (_) {}
}

function tryClickFileInSidebar(filePath) {
  try {
    if (!filePath) return false;
    tryExpandParentFolders(filePath);
    const fileName = filePath.split('/').pop().toLowerCase();
    const allNodes = document.querySelectorAll('div, span, button, li, p, a');
    for (const node of allNodes) {
      const text = (node.textContent || '').trim().toLowerCase();
      if (node.children.length <= 1 && (text === fileName || text.endsWith(fileName))) {
        const clickable = node.closest('button, [role="button"], div[tabindex], div[class*="file"], div[class*="item"], [role="treeitem"]') || node;
        clickable.click();
        console.log("[Infinity Claude AI] 📂 Arquivo selecionado na barra lateral:", fileName);
        return true;
      }
    }
  } catch (_) {}
  return false;
}

function safeCopyToClipboard(text) {
  try {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  } catch (_) {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.left = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    ta.remove();
  } catch (_) {}
}

function applyDirectToCodeMirror(codeContent, filePath) {
  // 1. Instância CodeMirror 6 no editor ativo
  const cmEditors = Array.from(document.querySelectorAll('.cm-editor'));
  const visibleEditor = cmEditors.find(ed => ed.offsetParent !== null) || cmEditors[0];
  
  if (visibleEditor) {
    try {
      const view = (visibleEditor.cmView && visibleEditor.cmView.view) || visibleEditor.CodeMirror;
      if (view && typeof view.dispatch === 'function' && view.state) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: codeContent }
        });
        console.log("[Infinity Claude AI] ✅ Código aplicado com sucesso via CodeMirror 6 EditorView:", filePath || 'editor ativo');
        return true;
      }
    } catch (_) {}
  }

  // 2. DOM ContentEditable no CodeMirror ativo
  const cmContents = Array.from(document.querySelectorAll('.cm-editor .cm-content[contenteditable="true"], .cm-content'));
  const visibleContent = cmContents.find(el => el.offsetParent !== null) || cmContents[0];
  if (visibleContent) {
    try {
      visibleContent.focus();
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(visibleContent);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, codeContent);
      visibleContent.dispatchEvent(new Event('input', { bubbles: true }));
      visibleContent.dispatchEvent(new Event('change', { bubbles: true }));
      console.log("[Infinity Claude AI] ⚡ Código injetado no DOM ContentEditable do CodeMirror!");
      return true;
    } catch (_) {}
  }

  // 3. Monaco Editor Models (Se disponível)
  if (window.monaco && window.monaco.editor) {
    const models = window.monaco.editor.getModels();
    if (models && models.length > 0) {
      let targetModel = null;
      if (filePath) {
        const cleanPath = filePath.replace(/^[./\\]+/, '').toLowerCase();
        targetModel = models.find(m => m.uri && m.uri.path && m.uri.path.toLowerCase().includes(cleanPath));
      }
      if (!targetModel) targetModel = models[0];
      if (targetModel) {
        targetModel.setValue(codeContent);
        console.log("[Infinity Claude AI] ✅ Código aplicado via Monaco Editor Model:", filePath);
        return true;
      }
    }
  }

  return false;
}

window.injectCodeIntoEditor = function injectCodeIntoEditor(filePath, codeContent) {
  try {
    if (!codeContent) return { success: false, error: 'Código vazio' };

    console.group('%c ⚡ INFINITY CLAUDE AI %c INJEÇÃO DE CÓDIGO NO EDITOR ', 'background:#1e1035;color:#c4b5fd;font-weight:bold;', 'background:#10b981;color:#fff;font-weight:bold;');
    console.log(`%c  ↳ Arquivo Alvo: %c${filePath || 'Editor Ativo'}`, 'color:#94a3b8;', 'color:#38bdf8;font-weight:bold;');
    console.log(`%c  ↳ Tamanho     : %c${codeContent.length} caracteres`, 'color:#94a3b8;', 'color:#facc15;font-weight:bold;');

    // 0. Garante que o código fica no clipboard imediatamente
    safeCopyToClipboard(codeContent);

    // 1. Tenta abrir a visualização de código se estiver em preview
    tryOpenCodeView();

    // 2. Se o arquivo existir na barra lateral, tenta selecionar uma única vez
    if (filePath) {
      tryClickFileInSidebar(filePath);
    }

    // 3. Aplica diretamente no editor CodeMirror visível
    let applied = applyDirectToCodeMirror(codeContent, filePath);
    
    if (!applied) {
      setTimeout(() => {
        tryOpenCodeView();
        if (filePath) tryClickFileInSidebar(filePath);
        applied = applyDirectToCodeMirror(codeContent, filePath);
        if (applied) {
          triggerSaveAndReload(filePath);
        }
      }, 300);
    } else {
      triggerSaveAndReload(filePath);
    }

    console.groupEnd();
    return { success: true, method: applied ? 'codemirror_6' : 'clipboard_ready', path: filePath };
  } catch (err) {
    console.groupEnd();
    return { success: false, error: err.message };
  }
};

function triggerSaveAndReload(filePath) {
  try {
    const cmContent = document.querySelector('.cm-content');
    if (cmContent) {
      cmContent.dispatchEvent(new KeyboardEvent('keydown', { key: 's', code: 'KeyS', ctrlKey: true, bubbles: true }));
      cmContent.dispatchEvent(new KeyboardEvent('keydown', { key: 's', code: 'KeyS', metaKey: true, bubbles: true }));
      cmContent.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  } catch (_) {}

  try {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((ifr) => {
      if (ifr.contentWindow) {
        ifr.contentWindow.postMessage({ type: 'vite:invalidate', path: filePath }, '*');
        ifr.contentWindow.postMessage({ type: 'full-reload' }, '*');
      }
    });
  } catch (_) {}
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== "__INFINITY_APPLY_CODE_TO_EDITOR__") return;
  const { path, code, requestId } = event.data;
  const result = injectCodeIntoEditor(path, code);
  window.postMessage({
    type: "__INFINITY_CODE_APPLIED_RESULT__",
    requestId,
    result
  }, "*");
});

(function wrapFetch(){
  try{
    const originalFetch = window.fetch;
    window.fetch = async function(...args){
      try{
        let reqUrl = typeof args[0] === "string" ? args[0] : ((args[0] && args[0].url) || "");
        let opts = args[1] || {};
        let auth = null;
        if(args[0] instanceof Request){
          reqUrl = args[0].url || reqUrl;
          auth = (args[0].headers && typeof args[0].headers.get === "function") ? (args[0].headers.get("Authorization") || args[0].headers.get("authorization")) : null;
        }
        if(opts.headers){
          if(opts.headers instanceof Headers) auth = opts.headers.get("Authorization");
          else if(typeof opts.headers === "object") auth = opts.headers.Authorization || opts.headers.authorization;
        }
        const pid = extractProjectIdFromUrl(reqUrl);
        if(auth && auth.startsWith("Bearer ")){
          const rawToken = auth.slice(7);
          notifyFound(rawToken, pid);
        }
        const hdrs = (args[0] instanceof Request) ? args[0].headers : (opts && opts.headers);
        const method = (args[0] instanceof Request) ? (args[0].method || opts.method || "GET") : (opts.method || "GET");
        const body = (args[0] instanceof Request) ? (opts.body || null) : (opts.body || null);
        lovifyCapturePublishRequest(reqUrl, method, hdrs, body);
      }catch(e){}
      return originalFetch.apply(this,args);
    };
  }catch(e){ console.warn("[LovifyHook] erro fetch",e); }
})();

(function wrapXHR(){
  try{
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method,url){
      this._lovable_method = method;
      this._lovable_url = url;
      this._lovable_headers = this._lovable_headers || {};
      return origOpen.apply(this,arguments);
    };
    XMLHttpRequest.prototype.setRequestHeader = function(name,value){
      try { this._lovable_headers = this._lovable_headers || {}; this._lovable_headers[name] = value; } catch(e) {}
      if(name && name.toLowerCase()==="authorization" && value && value.startsWith("Bearer ")){
        const rawToken = value.slice(7);
        notifyFound(rawToken, extractProjectIdFromUrl(this._lovable_url));
      }
      return origSetHeader.apply(this,arguments);
    };
    XMLHttpRequest.prototype.send = function(body){
      try { lovifyCapturePublishRequest(this._lovable_url, this._lovable_method || "POST", this._lovable_headers || {}, body); } catch(e) {}
      return origSend.apply(this, arguments);
    };
  }catch(e){ console.warn("[LovifyHook] erro xhr",e); }
})();

setInterval(()=>{
  const p = getProjectFromPage();
  if(p && p !== capturedProjectId){
    capturedProjectId = p;
    window.postMessage({ type:"lovableTokenFound", token:capturedToken, projectId:p },"*");
  }
},1500);

})();
