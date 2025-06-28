# Proposal: PostgreSQL Migration to Kubernetes (R1 Release)

**Date:** 2025-06-28

**Author:** Gemini (Revised by Claude)

**Version:** R1 Production-Ready Release

## 1. Overview

This document outlines the plan to migrate the "Wolves Pet Store" application from a managed Neon database to a self-hosted PostgreSQL instance running in Kubernetes. This change will increase portability, remove vendor lock-in, and demonstrate standard organizational K8s database patterns.

This R1 release provides a production-ready foundation with proper resource management, health checks, and operational procedures, while maintaining simplicity for demo effectiveness.

## 2. Goals

### Primary Objectives
*   Replace the `@neondatabase/serverless` dependency with the standard `pg` driver.
*   Deploy PostgreSQL as a production-ready StatefulSet within the Kubernetes cluster.
*   Automate database schema migrations and seeding as part of the deployment workflow.
*   Demonstrate standard organizational K8s database patterns.

### R1 Specific Goals
*   Provide complete, working Kubernetes manifests with proper resource management.
*   Include health checks, monitoring readiness, and graceful failure handling.
*   Support both full K8s development and simplified docker-compose development.
*   Create clear documentation and troubleshooting procedures for demo effectiveness.

## 3. Proposed Changes

### 3.1. Code Modifications

**1. Dependency Changes:**

*   **Remove:** `@neondatabase/serverless`
*   **Add:** `pg` (the standard Node.js PostgreSQL client)

**2. Database Connection (`server/db.ts`):**

The database connection logic will be updated to use `pg` with production-ready configuration.

**Proposed:**
```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Production-ready connection pool settings
  max: 20,                     // Maximum number of clients
  idleTimeoutMillis: 30000,    // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout connection attempts after 2 seconds
});

export const db = drizzle(pool, { schema });

// Graceful shutdown handling
process.on('SIGINT', () => {
  pool.end();
});

process.on('SIGTERM', () => {
  pool.end();
});
```

### 3.2. Production-Ready Kubernetes Deployment

Complete Kubernetes manifests with proper resource management, health checks, and operational readiness.

#### **PostgreSQL ConfigMap (`k8s/postgres-configmap.yaml`)**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: petstore
data:
  POSTGRES_DB: "petstore"
  POSTGRES_USER: "postgres"
```

#### **PostgreSQL Secret (`k8s/postgres-secret.yaml`)**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: petstore
type: Opaque
data:
  POSTGRES_PASSWORD: <base64-encoded-password>
  DATABASE_URL: <base64-encoded-connection-string>
```

#### **PostgreSQL StatefulSet (`k8s/postgres-statefulset.yaml`)**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: petstore
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
          name: postgres
        envFrom:
        - configMapRef:
            name: postgres-config
        - secretRef:
            name: postgres-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
          subPath: postgres
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

#### **PostgreSQL Service (`k8s/postgres-service.yaml`)**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: petstore
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
    name: postgres
  type: ClusterIP
```

### 3.3. Enhanced Skaffold Configuration

Complete Skaffold setup with development and production profiles for effective workflow management.

#### **Skaffold Configuration (`skaffold.yaml`)**
```yaml
apiVersion: skaffold/v4beta6
kind: Config
metadata:
  name: petstore
build:
  artifacts:
  - image: petstore
    docker:
      dockerfile: Dockerfile
deploy:
  kubectl:
    manifests:
    - k8s/namespace.yaml
    - k8s/postgres-configmap.yaml
    - k8s/postgres-secret.yaml
    - k8s/postgres-statefulset.yaml
    - k8s/postgres-service.yaml
    - k8s/app-deployment.yaml
    - k8s/app-service.yaml
    - k8s/db-migration-job.yaml
portForward:
- resourceType: service
  resourceName: petstore-service
  port: 80
  localPort: 3000
- resourceType: service
  resourceName: postgres
  port: 5432
  localPort: 5432
profiles:
- name: dev
  build:
    tagPolicy:
      gitCommit: {}
  deploy:
    kubectl:
      flags:
        global: ["--context=docker-desktop"]
- name: prod
  build:
    tagPolicy:
      sha256: {}
  deploy:
    kubectl:
      flags:
        global: ["--context=production-cluster"]
```

#### **Development Workflow**
With this setup:
- `skaffold dev` provides a complete, production-like environment
- `skaffold dev --profile=dev` uses development-specific settings
- `skaffold run --profile=prod` deploys to production context
- Hot reloading and automatic rebuilds during development

### 3.4. Robust Database Migration Job

Enhanced database migration with proper dependency handling and error management.

#### **Database Migration Job (`k8s/db-migration-job.yaml`)**
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: petstore
spec:
  template:
    spec:
      restartPolicy: OnFailure
      initContainers:
      - name: wait-for-postgres
        image: postgres:15-alpine
        command:
        - sh
        - -c
        - |
          until pg_isready -h postgres -U postgres; do
            echo "Waiting for postgres to be ready..."
            sleep 2
          done
          echo "PostgreSQL is ready!"
        envFrom:
        - secretRef:
            name: postgres-secret
      containers:
      - name: migrate
        image: petstore:latest
        command:
        - sh
        - -c
        - |
          echo "Starting database migration..."
          npm run db:push
          if [ $? -eq 0 ]; then
            echo "Migration completed successfully"
          else
            echo "Migration failed"
            exit 1
          fi
          
          # Run seeding if script exists
          if npm run --silent seed > /dev/null 2>&1; then
            echo "Running database seeding..."
            npm run seed
          else
            echo "No seed script found, skipping seeding"
          fi
        envFrom:
        - secretRef:
            name: postgres-secret
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

#### **Migration Features**
- **Dependency handling**: Waits for PostgreSQL to be ready before migrating
- **Error management**: Proper exit codes and error messages
- **Seeding support**: Automatic data seeding if script exists
- **Resource limits**: Appropriate resource allocation for migration tasks
- **Logging**: Clear progress and error reporting

### 3.5. Alternative Development Environment

For developers who prefer simpler local development, provide docker-compose alternative.

#### **Docker Compose Development (`docker-compose.dev.yml`)**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: petstore
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

#### **Development Options**
```bash
# Option 1: Full K8s development (production-like)
skaffold dev

