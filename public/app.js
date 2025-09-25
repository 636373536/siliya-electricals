// app.js - Consolidated and cleaned JavaScript for all pages

const BASE_URL = 'http://localhost:5000';
let currentUser = null;
let authToken = null;
let socket = null;
let currentConversation = null;
let isCheckingAuth = false;
let backendAvailable = false;

// Utility Functions
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

function clearStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('authRedirecting');
  logDebug('Storage cleared');
  showAlert('Storage cleared successfully', 'success');
}

async function checkBackendConnection() {
  logDebug('Checking backend connection...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/health`);
    if (response.ok) {
      logDebug('Backend is available');
      updateConnectionStatus(true);
      showAlert('Backend connected', 'success');
    } else {
      logDebug(`Backend status: ${response.status}`);
      updateConnectionStatus(false);
      showAlert('Backend failed', 'error');
    }
  } catch (error) {
    logDebug('Backend error: ' + error.message);
    updateConnectionStatus(false);
    showAlert('Backend connection failed: ' + error.message, 'error');
  }
}

async function testAuthEndpoint() {
  const token = localStorage.getItem('token');
  if (!token) {
    logDebug('No token found');
    showAlert('No token', 'warning');
    return;
  }

  logDebug('Testing auth endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const userData = await response.json();
      logDebug('Auth test successful: ' + JSON.stringify(userData));
      showAlert('Auth test successful', 'success');
    } else {
      logDebug(`Auth failed with status: ${response.status}`);
      showAlert(`Auth failed: ${response.status}`, 'error');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      logDebug('Cleared invalid token');
    }
  } catch (error) {
    logDebug('Auth test error: ' + error.message);
    showAlert('Auth test failed: ' + error.message, 'error');
  }
}

async function checkIfAlreadyLoggedIn() {
  if (isCheckingAuth) return;
  isCheckingAuth = true;

  if (sessionStorage.getItem('authRedirecting') === 'true') {
    logDebug('Redirect in progress, skipping check');
    isCheckingAuth = false;
    return;
  }

  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (token && userData) {
    try {
      logDebug('Validating token...');
      const response = await fetch(`${BASE_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Invalid token: ${response.status}`);
      }

      const user = await response.json();
      logDebug(`Token valid, role: ${user.role}`);

      sessionStorage.setItem('authRedirecting', 'true');

      if (user.role === 'admin') {
        logDebug('Redirecting to admin');
        window.location.href = './admin.html';
      } else {
        logDebug('Redirecting to index');
        window.location.href = './index.html';
      }
    } catch (e) {
      logDebug('Auth failed: ' + e.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authRedirecting');
    }
  } else {
    logDebug('No auth token');
  }

  isCheckingAuth = false;
}

