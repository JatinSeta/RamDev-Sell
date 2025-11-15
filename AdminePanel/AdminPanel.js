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

let fieldCount = 0;
let currentLoadedImages = [];
let previewIndex = 0;
let urlCount = 2;
const MAX_CHARS = 500;
let editMode = false;
let editingProductId = null;
let selectingBestSellers = false;

// ---------------- Sidebar toggle ----------------
const menuItems = document.querySelectorAll('.menu-item[data-section]');
const sections = document.querySelectorAll('.admin-section');

// ---------------- Sidebar toggle ----------------
mobileToggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// ---------------- Overlay click to close ----------------
const overlay = document.getElementById('overlay');
overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// ---------------- Section switcher ----------------
function showSection(sectionId) {
    sections.forEach(sec => {
        sec.style.display = sec.id === sectionId ? 'block' : 'none';
    });
    menuItems.forEach(item => {
        if(item.getAttribute('data-section') === sectionId){
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    // Close sidebar on mobile after clicking
    if(window.innerWidth <= 768) sidebar.classList.remove('active');
}

// Attach click events
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.getAttribute('data-section');
        showSection(sectionId);
    });
});

// ---------------- Default Section ----------------
document.addEventListener('DOMContentLoaded', () => {
    showSection('addProductSection'); // Default open
});


// ---------------- Section switcher ----------------
document.querySelectorAll('.menu-item[data-section]').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        const sectionId = item.getAttribute('data-section');

        // Show selected section, hide others
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.style.display = sec.id === sectionId ? 'block' : 'none';
        });

        // Close sidebar on mobile after selecting
        if(window.innerWidth <= 768){
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
});

// ---------------- Section switcher ----------------
document.querySelectorAll('.menu-item[data-section]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.getAttribute('data-section');
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.style.display = sec.id === sectionId ? 'block' : 'none';
        });
        if (sidebar.classList.contains('active')) sidebar.classList.remove('active');
    });
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

