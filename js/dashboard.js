/**
 * ========================================
 * DASHBOARD.JS - Dashboard Functions
 * ========================================
 */

// ==================== UPDATE DASHBOARD STATS ====================
window.updateDashboard = async function () {
  try {
    const bookings = await getBookings(); // async
    const pending = bookings.filter((b) => b.status === "pending").length;
    const approved = bookings.filter((b) => b.status === "approved").length;
    const returned = bookings.filter((b) => b.status === "returned").length;

    document.getElementById("statTotal").textContent = bookings.length;
    document.getElementById("statPending").textContent = pending;
    document.getElementById("statApproved").textContent = approved;
    document.getElementById("statReturned").textContent = returned;

    const recent = bookings.slice(-5).reverse();
    const tbody = document.getElementById("recentBookings");

    if (recent.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Belum ada peminjaman</td></tr>';
      return;
    }
    tbody.innerHTML = recent
      .map(
        (b) => `
            <tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onclick="showDetail('${b.id}')">
                <td class="px-6 py-4 text-sm font-mono text-indigo-600 font-medium">${b.id}</td>
                <td class="px-6 py-4 text-sm text-gray-800 font-medium">${escapeHtml(b.borrowerName)}</td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">${escapeHtml(b.purpose)}</td>
                <td class="px-6 py-4">${statusBadge(b.status)}</td>
            </tr>
        `,
      )
      .join("");
  } catch (e) {
    console.error("Dashboard update error:", e);
    showToast("Gagal memuat data dashboard", "error");
  }
};

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