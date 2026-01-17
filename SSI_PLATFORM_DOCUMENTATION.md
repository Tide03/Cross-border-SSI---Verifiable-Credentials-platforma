# SSI Microcredentials Platform - Technical Documentation

## Overview

This is a fully functional **Self-Sovereign Identity (SSI)** platform for issuing, managing, sharing, and verifying **W3C Verifiable Credentials** using **Decentralized Identifiers (DIDs)**.

The platform demonstrates a standards-based approach to microcredentials that prioritizes:
- **User Control**: Learners own and control their credentials
- **Privacy**: Minimal personal data storage, selective disclosure support
- **Interoperability**: W3C VC and DID standards compliance
- **Trust**: Cryptographic verification instead of platform trust
- **Portability**: Credentials work across systems and borders

---

## Architecture

### Three-Tier Architecture
```
Frontend (React/Tailwind) → Server (Hono/Deno) → Database (Supabase KV Store)
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS v4
- Radix UI components
- QR Code generation (qrcode.react)
- Sonner for toast notifications

**Backend:**
- Supabase Edge Functions (Deno runtime)
- Hono web framework
- Web Crypto API for cryptographic operations
- Key-Value store for data persistence

**Cryptography:**
- Ed25519 digital signatures
- SHA-256 hashing
- W3C Verifiable Credentials Data Model
- DID:web method simulation

---

## Features

### 1. **Role-Based Access Control**

Three distinct user roles with separate dashboards:

#### Learner
- View all owned credentials
- Download credentials as JSON
- Generate QR codes for sharing
- See credential status (active/revoked)
- Check expiration dates

#### Issuer
- Create credential templates
- Define credential schemas
- Issue credentials to learners
- View all issued credentials
- Revoke credentials
- Manage learner directory

#### Verifier
- Paste or scan credentials
- Cryptographically verify credentials
- Check signature validity
- Verify issuer authenticity
- Confirm revocation status
- Validate expiration

### 2. **Self-Sovereign Identity (SSI)**

- Each user gets a unique **DID (Decentralized Identifier)**
- Private keys stored securely (encrypted in production)
- Public keys in DID documents for verification
- No central authority required for verification

### 3. **W3C Verifiable Credentials**

Credentials follow the W3C VC Data Model 1.0:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "urn:uuid:abc123",
  "type": ["VerifiableCredential", "BlockchainCertificate"],
  "issuer": "did:web:ssi-platform.example:users:issuer123",
  "issuanceDate": "2026-01-16T10:00:00Z",
  "expirationDate": "2027-01-16T10:00:00Z",
  "credentialSubject": {
    "id": "did:web:ssi-platform.example:users:learner456",
    "courseName": "Advanced Blockchain Development",
    "grade": "A",
    "completionDate": "2026-01-15"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-01-16T10:00:00Z",
    "verificationMethod": "did:web:ssi-platform.example:users:issuer123#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "base64EncodedSignature..."
  }
}
```

### 4. **Cryptographic Operations**

**Key Generation:**
- Ed25519 elliptic curve cryptography
- 256-bit keys for maximum security
- JWK (JSON Web Key) format

**Digital Signatures:**
- Sign credential payload with issuer's private key
- Base64-encoded signatures
- Verifiable with public key from DID document

**Verification Process:**
1. Extract credential data (without proof)
2. Resolve issuer's DID to get public key
3. Verify signature matches data and public key
4. Check revocation registry
5. Validate expiration date

### 5. **Credential Lifecycle**

```
Template Creation → Issuance → Active → Revocation (optional)
```

**Issuance Flow:**
1. Issuer selects template
2. Chooses learner from directory
3. Fills credential data
4. Sets optional expiration
5. System generates unique ID
6. Signs credential with issuer's key
7. Stores credential record
8. Links to learner's DID

**Revocation Flow:**
1. Issuer selects active credential
2. Confirms revocation action
3. Updates credential status
4. Adds entry to revocation registry
5. Future verifications fail

### 6. **Data Privacy**

**On-Chain (Simulated):**
- Credential hashes (for integrity)
- Revocation flags
- Issuer trust references
- NO personal data

**Off-Chain (KV Store):**
- Full credentials
- Templates
- User profiles (minimal)
- Audit logs

