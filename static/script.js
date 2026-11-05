const products = [
  {
    id: "studio-headphones",
    name: "Studio Wireless Headphones",
    category: "Audio",
    brand: "Northstar",
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
    brand: "Soundwell",
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
    brand: "Morrow",
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
    brand: "Keyfolk",
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
    brand: "Daymark",
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
    brand: "Fieldnote",
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
    brand: "Arcade Foundry",
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
    brand: "Northstar",
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
const MAX_CART_QUANTITY = 99;
const CART_STORAGE_KEY = "corevix-cart";
const FAVORITES_STORAGE_KEY = "corevix-favorites";
const NEWSLETTER_STORAGE_KEY = "techzone-newsletter-emails";
const ORDERS_STORAGE_KEY = "techzone-orders";
const ORDER_STATUSES = ["Pending Payment", "Paid", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAYMENT_STATUSES = ["Pending Payment", "Paid", "Failed", "Cancelled"];
const PAYMENT_ATTEMPT_STATUSES = ["Pending", "Paid", "Failed", "Cancelled"];
const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const cartDrawer = document.querySelector(".cart-drawer");
const overlay = document.querySelector(".overlay");
const cartItems = document.querySelector(".cart-items");
const toast = document.querySelector(".toast");
const checkoutDialog = document.querySelector(".checkout-dialog");
const mpesaDemoDialog = document.querySelector(".mpesa-demo-dialog");
const checkoutForm = document.querySelector(".checkout-form");
const orderList = document.querySelector(".order-list");

let activeFilter = "All";
let searchQuery = "";
let favoritesOnly = false;
let cart = loadStoredObject(CART_STORAGE_KEY, {});
let favorites = new Set(loadStoredObject(FAVORITES_STORAGE_KEY, []));
let orders = loadOrders();
let toastTimeout;
let isSubmittingOrder = false;
let isStartingDemoPayment = false;
let isResolvingDemoPayment = false;
let activeDemoPayment = null;
let demoPinLength = 0;

function loadStoredObject(key, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (key === CART_STORAGE_KEY) return sanitizeCart(stored);
    if (key === FAVORITES_STORAGE_KEY && Array.isArray(stored)) {
      return stored.filter((id) => typeof id === "string");
    }
  } catch (error) {
    console.warn(`Could not read ${key} from local storage.`, error);
  }
  return fallback;
}

function sanitizeCart(stored) {
  if (stored === null) return {};
  if (typeof stored !== "object" || Array.isArray(stored)) {
    console.warn("Ignoring invalid saved cart data.");
    return {};
  }

  const productIds = new Set(products.map((product) => product.id));
  const sanitized = {};
  let discardedEntries = false;

  Object.entries(stored).forEach(([productId, quantity]) => {
    if (!productIds.has(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
      discardedEntries = true;
      return;
    }
    sanitized[productId] = quantity;
  });

  if (discardedEntries) console.warn("Invalid saved cart entries were removed.");
  return sanitized;
}

function isValidKenyanPhone(value) {
  const digits = value.replace(/\D/g, "");
  return /^[+0-9 -]+$/.test(value) && /^(?:254|0)(?:7|1)\d{8}$/.test(digits);
}

function sanitizeOrder(order) {
  if (!order || typeof order !== "object" || Array.isArray(order)) return null;
  if (typeof order.orderId !== "string" || !/^TZ-[A-Z0-9-]{8,80}$/.test(order.orderId)) return null;
  if (typeof order.createdAt !== "string" || Number.isNaN(Date.parse(order.createdAt))) return null;
  if (!order.customer || typeof order.customer !== "object" || Array.isArray(order.customer)) return null;

  const { fullName, phone, email, deliveryAddress } = order.customer;
  if (typeof fullName !== "string" || !fullName.trim() || fullName.length > 100) return null;
  if (typeof phone !== "string" || phone.length > 30 || !isValidKenyanPhone(phone.trim())) return null;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  if (typeof deliveryAddress !== "string" || deliveryAddress.trim().length < 8 || deliveryAddress.length > 300) return null;
  if (!Array.isArray(order.items) || order.items.length === 0) return null;

  const seenProductIds = new Set();
  const items = [];
  let calculatedTotal = 0;
  for (const item of order.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    if (typeof item.productId !== "string" || seenProductIds.has(item.productId)) return null;
    const product = products.find((entry) => entry.id === item.productId);
    if (!product || item.name !== product.name || item.unitPrice !== product.price) return null;
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_CART_QUANTITY) return null;
    if (!Number.isSafeInteger(item.lineTotal) || item.lineTotal !== item.unitPrice * item.quantity) return null;
    seenProductIds.add(item.productId);
    calculatedTotal += item.lineTotal;
    if (!Number.isSafeInteger(calculatedTotal)) return null;
    items.push({
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    });
  }

  if (!Number.isSafeInteger(order.total) || order.total !== calculatedTotal) return null;
  if (!ORDER_STATUSES.includes(order.status) || !PAYMENT_STATUSES.includes(order.paymentStatus)) return null;
  if (!["Awaiting payment", "Processing", "Shipped", "Delivered", "Cancelled"].includes(order.deliveryStatus)) return null;
  if (order.paymentMethod !== "M-Pesa demo") return null;

  const paymentAttempts = [];
  const seenAttemptIds = new Set();
  if (order.paymentAttempts !== undefined) {
    if (!Array.isArray(order.paymentAttempts)) return null;
    for (const attempt of order.paymentAttempts) {
      if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) return null;
      if (typeof attempt.attemptId !== "string" || !/^MP-[A-Z0-9-]{8,120}$/.test(attempt.attemptId)) return null;
      if (seenAttemptIds.has(attempt.attemptId) || attempt.orderId !== order.orderId) return null;
      if (typeof attempt.createdAt !== "string" || Number.isNaN(Date.parse(attempt.createdAt))) return null;
      if (!PAYMENT_ATTEMPT_STATUSES.includes(attempt.status)) return null;
      seenAttemptIds.add(attempt.attemptId);
      paymentAttempts.push({
        attemptId: attempt.attemptId,
        orderId: attempt.orderId,
        createdAt: new Date(attempt.createdAt).toISOString(),
        status: attempt.status,
      });
    }
  }

  return {
    orderId: order.orderId,
    createdAt: new Date(order.createdAt).toISOString(),
    customer: {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      deliveryAddress: deliveryAddress.trim(),
    },
    items,
    total: calculatedTotal,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    status: order.status,
    paymentAttempts,
  };
}

function loadOrders() {
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored === null) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn("Ignoring invalid saved order history.");
      return [];
    }

    const seenOrderIds = new Set();
    const validOrders = [];
    parsed.forEach((entry) => {
      const order = sanitizeOrder(entry);
      if (!order || seenOrderIds.has(order.orderId)) {
        console.warn("An invalid or duplicate saved order was ignored.");
        return;
      }
      seenOrderIds.add(order.orderId);
      validOrders.push(order);
    });
    return validOrders;
  } catch (error) {
    console.warn("Could not read saved order history.", error);
    return [];
  }
}

