"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.storage = exports.firebaseAdmin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccountKey_json_1 = __importDefault(require("./serviceAccountKey.json"));
const params = {
    type: serviceAccountKey_json_1.default.type,
    projectId: serviceAccountKey_json_1.default.project_id,
    privateKeyId: serviceAccountKey_json_1.default.private_key_id,
    privateKey: serviceAccountKey_json_1.default.private_key,
    clientEmail: serviceAccountKey_json_1.default.client_email,
    clientId: serviceAccountKey_json_1.default.client_id,
    authUri: serviceAccountKey_json_1.default.auth_uri,
    tokenUri: serviceAccountKey_json_1.default.token_uri,
    authProviderX509CertUrl: serviceAccountKey_json_1.default.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccountKey_json_1.default.client_x509_cert_url
};
exports.firebaseAdmin = firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(params),
    storageBucket: process.env.FIREBASE_BUCKET_URL
});
exports.storage = exports.firebaseAdmin.storage();
exports.auth = exports.firebaseAdmin.auth();
