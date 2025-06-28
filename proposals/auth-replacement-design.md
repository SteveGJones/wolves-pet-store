# Authentication System Replacement Design (Revised)

## Overview

This document outlines the plan to replace the current Replit OpenID Connect authentication system with a traditional username/password authentication system. This revision incorporates feedback to improve security and scalability.

## Requirements Summary

- **Password Requirements**: Minimum 8 characters with at least one special character.
- **Registration**: Open registration for all users.
- **Initial Admin**: A secure method for creating the initial administrator account.
- **User Identity**: Email address as the unique identifier for login, but a separate UUID for the primary key.
- **Email Verification**: Skipped for the initial implementation, but noted as a future enhancement.

## Current System Analysis

### Existing Auth Flow
1. User clicks login → redirects to Replit OAuth.
2. Replit returns user claims (sub, email, firstName, lastName, profileImageUrl).
3. User stored in database with Replit `sub` as ID.
4. Session managed via PostgreSQL session store.
5. Routes protected via `isAuthenticated` middleware checking `req.user.claims.sub`.

### Dependencies to Remove
- `openid-client` package
- `passport` and `openid-client/passport`
- Replit-specific environment variables (REPLIT_DOMAINS, ISSUER_URL, REPL_ID)

### Infrastructure to Keep
- PostgreSQL session store (`connect-pg-simple`)
- Session management configuration
- Existing `sessions` table schema

## New System Design

### 1. Database Schema Changes

#### Modified Users Table
The `users` table will be modified to use a UUID as the primary key for better data integrity and to decouple it from the user's email address.

```typescript
import { v4 as uuidv4 } from 'uuid';

export const users = pgTable("users", {
  id: varchar("id").primaryKey().$defaultFn(() => uuidv4()), // UUID primary key
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // bcrypt hash
  displayName: varchar("display_name"), // User's preferred name
  firstName: varchar("first_name"), // Optional
  lastName: varchar("last_name"), // Optional
  profileImageUrl: varchar("profile_image_url"), // Optional
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

#### Migration Strategy
1.  Add new columns (`password`, `displayName`) as nullable.
2.  Modify the `id` column to be a UUID.
3.  Update existing code to handle both old and new auth.
4.  Remove old Replit-specific columns after migration.
5.  Make the `password` column non-nullable.

### 2. Backend Implementation

#### New Dependencies
```json
{
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.6",
  "uuid": "^9.0.1",
  "@types/uuid": "^9.0.8"
}
```

#### Password Security
- Use `bcrypt` with a salt round of 12 for hashing.
- Validate password requirements on registration.

#### New Auth Module (`server/auth.ts`)
This module will contain all authentication-related logic.

#### API Endpoints
The following API endpoints will be implemented with detailed specifications:

**POST /api/auth/register**
```typescript
// Request
interface RegisterRequest {
  email: string;           // Valid email format
  password: string;        // Min 8 chars, 1 special char
  displayName?: string;    // Optional preferred name
  firstName?: string;      // Optional first name
  lastName?: string;       // Optional last name
}

// Response (201 Created)
interface AuthResponse {
  user: {
    id: string;            // UUID
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    isAdmin: boolean;
    createdAt: string;     // ISO timestamp
  }
}

// Error Responses
// 400: { error: "Invalid email format", code: "INVALID_EMAIL" }
// 400: { error: "Password does not meet requirements", code: "WEAK_PASSWORD" }
// 409: { error: "An account with this email already exists", code: "EMAIL_EXISTS" }
```

**POST /api/auth/login**
```typescript
// Request
interface LoginRequest {
  email: string;
  password: string;
}

// Response (200 OK)
interface AuthResponse {
  user: {
    id: string;            // UUID
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    isAdmin: boolean;
  }
}

// Error Responses
// 400: { error: "Email and password are required", code: "MISSING_CREDENTIALS" }
// 401: { error: "Invalid email or password", code: "INVALID_CREDENTIALS" }
// 429: { error: "Too many login attempts", code: "RATE_LIMITED" }
```

**POST /api/auth/logout**
```typescript
// Request: No body required

// Response (200 OK)
interface LogoutResponse {
  success: true;
  message: "Logged out successfully";
}

// Error Responses
// 401: { error: "Not authenticated", code: "NOT_AUTHENTICATED" }
```

**GET /api/auth/user**
```typescript
// Request: No body required (uses session)

// Response (200 OK)
interface CurrentUserResponse {
  user: {
    id: string;            // UUID
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    isAdmin: boolean;
  }
}

// Error Responses
// 401: { error: "Not authenticated", code: "NOT_AUTHENTICATED" }
```

#### Session Management
The existing PostgreSQL session store will be used with a simplified session data structure:

```typescript
// Session data structure
interface SessionData {
  userId: string;       // UUID reference to users table
  isAdmin: boolean;     // Cached for middleware efficiency
  email: string;        // For display and logging purposes
}

