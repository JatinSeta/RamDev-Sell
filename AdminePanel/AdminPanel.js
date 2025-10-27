import { app, db } from "../firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

let currentLoadedImages = [];
let previewIndex = 0;
let urlCount = 2;
const MAX_CHARS = 500; // Maximum characters allowed

// ----------------- IMAGE PREVIEW FUNCTIONS -----------------
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

function getCurrentImages() {
  if(currentLoadedImages.length>0) return currentLoadedImages.slice();
  const inputs = document.querySelectorAll('.image-url');
  return Array.from(inputs).map(i=>i.value.trim()).filter(v=>v!=='');
}

function showPreviewAt(index) {
  const imgs = getCurrentImages();
  if(!imgs.length){mainPreview.src='';thumbnailsContainer.innerHTML='';previewContainer.style.display='none';return;}
  previewContainer.style.display='block';
  mainPreview.src = imgs[index];
  Array.from(thumbnailsContainer.children).forEach((thumb,i)=>{
    thumb.style.outline = (i===index)?'2px solid #007bff':'none';
  });
}

function updatePreviews(){
  const inputs = Array.from(document.querySelectorAll('.image-url')).map(i=>i.value.trim()).filter(v=>v!=='');

  thumbnailsContainer.innerHTML='';
  if(!inputs.length){currentLoadedImages=[];previewIndex=0;mainPreview.src='';previewContainer.style.display='none'; return;}
  const checks = inputs.map(u=>testImageLoad(u));
  Promise.all(checks).then(results=>{
    currentLoadedImages = results.filter(r=>r.ok).map(r=>r.url);
    if(!currentLoadedImages.length){previewIndex=0;mainPreview.src='';previewContainer.style.display='none'; return;}
    previewContainer.style.display='block';
    currentLoadedImages.forEach((u,i)=>{
      const t = document.createElement('img');
      t.src=u;t.style.width='48px';t.style.height='48px';t.style.objectFit='cover';t.style.cursor='pointer';
      t.addEventListener('click',()=>{previewIndex=i;showPreviewAt(i);});
      thumbnailsContainer.appendChild(t);
    });
    previewIndex = Math.min(previewIndex,currentLoadedImages.length-1);
    showPreviewAt(previewIndex);
  });
}

document.getElementById('url1').addEventListener('input',updatePreviews);
document.getElementById('url2').addEventListener('input',updatePreviews);

addUrlBtn.addEventListener('click',()=>{
  urlCount+=1;
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex"; wrapper.style.alignItems = "center"; wrapper.style.marginTop="8px";
  const input = document.createElement("input");
  input.type="url"; input.id=`url${urlCount}`; input.placeholder=`Image URL ${urlCount}`; input.className="image-url"; input.style.flexGrow="1";
  const removeBtn = document.createElement("button");
  removeBtn.type="button"; removeBtn.className="remove-btn";
  const removeIcon = document.createElement("img");
  removeIcon.src="https://cdn-icons-png.flaticon.com/512/6861/6861362.png"; removeIcon.alt="Remove";
  removeBtn.appendChild(removeIcon);
  removeBtn.addEventListener("click",()=>{wrapper.remove(); updatePreviews();});
  wrapper.appendChild(input); wrapper.appendChild(removeBtn);
  extraUrlsContainer.appendChild(wrapper);
  input.addEventListener('input',updatePreviews);
  updatePreviews();
});

prevBtn.addEventListener('click',()=>{const imgs=getCurrentImages();if(!imgs.length) return; previewIndex=(previewIndex-1+imgs.length)%imgs.length; showPreviewAt(previewIndex);});
nextBtn.addEventListener('click',()=>{const imgs=getCurrentImages();if(!imgs.length) return; previewIndex=(previewIndex+1)%imgs.length; showPreviewAt(previewIndex);});

// ----------------- CHARACTER COUNT FUNCTION -----------------
function updateCharCount() {
  let text = detailsTextarea.value;
  if(text.length > MAX_CHARS) {
    detailsTextarea.value = text.substring(0, MAX_CHARS);
    text = detailsTextarea.value;
  }
  wordCountDisplay.textContent = `${text.length} / ${MAX_CHARS} characters`;
}

detailsTextarea.addEventListener('input', updateCharCount);

// ----------------- FORM SUBMISSION -----------------
form.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const details = detailsTextarea.value.trim(); 
  const imagesAll = getCurrentImages();

  if (imagesAll.length < 2) {
    showToast("Please provide at least 2 image URLs", 'error');
    return;
  }

  const mainImage = imagesAll[0];
  const otherImages = imagesAll.slice(1);

  try {
    await addDoc(collection(db, "Products"), {
      name,
      details,
      images: otherImages,
      mainUrl: mainImage,
      createdAt: serverTimestamp()
    });
    showToast("Data added successfully!");
    
    extraUrlsContainer.innerHTML = '';
    urlCount = 2;
    form.reset();
    thumbnailsContainer.innerHTML = '';
    mainPreview.src = '';
    previewIndex = 0;
    previewContainer.style.display = 'none';
    updateCharCount();
    
    loadProducts();
  } catch (err) {
    console.error(err);
    showToast("Error adding data!", 'error');
  }
});

// ----------------- LOAD PRODUCTS -----------------
async function loadProducts(){
  productsList.innerHTML='Loading...';
  try{
    const q = query(collection(db,'Products'),orderBy('createdAt','desc'),limit(50));
    const snap = await getDocs(q);
    if(snap.empty){productsList.innerHTML='<div>No products yet.</div>'; return;}
    productsList.innerHTML='';

    snap.forEach(docSnap=>{
      const data = docSnap.data();
      const card = document.createElement('div'); card.className='product-card';

      const img = document.createElement('img'); 
      img.src=data.mainUrl||''; 
      img.alt=data.name||'product';

      const title = document.createElement('div'); 
      title.className='card-title'; 
      title.textContent=data.name||'(no name)';

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async e=>{
        e.stopPropagation(); 
        if(confirm('Are you sure you want to delete this product?')){
          await deleteDoc(doc(db,'Products',docSnap.id));
          showToast('Product deleted!');
          loadProducts();
        }
      });

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(delBtn);

      card.addEventListener('click',()=>{window.location.href=`productDetails.html?id=${docSnap.id}`;});

      productsList.appendChild(card);
    });
  }catch(err){console.error(err); productsList.innerHTML='<div>Error loading products</div>';}
}

updatePreviews();
updateCharCount();
loadProducts();
