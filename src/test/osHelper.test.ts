import { describe, it, expect } from 'vitest';
import { isMac, hotkeyLabel } from '../lib/osHelper';

describe('OS Platform Helper Utility', () => {
  it('exports boolean isMac property', () => {
    expect(typeof isMac).toBe('boolean');
  });

  it('exports valid platform hotkeyLabel string (Ctrl+K or Cmd+K)', () => {
    expect(['Ctrl+K', 'Cmd+K']).toContain(hotkeyLabel);
  });
});
