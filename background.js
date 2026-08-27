// Dev. OppsEvo
async function __lovifyCookieHeader(){
  try{
    if(!chrome.cookies || !chrome.cookies.getAll) return '';
    const all = await chrome.cookies.getAll({domain:'lovable.dev'}).catch(()=>[]);
    return (all||[]).map(c=>c.name+'='+c.value).join('; ');
  }catch(e){return '';}
}
try{
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    if(msg && msg.action==='lovableSync'){
      const updates={};
      if(msg.token){updates.ll_lovable_auth_token=msg.token;updates.captured_auth_token=msg.token;updates.captured_lovable_token=msg.token;updates.lovable_api_token=msg.token;updates.lovable_token=msg.token;}
      if(msg.projectId){updates.ll_project_id=msg.projectId;updates.current_project_id=msg.projectId;updates.lovable_projectId=msg.projectId;}
      if(Object.keys(updates).length) chrome.storage.local.set(updates,()=>sendResponse({ok:true}));
      else sendResponse({ok:true});
      return true;
    }
    if(msg && msg.action==='getLovableCookies'){
      __lovifyCookieHeader().then(cookie=>sendResponse({ok:true,cookie}));
      return true;
    }
    if(msg && msg.action==='lovableApiFetch'){
      (async()=>{
        try{
          let tab=null;
          const activeTabs=await chrome.tabs.query({active:true,currentWindow:true});
          if(activeTabs && activeTabs[0] && /^https:\/\/([^/]+\.)?lovable\.dev\//.test(activeTabs[0].url||'')) tab=activeTabs[0];
          else {
            const tabs=await chrome.tabs.query({url:['https://lovable.dev/*','https://*.lovable.dev/*']});
            tab=(tabs&&tabs[0])||null;
          }
          if(!tab || !tab.id){
            sendResponse({ok:false,status:0,data:{error:'Abra uma aba do Lovable antes de enviar.'}});
            return;
          }
          const results=await chrome.scripting.executeScript({
            target:{tabId:tab.id},
            world:'MAIN',
            func:async(url,options)=>{
              try{
                const r=await fetch(url,{...(options||{}),credentials:'include'});
                const text=await r.text();
                let data;
                try{data=JSON.parse(text);}catch(e){data={raw:text};}
                return {ok:r.ok,status:r.status,data,body:text};
              }catch(err){
                return {ok:false,status:0,data:{error:(err&&err.message)||'fetch failed in page'},body:''};
              }
            },
            args:[msg.url,{method:msg.method||'POST',headers:msg.headers||{},body:msg.body||null}]
          });
          const value=(results&&results[0]&&results[0].result)||{ok:false,status:0,data:{error:'sem resposta da página Lovable'},body:''};
          sendResponse(value);
        }catch(error){
          sendResponse({ok:false,status:0,data:{error:error&&error.message||'Falha no executeScript'},body:''});
        }
      })();
      return true;
    }
    if(msg && msg.action==='proxyFetch'){
      (async()=>{
        try{
          const headers={...(msg.headers||{})};
          if(/api\.lovable\.dev/i.test(String(msg.url||'')) && !headers.Cookie && !headers.cookie){
            const ck=await __lovifyCookieHeader();
            if(ck) headers.Cookie=ck;
          }
          const response=await fetch(msg.url,{method:msg.method||'GET',headers,body:msg.body||undefined});
          const text=await response.text();
          let data=text;
          try{data=JSON.parse(text);}catch(e){}
          sendResponse({ok:response.ok,status:response.status,body:text,data,headers:Object.fromEntries(response.headers.entries())});
        }catch(error){sendResponse({ok:false,status:0,body:JSON.stringify({error:error&&error.message||'proxy fetch failed'}),data:{error:error&&error.message||'proxy fetch failed'}});}
      })();
      return true;
    }
  });
}catch(e){}
// ─── Linux Lovable — Background Service Worker ────────────────────────────────

