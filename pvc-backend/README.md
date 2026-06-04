# PVC Distributor Admin — Node.js Backend

REST API for the PVC raw material distributor admin system.
Built with **Node.js 20 + Express 4 + Knex + PostgreSQL + Redis + JWT**.

---

## Stack

| Layer          | Technology                           |
|----------------|--------------------------------------|
| Runtime        | Node.js 20 LTS                       |
| Framework      | Express 4.x                          |
| Database       | **PostgreSQL 14+** via `pg` + Knex   |
| Query Builder  | Knex.js (no ORM, no Mongoose, no MongoDB) |
| Auth           | JWT (access 15min + refresh 7d cookie) |
| Cache          | Redis (permission cache)             |
| Validation     | Joi                                  |
| Logging        | Winston + Morgan                     |
| File Upload    | Multer                               |
| PDF            | pdfkit                               |
| Scheduling     | node-cron                            |

---

## Quick Start

```bash
# 1. Clone / unzip project
cd pvc-backend

# 2. Install dependencies
npm install

# 3. Create and fill .env
cp .env.example .env
# Fill in DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET

# 4. Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE pvc_admin;"

# 5. Run migrations  (creates all 42 tables)
npm run migrate

# 6. Seed default roles, modules, permissions, admin user
npm run seed

# 7. Start development server
npm run dev
# → http://localhost:4000
# → Health: http://localhost:4000/health
# → API:    http://localhost:4000/api/v1
```

---

## Default Admin Credentials

```
Email:    admin@pvcdistributor.com
Password: admin123
```

Change this immediately in production.

---

## Environment Variables

Copy `.env.example` → `.env` and fill in all values.
The minimum required to start:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=pvc_admin
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=min_64_char_random_string
JWT_REFRESH_SECRET=different_min_64_char_random_string
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Project Structure

```
src/
  app.js                      Express app setup + all middleware
  server.js                   HTTP server entry + graceful shutdown
  config/
    db.js                     PostgreSQL connection (Knex singleton)
    knexfile.js               Knex config for dev/test/production
    redis.js                  Redis client (non-fatal if unavailable)
    logger.js                 Winston logger
    migrations/
      001_rbac.js             RBAC tables (users, roles, permissions)
      002_business_tables.js  All 35 business tables
    seeds/
      001_seed_rbac.js        Default roles + admin user
  middleware/
    auth.js                   JWT verify → req.user
    rbac.js                   Permission check (module.action)
    validate.js               Joi schema wrapper
    auditLog.js               Auto-writes audit_logs on mutations
    errorHandler.js           Global error handler + PG constraint errors
  routes/                     One file per resource (28 files)
  controllers/                One file per resource (28 files)
  services/
    permissions.service.js    Load + cache user permissions (Redis)
  validators/                 Joi schemas per resource
  utils/
    AppError.js               Custom error class
    response.js               Standard response helpers
    crons.js                  Scheduled alerts (low stock, overdue, cheques)
    crudRouter.js             Generic CRUD router factory
```

---

## API Overview

Base URL: `http://localhost:4000/api/v1`

| Module              | Endpoints   | Permission Module  |
|---------------------|-------------|--------------------|
| Auth                | 8           | Public / Auth      |
| Users & Roles       | 17          | users.*            |
| Inventory           | 21          | inventory.*        |
| Suppliers & POs     | 21          | suppliers.*        |
| Customers           | 22          | customers.*        |
| Sales Orders        | 12          | sales_orders.*     |
| Quotations          | 8           | sales_orders.*     |
| Delivery            | 17          | delivery.*         |
| Invoices            | 12          | invoices.*         |
| Credit Notes        | 6           | invoices.*         |
| Payments            | 10          | payments.*         |
| Dashboard           | 6           | (all auth users)   |
| Reports             | 14          | reports.*          |
| Notifications       | 5           | (all auth users)   |
| Audit Logs          | 3           | users.*            |
| **Total**           | **~182**    |                    |

---

## Authentication Flow

```
POST /api/v1/auth/login
  → { token: "eyJ...", user: { id, name, email, roles[], permissions[] } }
  → Sets HTTP-only refreshToken cookie (7 days)

All protected routes: Authorization: Bearer <token>

POST /api/v1/auth/refresh
  → Uses refreshToken cookie → returns new access token

POST /api/v1/auth/logout
  → Clears cookie
```

---

## RBAC

Permissions are strings in the format `module.action`, e.g. `inventory.view`, `sales_orders.create`.

Route protection example:
```js
router.post('/', auth, rbac('sales_orders', 'create'), validate(schema), controller);
```

Admin role bypasses all permission checks.

---

## Database

- **PostgreSQL 14+** only. No MongoDB, no Mongoose, no SQLite.
- All queries use **Knex.js** query builder.
- Stock is event-sourced via `stock_ledger` (append-only). Current qty = `SUM(qty_change)`.
- All master tables have `deleted_at` for soft delete.
- All tables have `ip_address`, `mac_address`, `created_by`, `updated_by`.
- Monetary values: `DECIMAL(15,2)`. Quantities: `DECIMAL(10,3)`.

---

## npm Scripts

```bash
npm run dev           # nodemon hot-reload development server
npm start             # production start
npm run migrate       # run pending migrations
npm run migrate:rollback  # rollback last migration batch
npm run seed          # run seed files
```

---

## Default Roles

| Role            | Access                                              |
|-----------------|-----------------------------------------------------|
| Admin           | Full access, bypasses all RBAC checks               |
| Sales Staff     | Customers, quotations, sales orders, view inventory |
| Warehouse Staff | Full inventory, delivery; view sales                |
| Accountant      | Invoices, payments, reports                         |
| Viewer          | View-only on all modules                            |
