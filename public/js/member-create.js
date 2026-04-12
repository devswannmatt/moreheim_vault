(function () {
  function initMemberCreate(root) {
    var scope = root || document;
    var form = scope.querySelector('#create-member-form');
    if (!form || form.dataset.memberCreateBound === '1') return;
    form.dataset.memberCreateBound = '1';

    var elems = form.querySelectorAll('select');
    if (window.M && M.FormSelect) M.FormSelect.init(elems);

    var unitSelect = form.querySelector('#unit');
    var warbandSelect = form.querySelector('#warband');
    var rosterInput = form.querySelector('#roster');
    var qtyInput = form.querySelector('#qty');
    var costInput = form.querySelector('#cost');
    var remainingGoldInput = form.querySelector('#remaining-gold');
    var rosterGoldInput = form.querySelector('#roster-gold');
    if (!unitSelect || !qtyInput || !costInput) return;

    var loadedForWarband = null;
    var isLoading = false;

    function formatUnitType(type) {
      var asNumber = Number(type);
      if (asNumber === 1) return 'Hero';
      if (asNumber === 2) return 'Henchman';
      return 'Unknown';
    }

    function padRight(value, length) {
      var text = String(value == null ? '' : value);
      if (text.length >= length) return text.slice(0, length);
      return text + ' '.repeat(length - text.length);
    }

    function formatUnitRow(u) {
      var typeLabel = formatUnitType(u.type);
      var nameLabel = String(u.name || '');
      var goldLabel = String(u.gold || 0) + 'g';
      var countLabel = Number(u.maxCount || 0) === 0
        ? 'Unlimited'
        : (String(u.currentCount || 0) + '/' + String(u.maxCount || 0));
      return padRight(typeLabel, 9) + ' ' + padRight(nameLabel, 22) + ' ' + padRight(goldLabel, 7) + ' ' + countLabel;
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
      var rosterId = rosterInput && rosterInput.value ? rosterInput.value : '';
      if (!forceReload && loadedForWarband === warbandId) return;
      if (isLoading) return;

      isLoading = true;
      setSingleOption('Loading units...');

      try {
        var response = await fetch('/members/unit-options?warband=' + encodeURIComponent(warbandId) + '&roster=' + encodeURIComponent(rosterId), {
          method: 'GET',
          credentials: 'same-origin'
        });
        if (!response.ok) throw new Error('Failed to load units');

        var units = await response.json();
        units.sort(function (a, b) {
          function typeRank(type) {
            var n = Number(type);
            if (n === 1) return 1; // Hero
            if (n === 2) return 2; // Henchman
            return 3;
          }

          var rankDelta = typeRank(a.type) - typeRank(b.type);
          if (rankDelta !== 0) return rankDelta;

          var goldDelta = Number(b.gold || 0) - Number(a.gold || 0);
          if (goldDelta !== 0) return goldDelta;

          return String(a.name || '').localeCompare(String(b.name || ''));
        });
        unitSelect.innerHTML = '';

        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = units.length ? 'Choose unit' : 'No units found';
        placeholder.disabled = true;
        placeholder.selected = true;
        unitSelect.appendChild(placeholder);

        if (units.length) {
          var headerOption = document.createElement('option');
          headerOption.value = '';
          headerOption.disabled = true;
          headerOption.textContent = padRight('Type', 9) + ' ' + padRight('Unit', 22) + ' ' + padRight('Cost', 7) + ' Current/Max';
          unitSelect.appendChild(headerOption);
        }

        units.forEach(function (u) {
          var option = document.createElement('option');
          option.value = u._id;
          option.setAttribute('data-gold', u.gold || 0);
          option.setAttribute('data-type', u.type || 0);
          option.textContent = formatUnitRow(u);
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
      var unitType = selectedOption ? (parseInt(selectedOption.getAttribute('data-type'), 10) || 0) : 0;

      if (unitType === 1) {
        qtyInput.value = 1;
        qtyInput.readOnly = true;
        qtyInput.setAttribute('max', '1');
      } else if (unitType === 2) {
        qtyInput.readOnly = false;
        qtyInput.setAttribute('max', '5');
      } else {
        qtyInput.readOnly = false;
        qtyInput.removeAttribute('max');
      }

      var unitGold = selectedOption ? (parseInt(selectedOption.getAttribute('data-gold'), 10) || 0) : 0;
      var quantity = parseInt(qtyInput.value, 10) || 1;
      if (quantity < 1) quantity = 1;
      if (unitType === 1) quantity = 1;
      if (unitType === 2 && quantity > 5) quantity = 5;
      qtyInput.value = quantity;
      costInput.value = unitGold * quantity;

      if (remainingGoldInput) {
        var rosterGold = rosterGoldInput ? (parseInt(rosterGoldInput.value, 10) || 0) : 0;
        var remaining = rosterGold - (unitGold * quantity);
        remainingGoldInput.value = remaining + 'g';
        if (remaining < 0) {
          remainingGoldInput.classList.add('red-text', 'text-darken-2');
        } else {
          remainingGoldInput.classList.remove('red-text', 'text-darken-2');
        }
      }

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
  }

  window.initMemberCreate = initMemberCreate;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initMemberCreate(document); });
  } else {
    initMemberCreate(document);
  }
})();
