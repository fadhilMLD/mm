// MetroMobiles Admin Security & Portal
(function(){
  'use strict';

  // Elements
  const overlay = () => document.getElementById('admin-login-overlay');
  const adminContent = () => document.getElementById('admin-content');
  const logoutBtn = () => document.getElementById('logout-btn');

  // Keys
  const AUTH_KEY = 'metromobiles_admin_pwd_hash_v1';
  const SESSION_KEY = 'metromobiles_admin_session_v1';
  const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
  const SALT = 'metromobiles_salt_2026';

  // Crypto helpers
  async function sha256(text){
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // Password storage: first run sets default password 'admin123'
  async function ensureDefaultPassword(){
    if(!localStorage.getItem(AUTH_KEY)){
      const defaultHash = await sha256('admin123' + SALT);
      localStorage.setItem(AUTH_KEY, defaultHash);
    }
  }

  async function verifyPassword(pwd){
    const stored = localStorage.getItem(AUTH_KEY);
    if(!stored) return false;
    const test = await sha256(pwd + SALT);
    return stored === test;
  }

  function createSession(){
    const session = { ts: Date.now(), token: crypto.getRandomValues(new Uint32Array(4)).join('-') };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function validSession(){
    try{
      const raw = sessionStorage.getItem(SESSION_KEY);
      if(!raw) return false;
      const s = JSON.parse(raw);
      if((Date.now() - s.ts) > SESSION_TTL_MS){
        sessionStorage.removeItem(SESSION_KEY);
        return false;
      }
      // touch session
      s.ts = Date.now();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      return true;
    }catch(e){ return false; }
  }

  function clearSession(){ sessionStorage.removeItem(SESSION_KEY); }

  function showLogin(){ if(overlay()) overlay().style.display = 'flex'; if(adminContent()) adminContent().style.display = 'none'; if(logoutBtn()) logoutBtn().style.display = 'none'; }
  function showAdmin(){ if(overlay()) overlay().style.display = 'none'; if(adminContent()) adminContent().style.display = 'block'; if(logoutBtn()) logoutBtn().style.display = 'inline-flex'; }

  // Basic anti-tamper deterrents (client-side only; not foolproof)
  function attachDeterrents(){
    // Disable context menu and some devtool keys (deterrent only)
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if((e.ctrlKey && e.shiftKey && ['i','j','c'].includes(k)) || (e.ctrlKey && k === 'u') || k === 'f12'){
        e.preventDefault();
      }
    });
  }

  // Product CRUD wiring
  let products = [];
  let editingId = null;
  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : `${window.location.origin}/api`;

  async function getProducts(){
    try {
      const response = await fetch(`${API_URL}/products`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Using localStorage fallback');
    }
    const raw = localStorage.getItem('metromobiles_products');
    if(!raw) return [];
    try{ return JSON.parse(raw); } catch { return []; }
  }

  function saveProducts(list){
    if(!validSession()){ alert('Session expired. Please login again.'); showLogin(); return; }
    localStorage.setItem('metromobiles_products', JSON.stringify(list));
  }

  function renderList(){
    const listEl = document.getElementById('admin-products-list');
    const emptyEl = document.getElementById('no-admin-products');
    if(!listEl) return;
    if(products.length === 0){ listEl.style.display = 'none'; emptyEl.style.display = 'block'; return; }
    listEl.style.display = 'grid'; emptyEl.style.display = 'none';
    listEl.innerHTML = products.map(p => `
      <div class="admin-product-card">
        <div class="admin-product-image"><img src="${p.image}" alt="${p.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22150%22 height=%22150%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'>"></div>
        <div class="admin-product-info">
          <h4>${p.name}</h4>
          <p class="admin-product-brand"><i class="fas fa-tag"></i> ${p.brand}</p>
          <p class="admin-product-price"><i class="fas fa-rupee-sign"></i> ₹${Number(p.price).toFixed(2)}</p>
          <p class="admin-product-stock"><i class="fas fa-boxes"></i> Stock: ${p.stock} ${p.stock < 10 ? '<span class="low-stock">(Low)</span>' : ''}</p>
        </div>
        <div class="admin-product-actions">
          <button class="btn btn-edit" data-action="edit" data-id="${p.id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-delete" data-action="delete" data-id="${p.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>`).join('');
  }

  function updateStats(){ const el = document.getElementById('total-products'); if(el) el.textContent = String(products.length); }

  function resetForm(){
    editingId = null;
    const f = document.getElementById('product-form'); if(f) f.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('form-title').textContent = 'Add New Product';
    document.getElementById('submit-text').textContent = 'Add Product';
    document.getElementById('cancel-btn').style.display = 'none';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('product-image').setAttribute('required', '');
  }

  function showToast(msg){
    const n = document.createElement('div'); n.className = 'notification'; n.innerHTML = `<i class="fas fa-check-circle"></i><span>${msg}</span>`; document.body.appendChild(n);
    setTimeout(()=>n.classList.add('show'),100); setTimeout(()=>{n.classList.remove('show'); setTimeout(()=>n.remove(),300);},3000);
  }

  // Event wiring
  document.addEventListener('DOMContentLoaded', async ()=>{
    await ensureDefaultPassword();
    attachDeterrents();

    // Login handling
    const loginForm = document.getElementById('admin-login-form');
    if(loginForm){
      loginForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const pwd = document.getElementById('admin-password').value;
        const err = document.getElementById('login-error');
        const ok = await verifyPassword(pwd);
        if(ok){
          createSession();
          err && err.classList.remove('show');
          showAdmin();
          // load data
          products = await getProducts();
          renderList(); updateStats(); wireCrudListeners(); wireForm();
        } else {
          if(err){ err.classList.add('show'); }
          document.getElementById('admin-password').value = '';
          document.getElementById('admin-password').focus();
        }
      });
    }

    // Logout
    if(logoutBtn()){
      logoutBtn().addEventListener('click', ()=>{ clearSession(); showLogin(); });
    }

    // Restore if session active
    if(validSession()){
      showAdmin();
      products = await getProducts();
      renderList(); updateStats(); wireCrudListeners(); wireForm();
    } else {
      showLogin();
    }
  });

  function wireCrudListeners(){
    const listEl = document.getElementById('admin-products-list');
    if(!listEl || listEl.dataset.wired) return; listEl.dataset.wired = '1';
    listEl.addEventListener('click', (e)=>{
      const t = e.target.closest('[data-action]'); if(!t) return;
      const id = Number(t.dataset.id);
      if(t.dataset.action === 'edit'){
        const p = products.find(x=>x.id===id); if(!p) return;
        editingId = id;
        document.getElementById('product-id').value = p.id;
        document.getElementById('product-name').value = p.name;
        document.getElementById('product-brand').value = p.brand;
        document.getElementById('product-price').value = p.price;
        document.getElementById('product-description').value = p.description;
        document.getElementById('product-short-description').value = p.shortDescription || '';
        document.getElementById('product-stock').value = p.stock;
        
        // Populate specifications
        const specsContainer = document.getElementById('specs-container');
        specsContainer.innerHTML = '';
        if(p.specifications && typeof p.specifications === 'object'){
          Object.entries(p.specifications).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'spec-row';
            row.innerHTML = `
              <input type="text" value="${key}" class="spec-key">
              <input type="text" value="${value}" class="spec-value">
              <button type="button" class="btn-remove-spec" onclick="removeSpecRow(this)">×</button>
            `;
            specsContainer.appendChild(row);
          });
        } else {
          addSpecRow();
        }
        
        // Populate features
        const featuresContainer = document.getElementById('features-container');
        featuresContainer.innerHTML = '';
        if(p.features && Array.isArray(p.features)){
          p.features.forEach(feature => {
            const row = document.createElement('div');
            row.className = 'feature-row';
            row.innerHTML = `
              <input type="text" value="${feature}" class="feature-input">
              <button type="button" class="btn-remove-feature" onclick="removeFeatureRow(this)">×</button>
            `;
            featuresContainer.appendChild(row);
          });
        } else {
          addFeatureRow();
        }
        
        // Show existing images preview
        if(p.images && p.images.length > 0){
          const previewDiv = document.getElementById('image-preview');
          const previewContainer = document.getElementById('preview-container');
          previewDiv.style.display = 'block';
          previewContainer.innerHTML = p.images.map(img => 
            `<img src="${img}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb;" alt="Product">`
          ).join('');
          document.getElementById('product-image').removeAttribute('required');
        } else if(p.image){
          // Fallback for old single-image products
          const previewDiv = document.getElementById('image-preview');
          const previewContainer = document.getElementById('preview-container');
          previewDiv.style.display = 'block';
          previewContainer.innerHTML = `<img src="${p.image}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb;" alt="Product">`;
          document.getElementById('product-image').removeAttribute('required');
        }
        
        document.getElementById('form-title').textContent = 'Edit Product';
        document.getElementById('submit-text').textContent = 'Update Product';
        document.getElementById('cancel-btn').style.display = 'inline-block';
        document.getElementById('product-form').scrollIntoView({behavior:'smooth'});
      }
      if(t.dataset.action === 'delete'){
        const p = products.find(x=>x.id===id); if(!p) return;
        if(confirm(`Delete "${p.name}"?`)){
          // Delete via API
          fetch(`${API_URL}/products/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(async () => {
              products = await getProducts();
              renderList();
              updateStats();
              showToast('Product deleted successfully!');
            })
            .catch(err => {
              console.error(err);
              alert('Failed to delete product');
            });
        }
      }
    });
  }

  function wireForm(){
    const form = document.getElementById('product-form');
    const cancel = document.getElementById('cancel-btn');
    const imageInput = document.getElementById('product-image');
    const previewDiv = document.getElementById('image-preview');
    const previewContainer = document.getElementById('preview-container');
    
    // Image preview handler for multiple files
    if(imageInput && !imageInput.dataset.wired){
      imageInput.dataset.wired = '1';
      imageInput.addEventListener('change', async (e)=>{
        const files = Array.from(e.target.files);
        if(files.length > 0){
          previewDiv.style.display = 'block';
          previewContainer.innerHTML = '';
          for(const file of files){
            const reader = new FileReader();
            reader.onload = (ev)=>{
              const img = document.createElement('img');
              img.src = ev.target.result;
              img.style.cssText = 'width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb;';
              img.alt = 'Preview';
              previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
          }
        }
      });
    }
    
    if(form && !form.dataset.wired){
      form.dataset.wired = '1';
      form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        if(!validSession()){ alert('Session expired. Please login again.'); showLogin(); return; }
        
        // Collect specifications
        const specifications = {};
        document.querySelectorAll('.spec-row').forEach(row => {
          const key = row.querySelector('.spec-key').value.trim();
          const value = row.querySelector('.spec-value').value.trim();
          if (key && value) {
            specifications[key] = value;
          }
        });
        
        // Collect features
        const features = [];
        document.querySelectorAll('.feature-row').forEach(row => {
          const feature = row.querySelector('.feature-input').value.trim();
          if (feature) {
            features.push(feature);
          }
        });
        
        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value.trim());
        formData.append('brand', document.getElementById('product-brand').value.trim());
        formData.append('price', document.getElementById('product-price').value);
        formData.append('description', document.getElementById('product-description').value.trim());
        formData.append('shortDescription', document.getElementById('product-short-description').value.trim());
        formData.append('stock', document.getElementById('product-stock').value);
        formData.append('specifications', JSON.stringify(specifications));
        formData.append('features', JSON.stringify(features));
        
        // Add images
        const imageFiles = imageInput.files;
        if (imageFiles.length > 0) {
          for (let i = 0; i < imageFiles.length; i++) {
            formData.append('images', imageFiles[i]);
          }
        }
        
        try {
          let response;
          if(editingId){
            // Update existing product
            response = await fetch(`${API_URL}/products/${editingId}`, {
              method: 'PUT',
              body: formData
            });
          } else {
            // Add new product
            response = await fetch(`${API_URL}/products`, {
              method: 'POST',
              body: formData
            });
          }
          
          if (response.ok) {
            const result = await response.json();
            showToast(editingId ? 'Product updated successfully!' : 'Product added successfully!');
            products = await getProducts();
            renderList();
            updateStats();
            resetForm();
          } else {
            alert('Failed to save product. Make sure the server is running.');
          }
        } catch (error) {
          console.error(error);
          alert('Server error. Make sure Node.js server is running on port 3000.');
        }
      });
    }
    if(cancel && !cancel.dataset.wired){ cancel.dataset.wired = '1'; cancel.addEventListener('click', resetForm); }
  }

})();
