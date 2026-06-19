/* ══════════════════════════════════════════════════════════════
   TaskFlow — Frontend JavaScript
   Handles authentication, task CRUD, search/filter, and UI
   ══════════════════════════════════════════════════════════════ */

const API_BASE = '/api';

// ── State ────────────────────────────────────────────────────
let allTasks = [];
let currentFilter = 'all';
let deleteTargetId = null;

// ══════════════════════════════════════════════════════════════
//  INITIALIZATION
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const isDashboard = path.includes('dashboard');
  const isSettings = path.includes('settings');
  const isAuthPage = !isDashboard && !isSettings;

  if (isDashboard || isSettings) {
    // Protected pages — redirect to login if not authenticated
    if (!getToken()) {
      window.location.href = 'index.html';
      return;
    }
    // Set user initial on profile icons (shared across dashboard & settings)
    const user = getUser();
    if (user) {
      const initial = user.name.charAt(0).toUpperCase();
      const el = document.getElementById('user-initial');
      if (el) el.textContent = initial;
      const mob = document.getElementById('mobile-user-initial');
      if (mob) mob.textContent = initial;
    }

    if (isDashboard) initDashboard();
    if (isSettings) initSettings();
  } else if (isAuthPage) {
    // Already logged in — redirect to dashboard
    if (getToken()) {
      window.location.href = 'dashboard.html';
      return;
    }
  }
});

// ══════════════════════════════════════════════════════════════
//  AUTH — Login / Register / Logout
// ══════════════════════════════════════════════════════════════

// Switch between login and register tabs
function switchTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  }
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  setButtonLoading(btn, true);

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Login failed', 'error');
      return;
    }

    // Store token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showToast('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// Handle register form submission
async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  setButtonLoading(btn, true);

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Registration failed', 'error');
      return;
    }

    // Store token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showToast('Account created! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD INITIALIZATION
// ══════════════════════════════════════════════════════════════

async function initDashboard() {
  // Set user name in welcome section
  const user = getUser();
  if (user) {
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = user.name;
  }

  // Load tasks
  await fetchTasks();
}

// ══════════════════════════════════════════════════════════════
//  TASK CRUD OPERATIONS
// ══════════════════════════════════════════════════════════════

// Fetch all tasks from the API
async function fetchTasks() {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (res.status === 401) {
      handleLogout();
      return;
    }

    const data = await res.json();
    allTasks = data;
    renderTasks();
    updateStats();
  } catch (err) {
    showToast('Failed to load tasks', 'error');
  }
}

// Create or update a task
async function handleTaskSubmit(e) {
  e.preventDefault();
  const taskId = document.getElementById('task-id').value;
  const isEditing = !!taskId;

  const dueDate = document.getElementById('task-due-date').value || null;
  const dueTime = document.getElementById('task-due-time').value || null;

  // Combine date and time into a single DATETIME string
  let combinedDueDate = null;
  if (dueDate) {
    combinedDueDate = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T00:00`;
  }

  const taskData = {
    title: document.getElementById('task-title').value.trim(),
    description: document.getElementById('task-description').value.trim(),
    priority: document.getElementById('task-priority').value,
    dueDate: combinedDueDate
  };

  try {
    const url = isEditing ? `${API_BASE}/tasks/${taskId}` : `${API_BASE}/tasks`;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(taskData)
    });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.message || 'Operation failed', 'error');
      return;
    }

    closeModal('task-modal');
    await fetchTasks();
    showToast(isEditing ? 'Task updated successfully' : 'Task created successfully', 'success');
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
}

// Delete a task (called after confirmation)
async function confirmDelete() {
  if (!deleteTargetId) return;

  try {
    const res = await fetch(`${API_BASE}/tasks/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      showToast('Failed to delete task', 'error');
      return;
    }

    closeModal('delete-modal');
    deleteTargetId = null;
    await fetchTasks();
    showToast('Task deleted successfully', 'success');
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
}

