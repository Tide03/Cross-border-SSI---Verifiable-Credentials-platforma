import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import * as did from "./did.tsx";
import * as credentials from "./credentials.tsx";
import { generateId } from "./crypto.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-41b7af2e/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * Sign up a new user
 */
app.post("/make-server-41b7af2e/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    if (!email || !password || !name || !role) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    if (!["learner", "issuer", "verifier"].includes(role)) {
      return c.json({ error: "Invalid role" }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true, // Auto-confirm since email server not configured
    });
    
    if (error) {
      console.error("Signup error:", error);
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }
    
    const userId = data.user.id;
    
    // Create DID for the user
    const { did: userDid, didDocument } = await did.createDID(userId);
    
    // Store user profile
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role,
      did: userDid,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({
      user: {
        id: userId,
        email,
        name,
        role,
        did: userDid,
        didDocument,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: `Signup failed: ${error}` }, 500);
  }
});

/**
 * Sign in
 */
app.post("/make-server-41b7af2e/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Missing email or password" }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Signin error:", error);
      return c.json({ error: `Signin failed: ${error.message}` }, 401);
    }
    
    const userId = data.user.id;
    const accessToken = data.session.access_token;
    
    // Get user profile
    const userProfile = await kv.get(`user:${userId}`);
    
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }
    
    return c.json({
      accessToken,
      user: userProfile,
    });
  } catch (error) {
    console.error("Signin error:", error);
    return c.json({ error: `Signin failed: ${error}` }, 500);
  }
});

/**
 * Get current user
 */
app.get("/make-server-41b7af2e/auth/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }
    
    return c.json({ user: userProfile });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: `Failed to get user: ${error}` }, 500);
  }
});

/**
 * Sign out
 */
app.post("/make-server-41b7af2e/auth/signout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    await supabase.auth.signOut();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Signout error:", error);
    return c.json({ error: `Signout failed: ${error}` }, 500);
  }
});

// ============================================================================
// DID ENDPOINTS
// ============================================================================

/**
 * Resolve a DID
 */
app.get("/make-server-41b7af2e/did/:did", async (c) => {
  try {
    const didParam = c.req.param('did');
    const fullDid = didParam.startsWith('did:') ? didParam : `did:${didParam}`;
    
    const didDocument = await did.resolveDID(fullDid);
    
    if (!didDocument) {
      return c.json({ error: "DID not found" }, 404);
    }
    
    return c.json({ didDocument });
  } catch (error) {
    console.error("DID resolution error:", error);
    return c.json({ error: `DID resolution failed: ${error}` }, 500);
  }
});

// ============================================================================
// CREDENTIAL TEMPLATE ENDPOINTS (Issuer)
// ============================================================================

/**
 * Create a credential template
 */
app.post("/make-server-41b7af2e/templates", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get<any>(`user:${user.id}`);
    
    if (!userProfile || userProfile.role !== "issuer") {
      return c.json({ error: "Only issuers can create templates" }, 403);
    }
    
    const { name, description, credentialSubject } = await c.req.json();
    
    if (!name || !description || !credentialSubject) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const template = await credentials.createTemplate(
      name,
      description,
      user.id,
      userProfile.did,
      credentialSubject
    );
    
    return c.json({ template });
  } catch (error) {
    console.error("Create template error:", error);
    return c.json({ error: `Failed to create template: ${error}` }, 500);
  }
});

/**
 * Get issuer templates
 */
app.get("/make-server-41b7af2e/templates", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get<any>(`user:${user.id}`);
    
    if (!userProfile || userProfile.role !== "issuer") {
      return c.json({ error: "Only issuers can view templates" }, 403);
    }
    
    const templates = await credentials.getIssuerTemplates(user.id);
    
    return c.json({ templates });
  } catch (error) {
    console.error("Get templates error:", error);
    return c.json({ error: `Failed to get templates: ${error}` }, 500);
  }
});

// ============================================================================
// CREDENTIAL ISSUANCE ENDPOINTS (Issuer)
// ============================================================================

/**
 * Issue a credential
 */
app.post("/make-server-41b7af2e/credentials/issue", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get<any>(`user:${user.id}`);
    
    if (!userProfile || userProfile.role !== "issuer") {
      return c.json({ error: "Only issuers can issue credentials" }, 403);
    }
    
    const { templateId, learnerEmail, credentialData, expirationDate } = await c.req.json();
    
    if (!templateId || !learnerEmail || !credentialData) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    // Find learner by email
    const allUsers = await kv.getByPrefix('user:');
    const learner = allUsers.find((u: any) => u.email === learnerEmail && u.role === 'learner');
    
    if (!learner) {
      return c.json({ error: "Learner not found" }, 404);
    }
    
    const credentialRecord = await credentials.issueCredential(
      templateId,
      learner.did,
      credentialData,
      user.id,
      userProfile.did,
      expirationDate
    );
    
    // Log audit event
    const auditId = generateId();
    await kv.set(`audit:${auditId}`, {
      id: auditId,
      type: "credential_issued",
      timestamp: new Date().toISOString(),
      userId: user.id,
      details: {
        credentialId: credentialRecord.id,
        learnerDid: learner.did,
        templateId,
      },
    });
    
    return c.json({ credential: credentialRecord });
  } catch (error) {
    console.error("Issue credential error:", error);
    return c.json({ error: `Failed to issue credential: ${error}` }, 500);
  }
});

