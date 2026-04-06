// RFC 6238 TOTP implementation using Web Crypto API only (no npm libs)

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Uint8Array {
  // Strip spaces, dashes, and padding
  const str = input.replace(/[\s=\-]/g, "").toUpperCase();
  const bytes = new Uint8Array(Math.floor((str.length * 5) / 8));
  let buffer = 0;
  let bitsLeft = 0;
  let byteIndex = 0;

  for (const char of str) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes[byteIndex++] = (buffer >> bitsLeft) & 0xff;
    }
  }
  return bytes.slice(0, byteIndex);
}

function numberToBuffer(n: number): ArrayBuffer {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // Write as big-endian 64-bit integer (number fits safely in 32-bit range for ~year 6000)
  view.setUint32(0, Math.floor(n / 0x100000000), false);
  view.setUint32(4, n >>> 0, false);
  return buf;
}

export async function generateTotpCode(secret: string): Promise<string> {
  if (!secret || secret.trim() === "") throw new Error("Empty secret");

  const secretBytes = base32Decode(secret);
  if (secretBytes.length === 0) throw new Error("Invalid base32 secret");

  const T = Math.floor(Date.now() / 1000 / 30);
  const Tbuffer = numberToBuffer(T);

  // Import secret as HMAC-SHA1 key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  // HMAC-SHA1(key, T)
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, Tbuffer);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmac[19] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = code % 1_000_000;
  return otp.toString().padStart(6, "0");
}

export function getSecondsRemaining(): number {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return 30 - (nowSeconds % 30);
}