// Mark task as complete / incomplete
async function toggleComplete(taskId) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      showToast('Failed to update task', 'error');
      return;
    }

    const updatedTask = await res.json();
    await fetchTasks();
    showToast(
      updatedTask.status === 'completed' ? 'Task marked as completed!' : 'Task marked as pending',
      'success'
    );
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  RENDERING
// ══════════════════════════════════════════════════════════════

function renderTasks() {
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const searchQuery = document.getElementById('search-input')?.value.toLowerCase() || '';

  // Filter tasks
  let filtered = allTasks;

  // Apply status or priority filter
  if (currentFilter === 'pending') {
    filtered = filtered.filter(t => t.status === 'pending');
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter(t => t.status === 'completed');
  } else if (['high', 'medium', 'low'].includes(currentFilter)) {
    filtered = filtered.filter(t => t.priority === currentFilter);
  }

  // Apply search
  if (searchQuery) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(searchQuery) ||
      t.description.toLowerCase().includes(searchQuery)
    );
  }

  // Show empty state or task list
  if (allTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  if (filtered.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--text-muted); font-size: 15px;">No tasks match your current filter or search.</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = filtered.map((task, index) => createTaskCard(task, index)).join('');
}

function createTaskCard(task, index) {
  const isCompleted = task.status === 'completed';
  const dueDateStr = task.due_date ? formatDate(task.due_date) : '';
  const isOverdue = task.due_date && !isCompleted && new Date(task.due_date) < new Date();

  return `
    <div class="task-card priority-${task.priority} ${isCompleted ? 'completed' : ''}"
         style="animation-delay: ${index * 0.05}s">
      <div class="task-card-top">
        <div class="task-card-info">
          <div class="task-card-title">${escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-card-desc">${escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="task-card-actions">
          <button class="btn-icon btn-complete ${isCompleted ? 'completed' : ''}"
                  onclick="toggleComplete('${task.id}')"
                  title="${isCompleted ? 'Mark as pending' : 'Mark as complete'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
          <button class="btn-icon" onclick="openEditModal('${task.id}')" title="Edit task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon btn-delete" onclick="openDeleteModal('${task.id}')" title="Delete task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="task-card-bottom">
        <span class="badge badge-priority-${task.priority}">${capitalize(task.priority)}</span>
        <span class="badge badge-status-${task.status}">${capitalize(task.status)}</span>
        ${dueDateStr ? `<span class="badge badge-due ${isOverdue ? 'overdue' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          ${dueDateStr}
        </span>` : ''}
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
//  STATISTICS & PROGRESS
// ══════════════════════════════════════════════════════════════

function updateStats() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.status === 'completed').length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Animate numbers
  animateNumber('stat-total', total);
  animateNumber('stat-completed', completed);
  animateNumber('stat-pending', pending);

  document.getElementById('stat-percentage').textContent = percentage + '%';
  document.getElementById('progress-text').textContent = percentage + '%';

  // Animate progress bar
  const progressFill = document.getElementById('progress-bar-fill');
  setTimeout(() => {
    progressFill.style.width = percentage + '%';
  }, 100);
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  const current = parseInt(el.textContent) || 0;
  const duration = 500;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(current + (target - current) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ══════════════════════════════════════════════════════════════
//  SEARCH & FILTER
// ══════════════════════════════════════════════════════════════

function handleSearch() {
  renderTasks();
}

function setFilter(filter, btnElement) {
  currentFilter = filter;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  // Also sync sidebar nav highlights
  document.querySelectorAll('.nav-item[data-filter]').forEach(nav => {
    nav.classList.toggle('active', nav.dataset.filter === filter || (filter !== 'pending' && filter !== 'completed' && nav.dataset.filter === 'all'));
  });

  renderTasks();
}

function setNavFilter(filter, navElement) {
  currentFilter = filter;

  // Update sidebar nav active state
  document.querySelectorAll('.nav-item[data-filter]').forEach(nav => nav.classList.remove('active'));
  navElement.classList.add('active');

  // Sync filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  renderTasks();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    toggleSidebar();
  }
}

// ══════════════════════════════════════════════════════════════
//  MODALS
// ══════════════════════════════════════════════════════════════

function openCreateModal() {
  document.getElementById('modal-title').textContent = 'Create New Task';
  document.getElementById('task-submit-btn').textContent = 'Create Task';
  document.getElementById('task-form').reset();
  document.getElementById('task-id').value = '';
  document.getElementById('task-due-time').value = '';
  openModal('task-modal');
}

function openEditModal(taskId) {
  const task = allTasks.find(t => String(t.id) === String(taskId));
  if (!task) return;

  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('task-submit-btn').textContent = 'Save Changes';
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-priority').value = task.priority;

  // Split DATETIME into separate date and time values
  if (task.due_date) {
    const d = new Date(task.due_date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    document.getElementById('task-due-date').value = `${year}-${month}-${day}`;
    // Only set time if it's not midnight
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    document.getElementById('task-due-time').value = hasTime ? `${hours}:${mins}` : '';
  } else {
    document.getElementById('task-due-date').value = '';
    document.getElementById('task-due-time').value = '';
  }

  openModal('task-modal');
}

function openDeleteModal(taskId) {
  deleteTargetId = taskId;
  openModal('delete-modal');
}

function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal when clicking overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      if (!modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  }
});

// ══════════════════════════════════════════════════════════════
//  SIDEBAR (Mobile)
// ══════════════════════════════════════════════════════════════

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');

  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  hamburger.classList.toggle('active');
}

// ══════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');

  const icons = {
    success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ══════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function setButtonLoading(btn, loading) {
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  if (loading) {
    text.classList.add('hidden');
    loader.classList.remove('hidden');
    btn.disabled = true;
  } else {
    text.classList.remove('hidden');
    loader.classList.add('hidden');
    btn.disabled = false;
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const dateOpts = { month: 'short', day: 'numeric', year: 'numeric' };
  const timeOpts = { hour: 'numeric', minute: '2-digit', hour12: true };
  const datePart = date.toLocaleDateString('en-US', dateOpts);
  const timePart = date.toLocaleTimeString('en-US', timeOpts);
  // Only show time if it's not midnight (i.e., a time was actually set)
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime ? `${datePart} at ${timePart}` : datePart;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ══════════════════════════════════════════════════════════════
//  SETTINGS PAGE
// ══════════════════════════════════════════════════════════════

// Initialize settings page — load current profile into form
async function initSettings() {
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (res.status === 401) {
      handleLogout();
      return;
    }

    const user = await res.json();
    document.getElementById('settings-name').value = user.name || '';
    document.getElementById('settings-email').value = user.email || '';
  } catch (err) {
    showToast('Failed to load profile', 'error');
  }
}

// Update profile (name, email)
async function handleUpdateProfile(e) {
  e.preventDefault();

  const name = document.getElementById('settings-name').value.trim();
  const email = document.getElementById('settings-email').value.trim();

  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Failed to update profile', 'error');
      return;
    }

    // Update stored user info
    localStorage.setItem('user', JSON.stringify(data.user));
    showToast('Profile updated successfully', 'success');
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
}

// Change password
async function handleChangePassword(e) {
  e.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Failed to change password', 'error');
      return;
    }

    document.getElementById('password-form').reset();
    showToast('Password changed successfully', 'success');
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
}

// Open delete account modal
function openDeleteAccountModal() {
  openModal('delete-account-modal');
}

// Delete account permanently
async function handleDeleteAccount(e) {
  e.preventDefault();

  const password = document.getElementById('delete-password').value;

  try {
    const res = await fetch(`${API_BASE}/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Failed to delete account', 'error');
      return;
    }

    showToast('Account deleted. Goodbye!', 'success');
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    }, 1000);
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
}
