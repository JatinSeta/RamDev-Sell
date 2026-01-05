// =======================================
// IMPORTS
// =======================================
import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// =======================================
// DOM ELEMENTS
// =======================================
const productsList = document.getElementById('productsList');
const loader = document.getElementById('loader');
const mainContent = document.getElementById('mainContent');
const heroSection = document.getElementById('heroSection');

const contactModal = document.getElementById('contactModal');
const productInput = document.getElementById('product');
const closeModal = document.getElementById("closeModal");
const formSection = document.getElementById("formSection");
const thankYouSection = document.getElementById("thankYouSection");
const contactForm = document.getElementById("contactForm");

const quantityInput = document.getElementById("quantity");
const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");

const navSearch = document.getElementById('navSearch');
const searchForm = document.querySelector('.search-form');
const searchSuggestions = document.getElementById('searchSuggestions');

// =======================================
// STATE
// =======================================
let allProductsData = [];
let selectedProductMinQty = 1;
let selectedProductMaxQty = 200;

// =======================================
// LOAD PRODUCTS FROM FIREBASE
// =======================================
export async function loadProducts() {
  try {
    const snap = await getDocs(collection(db, "Products"));
    allProductsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (allProductsData.length === 0) {
      productsList.innerHTML = "<div>No products yet.</div>";
      return;
    }

    renderProducts(allProductsData);
  } catch (err) {
    console.error("Error loading products:", err);
    productsList.innerHTML = "<div>Error loading products.</div>";
  } finally {
    loader.style.display = "none";
    mainContent.style.display = "block";
  }
}

// =======================================
// RENDER PRODUCT CARDS
// =======================================
function renderProducts(products) {
  productsList.innerHTML = '';

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = product.mainUrl || "https://via.placeholder.com/150";
    img.alt = product.name || "Product";
    img.style.cursor = "pointer";
    img.addEventListener('click', () => {
      window.location.href = `./productDetails.html?id=${product.id}`;
    });

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = product.name || "(no name)";
    title.style.cursor = "pointer";
    title.addEventListener('click', () => {
      window.location.href = `./productDetails.html?id=${product.id}`;
    });

    const btnContainer = document.createElement('div');
    btnContainer.className = 'card-buttons';

    const contactBtn = document.createElement('button');
    contactBtn.className = 'contact-btn';
    contactBtn.textContent = 'Contact Us';
    contactBtn.addEventListener('click', () => openContactModal(product));

    btnContainer.appendChild(contactBtn);
    card.append(img, title, btnContainer);
    productsList.appendChild(card);
  });
}

// =======================================
// OPEN CONTACT MODAL
// =======================================
function openContactModal(product) {
  productInput.value = product.name || "";

  // Use Firebase min/max
  selectedProductMinQty = parseInt(product.minQuantity) || 1;
  selectedProductMaxQty = parseInt(product.maxQuantity) || 100;

  quantityInput.value = selectedProductMinQty;
  quantityInput.min = selectedProductMinQty;
  quantityInput.max = selectedProductMaxQty;

  minusBtn.disabled = quantityInput.value <= selectedProductMinQty;
  plusBtn.disabled = quantityInput.value >= selectedProductMaxQty;

  contactModal.style.display = "flex";
  formSection.style.display = "block";
  thankYouSection.style.display = "none";
}

// =======================================
// CLOSE CONTACT MODAL
// =======================================
closeModal.addEventListener("click", () => {
  contactModal.style.display = "none";
  contactForm.reset();
});

// =======================================
// QUANTITY PLUS / MINUS BUTTONS
// =======================================
function updateQuantity(change) {
  let qty = parseInt(quantityInput.value) || selectedProductMinQty;
  qty += change;

  if (qty < selectedProductMinQty) qty = selectedProductMinQty;
  if (qty > selectedProductMaxQty) qty = selectedProductMaxQty;

  quantityInput.value = qty;
  minusBtn.disabled = qty <= selectedProductMinQty;
  plusBtn.disabled = qty >= selectedProductMaxQty;
}

minusBtn.addEventListener("click", () => updateQuantity(-1));
plusBtn.addEventListener("click", () => updateQuantity(1));

