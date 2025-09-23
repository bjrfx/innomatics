class AdminDashboard {
  constructor() {
    this.currentUser = null;
    this.subjects = [];
    this.recordings = [];
    this.currentSection = 'subjects';

    this.init();
  }

  async init() {
    // Check authentication
    await this.checkAuth();
    
    // Initialize event listeners
    this.initEventListeners();
    
    // Load initial data
    await this.loadSubjects();
    await this.loadRecordings();
    await this.updateStats();
    
    // Set today's date as default
    document.getElementById('uploadDate').value = new Date().toISOString().split('T')[0];
  }

  async checkAuth() {
    try {
      const response = await fetch(CONFIG.API.AUTH);
      const data = await response.json();
      
      if (!data.success) {
        window.location.href = 'admin.html';
        return;
      }
      
      this.currentUser = data.data;
      document.getElementById('adminName').textContent = data.data.full_name || data.data.username;
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = 'admin.html';
    }
  }

  initEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.switchSection(section);
      });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

    // Forms
    document.getElementById('subjectForm').addEventListener('submit', (e) => this.handleSubjectSubmit(e));
    document.getElementById('recordingForm').addEventListener('submit', (e) => this.handleRecordingSubmit(e));
    document.getElementById('editSubjectForm').addEventListener('submit', (e) => this.handleEditSubjectSubmit(e));

    // Refresh buttons
    document.getElementById('refreshSubjects').addEventListener('click', () => this.loadSubjects());
    document.getElementById('refreshRecordings').addEventListener('click', () => this.loadRecordings());

    // Filters
    document.getElementById('filterBySubject').addEventListener('change', (e) => this.filterRecordings(e.target.value));

    // Save edited subject
    document.getElementById('saveSubjectBtn').addEventListener('click', () => this.saveEditedSubject());

    // Save edited recording
    document.getElementById('saveRecordingBtn').addEventListener('click', () => this.saveEditedRecording());

    // YouTube URL validation
    document.getElementById('youtubeUrl').addEventListener('blur', (e) => this.validateYouTubeUrl(e.target.value, 'youtubeUrl'));
    document.getElementById('editYoutubeUrl').addEventListener('blur', (e) => this.validateYouTubeUrl(e.target.value, 'editYoutubeUrl'));
  }

  switchSection(section) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.section === section);
    });

    // Show/hide sections
    document.querySelectorAll('.section').forEach(sec => {
      sec.classList.toggle('active', sec.id === section);
    });

    this.currentSection = section;
  }

  // Toast notification system
  showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
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

    toastContainer.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove
    const autoRemove = setTimeout(() => this.removeToast(toast), 4000);

    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoRemove);
      this.removeToast(toast);
    });
  }

  removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  }

  // Subject management
  async loadSubjects() {
    try {
      const response = await fetch(CONFIG.API.SUBJECTS);
      const data = await response.json();
      
      if (data.success) {
        this.subjects = data.data;
        this.renderSubjects();
        this.populateSubjectDropdowns();
      } else {
        this.showToast('Failed to load subjects', 'error');
      }
    } catch (error) {
      console.error('Load subjects error:', error);
      this.showToast('Network error loading subjects', 'error');
    }
  }

  renderSubjects() {
    const grid = document.getElementById('subjectsGrid');
    
    if (this.subjects.length === 0) {
      grid.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
          <p class="text-muted">No subjects created yet. Add your first subject above.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.subjects.map(subject => `
      <div class="data-item">
        <div class="item-header">
          <div>
            <div class="item-title">${subject.name}</div>
            <div class="text-muted small mt-1">${subject.description || 'No description'}</div>
          </div>
          <div class="item-actions">
            <div class="btn-icon" onclick="adminDashboard.editSubject(${subject.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </div>
            <div class="btn-icon danger" onclick="adminDashboard.deleteSubject(${subject.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="subject-color-indicator" style="width: 20px; height: 20px; background: ${subject.color}; border-radius: 4px;"></div>
          <small class="text-muted">Created: ${new Date(subject.created_at).toLocaleDateString()}</small>
        </div>
      </div>
    `).join('');
  }

  populateSubjectDropdowns() {
    const selects = ['recordingSubject', 'filterBySubject', 'editRecordingSubject'];
    
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      const currentValue = select.value;
      
      // Keep existing options for filter
      if (selectId === 'filterBySubject') {
        select.innerHTML = '<option value="">All Subjects</option>';
      } else {
        select.innerHTML = '<option value="">Select Subject</option>';
      }
      
      this.subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        select.appendChild(option);
      });
      
      // Restore previous value if it still exists
      if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
        select.value = currentValue;
      }
    });
  }

  async handleSubjectSubmit(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('subjectName').value.trim(),
      description: document.getElementById('subjectDescription').value.trim(),
      color: document.getElementById('subjectColor').value
    };

    if (!formData.name) {
      this.showToast('Subject name is required', 'error');
      return;
    }

    try {
      const response = await fetch(CONFIG.API.SUBJECTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        this.showToast('Subject created successfully', 'success');
        document.getElementById('subjectForm').reset();
        document.getElementById('subjectColor').value = '#6366f1';
        await this.loadSubjects();
        await this.updateStats();
      } else {
        this.showToast(data.error || 'Failed to create subject', 'error');
      }
    } catch (error) {
      console.error('Create subject error:', error);
      this.showToast('Network error creating subject', 'error');
    }
  }

  editSubject(id) {
    const subject = this.subjects.find(s => s.id == id);
    if (!subject) return;

    document.getElementById('editSubjectId').value = subject.id;
    document.getElementById('editSubjectName').value = subject.name;
    document.getElementById('editSubjectDescription').value = subject.description || '';
    document.getElementById('editSubjectColor').value = subject.color;

    const modal = new bootstrap.Modal(document.getElementById('editSubjectModal'));
    modal.show();
  }

  async saveEditedSubject() {
    const formData = {
      id: document.getElementById('editSubjectId').value,
      name: document.getElementById('editSubjectName').value.trim(),
      description: document.getElementById('editSubjectDescription').value.trim(),
      color: document.getElementById('editSubjectColor').value
    };

    if (!formData.name) {
      this.showToast('Subject name is required', 'error');
      return;
    }

    try {
      const response = await fetch(CONFIG.API.SUBJECTS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        this.showToast('Subject updated successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editSubjectModal'));
        modal.hide();
        
        await this.loadSubjects();
      } else {
        this.showToast(data.error || 'Failed to update subject', 'error');
      }
    } catch (error) {
      console.error('Update subject error:', error);
      this.showToast('Network error updating subject', 'error');
    }
  }

  async deleteSubject(id) {
    if (!confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(CONFIG.API.SUBJECTS, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showToast('Subject deleted successfully', 'success');
        await this.loadSubjects();
        await this.loadRecordings();
        await this.updateStats();
      } else {
        this.showToast(data.error || 'Failed to delete subject', 'error');
      }
    } catch (error) {
      console.error('Delete subject error:', error);
      this.showToast('Network error deleting subject', 'error');
    }
  }

  // Recording management
  async loadRecordings() {
    try {
      const response = await fetch(CONFIG.API.RECORDINGS);
      const data = await response.json();
      
      if (data.success) {
        this.recordings = data.data;
        this.renderRecordings();
      } else {
        this.showToast('Failed to load recordings', 'error');
      }
    } catch (error) {
      console.error('Load recordings error:', error);
      this.showToast('Network error loading recordings', 'error');
    }
  }

  renderRecordings(filteredData = null) {
    const grid = document.getElementById('recordingsGrid');
    const dataToRender = filteredData || this.recordings;
    
    if (dataToRender.length === 0) {
      grid.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-video-slash fa-3x text-muted mb-3"></i>
          <p class="text-muted">No recordings found. Add your first recording above.</p>
        </div>
      `;
      return;
    }

    let html = '';
    dataToRender.forEach(subjectGroup => {
      html += `
        <div class="mb-4">
          <h5 class="mb-3 d-flex align-items-center">
            <div class="subject-color-indicator me-2" style="width: 20px; height: 20px; background: ${subjectGroup.subject.color}; border-radius: 4px;"></div>
            ${subjectGroup.subject.name}
            <span class="badge bg-secondary ms-2">${subjectGroup.recordings.length} videos</span>
          </h5>
          <div class="row g-3">
            ${subjectGroup.recordings.map(recording => `
              <div class="col-12">
                <div class="data-item">
                  <div class="video-preview">
                    <img src="${recording.thumbnail_url}" alt="Video thumbnail" class="video-thumbnail" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjY4IiB2aWV3Qm94PSIwIDAgMTIwIDY4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjY4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik00OCAzNEw3MiA0OVYxOUw0OCAzNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'">
                    <div class="video-info">
                      <div class="video-title">${recording.title}</div>
                      <div class="video-meta">
                        ${recording.duration ? `Duration: ${recording.duration} • ` : ''}
                        Uploaded: ${recording.upload_date ? new Date(recording.upload_date).toLocaleDateString() : 'Unknown'}
                        ${recording.view_count ? ` • Views: ${recording.view_count}` : ''}
                      </div>
                      ${recording.description ? `<div class="text-muted small mt-1">${recording.description}</div>` : ''}
                    </div>
                    <div class="item-actions">
                      <div class="btn-icon" onclick="openVideoPlayer('${recording.youtube_video_id}', '${recording.title.replace(/'/g, "&apos;")}')" title="Play Video">
                        <i class="fas fa-play"></i>
                      </div>
                      <a href="${recording.youtube_url}" target="_blank" class="btn-icon" title="Watch on YouTube">
                        <i class="fab fa-youtube"></i>
                      </a>
                      <div class="btn-icon" onclick="adminDashboard.editRecording(${recording.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                      </div>
                      <div class="btn-icon danger" onclick="adminDashboard.deleteRecording(${recording.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  filterRecordings(subjectId) {
    if (!subjectId) {
      this.renderRecordings();
      return;
    }

    const filtered = this.recordings.filter(group => group.subject.id == subjectId);
    this.renderRecordings(filtered);
  }

  validateYouTubeUrl(url, inputId = 'youtubeUrl') {
    if (!url) return true;
    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&\S*)?$/;
    const isValid = youtubeRegex.test(url);
    
    const input = document.getElementById(inputId);
    if (!isValid) {
      input.classList.add('is-invalid');
      this.showToast('Please enter a valid YouTube URL', 'error');
      return false;
    } else {
      input.classList.remove('is-invalid');
      return true;
    }
  }

  async handleRecordingSubmit(e) {
    e.preventDefault();
    
    const formData = {
      subject_id: document.getElementById('recordingSubject').value,
      title: document.getElementById('recordingTitle').value.trim(),
      youtube_url: document.getElementById('youtubeUrl').value.trim(),
      description: document.getElementById('recordingDescription').value.trim(),
      duration: document.getElementById('recordingDuration').value.trim(),
      upload_date: document.getElementById('uploadDate').value
    };

    // Validation
    if (!formData.subject_id) {
      this.showToast('Please select a subject', 'error');
      return;
    }

    if (!formData.title) {
      this.showToast('Video title is required', 'error');
      return;
    }

    if (!formData.youtube_url) {
      this.showToast('YouTube URL is required', 'error');
      return;
    }

    if (!this.validateYouTubeUrl(formData.youtube_url, 'youtubeUrl')) {
      return;
    }

    try {
      const response = await fetch(CONFIG.API.RECORDINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        this.showToast('Recording added successfully', 'success');
        document.getElementById('recordingForm').reset();
        document.getElementById('uploadDate').value = new Date().toISOString().split('T')[0];
        await this.loadRecordings();
        await this.updateStats();
      } else {
        this.showToast(data.error || 'Failed to add recording', 'error');
      }
    } catch (error) {
      console.error('Create recording error:', error);
      this.showToast('Network error creating recording', 'error');
    }
  }

  async deleteRecording(id) {
    if (!confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      const response = await fetch(CONFIG.API.RECORDINGS, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showToast('Recording deleted successfully', 'success');
        await this.loadRecordings();
        await this.updateStats();
      } else {
        this.showToast(data.error || 'Failed to delete recording', 'error');
      }
    } catch (error) {
      console.error('Delete recording error:', error);
      this.showToast('Network error deleting recording', 'error');
    }
  }

  editRecording(id) {
    // Find the recording across all subject groups
    let recording = null;
    let subjectId = null;
    
    for (const group of this.recordings) {
      const found = group.recordings.find(r => r.id == id);
      if (found) {
        recording = found;
        subjectId = group.subject.id;
        break;
      }
    }
    
    if (!recording) return;

    // Populate the edit form
    document.getElementById('editRecordingId').value = recording.id;
    document.getElementById('editRecordingSubject').value = subjectId;
    document.getElementById('editRecordingTitle').value = recording.title;
    document.getElementById('editYoutubeUrl').value = recording.youtube_url;
    document.getElementById('editRecordingDescription').value = recording.description || '';
    document.getElementById('editRecordingDuration').value = recording.duration || '';
    
    // Format date for input
    if (recording.upload_date) {
      const date = new Date(recording.upload_date);
      const formattedDate = date.toISOString().split('T')[0];
      document.getElementById('editUploadDate').value = formattedDate;
    } else {
      document.getElementById('editUploadDate').value = '';
    }

    const modal = new bootstrap.Modal(document.getElementById('editRecordingModal'));
    modal.show();
  }

  async saveEditedRecording() {
    const formData = {
      id: document.getElementById('editRecordingId').value,
      subject_id: document.getElementById('editRecordingSubject').value,
      title: document.getElementById('editRecordingTitle').value.trim(),
      youtube_url: document.getElementById('editYoutubeUrl').value.trim(),
      description: document.getElementById('editRecordingDescription').value.trim(),
      duration: document.getElementById('editRecordingDuration').value.trim(),
      upload_date: document.getElementById('editUploadDate').value
    };

    // Validation
    if (!formData.subject_id) {
      this.showToast('Please select a subject', 'error');
      return;
    }

    if (!formData.title) {
      this.showToast('Video title is required', 'error');
      return;
    }

    if (!formData.youtube_url) {
      this.showToast('YouTube URL is required', 'error');
      return;
    }

    if (!this.validateYouTubeUrl(formData.youtube_url, 'editYoutubeUrl')) {
      return;
    }

    try {
      const response = await fetch(CONFIG.API.RECORDINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        this.showToast('Recording updated successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editRecordingModal'));
        modal.hide();
        
        await this.loadRecordings();
        await this.updateStats();
      } else {
        this.showToast(data.error || 'Failed to update recording', 'error');
      }
    } catch (error) {
      console.error('Update recording error:', error);
      this.showToast('Network error updating recording', 'error');
    }
  }

  // Statistics
  async updateStats() {
    const totalSubjects = this.subjects.length;
    const totalRecordings = this.recordings.reduce((total, group) => total + group.recordings.length, 0);
    const totalViews = this.recordings.reduce((total, group) => 
      total + group.recordings.reduce((groupTotal, recording) => groupTotal + (recording.view_count || 0), 0), 0
    );

    document.getElementById('totalSubjects').textContent = totalSubjects;
    document.getElementById('totalRecordings').textContent = totalRecordings;
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
  }

  // Logout
  async logout() {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }

    try {
      await fetch(CONFIG.API.AUTH, { method: 'DELETE' });
      window.location.href = 'admin.html';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if request fails
      window.location.href = 'admin.html';
    }
  }
}

// Initialize admin dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
  adminDashboard = new AdminDashboard();
});

// Video Player Modal Functions for Admin Dashboard
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