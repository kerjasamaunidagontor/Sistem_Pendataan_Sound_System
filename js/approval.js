/**
 * ========================================
 * APPROVAL.JS - Approval Functions
 * ========================================
 */

// ==================== RENDER APPROVAL LIST ====================
window.renderApprovalList = function() {
    const bookings = getBookings().filter(b => b.status === 'pending');
    document.getElementById('pendingCount').textContent = bookings.length;

    const container = document.getElementById('approvalList');
    const noPending = document.getElementById('noPending');

    if (bookings.length === 0) {
        container.innerHTML = '';
        noPending.classList.remove('hidden');
        return;
    }
    noPending.classList.add('hidden');

    container.innerHTML = bookings.map(b => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden card-hover">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div><p class="font-mono text-sm text-indigo-600 font-medium">${b.id}</p><p class="text-xs text-gray-400 mt-0.5">${formatDateTime(b.createdAt)}</p></div>
                <span class="status-pending px-2.5 py-1 rounded-full text-xs font-semibold">Pending</span>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><p class="text-sm text-gray-500">Peminjam</p><p class="font-medium text-gray-800">${escapeHtml(b.borrowerName)}</p><p class="text-sm text-gray-500">${escapeHtml(b.borrowerId)} • ${escapeHtml(b.borrowerPhone)}</p></div>
                    <div><p class="text-sm text-gray-500">Unit / Instansi</p><p class="font-medium text-gray-800">${escapeHtml(b.borrowerUnit)}</p></div>
                    <div><p class="text-sm text-gray-500">Periode Peminjaman</p><p class="font-medium text-gray-800">${formatDate(b.borrowDate)} — ${formatDate(b.returnDate)}</p></div>
                    <div><p class="text-sm text-gray-500">Peralatan</p><p class="font-medium text-gray-800">${b.equipment.map(e => escapeHtml(e.name)).join(', ')}</p></div>
                </div>
                <div class="mb-4"><p class="text-sm text-gray-500">Keperluan</p><p class="text-sm text-gray-700 mt-1 bg-gray-50 rounded-lg p-3">${escapeHtml(b.purpose)}</p></div>
                ${b.notes ? `<div class="mb-4"><p class="text-sm text-gray-500">Catatan</p><p class="text-sm text-gray-700 mt-1">${escapeHtml(b.notes)}</p></div>` : ''}
                <div class="flex gap-3 mt-4">
                    <button onclick="approveBooking('${b.id}')" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Setujui
                    </button>
                    <button onclick="rejectBooking('${b.id}')" class="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg> Tolak
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

// ==================== APPROVE BOOKING ====================
window.approveBooking = function(id) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    booking.status = 'approved';
    booking.approvedBy = AppConfig.currentUser.name;
    booking.approvedAt = new Date().toISOString();

    const equipment = getEquipment();
    booking.equipment.forEach(item => {
        const eq = equipment.find(e => e.id === item.id);
        if (eq) eq.available = Math.max(0, eq.available - item.qty);
    });
    saveEquipment(equipment);
    saveBookings(bookings);
    
    updateApprovalBadge();
    renderApprovalList();
    showToast('Peminjaman berhasil disetujui!', 'success');
};

// ==================== REJECT BOOKING ====================
window.rejectBooking = function(id) {
    const reason = prompt('Alasan penolakan:');
    if (reason === null) return;

    const bookings = getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    booking.status = 'rejected';
    booking.rejectionReason = reason || 'Tidak ada alasan';

    saveBookings(bookings);
    updateApprovalBadge();
    renderApprovalList();
    showToast('Peminjaman ditolak.', 'error');
};