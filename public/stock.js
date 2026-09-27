const stockMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
const stockState = { products: [] };
const stockMessage = document.querySelector('#stock-message');

if (window.lucide) window.lucide.createIcons();
function showStockMessage(text, type = 'error-message') { stockMessage.hidden = false; stockMessage.className = `message ${type}`; stockMessage.textContent = text; }
function dateLabel(value) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)); }
function renderInventory() {
  const body = document.querySelector('#inventory-body');
  if (!stockState.products.length) { body.innerHTML = '<tr><td colspan="4" class="empty-state">No products were returned by the store.</td></tr>'; return; }
  body.innerHTML = stockState.products.map((product) => {
    const low = product.stock_on_hand <= product.reorder_level;
    return `<tr class="${low ? 'low-stock-row' : ''}" data-id="${product.product_id}">
      <td><span class="product-name">${escapeStock(product.name)}</span>${low ? '<br><span class="stock-warning">Needs attention</span>' : ''}</td>
      <td><div class="price-edit"><span>₹</span><input class="price-input" type="number" min="0" step="0.01" value="${product.unit_price}"><button class="save-price" type="button">Save</button></div></td>
      <td>${product.stock_on_hand}</td><td>${product.reorder_level}</td>
    </tr>`;
  }).join('');
  body.querySelectorAll('.save-price').forEach((button) => button.addEventListener('click', savePrice));
}
function escapeStock(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
async function loadInventory() {
  try { const response = await fetch('/products'); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Inventory could not be loaded.'); stockState.products = data; renderInventory(); }
  catch (error) { showStockMessage(error.message); }
}
async function savePrice(event) {
  const row = event.target.closest('tr'); const input = row.querySelector('.price-input'); const productId = row.dataset.id; const unitPrice = Number(input.value); const button = event.target;
  if (!Number.isFinite(unitPrice) || unitPrice < 0) { showStockMessage('Enter a valid non-negative price.'); return; }
  button.disabled = true;
  try { const response = await fetch(`/products/${productId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unit_price: unitPrice }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Price could not be updated.'); stockState.products = stockState.products.map((product) => product.product_id === data.product_id ? data : product); renderInventory(); showStockMessage(`${data.name} was updated.`, 'status-message'); }
  catch (error) { showStockMessage(error.message); button.disabled = false; }
}
async function loadHistory() {
  const body = document.querySelector('#history-body'); body.innerHTML = '<tr><td colspan="3"><div class="loading-bar"></div></td></tr>';
  try { const response = await fetch('/purchase-history'); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Purchase history could not be loaded.'); body.innerHTML = data.length ? data.map((purchase) => `<tr><td>${dateLabel(purchase.purchase_date)}</td><td>${escapeStock(purchase.supplier_name || 'Unassigned supplier')}</td><td>${stockMoney.format(purchase.total_amount)}</td></tr>`).join('') : '<tr><td colspan="3" class="empty-state">No purchases have been recorded yet.</td></tr>'; }
  catch (error) { showStockMessage(error.message); body.innerHTML = ''; }
}
document.querySelectorAll('.toggle-button').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.toggle-button').forEach((item) => item.classList.toggle('active', item === button)); const inventory = button.dataset.view === 'inventory'; document.querySelector('#inventory-view').hidden = !inventory; document.querySelector('#history-view').hidden = inventory; if (!inventory) loadHistory(); }));
loadInventory();