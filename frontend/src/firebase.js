import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCwSfI5yNqeosNX3Ve9W9AhpNc5Q6_AQPU",
  authDomain: "safeway-project-a2b23.firebaseapp.com",
  projectId: "safeway-project-a2b23",
  storageBucket: "safeway-project-a2b23.firebasestorage.app",
  messagingSenderId: "259978938472",
  appId: "1:259978938472:web:..." 
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);