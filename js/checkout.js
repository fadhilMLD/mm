(function() {
    'use strict';

    const SESSION_KEY = 'metromobiles_user_session';
    const ADDRESSES_KEY = 'metromobiles_addresses';
    
    let cart = [];
    let selectedAddress = null;
    let deliveryOption = 'standard';
    let deliveryCost = 10.00;

    document.addEventListener('DOMContentLoaded', function() {
        checkAuth();
        loadCart();
        loadAddresses();
        setupEventListeners();
        updateCartCount();
        updateAuthNavigation();
    });

    function checkAuth() {
        const session = sessionStorage.getItem(SESSION_KEY);
        if (!session) {
            sessionStorage.setItem('checkout_redirect', 'true');
            window.location.href = 'auth.html';
        }
    }

    function setupEventListeners() {
        document.getElementById('add-new-address-btn').addEventListener('click', showAddressForm);
        document.getElementById('cancel-address-btn').addEventListener('click', hideAddressForm);
        document.getElementById('address-form').addEventListener('submit', saveAddress);
        document.getElementById('place-order-btn').addEventListener('click', placeOrder);
        
        // Delivery options
        document.querySelectorAll('input[name="delivery"]').forEach(radio => {
            radio.addEventListener('change', updateDeliveryOption);
        });
    }

    function loadCart() {
        const cartData = localStorage.getItem('metromobiles_cart');
        cart = cartData ? JSON.parse(cartData) : [];
        
        if (cart.length === 0) {
            alert('Your cart is empty!');
            window.location.href = 'cart.html';
            return;
        }
        
        displayCartItems();
        calculateTotals();
    }

    function loadAddresses() {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
        const addressesData = localStorage.getItem(ADDRESSES_KEY);
        const allAddresses = addressesData ? JSON.parse(addressesData) : {};
        const userAddresses = allAddresses[session.userId] || [];
        
        displayAddresses(userAddresses);
    }

    function displayAddresses(addresses) {
        const container = document.getElementById('saved-addresses');
        
        if (addresses.length === 0) {
            container.innerHTML = '<p class="no-addresses">No saved addresses. Please add a delivery address.</p>';
            return;
        }
        
        container.innerHTML = addresses.map((addr, index) => `
            <label class="address-card ${addr.isDefault || index === 0 ? 'selected' : ''}">
                <input type="radio" name="address" value="${addr.id}" ${addr.isDefault || index === 0 ? 'checked' : ''}>
                <div class="address-content">
                    <div class="address-header">
                        <strong>${addr.name}</strong>
                        ${addr.isDefault ? '<span class="badge">Default</span>' : ''}
                    </div>
                    <p>${addr.street}${addr.apartment ? ', ' + addr.apartment : ''}</p>
                    <p>${addr.city}, ${addr.state} ${addr.zip}</p>
                    <p>${addr.country}</p>
                    <p class="address-phone"><i class="fas fa-phone"></i> ${addr.phone}</p>
                </div>
                <div class="address-actions">
                    <button class="btn-icon" onclick="event.preventDefault(); editAddress(${addr.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="event.preventDefault(); deleteAddress(${addr.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </label>
        `).join('');
        
        // Set selected address
        selectedAddress = addresses.find(a => a.isDefault) || addresses[0];
    }

    function showAddressForm() {
        document.getElementById('address-form').style.display = 'block';
        document.getElementById('add-new-address-btn').style.display = 'none';
    }

    function hideAddressForm() {
        document.getElementById('address-form').style.display = 'none';
        document.getElementById('address-form').reset();
        document.getElementById('add-new-address-btn').style.display = 'block';
    }

    function saveAddress(e) {
        e.preventDefault();
        
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
        const addressesData = localStorage.getItem(ADDRESSES_KEY);
        const allAddresses = addressesData ? JSON.parse(addressesData) : {};
        
        if (!allAddresses[session.userId]) {
            allAddresses[session.userId] = [];
        }
        
        const newAddress = {
            id: Date.now(),
            name: document.getElementById('address-name').value,
            phone: document.getElementById('address-phone').value,
            street: document.getElementById('address-street').value,
            apartment: document.getElementById('address-apartment').value,
            city: document.getElementById('address-city').value,
            state: document.getElementById('address-state').value,
            zip: document.getElementById('address-zip').value,
            country: document.getElementById('address-country').value,
            isDefault: document.getElementById('address-default').checked
        };
        
        // If set as default, remove default from others
        if (newAddress.isDefault) {
            allAddresses[session.userId].forEach(addr => addr.isDefault = false);
        }
        
        allAddresses[session.userId].push(newAddress);
        localStorage.setItem(ADDRESSES_KEY, JSON.stringify(allAddresses));
        
        hideAddressForm();
        loadAddresses();
        showNotification('Address saved successfully!');
    }

    function displayCartItems() {
        const container = document.getElementById('checkout-items');
        container.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <strong>${item.name}</strong>
                    <span>Qty: ${item.quantity} × $${item.price.toFixed(2)}</span>
                </div>
                <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
        `).join('');
    }

    function updateDeliveryOption(e) {
        deliveryOption = e.target.value;
        
        switch(deliveryOption) {
            case 'standard':
                deliveryCost = 10.00;
                break;
            case 'express':
                deliveryCost = 25.00;
                break;
            case 'overnight':
                deliveryCost = 45.00;
                break;
        }
        
        calculateTotals();
    }

    function calculateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + deliveryCost + tax;
        
        document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('checkout-delivery').textContent = `$${deliveryCost.toFixed(2)}`;
        document.getElementById('checkout-tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
    }

    async function placeOrder() {
        if (!selectedAddress) {
            alert('Please select a delivery address');
            return;
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + deliveryCost + tax;
        
        // Here you would integrate with third-party delivery API
        // See documentation below for integration examples
        
        const order = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: cart,
            address: selectedAddress,
            deliveryOption: deliveryOption,
            deliveryCost: deliveryCost,
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: 'pending',
            trackingNumber: null // Will be provided by delivery service
        };
        
        // Save order to user profile
        saveOrder(order);
        
        // Update product stock
        updateStock();
        
        // Clear cart
        localStorage.removeItem('metromobiles_cart');
        
        alert('Order placed successfully! You will receive a confirmation email shortly.');
        window.location.href = 'profile.html';
    }

    function saveOrder(order) {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
        const users = JSON.parse(localStorage.getItem('metromobiles_users') || '[]');
        const user = users.find(u => u.id === session.userId);
        
        if (user) {
            if (!user.orders) user.orders = [];
            user.orders.push(order);
            localStorage.setItem('metromobiles_users', JSON.stringify(users));
        }
    }

    function updateStock() {
        const products = JSON.parse(localStorage.getItem('metromobiles_products') || '[]');
        cart.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);
            if (product) {
                product.stock -= cartItem.quantity;
            }
        });
        localStorage.setItem('metromobiles_products', JSON.stringify(products));
    }

    function updateCartCount() {
        document.getElementById('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function updateAuthNavigation() {
        const session = sessionStorage.getItem(SESSION_KEY);
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

    // Make functions globally accessible
    window.editAddress = function(id) {
        // Implementation for editing address
        alert('Edit address functionality - ID: ' + id);
    };

    window.deleteAddress = function(id) {
        if (confirm('Delete this address?')) {
            const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
            const addressesData = JSON.parse(localStorage.getItem(ADDRESSES_KEY));
            addressesData[session.userId] = addressesData[session.userId].filter(a => a.id !== id);
            localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addressesData));
            loadAddresses();
            showNotification('Address deleted');
        }
    };

})();
