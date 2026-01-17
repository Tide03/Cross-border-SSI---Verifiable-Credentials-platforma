// W3C Verifiable Credentials management
import * as kv from "./kv_store.tsx";
import * as did from "./did.tsx";
import { signData, hashData, generateId, verifySignature } from "./crypto.tsx";

export interface CredentialTemplate {
  id: string;
  name: string;
  description: string;
  issuerId: string;
  issuerDid: string;
  credentialSubject: {
    [key: string]: {
      type: string;
      label: string;
      required: boolean;
    };
  };
  createdAt: string;
}

export interface VerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

export interface CredentialRecord {
  id: string;
  templateId: string;
  credential: VerifiableCredential;
  learnerDid: string;
  issuerId: string;
  issuerDid: string;
  issuedAt: string;
  status: "active" | "revoked";
  credentialHash: string;
}

/**
 * Create a credential template
 */
export async function createTemplate(
  name: string,
  description: string,
  issuerId: string,
  issuerDid: string,
  credentialSubject: any
): Promise<CredentialTemplate> {
  const templateId = generateId();
  
  const template: CredentialTemplate = {
    id: templateId,
    name,
    description,
    issuerId,
    issuerDid,
    credentialSubject,
    createdAt: new Date().toISOString(),
  };
  
  await kv.set(`template:${templateId}`, template);
  
  // Add to issuer's templates list
  const issuerTemplates = await kv.get<string[]>(`issuer:${issuerId}:templates`) || [];
  issuerTemplates.push(templateId);
  await kv.set(`issuer:${issuerId}:templates`, issuerTemplates);
  
  return template;
}

/**
 * Get all templates for an issuer
 */
export async function getIssuerTemplates(issuerId: string): Promise<CredentialTemplate[]> {
  const templateIds = await kv.get<string[]>(`issuer:${issuerId}:templates`) || [];
  const templates: CredentialTemplate[] = [];
  
  for (const templateId of templateIds) {
    const template = await kv.get<CredentialTemplate>(`template:${templateId}`);
    if (template) {
      templates.push(template);
    }
  }
  
  return templates;
}

/**
 * Issue a verifiable credential
 */
export async function issueCredential(
  templateId: string,
  learnerDid: string,
  credentialData: any,
  issuerId: string,
  issuerDid: string,
  expirationDate?: string
): Promise<CredentialRecord> {
  // Get template
  const template = await kv.get<CredentialTemplate>(`template:${templateId}`);
  if (!template) {
    throw new Error("Template not found");
  }
  
  // Get issuer's private key
  const privateKey = await did.getPrivateKey(issuerDid, issuerId);
  if (!privateKey) {
    throw new Error("Issuer private key not found");
  }
  
  const credentialId = `urn:uuid:${generateId()}`;
  const issuedAt = new Date().toISOString();
  
  // Create W3C Verifiable Credential
  const credential: VerifiableCredential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    id: credentialId,
    type: ["VerifiableCredential", template.name.replace(/\s+/g, '')],
    issuer: issuerDid,
    issuanceDate: issuedAt,
    credentialSubject: {
      id: learnerDid,
      ...credentialData,
    },
  };
  
  if (expirationDate) {
    credential.expirationDate = expirationDate;
  }
  
  // Create proof (sign the credential)
  const proofValue = await signData(credential, privateKey);
  
  credential.proof = {
    type: "Ed25519Signature2020",
    created: issuedAt,
    verificationMethod: `${issuerDid}#key-1`,
    proofPurpose: "assertionMethod",
    proofValue,
  };
  
  // Calculate credential hash (for on-chain anchoring)
  const credentialHash = await hashData(credential);
  
  // Create credential record
  const credentialRecord: CredentialRecord = {
    id: credentialId,
    templateId,
    credential,
    learnerDid,
    issuerId,
    issuerDid,
    issuedAt,
    status: "active",
    credentialHash,
  };
  
  // Store credential
  await kv.set(`credential:${credentialId}`, credentialRecord);
  
  // Add to learner's credentials
  const learnerCredentials = await kv.get<string[]>(`learner:${learnerDid}:credentials`) || [];
  learnerCredentials.push(credentialId);
  await kv.set(`learner:${learnerDid}:credentials`, learnerCredentials);
  
  // Add to issuer's issued credentials
  const issuerCredentials = await kv.get<string[]>(`issuer:${issuerId}:credentials`) || [];
  issuerCredentials.push(credentialId);
  await kv.set(`issuer:${issuerId}:credentials`, issuerCredentials);
  
  return credentialRecord;
}

