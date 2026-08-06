import { describe, it, expect, vi } from 'vitest';
import { saveFileWithNativePicker } from '../lib/fileSaveHelper';

describe('fileSaveHelper Utility', () => {
  it('handles browser download fallback cleanly', async () => {
    const data = 'Line #,Manufacturer,Model\n1,Tula,M91/30';
    const result = await saveFileWithNativePicker(data, 'test.csv', 'CSV File', 'csv');
    expect(result).toBe(true);
  });
});
