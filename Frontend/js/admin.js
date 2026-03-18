const API = 'https://digital-balloting-production1.up.railway.app/api';
console.log('API URL:', API);
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
if (!token) window.location.href = 'login.html';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function showMsg(msg, type = 'success') {
  const id = type === 'success' ? 'successMsg' : 'errorMsg';
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function formatDate(str) {
  return new Date(str).toLocaleString();
}

// ── LOAD ELECTIONS LIST ──
async function loadElections() {
  try {
    const res  = await fetch(`${API}/admin/elections`, { headers: authHeaders() });
    const data = await res.json();

    // Populate elections table
    const tbody = document.getElementById('electionsTable');
    if (tbody) {
      tbody.innerHTML = data.length === 0
        ? '<tr><td colspan="5" style="text-align:center;color:#999">No elections yet.</td></tr>'
        : data.map(e => `
            <tr>
              <td>${e.title}</td>
              <td>${formatDate(e.start_datetime)}</td>
              <td>${formatDate(e.end_datetime)}</td>
              <td><span class="badge badge-${e.status}">${e.status}</span></td>
              <td>
                ${e.status === 'created'
                  ? `<button onclick="activateElection(${e.election_id})"
                      style="background:#16a34a;color:white;border:none;
                      padding:5px 12px;border-radius:6px;cursor:pointer;">Activate</button>`
                  : ''}
                ${e.status === 'active'
                  ? `<button onclick="closeElection(${e.election_id})"
                      style="background:#dc2626;color:white;border:none;
                      padding:5px 12px;border-radius:6px;cursor:pointer;">Close</button>`
                  : ''}
              </td>
            </tr>`).join('');
    }

    // Populate election dropdown for adding positions
    const posSelect = document.getElementById('posElectionId');
    if (posSelect) {
      posSelect.innerHTML = '<option value="">-- Select Election --</option>' +
        data.map(e => `<option value="${e.election_id}">${e.title}</option>`).join('');
    }

    // Populate results dropdown
    const resSelect = document.getElementById('electionSelect');
    if (resSelect) {
      resSelect.innerHTML = '<option value="">-- Choose an election --</option>' +
        data.map(e => `<option value="${e.election_id}">${e.title}</option>`).join('');
    }

    // Stats
    if (document.getElementById('statElections')) {
      document.getElementById('statElections').textContent = data.length;
      const active = data.filter(e => e.status === 'active').length;
    }
  } catch (err) {
    console.error(err);
  }
}

// ── CREATE ELECTION ──
async function createElection() {
  const body = {
    title:          document.getElementById('elecTitle').value.trim(),
    description:    document.getElementById('elecDesc').value.trim(),
    start_datetime: document.getElementById('elecStart').value,
    end_datetime:   document.getElementById('elecEnd').value
  };
  if (!body.title || !body.start_datetime || !body.end_datetime)
    return showMsg('Please fill in all required fields.', 'error');

  const res  = await fetch(`${API}/admin/election`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
  });
  const data = await res.json();
  showMsg(data.message, res.ok ? 'success' : 'error');
  if (res.ok) loadElections();
}

// ── ADD POSITION ──
async function addPosition() {
  const body = {
    election_id:   document.getElementById('posElectionId').value,
    position_name: document.getElementById('positionName').value.trim()
  };
  if (!body.election_id || !body.position_name)
    return showMsg('Select an election and enter a position name.', 'error');

  const res  = await fetch(`${API}/admin/position`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
  });
  const data = await res.json();
  showMsg(data.message, res.ok ? 'success' : 'error');
  if (res.ok) loadPositionsForCandidates();
}

// ── LOAD POSITIONS FOR CANDIDATE DROPDOWN ──
async function loadPositionsForCandidates() {
  const elecId = document.getElementById('posElectionId')?.value;
  if (!elecId) return;

  const res  = await fetch(`${API}/admin/elections`, { headers: authHeaders() });
  // We'll fetch positions differently — via a simple approach:
  // re-use the ballot endpoint structure or add a positions endpoint
  // For now, reload the page to refresh dropdowns
}

// ── ADD CANDIDATE ──
async function addCandidate() {
  const body = {
    position_id: document.getElementById('candPositionId').value,
    name:        document.getElementById('candName').value.trim(),
    description: document.getElementById('candDesc').value.trim()
  };
  if (!body.position_id || !body.name)
    return showMsg('Select a position and enter a candidate name.', 'error');

  const res  = await fetch(`${API}/admin/candidate`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
  });
  const data = await res.json();
  showMsg(data.message, res.ok ? 'success' : 'error');
}

// ── REGISTER VOTER ──
async function registerVoter() {
  const body = {
    name:       document.getElementById('voterName').value.trim(),
    reg_number: document.getElementById('voterReg').value.trim(),
    email:      document.getElementById('voterEmail').value.trim(),
    password:   document.getElementById('voterPass').value
  };
  if (!body.name || !body.reg_number || !body.email || !body.password)
    return showMsg('All voter fields are required.', 'error');

  const res  = await fetch(`${API}/admin/register-voter`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
  });
  const data = await res.json();
  showMsg(data.message, res.ok ? 'success' : 'error');
}

// ── ACTIVATE / CLOSE ELECTION ──
async function activateElection(id) {
  const res = await fetch(`${API}/admin/election/${id}/activate`, {
    method: 'PUT', headers: authHeaders()
  });
  const data = await res.json();
  showMsg(data.message, res.ok ? 'success' : 'error');
  if (res.ok) loadElections();
}

async function closeElection(id) {
  if (!confirm('Are you sure you want to close this election?')) return;
  const res = await fetch(`${API}/admin/election/${id}/close`, {
    method: 'PUT', headers: authHeaders()
  });
  const data = await res.json();
  showMsg(data.message, res.ok ? 'success' : 'error');
  if (res.ok) loadElections();
}

// ── AUDIT LOGS ──
async function loadAuditLogs() {
  const tbody = document.getElementById('auditTable');
  if (!tbody) return;
  try {
    const res  = await fetch(`${API}/admin/audit-logs`, { headers: authHeaders() });
    const data = await res.json();
    tbody.innerHTML = data.map(log => `
      <tr>
        <td>${log.user_id || '—'}</td>
        <td>${log.user_type}</td>
        <td>${log.action_type}</td>
        <td>${log.ip_address || '—'}</td>
        <td>${formatDate(log.created_at)}</td>
      </tr>`).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="5" style="color:#999;text-align:center">Failed to load logs.</td></tr>';
  }
}

// ── RESULTS PAGE ──
async function loadResults() {
  const election_id = document.getElementById('electionSelect')?.value;
  if (!election_id) return showMsg('Please select an election.', 'error');

  const res  = await fetch(`${API}/results/${election_id}`, { headers: authHeaders() });
  const data = await res.json();

  if (!res.ok) return showMsg(data.message, 'error');

  document.getElementById('totalVoters').textContent = data.total_voters;
  document.getElementById('totalVoted').textContent  = data.total_voted;
  document.getElementById('turnoutPct').textContent  = data.turnout_percentage + '%';

  const container = document.getElementById('positionResults');
  container.innerHTML = '';

  data.positions.forEach(pos => {
    const maxVotes = Math.max(...pos.candidates.map(c => c.votes), 1);
    const winner   = pos.candidates.reduce(
      (a, b) => a.votes >= b.votes ? a : b, pos.candidates[0]
    );

    let html = `<div class="card"><h3>${pos.position_name}</h3>`;
    pos.candidates.forEach(c => {
      const pct      = ((c.votes / data.total_voted) * 100 || 0).toFixed(1);
      const isWinner = c.candidate_id === winner.candidate_id;
      html += `
        <div class="result-bar-wrap">
          <div class="result-bar-label">
            <span>${c.name} ${isWinner ? '🏆' : ''}</span>
            <span>${c.votes} votes (${pct}%)</span>
          </div>
          <div class="result-bar">
            <div class="result-bar-fill ${isWinner ? 'winner' : ''}"
              style="width:${(c.votes/maxVotes)*100}%"></div>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML += html;
  });

  document.getElementById('resultsContent').style.display = 'block';
}

// ── INIT ──
loadElections();
loadAuditLogs();
loadVoters();

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

// ── LOAD VOTERS ──
async function loadVoters() {
  try {
    const res = await fetch(`${API}/admin/voters`, { headers: authH() });
    const data = await res.json();
    const tbody = document.getElementById('votersTable');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:rgba(26,26,46,0.35); padding:28px;">No voters registered yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(v => `
      <tr>
        <td style="font-weight:500;">${v.name}</td>
        <td style="color:rgba(26,26,46,0.55); font-family:monospace;">${v.reg_number}</td>
        <td style="color:rgba(26,26,46,0.55);">${v.email}</td>
        <td>
          <span class="badge ${v.voted_flag ? 'badge-active' : 'badge-created'}">
            ${v.voted_flag ? '✓ Voted' : 'Pending'}
          </span>
        </td>
        <td style="color:rgba(26,26,46,0.45); font-size:12px;">${fmt(v.created_at)}</td>
      </tr>`).join('');

    // Update stats
    document.getElementById('statVoters').textContent = data.length;
    const voted = data.filter(v => v.voted_flag).length;
    document.getElementById('statVoted').textContent = voted;
    document.getElementById('statTurnout').textContent =
      data.length > 0 ? ((voted / data.length) * 100).toFixed(1) + '%' : '0%';

  } catch (err) {
    console.error(err);
  }
}