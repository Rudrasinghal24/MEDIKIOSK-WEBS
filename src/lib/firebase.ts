/**
 * Firebase Setup & Initialization
 * Configured with Firebase Authentication (Phone Auth) and Cloud Firestore
 *
 * For beginners:
 * 1. initializeApp(firebaseConfig) connects our React web app to your Firebase project "otp-med".
 * 2. getAuth(app) creates an authentication service instance to manage phone number OTP logins.
 * 3. getFirestore(app) creates a Firestore database instance to store/retrieve patient profiles upon login.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration provided for otp-med
export const firebaseConfig = {
  apiKey: "AIzaSyB48ZSRph2cqrFs_Aj4XJrvk3-1iylP1lI",
  authDomain: "otp-med.firebaseapp.com",
  projectId: "otp-med",
  storageBucket: "otp-med.firebasestorage.app",
  messagingSenderId: "263282291632",
  appId: "1:263282291632:web:e8ec57a1e8c8030b3cdc75",
  measurementId: "G-TFJH6QWKM7",
};

// Initialize Firebase safely (avoiding duplicate app initialization during development reloads)
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export initialized Auth and Firestore services
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
