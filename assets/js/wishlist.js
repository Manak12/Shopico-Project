document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('wishlist-grid');
  const empty = document.getElementById('empty-state');

  // Require authentication
  if (!isAuthenticated()) {
    empty.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="64" height="64" style="margin:0 auto 16px">
        <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V5C20 3.89543 19.1046 3 18 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21ZM15 7V7.01" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3>Please sign in to view your wishlist</h3>
      <p style="margin:0 0 16px">Sign in to save and view your favorite items.</p>
      <button class="btn btn--primary" onclick="document.getElementById('login-btn').click()">Sign In</button>
    `;
    empty.hidden = false;
    grid.innerHTML = '';
    return;
  }

  const render = () => {
    const wishlist = readWishlist();
    const items = wishlist.map(id => getProductById(id)).filter(Boolean);
    const user = findUserByEmail(getSession().email);
    
    if (items.length === 0) {
      grid.innerHTML = '';
      empty.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="64" height="64" style="margin:0 auto 16px">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h3>Hi ${user.name}, your wishlist is empty</h3>
        <p style="margin:0 0 16px">Browse our products and add your favorite items to your wishlist.</p>
        <a href="products.html" class="btn btn--primary">Start Shopping</a>
      `;
      empty.hidden = false;
      return;
    }

    grid.innerHTML = items.map(p => `
      <article class="product-card">
        <a href="product.html?id=${p.id}">
          <img class="product-card__img" alt="${p.title}" src="${p.image}" loading="lazy">
        </a>
        <button 
          class="wishlist-icon wishlisted" 
          data-product-id="${p.id}"
          onclick="event.preventDefault(); removeFromWishlist('${p.id}');"
          title="Remove from wishlist"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <div class="product-card__body">
          <h3 class="product-card__title">
            <a class="link" href="product.html?id=${p.id}">${p.title}</a>
          </h3>
          <div class="product-card__meta">
            <span class="price">${formatCurrency(p.price)} <span class="mrp">${formatCurrency(p.mrp)}</span></span>
            <span class="offer">${p.discount}% off</span>
          </div>
          <div class="product-card__meta">
            <span>${p.brand}</span>
            <span class="rating">★ ${p.rating.toFixed(1)} · ${p.reviews.toLocaleString()} reviews</span>
          </div>
          <div class="product-card__meta">
            <span>${p.delivery}</span>
            <span>${p.return}</span>
          </div>
          <button class="btn btn--primary" onclick="addToCartAndRemove('${p.id}', 1)">Add to cart</button>
        </div>
      </article>`).join('');
    empty.hidden = true;
  };

  // Remove from wishlist with animation
  window.removeFromWishlist = (productId) => {
    const card = document.querySelector(`[data-product-id="${productId}"]`).closest('.product-card');
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    setTimeout(() => {
      toggleWishlistItem(productId);
      render();
    }, 300);
  };

  // Add to cart and remove from wishlist
  window.addToCartAndRemove = (productId, qty) => {
    addToCart(productId, qty);
    removeFromWishlist(productId);
  };

  render();
});