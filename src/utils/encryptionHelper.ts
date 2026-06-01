import Aes from 'react-native-aes-crypto';

// ─── Encryption Config ───
const ALGORITHM = 'aes-256-cbc';
const KEY_SIZE = 256;
const ITERATIONS = 10000;

// ─── Secret key (production mein AWS Secrets Manager se aayegi) ───
const SECRET_PASSPHRASE = 'DRISHTI_SECURE_KEY_2024_OFFLINE';
const SALT = 'DRISHTI_SALT_v1';

export interface EncryptedPayload {
  cipher: string;
  iv: string;
}

// ─── Generate Encryption Key ───
async function generateKey(): Promise<string> {
  return await Aes.pbkdf2(SECRET_PASSPHRASE, SALT, ITERATIONS, KEY_SIZE);
}

// ─── Encrypt Data ───
export async function encryptData(plainText: string): Promise<EncryptedPayload> {
  try {
    const key = await generateKey();
    const iv = await Aes.randomKey(16);
    const cipher = await Aes.encrypt(plainText, key, iv, ALGORITHM);
    return { cipher, iv };
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
}

// ─── Decrypt Data ───
export async function decryptData(payload: EncryptedPayload): Promise<string> {
  try {
    const key = await generateKey();
    const plainText = await Aes.decrypt(
      payload.cipher,
      key,
      payload.iv,
      ALGORITHM,
    );
    return plainText;
  } catch (error) {
    throw new Error(`Decryption failed: ${error}`);
  }
}

// ─── Encrypt Attendance Record before saving ───
export async function encryptRecord(record: object): Promise<string> {
  try {
    const json = JSON.stringify(record);
    const { cipher, iv } = await encryptData(json);
    // Store as single string: iv:cipher
    return `${iv}:${cipher}`;
  } catch {
    // If encryption fails, return plain JSON (fallback)
    return JSON.stringify(record);
  }
}

// ─── Decrypt Attendance Record ───
export async function decryptRecord(encrypted: string): Promise<object> {
  try {
    const [iv, cipher] = encrypted.split(':');
    const json = await decryptData({ cipher, iv });
    return JSON.parse(json);
  } catch {
    // If decryption fails, try plain JSON parse (fallback)
    return JSON.parse(encrypted);
  }
}

// ─── Hash Employee ID (for privacy) ───
export async function hashEmpId(empId: string): Promise<string> {
  try {
    return await Aes.sha256(empId);
  } catch {
    return empId;
  }
}