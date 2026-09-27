const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
const state = { products: [], rows: [] };
const elements = {
  form: document.querySelector('#sale-form'),
  rows: document.querySelector('#sale-rows'),
  add: document.querySelector('#add-product'),
  cash: document.querySelector('#cash-received'),
  preview: document.querySelector('#preview-total'),
  complete: document.querySelector('#complete-sale'),
  error: document.querySelector('#sale-error'),
  status: document.querySelector('#sale-status'),
  confirmation: document.querySelector('#sale-confirmation'),
  confirmedTotal: document.querySelector('#confirmed-total'),
  confirmedChange: document.querySelector('#confirmed-change'),
  confirmedTime: document.querySelector('#confirmed-time'),
};

if (window.lucide) window.lucide.createIcons();

function showError(message) {
  elements.error.hidden = false;
  elements.error.textContent = message;
}

function clearMessages() {
  elements.error.hidden = true;
  elements.status.hidden = true;
}

function productOptions(selectedId) {
  return state.products.map((product) => `<option value="${product.product_id}" ${product.product_id === selectedId ? 'selected' : ''}>${escapeHtml(product.name)} · ${money.format(product.unit_price)}</option>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function getProduct(productId) {
  return state.products.find((product) => product.product_id === Number(productId));
}

function renderRows() {
  elements.rows.innerHTML = state.rows.map((row, index) => {
    const product = getProduct(row.productId);
    const amount = product ? product.unit_price * row.quantity : 0;
    return `<div class="sale-row" data-index="${index}">
      <label><span class="sr-only">Product ${index + 1}</span><select class="product-input" aria-label="Product ${index + 1}">${productOptions(row.productId)}</select></label>
      <label><span class="sr-only">Quantity ${index + 1}</span><input class="quantity-input" aria-label="Quantity ${index + 1}" type="number" min="1" step="1" value="${row.quantity}"></label>
      <span class="row-amount">${money.format(amount)}</span>
      <button class="remove-row" type="button" aria-label="Remove product ${index + 1}">×</button>
    </div>`;
  }).join('');
  elements.rows.querySelectorAll('.product-input').forEach((input) => input.addEventListener('change', onProductChange));
  elements.rows.querySelectorAll('.quantity-input').forEach((input) => input.addEventListener('input', onQuantityChange));
  elements.rows.querySelectorAll('.remove-row').forEach((button) => button.addEventListener('click', onRemoveRow));
  updatePreview();
}

function updatePreview() {
  const total = state.rows.reduce((sum, row) => {
    const product = getProduct(row.productId);
    return sum + (product ? product.unit_price * row.quantity : 0);
  }, 0);
  elements.preview.textContent = money.format(total);
}

function onProductChange(event) {
  state.rows[Number(event.target.closest('.sale-row').dataset.index)].productId = Number(event.target.value);
  renderRows();
}

function onQuantityChange(event) {
  const row = state.rows[Number(event.target.closest('.sale-row').dataset.index)];
  row.quantity = Math.max(1, Number.parseInt(event.target.value, 10) || 1);
  const product = getProduct(row.productId);
  event.target.closest('.sale-row').querySelector('.row-amount').textContent = money.format(product ? product.unit_price * row.quantity : 0);
  updatePreview();
}

function onRemoveRow(event) {
  if (state.rows.length === 1) return;
  state.rows.splice(Number(event.target.closest('.sale-row').dataset.index), 1);
  renderRows();
}

async function loadProducts() {
  try {
    const response = await fetch('/products');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Products could not be loaded.');
    state.products = data;
    if (state.products.length === 0) throw new Error('No products are available for sale.');
    state.rows = [{ productId: state.products[0].product_id, quantity: 1 }];
    renderRows();
    elements.add.disabled = false;
    elements.complete.disabled = false;
  } catch (error) {
    showError(error.message);
  }
}

elements.add.addEventListener('click', () => {
  state.rows.push({ productId: state.products[0].product_id, quantity: 1 });
  renderRows();
});

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessages();
  elements.complete.disabled = true;
  const payload = {
    customer_id: null,
    items: state.rows.map((row) => {
      const product = getProduct(row.productId);
      return { product_id: product.product_id, quantity: row.quantity, unit_price: product.unit_price };
    }),
    cash_received: Number(elements.cash.value),
  };

  try {
    const response = await fetch('/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The sale could not be completed.');
    elements.confirmedTotal.textContent = money.format(data.total_amount);
    elements.confirmedChange.textContent = money.format(data.change_given);
    elements.confirmedTime.textContent = `Recorded ${new Date(data.transaction_time).toLocaleString('en-IN')}. Session #${data.session_id}.`;
    elements.confirmation.hidden = false;
    elements.status.hidden = false;
    elements.status.textContent = 'The sale was saved successfully.';
    elements.form.reset();
    elements.cash.value = '';
  } catch (error) {
    showError(error.message);
  } finally {
    elements.complete.disabled = false;
  }
});

loadProducts();