// Session storage approach
- Store minimal data in session for performance
- Use userId to fetch full user details when needed
- Keep isAdmin cached for quick authorization checks
- Session timeout: 7 days (unchanged from current setup)
```

### 3. Frontend Implementation

The frontend will be updated with new components for login and registration, and the `useAuth` hook will be modified to work with the new authentication system.

### 4. Implementation Plan

#### Phase 1: Database Migration
1.  Create a migration script to update the `users` table schema.
2.  Test the migration in a development environment.

#### Phase 2: Backend Auth System
1.  Install new dependencies (`bcrypt`, `uuid`).
2.  Implement the `server/auth.ts` module.
3.  Create the new authentication API endpoints.

#### Phase 3: Frontend Auth Components
1.  Create login and registration forms.
2.  Update routing and the `useAuth` hook.

#### Phase 4: Data Migration & Seeding
1.  **Admin User Creation:** Create a separate, one-off script (`scripts/create-admin.ts`) to create the initial admin user. This script will take an email and password as arguments. This is more secure than hardcoding credentials.
2.  Handle existing user data if necessary.

### Admin Script Specification

#### `scripts/create-admin.ts`
A secure command-line script to create the initial administrator account.

**Usage:**
```bash
# Interactive mode (prompts for password)
npm run create-admin -- --email admin@company.com

# Command line mode (for automation)
npm run create-admin -- --email admin@company.com --password "SecurePass123!"

# With additional user details
npm run create-admin -- --email admin@company.com --display-name "System Admin" --first-name "Admin" --last-name "User"
```

**Script Features:**
- ✅ **Password validation**: Enforces 8+ characters with special character requirement
- ✅ **Email validation**: Validates email format before creation
- ✅ **Interactive mode**: Prompts for password securely (hidden input) when not provided
- ✅ **Duplicate prevention**: Checks if admin user already exists
- ✅ **Error handling**: Clear error messages for common issues
- ✅ **Database connectivity**: Validates database connection before attempting creation

**Implementation Structure:**
```typescript
// scripts/create-admin.ts
interface CreateAdminOptions {
  email: string;
  password?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

// Functions to implement:
- validateEmail(email: string): boolean
- validatePassword(password: string): boolean
- promptForPassword(): Promise<string>
- createAdminUser(options: CreateAdminOptions): Promise<void>
- checkExistingAdmin(email: string): Promise<boolean>
```

**Package.json Script:**
```json
{
  "scripts": {
    "create-admin": "tsx scripts/create-admin.ts"
  }
}
```

**Security Considerations:**
- Password input is hidden when prompted interactively
- No password logging or storing in shell history
- Validates all inputs before database operations
- Uses same password hashing as main application (bcrypt, 12 rounds)
- Clear success/failure messages without exposing sensitive data

**Error Handling:**
```typescript
// Example error cases
- Database connection failure
- Invalid email format
- Weak password (doesn't meet requirements)
- User already exists
- Database write errors
```

#### Phase 5: Cleanup
1.  Remove Replit authentication dependencies and code.
2.  Update documentation.

### 5. Security Considerations

#### Password Security
- `bcrypt` with 12 rounds.
- Enforce password complexity on both frontend and backend.

#### Session Security
- `HttpOnly` cookies.
- `Secure` flag in production.
- CSRF protection via `SameSite` cookies.

#### Input Validation
- Use `zod` for input validation on all authentication endpoints.

#### Error Handling
- Implement specific error codes and messages for authentication failures:
    - `400 Bad Request`: "Invalid email format" or "Password does not meet requirements."
    - `401 Unauthorized`: "Invalid email or password."
    - `409 Conflict`: "An account with this email already exists."

### 6. Future Enhancements

#### Password Reset
A password reset feature is a critical component of a production application. This will be implemented in a future phase and will involve:
1.  A "Forgot Password" link on the login page.
2.  An API endpoint to request a password reset token.
3.  Sending an email to the user with a time-sensitive reset link.
4.  A form to enter a new password.

### 7. Testing Strategy

-   **Unit Tests:** For password hashing, validation, and other utility functions.
-   **Integration Tests:** For the complete authentication flow (register, login, logout).
-   **End-to-End Tests:** To simulate user interaction with the authentication system.

### 8. Rollback Plan

-   The phased implementation allows for easier rollbacks.
-   A feature flag can be used to switch between the old and new authentication systems during the transition.

### 9. Documentation Updates

-   Update `CLAUDE.md` and `README.md` to reflect the new authentication system.

### 10. Success Criteria

-   [ ] User can register with an email and password.
-   [ ] User can log in with their credentials.
-   [ ] A secure method for creating an admin user is in place.
-   [ ] The system uses UUIDs for user primary keys.
-   [ ] All existing functionality works with the new authentication system.
