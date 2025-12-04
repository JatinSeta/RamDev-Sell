import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// DOM elements
const productsList = document.getElementById('productsList');
const loader = document.getElementById('loader');
const mainContent = document.getElementById('mainContent');

// Modal elements
const contactModal = document.getElementById('contactModal');
const contactForm = document.getElementById('contactForm');
const productInput = document.getElementById('product');
const closeModal = document.getElementById('closeModal');

// Form Sections
const formSection = document.getElementById("formSection");
const thankYouSection = document.getElementById("thankYouSection");

// ==========================
// Load Products
// ==========================
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

      // Best Seller Badge
      if (product.bestSeller) {
        const badge = document.createElement('div');
        badge.className = 'best-seller-badge';
        badge.textContent = 'Best Seller';
        card.appendChild(badge);
      }

      // Product image (CLICKABLE)
      const img = document.createElement('img');
      img.src = product.mainUrl || "https://via.placeholder.com/150";
      img.alt = product.name || "Product";
      img.style.cursor = "pointer";

      img.addEventListener('click', () => {
        window.location.href = `../Products/productDetails.html?id=${product.id}`;
      });

      // Product name (CLICKABLE)
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = product.name || "(no name)";
      title.style.cursor = "pointer";

      title.addEventListener('click', () => {
        window.location.href = `../Products/productDetails.html?id=${product.id}`;
      });

      // Buttons container
      const btnContainer = document.createElement('div');
      btnContainer.className = 'card-buttons';

      // Contact Button ONLY
      const contactBtn = document.createElement('button');
      contactBtn.className = 'contact-btn';
      contactBtn.textContent = 'Contact Us';
      contactBtn.addEventListener('click', () => {
        productInput.value = product.name || "";
        contactModal.style.display = 'flex';
        formSection.style.display = 'block';
        thankYouSection.style.display = 'none';
      });

      btnContainer.appendChild(contactBtn);

      // Build card
      card.appendChild(img);
      card.appendChild(title);
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

// ==========================
// Prevent modal close on outside click
// ==========================
contactModal.addEventListener("click", (e) => {
  e.stopPropagation();
});

// ==========================
// Submit Inquiry Form
// ==========================
contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const company = document.getElementById('company').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const product = document.getElementById('product').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!name || !email || !phone || !message) {
    alert("Please fill all required fields.");
    return;
  }

  try {
    await addDoc(collection(db, "Inquiries"), {
      name,
      company,
      email,
      phone,
      product,
      message,
      createdAt: new Date()
    });

    // Show Thank You Message
    formSection.style.display = "none";
    thankYouSection.style.display = "block";

    // Close modal after 3 sec
    setTimeout(() => {
      contactModal.style.display = 'none';
      resetForm();
    }, 3000);

  } catch (err) {
    alert("Error submitting inquiry: " + err.message);
  }
});

// Reset form function
function resetForm() {
  document.getElementById('contactForm').reset();
  formSection.style.display = "block";
  thankYouSection.style.display = "none";
}

// ==========================
// Close Modal Button
// ==========================
closeModal.addEventListener('click', () => {
  contactModal.style.display = 'none';
  resetForm();
});

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});
