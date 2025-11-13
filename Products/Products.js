import { app, db } from "../firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// DOM elements
const productsList = document.getElementById('productsList');
const loader = document.getElementById('loader');
const mainContent = document.getElementById('mainContent');
const pagination = document.getElementById('pagination');
const contactModal = document.getElementById('contactModal'); // modal container
const closeModal = document.getElementById('closeModal');
const productInput = document.getElementById('product');
const contactForm = document.getElementById('contactForm');

let products = [];
let currentPage = 1;
let itemsPerPage = window.innerWidth <= 768 ? 8 : 12;

// Load products from Firestore
async function loadProducts() {
  try {
    const q = query(collection(db,'Products'), orderBy('createdAt','desc'), limit(50));
    const snap = await getDocs(q);

    products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (products.length === 0) {
      productsList.innerHTML = '<div>No products yet.</div>';
    } else {
      renderPage(currentPage);
      renderPagination();
    }
  } catch (err) {
    console.error(err);
    productsList.innerHTML = '<div>Error loading products.</div>';
  } finally {
    loader.style.display = 'none';
    mainContent.style.display = 'block';
  }
}

// Render current page products
function renderPage(page) {
  productsList.innerHTML = '';
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageProducts = products.slice(start, end);

  pageProducts.forEach(data => {
    const card = document.createElement('div');
    card.className = 'product-card';

    if (data.bestSeller) {
      const badge = document.createElement('div');
      badge.className = 'best-seller-badge';
      badge.textContent = 'Best Seller';
      card.appendChild(badge);
    }

    const img = document.createElement('img');
    img.src = data.mainUrl || 'https://via.placeholder.com/150';
    img.alt = data.name || 'Product';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = data.name || '(no name)';

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'card-buttons';

    const contactBtn = document.createElement('button');
    contactBtn.className = 'contact-btn';
    contactBtn.textContent = 'Contact Us';

    // Open modal when contact clicked
    contactBtn.addEventListener('click', e => {
      e.stopPropagation();
      productInput.value = data.name || '';
      contactModal.style.display = 'block'; // show modal
    });

    const viewBtn = document.createElement('button');
    viewBtn.className = 'view-btn';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', e => {
      e.stopPropagation();
      window.location.href = `./productDetails.html?id=${data.id}`;
    });

    buttonsContainer.appendChild(contactBtn);
    buttonsContainer.appendChild(viewBtn);

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(buttonsContainer);

    productsList.appendChild(card);
  });
}

// Render pagination
function renderPagination() {
  pagination.innerHTML = '';
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    currentPage--;
    renderPage(currentPage);
    renderPagination();
    window.scrollTo(0, 0);
  });
  pagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPage ? 'active' : '';
    btn.addEventListener('click', () => {
      currentPage = i;
      renderPage(currentPage);
      renderPagination();
      window.scrollTo(0, 0);
    });
    pagination.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    currentPage++;
    renderPage(currentPage);
    renderPagination();
    window.scrollTo(0, 0);
  });
  pagination.appendChild(nextBtn);
}

// Responsive handling
window.addEventListener('resize', () => {
  itemsPerPage = window.innerWidth <= 768 ? 8 : 12;
  currentPage = 1;
  renderPage(currentPage);
  renderPagination();
});

// Close modal events
closeModal.onclick = () => contactModal.style.display = 'none';
window.onclick = (event) => {
  if (event.target === contactModal) contactModal.style.display = 'none';
};

// Handle form submission
contactForm.onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const company = document.getElementById("company").value;
  const mobile = document.getElementById("mobile").value;
  const product = document.getElementById("product").value;
  const quantity = document.getElementById("quantity").value;

  alert(`Thank you, ${name}! Your inquiry for "${product}" has been submitted.`);

  contactForm.reset();
  contactModal.style.display = 'none';
};

// Initial load
loadProducts();
