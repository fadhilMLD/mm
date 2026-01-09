# MetroMobiles E-Commerce Website

A fully functional e-commerce website for mobile phones with an integrated admin portal and Google OAuth authentication.

## Features

### Authentication System
- **Email/Password Registration**: Create account with email
- **Google OAuth Login**: Sign in with your Google account (real OAuth implementation)
- **User Sessions**: Secure session management with automatic timeout
- **Protected Checkout**: Login required to complete purchases
- **User Profiles**: View order history and account details

### Main Website (index.html)
- **Product Catalog**: Browse through all available mobile phones
- **Search Functionality**: Search products by name, brand, or description
- **Sort Options**: Sort by price (low to high, high to low) or name
- **Brand Filter**: Filter products by manufacturer
- **Product Details**: View product specifications, pricing, and stock availability
- **Add to Cart**: Add products to shopping cart with stock validation
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### Shopping Cart (cart.html)
- **Cart Management**: View all items in your cart
- **Quantity Controls**: Increase/decrease product quantities
- **Real-time Calculations**: Automatic subtotal, tax (10%), and shipping calculations
- **Remove Items**: Delete products from cart
- **Checkout Process**: Complete purchase with order summary
- **Stock Integration**: Automatically updates product stock after purchase

### Admin Portal (admin.html)
- **Add Products**: Create new products with complete details
- **Edit Products**: Modify existing product information
- **Delete Products**: Remove products from the catalog
- **Product Management**: View all products with key information
- **Stock Monitoring**: Track low stock items
- **Form Validation**: Ensures all required fields are filled correctly
- **Real-time Updates**: Changes reflect immediately on the main website

## Product Information Fields

When adding/editing products in the admin panel:
- **Product Name** (Required): Full name of the mobile phone
- **Brand** (Required): Manufacturer name (e.g., Apple, Samsung)
- **Price** (Required): Product price in USD
- **Description** (Required): Detailed product description
- **Image URL** (Required): Direct link to product image
- **Stock Quantity** (Required): Number of units available
- **Specifications** (Optional): Technical specs (RAM, Storage, Display, etc.)

## How to Use

### For Customers:
1. **Browse Products**: Open `index.html` to view all available products
2. **Search/Filter**: Use the search bar or filters to find specific products
3. **Add to Cart**: Click "Add to Cart" button on any product
4. **View Cart**: Click "Cart" in navigation to review your items
5. **Checkout**: Review your order and click "Proceed to Checkout"

### For Admins:
1. **Access Admin**: Open `admin.html` or click "Admin" in navigation
2. **Add Product**: Fill out the form with product details and click "Add Product"
3. **Edit Product**: Click "Edit" button on any product card
4. **Delete Product**: Click "Delete" button to remove a product
5. **View Stats**: Monitor total products and stock levels

## Technology Stack

- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Interactive functionality
- **LocalStorage**: Data persistence (no backend required)
- **Font Awesome**: Icon library
- **Responsive Design**: Mobile-first approach

## Data Storage

All data is stored in the browser's localStorage:
- `metromobiles_products`: Product catalog
- `metromobiles_cart`: Shopping cart items

The website comes pre-loaded with 6 sample products including:
- iPhone 15 Pro
- Samsung Galaxy S24 Ultra
- Google Pixel 8 Pro
- OnePlus 12
- Xiaomi 14 Pro
- iPhone 14

## File Structure

```
metro_mobiles_web/
├── index.html          # Main homepage
├── cart.html           # Shopping cart page
├── admin.html          # Admin portal
├── css/
│   └── styles.css      # All styling
└── js/
    ├── main.js         # Homepage functionality
    ├── cart.js         # Cart functionality
    └── admin.js        # Admin functionality
```

## Features in Detail

### Smart Inventory Management
- Stock levels automatically decrease after checkout
- Low stock warnings (< 10 items)
- Out of stock products cannot be added to cart
- Maximum quantity validation

### Shopping Experience
- Real-time cart count in navigation
- Product images with fallback for broken links
- Smooth animations and transitions
- Visual notifications for actions

### Admin Experience
- Sticky form for easy access while scrolling
- Product counter statistics
- Inline editing with pre-filled forms
- Confirmation dialogs for destructive actions

## Browser Support

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Getting Started

1. Open `index.html` in your web browser
2. Browse products or go to Admin panel to add your own
3. Start shopping!

## Tips

- **Clear Data**: Open browser console and run `localStorage.clear()` to reset all data
- **Image URLs**: Use direct image links from services like Unsplash, Imgur, or your own hosting
- **Stock Management**: Monitor stock levels in the admin panel to restock when needed
- **Backup**: Export localStorage data if you want to save your products

## Future Enhancements

Possible additions for the future:
- User authentication
- Backend database integration
- Payment gateway integration
- Order history
- Product reviews and ratings
- Image upload functionality
- Advanced analytics

## Google OAuth Setup

The application is configured with Google OAuth Client ID:
```
<userPrompt>
Provide the fully rewritten file, incorporating the suggested code change. You must produce the complete file.
</userPrompt>
