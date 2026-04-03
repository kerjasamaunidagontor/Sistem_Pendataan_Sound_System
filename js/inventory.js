/**
 * ========================================
 * INVENTORY.JS - Inventaris Functions
 * ========================================
 */

// ==================== RENDER INVENTORY GRID ====================
window.renderInventory = function() {
    const equipment = getEquipment();
    const container = document.getElementById('inventoryGrid');
    if (!container) return;
    
    container.innerHTML = equipment.map(eq => {
        const usagePercent = eq.qty > 0 ? Math.round(((eq.qty - eq.available) / eq.qty) * 100) : 0;
        const barColor = usagePercent > 75 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500';
        return `
            <div class="bg-white rounded-xl shadow-sm p-5 card-hover">
                <div class="flex items-start justify-between mb-3">
                    <div><p class="font-mono text-xs text-indigo-400">${eq.id}</p><h4 class="font-semibold text-gray-800 mt-1">${escapeHtml(eq.name)}</h4><p class="text-xs text-gray-400">${escapeHtml(eq.category)}</p></div>
                    <span class="text-xs px-2 py-1 rounded-full ${eq.condition === 'Baik' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${eq.condition}</span>
                </div>
                <div class="mb-3">
                    <div class="flex justify-between text-sm mb-1"><span class="text-gray-500">Tersedia</span><span class="font-medium">${eq.available} / ${eq.qty}</span></div>
                    <div class="w-full bg-gray-200 rounded-full h-2"><div class="${barColor} h-2 rounded-full transition-all" style="width: ${usagePercent}%"></div></div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editEquipment('${eq.id}')" class="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">Edit</button>
                    <button onclick="deleteEquipment('${eq.id}')" class="text-sm px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition">Hapus</button>
                </div>
            </div>
        `;
    }).join('');
};

// ==================== ADD EQUIPMENT ====================
window.showAddEquipment = function() {
    const name = prompt('Nama peralatan:'); if (!name) return;
    const category = prompt('Kategori (Speaker, Mixer, Microphone, dll):') || 'Lainnya';
    const qty = parseInt(prompt('Jumlah total:') || '1');
    const equipment = getEquipment();
    const id = 'EQ' + (equipment.length + 1).toString().padStart(3, '0');
    
    equipment.push({ id, name, category, condition: 'Baik', qty, available: qty });
    saveEquipment(equipment);
    renderInventory();
    showToast('Peralatan berhasil ditambahkan!', 'success');
};

// ==================== EDIT EQUIPMENT ====================
window.editEquipment = function(id) {
    const equipment = getEquipment();
    const eq = equipment.find(e => e.id === id);
    if (!eq) return;
    
    const newQty = parseInt(prompt('Ubah jumlah total (saat ini: ' + eq.qty + '):', eq.qty));
    if (isNaN(newQty) || newQty < 0) return;
    
    eq.qty = newQty;
    eq.available = Math.min(eq.available, newQty);
    eq.condition = prompt('Kondisi (Baik/Rusak):', eq.condition) || eq.condition;
    saveEquipment(equipment);
    renderInventory();
    showToast('Peralatan berhasil diperbarui!', 'success');
};

// ==================== DELETE EQUIPMENT ====================
window.deleteEquipment = function(id) {
    if (!confirm('Hapus peralatan ini?')) return;
    let equipment = getEquipment();
    equipment = equipment.filter(e => e.id !== id);
    saveEquipment(equipment);
    renderInventory();
    showToast('Peralatan berhasil dihapus!', 'success');
};