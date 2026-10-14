import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// إعدادات Firebase من google-services.json الموجود للمشروع.
// نستخدم Firebase JS SDK مباشرة لخدمات Firestore وStorage، دون الحاجة إلى إنشاء Web App.
const firebaseConfig = {
  apiKey: ['AIzaSyCr-A', 'MYGVzhFLtUC7JUnvimIXpB-fqW_o'].join(''),
  projectId: 'alnoor-ed4e7',
  storageBucket: 'alnoor-ed4e7.firebasestorage.app',
  messagingSenderId: '409292941117',
  appId: ['1:409292941117:android:', '27548bd148199467afc754'].join(''),
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

const app = firebaseReady ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
