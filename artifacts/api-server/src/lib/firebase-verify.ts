import jwt from "jsonwebtoken";
import firebaseConfig from "../../../../firebase-applet-config.json";

// Weryfikacja tokenu Firebase (ID token) bez firebase-admin: sprawdzamy podpis RS256
// kluczami publicznymi Google, odbiorcę (projekt), wystawcę i datę ważności.
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library

const CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getCerts(): Promise<Record<string, string>> {
  if (certCache && Date.now() < certCache.expiresAt) return certCache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`Nie udało się pobrać kluczy Google (${res.status})`);
  const certs = (await res.json()) as Record<string, string>;
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  certCache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

export function firebaseProjectId(): string {
  return process.env.FIREBASE_PROJECT_ID?.trim() || (firebaseConfig as { projectId: string }).projectId;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  provider?: string;
}

export class FirebaseTokenError extends Error {}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  const decoded = jwt.decode(idToken, { complete: true });
  const kid = decoded && typeof decoded === "object" ? decoded.header?.kid : undefined;
  if (!kid || decoded?.header.alg !== "RS256") throw new FirebaseTokenError("Nieprawidłowy token logowania.");

  let certs = await getCerts();
  if (!certs[kid]) {
    certCache = null; // klucze mogły się zmienić
    certs = await getCerts();
  }
  const cert = certs[kid];
  if (!cert) throw new FirebaseTokenError("Nieznany klucz podpisu tokenu.");

  const projectId = firebaseProjectId();
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(idToken, cert, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      clockTolerance: 60,
    }) as jwt.JwtPayload;
  } catch (e: any) {
    throw new FirebaseTokenError(e?.name === "TokenExpiredError" ? "Token logowania wygasł — zaloguj się ponownie." : "Nieprawidłowy token logowania.");
  }

  if (!payload.sub || typeof payload.email !== "string") throw new FirebaseTokenError("Token nie zawiera adresu email.");
  return {
    uid: payload.sub,
    email: payload.email.trim().toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : undefined,
    provider: (payload.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider,
  };
}
