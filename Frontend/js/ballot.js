const API = 'http://localhost:3000/api';
const token = localStorage.getItem('token');
let ballotData = null;

if (!token) window.location.href = 'login.html';

document.getElementById('voterName').textContent =
  'Welcome, ' + (localStorage.getItem('voterName') || 'Voter');

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg; el.style.display = 'block';
}

function showSuccess(msg) {
  const el = document.getElementById('successMsg');
  el.textContent = msg; el.style.display = 'block';
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// ── LOAD BALLOT ──
async function loadBallot() {
  try {
    const res  = await fetch(`${API}/vote/ballot`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    document.getElementById('loadingMsg').style.display = 'none';

    if (!res.ok) {
      showError(data.message);
      return;
    }

    ballotData = data;
    document.getElementById('electionTitle').textContent = data.election.title;
    document.getElementById('electionDesc').textContent  = data.election.description || '';

    const container = document.getElementById('positionsContainer');
    container.innerHTML = '';

    data.positions.forEach(pos => {
      const card = document.createElement('div');
      card.className = 'position-card';
      card.innerHTML = `<h3>Position: ${pos.position_name}</h3>`;

      pos.candidates.forEach(cand => {
        const opt = document.createElement('label');
        opt.className = 'candidate-option';
        opt.innerHTML = `
          <input type="radio" name="pos_${pos.position_id}"
            value="${cand.candidate_id}" required>
          <div>
            <div class="candidate-name">${cand.name}</div>
            ${cand.description
              ? `<div class="candidate-desc">${cand.description}</div>`
              : ''}
          </div>`;
        opt.querySelector('input').addEventListener('change', () => {
          card.querySelectorAll('.candidate-option').forEach(o =>
            o.classList.remove('selected'));
          opt.classList.add('selected');
        });
        card.appendChild(opt);
      });

      container.appendChild(card);
    });

    document.getElementById('ballotContent').style.display = 'block';
  } catch {
    document.getElementById('loadingMsg').textContent = 'Failed to load ballot.';
  }
}

// ── REVIEW VOTE ──
function reviewVote() {
  const positions = ballotData.positions;
  let valid = true;
  let html  = '';

  positions.forEach(pos => {
    const selected = document.querySelector(
      `input[name="pos_${pos.position_id}"]:checked`
    );
    if (!selected) {
      valid = false;
      return;
    }
    const cand = pos.candidates.find(
      c => c.candidate_id == selected.value
    );
    html += `
      <div style="padding:12px; border:1px solid #e5e7eb;
        border-radius:8px; margin-bottom:10px;">
        <div style="font-size:0.82rem; color:#666;">${pos.position_name}</div>
        <div style="font-weight:600; color:#1a3c6e;">${cand.name}</div>
      </div>`;
  });

  if (!valid) {
    showError('Please select a candidate for every position.');
    return;
  }

  document.getElementById('reviewContent').innerHTML = html;
  const modal = document.getElementById('reviewModal');
  modal.style.display = 'flex';
}

function closeReview() {
  document.getElementById('reviewModal').style.display = 'none';
}

// ── SUBMIT VOTE ──
async function submitVote() {
  const votes = ballotData.positions.map(pos => {
    const selected = document.querySelector(
      `input[name="pos_${pos.position_id}"]:checked`
    );
    return {
      position_id:  pos.position_id,
      candidate_id: parseInt(selected.value)
    };
  });

  try {
    const res  = await fetch(`${API}/vote/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        election_id: ballotData.election.election_id,
        votes
      })
    });
    const data = await res.json();

    closeReview();

    if (!res.ok) return showError(data.message);

    document.getElementById('ballotContent').style.display = 'none';
    showSuccess('✅ Your vote has been cast successfully! Thank you for voting.');
    setTimeout(logout, 4000);
  } catch {
    showError('Network error. Please try again.');
  }
}

loadBallot();

// ── AUTO LOGOUT ON TOKEN EXPIRY (30 min) ──
(function() {
  const loginTime = localStorage.getItem('loginTime');
  if (!loginTime) {
    localStorage.setItem('loginTime', Date.now());
    return;
  }
  const elapsed = Date.now() - parseInt(loginTime);
  const thirtyMin = 30 * 60 * 1000;
  if (elapsed >= thirtyMin) {
    localStorage.clear();
    window.location.href = 'login.html';
    return;
  }
  // Warn 2 min before expiry
  const remaining = thirtyMin - elapsed;
  setTimeout(() => {
    alert('Your session will expire in 2 minutes. Please save your work.');
  }, remaining - (2 * 60 * 1000));
  // Auto logout when expired
  setTimeout(() => {
    localStorage.clear();
    window.location.href = 'login.html';
  }, remaining);
})();