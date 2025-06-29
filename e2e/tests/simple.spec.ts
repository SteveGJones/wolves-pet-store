import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Just check that page loads without errors
    await expect(page).toHaveTitle(/Pet Store|Wolves/);
    
    // Check for basic navigation
    await expect(page.locator('nav')).toBeVisible();
  });
  
  test('should navigate to auth page', async ({ page }) => {
    await page.goto('/');
    
    // Look for sign in link or button
    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/\/auth/);
    } else {
      // Just navigate directly
      await page.goto('/auth');
      await expect(page).toHaveURL('/auth');
    }
  });
  
  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.locator('nav')).toBeVisible();
  });
});