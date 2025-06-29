# Branch Protection Rules Configuration

This document outlines the recommended branch protection rules for the Wolves Pet Store repository to ensure code quality and security.

## Overview

Branch protection rules enforce quality gates and prevent direct pushes to critical branches, ensuring all code goes through proper review and automated testing.

## Main Branch Protection (`main`)

### Required Status Checks
The following status checks must pass before merging:

```yaml
required_status_checks:
  strict: true  # Require branches to be up to date before merging
  contexts:
    # Main CI Pipeline
    - "CI Pipeline / code-quality"
    - "CI Pipeline / unit-tests" 
    - "CI Pipeline / integration-tests"
    - "CI Pipeline / build"
    
    # Security Scanning
    - "Security Scanning / dependency-scan"
    - "Security Scanning / code-analysis"
    - "Security Scanning / secret-scan"
    - "Security Scanning / container-scan"
    - "Security Scanning / kubernetes-security"
    
    # E2E Testing
    - "E2E Tests / e2e-tests (chromium)"
    - "E2E Tests / e2e-tests (firefox)"
    - "E2E Tests / e2e-tests (webkit)"
    - "E2E Tests / accessibility-tests"
    - "E2E Tests / performance-tests"
```

### Pull Request Requirements
```yaml
required_pull_request_reviews:
  required_approving_review_count: 2
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  require_review_from_code_owners: true
  dismissal_restrictions:
    teams: ["core-team"]
    users: ["project-lead"]
```

### Additional Restrictions
```yaml
restrictions:
  # Only allow these teams to push directly (for emergency fixes)
  push:
    teams: ["core-team"]
    users: ["project-lead"]
  
  # Allow these teams to create pull requests
  pull_request:
    teams: ["developers", "qa-team", "security-team"]

# General settings
enforce_admins: true
allow_force_pushes: false
allow_deletions: false
required_linear_history: true
```

## Development Branch Protection (`develop`)

### Required Status Checks
```yaml
required_status_checks:
  strict: true
  contexts:
    # Core CI checks (lighter than main)
    - "CI Pipeline / code-quality"
    - "CI Pipeline / unit-tests"
    - "CI Pipeline / integration-tests"
    
    # Security essentials
    - "Security Scanning / dependency-scan"
    - "Security Scanning / secret-scan"
    
    # Smoke tests only
    - "E2E Tests / e2e-tests (chromium)"
```

### Pull Request Requirements
```yaml
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: false
```

## Feature Branch Protection

### Naming Convention
Feature branches should follow the pattern:
- `feature/JIRA-123-feature-description`
- `bugfix/JIRA-456-bug-description`
- `hotfix/JIRA-789-critical-fix`

### Protection Rules
```yaml
# Apply to branches matching: feature/*, bugfix/*, hotfix/*
required_status_checks:
  strict: false  # Allow behind main for development speed
  contexts:
    - "CI Pipeline / code-quality"
    - "CI Pipeline / unit-tests"

required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: false
```

## Code Owners Configuration

Create a `.github/CODEOWNERS` file to automatically request reviews:

```
# Global owners
* @core-team

# Frontend code
/client/ @frontend-team @ui-ux-team

# Backend code  
/server/ @backend-team @api-team

# Database changes
/server/src/db/ @backend-team @dba-team
**/migrations/ @backend-team @dba-team

# Infrastructure
/k8s/ @devops-team @security-team
/.github/workflows/ @devops-team
/Dockerfile @devops-team

# Security-sensitive files
/server/src/auth/ @security-team
**/security.* @security-team

# Documentation
/docs/ @tech-writers @product-team
*.md @tech-writers

# E2E Tests
/e2e/ @qa-team @frontend-team

# Configuration
package.json @core-team
package-lock.json @core-team
tsconfig.json @core-team
```

## Repository Settings

### General Settings
```yaml
repository_settings:
  # Require signed commits
  require_signed_commits: true
  
  # Automatically delete head branches after merge
  delete_branch_on_merge: true
  
  # Allow squash merging only
  allow_merge_commit: false
  allow_squash_merge: true
  allow_rebase_merge: false
  
  # Require status checks to be up to date
  require_up_to_date_status_checks: true
```

### Security Settings
```yaml
security_settings:
  # Enable vulnerability alerts
  enable_vulnerability_alerts: true
  
  # Enable automated security updates
  enable_automated_security_fixes: true
  
  # Private vulnerability reporting
  enable_private_vulnerability_reporting: true
  
  # Dependency review
  enable_dependency_review: true
```

