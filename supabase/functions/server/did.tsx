// DID (Decentralized Identifier) management utilities
import * as kv from "./kv_store.tsx";
import { generateKeyPair, generateId } from "./crypto.tsx";

export interface DIDDocument {
  "@context": string[];
  id: string;
  controller: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk: JsonWebKey;
  }>;
  authentication: string[];
  assertionMethod: string[];
}

/**
 * Create a new DID and DID Document
 */
export async function createDID(userId: string): Promise<{
  did: string;
  didDocument: DIDDocument;
  privateKey: JsonWebKey;
}> {
  const keyPair = await generateKeyPair();
  const didId = generateId();
  
  // Using did:web method simulation (in production this would be a real did:web or did:ethr)
  const did = `did:web:ssi-platform.example:users:${didId}`;
  
  const didDocument: DIDDocument = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    id: did,
    controller: did,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyJwk: keyPair.publicKey,
      },
    ],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
  };

  // Store DID document
  await kv.set(`did:${did}`, didDocument);
  
  // Store private key securely (encrypted with user's key in production)
  await kv.set(`didkey:${did}`, {
    privateKey: keyPair.privateKey,
    userId,
  });

  return {
    did,
    didDocument,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Resolve a DID to its DID Document
 */
export async function resolveDID(did: string): Promise<DIDDocument | null> {
  const didDocument = await kv.get<DIDDocument>(`did:${did}`);
  return didDocument;
}

/**
 * Get private key for a DID (only for authorized operations)
 */
export async function getPrivateKey(did: string, userId: string): Promise<JsonWebKey | null> {
  const keyData = await kv.get<{ privateKey: JsonWebKey; userId: string }>(`didkey:${did}`);
  
  if (!keyData || keyData.userId !== userId) {
    return null;
  }
  
  return keyData.privateKey;
}

/**
 * Get public key from DID document
 */
export async function getPublicKey(did: string): Promise<JsonWebKey | null> {
  const didDocument = await resolveDID(did);
  
  if (!didDocument || !didDocument.verificationMethod || didDocument.verificationMethod.length === 0) {
    return null;
  }
  
  return didDocument.verificationMethod[0].publicKeyJwk;
}
