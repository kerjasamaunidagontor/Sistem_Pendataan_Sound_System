/**
 * ========================================
 * FORM.JS - Form Peminjaman Functions
 * ========================================
 */

// ==================== RENDER EQUIPMENT CHECKBOXES ====================
window.renderEquipmentCheckboxes = function() {
    const equipment = getEquipment();
    const container = document.getElementById('equipmentList');
    if (!container) return;
    
    container.innerHTML = equipment.map(eq => `
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition">
            <input type="checkbox" name="equipment" value="${eq.id}" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">${escapeHtml(eq.name)}</p>
                <p class="text-xs text-gray-400">Stok: ${eq.available}/${eq.qty}</p>
            </div>
        </label>
    `).join('');
};

// ==================== SUBMIT BOOKING ====================
window.submitBooking = function(e) {
    e.preventDefault();
    const checked = document.querySelectorAll('input[name="equipment"]:checked');
    if (checked.length === 0) {
        showToast('Pilih minimal 1 peralatan!', 'error');
        return;
    }
    const borrowDate = document.getElementById('borrowDate').value;
    const returnDate = document.getElementById('returnDate').value;
    if (returnDate < borrowDate) {
        showToast('Tanggal kembali harus setelah tanggal pinjam!', 'error');
        return;
    }

    const equipment = getEquipment();
    const selectedItems = [];
    checked.forEach(cb => {
        const eq = equipment.find(e => e.id === cb.value);
        if (eq) selectedItems.push({ id: eq.id, name: eq.name, qty: 1 });
    });

    const bookings = getBookings();
    const id = 'BK' + Date.now().toString().slice(-8);

    const booking = {
        id,
        borrowerName: document.getElementById('borrowerName').value.trim(),
        borrowerId: document.getElementById('borrowerId').value.trim(),
        borrowerPhone: document.getElementById('borrowerPhone').value.trim(),
        borrowerUnit: document.getElementById('borrowerUnit').value.trim(),
        purpose: document.getElementById('purpose').value.trim(),
        borrowDate, returnDate,
        equipment: selectedItems,
        notes: document.getElementById('notes').value.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvedBy: null, approvedAt: null, rejectionReason: null
    };

    bookings.push(booking);
    saveBookings(bookings);
    updateApprovalBadge();

    showToast('Peminjaman berhasil diajukan! Menunggu approval.', 'success');
    document.getElementById('bookingForm').reset();
    renderEquipmentCheckboxes();

    // Reset dates
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('borrowDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('returnDate').value = nextWeek.toISOString().split('T')[0];

    showBookingReceipt(booking);
};

// ==================== RESET FORM ====================
window.resetForm = function() {
    renderEquipmentCheckboxes();
};