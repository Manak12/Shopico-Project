document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('checkout-form');
  const itemsEl = document.getElementById('summary-items');
  const subEl = document.getElementById('summary-subtotal');
  const totalEl = document.getElementById('summary-total');

  const cart = readCart();
  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
    subEl.textContent = '$0.00';
    totalEl.textContent = '$0.00';
  } else {
    let subtotal = 0;
    itemsEl.innerHTML = cart.map(it => {
      const p = getProductById(it.id);
      const line = p.price * it.qty; subtotal += line;
      return `<div class="summary-line"><span>${p.title} × ${it.qty}</span><span>${formatCurrency(line)}</span></div>`;
    }).join('');
    const coupon = (localStorage.getItem('coupon') || '').toUpperCase();
    const discount = coupon === 'SAVE10' ? Math.round(subtotal * 0.10 * 100) / 100 : 0;
    subEl.textContent = formatCurrency(subtotal);
    totalEl.textContent = formatCurrency(Math.max(0, subtotal - discount));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Clear cart and redirect
    writeCart([]);
    updateCartBadge();
    location.href = 'order-confirmation.html';
  });
});


