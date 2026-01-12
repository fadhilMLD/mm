# MetroMobiles E-Commerce Platform

Modern e-commerce platform with MongoDB database and Cloudinary image storage.

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB (local or MongoDB Atlas)
- **Image Storage**: Cloudinary
- **Authentication**: JWT + bcrypt
- **Frontend**: Vanilla JavaScript

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
- Install MongoDB Community Edition
- Start MongoDB service: `mongod`
- Use connection string: `mongodb://localhost:27017/metromobiles`

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string from "Connect" → "Connect your application"
4. Replace in `.env`: `mongodb+srv://username:password@cluster.mongodb.net/metromobiles`

### 3. Cloudinary Setup

1. Create free account at https://cloudinary.com
2. Go to Dashboard to get credentials:
   - Cloud Name
   - API Key
   - API Secret
3. Add to `.env` file

### 4. Environment Variables

Create `.env` file in project root:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/metromobiles

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_super_secret_key_change_in_production

# Server
PORT=3000
NODE_ENV=development
```

### 5. Start Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 6. Access Application

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html (default password: `admin123`)

## Features

### User Features
- Email/Password Registration & Login
- Google OAuth Authentication
- Shopping Cart Management
- Order History
- Profile Management

### Admin Features
- Product Management (CRUD)
- Multi-image Upload to Cloudinary
- Stock Management
- Product Specifications & Features

### Product Features
- All images stored in Cloudinary
- Automatic image optimization
- Secure URLs
- Old images deleted when product updated/removed

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/profile` - Get user profile (requires token)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Add product (requires images)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product & images

### Orders
- `POST /api/orders` - Create order (requires auth)

## Security Notes

1. **Change JWT_SECRET** in production
2. **Use HTTPS** in production
3. **Enable MongoDB authentication** in production
4. **Use environment variables** for all secrets
5. **Never commit `.env` file**

## Troubleshooting

### MongoDB Connection Issues
- Check MongoDB service is running
- Verify connection string in `.env`
- Check network access in MongoDB Atlas

### Cloudinary Upload Fails
- Verify credentials in `.env`
- Check file size limits
- Ensure `multer-storage-cloudinary` is installed

### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET is set
- Verify token in Network tab

## Data Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  provider: 'email' | 'google',
  picture: String (Cloudinary URL),
  orders: [{
    orderId: String,
    date: Date,
    items: Array,
    total: Number
  }]
}
```

### Product Model
```javascript
{
  name: String,
  brand: String,
  price: Number,
  image: String (Cloudinary URL),
  images: [String] (Cloudinary URLs),
  description: String,
  stock: Number,
  specifications: Map,
  features: [String],
  cloudinaryIds: [String] (for deletion)
}
```

## License

MIT

## Support

For issues, please create a GitHub issue or contact metromobilestsr@gmail.com
