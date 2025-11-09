// Utilities and layout scaffolding shared across pages

const formatCurrency = (n) => `$${n.toFixed(2)}`;

// Cart storage - each user has their own cart in localStorage
const getCartKey = () => {
  const sess = getSession();
  return sess && sess.email ? `cart_${sess.email}` : 'cart_guest';
};

// Wishlist storage - each user has their own wishlist
const getWishlistKey = () => {
  const sess = getSession();
  return sess && sess.email ? `wishlist_${sess.email}` : 'wishlist_guest';
};

const readWishlist = () => {
  try { return JSON.parse(localStorage.getItem(getWishlistKey()) || "[]"); } catch { return []; }
};

const writeWishlist = (items) => {
  localStorage.setItem(getWishlistKey(), JSON.stringify(items));
  updateWishlistUI(); // Update any wishlist indicators
};

const toggleWishlistItem = (productId) => {
  if (!isAuthenticated()) {
    showToast('Please sign in to add items to your wishlist', 'default');
    const loginModalEl = document.getElementById('login-modal');
    if (loginModalEl && window.bootstrap) {
      const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
      loginModal.show();
    }
    return false;
  }
  
  const wishlist = readWishlist();
  const idx = wishlist.indexOf(productId);
  if (idx >= 0) {
    wishlist.splice(idx, 1);
    showToast('Removed from wishlist', 'default');
  } else {
    wishlist.push(productId);
    showToast('Added to wishlist', 'success');
  }
  writeWishlist(wishlist);
  return idx < 0; // returns true if added, false if removed
};

const isInWishlist = (productId) => {
  return readWishlist().includes(productId);
};

// When user logs in, merge guest wishlist with their wishlist
const mergeGuestWishlist = () => {
  const guestItems = JSON.parse(localStorage.getItem('wishlist_guest') || '[]');
  if (guestItems.length === 0) return;
  
  const userItems = readWishlist();
  guestItems.forEach(id => {
    if (!userItems.includes(id)) userItems.push(id);
  });
  writeWishlist(userItems);
  localStorage.removeItem('wishlist_guest');
};

const updateWishlistUI = () => {
  // Update all wishlist icons in the page
  const icons = document.querySelectorAll('.wishlist-icon');
  const wishlist = readWishlist();
  icons.forEach(icon => {
    const productId = icon.dataset.productId;
    if (!productId) return;
    const isWishlisted = wishlist.includes(productId);
    icon.classList.toggle('wishlisted', isWishlisted);
    icon.setAttribute('title', isWishlisted ? 'Remove from wishlist' : 'Add to wishlist');
  });

  // Update wishlist counter in header
  const wishlistCount = document.getElementById('wishlist-count');
  if (wishlistCount) {
    wishlistCount.textContent = wishlist.length;
  }
};

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
  try { return JSON.parse(localStorage.getItem(getCartKey()) || "[]"); } catch { return []; }
};
const writeCart = (cart) => { localStorage.setItem(getCartKey(), JSON.stringify(cart)); };

// When user logs in, merge guest cart with their cart
const mergeGuestCart = () => {
  const guestCart = JSON.parse(localStorage.getItem('cart_guest') || '[]');
  if (guestCart.length === 0) return; // no guest items
  
  const userCart = readCart(); // gets cart for current user
  guestCart.forEach(item => {
    const existing = userCart.find(i => i.id === item.id);
    if (existing) existing.qty += item.qty;
    else userCart.push(item);
  });
  writeCart(userCart);
  localStorage.removeItem('cart_guest'); // clean up guest cart
  updateCartBadge();
};

const getProductById = (id) => PRODUCTS.find(p => p.id === id);

const getQuery = () => new URLSearchParams(location.search);

// -----------------------
// Authentication helpers
// -----------------------
// Users are stored in localStorage under key `users` as array of { email, passwordHash, salt, createdAt }
const encodeHex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,'0')).join('');
const fromHex = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i*2,2), 16);
  return bytes;
};

const genSalt = (len = 16) => {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return encodeHex(arr.buffer);
};

const hashPassword = async (password, saltHex) => {
  const encoder = new TextEncoder();
  const pw = encoder.encode(password + saltHex);
  const digest = await crypto.subtle.digest('SHA-256', pw);
  return encodeHex(digest);
};

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem('users') || '[]'); } catch { return []; }
};
const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

