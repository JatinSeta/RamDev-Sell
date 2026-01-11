// ==================== MOBILE MENU LOGIC ====================
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');

let menuImg, closedSrc, openSrc;

function closeMenu() {
    if (!mobileMenu || !mobileMenu.classList.contains('active')) return;
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    if (menuImg) menuImg.src = closedSrc;
    if (menuBackdrop) {
        menuBackdrop.classList.remove('active');
        menuBackdrop.setAttribute('aria-hidden', 'true');
    }
}

if (menuBtn && mobileMenu) {
    menuImg = menuBtn.querySelector('img');
    closedSrc = menuImg?.getAttribute('src') || './Images/Menu.png';
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

    menuBtn.addEventListener('click', () => setMenuState(!mobileMenu.classList.contains('active')));
    mobileMenu.addEventListener('click', e => { if (e.target.tagName === 'A') setMenuState(false); });
    if (menuBackdrop) menuBackdrop.addEventListener('click', () => setMenuState(false));
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 800) closeMenu(); });

// ==================== ANIMATED TYPING TEXT ====================
const animatedText = document.getElementById('animatedText');
const texts = [
    "Welcome To Our Websites",
    "Power Your Projects with RamDev Sales Corporation"
];
let textIndex = 0, charIndex = 0, typingSpeed = 100, deletingSpeed = 50, delayBetweenTexts = 1500;

function randomDelay(base) { return base + Math.random() * 50; }

function type() {
    const currentText = texts[textIndex];
    if (charIndex < currentText.length) {
        animatedText.textContent += currentText.charAt(charIndex);
        charIndex++;
        setTimeout(type, randomDelay(typingSpeed));
    } else setTimeout(deleteText, delayBetweenTexts);
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
import { collection, getDocs, query, where, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==================== HOMEPAGE BESTSELLERS ====================
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

// ==================== HOMEPAGE SEARCH ====================
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
    if (!query) return suggestionBox.style.display = "none";

    const filtered = homeProducts.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.brand || "").toLowerCase().includes(query)
    ).slice(0, 6);

    suggestionBox.innerHTML = "";
    if (!filtered.length) return suggestionBox.style.display = "none";

    filtered.forEach(product => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.innerHTML = `
            <img src="${product.mainUrl || "https://via.placeholder.com/40"}" class="suggestion-img">
            <div class="suggestion-text">${product.name} (${product.brand || "No Brand"})</div>
        `;
        div.addEventListener("click", () => window.location.href = `./Products/Products.html?query=${product.name}`);
        suggestionBox.appendChild(div);
    });
    suggestionBox.style.display = "block";
});

document.addEventListener("click", (e) => {
    if (!suggestionBox.contains(e.target) && e.target !== homeSearch) {
        suggestionBox.style.display = "none";
    }
});

// ==================== CONTACT FORM ====================
const contactForm = document.querySelector('.app-form');
const nameInput = contactForm.querySelector('input[placeholder="NAME"]');
const emailInput = contactForm.querySelector('input[placeholder="EMAIL"]');
const messageInput = contactForm.querySelector('textarea[placeholder="MESSAGE"]');
const sendBtn = contactForm.querySelector('button');
let formFeedback = document.createElement('div');
formFeedback.style.marginTop = '10px';
contactForm.appendChild(formFeedback);

function showFeedback(message, color='green') {
    formFeedback.style.color = color;
    formFeedback.textContent = message;
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

sendBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !email || !message) {
        showFeedback('Please fill in all fields.', 'red');
        return;
    }

    if (!validateEmail(email)) {
        showFeedback('Please enter a valid email address.', 'red');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    showFeedback('');

    try {
        await addDoc(collection(db, "ContactMessages"), {
            name, email, message, timestamp: new Date()
        });
        showFeedback('Message sent successfully!', 'green');
        nameInput.value = '';
        emailInput.value = '';
        messageInput.value = '';
    } catch (err) {
        console.error(err);
        showFeedback('Error sending message. Please try again later.', 'red');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'SEND';
    }
});
