// middleware/auth.js
// Middleware de autenticação Firebase + MongoDB

const admin = require('firebase-admin');
const User = require('../models/User');

// Inicializa Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
        });
        console.log('✅ Firebase Admin inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error);
    }
}

// ================================================
// MIDDLEWARE: Verifica autenticação
// ================================================
async function authMiddleware(req, res, next) {
    try {
        // Pega token do header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verifica token com Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Busca usuário no MongoDB
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado no banco de dados'
            });
        }

        // Anexa usuário na requisição
        req.user = user;
        req.firebaseUser = decodedToken;

        next();

    } catch (error) {
        console.error('❌ Erro na autenticação:', error);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado. Faça login novamente.'
            });
        }

        if (error.code === 'auth/argument-error') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Erro ao verificar autenticação',
            message: error.message
        });
    }
}

// ================================================
// MIDDLEWARE: Verifica se é admin
// ================================================
async function adminMiddleware(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Requer permissões de administrador.'
            });
        }

        next();

    } catch (error) {
        console.error('❌ Erro no middleware admin:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao verificar permissões'
        });
    }
}

// ================================================
// FUNÇÃO: Cria ou atualiza usuário
// ================================================
async function syncUserWithMongoDB(firebaseUser) {
    try {
        const { uid, name, email, picture } = firebaseUser;

        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            // Cria novo usuário
            user = new User({
                firebaseUid: uid,
                name: name || email.split('@')[0],
                email: email,
                avatar: picture || null
            });
            await user.save();
            console.log(`✅ Novo usuário criado: ${email}`);
        } else {
            // Atualiza último login e avatar
            user.lastLogin = new Date();
            if (picture && picture !== user.avatar) {
                user.avatar = picture;
            }
            await user.save();
            console.log(`✅ Usuário atualizado: ${email}`);
        }

        return user;

    } catch (error) {
        console.error('❌ Erro ao sincronizar usuário:', error);
        throw error;
    }
}

module.exports = {
    authMiddleware,
    adminMiddleware,
    syncUserWithMongoDB
};