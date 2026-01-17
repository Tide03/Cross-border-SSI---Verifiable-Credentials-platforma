// Cryptographic utilities for SSI and Verifiable Credentials

/**
 * Generate a new DID keypair using Ed25519
 */
export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "Ed25519",
      namedCurve: "Ed25519",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKey: publicKeyJwk,
    privateKey: privateKeyJwk,
  };
}

/**
 * Sign data with a private key
 */
export async function signData(data: any, privateKeyJwk: JsonWebKey): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    {
      name: "Ed25519",
      namedCurve: "Ed25519",
    },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const signature = await crypto.subtle.sign("Ed25519", privateKey, dataBuffer);

  // Convert signature to base64
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray));

  return signatureBase64;
}

/**
 * Verify a signature
 */
export async function verifySignature(
  data: any,
  signature: string,
  publicKeyJwk: JsonWebKey
): Promise<boolean> {
  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      publicKeyJwk,
      {
        name: "Ed25519",
        namedCurve: "Ed25519",
      },
      false,
      ["verify"]
    );

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    // Convert base64 signature to ArrayBuffer
    const signatureString = atob(signature);
    const signatureArray = new Uint8Array(signatureString.length);
    for (let i = 0; i < signatureString.length; i++) {
      signatureArray[i] = signatureString.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      signatureArray,
      dataBuffer
    );

    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Generate a cryptographic hash of data
 */
export async function hashData(data: any): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  return hashHex;
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
