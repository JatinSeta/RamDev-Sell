import { db } from "../firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// DOM elements
const productsList = document.getElementById('productsList');
const loader = document.getElementById('loader');
const mainContent = document.getElementById('mainContent');
const contactModal = document.getElementById('contactModal');
const closeModalBtn = document.getElementById('closeModal');
const contactForm = document.getElementById('contactForm');
const productInput = document.getElementById('product');

// Load products
async function loadProducts() {
  try {
    const productsRef = collection(db, "Products");
    const snap = await getDocs(productsRef);

    const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(products);

    if (products.length === 0) {
      productsList.innerHTML = "<div>No products yet.</div>";
      return;
    }

    productsList.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';

      // Best Seller badge
      if (product.bestSeller) {
        const badge = document.createElement('div');
        badge.className = 'best-seller-badge';
        badge.textContent = 'Best Seller';
        card.appendChild(badge);
      }

      // Product image
      const img = document.createElement('img');
      img.src = product.mainUrl || "https://via.placeholder.com/150";
      img.alt = product.name || "Product";

      // Product name
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = product.name || "(no name)";

      // Product category
      const category = document.createElement('div');
      category.className = 'card-category';
      category.textContent = product.category || "Uncategorized";

      // Product details
      const details = document.createElement('p');
      details.className = 'card-details';
      details.textContent = product.details || "";

      // Buttons container
      const btnContainer = document.createElement('div');
      btnContainer.className = 'card-buttons';

      // Contact Us button
      const contactBtn = document.createElement('button');
      contactBtn.className = 'contact-btn';
      contactBtn.textContent = 'Contact Us';
      contactBtn.addEventListener('click', () => {
        productInput.value = product.name || "";
        contactModal.style.display = 'block';
      });

      // View button
      const viewBtn = document.createElement('button');
      viewBtn.className = 'view-btn';
      viewBtn.textContent = 'View';
      viewBtn.addEventListener('click', () => {
        alert(`View product: ${product.name}`); // Replace with actual product page later
      });

      btnContainer.appendChild(contactBtn);
      btnContainer.appendChild(viewBtn);

      // Append elements to card
      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(category);
      card.appendChild(details);
      card.appendChild(btnContainer);

      productsList.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading products:", err);
    productsList.innerHTML = "<div>Error loading products.</div>";
  } finally {
    loader.style.display = "none";
    mainContent.style.display = "block";
  }
}

// Close modal
closeModalBtn.addEventListener('click', () => {
  contactModal.style.display = 'none';
  contactForm.reset();
});

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});
