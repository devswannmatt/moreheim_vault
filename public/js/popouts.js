document.addEventListener('DOMContentLoaded', function () {
  var modalEl = document.getElementById('popouts-modal');
  if (!modalEl) return;

  var loader = document.getElementById('popouts-loader');
  var iframe = document.getElementById('popouts-iframe');
  var titleEl = document.getElementById('popouts-modal-title');
  var minimizeBtn = document.getElementById('popouts-minimize-btn');
  var maximizeBtn = document.getElementById('popouts-maximize-btn');
  var closeBtn = document.getElementById('popouts-close-btn');

  function resetWindowState() {
    modalEl.classList.remove('is-minimized');
    modalEl.classList.remove('is-maximized');
    modalEl.style.left = '';
    modalEl.style.top = '';
    modalEl.style.transform = '';
    modalEl.style.position = '';
    if (maximizeBtn) {
      maximizeBtn.innerHTML = '&#9723;';
      maximizeBtn.title = 'Maximize';
      maximizeBtn.setAttribute('aria-label', 'Maximize');
    }
    if (minimizeBtn) {
      minimizeBtn.title = 'Minimize';
      minimizeBtn.setAttribute('aria-label', 'Minimize');
    }
  }

  var titlebar = modalEl.querySelector('.popouts-titlebar');
  if (titlebar) {
    var drag = { active: false, startX: 0, startY: 0, origLeft: 0, origTop: 0 };

    titlebar.addEventListener('mousedown', function (e) {
      if (e.target.closest('.popouts-controls')) return;
      if (modalEl.classList.contains('is-maximized')) return;
      drag.active = true;
      var rect = modalEl.getBoundingClientRect();
      drag.origLeft = rect.left;
      drag.origTop = rect.top;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      modalEl.style.position = 'fixed';
      modalEl.style.left = drag.origLeft + 'px';
      modalEl.style.top = drag.origTop + 'px';
      modalEl.style.transform = 'none';
      modalEl.style.margin = '0';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function (e) {
      if (!drag.active) return;
      var dx = e.clientX - drag.startX;
      var dy = e.clientY - drag.startY;
      var newLeft = Math.max(0, Math.min(drag.origLeft + dx, window.innerWidth - modalEl.offsetWidth));
      var newTop = Math.max(0, Math.min(drag.origTop + dy, window.innerHeight - modalEl.offsetHeight));
      modalEl.style.left = newLeft + 'px';
      modalEl.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', function () {
      if (!drag.active) return;
      drag.active = false;
      document.body.style.userSelect = '';
    });
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

  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', function () {
      modalEl.classList.toggle('is-minimized');
      var minimized = modalEl.classList.contains('is-minimized');
      minimizeBtn.title = minimized ? 'Restore' : 'Minimize';
      minimizeBtn.setAttribute('aria-label', minimized ? 'Restore' : 'Minimize');
    });
  }

  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', function () {
      modalEl.classList.toggle('is-maximized');
      var maximized = modalEl.classList.contains('is-maximized');
      maximizeBtn.innerHTML = maximized ? '&#9635;' : '&#9723;';
      maximizeBtn.title = maximized ? 'Restore' : 'Maximize';
      maximizeBtn.setAttribute('aria-label', maximized ? 'Restore' : 'Maximize');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      var inst = ensureInstance();
      if (inst) inst.close();
    });
  }

  window.openPopout = function (url, title) {
    loader.style.display = '';
    iframe.style.display = 'none';
    if (titleEl) titleEl.textContent = title || 'Popout';
    resetWindowState();
    iframe.src = url;
    var onLoad = function () {
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
});

function closeModal() {
  if (window.self !== window.top && parent) {
    try {
      var pm = parent.document.getElementById('popouts-modal');
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
    var el = document.querySelector('.modal');
    if (el && window.M && M.Modal) {
      var inst2 = M.Modal.getInstance(el) || M.Modal.init(el, {});
      inst2.close();
    } else {
      window.location.reload();
    }
  }
}