/**
 * Get credentials for a learner
 */
export async function getLearnerCredentials(learnerDid: string): Promise<CredentialRecord[]> {
  const credentialIds = await kv.get<string[]>(`learner:${learnerDid}:credentials`) || [];
  const credentials: CredentialRecord[] = [];
  
  for (const credentialId of credentialIds) {
    const credential = await kv.get<CredentialRecord>(`credential:${credentialId}`);
    if (credential) {
      credentials.push(credential);
    }
  }
  
  return credentials;
}

/**
 * Get credentials issued by an issuer
 */
export async function getIssuerCredentials(issuerId: string): Promise<CredentialRecord[]> {
  const credentialIds = await kv.get<string[]>(`issuer:${issuerId}:credentials`) || [];
  const credentials: CredentialRecord[] = [];
  
  for (const credentialId of credentialIds) {
    const credential = await kv.get<CredentialRecord>(`credential:${credentialId}`);
    if (credential) {
      credentials.push(credential);
    }
  }
  
  return credentials;
}

/**
 * Verify a credential
 */
export async function verifyCredential(credential: VerifiableCredential): Promise<{
  valid: boolean;
  checks: {
    signatureValid: boolean;
    issuerValid: boolean;
    notRevoked: boolean;
    notExpired: boolean;
  };
  error?: string;
}> {
  const checks = {
    signatureValid: false,
    issuerValid: false,
    notRevoked: false,
    notExpired: false,
  };
  
  try {
    // Check expiration
    if (credential.expirationDate) {
      const expirationDate = new Date(credential.expirationDate);
      const now = new Date();
      checks.notExpired = expirationDate > now;
    } else {
      checks.notExpired = true;
    }
    
    // Check revocation status
    const credentialRecord = await kv.get<CredentialRecord>(`credential:${credential.id}`);
    if (credentialRecord) {
      checks.notRevoked = credentialRecord.status === "active";
    } else {
      // Credential not found in our system, check revocation registry
      const revocationStatus = await kv.get<{ revoked: boolean }>(`revocation:${credential.id}`);
      checks.notRevoked = !revocationStatus?.revoked;
    }
    
    // Resolve issuer DID
    const issuerDid = credential.issuer;
    const issuerPublicKey = await did.getPublicKey(issuerDid);
    
    if (!issuerPublicKey) {
      return {
        valid: false,
        checks,
        error: "Issuer DID could not be resolved",
      };
    }
    checks.issuerValid = true;
    
    // Verify signature
    if (!credential.proof) {
      return {
        valid: false,
        checks,
        error: "Credential has no proof",
      };
    }
    
    const credentialWithoutProof = { ...credential };
    delete credentialWithoutProof.proof;
    
    checks.signatureValid = await verifySignature(
      credentialWithoutProof,
      credential.proof.proofValue,
      issuerPublicKey
    );
    
    const valid = checks.signatureValid && checks.issuerValid && checks.notRevoked && checks.notExpired;
    
    return {
      valid,
      checks,
    };
  } catch (error) {
    return {
      valid: false,
      checks,
      error: `Verification error: ${error}`,
    };
  }
}

/**
 * Revoke a credential
 */
export async function revokeCredential(credentialId: string, issuerId: string): Promise<void> {
  const credentialRecord = await kv.get<CredentialRecord>(`credential:${credentialId}`);
  
  if (!credentialRecord) {
    throw new Error("Credential not found");
  }
  
  if (credentialRecord.issuerId !== issuerId) {
    throw new Error("Unauthorized: Only the issuer can revoke this credential");
  }
  
  // Update credential status
  credentialRecord.status = "revoked";
  await kv.set(`credential:${credentialId}`, credentialRecord);
  
  // Add to revocation registry
  await kv.set(`revocation:${credentialId}`, {
    revoked: true,
    revokedAt: new Date().toISOString(),
    revokedBy: issuerId,
  });
}

/**
 * Get credential by ID
 */
export async function getCredential(credentialId: string): Promise<CredentialRecord | null> {
  return await kv.get<CredentialRecord>(`credential:${credentialId}`);
}
