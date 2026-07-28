# Helpers Platform Documentation

## Executive Summary

Helpers is an enterprise-ready marketplace platform for connecting customers with verified local helpers across home, business, and personal services. The platform is designed to support secure onboarding, service discovery, booking operations, payments, reviews, notifications, and admin oversight in a modular and scalable architecture.

## Product Scope

The platform covers the following core business workflows:

- Customer registration, authentication, and profile management
- Helper onboarding, verification, and profile management
- Service catalog creation and discovery
- Booking request lifecycle management
- Secure payment processing and payment history
- Review and rating flows
- Notification delivery and support communication
- Admin dashboard and reporting operations

## Business Goals

- Reduce friction in finding and booking trusted local services
- Provide helpers with a reliable operational dashboard
- Offer secure and auditable payment handling
- Enable future expansion into premium services, subscriptions, and marketplace analytics

## Recommended Tech Stack

### Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- Framer Motion

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis (recommended for caching and session support)

### Why NestJS

- Strong enterprise-oriented architecture
- Dependency Injection and modular development
- Guard and interceptor-based auth flows
- Built-in validation and robust DTOs
- Swagger/OpenAPI support for API documentation
- Excellent path for scaling and team-based development

## External Integrations

- Google OAuth for social sign-in
- Firebase Cloud Messaging for push notifications
- Razorpay for online payments and UPI/card support
- Google Cloud Storage or Cloudinary for media uploads
- SMTP-based email delivery
- Optional SMS gateway for OTP or booking alerts

## System Architecture

The application is composed of the following layers:

- Client application for customers, helpers, and admins
- API server with modular domain services
- PostgreSQL database managed through Prisma
- External cloud and payment services for authentication, messaging, media, and transactions

## Module Map

- Auth Module
- User Module
- Helper Module
- Service Module
- Category Module
- Booking Module
- Payment Module
- Review Module
- Notification Module
- Upload Module
- Support Module
- Admin Module

## Documentation Map

- API reference: [Docs/API.md](API.md)
- Database design: [Docs/DATABASE.md](DATABASE.md)
- Deployment guide: [Docs/DEPLOYMENT.md](DEPLOYMENT.md)
- Architecture overview: [Docs/ARCHITECTURE.md](ARCHITECTURE.md)
- Contribution guide: [Docs/CONTRIBUTING.md](CONTRIBUTING.md)
- Security policy: [Docs/SECURITY.md](SECURITY.md)
- Testing strategy: [Docs/TESTING.md](TESTING.md)
- Product roadmap: [Docs/ROADMAP.md](ROADMAP.md)

## Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RAZORPAY_KEY=
RAZORPAY_SECRET=
SMTP_USER=
SMTP_PASS=
FIREBASE_CONFIG=
CLOUDINARY_URL=
```

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or pnpm

### Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### Run locally

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

### Database setup

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

## Deployment Targets

### Frontend

- Firebase Hosting
- Cloudflare Pages

### Backend

- Google Cloud Run
- Railway

### Database

- Supabase PostgreSQL
- Neon PostgreSQL

## CI/CD Flow

```text
GitHub -> GitHub Actions -> Build/Test -> Deploy Backend -> Deploy Frontend
```

## Recommended Next Steps

1. Finalize the Prisma schema and domain model.
2. Implement authentication and role-based authorization.
3. Deliver core CRUD modules for users, helpers, services, and bookings.
4. Add Swagger/OpenAPI documentation and automated API validation.
5. Configure CI/CD and production secrets management.
