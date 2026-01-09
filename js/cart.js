// Cart Page Functionality
let cart = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    updateCartCount();
    updateAuthNavigation();
    
    document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
});

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
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" value="${item.quantity}" min="1" max="${item.maxStock}" 
                       onchange="setQuantity(${item.id}, this.value)" readonly>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="cart-item-total">
                <p>$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    updateSummary();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
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
    const item = cart.find(i => i.id === productId);
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
        cart = cart.filter(item => item.id !== productId);
        saveCart(cart);
        displayCart();
        updateCartCount();
    }
}

function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 0 ? 10 : 0; // $10 flat shipping
    const total = subtotal + tax + shipping;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

function handleCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Check if user is logged in
    const session = sessionStorage.getItem('metromobiles_user_session');
    if (!session) {
        if (confirm('Please login to checkout. Would you like to login now?')) {
            sessionStorage.setItem('checkout_redirect', 'true');
            window.location.href = 'auth.html';
        }
        return;
    }

    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

function saveOrderToProfile(cartItems, total) {
    const session = JSON.parse(sessionStorage.getItem('metromobiles_user_session'));
    const users = JSON.parse(localStorage.getItem('metromobiles_users') || '[]');
    
    const user = users.find(u => u.id === session.userId);
    if (user) {
        if (!user.orders) user.orders = [];
        
        user.orders.push({
            id: Date.now(),
            date: new Date().toISOString(),
            items: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                brand: item.brand,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            total: total
        });
        
        localStorage.setItem('metromobiles_users', JSON.stringify(users));
    }
}

function updateAuthNavigation() {
    const session = sessionStorage.getItem('metromobiles_user_session');
    const authNavItem = document.getElementById('auth-nav-item');
    
    if (session && authNavItem) {
        const userData = JSON.parse(session);
        authNavItem.innerHTML = `<a href="profile.html"><i class="fas fa-user-circle"></i> ${userData.name}</a>`;
    }
}
