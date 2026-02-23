const firebaseConfig = {
  apiKey: "AIzaSyDvHR4-SW1zEwkMXxFrpqpIHryDcgK0jFg",
  authDomain: "pedaco-do-ceu.firebaseapp.com",
  projectId: "pedaco-do-ceu",
  storageBucket: "pedaco-do-ceu.firebasestorage.app",
  messagingSenderId: "26816712946",
  appId: "1:26816712946:web:9f351192e32d93c3fa806b",
  measurementId: "G-WG1CHW8P7L"
};

// Imports do Firebase (CDN)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ================================================
// ESTADO GLOBAL DO USUÁRIO
// ================================================
let currentUser = null;
let currentToken = null;
let mongoUser = null;

// ================================================
// MONITORA MUDANÇAS DE AUTENTICAÇÃO
// ================================================
onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        console.log('✅ Usuário logado:', firebaseUser.displayName);
        
        // Pega token do Firebase
        currentUser = firebaseUser;
        
        try {
            currentToken = await firebaseUser.getIdToken();
            console.log('🔑 Token obtido');
        } catch (error) {
            console.error('❌ Erro ao obter token:', error);
            showNotification('Erro ao obter token de autenticação');
            return;
        }
        
        // Sincroniza com MongoDB
        await sincronizarComMongoDB();
        
        // Atualiza UI
        atualizarHeaderLogado();
        
    } else {
        console.log('👤 Nenhum usuário logado');
        currentUser = null;
        currentToken = null;
        mongoUser = null;
        atualizarHeaderDeslogado();
    }
});

// ================================================
// SINCRONIZAÇÃO COM MONGODB
// ================================================
async function sincronizarComMongoDB() {
    try {
        console.log('🔄 Sincronizando com MongoDB...');

        if (!currentToken) {
            console.error('❌ Token não disponível');
            return;
        }

        const response = await fetch('/api/auth-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                firebaseUid: currentUser.uid,
                name: currentUser.displayName,
                email: currentUser.email,
                avatar: currentUser.photoURL
            })
        });

        // Verifica se a resposta é JSON
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ Resposta não é JSON');
            const text = await response.text();
            console.error('Resposta recebida:', text.substring(0, 200));
            
            showNotification('⚠️ Erro ao sincronizar dados. Tente fazer login novamente.');
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erro na resposta:', data.error);
            showNotification(`Erro: ${data.error}`);
            return;
        }

        if (data.success) {
            mongoUser = data.user;
            console.log('✅ Sincronizado com MongoDB:', mongoUser._id);
            
            // Salva no localStorage como backup
            try {
                localStorage.setItem('mongoUser', JSON.stringify(mongoUser));
            } catch (e) {
                console.warn('Não foi possível salvar no localStorage:', e);
            }
            
        } else {
            console.error('❌ Resposta sem sucesso:', data);
        }

    } catch (error) {
        console.error('❌ Erro ao sincronizar com MongoDB:', error);
        
        // Tenta carregar do localStorage como fallback
        try {
            const cached = localStorage.getItem('mongoUser');
            if (cached) {
                mongoUser = JSON.parse(cached);
                console.log('ℹ️ Usando dados do cache local');
            }
        } catch (e) {
            console.warn('Não foi possível carregar do cache:', e);
        }
        
        showNotification('⚠️ Problema na sincronização. Alguns dados podem estar desatualizados.');
    }
}

// ================================================
// LOGIN COM GOOGLE
// ================================================
async function loginComGoogle() {
    try {
        console.log('🔐 Iniciando login...');
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Login bem-sucedido!');
        showNotification('Bem-vindo, ' + result.user.displayName + '! 🎉');
    } catch (error) {
        console.error('❌ Erro no login:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            showNotification('Login cancelado');
        } else if (error.code === 'auth/popup-blocked') {
            showNotification('Pop-up bloqueado. Permita pop-ups para este site.');
        } else if (error.code === 'auth/cancelled-popup-request') {
            // Ignora - usuário abriu outro popup
        } else {
            showNotification('Erro ao fazer login. Tente novamente.');
        }
    }
}

// ================================================
// LOGOUT
// ================================================
async function logout() {
    try {
        await signOut(auth);
        
        // Limpa localStorage
        try {
            localStorage.removeItem('mongoUser');
        } catch (e) {
            console.warn('Erro ao limpar localStorage:', e);
        }
        
        console.log('✅ Logout realizado');
        showNotification('Até logo! 👋');
        
        // Redireciona para home se estiver na página de perfil
        if (window.location.pathname.includes('perfil')) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('❌ Erro no logout:', error);
        showNotification('Erro ao fazer logout');
    }
}

