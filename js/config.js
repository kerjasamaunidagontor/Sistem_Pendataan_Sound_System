/**
 * ========================================
 * CONFIG.JS - Shared Configuration & Utils
 * ========================================
 * Module: Global config, data store, utilities
 */

// ==================== GLOBAL STATE ====================
window.AppConfig = {
    currentUser: { name: 'Petugas Admin', role: 'approver' },
    currentPage: 'dashboard',
    storageKeys: {
        bookings: 'sound_bookings',
        equipment: 'sound_equipment'
    }
};

// ==================== DEFAULT DATA ====================
window.DEFAULT_EQUIPMENT = [
    { id: 'EQ001', name: 'Speaker Active 15"', category: 'Speaker', condition: 'Baik', qty: 4, available: 4 },
    { id: 'EQ002', name: 'Mixer 16 Channel', category: 'Mixer', condition: 'Baik', qty: 2, available: 2 },
    { id: 'EQ003', name: 'Microphone Wireless', category: 'Microphone', condition: 'Baik', qty: 4, available: 4 },
    { id: 'EQ004', name: 'Subwoofer 18"', category: 'Speaker', condition: 'Baik', qty: 2, available: 2 },
    { id: 'EQ005', name: 'Amplifier 1000W', category: 'Amplifier', condition: 'Baik', qty: 2, available: 2 },
    { id: 'EQ006', name: 'Stand Microphone', category: 'Aksesoris', condition: 'Baik', qty: 6, available: 6 },
    { id: 'EQ007', name: 'Kabel Speaker 50m', category: 'Kabel', condition: 'Baik', qty: 4, available: 4 },
    { id: 'EQ008', name: 'CDJ Player', category: 'Player', condition: 'Baik', qty: 2, available: 2 },
    { id: 'EQ009', name: 'Monitor Stage', category: 'Speaker', condition: 'Baik', qty: 2, available: 2 },
    { id: 'EQ010', name: 'Equalizer 31 Band', category: 'Processor', condition: 'Baik', qty: 1, available: 1 }
];

// ==================== DATA STORE HELPERS ====================
window.getBookings = function() {
    return JSON.parse(localStorage.getItem(AppConfig.storageKeys.bookings) || '[]');
};
window.saveBookings = function(bookings) {
    localStorage.setItem(AppConfig.storageKeys.bookings, JSON.stringify(bookings));
};
window.getEquipment = function() {
    return JSON.parse(localStorage.getItem(AppConfig.storageKeys.equipment) || 'null') || DEFAULT_EQUIPMENT;
};
window.saveEquipment = function(equip) {
    localStorage.setItem(AppConfig.storageKeys.equipment, JSON.stringify(equip));
};

// ==================== UTILITY FUNCTIONS ====================
window.escapeHtml = function(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

window.formatDate = function(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

window.formatDateTime = function(isoStr) {
    if (!isoStr) return '-';
    return new Date(isoStr).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

window.statusBadge = function(status) {
    const map = {
        pending: '<span class="status-pending px-2.5 py-1 rounded-full text-xs font-semibold">Pending</span>',
        approved: '<span class="status-approved px-2.5 py-1 rounded-full text-xs font-semibold">Disetujui</span>',
        rejected: '<span class="status-rejected px-2.5 py-1 rounded-full text-xs font-semibold">Ditolak</span>',
        returned: '<span class="status-returned px-2.5 py-1 rounded-full text-xs font-semibold">Dikembalikan</span>'
    };
    return map[status] || status;
};