**Selective Disclosure:**
- Learners choose what to share
- QR codes contain full credential
- JSON export for programmatic sharing

---

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/signin` - Authenticate user
- `GET /auth/me` - Get current user
- `POST /auth/signout` - Sign out

### DID Management
- `GET /did/:did` - Resolve DID to DID document

### Templates (Issuer only)
- `POST /templates` - Create credential template
- `GET /templates` - Get issuer's templates

### Credentials
- `POST /credentials/issue` - Issue new credential (Issuer)
- `GET /credentials` - Get learner's credentials (Learner)
- `GET /credentials/issued` - Get issued credentials (Issuer)
- `GET /credentials/:id` - Get specific credential
- `POST /credentials/:id/revoke` - Revoke credential (Issuer)

### Verification
- `POST /verify` - Verify credential (Verifier)

### Learner Directory
- `GET /learners` - Get all learners (Issuer)

---

## Data Models

### User
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'issuer' | 'verifier';
  did: string;
  createdAt: string;
}
```

### DID Document
```typescript
{
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
```

### Credential Template
```typescript
{
  id: string;
  name: string;
  description: string;
  issuerId: string;
  issuerDid: string;
  credentialSubject: {
    [fieldName: string]: {
      type: string;
      label: string;
      required: boolean;
    };
  };
  createdAt: string;
}
```

### Credential Record
```typescript
{
  id: string;
  templateId: string;
  credential: VerifiableCredential;
  learnerDid: string;
  issuerId: string;
  issuerDid: string;
  issuedAt: string;
  status: 'active' | 'revoked';
  credentialHash: string;
}
```

---

## Security Considerations

### Production Requirements

⚠️ **This MVP is for demonstration purposes only. For production:**

1. **Key Management:**
   - Use Hardware Security Modules (HSM)
   - Encrypt private keys at rest
   - Implement key rotation
   - Use secure enclaves

2. **Authentication:**
   - Implement MFA (Multi-Factor Authentication)
   - Use OAuth 2.0 / OpenID Connect
   - Session management with refresh tokens
   - Rate limiting on auth endpoints

3. **Data Protection:**
   - Encrypt sensitive data
   - Use HTTPS/TLS everywhere
   - Implement GDPR compliance
   - Regular security audits

4. **DID Resolution:**
   - Use production DID methods (did:ethr, did:ion, did:key)
   - Implement DID document caching
   - Handle DID deactivation
   - Universal Resolver integration

5. **Blockchain Integration:**
   - Real on-chain anchoring (Ethereum, Polygon, etc.)
   - Gas optimization
   - Transaction batching
   - Event monitoring

6. **Compliance:**
   - eIDAS regulation (EU)
   - Know Your Customer (KYC)
   - Anti-Money Laundering (AML)
   - Qualified Electronic Signatures

---

## Usage Examples

### Example 1: University Issues Degree

```typescript
// 1. University creates template
{
  name: "Bachelor's Degree",
  description: "Official university degree credential",
  credentialSubject: {
    degreeName: { type: "string", label: "Degree Name", required: true },
    major: { type: "string", label: "Major", required: true },
    gpa: { type: "number", label: "GPA", required: true },
    graduationDate: { type: "date", label: "Graduation Date", required: true }
  }
}

// 2. University issues to student
{
  templateId: "template-abc123",
  learnerEmail: "student@example.com",
  credentialData: {
    degreeName: "Bachelor of Science",
    major: "Computer Science",
    gpa: 3.8,
    graduationDate: "2025-05-15"
  },
  expirationDate: null // Degrees don't expire
}

// 3. Student downloads credential
// 4. Employer verifies credential
```

### Example 2: Training Provider Issues Certificate

```typescript
// 1. Training org creates template
{
  name: "Blockchain Certification",
  description: "Professional blockchain development certificate",
  credentialSubject: {
    courseName: { type: "string", label: "Course", required: true },
    hoursCompleted: { type: "number", label: "Hours", required: true },
    assessmentScore: { type: "number", label: "Score", required: true }
  }
}

// 2. Issue to professional
{
  credentialData: {
    courseName: "Advanced Smart Contract Development",
    hoursCompleted: 40,
    assessmentScore: 95
  },
  expirationDate: "2027-01-16" // 1 year validity
}

// 3. Professional shares QR code at conference
// 4. Verifier scans and validates
```

