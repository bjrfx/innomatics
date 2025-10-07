// Enhanced Notification System - Facebook-style notifications
class NotificationManager {
  constructor() {
    this.notifications = JSON.parse(localStorage.getItem('dashboard-notifications') || '[]');
    this.maxNotifications = 50; // Keep only the latest 50 notifications
    this.container = null;
    this.panel = null;
    this.badge = null;
    this.btn = null;
    this.init();
  }

  init() {
    this.container = document.getElementById('notificationPanel');
    this.badge = document.getElementById('notificationBadge');
    this.btn = document.getElementById('notificationBtn');
    
    if (!this.container || !this.badge || !this.btn) {
      console.error('Notification elements not found');
      return;
    }

    this.setupEventListeners();
    this.updateBadge();
    this.renderNotifications();
    
    // Process any queued notifications
    this.processQueuedNotifications();
  }

  processQueuedNotifications() {
    if (window.pendingNotifications && window.pendingNotifications.length > 0) {
      console.log('Processing queued notifications:', window.pendingNotifications);
      window.pendingNotifications.forEach(notification => {
        this.add(notification.message, notification.type);
      });
      window.pendingNotifications = [];
    }
  }

  setupEventListeners() {
    // Toggle notification panel
    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel();
    });

    // Clear all notifications
    const clearAllBtn = document.getElementById('clearAllNotifications');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAll();
      });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target) && !this.btn.contains(e.target)) {
        this.hidePanel();
      }
    });

    // Close panel on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hidePanel();
      }
    });
  }

  togglePanel() {
    if (this.container.classList.contains('show')) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  showPanel() {
    this.container.classList.add('show');
    this.markAllAsRead();
    this.updateBadge();
  }

  hidePanel() {
    this.container.classList.remove('show');
  }

  add(message, type = 'info', persistent = false) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: Date.now(),
      read: false,
      persistent
    };

    this.notifications.unshift(notification);
    
    // Keep only the latest notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.saveToStorage();
    this.updateBadge();
    this.renderNotifications();

    // Show desktop notification if enabled
    this.showDesktopNotification(notification);

    // Play sound if enabled
    this.playNotificationSound(type);

    return notification.id;
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.updateBadge();
      this.renderNotifications();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.saveToStorage();
    this.updateBadge();
    this.renderNotifications();
  }

  remove(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveToStorage();
    this.updateBadge();
    this.renderNotifications();
  }

  clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.updateBadge();
    this.renderNotifications();
  }

  updateBadge() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
      this.badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      this.badge.style.display = 'flex';
    } else {
      this.badge.style.display = 'none';
    }
  }

  renderNotifications() {
    const listContainer = document.getElementById('notificationList');
    if (!listContainer) return;

    if (this.notifications.length === 0) {
      listContainer.innerHTML = `
        <div class="no-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    const html = this.notifications.map(notification => this.createNotificationHTML(notification)).join('');
    listContainer.innerHTML = html;

    // Add click event listeners to notification items
    listContainer.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const notificationId = parseFloat(item.dataset.notificationId);
        this.markAsRead(notificationId);
      });
    });
  }

  createNotificationHTML(notification) {
    const timeAgo = this.formatTimeAgo(notification.timestamp);
    const iconClass = this.getIconClass(notification.type);
    const unreadClass = notification.read ? '' : 'unread';

    return `
      <div class="notification-item ${unreadClass}" data-notification-id="${notification.id}">
        <div class="notification-content">
          <div class="notification-icon ${notification.type}">
            <i class="${iconClass}"></i>
          </div>
          <div class="notification-text">
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${timeAgo}</div>
          </div>
        </div>
      </div>
    `;
  }

  getIconClass(type) {
    const icons = {
      success: 'fas fa-check',
      error: 'fas fa-exclamation-triangle',
      warning: 'fas fa-exclamation',
      info: 'fas fa-info'
    };
    return icons[type] || icons.info;
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  saveToStorage() {
    localStorage.setItem('dashboard-notifications', JSON.stringify(this.notifications));
  }

  showDesktopNotification(notification) {
    if (!this.isDesktopNotificationsEnabled()) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Innomatics Dashboard', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  }

  playNotificationSound(type) {
    if (!this.isSoundNotificationsEnabled()) return;

    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 500
      };

      oscillator.frequency.value = frequencies[type] || frequencies.info;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  }

  isDesktopNotificationsEnabled() {
    return localStorage.getItem('desktop-notifications') === 'true';
  }

  isSoundNotificationsEnabled() {
    return localStorage.getItem('sound-notifications') === 'true';
  }

  // Request permission for desktop notifications
  async requestDesktopPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// Initialize notification manager
const notificationManager = new NotificationManager();

// Export for global use
window.notificationManager = notificationManager;