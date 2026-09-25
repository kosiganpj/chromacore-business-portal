# ChromaCore Business Portal

A runnable full-stack starter for ChromaCore Dyes & Chemicals.

Included:
- Public product catalogue
- Customer registration/login with JWT
- Customer dashboard
- Product CRUD
- Stock add/remove with stock movement history
- Automatic AVAILABLE / LOW_STOCK / OUT_OF_STOCK status
- Shade cards linked to products
- Customer orders
- Order status/tracking
- Invoice records
- Admin dashboard
- Email notification hook
- WhatsApp Cloud API notification hook
- PostgreSQL via Docker Compose

## Requirements

- Java 21+
- Maven 3.9+
- Node.js 20+
- Docker Desktop (recommended)

## Run PostgreSQL

```bash
docker compose up -d postgres
```

## Run backend

```bash
cd backend
mvn spring-boot:run
```

Backend:
http://localhost:8080

Default seeded admin:
- Email: admin@chromacore.local
- Password: Admin@12345

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:
http://localhost:5173

## Optional email

Set these environment variables before starting the backend:

MAIL_HOST
MAIL_PORT
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM

If MAIL_HOST is empty, email notifications are skipped and logged.

## Optional WhatsApp Cloud API

Set:

WHATSAPP_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_GRAPH_VERSION

If these are empty, WhatsApp notifications are skipped and logged.

## Important

This is a working development/MVP foundation, not a production deployment. Before using it with real customers:
- change the JWT secret
- change the default admin password
- configure HTTPS
- configure real email/WhatsApp credentials
- add production backups
- add audit/security hardening
- configure a real domain and object storage
- have GST/invoice compliance reviewed for your actual business process
