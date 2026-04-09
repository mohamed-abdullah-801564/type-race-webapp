import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "typemaster-prod-9a2b8c",
  appId: "1:870212554435:web:cf56573731d8a034455c76",
  storageBucket: "typemaster-prod-9a2b8c.firebasestorage.app",
  apiKey: "AIzaSyAlU5edlt-VJdqjdvmoTSxK7uFMOScDGHw",
  authDomain: "typemaster-prod-9a2b8c.firebaseapp.com",
  messagingSenderId: "870212554435"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
