// ============================================
// TOURNEO ADMIN DASHBOARD - Application Logic
// ============================================

const API_BASE = '/api/v1';
let currentPage = 'dashboard';
let currentEventFilter = 'all';
let allEvents = [];
let allParticipants = [];

// ============================================
// NAVIGATION
// ============================================

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.style.display = 'block';
  
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => {
    if (n.textContent.trim().toLowerCase().includes(getNavLabel(pageId))) {
      n.classList.add('active');
    }
  });

  currentPage = pageId;
  
  const titles = {
    'dashboard': 'Dashboard',
    'events': 'Turniere',
    'participants': 'Teilnehmer',
    'brackets': 'Brackets & Ergebnisse',
    'checkin': 'Check-In',
    'refunds': 'Erstattungen',
    'hall-of-fame': 'Hall of Fame',
    'users': 'Benutzer',
    'audit': 'Audit Log',
    'notifications': 'Nachrichten',
  };
  document.getElementById('page-title').textContent = titles[pageId] || pageId;

  const actionBtn = document.getElementById('header-action-btn');
  if (pageId === 'events') {
    actionBtn.style.display = 'inline-flex';
    actionBtn.textContent = '+ Neues Turnier';
  } else {
    actionBtn.style.display = 'none';
  }

  // Load page data
  switch (pageId) {
    case 'dashboard': loadDashboard(); break;
    case 'events': loadEvents(); break;
    case 'refunds': loadRefunds(); break;
    case 'users': loadUsers(); break;
    case 'audit': loadAuditLogs(); break;
  }

  // Populate event selects
  populateEventSelects();
}

function getNavLabel(pageId) {
  const map = {
    'dashboard': 'dashboard',
    'events': 'turniere',
    'participants': 'teilnehmer',
    'brackets': 'brackets',
    'checkin': 'check-in',
    'refunds': 'erstattungen',
    'hall-of-fame': 'hall of fame',
    'users': 'benutzer',
    'audit': 'audit log',
    'notifications': 'nachrichten',
  };
  return map[pageId] || pageId;
}

function headerAction() {
  if (currentPage === 'events') showCreateEventModal();
}

// ============================================
// DEMO DATA (since no real API connection)
// ============================================

const demoEvents = [
  { id: 1, title: 'Padel Summer Cup 2025', sport_category: 'padel', start_date: '2025-07-15T10:00:00', end_date: '2025-07-15T18:00:00', status: 'registration_open', max_participants: 32, participant_count: 24, entry_fee_cents: 4900, venue_name: 'Padel City Hamburg', venue_city: 'Hamburg', level: 'open', access_type: 'public', is_archived: false },
  { id: 2, title: 'FIFA Pro League S3', sport_category: 'fifa', start_date: '2025-07-20T14:00:00', end_date: '2025-07-20T22:00:00', status: 'published', max_participants: 64, participant_count: 12, entry_fee_cents: 1500, venue_name: 'eSport Arena', venue_city: 'Berlin', level: 'advanced', access_type: 'members_only', is_archived: false },
  { id: 3, title: 'Club Championship Q3', sport_category: 'padel', start_date: '2025-08-05T09:00:00', end_date: '2025-08-05T20:00:00', status: 'draft', max_participants: 16, participant_count: 0, entry_fee_cents: 7900, venue_name: 'Padel Premium Courts', venue_city: 'München', level: 'advanced', access_type: 'club_only', is_archived: false },
  { id: 4, title: 'Anfänger Turnier Juni', sport_category: 'padel', start_date: '2025-06-10T10:00:00', end_date: '2025-06-10T16:00:00', status: 'completed', max_participants: 16, participant_count: 16, entry_fee_cents: 2500, venue_name: 'Padel Park', venue_city: 'Köln', level: 'beginner', access_type: 'public', is_archived: false },
  { id: 5, title: 'Mixed Doubles Open', sport_category: 'padel', start_date: '2025-07-28T11:00:00', end_date: '2025-07-28T19:00:00', status: 'in_progress', max_participants: 24, participant_count: 24, entry_fee_cents: 3900, venue_name: 'Padel Arena', venue_city: 'Frankfurt', level: 'intermediate', access_type: 'public', is_archived: false },
];

