document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;

  const { userId } = getAuth();
  const res = await apiCall(`/user/${userId}`);
  
  if (res && res.success) {
    document.getElementById('welcome-text').innerText = `Welcome, ${res.user.fullName}`;
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  clearAuth();
  window.location.href = '/login.html';
});
