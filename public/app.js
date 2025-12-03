// app.js - COMPLETE FILE WITH ALL FUNCTIONS

const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : window.location.origin; // ✅ Auto-detect production URL
  
let currentUser = null;
let authToken = null;
let socket = null;
let currentConversation = null;
let isCheckingAuth = false;
let backendAvailable = false;

// ===========================
// UTILITY FUNCTIONS
// ===========================
function logDebug(message) {
  const debugInfo = document.getElementById('debugInfo');
  if (debugInfo) {
    debugInfo.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
    debugInfo.scrollTop = debugInfo.scrollHeight;
  }
  console.log(message);
}

function updateConnectionStatus(connected) {
  const statusElement = document.getElementById('connectionStatus');
  if (statusElement) {
    backendAvailable = connected;
    statusElement.textContent = `Backend: ${connected ? 'Connected' : 'Disconnected'}`;
    statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
  }
}

async function checkBackendConnection() {
  logDebug('Checking backend...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/health`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      logDebug('Backend OK: ' + data.status);
      updateConnectionStatus(true);
      showAlert('Backend connected', 'success');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    logDebug('Backend error: ' + error.message);
    updateConnectionStatus(false);
    showAlert('Backend unreachable. Check server.', 'error');
  }
}

function clearStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('authRedirecting');
  logDebug('Storage cleared');
  showAlert('Storage cleared', 'success');
}

async function testAuthEndpoint() {
  const token = localStorage.getItem('token');
  if (!token) return showAlert('No token', 'warning');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const user = await response.json();
      logDebug('Auth valid: ' + user.name);
      showAlert('Auth passed', 'success');
    } else {
      throw new Error(`Status: ${response.status}`);
    }
  } catch (error) {
    logDebug('Auth failed: ' + error.message);
    showAlert('Auth failed', 'error');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

async function checkIfAlreadyLoggedIn() {
  if (isCheckingAuth) return;
  isCheckingAuth = true;

  if (sessionStorage.getItem('authRedirecting') === 'true') {
    logDebug('Redirect in progress');
    isCheckingAuth = false;
    return;
  }

  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (token && userData) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Invalid token: ${response.status}`);

      const user = await response.json();
      logDebug(`Logged in as ${user.role}`);

      sessionStorage.setItem('authRedirecting', 'true');
      window.location.href = user.role === 'admin' ? './admin.html' : './index.html';
    } catch (e) {
      logDebug('Token invalid: ' + e.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authRedirecting');
    }
  } else {
    logDebug('No token found');
  }

  isCheckingAuth = false;
}

function showAlert(message, type = 'success', duration = 5000) {
  const alert = document.createElement('div');
  alert.className = `custom-alert ${type}`;
  alert.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
    <span>${message}</span>
    <span class="close-btn">×</span>
  `;

  document.body.appendChild(alert);

  alert.querySelector('.close-btn').onclick = () => {
    alert.classList.add('hide');
    setTimeout(() => alert.remove(), 300);
  };

  if (duration > 0) {
    setTimeout(() => {
      alert.classList.add('hide');
      setTimeout(() => alert.remove(), 300);
    }, duration);
  }

  logDebug(`Alert [${type}]: ${message}`);
}

// ===========================
// AUTHENTICATION FUNCTIONS
// ===========================
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token');

  const response = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw new Error('Invalid token');
  }

  const user = await response.json();
  authToken = token;
  currentUser = user;
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

