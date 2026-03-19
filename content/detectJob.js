// Content script to detect job pages and extract information
// This runs on all pages but only activates on job-related pages

(function () {
  "use strict";

  // Check if chrome.runtime is available (some pages block extensions)
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
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
    /wellfound\.com\/jobs/i, // Updated: matches /jobs?ref=... format
    /wellfound\.com\/.*\/jobs/i, // Keep for /company/xxx/jobs format
    /angel\.co\/jobs/i,
    /angel\.co\/.*\/jobs/i,
    /instahyre\.com\/candidate\/opportunities/i,
    /angellist\.com\/jobs/i,
    /\/jobs\//i,
    /\/careers\//i,
    /\/job\//i,
    /\/career\//i,
    /\/apply/i,
  ];

  // Keywords that indicate a job listing page
  const JOB_KEYWORDS = [
    "apply now",
    "submit application",
    "job description",
    "responsibilities",
    "qualifications",
  ];

  /**
   * Check if current page is a job listing
   */
  function isJobPage() {
    const url = window.location.href;

    // Smart Apply pages (Indeed/Glassdoor unified application)
    if (
      url.includes("smartapply.indeed.com") ||
      url.includes("smartapply.glassdoor.com") ||
      url.includes("/indeedapply/")
    ) {
      // Check if job header is present
      const jobHeader =
        document.querySelector(".ia-JobHeader") ||
        document.querySelector("#ia-JobHeader-title") ||
        document.querySelector('[class*="JobHeader"]');

      if (jobHeader) {
        console.log("Smart Apply page detected with job header");
        return true;
      }
    }

    // Special handling for LinkedIn - only detect individual job pages, not job search/home
    if (url.includes("linkedin.com")) {
      // Must have currentJobId parameter (means a specific job is selected)
      if (!url.includes("currentJobId=")) {
        return false;
      }

      // Check if the job details panel is visible
      const jobDetailsPanel =
        document.querySelector(".jobs-details__main-content") ||
        document.querySelector(".job-details-jobs-unified-top-card") ||
        document.querySelector(".jobs-unified-top-card");

      if (!jobDetailsPanel) {
        return false;
      }

      // Must have Easy Apply button or job description
      const easyApplyButton =
        document.querySelector('[aria-label*="Easy Apply"]') ||
        document.querySelector(".jobs-apply-button");
      const jobDescription =
        document.querySelector(".jobs-description") ||
        document.querySelector('[class*="job-details"]');

      if (easyApplyButton || jobDescription) {
        return true;
      }

      return false;
    }

    // Check URL patterns for non-LinkedIn sites
    if (JOB_PATTERNS.some((pattern) => pattern.test(url))) {
      return true;
    }

    // Check page content
    const bodyText = document.body?.textContent?.toLowerCase() || "";
    const keywordMatches = JOB_KEYWORDS.filter((keyword) =>
      bodyText.includes(keyword.toLowerCase()),
    ).length;

    return keywordMatches >= 2;
  }

  /**
   * Extract company name
   */
  function extractCompany() {
    const url = window.location.href;

    // Naukri.com specific extraction
    if (url.includes("naukri.com")) {
      const selectors = [
        ".styles_jd-header-comp-name__MvqAI a",
        ".styles_jd-header-comp-name__MvqAI",
        '[class*="jd-header-comp-name"] a',
        '[class*="comp-name"] a',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);
          if (text && text.toLowerCase() !== "naukri" && text.length > 1) {
            console.log("Found company via selector:", selector, "→", text);
            return text;
          }
        }
      }
    }

    // Glassdoor specific extraction
    if (url.includes("glassdoor.com")) {
      // PRIORITY 1: Target the ACTIVE/DISPLAYED job header using data-test attribute
      // This is like Indeed's #vjs-container - it uniquely identifies the displayed job
      // data-test="job-details-header" only exists on the currently displayed job's header
      const jobDetailsHeader = document.querySelector('[data-test="job-details-header"]');
      if (jobDetailsHeader) {
        // Within the header, find the employer and title container
        const employerAndTitleContainer = jobDetailsHeader.querySelector('[class*="JobDetails_employerAndJobTitle"]');
        if (employerAndTitleContainer) {
          const companyH4 = employerAndTitleContainer.querySelector('h4');
          if (companyH4) {
            let text = cleanText(companyH4.textContent || companyH4.innerText || "");
            if (text && text.toLowerCase() !== "glassdoor" && text.length > 1 && text.length < 150) {
              console.log("Glassdoor: Found company from ACTIVE job header:", text);
              return text;
            }
          }
        }
      }

      // PRIORITY 2: Fallback - search for company in employer name heading within job details
      const employerHeading = document.querySelector('[data-test="job-details-header"] [class*="EmployerProfile_employerNameHeading"] h4');
      if (employerHeading) {
        let text = cleanText(employerHeading.textContent || employerHeading.innerText || "");
        if (text && text.toLowerCase() !== "glassdoor" && text.length > 1 && text.length < 150) {
          console.log("Glassdoor: Found company from employer heading inside job details header (FALLBACK):", text);
          return text;
        }
      }

      // PRIORITY 3: Generic fallback - first h4 that's meaningful
      const allH4s = document.querySelectorAll('h4');
      for (const h4 of allH4s) {
        let text = cleanText(h4.textContent || h4.innerText || "");
        if (text && text.toLowerCase() !== "glassdoor" && text.length > 1 && text.length < 150) {
          console.log("Glassdoor: Found company from generic h4 (LAST RESORT):", text);
          return text;
        }
      }
    }
    // Hirist.tech specific extraction
    if (url.includes("hirist.tech")) {
      const selectors = [
        '[data-testid="company-name"] a',
        '[data-testid="company-name"]',
        ".mui-style-1w5uyqa", // Company name in the header
        '[class*="company-name"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);
          if (text && text.toLowerCase() !== "hirist" && text.length > 1) {
            console.log("Found company via selector:", selector, "→", text);
            return text;
          }
        }
      }
    }

    // Wellfound (AngelList) specific extraction
    if (url.includes("wellfound.com") || url.includes("angel.co")) {
      const selectors = [
        'a[href*="/company/"] span.text-sm.font-semibold.text-black', // ✨ NEW: From job page
        'a[href*="/company/"] span.inline.text-md.font-semibold',
        'a[href*="/company/"] .text-md.font-semibold',
        'a[href*="/company/"] span.font-semibold', // More generic
        '[data-test="Masthead"] a span.font-semibold',
        '[data-testid="startup-header"] a span',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);
          if (
            text &&
            text.toLowerCase() !== "wellfound" &&
            text.toLowerCase() !== "angellist" &&
            text.length > 1
          ) {
            console.log(
              "Wellfound: Found company via selector:",
              selector,
              "→",
              text,
            );
            return text;
          }
        }
      }
    }

    // LinkedIn specific extraction
    if (url.includes("linkedin.com")) {
      const selectors = [
        ".job-details-jobs-unified-top-card__company-name a",
        ".job-details-jobs-unified-top-card__company-name",
        ".jobs-unified-top-card__company-name a",
        ".jobs-unified-top-card__company-name",
        ".jobs-details-top-card__company-name",
        ".topcard__org-name-link",
        ".job-card-container__company-name",
        ".job-card-list__company-name",
        ".base-search-card__subtitle a",
        ".base-search-card__subtitle",
        ".jobs-apply-button--top-card .jobs-unified-top-card__company-name",
        '[class*="company-name"]',
        '[data-test*="company"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);

          if (
            text &&
            text.toLowerCase() !== "linkedin" &&
            text.length > 1 &&
            text.length < 100 &&
            !text.toLowerCase().includes("top job") &&
            !text.toLowerCase().includes("recommended")
          ) {
            console.log("Found company via selector:", selector, "→", text);
            return text;
          }
        }
      }

      // LinkedIn title parsing
      const titleMatch = document.title.match(/[-–—]\s*([^|]+?)\s*[|]/);
      if (titleMatch && titleMatch[1]) {
        const company = cleanText(titleMatch[1]);
        if (
          company &&
          company.toLowerCase() !== "linkedin" &&
          company.length > 1
        ) {
          console.log("Found company from page title:", company);
          return company;
        }
      }
    }

    // Indeed specific extraction
    if (url.includes("indeed.co")) {
      // PRIORITY 1: Extract from the ACTIVE job details panel (right side)
      // Look for the job that's currently OPEN in the details view
      const activeJobSelectors = [
        '#vjs-container [data-testid="inlineHeader-companyName"]', // Active job panel
        '.jobsearch-ViewJobLayout [data-testid="inlineHeader-companyName"]',
        '.jobsearch-ViewJobLayout [data-company-name="true"]',
        '#vjs-container [data-company-name="true"]',
      ];

      for (const selector of activeJobSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);
          if (text && text.toLowerCase() !== "indeed" && text.length > 1) {
            console.log(
              "Indeed: Found ACTIVE job company via selector:",
              selector,
              "→",
              text,
            );
            return text;
          }
        }
      }

      // PRIORITY 2: Fallback to job card selectors (only if active panel not found)
      const selectors = [
        '[data-testid="company-name"]',
        '[data-testid="inlineHeader-companyName"]',
        ".css-19eicqx.eu4oa1w0",
        '[class*="companyName"]',
        "[data-company-name]",
        ".jobsearch-CompanyInfoContainer a",
        ".icl-u-lg-mr--sm.icl-u-xs-mr--xs",
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);
          if (
            text &&
            text.toLowerCase() !== "indeed" &&
            text.length > 1 &&
            text.length < 100
          ) {
            console.log(
              "Indeed: Found company via selector:",
              selector,
              "→",
              text,
            );
            return text;
          }
        }
      }

      // Second try: Combined "Company - Location" format (from job details page)
      const combinedSelectors = [
        ".css-1o18umh.e1wnkr790", // "Company - Location" span
        ".ia-JobHeader-information span",
        '[class*="JobHeader"] span[class*="wnkr"]',
      ];

      for (const selector of combinedSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);

          // Format: "Mypcot Infotech Private Limited - Sakinaka, Mumbai, Maharashtra"
          // Extract company name (part before the dash)
          const parts = text.split("-").map((p) => p.trim());
          if (parts.length >= 2 && parts[0].length > 1) {
            const company = parts[0];
            if (company.toLowerCase() !== "indeed") {
              console.log(
                "Indeed: Found company from combined format:",
                selector,
                "→",
                company,
              );
              return company;
            }
          }
        }
      }
    }

    // Try meta tags (for other sites)
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName?.content) {
      const siteName = cleanText(ogSiteName.content);
      const blockedNames = [
        "linkedin",
        "naukri",
        "glassdoor",
        "hirist",
        "wellfound",
        "angellist",
      ];
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
      ".company",
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
      const parts = hostname.split(".");
      const domain = parts[parts.length - 2] || parts[0];
      const domainLower = domain.toLowerCase();

      // Don't use domain name for job platforms themselves
      const platformDomains = [
        "linkedin",
        "indeed",
        "glassdoor",
        "naukri",
        "monster",
        "instahyre",
        "angellist",
        "wellfound",
        "hirist",
      ];

      if (!platformDomains.includes(domainLower)) {
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }

      // For job platforms, return empty - user will fill manually
      console.log("Blocked platform domain:", domainLower);
      return "";
    } catch {
      return "";
    }
  }

  /**
   * Extract job role/title
   */
  function extractRole() {
    const url = window.location.href;

    // Naukri.com specific extraction
    if (url.includes("naukri.com")) {
      const selectors = [
        ".styles_jd-header-title__rZwM1",
        '[class*="jd-header-title"]',
        "h1[title]",
        "header h1",
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text =
            element.textContent ||
            element.innerText ||
            element.getAttribute("title") ||
            "";
          text = cleanText(text);
          if (text && text.length > 3) {
            console.log("Found role via selector:", selector, "→", text);
            return text;
          }
        }
      }
    }

    // Glassdoor specific extraction
    if (url.includes("glassdoor.com")) {
      // PRIORITY 1: Target the ACTIVE/DISPLAYED job header using data-test attribute
      // This is like Indeed's #vjs-container - it uniquely identifies the displayed job
      // data-test="job-details-header" only exists on the currently displayed job's header
      const jobDetailsHeader = document.querySelector('[data-test="job-details-header"]');
      if (jobDetailsHeader) {
        // Within the header, find the employer and title container
        const employerAndTitleContainer = jobDetailsHeader.querySelector('[class*="JobDetails_employerAndJobTitle"]');
        if (employerAndTitleContainer) {
          const titleH1 = employerAndTitleContainer.querySelector('h1');
          if (titleH1) {
            let text = cleanText(titleH1.textContent || titleH1.innerText || "");
            if (text && text.length > 3 && text.length < 200 && !text.toLowerCase().includes("job description")) {
              console.log("Glassdoor: Found job title from ACTIVE job header:", text);
              return text;
            }
          }
        }
      }

      // PRIORITY 2: Fallback - search for h1 in job details header
      const jobDetailsHeaderH1 = document.querySelector('[data-test="job-details-header"] [class*="JobDetails_jobDetailsHeader"] h1');
      if (jobDetailsHeaderH1) {
        let text = cleanText(jobDetailsHeaderH1.textContent || jobDetailsHeaderH1.innerText || "");
        if (text && text.length > 3 && text.length < 200 && !text.toLowerCase().includes("job description")) {
          console.log("Glassdoor: Found job title from job details header (FALLBACK):", text);
          return text;
        }
      }

      // PRIORITY 3: Generic fallback - first h1 that's a valid job title
      const allH1s = document.querySelectorAll('h1');
      for (const h1 of allH1s) {
        let text = cleanText(h1.textContent || h1.innerText || "");
        if (text && text.length > 3 && text.length < 200 && !text.toLowerCase().includes("job description") && !text.toLowerCase().includes("job details")) {
          console.log("Glassdoor: Found job title from generic h1 (LAST RESORT):", text);
          return text;
        }
      }
    }

    // Indeed specific extraction
    if (url.includes("indeed.co")) {
      // PRIORITY 1: Extract from the ACTIVE job details panel (right side)
      const activeJobSelectors = [
        "#vjs-container .jobsearch-JobInfoHeader-title span:first-child", // Active job title
        ".jobsearch-ViewJobLayout .jobsearch-JobInfoHeader-title span:first-child",
        '#vjs-container [data-testid="jobsearch-JobInfoHeader-title"] span:first-child',
        ".jobsearch-JobInfoHeader-title:not(.css-8u2krs)", // Exclude " - job post" suffix
      ];

      for (const selector of activeJobSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);
          // Remove " - job post" suffix if present
          text = text.replace(/\s*-\s*job post\s*$/i, "");

          if (text && text.length > 3 && text.length < 150) {
            console.log(
              "Indeed: Found ACTIVE job role via selector:",
              selector,
              "→",
              text,
            );
            return text;
          }
        }
      }

      // PRIORITY 2: Fallback to job card selectors
      const selectors = [
        "#ia-JobHeader-title",
        ".ia-JobHeader-title",
        'h1[id="ia-JobHeader-title"]',
        ".jobTitle span[title]",
        ".jobTitle span",
        '[id*="jobTitle"]',
        "h1.jobTitle",
        "h2.jobTitle",
        ".jcs-JobTitle span",
        '[data-testid="jobTitle"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text =
            element.textContent ||
            element.innerText ||
            element.getAttribute("title") ||
            "";
          text = cleanText(text);
          if (text && text.length > 3 && text.length < 150) {
            console.log(
              "Indeed: Found role via selector:",
              selector,
              "→",
              text,
            );
            return text;
          }
        }
      }
    }

    // Hirist.tech specific extraction
    if (url.includes("hirist.tech")) {
      const selectors = [
        ".mui-style-1w5uyqa",
        "h1.MuiTypography-root",
        '[class*="job-header"] h1',
        "h1",
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);
          // Filter out company name if it appears in h1
          if (
            text &&
            text.length > 3 &&
            !text.toLowerCase().includes("haystackanalytics")
          ) {
            console.log("Found role via selector:", selector, "→", text);
            return text;
          }
        }
      }
    }

    // Wellfound (AngelList) specific extraction
    if (url.includes("wellfound.com") || url.includes("angel.co")) {
      const selectors = [
        "h1.inline.text-xl.font-semibold.text-black", // ✨ NEW: Exact from HTML
        "h1.text-xl.font-semibold", // More generic version
        "h1.font-semibold", // Even more generic
        "h1", // Fallback
        '[data-test="job-title"]',
        ".text-2xl",
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);

          // Filter out non-job-title h1s
          const invalidTexts = [
            "apply to",
            "about the company",
            "recent jobs",
            "funding",
            "perks",
          ];
          const isValid = !invalidTexts.some((invalid) =>
            text.toLowerCase().includes(invalid),
          );

          if (text && text.length > 3 && text.length < 200 && isValid) {
            console.log(
              "Wellfound: Found role via selector:",
              selector,
              "→",
              text,
            );
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
            console.log("Found role from page title:", role);
            return role;
          }
        }
      }
    }

    // LinkedIn specific extraction
    if (url.includes("linkedin.com")) {
      const selectors = [
        ".job-details-jobs-unified-top-card__job-title h1 a",
        ".job-details-jobs-unified-top-card__job-title h1",
        ".job-details-jobs-unified-top-card__job-title a",
        ".job-details-jobs-unified-top-card__job-title",
        ".jobs-unified-top-card__job-title h1 a",
        ".jobs-unified-top-card__job-title h1",
        ".jobs-unified-top-card__job-title",
        ".jobs-details-top-card__job-title h1",
        ".topcard__title",
        ".job-card-list__title",
        ".base-search-card__title",
        '[class*="job-title"] h1',
        'h1[class*="title"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          let text = element.textContent || element.innerText || "";
          text = cleanText(text);

          const invalidTexts = [
            "top job picks for you",
            "recommended jobs",
            "jobs you might be interested",
            "similar jobs",
            "jobs for you",
            "linkedin",
          ];

          const isValid =
            !invalidTexts.some((invalid) =>
              text.toLowerCase().includes(invalid),
            ) &&
            text.length > 3 &&
            text.length < 200;

          if (isValid) {
            console.log("Found role via selector:", selector, "→", text);
            return text;
          }
        }
      }

      // LinkedIn title parsing
      const titleParts = document.title.split(/[-–—|]/);
      if (titleParts.length > 0) {
        const jobTitle = cleanText(titleParts[0]);

        const invalidTexts = ["top job picks", "linkedin", "jobs", "hiring"];
        const isValid =
          !invalidTexts.some((invalid) =>
            jobTitle.toLowerCase().includes(invalid),
          ) &&
          jobTitle.length > 3 &&
          jobTitle.length < 200;

        if (isValid) {
          console.log("Found role from page title:", jobTitle);
          return jobTitle;
        }
      }
    }

    // Try meta tags (for other sites)
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.content) {
      let title = cleanText(ogTitle.content);
      title = title.split(/\s*[|]\s*/)[0];

      const invalidTexts = [
        "search",
        "top job",
        "linkedin",
        "naukri",
        "glassdoor",
      ];
      const isValid = !invalidTexts.some((invalid) =>
        title.toLowerCase().includes(invalid),
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
      "h1",
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

    return "";
  }

  /**
   * Clean text
   */
  function cleanText(text) {
    if (!text) return "";

    return (
      text
        // Remove extra whitespace, newlines, tabs
        .replace(/\s+/g, " ")
        // Remove HTML entity codes if any
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        // Remove special unicode characters but keep common ones
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // Keep alphanumeric, spaces, common punctuation
        .replace(/[^\w\s&.,()-]/g, "")
        .trim()
    );
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
      isJobPage: true,
    };

    // Store in sessionStorage so popup can access it
    try {
      sessionStorage.setItem("detectedJob", JSON.stringify(jobDetails));
    } catch (e) {
      console.error("Error storing job details:", e);
    }

    // Send message to background script (with error handling)
    try {
      chrome.runtime.sendMessage({
        type: "JOB_DETECTED",
        data: jobDetails,
      });
    } catch (e) {
      // Extension context invalidated or not available, ignore
      console.log("Could not send message to background script");
    }
  }

  // Run detection when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", detectAndExtract);
  } else {
    detectAndExtract();
  }

  // For dynamic pages (SPA - Single Page Applications)
  const url = window.location.href;

  // LinkedIn: Watch for URL changes
  if (url.includes("linkedin.com")) {
    setTimeout(detectAndExtract, 2000);

    let lastUrl = window.location.href;
    const urlObserver = setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(detectAndExtract, 1500);
      }
    }, 1000);
  }

  // Glassdoor: Watch for job card clicks and job panel changes
  if (url.includes("glassdoor.co")) {
    setTimeout(detectAndExtract, 2000);

    // Track last job title to detect changes
    let lastJobTitle = "";

    // Method 1: Watch for clicks on job cards
    document.addEventListener(
      "click",
      (event) => {
        const jobCard =
          event.target.closest('[data-test="jobListing"]') ||
          event.target.closest(".JobCard_jobCardContainer__arQlW") ||
          event.target.closest('[class*="JobCard"]');

        if (jobCard) {
          console.log(
            "Glassdoor: Job card clicked, will re-extract in 1 second",
          );
          setTimeout(detectAndExtract, 1000);
        }
      },
      true,
    );

    // Method 2: Watch for DOM changes in the job details area
    const observeJobDetails = () => {
      const jobDetailsContainer =
        document.querySelector("#JDCol") ||
        document.querySelector('[class*="JobDetails"]') ||
        document.querySelector(".TwoColumnLayout_columnRight");

      if (jobDetailsContainer) {
        const observer = new MutationObserver((mutations) => {
          // Check if the job title changed
          const currentTitle = extractRole();
          if (
            currentTitle &&
            currentTitle !== lastJobTitle &&
            lastJobTitle !== ""
          ) {
            console.log(
              "Glassdoor: Job changed from",
              lastJobTitle,
              "to",
              currentTitle,
            );
            lastJobTitle = currentTitle;
            setTimeout(detectAndExtract, 500);
          } else if (currentTitle && lastJobTitle === "") {
            lastJobTitle = currentTitle;
          }
        });

        observer.observe(jobDetailsContainer, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        console.log(
          "Glassdoor: Started observing job details panel for changes",
        );
      }
    };

    // Start observing after page loads
    setTimeout(observeJobDetails, 2000);
  }

  // Indeed: Watch for job card clicks and job panel changes
  if (url.includes("indeed.co")) {
    setTimeout(detectAndExtract, 2000);

    // Track last job title to detect changes
    let lastJobTitle = "";

    // Method 1: Watch for clicks on job cards
    document.addEventListener(
      "click",
      (event) => {
        const jobCard =
          event.target.closest(".job_seen_beacon") ||
          event.target.closest('[data-testid="slider_item"]') ||
          event.target.closest(".cardOutline") ||
          event.target.closest(".jcs-JobTitle");

        if (jobCard) {
          console.log("Indeed: Job card clicked, will re-extract in 1 second");
          setTimeout(detectAndExtract, 1000);
        }
      },
      true,
    );

    // Method 2: Watch for DOM changes in the job details area
    const observeJobDetails = () => {
      const jobDetailsContainer =
        document.querySelector(".jobsearch-RightPane") ||
        document.querySelector('[id*="jobDetails"]') ||
        document.querySelector(".jobsearch-ViewJobLayout-content");

      if (jobDetailsContainer) {
        const observer = new MutationObserver((mutations) => {
          // Check if the job title changed
          const currentTitle = extractRole();
          if (
            currentTitle &&
            currentTitle !== lastJobTitle &&
            lastJobTitle !== ""
          ) {
            console.log(
              "Indeed: Job changed from",
              lastJobTitle,
              "to",
              currentTitle,
            );
            lastJobTitle = currentTitle;
            setTimeout(detectAndExtract, 500);
          } else if (currentTitle && lastJobTitle === "") {
            lastJobTitle = currentTitle;
          }
        });

        observer.observe(jobDetailsContainer, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        console.log("Indeed: Started observing job details panel for changes");
      }
    };

    // Start observing after page loads
    setTimeout(observeJobDetails, 2000);
  }

  // Naukri, Hirist, Wellfound: Watch for URL changes (they seem to update URLs)
  if (
    url.includes("naukri.com") ||
    url.includes("hirist.tech") ||
    url.includes("wellfound.com")
  ) {
    setTimeout(detectAndExtract, 2000);

    let lastUrl = window.location.href;
    const urlObserver = setInterval(() => {
      const currentUrl = window.location.href;

      // For Wellfound, also check job_listing_slug parameter changes
      if (url.includes("wellfound.com")) {
        const lastSlug = new URL(lastUrl).searchParams.get("job_listing_slug");
        const currentSlug = new URL(currentUrl).searchParams.get(
          "job_listing_slug",
        );

        if (currentSlug && currentSlug !== lastSlug) {
          console.log(
            "Wellfound: Job listing changed from",
            lastSlug,
            "to",
            currentSlug,
          );
          lastUrl = currentUrl;
          setTimeout(detectAndExtract, 1500);
        }
      } else if (currentUrl !== lastUrl) {
        // For Naukri and Hirist, check full URL
        lastUrl = currentUrl;
        console.log("URL changed, re-extracting job details");
        setTimeout(detectAndExtract, 1500);
      }
    }, 1000);
  }

  // Smart Apply pages (Indeed/Glassdoor unified): Watch for job header changes
  if (
    url.includes("smartapply.indeed.com") ||
    url.includes("smartapply.glassdoor.com") ||
    url.includes("/indeedapply/")
  ) {
    console.log("Smart Apply page detected - setting up monitoring");
    setTimeout(detectAndExtract, 2000);

    // Track last job to detect changes
    let lastCompany = "";
    let lastRole = "";

    // Watch for DOM changes in the job header
    const observeJobHeader = () => {
      const jobHeaderContainer =
        document.querySelector(".ia-JobHeader") ||
        document.querySelector('[class*="JobHeader"]') ||
        document.querySelector("body");

      if (jobHeaderContainer) {
        const observer = new MutationObserver((mutations) => {
          // Check if company or role changed
          const currentCompany = extractCompany();
          const currentRole = extractRole();

          const jobChanged =
            (currentCompany &&
              currentCompany !== lastCompany &&
              lastCompany !== "") ||
            (currentRole && currentRole !== lastRole && lastRole !== "");

          if (jobChanged) {
            console.log("Smart Apply: Job changed!");
            console.log("  Previous:", lastCompany, "-", lastRole);
            console.log("  Current:", currentCompany, "-", currentRole);

            lastCompany = currentCompany;
            lastRole = currentRole;

            // Re-extract and notify
            setTimeout(detectAndExtract, 500);
          } else if (
            currentCompany &&
            currentRole &&
            lastCompany === "" &&
            lastRole === ""
          ) {
            // Initial load
            lastCompany = currentCompany;
            lastRole = currentRole;
          }
        });

        observer.observe(jobHeaderContainer, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        console.log("Smart Apply: Started observing job header for changes");
      }
    };

    // Start observing after page loads
    setTimeout(observeJobHeader, 2000);

    // Also watch for URL hash changes (navigation between form pages)
    window.addEventListener("hashchange", () => {
      console.log("Smart Apply: Hash changed, checking for job changes");
      setTimeout(detectAndExtract, 1000);
    });

    // Watch for navigation within Smart Apply
    let lastFormPage = window.location.href;
    const formPageObserver = setInterval(() => {
      if (window.location.href !== lastFormPage) {
        lastFormPage = window.location.href;
        console.log("Smart Apply: Form page changed");
        setTimeout(detectAndExtract, 1000);
      }
    }, 1000);
  }

  // Listen for messages from popup (with safety check)
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Content script received message:", message);

      if (message.type === "GET_JOB_DETAILS") {
        const jobDetails = {
          company: extractCompany(),
          role: extractRole(),
          jobUrl: window.location.href,
          isJobPage: isJobPage(),
        };

        console.log("Sending job details:", jobDetails);
        sendResponse(jobDetails);
      }

      return true;
    });
  }
})();
