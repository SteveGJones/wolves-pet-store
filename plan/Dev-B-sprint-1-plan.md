## Dev B's Sprint 1 Plan: PostgreSQL & Basic Skaffold

**Sprint Goal:** Get the PostgreSQL database running in Kubernetes, with automated migrations, and a basic Skaffold setup to deploy it.

**Estimated Time:** 40 hours

---

### **Week 1 - Day 1: PostgreSQL Kubernetes Manifests (Part 1)**

*   **Goal:** Create the foundational Kubernetes manifests for PostgreSQL.
*   **Tasks:**
    1.  **Create `k8s/` directory:** If it doesn't exist, create the `k8s/` folder in the project root.
    2.  **Create `k8s/namespace.yaml`:** Define the `petstore` namespace.
        *   *Action:* `write_file` for `k8s/namespace.yaml`
    3.  **Create `k8s/postgres-configmap.yaml`:** Define non-sensitive PostgreSQL configuration (DB name, user).
        *   *Action:* `write_file` for `k8s/postgres-configmap.yaml`
    4.  **Create `k8s/postgres-secret.yaml`:** Define sensitive PostgreSQL credentials (password, connection string).
        *   *Action:* `write_file` for `k8s/postgres-secret.yaml` (using placeholders for base64 encoded values).
        *   *Note:* Will need to generate actual base64 encoded values later.
    5.  **Create `k8s/postgres-service.yaml`:** Define the ClusterIP Service for PostgreSQL.
        *   *Action:* `write_file` for `k8s/postgres-service.yaml`
*   **Expected Outcome:** All basic PostgreSQL Kubernetes YAML files are created in the `k8s/` directory.
*   **Coordination with Dev A:** Confirm the `petstore` namespace name and the expected database name/user for consistency.

### **Week 1 - Day 2: PostgreSQL Kubernetes Manifests (Part 2)**

*   **Goal:** Complete the PostgreSQL deployment with a StatefulSet and Persistent Volume Claim.
*   **Tasks:**
    1.  **Create `k8s/postgres-statefulset.yaml`:** Define the StatefulSet for PostgreSQL, including:
        *   `postgres:15-alpine` image.
        *   Resource requests and limits.
        *   Liveness and readiness probes (`pg_isready`).
        *   Volume mount for persistent storage.
        *   `volumeClaimTemplates` for the Persistent Volume Claim.
        *   *Action:* `write_file` for `k8s/postgres-statefulset.yaml`
*   **Expected Outcome:** A complete, production-ready PostgreSQL StatefulSet manifest is created.
*   **Coordination with Dev A:** No direct dependencies today, but will ensure the `DATABASE_URL` format in `postgres-secret.yaml` matches Dev A's expected connection string.

### **Week 1 - Day 3: Database Migration Job**

*   **Goal:** Create the Kubernetes Job to run database migrations and seeding.
*   **Tasks:**
    1.  **Create `k8s/db-migration-job.yaml`:** Define the Kubernetes Job, including:
        *   `initContainer` to `wait-for-postgres` using `pg_isready`.
        *   Main container using the application image (will be `petstore:latest` from Skaffold build).
        *   Command to run `npm run db:push` and conditionally `npm run seed`.
        *   Environment variables from `postgres-secret`.
        *   Resource requests and limits.
        *   *Action:* `write_file` for `k8s/db-migration-job.yaml`
*   **Expected Outcome:** A robust database migration job manifest is ready.
*   **Coordination with Dev A:** Confirm the `npm run db:push` and `npm run seed` commands are correct and available in the application's `package.json`.

### **Week 1 - Day 4: Basic Skaffold Configuration (Part 1)**

*   **Goal:** Set up the initial Skaffold configuration to deploy only the database.
*   **Tasks:**
    1.  **Create `skaffold.yaml`:** Define the basic Skaffold configuration:
        *   `apiVersion` and `kind`.
        *   `build` section (initially empty or placeholder for `petstore` image).
        *   `deploy` section, listing *only* the PostgreSQL and migration job manifests.
        *   `portForward` section for PostgreSQL (5432).
        *   *Action:* `write_file` for `skaffold.yaml`
*   **Expected Outcome:** A minimal `skaffold.yaml` is created, capable of deploying the database.
*   **Coordination with Dev A:** Discuss the `skaffold.yaml` structure and how it will evolve to include the application later.

### **Week 1 - Day 5: Basic Skaffold Configuration (Part 2) & Local Testing**

*   **Goal:** Refine Skaffold and perform initial local deployment and testing of the database.
*   **Tasks:**
    1.  **Refine `skaffold.yaml`:**
        *   Add `profiles` section for `dev` (initially just for context).
        *   Ensure all `k8s` manifests created so far are listed in the `deploy` section.
        *   *Action:* `replace` or `write_file` for `skaffold.yaml`
    2.  **Generate Secrets:** Create base64 encoded values for `POSTGRES_PASSWORD` and `DATABASE_URL` (e.g., `echo -n "your_password" | base64`). Update `k8s/postgres-secret.yaml` with these values.
        *   *Action:* Manual step, then `replace` for `k8s/postgres-secret.yaml`
    3.  **Initial Local Testing:**
        *   Run `skaffold dev` to deploy the PostgreSQL database and migration job to the local Kubernetes cluster.
        *   Monitor logs to ensure the database starts and the migration job completes successfully.
        *   Verify PostgreSQL is accessible via `kubectl port-forward` or `psql` if needed.
*   **Expected Outcome:** The PostgreSQL database is successfully deployed and migrated in the local Kubernetes cluster using Skaffold.
*   **Coordination with Dev A:** Share the `DATABASE_URL` connection string (with `localhost` and port-forwarded port) for Dev A to use in their local server configuration for Sprint 1 Integration.
