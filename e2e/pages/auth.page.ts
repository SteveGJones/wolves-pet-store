import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AuthPage extends BasePage {
  readonly signInTab: Locator;
  readonly signUpTab: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly displayNameInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly passwordStrengthIndicator: Locator;
  readonly passwordRequirements: Locator;
  
  constructor(page: Page) {
    super(page);
    this.signInTab = page.getByRole('tab', { name: 'Sign In' });
    this.signUpTab = page.getByRole('tab', { name: 'Sign Up' });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.displayNameInput = page.getByLabel('Display Name');
    this.submitButton = page.getByRole('button', { name: /Sign (In|Up)/i });
    this.errorMessage = page.getByRole('alert');
    this.passwordStrengthIndicator = page.getByTestId('password-strength');
    this.passwordRequirements = page.getByTestId('password-requirements');
  }
  
  async goto() {
    await super.goto('/auth');
  }
  
  async switchToSignUp() {
    await this.signUpTab.click();
    await expect(this.displayNameInput).toBeVisible();
  }
  
  async switchToSignIn() {
    await this.signInTab.click();
    await expect(this.displayNameInput).not.toBeVisible();
  }
  
  async register(email: string, password: string, displayName: string) {
    await this.switchToSignUp();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.displayNameInput.fill(displayName);
    
    // Wait for password validation
    await this.page.waitForTimeout(500);
    
    await this.submitButton.click();
    
    // Wait for either success (redirect) or error
    await Promise.race([
      this.page.waitForURL('/', { timeout: 5000 }).catch(() => {}),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);
  }
  
  async login(email: string, password: string) {
    await this.switchToSignIn();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    
    // Wait for either success (redirect) or error
    await Promise.race([
      this.page.waitForURL('/', { timeout: 5000 }).catch(() => {}),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);
  }
  
  async expectSuccessfulAuth() {
    await this.expectToBeOnPage('/');
    // Check for user menu in navbar
    await expect(this.navbar.getByRole('button', { name: /user menu/i })).toBeVisible();
  }
  
  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
  
  async expectFieldError(field: 'email' | 'password' | 'displayName', message: string) {
    const input = field === 'email' ? this.emailInput 
                : field === 'password' ? this.passwordInput 
                : this.displayNameInput;
    
    const fieldError = input.locator('..').getByText(message);
    await expect(fieldError).toBeVisible();
  }
  
  async expectPasswordStrength(strength: 'weak' | 'medium' | 'strong') {
    await expect(this.passwordStrengthIndicator).toHaveAttribute('data-strength', strength);
  }
  
  async expectPasswordRequirement(requirement: string, met: boolean) {
    const reqElement = this.passwordRequirements.getByText(requirement);
    if (met) {
      await expect(reqElement).toHaveClass(/text-green/);
    } else {
      await expect(reqElement).toHaveClass(/text-red/);
    }
  }
  
  async logout() {
    // Click user menu
    await this.navbar.getByRole('button', { name: /user menu/i }).click();
    // Click logout option
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
    await this.waitForPageLoad();
  }
  
  async expectLoggedOut() {
    // Should see Sign In button in navbar
    await expect(this.navbar.getByRole('link', { name: 'Sign In' })).toBeVisible();
    // Should not see user menu
    await expect(this.navbar.getByRole('button', { name: /user menu/i })).not.toBeVisible();
  }
  
  async fillRegistrationForm(data: {
    email: string;
    password: string;
    displayName: string;
  }) {
    await this.switchToSignUp();
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.displayNameInput.fill(data.displayName);
  }
  
  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }
  
  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }
}