document.querySelectorAll('.image-url').forEach(input=>{
    input.addEventListener('input', updatePreviews);
});

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
    const list=[];
    rows.forEach(r=>{
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
    toast.innerHTML=`<button class="close-btn">&times;</button><div class="toast-text">${text}</div>`;
    document.body.appendChild(toast);
    toast.querySelector('.close-btn').addEventListener('click',()=>toast.remove());
    setTimeout(()=>toast.remove(),3000);
}

// ---------------- Form Submit ----------------
form.addEventListener('submit', async e=>{
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const details = detailsTextarea.value.trim();
    const category = categorySelect.value.trim();
    const images = getCurrentImages();
    const extraFields = getKeyValuePairs();
    if(!category) return showToast('Select a category','error');
    if(images.length<2) return showToast('At least 2 images required','error');
    const mainImage = images[0];
    const otherImages = images.slice(1);

    try{
        if(editMode && editingProductId){
            const docRef = doc(db,'Products',editingProductId);
            await updateDoc(docRef,{
                name,details,category,mainUrl:mainImage,images:otherImages,extraFields,updatedAt:serverTimestamp()
            });
            showToast('Product updated!');
        } else {
            await addDoc(collection(db,'Products'),{
                name,details,category,mainUrl:mainImage,images:otherImages,extraFields,bestSeller:false,createdAt:serverTimestamp()
            });
            showToast('Product added!');
        }
        resetForm();
        loadProducts();
    } catch(err){
        console.error(err);
        showToast('Error saving product','error');
    }
});

// ---------------- Reset Form ----------------
function resetForm(){
    form.reset();
    extraUrlsContainer.innerHTML='';
    keyValueContainer.innerHTML='';
    currentLoadedImages=[];
    previewContainer.style.display='none';
    thumbnailsContainer.innerHTML='';
    editMode=false; editingProductId=null; fieldCount=0;
    detailsTextarea.dispatchEvent(new Event('input'));
}

// ---------------- Select Best Sellers ----------------
selectBSBtn.addEventListener('click', ()=>{
    selectingBestSellers = !selectingBestSellers;
    selectBSBtn.textContent = selectingBestSellers ? ' Select Product Best Sellers' : 'Select Best Sellers';
    selectBSBtn.style.backgroundColor = selectingBestSellers ? '#007bff' : '';
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

        // Edit
        card.querySelector('.edit-btn').addEventListener('click', ()=>{ fillEditForm(productId,data); });

        // Delete product
        card.querySelector('.delete-btn').addEventListener('click', async ()=>{
            if(confirm('Delete this product?')){
                await deleteDoc(doc(db,'Products',productId));
                loadProducts();
            }
        });

        // Toggle BestSeller in selection mode
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

            bsCard.querySelector('.edit-btn').addEventListener('click', ()=>{ fillEditForm(productId,data); });

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
function fillEditForm(id,data){
    editMode=true; editingProductId=id;
    document.getElementById('name').value=data.name;
    detailsTextarea.value=data.details;
    detailsTextarea.dispatchEvent(new Event('input'));
    categorySelect.value=data.category;
    document.getElementById('url1').value=data.mainUrl;
    document.getElementById('url2').value=data.images[0]||'';
    extraUrlsContainer.innerHTML='';
    data.images.slice(1).forEach(url=>{
        urlCount++;
        const row=document.createElement('div');
        row.className='extra-url-row';
        row.innerHTML=`<input type="url" class="image-url" value="${url}" style="flex-grow:1"><button type="button" class="remove-btn">Remove</button>`;
        row.querySelector('.remove-btn').addEventListener('click',()=>row.remove());
        row.querySelector('.image-url').addEventListener('input',updatePreviews);
        extraUrlsContainer.appendChild(row);
    });
    keyValueContainer.innerHTML=''; fieldCount=0;
    if(data.extraFields) data.extraFields.forEach(field=>{
        fieldCount++;
        const row=document.createElement('div');
        row.className='key-value-row';
        row.innerHTML=`<input type="text" value="${field.key}"><input type="text" value="${field.value}"><button type="button" class="remove-field">Remove</button>`;
        row.querySelector('.remove-field').addEventListener('click',()=>row.remove());
        keyValueContainer.appendChild(row);
    });
    updatePreviews();
    window.scrollTo({top:0,behavior:'smooth'});
}

// ---------------- Search ----------------
searchInput.addEventListener('input', ()=>{
    const q = searchInput.value.trim().toLowerCase().replace(/\s+/g,'');
    document.querySelectorAll('.product-card').forEach(card=>{
        const name = card.querySelector('h3')?.textContent.toLowerCase().replace(/\s+/g,'');
        card.style.display = name?.includes(q) ? 'flex' : 'none';
    });
});

// ---------------- Initial load ----------------
loadProducts();

// ---------------- Orders Section ----------------
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

// ---------------- Load Orders ----------------
async function loadOrders() {
    ordersList.innerHTML = "";

    try {
        const inquiriesRef = collection(db, "Inquiries");
        const qSnap = await getDocs(query(inquiriesRef, orderBy("createdAt", "desc")));

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const ordersByDate = {}; // { "Today": [], "Yesterday": [], "15 Nov 2025": [] }

        qSnap.forEach(docSnap => {
            const data = docSnap.data();
            const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000) : null;
            if (!createdAt) return;

            let dateLabel = createdAt.toLocaleDateString(); // default

            if (createdAt.toDateString() === today.toDateString()) dateLabel = "Today";
            else if (createdAt.toDateString() === yesterday.toDateString()) dateLabel = "Yesterday";
            else dateLabel = createdAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

            if (!ordersByDate[dateLabel]) ordersByDate[dateLabel] = [];
            ordersByDate[dateLabel].push({ ...data, createdAt });
        });

        // Sort keys so Today -> Yesterday -> Older Dates Descending
        const sortedKeys = Object.keys(ordersByDate).sort((a, b) => {
            if (a === "Today") return -1;
            if (b === "Today") return 1;
            if (a === "Yesterday") return -1;
            if (b === "Yesterday") return 1;

            // For older dates: sort descending
            const dateA = new Date(ordersByDate[a][0].createdAt);
            const dateB = new Date(ordersByDate[b][0].createdAt);
            return dateB - dateA;
        });

        // Render orders grouped by sorted dates
        sortedKeys.forEach(dateLabel => {
            const groupHeader = document.createElement("h3");
            groupHeader.textContent = dateLabel;
            groupHeader.style.marginTop = "20px";
            groupHeader.style.borderBottom = "1px solid #ccc";
            groupHeader.style.paddingBottom = "5px";
            ordersList.appendChild(groupHeader);

            ordersByDate[dateLabel].forEach(data => {
                const card = document.createElement("div");
                card.className = "inquiry-card";
                card.style.border = "1px solid #ccc";
                card.style.padding = "10px";
                card.style.marginBottom = "10px";
                card.style.borderRadius = "8px";
                card.style.display = "flex";
                card.style.justifyContent = "space-between";
                card.style.alignItems = "center";

                card.innerHTML = `
                    <div>
                        <h4>${data.company || 'Unknown Company'}</h4>
                        <p><strong>Name:</strong> ${data.name || ''}</p>
                        <p><strong>Email:</strong> ${data.email || ''}</p>
                        <p><strong>Mobile:</strong> ${data.mobile || ''}</p>
                    </div>
                    <button class="view-btn" style="padding:5px 10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;">View</button>
                `;

            card.querySelector(".view-btn").addEventListener("click", () => {
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
});


                ordersList.appendChild(card);
            });
        });

    } catch (err) {
        console.error("Error loading orders:", err);
        showToast("Error loading orders", "error");
    }
}


// ---------------- Modal Close ----------------
closeModalBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});

// ---------------- Search Orders ----------------
orderSearchInput.addEventListener("input", () => {
    const q = orderSearchInput.value.trim().toLowerCase().replace(/\s+/g, '');
    document.querySelectorAll(".inquiry-card").forEach(card => {
        const company = (card.querySelector("h3")?.textContent.toLowerCase() || '').replace(/\s+/g, '');
        const name = (card.querySelector("p:nth-of-type(1)")?.textContent.toLowerCase() || '').replace(/\s+/g, '');
        const email = (card.querySelector("p:nth-of-type(2)")?.textContent.toLowerCase() || '').replace(/\s+/g, '');
        const mobile = (card.querySelector("p:nth-of-type(3)")?.textContent.toLowerCase() || '').replace(/\s+/g, '');
        const match = company.includes(q) || name.includes(q) || email.includes(q) || mobile.includes(q);
        card.style.display = match ? "flex" : "none";
    });
});

// ---------------- Initial Load ----------------
loadOrders();
