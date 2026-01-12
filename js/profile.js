// User Profile Page
(function() {
    'use strict';

    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
    const TOKEN_KEY = 'metromobiles_auth_token';

    document.addEventListener('DOMContentLoaded', async function() {
        checkAuth();
        await loadProfile();
        await validateAndCleanCart();
        updateCartCount();

        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    });

    function checkAuth() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            window.location.href = 'auth.html';
        }
    }

    async function loadProfile() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load profile');
            }

            const user = await response.json();

            document.getElementById('profile-name').textContent = user.name;
            document.getElementById('profile-email').textContent = user.email;
            
            if (user.picture) {
                const avatarEl = document.getElementById('profile-avatar');
                avatarEl.innerHTML = `<img src="${user.picture}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
            
            const badge = document.getElementById('profile-badge');
            if (user.provider === 'google') {
                badge.innerHTML = '<i class="fab fa-google"></i> Google Account';
                badge.style.display = 'inline-flex';
            }

            document.getElementById('total-orders').textContent = user.orders?.length || 0;
            const joinYear = new Date(user.createdAt).getFullYear();
            document.getElementById('member-since').textContent = joinYear;

            displayOrders(user.orders || []);
        } catch (error) {
            console.error('Profile error:', error);
            handleLogout();
        }
    }

    function displayOrders(orders) {
        const ordersList = document.getElementById('orders-list');
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="no-orders">No orders yet. <a href="index.html">Start shopping!</a></p>';
            return;
        }

        ordersList.innerHTML = orders.reverse().map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-date">${new Date(order.date).toLocaleDateString()}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2250%22 height=%2250%22/%3E%3C/svg%3E'">
                            <div>
                                <strong>${item.name}</strong>
                                <span>Qty: ${item.quantity} × ₹${item.price.toFixed(2)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    Total: <strong>₹${order.total.toFixed(2)}</strong>
                </div>
            </div>
        `).join('');
    }

    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem('metromobiles_user_session');
            window.location.href = 'index.html';
        }
    }

    function updateCartCount() {
        const cart = localStorage.getItem('metromobiles_cart');
        const cartData = cart ? JSON.parse(cart) : [];
        const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count').textContent = totalItems;
    }

    async function validateAndCleanCart() {
        try {
            const cart = JSON.parse(localStorage.getItem('metromobiles_cart') || '[]');
            if (cart.length === 0) return;
            
            // Fetch current products to validate cart
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) return;
            
            const currentProducts = await response.json();
            const validProductIds = new Set(
                currentProducts.map(p => (p._id || p.id)?.toString())
            );
            
            // Filter out deleted products
            const validCart = cart.filter(item => {
                const itemId = item.id?.toString();
                return validProductIds.has(itemId);
            });
            
            // Save cleaned cart
            if (validCart.length !== cart.length) {
                localStorage.setItem('metromobiles_cart', JSON.stringify(validCart));
                console.log(`Removed ${cart.length - validCart.length} unavailable product(s) from cart`);
            }
        } catch (error) {
            console.error('Error validating cart:', error);
        }
    }

})();
