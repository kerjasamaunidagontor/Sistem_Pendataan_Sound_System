/**
 * ========================================
 * MODAL.JS - Modal & Toast Utilities
 * ========================================
 */

// ==================== MODAL ====================
window.openModal = function() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.closeModal = function() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// ==================== TOAST NOTIFICATIONS ====================
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const colors = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        info: 'bg-indigo-600'
    };
    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast-enter ${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]`;
    toast.innerHTML = `${icons[type]}<span class="text-sm font-medium">${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
  // Detail modal overlay click to close
  const detailModal = document.getElementById('detailModal');
  if (detailModal) {
    detailModal.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
  }
  
  // ✅ Share form modal overlay click to close
  const shareModal = document.getElementById('shareFormModal');
  if (shareModal) {
    shareModal.addEventListener('click', function(e) {
      if (e.target === this && typeof closeShareFormModal === 'function') {
        closeShareFormModal();
      }
    });
  }
  
  // ✅ Admin login modal overlay click to close
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('click', function(e) {
      if (e.target === this && typeof closeLoginModal === 'function') {
        closeLoginModal();
      }
    });
  }
});