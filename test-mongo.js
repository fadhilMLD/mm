require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('Connection string:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✓ MongoDB connected successfully!');
        console.log('✓ Database ready to use');
        process.exit(0);
    })
    .catch(err => {
        console.error('✗ MongoDB connection failed:', err.message);
        console.log('\nTroubleshooting:');
        console.log('1. Check if MongoDB service is running');
        console.log('2. Verify connection string in .env file');
        console.log('3. Check firewall settings');
        process.exit(1);
    });
