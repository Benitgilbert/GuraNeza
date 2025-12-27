# PROJECT MASTER BRIEF: GuraNeza - Multi-Vendor E-Commerce Platform

## 1. Project Overview & Objective
**Build a full-stack multi-vendor e-commerce application named GuraNeza where:**
*   **Customers:** Browse products, manage a multi-seller cart, place orders, and pay via MoMo/Stripe.
*   **Sellers:** Register, manage their own inventory (CRUD), and fulfill their items within orders.
*   **Admins:** Full system oversight, user/seller management, and global product/order control.

**Stack:** Node.js (Express), React (Pure CSS), Mongoose (MongoDB Atlas).

## 2. Technical Logic & AI Constraints (CRITICAL)
*   **Multi-Vendor Partitioning:**
    *   Products MUST have a `sellerId`.
    *   Orders are global documents, but `OrderItems` must store the `sellerId` and `priceAtPurchase`.
*   **Seller Isolation & Logic:**
    *   Sellers see only the specific items they sold within a shared order.
*   **Inactive/Blocked Sellers:**
    *   Cannot manage products.
    *   Their products must be hidden/disabled from the public.
*   **Identity & Security:**
    *   **Auth:** JWT-based. Google OAuth logic (find or create record).
    *   **Validation:** Strict email format and password strength validation.
    *   **OTP:** 6-digit numeric, 10-minute expiry for password resets.
    *   **Deactivation:** Blocked users cannot login or place orders.
*   **Review Logic:**
    *   **Verified Purchase Constraint:** Users can ONLY review products they have successfully purchased (Delivered status).

## 3. Mongoose Schema Definitions

### User / Seller Profile
*   **User:** `email` (unique), `password`, `role` (customer, seller, admin), `status` (active, blocked), `isVerified`, `otp: { code, expires }`, `googleId`.
*   **SellerProfile:** `userId`, `storeName`, `description`, `phone`, `logoUrl`, `approvalStatus` (pending, active, blocked).

### Product
*   **Fields:** `name`, `description`, `price`, `stock`, `category`, `imageUrl`, `sellerId` (Ref: User), `averageRating`.

### Order & Shipping
*   **Order:** `customerId`, `totalPrice` (includes subtotal + shipping fee), `paymentMethod` (MoMo, Card/PayPal), `paymentStatus` (PENDING, PAID, FAILED).
*   **Items:** `[{ productId, sellerId, quantity, priceAtPurchase }]`.
*   **Status:** PENDING, PAID, SHIPPED, DELIVERED, CANCELLED.
*   **Shipping:** `fullName`, `phone`, `city`, `addressLine`, `status` (NOT_SHIPPED, IN_TRANSIT, DELIVERED).

### Review
*   **Fields:** `productId`, `userId`, `rating` (1-5), `comment`.

## 4. Frontend & Styling (Pure CSS)
*   **Standard:** No frameworks (No Tailwind/Bootstrap). Use BEM, Variables, and Media Queries.
*   **Brand Identity:** GuraNeza should feature a clean, professional UI built with vanilla CSS.
*   **Product Details Page:** Must show product info, seller name, reviews list, and average rating.
*   **Related Products Section:** Display 3-6 items sharing the same category or seller.

## 5. Implementation Roadmap

### Phase 1: Identity & Admin Control
- [ ] Connect Mongoose to Atlas. Implement RBAC middleware.
- [ ] Auth: Signup/Login/Google + Password Reset (OTP).
- [ ] Admin: APIs to deactivate users and approve/block sellers.

### Phase 2: Multi-Seller Product Management
- [ ] Seller: Inventory CRUD (restricted to own products).
- [ ] Public: Product listing with Pagination and filters (Category, Search, Min/Max Price).
- [ ] Logic: Hide products belonging to blocked sellers.

### Phase 3: Cart & Order Flow
- [ ] Multi-seller Cart: Add/Update/Remove/Subtotal.
- [ ] Checkout: Form for shipping info, Shipping Fee rule application, and MoMo Sandbox/Stripe integration.
- [ ] Logic: Map Order Items to their respective sellers.

### Phase 4: Dashboards & Reviews
- [ ] Customer: Order history (with statuses) and Review management (Purchase check required).
- [ ] Seller: Dashboard showing only relevant products and orders.
- [ ] Admin: Dashboard for role management, user control, and order status updates.

## 6. General Requirements
*   **Code:** Clean naming, meaningful Git commits, user-friendly error messages.
*   **Documentation:** README.md with setup and default admin credentials for GuraNeza.
*   **Environment:** `.env` for DB, JWT secret, and MoMo/Stripe API keys.