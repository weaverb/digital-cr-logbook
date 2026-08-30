import type { BoundBookRecord, AuditLogEntry, MaintenanceRecord, RangeRecord } from '../types/logbook';
import { BIP39_ENGLISH_WORDLIST } from './bip39Wordlist';

// ---------------------------------------------------------------------------
// Key derivation parameters
// ---------------------------------------------------------------------------
// PBKDF2-HMAC-SHA256 is used for key derivation (no Argon2id -- that would
// require a new WASM dependency; see the PR description for the tradeoff).
// 600,000 iterations follows OWASP's 2023 guidance for PBKDF2-HMAC-SHA256.
const PBKDF2_ITERATIONS = 600_000;

// Iteration count used by every `.crbk` backup created before this fix.
// Kept ONLY so those older archives can still be restored -- see
// `decryptVaultArchive`'s fallback attempt below. Never used for new
// backups.
const LEGACY_PBKDF2_ITERATIONS = 100_000;

// ---------------------------------------------------------------------------
// Legacy (pre-fix) wordlist
// ---------------------------------------------------------------------------
// This was NOT the real BIP-39 English wordlist -- it was a custom 310-word
// subset with no checksum word, so a single mistyped word on manual
// re-entry couldn't be detected before attempting decryption. It has been
// replaced by the canonical 2048-word BIP-39 English wordlist
// (`./bip39Wordlist.ts`) for all new backups.
//
// It is kept here, clearly labelled as legacy, only so:
//   (a) tests can simulate a pre-fix backup, and
//   (b) `decryptVaultArchive`'s legacy fallback path (see below) remains
//       exercisable/documented.
// The wordlist itself is never consulted during decryption -- key
// derivation is just PBKDF2 over the joined word string, so it works
// regardless of which wordlist the words came from. What actually
// distinguishes a legacy backup is its PBKDF2 iteration count
// (`LEGACY_PBKDF2_ITERATIONS`, above).
const LEGACY_BIP39_WORDS_310 = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
  'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien',
  'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always',
  'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
  'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety',
  'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area',
  'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive',
  'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist',
  'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
  'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware',
  'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag',
  'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel',
  'base', 'basic', 'basket', 'battle', 'beach', 'beacon', 'beam', 'bear', 'beauty', 'because',
  'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench',
  'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bind', 'biology', 'bird',
  'birth', 'bitter', 'black', 'blade', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood',
  'blossom', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone',
  'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box',
  'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge',
  'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown',
  'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle',
  'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz',
  'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp',
  'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital',
  'captain', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash',
  'casino', 'castle', 'casual', 'cat', 'catalog', 'catch', 'category', 'cattle', 'cause', 'cave',
  'ceiling', 'celery', 'cement', 'census', 'century', 'cereal', 'certain', 'chair', 'chalk', 'champion',
  'change', 'chaos', 'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef'
];

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
 *
 * NOTE: a legacy (pre-fix) phrase will legitimately fail this check -- it
 * was never BIP-39-compliant to begin with. Callers should only surface
 * this as the *reason* for a failure after the actual decrypt (which falls
 * back to the legacy derivation) has also failed -- see
 * `decryptVaultArchive`.
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

// Derive an AES-GCM key from the seed phrase using PBKDF2-HMAC-SHA256. Key
// derivation itself doesn't care which wordlist the words came from -- it's
// just PBKDF2 over the joined word string -- so the same function serves
// both current and legacy backups; only the iteration count differs.
async function deriveKeyFromSeed(seedWords: string[], salt: Uint8Array, iterations: number): Promise<CryptoKey> {
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
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function buildEncryptedArchive(payload: VaultPayload, seedWords: string[], iterations: number): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromSeed(seedWords, salt, iterations);

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

/** Creates a new encrypted `.crbk` backup archive. Always uses the current
 * (600,000-iteration PBKDF2) derivation -- never the legacy one. */
export async function createEncryptedVaultArchive(
  payload: VaultPayload,
  seedWords: string[]
): Promise<Blob> {
  return buildEncryptedArchive(payload, seedWords, PBKDF2_ITERATIONS);
}

/**
 * Encrypts a `.crbk` archive using the legacy (100,000-iteration PBKDF2)
 * derivation. Exported ONLY so tests can construct a pre-fix-style backup
 * file to exercise `decryptVaultArchive`'s legacy fallback path. Never used
 * by the app's own backup flow -- new backups always go through
 * `createEncryptedVaultArchive`.
 */
export async function createLegacyEncryptedVaultArchiveForTesting(
  payload: VaultPayload,
  seedWords: string[]
): Promise<Blob> {
  return buildEncryptedArchive(payload, seedWords, LEGACY_PBKDF2_ITERATIONS);
}

/**
 * Re-creates the pre-fix (legacy) 12-word seed generation algorithm: a
 * modulo-biased random pick from the old 310-word subset, with no BIP-39
 * entropy/checksum scheme. Exported ONLY so tests can simulate a legacy
 * seed phrase; never used by the app's own backup flow.
 */
export function generateLegacySeedForTesting(): string[] {
  const words: string[] = [];
  const array = new Uint32Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    const index = array[i] % LEGACY_BIP39_WORDS_310.length;
    words.push(LEGACY_BIP39_WORDS_310[index]);
  }
  return words;
}

async function attemptDecrypt(
  ciphertext: Uint8Array,
  seedWords: string[],
  salt: Uint8Array,
  iv: Uint8Array,
  iterations: number
): Promise<VaultPayload> {
  const key = await deriveKeyFromSeed(seedWords, salt, iterations);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString) as VaultPayload;
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

  // Try the current, BIP-39-compliant derivation first -- this is what
  // every backup created by this version of the app uses. AES-GCM's
  // built-in auth tag means a wrong key/iteration-count reliably throws
  // here rather than silently returning garbage.
  try {
    return await attemptDecrypt(ciphertext, seedWords, salt, iv, PBKDF2_ITERATIONS);
  } catch {
    // Fall through and try the legacy derivation below.
  }

  // Backward compatibility: fall back to the legacy (100,000-iteration)
  // derivation used by backups created before this fix, so older `.crbk`
  // archives keep restoring.
  try {
    return await attemptDecrypt(ciphertext, seedWords, salt, iv, LEGACY_PBKDF2_ITERATIONS);
  } catch {
    // Both attempts failed -- fall through to the error reporting below.
  }

  // Neither derivation worked. Give the most specific, actionable error we
  // can, using the checksum to try to pinpoint a mistyped word.
  const checksumResult = await validateSeedPhraseChecksum(seedWords);
  if (!checksumResult.valid && checksumResult.error) {
    throw new Error(`Decryption failed: ${checksumResult.error}`);
  }
  throw new Error(
    'Decryption failed: the seed phrase does not match this backup file, or the file is corrupted.'
  );
}
