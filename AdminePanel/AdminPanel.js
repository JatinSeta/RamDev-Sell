    import { db } from "../firebase-config.js"; 
    import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

    // ---------------- DOM Elements ----------------
    const form = document.getElementById("dataForm");
    const addUrlBtn = document.getElementById("addUrlBtn");
    const extraUrlsContainer = document.getElementById("extraUrls");
    const mainPreview = document.getElementById('mainPreview');
    const thumbnailsContainer = document.getElementById('thumbnails');
    const previewContainer = document.getElementById('previewContainer');
    const productsList = document.getElementById('productsList');
    const bestSellersList = document.getElementById('bestSellersList');
    const detailsTextarea = document.getElementById('details');
    const wordCountDisplay = document.getElementById('wordCount');
    const categorySelect = document.getElementById('category');
    const addFieldBtn = document.getElementById('addFieldBtn');
    const keyValueContainer = document.getElementById('keyValueContainer');
    const searchInput = document.getElementById('searchInput');
    const mobileToggleBtn = document.querySelector('.mobile-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const selectBSBtn = document.querySelector('#selectBSBtn');

    // Orders elements
    const ordersList = document.getElementById("ordersList");
    const modal = document.getElementById("inquiryModal");
    const closeModalBtn = document.getElementById("closeModal");
    const modalCompany = document.getElementById("modalCompany");
    const modalName = document.getElementById("modalName");
    const modalEmail = document.getElementById("modalEmail");
    const modalMobile = document.getElementById("modalMobile");
    const modalProduct = document.getElementById("modalProduct");
    const modalQuantity = document.getElementById("modalQuantity");
    const modalDate = document.getElementById("modalDate");
    const orderSearchInput = document.getElementById("orderSearchInput");

    let fieldCount = 0;
    let currentLoadedImages = [];
    let previewIndex = 0;
    let urlCount = 2;
    const MAX_CHARS = 500;
    let editMode = false;
    let editingProductId = null;
    let selectingBestSellers = false;

    // ---------------- Sidebar toggle ----------------
    mobileToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    const overlay = document.getElementById('overlay');
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    const sections = document.querySelectorAll('.admin-section');

    function showSection(sectionId) {
        sections.forEach(sec => sec.style.display = sec.id === sectionId ? 'block' : 'none');
        menuItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-section') === sectionId));
        if(window.innerWidth <= 768) sidebar.classList.remove('active');
    }

    menuItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            showSection(item.getAttribute('data-section'));
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
        showSection('addProductSection'); // default
    });

    // ---------------- Image Preview ----------------
    function testImageLoad(url, timeout = 5000) {
        return new Promise(resolve => {
            const img = new Image();
            let done = false;
            const clean = ok => { if(done) return; done=true; resolve({ok,url}); };
            img.onload = () => clean(true);
            img.onerror = () => clean(false);
            img.src = url;
            setTimeout(() => clean(false), timeout);
        });
    }

    function getCurrentImages() {
        const inputs = document.querySelectorAll('.image-url');
        return Array.from(inputs).map(i => i.value.trim()).filter(v => v !== '');
    }

    function showPreviewAt(index) {
        if(!currentLoadedImages.length) return;
        mainPreview.src = currentLoadedImages[index];
        Array.from(thumbnailsContainer.children).forEach((thumb,i)=>{
            thumb.style.outline = i===index ? "2px solid #007bff" : "none";
        });
    }

    function updatePreviews() {
        const urls = getCurrentImages();
        if(!urls.length) { previewContainer.style.display='none'; return; }

        Promise.all(urls.map(u=>testImageLoad(u))).then(results=>{
            currentLoadedImages = results.filter(r=>r.ok).map(r=>r.url);
            if(!currentLoadedImages.length) { previewContainer.style.display='none'; return; }
            previewContainer.style.display='block';
            thumbnailsContainer.innerHTML='';
            currentLoadedImages.forEach((url,i)=>{
                const t = document.createElement('img');
                t.src = url;
                t.style.width='50px';
                t.style.height='50px';
                t.style.objectFit='cover';
                t.style.cursor='pointer';
                t.addEventListener('click', ()=>{ previewIndex=i; showPreviewAt(i); });
                thumbnailsContainer.appendChild(t);
            });
            previewIndex = Math.min(previewIndex, currentLoadedImages.length-1);
            showPreviewAt(previewIndex);
        });
    }

    document.querySelectorAll('.image-url').forEach(input=> input.addEventListener('input', updatePreviews));

    addUrlBtn.addEventListener('click', ()=>{
        urlCount++;
        const wrapper = document.createElement('div');
        wrapper.className='extra-url-row';
        const input=document.createElement('input');
        input.type='url'; input.className='image-url'; input.placeholder=`Image URL ${urlCount}`; input.style.flexGrow='1';
        input.addEventListener('input', updatePreviews);
        const removeBtn=document.createElement('button'); removeBtn.type='button'; removeBtn.textContent='Remove';
        removeBtn.addEventListener('click', ()=>{ wrapper.remove(); updatePreviews(); });
        wrapper.appendChild(input); wrapper.appendChild(removeBtn);
        extraUrlsContainer.appendChild(wrapper);
    });

    // ---------------- Character Count ----------------
    detailsTextarea.addEventListener('input', ()=>{
        let text = detailsTextarea.value;
        if(text.length>MAX_CHARS) text=text.substring(0,MAX_CHARS);
        detailsTextarea.value = text;
        wordCountDisplay.textContent = `${text.length} / ${MAX_CHARS} characters`;
    });

    // ---------------- Key-Value Fields ----------------
    addFieldBtn.addEventListener('click', ()=>{
        fieldCount++;
        const row = document.createElement('div');
        row.className='key-value-row';
        row.innerHTML = `<input type="text" placeholder="Key ${fieldCount}" required>
                        <input type="text" placeholder="Value ${fieldCount}" required>
                        <button type="button" class="remove-field">Remove</button>`;
        row.querySelector('.remove-field').addEventListener('click',()=>row.remove());
        keyValueContainer.appendChild(row);
    });

    function getKeyValuePairs(){
        const rows=document.querySelectorAll('.key-value-row');
        const list=[]; rows.forEach(r=>{
            const [k,v]=r.querySelectorAll('input');
            if(k.value.trim() && v.value.trim()) list.push({key:k.value,value:v.value});
        });
        return list;
    }

    // ---------------- Toast ----------------
    function showToast(text,type='success'){
        const existing=document.querySelector('.toast');
        if(existing) existing.remove();
        const toast=document.createElement('div');
        toast.className=`toast ${type}`;
        toast.innerHTML=`<div class="toast-text">${text}</div>`;
        document.body.appendChild(toast);
        setTimeout(()=>toast.remove(),3000);
    }

    // ---------------- Form Submit ----------------
   form.addEventListener('submit', async e => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const details = detailsTextarea.value.trim();
    const category = categorySelect.value.trim();
    const price = parseFloat(document.getElementById('price').value); // Get price value
    const brand = document.getElementById('brand').value.trim(); // Get brand value
    const images = getCurrentImages();
    const extraFields = getKeyValuePairs();
    
    if (!category) return showToast('Select a category', 'error');
    if (images.length < 2) return showToast('At least 2 images required', 'error');
    if (isNaN(price) || price <= 0) return showToast('Enter a valid price', 'error');
    if (!brand) return showToast('Enter a brand name', 'error');
    
    const mainImage = images[0];
    const otherImages = images.slice(1);

    try {
        if (editMode && editingProductId) {
            const docRef = doc(db, 'Products', editingProductId);
            await updateDoc(docRef, {
                name, details, category, brand, price, mainUrl: mainImage, images: otherImages, extraFields, updatedAt: serverTimestamp()
            });
            showToast('Product updated!');
        } else {
            await addDoc(collection(db, 'Products'), {
                name, details, category, brand, price, mainUrl: mainImage, images: otherImages, extraFields, bestSeller: false, createdAt: serverTimestamp()
            });
            showToast('Product added!');
        }
        resetForm();
        loadProducts();
    } catch (err) {
        console.error(err);
        showToast('Error saving product', 'error');
    }
});

    // ---------------- Reset Form ----------------
  function resetForm() {
    form.reset();
    extraUrlsContainer.innerHTML = '';
    keyValueContainer.innerHTML = '';
    currentLoadedImages = [];
    previewContainer.style.display = 'none';
    thumbnailsContainer.innerHTML = '';
    editMode = false;
    editingProductId = null;
    fieldCount = 0;
    detailsTextarea.dispatchEvent(new Event('input'));
}


    // ---------------- Select Best Sellers ----------------
    selectBSBtn.addEventListener('click', ()=>{
        selectingBestSellers = !selectingBestSellers;
        selectBSBtn.textContent = selectingBestSellers ? ' Done Selecting Best Sellers' : 'Select Best Sellers';
        selectBSBtn.style.backgroundColor = selectingBestSellers ? '#007bff' : '';
        // Highlight products for selection
        document.querySelectorAll('.product-card').forEach(card=>{
            card.style.border = selectingBestSellers ? '2px dashed #007bff' : '';
        });
    });

    // ---------------- Load Products ----------------
    async function loadProducts(){
        productsList.innerHTML='';
        bestSellersList.innerHTML='';

        const qSnap = await getDocs(query(collection(db,"Products"), orderBy("createdAt","desc")));

        qSnap.forEach(docSnap => {
            const data = docSnap.data();
            const productId = docSnap.id;

            // ----- ALL PRODUCTS CARD -----
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="bs-tag ${data.bestSeller ? 'visible' : ''}">Best Seller</div>
                <img src="${data.mainUrl}" alt="Product">
                <h3>${data.name}</h3>
                <div class="product-actions">
                    <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            // Edit product - open Add Product section automatically
            card.querySelector('.edit-btn').addEventListener('click', ()=>{
                showSection('addProductSection');
                fillEditForm(productId,data);
            });

            // Delete product
            card.querySelector('.delete-btn').addEventListener('click', async ()=>{
                if(confirm('Delete this product?')){
                    await deleteDoc(doc(db,'Products',productId));
                    loadProducts();
                }
            });

            // Toggle Best Seller
            card.querySelector('img').addEventListener('click', async ()=>{
                if(selectingBestSellers){
                    await updateDoc(doc(db,'Products',productId), { bestSeller: !data.bestSeller });
                    loadProducts();
                }
            });

            productsList.appendChild(card);

            // ----- BEST SELLERS CARD -----
            if(data.bestSeller){
                const bsCard = document.createElement('div');
                bsCard.className = 'product-card';
                bsCard.innerHTML = `
                    <img src="${data.mainUrl}" alt="Product">
                    <h3>${data.name}</h3>
                    <div class="product-actions">
                        <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="remove-bs-btn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `;
                bsCard.querySelector('.edit-btn').addEventListener('click', ()=>{
                    showSection('addProductSection');
                    fillEditForm(productId,data);
                });
                bsCard.querySelector('.remove-bs-btn').addEventListener('click', async ()=>{
                    if(confirm('Remove from Best Sellers?')){
                        await updateDoc(doc(db,'Products',productId), { bestSeller: false });
                        loadProducts();
                    }
                });
                bestSellersList.appendChild(bsCard);
            }
        });
    }

    // ---------------- Fill Edit Form ----------------
   function fillEditForm(id, data) {
    editMode = true;
    editingProductId = id;
    
    document.getElementById('name').value = data.name;
    detailsTextarea.value = data.details;
    detailsTextarea.dispatchEvent(new Event('input'));
    categorySelect.value = data.category;
    document.getElementById('price').value = data.price; // Pre-fill the price
    document.getElementById('brand').value = data.brand; // Pre-fill the brand
    
    // Handle Image URLs (as already done in your current code)
    document.getElementById('url1').value = data.mainUrl;
    document.getElementById('url2').value = data.images[0] || '';
    extraUrlsContainer.innerHTML = '';
    data.images.slice(1).forEach(url => {
        urlCount++;
        const row = document.createElement('div');
        row.className = 'extra-url-row';
        row.innerHTML = `<input type="url" class="image-url" value="${url}" style="flex-grow:1"><button type="button" class="remove-btn">Remove</button>`;
        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
        row.querySelector('.image-url').addEventListener('input', updatePreviews);
        extraUrlsContainer.appendChild(row);
    });

    keyValueContainer.innerHTML = '';
    fieldCount = 0;
    if (data.extraFields) {
        data.extraFields.forEach(field => {
            fieldCount++;
            const row = document.createElement('div');
            row.className = 'key-value-row';
            row.innerHTML = `<input type="text" value="${field.key}"><input type="text" value="${field.value}"><button type="button" class="remove-field">Remove</button>`;
            row.querySelector('.remove-field').addEventListener('click', () => row.remove());
            keyValueContainer.appendChild(row);
        });
    }
    updatePreviews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


    // ---------------- Search ----------------
    searchInput.addEventListener('input', ()=>{
        const q = searchInput.value.trim().toLowerCase().replace(/\s+/g,'');
        document.querySelectorAll('.product-card').forEach(card=>{
            const name = card.querySelector('h3')?.textContent.toLowerCase().replace(/\s+/g,'');
            card.style.display = name?.includes(q) ? 'flex' : 'none';
        });
    });

    // ---------------- Initialize ----------------
    loadProducts();

    async function loadOrders() {
        ordersList.innerHTML = ""; // Clear the orders list

        try {
            const inquiriesRef = collection(db, "Inquiries");
            const qSnap = await getDocs(query(inquiriesRef, orderBy("createdAt", "desc")));

            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const ordersByDate = {};

            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000) : null;
                if (!createdAt) return;

                let dateLabel = createdAt.toLocaleDateString();
                if (createdAt.toDateString() === today.toDateString()) dateLabel = "Today";
                else if (createdAt.toDateString() === yesterday.toDateString()) dateLabel = "Yesterday";
                else dateLabel = createdAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

                if (!ordersByDate[dateLabel]) ordersByDate[dateLabel] = [];
                ordersByDate[dateLabel].push({ id: docSnap.id, ...data, createdAt });
            });

            const sortedKeys = Object.keys(ordersByDate).sort((a, b) => {
                if (a === "Today") return -1;
                if (b === "Today") return 1;
                if (a === "Yesterday") return -1;
                if (b === "Yesterday") return 1;
                const dateA = new Date(ordersByDate[a][0].createdAt);
                const dateB = new Date(ordersByDate[b][0].createdAt);
                return dateB - dateA;
            });

            // Event listener for search input
            const searchInput = document.getElementById("orderSearchInput");
            searchInput.addEventListener("input", function () {
                const searchTerm = searchInput.value.toLowerCase();
                displayOrders(ordersByDate, sortedKeys, searchTerm);
            });

            // Initial display of orders
            displayOrders(ordersByDate, sortedKeys);

        } catch (err) {
            console.error(err);
        }
    }
    function displayOrders(ordersByDate, sortedKeys, searchTerm = "") {
        ordersList.innerHTML = ""; // Clear the list before re-rendering

        const searching = searchTerm.trim().length > 0;
        let anyResults = false;

        sortedKeys.forEach(dateLabel => {

            // Filter orders by search term
            const filteredOrders = ordersByDate[dateLabel].filter(order => {
                const company = (order.company || '').toLowerCase();
                const name = (order.name || '').toLowerCase();
                const email = (order.email || '').toLowerCase();
                const phone = (order.phone || '').toLowerCase();
                return company.includes(searchTerm) || name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
            });

            // If searching, DO NOT show date headings
            if (!searching) {
                // GROUP HEADING
                const groupHeader = document.createElement("h3");
                groupHeader.textContent = dateLabel;
                groupHeader.style.marginTop = "20px";
                groupHeader.style.borderBottom = "1px solid #ccc";
                groupHeader.style.paddingBottom = "5px";
                ordersList.appendChild(groupHeader);
            }

            // Render filtered orders
            filteredOrders.forEach(data => {
                anyResults = true;

                const card = document.createElement("div");
                card.className = "inquiry-card";
                card.style.border = "1px solid #ccc";
                card.style.padding = "10px";
                card.style.marginBottom = "10px";
                card.style.borderRadius = "8px";
                card.style.display = "flex";
                card.style.justifyContent = "space-between";
                card.style.alignItems = "center";
                card.style.position = "relative";

                card.innerHTML = `
                    <div>
                        <h4>${data.company || 'Unknown Company'}</h4>
                        <p><strong>Name:</strong> ${data.name || ''}</p>
                        <p><strong>Email:</strong> ${data.email || ''}</p>
                        <p><strong>Phone:</strong> ${data.phone || ''}</p>
                    </div>
                    <button class="view-btn" style="padding:5px 10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;">View</button>
                `;

                // NEW badge
                if (!data.seen) {
                    const badge = document.createElement("span");
                    badge.textContent = "New";
                    badge.style.position = "absolute";
                    badge.style.top = "10px";
                    badge.style.right = "10px";
                    badge.style.background = "#ff3b30";
                    badge.style.color = "#fff";
                    badge.style.padding = "2px 6px";
                    badge.style.borderRadius = "12px";
                    badge.style.fontSize = "12px";
                    badge.style.fontWeight = "bold";
                    card.appendChild(badge);
                }

                // View button opens modal
                card.querySelector(".view-btn").addEventListener("click", async () => {
                    modalCompany.textContent = data.company || '';
                    modalName.textContent = data.name || '';
                    modalEmail.textContent = data.email || '';
                    modalMobile.textContent = data.mobile || '';
                    modalProduct.textContent = data.product || '';
                    modalQuantity.textContent = data.quantity || '';
                    modalDate.textContent = data.createdAt 
                        ? data.createdAt.toLocaleString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        })
                        : '';
                    modal.style.display = "flex";

                    // Mark as seen
                    try {
                        await updateDoc(doc(db, "Inquiries", data.id), { seen: true });
                        const badge = card.querySelector("span");
                        if (badge) badge.remove();
                    } catch (err) {
                        console.error("Error marking order as seen:", err);
                    }
                });

                ordersList.appendChild(card);
            });
        });

        // If searching & no result → show message
        if (searching && !anyResults) {
            const noRes = document.createElement("p");
            noRes.textContent = "No orders found.";
            noRes.style.textAlign = "center";
            noRes.style.marginTop = "20px";
            ordersList.appendChild(noRes);
        }
    }

        closeModalBtn.addEventListener("click", ()=>{ modal.style.display="none"; });
        window.addEventListener("click", e=>{ if(e.target==modal) modal.style.display="none"; });

        loadOrders();
        import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
        const loginModal = document.getElementById("loginModal");
        const loginForm = document.getElementById("loginForm");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const errorMessage = document.getElementById("error-message");
        const closeLoginBtn = document.getElementById("closeModalBtn");

        // Optional: hide the close button if you don't want users to close modal manually
        closeLoginBtn.style.display = "none";

        // Example using Firebase Auth (Web v9 modular)

        const auth = getAuth();

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in:", userCredential.user);

            localStorage.setItem('isLoggedIn', 'true');

            loginModal?.remove();
            document.getElementById('loginOverlay')?.remove();

            sidebar.classList.remove('active');
            mobileToggleBtn.style.display = "block";

        } catch (error) {
            console.error(error);

            // Friendly error messages
            let message = "";
            switch (error.code) {
                case "auth/user-not-found":
                    message = "Email mismatch: user not found.";
                    break;
                case "auth/wrong-password":
                    message = "Password mismatch: incorrect password.";
                    break;
                case "auth/invalid-email":
                    message = "Invalid email format.";
                    break;
                case "auth/user-disabled":
                    message = "User account is disabled.";
                    break;
                default:
                    message = "Login failed. Please try again.";
            }

            errorMessage.textContent = message;
        }
    });



        const loginOverlay = document.getElementById('loginOverlay');

        function showLoginModal() {
        // Check if user is logged in, if so, skip showing the modal
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            loginModal.style.display = 'flex';
            loginOverlay.style.display = 'block';
        }
        }

        function hideLoginModal() {
        loginModal.style.display = 'none';
        loginOverlay.style.display = 'none';
        }

        closeLoginBtn.addEventListener('click', hideLoginModal);
        loginOverlay.addEventListener('click', hideLoginModal);

        // Example: show login modal on page load
        document.addEventListener('DOMContentLoaded', showLoginModal);

        // Function to handle logout
        function logout() {
        // Remove the login state from localStorage
        localStorage.removeItem('isLoggedIn');
        
        // Reload the page to reset the state and potentially show the login modal
        window.location.reload();
        }

        // Event listener for "Log Out" click
        const logoutBtn = document.querySelector('.menu-item.signout');
        if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default link behavior (if any)
            logout(); // Call logout function
        });
        }
    const togglePassword = document.getElementById("togglePassword");

    togglePassword.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);

        // Toggle Font Awesome icon
        togglePassword.classList.toggle("fa-eye");
        togglePassword.classList.toggle("fa-eye-slash");
    });