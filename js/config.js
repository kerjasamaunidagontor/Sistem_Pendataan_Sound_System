/**
 * ========================================
 * CONFIG.JS - Shared Configuration & Utils
 * ========================================
 * Module: Global config, data store, utilities, API client
 * Strategy: Bookings use localStorage + sync, Equipment use direct Sheets access
 */

// ==================== GLOBAL STATE ====================
window.AppConfig = {
  currentUser: { name: "Petugas Admin", role: "approver" },
  currentPage: "dashboard",
  storageKeys: {
    bookings: "sound_bookings",
    equipment: "sound_equipment",
  },
};

// ==================== DEFAULT DATA ====================
window.DEFAULT_EQUIPMENT = [
  { id: "EQ001", name: 'Speaker Active 15"', category: "Speaker", condition: "Baik", qty: 4, available: 4 },
  { id: "EQ002", name: "Mixer 16 Channel", category: "Mixer", condition: "Baik", qty: 2, available: 2 },
  { id: "EQ003", name: "Microphone Wireless", category: "Microphone", condition: "Baik", qty: 4, available: 4 },
  { id: "EQ004", name: 'Subwoofer 18"', category: "Speaker", condition: "Baik", qty: 2, available: 2 },
  { id: "EQ005", name: "Amplifier 1000W", category: "Amplifier", condition: "Baik", qty: 2, available: 2 },
  { id: "EQ006", name: "Stand Microphone", category: "Aksesoris", condition: "Baik", qty: 6, available: 6 },
  { id: "EQ007", name: "Kabel Speaker 50m", category: "Kabel", condition: "Baik", qty: 4, available: 4 },
  { id: "EQ008", name: "CDJ Player", category: "Player", condition: "Baik", qty: 2, available: 2 },
  { id: "EQ009", name: "Monitor Stage", category: "Speaker", condition: "Baik", qty: 2, available: 2 },
  { id: "EQ010", name: "Equalizer 31 Band", category: "Processor", condition: "Baik", qty: 1, available: 1 },
];

// ==================== GOOGLE SHEETS API CONFIG ====================
window.API_URL = "https://script.google.com/macros/s/AKfycbwqIsrWJbHtLzj9tL_jMYoJq6jNwMDd0MBYUFeLjnQNVY0_BTjkJQ2aUO63lePZKoaKqA/exec";
window.API_TOKEN = null;

// ==================== ADMIN AUTH SYSTEM ====================

/**
 * Credential admin (⚠️ Untuk production, gunakan backend auth yang lebih aman)
 */
const ADMIN_CREDENTIALS = {
  username: 'Admin',
  password: 'adminseo'
};

/**
 * Check if user is logged in as admin
 */
window.isAdminLoggedIn = function() {
  const session = sessionStorage.getItem('admin_session');
  if (!session) return false;
  
  try {
    const data = JSON.parse(session);
    return data.loggedIn === true && data.username === ADMIN_CREDENTIALS.username;
  } catch {
    return false;
  }
};

/**
 * Login admin
 */
window.loginAdmin = function(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem('admin_session', JSON.stringify({
      loggedIn: true,
      username: username,
      loginTime: new Date().toISOString()
    }));
    
    AppConfig.currentUser = { name: username, role: 'admin' };
    console.log('✅ Admin logged in:', username);
    return { success: true, message: 'Login berhasil!' };
  }
  
  console.log('❌ Login failed');
  return { success: false, message: 'Username atau password salah!' };
};

/**
 * Logout admin
 */
window.logoutAdmin = function() {
  sessionStorage.removeItem('admin_session');
  AppConfig.currentUser = { name: 'Petugas Admin', role: 'approver' };
  console.log('👋 Admin logged out');
  return { success: true };
};

/**
 * Check access for admin-only pages
 */
window.checkAdminAccess = function(page) {
  const adminPages = ['inventory', 'approval', 'list'];
  
  if (adminPages.includes(page) && !isAdminLoggedIn()) {
    console.warn('🔒 Access denied to', page, '- requires admin login');
    showToast('🔒 Akses ditolak. Silakan login sebagai admin.', 'error');
    
    // Redirect to login or show login modal
    showLoginModal();
    return false;
  }
  
  return true;
};

