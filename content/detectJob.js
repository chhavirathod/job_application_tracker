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
    /linkedin\.com\/job/i,
    /indeed\.com\/viewjob/i,
    /glassdoor\.com\/job/i,
    /naukri\.com\/job-listings/i,
    /naukri\.com\/.*-jobs/i,
    /hirist\.tech\/.*-jobs/i,
    /hirist\.tech\/j\//i,
    /wellfound\.com\/.*\/jobs/i,
    /angel\.co\/.*\/jobs/i,
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
    
    // Special handling for LinkedIn - only detect individual job pages, not job search/home
    if (url.includes('linkedin.com')) {
      // Must have currentJobId parameter (means a specific job is selected)
      if (!url.includes('currentJobId=')) {
        return false;
      }
      
      // Check if the job details panel is visible
      const jobDetailsPanel = document.querySelector('.jobs-details__main-content') ||
                             document.querySelector('.job-details-jobs-unified-top-card') ||
                             document.querySelector('.jobs-unified-top-card');
      
      if (!jobDetailsPanel) {
        return false;
      }
      
      // Must have Easy Apply button or job description
      const easyApplyButton = document.querySelector('[aria-label*="Easy Apply"]') ||
                              document.querySelector('.jobs-apply-button');
      const jobDescription = document.querySelector('.jobs-description') ||
                            document.querySelector('[class*="job-details"]');
      
      if (easyApplyButton || jobDescription) {
        return true;
      }
      
      return false;
    }
    
    // Check URL patterns for non-LinkedIn sites
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
    const url = window.location.href;
    
    // Naukri.com specific extraction
    if (url.includes('naukri.com')) {
      const selectors = [
        '.styles_jd-header-comp-name__MvqAI a',
        '.styles_jd-header-comp-name__MvqAI',
        '[class*="jd-header-comp-name"] a',
        '[class*="comp-name"] a'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          if (text && text.toLowerCase() !== 'naukri' && text.length > 1) {
            console.log('Found company via selector:', selector, '→', text);
            return text;
          }
        }
      }
    }
    
    // Glassdoor specific extraction
    if (url.includes('glassdoor.com')) {
      const selectors = [
        '.EmployerProfile_employerNameHeading__bXBYr h4',
        '[class*="EmployerProfile_employerName"] h4',
        '[class*="employerName"] h4',
        '[data-test="employer-name"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          if (text && text.toLowerCase() !== 'glassdoor' && text.length > 1) {
            console.log('Found company via selector:', selector, '→', text);
            return text;
          }
        }
      }
    }
    
    // Hirist.tech specific extraction
    if (url.includes('hirist.tech')) {
      const selectors = [
        '[data-testid="company-name"] a',
        '[data-testid="company-name"]',
        '.mui-style-1w5uyqa', // Company name in the header
        '[class*="company-name"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          if (text && text.toLowerCase() !== 'hirist' && text.length > 1) {
            console.log('Found company via selector:', selector, '→', text);
            return text;
          }
        }
      }
    }
    
    // Wellfound (AngelList) specific extraction
    if (url.includes('wellfound.com') || url.includes('angel.co')) {
      const selectors = [
        'a[href*="/company/"] span.inline.text-md.font-semibold',
        'a[href*="/company/"] .text-md.font-semibold',
        '[data-test="Masthead"] a span.font-semibold',
        '[data-testid="startup-header"] a span'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          if (text && text.toLowerCase() !== 'wellfound' && text.toLowerCase() !== 'angellist' && text.length > 1) {
            console.log('Found company via selector:', selector, '→', text);
            return text;
          }
        }
      }
    }
    
    // LinkedIn specific extraction
    if (url.includes('linkedin.com')) {
      const selectors = [
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name',
        '.jobs-details-top-card__company-name',
        '.topcard__org-name-link',
        '.job-card-container__company-name',
        '.job-card-list__company-name',
        '.base-search-card__subtitle a',
        '.base-search-card__subtitle',
        '.jobs-apply-button--top-card .jobs-unified-top-card__company-name',
        '[class*="company-name"]',
        '[data-test*="company"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          
          if (text && 
              text.toLowerCase() !== 'linkedin' && 
              text.length > 1 && 
              text.length < 100 &&
              !text.toLowerCase().includes('top job') &&
              !text.toLowerCase().includes('recommended')) {
            console.log('Found company via selector:', selector, '→', text);
            return text;
          }
        }
      }
      
      // LinkedIn title parsing
      const titleMatch = document.title.match(/[-–—]\s*([^|]+?)\s*[|]/);
      if (titleMatch && titleMatch[1]) {
        const company = cleanText(titleMatch[1]);
        if (company && company.toLowerCase() !== 'linkedin' && company.length > 1) {
          console.log('Found company from page title:', company);
          return company;
        }
      }
    }
    
    // Try meta tags (for other sites)
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName?.content) {
      const siteName = cleanText(ogSiteName.content);
      const blockedNames = ['linkedin', 'naukri', 'glassdoor', 'hirist', 'wellfound', 'angellist'];
      if (siteName && !blockedNames.includes(siteName.toLowerCase())) {
        return siteName;
      }
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
    
    // Fallback to domain (but not for major job platforms)
    try {
      const hostname = new URL(window.location.href).hostname;
      const parts = hostname.split('.');
      const domain = parts[parts.length - 2] || parts[0];
      const domainLower = domain.toLowerCase();
      
      // Don't use domain name for job platforms themselves
      const platformDomains = ['linkedin', 'indeed', 'glassdoor', 'naukri', 'monster', 
                               'instahyre', 'angellist', 'wellfound', 'hirist'];
      
      if (!platformDomains.includes(domainLower)) {
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
      
      // For job platforms, return empty - user will fill manually
      console.log('Blocked platform domain:', domainLower);
      return '';
    } catch {
      return '';
    }
  }
  
  /**
   * Extract job role/title
   */
  function extractRole() {
    const url = window.location.href;
    
    // Naukri.com specific extraction
    if (url.includes('naukri.com')) {
      const selectors = [
        '.styles_jd-header-title__rZwM1',
        '[class*="jd-header-title"]',
        'h1[title]',
        'header h1'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || element.getAttribute('title') || '';
          text = cleanText(text);
          if (text && text.length > 3) {
            console.log('Found role via selector:', selector, '→', text);
            return text;
          }
        }
      }
    }
    
    // Glassdoor specific extraction  
    if (url.includes('glassdoor.com')) {
      const selectors = [
        '#jd-job-title-1010021198085',
        '[id^="jd-job-title"]',
        '.heading_Level1__w42c9',
        '[class*="jobTitle"] h1',
        'h1[aria-live="polite"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          if (text && text.length > 3) {
            console.log('Found role via selector:', selector, '→', text);
            return text;
          }
        }
      }
    }
    
    // Hirist.tech specific extraction
    if (url.includes('hirist.tech')) {
      const selectors = [
        '.mui-style-1w5uyqa',
        'h1.MuiTypography-root',
        '[class*="job-header"] h1',
        'h1'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          // Filter out company name if it appears in h1
          if (text && text.length > 3 && !text.toLowerCase().includes('haystackanalytics')) {
            console.log('Found role via selector:', selector, '→', text);
            return text;
          }
        }
      }
    }
    
    // Wellfound (AngelList) specific extraction
    if (url.includes('wellfound.com') || url.includes('angel.co')) {
      // For Wellfound, job title is usually in the page title or h1
      const selectors = [
        'h1',
        '[data-test="job-title"]',
        '.text-2xl',
        '.font-bold'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          if (text && text.length > 3 && text.length < 200) {
            console.log('Found role via selector:', selector, '→', text);
            return text;
          }
        }
      }
      
      // Try page title
      if (document.title) {
        const titleParts = document.title.split(/\s+at\s+|\s+-\s+/i);
        if (titleParts[0]) {
          const role = cleanText(titleParts[0]);
          if (role && role.length > 3) {
            console.log('Found role from page title:', role);
            return role;
          }
        }
      }
    }
    
    // LinkedIn specific extraction
    if (url.includes('linkedin.com')) {
      const selectors = [
        '.job-details-jobs-unified-top-card__job-title h1 a',
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title a',
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title h1 a',
        '.jobs-unified-top-card__job-title h1',
        '.jobs-unified-top-card__job-title',
        '.jobs-details-top-card__job-title h1',
        '.topcard__title',
        '.job-card-list__title',
        '.base-search-card__title',
        '[class*="job-title"] h1',
        'h1[class*="title"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || '';
          text = cleanText(text);
          
          const invalidTexts = [
            'top job picks for you',
            'recommended jobs',
            'jobs you might be interested',
            'similar jobs',
            'jobs for you',
            'linkedin'
          ];
          
          const isValid = !invalidTexts.some(invalid => 
            text.toLowerCase().includes(invalid)
          ) && text.length > 3 && text.length < 200;
          
          if (isValid) {
            console.log('Found role via selector:', selector, '→', text);
            return text;
          }
        }
      }
      
      // LinkedIn title parsing
      const titleParts = document.title.split(/[-–—|]/);
      if (titleParts.length > 0) {
        const jobTitle = cleanText(titleParts[0]);
        
        const invalidTexts = ['top job picks', 'linkedin', 'jobs', 'hiring'];
        const isValid = !invalidTexts.some(invalid => 
          jobTitle.toLowerCase().includes(invalid)
        ) && jobTitle.length > 3 && jobTitle.length < 200;
        
        if (isValid) {
          console.log('Found role from page title:', jobTitle);
          return jobTitle;
        }
      }
    }
    
    // Try meta tags (for other sites)
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.content) {
      let title = cleanText(ogTitle.content);
      title = title.split(/\s*[|]\s*/)[0];
      
      const invalidTexts = ['search', 'top job', 'linkedin', 'naukri', 'glassdoor'];
      const isValid = !invalidTexts.some(invalid => 
        title.toLowerCase().includes(invalid)
      );
      
      if (isValid && title.length > 3) {
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
    if (!text) return '';
    
    return text
      // Remove extra whitespace, newlines, tabs
      .replace(/\s+/g, ' ')
      // Remove HTML entity codes if any
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      // Remove special unicode characters but keep common ones
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Keep alphanumeric, spaces, common punctuation
      .replace(/[^\w\s&.,()-]/g, '')
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
  
  // For dynamic pages like LinkedIn, run detection again after a delay
  if (window.location.href.includes('linkedin.com')) {
    setTimeout(detectAndExtract, 2000);
    
    // Also watch for URL changes (LinkedIn is SPA)
    let lastUrl = window.location.href;
    const urlObserver = setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(detectAndExtract, 1500);
      }
    }, 1000);
  }
  
  // Listen for messages from popup (with safety check)
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message);
      
      if (message.type === 'GET_JOB_DETAILS') {
        const jobDetails = {
          company: extractCompany(),
          role: extractRole(),
          jobUrl: window.location.href,
          isJobPage: isJobPage()
        };
        
        console.log('Sending job details:', jobDetails);
        sendResponse(jobDetails);
      }
      
      return true;
    });
  }
  
})();