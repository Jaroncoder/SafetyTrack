import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, push, remove } from "firebase/database"; // ✅ Added remove
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAhcr0L8BeqjfCp2AZ8a7yZdJfytOWfUrA",
  authDomain: "womensafety-66281.firebaseapp.com",
  databaseURL: "https://womensafety-66281-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "womensafety-66281",
  storageBucket: "womensafety-66281.firebasestorage.app",
  messagingSenderId: "68258101875",
  appId: "1:68258101875:web:8a184f01467713b3d7c806"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);

// ✅ Added remove to the exports
export { db, auth, ref, set, onValue, update, push, remove };