// ==================== API CLIENT ====================
async function apiFetch(action, method = "POST", body = null) {
  const payload = { action };
  if (API_TOKEN) payload.token = API_TOKEN;
  if (body) Object.assign(payload, body);

  try {
    const response = await fetch(API_URL, {
      method: method,
      
      redirect: "follow",
      headers: { "Content-Type": "text/plain" },
      body: method === "POST" && body ? JSON.stringify(payload) : undefined,
    });
    return { success: true, action: action, readable: false, message: "Request sent (no-cors mode)" };
  } catch (error) {
    console.error("API Network Error:", error);
    throw new Error("Failed to connect to Google Sheets: " + error.message);
  }
}

// ==================== LOCAL STORAGE FALLBACK (For Bookings Only) ====================
function useLocalStorage() {
  console.warn("⚠️ Using localStorage fallback (offline mode)");
  return {
    getBookings: () => JSON.parse(localStorage.getItem(AppConfig.storageKeys.bookings) || "[]"),
    saveBookings: (data) => localStorage.setItem(AppConfig.storageKeys.bookings, JSON.stringify(data)),
  };
}

// ==================== BOOKINGS FUNCTIONS (localStorage + sync) ====================
window.syncFromSheets = async function () {
  try {
    console.log("🔄 Syncing bookings from Google Sheets...");
    showToast("🔄 Memeriksa data dari Google Sheets...", "info");
    
    const localBookings = useLocalStorage().getBookings();
    
    if (navigator.onLine) {
      fetch(`${API_URL}?action=getBookings`, {
        method: "GET", redirect: "follow"
      }).catch((e) => console.log("Background sync request sent"));
    }
    
    console.log("📦 Loaded", localBookings.length, "bookings from localStorage");
    showToast(`📋 Menampilkan ${localBookings.length} data`, "success");
    return localBookings;
  } catch (e) {
    console.error("❌ Sync failed:", e);
    showToast("⚠️ Menggunakan data lokal", "warning");
    return useLocalStorage().getBookings();
  }
};

window.getBookings = async function (syncFromSheets = false) {
  if (syncFromSheets) return await window.syncFromSheets();
  return useLocalStorage().getBookings();
};

window.saveBooking = async function (booking) {
  const local = useLocalStorage();
  const bookings = local.getBookings();
  const idx = bookings.findIndex((b) => b.id === booking.id);
  
  if (idx >= 0) bookings[idx] = { ...bookings[idx], ...booking };
  else bookings.push(booking);
  local.saveBookings(bookings);

  if (navigator.onLine) {
    apiFetch("createBooking", "POST", { data: booking })
      .then(() => console.log("✅ Booking sent to Sheets:", booking.id))
      .catch((e) => console.warn("⚠️ Sheets sync failed:", e.message));
  }

  return { success: true, local: true, message: "Saved locally + syncing to Sheets" };
};

window.updateBooking = async function (booking) {
  const local = useLocalStorage();
  const bookings = local.getBookings();
  const idx = bookings.findIndex((b) => b.id === booking.id);
  
  if (idx >= 0) {
    bookings[idx] = { ...bookings[idx], ...booking };
    local.saveBookings(bookings);
  }

  if (navigator.onLine) {
    apiFetch("updateBooking", "POST", { data: booking })
      .then(() => console.log("✅ Booking update sent to Sheets:", booking.id))
      .catch((e) => console.warn("⚠️ Sheets update failed:", e.message));
  }

  return { success: true, local: true };
};

window.deleteBooking = async function (id) {
  const local = useLocalStorage();
  let bookings = local.getBookings().filter((b) => b.id !== id);
  local.saveBookings(bookings);
  console.log("🗑️ Deleted from localStorage:", id);

  if (navigator.onLine) {
    try {
      await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "deleteBooking", data: { id } })
      });
      console.log("✅ Delete request sent to Sheets:", id);
    } catch (e) {
      console.warn("⚠️ Sheets delete request failed:", e.message);
    }
  }
  return { success: true };
};

