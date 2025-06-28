# Wolves Pet Store

A modern, full-stack pet adoption and supplies store built with React, TypeScript, Express, and PostgreSQL. This application demonstrates industry-standard patterns for authentication, containerization, and Kubernetes deployment.

## 🐾 Overview

Wolves Pet Store is a comprehensive pet adoption platform that allows users to:
- Browse and search for adoptable pets
- Submit adoption inquiries
- Purchase pet supplies and accessories
- Manage wishlists of favorite pets
- Admin dashboard for pet and inquiry management

## 🏗️ Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight React router)
- **Styling:** Tailwind CSS with Radix UI components
- **State Management:** TanStack Query for server state
- **Forms:** React Hook Form with Zod validation
- **Build Tool:** Vite for fast development and optimized builds

### Backend
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Session-based with bcrypt password hashing
- **Session Storage:** PostgreSQL session store
- **API:** RESTful endpoints with comprehensive error handling

### Infrastructure
- **Containerization:** Docker with multi-stage builds
- **Orchestration:** Kubernetes with StatefulSets and Deployments
- **Development:** Skaffold for local K8s development workflow
- **Database:** PostgreSQL running in Kubernetes StatefulSet

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- Kubernetes cluster (minikube, kind, or cloud provider)
- Skaffold for development workflow

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wolves-pet-store
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application with Kubernetes**
   ```bash
   # Deploy complete application stack (database + app)
   skaffold dev --port-forward
   ```

4. **Access the application**
   - Application: http://localhost:3000 (via port-forward)
   - Health Check: http://localhost:3000/api/health

5. **Create sample data (optional)**
   ```bash
   # The database will be automatically migrated and seeded with sample pets
   # Check the application to see 12 sample pets across 6 categories
   ```

6. **Create an admin user (optional)**
   ```bash
   # Run from a separate terminal while app is running
   kubectl exec deployment/petstore-app -n petstore -- \
     node dist/scripts/create-admin.js --email admin@example.com
   ```

### Using Skaffold (Recommended)

For full Kubernetes development workflow:

```bash
# Start complete application stack in Kubernetes
skaffold dev --port-forward

# Access the fully deployed application
# Application: http://localhost:3000
# Includes database, app server, and frontend
```

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking

### Database
- Migrations run automatically during Kubernetes deployment
- Sample data is seeded automatically (12 pets across 6 categories)

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode  
- `npm run test:unit` - Run unit tests (fast, no database)
- `npm run test:integration` - Run integration tests against K8s database

### Infrastructure
- `skaffold dev` - Start development environment in Kubernetes
- `skaffold run` - Deploy to Kubernetes
- `skaffold delete` - Clean up Kubernetes resources

## 🔐 Authentication

The application uses a modern session-based authentication system:

### Features
- **Password Requirements:** Minimum 8 characters with special character
- **Secure Hashing:** bcrypt with 12 rounds
- **UUID Primary Keys:** Non-predictable user identifiers
- **Session Management:** PostgreSQL-backed session storage
- **Admin Controls:** Role-based access control

### API Endpoints
```
POST /api/auth/register  # User registration
POST /api/auth/login     # User authentication
POST /api/auth/logout    # Session termination
GET  /api/auth/user      # Current user info
```

### Admin Setup
```bash
# Interactive mode (prompts for password)
npm run create-admin -- --email admin@company.com

# Command line mode
npm run create-admin -- --email admin@company.com --password "SecurePass123!" --display-name "Admin"
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts with UUID primary keys
- **sessions** - Session storage for authentication
- **pets** - Adoptable animals with detailed information
- **pet_categories** - Pet type classifications
- **inquiries** - Adoption inquiries from customers
- **wishlists** - User favorites and saved pets
- **products** - Pet supplies and accessories

### Relationships
- Users can have multiple wishlist items and inquiries
- Pets belong to categories and can have multiple inquiries
- Admin users can manage all pets, categories, and inquiries

## 🐳 Docker & Kubernetes

### Docker
The application uses multi-stage Docker builds for optimal production images:

```dockerfile
# Development stage with hot reload
# Production stage with optimized build
# Security hardening with non-root user
```

### Kubernetes Manifests
Located in the `k8s/` directory:
- `postgres-statefulset.yaml` - PostgreSQL database
- `postgres-service.yaml` - Database service
- `app-deployment.yaml` - Application deployment
- `app-service.yaml` - Application service
- `ingress.yaml` - External access configuration

### Skaffold Configuration
- **Development Profile:** Hot reload, port forwarding, debug mode
- **Production Profile:** Optimized builds, resource limits, health checks

## 🧪 Testing

### Testing Strategy
- **Unit Tests (70%):** Authentication, utilities, business logic
- **Integration Tests (20%):** API endpoints, database operations
- **E2E Tests (10%):** Critical user journeys

### Test Coverage
- Minimum 80% code coverage for critical paths
- Comprehensive auth module testing
- Database operation validation
- API endpoint testing with real requests

### Running Tests
```bash
# Unit tests (fast, no database required)
npm run test:unit

# Integration tests against K8s database
# First ensure K8s environment is running:
skaffold dev --port-forward
# Then run integration tests:
DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore npm run test:integration

# E2E tests (planned for Sprint 2)
npm run test:e2e
```

## 🏗️ Project Structure

```
wolves-pet-store/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Express backend application
│   ├── auth.ts            # Authentication system
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   └── __tests__/         # Backend test files
├── shared/                 # Shared TypeScript definitions
│   └── schema.ts          # Database schema and validation
├── k8s/                   # Kubernetes manifests
├── scripts/               # Utility scripts
├── plan/                  # Project planning documents
└── proposals/             # Architecture decision records
```

## 🌟 Features

### For Users
- **Pet Discovery:** Browse, search, and filter adoptable pets
- **Detailed Profiles:** View comprehensive pet information and photos
- **Adoption Process:** Submit inquiries for adoption
- **Wishlist Management:** Save favorite pets for later
- **Product Catalog:** Browse and purchase pet supplies
- **User Accounts:** Secure registration and profile management

### For Administrators
- **Pet Management:** Add, edit, and manage pet listings
- **Inquiry Processing:** Review and respond to adoption requests
- **User Administration:** Manage user accounts and permissions
- **Analytics Dashboard:** View adoption statistics and trends
- **Content Management:** Manage pet categories and product catalog

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/petstore

# Session Management
SESSION_SECRET=your-secret-key-here

# Application
NODE_ENV=development|production
PORT=5000
```

### Development vs Production
- **Development:** Hot reload, detailed error messages, debug mode
- **Production:** Optimized builds, compressed assets, security headers

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check PostgreSQL is running
kubectl get pods -l app=postgres

# Verify connection string
echo $DATABASE_URL
```

**Build Failures**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run check
```

**Skaffold Issues**
```bash
# Check Skaffold configuration
skaffold config list

# Reset Kubernetes environment
skaffold delete
minikube delete && minikube start
```

### Getting Help
1. Check the troubleshooting section in documentation
2. Review error logs in `logs/` directory
3. Verify environment variables and configuration
4. Ensure all prerequisites are installed and running

## 🤝 Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies and industry best practices
- Designed for demonstration of full-stack development patterns
- Optimized for both local development and production deployment