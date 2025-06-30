# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- **Development**: `npm run dev` - Starts local development server with tsx
- **Build**: `npm run build` - Builds both client (Vite) and server
- **Production**: `npm run start` - Runs production build
- **Type Check**: `npm run check` - Runs TypeScript compiler check
- **Testing**: `npm test` - Runs test suite with Vitest

### Kubernetes Deployment (Recommended)
- **Development Environment**: `skaffold dev --port-forward` - Deploys complete stack to K8s
- **Production Deployment**: `skaffold run -p prod` - Production deployment
- **Cleanup**: `skaffold delete` - Removes K8s resources
- **Database Migration**: Automatic during pod startup via migration job
- **Data Seeding**: Automatic - 12 sample pets across 6 categories
- **Admin Setup**: `kubectl exec deployment/petstore-app -n petstore -- node dist/scripts/create-admin.js --email admin@example.com`

## Architecture Overview

This is a modern, cloud-native pet store application demonstrating industry-standard development patterns.

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite build, Wouter routing
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Radix UI components with Tailwind CSS
- **Auth**: Session-based authentication with bcrypt password hashing
- **State**: React Query (@tanstack/react-query)
- **Infrastructure**: Kubernetes + Docker + Skaffold
- **Testing**: Vitest with testcontainers for integration tests

### Project Structure
```
├── client/          # React frontend application
│   └── src/
│       ├── components/  # UI components including shadcn/ui
│       ├── pages/      # Route components
│       ├── hooks/      # Custom React hooks (including useAuth)
│       └── lib/        # Utilities and configuration
├── server/          # Express.js backend
│   ├── auth.ts      # Authentication system (NEW)
│   ├── routes.ts    # API route definitions
│   ├── storage.ts   # Database operations
│   └── __tests__/   # Backend tests
├── shared/          # Shared TypeScript schemas and types
├── scripts/         # Utility scripts (admin creation, seeding)
├── k8s/            # Kubernetes manifests
├── plan/           # Project planning and documentation
├── proposals/      # Architecture decision records
└── futures/        # Future enhancement documentation
```

### Database Schema (Updated for New Auth System)
- **Users**: UUID primary keys, bcrypt password hashing, session-based auth
- **Sessions**: PostgreSQL session storage for authentication
- **Pet Categories**: Hierarchical pet organization
- **Pets**: Main entity with adoption status, medical history, images
- **Inquiries**: Customer adoption inquiries with admin management
- **Wishlists**: User favorites functionality
- **Products**: Pet supplies/accessories

Key relationships managed through Drizzle relations with proper foreign keys.

