export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

export const LOCATION_CONFIG = {
  updateInterval: 30000, // 30 seconds
  distanceFilter: 10, // meters
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

export const SYNC_CONFIG = {
  syncInterval: 60000, // 1 minute
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  batchSize: 50,
};

export const OCR_CONFIG = {
  language: 'eng',
  minConfidence: 0.6,
  maxImageSize: 1920,
  compressionQuality: 0.8,
};

export const AI_CONFIG = {
  maxTokens: 2000,
  temperature: 0.7,
  model: 'gpt-4-turbo-preview',
};

export const STORAGE_KEYS = {
  AUTH_TOKENS: 'auth_tokens',
  USER_DATA: 'user_data',
  OFFLINE_REPORTS: 'offline_reports',
  OFFLINE_LOCATIONS: 'offline_locations',
  OFFLINE_OCR: 'offline_ocr',
  SETTINGS: 'app_settings',
  LAST_SYNC: 'last_sync_timestamp',
};

export const REPORT_CATEGORIES = [
  { id: 'inspection', label: 'Inspection', icon: 'search' },
  { id: 'logistics', label: 'Logistics', icon: 'local-shipping' },
  { id: 'sales', label: 'Sales', icon: 'attach-money' },
  { id: 'survey', label: 'Survey', icon: 'poll' },
  { id: 'maintenance', label: 'Maintenance', icon: 'build' },
  { id: 'incident', label: 'Incident', icon: 'warning' },
  { id: 'other', label: 'Other', icon: 'more-horiz' },
];

export const REPORT_PRIORITIES = [
  { id: 'low', label: 'Low', color: '#4CAF50' },
  { id: 'medium', label: 'Medium', color: '#FF9800' },
  { id: 'high', label: 'High', color: '#F44336' },
  { id: 'urgent', label: 'Urgent', color: '#9C27B0' },
];
