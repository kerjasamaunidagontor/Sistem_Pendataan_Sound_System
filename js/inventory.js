/**
 * ========================================
 * INVENTORY.JS - Inventaris Functions (ASYNC)
 * ========================================
 */

// ==================== RENDER INVENTORY GRID (ASYNC + Admin Check) ====================
window.renderInventory = async function () {
  try {
    // ✅ Check admin access first
    if (typeof isAdminLoggedIn === 'function' && !isAdminLoggedIn()) {
      const container = document.getElementById('inventoryGrid');
      if (container) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <p class="text-gray-500 mb-2">🔒 Akses Dibatasi</p>
            <p class="text-sm text-gray-400 mb-4">Halaman ini hanya untuk admin</p>
            <button onclick="showLoginModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
              Login sebagai Admin
            </button>
          </div>
        `;
      }
      return;
    }
    
    // ✅ Admin logged in - proceed with normal render
    const equipment = await getEquipment();
    const container = document.getElementById("inventoryGrid");

    if (!container) {
      console.warn("inventoryGrid element not found");
      return;
    }

    if (!equipment || equipment.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <p class="text-gray-500 mb-4">Belum ada data inventaris</p>
          <button onclick="showAddEquipment()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            + Tambah Peralatan
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = equipment
      .map((eq) => {
        const usagePercent =
          eq.qty > 0 ? Math.round(((eq.qty - eq.available) / eq.qty) * 100) : 0;
        const barColor =
          usagePercent > 75
            ? "bg-red-500"
            : usagePercent > 50
              ? "bg-amber-500"
              : "bg-emerald-500";

        return `
        <div class="bg-white rounded-xl shadow-sm p-5 card-hover">
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="font-mono text-xs text-indigo-400">${eq.id}</p>
              <h4 class="font-semibold text-gray-800 mt-1">${escapeHtml(eq.name)}</h4>
              <p class="text-xs text-gray-400">${escapeHtml(eq.category)}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full ${eq.condition === "Baik" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}">
              ${eq.condition}
            </span>
          </div>
          
          <div class="mb-3">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Tersedia</span>
              <span class="font-medium">${eq.available} / ${eq.qty}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="${barColor} h-2 rounded-full transition-all" style="width: ${usagePercent}%"></div>
            </div>
            <p class="text-xs text-gray-400 mt-1">${usagePercent}% sedang dipinjam</p>
          </div>
          
          <div class="flex gap-2">
            <button onclick="editEquipment('${eq.id}')" class="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
              ✏️ Edit
            </button>
            <button onclick="deleteEquipment('${eq.id}')" class="text-sm px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition">
              🗑️ Hapus
            </button>
          </div>
        </div>
      `;
      })
      .join("");
      
  } catch (e) {
    console.error("Render inventory error:", e);
    showToast("Gagal memuat data inventaris: " + e.message, "error");
  }
};

// ==================== ADD EQUIPMENT ====================
// ==================== ADD EQUIPMENT ====================
window.showAddEquipment = async function () {
  const name = prompt("Nama peralatan:");
  if (!name) return;

  const category =
    prompt("Kategori (Speaker, Mixer, Microphone, dll):") || "Lainnya";
  const qtyInput = prompt("Jumlah total:", "1");
  const qty = parseInt(qtyInput) || 1;

  if (qty < 1) {
    showToast("Jumlah harus minimal 1", "error");
    return;
  }

  // 🔍 Generate ID unik - ambil SEMUA equipment dari Sheets
  const equipment = await getEquipment();

  // Cari nomor ID tertinggi yang ada
  let maxNum = 0;
  equipment.forEach((eq) => {
    if (eq.id && eq.id.startsWith("EQ")) {
      const num = parseInt(eq.id.replace("EQ", ""));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  // Generate ID baru (maxNum + 1)
  const newNum = maxNum + 1;
  const id = "EQ" + newNum.toString().padStart(3, "0");

  console.log("🆔 Generated new ID:", id, "(Max was:", maxNum + ")");

  const newEquipment = {
    id: id, // ✅ Pastikan ID unik
    name: name.trim(),
    category: category.trim(),
    condition: "Baik",
    qty: qty,
    available: qty,
  };

  // Simpan langsung ke Google Sheets
  const result = await updateEquipment(newEquipment);
  console.log("💾 Save result:", result);

  // Refresh UI
  await renderInventory();

  showToast("✅ Peralatan berhasil ditambahkan!", "success");
};

// ==================== EDIT EQUIPMENT ====================
window.editEquipment = async function (id) {
  try {
    const equipment = await getEquipment();
    const eq = equipment.find((e) => e.id === id);

    if (!eq) {
      showToast("Peralatan tidak ditemukan", "error");
      return;
    }

    const newName = prompt("Nama peralatan:", eq.name);
    if (newName === null) return;

    const newCategory = prompt("Kategori:", eq.category) || eq.category;
    const newQtyInput = prompt(
      "Jumlah total (saat ini: " + eq.qty + "):",
      eq.qty,
    );
    const newQty = parseInt(newQtyInput);

    if (isNaN(newQty) || newQty < 0) {
      showToast("Jumlah tidak valid", "error");
      return;
    }

    const newCondition =
      prompt("Kondisi (Baik/Rusak):", eq.condition) || eq.condition;
    const newAvailable =
      parseInt(
        prompt(
          "Jumlah tersedia (saat ini: " + eq.available + "):",
          eq.available,
        ),
      ) || eq.available;

    // Update object
    const updatedEquipment = {
      id: eq.id,
      name: newName.trim(),
      category: newCategory.trim(),
      condition: newCondition.trim(),
      qty: newQty,
      available: Math.min(newAvailable, newQty),
    };

    // Update langsung ke Google Sheets
    await updateEquipment(updatedEquipment);

    // Refresh UI
    await renderInventory();

    showToast("✅ Peralatan berhasil diperbarui!", "success");
  } catch (e) {
    console.error("Edit equipment error:", e);
    showToast("❌ Gagal mengedit: " + e.message, "error");
  }
};

// ==================== DELETE EQUIPMENT ====================
window.deleteEquipment = async function (id) {
  if (
    !confirm(
      "Hapus peralatan ini secara permanen?\n\nTindakan ini tidak dapat dibatalkan."
    )
  ) {
    return;
  }

  try {
    // ✅ PANGGIL API (bukan dirinya sendiri)
    await deleteEquipmentAPI(id);

    // Refresh UI
    await renderInventory();

    showToast("✅ Peralatan berhasil dihapus!", "success");
  } catch (e) {
    console.error("Delete equipment error:", e);
    showToast("❌ Gagal menghapus: " + e.message, "error");
  }
};
