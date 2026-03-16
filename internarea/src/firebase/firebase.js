import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyBSl2aTE4JdKS9nHHDh9R_KQvZCA6MbqW4",
  authDomain: "internarea-ad371.firebaseapp.com",
  projectId: "internarea-ad371",
  storageBucket: "internarea-ad371.firebasestorage.app",
  messagingSenderId: "877439705716",
  appId: "1:877439705716:web:d4e9dddeaac8f129906721",
  measurementId: "G-E9XL1DTMLP"
};

const app = initializeApp(firebaseConfig);

let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

if (typeof window !== "undefined") {
  import("firebase/auth").then(({ setPersistence, browserLocalPersistence }) => {
    setPersistence(auth, browserLocalPersistence).catch(error => {
      console.error("Persistence error:", error);
    });
  });
}

export { auth, provider, analytics };


