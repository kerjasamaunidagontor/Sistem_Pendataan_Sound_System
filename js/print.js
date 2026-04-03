/**
 * ========================================
 * PRINT.JS - Print & Barcode Functions
 * ========================================
 */

// ==================== PRINT BOOKING ====================
window.printBooking = function(id) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cetak Peminjaman - ${booking.id}</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px; }
                .header h1 { font-size: 18px; }
                .header p { font-size: 12px; color: #666; }
                .barcode-wrap { text-align: center; margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 8px; }
                .info { margin-bottom: 15px; }
                .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #eee; font-size: 13px; }
                .info-row .label { color: #666; }
                .info-row .value { font-weight: bold; text-align: right; }
                .equipment { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 8px; }
                .equipment h4 { font-size: 13px; margin-bottom: 5px; color: #666; }
                .equipment p { font-size: 13px; padding: 2px 0; }
                .status { text-align: center; padding: 8px; border-radius: 6px; margin-top: 15px; font-weight: bold; font-size: 14px; }
                .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>BUKTI PEMINJAMAN</h1>
                <p>Sound System Management</p>
            </div>
            <div class="barcode-wrap">
                <svg id="printBarcode"></svg>
            </div>
            <div style="text-align:center; margin-bottom:15px;">
                <span style="font-family:monospace; font-size:16px; font-weight:bold; color:#4f46e5;">${booking.id}</span>
            </div>
            <div class="info">
                <div class="info-row"><span class="label">Peminjam</span><span class="value">${escapeHtml(booking.borrowerName)}</span></div>
                <div class="info-row"><span class="label">NIM/NIP</span><span class="value">${escapeHtml(booking.borrowerId)}</span></div>
                <div class="info-row"><span class="label">Telepon</span><span class="value">${escapeHtml(booking.borrowerPhone)}</span></div>
                <div class="info-row"><span class="label">Unit/Instansi</span><span class="value">${escapeHtml(booking.borrowerUnit)}</span></div>
                <div class="info-row"><span class="label">Tgl Pinjam</span><span class="value">${formatDate(booking.borrowDate)}</span></div>
                <div class="info-row"><span class="label">Tgl Kembali</span><span class="value">${formatDate(booking.returnDate)}</span></div>
            </div>
            <div class="equipment">
                <h4>Peralatan:</h4>
                ${booking.equipment.map(e => `<p>• ${escapeHtml(e.name)}</p>`).join('')}
            </div>
            <div class="info">
                <div class="info-row"><span class="label">Keperluan</span><span class="value" style="max-width:55%;">${escapeHtml(booking.purpose)}</span></div>
                ${booking.notes ? `<div class="info-row"><span class="label">Catatan</span><span class="value">${escapeHtml(booking.notes)}</span></div>` : ''}
            </div>
            <div class="status" style="background:${booking.status === 'approved' ? '#d1fae5' : booking.status === 'rejected' ? '#fee2e2' : booking.status === 'returned' ? '#dbeafe' : '#fef3c7'}; color:${booking.status === 'approved' ? '#065f46' : booking.status === 'rejected' ? '#991b1b' : booking.status === 'returned' ? '#1e40af' : '#92400e'};">
                ${booking.status === 'pending' ? 'MENUNGGU APPROVAL' : booking.status === 'approved' ? 'DISETUJUI' : booking.status === 'rejected' ? 'DITOLAK' : 'DIKEMBALIKAN'}
            </div>
            ${booking.approvedBy ? `<p style="text-align:center; font-size:12px; margin-top:10px; color:#666;">Disetujui: ${escapeHtml(booking.approvedBy)}</p>` : ''}
            <div class="footer">
                <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
                <p>Sound System Management System</p>
            </div>
            <script>
                setTimeout(function() {
                    JsBarcode('#printBarcode', '${booking.id}', {
                        format: 'CODE128', width: 2, height: 50, displayValue: false, margin: 5
                    });
                    setTimeout(function() { window.print(); }, 200);
                }, 100);
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

// ==================== SHOW BOOKING RECEIPT ====================
window.showBookingReceipt = function(booking) {
    const content = `
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-800 text-lg">Bukti Peminjaman</h3>
            <button onclick="closeModal()" class="p-1 hover:bg-gray-100 rounded-lg">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 text-center">
            <div class="bg-gray-50 rounded-xl p-6 mb-4">
                <svg id="receiptBarcode"></svg>
            </div>
            <p class="text-sm text-gray-500 mb-1">ID Peminjaman</p>
            <p class="text-xl font-bold font-mono text-indigo-600 mb-4">${booking.id}</p>
            <div class="text-left space-y-3 bg-gray-50 rounded-xl p-4">
                <div class="flex justify-between text-sm"><span class="text-gray-500">Peminjam</span><span class="font-medium text-gray-800">${escapeHtml(booking.borrowerName)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Unit/Instansi</span><span class="font-medium text-gray-800">${escapeHtml(booking.borrowerUnit)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Tgl Pinjam</span><span class="font-medium text-gray-800">${formatDate(booking.borrowDate)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Tgl Kembali</span><span class="font-medium text-gray-800">${formatDate(booking.returnDate)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-500">Status</span><span>${statusBadge(booking.status)}</span></div>
                <div class="pt-2 border-t border-gray-200"><p class="text-xs text-gray-500 mb-1">Peralatan:</p>${booking.equipment.map(e => `<p class="text-sm text-gray-700">• ${escapeHtml(e.name)}</p>`).join('')}</div>
            </div>
        </div>
        <div class="px-6 pb-6 flex gap-3">
            <button onclick="printBooking('${booking.id}')" class="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Cetak
            </button>
            <button onclick="closeModal(); navigateTo('list')" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">Lihat Data</button>
        </div>
    `;
    document.getElementById('modalContent').innerHTML = content;
    openModal();
    setTimeout(() => {
        try {
            JsBarcode('#receiptBarcode', booking.id, { format: 'CODE128', width: 2, height: 60, displayValue: true, fontSize: 14, font: 'Inter', margin: 10 });
        } catch(e) { console.error('Barcode error:', e); }
    }, 100);
};