## Environment Protection Rules

### Staging Environment
```yaml
staging_environment:
  required_reviewers:
    teams: ["qa-team"]
  deployment_branch_policy:
    custom_branch_policies: true
    custom_branches: ["develop", "staging/*"]
  
  # Wait timer before deployment
  wait_timer: 0
  
  # Prevent secrets from being passed to forks
  prevent_secrets: true
```

### Production Environment
```yaml
production_environment:
  required_reviewers:
    teams: ["core-team", "security-team"]
    users: ["project-lead", "tech-lead"]
  
  deployment_branch_policy:
    custom_branch_policies: true
    custom_branches: ["main"]
  
  # Wait timer before production deployment
  wait_timer: 10  # 10 minutes
  
  # Prevent secrets from being passed to forks
  prevent_secrets: true
```

## Automation Rules

### Auto-merge Conditions
Enable auto-merge for dependabot PRs with these conditions:
```yaml
auto_merge_conditions:
  # Only for patch updates
  dependency_type: "patch"
  
  # Required checks must pass
  required_status_checks: true
  
  # Must have approval from security team
  required_reviewers: ["@security-team"]
  
  # Only during business hours
  schedule: "business_hours"
```

### Branch Cleanup
```yaml
branch_cleanup:
  # Delete branches after 30 days of inactivity
  stale_branch_deletion: 30
  
  # Exempt branches
  exempt_branches:
    - "main"
    - "develop"
    - "staging"
    - "hotfix/*"
```

## Implementation Steps

### 1. Enable Branch Protection for Main
```bash
# Using GitHub CLI
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Pipeline / code-quality","CI Pipeline / unit-tests","CI Pipeline / integration-tests","CI Pipeline / build","Security Scanning / dependency-scan","E2E Tests / e2e-tests (chromium)"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

### 2. Create CODEOWNERS File
```bash
# Create the CODEOWNERS file
cat > .github/CODEOWNERS << 'EOF'
# See content above
EOF
```

### 3. Configure Repository Settings
```bash
# Enable vulnerability alerts
gh api repos/:owner/:repo \
  --method PATCH \
  --field has_vulnerability_alerts=true \
  --field delete_branch_on_merge=true \
  --field allow_squash_merge=true \
  --field allow_merge_commit=false \
  --field allow_rebase_merge=false
```

### 4. Set Up Environment Protection
```bash
# Create staging environment
gh api repos/:owner/:repo/environments/staging \
  --method PUT \
  --field deployment_branch_policy='{"custom_branch_policies":true,"custom_branches":["develop"]}' \
  --field required_reviewers='[{"type":"Team","id":"qa-team"}]'

# Create production environment  
gh api repos/:owner/:repo/environments/production \
  --method PUT \
  --field deployment_branch_policy='{"custom_branch_policies":true,"custom_branches":["main"]}' \
  --field required_reviewers='[{"type":"Team","id":"core-team"}]' \
  --field wait_timer=10
```

## Monitoring and Maintenance

### Regular Reviews
- **Weekly**: Review failed status checks and blocked PRs
- **Monthly**: Review and update required status checks
- **Quarterly**: Review team permissions and code owners

### Metrics to Track
- Average PR merge time
- Number of status check failures
- Security scan failure rates
- Code owner response times
- Emergency override usage

### Alerts and Notifications
Set up alerts for:
- Failed status checks on main branch
- Emergency overrides of branch protection
- High-severity security scan failures
- Stale PRs waiting for review

## Troubleshooting

### Common Issues

**Status checks not appearing**
- Verify workflow names match exactly
- Check that workflows are triggered on PR events
- Ensure workflows complete successfully

**Reviews not being requested**
- Verify CODEOWNERS file syntax
- Check team membership
- Ensure reviewers have repository access

**Merges blocked unexpectedly**
- Check all required status checks are passing
- Verify branch is up to date with base
- Confirm all review requirements are met

### Emergency Procedures

**Critical Hotfix Process**
1. Create hotfix branch from main
2. Implement minimal fix
3. Request emergency review from core team
4. Use admin override if necessary
5. Deploy immediately
6. Create post-incident review

**Status Check Bypass**
Only core team members can bypass failed status checks:
1. Document reason for bypass
2. Create follow-up issue to fix root cause
3. Notify security team of bypass
4. Schedule immediate fix in next sprint

This branch protection strategy ensures code quality while maintaining development velocity and providing escape hatches for emergency situations.