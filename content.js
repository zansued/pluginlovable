// Dev. OppsEvo

/* Neturno visual patch — troca somente o rótulo exibido pelo Lovable, sem alterar o texto do prompt. */
(function neturnoVisualLabelPatch(){
  try{
    if(window.__NETURNO_VISUAL_LABEL_PATCH__) return;
    window.__NETURNO_VISUAL_LABEL_PATCH__ = true;
    var BRAND_NAME = 'Netuno';
    var SENDER_LABEL = 'Enviado por ⚡ Netuno';
    var SOURCE_LABELS = [
      'Try to fix SEO issue: Meta Description',
      'Fix error',
      'Fix build error',
      'Resolve error',
      'Visual Edit',
      'Visual edit',
      'Fast Visual Edit',
      'Fast Visual edit'
    ];
    window.NETUNO_BRAND_NAME = BRAND_NAME;
    window.NETUNO_SENDER_LABEL = SENDER_LABEL;

    function normalize(value){
      return String(value || '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    }
    var SOURCE_NORMALIZED = SOURCE_LABELS.map(normalize);
    function escapeRegex(value){ return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function replaceVisualText(value){
      if(typeof value !== 'string' || !value) return value;
      var out = value;
      SOURCE_LABELS.forEach(function(label){
        out = out.replace(new RegExp(escapeRegex(label), 'gi'), SENDER_LABEL);
      });
      out = out.replace(/Enviado\s+por\s*⚡?\s*(?:TS\s*Community|Lov\s*3|LOV\s*3|LOVIFY\.IA|Netuno\s*Lovable|Netuno|Neturno)/gi, SENDER_LABEL);
      return out;
    }
    function patchTextNode(node){
      try{
        if(!node || node.nodeType !== 3) return;
        var oldVal = node.nodeValue || '';
        var newVal = replaceVisualText(oldVal);
        if(newVal !== oldVal) node.nodeValue = newVal;
      }catch(e){}
    }
    function patchElement(el){
      try{
        if(!el || el.nodeType !== 1) return;
        ['title','aria-label','alt','data-label'].forEach(function(attr){
          try{
            if(el.hasAttribute && el.hasAttribute(attr)){
              var oldVal = el.getAttribute(attr);
              var newVal = replaceVisualText(oldVal);
              if(newVal !== oldVal) el.setAttribute(attr, newVal);
            }
          }catch(e){}
        });
        // O Lovable pode dividir o rótulo em vários spans. Neste caso, troca o
        // conteúdo apenas quando o texto completo do elemento corresponde ao rótulo.
        var full = normalize(el.textContent || '');
        if(SOURCE_NORMALIZED.indexOf(full) !== -1 && (el.childElementCount || 0) <= 8){
          el.textContent = SENDER_LABEL;
          el.setAttribute('data-neturno-sender-label', 'true');
        }
        try{ if(el.shadowRoot) patchTree(el.shadowRoot); }catch(e){}
      }catch(e){}
    }
    function patchTree(root){
      try{
        if(!root) return;
        if(root.nodeType === 3){ patchTextNode(root); return; }
        if(root.nodeType === 1) patchElement(root);
        if(root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
        var node;
        while((node = walker.nextNode())){
          if(node.nodeType === 3) patchTextNode(node);
          else if(node.nodeType === 1) patchElement(node);
        }
      }catch(e){}
    }
    function startPatch(){
      try{
        patchTree(document.body || document.documentElement);
        var observer = new MutationObserver(function(mutations){
          mutations.forEach(function(m){
            try{
              if(m.type === 'characterData') patchTextNode(m.target);
              if(m.type === 'attributes') patchElement(m.target);
              if(m.addedNodes && m.addedNodes.length) m.addedNodes.forEach(function(n){ patchTree(n); });
            }catch(e){}
          });
        });
        observer.observe(document.documentElement || document.body, {
          childList:true, subtree:true, characterData:true, attributes:true,
          attributeFilter:['title','aria-label','alt','data-label']
        });
        var attempts = 0;
        var fastTimer = setInterval(function(){
          patchTree(document.body || document.documentElement);
          if(++attempts > 80) clearInterval(fastTimer);
        }, 250);
      }catch(e){}
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startPatch, {once:true});
    else startPatch();
  }catch(e){}
})();


// LOVIFY PATCH - Mensagem amigável de limite diário
window.LOVIFY_RATE_LIMIT_MESSAGE =
'Limite diário excedido pelo Lovable. Tente novamente mais tarde.';

(function(){
  try{
    if(!window.__LOVIFY_MAC_TOKEN_HOOK__){
      window.__LOVIFY_MAC_TOKEN_HOOK__=true;

      // Publicar metadados de extensão em document.documentElement (Nexus PRO & Infinity)
      try {
        var manifest = (chrome.runtime && chrome.runtime.getManifest) ? chrome.runtime.getManifest() : null;
        var version = (manifest && manifest.version) || "20.6.1";
        var root = document.documentElement;
        if (root && root.setAttribute) {
          root.setAttribute("data-nexus-ext-version", version);
          root.setAttribute("data-nexus-ext-deepclean", "1");
          root.setAttribute("data-nexus-ext-name", (manifest && manifest.name) || "Infinity Claude AI");
          try {
            var iconRel = manifest && manifest.icons ? (manifest.icons["128"] || manifest.icons["48"] || manifest.icons["16"]) : "icon.png";
            if (iconRel) root.setAttribute("data-nexus-ext-icon", chrome.runtime.getURL(iconRel));
          } catch (_) {}
        }
      } catch (_) {}

      window.addEventListener('message', function(event){
        try{
          if(event.source!==window || !event.data) return;
          var d=event.data;
          const TOKEN_KEY = "lovable_pro_license";

          if(d.type==='NEXXUS_CHECK_TOKEN'){
            chrome.storage.local.get([TOKEN_KEY, 'captured_auth_token', 'lovable_token'], function(result){
              var token = result[TOKEN_KEY] || result.captured_auth_token || result.lovable_token || null;
              try { if(!token) token = localStorage.getItem(TOKEN_KEY); } catch(_){}
              window.postMessage({ type: "NEXXUS_TOKEN_READY", token: token }, "*");
            });
            return;
          }

          if(d.type==='NEXXUS_SAVE_TOKEN'){
            if(d.token){
              chrome.storage.local.set({ [TOKEN_KEY]: d.token, captured_auth_token: d.token, lovable_token: d.token });
              try { localStorage.setItem(TOKEN_KEY, d.token); } catch(_){}
            }
            return;
          }

          if(d.source==='nexus-pro' && d.type==='NX_DEEP_CLEAN'){
            var reqId = d.reqId || null;
            var reply = function(ok, detail){
              try {
                window.postMessage({ source: "nexus-pro-ext", type: "NX_DEEP_CLEAN_DONE", reqId: reqId, ok: !!ok, detail: detail || null }, "*");
              } catch(_){}
            };
            try {
              chrome.runtime.sendMessage({ type: "NX_DEEP_CLEAN", origin: location.origin }, function(res){
                if(chrome.runtime.lastError) return reply(false);
                reply(res && res.ok, res && res.detail);
              });
            } catch(_) { reply(false); }
            return;
          }

          if(d.source==='nexus-pro' && d.type==='NX_CLEAR_EXT_STORAGE'){
            try {
              chrome.storage.local.get(null, function(all){
                var keep = {};
                if(all && all[TOKEN_KEY]) keep[TOKEN_KEY] = all[TOKEN_KEY];
                chrome.storage.local.clear(function(){
                  if(keep[TOKEN_KEY]) chrome.storage.local.set(keep);
                });
              });
            } catch(_){}
            return;
          }

          if(d.type==='LL_REQUEST_TOKEN'){
            window.postMessage({type:'lovableRequestToken'}, '*');
            return;
          }
          if(d.type==='LOVIFY_PUBLISH_REQUEST_CAPTURED'){
            var pr = d || {};
            if(pr.url && pr.method){
              chrome.storage.local.set({ ll_last_publish_request: {
                url: pr.url,
                method: pr.method,
                headers: pr.headers || {},
                body: pr.body || null,
                projectId: pr.projectId || null,
                at: pr.at || Date.now()
              }});
            }
            return;
          }
          if(d.type==='lovableTokenFound' || d.type==='LL_TOKEN_CAPTURED'){
            var updates={};
            if(d.token && typeof d.token==='string'){
              updates.ll_lovable_auth_token=d.token;
              updates.captured_auth_token=d.token;
              updates.captured_lovable_token=d.token;
              updates.lovable_api_token=d.token;
              updates.lovable_token=d.token;
              updates[TOKEN_KEY]=d.token;
            }
            if(d.projectId && typeof d.projectId==='string'){
              updates.ll_project_id=d.projectId;
              updates.current_project_id=d.projectId;
              updates.lovable_projectId=d.projectId;
            }
            if(Object.keys(updates).length) chrome.storage.local.set(updates);
          }
        }catch(e){}
      }, false);
      var s=document.createElement('script');
      s.src=chrome.runtime.getURL('pageHook.js');
      s.onload=function(){try{s.remove();}catch(e){}};
      (document.documentElement||document.head||document.body).appendChild(s);
    }
  }catch(e){}
})();
// ─── Netuno Lovable — Content Script ──────────────────────────────────────────
// Injects the draggable floating bubble into lovable.dev pages.

(function () {
  'use strict';

  const SITE_URL = 'https://netunolov.com.br'; // Domínio oficial
  const LOCAL_TEST_MODE = false;

  // Publicar Projeto — usa a ação antiga via Edge Function (mantém o design atual da extensão).
  const LOVIFY_SUPABASE_URL = 'http://127.0.0.1';
  const LOVIFY_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcW5hanZycnpmYmdtdmFwb3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODc1NTUsImV4cCI6MjA5NzM2MzU1NX0.nCHRJIywf1H2_a9om3xrlvlCZogowld4-K5k1HUTJao';
  const PUBLISH_PROJECT_URL = LOVIFY_SUPABASE_URL + '/functions/v1/publish-project';

  async function ensureValidSupabaseToken(session) {
    if (!session.ll_token || !session.ll_refresh_token) return session.ll_token;
    try {
      const payloadBase64 = session.ll_token.split('.')[1];
      if (!payloadBase64) return session.ll_token;
      let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) { base64 += '='; }
      const decoded = JSON.parse(atob(base64));
      
      if (decoded.exp && (Date.now() / 1000) > (decoded.exp - 300)) {
        const res = await fetch(`${LOVIFY_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': LOVIFY_SUPABASE_ANON_KEY },
          body: JSON.stringify({ refresh_token: session.ll_refresh_token })
        });
        if (res.ok) {
          const data = await res.json();
          await new Promise(r => chrome.storage.local.set({ ll_token: data.access_token, ll_refresh_token: data.refresh_token }, r));
          session.ll_token = data.access_token;
          session.ll_refresh_token = data.refresh_token;
        }
      }
    } catch(e) {}
    return session.ll_token;
  }

  // ─── Proteção Mac sem consumo de créditos Lovable ─────────────────────────
  function llIsMacChrome() {
    try { return /Mac/i.test(navigator.platform || navigator.userAgent || ''); }
    catch (_) { return false; }
  }

  function llNoCreditAttempts(projectId, headersAuth, payload, lightweightBody) {
    // No Windows, o caminho que apareceu como 202 e credits 0 foi /chat.
    // No Mac, evitamos /send-message porque está retornando 403/404.
    return [
      {
        label: 'page/chat-bearer-no-credit',
        mode: 'page',
        url: `https://api.lovable.dev/projects/${projectId}/chat`,
        headers: headersAuth,
        body: payload
      },
      {
        label: 'proxy/chat-bearer-no-credit',
        mode: 'proxy',
        url: `https://api.lovable.dev/projects/${projectId}/chat`,
        headers: headersAuth,
        body: payload
      }
    ];
  }


  const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
  /** Default de expiração (s) quando a storage não redefine; usar `null` em storage ll_imgbb_expiration_sec para desligar. */
  const IMGBB_EXPIRATION_SEC = 600;
  const IMGBB_MAX_BYTES = 32 * 1024 * 1024;

  /** Cache: existe ll_imgbb_api_key guardada nas configurações. */
  let llHasConfiguredImgBbKey = false;
  let llImproveContext = '';
  function refreshImgBbConfiguredCache(done) {
    try {
      chrome.storage.local.get(['ll_imgbb_api_key'], (s) => {
        llHasConfiguredImgBbKey = !!String(s.ll_imgbb_api_key ?? '').trim();
        if (typeof done === 'function') done();
      });
    } catch (_) {
      llHasConfiguredImgBbKey = false;
      if (typeof done === 'function') done();
    }
  }

  async function llLoadImgBbConfig() {
    return await new Promise((resolve) => {
      try {
        chrome.storage.local.get(['ll_imgbb_api_key', 'll_imgbb_expiration_sec'], (s) => {
          const keyTrim = String(s.ll_imgbb_api_key != null ? s.ll_imgbb_api_key : '').trim();

          let exp = IMGBB_EXPIRATION_SEC;
          if (
            Object.prototype.hasOwnProperty.call(s, 'll_imgbb_expiration_sec') &&
            (s.ll_imgbb_expiration_sec === '' ||
              s.ll_imgbb_expiration_sec === false ||
              s.ll_imgbb_expiration_sec === null)
          ) {
            exp = null;
          } else if (s.ll_imgbb_expiration_sec != null && s.ll_imgbb_expiration_sec !== '') {
            const n = Number(s.ll_imgbb_expiration_sec);
            if (Number.isFinite(n) && n >= 60 && n <= 15552000) exp = n;
          }
          resolve({ key: keyTrim, expiration: exp });
        });
      } catch (_) {
        resolve({ key: '', expiration: IMGBB_EXPIRATION_SEC });
      }
    });
  }

  /** Destaque no botão Configurações (ex.: ImgBB não configurado). */
  function pulseLlSettingsBtn(holdMs = 5200) {
    const btn = document.getElementById('ll-settings-btn');
    if (!btn) return;
    btn.classList.remove('ll-settings-btn-pulse');
    void btn.offsetWidth;
    btn.classList.add('ll-settings-btn-pulse');
    clearTimeout(btn._llPulseT);
    btn._llPulseT = window.setTimeout(() => btn.classList.remove('ll-settings-btn-pulse'), holdMs);
  }

  function llComposerFileLooksLikeImage(f) {
    return !!(f instanceof File && f.type && String(f.type).startsWith('image/'));
  }

  async function llEnsureImgBbKeyForComposerFiles(candidateFiles) {
    if (!(candidateFiles || []).some(llComposerFileLooksLikeImage)) return true;
    const cfg = await llLoadImgBbConfig();
    if (String(cfg.key || '').trim()) return true;
    showToast(
      '⚙️',
      'Guarde primeiro a sua chave de hosting de imagens nas Configurações (⚙).',
      5800
    );
    pulseLlSettingsBtn();
    return false;
  }

  let panelOpen = false;
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let bubblePos = { x: 0, y: 0 };
  let dragMoved = false;
  let lastProxyErrorMessage = '';
  /**
   * Anexos no composer: imagens → ImgBB (URL oculta na UI); outros ficheiros → upload Lovable no envio.
   * @typedef {{ kind: 'imgbb_image', localId: string, name: string, mime: string, size: number, status: 'uploading'|'settling'|'ready'|'error', url?: string, displayUrl?: string, imgbbApiId?: string, err?: string, _settleTimerId?: ReturnType<typeof setTimeout> } | { kind: 'lovable_file', file: File }} ComposerAttachment
   */
  let composerAttachmentList = [];
  // Serializa inclusões disparadas simultaneamente por change/input/drop/paste.
  // Isso impede que o mesmo File seja inserido duas vezes antes da primeira inclusão terminar.
  let composerAttachmentMutationQueue = Promise.resolve();
  // Reserva imediata por fingerprint: bloqueia o segundo evento antes mesmo de entrar na fila.
  const composerQueuedFingerprints = new Set();
  // input[type=file] nativo do Lovable associado a cada anexo espelhado.
  const llNativeInputsByFingerprint = new Map();
  let llUpdatingNativeFileInput = false;
  const LL_NATIVE_COSMETIC_ATTACHMENTS_ID = 'll-native-cosmetic-attachments';
  let llNativeCosmeticRenderFrame = 0;
  const STORAGE_NATIVE_PROMPT_DRAFT = 'll_native_prompt_draft';
  let llComposerSendHandler = null;
  let llNativeDraftPersistTimer = null;
  let llNativePromptObserver = null;
  let llObservedNativeEditor = null;
  let llSuppressNativeDraftSync = false;
  /** Referência ao `#ll-bubble-wrap` após `initBubble`. */
  let bubbleEl = null;
  /** `docked` = barra fixa à direita; `float` = bolha arrastável + painel modal. */
  let panelLayoutMode = 'docked';
  let dockCollapsed = false;

  const STORAGE_PANEL_LAYOUT = 'll_panel_layout';
  const STORAGE_DOCK_COLLAPSED = 'll_dock_collapsed';

  // ─── Lovable token/project capture fallback (in-page) ───────────────────────
  // Background will capture via webRequest, but this helps if it can't.

  // Save projectId from URL immediately on load
  (function autoDetectOnLoad() {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) return;
      const url = window.location.href;
      const m = url.match(/lovable\.dev\/projects\/([a-zA-Z0-9_-]+)/i);
      if (m && m[1]) {
        chrome.storage.local.set({ ll_project_id: m[1], current_project_id: m[1] });
      }
    } catch (_) {}
  })();

  try {
    const origFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const req = args[0] instanceof Request ? args[0] : null;
      const url = req ? req.url : String(args[0] || '');
      const init = req ? undefined : (args[1] || {});
      const headers = (req ? req.headers : (init && init.headers)) || {};

      try {
        if (url.includes('api.lovable.dev')) {
          let auth = null;
          if (headers && typeof headers.get === 'function') auth = headers.get('authorization') || headers.get('Authorization');
          if (!auth && headers && typeof headers === 'object') auth = headers.authorization || headers.Authorization;
          if (auth && String(auth).startsWith('Bearer ')) {
            const t = String(auth).slice(7);
            chrome.storage.local.set({
              ll_lovable_auth_token: t,
              captured_auth_token: t,
              captured_lovable_token: t
            });
          }

          const m = url.match(/\/projects\/([a-zA-Z0-9_-]+)/i);
          if (m && m[1]) chrome.storage.local.set({ ll_project_id: m[1], current_project_id: m[1] });
        }
      } catch (_) {}

      return origFetch(...args);
    };
  } catch (_) {}

  function detectProjectId() {
    const url = window.location.href;
    const m = url.match(/lovable\.dev\/projects\/([a-zA-Z0-9_-]+)/i);
    if (m && m[1]) return m[1];
    const gpt = url.match(/lovable\.dev\/gpt\/([a-zA-Z0-9_-]+)/i);
    return gpt?.[1] || null;
  }

  function showToast(icon, msg, duration = 3000) {
    let toast = document.getElementById('ll-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'll-toast';
      document.body.appendChild(toast);
    }
    document.body.appendChild(toast);
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    toast.classList.add('ll-show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('ll-show'), duration);
  }

  // ─── Sound Effects (Silencioso e sem avisos de AudioContext) ───
  const llSounds = {
    send() {},
    success() {},
    error() {},
    action() {},
    improve() {},
    notify() {}
  };

  async function getAuthBundle() {
    const data = await new Promise((resolve) => {
    chrome.storage.local.get([
      'll_token',
      'll_client_git_sha',
      'll_lovable_auth_token',
      'll_project_id',
      'captured_auth_token',
      'captured_lovable_token',
      'lovable_api_token',
      'current_project_id'
    ], resolve);
    });

    const projectId = data.ll_project_id || data.current_project_id || detectProjectId();

    // If we just detected the projectId from URL but it wasn't in storage yet, save it.
    if (projectId && !data.ll_project_id) {
      chrome.storage.local.set({ ll_project_id: projectId, current_project_id: projectId });
    }

    // Try Supabase session token from localStorage (lovable stores it there as sb-*-auth-token)
    let supabaseToken = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const raw = localStorage.getItem(key);
          const parsed = JSON.parse(raw || '{}');
          const t = parsed?.access_token || parsed?.session?.access_token || null;
          if (t) { supabaseToken = t; break; }
        }
      }
    } catch (_) {}

    const lovableToken =
      data.ll_lovable_auth_token ||
      data.lovable_api_token ||
      data.captured_auth_token ||
      data.captured_lovable_token ||
      supabaseToken ||
      localStorage.getItem('lovable_token') ||
      localStorage.getItem('__lovable_token') ||
      null;

    // If we just found the token, cache it for future calls
    if (lovableToken && !data.ll_lovable_auth_token) {
      chrome.storage.local.set({ ll_lovable_auth_token: lovableToken, captured_auth_token: lovableToken });
    }

    return {
      extensionToken: data.ll_token || (LOCAL_TEST_MODE ? 'local-test-token' : null),
      clientGitSha: data.ll_client_git_sha || null,
      projectId,
      lovableToken
    };
  }

  function proxyFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'PROXY_FETCH',
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body || null
        },
        (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(resp || { ok: false, status: 0, body: '{}' });
        }
      );
    });
  }

  function lovableApiFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage({
          action: 'lovableApiFetch',
          url,
          method: options.method || 'POST',
          headers: options.headers || {},
          body: options.body || null,
        }, (resp) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          if (!resp) return reject(new Error('Sem resposta do background'));
          resolve(resp);
        });
      } catch (e) {
        reject(e);
      }
    });
  }


  let pageBridgeReady = false;
  function ensurePageBridge() {
    if (pageBridgeReady || window.__LL_PAGE_BRIDGE_READY__) {
      pageBridgeReady = true;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = chrome.runtime.getURL('page-bridge.js');
      s.onload = () => {
        pageBridgeReady = true;
        resolve();
      };
      s.onerror = () => reject(new Error('Falha ao carregar bridge da página'));
      (document.head || document.documentElement).appendChild(s);
    });
  }

  async function llRequestFreshLovableToken(waitMs = 1800) {
    try {
      await ensurePageBridge().catch(() => {});
      window.postMessage({ type: 'LL_REQUEST_TOKEN' }, '*');
      window.postMessage({ type: 'lovableRequestToken' }, '*');
    } catch (_) {}

    const start = Date.now();
    while (Date.now() - start < waitMs) {
      const data = await new Promise((resolve) => {
        try {
          chrome.storage.local.get([
            'll_lovable_auth_token',
            'captured_auth_token',
            'captured_lovable_token',
            'lovable_api_token',
            'lovable_token',
            'll_project_id',
            'current_project_id',
            'lovable_projectId'
          ], resolve);
        } catch (_) { resolve({}); }
      });

      const token =
        data.ll_lovable_auth_token ||
        data.lovable_api_token ||
        data.captured_auth_token ||
        data.captured_lovable_token ||
        data.lovable_token ||
        null;

      const project =
        data.ll_project_id ||
        data.current_project_id ||
        data.lovable_projectId ||
        detectProjectId();

      if (token && project) return { token, projectId: project };
      await new Promise((r) => setTimeout(r, 180));
    }

    return { token: null, projectId: detectProjectId() };
  }

  async function llReconnectLovableSession() {
    showToast('🔄', 'Reconectando ao Lovable...', 2500);
    try {
      await new Promise((resolve) => {
        chrome.storage.local.remove([
          'll_lovable_auth_token',
          'captured_auth_token',
          'captured_lovable_token',
          'lovable_api_token',
          'lovable_token',
          'll_project_id',
          'current_project_id',
          'lovable_projectId'
        ], resolve);
      });
    } catch (_) {}

    try {
      await ensurePageBridge().catch(() => {});
      window.postMessage({ type: 'LL_REQUEST_TOKEN' }, '*');
      window.postMessage({ type: 'lovableRequestToken' }, '*');
    } catch (_) {}

    const fresh = await llRequestFreshLovableToken(2600);
    if (fresh.token && fresh.projectId) {
      showToast('✅', 'Lovable reconectado. Tente enviar novamente.', 4000);
      return true;
    }

    showToast('⚠️', 'Não consegui capturar o token. Faça logout/login no Lovable e atualize a página.', 6500);
    try { setTimeout(() => window.location.reload(), 1200); } catch (_) {}
    return false;
  }

  async function pageContextFetch(url, options = {}) {
    await ensurePageBridge();
    const requestId = `ll_req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        window.removeEventListener('message', onResult);
        resolve({ ok: false, status: 0, body: JSON.stringify({ error: 'timeout page fetch' }) });
      }, 15000);

      function onResult(event) {
        const data = event.data || {};
        if (event.source !== window) return;
        if (data.type !== 'LL_PAGE_FETCH_RESULT') return;
        if (data.requestId !== requestId) return;
        clearTimeout(timer);
        window.removeEventListener('message', onResult);
        resolve({
          ok: !!data.ok,
          status: Number(data.status || 0),
          body: typeof data.body === 'string' ? data.body : JSON.stringify(data.body || {})
        });
      }

      window.addEventListener('message', onResult);
      window.postMessage({ type: 'LL_PAGE_FETCH', requestId, url, options }, '*');
    });
  }

  // ─── Token Capture Listener (receives from page-bridge.js hook) ─────────────
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.type !== 'LL_TOKEN_CAPTURED') return;
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || !chrome.storage || !chrome.storage.local) return;
      const updates = {};
      if (event.data.token && typeof event.data.token === 'string') {
        updates.ll_lovable_auth_token = event.data.token;
        updates.captured_auth_token = event.data.token;
      }
      if (event.data.projectId && typeof event.data.projectId === 'string') {
        updates.ll_project_id = event.data.projectId;
        updates.current_project_id = event.data.projectId;
      }
      if (Object.keys(updates).length) {
        chrome.storage.local.set(updates, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      }
    } catch (_) {}
  });

  /** Request latest token from page-bridge hook */
  function requestLatestToken(timeoutMs) {
    timeoutMs = timeoutMs || 1200;
    return new Promise((resolve) => {
      let finished = false;
      function finish(ok) { if (finished) return; finished = true; clearTimeout(timer); chrome.storage.onChanged.removeListener(onChange); resolve(ok); }
      function onChange(changes, area) { if (area === 'local' && (changes.ll_lovable_auth_token || changes.captured_auth_token)) finish(true); }
      const timer = setTimeout(() => finish(false), Math.max(300, timeoutMs));
      chrome.storage.onChanged.addListener(onChange);
      try {
        window.postMessage({ type: 'LL_REQUEST_TOKEN' }, '*');
        setTimeout(() => window.postMessage({ type: 'LL_REQUEST_TOKEN' }, '*'), 120);
      } catch (e) { finish(false); }
    });
  }

  // Inject page-bridge early to start capturing tokens
  ensurePageBridge().catch(() => {});

  function encodeTime(now, len) {
    const chars = '0123456789abcdefghjkmnpqrstvwxyz';
    let str = '';
    for (let i = 0; i < len; i++) {
      str = chars.charAt(now % 32) + str;
      now = Math.floor(now / 32);
    }
    return str;
  }

  function randomChars(n) {
    const chars = '0123456789abcdefghjkmnpqrstvwxyz';
    let s = '';
    for (let i = 0; i < n; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  }

  function generateId(prefix) {
    const now = Date.now();
    return prefix + encodeTime(now, 10) + randomChars(16);
  }


  // ─── Preview Toolbar Compatibility — seleção visual de elementos ─────────────
  // Compatibilidade com a nova Preview Toolbar do Lovable: captura o elemento
  // selecionado no preview e envia em selected_elements para o fluxo /chat.
  window.__LOVIFY_SELECTED_ELEMENTS__ = window.__LOVIFY_SELECTED_ELEMENTS__ || [];

  function lovifySafeCssEscape(value) {
    try {
      if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
    } catch (_) {}
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function lovifyBuildCssSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    try {
      if (el.id) return `#${lovifySafeCssEscape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && node !== document.body && parts.length < 7) {
        let part = String(node.tagName || '').toLowerCase();
        if (!part) break;
        const cls = String(node.className || '')
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .map((c) => `.${lovifySafeCssEscape(c)}`)
          .join('');
        part += cls;
        const parent = node.parentElement;
        if (parent) {
          const sameTag = Array.from(parent.children).filter((child) => child.tagName === node.tagName);
          if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
        }
        parts.unshift(part);
        node = parent;
      }
      return parts.join(' > ');
    } catch (_) {
      return '';
    }
  }

  function lovifyGetElementAttributes(el) {
    const attrs = {};
    try {
      if (!el || !el.attributes) return attrs;
      const allowed = ['id', 'class', 'href', 'src', 'alt', 'title', 'type', 'role', 'aria-label', 'data-testid', 'name', 'placeholder'];
      Array.from(el.attributes).forEach((attr) => {
        if (!attr || !attr.name) return;
        const name = String(attr.name || '');
        if (allowed.includes(name) || name.startsWith('data-')) {
          attrs[name] = String(attr.value || '').slice(0, 500);
        }
      });
    } catch (_) {}
    return attrs;
  }

  function lovifyCurrentPreviewPage() {
    try {
      return `${location.pathname || '/'}${location.search || ''}${location.hash || ''}`;
    } catch (_) {
      return '/';
    }
  }

  function lovifyCaptureSelectedElement(el, source = 'lovable_dev_page') {
    if (!el || el === document.body || el === document.documentElement) return null;
    if (el.closest && el.closest('#ll-bubble-wrap')) return null;
    try {
      const rect = el.getBoundingClientRect();
      return {
        selector: lovifyBuildCssSelector(el),
        tag_name: String(el.tagName || '').toLowerCase(),
        text: String(el.innerText || el.textContent || '').trim().slice(0, 1000),
        html: String(el.outerHTML || '').slice(0, 3000),
        current_page: lovifyCurrentPreviewPage(),
        source,
        url: location.href,
        bounding_box: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        viewport: {
          width: window.innerWidth || 1280,
          height: window.innerHeight || 720,
          dpr: window.devicePixelRatio || 1,
        },
        attributes: lovifyGetElementAttributes(el),
      };
    } catch (_) {
      return null;
    }
  }

  function lovifyNormalizePreviewElement(el) {
    if (!el || typeof el !== 'object') return null;
    return {
      selector: String(el.selector || el.css_selector || '').slice(0, 500),
      tag_name: String(el.tag_name || el.tagName || el.tag || '').slice(0, 80),
      text: String(el.text || el.innerText || el.label || '').slice(0, 1000),
      html: String(el.html || el.outerHTML || '').slice(0, 3000),
      current_page: String(el.current_page || el.page || lovifyCurrentPreviewPage()).slice(0, 500),
      source: String(el.source || 'preview_toolbar').slice(0, 80),
      url: String(el.url || '').slice(0, 800),
      bounding_box: el.bounding_box || el.rect || null,
      viewport: el.viewport || null,
      attributes: el.attributes || {},
      component_hint: el.component_hint || null,
    };
  }

  function lovifySetSelectedPreviewElements(elements) {
    const normalized = (Array.isArray(elements) ? elements : [elements])
      .map(lovifyNormalizePreviewElement)
      .filter(Boolean)
      .slice(0, 10);
    window.__LOVIFY_SELECTED_ELEMENTS__ = normalized;
    try { chrome.storage.local.set({ ll_preview_selected_elements: normalized, ll_preview_selected_at: Date.now() }); } catch (_) {}
    return normalized;
  }

  function lovifyGetPreviewSelectedElements() {
    return (Array.isArray(window.__LOVIFY_SELECTED_ELEMENTS__) ? window.__LOVIFY_SELECTED_ELEMENTS__ : [])
      .map(lovifyNormalizePreviewElement)
      .filter(Boolean)
      .slice(0, 10);
  }

  function lovifyBuildPreviewViewDescription() {
    const selected = lovifyGetPreviewSelectedElements();
    let desc = 'The user is currently viewing the app preview. ';
    if (selected.length) {
      desc += `The user selected ${selected.length} element reference(s) in the preview toolbar and wants a targeted visual change. `;
    } else {
      desc += 'No specific preview element is selected. ';
    }
    return desc;
  }

  function lovifyBroadcastPickerToPreviewFrames() {
    let sent = 0;
    try {
      document.querySelectorAll('iframe').forEach((frame) => {
        try {
          if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({ type: 'LOVIFY_ENABLE_PREVIEW_PICKER' }, '*');
            sent += 1;
          }
        } catch (_) {}
      });
    } catch (_) {}
    return sent;
  }

  function lovifyEnableTopPageElementPicker() {
    let lastEl = null;
    let finished = false;

    function clearLast() {
      try {
        if (lastEl) {
          lastEl.style.outline = '';
          lastEl.style.outlineOffset = '';
        }
      } catch (_) {}
    }

    function cleanup() {
      if (finished) return;
      finished = true;
      clearLast();
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
      try { document.body.classList.remove('lovify-picking-element'); } catch (_) {}
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        cleanup();
        showToast('↩️', 'Seleção visual cancelada.', 2200);
      }
    }

    function onMove(e) {
      const el = e.target;
      if (!el || el.closest?.('#ll-bubble-wrap')) return;
      clearLast();
      lastEl = el;
      try {
        el.style.outline = '2px solid #FF2D8B';
        el.style.outlineOffset = '2px';
      } catch (_) {}
    }

    function onClick(e) {
      const el = e.target;
      if (!el || el.closest?.('#ll-bubble-wrap')) return;
      e.preventDefault();
      e.stopPropagation();
      const captured = lovifyCaptureSelectedElement(el, 'lovable_dev_page');
      cleanup();
      if (captured) {
        const selected = lovifySetSelectedPreviewElements([captured]);
        showToast('🎯', `Elemento selecionado (${selected[0]?.tag_name || 'item'}). Agora escreva o pedido e envie.`, 4200);
      }
    }

    try { document.body.classList.add('lovify-picking-element'); } catch (_) {}
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
  }

  function lovifyEnablePreviewElementPicker() {
    const frames = lovifyBroadcastPickerToPreviewFrames();
    lovifyEnableTopPageElementPicker();
    showToast('👆', frames ? 'Clique no elemento dentro do preview. ESC cancela.' : 'Clique no elemento que deseja editar. ESC cancela.', 5200);
  }

  try {
    window.addEventListener('message', (event) => {
      try {
        const d = event.data || {};
        if (d.type !== 'LOVIFY_PREVIEW_ELEMENT_SELECTED') return;
        const selected = lovifySetSelectedPreviewElements([d.element || d.payload]);
        if (selected.length) {
          showToast('🎯', `Elemento do preview selecionado: ${selected[0].tag_name || 'item'}.`, 4200);
        }
      } catch (_) {}
    }, false);
  } catch (_) {}

  // ─── Neturno — envio nativo interceptado ────────────────────────────────
  // O texto é colocado no composer original. O próprio Lovable cria a requisição,
  // mantendo cookies, Authorization e headers da sessão atual da página.
  const NETURNO_NATIVE_SEND_MARKER = '__lovifyNativeSendV2';
  const neturnoNativePending = new Map();
  let neturnoNativeBridgeReady = true;

  const NETURNO_NATIVE_PAYLOAD_PATCH = Object.freeze({
    intent: 'seo_fix',
    message_intent_metadata: {
      seo_fix_metadata: {
        audit_key: 'meta-description',
        audit_title: 'Meta Description',
        severity: 'warning'
      }
    }
  });

  function neturnoNativeNonce() {
    try { return crypto.randomUUID(); }
    catch (_) { return `neturno_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`; }
  }

  function neturnoNativePost(type, payload = {}) {
    try {
      window.postMessage({
        [NETURNO_NATIVE_SEND_MARKER]: true,
        type,
        ...payload,
        at: Date.now()
      }, '*');
    } catch (_) {}
  }

  function neturnoStorageGet(keys) {
    return new Promise((resolve) => {
      try { chrome.storage.local.get(keys, (row) => resolve(row || {})); }
      catch (_) { resolve({}); }
    });
  }

  async function neturnoSyncNativeInterceptorConfig(forceKeyValid = false) {
    const store = await neturnoStorageGet([
      'll_token', 'll_license', 'll_extension_enabled',
      'll_license_blocked', 'll_license_status'
    ]);
    const expired = typeof llIsLicenseExpiredOrBlockedFromStore === 'function'
      ? llIsLicenseExpiredOrBlockedFromStore(store)
      : store.ll_license_blocked === true;
    const keyValid = forceKeyValid === true || (!!store.ll_token && !expired);
    const enabled = keyValid && store.ll_extension_enabled !== false;

    neturnoNativePost('LOVIFY_INTERCEPT_CONFIG', {
      enabled,
      key_valid: keyValid,
      mode: '1',
      payload_patch: NETURNO_NATIVE_PAYLOAD_PATCH
    });
    return { enabled, keyValid };
  }

  function neturnoWaitForNativeBridge(timeoutMs = 3000) {
    if (neturnoNativeBridgeReady) return Promise.resolve(true);
    return new Promise((resolve) => {
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => finish(false), Math.max(500, Number(timeoutMs || 3000)));
      const poll = () => {
        if (neturnoNativeBridgeReady) return finish(true);
        if (!done) setTimeout(poll, 80);
      };
      neturnoNativePost('LOVIFY_STRICT_INTERCEPT_ENABLE');
      poll();
    });
  }

  function neturnoSendTextThroughNativeComposer(promptText, options = {}) {
    const prompt = String(promptText || '').trim();
    if (!prompt) return Promise.reject(new Error('Digite um prompt antes de enviar.'));
    if (!window.location.hostname.endsWith('lovable.dev')) {
      return Promise.reject(new Error('Abra um projeto no Lovable antes de enviar.'));
    }

    return (async () => {
      await neturnoSyncNativeInterceptorConfig(true);
      const ready = await neturnoWaitForNativeBridge(Number(options.bridgeTimeoutMs || 3000));
      if (!ready) throw new Error('O interceptor nativo não respondeu. Recarregue a página do Lovable.');

      const nonce = neturnoNativeNonce();
      window.__LOVIFY_NATIVE_BOOTSTRAP_MODE = true;

      return await new Promise((resolve, reject) => {
        const timeoutMs = Math.max(5000, Number(options.timeoutMs || 55000));
        const timer = setTimeout(() => {
          neturnoNativePending.delete(nonce);
          window.__LOVIFY_NATIVE_BOOTSTRAP_MODE = false;
          neturnoNativePost('LOVIFY_STRICT_NATIVE_SEND_CANCEL', { nonce, reason: 'client_timeout' });
          reject(new Error('Tempo limite aguardando a confirmação do envio nativo.'));
        }, timeoutMs);

        neturnoNativePending.set(nonce, {
          resolve: (result) => {
            clearTimeout(timer);
            window.__LOVIFY_NATIVE_BOOTSTRAP_MODE = false;
            resolve(result);
          },
          reject: (error) => {
            clearTimeout(timer);
            window.__LOVIFY_NATIVE_BOOTSTRAP_MODE = false;
            reject(error);
          }
        });

        neturnoNativePost('LOVIFY_STRICT_NATIVE_SEND_COMMAND', {
          nonce,
          prompt_text: prompt,
          mode: '1',
          payload_patch: NETURNO_NATIVE_PAYLOAD_PATCH,
          source: String(options.source || 'extension_panel')
        });
      });
    })();
  }

  window.addEventListener('message', (event) => {
    try {
      const data = event.data || {};
      if (event.source !== window || data[NETURNO_NATIVE_SEND_MARKER] !== true) return;
      if (data.type === 'LOVIFY_NATIVE_GUARD_LOADED' || data.type === 'LOVIFY_STRICT_INTERCEPT_READY') {
        neturnoNativeBridgeReady = true;
        return;
      }
      if (data.type !== 'LOVIFY_NATIVE_SEND_RESULT' || !data.nonce) return;
      const pending = neturnoNativePending.get(String(data.nonce));
      if (!pending) return;
      neturnoNativePending.delete(String(data.nonce));
      if (data.ok === true) pending.resolve(data);
      else pending.reject(new Error(data.error || `Lovable respondeu com status ${Number(data.status || 0)}.`));
    } catch (_) {}
  }, false);

  setTimeout(() => { neturnoSyncNativeInterceptorConfig(false).catch(() => {}); }, 0);
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (['ll_token','ll_license','ll_extension_enabled','ll_license_blocked','ll_license_status']
        .some((key) => Object.prototype.hasOwnProperty.call(changes, key))) {
        neturnoSyncNativeInterceptorConfig(false).catch(() => {});
      }
    });
  } catch (_) {}

  function lovifyBuildFixErrorPayload(promptText, filesPayload = [], optimisticImageUrls = []) {
    const rawPrompt = normalizeText(promptText || '');
    const ghostElements = [{ tag: 'body', xpath: '/html/body', innerText: '' }];
    const ghostReplacements = [{
      element_selector: 'body',
      original_text: '',
      new_text: '<!-- bypass -->',
      selected_element_index: 0,
      instruction: rawPrompt,
    }];
    const visualMeta = {
      selected_elements: ghostElements,
      text_replacements: ghostReplacements,
    };
    return {
      id: generateId('umsg_'),
      files: Array.isArray(filesPayload) ? filesPayload : [],
      chat_only: false,
      contains_error: false,
      message: "",
      intent: "visual_edit",
      selected_elements: ghostElements,
      text_replacements: ghostReplacements,
      message_intent_metadata: { visual_edit_metadata: visualMeta },
      visual_edit_metadata: visualMeta,
      integration_metadata: { browser: { is_logged_out: false } },
      optimisticImageUrls: Array.isArray(optimisticImageUrls) ? optimisticImageUrls : [],
    };
  }

  async function sendPromptViaNovoIndexFlow(promptText, projectId, lovableToken, clientGitSha, sendOptions = {}) {
    const files = Array.isArray(sendOptions.files)
      ? sendOptions.files.filter((file) => file && typeof file === 'object')
      : [];
    const optimisticImageUrls = Array.isArray(sendOptions.optimisticImageUrls)
      ? [...new Set(sendOptions.optimisticImageUrls.filter(Boolean).map(String))]
      : [];
    const uploadedFiles = Array.isArray(sendOptions.uploadedFiles)
      ? sendOptions.uploadedFiles.filter((file) => file && typeof file === 'object')
      : [];

    // Forcando envio de texto puro pelo servidor netuno-handler

    // Anexos: preserva o handler antigo porque ele já controla upload e metadados.
    const fresh = await llRequestFreshLovableToken(1800);
    if (fresh.token) lovableToken = fresh.token;
    if (fresh.projectId) projectId = fresh.projectId;
    if (!lovableToken || !projectId) {
      throw new Error('Não consegui conectar ao Lovable. Clique em Reconectar Lovable e recarregue o projeto.');
    }

    const session = await new Promise(r => chrome.storage.local.get(['ll_token', 'll_refresh_token', 'll_device_id'], r));
    const fixErrorPayload = lovifyBuildFixErrorPayload(promptText, files, optimisticImageUrls);
    const payload = {
        netuno_secret: 'NETUNO_PROTECT_2026',
        projectId,
      token: lovableToken,
      device_id: session.ll_device_id || '',
      gitSha: clientGitSha,
      prompt: promptText,
      files,
      attachments: files,
      attachment_count: files.length,
      optimisticImageUrls,
      optimistic_image_urls: optimisticImageUrls,
      uploaded_files: uploadedFiles,
      fix_error_payload: fixErrorPayload,
      chat_payload: fixErrorPayload,
      selected_elements: lovifyGetPreviewSelectedElements(),
      current_page: window.location.pathname,
      current_viewport_width: window.innerWidth,
      chat_only: false,
      send_mode: 'extension_prompt_with_files'
    };

    const authHeaderToken = LOVIFY_SUPABASE_ANON_KEY;
    const resp = await fetch('http://127.0.0.1/functions/v1/netuno-handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authHeaderToken}`
      },
      body: JSON.stringify(payload)
    });

    if (resp.ok) return true;
    let errorMsg = `Falha ao enviar anexos via netuno-handler (${resp.status}).`;
    try {
      const data = await resp.json();
      errorMsg = data.error_display || data.message || data.error || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  function llExtractHttpsUrlsDeep(obj, out, depth) {
    const maxUrls = 32;
    if (depth <= 0 || obj == null || out.length >= maxUrls) return;
    if (typeof obj === 'string') {
      if (/^https?:\/\/[^\s]+$/.test(obj) && obj.length < 4900 && !/^https:\/\/api\.lovable\.dev\/.*\/upload/i.test(obj)) {
        out.push(obj);
      }
      return;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) llExtractHttpsUrlsDeep(obj[i], out, depth - 1);
      return;
    }
    if (typeof obj === 'object') {
      Object.keys(obj).forEach((k) => llExtractHttpsUrlsDeep(obj[k], out, depth - 1));
    }
  }

  /** Junta todas as URLs "públicas" devolvidas pelo upload ou referência interna ao ficheiro. */
  function pickResolvedAssetUrl(uploadRow) {
    const pool = [];
    if (uploadRow.url) pool.push(uploadRow.url);
    const shallow = [uploadRow.rawMeta, uploadRow.rawMultipart].filter(Boolean);
    for (const obj of shallow) {
      if (typeof obj !== 'object') continue;
      for (const k of ['preview_url', 'public_url', 'cdn_url', 'asset_url', 'signed_url', 'download_url',
        'optimized_url', 'thumbnail_url', 'image_url']) {
        const v = obj[k];
        if (typeof v === 'string' && /^https?:\/\//i.test(v)) pool.push(v);
      }
    }
    if (uploadRow.rawMultipart) llExtractHttpsUrlsDeep(uploadRow.rawMultipart, pool, 6);
    if (uploadRow.rawMeta) llExtractHttpsUrlsDeep(uploadRow.rawMeta, pool, 6);
    const uniq = [...new Set(pool)];
    const mime = String(uploadRow.type || '');
    const isImg = mime.startsWith('image/');
    let best = '';
    for (const u of uniq) {
      if (/\.amazonaws\.com|cloudflare|bunny|supabase|imgix|blob\.core/i.test(u) || /cdn|public|preview|optimize/i.test(u)) {
        if (isImg && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(u)) return u;
        best = best || u;
      }
    }
    for (const u of uniq) {
      if (/\.lovable\.dev\/.*\/(?:files|assets|upload|public)/i.test(u)) best = best || u;
    }
    return best || uniq[0] || '';
  }

  function composeMessageWithUploadedParts(basePrompt, uploads) {
    const chunks = [];
    const text = normalizeText(basePrompt || '');
    if (text) chunks.push(text);
    for (const u of uploads) {
      const name = String(u.name || '').replace(/]/g, '');
      const idShort = String(u.id || '').slice(0, 14);
      if (u.resolvedUrl && u.type && String(u.type).startsWith('image')) {
        const url = encodeURI(String(u.resolvedUrl)).replace(/\)/g, '%29').replace(/\(/g, '%28');
        chunks.push(`![${name || 'image'}](${url})`);
      } else if (u.resolvedUrl) {
        chunks.push(`🔗 [${name || 'ficheiro'}](${encodeURI(String(u.resolvedUrl))})`);
      } else {
        chunks.push(`📎 ${name || 'anexo'}${idShort ? ` · ref \`${idShort}\`` : ''}`);
      }
    }
    return chunks.filter(Boolean).join('\n\n');
  }

  function buildAttachmentsPayload(uploads) {
    return uploads.map((u) => {
      const mime = u.type || 'application/octet-stream';
      const url = u.resolvedUrl || u.url || null;
      // Formato canônico Lovable (confirmado via cURL nativo 2025-01).
      const isImgBb = !!(u.rawMeta && u.rawMeta.imgbb);
      return {
        file_id: u.id,
        file_name: u.name || 'image.png',
        type: 'user_upload'
      };
    });
  }

  function buildOptimisticImageList(uploads) {
    const out = [];
    for (const u of uploads) {
      if (u.resolvedUrl && String(u.type || '').startsWith('image')) out.push(u.resolvedUrl);
      if (u.url && String(u.type || '').startsWith('image')) out.push(u.url);
      if (u.rawMultipart) llExtractHttpsUrlsDeep(u.rawMultipart, out, 6);
      if (u.rawMeta) llExtractHttpsUrlsDeep(u.rawMeta, out, 6);
    }
    return [...new Set(out.filter(Boolean))];
  }

  /** Após upload, tenta obter URL pública/preview via API (PUT por vezes não devolve URL legível no chat). */
  async function hydrateUploadDisplayUrls(uploaded, projectId, lovableToken) {
    const bearer = lovableToken.startsWith('Bearer ') ? lovableToken : `Bearer ${lovableToken}`;
    const jsonH = {
      'Authorization': bearer,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const cookieH = { 'Accept': 'application/json' };

    async function tryGet(url) {
      for (const pack of [
        { mode: 'page', headers: cookieH },
        { mode: 'page', headers: jsonH },
        { mode: 'proxy', headers: jsonH }
      ]) {
        try {
          const req = {
            method: 'GET',
            headers: pack.mode === 'proxy'
              ? { ...pack.headers, 'Origin': 'https://lovable.dev', 'Referer': 'https://lovable.dev/' }
              : pack.headers
          };
          const resp = pack.mode === 'page'
            ? await pageContextFetch(url, req)
            : await proxyFetch(url, req);
          if (resp.ok) {
            const j = JSON.parse(resp.body || '{}');
            return j && typeof j === 'object' ? j : null;
          }
        } catch (_) {}
      }
      return null;
    }

    async function tryPostDownloadUrl(fileUuid) {
      const body = JSON.stringify({ file_name: fileUuid, project_id: projectId });
      for (const pack of [
        { mode: 'page', headers: jsonH },
        { mode: 'proxy', headers: { ...jsonH, 'Origin': 'https://lovable.dev', 'Referer': 'https://lovable.dev/' } }
      ]) {
        try {
          const resp = pack.mode === 'page'
            ? await pageContextFetch('https://api.lovable.dev/files/generate-download-url', { method: 'POST', headers: pack.headers, body })
            : await proxyFetch('https://api.lovable.dev/files/generate-download-url', { method: 'POST', headers: pack.headers, body });
          if (resp.ok) {
            const j = JSON.parse(resp.body || '{}');
            return j && typeof j === 'object' ? j : null;
          }
        } catch (_) {}
      }
      return null;
    }

    for (const u of uploaded) {
      const id = String(u.id || '').trim();
      if (!id) continue;
      const needsUrl = !u.resolvedUrl || !/^https?:\/\//i.test(String(u.resolvedUrl));
      if (!needsUrl) continue;

      // Caminho real (cURL): POST /files/generate-download-url com {file_name, project_id}.
      const dl = await tryPostDownloadUrl(id);
      if (dl) {
        const pool = [];
        if (u.url) pool.push(u.url);
        llExtractHttpsUrlsDeep(dl, pool, 8);
        const picked = pickResolvedAssetUrl({
          ...u,
          rawMeta: { ...(u.rawMeta || {}), download: dl },
          rawMultipart: dl,
          url: u.url || pool[0] || null
        });
        if (picked) {
          u.resolvedUrl = picked;
          if (!u.url) u.url = picked;
          continue;
        }
      }

      const candidates = [
        `https://api.lovable.dev/projects/${projectId}/files/${encodeURIComponent(id)}`,
        `https://api.lovable.dev/projects/${projectId}/files/${encodeURIComponent(id)}/metadata`,
        `https://api.lovable.dev/projects/${projectId}/uploads/${encodeURIComponent(id)}`
      ];
      for (const ep of candidates) {
        const meta = await tryGet(ep);
        if (!meta) continue;
        const pool = [];
        if (u.url) pool.push(u.url);
        llExtractHttpsUrlsDeep(meta, pool, 8);
        const picked = pickResolvedAssetUrl({
          ...u,
          rawMeta: { ...(u.rawMeta || {}), hydrate: meta },
          rawMultipart: typeof meta === 'object' ? meta : u.rawMultipart,
          url: u.url || pool[0] || null
        });
        if (picked) {
          u.resolvedUrl = picked;
          if (!u.url) u.url = picked;
        }
        break;
      }
    }
  }

  // ─── UUID v4 para file_name (id que o Lovable espera no upload) ───────────
  function uuidv4() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try { return crypto.randomUUID(); } catch (_) {}
    }
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // ─── Upload de arquivos para o Lovable ─────────────────────────────────────
  // Endpoint real confirmado via cURL: POST https://api.lovable.dev/files/generate-upload-url
  // Body: { file_name (UUID), content_type, status: 'uploading', project_id, original_file_name, file_size_bytes, original_file_size_bytes }
  async function uploadLovableFile(file, projectId, lovableToken, clientGitSha, browserSessionId) {
    const log = (...a) => { try { console.debug('[Netuno Lovable upload]', ...a); } catch (_) {} };
    log('start', { name: file.name, size: file.size, type: file.type, projectId });

    const bearer = lovableToken.startsWith('Bearer ') ? lovableToken : `Bearer ${lovableToken}`;
    const sessionId = browserSessionId || generateId('bsess_');
    const gitSha = clientGitSha || '0000fc1b075e3775d28b74353d4734e15393a6cb';
    const contentType = file.type || 'application/octet-stream';

    const baseJsonHeaders = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': bearer,
      'x-browser-session-id': sessionId,
      'x-client-git-sha': gitSha,
      'x-lov-platform': JSON.stringify({ platform: 'web', version: gitSha })
    };

    async function postJsonApi(url, payloadObj, label) {
      const body = JSON.stringify(payloadObj || {});
      let lastErr = '';

      try {
        const r = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: baseJsonHeaders,
          body
        });
        const txt = await r.text().catch(() => '');
        log(label || 'POST', { mode: 'content', url, status: r.status, body: txt });
        if (r.ok) {
          try { return { ok: true, status: r.status, data: JSON.parse(txt || '{}'), body: txt, mode: 'content' }; }
          catch (_) { return { ok: true, status: r.status, data: {}, body: txt, mode: 'content' }; }
        }
        lastErr = `content ${r.status}: ${txt.slice(0, 300)}`;
      } catch (e) {
        lastErr = `content err: ${e?.message || e}`;
        log(label || 'POST', { mode: 'content', error: e?.message || e });
      }

      try {
        const r = await pageContextFetch(url, {
          method: 'POST',
          headers: baseJsonHeaders,
          body
        });
        log(label || 'POST', { mode: 'page', url, status: r.status, body: r.body });
        if (r.ok) {
          try { return { ok: true, status: r.status, data: JSON.parse(r.body || '{}'), body: r.body, mode: 'page' }; }
          catch (_) { return { ok: true, status: r.status, data: {}, body: r.body, mode: 'page' }; }
        }
        lastErr = `page ${r.status}: ${String(r.body || '').slice(0, 300)}`;
      } catch (e) {
        lastErr = `page err: ${e?.message || e}`;
      }

      try {
        const r = await proxyFetch(url, {
          method: 'POST',
          headers: baseJsonHeaders,
          body
        });
        log(label || 'POST', { mode: 'proxy', url, status: r.status, body: r.body });
        if (r.ok) {
          try { return { ok: true, status: r.status, data: JSON.parse(r.body || '{}'), body: r.body, mode: 'proxy' }; }
          catch (_) { return { ok: true, status: r.status, data: {}, body: r.body, mode: 'proxy' }; }
        }
        lastErr = `proxy ${r.status}: ${String(r.body || '').slice(0, 300)}`;
      } catch (e) {
        lastErr = `proxy err: ${e?.message || e}`;
      }

      try {
        window.__LOVIFY_LAST_UPLOAD_ERROR__ = lastErr;
        chrome.storage.local.set({ ll_last_upload_error: lastErr });
      } catch (_) {}

      return { ok: false, status: 0, data: null, body: lastErr, error: lastErr };
    }

    function getSignedUploadDescriptor(d) {
      if (!d || typeof d !== 'object') return { upUrl: null, fileId: null, putHeaders: {}, publicUrl: null };
      log('upload descriptor json', d);

      const upUrl =
        d.upload_url || d.uploadUrl || d.signed_url || d.signedUrl ||
        d.presigned_url || d.presignedUrl || d.put_url || d.putUrl ||
        d.uploadURL || d.url_to_upload || d.url || null;

      const fileId =
        d.file_id || d.fileId || d.id || d.uuid ||
        d.key || d.object_key || d.objectKey || d.path || d.asset_id || null;

      const publicUrl =
        d.public_url || d.publicUrl || d.cdn_url || d.cdnUrl ||
        d.download_url || d.downloadUrl || d.asset_url || d.assetUrl ||
        d.access_url || null;

      const putHeaders = {};
      if (d.headers && typeof d.headers === 'object') {
        Object.keys(d.headers).forEach((k) => {
          if (d.headers[k] != null) putHeaders[k] = String(d.headers[k]);
        });
      }

      return { upUrl, fileId, putHeaders, publicUrl };
    }

    function splitLovableFileId(fileId) {
      const clean = String(fileId || '').split('?')[0].replace(/^\/+/, '');
      const parts = clean.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return {
          dirName: parts.slice(0, -1).join('/'),
          fileName: parts[parts.length - 1]
        };
      }
      return {
        dirName: projectId,
        fileName: clean
      };
    }

    function pickDownloadUrl(d) {
      if (!d || typeof d !== 'object') return '';
      const direct =
        d.url || d.download_url || d.downloadUrl || d.public_url || d.publicUrl ||
        d.signed_url || d.signedUrl || d.asset_url || d.assetUrl ||
        d.cdn_url || d.cdnUrl || d.preview_url || d.previewUrl || '';
      if (typeof direct === 'string' && /^https?:\/\//i.test(direct)) return direct;

      const pool = [];
      llExtractHttpsUrlsDeep(d, pool, 6);
      return pool.find((u) => /storage\.googleapis|lovable|gpt-engineer|cdn|download|asset|file/i.test(u)) || pool[0] || '';
    }

    // Fluxo novo observado no Lovable:
    // POST /projects/{projectId}/files/generate-upload-url
    // Payload: { content_type, original_file_name, file_size_bytes, original_file_size_bytes }
    const uploadMetaNew = {
      content_type: contentType,
      original_file_name: file.name || 'image.png',
      file_size_bytes: file.size || 0,
      original_file_size_bytes: file.size || 0
    };

    // Fallback legado mantido caso a API antiga volte a responder.
    const legacyFileUuid = uuidv4();
    const uploadMetaLegacy = {
      file_name: legacyFileUuid,
      content_type: contentType,
      status: 'uploading',
      project_id: projectId,
      original_file_name: file.name || 'image.png',
      file_size_bytes: file.size || 0,
      original_file_size_bytes: file.size || 0
    };

    const uploadAttempts = [
      {
        url: `https://api.lovable.dev/projects/${projectId}/files/generate-upload-url`,
        payload: uploadMetaNew,
        current: true
      },
      {
        url: `https://api.lovable.dev/files/generate-upload-url`,
        payload: uploadMetaLegacy,
        current: false
      },
      {
        url: `https://api.lovable.dev/projects/${projectId}/generate-upload-url`,
        payload: uploadMetaLegacy,
        current: false
      },
      {
        url: `https://api.lovable.dev/generate-upload-url`,
        payload: uploadMetaLegacy,
        current: false
      }
    ];

    for (const attempt of uploadAttempts) {
      const metaResp = await postJsonApi(attempt.url, attempt.payload, 'generate-upload-url');
      if (!metaResp.ok || !metaResp.data) continue;

      const { upUrl, fileId, putHeaders, publicUrl } = getSignedUploadDescriptor(metaResp.data);
      if (!upUrl) {
        log('signed-url miss', { url: attempt.url, data: metaResp.data });
        continue;
      }

      const resolvedFileId = fileId || legacyFileUuid;
      log('signed-url HIT', { ep: attempt.url, upUrl, fileId: resolvedFileId, putHeaders, publicUrl });

      try {
        const putRes = await fetch(upUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': contentType,
            ...putHeaders
          }
        });

        const putText = await putRes.text().catch(() => '');
        log('PUT result', { status: putRes.status, body: putText });

        if (!(putRes.ok || putRes.status === 200 || putRes.status === 201 || putRes.status === 204)) {
          try {
            window.__LOVIFY_LAST_UPLOAD_ERROR__ = `PUT ${putRes.status}: ${putText.slice(0, 240)}`;
            chrome.storage.local.set({ ll_last_upload_error: window.__LOVIFY_LAST_UPLOAD_ERROR__ });
          } catch (_) {}
          continue;
        }

        let downloadJson = null;
        let downloadUrl = publicUrl || '';

        // Novo fluxo: após o PUT, chama /files/generate-download-url.
        if (resolvedFileId) {
          const split = splitLovableFileId(resolvedFileId);
          if (split.dirName && split.fileName) {
            const dlResp = await postJsonApi(
              `https://api.lovable.dev/files/generate-download-url`,
              { dir_name: split.dirName, file_name: split.fileName },
              'generate-download-url'
            );

            if (dlResp.ok && dlResp.data) {
              downloadJson = dlResp.data;
              downloadUrl = pickDownloadUrl(dlResp.data) || downloadUrl;
            }
          }
        }

        const row = {
          id: resolvedFileId,
          url: downloadUrl || publicUrl || null,
          name: file.name || 'image.png',
          type: contentType,
          size: file.size || 0,
          rawMeta: {
            ...(metaResp.data || {}),
            download: downloadJson || null,
            upload_endpoint: attempt.url
          }
        };

        row.resolvedUrl = pickResolvedAssetUrl(row) || downloadUrl || row.url || '';
        return row;
      } catch (e) {
        log('PUT/download err', e?.message || e);
        try {
          window.__LOVIFY_LAST_UPLOAD_ERROR__ = `PUT/download err: ${e?.message || e}`;
          chrome.storage.local.set({ ll_last_upload_error: window.__LOVIFY_LAST_UPLOAD_ERROR__ });
        } catch (_) {}
      }
    }

    log('FAILED — nenhum endpoint Lovable aceitou o upload', { name: file.name });
    return null;
  }

  /**
   * Envio para ImgBB (multipart); retorna URLs públicas para o chat (não expor na UI).
   * @returns {{ id: string, url: string, displayUrl: string }}
   */
  async function uploadFileToImgBb(file) {
    if (!file || !(file instanceof File)) throw new Error('Ficheiro inválido');
    if (file.size > IMGBB_MAX_BYTES) throw new Error('Ficheiro > 32 MB (limite ImgBB)');
    const cfg = await llLoadImgBbConfig();
    if (!cfg.key || !String(cfg.key).trim()) {
      throw new Error('ImgBB sem chave guardada nas Configurações da extensão.');
    }

    const qs = new URLSearchParams();
    qs.set('key', String(cfg.key).trim());
    if (
      cfg.expiration != null &&
      cfg.expiration >= 60 &&
      cfg.expiration <= 15552000
    ) {
      qs.set('expiration', String(cfg.expiration));
    }
    const url = `${IMGBB_API_URL}?${qs.toString()}`;
    const fd = new FormData();
    fd.append('image', file, file.name || 'image');
    if (file.name) fd.append('name', file.name);

    const r = await fetch(url, { method: 'POST', body: fd });
    const j = await r.json().catch(() => ({}));

    const hasData = !!(j.success && j.data);

    if (!hasData) {
      const errObj = j.error;
      let msg =
        (errObj && typeof errObj.message === 'string' && errObj.message) ||
        (typeof errObj === 'string' ? errObj : '') ||
        (j.status_txt && String(j.status_txt)) ||
        `ImgBB (HTTP ${r.status})`;

      const codeNum = typeof errObj?.code === 'number' ? errObj.code : Number(j.status_code || 0);
      if (codeNum === 103 || /forbidden/i.test(msg)) {
        msg +=
          '. Se aparecer só na extensão: ImgBB pode bloquear IPs de rede/datacenter — teste curl na tua rede.';
      }
      throw new Error(msg);
    }

    const d = j.data;
    const imageUrl = d.url || d.display_url || d.image?.url || '';
    if (!imageUrl) throw new Error('ImgBB sem URL na resposta');
    return {
      id: String(d.id || ''),
      url: imageUrl,
      displayUrl: String(d.display_url || d.url || imageUrl)
    };
  }

  /** Várias tentativas espaçadas ajudam quando a ImgBB atrasa ou falha só na 1ª ronda. */
  async function uploadFileToImgBbWithRetries(file) {
    const pausesMs = [0, 650, 1400, 2600];
    let lastErr;
    for (let a = 0; a < pausesMs.length; a++) {
      if (pausesMs[a] > 0) {
        await new Promise((resolve) => setTimeout(resolve, pausesMs[a]));
      }
      try {
        return await uploadFileToImgBb(file);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  }

  /** Normaliza legacy File[] para o composer. */
  function normalizeComposerAttachInput(list) {
    const arr = Array.isArray(list) ? list : [];
    return arr.map((x) => {
      if (x instanceof File) return { kind: 'lovable_file', file: x };
      return x;
    });
  }

  async function sendPromptWithFiles(promptText, fileList) {
    const { clientGitSha, projectId, lovableToken } = await getAuthBundle();
    if (!projectId) { showToast('⚠', 'Abra um projeto no Lovable.', 4000); return false; }
    if (!lovableToken) { showToast('⚠', 'Token do Lovable nao detectado.', 4000); return false; }

    const items = normalizeComposerAttachInput(Array.isArray(fileList) ? fileList : []);

    const imgbbPending = items.filter(
      (i) => i.kind === 'imgbb_image' && (i.status === 'uploading' || i.status === 'settling')
    );
    if (imgbbPending.length) {
      showToast(
        '⏳',
        imgbbPending.some((x) => x.status === 'settling')
          ? 'Aguarde ~8 s após o upload ser concluído (sincronizar URL) antes de enviar.'
          : 'Aguarde: imagens a carregar…',
        4200
      );
      return false;
    }
    const imgbbErr = items.filter((i) => i.kind === 'imgbb_image' && i.status === 'error');
    if (imgbbErr.length) {
      showToast('⚠', 'Remova anexos com erro (ImgBB) ou volte a adicionar.', 4400);
      return false;
    }

    const imgbbReady = items.filter(
      (i) => i.kind === 'imgbb_image' && i.status === 'ready' && (i.displayUrl || i.url)
    );
    const lovableItems = items.filter((i) => i.kind === 'lovable_file' && i.file instanceof File);

    // Sem arquivo: preserva literalmente a rota já usada pelo prompt puro.
    if (!imgbbReady.length && !lovableItems.length) {
      return sendPromptViaNovoIndexFlow(promptText, projectId, lovableToken, clientGitSha, { files: [], optimisticImageUrls: [], uploadedFiles: [] });
    }

    const totalSend = imgbbReady.length + lovableItems.length;
    showToast('📤', `Carregando ${totalSend} anexo(s) e enviando pelo canal da extensão…`, 5600);

    // Sessão estável para todos os uploads deste envio.
    const sharedSessionId = generateId('bsess_');
    const uploaded = [];

    for (const it of imgbbReady) {
      const resolved = it.displayUrl || it.url || '';
      uploaded.push({
        id: it.imgbbApiId || `imgbb_${it.localId}`,
        url: resolved,
        name: it.name,
        type: it.mime || 'image/png',
        size: it.size || 0,
        resolvedUrl: resolved,
        rawMeta: { imgbb: true, source_url: resolved }
      });
    }

    for (const li of lovableItems) {
      const f = li.file;
      const result = await uploadLovableFile(f, projectId, lovableToken, clientGitSha, sharedSessionId);
      if (result) uploaded.push(result);
      else showToast('⚠', `Falha no upload Lovable: ${f.name}`, 4000);
    }

    if (!uploaded.length) {
      showToast('❌', 'Nenhum anexo disponível para enviar.', 5000);
      return false;
    }

    uploaded.forEach((u) => {
      if (!u.resolvedUrl) u.resolvedUrl = pickResolvedAssetUrl(u);
    });

    const onlyLovableRows = uploaded.filter((u) => !u.rawMeta?.imgbb);
    if (onlyLovableRows.length) {
      await hydrateUploadDisplayUrls(onlyLovableRows, projectId, lovableToken);
      onlyLovableRows.forEach((u) => {
        if (!u.resolvedUrl) u.resolvedUrl = pickResolvedAssetUrl(u);
      });
    }

    const filesPayload = buildAttachmentsPayload(uploaded);
    const optimisticImageUrls = buildOptimisticImageList(uploaded);
    const uploadedFiles = uploaded.map((u) => ({
      id: u.id,
      file_id: u.id,
      name: u.name,
      file_name: u.name,
      type: u.type || 'application/octet-stream',
      size: u.size || 0,
      url: u.resolvedUrl || u.url || null,
      source: u.rawMeta?.imgbb ? 'imgbb' : 'lovable'
    }));

    try {
      // PONTO PRINCIPAL: não existe mais POST direto em /projects/{id}/chat.
      // Prompt puro e prompt com arquivos usam exatamente o mesmo netuno-handler.
      await sendPromptViaNovoIndexFlow(
        promptText || 'Analise o arquivo anexado.',
        projectId,
        lovableToken,
        clientGitSha,
        { files: filesPayload, optimisticImageUrls, uploadedFiles }
      );

      const names = uploaded.map((u) => u.name).filter(Boolean).slice(0, 5).join(', ');
      lastProxyErrorMessage = '';
      showToast('✅', `Enviado pelo canal da extensão com ${uploaded.length} anexo(s)${names ? ` · ${names}` : ''}.`, 3800);
      llSounds.send();
      llSaveToHistory(promptText || `Anexo: ${names || uploaded.length + ' arquivo(s)'}`);
      return true;
    } catch (err) {
      lastProxyErrorMessage = err?.message || 'Falha ao enviar mensagem com anexos pelo canal da extensão.';
      showToast('❌', lastProxyErrorMessage, 7000);
      llSounds.error();
      return false;
    }
  }

  async function proxySendToLovable(promptText) {
    if (!(await llLicenseHardLockCheck('enviar mensagem'))) return false;
    const prompt = normalizeText(promptText || '');
    if (!prompt) {
      showToast('⚠', 'Digite um prompt antes de enviar.', 3500);
      return false;
    }
    if (!detectProjectId()) {
      showToast('⚠', 'Abra um projeto no Lovable antes de enviar.', 4000);
      return false;
    }

    try {
      await sendPromptWithFiles(prompt, []);
      lastProxyErrorMessage = '';
      showToast('✅', 'Envio nativo confirmado pelo Lovable!', 2800);
      llSounds.send();
      llSaveToHistory(prompt);
      return true;
    } catch (err) {
      lastProxyErrorMessage = err?.message || 'Falha ao enviar pelo método nativo.';
      showToast('❌', lastProxyErrorMessage, 7000);
      llSounds.error();
      return false;
    }
  }

  function getLovableAuthHeader(lovableToken) {
    return { 'Authorization': lovableToken.startsWith('Bearer ') ? lovableToken : `Bearer ${lovableToken}` };
  }

  async function removeWatermarkServerSide() {
    await requestLatestToken();
    const { projectId, lovableToken, clientGitSha } = await getAuthBundle();

    if (!projectId || !lovableToken) {
      showToast('⚠', 'Projeto/token nao detectados. Recarregue a pagina.', 4500);
      return;
    }

    const watermarkPrompt = `Adicione o seguinte CSS ao arquivo src/index.css (ou crie se não existir) para ocultar o badge do Lovable. Não remova nenhum CSS existente, apenas adicione ao final do arquivo:

\`\`\`css
/* Remove Lovable badge */
#lovable-badge,
[class*="lovable-badge"],
[id*="lovable-badge"],
iframe[src*="lovable"] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  position: absolute !important;
  overflow: hidden !important;
}
\`\`\`

Aplique essa alteração sem modificar nada mais no projeto.`;

    try {
      showToast('📤', 'Enviando comando para remover marca d\'agua...', 3000);
      await sendPromptViaNovoIndexFlow(watermarkPrompt, projectId, lovableToken, clientGitSha);
      showToast('✅', 'Comando enviado! O Lovable vai aplicar a remoção.', 4000);
      llSounds.success();
    } catch (err) {
      showToast('❌', 'Erro ao enviar: ' + (err.message || 'falha'), 5000);
      llSounds.error();
    }
  }

  // ─── Load JSZip from extension bundle (bypasses page CSP) ──────────────────
  function loadJSZip() {
    // Prefer JSZip loaded as a content script (same isolated world).
    if (typeof globalThis !== 'undefined' && globalThis.JSZip) return Promise.resolve(globalThis.JSZip);
    if (window.JSZip) return Promise.resolve(window.JSZip);

    // Fallback: inject script into page context for environments where needed.
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = chrome.runtime.getURL('jszip.min.js');
      s.onload = () => {
        if (typeof globalThis !== 'undefined' && globalThis.JSZip) resolve(globalThis.JSZip);
        else if (window.JSZip) resolve(window.JSZip);
        else reject(new Error('JSZip não inicializou'));
      };
      s.onerror = () => reject(new Error('Falha ao carregar JSZip'));
      document.head.appendChild(s);
    });
  }

  function flattenFileTree(node, prefix) {
    prefix = prefix || '';
    const files = [];
    if (Array.isArray(node)) {
      for (const item of node) {
        const name = item.name || item.path || '';
        if (item.type === 'file' || item.kind === 'file' || (!item.children && !item.contents && name)) {
          if (name) files.push(prefix + name);
        } else {
          const children = item.children || item.contents || item.files || [];
          if (children.length) files.push(...flattenFileTree(children, prefix + (name ? name + '/' : '')));
        }
      }
    } else if (node && typeof node === 'object') {
      for (const [key, val] of Object.entries(node)) {
        if (typeof val === 'string') files.push(prefix + key);
        else if (val && typeof val === 'object') files.push(...flattenFileTree(val, prefix + key + '/'));
      }
    }
    return files;
  }

  async function downloadAndTrigger(projectId, filePaths, authH) {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    let added = 0;

    showToast('📦', `Baixando ${filePaths.length} arquivo(s)...`, 8000);

    for (const fp of filePaths.slice(0, 300)) {
      try {
        const r = await proxyFetch(
          `https://api.lovable.dev/projects/${projectId}/files/raw?path=${encodeURIComponent(fp)}`,
          { method: 'GET', headers: authH }
        );
        if (r.ok && r.body != null) {
          zip.file(fp, String(r.body));
          added++;
        }
      } catch (_) {}
    }

    if (!added) throw new Error('Nenhum arquivo baixado — verifique sua conexão e token.');

    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `project-${projectId.slice(0, 8)}.zip`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
    showToast('✅', `ZIP com ${added} arquivo(s) baixado!`, 4000);
    llSounds.success();
    return true;
  }

  async function tryApiDownloadZip() {
    await requestLatestToken();
    const { projectId, lovableToken } = await getAuthBundle();
    if (!projectId) { showToast('⚠', 'Abra um projeto no Lovable primeiro.', 4000); return false; }
    if (!lovableToken) { showToast('⚠', 'Token nao capturado. Recarregue a pagina do projeto.', 4000); return false; }

    showToast('📦', 'Buscando arquivos do projeto...', 8000);

    // Ask background service worker (no CORS, direct Lovable API)
    try {
      const bgResult = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ ok: false, files: [] }), 45000);
        chrome.runtime.sendMessage(
          { type: 'FETCH_PROJECT_FILES', projectId, lovableToken },
          (resp) => {
            clearTimeout(timer);
            resolve(resp || { ok: false, files: [] });
          }
        );
      });

      if (bgResult.ok && bgResult.files && bgResult.files.length > 0) {
        return await buildAndDownloadZip(projectId, bgResult.files);
      }
    } catch (_) {}

    showToast('⚠', 'Nao foi possivel baixar os arquivos. Verifique se o projeto esta aberto e recarregue a pagina.', 5000);
    return false;
  }

  async function buildAndDownloadZip(projectId, files) {
    if (!files || !files.length) {
      showToast('⚠', 'Nenhum arquivo encontrado no projeto.', 4000);
      return false;
    }
    showToast('📦', `Montando ZIP com ${files.length} arquivo(s)...`, 6000);
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    let added = 0;
    for (const f of files) {
      const path = f.path || f.name || f.filename || '';
      const content = f.content ?? f.code ?? f.source ?? f.text ?? null;
      if (path && content != null) {
        zip.file(path, String(content));
        added++;
      }
    }
    if (!added) {
      showToast('⚠', 'Arquivos sem conteúdo. Tente recarregar a página.', 4000);
      return false;
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `project-${projectId.slice(0, 8)}.zip`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
    showToast('✅', `ZIP com ${added} arquivo(s) baixado!`, 4000);
    llSounds.success();
    return true;
  }

  // ─── Novo Projeto LOVIFY: abre 1 aba e usa o chat nativo do Lovable ───────
  // Importante: esta automação NÃO usa proxy, NÃO usa token e NÃO usa backend.
  // Ela só digita "." no composer nativo do Lovable para iniciar a criação
  // e depois tenta pausar após 3s. Isso evita erro 401/403/404 por falta de token.
  const LL_NEW_PROJECT_BOOTSTRAP_KEY = 'll_new_project_bootstrap_v3';

  function llNewProjectId() {
    try { return 'lnp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }
    catch (_) { return 'lnp_' + Date.now(); }
  }

  function llIsElementVisible(el) {
    try {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const st = window.getComputedStyle(el);
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && st.opacity !== '0';
    } catch (_) { return false; }
  }

  function llFindNativeLovableSendButton() {
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter((b) => llIsElementVisible(b) && !b.disabled && b.getAttribute('aria-disabled') !== 'true');

    // 1) seletores mais prováveis do Lovable
    const direct = document.querySelector(
      'button[data-testid="chatinput-send-message-button"], button[aria-label*="Send" i], button[aria-label*="Enviar" i], button[aria-label*="Submit" i], button[type="submit"]'
    );
    if (direct && llIsElementVisible(direct) && !direct.disabled) return direct;

    // 2) botão próximo ao editor com ícone/seta
    const ed = findEditor();
    if (ed) {
      const card = ed.closest('form, [role="form"], div') || ed.parentElement;
      if (card) {
        const localButtons = Array.from(card.querySelectorAll('button'))
          .filter((b) => llIsElementVisible(b) && !b.disabled && b.getAttribute('aria-disabled') !== 'true');
        const local = localButtons.find((b) => {
          const label = ((b.getAttribute('aria-label') || '') + ' ' + (b.title || '') + ' ' + (b.textContent || '')).toLowerCase();
          return label.includes('send') || label.includes('enviar') || label.includes('submit') || label.includes('arrow') || b.querySelector('svg');
        });
        if (local) return local;
      }
    }

    // 3) último botão visível perto do centro do composer costuma ser a seta
    return buttons.find((b) => {
      const label = ((b.getAttribute('aria-label') || '') + ' ' + (b.title || '') + ' ' + (b.textContent || '')).toLowerCase();
      return label.includes('send') || label.includes('enviar') || label.includes('submit') || label.includes('up') || label.includes('arrow');
    }) || null;
  }

  function llFindNativePauseButton() {
    const terms = ['pause', 'pausar', 'stop', 'parar', 'cancel', 'cancelar', 'interromper'];
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter((b) => llIsElementVisible(b) && !b.disabled && b.getAttribute('aria-disabled') !== 'true');
    return buttons.find((b) => {
      const label = ((b.getAttribute('aria-label') || '') + ' ' + (b.title || '') + ' ' + (b.textContent || '')).toLowerCase();
      return terms.some((t) => label.includes(t));
    }) || null;
  }


  function llFindWorkspaceContinueButton() {
    try {
      const buttons = Array.from(document.querySelectorAll('button'))
        .filter((b) => llIsElementVisible(b) && !b.disabled && b.getAttribute('aria-disabled') !== 'true');

      // Modal do Lovable que aparece antes de criar projeto:
      // "Switch workspace" / "Select a workspace..." + botão "Continue".
      const modalCandidates = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"], div'))
        .filter((el) => llIsElementVisible(el))
        .filter((el) => {
          const txt = String(el.innerText || el.textContent || '').toLowerCase();
          return (
            txt.includes('switch workspace') ||
            txt.includes('select a workspace') ||
            txt.includes('workspace') && (txt.includes('continue') || txt.includes('continuar'))
          );
        });

      for (const modal of modalCandidates) {
        const btn = Array.from(modal.querySelectorAll('button'))
          .filter((b) => llIsElementVisible(b) && !b.disabled && b.getAttribute('aria-disabled') !== 'true')
          .find((b) => {
            const label = ((b.getAttribute('aria-label') || '') + ' ' + (b.title || '') + ' ' + (b.textContent || '')).toLowerCase().trim();
            return label.includes('continue') || label.includes('continuar') || label.includes('confirmar') || label.includes('selecionar');
          });
        if (btn) return btn;
      }

      // Fallback bem restrito: só clicar em Continue se existir texto de workspace visível na página.
      const pageText = String(document.body && (document.body.innerText || document.body.textContent) || '').toLowerCase();
      if (pageText.includes('switch workspace') || pageText.includes('select a workspace')) {
        return buttons.find((b) => {
          const label = ((b.getAttribute('aria-label') || '') + ' ' + (b.title || '') + ' ' + (b.textContent || '')).toLowerCase().trim();
          return label === 'continue' || label === 'continuar' || label.includes('continue') || label.includes('continuar');
        }) || null;
      }
    } catch (_) {}
    return null;
  }

  async function llConfirmWorkspaceIfNeeded(timeoutMs = 9000) {
    const btn = await llWaitFor(() => llFindWorkspaceContinueButton(), timeoutMs, 350);
    if (!btn) return false;
    try {
      btn.click();
      showToast('✅', 'Workspace confirmado. Vou aguardar o chat carregar…', 3600);
      await llSleep(2200);
      return true;
    } catch (_) {
      return false;
    }
  }

  function llSleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function llWaitFor(fn, timeoutMs = 45000, everyMs = 450) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      try {
        const v = fn();
        if (v) return v;
      } catch (_) {}
      await llSleep(everyMs);
    }
    return null;
  }

  async function llRunNewProjectBootstrapIfNeeded() {
    try {
      const data = await new Promise((resolve) => chrome.storage.local.get([LL_NEW_PROJECT_BOOTSTRAP_KEY], resolve));
      const job = data && data[LL_NEW_PROJECT_BOOTSTRAP_KEY];
      if (!job || job.done || job.running) return;
      if (Date.now() > Number(job.expiresAt || 0)) return;
      const href = String(location.href || '');
      const pageHasJobId = href.includes(String(job.id || '')) || href.includes('lovify_new_project=1');
      const isLovableHome = location.hostname.endsWith('lovable.dev') && !/\/projects\/[a-zA-Z0-9_-]+/i.test(location.pathname);
      if (!pageHasJobId && !isLovableHome) return;

      job.running = true;
      await chrome.storage.local.set({ [LL_NEW_PROJECT_BOOTSTRAP_KEY]: job });
      window.__LOVIFY_NATIVE_BOOTSTRAP_MODE = true;

      showToast('🆕', 'Criando novo projeto: verificando workspace e aguardando o chat carregar…', 5000);

      // Se o Lovable pedir para escolher/confirmar o workspace, clique em Continue antes de enviar o ponto.
      await llConfirmWorkspaceIfNeeded(10000);

      const ed = await llWaitFor(() => findEditor(), 60000, 500);
      if (!ed) throw new Error('Campo do chat do Lovable não encontrado.');

      // Em alguns carregamentos o modal aparece depois do composer; conferir novamente antes de enviar.
      await llConfirmWorkspaceIfNeeded(3000);

      setEditorText(ed, '.');
      await llSleep(700);

      // Se o modal apareceu após digitar, confirmar e revalidar o campo.
      await llConfirmWorkspaceIfNeeded(2500);

      const sendBtn = await llWaitFor(() => llFindNativeLovableSendButton(), 12000, 350);
      if (!sendBtn) throw new Error('Botão de enviar nativo do Lovable não encontrado.');

      // Clique nativo: o interceptador da LOVIFY ignora enquanto __LOVIFY_NATIVE_BOOTSTRAP_MODE estiver ativo.
      sendBtn.click();
      showToast('✅', 'Ponto enviado pelo chat nativo. Vou pausar em 3 segundos…', 3800);

      await llSleep(3000);
      const pauseBtn = llFindNativePauseButton();
      if (pauseBtn) {
        pauseBtn.click();
        showToast('⏸️', 'Criação pausada. Projeto pronto para usar normalmente.', 4500);
      } else {
        showToast('⚠️', 'Projeto iniciado. Não encontrei o botão Pausar; pause manualmente se necessário.', 6000);
      }

      job.done = true;
      job.running = false;
      job.doneAt = Date.now();
      await chrome.storage.local.set({ [LL_NEW_PROJECT_BOOTSTRAP_KEY]: job });
    } catch (err) {
      try {
        const data = await new Promise((resolve) => chrome.storage.local.get([LL_NEW_PROJECT_BOOTSTRAP_KEY], resolve));
        const job = data && data[LL_NEW_PROJECT_BOOTSTRAP_KEY];
        if (job) {
          job.done = true;
          job.running = false;
          job.error = err && err.message ? err.message : String(err || 'erro');
          await chrome.storage.local.set({ [LL_NEW_PROJECT_BOOTSTRAP_KEY]: job });
        }
      } catch (_) {}
      showToast('❌', 'Novo projeto: ' + (err && err.message ? err.message : 'falha na automação'), 7000);
    } finally {
      window.__LOVIFY_NATIVE_BOOTSTRAP_MODE = false;
    }
  }

  async function createProjectViaApi() {
    try {
      const now = Date.now();
      const data = await new Promise((resolve) => chrome.storage.local.get([LL_NEW_PROJECT_BOOTSTRAP_KEY], resolve));
      const oldJob = data && data[LL_NEW_PROJECT_BOOTSTRAP_KEY];
      if (oldJob && !oldJob.done && Number(oldJob.expiresAt || 0) > now && now - Number(oldJob.createdAt || 0) < 12000) {
        showToast('⏳', 'Já estou abrindo uma aba para criar o projeto. Aguarde…', 4500);
        return null;
      }

      const id = llNewProjectId();
      const job = { id, createdAt: now, expiresAt: now + 120000, done: false, running: false };
      await chrome.storage.local.set({ [LL_NEW_PROJECT_BOOTSTRAP_KEY]: job });

      const url = `https://lovable.dev/?lovify_new_project=1&lovify_job=${encodeURIComponent(id)}#lovify_job_${encodeURIComponent(id)}`;
      chrome.runtime.sendMessage({ type: 'LL_OPEN_URL', url });
      showToast('🆕', 'Abrindo 1 nova aba do Lovable. Vou digitar "." e pausar automaticamente.', 6500);
      return null;
    } catch (_) {
      chrome.runtime.sendMessage({ type: 'LL_OPEN_URL', url: 'https://lovable.dev/' });
      showToast('🆕', 'Abrindo Lovable para criar novo projeto.', 5000);
      return null;
    }
  }

  // Executa somente na aba nova marcada pelo botão Novo Projeto.
  setTimeout(() => { llRunNewProjectBootstrapIfNeeded(); }, 1200);

  // ─── Intercept Lovable send button / Enter key ─────────────────────────────
  function normalizeText(t) {
    return String(t || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();
  }

  function findEditor() {
    return (
      document.querySelector('.ProseMirror[contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"][aria-label*="Chat" i]') ||
      document.querySelector('div.tiptap[contenteditable="true"]') ||
      document.querySelector('[data-chat-panel] [contenteditable="true"]') ||
      document.querySelector('textarea[data-testid="chat-input"]') ||
      document.querySelector('textarea[placeholder*="message" i]') ||
      document.querySelector('textarea[placeholder*="What do you want" i]') ||
      null
    );
  }

  function getEditorText(ed) {
    if (!ed) return '';
    if (ed.tagName === 'TEXTAREA') return normalizeText(ed.value);
    return normalizeText(ed.innerText || ed.textContent);
  }

  function clearEditor(ed) {
    if (!ed) return;
    try {
      if (ed.tagName === 'TEXTAREA') {
        ed.value = '';
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        ed.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        ed.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
      }
    } catch (_) {}
  }

  function setEditorText(ed, text) {
    if (!ed) return;
    const value = String(text || '');
    try {
      if (ed.tagName === 'TEXTAREA') {
        ed.value = value;
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        ed.dispatchEvent(new Event('change', { bubbles: true }));
        ed.focus();
      } else {
        ed.focus();
        /* ProseMirror / Tiptap: simular digitação real */
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, value);
        /* Fallback se execCommand não disparou */
        if (!(ed.innerText || '').trim() && value) {
          ed.innerHTML = `<p>${value.replace(/\n/g, '<br>')}</p>`;
        }
        ed.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
        ed.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (_) {}
  }

  function llGetExtensionComposerTextarea() {
    return document.getElementById('ll-composer-text');
  }

  function llPersistUnifiedDraft(text) {
    const value = String(text || '');
    clearTimeout(llNativeDraftPersistTimer);
    llNativeDraftPersistTimer = window.setTimeout(() => {
      try {
        if (value) chrome.storage.local.set({ [STORAGE_NATIVE_PROMPT_DRAFT]: value });
        else chrome.storage.local.remove(STORAGE_NATIVE_PROMPT_DRAFT);
      } catch (_) {}
    }, 120);
  }

  function llSetExtensionComposerDraft(text, options = {}) {
    const value = String(text || '');
    const ta = llGetExtensionComposerTextarea();
    if (ta && ta.value !== value) {
      ta.value = value;
      try { ta.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
    }
    if (options.persist !== false) llPersistUnifiedDraft(value);
    try { syncComposerSendButtonDisabled(); } catch (_) {}
    return value;
  }

  function llSyncNativePromptIntoExtension(editor) {
    if (llSuppressNativeDraftSync) return '';
    const ed = editor || findEditor();
    const value = getEditorText(ed);
    llSetExtensionComposerDraft(value, { persist: true });
    return value;
  }

  function llClearUnifiedComposerDraft(editor) {
    llSuppressNativeDraftSync = true;
    try {
      const ed = editor || findEditor();
      clearEditor(ed);
      const ta = llGetExtensionComposerTextarea();
      if (ta) ta.value = '';
      try { chrome.storage.local.remove(STORAGE_NATIVE_PROMPT_DRAFT); } catch (_) {}
    } finally {
      window.setTimeout(() => { llSuppressNativeDraftSync = false; }, 0);
    }
  }

  function llIsInsideNativeComposer(target) {
    if (!target || llNodeBelongsToExtension(target)) return false;
    const editor = findEditor();
    if (!editor) return false;
    if (target === editor || editor.contains?.(target)) return true;
    const root = llFindNativeComposerRoot();
    return !!(root && root !== document && root.contains?.(target));
  }

  function llObserveNativeEditor() {
    const editor = findEditor();
    if (editor === llObservedNativeEditor) {
      llScheduleNativeCosmeticAttachmentsRender();
      return;
    }
    try { llNativePromptObserver?.disconnect(); } catch (_) {}
    llObservedNativeEditor = editor || null;
    if (!editor) return;
    llNativePromptObserver = new MutationObserver(() => {
      window.setTimeout(() => llSyncNativePromptIntoExtension(editor), 0);
    });
    try {
      llNativePromptObserver.observe(editor, { childList: true, subtree: true, characterData: true });
    } catch (_) {}
    llSyncNativePromptIntoExtension(editor);
    llScheduleNativeCosmeticAttachmentsRender();
  }

  function initLovableNativePromptBridge() {
    if (window.__LL_NATIVE_PROMPT_BRIDGE__) return;
    window.__LL_NATIVE_PROMPT_BRIDGE__ = true;

    const syncFromEvent = (e) => {
      if (llSuppressNativeDraftSync || llNodeBelongsToExtension(e.target)) return;
      const editor = findEditor();
      if (!editor || (e.target !== editor && !editor.contains?.(e.target))) return;
      window.setTimeout(() => llSyncNativePromptIntoExtension(editor), 0);
    };

    document.addEventListener('input', syncFromEvent, true);
    document.addEventListener('keyup', syncFromEvent, true);
    document.addEventListener('paste', syncFromEvent, true);
    document.addEventListener('focusin', () => llObserveNativeEditor(), true);
    llObserveNativeEditor();
    window.setInterval(llObserveNativeEditor, 1000);
  }

  function aiFlagOn(v) {
    return (
      v === true ||
      v === 1 ||
      String(v).toLowerCase() === 'true' ||
      String(v) === '1'
    );
  }

  async function llLoadAiConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [
          'll_ai_openai_on',
          'll_ai_openai_key',
          'll_ai_openai_model',
          'll_ai_openai_temp',
          'll_ai_anthropic_on',
          'll_ai_anthropic_key',
          'll_ai_anthropic_model',
          'll_ai_anthropic_temp',
          'll_ai_google_on',
          'll_ai_google_key',
          'll_ai_google_model',
          'll_ai_google_temp',
          'll_ai_groq_on',
          'll_ai_groq_key',
          'll_ai_groq_model',
          'll_ai_groq_temp'
        ],
        resolve
      );
    });
  }

  function aiSafeTemp(v, def = 0.7) {
    const x = Number(v);
    if (!Number.isFinite(x)) return def;
    return Math.min(2, Math.max(0, x));
  }

  function getImproveSystemPrompt() {
    let sys = 'Melhora o seguinte pedido tecnico do utilizador (Lovable.dev): claro, em portugues, sem perder objetivos. Responde APENAS com o texto melhorado.';
    if (llImproveContext) {
      sys += '\n\nCONTEXTO DO PROJETO (use para enriquecer e contextualizar o prompt):\n' + llImproveContext;
    }
    return sys;
  }

  async function improvePromptViaOpenAi(src, cfg) {
    const key = String(cfg.ll_ai_openai_key || '').trim();
    if (!aiFlagOn(cfg.ll_ai_openai_on) || !key) return null;
    const model = String(cfg.ll_ai_openai_model || '').trim() || 'gpt-4o-mini';
    const temperature = aiSafeTemp(cfg.ll_ai_openai_temp, 0.7);
    const body = JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'system', content: getImproveSystemPrompt() },
        { role: 'user', content: src }
      ]
    });
    const resp = await proxyFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body
    });
    if (!resp.ok) {
      let msg = '';
      try {
        const j = JSON.parse(resp.body || '{}');
        msg = j?.error?.message || '';
      } catch (_) {}
      throw new Error(msg || `OpenAI (${resp.status})`);
    }
    const j = JSON.parse(resp.body || '{}');
    const txt = String(j?.choices?.[0]?.message?.content || '').trim();
    return txt || null;
  }

  async function improvePromptViaAnthropic(src, cfg) {
    const key = String(cfg.ll_ai_anthropic_key || '').trim();
    if (!aiFlagOn(cfg.ll_ai_anthropic_on) || !key) return null;
    const model =
      String(cfg.ll_ai_anthropic_model || '').trim() || 'claude-3-5-sonnet-20241022';
    const temperature = aiSafeTemp(cfg.ll_ai_anthropic_temp, 0.7);
    const body = JSON.stringify({
      model,
      max_tokens: 4096,
      temperature,
      system: getImproveSystemPrompt(),
      messages: [{ role: 'user', content: src }]
    });
    const resp = await proxyFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body
    });
    if (!resp.ok) {
      let msg = '';
      try {
        const j = JSON.parse(resp.body || '{}');
        msg = j?.error?.message || '';
      } catch (_) {}
      throw new Error(msg || `Anthropic (${resp.status})`);
    }
    const j = JSON.parse(resp.body || '{}');
    const block = Array.isArray(j?.content) ? j.content.find((x) => x?.type === 'text') : null;
    const txt = String(block?.text || '').trim();
    return txt || null;
  }

  async function improvePromptViaGoogle(src, cfg) {
    const key = String(cfg.ll_ai_google_key || '').trim();
    if (!aiFlagOn(cfg.ll_ai_google_on) || !key) return null;
    const model = String(cfg.ll_ai_google_model || '').trim() || 'gemini-1.5-flash';
    const temperature = aiSafeTemp(cfg.ll_ai_google_temp, 0.7);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(key)}`;
    const body = JSON.stringify({
      contents: [
        {
          parts: [{ text: `${getImproveSystemPrompt()}\n\nPedido utilizador:\n${src}` }]
        }
      ],
      generationConfig: { temperature }
    });
    const resp = await proxyFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    if (!resp.ok) {
      let msg = '';
      try {
        const j = JSON.parse(resp.body || '{}');
        msg = j?.error?.message || '';
      } catch (_) {}
      throw new Error(msg || `Google AI (${resp.status})`);
    }
    const j = JSON.parse(resp.body || '{}');
    const txt = String(j?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    return txt || null;
  }

  async function improvePromptViaGroq(src, cfg) {
    const key = String(cfg.ll_ai_groq_key || '').trim();
    if (!aiFlagOn(cfg.ll_ai_groq_on) || !key) return null;
    const model = String(cfg.ll_ai_groq_model || '').trim() || 'llama-3.3-70b-versatile';
    const temperature = aiSafeTemp(cfg.ll_ai_groq_temp, 0.7);
    const body = JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'system', content: getImproveSystemPrompt() },
        { role: 'user', content: src }
      ]
    });
    const resp = await proxyFetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key
      },
      body
    });
    if (!resp.ok) {
      let msg = '';
      try {
        const j = JSON.parse(resp.body || '{}');
        msg = j?.error?.message || '';
      } catch (_) {}
      throw new Error(msg || 'Groq (' + resp.status + ')');
    }
    const j = JSON.parse(resp.body || '{}');
    const txt = String(j?.choices?.[0]?.message?.content || '').trim();
    return txt || null;
  }

  async function improvePromptWithConfiguredProviders(originalPrompt) {
    const cfg = await llLoadAiConfig();
    try {
      if (aiFlagOn(cfg.ll_ai_groq_on) && String(cfg.ll_ai_groq_key || '').trim()) {
        const t = await improvePromptViaGroq(originalPrompt, cfg);
        if (t) return t;
      }
    } catch (e) {
      showToast('⚠', 'Groq · ' + (e?.message || 'falhou'), 5000);
    }
    try {
      if (aiFlagOn(cfg.ll_ai_openai_on) && String(cfg.ll_ai_openai_key || '').trim()) {
        const t = await improvePromptViaOpenAi(originalPrompt, cfg);
        if (t) return t;
      }
    } catch (e) {
      showToast('⚠', 'OpenAI · ' + (e?.message || 'falhou'), 5000);
    }
    try {
      if (aiFlagOn(cfg.ll_ai_anthropic_on) && String(cfg.ll_ai_anthropic_key || '').trim()) {
        const t = await improvePromptViaAnthropic(originalPrompt, cfg);
        if (t) return t;
      }
    } catch (e) {
      showToast('⚠', 'Anthropic · ' + (e?.message || 'falhou'), 5000);
    }
    try {
      if (aiFlagOn(cfg.ll_ai_google_on) && String(cfg.ll_ai_google_key || '').trim()) {
        const t = await improvePromptViaGoogle(originalPrompt, cfg);
        if (t) return t;
      }
    } catch (e) {
      showToast('⚠', 'Google AI · ' + (e?.message || 'falhou'), 5000);
    }
    return null;
  }

  /** Melhor prompt: primeiro fornecedores ativos nas Configurações → senão API Netuno Lovable. */
  async function improvePromptHybrid(originalPrompt) {
    const custom = await improvePromptWithConfiguredProviders(originalPrompt);
    if (custom && String(custom).trim()) return String(custom).trim();
    return improvePromptServer(originalPrompt);
  }

  async function improvePromptServer(originalPrompt) {
    if (llIsMacChrome()) return improvePromptLocal(originalPrompt);
    // Tenta usar a API do Lovable diretamente para otimizar via chat completions
    await requestLatestToken();
    const { projectId, lovableToken } = await getAuthBundle();
    if (!lovableToken) throw new Error('Token nao detectado. Recarregue a pagina.');

    // Monta system prompt com contexto opcional
    let systemPrompt = 'Voce e um especialista em engenharia de prompts para desenvolvimento web. Reescreva o prompt do usuario de forma mais clara, detalhada e estruturada para obter melhores resultados de uma IA de desenvolvimento. Responda APENAS com o prompt melhorado, sem explicacoes extras.';
    if (llImproveContext) {
      systemPrompt += '\n\nCONTEXTO DO PROJETO (use para enriquecer o prompt):\n' + llImproveContext;
    }

    // Tenta endpoint de AI completions via Lovable API
    const headers = getLovableAuthHeader(lovableToken);
    const completionRes = await proxyFetch('https://api.lovable.dev/chat/completions', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: originalPrompt }
        ],
        max_tokens: 2000
      })
    });

    if (completionRes.ok) {
      let resp = {};
      try { resp = JSON.parse(completionRes.body || '{}'); } catch (_) {}
      const text = resp?.choices?.[0]?.message?.content || resp?.content || resp?.text || '';
      if (text.trim()) return text.trim();
    }

    // Fallback: melhoria local (estrutura o prompt sem IA externa)
    return improvePromptLocal(originalPrompt);
  }

  function improvePromptLocal(originalPrompt) {
    // Reformata o prompt com estrutura clara, incluindo contexto se disponivel
    const lines = originalPrompt.trim().split('\n').filter(l => l.trim());
    let improved = '';

    if (lines.length === 1 && lines[0].length < 100) {
      improved = 'Desenvolva a seguinte funcionalidade com codigo limpo, moderno e responsivo:\n\n';
      improved += '## Objetivo\n' + lines[0] + '\n\n';
      improved += '## Requisitos\n- Interface moderna e responsiva\n- Codigo limpo e bem organizado\n- Boas praticas de UX/UI\n- Compativel com mobile';
    } else {
      improved = '## Objetivo Principal\n' + lines[0] + '\n\n';
      if (lines.length > 1) {
        improved += '## Detalhes e Requisitos\n';
        for (let i = 1; i < lines.length; i++) {
          improved += '- ' + lines[i].replace(/^[-•*]\s*/, '') + '\n';
        }
      }
      improved += '\n## Observacoes\n- Mantenha o codigo limpo e organizado\n- Use boas praticas de desenvolvimento\n- Interface responsiva e acessivel';
    }

    // Anexa contexto se existir
    if (llImproveContext) {
      improved += '\n\n## Contexto do Projeto\n' + llImproveContext;
    }

    return improved;
  }

  function llNodeBelongsToExtension(node) {
    try {
      const el = node && node.nodeType === 1 ? node : node?.parentElement;
      return !!(el && el.closest && el.closest('#ll-bubble-wrap'));
    } catch (_) {
      return false;
    }
  }

  function llAttachmentFileName(item) {
    if (!item) return '';
    return item.kind === 'lovable_file'
      ? String(item.file?.name || '')
      : String(item.name || '');
  }

  function llAttachmentFileSize(item) {
    if (!item) return 0;
    if (item.kind === 'lovable_file') return Number(item.file?.size || 0);
    return Number(item.size || 0);
  }

  function llAttachmentFileTypeLabel(item) {
    const name = llAttachmentFileName(item);
    const match = name.match(/\.([a-z0-9]{1,12})$/i);
    if (match && match[1]) return match[1].toUpperCase();
    const mime = String(item?.kind === 'lovable_file' ? item.file?.type || '' : item?.mime || '');
    if (mime.startsWith('image/')) return 'IMAGEM';
    if (mime === 'application/pdf') return 'PDF';
    if (mime.startsWith('text/')) return 'TEXTO';
    return 'ARQUIVO';
  }

  function llFormatAttachmentBytes(bytes) {
    const size = Number(bytes || 0);
    if (!Number.isFinite(size) || size <= 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  }

  function llGetNativeCosmeticAttachmentPlacement() {
    const editor = findEditor();
    if (!editor || llNodeBelongsToExtension(editor)) return null;

    const form = editor.closest?.('form');
    if (form) {
      // O primeiro filho do form que contém o editor costuma ser a caixa arredondada
      // do composer. A faixa deve entrar DENTRO dessa caixa, acima da linha de digitação,
      // e não como uma linha de tamanho integral do próprio form.
      let composerShell = editor;
      while (composerShell.parentElement && composerShell.parentElement !== form) {
        composerShell = composerShell.parentElement;
      }

      if (composerShell && composerShell !== editor) {
        let editorRow = editor;
        while (editorRow.parentElement && editorRow.parentElement !== composerShell) {
          editorRow = editorRow.parentElement;
        }
        return { host: composerShell, anchor: editorRow };
      }

      return { host: form, anchor: composerShell || editor };
    }

    // Fallback para versões do Lovable sem <form>: usa o contêiner imediato do editor.
    const host = editor.parentElement;
    return host ? { host, anchor: editor } : null;
  }

  function llScheduleNativeCosmeticAttachmentsRender() {
    if (llNativeCosmeticRenderFrame) cancelAnimationFrame(llNativeCosmeticRenderFrame);
    llNativeCosmeticRenderFrame = requestAnimationFrame(() => {
      llNativeCosmeticRenderFrame = 0;
      llRenderNativeCosmeticAttachments();
    });
  }

  function llRenderNativeCosmeticAttachments() {
    let tray = document.getElementById(LL_NATIVE_COSMETIC_ATTACHMENTS_ID);
    const placement = llGetNativeCosmeticAttachmentPlacement();
    if (!composerAttachmentList.length || !placement) {
      if (tray) tray.remove();
      return;
    }

    if (!tray) {
      tray = document.createElement('div');
      tray.id = LL_NATIVE_COSMETIC_ATTACHMENTS_ID;
      tray.setAttribute('role', 'list');
      tray.setAttribute('aria-label', 'Arquivos anexados pela extensão');
      tray.setAttribute('data-ll-cosmetic-only', 'true');
    }

    const { host, anchor } = placement;
    if (tray.parentElement !== host || tray.nextSibling !== anchor) {
      try { host.insertBefore(tray, anchor || host.firstChild); }
      catch (_) { try { host.prepend(tray); } catch (_) {} }
    }

    tray.replaceChildren();
    composerAttachmentList.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'll-native-cosmetic-file-card';
      card.setAttribute('role', 'listitem');
      card.dataset.fingerprint = composerAttachmentFingerprint(item);

      const icon = document.createElement('span');
      icon.className = 'll-native-cosmetic-file-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M6.75 2.75h6.4l4.1 4.1v12.4a2 2 0 0 1-2 2h-8.5a2 2 0 0 1-2-2V4.75a2 2 0 0 1 2-2Z"/><path d="M13 3v4.25h4.25"/><path d="m9.25 15.5 1.75 1.75 3.75-4"/></svg>';

      const copy = document.createElement('span');
      copy.className = 'll-native-cosmetic-file-copy';

      const name = document.createElement('span');
      name.className = 'll-native-cosmetic-file-name';
      name.textContent = llAttachmentFileName(item) || 'Arquivo';
      name.title = name.textContent;

      const meta = document.createElement('span');
      meta.className = 'll-native-cosmetic-file-meta';
      const size = llFormatAttachmentBytes(llAttachmentFileSize(item));
      meta.textContent = [llAttachmentFileTypeLabel(item), size].filter(Boolean).join(' · ');

      copy.append(name, meta);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'll-native-cosmetic-file-remove';
      remove.setAttribute('aria-label', `Remover ${name.textContent}`);
      remove.title = 'Remover arquivo';
      remove.textContent = '×';
      remove.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        try { event.stopImmediatePropagation(); } catch (_) {}

        // Resolve novamente pelo fingerprint do cartão. Assim, com ZIP + imagem + outros
        // arquivos, o X exclui somente o cartão clicado e preserva todos os demais.
        const fingerprint = String(card.dataset.fingerprint || '');
        const exactItem = composerAttachmentList.find(
          (candidate) => composerAttachmentFingerprint(candidate) === fingerprint
        );
        if (exactItem) {
          llRemoveComposerAttachment(exactItem, {
            syncNative: false,
            reason: 'native-cosmetic-x'
          });
        }
      });

      card.append(icon, copy, remove);
      tray.appendChild(card);
    });
  }

  function llForgetNativeInput(input) {
    if (!input) return;
    for (const [fingerprint, inputs] of llNativeInputsByFingerprint.entries()) {
      inputs.delete(input);
      if (!inputs.size) llNativeInputsByFingerprint.delete(fingerprint);
    }
  }

  function llRegisterNativeInputFiles(input, files) {
    if (!(input instanceof HTMLInputElement)) return;
    llForgetNativeInput(input);
    Array.from(files || []).forEach((file) => {
      const normalized = normalizeIncomingFileForComposer(file);
      const fingerprint = composerFileFingerprint(normalized);
      if (!fingerprint) return;
      let inputs = llNativeInputsByFingerprint.get(fingerprint);
      if (!inputs) {
        inputs = new Set();
        llNativeInputsByFingerprint.set(fingerprint, inputs);
      }
      inputs.add(input);
    });
  }

  function llFilesFromClipboardEvent(e) {
    const out = [];
    const seen = new Set();
    const push = (file) => {
      if (!(file instanceof File) && !(file instanceof Blob)) return;
      const normalized = normalizeIncomingFileForComposer(file);
      if (!normalized) return;
      const fp = composerFileFingerprint(normalized);
      if (fp && seen.has(fp)) return;
      if (fp) seen.add(fp);
      out.push(normalized);
    };
    try { Array.from(e.clipboardData?.files || []).forEach(push); } catch (_) {}
    try {
      Array.from(e.clipboardData?.items || []).forEach((item) => {
        if (!item || item.kind !== 'file') return;
        try { push(item.getAsFile?.()); } catch (_) {}
      });
    } catch (_) {}
    return out;
  }

  async function llMirrorLovableChatFiles(files, sourceEvent) {
    const snapshot = Array.from(files || []).filter((f) => f instanceof File || f instanceof Blob);
    if (!snapshot.length) return 0;
    // A origem é irrelevante para o envio: entra exatamente como anexo selecionado na extensão.
    const added = await addComposerFiles(snapshot, { source: 'extension' });
    if (added > 0) {
      showToast(
        '📎',
        added === 1
          ? 'Arquivo do chat Lovable carregado na extensão.'
          : `${added} arquivos do chat Lovable carregados na extensão.`,
        3200
      );
      try {
        window.dispatchEvent(new CustomEvent('LL_LOVABLE_FILES_MIRRORED', {
          detail: { count: added, source: sourceEvent || 'unknown' }
        }));
      } catch (_) {}
    }
    return added;
  }

  function llLooksLikeNativeRemoveControl(control) {
    if (!control || llNodeBelongsToExtension(control)) return false;
    const descriptor = [
      control.getAttribute?.('aria-label'),
      control.getAttribute?.('title'),
      control.getAttribute?.('data-testid'),
      control.getAttribute?.('data-action'),
      control.textContent
    ].filter(Boolean).join(' ').trim().toLowerCase();
    if (/\b(remove|delete|detach|remover|excluir|tirar)\b/.test(descriptor)) return true;
    if (/(attachment|anexo|arquivo|file).*(remove|delete|remover|excluir)/.test(descriptor)) return true;
    const compact = String(control.textContent || '').trim();
    return compact === '×' || compact === '✕' || compact === '✖' || compact.toLowerCase() === 'x';
  }

  function llFindMirroredAttachmentNearControl(control) {
    const items = composerAttachmentList
      .filter((item) => item && item.source === 'lovable_chat')
      .sort((a, b) => llAttachmentFileName(b).length - llAttachmentFileName(a).length);
    if (!items.length) return null;

    const chunks = [];
    let node = control;
    for (let depth = 0; node && depth < 7; depth++, node = node.parentElement) {
      try {
        chunks.push(node.getAttribute?.('aria-label') || '');
        chunks.push(node.getAttribute?.('title') || '');
        chunks.push(node.getAttribute?.('data-testid') || '');
        chunks.push(node.textContent || '');
      } catch (_) {}
    }
    const nearby = chunks.join(' ').toLocaleLowerCase();
    for (const item of items) {
      const name = llAttachmentFileName(item).trim().toLocaleLowerCase();
      if (name && nearby.includes(name)) return item;
    }
    return null;
  }

  function llFindNativeComposerRoot() {
    const editor = findEditor();
    if (!editor) return document;
    const form = editor.closest?.('form');
    if (form) return form;
    let node = editor.parentElement;
    for (let depth = 0; node && depth < 7; depth++, node = node.parentElement) {
      try {
        if (node.querySelector?.('button[data-testid="chatinput-send-message-button"]')) return node;
        if (node.querySelector?.('input[type="file"]')) return node;
      } catch (_) {}
    }
    return editor.parentElement || document;
  }

  function llFindNativeRemoveControlForAttachment(item) {
    const fileName = llAttachmentFileName(item).trim().toLocaleLowerCase();
    if (!fileName) return null;
    const roots = [llFindNativeComposerRoot(), document];
    const seen = new Set();
    for (const root of roots) {
      if (!root || seen.has(root)) continue;
      seen.add(root);
      let controls = [];
      try { controls = Array.from(root.querySelectorAll('button,[role="button"]')); } catch (_) {}
      for (const control of controls) {
        if (!llLooksLikeNativeRemoveControl(control)) continue;
        let node = control;
        for (let depth = 0; node && depth < 7; depth++, node = node.parentElement) {
          const nearby = String(node.textContent || '').trim().toLocaleLowerCase();
          const descriptor = [
            node.getAttribute?.('aria-label'),
            node.getAttribute?.('title'),
            node.getAttribute?.('data-testid')
          ].filter(Boolean).join(' ').toLocaleLowerCase();
          if (nearby.includes(fileName) || descriptor.includes(fileName)) return control;
        }
      }
    }
    return null;
  }

  function llRemoveAttachmentFromNativeInputs(item) {
    const fingerprint = composerAttachmentFingerprint(item);
    if (!fingerprint) return false;
    const inputs = Array.from(llNativeInputsByFingerprint.get(fingerprint) || []);
    llNativeInputsByFingerprint.delete(fingerprint);
    let changed = false;
    for (const input of inputs) {
      if (!(input instanceof HTMLInputElement)) continue;
      const before = Array.from(input.files || []);
      const keep = before.filter((file) => composerFileFingerprint(file) !== fingerprint);
      if (keep.length === before.length) continue;
      try {
        const transfer = new DataTransfer();
        keep.forEach((file) => transfer.items.add(file));
        llUpdatingNativeFileInput = true;
        input.files = transfer.files;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        changed = true;
        llRegisterNativeInputFiles(input, keep);
      } catch (_) {
        // Alguns inputs temporários do React não permitem reatribuir FileList.
      } finally {
        llUpdatingNativeFileInput = false;
      }
    }
    return changed;
  }

  function llRemoveComposerAttachment(item, options = {}) {
    if (!item) return false;
    const index = composerAttachmentList.indexOf(item);
    if (index < 0) return false;
    if (item._settleTimerId) clearTimeout(item._settleTimerId);
    composerAttachmentList.splice(index, 1);
    renderComposerAttachments();

    if (options.syncNative !== false && item.source === 'lovable_chat') {
      llRemoveAttachmentFromNativeInputs(item);
      const removeControl = llFindNativeRemoveControlForAttachment(item);
      if (removeControl) {
        try { removeControl.click(); } catch (_) {}
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('LL_COMPOSER_ATTACHMENT_REMOVED', {
        detail: {
          fingerprint: composerAttachmentFingerprint(item),
          name: llAttachmentFileName(item),
          source: item.source || 'extension',
          reason: options.reason || 'manual'
        }
      }));
    } catch (_) {}
    return true;
  }

  function llIsNativeComposerFileInput(input) {
    if (!(input instanceof HTMLInputElement) || input.type !== 'file') return false;
    if (llNodeBelongsToExtension(input)) return false;
    const editor = findEditor();
    if (!editor) return false;
    const root = llFindNativeComposerRoot();
    if (root && root !== document && root.contains?.(input)) return true;
    const editorForm = editor.closest?.('form');
    const inputForm = input.closest?.('form');
    if (editorForm && inputForm && editorForm === inputForm) return true;
    const descriptor = [
      input.id,
      input.name,
      input.getAttribute?.('aria-label'),
      input.getAttribute?.('data-testid'),
      input.getAttribute?.('accept')
    ].filter(Boolean).join(' ').toLowerCase();
    if (/(chat|attach|attachment|anexo|upload|file)/.test(descriptor)) return true;
    // O Lovable costuma montar o seletor do chat como input oculto/portal.
    return input.offsetParent === null && document.querySelectorAll('input[type="file"]').length <= 4;
  }

  function llClearNativeFileInput(input) {
    if (!(input instanceof HTMLInputElement)) return;
    try {
      llUpdatingNativeFileInput = true;
      const transfer = new DataTransfer();
      input.files = transfer.files;
      input.value = '';
    } catch (_) {
      try { input.value = ''; } catch (_) {}
    } finally {
      llUpdatingNativeFileInput = false;
    }
  }

  function llStopNativeAttachmentEvent(e) {
    try { e.preventDefault(); } catch (_) {}
    try { e.stopPropagation(); } catch (_) {}
    try { e.stopImmediatePropagation(); } catch (_) {}
  }

  function initLovableNativeAttachmentBridge() {
    if (window.__LL_NATIVE_ATTACHMENT_BRIDGE__) return;
    window.__LL_NATIVE_ATTACHMENT_BRIDGE__ = true;

    const captureFileInput = (e) => {
      if (llUpdatingNativeFileInput) return;
      const input = e.target;
      if (!llIsNativeComposerFileInput(input)) return;
      const files = Array.from(input.files || []);
      if (!files.length) return;

      // O chat nativo serve apenas como seletor. Os arquivos são consumidos pela extensão
      // antes de React/Lovable recebê-los; assim não existe upload/envio paralelo nativo.
      llStopNativeAttachmentEvent(e);
      llClearNativeFileInput(input);
      void llMirrorLovableChatFiles(files, 'file-input');
    };

    document.addEventListener('change', captureFileInput, true);
    document.addEventListener('input', captureFileInput, true);

    document.addEventListener('drop', (e) => {
      if (!llIsInsideNativeComposer(e.target)) return;
      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length) return;
      llStopNativeAttachmentEvent(e);
      void llMirrorLovableChatFiles(files, 'drop');
    }, true);

    document.addEventListener('paste', (e) => {
      if (!llIsInsideNativeComposer(e.target)) return;
      const files = llFilesFromClipboardEvent(e);
      if (!files.length) return;
      llStopNativeAttachmentEvent(e);
      void llMirrorLovableChatFiles(files, 'paste');
    }, true);
  }

  let llNativeSendBusy = false;

  async function llSendNativeComposerThroughExtension(editor) {
    if (llNativeSendBusy) return false;
    const normalizedText = llSyncNativePromptIntoExtension(editor);
    try { await composerAttachmentMutationQueue; } catch (_) {}
    if (!normalizedText && !composerAttachmentList.length) return false;

    llNativeSendBusy = true;
    try {
      // Caminho principal: chama exatamente o mesmo manipulador do botão Enviar da extensão.
      if (typeof llComposerSendHandler === 'function') {
        return !!(await llComposerSendHandler({ source: 'lovable-native', editor }));
      }

      // Fallback somente se o painel ainda não terminou de inicializar.
      if (!(await llLicenseHardLockCheck('enviar mensagem'))) return false;
      const filesSnapshot = composerAttachmentList.slice();
      const sent = await sendPromptWithFiles(normalizedText, filesSnapshot);
      if (!sent) {
        showToast('❌', lastProxyErrorMessage || 'Proxy bloqueado. Verifique sessão do projeto no Lovable.', 7000);
        return false;
      }
      for (const item of filesSnapshot) {
        const idx = composerAttachmentList.indexOf(item);
        if (idx >= 0) composerAttachmentList.splice(idx, 1);
      }
      renderComposerAttachments();
      llClearUnifiedComposerDraft(editor);
      return true;
    } finally {
      llNativeSendBusy = false;
    }
  }

  function llLooksLikeNativeSendButton(btn) {
    if (!btn || llNodeBelongsToExtension(btn)) return false;
    const aria = String(btn.getAttribute?.('aria-label') || '').toLowerCase();
    const title = String(btn.getAttribute?.('title') || '').toLowerCase();
    const testid = String(btn.getAttribute?.('data-testid') || '').toLowerCase();
    const type = String(btn.getAttribute?.('type') || '').toLowerCase();
    if (testid === 'chatinput-send-message-button') return true;
    if (/\b(send|enviar|submit)\b/.test(`${aria} ${title}`)) return true;
    const root = llFindNativeComposerRoot();
    return type === 'submit' && !!(root && root !== document && root.contains?.(btn));
  }

  function interceptSend() {
    // Infinity Claude AI: Native DOM events are fully unblocked to let fetch flow directly into early-fetch network guard
    console.log("[Infinity Claude AI] Native composer DOM events active & unblocked.");
  }


  // only on lovable pages
  if (window.location.hostname.endsWith('lovable.dev')) {
    initLovableNativePromptBridge();
    initLovableNativeAttachmentBridge();
    interceptSend();
  }

  // ─── Check session ──────────────────────────────────────────────────────────
  function getSession(cb) {
    chrome.storage.local.get(['ll_user', 'll_license', 'll_token'], cb);
  }

  // ─── Project Detection ──────────────────────────────────────────────────────
  function detectProject() {
    const url = window.location.href;
    const projectMatch = url.match(/lovable\.dev\/projects\/([a-z0-9-]+)/);
    const editorMatch = url.match(/lovable\.dev\/gpt\/([a-z0-9-]+)/);
    return projectMatch?.[1] || editorMatch?.[1] || null;
  }

  function isProjectPage() {
    return !!detectProject();
  }

  // ─── Published URL Modal ─────────────────────────────────────────────────────
  function showPublishedUrlModal(url) {
    const existing = document.getElementById('ll-publish-modal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'll-publish-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2147483647;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);font-family:Inter,sans-serif';
    overlay.innerHTML =
      '<div style="background:#111113;border:1px solid rgba(245,158,11,0.35);border-radius:16px;padding:24px;max-width:420px;width:90%;box-shadow:0 24px 80px -12px rgba(0,0,0,0.8)">' +
        '<div style="font-size:32px;text-align:center;margin-bottom:8px">🎉</div>' +
        '<h3 style="margin:0 0 8px;color:#fbbf24;font-size:18px;font-weight:700;text-align:center">Projeto Publicado!</h3>' +
        '<p style="margin:0 0 16px;color:#a1a1aa;font-size:13px;text-align:center">Seu projeto esta ao vivo. Acesse pelo link abaixo:</p>' +
        '<div style="background:#0a0a0b;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;margin-bottom:16px;word-break:break-all"><a href="' + url + '" target="_blank" style="color:#60a5fa;text-decoration:none;font-size:13px">' + url + '</a></div>' +
        '<div style="display:flex;gap:8px">' +
          '<button id="ll-publish-copy" style="flex:1;padding:10px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:#f4f4f5;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600">📋 Copiar</button>' +
          '<button id="ll-publish-open" style="flex:1;padding:10px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700">🔗 Abrir</button>' +
        '</div>' +
        '<button id="ll-publish-close" style="width:100%;margin-top:8px;padding:8px;border:none;background:transparent;color:#71717a;cursor:pointer;font-size:12px">Fechar</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('ll-publish-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(url);
      showToast('📋', 'Link copiado!', 2000);
    });
    document.getElementById('ll-publish-open').addEventListener('click', () => { window.open(url, '_blank'); });
    document.getElementById('ll-publish-close').addEventListener('click', () => { overlay.remove(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  // ─── Actions ────────────────────────────────────────────────────────────────
  async function handleAction(action) {
    llSounds.action();
    const actions = {
      'select-preview-element': async () => {
        lovifyEnablePreviewElementPicker();
      },
      download: async () => {
        showToast('📦', 'Baixando projeto...', 2500);
        await tryApiDownloadZip();
      },
      new: async () => {
        await createProjectViaApi();
      },
      improve: async () => {
        // Prioriza textarea do Canal Netuno Lovable, senao usa editor nativo
        const netunoTextarea = document.getElementById('ll-composer-text');
        const chatInput = netunoTextarea || findEditor();
        if (!chatInput) {
          showToast('⚠', 'Editor de chat nao encontrado. Abra um projeto e tente novamente.', 4000);
          return;
        }
        const current = chatInput.tagName === 'TEXTAREA' ? (chatInput.value || '').trim() : getEditorText(chatInput);
        if (!current) {
          showToast('⚠', 'Digite um prompt primeiro, depois clique Melhorar.', 5000);
          return;
        }
        await requestLatestToken();
        showToast('\u{1F916}', 'Melhorando prompt com IA...', 4000);
        try {
          const improved = await improvePromptHybrid(current);
          if (improved && improved.trim()) {
            if (chatInput.tagName === 'TEXTAREA') {
              chatInput.value = improved.trim();
              chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              setEditorText(chatInput, improved);
            }
            showToast('✅', 'Prompt melhorado e inserido no chat!', 3000);
            llSounds.improve();
          } else {
            showToast('⚠', 'IA nao retornou resultado. Tente novamente.', 4000);
          }
        } catch (err) {
          showToast('❌', 'Erro ao melhorar: ' + (err && err.message ? err.message : 'falha na API'), 5000);
          llSounds.error();
        }
      },
      watermark: async () => {
        showToast('\u{1F6AB}', 'Removendo marca d\'agua...', 4000);
        try {
          await removeWatermarkServerSide();
        } catch (err) {
          showToast('❌', 'Erro: ' + (err && err.message ? err.message : 'falha ao remover marca'), 5000);
        }
      },
      publish: async () => {
        // LOVIFY PATCH v4: publica automaticamente.
        // Primeiro tenta o endpoint direto. Se o Lovable bloquear/mudar o endpoint,
        // abre o menu nativo e clica automaticamente em Update/Publish sem exigir ação manual.
        function llSleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

        function llCleanHeadersForReplay(headers, token) {
          const out = {};
          try {
            const h = headers || {};
            Object.keys(h).forEach(function(k){
              const lk = String(k).toLowerCase();
              if(['host','origin','referer','content-length','cookie'].includes(lk)) return;
              if(lk.startsWith('sec-')) return;
              out[k] = h[k];
            });
          } catch(_) {}
          out['Content-Type'] = out['Content-Type'] || out['content-type'] || 'application/json';
          out['Accept'] = out['Accept'] || out['accept'] || 'application/json, text/plain, */*';
          if(token) out['Authorization'] = 'Bearer ' + String(token).replace(/^Bearer\s+/i,'').trim();
          return out;
        }

        async function llTryStoredPublishRequest(projectId, token) {
          const sd = await new Promise(function(resolve){
            try { chrome.storage.local.get(['ll_last_publish_request'], resolve); } catch(_) { resolve({}); }
          });
          const req = sd && sd.ll_last_publish_request;
          if(!req || !req.url || !req.method) return false;
          const age = Date.now() - Number(req.at || 0);
          // Aceita request aprendido recentemente ou do mesmo projeto. Se for muito antigo e de outro projeto, ignora.
          if(req.projectId && projectId && req.projectId !== projectId && age > 24*60*60*1000) return false;
          const headers = llCleanHeadersForReplay(req.headers || {}, token);
          let body = req.body;
          if(body == null || body === '') body = JSON.stringify({});
          const resp = await proxyFetch(req.url, { method: req.method || 'POST', headers, body });
          if(resp && resp.ok){
            let data = resp.data;
            if(!data || typeof data !== 'object') { try { data = JSON.parse(resp.body || '{}'); } catch(_) { data = {}; } }
            const publishedUrl = data.url || data.published_url || data.preview_url || data.data?.url || data.result?.url || '';
            showToast('✅', publishedUrl ? 'Projeto publicado!' : 'Publicação solicitada!', 3000);
            llSounds.success();
            if(publishedUrl) showPublishedUrlModal(publishedUrl);
            return true;
          }
          return false;
        }

        function llText(el) {
          try { return String((el && (el.innerText || el.textContent || el.ariaLabel || el.title)) || '').trim(); }
          catch (_) { return ''; }
        }

        function llAllDeep(root, selector) {
          const out = [];
          const walk = (node) => {
            try {
              if (!node) return;
              if (node.querySelectorAll) out.push(...node.querySelectorAll(selector));
              const kids = node.querySelectorAll ? node.querySelectorAll('*') : [];
              for (const k of kids) if (k.shadowRoot) walk(k.shadowRoot);
            } catch (_) {}
          };
          walk(root || document);
          return out;
        }

        function llIsVisible(el) {
          try {
            if (!el) return false;
            const st = window.getComputedStyle(el);
            if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity || 1) === 0) return false;
            const r = el.getBoundingClientRect();
            return r.width > 6 && r.height > 6 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
          } catch (_) { return true; }
        }

        function llFindNativePublishMenuButton() {
          const btns = llAllDeep(document, 'button,[role="button"],a');
          const candidates = btns.filter((b) => {
            if (!llIsVisible(b)) return false;
            if (b.closest && b.closest('#ll-bubble-wrap')) return false; // não clicar no botão da própria extensão
            const t = llText(b);
            const id = String(b.id || '').toLowerCase();
            const aria = String(b.getAttribute && (b.getAttribute('aria-label') || '') || '').toLowerCase();
            return id.includes('publish') || aria.includes('publish') || /^\s*publish\s*$/i.test(t) || /^\s*publicar\s*$/i.test(t);
          });
          // Preferir o botão nativo no topo direito do Lovable.
          candidates.sort((a, b) => {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            return (rb.top < 120 ? 10000 : 0) + rb.left - ((ra.top < 120 ? 10000 : 0) + ra.left);
          });
          return candidates[0] || null;
        }

        function llLooksLikePublishPanel(el) {
          try {
            let cur = el;
            for (let i = 0; i < 7 && cur && cur !== document.body; i++, cur = cur.parentElement) {
              const txt = llText(cur).toLowerCase();
              const role = String(cur.getAttribute && (cur.getAttribute('role') || '') || '').toLowerCase();
              if (role === 'dialog' || role === 'menu' || role === 'popover') return true;
              if (txt.includes('website url') || txt.includes('who can see this website') || txt.includes('published') || txt.includes('custom domain')) return true;
              if (txt.includes('publicado') || txt.includes('url do site') || txt.includes('domínio')) return true;
            }
          } catch (_) {}
          return false;
        }

        function llFindConfirmPublishButton(openBtn) {
          const btns = llAllDeep(document, 'button,[role="button"]');
          const exact = btns.filter((b) => {
            if (!llIsVisible(b)) return false;
            if (b === openBtn) return false;
            if (b.closest && b.closest('#ll-bubble-wrap')) return false;
            const t = llText(b).trim();
            if (!/^(update|publish|publicar|atualizar|confirmar|confirm|deploy|publicar projeto)$/i.test(t)) return false;
            // Não clicar de novo no botão azul do topo. O botão final precisa estar dentro do painel/modal.
            return llLooksLikePublishPanel(b);
          });
          if (exact.length) {
            exact.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
            return exact[0];
          }

          const soft = btns.filter((b) => {
            if (!llIsVisible(b)) return false;
            if (b === openBtn) return false;
            if (b.closest && b.closest('#ll-bubble-wrap')) return false;
            const t = llText(b);
            return /update|publish|publicar|atualizar/i.test(t) && !/published|publicado/i.test(t) && llLooksLikePublishPanel(b);
          });
          soft.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
          return soft[0] || null;
        }

        function llEnableSilentPublishUi() {
          try {
            if (!document.getElementById('ll-silent-publish-style')) {
              const st = document.createElement('style');
              st.id = 'll-silent-publish-style';
              st.textContent = `
                body.ll-silent-publishing [role="dialog"],
                body.ll-silent-publishing [role="menu"],
                body.ll-silent-publishing [role="popover"],
                body.ll-silent-publishing [data-radix-popper-content-wrapper],
                body.ll-silent-publishing [data-radix-popper-content-wrapper] > * {
                  opacity: 0.01 !important;
                  filter: blur(2px) !important;
                  transition: none !important;
                }
              `;
              (document.head || document.documentElement).appendChild(st);
            }
            document.body.classList.add('ll-silent-publishing');
          } catch (_) {}
        }

        function llDisableSilentPublishUi() {
          try { document.body.classList.remove('ll-silent-publishing'); } catch (_) {}
        }

        function llFindPublishPanelRoot(el) {
          try {
            let cur = el;
            for (let i = 0; i < 8 && cur && cur !== document.body; i++, cur = cur.parentElement) {
              if (llLooksLikePublishPanel(cur)) return cur;
            }
          } catch (_) {}
          return null;
        }

        function llCloseNativePublishPanel() {
          try {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
          } catch (_) {}
          try {
            const closeBtns = llAllDeep(document, 'button,[role="button"]').filter((b) => {
              if (!llIsVisible(b)) return false;
              if (b.closest && b.closest('#ll-bubble-wrap')) return false;
              const t = llText(b).toLowerCase();
              const aria = String(b.getAttribute && (b.getAttribute('aria-label') || '') || '').toLowerCase();
              return /close|fechar|dismiss|x/.test(t) || /close|fechar|dismiss/.test(aria);
            });
            if (closeBtns[0]) closeBtns[0].click();
          } catch (_) {}
        }

        async function llWaitPublishFinish(confirmBtn) {
          // O Lovable troca o botão para "Updating". Aguarda finalizar e fecha o popover nativo.
          let lastText = '';
          for (let i = 0; i < 80; i++) {
            await llSleep(350);
            try {
              const txt = llText(confirmBtn).toLowerCase();
              if (txt) lastText = txt;
              const disabled = !!(confirmBtn && (confirmBtn.disabled || confirmBtn.getAttribute('aria-disabled') === 'true'));
              const busy = !!(confirmBtn && (confirmBtn.getAttribute('aria-busy') === 'true'));
              if (txt && !/updating|atualizando|publicando|loading|carregando/.test(txt) && !busy) {
                if (i > 3) return true;
              }
              if (!disabled && !busy && i > 10 && !/updating|atualizando|publicando|loading|carregando/.test(txt)) return true;
            } catch (_) {}
          }
          return !!lastText;
        }

        async function llClickNativePublishFlow() {
          const menuBtn = llFindNativePublishMenuButton();
          if (!menuBtn) throw new Error('Botão nativo Publish não encontrado no Lovable.');

          // Modo silencioso: o Lovable ainda abre o popover nativo por baixo,
          // mas a extensão deixa ele praticamente invisível, clica em Update/Publish,
          // aguarda finalizar e fecha o popover. O usuário vê apenas os avisos da extensão.
          llEnableSilentPublishUi();
          try { menuBtn.scrollIntoView({ block: 'center', inline: 'center' }); } catch (_) {}
          menuBtn.click();

          let confirmBtn = null;
          for (let i = 0; i < 40; i++) {
            await llSleep(250);
            confirmBtn = llFindConfirmPublishButton(menuBtn);
            if (confirmBtn) break;
          }

          if (!confirmBtn) {
            llDisableSilentPublishUi();
            throw new Error('Botão final Update/Publish não encontrado. Abra o Publish uma vez e me mande print do painel.');
          }

          try {
            const root = llFindPublishPanelRoot(confirmBtn);
            if (root) {
              root.setAttribute('data-ll-silent-publish-panel', '1');
              root.style.opacity = '0.01';
              root.style.filter = 'blur(2px)';
            }
          } catch (_) {}

          try { confirmBtn.scrollIntoView({ block: 'center', inline: 'center' }); } catch (_) {}
          confirmBtn.click();

          showToast('⏳', 'Publicando em segundo plano...', 6000);
          await llWaitPublishFinish(confirmBtn);
          llCloseNativePublishPanel();
          await llSleep(300);
          llDisableSilentPublishUi();
          return true;
        }

        await requestLatestToken(1600);

        const auth = await getAuthBundle();
        const storageData = await new Promise((resolve) => {
          try {
            chrome.storage.local.get([
              'lovable_projectId',
              'lovable_token',
              'll_project_id',
              'current_project_id',
              'll_lovable_auth_token',
              'captured_auth_token',
              'captured_lovable_token',
              'lovable_api_token'
            ], resolve);
          } catch (_) { resolve({}); }
        });

        const projectId =
          storageData.lovable_projectId ||
          storageData.ll_project_id ||
          storageData.current_project_id ||
          auth.projectId ||
          detectProject();

        let token =
          storageData.lovable_token ||
          storageData.ll_lovable_auth_token ||
          storageData.lovable_api_token ||
          storageData.captured_auth_token ||
          storageData.captured_lovable_token ||
          auth.lovableToken ||
          '';

        token = String(token || '').replace(/^Bearer\s+/i, '').trim();
        showToast('🌐', 'Publicando projeto...', 5000);

        // 0) Se já aprendemos a requisição real do botão Update/Publish do Lovable, repetir ela direto sem abrir o painel.
        if (projectId && token) {
          try {
            const replayOk = await llTryStoredPublishRequest(projectId, token);
            if (replayOk) return;
          } catch (_) {}
        }

        // 1) Tenta publicar direto pela API do Lovable.
        if (projectId && token) {
          try {
            const headers = getLovableAuthHeader(token);
            const response = await proxyFetch('https://api.lovable.dev/projects/' + projectId + '/publish', {
              method: 'POST',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });

            if (response && response.ok) {
              let data = response.data;
              if (!data || typeof data !== 'object') {
                try { data = JSON.parse(response.body || '{}'); } catch (_) { data = {}; }
              }

              const publishedUrl =
                data.url ||
                data.published_url ||
                data.preview_url ||
                data.data?.url ||
                data.result?.url ||
                '';

              showToast('✅', publishedUrl ? 'Projeto publicado!' : 'Publicação solicitada!', 3000);
              llSounds.success();
              if (publishedUrl) showPublishedUrlModal(publishedUrl);
              return;
            }
          } catch (_) {
            // segue para automação visual abaixo
          }
        }

        // 2) Fallback automático: usa o fluxo nativo do Lovable e clica no Update/Publish sozinho.
        try {
          await llClickNativePublishFlow();
          showToast('✅', 'Publicação concluída em segundo plano!', 4500);
          llSounds.success();
        } catch (err) {
          showToast('❌', 'Erro ao publicar: ' + (err && err.message ? err.message : 'falha'), 6000);
          llSounds.error();
        }
      },
      screenshot: async () => {
        showToast('📸', 'Enviando pedido de screenshot...', 3000);
        await proxySendToLovable('Tire um screenshot/captura da página atual do projeto e me mostre como está visualmente. Descreva o layout atual e sugira melhorias visuais se houver.');
      },
      codereview: async () => {
        showToast('🔍', 'Enviando pedido de code review...', 3000);
        await proxySendToLovable('Faça uma revisão completa do código do projeto. Identifique: 1) Bugs potenciais, 2) Problemas de performance, 3) Código duplicado, 4) Melhorias de arquitetura, 5) Boas práticas não seguidas. Liste cada item com prioridade (alta/média/baixa) e sugira a correção.');
      },
      captureerrors: async () => {
        const errors = llCapturedErrors.slice(-5);
        if (!errors.length) {
          showToast('✅', 'Nenhum erro capturado no console.', 3000);
          return;
        }
        const formatted = errors.map((e, i) => `${i + 1}. ${e}`).join('\n');
        const prompt = `Os seguintes erros foram capturados no console da preview do projeto. Corrija todos:\n\n\`\`\`\n${formatted}\n\`\`\`\n\nIdentifique a causa raiz de cada erro e aplique a correção.`;
        showToast('🐛', `Enviando ${errors.length} erro(s) para correção...`, 3000);
        await proxySendToLovable(prompt);
        llCapturedErrors.length = 0;
      },
      templates: () => {
        const panel = document.getElementById('ll-templates-panel');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
          if (panel.style.display === 'block') llRenderTemplates();
        }
        return; // não fecha o painel
      },
    };
    try {
      if (actions[action]) await actions[action]();
    } catch (err) {
      showToast('❌', err?.message || 'Falha ao executar ação.', 5000);
    }
    // Nao fecha painel no "improve", "templates" pois o usuario precisa ver o resultado
    if (action !== 'improve' && action !== 'templates') closePanel();
  }

  // ─── Templates de Prompt ──────────────────────────────────────────────────────
  const LL_TEMPLATES = [
    // ─── Layout & UI ───
    { emoji: '🌙', title: 'Dark Mode', prompt: 'Adicione suporte completo a dark mode em todo o projeto. Use CSS variables para todas as cores, crie um toggle elegante no header (ícone sol/lua), persista a preferência no localStorage, e aplique transição suave (0.3s) ao trocar de tema. Garanta que todos os componentes, modais, inputs e cards respeitem o tema.' },
    { emoji: '📱', title: 'Responsivo', prompt: 'Torne todas as páginas totalmente responsivas. Breakpoints: mobile (320-767px), tablet (768-1023px), desktop (1024px+). Use flexbox/grid, ajuste fontes com clamp(), esconda sidebar em mobile com menu hamburger, e garanta que tabelas usem scroll horizontal. Teste todos os formulários e modais em 375px.' },
    { emoji: '🎨', title: 'Melhorar UI', prompt: 'Faça uma reforma visual completa: melhore hierarquia tipográfica (títulos, subtítulos, corpo), adicione micro-animações em botões e cards (hover scale, fade-in ao scroll), melhore espaçamentos com sistema de 8px, adicione sombras sutis, e garanta consistência de cores e border-radius em todo o projeto.' },
    { emoji: '🖼️', title: 'Landing Page', prompt: 'Crie uma landing page profissional com: hero section com título impactante e CTA, seção de features com ícones e descrições, seção de depoimentos/social proof, seção de preços (3 planos), FAQ com accordion, e footer com links e redes sociais. Use animações de entrada ao scroll.' },
    { emoji: '📐', title: 'Sidebar + Layout', prompt: 'Implemente um layout com sidebar fixa à esquerda (240px) com navegação por ícones e labels, header fixo no topo com busca e avatar do usuário, e área de conteúdo principal com breadcrumbs. A sidebar deve ser colapsável (só ícones) e em mobile vira drawer.' },
    { emoji: '🃏', title: 'Cards Grid', prompt: 'Crie um grid de cards responsivo (1-2-3-4 colunas conforme tela) com: imagem de capa, título, descrição truncada (2 linhas), tags coloridas, avatar do autor, data, e botões de ação. Adicione hover com elevação e skeleton loading enquanto carrega.' },

    // ─── Funcionalidades ───
    { emoji: '🔐', title: 'Login Completo', prompt: 'Crie sistema de autenticação completo: página de login (email + senha), página de cadastro (nome, email, senha, confirmar senha), página de "esqueci a senha", validação em tempo real nos campos, feedback visual de erros, loading no botão ao submeter, e redirecionamento após login. Use React Hook Form ou similar.' },
    { emoji: '📊', title: 'Dashboard Admin', prompt: 'Crie um dashboard administrativo completo com: 4 cards de KPIs no topo (com ícones e variação %), gráfico de linha (últimos 7 dias), gráfico de barras (por categoria), tabela de últimas atividades com paginação, e filtro por período (hoje, 7d, 30d, custom). Use Recharts ou similar.' },
    { emoji: '🗄️', title: 'CRUD Completo', prompt: 'Crie um CRUD completo e profissional: listagem com tabela (busca, filtros, ordenação, paginação), botão "Novo" que abre modal/drawer com formulário, edição inline ou via modal, exclusão com confirmação (dialog), toast de feedback, loading states, e empty state quando não há dados.' },
    { emoji: '🛒', title: 'Carrinho/Checkout', prompt: 'Implemente fluxo de e-commerce: página de produtos com grid de cards, botão "Adicionar ao carrinho" com badge de quantidade, drawer/página do carrinho com lista de itens (alterar qtd, remover), resumo com subtotal/frete/total, e página de checkout com steps (dados, endereço, pagamento, confirmação).' },
    { emoji: '💬', title: 'Chat/Mensagens', prompt: 'Crie uma interface de chat em tempo real: lista de conversas à esquerda (com avatar, nome, última msg, timestamp), área de mensagens à direita (balões estilo WhatsApp, com hora), input de mensagem com botão enviar e emoji picker, indicador de "digitando...", e scroll automático para última mensagem.' },
    { emoji: '📅', title: 'Calendário/Agenda', prompt: 'Implemente um calendário interativo: visualização mensal com eventos coloridos por categoria, ao clicar no dia abre modal para criar evento (título, hora início/fim, cor, descrição), drag-and-drop para mover eventos, e visualização semanal/diária alternativa. Persista eventos no estado.' },
    { emoji: '🔔', title: 'Notificações', prompt: 'Implemente sistema de notificações: ícone de sino no header com badge de contagem, dropdown com lista de notificações (lidas/não lidas), marcar como lida ao clicar, botão "marcar todas como lidas", diferentes tipos (info, sucesso, alerta, erro) com ícones e cores distintas, e toast notifications para eventos em tempo real.' },
    { emoji: '👤', title: 'Perfil Usuário', prompt: 'Crie página de perfil do usuário completa: foto de perfil com upload (preview antes de salvar), formulário de dados pessoais (nome, email, telefone, bio), seção de alterar senha (senha atual + nova + confirmar), preferências (idioma, notificações, tema), e botão de deletar conta com confirmação dupla.' },
    { emoji: '🔍', title: 'Busca Avançada', prompt: 'Implemente busca avançada: input com debounce (300ms), resultados em tempo real com highlight do termo buscado, filtros laterais (categoria, data, status), ordenação (relevância, data, nome), paginação ou infinite scroll, e empty state quando não encontra. Adicione busca por voz como bonus.' },

    // ─── Técnico ───
    { emoji: '🌐', title: 'Traduzir PT-BR', prompt: 'Traduza toda a interface para português brasileiro (pt-BR). Inclua: todos os textos visíveis, placeholders, mensagens de erro, labels de formulário, botões, tooltips, e textos de empty states. Mantenha código em inglês. Se houver sistema de i18n, use-o; senão, crie um contexto simples de tradução.' },
    { emoji: '♿', title: 'Acessibilidade', prompt: 'Faça auditoria e correção de acessibilidade (WCAG 2.1 AA): adicione aria-labels em todos os botões de ícone, garanta contraste mínimo 4.5:1, adicione roles semânticos, implemente navegação completa por teclado (Tab, Enter, Escape), adicione skip-to-content, e garanta que screen readers leiam corretamente formulários e modais.' },
    { emoji: '⚡', title: 'Performance', prompt: 'Otimize performance do projeto: implemente React.memo/useMemo nos componentes pesados, adicione lazy loading com Suspense para rotas, otimize imagens (WebP, srcset, lazy), implemente virtualização para listas longas (react-window), reduza bundle com code splitting, e adicione loading skeletons.' },
    { emoji: '🧪', title: 'Testes', prompt: 'Adicione testes completos: testes unitários para funções utilitárias (Jest/Vitest), testes de componentes com Testing Library (render, interação, assertions), testes de integração para fluxos críticos (login, CRUD), e configure coverage mínimo de 80%. Adicione scripts no package.json.' },
    { emoji: '🛡️', title: 'Segurança', prompt: 'Revise e melhore a segurança: sanitize todos os inputs (XSS), implemente rate limiting no frontend, adicione CSRF tokens, valide dados no client E server, use httpOnly cookies para tokens, implemente logout automático por inatividade (15min), e adicione headers de segurança (CSP, X-Frame-Options).' },
    { emoji: '📝', title: 'Formulário Pro', prompt: 'Melhore todos os formulários do projeto: adicione validação em tempo real com mensagens claras, máscara para telefone/CPF/CEP, auto-complete de endereço via CEP, indicador de força de senha, upload de arquivo com preview e drag-and-drop, e salve rascunho automaticamente no localStorage a cada 30s.' },
    { emoji: '🔄', title: 'Loading States', prompt: 'Adicione loading states profissionais em todo o projeto: skeleton screens nas listagens (não spinners), shimmer effect nos cards enquanto carrega, botões com spinner interno ao submeter, progress bar no topo durante navegação, e empty states ilustrados com ação sugerida quando não há dados.' },
    { emoji: '❌', title: 'Error Handling', prompt: 'Implemente tratamento de erros robusto: Error Boundary global com fallback UI amigável, toast notifications para erros de API (com botão retry), página 404 personalizada, tratamento de timeout/offline (mostrar banner), e logging de erros no console com contexto (componente, ação, timestamp).' },
    { emoji: '🎭', title: 'Animações', prompt: 'Adicione animações profissionais: page transitions (fade/slide entre rotas), stagger animation em listas (itens aparecem um por um), parallax sutil no hero, hover effects em cards (scale + shadow), animação de entrada em modais (scale + fade), e micro-interactions em toggles e checkboxes. Use Framer Motion ou CSS animations.' },
    { emoji: '📤', title: 'Export/Import', prompt: 'Adicione funcionalidade de exportar e importar dados: botão para exportar dados em CSV e JSON, opção de exportar PDF (relatórios), importar dados via upload de CSV com preview e validação, progress bar durante import, e log de erros/sucessos após importação.' },
  ];

  function llRenderTemplates() {
    const list = document.getElementById('ll-templates-list');
    if (!list) return;
    list.innerHTML = LL_TEMPLATES.map((t, i) => `
      <button class="ll-template-item" data-tpl-idx="${i}">
        <span class="ll-tpl-emoji">${t.emoji}</span>
        <span class="ll-tpl-title">${t.title}</span>
      </button>
    `).join('');
    list.querySelectorAll('.ll-template-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.tplIdx);
        const tpl = LL_TEMPLATES[idx];
        if (!tpl) return;
        document.getElementById('ll-templates-panel').style.display = 'none';
        showToast('📋', `Enviando: ${tpl.title}...`, 3000);
        await proxySendToLovable(tpl.prompt);
      });
    });
  }

  // ─── Captura de Erros do Console ────────────────────────────────────────────────
  const llCapturedErrors = [];
  (function capturePreviewErrors() {
    const origError = console.error;
    console.error = function(...args) {
      const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      if (msg && !msg.includes('[Netuno LovableLovable') && llCapturedErrors.length < 20) {
        llCapturedErrors.push(msg.slice(0, 300));
      }
      origError.apply(console, args);
    };
    window.addEventListener('error', (e) => {
      if (e.message && llCapturedErrors.length < 20) {
        llCapturedErrors.push(`${e.message} (${e.filename || ''}:${e.lineno || ''})`);
      }
    });
    window.addEventListener('unhandledrejection', (e) => {
      const msg = e.reason?.message || e.reason?.toString?.() || 'Unhandled rejection';
      if (llCapturedErrors.length < 20) llCapturedErrors.push(msg.slice(0, 300));
    });
  })();

  // ─── Histórico de Prompts ───────────────────────────────────────────────────────
  const LL_HISTORY_KEY = 'll_prompt_history';
  const LL_HISTORY_MAX = 30;

  async function llGetHistory() {
    return new Promise(resolve => {
      chrome.storage.local.get([LL_HISTORY_KEY], (d) => resolve(d[LL_HISTORY_KEY] || []));
    });
  }

  async function llSaveToHistory(text) {
    if (!text || text.length < 3) return;
    const history = await llGetHistory();
    const entry = { id: Date.now().toString(36), text: text.slice(0, 500), timestamp: Date.now(), favorite: false };
    history.unshift(entry);
    if (history.length > LL_HISTORY_MAX) history.length = LL_HISTORY_MAX;
    chrome.storage.local.set({ [LL_HISTORY_KEY]: history });
    llRenderHistory();
  }

  async function llToggleFavorite(id) {
    const history = await llGetHistory();
    const item = history.find(h => h.id === id);
    if (item) item.favorite = !item.favorite;
    // Favoritos ficam no topo
    history.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    chrome.storage.local.set({ [LL_HISTORY_KEY]: history });
    llRenderHistory();
  }

  async function llRenderHistory() {
    const list = document.getElementById('ll-history-list');
    const countEl = document.getElementById('ll-history-count');
    if (!list) return;
    const history = await llGetHistory();
    if (countEl) countEl.textContent = history.length;
    if (!history.length) {
      list.innerHTML = '<div class="ll-history-empty">Nenhum prompt enviado ainda.</div>';
      return;
    }
    list.innerHTML = history.map(h => `
      <div class="ll-history-item${h.favorite ? ' ll-history-fav' : ''}">
        <button class="ll-history-star" data-hist-id="${h.id}" title="${h.favorite ? 'Remover favorito' : 'Favoritar'}">${h.favorite ? '⭐' : '☆'}</button>
        <span class="ll-history-text" title="${h.text.replace(/"/g, '&quot;')}">${h.text.slice(0, 60)}${h.text.length > 60 ? '…' : ''}</span>
        <button class="ll-history-resend" data-hist-id="${h.id}" title="Reenviar">▶</button>
      </div>
    `).join('');
    list.querySelectorAll('.ll-history-star').forEach(btn => {
      btn.addEventListener('click', () => llToggleFavorite(btn.dataset.histId));
    });
    list.querySelectorAll('.ll-history-resend').forEach(btn => {
      btn.addEventListener('click', async () => {
        const item = history.find(h => h.id === btn.dataset.histId);
        if (item) {
          showToast('📜', 'Reenviando prompt...', 2500);
          await proxySendToLovable(item.text);
        }
      });
    });
  }

  // ─── Timer de Sessão ────────────────────────────────────────────────────────────
  const llSessionStart = Date.now();
  function llUpdateTimer() {
    const el = document.getElementById('ll-session-timer');
    if (!el) return;
    const elapsed = Math.floor((Date.now() - llSessionStart) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  }
  setInterval(llUpdateTimer, 1000);

  // ─── Notificação de Resposta do Lovable ─────────────────────────────────────────
  (function llWatchForResponse() {
    let lastMsgCount = 0;
    const observer = new MutationObserver(() => {
      const msgs = document.querySelectorAll('[data-testid="chat-message"], [class*="ChatMessage"], [class*="message-bubble"]');
      if (msgs.length > lastMsgCount && lastMsgCount > 0) {
        // Nova mensagem detectada
        const last = msgs[msgs.length - 1];
        const isAI = last?.querySelector('[class*="ai"], [class*="assistant"]') || !last?.querySelector('[class*="user"]');
        if (isAI) {
          llSounds.notify();
        }
      }
      lastMsgCount = msgs.length;
    });
    // Observa o container principal do chat
    setTimeout(() => {
      const chatContainer = document.querySelector('[class*="ChatMessages"], [class*="chat-messages"], [role="log"], main');
      if (chatContainer) observer.observe(chatContainer, { childList: true, subtree: true });
    }, 3000);
  })();

  // ─── Panel toggle ────────────────────────────────────────────────────────────
  function persistPanelChrome() {
    try {
      chrome.storage.local.set({
        [STORAGE_PANEL_LAYOUT]: panelLayoutMode,
        [STORAGE_DOCK_COLLAPSED]: dockCollapsed
      }, () => {});
    } catch (_) {}
  }

  function syncDockChrome() {
    if (!bubbleEl) return;
    const wrap = bubbleEl;
    const orb = document.getElementById('ll-orb');
    const tab = document.getElementById('ll-dock-expand-tab');
    const dockBtn = document.getElementById('ll-layout-mode-dock');
    const floatBtn = document.getElementById('ll-layout-mode-float');
    wrap.classList.remove('ll-layout-docked', 'll-layout-float', 'll-dock-collapsed');
    wrap.classList.add(panelLayoutMode === 'float' ? 'll-layout-float' : 'll-layout-docked');
    if (panelLayoutMode === 'docked' && dockCollapsed) wrap.classList.add('ll-dock-collapsed');

    if (panelLayoutMode === 'docked') {
      wrap.style.touchAction = 'auto';
      if (orb) orb.style.display = 'none';
      if (dockBtn) dockBtn.classList.toggle('ll-layout-mode-active', true);
      if (floatBtn) floatBtn.classList.toggle('ll-layout-mode-active', false);
    } else {
      wrap.style.touchAction = 'none';
      if (orb) orb.style.display = '';
      if (dockBtn) dockBtn.classList.toggle('ll-layout-mode-active', false);
      if (floatBtn) floatBtn.classList.toggle('ll-layout-mode-active', true);
    }

    if (tab) {
      const showTab = panelLayoutMode === 'docked' && dockCollapsed;
      tab.hidden = !showTab;
      tab.setAttribute('aria-hidden', showTab ? 'false' : 'true');
    }
  }

  function setPanelLayoutMode(mode) {
    if (mode !== 'docked' && mode !== 'float') return;
    const prev = panelLayoutMode;
    panelLayoutMode = mode;
    const panel = document.getElementById('ll-panel');

    if (mode === 'docked') {
      dockCollapsed = false;
      bubbleEl.style.left = 'auto';
      bubbleEl.style.right = '0';
      bubbleEl.style.bottom = '0';
      if (panel) {
        panel.classList.add('ll-open');
        panelOpen = true;
      }
    } else {
      if (prev === 'docked') {
        bubbleEl.style.left = '';
        bubbleEl.style.right = '20px';
        bubbleEl.style.bottom = '24px';
      }
      dockCollapsed = false;
    }
    syncDockChrome();
    persistPanelChrome();

    const o = document.getElementById('ll-orb');
    if (mode === 'float' && o) {
      o.style.display = '';
      o.style.transform = 'scale(1)';
    }
  }

  function openPanel() {
    if (panelLayoutMode === 'docked') {
      dockCollapsed = false;
    }
    const panel = document.getElementById('ll-panel');
    if (panel) {
      panel.classList.add('ll-open');
      panelOpen = true;
      syncDockChrome();
      persistPanelChrome();
      try {
        chrome.runtime.sendMessage({ type: 'LL_CHECK_UPGRADE' }, () => {});
      } catch (_) {}
      refreshPanelStatus();
    }
  }

  function closePanel() {
    const panel = document.getElementById('ll-panel');
    if (!panel) return;

    try {
      llNavigatePanelScreen('main');
    } catch (_) {}

    if (panelLayoutMode === 'docked') {
      dockCollapsed = true;
      panel.classList.remove('ll-open');
      panelOpen = false;
      syncDockChrome();
      persistPanelChrome();
      return;
    }

    panel.classList.remove('ll-open');
    panelOpen = false;
  }

  function togglePanel() {
    if (panelOpen) closePanel(); else openPanel();
  }

  const DEFAULT_EXTENSION_SYNC_ENDPOINT = 'http://127.0.0.1/version-mock';

  function applyExtensionSyncCapsuleUI(store) {
    const st = store.ll_extension_svc_status;
    const msg = String(store.ll_extension_svc_message || '').trim();
    const ep = store.ll_extension_sync_endpoint || DEFAULT_EXTENSION_SYNC_ENDPOINT;
    const localV = chrome.runtime.getManifest().version || '';
    const remoteV = String(store.ll_remote_version || '').trim();
    const hasUpdate = !!store.ll_upgrade_available;
    const row = document.getElementById('ll-cap-svc-row');
    const headline = document.getElementById('ll-cap-svc-headline');
    const desc = document.getElementById('ll-cap-svc-desc');
    const badge = document.getElementById('ll-cap-sync-badge');
    const ticket = document.getElementById('ll-cap-svc-ticket');
    if (!row || !headline || !desc || !badge || !ticket) return;
    const isMaint = st === 'maintenance';
    const isUnknown = st === 'unknown';
    row.classList.remove('ll-cap-svc-online', 'll-cap-svc-maint', 'll-cap-svc-unknown');
    badge.classList.remove('ll-cap-badge-warn');
    if (isMaint) {
      row.classList.add('ll-cap-svc-maint');
      badge.textContent = 'MANUTENÇÃO';
      badge.classList.add('ll-cap-badge-warn');
      ticket.textContent = '!';
      headline.textContent = 'MANUTENÇÃO';
      desc.textContent = msg || 'Extensão em manutenção. Tente novamente mais tarde.';
      return;
    }
    if (isUnknown) {
      row.classList.add('ll-cap-svc-unknown');
      badge.textContent = '---';
      badge.classList.add('ll-cap-badge-warn');
      ticket.textContent = '?';
      headline.textContent = 'Sincronização indisponível';
      desc.textContent = msg ||
        'Não foi possível confirmar o status remoto — o uso local segue até a próxima verificação.';
      return;
    }
    row.classList.add('ll-cap-svc-online');
    badge.textContent = 'LIGADO';
    ticket.textContent = '✓';
    headline.textContent = 'EM FUNCIONAMENTO';
    let versText = `Instalada v${localV}.`;
    if (remoteV) versText += ` Servidor v${remoteV}.`;
    if (hasUpdate && remoteV) versText += ' Há atualização — use o botão Upgrade.';
    else if (remoteV) versText += ' Você está em dia com o servidor.';
    desc.textContent = `A extensão está ativa e respondendo normalmente. ${versText}`;
  }

  function applyBubbleUpgradeFooter(store) {
    const mv = chrome.runtime.getManifest().version || '';
    const chip = document.querySelector('#ll-bubble-wrap .ll-version-chip');
    if (chip) chip.textContent = `v${mv}`;
    const btn = document.getElementById('ll-upgrade-btn');
    if (!btn) return;
    const remote = String(store.ll_remote_version || '').trim();
    const canDl = !!store.ll_upgrade_available && !!(store.ll_remote_download_url);
    if (canDl && remote) {
      btn.classList.add('ll-upgrade-available');
      btn.innerHTML = `⬇ Baixar v${remote}`;
      btn.dataset.mode = 'download';
      btn.title = `Atualize de v${mv} para v${remote}`;
    } else {
      btn.classList.remove('ll-upgrade-available');
      btn.innerHTML = '⬆ Upgrade';
      btn.dataset.mode = 'plans';
      btn.title = mv ? `Versão instalada: v${mv}` : '';
    }

    // ─── Banner de atualização visível no topo do painel ───────────────────────
    const banner = document.getElementById('ll-update-banner');
    const bannerVersion = document.getElementById('ll-update-banner-version');
    const orbBadge = document.getElementById('ll-orb-update-badge');
    const dismissed = store.ll_update_banner_dismissed_version;

    if (canDl && remote && dismissed !== remote) {
      if (banner) {
        const wasHidden = banner.classList.contains('ll-hidden');
        banner.classList.remove('ll-hidden');
        if (bannerVersion) bannerVersion.textContent = `v${mv} → v${remote}`;
        if (wasHidden) llSounds.notify();
      }
      if (orbBadge) orbBadge.classList.remove('ll-hidden');
    } else {
      if (banner) banner.classList.add('ll-hidden');
      if (orbBadge) orbBadge.classList.add('ll-hidden');
    }
  }


  function llLifetimeFlag(license = {}) {
    const raw = license.is_lifetime ?? license.lifetime ?? license.isLifetime ?? license.plan_lifetime ?? license.license_lifetime;
    const unit = String(license.duration_unit || license.unit || '').toLowerCase();
    const plan = String(license.plan_type || license.type || '').toLowerCase();
    return raw === true || raw === 'true' || raw === 1 || raw === '1' || unit === 'lifetime' || plan.includes('lifetime') || plan.includes('vital');
  }

  function llFormatLicenseRemaining(expiresRaw, license = {}) {
    if (!expiresRaw || llLifetimeFlag(license)) {
      return { expired: false, number: '∞', unit: 'vitalício', status: 'vitalicio', pct: 100, text: 'Licença vitalícia ativa' };
    }

    const expMs = new Date(expiresRaw).getTime();
    const now = Date.now();
    const msLeft = expMs - now;

    if (!Number.isFinite(expMs) || msLeft <= 0) {
      return { expired: true, number: '0', unit: 'expirada', status: 'expired', pct: 0, text: 'Licença expirada' };
    }

    const minutes = Math.ceil(msLeft / 60000);
    const hours = Math.ceil(msLeft / 3600000);
    const days = Math.ceil(msLeft / 86400000);

    let number, unit, text;
    if (minutes < 60) {
      number = String(minutes);
      unit = minutes === 1 ? 'minuto restante' : 'minutos restantes';
      text = `Apenas ${minutes} ${minutes === 1 ? 'minuto restante' : 'minutos restantes'}`;
    } else if (hours < 24) {
      number = String(hours);
      unit = hours === 1 ? 'hora restante' : 'horas restantes';
      text = `Apenas ${hours} ${hours === 1 ? 'hora restante' : 'horas restantes'}`;
    } else {
      number = String(days);
      unit = days === 1 ? 'dia restante' : 'dias restantes';
      text = `Apenas ${days} ${days === 1 ? 'dia restante' : 'dias restantes'}`;
    }

    const durationValue = Number(license.duration_value || license.plan_value || 0);
    const durationUnit = String(license.duration_unit || license.plan_unit || '').toLowerCase();
    let totalMs = 30 * 86400000;
    if (durationValue > 0) {
      if (durationUnit === 'seconds') totalMs = durationValue * 1000;
      else if (durationUnit === 'minutes') totalMs = durationValue * 60000;
      else if (durationUnit === 'hours') totalMs = durationValue * 3600000;
      else if (durationUnit === 'days') totalMs = durationValue * 86400000;
      else if (durationUnit === 'months') totalMs = durationValue * 30 * 86400000;
      else if (durationUnit === 'years') totalMs = durationValue * 365 * 86400000;
    } else if (license.plan_days || license.duration_days) {
      totalMs = Number(license.plan_days || license.duration_days) * 86400000;
    }
    const pct = Math.max(3, Math.min(100, Math.round((msLeft / totalMs) * 100)));
    const isUrgent = msLeft <= 3 * 86400000;
    return { expired: false, number, unit, status: isUrgent ? 'urgent' : 'active', pct, text, msLeft };
  }

  // ─── Refresh panel status ────────────────────────────────────────────────────
  function refreshPanelStatus() {
    chrome.storage.local.get(
      [
        'll_extension_svc_status', 'll_extension_svc_message', 'll_extension_sync_endpoint',
        'll_remote_version', 'll_upgrade_available', 'll_remote_download_url',
        'll_update_banner_dismissed_version'
      ],
      (store) => {
        applyExtensionSyncCapsuleUI(store);
        applyBubbleUpgradeFooter(store);
      }
    );
    getSession(({ ll_user, ll_license }) => {
      const statusIndicator = document.getElementById('ll-status-dot');
      const statusText = document.getElementById('ll-status-text');
      const statusSub = document.getElementById('ll-status-sub');
      const daysEl = document.getElementById('ll-lic-days');
      const barEl = document.getElementById('ll-lic-bar-fill');
      const licUnit = document.getElementById('ll-lic-unit');

      const onProject = isProjectPage();

      if (!ll_license) {
        if (statusIndicator) statusIndicator.className = 'll-status-indicator err';
        if (statusText) statusText.textContent = 'Não autenticado';
        if (statusSub) statusSub.textContent = 'Clique na extensão para fazer login';
        return;
      }

      if (ll_license) {
        const lifetimeRaw = (
          ll_license.is_lifetime ??
          ll_license.lifetime ??
          ll_license.isLifetime ??
          ll_license.plan_lifetime ??
          ll_license.license_lifetime
        );
        const expiresRaw = ll_license.expires_at || ll_license.expiresAt || null;
        const isLifetime = lifetimeRaw === true || lifetimeRaw === 'true' || lifetimeRaw === 1 || lifetimeRaw === '1' ||
          String(ll_license.plan_type || ll_license.type || '').toLowerCase().includes('lifetime') ||
          String(ll_license.duration_unit || '').toLowerCase() === 'lifetime' ||
          !expiresRaw;

        if (isLifetime) {
          if (daysEl) daysEl.textContent = '∞';
          if (licUnit) licUnit.textContent = 'vitalício';
          if (barEl) barEl.style.width = '100%';

          if (onProject) {
            if (statusIndicator) statusIndicator.className = 'll-status-indicator';
            if (statusText) statusText.textContent = 'Licença vitalícia ativa ✓';
            if (statusSub) statusSub.textContent = `Olá, ${(ll_user && ll_user.name) || (ll_license && ll_license.user_name) || 'Usuário'}!`;
          } else {
            if (statusIndicator) statusIndicator.className = 'll-status-indicator warn';
            if (statusText) statusText.textContent = 'Licença vitalícia ativa';
            if (statusSub) statusSub.textContent = 'Abra um projeto no Lovable para usar as ações';
          }
          return;
        }

        const remaining = llFormatLicenseRemaining(expiresRaw, ll_license);

        if (daysEl) daysEl.textContent = remaining.number;
        if (licUnit) licUnit.textContent = remaining.unit;
        if (barEl) barEl.style.width = remaining.pct + '%';

        if (remaining.expired) {
          if (statusIndicator) statusIndicator.className = 'll-status-indicator err';
          if (statusText) statusText.textContent = 'Licença expirada';
          if (statusSub) statusSub.textContent = 'Renove sua licença para continuar usando';
        } else if (remaining.status === 'urgent') {
          if (statusIndicator) statusIndicator.className = 'll-status-indicator warn';
          if (statusText) statusText.textContent = '⚠ Licença expirando!';
          if (statusSub) statusSub.textContent = remaining.text;
        } else if (onProject) {
          if (statusIndicator) statusIndicator.className = 'll-status-indicator';
          if (statusText) statusText.textContent = 'Conta e projeto reconhecidos ✓';
          if (statusSub) statusSub.textContent = `Olá, ${(ll_user && ll_user.name) || (ll_license && ll_license.user_name) || 'Usuário'}!`;
        } else {
          if (statusIndicator) statusIndicator.className = 'll-status-indicator warn';
          if (statusText) statusText.textContent = 'Abra um projeto no Lovable';
          if (statusSub) statusSub.textContent = 'Navegue até um projeto para usar as ações';
        }
      }
    });
  }

  function llNavigatePanelScreen(which) {
    const main = document.getElementById('ll-main-screen');
    const st = document.getElementById('ll-settings-screen');
    const sub = document.querySelector('#ll-panel .ll-panel-sub');
    if (!main || !st) return;
    if (which === 'settings') {
      main.classList.add('ll-screen-hidden');
      st.classList.remove('ll-screen-hidden');
      if (sub) sub.textContent = 'Configurações';
    } else {
      st.classList.add('ll-screen-hidden');
      main.classList.remove('ll-screen-hidden');
      if (sub) sub.textContent = 'Copiloto cósmico';
    }
  }

  function syncAiFieldsVisibilityFromDom() {
    ['openai', 'anthropic', 'google', 'groq'].forEach((p) => {
      const ck = document.getElementById(`ll-ai-${p}-on`);
      const box = document.getElementById(`ll-ai-${p}-fields`);
      if (box && ck) box.classList.toggle('ll-ai-off', !ck.checked);
    });
  }

  const PANEL_STORAGE_KEYS_IMG = ['ll_imgbb_api_key', 'll_imgbb_expiration_sec'];

  /** Carrega formulário de configuracoes nas inputs (painel já no DOM). */
  function loadPanelSettingsFromStorage() {
    chrome.storage.local.get(
      PANEL_STORAGE_KEYS_IMG.concat([
        'll_ai_openai_on',
        'll_ai_openai_key',
        'll_ai_openai_model',
        'll_ai_openai_temp',
        'll_ai_anthropic_on',
        'll_ai_anthropic_key',
        'll_ai_anthropic_model',
        'll_ai_anthropic_temp',
        'll_ai_google_on',
        'll_ai_google_key',
        'll_ai_google_model',
        'll_ai_google_temp',
        'll_ai_groq_on',
        'll_ai_groq_key',
        'll_ai_groq_model',
        'll_ai_groq_temp'
      ]),
      (s) => {
        const kImg = document.getElementById('ll-set-imgbb-key');
        const eImg = document.getElementById('ll-set-imgbb-exp');
        if (kImg) kImg.value = String(s.ll_imgbb_api_key != null ? s.ll_imgbb_api_key : '');
        if (eImg) {
          if (
            Object.prototype.hasOwnProperty.call(s, 'll_imgbb_expiration_sec') &&
            (s.ll_imgbb_expiration_sec === '' || s.ll_imgbb_expiration_sec === false)
          )
            eImg.value = '';
          else if (
            s.ll_imgbb_expiration_sec != null &&
            s.ll_imgbb_expiration_sec !== '' &&
            Number.isFinite(Number(s.ll_imgbb_expiration_sec))
          )
            eImg.value = String(Number(s.ll_imgbb_expiration_sec));
          else eImg.value = '';
        }

        const setCk = (id, v) => {
          const el = document.getElementById(id);
          if (el) el.checked = aiFlagOn(v);
        };
        const setVal = (id, v, defTxt) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.value =
            v != null && String(v).trim() !== '' ? String(v) : el.type === 'number' ? String(defTxt) : '';
        };
        setCk('ll-ai-openai-on', s.ll_ai_openai_on);
        setVal('ll-ai-openai-key', s.ll_ai_openai_key, '');
        setVal('ll-ai-openai-model', s.ll_ai_openai_model, '');
        setVal('ll-ai-openai-temp', s.ll_ai_openai_temp != null ? s.ll_ai_openai_temp : 0.7, 0.7);

        setCk('ll-ai-anthropic-on', s.ll_ai_anthropic_on);
        setVal('ll-ai-anthropic-key', s.ll_ai_anthropic_key, '');
        setVal('ll-ai-anthropic-model', s.ll_ai_anthropic_model, '');
        setVal('ll-ai-anthropic-temp', s.ll_ai_anthropic_temp != null ? s.ll_ai_anthropic_temp : 0.7, 0.7);

        setCk('ll-ai-google-on', s.ll_ai_google_on);
        setVal('ll-ai-google-key', s.ll_ai_google_key, '');
        setVal('ll-ai-google-model', s.ll_ai_google_model, '');
        setVal('ll-ai-google-temp', s.ll_ai_google_temp != null ? s.ll_ai_google_temp : 0.7, 0.7);

        setCk('ll-ai-groq-on', s.ll_ai_groq_on);
        setVal('ll-ai-groq-key', s.ll_ai_groq_key, '');
        setVal('ll-ai-groq-model', s.ll_ai_groq_model, '');
        setVal('ll-ai-groq-temp', s.ll_ai_groq_temp != null ? s.ll_ai_groq_temp : 0.7, 0.7);

        syncAiFieldsVisibilityFromDom();
      }
    );
  }

  /** Liga botoes ⚙ Voltar ImgBB IA e atualizacoes aos toggles IA. */
  function initPanelSettingsNavigation() {
    document.getElementById('ll-settings-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      llNavigatePanelScreen('settings');
      loadPanelSettingsFromStorage();
    });
    document.getElementById('ll-settings-back')?.addEventListener('click', (e) => {
      e.stopPropagation();
      llNavigatePanelScreen('main');
    });

    ['openai', 'anthropic', 'google', 'groq'].forEach((p) => {
      document.getElementById(`ll-ai-${p}-on`)?.addEventListener('change', syncAiFieldsVisibilityFromDom);
    });

    document.getElementById('ll-save-imgbb')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const keyEl = document.getElementById('ll-set-imgbb-key');
      const expEl = document.getElementById('ll-set-imgbb-exp');
      const key = keyEl ? String(keyEl.value || '').trim() : '';
      const rawExp = expEl ? String(expEl.value || '').trim() : '';

      const after = () => {
        refreshImgBbConfiguredCache();
        showToast('✅', 'ImgBB atualizado.', 3200);
      };

      if (rawExp === '') {
        chrome.storage.local.set({ ll_imgbb_api_key: key }, () => {
          chrome.storage.local.remove(['ll_imgbb_expiration_sec'], after);
        });
        return;
      }
      const n = Number(rawExp);
      if (!Number.isFinite(n) || n < 60 || n > 15552000) {
        showToast(
          '⚠',
          'Expiração inválida. Use número entre 60 e 15552000 (s), ou deixe vazio.',
          4800
        );
        return;
      }
      chrome.storage.local.set({ ll_imgbb_api_key: key, ll_imgbb_expiration_sec: n }, after);
    });

    document.getElementById('ll-save-ai')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const readCk = (id) => !!(document.getElementById(id) && document.getElementById(id).checked);
      const readStr = (id) =>
        document.getElementById(id) ? String(document.getElementById(id).value || '').trim() : '';
      const readTemp = (id, def = 0.7) =>
        aiSafeTemp(document.getElementById(id) ? document.getElementById(id).value : def, def);

      const payload = {
        ll_ai_openai_on: readCk('ll-ai-openai-on'),
        ll_ai_openai_key: readStr('ll-ai-openai-key'),
        ll_ai_openai_model: readStr('ll-ai-openai-model'),
        ll_ai_openai_temp: readTemp('ll-ai-openai-temp', 0.7),
        ll_ai_anthropic_on: readCk('ll-ai-anthropic-on'),
        ll_ai_anthropic_key: readStr('ll-ai-anthropic-key'),
        ll_ai_anthropic_model: readStr('ll-ai-anthropic-model'),
        ll_ai_anthropic_temp: readTemp('ll-ai-anthropic-temp', 0.7),
        ll_ai_google_on: readCk('ll-ai-google-on'),
        ll_ai_google_key: readStr('ll-ai-google-key'),
        ll_ai_google_model: readStr('ll-ai-google-model'),
        ll_ai_google_temp: readTemp('ll-ai-google-temp', 0.7),
        ll_ai_groq_on: readCk('ll-ai-groq-on'),
        ll_ai_groq_key: readStr('ll-ai-groq-key'),
        ll_ai_groq_model: readStr('ll-ai-groq-model'),
        ll_ai_groq_temp: readTemp('ll-ai-groq-temp', 0.7)
      };
      chrome.storage.local.set(payload, () => showToast('✅', 'Credenciais IA guardadas.', 3600));
    });
  }

  // ── Controle de Limite Diário (Visual) ──
  let dailyLimitInterval = null;
  const DAILY_MAX = 100;

  function initDailyLimitCounter() {
    if (dailyLimitInterval) clearInterval(dailyLimitInterval);
    
    function updateUI() {
      const today = new Date().toISOString().split('T')[0];
      chrome.storage.local.get(['netuno_daily_usage'], (res) => {
        let usage = res.netuno_daily_usage || { date: today, count: 0 };
        if (usage.date !== today) {
          usage = { date: today, count: 0 };
          chrome.storage.local.set({ netuno_daily_usage: usage });
        }
        
        let remaining = DAILY_MAX - usage.count;
        if (remaining < 0) remaining = 0;
        
        const countEl = document.getElementById('ll-daily-count');
        const barEl = document.getElementById('ll-daily-bar');
        const timerEl = document.getElementById('ll-daily-timer');
        
        if (countEl) countEl.textContent = remaining;
        if (barEl) {
          const pct = Math.max(0, Math.min(100, (remaining / DAILY_MAX) * 100));
          barEl.style.width = pct + '%';
          if (pct < 20) barEl.style.background = 'var(--ll-red, #ff4444)';
          else barEl.style.background = 'var(--ll-accent, #5500ff)';
        }
        
        if (timerEl) {
          const now = new Date();
          const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          const diff = tomorrow - now;
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          timerEl.textContent = `${h}h ${m}m`;
        }
      });
    }
    
    updateUI();
    dailyLimitInterval = setInterval(updateUI, 60000);
  }

  function consumeDailyLimit() {
    const today = new Date().toISOString().split('T')[0];
    chrome.storage.local.get(['netuno_daily_usage'], (res) => {
      let usage = res.netuno_daily_usage || { date: today, count: 0 };
      if (usage.date !== today) usage = { date: today, count: 0 };
      usage.count += 1;
      chrome.storage.local.set({ netuno_daily_usage: usage });
    });
  }

  // ── Build HTML ──────────────────────────────────────────────────────────────
  function buildBubble(user, license) {
    const wrap = document.createElement('div');
    wrap.id = 'll-bubble-wrap';

    // Panel
    const panel = document.createElement('div');
    panel.id = 'll-panel';
    panel.innerHTML = `
      <div class="ll-panel-content">
        <div class="ll-panel-header">
          <div class="ll-panel-logo"><img src="${chrome.runtime.getURL('icons-png/icon128.png')}" alt="" aria-hidden="true"></div>
          <div class="ll-panel-title-block">
            <div class="ll-panel-title">Netuno Lovable</div>
            <div class="ll-panel-sub">Copiloto cósmico · <span id="ll-session-timer">00:00:00</span></div>
          </div>
          <button type="button" class="ll-panel-settings-btn" id="ll-settings-btn" title="ImgBB · credenciais IA · status da extensão" aria-label="Configurações">⚙</button>
          <div class="ll-panel-layout-actions" role="group" aria-label="Modo do painel">
            <button type="button" class="ll-layout-mode-btn ll-layout-mode-active" id="ll-layout-mode-dock" title="Painel fixo à direita (barra inteira)">📌</button>
            <button type="button" class="ll-layout-mode-btn" id="ll-layout-mode-float" title="Modo bolha — arrastar e painel tipo janela">◎</button>
          </div>
          <button type="button" class="ll-panel-close" id="ll-close-btn" title="Recolher (fixo) ou fechar (bolha)">✕</button>
        </div>

        <div id="ll-main-screen" class="ll-panel-stack">
          <!-- Banner de atualização visível -->
          <div id="ll-update-banner" class="ll-update-banner ll-hidden">
            <div class="ll-update-banner-icon">🚀</div>
            <div class="ll-update-banner-content">
              <strong>Nova versão disponível!</strong>
              <span id="ll-update-banner-version"></span>
            </div>
            <button id="ll-update-banner-btn" class="ll-update-banner-btn">Baixar</button>
            <button id="ll-update-banner-dismiss" class="ll-update-banner-close" title="Fechar">✕</button>
          </div>

          <div class="ll-status-block">
            <div class="ll-status-indicator" id="ll-status-dot"></div>
            <div>
              <div class="ll-status-text" id="ll-status-text">Verificando...</div>
              <div class="ll-status-sub" id="ll-status-sub">Aguarde...</div>
            </div>
          </div>

          <div class="ll-license-row">
            <div>
              <div class="ll-lic-label">Licença</div>
              <div class="ll-lic-days" id="ll-lic-days">—</div>
              <div class="ll-lic-unit" id="ll-lic-unit">dias restantes</div>
              <div class="ll-lic-bar">
                <div class="ll-lic-bar-fill" id="ll-lic-bar-fill" style="width:50%"></div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:10px;color:var(--ll-muted);margin-bottom:6px">Plano</div>
              <div style="font-size:11px;font-weight:700;color:var(--ll-green)">● PRO</div>
            </div>
          </div>
          <div class="ll-license-row" style="margin-top: 8px; border-color: var(--ll-border);">
            <div>
              <div class="ll-lic-label">Comandos (Proxy)</div>
              <div class="ll-lic-days" id="ll-daily-count">100</div>
              <div class="ll-lic-unit">restantes hoje</div>
              <div class="ll-lic-bar">
                <div class="ll-lic-bar-fill" id="ll-daily-bar" style="width:100%; background:var(--ll-accent);"></div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:10px;color:var(--ll-muted);margin-bottom:6px">Renova em</div>
              <div style="font-size:11px;font-weight:700;color:var(--ll-muted)" id="ll-daily-timer">--h --m</div>
            </div>
          </div>
          <div class="ll-composer-card" id="ll-composer-root">
            <div class="ll-composer-head">
              <span class="ll-composer-label">💬 Canal Netuno Lovable</span>
              <span class="ll-composer-proxy-dot" role="img" aria-label="Canal proxy ativo" title="Canal Netuno Lovable (proxy)"></span>
            </div>
            <textarea id="ll-composer-text" rows="4" placeholder="Mensagem… · Cole imagem aqui (Ctrl+V) · Solte arquivos aqui · Enter envia · Shift+Enter nova linha"></textarea>
            <input type="file" id="ll-composer-file-input" multiple class="ll-visually-hidden" tabindex="-1" />
            <ul class="ll-composer-file-list" id="ll-composer-file-list" aria-live="polite"></ul>
            <div class="ll-composer-bottom-row">
              <button type="button" class="ll-composer-attach-btn" id="ll-composer-attach" title="Anexar arquivo do PC">
                <span class="ll-attach-icon">📎</span><span class="ll-attach-label">Anexar</span>
              </button>
              <button type="button" class="ll-composer-voice-btn" id="ll-composer-voice" title="Falar para digitar (voz para texto)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11.25 21v-2.286a8.25 8.25 0 0 1-7.5-8.214.75.75 0 0 1 1.5 0 6.75 6.75 0 0 0 13.5 0 .75.75 0 0 1 1.5 0 8.25 8.25 0 0 1-7.5 8.214V21a.75.75 0 0 1-1.5 0m4-14a3.25 3.25 0 0 0-6.5 0v3a3.25 3.25 0 0 0 6.5 0zm1.5 3a4.75 4.75 0 1 1-9.5 0V7a4.75 4.75 0 0 1 9.5 0z"></path></svg>
              </button>
              <button type="button" class="ll-composer-send" id="ll-composer-send" title="Enviar">▶ Enviar</button>
            </div>
          </div>

          <details class="ll-actions-acc">
            <summary class="ll-actions-summary">
              <span class="ll-actions-chev" aria-hidden="true">›</span>
              <span class="ll-actions-label">AÇÕES RÁPIDAS</span>
              <span class="ll-actions-pill">11</span>
            </summary>
            <div class="ll-actions-grid">
              <button class="ll-action-btn" data-action="publish">
                <span class="ll-icon">🚀</span><span>Publicar</span>
              </button>
              <button class="ll-action-btn" data-action="download">
                <span class="ll-icon">📦</span><span>Baixar ZIP</span>
              </button>
              <button class="ll-action-btn" data-action="new">
                <span class="ll-icon">🆕</span><span>Novo Projeto</span>
              </button>
              <button class="ll-action-btn" data-action="improve">
                <span class="ll-icon">🤖</span><span>Melhorar Prompt</span>
              </button>
              <button class="ll-action-btn" data-action="select-preview-element">
                <span class="ll-icon">🎯</span><span>Selecionar Elemento</span>
              </button>
              <button class="ll-action-btn" data-action="watermark">
                <span class="ll-icon">🚫</span><span>Remover Marca</span>
              </button>
              <button class="ll-action-btn" data-action="screenshot">
                <span class="ll-icon">📸</span><span>Screenshot</span>
              </button>
              <button class="ll-action-btn" data-action="codereview">
                <span class="ll-icon">🔍</span><span>Code Review</span>
              </button>
              <button class="ll-action-btn" data-action="captureerrors">
                <span class="ll-icon">🐛</span><span>Capturar Erros</span>
              </button>
              <button class="ll-action-btn" data-action="templates">
                <span class="ll-icon">📋</span><span>Templates</span>
              </button>
              <button class="ll-action-btn" id="ll-context-toggle-btn">
                <span class="ll-icon">📎</span><span>Contexto</span>
              </button>
            </div>
            <div id="ll-context-panel" class="ll-context-panel" style="display:none;">
              <div class="ll-context-header">
                <span>📎 Contexto para Melhorar Prompt</span>
                <button id="ll-context-clear" class="ll-context-clear" title="Limpar contexto">✕</button>
              </div>
              <textarea id="ll-context-text" class="ll-context-textarea" rows="4" placeholder="Cole aqui o contexto (texto, instrucoes, regras do projeto...) ou anexe um .md abaixo"></textarea>
              <div class="ll-context-file-row">
                <button id="ll-context-file-btn" class="ll-context-file-btn">📄 Anexar .md</button>
                <span id="ll-context-file-name" class="ll-context-file-name"></span>
                <input type="file" id="ll-context-file-input" accept=".md,.txt,.markdown" style="display:none" />
              </div>
              <div class="ll-context-status" id="ll-context-status"></div>
            </div>
            <div id="ll-templates-panel" class="ll-templates-panel" style="display:none;">
              <div class="ll-templates-header">
                <span>📋 Templates de Prompt</span>
                <button id="ll-templates-close" class="ll-context-clear" title="Fechar">✕</button>
              </div>
              <div class="ll-templates-list" id="ll-templates-list"></div>
            </div>
          </details>

          <div id="ll-hub-root" class="ll-hub-root"></div>

          <details class="ll-actions-acc ll-history-acc">
            <summary class="ll-actions-summary">
              <span class="ll-actions-chev" aria-hidden="true">›</span>
              <span class="ll-actions-label">HISTÓRICO</span>
              <span class="ll-actions-pill" id="ll-history-count">0</span>
            </summary>
            <div class="ll-history-list" id="ll-history-list">
              <div class="ll-history-empty">Nenhum prompt enviado ainda.</div>
            </div>
          </details>

          <div class="ll-panel-footer">
            <button class="ll-footer-btn" id="ll-upgrade-btn" data-mode="plans">⬆ Upgrade</button>
            <button class="ll-footer-btn" id="ll-site-btn">🌐 Site</button>
            <button class="ll-footer-btn" id="ll-reconnect-btn">🔄 Reconectar</button>
            <button class="ll-footer-btn ll-logout" id="ll-logout-btn">⏏ Sair</button>
          </div>
          <div class="ll-signature-footer">
            <span class="ll-sig-name">Netuno Lovable</span>
            <span class="ll-sig-sep">·</span>
            <a href="https://netunolov.com.br" target="_blank" rel="noopener noreferrer" class="ll-sig-link">netunolov.com.br</a>
            <span class="ll-version-chip">v5.2.1</span>
          </div>
        </div>

        <div id="ll-settings-screen" class="ll-panel-stack ll-screen-hidden">
          <button type="button" class="ll-settings-back-btn" id="ll-settings-back">← Voltar</button>

          <div class="ll-set-card">
            <div class="ll-set-card-head">Hosting · ImgBB</div>
            <p class="ll-set-hint"><a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer">api.imgbb.com</a> — cada utilizador usa a sua própria chave.</p>
            <label class="ll-set-lbl" for="ll-set-imgbb-key">Chave da API</label>
            <input type="password" id="ll-set-imgbb-key" class="ll-set-input" autocomplete="new-password" placeholder="Cole aqui · guardar abaixo" />
            <label class="ll-set-lbl" for="ll-set-imgbb-exp">Expiração do link (opcional)</label>
            <input type="number" id="ll-set-imgbb-exp" class="ll-set-input" min="60" max="15552000" placeholder="600 s · vazio = padrão" />
            <p class="ll-set-micro">Valor em segundos (60–15552000). Deixar vazio repõe TTL predefinido da extensão.</p>
            <button type="button" class="ll-set-save-btn" id="ll-save-imgbb">Guardar ImgBB</button>
          </div>

          <div class="ll-set-card">
            <div class="ll-set-card-head">Inteligência artificial (Melhorar prompt e futuros)</div>
            <p class="ll-set-hint">Se ativar pelo menos uma chave válida, o Melhorar prompt usa primeiro o seu modelo; caso contrário continua pela API Netuno Lovable.</p>

            <div class="ll-ai-provider-block">
              <label class="ll-ai-toggle-row"><input type="checkbox" id="ll-ai-openai-on" /> OpenAI</label>
              <div id="ll-ai-openai-fields" class="ll-ai-provider-fields ll-ai-off">
                <label class="ll-set-lbl" for="ll-ai-openai-key">API key</label>
                <input type="password" id="ll-ai-openai-key" class="ll-set-input" autocomplete="new-password" />
                <label class="ll-set-lbl" for="ll-ai-openai-model">Modelo</label>
                <select id="ll-ai-openai-model" class="ll-set-input">
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                  <option value="gpt-4">gpt-4</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  <option value="o1-mini">o1-mini</option>
                  <option value="o1-preview">o1-preview</option>
                </select>
                <label class="ll-set-lbl" for="ll-ai-openai-temp">Temperatura (0–2)</label>
                <input type="number" id="ll-ai-openai-temp" class="ll-set-input" min="0" max="2" step="0.05" value="0.7" />
              </div>
            </div>

            <div class="ll-ai-provider-block">
              <label class="ll-ai-toggle-row"><input type="checkbox" id="ll-ai-anthropic-on" /> Anthropic</label>
              <div id="ll-ai-anthropic-fields" class="ll-ai-provider-fields ll-ai-off">
                <label class="ll-set-lbl" for="ll-ai-anthropic-key">API key</label>
                <input type="password" id="ll-ai-anthropic-key" class="ll-set-input" autocomplete="new-password" />
                <label class="ll-set-lbl" for="ll-ai-anthropic-model">Modelo</label>
                <select id="ll-ai-anthropic-model" class="ll-set-input">
                  <option value="claude-sonnet-4-20250514">claude-sonnet-4</option>
                  <option value="claude-3-5-sonnet-20241022">claude-3.5-sonnet</option>
                  <option value="claude-3-5-haiku-20241022">claude-3.5-haiku</option>
                  <option value="claude-3-opus-20240229">claude-3-opus</option>
                </select>
                <label class="ll-set-lbl" for="ll-ai-anthropic-temp">Temperatura (0–2)</label>
                <input type="number" id="ll-ai-anthropic-temp" class="ll-set-input" min="0" max="2" step="0.05" value="0.7" />
              </div>
            </div>

            <div class="ll-ai-provider-block">
              <label class="ll-ai-toggle-row"><input type="checkbox" id="ll-ai-google-on" /> Google Gemini</label>
              <div id="ll-ai-google-fields" class="ll-ai-provider-fields ll-ai-off">
                <label class="ll-set-lbl" for="ll-ai-google-key">API key</label>
                <input type="password" id="ll-ai-google-key" class="ll-set-input" autocomplete="new-password" />
                <label class="ll-set-lbl" for="ll-ai-google-model">Modelo</label>
                <select id="ll-ai-google-model" class="ll-set-input">
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  <option value="gemini-1.0-pro">gemini-1.0-pro</option>
                </select>
                <label class="ll-set-lbl" for="ll-ai-google-temp">Temperatura (0–2)</label>
                <input type="number" id="ll-ai-google-temp" class="ll-set-input" min="0" max="2" step="0.05" value="0.7" />
              </div>
            </div>

            <div class="ll-ai-provider-block">
              <label class="ll-ai-toggle-row"><input type="checkbox" id="ll-ai-groq-on" /> Groq</label>
              <div id="ll-ai-groq-fields" class="ll-ai-provider-fields ll-ai-off">
                <label class="ll-set-lbl" for="ll-ai-groq-key">API key</label>
                <input type="password" id="ll-ai-groq-key" class="ll-set-input" autocomplete="new-password" />
                <label class="ll-set-lbl" for="ll-ai-groq-model">Modelo</label>
                <select id="ll-ai-groq-model" class="ll-set-input">
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                  <option value="llama3-70b-8192">llama3-70b-8192</option>
                  <option value="llama3-8b-8192">llama3-8b-8192</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                  <option value="gemma2-9b-it">gemma2-9b-it</option>
                </select>
                <label class="ll-set-lbl" for="ll-ai-groq-temp">Temperatura (0–2)</label>
                <input type="number" id="ll-ai-groq-temp" class="ll-set-input" min="0" max="2" step="0.05" value="0.7" />
              </div>
            </div>

            <button type="button" class="ll-set-save-btn" id="ll-save-ai">Guardar credenciais IA</button>
          </div>

          <div class="ll-cap-status" aria-label="Status da extensão">
            <div class="ll-cap-status-head">
              <span class="ll-cap-status-title">STATUS DA EXTENSÃO</span>
              <span class="ll-cap-status-badge ll-cap-badge-sync" id="ll-cap-sync-badge">LIGADO</span>
            </div>
            <p class="ll-cap-current-lbl">Status atual</p>
            <div class="ll-cap-svc-row ll-cap-svc-online" id="ll-cap-svc-row">
              <span class="ll-cap-main-ticket" id="ll-cap-svc-ticket">✓</span>
              <div class="ll-cap-svc-text">
                <div class="ll-cap-svc-headline" id="ll-cap-svc-headline">EM FUNCIONAMENTO</div>
                <div class="ll-cap-svc-desc" id="ll-cap-svc-desc">A extensão está ativa e respondendo normalmente.</div>
              </div>
            </div>
            <div class="ll-cap-status-sub-cap">Canal Netuno Lovable na bolha</div>
            <ul class="ll-cap-checklist" role="list">
              <li class="ll-cap-item ll-cap-item-ok"><span class="ll-cap-item-ticket" aria-hidden="true">✓</span> Texto (campo principal do site + interceptação)</li>
              <li class="ll-cap-item ll-cap-item-ok"><span class="ll-cap-item-ticket" aria-hidden="true">✓</span> Texto · imagens · ZIP · anexos</li>
              <li class="ll-cap-item ll-cap-item-wait"><span class="ll-cap-item-ticket" aria-hidden="true">◻</span> Fluxo experimental — se falhar um upload use o chat nativo</li>
            </ul>
            <p class="ll-cap-note"><strong>Canal Netuno Lovable:</strong> na vista principal (<strong>Canal Netuno Lovable</strong>) para texto opcional ou arrastar ficheiros.</p>
          </div>
        </div>
      </div>
    `;

    // Orb (floating bubble)
    const orb = document.createElement('div');
    orb.id = 'll-orb';
    orb.innerHTML = `
      <div id="ll-orb-glow"></div>
      <div id="ll-orb-ring"></div>
      <div id="ll-orb-inner">
        <img src="${chrome.runtime.getURL('icons-png/icon128.png')}" alt="Netuno Lovable">
      </div>
      <div id="ll-orb-dot"></div>
      <div id="ll-orb-update-badge" class="ll-orb-update-badge ll-hidden">!</div>
    `;

    const dockTab = document.createElement('button');
    dockTab.type = 'button';
    dockTab.id = 'll-dock-expand-tab';
    dockTab.textContent = '◀';
    dockTab.setAttribute('aria-label', 'Abrir painel Netuno Lovable');
    dockTab.title = 'Abrir painel';

    wrap.appendChild(panel);
    wrap.appendChild(orb);
    wrap.appendChild(dockTab);
    return wrap;
  }

  // ─── Drag (Mouse + Touch) ────────────────────────────────────────────────────
  function initDrag(wrap, orb) {
    let startX, startY, startLeft, startBottom;

    function getPos(e) {
      return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                       : { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      if (bubbleEl && bubbleEl.classList.contains('ll-layout-docked')) return;
      if (e.target.closest('#ll-panel')) return;
      isDragging = true;
      dragMoved = false;
      const pos = getPos(e);
      startX = pos.x; startY = pos.y;

      const rect = wrap.getBoundingClientRect();
      startLeft = rect.left;
      startBottom = window.innerHeight - rect.bottom;

      document.addEventListener('mousemove', onMove, { passive: false });
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchend', onEnd);
      e.preventDefault();
    }

    function onMove(e) {
      if (!isDragging) return;
      const pos = getPos(e);
      const dx = pos.x - startX;
      const dy = pos.y - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;

      let newLeft = startLeft + dx;
      let newBottom = startBottom - dy;

      // Clamp to viewport
      const maxLeft = window.innerWidth - wrap.offsetWidth - 4;
      const maxBottom = window.innerHeight - wrap.offsetHeight - 4;
      newLeft = Math.max(4, Math.min(newLeft, maxLeft));
      newBottom = Math.max(4, Math.min(newBottom, maxBottom));

      wrap.style.left = newLeft + 'px';
      wrap.style.right = 'auto';
      wrap.style.bottom = newBottom + 'px';
      e.preventDefault();
    }

    function onEnd(e) {
      isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchend', onEnd);
      
      // Se não moveu (ou moveu muito pouco), conta como clique!
      if (!dragMoved) {
        togglePanel();
      }
    }

    orb.addEventListener('mousedown', onStart);
    orb.addEventListener('touchstart', onStart, { passive: false });
  }

  // ─── Close on outside click ──────────────────────────────────────────────────
  function initOutsideClick(wrap) {
    document.addEventListener('click', (e) => {
      if (!panelOpen) return;
      if (panelLayoutMode === 'docked') return;
      if (wrap.contains(e.target)) return;
      closePanel();
    });
  }

  const COMPOSER_MAX_FILES = 20;
  /** Intervalo opcional antes de poder enviar, após a API já ter devolvido URL (CDN / consistência). */
  const COMPOSER_IMGBB_SETTLE_MS = 8000;

  /** Desativa ▶ quando ainda faz upload ou a "sincronizar" (~8 s). */
  function syncComposerSendButtonDisabled() {
    const sendBtn = document.getElementById('ll-composer-send');
    if (!sendBtn) return;
    const blockImg = composerAttachmentList.some(
      (i) => i.kind === 'imgbb_image' && (i.status === 'uploading' || i.status === 'settling')
    );
    if (blockImg) sendBtn.setAttribute('data-ll-block-settle', '1');
    else sendBtn.removeAttribute('data-ll-block-settle');
    if (sendBtn.getAttribute('data-ll-busy') === '1') return;
    sendBtn.disabled = blockImg;
  }

  function composerFileFingerprint(file) {
    if (!file || typeof file.size !== 'number') return '';
    let name = String(file.name || '').trim().toLocaleLowerCase();
    // Blobs colados podem receber um nome sintético diferente em eventos repetidos.
    name = name.replace(/^(captura|anexo)-\d+(?=\.|$)/i, '$1');
    return [
      name,
      String(file.size || 0),
      String(file.type || 'application/octet-stream').trim().toLocaleLowerCase()
    ].join('::');
  }

  function composerAttachmentFingerprint(item) {
    if (!item) return '';
    if (item.fingerprint) return String(item.fingerprint);
    if (item.kind === 'lovable_file') return composerFileFingerprint(item.file);
    return [
      String(item.name || ''),
      String(item.size || 0),
      String(item.mime || 'application/octet-stream'),
      String(item.localId || '')
    ].join('::');
  }

  function renderComposerAttachments() {
    const ul = document.getElementById('ll-composer-file-list');
    if (!ul) {
      llScheduleNativeCosmeticAttachmentsRender();
      return;
    }
    ul.innerHTML = '';
    composerAttachmentList.forEach((item, ix) => {
      const li = document.createElement('li');
      li.className = 'll-composer-file-chip';
      const rawName =
        item.kind === 'lovable_file' ? String(item.file?.name || '') : String(item.name || '');
      const safe = rawName.replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
      let statusEl = '';
      const sourceLabel = item.source === 'lovable_chat' ? 'Chat Lovable · ' : '';
      if (item.kind === 'imgbb_image') {
        if (item.status === 'uploading') {
          statusEl =
            `<span class="ll-composer-chip-status ll-composer-chip-loading">${sourceLabel}Carregando…</span>`;
        } else if (item.status === 'settling') {
          statusEl =
            `<span class="ll-composer-chip-status ll-composer-chip-loading">${sourceLabel}A sincronizar (~8 s)…</span>`;
        } else if (item.status === 'ready') {
          statusEl =
            `<span class="ll-composer-chip-status ll-composer-chip-ready">${sourceLabel}Pronto p/ enviar</span>`;
        } else {
          statusEl = `<span class="ll-composer-chip-status ll-composer-chip-err">${sourceLabel}Erro</span>`;
        }
      } else {
        statusEl = `<span class="ll-composer-chip-status ll-composer-chip-ready">${sourceLabel}Pronto p/ envio</span>`;
      }
      li.innerHTML =
        `<span class="ll-composer-chip-name">${safe}</span>${statusEl}` +
        `<button type="button" class="ll-composer-chip-x" data-rm="${ix}" aria-label="Remover anexo">✕</button>`;
      ul.appendChild(li);
    });
    ul.querySelectorAll('[data-rm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-rm'));
        if (Number.isNaN(i)) return;
        const item = composerAttachmentList[i];
        llRemoveComposerAttachment(item, { syncNative: true, reason: 'extension-x' });
      });
    });
    syncComposerSendButtonDisabled();
    llScheduleNativeCosmeticAttachmentsRender();
  }

  /** Colagem/screenshot vêm como File/Blob frequentemente sem `name`; ImgBB pede multipart com nome útil. */
  function normalizeIncomingFileForComposer(f) {
    if (!f || typeof f.size !== 'number') return null;
    if (f.size < 0) return null;
    const mime = String(f.type || 'application/octet-stream');
    let name = f instanceof File ? String(f.name || '').trim() : '';
    if (!name) {
      if (mime.includes('png')) name = `captura-${Date.now()}.png`;
      else if (mime.includes('jpeg') || mime === 'image/jpg') name = `captura-${Date.now()}.jpg`;
      else if (mime.includes('webp')) name = `captura-${Date.now()}.webp`;
      else if (mime.includes('gif')) name = `captura-${Date.now()}.gif`;
      else if (mime.startsWith('image/')) name = `captura-${Date.now()}.png`;
      else name = `anexo-${Date.now()}`;
    }
    try {
      return f instanceof File && String(f.name || '').trim() ? f : new File([f], name, { type: mime });
    } catch (_) {
      return null;
    }
  }

  function clipboardImagesFromPasteEvent(ev) {
    const dt = ev.clipboardData;
    if (!dt) return [];
    const seen = new Set();
    const out = [];
    const pushBlob = (b) => {
      if (!(b instanceof Blob)) return;
      if (!String(b.type || '').startsWith('image/')) return;
      const k = `${b.type}_${b.size}`;
      if (seen.has(k)) return;
      seen.add(k);
      out.push(b);
    };
    try {
      const fl = dt.files;
      if (fl && fl.length) {
        Array.from(fl).forEach(pushBlob);
      }
    } catch (_) {}
    try {
      const items = dt.items;
      if (items && items.length) {
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (!it || it.kind !== 'file') continue;
          if (!String(it.type || '').startsWith('image/')) continue;
          try {
            const b = typeof it.getAsFile === 'function' ? it.getAsFile() : null;
            pushBlob(b);
          } catch (_) {}
        }
      }
    } catch (_) {}
    return out;
  }

  function enqueueImgBbUpload(entry, file) {
    uploadFileToImgBbWithRetries(file)
      .then((up) => {
        const idx = composerAttachmentList.indexOf(entry);
        if (idx === -1) return;
        const cur = composerAttachmentList[idx];
        if (!cur || cur.kind !== 'imgbb_image' || cur.localId !== entry.localId) return;
        cur.url = up.url;
        cur.displayUrl = up.displayUrl;
        cur.imgbbApiId = up.id;
        cur.status = 'settling';
        if (cur._settleTimerId) clearTimeout(cur._settleTimerId);
        renderComposerAttachments();
        cur._settleTimerId = window.setTimeout(() => {
          const ix2 = composerAttachmentList.indexOf(cur);
          if (ix2 === -1) return;
          const c2 = composerAttachmentList[ix2];
          if (
            !c2 ||
            c2.kind !== 'imgbb_image' ||
            c2.localId !== entry.localId
          ) {
            return;
          }
          if (c2.status === 'settling') c2.status = 'ready';
          c2._settleTimerId = undefined;
          renderComposerAttachments();
        }, COMPOSER_IMGBB_SETTLE_MS);
      })
      .catch((err) => {
        const idx = composerAttachmentList.indexOf(entry);
        if (idx === -1) return;
        const cur = composerAttachmentList[idx];
        if (!cur || cur.kind !== 'imgbb_image' || cur.localId !== entry.localId) return;
        if (cur._settleTimerId) clearTimeout(cur._settleTimerId);
        cur.status = 'error';
        cur.err = err?.message || 'ImgBB';
        renderComposerAttachments();
        showToast('⚠', `Upload imagem · ${entry.name}`, 5200);
        const em = String(err?.message || '');
        if (/sem chave|Configurações/i.test(em)) pulseLlSettingsBtn();
      });
  }

  function addComposerFiles(fileList, options = {}) {
    // Captura e reserva imediatamente, porque React/Lovable pode limpar o input e disparar
    // change + input para a mesma seleção antes de a primeira inclusão assíncrona terminar.
    const source = options && options.source === 'lovable_chat' ? 'lovable_chat' : 'extension';
    const existing = new Set(composerAttachmentList.map(composerAttachmentFingerprint).filter(Boolean));
    const local = new Set();
    const snapshot = [];
    const reserved = [];
    for (const rawFile of Array.from(fileList || [])) {
      const file = normalizeIncomingFileForComposer(rawFile);
      if (!file) continue;
      const fingerprint = composerFileFingerprint(file);
      if (fingerprint && (existing.has(fingerprint) || local.has(fingerprint) || composerQueuedFingerprints.has(fingerprint))) {
        continue;
      }
      if (fingerprint) {
        local.add(fingerprint);
        composerQueuedFingerprints.add(fingerprint);
        reserved.push(fingerprint);
      }
      snapshot.push(file);
    }
    if (!snapshot.length) return Promise.resolve(0);

    const run = () => addComposerFilesNow(snapshot, { ...options, source });
    const job = composerAttachmentMutationQueue.then(run, run);
    const release = () => reserved.forEach((fingerprint) => composerQueuedFingerprints.delete(fingerprint));
    composerAttachmentMutationQueue = job.then(
      () => { release(); },
      () => { release(); }
    );
    return job.finally(release);
  }

  async function addComposerFilesNow(fileList, options = {}) {
    const source = options && options.source === 'lovable_chat' ? 'lovable_chat' : 'extension';
    const incoming = [];
    const incomingFingerprints = new Set();
    for (const rawFile of Array.from(fileList || [])) {
      const file = normalizeIncomingFileForComposer(rawFile);
      if (!file) continue;
      const fingerprint = composerFileFingerprint(file);
      if (fingerprint && incomingFingerprints.has(fingerprint)) continue;
      if (fingerprint) incomingFingerprints.add(fingerprint);
      incoming.push(file);
    }
    if (!incoming.length) return 0;

    // Padrão: tudo via Lovable. Se ImgBB estiver LIGADO no popup E houver chave,
    // imagens passam por ImgBB; demais arquivos sempre via Lovable.
    const imgbbCfg = await new Promise((r) => chrome.storage.local.get(
      ['ll_imgbb_enabled', 'll_imgbb_api_key'], r
    ));
    const imgbbActive = !!(imgbbCfg.ll_imgbb_enabled
      && imgbbCfg.ll_imgbb_api_key
      && String(imgbbCfg.ll_imgbb_api_key).trim());

    if (imgbbActive && incoming.some(llComposerFileLooksLikeImage)) {
      const gate = await llEnsureImgBbKeyForComposerFiles(incoming);
      if (!gate) return 0;
    }

    const existingFingerprints = new Set(
      composerAttachmentList.map(composerAttachmentFingerprint).filter(Boolean)
    );
    let room = COMPOSER_MAX_FILES - composerAttachmentList.length;
    if (room <= 0) {
      showToast('⚠', `Máximo ${COMPOSER_MAX_FILES} anexos nesta caixa.`, 4000);
      return 0;
    }

    let added = 0;
    for (const file of incoming) {
      if (room <= 0) break;
      const fingerprint = composerFileFingerprint(file);
      if (fingerprint && existingFingerprints.has(fingerprint)) continue;
      const isImg = !!(file.type && String(file.type).startsWith('image/'));
      if (isImg && imgbbActive) {
        const localId = `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
        const entry = {
          kind: 'imgbb_image',
          localId,
          name: file.name,
          mime: file.type || 'image/png',
          size: file.size,
          status: 'uploading',
          source,
          fingerprint
        };
        composerAttachmentList.push(entry);
        enqueueImgBbUpload(entry, file);
      } else {
        composerAttachmentList.push({ kind: 'lovable_file', file, source, fingerprint });
      }
      if (fingerprint) existingFingerprints.add(fingerprint);
      room--;
      added++;
    }
    renderComposerAttachments();
    return added;
  }

  function initComposerPanel() {
    const dz = document.getElementById('ll-composer-root');
    const fin = document.getElementById('ll-composer-file-input');
    const ta = document.getElementById('ll-composer-text');
    const sendBtn = document.getElementById('ll-composer-send');
    const attachBtn = document.getElementById('ll-composer-attach');
    if (!dz || !fin || !ta || !sendBtn) return;

    // O chat nativo é apenas uma entrada visual: restaura o mesmo rascunho dentro da extensão.
    const nativeDraftAtInit = getEditorText(findEditor());
    ta.value = nativeDraftAtInit || '';
    if (nativeDraftAtInit) llPersistUnifiedDraft(nativeDraftAtInit);
    else {
      try {
        chrome.storage.local.get([STORAGE_NATIVE_PROMPT_DRAFT], (data) => {
          if (!ta.value && data && data[STORAGE_NATIVE_PROMPT_DRAFT]) {
            ta.value = String(data[STORAGE_NATIVE_PROMPT_DRAFT]);
          }
        });
      } catch (_) {}
    }
    renderComposerAttachments();

    /* ── Drag & drop na card inteira ─────────────────────────────── */
    ['dragenter', 'dragover'].forEach((evt) => {
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.add('ll-composer-dz-active');
      });
    });
    dz.addEventListener('dragleave', (e) => {
      if (!dz.contains(e.relatedTarget)) dz.classList.remove('ll-composer-dz-active');
    });
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dz.classList.remove('ll-composer-dz-active');
      void addComposerFiles(e.dataTransfer && e.dataTransfer.files);
    });

    /* ── Botão anexar → abre file picker ─────────────────────────── */
    if (attachBtn) {
      attachBtn.addEventListener('click', () => fin.click());
    }

    /* ── Botao voz → transcreve fala para texto (Web Speech API) ── */
    var llSpeechRecog = null;
    var llSpeechActive = false;
    var llSpeechTimer = null;
    var llSpeechStart = 0;
    var llSpeechTextBefore = '';   /* texto que ja existia antes de comecar */
    var llSpeechInterim = '';      /* resultado parcial em tempo real */

    var SpeechRecogClass = window.SpeechRecognition || window.webkitSpeechRecognition || null;

    var voiceBtn = document.getElementById('ll-composer-voice');
    if (voiceBtn && SpeechRecogClass) {
      voiceBtn.addEventListener('click', function () {

        /* ── Se ja esta ouvindo → parar ─────────────────────────── */
        if (llSpeechActive && llSpeechRecog) {
          llSpeechRecog.stop();
          return;
        }

        /* ── Iniciar reconhecimento ─────────────────────────────── */
        llSpeechRecog = new SpeechRecogClass();
        llSpeechRecog.lang = 'pt-BR';
        llSpeechRecog.continuous = true;
        llSpeechRecog.interimResults = true;
        llSpeechRecog.maxAlternatives = 1;

        llSpeechTextBefore = ta.value || '';
        llSpeechInterim = '';

        llSpeechRecog.onstart = function () {
          llSpeechActive = true;
          llSpeechStart = Date.now();
          voiceBtn.classList.add('ll-voice-recording');
          voiceBtn.title = 'Clique para parar';
          showToast('🎤', 'Ouvindo... fale agora. Clique para parar.', 3000);

          /* Timer visual */
          llSpeechTimer = setInterval(function () {
            var sec = Math.round((Date.now() - llSpeechStart) / 1000);
            var mm = String(Math.floor(sec / 60)).padStart(2, '0');
            var ss = String(sec % 60).padStart(2, '0');
            voiceBtn.setAttribute('data-rec-time', mm + ':' + ss);
          }, 500);
        };

        llSpeechRecog.onresult = function (ev) {
          var finalText = '';
          var interimText = '';

          for (var i = 0; i < ev.results.length; i++) {
            var transcript = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) {
              finalText += transcript;
            } else {
              interimText += transcript;
            }
          }

          /* Acumular texto final e mostrar parcial em tempo real */
          var separator = llSpeechTextBefore.length > 0 ? ' ' : '';
          llSpeechInterim = interimText;

          if (finalText) {
            llSpeechTextBefore = llSpeechTextBefore + separator + finalText;
            separator = ' ';
          }

          /* Atualizar textarea em tempo real */
          ta.value = llSpeechTextBefore + (llSpeechInterim ? separator + llSpeechInterim : '');
          ta.scrollTop = ta.scrollHeight;
        };

        llSpeechRecog.onerror = function (ev) {
          if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
            showToast('⚠', 'Permissao de microfone negada. Habilite nas configuracoes do navegador.', 5000);
          } else if (ev.error === 'no-speech') {
            showToast('⚠', 'Nenhuma fala detectada. Tente novamente.', 3000);
          } else if (ev.error !== 'aborted') {
            showToast('❌', 'Erro de voz: ' + ev.error, 4000);
          }
        };

        llSpeechRecog.onend = function () {
          llSpeechActive = false;
          if (llSpeechTimer) { clearInterval(llSpeechTimer); llSpeechTimer = null; }
          voiceBtn.classList.remove('ll-voice-recording');
          voiceBtn.removeAttribute('data-rec-time');
          voiceBtn.title = 'Gravar audio';

          /* Consolidar texto final (remover parcial) */
          ta.value = llSpeechTextBefore;
          ta.scrollTop = ta.scrollHeight;
          ta.focus();

          var sec = Math.round((Date.now() - llSpeechStart) / 1000);
          if (ta.value.trim().length > (llSpeechTextBefore.length > 0 ? 0 : 0)) {
            showToast('✅', 'Transcricao concluida (' + sec + 's)', 2500);
          }
          llSpeechRecog = null;
        };

        /* Iniciar */
        try {
          llSpeechRecog.start();
        } catch (err) {
          showToast('❌', 'Erro ao iniciar reconhecimento de voz: ' + (err.message || ''), 5000);
        }
      });
    } else if (voiceBtn) {
      /* Navegador sem suporte a Speech Recognition */
      voiceBtn.addEventListener('click', function () {
        showToast('⚠', 'Seu navegador nao suporta reconhecimento de voz. Use Chrome.', 5000);
      });
    }
    fin.addEventListener('change', () => {
      void addComposerFiles(fin.files);
      fin.value = '';
    });

    function handleComposerPasteImages(e) {
      const blobs = clipboardImagesFromPasteEvent(e);
      if (!blobs.length) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        e.stopImmediatePropagation();
      } catch (_) {}
      const files = blobs.map(normalizeIncomingFileForComposer).filter(Boolean);
      if (!files.length) return;
      void addComposerFiles(files);
      showToast(
        '📋',
        files.length === 1
          ? 'Imagem na área de transferência · canal Netuno Lovable'
          : `${files.length} imagens · canal Netuno Lovable`,
        2400
      );
    }

    /** Colar screenshot/imagem só no campo proxy · mesmo fluxo que o drag. */
    ta.addEventListener('paste', (e) => handleComposerPasteImages(e), true);

    async function doComposerSend(context = {}) {
      if (!(await llLicenseHardLockCheck('enviar mensagem'))) return false;
      try { await composerAttachmentMutationQueue; } catch (_) {}
      const txt = normalizeText(ta.value);
      const filesSnap = composerAttachmentList.slice();
      if (!txt && !filesSnap.length) {
        showToast('⚠', 'Escreva algo ou anexe ficheiros.', 3800);
        return false;
      }
      const blocking = composerAttachmentList.some(
        (i) => i.kind === 'imgbb_image' && (i.status === 'uploading' || i.status === 'settling')
      );
      if (blocking) {
        showToast(
          '⏳',
          composerAttachmentList.some((i) => i.kind === 'imgbb_image' && i.status === 'settling')
            ? 'Aguarde «A sincronizar (~8 s)…» passar antes de enviar.'
            : 'Aguarde o carregamento da imagem antes de enviar.',
          3800
        );
        return false;
      }
      sendBtn.setAttribute('data-ll-busy', '1');
      sendBtn.disabled = true;
      let ok = false;
      try {
        ok = await sendPromptWithFiles(txt, filesSnap);
        if (ok) consumeDailyLimit();
      } finally {
        sendBtn.removeAttribute('data-ll-busy');
        syncComposerSendButtonDisabled();
      }
      if (ok) {
        // Remove somente o snapshot enviado; preserva anexos adicionados durante a requisição.
        for (const item of filesSnap) {
          const idx = composerAttachmentList.indexOf(item);
          if (idx >= 0) composerAttachmentList.splice(idx, 1);
        }
        renderComposerAttachments();
        llClearUnifiedComposerDraft(context.editor || findEditor());
        return true;
      }
      return false;
    }

    llComposerSendHandler = doComposerSend;
    ta.addEventListener('input', () => llPersistUnifiedDraft(ta.value));
    sendBtn.addEventListener('click', () => doComposerSend({ source: 'extension-button' }));
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doComposerSend({ source: 'extension-enter' });
      }
    });
  }

  // ─── Init Bubble ─────────────────────────────────────────────────────────────
  function initBubble(user, license) {
    if (document.getElementById('ll-bubble-wrap')) return;

    // Load Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=Nunito:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);

    bubbleEl = buildBubble(user, license);
    document.body.appendChild(bubbleEl);
    syncDockChrome();

    const orb = document.getElementById('ll-orb');
    initDrag(bubbleEl, orb);
    initOutsideClick(bubbleEl);

    document.getElementById('ll-layout-mode-dock')?.addEventListener('click', (e) => {
      e.stopPropagation();
      setPanelLayoutMode('docked');
    });
    document.getElementById('ll-layout-mode-float')?.addEventListener('click', (e) => {
      e.stopPropagation();
      setPanelLayoutMode('float');
    });
    document.getElementById('ll-dock-expand-tab')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openPanel();
    });

    // Panel buttons
    document.getElementById('ll-close-btn').addEventListener('click', (e) => {
      e.stopPropagation(); closePanel();
    });

    document.querySelectorAll('.ll-action-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a) handleAction(a);
      });
    });

    // ─── Context Panel Logic ──────────────────────────────────────────────────
    (function setupContextPanel() {
      const toggleBtn = document.getElementById('ll-context-toggle-btn');
      const panel = document.getElementById('ll-context-panel');
      const textarea = document.getElementById('ll-context-text');
      const clearBtn = document.getElementById('ll-context-clear');
      const fileBtn = document.getElementById('ll-context-file-btn');
      const fileInput = document.getElementById('ll-context-file-input');
      const fileName = document.getElementById('ll-context-file-name');
      const status = document.getElementById('ll-context-status');
      if (!toggleBtn || !panel) return;

      // Toggle panel visibility
      toggleBtn.addEventListener('click', () => {
        const visible = panel.style.display !== 'none';
        panel.style.display = visible ? 'none' : 'block';
        if (!visible && textarea) textarea.focus();
      });

      // Clear context
      if (clearBtn) clearBtn.addEventListener('click', () => {
        if (textarea) textarea.value = '';
        if (fileName) fileName.textContent = '';
        if (status) status.textContent = '';
        panel.classList.remove('ll-context-active');
        llImproveContext = '';
        chrome.storage.local.remove('ll_improve_context');
      });

      // File attach
      if (fileBtn && fileInput) {
        fileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
          const file = fileInput.files[0];
          if (!file) return;
          if (fileName) fileName.textContent = file.name;
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target.result;
            if (textarea) {
              textarea.value = (textarea.value ? textarea.value + '\n\n---\n\n' : '') + content;
            }
            llImproveContext = textarea ? textarea.value : content;
            chrome.storage.local.set({ ll_improve_context: llImproveContext });
            panel.classList.add('ll-context-active');
            if (status) status.textContent = '✓ Contexto carregado (' + file.name + ')';
          };
          reader.readAsText(file);
          fileInput.value = '';
        });
      }

      // Save context on textarea change
      if (textarea) textarea.addEventListener('input', () => {
        llImproveContext = textarea.value.trim();
        chrome.storage.local.set({ ll_improve_context: llImproveContext });
        panel.classList.toggle('ll-context-active', !!llImproveContext);
        if (status) status.textContent = llImproveContext ? '✓ Contexto salvo' : '';
      });

      // Restore context from storage
      chrome.storage.local.get(['ll_improve_context'], (d) => {
        if (d.ll_improve_context) {
          llImproveContext = d.ll_improve_context;
          if (textarea) textarea.value = llImproveContext;
          panel.classList.add('ll-context-active');
          if (status) status.textContent = '✓ Contexto ativo';
        }
      });
    })();

    // ─── Templates panel close ──────────────────────────────────────────────────
    (function initTemplatesPanel() {
      const closeBtn = document.getElementById('ll-templates-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          const p = document.getElementById('ll-templates-panel');
          if (p) p.style.display = 'none';
        });
      }
    })();

    // ─── Histórico init ─────────────────────────────────────────────────────────
    llRenderHistory();

    document.getElementById('ll-upgrade-btn').addEventListener('click', () => {
      chrome.storage.local.get(['ll_upgrade_available', 'll_remote_download_url'], (d) => {
        if (d.ll_upgrade_available && d.ll_remote_download_url) {
          const btn = document.getElementById('ll-upgrade-btn');
          const original = btn ? btn.innerHTML : '';
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = '⏳ Baixando…';
          }
          chrome.runtime.sendMessage({ type: 'LL_DOWNLOAD_UPGRADE' }, () => {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = original || '⬆ Upgrade';
            }
          });
        } else {
          window.open('https://netunolov.com.br', '_blank');
        }
      });
    });
    // ─── Banner de atualização: botões ──────────────────────────────────────────
    document.getElementById('ll-update-banner-btn')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'LL_DOWNLOAD_UPGRADE' }, () => {
        showToast('⬇️', 'Download iniciado!', 3000);
      });
    });
    document.getElementById('ll-update-banner-dismiss')?.addEventListener('click', () => {
      const banner = document.getElementById('ll-update-banner');
      const orbBadge = document.getElementById('ll-orb-update-badge');
      if (banner) banner.classList.add('ll-hidden');
      if (orbBadge) orbBadge.classList.add('ll-hidden');
      // Salva dismiss para essa versão específica
      chrome.storage.local.get(['ll_remote_version'], (d) => {
        if (d.ll_remote_version) {
          chrome.storage.local.set({ ll_update_banner_dismissed_version: d.ll_remote_version });
        }
      });
    });

    document.getElementById('ll-site-btn').addEventListener('click', () => {
      window.open(SITE_URL, '_blank');
    });
    document.getElementById('ll-reconnect-btn')?.addEventListener('click', () => {
      llReconnectLovableSession();
    });
    document.getElementById('ll-logout-btn').addEventListener('click', () => {
      chrome.storage.local.remove(['ll_user', 'll_license']);
      bubbleEl.remove();
      bubbleEl = null;
      showToast('👋', 'Desconectado com sucesso.');
    });

    initComposerPanel();
    refreshImgBbConfiguredCache();
    initPanelSettingsNavigation();

    bubbleEl.style.visibility = 'hidden';
    chrome.storage.local.get([STORAGE_PANEL_LAYOUT, STORAGE_DOCK_COLLAPSED], (s) => {
      panelLayoutMode = s[STORAGE_PANEL_LAYOUT] === 'float' ? 'float' : 'docked';
      dockCollapsed = s[STORAGE_DOCK_COLLAPSED] === true;
      syncDockChrome();

      const panelEl = document.getElementById('ll-panel');

      if (panelLayoutMode === 'docked') {
        if (dockCollapsed) {
          panelOpen = false;
          panelEl?.classList.remove('ll-open');
        } else {
          dockCollapsed = false;
          panelEl?.classList.add('ll-open');
          panelOpen = true;
        }
      } else if (panelEl) {
        panelOpen = false;
        panelEl.classList.remove('ll-open');
      }

      orb.style.transform = panelLayoutMode === 'float' ? 'scale(0)' : 'scale(0)';
      orb.style.transition = 'transform 0.5s cubic-bezier(.34,1.56,.64,1)';
      setTimeout(() => {
        if (panelLayoutMode === 'float') {
          orb.style.display = '';
          orb.style.transform = 'scale(1)';
        }
      }, 120);

      bubbleEl.style.visibility = '';

      refreshPanelStatus();
    });

    refreshPanelStatus();
    initDailyLimitCounter();
  }

  // ─── Remove bubble ───────────────────────────────────────────────────────────
  function removeBubble() {
    if (bubbleEl) { bubbleEl.remove(); bubbleEl = null; }
    const orphan = document.getElementById('ll-bubble-wrap');
    if (orphan) orphan.remove();
  }

  function syncBubbleVisibility() {
    chrome.storage.local.get(['ll_extension_enabled', 'll_user', 'll_license'], (data) => {
      if (data.ll_extension_enabled === false) {
        removeBubble();
        return;
      }
      if (data.ll_license && !document.getElementById('ll-bubble-wrap')) {
        initBubble(data.ll_user, data.ll_license);
      }
    });
  }

  // ─── Message listener (from popup) ──────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LL_LOGOUT') removeBubble();
    if (msg.type === 'LL_AUTH_SUCCESS') {
      /* Login feito no popup → montar bolha imediatamente */
      syncBubbleVisibility();
    }
    if (msg.type === 'LL_ACTION') {
      (async () => {
        if (!(await llLicenseHardLockCheck('executar ação'))) return;
        chrome.storage.local.get(['ll_extension_enabled'], (d) => {
          if (d.ll_extension_enabled === false) return;
          handleAction(msg.action);
        });
      })();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.ll_imgbb_api_key) refreshImgBbConfiguredCache();
    if (changes.ll_extension_enabled || changes.ll_license) syncBubbleVisibility();
    const syncUi =
      changes.ll_extension_svc_status ||
      changes.ll_extension_svc_message ||
      changes.ll_extension_sync_endpoint ||
      changes.ll_remote_version ||
      changes.ll_upgrade_available ||
      changes.ll_remote_download_url ||
      changes.ll_update_banner_dismissed_version;
    if (syncUi && document.getElementById('ll-bubble-wrap')) {
      chrome.storage.local.get(
        [
          'll_extension_svc_status', 'll_extension_svc_message', 'll_extension_sync_endpoint',
          'll_remote_version', 'll_upgrade_available', 'll_remote_download_url',
          'll_update_banner_dismissed_version'
        ],
        (store) => {
          applyExtensionSyncCapsuleUI(store);
          applyBubbleUpgradeFooter(store);
        }
      );
    }
  });

// ─── Boot Robusto ─────────────────────────────────────────────────────────────
function boot() {
  // Verificação de segurança: checa o storage antes de injetar
  chrome.storage.local.get(['ll_extension_enabled'], (data) => {
    if (data.ll_extension_enabled !== false) {
      console.log("Netuno Lovable: Verificado. Tentando injetar bolha...");
      
      // Usa um intervalo para garantir que o body já exista
      const checkInterval = setInterval(() => {
        if (document.body) {
          clearInterval(checkInterval);
          syncBubbleVisibility(); // Sua função original que desenha a bolha
        }
      }, 500);
    }
  });
}

// Escuta o carregamento da página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Monitora mudanças na URL ou no DOM (essencial para SPAs como o Lovable)
let llBootLastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== llBootLastUrl) {
    llBootLastUrl = location.href;
    // Quando navegar, tenta re-injetar se a bolha sumiu
    if (!document.getElementById('ll-bubble-wrap')) {
      boot();
    }
  }
}).observe(document.body || document.documentElement, { childList: true, subtree: true });

  // ─── Expor API para scripts no mesmo isolated world (workbench, etc.) ───────
  try {
    window.__LL_API = {
      sendPrompt: proxySendToLovable,
      sendPromptWithFiles,
      getAuth: getAuthBundle,
      proxyFetch,
      pageFetch: pageContextFetch,
      showToast,
      detectProjectId,
      generateId,
      /** Testar ImgBB a partir da consola: `window.__LL_API.testImgBbFromInput()` ou com File. */
      uploadFileToImgBb,
      testImgBbConfig: llLoadImgBbConfig
    };
  } catch (_) {}

  // Re-check on navigation (SPA)
  let lastUrl = location.href;

  // === LOVIFY LICENSE HARD LOCK V5 ===
  function llShowExpiredLicenseMessage() {
    const msg = '🔒 Licença expirada. Renove sua licença para continuar enviando comandos.';
    try { showToast('🔒', 'Licença expirada. Renove sua licença para continuar enviando comandos.', 6500); } catch (_) {}

    try {
      const old = document.getElementById('lovify-expired-lock-toast');
      if (old) old.remove();
      const box = document.createElement('div');
      box.id = 'lovify-expired-lock-toast';
      box.textContent = msg;
      box.style.cssText = [
        'position:fixed', 'right:22px', 'bottom:92px', 'z-index:2147483647',
        'max-width:360px', 'padding:16px 18px', 'border-radius:14px',
        'background:linear-gradient(135deg,#1a0f2b,#2a0f35)',
        'border:1px solid rgba(236,72,153,.75)', 'box-shadow:0 12px 38px rgba(236,72,153,.35)',
        'color:#fff', 'font:700 14px/1.35 system-ui,-apple-system,Segoe UI,sans-serif',
        'letter-spacing:.1px'
      ].join(';');
      document.documentElement.appendChild(box);
      setTimeout(() => { try { box.remove(); } catch (_) {} }, 6500);
    } catch (_) {
      try { alert(msg); } catch (_) {}
    }
  }

  function llIsLicenseExpiredOrBlockedFromStore(store) {
    return false;
  }

  async function llLicenseHardLockCheck(actionName = 'usar a extensão') {
    return true;
  }
  // === END LOVIFY LICENSE HARD LOCK V5 ===

  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        if (!document.getElementById('ll-bubble-wrap')) syncBubbleVisibility();
        else refreshPanelStatus();
      }, 800);
    }
  }).observe(document, { subtree: true, childList: true });

})();



// ─── Infinity Claude AI — Window Event to Background Bridge (Zero CORS & Context Safe) ───
window.addEventListener("message", function (event) {
  if (event.source !== window || !event.data) return;

  if (event.data.type === "INFINITY_ROUTER_DISPATCH") {
    const payload = event.data.payload || {};

    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
      console.warn("[Infinity AI Bridge] ⚠️ A extensão foi recarregada. Dê F5 nesta página do Lovable para reconectar.");
      window.postMessage({
        type: "INFINITY_RENDER_ROUTER_RESPONSE",
        content: "⚠️ A extensão foi recarregada no navegador. Por favor, atualize a página (F5) para reconectar.",
        isError: true
      }, "*");
      return;
    }

    try {
      chrome.runtime.sendMessage({
        type: "INFINITY_ROUTER_CHAT",
        message: payload.message || payload.prompt,
        projectId: payload.projectId,
        token: payload.token,
        model: payload.model,
        images: payload.images || [],
        sessionHeaders: payload.sessionHeaders
      }, function (response) {
        if (chrome.runtime.lastError) {
          console.warn("[Infinity AI Bridge] Erro de runtime:", chrome.runtime.lastError.message);
          return;
        }

        if (response && (response.success || response.ok)) {
          const aiContent = response.content || "";
          const modelName = response.model || payload.model || "infinity-master-coder";
          
          window.postMessage({
            type: "__INFINITY_CODE_GENERATED__",
            text: aiContent,
            model: modelName
          }, "*");

          if (Array.isArray(response.fileBlocks) && response.fileBlocks.length > 0) {
            window.postMessage({
              type: "INFINITY_EXECUTE_EDIT_CODE_IN_PAGE",
              projectId: payload.projectId,
              changes: response.fileBlocks
            }, "*");
          }
        } else if (response && !response.success) {
          console.warn("[Infinity AI Bridge] Erro ao processar via Router:", response.error);
        }
      });
    } catch (err) {
      console.warn("[Infinity AI Bridge] Erro ao despachar mensagem:", err);
    }
  }
});

window.addEventListener('__INFINITY_DISPATCH_ROUTER__', (event) => {
  const detail = event.detail;
  if (!detail || !detail.requestId) return;

  const { requestId, endpoint, headers, payload } = detail;

  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    window.dispatchEvent(new CustomEvent('__INFINITY_STREAM_CHUNK_' + requestId, {
      detail: { type: 'ERROR', status: 0, detail: 'Dê F5 nesta página para reconectar a extensão.' }
    }));
    return;
  }

  try {
    chrome.runtime.sendMessage({
      type: "INFINITY_ROUTER_CHAT",
      message: (payload && payload.messages && payload.messages.length) ? payload.messages[payload.messages.length - 1].content : "",
      model: payload ? payload.model : "infinity-master-coder",
      payload: payload
    }, (res) => {
      if (chrome.runtime.lastError || !res || (!res.success && !res.ok)) {
        window.dispatchEvent(new CustomEvent('__INFINITY_STREAM_CHUNK_' + requestId, {
          detail: { type: 'ERROR', status: 0, detail: (res && res.error) || 'Erro no Router' }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('__INFINITY_STREAM_CHUNK_' + requestId, {
          detail: { type: 'DONE', fullText: res.content }
        }));
      }
    });
  } catch (err) {
    window.dispatchEvent(new CustomEvent('__INFINITY_STREAM_CHUNK_' + requestId, {
      detail: { type: 'ERROR', status: 0, detail: err.message }
    }));
  }
});

  // ─── Infinity Claude AI: Auto-Apply & Smart Code Injector ───────────────────
  function llExtractCodeBlocks(rawText) {
    const blocks = [];
    if (!rawText || typeof rawText !== 'string') return blocks;
    const text = rawText.replace(/\r\n/g, '\n');

    const re = /```([a-zA-Z0-9_.-]*)[^\n]*\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      let lang = (m[1] || '').trim().toLowerCase();
      let blockCode = (m[2] || '').trim();
      let path = '';

      if (blockCode) {
        const lines = blockCode.split('\n');
        const firstLine = (lines[0] || '').trim();
        const pMatch = firstLine.match(/(?:src\/|components\/|pages\/|lib\/|hooks\/|types\/|supabase\/)[a-zA-Z0-9_./-]+/);
        if (pMatch) {
          path = pMatch[0];
        } else {
          // Detect // FileName.js or // FileName.tsx at top
          const fileComment = firstLine.match(/(?:\/\/|\/\*)\s*([A-Za-z0-9_-]+\.(?:tsx|jsx|ts|js|css|sql))/i);
          if (fileComment && fileComment[1]) {
            const fname = fileComment[1].replace(/\.js$/i, '.tsx');
            path = `src/components/${fname}`;
          } else {
            const compMatch = blockCode.match(/(?:export\s+(?:default\s+)?(?:function|const)|function|const)\s+([A-Z][a-zA-Z0-9]+)/);
            if (compMatch && compMatch[1]) {
              path = `src/components/${compMatch[1]}.tsx`;
            } else if (lang === 'css' || blockCode.includes('@tailwind') || blockCode.includes(':root')) {
              path = 'src/index.css';
            } else if (lang === 'sql' || blockCode.includes('create table') || blockCode.includes('alter table')) {
              path = 'supabase/migrations/schema.sql';
            }
          }
        }
      }

      // Analyze Database & Supabase Queries
      const dbCalls = [];
      const tableMatches = [...blockCode.matchAll(/supabase\.from\(['"]([a-zA-Z0-9_-]+)['"]\)/g)];
      tableMatches.forEach((tm) => { if (tm[1] && !dbCalls.includes(tm[1])) dbCalls.push(tm[1]); });

      const sqlTables = [...blockCode.matchAll(/(?:create\s+table\s+(?:if\s+not\s+exists\s+)?|insert\s+into\s+|update\s+|from\s+)([a-zA-Z0-9_-]+)/gi)];
      sqlTables.forEach((st) => {
        const tName = st[1].toLowerCase();
        if (!['public','auth','select','where','set'].includes(tName) && !dbCalls.includes(tName)) {
          dbCalls.push(tName);
        }
      });

      if (blockCode.length > 15) {
        blocks.push({
          lang: lang || 'tsx',
          path: path || `src/components/Component_${blocks.length + 1}.tsx`,
          code: blockCode,
          lines: blockCode.split('\n').length,
          dbCalls
        });
      }
    }

    if (blocks.length === 0 && text.trim().length > 30) {
      if (text.includes('import ') || text.includes('export ') || text.includes('function ') || text.includes('<div') || text.includes('const ')) {
        const dbCalls = [];
        const tableMatches = [...text.matchAll(/supabase\.from\(['"]([a-zA-Z0-9_-]+)['"]\)/g)];
        tableMatches.forEach((tm) => { if (tm[1] && !dbCalls.includes(tm[1])) dbCalls.push(tm[1]); });

        blocks.push({
          lang: 'tsx',
          path: 'src/components/App.tsx',
          code: text.trim(),
          lines: text.split('\n').length,
          dbCalls
        });
      }
    }

    return blocks;
  }

  function infinityShowToast(icon, msg, duration = 3500) {
    window.showToast = infinityShowToast;
    try {
      let container = document.getElementById('infinity-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'infinity-toast-container';
        container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;';
        document.body.appendChild(container);
      }
      const t = document.createElement('div');
      t.style.cssText = 'background:rgba(15,23,42,0.96);border:1px solid rgba(124,58,237,0.5);color:#f8fafc;padding:12px 18px;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.6);font-size:13px;display:flex;align-items:center;gap:10px;pointer-events:auto;backdrop-filter:blur(12px);transition:opacity 0.25s, transform 0.25s;';
      t.innerHTML = `<span>${icon}</span><span style="font-weight:600;">${msg}</span>`;
      container.appendChild(t);
      setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(10px)';
        setTimeout(() => t.remove(), 280);
      }, duration);
    } catch (_) {}
  }

  // ─── Direct Lovable Chat DOM Injector ─────────────────────────────────────
  function findLovableChatContainer() {
    try {
      const inputEl = document.querySelector('textarea, [contenteditable="true"], .tiptap, .ProseMirror, [data-chat-input]');
      const isInput = (el) => {
        if (!el) return true;
        if (el === inputEl) return true;
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return true;
        if (el.getAttribute('contenteditable') === 'true') return true;
        if (el.classList.contains('ProseMirror') || el.classList.contains('tiptap')) return true;
        if (el.closest('.ProseMirror') || el.closest('.tiptap')) return true;
        return false;
      };

      // 1. Busca por seletores específicos da timeline de mensagens do Lovable
      const timelineSelectors = [
        '.chat-scroll-container',
        '[data-chat-container]',
        '[data-timeline]',
        '[role="log"]',
        '[data-radix-scroll-area-viewport]'
      ];

      for (const sel of timelineSelectors) {
        const found = document.querySelector(sel);
        if (found && !isInput(found) && !found.closest('.monaco-editor')) {
          return found;
        }
      }

      if (inputEl) {
        // Tenta achar dentro do painel lateral mas FORA do composer/form
        const panel = inputEl.closest('aside, [data-panel], div.flex-col.h-full, div.h-screen, div[class*="sidebar"]') || document.body;
        const candidate = panel.querySelector('[data-radix-scroll-area-viewport], [data-chat-container], [data-timeline], [role="log"], div.overflow-y-auto:not(.monaco-scrollable-element)');
        if (candidate && !isInput(candidate)) return candidate;

        // Se o próprio pai ou irmão for scrollable
        let parent = inputEl.parentElement;
        while (parent && parent !== document.body) {
          const scrollableChild = parent.querySelector('[data-radix-scroll-area-viewport], .overflow-y-auto, [role="log"]');
          if (scrollableChild && !scrollableChild.closest('.monaco-editor') && !isInput(scrollableChild)) {
            return scrollableChild;
          }
          parent = parent.parentElement;
        }
      }

      // Busca global por seletores comuns do Lovable
      const candidates = document.querySelectorAll(
        '[data-radix-scroll-area-viewport], [data-chat-container], [data-timeline], [role="log"], main div.flex-1.overflow-y-auto, div.overflow-y-auto'
      );
      for (const c of candidates) {
        if (!c.closest('.monaco-editor') && !c.classList.contains('monaco-scrollable-element') && !isInput(c)) {
          return c;
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  function formatMarkdownResponse(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks with copy and inject buttons
    let blockCounter = 0;
    html = html.replace(/```([a-zA-Z0-9_.-]*)\n([\s\S]*?)```/g, function(_, lang, code) {
      blockCounter++;
      const codeId = `inf-code-snippet-${Date.now()}-${blockCounter}`;
      const rawCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      window[`__code_${codeId}`] = rawCode;

      // Tenta extrair o caminho do arquivo da primeira linha
      let extractedPath = '';
      const firstLine = rawCode.split('\n')[0].trim();
      if (firstLine.startsWith('//') || firstLine.startsWith('/*') || firstLine.startsWith('#')) {
        const pathMatch = firstLine.match(/(?:src\/|components\/|pages\/|lib\/|[a-zA-Z0-9_-]+\.(?:tsx|ts|jsx|js|css|json))/i);
        if (pathMatch) extractedPath = firstLine.replace(/^[/*#\s]+/, '').replace(/[*\/]+$/, '').trim();
      }

      return `
        <div style="margin: 14px 0; border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 10px; overflow: hidden; background: #090d16; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(30, 41, 59, 0.85); border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 11.5px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:13px;">📄</span>
              <span style="color: #38bdf8; font-weight: 700;">${extractedPath || (lang ? lang.toUpperCase() : 'CÓDIGO')}</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="infinity-bubble-btn-copy" data-id="${codeId}" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 4px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; font-weight:600;">📋 Copiar</button>
              <button class="infinity-bubble-btn-inject" data-id="${codeId}" data-path="${extractedPath || ''}" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; padding: 4px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; font-weight: 700; box-shadow:0 2px 8px rgba(16,185,129,0.3);">⚡ Injetar no Editor</button>
            </div>
          </div>
          <pre style="margin: 0; padding: 12px; overflow-x: auto; color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 1.5; max-height: 350px;"><code>${code}</code></pre>
        </div>
      `;
    });

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 style="color:#f8fafc;font-size:14px;font-weight:700;margin:10px 0 4px;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="color:#f8fafc;font-size:15px;font-weight:700;margin:12px 0 6px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="color:#f8fafc;font-size:16px;font-weight:800;margin:14px 0 8px;">$1</h1>');

    // Inline bold & code
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f8fafc;font-weight:600;">$1</strong>');
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);color:#38bdf8;padding:1px 5px;border-radius:4px;font-size:11px;">$1</code>');

    // Bullet points
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-left:16px;list-style-type:disc;color:#cbd5e1;">$1</li>');
    html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li style="margin-left:16px;list-style-type:decimal;color:#cbd5e1;">$1</li>');

    // Line breaks
    html = html.replace(/\n\n/g, '<div style="height:8px;"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  function injectMessageIntoChatDOM(text, model, blocks) {
    try {
      const targetContainer = findLovableChatContainer();
      const formattedHtml = formatMarkdownResponse(text);

      const msgDiv = document.createElement('div');
      msgDiv.className = 'infinity-native-chat-response';
      msgDiv.style.cssText = `
        margin: 16px 8px;
        padding: 16px;
        background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.9));
        border: 1px solid rgba(139, 92, 246, 0.45);
        border-radius: 12px;
        color: #f1f5f9;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.6;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
        position: relative;
        z-index: 10;
        animation: infinityFadeIn 0.3s ease-out;
      `;

      msgDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#10b981; box-shadow:0 0 10px #10b981;"></span>
            <span style="font-weight:700; color:#c4b5fd; font-size:12px;">Infinity Claude AI</span>
            <span style="background:rgba(124,58,237,0.3); border:1px solid rgba(124,58,237,0.5); color:#ddd6fe; padding:1px 6px; border-radius:4px; font-size:10px;">${model || '9Router'}</span>
          </div>
          <span style="color:#10b981; font-size:11px; font-weight:600; background:rgba(16,185,129,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(16,185,129,0.2);">0 Créditos Lovable</span>
        </div>
        <div style="word-break:break-word;">${formattedHtml}</div>
      `;

      // Eventos dos botões de copiar e injetar do balão
      msgDiv.querySelectorAll('.infinity-bubble-btn-copy').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const code = window[`__code_${id}`];
          if (code) {
            try {
              const ta = document.createElement('textarea');
              ta.value = code;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              ta.remove();
            } catch (_) {}
            btn.innerText = '✅ Copiado!';
            setTimeout(() => { btn.innerText = '📋 Copiar'; }, 2000);
          }
        };
      });

      msgDiv.querySelectorAll('.infinity-bubble-btn-inject').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const dataPath = btn.getAttribute('data-path');
          const code = window[`__code_${id}`];
          if (code) {
            window.postMessage({
              type: '__INFINITY_APPLY_CODE_TO_EDITOR__',
              code: code,
              path: dataPath || (blocks && blocks[0] && blocks[0].path) || ''
            }, '*');
            btn.innerText = '⚡ Injetado!';
            setTimeout(() => { btn.innerText = '⚡ Injetar no Editor'; }, 2000);
          }
        };
      });

      if (targetContainer) {
        targetContainer.appendChild(msgDiv);
        targetContainer.scrollTop = targetContainer.scrollHeight;
        console.log("[Infinity Claude AI] 💬 Resposta renderizada visualmente no chat do Lovable!");
      } else {
        // Fallback: anexa no topo do input do chat
        const inputEl = document.querySelector('textarea, [contenteditable="true"], .tiptap, .ProseMirror');
        if (inputEl && inputEl.parentElement) {
          inputEl.parentElement.insertAdjacentElement('beforebegin', msgDiv);
          console.log("[Infinity Claude AI] 💬 Resposta anexada acima da caixa de mensagem!");
        } else {
          document.body.appendChild(msgDiv);
        }
      }
    } catch (e) {
      console.warn("[Infinity Claude AI] Aviso ao renderizar no chat:", e);
    }
  }

  function renderInfinityInspectorDashboard(blocks, fullText, model) {
    let panel = document.getElementById('infinity-inspector-panel');
    if (panel) panel.remove();

    panel = document.createElement('div');
    panel.id = 'infinity-inspector-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: min(94vw, 760px);
      max-height: 85vh;
      background: rgba(10, 15, 29, 0.96);
      border: 1px solid rgba(139, 92, 246, 0.5);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.2);
      backdrop-filter: blur(16px);
      color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: infinityPanelSlideUp 0.3s ease-out;
    `;

    const fileListHtml = blocks.map((b, idx) => `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px;">📄</span>
            <span style="font-weight: 700; color: #38bdf8; font-size: 13px;">${b.path}</span>
            <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 1px 6px; border-radius: 4px; font-size: 10px;">${b.lang}</span>
            <span style="color: #64748b; font-size: 11px;">(${b.lines} linhas)</span>
          </div>
          <button class="infinity-btn-inject-single" data-idx="${idx}" style="background: #10b981; border: none; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>⚡</span> Aplicar no Editor
          </button>
        </div>
        ${(b.dbCalls && b.dbCalls.length > 0) ? `
          <div style="font-size: 11px; color: #a78bfa; margin-top: 4px; display: flex; gap: 6px; align-items: center;">
            <span>🗄️ Tabelas Supabase:</span>
            <span style="background: rgba(167, 139, 250, 0.15); padding: 1px 6px; border-radius: 4px; color: #c4b5fd;">${b.dbCalls.join(', ')}</span>
          </div>
        ` : ''}
      </div>
    `).join('');

    panel.innerHTML = `
      <div style="padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.8);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #7c3aed, #4f46e5); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">⚡</div>
          <div>
            <div style="font-weight: 700; font-size: 14px; color: #fff;">Infinity Inspector & Arquivos Gerados</div>
            <div style="font-size: 11px; color: #94a3b8;">${blocks.length} arquivo(s) gerados via ${model || '9Router'} (0 Créditos Lovable)</div>
          </div>
        </div>
        <button id="infinity-panel-close" style="background: rgba(255,255,255,0.06); border: none; color: #94a3b8; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-size: 14px;">✕</button>
      </div>
      
      <div style="padding: 14px 18px; overflow-y: auto; flex: 1;">
        <div style="margin-bottom: 10px; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Arquivos Prontos para Injeção</div>
        ${fileListHtml}
      </div>

      <div style="padding: 12px 18px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(15, 23, 42, 0.9); display: flex; justify-content: flex-end; gap: 8px;">
        <button id="infinity-btn-copy-all" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #f1f5f9; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
          📋 Copiar Código Completo
        </button>
        <button id="infinity-btn-inject-all" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); border: none; color: white; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);">
          ⚡ Injetar Tudo no Editor
        </button>
      </div>
    `;

    function infinitySafeCopy(text) {
      try {
        if (!text) return;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && document.hasFocus && document.hasFocus()) {
          navigator.clipboard.writeText(text).catch(() => infinityFallbackCopy(text));
        } else {
          infinityFallbackCopy(text);
        }
      } catch (_) {
        infinityFallbackCopy(text);
      }
    }

    function infinityFallbackCopy(text) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        ta.remove();
      } catch (_) {}
    }

    document.body.appendChild(panel);

    // Bind events com verificação segura
    const closeBtn = panel.querySelector('#infinity-panel-close');
    if (closeBtn) closeBtn.onclick = () => panel.remove();

    const copyAllBtn = panel.querySelector('#infinity-btn-copy-all');
    if (copyAllBtn) {
      copyAllBtn.onclick = () => {
        infinitySafeCopy(fullText);
        infinityShowToast('📋', 'Todos os arquivos copiados para a área de transferência!', 2500);
      };
    }

    const injectAllBtn = panel.querySelector('#infinity-btn-inject-all');
    if (injectAllBtn) {
      injectAllBtn.onclick = () => {
        blocks.forEach((b) => {
          window.postMessage({
            type: '__INFINITY_APPLY_CODE_TO_EDITOR__',
            code: b.code,
            path: b.path
          }, '*');
        });
        infinityShowToast('⚡', `${blocks.length} arquivo(s) injetados no editor com sucesso!`, 3500);
      };
    }

    panel.querySelectorAll('.infinity-btn-inject-single').forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-idx'));
        const targetBlock = blocks[idx];
        if (targetBlock) {
          infinitySafeCopy(targetBlock.code);
          window.postMessage({
            type: '__INFINITY_APPLY_CODE_TO_EDITOR__',
            code: targetBlock.code,
            path: targetBlock.path
          }, '*');
          infinityShowToast('⚡', `Código de ${targetBlock.path} injetado no editor & copiado!`, 3500);
        }
      };
    });

    // Auto-dismiss after 60s
    clearTimeout(panel._timer);
    panel._timer = setTimeout(() => { if (panel) panel.remove(); }, 60000);
  }

  // ─── Template Prompt Populator (Apenas para atalhos VIP de usuário) ────────
  function populateUserPromptTemplate(promptText) {
    try {
      if (!promptText) return false;
      const inputs = document.querySelectorAll('textarea, [contenteditable="true"], .tiptap, .ProseMirror, [data-chat-input]');
      let applied = false;

      inputs.forEach((inputEl) => {
        if (inputEl.tagName === 'TEXTAREA') {
          try {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            if (nativeSetter) {
              nativeSetter.call(inputEl, promptText);
            } else {
              inputEl.value = promptText;
            }
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            inputEl.style.height = 'auto';
            inputEl.style.height = Math.min(inputEl.scrollHeight, 400) + 'px';
            inputEl.focus();
            applied = true;
          } catch (_) {
            inputEl.value = promptText;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } else if (inputEl.getAttribute('contenteditable') === 'true' || inputEl.classList.contains('tiptap') || inputEl.classList.contains('ProseMirror')) {
          try {
            inputEl.focus();
            inputEl.innerText = promptText;
            inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: promptText }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            applied = true;
          } catch (_) {}
        }
      });
      return applied;
    } catch (e) {
      return false;
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.type !== '__INFINITY_CODE_GENERATED__') return;
    const { text, model } = event.data;
    const blocks = llExtractCodeBlocks(text);

    console.group('%c 📦 INFINITY CLAUDE AI %c AUDITORIA DE ARQUIVOS E BANCO DE DADOS %c TELEMETRIA ', 'background:#1e1035;color:#c4b5fd;font-weight:bold;', 'background:#7c3aed;color:#fff;font-weight:bold;', 'background:#0f172a;color:#38bdf8;');
    console.log(`%c  ↳ Total de Arquivos Detectados : %c${blocks.length} arquivo(s)`, 'color:#94a3b8;', 'color:#facc15;font-weight:bold;');

    const tableReport = blocks.map((b, idx) => ({
      "Arquivo": b.path,
      "Linguagem": b.lang,
      "Linhas": b.lines,
      "Tabelas DB / Supabase": (b.dbCalls && b.dbCalls.length > 0) ? b.dbCalls.join(', ') : 'Nenhuma'
    }));

    if (tableReport.length > 0) {
      console.table(tableReport);
    }
    console.groupEnd();

    // 1. Limpar e reabilitar a caixa de mensagem para o próximo prompt do usuário
    clearChatInput();
    llForceUnlockChatUI();

    // 2. Renderizar na linha do tempo do chat com visual Infinity Claude AI
    injectMessageIntoChatDOM(text, model, blocks);

    // 3. Renderizar Dashboard Flutuante de Inspeção de Arquivos (com botões de injeção e cópia)
    if (blocks && blocks.length > 0) {
      renderInfinityInspectorDashboard(blocks, text, model);
      infinityShowToast('⚡', `${blocks.length} arquivo(s) gerados! Injetando no editor...`, 4000);
    }

    // 4. DIRECT GITHUB SYNC (Sincronização Dinâmica com o Repositório do Projeto)
    if (blocks && blocks.length > 0) {
      let targetRepo = localStorage.getItem("infinity_github_repo") || "";
      if (!targetRepo) {
        const ghLinks = document.querySelectorAll('a[href*="github.com/"]');
        for (const a of ghLinks) {
          const m = (a.href || '').match(/github\.com\/([^\/]+\/[^\/\?#]+)/i);
          if (m && !m[1].includes('lovable') && !m[1].includes('techstore')) {
            targetRepo = `https://github.com/${m[1].replace(/\.git$/, '')}.git`;
            break;
          }
        }
      }

      const savedToken = localStorage.getItem("infinity_github_token") || "";

      if (targetRepo && savedToken && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'INFINITY_GITHUB_SYNC_FILES',
          files: blocks,
          repoUrl: targetRepo,
          githubToken: savedToken
        }, (res) => {
          if (res && res.ok) {
            const successCount = (res.results || []).filter((r) => r.success).length;
            console.log(`[Infinity Claude AI] 🐙 ${successCount} arquivo(s) sincronizados no GitHub: ${res.owner}/${res.repo}`);
            infinityShowToast('🐙', `GitHub Sync: ${successCount} arquivo(s) commitados no repositório! Lovable atualizando...`, 5000);
          }
        });
      }

      // 5. INJEÇÃO CONTROLADA: Copia o código principal e disponibiliza botões de 1 clique
      if (blocks.length === 1) {
        console.log(`[Infinity Claude AI] ⚡ Injetando código de ${blocks[0].path} no editor...`);
        window.postMessage({
          type: '__INFINITY_APPLY_CODE_TO_EDITOR__',
          code: blocks[0].code,
          path: blocks[0].path
        }, '*');
      } else if (blocks.length > 1) {
        console.log(`[Infinity Claude AI] 📦 ${blocks.length} arquivos gerados. Disponíveis para injeção individual no chat e no painel Inspector.`);
        // Copia o primeiro arquivo para o clipboard por padrão
        window.postMessage({
          type: '__INFINITY_APPLY_CODE_TO_EDITOR__',
          code: blocks[0].code,
          path: blocks[0].path
        }, '*');
      }
    }
  });

  // ─── Infinity UI Unlocker & Smart Composer Bypass ─────────────────────────
  function llForceUnlockChatUI() {
    try {
      let unlockedCount = 0;

      // 1. Remover tooltips ou balões "Lovable is working..." do DOM
      const allTooltips = document.querySelectorAll('[role="tooltip"], [data-radix-popper-content-wrapper], div.fixed, div.absolute');
      allTooltips.forEach((el) => {
        if ((el.textContent || '').includes('Lovable is working')) {
          el.remove();
          unlockedCount++;
        }
      });

      // 2. Destravar todos os botões de envio (inclusive ícones de seta ↑)
      const actionButtons = document.querySelectorAll('button[disabled], button[aria-disabled="true"], button:has(svg), button:has(svg.lucide-arrow-up)');
      actionButtons.forEach((btn) => {
        btn.removeAttribute('disabled');
        btn.setAttribute('aria-disabled', 'false');
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        unlockedCount++;
      });

      // 3. Reabilitar todos os inputs e contenteditables
      const inputs = document.querySelectorAll('textarea, [contenteditable], .tiptap, .ProseMirror');
      inputs.forEach((inp) => {
        inp.removeAttribute('disabled');
        inp.setAttribute('contenteditable', 'true');
        inp.style.pointerEvents = 'auto';
        inp.style.opacity = '1';
        unlockedCount++;
      });

      // 4. Se houver item de Fila bloqueado, clica para disparar ou libera
      const queueButtons = document.querySelectorAll('button:has(svg.lucide-play), [aria-label*="resume"], [aria-label*="play"]');
      queueButtons.forEach((qb) => {
        try { qb.click(); } catch(_) {}
      });
    } catch (_) {}
  }

  // Monitorar continuamente de forma silenciosa para remover qualquer trava residual
  setInterval(llForceUnlockChatUI, 1000);

  // ─── Smart Enter Key & Click Fallback Dispatcher ───────────────────────────
  function getChatInputText() {
    const activeEl = document.querySelector('textarea, [contenteditable="true"], .tiptap, .ProseMirror');
    if (!activeEl) return '';
    if (activeEl.tagName === 'TEXTAREA') return activeEl.value.trim();
    return (activeEl.innerText || activeEl.textContent || '').trim();
  }

  function clearChatInput() {
    const activeEl = document.querySelector('textarea, [contenteditable="true"], .tiptap, .ProseMirror');
    if (!activeEl) return;
    if (activeEl.tagName === 'TEXTAREA') {
      activeEl.value = '';
      activeEl.dispatchEvent(new Event('input', { bubbles: true }));
      activeEl.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      activeEl.innerText = '';
      activeEl.innerHTML = '<p><br></p>';
      activeEl.dispatchEvent(new Event('input', { bubbles: true }));
      activeEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function detectCurrentProjectId() {
    const m = window.location.href.match(/projects\/([a-zA-Z0-9_-]+)/i);
    return (m && m[1]) || 'a3684235-1782-4a8a-94d4-41deb8cb035b';
  }

  function isGeneratedAssistantText(txt) {
    if (!txt) return false;
    return txt.includes('```') || txt.includes('// src/') || txt.includes('### 1.') || txt.includes('### 2.');
  }

  function dispatchDirectPrompt(text) {
    if (!text || text.length < 2 || isGeneratedAssistantText(text)) return;
    console.log('[Infinity Claude AI] ⚡ Disparando envio direto via Smart Composer Bypass:', text.slice(0, 80));
    try {
      window.postMessage({ type: '__INF_SET_USER_PROMPT__', prompt: text }, '*');
    } catch (_) {}
    clearChatInput();
    llForceUnlockChatUI();

    // Remover qualquer caixa de fila pendente do DOM de forma segura
    try {
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach((q) => {
        const txt = (q.textContent || '').trim();
        if (txt.includes('Fila') && (txt.includes('1') || txt.includes('2')) && q.children.length > 0 && q.children.length < 6) {
          const btnClose = q.querySelector('button');
          if (btnClose) btnClose.click();
          q.remove();
        }
      });
    } catch (_) {}

    const pid = detectCurrentProjectId();
    const headers = { 'Content-Type': 'application/json' };
    if (window.__INFINITY_CAPTURED_TOKEN__) {
      headers['Authorization'] = `Bearer ${window.__INFINITY_CAPTURED_TOKEN__}`;
    }

    window.fetch(`https://api.lovable.dev/projects/${pid}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: text, prompt: text, content: text })
    }).catch(() => {});
  }

  // Interceptar tecla Enter para envio garantido
  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const isInput = target && (target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true' || target.classList.contains('tiptap') || target.classList.contains('ProseMirror'));
    if (isInput) {
      const currentText = getChatInputText();
      if (currentText && currentText.length >= 2) {
        window.postMessage({ type: '__INF_SET_USER_PROMPT__', prompt: currentText }, '*');
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (!isInput) return;

      const text = getChatInputText();
      if (!text || text.length < 2) return;

      const isStuckWorking = document.body.innerText.includes('Lovable is working') || document.querySelector('[data-radix-popper-content-wrapper]') !== null;
      if (isStuckWorking) {
        e.preventDefault();
        e.stopPropagation();
        dispatchDirectPrompt(text);
      }
    }
  }, true);

  // Interceptar clique no botão de envio (seta para cima)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button:has(svg.lucide-arrow-up), button:has(svg), button[type="submit"]');
    if (!btn) return;

    const isNearChatInput = btn.closest('form, div:has(textarea), div:has([contenteditable]), aside, [data-panel]');
    if (!isNearChatInput) return;

    const text = getChatInputText();
    if (text && text.length >= 2) {
      window.postMessage({ type: '__INF_SET_USER_PROMPT__', prompt: text }, '*');
    }

    const isStuckWorking = document.body.innerText.includes('Lovable is working') || btn.getAttribute('disabled') !== null || btn.getAttribute('aria-disabled') === 'true';

    if (text && text.length >= 2 && isStuckWorking) {
      e.preventDefault();
      e.stopPropagation();
      dispatchDirectPrompt(text);
    }
  }, true);

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === '__INFINITY_UNLOCK_CHAT_UI__') {
      llForceUnlockChatUI();
      setTimeout(llForceUnlockChatUI, 300);
      setTimeout(llForceUnlockChatUI, 800);
      setTimeout(llForceUnlockChatUI, 1600);
    }
  });

  // ─── Infinity VIP Prompt Templates & Toolbar ──────────────────────────────
  const INFINITY_VIP_TEMPLATES = [
    {
      icon: "🎨",
      label: "Redesign UI/UX",
      prompt: "## Redesign Profissional de Aplicação Web - Foco em Estética, Animações e UI/UX\n\n**Objetivo:** Transformar a interface em uma experiência ultra-moderna, estética e fluida com alto padrão de design.\n\n**Requisitos:**\n1. Cores e Tipografia: Paleta harmoniosa HSL em Dark Mode com acentos vibrantes e tipografia moderna (Inter/Outfit).\n2. Estética: Glassmorphism refinado, sombras suaves multicamadas e bordas sutis.\n3. Micro-interações: Hover states táteis, transições suaves (Framer Motion / Tailwind transitions) e feedback imediato.\n4. Responsividade total: Perfeita adaptação mobile e desktop."
    },
    {
      icon: "🎯",
      label: "Fix Error & Auditoria",
      prompt: "## Solicitação de Auditoria Completa e Correção de Erro\n\n**Objetivo:** Identificar a causa raiz do problema atual, corrigir o código com precisão e implementar proteções contra falhas futuras.\n\n**Instruções:**\n1. Analisar logs de console e fluxo de dados.\n2. Isolar o componente com falha e tratar casos de valores nulos/indefinidos.\n3. Validar tipagens TypeScript estritas e chamadas de API assíncronas.\n4. Entregar o código corrigido completo com testes de validação."
    },
    {
      icon: "💾",
      label: "Migrar p/ Supabase",
      prompt: "## Migração e Arquitetura Completa de Banco de Dados: Supabase\n\n**Objetivo:** Estruturar tabelas, relacionamentos, políticas de segurança RLS (Row Level Security) e migrações no Supabase.\n\n**Requisitos:**\n1. Criar tabelas com UUIDs, chaves primárias e relacionamentos com integridade referencial (ON DELETE CASCADE).\n2. Habilitar RLS em todas as tabelas com políticas declarativas por `auth.uid()`.\n3. Implementar triggers para `updated_at` automático.\n4. Gerar código TypeScript para integração com `@supabase/supabase-js`."
    },
    {
      icon: "💫",
      label: "Transições Suaves",
      prompt: "## Implementação de Transições de Página e Animações Fluidas\n\n**Objetivo:** Desenvolver transições de rota e animações de componentes fluidas a 60fps.\n\n**Funcionalidades:**\n1. Transições suaves de entrada e saída (Fade, Slide, Scale) entre páginas.\n2. Animação de listas com Staggered children.\n3. Feedback tátil em botões e modais com entrada suave."
    }
  ];

  function renderInfinityQuickToolbar() {
    try {
      const showTemplates = localStorage.getItem("infinity_show_templates") === "true";
      const existingBar = document.getElementById('infinity-vip-quickbar');

      // Se desativado, remove do DOM imediatamente para manter o visual limpo apenas com Glow
      if (!showTemplates) {
        if (existingBar) existingBar.remove();
        return;
      }

      const composer = document.querySelector('form, div:has(> textarea), div:has(> [contenteditable]), aside, [data-panel]');
      if (!composer || existingBar) return;

      const bar = document.createElement('div');
      bar.id = 'infinity-vip-quickbar';
      bar.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        margin-bottom: 6px;
        overflow-x: auto;
        white-space: nowrap;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(139, 92, 246, 0.35);
        border-radius: 10px;
        backdrop-filter: blur(8px);
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 50;
      `;

      const badge = document.createElement('div');
      badge.style.cssText = 'font-size:11px; font-weight:700; color:#c4b5fd; display:flex; align-items:center; gap:4px; margin-right:4px;';
      badge.innerHTML = '<span>⚡</span> <span>VIP Templates:</span>';
      bar.appendChild(badge);

      INFINITY_VIP_TEMPLATES.forEach((tpl) => {
        const btn = document.createElement('button');
        btn.style.cssText = `
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s ease;
        `;
        btn.innerHTML = `<span>${tpl.icon}</span> <span>${tpl.label}</span>`;
        btn.onmouseover = () => { btn.style.background = 'rgba(124, 58, 237, 0.3)'; btn.style.borderColor = '#a78bfa'; };
        btn.onmouseout = () => { btn.style.background = 'rgba(255, 255, 255, 0.06)'; btn.style.borderColor = 'rgba(255, 255, 255, 0.12)'; };
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          populateUserPromptTemplate(tpl.prompt);
          infinityShowToast(tpl.icon, `Template "${tpl.label}" pronto para envio!`, 2500);
        };
        bar.appendChild(btn);
      });

      // Botão Deep Clean Cache
      const cleanBtn = document.createElement('button');
      cleanBtn.style.cssText = `
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #34d399;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
      `;
      cleanBtn.innerHTML = '<span>🧹</span> <span>Limpar Cache</span>';
      cleanBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        cleanBtn.innerHTML = '<span>⏳</span> <span>Limpando…</span>';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'INFINITY_DEEP_CLEAN' }, (res) => {
            cleanBtn.innerHTML = '<span>🧹</span> <span>Limpar Cache</span>';
            infinityShowToast('🧹', 'Cache do Lovable & Vite limpo com sucesso!', 3000);
          });
        }
      };
      bar.appendChild(cleanBtn);

      const targetInput = document.querySelector('textarea, [contenteditable="true"], .tiptap, .ProseMirror');
      if (targetInput && targetInput.parentElement) {
        targetInput.parentElement.insertAdjacentElement('beforebegin', bar);
      }
    } catch (_) {}
  }

  // Listener para atualização de opções de UI em tempo real
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'INFINITY_UPDATE_UI_SETTINGS') {
        try {
          if (msg.showTemplates !== undefined) {
            localStorage.setItem('infinity_show_templates', msg.showTemplates ? 'true' : 'false');
            const bar = document.getElementById('infinity-vip-quickbar');
            if (!msg.showTemplates && bar) bar.remove();
            else if (msg.showTemplates) renderInfinityQuickToolbar();
          }
          if (msg.showGlow !== undefined) {
            localStorage.setItem('infinity_show_glow', msg.showGlow ? 'true' : 'false');
            const glowStyles = document.getElementById('infinity-glow-styles');
            if (!msg.showGlow && glowStyles) glowStyles.disabled = true;
            else if (glowStyles) glowStyles.disabled = false;
          }
        } catch (_) {}
      }
    });
  }

  // Sincroniza do storage local na inicialização
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['infinity_show_templates', 'infinity_show_glow'], (res) => {
      if (res) {
        try {
          if (res.infinity_show_templates !== undefined) {
            localStorage.setItem('infinity_show_templates', res.infinity_show_templates ? 'true' : 'false');
          }
          if (res.infinity_show_glow !== undefined) {
            localStorage.setItem('infinity_show_glow', res.infinity_show_glow ? 'true' : 'false');
          }
        } catch (_) {}
      }
    });
  }

  setInterval(renderInfinityQuickToolbar, 2000);
