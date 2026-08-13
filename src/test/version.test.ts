import { describe, it, expect } from 'vitest';
import { APP_VERSION, APP_NAME } from '../lib/version';

describe('Version Info', () => {
  it('exports valid APP_VERSION string', () => {
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('exports APP_NAME', () => {
    expect(APP_NAME).toBe('Curios & Relics Digital Logbook');
  });
});
