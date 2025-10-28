const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');
// menu icon image swap: closed/open sources (fallback filenames)
let menuImg, closedSrc, openSrc;

// Helper to close the mobile menu (idempotent and safe to call from any handler)
function closeMenu() {
  if (!mobileMenu) return;
  if (!mobileMenu.classList.contains('active')) return;
  mobileMenu.classList.remove('active');
  mobileMenu.setAttribute('aria-hidden', 'true');
  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  try {
    if (menuImg) menuImg.src = closedSrc || (menuImg.getAttribute && menuImg.getAttribute('src')) || './Imges/Menu.png';
  } catch (err) {
    // ignore
  }
  if (menuBackdrop) {
    menuBackdrop.classList.remove('active');
    menuBackdrop.setAttribute('aria-hidden', 'true');
  }
}

if (menuBtn && mobileMenu) {
  // find img inside button (if present) and determine sources
  menuImg = menuBtn.querySelector('img');
openSrc = menuImg?.dataset?.open || './Imges/close.png';
closedSrc = menuImg?.dataset?.closed || './Imges/Menu.png';


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

  // close mobile menu when a link is clicked
  mobileMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      setMenuState(false);
    }
  });

  // clicking the backdrop closes the menu as well
  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', () => setMenuState(false));
  }
}


// Close mobile menu on Escape, F11 (fullscreen key), or when fullscreenchange occurs.
document.addEventListener('keydown', (e) => {
  // Escape
  if (e.key === 'Escape') {
    closeMenu();
    return;
  }
  // F11 key to toggle browser fullscreen -- close menu when user hits F11
  // e.key may be 'F11' or use keyCode 122 for older browsers
  if (e.key === 'F11' || e.keyCode === 122) {
    // don't prevent default; just ensure the menu is closed
    closeMenu();
    return;
  }
});

// Fullscreen API change (standard and vendor-prefixed events)
document.addEventListener('fullscreenchange', closeMenu);
document.addEventListener('webkitfullscreenchange', closeMenu);
document.addEventListener('mozfullscreenchange', closeMenu);
document.addEventListener('MSFullscreenChange', closeMenu);

// If the viewport is resized to a larger width (desktop), close the mobile menu.
window.addEventListener('resize', () => {
  try {
    if (window.innerWidth > 800) closeMenu();
  } catch (err) {
    // ignore
  }
});
const animatedText = document.getElementById('animatedText');
const texts = ["Welcome To Our Website","Power Your Projects with RamDev Sales Corporation"];
let textIndex = 0;
let charIndex = 0;
let typingSpeed = 100;   // faster typing
let deletingSpeed = 50;  // faster deleting
let delayBetweenTexts = 1500;

function randomDelay(base) {
  return base + Math.random() * 50;  // slight randomness for natural effect
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
