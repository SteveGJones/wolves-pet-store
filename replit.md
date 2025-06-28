# Wolves Pet Store

## Overview

This is a full-stack web application for a pet store built with a modern TypeScript stack. The application allows users to browse pets available for adoption, view detailed pet information, submit adoption inquiries, and manage wishlists. It includes an admin dashboard for managing pets and categories.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with Neon PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Database Schema
- **Users**: Authentication and profile information with admin roles
- **Pet Categories**: Hierarchical organization of pet types
- **Pets**: Core pet information including images, descriptions, and adoption status
- **Inquiries**: Customer inquiries for pet adoption
- **Wishlists**: User favorites for pets
- **Sessions**: Secure session storage for authentication

## Key Components

### Authentication System
- Replit Auth integration for secure user authentication
- Session-based authentication with PostgreSQL session store
- Role-based access control (admin/user permissions)
- Automatic session management and user state synchronization

### Pet Management
- Full CRUD operations for pets with image galleries
- Category-based organization with filtering capabilities
- Status tracking (available, pending, adopted)
- Rich pet profiles with detailed information

### User Features
- Pet browsing with advanced search and filtering
- Detailed pet view pages with inquiry forms
- Wishlist functionality for saving favorite pets
- Responsive design for mobile and desktop

### Admin Dashboard
- Pet management interface with form validation
- Category management system
- Inquiry tracking and management
- Admin-only access controls

## Data Flow

1. **Authentication Flow**: Users authenticate through Replit Auth, sessions are stored in PostgreSQL
2. **Pet Discovery**: Users browse pets with real-time filtering and search
3. **Inquiry Process**: Interested users submit inquiries through validated forms
4. **Admin Management**: Admins manage pets, categories, and inquiries through protected routes
5. **State Synchronization**: TanStack Query manages server state with automatic refetching

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **wouter**: Lightweight React router

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling framework
- **ESBuild**: Fast JavaScript bundler for production

### Authentication & Session
- **openid-client**: OpenID Connect authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- Vite dev server with hot module replacement
- TypeScript compilation with strict type checking
- Automatic database schema synchronization
- Real-time error reporting with Replit integration

### Production Build
- Vite builds optimized client bundle to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving through Express
- Environment-based configuration

### Database Management
- Drizzle migrations in `migrations/` directory
- Schema definitions in `shared/schema.ts`
- Database push command: `npm run db:push`
- PostgreSQL with connection pooling

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit authentication identifier
- `NODE_ENV`: Environment mode (development/production)

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
- June 28, 2025. Fixed SelectItem component errors preventing app loading
- June 28, 2025. Added comprehensive pet database with 35 diverse animals including dogs, cats, birds, rabbits, reptiles covering 30+ breeds
- June 28, 2025. Expanded categories to include Reptiles and Fish alongside original Dogs, Cats, Birds, and Small Animals
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```