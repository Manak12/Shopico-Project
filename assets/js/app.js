// Utilities and layout scaffolding shared across pages

const formatCurrency = (n) => `$${n.toFixed(2)}`;
const showToast = (msg, variant = 'default') => {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.style.position = 'fixed';
    host.style.left = '50%';
    host.style.transform = 'translateX(-50%)';
    host.style.bottom = '20px';
    host.style.display = 'grid';
    host.style.gap = '8px';
    host.style.zIndex = '50';
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  if (variant === 'success') {
    t.textContent = msg;
    t.style.background = '#ecfdf5';
    t.style.border = '1px solid #a7f3d0';
    t.style.color = '#065f46';
    t.style.padding = '12px 16px';
    t.style.borderRadius = '10px';
    t.style.boxShadow = '0 10px 30px rgba(0,0,0,0.10)';
    t.style.fontWeight = '600';
  } else {
    t.className = 'card';
    t.textContent = msg;
    t.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
  }
  host.appendChild(t);
  setTimeout(() => { t.remove(); }, 2400);
};

const readCart = () => {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
};
const writeCart = (cart) => { localStorage.setItem("cart", JSON.stringify(cart)); };

const getProductById = (id) => PRODUCTS.find(p => p.id === id);

const getQuery = () => new URLSearchParams(location.search);

const addToCart = (productId, qty = 1) => {
  const cart = readCart();
  const idx = cart.findIndex(i => i.id === productId);
  if (idx >= 0) cart[idx].qty += qty; else cart.push({ id: productId, qty });
  writeCart(cart);
  updateCartBadge();
  const p = getProductById(productId);
  if (p) showToast(`${p.title} added in the cart`, 'success');
};

const updateCartBadge = () => {
  const el = document.querySelector('#cart-count');
  if (!el) return;
  const count = readCart().reduce((a, i) => a + i.qty, 0);
  el.textContent = String(count);
};

const renderHeader = () => {
  const header = document.getElementById('site-header');
  if (!header) return;
  header.innerHTML = `
    <nav class="site-nav">
      <div class="container site-nav__inner">
        <a href="index.html" class="logo"><span class="logo__dot"></span>Shopico</a>
        <form id="site-search" class="search-bar" action="products.html">
          <select id="search-cat" name="category" class="select">
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <input id="search-q" name="q" class="input" placeholder="Search for products, brands and more" />
          <button class="btn btn--primary" type="submit">Search</button>
        </form>
        <div class="nav-links">
          <a href="products.html">Catalog</a>
          <button id="auth-btn" class="btn btn-auth" type="button">Sign in</button>
          <a class="cart-btn" href="cart.html">
            Cart
            <span id="cart-count" class="cart-count">0</span>
          </a>
        </div>
      </div>
    </nav>`;
  injectAuthModal();
};

const renderFooter = () => {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="container footer__inner">
      <div>© ${year} Shopico Pvt. Ltd.</div>
      <div class="footer__links">
        <a href="products.html">Catalog</a>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
      </div>
    </div>`;
};

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  updateCartBadge();
  // preload query in header search if present
  const q = getQuery();
  const qInput = document.getElementById('search-q');
  const qCat = document.getElementById('search-cat');
  if (qInput && q.get('q')) qInput.value = q.get('q');
  if (qCat && q.get('category')) qCat.value = q.get('category');
  bindAuth();
});

function injectAuthModal() {
  if (document.getElementById('auth-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.45)';
  modal.style.backdropFilter = 'blur(4px)';
  modal.style.display = 'none';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.innerHTML = `
    <div class="card" style="width:min(520px,92%); border-radius:16px; padding:22px; box-shadow:0 20px 60px rgba(0,0,0,0.2)">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px">
        <h2 style="margin:0; letter-spacing:-0.02em">Welcome back</h2>
        <button id="auth-close" class="btn" type="button">✕</button>
      </div>
      <p style="color:var(--muted); margin:6px 0 14px">Sign in to track orders and enjoy faster checkout.</p>
      <form id="auth-form" style="display:grid; gap:12px; margin-top:6px">
        <label>Email<input required id="auth-email" type="email" class="input" placeholder="you@example.com" /></label>
        <label>Password<input required id="auth-pass" type="password" class="input" placeholder="••••••••" /></label>
        <div style="display:flex; gap:10px; align-items:center; justify-content:flex-start">
          <button class="btn btn--primary" type="submit">Sign in</button>
          <button id="google-btn" class="btn" type="button">Sign in with Google</button>
        </div>
      </form>
      <small id="auth-msg" style="color:var(--muted); display:block; margin-top:8px"></small>
    </div>`;
  document.body.appendChild(modal);
}

function bindAuth() {
  const authBtn = document.getElementById('auth-btn');
  const modal = document.getElementById('auth-modal');
  const form = document.getElementById('auth-form');
  const closeBtn = document.getElementById('auth-close');
  const googleBtn = document.getElementById('google-btn');
  const msg = document.getElementById('auth-msg');
  const state = JSON.parse(localStorage.getItem('auth') || 'null');
  const updateButton = () => {
    const loggedIn = !!(JSON.parse(localStorage.getItem('auth') || 'null'));
    if (authBtn) authBtn.textContent = loggedIn ? 'Logout' : 'Sign in';
  };
  updateButton();
  if (authBtn) authBtn.onclick = () => {
    const loggedIn = !!(JSON.parse(localStorage.getItem('auth') || 'null'));
    if (loggedIn) { localStorage.removeItem('auth'); updateButton(); showToast('Logged out'); return; }
    if (modal) modal.style.display = 'flex';
  };
  if (closeBtn) closeBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
  if (modal) modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
  if (form) form.onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if (!email || !pass) { if (msg) msg.textContent = 'Please fill email and password.'; return; }
    localStorage.setItem('auth', JSON.stringify({ email }));
    updateButton();
    if (modal) modal.style.display = 'none';
    showToast('Signed in');
  };
  if (googleBtn) googleBtn.onclick = () => {
    // Placeholder for Google OAuth; simulate success
    localStorage.setItem('auth', JSON.stringify({ email: 'googleuser@example.com', provider: 'google' }));
    updateButton();
    if (modal) modal.style.display = 'none';
    showToast('Signed in with Google');
  };
}


