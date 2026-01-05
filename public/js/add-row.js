(function () {
    function createSelect(name, selectedValue) {
        const select = document.createElement('select');
        select.name = name;
        select.required = true;
        // placeholder option
        const ph = document.createElement('option');
        ph.value = '';
        ph.disabled = true;
        ph.textContent = 'Choose item';
        select.appendChild(ph);

        LOOKUP_LIST.forEach(function (it) {
            const opt = document.createElement('option');
            opt.value = it._id;
            opt.textContent = it.name;
            opt.dataset.gold = it.gold || 0;
            if (selectedValue && String(selectedValue) === String(it._id)) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
        return select;
    }

    function appendRow(selectedItemId) {
        const tbody = document.querySelector('#items-table tbody');
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        const select = createSelect('items[]', selectedItemId);
        // wrap select for Materialize
        const wrapper = document.createElement('div');
        wrapper.className = 'input-field';
        wrapper.appendChild(select);
        tdName.appendChild(wrapper);

        const tdDesc = document.createElement('td');
        tdDesc.textContent = '';

        const tdGold = document.createElement('td');
        tdGold.textContent = '';

        // remove button
        const tdAction = document.createElement('td');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-flat red-text remove-item-btn';
        btn.textContent = 'Remove';
        tdAction.appendChild(btn);

        tr.appendChild(tdName);
        tr.appendChild(tdDesc);
        tr.appendChild(tdGold);
        tr.appendChild(tdAction);

        tbody.appendChild(tr);

        // initialize Materialize select
        if (window.M && M.FormSelect) {
            M.FormSelect.init(select);
        }

        // update description/gold on change
        function updateFromSelect() {
            const chosen = LOOKUP_LIST.find(i => String(i._id) === String(select.value));
            tdDesc.textContent = (chosen && chosen.description) ? chosen.description : '';
            tdGold.textContent = (chosen && chosen.gold) ? chosen.gold : '';
        }
        select.addEventListener('change', updateFromSelect);

        // if a selectedItemId was provided, trigger update to fill desc/gold
        if (selectedItemId) {
            // if Materialize replaced the select, the value is already set via selected option
            updateFromSelect();
        }

        btn.addEventListener('click', function () {
            tr.remove();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        EXISTING_LIST.forEach(function (it) {
            var id = (it && it._id) ? it._id : it;
            appendRow(id);
        });

        const addBtn = document.getElementById('add-item-btn');
        if (addBtn) addBtn.addEventListener('click', function () { appendRow(); });
    });
})();