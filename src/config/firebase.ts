import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 - 하드코딩(배포용)
const firebaseConfig = {
  apiKey: "AIzaSyCkgUUr8CADydWb62Qdb8p8MHZ_TUkrCzE",
  authDomain: "sportsbox-result.firebaseapp.com",
  projectId: "sportsbox-result",
  storageBucket: "sportsbox-result.appspot.com",
  messagingSenderId: "1098188923070",
  appId: "1:1098188923070:web:b021c52a64965bf79dbeef",
  measurementId: "G-DR5V9BNFZ2"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 인스턴스
export const db = getFirestore(app);

export default app;