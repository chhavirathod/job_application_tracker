// Content script to detect job pages and extract information
// This runs on all pages but only activates on job-related pages

(function() {
  'use strict';
  
  // Check if chrome.runtime is available (some pages block extensions)
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    return;
  }
  
  // Job portal URL patterns
  const JOB_PATTERNS = [
    /linkedin\.com\/jobs/i,
    /indeed\.com\/viewjob/i,
    /glassdoor\.com\/job/i,
    /naukri\.com\/job-listings/i,
    /instahyre\.com\/candidate\/opportunities/i,
    /angellist\.com\/jobs/i,
    /\/jobs\//i,
    /\/careers\//i,
    /\/job\//i,
    /\/career\//i,
    /\/apply/i
  ];
  
  // Keywords that indicate a job listing page
  const JOB_KEYWORDS = [
    'apply now',
    'submit application',
    'job description',
    'responsibilities',
    'qualifications'
  ];
  
  /**
   * Check if current page is a job listing
   */
  function isJobPage() {
    const url = window.location.href;
    
    // Check URL patterns
    if (JOB_PATTERNS.some(pattern => pattern.test(url))) {
      return true;
    }
    
    // Check page content
    const bodyText = document.body?.textContent?.toLowerCase() || '';
    const keywordMatches = JOB_KEYWORDS.filter(keyword => 
      bodyText.includes(keyword.toLowerCase())
    ).length;
    
    return keywordMatches >= 2;
  }
  
  /**
   * Extract company name
   */
  function extractCompany() {
    // Try meta tags first
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName?.content) {
      return cleanText(ogSiteName.content);
    }
    
    // Try common selectors
    const selectors = [
      '[class*="company-name"]',
      '[class*="companyName"]',
      '[data-test*="company"]',
      '[class*="employer"]',
      '.company'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        const text = cleanText(element.textContent);
        if (text.length > 0 && text.length < 100) {
          return text;
        }
      }
    }
    
    // Fallback to domain
    try {
      const hostname = new URL(window.location.href).hostname;
      const parts = hostname.split('.');
      const domain = parts[parts.length - 2] || parts[0];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return '';
    }
  }
  
  /**
   * Extract job role/title
   */
  function extractRole() {
    // Try meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.content) {
      const title = cleanText(ogTitle.content);
      if (title && !title.toLowerCase().includes('search')) {
        return title;
      }
    }
    
    // Try common selectors
    const selectors = [
      '[class*="job-title"]',
      '[class*="jobTitle"]',
      '[data-test*="job-title"]',
      'h1[class*="title"]',
      'h1'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        const text = cleanText(element.textContent);
        if (text.length > 5 && text.length < 200) {
          return text;
        }
      }
    }
    
    // Try page title
    const pageTitle = document.title;
    if (pageTitle) {
      const cleaned = pageTitle.split(/[-|]/)[0].trim();
      if (cleaned.length > 5) {
        return cleaned;
      }
    }
    
    return '';
  }
  
  /**
   * Clean text
   */
  function cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&.-]/g, '')
      .trim();
  }
  
  /**
   * Extract job details and send to background
   */
  function detectAndExtract() {
    if (!isJobPage()) {
      return;
    }
    
    const jobDetails = {
      company: extractCompany(),
      role: extractRole(),
      jobUrl: window.location.href,
      isJobPage: true
    };
    
    // Store in sessionStorage so popup can access it
    try {
      sessionStorage.setItem('detectedJob', JSON.stringify(jobDetails));
    } catch (e) {
      console.error('Error storing job details:', e);
    }
    
    // Send message to background script (with error handling)
    try {
      chrome.runtime.sendMessage({
        type: 'JOB_DETECTED',
        data: jobDetails
      });
    } catch (e) {
      // Extension context invalidated or not available, ignore
      console.log('Could not send message to background script');
    }
  }
  
  // Run detection when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndExtract);
  } else {
    detectAndExtract();
  }
  
  // Listen for messages from popup (with safety check)
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_JOB_DETAILS') {
        const jobDetails = {
          company: extractCompany(),
          role: extractRole(),
          jobUrl: window.location.href,
          isJobPage: isJobPage()
        };
        sendResponse(jobDetails);
      }
      return true;
    });
  }
  
})();