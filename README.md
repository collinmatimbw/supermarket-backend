# 🛒 SKYC CRM — Supermarket Management System

A professional, full-stack Supermarket CRM built with **React + Tailwind CSS** (frontend) and **Node.js + Express** (backend), using **Excel (.xlsx)** files for local data storage.

---

## 📁 Project Structure

```
supermarket-crm/
├── backend/
│   ├── helpers/
│   │   └── excel.js          # Excel read/write helpers + sample data
│   ├── routes/
│   │   ├── products.js       # Products CRUD API
│   │   ├── sales.js          # Sales API + analytics
│   │   ├── customers.js      # Customers CRUD API
│   │   └── settings.js       # Export, clear, system info
│   ├── server.js             # Express server entry point
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   └── PageHeader.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Sales.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Settings.jsx
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── excel/                    # Auto-created on first run
│   ├── products.xlsx
│   ├── sales.xlsx
│   └── customers.xlsx
└── README.md
```

---

## 🚀 Quick Setup

### Prerequisites
- **Node.js** v16+ ([nodejs.org](https://nodejs.org))
- **npm** v8+

### Step 1 — Install Backend Dependencies
```bash
cd supermarket-crm/backend
npm install
```

### Step 2 — Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 3 — Start the Backend
```bash
cd ../backend
npm run dev
# Backend runs on http://localhost:5000
```

### Step 4 — Start the Frontend (new terminal)
```bash
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## 📊 Features

| Page | Features |
|------|----------|
| **Dashboard** | KPI cards, revenue chart, category donut, low stock alerts, recent sales |
| **Products** | Add/edit/delete, search, category filter, low stock warnings, margin preview |
| **Sales** | Record sale, auto-calculate total, receipt modal, print receipt, history table |
| **Customers** | Add/edit/delete customers, search, profile avatars |
| **Analytics** | Revenue trend, top products bar chart, category breakdown, KPI metrics |
| **Settings** | Export Excel backup, clear sales, system info |

## 🗃️ Excel Files

Data is stored in `excel/` folder:

| File | Contents |
|------|----------|
| `products.xlsx` | id, name, category, buyingPrice, sellingPrice, quantity, barcode, supplier, dateAdded |
| `sales.xlsx` | id, productId, productName, quantity, price, total, date, customerId, customerName |
| `customers.xlsx` | id, name, phone, email, address, dateAdded |

Files are **auto-created with sample data** on first server start.

## 🔌 API Endpoints

```
GET    /api/products           — List all products
POST   /api/products           — Add product
PUT    /api/products/:id       — Update product
DELETE /api/products/:id       — Delete product

GET    /api/sales              — List all sales
POST   /api/sales              — Record sale (auto-reduces stock)
DELETE /api/sales/:id          — Delete sale
GET    /api/sales/analytics    — Analytics data

GET    /api/customers          — List customers
POST   /api/customers          — Add customer
PUT    /api/customers/:id      — Update customer
DELETE /api/customers/:id      — Delete customer

GET    /api/settings/export    — Download Excel backup
DELETE /api/settings/sales     — Clear sales history
GET    /api/settings/info      — System information
```

## 💡 Tech Stack

- **Frontend**: React 18, Tailwind CSS, Chart.js, Axios, React Router, react-hot-toast, Lucide Icons
- **Backend**: Node.js, Express, xlsx, cors, uuid, nodemon
- **Storage**: Local Excel (.xlsx) files
- **Fonts**: Sora (Google Fonts)
