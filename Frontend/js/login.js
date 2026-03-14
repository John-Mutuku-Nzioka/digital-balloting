const API = 'http://localhost:3000/api';

// ── TAB TOGGLE ──
function showTab(tab) {
  const voterForm = document.getElementById('voterForm');
  const adminForm = document.getElementById('adminForm');
  const voterTab  = document.getElementById('voterTab');
  const adminTab  = document.getElementById('adminTab');

  if (tab === 'voter') {
    voterForm.style.display = 'block';
    adminForm.style.display = 'none';
    voterTab.className = 'btn btn-primary';
    adminTab.className = 'btn btn-secondary';
  } else {
    voterForm.style.display = 'none';
    adminForm.style.display = 'block';
    voterTab.className = 'btn btn-secondary';
    adminTab.className = 'btn btn-primary';
  }
  clearAlerts();
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('successMsg').style.display = 'none';
}

function showSuccess(msg) {
  const el = document.getElementById('successMsg');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('errorMsg').style.display = 'none';
}

function clearAlerts() {
  document.getElementById('errorMsg').style.display = 'none';
  document.getElementById('successMsg').style.display = 'none';
}

// ── VOTER LOGIN ──
document.getElementById('voterForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlerts();
  const reg_number = document.getElementById('reg_number').value.trim();
  const password   = document.getElementById('voterPassword').value;

  try {
    const res  = await fetch(`${API}/auth/voter-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reg_number, password })
    });
    const data = await res.json();

    if (!res.ok) return showError(data.message);

    // Store voter_id for OTP page
    sessionStorage.setItem('voter_id', data.voter_id);
    showSuccess('OTP sent! Redirecting...');
    setTimeout(() => window.location.href = 'otp.html', 1500);
  } catch {
    showError('Network error. Please try again.');
  }
});

// ── ADMIN LOGIN ──
document.getElementById('adminForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlerts();
  const email    = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  try {
    const res  = await fetch(`${API}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) return showError(data.message);

    localStorage.setItem('token', data.token);
    localStorage.setItem('adminName', data.name);
    showSuccess('Login successful! Redirecting...');
    setTimeout(() => window.location.href = 'admin-dashboard.html', 1000);
  } catch {
    showError('Network error. Please try again.');
  }
});

// ── OTP PAGE LOGIC ──
if (document.querySelector('.otp-inputs')) {
  const digits = document.querySelectorAll('.otp-digit');

  // Auto-advance between OTP boxes
  digits.forEach((input, i) => {
    input.addEventListener('input', () => {
      if (input.value && i < digits.length - 1) digits[i + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) digits[i - 1].focus();
    });
  });

  // Countdown timer for resend
  let countdown = 30;
  const countdownEl = document.getElementById('countdown');
  const resendBtn   = document.getElementById('resendBtn');
  resendBtn.style.pointerEvents = 'none';
  resendBtn.style.opacity = '0.4';

  const timer = setInterval(() => {
    countdown--;
    countdownEl.textContent = ` (${countdown}s)`;
    if (countdown <= 0) {
      clearInterval(timer);
      countdownEl.textContent = '';
      resendBtn.style.pointerEvents = 'auto';
      resendBtn.style.opacity = '1';
    }
  }, 1000);

  document.getElementById('otpForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();
    const otp      = [...digits].map(d => d.value).join('');
    const voter_id = sessionStorage.getItem('voter_id');

    if (otp.length < 6) return showError('Please enter all 6 digits.');

    try {
      const res  = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_id, otp })
      });
      const data = await res.json();

      if (!res.ok) return showError(data.message);

      localStorage.setItem('token', data.token);
      localStorage.setItem('voterName', data.name);
      showSuccess('Verified! Redirecting to ballot...');
      setTimeout(() => window.location.href = 'ballot.html', 1000);
    } catch {
      showError('Network error. Please try again.');
    }
  });
}