import { app, db } from "../firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const form = document.getElementById("dataForm");
const addUrlBtn = document.getElementById("addUrlBtn");
const extraUrlsContainer = document.getElementById("extraUrls");
const mainPreview = document.getElementById('mainPreview');
const thumbnailsContainer = document.getElementById('thumbnails');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const previewContainer = document.getElementById('previewContainer');
const productsList = document.getElementById('productsList');
const detailsTextarea = document.getElementById('details');
const wordCountDisplay = document.getElementById('wordCount');
const categorySelect = document.getElementById('category');
const bestSellersBtn = document.querySelector('.best-sellers-section button');
const bestSellersList = document.getElementById('bestSellersList');

let currentLoadedImages = [];
let previewIndex = 0;
let urlCount = 2;
const MAX_CHARS = 500;
let editMode = false;
let editingProductId = null;
let bestSellerMode = false;

// ---------- IMAGE PREVIEW ----------
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
        thumb.style.outline = (i===index)?'2px solid #007bff':'none';
    });
}

function updatePreviews(){
    const urls = getCurrentImages();
    if(!urls.length){ previewContainer.style.display='none'; return; }

    Promise.all(urls.map(u=>testImageLoad(u))).then(results=>{
        currentLoadedImages = results.filter(r=>r.ok).map(r=>r.url);
        if(!currentLoadedImages.length){ previewContainer.style.display='none'; return; }

        previewContainer.style.display='block';
        thumbnailsContainer.innerHTML='';
        currentLoadedImages.forEach((url,i)=>{
            const t = document.createElement('img');
            t.src = url; t.style.width='48px'; t.style.height='48px'; t.style.objectFit='cover'; t.style.cursor='pointer';
            t.addEventListener('click',()=>{ previewIndex=i; showPreviewAt(i); });
            thumbnailsContainer.appendChild(t);
        });

        previewIndex = Math.min(previewIndex, currentLoadedImages.length-1);
        showPreviewAt(previewIndex);
    });
}

// ---------- CHARACTER COUNT ----------
function updateCharCount() {
    let text = detailsTextarea.value;
    if(text.length > MAX_CHARS) text = text.substring(0, MAX_CHARS);
    detailsTextarea.value = text;
    wordCountDisplay.textContent = `${text.length} / ${MAX_CHARS} characters`;
}
detailsTextarea.addEventListener('input', updateCharCount);

// ---------- LIVE IMAGE PREVIEW ----------
function attachLivePreview(input){
    input.addEventListener('input', updatePreviews);
}
document.querySelectorAll('.image-url').forEach(attachLivePreview);

// ---------- DYNAMIC IMAGE INPUT ----------
addUrlBtn.addEventListener('click',()=>{
    urlCount+=1;
    const wrapper = document.createElement("div");
    wrapper.style.display="flex"; wrapper.style.alignItems="center"; wrapper.style.marginTop="8px";

    const input = document.createElement("input");
    input.type="url"; input.placeholder=`Image URL ${urlCount}`; input.className="image-url"; input.style.flexGrow="1";
    attachLivePreview(input);

    const removeBtn = document.createElement("button");
    removeBtn.type="button"; removeBtn.className="remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click",()=>{wrapper.remove(); updatePreviews();});

    wrapper.appendChild(input); wrapper.appendChild(removeBtn);
    extraUrlsContainer.appendChild(wrapper);
});

// ---------- PREVIEW NAVIGATION ----------
prevBtn.addEventListener('click',()=>{ 
    if(!currentLoadedImages.length) return; 
    previewIndex=(previewIndex-1+currentLoadedImages.length)%currentLoadedImages.length; 
    showPreviewAt(previewIndex); 
});
nextBtn.addEventListener('click',()=>{ 
    if(!currentLoadedImages.length) return; 
    previewIndex=(previewIndex+1)%currentLoadedImages.length; 
    showPreviewAt(previewIndex); 
});

