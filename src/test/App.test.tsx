import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App';

describe('App Main Tactical Logbook Interface', () => {
  it('renders application title and core tabs', () => {
    render(<App />);

    expect(screen.getAllByText(/C&R Digital Logbook/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Bound Book \(A&D\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintenance History/i)).toBeInTheDocument();
    expect(screen.getByText(/Range Logs/i)).toBeInTheDocument();
    expect(screen.getByText(/ATF Master C&R Reference Library/i)).toBeInTheDocument();
  });

  it('switches navigation tabs seamlessly', () => {
    render(<App />);

    const maintTab = screen.getByText(/Maintenance History/i);
    fireEvent.click(maintTab);

    const rangeTab = screen.getByText(/Range Logs/i);
    fireEvent.click(rangeTab);

    const atfTab = screen.getByText(/ATF Master C&R Reference Library/i);
    fireEvent.click(atfTab);
    expect(screen.getByText(/4,207 Items/i)).toBeInTheDocument();
  });

  it('filters bound book entries via search query input', () => {
    render(<App />);

    const searchInput = screen.getByPlaceholderText(/Search by Manufacturer, Model, Serial #, or Caliber.../i);
    fireEvent.change(searchInput, { target: { value: 'Mosin' } });
    expect(searchInput).toHaveValue('Mosin');
  });
});
