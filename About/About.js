// ==================== Firebase imports ====================
import { db } from "../firebase-config.js"; // your Firebase config
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==================== Mobile Menu Logic ====================
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');

let menuImg = menuBtn?.querySelector('img');
let closedSrc = menuImg?.dataset?.closed;
let openSrc = menuImg?.dataset?.open;

function setMenuState(isActive) {
    mobileMenu?.classList.toggle('active', isActive);
    mobileMenu?.setAttribute('aria-hidden', String(!isActive));
    menuBtn?.setAttribute('aria-expanded', String(isActive));
    if(menuImg) menuImg.src = isActive ? openSrc : closedSrc;
    if(menuBackdrop) {
        menuBackdrop.classList.toggle('active', isActive);
        menuBackdrop.setAttribute('aria-hidden', String(!isActive));
    }
}

menuBtn?.addEventListener('click', () => {
    const willBeActive = !mobileMenu.classList.contains('active');
    setMenuState(willBeActive);
});

mobileMenu?.addEventListener('click', e => {
    if(e.target.tagName === 'A') setMenuState(false);
});

menuBackdrop?.addEventListener('click', () => setMenuState(false));

document.addEventListener('keydown', e => {
    if(e.key === 'Escape') setMenuState(false);
});

// ==================== Search Suggestions Logic ====================
const homeSearch = document.getElementById("homeSearch");
const suggestionBox = document.getElementById("indexSearchSuggestions");

let homeProducts = [];

// Load all products once
async function loadHomeProducts() {
  try {
    const productsRef = collection(db, "Products");
    const snap = await getDocs(productsRef);
    homeProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Products loaded:", homeProducts.length);
  } catch (err) {
    console.error("Error loading products:", err);
  }
}
loadHomeProducts();

// Live search suggestions
homeSearch?.addEventListener("input", () => {
  const query = homeSearch.value.toLowerCase().trim();
  suggestionBox.innerHTML = ""; // clear previous suggestions

  if (!query) {
    suggestionBox.style.display = "none";
    return;
  }

  // Filter products by name or brand, top 5 suggestions
  const filtered = homeProducts.filter(p =>
    p.name.toLowerCase().includes(query) ||
    (p.brand || "").toLowerCase().includes(query)
  ).slice(0, 5);

  if (!filtered.length) {
    suggestionBox.style.display = "none";
    return;
  }

  filtered.forEach(product => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerHTML = `
      <img src="${product.mainUrl || 'https://via.placeholder.com/40'}" class="suggestion-img">
      <div class="suggestion-text">${product.name} (${product.brand || 'No Brand'})</div>
    `;

    div.addEventListener("click", () => {
      window.location.href = `../Products/Products.html?query=${product.name}`;
    });

    suggestionBox.appendChild(div);
  });

  suggestionBox.style.display = "block";
});

// Hide suggestions on outside click
document.addEventListener("click", (e) => {
  if (!suggestionBox.contains(e.target) && e.target !== homeSearch) {
    suggestionBox.style.display = "none";
  }
});
