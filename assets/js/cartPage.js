document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cart-container');
  if (!container) return;

  const render = () => {
    const cart = readCart();
    if (cart.length === 0) {
      container.innerHTML = `<div class="empty-state card"><p>Your cart is empty.</p><a class="btn btn--primary" href="products.html">Browse products</a></div>`;
      return;
    }

    const itemsHtml = cart.map(it => {
      const p = getProductById(it.id);
      const line = p.price * it.qty;
      return `
        <div class="cart-item">
          <img alt="${p.title}" src="${p.image}" />
          <div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px">
              <div>
                <div class="pill">${p.category}</div>
                <h3 style="margin:4px 0 6px">${p.title}</h3>
                <div class="rating" style="color:var(--muted)">★ ${p.rating.toFixed(1)}</div>
              </div>
              <button class="btn btn--danger" onclick="removeItem('${p.id}')">Remove</button>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px">
              <div class="qty">
                <button class="btn" onclick="decrement('${p.id}')">-</button>
                <span>${it.qty}</span>
                <button class="btn" onclick="increment('${p.id}')">+</button>
              </div>
              <div class="price">${formatCurrency(line)}</div>
            </div>
          </div>
        </div>`;
    }).join('');

    const subtotal = cart.reduce((sum, it) => {
      const p = getProductById(it.id); return sum + p.price * it.qty;
    }, 0);
    const coupon = localStorage.getItem('coupon') || '';
    const discount = calculateCouponDiscount(coupon, subtotal);
    const total = Math.max(0, subtotal - discount);

    container.innerHTML = `
      <div class="card">
        ${itemsHtml}
      </div>
      <aside class="card summary">
        <h2>Summary</h2>
        <div class="summary-line"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
        <div class="summary-line"><span>Shipping</span><span>Free</span></div>
        <div class="summary-line"><span>Coupon${coupon ? ` (${coupon.toUpperCase()})` : ''}</span><span>${discount ? `- ${formatCurrency(discount)}` : '-'}</span></div>
        <div class="coupon" style="margin-top:8px">
          <input id="coupon-input" class="input" placeholder="Enter code (e.g., SAVE10, SAVE20)" value="${coupon}" />
          ${coupon && discount > 0 ? `<button id="coupon-remove" class="btn btn-sm btn-outline-danger" type="button">Remove</button>` : '<button id="coupon-apply" class="btn">Apply</button>'}
        </div>
        ${coupon && discount === 0 ? '<small class="text-danger mt-1 d-block">Invalid coupon code</small>' : ''}
        <div class="summary-line total"><span>Total</span><span>${formatCurrency(total)}</span></div>
        <div class="summary-line"><span>Delivery</span><span>Estimated in 2–4 days</span></div>
        <button id="checkout-btn" class="btn btn--primary" type="button">Checkout</button>
      </aside>`;
    // protect checkout: show login modal if not authenticated
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.onclick = (e) => {
        if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
          const loginModalEl = document.getElementById('login-modal');
          if (loginModalEl && window.bootstrap) {
            const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
            loginModal.show();
            showToast('Please sign in to proceed to checkout', 'default');
            return;
          }
          showToast('Please sign in to proceed to checkout', 'default');
          return;
        }
        location.href = 'checkout.html';
      };
    }
    const inp = document.getElementById('coupon-input');
    const applyBtn = document.getElementById('coupon-apply');
    const removeBtn = document.getElementById('coupon-remove');
    if (inp) {
      inp.value = coupon || '';
      if (applyBtn) {
        applyBtn.onclick = () => {
          const code = inp.value.trim();
          localStorage.setItem('coupon', code);
          const testDiscount = calculateCouponDiscount(code, subtotal);
          if (code && testDiscount > 0) {
            showToast(`Coupon ${code.toUpperCase()} applied! ${Math.round((testDiscount / subtotal) * 100)}% off`, 'success');
          } else if (code && testDiscount === 0) {
            showToast('Invalid coupon code', 'default');
          }
          render();
        };
      }
      if (removeBtn) {
        removeBtn.onclick = () => {
          localStorage.removeItem('coupon');
          inp.value = '';
          showToast('Coupon removed', 'success');
          render();
        };
      }
    }
  };

  window.increment = (id) => { const c = readCart(); const i = c.find(x=>x.id===id); if (i) { i.qty++; writeCart(c); updateCartBadge(); render(); } };
  window.decrement = (id) => { const c = readCart(); const i = c.find(x=>x.id===id); if (i && i.qty>1) { i.qty--; } else { const idx=c.findIndex(x=>x.id===id); if(idx>=0) c.splice(idx,1); } writeCart(c); updateCartBadge(); render(); };
  window.removeItem = (id) => { const c = readCart().filter(x=>x.id!==id); writeCart(c); updateCartBadge(); render(); };

  render();
});