// ─── Upgrade / sincronização remota (não alterar o bloco PROXY_FETCH embaixo) ─
const API_ENDPOINT = 'https://iaqnajvrrzfbgmvapoug.supabase.co/functions/v1/check-license';
const VERSION_ENDPOINT = 'https://iaqnajvrrzfbgmvapoug.supabase.co/functions/v1/extension-version';
// Mesmo projeto do popup (login) — Edge Function `extension-version` costuma exigir apikey JWT anon.
const EXTENSION_SYNC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcW5hanZycnpmYmdtdmFwb3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODc1NTUsImV4cCI6MjA5NzM2MzU1NX0.nCHRJIywf1H2_a9om3xrlvlCZogowld4-K5k1HUTJao';
const UPGRADE_ALARM = 'll_check_upgrade';
const UPGRADE_ZIP_NAME = 'linux-lovable-v3-upgrade.zip';

function normalizeSemverLike(v) {
  return String(v == null ? '0' : v).trim().replace(/^v+/i, '');
}

function semverCompare(a, b) {
  const pa = normalizeSemverLike(a).split('.').map((n) => parseInt(String(n).trim(), 10) || 0);
  const pb = normalizeSemverLike(b).split('.').map((n) => parseInt(String(n).trim(), 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

async function syncToolbarBadge() {
  try {
    const data = await chrome.storage.local.get([
      'll_extension_enabled',
      'll_upgrade_available',
      'll_remote_version',
      'll_extension_svc_status'
    ]);
    if (data.ll_extension_enabled === false) {
      await chrome.action.setBadgeBackgroundColor({ color: '#4a4a64' });
      await chrome.action.setBadgeText({ text: 'OFF' });
      await chrome.action.setTitle({ title: 'Netuno Lovable — desligado no popup' });
      return;
    }
    if (data.ll_extension_svc_status === 'maintenance') {
      await chrome.action.setBadgeText({ text: '!' });
      await chrome.action.setBadgeBackgroundColor({ color: '#ff9800' });
      await chrome.action.setTitle({ title: 'Netuno Lovable — manutenção (sincronização)' });
      return;
    }
    const remote = data.ll_remote_version;
    if (data.ll_upgrade_available && remote) {
      await chrome.action.setBadgeText({ text: 'NEW' });
      await chrome.action.setBadgeBackgroundColor({ color: '#FF1493' });
      await chrome.action.setTitle({ title: `Netuno Lovable — atualização v${remote} disponível` });
    } else {
      await chrome.action.setBadgeText({ text: '' });
      await chrome.action.setTitle({ title: 'Netuno Lovable' });
    }
  } catch (_) {}
}

async function checkForUpgrade() {
  try {
    const localVersion = chrome.runtime.getManifest().version;
    const headers = {
      Accept: 'application/json',
      apikey: EXTENSION_SYNC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${EXTENSION_SYNC_SUPABASE_ANON_KEY}`
    };
    const res = await fetch(VERSION_ENDPOINT, { method: 'GET', headers, cache: 'no-store' });

    if (!res.ok) {
      await chrome.storage.local.set({
        ll_extension_svc_status: 'unknown',
        ll_extension_svc_message: `Sincronização indisponível (HTTP ${res.status}).`,
        ll_extension_sync_endpoint: VERSION_ENDPOINT,
        ll_upgrade_checked_at: Date.now()
      });
      await syncToolbarBadge();
      return;
    }

    const raw = await res.json();
    const topSignals = raw && (raw.version || raw.latest || raw.latest_version || raw.tag ||
      raw.download_url || raw.url);
    const data = topSignals ? raw
      : (raw && typeof raw.data === 'object' && raw.data !== null ? raw.data : raw);

    const svcRaw = String((raw.status != null ? raw.status : '') || (data.status != null ? data.status : '') || '')
      .trim().toLowerCase();
    let svcStatus = svcRaw === 'maintenance' ? 'maintenance' : 'online';
    if (svcRaw && svcRaw !== 'online' && svcRaw !== 'maintenance') svcStatus = 'unknown';

    const svcMessage = String(raw.message || data.message || '').trim();

    const patch = {
      ll_extension_svc_status: svcStatus,
      ll_extension_svc_message: svcMessage,
      ll_extension_sync_endpoint: VERSION_ENDPOINT,
      ll_upgrade_checked_at: Date.now()
    };

    if (svcStatus === 'maintenance') {
      patch.ll_upgrade_available = false;
    }

    const remoteRaw = data && (data.version || data.latest || data.latest_version || data.tag);
    if (remoteRaw) {
      const remote = normalizeSemverLike(remoteRaw);
      const localNormalized = normalizeSemverLike(localVersion);
      const isNewer = semverCompare(remote, localNormalized) > 0;
      patch.ll_remote_version = remote;
      patch.ll_remote_download_url = data.download_url || data.url || null;
      patch.ll_remote_changelog = data.changelog || data.notes || '';
      patch.ll_remote_released_at = data.released_at || data.created_at || null;
      if (svcStatus !== 'maintenance') patch.ll_upgrade_available = isNewer;
    }

    await chrome.storage.local.set(patch);
    await syncToolbarBadge();
  } catch (_) {
    try {
      await chrome.storage.local.set({
        ll_extension_svc_status: 'unknown',
        ll_extension_svc_message: 'Não foi possível consultar o status da extensão.',
        ll_extension_sync_endpoint: VERSION_ENDPOINT,
        ll_upgrade_checked_at: Date.now()
      });
      await syncToolbarBadge();
    } catch (__) {}
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Linux Lovable] Extensão instalada com sucesso! 🐧');
  try {
    // chrome.alarms.create(UPGRADE_ALARM, { delayInMinutes: 1, periodInMinutes: 360 });
  } catch (_) {}
  // checkForUpgrade();
  syncToolbarBadge();
});

chrome.runtime.onStartup?.addListener?.(() => {
  try {
    // chrome.alarms.create(UPGRADE_ALARM, { delayInMinutes: 1, periodInMinutes: 360 });
  } catch (_) {}
  // checkForUpgrade();
  syncToolbarBadge();
});

chrome.alarms?.onAlarm?.addListener?.((alarm) => {
  if (alarm && alarm.name === UPGRADE_ALARM) {
    // no-op
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.ll_extension_enabled || changes.ll_upgrade_available || changes.ll_extension_svc_status) {
    syncToolbarBadge();
  }
});

// ─── Helper: flatten a file tree into path strings ──────────────────────────
function flattenFileList(node, prefix) {
  prefix = prefix || '';
  const out = [];
  if (Array.isArray(node)) {
    for (const item of node) {
      if (typeof item === 'string') { out.push(prefix + item); continue; }
      const name = item.name || item.path || item.filename || '';
      const type = item.type || item.kind || '';
      const children = item.children || item.contents || item.files || [];
      if (type === 'file' || (type !== 'dir' && type !== 'directory' && !children.length && name)) {
        if (name) out.push(prefix + name);
      } else if (children.length) {
        out.push(...flattenFileList(children, prefix + (name ? name + '/' : '')));
      }
    }
  } else if (node && typeof node === 'object') {
    for (const [key, val] of Object.entries(node)) {
      if (typeof val === 'string') out.push(prefix + key);
      else if (val && typeof val === 'object') out.push(...flattenFileList(val, prefix + key + '/'));
    }
  }
  return out;
}

// ─── Capture Lovable auth token (server-side proxy needs it) ────────────────
// We capture Authorization: Bearer <token> to api.lovable.dev so the content script
// can proxy requests through our Edge Function without asking the user for tokens.
try {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      try {
        const headers = details.requestHeaders || [];
        for (const h of headers) {
          if ((h.name || '').toLowerCase() === 'authorization' && (h.value || '').startsWith('Bearer ')) {
            const token = h.value.slice(7);
            chrome.storage.local.set({
              ll_lovable_auth_token: token,
              captured_auth_token: token,
              captured_lovable_token: token,
              lovable_api_token: token
            });
            break;
          }

          if ((h.name || '').toLowerCase() === 'x-client-git-sha' && h.value) {
            chrome.storage.local.set({ ll_client_git_sha: h.value });
          }
        }

        const m = (details.url || '').match(/\/projects\/([a-zA-Z0-9_-]+)/i);
        if (m && m[1]) {
          chrome.storage.local.set({
            ll_project_id: m[1],
            current_project_id: m[1]
          });
        }
      } catch (_) {}
    },
    { urls: ['https://api.lovable.dev/*'] },
    ['requestHeaders', 'extraHeaders']
  );
} catch (_) {
  // webRequest might be unavailable in some environments.
}



function llBgIsLicenseExpiredOrBlocked(store) { return false; }
async function llBgLicenseHardLockCheck() { return true; }
// Forward messages between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LL_OPEN_PROJECT' && message.projectId) {
    chrome.tabs.create({ url: `https://lovable.dev/projects/${message.projectId}` });
    sendResponse?.({ ok: true });
    return true;
  }

  if (message.type === 'LL_OPEN_URL' && message.url) {
    chrome.tabs.create({ url: message.url });
    sendResponse?.({ ok: true });
    return true;
  }

  if (message.type === 'LL_CHECK_UPGRADE') {
    checkForUpgrade().then(async () => {
      const data = await chrome.storage.local.get([
        'll_remote_version', 'll_remote_download_url', 'll_remote_changelog',
        'll_remote_released_at', 'll_upgrade_available', 'll_upgrade_checked_at',
        'll_extension_svc_status', 'll_extension_svc_message', 'll_extension_sync_endpoint'
      ]);
      sendResponse({
        ok: true,
        localVersion: chrome.runtime.getManifest().version,
        ...data
      });
    });
    return true;
  }

  if (message.type === 'LL_DOWNLOAD_UPGRADE') {
    (async () => {
      try {
        const data = await chrome.storage.local.get(['ll_remote_download_url', 'll_remote_version']);
        const url = message.url || data.ll_remote_download_url;
        if (!url) {
          sendResponse({ ok: false, error: 'Nenhuma URL de download disponível.' });
          return;
        }
        const v = data.ll_remote_version ? `-${data.ll_remote_version}` : '';
        const filename = UPGRADE_ZIP_NAME.replace(/\.zip$/i, `${v}.zip`);
        chrome.downloads.download(
          { url, filename, saveAs: false, conflictAction: 'overwrite' },
          (downloadId) => {
            if (chrome.runtime.lastError || !downloadId) {
              chrome.tabs.create({ url });
              sendResponse({ ok: true, fallback: true });
            } else {
              sendResponse({ ok: true, downloadId });
            }
          }
        );
      } catch (err) {
        sendResponse({ ok: false, error: err?.message || 'Falha no download.' });
      }
    })();
    return true;
  }

  if (message.type === 'PROXY_FETCH') {
    (async () => {
      try {
        const isLovableCommand = /lovable\.dev|api\.lovable\.dev/i.test(String(message.url || ''));
        if (isLovableCommand && !(await llBgLicenseHardLockCheck())) {
          sendResponse({ ok: false, status: 403, body: JSON.stringify({ error: 'Licença expirada. Comando bloqueado.' }), headers: {} });
          return;
        }
        const proxyHeaders = {
          Origin: 'https://lovable.dev',
          Referer: 'https://lovable.dev/',
          ...(message.headers || {})
        };

        try {
          if (/api\.lovable\.dev/i.test(String(message.url || '')) && !proxyHeaders.Cookie && !proxyHeaders.cookie) {
            const ck = await __lovifyCookieHeader();
            if (ck) proxyHeaders.Cookie = ck;
          }
        } catch (_) {}

        const response = await fetch(message.url, {
          method: message.method || 'GET',
          headers: proxyHeaders,
          body: message.body || undefined
        });
        const text = await response.text();
        sendResponse({
          ok: response.ok,
          status: response.status,
          body: text,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (error) {
        sendResponse({
          ok: false,
          status: 0,
          body: JSON.stringify({ error: error?.message || 'proxy fetch failed' }),
          headers: {}
        });
      }
    })();
    return true;
  }

  // ── Fetch project source files directly from Lovable API (service worker bypasses CORS) ──
  if (message.type === 'FETCH_PROJECT_FILES') {
    (async () => {
      const { projectId, lovableToken } = message;
      if (!projectId || !lovableToken) {
        sendResponse({ ok: false, error: 'Missing projectId or lovableToken', files: [] });
        return;
      }

      const authHeaders = {
        'Authorization': `Bearer ${lovableToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://lovable.dev',
        'Referer': 'https://lovable.dev/'
      };

      let files = [];

      // ── Strategy 1: /source-code endpoint (returns files with content) ───────
      const sourceCodeUrls = [
        `https://api.lovable.dev/projects/${projectId}/source-code`,
        `https://api.lovable.dev/projects/${projectId}/code`,
        `https://api.lovable.dev/api/v1/projects/${projectId}/source-code`,
      ];

      for (const url of sourceCodeUrls) {
        try {
          const r = await fetch(url, { method: 'GET', headers: authHeaders });
          if (!r.ok) continue;
          const ct = r.headers.get('content-type') || '';
          if (!ct.includes('json')) continue;
          const data = await r.json();
          const arr = Array.isArray(data) ? data : (data.files || data.items || data.data || []);
          if (arr.length > 0) {
            // Normalize each entry: { path, content }
            files = arr.map(f => ({
              path: f.name || f.path || f.filename || f.file || '',
              content: f.content ?? f.code ?? f.source ?? f.text ?? f.body ?? null,
              isBinary: !!(f.encoding && f.encoding !== 'utf-8' && f.encoding !== 'text')
            })).filter(f => f.path && f.content !== null);
            if (files.length > 0) break;
          }
        } catch (_) {}
      }

      // ── Strategy 2: /files listing + individual raw fetch ────────────────────
      if (files.length === 0) {
        let filePaths = [];
        const listUrls = [
          `https://api.lovable.dev/projects/${projectId}/files`,
          `https://api.lovable.dev/projects/${projectId}/files?path=.`,
          `https://api.lovable.dev/api/v1/projects/${projectId}/files`,
        ];
        for (const url of listUrls) {
          try {
            const r = await fetch(url, { method: 'GET', headers: authHeaders });
            if (!r.ok) continue;
            const ct = r.headers.get('content-type') || '';
            if (!ct.includes('json')) continue;
            const data = await r.json();

            // Handle array of strings (flat list)
            if (Array.isArray(data) && data.length > 0) {
              if (typeof data[0] === 'string') {
                filePaths = data;
              } else {
                // Array of objects — flatten tree
                filePaths = flattenFileList(data);
              }
            } else if (data && typeof data === 'object') {
              filePaths = flattenFileList(Array.isArray(data) ? data : [data]);
            }

            if (filePaths.length > 0) break;
          } catch (_) {}
        }

        // Fetch content for each path
        if (filePaths.length > 0) {
          const MAX = 200;
          for (const fp of filePaths.slice(0, MAX)) {
            try {
              const r = await fetch(
                `https://api.lovable.dev/projects/${projectId}/files/raw?path=${encodeURIComponent(fp)}`,
                { method: 'GET', headers: authHeaders }
              );
              if (r.ok) {
                const content = await r.text();
                files.push({ path: fp, content });
              }
            } catch (_) {}
          }
        }
      }

      // ── Strategy 3: Probe standard Lovable project paths ─────────────────────
      if (files.length === 0) {
        const STANDARD_PATHS = [
          'package.json','index.html','vite.config.ts','vite.config.js',
          'tsconfig.json','tsconfig.app.json','tsconfig.node.json',
          '.eslintrc.cjs','.gitignore','postcss.config.js','tailwind.config.ts',
          'tailwind.config.js','components.json','README.md',
          'src/main.tsx','src/main.ts','src/App.tsx','src/App.css','src/index.css',
          'src/vite-env.d.ts','src/lib/utils.ts',
          'src/components/ui/button.tsx','src/components/ui/card.tsx',
          'src/components/ui/input.tsx','src/components/ui/label.tsx',
          'src/components/ui/badge.tsx','src/components/ui/dialog.tsx',
          'src/components/ui/toast.tsx','src/components/ui/toaster.tsx',
          'src/components/ui/select.tsx','src/components/ui/separator.tsx',
          'src/components/ui/tabs.tsx','src/components/ui/textarea.tsx',
          'src/components/ui/use-toast.ts','src/hooks/use-toast.ts',
          'src/pages/Index.tsx','src/pages/NotFound.tsx',
          'src/integrations/supabase/client.ts','src/integrations/supabase/types.ts',
        ];

        // Run in parallel batches of 10 to avoid rate limiting
        const batchSize = 10;
        for (let i = 0; i < STANDARD_PATHS.length; i += batchSize) {
          const batch = STANDARD_PATHS.slice(i, i + batchSize);
          const results = await Promise.allSettled(batch.map(async (p) => {
            const r = await fetch(
              `https://api.lovable.dev/projects/${projectId}/files/raw?path=${encodeURIComponent(p)}`,
              { method: 'GET', headers: authHeaders }
            );
            if (r.ok) {
              const content = await r.text();
              return { path: p, content };
            }
            return null;
          }));
          for (const res of results) {
            if (res.status === 'fulfilled' && res.value) files.push(res.value);
          }
        }
      }

      sendResponse({ ok: true, files });
    })();
    return true;
  }

  if (message.type === 'LL_LOGOUT' || message.type === 'LL_ACTION') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {});
      }
    });
  }
  return true;
});

// Atalhos (chrome.commands) → content: ll-workbench.js (não interfere no PROXY_FETCH).
try {
  chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) return;
      const u = tab.url || '';
      if (!/(^|\.)lovable\.dev\b/i.test(u)) return;
      chrome.tabs.sendMessage(tab.id, { type: 'LL_WORKBENCH_CMD', command }).catch(() => {});
    });
  });
} catch (_) {}


