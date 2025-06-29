import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly navbar: Locator;
  readonly footer: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.navbar = page.locator('nav');
    this.footer = page.locator('footer');
  }
  
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }
  
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('.loading-spinner', { state: 'hidden' }).catch(() => {});
  }
  
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }
  
  async expectToBeOnPage(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }
  
  async clickNavLink(text: string) {
    await this.navbar.getByRole('link', { name: text }).click();
    await this.waitForPageLoad();
  }
  
  async expectToast(message: string) {
    const toast = this.page.getByRole('alert').filter({ hasText: message });
    await expect(toast).toBeVisible();
  }
  
  async dismissToast() {
    await this.page.getByRole('alert').getByRole('button', { name: 'Close' }).click();
  }
  
  async checkAccessibility() {
    // This will be implemented with axe-core
    // Placeholder for now
  }
  
  async waitForApiResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string' 
          ? url.includes(urlPattern)
          : urlPattern.test(url);
      }
    );
  }
  
  async fillForm(fields: Record<string, string>) {
    for (const [field, value] of Object.entries(fields)) {
      const input = this.page.getByLabel(field);
      await input.fill(value);
    }
  }
  
  async selectOption(label: string, value: string) {
    await this.page.getByLabel(label).selectOption(value);
  }
  
  async uploadFile(label: string, filePath: string) {
    const fileInput = this.page.getByLabel(label);
    await fileInput.setInputFiles(filePath);
  }
  
  async expectFieldError(fieldName: string, errorMessage: string) {
    const field = this.page.getByLabel(fieldName);
    const error = field.locator('..').getByText(errorMessage);
    await expect(error).toBeVisible();
  }
  
  async expectNoErrors() {
    const errors = this.page.locator('.error-message, [role="alert"]');
    await expect(errors).toHaveCount(0);
  }
  
  async waitForLoadingToComplete() {
    // Wait for any loading indicators to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll(
        '.loading, .spinner, [data-loading="true"]'
      );
      return loadingElements.length === 0;
    });
  }
}