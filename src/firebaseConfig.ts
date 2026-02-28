import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwmp2w8pYO_U86e7cJaTnAJ562Fn1s-FM",
  authDomain: "site-3d-a96c7.firebaseapp.com",
  projectId: "site-3d-a96c7",
  storageBucket: "site-3d-a96c7.firebasestorage.app",
  messagingSenderId: "11691552610",
  appId: "1:11691552610:web:81a57964aec9548a07863b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore with settings to avoid "Service not available" issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
