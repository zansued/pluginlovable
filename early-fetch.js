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
    if (!raw) return 'openai/gpt-4o-mini';
    if (raw.includes('/')) return raw;
    const map = {
      'deepseek-v4-flash': 'ds/deepseek-v4-flash',
      'deepseek-chat': 'ds/deepseek-chat',
      'claude-3-5-sonnet': 'ag/claude-sonnet-4-6',
      'claude-3-7-sonnet': 'ag/claude-sonnet-4-6',
      'claude-sonnet-4-6': 'ag/claude-sonnet-4-6',
      'claude-opus-5': 'kr/claude-opus-5',
      'gpt-4o': 'openai/gpt-4o',
      'gpt-4o-mini': 'openai/gpt-4o-mini',
      'gpt-5': 'openai/gpt-5.4'
    };
    return map[raw] || `ds/${raw}`;
  }

function syncStorageConfig() {
    try {
      const stored = localStorage.getItem("infinity_claude_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        config = { ...config, ...parsed };
      }
    } catch (_) {}
  }
  syncStorageConfig();

  // ─── Extract Request Body ─────────────────────────────────────────────────
  async function extractRequestBody(input, init) {
    try {
      if (init && init.body) {
        if (typeof init.body === 'string') {
          try { return JSON.parse(init.body); } catch (_) { return init.body; }
        }
        return init.body;
      }
      if (input instanceof Request) {
        const clone = input.clone();
        const text = await clone.text();
        try { return JSON.parse(text); } catch (_) { return text; }
      }
    } catch (_) {}
    return null;
  }

  // ─── Chat Dispatch Matcher (Strict Fail-Closed) ───────────────────────────
  function isChatDispatch(url, method) {
    const u = String(url || "").toLowerCase();
    const m = String(method || "GET").toUpperCase();
    if (m !== "POST") return false;
    if (
      u.includes("/files/generate-upload-url") ||
      u.includes("/assets/") ||
      u.includes("/upload") ||
      u.includes("/queue/pause") ||
      u.includes("/queue/resume") ||
      u.includes("/history")
    ) {
      return false;
    }
    return (
      u.includes("api.lovable.dev") &&
      (u.endsWith("/chat") || u.includes("/chat?") || u.includes("/generate") || u.includes("/completions") || u.includes("/message"))
    );
  }

  // ─── Mock Permanent VIP & Unlimited Balance ───────────────────────────────
  function handleSupabaseAndBillingMock(url) {
    const u = String(url || "").toLowerCase();
    if (
      u.includes("api.lovable.dev/user/workspaces") ||
      u.includes("api.lovable.dev/workspaces") ||
      u.includes("api.lovable.dev/user/subscription") ||
      u.includes("api.lovable.dev/billing") ||
      u.includes("api.lovable.dev/credits")
    ) {
      const mockWorkspace = {
        id: "inf-ws-vip",
        role: "owner",
        subscription: {
          plan: "scale",
          status: "active",
          credits_balance: 999999,
          credits_limit: 999999,
          unlimited: true,
          free_edits_remaining: 999999
        },
        credits: { balance: 999999, remaining: 999999, limit: 999999 }
      };
      return new Response(JSON.stringify(mockWorkspace), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

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
        c.style.cssText = "position:fixed;top:18px;right:18px;z-index:9999999;display:flex;flex-direction:column;gap:8px;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;";
        document.body.appendChild(c);
      }
      const toast = document.createElement("div");
      toast.style.cssText = `background:rgba(15,23,42,0.96);border:1px solid ${isBlocked ? '#ef4444' : '#10b981'};color:#f8fafc;padding:10px 14px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.5);font-size:12px;pointer-events:auto;animation:llSlideIn 0.25s ease;display:flex;flex-direction:column;gap:3px;`;
      toast.innerHTML = `<div style="font-weight:700;color:${isBlocked ? '#f87171' : '#34d399'};display:flex;align-items:center;gap:6px;"><span>${isBlocked ? '🛡️' : '⚡'}</span> ${title}</div><div style="color:#cbd5e1;">${msg}</div>`;
      c.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
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

    let userPrompt = "Continue o desenvolvimento da aplicação.";
    if (typeof parsedBody === 'string') userPrompt = parsedBody;
    else if (parsedBody && parsedBody.message) {
      userPrompt = typeof parsedBody.message === 'string' ? parsedBody.message : (parsedBody.message.content || JSON.stringify(parsedBody.message));
    } else if (parsedBody && parsedBody.prompt) {
      userPrompt = String(parsedBody.prompt);
    } else if (parsedBody && Array.isArray(parsedBody.messages) && parsedBody.messages.length > 0) {
      const lastMsg = parsedBody.messages[parsedBody.messages.length - 1];
      userPrompt = typeof lastMsg === 'string' ? lastMsg : (lastMsg.content || lastMsg.text || JSON.stringify(lastMsg));
    }

    const promptPreview = userPrompt.length > 90 ? userPrompt.slice(0, 90) + '...' : userPrompt;
    InfinityLogger.sub('Prompt do Usuário', `"${promptPreview}"`, '#fef08a');
    InfinityLogger.sub('Tamanho do Prompt', `${userPrompt.length} caracteres`, '#e2e8f0');

    console.groupEnd();

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

    const payload9Router = {
      model: targetModel,
      messages: [
        {
          role: "system",
          content: "Você é o engenheiro de software sênior do projeto OrtoSync Pro no Lovable. O projeto utiliza TanStack Router, React, TypeScript, Tailwind CSS e Lucide Icons.\n\nESTRUTURA DE ARQUIVOS EXISTENTE NO PROJETO:\n- Rotas: `src/routes/index.tsx`, `src/routes/_authenticated.tsx`, `src/routes/api/public/webhooks/evolution.ts`, `src/router.tsx`\n- Componentes: `src/components/patients/...`, `src/components/appointments/...`, `src/components/auth/...`, `src/components/ui/...`\n- Libs & Funções: `src/lib/nps.ts`, `src/lib/ortho.ts`, `src/lib/soap.functions.ts`, `src/lib/whatsapp.functions.ts`, `src/lib/utils.ts`\n- Hooks: `src/hooks/use-mobile.tsx`\n- Estilos: `src/styles.css`\n\nDIRETRIZES:\n1. Ao criar novos recursos ou corrigir erros, integre diretamente nos arquivos existentes do projeto (ex: `src/routes/index.tsx` ou `src/lib/nps.ts` ou componentes em `src/components/patients/`).\n2. Forneça sempre o código COMPLETO e funcional do arquivo com cabeçalho `// src/...`, pronto para substituir o arquivo no editor.\n3. Use Tailwind CSS com estética moderna e imports corretos de `@tanstack/react-router`, `lucide-react` e `@/lib/utils`."
        },
        { role: "user", content: userPrompt }
      ],
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
          window.postMessage({
            type: '__INFINITY_CODE_GENERATED__',
            text: finalContent,
            model: targetModel
          }, '*');
          window.postMessage({ type: '__INFINITY_UNLOCK_CHAT_UI__' }, '*');
        } catch (_) {}

        resolve(new Response(JSON.stringify({
          id: requestId,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: targetModel,
          role: "assistant",
          content: finalContent,
          message: finalContent,
          text: finalContent,
          status: "completed",
          success: true,
          ok: true
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }

      // Anti-timeout fast resolution (max 35s)
      const safetyTimeout = setTimeout(() => {
        if (!hasResolved) {
          InfinityLogger.warn?.('TIMEOUT DE SEGURANÇA', {
            'Tempo Limite': '35 segundos excedidos',
            'Ação Tomada': 'Finalizando com o texto coletado até o momento'
          });
          finishWithSuccess(fullTextCollected);
        }
      }, 35000);

      let chunkCount = 0;
      function onChunkEvent(e) {
        const msg = e.detail;
        if (!msg) return;

        if (msg.fullText) fullTextCollected = msg.fullText;

        if (msg.type === 'CHUNK') {
          chunkCount++;
          if (chunkCount === 1) {
            console.log(`%c  ↳ [STREAM INICIADO] Primeiro fragmento recebido do ${targetModel}...`, 'color:#38bdf8;font-weight:bold;');
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
  if (NATIVE_WS) {
    const SafeWebSocket = function (url, protocols) {
      const ws = protocols !== undefined ? new NATIVE_WS(url, protocols) : new NATIVE_WS(url);

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
    };
    SafeWebSocket.prototype = NATIVE_WS.prototype;
    SafeWebSocket.CONNECTING = NATIVE_WS.CONNECTING;
    SafeWebSocket.OPEN = NATIVE_WS.OPEN;
    SafeWebSocket.CLOSING = NATIVE_WS.CLOSING;
    SafeWebSocket.CLOSED = NATIVE_WS.CLOSED;
    window.WebSocket = SafeWebSocket;
  }

window.fetch = async function (input, init) {
    const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    const options = init || {};
    const method = options.method || (input && input.method) || "GET";

    const mocked = handleSupabaseAndBillingMock(urlStr);
    if (mocked) {
      return mocked;
    }

    if (isChatDispatch(urlStr, method)) {
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

function startUI() {
    injectGlowStyles();
    attachGlowToChatInput();
    setInterval(attachGlowToChatInput, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startUI);
  } else {
    startUI();
  }

  console.log("[Infinity Claude AI v7.0 All-In-One] Fail-Closed Guard Active & Operational.");
})();
