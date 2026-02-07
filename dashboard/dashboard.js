// Dashboard logic for managing job applications

let allApplications = [];
let filteredApplications = [];
let currentEditId = null;

// DOM Elements
const emptyState = document.getElementById('emptyState');
const applicationsTable = document.getElementById('applicationsTable');
const tableBody = document.getElementById('tableBody');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const addNewJob = document.getElementById('addNewJob');

// Stats
const totalApplied = document.getElementById('totalApplied');
const totalInterview = document.getElementById('totalInterview');
const totalRejected = document.getElementById('totalRejected');
const totalGhosted = document.getElementById('totalGhosted');

// Modal
const editModal = document.getElementById('editModal');
const closeModal = document.getElementById('closeModal');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

// Initialize dashboard
async function init() {
  await loadApplications();
  renderApplications();
  updateStats();
  setupEventListeners();
}

// Load applications from storage
async function loadApplications() {
  const result = await chrome.storage.local.get(['applications']);
  allApplications = result.applications || [];
  filteredApplications = [...allApplications];
  
  // Sort by date (newest first)
  filteredApplications.sort((a, b) => b.createdAt - a.createdAt);
}

// Render applications table
function renderApplications() {
  if (filteredApplications.length === 0) {
    emptyState.style.display = 'block';
    applicationsTable.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  applicationsTable.style.display = 'block';

  tableBody.innerHTML = filteredApplications.map(app => `
    <tr data-id="${app.id}">
      <td class="company-cell">${escapeHtml(app.company)}</td>
      <td class="role-cell">${escapeHtml(app.role)}</td>
      <td>
        <span class="status-badge status-${app.status}">${app.status}</span>
      </td>
      <td class="date-cell">${formatDate(app.dateApplied)}</td>
      <td class="resume-cell">${app.resumeVersion ? escapeHtml(app.resumeVersion) : '-'}</td>
      <td class="actions-cell">
        ${app.jobUrl ? `
          <button class="btn-icon btn-open-url" data-url="${escapeHtml(app.jobUrl)}" title="Open Job URL">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
        ` : ''}
        <button class="btn-icon btn-edit" data-id="${app.id}" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-icon danger btn-delete" data-id="${app.id}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
  
  // Add event listeners for action buttons
  addActionButtonListeners();
}

// Update statistics
function updateStats() {
  const stats = {
    applied: 0,
    interview: 0,
    rejected: 0,
    ghosted: 0
  };

  allApplications.forEach(app => {
    if (stats.hasOwnProperty(app.status)) {
      stats[app.status]++;
    }
  });

  totalApplied.textContent = allApplications.length;
  totalInterview.textContent = stats.interview;
  totalRejected.textContent = stats.rejected;
  totalGhosted.textContent = stats.ghosted;
}

// Filter applications
function filterApplications() {
  const status = statusFilter.value;
  const search = searchInput.value.toLowerCase().trim();

  filteredApplications = allApplications.filter(app => {
    const matchesStatus = status === 'all' || app.status === status;
    const matchesSearch = !search || 
      app.company.toLowerCase().includes(search) ||
      app.role.toLowerCase().includes(search);
    
    return matchesStatus && matchesSearch;
  });

  // Sort by date (newest first)
  filteredApplications.sort((a, b) => b.createdAt - a.createdAt);

  renderApplications();
}

// Edit application
function editApplication(id) {
  const app = allApplications.find(a => a.id === id);
  if (!app) return;

  currentEditId = id;

  document.getElementById('editCompany').value = app.company;
  document.getElementById('editRole').value = app.role;
  document.getElementById('editStatus').value = app.status;
  document.getElementById('editResumeVersion').value = app.resumeVersion || '';
  document.getElementById('editNotes').value = app.notes || '';

  editModal.classList.add('active');
}

// Add event listeners to action buttons
function addActionButtonListeners() {
  // Edit buttons
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      editApplication(id);
    });
  });

  // Delete buttons
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteApplication(id);
    });
  });

  // Open URL buttons
  document.querySelectorAll('.btn-open-url').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      openJobUrl(url);
    });
  });
}

// Save edited application
async function saveEditedApplication() {
  if (!currentEditId) return;

  const updatedData = {
    company: document.getElementById('editCompany').value.trim(),
    role: document.getElementById('editRole').value.trim(),
    status: document.getElementById('editStatus').value,
    resumeVersion: document.getElementById('editResumeVersion').value.trim(),
    notes: document.getElementById('editNotes').value.trim()
  };

  if (!updatedData.company || !updatedData.role) {
    alert('Company and role are required');
    return;
  }

  const index = allApplications.findIndex(app => app.id === currentEditId);
  if (index === -1) return;

  allApplications[index] = {
    ...allApplications[index],
    ...updatedData,
    updatedAt: Date.now()
  };

  await chrome.storage.local.set({ applications: allApplications });

  closeEditModal();
  await loadApplications();
  filterApplications();
  updateStats();
}

// Delete application
async function deleteApplication(id) {
  if (!confirm('Are you sure you want to delete this application?')) {
    return;
  }

  allApplications = allApplications.filter(app => app.id !== id);
  await chrome.storage.local.set({ applications: allApplications });

  await loadApplications();
  filterApplications();
  updateStats();
}

// Open job URL
function openJobUrl(url) {
  chrome.tabs.create({ url });
}

// Close edit modal
function closeEditModal() {
  editModal.classList.remove('active');
  currentEditId = null;
}

// Setup event listeners
function setupEventListeners() {
  statusFilter.addEventListener('change', filterApplications);
  searchInput.addEventListener('input', filterApplications);

  addNewJob.addEventListener('click', () => {
    chrome.windows.getCurrent(async (window) => {
      const [tab] = await chrome.tabs.query({ active: true, windowId: window.id });
      chrome.action.openPopup();
    });
  });

  closeModal.addEventListener('click', closeEditModal);
  cancelEdit.addEventListener('click', closeEditModal);
  saveEdit.addEventListener('click', saveEditedApplication);

  // Close modal on outside click
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('active')) {
      closeEditModal();
    }
  });
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
init();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.applications) {
    init();
  }
});