function saveOrders(nextOrders) {
  const validatedOrders = [];
  const seenOrderIds = new Set();
  for (const entry of nextOrders) {
    const order = sanitizeOrder(entry);
    if (!order || seenOrderIds.has(order.orderId)) {
      throw new Error("Order history failed validation.");
    }
    seenOrderIds.add(order.orderId);
    validatedOrders.push(order);
  }

  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(validatedOrders));
  const savedOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY));
  const verifiedOrders = Array.isArray(savedOrders) ? savedOrders.map(sanitizeOrder) : [];
  if (verifiedOrders.length !== validatedOrders.length
    || verifiedOrders.some((order) => !order)
    || JSON.stringify(verifiedOrders) !== JSON.stringify(validatedOrders)) {
    throw new Error("The new order could not be verified in browser storage.");
  }
  orders = validatedOrders;
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

function formatOrderDate(dateValue) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function renderCheckoutSummary() {
  const checkoutItems = document.querySelector(".checkout-items");
  checkoutItems.replaceChildren();

  products.filter((product) => cart[product.id] > 0).forEach((product) => {
    const row = document.createElement("div");
    row.className = "checkout-item";
    row.append(
      createTextElement("span", "checkout-item-name", `${product.name} × ${cart[product.id]}`),
      createTextElement("strong", "", formatPrice(product.price * cart[product.id])),
    );
    checkoutItems.append(row);
  });
  document.querySelector(".checkout-subtotal").textContent = formatPrice(getCartSubtotal());
}

