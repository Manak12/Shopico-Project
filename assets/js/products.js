document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('products-grid');
  const empty = document.getElementById('empty-state');
  const search = document.getElementById('search');
  const category = document.getElementById('category');
  const sort = document.getElementById('sort');

  // categories
  category.innerHTML = CATEGORIES.map(c => `<option${c === 'All' ? ' selected' : ''} value="${c}">${c}</option>`).join('');
  // hydrate from query params if navigated from header search
  const qp = new URLSearchParams(location.search);
  const qTerm = qp.get('q');
  const qCat = qp.get('category');
  if (qTerm) search.value = qTerm;
  if (qCat && CATEGORIES.includes(qCat)) category.value = qCat;

  const apply = () => {
    const term = (search.value || '').trim().toLowerCase();
    const cat = category.value;
    const sortKey = sort.value;
    let items = PRODUCTS.filter(p => (
      (!term || p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)) &&
      (cat === 'All' || p.category === cat)
    ));
    items = sortItems(items, sortKey);
    grid.innerHTML = items.map(renderCard).join('');
    empty.hidden = items.length !== 0;
    updateWishlistUI(); // Update wishlist icons after rendering
  };

  search.addEventListener('input', apply);
  category.addEventListener('change', apply);
  sort.addEventListener('change', apply);
  apply();
});

function sortItems(items, key) {
  const clone = [...items];
  switch (key) {
    case 'price-asc': return clone.sort((a,b) => a.price - b.price);
    case 'price-desc': return clone.sort((a,b) => b.price - a.price);
    case 'rating-desc': return clone.sort((a,b) => b.rating - a.rating);
    default: return clone; // popular as default order
  }
}

function renderCard(p) {
  return `
    <article class="product-card">
      <a href="product.html?id=${p.id}"><img class="product-card__img" alt="${p.title}" src="${p.image}" loading="lazy"></a>
      <button 
        class="wishlist-icon${isInWishlist(p.id) ? ' wishlisted' : ''}" 
        data-product-id="${p.id}"
        onclick="event.preventDefault(); toggleWishlistItem('${p.id}');"
        title="${isInWishlist(p.id) ? 'Remove from wishlist' : 'Add to wishlist'}"
      >
        <svg viewBox="0 0 24 24" fill="${isInWishlist(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
      <div class="product-card__body">
        <h3 class="product-card__title"><a class="link" href="product.html?id=${p.id}">${p.title}</a></h3>
        <div class="product-card__meta">
          <span class="price">${formatCurrency(p.price)} <span class="mrp">${formatCurrency(p.mrp)}</span></span>
          <span class="offer">${p.discount}% off</span>
        </div>
        <div class="product-card__meta"><span>${p.brand}</span><span class="rating">★ ${p.rating.toFixed(1)} · ${p.reviews.toLocaleString()} reviews</span></div>
        <div class="product-card__meta"><span>${p.delivery}</span><span>${p.return}</span></div>
        <button class="btn btn--primary" onclick="addToCart('${p.id}', 1)">Add to cart</button>
      </div>
    </article>`;
}


