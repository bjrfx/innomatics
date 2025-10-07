// Settings Management System
class SettingsManager {
  constructor() {
    this.settings = {
      apiKey: '',
      orgId: '257', // Default org ID
      desktopNotifications: false,
      soundNotifications: false,
      autoRefresh: true
    };
    this.loadSettings();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.populateForm();
    this.updateAPIStatus();
  }

  setupEventListeners() {
    // API Configuration Form
    const apiForm = document.getElementById('apiConfigForm');
    if (apiForm) {
      apiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveAPIConfiguration();
      });
    }

    // API Key visibility toggle
    const toggleApiKey = document.getElementById('toggleApiKey');
    if (toggleApiKey) {
      toggleApiKey.addEventListener('click', () => {
        this.toggleAPIKeyVisibility();
      });
    }

    // Test API connection
    const testApiBtn = document.getElementById('testApiConnection');
    if (testApiBtn) {
      testApiBtn.addEventListener('click', () => {
        this.testAPIConnection();
      });
    }

    // Notification settings
    const desktopNotifications = document.getElementById('desktopNotifications');
    if (desktopNotifications) {
      desktopNotifications.addEventListener('change', (e) => {
        this.updateSetting('desktopNotifications', e.target.checked);
        if (e.target.checked) {
          this.requestNotificationPermission();
        }
      });
    }

    const soundNotifications = document.getElementById('soundNotifications');
    if (soundNotifications) {
      soundNotifications.addEventListener('change', (e) => {
        this.updateSetting('soundNotifications', e.target.checked);
      });
    }

    const autoRefresh = document.getElementById('autoRefresh');
    if (autoRefresh) {
      autoRefresh.addEventListener('change', (e) => {
        this.updateSetting('autoRefresh', e.target.checked);
        if (e.target.checked) {
          startAutoRefresh();
        } else {
          stopAutoRefresh();
        }
      });
    }

    // Clear notification history
    const clearNotificationHistory = document.getElementById('clearNotificationHistory');
    if (clearNotificationHistory) {
      clearNotificationHistory.addEventListener('click', () => {
        this.clearNotificationHistory();
      });
    }
  }

  populateForm() {
    const apiKeyInput = document.getElementById('apiKey');
    const orgIdInput = document.getElementById('orgId');
    const desktopNotifications = document.getElementById('desktopNotifications');
    const soundNotifications = document.getElementById('soundNotifications');
    const autoRefresh = document.getElementById('autoRefresh');

    if (apiKeyInput) apiKeyInput.value = this.settings.apiKey;
    if (orgIdInput) orgIdInput.value = this.settings.orgId;
    if (desktopNotifications) desktopNotifications.checked = this.settings.desktopNotifications;
    if (soundNotifications) soundNotifications.checked = this.settings.soundNotifications;
    if (autoRefresh) autoRefresh.checked = this.settings.autoRefresh;
  }

  saveAPIConfiguration() {
    const apiKeyInput = document.getElementById('apiKey');
    const orgIdInput = document.getElementById('orgId');

    if (apiKeyInput && orgIdInput) {
      const apiKey = apiKeyInput.value.trim();
      const orgId = orgIdInput.value.trim();

      if (!apiKey) {
        notificationManager.add('API Key is required', 'error');
        return;
      }

      if (!orgId) {
        notificationManager.add('Organization ID is required', 'error');
        return;
      }

      this.updateSetting('apiKey', apiKey);
      this.updateSetting('orgId', orgId);

      notificationManager.add('API configuration saved successfully', 'success');
      this.updateAPIStatus('saved');

      // Update the global API variables
      if (window.API_KEY !== undefined) {
        window.API_KEY = apiKey;
      }
      if (window.ORG_ID !== undefined) {
        window.ORG_ID = orgId;
      }
    }
  }

  toggleAPIKeyVisibility() {
    const apiKeyInput = document.getElementById('apiKey');
    const toggleBtn = document.getElementById('toggleApiKey');
    const icon = toggleBtn.querySelector('i');

    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      apiKeyInput.type = 'password';
      icon.className = 'fas fa-eye';
    }
  }

  async testAPIConnection() {
    const testBtn = document.getElementById('testApiConnection');
    const originalText = testBtn.innerHTML;
    
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Testing...';
    testBtn.disabled = true;

    try {
      const apiKey = this.getSetting('apiKey');
      const orgId = this.getSetting('orgId');

      if (!apiKey) {
        throw new Error('API Key not configured');
      }

      // Test the API with a simple endpoint
      const response = await fetch('https://innomatics-api.edmingle.com/nuSource/api/v1/user/usermeta', {
        headers: { 
          'APIKEY': apiKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.updateAPIStatus('connected');
        notificationManager.add('API connection successful', 'success');
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error('API Test Error:', error);
      this.updateAPIStatus('error');
      notificationManager.add(`API connection failed: ${error.message}`, 'error');
    } finally {
      testBtn.innerHTML = originalText;
      testBtn.disabled = false;
    }
  }

  updateAPIStatus(status = null) {
    const statusElement = document.getElementById('apiStatus');
    const statusIndicator = statusElement?.querySelector('.status-indicator');
    
    if (!statusIndicator) return;

    const apiKey = this.getSetting('apiKey');
    
    if (!apiKey) {
      statusIndicator.className = 'status-indicator';
      statusIndicator.innerHTML = '<i class="fas fa-circle text-warning"></i><span>API key not configured</span>';
    } else if (status === 'connected') {
      statusIndicator.className = 'status-indicator connected';
      statusIndicator.innerHTML = '<i class="fas fa-circle text-success"></i><span>API connection verified</span>';
    } else if (status === 'error') {
      statusIndicator.className = 'status-indicator error';
      statusIndicator.innerHTML = '<i class="fas fa-circle text-danger"></i><span>API connection failed</span>';
    } else if (status === 'saved') {
      statusIndicator.className = 'status-indicator';
      statusIndicator.innerHTML = '<i class="fas fa-circle text-info"></i><span>Configuration saved - test connection</span>';
    } else {
      statusIndicator.className = 'status-indicator';
      statusIndicator.innerHTML = '<i class="fas fa-circle text-warning"></i><span>API connection not tested</span>';
    }
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
    
    // Also save individual settings for backward compatibility
    localStorage.setItem(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
  }

  getSetting(key) {
    return this.settings[key];
  }

  getAPIKey() {
    return this.settings.apiKey || '';
  }

  getOrgId() {
    return this.settings.orgId || '257';
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('dashboard-settings');
    if (savedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    // Load individual settings for backward compatibility
    const individualSettings = {
      desktopNotifications: localStorage.getItem('desktop-notifications') === 'true',
      soundNotifications: localStorage.getItem('sound-notifications') === 'true',
      autoRefresh: localStorage.getItem('auto-refresh') !== 'false' // Default to true
    };

    this.settings = { ...this.settings, ...individualSettings };
  }

  saveSettings() {
    localStorage.setItem('dashboard-settings', JSON.stringify(this.settings));
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        notificationManager.add('Desktop notifications permission denied', 'warning');
        this.updateSetting('desktopNotifications', false);
        document.getElementById('desktopNotifications').checked = false;
      }
    } else {
      notificationManager.add('Desktop notifications not supported in this browser', 'warning');
      this.updateSetting('desktopNotifications', false);
      document.getElementById('desktopNotifications').checked = false;
    }
  }

  clearNotificationHistory() {
    if (confirm('Are you sure you want to clear all notification history?')) {
      notificationManager.clearAll();
      notificationManager.add('Notification history cleared', 'info');
    }
  }

  // Method to get API credentials for use in other scripts
  getAPICredentials() {
    return {
      apiKey: this.getAPIKey(),
      orgId: this.getOrgId()
    };
  }
}

// Initialize settings manager
const settingsManager = new SettingsManager();

// Export for global use
window.settingsManager = settingsManager;