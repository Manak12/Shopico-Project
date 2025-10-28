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
                <div class="rating" style="color:var(--muted)">★ ${p.rating}</div>
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
    const coupon = (localStorage.getItem('coupon') || '').toUpperCase();
    const discount = coupon === 'SAVE10' ? Math.round(subtotal * 0.10 * 100) / 100 : 0;
    const total = Math.max(0, subtotal - discount);

    container.innerHTML = `
      <div class="card">
        ${itemsHtml}
      </div>
      <aside class="card summary">
        <h2>Summary</h2>
        <div class="summary-line"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
        <div class="summary-line"><span>Shipping</span><span>Free</span></div>
        <div class="summary-line"><span>Coupon</span><span>${discount ? `- ${formatCurrency(discount)}` : '-'}</span></div>
        <div class="coupon" style="margin-top:8px">
          <input id="coupon-input" class="input" placeholder="Apply coupon (e.g., SAVE10)" />
          <button id="coupon-apply" class="btn">Apply</button>
        </div>
        <div class="summary-line total"><span>Total</span><span>${formatCurrency(total)}</span></div>
        <div class="summary-line"><span>Delivery</span><span>Estimated in 2–4 days</span></div>
        <a class="btn btn--primary" href="checkout.html">Checkout</a>
      </aside>`;
    const inp = document.getElementById('coupon-input');
    const btn = document.getElementById('coupon-apply');
    if (inp && btn) {
      inp.value = coupon || '';
      btn.onclick = () => { localStorage.setItem('coupon', inp.value.trim()); render(); };
    }
  };

  window.increment = (id) => { const c = readCart(); const i = c.find(x=>x.id===id); if (i) { i.qty++; writeCart(c); updateCartBadge(); render(); } };
  window.decrement = (id) => { const c = readCart(); const i = c.find(x=>x.id===id); if (i && i.qty>1) { i.qty--; } else { const idx=c.findIndex(x=>x.id===id); if(idx>=0) c.splice(idx,1); } writeCart(c); updateCartBadge(); render(); };
  window.removeItem = (id) => { const c = readCart().filter(x=>x.id!==id); writeCart(c); updateCartBadge(); render(); };

  render();
});


