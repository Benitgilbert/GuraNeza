# 🛍️ GuraNeza - Multi-Vendor E-Commerce Platform

A full-stack, production-ready multi-vendor e-commerce application built with the MERN stack (MongoDB, Express.js, React, Node.js).

[![Requirements Compliance](https://img.shields.io/badge/Requirements-100%25-success)](.)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue)](.)
[![Payment Methods](https://img.shields.io/badge/Payment-MoMo%20%2B%20Stripe-green)](.)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Default Admin Login](#-default-admin-login)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)

---

## 🌟 Features

### ✅ **For Customers**
- 🔐 Secure authentication (Email/Password + Google OAuth)
- 📧 **Mandatory email OTP verification** for new accounts
- 🛒 Multi-vendor shopping cart
- 💳 Multiple payment methods (MTN MoMo + Stripe)
- 🔍 Advanced product filtering (category, price range, search)
- 📦 Order tracking and history
- ⭐ Product reviews and ratings
- ❤️ Wishlist management
- 📍 Multiple shipping addresses
- 🔄 Customer-to-seller upgrade request

### ✅ **For Sellers**
- 🏪 Seller profile management
- 📦 Complete product inventory CRUD
- 📊 Sales dashboard and analytics
- 👀 View orders containing their products
- 🚚 Update shipping status
- 💰 Revenue tracking
- 🖼️ Logo upload (with base64 conversion)

### ✅ **For Admins**
- 🛡️ **Admin self-protection safeguards** (prevents self-blocking/role changes)
- 👥 User management (approve/deactivate/assign roles)
- 🏪 Seller approval system
- 📦 Global product management
- 🛒 Complete order oversight
- 📋 Seller upgrade request management
- 📊 Platform-wide analytics
- ⭐ Review moderation
- 🚚 Shipping fee configuration

---

## 🛠 Tech Stack

### **Backend**
- **Runtime:** Node.js v14+
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Authentication:** JWT + Passport.js (Google OAuth 2.0)
- **Payments:** MTN MoMo API + Stripe
- **Email Service:** Nodemailer (Gmail)
- **Security:** bcryptjs, CORS, helmet

### **Frontend**
- **Library:** React 18
- **Routing:** React Router DOM v6
- **Styling:** Pure CSS (no frameworks)
- **HTTP Client:** Axios
- **Payment UI:** Stripe Elements
- **State Management:** React Hooks

### **DevOps**
- **Version Control:** Git
- **Environment:** dotenv
- **Code Quality:** ESLint

---

## 📋 Prerequisites

Before running this project, ensure you have:

- ✅ **Node.js** v14.0.0 or higher ([Download](https://nodejs.org/))
- ✅ **npm** v6.0.0 or higher (comes with Node.js)
- ✅ **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/cloud/atlas))
- ✅ **Git** ([Download](https://git-scm.com/downloads))

### **Optional (for full functionality):**
- Google Cloud account (for OAuth)
- MTN MoMo API access ([Developer Portal](https://momodeveloper.mtn.com/))
- Stripe account ([Dashboard](https://dashboard.stripe.com/))
- Gmail account with App Password

---

## 🚀 Installation & Setup

### **1. Backend Setup**

#### **Step 1: Navigate to Backend Directory**
```bash
cd backend
```

#### **Step 2: Install Dependencies**
```bash
npm install
```

This will install all required packages:
- express
- mongoose
- jsonwebtoken
- bcryptjs
- passport & passport-google-oauth20
- nodemailer
- stripe
- axios (for MoMo API)
- cors, dotenv, etc.

#### **Step 3: Configure Environment Variables**

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Open `.env` and configure the following:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/guraneza

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_random
JWT_REFRESH_SECRET=your_refresh_secret_also_long_and_random
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email Configuration (for OTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# MTN MoMo Configuration
MOMO_API_USER=your_momo_api_user
MOMO_API_KEY=your_momo_api_key
MOMO_SUBSCRIPTION_KEY=your_momo_subscription_key
MOMO_ENVIRONMENT=sandbox

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Admin Default Credentials
DEFAULT_ADMIN_EMAIL=admin@guraneza.com
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!
```

> **📌 Important Notes:**
> - Replace all placeholder values with your actual credentials
> - Never commit `.env` to version control
> - Use MongoDB Atlas connection string (not local MongoDB)
> - For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password

#### **Step 4: Start Backend Server**

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The backend will start on **http://localhost:5000**

#### **✅ Backend is Ready When You See:**
```
🚀 GuraNeza Backend Server running on port 5000
📍 Environment: development
✅ Connected to MongoDB Atlas
✅ Default admin user created successfully
📦 Shipping rates already seeded
```

---

### **2. Frontend Setup**

#### **Step 1: Navigate to Frontend Directory**
```bash
# From project root
cd frontend
```

#### **Step 2: Install Dependencies**
```bash
npm install
```

This will install:
- react & react-dom
- react-router-dom
- axios
- @stripe/react-stripe-js & @stripe/stripe-js
- Other dependencies

#### **Step 3: Configure Environment (Optional)**

The frontend uses `http://localhost:5000` as the default API URL.

If your backend runs on a different port, create `.env` in the `frontend` folder:

```env
REACT_APP_API_URL=http://localhost:5000
```

#### **Step 4: Start Frontend Development Server**

```bash
npm start
```

The frontend will automatically open at **http://localhost:3000**

#### **✅ Frontend is Ready When You See:**
```
Compiled successfully!

You can now view guraneza-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## 🔐 Default Admin Login

Once the backend starts, a default admin user is **automatically created**.

### **Admin Credentials:**

| Field | Value |
|-------|-------|
| **Email** | `byiringirobenitg@gmail.com` *(or value from `.env`)* |
| **Password** | `guraneza123` *(or value from `.env`)* |

### **How to Login as Admin:**

1. Go to **http://localhost:3000/login**
2. Enter the credentials above
3. Click **"Sign In"**
4. You'll be redirected to **Admin Dashboard**

### **Changing Admin Credentials:**

Edit `backend/.env` file:
```env
DEFAULT_ADMIN_EMAIL=your_new_admin@example.com
DEFAULT_ADMIN_PASSWORD=YourNewSecurePassword123!
```

Then restart the backend server.

> **⚠️ Security Tip:** Change the default password immediately in production!

---

## 📂 Project Structure

```
GuraNeza/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── passport.js           # Google OAuth config
│   ├── controllers/
│   │   ├── addressController.js  # Address CRUD logic
│   │   └── productController.js  # Product CRUD logic
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── rbac.js               # Role-based access control
│   ├── models/
│   │   ├── User.js               # User schema (customer/seller/admin)
│   │   ├── Product.js            # Product schema with sellerId
│   │   ├── Order.js              # Multi-vendor order schema
│   │   ├── Cart.js               # Shopping cart schema
│   │   ├── Review.js             # Product review schema
│   │   ├── SellerProfile.js      # Seller store information
│   │   ├── SellerRequest.js      # Customer-to-seller upgrade requests
│   │   ├── Address.js            # Shipping addresses
│   │   ├── ShippingSetting.js    # Dynamic shipping fees
│   │   └── Wishlist.js           # Customer wishlist
│   ├── routes/
│   │   ├── authRoutes.js         # Signup, login, OAuth, OTP
│   │   ├── productRoutes.js      # Product CRUD, search, filter
│   │   ├── cartRoutes.js         # Cart operations
│   │   ├── orderRoutes.js        # Order creation & tracking
│   │   ├── reviewRoutes.js       # Review CRUD
│   │   ├── sellerRoutes.js       # Seller-specific operations
│   │   ├── adminRoutes.js        # Admin-only operations
│   │   ├── paymentRoutes.js      # MoMo + Stripe integration
│   │   ├── shippingRoutes.js     # Shipping fee management
│   │   ├── wishlistRoutes.js     # Wishlist operations
│   │   └── addressRoutes.js      # Address management
│   ├── utils/
│   │   ├── emailService.js       # Send OTP emails
│   │   ├── seedAdmin.js          # Create default admin
│   │   └── seedShipping.js       # Seed shipping rates
│   ├── .env.example              # Environment template
│   ├── server.js                 # Express app entry point
│   └── package.json              # Backend dependencies
│
├── frontend/
│   ├── public/
│   │   └── index.html           # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js        # Navigation header
│   │   │   ├── Footer.js        # Footer component
│   │   │   ├── DashboardLayout.js  # Dashboard wrapper
│   │   │   └── StripePaymentForm.js # Stripe payment UI
│   │   ├── pages/
│   │   │   ├── Home.js          # Landing page
│   │   │   ├── ProductList.js   # Product catalog with filters
│   │   │   ├── ProductDetail.js # Single product view
│   │   │   ├── Cart.js          # Shopping cart
│   │   │   ├── Checkout.js      # Checkout flow
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Signup.js        # Registration page
│   │   │   ├── ForgotPassword.js # OTP reset flow
│   │   │   ├── OrderHistory.js  # Customer orders
│   │   │   ├── admin/           # 9 admin pages
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminUsers.js
│   │   │   │   ├── AdminSellers.js
│   │   │   │   ├── AdminSellerRequests.js
│   │   │   │   ├── AdminProducts.js
│   │   │   │   ├── AdminOrders.js
│   │   │   │   ├── AdminOrderDetail.js
│   │   │   │   ├── AdminShipping.js
│   │   │   │   └── AdminReviews.js
│   │   │   ├── customer/        # Customer dashboard
│   │   │   │   ├── CustomerDashboard.js
│   │   │   │   ├── CustomerProfile.js
│   │   │   │   ├── CustomerSettings.js
│   │   │   │   ├── CustomerWishlist.js
│   │   │   │   ├── CustomerAddresses.js
│   │   │   │   └── SellerUpgradeRequest.js
│   │   │   └── seller/          # Seller dashboard
│   │   │       ├── SellerDashboard.js
│   │   │       ├── SellerProfile.js
│   │   │       ├── SellerProducts.js
│   │   │       ├── ProductForm.js
│   │   │       └── SellerOrders.js
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance with auth
│   │   ├── App.js               # Main app component
│   │   └── index.js             # React entry point
│   └── package.json             # Frontend dependencies
│
└── README.md                    # This file
```

---

## 📡 API Documentation

### **Base URL**
```
http://localhost:5000/api
```

### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| GET | `/auth/google` | Google OAuth login | ❌ |
| POST | `/auth/forgot-password` | Request OTP | ❌ |
| POST | `/auth/verify-otp` | Verify OTP code | ❌ |
| POST | `/auth/reset-password` | Reset password | ❌ |
| GET | `/auth/me` | Get current user | ✅ |
| POST | `/auth/refresh` | Refresh JWT token | ✅ |

### **Product Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products (with filters) | ❌ |
| GET | `/products/:id` | Get single product | ❌ |
| GET | `/products/:id/related` | Get related products | ❌ |
| POST | `/products` | Create product (seller) | ✅ Seller |
| PUT | `/products/:id` | Update product (seller) | ✅ Seller |
| DELETE | `/products/:id` | Delete product (seller) | ✅ Seller |

### **Cart Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get user's cart | ✅ |
| POST | `/cart/add` | Add item to cart | ✅ |
| PUT | `/cart/update` | Update item quantity | ✅ |
| DELETE | `/cart/remove/:productId` | Remove item | ✅ |
| DELETE | `/cart/clear` | Clear entire cart | ✅ |

### **Order Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/orders` | Create order from cart | ✅ Customer |
| GET | `/orders/my-orders` | Get customer's orders | ✅ Customer |
| GET | `/seller/orders` | Get seller's orders | ✅ Seller |
| GET | `/admin/orders` | Get all orders | ✅ Admin |
| PATCH | `/orders/:id/status` | Update order status | ✅ Admin |
| PATCH | `/orders/:id/shipping-status` | Update shipping | ✅ Seller/Admin |

### **Payment Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payment/stripe/create-payment-intent` | Create Stripe payment | ✅ |
| POST | `/payment/momo/request-payment` | Request MoMo payment | ✅ |
| POST | `/payment/momo/callback` | MoMo payment callback | ❌ |

### **Admin Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/users` | Get all users | ✅ Admin |
| PUT | `/admin/users/:id/role` | Change user role | ✅ Admin |
| PUT | `/admin/users/:id/deactivate` | Deactivate user | ✅ Admin |
| GET | `/admin/sellers` | Get all sellers | ✅ Admin |
| GET | `/admin/seller-requests` | Get seller upgrade requests | ✅ Admin |
| PUT | `/admin/seller-requests/:id/approve` | Approve seller request | ✅ Admin |
| PUT | `/admin/seller-requests/:id/reject` | Reject seller request | ✅ Admin |

---

## 🧪 Testing

### **Test User Accounts**

#### **Admin**
- **Email:** `byiringirobenitg@gmail.com`
- **Password:** `guraneza123`

#### **Test Seller** (create via signup)
- Go to `/signup`
- Choose role: "Seller"
- Fill in store details

#### **Test Customer** (create via signup)
- Go to `/signup`
- Choose role: "Customer"

### **Payment Testing**

#### **Stripe Test Cards**
```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
```

#### **MTN MoMo Sandbox**
- Use sandbox phone numbers from [MoMo Developer Portal](https://momodeveloper.mtn.com/)
- Test with sandbox API credentials

---

## 🌐 Deployment

### **Backend Deployment (Render/Railway)**

1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

### **Frontend Deployment (Vercel/Netlify)**

1. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy `build/` folder to Vercel/Netlify
3. Set `REACT_APP_API_URL` to production backend URL

---

## 📄 License

This project is created for educational purposes.

---

## 👨‍💻 Author

**Benitgilbert Byiringiro**
- Email: byiringirobenitg@gmail.com
- GitHub: [@Benitgilbert](https://github.com/Benitgilbert)

---

## 🙏 Acknowledgments

- MERN Stack community
- MTN MoMo Developer Portal
- Stripe Documentation
- MongoDB Atlas

---

**⭐ Star this repo if you find it helpful!**
