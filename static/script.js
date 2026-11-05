const products = [
  {
    id: "studio-headphones",
    name: "Studio Wireless Headphones",
    category: "Audio",
    label: "BESTSELLER",
    price: 16900,
    oldPrice: 20900,
    rating: 4.9,
    reviews: 284,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Over-ear wireless headphones",
  },
  {
    id: "everyday-speaker",
    name: "Everyday Bluetooth Speaker",
    category: "Audio",
    label: "GOOD SOUND",
    price: 10500,
    oldPrice: null,
    rating: 4.8,
    reviews: 196,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Compact speaker for everyday listening",
  },
  {
    id: "desk-lamp",
    name: "The Focus Desk Lamp",
    category: "Workspace",
    label: "STAFF PICK",
    price: 11500,
    oldPrice: null,
    rating: 4.9,
    reviews: 142,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Minimal desk lamp on a workspace",
  },
  {
    id: "wireless-keyboard",
    name: "Quiet Type Wireless Keyboard",
    category: "Workspace",
    label: "A LITTLE QUIETER",
    price: 12900,
    oldPrice: 15500,
    rating: 4.7,
    reviews: 108,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Wireless keyboard with a clean, modern design",
  },
  {
    id: "smart-watch",
    name: "All Day Smart Watch",
    category: "Everyday",
    label: "JUST LANDED",
    price: 19500,
    oldPrice: null,
    rating: 4.8,
    reviews: 87,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Minimal everyday wristwatch",
  },
  {
    id: "instant-camera",
    name: "Little Moments Camera",
    category: "Everyday",
    label: "A GOOD GIFT",
    price: 14500,
    oldPrice: 16900,
    rating: 4.9,
    reviews: 173,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Compact digital camera",
  },
  {
    id: "gaming-controller",
    name: "Play Anywhere Controller",
    category: "Gaming",
    label: "LEVEL UP",
    price: 8900,
    oldPrice: null,
    rating: 4.8,
    reviews: 231,
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Wireless game controller",
  },
  {
    id: "wireless-earbuds",
    name: "Pocket-Sized Wireless Buds",
    category: "Audio",
    label: "EVERYDAY FAVORITE",
    price: 7500,
    oldPrice: 9500,
    rating: 4.7,
    reviews: 316,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Wireless earbuds and charging case",
  },
];

const FREE_SHIPPING_THRESHOLD = 10000;
const CART_STORAGE_KEY = "veyronix-cart";
const FAVORITES_STORAGE_KEY = "veyronix-favorites";
const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const cartDrawer = document.querySelector(".cart-drawer");
const overlay = document.querySelector(".overlay");
const cartItems = document.querySelector(".cart-items");
const toast = document.querySelector(".toast");

let activeFilter = "All";
let searchQuery = "";
let favoritesOnly = false;
let cart = loadStoredObject(CART_STORAGE_KEY, {});
let favorites = new Set(loadStoredObject(FAVORITES_STORAGE_KEY, []));
let toastTimeout;

