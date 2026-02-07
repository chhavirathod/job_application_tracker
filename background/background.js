// Background service worker for the extension

// Listen for installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Job Tracker Extension installed');
    
    // Initialize storage with empty applications array
    await chrome.storage.local.set({
      applications: [],
      settings: {
        defaultStatus: 'applied'
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
    // Job page detected - could add badge or notification here
    console.log('Job page detected:', message.data);
  }
  
  if (message.type === 'OPEN_DASHBOARD') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/dashboard.html')
    });
  }
  
  return true;
});

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