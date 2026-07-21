import { createCipheriv, createDecipheriv, createHash, createHmac } from "node:crypto";
import { customType } from "drizzle-orm/pg-core";

/**
 * Field-level encryption at rest for regulated PII (SEC-008).
 *
 * Columns like `iqama_number_enc` / `passport_number_enc` / `bank_iban_enc` are
 * encrypted with AES-256-GCM. The IV is *derived from the plaintext* (a
 * synthetic-IV / SIV construction), which makes the ciphertext DETERMINISTIC:
 * the same input always produces the same output. This is required because the
 * iqama column carries a uniqueness check (both at the application layer and a
 * Postgres unique index — migration 0009) and an equality lookup; a randomised
 * IV would break both. The trade-off is that equality of plaintexts is
 * observable through equality of ciphertexts — acceptable and necessary here.
 *
 * The value is stored as `MARKER + base64(iv || authTag || ciphertext)`. Values
 * without the marker are treated as legacy plaintext and passed through on read,
 * so pre-encryption rows keep working until the backfill runs
 * (`scripts/encrypt-pii-backfill.ts`).
 */

const MARKER = "encv1:";
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * Insecure, fixed key used ONLY for automated test runs so the codec is
 * exercised without every test environment having to provision a key. Every
 * other environment (production, preview, staging, local dev) MUST set
 * `FIELD_ENCRYPTION_KEY` — a missing key fails closed (DB-007) so PII is never
 * silently encrypted under a key committed to source control.
 */
const TEST_FALLBACK_KEY = "hrms-dev-only-insecure-field-encryption-key";

/** True only for automated test runs (vitest sets both of these). */
function isTestRun(): boolean {
  return process.env.NODE_ENV === "test" || !!process.env.VITEST;
}

let cachedKeys: { encKey: Buffer; ivKey: Buffer } | null = null;

function deriveKeys(): { encKey: Buffer; ivKey: Buffer } {
  if (cachedKeys) return cachedKeys;
  const raw = process.env.FIELD_ENCRYPTION_KEY?.trim();
  if (!raw && !isTestRun()) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY must be set to encrypt PII at rest (SEC-008). " +
        "Only automated test runs may omit it — set it in every deployed and local environment.",
    );
  }
  // Normalise any provided secret to a 32-byte master key, then derive two
  // independent subkeys (one for AES, one for the synthetic IV) via HMAC.
  const master = createHash("sha256").update(raw || TEST_FALLBACK_KEY).digest();
  const encKey = createHmac("sha256", master).update("hrms/field-enc/v1/enc").digest();
  const ivKey = createHmac("sha256", master).update("hrms/field-enc/v1/iv").digest();
  cachedKeys = { encKey, ivKey };
  return cachedKeys;
}

/** Encrypt a plaintext string to the marked, deterministic ciphertext form. */
export function encryptField(plaintext: string): string {
  const { encKey, ivKey } = deriveKeys();
  const iv = createHmac("sha256", ivKey).update(plaintext, "utf8").digest().subarray(0, IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", encKey, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return MARKER + Buffer.concat([iv, tag, ct]).toString("base64");
}

/**
 * Decrypt a stored value. Values lacking the marker are legacy plaintext and
 * are returned unchanged. A marked value that fails authentication throws —
 * that signals tampering or a wrong key and must not be silently swallowed.
 */
export function decryptField(stored: string): string {
  if (!stored.startsWith(MARKER)) return stored;
  const { encKey } = deriveKeys();
  const buf = Buffer.from(stored.slice(MARKER.length), "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", encKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** True if a stored value is already in encrypted form. */
export function isEncrypted(value: string): boolean {
  return value.startsWith(MARKER);
}

const isNil = (v: unknown): v is null | undefined => v === null || v === undefined;

/**
 * A Drizzle `text` column that transparently encrypts on write and decrypts on
 * read. Because the underlying storage is still `text` and the encryption is
 * deterministic, existing unique indexes and equality filters keep working.
 */
export const encryptedText = customType<{ data: string; driverData: string }>({
  dataType() {
    return "text";
  },
  toDriver(value) {
    return isNil(value) ? (value as unknown as string) : encryptField(value as string);
  },
  fromDriver(value) {
    return isNil(value) ? (value as unknown as string) : decryptField(value as string);
  },
});