quantityInput.addEventListener("input", () => {
  let val = parseInt(quantityInput.value) || selectedProductMinQty;
  if (val < selectedProductMinQty) val = selectedProductMinQty;
  if (val > selectedProductMaxQty) val = selectedProductMaxQty;

  quantityInput.value = val;
  minusBtn.disabled = val <= selectedProductMinQty;
  plusBtn.disabled = val >= selectedProductMaxQty;
});

// =======================================
// CONTACT FORM SUBMISSION
// =======================================
contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const company = document.getElementById("company").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const message = document.getElementById("message").value.trim();
  const quantity = parseInt(quantityInput.value);
  const acceptTerms = document.getElementById("acceptTerms");

  if (!name || !email || !phone) {
    alert("Please fill all required fields.");
    return;
  }

  if (!acceptTerms.checked) {
    alert("Please accept Terms & Conditions.");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    alert("Phone number must be 10 digits.");
    return;
  }

  try {
    await addDoc(collection(db, "Inquiries"), {
      name,
      company,
      email,
      phone,
      product: productInput.value,
      quantity,
      message,
      termsAccepted: true,
      createdAt: new Date()
    });

    formSection.style.display = "none";
    thankYouSection.style.display = "block";

    setTimeout(() => {
      contactModal.style.display = "none";
      contactForm.reset();
      formSection.style.display = "block";
      thankYouSection.style.display = "none";
    }, 3000);

  } catch (err) {
    console.error("Firestore error:", err);
    alert("Failed to submit inquiry.");
  }
});

// =======================================
// SEARCH FUNCTIONALITY
// =======================================
function showSearchSuggestions(query) {
  searchSuggestions.innerHTML = '';

  const filtered = allProductsData
    .filter(p => p.name.toLowerCase().includes(query) || (p.brand || '').toLowerCase().includes(query))
    .slice(0, 5);

  filtered.forEach(product => {
    const div = document.createElement('div');
    div.textContent = product.name;
    div.className = 'suggestion-item';
    div.onclick = () => {
      navSearch.value = product.name;
      applySearchFilter(product.name);
      hideSearchSuggestions();
    };
    searchSuggestions.appendChild(div);
  });

  searchSuggestions.style.display = filtered.length ? 'block' : 'none';
}

function hideSearchSuggestions() {
  searchSuggestions.style.display = 'none';
}

export function applySearchFilter(searchText) {
  searchText = searchText.toLowerCase().trim();
  const filtered = allProductsData.filter(p => 
    p.name.toLowerCase().includes(searchText) || 
    (p.brand || '').toLowerCase().includes(searchText)
  );

  if (!searchText) {
    heroSection.style.display = 'flex';
    renderProducts(allProductsData);
    hideSearchSuggestions();
    return;
  }

  heroSection.style.display = 'none';
  if (filtered.length > 0) {
    renderProducts(filtered);
  } else {
    productsList.innerHTML = "<div style='text-align:center;margin-top:20px;color:#555;'>No products found.</div>";
  }
}

// Search input events
navSearch.addEventListener('input', () => {
  const query = navSearch.value.toLowerCase().trim();
  if (!query) {
    renderProducts(allProductsData);
    heroSection.style.display = 'flex';
    hideSearchSuggestions();
  } else {
    showSearchSuggestions(query);
    heroSection.style.display = 'none';
  }
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  applySearchFilter(navSearch.value);
  hideSearchSuggestions();
});

// =======================================
// INIT
// =======================================
window.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();

  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get("query");
  if (searchQuery) {
    navSearch.value = searchQuery;
    applySearchFilter(searchQuery);
  }
});
// Open Terms Modal
const openTerms = document.getElementById("openTerms");
const termsModal = document.getElementById("termsModal");
const closeTerms = document.getElementById("closeTerms");

openTerms.addEventListener("click", () => {
  termsModal.style.display = "flex";
});

// Close Terms Modal
closeTerms.addEventListener("click", () => {
  termsModal.style.display = "none";
});

// Optional: Close modal if clicked outside content
termsModal.addEventListener("click", (e) => {
  if (e.target === termsModal) {
    termsModal.style.display = "none";
  }
});
