// Application status options
export const STATUS = {
  APPLIED: 'applied',
  INTERVIEW: 'interview',
  REJECTED: 'rejected',
  GHOSTED: 'ghosted'
};

// Job portal URL patterns for detection
export const JOB_PATTERNS = [
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
export const JOB_KEYWORDS = [
  'apply now',
  'submit application',
  'job description',
  'job details',
  'responsibilities',
  'qualifications',
  'requirements',
  'about the role',
  'position overview'
];

// Status colors for UI
export const STATUS_COLORS = {
  [STATUS.APPLIED]: '#3b82f6',
  [STATUS.INTERVIEW]: '#10b981',
  [STATUS.REJECTED]: '#ef4444',
  [STATUS.GHOSTED]: '#6b7280'
};

// Status labels
export const STATUS_LABELS = {
  [STATUS.APPLIED]: 'Applied',
  [STATUS.INTERVIEW]: 'Interview',
  [STATUS.REJECTED]: 'Rejected',
  [STATUS.GHOSTED]: 'Ghosted'
};