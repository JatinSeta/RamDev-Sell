
import { app, db } from "../firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const productsList = document.getElementById('productsList');
const loader = document.getElementById('loader');
const mainContent = document.getElementById('mainContent');

async function loadProducts() {
  try {
    const q = query(collection(db,'Products'), orderBy('createdAt','desc'), limit(50));
    const snap = await getDocs(q);

    productsList.innerHTML = '';

    if (snap.empty) {
      productsList.innerHTML = '<div>No products yet.</div>';
    } else {
      snap.forEach(docSnap => {
        const data = docSnap.data();

        const card = document.createElement('div');
        card.className = 'product-card';

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
        contactBtn.textContent = 'Contact User';
        contactBtn.addEventListener('click', e => {
          e.stopPropagation();
          window.location.href = `mailto:seller@example.com?subject=Inquiry about ${data.name}`;
        });

        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', e => {
          e.stopPropagation();
          window.location.href = `../AdminePanel/productDetails.html?id=${docSnap.id}`;
        });

        buttonsContainer.appendChild(contactBtn);
        buttonsContainer.appendChild(viewBtn);

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(buttonsContainer);

        productsList.appendChild(card);
      });
    }

  } catch (err) {
    console.error(err);
    productsList.innerHTML = '<div>Error loading products.</div>';
  } finally {
    // Hide loader and show main content
    loader.style.display = 'none';
    mainContent.style.display = 'block';
  }
}

// Run the function
loadProducts();