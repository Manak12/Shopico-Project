document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  const featured = PRODUCTS.slice(0, 8);
  grid.innerHTML = featured.map(renderCard).join('');
});

function renderCard(p) {
  return `
    <article class="product-card">
      <a href="product.html?id=${p.id}"><img class="product-card__img" alt="${p.title}" src="${p.image}" loading="lazy"></a>
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


