// test-firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

console.log("Service account loaded:", {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key.substring(0, 20) + "..."
});

if (!admin.apps.length) {
    try {
        console.log("Attempting to initialize Firebase with projectId:", serviceAccount.project_id);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        console.log("Firebase initialized successfully. App name:", admin.app().name);
        console.log("Project ID from app:", admin.app().options.projectId); // Kiểm tra projectId thực tế
    } catch (error) {
        console.error("Firebase initialization failed:", error.message);
        process.exit(1);
    }
}

const auth = admin.auth();
console.log("Auth instance created:", auth ? "Yes" : "No");

async function testCreateUser() {
    try {
        const userRecord = await auth.createUser({
            email: `test-${Date.now()}@example.com`,
            password: "TestPass123",
            displayName: "Test User"
        });
        console.log("User created successfully:", userRecord.uid);
    } catch (error) {
        console.error("Error creating user:", error.code, error.message);
    }
}

async function testListUsers() {
    try {
        const listUsersResult = await auth.listUsers();
        console.log("Successfully listed users. Total users:", listUsersResult.users.length);
    } catch (error) {
        console.error("Error listing users:", error.code, error.message);
    }
}

async function testGetUser() {
    try {
        const userRecord = await auth.getUserByEmail("email-from-google-auth@example.com"); // Thay bằng email từ Google Auth
        console.log("User retrieved successfully:", userRecord.uid);
    } catch (error) {
        console.error("Error getting user:", error.code, error.message);
    }
}

testCreateUser();
testListUsers();
testGetUser();