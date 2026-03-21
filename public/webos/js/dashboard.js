let currentUser = null;
let currentModule = 'notes';

async function initDashboard() {
  const token = localStorage.getItem('authToken');

  if (!token) {
    window.location.replace('/webos/login/');
    return;
  }

  loadModule('notes');
}

function loadModule(moduleName) {
  currentModule = moduleName;

  document.querySelectorAll('.dock-icon').forEach(icon => {
    icon.classList.remove('active');
  });

  const activeIcon = document.querySelector(`[data-module="${moduleName}"]`);
  if (activeIcon) {
    activeIcon.classList.add('active');
  }

  const workspace = document.getElementById('workspace');
  workspace.innerHTML = '';

  switch(moduleName) {
    case 'notes':
      initNotesModule(workspace);
      break;
    case 'files':
      initFilesModule(workspace);
      break;
    case 'ai':
      initAIModule(workspace);
      break;
    case 'admin':
      if (currentUser && currentUser.role === 'admin') {
        initAdminModule(workspace);
      }
      break;
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('accessToken');
  window.location.replace('/webos/login/');
}

document.addEventListener('DOMContentLoaded', initDashboard);
