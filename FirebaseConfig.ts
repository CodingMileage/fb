// Import the functions you need from the SDKs you need
//@ts-ignore
import { getReactNativePersistence } from "@firebase/auth/dist/rn/index.js";
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPMVh2O7OrKBA5ReXF8prmDKCTW3k9V7U",
  authDomain: "khub-9f9f6.firebaseapp.com",
  projectId: "khub-9f9f6",
  storageBucket: "khub-9f9f6.appspot.com",
  messagingSenderId: "18246319055",
  appId: "1:18246319055:web:bc51d33e527e068e4f30ba",
  measurementId: "G-JK50E9K1DT",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
