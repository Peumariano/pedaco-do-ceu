
// public/js/auth.js
// Autenticação Google com Firebase

// ================================================
// CONFIGURAÇÃO DO FIREBASE
// ================================================
const firebaseConfig = {
  apiKey: "AIzaSyDvHR4-SW1zEwkMXxFrpqpIHryDcgK0jFg",
  authDomain: "pedaco-do-ceu.firebaseapp.com",
  projectId: "pedaco-do-ceu",
  storageBucket: "pedaco-do-ceu.firebasestorage.app",
  messagingSenderId: "26816712946",
  appId: "1:26816712946:web:9f351192e32d93c3fa806b",
  measurementId: "G-WG1CHW8P7L"
};


// ================================================
// IMPORTS DO FIREBASE (CDN)
// ================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let currentToken = null;

// ================================================
// MONITORA ESTADO DE AUTENTICAÇÃO
// ================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        currentToken = await user.getIdToken();
        console.log('Usuário logado:', user.displayName);
        atualizarUI(user);
    } else {
        currentUser = null;
        currentToken = null;
        console.log('Usuário deslogado');
        mostrarBotaoLogin();
    }
});

// ================================================
// LOGIN COM GOOGLE
// ================================================
async function loginComGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        currentToken = await result.user.getIdToken();
        console.log('Login realizado:', result.user.displayName);
    } catch (error) {
        console.error('Erro no login:', error);
        if (error.code !== 'auth/popup-closed-by-user') {
            alert('Erro ao fazer login. Tente novamente.');
        }
    }
}

// ================================================
// LOGOUT
// ================================================
async function logout() {
    try {
        await signOut(auth);
        console.log('Logout realizado');
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// ================================================
// UI
// ================================================
function atualizarUI(user) {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    headerActions.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${user.photoURL || 'assets/avatar-default.png'}" 
                 style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid white;"
                 title="${user.displayName}">
            <span style="color: white; font-size: 14px;">
                Olá, ${user.displayName?.split(' ')[0]}!
            </span>
            <button onclick="window.firebaseAuth.logout()" style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 13px;
            ">Sair</button>
        </div>
    `;
}

function mostrarBotaoLogin() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    headerActions.innerHTML = `
        <button onclick="window.firebaseAuth.loginComGoogle()" style="
            background: white;
            color: #4A2C2A;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 15px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
        ">
            <img src="https://www.google.com/favicon.ico" width="18">
            Entrar com Google
        </button>
    `;
}

// Exporta para uso global
window.firebaseAuth = {
    loginComGoogle,
    logout,
    getCurrentToken: () => currentToken,
    getCurrentUser: () => currentUser
};

console.log('Firebase Auth inicializado');