function renderOrders() {
  orderList.replaceChildren();
  document.querySelector(".orders-empty").hidden = orders.length > 0;

  orders.slice().reverse().forEach((order) => {
    const card = document.createElement("details");
    card.className = "order-card";

    const summary = document.createElement("summary");
    const summaryMain = document.createElement("span");
    summaryMain.className = "order-summary-main";
    summaryMain.append(
      createTextElement("strong", "order-id", order.orderId),
      createTextElement("small", "", formatOrderDate(order.createdAt)),
    );
    const summaryMeta = document.createElement("span");
    summaryMeta.className = "order-summary-meta";
    summaryMeta.append(
      createTextElement("span", `order-status status-${order.status.toLowerCase().replaceAll(" ", "-")}`, order.status),
      createTextElement("small", `payment-status-label payment-${order.paymentStatus.toLowerCase().replaceAll(" ", "-")}`, `Payment: ${order.paymentStatus}`),
      createTextElement("strong", "", formatPrice(order.total)),
    );
    summary.append(summaryMain, summaryMeta);

    const content = document.createElement("div");
    content.className = "order-details";
    const infoGrid = document.createElement("div");
    infoGrid.className = "order-info-grid";
    infoGrid.append(
      createTextElement("p", "", `Customer: ${order.customer.fullName}`),
      createTextElement("p", "", `Phone: ${order.customer.phone}`),
      createTextElement("p", "", `Email: ${order.customer.email}`),
      createTextElement("p", "", `Delivery address: ${order.customer.deliveryAddress}`),
      createTextElement("p", "", `Payment: ${order.paymentMethod}`),
      createTextElement("p", "", `Payment status: ${order.paymentStatus}`),
      createTextElement("p", "", `Delivery status: ${order.deliveryStatus}`),
    );
    order.paymentAttempts.forEach((attempt, index) => {
      infoGrid.append(createTextElement(
        "p",
        "payment-attempt-result",
        `M-Pesa demo attempt ${index + 1}: ${attempt.status} · ${formatOrderDate(attempt.createdAt)}`,
      ));
    });

    const itemList = document.createElement("ul");
    itemList.className = "order-items";
    order.items.forEach((item) => {
      itemList.append(createTextElement(
        "li",
        "",
        `${item.name} — ${item.quantity} × ${formatPrice(item.unitPrice)} = ${formatPrice(item.lineTotal)}`,
      ));
    });
    content.append(infoGrid, itemList);

    if (order.status === "Pending Payment") {
      const paymentButton = document.createElement("button");
      paymentButton.type = "button";
      paymentButton.className = "button order-payment";
      paymentButton.dataset.demoPaymentOrder = order.orderId;
      paymentButton.textContent = "Start M-Pesa demo payment";
      content.append(paymentButton);

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "button order-cancel";
      cancelButton.dataset.cancelOrder = order.orderId;
      cancelButton.textContent = "Cancel demo order";
      content.append(cancelButton);
    }

    card.append(summary, content);
    orderList.append(card);
  });
}

