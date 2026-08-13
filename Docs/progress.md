# Password / Reset Flow Test Run

Date: 2026-08-13

Summary
- Ran an end-to-end set of curl tests against the local backend at `http://localhost:3000/api/auth` to validate password validation, registration, login, forgot-password and reset-password flows.

Environment
- Backend running locally (started with `npm run start:dev` in `backend`).
- Database/email not configured for SMTP; OTPs are emitted to server logs (dev behavior).

Key commands used (examples)

Register (valid):
```
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"curltest1@example.com","firstName":"Curl","lastName":"Tester","password":"StrongPass123!"}'
```

Forgot password (initiate):
```
curl -i -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"curltest1@example.com"}'
```

Reset password (using OTP observed in server log):
```
curl -i -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"603818","password":"NewStrong1!"}'
```

Results (selected)
- Registration with `StrongPass123!`: 201 Created — registration succeeded.
- Registration with too-short or weak passwords: 400 Bad Request (class-validator / `IsStrongPassword`).
- Registration with forbidden characters (e.g., `;`): 400 Bad Request — rejected by `PasswordService` ("Password contains forbidden database-related symbols").
- Registration with long repeated-character runs (>32): 400 Bad Request — rejected by `PasswordService` ("Password contains an excessively long repeated character sequence").
- Login with `NewStrong1!` (after reset): 200 OK — returned access/refresh tokens.
- Login with old password after reset: 401 Unauthorized — old password invalidated.
- Forgot-password endpoint returns 200 OK and logs OTP to server in dev mode.

Notes
- Password validation is enforced at two layers:
  - DTO-level: `IsStrongPassword` (class-validator) for strength requirements.
  - Service-level: `PasswordService.validatePassword()` checks length (8–128), control characters, forbidden DB-related symbols, and long repeated runs.
- Because email/DB SMTP are not configured, the OTP used in this run was copied from server logs (user-provided) and used directly to complete the reset flow.

Next steps
- Optional: add an automated test script in `backend/scripts/` to run these curl tests and assert results.
- Optional: configure SMTP and database for production-like testing.

Recorded by: Test run performed on local machine; see server console for OTPs in dev mode.
