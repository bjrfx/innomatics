const API_KEY = '287953e9c96e838e691447eeaae01dc9';
const ORG_ID = '257';

// Debug mode for troubleshooting
const DEBUG_MODE = true;

function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

// Dashboard State Management
class DashboardState {
  constructor() {
    this.userData = null;
    this.examData = null;
    this.attendanceData = null;
    this.isLoading = false;
    this.autoRefreshInterval = null;
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.updateLoadingStates();
  }

  updateLoadingStates() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (this.isLoading) {
      loadingOverlay.classList.remove('hidden');
    } else {
      loadingOverlay.classList.add('hidden');
    }
  }
}

const dashboardState = new DashboardState();

// Theme Management System
class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || 'light';
    this.init();
  }

  init() {
    // Apply theme on page load
    this.applyTheme(this.currentTheme);
    
    // Initialize theme toggle button
    this.initializeThemeToggle();
  }

  getStoredTheme() {
    return localStorage.getItem('dashboard-theme');
  }

  setStoredTheme(theme) {
    localStorage.setItem('dashboard-theme', theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    this.setStoredTheme(theme);
    this.updateThemeIcon();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    
    // Show toast notification
    toastManager.show(`Switched to ${newTheme} theme`, 'success');
  }

  updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      if (this.currentTheme === 'dark') {
        themeIcon.className = 'fas fa-sun';
        themeIcon.parentElement.title = 'Switch to light theme';
      } else {
        themeIcon.className = 'fas fa-moon';
        themeIcon.parentElement.title = 'Switch to dark theme';
      }
    }
  }

  initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
        
        // Add click animation
        themeToggle.style.transform = 'scale(0.9)';
        setTimeout(() => {
          themeToggle.style.transform = '';
        }, 150);
      });
    }
  }
}

const themeManager = new ThemeManager();

// Toast Notification System
class ToastManager {
  constructor() {
    this.container = document.getElementById('toastContainer');
  }

  show(message, type = 'success', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <i class="toast-icon ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    this.container.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove
    const autoRemove = setTimeout(() => this.remove(toast), duration);

    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoRemove);
      this.remove(toast);
    });
  }

  remove(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  }
}

const toastManager = new ToastManager();

// Animation Utils
function animateElement(element, animationClass, delay = 0) {
  setTimeout(() => {
    element.classList.add(animationClass);
  }, delay);
}

function animateStats() {
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, index) => {
    animateElement(card, 'slide-in-up', index * 100);
  });
}

function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-bar');
  progressBars.forEach((bar, index) => {
    setTimeout(() => {
      const progress = bar.getAttribute('data-progress');
      const fill = bar.querySelector('.progress-fill');
      fill.style.width = `${progress}%`;
    }, index * 300);
  });
}

function showSkeleton(skeletonId) {
  const skeleton = document.getElementById(skeletonId);
  if (skeleton) {
    skeleton.style.display = 'block';
  }
}

function hideSkeleton(skeletonId, contentId) {
  const skeleton = document.getElementById(skeletonId);
  const content = document.getElementById(contentId);
  
  if (skeleton && content) {
    skeleton.style.display = 'none';
    content.style.display = 'block';
    animateElement(content, 'fade-in');
  }
}