// --- Deep Clean Handler (from Lovable-PRO) ---
async function removeScopedCache(origins) {
  return new Promise((resolve) => {
    try {
      if (chrome.browsingData && chrome.browsingData.remove) {
        chrome.browsingData.remove(
          { origins: origins || ["https://lovable.dev"], since: 0 },
          { cacheStorage: true, indexedDB: true, serviceWorkers: true },
          () => resolve(!chrome.runtime.lastError)
        );
      } else { resolve(false); }
    } catch (_) { resolve(false); }
  });
}
async function removeHttpCache() {
  return new Promise((resolve) => {
    try {
      if (chrome.browsingData && chrome.browsingData.remove) {
        chrome.browsingData.remove({ since: 0 }, { cache: true }, () => resolve(!chrome.runtime.lastError));
      } else { resolve(false); }
    } catch (_) { resolve(false); }
  });
}
async function handleDeepClean(extraOrigin) {
  const origins = ["https://lovable.dev"];
  if (extraOrigin && origins.indexOf(extraOrigin) === -1) origins.push(extraOrigin);
  const scoped = await removeScopedCache(origins);
  const http = await removeHttpCache();
  return { scoped, httpCache: http };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && (msg.type === "INFINITY_DEEP_CLEAN" || msg.type === "NX_DEEP_CLEAN")) {
    handleDeepClean(msg.origin)
      .then((res) => sendResponse({ ok: true, detail: res }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});


// ─── Infinity Claude AI — Streaming Router Proxy Bridge (0 CORS / MV3 Privileged) ───
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'INFINITY_ROUTER_STREAM') return;

  port.onMessage.addListener(async (msg) => {
    if (!msg || msg.type !== 'START_STREAM') return;
    const { endpoint, headers, payload } = msg;

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        port.postMessage({ type: 'ERROR', status: resp.status, detail: errText });
        return;
      }

      port.postMessage({ type: 'START', status: resp.status, headers: Object.fromEntries(resp.headers.entries()) });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const text = decoder.decode(value, { stream: true });
        buffer += text;
        const lines = buffer.split("\n");
        buffer = lines.pop() || '';

        const validLines = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith(':')) continue; // Skip OpenRouter comments
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr && jsonStr !== '[DONE]') {
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) fullContent += delta;
              } catch (_) {}
            }
          }
          validLines.push(line);
        }

        if (validLines.length > 0) {
          const cleanedText = validLines.join("\n") + "\n";
          port.postMessage({ type: 'CHUNK', text: cleanedText, fullText: fullContent });
        }
      }

      port.postMessage({ type: 'DONE', fullText: fullContent });
    } catch (err) {
      port.postMessage({ type: 'ERROR', status: 0, detail: (err && err.message) || 'Falha de conexão com o router' });
    }
  });
});

