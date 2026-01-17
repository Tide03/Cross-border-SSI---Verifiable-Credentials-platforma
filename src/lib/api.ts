// Local-only “backend” implemented with localStorage so the app works offline
// and without Supabase. Data persists in the browser.

type Role = 'learner' | 'issuer' | 'verifier';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  did: string;
  createdAt: string;
}

interface CredentialTemplate {
  id: string;
  name: string;
  description: string;
  issuerId: string;
  issuerDid: string;
  credentialSubject: Record<string, { type: string; label: string; required: boolean }>;
  createdAt: string;
}

interface VerifiableCredential {
  '@context': string[];
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

interface CredentialRecord {
  id: string; // record id
  templateId: string;
  credential: VerifiableCredential;
  learnerId: string;
  learnerDid: string;
  issuerId: string;
  issuerDid: string;
  issuedAt: string;
  status: 'active' | 'revoked';
  credentialHash: string;
}

interface Store {
  users: User[];
  templates: CredentialTemplate[];
  credentials: CredentialRecord[];
  sessions: Record<string, string>; // token -> userId
}

const STORAGE_KEY = 'ssi_local_backend_v1';

const loadStore = (): Store => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { users: [], templates: [], credentials: [], sessions: {} };
    return JSON.parse(raw) as Store;
  } catch {
    return { users: [], templates: [], credentials: [], sessions: {} };
  }
};

const saveStore = (store: Store) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const uuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxx-xxxx-4xxx-yxxx-xxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const hash = (input: any) => {
  return btoa(unescape(encodeURIComponent(JSON.stringify(input))));
};

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private requireUser() {
    if (!this.token) throw new Error('Not authenticated');
    const store = loadStore();
    const userId = store.sessions[this.token];
    if (!userId) throw new Error('Session expired');
    const user = store.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return { store, user };
  }

  // Auth
  async signup(email: string, password: string, name: string, role: Role) {
    const store = loadStore();
    if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    const id = uuid();
    const did = `did:local:${id}`;
    const user: User = {
      id,
      email,
      password,
      name,
      role,
      did,
      createdAt: new Date().toISOString(),
    };

    store.users.push(user);
    saveStore(store);

    return { user };
  }

  async signin(email: string, password: string) {
    const store = loadStore();
    const user = store.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!user) throw new Error('Invalid credentials');

    const token = `token-${uuid()}`;
    store.sessions[token] = user.id;
    saveStore(store);

    return { accessToken: token, user };
  }

  async getMe() {
    const { user } = this.requireUser();
    return { user };
  }

  async signout() {
    if (!this.token) return { success: true };
    const store = loadStore();
    delete store.sessions[this.token];
    saveStore(store);
    this.token = null;
    return { success: true };
  }

  // Templates (Issuer)
  async createTemplate(name: string, description: string, credentialSubject: any) {
    const { store, user } = this.requireUser();
    if (user.role !== 'issuer') throw new Error('Only issuers can create templates');
    if (!name || !description || !credentialSubject) throw new Error('Missing required fields');

    const template: CredentialTemplate = {
      id: uuid(),
      name,
      description,
      issuerId: user.id,
      issuerDid: user.did,
      credentialSubject,
      createdAt: new Date().toISOString(),
    };

    store.templates.push(template);
    saveStore(store);

    return { template };
  }

  async getTemplates() {
    const { store, user } = this.requireUser();
    if (user.role !== 'issuer') throw new Error('Only issuers can view templates');
    const templates = store.templates.filter((t) => t.issuerId === user.id);
    return { templates };
  }

  // Credentials
  async issueCredential(
    templateId: string,
    learnerEmail: string,
    credentialData: any,
    expirationDate?: string,
  ) {
    const { store, user } = this.requireUser();
    if (user.role !== 'issuer') throw new Error('Only issuers can issue credentials');

    const template = store.templates.find((t) => t.id === templateId && t.issuerId === user.id);
    if (!template) throw new Error('Template not found');

    const learner = store.users.find((u) => u.email.toLowerCase() === learnerEmail.toLowerCase());
    if (!learner || learner.role !== 'learner') throw new Error('Learner not found');

    const recordId = `urn:uuid:${uuid()}`;
    const credentialId = `urn:uuid:${uuid()}`;
    const issuedAt = new Date().toISOString();

    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: credentialId,
      type: ['VerifiableCredential', template.name.replace(/\s+/g, '')],
      issuer: user.did,
      issuanceDate: issuedAt,
      credentialSubject: {
        id: learner.did,
        ...credentialData,
      },
      proof: {
        type: 'LocalSignature2026',
        created: issuedAt,
        verificationMethod: `${user.did}#local-key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: hash({ credentialId, issuer: user.did }),
      },
    };

    if (expirationDate) credential.expirationDate = expirationDate;

    const record: CredentialRecord = {
      id: recordId,
      templateId,
      credential,
      learnerId: learner.id,
      learnerDid: learner.did,
      issuerId: user.id,
      issuerDid: user.did,
      issuedAt,
      status: 'active',
      credentialHash: hash(credential),
    };

    store.credentials.push(record);
    saveStore(store);

    return { credential: record };
  }

  async getCredentials() {
    const { store, user } = this.requireUser();
    if (user.role !== 'learner') throw new Error('Only learners can view credentials');
    const credentials = store.credentials.filter((c) => c.learnerId === user.id);
    return { credentials };
  }

  async getIssuedCredentials() {
    const { store, user } = this.requireUser();
    if (user.role !== 'issuer') throw new Error('Only issuers can view issued credentials');
    const credentials = store.credentials.filter((c) => c.issuerId === user.id);
    return { credentials };
  }

  async revokeCredential(credentialId: string) {
    const { store, user } = this.requireUser();
    if (user.role !== 'issuer') throw new Error('Only issuers can revoke credentials');
    const record = store.credentials.find((c) => c.id === credentialId && c.issuerId === user.id);
    if (!record) throw new Error('Credential not found');
    record.status = 'revoked';
    saveStore(store);
    return { success: true };
  }

  async verifyCredential(credential: any) {
    const store = loadStore();
    const existing = store.credentials.find((c) => c.credential.id === credential.id);

    const now = Date.now();
    const expiration = credential.expirationDate ? Date.parse(credential.expirationDate) : null;

    const checks = {
      signatureValid: !!existing, // local-only, treat stored match as "valid signature"
      issuerValid: existing ? existing.issuerDid === credential.issuer : false,
      notRevoked: existing ? existing.status !== 'revoked' : false,
      notExpired: expiration ? expiration > now : true,
    };

    const valid = checks.signatureValid && checks.issuerValid && checks.notRevoked && checks.notExpired;

    return {
      verification: {
        valid,
        checks,
        error: valid ? undefined : 'Credential failed local verification',
      },
    };
  }

  async getLearners() {
    const { store, user } = this.requireUser();
    if (user.role !== 'issuer') throw new Error('Only issuers can view learners');
    const learners = store.users
      .filter((u) => u.role === 'learner')
      .map((u) => ({ id: u.id, email: u.email, name: u.name, did: u.did }));
    return { learners };
  }
}

export const api = new ApiClient();
