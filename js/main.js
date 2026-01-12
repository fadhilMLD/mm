// Storage Manager
const StorageManager = {
    getProducts: async function() {
        // Try API first
        try {
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000/api/products' : '/api/products';
            const response = await fetch(apiUrl);
            if (response.ok) {
                const products = await response.json();
                if (products && products.length > 0) {
                    return products;
                }
            }
        } catch (error) {
            console.log('API not available, checking localStorage');
        }
        
        // Check localStorage second
        const products = localStorage.getItem('metromobiles_products');
        if (products) {
            try {
                const parsedProducts = JSON.parse(products);
                if (parsedProducts && parsedProducts.length > 0) {
                    return parsedProducts;
                }
            } catch (error) {
                console.log('Error parsing localStorage products:', error);
            }
        }
        
        // Try to load from JSON file as fallback
        try {
            const response = await fetch('products/data.json?t=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                if (data.products && data.products.length > 0) {
                    return data.products;
                }
            }
        } catch (error) {
            console.log('Could not load products/data.json:', error);
        }
        
        // Last resort: default products
        return this.getDefaultProducts();
    },
    
    saveProducts: function(products) {
        localStorage.setItem('metromobiles_products', JSON.stringify(products));
    },
    
    getCart: function() {
        const cart = localStorage.getItem('metromobiles_cart');
        return cart ? JSON.parse(cart) : [];
    },
    
    saveCart: function(cart) {
        localStorage.setItem('metromobiles_cart', JSON.stringify(cart));
    },
    
    getDefaultProducts: function() {
        const defaultProducts = [
            {
                id: Date.now() + 1,
                slug: 'iphone-15-pro',
                name: 'iPhone 15 Pro',
                brand: 'Apple',
                price: 999.99,
                description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system',
                image: 'products/images/iphone-15-pro.jpg',
                stock: 25,
                specs: 'RAM: 8GB, Storage: 256GB, Display: 6.1 inch Super Retina XDR'
            },
            {
                id: Date.now() + 2,
                slug: 'samsung-galaxy-s24-ultra',
                name: 'Samsung Galaxy S24 Ultra',
                brand: 'Samsung',
                price: 1199.99,
                description: 'Premium Android flagship with S Pen, incredible camera zoom, and powerful performance',
                image: 'products/images/samsung-s24-ultra.jpg',
                stock: 30,
                specs: 'RAM: 12GB, Storage: 512GB, Display: 6.8 inch Dynamic AMOLED'
            },
            {
                id: Date.now() + 3,
                slug: 'google-pixel-8-pro',
                name: 'Google Pixel 8 Pro',
                brand: 'Google',
                price: 899.99,
                description: 'Best-in-class AI features, exceptional camera, and pure Android experience',
                image: 'products/images/google-pixel-8-pro.jpg',
                stock: 20,
                specs: 'RAM: 12GB, Storage: 256GB, Display: 6.7 inch LTPO OLED'
            },
            {
                id: Date.now() + 4,
                slug: 'oneplus-12',
                name: 'OnePlus 12',
                brand: 'OnePlus',
                price: 799.99,
                description: 'Fast charging, smooth display, and flagship performance at competitive price',
                image: 'products/images/oneplus-12.jpg',
                stock: 15,
                specs: 'RAM: 16GB, Storage: 256GB, Display: 6.82 inch AMOLED'
            },
            {
                id: Date.now() + 5,
                slug: 'xiaomi-14-pro',
                name: 'Xiaomi 14 Pro',
                brand: 'Xiaomi',
                price: 699.99,
                description: 'Leica-engineered cameras, powerful Snapdragon processor, great value',
                image: 'products/images/xiaomi-14-pro.jpg',
                stock: 18,
                specs: 'RAM: 12GB, Storage: 512GB, Display: 6.73 inch AMOLED'
            },
            {
                id: Date.now() + 6,
                slug: 'iphone-14',
                name: 'iPhone 14',
                brand: 'Apple',
                price: 699.99,
                description: 'Reliable iPhone with excellent performance and camera capabilities',
                image: 'products/images/iphone-14.jpg',
                stock: 35,
                specs: 'RAM: 6GB, Storage: 128GB, Display: 6.1 inch Super Retina XDR'
            }
        ];
        this.saveProducts(defaultProducts);
        return defaultProducts;
    }
};

