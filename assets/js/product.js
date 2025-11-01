document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('product-detail');
  if (!root) return;
  const id = getQuery().get('id');
  const p = getProductById(id);
  if (!p) { root.innerHTML = `<p>Product not found.</p>`; return; }

  root.innerHTML = `
    <div>
      <img class="product-detail__img" alt="${p.title}" src="${p.image}" />
    </div>
    <div class="product-detail__info">
      <div class="breadcrumbs"><a class="link" href="index.html">Home</a>›<a class="link" href="products.html?category=${encodeURIComponent(p.category)}">${p.category}</a>›<span>${p.title}</span></div>
      <div class="pill">${p.brand}</div>
      <h1>${p.title}</h1>
      <div class="product-card__meta" style="margin-bottom:8px">
        <span class="price">${formatCurrency(p.price)} <span class="mrp">${formatCurrency(p.mrp)}</span></span>
        <span class="offer">${p.discount}% off</span>
      </div>
      <div class="product-card__meta"><span class="rating">★ ${p.rating.toFixed(1)} · ${p.reviews.toLocaleString()} ratings</span><span>${p.delivery}</span></div>
      <p style="color: var(--muted)">${p.description}</p>
      <ul style="color: var(--muted); margin: 8px 0 0 18px;">
        <li>${p.return}</li>
        <li>Cash on Delivery eligible</li>
      </ul>
      <div class="row g-2" style="margin-top:12px">
        <div class="col-auto"><button class="btn btn--primary" onclick="addToCart('${p.id}', 1)">Add to cart</button></div>
        <div class="col-auto"><a class="btn btn--primary" href="checkout.html" onclick="addToCart('${p.id}', 1)">Buy Now</a></div>
        <div class="col-auto"><a class="btn" href="cart.html">Go to cart</a></div>
      </div>
    </div>`;
});


