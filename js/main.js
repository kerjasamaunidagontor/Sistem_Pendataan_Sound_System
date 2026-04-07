/**
 * ========================================
 * MAIN.JS - Entry Point & Navigation
 * ========================================
 * Module: App initialization, navigation, event listeners
 */

// ==================== AUTO-LOGOUT SYSTEM ====================

/**
 * Clear admin session (called on unload/refresh)
 */
function clearSessionOnUnload() {
  // Hanya clear jika ingin auto-logout on refresh
  // Jika ingin session bertahan saat refresh, hapus/komentar baris ini:
  sessionStorage.removeItem('admin_session');
  console.log('🔐 Session cleared on unload');
}

/**
 * Setup auto-logout event listeners
 */
function setupAutoLogout() {
  // Auto-logout when page is refreshed or tab is closed
  window.addEventListener('beforeunload', function(e) {
    clearSessionOnUnload();
  });
  
  // Optional: Auto-logout after X minutes of inactivity (30 minutes = 1800000ms)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 menit
  let inactivityTimer;
  
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (typeof isAdminLoggedIn === 'function' && isAdminLoggedIn()) {
        console.log('⏰ Auto-logout due to inactivity');
        if (typeof logoutAdmin === 'function') logoutAdmin();
        if (typeof updateAdminNav === 'function') updateAdminNav();
        showToast('⏰ Session expired. Silakan login ulang.', 'warning');
        
        // Redirect to dashboard if on admin page
        if (['inventory', 'approval', 'list'].includes(AppConfig.currentPage)) {
          navigateTo('dashboard');
        }
      }
    }, INACTIVITY_TIMEOUT);
  }
  
  // Reset timer on user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
  
  // Start timer on init
  resetInactivityTimer();
}

// ==================== ADMIN AUTH FUNCTIONS ====================

/**
 * Show login modal
 */
window.showLoginModal = function() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  document.getElementById('adminUsername')?.focus();
};

/**
 * Close login modal
 */
window.closeLoginModal = function() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  document.getElementById('loginError')?.classList.add('hidden');
  document.getElementById('adminPassword').value = '';
};

/**
 * Handle admin login form submit
 */
window.handleAdminLogin = function(e) {
  e.preventDefault();
  
  const username = document.getElementById('adminUsername')?.value.trim();
  const password = document.getElementById('adminPassword')?.value;
  const errorEl = document.getElementById('loginError');
  
  if (!username || !password) {
    if (errorEl) {
      errorEl.textContent = 'Username dan password harus diisi!';
      errorEl.classList.remove('hidden');
    }
    return;
  }
  
  const result = loginAdmin(username, password);
  
  if (result.success) {
    if (errorEl) errorEl.classList.add('hidden');
    closeLoginModal();
    showToast('✅ Login berhasil! Selamat datang, ' + username, 'success');
    
    // ✅ Update sidebar UI setelah login
    if (typeof updateAdminNav === 'function') {
      updateAdminNav();
    }
    
    // ✅ Reset inactivity timer after login
    if (typeof resetInactivityTimer === 'function') {
      resetInactivityTimer();
    }
    
    // Refresh current page if on admin page
    const currentPage = AppConfig.currentPage;
    if (['inventory', 'approval', 'list'].includes(currentPage)) {
      if (currentPage === 'list' && typeof renderBookingsList === 'function') {
        renderBookingsList();
      } else if (currentPage === 'approval' && typeof renderApprovalList === 'function') {
        renderApprovalList();
      } else if (currentPage === 'inventory' && typeof renderInventory === 'function') {
        renderInventory();
      }
    }
  } else {
    if (errorEl) {
      errorEl.textContent = result.message;
      errorEl.classList.remove('hidden');
    }
    if (document.getElementById('adminPassword')) {
      document.getElementById('adminPassword').value = '';
      document.getElementById('adminPassword').focus();
    }
  }
};

/**
 * Update sidebar UI based on login status
 */