### Authentication & Authorization (UPDATED)
- **Session-based authentication** with PostgreSQL session store
- **bcrypt password hashing** with 12 rounds for security
- **UUID primary keys** for users (non-predictable identifiers)
- **Role-based access** with `isAdmin` flag
- **Password requirements**: Minimum 8 characters with special character
- **Admin routes protected** with `isAuthenticated` and admin check middleware
- **API endpoints**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/user`

### API Patterns
- RESTful API with consistent error handling and error codes
- Zod validation for all inputs using shared schemas
- Admin-only routes prefixed with `/api/admin/`
- Standard HTTP status codes and JSON responses
- Health check endpoint at `/api/health` for Kubernetes probes

### Frontend Architecture
- Component-based with shadcn/ui design system
- React Query for server state management
- Wouter for lightweight routing
- TypeScript path aliases: `@/*` (client), `@shared/*` (shared)
- Authentication state managed through useAuth hook

### Infrastructure & DevOps
- **Kubernetes-native**: Full K8s deployment with StatefulSets and Deployments
- **Skaffold workflow**: `skaffold dev` for development, `skaffold run` for deployment
- **Docker multi-stage builds**: Optimized production images
- **PostgreSQL in K8s**: StatefulSet with persistent volumes
- **Offline development**: Complete functionality without internet
- **Testing**: Unit tests (Vitest), integration tests (testcontainers), E2E capabilities

### Development Notes
- **Database migrations** automated via Kubernetes job during deployment
- **Sample data** automatically seeded (12 pets across 6 categories)
- **Admin user creation** via kubectl exec to running pod
- **Environment variables**: Configured via K8s ConfigMaps and Secrets
- **Build targets**: Node.js ESM for server, modern browsers for client
- **Authentication**: Session-based auth with PostgreSQL session store
- **Security**: Network policies, resource limits, non-root containers, security contexts
- **Access**: Application available at http://localhost:3000 via port-forward

### Sprint Development Status
- ✅ **Sprint 1 Complete**: Authentication system, database schema, admin tools, testing
- ✅ **Sprint 2 Complete**: Frontend auth UI, containerization, full K8s deployment
- ✅ **Sprint 3 Complete**: Production hardening, network policies, operational documentation
- ✅ **Testing Revolution Complete**: Comprehensive test infrastructure with dependency injection
- ✅ **E2E & CI/CD Complete**: Full automation pipeline with 145 tests
- 🎯 **Production Ready**: Enterprise-grade application with complete testing and automation

## Testing Infrastructure (CRITICAL)

### Testing Architecture - Dependency Injection Pattern
**IMPORTANT**: This project uses dependency injection for testability. Always follow this pattern:

```typescript
// ✅ CORRECT: Dependency injection pattern
export function registerRoutes(app: Express, deps: {
  storage: StorageInterface,
  auth: AuthInterface,
  db: DatabaseInterface
}) {
  // Routes use injected dependencies
}

// ✅ CORRECT: Test setup
const mockStorage = { getPetCategories: vi.fn() }
const mockAuth = { isAuthenticated: vi.fn() }
await registerRoutes(app, { storage: mockStorage, auth: mockAuth, db: mockDb })
```

**NEVER use `vi.doMock()` or complex module mocking** - it causes ESM compatibility issues.

### Testing Standards
- **Total Tests**: 145 automated tests across all layers
- **Coverage**: Unit (65 tests), Integration (3 tests), E2E (80 tests)
- **Test Files**: 14 test files with 4,016 lines of test code
- **Success Rate**: 100% test success (dependency injection eliminated all failures)
- **E2E Framework**: Playwright with Page Object Model
- **CI/CD**: 6 GitHub Actions workflows with 2,401 lines of automation

### Critical Testing Patterns
1. **Server Routes**: Use dependency injection for `storage`, `auth`, `db`
2. **Client Components**: Mock `useAuth` hook and API calls
3. **E2E Tests**: Use Page Object Model for maintainability
4. **Integration Tests**: Use testcontainers for real database testing

## Project History & Collaboration

### Timeline Achievement
**Completed in 29 hours (June 28-29, 2025)**:
- 10:27-13:24: Foundation and planning
- 13:24-22:13: Core migration implementation
- 02:04-04:31: Testing revolution
- 14:51-15:30: E2E and CI/CD completion

### Team Structure Lessons
- **Solution Architect**: Provides proposals, reviews, strategic guidance
- **Senior Developer (Claude)**: Infrastructure, testing architecture, mentoring
- **Junior Developer (Gemini)**: Application logic, frontend, guided implementation
- **Success Factor**: Rapid validation cycles (15-30 minutes) and clear role boundaries

### Important Files for Context
- `server/auth.ts` - Core authentication system
- `server/routes.ts` - **Uses dependency injection pattern**
- `server/routes.test.ts` - **Reference for proper testing patterns**
- `shared/schema.ts` - Database schema with validation
- `scripts/create-admin.ts` - Admin user creation utility
- `plan/` - Sprint planning and progress documentation
- `e2e/` - **Complete E2E test suite with Page Object Model**
- `k8s/` - Kubernetes deployment manifests
- `.github/workflows/` - **CI/CD automation pipelines**
- `API.md` - Complete API documentation

## Key Learnings for Future Development

### What Works
1. **Dependency Injection**: Eliminates ESM testing issues, improves architecture
2. **Time-boxed Development**: 29-hour sprint achieved enterprise transformation
3. **Rapid Validation**: 15-30 minute proposal review cycles maintain momentum
4. **Three-way Collaboration**: Solution architect + senior dev + junior dev dynamic
5. **Security First**: Building security into foundation vs retrofitting

### Critical Patterns to Maintain
- Always use dependency injection for new modules
- Follow Page Object Model for E2E tests
- Maintain 100% test success rate standard
- Use Kubernetes-native deployment practices
- Document architectural decisions in `plan/` directory

### Never Do Again
- `vi.doMock()` patterns (causes ESM failures)
- Direct module imports in testable functions
- Manual deployment processes
- Adding features without corresponding tests