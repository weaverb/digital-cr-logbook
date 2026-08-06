import '@testing-library/jest-dom';

// Mock WebCrypto subtle API if needed in jsdom
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      subtle: {
        importKey: async () => ({}),
        deriveKey: async () => ({}),
        encrypt: async () => new Uint8Array([1, 2, 3, 4]).buffer,
        decrypt: async () => new TextEncoder().encode(JSON.stringify({ boundBookRecords: [], auditLogs: [] })).buffer
      }
    }
  });
}
