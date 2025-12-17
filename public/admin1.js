// admin1.js – COMPLETE ES MODULE WITH ALL FUNCTIONS - CORRECTED VERSION
const BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://siliya-electricals.onrender.com';

const els = {
  toast: document.getElementById('toast'),
  statsGrid: document.getElementById('statsGrid'),
  recentRepairs: document.getElementById('recentRepairs'),
  recentEnrollments: document.getElementById('recentEnrollments'),
  repairsBody: document.getElementById('repairsBody'),
  trainingBody: document.getElementById('trainingBody'),
  usersBody: document.getElementById('usersBody'),
  currentDate: document.getElementById('currentDate'),
  adminName: document.getElementById('adminName'),
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  photoModal: document.getElementById('photoModal'),
  photoGrid: document.getElementById('photoGrid'),
  closeModal: document.querySelector('.close-modal')
};

let allData = { repairs: [], enrollments: [], courses: [], users: [] };
let charts = { repairs: null, enrollments: null };

// ===========================
// TOAST NOTIFICATION
// ===========================
const showToast = (msg, type = 'success') => {
  if (!els.toast) return;
  els.toast.textContent = msg;
  els.toast.style.background = type === 'success' ? '#4caf50' : '#f44336';
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 4000);
};

// ===========================
// ENROLLMENT DETAILS MODAL
// ===========================
const enrollmentModal = document.getElementById('enrollmentModal');
const enrollmentDetails = document.getElementById('enrollmentDetails');

document.addEventListener('click', e => {
  if (e.target.classList.contains('view-enrollment')) {
    const id = e.target.dataset.id;
    const enrollment = allData.enrollments.find(en => en._id === id);
    
    if (!enrollment) {
      showToast('Enrollment not found', 'danger');
      return;
    }
    
    // Format course name
    let courseName = 'N/A';
    if (enrollment.course?.name) {
      courseName = enrollment.course.name;
    } else if (typeof enrollment.course === 'string') {
      courseName = enrollment.course;
    }
    
    // Format date
    const enrollDate = new Date(enrollment.enrolledDate || enrollment.createdAt);
    const formattedDate = enrollDate.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Populate modal
    enrollmentDetails.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div>
          <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Enrollment ID</label>
          <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem;">
            ${enrollment._id}
          </div>
        </div>
        
        <div>
          <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Enrollment Date</label>
          <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem;">
            ${formattedDate}
          </div>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; padding-top: 1.5rem;">
        <h4 style="margin-top: 0; color: #333;">Course Information</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Course Name</label>
            <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem;">
              ${courseName}
            </div>
          </div>
          
          <div>
            <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Level</label>
            <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem;">
              ${enrollment.educationLevel || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; padding-top: 1.5rem;">
        <h4 style="margin-top: 0; color: #333;">Personal Information</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Full Name</label>
            <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem;">
              ${enrollment.fullName || 'N/A'}
            </div>
          </div>
          
          <div>
            <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Email</label>
            <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem; word-break: break-all;">
              ${enrollment.email || 'N/A'}
            </div>
          </div>
        </div>
        
        <div style="margin-top: 1rem;">
          <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Phone Number</label>
          <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem;">
            ${enrollment.phone || 'N/A'}
          </div>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; padding-top: 1.5rem;">
        <h4 style="margin-top: 0; color: #333;">Status</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Enrollment Status</label>
            <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem;">
              <span class="status-badge status-${enrollment.status || 'pending'}" style="text-transform: capitalize;">
                ${enrollment.status || 'pending'}
              </span>
            </div>
          </div>
          
          <div>
            <label style="display: block; font-weight: 600; color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">Payment Status</label>
            <div style="padding: 0.75rem; background: #f5f5f5; border-radius: 4px; font-size: 0.95rem;">
              <span style="
                display: inline-block;
                padding: 0.25rem 0.75rem;
                border-radius: 4px;
                font-size: 0.85rem;
                font-weight: 600;
                background: ${enrollment.paymentStatus === 'paid' ? '#4caf50' : enrollment.paymentStatus === 'partial' ? '#ff9800' : '#f44336'};
                color: white;
                text-transform: capitalize;
              ">
                ${enrollment.paymentStatus || 'unpaid'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    enrollmentModal.style.display = 'flex';
  }
});

// Close modal handlers
document.querySelectorAll('.close-enrollment-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    enrollmentModal.style.display = 'none';
  });
});

