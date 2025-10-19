import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9qJYQIF_QHTB-kPuCR6_EbH9JB6ga57U",
  authDomain: "goshop-97f68.firebaseapp.com",
  projectId: "goshop-97f68",
  storageBucket: "goshop-97f68.firebasestorage.app",
  messagingSenderId: "39347550006",
  appId: "1:39347550006:web:a2be02eefee3af4b52a597",
  measurementId: "G-5GLGLE7MPT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