function updateAuthUI() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const authBtn = document.getElementById('authBtn');

  if (authBtn) {
    if (user.name) {
      authBtn.innerHTML = `<i class="fas fa-user"></i> ${user.name}`;
      authBtn.href = '#';
      authBtn.onclick = (e) => {
        e.preventDefault();
        if (confirm('Do you want to logout?')) {
          logout();
        }
      };
    } else {
      authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      authBtn.href = 'login.html';
      authBtn.onclick = null;
    }
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('authRedirecting');
  showAlert('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 1000);
}

// ===========================
// PAGE INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  const registerBtn = document.getElementById('register');
  const loginBtn = document.getElementById('login');
  const debugToggle = document.getElementById('debugToggle');
  const debugPanel = document.getElementById('debugPanel');

  if (registerBtn) {
    registerBtn.addEventListener('click', () => container?.classList.add('active'));
  }
  
  if (loginBtn) {
    loginBtn.addEventListener('click', () => container?.classList.remove('active'));
  }
  
  if (debugToggle && debugPanel) {
    debugToggle.addEventListener('click', () => {
      debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Fix input error hiding
  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      const form = input.closest("form");
      const error = form?.querySelector(".error-message");
      if (error) error.style.display = "none";
    });
  });

  // Initialize different pages
  if (document.getElementById('loginForm') || document.getElementById('signupForm')) {
    initAuthPage();
  }

  if (document.getElementById('repairForm')) {
    initUserPage();
  }

  if (document.querySelector('.admin-container')) {
    initAdminPage();
  }

  if (document.body.contains(document.getElementById('repairForm')) || 
      document.body.contains(document.querySelector('.navbar'))) {
    initIndexPage();
  }

  // Run on every page
  checkBackendConnection();
});