// Main Page Functionality
let allProducts = [];
let filteredProducts = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    await loadProducts();
    await validateAndCleanCart();
    updateCartCount();
    setupEventListeners();
    renderHomepageEnhancements();
    updateAuthNavigation();
});

function setupEventListeners() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const brandFilter = document.getElementById('brand-filter');
    
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
    
    sortSelect.addEventListener('change', handleSort);
    brandFilter.addEventListener('change', handleBrandFilter);
}

async function loadProducts() {
    allProducts = await StorageManager.getProducts();
    filteredProducts = [...allProducts];
    populateBrandFilter();
    displayProducts(filteredProducts);
}

function populateBrandFilter() {
    const brandFilter = document.getElementById('brand-filter');
    const brands = [...new Set(allProducts.map(p => p.brand))];
    
    brandFilter.innerHTML = '<option value="">All Brands</option>';
    brands.forEach(brand => {
        brandFilter.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
}

function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');
    
    if (products.length === 0) {
        productsGrid.style.display = 'none';
        noProducts.style.display = 'block';
        return;
    }
    
    productsGrid.style.display = 'grid';
    noProducts.style.display = 'none';
    
    productsGrid.innerHTML = products.map(product => {
        const productId = product._id || product.id; // Support both MongoDB _id and legacy id
        const slug = product.slug || generateProductSlug(product.name);
        const mrp = product.mrp || product.price;
        const salePrice = product.price;
        const hasDiscount = mrp > salePrice;
        const discountPercent = hasDiscount ? Math.round(((mrp - salePrice) / mrp) * 100) : 0;
        
        return `
        <div class="product-card">
            <a href="product.html?id=${slug}" class="product-link">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2218%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                    ${hasDiscount ? `<span class="discount-badge">${discountPercent}% OFF</span>` : ''}
                    ${product.stock < 10 && product.stock > 0 ? '<span class="stock-badge low">Only ' + product.stock + ' left!</span>' : ''}
                    ${product.stock === 0 ? '<span class="stock-badge out">Out of Stock</span>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-brand">${product.brand}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description || product.shortDescription}</p>
                    ${product.specs ? `<p class="product-specs"><i class="fas fa-info-circle"></i> ${product.specs}</p>` : ''}
                    <div class="product-footer">
                        <div class="product-price">
                            ${hasDiscount ? `<span class="original-price">₹${mrp.toFixed(2)}</span>` : ''}
                            <span class="sale-price">₹${salePrice.toFixed(2)}</span>
                        </div>
                        <button class="btn btn-primary btn-add-cart" 
                                onclick="event.preventDefault(); event.stopPropagation(); addToCart('${productId}')" 
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> 
                            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </a>
        </div>
    `}).join('');
}

function generateProductSlug(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// --- Modern homepage extras ---
function renderHomepageEnhancements() {
    try {
        renderBrandChips();
        renderBrandTiles();
    } catch (e) { /* no-op if elements missing */ }
}

function renderBrandChips() {
    const el = document.getElementById('brand-chips');
    if (!el || !allProducts.length) return;
    const brands = [...new Set(allProducts.map(p => p.brand))];
    el.innerHTML = brands.map((b, i) => `
        <button class="chip ${i===0 ? 'active' : ''}" data-brand="${b}">
            <span>${b}</span>
        </button>
    `).join('');
    el.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip');
        if(!btn) return;
        el.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const brand = btn.getAttribute('data-brand');
        document.getElementById('brand-filter').value = brand;
        handleBrandFilter();
        document.getElementById('products-grid').scrollIntoView({behavior:'smooth'});
    });
}

function renderDealsStrip() {
    const wrap = document.getElementById('deals-strip');
    if (!wrap || !allProducts.length) return;
    const picks = [...allProducts].slice(0, 10);
    wrap.innerHTML = picks.map(p => {
        const old = (p.price * 1.15);
        const off = Math.round((1 - (p.price/old)) * 100);
        return `
        <div class="deal-card">
            <div class="deal-thumb"><img src="${p.image}" alt="${p.name}"></div>
            <div class="deal-body">
                <div class="price-row">
                    <strong>₹${p.price.toFixed(2)}</strong>
                    <span class="price-old">₹${old.toFixed(2)}</span>
                    <span class="deal-badge">${off}% OFF</span>
                </div>
                <div class="deal-name">${p.name}</div>
                <button class="btn btn-primary" onclick="addToCart(${p.id})"><i class="fas fa-cart-plus"></i> Add</button>
            </div>
        </div>`;
    }).join('');
}

