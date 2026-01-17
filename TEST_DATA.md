# Test JSON Podatki za SSI Microcredentials Demo

## 🎓 1. LEARNER - Test Poverilnica

Kopiraj to poverilnico v **Learner Dashboard** za "Share" - to je primer veljavne poverilnice:

```json
{
  "id": "urn:uuid:123e4567-e89b-12d3-a456-426614174000",
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1"
  ],
  "type": ["VerifiableCredential", "UniversityDegreeCredential"],
  "issuer": {
    "id": "did:key:z6Mkpe33Y5QJ5cVv9jMb5dkRwvouVM48kt2dn3TYxmfb7EfQ",
    "name": "University of Ljubljana"
  },
  "issuanceDate": "2025-06-15T12:00:00Z",
  "expirationDate": "2027-06-15T12:00:00Z",
  "credentialSubject": {
    "id": "did:key:z6MkhaXgBZDvotDkL5257faWxcqVsDPmRbqZ5rTsXN3Jfmjt",
    "name": "Jan Novak",
    "degree": {
      "type": "BachelorDegree",
      "name": "Bachelor of Science in Computer Science",
      "program": "Advanced Blockchain Technologies"
    },
    "graduationDate": "2025-06-15",
    "gpa": "9.2/10",
    "honors": "Summa Cum Laude"
  },
  "proof": {
    "type": "RsaSignature2018",
    "created": "2025-06-15T12:00:00Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:key:z6Mkpe33Y5QJ5cVv9jMb5dkRwvouVM48kt2dn3TYxmfb7EfQ#z6Mkpe33Y5QJ5cVv9jMb5dkRwvouVM48kt2dn3TYxmfb7EfQ",
    "signatureValue": "signature_value_here_base64_encoded"
  }
}
```

---

## 🏫 2. ISSUER - Template Specification

Ko klikneš **"Create Template"**, vpiši te podatke:

### Template 1: University Degree

**Template Name:**
```
University Bachelor Degree
```

**Description:**
```
Official bachelor degree credential issued by University of Ljubljana for computer science programs
```

**Credential Subject Fields (JSON):**
```json
{
  "studentName": {
    "type": "string",
    "label": "Student Full Name",
    "required": true
  },
  "degree": {
    "type": "string",
    "label": "Degree Type",
    "required": true,
    "enum": ["Bachelor", "Master", "PhD"]
  },
  "program": {
    "type": "string",
    "label": "Program Name",
    "required": true
  },
  "graduationDate": {
    "type": "date",
    "label": "Graduation Date",
    "required": true
  },
  "gpa": {
    "type": "string",
    "label": "GPA/Grade",
    "required": false
  },
  "honors": {
    "type": "string",
    "label": "Honors (if any)",
    "required": false
  }
}
```

---

### Template 2: Professional Certification

**Template Name:**
```
Blockchain Developer Certification
```

**Description:**
```
Professional certification for completed blockchain development course
```

**Credential Subject Fields (JSON):**
```json
{
  "developerName": {
    "type": "string",
    "label": "Developer Name",
    "required": true
  },
  "courseName": {
    "type": "string",
    "label": "Course Name",
    "required": true
  },
  "completionDate": {
    "type": "date",
    "label": "Completion Date",
    "required": true
  },
  "score": {
    "type": "number",
    "label": "Final Score (%)",
    "required": true
  },
  "skills": {
    "type": "string",
    "label": "Acquired Skills",
    "required": true
  },
  "certificateNumber": {
    "type": "string",
    "label": "Certificate Number",
    "required": true
  }
}
```

---

## 📦 3. ISSUER - Batch Issue JSON

Ko klikneš **"Batch Issue"**, kopiraj in prilagodi te podatke:

