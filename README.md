# GuraNeza - Multi-Vendor E-Commerce Platform

A full-stack multi-vendor e-commerce application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🌟 Features

### For Customers
- Browse products from multiple vendors
- Advanced filtering (category, price range, search)
- Multi-vendor shopping cart
- Multiple payment methods (MTN MoMo, Stripe)
- Order tracking and history
- Product reviews (verified purchases only)

### For Sellers
- Seller registration and approval system
- Product inventory management (CRUD)
- View orders containing their products
- Sales dashboard and analytics
- Profile management

### For Admins
- Complete system oversight
- User and seller management (approve/block)
- Role assignment
- Order status management
- Platform statistics

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React (Pure CSS, no frameworks)
- **Database**: MongoDB Atlas
- **Authentication**: JWT + Google OAuth 2.0
- **Payment**: MTN MoMo API, Stripe
- **Email**: Nodemailer

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Google OAuth credentials (optional)
- MTN MoMo API credentials (for payments)
- Gmail account (for sending emails)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd GuraNeza
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory by copying `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# MTN MoMo
MOMO_API_USER=your_momo_api_user
MOMO_API_KEY=your_momo_api_key
MOMO_SUBSCRIPTION_KEY=your_momo_subscription_key
MOMO_ENVIRONMENT=sandbox

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Default Admin
DEFAULT_ADMIN_EMAIL=admin@guraneza.com
DEFAULT_ADMIN_PASSWORD=Admin@123456
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Update with:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🏃‍♂️ Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

## 👤 Default Admin Credentials

After the backend starts, a default admin user is automatically created:

- **Email**: admin@guraneza.com
- **Password**: Admin@123456

⚠️ **Important**: Change these credentials after first login in production!

## 📁 Project Structure

```
GuraNeza/
├── backend/
│   ├── config/
│   │   └── passport.js          # Google OAuth configuration
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── rbac.js               # Role-based access control
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── SellerProfile.js      # Seller profile schema
│   │   ├── Product.js            # Product schema
│   │   ├── Cart.js               # Shopping cart schema
│   │   ├── Order.js              # Order schema
│   │   └── Review.js             # Review schema
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication endpoints
│   │   ├── productRoutes.js      # Product CRUD
│   │   ├── cartRoutes.js         # Cart management
│   │   ├── orderRoutes.js        # Order processing
│   │   ├── reviewRoutes.js       # Product reviews
│   │   ├── adminRoutes.js        # Admin operations
│   │   ├── sellerRoutes.js       # Seller operations
│   │   └── paymentRoutes.js      # Payment processing
│   ├── utils/
│   │   ├── emailService.js       # Email utilities
│   │   └── seedAdmin.js          # Admin seeding
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── utils/
    │   │   ├── api.js            # Axios configuration
    │   │   └── auth.js           # Auth utilities
    │   ├── App.js                # Main app with routing
    │   ├── index.js              # React entry point
    │   └── index.css             # Global styles
    ├── .env.example
    └── package.json
```

## 🔐 Authentication Flow

1. **Signup**: Users register with email/password or Google OAuth
2. **Login**: JWT token issued upon successful authentication
3. **Password Reset**: OTP sent to email (10-minute validity)
4. **Role-Based Access**: Middleware protects routes based on user role

## 💳 Payment Integration

### MTN MoMo
- Sandbox environment for testing
- Real-time payment status tracking
- Automatic order status updates

### Stripe
- Card payments support
- Payment intent creation
- Webhook handling

## 📧 Email Configuration

For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App-Specific Password
3. Use it in `EMAIL_PASSWORD` env variable

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/forgot-password` - Request OTP
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products (with filters)
- `GET /api/products/:id` - Get product details
- `GET /api/products/:id/related` - Get related products
- `POST /api/products` - Create product (Seller)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update/:itemId` - Update quantity
- `DELETE /api/cart/remove/:itemId` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Customer orders
- `GET /api/orders/seller/my-sales` - Seller orders
- `GET /api/orders` - All orders (Admin)
- `PATCH /api/orders/:id/status` - Update status (Admin)

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Add review (verified purchase)
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Admin
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/status` - Block/unblock user
- `PATCH /api/admin/users/:id/role` - Change user role
- `GET /api/admin/sellers` - List sellers
- `PATCH /api/admin/sellers/:id/status` - Approve/block seller
- `GET /api/admin/stats` - Dashboard statistics

### Seller
- `GET /api/seller/profile` - Get seller profile
- `PUT /api/seller/profile` - Update profile
- `GET /api/seller/products` - List seller products
- `GET /api/seller/stats` - Seller statistics

### Payment
- `POST /api/payment/momo/initiate` - Initiate MoMo payment
- `GET /api/payment/momo/status/:referenceId` - Check payment status
- `POST /api/payment/stripe/create-intent` - Create Stripe intent

## 🧪 Testing

```bash
cd backend
npm test
```

## 📝 Development Roadmap

- ✅ Phase 1: Authentication & Admin Control
- ⏳ Phase 2: Product Management
- ⏳ Phase 3: Cart & Order Flow
- ⏳ Phase 4: Dashboards & Reviews
- ⏳ Phase 5: UI/UX Enhancement
- ⏳ Phase 6: Deployment

## 🤝 Contributing

This is a learning/demonstration project. Feel free to fork and enhance!

## 📄 License

ISC

## 👨‍💻 Developer

Built as part of an e-commerce full-stack development project.

---

**Note**: This application is currently in development. The backend infrastructure is complete, and frontend components are being implemented in phases.
