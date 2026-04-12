document.addEventListener('DOMContentLoaded', function () {
  if (!window.M || !M.Modal) return;

  function buildModalUrl(url) {
    if (!url) return '';
    return url.indexOf('?') === -1 ? url + '?modal=1' : url + '&modal=1';
  }

  function executeScriptsSequentially(scope) {
    var scripts = Array.from(scope.querySelectorAll('script'));
    return scripts.reduce(function (chain, oldScript) {
      return chain.then(function () {
        var type = oldScript.getAttribute('type') || '';
        if (type && type !== 'text/javascript' && type !== 'application/javascript' && type !== 'module') {
          return Promise.resolve();
        }

        return new Promise(function (resolve, reject) {
          var newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(function (attr) {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (oldScript.src) {
            newScript.onload = resolve;
            newScript.onerror = reject;
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }

          oldScript.parentNode.replaceChild(newScript, oldScript);
          if (!oldScript.src) resolve();
        });
      });
    }, Promise.resolve());
  }

  function initializeInjectedContent(modalBody) {
    if (typeof window.initializeDynamicUi === 'function') {
      window.initializeDynamicUi(modalBody);
    }
    if (typeof window.initMemberCreate === 'function') window.initMemberCreate(modalBody);
    if (typeof window.initAddRow === 'function') window.initAddRow(modalBody);
    if (typeof window.initEventLevelUp === 'function') window.initEventLevelUp(modalBody);
    if (typeof window.initMemberExpHover === 'function') window.initMemberExpHover(modalBody);
  }

  function resolveModalContext(trigger) {
    var targetSelector = (trigger && trigger.getAttribute('data-modal-target')) || '#content-modal';
    var modalEl = document.querySelector(targetSelector);
    if (!modalEl) return null;

    var bodySelector = trigger && trigger.getAttribute('data-modal-body');
    var modalBody = bodySelector ? document.querySelector(bodySelector) : null;
    if (!modalBody) {
      modalBody = modalEl.querySelector('.content-modal-body');
    }
    if (!modalBody && modalEl.id) {
      modalBody = document.getElementById(modalEl.id + '-body');
    }
    if (!modalBody) {
      modalBody = modalEl.querySelector('.modal-content');
    }
    if (!modalBody) return null;

    var modalInstance = M.Modal.getInstance(modalEl) || M.Modal.init(modalEl, {});
    return { modalEl: modalEl, modalBody: modalBody, modalInstance: modalInstance };
  }

  function openHtmlModal(url, trigger) {
    var context = resolveModalContext(trigger);
    if (!context) return;
    var modalBody = context.modalBody;
    var modalInstance = context.modalInstance;
    var requestUrl = buildModalUrl(url);
    modalBody.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:280px;"><div class="preloader-wrapper active small"><div class="spinner-layer spinner-blue-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div></div>';
    modalInstance.open();

    fetch(requestUrl, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function (response) {
      if (!response.ok) throw new Error('Failed to load modal content');
      return response.text();
    }).then(function (html) {
      modalBody.innerHTML = html;
      return executeScriptsSequentially(modalBody);
    }).then(function () {
      initializeInjectedContent(modalBody);
    }).catch(function (err) {
      modalBody.innerHTML = '<div class="red-text" style="padding:18px;">' + (err && err.message ? err.message : 'Unable to load modal content.') + '</div>';
    });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-modal-url]');
    if (!trigger) return;
    e.preventDefault();
    var url = trigger.getAttribute('data-modal-url') || trigger.getAttribute('href');
    if (!url) return;
    openHtmlModal(url, trigger);
  }, false);

  document.addEventListener('modal:reload', function (event) {
    if (!event.detail || !event.detail.url) return;
    openHtmlModal(event.detail.url, event.detail.trigger || null);
  });
});
