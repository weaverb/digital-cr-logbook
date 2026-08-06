import type { BoundBookRecord, AuditLogEntry, MaintenanceRecord, RangeRecord } from '../types/logbook';

// BIP-39 12-word seed phrase generator (Standard English wordlist subset)
const BIP39_WORDS = [
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

export function generate12WordSeed(): string[] {
  const words: string[] = [];
  const array = new Uint32Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    const index = array[i] % BIP39_WORDS.length;
    words.push(BIP39_WORDS[index]);
  }
  return words;
}

// Derive AES-GCM key from seed phrase using PBKDF2
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
      iterations: 100000,
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

  const key = await deriveKeyFromSeed(seedWords, salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString) as VaultPayload;
}
