// jQuery-based AJAX method helper
// Usage:
// - Add `data-method="PATCH"` to a form to submit via PATCH instead of POST/GET
// - Add `data-json="true"` to send JSON body instead of urlencoded
// - Add `data-redirect="/path"` or `data-redirect="self"` to control navigation on success
// - Add `data-method` to links to send non-GET methods
$(function () {
  // forms
  $(document).on('submit', 'form[data-method]', function (e) {
    console.log("Intercepting form submission for AJAX");
    e.preventDefault();
    var $form = $(this);
    var method = ($form.data('method') || $form.attr('method') || 'POST').toUpperCase();
    var action = $form.attr('action') || window.location.href;
    var isJson = $form.data('json') === true || $form.data('json') === 'true';
    var enctype = $form.attr('enctype') || '';

    var ajaxOptions = {
      url: action,
      method: method,
      dataType: 'json',
      xhrFields: { withCredentials: true }
    };

    if (enctype.indexOf('multipart/form-data') !== -1) {
      ajaxOptions.data = new FormData(this);
      ajaxOptions.processData = false;
      ajaxOptions.contentType = false;
    } else if (isJson) {
      var obj = {};
      $form.serializeArray().forEach(function (pair) {
        if (obj[pair.name] !== undefined) {
          if (!Array.isArray(obj[pair.name])) obj[pair.name] = [obj[pair.name]];
          obj[pair.name].push(pair.value);
        } else {
          obj[pair.name] = pair.value;
        }
      });
      ajaxOptions.data = JSON.stringify(obj);
      ajaxOptions.contentType = 'application/json; charset=UTF-8';
      ajaxOptions.processData = true;
    } else {
      ajaxOptions.data = $form.serialize();
      ajaxOptions.contentType = 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    $.ajax(ajaxOptions).done(function (data, textStatus, jqXHR) {
      if ($form.data('redirect')) {
        if ($form.data('redirect') === 'self')  return window.location.reload();
        if ($form.data('redirect') === 'close') {
          closeModal();
          return window.location.reload();
        }
        return window.location.href = $form.data('redirect');
      }
      if (data && data.redirect) return window.location.href = data.redirect;
      window.location.reload();
    }).fail(function (jqXHR, textStatus, err) {
      var txt = jqXHR.responseText || err || textStatus;
      var message = '';
      console.error('Request failed', jqXHR.status, txt);
      if (txt.error) message = JSON.parse(txt).error;

      var responseResult = document.getElementById('response-result');
      if (responseResult) {
        responseResult.innerText = 'Error ' + jqXHR.status + ': ' + (message || txt);
        responseResult.style.color = 'red';
        
        return;
      }
      alert('Request failed: ' + jqXHR.status + '\n' + txt);
    });
  });

  // links
  $(document).on('click', 'a[data-method]', function (e) {
    e.preventDefault();
    var $a = $(this);
    var method = ($a.data('method') || 'GET').toUpperCase();
    var href = $a.prop('href');
    $.ajax({ url: href, method: method, xhrFields: { withCredentials: true } }).done(function (data) {
      if ($a.data('redirect')) {
        if ($a.data('redirect') === 'self') return window.location.reload();
        return window.location.href = $a.data('redirect');
      }
      if (data && data.redirect) return window.location.href = data.redirect;
      window.location.reload();
    }).fail(function (jqXHR) {
      alert('Request failed: ' + jqXHR.status + '\n' + (jqXHR.responseText || ''));
    });
  });
});
