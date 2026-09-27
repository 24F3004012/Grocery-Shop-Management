const reportMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
async function loadReport() {
  try {
    const response = await fetch('/dashboard');
    if (response.status === 401) {
      window.location.replace('/login.html');
      return;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Reports could not be loaded.');
    document.querySelector('#report-cash').textContent = reportMoney.format(data.today_cash);
    document.querySelector('#report-sales').textContent = data.sales_count_today;
    document.querySelector('#report-credit').textContent = reportMoney.format(data.credit_outstanding);
    document.querySelector('#report-stock').textContent = data.low_stock_count;
  } catch (error) { const element = document.querySelector('#report-error'); element.hidden = false; element.textContent = error.message; }
}
if (window.lucide) window.lucide.createIcons();
loadReport();