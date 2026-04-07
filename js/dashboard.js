/**
 * ========================================
 * DASHBOARD.JS - Dashboard Functions
 * ========================================
 */

// ==================== UPDATE DASHBOARD STATS ====================
// ==================== UPDATE DASHBOARD STATS (ASYNC + Loading) ====================
window.updateDashboard = async function () {
  try {
    // ✅ Show skeleton for stats cards
    const statsContainer = document.querySelector('#page-dashboard > div.grid');
    if (statsContainer) {
      showSkeleton('dashboardStats', 'stats');
    }
    
    // ✅ Show loading overlay for initial fetch
    showLoading('Memuat dashboard...');
    
    // Fetch data from Google Sheets
    const bookings = await getBookings();
    
    // Calculate stats
    const pending = bookings.filter((b) => b.status === "pending").length;
    const approved = bookings.filter((b) => b.status === "approved").length;
    const returned = bookings.filter((b) => b.status === "returned").length;
    
    // ✅ Hide loading overlay before updating UI
    hideLoading();
    
    // Update stats cards with animation
    animateValue("statTotal", 0, bookings.length, 500);
    animateValue("statPending", 0, pending, 500);
    animateValue("statApproved", 0, approved, 500);
    animateValue("statReturned", 0, returned, 500);
    
    // Render recent bookings
    const recent = bookings.slice(-5).reverse();
    const tbody = document.getElementById("recentBookings");
    
    if (!tbody) {
      console.warn('recentBookings tbody not found');
      return;
    }
    
    if (recent.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Belum ada peminjaman</td></tr>';
      return;
    }
    
    tbody.innerHTML = recent
      .map(
        (b) => `
          <tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition" onclick="showDetail('${b.id}')">
            <td class="px-6 py-4 text-sm font-mono text-indigo-600 font-medium">${b.id}</td>
            <td class="px-6 py-4 text-sm text-gray-800 font-medium">${escapeHtml(b.borrowerName)}</td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title="${escapeHtml(b.purpose)}">
              ${escapeHtml(b.purpose)}
            </td>
            <td class="px-6 py-4">${statusBadge(b.status)}</td>
          </tr>
        `,
      )
      .join("");
      
  } catch (e) {
    console.error("Dashboard update error:", e);
    // ✅ Hide loading on error
    hideLoading();
    showToast("Gagal memuat data dashboard: " + e.message, "error");
  }
};

// ==================== HELPER: Animate Number Counter ====================
/**
 * Animate number from start to end over duration (ms)
 */
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  if (!element) return;
  
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// ==================== UPDATE APPROVAL BADGE ====================
// ==================== UPDATE APPROVAL BADGE (ASYNC) ====================
window.updateApprovalBadge = async function () {
  try {
    const bookings = await getBookings(); // ✅ AWAIT
    const pending = bookings.filter((b) => b.status === "pending").length;
    const badge = document.getElementById("approvalBadge");

    if (pending > 0) {
      badge.textContent = pending;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  } catch (e) {
    console.warn("Approval badge update failed:", e.message);
    // Fallback: try localStorage
    const local = useLocalStorage();
    const pending = local
      .getBookings()
      .filter((b) => b.status === "pending").length;
    const badge = document.getElementById("approvalBadge");
    badge.textContent = pending;
    badge.classList[pending > 0 ? "remove" : "add"]("hidden");
  }
};
// Di file JS utama (main.js atau dashboard.js)
window.handleSyncFromSheets = async function() {
  if (!confirm('Sinkronisasi data dari Google Sheets? Data lokal akan ditimpa dengan data dari Sheets.')) {
    return;
  }
  
  showToast('🔄 Mengambil data dari Google Sheets...', 'info');
  
  try {
    const bookings = await getBookings(true); // true = sync from Sheets
    
    // Refresh UI
    if (typeof updateDashboard === 'function') await updateDashboard();
    if (typeof renderApprovalList === 'function') await renderApprovalList();
    if (typeof renderBookingsList === 'function') await renderBookingsList();
    if (typeof updateApprovalBadge === 'function') await updateApprovalBadge();
    
    showToast(`✅ Sinkronisasi berhasil! ${bookings.length} data ditemukan.`, 'success');
  } catch (e) {
    showToast('❌ Gagal sync: ' + e.message, 'error');
  }
};