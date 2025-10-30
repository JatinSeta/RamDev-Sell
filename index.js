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

// Function to load bestsellers from Firestore
import { db } from "../firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Get references to the DOM elements
const bestsellerList = document.getElementById('bestsellerList');
const bestsellerLoader = document.getElementById('bestsellerLoader');

// Function to load bestsellers from Firestore
async function loadBestsellers() {
  try {
    // Query to fetch products that are marked as best sellers
    const q = query(collection(db, 'Products'), where('bestSeller', '==', true));
    const snap = await getDocs(q);

    // Clear loader and start adding content
    bestsellerList.innerHTML = ''; // Clear loader

    if (snap.empty) {
      bestsellerList.innerHTML = '<div>No best seller products yet.</div>';
      return;
    }

    // Create the main cards with 8 images (2 cards with 4 images each)
    const mainCards = createMainCards(snap);
    mainCards.forEach(card => bestsellerList.appendChild(card));

  } catch (err) {
    console.error(err);
    bestsellerList.innerHTML = '<div>Error loading best sellers.</div>';
  } finally {
    if (bestsellerLoader) bestsellerLoader.style.display = 'none';
  }
}

// Create two main cards with 4 images each
function createMainCards(snap) {
  const cards = [];
  let count = 0;

  // Create 2 cards (each card will have 4 images)
  for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
    const mainCard = document.createElement('div');
    mainCard.className = 'bestseller-card';

    // Create the card-images container
    const cardImages = document.createElement('div');
    cardImages.className = 'card-images';

    // Loop through 4 products for this main card
    for (let i = 0; i < 4 && count < snap.size; i++) {
      const data = snap.docs[count].data();
      const img = document.createElement('img');
      img.src = data.mainUrl || 'https://via.placeholder.com/150';  // Fallback image
      img.alt = data.name || 'Product ' + (count + 1);
      cardImages.appendChild(img);
      count++;
    }

    mainCard.appendChild(cardImages);

    // Explore All link (optional)
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