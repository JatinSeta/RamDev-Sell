// ==================== Mobile Menu Logic ====================
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');

// menu icon image swap: closed/open sources
let menuImg, closedSrc, openSrc;

function closeMenu() {
  if (!mobileMenu || !mobileMenu.classList.contains('active')) return;

  mobileMenu.classList.remove('active');
  mobileMenu.setAttribute('aria-hidden', 'true');

  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');

  try {
    if (menuImg) menuImg.src = closedSrc || (menuImg.getAttribute && menuImg.getAttribute('src')) || './Images/Menu.png';
  } catch (err) {
    // ignore
  }

  if (menuBackdrop) {
    menuBackdrop.classList.remove('active');
    menuBackdrop.setAttribute('aria-hidden', 'true');
  }
}

if (menuBtn && mobileMenu) {
  menuImg = menuBtn.querySelector('img');
  closedSrc = menuImg?.dataset?.closed || menuImg?.getAttribute('src') || './Images/Menu.png';
  openSrc = menuImg?.dataset?.open || './Images/close.png';

  const setMenuState = (isActive) => {
    mobileMenu.classList.toggle('active', isActive);
    mobileMenu.setAttribute('aria-hidden', String(!isActive));
    menuBtn.setAttribute('aria-expanded', String(isActive));
    if (menuImg) menuImg.src = isActive ? openSrc : closedSrc;
    if (menuBackdrop) {
      menuBackdrop.classList.toggle('active', isActive);
      menuBackdrop.setAttribute('aria-hidden', String(!isActive));
    }
  };

  menuBtn.addEventListener('click', () => {
    const willBeActive = !mobileMenu.classList.contains('active');
    setMenuState(willBeActive);
  });

  mobileMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setMenuState(false);
  });

  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', () => setMenuState(false));
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'F11' || e.keyCode === 122) {
    closeMenu();
  }
});

document.addEventListener('fullscreenchange', closeMenu);
document.addEventListener('webkitfullscreenchange', closeMenu);
document.addEventListener('mozfullscreenchange', closeMenu);
document.addEventListener('MSFullscreenChange', closeMenu);

window.addEventListener('resize', () => {
  try {
    if (window.innerWidth > 800) closeMenu();
  } catch (err) {}
});




 // Form submission handlers for demonstration
  document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Simple validation demo
    if (this.checkValidity()) {
      alert('Thank you for contacting us, ' + this.firstName.value + '!');
      this.reset();
    } else {
      this.reportValidity();
    }
  });

  document.getElementById('faqForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (this.checkValidity()) {
      alert('Thanks for your question submission!');
      this.reset();
    } else {
      this.reportValidity();
    }
  });

  // ==================== Firebase imports ====================
import { db } from "../firebase-config.js"; // your Firebase config
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


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
homeSearch.addEventListener("input", () => {
  const query = homeSearch.value.toLowerCase().trim();

  if (!query) {
    suggestionBox.style.display = "none";
    return;
  }

  const scoredProducts = homeProducts.map(product => {
    const name = product.name.toLowerCase();
    const brand = (product.brand || "").toLowerCase();
    let score = 0;

    // 🔥 Relevance scoring
    if (name === query) score += 100;
    else if (name.startsWith(query)) score += 80;
    else if (name.split(" ").includes(query)) score += 60;
    else if (name.includes(query)) score += 40;

    if (brand.includes(query)) score += 20;

    return { ...product, score };
  });

  const filtered = scoredProducts
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  suggestionBox.innerHTML = "";

  if (filtered.length === 0) {
    suggestionBox.style.display = "none";
    return;
  }

  filtered.forEach(product => {
    const div = document.createElement("div");
    div.className = "suggestion-item";

    div.innerHTML = `
      <img src="${product.mainUrl || "https://via.placeholder.com/40"}" class="suggestion-img">
      <div class="suggestion-text">
        <strong>${product.name}</strong>
        <small>${product.brand || "No Brand"}</small>
      </div>
    `;

    div.addEventListener("click", () => {
      window.location.href = `./Products/Products.html?query=${encodeURIComponent(product.name)}`;
    });

    suggestionBox.appendChild(div);
  });

  suggestionBox.style.display = "block";
});


document.addEventListener("click", (e) => {
  if (!suggestionBox.contains(e.target) && e.target !== homeSearch) {
    suggestionBox.style.display = "none";
  }
});
