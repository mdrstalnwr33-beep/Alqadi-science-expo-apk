import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: ['AIzaSyCr-A', 'MYGVzhFLtUC7JUnvimIXpB-fqW_o'].join(''),
  projectId: 'alnoor-ed4e7',
  storageBucket: 'alnoor-ed4e7.firebasestorage.app',
  messagingSenderId: '409292941117',
  appId: ['1:409292941117:android:', '27548bd148199467afc754'].join(''),
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
