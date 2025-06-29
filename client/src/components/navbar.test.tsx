import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from './navbar';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock wouter's useLocation and Link
let mockLocationValue = '/'; // Default location
const mockNavigate = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => [mockLocationValue, mockNavigate],
  Link: vi.fn(({ children, href }) => <a href={href}>{children}</a>),
}));

describe('Navbar', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockNavigate.mockReset();
    mockLocationValue = '/'; // Reset location for each test
  });

  it('renders the Navbar with Shop link when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
    });

    render(<Navbar />);

    expect(screen.getByText('Wolves Pet Store')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Admin/i })).not.toBeInTheDocument();
  });

  it('renders the Navbar with user dropdown when authenticated as regular user', () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: 'Test User', email: 'test@example.com', isAdmin: false },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });

    render(<Navbar />);

    expect(screen.getByText('Wolves Pet Store')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument(); // Avatar fallback text
    expect(screen.queryByRole('button', { name: /Admin/i })).not.toBeInTheDocument();
  });

  it('renders the Navbar with Admin link when authenticated as admin user', () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: 'Admin User', email: 'admin@example.com', isAdmin: true },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });

    render(<Navbar />);

    expect(screen.getByRole('link', { name: 'Shop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      logout: vi.fn(),
    });

    render(<Navbar />);

    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
    expect(screen.queryByText('Wolves Pet Store')).toBeInTheDocument(); // Still renders the main title
  });

  it('calls logout when Log out is clicked', async () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { displayName: 'Test User', email: 'test@example.com', isAdmin: false },
      isAuthenticated: true,
      isLoading: false,
      logout: mockLogout,
    });

    render(<Navbar />);

    // Open the dropdown menu by clicking the Avatar button
    await userEvent.click(screen.getByRole('button', { name: 'T' }));

    // Wait for the logout item to be in the document and then click it
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('highlights Shop link when on home page', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
    });
    mockLocationValue = '/'; // Set location for this test

    render(<Navbar />);
    const shopButton = screen.getByRole('link', { name: 'Shop' }).querySelector('button');
    expect(shopButton).toHaveClass('bg-wolves-gold/20');
  });

  it('highlights Admin link when on admin page', () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: 'Admin User', email: 'admin@example.com', isAdmin: true },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
    mockLocationValue = '/admin'; // Set location for this test

    render(<Navbar />);
    const adminButton = screen.getByRole('button', { name: /Admin/i });
    expect(adminButton).toHaveClass('bg-wolves-gold/20');
  });
});