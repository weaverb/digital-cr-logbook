import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CfrLink, AtfRulingLink, CFR_27_478_125F_URL, ATF_RULING_2016_1_URL } from '../lib/legalLinks';

describe('Legal Links Subsystem (DRY Regulation Hyperlinks)', () => {
  it('exports authoritative regulation URLs', () => {
    expect(CFR_27_478_125F_URL).toContain('ecfr.gov');
    expect(ATF_RULING_2016_1_URL).toContain('atf.gov');
  });

  it('renders CfrLink anchor with target=_blank and correct href', () => {
    render(<CfrLink />);
    const link = screen.getByRole('link', { name: /27 CFR § 478.125\(f\)/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', CFR_27_478_125F_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders AtfRulingLink anchor with target=_blank and correct href', () => {
    render(<AtfRulingLink />);
    const link = screen.getByRole('link', { name: /ATF Ruling 2016-1/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', ATF_RULING_2016_1_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('supports custom text and class names', () => {
    render(<CfrLink text="Custom CFR Text" className="custom-class" />);
    const link = screen.getByRole('link', { name: /Custom CFR Text/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass('custom-class');
  });
});