function showAlert(message, type = 'success', duration = 5000) {
  const alert = document.createElement('div');
  alert.className = `custom-alert ${type}`;
  alert.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
    <span class="close-btn">&times;</span>
  `;

  document.body.appendChild(alert);

  alert.querySelector('.close-btn').addEventListener('click', () => {
    alert.classList.add('hide');
    setTimeout(() => alert.remove(), 300);
  });

  if (duration > 0) {
    setTimeout(() => {
      alert.classList.add('hide');
      setTimeout(() => alert.remove(), 300);
    }, duration);
  }

  logDebug(`Alert: ${type} - ${message}`);
}

// Authentication Functions
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  try {
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
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
}

function updateAuthUI() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const authBtn = document.getElementById('authBtn');

  if (authBtn) {
    if (user.name) {
      authBtn.textContent = user.name;
      authBtn.href = '#'; // Or profile page
    } else {
      authBtn.textContent = 'Login';
      authBtn.href = 'login.html';
    }
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('authRedirecting');
  window.location.href = '/login.html';
}

// Page Initialization
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const container = document.getElementById('container');
  const registerBtn = document.getElementById('register');
  const loginBtn = document.getElementById('login');
  const debugToggle = document.getElementById('debugToggle');
  const debugPanel = document.getElementById('debugPanel');

  // Shared event listeners
  if (registerBtn) registerBtn.addEventListener('click', () => container.classList.add('active'));
  if (loginBtn) loginBtn.addEventListener('click', () => container.classList.remove('active'));
  if (debugToggle) debugToggle.addEventListener('click', () => debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none');

  // Clear errors on input
  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      const form = input.closest("form");
      const error = form.querySelector(".error-message");
      if (error) error.style.display = "none";
    });
  });

  // Login page specific
  if (loginForm || signupForm) {
    initAuthPage();
  }

  // User page specific
  if (document.getElementById('repairForm')) {
    initUserPage();
  }

  // Admin page specific
  if (document.querySelector('.admin-container')) {
    initAdminPage();
  }

  // Index page specific (moved from inline script)
  if (document.getElementById('repairForm')) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.style.animationPlayState = 'running';
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.service-card, .course-card, .contact-card, .about-card, .section-title').forEach(el => observer.observe(el));

    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle) mobileToggle.addEventListener('click', () => navLinks.classList.toggle('mobile-open'));

    document.querySelectorAll('.form-control').forEach(control => {
      control.addEventListener('input', () => control.classList.toggle('filled', !!control.value));
    });

    const photosInput = document.getElementById('photos');
    const photoPreview = document.getElementById('photo-preview');
    if (photosInput) photosInput.addEventListener('change', e => {
      photoPreview.innerHTML = '';
      Array.from(e.target.files).slice(0, 3).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          const img = document.createElement('img');
          img.src = ev.target.result;
          photoPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });

    const repairForm = document.getElementById('repairForm');
    if (repairForm) repairForm.addEventListener('submit', e => {
      e.preventDefault();
      const loadingOverlay = document.getElementById('loadingOverlay');
      loadingOverlay.style.display = 'flex';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
        document.getElementById('repairSuccess').style.display = 'block';
        document.getElementById('repairIdDisplay').textContent = 'REP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        repairForm.reset();
      }, 2000);
    });

    document.querySelectorAll('.enroll-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const courseName = btn.closest('.course-info').querySelector('h3').textContent;
        document.getElementById('course-name').value = courseName;
        document.getElementById('enrollmentForm').classList.remove('hidden');
      });
    });

    const cancelEnroll = document.querySelector('.cancel-enroll');
    if (cancelEnroll) cancelEnroll.addEventListener('click', () => document.getElementById('enrollmentForm').classList.add('hidden'));

    const trainingForm = document.getElementById('trainingForm');
    if (trainingForm) trainingForm.addEventListener('submit', e => {
      e.preventDefault();
      const loadingOverlay = document.getElementById('loadingOverlay');
      loadingOverlay.style.display = 'flex';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
        document.getElementById('enrollmentSuccess').classList.remove('hidden');
        document.getElementById('enrollmentId').textContent = 'ENR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        trainingForm.reset();
      }, 2000);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) navbar.style.background = window.scrollY > 50 ? 'rgba(5, 1, 58, 0.95)' : 'rgba(5, 1, 58, 0.8)';
    });
  }
});

// Initialize Login Page
function initAuthPage() {
  checkIfAlreadyLoggedIn();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button');
    const errorElement = document.getElementById('loginError');

    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    document.getElementById('loadingOverlay').classList.add('active');
    logDebug(`Login attempt: ${email}`);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      logDebug('Login response received');

      if (!response.ok) throw new Error(data.message || 'Login failed');
      if (!data.user || !data.user.role) throw new Error('User role missing');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      logDebug('Auth data stored');

      showAlert('Login successful! Redirecting...', 'success');
      sessionStorage.setItem('authRedirecting', 'true');

      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? './admin.html' : './index.html';
      }, 1500);
    } catch (error) {
      logDebug('Login error: ' + error.message);
      errorElement.textContent = error.message;
      errorElement.style.display = 'block';
      loginForm.classList.add('shake');
      setTimeout(() => loginForm.classList.remove('shake'), 500);
      showAlert(error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('btn-loading');
      document.getElementById('loadingOverlay').classList.remove('active');
    }
  });

  const signupForm = document.getElementById('signupForm');
  if (signupForm) signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const submitBtn = e.target.querySelector('button');
    const errorElement = document.getElementById('signupError');

    if (password !== confirmPassword) {
      errorElement.textContent = "Passwords don't match";
      errorElement.style.display = "block";
      signupForm.classList.add('shake');
      setTimeout(() => signupForm.classList.remove('shake'), 500);
      return;
    }

    if (password.length < 6) {
      errorElement.textContent = "Password must be at least 6 characters";
      errorElement.style.display = "block";
      signupForm.classList.add('shake');
      setTimeout(() => signupForm.classList.remove('shake'), 500);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    document.getElementById('loadingOverlay').classList.add('active');
    logDebug(`Signup attempt: ${email}`);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      logDebug('Signup response received');

      if (!response.ok) throw new Error(data.message || 'Signup failed');

      showAlert('Account created! Please login.', 'success');
      container.classList.remove("active");
      document.getElementById("loginEmail").value = email;
      document.getElementById("loginPassword").value = password;
      logDebug('Signup completed');
    } catch (error) {
      logDebug('Signup error: ' + error.message);
      errorElement.textContent = error.message;
      errorElement.style.display = 'block';
      signupForm.classList.add('shake');
      setTimeout(() => signupForm.classList.remove('shake'), 500);
      showAlert(error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('btn-loading');
      document.getElementById('loadingOverlay').classList.remove('active');
    }
  });

  initPage();
}

// Initialize page (for login)
async function initPage() {
  logDebug('Initializing page...');
  await checkBackendConnection();
  logDebug('Checking auth status');
  checkIfAlreadyLoggedIn();
}

// User Page Initialization
function initUserPage() {
  checkAuth().then(user => {
    currentUser = user;
    updateAuthUI();
    if (user.role === 'admin') window.location.href = './admin.html';
    initRepairForm();
    initTrainingForms();
    loadUserRepairs();
  }).catch(() => window.location.href = '/login.html');
}

// Admin Page Initialization
function initAdminPage() {
  checkAuth().then(user => {
    if (user.role !== 'admin') window.location.href = '/index.html';
    currentUser = user;
    updateAuthUI();
    initAdminDashboard();
    initAdminRepairs();
    initAdminTraining();
    initAdminMessages();
    connectWebSocket();
  }).catch(() => window.location.href = '/login.html');
}

// Stub functions for other inits (add implementation as needed)
function initRepairForm() {
  // Implement repair form logic
}

function initTrainingForms() {
  // Implement training form logic
}

function loadUserRepairs() {
  // Implement loading repairs
}

function initAdminDashboard() {
  // Implement admin dashboard logic
}

function initAdminRepairs() {
  // Implement admin repairs logic
}

function initAdminTraining() {
  // Implement admin training logic
}

function initAdminMessages() {
  // Implement admin messages logic
}

function connectWebSocket() {
  // Implement WebSocket connection
}