/**
 * Application constants
 */

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  HOD: 'hod',
  STAFF: 'staff',
  STUDENT: 'student'
};

// Asset statuses
const ASSET_STATUS = {
  AVAILABLE: 'available',
  CHECKED_OUT: 'checked-out',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired'
};

// Request statuses
const REQUEST_STATUS = {
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Request priorities
const REQUEST_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Request categories
const REQUEST_CATEGORIES = {
  MAINTENANCE: 'Maintenance',
  IT_SUPPORT: 'IT Support',
  CLEANING: 'Cleaning',
  FURNITURE: 'Furniture',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  HVAC: 'HVAC',
  SECURITY: 'Security',
  OTHER: 'Other'
};

// Requisition statuses
const REQUISITION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  HOD_APPROVED: 'hod-approved',
  FINANCE_APPROVED: 'finance-approved',
  PURCHASED: 'purchased',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Inventory categories
const INVENTORY_CATEGORIES = {
  STATIONERY: 'Stationery',
  CLEANING: 'Cleaning',
  LAB_SUPPLIES: 'Lab Supplies',
  CAFE_SUPPLIES: 'Cafe Supplies',
  MAINTENANCE: 'Maintenance',
  IT_SUPPLIES: 'IT Supplies',
  OTHER: 'Other'
};

// Book categories
const BOOK_CATEGORIES = {
  TEXTBOOK: 'Textbook',
  REFERENCE: 'Reference',
  FICTION: 'Fiction',
  NON_FICTION: 'Non-Fiction',
  JOURNAL: 'Journal',
  MAGAZINE: 'Magazine',
  OTHER: 'Other'
};

// File upload limits
const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Notification types
const NOTIFICATION_TYPES = {
  REQUEST: 'request',
  CHECKOUT: 'checkout',
  ALERT: 'alert',
  SYSTEM: 'system'
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  DASHBOARD: 300, // 5 minutes
  ASSETS: 600, // 10 minutes
  INVENTORY: 300, // 5 minutes
  REPORTS: 3600 // 1 hour
};

// Report formats
const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv'
};

// Date formats
const DATE_FORMATS = {
  DEFAULT: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm:ss',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Response messages
const RESPONSE_MESSAGES = {
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error'
};

module.exports = {
  USER_ROLES,
  ASSET_STATUS,
  REQUEST_STATUS,
  REQUEST_PRIORITY,
  REQUEST_CATEGORIES,
  REQUISITION_STATUS,
  INVENTORY_CATEGORIES,
  BOOK_CATEGORIES,
  FILE_UPLOAD,
  PAGINATION,
  NOTIFICATION_TYPES,
  CACHE_DURATIONS,
  REPORT_FORMATS,
  DATE_FORMATS,
  HTTP_STATUS,
  RESPONSE_MESSAGES
};