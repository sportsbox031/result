import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 - 실제 프로젝트에서는 환경변수로 관리하세요
const firebaseConfig = {
  apiKey: "AIzaSyCkgUUr8CADydWb62Qdb8p8MHZ_TUkrCzE",
  authDomain: "sportsbox-result.firebaseapp.com",
  projectId: "sportsbox-result",
  storageBucket: "sportsbox-result.firebasestorage.app",
  messagingSenderId: "1098188923070",
  appId: "1:1098188923070:web:b021c52a64965bf79dbeef"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 인스턴스
export const db = getFirestore(app);

export default app;