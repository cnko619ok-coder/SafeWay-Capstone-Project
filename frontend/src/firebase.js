// frontend/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// 🚨 여기에 사용자님의 Firebase 프로젝트 설정 값을 넣어야 합니다!
// (Firebase 콘솔 -> 프로젝트 설정 -> 내 앱 -> SDK 설정 및 구성 에서 복사 가능)
const firebaseConfig = {
  apiKey: "AIzaSyCwSfI5yNqeosNX3Ve9W9AhpNc5Q6_AQPU", // 👈 사용자님의 웹 API 키로 바꿔주세요
  authDomain: "safeway-project-a2b23.firebaseapp.com",
  projectId: "safeway-project-a2b23",
  storageBucket: "safeway-project-a2b23.firebasestorage.app",
  messagingSenderId: "259978938472",
  appId: "1:259978938472:web:..." 
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);