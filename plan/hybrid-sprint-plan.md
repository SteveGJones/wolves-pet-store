# Hybrid Two-Developer Sprint Plan

**Date:** 2025-06-28  
**Authors:** Gemini + Claude (Combined Approach)  
**Status:** Final Recommended Plan

## 1. Overview

This hybrid plan combines the proven technical progression from the original agile plan with enhanced coordination frameworks to ensure successful parallel development. The plan delivers testable, integrated increments while maintaining clear coordination and risk mitigation.

**Duration:** 3 sprints × 1 week each = 3 weeks total

## 2. Sprint Structure & Coordination Framework

### **Sprint Duration:** 1 week per sprint
### **Daily Coordination:** 
- **Morning Standup (15 min):** Previous day's progress, today's goals, blockers
- **Evening Sync (15 min):** Integration needs, next day coordination

### **Team Structure:**
- **Dev A (Application Focus):** Backend, database, authentication, frontend integration
- **Dev B (Infrastructure Focus):** Kubernetes, Docker, deployment, production hardening

---

## **Sprint 1: Backend Logic & Core Database Infrastructure**

### **Goal:** Get the new authentication backend working and PostgreSQL database running in Kubernetes. The application will be testable via API calls and database checks.

### **Dev A (Application Focus) - Estimated 40 hours**

#### **Task 1: Implement Backend Authentication (24 hours)**
- **Day 1-2:** Modify `users` schema in `shared/schema.ts`
  - Update to UUID primary keys
  - Add password, displayName fields
  - Create Zod validation schemas
- **Day 3:** Implement `server/auth.ts` with bcrypt and UUID
  - Password hashing utilities
  - Session management functions
  - Input validation
