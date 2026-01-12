// Search Page Functionality
(function() {
    'use strict';

    let allProducts = [];
    let filteredProducts = [];
    let currentSearchTerm = '';

    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : `${window.location.origin}/api`;

    document.addEventListener('DOMContentLoaded', async function() {
        await loadProducts();
        setupEventListeners();
        performSearch();
        await validateAndCleanCart();
        updateCartCount();
        updateAuthNavigation();
    });

    function setupEventListeners() {
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');
        const brandFilter = document.getElementById('brand-filter');
        
        searchBtn.addEventListener('click', handleSearchClick);
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') handleSearchClick();
        });
        
        sortSelect.addEventListener('change', handleSort);
        brandFilter.addEventListener('change', handleBrandFilter);
    }

    async function loadProducts() {
        allProducts = await getProducts();
        populateBrandFilter();
    }

    function populateBrandFilter() {
        const brandFilter = document.getElementById('brand-filter');
        const brands = [...new Set(allProducts.map(p => p.brand))];
        
        brandFilter.innerHTML = '<option value="">All Brands</option>';
        brands.forEach(brand => {
            brandFilter.innerHTML += `<option value="${brand}">${brand}</option>`;
        });
    }

    function performSearch() {
        const urlParams = new URLSearchParams(window.location.search);
        currentSearchTerm = urlParams.get('q') || '';
        const brand = urlParams.get('brand') || '';
        
        const searchInput = document.getElementById('search-input');
        searchInput.value = currentSearchTerm;
        
        if (brand) {
            document.getElementById('brand-filter').value = brand;
        }
        
        filterProducts();
        displayProducts();
    }

    function handleSearchClick() {
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm) {
            // Update URL with search query
            const url = new URL(window.location);
            url.searchParams.set('q', searchTerm);
            window.history.pushState({}, '', url);
            
            currentSearchTerm = searchTerm;
            filterProducts();
            displayProducts();
        }
    }

    function filterProducts() {
        const brandValue = document.getElementById('brand-filter').value;
        
        filteredProducts = allProducts.filter(product => {
            const matchesSearch = !currentSearchTerm || 
                product.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                product.brand.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(currentSearchTerm.toLowerCase()));
            
            const matchesBrand = !brandValue || product.brand === brandValue;
            
            return matchesSearch && matchesBrand;
        });
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
        
        displayProducts();
    }

    function handleBrandFilter() {
        const brandValue = document.getElementById('brand-filter').value;
        
        // Update URL with brand filter
        const url = new URL(window.location);
        if (brandValue) {
            url.searchParams.set('brand', brandValue);
        } else {
            url.searchParams.delete('brand');
        }
        window.history.pushState({}, '', url);
        
        filterProducts();
        displayProducts();
    }

    function displayProducts() {
        const productsGrid = document.getElementById('products-grid');
        const noProducts = document.getElementById('no-products');
        const searchInfo = document.getElementById('search-info');
        const searchTitle = document.getElementById('search-title');
        
        // Update title and info
        if (currentSearchTerm) {
            searchTitle.textContent = `Search Results for "${currentSearchTerm}"`;
            searchInfo.innerHTML = `<p>Found <strong>${filteredProducts.length}</strong> product${filteredProducts.length !== 1 ? 's' : ''} matching your search</p>`;
        } else {
            searchTitle.textContent = 'All Products';
            searchInfo.innerHTML = `<p>Showing <strong>${filteredProducts.length}</strong> product${filteredProducts.length !== 1 ? 's' : ''}</p>`;
        }
        
        if (filteredProducts.length === 0) {
            productsGrid.style.display = 'none';
            noProducts.style.display = 'flex';
            return;
        }
        
        productsGrid.style.display = 'grid';
        noProducts.style.display = 'none';
        
        productsGrid.innerHTML = filteredProducts.map(product => {
            const productId = product._id || product.id; // Support MongoDB _id
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
                        <p class="product-description">${product.description || product.shortDescription || ''}</p>
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

    async function getProducts() {
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

    window.addToCart = function(productId) {
        const product = allProducts.find(p => (p._id || p.id) == productId);
        if (!product || product.stock === 0) {
            alert('Sorry, this product is out of stock!');
            return;
        }
        
        const cart = JSON.parse(localStorage.getItem('metromobiles_cart') || '[]');
        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                alert('Cannot add more items. Maximum stock reached!');
                return;
            }
            existingItem.quantity++;
        } else {
            cart.push({
                id: product._id || product.id,
                name: product.name,
                brand: product.brand,
                price: product.price,
                image: product.image,
                quantity: 1,
                maxStock: product.stock
            });
        }
        
        localStorage.setItem('metromobiles_cart', JSON.stringify(cart));
        updateCartCount();
        showNotification('Added to cart successfully!');
    };

    async function validateAndCleanCart() {
        try {
            const cart = JSON.parse(localStorage.getItem('metromobiles_cart') || '[]');
            if (cart.length === 0) return;
            
            // Get valid product IDs
            const validProductIds = new Set(
                allProducts.map(p => (p._id || p.id)?.toString())
            );
            
            // Filter out deleted products
            const validCart = cart.filter(item => {
                const itemId = item.id?.toString();
                return validProductIds.has(itemId);
            });
            
            // Save cleaned cart
            if (validCart.length !== cart.length) {
                localStorage.setItem('metromobiles_cart', JSON.stringify(validCart));
                const removedCount = cart.length - validCart.length;
                console.log(`Removed ${removedCount} unavailable product(s) from cart`);
            }
        } catch (error) {
            console.error('Error validating cart:', error);
        }
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

})();