function saveNewsletterEmail(email) {
  const stored = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
  let emails = [];

  if (stored !== null) {
    const savedEmails = JSON.parse(stored);
    if (!Array.isArray(savedEmails) || savedEmails.some((savedEmail) => typeof savedEmail !== "string")) {
      throw new Error("Saved newsletter data is invalid.");
    }
    emails = savedEmails.map((savedEmail) => savedEmail.trim().toLowerCase()).filter(Boolean);
  }

  if (emails.includes(email)) return true;

  emails.push(email);
  localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(emails));
  const verifiedEmails = JSON.parse(localStorage.getItem(NEWSLETTER_STORAGE_KEY));
  if (!Array.isArray(verifiedEmails) || !verifiedEmails.includes(email)) {
    throw new Error("Newsletter signup could not be verified in browser storage.");
  }
  return false;
}

function getVisibleProducts() {
  const query = searchQuery.trim().toLowerCase();
  const visible = products.filter((product) => {
    const matchesCategory = activeFilter === "All" || product.category === activeFilter;
    const matchesSearch = !query || `${product.name} ${product.category} ${product.brand} ${product.label}`.toLowerCase().includes(query);
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
  const emptyState = document.querySelector(".empty-state");
  emptyState.hidden = visible.length > 0;
  if (products.length === 0) {
    emptyState.textContent = "No products are available right now. Please check back soon.";
  } else {
    emptyState.textContent = "No products match your search or filters. Try changing your search or category.";
  }
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
        <div class="product-meta"><span>${product.category.toUpperCase()} · ${product.brand.toUpperCase()}</span><span class="product-rating">★ <span>${product.rating} (${product.reviews})</span></span></div>
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

function createOrderId() {
  let orderId;
  do {
    const uniquePart = window.crypto?.randomUUID
      ? window.crypto.randomUUID().replaceAll("-", "").slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    orderId = `TZ-${Date.now().toString(36).toUpperCase()}-${uniquePart.toUpperCase()}`;
  } while (orders.some((order) => order.orderId === orderId));
  return orderId;
}

function createOrder(customerDetails) {
  const validatedCart = sanitizeCart(cart);
  const items = Object.entries(validatedCart).map(([productId, quantity]) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY
      || !Number.isSafeInteger(product.price) || product.price < 1) {
      throw new Error("The shopping bag contains an invalid product or quantity.");
    }
    return {
      productId,
      name: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    };
  });

  if (items.length === 0) throw new Error("Add at least one product before placing an order.");
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (!Number.isSafeInteger(total) || total < 1) throw new Error("The order total is invalid.");

  const order = {
    orderId: createOrderId(),
    createdAt: new Date().toISOString(),
    customer: customerDetails,
    items,
    total,
    paymentMethod: "M-Pesa demo",
    paymentStatus: "Pending Payment",
    deliveryStatus: "Awaiting payment",
    status: "Pending Payment",
  };
  const validatedOrder = sanitizeOrder(order);
  if (!validatedOrder) throw new Error("The order details failed validation.");
  return validatedOrder;
}

function createPaymentAttemptId(order) {
  let attemptId;
  do {
    const uniquePart = window.crypto?.randomUUID
      ? window.crypto.randomUUID().replaceAll("-", "").slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    attemptId = `MP-${order.orderId}-${uniquePart.toUpperCase()}`;
  } while (order.paymentAttempts.some((attempt) => attempt.attemptId === attemptId));
  return attemptId;
}

function maskPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  return `${digits.slice(0, 3)}••••${digits.slice(-3)}`;
}

function renderDemoPinMask() {
  const mask = document.querySelector(".mpesa-pin-dots");
  mask.textContent = Array.from({ length: 4 }, (_, index) => (index < demoPinLength ? "●" : "○")).join(" ");
  mask.setAttribute("aria-label", `Demo PIN mask with ${demoPinLength} dots. No PIN digits are stored.`);
}

function startDemoPayment(orderId) {
  if (isStartingDemoPayment || activeDemoPayment) return;
  const order = orders.find((entry) => entry.orderId === orderId);
  if (!order || order.status !== "Pending Payment" || order.paymentStatus === "Paid") return;

  isStartingDemoPayment = true;
  const attempt = {
    attemptId: createPaymentAttemptId(order),
    orderId: order.orderId,
    createdAt: new Date().toISOString(),
    status: "Pending",
  };
  try {
    saveOrders(orders.map((entry) => entry.orderId === orderId
      ? { ...entry, paymentAttempts: [...entry.paymentAttempts, attempt] }
      : entry));
  } catch (error) {
    console.warn("Could not save the M-Pesa demo payment attempt.", error);
    showToast("The demo payment prompt could not be started.");
    isStartingDemoPayment = false;
    return;
  }
  isStartingDemoPayment = false;

  const updatedOrder = orders.find((entry) => entry.orderId === orderId);
  activeDemoPayment = { orderId, attemptId: attempt.attemptId };
  demoPinLength = 0;
  renderDemoPinMask();
  document.querySelector(".mpesa-demo-order-id").textContent = updatedOrder.orderId;
  document.querySelector(".mpesa-demo-phone").textContent = maskPhoneNumber(updatedOrder.customer.phone);
  document.querySelector(".mpesa-demo-amount").textContent = formatPrice(updatedOrder.total);
  document.querySelector(".mpesa-demo-notice").textContent = "Choose a simulated outcome. No real payment will be made.";
  document.querySelectorAll("[data-demo-payment-outcome]").forEach((button) => {
    button.disabled = false;
  });
  renderOrders();
  mpesaDemoDialog.showModal();
}

function resolveDemoPayment(outcome) {
  if (isResolvingDemoPayment || !activeDemoPayment || !PAYMENT_ATTEMPT_STATUSES.includes(outcome)
    || outcome === "Pending") return;

  isResolvingDemoPayment = true;
  const { orderId, attemptId } = activeDemoPayment;
  const order = orders.find((entry) => entry.orderId === orderId);
  if (!order || order.status !== "Pending Payment") {
    isResolvingDemoPayment = false;
    activeDemoPayment = null;
    mpesaDemoDialog.close();
    return;
  }
  const attemptExists = order.paymentAttempts.some((attempt) => attempt.attemptId === attemptId
    && attempt.orderId === orderId && attempt.status === "Pending");
  if (!attemptExists) {
    document.querySelector(".mpesa-demo-notice").textContent = "This payment attempt is no longer active. Close the demo and check order history.";
    isResolvingDemoPayment = false;
    return;
  }

  const updatedOrders = orders.map((entry) => {
    if (entry.orderId !== orderId) return entry;
    const paymentStatus = outcome;
    return {
      ...entry,
      status: outcome === "Paid" ? "Paid" : entry.status,
      paymentStatus,
      deliveryStatus: outcome === "Paid" ? "Processing" : entry.deliveryStatus,
      paymentAttempts: entry.paymentAttempts.map((attempt) => attempt.attemptId === attemptId
        ? { ...attempt, status: outcome }
        : attempt),
    };
  });
  try {
    saveOrders(updatedOrders);
  } catch (error) {
    console.warn("Could not save the M-Pesa demo payment result.", error);
    document.querySelector(".mpesa-demo-notice").textContent = "The demo result could not be saved. No payment was made; please retry.";
    isResolvingDemoPayment = false;
    return;
  }

  activeDemoPayment = null;
  isResolvingDemoPayment = false;
  renderOrders();
  mpesaDemoDialog.close();
  const resultMessage = outcome === "Paid"
    ? `Demo payment marked successful for ${orderId}. No money was transferred.`
    : outcome === "Failed"
      ? `Demo payment marked failed for ${orderId}. No money was transferred.`
      : `Demo payment cancelled for ${orderId}. No money was transferred.`;
  showToast(resultMessage);
}

function renderCart() {
  cart = sanitizeCart(cart);
  const quantity = getCartQuantity();
  const subtotal = getCartSubtotal();
  const hasItems = quantity > 0;

  document.querySelector(".cart-count").textContent = quantity;
  document.querySelector(".drawer-count").textContent = `(${quantity})`;
  document.querySelector(".cart-empty").classList.toggle("is-visible", !hasItems);
  document.querySelector(".drawer-footer").hidden = !hasItems;
  document.querySelector(".cart-totals").hidden = !hasItems;
  document.querySelector(".checkout-button").disabled = !hasItems;
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
  document.querySelector(".cart-total").textContent = formatPrice(subtotal);
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
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (cart[productId] >= MAX_CART_QUANTITY) {
      showToast(`You can add up to ${MAX_CART_QUANTITY} of this item.`);
      return;
    }
    cart[productId] = (cart[productId] || 0) + 1;
    renderCart();
    showToast(`${product.name} added to your bag.`);
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
  if (!products.some((product) => product.id === productId) || !["-1", "1"].includes(change)) return;
  const nextQuantity = (cart[productId] || 0) + Number(change);
  if (nextQuantity > MAX_CART_QUANTITY) {
    showToast(`You can add up to ${MAX_CART_QUANTITY} of this item.`);
    return;
  }
  if (nextQuantity <= 0) delete cart[productId];
  else cart[productId] = nextQuantity;
  renderCart();
});

document.querySelectorAll(".filter-tab").forEach((tab) => {
  tab.addEventListener("click", () => setCategory(tab.dataset.filter));
});

document.querySelectorAll(".category-card").forEach((card) => {
  card.addEventListener("click", () => setCategory(card.dataset.category));
});

document.querySelector(".order-list").addEventListener("click", (event) => {
  const paymentButton = event.target.closest("[data-demo-payment-order]");
  if (paymentButton) {
    startDemoPayment(paymentButton.dataset.demoPaymentOrder);
    return;
  }

  const cancelButton = event.target.closest("[data-cancel-order]");
  if (!cancelButton) return;

  const order = orders.find((entry) => entry.orderId === cancelButton.dataset.cancelOrder);
  if (!order || order.status !== "Pending Payment") return;
  if (!window.confirm(`Cancel demo order ${order.orderId}?`)) return;

  const updatedOrders = orders.map((entry) => entry.orderId === order.orderId
    ? {
      ...entry,
      status: "Cancelled",
      paymentStatus: "Cancelled",
      deliveryStatus: "Cancelled",
      paymentAttempts: entry.paymentAttempts.map((attempt) => attempt.status === "Pending"
        ? { ...attempt, status: "Cancelled" }
        : attempt),
    }
    : entry);
  try {
    saveOrders(updatedOrders);
    renderOrders();
  } catch (error) {
    console.warn("Could not save the order cancellation.", error);
    showToast("The order could not be cancelled in browser storage.");
  }
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
  cart = sanitizeCart(cart);
  if (getCartQuantity() === 0) {
    showToast("Add a product to your bag before checkout.");
    return;
  }
  renderCheckoutSummary();
  document.querySelector(".checkout-notice").textContent = "Payment status will be Pending Payment. Orders are stored only in this browser.";
  closeCart();
  checkoutDialog.showModal();
});
document.querySelector(".checkout-close").addEventListener("click", () => checkoutDialog.close());
document.querySelector(".checkout-cancel").addEventListener("click", () => checkoutDialog.close());
checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isSubmittingOrder) return;

  const fullNameInput = document.querySelector("#checkout-name");
  const phoneInput = document.querySelector("#checkout-phone");
  const emailInput = document.querySelector("#checkout-email");
  const addressInput = document.querySelector("#checkout-address");
  const fullName = fullNameInput.value.trim();
  const deliveryAddress = addressInput.value.trim();
  fullNameInput.setCustomValidity(fullName.length >= 2 ? "" : "Enter your full name.");
  addressInput.setCustomValidity(deliveryAddress.length >= 8 ? "" : "Enter a complete delivery address.");
  phoneInput.setCustomValidity(isValidKenyanPhone(phoneInput.value)
    ? ""
    : "Enter a valid Kenyan number, such as 0712 345 678 or +254 712 345 678.");
  if (!checkoutForm.reportValidity()) return;

  if (getCartQuantity() === 0) {
    document.querySelector(".checkout-notice").textContent = "Your bag is empty. Add a product before confirming an order.";
    return;
  }

  isSubmittingOrder = true;
  const submitButton = document.querySelector(".checkout-submit");
  submitButton.disabled = true;
  try {
    const newOrder = createOrder({
      fullName,
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      deliveryAddress,
    });
    saveOrders([...orders, newOrder]);
  } catch (error) {
    console.warn("Could not create the order.", error);
    document.querySelector(".checkout-notice").textContent = error instanceof Error
      ? `${error.message} No order was confirmed.`
      : "The order could not be saved. No order was confirmed.";
    return;
  } finally {
    isSubmittingOrder = false;
    submitButton.disabled = false;
  }

  const confirmedOrder = orders[orders.length - 1];
  let cartCleared = false;
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    if (localStorage.getItem(CART_STORAGE_KEY) !== null) {
      throw new Error("The saved cart could not be cleared.");
    }
    cart = {};
    cartCleared = true;
  } catch (error) {
    console.warn("Order saved, but the cart could not be cleared.", error);
  }

  renderCart();
  renderOrders();
  checkoutForm.reset();
  document.querySelector(".checkout-notice").textContent = "Order saved. Payment is pending; this demo has not taken payment or arranged delivery.";
  checkoutDialog.close();
  if (!cartCleared) {
    showToast(`Order ${confirmedOrder.orderId} was saved, but the bag could not be cleared. Review your order history before trying again.`);
  }
  startDemoPayment(confirmedOrder.orderId);
  document.querySelector("#orders").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#checkout-phone").addEventListener("input", (event) => {
  event.currentTarget.setCustomValidity("");
});
document.querySelector("#checkout-name").addEventListener("input", (event) => {
  event.currentTarget.setCustomValidity("");
});
document.querySelector("#checkout-address").addEventListener("input", (event) => {
  event.currentTarget.setCustomValidity("");
});
checkoutDialog.addEventListener("close", () => document.querySelector(".cart-button").focus());
document.querySelector(".mpesa-demo-close").addEventListener("click", () => resolveDemoPayment("Cancelled"));
document.querySelectorAll("[data-demo-payment-outcome]").forEach((button) => {
  button.addEventListener("click", () => resolveDemoPayment(button.dataset.demoPaymentOutcome));
});
document.querySelector(".mpesa-demo-keypad").addEventListener("click", (event) => {
  const button = event.target.closest("[data-demo-pin-key]");
  if (!button || !activeDemoPayment) return;
  if (button.dataset.demoPinKey === "backspace") demoPinLength = Math.max(0, demoPinLength - 1);
  else if (/^\d$/.test(button.dataset.demoPinKey) && demoPinLength < 4) demoPinLength += 1;
  renderDemoPinMask();
});
mpesaDemoDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  resolveDemoPayment("Cancelled");
});
mpesaDemoDialog.addEventListener("click", (event) => {
  if (event.target === mpesaDemoDialog) resolveDemoPayment("Cancelled");
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
  const message = document.querySelector(".newsletter-message");
  if (!emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }

  const email = emailInput.value.trim().toLowerCase();
  try {
    const alreadySaved = saveNewsletterEmail(email);
    message.textContent = alreadySaved
      ? "This email is already saved in this browser. It has not been sent to a mailing service."
      : "Email saved in this browser only. It has not been sent to a mailing service.";
    emailInput.value = "";
  } catch (error) {
    console.warn("Could not save the newsletter signup.", error);
    message.textContent = "We couldn't save your email in this browser. No subscription was made; please try again.";
  }
});

renderProducts();
renderCart();
renderOrders();
