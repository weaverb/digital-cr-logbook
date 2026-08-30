import { describe, it, expect } from 'vitest';
import {
  generate12WordSeed,
  validateSeedPhraseChecksum,
  createEncryptedVaultArchive,
  createLegacyEncryptedVaultArchiveForTesting,
  generateLegacySeedForTesting,
  decryptVaultArchive
} from '../lib/cryptoVault';
import { BIP39_ENGLISH_WORDLIST } from '../lib/bip39Wordlist';

function samplePayload() {
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    boundBookRecords: [],
    auditLogs: [],
    maintenanceRecords: [],
    rangeRecords: []
  };
}

describe('BIP-39 wordlist', () => {
  it('has exactly 2048 entries', () => {
    expect(BIP39_ENGLISH_WORDLIST).toHaveLength(2048);
  });

  it('has no duplicate entries', () => {
    const unique = new Set(BIP39_ENGLISH_WORDLIST);
    expect(unique.size).toBe(2048);
  });

  it('contains only lowercase words', () => {
    expect(BIP39_ENGLISH_WORDLIST.every((w) => w === w.toLowerCase())).toBe(true);
  });
});

describe('BIP-39 Cryptographic Vault Subsystem', () => {
  it('generates a valid 12-word BIP-39 seed phrase from the canonical wordlist', async () => {
    const seed = await generate12WordSeed();
    expect(seed).toHaveLength(12);
    expect(seed.every((word) => typeof word === 'string' && word.length > 0)).toBe(true);
    expect(seed.every((word) => BIP39_ENGLISH_WORDLIST.includes(word))).toBe(true);
  });

  it('every generated phrase passes its own BIP-39 checksum validation', async () => {
    for (let i = 0; i < 25; i++) {
      const seed = await generate12WordSeed();
      const result = await validateSeedPhraseChecksum(seed);
      expect(result.valid).toBe(true);
    }
  });

  it('rejects a phrase containing a word that is not in the wordlist, localizing the bad word', async () => {
    const seed = await generate12WordSeed();
    const corrupted = [...seed];
    corrupted[6] = 'notarealbip39word';

    const result = await validateSeedPhraseChecksum(corrupted);
    expect(result.valid).toBe(false);
    expect(result.invalidWordIndex).toBe(7);
    expect(result.error).toMatch(/word 7/i);
  });

  it('rejects a phrase with a mistyped-but-valid word (checksum mismatch) with a clear error', async () => {
    const seed = await generate12WordSeed();

    // Swap one word for a different, still-valid wordlist entry so the
    // phrase is well-formed but its entropy (and therefore checksum) no
    // longer matches. A random substitution has only a 1-in-16 chance of
    // colliding onto a still-valid checksum, so try a few candidates to
    // keep this deterministic.
    let result;
    for (const replacement of BIP39_ENGLISH_WORDLIST) {
      if (replacement === seed[3]) continue;
      const corrupted = [...seed];
      corrupted[3] = replacement;
      result = await validateSeedPhraseChecksum(corrupted);
      if (!result.valid) break;
    }

    expect(result!.valid).toBe(false);
    expect(result!.error).toMatch(/checksum/i);
  });

  it('rejects a phrase that does not have 12 words', async () => {
    const result = await validateSeedPhraseChecksum(['abandon', 'ability']);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/12 words/i);
  });

  it('creates and decrypts encrypted vault archives (.crbk) with the current derivation', async () => {
    const seed = await generate12WordSeed();
    const payload = samplePayload();

    const blob = await createEncryptedVaultArchive(payload, seed);
    expect(blob).toBeInstanceOf(Blob);

    const arrayBuffer = await blob.arrayBuffer();
    const restoredPayload = await decryptVaultArchive(arrayBuffer, seed);
    expect(restoredPayload).toBeDefined();
    expect(restoredPayload.version).toBe(payload.version);
  });

  it('fails to decrypt with a wrong seed phrase, with a clear error message', async () => {
    const seed = await generate12WordSeed();
    const wrongSeed = await generate12WordSeed();
    const payload = samplePayload();

    const blob = await createEncryptedVaultArchive(payload, seed);
    const arrayBuffer = await blob.arrayBuffer();

    await expect(decryptVaultArchive(arrayBuffer, wrongSeed)).rejects.toThrow(/decryption failed/i);
  });

  it('restores a legacy-format (pre-fix, 310-word, 100k-iteration) backup via the fallback path', async () => {
    const legacySeed = generateLegacySeedForTesting();
    const payload = samplePayload();

    const blob = await createLegacyEncryptedVaultArchiveForTesting(payload, legacySeed);
    const arrayBuffer = await blob.arrayBuffer();

    const restoredPayload = await decryptVaultArchive(arrayBuffer, legacySeed);
    expect(restoredPayload).toBeDefined();
    expect(restoredPayload.version).toBe(payload.version);
  }, 20000);
});
