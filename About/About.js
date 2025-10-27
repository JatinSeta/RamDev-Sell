const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');

let menuImg = menuBtn?.querySelector('img');
let closedSrc = menuImg?.dataset?.closed;
let openSrc = menuImg?.dataset?.open;

function setMenuState(isActive) {
    mobileMenu.classList.toggle('active', isActive);
    mobileMenu.setAttribute('aria-hidden', String(!isActive));
    menuBtn.setAttribute('aria-expanded', String(isActive));
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
