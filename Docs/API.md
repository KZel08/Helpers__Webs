# API Documentation

## Base URL

```text
Development: http://localhost:3000
Production: https://api.yourdomain.com
```

## Authentication

The platform uses JWT access tokens and refresh tokens.

### Authentication Flow

1. Register or login with email/password or Google OAuth.
2. Receive access and refresh tokens.
3. Attach the access token to the `Authorization: Bearer <token>` header.
4. Use the refresh token endpoint to rotate tokens when needed.

### Token Response Example

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "user": {
    "id": "user_123",
    "email": "customer@example.com",
    "role": "customer"
  }
}
```

## Auth Endpoints

### Register

```http
POST /auth/register
Content-Type: application/json
```

```json
{
  "name": "Aisha Khan",
  "email": "aisha@example.com",
  "password": "StrongPass123!",
  "role": "customer"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "aisha@example.com",
  "password": "StrongPass123!"
}
```

### Google OAuth

```http
POST /auth/google
Content-Type: application/json
```

```json
{
  "token": "google-id-token"
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "..."
}
```

### Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "aisha@example.com"
}
```

### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json
```

```json
{
  "token": "reset-token",
  "password": "NewStrongPass123!"
}
```

## User Endpoints

### Get current user

```http
GET /users/me
Authorization: Bearer <access_token>
```

### Update profile

```http
PUT /users/profile
Authorization: Bearer <access_token>
```

### Delete user

```http
DELETE /users
Authorization: Bearer <access_token>
```

## Helper Endpoints

### List helpers

```http
GET /helpers
```

### Get helper profile

```http
GET /helpers/:id
```

### Update helper profile

```http
PUT /helpers/profile
Authorization: Bearer <access_token>
```

### Upload helper documents

```http
POST /helpers/documents
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

## Service Endpoints

### List services

```http
GET /services
```

### Get service by ID

```http
GET /services/:id
```

### Create service

```http
POST /services
Authorization: Bearer <access_token>
```

### Update service

```http
PUT /services/:id
Authorization: Bearer <access_token>
```

### Delete service

```http
DELETE /services/:id
Authorization: Bearer <access_token>
```

## Booking Endpoints

### Create booking

```http
POST /bookings
Authorization: Bearer <access_token>
```

### List bookings

```http
GET /bookings
Authorization: Bearer <access_token>
```

### Update booking

```http
PUT /bookings/:id
Authorization: Bearer <access_token>
```

### Delete booking

```http
DELETE /bookings/:id
Authorization: Bearer <access_token>
```

## Review Endpoints

### Create review

```http
POST /reviews
Authorization: Bearer <access_token>
```

### Get reviews for a helper

```http
GET /reviews/:helperId
```

## Payment Endpoints

### Create payment order

```http
POST /payments/create
Authorization: Bearer <access_token>
```

### Verify payment

```http
POST /payments/verify
Authorization: Bearer <access_token>
```

### Payment history

```http
GET /payments/history
Authorization: Bearer <access_token>
```

## Notification Endpoints

### List notifications

```http
GET /notifications
Authorization: Bearer <access_token>
```

### Mark notifications as read

```http
PUT /notifications/read
Authorization: Bearer <access_token>
```

## Standard Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

## Error Codes

| Code | Meaning |
| --- | --- |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict |
| 422 | Validation error |
| 500 | Internal server error |

## Recommended API Conventions

- Use plural resource names for endpoints.
- Return consistent JSON envelopes.
- Use HTTP status codes correctly.
- Validate all incoming requests with DTOs.
- Protect sensitive operations with role guards.

## Detailed Endpoint Contract Summary

### Authentication

| Endpoint | Method | Auth | Purpose |
| --- | --- | --- | --- |
| /auth/register | POST | No | Create a new account |
| /auth/login | POST | No | Authenticate with email/password |
| /auth/google | POST | No | Authenticate using Google OAuth |
| /auth/logout | POST | Yes | Revoke current session |
| /auth/refresh | POST | No | Refresh access token |
| /auth/forgot-password | POST | No | Start password reset |
| /auth/reset-password | POST | No | Complete password reset |

### Resource Endpoints

| Resource | Endpoint | Method | Notes |
| --- | --- | --- | --- |
| Current user | /users/me | GET | Returns authenticated user profile |
| Update profile | /users/profile | PUT | Supports profile edits |
| Helpers | /helpers | GET | Lists verified helpers |
| Helper detail | /helpers/:id | GET | Returns helper profile |
| Services | /services | GET/POST | Supports listing and creation |
| Service detail | /services/:id | GET/PUT/DELETE | Full CRUD for service ownership |
| Bookings | /bookings | GET/POST | Customer and helper booking operations |
| Booking detail | /bookings/:id | PUT/DELETE | Update or cancel booking |
| Reviews | /reviews | POST | Create review after completed booking |
| Payments | /payments/create | POST | Create Razorpay order |
| Payments verify | /payments/verify | POST | Verify payment response |
| Notifications | /notifications | GET | Retrieve unread and read notifications |

## Example Success Response

```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "id": "srv_001",
    "title": "Deep Cleaning",
    "price": 1200,
    "status": "active"
  }
}
```

## Example Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      "email is required"
    ]
  }
}
```

## Security Notes

- Always use HTTPS in production.
- Never expose refresh tokens in client-side storage without secure handling.
- Apply role-based guards to admin-only routes.
- Validate uploaded documents and file types before storage.
