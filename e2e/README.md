# E2E Testing with Playwright

This directory contains end-to-end tests for the Wolves Pet Store application using Playwright.

## Setup

1. **Install Playwright browsers** (first time only):
   ```bash
   npm run playwright:install
   ```

2. **Ensure the application is running**:
   ```bash
   # Either run locally
   npm run dev
   
   # Or use Kubernetes
   skaffold dev --port-forward
   ```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test e2e/tests/auth/login.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

```
e2e/
├── tests/               # Test specifications
│   ├── auth/           # Authentication tests
│   ├── pets/           # Pet browsing/management tests
│   ├── admin/          # Admin functionality tests
│   └── accessibility/  # Accessibility tests
├── pages/              # Page Object Model classes
├── fixtures/           # Test data and fixtures
└── utils/              # Helper utilities
```

## Writing Tests

### Page Object Model
We use the Page Object Model pattern for maintainability:

```typescript
// pages/auth.page.ts
export class AuthPage extends BasePage {
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// tests/auth/login.spec.ts
test('should login successfully', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.goto();
  await authPage.login('user@example.com', 'password');
  await authPage.expectSuccessfulAuth();
});
```

### Test Data Management
Use the TestDataManager for creating test data:

```typescript
const testDataManager = new TestDataManager();
const testUser = await testDataManager.createTestUser({
  email: 'test@example.com',
  isAdmin: true
});
```

## Configuration

See `playwright.config.ts` for test configuration including:
- Timeouts
- Retries
- Parallel execution
- Browser settings
- Screenshot/video capture

## CI/CD Integration

Tests run automatically in CI with:
- Parallel execution across 3 workers
- Automatic retries on failure
- HTML and JSON reporting
- Screenshot capture on failure

## Debugging Failed Tests

1. **Check the HTML report**:
   ```bash
   npx playwright show-report
   ```

2. **Use trace viewer**:
   ```bash
   npx playwright show-trace trace.zip
   ```

3. **Check screenshots/videos** in `test-results/`

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Clean up test data** in afterEach/afterAll hooks
3. **Use explicit waits** instead of arbitrary timeouts
4. **Test user journeys**, not implementation details
5. **Keep tests independent** - each test should run in isolation
6. **Use meaningful test descriptions** that explain the expected behavior

## Accessibility Testing

All pages should pass WCAG 2.1 AA standards:

```typescript
test('should be accessible', async ({ page }) => {
  const { injectAxe, checkA11y } = await import('@axe-core/playwright');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Performance Testing

Monitor performance metrics during tests:

```typescript
const metrics = await page.evaluate(() => ({
  fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
  tti: performance.timing.domInteractive - performance.timing.navigationStart
}));
```