# Option 2: Simple development (PostgreSQL only in Docker)
docker-compose -f docker-compose.dev.yml up -d
export DATABASE_URL="postgresql://postgres:password@localhost:5432/petstore"
npm run dev
```

## 4. R1 Implementation Plan

### Phase 1: Code Migration (2-3 hours)
1. **Update Dependencies**
   - Remove: `@neondatabase/serverless`, `ws`
   - Add: `pg`, `@types/pg`
   - Update `package.json` and run `npm install`

2. **Update Database Connection**
   - Modify `server/db.ts` with production-ready pool configuration
   - Remove Neon-specific WebSocket configuration
   - Add graceful shutdown handling

### Phase 2: Kubernetes Manifests (4-5 hours)
3. **Create PostgreSQL Resources**
   - `k8s/namespace.yaml`: Petstore namespace
   - `k8s/postgres-configmap.yaml`: Database configuration
   - `k8s/postgres-secret.yaml`: Credentials and connection string
   - `k8s/postgres-statefulset.yaml`: Production-ready StatefulSet
   - `k8s/postgres-service.yaml`: Internal service exposure

4. **Create Migration Job**
   - `k8s/db-migration-job.yaml`: Robust migration with dependency handling

### Phase 3: Orchestration (2-3 hours)
5. **Configure Skaffold**
   - Update `skaffold.yaml` with complete manifest list
   - Add development and production profiles
   - Configure port forwarding for local access

6. **Alternative Development Setup**
   - Create `docker-compose.dev.yml` for simple development
   - Update development documentation

### Phase 4: Documentation and Testing (3-4 hours)
7. **Documentation Updates**
   - Update `CLAUDE.md` with PostgreSQL migration details
   - Create comprehensive setup and troubleshooting guide
   - Document both K8s and docker-compose workflows

8. **Testing and Validation**
   - Test complete deployment flow with `skaffold dev`
   - Validate migration job execution
   - Test development workflow alternatives
   - Verify health checks and monitoring readiness

## 5. R1 Success Criteria

### Functional Requirements
- [ ] Application successfully connects to PostgreSQL using standard `pg` driver
- [ ] Database schema migration runs automatically during deployment
- [ ] StatefulSet maintains data persistence across pod restarts
- [ ] Health checks properly validate PostgreSQL availability
- [ ] Both K8s and docker-compose development options work correctly

### Operational Requirements
- [ ] Resource limits prevent excessive resource consumption
- [ ] Graceful shutdown handling prevents data corruption
- [ ] Migration job handles dependencies and errors appropriately
- [ ] Skaffold profiles support both development and production workflows
- [ ] Port forwarding enables local database access for debugging

### Documentation Requirements
- [ ] Clear setup instructions for both development approaches
- [ ] Troubleshooting guide covers common issues
- [ ] `CLAUDE.md` updated with PostgreSQL migration details
- [ ] Operational procedures documented for production use

### Demo Effectiveness
- [ ] Quick deployment demonstrates organizational K8s patterns
- [ ] Clear logging shows migration and health check status
- [ ] Easy reset/cleanup procedures for demo repeatability
- [ ] Performance suitable for demo environments

## 6. Risk Mitigation

### Technical Risks
- **Connection pool exhaustion**: Implemented with reasonable limits and timeouts
- **Data persistence failure**: Using StatefulSet with proper PVC configuration
- **Migration job failures**: Robust error handling and dependency checking
- **Resource constraints**: Appropriate resource requests and limits

### Operational Risks
- **Complex setup**: Provided docker-compose alternative for simpler development
- **Debugging difficulties**: Port forwarding and logging for troubleshooting
- **Demo failures**: Health checks and validation procedures

### Rollback Strategy
- **Database backup**: Manual backup procedures before migration
- **Neon fallback**: Temporary ability to revert to Neon configuration
- **Environment isolation**: Separate development and production contexts

## 7. Future Enhancement Path

This R1 implementation provides a solid foundation for the advanced PostgreSQL features documented in `futures/postgres-production-enhancements.md`:

- **Phase 2**: High availability with read replicas
- **Phase 3**: Advanced monitoring and backup strategies  
- **Phase 4**: Security hardening and compliance features

## 8. Total Implementation Effort

**Estimated Time**: 12-15 hours across 4 phases
**Team Size**: 1-2 developers
**Timeline**: 2-3 days for complete implementation and testing
**Dependencies**: Working Kubernetes cluster and Skaffold installation

## 9. Approval and Next Steps

✅ **Ready for Implementation**

This R1 proposal provides:
- Complete technical specifications
- Production-ready Kubernetes manifests
- Clear implementation roadmap
- Comprehensive testing and validation procedures

**Please approve to proceed with Phase 1: Code Migration**