---

## Standards Compliance

### W3C Verifiable Credentials Data Model 1.0
- ✅ `@context` field
- ✅ `id` field (unique identifier)
- ✅ `type` field (credential types)
- ✅ `issuer` field (DID)
- ✅ `issuanceDate` field
- ✅ `credentialSubject` field
- ✅ `proof` field (Ed25519Signature2020)

### W3C Decentralized Identifiers (DIDs) v1.0
- ✅ DID syntax: `did:method:identifier`
- ✅ DID documents with JSON-LD
- ✅ Verification methods
- ✅ Authentication relationships
- ✅ Assertion method relationships

### Ed25519 Signature Suite 2020
- ✅ Ed25519 key generation
- ✅ JWK format for keys
- ✅ Signature creation
- ✅ Signature verification

---

## Future Enhancements

### Phase 2
- [ ] Zero-Knowledge Proofs (ZKPs) for selective disclosure
- [ ] Credential schemas with JSON Schema
- [ ] Presentation exchange protocol
- [ ] DID:key and DID:ethr methods
- [ ] Mobile wallet integration

### Phase 3
- [ ] Ethereum blockchain anchoring
- [ ] IPFS storage for credentials
- [ ] Revocation lists on-chain
- [ ] Cross-border recognition framework
- [ ] European Blockchain Services Infrastructure (EBSI) integration

### Phase 4
- [ ] Machine-readable governance frameworks
- [ ] Automated trust registries
- [ ] Credential status list 2021
- [ ] DID comm messaging
- [ ] Holder binding with biometrics

---

## Comparison with Traditional Systems

| Feature | Traditional | SSI Platform |
|---------|------------|--------------|
| **Credential Storage** | Centralized database | User's wallet |
| **Verification** | Contact issuer | Cryptographic proof |
| **Portability** | Limited | Universal |
| **Privacy** | Low (full access) | High (selective disclosure) |
| **Trust Model** | Platform trust | Cryptographic trust |
| **Revocation** | Database deletion | Public registry |
| **Cross-border** | Complex | Standards-based |
| **User Control** | None | Full |

---

## Testing the Platform

### Create Test Users

1. **Learner Account**
   - Email: `learner@test.com`
   - Password: `password123`
   - Role: Learner

2. **Issuer Account**
   - Email: `issuer@university.edu`
   - Password: `password123`
   - Role: Issuer

3. **Verifier Account**
   - Email: `verifier@employer.com`
   - Password: `password123`
   - Role: Verifier

### Test Flow

1. Sign up as Issuer
2. Create a credential template
3. Sign up as Learner
4. As Issuer: Issue credential to Learner
5. As Learner: View credential, generate QR code
6. As Learner: Download credential JSON
7. Sign up as Verifier
8. As Verifier: Paste credential JSON and verify
9. As Issuer: Revoke the credential
10. As Verifier: Re-verify (should fail)

---

## Troubleshooting

### Common Issues

**Signature Verification Fails:**
- Check DID resolution
- Ensure credential hasn't been modified
- Verify issuer's key is correct

**Credential Not Found:**
- Check learner DID is correct
- Ensure credential was issued
- Verify user is logged in

**Cannot Issue Credential:**
- Ensure you're logged in as Issuer
- Check learner exists in system
- Validate JSON format

**QR Code Not Scanning:**
- Ensure credential is active
- Check QR code quality
- Try downloading JSON instead

---

## License & Attribution

This is a demonstration/prototype implementation of:
- W3C Verifiable Credentials Data Model
- W3C Decentralized Identifiers (DIDs)
- SSI principles and architecture

For production use, consult legal and compliance teams.

---

## Support & Resources

**W3C Standards:**
- https://www.w3.org/TR/vc-data-model/
- https://www.w3.org/TR/did-core/

**SSI Community:**
- DIF (Decentralized Identity Foundation)
- Trust over IP Foundation
- OpenID Foundation

**Implementation Guides:**
- VC-JWT specification
- DID Resolution specification
- Verifiable Presentations

---

**Last Updated:** January 16, 2026
**Version:** 1.0.0 (MVP)
