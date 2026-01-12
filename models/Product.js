const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    mrp: { type: Number, required: true }, // Maximum Retail Price (original price)
    price: { type: Number, required: true }, // Sale Price
    image: { type: String, required: true }, // Cloudinary URL
    images: [{ type: String }], // Array of Cloudinary URLs
    description: { type: String, required: true },
    shortDescription: { type: String },
    fullDescription: { type: String },
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, default: 'Smartphones' },
    specifications: { type: Map, of: String },
    features: [{ type: String }],
    cloudinaryIds: [{ type: String }], // Store Cloudinary public IDs for deletion
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Product', productSchema);
