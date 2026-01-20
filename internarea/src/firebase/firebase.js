// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const analytics = getAnalytics(app);

// Enforce local persistence
import { setPersistence, browserLocalPersistence } from "firebase/auth";
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Persistence persistence error:", error);
});

export { auth, provider };


