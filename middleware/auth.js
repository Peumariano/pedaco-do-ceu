// middleware/auth.js
// Verifica se o usuário está logado via Firebase

const admin = require('firebase-admin');
const User = require('../models/User');

// Inicializa Firebase Admin (só uma vez)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // A chave privada tem \n no .env que precisa ser convertido
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

// ← Middleware principal: verifica token do Google
const authMiddleware = async (req, res, next) => {
    try {
        // Pega o token do header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticação não fornecido'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verifica o token com o Firebase
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Busca ou cria o usuário no MongoDB
        let user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            // Primeira vez logando → cria o usuário no banco
            user = new User({
                firebaseUid: decodedToken.uid,
                name: decodedToken.name || 'Usuário',
                email: decodedToken.email,
                avatar: decodedToken.picture || null
            });
            await user.save();
            console.log('✅ Novo usuário criado:', user.email);
        } else {
            // Atualiza último login
            await user.updateLastLogin();
        }

        // Disponibiliza o usuário para a rota
        req.user = user;
        next();

    } catch (error) {
        console.error('❌ Erro na autenticação:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Token inválido ou expirado'
        });
    }
};

// ← Middleware opcional: verifica se é admin
const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado. Apenas administradores.'
        });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };