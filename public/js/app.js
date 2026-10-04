const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem("cart") || "[]"),
  token: localStorage.getItem("token"),
  user: JSON.parse(localStorage.getItem("user") || "null")
};

const $ = (id) => document.getElementById(id);
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(state.cart));
  updateCartCount();
}

function updateCartCount() {
  $("cartCount").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

function updateAuthUI() {
  $("loginBtn").classList.toggle("hidden", !!state.token);
  $("logoutBtn").classList.toggle("hidden", !state.token);
}

async function loadProducts() {
  const search = encodeURIComponent($("searchInput").value.trim());
  const category = encodeURIComponent($("categorySelect").value);
  const res = await fetch(`/api/products?search=${search}&category=${category}`);
  state.products = await res.json();

  $("productGrid").innerHTML = state.products.length
    ? state.products.map(p => `
      <article class="product-card">
        <img src="${p.image}" alt="${p.name}">
        <div class="product-info">
          <span class="badge">${p.category}</span>
          <h3>${p.name}</h3>
          <p class="desc">${p.description}</p>
          <div class="price">${money(p.price)}</div>
          <div class="card-actions">
            <button class="secondary-btn" onclick="viewProduct('${p._id}')">Details</button>
            <button class="primary-btn" onclick="addToCart('${p._id}')">Add to Cart</button>
          </div>
        </div>
      </article>
    `).join("")
    : "<p>No products found.</p>";
}

async function viewProduct(id) {
  const p = state.products.find(x => x._id === id);
  if (!p) return;

  $("productDetails").innerHTML = `
    <div class="product-detail">
      <img src="${p.image}" alt="${p.name}">
      <div>
        <span class="badge">${p.category}</span>
        <h2>${p.name}</h2>
        <p>${p.description}</p>
        <div class="price">${money(p.price)}</div>
        <p>Stock available: <strong>${p.stock}</strong></p>
        <button class="primary-btn" onclick="addToCart('${p._id}'); closeModal('productModal')">Add to Cart</button>
      </div>
    </div>
  `;
  openModal("productModal");
}

function addToCart(id) {
  const p = state.products.find(x => x._id === id);
  if (!p || p.stock < 1) return toast("Product is out of stock.");

  const item = state.cart.find(x => x.productId === id);
  if (item) {
    if (item.quantity >= p.stock) return toast("Maximum available stock reached.");
    item.quantity++;
  } else {
    state.cart.push({
      productId: id,
      name: p.name,
      price: p.price,
      image: p.image,
      quantity: 1
    });
  }

  saveCart();
  toast("Added to cart.");
}

function renderCart() {
  if (!state.cart.length) {
    $("cartItems").innerHTML = "<p>Your cart is empty.</p>";
    $("cartTotal").textContent = money(0);
    $("checkoutBtn").disabled = true;
    return;
  }

  $("checkoutBtn").disabled = false;
  $("cartItems").innerHTML = state.cart.map((item, index) => `
    <div class="cart-row">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <strong>${item.name}</strong>
        <div>${money(item.price)} × ${item.quantity}</div>
        <button class="remove" onclick="removeCartItem(${index})">Remove</button>
      </div>
      <div class="qty">
        <button onclick="changeQty(${index}, -1)">−</button>
        <strong>${item.quantity}</strong>
        <button onclick="changeQty(${index}, 1)">+</button>
      </div>
    </div>
  `).join("");

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $("cartTotal").textContent = money(total);
}

function changeQty(index, amount) {
  const item = state.cart[index];
  const product = state.products.find(p => p._id === item.productId);
  item.quantity += amount;

  if (item.quantity < 1) state.cart.splice(index, 1);
  else if (product && item.quantity > product.stock) {
    item.quantity = product.stock;
    toast("Stock limit reached.");
  }

  saveCart();
  renderCart();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  saveCart();
  renderCart();
}

async function submitAuth(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");

  state.token = data.token;
  state.user = data.user;
  localStorage.setItem("token", state.token);
  localStorage.setItem("user", JSON.stringify(state.user));
  updateAuthUI();
  closeModal("authModal");
  toast(data.message);
}

async function loadOrders() {
  if (!state.token) {
    $("ordersList").innerHTML = "<p>Please login to view your orders.</p>";
    return;
  }

  const res = await fetch("/api/orders/my", { headers: authHeaders() });
  const orders = await res.json();

  $("ordersList").innerHTML = orders.length
    ? orders.map(o => `
      <div class="order-card">
        <div class="order-top">
          <div><strong>Order #${o._id.slice(-8).toUpperCase()}</strong><br><small>${new Date(o.createdAt).toLocaleString()}</small></div>
          <span class="status">${o.status}</span>
        </div>
        <p style="margin-top:10px">${o.items.map(i => `${i.name} × ${i.quantity}`).join(", ")}</p>
        <strong>Total: ${money(o.total)}</strong>
      </div>
    `).join("")
    : "<p>No orders yet.</p>";
}

function openModal(id) { $(id).classList.remove("hidden"); }
function closeModal(id) { $(id).classList.add("hidden"); }

$("loginBtn").addEventListener("click", () => openModal("authModal"));
$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  state.token = null;
  state.user = null;
  updateAuthUI();
  toast("Logged out.");
});

$("cartBtn").addEventListener("click", () => {
  renderCart();
  openModal("cartModal");
});

$("checkoutBtn").addEventListener("click", () => {
  if (!state.token) {
    closeModal("cartModal");
    openModal("authModal");
    toast("Login is required before checkout.");
    return;
  }
  closeModal("cartModal");
  if (state.user) $("shipName").value = state.user.name || "";
  openModal("checkoutModal");
});

$("loginTab").addEventListener("click", () => {
  $("loginTab").classList.add("active");
  $("registerTab").classList.remove("active");
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
  $("authMessage").textContent = "";
});

$("registerTab").addEventListener("click", () => {
  $("registerTab").classList.add("active");
  $("loginTab").classList.remove("active");
  $("registerForm").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  $("authMessage").textContent = "";
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await submitAuth("/api/auth/login", {
      email: $("loginEmail").value,
      password: $("loginPassword").value
    });
  } catch (err) {
    $("authMessage").textContent = err.message;
  }
});

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await submitAuth("/api/auth/register", {
      name: $("regName").value,
      email: $("regEmail").value,
      password: $("regPassword").value
    });
  } catch (err) {
    $("authMessage").textContent = err.message;
  }
});

$("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify({
        items: state.cart,
        shippingAddress: {
          fullName: $("shipName").value,
          phone: $("shipPhone").value,
          address: $("shipAddress").value,
          city: $("shipCity").value,
          pincode: $("shipPincode").value
        }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Order failed");

    state.cart = [];
    saveCart();
    closeModal("checkoutModal");
    toast("Order placed successfully!");
    await loadProducts();
    await loadOrders();
    location.hash = "orders";
    $("orders").classList.remove("hidden");
  } catch (err) {
    toast(err.message);
  }
});

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

["productModal", "cartModal", "authModal", "checkoutModal"].forEach(id => {
  $(id).addEventListener("click", e => {
    if (e.target.id === id) closeModal(id);
  });
});

$("searchInput").addEventListener("input", loadProducts);
$("categorySelect").addEventListener("change", loadProducts);

$("ordersLink").addEventListener("click", async () => {
  $("orders").classList.remove("hidden");
  await loadOrders();
});

window.addToCart = addToCart;
window.viewProduct = viewProduct;
window.changeQty = changeQty;
window.removeCartItem = removeCartItem;
window.closeModal = closeModal;

updateAuthUI();
updateCartCount();
loadProducts();
