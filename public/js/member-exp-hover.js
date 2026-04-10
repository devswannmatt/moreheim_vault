(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var elems = document.querySelectorAll('.exp-square-unearned');

    elems.forEach(function (elem, index) {
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
  });
})();
