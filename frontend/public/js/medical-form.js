document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;

  const { userId } = getAuth();
  
  // Load data
  const res = await apiCall(`/user/${userId}`);
  if (res && res.success) {
    populateForm(res.user);
  }

  // Handle Meds
  document.getElementById('add-med-btn').addEventListener('click', addMedRow);

  // Form Submit
  document.getElementById('medical-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerText = 'Saving...';

    const updateData = {
      userId,
      bloodGroup: document.getElementById('bloodGroup').value,
      emergencyName: document.getElementById('emergencyName').value,
      emergencyPhone: document.getElementById('emergencyPhone').value,
      emergencyPin: document.getElementById('emergencyPin').value,
      conditions: {
        diabetes: document.getElementById('cond_diabetes').checked,
        asthma: document.getElementById('cond_asthma').checked,
        epilepsy: document.getElementById('cond_epilepsy').checked,
        heartCondition: document.getElementById('cond_heartCondition').checked,
        bp: document.getElementById('cond_bp').checked,
        other: document.getElementById('cond_other').value
      },
      allergies: {
        medicines: document.getElementById('alg_medicines').value,
        food: document.getElementById('alg_food').value,
        other: document.getElementById('alg_other').value
      },
      medications: getMeds(),
      history: {
        surgeries: document.getElementById('hist_surgeries').value,
        injuries: document.getElementById('hist_injuries').value,
        implants: document.getElementById('hist_implants').value
      },
      special: {
        pregnancy: document.getElementById('spec_pregnancy').checked,
        disability: document.getElementById('spec_disability').value
      }
    };

    const saveRes = await apiCall('/user/update', 'POST', updateData);
    if (saveRes && saveRes.success) {
      showAlert('Profile saved successfully', 'success');
    } else {
      showAlert('Failed to save profile');
    }
    btn.disabled = false;
    btn.innerText = 'Save Profile';
  });
});

function addMedRow(name = '', dosage = '') {
  const container = document.getElementById('medications-container');
  const div = document.createElement('div');
  div.className = 'med-item';
  div.innerHTML = `
    <input type="text" placeholder="Medicine Name" class="med-name" value="${name}">
    <input type="text" placeholder="Dosage" class="med-dosage" value="${dosage}">
    <button type="button" class="btn btn-outline" style="width: auto; padding: 0 1rem;" onclick="this.parentElement.remove()">X</button>
  `;
  container.appendChild(div);
}

function getMeds() {
  const meds = [];
  document.querySelectorAll('.med-item').forEach(item => {
    const name = item.querySelector('.med-name').value;
    const dosage = item.querySelector('.med-dosage').value;
    if (name) meds.push({ name, dosage });
  });
  return meds;
}

function populateForm(user) {
  if (user.bloodGroup) document.getElementById('bloodGroup').value = user.bloodGroup;
  if (user.emergencyName) document.getElementById('emergencyName').value = user.emergencyName;
  if (user.emergencyPhone) document.getElementById('emergencyPhone').value = user.emergencyPhone;
  if (user.emergencyPin) document.getElementById('emergencyPin').value = user.emergencyPin;

  if (user.conditions) {
    document.getElementById('cond_diabetes').checked = user.conditions.diabetes;
    document.getElementById('cond_asthma').checked = user.conditions.asthma;
    document.getElementById('cond_epilepsy').checked = user.conditions.epilepsy;
    document.getElementById('cond_heartCondition').checked = user.conditions.heartCondition;
    document.getElementById('cond_bp').checked = user.conditions.bp;
    document.getElementById('cond_other').value = user.conditions.other || '';
  }

  if (user.allergies) {
    document.getElementById('alg_medicines').value = user.allergies.medicines || '';
    document.getElementById('alg_food').value = user.allergies.food || '';
    document.getElementById('alg_other').value = user.allergies.other || '';
  }

  if (user.medications && user.medications.length > 0) {
    user.medications.forEach(m => addMedRow(m.name, m.dosage));
  } else {
    addMedRow();
  }

  if (user.history) {
    document.getElementById('hist_surgeries').value = user.history.surgeries || '';
    document.getElementById('hist_injuries').value = user.history.injuries || '';
    document.getElementById('hist_implants').value = user.history.implants || '';
  }

  if (user.special) {
    document.getElementById('spec_pregnancy').checked = user.special.pregnancy;
    document.getElementById('spec_disability').value = user.special.disability || '';
  }
}
