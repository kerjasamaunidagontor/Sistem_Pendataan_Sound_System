/**
 * ========================================
 * APPROVAL.JS - Approval Functions (ASYNC)
 * ========================================
 */

// ==================== RENDER APPROVAL LIST (With Loading Overlay) ====================
window.renderApprovalList = async function () {
  try {
    // ✅ Check admin access first
    if (typeof isAdminLoggedIn === "function" && !isAdminLoggedIn()) {
      const container = document.getElementById("approvalList");
      const noPending = document.getElementById("noPending");

      if (container) {
        container.innerHTML = `
          <div class="text-center py-12">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <p class="text-gray-500 mb-2">🔒 Akses Dibatasi</p>
            <p class="text-sm text-gray-400 mb-4">Halaman approval hanya untuk admin</p>
            <button onclick="showLoginModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
              Login sebagai Admin
            </button>
          </div>
        `;
      }

      if (noPending) noPending.classList.add("hidden");
      if (document.getElementById("pendingCount")) {
        document.getElementById("pendingCount").textContent = "0";
      }

      return;
    }

    // ✅ Admin logged in - Show loading overlay
    showLoading('🔄 Memuat data approval...');
    
    const container = document.getElementById("approvalList");
    const noPending = document.getElementById("noPending");

    // Fetch data from Google Sheets
    console.log('📡 Fetching bookings for approval...');
    const bookings = await getBookings();
    console.log(`✅ Fetched ${bookings.length} bookings`);
    
    const pending = bookings.filter((b) => b.status === "pending");
    console.log(`📋 Found ${pending.length} pending bookings`);

    // Update pending count badge
    const pendingCountEl = document.getElementById("pendingCount");
    if (pendingCountEl) {
      pendingCountEl.textContent = pending.length;
    }

    if (!container) {
      console.error("❌ approvalList element not found");
      hideLoading();
      return;
    }

    // Handle empty state
    if (pending.length === 0) {
      console.log('⚠️ No pending bookings');
      container.innerHTML = "";
      if (noPending) {
        noPending.classList.remove("hidden");
      }
      hideLoading();
      return;
    }

    if (noPending) noPending.classList.add("hidden");

    // Render actual content
    console.log('🎨 Rendering pending bookings...');
    container.innerHTML = pending
      .map(
        (b) => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden card-hover border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                <div>
                    <p class="font-mono text-sm text-indigo-600 font-bold">${escapeHtml(b.id)}</p>
                    <p class="text-xs text-gray-500 mt-0.5">${formatDateTime(b.createdAt)}</p>
                </div>
                <span class="status-pending px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  ⏳ Pending
                </span>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="space-y-3">
                        <div>
                            <p class="text-xs text-gray-500 font-medium mb-1">Peminjam</p>
                            <p class="font-semibold text-gray-800">${escapeHtml(b.borrowerName)}</p>
                            <p class="text-sm text-gray-500">${escapeHtml(b.borrowerId)} • ${escapeHtml(b.borrowerPhone)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 font-medium mb-1">Unit / Instansi</p>
                            <p class="font-medium text-gray-800">${escapeHtml(b.borrowerUnit)}</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <p class="text-xs text-gray-500 font-medium mb-1">Tempat Kegiatan</p>
                            <p class="font-medium text-gray-800">${escapeHtml(b.eventLocation) || "-"}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 font-medium mb-1">Periode Peminjaman</p>
                            <p class="font-medium text-gray-800">${formatDate(b.borrowDate)} — ${formatDate(b.returnDate)}</p>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <p class="text-xs text-gray-500 font-medium mb-2">Keperluan</p>
                    <p class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">${escapeHtml(b.purpose)}</p>
                </div>
                ${b.notes ? `
                <div class="mb-4">
                    <p class="text-xs text-gray-500 font-medium mb-2">Catatan</p>
                    <p class="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-100">${escapeHtml(b.notes)}</p>
                </div>` : ""}
                <div class="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onclick="approveBooking('${b.id}')" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> 
                        Setujui
                    </button>
                    <button onclick="rejectBooking('${b.id}')" class="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg> 
                        Tolak
                    </button>
                    <button onclick="deleteBooking('${b.id}')" class="px-4 py-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-gray-200 hover:border-red-200" title="Hapus">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                </div>
            </div>
        </div>
    `,
      )
      .join("");
    
    console.log('✅ Approval list rendered successfully');
    
    // Hide loading overlay
    hideLoading();
      
  } catch (e) {
    console.error("❌ Render approval error:", e);
    
    // Hide loading overlay on error
    hideLoading();
    
    // Show error in container
    const container = document.getElementById("approvalList");
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="text-gray-500 mb-2 font-semibold">❌ Gagal Memuat Data</p>
          <p class="text-sm text-gray-400 mb-4">${e.message || 'Terjadi kesalahan'}</p>
          <button onclick="renderApprovalList()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition inline-flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Coba Lagi
          </button>
        </div>
      `;
    }
    
    showToast("Gagal memuat data approval: " + e.message, "error");
  }
};

// ==================== APPROVE BOOKING (Updated) ====================
window.approveBooking = async function (id) {
  if (!confirm("Setujui peminjaman " + id + "?")) return;
  
  try {
    console.log('👍 Approving booking:', id);
    
    const bookings = await getBookings();
    const booking = bookings.find((b) => b.id === id);
    
    if (!booking) {
      showToast("Data tidak ditemukan", "error");
      return;
    }

    // Update booking status
    booking.status = "approved";
    booking.approvedBy = AppConfig.currentUser.name;
    booking.approvedAt = new Date().toISOString();

    // Save to Google Sheets
    await updateBooking(booking);

    // Refresh UI
    updateApprovalBadge();
    renderApprovalList();
    
    console.log('✅ Booking approved successfully');
    showToast("✅ Peminjaman berhasil disetujui!", "success");
    
  } catch (e) {
    console.error("❌ Approve error:", e);
    showToast("❌ Gagal menyetujui: " + e.message, "error");
  }
};

// ==================== REJECT BOOKING ====================
window.rejectBooking = async function (id) {
  const reason = prompt("Alasan penolakan:");
  if (reason === null) return;
  if (!reason.trim()) {
    showToast("Alasan penolakan harus diisi", "error");
    return;
  }

  try {
    console.log('👎 Rejecting booking:', id);
    
    const bookings = await getBookings();
    const booking = bookings.find((b) => b.id === id);
    
    if (!booking) {
      showToast("Data tidak ditemukan", "error");
      return;
    }

    booking.status = "rejected";
    booking.rejectionReason = reason.trim();

    await updateBooking(booking);

    updateApprovalBadge();
    renderApprovalList();
    
    console.log('✅ Booking rejected successfully');
    showToast("Peminjaman ditolak.", "error");
    
  } catch (e) {
    console.error("❌ Reject error:", e);
    showToast("❌ Gagal menolak: " + e.message, "error");
  }
};