window.updateAdminNav = function() {
  const isLoggedIn = typeof isAdminLoggedIn === 'function' && isAdminLoggedIn();
  
  console.log('🔐 updateAdminNav: isLoggedIn =', isLoggedIn);
  
  // 1. Update user info text
  const userInfo = document.getElementById('adminUserInfo');
  if (userInfo) {
    if (isLoggedIn) {
      userInfo.textContent = AppConfig.currentUser?.name || 'Admin';
      userInfo.className = 'text-xs text-emerald-400 font-medium';
    } else {
      userInfo.textContent = 'Guest';
      userInfo.className = 'text-xs text-gray-400';
    }
  }
  
  // 2. Update admin badge visibility
  const badge = document.getElementById('adminBadge');
  if (badge) {
    if (isLoggedIn) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  
  // 3. Update login button text
  const btnText = document.getElementById('loginBtnText');
  if (btnText) {
    btnText.textContent = isLoggedIn ? 'Logout' : 'Login';
  }
  
  // 4. Update login button style
  const loginBtn = document.getElementById('adminLoginBtn');
  if (loginBtn) {
    if (isLoggedIn) {
      loginBtn.className = 'text-xs px-2 py-1 rounded transition bg-red-500/20 hover:bg-red-500/30 text-red-400';
    } else {
      loginBtn.className = 'text-xs px-2 py-1 rounded transition bg-white/10 hover:bg-white/20 text-white';
    }
  }
  
  // ✅ Update button "Tambah Alat" visibility
  const btnTambahAlat = document.getElementById('btnTambahAlat');
  if (btnTambahAlat) {
    if (isLoggedIn) {
      btnTambahAlat.classList.remove('hidden');
    } else {
      btnTambahAlat.classList.add('hidden');
    }
  }
};

/**
 * Toggle admin login/logout
 */
window.toggleAdminAuth = function() {
  if (typeof isAdminLoggedIn === 'function' && isAdminLoggedIn()) {
    // Logout
    if (confirm('Logout dari admin?')) {
      if (typeof logoutAdmin === 'function') {
        logoutAdmin();
      }
      
      // ✅ Update sidebar UI after logout
      if (typeof updateAdminNav === 'function') {
        updateAdminNav();
      }
      
      showToast('👋 Anda telah logout', 'info');
      
      // Redirect to dashboard if on admin page
      if (['inventory', 'approval', 'list'].includes(AppConfig.currentPage)) {
        navigateTo('dashboard');
      }
    }
  } else {
    // Show login modal
    if (typeof showLoginModal === 'function') {
      showLoginModal();
    }
  }
};
// ==================== AUTO-UPDATE COPYRIGHT YEAR ====================
document.addEventListener('DOMContentLoaded', function() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
// ==================== NAVIGATION ====================

window.navigateTo = async function (page) {
  AppConfig.currentPage = page;

  // Hide all pages, show target
  document.querySelectorAll(".page-content")
    .forEach((el) => el.classList.add("hidden"));
  document.getElementById("page-" + page)?.classList.remove("hidden");

  // Update sidebar active state
  document.querySelectorAll(".sidebar-link")
    .forEach((el) => el.classList.remove("active"));
  const activeLink = document.querySelector(`.sidebar-link[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add("active");

  // Update page title
  const titles = {
    dashboard: "Dashboard",
    form: "Form Peminjaman",
    approval: "Approval",
    list: "Data Peminjaman",
    inventory: "Inventaris",
  };
  document.getElementById("pageTitle").textContent = titles[page] || "Dashboard";

  // Page-specific renders (ALL ASYNC)
  const pageRenders = {
    dashboard: async () => { await updateDashboard(); },
    form: () => { if (typeof renderEquipmentCheckboxes === 'function') renderEquipmentCheckboxes(); },
    approval: async () => { if (typeof renderApprovalList === 'function') await renderApprovalList(); },
    list: async () => { if (typeof renderBookingsList === 'function') await renderBookingsList(); },
    inventory: async () => { if (typeof renderInventory === 'function') await renderInventory(); },
  };

  if (pageRenders[page]) {
    try {
      await pageRenders[page]();
    } catch (e) {
      console.error(`Failed to render ${page}:`, e);
      showToast("Gagal memuat halaman", "error");
    }
  }

  // Close sidebar on mobile
  if (window.innerWidth < 1024) {
    document.getElementById("sidebar")?.classList.add("-translate-x-full");
    document.getElementById("sidebarOverlay")?.classList.add("hidden");
  }
  
  // ✅ Update admin nav after navigation
  if (typeof updateAdminNav === 'function') {
    setTimeout(() => updateAdminNav(), 50);
  }
};

// ==================== TOGGLE SIDEBAR ====================
window.toggleSidebar = function () {
  document.getElementById("sidebar")?.classList.toggle("-translate-x-full");
  document.getElementById("sidebarOverlay")?.classList.toggle("hidden");
};

// ==================== SYNC FROM SHEETS ====================
// ==================== SYNC FROM SHEETS (With Loading Overlay) ====================
window.handleSyncFromSheets = async function () {
  if (!confirm("Sinkronisasi data dari Google Sheets? Data lokal akan ditimpa dengan data dari Sheets.")) {
    return;
  }

  // Show loading overlay
  showLoading('🔄 Sinkronisasi dengan Google Sheets...\nMohon tunggu sebentar');

  try {
    const bookings = await getBookings(true);

    // Update all UI components
    if (typeof updateDashboard === "function") await updateDashboard();
    if (typeof renderApprovalList === "function") await renderApprovalList();
    if (typeof renderBookingsList === "function") await renderBookingsList();
    if (typeof updateApprovalBadge === "function") await updateApprovalBadge();

    // Hide loading and show success
    hideLoading();
    showToast(`✅ Sinkronisasi berhasil! ${bookings.length} data ditemukan.`, "success");
    
  } catch (e) {
    console.error("Sync error:", e);
    
    // Hide loading on error
    hideLoading();
    showToast("❌ Gagal sinkronisasi: " + e.message, "error");
  }
};

// ==================== SHARE FORM VIA QR CODE ====================

/**
 * Auto-navigate to form page and pre-fill form from URL parameters
 */
window.handleFormShareLink = function() {
  const params = new URLSearchParams(window.location.search);
  
  // ✅ Jika ada parameter page=form, navigate ke form
  if (params.get('page') === 'form') {
    // Navigate to form page
    if (typeof navigateTo === 'function') {
      navigateTo('form');
    }
    
    // Wait for page to render, then pre-fill
    setTimeout(() => {
      prefillFormFromURL();
    }, 100);
    
    return true;
  }
  
  return false;
};

/**
 * Pre-fill form from URL parameters
 */
window.prefillFormFromURL = function() {
  const params = new URLSearchParams(window.location.search);
  
  // Pre-fill name
  if (params.has('name')) {
    const nameInput = document.getElementById('borrowerName');
    if (nameInput) {
      nameInput.value = decodeURIComponent(params.get('name'));
    }
  }
  
  // Pre-fill ID (NIM/NIP)
  if (params.has('id')) {
    const idInput = document.getElementById('borrowerId');
    if (idInput) {
      idInput.value = decodeURIComponent(params.get('id'));
    }
  }
  
  // Pre-fill unit/instansi
  if (params.has('unit')) {
    const unitInput = document.getElementById('borrowerUnit');
    if (unitInput) {
      unitInput.value = decodeURIComponent(params.get('unit'));
    }
  }
  
  // Pre-fill phone
  if (params.has('phone')) {
    const phoneInput = document.getElementById('borrowerPhone');
    if (phoneInput) {
      phoneInput.value = decodeURIComponent(params.get('phone'));
    }
  }
  
  // Show toast if form was pre-filled
  if (params.toString()) {
    console.log('📝 Form pre-filled from URL params:', Object.fromEntries(params));
    showToast('📋 Form diisi otomatis dari link', 'info');
  }
};

// ==================== INIT APP ====================
function initApp() {
  const today = new Date();
  document.getElementById("currentDate").textContent = today.toLocaleDateString(
    "id-ID",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );

  // Set default dates for form
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const borrowDate = document.getElementById("borrowDate");
  const returnDate = document.getElementById("returnDate");
  if (borrowDate) borrowDate.value = tomorrow.toISOString().split("T")[0];
  if (returnDate) returnDate.value = nextWeek.toISOString().split("T")[0];

  updateDashboard();
  updateApprovalBadge();
  
  // ✅ PENTING: Update admin nav on page load
  if (typeof updateAdminNav === 'function') {
    setTimeout(() => updateAdminNav(), 100);
  }
  
  // ✅ Setup auto-logout system
  if (typeof setupAutoLogout === 'function') {
    setupAutoLogout();
  }
  
  // ✅ HANDLE SHARE LINK - Check if user came from QR code
  if (typeof handleFormShareLink === 'function') {
    handleFormShareLink();
  }
}

// ==================== DELETE BOOKING ====================
window.handleDeleteBooking = async function (id) {
  if (!confirm("Hapus peminjaman ini secara permanen?\n\nID: " + id + "\n\nTindakan ini tidak dapat dibatalkan.")) {
    return;
  }

  showToast("🗑️ Menghapus data...", "info");

  try {
    await deleteBooking(id);

    if (typeof renderBookingsList === "function") await renderBookingsList();
    if (typeof updateDashboard === "function") await updateDashboard();
    if (typeof updateApprovalBadge === "function") await updateApprovalBadge();

    showToast("✅ Data berhasil dihapus", "success");
  } catch (e) {
    console.error("Delete error:", e);
    showToast("❌ Gagal menghapus: " + e.message, "error");
  }
};

// ==================== EVENT LISTENERS ====================
document.addEventListener("DOMContentLoaded", function () {
  // Modal overlay click to close
  const modal = document.getElementById("detailModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === this) closeModal();
    });
  }
  
  // Login modal overlay click to close
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    loginModal.addEventListener("click", function (e) {
      if (e.target === this) closeLoginModal();
    });
  }

  // Initialize app
  initApp();
});