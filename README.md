# 🏏 BatBazaar

> A full-stack cricket equipment e-commerce platform with a customer storefront, REST API backend, and a separate admin dashboard.

🌐 **Live:** 
- Admin: https://bat-bazaar-8k7d.vercel.app/
- frontend: https://bat-bazaar-vec7.vercel.app/     
- backend: https://bat-bazaar.vercel.app/

---

## 📁 Project Structure

```
BatBazaar/
├── Cricket-frontend/   # Customer-facing React storefront
├── Cricket-Admin/      # Admin dashboard (React)
└── Cricket-backend/    # Node.js / Express REST API
```

---

## ✨ Features

### 🛍️ Customer Storefront
- Browse cricket equipment — bats, helmets, gloves, bags, stumps & kits
- Product detail pages with pricing and stock info
- Add to cart (guest + authenticated users)
- Checkout with delivery address selection and validation
- Multiple payment options — Card, Net Banking, Cash on Delivery
- Gift card / promo code support
- Order placement and confirmation
- User profile with saved addresses (set default, add/remove)
- JWT-based authentication (register / login)

### 🖥️ Admin Dashboard
- Secure admin login (JWT-protected)
- Dashboard overview — revenue, orders, products, active users
- Recent orders with live status pills
- Low stock alerts
- Quick actions — add product, manage orders, analytics
- Refresh dashboard data on demand

### ⚙️ Backend API
- RESTful API built with Node.js + Express
- JWT authentication for both users and admins
- Cart management (add, update, clear)
- Order creation and management
- Address CRUD with default address support
- Product and inventory management
- Admin-specific routes with role-based access

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Icons | Lucide React |
| Backend | Node.js, Express |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/Tanisha-b3/BatBazaar.git
cd BatBazaar
```

### 2. Backend

```bash
cd Cricket-backend
npm install
```

Create a `.env` file:

```env
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_ADMIN_SECRET=your_admin_jwt_secret
DATABASE_URL=your_database_url
```

```bash
npm run dev
```

### 3. Frontend (Customer)

```bash
cd Cricket-frontend
npm install
npm run dev
```

Create a `src/config.ts` file:

```ts
export const API_URL = 'http://localhost:5000';
```

### 4. Admin Dashboard

```bash
cd Cricket-Admin
npm install
npm run dev
```

Uses the same `API_URL` config pointing to the backend.

---

## 📦 Key Pages

| Route | Description |
|---|---|
| `/` | Home / product listing |
| `/products` | Browse all products |
| `/products/:id` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Checkout with address & payment |
| `/profile` | User profile & saved addresses |
| `/orders` | Order history |
| `/login` | User login |
| `/register` | User registration |

### Admin Routes
| Route | Description |
|---|---|
| `/` | Dashboard overview |
| `/products` | Product management |
| `/orders` | Order management |
| `/analytics` | Sales analytics |

---

## 🔐 Authentication

- Customers authenticate via `/api/auth/login` and `/api/auth/register.`
- Admins authenticate via `/api/admin/auth/login.`
- Tokens are stored in `localStorage` and sent as `Bearer` tokens on every protected request
- 401 responses clear the token and redirect to login

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 👩‍💻 Author

**Tanisha Borana** — [@Tanisha-b3](https://github.com/Tanisha-b3)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
