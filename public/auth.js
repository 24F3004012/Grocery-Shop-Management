function showAuthError(message) {
  const element = document.querySelector('#auth-error');
  element.hidden = false;
  element.textContent = message;
}

async function submitAuth(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  button.disabled = true;
  document.querySelector('#auth-error').hidden = true;
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch(form.dataset.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Authentication failed.');
    window.location.href = '/';
  } catch (error) {
    showAuthError(error.message);
    button.disabled = false;
  }
}

document.querySelector('#auth-form').addEventListener('submit', submitAuth);
