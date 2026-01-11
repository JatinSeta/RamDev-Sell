// =======================================
// IMPORTS
// =======================================
import { db } from "../firebase-config.js"; 
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, getDocs 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// =======================================
// DOM ELEMENTS
// =======================================
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

// Orders
const ordersList = document.getElementById("ordersList");
const modal = document.getElementById("inquiryModal");
const closeModalBtn = document.getElementById("closeModal");
const modalCompany = document.getElementById("modalCompany");
const modalName = document.getElementById("modalName");
const modalEmail = document.getElementById("modalEmail");
const modalMobile = document.getElementById("modalMobile");
const modalProduct = document.getElementById("modalProduct");
const modalQuantity = document.getElementById("modalQuantity");
const modalMessage = document.getElementById("modalMessge");
const orderSearchInput = document.getElementById("orderSearchInput");

// Contact Messages
const contactList = document.getElementById("contactList");
const contactSearchInput = document.getElementById("contactSearchInput");

// Login
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const loginModal = document.getElementById('loginModal');
const loginOverlay = document.getElementById('loginOverlay');
const togglePassword = document.querySelector('.toggle-password');

// State
let fieldCount = 0;
let currentLoadedImages = [];
let previewIndex = 0;
let urlCount = 2;
const MAX_CHARS = 1000;
let editMode = false;
let editingProductId = null;
let selectingBestSellers = false;

// =======================================
// SIDEBAR TOGGLE
// =======================================
mobileToggleBtn.addEventListener('click', () => sidebar.classList.toggle('active'));
document.getElementById('overlay').addEventListener('click', () => sidebar.classList.remove('active'));

// =======================================
// MENU NAVIGATION
// =======================================
const menuItems = document.querySelectorAll('.menu-item[data-section]');
const sections = document.querySelectorAll('.admin-section');

function showSection(sectionId) {
    sections.forEach(sec => sec.style.display = sec.id === sectionId ? 'block' : 'none');
    menuItems.forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        showSection(item.getAttribute('data-section'));
    });
});
    if(window.innerWidth <= 768) sidebar.classList.remove('active');
}

menuItems.forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        showSection(item.getAttribute('data-section'));
        if(item.getAttribute("data-section") === "allProductsSection") loadProducts();
        if(item.getAttribute("data-section") === "ordersSection") loadOrders();
        if(item.getAttribute("data-section") === "contactSection") loadContacts();
    });
});

document.addEventListener('DOMContentLoaded', () => showSection('addProductSection'));

// =======================================
// IMAGE PREVIEW
// =======================================
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

// =======================================
// CHARACTER COUNT
// =======================================
detailsTextarea.addEventListener('input', ()=>{
    let text = detailsTextarea.value;
    if(text.length>MAX_CHARS) text=text.substring(0,MAX_CHARS);
    detailsTextarea.value = text;
    wordCountDisplay.textContent = `${text.length} / ${MAX_CHARS} characters`;
});

// =======================================
// KEY-VALUE FIELDS
// =======================================
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

// =======================================
// TOAST
// =======================================
function showToast(text,type='success'){
    const existing=document.querySelector('.toast');
    if(existing) existing.remove();
    const toast=document.createElement('div');
    toast.className=`toast ${type}`;
    toast.innerHTML=`<div class="toast-text">${text}</div>`;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),3000);
}

