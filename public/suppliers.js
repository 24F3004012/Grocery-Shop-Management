const supplierMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
const supplierMessage = document.querySelector('#supplier-message');
if (window.lucide) window.lucide.createIcons();
function showSupplierError(text) { supplierMessage.hidden = false; supplierMessage.className = 'message error-message'; supplierMessage.textContent = text; }
function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
function dateLabel(value) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)); }
function escapeSupplier(value) { return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
async function loadSuppliers() {
  try { const response = await fetch('/suppliers'); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Suppliers could not be loaded.'); const list = document.querySelector('#supplier-list'); list.innerHTML = data.length ? data.map((supplier) => `<a class="card supplier-row" href="/suppliers.html?id=${supplier.supplier_id}"><span class="avatar">${escapeSupplier(initials(supplier.name))}</span><span class="supplier-copy"><span class="supplier-name">${escapeSupplier(supplier.name)}</span><span class="muted">${escapeSupplier(supplier.phone || 'No phone listed')}</span></span><i class="icon" data-lucide="arrow-right"></i></a>`).join('') : '<div class="card empty-state">No suppliers have been recorded yet.</div>'; if (window.lucide) window.lucide.createIcons(); } catch (error) { showSupplierError(error.message); }
}
async function loadSupplierDetail(id) {
  document.querySelector('#supplier-list-view').hidden = true; document.querySelector('#supplier-detail-view').hidden = false;
  try { const response = await fetch(`/suppliers/${id}`); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Supplier could not be loaded.'); document.querySelector('#supplier-title').textContent = data.name; document.querySelector('#supplier-detail').innerHTML = `<h2>${escapeSupplier(data.name)}</h2><p>${escapeSupplier(data.phone || 'No phone listed')}</p>`; const purchases = document.querySelector('#supplier-purchases'); purchases.innerHTML = data.purchases.length ? data.purchases.map((purchase) => `<tr><td>${dateLabel(purchase.purchase_date)}</td><td>#${purchase.purchase_id}</td><td>${supplierMoney.format(purchase.total_amount)}</td></tr>`).join('') : '<tr><td colspan="3" class="empty-state">No purchases recorded for this supplier.</td></tr>'; } catch (error) { showSupplierError(error.message); }
}
const supplierId = new URLSearchParams(window.location.search).get('id');
if (supplierId) loadSupplierDetail(supplierId); else loadSuppliers();