const findUserByEmail = (email) => getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());

const createUser = async (email, password, name) => {
  if (findUserByEmail(email)) {
    throw new Error('A user with this email already exists');
  }
  const salt = genSalt();
  const passwordHash = await hashPassword(password, salt);
  const u = { 
    email, 
    passwordHash, 
    salt, 
    name: name || email.split('@')[0], 
    createdAt: new Date().toISOString() 
  };
  const users = getUsers(); 
  users.push(u); 
  saveUsers(users);
  // Return user object without sensitive data
  return {
    email: u.email,
    name: u.name,
    createdAt: u.createdAt
  };
};

// Seed some dummy users for testing (runs once if no users exist)
const seedDummyUsers = async () => {
  try {
    let existing = getUsers();
    
    // Update existing users to ensure they have names
    if (existing && existing.length > 0) {
      let needsUpdate = false;
      existing = existing.map(user => {
        if (!user.name) {
          needsUpdate = true;
          user.name = user.email.split('@')[0];
        }
        return user;
      });
      if (needsUpdate) {
        saveUsers(existing);
      }
      return;
    }
    
    // Create new seed users if none exist
    const seeds = [
      { email: 'alice@example.com', password: 'password123', name: 'Alice Smith' },
      { email: 'bob@example.com', password: 'mysecret', name: 'Bob Johnson' }
    ];
    for (const s of seeds) {
      try {
        await createUser(s.email, s.password, s.name);
      } catch (e) {

      }
    }
    console.info('Auth seed: created dummy users');
  } catch (e) {
    console.warn('Auth seed failed', e);
  }
};

const authenticateUser = async (email, password) => {
  const u = findUserByEmail(email);
  if (!u) return null;
  const h = await hashPassword(password, u.salt);
  if (h === u.passwordHash) {
    // Return full user object including name
    return {
      email: u.email,
      name: u.name || u.email.split('@')[0],
      createdAt: u.createdAt
    };
  }
  return null;
};

// Session handling: store `auth` in localStorage with { email, provider, token, expiresAt }
const createSession = (opts) => {
  const token = genSalt(24);
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24h
  
  // If we have an email, get the user's full info
  if (opts.email) {
    const user = findUserByEmail(opts.email);
    if (user) {
      opts.name = user.name;
    }
  }
  
  const auth = Object.assign({ token, expiresAt }, opts);
  localStorage.setItem('auth', JSON.stringify(auth));
  
  // When creating a new session (login)
  if (opts.email) {
    // First check for backed up state from previous session
    const backupCart = localStorage.getItem(`backup_cart_${opts.email}`);
    const backupWishlist = localStorage.getItem(`backup_wishlist_${opts.email}`);
    
    if (backupCart) {
      localStorage.setItem(`cart_${opts.email}`, backupCart);
      localStorage.removeItem(`backup_cart_${opts.email}`);
    }
    
    if (backupWishlist) {
      localStorage.setItem(`wishlist_${opts.email}`, backupWishlist);
      localStorage.removeItem(`backup_wishlist_${opts.email}`);
    }
    
    // Then merge any guest data
    mergeGuestCart();
    mergeGuestWishlist();
    
    // Update UI to reflect restored state
    updateCartBadge();
    updateWishlistUI();
  }
  
  updateAuthUi();
  return auth;
};

const clearSession = () => { 
  // Store current session email before clearing
  const currentSession = getSession();
  const userEmail = currentSession ? currentSession.email : null;
  
  // Clear auth
  localStorage.removeItem('auth');
  
  // If we had a user session, save their state
  if (userEmail) {
    // Save user's cart and wishlist state before clearing
    const userCart = JSON.parse(localStorage.getItem(`cart_${userEmail}`) || '[]');
    const userWishlist = JSON.parse(localStorage.getItem(`wishlist_${userEmail}`) || '[]');
    
    // Store in temporary backup
    if (userCart.length > 0) {
      localStorage.setItem(`backup_cart_${userEmail}`, JSON.stringify(userCart));
    }
    if (userWishlist.length > 0) {
      localStorage.setItem(`backup_wishlist_${userEmail}`, JSON.stringify(userWishlist));
    }
  }
  
  // Reset to guest state
  writeCart([]);
  writeWishlist([]);
  
  // Update UI
  updateCartBadge();
  updateWishlistUI();
  updateAuthUi();
};

