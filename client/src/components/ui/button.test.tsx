import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { describe, it, expect } from 'vitest';

describe('Button', () => {
  it('renders the button with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders the button with a specific variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-destructive'); // Assuming 'bg-destructive' is applied for 'destructive' variant
  });

  it('renders the button as a link when asChild is true and href is provided', () => {
    render(<Button asChild><a href="/test">Link Button</a></Button>);
    const linkButton = screen.getByRole('link', { name: 'Link Button' });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute('href', '/test');
  });
});
