(function () {
  function showLinkedField(subfield, subFieldData, list) {
    var subFieldSelect = document.getElementById(subfield);
    if (!subFieldSelect) return;

    var subFieldDiv = subFieldSelect.parentElement;
    subFieldSelect.innerHTML = '';

    if (subFieldData && Object.keys(subFieldData).length > 0) {
      if (list) {
        for (var i = 0; i < subFieldData.length; i++) {
          var option = document.createElement('option');
          option.value = subFieldData[i]._id;
          option.text = String(subFieldData[i].name);
          subFieldSelect.appendChild(option);
        }
      } else {
        for (var key in subFieldData) {
          if (Object.prototype.hasOwnProperty.call(subFieldData, key)) {
            var option2 = document.createElement('option');
            option2.value = key;
            var label = subFieldData[key];
            if (label && typeof label === 'object' && label.label) label = label.label;
            option2.text = String(label);
            subFieldSelect.appendChild(option2);
          }
        }
      }

      if (subFieldDiv) subFieldDiv.style.display = 'block';

      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.disabled = true;
      placeholder.selected = true;
      placeholder.text = 'Select an option';
      subFieldSelect.insertBefore(placeholder, subFieldSelect.firstChild);

      if (window.M && M.FormSelect) M.FormSelect.init(subFieldSelect);
    } else {
      subFieldSelect.innerHTML = '';
      if (subFieldDiv) subFieldDiv.style.display = 'none';
      if (window.M && M.FormSelect) M.FormSelect.init(subFieldSelect);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var skillDataEl = document.getElementById('skill-list-data');
    var skillList = [];
    if (skillDataEl) {
      try {
        skillList = JSON.parse(skillDataEl.textContent || '[]');
      } catch (e) {
        skillList = [];
      }
    }

    try {
      var advEl = document.getElementById('advance');
      var advLinked = document.getElementById('advance_linked');
      if (window.M && M.FormSelect) {
        if (advEl) M.FormSelect.init(advEl);
        if (advLinked) M.FormSelect.init(advLinked);
      }
    } catch (e2) {
    }

    var nodes = document.querySelectorAll('[data-linkedfield]');
    nodes.forEach(function (node) {
      node.addEventListener('change', function () {
        var subfield = node.getAttribute('data-linkedfield');
        var selectedOption = node.options[node.selectedIndex];
        var raw = selectedOption && (selectedOption.dataset ? selectedOption.dataset.subfield : selectedOption.getAttribute('data-subfield'));
        var subFieldData = null;
        var list = false;

        if (raw) {
          if (raw === '"skillList"') {
            subFieldData = skillList;
            list = true;
          } else {
            try {
              subFieldData = JSON.parse(raw);
            } catch (err) {
              subFieldData = raw;
            }
          }
        }

        showLinkedField(subfield, subFieldData, list);
      });

      var ev = new Event('change', { bubbles: true });
      node.dispatchEvent(ev);
    });
  });
})();
