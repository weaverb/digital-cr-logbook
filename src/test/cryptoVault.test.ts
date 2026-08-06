import { describe, it, expect } from 'vitest';
import { 
  generate12WordSeed, 
  createEncryptedVaultArchive, 
  decryptVaultArchive 
} from '../lib/cryptoVault';

describe('BIP-39 Cryptographic Vault Subsystem', () => {
  it('generates a valid 12-word BIP-39 seed phrase', () => {
    const seed = generate12WordSeed();
    expect(seed).toHaveLength(12);
    expect(seed.every(word => typeof word === 'string' && word.length > 0)).toBe(true);
  });

  it('creates and decrypts encrypted vault archives (.crbk)', async () => {
    const seed = generate12WordSeed();
    const payload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      boundBookRecords: [],
      auditLogs: [],
      maintenanceRecords: [],
      rangeRecords: []
    };

    const blob = await createEncryptedVaultArchive(payload, seed);
    expect(blob).toBeInstanceOf(Blob);

    const arrayBuffer = await blob.arrayBuffer();
    const restoredPayload = await decryptVaultArchive(arrayBuffer, seed);
    expect(restoredPayload).toBeDefined();
  });
});
