import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// DOM Elements
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

let allProductsData = [];

// ==========================
// Load Products
// ==========================
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

  } catch (err) {
    console.error("Error loading products:", err);
    productsList.innerHTML = "<div>Error loading products.</div>";
  } finally {
    loader.style.display = "none";
    mainContent.style.display = "block";
  }
}

// ==========================
// Render product cards
// ==========================
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
    card.appendChild(btnContainer);

    productsList.appendChild(card);
  });
}

// ==========================
// Filter products by search
// ==========================
export function applySearchFilter(searchText) {
  searchText = searchText.toLowerCase().trim();
  const filtered = allProductsData.filter(p => 
    p.name.toLowerCase().includes(searchText) || (p.brand || '').toLowerCase().includes(searchText)
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

// ==========================
// Search Suggestions
// ==========================
function showSearchSuggestions(query) {
  searchSuggestions.innerHTML = '';
  const filtered = allProductsData
    .filter(p => p.name.toLowerCase().includes(query) || (p.brand || '').toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 5); // top 5

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

// ==========================
// Search input events
// ==========================
navSearch.addEventListener('input', () => {
  const query = navSearch.value.toLowerCase().trim();

if (query === '') {
  renderProducts(allProductsData);
  heroSection.style.display = 'flex';  // ensure display
  heroSection.classList.remove('hidden');  // remove hidden class
  hideSearchSuggestions();
} else {
  showSearchSuggestions(query);
  heroSection.style.display = 'none';
  heroSection.classList.add('hidden'); // optional
}

});

// ==========================
// Search form submit
// ==========================
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = navSearch.value.toLowerCase().trim();
  applySearchFilter(query);
  hideSearchSuggestions();
});

// ==========================
// Contact Modal
// ==========================
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

// ==========================
// Initialize
// ==========================
window.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
});
