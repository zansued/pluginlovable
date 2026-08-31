// Extension Login Shell v3.0
// Clean white-label login widget — no branding.
(function () {
  if (document.getElementById("custom-api-chat-widget")) return;

  // Fonte única da versão: o manifest da extensão.
  //  1) window.__NEXUS_EXT_VERSION__ — publicado por content.js/payload.js a
  //     partir de chrome.runtime.getManifest().version;
  //  2) leitura direta do manifest, caso este script rode em contexto de
  //     extensão (raro: aqui é contexto de página injetada).
  // Nenhum literal de versão é hardcodado: literais ("7.5.1", "20.5.21")
  // divergiam do manifest a cada release e disparavam o version gate (426).
  //
  // ATENÇÃO — regressão corrigida: resolver a versão UMA VEZ, no load, criava
  // corrida com o content.js e mandava um placeholder ("unknown"/"") para o
  // servidor. Ambos REPROVAM no gate: isVersionOutdated faz
  // `if (!current) return true` para string vazia, e "unknown" vira [] -> 0 <
  // 7.5.1 -> 426. Por isso resolvemos SOB DEMANDA, no momento do request, e
  // esperamos o global por uma janela curta antes de desistir.
  var __extVersionCache = null;
  function readExtVersion() {
    if (__extVersionCache) return __extVersionCache;
    try {
      if (window.__NEXUS_EXT_VERSION__) {
        __extVersionCache = String(window.__NEXUS_EXT_VERSION__);
        return __extVersionCache;
      }
    } catch (_) {}
    try {
      var mf = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest)
        ? chrome.runtime.getManifest()
        : null;
      if (mf && mf.version) {
        __extVersionCache = String(mf.version);
        try { window.__NEXUS_EXT_VERSION__ = mf.version; } catch (_) {}
        return __extVersionCache;
      }
    } catch (_) {}
    return null;
  }
  // Poll curto (até ~3s) para vencer a corrida com o content.js sem travar a UI.
  (function warmExtVersion() {
    var tries = 0;
    var t = setInterval(function () {
      if (readExtVersion() || ++tries >= 30) clearInterval(t);
    }, 100);
  })();
  // Aguarda até `ms` pelo global antes de mandar o request.
  function getExtVersion(ms) {
    var v = readExtVersion();
    if (v) return Promise.resolve(v);
    var deadline = Date.now() + (ms || 1500);
    return new Promise(function (resolve) {
      var t = setInterval(function () {
        var found = readExtVersion();
        if (found || Date.now() > deadline) {
          clearInterval(t);
          // Último recurso: string vazia. O servidor recebe header vazio e
          // decide; nunca mais enviamos um token léxico inválido.
          resolve(found || "");
        }
      }, 100);
    });
  }
  var TOKEN_KEY = "lovable_pro_license";
  var SESSION_ID_KEY = "lovable_pro_session_id";
  var SESSION_TOKEN_KEY = "lovable_pro_session_token";
  var FINGERPRINT_KEY = "ext_client_fingerprint";
  var VALIDATE_URL =
    "https://iuvzpvhaxlrbwaitizci.supabase.co/functions/v1/fn-sv03";
  var VALIDATE_LICENSE_URL =
    "https://iuvzpvhaxlrbwaitizci.supabase.co/functions/v1/fn-vl04";
  // Public anon key — required by the Supabase Edge Functions gateway.
  // Without this header, the gateway rejects the request with 401 (HTML body),
  // which used to surface as "Erro de conexão" in the catch block.
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnpwdmhheGxyYndhaXRpemNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDcwNjQsImV4cCI6MjA4NzI4MzA2NH0.sFaui5qD51IdYLIYV4cAFKBdGKLkqmQu8h5K5NKEs_4";

  // Garante fingerprint estável por dispositivo
  function ensureFingerprint() {
    try {
      var fp = localStorage.getItem(FINGERPRINT_KEY);
      if (!fp) {
        fp = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : (Date.now() + "-" + Math.random().toString(36).slice(2));
        localStorage.setItem(FINGERPRINT_KEY, fp);
      }
      return fp;
    } catch (_) { return ""; }
  }
  var FINGERPRINT = ensureFingerprint();

  // ─── i18n (pt-BR default, en, hybrid=segue navegador) ───
  // Idioma vem de reseller_customizations.default_language, persistido em
  // localStorage["ext_branding"].default_language ("pt-BR" | "en" | "hybrid").
  var NX_LOGIN_I18N = {
    "pt-BR": {
      title: "Ativar {brand}",
      label: "Insira sua chave para ativar a extensão.",
      field_label: "Chave de licença",
      support: "Precisa de ajuda? Fale com o suporte",
      placeholder: "Sua chave de licença...",
      activate: "Ativar Licença",
      verifying: "Verificando...",
      empty_key: "Digite sua chave de licença.",
      toggle_theme: "Alternar tema",
      secure: "Conexão criptografada · Ativação segura",
      outdated_default: "Sua extensão está desatualizada. Baixe a versão mais recente para continuar.",
      outdated_action: "Atualizar Extensão",
      server_unavailable: "Servidor indisponível (HTTP {status}). Tente novamente.",
      banned: "Conta suspensa. Contate o suporte.",
      expired: "Chave expirada.",
      no_credits: "Créditos esgotados.",
      duplicate: "Esta chave já está em uso em outro dispositivo. Aguarde alguns minutos ou contate o suporte.",
      not_found: "Chave não encontrada. Verifique e tente novamente.",
      invalid: "Chave inválida ou expirada.",
      activated: "✅ Licença ativada! Recarregando...",
      timeout: "Tempo esgotado. Verifique sua conexão.",
      conn_error: "Erro de conexão. Tente novamente.",
    },
    "en": {
      title: "Activate {brand}",
      label: "Enter your key to activate the extension.",
      field_label: "License key",
      support: "Need help? Contact support",
      placeholder: "Your license key...",
      activate: "Activate License",
      verifying: "Verifying...",
      empty_key: "Enter your license key.",
      toggle_theme: "Toggle theme",
      secure: "Encrypted connection · Secure activation",
      outdated_default: "Your extension is out of date. Download the latest version to continue.",
      outdated_action: "Update Extension",
      server_unavailable: "Server unavailable (HTTP {status}). Try again.",
      banned: "Account suspended. Contact support.",
      expired: "Key expired.",
      no_credits: "Out of credits.",
      duplicate: "This key is already in use on another device. Wait a few minutes or contact support.",
      not_found: "Key not found. Check it and try again.",
      invalid: "Invalid or expired key.",
      activated: "✅ License activated! Reloading...",
      timeout: "Timed out. Check your connection.",
      conn_error: "Connection error. Try again.",
    },
  };
  function nxLoginLang() {
    try {
      var b = JSON.parse(localStorage.getItem("ext_branding") || "null");
      var raw = b && b.default_language ? String(b.default_language) : null;
      if (!raw) return "pt-BR";
      if (raw === "en") return "en";
      if (raw === "hybrid") {
        var nav = (typeof navigator !== "undefined" && navigator.language) ? String(navigator.language).toLowerCase() : "pt-br";
        return nav.indexOf("en") === 0 ? "en" : "pt-BR";
      }
      return "pt-BR";
    } catch (_) { return "pt-BR"; }
  }
  function L(key, vars) {
    var dict = NX_LOGIN_I18N[nxLoginLang()] || NX_LOGIN_I18N["pt-BR"];
    var s = (dict && dict[key]) || NX_LOGIN_I18N["pt-BR"][key] || key;
    var merged = { brand: nxBrand().name };
    if (vars) { for (var vk in vars) { merged[vk] = vars[vk]; } }
    for (var k in merged) { s = s.split("{" + k + "}").join(merged[k]); }
    return s;
  }

  // ─── White-label 100% dinâmico: nome/ícone/site vêm SEMPRE do manifest da
  // extensão instalada. O branding de revenda (cache local) só sobrescreve
  // quando o cliente pertence de fato a um revendedor.
  function nxEscape(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function nxBrand() {
    var name = "";
    var tagline = "";
    var logo = null;
    var support = null;
    // 1) Manifest (nome/ícone/site) publicado pelo content.js em <html data-*>.
    try {
      var root = document.documentElement;
      if (root && root.getAttribute) {
        var mName = root.getAttribute("data-nexus-ext-name");
        var mIcon = root.getAttribute("data-nexus-ext-icon");
        var mHome = root.getAttribute("data-nexus-ext-home");
        if (mName) name = mName;
        if (mIcon) logo = mIcon;
        if (mHome) support = mHome;
      }
    } catch (_) {}
    // 2) Branding do revendedor (cache) só se o cliente for de revenda.
    try {
      var b = JSON.parse(localStorage.getItem("ext_branding") || "null");
      if (b && typeof b === "object" && b.is_reseller_client === true) {
        if (b.extension_name) name = String(b.extension_name);
        if (b.tagline) tagline = String(b.tagline);
        if (b.custom_logo_url) logo = String(b.custom_logo_url);
        if (b.support_url) support = String(b.support_url);
        if (!logo) {
          var cached = localStorage.getItem("ext_custom_logo");
          if (cached) logo = cached;
        }
      }
    } catch (_) {}
    if (logo && !/^https?:\/\//i.test(logo) && !/^data:image\//i.test(logo) && !/^chrome-extension:\/\//i.test(logo)) logo = null;
    if (support && !/^https?:\/\//i.test(support)) support = null;
    return { name: name || "Extensão", tagline: tagline, logo: logo, support: support };
  }

  // Tema fixo WHITE (Clean Light) — o toggle de tema foi removido do layout.
  // (tema white fixo)

  var style = document.createElement("style");
  style.textContent = [
    // ─── Overlay full-screen centralizado + backdrop blur (Clean Light) ───
    "#custom-api-chat-widget{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:radial-gradient(120% 120% at 50% 0%,rgba(226,232,240,.72),rgba(15,23,42,.55));-webkit-backdrop-filter:blur(18px) saturate(140%);backdrop-filter:blur(18px) saturate(140%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;color:#0f172a;animation:nx-fade .28s ease-out}",
    "@keyframes nx-fade{from{opacity:0}to{opacity:1}}",
    "@keyframes nx-rise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}",

    ".ext-card{position:relative;width:100%;max-width:380px;background:#fff;border:1px solid #fff;border-radius:40px;padding:40px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;box-shadow:0 40px 80px -20px rgba(0,0,0,.10),0 20px 40px -15px rgba(0,0,0,.05);animation:nx-rise .38s cubic-bezier(.22,1,.36,1)}",

    // Logo (ícone do instalador) centralizado
    ".ext-logo-frame{width:96px;height:96px;border-radius:32px;background:#fff;border:1px solid #f8fafc;display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 20px 40px -10px rgba(0,0,0,.07)}",
    ".ext-logo-inner{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#fff;background:#2563eb;box-shadow:0 10px 22px -6px rgba(37,99,235,.45);overflow:hidden}",
    ".ext-logo-inner img{width:100%;height:100%;object-fit:cover;display:block}",

    ".ext-head{text-align:center;margin-bottom:40px}",
    ".ext-title{margin:0;font-size:24px;font-weight:600;letter-spacing:-.02em;line-height:1.2;color:#111827}",
    ".ext-label{margin:8px 0 0;font-size:13.5px;line-height:1.6;color:#9ca3af}",

    ".ext-form{width:100%;display:flex;flex-direction:column;gap:24px}",
    ".ext-field{display:flex;flex-direction:column;gap:8px}",
    ".ext-field-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-left:8px}",

    ".ext-input{width:100%;padding:16px 20px;background:rgba(249,250,251,.5);color:#111827;border:1px solid #f3f4f6;border-radius:16px;font-size:14px;letter-spacing:.02em;transition:border-color .3s ease-out,box-shadow .3s ease-out,background .3s ease-out;outline:none;box-sizing:border-box}",
    ".ext-input:focus{border-color:#60a5fa;background:#fff;box-shadow:0 0 0 4px rgba(59,130,246,.10)}",
    ".ext-input::placeholder{color:#d1d5db}",

    ".ext-btn{width:100%;padding:17px 16px;background:#2563eb;color:#fff;border:none;border-radius:16px;font-weight:600;font-size:14px;letter-spacing:.01em;cursor:pointer;transition:background .3s ease-out,transform .12s ease-out,box-shadow .3s ease-out;box-shadow:0 15px 30px -5px rgba(37,99,235,.30);box-sizing:border-box}",
    ".ext-btn:hover{background:#1d4ed8;box-shadow:0 20px 40px -5px rgba(37,99,235,.40)}",
    ".ext-btn:active{transform:scale(.97)}",
    ".ext-btn:focus-visible{outline:2px solid #93c5fd;outline-offset:2px}",
    ".ext-btn:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed;box-shadow:none}",

    "#login-msg{font-size:13px;font-weight:500;text-align:center;min-height:20px;line-height:1.5;margin:0}",
    ".ext-error{color:#ef4444}",
    ".ext-success{color:#059669}",

    ".ext-footer{margin-top:36px;padding-top:0;border-top:1px solid #f9fafb;width:100%;text-align:center;padding-top:28px}",
    ".ext-support{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:500;color:#9ca3af;text-decoration:none;transition:color .3s ease-out}",
    ".ext-support:hover{color:#2563eb}",
    ".ext-support svg{transition:transform .2s ease-out}",
    ".ext-support:hover svg{transform:translateX(2px)}",
    ".ext-support:focus-visible{outline:2px solid #93c5fd;outline-offset:3px;border-radius:6px}",

    "@media (max-width:480px){.ext-card{padding:28px;border-radius:28px}.ext-title{font-size:21px}.ext-logo-frame{width:84px;height:84px;border-radius:26px}.ext-head{margin-bottom:28px}.ext-footer{margin-top:26px}}"
  ].join("\n");
  // <head> pode ainda não existir em document_start — nunca deixe estourar,
  // senão o widget inteiro nunca é criado nessa navegação.
  try { (document.head || document.documentElement).appendChild(style); } catch (_) {}

  var boltSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>';
  var arrowSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';

  var widget = document.createElement("div");
  widget.id = "custom-api-chat-widget";

  var BRAND = nxBrand();
  var brandMark = BRAND.logo
    ? '<img src="' + nxEscape(BRAND.logo) + '" alt="' + nxEscape(BRAND.name) + '">'
    : boltSvg;

  widget.innerHTML = [
    '<div class="ext-card" role="dialog" aria-modal="true" aria-label="' + L("title") + '">',
    '  <div class="ext-logo-frame">',
    '    <div class="ext-logo-inner"' + (BRAND.logo ? ' style="background:#fff;box-shadow:none;"' : '') + '>' + brandMark + '</div>',
    '  </div>',

    '  <div class="ext-head">',
    '    <h2 class="ext-title">' + nxEscape(BRAND.name) + '</h2>',
    '    <p class="ext-label">' + L("label") + '</p>',
    '  </div>',

    '  <div class="ext-form">',
    '    <div class="ext-field">',
    '      <label class="ext-field-label" for="license-input">' + L("field_label") + '</label>',
    '      <input type="text" id="license-input" class="ext-input" placeholder="' + L("placeholder") + '" autocomplete="off" spellcheck="false">',
    '    </div>',
    '    <button id="btn-validate" class="ext-btn" type="button">' + L("activate") + '</button>',
    '    <p id="login-msg"></p>',
    '  </div>',

    '  <div class="ext-footer"' + (BRAND.support ? '' : ' style="display:none"') + '>',
    '    <a class="ext-support" href="' + nxEscape(BRAND.support || "#") + '" target="_blank" rel="noopener noreferrer">' + L("support") + arrowSvg + '</a>',
    '  </div>',
    '</div>'
  ].join("\n");

  // Re-sincroniza a marca no momento do mount: o content.js pode publicar os
  // atributos data-nexus-ext-* depois deste script ser avaliado.
  function refreshBrand() {
    try {
      var b = nxBrand();
      var titleEl = widget.querySelector(".ext-title");
      if (titleEl && b.name) titleEl.textContent = b.name;
      var inner = widget.querySelector(".ext-logo-inner");
      if (inner && b.logo) {
        inner.setAttribute("style", "background:#fff;box-shadow:none;");
        inner.innerHTML = '<img src="' + nxEscape(b.logo) + '" alt="' + nxEscape(b.name) + '">';
      }
      var foot = widget.querySelector(".ext-footer");
      var link = widget.querySelector(".ext-support");
      if (foot) foot.style.display = b.support ? "" : "none";
      if (link && b.support) link.setAttribute("href", b.support);
      var card = widget.querySelector(".ext-card");
      if (card && b.name) card.setAttribute("aria-label", b.name);
    } catch (_) {}
  }
  // ─── Mount seguro: aguarda <body> existir ───────────────────────────
  // Após logout + reinjeção do script, o content-script pode rodar em
  // document_start, quando document.body ainda é null. Sem esta guarda,
  // o appendChild estoura TypeError e o modal de ativação nunca aparece.
  var _initialized = false;
  function mountWidget() {
    if (document.getElementById("custom-api-chat-widget")) return;
    if (!document.body) return;
    document.body.appendChild(widget);
    refreshBrand();
    if (!_initialized) { _initialized = true; initWidget(); }
    startWatchdog();
  }

  // [PATCH 20.5.11] O lovable.dev é uma SPA: ao navegar entre /dashboard,
  // /projects/:id etc., o React remonta a árvore e o widget podia ser removido
  // do <body> — dando a impressão de que a UI de ativação só aparece em
  // /dashboard. Watchdog reanexa o widget sempre que ele sumir, e expomos um
  // remount global chamado pelo payload em cada troca de rota.
  var _watchdog = null;
  function startWatchdog() {
    if (_watchdog || !document.body) return;
    _watchdog = new MutationObserver(function () {
      if (!document.getElementById("custom-api-chat-widget")) {
        try { document.body.appendChild(widget); } catch (_) {}
      }
    });
    try { _watchdog.observe(document.body, { childList: true }); } catch (_) {}
  }
  try { window.__nexusRemountLogin = mountWidget; } catch (_) {}

  if (document.body) {
    mountWidget();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWidget, { once: true });
  } else {
    // readyState !== "loading" mas body ainda ausente — poll curto (≤ 2 s).
    var _mountTries = 0;
    var _mountPoll = setInterval(function () {
      if (document.body) {
        clearInterval(_mountPoll);
        mountWidget();
      } else if (++_mountTries > 100) {
        clearInterval(_mountPoll);
        console.warn("[NexusPRO] Login widget: <body> nunca ficou disponível.");
      }
    }, 20);
  }

  function initWidget() {
    // Tema WHITE fixo — não há mais toggle de tema nesta UI.
    // Validate license
    var input = widget.querySelector("#license-input");
    var btn = widget.querySelector("#btn-validate");
    var msg = widget.querySelector("#login-msg");


  // ─── Fetch with timeout + auto-retry ───
  function fetchWithRetry(url, opts, retries, delayMs) {
    return new Promise(function (resolve, reject) {
      function attempt(n) {
        var controller = new AbortController();
        // Timeout aumentado para 30s — RPC validar_licenca pode demorar sob carga.
        var timer = setTimeout(function () { controller.abort(); }, 30000);
        var fetchOpts = Object.assign({}, opts, { signal: controller.signal });
        fetch(url, fetchOpts)
          .then(function (res) { clearTimeout(timer); resolve(res); })
          .catch(function (err) {
            clearTimeout(timer);
            if (n > 0) {
              console.warn("[NexusPRO] Login attempt failed, retrying in " + delayMs + "ms...", err && err.message);
              setTimeout(function () { attempt(n - 1); }, delayMs);
            } else {
              reject(err);
            }
          });
      }
      attempt(retries);
    });
  }

  btn.addEventListener("click", function () {
    var key = (input.value || "").trim();
    if (!key) {
      msg.className = "ext-error";
      msg.textContent = L("empty_key");
      return;
    }

    btn.disabled = true;
    btn.textContent = L("verifying");
    msg.textContent = "";

    // Valida a licença diretamente via validate-license (envia fingerprint
    // já no primeiro contato para o servidor reconhecer este dispositivo).
    getExtVersion(1500).then(function (extVersion) {
      return fetchWithRetry(VALIDATE_LICENSE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
          "x-license-key": key,
          "x-client-fingerprint": FINGERPRINT,
          "x-ext-version": extVersion,
        },
        body: JSON.stringify({ session_id: null, fingerprint: FINGERPRINT }),
      }, 2, 2000);
    })
      .then(function (res) {
        // Read as text first so a non-JSON response (e.g. gateway 401 HTML)
        // doesn't throw and trigger a generic "Erro de conexão" message.
        return res.text().then(function (txt) {
          var data = null;
          try { data = txt ? JSON.parse(txt) : null; } catch (_) { data = null; }
          return { ok: res.ok, status: res.status, data: data, raw: txt };
        });
      })
      .then(function (r) {
        // ─── Version gate: extensão desatualizada (HTTP 426) ───
        if (r.status === 426 || (r.data && r.data.error_code === "ext_outdated")) {
          var url = (r.data && r.data.action_url) || "https://nexxus-pro.online/dashboard";
          var label = (r.data && r.data.action_label) || L("outdated_action");
          var display = (r.data && r.data.error_display) || L("outdated_default");
          msg.className = "ext-error";
          msg.innerHTML = '';
          var p = document.createElement('div');
          p.style.cssText = 'margin-bottom:10px;line-height:1.4;';
          p.textContent = display;
          var a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = label;
          a.style.cssText = 'display:inline-block;padding:8px 14px;background:hsl(234,89%,56%);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:12px;';
          msg.appendChild(p);
          msg.appendChild(a);
          btn.style.display = 'none';
          input.disabled = true;
          return;
        }
        if (!r.data || r.data.valida !== true) {
          msg.className = "ext-error";
          if (!r.data) {
            msg.textContent = L("server_unavailable", { status: r.status });
            return;
          }
          var motivo = r.data && r.data.motivo;
          msg.textContent = motivo === "usuario_banido"
            ? L("banned")
            : motivo === "tempo_esgotado"
              ? L("expired")
              : motivo === "creditos_esgotados"
                ? L("no_credits")
                : motivo === "sessao_duplicada"
                  ? L("duplicate")
                  : motivo === "chave_inexistente"
                    ? L("not_found")
                    : L("invalid") + (motivo ? " (" + motivo + ")" : "");
          return;
        }
        // Persiste token + sessão antes do reload — o core já encontra tudo no localStorage.
        localStorage.setItem(TOKEN_KEY, key);
        // 🎨 Persistir branding do revendedor ANTES do reload, para que a
        // primeira renderização já apareça com logo/cores/community_button
        // corretos, em vez do rail padrão do Nexus PRO.
        try {
          var _brand = (r.data && r.data.branding && typeof r.data.branding === "object") ? r.data.branding : null;
          if (!_brand && (r.data.has_branding === true || r.data.extension_name || r.data.custom_logo_url)) {
            _brand = {
              extension_name: r.data.extension_name || null,
              custom_logo_url: r.data.custom_logo_url || null,
              primary_color: r.data.primary_color || null,
              welcome_message: r.data.welcome_message || null,
              footer_text: r.data.footer_text || null,
              support_url: r.data.support_url || null,
              support_email: r.data.support_email || null,
              support_whatsapp: r.data.support_whatsapp || null,
              renewal_url: r.data.renewal_url || null,
              is_reseller_client: r.data.is_reseller_client === true,
              reseller_id: r.data.reseller_id || null,
              community_button_allowed: r.data.community_button_allowed === true,
              default_language: r.data.default_language || "pt-BR",
            };
          }
          if (_brand) {
            localStorage.setItem("ext_branding", JSON.stringify(_brand));
            if (_brand.custom_logo_url) localStorage.setItem("ext_custom_logo", _brand.custom_logo_url);
            localStorage.removeItem("nx_branding_blocked");
          } else if (r.data.has_branding === false || r.data.branding_revoked === true || r.data.reseller_suspended === true) {
            localStorage.removeItem("ext_branding");
            localStorage.removeItem("ext_custom_logo");
          }
        } catch (_) {}
        // Cache do active_skill (piggyback) — substitui o polling do get-active-skill.
        try {
          if (Object.prototype.hasOwnProperty.call(r.data, 'active_skill')) {
            var _sk = r.data.active_skill && r.data.active_skill.name ? r.data.active_skill.name : null;
            localStorage.setItem("ext_last_active_skill", JSON.stringify({ skill: _sk, ts: Date.now() }));
          }
        } catch (_) {}
        if (r.data.session_id) {
          try {
            localStorage.setItem(SESSION_ID_KEY, r.data.session_id);
            localStorage.setItem(SESSION_TOKEN_KEY, key);
          } catch (_) {}
        }
        msg.className = "ext-success";
        msg.textContent = L("activated");
        setTimeout(function () { location.reload(); }, 1000);
      })
      .catch(function (err) {
        msg.className = "ext-error";
        var detail = (err && err.name === "AbortError")
          ? L("timeout")
          : (err && err.message)
            ? "Falha de rede: " + err.message.slice(0, 80)
            : L("conn_error");
        msg.textContent = detail;
        console.error("[NexusPRO] Login fetch error:", err);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = L("activate");
      });
  });

    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") btn.click();
    });
  } // ← fecha initWidget()
})();