/**
 * Get issued credentials (for issuer)
 */
app.get("/make-server-41b7af2e/credentials/issued", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get<any>(`user:${user.id}`);
    
    if (!userProfile || userProfile.role !== "issuer") {
      return c.json({ error: "Only issuers can view issued credentials" }, 403);
    }
    
    const issuedCredentials = await credentials.getIssuerCredentials(user.id);
    
    return c.json({ credentials: issuedCredentials });
  } catch (error) {
    console.error("Get issued credentials error:", error);
    return c.json({ error: `Failed to get issued credentials: ${error}` }, 500);
  }
});

/**
 * Revoke a credential
 */
app.post("/make-server-41b7af2e/credentials/:credentialId/revoke", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get<any>(`user:${user.id}`);
    
    if (!userProfile || userProfile.role !== "issuer") {
      return c.json({ error: "Only issuers can revoke credentials" }, 403);
    }
    
    const credentialId = c.req.param('credentialId');
    
    await credentials.revokeCredential(credentialId, user.id);
    
    // Log audit event
    const auditId = generateId();
    await kv.set(`audit:${auditId}`, {
      id: auditId,
      type: "credential_revoked",
      timestamp: new Date().toISOString(),
      userId: user.id,
      details: {
        credentialId,
      },
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Revoke credential error:", error);
    return c.json({ error: `Failed to revoke credential: ${error}` }, 500);
  }
});

// ============================================================================
// CREDENTIAL ENDPOINTS (Learner)
// ============================================================================

/**
 * Get learner credentials
 */
app.get("/make-server-41b7af2e/credentials", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get<any>(`user:${user.id}`);
    
    if (!userProfile || userProfile.role !== "learner") {
      return c.json({ error: "Only learners can view credentials" }, 403);
    }
    
    const learnerCredentials = await credentials.getLearnerCredentials(userProfile.did);
    
    return c.json({ credentials: learnerCredentials });
  } catch (error) {
    console.error("Get learner credentials error:", error);
    return c.json({ error: `Failed to get credentials: ${error}` }, 500);
  }
});

/**
 * Get a specific credential (for sharing/presentation)
 */
app.get("/make-server-41b7af2e/credentials/:credentialId", async (c) => {
  try {
    const credentialId = c.req.param('credentialId');
    
    const credentialRecord = await credentials.getCredential(credentialId);
    
    if (!credentialRecord) {
      return c.json({ error: "Credential not found" }, 404);
    }
    
    return c.json({ credential: credentialRecord });
  } catch (error) {
    console.error("Get credential error:", error);
    return c.json({ error: `Failed to get credential: ${error}` }, 500);
  }
});

// ============================================================================
// VERIFICATION ENDPOINTS (Verifier)
// ============================================================================

/**
 * Verify a credential
 */
app.post("/make-server-41b7af2e/verify", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get<any>(`user:${user.id}`);
    
    if (!userProfile || userProfile.role !== "verifier") {
      return c.json({ error: "Only verifiers can verify credentials" }, 403);
    }
    
    const { credential } = await c.req.json();
    
    if (!credential) {
      return c.json({ error: "No credential provided" }, 400);
    }
    
    const verificationResult = await credentials.verifyCredential(credential);
    
    // Log audit event
    const auditId = generateId();
    await kv.set(`audit:${auditId}`, {
      id: auditId,
      type: "credential_verified",
      timestamp: new Date().toISOString(),
      userId: user.id,
      details: {
        credentialId: credential.id,
        verificationResult,
      },
    });
    
    return c.json({ verification: verificationResult });
  } catch (error) {
    console.error("Verify credential error:", error);
    return c.json({ error: `Failed to verify credential: ${error}` }, 500);
  }
});

/**
 * Get all learners (for issuer to select when issuing)
 */
app.get("/make-server-41b7af2e/learners", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userProfile = await kv.get<any>(`user:${user.id}`);
    
    if (!userProfile || userProfile.role !== "issuer") {
      return c.json({ error: "Only issuers can view learners" }, 403);
    }
    
    const allUsers = await kv.getByPrefix('user:');
    const learners = allUsers.filter((u: any) => u.role === 'learner').map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      did: u.did,
    }));
    
    return c.json({ learners });
  } catch (error) {
    console.error("Get learners error:", error);
    return c.json({ error: `Failed to get learners: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);