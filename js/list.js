/**
 * ========================================
 * LIST.JS - Data Peminjaman Functions
 * ========================================
 */

// ==================== RENDER BOOKINGS LIST ====================
window.renderBookingsList = function() {
    let bookings = getBookings();
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const filter = document.getElementById('filterStatus')?.value || 'all';

    if (search) {
        bookings = bookings.filter(b =>
            b.id.toLowerCase().includes(search) ||
            b.borrowerName.toLowerCase().includes(search) ||
            b.purpose.toLowerCase().includes(search) ||
            b.borrowerUnit.toLowerCase().includes(search)
        );
    }
    if (filter !== 'all') {
        bookings = bookings.filter(b => b.status === filter);
    }
    bookings = bookings.reverse();

    const tbody = document.getElementById('bookingsTableBody');
    const empty = document.getElementById('emptyBookings');

    if (bookings.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    tbody.innerHTML = bookings.map(b => `
        <tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="px-4 lg:px-6 py-4"><svg class="barcode-svg" data-id="${b.id}"></svg></td>
            <td class="px-4 lg:px-6 py-4"><p class="text-sm font-medium text-gray-800">${escapeHtml(b.borrowerName)}</p><p class="text-xs text-gray-400">${escapeHtml(b.borrowerUnit)}</p></td>
            <td class="px-4 lg:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">${formatDate(b.borrowDate)}</td>
            <td class="px-4 lg:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell max-w-[150px] truncate">${b.equipment.map(e => escapeHtml(e.name)).join(', ')}</td>
            <td class="px-4 lg:px-6 py-4">${statusBadge(b.status)}</td>
            <td class="px-4 lg:px-6 py-4">
                <div class="flex items-center gap-1">
                    <button onclick="showDetail('${b.id}')" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Detail">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    ${b.status === 'approved' ? `<button onclick="markReturned('${b.id}')" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Tandai Dikembalikan"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>` : ''}
                    <button onclick="printBooking('${b.id}')" class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Cetak"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg></button>
                </div>
            </td>
        </tr>
    `).join('');

    // Render barcodes
    setTimeout(() => {
        document.querySelectorAll('.barcode-svg').forEach(svg => {
            const bookingId = svg.getAttribute('data-id');
            try { JsBarcode(svg, bookingId, { format: 'CODE128', width: 1.2, height: 25, displayValue: false, margin: 0 }); } catch(e) {}
        });
    }, 50);
};

// ==================== MARK AS RETURNED ====================
window.markReturned = function(id) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking || booking.status !== 'approved') return;
    if (!confirm('Tandai peminjaman ' + id + ' sebagai sudah dikembalikan?')) return;

    booking.status = 'returned';
    booking.returnedAt = new Date().toISOString();

    const equipment = getEquipment();
    booking.equipment.forEach(item => {
        const eq = equipment.find(e => e.id === item.id);
        if (eq) eq.available = Math.min(eq.qty, eq.available + item.qty);
    });
    saveEquipment(equipment);
    saveBookings(bookings);
    
    renderBookingsList();
    updateDashboard();
    showToast('Peminjaman ditandai sudah dikembalikan!', 'success');
};

// ==================== SHOW DETAIL MODAL ====================
window.showDetail = function(id) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    const content = `
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-800 text-lg">Detail Peminjaman</h3>
            <button onclick="closeModal()" class="p-1 hover:bg-gray-100 rounded-lg"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div class="p-6">
            <div class="bg-gray-50 rounded-xl p-4 mb-4 text-center"><svg id="detailBarcode"></svg><p class="text-sm font-mono text-indigo-600 mt-2">${booking.id}</p></div>
            <div class="space-y-3">
                <div class="flex justify-between text-sm"><span class="text-gray-500">Status</span><span>${statusBadge(booking.status)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Peminjam</span><span class="font-medium text-gray-800">${escapeHtml(booking.borrowerName)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">NIM/NIP/ID</span><span class="font-medium text-gray-800">${escapeHtml(booking.borrowerId)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Telepon</span><span class="font-medium text-gray-800">${escapeHtml(booking.borrowerPhone)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Unit/Instansi</span><span class="font-medium text-gray-800">${escapeHtml(booking.borrowerUnit)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Keperluan</span><span class="font-medium text-gray-800 text-right max-w-[60%]">${escapeHtml(booking.purpose)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Tgl Pinjam</span><span class="font-medium text-gray-800">${formatDate(booking.borrowDate)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Tgl Kembali</span><span class="font-medium text-gray-800">${formatDate(booking.returnDate)}</span></div>
                <div class="pt-3 border-t border-gray-200"><p class="text-xs text-gray-500 mb-2">Peralatan:</p>${booking.equipment.map(e => `<p class="text-sm text-gray-700 mb-1">• ${escapeHtml(e.name)}</p>`).join('')}</div>
                ${booking.notes ? `<div class="pt-2 border-t border-gray-200"><p class="text-xs text-gray-500 mb-1">Catatan:</p><p class="text-sm text-gray-700">${escapeHtml(booking.notes)}</p></div>` : ''}
                ${booking.approvedBy ? `<div class="pt-2 border-t border-gray-200"><p class="text-xs text-gray-500 mb-1">Disetujui oleh:</p><p class="text-sm text-gray-700">${escapeHtml(booking.approvedBy)} — ${formatDateTime(booking.approvedAt)}</p></div>` : ''}
                ${booking.rejectionReason ? `<div class="pt-2 border-t border-gray-200"><p class="text-xs text-gray-500 mb-1">Alasan Penolakan:</p><p class="text-sm text-red-600">${escapeHtml(booking.rejectionReason)}</p></div>` : ''}
                ${booking.returnedAt ? `<div class="pt-2 border-t border-gray-200"><p class="text-xs text-gray-500 mb-1">Dikembalikan:</p><p class="text-sm text-blue-600">${formatDateTime(booking.returnedAt)}</p></div>` : ''}
            </div>
        </div>
        <div class="px-6 pb-6 flex gap-3">
            <button onclick="printBooking('${booking.id}')" class="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg> Cetak</button>
            ${booking.status === 'approved' ? `<button onclick="markReturned('${booking.id}'); closeModal();" class="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Dikembalikan</button>` : ''}
        </div>
    `;
    document.getElementById('modalContent').innerHTML = content;
    openModal();
    setTimeout(() => {
        try { JsBarcode('#detailBarcode', booking.id, { format: 'CODE128', width: 2, height: 50, displayValue: false, margin: 10 }); } catch(e) {}
    }, 100);
};