- **Day 4-5:** Build backend API endpoints
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/user`

#### **Task 2: Admin User Creation Script (8 hours)**
- **Day 5:** Build `scripts/create-admin.ts` CLI tool
  - Interactive password prompting
  - Email validation
  - Error handling

#### **Task 3: Replit Dependency Cleanup (8 hours)**
- **Day 1:** Remove Replit packages and environment variables
  - `npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal`
  - `npm uninstall openid-client passport passport-local`
  - Clean up `REPL_ID`, `REPLIT_DOMAINS`, `ISSUER_URL` references

**Local Testing:** Use curl/Postman to test API endpoints on local server

### **Dev B (Infrastructure Focus) - Estimated 40 hours**

#### **Task 1: PostgreSQL Kubernetes Deployment (24 hours)**
- **Day 1-2:** Create PostgreSQL manifests
  - `k8s/postgres-statefulset.yaml` with proper volumes and health checks
  - `k8s/postgres-service.yaml` for internal networking
  - `k8s/postgres-secret.yaml` for credentials
  - `k8s/postgres-configmap.yaml` for configuration
- **Day 3:** Create database migration job
  - `k8s/db-migration-job.yaml` with dependency handling
  - Wait-for-postgres init container
  - Proper error handling and logging

#### **Task 2: Basic Skaffold Configuration (16 hours)**
- **Day 4-5:** Create `skaffold.yaml` for database deployment
  - Database-only deployment initially
  - Port forwarding for local access
  - Development profile configuration

**Local Testing:** Use `skaffold dev` to confirm PostgreSQL and migration job run successfully

### **Sprint 1 Integration & Daily Coordination**

#### **Daily Standups:**
- **Day 1:** Align on schema changes and K8s manifest requirements
- **Day 2:** Check progress on database setup and auth implementation
- **Day 3:** Coordinate database connection testing
- **Day 4:** Plan integration testing approach
- **Day 5:** Execute integration test and resolve issues

#### **Sprint 1 Integration & Testing:**
**Goal:** Prove that the new backend can talk to the new K8s database

**Steps:**
1. Dev B ensures K8s-hosted PostgreSQL is running
2. Dev A configures local server to point to K8s Postgres (via port-forwarding)
3. Together, run `db:push` and `create-admin` scripts against K8s database
4. Test API endpoints against K8s database

**Success Criteria:**
- [ ] New admin user successfully created in K8s PostgreSQL
- [ ] All auth API endpoints functional
- [ ] Database connection stable and performant
- [ ] No Replit dependencies remain

---

## **Sprint 2: Full Application Containerization & Frontend UI**

### **Goal:** Get the entire full-stack application running in Kubernetes and make the new authentication system usable from the browser.

### **Dev A (Application Focus) - Estimated 40 hours**

#### **Task 1: Frontend Authentication UI (24 hours)**
- **Day 1-2:** Create React authentication components
  - Login form with validation
  - Register form with password requirements
  - Error handling and user feedback
- **Day 3:** Update authentication hooks and routing
  - Modify `useAuth` hook for new API
  - Update routing logic for auth states
  - Session management on frontend

#### **Task 2: Database Driver Migration (8 hours)**
- **Day 4:** Migrate `server/db.ts` to standard `pg` driver
  - Remove Neon WebSocket configuration
  - Add production-ready connection pooling
  - Implement graceful shutdown handling

#### **Task 3: API Integration Testing (8 hours)**
- **Day 5:** End-to-end authentication flow testing
  - Registration → Login → Protected routes
  - Session persistence testing
  - Error scenarios validation

### **Dev B (Infrastructure Focus) - Estimated 40 hours**

#### **Task 1: Application Containerization (24 hours)**
- **Day 1-2:** Create production-ready Dockerfile
  - Multi-stage build addressing path issues
  - Security hardening (non-root user)
  - Health check integration
- **Day 3:** Create comprehensive .dockerignore
  - Optimize build context
  - Exclude development files

#### **Task 2: Application Kubernetes Manifests (16 hours)**
- **Day 4-5:** Create application K8s resources
  - `k8s/app-deployment.yaml` with resource limits and health probes
  - `k8s/app-service.yaml` for internal networking
  - `k8s/ingress.yaml` for external access
  - Update `skaffold.yaml` to build and deploy complete stack

### **Sprint 2 Integration & Daily Coordination**

#### **Daily Standups:**
- **Day 1:** Coordinate container requirements with frontend changes
- **Day 2:** Check progress on UI components and Docker build
- **Day 3:** Plan database driver migration testing
- **Day 4:** Coordinate complete stack deployment
- **Day 5:** Execute full integration testing

#### **Sprint 2 Integration & Testing:**
**Goal:** Log in as a user through the browser in fully containerized environment

**Steps:**
1. Merge both streams of work
2. Run `skaffold dev` together to deploy entire stack
3. Access application via forwarded localhost port
4. Register new user and test login flow
5. Verify session persistence and protected routes

**Success Criteria:**
- [ ] User can register and login via browser
- [ ] Application runs entirely in local K8s cluster
- [ ] Frontend authentication UI fully functional
- [ ] Database operations work through containerized app
- [ ] Hot reloading works in development environment

---

## **Sprint 3: Production Hardening & Final Decoupling**

### **Goal:** Make the deployment production-ready and remove all remaining traces of the old platform.

### **Dev A (Application Focus) - Estimated 40 hours**

#### **Task 1: Complete Replit Decoupling (16 hours)**
- **Day 1-2:** Final cleanup and configuration
  - Update `vite.config.ts` with clean configuration
  - Delete `.replit` and `replit.md` files
  - Update `.gitignore` and `.dockerignore`
  - Remove all Replit environment variable references

#### **Task 2: Health Endpoints & Monitoring (8 hours)**
- **Day 3:** Add `/api/health` endpoint for K8s probes
  - Basic health check with database connectivity
  - Version and status information
  - Integration with K8s health probes

#### **Task 3: Documentation & Testing (16 hours)**
- **Day 4-5:** Complete documentation updates
  - Update `CLAUDE.md` with new auth system
  - Create comprehensive setup guides
  - End-to-end testing and validation
  - Offline development testing

### **Dev B (Infrastructure Focus) - Estimated 40 hours**

#### **Task 1: Production Kubernetes Hardening (24 hours)**
- **Day 1-2:** Add production-ready K8s features
  - `k8s/hpa.yaml` - Horizontal Pod Autoscaler
  - Resource limits and requests optimization
  - Security contexts and network policies
  - Comprehensive health probes configuration

#### **Task 2: Skaffold Production Configuration (8 hours)**
- **Day 3:** Enhance `skaffold.yaml` with profiles
  - Development profile with hot reloading
  - Production profile with optimized settings
  - Proper tagging and image management

#### **Task 3: Operational Procedures (8 hours)**
- **Day 4-5:** Create operational documentation
  - Deployment procedures
  - Troubleshooting guides
  - Backup and recovery procedures
  - Performance tuning guidelines

### **Sprint 3 Integration & Daily Coordination**

#### **Daily Standups:**
- **Day 1:** Coordinate final cleanup with production hardening
- **Day 2:** Check progress on documentation and K8s hardening
- **Day 3:** Plan final integration testing approach
- **Day 4:** Coordinate offline development testing
- **Day 5:** Execute final validation and sign-off

#### **Sprint 3 Integration & Testing (Final):**
**Goal:** Verify production-readiness and complete offline development capability

**Steps:**
1. Merge final changes from both developers
2. Run `skaffold dev` for complete regression testing
3. Run `skaffold run -p prod` to test production configuration
4. Execute offline development test (disconnect internet, verify full functionality)
5. Test new developer onboarding procedure

**Success Criteria:**
- [ ] Application fully decoupled from all external dependencies
- [ ] Production-ready deployment with monitoring and scaling
- [ ] Complete offline development capability verified
- [ ] New developer can set up and run locally without internet
- [ ] All documentation complete and accurate
- [ ] Performance and security requirements met

---

## 3. Risk Mitigation & Coordination

### **Technical Risks & Mitigation:**
- **Integration conflicts:** Daily coordination and feature branches
- **Blocking dependencies:** Clear dependency mapping and early communication
- **Build failures:** Comprehensive testing at each phase
- **Performance issues:** Resource monitoring and optimization

### **Coordination Risks & Mitigation:**
- **Work overlap:** Clear task boundaries and daily check-ins
- **Communication gaps:** Structured standup/sync meetings
- **Timeline slippage:** Time estimates and buffer planning
- **Scope creep:** Clear deliverables and success criteria

### **Rollback Strategy:**
- **Feature branches:** Each major component in separate branch
- **Integration checkpoints:** Test before merging
- **Configuration backup:** Preserve working states
- **Dependency tracking:** Record all changes for potential rollback

## 4. Daily Workflow Template

### **Morning Standup (15 minutes):**
1. **Yesterday's Progress:** What did you complete?
2. **Today's Goals:** What will you work on?
3. **Blockers:** Any impediments or dependencies?
4. **Integration Needs:** Any coordination required today?

### **Evening Sync (15 minutes):**
1. **Today's Outcomes:** What was accomplished?
2. **Tomorrow's Dependencies:** What do you need from the other developer?
3. **Integration Planning:** Any testing or coordination needed?
4. **Risk Assessment:** Any concerns for tomorrow?

## 5. Success Metrics

### **Sprint 1 Success:**
- [ ] Authentication backend functional with K8s PostgreSQL
- [ ] Admin user creation working
- [ ] All Replit dependencies removed
- [ ] Database migration process validated

### **Sprint 2 Success:**
- [ ] Complete application running in K8s
- [ ] Frontend authentication UI functional
- [ ] End-to-end user flows working
- [ ] Containerized deployment successful

### **Sprint 3 Success:**
- [ ] Production-ready deployment with monitoring
- [ ] Complete offline development capability
- [ ] All documentation complete
- [ ] New developer onboarding validated

### **Overall Project Success:**
- [ ] Zero external service dependencies
- [ ] Junior developers can work offline on flights
- [ ] Production-ready demonstration environment
- [ ] Industry-standard authentication and deployment patterns

## 6. Timeline Summary

| Sprint | Week | Focus | Dev A Deliverable | Dev B Deliverable |
|--------|------|-------|-------------------|-------------------|
| 1 | Week 1 | Backend & Database | Auth API + Admin Script | PostgreSQL in K8s |
| 2 | Week 2 | Full Stack | Frontend Auth UI | Application Container |
| 3 | Week 3 | Production Ready | Final Cleanup + Docs | Production Hardening |

**Total Duration:** 3 weeks  
**Total Effort:** ~240 developer hours (120 hours per developer)  
**Final Outcome:** Production-ready, offline-capable development environment

This hybrid approach ensures technical excellence with operational reliability, delivering a robust foundation for your demonstration application.