function renderBrandTiles() {
    const el = document.getElementById('brand-tiles');
    if (!el || !allProducts.length) return;
    const brands = [...new Set(allProducts.map(p => p.brand))];
    const palette = [
        ['#111827', '#000000'],
        ['#f59e0b', '#fbbf24'],
        ['#10b981', '#34d399'],
        ['#ef4444', '#f87171'],
        ['#0ea5e9', '#38bdf8'],
        ['#8b5cf6', '#a78bfa']
    ];
    el.innerHTML = brands.map((b, idx) => {
        const [a, b2] = palette[idx % palette.length];
        const iconBg = `linear-gradient(135deg, ${a}, ${b2})`;
        return `
        <div class="brand-card">
            <div class="brand-info">
                <div class="brand-icon" style="background:${iconBg}">${b[0] || '?'}</div>
                <div>
                    <div class="brand-name">${b}</div>
                    <div class="brand-off">UP TO 80% OFF</div>
                </div>
            </div>
            <button class="btn btn-secondary" data-brand="${b}">Shop</button>
        </div>`;
    }).join('');

    el.addEventListener('click', (e)=>{
        const btn = e.target.closest('button[data-brand]');
        if(!btn) return;
        const brand = btn.getAttribute('data-brand');
        document.getElementById('brand-filter').value = brand;
        handleBrandFilter();
        document.getElementById('products-grid').scrollIntoView({behavior:'smooth'});
    });
}

function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.trim();
    
    if (searchTerm) {
        // Redirect to search page with query parameter
        window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
    }
}

function handleSort() {
    const sortValue = document.getElementById('sort-select').value;
    
    switch(sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    displayProducts(filteredProducts);
}

function handleBrandFilter() {
    const brandValue = document.getElementById('brand-filter').value;
    
    if (brandValue === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => product.brand === brandValue);
    }
    
    // Apply current search if any
    const searchTerm = document.getElementById('search-input').value;
    if (searchTerm) {
        handleSearch();
    } else {
        displayProducts(filteredProducts);
    }
}

function addToCart(productId) {
    const product = allProducts.find(p => (p._id || p.id) == productId);
    if (!product || product.stock === 0) {
        alert('Sorry, this product is out of stock!');
        return;
    }
    
    const cart = StorageManager.getCart();
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert('Cannot add more items. Maximum stock reached!');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            id: product._id || product.id, // Use MongoDB _id
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.image,
            quantity: 1,
            maxStock: product.stock
        });
    }
    
    StorageManager.saveCart(cart);
    updateCartCount();
    showNotification('Added to cart successfully!');
}

function updateCartCount() {
    const cart = StorageManager.getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateAuthNavigation() {
    const session = sessionStorage.getItem('metromobiles_user_session');
    const authNavItem = document.getElementById('auth-nav-item');
    
    if (session && authNavItem) {
        const userData = JSON.parse(session);
        authNavItem.innerHTML = `<a href="profile.html"><i class="fas fa-user-circle"></i> ${userData.name}</a>`;
    }
}

function loadRelatedProducts(allProducts) {
    const related = allProducts
        .filter(p => p.id !== currentProduct.id && p.brand === currentProduct.brand)
        .slice(0, 4);

    const grid = document.getElementById('related-products-grid');
    if (!grid) return;
    
    grid.innerHTML = related.map(product => {
        const slug = generateProductSlug(product.name);
        return `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-footer">
                    <div class="product-price">₹${product.price.toFixed(2)}</div>
                    <a href="product.html?id=${slug}" class="btn btn-primary">View</a>
                </div>
            </div>
        </div>
    `}).join('');
}

async function validateAndCleanCart() {
    try {
        const cart = StorageManager.getCart();
        if (cart.length === 0) return;
        
        // Get valid product IDs from loaded products
        const validProductIds = new Set(
            allProducts.map(p => (p._id || p.id)?.toString())
        );
        
        // Filter out products that no longer exist
        const validCart = cart.filter(item => {
            const itemId = item.id?.toString();
            return validProductIds.has(itemId);
        });
        
        // If cart was cleaned up, save silently
        if (validCart.length !== cart.length) {
            StorageManager.saveCart(validCart);
            const removedCount = cart.length - validCart.length;
            console.log(`Removed ${removedCount} unavailable product(s) from cart`);
        }
    } catch (error) {
        console.error('Error validating cart:', error);
    }
}