// =======================================
// FORM SUBMIT
// =======================================
form.addEventListener('submit', async e => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const details = detailsTextarea.value.trim();
    const category = categorySelect.value.trim();
    const price = parseFloat(document.getElementById('price').value); 
    const brand = document.getElementById('brand').value.trim(); 
    const images = getCurrentImages();
    const minQuantity = parseInt(document.getElementById('minQuantity').value); 
    const extraFields = getKeyValuePairs();
    
    if (!category) return showToast('Select a category', 'error');
    if (images.length < 2) return showToast('At least 2 images required', 'error');
    if (isNaN(price) || price <= 0) return showToast('Enter a valid price', 'error');
    if (!brand) return showToast('Enter a brand name', 'error');
    if (isNaN(minQuantity) || minQuantity <= 0) return showToast('Enter a valid maximum quantity', 'error');
    
    const mainImage = images[0];
    const otherImages = images.slice(1);

    try {
        if (editMode && editingProductId) {
            const docRef = doc(db, 'Products', editingProductId);
            await updateDoc(docRef, {
                name, details, category, brand, price, minQuantity, mainUrl: mainImage, images: otherImages, extraFields, updatedAt: serverTimestamp()
            });
            showToast('Product updated!');
        } else {
            await addDoc(collection(db, 'Products'), {
                name, details, category, brand, price, minQuantity, mainUrl: mainImage, images: otherImages, extraFields, bestSeller: false, createdAt: serverTimestamp()
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

// =======================================
// RESET FORM
// =======================================
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

// =======================================
// BEST SELLER SELECT
// =======================================
selectBSBtn.addEventListener('click', ()=>{
    selectingBestSellers = !selectingBestSellers;
    selectBSBtn.textContent = selectingBestSellers ? ' Done Selecting Best Sellers' : 'Select Best Sellers';
    selectBSBtn.style.backgroundColor = selectingBestSellers ? '#007bff' : '';
    document.querySelectorAll('.product-card').forEach(card=>{
        card.style.border = selectingBestSellers ? '2px dashed #007bff' : '';
    });
});

// =======================================
// LOAD PRODUCTS
// =======================================
async function loadProducts() {
    productsList.innerHTML = '';
    bestSellersList.innerHTML = '';

    const qSnap = await getDocs(query(collection(db, "Products"), orderBy("createdAt", "desc")));

    qSnap.forEach(docSnap => {
        const data = docSnap.data();
        const productId = docSnap.id;

        // ALL PRODUCTS CARD
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="bs-tag ${data.bestSeller ? 'visible' : ''}">Best Seller</div>
            <img src="${data.mainUrl}" alt="Product">
            <h3>${data.name}</h3>
            <p>Min Quantity: ${data.minQuantity}</p>
            <div class="product-actions">
                <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        card.querySelector('.edit-btn').addEventListener('click', () => { showSection('addProductSection'); fillEditForm(productId, data); });
        card.querySelector('.delete-btn').addEventListener('click', async () => { if(confirm('Delete this product?')){ await deleteDoc(doc(db,'Products',productId)); loadProducts(); } });
        card.querySelector('img').addEventListener('click', async () => { if(selectingBestSellers){ await updateDoc(doc(db,'Products',productId),{bestSeller:!data.bestSeller}); loadProducts(); } });

        productsList.appendChild(card);

        if (data.bestSeller) {
            const bsCard = document.createElement('div');
            bsCard.className = 'product-card';
            bsCard.innerHTML = `
                <img src="${data.mainUrl}" alt="Product">
                <h3>${data.name}</h3>
                <p>Min Quantity: ${data.minQuantity}</p>
                <div class="product-actions">
                    <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="remove-bs-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
            bsCard.querySelector('.edit-btn').addEventListener('click', () => { showSection('addProductSection'); fillEditForm(productId, data); });
            bsCard.querySelector('.remove-bs-btn').addEventListener('click', async () => { if(confirm('Remove from Best Sellers?')){ await updateDoc(doc(db,'Products',productId),{bestSeller:false}); loadProducts(); } });
            bestSellersList.appendChild(bsCard);
        }
    });
}

// =======================================
// FILL EDIT FORM
// =======================================
function fillEditForm(id,data){
    editMode=true;
    editingProductId=id;

    document.getElementById('name').value=data.name;
    detailsTextarea.value=data.details; detailsTextarea.dispatchEvent(new Event('input'));
    categorySelect.value=data.category;
    document.getElementById('price').value=data.price;
    document.getElementById('brand').value=data.brand;
    document.getElementById('url1').value=data.mainUrl;
    document.getElementById('url2').value=data.images[0]||'';
    extraUrlsContainer.innerHTML='';
    data.images.slice(1).forEach(url=>{
        urlCount++;
        const row = document.createElement('div');
        row.className='extra-url-row';
        row.innerHTML=`<input type="url" class="image-url" value="${url}" style="flex-grow:1"><button type="button" class="remove-btn">Remove</button>`;
        row.querySelector('.remove-btn').addEventListener('click',()=>row.remove());
        row.querySelector('.image-url').addEventListener('input', updatePreviews);
        extraUrlsContainer.appendChild(row);
    });
    keyValueContainer.innerHTML=''; fieldCount=0;
    if(data.extraFields) data.extraFields.forEach(field=>{
        fieldCount++;
        const row=document.createElement('div'); row.className='key-value-row';
        row.innerHTML=`<input type="text" value="${field.key}"><input type="text" value="${field.value}"><button type="button" class="remove-field">Remove</button>`;
        row.querySelector('.remove-field').addEventListener('click',()=>row.remove());
        keyValueContainer.appendChild(row);
    });
    updatePreviews(); window.scrollTo({top:0,behavior:'smooth'});
}

// =======================================
// SEARCH PRODUCTS
// =======================================
searchInput.addEventListener('input', ()=>{
    const q = searchInput.value.trim().toLowerCase().replace(/\s+/g,'');
    document.querySelectorAll('.product-card').forEach(card=>{
        const name = card.querySelector('h3')?.textContent.toLowerCase().replace(/\s+/g,'');
        card.style.display = name?.includes(q) ? 'flex' : 'none';
    });
});

// =======================================
// LOAD ORDERS
// =======================================
async function loadOrders() {
    ordersList.innerHTML = "";
    try {
        const inquiriesRef = collection(db, "Inquiries");
        const qSnap = await getDocs(query(inquiriesRef, orderBy("createdAt","desc")));

        const today=new Date(), yesterday=new Date(); yesterday.setDate(today.getDate()-1);
        const ordersByDate={};

        qSnap.forEach(docSnap=>{
            const data=docSnap.data();
            const createdAt=data.createdAt?new Date(data.createdAt.seconds*1000):null;
            if(!createdAt) return;
            let dateLabel = createdAt.toDateString()===today.toDateString()?'Today':(createdAt.toDateString()===yesterday.toDateString()?'Yesterday':createdAt.toLocaleDateString());
            if(!ordersByDate[dateLabel]) ordersByDate[dateLabel]=[];
            ordersByDate[dateLabel].push({id:docSnap.id,...data,createdAt});
        });

        const sortedKeys = Object.keys(ordersByDate).sort((a,b)=>{
            if(a==='Today') return -1;if(b==='Today') return 1;
            if(a==='Yesterday') return -1;if(b==='Yesterday') return 1;
            return new Date(ordersByDate[b][0].createdAt)-new Date(ordersByDate[a][0].createdAt);
        });

        function displayOrders(ordersByDate,sortedKeys,searchTerm=""){
            ordersList.innerHTML=""; const searching=searchTerm.trim().length>0; let anyResults=false;
            sortedKeys.forEach(dateLabel=>{
                const filtered=ordersByDate[dateLabel].filter(order=>{
                    const company=(order.company||'').toLowerCase();
                                        const name = (order.name||'').toLowerCase();
                    const email = (order.email||'').toLowerCase();
                    const phone = (order.phone||'').toLowerCase();
                    return company.includes(searchTerm) || name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
                });

                if(!searching){
                    const groupHeader=document.createElement("h3");
                    groupHeader.textContent=dateLabel;
                    groupHeader.style.marginTop="20px";
                    groupHeader.style.borderBottom="1px solid #ccc";
                    groupHeader.style.paddingBottom="5px";
                    ordersList.appendChild(groupHeader);
                }

                filtered.forEach(data=>{
                    anyResults=true;
                    const card=document.createElement("div");
                    card.className="inquiry-card";
                    card.style.border="1px solid #ccc";
                    card.style.padding="10px";
                    card.style.marginBottom="10px";
                    card.style.borderRadius="8px";
                    card.style.display="flex";
                    card.style.justifyContent="space-between";
                    card.style.alignItems="center";
                    card.style.position="relative";

                    card.innerHTML=`
                        <div>
                            <h4>${data.company||'Unknown Company'}</h4>
                            <p><strong>Name:</strong> ${data.name||''}</p>
                            <p><strong>Email:</strong> ${data.email||''}</p>
                            <p><strong>Phone:</strong> ${data.phone||''}</p>
                        </div>
                        <button class="view-btn" style="padding:5px 10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;">View</button>
                    `;

                    if(!data.seen){
                        const badge=document.createElement("span");
                        badge.textContent="New";
                        badge.style.position="absolute";
                        badge.style.top="10px";
                        badge.style.right="10px";
                        badge.style.background="#ff3b30";
                        badge.style.color="#fff";
                        badge.style.padding="2px 6px";
                        badge.style.borderRadius="12px";
                        badge.style.fontSize="12px";
                        badge.style.fontWeight="bold";
                        card.appendChild(badge);
                    }

                    card.querySelector(".view-btn").addEventListener("click", async ()=>{
                        modalCompany.textContent=data.company||'';
                        modalName.textContent=data.name||'';
                        modalEmail.textContent=data.email||'';
                        modalMobile.textContent=data.phone||'';
                        modalMessage.textContent=data.message||'';
                        modalProduct.textContent=data.product||'';
                        modalQuantity.textContent=data.quantity||'';
                        modalDate.textContent=data.createdAt
                            ? data.createdAt.toLocaleString(undefined,{
                                day:'2-digit', month:'short', year:'numeric',
                                hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true
                            })
                            : '';
                        modal.style.display="flex";

                        try{
                            await updateDoc(doc(db,"Inquiries",data.id),{seen:true});
                            const badge=card.querySelector("span");
                            if(badge) badge.remove();
                        }catch(err){console.error(err);}
                    });

                    ordersList.appendChild(card);
                });
            });

            if(searching && !anyResults){
                const noRes=document.createElement("p");
                noRes.textContent="No orders found.";
                noRes.style.textAlign="center";
                noRes.style.marginTop="20px";
                ordersList.appendChild(noRes);
            }
        }

        orderSearchInput.addEventListener("input", function(){
            displayOrders(ordersByDate,sortedKeys,this.value.toLowerCase());
        });

        displayOrders(ordersByDate,sortedKeys);

    }catch(err){console.error(err);}
}

closeModalBtn.addEventListener("click",()=>{modal.style.display="none";});
window.addEventListener("click",e=>{if(e.target==modal) modal.style.display="none";});




// ---------------- CONTACT MESSAGES ----------------

async function loadContacts() {
    contactList.innerHTML = "";

    try {
        // Reference to your collection
        const contactRef = collection(db, "ContactMessages");
        const qSnap = await getDocs(contactRef);

        const contacts = [];
        qSnap.forEach(docSnap => {
            contacts.push({ id: docSnap.id, ...docSnap.data() });
        });

        function displayContacts(searchTerm = "") {
            contactList.innerHTML = "";
            const filtered = contacts.filter(c => {
                const name = (c.name || "").toLowerCase();
                const email = (c.email || "").toLowerCase();
                const message = (c.message || "").toLowerCase();
                return (
                    name.includes(searchTerm) ||
                    email.includes(searchTerm) ||
                    message.includes(searchTerm)
                );
            });

            filtered.forEach(data => {
                const card = document.createElement("div");
                card.className = "contact-card";
                card.style.border = "1px solid #ccc";
                card.style.padding = "15px";
                card.style.marginBottom = "10px";
                card.style.borderRadius = "8px";
                card.style.position = "relative";
                card.style.background = "#fff";
                card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";

                card.innerHTML = `
                    <h4>${data.name || 'Unknown'}</h4>
                    <p><strong>Email:</strong> ${data.email || ''}</p>
                    <p>${data.message || ''}</p>
                `;

                // New badge for unseen messages (optional)
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

                contactList.appendChild(card);
            });

            if (filtered.length === 0) {
                const noRes = document.createElement("p");
                noRes.textContent = "No messages found.";
                noRes.style.textAlign = "center";
                noRes.style.marginTop = "20px";
                contactList.appendChild(noRes);
            }
        }

        // Initial display
        displayContacts();

        // Search functionality
        contactSearchInput.addEventListener("input", () => {
            displayContacts(contactSearchInput.value.toLowerCase());
        });

    } catch (err) {
        console.error("Error loading contacts:", err);
        contactList.innerHTML = "<p style='text-align:center;color:red;'>Failed to load messages.</p>";
    }
}

// Call it once
loadContacts();
// =======================================
// AUTH
// =======================================
const auth = getAuth();

// ----------------------------
// Show login modal only if user NOT logged in
// ----------------------------
function showLoginModal() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        loginModal.style.display = 'flex';
        loginOverlay.style.display = 'block';

        // Disable scrolling behind modal
        document.body.style.overflow = 'hidden';
    }
}
document.addEventListener('DOMContentLoaded', showLoginModal);

// ----------------------------
// LOGIN FORM SUBMISSION
// ----------------------------
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const loggedInEmail = userCredential.user.email;

        if (loggedInEmail === "jatinseta7@gmail.com") {  // Admin email
            // Mark as logged in
            localStorage.setItem('isLoggedIn', 'true');

            // Remove modal & overlay
            loginModal.remove();
            loginOverlay.remove();

            // Enable scrolling
            document.body.style.overflow = '';

            // Show sidebar/admin panel
            sidebar.classList.remove('active');
            mobileToggleBtn.style.display = "block";

            // Load admin data
            loadProducts();
            loadOrders();
        } else {
            errorMessage.textContent = "You are not authorized to access this panel.";
        }

    } catch (error) {
        let message = "";
        switch (error.code) {
            case "auth/user-not-found": message = "Email mismatch: user not found."; break;
            case "auth/wrong-password": message = "Password mismatch: incorrect password."; break;
            case "auth/invalid-email": message = "Invalid email format."; break;
            case "auth/user-disabled": message = "User account is disabled."; break;
            default: message = "Login failed. Please try again.";
        }
        errorMessage.textContent = message;
    }
});

// ----------------------------
// PASSWORD TOGGLE
// ----------------------------
togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
});

// ----------------------------
// LOGOUT
// ----------------------------
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.reload();
}
const logoutBtn = document.querySelector('.menu-item.signout');
if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); logout(); });

// ===========================
// INITIALIZE (only if logged in)
// ===========================
if (localStorage.getItem('isLoggedIn') === 'true') {
    loadProducts();
    loadOrders();
}
