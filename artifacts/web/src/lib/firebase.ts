import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../../../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
// CRITICAL: Must pass databaseId from config
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on startup as required by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client is currently offline. Check network or config.");
    }
    return false;
  }
}

// Execute connection test on initialization
testFirestoreConnection().catch(() => {});

// Firestore Helper: Sync User Document
export async function syncUserDoc(user: FirebaseUser): Promise<void> {
  const userPath = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, "users", user.uid);
    const existingSnap = await getDoc(userDocRef);
    const now = new Date().toISOString();

    if (existingSnap.exists()) {
      await updateDoc(userDocRef, {
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        lastLoginAt: now,
      });
    } else {
      await setDoc(userDocRef, {
        userId: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: now,
        lastLoginAt: now,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

// Firestore Helper: Save Favorite Summoner
export async function saveFavoriteToFirestore(
  userId: string,
  favorite: { gameName: string; tagLine: string; region: string }
): Promise<void> {
  const favId = `${favorite.region}_${favorite.gameName}_${favorite.tagLine}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  const path = `users/${userId}/favorites/${favId}`;
  try {
    await setDoc(doc(db, "users", userId, "favorites", favId), {
      userId,
      gameName: favorite.gameName,
      tagLine: favorite.tagLine,
      region: favorite.region,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Firestore Helper: Remove Favorite Summoner
export async function removeFavoriteFromFirestore(
  userId: string,
  favorite: { gameName: string; tagLine: string; region: string }
): Promise<void> {
  const favId = `${favorite.region}_${favorite.gameName}_${favorite.tagLine}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  const path = `users/${userId}/favorites/${favId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "favorites", favId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Firestore Helper: Get Favorite Summoners
export async function getFavoritesFromFirestore(
  userId: string
): Promise<{ gameName: string; tagLine: string; region: string }[]> {
  const path = `users/${userId}/favorites`;
  try {
    const snapshot = await getDocs(collection(db, "users", userId, "favorites"));
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        gameName: data.gameName,
        tagLine: data.tagLine,
        region: data.region,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type FirebaseUser,
  doc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
};
