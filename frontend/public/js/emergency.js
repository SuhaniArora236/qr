document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  if (!userId) {
    document.body.innerHTML = '<h2 style="text-align:center; margin-top:2rem;">Invalid Emergency Link</h2>';
    return;
  }

  // Fetch data
  const res = await fetch(`/api/user/emergency/${userId}`);
  const data = await res.json();

  if (!data || !data.success) {
    document.body.innerHTML = '<h2 style="text-align:center; margin-top:2rem;">User Not Found</h2>';
    return;
  }

  const user = data.user;
  document.getElementById('emergency-content').style.display = 'block';

  // 1. Populate Header
  document.getElementById('em-name').innerText = user.fullName;
  document.getElementById('em-blood').innerText = user.bloodGroup || 'Unknown';

  // 2. Action Buttons
  const phone = user.emergencyPhone || '';
  document.getElementById('btn-call').href = `tel:${phone}`;
  document.getElementById('btn-sms').href = `sms:${phone}?body=EMERGENCY: I am with ${user.fullName}. Please contact me immediately.`;

  // WhatsApp with Geolocation
  const waBtn = document.getElementById('btn-wa');
  waBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const locLink = `https://maps.google.com/?q=${lat},${lng}`;
          const msg = encodeURIComponent(`EMERGENCY: I am with ${user.fullName}. Location: ${locLink}`);
          window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
        },
        () => {
          // Fallback if no location
          const msg = encodeURIComponent(`EMERGENCY: I am with ${user.fullName}. Please contact me.`);
          window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
        }
      );
    } else {
      const msg = encodeURIComponent(`EMERGENCY: I am with ${user.fullName}. Please contact me.`);
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
  });

  // 3. Medical Info
  const conditions = [];
  if (user.conditions) {
    if (user.conditions.diabetes) conditions.push('Diabetes');
    if (user.conditions.asthma) conditions.push('Asthma');
    if (user.conditions.epilepsy) conditions.push('Epilepsy');
    if (user.conditions.heartCondition) conditions.push('Heart Condition');
    if (user.conditions.bp) conditions.push('Blood Pressure');
    if (user.conditions.other) conditions.push(user.conditions.other);
  }
  document.getElementById('em-conditions').innerText = conditions.length > 0 ? conditions.join(', ') : 'None reported';

  const allergies = [];
  if (user.allergies) {
    if (user.allergies.medicines) allergies.push(`Meds: ${user.allergies.medicines}`);
    if (user.allergies.food) allergies.push(`Food: ${user.allergies.food}`);
    if (user.allergies.other) allergies.push(`Other: ${user.allergies.other}`);
  }
  document.getElementById('em-allergies').innerText = allergies.length > 0 ? allergies.join(' | ') : 'None reported';

  const medsUl = document.getElementById('em-meds');
  if (user.medications && user.medications.length > 0) {
    user.medications.forEach(m => {
      const li = document.createElement('li');
      li.innerText = `${m.name} (${m.dosage})`;
      medsUl.appendChild(li);
    });
  } else {
    medsUl.innerHTML = '<li>None</li>';
  }

  const special = [];
  if (user.special) {
    if (user.special.pregnancy) special.push('Pregnant');
    if (user.special.disability) special.push(user.special.disability);
  }
  document.getElementById('em-special').innerText = special.length > 0 ? special.join(', ') : 'None';

  // 4. Locked Section (PIN Logic)
  const actualPin = user.emergencyPin;
  document.getElementById('unlock-btn').addEventListener('click', () => {
    const inputPin = document.getElementById('pin-input').value;
    if (actualPin && inputPin === actualPin) {
      document.getElementById('locked-section').classList.add('hidden');
      document.getElementById('unlocked-section').classList.remove('hidden');
      
      // Populate hidden details
      document.getElementById('ul-name').innerText = user.fullName;
      document.getElementById('ul-dob').innerText = new Date(user.dob).toLocaleDateString();
      document.getElementById('ul-policy').innerText = user.policyNumber;
    } else {
      document.getElementById('pin-error').classList.remove('hidden');
      setTimeout(() => document.getElementById('pin-error').classList.add('hidden'), 3000);
    }
  });
});