const demoParticipants = [
  { id: 1, user_id: 10, first_name: 'Max', last_name: 'Müller', email: 'max@example.com', status: 'confirmed', checked_in: true, membership_tier_at_registration: 'club', waitlist_position: null, seed_number: 1 },
  { id: 2, user_id: 11, first_name: 'Anna', last_name: 'Schmidt', email: 'anna@example.com', status: 'confirmed', checked_in: false, membership_tier_at_registration: 'plus', waitlist_position: null, seed_number: 2 },
  { id: 3, user_id: 12, first_name: 'Tom', last_name: 'Weber', email: 'tom@example.com', status: 'confirmed', checked_in: true, membership_tier_at_registration: 'free', waitlist_position: null, seed_number: 3 },
  { id: 4, user_id: 13, first_name: 'Lisa', last_name: 'Fischer', email: 'lisa@example.com', status: 'confirmed', checked_in: false, membership_tier_at_registration: 'plus', waitlist_position: null, seed_number: 4 },
  { id: 5, user_id: 14, first_name: 'Jan', last_name: 'Koch', email: 'jan@example.com', status: 'waitlisted', checked_in: false, membership_tier_at_registration: 'free', waitlist_position: 1, seed_number: null },
  { id: 6, user_id: 15, first_name: 'Sarah', last_name: 'Bauer', email: 'sarah@example.com', status: 'pending_payment', checked_in: false, membership_tier_at_registration: 'club', waitlist_position: null, seed_number: null },
];

const demoRefunds = [
  { id: 1, amount_cents: 4900, reason: 'user_cancellation_14d', requester_email: 'max@example.com', status: 'pending', created_at: '2025-06-28T14:30:00' },
  { id: 2, amount_cents: 2500, reason: 'organizer_cancellation', requester_email: 'anna@example.com', status: 'approved', created_at: '2025-06-25T09:15:00' },
  { id: 3, amount_cents: 1500, reason: 'admin_decision', requester_email: 'tom@example.com', status: 'rejected', created_at: '2025-06-20T16:45:00' },
];

const demoUsers = [
  { id: 1, first_name: 'Lukas', last_name: 'Groß', email: 'gross.lukas01@web.de', role: 'superadmin', status: 'active', membership_tier: 'club', created_at: '2024-12-01' },
  { id: 2, first_name: 'Max', last_name: 'Müller', email: 'max@example.com', role: 'admin', status: 'active', membership_tier: 'club', created_at: '2025-01-15' },
  { id: 3, first_name: 'Anna', last_name: 'Schmidt', email: 'anna@example.com', role: 'user', status: 'active', membership_tier: 'plus', created_at: '2025-02-10' },
  { id: 4, first_name: 'Tom', last_name: 'Weber', email: 'tom@example.com', role: 'user', status: 'active', membership_tier: 'free', created_at: '2025-03-20' },
  { id: 5, first_name: 'Lisa', last_name: 'Fischer', email: 'lisa@example.com', role: 'user', status: 'suspended', membership_tier: 'plus', created_at: '2025-04-05' },
];

