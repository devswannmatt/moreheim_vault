// Lightweight popouts.modals helper using Materialize modals
(function(){
  const id = 'popouts-modal';
  let modalElem = null;
  let modalInstance = null;

  function ensure() {
    if (!modalElem) modalElem = document.getElementById(id);
    if (modalElem && !modalInstance && window.M && M.Modal) {
      modalInstance = M.Modal.init(modalElem, {dismissible: false});
    }
  }

  function setContent(title, body, footerHtml) {
    ensure();
    modalElem.querySelector('.popouts-title').textContent = title || '';
    const bodyNode = modalElem.querySelector('.popouts-body');
    if (typeof body === 'string') bodyNode.innerHTML = body;
    else { bodyNode.innerHTML = ''; bodyNode.appendChild(body); }
    const footer = modalElem.querySelector('.popouts-footer');
    footer.innerHTML = footerHtml || '';
  }

  function open() { ensure(); modalInstance.open(); }
  function close() { if (modalInstance) modalInstance.close(); }

  function makeButton(text, cls, cb) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls || 'btn';
    btn.textContent = text || 'OK';
    btn.addEventListener('click', function(){ cb && cb(); });
    return btn;
  }

  window.popouts = {
    alert(titleOrBody, maybeBody) {
      const title = (maybeBody ? titleOrBody : 'Notice');
      const body = (maybeBody ? maybeBody : titleOrBody);
      return new Promise(resolve => {
        ensure();
        const ok = makeButton('OK', 'btn blue', function(){ close(); resolve(); });
        setContent(title, body, '');
        modalElem.querySelector('.popouts-footer').appendChild(ok);
        open();
      });
    },

    confirm(titleOrBody, maybeBody) {
      const title = (maybeBody ? titleOrBody : 'Confirm');
      const body = (maybeBody ? maybeBody : titleOrBody);
      return new Promise((resolve) => {
        ensure();
        const footer = modalElem.querySelector('.popouts-footer');
        footer.innerHTML = '';
        const cancel = makeButton('Cancel', 'btn-flat', function(){ close(); resolve(false); });
        const ok = makeButton('OK', 'btn red', function(){ close(); resolve(true); });
        setContent(title, body, '');
        footer.appendChild(cancel);
        footer.appendChild(ok);
        open();
      });
    },

    prompt(title, defaultValue) {
      return new Promise((resolve) => {
        ensure();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue || '';
        setContent(title || 'Input', input, '');
        const footer = modalElem.querySelector('.popouts-footer');
        footer.innerHTML = '';
        const cancel = makeButton('Cancel', 'btn-flat', function(){ close(); resolve(null); });
        const ok = makeButton('OK', 'btn blue', function(){ close(); resolve(input.value); });
        footer.appendChild(cancel);
        footer.appendChild(ok);
        open();
        // focus input after open
        setTimeout(()=> input.focus(), 50);
      });
    }
  };

  document.addEventListener('DOMContentLoaded', ensure);
})();