// Enhanced API Functions
async function fetchUserDetails() {
  try {
    showSkeleton('userSkeleton');
    
    const response = await fetch('https://innomatics-api.edmingle.com/nuSource/api/v1/user/usermeta', {
      headers: { 'APIKEY': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('User API Response:', data);

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!data.user) {
      toastManager.show('No user data found', 'warning');
      hideSkeleton('userSkeleton', 'userProfileContent');
      return;
    }

    const user = data.user;
    dashboardState.userData = user;

    // Update user profile
    document.getElementById('userName').textContent = user.name || 'Unknown User';
    document.getElementById('userUsername').textContent = `@${user.username || 'username'}`;
    document.getElementById('userEmail').textContent = user.email || 'No email provided';
    document.getElementById('userCountry').textContent = user.country || 'Not specified';
    document.getElementById('userContact').textContent = user.contact_number || 'Not provided';
    document.getElementById('userIdDisplay').textContent = user.user_id || 'N/A';

    // Update dashboard title with user's name
    updateDashboardTitle(user);

    // Update stats
    document.getElementById('userCount').textContent = '1';

    hideSkeleton('userSkeleton', 'userProfileContent');
    toastManager.show('User profile loaded successfully!', 'success');

  } catch (error) {
    console.error('Error fetching user:', error);
    toastManager.show('Failed to load user profile', 'error');
    hideSkeleton('userSkeleton', 'userProfileContent');
  }
}

async function fetchExamSubjects() {
  try {
    showSkeleton('examSkeleton');
    
    const response = await fetch('https://innomatics-api.edmingle.com/nuSource/api/v1/engage/subjects', {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'orgid': ORG_ID,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    const subjectsList = document.getElementById('subjectsList');
    subjectsList.innerHTML = '';

    if (!data.engage_exam_subjects || data.engage_exam_subjects.length === 0) {
      subjectsList.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-inbox fa-2x text-muted mb-3"></i>
          <p class="text-muted">No exam subjects available</p>
        </div>
      `;
      hideSkeleton('examSkeleton', 'examSubjectsContent');
      return;
    }

    dashboardState.examData = data.engage_exam_subjects;

    // Create subject items with staggered animation
    data.engage_exam_subjects.forEach((subject, index) => {
      const subjectElement = document.createElement('div');
      subjectElement.className = 'subject-item';
      subjectElement.innerHTML = `
        <div class="subject-icon">
          <i class="fas fa-book"></i>
        </div>
        <div class="subject-content">
          <div class="subject-name">${subject.engage_exam_tag_name || 'Unknown Exam'}</div>
          <div class="subject-meta">
            Subject: ${subject.engage_subject_tag_name || 'N/A'} • 
            ID: ${subject.engage_subject_tag_id || 'N/A'}
          </div>
        </div>
        <div class="subject-badge">
          ${subject.exam_id || 'N/A'}
        </div>
      `;
      
      subjectsList.appendChild(subjectElement);
      
      // Staggered animation
      setTimeout(() => {
        animateElement(subjectElement, 'slide-in-right');
      }, index * 150);
    });

    // Update stats
    document.getElementById('examCount').textContent = data.engage_exam_subjects.length;
    document.getElementById('subjectCount').textContent = [...new Set(data.engage_exam_subjects.map(s => s.engage_subject_tag_name))].length;

    hideSkeleton('examSkeleton', 'examSubjectsContent');
    toastManager.show(`Loaded ${data.engage_exam_subjects.length} exam subjects`, 'success');

  } catch (error) {
    console.error('Error fetching exam subjects:', error);
    toastManager.show('Failed to load exam subjects', 'error');
    hideSkeleton('examSkeleton', 'examSubjectsContent');
  }
}

// Enhanced Attendance API Function
async function fetchAttendanceData() {
  try {
    showSkeleton('attendanceSkeleton');
    debugLog('Starting attendance data fetch...');
    
    // First, let's test the API to see the actual response
    const testData = await testAttendanceAPI();
    
    if (testData && testData.payload && testData.payload.attendance) {
      debugLog('✅ Using real API data');
      
      // Process real attendance data
      const attendanceRecords = [];
      
      testData.payload.attendance.forEach((classData, classIndex) => {
        debugLog(`Processing class ${classIndex}:`, classData);
        
        if (Array.isArray(classData) && classData.length > 15) {
          const studentRecords = classData[15];
          
          if (Array.isArray(studentRecords)) {
            debugLog(`Found ${studentRecords.length} student records in class ${classIndex}`);
            
            studentRecords.forEach((studentRecord, studentIndex) => {
              if (Array.isArray(studentRecord) && studentRecord.length > 2) {
                try {
                  let topicName = 'General Session';
                  if (classData[21]) {
                    try {
                      const topicData = JSON.parse(classData[21]);
                      if (Array.isArray(topicData) && topicData[0] && topicData[0].topic_name) {
                        topicName = topicData[0].topic_name;
                      }
                    } catch (topicError) {
                      debugLog('Failed to parse topic data:', topicError);
                    }
                  }

                  const record = {
                    studentId: studentRecord[0] || 'Unknown',
                    studentName: studentRecord[1] || 'Unknown Student',
                    attendanceStatus: studentRecord[2],
                    classDate: classData[3] || Date.now() / 1000,
                    classTitle: classData[18] || classData[10] || 'Class Session',
                    topic: topicName,
                    trainerName: classData[2] || classData[9] || 'Trainer',
                    duration: classData[4] && classData[5] ? `${Math.floor((classData[5] - classData[4]) / 60)} mins` : 'N/A',
                    classId: classData[11] || 'Unknown'
                  };
                  
                  debugLog(`Student record ${studentIndex}:`, record);
                  attendanceRecords.push(record);
                } catch (recordError) {
                  debugLog(`Error processing student record ${studentIndex}:`, recordError);
                }
              }
            });
          }
        }
      });

      debugLog('Final processed records:', attendanceRecords);
      
      if (attendanceRecords.length > 0) {
        displayAttendanceData(attendanceRecords);
        toastManager.show(`Loaded ${attendanceRecords.length} attendance records`, 'success');
      } else {
        debugLog('No records found in API data, using demo...');
        const demoRecords = createDemoAttendanceData();
        displayAttendanceData(demoRecords);
        toastManager.show('API returned no records - showing demo data', 'info');
      }
      
    } else {
      debugLog('❌ API test failed, using demo data');
      const demoRecords = createDemoAttendanceData();
      displayAttendanceData(demoRecords);
      toastManager.show('API unavailable - showing demo attendance data', 'warning');
    }

    hideSkeleton('attendanceSkeleton', 'attendanceContent');

  } catch (error) {
    console.error('Error in attendance function:', error);
    
    // Always show demo data as fallback
    debugLog('Exception occurred, using demo data...');
    const demoRecords = createDemoAttendanceData();
    displayAttendanceData(demoRecords);
    hideSkeleton('attendanceSkeleton', 'attendanceContent');
    toastManager.show('Error loading attendance - showing demo data', 'warning');
  }
}

// Fallback attendance function with different parameters
async function fetchAttendanceDataFallback() {
  try {
    console.log('Trying fallback attendance API call...');
    
    // Try with current date range
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60);
    
    const response = await fetch(
      `https://innomatics-api.edmingle.com/nuSource/api/v1/class/attendance?start=${thirtyDaysAgo}&end=${thirtyDaysFromNow}&class_id=412564`, 
      {
        method: 'GET',
        headers: { 
          'apikey': API_KEY,
          'orgid': ORG_ID,
          'Accept': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('Fallback API response:', data);
      return data;
    } else {
      console.log('Fallback also failed with status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Fallback attendance fetch failed:', error);
    return null;
  }
}

// Test/Demo attendance data for when API is unavailable
function createDemoAttendanceData() {
  debugLog('Creating demo attendance data...');
  
  const demoRecords = [
    {
      studentId: 92343101,
      studentName: "B Laxmi Phani Kiran",
      attendanceStatus: 1,
      classDate: Math.floor(Date.now() / 1000) - (1 * 24 * 60 * 60),
      classTitle: "Python Programming - Advanced Concepts",
      topic: "Object-Oriented Programming",
      trainerName: "Trainer 22",
      duration: "120 mins"
    },
    {
      studentId: 92343101,
      studentName: "B Laxmi Phani Kiran",
      attendanceStatus: 1,
      classDate: Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60),
      classTitle: "Data Structures and Algorithms",
      topic: "Linked Lists and Trees",
      trainerName: "Trainer 22",
      duration: "90 mins"
    },
    {
      studentId: 92343101,
      studentName: "B Laxmi Phani Kiran",
      attendanceStatus: 0,
      classDate: Math.floor(Date.now() / 1000) - (5 * 24 * 60 * 60),
      classTitle: "Machine Learning Basics",
      topic: "Introduction to ML",
      trainerName: "Trainer 15",
      duration: "120 mins"
    },
    {
      studentId: 92343101,
      studentName: "B Laxmi Phani Kiran",
      attendanceStatus: -1,
      classDate: Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60),
      classTitle: "Web Development Workshop",
      topic: "React.js Fundamentals",
      trainerName: "Trainer 18",
      duration: "150 mins"
    },
    {
      studentId: 92343101,
      studentName: "B Laxmi Phani Kiran",
      attendanceStatus: 1,
      classDate: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60),
      classTitle: "Database Management",
      topic: "SQL and NoSQL",
      trainerName: "Trainer 22",
      duration: "100 mins"
    }
  ];
  
  return demoRecords;
}

// Demo institution data for fallback
const demoInstitutionData = {
  name: "Innomatics Research Labs",
  title: "Innomatics Research Labs",
  contact_number: "9951666670",
  address_1: "#205, 2nd Floor, Fortune Signature, Near JNTU Metro Station, Opp: More Mega Store, Kukatpally,",
  city: "Hyderabad",
  pincode: "500085",
  support_email: "info@innomatics.in",
  logo_details: [{
    logo_url: "https://dme2wmiz2suov.cloudfront.net/Institution(149)/Logo/573326-innomatics_research_labs_logo.png",
    logo_width: "150px"
  }],
  fb_url: "https://www.facebook.com/innomaticshyd/",
  linked_url: "https://linkedin.com/school/innomatics-research-labs/",
  twitter_url: "https://twitter.com/innomaticshyd",
  ig_url: "https://www.instagram.com/innomatics_hyd/",
  youtube_url: "https://www.youtube.com/c/InnomaticsResearchLabs"
};

function displayAttendanceData(attendanceRecords) {
  debugLog('Displaying attendance data:', attendanceRecords);
  
  // Sort by date (most recent first)
  attendanceRecords.sort((a, b) => b.classDate - a.classDate);

  // Calculate statistics
  const presentCount = attendanceRecords.filter(r => r.attendanceStatus === 1).length;
  const absentCount = attendanceRecords.filter(r => r.attendanceStatus === 0).length;
  const futureCount = attendanceRecords.filter(r => r.attendanceStatus === -1).length;
  const totalCompletedClasses = presentCount + absentCount;
  const attendancePercentage = totalCompletedClasses > 0 ? Math.round((presentCount / totalCompletedClasses) * 100) : 0;

  debugLog('Attendance stats:', { presentCount, absentCount, futureCount, attendancePercentage });

  // Update stats in header
  document.getElementById('presentCount').textContent = presentCount;
  document.getElementById('absentCount').textContent = absentCount;
  document.getElementById('futureCount').textContent = futureCount;

  // Update detailed stats
  document.getElementById('presentCountDetail').textContent = presentCount;
  document.getElementById('absentCountDetail').textContent = absentCount;
  document.getElementById('futureCountDetail').textContent = futureCount;
  document.getElementById('attendancePercentage').textContent = `${attendancePercentage}%`;

  // Update circular progress chart
  const chart = document.getElementById('attendanceChart');
  const angle = (attendancePercentage / 100) * 360;
  chart.style.setProperty('--attendance-angle', `${angle}deg`);

  // Populate timeline
  const timeline = document.getElementById('attendanceTimeline');
  timeline.innerHTML = '';

  if (attendanceRecords.length === 0) {
    timeline.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-calendar-times fa-2x text-muted mb-3"></i>
        <p class="text-muted">No attendance records found</p>
      </div>
    `;
  } else {
    // Show only the most recent 10 records
    const recentRecords = attendanceRecords.slice(0, 10);
    
    recentRecords.forEach((record, index) => {
      const date = new Date(record.classDate * 1000);
      const statusClass = record.attendanceStatus === 1 ? 'present' : 
                         record.attendanceStatus === 0 ? 'absent' : 'future';
      const statusText = record.attendanceStatus === 1 ? 'Present' : 
                        record.attendanceStatus === 0 ? 'Absent' : 'Upcoming';
      const statusIcon = record.attendanceStatus === 1 ? 'fa-check' : 
                        record.attendanceStatus === 0 ? 'fa-times' : 'fa-clock';

      const timelineItem = document.createElement('div');
      timelineItem.className = `timeline-item ${statusClass}`;
      timelineItem.innerHTML = `
        <div class="timeline-date">
          <span class="date-day">${date.getDate()}</span>
          <span class="date-month">${date.toLocaleDateString('en', { month: 'short' })}</span>
        </div>
        <div class="timeline-content">
          <div class="timeline-title-text">${record.classTitle}</div>
          <div class="timeline-meta">
            <div class="meta-item">
              <i class="fas fa-book"></i>
              <span>${record.topic}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-user-tie"></i>
              <span>${record.trainerName}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-clock"></i>
              <span>${record.duration}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-calendar"></i>
              <span>${date.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div class="timeline-status ${statusClass}">
          <i class="fas ${statusIcon}"></i>
          ${statusText}
        </div>
      `;
      
      timeline.appendChild(timelineItem);
      
      // Staggered animation
      setTimeout(() => {
        animateElement(timelineItem, 'slide-in-left');
      }, index * 100);
    });
  }

  // Update overall completion rate based on attendance
  document.getElementById('completionRate').textContent = `${attendancePercentage}%`;
}

// Simple test function to check attendance API
async function testAttendanceAPI() {
  console.log('🧪 Testing attendance API...');
  
  try {
    // Test with the exact same headers as the working exam API
    const response = await fetch('https://innomatics-api.edmingle.com/nuSource/api/v1/class/attendance?start=1756665000&end=1759256999&class_id=412564', {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'orgid': ORG_ID,
        'Accept': 'application/json'
      }
    });

    console.log('Test Response Status:', response.status);
    console.log('Test Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Test API Response:', data);
      console.log('Payload structure:', data.payload);
      
      if (data.payload && data.payload.attendance) {
        console.log('Attendance array length:', data.payload.attendance.length);
        console.log('First attendance item:', data.payload.attendance[0]);
        
        if (data.payload.attendance[0] && data.payload.attendance[0][15]) {
          console.log('First student records:', data.payload.attendance[0][15]);
        }
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.error('❌ Test API Error:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Test API Exception:', error);
    return null;
  }
}

// Auto-refresh functionality
function startAutoRefresh() {
  // Clear existing interval
  if (dashboardState.autoRefreshInterval) {
    clearInterval(dashboardState.autoRefreshInterval);
  }

  // Refresh every 5 minutes
  dashboardState.autoRefreshInterval = setInterval(() => {
    if (!dashboardState.isLoading) {
      refreshDashboard(false);
    }
  }, 300000);
}

function stopAutoRefresh() {
  if (dashboardState.autoRefreshInterval) {
    clearInterval(dashboardState.autoRefreshInterval);
    dashboardState.autoRefreshInterval = null;
  }
}

// Main dashboard loading function
async function loadDashboard(showToast = true) {
  if (dashboardState.isLoading) return;
  
  dashboardState.setLoading(true);
  
  try {
    // Show analytics skeleton
    showSkeleton('analyticsSkeleton');
    
    // Load data in parallel
    await Promise.all([
      fetchUserDetails(),
      fetchExamSubjects(),
      fetchAttendanceData(),
      fetchInstitutionInfo()
    ]);

    // Animate stats cards
    setTimeout(() => {
      animateStats();
      animateProgressBars();
    }, 500);

    // Hide analytics skeleton and show content
    setTimeout(() => {
      hideSkeleton('analyticsSkeleton', 'analyticsContent');
    }, 1200);

    if (showToast) {
      toastManager.show('Dashboard loaded successfully!', 'success');
    }

  } catch (error) {
    console.error('Error loading dashboard:', error);
    toastManager.show('Failed to load dashboard data', 'error');
  } finally {
    dashboardState.setLoading(false);
  }
}

async function refreshDashboard(showToast = true) {
  if (showToast) {
    toastManager.show('Refreshing dashboard...', 'info', 2000);
  }
  await loadDashboard(false);
}

// Sidebar functionality
function initializeSidebar() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  if (!sidebarToggle || !sidebar) {
    console.error('Sidebar elements not found');
    return;
  }

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (sidebar && sidebarToggle && 
          !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Sidebar menu interactions
  const menuItems = document.querySelectorAll('.sidebar-menu a');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active state
      const activeItem = document.querySelector('.sidebar-menu li.active');
      if (activeItem) {
        activeItem.classList.remove('active');
      }
      item.parentElement.classList.add('active');
      
      // Handle navigation
      const href = item.getAttribute('href');
      handleNavigation(href);
      
      // Close sidebar on mobile
      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('open');
      }
      
      // Add click animation
      item.style.transform = 'scale(0.95)';
      setTimeout(() => {
        item.style.transform = '';
      }, 150);
    });
  });
}

// Handle navigation between sections
function handleNavigation(target) {
  const sections = {
    '#dashboard': 'dashboardSection',
    '#profile': 'profileSection', 
    '#exams': 'examSection',
    '#recordings': 'recordingsSection',
    '#analytics': 'analyticsSection'
  };
  
  // Hide all sections
  Object.values(sections).forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'none';
    }
  });
  
  // Hide main dashboard content when showing other sections
  const mainDashboard = document.querySelector('.main-content > .stats-container, .main-content > .dashboard-content');
  const isMainDashboard = target === '#dashboard';
  
  if (isMainDashboard) {
    // Show main dashboard
    document.querySelector('.stats-container').style.display = 'grid';
    document.querySelector('.dashboard-content').style.display = 'block';
    
    // Hide other sections
    Object.values(sections).forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section && sectionId !== 'dashboardSection') {
        section.style.display = 'none';
      }
    });
  } else {
    // Hide main dashboard
    document.querySelector('.stats-container').style.display = 'none';
    document.querySelector('.dashboard-content').style.display = 'none';
    
    // Show target section
    const targetSection = sections[target];
    const sectionElement = document.getElementById(targetSection);
    
    if (sectionElement) {
      sectionElement.style.display = 'block';
      animateElement(sectionElement, 'fade-in');
      
      // Load recordings if recordings section is selected
      if (target === '#recordings') {
        showRecordingsSkeleton();
        // Scroll to top of recordings section
        sectionElement.scrollTop = 0;
        loadRecordingsPage();
      }
    } else {
      // If specific sections don't exist, just show a toast
      const sectionName = target.replace('#', '').charAt(0).toUpperCase() + target.slice(2);
      toastManager.show(`${sectionName} section coming soon!`, 'info');
    }
  }
}

// Manual refresh buttons
function initializeRefreshButtons() {
  document.getElementById('refreshUser').addEventListener('click', async () => {
    const btn = document.getElementById('refreshUser');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    await fetchUserDetails();
    btn.innerHTML = '<i class="fas fa-refresh"></i>';
  });

  document.getElementById('refreshExams').addEventListener('click', async () => {
    const btn = document.getElementById('refreshExams');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    await fetchExamSubjects();
    btn.innerHTML = '<i class="fas fa-refresh"></i>';
  });

  document.getElementById('refreshAttendance').addEventListener('click', async () => {
    const btn = document.getElementById('refreshAttendance');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    await fetchAttendanceData();
    btn.innerHTML = '<i class="fas fa-refresh"></i>';
  });

  document.getElementById('refreshInstitution').addEventListener('click', async () => {
    const btn = document.getElementById('refreshInstitution');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    await fetchInstitutionInfo();
    btn.innerHTML = '<i class="fas fa-refresh"></i>';
  });

  document.getElementById('testAttendanceAPI').addEventListener('click', async () => {
    const btn = document.getElementById('testAttendanceAPI');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    console.log('🔍 Manual API test initiated...');
    const testResult = await testAttendanceAPI();
    
    if (testResult) {
      toastManager.show('API test successful - check console for details', 'success');
    } else {
      toastManager.show('API test failed - check console for details', 'error');
    }
    
    btn.innerHTML = '<i class="fas fa-vial"></i>';
  });

  // Recordings refresh button
  const refreshRecordingsBtn = document.getElementById('refreshRecordings');
  if (refreshRecordingsBtn) {
    refreshRecordingsBtn.addEventListener('click', async () => {
      const btn = refreshRecordingsBtn;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      await loadRecordingsPage();
      btn.innerHTML = '<i class="fas fa-refresh"></i>';
    });
  }
}

// Stats animation on scroll
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
      }
    });
  }, observerOptions);

  // Observe all dashboard cards
  document.querySelectorAll('.dashboard-card').forEach(card => {
    observer.observe(card);
  });
}

// Enhanced error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  toastManager.show('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  toastManager.show('Network error occurred', 'error');
});

// Page visibility API for auto-refresh management
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
    // Refresh data when page becomes visible again
    if (dashboardState.userData || dashboardState.examData) {
      refreshDashboard(false);
    }
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + R for refresh
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    refreshDashboard();
  }
  
  // Escape to close sidebar on mobile
  if (e.key === 'Escape' && window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
    }
  }
});

// Smooth scroll for internal navigation
function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    // Initialize components
    initializeSidebar();
    initializeRefreshButtons();
    initializeScrollAnimations();

    // Start auto-refresh
    startAutoRefresh();

    // Initial load with delay for smooth experience
    setTimeout(async () => {
      await loadDashboard();
      
      // Animate completion rate with mock data
      setTimeout(() => {
        const completionElement = document.getElementById('completionRate');
        const completionStat = document.querySelector('[data-stat="completion"]');
        
        if (completionElement) {
          completionElement.textContent = '78%';
        }
        if (completionStat) {
          animateElement(completionStat, 'slide-in-up');
        }
      }, 1500);
      
    }, 500);

  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    toastManager.show('Failed to initialize dashboard', 'error');
  }
}

// Responsive handling
function handleResize() {
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebar && window.innerWidth > 768) {
    sidebar.classList.remove('open');
  }
}

window.addEventListener('resize', handleResize);

// Performance monitoring
function logPerformance() {
  if (window.performance && window.performance.timing) {
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    console.log(`Dashboard loaded in ${loadTime}ms`);
  }
}

// Enhanced interaction feedback
function addInteractionFeedback() {
  // Add hover effects to interactive elements
  document.addEventListener('mouseenter', (e) => {
    if (e.target && e.target.classList && 
        (e.target.classList.contains('stat-card') || 
         e.target.classList.contains('subject-item') ||
         e.target.classList.contains('dashboard-card'))) {
      e.target.style.transform = 'translateY(-5px)';
    }
  }, true);

  document.addEventListener('mouseleave', (e) => {
    if (e.target && e.target.classList && 
        (e.target.classList.contains('stat-card') || 
         e.target.classList.contains('subject-item') ||
         e.target.classList.contains('dashboard-card'))) {
      e.target.style.transform = '';
    }
  }, true);

  // Add click ripple effect
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList && 
        (e.target.classList.contains('action-btn') || 
         e.target.classList.contains('toggle-btn'))) {
      const btn = e.target;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      btn.appendChild(ripple);
      
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 600);
    }
  });
}

// Fetch Institution Information
async function fetchInstitutionInfo() {
  try {
    debugLog('Fetching institution info...');
    showSkeleton('institutionSkeleton');
    
    const response = await fetch('https://innomatics-api.edmingle.com/nuSource/api/v1/institute/instituteinfo?host_name=online.innomatics.in', {
      headers: { 'APIKEY': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Institution info API response:', data);
    
    if (data && data.inst_info) {
      dashboardState.institutionData = data.inst_info;
      displayInstitutionInfo(data.inst_info);
      hideSkeleton('institutionSkeleton', 'institutionContent');
      toastManager.show('Institution info loaded successfully', 'success');
    } else {
      throw new Error('Invalid institution data structure');
    }

  } catch (error) {
    console.error('Error fetching institution info:', error);
    debugLog('Using demo institution data as fallback');
    displayInstitutionInfo(demoInstitutionData);
    hideSkeleton('institutionSkeleton', 'institutionContent');
    toastManager.show('Using offline institution data', 'warning');
  }
}

// Display Institution Information
function displayInstitutionInfo(instData) {
  try {
    debugLog('Displaying institution info:', instData);
    
    // Update sidebar with institution logo
    updateInstitutionHeader(instData);
    
    // Update institution info card
    updateInstitutionCard(instData);
    
    // Update stats card with institution achievements
    updateInstitutionStats(instData);
    
  } catch (error) {
    console.error('Error displaying institution info:', error);
    toastManager.show('Error displaying institution data', 'error');
  }
}

// Update header with institution branding
function updateInstitutionHeader(instData) {
  const sidebarLogo = document.getElementById('sidebarLogo');
  const sidebarLogoSkeleton = document.getElementById('sidebarLogoSkeleton');
  
  if (sidebarLogo && instData.logo_details?.[0]?.logo_url) {
    // Hide skeleton
    if (sidebarLogoSkeleton) {
      sidebarLogoSkeleton.style.display = 'none';
    }
    
    sidebarLogo.innerHTML = `
      <img src="${instData.logo_details[0].logo_url}" 
           alt="Institution Logo" 
           class="sidebar-institution-logo"
           onerror="this.style.display='none'">
    `;
    
    // Animate logo appearance
    const logo = sidebarLogo.querySelector('.sidebar-institution-logo');
    if (logo) {
      animateElement(logo, 'fade-in');
    }
  }
}

// Update dashboard title with user name
function updateDashboardTitle(userData) {
  const dashboardTitle = document.getElementById('dashboardTitle');
  
  if (dashboardTitle && userData) {
    const userName = userData.full_name || userData.name || 'Student';
    dashboardTitle.innerHTML = `
      <i class="fas fa-chart-line me-2"></i>
      ${userName}'s Dashboard
    `;
  }
}

// Update institution info card
function updateInstitutionCard(instData) {
  const cardContent = document.getElementById('institutionCardContent');
  if (!cardContent) return;
  
  const socialLinks = [
    { url: instData.fb_url, icon: 'fab fa-facebook', name: 'Facebook' },
    { url: instData.linked_url, icon: 'fab fa-linkedin', name: 'LinkedIn' },
    { url: instData.twitter_url, icon: 'fab fa-twitter', name: 'Twitter' },
    { url: instData.ig_url, icon: 'fab fa-instagram', name: 'Instagram' },
    { url: instData.youtube_url, icon: 'fab fa-youtube', name: 'YouTube' }
  ].filter(link => link.url);
  
  cardContent.innerHTML = `
    <div class="institution-details">
      <div class="contact-info mb-3">
        <h6 class="text-primary mb-2">
          <i class="fas fa-phone me-2"></i>Contact Information
        </h6>
        <p class="mb-1">
          <i class="fas fa-phone text-success me-2"></i>
          <a href="tel:${instData.contact_number}" class="text-decoration-none">${instData.contact_number}</a>
        </p>
        <p class="mb-1">
          <i class="fas fa-envelope text-info me-2"></i>
          <a href="mailto:${instData.support_email}" class="text-decoration-none">${instData.support_email}</a>
        </p>
      </div>
      
      <div class="address-info mb-3">
        <h6 class="text-primary mb-2">
          <i class="fas fa-map-marker-alt me-2"></i>Address
        </h6>
        <p class="mb-0 small">
          ${instData.address_1}<br>
          ${instData.city}, ${instData.pincode}
        </p>
      </div>
      
      <div class="social-links">
        <h6 class="text-primary mb-2">
          <i class="fas fa-share-alt me-2"></i>Connect with Us
        </h6>
        <div class="d-flex flex-wrap gap-2">
          ${socialLinks.map(link => `
            <a href="${link.url}" target="_blank" class="social-link btn btn-outline-light btn-sm">
              <i class="${link.icon}"></i>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Update institution stats
function updateInstitutionStats(instData) {
  // Update institution-specific stats based on the about us content
  const statsData = {
    studentsPlaced: 1500,
    totalBatches: 100,
    hackathons: 50,
    industryExperts: 20,
    meetups: 30,
    partnerCompanies: 100
  };
  
  const additionalStats = document.getElementById('institutionStats');
  if (additionalStats) {
    additionalStats.innerHTML = `
      <div class="row g-3">
        <div class="col-md-4">
          <div class="achievement-stat text-center">
            <i class="fas fa-users text-success mb-2"></i>
            <h4 class="text-primary mb-0">${statsData.studentsPlaced}+</h4>
            <small class="text-muted">Students Placed</small>
          </div>
        </div>
        <div class="col-md-4">
          <div class="achievement-stat text-center">
            <i class="fas fa-graduation-cap text-info mb-2"></i>
            <h4 class="text-primary mb-0">${statsData.totalBatches}+</h4>
            <small class="text-muted">Batches Completed</small>
          </div>
        </div>
        <div class="col-md-4">
          <div class="achievement-stat text-center">
            <i class="fas fa-trophy text-warning mb-2"></i>
            <h4 class="text-primary mb-0">${statsData.hackathons}+</h4>
            <small class="text-muted">Hackathons</small>
          </div>
        </div>
      </div>
    `;
  }
}

// Connection status monitoring
function monitorConnection() {
  window.addEventListener('online', () => {
    toastManager.show('Connection restored', 'success');
    refreshDashboard(false);
  });

  window.addEventListener('offline', () => {
    toastManager.show('Connection lost - working offline', 'warning');
    stopAutoRefresh();
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Innomatics Dashboard initializing...');
  
  initializeDashboard();
  addInteractionFeedback();
  monitorConnection();
  
  // Log performance after everything loads
  window.addEventListener('load', logPerformance);
  
  console.log('✅ Dashboard initialization complete');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopAutoRefresh();
});

// Recordings Page Functionality
async function loadRecordingsPage() {
  try {
    showRecordingsSkeleton();
    
    const response = await fetch('api/recordings.php');
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      displayRecordings(data.data);
      populateSubjectFilter(data.data);
      hideRecordingsSkeleton();
      toastManager.show(`Loaded ${getTotalRecordingsCount(data.data)} recordings`, 'success');
    } else {
      showNoRecordings();
      hideRecordingsSkeleton();
      toastManager.show('No recordings found', 'info');
    }
  } catch (error) {
    console.error('Error loading recordings:', error);
    showNoRecordings();
    hideRecordingsSkeleton();
    toastManager.show('Failed to load recordings', 'error');
  }
}

function showRecordingsSkeleton() {
  const skeleton = document.getElementById('recordingsSkeleton');
  const content = document.getElementById('recordingsList');
  const noRecordings = document.getElementById('noRecordings');
  
  if (skeleton) skeleton.style.display = 'block';
  if (content) content.style.display = 'none';
  if (noRecordings) noRecordings.style.display = 'none';
}

function hideRecordingsSkeleton() {
  const skeleton = document.getElementById('recordingsSkeleton');
  const content = document.getElementById('recordingsList');
  
  if (skeleton) skeleton.style.display = 'none';
  if (content) content.style.display = 'block';
}

function showNoRecordings() {
  const skeleton = document.getElementById('recordingsSkeleton');
  const content = document.getElementById('recordingsList');
  const noRecordings = document.getElementById('noRecordings');
  
  if (skeleton) skeleton.style.display = 'none';
  if (content) content.style.display = 'none';
  if (noRecordings) noRecordings.style.display = 'block';
}

function displayRecordings(recordingsData) {
  const recordingsList = document.getElementById('recordingsList');
  
  if (!recordingsList) return;
  
  let html = '';
  
  recordingsData.forEach((subjectGroup, groupIndex) => {
    html += `
      <div class="subject-group" data-subject-id="${subjectGroup.subject.id}">
        <div class="subject-header">
          <div class="subject-info">
            <div class="subject-color" style="background: ${subjectGroup.subject.color}"></div>
            <h3 class="subject-title">${subjectGroup.subject.name}</h3>
            <span class="subject-count">${subjectGroup.recordings.length} video${subjectGroup.recordings.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="subject-description">
            ${subjectGroup.subject.description || 'No description available'}
          </div>
        </div>
        <div class="videos-grid">
          ${subjectGroup.recordings.map((recording, recordingIndex) => createVideoCard(recording, recordingIndex)).join('')}
        </div>
      </div>
    `;
  });
  
  recordingsList.innerHTML = html;
  
  // Add staggered animations
  setTimeout(() => {
    document.querySelectorAll('.subject-group').forEach((group, index) => {
      animateElement(group, 'slide-in-up', index * 200);
    });
  }, 100);
  
  // Initialize video card interactions
  initializeVideoCardInteractions();
}

function createVideoCard(recording, index) {
  const uploadDate = recording.upload_date ? new Date(recording.upload_date).toLocaleDateString() : 'Unknown date';
  const thumbnailUrl = recording.thumbnail_url || `https://img.youtube.com/vi/${recording.youtube_video_id}/maxresdefault.jpg`;
  
  return `
    <div class="video-card" data-video-id="${recording.id}" data-youtube-id="${recording.youtube_video_id}" style="animation-delay: ${index * 100}ms">
      <div class="video-thumbnail-container">
        <img src="${thumbnailUrl}" 
             alt="${recording.title}" 
             class="video-thumbnail"
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMjAgOTBMMTgwIDEzMFY1MEwxMjAgOTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='">
        <div class="video-overlay">
          <div class="play-button" onclick="event.stopPropagation(); openVideoPlayer('${recording.youtube_video_id}', '${recording.title.replace(/'/g, "&apos;")}');">
            <i class="fas fa-play"></i>
          </div>
          ${recording.duration ? `<div class="video-duration">${recording.duration}</div>` : ''}
        </div>
      </div>
      <div class="video-info">
        <h4 class="video-title">${recording.title}</h4>
        <div class="video-meta">
          <span class="upload-date">
            <i class="fas fa-calendar me-1"></i>
            ${uploadDate}
          </span>
          ${recording.view_count ? `
            <span class="view-count">
              <i class="fas fa-eye me-1"></i>
              ${recording.view_count.toLocaleString()} views
            </span>
          ` : ''}
        </div>
        ${recording.description ? `
          <p class="video-description">${recording.description}</p>
        ` : ''}
        <div class="video-actions">
          <button class="btn-watch" onclick="event.stopPropagation(); openVideoPlayer('${recording.youtube_video_id}', '${recording.title.replace(/'/g, "&apos;")}');">
            <i class="fas fa-play me-2"></i>
            Play Video
          </button>
          <a href="${recording.youtube_url}" target="_blank" class="btn-external" onclick="event.stopPropagation();">
            <i class="fab fa-youtube me-2"></i>
            YouTube
          </a>
        </div>
      </div>
    </div>
  `;
}

function initializeVideoCardInteractions() {
  // Video card hover effects
  document.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px)';
      const overlay = card.querySelector('.video-overlay');
      if (overlay) overlay.style.opacity = '1';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      const overlay = card.querySelector('.video-overlay');
      if (overlay) overlay.style.opacity = '0';
    });
    
    // Click to open video
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on play button or action buttons
      if (!e.target.closest('.play-button') && !e.target.closest('.btn-watch') && !e.target.closest('.btn-external')) {
        const youtubeId = card.dataset.youtubeId;
        const title = card.querySelector('.video-title').textContent;
        if (youtubeId) {
          openVideoPlayer(youtubeId, title);
        }
      }
    });
  });
}

function populateSubjectFilter(recordingsData) {
  const filter = document.getElementById('subjectFilter');
  if (!filter) return;
  
  filter.innerHTML = '<option value="">All Subjects</option>';
  
  recordingsData.forEach(subjectGroup => {
    const option = document.createElement('option');
    option.value = subjectGroup.subject.id;
    option.textContent = `${subjectGroup.subject.name} (${subjectGroup.recordings.length})`;
    filter.appendChild(option);
  });
  
  // Add filter functionality
  filter.addEventListener('change', (e) => {
    filterRecordingsBySubject(e.target.value);
  });
}

function filterRecordingsBySubject(subjectId) {
  const subjectGroups = document.querySelectorAll('.subject-group');
  
  subjectGroups.forEach(group => {
    if (!subjectId || group.dataset.subjectId === subjectId) {
      group.style.display = 'block';
      animateElement(group, 'fade-in');
    } else {
      group.style.display = 'none';
    }
  });
}

function getTotalRecordingsCount(recordingsData) {
  return recordingsData.reduce((total, group) => total + group.recordings.length, 0);
}

// Search functionality for recordings
function initializeRecordingsSearch() {
  const searchInput = document.getElementById('recordingsSearch');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    document.querySelectorAll('.video-card').forEach(card => {
      const title = card.querySelector('.video-title').textContent.toLowerCase();
      const description = card.querySelector('.video-description')?.textContent.toLowerCase() || '';
      
      const matches = title.includes(searchTerm) || description.includes(searchTerm);
      
      if (matches || !searchTerm) {
        card.style.display = 'block';
        animateElement(card, 'fade-in');
      } else {
        card.style.display = 'none';
      }
    });
    
    // Hide empty subject groups
    document.querySelectorAll('.subject-group').forEach(group => {
      const visibleCards = group.querySelectorAll('.video-card[style*="block"], .video-card:not([style*="none"])');
      group.style.display = visibleCards.length > 0 || !searchTerm ? 'block' : 'none';
    });
  });
}

// Initialize recordings search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Delay to ensure elements are rendered
  setTimeout(() => {
    initializeRecordingsSearch();
  }, 1000);
});

// Video Player Modal Functions
function openVideoPlayer(youtubeId, title) {
  const modal = createVideoPlayerModal(youtubeId, title);
  document.body.appendChild(modal);
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeVideoPlayer() {
  const modal = document.getElementById('videoPlayerModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 300);
  }
}

function createVideoPlayerModal(youtubeId, title) {
  const modal = document.createElement('div');
  modal.id = 'videoPlayerModal';
  modal.className = 'video-player-modal';
  modal.innerHTML = `
    <div class="video-player-backdrop" onclick="closeVideoPlayer()"></div>
    <div class="video-player-container">
      <div class="video-player-header">
        <h3 class="video-player-title">${title}</h3>
        <button class="video-player-close" onclick="closeVideoPlayer()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="video-player-content">
        <div class="video-responsive">
          <iframe 
            src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>
      </div>
    </div>
  `;
  
  // Close modal on escape key
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVideoPlayer();
    }
  });
  
  return modal;
}