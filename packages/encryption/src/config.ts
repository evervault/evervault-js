const MAX_FILE_SIZE_IN_MB = 25 as const;

const encryptionConstants = {
  cipherAlgorithm: "aes-256-gcm" as const,
  keyLength: 32 as const, // bytes
  ivLength: 12 as const, // bytes
  authTagLength: 128 as const, // bits
  publicHash: "sha256" as const,
  versions: {
    NOC: "NOC" as const, // (Tk9D) NIST-P256 KDF
    BFS: "QkTC" as const, // (TENZ) NIST-P256 KDF with metadata
  },
  header: {
    iss: "evervault" as const,
    version: 1 as const,
  },
  maxFileSizeInMB: MAX_FILE_SIZE_IN_MB,
  maxFileSizeInBytes: MAX_FILE_SIZE_IN_MB * 1024 * 1024,
};

export type EncryptionSubConfig = typeof encryptionConstants & {
  publicKey?: string;
};

export const createEncryptionConfig = (publicKey?: string) =>
  ({
    ...encryptionConstants,
    publicKey,
  } satisfies EncryptionSubConfig);
