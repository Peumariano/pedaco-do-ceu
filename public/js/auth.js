// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvHR4-SW1zEwkMXxFrpqpIHryDcgK0jFg",
  authDomain: "pedaco-do-ceu.firebaseapp.com",
  projectId: "pedaco-do-ceu",
  storageBucket: "pedaco-do-ceu.firebasestorage.app",
  messagingSenderId: "26816712946",
  appId: "1:26816712946:web:9f351192e32d93c3fa806b",
  measurementId: "G-WG1CHW8P7L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);