```json
[
  {
    "email": "miha.kovac@student.si",
    "data": {
      "studentName": "Miha Kovac",
      "degree": "Bachelor",
      "program": "Computer Science",
      "graduationDate": "2025-06-15",
      "gpa": "9.2/10",
      "honors": "Summa Cum Laude"
    },
    "expirationDate": "2027-06-15"
  },
  {
    "email": "marko.hrovat@student.si",
    "data": {
      "studentName": "Marko Hrovat",
      "degree": "Bachelor",
      "program": "Computer Science",
      "graduationDate": "2025-06-15",
      "gpa": "8.8/10",
      "honors": "Cum Laude"
    },
    "expirationDate": "2027-06-15"
  },
  {
    "email": "ana.novak@student.si",
    "data": {
      "studentName": "Ana Novak",
      "degree": "Master",
      "program": "Advanced Blockchain Technologies",
      "graduationDate": "2025-09-20",
      "gpa": "9.5/10",
      "honors": "Summa Cum Laude"
    },
    "expirationDate": "2028-09-20"
  }
]
```

---

## 4️⃣ 4. VERIFIER - Test Poverilnica za Preverjanje

Ko si kot **Verifier** in klikneš **"Paste JSON"**, kopiraj to:

```json
{
  "id": "urn:uuid:987e6543-e89b-12d3-a456-426614174999",
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "type": [
    "VerifiableCredential",
    "BlockchainCertification"
  ],
  "issuer": {
    "id": "did:key:z6Mkpe33Y5QJ5cVv9jMb5dkRwvouVM48kt2dn3TYxmfb7EfQ",
    "name": "Blockchain Academy"
  },
  "issuanceDate": "2025-11-10T10:30:00Z",
  "expirationDate": "2026-11-10T10:30:00Z",
  "credentialSubject": {
    "id": "did:key:z6MkhaXgBZDvotDkL5257faWxcqVsDPmRbqZ5rTsXN3Jfmjt",
    "developerName": "Andrej Jerič",
    "courseName": "Advanced Blockchain Development",
    "completionDate": "2025-11-10",
    "score": 94,
    "skills": "Solidity, Smart Contracts, DeFi, Web3.js",
    "certificateNumber": "CERT-2025-11-001"
  },
  "proof": {
    "type": "RsaSignature2018",
    "created": "2025-11-10T10:30:00Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:key:z6Mkpe33Y5QJ5cVv9jMb5dkRwvouVM48kt2dn3TYxmfb7EfQ#z6Mkpe33Y5QJ5cVv9jMb5dkRwvouVM48kt2dn3TYxmfb7EfQ",
    "signatureValue": "test_signature_valid_example"
  }
}
```

---

## 🔐 5. SELECTIVE DISCLOSURE - Test

Ko daješ **Share poverilnico**, to so atributi ki si jih lahko izbral:

**Attributes (najpomembnejši za delovanje):**
- ✅ `developerName` - ime
- ✅ `courseName` - kaj si se naučil
- ✅ `score` - ocena
- ❌ `certificateNumber` - lahko puste skrito (privacnost)
- ❌ `skills` - prav tako

**Purpose:** "Employment verification"
**Verifier Name:** "Google Ireland"

---

## 📝 NASVET ZA TESTIRANJE

### Test Case 1: Learner Share Flow
1. Kopiraj prvo poverilnico v dashboard
2. Klikni "Share"
3. Izberi samo `name`, `degree`, `program`
4. Potrdi consent
5. Prikaž QR kodo

### Test Case 2: Issuer Batch
1. Kopiraj batch JSON
2. Izberi template
3. Prilagodi email in imena na te
4. Klikni "Issue Batch"
5. Vidiš "Issued 3 out of 3 credentials"

### Test Case 3: Verifier Check
1. Kopiraj verification poverilnico
2. Vklopi kao Verifier
3. Paste JSON
4. Klikni "Verify"
5. Pričakuj všečne rezultate ✅

---

## 💾 Shrani si to lokalno:

```bash
# Če nimaš file, naredi:
nano test_data.json
# in kopiraj podatke zgoraj
```

Happy testing! 🚀