const demoAuditLogs = [
  { id: 1, actor_email: 'gross.lukas01@web.de', actor_role: 'superadmin', action: 'event.created', resource_type: 'event', resource_id: 1, resource_label: 'Padel Summer Cup 2025', created_at: '2025-06-28T15:00:00' },
  { id: 2, actor_email: 'gross.lukas01@web.de', actor_role: 'superadmin', action: 'event.published', resource_type: 'event', resource_id: 1, resource_label: 'Padel Summer Cup 2025', created_at: '2025-06-28T15:05:00' },
  { id: 3, actor_email: 'max@example.com', actor_role: 'admin', action: 'participant.added_manually', resource_type: 'registration', resource_id: 6, resource_label: 'User 15 → Padel Summer Cup', created_at: '2025-06-28T16:00:00' },
  { id: 4, actor_email: 'gross.lukas01@web.de', actor_role: 'superadmin', action: 'checkin.admin', resource_type: 'registration', resource_id: 1, created_at: '2025-07-15T09:30:00' },
  { id: 5, actor_email: 'gross.lukas01@web.de', actor_role: 'superadmin', action: 'match.result_entered', resource_type: 'match', resource_id: 1, created_at: '2025-07-15T11:00:00' },
  { id: 6, actor_email: 'gross.lukas01@web.de', actor_role: 'superadmin', action: 'refund.approved', resource_type: 'refund', resource_id: 2, created_at: '2025-06-25T10:00:00' },
  { id: 7, actor_email: 'gross.lukas01@web.de', actor_role: 'superadmin', action: 'user.role_changed', resource_type: 'user', resource_id: 2, resource_label: 'max@example.com', created_at: '2025-06-20T14:00:00' },
  { id: 8, actor_email: 'max@example.com', actor_role: 'admin', action: 'notification.sent', resource_type: 'event', resource_id: 1, resource_label: 'Padel Summer Cup 2025', created_at: '2025-07-14T18:00:00' },
];

// ============================================
// DASHBOARD
// ============================================

function loadDashboard() {
  const activeCount = demoEvents.filter(e => ['registration_open', 'in_progress', 'published'].includes(e.status)).length;
  const totalRegs = demoEvents.reduce((sum, e) => sum + e.participant_count, 0);
  const revenue = demoEvents.reduce((sum, e) => sum + (e.participant_count * e.entry_fee_cents), 0);

  document.getElementById('stat-active-events').textContent = activeCount;
  document.getElementById('stat-registrations').textContent = totalRegs;
  document.getElementById('stat-revenue').textContent = formatCurrency(revenue);
  document.getElementById('stat-members').textContent = '47';

  // Upcoming events table
  const upcoming = demoEvents
    .filter(e => e.status !== 'completed' && e.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 5);

  const tbody = document.getElementById('dashboard-events-table');
  tbody.innerHTML = upcoming.map(e => `
    <tr>
      <td>
        <div style="font-weight:600">${e.title}</div>
        <div style="font-size:12px;color:var(--text-tertiary)">${e.venue_name}</div>
      </td>
      <td>${formatDate(e.start_date)}</td>
      <td><span class="badge badge-${e.status}">${statusLabel(e.status)}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <span>${e.participant_count}/${e.max_participants}</span>
          <div class="progress-bar" style="width:60px">
            <div class="fill ${e.participant_count >= e.max_participants ? 'danger' : ''}" style="width:${(e.participant_count/e.max_participants*100)}%"></div>
          </div>
        </div>
      </td>
      <td><button class="btn btn-ghost btn-sm" onclick="showPage('events')">→</button></td>
    </tr>
  `).join('');
}

// ============================================
// EVENTS
// ============================================

function loadEvents() {
  allEvents = [...demoEvents];
  renderEvents(allEvents);
}

