import { JOB_PATTERNS, JOB_KEYWORDS } from './constants.js';

/**
 * Extract company name from the page
 * @param {Document} doc - Document object
 * @param {string} url - Current URL
 * @returns {string} Company name
 */
export function extractCompany(doc, url) {
  // Try meta tags first
  const ogSiteName = doc.querySelector('meta[property="og:site_name"]');
  if (ogSiteName?.content) {
    return cleanText(ogSiteName.content);
  }
  
  // Try common selectors for different job sites
  const selectors = [
    '[class*="company-name"]',
    '[class*="companyName"]',
    '[data-test*="company"]',
    '[class*="employer"]',
    '.company',
    '[class*="organization"]'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      const text = cleanText(element.textContent);
      if (text.length > 0 && text.length < 100) {
        return text;
      }
    }
  }
  
  // Extract from domain name as fallback
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    const domain = parts[parts.length - 2] || parts[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return '';
  }
}

/**
 * Extract job role/title from the page
 * @param {Document} doc - Document object
 * @returns {string} Job role
 */
export function extractRole(doc) {
  // Try meta tags
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle?.content) {
    const title = cleanText(ogTitle.content);
    if (title && !title.toLowerCase().includes('search') && !title.toLowerCase().includes('browse')) {
      return title;
    }
  }
  
  // Try common job title selectors
  const selectors = [
    '[class*="job-title"]',
    '[class*="jobTitle"]',
    '[data-test*="job-title"]',
    '[class*="position"]',
    'h1[class*="title"]',
    'h1'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      const text = cleanText(element.textContent);
      if (text.length > 5 && text.length < 200) {
        return text;
      }
    }
  }
  
  // Try page title as last resort
  const pageTitle = doc.title;
  if (pageTitle) {
    // Remove common suffixes like "- LinkedIn", "| Indeed"
    const cleaned = pageTitle.split(/[-|]/)[0].trim();
    if (cleaned.length > 5) {
      return cleaned;
    }
  }
  
  return '';
}

/**
 * Detect if current page is a job listing
 * @param {Document} doc - Document object
 * @param {string} url - Current URL
 * @returns {boolean} Whether page is likely a job listing
 */
export function isJobPage(doc, url) {
  // Check URL patterns
  const urlMatch = JOB_PATTERNS.some(pattern => pattern.test(url));
  if (urlMatch) {
    return true;
  }
  
  // Check page content for job-related keywords
  const bodyText = doc.body?.textContent?.toLowerCase() || '';
  const keywordMatches = JOB_KEYWORDS.filter(keyword => 
    bodyText.includes(keyword.toLowerCase())
  ).length;
  
  // If multiple job keywords found, likely a job page
  if (keywordMatches >= 3) {
    return true;
  }
  
  // Check for apply button
  const applyButton = doc.querySelector(
    'button[class*="apply"], a[class*="apply"], button:contains("Apply")'
  );
  if (applyButton) {
    return true;
  }
  
  return false;
}

/**
 * Extract all job details from page
 * @param {Document} doc - Document object
 * @param {string} url - Current URL
 * @returns {Object} Extracted job details
 */
export function extractJobDetails(doc, url) {
  return {
    company: extractCompany(doc, url),
    role: extractRole(doc),
    jobUrl: url,
    isJobPage: isJobPage(doc, url)
  };
}

/**
 * Clean extracted text
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s&.-]/g, '')
    .trim();
}