document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('fullName').value;
  const phone = document.getElementById('phone').value;
  const dob = document.getElementById('dob').value;
  const policyNumber = document.getElementById('policyNumber').value;
  const password = document.getElementById('password').value;

  const btn = document.getElementById('signup-btn');
  btn.disabled = true;
  btn.innerText = 'Verifying...';

  // 1. Verify Policy
  const verifyRes = await apiCall('/auth/verify-policy', 'POST', { policyNumber, fullName });
  
  if (!verifyRes || !verifyRes.success) {
    showAlert(verifyRes ? verifyRes.message : 'Policy verification failed');
    btn.disabled = false;
    btn.innerText = 'Verify Policy & Signup';
    return;
  }

  // 2. Signup
  btn.innerText = 'Creating Account...';
  const signupRes = await apiCall('/auth/signup', 'POST', {
    fullName, phone, dob, policyNumber, password
  });

  if (signupRes && signupRes.success) {
    setAuth(signupRes.token, signupRes.userId);
    window.location.href = '/dashboard.html';
  } else {
    showAlert(signupRes ? signupRes.message : 'Signup failed');
    btn.disabled = false;
    btn.innerText = 'Verify Policy & Signup';
  }
});
