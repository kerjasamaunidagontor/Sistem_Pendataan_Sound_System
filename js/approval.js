/**
 * ========================================
 * APPROVAL.JS - Approval Functions (ASYNC)
 * ========================================
 */

// ==================== RENDER APPROVAL LIST (ASYNC) ====================
// ==================== RENDER APPROVAL LIST (ASYNC + Admin Access) ====================
window.renderApprovalList = async function () {
  // ✅ Check admin access first
  if (typeof isAdminLoggedIn === 'function' && !isAdminLoggedIn()) {
    const container = document.getElementById('approvalList');
    const noPending = document.getElementById('noPending');
    
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
    
    if (noPending) noPending.classList.add('hidden');
    if (document.getElementById('pendingCount')) {
      document.getElementById('pendingCount').textContent = '0';
    }
    
    return;
  }
  
  // ✅ Admin logged in - proceed with normal rendering
  try {
    const bookings = await getBookings();
    const pending = bookings.filter((b) => b.status === "pending");

    const pendingCountEl = document.getElementById("pendingCount");
    if (pendingCountEl) pendingCountEl.textContent = pending.length;

    const container = document.getElementById("approvalList");
    const noPending = document.getElementById("noPending");

    if (!container) {
      console.warn("approvalList element not found");
      return;
    }

    if (pending.length === 0) {
      container.innerHTML = "";
      if (noPending) noPending.classList.remove("hidden");
      return;
    }
    
    if (noPending) noPending.classList.add("hidden");

    container.innerHTML = pending
      .map(
        (b) => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden card-hover">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <p class="font-mono text-sm text-indigo-600 font-medium">${b.id}</p>
                    <p class="text-xs text-gray-400 mt-0.5">${formatDateTime(b.createdAt)}</p>
                </div>
                <span class="status-pending px-2.5 py-1 rounded-full text-xs font-semibold">Pending</span>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-sm text-gray-500">Peminjam</p>
                        <p class="font-medium text-gray-800">${escapeHtml(b.borrowerName)}</p>
                        <p class="text-sm text-gray-500">${escapeHtml(b.borrowerId)} • ${escapeHtml(b.borrowerPhone)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Unit / Instansi</p>
                        <p class="font-medium text-gray-800">${escapeHtml(b.borrowerUnit)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Periode Peminjaman</p>
                        <p class="font-medium text-gray-800">${formatDate(b.borrowDate)} — ${formatDate(b.returnDate)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Peralatan</p>
                        <p class="font-medium text-gray-800">${b.equipment.map((e) => escapeHtml(e.name)).join(", ")}</p>
                    </div>
                </div>
                <div class="mb-4">
                    <p class="text-sm text-gray-500">Keperluan</p>
                    <p class="text-sm text-gray-700 mt-1 bg-gray-50 rounded-lg p-3">${escapeHtml(b.purpose)}</p>
                </div>
                ${b.notes ? `<div class="mb-4"><p class="text-sm text-gray-500">Catatan</p><p class="text-sm text-gray-700 mt-1">${escapeHtml(b.notes)}</p></div>` : ""}
                <div class="flex gap-3 mt-4">
                    <button onclick="approveBooking('${b.id}')" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Setujui
                    </button>
                    <button onclick="rejectBooking('${b.id}')" class="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg> Tolak
                    </button>
                    <button onclick="deleteBooking('${b.id}')" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                </div>
            </div>
        </div>
    `,
      )
      .join("");
      
  } catch (e) {
    console.error("Render approval error:", e);
    showToast("Gagal memuat data approval: " + e.message, "error");
  }
};

// ==================== APPROVE BOOKING (Fixed) ====================
window.approveBooking = async function (id) {
  try {
    // Read from localStorage (fast)
    const bookings = await getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) {
      showToast('Data tidak ditemukan', 'error');
      return;
    }

    // Update locally first (instant UI feedback)
    booking.status = 'approved';
    booking.approvedBy = AppConfig.currentUser.name;
    booking.approvedAt = new Date().toISOString();
    
    // Save to localStorage
    const local = useLocalStorage();
    const allBookings = local.getBookings();
    const idx = allBookings.findIndex(b => b.id === id);
    if (idx >= 0) {
      allBookings[idx] = booking;
      local.saveBookings(allBookings);
    }

    // Async sync to Google Sheets
    if (navigator.onLine) {
      updateBooking(booking).catch(e => console.warn('Sheet sync failed:', e));
      
      // Update equipment availability (async)
      const equipment = await getEquipment();
      for (const item of booking.equipment) {
        const eq = equipment.find(e => e.id === item.id);
        if (eq) {
          eq.available = Math.max(0, eq.available - item.qty);
          updateEquipment(eq).catch(e => console.warn('Equipment sync failed:', e));
        }
      }
    }

    // Refresh UI immediately (from localStorage)
    updateApprovalBadge();
    renderApprovalList();
    showToast('✅ Peminjaman berhasil disetujui!', 'success');
    
  } catch (e) {
    console.error('Approve error:', e);
    showToast('❌ Gagal menyetujui: ' + e.message, 'error');
  }
};

// ==================== REJECT BOOKING (ASYNC) ====================
window.rejectBooking = async function (id) {
  const reason = prompt("Alasan penolakan:");
  if (reason === null) return;

  try {
    const bookings = await getBookings(); // ✅ AWAIT
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    booking.status = "rejected";
    booking.rejectionReason = reason || "Tidak ada alasan";

    await updateBooking(booking); // ✅ API call

    updateApprovalBadge();
    renderApprovalList();
    showToast("Peminjaman ditolak.", "error");
  } catch (e) {
    console.error("Reject error:", e);
    showToast("❌ Gagal menolak: " + e.message, "error");
  }
};
