require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer with Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'metromobiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✓ MongoDB connected successfully'))
.catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    console.log('\n⚠️  Make sure MongoDB is running:');
    console.log('   Windows: net start MongoDB');
    console.log('   Mac: brew services start mongodb-community');
    console.log('   Linux: sudo systemctl start mongod');
    console.log('\n   Or use MongoDB Atlas cloud database.\n');
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ===========================
// AUTH ROUTES
// ===========================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const user = new User({ name, email, password, provider: 'email' });
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                provider: user.provider
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                picture: user.picture
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Google OAuth
app.post('/api/auth/google', async (req, res) => {
    try {
        const { name, email, googleId, picture } = req.body;
        
        let user = await User.findOne({ email, provider: 'google' });
        
        if (!user) {
            user = new User({
                name,
                email,
                provider: 'google',
                googleId,
                picture
            });
            await user.save();
        } else {
            user.picture = picture;
            await user.save();
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                picture: user.picture
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to load profile' });
    }
});

// ===========================
// PRODUCT ROUTES
// ===========================

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({ error: 'Failed to load products' });
    }
});

// Get single product by ID or slug
app.get('/api/products/:id', async (req, res) => {
    try {
        let product;
        
        // Try to find by MongoDB _id first
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(req.params.id);
        }
        
        // If not found, try by slug
        if (!product) {
            product = await Product.findOne({ slug: req.params.id });
        }
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error loading product:', error);
        res.status(500).json({ error: 'Failed to load product' });
    }
});

// Add new product with Cloudinary images
app.post('/api/products', upload.array('images', 10), async (req, res) => {
    try {
        const imagePaths = req.files.map(file => file.path);
        const cloudinaryIds = req.files.map(file => file.filename);
        
        let specifications = {};
        let features = [];
        
        try {
            specifications = req.body.specifications ? JSON.parse(req.body.specifications) : {};
        } catch (e) {
            console.error('Error parsing specifications:', req.body.specifications);
            throw new Error('Invalid specifications format');
        }
        
        try {
            features = req.body.features ? JSON.parse(req.body.features) : [];
        } catch (e) {
            console.error('Error parsing features:', req.body.features);
            throw new Error('Invalid features format');
        }
        
        const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const newProduct = new Product({
            slug,
            name: req.body.name,
            brand: req.body.brand,
            mrp: parseFloat(req.body.mrp || req.body.price),
            price: parseFloat(req.body.price),
            image: imagePaths[0],
            images: imagePaths,
            description: req.body.description,
            shortDescription: req.body.shortDescription || req.body.description,
            fullDescription: req.body.description,
            stock: parseInt(req.body.stock),
            specifications,
            features,
            cloudinaryIds,
            category: 'Smartphones'
        });
        
        await newProduct.save();
        
        res.json({ success: true, product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Update product - handle both _id and slug
app.put('/api/products/:id', upload.array('images', 10), async (req, res) => {
    try {
        let product;
        
        // Try to find by MongoDB _id first
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(req.params.id);
        }
        
        // If not found, try by slug
        if (!product) {
            product = await Product.findOne({ slug: req.params.id });
        }
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Handle new images
        let imagePaths = product.images;
        let cloudinaryIds = product.cloudinaryIds || [];
        
        if (req.files && req.files.length > 0) {
            // Delete old images from Cloudinary
            if (product.cloudinaryIds) {
                await Promise.all(
                    product.cloudinaryIds.map(id => cloudinary.uploader.destroy(id))
                );
            }
            
            imagePaths = req.files.map(file => file.path);
            cloudinaryIds = req.files.map(file => file.filename);
        }
        
        let specifications = product.specifications;
        let features = product.features;
        
        try {
            specifications = req.body.specifications ? JSON.parse(req.body.specifications) : product.specifications;
        } catch (e) {
            console.error('Error parsing specifications:', req.body.specifications);
            throw new Error('Invalid specifications format');
        }
        
        try {
            features = req.body.features ? JSON.parse(req.body.features) : product.features;
        } catch (e) {
            console.error('Error parsing features:', req.body.features);
            throw new Error('Invalid features format');
        }
        
        product.name = req.body.name;
        product.brand = req.body.brand;
        product.mrp = parseFloat(req.body.mrp || req.body.price);
        product.price = parseFloat(req.body.price);
        product.image = imagePaths[0];
        product.images = imagePaths;
        product.description = req.body.description;
        product.shortDescription = req.body.shortDescription || req.body.description;
        product.fullDescription = req.body.description;
        product.stock = parseInt(req.body.stock);
        product.specifications = specifications;
        product.features = features;
        product.cloudinaryIds = cloudinaryIds;
        product.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        await product.save();
        
        res.json({ success: true, product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product - handle both _id and slug
app.delete('/api/products/:id', async (req, res) => {
    try {
        let product;
        
        // Try to find by MongoDB _id first
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(req.params.id);
        }
        
        // If not found, try by slug
        if (!product) {
            product = await Product.findOne({ slug: req.params.id });
        }
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const deletedProductId = product._id.toString();
        
        // Delete images from Cloudinary
        if (product.cloudinaryIds) {
            await Promise.all(
                product.cloudinaryIds.map(id => cloudinary.uploader.destroy(id))
            );
        }
        
        // Remove product from all users' orders that are still in their cart/order history
        // This ensures data consistency in the database
        await User.updateMany(
            { 'orders.items.productId': product._id },
            { 
                $pull: { 
                    'orders.$[].items': { productId: product._id } 
                } 
            }
        );
        
        // Delete the product
        await Product.findByIdAndDelete(product._id);
        
        // Return deleted product ID so clients can clean up their carts
        res.json({ 
            success: true, 
            deletedProductId: deletedProductId 
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ===========================
// ORDER ROUTES
// ===========================

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, total } = req.body;
        
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const order = {
            orderId: `ORD-${Date.now()}`,
            date: new Date(),
            items,
            total,
            status: 'completed'
        };
        
        user.orders.push(order);
        await user.save();
        
        // Update product stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ MongoDB: ${process.env.MONGODB_URI}`);
    console.log(`✓ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`✓ Admin portal: http://localhost:${PORT}/admin.html`);
});