// ===========================
// AUTH PAGE INITIALIZATION
// ===========================
function initAuthPage() {
  checkIfAlreadyLoggedIn();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const errorElement = document.getElementById('loginError');

      if (!email || !password) {
        if (errorElement) {
          errorElement.textContent = 'Please fill in all fields';
          errorElement.style.display = 'block';
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('btn-loading');
      document.getElementById('loadingOverlay')?.classList.add('active');
      logDebug(`Login attempt: ${email}`);

      try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        logDebug('Login success: ' + data.user.name);

        showAlert('Welcome back, ' + data.user.name + '!', 'success');
        sessionStorage.setItem('authRedirecting', 'true');

        setTimeout(() => {
          window.location.href = data.user.role === 'admin' ? './admin.html' : './index.html';
        }, 1500);
      } catch (error) {
        if (errorElement) {
          errorElement.textContent = error.message;
          errorElement.style.display = 'block';
        }
        loginForm.classList.add('shake');
        setTimeout(() => loginForm.classList.remove('shake'), 500);
        showAlert(error.message, 'error');
        logDebug('Login error: ' + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading');
        document.getElementById('loadingOverlay')?.classList.remove('active');
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('signupName')?.value.trim();
      const email = document.getElementById('signupEmail')?.value.trim();
      const password = document.getElementById('signupPassword')?.value;
      const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const errorElement = document.getElementById('signupError');

      if (!name || !email || !password || !confirmPassword) {
        if (errorElement) {
          errorElement.textContent = 'Please fill in all fields';
          errorElement.style.display = 'block';
        }
        return;
      }

      if (password !== confirmPassword) {
        if (errorElement) {
          errorElement.textContent = "Passwords don't match";
          errorElement.style.display = "block";
        }
        signupForm.classList.add('shake');
        setTimeout(() => signupForm.classList.remove('shake'), 500);
        return;
      }

      if (password.length < 6) {
        if (errorElement) {
          errorElement.textContent = "Password must be at least 6 characters";
          errorElement.style.display = "block";
        }
        signupForm.classList.add('shake');
        setTimeout(() => signupForm.classList.remove('shake'), 500);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('btn-loading');
      document.getElementById('loadingOverlay')?.classList.add('active');
      logDebug(`Signup attempt: ${email}`);

      try {
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Signup failed');

        showAlert('Account created successfully! Please login.', 'success');
        logDebug('Signup success: ' + name);
        
        document.getElementById('container')?.classList.remove("active");
        
        if (document.getElementById("loginEmail")) {
          document.getElementById("loginEmail").value = email;
        }
        if (document.getElementById("loginPassword")) {
          document.getElementById("loginPassword").value = password;
        }
        
      } catch (error) {
        if (errorElement) {
          errorElement.textContent = error.message;
          errorElement.style.display = "block";
        }
        signupForm.classList.add('shake');
        setTimeout(() => signupForm.classList.remove('shake'), 500);
        showAlert(error.message, 'error');
        logDebug('Signup error: ' + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading');
        document.getElementById('loadingOverlay')?.classList.remove('active');
      }
    });
  }

  // FORGOT PASSWORD
  const forgotLink = document.getElementById('forgotLink');
  const forgotModal = document.getElementById('forgotModal');
  const closeForgot = document.getElementById('closeForgot');
  const sendResetBtn = document.getElementById('sendResetBtn');
  const resetEmail = document.getElementById('resetEmail');
  const resetError = document.getElementById('resetError');

  forgotLink?.addEventListener('click', e => {
    e.preventDefault();
    forgotModal?.classList.add('active');
    if (resetEmail) resetEmail.value = '';
    if (resetError) resetError.style.display = 'none';
  });

  closeForgot?.addEventListener('click', () => {
    forgotModal?.classList.remove('active');
  });

  forgotModal?.addEventListener('click', e => {
    if (e.target === forgotModal) {
      forgotModal.classList.remove('active');
    }
  });

  sendResetBtn?.addEventListener('click', async () => {
    const email = resetEmail?.value.trim();
    
    if (!email) {
      if (resetError) {
        resetError.textContent = 'Email is required';
        resetError.style.display = 'block';
      }
      return;
    }

    sendResetBtn.disabled = true;
    sendResetBtn.classList.add('btn-loading');
    document.getElementById('loadingOverlay')?.classList.add('active');

    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showAlert('Password reset link sent! Check your email.', 'success');
      forgotModal?.classList.remove('active');
      logDebug('Password reset sent to: ' + email);
    } catch (err) {
      if (resetError) {
        resetError.textContent = err.message;
        resetError.style.display = 'block';
      }
      logDebug('Password reset error: ' + err.message);
    } finally {
      sendResetBtn.disabled = false;
      sendResetBtn.classList.remove('btn-loading');
      document.getElementById('loadingOverlay')?.classList.remove('active');
    }
  });
}

// ===========================
// USER PAGE INITIALIZATION
// ===========================
function initUserPage() {
  checkAuth().then(user => {
    currentUser = user;
    updateAuthUI();
    
    if (user.role === 'admin') {
      window.location.href = './admin.html';
      return;
    }
    
    initRepairForm();
    initTrainingForms();
    loadUserRepairs();
  }).catch(err => {
    console.error('Auth check failed:', err);
    window.location.href = '/login.html';
  });
}

// ===========================
// ADMIN PAGE INITIALIZATION
// ===========================
function initAdminPage() {
  checkAuth().then(user => {
    if (user.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      window.location.href = '/index.html';
      return;
    }
    
    currentUser = user;
    updateAuthUI();
    console.log('Admin panel initialized for:', user.name);
  }).catch(err => {
    console.error('Auth check failed:', err);
    window.location.href = '/login.html';
  });
}

// ===========================
// INDEX PAGE UI
// ===========================
function initIndexPage() {
  // Update auth UI
  updateAuthUI();

  // Intersection Observer for animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.service-card, .course-card, .contact-card, .about-card, .section-title').forEach(el => {
    observer.observe(el);
  });

  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Form control filled state
  document.querySelectorAll('.form-control').forEach(control => {
    control.addEventListener('input', () => {
      control.classList.toggle('filled', !!control.value);
    });
  });

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Close mobile menu if open
        navLinks?.classList.remove('mobile-open');
      }
    });
  });

  // Navbar background on scroll
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.background = window.scrollY > 50 
        ? 'rgba(5, 1, 58, 0.95)' 
        : 'rgba(5, 1, 58, 0.8)';
    }
  });

  // Initialize forms if user is logged in
  if (localStorage.getItem('token')) {
    initRepairForm();
    initTrainingForms();
    loadUserRepairs();
  }
}

