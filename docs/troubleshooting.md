# Troubleshooting Guide

This guide helps resolve common issues when developing or deploying the Wolves Pet Store application.

## Quick Diagnosis Commands

```bash
# Check overall cluster health
kubectl get pods -n petstore
kubectl get services -n petstore
kubectl get deployments -n petstore

# Check resource usage
kubectl top pods -n petstore
kubectl describe resourcequota -n petstore

# View application logs
kubectl logs deployment/petstore-app -n petstore --tail=50
kubectl logs statefulset/postgres -n petstore --tail=50
```

## Common Issues

### 1. Application Pod Won't Start

**Symptoms**:
- Pod stuck in `Pending`, `CrashLoopBackOff`, or `Error` state
- Application not accessible via port-forward

**Diagnosis**:
```bash
kubectl describe pod <pod-name> -n petstore
kubectl logs <pod-name> -n petstore
kubectl get events -n petstore --sort-by=.metadata.creationTimestamp
```

**Common Causes & Solutions**:

**Resource Constraints**:
```bash
# Check if resource quota is exceeded
kubectl describe resourcequota -n petstore

# Check node resources
kubectl top nodes
kubectl describe nodes
```

**Solution**: Scale down other workloads or increase cluster resources.

**Image Pull Issues**:
```bash
# Check image pull status
kubectl describe pod <pod-name> -n petstore | grep -A 5 "Events:"
```

**Solution**: Verify image name and availability. For local development, ensure Docker image is built:
```bash
docker build -t petstore-app .
```

**Configuration Issues**:
```bash
# Check configmap and secrets
kubectl get configmap -n petstore
kubectl get secrets -n petstore
kubectl describe configmap app-config -n petstore
```

**Solution**: Verify all required environment variables are set correctly.

### 2. Database Connection Failures

**Symptoms**:
- Application logs show "ECONNREFUSED" or "Connection refused"
- Health check fails with database errors

**Diagnosis**:
```bash
# Check PostgreSQL pod status
kubectl get pods -l app=postgres -n petstore
kubectl logs statefulset/postgres -n petstore

# Test database connectivity from app pod
kubectl exec deployment/petstore-app -n petstore -- \
  pg_isready -h postgres -p 5432 -U postgres
```

**Common Causes & Solutions**:

**PostgreSQL Not Ready**:
```bash
# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n petstore --timeout=300s

# Check PostgreSQL startup logs
kubectl logs statefulset/postgres -n petstore | grep -i error
```

**Database Authentication**:
```bash
# Verify database credentials
kubectl get secret postgres-secret -n petstore -o yaml

# Test connection manually
kubectl exec -it statefulset/postgres -n petstore -- \
  psql -U postgres -d petstore -c "SELECT 1;"
```

**Network Policy Issues**:
```bash
# Check network policies
kubectl get networkpolicy -n petstore
kubectl describe networkpolicy -n petstore
```

### 3. Migration Job Failures

**Symptoms**:
- Tables not created in database
- Application shows "relation does not exist" errors

**Diagnosis**:
```bash
# Check migration job status
kubectl get jobs -n petstore
kubectl describe job db-migration -n petstore
kubectl logs job/db-migration -n petstore
```

**Solutions**:

**Re-run Migration**:
```bash
# Delete and recreate migration job
kubectl delete job db-migration -n petstore
kubectl apply -f k8s/db-migration-job.yaml

# Monitor migration progress
kubectl logs job/db-migration -n petstore -f
```

**Manual Migration**:
```bash
# Connect to database and run migration manually
kubectl exec -it statefulset/postgres -n petstore -- psql -U postgres -d petstore

# Or run migration script from app pod
kubectl exec deployment/petstore-app -n petstore -- \
  node dist/scripts/migrate.js
```

### 4. Frontend Build Issues

**Symptoms**:
- Blank page when accessing application
- JavaScript errors in browser console
- Build failures during deployment

**Diagnosis**:
```bash
# Check build process in container
kubectl logs deployment/petstore-app -n petstore | grep -i "build\|error"

# Check if static files are served
kubectl exec deployment/petstore-app -n petstore -- ls -la /app/client/dist
```

**Solutions**:

**Clear Build Cache**:
```bash
# Rebuild Docker image without cache
docker build --no-cache -t petstore-app .

# Or delete and recreate deployment
kubectl delete deployment petstore-app -n petstore
kubectl apply -f k8s/app-deployment.yaml
```

**Check Static File Serving**:
```bash
# Verify Vite build output
kubectl exec deployment/petstore-app -n petstore -- \
  ls -la /app/client/dist/

# Check Express static file configuration
kubectl logs deployment/petstore-app -n petstore | grep -i "static\|serve"
```

### 5. Authentication Issues

**Symptoms**:
- Cannot log in with valid credentials
- Session not persisting across requests
- "Unauthorized" errors when accessing protected routes

**Diagnosis**:
```bash
# Check session configuration
kubectl logs deployment/petstore-app -n petstore | grep -i "session\|auth"

# Verify session storage in database
kubectl exec -it statefulset/postgres -n petstore -- \
  psql -U postgres -d petstore -c "SELECT * FROM sessions LIMIT 5;"
```

