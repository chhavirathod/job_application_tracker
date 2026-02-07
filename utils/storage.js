// Storage utility for managing application data in chrome.storage.local

/**
 * Get all applications from storage
 * @returns {Promise<Array>} Array of application objects
 */
export async function getApplications() {
  try {
    const result = await chrome.storage.local.get(['applications']);
    return result.applications || [];
  } catch (error) {
    console.error('Error getting applications:', error);
    return [];
  }
}

/**
 * Save a new application
 * @param {Object} application - Application object to save
 * @returns {Promise<Object>} Saved application with ID
 */
export async function saveApplication(application) {
  try {
    const applications = await getApplications();
    
    const newApplication = {
      id: generateId(),
      company: application.company || '',
      role: application.role || '',
      jobUrl: application.jobUrl || '',
      dateApplied: application.dateApplied || new Date().toISOString().split('T')[0],
      status: application.status || 'applied',
      resumeVersion: application.resumeVersion || '',
      notes: application.notes || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    applications.push(newApplication);
    await chrome.storage.local.set({ applications });
    
    return newApplication;
  } catch (error) {
    console.error('Error saving application:', error);
    throw error;
  }
}

/**
 * Update an existing application
 * @param {string} id - Application ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated application
 */
export async function updateApplication(id, updates) {
  try {
    const applications = await getApplications();
    const index = applications.findIndex(app => app.id === id);
    
    if (index === -1) {
      throw new Error('Application not found');
    }
    
    applications[index] = {
      ...applications[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    await chrome.storage.local.set({ applications });
    return applications[index];
  } catch (error) {
    console.error('Error updating application:', error);
    throw error;
  }
}

/**
 * Delete an application
 * @param {string} id - Application ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteApplication(id) {
  try {
    const applications = await getApplications();
    const filtered = applications.filter(app => app.id !== id);
    
    await chrome.storage.local.set({ applications: filtered });
    return true;
  } catch (error) {
    console.error('Error deleting application:', error);
    return false;
  }
}

/**
 * Check if a job URL is already tracked
 * @param {string} url - Job URL to check
 * @returns {Promise<Object|null>} Existing application or null
 */
export async function findByUrl(url) {
  try {
    const applications = await getApplications();
    return applications.find(app => app.jobUrl === url) || null;
  } catch (error) {
    console.error('Error finding application:', error);
    return null;
  }
}

/**
 * Get settings from storage
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    return result.settings || { defaultStatus: 'applied' };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { defaultStatus: 'applied' };
  }
}

/**
 * Update settings
 * @param {Object} settings - Settings to save
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({ settings });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Generate a unique ID
 * @returns {string} UUID-like string
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}