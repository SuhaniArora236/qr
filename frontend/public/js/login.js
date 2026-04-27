document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerText = 'Logging in...';

  const loginRes = await apiCall('/auth/login', 'POST', { phone, password });

  if (loginRes && loginRes.success) {
    setAuth(loginRes.token, loginRes.userId);
    window.location.href = '/dashboard.html';
  } else {
    showAlert(loginRes ? loginRes.message : 'Login failed');
    btn.disabled = false;
    btn.innerText = 'Login';
  }
});