const getSession = () => {
  try {
    const a = JSON.parse(localStorage.getItem('auth') || 'null');
    if (!a) return null;
    if (a.expiresAt && Date.now() > a.expiresAt) { clearSession(); return null; }
    return a;
  } catch { return null; }
};

const isAuthenticated = () => !!getSession();

const logout = () => {
  // Get current location to handle special pages
  const currentPath = window.location.pathname.toLowerCase();
  const protectedPages = ['wishlist.html', 'checkout.html'];
  
  clearSession();
  showToast('Logged out', 'default');
  
  // If on a protected page, redirect to home
  if (protectedPages.some(page => currentPath.endsWith(page))) {
    window.location.href = 'index.html';
  }
};

const updateAuthUi = () => {
  const sess = getSession();
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userEmailEl = document.getElementById('user-email');
  if (sess) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userEmailEl) {
      // First try session name
      let displayName = sess.name;
      
      // If no name in session but we have email
      if (!displayName && sess.email) {
        // Try to get from stored user data
        const user = findUserByEmail(sess.email);
        if (user && user.name) {
          displayName = user.name;
        } else {
          // Fallback to email username
          displayName = sess.email.split('@')[0];
        }
        // Update session with name for future use
        sess.name = displayName;
        localStorage.setItem('auth', JSON.stringify(sess));
      }
      
      userEmailEl.textContent = displayName ? `Hello, ${displayName}` : '';
    }
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userEmailEl) userEmailEl.textContent = '';
  }
};

// Coupon code calculation - extracts discount percentage from codes like SAVE10, SAVE20, etc.
const calculateCouponDiscount = (couponCode, subtotal) => {
  if (!couponCode || !subtotal || subtotal <= 0) return 0;
  const code = couponCode.trim().toUpperCase();
  // Match pattern: SAVE followed by numbers (e.g., SAVE10, SAVE20, SAVE50)
  const match = code.match(/^SAVE(\d+)$/);
  if (!match) return 0;
  const discountPercent = parseInt(match[1], 10);
  if (discountPercent < 0 || discountPercent > 100) return 0; // Limit to 0-100%
  return Math.round((subtotal * discountPercent / 100) * 100) / 100; // Round to 2 decimals
};

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
        <div class="nav-links">
          <a href="index.html">Home</a>
          <a href="products.html">Products</a>
          <span id="user-email" class="user-email" style="margin-right:8px;font-weight:600;color:var(--muted)"></span>
          <button id="login-btn" class="btn btn-auth" type="button">Sign in</button>
          <button id="logout-btn" class="btn btn-auth" type="button" style="display:none;margin-left:6px">Sign out</button>
          <a class="cart-btn" href="wishlist.html">
            Wishlist
            <span id="wishlist-count" class="cart-count">0</span>
          </a>
          <a class="cart-btn" href="cart.html">
            Cart
            <span id="cart-count" class="cart-count">0</span>
          </a>
        </div>
      </div>
    </nav>`;
  injectLoginModal();
  injectSignupModal();
  // Wire logout button
  const logoutBtnEl = document.getElementById('logout-btn');
  if (logoutBtnEl) logoutBtnEl.onclick = () => { logout(); };
  updateAuthUi();
};

const renderFooter = () => {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="container footer__inner">
      <div>© ${year} Shopico Pvt. Ltd.</div>
      <div class="footer__links">
        <a href="privacy.html">Privacy</a>
        <a href="terms.html">Terms</a>
      </div>
    </div>`;
};

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  updateCartBadge();
  updateWishlistUI();
  // preload query in header search if present
  const q = getQuery();
  const qInput = document.getElementById('search-q');
  const qCat = document.getElementById('search-cat');
  if (qInput && q.get('q')) qInput.value = q.get('q');
  if (qCat && q.get('category')) qCat.value = q.get('category');
  // seed dummy users for testing (non-destructive)
  seedDummyUsers().then(() => {
    bindLogin();
    bindSignup();
  });
});

// Optional: set your Google Client ID to enable real Google Sign-In via GIS
// Example: window.GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
window.GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '';

