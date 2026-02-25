const API_URL = 'https://anand-os-backend.onrender.com';
const WEBOS_BASE = '/webos';

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
    
    const rawText = await response.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseError) {
      data = { message: rawText || 'Invalid server response' };
    }
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }
    
    if (data.accessToken) {
      localStorage.setItem('authToken', 'true');
      localStorage.setItem('accessToken', data.accessToken);
      window.location.replace(`${WEBOS_BASE}/os/`);
    } else {
      throw new Error('No access token received');
    }
  } catch (error) {
    showError(error.message);
    enableLoginAfterDelay(loginBtn, 3000);
  }
}

function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

function enableLoginAfterDelay(loginBtn, delayMs) {
  setTimeout(() => {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }, delayMs);
}