// ================================================
// ATUALIZAR HEADER - LOGADO
// ================================================
function atualizarHeaderLogado() {
    const header = document.querySelector('header .container');
    if (!header) return;

    // Remove botão de login se existir
    const loginBtn = header.querySelector('.login-btn');
    if (loginBtn) loginBtn.remove();

    // Cria menu de usuário se não existir
    let userMenu = header.querySelector('.user-menu');
    if (!userMenu) {
        userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        
        const userName = currentUser.displayName?.split(' ')[0] || 'Usuário';
        
        userMenu.innerHTML = `
            <div class="user-menu-trigger">
                <img src="${currentUser.photoURL || 'assets/avatar-default.png'}" 
                     alt="${currentUser.displayName}" 
                     class="user-avatar"
                     onerror="this.src='assets/avatar-default.png'"
                     title="${currentUser.displayName}">
                <span class="user-name">${userName}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 6l4 4 4-4"/>
                </svg>
            </div>
            <div class="user-dropdown">
                <div class="user-dropdown-header">
                    <img src="${currentUser.photoURL || 'assets/avatar-default.png'}" 
                         alt="${currentUser.displayName}"
                         onerror="this.src='assets/avatar-default.png'">
                    <div>
                        <strong>${currentUser.displayName}</strong>
                        <span>${currentUser.email}</span>
                    </div>
                </div>
                <div class="user-dropdown-divider"></div>
                <a href="/perfil.html" class="user-dropdown-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Minha Conta
                </a>
                <a href="/perfil.html#pedidos" class="user-dropdown-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    Meus Pedidos
                </a>
                <div class="user-dropdown-divider"></div>
                <button onclick="window.firebaseAuth.logout()" class="user-dropdown-item logout-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sair
                </button>
            </div>
        `;

        // Insere antes do carrinho
        const cartIcon = header.querySelector('.cart-icon');
        if (cartIcon) {
            header.insertBefore(userMenu, cartIcon);
        } else {
            header.appendChild(userMenu);
        }

        // Toggle dropdown ao clicar
        const trigger = userMenu.querySelector('.user-menu-trigger');
        const dropdown = userMenu.querySelector('.user-dropdown');
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Fecha dropdown ao clicar fora
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });

        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// ================================================
// ATUALIZAR HEADER - DESLOGADO
// ================================================
function atualizarHeaderDeslogado() {
    const header = document.querySelector('header .container');
    if (!header) return;

    // Remove menu de usuário se existir
    const userMenu = header.querySelector('.user-menu');
    if (userMenu) userMenu.remove();

    // Adiciona botão de login se não existir
    let loginBtn = header.querySelector('.login-btn');
    if (!loginBtn) {
        loginBtn = document.createElement('button');
        loginBtn.className = 'login-btn';
        loginBtn.onclick = loginComGoogle;
        loginBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"/>
            </svg>
            Entrar com Google
        `;

        // Insere antes do carrinho
        const cartIcon = header.querySelector('.cart-icon');
        if (cartIcon) {
            header.insertBefore(loginBtn, cartIcon);
        } else {
            header.appendChild(loginBtn);
        }
    }
}

// ================================================
// FUNÇÕES DE API - USUÁRIO
// ================================================

async function buscarPerfilUsuario() {
    if (!currentToken) {
        console.error('Usuário não autenticado');
        return null;
    }

    try {
        const response = await fetch('/api/user-profile', {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            mongoUser = data.user;
            return data.user;
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        
        // Fallback para dados do cache
        try {
            const cached = localStorage.getItem('mongoUser');
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.warn('Erro ao carregar cache:', e);
        }
        
        return null;
    }
}

async function atualizarEndereco(addressData) {
    if (!currentToken) {
        showNotification('Você precisa estar logado!');
        return false;
    }

    try {
        const response = await fetch('/api/user-address', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(addressData)
        });

        const data = await response.json();

        if (data.success) {
            mongoUser = data.user;
            
            // Atualiza cache
            try {
                localStorage.setItem('mongoUser', JSON.stringify(mongoUser));
            } catch (e) {
                console.warn('Erro ao salvar cache:', e);
            }
            
            showNotification('✅ Endereço salvo com sucesso!');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        showNotification('❌ Erro ao salvar endereço');
        return false;
    }
}

async function buscarPedidosUsuario() {
    if (!currentToken) {
        console.error('Usuário não autenticado');
        return [];
    }

    try {
        const response = await fetch('/api/user-orders', {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            return data.orders;
        }
        
        return [];
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return [];
    }
}

// ================================================
// PROTEÇÃO DE PÁGINAS
// ================================================
function verificarAutenticacao() {
    if (!currentUser) {
        showNotification('Você precisa estar logado para acessar esta página');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return false;
    }
    return true;
}

async function preencherFormularioComDadosSalvos() {
    if (!currentUser) return;

    const userData = await buscarPerfilUsuario();
    
    if (userData && userData.address) {
        const addr = userData.address;
        
        const fields = {
            'name': userData.name,
            'email': userData.email,
            'phone': userData.phone,
            'cep': addr.cep,
            'street': addr.street,
            'number': addr.number,
            'complement': addr.complement,
            'neighborhood': addr.neighborhood,
            'city': addr.city,
            'state': addr.state
        };

        Object.keys(fields).forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element && fields[fieldName]) {
                element.value = fields[fieldName];
            }
        });
    }
}

// ================================================
// HELPERS
// ================================================
function showNotification(message) {
    // Usa a função do script.js se disponível
    if (typeof window.showNotification === 'function') {
        window.showNotification(message);
    } else {
        console.log('📢', message);
        alert(message);
    }
}

// ================================================
// EXPORTAR FUNÇÕES GLOBALMENTE
// ================================================
window.firebaseAuth = {
    loginComGoogle,
    logout,
    getCurrentUser: () => currentUser,
    getCurrentToken: () => currentToken,
    getMongoUser: () => mongoUser,
    buscarPerfilUsuario,
    atualizarEndereco,
    buscarPedidosUsuario,
    verificarAutenticacao,
    preencherFormularioComDadosSalvos
};

console.log('🔐 Firebase Auth carregado');