// ---------- TOAST ----------
function showToast(text,type='success',duration=3000){
    const existing = document.querySelector('.toast');
    if(existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<button class="close-btn" aria-label="close">&times;</button><div class="toast-text">${text}</div>`;
    document.body.appendChild(toast);
    toast.querySelector('.close-btn').addEventListener('click',()=>{toast.remove();});
    requestAnimationFrame(()=>toast.classList.add('show'));
    setTimeout(()=>toast.remove(),duration);
}

// ---------- FORM SUBMISSION ----------
form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const details = detailsTextarea.value.trim();
    const category = categorySelect.value.trim();
    const imagesAll = getCurrentImages();

    if(!category){ showToast("Please select a category",'error'); return; }
    if(imagesAll.length < 2){ showToast("Please provide at least 2 image URLs",'error'); return; }

    const mainImage = imagesAll[0];
    const otherImages = imagesAll.slice(1);

    try{
        if(editMode && editingProductId){
            await updateDoc(doc(db,"Products",editingProductId), {
                name, details, category, mainUrl:mainImage, images:otherImages, updatedAt: serverTimestamp()
            });
            showToast("Product updated successfully!");
        } else {
            await addDoc(collection(db,"Products"), {
                name, details, category, mainUrl:mainImage, images:otherImages, createdAt: serverTimestamp(), bestSeller:false
            });
            showToast("Product added successfully!");
        }
        resetForm();
        loadProducts();
    } catch(err){ console.error(err); showToast("Error saving data!",'error'); }
});

function resetForm(){
    extraUrlsContainer.innerHTML = '';
    urlCount = 2;
    form.reset();
    thumbnailsContainer.innerHTML = '';
    mainPreview.src = '';
    previewIndex = 0;
    previewContainer.style.display='none';
    updateCharCount();
    editMode=false;
    editingProductId=null;
}

// ---------- BEST SELLER MODE ----------
bestSellersBtn.addEventListener('click', () => {
    bestSellerMode = !bestSellerMode;
    bestSellersBtn.textContent = bestSellerMode ? "Click a Product to Toggle Best Seller" : "Best Sellers";

    document.querySelectorAll('.product-card').forEach(card => {
        card.style.cursor = bestSellerMode ? 'pointer' : 'default';
        card.style.border = bestSellerMode ? '2px dashed #ffa500' : '1px solid #ccc';
    });
});

async function toggleBestSeller(productId, currentStatus) {
    try {
        await updateDoc(doc(db, "Products", productId), { bestSeller: !currentStatus });
        showToast(`Product ${!currentStatus ? "added to" : "removed from"} Best Sellers!`);
        loadProducts();
    } catch (err) {
        console.error(err);
        showToast("Error updating Best Seller!", 'error');
    }
}

// ---------- LOAD PRODUCTS ----------
async function loadProducts(){
    productsList.innerHTML=''; // clear first
    const q = query(collection(db,"Products"), orderBy("createdAt","desc"));
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap=>{
        const data = docSnap.data();
        const div = document.createElement('div'); 
        div.className='product-card';
        div.innerHTML = `
            <img src="${data.mainUrl}" alt="${data.name}" />
            <h3>${data.name}</h3>
            <div class="product-actions">
                <button class="edit-btn"> Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        div.style.boxShadow = data.bestSeller ? "0 0 10px 3px gold" : "none";

        // Edit
        div.querySelector('.edit-btn').addEventListener('click', async () => {
            editMode = true;
            editingProductId = docSnap.id;

            document.getElementById('name').value = data.name;
            detailsTextarea.value = data.details; 
            updateCharCount();
            categorySelect.value = data.category;

            // Main images
            document.getElementById('url1').value = data.mainUrl;
            document.getElementById('url2').value = (data.images[0] || '');
            extraUrlsContainer.innerHTML = '';
            data.images.slice(1).forEach((url)=>{
                urlCount += 1;
                const wrapper = document.createElement("div");
                wrapper.style.display = "flex"; 
                wrapper.style.alignItems = "center"; 
                wrapper.style.marginTop = "8px";

                const input = document.createElement("input");
                input.type = "url"; 
                input.className = "image-url"; 
                input.value = url; 
                input.style.flexGrow = "1";
                attachLivePreview(input);

                const removeBtn = document.createElement("button");
                removeBtn.type = "button"; 
                removeBtn.className = "remove-btn";
                removeBtn.textContent = "Remove";
                removeBtn.addEventListener("click",()=>{ wrapper.remove(); updatePreviews(); });

                wrapper.appendChild(input); 
                wrapper.appendChild(removeBtn);
                extraUrlsContainer.appendChild(wrapper);
            });
            updatePreviews();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Delete
        div.querySelector('.delete-btn').addEventListener('click', async () => {
            if(confirm("Are you sure you want to delete this product?")){
                await deleteDoc(doc(db,"Products",docSnap.id));
                showToast("Product deleted successfully!");
                loadProducts();
            }
        });

        // Best Seller Click
        div.addEventListener('click', () => {
            if(bestSellerMode){
                toggleBestSeller(docSnap.id, data.bestSeller || false);
            }
        });

        productsList.appendChild(div);
    });
    loadBestSellers();
}

// ---------- LOAD BEST SELLERS ----------
async function loadBestSellers() {
    bestSellersList.innerHTML = ''; // clear the list

    const q = query(collection(db,"Products"), orderBy("createdAt","desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if(data.bestSeller){
            const div = document.createElement('div');
            div.className = 'product-card';

            // Image
            const img = document.createElement('img');
            img.src = data.mainUrl;
            img.alt = data.name;
            div.appendChild(img);

            // Title
            const title = document.createElement('div');
            title.className = 'card-title';
            title.textContent = data.name;
            div.appendChild(title);

            // Delete Button (remove from Best Sellers)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Remove';
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // prevent card click if you have one
                try {
                    await updateDoc(doc(db, "Products", docSnap.id), { bestSeller: false });
                    showToast(`${data.name} removed from Best Sellers!`);
                    loadProducts(); // refresh All Products
                } catch (err) {
                    console.error(err);
                    showToast("Error removing Best Seller!", 'error');
                }
            });
            div.appendChild(deleteBtn);

            // Optional: Edit Button
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                openEditForm(docSnap.id); // your existing edit logic
            });
            div.appendChild(editBtn);

            bestSellersList.appendChild(div);
        }
    });
}


// ---------- INITIAL LOAD ----------
loadProducts();
updateCharCount();
updatePreviews();
