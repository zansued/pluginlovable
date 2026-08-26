/**
 * Nexus PRO — Loader v1.1 (payload.js)  [PATCH 20.5.8]
 * ----------------------------------------------------
 * MUDANÇA CENTRAL vs 20.5.5: instala um GUARD SÍNCRONO de fetch/XHR/sendBeacon
 * no TOPO deste arquivo — que já roda blocking @ document_start (prepend por
 * content.js). Isso captura window.fetch ANTES de qualquer bundle da página
 * (fecha H1) e é FAIL-CLOSED: enquanto o core não registrar seu handler, todo
 * POST de chat do Lovable é segurado e, no timeout, BLOQUEADO com erro claro —
 * nunca passa direto consumindo créditos Lovable (fecha H4).
 *
 * O core (nexus-pro-core-1.0.js) passa a REGISTRAR seu interceptor via
 * window.__nexusRegisterCore(handler) em vez de sobrescrever window.fetch.
 */
(function () {
  "use strict";

  if (window.__nexus_pro_loader_executed) return;
  window.__nexus_pro_loader_executed = true;

  // [PATCH 20.5.9] content.js publica version/coreUrl como data-* em <html>
  // porque o CSP do Lovable bloqueia inline <script>. Materializamos aqui os
  // globals que o restante do bundle (e o extensao-login) já consomem.
  try {
    var __nx_root = document.documentElement;
    if (__nx_root && __nx_root.getAttribute) {
      var __nx_v = __nx_root.getAttribute("data-nexus-ext-version");
      if (__nx_v) {
        if (!window.__NEXUS_EXT_VERSION__) window.__NEXUS_EXT_VERSION__ = __nx_v;
        if (!window.__NEXUS_PRO_VERSION__) window.__NEXUS_PRO_VERSION__ = __nx_v;
      }
      var __nx_cu = __nx_root.getAttribute("data-nexus-core-url");
      if (__nx_cu && !window.__NEXUS_CORE_URL__) window.__NEXUS_CORE_URL__ = __nx_cu;
    }
  } catch (_) {}

  // =====================================================================
  // (1) GUARD SÍNCRONO — instalado IMEDIATAMENTE, antes de qualquer await.
  // =====================================================================
  (function installNexusGuard() {
    if (window.__NEXUS_GUARD_INSTALLED__) return;
    window.__NEXUS_GUARD_INSTALLED__ = true;

    var LOVABLE_HOST_RE = /(^|\.)(lovable\.dev|lovable\.app|lovableproject\.com)$/i;
    var CHAT_URL_RE = /\/(?:v\d+\/)?projects\/[^/]+\/(?:chat|chat-stream|messages)(\/|\?|$|#|-)/i;
    // Rotas que casam a regex mas NÃO são envio de comando (não gastam
    // crédito): precisam passar direto, senão quebramos a UI do Lovable.
    var CHAT_CONTROL_RE = /\/(?:cancel|stop|abort|queue\/status|read|seen|typing|feedback|reactions?|retry-status)(\/|\?|$|#)/i;
    var TOOLS_RESPOND_RE = /\/tools\/respond(\/|\?|$|#)/i;

    var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    var coreHandler = null;                 // interceptor real do core
    var coreReady = false;
    var timedOut = false;
    var GUARD_TIMEOUT_MS = 20000;           // core não subiu → fail-closed
    // [PATCH 20.5.12] Diagnóstico de carregamento do core. Sem isto, todo
    // evento chegava como "core_never_loaded" sem dizer QUAL url falhou —
    // impossível separar CSP (script-src 'self' barrando o remoto) de falha
    // do resource local. Agora o beacon carrega o rastro completo.
    window.__NEXUS_CORE_DIAG__ = { attempts: [], resolved: null };
    var LOG_EP = "https://iuvzpvhaxlrbwaitizci.supabase.co/functions/v1/log-dispatch-interception";

    function monitorIntendedOn() {
      if (window.__NEXUS_MONITOR__ === false) return false;
      try { if (localStorage.getItem("nexus_monitor_enabled") === "0") return false; } catch (_) {}
      return true; // default ON (mesma regra do core/loader)
    }
    function killSwitchOn() {
      try { return localStorage.getItem("nexus_intercept_hard_kill") === "1"; } catch (_) { return false; }
    }
    function isChatDispatch(url, method) {
      try {
        var u = new URL(url, location.href);
        if (!LOVABLE_HOST_RE.test(u.hostname)) return false;
        if (String(method || "GET").toUpperCase() !== "POST") return false;
        if (CHAT_CONTROL_RE.test(u.pathname)) return false;
        return CHAT_URL_RE.test(u.href) || TOOLS_RESPOND_RE.test(u.href);
      } catch (_) { return false; }
    }
    function __nxProjectId(u) {
      try {
        var m = String(u || location.href).match(/\/projects\/([0-9a-f-]{8,})/i);
        return m ? m[1] : null;
      } catch (_) { return null; }
    }
    function beacon(reason, url) {
      // Contrato da edge function log-dispatch-interception: status ∈ conjunto
      // permitido + last_error/metadata para o detalhe. Transporte alternativo
      // (XHR/beacon) = guard_bypassed; demais bloqueios = guard_blocked.
      try {
        var isBypass = (reason === "xhr_chat_dispatch" || reason === "sendbeacon_chat_dispatch");
        var body = JSON.stringify({
          status: isBypass ? "guard_bypassed" : "guard_blocked",
          license_key: window.__NEXUS_LICENSE_KEY__ || null,
          project_id: __nxProjectId(url),
          last_error: String(reason).slice(0, 200),
          metadata: {
            reason: reason,
            url: String(url).slice(0, 300),
            href: location.href.slice(0, 200),
            ua: navigator.userAgent,
            core_diag: window.__NEXUS_CORE_DIAG__ || null,
            ext_version: window.__NEXUS_EXT_VERSION__ || "?"
          }
        });
        if (nativeFetch) nativeFetch(LOG_EP, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: body, keepalive: true, mode: "cors"
        }).catch(function () {});
      } catch (_) {}
    }
    var __nxToastAt = 0;
    function showGuardToast() {
      // Única mudança de UI permitida: expor a falha de interceptação. Toast
      // mínimo e autossuficiente — roda mesmo se o core nunca carregar.
      try {
        var now = Date.now();
        if (now - __nxToastAt < 8000) return; // dedup 8s
        __nxToastAt = now;
        var host = document.body || document.documentElement;
        if (!host) return;
        var el = document.createElement("div");
        el.setAttribute("data-nexus-guard-toast", "1");
        el.style.cssText = [
          "position:fixed", "z-index:2147483647", "right:16px", "bottom:16px",
          "max-width:340px", "background:#1b1030", "color:#fff",
          "border:1px solid #7c3aed", "border-radius:12px",
          "padding:12px 14px", "font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif",
          "box-shadow:0 8px 24px rgba(0,0,0,.4)"
        ].join(";");
        el.innerHTML =
          '<b style="color:#a78bfa">Nexus PRO — interceptação indisponível</b><br>' +
          'Seu comando <b>NÃO</b> foi enviado ao Lovable (para não gastar créditos). ' +
          'Recarregue a página (F5) e tente de novo.';
        host.appendChild(el);
        setTimeout(function () { try { el.remove(); } catch (_) {} }, 9000);
      } catch (_) {}
    }

    function blockedResponse(reason) {
      // 409 com corpo Nexus + toast visível. O core, se carregar, também
      // reescreve isto via nxReportError(guard_blocked).
      showGuardToast();
      return new Response(
        JSON.stringify({ ok: false, blocked: true, nexus_guard: true, reason: reason }),
        { status: 409, headers: {
            "content-type": "application/json; charset=utf-8",
            "x-nexus-guard": "blocked", "cache-control": "no-store" } }
      );
    }

    // API para o core registrar seu interceptor quando carregar.
    window.__nexusRegisterCore = function (handler) {
      coreHandler = (typeof handler === "function") ? handler : null;
      coreReady = !!coreHandler;
      return coreReady;
    };
    window.__nexusGuardState = function () {
      return { coreReady: coreReady, timedOut: timedOut, native: !!nativeFetch };
    };
    window.__nexusNativeFetch = nativeFetch; // core usa esta ref, nunca window.fetch

    setTimeout(function () { if (!coreReady) { timedOut = true; } }, GUARD_TIMEOUT_MS);

    // ---- fetch guard ----
    window.fetch = async function nexusGuardFetch(input, init) {
      // [W2] Parsing defensivo: polyfills/Proxy podem quebrar `instanceof`,
      // e aí `String(input)` virava "[object Object]" → isChatDispatch=false
      // → bypass silencioso. Usamos duck-typing (.url/.href) antes do cast.
      var url = "";
      try {
        if (input && typeof input === "object" && typeof input.url === "string") url = input.url;
        else if (input && typeof input === "object" && typeof input.href === "string") url = input.href;
        else url = String(input);
      } catch (_) { url = ""; }
      var method = (init && init.method)
        || (input && typeof input === "object" && typeof input.method === "string" ? input.method : "GET");

      if (coreReady && coreHandler) {
        try { return await coreHandler(input, init, nativeFetch); }
        catch (e) {
          if (isChatDispatch(url, method) && monitorIntendedOn() && !killSwitchOn()) {
            beacon("core_handler_threw", url); return blockedResponse("core_handler_error");
          }
          return nativeFetch(input, init);
        }
      }

      // Core ainda não pronto:
      if (isChatDispatch(url, method) && monitorIntendedOn() && !killSwitchOn()) {
        if (timedOut) { beacon("core_never_loaded", url); return blockedResponse("core_timeout"); }
        var waited = 0;
        while (!coreReady && waited < GUARD_TIMEOUT_MS) {
          await new Promise(function (r) { setTimeout(r, 60); }); waited += 60;
        }
        if (coreReady && coreHandler) {
          try { return await coreHandler(input, init, nativeFetch); }
          catch (_) { beacon("core_handler_threw_late", url); return blockedResponse("core_handler_error"); }
        }
        beacon("core_load_timeout", url);
        return blockedResponse("core_timeout");
      }

      return nativeFetch(input, init); // demais requests: passthrough nativo
    };

    // ---- XHR guard (Lovable pode usar/fallback XHR) ----
    var NativeXHR = window.XMLHttpRequest;
    if (NativeXHR && NativeXHR.prototype) {
      var origOpen = NativeXHR.prototype.open;
      var origSend = NativeXHR.prototype.send;
      NativeXHR.prototype.open = function (method, url) {
        this.__nx_method = method; this.__nx_url = url;
        return origOpen.apply(this, arguments);
      };
      NativeXHR.prototype.send = function () {
        // [W2] Fail-closed SEMPRE — antes só bloqueávamos com o core offline,
        // então um POST de chat via XHR com o core ativo ia direto ao Lovable
        // (crédito consumido, zero telemetria). O interceptor do core só cobre
        // fetch; XHR de envio de comando é sempre abortado + avisado.
        if (isChatDispatch(this.__nx_url, this.__nx_method)
            && monitorIntendedOn() && !killSwitchOn()) {
          beacon("xhr_chat_dispatch", this.__nx_url);
          showGuardToast();
          try { this.abort(); } catch (_) {}   // fail-closed: nunca chega ao Lovable
          return;
        }
        return origSend.apply(this, arguments);
      };
    }

    // ---- sendBeacon guard ----
    if (navigator.sendBeacon) {
      var origBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (url, data) {
        if (isChatDispatch(url, "POST")
            && monitorIntendedOn() && !killSwitchOn()) {
          beacon("sendbeacon_chat_dispatch", url);
          showGuardToast();
          return false; // bloqueia
        }
        return origBeacon(url, data);
      };
    }
  })();

  // =====================================================================
  // (2) Boot original — token, login shell, injeção do core.
  //     Core agora é LOCAL (web_accessible_resource) quando disponível.
  // =====================================================================
  // [W2] Subframes de lovable.dev recebem SOMENTE o guard de rede (acima).
  // Sem isto, um POST de chat disparado de dentro de um iframe escapava por
  // completo da interceptação. A UI/sidebar e o core continuam exclusivos do
  // top frame (evita duplicação de sidebar — patch 20.5.11).
  var __nxIsTopFrame = true;
  try { __nxIsTopFrame = (window.top === window.self); } catch (_) { __nxIsTopFrame = false; }
  if (!__nxIsTopFrame) {
    try { console.log("%c[NexusPRO]", "color:#7c3aed;font-weight:bold", "subframe — guard de rede ativo, UI/core ignorados"); } catch (_) {}
    return;
  }

  var REMOTE_CORE_URL = "https://nexxus-pro.online/_dist/nexus-pro-core-1.0.js";
  var REMOTE_LOGIN_URL = "https://nexxus-pro.online/_dist/extensao-login.js";
  var SUPABASE_URL = "https://iuvzpvhaxlrbwaitizci.supabase.co";
  var BUCKET_BASE_URL = SUPABASE_URL + "/storage/v1/object/public/extensions/";
  var BUCKET_CORE_URL = BUCKET_BASE_URL + "nexus-pro-core-1.0.js";
  var BUCKET_LOGIN_URL = BUCKET_BASE_URL + "extensao-login.js";
  var SUPABASE_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnpwdmhheGxyYndhaXRpemNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDcwNjQsImV4cCI6MjA4NzI4MzA2NH0.sFaui5qD51IdYLIYV4cAFKBdGKLkqmQu8h5K5NKEs_4";
  var EXT_VERSION = window.__NEXUS_EXT_VERSION__ || "20.6.1";
  var TOKEN_KEY = "lovable_pro_license";
  var MONITOR_KEY = "nexus_monitor_enabled";

  // [PATCH 20.6.0] Capacidade de limpeza profunda (chrome.browsingData via
  // service worker). Publicada como global para o core decidir entre deep
  // clean e o fallback legado sem depender da versão string.
  try {
    if (document.documentElement &&
        document.documentElement.getAttribute("data-nexus-ext-deepclean") === "1") {
      window.__NEXUS_DEEPCLEAN__ = true;
    }
  } catch (_) {}

  var currentScript = document.currentScript;
  var baseUrl = "";
  if (currentScript && currentScript.src) baseUrl = currentScript.src.replace(/[^/]*$/, "");

  function log() {
    try { console.log.apply(console, ["%c[NexusPRO]", "color:#7c3aed;font-weight:bold"].concat([].slice.call(arguments))); } catch (_) {}
  }

  function loadLoginShell() {
    try { window.__NEXUS_EXT_VERSION__ = EXT_VERSION; } catch (_) {}
    // [PATCH 20.6.1] Site primeiro; bucket público do Supabase como 2ª origem.
    var bust = "?v=" + EXT_VERSION + "&t=" + Math.floor(Date.now() / 60000);
    function inject(url, onFail) {
      var script = document.createElement("script");
      script.src = url;
      script.onerror = onFail;
      (document.head || document.documentElement).appendChild(script);
    }
    inject(REMOTE_LOGIN_URL + bust, function () {
      log("login shell indisponível no site — tentando bucket");
      inject(BUCKET_LOGIN_URL + bust, function () { log("login shell não encontrado"); });
    });
  }

  function exposeGlobals(licenseKey) {
    try {
      window.__NEXUS_LICENSE_KEY__ = licenseKey;
      window.__NEXUS_SUPABASE_URL__ = SUPABASE_URL;
      window.__NEXUS_SUPABASE_ANON__ = SUPABASE_ANON;
      window.__NEXUS_PRO_VERSION__ = EXT_VERSION;
      var saved = null;
      try { saved = localStorage.getItem(MONITOR_KEY); } catch (_) {}
      if (saved === null || saved === undefined) {
        window.__NEXUS_MONITOR__ = true;
        try { localStorage.setItem(MONITOR_KEY, "1"); } catch (_) {}
      } else {
        window.__NEXUS_MONITOR__ = saved === "1";
      }
      window.__nexus_setMonitor = function (on) {
        var v = !!on;
        window.__NEXUS_MONITOR__ = v;
        try { localStorage.setItem(MONITOR_KEY, v ? "1" : "0"); } catch (_) {}
        log("monitor:", v ? "ON" : "OFF");
        return v;
      };
    } catch (e) { log("falha ao expor globals:", e && e.message); }
  }

  function injectCore() {
    // [PATCH 20.5.12] Cadeia de tentativas com verificação de REGISTRO, não só
    // de load. Antes bastava o <script> disparar onload para considerarmos o
    // core "ok"; se o bundle carregasse mas nunca chamasse __nexusRegisterCore
    // (erro de parse/exception no topo), o guard ficava fail-closed até o
    // timeout e o usuário via "interceptação indisponível" sem qualquer pista.
    var diag = window.__NEXUS_CORE_DIAG__ || (window.__NEXUS_CORE_DIAG__ = { attempts: [], resolved: null });

    // [PATCH 20.5.23] 100% REMOTO — nenhum core empacotado. O bundle vem
    // sempre de /_dist (cache-bust por minuto). Sem fallback local: assim
    // nenhuma instalação fica congelada numa cópia antiga do core. Em caso de
    // falha de rede/CSP tentamos novamente (backoff curto), mantendo o guard
    // fail-closed enquanto o core não registrar.
    // [PATCH 20.6.1] Duas tentativas no site (1ª origem) e duas no bucket
    // público do Supabase (espelho sincronizado a cada 2 min). O laço antigo
    // repetia a MESMA URL 3x — inútil quando o host inteiro cai.
    var cacheBust = "?v=" + EXT_VERSION + "&t=" + Math.floor(Date.now() / 60000);
    var chain = [
      { kind: "remote",         url: REMOTE_CORE_URL + cacheBust },
      { kind: "remote_retry_1", url: REMOTE_CORE_URL + cacheBust + "&r=1" },
      { kind: "bucket",         url: BUCKET_CORE_URL + cacheBust },
      { kind: "bucket_retry_1", url: BUCKET_CORE_URL + cacheBust + "&r=1" },
    ];

    var REGISTER_GRACE_MS = 4000; // tempo p/ o bundle avaliar e registrar
    var i = 0;

    function coreRegistered() {
      try {
        var st = window.__nexusGuardState && window.__nexusGuardState();
        return !!(st && st.coreReady);
      } catch (_) { return false; }
    }

    function next(reason) {
      if (reason) diag.attempts.push(reason);
      if (coreRegistered()) return;
      if (i >= chain.length) {
        log("core não registrou por nenhuma fonte — guard permanece fail-closed", diag.attempts);
        return;
      }
      var step = chain[i++];
      var s = document.createElement("script");
      s.src = step.url;
      s.async = false;
      s.onerror = function () {
        // Sintoma clássico de CSP (script-src 'self') no caminho remoto.
        next(step.kind + "_script_error");
      };
      s.onload = function () {
        try { this.remove(); } catch (_) {}
        setTimeout(function () {
          if (coreRegistered()) {
            diag.resolved = step.kind;
            diag.attempts.push(step.kind + "_registered");
            log("core ativo via", step.kind);
          } else {
            next(step.kind + "_loaded_but_not_registered");
          }
        }, REGISTER_GRACE_MS);
      };
      try {
        (document.head || document.documentElement).appendChild(s);
      } catch (e) {
        next(step.kind + "_append_failed");
      }
    }

    next(null);
  }

  function boot(token) {
    if (!token) { loadLoginShell(); watchSpaNavigation(); return; }
    exposeGlobals(token);
    injectCore();
  }

  // [PATCH 20.5.11] lovable.dev é SPA: o content script só roda no load inicial.
  // Ao navegar (pushState/replaceState/popstate) o React pode descartar o nó do
  // widget de ativação, fazendo parecer que a UI só existe em /dashboard.
  // Aqui pedimos o remount a cada troca de rota.
  var __nxSpaWatched = false;
  function watchSpaNavigation() {
    if (__nxSpaWatched) return;
    __nxSpaWatched = true;
    function remount() {
      setTimeout(function () {
        try {
          if (document.getElementById("custom-api-chat-widget")) return;
          if (typeof window.__nexusRemountLogin === "function") window.__nexusRemountLogin();
          else loadLoginShell();
        } catch (_) {}
      }, 300);
    }
    try {
      ["pushState", "replaceState"].forEach(function (m) {
        var orig = history[m];
        if (typeof orig !== "function") return;
        history[m] = function () {
          var r = orig.apply(this, arguments);
          remount();
          return r;
        };
      });
      window.addEventListener("popstate", remount);
    } catch (_) {}
  }

  window.addEventListener("message", function (event) {
    if (!event.data || event.source !== window) return;
    if (event.data.type === "NEXXUS_TOKEN_READY") boot(event.data.token || null);
  });

  window.postMessage({ type: "NEXXUS_CHECK_TOKEN" }, "*");
})();
