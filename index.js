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
    if (menuImg)
      menuImg.src =
        closedSrc ||
        (menuImg.getAttribute && menuImg.getAttribute('src')) ||
        './Images/Menu.png';
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
  closedSrc =
    menuImg?.dataset?.closed ||
    menuImg?.getAttribute('src') ||
    './Images/Menu.png';
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

// ==================== Animated Typing Text ====================
const animatedText = document.getElementById('animatedText');
const texts = [
  "Welcome To Our Websites",
  "Power Your Projects with RamDev Sales Corporation"
];

let textIndex = 0;
let charIndex = 0;
let typingSpeed = 100;
let deletingSpeed = 50;
let delayBetweenTexts = 1500;

function randomDelay(base) {
  return base + Math.random() * 50;
}

function type() {
  const currentText = texts[textIndex];
  if (charIndex < currentText.length) {
    animatedText.textContent += currentText.charAt(charIndex);
    charIndex++;
    setTimeout(type, randomDelay(typingSpeed));
  } else {
    setTimeout(deleteText, delayBetweenTexts);
  }
}

function deleteText() {
  const currentText = texts[textIndex];
  if (charIndex > 0) {
    animatedText.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
    setTimeout(deleteText, randomDelay(deletingSpeed));
  } else {
    textIndex = (textIndex + 1) % texts.length;
    setTimeout(type, 500);
  }
}

type();

// ==================== FIREBASE IMPORTS ====================
import { db } from "../firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==================== Homepage Best Sellers ====================
const bestsellerList = document.getElementById('bestsellerList');
const bestsellerLoader = document.getElementById('bestsellerLoader');

async function loadBestsellers() {
  try {
    if (bestsellerLoader) bestsellerLoader.style.display = 'flex';

    bestsellerList.innerHTML = '';

    const productsRef = collection(db, "Products");
    const q = query(productsRef, where("bestSeller", "==", true));
    const snap = await getDocs(q);

    if (snap.empty) {
      bestsellerList.innerHTML = '<div>No best seller products yet.</div>';
      return;
    }

    const mainCards = createMainCards(snap);
    mainCards.forEach(card => bestsellerList.appendChild(card));

  } catch (err) {
    console.error("Error loading bestsellers:", err);
    bestsellerList.innerHTML = '<div>Error loading best sellers.</div>';
  } finally {
    if (bestsellerLoader) bestsellerLoader.style.display = 'none';
  }
}

function createMainCards(snap) {
  const cards = [];
  let count = 0;
  const totalDocs = snap.docs.length;

  for (let cardIndex = 0; cardIndex < 2 && count < totalDocs; cardIndex++) {
    const mainCard = document.createElement('div');
    mainCard.className = 'bestseller-card';

    const cardImages = document.createElement('div');
    cardImages.className = 'card-images';

    for (let i = 0; i < 4 && count < totalDocs; i++) {
      const docSnap = snap.docs[count];
      const data = docSnap.data();

      const img = document.createElement('img');
      img.src = data.mainUrl || 'https://via.placeholder.com/150';
      img.alt = data.name || `Product ${count + 1}`;
      img.style.cursor = 'pointer';

      const anchor = document.createElement('a');
      anchor.href = `./Products/productDetails.html?id=${docSnap.id}`;
      anchor.appendChild(img);

      cardImages.appendChild(anchor);
      count++;
    }

    mainCard.appendChild(cardImages);

    const exploreLink = document.createElement('a');
    exploreLink.href = './Products/Products.html';
    exploreLink.className = 'explore-all-link';
    exploreLink.textContent = 'Explore All';
    mainCard.appendChild(exploreLink);

    cards.push(mainCard);
  }

  return cards;
}

loadBestsellers();

// ==================== Homepage Search Suggestions ====================
const homeSearch = document.getElementById("homeSearch");
const suggestionBox = document.getElementById("indexSearchSuggestions");

let homeProducts = [];

// Load all products once
async function loadHomeProducts() {
  const productsRef = collection(db, "Products");
  const snap = await getDocs(productsRef);
  homeProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
loadHomeProducts();

// Live search suggestions
homeSearch.addEventListener("input", () => {
  const query = homeSearch.value.toLowerCase().trim();

  if (query === "") {
    suggestionBox.style.display = "none";
    return;
  }

  const filtered = homeProducts
    .filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.brand || "").toLowerCase().includes(query)
    )
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
      <div class="suggestion-text">${product.name} (${product.brand || "No Brand"})</div>
    `;

    div.addEventListener("click", () => {
      window.location.href = `./Products/Products.html?query=${product.name}`;
    });

    suggestionBox.appendChild(div);
  });

  suggestionBox.style.display = "block";
});

// Hide on outside click
document.addEventListener("click", (e) => {
  if (!suggestionBox.contains(e.target) && e.target !== homeSearch) {
    suggestionBox.style.display = "none";
  }
});
