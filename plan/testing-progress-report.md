# Testing Progress Report

## Overview

The primary goal is to enhance the unit and integration testing coverage for the Wolves Pet Store application, focusing on both client-side components and server-side API routes.

## Work Completed

### 1. Client-Side Component Testing Setup
-   **Tooling**: Configured `Vitest` with `jsdom` and `@testing-library/react`.
-   **Initial Test**: Created `client/src/components/ui/button.test.tsx` as a basic proof-of-concept.
-   **Navbar Component Test**: Developed `client/src/components/navbar.test.tsx` to test various states and interactions of the `Navbar` component.
-   **Status**: All client-side tests are currently passing.

### 2. Server-Side API Route Testing Setup
-   **Tooling**: Using `Vitest` and `supertest` for API route testing.
-   **Initial Tests**: Implemented tests for `/api/health`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, and `/api/auth/user` endpoints in `server/routes.test.ts`.

## Current Blocking Issues (Server-Side Testing)

The server-side tests are currently failing with `TypeError: Cannot read properties of undefined` errors, primarily related to the `storage` and `auth` modules. This indicates a fundamental problem with how these modules are being mocked and accessed within the test environment.

**Specific Symptoms:**
-   Errors like `TypeError: __vite_ssr_import_1__.db.select is not a function` or `TypeError: Cannot read properties of undefined (reading 'getPetCategories')`.
-   Assertions for HTTP status codes (e.g., 403, 401) are often incorrect, suggesting that the mocked authentication middleware (`isAuthenticated`, `setupAuth`) is not behaving as expected or is being bypassed.

**Root Cause Analysis:**
The core problem lies in the interaction between Vitest's module mocking (`vi.mock` and `vi.doMock`) and the way `server/routes.ts` imports and uses its dependencies (`./storage`, `./auth`, `./db`). When `registerRoutes` is called, it seems to be resolving its dependencies to the original, unmocked modules, or the mocks are not being applied consistently across the module graph. This leads to runtime errors when the mocked functions (e.g., `storage.getPetCategories`) are called, as they are `undefined` or not the mock functions we expect.

The attempts to use `await import('./auth')` within `beforeEach` blocks in `server/routes.test.ts` were an attempt to dynamically access the mocked versions, but this has not fully resolved the issue, and in some cases, has exacerbated it due to complex module loading and hoisting behaviors in Vitest's ESM environment.

## Path Forward: Dependency Injection

To definitively resolve these mocking challenges and create a more robust and testable server-side architecture, the next step is to introduce **dependency injection** into the `registerRoutes` function in `server/routes.ts`.

**Proposed Changes:**

1.  **Modify `server/routes.ts`**:
    *   The `registerRoutes` function signature will be updated to explicitly accept its dependencies (`storage`, `auth`, `db`) as parameters.
    *   All internal `import` statements for `./storage`, `./auth`, and `./db` within `routes.ts` will be removed.
    *   All references to `storage`, `auth`, and `db` within `routes.ts` will be updated to use the injected parameters.

2.  **Update `server/routes.test.ts`**:
    *   All `vi.mock('./storage', ...)` and `vi.mock('./auth', ...)` calls will be removed.
    *   In the `beforeEach` block of `routes.test.ts`, explicit mock objects for `storage`, `auth`, and `db` will be created using `vi.fn()`.
    *   These explicit mock objects will then be passed as arguments to `registerRoutes` when the Express app is set up for each test.
    *   Test assertions will directly interact with these explicit mock objects (e.g., `mockStorage.getPetCategories.toHaveBeenCalledWith(...)`).

This approach will make the `routes.ts` file significantly more testable and eliminate the reliance on complex global module mocking, which seems to be the source of the persistent issues. 
