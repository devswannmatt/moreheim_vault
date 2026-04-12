function initializeDynamicUi(root) {
  var scope = root || document;

  var sidenavElems = scope.querySelectorAll('.sidenav');
  if (window.M && M.Sidenav && sidenavElems.length) M.Sidenav.init(sidenavElems);

  var selectElems = scope.querySelectorAll('select:not(.browser-default)');
  if (window.M && M.FormSelect && selectElems.length) M.FormSelect.init(selectElems);

  var modalElems = scope.querySelectorAll('.modal');
  if (window.M && M.Modal && modalElems.length) M.Modal.init(modalElems);

  var tooltipElems = scope.querySelectorAll('.tooltipped');
  if (window.M && M.Tooltip && tooltipElems.length) M.Tooltip.init(tooltipElems);
}

window.initializeDynamicUi = initializeDynamicUi;

document.addEventListener('DOMContentLoaded', function () {
  initializeDynamicUi(document);

  if (window.self !== window.top) {
    var topNav = document.querySelector('nav');
    if (topNav) topNav.style.display = 'none';
    var mobileSidenav = document.querySelector('#mobile-demo');
    if (mobileSidenav) mobileSidenav.style.display = 'none';
    document.body.classList.add('in-iframe');
  }
});
