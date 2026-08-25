# ⚡ Infinity Claude AI v7.1 (All-In-One Edition)

> **Extensão Chrome Manifest V3 para Desenvolvimento Ilimitado e Bypass de Créditos no Lovable.**

---

## 🌟 Visão Geral

O **Infinity Claude AI** é uma extensão avançada desenvolvida para potencializar e desbloquear o uso da plataforma **Lovable.dev**. Ela intercepta as requisições de chat e compilação do Lovable, roteando-as para gateways de Inteligência Artificial de alta performance e baixo custo (**9Router / OpenAI GPT-4o Mini / Claude Sonnet / DeepSeek**), sem consumir créditos da sua conta Lovable.

---

## 🚀 Principais Recursos

### 1. 🛡️ Fail-Closed Guard (Zero Consumo Lovable)
* Bloqueia chamadas pagas aos endpoints `api.lovable.dev/projects/.../chat` e `/chat/queue/pause`.
* Converte erros `402 Payment Required` em respostas simuladas de VIP/Sucesso para impedir que o workspace trave.
* Filtra frames de erro de créditos no WebSocket Realtime.

### 2. ⚡ Roteamento Rápido via 9Router Gateway
* Suporte nativo aos modelos:
  * `openai/gpt-4o-mini` (2.1s de resposta - Ultra Econômico)
  * `openai/gpt-4o` (Inteligência máxima de código)
  * `ag/claude-sonnet-4-6` (Claude 3.7 / 3.5 Sonnet)
  * `ds/deepseek-v4-flash` (DeepSeek V4 Flash)
* Normalizador automático de rotas e prefixos de modelo (`normalizeModelName`).

### 3. 📦 Infinity Code & Database Inspector
* Analisa em tempo real todos os arquivos TypeScript/React/CSS gerados.
* Exibe a contagem de linhas e o status dos arquivos.
* Detecta chamadas e tabelas do banco de dados **Supabase / PostgreSQL** (`patients`, `appointments`, etc.).

### 4. 🧠 Injeção Direta no Monaco Editor & Hot-Reload Vite
* Injeta o código gerado diretamente no editor de código ativo (`window.monaco.editor`).
* Emite sinal de recarregamento (`vite:invalidate` e `full-reload`) para o iframe do preview do seu aplicativo.
* Copia o código completo preventivamente para a área de transferência (`Ctrl + V`).

---

## 📂 Estrutura do Projeto

```
InfinityClaudeAI_Extension/
├── manifest.json              # Configuração da extensão Chrome MV3
├── early-fetch.js             # Interceptador precoce de rede (Fail-Closed & 9Router Stream)
├── content.js                 # Injetor de UI, Inspector e Parser de Código
├── content.css                # Estilos do painel Inspector e Toasts
├── background.js              # Service Worker MV3 para streaming SSE
├── pageHook.js                # Ponte com Monaco Editor e disparo de Vite HMR
├── page-bridge.js             # Ponte de comunicação entre a página e a extensão
├── popup.html                 # Interface de configuração e estatísticas
├── popup.js                   # Lógica de seleção de modelo e telemetria
├── config.json                # Configurações padrão de endpoint e modelo
└── icons-png/                 # Ícones da extensão
```

---

## 🛠️ Como Instalar no Google Chrome / Brave / Edge

1. Abra o navegador e acesse `chrome://extensions/`.
2. Ative o **Modo do Desenvolvedor** no canto superior direito.
3. Clique em **Carregar sem compactação** (Load unpacked).
4. Selecione esta pasta.
5. Abra o [Lovable.dev](https://lovable.dev), envie seus prompts e aproveite desenvolvimento ilimitado com 0 créditos debitados!

---

## 📄 Licença

Uso pessoal e desenvolvimento avançado. Todos os direitos reservados.
