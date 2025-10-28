// ======= Mobile Menu Toggle Script =======

const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');

let menuImg;
let closedSrc;
let openSrc;

// Function to close the mobile menu safely
function closeMenu() {
  if (!mobileMenu || !menuImg) return;

  mobileMenu.classList.remove('active');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuImg.src = closedSrc;

  if (menuBackdrop) {
    menuBackdrop.classList.remove('active');
    menuBackdrop.setAttribute('aria-hidden', 'true');
  }
}

// Setup menu button and event listeners
if (menuBtn && mobileMenu) {
  menuImg = menuBtn.querySelector('img');

  // Use reliable attributes — avoids fallback path issues on mobile
  closedSrc = menuImg.getAttribute('data-closed') || './Images/Menu.png';
  openSrc = menuImg.getAttribute('data-open') || './Images/Close.png';

  const toggleMenu = () => {
    const isActive = mobileMenu.classList.contains('active');

    if (isActive) {
      closeMenu();
    } else {
      mobileMenu.classList.add('active');
      mobileMenu.setAttribute('aria-hidden', 'false');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuImg.src = openSrc;

      if (menuBackdrop) {
        menuBackdrop.classList.add('active');
        menuBackdrop.setAttribute('aria-hidden', 'false');
      }
    }
  };

  menuBtn.addEventListener('click', toggleMenu);

  // Clicking a menu link closes the menu
  mobileMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeMenu();
  });

  // Clicking outside menu closes it too
  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', closeMenu);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Auto-close if resized back to desktop width
  window.addEventListener('resize', () => {
    if (window.innerWidth > 800) closeMenu();
  });
}

// ======= Typing Animation Script =======

const animatedText = document.getElementById('animatedText');
const texts = [
  "Welcome To Our Website",
  "Power Your Projects with RamDev Sales Corporation"
];

let textIndex = 0;
let charIndex = 0;
const typingSpeed = 100;   // typing speed in ms
const deletingSpeed = 50;  // deleting speed in ms
const delayBetweenTexts = 1500; // pause before deleting

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
