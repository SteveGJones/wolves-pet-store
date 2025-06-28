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
- 🎯 **Production Ready**: Full-stack application deployed to Kubernetes with security hardening

### Important Files for Context
- `server/auth.ts` - Core authentication system
- `shared/schema.ts` - Database schema with validation
- `scripts/create-admin.ts` - Admin user creation utility
- `plan/` - Sprint planning and progress documentation
- `k8s/` - Kubernetes deployment manifests
- `API.md` - Complete API documentation