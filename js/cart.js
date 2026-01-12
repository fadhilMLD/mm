// Cart Page Functionality
let cart = [];
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
const TOKEN_KEY = 'metromobiles_auth_token';

document.addEventListener('DOMContentLoaded', async function() {
    await validateCartProducts();
    loadCart();
    updateCartCount();
    updateAuthNavigation();
    
    document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
});

async function validateCartProducts() {
    try {
        const cart = getCart();
        if (cart.length === 0) return;
        
        // Fetch current products from server
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) return;
        
        const currentProducts = await response.json();
        const currentProductIds = new Set(
            currentProducts.map(p => (p._id || p.id)?.toString())
        );
        
        // Filter out products that no longer exist
        const validCart = cart.filter(item => {
            const itemId = item.id?.toString();
            return currentProductIds.has(itemId);
        });
        
        // If cart was cleaned up, save and notify
        if (validCart.length !== cart.length) {
            saveCart(validCart);
            const removedCount = cart.length - validCart.length;
            showNotification(`${removedCount} unavailable product(s) removed from cart`, 'warning');
        }
    } catch (error) {
        console.error('Error validating cart:', error);
    }
}

function loadCart() {
    cart = getCart();
    displayCart();
}

function getCart() {
    const cartData = localStorage.getItem('metromobiles_cart');
    return cartData ? JSON.parse(cartData) : [];
}

function saveCart(cartData) {
    localStorage.setItem('metromobiles_cart', JSON.stringify(cartData));
}

function displayCart() {
    const cartItems = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const cartContent = document.getElementById('cart-content');
    
    if (cart.length === 0) {
        cartEmpty.style.display = 'flex';
        cartContent.style.display = 'none';
        return;
    }
    
    cartEmpty.style.display = 'none';
    cartContent.style.display = 'grid';
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2212%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="cart-item-brand">${item.brand}</p>
                <p class="cart-item-price">₹${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" value="${item.quantity}" min="1" max="${item.maxStock}" 
                       onchange="setQuantity('${item.id}', this.value)" readonly>
                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="cart-item-total">
                <p>₹${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    updateSummary();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id == productId); // Use == for loose comparison
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > item.maxStock) {
        alert(`Maximum stock available: ${item.maxStock}`);
        return;
    }
    
    item.quantity = newQuantity;
    saveCart(cart);
    displayCart();
    updateCartCount();
}

function setQuantity(productId, value) {
    const item = cart.find(i => i.id == productId); // Use == for loose comparison
    if (!item) return;
    
    const quantity = parseInt(value);
    
    if (quantity < 1 || isNaN(quantity)) {
        removeFromCart(productId);
        return;
    }
    
    if (quantity > item.maxStock) {
        alert(`Maximum stock available: ${item.maxStock}`);
        item.quantity = item.maxStock;
    } else {
        item.quantity = quantity;
    }
    
    saveCart(cart);
    displayCart();
    updateCartCount();
}

function removeFromCart(productId) {
    if (confirm('Remove this item from cart?')) {
        cart = cart.filter(item => item.id != productId); // Use != for loose comparison
        saveCart(cart);
        displayCart();
        updateCartCount();
    }
}

function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 0 ? 10 : 0; // ₹10 flat shipping
    const total = subtotal + tax + shipping;
    
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('shipping').textContent = `₹${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

async function handleCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        if (confirm('Please login to checkout. Would you like to login now?')) {
            sessionStorage.setItem('checkout_redirect', 'true');
            window.location.href = 'auth.html';
        }
        return;
    }

    try {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const shipping = 10;
        const total = subtotal + tax + shipping;

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cart.map(item => ({
                    productId: item.id,
                    name: item.name,
                    brand: item.brand,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                total
            })
        });

        if (!response.ok) {
            throw new Error('Checkout failed');
        }

        alert('Order placed successfully!');
        localStorage.removeItem('metromobiles_cart');
        window.location.href = 'profile.html';
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to place order. Please try again.');
    }
}

function saveOrderToProfile(cartItems, total) {
    const session = JSON.parse(sessionStorage.getItem('metromobiles_user_session'));
    const users = JSON.parse(localStorage.getItem('metromobiles_users') || '[]');
    
    const user = users.find(u => u.id === session.userId);
    if (!user) return;
    
    if (!user.orders) {
        user.orders = [];
    }
    
    user.orders.push({
        items: cartItems,
        total,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('metromobiles_users', JSON.stringify(users));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icon = type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    const bgColor = type === 'warning' ? '#fbbf24' : '#10b981';
    
    notification.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    notification.style.background = bgColor;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function updateAuthNavigation() {
    const session = sessionStorage.getItem('metromobiles_user_session');
    const authNavItem = document.getElementById('auth-nav-item');
    
    if (session && authNavItem) {
        try {
            const userData = JSON.parse(session);
            authNavItem.innerHTML = `<a href="profile.html"><i class="fas fa-user-circle"></i> ${userData.name}</a>`;
        } catch (error) {
            console.error('Error parsing session:', error);
        }
    }
}