enrollmentModal?.addEventListener('click', e => {
  if (e.target === enrollmentModal) {
    enrollmentModal.style.display = 'none';
  }
});

// ===========================
// AUTH FETCH WITH HTML DETECTION
// ===========================
const authFetch = async (path, opts = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...(opts.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  console.log(`[API] ${opts.method || 'GET'} ${path}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });

  const contentType = res.headers.get('content-type');
  
  // Detect HTML responses (404 errors)
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error(`❌ HTML ERROR from ${path}:`, text.substring(0, 300));
    throw new Error(`Route not found: ${path} returned HTML instead of JSON`);
  }

  const json = await res.json();
  
  if (!res.ok) {
    console.error(`❌ API Error ${res.status}:`, json);
    throw new Error(json.error || json.message || `HTTP ${res.status}`);
  }

  console.log(`✅ Success from ${path}`, json);
  
  // Extract data property if it exists
  return json.data || json;
};

// ===========================
// FETCH ALL DATA
// ===========================
const fetchAll = async () => {
  try {
    console.log('📡 Fetching all admin data...');

    const [repairs, enrollments, courses, users] = await Promise.all([
      authFetch('/api/repairs').catch(e => { 
        console.error('❌ Repairs fetch failed:', e.message); 
        showToast('Failed to load repairs: ' + e.message, 'danger');
        return []; 
      }),
      
      authFetch('/api/training/enrollments').catch(e => { 
        console.error('❌ Enrollments fetch failed:', e.message); 
        showToast('Failed to load enrollments: ' + e.message, 'danger');
        return []; 
      }),
      
      authFetch('/api/training/courses').catch(e => { 
        console.error('❌ Courses fetch failed:', e.message); 
        showToast('Failed to load courses: ' + e.message, 'danger');
        return []; 
      }),
      
      authFetch('/api/auth/users').catch(e => { 
        console.error('❌ Users fetch failed:', e.message); 
        showToast('Failed to load users: ' + e.message, 'danger');
        return []; 
      })
    ]);

    // Ensure arrays
    allData = {
      repairs: Array.isArray(repairs) ? repairs : [],
      enrollments: Array.isArray(enrollments) ? enrollments : [],
      courses: Array.isArray(courses) ? courses : [],
      users: Array.isArray(users) ? users : []
    };

    console.log('✅ Data loaded:', {
      repairs: allData.repairs.length,
      enrollments: allData.enrollments.length,
      courses: allData.courses.length,
      users: allData.users.length
    });

    renderAll();
  } catch (e) {
    console.error('❌ fetchAll error:', e);
    showToast('Failed to load data: ' + e.message, 'danger');
  }
};

// ===========================
// RENDER DASHBOARD (Recent Items Only)
// ===========================
const renderAll = () => {
  // Current Date
  if (els.currentDate) {
    els.currentDate.textContent = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  // Stats Cards - ALWAYS SHOW
  if (els.statsGrid) {
    els.statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Repairs</div>
        <div class="stat-value">${allData.repairs.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Enrollments</div>
        <div class="stat-value">${allData.enrollments.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Courses</div>
        <div class="stat-value">${allData.courses.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Users</div>
        <div class="stat-value">${allData.users.length}</div>
      </div>
    `;
  }

  // Recent Repairs Mini Table - LATEST FIRST (Only 5)
  if (els.recentRepairs) {
    console.log('📋 Total repairs:', allData.repairs.length);
    
    // Sort by date (newest first) then take first 5
    const recent = [...allData.repairs]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.submittedDate || 0);
        const dateB = new Date(b.createdAt || b.submittedDate || 0);
        return dateB - dateA; // Newest first
      })
      .slice(0, 5);
    
    console.log('📋 Showing recent repairs:', recent.length);
    
    els.recentRepairs.innerHTML = recent.length ? recent.map(r => {
      const date = new Date(r.createdAt || r.submittedDate);
      const dateStr = date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <div class="mini-row">
          <div class="mini-row-main">
            <strong>${r.deviceType || 'Unknown'}</strong> ${r.brand || ''} ${r.model || ''}
            <span style="color: #999; font-size: 0.85rem; margin-left: 0.5rem;">
              ${dateStr}
            </span>
          </div>
          <div class="mini-row-sub" style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
            <span style="color: #666;">
              ${r.customer || r.user?.name || 'N/A'}
            </span>
            <span class="status-badge status-${r.status || 'pending'}">
              ${r.status || 'pending'}
            </span>
          </div>
        </div>
      `;
    }).join('') : '<p style="text-align:center;color:#999;padding:1rem;">No repairs yet</p>';
  }

  // Recent Enrollments Mini Table - LATEST FIRST (Only 5)
  if (els.recentEnrollments) {
    console.log('📋 Total enrollments:', allData.enrollments.length);
    
    // Sort by date (newest first) then take first 5
    const recent = [...allData.enrollments]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.enrolledDate || 0);
        const dateB = new Date(b.createdAt || b.enrolledDate || 0);
        return dateB - dateA; // Newest first
      })
      .slice(0, 5);
    
    console.log('📋 Showing recent enrollments:', recent.length);
    
    els.recentEnrollments.innerHTML = recent.length ? recent.map(e => {
      const date = new Date(e.createdAt || e.enrolledDate);
      const dateStr = date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let courseName = e.course?.name || e.courseName || e.course || 'Unknown Course';
      
      return `
        <div class="mini-row">
          <div class="mini-row-main">
            <strong>${courseName}</strong>
            <span style="color: #999; font-size: 0.85rem; margin-left: 0.5rem;">
              ${dateStr}
            </span>
          </div>
          <div class="mini-row-sub" style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
            <div>
              <span style="color: #333;">${e.fullName || 'N/A'}</span>
              <br/>
              <small style="color: #999;">${e.phone || 'N/A'}</small>
            </div>
            <span class="status-badge status-${e.status || 'pending'}">
              ${e.status || 'pending'}
            </span>
          </div>
        </div>
      `;
    }).join('') : '<p style="text-align:center;color:#999;padding:1rem;">No enrollments yet</p>';
  }

  // Render Charts on Dashboard
  renderCharts();
  
  // Check which section is active and render full tables if needed
  const activeSection = document.querySelector('.nav-item.active')?.dataset.section;
  
  if (activeSection === 'repairs' && els.repairsBody) {
    renderRepairsTable();
  }
  
  if (activeSection === 'training' && els.trainingBody) {
    renderTrainingTable();
  }
  
  if (activeSection === 'users' && els.usersBody) {
    renderUsersTable();
  }
};

// ===========================
// RENDER FULL REPAIRS TABLE
// ===========================
const renderRepairsTable = () => {
  if (!els.repairsBody) return;
  
  console.log('📋 Rendering full repairs table:', allData.repairs.length, 'items');
  
  // Sort by date (newest first)
  const sortedRepairs = [...allData.repairs].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.submittedDate || 0);
    const dateB = new Date(b.createdAt || b.submittedDate || 0);
    return dateB - dateA;
  });
  
  els.repairsBody.innerHTML = sortedRepairs.length ? sortedRepairs.map(r => `
    <tr>
      <td>${r._id?.slice(-6) || 'N/A'}</td>
      <td>${r.deviceType || ''} ${r.brand || ''} ${r.model || ''}</td>
      <td>${r.customer || r.user?.name || 'N/A'}</td>
      <td>
        <span class="status-badge status-${r.status || 'pending'}">
          ${r.status || 'pending'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-primary view-photos" data-id="${r._id}">
          Photos (${(r.photos?.length) || 0})
        </button>
      </td>
      <td>
        <select class="status-select" data-id="${r._id}">
          <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="in-progress" ${r.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
          <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align:center;color:#999;padding:2rem;">No repairs found</td></tr>';
};

// ===========================
// RENDER FULL TRAINING TABLE
// ===========================
const renderTrainingTable = () => {
  if (!els.trainingBody) return;
  
  console.log('📋 Rendering full training table:', allData.enrollments.length, 'items');
  
  // Sort by date (newest first)
  const sortedEnrollments = [...allData.enrollments].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.enrolledDate || 0);
    const dateB = new Date(b.createdAt || b.enrolledDate || 0);
    return dateB - dateA;
  });
  
  els.trainingBody.innerHTML = sortedEnrollments.length ? sortedEnrollments.map(e => `
    <tr>
      <td>${e._id?.slice(-6) || 'N/A'}</td>
      <td>${e.course?.name || e.courseName || e.course || 'N/A'}</td>
      <td>${e.fullName || 'N/A'}</td>
      <td>${e.email || 'N/A'}</td>
      <td>${e.phone || 'N/A'}</td>
      <td>${e.educationLevel || 'N/A'}</td>
      <td>
        <select class="enrollment-status-select" data-id="${e._id}" style="padding: 0.35rem 0.5rem; border-radius: 4px; border: 1px solid #ddd;">
          <option value="pending" ${e.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="approved" ${e.status === 'approved' ? 'selected' : ''}>Approved</option>
          <option value="rejected" ${e.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          <option value="active" ${e.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="completed" ${e.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-info view-enrollment" data-id="${e._id}" style="background:#0066cc;color:white;padding:0.35rem 0.75rem;border:none;border-radius:4px;cursor:pointer;">
          View Details
        </button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="8" style="text-align:center;color:#999;padding:2rem;">No enrollments found</td></tr>';
};

// ===========================
// RENDER FULL USERS TABLE
// ===========================
const renderUsersTable = () => {
  if (!els.usersBody) return;
  
  console.log('📋 Rendering full users table:', allData.users.length, 'items');
  
  els.usersBody.innerHTML = allData.users.length ? allData.users.map(u => `
    <tr>
      <td>${u._id?.slice(-6) || 'N/A'}</td>
      <td>${u.name || 'N/A'}</td>
      <td>${u.email || 'N/A'}</td>
      <td>
        <span style="
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          background: ${u.role === 'admin' ? '#2da0a8' : '#6c757d'};
          color: white;
        ">${u.role || 'user'}</span>
      </td>
      <td>
        <button class="btn btn-sm btn-danger delete-user" data-id="${u._id}" 
                ${u.role === 'admin' ? 'disabled title="Cannot delete admin"' : ''}>
          Delete
        </button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="5" style="text-align:center;color:#999;padding:2rem;">No users found</td></tr>';
};

// ===========================
// RENDER CHARTS
// ===========================
const renderCharts = () => {
  const ctx1 = document.getElementById('repairsChart')?.getContext('2d');
  const ctx2 = document.getElementById('enrollmentsChart')?.getContext('2d');
  
  if (!ctx1 || !ctx2) {
    console.warn('⚠️ Chart canvases not found');
    return;
  }

  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js not loaded!');
    return;
  }

  // Destroy existing charts
  if (charts.repairs) charts.repairs.destroy();
  if (charts.enrollments) charts.enrollments.destroy();

  // Repairs Status Chart (Doughnut)
  charts.repairs = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      datasets: [{
        data: [
          allData.repairs.filter(r => r.status === 'pending').length,
          allData.repairs.filter(r => r.status === 'in-progress').length,
          allData.repairs.filter(r => r.status === 'completed').length,
          allData.repairs.filter(r => r.status === 'cancelled').length
        ],
        backgroundColor: ['#ff9800', '#2da0a8', '#4caf50', '#f44336'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { padding: 15, font: { size: 12 } }
        },
        title: {
          display: true,
          text: 'Repairs by Status',
          font: { size: 16, weight: 'bold' }
        }
      }
    }
  });

  // Enrollments by Course Chart (Bar)
  charts.enrollments = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: allData.courses.map(c => c.name || 'Unknown'),
      datasets: [{
        label: 'Enrollments',
        data: allData.courses.map(c => {
          const courseId = c._id;
          return allData.enrollments.filter(e => 
            e.course?._id === courseId || 
            e.course === courseId ||
            e.courseName === c.name
          ).length;
        }),
        backgroundColor: 'rgba(45,160,168,0.6)',
        borderColor: 'rgba(45,160,168,1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Enrollments by Course',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: { 
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
  
  console.log('📊 Charts rendered successfully');
};

// ===========================
// NAVIGATION
// ===========================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    console.log('📍 Navigating to:', item.dataset.section);
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    // Show corresponding section
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const section = item.dataset.section;
    const sec = document.getElementById(section + 'Section');
    if (sec) sec.classList.remove('hidden');
    
    // Render appropriate content based on section
    if (section === 'dashboard') {
      renderAll(); // Shows stats + recent items + charts
    } else if (section === 'repairs') {
      renderRepairsTable(); // Shows full repairs table
    } else if (section === 'training') {
      renderTrainingTable(); // Shows full training table
    } else if (section === 'users') {
      renderUsersTable(); // Shows full users table
    }
  });
});

