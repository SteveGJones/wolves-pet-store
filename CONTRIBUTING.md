# Contributing to Wolves Pet Store

Thank you for your interest in contributing to Wolves Pet Store! This document provides guidelines and information for contributors.

## 🎯 Project Goals

This project serves as a demonstration of:
- Modern full-stack web development patterns
- Industry-standard authentication and security practices
- Container-first development with Kubernetes
- Comprehensive testing strategies
- Offline-capable development workflows

## 🏗️ Development Setup

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- Kubernetes cluster (minikube recommended for local development)
- Skaffold for development workflow
- Git for version control

### First-Time Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/wolves-pet-store.git
   cd wolves-pet-store
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Start Kubernetes development environment
   skaffold dev --port-forward
   ```

4. **Initialize database**
   ```bash
   # Run migrations
   npm run db:push
   
   # Create admin user
   npm run create-admin -- --email dev@example.com
   ```

5. **Verify setup**
   ```bash
   # Run tests
   npm run test:unit
   
   # Check build
   npm run build
   ```

## 📋 Development Workflow

### Branch Strategy
- `main` - Production-ready code, protected branch
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Feature Development Process

1. **Create feature branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Development workflow**
   ```bash
   # Start development environment
   skaffold dev --port-forward
   
   # Make your changes
   # Test your changes
   npm run test
   
   # Ensure build works
   npm run build
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Keep your branch updated**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

5. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request through GitHub interface
   ```

### Sprint Documentation Requirements

All developers must create sprint summaries at the completion of each sprint or significant development milestone.

#### Sprint Summary Template
Create files in the `plan/` directory using the naming convention: `dev-{role}-sprint-{number}-summary.md`

**Required Sections:**
```markdown
# Dev {Role} - Sprint {Number} Summary

**Sprint Duration:** [Date Range]
**Developer:** [Name/Role]
**Sprint Goal:** [Brief description]

## Sprint Objectives
- [List of planned objectives]

## Completed Tasks
### ✅ Task Name
- **Status:** Completed/In Progress/Blocked
- **Description:** [What was accomplished]
- **Key Changes:** [Important implementation details]
- **Files Modified:** [List of files changed]

## Technical Implementation Details
[Architecture decisions, patterns used, integration details]

## Testing Status
[Test coverage, types of tests created, testing strategy]

## Integration Notes
[How changes integrate with other components/services]

## Next Steps for Future Sprints
[Dependencies, follow-up work, recommendations]

## Sprint Reflection
[Challenges faced, lessons learned, process improvements]
```

#### When to Create Sprint Summaries
- **End of each sprint cycle**
- **Major feature completion**
- **Before switching to different development areas**
- **When other developers need to understand your work**
- **Before extended time away from the project**

#### Sprint Summary Standards
- **Be comprehensive** - Include all significant changes and decisions
- **Document rationale** - Explain why certain approaches were taken
- **List dependencies** - Note what other work depends on your changes
- **Include examples** - Code snippets for key implementations
- **Note blockers** - Document any impediments or dependencies
- **Plan ahead** - Outline next steps and recommendations

## 🧪 Testing Requirements

### Test Coverage Standards
- **Minimum 80% code coverage** for new features
- **Unit tests required** for all business logic
- **Integration tests required** for API endpoints
- **E2E tests required** for critical user flows

### Running Tests

```bash
# Unit tests (fastest)
npm run test:unit

# Integration tests (requires database)
VITEST_INTEGRATION=true npm run test

# All tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Structure
```
component/
├── Component.tsx
├── Component.test.tsx     # Unit tests
├── Component.integration.test.tsx  # Integration tests
└── Component.e2e.test.tsx # End-to-end tests
```

### Writing Tests

#### Unit Tests
```typescript
// Good: Tests behavior, not implementation
describe('Authentication', () => {
  it('should hash passwords securely', async () => {
    const password = 'TestPass123!';
    const hash = await hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(await validatePassword(password, hash)).toBe(true);
  });
});
```

#### Integration Tests
```typescript
// Good: Tests API endpoints with real database
describe('POST /api/auth/register', () => {
  it('should create new user with valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
        displayName: 'Test User'
      })
      .expect(201);

    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

## 💻 Code Standards

### TypeScript
- **Strict mode enabled** - All code must pass TypeScript compilation
- **Explicit types** - Avoid `any`, prefer specific types
- **Interface over type** - Use interfaces for object shapes
- **Consistent naming** - camelCase for variables, PascalCase for components

### React Components
```typescript
// Good: Functional component with proper typing
interface PetCardProps {
  pet: Pet;
  onAdopt: (petId: string) => void;
}

