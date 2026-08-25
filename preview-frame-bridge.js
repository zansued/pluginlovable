// Dev. OppsEvo
// LOVIFY.IA — Preview Toolbar Frame Bridge
// Roda dentro do iframe/preview do app para capturar o elemento real selecionado.
(() => {
  if (window.__LOVIFY_PREVIEW_FRAME_BRIDGE__) return;
  window.__LOVIFY_PREVIEW_FRAME_BRIDGE__ = true;

  function safeCssEscape(value) {
    try {
      if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
    } catch (_) {}
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function buildCssSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    try {
      if (el.id) return `#${safeCssEscape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && node !== document.body && parts.length < 7) {
        let part = String(node.tagName || '').toLowerCase();
        if (!part) break;
        const cls = String(node.className || '')
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .map((c) => `.${safeCssEscape(c)}`)
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

  function getAttrs(el) {
    const attrs = {};
    try {
      const allowed = ['id', 'class', 'href', 'src', 'alt', 'title', 'type', 'role', 'aria-label', 'data-testid', 'name', 'placeholder'];
      Array.from(el.attributes || []).forEach((attr) => {
        const name = String(attr.name || '');
        if (allowed.includes(name) || name.startsWith('data-')) attrs[name] = String(attr.value || '').slice(0, 500);
      });
    } catch (_) {}
    return attrs;
  }

  function capture(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    const rect = el.getBoundingClientRect();
    return {
      selector: buildCssSelector(el),
      tag_name: String(el.tagName || '').toLowerCase(),
      text: String(el.innerText || el.textContent || '').trim().slice(0, 1000),
      html: String(el.outerHTML || '').slice(0, 3000),
      current_page: `${location.pathname || '/'}${location.search || ''}${location.hash || ''}`,
      source: 'lovable_app_preview_frame',
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
      attributes: getAttrs(el),
    };
  }

  function toast(msg) {
    try {
      let t = document.getElementById('__lovify_preview_picker_toast');
      if (!t) {
        t = document.createElement('div');
        t.id = '__lovify_preview_picker_toast';
        t.style.cssText = 'position:fixed;z-index:2147483647;right:14px;bottom:14px;background:rgba(7,7,26,.92);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 12px;font:600 12px Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35);pointer-events:none';
        document.documentElement.appendChild(t);
      }
      t.textContent = msg;
      t.style.display = 'block';
      clearTimeout(t.__llTimer);
      t.__llTimer = setTimeout(() => { t.style.display = 'none'; }, 2600);
    } catch (_) {}
  }

  function enablePicker() {
    let lastEl = null;
    let done = false;

    function clearLast() {
      try {
        if (lastEl) {
          lastEl.style.outline = '';
          lastEl.style.outlineOffset = '';
        }
      } catch (_) {}
    }

    function cleanup() {
      if (done) return;
      done = true;
      clearLast();
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        cleanup();
        toast('Seleção cancelada');
      }
    }

    function onMove(e) {
      const el = e.target;
      if (!el) return;
      clearLast();
      lastEl = el;
      try {
        el.style.outline = '2px solid #FF2D8B';
        el.style.outlineOffset = '2px';
      } catch (_) {}
    }

    function onClick(e) {
      const el = e.target;
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const element = capture(el);
      cleanup();
      if (element) {
        window.top.postMessage({ type: 'LOVIFY_PREVIEW_ELEMENT_SELECTED', element }, '*');
        toast(`Selecionado: ${element.tag_name || 'elemento'}`);
      }
    }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    toast('LOVIFY: clique no elemento para editar');
  }

  window.addEventListener('message', (event) => {
    try {
      if (!event.data || event.data.type !== 'LOVIFY_ENABLE_PREVIEW_PICKER') return;
      enablePicker();
    } catch (_) {}
  }, false);
})();

