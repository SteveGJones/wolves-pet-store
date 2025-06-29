import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.1 AA Compliance', () => {
  
  test('home page should pass accessibility audit', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('authentication page should pass accessibility audit', async ({ page }) => {
    await page.goto('/auth');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('should handle keyboard navigation through main interface', async ({ page }) => {
    await page.goto('/');
    
    // Start from the top of the page
    await page.keyboard.press('Tab');
    
    // Should be able to reach all interactive elements
    const focusableElements = await page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    let focusedElementsCount = 0;
    
    for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      if (focusedElement) {
        focusedElementsCount++;
      }
      await page.keyboard.press('Tab');
    }
    
    expect(focusedElementsCount).toBeGreaterThan(0);
  });
  
  test('should provide skip to main content link', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to focus first element (should be skip link)
    await page.keyboard.press('Tab');
    
    const skipLink = page.getByRole('link', { name: /skip.*main.*content/i });
    await expect(skipLink).toBeFocused();
    
    // Activate skip link
    await page.keyboard.press('Enter');
    
    // Should jump to main content
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeFocused();
  });
  
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    // Should have exactly one h1
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBe(1);
    
    // Check heading hierarchy
    let previousLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const currentLevel = parseInt(tagName.charAt(1));
      
      if (previousLevel > 0) {
        // Should not skip levels (h1 -> h3 is invalid)
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
      
      previousLevel = currentLevel;
    }
  });
  
  test('should provide alternative text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const ariaLabel = await image.getAttribute('aria-label');
      const ariaLabelledBy = await image.getAttribute('aria-labelledby');
      
      // Every image should have alt text or aria labeling
      expect(alt !== null || ariaLabel !== null || ariaLabelledBy !== null).toBeTruthy();
      
      // Alt text should not be empty for content images
      if (alt !== null) {
        // Decorative images can have empty alt text
        const isDecorative = await image.evaluate(el => 
          el.closest('[role="presentation"]') !== null ||
          el.getAttribute('role') === 'presentation'
        );
        
        if (!isDecorative) {
          expect(alt.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
  
  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('*')
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });
  
  test('should support zoom up to 200% without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    
    // Set zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });
    
    // Wait for reflow
    await page.waitForTimeout(500);
    
    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
  });
  
  test('should provide proper form labels and error messages', async ({ page }) => {
    await page.goto('/auth');
    
    // Check that all form inputs have labels
    const inputs = await page.locator('input, textarea, select').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Input should be labeled
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      const hasAriaLabel = ariaLabel !== null;
      const hasAriaLabelledBy = ariaLabelledBy !== null;
      
      // Don't rely solely on placeholder for labeling
      expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
    }
  });
  
  test('should announce form validation errors', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign/i });
    await submitButton.click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check for error messages with proper ARIA attributes
    const errorMessages = await page.locator('[role="alert"], .error-message, [aria-invalid="true"]').all();
    
    for (const errorMessage of errorMessages) {
      const isVisible = await errorMessage.isVisible();
      expect(isVisible).toBe(true);
      
      // Error should be associated with the field
      const describedBy = await errorMessage.getAttribute('aria-describedby');
      const role = await errorMessage.getAttribute('role');
      
      expect(role === 'alert' || describedBy !== null).toBeTruthy();
    }
  });
  
  test('modal dialogs should trap focus', async ({ page }) => {
    await page.goto('/');
    
    // Look for a modal trigger (like pet details or login)
    const modalTrigger = page.getByRole('button', { name: /view|details|login/i }).first();
    
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      
      // Wait for modal to open
      await page.waitForTimeout(500);
      
      const modal = page.getByRole('dialog');
      if (await modal.isVisible()) {
        // Tab through modal elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        // Focus should stay within modal
        const focusedElement = await page.evaluate(() => document.activeElement);
        const modalElement = await modal.elementHandle();
        
        const isWithinModal = await page.evaluate(([focused, modal]) => {
          return modal.contains(focused);
        }, [focusedElement, modalElement]);
        
        expect(isWithinModal).toBe(true);
        
        // Escape should close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    }
  });
  
  test('should provide clear focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Tab to the first focusable element
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement);
    
    if (focusedElement) {
      // Check computed styles for focus indicator
      const styles = await page.evaluate((element) => {
        const computed = window.getComputedStyle(element, ':focus');
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          outlineStyle: computed.outlineStyle,
          outlineColor: computed.outlineColor,
          boxShadow: computed.boxShadow
        };
      }, focusedElement);
      
      // Should have visible focus indicator
      const hasFocusIndicator = 
        styles.outline !== 'none' ||
        styles.outlineWidth !== '0px' ||
        styles.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBe(true);
    }
  });
  
  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
    
    // Should have at least some live regions for dynamic content
    if (liveRegions.length > 0) {
      for (const region of liveRegions) {
        const ariaLive = await region.getAttribute('aria-live');
        const role = await region.getAttribute('role');
        
        // Live regions should have proper values
        if (ariaLive) {
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }
        
        if (role) {
          expect(['status', 'alert', 'log']).toContain(role);
        }
      }
    }
  });
  
  test('should provide descriptive link text', async ({ page }) => {
    await page.goto('/');
    
    const links = await page.locator('a[href]').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaLabelledBy = await link.getAttribute('aria-labelledby');
      const title = await link.getAttribute('title');
      
      // Link should have descriptive text
      const linkText = text || ariaLabel || title;
      
      if (linkText) {
        // Avoid generic link text
        const genericTexts = ['click here', 'read more', 'more', 'link'];
        const isGeneric = genericTexts.some(generic => 
          linkText.toLowerCase().includes(generic)
        );
        
        expect(isGeneric).toBe(false);
      }
    }
  });
});