
(function () {
  function initMemberExpHover(root) {
    var scope = root || document;
    var elems = scope.querySelectorAll('.exp-square-unearned');
    if (!elems.length) return;

    elems.forEach(function (elem, index) {
      if (elem.dataset.expHoverBound === '1') return;
      elem.dataset.expHoverBound = '1';
      elem.addEventListener('mouseover', function () {
        elems.forEach(function (e, i) {
          if (i <= index) e.classList.add('exp-square-level-pending');
        });
      });

      elem.addEventListener('mouseout', function () {
        elems.forEach(function (e) {
          e.classList.remove('exp-square-level-pending');
        });
      });
    });

  }

  window.initMemberExpHover = initMemberExpHover;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initMemberExpHover(document); });
  } else {
    initMemberExpHover(document);
  }
})();