// ==================== EQUIPMENT FUNCTIONS - DIRECT SHEETS ACCESS ====================
/**
 * Get equipment DIRECTLY from Google Sheets (NO localStorage)
 */
window.getEquipment = async function () {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'getEquipment' })
    });
    
    const result = await response.json();
    const equipment = result.equipment || [];
    
    console.log('📦 Loaded', equipment.length, 'equipment from Google Sheets');
    return equipment;
    
  } catch (e) {
    console.error('❌ Failed to fetch equipment:', e);
    showToast('Gagal memuat data inventaris', 'error');
    return [];
  }
};

/**
 * Update equipment - langsung ke Google Sheets
 */
window.updateEquipment = async function (equipment) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'updateEquipment', data: equipment })
    });
    
    const result = await response.json();
    console.log('✅ Equipment updated:', result);
    return result;
    
  } catch (e) {
    console.error('❌ Failed to update equipment:', e);
    showToast('Gagal update equipment', 'error');
    return { success: false, error: e.message };
  }
};

/**
 * Delete equipment - langsung dari Google Sheets
 */
window.deleteEquipmentAPI = async function (id) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({
        action: "deleteEquipment",
        data: { id },
      }),
    });

    const result = await response.json();
    console.log("🗑️ Delete result:", result);

    if (!result.success) {
      throw new Error(result.error || "Gagal hapus data");
    }

    return result;

  } catch (err) {
    console.error("❌ deleteEquipmentAPI error:", err);
    throw err;
  }
};

// ==================== QR CODE HELPER FUNCTIONS ====================
window.generateQRCode = function (element, text, options = {}) {
  if (typeof QRCode === "undefined") {
    console.error("QRCode library not loaded!");
    const target = typeof element === "string" ? document.querySelector(element) : element;
    if (target) target.innerHTML = '<p class="text-red-500 text-xs">QR library error</p>';
    return;
  }
  const config = {
    text: text, width: options.width || 128, height: options.height || 128,
    colorDark: options.colorDark || "#000000", colorLight: options.colorLight || "#ffffff",
    correctLevel: options.correctLevel || QRCode.CorrectLevel.M,
  };
  const target = typeof element === "string" ? document.querySelector(element) : element;
  if (target) {
    target.innerHTML = "";
    target.classList.add("qr-container");
    new QRCode(target, config);
  }
};

window.generateQRCodeSmall = function (element, text) {
  window.generateQRCode(element, text, { width: 40, height: 40, correctLevel: QRCode.CorrectLevel.L });
};

window.generateQRCodeLarge = function (element, text) {
  window.generateQRCode(element, text, { width: 150, height: 150, correctLevel: QRCode.CorrectLevel.H });
};

// ==================== UTILITY FUNCTIONS ====================
window.escapeHtml = function (str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

window.formatDate = function (dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

window.formatDateTime = function (isoStr) {
  if (!isoStr) return "-";
  return new Date(isoStr).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

window.statusBadge = function (status) {
  const map = {
    pending: '<span class="status-pending px-2.5 py-1 rounded-full text-xs font-semibold">Pending</span>',
    approved: '<span class="status-approved px-2.5 py-1 rounded-full text-xs font-semibold">Disetujui</span>',
    rejected: '<span class="status-rejected px-2.5 py-1 rounded-full text-xs font-semibold">Ditolak</span>',
    returned: '<span class="status-returned px-2.5 py-1 rounded-full text-xs font-semibold">Dikembalikan</span>',
  };
  return map[status] || status;
};

// ==================== INIT CHECK ====================
window.checkAPIConnection = async function () {
  try {
    const result = await apiFetch("getBookings", "GET");
    console.log("✅ API Connected:", result ? "OK" : "Empty");
    return true;
  } catch (e) {
    console.warn("⚠️ API Not Connected (will use localStorage):", e.message);
    return false;
  }
};
// document.addEventListener('DOMContentLoaded', () => checkAPIConnection());