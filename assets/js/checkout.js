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
    const coupon = localStorage.getItem('coupon') || '';
    const discount = calculateCouponDiscount(coupon, subtotal);
    const shipping = 0; // Free shipping
    const total = Math.max(0, subtotal + shipping - discount);
    
    // Update summary display
    subEl.textContent = formatCurrency(subtotal);
    const shippingEl = document.getElementById('summary-shipping');
    if (shippingEl) shippingEl.textContent = 'Free';
    const couponEl = document.getElementById('summary-coupon');
    if (couponEl) {
      if (coupon && discount > 0) {
        couponEl.innerHTML = `<div class="summary-line"><span>Coupon (${coupon.toUpperCase()})</span><span>- ${formatCurrency(discount)}</span></div>`;
      } else if (coupon && discount === 0) {
        couponEl.innerHTML = `<div class="summary-line"><span>Coupon (${coupon.toUpperCase()})</span><span class="text-danger">Invalid</span></div>`;
      } else {
        couponEl.innerHTML = '';
      }
    }
    totalEl.textContent = formatCurrency(total);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // require auth
    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
      const loginModalEl = document.getElementById('login-modal');
      if (loginModalEl && window.bootstrap) {
        const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
        loginModal.show();
      }
      showToast('Please sign in to complete your order', 'default');
      return;
    }
    // Clear cart and coupon after successful order
    writeCart([]);
    localStorage.removeItem('coupon');
    updateCartBadge();
    location.href = 'order-confirmation.html';
  });
});


