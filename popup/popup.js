// Popup logic for tracking jobs

let currentJobData = null;

// DOM Elements
const loadingState = document.getElementById('loadingState');
const detectedView = document.getElementById('detectedView');
const trackedView = document.getElementById('trackedView');
const manualView = document.getElementById('manualView');
const successView = document.getElementById('successView');

// Buttons
const trackButton = document.getElementById('trackButton');
const manualTrackButton = document.getElementById('manualTrackButton');
const openDashboard = document.getElementById('openDashboard');
const viewInDashboard = document.getElementById('viewInDashboard');
const viewDashboard = document.getElementById('viewDashboard');
const trackAnother = document.getElementById('trackAnother');
const toggleManual = document.getElementById('toggleManual');

// Initialize popup
async function init() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showManualView();
      return;
    }

    // Check if already tracked
    const existing = await findByUrl(tab.url);
    if (existing) {
      showTrackedView(existing);
      return;
    }

    // Try to get job details from content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DETAILS' });
      
      if (response && response.isJobPage) {
        currentJobData = response;
        showDetectedView(response);
      } else {
        showManualView();
      }
    } catch (error) {
      // Content script not ready or not a valid page
      showManualView();
    }
  } catch (error) {
    console.error('Init error:', error);
    showManualView();
  }
}

// Show detected job view
function showDetectedView(jobData) {
  hideAllViews();
  detectedView.style.display = 'block';
  
  document.getElementById('company').value = jobData.company || '';
  document.getElementById('role').value = jobData.role || '';
  document.getElementById('status').value = 'applied';
}

// Show tracked view
function showTrackedView(application) {
  hideAllViews();
  trackedView.style.display = 'block';
  
  document.getElementById('trackedCompany').textContent = application.company;
  document.getElementById('trackedRole').textContent = application.role;
  
  const statusBadge = document.getElementById('trackedStatus');
  statusBadge.textContent = application.status;
  statusBadge.setAttribute('data-status', application.status);
}

// Show manual entry view
function showManualView() {
  hideAllViews();
  manualView.style.display = 'block';
  loadingState.style.display = 'none';
}

// Show success view
function showSuccessView() {
  hideAllViews();
  successView.style.display = 'block';
}

// Hide all views
function hideAllViews() {
  loadingState.style.display = 'none';
  detectedView.style.display = 'none';
  trackedView.style.display = 'none';
  manualView.style.display = 'none';
  successView.style.display = 'none';
}

// Track job from detected view
trackButton.addEventListener('click', async () => {
  const company = document.getElementById('company').value.trim();
  const role = document.getElementById('role').value.trim();
  const resumeVersion = document.getElementById('resumeVersion').value.trim();
  const status = document.getElementById('status').value;

  if (!company || !role) {
    alert('Please fill in company and role');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const application = {
    company,
    role,
    jobUrl: tab.url,
    resumeVersion,
    status,
    dateApplied: new Date().toISOString().split('T')[0]
  };

  try {
    await saveApplication(application);
    showSuccessView();
  } catch (error) {
    console.error('Error saving application:', error);
    alert('Failed to save application. Please try again.');
  }
});

// Track job from manual view
manualTrackButton.addEventListener('click', async () => {
  const company = document.getElementById('manualCompany').value.trim();
  const role = document.getElementById('manualRole').value.trim();
  const jobUrl = document.getElementById('manualUrl').value.trim();
  const resumeVersion = document.getElementById('manualResumeVersion').value.trim();
  const status = document.getElementById('manualStatus').value;

  if (!company || !role) {
    alert('Please fill in company and role');
    return;
  }

  const application = {
    company,
    role,
    jobUrl: jobUrl || '',
    resumeVersion,
    status,
    dateApplied: new Date().toISOString().split('T')[0]
  };

  try {
    await saveApplication(application);
    showSuccessView();
  } catch (error) {
    console.error('Error saving application:', error);
    alert('Failed to save application. Please try again.');
  }
});

// Open dashboard
openDashboard.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

viewInDashboard.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

viewDashboard.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

// Track another job
trackAnother.addEventListener('click', () => {
  // Clear forms
  document.getElementById('company').value = '';
  document.getElementById('role').value = '';
  document.getElementById('resumeVersion').value = '';
  document.getElementById('manualCompany').value = '';
  document.getElementById('manualRole').value = '';
  document.getElementById('manualUrl').value = '';
  document.getElementById('manualResumeVersion').value = '';
  
  // Re-initialize
  init();
});

// Toggle manual entry
toggleManual.addEventListener('click', () => {
  if (manualView.style.display === 'none') {
    showManualView();
    toggleManual.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Auto-detect
    `;
  } else {
    init();
    toggleManual.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add Manually
    `;
  }
});

// Storage functions
async function saveApplication(application) {
  const applications = await getApplications();
  
  const newApplication = {
    id: generateId(),
    ...application,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  applications.push(newApplication);
  await chrome.storage.local.set({ applications });
  
  return newApplication;
}

async function getApplications() {
  const result = await chrome.storage.local.get(['applications']);
  return result.applications || [];
}

async function findByUrl(url) {
  const applications = await getApplications();
  return applications.find(app => app.jobUrl === url) || null;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize on load
init();