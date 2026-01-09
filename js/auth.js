// Customer Authentication System
(function() {
    'use strict';

    const AUTH_STORAGE_KEY = 'metromobiles_users';
    const SESSION_KEY = 'metromobiles_user_session';

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        setupTabs();
        setupForms();
        initGoogleAuth();
        updateCartCount();
    });

    function setupTabs() {
        const tabs = document.querySelectorAll('.auth-tab');
        const containers = document.querySelectorAll('.auth-form-container');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                containers.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tabName}-form-container`).classList.add('active');
            });
        });
    }

    function setupForms() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        
        // Signup form
        document.getElementById('signup-form').addEventListener('submit', handleSignup);
    }

    function initGoogleAuth() {
        // Wait for Google API to load
        if (typeof google === 'undefined' || !google.accounts) {
            setTimeout(initGoogleAuth, 100);
            return;
        }

        // Initialize Google Identity Services
        google.accounts.id.initialize({
            client_id: GOOGLE_CONFIG.clientId,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Setup button click handlers
        const loginBtn = document.getElementById('google-login-btn');
        const signupBtn = document.getElementById('google-signup-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // Fallback to token client
                        showGoogleOneTap();
                    }
                });
            });
        }

        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                google.accounts.id.prompt();
            });
        }
    }

    function showGoogleOneTap() {
        // Alternative method using OAuth 2.0 Token
        const client = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CONFIG.clientId,
            scope: GOOGLE_CONFIG.scope,
            callback: (response) => {
                if (response.access_token) {
                    fetchGoogleUserInfo(response.access_token);
                }
            }
        });
        client.requestAccessToken();
    }

    function handleGoogleCallback(response) {
        // Decode the JWT credential from Google
        const credential = response.credential;
        const payload = parseJwt(credential);
        
        if (payload) {
            processGoogleUser({
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                googleId: payload.sub
            });
        }
    }

    async function fetchGoogleUserInfo(accessToken) {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const userInfo = await response.json();
                processGoogleUser({
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    googleId: userInfo.sub
                });
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            const errorEl = document.getElementById('login-error');
            showError(errorEl, 'Failed to sign in with Google. Please try again.');
        }
    }

    function processGoogleUser(googleData) {
        const users = getUsers();
        let user = users.find(u => u.email === googleData.email && u.provider === 'google');

        if (!user) {
            // Create new user
            user = {
                id: Date.now(),
                name: googleData.name,
                email: googleData.email,
                provider: 'google',
                googleId: googleData.googleId,
                picture: googleData.picture,
                createdAt: new Date().toISOString(),
                orders: []
            };
            users.push(user);
            saveUsers(users);
            showNotification('Account created successfully with Google!');
        } else {
            // Update picture if changed
            if (googleData.picture) {
                user.picture = googleData.picture;
                saveUsers(users);
            }
            showNotification('Welcome back, ' + user.name + '!');
        }

        createSession(user);
        
        // Check for checkout redirect
        const checkoutRedirect = sessionStorage.getItem('checkout_redirect');
        if (checkoutRedirect) {
            sessionStorage.removeItem('checkout_redirect');
            setTimeout(() => window.location.href = 'cart.html', 1000);
        } else {
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing JWT:', e);
            return null;
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        // Validate
        if (!email || !password) {
            showError(errorEl, 'Please fill in all fields');
            return;
        }

        // Get users
        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            showError(errorEl, 'Email not found. Please sign up first.');
            return;
        }

        // Simple password check (in production, use proper hashing)
        if (user.password !== btoa(password)) {
            showError(errorEl, 'Incorrect password');
            return;
        }

        // Create session
        createSession(user);
        showNotification('Login successful!');
        setTimeout(() => window.location.href = 'index.html', 1000);
    }

    async function handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const errorEl = document.getElementById('signup-error');

        // Validate
        if (!name || !email || !password || !confirmPassword) {
            showError(errorEl, 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            showError(errorEl, 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showError(errorEl, 'Passwords do not match');
            return;
        }

        // Check if email exists
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            showError(errorEl, 'Email already registered. Please login.');
            return;
        }

        // Create user
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: btoa(password), // Simple encoding (use proper hashing in production)
            provider: 'email',
            createdAt: new Date().toISOString(),
            orders: []
        };

        users.push(newUser);
        saveUsers(users);

        // Create session
        createSession(newUser);
        showNotification('Account created successfully!');
        setTimeout(() => window.location.href = 'index.html', 1000);
    }

    function getUsers() {
        const data = localStorage.getItem(AUTH_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveUsers(users) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
    }

    function createSession(user) {
        const session = {
            userId: user.id,
            name: user.name,
            email: user.email,
            provider: user.provider,
            picture: user.picture || null,
            loginTime: Date.now()
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function updateCartCount() {
        const cart = localStorage.getItem('metromobiles_cart');
        const cartData = cart ? JSON.parse(cart) : [];
        const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count').textContent = totalItems;
    }

})();
