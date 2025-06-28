# Deployment Guide

This guide covers deploying the Wolves Pet Store to Kubernetes environments.

## Prerequisites

### Required Tools
- **Kubernetes Cluster**: minikube, kind, or cloud provider (GKE, EKS, AKS)
- **kubectl**: Kubernetes command-line tool
- **Skaffold**: For development workflow (optional)
- **Docker**: For container builds

### Cluster Requirements
- Kubernetes 1.24+
- Storage class supporting `ReadWriteOnce` persistent volumes
- At least 2 CPU cores and 4GB memory available
- Support for LoadBalancer services (for ingress)

## Deployment Methods

### Method 1: Skaffold (Recommended for Development)

```bash
# Deploy complete application stack
skaffold dev --port-forward

# For production profile
skaffold run -p prod

# Clean up
skaffold delete
```

### Method 2: Manual kubectl Deployment

1. **Create namespace and apply base resources**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/resource-quota.yaml
   kubectl apply -f k8s/network-policies.yaml
   ```

2. **Deploy PostgreSQL database**:
   ```bash
   kubectl apply -f k8s/postgres-configmap.yaml
   kubectl apply -f k8s/postgres-secret.yaml
   kubectl apply -f k8s/postgres-statefulset.yaml
   kubectl apply -f k8s/postgres-service.yaml
   ```

3. **Wait for database to be ready**:
   ```bash
   kubectl wait --for=condition=ready pod -l app=postgres -n petstore --timeout=300s
   ```

4. **Deploy application**:
   ```bash
   kubectl apply -f k8s/app-configmap.yaml
   kubectl apply -f k8s/app-secrets.yaml
   kubectl apply -f k8s/app-deployment.yaml
   kubectl apply -f k8s/app-service.yaml
   ```

5. **Run database migration**:
   ```bash
   kubectl apply -f k8s/db-migration-job.yaml
   ```

6. **Optional: Deploy ingress and autoscaling**:
   ```bash
   kubectl apply -f k8s/app-ingress.yaml
   kubectl apply -f k8s/app-hpa.yaml
   ```

## Configuration

### Environment Variables

The application uses the following environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | No |
| `PORT` | Application port | `3000` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `SESSION_SECRET` | Session encryption key | - | Yes |

### Database Configuration

The PostgreSQL database is configured with:
- **User**: `postgres`
- **Password**: Set in `postgres-secret.yaml`
- **Database**: `petstore`
- **Port**: `5432`
- **Persistent Storage**: 10Gi by default

### Security Configuration

- **Network Policies**: Restrict pod-to-pod communication
- **Resource Limits**: CPU and memory limits on all pods
- **Security Context**: Non-root containers with read-only root filesystem
- **Secrets Management**: Sensitive data stored in Kubernetes secrets

## Health Checks

The application includes comprehensive health checks:

### Readiness Probe
- **Endpoint**: `/api/health`
- **Initial Delay**: 10 seconds
- **Period**: 5 seconds
- **Timeout**: 3 seconds

### Liveness Probe
- **Endpoint**: `/api/health`
- **Initial Delay**: 30 seconds
- **Period**: 10 seconds
- **Timeout**: 5 seconds

## Accessing the Application

### Local Development (Port Forward)
```bash
# Forward application port
kubectl port-forward -n petstore service/petstore-app 3000:3000

# Forward database port (for debugging)
kubectl port-forward -n petstore service/postgres 5432:5432
```

### Production (Ingress)
```bash
# Check ingress status
kubectl get ingress -n petstore

# Get external IP
kubectl get service -n petstore petstore-app
```

## Scaling

### Manual Scaling
```bash
# Scale application pods
kubectl scale deployment petstore-app -n petstore --replicas=3

# Check scaling status
kubectl get pods -n petstore -l app=petstore-app
```

### Automatic Scaling (HPA)
The Horizontal Pod Autoscaler is configured to:
- **Min Replicas**: 2
- **Max Replicas**: 10
- **Target CPU**: 70%
- **Target Memory**: 80%

Monitor autoscaling:
```bash
kubectl get hpa -n petstore
kubectl describe hpa petstore-hpa -n petstore
```

## Database Operations

### Creating Admin Users
```bash
# Create admin user interactively
kubectl exec deployment/petstore-app -n petstore -- \
  node dist/scripts/create-admin.js --email admin@example.com

# Create admin user with password
kubectl exec deployment/petstore-app -n petstore -- \
  node dist/scripts/create-admin.js \
  --email admin@example.com \
  --password "SecurePass123!" \
  --display-name "Admin User"
```

### Database Backup
```bash
# Create database backup
kubectl exec statefulset/postgres -n petstore -- \
  pg_dump -U postgres petstore > backup.sql

# Restore from backup
kubectl exec -i statefulset/postgres -n petstore -- \
  psql -U postgres petstore < backup.sql
```

### Running Migrations
```bash
# Check migration job status
kubectl get jobs -n petstore

# Re-run migrations if needed
kubectl delete job db-migration -n petstore
kubectl apply -f k8s/db-migration-job.yaml
```

## Monitoring

### Pod Status
```bash
# Check all pods
kubectl get pods -n petstore

# Describe specific pod
kubectl describe pod <pod-name> -n petstore

# View pod logs
kubectl logs <pod-name> -n petstore -f
```

### Resource Usage
```bash
# Check resource usage
kubectl top pods -n petstore
kubectl top nodes

# Check resource quotas
kubectl describe resourcequota -n petstore
```

### Application Logs
```bash
# Application logs
kubectl logs deployment/petstore-app -n petstore -f

# Database logs
kubectl logs statefulset/postgres -n petstore -f

# Migration logs
kubectl logs job/db-migration -n petstore
```

## Security Considerations

### Network Security
- Default deny-all network policy
- Specific allow rules for required communication
- Database only accessible from application pods

### Container Security
- Non-root user (user ID 1001)
- Read-only root filesystem
- No privileged containers
- Security context enforced

### Secrets Management
- Database credentials stored in Kubernetes secrets
- Session secrets generated and stored securely
- No secrets in environment variables or logs

## Troubleshooting

### Common Issues

**Application won't start**:
```bash
kubectl describe pod <app-pod> -n petstore
kubectl logs <app-pod> -n petstore
```

**Database connection issues**:
```bash
kubectl exec -it statefulset/postgres -n petstore -- psql -U postgres -d petstore
```

**Migration failures**:
```bash
kubectl logs job/db-migration -n petstore
kubectl describe job db-migration -n petstore
```

### Recovery Procedures

**Reset database**:
```bash
kubectl delete statefulset postgres -n petstore
kubectl delete pvc postgres-storage-postgres-0 -n petstore
kubectl apply -f k8s/postgres-statefulset.yaml
```

**Reset application**:
```bash
kubectl rollout restart deployment/petstore-app -n petstore
kubectl rollout status deployment/petstore-app -n petstore
```

For more troubleshooting information, see [troubleshooting.md](./troubleshooting.md).