// ===========================
// SEARCH FUNCTIONALITY
// ===========================
const handleSearch = () => {
  const q = (els.searchInput?.value || '').trim().toLowerCase();
  
  if (!q) {
    renderRepairsTable();
    return;
  }

  const filtered = allData.repairs.filter(r =>
    (r.deviceType || '').toLowerCase().includes(q) ||
    (r.brand || '').toLowerCase().includes(q) ||
    (r.customer || '').toLowerCase().includes(q) ||
    (r.model || '').toLowerCase().includes(q) ||
    (r.status || '').toLowerCase().includes(q) ||
    (r.user?.name || '').toLowerCase().includes(q)
  );

  if (els.repairsBody) {
    const sortedFiltered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.submittedDate || 0);
      const dateB = new Date(b.createdAt || b.submittedDate || 0);
      return dateB - dateA;
    });
    
    els.repairsBody.innerHTML = sortedFiltered.length ? sortedFiltered.map(r => `
      <tr>
        <td>${r._id?.slice(-6)}</td>
        <td>${r.deviceType} ${r.brand} ${r.model}</td>
        <td>${r.customer || r.user?.name}</td>
        <td><span class="status-badge status-${r.status}">${r.status}</span></td>
        <td>
          <button class="btn btn-sm btn-primary view-photos" data-id="${r._id}">
            Photos (${r.photos?.length || 0})
          </button>
        </td>
        <td>
          <select class="status-select" data-id="${r._id}">
            <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in-progress" ${r.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6" style="text-align:center;">No results found</td></tr>';
  }

  showToast(`Found ${filtered.length} result(s)`, 'success');
};

els.searchBtn?.addEventListener('click', handleSearch);
els.searchInput?.addEventListener('keyup', e => {
  if (e.key === 'Enter') handleSearch();
});

// ===========================
// ENROLLMENT STATUS UPDATE
// ===========================
document.addEventListener('change', async e => {
  if (e.target.classList.contains('enrollment-status-select')) {
    const id = e.target.dataset.id;
    const newStatus = e.target.value;
    const oldStatus = allData.enrollments.find(en => en._id === id)?.status || 'pending';
    
    console.log(`Updating enrollment ${id} from ${oldStatus} to ${newStatus}`);
    
    try {
      await authFetch(`/api/training/enrollments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      showToast('Enrollment status updated successfully!', 'success');
      
      // Update local data
      const enrollment = allData.enrollments.find(en => en._id === id);
      if (enrollment) enrollment.status = newStatus;
      
      // Re-render only training table
      renderTrainingTable();
      
    } catch (err) {
      console.error('Status update failed:', err);
      showToast('Failed to update: ' + err.message, 'danger');
      e.target.value = oldStatus;
    }
  }
});

