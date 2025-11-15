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
import { db } from "../firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const bestsellerList = document.getElementById('bestsellerList');
const bestsellerLoader = document.getElementById('bestsellerLoader');

async function loadBestsellers() {
  try {
    // Debug: Check Firestore instance
    console.log("Firestore instance:", db);
    if (!db) throw new Error("Firestore 'db' is undefined!");

    // Show loader
    if (bestsellerLoader) bestsellerLoader.style.display = 'flex';

    // Clear previous items
    bestsellerList.innerHTML = '';

    // Firestore query
    const productsRef = collection(db, "Products");  // ✅ This must be Firestore instance
    console.log("Products collection ref:", productsRef);

    const q = query(productsRef, where("bestSeller", "==", true));
    const snap = await getDocs(q);

    console.log("Query snapshot:", snap);

    if (snap.empty) {
      bestsellerList.innerHTML = '<div>No best seller products yet.</div>';
      return;
    }

    // Create cards
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

      // Create the image element
      const img = document.createElement('img');
      img.src = data.mainUrl || 'https://via.placeholder.com/150';
      img.alt = data.name || `Product ${count + 1}`;
      img.style.cursor = 'pointer'; // Show pointer on hover

      // Wrap the image in an anchor tag
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


// Load bestsellers on page load
loadBestsellers();