// ===========================
// REPAIR FORM
// ===========================
function initRepairForm() {
  const form = document.getElementById('repairForm');
  const photosInput = document.getElementById('photos');
  const photoPreview = document.getElementById('photo-preview');

  if (!form) return;

  photosInput?.addEventListener('change', (e) => {
    if (!photoPreview) return;
    
    photoPreview.innerHTML = '';
    const files = Array.from(e.target.files).slice(0, 3);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.style.maxWidth = '100px';
        img.style.maxHeight = '100px';
        img.style.margin = '5px';
        img.style.borderRadius = '8px';
        img.style.objectFit = 'cover';
        photoPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('Please login to submit a repair request', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return;
    }

    const formData = new FormData();
    formData.append('deviceType', document.getElementById('device-type')?.value || '');
    formData.append('brand', document.getElementById('brand')?.value || '');
    formData.append('model', document.getElementById('model')?.value || '');
    formData.append('issue', document.getElementById('issue')?.value || '');
    
    if (photosInput?.files) {
      Array.from(photosInput.files).slice(0, 3).forEach(file => {
        formData.append('photos', file);
      });
    }

    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = 'flex';

    try {
      const res = await fetch(`${BASE_URL}/api/repairs`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      const successEl = document.getElementById('repairSuccess');
      const repairIdEl = document.getElementById('repairIdDisplay');
      
      if (successEl) successEl.style.display = 'block';
      if (repairIdEl) repairIdEl.textContent = data.repairId || data._id || 'N/A';
      
      form.reset();
      if (photoPreview) photoPreview.innerHTML = '';
      
      showAlert('Repair request submitted successfully!', 'success');
      logDebug('Repair submitted: ' + (data._id || data.repairId));
      
      // Reload user repairs
      loadUserRepairs();
      
      // Scroll to success message
      successEl?.scrollIntoView({ behavior: 'smooth' });
      
    } catch (err) {
      console.error('Repair submission error:', err);
      showAlert(err.message, 'error');
      logDebug('Repair error: ' + err.message);
    } finally {
      if (loading) loading.style.display = 'none';
    }
  });
}

// ===========================
// TRAINING FORMS
// ===========================
function initTrainingForms() {
  const enrollBtns = document.querySelectorAll('.enroll-btn');
  const formContainer = document.getElementById('enrollmentForm');
  const form = document.getElementById('trainingForm');
  const cancelBtn = document.querySelector('.cancel-enroll');

  enrollBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Please login to enroll in courses', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        return;
      }

      const courseInfo = btn.closest('.course-info');
      const courseName = courseInfo?.querySelector('h3')?.textContent || '';
      
      const courseNameInput = document.getElementById('course-name');
      if (courseNameInput) {
        courseNameInput.value = courseName;
      }
      
      if (formContainer) {
        formContainer.classList.remove('hidden');
        formContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  cancelBtn?.addEventListener('click', () => {
    formContainer?.classList.add('hidden');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('Please login to enroll', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return;
    }

    const payload = {
      course: document.getElementById('course-name')?.value || '',
      fullName: document.getElementById('full-name')?.value || '',
      email: document.getElementById('email')?.value || '',
      phone: document.getElementById('phone')?.value || '',
      educationLevel: document.getElementById('education')?.value || ''
    };

    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = 'flex';

    try {
      const res = await fetch(`${BASE_URL}/api/training/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Enrollment failed');

      const successEl = document.getElementById('enrollmentSuccess');
      const enrollIdEl = document.getElementById('enrollmentId');
      
      if (successEl) successEl.classList.remove('hidden');
      if (enrollIdEl) enrollIdEl.textContent = data.enrollmentId || data._id || 'N/A';
      
      form.reset();
      formContainer?.classList.add('hidden');
      
      showAlert('Successfully enrolled in course!', 'success');
      logDebug('Enrolled in: ' + payload.course);
      
      // Scroll to success message
      successEl?.scrollIntoView({ behavior: 'smooth' });
      
    } catch (err) {
      console.error('Enrollment error:', err);
      showAlert(err.message, 'error');
      logDebug('Enrollment error: ' + err.message);
    } finally {
      if (loading) loading.style.display = 'none';
    }
  });
}

// ===========================
// LOAD USER REPAIRS - FIXED
// ===========================
async function loadUserRepairs() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token, skipping user repairs');
    return;
  }

  const list = document.getElementById('myRepairsList');
  if (!list) return;

  list.innerHTML = '<p style="text-align:center;color:#999;">Loading your repairs...</p>';

  try {
    console.log('📡 Fetching user repairs...');
    
    // ✅ CORRECT ENDPOINT
    const res = await fetch(`${BASE_URL}/api/repairs/my-repairs`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.log('Token expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    
    // Handle both array and wrapped response
    const repairs = Array.isArray(data) ? data : (data.data || []);
    
    console.log(`✅ Loaded ${repairs.length} repairs`);

    if (!repairs.length) {
      list.innerHTML = `
        <div class="no-repairs" style="text-align:center;padding:2rem;grid-column:1/-1;">
          <i class="fas fa-search" style="font-size:3rem;color:#ccc;margin-bottom:1rem;display:block;"></i>
          <p style="color:#999;">No repair history yet. Submit your first repair request above!</p>
        </div>
      `;
      return;
    }

    // ✅ Show the repairs section
    const section = document.getElementById('myRepairs');
    if (section) section.classList.remove('hidden');

    // ✅ Render repairs
    list.innerHTML = repairs.map(r => {
      const statusColor = {
        'pending': '#ff9800',
        'in-progress': '#2da0a8',
        'completed': '#4caf50',
        'cancelled': '#f44336'
      };

      return `
        <div class="repair-card">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h4 style="margin:0;">${r.deviceType || 'Unknown Device'}</h4>
            <span class="status-badge status-${r.status || 'pending'}" style="
              background: ${statusColor[r.status] || '#999'};
              color: white;
              padding: 0.35rem 0.75rem;
              border-radius: 4px;
              font-size: 0.8rem;
              font-weight: 600;
              text-transform: capitalize;
            ">${r.status || 'pending'}</span>
          </div>
          
          <p style="margin: 0.5rem 0; color: #666;">
            <strong>Brand:</strong> ${r.brand || 'N/A'}
          </p>
          
          <p style="margin: 0.5rem 0; color: #666;">
            <strong>Model:</strong> ${r.model || 'N/A'}
          </p>
          
          <p style="margin: 0.5rem 0; color: #666;">
            <strong>Issue:</strong> ${r.issue || 'No description'}
          </p>
          
          <p style="margin: 0.5rem 0; color: #999; font-size: 0.9rem;">
            <strong>Submitted:</strong> ${new Date(r.createdAt).toLocaleString()}
          </p>
          
          ${r.updatedAt && new Date(r.updatedAt).getTime() !== new Date(r.createdAt).getTime() ? `
            <p style="margin: 0.5rem 0; color: #999; font-size: 0.9rem;">
              <strong>Updated:</strong> ${new Date(r.updatedAt).toLocaleString()}
            </p>
          ` : ''}
          
          ${r.photos && r.photos.length ? `
            <p style="margin: 0.5rem 0; color: #666;">
              <strong>📸 Photos:</strong> ${r.photos.length} attached
            </p>
          ` : ''}
          
          ${r.amount ? `
            <p style="margin: 0.5rem 0; color: #2da0a8; font-weight: 600;">
              💰 Amount: MWK ${r.amount.toLocaleString()}
            </p>
          ` : ''}
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('❌ loadUserRepairs error:', err);
    list.innerHTML = '<p style="text-align:center;color:#f44336;grid-column:1/-1;">Failed to load repair history</p>';
    logDebug('Load repairs error: ' + err.message);
  }
}
// ===========================
// WEBSOCKET (PLACEHOLDER)
// ===========================
function connectWebSocket() {
  console.log('WebSocket connection – implement later');
  // TODO: Implement real-time updates
}