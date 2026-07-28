# Architecture Documentation

## High-Level Architecture

The system follows a modular, layered architecture:

- Frontend client for users and admins
- Backend API server for business logic
- PostgreSQL database for persistent data
- Integration services for authentication, payments, media, and notifications

## Request Flow

```text
Client -> API Gateway / Backend Router -> Auth / Modules -> Prisma -> PostgreSQL
                                  -> Payment Service
                                  -> Notification Service
                                  -> Storage Service
```

## Authentication Flow

```text
User submits credentials or OAuth token
-> Auth module validates input
-> JWT access token and refresh token issued
-> Protected routes verify access token via guards
-> Refresh token endpoint rotates session tokens when needed
```

## Backend Module Design

The backend should follow a layered structure for production readiness:

```text
Controller
  -> Service
  -> Repository
  -> Prisma
```

This keeps business logic in services while isolating persistence concerns in repositories.

### Auth Module
Handles login, registration, password reset, OAuth, and token issuance.

Suggested structure:

```text
auth/
├── auth.controller.ts
├── auth.service.ts
├── auth.repository.ts
```

### User Module
Manages customer profile data and account settings.

### Helper Module
Handles helper onboarding, profile updates, verification, and documents.

### Service Module
Manages service listings, categories, pricing, and availability.

### Booking Module
Manages service requests, booking states, confirmations, and cancellations.

### Payment Module
Integrates with Razorpay and tracks payment states.

### Review Module
Supports customer feedback and ratings.

### Notification Module
Sends email, push, or SMS notifications based on events.

### Upload Module
Handles image and document uploads to cloud storage.

### Support Module
Supports admin and customer ticket management.

### Admin Module
Provides dashboards and operations for moderation and reporting.

## Frontend Responsibilities

- Render pages for customers, helpers, and admins
- Manage client-side state with TanStack Query and React context
- Call backend APIs through Axios or fetch wrappers
- Handle forms, routing, and UI animation

## Backend Responsibilities

- Enforce validation and authentication
- Protect user and payment operations
- Expose documented REST endpoints via Swagger
- Centralize business rules and integrations
- Keep persistence logic inside repositories for better separation of concerns
- Keep services focused on orchestration and business rules

## Scalability Considerations

- Use modular services and dependency injection
- Add queue-based background jobs for notifications and processing
- Cache frequently queried content with Redis
- Separate read-heavy endpoints where necessary
- Use environment-based configuration for secrets and deployment

## Deployment Topology

```text
Users -> Frontend (React/Vite) -> API (NestJS) -> Prisma -> PostgreSQL
                                      -> Razorpay / Google OAuth / Firebase / Cloud Storage
```

## Typical Request Sequence

```text
1. Customer logs in or signs up.
2. Frontend calls the auth endpoint and receives JWTs.
3. The customer browses services and creates a booking.
4. The backend validates the booking and stores it in PostgreSQL.
5. Payment is initiated through Razorpay.
6. Notifications are emitted to the customer and helper after booking/payment updates.
```
