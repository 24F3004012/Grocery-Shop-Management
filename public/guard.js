(async () => {
  try {
    const response = await fetch('/auth/me', { credentials: 'same-origin' });
    if (response.status === 401) {
      window.location.replace('/login.html');
      return;
    }
    if (!response.ok) return;
    const account = await response.json();
    document.querySelectorAll('.brand').forEach((brand) => { brand.textContent = account.store_name; });
  } catch (error) {
    // Individual screens display their own request errors.
  }
})();