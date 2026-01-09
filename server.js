const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.static(__dirname));

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'products', 'images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// Get all products
app.get('/api/products', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'products', 'data.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        res.json(data.products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load products' });
    }
});

// Add new product with images
app.post('/api/products', upload.array('images', 10), (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'products', 'data.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        // Process uploaded images
        const imagePaths = req.files.map(file => `products/images/${file.filename}`);
        
        // Parse specifications and features from JSON strings
        let specifications = {};
        let features = [];
        try {
            specifications = req.body.specifications ? JSON.parse(req.body.specifications) : {};
            features = req.body.features ? JSON.parse(req.body.features) : [];
        } catch (e) {
            console.error('Error parsing specifications or features:', e);
        }
        
        // Create new product
        const newProduct = {
            id: Date.now(),
            slug: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: req.body.name,
            brand: req.body.brand,
            price: parseFloat(req.body.price),
            image: imagePaths[0], // Main image
            images: imagePaths, // All images
            description: req.body.description,
            shortDescription: req.body.shortDescription || req.body.description,
            fullDescription: req.body.description,
            stock: parseInt(req.body.stock),
            specifications: specifications,
            features: features,
            category: 'Smartphones'
        };
        
        data.products.push(newProduct);
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        
        res.json({ success: true, product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Update product
app.put('/api/products/:id', upload.array('images', 10), (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'products', 'data.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        const productId = parseInt(req.params.id);
        const productIndex = data.products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Process new images if uploaded
        let imagePaths = data.products[productIndex].images || [data.products[productIndex].image];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `products/images/${file.filename}`);
        }
        
        // Parse specifications and features from JSON strings
        let specifications = data.products[productIndex].specifications || {};
        let features = data.products[productIndex].features || [];
        try {
            if (req.body.specifications) specifications = JSON.parse(req.body.specifications);
            if (req.body.features) features = JSON.parse(req.body.features);
        } catch (e) {
            console.error('Error parsing specifications or features:', e);
        }
        
        // Update product
        data.products[productIndex] = {
            ...data.products[productIndex],
            name: req.body.name,
            brand: req.body.brand,
            price: parseFloat(req.body.price),
            image: imagePaths[0],
            images: imagePaths,
            description: req.body.description,
            shortDescription: req.body.shortDescription || req.body.description,
            fullDescription: req.body.description,
            stock: parseInt(req.body.stock),
            specifications: specifications,
            features: features
        };
        
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        
        res.json({ success: true, product: data.products[productIndex] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'products', 'data.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        const productId = parseInt(req.params.id);
        const productIndex = data.products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Delete product images
        const product = data.products[productIndex];
        const images = product.images || [product.image];
        images.forEach(imgPath => {
            const fullPath = path.join(__dirname, imgPath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });
        
        data.products.splice(productIndex, 1);
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin portal: http://localhost:${PORT}/admin.html`);
});
