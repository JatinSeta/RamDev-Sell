// ==================== Mobile Menu Logic ====================
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');

let menuImg, closedSrc, openSrc;

function closeMenu() {
  if (!mobileMenu || !mobileMenu.classList.contains('active')) return;

  mobileMenu.classList.remove('active');
  mobileMenu.setAttribute('aria-hidden', 'true');
  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');

  try {
    if (menuImg) menuImg.src = closedSrc || (menuImg.getAttribute && menuImg.getAttribute('src')) || './Images/Menu.png';
  } catch {}

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
    setMenuState(!mobileMenu.classList.contains('active'));
  });

  mobileMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setMenuState(false);
  });

  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', () => setMenuState(false));
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'F11' || e.keyCode === 122) closeMenu();
});
['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(ev => document.addEventListener(ev, closeMenu));
window.addEventListener('resize', () => { if(window.innerWidth > 800) closeMenu(); });

// ==================== Animated Typing Text ====================
const animatedText = document.getElementById('animatedText');
const texts = [
  "Welcome To Our Website",
  "Power Your Projects with RamDev Sales Corporation"
];
let textIndex = 0, charIndex = 0, typingSpeed = 100, deletingSpeed = 50, delayBetweenTexts = 1500;

function randomDelay(base){ return base + Math.random()*50; }

function type(){
  const currentText = texts[textIndex];
  if(charIndex < currentText.length){
    animatedText.textContent += currentText.charAt(charIndex);
    charIndex++;
    setTimeout(type, randomDelay(typingSpeed));
  } else { setTimeout(deleteText, delayBetweenTexts); }
}

function deleteText(){
  const currentText = texts[textIndex];
  if(charIndex > 0){
    animatedText.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
    setTimeout(deleteText, randomDelay(deletingSpeed));
  } else { textIndex = (textIndex + 1) % texts.length; setTimeout(type, 500); }
}
type();

// ==================== Firebase Imports ====================
import { db } from "../firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==================== Toast Notification Function ====================
function showToast(message) {
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toastMessage.classList.add('show');

    // Hide the toast after 3 seconds
    setTimeout(() => {
        toastMessage.classList.remove('show');
    }, 3000);
}

// ==================== Contact Form ====================
const contactBtn = document.getElementById('contactSubmitBtn');
const contactName = document.getElementById('contactName');
const contactEmail = document.getElementById('contactEmail');
const contactMessage = document.getElementById('contactMessage');

contactBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Validate input fields
    if (!contactName.value || !contactEmail.value || !contactMessage.value) {
        showToast("Please fill in all fields!");
        return;
    }

    try {
        // Save the contact message to Firebase Firestore
        await addDoc(collection(db, "ContactMessages"), {
            name: contactName.value,
            email: contactEmail.value,
            message: contactMessage.value,
            timestamp: new Date().toISOString()
        });

        // Show success toast and reset the form
        showToast("Message sent successfully!");
        contactName.value = '';
        contactEmail.value = '';
        contactMessage.value = '';

    } catch (err) {
        console.error("Error sending message:", err);
        showToast("Failed to send message. Please try again.");
    }
});

// ==================== Homepage Search Suggestions ====================
const homeSearch = document.getElementById("homeSearch");
const suggestionBox = document.getElementById("indexSearchSuggestions");
let homeProducts = [];

async function loadHomeProducts() {
  const productsRef = collection(db, "Products");
  const snap = await getDocs(productsRef);
  homeProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
loadHomeProducts();

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

document.addEventListener("click", (e) => {
  if (!suggestionBox.contains(e.target) && e.target !== homeSearch) {
    suggestionBox.style.display = "none";
  }
});
