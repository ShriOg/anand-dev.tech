let currentUser = null;
let currentModule = 'notes';

async function initDashboard() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const userData = await api.get('/api/auth/me');
    currentUser = userData;
    
    document.getElementById('userEmail').textContent = userData.email;
    
    if (userData.role !== 'admin') {
      document.querySelector('[data-module="admin"]').style.display = 'none';
    }
    
    loadModule('notes');
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
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
  localStorage.removeItem('accessToken');
  window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', initDashboard);
