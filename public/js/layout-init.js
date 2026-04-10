document.addEventListener('DOMContentLoaded', function () {
  var sidenavElems = document.querySelectorAll('.sidenav');
  if (window.M && M.Sidenav && sidenavElems.length) M.Sidenav.init(sidenavElems);

  var selectElems = document.querySelectorAll('select');
  if (window.M && M.FormSelect && selectElems.length) M.FormSelect.init(selectElems);

  var modalElems = document.querySelectorAll('.modal');
  if (window.M && M.Modal && modalElems.length) M.Modal.init(modalElems);

  var tooltipElems = document.querySelectorAll('.tooltipped');
  if (window.M && M.Tooltip && tooltipElems.length) M.Tooltip.init(tooltipElems);

  if (window.self !== window.top) {
    var topNav = document.querySelector('nav');
    if (topNav) topNav.style.display = 'none';
    var mobileSidenav = document.querySelector('#mobile-demo');
    if (mobileSidenav) mobileSidenav.style.display = 'none';
    document.body.classList.add('in-iframe');
  }
});