function injectSignupModal() {
  if (document.getElementById('signup-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'signup-modal';
  modal.className = 'modal fade login-modal-custom';
  modal.tabIndex = -1;
  modal.setAttribute('aria-labelledby', 'signup-modal-label');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content login-modal-content">
        <div class="modal-header login-modal-header">
          <h5 class="modal-title" id="signup-modal-label">Sign up</h5>
          <button type="button" class="btn-close login-close-btn" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body login-modal-body">
          <form id="signup-form" autocomplete="on">
            <div class="mb-4">
              <label for="signup-name" class="form-label login-label">Name</label>
              <input required id="signup-name" type="text" class="form-control login-input" placeholder="" />
              <small class="login-error-message" id="signup-name-error"></small>
            </div>
            <div class="mb-4">
              <label for="signup-email" class="form-label login-label">E-mail</label>
              <input required id="signup-email" type="email" class="form-control login-input" placeholder="" />
              <small class="login-error-message" id="signup-email-error"></small>
            </div>
            <div class="mb-4">
              <label for="signup-password" class="form-label login-label">Password</label>
              <div class="password-input-wrapper">
                <input required id="signup-password" type="password" class="form-control login-input" placeholder="" />
                <button type="button" class="password-toggle-btn" id="signup-password-toggle" aria-label="Toggle password visibility">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              <small class="login-error-message" id="signup-password-error"></small>
            </div>
            <div class="mb-4">
              <label for="signup-confirm-password" class="form-label login-label">Confirm Password</label>
              <div class="password-input-wrapper">
                <input required id="signup-confirm-password" type="password" class="form-control login-input" placeholder="" />
                <button type="button" class="password-toggle-btn" id="signup-confirm-password-toggle" aria-label="Toggle password visibility">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              <small class="login-error-message" id="signup-confirm-password-error"></small>
      </div>
            <button type="submit" class="btn login-submit-btn w-100">Sign up</button>
            <div class="text-center mt-4">
              <a href="#" class="signup-toggle-link" id="login-toggle">Already have an account? Sign in</a>
        </div>
            <small id="signup-msg" class="text-danger d-block mt-2 text-center"></small>
      </form>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function injectLoginModal() {
  if (document.getElementById('login-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'login-modal';
  modal.className = 'modal fade login-modal-custom';
  modal.tabIndex = -1;
  modal.setAttribute('aria-labelledby', 'login-modal-label');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content login-modal-content">
        <div class="modal-header login-modal-header">
          <h5 class="modal-title" id="login-modal-label">Log in</h5>
          <button type="button" class="btn-close login-close-btn" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body login-modal-body">
          <form id="login-form" autocomplete="on">
            <div class="mb-4">
              <label for="login-email" class="form-label login-label">E-mail</label>
              <input required id="login-email" type="email" class="form-control login-input" placeholder="" />
              <small class="login-error-message" id="email-error"></small>
            </div>
            <div class="mb-3">
              <label for="login-password" class="form-label login-label">Password</label>
              <div class="password-input-wrapper">
                <input required id="login-password" type="password" class="form-control login-input" placeholder="" />
                <button type="button" class="password-toggle-btn" id="password-toggle" aria-label="Toggle password visibility">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              <small class="login-error-message" id="password-error"></small>
            </div>
            <div class="text-center mb-4">
              <a href="#" class="forgot-password-link" id="forgot-password">Forgot your password?</a>
            </div>
            <button type="submit" class="btn login-submit-btn w-100">Login</button>
            <div class="text-center mt-4">
              <a href="#" class="signup-toggle-link" id="signup-toggle">Don't have an account? Sign up</a>
            </div>
            <small id="login-msg" class="text-danger d-block mt-2 text-center"></small>
          </form>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  
  // Add custom styles
  if (!document.getElementById('login-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'login-modal-styles';
    style.textContent = `
      /* Wishlist icon styles */
      .wishlist-icon {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: none;
        padding: 0;
        color: #9ca3af;
        transition: all 0.2s ease;
      }
      .wishlist-icon:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .wishlist-icon svg {
        width: 20px;
        height: 20px;
        transition: all 0.2s ease;
      }
      .wishlist-icon.wishlisted {
        color: #ef4444;
      }
      .wishlist-icon.wishlisted svg {
        fill: currentColor;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
      }
      @keyframes wishlistPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      .wishlist-icon.wishlisted svg {
        animation: wishlistPop 0.3s ease;
      }
      .login-modal-custom .modal-dialog {
        max-width: 450px;
      }
      .login-modal-content {
        border: none;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }
      .login-modal-header {
        border-bottom: none;
        padding: 30px 30px 20px;
        background: white;
      }
      .login-modal-header .modal-title {
        font-size: 28px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
      }
      .login-close-btn {
        background: #f5f5f5;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        opacity: 1;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
      }
      .login-close-btn:hover {
        background: #e0e0e0;
      }
      .login-close-btn::before {
        content: '×';
        font-size: 24px;
        color: #1a1a1a;
        line-height: 1;
      }
      .login-modal-body {
        padding: 0 30px 30px;
        background: white;
      }
      .login-label {
        color: #4a4a4a;
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 8px;
      }
      .login-input {
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: 16px;
        transition: all 0.2s ease;
        background: white;
      }
      .login-input:focus {
        border-color: #2a62ff;
        box-shadow: 0 0 0 3px rgba(42, 98, 255, 0.22);
        outline: none;
      }
      .login-input.is-invalid {
        border-color: #dc2626;
      }
      .login-input.is-invalid:focus {
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.22);
      }
      .password-input-wrapper {
        position: relative;
      }
      .password-toggle-btn {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .password-toggle-btn:hover {
        color: #2a62ff;
      }
      .password-toggle-btn svg {
        display: block;
      }
      .forgot-password-link {
        color: #2a62ff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
      }
      .forgot-password-link:hover {
        color: #1e4ed8;
        text-decoration: underline;
      }
      .login-submit-btn {
        background: linear-gradient(135deg, #2a62ff 0%, #4f46e5 100%);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(42, 98, 255, 0.3);
        transition: all 0.2s ease;
      }
      .login-submit-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(42, 98, 255, 0.4);
        background: linear-gradient(135deg, #1e4ed8 0%, #4338ca 100%);
      }
      .login-submit-btn:active {
        transform: translateY(0);
      }
      .signup-toggle-link {
        color: #2a62ff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
      }
      .signup-toggle-link:hover {
        color: #1e4ed8;
        text-decoration: underline;
      }
      .login-modal-custom .modal-backdrop {
        background: linear-gradient(135deg, rgba(42, 98, 255, 0.4), rgba(79, 70, 229, 0.3));
        backdrop-filter: blur(8px);
      }
      .login-error-message {
        color: #dc2626;
        font-size: 13px;
        margin-top: 4px;
        display: block;
      }
    `;
    document.head.appendChild(style);
  }
}

// Validation functions
const validateEmail = (email) => {
  if (!email) return { valid: false, message: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true, message: '' };
};

const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true, message: '' };
};

function bindLogin() {
  const btn = document.getElementById('login-btn');
  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-msg');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const passwordToggle = document.getElementById('password-toggle');
  const modalEl = document.getElementById('login-modal');
  const signupToggle = document.getElementById('signup-toggle');
  let modal;
  if (modalEl && window.bootstrap) {
    modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  }
  if (btn && modal) {
    btn.onclick = () => {
      // Reset form when opening modal
      if (emailInput) {
        emailInput.value = '';
        emailInput.classList.remove('is-invalid');
      }
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.setAttribute('type', 'password');
        passwordInput.classList.remove('is-invalid');
      }
      if (emailError) emailError.textContent = '';
      if (passwordError) passwordError.textContent = '';
      if (msg) msg.textContent = '';
      modal.show();
    };
  }
  
  // Real-time email validation
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      const validation = validateEmail(email);
      if (!validation.valid) {
        emailInput.classList.add('is-invalid');
        if (emailError) emailError.textContent = validation.message;
      } else {
        emailInput.classList.remove('is-invalid');
        if (emailError) emailError.textContent = '';
      }
    });
    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('is-invalid')) {
        const email = emailInput.value.trim();
        const validation = validateEmail(email);
        if (validation.valid) {
          emailInput.classList.remove('is-invalid');
          if (emailError) emailError.textContent = '';
        }
      }
    });
  }
  
  // Real-time password validation
  if (passwordInput) {
    passwordInput.addEventListener('blur', () => {
      const password = passwordInput.value;
      const validation = validatePassword(password);
      if (!validation.valid) {
        passwordInput.classList.add('is-invalid');
        if (passwordError) passwordError.textContent = validation.message;
      } else {
        passwordInput.classList.remove('is-invalid');
        if (passwordError) passwordError.textContent = '';
      }
    });
    passwordInput.addEventListener('input', () => {
      if (passwordInput.classList.contains('is-invalid')) {
        const password = passwordInput.value;
        const validation = validatePassword(password);
        if (validation.valid) {
          passwordInput.classList.remove('is-invalid');
          if (passwordError) passwordError.textContent = '';
        }
      }
    });
  }
  
  // Password toggle visibility
  if (passwordToggle && passwordInput) {
    passwordToggle.onclick = () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      // Update icon to show/hide
      const svg = passwordToggle.querySelector('svg path');
      if (type === 'text') {
        svg.setAttribute('d', 'M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.82L19.56 16.74C21.07 15.49 22.26 13.86 23 12C21.27 7.11 17 4 12 4C10.6 4 9.26 4.28 8.03 4.78L10.17 6.92C10.74 6.34 11.35 6 12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C11.35 12 10.74 11.66 10.17 11.08L8.03 13.22C9.26 13.72 10.6 14 12 14C14.76 14 17 11.76 17 9C17 8.35 16.87 7.74 16.64 7.18L13.72 4.26C13.15 4.09 12.59 4 12 4ZM2 4.27L4.28 6.55L4.73 7L2.81 8.92C2.3 9.43 2 10.17 2 11V19C2 20.1 2.9 21 4 21H18.73L20.73 23L22 21.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.5 16.8 12.77 17 12 17C9.24 17 7 14.76 7 12C7 11.23 7.2 10.5 7.53 9.8Z');
      } else {
        svg.setAttribute('d', 'M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z');
      }
    };
  }
  
  // Forgot password handler
  const forgotPassword = document.getElementById('forgot-password');
  if (forgotPassword) {
    forgotPassword.onclick = (e) => {
      e.preventDefault();
      showToast('Password reset link will be sent to your email', 'default');
      if (modal) modal.hide();
    };
  }
  
  // Sign up toggle - switch to sign-up modal
  if (signupToggle) {
    signupToggle.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.hide();
      const signupModalEl = document.getElementById('signup-modal');
      if (signupModalEl && window.bootstrap) {
        const signupModal = bootstrap.Modal.getOrCreateInstance(signupModalEl);
        setTimeout(() => signupModal.show(), 300);
      }
    };
  }
  
  if (form) form.onsubmit = (e) => {
    e.preventDefault();
    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passwordInput ? passwordInput.value : '';
    
    // Clear previous errors
    if (msg) msg.textContent = '';
    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';
    if (emailInput) emailInput.classList.remove('is-invalid');
    if (passwordInput) passwordInput.classList.remove('is-invalid');
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      if (emailInput) emailInput.classList.add('is-invalid');
      if (emailError) emailError.textContent = emailValidation.message;
      return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(pass);
    if (!passwordValidation.valid) {
      if (passwordInput) passwordInput.classList.add('is-invalid');
      if (passwordError) passwordError.textContent = passwordValidation.message;
      return;
    }
    
    // All validations passed - authenticate against local user store
    (async () => {
      try {
        const user = await authenticateUser(email, pass);
        if (!user) {
          if (msg) msg.textContent = 'Invalid email or password';
          return;
        }
        createSession({ email: user.email, name: user.name, provider: 'password' });
        if (modal) modal.hide();
        showToast('Logged in successfully', 'success');
      } catch (err) {
        if (msg) msg.textContent = err.message || 'Login failed';
      }
    })();
  };
  
  // Google Sign-In (optional)
  if (window.GOOGLE_CLIENT_ID) {
    loadGoogleScript(() => {
      if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
              client_id: window.GOOGLE_CLIENT_ID,
              callback: (response) => {
                // Try to extract email from the credential JWT payload if present
                let emailFromJwt = '';
                try {
                  const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
                  if (payload && payload.email) emailFromJwt = payload.email;
                } catch (e) { /* ignore */ }
                createSession({ provider: 'google', credential: response.credential, email: emailFromJwt });
                if (modal) modal.hide();
                showToast('Signed in with Google', 'success');
              }
            });
      }
    });
  }
}

