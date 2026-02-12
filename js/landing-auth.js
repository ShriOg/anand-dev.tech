const API_URL = 'https://anand-os-backend.onrender.com';

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  const loginBtn = document.getElementById('loginBtn');
  
  errorMessage.classList.remove('show');
  errorMessage.textContent = '';
  
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }
    
    if (data.accessToken) {
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('userEmail', email);
      window.location.href = '/os/dashboard.html';
    } else {
      throw new Error('No access token received');
    }
  } catch (error) {
    showError(error.message);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

if (localStorage.getItem('authToken') && window.location.pathname !== '/os/dashboard.html') {
  window.location.href = '/os/dashboard.html';
}