**Solutions**:

**Session Secret Issues**:
```bash
# Check session secret
kubectl get secret app-secrets -n petstore -o yaml

# Verify session secret is not empty
kubectl exec deployment/petstore-app -n petstore -- \
  printenv | grep SESSION_SECRET
```

**Database Session Storage**:
```bash
# Check if sessions table exists
kubectl exec -it statefulset/postgres -n petstore -- \
  psql -U postgres -d petstore -c "\dt"

# Clear existing sessions if corrupted
kubectl exec -it statefulset/postgres -n petstore -- \
  psql -U postgres -d petstore -c "DELETE FROM sessions;"
```

### 6. Performance Issues

**Symptoms**:
- Slow response times
- High memory/CPU usage
- Timeouts on requests

**Diagnosis**:
```bash
# Check resource usage
kubectl top pods -n petstore
kubectl top nodes

# Check HPA status
kubectl get hpa -n petstore
kubectl describe hpa petstore-hpa -n petstore

# Monitor application metrics
kubectl logs deployment/petstore-app -n petstore | grep -i "slow\|timeout"
```

**Solutions**:

**Scale Application**:
```bash
# Manual scaling
kubectl scale deployment petstore-app -n petstore --replicas=3

# Check if HPA is working
kubectl get hpa -n petstore -w
```

**Database Performance**:
```bash
# Check database connections
kubectl exec -it statefulset/postgres -n petstore -- \
  psql -U postgres -d petstore -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
kubectl exec -it statefulset/postgres -n petstore -- \
  psql -U postgres -d petstore -c "SELECT query, state, query_start FROM pg_stat_activity WHERE state = 'active';"
```

### 7. Storage Issues

**Symptoms**:
- PostgreSQL pod won't start
- Data loss after pod restart
- PVC mounting errors

**Diagnosis**:
```bash
# Check PVC status
kubectl get pvc -n petstore
kubectl describe pvc postgres-storage-postgres-0 -n petstore

# Check storage class
kubectl get storageclass
kubectl describe storageclass <storage-class-name>
```

**Solutions**:

**PVC Issues**:
```bash
# Delete and recreate PVC (WARNING: Data loss!)
kubectl delete statefulset postgres -n petstore
kubectl delete pvc postgres-storage-postgres-0 -n petstore
kubectl apply -f k8s/postgres-statefulset.yaml
```

**Storage Space**:
```bash
# Check available storage on nodes
kubectl exec -it statefulset/postgres -n petstore -- df -h

# Clean up old logs if needed
kubectl exec -it statefulset/postgres -n petstore -- \
  find /var/lib/postgresql/data/log -name "*.log" -mtime +7 -delete
```

## Development-Specific Issues

### 8. Skaffold Issues

**Symptoms**:
- `skaffold dev` fails to start
- Image builds fail
- Port forwarding not working

**Diagnosis**:
```bash
# Check Skaffold configuration
skaffold config list
skaffold diagnose

# Verify Docker daemon
docker info
docker ps
```

**Solutions**:

**Docker Issues**:
```bash
# Restart Docker service
sudo systemctl restart docker

# Clean Docker build cache
docker system prune -a
```

**Skaffold Configuration**:
```bash
# Delete Skaffold deployments and restart
skaffold delete
skaffold dev --port-forward
```

### 9. Local Development Issues

**Symptoms**:
- Hot reload not working
- TypeScript compilation errors
- Import resolution errors

**Solutions**:

**Node Modules**:
```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

**TypeScript Issues**:
```bash
# Check TypeScript compilation
npm run check

# Rebuild TypeScript
npx tsc --build --clean
npx tsc --build
```

## Recovery Procedures

### Complete Application Reset

```bash
# Delete all resources
kubectl delete namespace petstore

# Recreate with fresh deployment
kubectl apply -f k8s/namespace.yaml
skaffold dev --port-forward
```

### Database Reset (Development Only)

```bash
# Delete database and storage
kubectl delete statefulset postgres -n petstore
kubectl delete pvc postgres-storage-postgres-0 -n petstore

# Redeploy database
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n petstore

# Re-run migrations
kubectl apply -f k8s/db-migration-job.yaml
```

### Clean Kubernetes Environment

```bash
# Remove all petstore resources
kubectl delete namespace petstore

# Clean up any stuck resources
kubectl get all --all-namespaces | grep petstore
kubectl delete <resource-type> <resource-name> -n <namespace> --force --grace-period=0
```

## Getting Help

1. **Check Logs**: Always start with `kubectl logs` and `kubectl describe`
2. **Monitor Resources**: Use `kubectl top` to check resource usage
3. **Verify Configuration**: Check ConfigMaps, Secrets, and environment variables
4. **Test Connectivity**: Use `kubectl exec` to test network connections
5. **Check Documentation**: Refer to [deployment.md](./deployment.md) and [development.md](./development.md)

## Emergency Contacts

For production issues:
- Application Team: Check `CONTRIBUTING.md` for contact information
- Infrastructure Team: Refer to your organization's escalation procedures
- Database Team: For persistent storage or backup/restore issues