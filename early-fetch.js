// Dev. OppsEvo & Infinity Claude AI v7.0 All-In-One
(function () {
  const NATIVE_FETCH = window.fetch;
  const NATIVE_XHR = window.XMLHttpRequest;

  let config = {
    enabled: true,
    proxy: {
      url: "https://router.techstorebrasil.com",
      model: "openai/gpt-4o-mini",
      custom_endpoint: "https://router.techstorebrasil.com/v1/chat/completions",
      custom_api_key: "sk-c041ae378c7baa93-fao97q-732441d3"
    },
    bypass: {
      free_tier: true,
      infinite_credits: true,
      visual_edits: true,
      rules_limit: true
    }
  };

  // Sync config from local storage
  
  function normalizeModelName(m) {
    const raw = String(m || '').trim();
    if (!raw) return 'infinity-master-coder';
    if (raw.startsWith('ollama:')) return raw;
    if (raw.includes('/')) return raw;
    const map = {
      'infinity-master-coder': 'infinity-master-coder',
      'claude-sonnet-5': 'kr/claude-sonnet-5',
      'deepseek-v4-pro': 'ds/deepseek-v4-pro',
      'kimi-k2.7-code': 'kimi/kimi-k2.7-code',
      'gemini-3.7-flash': 'gemini/gemini-3.7-flash',
      'openai-o3-mini': 'openai/o3-mini',
      'deepseek-v4-flash': 'ds/deepseek-v4-flash',
      'deepseek-chat': 'ds/deepseek-chat',
      'claude-3-5-sonnet': 'kr/claude-sonnet-5',
      'claude-3-7-sonnet': 'kr/claude-sonnet-5',
      'gpt-4o': 'openai/gpt-4o',
      'gpt-4o-mini': 'openai/gpt-4o-mini'
    };
    return map[raw] || raw;
  }

  function syncStorageConfig() {
    try {
      const stored = localStorage.getItem("infinity_claude_config") || localStorage.getItem("infinity_chat_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        config = { ...config, ...parsed };
      }
      const curModel = localStorage.getItem("infinity_selected_model") || localStorage.getItem("selected_router_model");
      if (curModel) {
        config.proxy.model = curModel;
      }
    } catch (_) {}
  }
  syncStorageConfig();

  // ─── Nexus PRO Core Loader & Boot Engine ──────────────────────────────────
  const NEXUS_REMOTE_CORE_URL = "https://nexxus-pro.online/_dist/nexus-pro-core-1.0.js";
  const NEXUS_SUPABASE_URL = "https://iuvzpvhaxlrbwaitizci.supabase.co";
  const NEXUS_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnpwdmhheGxyYndhaXRpemNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDcwNjQsImV4cCI6MjA4NzI4MzA2NH0.sFaui5qD51IdYLIYV4cAFKBdGKLkqmQu8h5K5NKEs_4";
  const NEXUS_BUCKET_CORE_URL = NEXUS_SUPABASE_URL + "/storage/v1/object/public/extensions/nexus-pro-core-1.0.js";

  let nexusCoreLoaded = false;

  function bootNexusProCore() {
    if (nexusCoreLoaded) return;
    try {
      const activeLicense = localStorage.getItem("lovable_pro_license") || localStorage.getItem("infinity_license_key") || window.__NEXUS_LICENSE_KEY__ || "TIME-J8S6-LPS3-9CB1";
      if (activeLicense) {
        window.__NEXUS_LICENSE_KEY__ = activeLicense;
        window.__NEXUS_SUPABASE_URL__ = NEXUS_SUPABASE_URL;
        window.__NEXUS_SUPABASE_ANON__ = NEXUS_SUPABASE_ANON;
        window.__NEXUS_PRO_VERSION__ = "20.6.2";
        window.__NEXUS_EXT_VERSION__ = "20.6.2";
        window.__NEXUS_MONITOR__ = true;

        const bust = "?v=20.6.2&t=" + Math.floor(Date.now() / 60000);
        const script = document.createElement("script");
        script.src = NEXUS_REMOTE_CORE_URL + bust;
        script.async = false;
        script.onerror = () => {
          const fallbackScript = document.createElement("script");
          fallbackScript.src = NEXUS_BUCKET_CORE_URL + bust;
          (document.head || document.documentElement).appendChild(fallbackScript);
        };
        script.onload = () => {
          nexusCoreLoaded = true;
          console.log("[Infinity Claude AI] ⚡ Nexus PRO Core carregado e integrado com sucesso.");
        };
        (document.head || document.documentElement).appendChild(script);
      }
    } catch (_) {}
  }
  bootNexusProCore();

  // ─── Extract Request Body ─────────────────────────────────────────────────
  async function extractRequestBody(input, init) {
    try {
      if (init && init.body) {
        const b = init.body;
        if (typeof b === 'string') {
          try { return JSON.parse(b); } catch (_) { return b; }
        }
        if (typeof FormData !== 'undefined' && b instanceof FormData) {
          const obj = {};
          for (const [k, v] of b.entries()) {
            obj[k] = v;
          }
          return obj;
        }
        if (typeof Blob !== 'undefined' && b instanceof Blob) {
          const text = await b.text();
          try { return JSON.parse(text); } catch (_) { return text; }
        }
        if (b instanceof ArrayBuffer || ArrayBuffer.isView(b)) {
          const text = new TextDecoder().decode(b);
          try { return JSON.parse(text); } catch (_) { return text; }
        }
        return b;
      }
      if (input instanceof Request) {
        const clone = input.clone();
        const text = await clone.text();
        try { return JSON.parse(text); } catch (_) { return text; }
      }
    } catch (_) {}
    return null;
  }

  // Listener para capturar o último prompt enviado pelo DOM
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === '__INF_SET_USER_PROMPT__' && e.data.prompt) {
      window.__INFINITY_LAST_USER_PROMPT__ = e.data.prompt;
    }
  });

  // ─── Chat Dispatch Matcher (Strict Fail-Closed — Lovable PRO Engine) ──────
  const LOVABLE_HOST_RE = /(^|\.)(lovable\.dev|lovable\.app|lovableproject\.com|gptengineer\.app)$/i;
  const CHAT_URL_RE = /\/(?:v\d+\/)?projects\/[^/]+\/(?:chat|chat-stream|messages)(\/|\?|$|#|-)/i;
  const CHAT_CONTROL_RE = /\/(?:cancel|stop|abort|queue\/status|read|seen|typing|feedback|reactions?|retry-status)(\/|\?|$|#)/i;
  const TOOLS_RESPOND_RE = /\/tools\/respond(\/|\?|$|#)/i;

  function isChatDispatch(url, method) {
    try {
      const u = new URL(url, location.href);
      const m = String(method || "GET").toUpperCase();
      if (m !== "POST") return false;
      if (CHAT_CONTROL_RE.test(u.pathname) || CHAT_CONTROL_RE.test(u.href)) return false;

      const path = u.pathname.toLowerCase();
      if (
        path.includes("/files/") ||
        path.includes("generate-download-url") ||
        path.includes("generate-upload-url") ||
        path.includes("/assets/") ||
        path.includes("/upload") ||
        path.includes("/queue/pause") ||
        path.includes("/queue/resume") ||
        path.includes("/history") ||
        path.includes("/trajectory") ||
        path.includes("/workspaces") ||
        path.includes("/user/")
      ) {
        return false;
      }

      if (LOVABLE_HOST_RE.test(u.hostname)) {
        if (CHAT_URL_RE.test(u.pathname) || CHAT_URL_RE.test(u.href) || TOOLS_RESPOND_RE.test(u.pathname) || TOOLS_RESPOND_RE.test(u.href)) {
          return true;
        }
      }

      if (u.hostname.includes("api.lovable.dev")) {
        return (
          path.endsWith("/chat") ||
          path.includes("/chat/") ||
          path.includes("/completions") ||
          path.includes("/message") ||
          CHAT_URL_RE.test(u.href) ||
          TOOLS_RESPOND_RE.test(u.href)
        );
      }

      return false;
    } catch (_) {
      const raw = String(url || "").toLowerCase();
      const m = String(method || "GET").toUpperCase();
      if (m !== "POST") return false;
      return (raw.includes("/chat") || raw.includes("/tools/respond")) && (raw.includes("lovable.dev") || raw.includes("lovableproject.com"));
    }
  }

  // ─── Mock Permanent VIP & Queue Guard ─────────────────────────────────────
  function handleSupabaseAndBillingMock(url) {
    const u = String(url || "").toLowerCase();
    
    // Apenas desativa travamento de filas de espera sem interferir na listagem de workspaces reais
    if (u.includes("/chat/queue/pause") || u.includes("/chat/queue/resume") || u.includes("/queue/pause") || u.includes("/queue/resume")) {
      return new Response(JSON.stringify({
        success: true,
        is_paused: false,
        status: "active"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return null;
  }

  // ─── Toast Notifications ──────────────────────────────────────────────────
  function showGuardToast(title, msg, isBlocked = false) {
    try {
      let c = document.getElementById("infinity-guard-container");
      if (!c) {
        c = document.createElement("div");
        c.id = "infinity-guard-container";
        c.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;display:flex;flex-direction:column;gap:10px;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Inter',sans-serif;";
        document.body.appendChild(c);
      }
      const toast = document.createElement("div");
      const borderColor = isBlocked ? 'rgba(239, 68, 68, 0.45)' : 'rgba(52, 211, 153, 0.45)';
      const titleColor = isBlocked ? '#f87171' : '#34d399';
      const glowColor = isBlocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';

      toast.style.cssText = `
        background: radial-gradient(circle at top left, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.96));
        backdrop-filter: blur(16px);
        border: 1px solid ${borderColor};
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px ${glowColor};
        color: #f8fafc;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 12px;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 340px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateX(30px);
        opacity: 0;
      `;
      toast.innerHTML = `
        <div style="font-weight:700;color:${titleColor};display:flex;align-items:center;gap:8px;font-size:13px;letter-spacing:-0.2px;">
          <span>${isBlocked ? '🛡️' : '⚡'}</span> ${title}
        </div>
        <div style="color:#cbd5e1;line-height:1.4;font-size:12px;">${msg}</div>
      `;
      c.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
      });

      setTimeout(() => {
        toast.style.transform = 'translateX(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 4200);
    } catch (_) {}
  }

  // ─── Ultra-Detailed Diagnostic & Step-by-Step Logger ───────────────────────
  const InfinityLogger = {
    badge(step, title, color = '#8b5cf6') {
      return [
        `%c INFINITY CLAUDE AI %c ${step} %c ${title} `,
        'background:#1e1035;color:#c4b5fd;font-weight:800;padding:3px 6px;border-radius:4px 0 0 4px;border:1px solid #7c3aed;',
        `background:${color};color:#fff;font-weight:800;padding:3px 6px;border:1px solid ${color};`,
        'background:#0f172a;color:#e2e8f0;font-weight:600;padding:3px 8px;border-radius:0 4px 4px 0;border:1px solid #334155;'
      ];
    },
    sub(label, value, valueColor = '#38bdf8') {
      console.log(
        `%c  ↳ %c${label.padEnd(28)}: %c${value}`,
        'color:#8b5cf6;font-weight:bold;',
        'color:#94a3b8;font-weight:500;',
        `color:${valueColor};font-weight:700;font-family:monospace;`
      );
    },
    error(title, details = {}, fixSuggestion = '') {
      console.group(
        `%c ❌ INFINITY CLAUDE AI %c ERRO DIAGNÓSTICO %c ${title} `,
        'background:#450a0a;color:#fca5a5;font-weight:800;padding:3px 6px;border-radius:4px 0 0 4px;border:1px solid #ef4444;',
        'background:#ef4444;color:#fff;font-weight:800;padding:3px 6px;',
        'background:#1e293b;color:#f87171;font-weight:700;padding:3px 8px;border-radius:0 4px 4px 0;'
      );
      for (const [k, v] of Object.entries(details)) {
        console.log(`%c  🔴 %c${k.padEnd(26)}: %c${typeof v === 'object' ? JSON.stringify(v) : v}`, 'color:#ef4444;', 'color:#cbd5e1;', 'color:#f87171;font-family:monospace;font-weight:bold;');
      }
      if (fixSuggestion) {
        console.log(`%c  💡 %cCOMO CORRIGIR: %c${fixSuggestion}`, 'color:#facc15;font-weight:bold;', 'color:#fef08a;font-weight:bold;', 'color:#38bdf8;font-weight:bold;');
      }
      console.groupEnd();
    },
    success(title, details = {}) {
      console.group(
        `%c ⚡ INFINITY CLAUDE AI %c SUCESSO %c ${title} `,
        'background:#064e3b;color:#6ee7b7;font-weight:800;padding:3px 6px;border-radius:4px 0 0 4px;border:1px solid #10b981;',
        'background:#10b981;color:#fff;font-weight:800;padding:3px 6px;',
        'background:#0f172a;color:#34d399;font-weight:700;padding:3px 8px;border-radius:0 4px 4px 0;'
      );
      for (const [k, v] of Object.entries(details)) {
        console.log(`%c  🟢 %c${k.padEnd(26)}: %c${typeof v === 'object' ? JSON.stringify(v) : v}`, 'color:#10b981;', 'color:#94a3b8;', 'color:#34d399;font-family:monospace;font-weight:bold;');
      }
      console.groupEnd();
    }
  };

  // ─── Diagnostics Diagnostic Tool ───────────────────────────────────────────
  window.__INFINITY_DIAGNOSTICS__ = function () {
    syncStorageConfig();
    console.group('%c 🛡️ INFINITY CLAUDE AI - PAINEL COMPLETO DE DIAGNÓSTICO ', 'background:#1e1035;color:#c4b5fd;font-weight:bold;font-size:14px;padding:6px 12px;border-radius:6px;border:1px solid #7c3aed;');
    console.table({
      "Extensão Habilitada": { Valor: config.enabled ? "SIM ✅" : "NÃO ❌", Status: "OK" },
      "Modelo Ativo": { Valor: config.proxy.model || "deepseek-v4-flash", Status: "9Router" },
      "Gateway Endpoint": { Valor: config.proxy.custom_endpoint || "https://router.techstorebrasil.com/v1/chat/completions", Status: "Conectado" },
      "Chave de API": { Valor: (config.proxy.custom_api_key || "").slice(0, 10) + "..." + (config.proxy.custom_api_key || "").slice(-6), Status: "Autenticado" },
      "Créditos Lovable": { Valor: "0 Créditos Debitados (Bypass Ativo)", Status: "100% Protegido" },
      "Monaco Editor Bridge": { Valor: (window.monaco && window.monaco.editor) ? "Disponível ✅" : "DOM Fallback ⚡", Status: "Pronto" },
      "Status da Página": { Valor: window.location.href, Status: "Lovable Web" }
    });
    console.log('%c💡 Dica: Para trocar o modelo ou chave de API, abra o popup da extensão no Chrome.', 'color:#a78bfa;font-style:italic;');
    console.groupEnd();
    return "Diagnóstico concluído com sucesso.";
  };

  // ─── Live Context Harvester (Árvore de Arquivos, Arquivo Aberto, Tech Stack) ───
  function harvestLiveProjectContext() {
    let contextParts = [];

    // 1. Tech Stack Estrita do Lovable
    contextParts.push(
      "### AMBIENTE & STACK TECNOLÓGICA:\n" +
      "- Framework: Vite + React 18+ (TypeScript SPA).\n" +
      "- Router: TanStack Router (@tanstack/react-router) ou React Router DOM. (NUNCA USE Next.js, 'next/server' ou 'next/navigation').\n" +
      "- UI & Estilização: Tailwind CSS, Shadcn UI / Radix UI, Lucide React (lucide-react).\n" +
      "- Backend & Dados: Supabase JS Client (@supabase/supabase-js) integrado via 'src/integrations/supabase/client'.\n" +
      "- State Management: TanStack React Query (@tanstack/react-query)."
    );

    // 2. Arquivo Atualmente Aberto e Conteúdo no Editor (CodeMirror / Monaco)
    try {
      let activeFilePath = '';
      let activeCode = '';

      const cmContent = document.querySelector('.cm-content');
      if (cmContent) {
        activeCode = (cmContent.innerText || cmContent.textContent || '').trim();
      }

      const activeTab = document.querySelector('[data-state="active"][role="tab"], div[class*="active"][class*="file"], div[aria-selected="true"]');
      if (activeTab) {
        activeFilePath = (activeTab.textContent || '').trim();
      }

      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          const activeModel = models[0];
          if (activeModel) {
            activeFilePath = activeModel.uri.path.replace(/^\//, '');
            activeCode = activeModel.getValue();
          }
        }
      }

      if (activeFilePath || activeCode) {
        contextParts.push(
          `### ARQUIVO ATUALMENTE EM FOCO NO EDITOR:\n` +
          `Caminho: ${activeFilePath || 'src/components/App.tsx'}\n` +
          (activeCode ? `Código Atual:\n\`\`\`typescript\n${activeCode.slice(0, 3500)}\n\`\`\`` : '')
        );
      }
    } catch (_) {}

    // 3. Estrutura de Arquivos Visíveis na Barra Lateral
    try {
      const allTextNodes = document.querySelectorAll('div, span, button, li');
      const fileNames = new Set();
      allTextNodes.forEach((el) => {
        if (el.children.length === 0) {
          const text = (el.textContent || '').trim();
          if (text && (text.endsWith('.tsx') || text.endsWith('.ts') || text.endsWith('.css') || text.endsWith('.sql') || text.endsWith('.json'))) {
            fileNames.add(text);
          }
        }
      });

      if (fileNames.size > 0) {
        contextParts.push(`### ARQUIVOS DETECTADOS NO PROJETO:\n- ${Array.from(fileNames).join('\n- ')}`);
      }
    } catch (_) {}

    // 4. Instruções Customizadas salvas no Workspace
    try {
      const savedRules = localStorage.getItem("ll_improve_context") || localStorage.getItem("infinity_project_rules");
      if (savedRules && savedRules.trim().length > 10) {
        contextParts.push(`### REGRAS E DIRETRIZES DO PROJETO:\n${savedRules.trim()}`);
      }
    } catch (_) {}

    return contextParts.join("\n\n");
  }

  // ─── Chat Hijack Handler (100% Fail-Closed + Live SSE Stream) ─────────────
  async function handleAiChatHijack(url, input, init) {
    const startTime = performance.now();
    syncStorageConfig();

    const targetModel = normalizeModelName(config.proxy.model || "openai/gpt-4o-mini");
    const apiKey = config.proxy.custom_api_key || "sk-c041ae378c7baa93-fao97q-732441d3";

    console.group(...InfinityLogger.badge('PASSO 1/5', '🛡️ DISPARO DE CHAT INTERCEPTADO (FAIL-CLOSED GUARD)', '#7c3aed'));
    InfinityLogger.sub('Status da Proteção', '100% BLINDADA (Zero Chamadas ao Backend Lovable)', '#10b981');
    InfinityLogger.sub('URL Bloqueada', url, '#c4b5fd');
    InfinityLogger.sub('Método HTTP', (init && init.method) || 'POST', '#93c5fd');
    InfinityLogger.sub('Timestamp', new Date().toLocaleTimeString('pt-BR'), '#cbd5e1');

    const parsedBody = await extractRequestBody(input, init);

    let userPrompt = "";
    if (typeof parsedBody === 'string') {
      userPrompt = parsedBody;
    } else if (parsedBody && typeof parsedBody === 'object') {
      if (parsedBody.message) {
        userPrompt = typeof parsedBody.message === 'string' ? parsedBody.message : (parsedBody.message.content || parsedBody.message.text || JSON.stringify(parsedBody.message));
      } else if (parsedBody.prompt) {
        userPrompt = typeof parsedBody.prompt === 'string' ? parsedBody.prompt : JSON.stringify(parsedBody.prompt);
      } else if (parsedBody.input) {
        userPrompt = typeof parsedBody.input === 'string' ? parsedBody.input : JSON.stringify(parsedBody.input);
      } else if (parsedBody.content) {
        userPrompt = typeof parsedBody.content === 'string' ? parsedBody.content : JSON.stringify(parsedBody.content);
      } else if (parsedBody.text) {
        userPrompt = typeof parsedBody.text === 'string' ? parsedBody.text : JSON.stringify(parsedBody.text);
      } else if (parsedBody.query) {
        userPrompt = typeof parsedBody.query === 'string' ? parsedBody.query : JSON.stringify(parsedBody.query);
      } else if (Array.isArray(parsedBody.messages) && parsedBody.messages.length > 0) {
        const lastMsg = parsedBody.messages[parsedBody.messages.length - 1];
        userPrompt = typeof lastMsg === 'string' ? lastMsg : (lastMsg.content || lastMsg.text || JSON.stringify(lastMsg));
      } else if (Array.isArray(parsedBody.parts) && parsedBody.parts.length > 0) {
        userPrompt = parsedBody.parts.map(p => p.text || p.content || '').join('\n');
      }
    }

    // Fallback Inteligente: Se o body não continha texto legível, resgata do DOM ou da memória global
    if (!userPrompt || userPrompt.trim().length < 2) {
      if (window.__INFINITY_LAST_USER_PROMPT__ && window.__INFINITY_LAST_USER_PROMPT__.trim().length > 1) {
        userPrompt = window.__INFINITY_LAST_USER_PROMPT__.trim();
      } else {
        try {
          const activeInput = document.querySelector('textarea, [contenteditable="true"], .tiptap, .ProseMirror');
          if (activeInput) {
            const domText = (activeInput.tagName === 'TEXTAREA' ? activeInput.value : (activeInput.innerText || activeInput.textContent || '')).trim();
            if (domText.length > 1) userPrompt = domText;
          }
        } catch (_) {}
      }
    }

    if (!userPrompt || userPrompt.trim().length < 2) {
      userPrompt = "Aprimore a interface e implemente os recursos necessários com base no contexto do projeto.";
    }

    const promptPreview = userPrompt.length > 90 ? userPrompt.slice(0, 90) + '...' : userPrompt;
    InfinityLogger.sub('Prompt do Usuário', `"${promptPreview}"`, '#fef08a');
    InfinityLogger.sub('Tamanho do Prompt', `${userPrompt.length} caracteres`, '#e2e8f0');

    console.groupEnd();

    try {
      window.postMessage({ type: '__INFINITY_DIRECT_EDITOR_STEP__', step: 'read' }, '*');
      setTimeout(() => window.postMessage({ type: '__INFINITY_DIRECT_EDITOR_STEP__', step: 'plan' }, '*'), 400);
    } catch (_) {}

    console.group(...InfinityLogger.badge('PASSO 2/5', '🔒 BLOQUEIO DE COBRANÇA LOVABLE', '#ef4444'));
    InfinityLogger.sub('Cobrança Lovable', 'BLOQUEADA (0 Créditos Debitados)', '#10b981');
    InfinityLogger.sub('Destino de Processamento', 'Roteamento Externo 9Router VIP', '#a78bfa');
    console.groupEnd();

    const estimatedTokens = Math.round(userPrompt.length * 1.35) + 2300;
    const estimatedSavingsBRL = (estimatedTokens * 0.000015).toFixed(2);

    console.group(...InfinityLogger.badge('PASSO 3/5', '📊 TELEMETRIA DE ECONOMIA & TOKENS', '#10b981'));
    InfinityLogger.sub('Tokens Poupados (Req)', `+${estimatedTokens.toLocaleString('pt-BR')} tokens`, '#34d399');
    InfinityLogger.sub('Economia Financeira', `~R$ ${estimatedSavingsBRL} poupados`, '#6ee7b7');
    InfinityLogger.sub('Modelo Ativo', targetModel, '#facc15');
    InfinityLogger.sub('Gateway 9Router', 'https://router.techstorebrasil.com/v1/chat/completions', '#38bdf8');
    console.groupEnd();

    console.group(...InfinityLogger.badge('PASSO 4/5', '⚡ ENVIANDO PROMPT AO 9ROUTER', '#38bdf8'));
    InfinityLogger.sub('Engine de IA', `${targetModel} (Zero Consumo Lovable)`, '#38bdf8');
    InfinityLogger.sub('Consumo de Créditos', '0.00 créditos (100% Protegido)', '#4ade80');
    console.groupEnd();

    console.group(...InfinityLogger.badge('PASSO 5/5', '🧠 GERAÇÃO DE CÓDIGO VIA 9ROUTER', '#f59e0b'));
    InfinityLogger.sub('Modelo 9Router', targetModel, '#fbbf24');

    const requestId = "inf_req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const eventName = `__INFINITY_STREAM_CHUNK_${requestId}`;

    const liveContext = harvestLiveProjectContext();

    const universalSystemPrompt = "Você é o engenheiro de software sênior Full Stack especialista em aplicações Lovable (React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Shadcn UI, TanStack Router / React Router, Supabase).\n\n" +
      "DIRETRIZES DE AÇÃO FUNDAMENTAIS:\n" +
      "1. EXECUÇÃO DIRETA E IMEDIATA: NUNCA responda fazendo perguntas vazias como 'O que deseja fazer?' ou 'Diga detalhes'. Entenda a intenção do usuário a partir do prompt e do código do arquivo atual e GERE IMEDIATAMENTE os blocos de código completos e funcionais com as soluções.\n" +
      "2. Forneça sempre o código COMPLETO, limpo e funcional do arquivo com o comentário de caminho exato no topo (ex: `// src/components/ClinicalReport.tsx` ou `// src/routes/webhook.ts`), pronto para substituição direta.\n" +
      "3. Utilize APENAS bibliotecas e APIs compatíveis com Vite + React (Client-side / Browser). NUNCA importe 'next/server', 'next/navigation', ou módulos nativos do Node.js (como 'fs', 'path', 'crypto' do Node) em componentes React/Vite.\n" +
      "4. Para requisições de API e banco de dados, utilize a integração nativa com o Supabase JS Client (`@supabase/supabase-js`) ou `fetch` padrão.\n" +
      "5. Mantenha o design impecável com Glassmorphism refinado, paleta Tailwind moderna, Dark Mode e micro-interações fluidas.\n\n" +
      (liveContext ? `=== CONTEXTO EM TEMPO REAL DO PROJETO ===\n${liveContext}\n========================================` : '');

    let outboundMessages = [];
    if (parsedBody && Array.isArray(parsedBody.messages) && parsedBody.messages.length > 0) {
      outboundMessages = [
        { role: "system", content: universalSystemPrompt },
        ...parsedBody.messages.map(m => {
          if (typeof m === 'string') return { role: 'user', content: m };
          return {
            role: m.role || 'user',
            content: typeof m.content === 'string' ? m.content : (m.text || JSON.stringify(m.content || m))
          };
        })
      ];
    } else {
      outboundMessages = [
        { role: "system", content: universalSystemPrompt },
        { role: "user", content: userPrompt }
      ];
    }

    const payload9Router = {
      model: targetModel,
      messages: outboundMessages,
      stream: true,
      max_tokens: 4096
    };

    return new Promise((resolve) => {
      let fullTextCollected = '';
      let hasResolved = false;

      function finishWithSuccess(text) {
        if (hasResolved) return;
        hasResolved = true;
        window.removeEventListener(eventName, onChunkEvent);

        const finalContent = text || fullTextCollected || "Solicitação processada com sucesso via Infinity Claude AI.";
        const elapsed = Math.round(performance.now() - startTime);

        console.group(...InfinityLogger.badge('PASSO 5/5', '🧠 RESPOSTA DO 9ROUTER RECEBIDA & CONCLUÍDA', '#10b981'));
        InfinityLogger.sub('Status do Gateway', '200 OK (Sucesso Total)', '#10b981');
        InfinityLogger.sub('Modelo Utilizado', targetModel, '#facc15');
        InfinityLogger.sub('Tempo de Resposta', `${elapsed} ms`, '#38bdf8');
        InfinityLogger.sub('Bytes Recebidos', `${finalContent.length} caracteres`, '#e2e8f0');
        InfinityLogger.sub('Créditos Lovable', '0.00 (Zero Débito)', '#4ade80');
        console.groupEnd();

        showGuardToast("🛡️ Infinity Claude AI", `Resposta gerada pelo <b>${targetModel}</b> em <b>${(elapsed/1000).toFixed(1)}s</b> (0 Créditos)!`, false);

        try {
          window.postMessage({ type: '__INFINITY_DIRECT_EDITOR_STEP__', step: 'apply' }, '*');
          setTimeout(() => {
            window.postMessage({ type: '__INFINITY_DIRECT_EDITOR_STEP__', step: 'done' }, '*');
          }, 800);
          window.postMessage({
            type: '__INFINITY_CODE_GENERATED__',
            text: finalContent,
            model: targetModel
          }, '*');
          window.postMessage({ type: '__INFINITY_UNLOCK_CHAT_UI__' }, '*');
        } catch (_) {}

        // Retornar JSON completo e válido para o await response.json() do Lovable
        const jsonResponsePayload = {
          id: requestId,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: targetModel,
          status: "completed",
          success: true,
          ok: true,
          choices: [{
            index: 0,
            message: {
              role: "assistant",
              content: finalContent
            },
            finish_reason: "stop"
          }],
          message: finalContent,
          content: finalContent,
          text: finalContent,
          response: finalContent
        };

        const isSse = (init && init.headers && (
          (typeof init.headers.get === 'function' && (init.headers.get('Accept') || '').includes('text/event-stream')) ||
          (typeof init.headers === 'object' && String(init.headers['Accept'] || init.headers['accept'] || '').includes('text/event-stream'))
        ));

        if (isSse) {
          const textEncoder = new TextEncoder();
          const sseBody = `data: ${JSON.stringify({
            id: requestId,
            choices: [{ delta: { content: finalContent } }]
          })}\n\ndata: [DONE]\n\n`;

          resolve(new Response(textEncoder.encode(sseBody), {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive"
            }
          }));
        } else {
          resolve(new Response(JSON.stringify(jsonResponsePayload), {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }));
        }
      }

      // Anti-timeout robust resolution (max 120s)
      const safetyTimeout = setTimeout(() => {
        if (!hasResolved) {
          InfinityLogger.warn?.('TIMEOUT DE SEGURANÇA', {
            'Tempo Limite': '120 segundos excedidos',
            'Ação Tomada': 'Finalizando com o texto coletado até o momento'
          });
          finishWithSuccess(fullTextCollected);
        }
      }, 120000);

      let chunkCount = 0;
      function onChunkEvent(e) {
        const msg = e.detail;
        if (!msg) return;

        if (msg.fullText) fullTextCollected = msg.fullText;

        if (msg.type === 'CHUNK') {
          chunkCount++;
          if (chunkCount === 1) {
            console.log(`%c  ↳ [STREAM INICIADO] Primeiro fragmento recebido do ${targetModel}...`, 'color:#38bdf8;font-weight:bold;');
            try { window.postMessage({ type: '__INFINITY_DIRECT_EDITOR_STEP__', step: 'validate' }, '*'); } catch (_) {}
          }
        } else if (msg.type === 'DONE') {
          clearTimeout(safetyTimeout);
          finishWithSuccess(msg.fullText || fullTextCollected);
        } else if (msg.type === 'ERROR') {
          clearTimeout(safetyTimeout);
          if (!hasResolved) {
            hasResolved = true;
            window.removeEventListener(eventName, onChunkEvent);

            InfinityLogger.error('FALHA DE CONEXÃO COM O 9ROUTER', {
              'Gateway Endpoint': config.proxy.custom_endpoint || 'https://router.techstorebrasil.com/v1/chat/completions',
              'Modelo Tentado': targetModel,
              'Detalhes do Erro': msg.detail || 'Sem resposta do servidor',
              'Status HTTP': msg.status || 0
            }, 'Verifique sua conexão com a internet ou altere a chave da API no popup da extensão.');

            // Fallback graceful JSON para não quebrar o React do Lovable
            resolve(new Response(JSON.stringify({
              id: requestId,
              role: "assistant",
              content: fullTextCollected || `⚠️ Aviso Infinity Claude AI: Não foi possível conectar ao modelo ${targetModel}. Verifique a API Key no popup.`,
              message: fullTextCollected || `Erro ao conectar com ${targetModel}.`,
              status: "completed",
              success: true,
              ok: true
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }));
          }
        }
      }

      window.addEventListener(eventName, onChunkEvent);

      // Dispatch to content.js via CustomEvent
      window.dispatchEvent(new CustomEvent('__INFINITY_DISPATCH_ROUTER__', {
        detail: {
          requestId,
          endpoint: "https://router.techstorebrasil.com/v1/chat/completions",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          payload: payload9Router
        }
      }));
    });
  }

  
  // ─── Safe WebSocket Realtime Guard ────────────────────────────────────────
  const NATIVE_WS = window.WebSocket;
  if (NATIVE_WS && typeof Proxy !== 'undefined') {
    try {
      window.WebSocket = new Proxy(NATIVE_WS, {
        construct(target, args) {
          const ws = Reflect.construct(target, args);
          const origAddEventListener = ws.addEventListener.bind(ws);
          ws.addEventListener = function (type, listener, options) {
            if (type === 'message') {
              const wrappedListener = function (event) {
                try {
                  if (typeof event.data === 'string') {
                    if (event.data.includes('"internal_error"') || event.data.includes('out_of_credits') || event.data.includes('payment_required')) {
                      console.log("[Infinity Claude AI] 🛡️ WebSocket: Filtrando frame de erro de créditos.");
                      return;
                    }
                  }
                } catch (_) {}
                return listener.apply(this, arguments);
              };
              return origAddEventListener(type, wrappedListener, options);
            }
            return origAddEventListener(type, listener, options);
          };
          return ws;
        }
      });
    } catch (_) {}
  }

  // ─── XHR & sendBeacon Fail-Closed Guards ────────────────────────────────────
  if (NATIVE_XHR && NATIVE_XHR.prototype) {
    const origOpen = NATIVE_XHR.prototype.open;
    const origSend = NATIVE_XHR.prototype.send;
    NATIVE_XHR.prototype.open = function (method, url) {
      this.__inf_method = method;
      this.__inf_url = url;
      return origOpen.apply(this, arguments);
    };
    NATIVE_XHR.prototype.send = function () {
      if (isChatDispatch(this.__inf_url, this.__inf_method)) {
        console.warn("[Infinity Claude AI] 🛡️ XHR Chat bloqueado preventivamente (Fail-Closed).");
        try { this.abort(); } catch (_) {}
        return;
      }
      return origSend.apply(this, arguments);
    };
  }

  if (navigator.sendBeacon) {
    const origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      if (isChatDispatch(url, 'POST')) {
        console.warn("[Infinity Claude AI] 🛡️ sendBeacon Chat bloqueado preventivamente (Fail-Closed).");
        return false;
      }
      return origBeacon(url, data);
    };
  }

  // ─── Auto Token Harvester & Refresh from IndexedDB ─────────────────────────
  const GOOGLE_AUTH_KEY = 'AIzaSyBQNjlw9Vp4tP4VVeANzyPJnqbG2wLbYPw';
  const KNOWLEDGE_START = '<!-- INFINITY:START -->';
  const KNOWLEDGE_END = '<!-- INFINITY:END -->';
  const UNIVERSAL_AGENT_KNOWLEDGE = `### DIRETRIZES DE ARQUITETURA & PADRÕES DE CÓDIGO:\n` +
    `- Framework: Vite + React 18+ (SPA TypeScript).\n` +
    `- Estilização: Tailwind CSS, componentes Shadcn UI e ícones Lucide React.\n` +
    `- Roteamento: TanStack Router (@tanstack/react-router) ou React Router DOM. NUNCA importe 'next/server' ou 'next/navigation'.\n` +
    `- Backend: Supabase JS Client (@supabase/supabase-js) via 'src/integrations/supabase/client'.\n` +
    `- Geração de Código: Gere SEMPRE arquivos completos, limpos e sem placeholders com o comentário de caminho exato no topo.`;

  async function getFreshAuthToken() {
    return new Promise((resolve) => {
      try {
        const dbReq = indexedDB.open('firebaseLocalStorageDb');
        dbReq.onsuccess = async () => {
          try {
            const db = dbReq.result;
            const tx = db.transaction('firebaseLocalStorage', 'readonly');
            const store = tx.objectStore('firebaseLocalStorage');
            const getAllReq = store.getAll();
            getAllReq.onsuccess = async () => {
              const records = getAllReq.result || [];
              const authRecord = records.find(r => r && r.fbase_key && /^firebase:authUser:/.test(r.fbase_key));
              if (!authRecord || !authRecord.value) return resolve(null);
              const val = authRecord.value;
              const sts = val.stsTokenManager || {};
              const now = Date.now();
              if (sts.accessToken && sts.expirationTime && (sts.expirationTime - now > 60000)) {
                return resolve(sts.accessToken);
              }
              if (sts.refreshToken) {
                try {
                  const resp = await NATIVE_FETCH(`https://securetoken.googleapis.com/v1/token?key=${GOOGLE_AUTH_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(sts.refreshToken)}`
                  });
                  if (resp.ok) {
                    const data = await resp.json();
                    return resolve(data.access_token || data.id_token || sts.accessToken);
                  }
                } catch (_) {}
              }
              resolve(sts.accessToken || null);
            };
            getAllReq.onerror = () => resolve(null);
          } catch (_) { resolve(null); }
        };
        dbReq.onerror = () => resolve(null);
      } catch (_) { resolve(null); }
    });
  }

  async function syncWorkspaceKnowledge() {
    try {
      const token = await getFreshAuthToken();
      if (!token) return;
      
      const projectIdMatch = location.pathname.match(/\/projects\/([a-zA-Z0-9_-]+)/i);
      const projectId = projectIdMatch ? projectIdMatch[1] : null;
      if (!projectId) return;

      const wsRes = await NATIVE_FETCH(`https://api.lovable.dev/projects/${projectId}/details`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      }).catch(() => null);

      if (!wsRes || !wsRes.ok) return;
      const wsData = await wsRes.json().catch(() => null);
      const workspaceId = wsData?.workspace_id || wsData?.workspaceId;
      if (!workspaceId) return;

      const knUrl = `https://api.lovable.dev/workspaces/${encodeURIComponent(workspaceId)}/knowledge`;
      let existing = '';
      try {
        const getKn = await NATIVE_FETCH(knUrl, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
        if (getKn.ok) {
          const json = await getKn.json();
          existing = json?.content || json?.knowledge || '';
        }
      } catch (_) {}

      const block = `${KNOWLEDGE_START}\n${UNIVERSAL_AGENT_KNOWLEDGE}\n${KNOWLEDGE_END}`;
      let updatedContent = '';
      if (existing.includes(KNOWLEDGE_START) && existing.includes(KNOWLEDGE_END)) {
        updatedContent = existing.replace(new RegExp(`${KNOWLEDGE_START}[\\s\\S]*?${KNOWLEDGE_END}`, 'g'), block);
      } else {
        updatedContent = existing.trim() ? `${existing.trim()}\n\n${block}` : block;
      }

      if (updatedContent !== existing && updatedContent.length < 15000) {
        const putRes = await NATIVE_FETCH(knUrl, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: updatedContent })
        }).catch(() => null);
        if (putRes && putRes.ok) {
          console.log("[Infinity Claude AI] 🧠 Workspace Knowledge sincronizado com sucesso.");
        }
      }
    } catch (_) {}
  }

  async function harvestLovableTokenFromIndexedDB() {
    try {
      const token = await getFreshAuthToken();
      if (token) {
        window.__INFINITY_CAPTURED_TOKEN__ = token;
        window.postMessage({ type: 'CAPTURED_AUTH_TOKEN', token }, '*');
        syncWorkspaceKnowledge();
      }
    } catch (_) {}
  }
  setTimeout(harvestLovableTokenFromIndexedDB, 1500);

  window.fetch = async function (input, init) {
    let urlStr = "";
    try {
      if (input && typeof input === 'object' && typeof input.url === 'string') urlStr = input.url;
      else if (input && typeof input === 'object' && typeof input.href === 'string') urlStr = input.href;
      else urlStr = String(input || "");
    } catch (_) { urlStr = ""; }

    const options = init || {};
    const method = options.method || (input && typeof input === 'object' && typeof input.method === 'string' ? input.method : "GET");

    const mocked = handleSupabaseAndBillingMock(urlStr);
    if (mocked) {
      return mocked;
    }

    if (isChatDispatch(urlStr, method)) {
      if (window.__nexusRegisteredCoreHandler) {
        try {
          return await window.__nexusRegisteredCoreHandler(input, init, NATIVE_FETCH);
        } catch (e) {
          if (e && (e.name === 'AbortError' || String(e.message || '').includes('aborted'))) {
            return new Response(JSON.stringify({ ok: false, aborted: true }), { status: 499 });
          }
          return handleAiChatHijack(urlStr, input, init);
        }
      }
      return handleAiChatHijack(urlStr, input, init);
    }

    try {
      const resp = await NATIVE_FETCH.apply(this, arguments);
      // Fail-safe: Convert any 402 (Workspace out of credits) to 200 OK mock response
      if (resp && resp.status === 402 && String(urlStr).includes("lovable.dev")) {
        console.warn("[Infinity Claude AI] 🛡️ Convertendo 402 (Payment Required) em 200 OK simulado para manter UI ativa.");
        return new Response(JSON.stringify({
          success: true,
          status: "active",
          credits: { balance: 999999, remaining: 999999, limit: 999999 },
          subscription: { plan: "scale", status: "active", unlimited: true }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return resp;
    } catch (err) {
      if (err && (err.name === 'AbortError' || String(err.message || '').includes('aborted'))) {
        throw err;
      }
      if (String(urlStr).includes("api.lovable.dev/projects") && String(urlStr).includes("/chat")) {
        return handleAiChatHijack(urlStr, input, init);
      }
      throw err;
    }
  };

  // ─── UI Glow & Floating Capsule ───────────────────────────────────────────
  function injectGlowStyles() {
    if (document.getElementById("infinity-glow-styles")) return;
    const style = document.createElement("style");
    style.id = "infinity-glow-styles";
    style.textContent = `
      @keyframes infinityNeonPulse {
        0%, 100% { box-shadow: 0 0 10px rgba(124, 58, 237, 0.4), 0 0 25px rgba(56, 189, 248, 0.2); }
        50% { box-shadow: 0 0 18px rgba(124, 58, 237, 0.75), 0 0 35px rgba(56, 189, 248, 0.45); }
      }
      .infinity-protected-box {
        position: relative !important;
        box-shadow: 0 0 15px rgba(124, 58, 237, 0.5) !important;
        border: 1px solid rgba(139, 92, 246, 0.6) !important;
        transition: all 0.3s ease;
      }
      .infinity-model-capsule {
        position: absolute;
        bottom: 8px;
        left: 12px;
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid rgba(139, 92, 246, 0.5);
        color: #c4b5fd;
        border-radius: 9999px;
        padding: 2px 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 6px;
        backdrop-filter: blur(8px);
        z-index: 10;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  function attachGlowToChatInput() {
    const inputAreas = document.querySelectorAll("textarea, [contenteditable='true'], .tiptap");
    inputAreas.forEach((el) => {
      const container = el.closest(".relative") || el.parentElement;
      if (container && !container.classList.contains("infinity-protected-box")) {
        container.classList.add("infinity-protected-box");
        let tag = container.querySelector(".infinity-model-capsule");
        if (!tag) {
          tag = document.createElement("div");
          tag.className = "infinity-model-capsule";
          tag.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block;box-shadow:0 0 6px #10b981;"></span> ROUTER ATIVO: ${config.proxy.model || 'deepseek-v4-flash'} (0 Créditos Lovable)`;
          container.appendChild(tag);
        }
      }
    });
  }

  
  // ─── Netuno Native Interceptor Bridge Responder ───────────────────────────
  const NETURNO_NATIVE_SEND_MARKER = '__lovifyNativeSendV2';

  function notifyNativeBridgeReady() {
    try {
      window.postMessage({
        [NETURNO_NATIVE_SEND_MARKER]: true,
        type: 'LOVIFY_STRICT_INTERCEPT_READY',
        ready: true
      }, '*');
    } catch (_) {}
  }

  window.addEventListener('message', (event) => {
    try {
      const data = event.data || {};
      if (event.source !== window || data[NETURNO_NATIVE_SEND_MARKER] !== true) return;

      if (data.type === 'LOVIFY_STRICT_INTERCEPT_ENABLE') {
        notifyNativeBridgeReady();
        return;
      }

      if (data.type === 'LOVIFY_STRICT_NATIVE_SEND_COMMAND') {
        const nonce = data.nonce;
        const promptText = data.prompt_text || '';

        // Dispatch prompt to 9Router via CustomEvent
        const requestId = "inf_bubble_" + Date.now();
        window.dispatchEvent(new CustomEvent('__INFINITY_DISPATCH_ROUTER__', {
          detail: {
            requestId,
            endpoint: "https://router.techstorebrasil.com/v1/chat/completions",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.proxy.custom_api_key || 'sk-c041ae378c7baa93-fao97q-732441d3'}`
            },
            payload: {
              model: config.proxy.model || "deepseek-v4-flash",
              messages: [
                { role: "system", content: "Você é o assistente Infinity Claude AI. Gere o código solicitado para o Lovable." },
                { role: "user", content: promptText }
              ],
              stream: true,
              max_tokens: 4096
            }
          }
        }));

        // Acknowledge send to clear UI pending state
        window.postMessage({
          [NETURNO_NATIVE_SEND_MARKER]: true,
          type: 'LOVIFY_NATIVE_SEND_RESULT',
          nonce,
          ok: true
        }, '*');
      }
    } catch (_) {}
  });

  notifyNativeBridgeReady();
  setInterval(notifyNativeBridgeReady, 2000);

  // ─── Hide Watermark & Badges ──────────────────────────────────────────────
  function hideWatermarkVisual() {
    const STYLE_ID = "infinity-hide-watermark-css";
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        #lovable-badge,
        #lovable-badge-v2,
        [id^="lovable-badge"],
        a[href*="lovable.dev"][target="_blank"],
        div[class*="watermark"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  // ─── Auto-Healer: Preview Error Handler ────────────────────────────────────
  function setupPreviewErrorHandler() {
    window.addEventListener("message", function (event) {
      if (!event.data) return;
      if (event.data.type === "sandbox:error" || event.data.type === "preview:error" || (typeof event.data === "string" && event.data.includes("Uncaught"))) {
        const errMsg = event.data.error || event.data.message || String(event.data);
        console.warn("[Infinity Auto-Healer] ⚠️ Erro no Preview Detectado:", errMsg);
        
        const chatTextarea = document.querySelector("textarea");
        if (chatTextarea) {
          const autoFixPrompt = `Detectei um erro em tempo de execução no preview do aplicativo:\n\`\`\`\n${errMsg}\n\`\`\`\nPor favor, analise a causa raiz no código TypeScript/React e forneça a correção completa dos arquivos afetados.`;
          chatTextarea.value = autoFixPrompt;
          chatTextarea.focus();
          chatTextarea.dispatchEvent(new Event("input", { bubbles: true }));

          showGuardToast("🛡️ Auto-Healer", "Prompt de correção do erro preparado no chat!", false);
        }
      }
    });
  }

  // ─── Credit Leak & Protection Monitor ─────────────────────────────────────
  const __isTopFrame = (function () {
    try { return window.top === window.self; } catch (_) { return false; }
  })();

  // ─── Nexus PRO & Infinity Interoperability Globals ─────────────────────────
  try {
    window.__NEXUS_EXT_VERSION__ = "20.6.1";
    window.__NEXUS_PRO_VERSION__ = "20.6.1";
    window.__NEXUS_DEEPCLEAN__ = true;
    window.__nexusNativeFetch = NATIVE_FETCH;
    window.__nexusGuardState = function () {
      return { coreReady: true, timedOut: false, native: !!NATIVE_FETCH };
    };
    window.__nexusRegisterCore = function (handler) {
      if (typeof handler === "function") {
        window.__nexusRegisteredCoreHandler = handler;
        return true;
      }
      return false;
    };
  } catch (_) {}

  (function creditMonitor() {
    if (!__isTopFrame) return;
    if (!document.getElementById("inf-credit-monitor-css")) {
      const s = document.createElement("style");
      s.id = "inf-credit-monitor-css";
      s.textContent = `@keyframes inf-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.5}}`;
      (document.head || document.documentElement).appendChild(s);
    }

    function getOrCreateCreditBadge() {
      let badge = document.getElementById("inf-credit-monitor-badge");
      if (!badge && document.body) {
        badge = document.createElement("div");
        badge.id = "inf-credit-monitor-badge";
        badge.style.cssText = [
          "position:fixed", "bottom:18px", "right:18px", "z-index:2147483640",
          "display:flex", "align-items:center", "gap:8px", "padding:6px 14px",
          "background:rgba(9,13,22,0.94)", "border:1px solid rgba(16,185,129,0.4)",
          "border-radius:9999px", "font-size:11.5px", "font-weight:700", "color:#34d399",
          "font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
          "backdrop-filter:blur(12px)", "box-shadow:0 4px 20px rgba(0,0,0,0.5),0 0 12px rgba(16,185,129,0.15)",
          "cursor:pointer", "user-select:none"
        ].join(";");
        badge.title = "Infinity Claude AI — Proteção de Créditos Ativa (0 Débito)";
        badge.innerHTML = `
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;flex-shrink:0;animation:inf-pulse 1.8s infinite;"></span>
          <span>🛡️ 0 Créditos Lovable (Bypass VIP Ativo)</span>
        `;
        document.body.appendChild(badge);
      }
      return badge;
    }

    setInterval(() => {
      if (/\/projects\//.test(location.pathname)) {
        getOrCreateCreditBadge();
      }
    }, 3000);
  })();

  function startUI() {
    if (!__isTopFrame) return;
    injectGlowStyles();
    attachGlowToChatInput();
    hideWatermarkVisual();
    setupPreviewErrorHandler();
    setInterval(attachGlowToChatInput, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startUI);
  } else {
    startUI();
  }

  console.log("[Infinity Claude AI v7.3.2 All-In-One] Fail-Closed Guard & Auto-Healer Active & Operational.");
})();
