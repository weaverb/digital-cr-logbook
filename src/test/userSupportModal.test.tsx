import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserSupportModal } from '../components/UserSupportModal';

describe('UserSupportModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <UserSupportModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders support options, email address, dedicated system info section, and privacy banner', () => {
    render(
      <UserSupportModal isOpen={true} onClose={() => {}} />
    );

    expect(screen.getByText(/User Support & Assistance/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Offline & Privacy-First Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/System & Diagnostic Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Exact System Info to be Copied:/i)).toBeInTheDocument();
    expect(screen.getByText(/Option 1: Submit a GitHub Issue/i)).toBeInTheDocument();
    expect(screen.getByText(/Option 2: Direct Email Support/i)).toBeInTheDocument();
    expect(screen.getByText(/cr-logbook-support.vocalist722@passmail.net/i)).toBeInTheDocument();
  });

  it('displays the exact system information preview text inside the modal', () => {
    render(
      <UserSupportModal isOpen={true} onClose={() => {}} />
    );

    const sysInfoPreview = screen.getByText(/C&R Collector Digital Logbook Version:/i);
    expect(sysInfoPreview).toBeInTheDocument();
    expect(sysInfoPreview.tagName).toBe('PRE');
  });

  it('copies system information to clipboard when Copy System Info button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <UserSupportModal isOpen={true} onClose={() => {}} />
    );

    const copySysBtn = screen.getByText(/Copy System Info/i);
    fireEvent.click(copySysBtn);

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('C&R Collector Digital Logbook Version:'));
  });

  it('calls onClose when Close Window button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <UserSupportModal isOpen={true} onClose={onCloseMock} />
    );

    const closeBtn = screen.getByText(/Close Window/i);
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
