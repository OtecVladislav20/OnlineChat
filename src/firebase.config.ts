import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: 'AIzaSyBTchEJrMHCZcd3Lzz5x_AsMqvX95wYRn8',
  authDomain: 'onlinechat-fa4ac.firebaseapp.com',
  projectId: 'onlinechat-fa4ac',
  storageBucket: 'onlinechat-fa4ac.firebasestorage.app',
  messagingSenderId: '403398596169',
  appId: '1:403398596169:web:201abb3364fa6f7a055198'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

