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
