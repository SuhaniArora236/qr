const API_BASE = '/api';

function showAlert(message, type = 'error') {
  let container = document.getElementById('alert-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'alert-container';
    document.body.appendChild(container);
  }
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type}`;
  alertEl.innerText = message;
  container.appendChild(alertEl);
  setTimeout(() => alertEl.remove(), 3000);
}

function setAuth(token, userId) {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
}

function getAuth() {
  return {
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId')
  };
}

function checkAuth(redirectIfNotLoggedIn = true) {
  const { token, userId } = getAuth();
  if (!token || !userId) {
    if (redirectIfNotLoggedIn) window.location.href = '/login.html';
    return false;
  }
  return true;
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const { token } = getAuth();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    if (res.status === 401) {
      clearAuth();
      window.location.href = '/login.html';
      return null;
    }
    return data;
  } catch (err) {
    console.error(err);
    showAlert('Network error occurred');
    return null;
  }
}