function renderEvents(events) {
  const tbody = document.getElementById('events-table');
  
  if (events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><span class="icon">🏆</span><h3>Keine Turniere gefunden</h3></div></td></tr>';
    return;
  }

  tbody.innerHTML = events.map(e => `
    <tr>
      <td>
        <div style="font-weight:600">${e.title}</div>
        <div style="font-size:12px;color:var(--text-tertiary)">${e.venue_name}, ${e.venue_city}</div>
      </td>
      <td><span class="badge badge-${e.sport_category === 'padel' ? 'published' : 'draft'}">${e.sport_category}</span></td>
      <td>${formatDate(e.start_date)}</td>
      <td><span class="badge badge-${e.status}">${statusLabel(e.status)}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:500">${e.participant_count}/${e.max_participants}</span>
          <div class="progress-bar" style="width:60px">
            <div class="fill ${e.participant_count >= e.max_participants ? 'danger' : e.participant_count > e.max_participants * 0.8 ? 'warning' : ''}" style="width:${Math.min(100, e.participant_count/e.max_participants*100)}%"></div>
          </div>
        </div>
      </td>
      <td style="font-weight:500">${formatCurrency(e.participant_count * e.entry_fee_cents)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-sm" onclick="editEvent(${e.id})" title="Bearbeiten">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="duplicateEvent(${e.id})" title="Duplizieren">📋</button>
          ${e.status === 'draft' ? `<button class="btn btn-ghost btn-sm" onclick="publishEvent(${e.id})" title="Veröffentlichen">🚀</button>` : ''}
          ${['published','registration_open'].includes(e.status) ? `<button class="btn btn-ghost btn-sm" onclick="unpublishEvent(${e.id})" title="Unpublish">⏸️</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="archiveEvent(${e.id})" title="Archivieren">📦</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterEvents(status, el) {
  document.querySelectorAll('#page-events .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentEventFilter = status;
  
  const filtered = status === 'all' ? allEvents : allEvents.filter(e => e.status === status);
  renderEvents(filtered);
}

function searchEvents() {
  const q = document.getElementById('event-search').value.toLowerCase();
  let filtered = allEvents;
  if (currentEventFilter !== 'all') filtered = filtered.filter(e => e.status === currentEventFilter);
  if (q) filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || e.venue_city.toLowerCase().includes(q));
  renderEvents(filtered);
}

function publishEvent(id) {
  const event = allEvents.find(e => e.id === id);
  if (event) {
    event.status = 'published';
    renderEvents(currentEventFilter === 'all' ? allEvents : allEvents.filter(e => e.status === currentEventFilter));
    showToast('success', `"${event.title}" veröffentlicht!`);
  }
}

function unpublishEvent(id) {
  const event = allEvents.find(e => e.id === id);
  if (event) {
    event.status = 'draft';
    renderEvents(currentEventFilter === 'all' ? allEvents : allEvents.filter(e => e.status === currentEventFilter));
    showToast('info', `"${event.title}" zurück auf Entwurf gesetzt.`);
  }
}

function duplicateEvent(id) {
  const event = allEvents.find(e => e.id === id);
  if (event) {
    const copy = { ...event, id: allEvents.length + 1, title: event.title + ' (Kopie)', status: 'draft', participant_count: 0 };
    allEvents.push(copy);
    renderEvents(currentEventFilter === 'all' ? allEvents : allEvents.filter(e => e.status === currentEventFilter));
    showToast('success', `"${copy.title}" erstellt!`);
  }
}

function archiveEvent(id) {
  const event = allEvents.find(e => e.id === id);
  if (event && confirm(`"${event.title}" wirklich archivieren?`)) {
    event.is_archived = true;
    allEvents = allEvents.filter(e => !e.is_archived);
    renderEvents(allEvents);
    showToast('info', `"${event.title}" archiviert.`);
  }
}

function editEvent(id) {
  const event = allEvents.find(e => e.id === id);
  if (!event) return;
  document.getElementById('event-modal-title').textContent = 'Turnier bearbeiten';
  document.getElementById('event-title').value = event.title;
  document.getElementById('event-sport').value = event.sport_category;
  document.getElementById('event-description').value = event.description || '';
  document.getElementById('event-max').value = event.max_participants;
  document.getElementById('event-fee').value = (event.entry_fee_cents / 100).toFixed(2);
  document.getElementById('event-level').value = event.level;
  document.getElementById('event-access').value = event.access_type;
  document.getElementById('event-save-btn').textContent = 'Speichern';
  document.getElementById('event-save-btn').setAttribute('data-edit-id', id);
  openModal('event-modal');
}

// ============================================
// PARTICIPANTS
// ============================================

function loadParticipants() {
  const eventId = document.getElementById('participant-event-select').value;
  if (!eventId) return;
  
  allParticipants = [...demoParticipants];
  renderParticipants(allParticipants);
}

function renderParticipants(participants) {
  const tbody = document.getElementById('participants-table');
  
  if (participants.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><span class="icon">👥</span><h3>Keine Teilnehmer</h3></div></td></tr>';
    return;
  }

  tbody.innerHTML = participants.map(p => `
    <tr>
      <td style="font-weight:600">${p.first_name} ${p.last_name}</td>
      <td style="color:var(--text-secondary)">${p.email}</td>
      <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
      <td>${p.checked_in ? '✅' : '⬜'}</td>
      <td><span class="badge badge-${p.membership_tier_at_registration}">${p.membership_tier_at_registration}</span></td>
      <td>${p.waitlist_position ? '#' + p.waitlist_position : '—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          ${p.status === 'waitlisted' ? `<button class="btn btn-ghost btn-sm" onclick="promoteParticipant(${p.id})" title="Aufnehmen">⬆️</button>` : ''}
          ${p.status === 'confirmed' && !p.checked_in ? `<button class="btn btn-ghost btn-sm" onclick="checkinParticipant(${p.id})" title="Check-In">✅</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="removeParticipant(${p.id})" title="Entfernen" style="color:var(--error)">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterParticipants(status, el) {
  document.querySelectorAll('#page-participants .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  
  const filtered = status === 'all' ? allParticipants : allParticipants.filter(p => p.status === status);
  renderParticipants(filtered);
}

function promoteParticipant(id) {
  const p = allParticipants.find(x => x.id === id);
  if (p) {
    p.status = 'pending_payment';
    p.waitlist_position = null;
    renderParticipants(allParticipants);
    showToast('success', `${p.first_name} ${p.last_name} von Warteliste aufgenommen!`);
  }
}

function checkinParticipant(id) {
  const p = allParticipants.find(x => x.id === id);
  if (p) {
    p.checked_in = true;
    renderParticipants(allParticipants);
    showToast('success', `${p.first_name} ${p.last_name} eingecheckt!`);
  }
}

function removeParticipant(id) {
  const p = allParticipants.find(x => x.id === id);
  if (p && confirm(`${p.first_name} ${p.last_name} wirklich entfernen?`)) {
    allParticipants = allParticipants.filter(x => x.id !== id);
    renderParticipants(allParticipants);
    showToast('info', `Teilnehmer entfernt.`);
  }
}

// ============================================
// CHECK-IN
// ============================================

function loadCheckinStatus() {
  const eventId = document.getElementById('checkin-event-select').value;
  if (!eventId) return;
  
  const confirmed = demoParticipants.filter(p => p.status === 'confirmed');
  const checkedIn = confirmed.filter(p => p.checked_in);
  
  document.getElementById('checkin-count').textContent = checkedIn.length;
  document.getElementById('checkin-total').textContent = confirmed.length;
  document.getElementById('checkin-done').textContent = checkedIn.length;
  document.getElementById('checkin-remaining').textContent = confirmed.length - checkedIn.length;
  document.getElementById('checkin-progress-text').textContent = `${checkedIn.length} / ${confirmed.length}`;
  
  const pct = confirmed.length ? (checkedIn.length / confirmed.length * 100) : 0;
  document.getElementById('checkin-progress-bar').style.width = pct + '%';
  
  const list = document.getElementById('checkin-list');
  list.innerHTML = confirmed.map(p => `
    <div class="checkin-item">
      <div class="checkin-avatar">${p.first_name[0]}${p.last_name[0]}</div>
      <div class="checkin-info">
        <div class="name">${p.first_name} ${p.last_name}</div>
        <div class="meta">${p.email} · Seed #${p.seed_number || '—'}</div>
      </div>
      <div class="checkin-status ${p.checked_in ? 'checked' : 'unchecked'}" onclick="toggleCheckin(${p.id}, this)">
        ${p.checked_in ? '✓' : ''}
      </div>
    </div>
  `).join('');
}

function toggleCheckin(id, el) {
  const p = demoParticipants.find(x => x.id === id);
  if (p) {
    p.checked_in = !p.checked_in;
    loadCheckinStatus();
    showToast(p.checked_in ? 'success' : 'info', 
      p.checked_in ? `${p.first_name} eingecheckt!` : `Check-In rückgängig.`);
  }
}

// ============================================
// REFUNDS
// ============================================

function loadRefunds() {
  renderRefunds(demoRefunds);
}

function renderRefunds(refunds) {
  const tbody = document.getElementById('refunds-table');
  
  if (refunds.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><span class="icon">💸</span><h3>Keine Erstattungen</h3></div></td></tr>';
    return;
  }

  tbody.innerHTML = refunds.map(r => `
    <tr>
      <td style="font-weight:500">#${r.id}</td>
      <td style="font-weight:600">${formatCurrency(r.amount_cents)}</td>
      <td>${reasonLabel(r.reason)}</td>
      <td>${r.requester_email}</td>
      <td><span class="badge badge-${r.status}">${statusLabel(r.status)}</span></td>
      <td>${formatDate(r.created_at)}</td>
      <td>
        ${r.status === 'pending' ? `
          <button class="btn btn-success btn-sm" onclick="approveRefund(${r.id})">✅ Genehmigen</button>
          <button class="btn btn-danger btn-sm" onclick="rejectRefund(${r.id})">❌ Ablehnen</button>
        ` : '—'}
      </td>
    </tr>
  `).join('');
  
  // Update badge
  const pending = demoRefunds.filter(r => r.status === 'pending').length;
  const badge = document.getElementById('refund-badge');
  if (pending > 0) {
    badge.style.display = 'inline';
    badge.textContent = pending;
  } else {
    badge.style.display = 'none';
  }
}

function filterRefunds(status, el) {
  document.querySelectorAll('#page-refunds .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const filtered = status === 'all' ? demoRefunds : demoRefunds.filter(r => r.status === status);
  renderRefunds(filtered);
}

function approveRefund(id) {
  const r = demoRefunds.find(x => x.id === id);
  if (r) {
    r.status = 'approved';
    renderRefunds(demoRefunds);
    showToast('success', 'Erstattung genehmigt!');
  }
}

function rejectRefund(id) {
  const r = demoRefunds.find(x => x.id === id);
  if (r) {
    r.status = 'rejected';
    renderRefunds(demoRefunds);
    showToast('info', 'Erstattung abgelehnt.');
  }
}

// ============================================
// USERS
// ============================================

function loadUsers() {
  renderUsers(demoUsers);
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table');
  
  tbody.innerHTML = users.map(u => `
    <tr>
      <td style="font-weight:600">${u.first_name} ${u.last_name}</td>
      <td style="color:var(--text-secondary)">${u.email}</td>
      <td><span class="badge badge-${u.role}">${u.role}</span></td>
      <td><span class="badge badge-${u.status}">${u.status}</span></td>
      <td><span class="badge badge-${u.membership_tier}">${u.membership_tier}</span></td>
      <td>${formatDate(u.created_at)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-sm" onclick="changeUserRole(${u.id})" title="Rolle ändern">🔑</button>
          ${u.status === 'active' ? `<button class="btn btn-ghost btn-sm" onclick="suspendUser(${u.id})" title="Sperren" style="color:var(--warning)">⚠️</button>` : 
          `<button class="btn btn-ghost btn-sm" onclick="activateUser(${u.id})" title="Aktivieren" style="color:var(--success)">✅</button>`}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterUsers(role, el) {
  document.querySelectorAll('#page-users .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const filtered = role === 'all' ? demoUsers : demoUsers.filter(u => u.role === role);
  renderUsers(filtered);
}

function searchUsers() {
  const q = document.getElementById('user-search').value.toLowerCase();
  const filtered = demoUsers.filter(u => 
    u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  renderUsers(filtered);
}

function changeUserRole(id) {
  const u = demoUsers.find(x => x.id === id);
  if (u) {
    const roles = ['user', 'admin', 'superadmin'];
    const currentIdx = roles.indexOf(u.role);
    const newRole = roles[(currentIdx + 1) % roles.length];
    if (confirm(`Rolle von ${u.first_name} ${u.last_name} auf "${newRole}" ändern?`)) {
      u.role = newRole;
      renderUsers(demoUsers);
      showToast('success', `Rolle geändert: ${newRole}`);
    }
  }
}

function suspendUser(id) {
  const u = demoUsers.find(x => x.id === id);
  if (u && confirm(`${u.first_name} ${u.last_name} wirklich sperren?`)) {
    u.status = 'suspended';
    renderUsers(demoUsers);
    showToast('warning', `Benutzer gesperrt.`);
  }
}

function activateUser(id) {
  const u = demoUsers.find(x => x.id === id);
  if (u) {
    u.status = 'active';
    renderUsers(demoUsers);
    showToast('success', `Benutzer aktiviert.`);
  }
}

// ============================================
// AUDIT LOG
// ============================================

function loadAuditLogs() {
  renderAuditLogs(demoAuditLogs);
}

function renderAuditLogs(logs) {
  const tbody = document.getElementById('audit-table');
  
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td style="white-space:nowrap;color:var(--text-tertiary);font-size:13px">${formatDateTime(l.created_at)}</td>
      <td>
        <div style="font-weight:500;font-size:13px">${l.actor_email || '—'}</div>
        <span class="badge badge-${l.actor_role}" style="font-size:10px;padding:2px 6px">${l.actor_role}</span>
      </td>
      <td><code style="background:var(--surface-secondary);padding:3px 8px;border-radius:4px;font-size:12px">${l.action}</code></td>
      <td>
        <div style="font-size:13px">${l.resource_type} #${l.resource_id || '—'}</div>
        ${l.resource_label ? `<div style="font-size:12px;color:var(--text-tertiary)">${l.resource_label}</div>` : ''}
      </td>
      <td><button class="btn btn-ghost btn-sm" onclick="showAuditDetail(${l.id})">Details →</button></td>
    </tr>
  `).join('');
}

function searchAuditLogs() {
  const q = document.getElementById('audit-search').value.toLowerCase();
  const type = document.getElementById('audit-type-filter').value;
  let filtered = demoAuditLogs;
  if (q) filtered = filtered.filter(l => l.action.toLowerCase().includes(q) || (l.resource_label || '').toLowerCase().includes(q));
  if (type) filtered = filtered.filter(l => l.resource_type === type);
  renderAuditLogs(filtered);
}

function filterAuditLogs() {
  searchAuditLogs();
}

function showAuditDetail(id) {
  const log = demoAuditLogs.find(l => l.id === id);
  if (log) {
    alert(`Audit Log #${id}\n\nAction: ${log.action}\nResource: ${log.resource_type} #${log.resource_id}\nActor: ${log.actor_email}\nTime: ${formatDateTime(log.created_at)}`);
  }
}

// ============================================
// NOTIFICATIONS
// ============================================

function sendNotification() {
  const eventId = document.getElementById('notify-event-select').value;
  const subject = document.getElementById('notify-subject').value;
  const body = document.getElementById('notify-body').value;
  
  if (!eventId || !subject || !body) {
    showToast('error', 'Bitte alle Felder ausfüllen!');
    return;
  }
  
  showToast('success', 'Nachricht gesendet!');
  document.getElementById('notify-subject').value = '';
  document.getElementById('notify-body').value = '';
}

// ============================================
// MODALS
// ============================================

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function showCreateEventModal() {
  document.getElementById('event-modal-title').textContent = 'Neues Turnier erstellen';
  document.getElementById('event-title').value = '';
  document.getElementById('event-sport').value = 'padel';
  document.getElementById('event-description').value = '';
  document.getElementById('event-max').value = 32;
  document.getElementById('event-fee').value = '0';
  document.getElementById('event-level').value = 'open';
  document.getElementById('event-access').value = 'public';
  document.getElementById('event-notes').value = '';
  document.getElementById('event-save-btn').textContent = 'Turnier erstellen';
  document.getElementById('event-save-btn').removeAttribute('data-edit-id');
  openModal('event-modal');
}

function showAddParticipantModal() {
  showToast('info', 'Teilnehmer-hinzufügen Dialog wird implementiert...');
}

function saveEvent() {
  const title = document.getElementById('event-title').value;
  if (!title) {
    showToast('error', 'Titel ist erforderlich!');
    return;
  }
  
  const editId = document.getElementById('event-save-btn').getAttribute('data-edit-id');
  
  if (editId) {
    const event = allEvents.find(e => e.id === parseInt(editId));
    if (event) {
      event.title = title;
      event.sport_category = document.getElementById('event-sport').value;
      event.max_participants = parseInt(document.getElementById('event-max').value);
      event.entry_fee_cents = Math.round(parseFloat(document.getElementById('event-fee').value) * 100);
      event.level = document.getElementById('event-level').value;
      event.access_type = document.getElementById('event-access').value;
      showToast('success', 'Turnier aktualisiert!');
    }
  } else {
    const newEvent = {
      id: allEvents.length + 1,
      title,
      sport_category: document.getElementById('event-sport').value,
      start_date: document.getElementById('event-start').value || '2025-08-01T10:00:00',
      end_date: document.getElementById('event-end').value || '2025-08-01T18:00:00',
      status: 'draft',
      max_participants: parseInt(document.getElementById('event-max').value) || 32,
      participant_count: 0,
      entry_fee_cents: Math.round(parseFloat(document.getElementById('event-fee').value || 0) * 100),
      venue_name: 'Neuer Venue',
      venue_city: 'Stadt',
      level: document.getElementById('event-level').value,
      access_type: document.getElementById('event-access').value,
      is_archived: false,
    };
    allEvents.push(newEvent);
    showToast('success', `"${title}" erstellt!`);
  }
  
  renderEvents(allEvents);
  closeModal('event-modal');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// ============================================
// HELPERS
// ============================================

function populateEventSelects() {
  const selects = ['participant-event-select', 'checkin-event-select', 'bracket-event-select', 'hof-event-select', 'notify-event-select'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (select && select.options.length <= 1) {
      demoEvents.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = `${e.title} (${statusLabel(e.status)})`;
        select.appendChild(opt);
      });
    }
  });
}

function formatCurrency(cents) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
    ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function statusLabel(status) {
  const labels = {
    'draft': 'Entwurf',
    'published': 'Veröffentlicht',
    'registration_open': 'Anmeldung offen',
    'registration_closed': 'Anmeldung geschlossen',
    'in_progress': 'Laufend',
    'completed': 'Beendet',
    'cancelled': 'Abgesagt',
    'confirmed': 'Bestätigt',
    'pending_payment': 'Zahlung ausstehend',
    'pending': 'Ausstehend',
    'waitlisted': 'Warteliste',
    'approved': 'Genehmigt',
    'rejected': 'Abgelehnt',
    'processed': 'Verarbeitet',
    'active': 'Aktiv',
    'suspended': 'Gesperrt',
    'open': 'Offen',
  };
  return labels[status] || status;
}

function reasonLabel(reason) {
  const labels = {
    'user_cancellation_14d': 'Stornierung (>14T)',
    'organizer_cancellation': 'Veranstalter-Absage',
    'admin_decision': 'Admin-Entscheidung',
    'duplicate': 'Duplikat',
    'other': 'Sonstiges',
  };
  return labels[reason] || reason;
}

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function loadBrackets() {
  const eventId = document.getElementById('bracket-event-select').value;
  if (!eventId) return;
  const content = document.getElementById('brackets-content');
  content.style.display = 'block';
  content.innerHTML = `
    <div style="text-align:center;padding:40px">
      <h3 style="margin-bottom:12px">Bracket für Turnier geladen</h3>
      <p style="color:var(--text-tertiary)">Die Bracket-Visualisierung wird mit den Match-Daten aus der API generiert.</p>
      <div style="margin-top:20px;display:flex;gap:12px;justify-content:center">
        <button class="btn btn-primary" onclick="showToast('info', 'Bracket wird generiert...')">🎲 Bracket generieren</button>
        <button class="btn btn-secondary" onclick="showToast('info', 'Seeding wird angezeigt...')">📋 Seeding anzeigen</button>
      </div>
    </div>
  `;
}

function loadHallOfFame() {
  showToast('info', 'Hall of Fame Daten werden geladen...');
}

function generateHallOfFame() {
  const eventId = document.getElementById('hof-event-select').value;
  if (!eventId) {
    showToast('error', 'Bitte ein Turnier auswählen!');
    return;
  }
  showToast('success', 'Hall of Fame automatisch generiert!');
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  
  // Update pending refund badge
  const pending = demoRefunds.filter(r => r.status === 'pending').length;
  if (pending > 0) {
    document.getElementById('refund-badge').style.display = 'inline';
    document.getElementById('refund-badge').textContent = pending;
  }
});
</script>