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
const contactForm = document.getElementById('contactForm');
const productInput = document.getElementById('product');
const closeModal = document.getElementById("closeModal");
const formSection = document.getElementById("formSection");
const thankYouSection = document.getElementById("thankYouSection");

const navSearch = document.getElementById('navSearch');
const searchForm = document.querySelector('.search-form');
const searchSuggestions = document.getElementById('searchSuggestions');

// Filter Elements
const filterBtn = document.getElementById('filterBtn');
const filterSidebar = document.getElementById('filterSidebar');
const filterBackdrop = document.getElementById('filterBackdrop');
const closeSidebar = document.getElementById('closeSidebar');
const resetFiltersBtn = document.getElementById('resetFilters');
const priceRange = document.getElementById('priceRange');
const priceDisplay = document.querySelector('.price-display');
const bestSellersCheckbox = document.getElementById('bestSellersOnly');
const filterSearchInput = document.getElementById('filterSearch');
const categoryFiltersDiv = document.getElementById('categoryFilters');

let allProductsData = [];

// =======================================
// AUTO-APPLY FILTERS FUNCTION
// =======================================
function applyFiltersAutomatically() {
  const searchText = filterSearchInput.value.toLowerCase().trim();
  const maxPrice = parseInt(priceRange.value) || 10000;
  const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => cb.value);
  const bestSellersOnly = bestSellersCheckbox.checked;

  let filteredProducts = allProductsData.filter(product => {
    const price = product.price || 0;
    const priceInRange = price <= maxPrice;
    const searchMatches = product.name.toLowerCase().includes(searchText) || (product.brand || '').toLowerCase().includes(searchText);
    const categoryMatches = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const isBestSeller = !bestSellersOnly || product.bestSeller;

    return priceInRange && searchMatches && categoryMatches && isBestSeller;
  });

  renderProducts(filteredProducts);
}

// =======================================
// LOAD PRODUCTS
// =======================================
export async function loadProducts() {
  try {
    const productsRef = collection(db, "Products");
    const snap = await getDocs(productsRef);

    allProductsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (allProductsData.length === 0) {
      productsList.innerHTML = "<div>No products yet.</div>";
      return;
    }

    renderProducts(allProductsData);
    initializeFilters();

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
  const noMsg = document.getElementById('noProductsMsg');
  if (noMsg) noMsg.remove();

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    if (product.bestSeller) {
      const badge = document.createElement('div');
      badge.className = 'best-seller-badge';
      badge.textContent = 'Best Seller';
      card.appendChild(badge);
    }

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

    const brand = document.createElement('div');
    brand.className = 'product-brand';
    brand.textContent = product.brand || "";

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = product.price ? `₹${product.price.toLocaleString('en-IN')}` : "Contact for Price";

    const btnContainer = document.createElement('div');
    btnContainer.className = 'card-buttons';

    const contactBtn = document.createElement('button');
    contactBtn.className = 'contact-btn';
    contactBtn.textContent = 'Contact Us';
    contactBtn.addEventListener('click', () => {
      productInput.value = product.name || "";
      contactModal.style.display = 'flex';
      formSection.style.display = 'block';
      thankYouSection.style.display = 'none';
    });

    btnContainer.appendChild(contactBtn);
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(brand);
    card.appendChild(price);
    card.appendChild(btnContainer);

    productsList.appendChild(card);
  });
}

// =======================================
// APPLY SEARCH FILTER
// =======================================
export function applySearchFilter(searchText) {
  searchText = searchText.toLowerCase().trim();
  const filtered = allProductsData.filter(p => 
    p.name.toLowerCase().includes(searchText) || 
    (p.brand || '').toLowerCase().includes(searchText)
  );

  if (searchText === '') {
    heroSection.style.display = 'flex';
    heroSection.classList.remove('hidden');
    renderProducts(allProductsData);
    hideSearchSuggestions();
    return;
  }

  heroSection.style.display = 'none';

  if (filtered.length > 0) {
    renderProducts(filtered);
  } else {
    productsList.innerHTML = '';
    let noMsg = document.getElementById('noProductsMsg');
    if (!noMsg) {
      noMsg = document.createElement('div');
      noMsg.id = 'noProductsMsg';
      noMsg.textContent = "No products found for your search.";
      noMsg.style.textAlign = "center";
      noMsg.style.marginTop = "20px";
      noMsg.style.fontSize = "16px";
      noMsg.style.color = "#555";
      productsList.parentNode.appendChild(noMsg);
    }
  }
}

// =======================================
// SEARCH SUGGESTIONS
// =======================================
function showSearchSuggestions(query) {
  searchSuggestions.innerHTML = '';
  const filtered = allProductsData
    .filter(p => p.name.toLowerCase().includes(query) || (p.brand || '').toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 5);

  filtered.forEach(product => {
    const suggestion = document.createElement('div');
    suggestion.className = 'suggestion-item';

    const img = document.createElement('img');
    img.src = product.mainUrl || "https://via.placeholder.com/40";
    img.alt = product.name;
    img.className = 'suggestion-img';

    const textDiv = document.createElement('div');
    const text = `${product.name} (${product.brand || 'No Brand'})`;
    textDiv.textContent = text.length > 30 ? text.slice(0, 27) + '...' : text;
    textDiv.title = text;
    textDiv.className = 'suggestion-text';

    suggestion.appendChild(img);
    suggestion.appendChild(textDiv);

    suggestion.addEventListener('click', () => {
      navSearch.value = product.name;
      applySearchFilter(product.name);
      hideSearchSuggestions();
    });

    searchSuggestions.appendChild(suggestion);
  });

  searchSuggestions.style.display = filtered.length ? 'block' : 'none';
}