function loadStoredObject(key, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (key === CART_STORAGE_KEY && stored && typeof stored === "object" && !Array.isArray(stored)) {
      return stored;
    }
    if (key === FAVORITES_STORAGE_KEY && Array.isArray(stored)) {
      return stored.filter((id) => typeof id === "string");
    }
  } catch (error) {
    console.warn(`Could not read ${key} from local storage.`, error);
  }
  return fallback;
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key} to local storage.`, error);
  }
}

function formatPrice(price) {
  return `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(price)}`;
}

function getVisibleProducts() {
  const query = searchQuery.trim().toLowerCase();
  const visible = products.filter((product) => {
    const matchesCategory = activeFilter === "All" || product.category === activeFilter;
    const matchesSearch = !query || `${product.name} ${product.category} ${product.label}`.toLowerCase().includes(query);
    const matchesFavorite = !favoritesOnly || favorites.has(product.id);
    return matchesCategory && matchesSearch && matchesFavorite;
  });

  const sorting = document.querySelector("#sort-products").value;
  if (sorting === "price-low") visible.sort((a, b) => a.price - b.price);
  if (sorting === "price-high") visible.sort((a, b) => b.price - a.price);
  if (sorting === "rating") visible.sort((a, b) => b.rating - a.rating);
  return visible;
}

function renderProducts() {
  const visible = getVisibleProducts();
  document.querySelector(".empty-state").hidden = visible.length > 0;
  productGrid.innerHTML = visible.map((product) => `
    <article class="product-card">
      <div class="product-image">
        <img src="${product.image}" alt="${product.imageAlt}" loading="lazy" />
        <span class="product-badge">${product.label}</span>
        <button class="favorite-button${favorites.has(product.id) ? " is-favorite" : ""}" type="button" data-favorite="${product.id}" aria-label="${favorites.has(product.id) ? "Remove from" : "Add to"} wishlist: ${product.name}" aria-pressed="${favorites.has(product.id)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 8.6c0 5.2-8.4 10-8.4 10s-8.4-4.8-8.4-10A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.4 2.2Z" /></svg>
        </button>
      </div>
      <div class="product-info">
        <div class="product-meta"><span>${product.category.toUpperCase()}</span><span class="product-rating">★ <span>${product.rating} (${product.reviews})</span></span></div>
        <h3 class="product-title">${product.name}</h3>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}${product.oldPrice ? `<span class="product-old-price">${formatPrice(product.oldPrice)}</span>` : ""}</span>
          <button class="add-button" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">+</button>
        </div>
      </div>
    </article>
  `).join("");
}

function getCartQuantity() {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

function getCartSubtotal() {
  return products.reduce((total, product) => total + product.price * (cart[product.id] || 0), 0);
}

function renderCart() {
  const quantity = getCartQuantity();
  const subtotal = getCartSubtotal();
  const hasItems = quantity > 0;

  document.querySelector(".cart-count").textContent = quantity;
  document.querySelector(".drawer-count").textContent = `(${quantity})`;
  document.querySelector(".cart-empty").classList.toggle("is-visible", !hasItems);
  document.querySelector(".drawer-footer").hidden = !hasItems;
  cartItems.hidden = !hasItems;

  cartItems.innerHTML = products
    .filter((product) => cart[product.id] > 0)
    .map((product) => `
      <div class="cart-item">
        <img src="${product.image}" alt="${product.imageAlt}" />
        <div class="cart-item-info">
          <strong>${product.name}</strong>
          <span>${formatPrice(product.price)}</span>
          <div class="quantity-control" aria-label="Quantity for ${product.name}">
            <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Remove one ${product.name}">−</button>
            <span>${cart[product.id]}</span>
            <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Add one ${product.name}">+</button>
          </div>
        </div>
        <span class="cart-item-price">${formatPrice(product.price * cart[product.id])}</span>
      </div>
    `).join("");

  document.querySelector(".cart-subtotal").textContent = formatPrice(subtotal);
  document.querySelector(".shipping-remaining").textContent = formatPrice(Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal));
  document.querySelector(".shipping-progress span").style.width = `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`;
  persist(CART_STORAGE_KEY, cart);
}

function openCart() {
  overlay.hidden = false;
  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
    cartDrawer.classList.add("is-open");
  });
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  document.querySelector(".drawer-close").focus();
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  overlay.classList.remove("is-visible");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
  window.setTimeout(() => {
    if (!cartDrawer.classList.contains("is-open")) overlay.hidden = true;
  }, 280);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function setCategory(category) {
  activeFilter = category;
  favoritesOnly = false;
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.filter === category);
  });
  renderProducts();
  document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
}

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const favoriteButton = event.target.closest("[data-favorite]");

  if (addButton) {
    const { add: productId } = addButton.dataset;
    cart[productId] = (cart[productId] || 0) + 1;
    renderCart();
    showToast(`${products.find((product) => product.id === productId).name} added to your bag.`);
  }

  if (favoriteButton) {
    const { favorite: productId } = favoriteButton.dataset;
    if (favorites.has(productId)) favorites.delete(productId);
    else favorites.add(productId);
    persist(FAVORITES_STORAGE_KEY, [...favorites]);
    renderProducts();
    showToast(favorites.has(productId) ? "Saved to your wishlist." : "Removed from your wishlist.");
  }
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quantity]");
  if (!button) return;
  const { quantity: productId, change } = button.dataset;
  cart[productId] = (cart[productId] || 0) + Number(change);
  if (cart[productId] <= 0) delete cart[productId];
  renderCart();
});

document.querySelectorAll(".filter-tab").forEach((tab) => {
  tab.addEventListener("click", () => setCategory(tab.dataset.filter));
});

document.querySelectorAll(".category-card").forEach((card) => {
  card.addEventListener("click", () => setCategory(card.dataset.category));
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value;
  renderProducts();
});

document.querySelector(".search-form").addEventListener("submit", (event) => event.preventDefault());
document.querySelector(".search-form").addEventListener("click", (event) => {
  if (window.matchMedia("(max-width: 760px)").matches && !event.target.closest("input")) {
    event.currentTarget.classList.add("is-open");
    searchInput.focus();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
    document.querySelector(".search-form").classList.add("is-open");
  }
  if (event.key === "Escape") {
    closeCart();
    document.querySelector(".search-form").classList.remove("is-open");
    document.querySelector(".main-nav").classList.remove("is-open");
    document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
  }
});

document.querySelector("#sort-products").addEventListener("change", renderProducts);
document.querySelector(".cart-button").addEventListener("click", openCart);
document.querySelector(".drawer-close").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.querySelector(".continue-shopping").addEventListener("click", closeCart);
document.querySelector(".checkout-button").addEventListener("click", () => {
  showToast("Checkout is coming soon. Your bag is saved right here.");
});

document.querySelector(".wishlist-shortcut").addEventListener("click", () => {
  favoritesOnly = !favoritesOnly;
  activeFilter = "All";
  document.querySelectorAll(".filter-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.filter === "All" && !favoritesOnly));
  renderProducts();
  document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  if (favoritesOnly && favorites.size === 0) showToast("Tap the heart on a product to save it here.");
});

document.querySelector(".menu-toggle").addEventListener("click", (event) => {
  const nav = document.querySelector(".main-nav");
  const isOpen = nav.classList.toggle("is-open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector(".main-nav").classList.remove("is-open");
    document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
  });
});

document.querySelector(".newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = document.querySelector("#newsletter-email");
  document.querySelector(".newsletter-message").textContent = `You're on the list. Keep an eye on ${emailInput.value} for a little good news.`;
  emailInput.value = "";
});

renderProducts();
renderCart();