// ─── Infinity Deep Cache Clean (Preserva Sessão e Cookies) ────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'INFINITY_DEEP_CLEAN') {
    (async () => {
      try {
        const origins = ['https://lovable.dev', 'https://gptengineer.app'];
        if (chrome.browsingData && chrome.browsingData.remove) {
          await new Promise((resolve) => {
            chrome.browsingData.remove(
              { origins, since: 0 },
              { cacheStorage: true, serviceWorkers: true },
              () => resolve(!chrome.runtime.lastError)
            );
          });
          await new Promise((resolve) => {
            chrome.browsingData.remove({ since: 0 }, { cache: true }, () =>
              resolve(!chrome.runtime.lastError)
            );
          });
        }
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }
});

// ─── Infinity GitHub Direct Sync (Direct Editor) ────────────────────────────
async function commitFileToGitHub(owner, repo, path, content, token, branch = 'main') {
  const cleanPath = path.replace(/^[./\\]+/, '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Infinity-Claude-AI'
  };

  // 1. Obter SHA do arquivo se ele já existir
  let sha = null;
  try {
    const getRes = await fetch(`${url}?ref=${branch}`, { headers });
    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
    }
  } catch (_) {}

  // 2. Codificar conteúdo em Base64 UTF-8 seguro
  const utf8Bytes = new TextEncoder().encode(content);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64Content = btoa(binary);

  // 3. Executar o PUT para criar ou atualizar o arquivo
  const putBody = {
    message: `feat(infinity): update ${cleanPath} via Infinity Claude AI`,
    content: base64Content,
    branch: branch
  };
  if (sha) putBody.sha = sha;

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(putBody)
  });

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP ${putRes.status}`);
  }

  return await putRes.json();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'INFINITY_GITHUB_SYNC_FILES') {
    (async () => {
      try {
        const { files, repoUrl, githubToken } = msg;
        const stored = await chrome.storage.local.get(['infinity_github_token', 'infinity_github_repo']);
        const targetRepo = repoUrl || stored.infinity_github_repo || 'https://github.com/zansued/cozy-companion-hub-59.git';
        const targetToken = githubToken || stored.infinity_github_token || '';

        if (!targetToken) {
          sendResponse({ ok: false, error: 'Token do GitHub não configurado' });
          return;
        }

        const match = targetRepo.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
        if (!match) {
          sendResponse({ ok: false, error: 'URL do repositório GitHub inválida' });
          return;
        }

        const owner = match[1];
        const repo = match[2];
        const results = [];

        for (const file of (files || [])) {
          if (!file.path || !file.code) continue;
          try {
            const res = await commitFileToGitHub(owner, repo, file.path, file.code, targetToken);
            results.push({ path: file.path, success: true, sha: res.commit?.sha });
          } catch (err) {
            results.push({ path: file.path, success: false, error: err.message });
          }
        }

        sendResponse({ ok: true, results, owner, repo });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }
});