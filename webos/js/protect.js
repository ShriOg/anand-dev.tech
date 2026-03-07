document.addEventListener('DOMContentLoaded', function () {
  var token = localStorage.getItem('authToken');
  if (!token) {
    window.location.replace((window.WEBOS_BASE || '/webos') + '/login/');
  }
});
