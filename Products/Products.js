import { app, db } from "../firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const productsList = document.getElementById('productsList');

async function loadProducts() {
  productsList.innerHTML = 'Loading products...';

  try {
    const q = query(collection(db, 'Products'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);

    if (snap.empty) {
      productsList.innerHTML = '<div>No products yet.</div>';
      return;
    }

    productsList.innerHTML = '';

    snap.forEach(docSnap => {
      const data = docSnap.data();

      // Create card container
      const card = document.createElement('div');
      card.className = 'product-card';

      // Product image
      const img = document.createElement('img');
      img.src = data.mainUrl || 'https://via.placeholder.com/150';
      img.alt = data.name || 'Product';
      img.className = 'card-img';

      // Product title
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = data.name || '(no name)';

      // Buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'card-buttons';

      // Contact button
      const contactBtn = document.createElement('button');
      contactBtn.className = 'contact-btn';
      contactBtn.textContent = 'Contact User';
      contactBtn.addEventListener('click', e => {
        e.stopPropagation();
        window.location.href = `mailto:seller@example.com?subject=Inquiry about ${data.name}`;
      });

      // View button
      const viewBtn = document.createElement('button');
      viewBtn.className = 'view-btn';
      viewBtn.textContent = 'View';
    // Inside card creation loop:
viewBtn.addEventListener('click', e => {
  e.stopPropagation();
  // Ensure correct relative path
  window.location.href = `../AdminePanel/productDetails.html?id=${docSnap.id}`;
});


      buttonsContainer.appendChild(contactBtn);
      buttonsContainer.appendChild(viewBtn);

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(buttonsContainer);

      productsList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    productsList.innerHTML = '<div>Error loading products.</div>';
  }
}

// Load products on page load
loadProducts();
