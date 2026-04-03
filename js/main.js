/**
 * ========================================
 * MAIN.JS - Entry Point & Navigation
 * ========================================
 * Module: App initialization, navigation, event listeners
 */

// ==================== NAVIGATION ====================
window.navigateTo = function(page) {
    AppConfig.currentPage = page;
    
    // Hide all pages, show target
    document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('page-' + page)?.classList.remove('hidden');
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Update page title
    const titles = { dashboard: 'Dashboard', form: 'Form Peminjaman', approval: 'Approval', list: 'Data Peminjaman', inventory: 'Inventaris' };
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

    // Page-specific renders
    const pageRenders = {
        dashboard: updateDashboard,
        form: renderEquipmentCheckboxes,
        approval: renderApprovalList,
        list: renderBookingsList,
        inventory: renderInventory
    };
    if (pageRenders[page]) pageRenders[page]();

    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
        document.getElementById('sidebar')?.classList.add('-translate-x-full');
        document.getElementById('sidebarOverlay')?.classList.add('hidden');
    }
};

// ==================== TOGGLE SIDEBAR ====================
window.toggleSidebar = function() {
    document.getElementById('sidebar')?.classList.toggle('-translate-x-full');
    document.getElementById('sidebarOverlay')?.classList.toggle('hidden');
};

// ==================== INIT APP ====================
function initApp() {
    const today = new Date();
    document.getElementById('currentDate').textContent = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Set default dates for form
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
    
    const borrowDate = document.getElementById('borrowDate');
    const returnDate = document.getElementById('returnDate');
    if (borrowDate) borrowDate.value = tomorrow.toISOString().split('T')[0];
    if (returnDate) returnDate.value = nextWeek.toISOString().split('T')[0];

    updateDashboard();
    updateApprovalBadge();
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Modal overlay click to close
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    // Initialize app
    initApp();
});