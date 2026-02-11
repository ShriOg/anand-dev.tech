async function verifyAuth() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  try {
    const response = await fetch('https://anand-os-backend.onrender.com/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/index.html';
      return;
    }

    if (!response.ok) {
      throw new Error('Auth failed');
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    localStorage.removeItem('accessToken');
    window.location.href = '/index.html';
  }
}

verifyAuth();
