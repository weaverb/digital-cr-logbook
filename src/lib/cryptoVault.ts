import type { BoundBookRecord, AuditLogEntry, MaintenanceRecord, RangeRecord } from '../types/logbook';
import { BIP39_ENGLISH_WORDLIST } from './bip39Wordlist';

// ---------------------------------------------------------------------------
// Key derivation parameters
// ---------------------------------------------------------------------------
// PBKDF2-HMAC-SHA256 is used for key derivation (no Argon2id -- that would
// require a new WASM dependency; see the PR description for the tradeoff).
// 600,000 iterations follows OWASP's 2023 guidance for PBKDF2-HMAC-SHA256.
const PBKDF2_ITERATIONS = 600_000;

export interface VaultPayload {
  version: string;
  timestamp: string;
  boundBookRecords: BoundBookRecord[];
  auditLogs: AuditLogEntry[];
  maintenanceRecords: MaintenanceRecord[];
  rangeRecords: RangeRecord[];
}

export interface SeedPhraseValidationResult {
  valid: boolean;
  /** Human-readable, user-facing explanation of why validation failed. */
  error?: string;
  /** 1-based index of the specific word that looks wrong, when known. */
  invalidWordIndex?: number;
}

// ---------------------------------------------------------------------------
// BIP-39 bit-level helpers
// ---------------------------------------------------------------------------

function bytesToBinaryString(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) {
    out += byte.toString(2).padStart(8, '0');
  }
  return out;
}

/** SHA-256(entropy), returned as a binary string of the first `bitCount` bits. */
async function sha256ChecksumBits(entropy: Uint8Array, bitCount: number): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', entropy.buffer as ArrayBuffer);
  const hashBits = bytesToBinaryString(new Uint8Array(hashBuffer));
  return hashBits.slice(0, bitCount);
}

// ---------------------------------------------------------------------------
// Seed phrase generation (real BIP-39 entropy + checksum scheme)
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random, standards-compliant BIP-39 12-word
 * English seed phrase:
 *   1. 128 bits of random entropy.
 *   2. SHA-256(entropy); its first 4 bits become the checksum.
 *   3. entropy + checksum = 132 bits, split into twelve 11-bit groups.
 *   4. Each 11-bit group indexes into the canonical 2048-word wordlist.
 */
export async function generate12WordSeed(): Promise<string[]> {
  const entropy = crypto.getRandomValues(new Uint8Array(16)); // 128 bits
  const checksumBits = await sha256ChecksumBits(entropy, 4);
  const allBits = bytesToBinaryString(entropy) + checksumBits; // 132 bits

  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const bits11 = allBits.slice(i * 11, i * 11 + 11);
    const index = parseInt(bits11, 2);
    words.push(BIP39_ENGLISH_WORDLIST[index]);
  }
  return words;
}

/**
 * Validates a 12-word phrase against the real BIP-39 entropy/checksum
 * scheme. Used to give a specific, actionable error on restore instead of a
 * generic "decryption failed" -- e.g. catching a single mistyped word from
 * a paper backup before an (otherwise doomed) decrypt attempt is even made.
 */
export async function validateSeedPhraseChecksum(seedWords: string[]): Promise<SeedPhraseValidationResult> {
  if (seedWords.length !== 12) {
    return { valid: false, error: `Expected 12 words, but got ${seedWords.length}.` };
  }

  const indices: number[] = [];
  for (let i = 0; i < seedWords.length; i++) {
    const word = seedWords[i].toLowerCase().trim();
    const index = BIP39_ENGLISH_WORDLIST.indexOf(word);
    if (index === -1) {
      return {
        valid: false,
        invalidWordIndex: i + 1,
        error: `Word ${i + 1} ("${seedWords[i]}") doesn't look right -- check for a typo.`
      };
    }
    indices.push(index);
  }

  const bits = indices.map((index) => index.toString(2).padStart(11, '0')).join(''); // 132 bits
  const entropyBits = bits.slice(0, 128);
  const checksumBits = bits.slice(128);

  const entropyBytes = new Uint8Array(16);
  for (let i = 0; i < entropyBytes.length; i++) {
    entropyBytes[i] = parseInt(entropyBits.slice(i * 8, i * 8 + 8), 2);
  }

  const expectedChecksumBits = await sha256ChecksumBits(entropyBytes, 4);
  if (checksumBits !== expectedChecksumBits) {
    return {
      valid: false,
      error: 'Checksum failed -- one or more words may be mistyped or out of order. Double-check each word against your paper backup.'
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Key derivation & AES-256-GCM encrypt/decrypt
// ---------------------------------------------------------------------------

// Derive an AES-GCM key from the seed phrase using PBKDF2-HMAC-SHA256.
async function deriveKeyFromSeed(seedWords: string[], salt: Uint8Array): Promise<CryptoKey> {
  const seedString = seedWords.join(' ').toLowerCase().trim();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(seedString),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function createEncryptedVaultArchive(
  payload: VaultPayload,
  seedWords: string[]
): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromSeed(seedWords, salt);

  const encoder = new TextEncoder();
  const jsonString = JSON.stringify(payload);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(jsonString)
  );

  // Package format: [4 bytes MAGIC ("CRBK")] [16 bytes SALT] [12 bytes IV] [ENCRYPTED PAYLOAD]
  const magic = encoder.encode('CRBK');
  const combined = new Uint8Array(magic.length + salt.length + iv.length + encryptedBuffer.byteLength);

  combined.set(magic, 0);
  combined.set(salt, magic.length);
  combined.set(iv, magic.length + salt.length);
  combined.set(new Uint8Array(encryptedBuffer), magic.length + salt.length + iv.length);

  return new Blob([combined], { type: 'application/octet-stream' });
}

export async function decryptVaultArchive(
  fileBuffer: ArrayBuffer,
  seedWords: string[]
): Promise<VaultPayload> {
  const data = new Uint8Array(fileBuffer);
  const decoder = new TextDecoder();

  const magic = decoder.decode(data.slice(0, 4));
  if (magic !== 'CRBK') {
    throw new Error('Invalid vault file format. Missing CRBK header signature.');
  }

  const salt = data.slice(4, 20);
  const iv = data.slice(20, 32);
  const ciphertext = data.slice(32);

  try {
    const key = await deriveKeyFromSeed(seedWords, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      ciphertext.buffer as ArrayBuffer
    );
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as VaultPayload;
  } catch {
    // Decryption failed. Give the most specific, actionable error we can,
    // using the checksum to try to pinpoint a mistyped word.
    const checksumResult = await validateSeedPhraseChecksum(seedWords);
    if (!checksumResult.valid && checksumResult.error) {
      throw new Error(`Decryption failed: ${checksumResult.error}`);
    }
    throw new Error(
      'Decryption failed: the seed phrase does not match this backup file, or the file is corrupted.'
    );
  }
}
