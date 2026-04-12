document.addEventListener('DOMContentLoaded', function () {
  var modalEl = document.getElementById('popouts-modal');
  if (!modalEl) return;

  var loader = document.getElementById('popouts-loader');
  var iframe = document.getElementById('popouts-iframe');
  var iframeResizeObserver = null;
  var iframeMutationObserver = null;

  var SIZE = {
    minWidth: 520,
    minHeight: 360,
    viewportWidthRatio: 0.96,
    viewportHeightRatio: 0.92,
    widthPadding: 18,
    heightPadding: 14
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function clearObservers() {
    if (iframeResizeObserver) {
      iframeResizeObserver.disconnect();
      iframeResizeObserver = null;
    }
    if (iframeMutationObserver) {
      iframeMutationObserver.disconnect();
      iframeMutationObserver = null;
    }
  }

  function getDocSize(doc) {
    var body = doc.body;
    var root = doc.documentElement;
    var width = Math.max(
      body ? body.scrollWidth : 0,
      body ? body.offsetWidth : 0,
      root ? root.scrollWidth : 0,
      root ? root.offsetWidth : 0
    );
    var height = Math.max(
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      root ? root.scrollHeight : 0,
      root ? root.offsetHeight : 0
    );
    return { width: width, height: height };
  }

  function autoSizeToContent() {
    try {
      var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc) return;

      var measured = getDocSize(doc);
      var maxWidth = Math.floor(window.innerWidth * SIZE.viewportWidthRatio);
      var maxHeight = Math.floor(window.innerHeight * SIZE.viewportHeightRatio);
      var targetWidth = clamp(Math.ceil(measured.width + SIZE.widthPadding), SIZE.minWidth, maxWidth);
      var targetHeight = clamp(Math.ceil(measured.height + SIZE.heightPadding), SIZE.minHeight, maxHeight);

      modalEl.style.width = targetWidth + 'px';
      modalEl.style.maxWidth = maxWidth + 'px';
      modalEl.style.height = targetHeight + 'px';
      modalEl.style.maxHeight = maxHeight + 'px';

      iframe.style.height = targetHeight + 'px';
      loader.style.height = targetHeight + 'px';
    } catch (e) {
      // Ignore cross-origin or inaccessible iframe documents.
    }
  }

  function watchIframeContentChanges() {
    clearObservers();

    try {
      var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc || !doc.body || !doc.documentElement) return;

      if (window.ResizeObserver) {
        iframeResizeObserver = new ResizeObserver(function () {
          autoSizeToContent();
        });
        iframeResizeObserver.observe(doc.body);
        iframeResizeObserver.observe(doc.documentElement);
      }

      if (window.MutationObserver) {
        iframeMutationObserver = new MutationObserver(function () {
          autoSizeToContent();
        });
        iframeMutationObserver.observe(doc.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      }
    } catch (e) {
      // Ignore cross-origin or inaccessible iframe documents.
    }
  }

  function resetWindowState() {
    modalEl.style.left = '';
    modalEl.style.top = '';
    modalEl.style.transform = '';
    modalEl.style.position = '';
    modalEl.style.margin = '';
    modalEl.style.width = '';
    modalEl.style.maxWidth = '';
    modalEl.style.height = '';
    modalEl.style.maxHeight = '';
    iframe.style.height = '';
    loader.style.height = '';
    clearObservers();
  }

  function normalizeIframeLayout() {
    try {
      var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc || !doc.head || !doc.body) return;

      if (doc.getElementById('popout-layout-override')) return;

      doc.body.classList.add('popout-frame-mode');
      var style = doc.createElement('style');
      style.id = 'popout-layout-override';
      style.textContent = [
        'body.popout-frame-mode .container {',
        '  width: 100% !important;',
        '  max-width: none !important;',
        '  margin: 0 !important;',
        '  padding-left: 16px !important;',
        '  padding-right: 16px !important;',
        '}',
        '@media (max-width: 760px) {',
        '  body.popout-frame-mode .container {',
        '    padding-left: 10px !important;',
        '    padding-right: 10px !important;',
        '  }',
        '}'
      ].join('\n');

      doc.head.appendChild(style);
    } catch (e) {
      // Ignore cross-origin or inaccessible iframe documents.
    }
  }

  function ensureInstance() {
    if (!window.M || !M.Modal) return null;
    var inst = M.Modal.getInstance(modalEl);
    if (!inst) inst = M.Modal.init(modalEl, {});
    inst.options.onCloseEnd = function () {
      iframe.src = 'about:blank';
      iframe.style.display = 'none';
      loader.style.display = 'none';
      resetWindowState();
      try {
        window.location.reload();
      } catch (e) {
      }
    };
    return inst;
  }

  window.openPopout = function (url, title) {
    loader.style.display = '';
    iframe.style.display = 'none';
    resetWindowState();
    iframe.src = url;
    var onLoad = function () {
      normalizeIframeLayout();
      autoSizeToContent();
      watchIframeContentChanges();
      loader.style.display = 'none';
      iframe.style.display = 'block';
      iframe.removeEventListener('load', onLoad);
    };
    iframe.addEventListener('load', onLoad);

    var inst = ensureInstance();
    if (inst) inst.open();
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-popout], a.popout-link');
    if (!el) return;
    e.preventDefault();
    var url = el.getAttribute('data-popout') || el.getAttribute('href');
    if (!url) return;
    var title = el.getAttribute('data-popout-title') || el.getAttribute('title') || '';
    if (typeof window.openPopout === 'function') window.openPopout(url, title);
  }, false);

  window.addEventListener('resize', function () {
    autoSizeToContent();
  });
});

function closeModal() {
  if (window.self !== window.top && parent) {
    try {
      var pm = parent.document.querySelector('.modal.open') || parent.document.getElementById('popouts-modal');
      if (pm && parent.M && parent.M.Modal) {
        var inst = parent.M.Modal.getInstance(pm) || parent.M.Modal.init(pm, {});
        inst.close();
        var piframe = parent.document.getElementById('popouts-iframe');
        if (piframe) piframe.src = 'about:blank';
      }
    } catch (e) {
      window.location.reload();
    }
  } else {
    var el = document.querySelector('.modal.open') || document.querySelector('.modal');
    if (el && window.M && M.Modal) {
      var inst2 = M.Modal.getInstance(el) || M.Modal.init(el, {});
      inst2.close();
    } else {
      window.location.reload();
    }
  }
}
