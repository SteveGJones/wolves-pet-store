import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { AdminPage } from '../../pages/admin.page';
import { TestDataManager } from '../../utils/test-data-manager';

test.describe('Admin Access Control', () => {
  let authPage: AuthPage;
  let adminPage: AdminPage;
  let testDataManager: TestDataManager;
  let regularUser: any;
  let adminUser: any;
  
  test.beforeAll(async () => {
    testDataManager = new TestDataManager();
    
    // Create test users
    regularUser = await testDataManager.createTestUser({
      email: 'regular@example.com',
      password: 'TestPass123!',
      displayName: 'Regular User',
      isAdmin: false
    });
    
    adminUser = await testDataManager.createTestUser({
      email: 'admin@example.com',
      password: 'TestPass123!',
      displayName: 'Admin User',
      isAdmin: true
    });
  });
  
  test.afterAll(async () => {
    await testDataManager.cleanupTestData();
    await testDataManager.dispose();
  });
  
  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    adminPage = new AdminPage(page);
  });
  
  test('should deny access to admin routes for non-admin users', async ({ page }) => {
    // Login as regular user
    await authPage.goto();
    await authPage.login(regularUser.email, regularUser.password);
    
    // Try to access admin page
    await adminPage.goto();
    
    // Should be denied access
    await adminPage.expectAccessDenied();
    
    // Should not see admin dashboard
    await expect(adminPage.dashboardHeading).not.toBeVisible();
  });
  
  test('should redirect non-admin users to home page', async ({ page }) => {
    // Login as regular user
    await authPage.goto();
    await authPage.login(regularUser.email, regularUser.password);
    
    // Navigate to admin
    await page.goto('/admin');
    
    // Should be redirected to home or show access denied
    await expect(page).toHaveURL(/\/(home|$)|\/admin/);
    
    if (await page.url().includes('/admin')) {
      // If still on admin page, should show access denied
      await adminPage.expectAccessDenied();
    }
  });
  
  test('should allow admin users to access admin dashboard', async ({ page }) => {
    // Login as admin
    await authPage.goto();
    await authPage.login(adminUser.email, adminUser.password);
    
    // Navigate to admin
    await adminPage.goto();
    
    // Should see admin dashboard
    await adminPage.expectAdminDashboard();
    
    // Should see all admin tabs
    await expect(adminPage.petsTab).toBeVisible();
    await expect(adminPage.inquiriesTab).toBeVisible();
  });
  
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access admin without logging in
    await adminPage.goto();
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth.*redirect/);
  });
  
  test('should preserve admin route after login', async ({ page }) => {
    // Try to access admin without logging in
    await page.goto('/admin');
    
    // Should be on auth page with redirect parameter
    await expect(page).toHaveURL(/\/auth.*redirect.*admin/);
    
    // Login as admin
    await authPage.login(adminUser.email, adminUser.password);
    
    // Should be redirected back to admin
    await expect(page).toHaveURL('/admin');
    await adminPage.expectAdminDashboard();
  });
  
  test('should deny API access to non-admin users', async ({ page, context }) => {
    // Login as regular user
    await authPage.goto();
    await authPage.login(regularUser.email, regularUser.password);
    
    // Try to access admin API endpoints
    const adminEndpoints = [
      '/api/admin/pets',
      '/api/admin/inquiries',
      '/api/admin/users'
    ];
    
    for (const endpoint of adminEndpoints) {
      const response = await context.request.get(endpoint);
      expect(response.status()).toBe(403); // Forbidden
    }
  });
  
  test('should allow API access to admin users', async ({ page, context }) => {
    // Login as admin
    await authPage.goto();
    await authPage.login(adminUser.email, adminUser.password);
    
    // Navigate to ensure session is established
    await adminPage.goto();
    
    // Try to access admin API endpoints
    const adminEndpoints = [
      '/api/admin/pets',
      '/api/admin/inquiries'
    ];
    
    for (const endpoint of adminEndpoints) {
      const response = await context.request.get(endpoint);
      expect([200, 404]).toContain(response.status()); // OK or Not Found (but not Forbidden)
    }
  });
  
  test('should handle session expiration in admin area', async ({ page, context }) => {
    // Login as admin
    await authPage.goto();
    await authPage.login(adminUser.email, adminUser.password);
    await adminPage.goto();
    await adminPage.expectAdminDashboard();
    
    // Clear session cookies
    await context.clearCookies();
    
    // Try to perform admin action
    await adminPage.switchToPetsTab();
    
    // Should be redirected to login or show session expired message
    await Promise.race([
      expect(page).toHaveURL(/\/auth/),
      expect(page.getByText(/session expired|logged out/i)).toBeVisible()
    ]);
  });
  
  test('should check admin status on page load', async ({ page }) => {
    // Login as admin
    await authPage.goto();
    await authPage.login(adminUser.email, adminUser.password);
    await adminPage.goto();
    
    // Admin dashboard should load
    await adminPage.expectAdminDashboard();
    
    // Refresh page
    await page.reload();
    
    // Should still see admin dashboard
    await adminPage.expectAdminDashboard();
  });
  
  test('should show different navigation for admin users', async ({ page }) => {
    // First, check regular user navigation
    await authPage.goto();
    await authPage.login(regularUser.email, regularUser.password);
    
    // Should not see admin link in navigation
    await expect(page.getByRole('link', { name: /admin/i })).not.toBeVisible();
    
    // Logout and login as admin
    await authPage.logout();
    await authPage.login(adminUser.email, adminUser.password);
    
    // Should see admin link in navigation
    await expect(page.getByRole('link', { name: /admin/i })).toBeVisible();
  });
  
  test('should handle concurrent admin sessions', async ({ browser }) => {
    // Create two browser contexts (sessions)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    const authPage1 = new AuthPage(page1);
    const authPage2 = new AuthPage(page2);
    const adminPage1 = new AdminPage(page1);
    const adminPage2 = new AdminPage(page2);
    
    // Login as admin in both sessions
    await authPage1.goto();
    await authPage1.login(adminUser.email, adminUser.password);
    
    await authPage2.goto();
    await authPage2.login(adminUser.email, adminUser.password);
    
    // Both should be able to access admin dashboard
    await adminPage1.goto();
    await adminPage1.expectAdminDashboard();
    
    await adminPage2.goto();
    await adminPage2.expectAdminDashboard();
    
    // Clean up
    await context1.close();
    await context2.close();
  });
  
  test('should be accessible', async ({ page }) => {
    const { injectAxe, checkA11y } = await import('@axe-core/playwright');
    
    await authPage.goto();
    await authPage.login(adminUser.email, adminUser.password);
    await adminPage.goto();
    
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
});