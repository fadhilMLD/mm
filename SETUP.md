# Setup Instructions for Backend Server

## Prerequisites
- Node.js installed (download from https://nodejs.org/)

## Installation Steps

1. **Install Dependencies**
   Open PowerShell in the project folder and run:
   ```powershell
   npm install
   ```

2. **Start the Server**
   ```powershell
   npm start
   ```

3. **Access the Website**
   Open your browser and go to: `http://localhost:3000`
   
   Admin portal: `http://localhost:3000/admin.html`

## What This Does

✅ **Saves images to `products/images/` folder**
✅ **Updates `data.json` file automatically**
✅ **Supports multiple image uploads**
✅ **Real file storage (not base64)**

## Features

- Add products with multiple images
- Images are saved as physical files in `products/images/`
- Product data is written to `data.json`
- Edit and delete products
- All changes persist permanently

## Troubleshooting

- Make sure Node.js is installed
- Make sure port 3000 is not in use
- Check console for errors
- Admin password is still `admin123`
