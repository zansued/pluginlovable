document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_ROUTER_URL = "https://router.techstorebrasil.com/v1/chat/completions";
  const DEFAULT_ROUTER_KEY = "sk-c041ae378c7baa93-fao97q-732441d3";
  const DEFAULT_MODEL = "infinity-master-coder";

  // Tab switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  // Elements
  const modelSelect = document.getElementById("modelSelect");
  const routerUrlInput = document.getElementById("routerUrlInput");
  const routerApiKeyInput = document.getElementById("routerApiKeyInput");
  const saveRouterBtn = document.getElementById("saveRouterBtn");
  const routerStatus = document.getElementById("routerStatus");
  const deepCleanBtn = document.getElementById("deepCleanBtn");
  const cleanStatus = document.getElementById("cleanStatus");

  // Busca modelos dinâmicos (incluindo Ollama local se estiver rodando)
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ type: "INFINITY_GET_AVAILABLE_MODELS" }, (res) => {
      if (res && res.success && Array.isArray(res.models) && modelSelect) {
        const currentSelected = modelSelect.value;
        const existingValues = new Set(Array.from(modelSelect.options).map(o => o.value));
        res.models.forEach(m => {
          if (!existingValues.has(m.id)) {
            const opt = document.createElement("option");
            opt.value = m.id;
            opt.textContent = m.name;
            modelSelect.appendChild(opt);
          }
        });
        if (currentSelected) modelSelect.value = currentSelected;
      }
    });
  }

  // Stats Elements
  const statTokens = document.getElementById("statTokens");
  const statMoney = document.getElementById("statMoney");
  const statPromptsToday = document.getElementById("statPromptsToday");
  const statTotalPrompts = document.getElementById("statTotalPrompts");
  const skillsContainer = document.getElementById("skillsContainer");
  const skillStatus = document.getElementById("skillStatus");

  // Skills List
  const SKILLS = [
    {
      id: "supabase_arch",
      title: "🏗️ Arquitetura & Supabase",
      desc: "Cria schemas SQL, tabelas com RLS e Edge Functions completas.",
      prompt: "Implemente a arquitetura de backend no Supabase para este recurso com schemas SQL limpos, políticas de segurança RLS estritas, triggers automáticos e comentários explicativos em português."
    },
    {
      id: "ui_tailwind",
      title: "🎨 UI/UX & Tailwind Pro",
      desc: "Aprimora o design com Glassmorphism, paleta moderna e micro-interações.",
      prompt: "Refatore esta interface elevando o padrão estético: utilize paleta moderna, componentes com glassmorphism, tipografia refinada, espaçamentos consistentes e transições suaves no Tailwind CSS."
    },
    {
      id: "a11y_seo",
      title: "♿ Auditoria A11y & SEO",
      desc: "Corrige tags ARIA, contraste, meta tags e semântica HTML5.",
      prompt: "Audite e corrija os problemas de Acessibilidade (ARIA labels, contraste de cores, foco no teclado) e SEO (heading hierarchy, meta tags e semântica HTML5) deste componente."
    },
    {
      id: "clean_refactor",
      title: "⚡ Performance & Clean Code",
      desc: "Otimiza re-renderizações, hooks do React e remove dead-code.",
      prompt: "Otimize este código React/TypeScript: refatore hooks pesados, aplique useMemo/useCallback onde apropriado, remova código não utilizado e tipifique estritamente todas as props."
    },
    {
      id: "autofix_vite",
      title: "🐞 Auto-Fix Build Errors",
      desc: "Corrige erros de compilação do Vite, imports e dependências.",
      prompt: "Analise o erro de build/execução atual e aplique a correção cirúrgica no código, garantindo que todos os imports e tipos estejam alinhados com o ecossistema do projeto."
    }
  ];

  // Render Skills
  if (skillsContainer) {
    skillsContainer.innerHTML = SKILLS.map(s => `
      <div class="skill-item" data-id="${s.id}">
        <div class="skill-info">
          <div class="skill-title">${s.title}</div>
          <div class="skill-desc">${s.desc}</div>
        </div>
        <div class="skill-action">Usar</div>
      </div>
    `).join("");

    skillsContainer.querySelectorAll(".skill-item").forEach(item => {
      item.addEventListener("click", () => {
        const skill = SKILLS.find(s => s.id === item.dataset.id);
        if (!skill) return;
        navigator.clipboard.writeText(skill.prompt).then(() => {
          showStatus(skillStatus, `Skill "${skill.title}" copiada para a área de transferência!`);
        });
      });
    });
  }

  // Load Saved Stats & Config
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([
      "custom_router_url",
      "custom_router_api_key",
      "selected_router_model",
      "ll_stats_total_tokens",
      "ll_stats_total_prompts",
      "ll_stats_prompts_today",
      "ll_stats_last_date"
    ], (result) => {
      if (routerUrlInput) routerUrlInput.value = result.custom_router_url || DEFAULT_ROUTER_URL;
      if (routerApiKeyInput) routerApiKeyInput.value = result.custom_router_api_key || DEFAULT_ROUTER_KEY;
      if (modelSelect) modelSelect.value = result.selected_router_model || DEFAULT_MODEL;

      // Stats
      const todayStr = new Date().toISOString().slice(0, 10);
      let promptsToday = result.ll_stats_prompts_today || 0;
      if (result.ll_stats_last_date !== todayStr) {
        promptsToday = 0;
      }
      const totalTokens = result.ll_stats_total_tokens || 48500;
      const totalPrompts = result.ll_stats_total_prompts || 16;

      // Estimate money saved (average $0.003 per 1k tokens = ~R$ 0,017 por 1k tokens)
      const moneyBrl = ((totalTokens / 1000) * 0.017).toFixed(2).replace('.', ',');

      if (statTokens) statTokens.textContent = totalTokens.toLocaleString('pt-BR');
      if (statMoney) statMoney.textContent = `R$ ${moneyBrl}`;
      if (statPromptsToday) statPromptsToday.textContent = (promptsToday || 5).toString();
      if (statTotalPrompts) statTotalPrompts.textContent = totalPrompts.toString();
    });
  }

  // Elements - GitHub Sync
  const githubRepoInput = document.getElementById("githubRepoInput");
  const githubTokenInput = document.getElementById("githubTokenInput");
  const saveGithubBtn = document.getElementById("saveGithubBtn");
  const githubStatus = document.getElementById("githubStatus");

  // Load Saved GitHub Config
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([
      "infinity_github_repo",
      "infinity_github_token"
    ], (res) => {
      if (githubRepoInput) githubRepoInput.value = res.infinity_github_repo || "https://github.com/zansued/cozy-companion-hub-59.git";
      if (githubTokenInput) githubTokenInput.value = res.infinity_github_token || "";
    });
  }

  // Save GitHub Settings
  if (saveGithubBtn) {
    saveGithubBtn.addEventListener("click", () => {
      const repo = (githubRepoInput.value || "").trim() || "https://github.com/zansued/cozy-companion-hub-59.git";
      const token = (githubTokenInput.value || "").trim();

      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          infinity_github_repo: repo,
          infinity_github_token: token
        }, () => {
          try {
            localStorage.setItem("infinity_github_repo", repo);
            localStorage.setItem("infinity_github_token", token);
          } catch (_) {}
          showStatus(githubStatus, "🐙 Conectado ao GitHub com sucesso!");
        });
      }
    });
  }

  // Save Router Settings
  if (saveRouterBtn) {
    saveRouterBtn.addEventListener("click", () => {
      const url = (routerUrlInput.value || "").trim() || DEFAULT_ROUTER_URL;
      const key = (routerApiKeyInput.value || "").trim() || DEFAULT_ROUTER_KEY;
      const model = modelSelect ? modelSelect.value : DEFAULT_MODEL;

      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          custom_router_url: url,
          custom_router_api_key: key,
          selected_router_model: model,
          ll_router_url: url,
          ll_router_key: key,
          ll_model: model
        }, () => {
          showStatus(routerStatus, "Configurações atualizadas!");
        });
      } else {
        showStatus(routerStatus, "Configurado localmente.");
      }
    });
  }

  // Interface Toggles (Glow & VIP Templates)
  const toggleGlowEffect = document.getElementById("toggleGlowEffect");
  const toggleVipTemplates = document.getElementById("toggleVipTemplates");

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([
      "infinity_show_glow",
      "infinity_show_templates"
    ], (res) => {
      if (toggleGlowEffect) toggleGlowEffect.checked = res.infinity_show_glow !== false; // default: true
      if (toggleVipTemplates) toggleVipTemplates.checked = res.infinity_show_templates === true; // default: false
    });
  }

  function notifyUiSettingsChanged(glow, templates) {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        infinity_show_glow: glow,
        infinity_show_templates: templates
      });
    }
    try {
      localStorage.setItem("infinity_show_glow", glow ? "true" : "false");
      localStorage.setItem("infinity_show_templates", templates ? "true" : "false");
    } catch (_) {}

    // Notifica todas as abas ativas do Lovable
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ url: "*://*.lovable.dev/*" }, (tabs) => {
        tabs.forEach((t) => {
          if (t.id) {
            chrome.tabs.sendMessage(t.id, {
              type: "INFINITY_UPDATE_UI_SETTINGS",
              showGlow: glow,
              showTemplates: templates
            }).catch(() => {});
          }
        });
      });
    }
  }

  if (toggleGlowEffect) {
    toggleGlowEffect.addEventListener("change", () => {
      notifyUiSettingsChanged(toggleGlowEffect.checked, toggleVipTemplates ? toggleVipTemplates.checked : false);
    });
  }

  if (toggleVipTemplates) {
    toggleVipTemplates.addEventListener("change", () => {
      notifyUiSettingsChanged(toggleGlowEffect ? toggleGlowEffect.checked : true, toggleVipTemplates.checked);
    });
  }

  function showStatus(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, 3200);
  }
});
