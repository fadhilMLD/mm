(function() {
    'use strict';

    let currentProduct = null;
    let quantity = 1;
    let maxStock = 10;

    document.addEventListener('DOMContentLoaded', function() {
        loadProductDetails();
        setupEventListeners();
        updateCartCount();
        updateAuthNavigation();
    });

    function setupEventListeners() {
        // Quantity controls
        document.getElementById('qty-minus').addEventListener('click', () => updateQuantity(-1));
        document.getElementById('qty-plus').addEventListener('click', () => updateQuantity(1));
        document.getElementById('quantity-input').addEventListener('change', (e) => {
            quantity = Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1));
            e.target.value = quantity;
        });

        // Add to cart
        document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
        
        // Buy now
        document.getElementById('buy-now-btn').addEventListener('click', buyNow);

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
    }

    async function loadProductDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            window.location.href = 'index.html';
            return;
        }

        // Get products - try JSON first, then localStorage
        const products = await getProducts();
        
        // Find by ID (numeric) or slug (string)
        currentProduct = products.find(p => {
            const slug = generateSlug(p.name);
            return p.id == productId || slug === productId || p.slug === productId;
        });

        if (!currentProduct) {
            alert('Product not found!');
            window.location.href = 'index.html';
            return;
        }

        // Generate full product data with defaults
        currentProduct = enrichProductData(currentProduct);
        
        renderProduct();
        loadRelatedProducts(products);
    }

    function generateSlug(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function enrichProductData(product) {
        // Add default values if missing
        return {
            ...product,
            slug: product.slug || generateSlug(product.name),
            category: product.category || 'Smartphones',
            shortDescription: product.shortDescription || product.description,
            fullDescription: product.fullDescription || product.description + ' ' + (product.specs || ''),
            images: product.images || [product.image, product.image, product.image],
            specifications: product.specifications || parseSpecsFromString(product.specs),
            features: product.features || generateFeatures(product)
        };
    }

    function parseSpecsFromString(specsString) {
        if (!specsString) {
            return {
                'Display': 'Not specified',
                'Processor': 'Not specified',
                'RAM': 'Not specified',
                'Storage': 'Not specified'
            };
        }
        
        const specs = {};
        const parts = specsString.split(',').map(s => s.trim());
        
        parts.forEach(part => {
            const [key, value] = part.split(':').map(s => s.trim());
            if (key && value) {
                specs[key] = value;
            }
        });
        
        return specs;
    }

    function generateFeatures(product) {
        const features = [];
        
        if (product.brand === 'Apple') {
            features.push('Premium iOS experience');
            features.push('Industry-leading build quality');
            features.push('Long-term software support');
        } else if (product.brand === 'Samsung') {
            features.push('Beautiful AMOLED display');
            features.push('Versatile camera system');
            features.push('Fast charging support');
        } else if (product.brand === 'Google') {
            features.push('Pure Android experience');
            features.push('Excellent AI features');
            features.push('Best-in-class camera');
        }
        
        features.push('5G connectivity');
        features.push('Water and dust resistant');
        features.push('Fast wireless charging');
        features.push('Face unlock & fingerprint sensor');
        
        return features;
    }

    function renderProduct() {
        // Update page title
        document.getElementById('page-title').textContent = `${currentProduct.name} - MetroMobiles`;
        document.title = `${currentProduct.name} - MetroMobiles`;

        // Breadcrumb
        document.getElementById('breadcrumb-category').textContent = currentProduct.category;
        document.getElementById('breadcrumb-product').textContent = currentProduct.name;

        // Main image
        document.getElementById('main-product-image').src = currentProduct.images[0];
        document.getElementById('main-product-image').alt = currentProduct.name;

        // Thumbnail gallery
        const thumbnailGallery = document.getElementById('thumbnail-gallery');
        thumbnailGallery.innerHTML = currentProduct.images.map((img, index) => `
            <img src="${img}" alt="${currentProduct.name}" 
                 class="thumbnail ${index === 0 ? 'active' : ''}" 
                 onclick="changeMainImage('${img}', this)">
        `).join('');

        // Product info
        document.getElementById('product-badge').textContent = currentProduct.brand;
        document.getElementById('product-title').textContent = currentProduct.name;
        
        // Price display with discount
        const mrp = currentProduct.mrp || currentProduct.price;
        const salePrice = currentProduct.price;
        const hasDiscount = mrp > salePrice;
        const discountPercent = hasDiscount ? Math.round(((mrp - salePrice) / mrp) * 100) : 0;
        
        const priceElement = document.getElementById('product-price');
        if (hasDiscount) {
            priceElement.innerHTML = `
                <span class="original-price" style="text-decoration: line-through; color: #999; font-size: 1.2rem; margin-right: 0.5rem;">₹${mrp.toFixed(2)}</span>
                <span class="sale-price" style="color: var(--primary-color); font-size: 1.8rem; font-weight: 700;">₹${salePrice.toFixed(2)}</span>
                <span class="discount-badge" style="display: inline-block; margin-left: 0.5rem; padding: 0.25rem 0.75rem; background: #10b981; color: white; border-radius: 4px; font-size: 0.9rem; font-weight: 600;">${discountPercent}% OFF</span>
            `;
        } else {
            priceElement.textContent = `₹${salePrice.toFixed(2)}`;
        }
        
        document.getElementById('product-short-desc').textContent = currentProduct.shortDescription;

        // Stock info
        maxStock = currentProduct.stock;
        const stockInfo = document.getElementById('stock-info');
        const stockIndicator = document.getElementById('stock-indicator');
        
        if (currentProduct.stock === 0) {
            stockInfo.innerHTML = '<i class="fas fa-times-circle"></i> Out of Stock';
            stockInfo.className = 'product-stock-info out-of-stock';
            stockIndicator.innerHTML = 'OUT OF STOCK';
            stockIndicator.className = 'stock-indicator out';
            document.getElementById('add-to-cart-btn').disabled = true;
            document.getElementById('buy-now-btn').disabled = true;
        } else if (currentProduct.stock < 10) {
            stockInfo.innerHTML = `<i class="fas fa-exclamation-circle"></i> Only ${currentProduct.stock} left`;
            stockInfo.className = 'product-stock-info low-stock';
            stockIndicator.innerHTML = `ONLY ${currentProduct.stock} LEFT`;
            stockIndicator.className = 'stock-indicator low';
        } else {
            stockInfo.innerHTML = '<i class="fas fa-check-circle"></i> In Stock';
            stockInfo.className = 'product-stock-info in-stock';
            stockIndicator.style.display = 'none';
        }

        document.getElementById('quantity-input').max = currentProduct.stock;

        // Features
        const featuresList = document.getElementById('features-list');
        featuresList.innerHTML = currentProduct.features.map(feature => 
            `<li><i class="fas fa-check"></i> ${feature}</li>`
        ).join('');

        // Description
        document.getElementById('full-description').textContent = currentProduct.fullDescription;

        // Specifications
        const specsTable = document.getElementById('specs-table');
        specsTable.innerHTML = Object.entries(currentProduct.specifications).map(([key, value]) => `
            <tr>
                <td class="spec-label">${key}</td>
                <td class="spec-value">${value}</td>
            </tr>
        `).join('');
    }

    function changeMainImage(imageSrc, thumbnail) {
        document.getElementById('main-product-image').src = imageSrc;
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    }

    function updateQuantity(change) {
        quantity = Math.max(1, Math.min(maxStock, quantity + change));
        document.getElementById('quantity-input').value = quantity;
    }

    function addToCart() {
        if (!currentProduct || currentProduct.stock === 0) return;

        const cart = JSON.parse(localStorage.getItem('metromobiles_cart') || '[]');
        const existingItem = cart.find(item => item.id === currentProduct.id);

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > currentProduct.stock) {
                alert(`Cannot add more. Only ${currentProduct.stock} items available.`);
                return;
            }
            existingItem.quantity = newQuantity;
        } else {
            cart.push({
                id: currentProduct.id,
                name: currentProduct.name,
                brand: currentProduct.brand,
                price: currentProduct.price,
                image: currentProduct.images[0],
                quantity: quantity,
                maxStock: currentProduct.stock
            });
        }

        localStorage.setItem('metromobiles_cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`Added ${quantity} ${currentProduct.name} to cart!`);
    }

    function buyNow() {
        addToCart();
        window.location.href = 'cart.html';
    }

    function switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-panel`).classList.add('active');
    }

    function loadRelatedProducts(allProducts) {
        const related = allProducts
            .filter(p => p.id !== currentProduct.id && p.brand === currentProduct.brand)
            .slice(0, 4);

        const grid = document.getElementById('related-products-grid');
        grid.innerHTML = related.map(product => {
            const mrp = product.mrp || product.price;
            const salePrice = product.price;
            const hasDiscount = mrp > salePrice;
            const discountPercent = hasDiscount ? Math.round(((mrp - salePrice) / mrp) * 100) : 0;
            
            return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    ${hasDiscount ? `<span class="discount-badge">${discountPercent}% OFF</span>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-brand">${product.brand}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-footer">
                        <div class="product-price">
                            ${hasDiscount ? `<span class="original-price">₹${mrp.toFixed(2)}</span>` : ''}
                            <span class="sale-price">₹${salePrice.toFixed(2)}</span>
                        </div>
                        <a href="product.html?id=${generateSlug(product.name)}" class="btn btn-primary">View</a>
                    </div>
                </div>
            </div>
        `}).join('');
    }

    async function getProducts() {
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
            const response = await fetch('products/data.json');
            if (response.ok) {
                const data = await response.json();
                if (data.products && data.products.length > 0) {
                    return data.products;
                }
            }
        } catch (error) {
            console.log('Could not load from JSON file');
        }
        
        return [];
    }

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('metromobiles_cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count').textContent = totalItems;
    }

    function updateAuthNavigation() {
        const session = sessionStorage.getItem('metromobiles_user_session');
        const authNavItem = document.getElementById('auth-nav-item');
        
        if (session && authNavItem) {
            const userData = JSON.parse(session);
            authNavItem.innerHTML = `<a href="profile.html"><i class="fas fa-user-circle"></i> ${userData.name}</a>`;
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Make changeMainImage globally accessible
    window.changeMainImage = changeMainImage;

})();