function simulateGoogleLogin(modal) {
  createSession({ email: 'googleuser@example.com', provider: 'google' });
  if (modal) modal.hide();
  showToast('Signed in with Google', 'success');
}

function loadGoogleScript(onload) {
  if (document.getElementById('google-identity')) { onload(); return; }
  const s = document.createElement('script');
  s.id = 'google-identity';
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  s.onload = onload;
  document.head.appendChild(s);
}

function bindSignup() {
  const form = document.getElementById('signup-form');
  const msg = document.getElementById('signup-msg');
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm-password');
  const emailError = document.getElementById('signup-email-error');
  const passwordError = document.getElementById('signup-password-error');
  const confirmPasswordError = document.getElementById('signup-confirm-password-error');
  const passwordToggle = document.getElementById('signup-password-toggle');
  const confirmPasswordToggle = document.getElementById('signup-confirm-password-toggle');
  const modalEl = document.getElementById('signup-modal');
  const loginToggle = document.getElementById('login-toggle');
  let modal;
  if (modalEl && window.bootstrap) {
    modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    
    // Reset form when modal is shown
    modalEl.addEventListener('show.bs.modal', () => {
      if (emailInput) {
        emailInput.value = '';
        emailInput.classList.remove('is-invalid');
      }
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.setAttribute('type', 'password');
        passwordInput.classList.remove('is-invalid');
      }
      if (confirmPasswordInput) {
        confirmPasswordInput.value = '';
        confirmPasswordInput.setAttribute('type', 'password');
        confirmPasswordInput.classList.remove('is-invalid');
      }
      if (emailError) emailError.textContent = '';
      if (passwordError) passwordError.textContent = '';
      if (confirmPasswordError) confirmPasswordError.textContent = '';
      if (msg) msg.textContent = '';
    });
  }
  
  // Real-time email validation
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      const validation = validateEmail(email);
      if (!validation.valid) {
        emailInput.classList.add('is-invalid');
        if (emailError) emailError.textContent = validation.message;
      } else {
        emailInput.classList.remove('is-invalid');
        if (emailError) emailError.textContent = '';
      }
    });
    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('is-invalid')) {
        const email = emailInput.value.trim();
        const validation = validateEmail(email);
        if (validation.valid) {
          emailInput.classList.remove('is-invalid');
          if (emailError) emailError.textContent = '';
        }
      }
    });
  }
  
  // Real-time password validation
  if (passwordInput) {
    passwordInput.addEventListener('blur', () => {
      const password = passwordInput.value;
      const validation = validatePassword(password);
      if (!validation.valid) {
        passwordInput.classList.add('is-invalid');
        if (passwordError) passwordError.textContent = validation.message;
      } else {
        passwordInput.classList.remove('is-invalid');
        if (passwordError) passwordError.textContent = '';
      }
      // Check password match if confirm password has value
      if (confirmPasswordInput && confirmPasswordInput.value) {
        if (password !== confirmPasswordInput.value) {
          confirmPasswordInput.classList.add('is-invalid');
          if (confirmPasswordError) confirmPasswordError.textContent = 'Passwords do not match';
        } else {
          confirmPasswordInput.classList.remove('is-invalid');
          if (confirmPasswordError) confirmPasswordError.textContent = '';
        }
      }
    });
    passwordInput.addEventListener('input', () => {
      if (passwordInput.classList.contains('is-invalid')) {
        const password = passwordInput.value;
        const validation = validatePassword(password);
        if (validation.valid) {
          passwordInput.classList.remove('is-invalid');
          if (passwordError) passwordError.textContent = '';
        }
      }
    });
  }
  
  // Real-time confirm password validation
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('blur', () => {
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPasswordInput.value;
      if (!confirmPassword) {
        confirmPasswordInput.classList.add('is-invalid');
        if (confirmPasswordError) confirmPasswordError.textContent = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        confirmPasswordInput.classList.add('is-invalid');
        if (confirmPasswordError) confirmPasswordError.textContent = 'Passwords do not match';
      } else {
        confirmPasswordInput.classList.remove('is-invalid');
        if (confirmPasswordError) confirmPasswordError.textContent = '';
      }
    });
    confirmPasswordInput.addEventListener('input', () => {
      if (confirmPasswordInput.classList.contains('is-invalid')) {
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput.value;
        if (password === confirmPassword && confirmPassword) {
          confirmPasswordInput.classList.remove('is-invalid');
          if (confirmPasswordError) confirmPasswordError.textContent = '';
        }
      }
    });
  }
  
  // Password toggle visibility
  if (passwordToggle && passwordInput) {
    passwordToggle.onclick = () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      const svg = passwordToggle.querySelector('svg path');
      if (type === 'text') {
        svg.setAttribute('d', 'M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.82L19.56 16.74C21.07 15.49 22.26 13.86 23 12C21.27 7.11 17 4 12 4C10.6 4 9.26 4.28 8.03 4.78L10.17 6.92C10.74 6.34 11.35 6 12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C11.35 12 10.74 11.66 10.17 11.08L8.03 13.22C9.26 13.72 10.6 14 12 14C14.76 14 17 11.76 17 9C17 8.35 16.87 7.74 16.64 7.18L13.72 4.26C13.15 4.09 12.59 4 12 4ZM2 4.27L4.28 6.55L4.73 7L2.81 8.92C2.3 9.43 2 10.17 2 11V19C2 20.1 2.9 21 4 21H18.73L20.73 23L22 21.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.5 16.8 12.77 17 12 17C9.24 17 7 14.76 7 12C7 11.23 7.2 10.5 7.53 9.8Z');
      } else {
        svg.setAttribute('d', 'M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z');
      }
    };
  }
  
  if (confirmPasswordToggle && confirmPasswordInput) {
    confirmPasswordToggle.onclick = () => {
      const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      confirmPasswordInput.setAttribute('type', type);
      const svg = confirmPasswordToggle.querySelector('svg path');
      if (type === 'text') {
        svg.setAttribute('d', 'M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.82L19.56 16.74C21.07 15.49 22.26 13.86 23 12C21.27 7.11 17 4 12 4C10.6 4 9.26 4.28 8.03 4.78L10.17 6.92C10.74 6.34 11.35 6 12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C11.35 12 10.74 11.66 10.17 11.08L8.03 13.22C9.26 13.72 10.6 14 12 14C14.76 14 17 11.76 17 9C17 8.35 16.87 7.74 16.64 7.18L13.72 4.26C13.15 4.09 12.59 4 12 4ZM2 4.27L4.28 6.55L4.73 7L2.81 8.92C2.3 9.43 2 10.17 2 11V19C2 20.1 2.9 21 4 21H18.73L20.73 23L22 21.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.5 16.8 12.77 17 12 17C9.24 17 7 14.76 7 12C7 11.23 7.2 10.5 7.53 9.8Z');
      } else {
        svg.setAttribute('d', 'M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z');
      }
    };
  }
  
  // Login toggle - switch to login modal
  if (loginToggle) {
    loginToggle.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.hide();
      const loginModalEl = document.getElementById('login-modal');
      if (loginModalEl && window.bootstrap) {
        const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
        setTimeout(() => loginModal.show(), 300);
      }
    };
  }
  
  if (form) form.onsubmit = (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('signup-name');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
    
    // Clear previous errors
    if (msg) msg.textContent = '';
    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';
    if (confirmPasswordError) confirmPasswordError.textContent = '';
    if (nameInput) nameInput.classList.remove('is-invalid');
    if (emailInput) emailInput.classList.remove('is-invalid');
    if (passwordInput) passwordInput.classList.remove('is-invalid');
    if (confirmPasswordInput) confirmPasswordInput.classList.remove('is-invalid');
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      if (emailInput) emailInput.classList.add('is-invalid');
      if (emailError) emailError.textContent = emailValidation.message;
      return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      if (passwordInput) passwordInput.classList.add('is-invalid');
      if (passwordError) passwordError.textContent = passwordValidation.message;
      return;
    }
    
    // Validate password match
    if (!confirmPassword) {
      if (confirmPasswordInput) confirmPasswordInput.classList.add('is-invalid');
      if (confirmPasswordError) confirmPasswordError.textContent = 'Please confirm your password';
      return;
    }
    if (password !== confirmPassword) {
      if (confirmPasswordInput) confirmPasswordInput.classList.add('is-invalid');
      if (confirmPasswordError) confirmPasswordError.textContent = 'Passwords do not match';
      return;
    }
    
    // Validate name
    if (!name) {
      const nameError = document.getElementById('signup-name-error');
      if (nameError) nameError.textContent = 'Name is required';
      if (nameInput) nameInput.classList.add('is-invalid');
      return;
    }

    // All validations passed - create user and auto-login
    (async () => {
      try {
        const user = await createUser(email, password, name);
        createSession({ 
          email: user.email, 
          name: user.name,
          provider: 'password' 
        });
        if (modal) modal.hide();
        showToast('Account created successfully!', 'success');
      } catch (err) {
        if (msg) msg.textContent = err.message || 'Sign up failed';
      }
    })();
  };
}
 