import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEscapeKey } from '../hooks/useEscapeKey';

describe('useEscapeKey Hook', () => {
  it('triggers onEscape callback when ESC key is pressed while open', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(onEscape, true));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onEscape callback when isOpen is false', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(onEscape, false));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(onEscape).not.toHaveBeenCalled();
  });
});
