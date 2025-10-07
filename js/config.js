// Configuration for Innomatics Dashboard
const CONFIG = {
  // Production domain - change this when deploying
  BASE_URL: 'https://innomatics.bdotsoftware.com',
  
  // API endpoints
  API: {
    BASE: 'https://innomatics.bdotsoftware.com/api',
    AUTH: 'https://innomatics.bdotsoftware.com/api/auth.php',
    SUBJECTS: 'https://innomatics.bdotsoftware.com/api/subjects.php',
    RECORDINGS: 'https://innomatics.bdotsoftware.com/api/recordings.php'
  },
  
  // External API configuration - now managed through settings
  EXTERNAL_API: {
    KEY: '', // Will be loaded from settings
    ORG_ID: '', // Will be loaded from settings
    BASE_URL: 'https://innomatics-api.edmingle.com/nuSource/api/v1'
  },
  
  // Environment detection
  ENVIRONMENT: 'production', // 'development' or 'production'
  
  // Debug mode
  DEBUG: false
};

// Helper function to get API URL
function getApiUrl(endpoint) {
  return `${CONFIG.API.BASE}/${endpoint}`;
}

// Helper function to determine if we're in development
function isDevelopment() {
  return CONFIG.ENVIRONMENT === 'development' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
}

// Auto-detect environment and adjust URLs if needed
if (isDevelopment()) {
  console.log('Development environment detected');
  CONFIG.BASE_URL = window.location.origin;
  CONFIG.API.BASE = `${window.location.origin}/api`;
  CONFIG.API.AUTH = `${window.location.origin}/api/auth.php`;
  CONFIG.API.SUBJECTS = `${window.location.origin}/api/subjects.php`;
  CONFIG.API.RECORDINGS = `${window.location.origin}/api/recordings.php`;
  CONFIG.DEBUG = true;
}

// Debug logging
function debugLog(...args) {
  if (CONFIG.DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Helper function to update external API config with stored credentials
function updateExternalAPIConfig() {
  if (window.settingsManager) {
    const credentials = window.settingsManager.getAPICredentials();
    CONFIG.EXTERNAL_API.KEY = credentials.apiKey;
    CONFIG.EXTERNAL_API.ORG_ID = credentials.orgId;
  }
}

// Export for use in other scripts
window.CONFIG = CONFIG;
window.getApiUrl = getApiUrl;
window.isDevelopment = isDevelopment;
window.debugLog = debugLog;
window.updateExternalAPIConfig = updateExternalAPIConfig;