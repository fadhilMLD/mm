// User Profile Page
(function() {
    'use strict';

    const SESSION_KEY = 'metromobiles_user_session';
    const AUTH_STORAGE_KEY = 'metromobiles_users';

    document.addEventListener('DOMContentLoaded', function() {
        checkAuth();
        loadProfile();
        updateCartCount();

        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    });

    function checkAuth() {
        const session = getSession();
        if (!session) {
            window.location.href = 'auth.html';
        }
    }

    function loadProfile() {
        const session = getSession();
        if (!session) return;

        const users = getUsers();
        const user = users.find(u => u.id === session.userId);
        if (!user) {
            handleLogout();
            return;
        }

        // Display profile info
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-email').textContent = user.email;
        
        // Show profile picture if available (Google users)
        if (user.picture) {
            const avatarEl = document.getElementById('profile-avatar');
            avatarEl.innerHTML = `<img src="${user.picture}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
        
        // Badge based on provider
        const badge = document.getElementById('profile-badge');
        if (user.provider === 'google') {
            badge.innerHTML = '<i class="fab fa-google"></i> Google Account';
            badge.style.display = 'inline-flex';
        }

        // Stats
        document.getElementById('total-orders').textContent = user.orders?.length || 0;
        const joinYear = new Date(user.createdAt).getFullYear();
        document.getElementById('member-since').textContent = joinYear;

        // Orders
        displayOrders(user.orders || []);
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
            sessionStorage.removeItem(SESSION_KEY);
            window.location.href = 'index.html';
        }
    }

    function getSession() {
        const data = sessionStorage.getItem(SESSION_KEY);
        return data ? JSON.parse(data) : null;
    }

    function getUsers() {
        const data = localStorage.getItem(AUTH_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function updateCartCount() {
        const cart = localStorage.getItem('metromobiles_cart');
        const cartData = cart ? JSON.parse(cart) : [];
        const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count').textContent = totalItems;
    }

})();
