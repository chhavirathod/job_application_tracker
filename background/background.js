// Background service worker for the extension

// Store detected jobs temporarily
let detectedJobs = {};

// Listen for installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Job Tracker Extension installed');
    
    // Initialize storage with empty applications array
    await chrome.storage.local.set({
      applications: [],
      settings: {
        defaultStatus: 'applied',
        autoNotify: true
      }
    });
    
    // Open dashboard on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/dashboard.html')
    });
  }
  
  // Add context menu for quick access (combined with install listener)
  chrome.contextMenus.create({
    id: 'track-job',
    title: 'Track this job',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'open-dashboard',
    title: 'Open Job Tracker Dashboard',
    contexts: ['all']
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JOB_DETECTED') {
    console.log('Job page detected:', message.data);
    handleJobDetected(message.data, sender.tab);
  }
  
  if (message.type === 'OPEN_DASHBOARD') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/dashboard.html')
    });
  }
  
  if (message.type === 'GET_DETECTED_JOB') {
    // Send back the detected job data for this tab
    const tabId = sender.tab?.id || message.tabId;
    sendResponse(detectedJobs[tabId] || null);
  }
  
  return true;
});

// Handle job detection
async function handleJobDetected(jobData, tab) {
  if (!tab || !tab.id) return;
  
  // Check if already tracked
  const result = await chrome.storage.local.get(['applications']);
  const applications = result.applications || [];
  const alreadyTracked = applications.some(app => app.jobUrl === jobData.jobUrl);
  
  if (alreadyTracked) {
    console.log('Job already tracked, skipping');
    return;
  }
  
  // Store detected job data
  detectedJobs[tab.id] = jobData;
  
  // Just log the detection, no notification
  console.log('Job detected and stored:', jobData);
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'track-job') {
    // Open popup programmatically (not directly possible, show notification)
    chrome.action.openPopup();
  }
  
  if (info.menuItemId === 'open-dashboard') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/dashboard.html')
    });
  }
});