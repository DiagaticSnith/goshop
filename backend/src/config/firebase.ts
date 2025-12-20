import admin from "firebase-admin";

let serviceAccount: any;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    } catch (err) {
        // allow passing base64-encoded JSON in env
        try {
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT as string, "base64").toString();
            serviceAccount = JSON.parse(decoded);
        } catch (e) {
            serviceAccount = null;
        }
    }
}

if (!serviceAccount) {
    // fallback to local file for development
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    serviceAccount = require("./serviceAccountKey.json");
}

const params = {
    type: serviceAccount.type,
    projectId: serviceAccount.project_id,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccount.client_x509_cert_url
};

// In test runs we prefer a lightweight mock injected via global.__FIREBASE_AUTH
// to avoid initializing the full Firebase SDK which can create background
// handles preventing Jest from exiting.
let firebaseAdmin: any = null;
let storage: any = null;
let auth: any = null;

if (process.env.NODE_ENV === 'test' && (global as any).__FIREBASE_AUTH) {
    // use injected mock
    auth = (global as any).__FIREBASE_AUTH;
} else {
    firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(params),
        storageBucket: process.env.FIREBASE_BUCKET_URL
    });
    storage = firebaseAdmin.storage();
    auth = firebaseAdmin.auth();
}

export { firebaseAdmin, storage, auth };
