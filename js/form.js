/**
 * ========================================
 * FORM.JS - Form Peminjaman Functions
 * ========================================
 */

// ==================== RENDER EQUIPMENT CHECKBOXES ====================
// Ini tetap sync karena hanya render UI dari DEFAULT_EQUIPMENT
window.renderEquipmentCheckboxes = function () {
  const equipment = window.DEFAULT_EQUIPMENT; // Gunakan default untuk cepat
  const container = document.getElementById("equipmentList");
  if (!container) return;

  container.innerHTML = equipment
    .map(
      (eq) => `
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition">
            <input type="checkbox" name="equipment" value="${eq.id}" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">${escapeHtml(eq.name)}</p>
                <p class="text-xs text-gray-400">Stok: ${eq.available}/${eq.qty}</p>
            </div>
        </label>
    `,
    )
    .join("");
};

// ==================== SUBMIT BOOKING (Async with Google Sheets API) ====================
// ==================== SUBMIT BOOKING (Async with Google Sheets API + Debug) ====================
// ==================== SUBMIT BOOKING (Async with Google Sheets API + Debug + Fix) ====================
window.submitBooking = async function (e) {
  e.preventDefault();

  // ===== VALIDATION (sama seperti original) =====
  const checked = document.querySelectorAll('input[name="equipment"]:checked');
  if (checked.length === 0) {
    showToast("Pilih minimal 1 peralatan!", "error");
    return;
  }

  const borrowDate = document.getElementById("borrowDate").value;
  const returnDate = document.getElementById("returnDate").value;
  if (returnDate < borrowDate) {
    showToast("Tanggal kembali harus setelah tanggal pinjam!", "error");
    return;
  }

  // ===== PREPARE DATA (sama seperti original) =====
  const equipment = window.DEFAULT_EQUIPMENT;
  const selectedItems = [];
  checked.forEach((cb) => {
    const eq = equipment.find((e) => e.id === cb.value);
    if (eq) selectedItems.push({ id: eq.id, name: eq.name, qty: 1 });
  });

  const id = "BK" + Date.now().toString().slice(-8);

  const booking = {
    id,
    borrowerName: document.getElementById("borrowerName").value.trim(),
    borrowerId: document.getElementById("borrowerId").value.trim(),
    borrowerPhone: document.getElementById("borrowerPhone").value.trim(),
    borrowerUnit: document.getElementById("borrowerUnit").value.trim(),
    purpose: document.getElementById("purpose").value.trim(),
    borrowDate,
    returnDate,
    equipment: selectedItems,
    notes: document.getElementById("notes").value.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
  };

  // ===== SAVE TO API (Async with fallback) =====
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="animate-pulse">Menyimpan...</span>';

  try {
    const result = await saveBooking(booking);

    if (result?.success) {
      // ✅ Success
      const message = result.local
        ? "✅ Disimpan lokal (offline mode)"
        : "✅ Peminjaman berhasil diajukan! Menunggu approval.";

      showToast(message, "success");

      // 📦 DEBUG LOG - Tambahkan ini untuk tracking
      console.log('📦 Debug - Booking saved:', {
        id: booking.id,
        apiSuccess: result?.success && !result?.local,
        localFallback: result?.local,
        localStorageCount: useLocalStorage().getBookings().length,
        timestamp: new Date().toISOString()
      });

      // Reset form
      document.getElementById("bookingForm").reset();
      renderEquipmentCheckboxes();

      // Reset dates to defaults
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      document.getElementById("borrowDate").value = tomorrow
        .toISOString()
        .split("T")[0];
      document.getElementById("returnDate").value = nextWeek
        .toISOString()
        .split("T")[0];

      // Show receipt modal
      showBookingReceipt(booking);

      // 🔄 FORCE REFRESH dengan delay lebih lama (1500ms untuk sync Google Sheets)
      setTimeout(async () => {
        console.log('🔄 Refreshing data from Google Sheets...');
        
        try {
          // ✅ FIX: GUNAKAN AppConfig.currentPage (bukan currentPage langsung)
          if (AppConfig.currentPage === 'dashboard') {
            console.log('  → Updating dashboard...');
            await updateDashboard();
          }
          if (AppConfig.currentPage === 'approval') {
            console.log('  → Rendering approval list...');
            await renderApprovalList();
          }
          if (AppConfig.currentPage === 'list') {
            console.log('  → Rendering bookings list...');
            await renderBookingsList();
          }
          console.log('  → Updating approval badge...');
          await updateApprovalBadge();
          
          console.log('✅ Refresh complete - Data synced');
        } catch (refreshError) {
          console.error('❌ Refresh failed:', refreshError);
          // Optional: show toast if refresh fails
          // showToast('Gagal refresh data', 'error');
        }
      }, 1500); // ⏱️ Naikkan dari 500ms ke 1500ms untuk Google Sheets sync
      
    } else {
      // ❌ API returned error
      throw new Error(result?.error || "Save failed");
    }
    
  } catch (error) {
    // ❌ Error handling (API failed or exception)
    console.error("Submit booking error:", error);

    // Fallback: Save to localStorage manually
    try {
      const local = useLocalStorage();
      const bookings = local.getBookings();
      bookings.push(booking);
      local.saveBookings(bookings);

      showToast("⚠️ Offline mode: Data disimpan lokal", "info");
      
      // Debug log for fallback
      console.log('📦 Fallback - Saved to localStorage:', {
        id: booking.id,
        totalLocalBookings: local.getBookings().length
      });

      // Still show receipt and reset form for good UX
      document.getElementById("bookingForm").reset();
      renderEquipmentCheckboxes();

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      document.getElementById("borrowDate").value = tomorrow
        .toISOString()
        .split("T")[0];
      document.getElementById("returnDate").value = nextWeek
        .toISOString()
        .split("T")[0];

      showBookingReceipt(booking);
      updateApprovalBadge();
      
    } catch (fallbackError) {
      // Double failure - show error
      console.error('❌ Double failure:', fallbackError);
      showToast("❌ Gagal menyimpan: " + error.message, "error");
    }
    
  } finally {
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
};

// ==================== RESET FORM ====================
window.resetForm = function () {
  renderEquipmentCheckboxes();
};
// ==================== SHARE FORM VIA QR CODE ====================

/**
 * Show modal with QR code for sharing the form
 */
window.showShareFormModal = function() {
  const modal = document.getElementById('shareFormModal');
  if (!modal) return;
  
  // Get current form values for pre-fill
  const baseUrl = window.location.href.split('?')[0];
  const params = new URLSearchParams();
  
  // Optional: Pre-fill unit/instansi
  if (document.getElementById('prefillUnit')?.checked) {
    const unit = document.getElementById('borrowerUnit')?.value?.trim();
    if (unit) params.set('unit', encodeURIComponent(unit));
  }
  
  // Optional: Pre-fill contact
  if (document.getElementById('prefillContact')?.checked) {
    const phone = document.getElementById('borrowerPhone')?.value?.trim();
    if (phone) params.set('phone', encodeURIComponent(phone));
  }
  
  // Build share URL
  const shareUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  
  // Update UI
  document.getElementById('shareFormURL').textContent = shareUrl;
  
  // Generate QR Code
  const qrContainer = document.getElementById('shareFormQR');
  if (qrContainer && typeof generateQRCodeLarge === 'function') {
    qrContainer.innerHTML = '';
    generateQRCodeLarge(qrContainer, shareUrl);
  }
  
  // Show modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

/**
 * Close share form modal
 */
window.closeShareFormModal = function() {
  const modal = document.getElementById('shareFormModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  // Clear QR code to save memory
  const qrContainer = document.getElementById('shareFormQR');
  if (qrContainer) qrContainer.innerHTML = '';
};

/**
 * Copy share link to clipboard
 */
window.copyShareLink = function() {
  const url = document.getElementById('shareFormURL')?.textContent;
  if (!url) return;
  
  navigator.clipboard.writeText(url).then(() => {
    showToast('📋 Link berhasil disalin!', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('📋 Link berhasil disalin!', 'success');
  });
};

/**
 * Auto-fill form from URL parameters (on page load)
 */
window.prefillFormFromURL = function() {
  const params = new URLSearchParams(window.location.search);
  
  // Pre-fill unit/instansi
  if (params.has('unit')) {
    const unitInput = document.getElementById('borrowerUnit');
    if (unitInput) {
      unitInput.value = decodeURIComponent(params.get('unit'));
    }
  }
  
  // Pre-fill phone
  if (params.has('phone')) {
    const phoneInput = document.getElementById('borrowerPhone');
    if (phoneInput) {
      phoneInput.value = decodeURIComponent(params.get('phone'));
    }
  }
  
  // Pre-fill other fields as needed
  if (params.has('name')) {
    const nameInput = document.getElementById('borrowerName');
    if (nameInput) {
      nameInput.value = decodeURIComponent(params.get('name'));
    }
  }
  
  if (params.has('id')) {
    const idInput = document.getElementById('borrowerId');
    if (idInput) {
      idInput.value = decodeURIComponent(params.get('id'));
    }
  }
  
  // Show toast if form was pre-filled
  if (params.toString()) {
    console.log('📝 Form pre-filled from URL params:', Object.fromEntries(params));
    // Optional: showToast('📋 Form diisi otomatis dari link', 'info');
  }
};
// Auto-prefill form when page loads with URL params
document.addEventListener('DOMContentLoaded', function() {
  if (AppConfig.currentPage === 'form') {
    prefillFormFromURL();
  }
});