// ===========================
// REPAIR STATUS UPDATE
// ===========================
document.addEventListener('change', async e => {
  if (e.target.classList.contains('status-select')) {
    const id = e.target.dataset.id;
    const newStatus = e.target.value;
    const oldStatus = allData.repairs.find(r => r._id === id)?.status || 'pending';
    
    console.log(`Updating repair ${id} from ${oldStatus} to ${newStatus}`);
    
    try {
      await authFetch(`/api/repairs/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      showToast('Repair status updated successfully!', 'success');
      
      // Update local data
      const repair = allData.repairs.find(r => r._id === id);
      if (repair) repair.status = newStatus;
      
      // Re-render only repairs table
      renderRepairsTable();
      
    } catch (err) {
      console.error('Status update failed:', err);
      showToast('Failed to update: ' + err.message, 'danger');
      e.target.value = oldStatus;
    }
  }
});

// ===========================
// DELETE USER
// ===========================
document.addEventListener('click', async e => {
  if (e.target.classList.contains('delete-user')) {
    const id = e.target.dataset.id;
    const user = allData.users.find(u => u._id === id);
    
    if (!user) return;
    
    if (user.role === 'admin') {
      showToast('Cannot delete admin users', 'danger');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      return;
    }
    
    try {
      await authFetch(`/api/auth/users/${id}`, { 
        method: 'DELETE' 
      });
      
      showToast('User deleted successfully', 'success');
      fetchAll(); // Reload all data
      
    } catch (err) {
      console.error('Delete user failed:', err);
      showToast('Delete failed: ' + err.message, 'danger');
    }
  }
});

// ===========================
// PHOTO MODAL
// ===========================
document.addEventListener('click', e => {
  if (e.target.classList.contains('view-photos')) {
    const id = e.target.dataset.id;
    const repair = allData.repairs.find(r => r._id === id);
    
    if (repair && els.photoGrid) {
      if (repair.photos && repair.photos.length > 0) {
        els.photoGrid.innerHTML = repair.photos.map(p => `
          <img src="${p}" alt="Repair photo" 
               onclick="window.open('${p}', '_blank')" 
               style="cursor:pointer; max-width: 100%; height: auto;">
        `).join('');
      } else {
        els.photoGrid.innerHTML = '<p style="text-align:center;color:#999;">No photos uploaded for this repair</p>';
      }
      
      els.photoModal?.classList.add('active');
    }
  }
});

els.closeModal?.addEventListener('click', () => {
  els.photoModal?.classList.remove('active');
});

els.photoModal?.addEventListener('click', e => {
  if (e.target === els.photoModal) {
    els.photoModal.classList.remove('active');
  }
});

// ===========================
// LOGOUT
// ===========================
els.logoutBtn?.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
});

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  // Check authentication
  if (!token) {
    console.warn('No token found, redirecting to login...');
    window.location.href = 'login.html';
    return;
  }
  
  // Check admin role
  if (user.role !== 'admin') {
    console.warn('Not an admin, redirecting to index...');
    alert('Access denied. Admin privileges required.');
    window.location.href = 'index.html';
    return;
  }
  
  // Display admin name
  if (user.name && els.adminName) {
    els.adminName.textContent = user.name;
  }
  
  console.log('🚀 Admin panel initializing...');
  console.log('Admin user:', user.name, '(' + user.email + ')');
  
  // Initial data fetch
  fetchAll();
  
  // Auto-refresh every 30 seconds
  setInterval(() => {
    console.log('🔄 Auto-refreshing data...');
    fetchAll();
  }, 30000);
  
  console.log('✅ Admin panel ready');
});