function verifyAuth() {
  const token = localStorage.getItem('authToken');

  if (!token) {
    window.location.href = '/index.html';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  verifyAuth();
});
