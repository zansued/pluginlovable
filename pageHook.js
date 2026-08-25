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

// ─── Direct Monaco Editor & Vite Live Injector Bridge ───────────────────────
function tryClickFileInSidebar(filePath) {
  try {
    if (!filePath) return false;
    const fileName = filePath.split('/').pop().toLowerCase();
    const allNodes = document.querySelectorAll('div, span, button, li, p');
    for (const node of allNodes) {
      if (node.children.length === 0 && node.textContent.trim().toLowerCase() === fileName) {
        const clickable = node.closest('button, [role="button"], div[tabindex], div[class*="file"], div[class*="item"]') || node;
        clickable.click();
        console.log("[Infinity Claude AI] 📂 Arquivo selecionado na barra lateral:", fileName);
        return true;
      }
    }
  } catch (_) {}
  return false;
}

function injectCodeIntoEditor(filePath, codeContent) {
  try {
    if (!codeContent) return { success: false, error: 'Código vazio' };

    console.group('%c ⚡ INFINITY CLAUDE AI %c INJEÇÃO DE CÓDIGO NO EDITOR ', 'background:#1e1035;color:#c4b5fd;font-weight:bold;', 'background:#10b981;color:#fff;font-weight:bold;');
    console.log(`%c  ↳ Arquivo Alvo: %c${filePath || 'src/components/App.tsx'}`, 'color:#94a3b8;', 'color:#38bdf8;font-weight:bold;');
    console.log(`%c  ↳ Tamanho     : %c${codeContent.length} caracteres`, 'color:#94a3b8;', 'color:#facc15;font-weight:bold;');

    // 1. Tenta clicar no arquivo na barra lateral para abri-lo
    if (filePath) {
      tryClickFileInSidebar(filePath);
    }

    // 2. Tenta injetar no Monaco Editor
    if (window.monaco && window.monaco.editor) {
      const models = window.monaco.editor.getModels();
      let targetModel = null;

      if (models && models.length > 0) {
        if (filePath) {
          const cleanPath = filePath.replace(/^[./\\]+/, '').toLowerCase();
          const fileName = filePath.split('/').pop().toLowerCase();
          targetModel = models.find(m => m.uri && m.uri.path && (m.uri.path.toLowerCase().includes(cleanPath) || m.uri.path.toLowerCase().endsWith('/' + fileName)));
        }
        if (!targetModel) {
          const editors = window.monaco.editor.getEditors();
          if (editors && editors.length > 0) {
            targetModel = editors[0].getModel();
          }
        }
      }

      if (targetModel) {
        targetModel.setValue(codeContent);

        // Aplica também via executeEdits nos editores visíveis
        const editors = window.monaco.editor.getEditors();
        for (const ed of editors) {
          try {
            ed.executeEdits('infinity-ai', [{
              range: ed.getModel().getFullModelRange(),
              text: codeContent,
              forceMoveMarkers: true
            }]);
            ed.pushUndoStop();
          } catch (_) {}
        }

        console.log("[Infinity Claude AI] ✅ Código aplicado com sucesso no Monaco Editor:", targetModel.uri?.path || filePath);

        // Dispara recarregamento no Vite Devserver
        try {
          const iframes = document.querySelectorAll('iframe');
          iframes.forEach((ifr) => {
            if (ifr.contentWindow) {
              ifr.contentWindow.postMessage({ type: 'vite:invalidate', path: filePath }, '*');
              ifr.contentWindow.postMessage({ type: 'full-reload' }, '*');
            }
          });
        } catch (_) {}

        console.groupEnd();
        return { success: true, method: 'monaco_model', path: targetModel.uri?.path || filePath };
      }
    }

    // 3. Fallback: DOM Textarea in Active Editor
    const textareas = document.querySelectorAll('.monaco-editor textarea, [data-editor-id] textarea, textarea.inputarea, .view-lines');
    for (const ta of textareas) {
      if (ta.tagName === 'TEXTAREA' && ta.offsetParent !== null) {
        ta.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, codeContent);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("[Infinity Claude AI] ⚡ Código injetado via DOM execCommand.");
        console.groupEnd();
        return { success: true, method: 'dom_textarea' };
      }
    }

    console.groupEnd();
  } catch (err) {
    console.error("[Infinity Claude AI] Erro ao injetar código:", err);
    return { success: false, error: err.message };
  }
  return { success: false, error: 'Editor não encontrado' };
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
