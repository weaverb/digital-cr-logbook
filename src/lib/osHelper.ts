export const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent || '');
export const hotkeyLabel = isMac ? 'Cmd+K' : 'Ctrl+K';
