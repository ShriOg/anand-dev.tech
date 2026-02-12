document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.replace('/index.html');
  }
});