function hideSearchSuggestions() {
  searchSuggestions.style.display = 'none';
}

// =======================================
// SEARCH INPUT EVENTS
// =======================================
navSearch.addEventListener('input', () => {
  const query = navSearch.value.toLowerCase().trim();

  if (query === '') {
    renderProducts(allProductsData);
    heroSection.style.display = 'flex';
    heroSection.classList.remove('hidden');
    hideSearchSuggestions();
  } else {
    showSearchSuggestions(query);
    heroSection.style.display = 'none';
    heroSection.classList.add('hidden');
  }
});

// =======================================
// SEARCH FORM SUBMIT (FROM INDEX + PRODUCTS PAGE)
// =======================================
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = navSearch.value.toLowerCase().trim();
  applySearchFilter(query);
  hideSearchSuggestions();
});

// =======================================
// CONTACT FORM
// =======================================
contactModal.addEventListener("click", e => e.stopPropagation());

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const company = document.getElementById('company').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const product = document.getElementById('product').value.trim();
  const message = document.getElementById('message').value.trim();
  const quantity = document.getElementById('quantity').value.trim();

  if (!name || !email || !phone || !message || !quantity) {
    alert("Please fill all required fields.");
    return;
  }

  try {
    await addDoc(collection(db, "Inquiries"), {
      name, company, email, phone, product, quantity, message, createdAt: new Date()
    });

    formSection.style.display = "none";
    thankYouSection.style.display = "block";

    setTimeout(() => {
      contactModal.style.display = 'none';
      contactForm.reset();
      formSection.style.display = "block";
      thankYouSection.style.display = "none";
    }, 3000);

  } catch (err) {
    alert("Error submitting inquiry: " + err.message);
  }
});

closeModal.addEventListener('click', () => {
  contactModal.style.display = 'none';
  contactForm.reset();
  formSection.style.display = "block";
  thankYouSection.style.display = "none";
});

// =======================================
// FILTER SIDEBAR FUNCTIONALITY
// =======================================
function toggleFilterSidebar() {
  filterSidebar.classList.toggle('active');
  filterBackdrop.classList.toggle('active');
  filterSidebar.setAttribute('aria-hidden', filterSidebar.classList.contains('active') ? 'false' : 'true');
  filterBackdrop.setAttribute('aria-hidden', filterBackdrop.classList.contains('active') ? 'false' : 'true');
}

function closeFilterSidebar() {
  filterSidebar.classList.remove('active');
  filterBackdrop.classList.remove('active');
  filterSidebar.setAttribute('aria-hidden', 'true');
  filterBackdrop.setAttribute('aria-hidden', 'true');
}

// Filter Button Click
filterBtn.addEventListener('click', toggleFilterSidebar);

// Close Button Click
closeSidebar.addEventListener('click', closeFilterSidebar);

// Backdrop Click to Close
filterBackdrop.addEventListener('click', closeFilterSidebar);

// Price Slider Update
priceRange.addEventListener('input', () => {
  const maxPrice = parseInt(priceRange.value);
  priceDisplay.textContent = `₹0 - ₹${maxPrice.toLocaleString()}`;
});

// Initialize Brand and Category Filters
function initializeFilters() {
  // Get maximum price from products data
  const maxPriceFromData = Math.max(...allProductsData.map(p => p.price || 0), 100000);
  
  // Set price slider max value to actual max price (rounded up to nearest 1000)
  const roundedMaxPrice = Math.ceil(maxPriceFromData / 1000) * 1000;
  priceRange.max = roundedMaxPrice;
  priceRange.value = roundedMaxPrice;
  priceDisplay.textContent = `₹0 - ₹${roundedMaxPrice.toLocaleString()}`;

  const categories = new Set();

  allProductsData.forEach(product => {
    if (product.category) categories.add(product.category);
  });

  // Populate Category Filters
  categoryFiltersDiv.innerHTML = '';
  categories.forEach(category => {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `
      <input type="checkbox" value="${category}" class="category-filter">
      <span>${category}</span>
    `;
    categoryFiltersDiv.appendChild(label);
    
    // Add event listener to category filter
    label.querySelector('input').addEventListener('change', applyFiltersAutomatically);
  });

  // Add event listeners for auto-apply
  filterSearchInput.addEventListener('input', applyFiltersAutomatically);
  priceRange.addEventListener('input', () => {
    const maxPrice = parseInt(priceRange.value);
    priceDisplay.textContent = `₹0 - ₹${maxPrice.toLocaleString()}`;
    applyFiltersAutomatically();
  });
  bestSellersCheckbox.addEventListener('change', applyFiltersAutomatically);
}

// Reset Filters
resetFiltersBtn.addEventListener('click', () => {
  const maxPriceFromData = Math.max(...allProductsData.map(p => p.price || 0), 10000);
  const roundedMaxPrice = Math.ceil(maxPriceFromData / 1000) * 1000;
  
  filterSearchInput.value = '';
  priceRange.value = roundedMaxPrice;
  priceDisplay.textContent = `₹0 - ₹${roundedMaxPrice.toLocaleString()}`;
  bestSellersCheckbox.checked = false;
  
  document.querySelectorAll('.category-filter').forEach(cb => {
    cb.checked = false;
  });

  renderProducts(allProductsData);
  closeFilterSidebar();
});

// =======================================
// INITIALIZE + APPLY SEARCH FROM URL
// =======================================
window.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();

  // GET ?query= FROM URL (INDEX SEARCH)
  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get("query");

  if (searchQuery) {
    navSearch.value = searchQuery;
    applySearchFilter(searchQuery.toLowerCase());
  }
});
