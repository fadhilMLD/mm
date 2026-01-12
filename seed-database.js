require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const sampleProducts = [
    {
        slug: 'iphone-15-pro',
        name: 'iPhone 15 Pro',
        brand: 'Apple',
        price: 999.99,
        image: 'https://via.placeholder.com/400',
        images: ['https://via.placeholder.com/400'],
        description: 'Latest iPhone with A17 Pro chip',
        shortDescription: 'Latest iPhone with A17 Pro chip',
        fullDescription: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system',
        stock: 25,
        category: 'Smartphones',
        specifications: {
            'Display': '6.1-inch Super Retina XDR',
            'Processor': 'A17 Pro chip',
            'RAM': '8GB',
            'Storage': '256GB'
        },
        features: ['5G', 'Face ID', 'Water Resistant'],
        cloudinaryIds: []
    }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✓ Connected to MongoDB');
        
        // Clear existing products
        await Product.deleteMany({});
        console.log('✓ Cleared existing products');
        
        // Insert sample products
        await Product.insertMany(sampleProducts);
        console.log('✓ Added sample products');
        
        console.log('✓ Database seeded successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
