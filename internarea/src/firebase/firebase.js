// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSl2aTE4JdKS9nHHDh9R_KQvZCA6MbqW4",
  authDomain: "internarea-ad371.firebaseapp.com",
  projectId: "internarea-ad371",
  storageBucket: "internarea-ad371.firebasestorage.app",
  messagingSenderId: "877439705716",
  appId: "1:877439705716:web:d4e9dddeaac8f129906721",
  measurementId: "G-E9XL1DTMLP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Initialize Auth and Provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Enforce local persistence (only in browser)
if (typeof window !== "undefined") {
  import("firebase/auth").then(({ setPersistence, browserLocalPersistence }) => {
    setPersistence(auth, browserLocalPersistence).catch(error => {
      console.error("Persistence error:", error);
    });
  });
}

export { auth, provider, analytics };


