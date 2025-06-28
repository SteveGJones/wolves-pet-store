# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `npm run dev` - Starts development server with tsx
- **Build**: `npm run build` - Builds both client (Vite) and server (esbuild)
- **Production**: `npm run start` - Runs production build
- **Type Check**: `npm run check` - Runs TypeScript compiler check
- **Database**: `npm run db:push` - Pushes schema changes to database using drizzle-kit

## Architecture Overview

This is a full-stack pet store application with the following structure:

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite build, Wouter routing
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Radix UI components with Tailwind CSS
- **Auth**: Replit Auth integration
- **State**: React Query (@tanstack/react-query)

### Project Structure
```
├── client/          # React frontend application
│   └── src/
│       ├── components/  # UI components including shadcn/ui
│       ├── pages/      # Route components
│       ├── hooks/      # Custom React hooks
│       └── lib/        # Utilities and configuration
├── server/          # Express.js backend
├── shared/          # Shared TypeScript schemas and types
└── scripts/         # Database seeding scripts
```

### Database Schema
- **Users**: Replit Auth integration with admin roles
- **Pet Categories**: Hierarchical pet organization
- **Pets**: Main entity with adoption status, medical history, images
- **Inquiries**: Customer adoption inquiries with admin management
- **Wishlists**: User favorites functionality
- **Products**: Pet supplies/accessories (future feature)

Key relationships managed through Drizzle relations with proper foreign keys.

### Authentication & Authorization
- Uses Replit Auth (`server/replitAuth.ts`)
- Role-based access with `isAdmin` flag
- Admin routes protected with middleware
- Public routes for pet browsing, authenticated routes for wishlist/inquiries

### API Patterns
- RESTful API with consistent error handling
- Zod validation for all inputs using shared schemas
- Admin-only routes prefixed with `/api/admin/`
- Standard HTTP status codes and JSON responses

### Frontend Architecture
- Component-based with shadcn/ui design system
- React Query for server state management
- Wouter for lightweight routing
- TypeScript path aliases: `@/*` (client), `@shared/*` (shared)

### Development Notes
- Database migrations handled by Drizzle Kit
- Shared schema definitions in `shared/schema.ts` with Zod validation
- Environment requires `DATABASE_URL` for database connection
- Build targets Node.js ESM for server, modern browsers for client