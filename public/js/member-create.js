(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var elems = document.querySelectorAll('select');
    if (window.M && M.FormSelect) M.FormSelect.init(elems);

    var unitSelect = document.getElementById('unit');
    var warbandSelect = document.getElementById('warband');
    var qtyInput = document.getElementById('qty');
    var costInput = document.getElementById('cost');
    if (!unitSelect || !qtyInput || !costInput) return;

    var loadedForWarband = null;
    var isLoading = false;

    function formatUnitType(type) {
      var asNumber = Number(type);
      if (asNumber === 1) return 'Hero';
      if (asNumber === 2) return 'Henchman';
      return 'Unknown';
    }

    function rebuildUnitSelect() {
      if (window.M && M.FormSelect) {
        var inst = M.FormSelect.getInstance(unitSelect);
        if (inst) inst.destroy();
        M.FormSelect.init(unitSelect);
      }
      wireLazyLoadHandlers();
    }

    function wireLazyLoadHandlers() {
      var wrapper = unitSelect.closest('.select-wrapper');
      var triggerInput = wrapper ? wrapper.querySelector('input.select-dropdown') : null;

      if (triggerInput && !triggerInput.dataset.lazyLoadBound) {
        triggerInput.dataset.lazyLoadBound = '1';
        triggerInput.addEventListener('mousedown', function () { loadUnitsIfNeeded(false); });
        triggerInput.addEventListener('touchstart', function () { loadUnitsIfNeeded(false); }, { passive: true });
        triggerInput.addEventListener('focus', function () { loadUnitsIfNeeded(false); });
      }

      if (!unitSelect.dataset.lazyLoadBound) {
        unitSelect.dataset.lazyLoadBound = '1';
        unitSelect.addEventListener('focus', function () { loadUnitsIfNeeded(false); });
        unitSelect.addEventListener('click', function () { loadUnitsIfNeeded(false); });
      }
    }

    function setSingleOption(text) {
      unitSelect.innerHTML = '';
      var option = document.createElement('option');
      option.value = '';
      option.textContent = text;
      option.disabled = true;
      option.selected = true;
      unitSelect.appendChild(option);
      rebuildUnitSelect();
    }

    async function loadUnitsIfNeeded(forceReload) {
      var warbandId = warbandSelect && warbandSelect.value ? warbandSelect.value : '';
      if (!forceReload && loadedForWarband === warbandId) return;
      if (isLoading) return;

      isLoading = true;
      setSingleOption('Loading units...');

      try {
        var response = await fetch('/members/unit-options?warband=' + encodeURIComponent(warbandId), {
          method: 'GET',
          credentials: 'same-origin'
        });
        if (!response.ok) throw new Error('Failed to load units');

        var units = await response.json();
        unitSelect.innerHTML = '';

        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = units.length ? 'Choose unit' : 'No units found';
        placeholder.disabled = true;
        placeholder.selected = true;
        unitSelect.appendChild(placeholder);

        units.forEach(function (u) {
          var option = document.createElement('option');
          option.value = u._id;
          option.setAttribute('data-gold', u.gold || 0);
          option.textContent = formatUnitType(u.type) + ' ' + u.name + ' ' + (u.gold || 0) + 'g';
          unitSelect.appendChild(option);
        });

        loadedForWarband = warbandId;
        rebuildUnitSelect();
      } catch (err) {
        setSingleOption('Unable to load units');
      } finally {
        isLoading = false;
      }
    }

    function updateCost() {
      var selectedOption = unitSelect.options[unitSelect.selectedIndex];
      var unitGold = selectedOption ? (parseInt(selectedOption.getAttribute('data-gold'), 10) || 0) : 0;
      var quantity = parseInt(qtyInput.value, 10) || 1;
      costInput.value = unitGold * quantity;
      if (window.M && M.updateTextFields) M.updateTextFields();
    }

    wireLazyLoadHandlers();
    loadUnitsIfNeeded(false);

    if (warbandSelect) {
      warbandSelect.addEventListener('change', function () {
        loadedForWarband = null;
        setSingleOption('Loading units...');
        loadUnitsIfNeeded(false);
        updateCost();
      });
    }

    unitSelect.addEventListener('change', updateCost);
    qtyInput.addEventListener('input', updateCost);
    updateCost();
  });
})();
