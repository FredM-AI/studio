import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let db: Firestore;

try {
  // We only initialize the app if it hasn't been initialized yet.
  if (admin.apps.length === 0) {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountEnv) {
      const errorMessage = "🔥 CRITICAL: FIREBASE_SERVICE_ACCOUNT environment variable is not set.";
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    let serviceAccount;
    try {
      // First, try to parse it as a raw JSON string.
      serviceAccount = JSON.parse(serviceAccountEnv);
    } catch (e) {
      // If that fails, assume it's a Base64 encoded string and decode it.
      console.log("Could not parse FIREBASE_SERVICE_ACCOUNT as raw JSON, attempting to decode from Base64.");
      try {
        const decodedString = Buffer.from(serviceAccountEnv, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedString);
        console.log("Successfully decoded and parsed service account from Base64.");
      } catch (decodeError: any) {
         console.error("🔥 CRITICAL: Failed to decode or parse the Base64-encoded FIREBASE_SERVICE_ACCOUNT.");
         console.error("🔥 Decode Error details:", decodeError.message);
         throw new Error(`Firebase initialization failed: ${decodeError.message}`);
      }
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin SDK initialized successfully via Service Account.");
  }
  db = getFirestore();
} catch (error: any) {
  console.error("🔥 CRITICAL: Firebase Admin SDK initialization failed. The FIREBASE_SERVICE_ACCOUNT might be malformed or invalid.");
  console.error("🔥 Error details:", error.message);
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

export { db };
