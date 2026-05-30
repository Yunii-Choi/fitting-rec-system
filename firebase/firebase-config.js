// firebase/firebase-config.js
//
// Firebase 웹 SDK v9+ (modular) 초기화.
//
// ⚠️ apiKey / messagingSenderId / appId 는 Firebase 콘솔에서 직접 복사해 채우세요:
//   콘솔 → 프로젝트 설정(⚙️) → 일반 → 내 앱 → SDK 설정 및 구성 → npm/CDN
// (웹 apiKey 는 클라이언트에 노출되는 공개 식별자이며, 실제 보안은 Storage/Firestore
//  보안 규칙으로 처리합니다. Admin SDK 서비스 계정 키는 절대 커밋하지 마세요.)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
// 필요 시 주석 해제
// import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "<YOUR_API_KEY>",                       // 👈 콘솔에서 채우기
  authDomain: "fitting-524.firebaseapp.com",
  projectId: "fitting-524",
  storageBucket: "fitting-524.firebasestorage.app",
  messagingSenderId: "<YOUR_SENDER_ID>",          // 👈 콘솔에서 채우기
  appId: "<YOUR_APP_ID>",                          // 👈 콘솔에서 채우기
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
// export const db = getFirestore(app);
// export const auth = getAuth(app);
export default app;
