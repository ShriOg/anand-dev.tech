let adminStats = null;
let adminUsers = [];

async function initAdminModule(container) {
  container.innerHTML = `
    <div class="module-header">
      <h2>Admin Dashboard</h2>
      <button class="btn-secondary" onclick="refreshAdminData()">Refresh</button>
    </div>
    <div id="adminStats" class="admin-stats"></div>
    <div id="adminUsers" class="admin-users">
      <h3>Users</h3>
      <div id="usersList" class="users-list"></div>
    </div>
  `;
  
  await loadAdminData();
}

async function loadAdminData() {
  try {
    const [stats, users] = await Promise.all([
      api.get('/api/admin/stats'),
      api.get('/api/admin/users'),
    ]);
    
    adminStats = stats;
    adminUsers = users.users || [];
    
    renderAdminStats();
    renderAdminUsers();
  } catch (error) {
    console.error('Failed to load admin data:', error);
    document.getElementById('adminStats').innerHTML = '<p class="error-message">Failed to load admin data</p>';
  }
}

function renderAdminStats() {
  const statsContainer = document.getElementById('adminStats');
  
  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-info">
        <h4>Total Users</h4>
        <p class="stat-value">${adminStats.totalUsers}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📝</div>
      <div class="stat-info">
        <h4>Total Notes</h4>
        <p class="stat-value">${adminStats.totalNotes}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📁</div>
      <div class="stat-info">
        <h4>Total Files</h4>
        <p class="stat-value">${adminStats.totalFiles}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💾</div>
      <div class="stat-info">
        <h4>Storage Used</h4>
        <p class="stat-value">${formatFileSize(adminStats.totalStorage)}</p>
      </div>
    </div>
  `;
}

function renderAdminUsers() {
  const usersList = document.getElementById('usersList');
  
  if (adminUsers.length === 0) {
    usersList.innerHTML = '<p class="empty-state">No users found</p>';
    return;
  }
  
  usersList.innerHTML = `
    <table class="users-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${adminUsers.map(user => `
          <tr>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
              ${user.role !== 'admin' ? `<button class="btn-danger-small" onclick="deleteUser('${user._id}')">Delete</button>` : '<span class="text-muted">—</span>'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    await api.delete(`/api/admin/users/${userId}`);
    await loadAdminData();
  } catch (error) {
    alert('Failed to delete user: ' + error.message);
  }
}

async function refreshAdminData() {
  await loadAdminData();
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
