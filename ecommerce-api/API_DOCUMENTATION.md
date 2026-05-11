# 🛒 E-Commerce API Documentation

Welcome to the **E-Commerce API** documentation. This API is built with NestJS and provides all the necessary endpoints for managing products, carts, orders, and user authentication.

---

## 🚀 Getting Started

### Base URL
- **Local Development**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:3000/api` (Interactive documentation)

### Authentication
Most endpoints require a **Bearer Token**. You can obtain this token by logging in.
- Header: `Authorization: Bearer <your_jwt_token>`

---

## 🔐 Authentication Module (`/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Create a new user account | No |
| `POST` | `/auth/login` | Login and receive a JWT token | No |
| `GET` | `/auth/profile` | Get currently logged-in user profile | Yes |
| `POST` | `/auth/forgot-password` | Send password reset email | No |
| `POST` | `/auth/reset-password` | Reset password using token | No |

### Request Bodies

#### Register
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## 📦 Products Module (`/products`)

| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/products` | Get all active products | No | - |
| `GET` | `/products/:id` | Get details of a single product | No | - |
| `GET` | `/products/search` | Search products (Query: `?keyword=...`) | No | - |
| `GET` | `/products/category/:cat` | Filter products by category | No | - |
| `POST` | `/products` | Create a new product | Yes | `admin` |
| `PATCH` | `/products/:id` | Update product partially | Yes | `admin` |
| `PUT` | `/products/:id` | Replace product entirely | Yes | `admin` |
| `DELETE` | `/products/:id` | Delete a product | Yes | `admin` |
| `POST` | `/products/:id/upload` | Upload product image (Field: `image`) | Yes | `admin` |

### Product Structure
```json
{
  "name": "Smartphone X",
  "description": "Latest flagship phone",
  "price": 999.99,
  "stock": 50,
  "category": "Electronics",
  "isActive": true
}
```

---

## 🛒 Cart Module (`/cart`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart/my` | Get current user's shopping cart | Yes |
| `POST` | `/cart` | Add an item to the cart | Yes |
| `DELETE` | `/cart/:id` | Remove an item from the cart (using item ID) | Yes |

### Add to Cart Body
```json
{
  "productId": 1,
  "quantity": 2
}
```

---

## 📜 Orders Module (`/orders`)

| Method | Endpoint | Description | Auth Required | Roles |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Place an order from the cart | Yes | - |
| `GET` | `/orders/my` | View all orders of the logged-in user | Yes | - |
| `PATCH` | `/orders/:id/status` | Update order status | Yes | `admin` |

### Order Status Update Body
```json
{
  "status": "shipped" 
}
```
*(Status options: `pending`, `shipped`, `delivered`)*

---

## 🖼️ Media & Static Files
All uploaded product images are served under the `/uploads` prefix.
Example: `http://localhost:3000/uploads/product-image-123.jpg`

---

## 🛠️ Tech Stack
- **Framework**: NestJS
- **Database**: PostgreSQL (TypeORM)
- **Validation**: class-validator
- **Security**: Passport JWT, Bcrypt
- **Documentation**: Swagger