export function PetCard({ pet, onAdopt }: PetCardProps) {
  return (
    <div className="pet-card">
      <h3>{pet.name}</h3>
      <button onClick={() => onAdopt(pet.id)}>
        Adopt {pet.name}
      </button>
    </div>
  );
}
```

### API Endpoints
```typescript
// Good: Proper error handling and validation
app.post('/api/pets', isAuthenticated, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        error: "Admin access required",
        code: "ADMIN_REQUIRED" 
      });
    }

    const validatedData = insertPetSchema.parse(req.body);
    const pet = await createPet(validatedData);
    
    res.status(201).json({ pet });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input data",
        code: "VALIDATION_ERROR",
        details: error.errors
      });
    }
    
    console.error('Pet creation error:', error);
    res.status(500).json({
      error: "Failed to create pet",
      code: "CREATION_ERROR"
    });
  }
});
```

### Database Operations
```typescript
// Good: Proper error handling and transactions
export async function createUser(userData: CreateUserData): Promise<User> {
  const hashedPassword = await hashPassword(userData.password);
  
  const [user] = await db.insert(users).values({
    id: generateUserId(),
    email: userData.email,
    password: hashedPassword,
    displayName: userData.displayName,
  }).returning({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    isAdmin: users.isAdmin,
    createdAt: users.createdAt
  });
  
  return user;
}
```

## 🎨 UI/UX Guidelines

### Design System
- **Radix UI Components** - Use existing component library
- **Tailwind CSS** - Utility-first styling approach
- **Consistent Spacing** - Use Tailwind spacing scale
- **Accessible Design** - Follow WCAG 2.1 AA guidelines

### Component Structure
```typescript
// Good: Consistent component pattern
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks at the top
  const [state, setState] = useState();
  const query = useQuery();
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Handler logic
  }, [dependency]);
  
  // Early returns for loading/error states
  if (query.isLoading) return <Skeleton />;
  if (query.error) return <ErrorMessage />;
  
  // Main render
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
}
```

## 🚀 Infrastructure & DevOps

### Kubernetes Development
```bash
# Start development environment
skaffold dev --port-forward

# Check pod status
kubectl get pods

# View logs
kubectl logs -f deployment/petstore-app

# Access database
kubectl port-forward svc/postgres 5432:5432
```

### Docker Best Practices
- **Multi-stage builds** for optimized production images
- **Non-root user** for security
- **Layer caching** for faster builds
- **Health checks** for container orchestration

### Environment Configuration
```bash
# Development
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/petstore_dev

# Production
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@postgres:5432/petstore
SESSION_SECRET=secure-random-string
```

## 📖 Documentation Standards

### Code Documentation
```typescript
/**
 * Creates a new user account with hashed password
 * @param userData - User registration data
 * @returns Promise<User> - Created user without password
 * @throws {ValidationError} - When input data is invalid
 * @throws {DuplicateError} - When email already exists
 */
export async function createUser(userData: CreateUserData): Promise<User> {
  // Implementation
}
```

### API Documentation
- **OpenAPI/Swagger** - Document all endpoints
- **Request/Response examples** - Include sample data
- **Error codes** - Document all possible error responses
- **Authentication requirements** - Specify auth needs

### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(auth): implement password reset functionality
fix(api): resolve duplicate email validation
docs(readme): update setup instructions
test(auth): add password validation tests
refactor(db): optimize user query performance
```

## 🔍 Code Review Process

### Pull Request Requirements
- [ ] **Tests pass** - All tests must pass
- [ ] **Coverage maintained** - No decrease in test coverage
- [ ] **Documentation updated** - README, API docs, etc.
- [ ] **Type safety** - TypeScript compilation successful
- [ ] **Linting passes** - Code style standards met
- [ ] **Feature complete** - All acceptance criteria met

### Review Checklist
- **Functionality** - Does the code work as intended?
- **Security** - Are there any security vulnerabilities?
- **Performance** - Are there any performance concerns?
- **Maintainability** - Is the code readable and maintainable?
- **Testing** - Are the tests comprehensive and meaningful?

## 🐛 Bug Reports

### Bug Report Template
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
Description of expected behavior

## Actual Behavior
Description of actual behavior

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js version: [e.g. 20.0.0]
- App version: [e.g. 1.2.3]

## Additional Context
Any other context about the problem
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the desired feature

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches considered

## Additional Context
Screenshots, mockups, or other context
```

## 🛡️ Security Guidelines

### Security Practices
- **Input validation** - Validate all user inputs
- **SQL injection prevention** - Use parameterized queries
- **XSS prevention** - Sanitize user content
- **CSRF protection** - Implement CSRF tokens
- **Rate limiting** - Prevent abuse
- **Secure headers** - Use security middleware

### Reporting Security Issues
- **Do not** create public issues for security vulnerabilities
- **Email** security@example.com with details
- **Include** steps to reproduce and potential impact
- **Allow** reasonable time for response and fix

## 📞 Getting Help

### Resources
- **Documentation** - Check README and docs/ directory
- **Issues** - Search existing issues for solutions
- **Discussions** - Use GitHub Discussions for questions
- **Chat** - Join project Discord/Slack (if available)

### Effective Questions
1. **Search first** - Check existing documentation and issues
2. **Be specific** - Include error messages and context
3. **Include environment** - OS, Node.js version, etc.
4. **Minimal reproduction** - Provide smallest failing example
5. **Expected vs actual** - Clearly describe the problem

## 🙏 Recognition

Contributors will be recognized in:
- **CONTRIBUTORS.md** - All contributors listed
- **Release notes** - Major contributions highlighted
- **GitHub insights** - Automatic contribution tracking
- **Project presentations** - Contributors acknowledged

Thank you for contributing to Wolves Pet Store! Your efforts help make this project a valuable demonstration of modern development practices.