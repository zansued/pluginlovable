// Dev. OppsEvo
// ─── Hub Workbench (3.4) — IA, automação, projeto, colaboração e cache ───────
// NÃO altera interceptSend / proxy de envio: só UX auxiliar GET / improve-prompt /
// clipboard / storage local. PROXY_FETCH é usado apenas para GET (ex.: código fonte).

(function llWorkbench() {
  'use strict';

  const SUPABASE_URL = 'http://127.0.0.1/';
  const IMPROVE_API_ENDPOINT = `${SUPABASE_URL}/functions/v1/improve-prompt`;

  const CONTEXT_TIPS = [
    'Especifique formato de saída (tabelas, bullets, código) já no primeiro prompt.',
    'Peça primeiro um plano curto antes de gerar código longo.',
    'Mencione stack (React, Supabase, Tailwind…) na primeira linha do pedido.',
    'Para bugs: cole o erro exato + o que já tentou; evite “não funciona”.',
    'Peça commits pequenos e testáveis quando pedir refactor.',
    'Inclua restrições: performance, SEO, ou acessibilidade quando importar.',
    'Use inglês apenas para nomes de variáveis; descrições podem ficar em português.',
    'Ao pedir UI, indique breakpoints (mobile primeiro ou desktop).'
  ];

  const responseCache = new Map(); // url → { at, ok, status, body }
  const CACHE_TTL_MS = 110000;

  function isExtensionValid() {
    try {
      return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
    } catch (_) {
      return false;
    }
  }

  function newLocalId(p) {
    return (p || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function normalizeText(t) {
    return String(t || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();
  }

  function findEditor() {
    return (
      document.querySelector('textarea[data-testid="chat-input"]') ||
      document.querySelector('textarea[placeholder*="message" i]') ||
      document.querySelector('textarea[placeholder*="What do you want" i]') ||
      document.querySelector('div[contenteditable="true"][aria-label*="Chat" i]') ||
      document.querySelector('.ProseMirror[contenteditable="true"]') ||
      null
    );
  }

  function getEditorText(ed) {
    if (!ed) return '';
    if (ed.tagName === 'TEXTAREA') return normalizeText(ed.value);
    return normalizeText(ed.innerText || ed.textContent);
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
        ed.innerText = value;
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        ed.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (_) {}
  }

  function detectProjectId() {
    const u = window.location.href;
    let m = u.match(/lovable\.dev\/projects\/([^/?#]+)/i);
    if (m && m[1]) return m[1];
    m = u.match(/lovable\.dev\/gpt\/([^/?#]+)/i);
    return m?.[1] || null;
  }

  function wbToast(icon, msg, ms = 3200) {
    let toast = document.getElementById('ll-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'll-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    toast.classList.add('ll-show');
    clearTimeout(toast._wb);
    toast._wb = setTimeout(() => toast.classList.remove('ll-show'), ms);
  }

  function proxyFetchGet(url, headers) {
    const key = `GET:${url}`;
    const now = Date.now();
    const hit = responseCache.get(key);
    if (hit && now - hit.at < CACHE_TTL_MS) return Promise.resolve(hit);

    return new Promise((resolve, reject) => {
      if (!isExtensionValid()) return resolve({ ok: false, status: 0, body: '{}', at: now });
      try {
        chrome.runtime.sendMessage(
          { type: 'PROXY_FETCH', url, method: 'GET', headers: headers || {}, body: null },
          (resp) => {
            if (chrome.runtime?.lastError) reject(new Error(chrome.runtime.lastError.message));
            else {
              const r = typeof resp?.body === 'string' ? resp : { ...(resp || {}), body: '{}' };
              const row = { ...r, at: now };
              if (resp && resp.ok && !String(url).match(/chat|send-message/i)) responseCache.set(key, row);
              resolve(row);
            }
          }
        );
      } catch (err) {
        resolve({ ok: false, status: 0, body: '{}', at: now });
      }
    });
  }

  async function getAuthHeaders() {
    const data = await new Promise((r) =>
      chrome.storage.local.get(['ll_token', 'll_lovable_auth_token', 'captured_auth_token', 'lovable_api_token'], r)
    );
    const bearer =
      data.ll_lovable_auth_token ||
      data.lovable_api_token ||
      data.captured_auth_token ||
      '';
    const h = { Accept: 'application/json, text/plain;q=0.9' };
    if (bearer) h.Authorization = `Bearer ${bearer}`;
    return { headers: h, extensionToken: data.ll_token };
  }

  async function improvePrompt(promptText, hint) {
    const { extensionToken } = await getAuthHeaders();
    if (!extensionToken) throw new Error('Faça login na extensão primeiro.');
    const body = hint ? { prompt: `${hint}\n\n${promptText}` } : { prompt: promptText };
    const res = await fetch(IMPROVE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${extensionToken}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || data?.message || `IA (${res.status})`);
    if (!data?.improved_prompt) throw new Error('Resposta vazia da IA.');
    return data.improved_prompt;
  }

  function logActivity(message) {
    const pid = detectProjectId() || 'global';
    chrome.storage.local.get(['ll_wb_activity'], (d) => {
      const act = d.ll_wb_activity || {};
      const list = Array.isArray(act[pid]) ? act[pid] : [];
      list.push({ t: Date.now(), message });
      act[pid] = list.slice(-48);
      chrome.storage.local.set({ ll_wb_activity: act });
      refreshDashboard(pid);
    });
  }

  function ensureDefaults(cb) {
    if (!isExtensionValid()) {
      if (typeof cb === 'function') cb();
      return;
    }
    try {
      chrome.storage.local.get(
        ['ll_wb_snippets', 'll_wb_macros', 'll_wb_templates', 'll_wb_settings'],
        (d) => {
          if (chrome.runtime?.lastError || !d) {
            if (typeof cb === 'function') cb();
            return;
          }
          const patch = {};
          if (!Array.isArray(d.ll_wb_snippets) || !d.ll_wb_snippets.length) {
            patch.ll_wb_snippets = [
              { id: newLocalId('s'), title: 'README', body: 'Gere README.md em PT-BR: visão geral, instalação, scripts npm e MIT.' },
              { id: newLocalId('s'), title: 'A11y audit', body: 'Revise este componente quanto a acessibilidade (ARIA, foco, contraste) e sugira correções objetivas.' }
            ];
          }
          if (!Array.isArray(d.ll_wb_macros) || !d.ll_wb_macros.length) {
            patch.ll_wb_macros = [
              { id: 'm1', name: 'Smoke test', text: 'Liste passos rápidos de smoke test (UI happy path) antes de eu pedir merges.' },
              { id: 'm2', name: 'Lint + tipos', text: 'Rode revisão conceitual: consistência TS, ESLint típico e props não usadas — só orientação, sem aplicar patches automáticos.' }
            ];
          }
          if (!Array.isArray(d.ll_wb_templates) || !d.ll_wb_templates.length) {
            patch.ll_wb_templates = [
              { id: 't1', name: 'Feature curta', text: '[Objetivo]\n[Critérios de aceite]\n[Não mexer]\n[Stack atual]' },
              { id: 't2', name: 'Bug', text: '[Sintomas]\n[Passos reproduzir]\n[Screenshots/console]\n[Expectativa]' }
            ];
          }
          if (!d.ll_wb_settings || typeof d.ll_wb_settings !== 'object') {
            patch.ll_wb_settings = { autosave: true, preload: true, smartCache: true };
          }
          if (Object.keys(patch).length && isExtensionValid()) {
            chrome.storage.local.set(patch, cb);
          } else if (typeof cb === 'function') {
            cb();
          }
        }
      );
    } catch (_) {
      if (typeof cb === 'function') cb();
    }
  }


  function mountHub() {
    const root = document.getElementById('ll-hub-root');
    if (!root || root.dataset.llWbMounted === '1') return;
    root.innerHTML = `
      <div class="ll-hub">
        <div class="ll-hub-bar">
          <span class="ll-hub-brand">Laboratório</span>
          <span class="ll-hub-version">/workbench</span>
        </div>
        <details class="ll-hub-acc ll-hub-open-init" open>
          <summary>1 · IA integrada · Claude / Netuno</summary>
          <div class="ll-hub-body">
            <p class="ll-hub-tip" id="ll-wb-tip"></p>
            <div class="ll-hub-row">
              <button type="button" class="ll-hub-btn ll-hub-btn-primary" id="ll-wb-opt-prompt">Otimizar prompt (IA)</button>
              <button type="button" class="ll-hub-btn" id="ll-wb-ctx-refresh">Outra sugestão</button>
            </div>
            <label class="ll-hub-lbl">Trecho para análise rápida (ou cole no chat antes)</label>
            <textarea class="ll-hub-ta" id="ll-wb-code" placeholder="Cole código ou erro…"></textarea>
            <button type="button" class="ll-hub-btn ll-hub-btn-primary" id="ll-wb-analyze">Analisar com IA</button>
            <p class="ll-hub-micro">Mesmo canal da ação «Melhorar prompt» (Edge Function segura).</p>
          </div>
        </details>

        <details class="ll-hub-acc">
          <summary>2 · Automação avançada</summary>
          <div class="ll-hub-body">
            <label class="ll-hub-inline"><input type="checkbox" id="ll-wb-autosave" checked/> Auto-save do rascunho do chat (~40s)</label>
            <label class="ll-hub-inline"><input type="checkbox" id="ll-wb-preload" checked/> Pré-busca leve do fonte ao abrir</label>
            <div class="ll-hub-row">
              <button type="button" class="ll-hub-btn" id="ll-wb-restore">Restaurar rascunho salvo</button>
              <button type="button" class="ll-hub-btn" id="ll-wb-run-macro">Rodar macro</button>
            </div>
            <select class="ll-hub-select" id="ll-wb-macro-pick"></select>
            <p class="ll-hub-micro">Atalhos: <kbd>Alt+Shift+L</kbd> painel · <kbd>Alt+Shift+S</kbd> primeiro snippet.</p>
          </div>
        </details>

        <details class="ll-hub-acc" id="ll-wb-acc-dash">
          <summary>3 · Análise de projeto · micro-dashboard</summary>
          <div class="ll-hub-body" id="ll-wb-dash">
            <div class="ll-hub-metric-grid">
              <div class="ll-hub-metric"><span id="ll-wb-m-snippets">—</span><small>snippets</small></div>
              <div class="ll-hub-metric"><span id="ll-wb-m-events">—</span><small>eventos</small></div>
              <div class="ll-hub-metric ll-hub-metric-wide"><span id="ll-wb-m-complete">beta</span><small>estimativa curso (heurística)</small></div>
            </div>
            <label class="ll-hub-lbl">Histórico recente</label>
            <ul class="ll-hub-log" id="ll-wb-log"></ul>
            <button type="button" class="ll-hub-btn" id="ll-wb-dash-refresh">Atualizar</button>
          </div>
        </details>

        <details class="ll-hub-acc">
          <summary>4 · Colaboração</summary>
          <div class="ll-hub-body">
            <button type="button" class="ll-hub-btn ll-hub-btn-primary" id="ll-wb-share">Copiar texto do chat (compartilhar)</button>
            <label class="ll-hub-lbl">Templates rápidos</label>
            <select class="ll-hub-select" id="ll-wb-tpl-pick"></select>
            <button type="button" class="ll-hub-btn" id="ll-wb-tpl-insert">Inserir template</button>
            <label class="ll-hub-lbl">Biblioteca de snippets · título · corpo · salvar</label>
            <input class="ll-hub-input" id="ll-wb-snippet-title" placeholder="Ex.: Footer"/>
            <textarea class="ll-hub-ta ll-hub-ta-sm" id="ll-wb-snippet-body"></textarea>
            <div class="ll-hub-row">
              <button type="button" class="ll-hub-btn ll-hub-btn-primary" id="ll-wb-snippet-save">Guardar snippet</button>
              <button type="button" class="ll-hub-btn" id="ll-wb-snippet-insert">Inserir 1º</button>
            </div>
            <ul class="ll-hub-mini-list" id="ll-wb-snippet-preview"></ul>
          </div>
        </details>

        <details class="ll-hub-acc">
          <summary>5 · Performance · cache leve GET</summary>
          <div class="ll-hub-body">
            <label class="ll-hub-inline"><input type="checkbox" id="ll-wb-smartcache" checked/> Cache inteligente (GET API, TTL ~2 min)</label>
            <button type="button" class="ll-hub-btn" id="ll-wb-warm-cache">Pré-carregar source-code agora</button>
            <button type="button" class="ll-hub-btn" id="ll-wb-cache-clear">Limpar cache só desta página</button>
            <p class="ll-hub-micro">Não interfere no envio: só reuso opcional antes de outros GET ao Lovable API.</p>
          </div>
        </details>
      </div>
    `;

    bindHub(root);
    root.dataset.llWbMounted = '1';
    preloadIfAllowed();
    logActivity('Laboratório disponível.');
    rotateTip(document.getElementById('ll-wb-tip'));
  }

  function rotateTip(el) {
    if (!el) return;
    const i = Math.floor(Math.random() * CONTEXT_TIPS.length);
    el.textContent = CONTEXT_TIPS[i];
  }

  function refreshSnippetPreview() {
    const ul = document.getElementById('ll-wb-snippet-preview');
    if (!ul) return;
    chrome.storage.local.get(['ll_wb_snippets'], (d) => {
      const arr = Array.isArray(d.ll_wb_snippets) ? d.ll_wb_snippets : [];
      ul.innerHTML = '';
      arr.slice(0, 8).forEach((s) => {
        const li = document.createElement('li');
        li.textContent = s.title || '(sem título)';
        ul.appendChild(li);
      });
    });
  }

  function fillSelectsMacrosTemplates() {
    chrome.storage.local.get(['ll_wb_macros', 'll_wb_templates'], (d) => {
      const msel = document.getElementById('ll-wb-macro-pick');
      const tpl = document.getElementById('ll-wb-tpl-pick');
      if (!msel || !tpl) return;
      msel.innerHTML = '';
      (d.ll_wb_macros || []).forEach((m, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = m.name || `Macro ${i + 1}`;
        msel.appendChild(o);
      });
      tpl.innerHTML = '';
      (d.ll_wb_templates || []).forEach((t, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = t.name || `Template ${i + 1}`;
        tpl.appendChild(o);
      });
    });
  }

  function refreshDashboard(pid) {
    const pidKey = pid || detectProjectId() || 'global';
    chrome.storage.local.get(
      ['ll_wb_snippets', 'll_wb_activity', 'll_wb_settings', `ll_wb_autosave_${pidKey}`],
      (d) => {
        const elSn = document.getElementById('ll-wb-m-snippets');
        if (!elSn) return;
        const snips = Array.isArray(d.ll_wb_snippets) ? d.ll_wb_snippets.length : 0;
        const ev = Array.isArray((d.ll_wb_activity || {})[pidKey]) ? (d.ll_wb_activity[pidKey] || []).length : 0;
        const drafts = d[`ll_wb_autosave_${pidKey}`]?.text ? 1 : 0;
        document.getElementById('ll-wb-m-snippets').textContent = String(snips);
        document.getElementById('ll-wb-m-events').textContent = String(ev);
        const pct = Math.min(88, snips * 4 + drafts * 8 + Math.min(ev * 5, 40));
        const el = document.getElementById('ll-wb-m-complete');
        if (el) el.textContent = `~${pct}%`;
        const log = document.getElementById('ll-wb-log');
        if (log) {
          log.innerHTML = '';
          (((d.ll_wb_activity || {})[pidKey]) || [])
            .slice(-6)
            .reverse()
            .forEach((row) => {
              const li = document.createElement('li');
              let currentTab = 'snippets';
  let activeProjectId = null;
              const t = row.t ? new Date(row.t) : null;
              li.textContent = (t ? t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' · ' : '') + (row.message || '');
              log.appendChild(li);
            });
          if (!log.childElementCount) {
            const li = document.createElement('li');
            li.textContent = 'Sem eventos ainda — use as ações do hub.';
            log.appendChild(li);
          }
        }
      }
    );
  }

  function bindHub(root) {
    chrome.storage.local.get(['ll_wb_settings'], (d) => {
      const cfg = d.ll_wb_settings || { autosave: true, preload: true, smartCache: true };
      const a = root.querySelector('#ll-wb-autosave');
      const p = root.querySelector('#ll-wb-preload');
      const c = root.querySelector('#ll-wb-smartcache');
      if (a) a.checked = !!cfg.autosave;
      if (p) p.checked = cfg.preload !== false;
      if (c) c.checked = cfg.smartCache !== false;
    });

    root.querySelector('#ll-wb-autosave')?.addEventListener('change', (e) =>
      chrome.storage.local.get(['ll_wb_settings'], (d) =>
        chrome.storage.local.set({
          ll_wb_settings: Object.assign({}, d.ll_wb_settings || {}, { autosave: !!e.target.checked })
        })
      )
    );
    root.querySelector('#ll-wb-preload')?.addEventListener('change', (e) =>
      chrome.storage.local.get(['ll_wb_settings'], (d) =>
        chrome.storage.local.set(
          {
            ll_wb_settings: Object.assign({}, d.ll_wb_settings || {}, { preload: !!e.target.checked })
          },
          () => preloadIfAllowed()
        )
      )
    );
    root.querySelector('#ll-wb-smartcache')?.addEventListener('change', (e) =>
      chrome.storage.local.get(['ll_wb_settings'], (d) =>
        chrome.storage.local.set({
          ll_wb_settings: Object.assign({}, d.ll_wb_settings || {}, { smartCache: !!e.target.checked })
        })
      )
    );

    root.querySelector('#ll-wb-tip-refresh-alt')?.addEventListener('click', () => rotateTip(root.querySelector('#ll-wb-tip')));
    root.querySelector('#ll-wb-ctx-refresh')?.addEventListener('click', () => rotateTip(root.querySelector('#ll-wb-tip')));

    root.querySelector('#ll-wb-opt-prompt')?.addEventListener('click', async () => {
      const ed = findEditor();
      const cur = getEditorText(ed);
      if (!cur) return wbToast('⚠️', 'Escreva um prompt primeiro.');
      try {
        wbToast('🤖', 'Otimizando…', 3800);
        const out = await improvePrompt(cur, '[Instruções: gere um prompt técnico otimizado, explícito, em português, sem fluff.]');
        setEditorText(ed, out);
        logActivity('IA: prompt otimizado');
        wbToast('✔', 'Prompt otimizado no chat.');
      } catch (err) {
        wbToast('❌', err?.message || 'Falha na IA.', 5600);
      }
    });

    root.querySelector('#ll-wb-analyze')?.addEventListener('click', async () => {
      const ed = findEditor();
      const extra = normalizeText(document.getElementById('ll-wb-code').value || '');
      const base = normalizeText(extra || getEditorText(ed));
      if (!base) return wbToast('⚠️', 'Informe texto ou cole no código.');
      try {
        wbToast('🔍', 'Analisando…', 4600);
        const out = await improvePrompt(base, `[Análise de código/arquitetura: resposta em bullets curtos, português, sem alterar ficheiros.]\n[Foco técnico.]\n\n`);
        document.getElementById('ll-wb-code').value = out;
        logActivity('IA: análise executada');
        wbToast('✔', 'Análise pronta (caixa «trecho»).');
      } catch (err) {
        wbToast('❌', err?.message || 'Falha na análise.', 5600);
      }
    });

    root.querySelector('#ll-wb-restore')?.addEventListener('click', () => {
      const pid = detectProjectId() || 'sessao';
      chrome.storage.local.get([`ll_wb_autosave_${pid}`], (d) => {
        const row = d[`ll_wb_autosave_${pid}`];
        if (!row?.text) return wbToast('ℹ', 'Sem rascunho guardado para este projeto.');
        const ed = findEditor();
        if (!ed) return wbToast('⚠', 'Chat não encontrado.');
        setEditorText(ed, `${getEditorText(ed)}\n\n${row.text}`.trim());
        logActivity('Rascunho restaurado');
        wbToast('📂', 'Rascunho anexado ao chat.');
      });
    });

    root.querySelector('#ll-wb-run-macro')?.addEventListener('click', () => {
      chrome.storage.local.get(['ll_wb_macros'], (d) => {
        const arr = Array.isArray(d.ll_wb_macros) ? d.ll_wb_macros : [];
        const ix = Number(document.getElementById('ll-wb-macro-pick')?.value || 0);
        const m = arr[ix];
        if (!m?.text) return wbToast('⚠', 'Sem texto de macro.');
        const ed = findEditor();
        if (!ed) return wbToast('⚠', 'Chat não encontrado.');
        setEditorText(ed, normalizeText(`${getEditorText(ed)}\n\n${m.text}`.trim()));
        logActivity('Macro aplicada');
        wbToast('⚡', `Macro "${m.name || ix}" aplicada.`);
      });
    });

    root.querySelector('#ll-wb-share')?.addEventListener('click', async () => {
      const ed = findEditor();
      const txt = getEditorText(ed);
      const pid = detectProjectId() || 'projeto';
      if (!txt) return wbToast('⚠', 'Chat vazio.');
      const blob = `# Netuno · ${pid}\n\n${txt}`;
      try {
        await navigator.clipboard.writeText(blob);
        wbToast('📋', 'Texto copiado para área de transferência.');
        logActivity('Partilhou texto do chat');
      } catch (_) {
        wbToast('❌', 'Clipboard bloqueado — use CTRL+C.', 5000);
      }
    });

    root.querySelector('#ll-wb-tpl-insert')?.addEventListener('click', () => {
      chrome.storage.local.get(['ll_wb_templates'], (d) => {
        const arr = d.ll_wb_templates || [];
        const ix = Number(document.getElementById('ll-wb-tpl-pick')?.value || 0);
        const t = arr[ix];
        if (!t?.text) return wbToast('⚠', 'Sem template.');
        const ed = findEditor();
        if (!ed) return wbToast('⚠', 'Chat não encontrado.');
        setEditorText(ed, normalizeText(`${getEditorText(ed)}\n\n${t.text}`.trim()));
        logActivity(`Template "${t.name || ix}"`);
        wbToast('📄', 'Template inserido.');
      });
    });

    root.querySelector('#ll-wb-snippet-save')?.addEventListener('click', () => {
      const title = normalizeText(document.getElementById('ll-wb-snippet-title').value);
      const body = normalizeText(document.getElementById('ll-wb-snippet-body').value);
      if (!title || !body) return wbToast('⚠', 'Preencha título e corpo.');
      chrome.storage.local.get(['ll_wb_snippets'], (d) => {
        const arr = Array.isArray(d.ll_wb_snippets) ? d.ll_wb_snippets : [];
        arr.unshift({ id: newLocalId('sn'), title, body });
        chrome.storage.local.set({ ll_wb_snippets: arr }, () => {
          refreshSnippetPreview();
          fillSelectsMacrosTemplates();
          document.getElementById('ll-wb-snippet-body').value = '';
          wbToast('✔', 'Snippet guardado.');
          logActivity(`Snippet novo: ${title}`);
          refreshDashboard();
        });
      });
    });

    root.querySelector('#ll-wb-snippet-insert')?.addEventListener('click', insertFirstSnippetShortcut);

    root.querySelector('#ll-wb-warm-cache')?.addEventListener('click', preloadIfForced);
    root.querySelector('#ll-wb-cache-clear')?.addEventListener('click', () => {
      responseCache.clear();
      wbToast('🗑', 'Cache workbench eliminado neste separador.');
    });

    root.querySelector('#ll-wb-dash-refresh')?.addEventListener('click', () => refreshDashboard());

    refreshSnippetPreview();
    fillSelectsMacrosTemplates();
    refreshDashboard();
  }

  function preloadIfAllowed() {
    chrome.storage.local.get(['ll_wb_settings'], (d) => {
      const on = !!(d.ll_wb_settings && d.ll_wb_settings.preload !== false);
      if (on) prefetchSourceIdle();
    });
  }

  function preloadIfForced() {
    prefetchSourceIdle(true);
    logActivity('Pré-busca manual de código');
  }

  function prefetchSourceIdle(force) {
    const pid = detectProjectId();
    if (!pid) return;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    idle(() => {
      chrome.storage.local.get(['ll_wb_settings'], async (cfg) => {
        const s = cfg.ll_wb_settings || {};
        if (!force && s.preload === false) return;
        if (!force && s.smartCache === false) return;
        const { headers } = await getAuthHeaders();
        if (!headers.Authorization) return;
        try {
          const url = `https://api.lovable.dev/projects/${pid}/source-code`;
          await proxyFetchGet(url, headers);
          if (force) wbToast('⚡', 'Pré-busca GET concluída (cache).', 2400);
        } catch (_) {}
      });
    });
  }

  function insertFirstSnippetShortcut() {
    if (!isExtensionValid()) return;
    try {
      chrome.storage.local.get(['ll_wb_snippets'], (d) => {
        if (chrome.runtime?.lastError || !d) return;
        const s = Array.isArray(d.ll_wb_snippets) && d.ll_wb_snippets[0];
        if (!s?.body) return wbToast('⚠', 'Crie snippets antes.');
        const ed = findEditor();
        if (!ed) return wbToast('⚠', 'Chat não encontrado.');
        setEditorText(ed, normalizeText(`${getEditorText(ed)}\n\n${s.body}`.trim()));
        logActivity(`Snippet rápido: ${s.title || 'primeiro'}`);
        wbToast('✔', `"${s.title || 'snippet'}" inserido.`);
      });
    } catch (_) {}
  }

  function toggleOrbClick() {
    document.getElementById('ll-orb')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
    );
  }

  function onWorkbenchCmd(msg) {
    if (!isExtensionValid()) return;
    try {
      if (msg?.type !== 'LL_WORKBENCH_CMD') return;
      if (msg.command === 'll_toggle_bubble_panel') toggleOrbClick();
      else if (msg.command === 'll_insert_quick_snippet') insertFirstSnippetShortcut();
    } catch (_) {}
    return undefined;
  }

  let lastNavHref = '';

  function navTick() {
    const h = location.href;
    if (h === lastNavHref) return;
    if (!/lovable\.dev\/projects\//i.test(h)) {
      lastNavHref = h;
      return;
    }
    lastNavHref = h;
    logActivity('Navegação no projeto registada.');
  }

  function autosaveTick() {
    if (!isExtensionValid()) return;
    try {
      chrome.storage.local.get(['ll_wb_settings'], (s) => {
        if (chrome.runtime?.lastError || !s) return;
        if (!(s.ll_wb_settings && s.ll_wb_settings.autosave)) return;
        const ed = findEditor();
        const txt = normalizeText(getEditorText(ed));
        if (!txt) return;
        const pid = detectProjectId() || 'sessao';
        chrome.storage.local.set({ [`ll_wb_autosave_${pid}`]: { savedAt: Date.now(), text: txt } });
      });
    } catch (_) {}
  }

  function mountHubTry() {
    const root = document.getElementById('ll-hub-root');
    if (!root || root.dataset.llWbMounted === '1') return;
    ensureDefaults(() => mountHub());
  }

  function observeHubMount() {
    const mo = new MutationObserver(() => mountHubTry());
    mo.observe(document.documentElement, { subtree: true, childList: true });
    mountHubTry();
  }

  function registerWorkbenchSingleton() {
    const G = globalThis;
    if (G.__LL_WB_REGISTERED__) return;
    G.__LL_WB_REGISTERED__ = true;
    try {
      if (isExtensionValid() && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(onWorkbenchCmd);
      }
    } catch (_) {}
    setInterval(() => { if (isExtensionValid()) autosaveTick(); }, 40000);
    setInterval(() => { if (isExtensionValid()) navTick(); }, 2600);
  }

  function bootWorkBench() {
    if (!/\/\/([^.]+\.)?lovable\.dev\b/i.test(location.href || '')) return;
    registerWorkbenchSingleton();
    ensureDefaults(observeHubMount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootWorkBench);
  else bootWorkBench();

})();

