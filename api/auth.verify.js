// api/auth-verify.js
// VERSÃO COM CORS COMPLETO E LOGS

const admin = require('firebase-admin');
const mongoose = require('mongoose');

// Inicializa Firebase (apenas uma vez)
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
        console.error('❌ Firebase init error:', error.message);
    }
}

// Cache de conexão
let cachedDb = null;

async function connectDB() {
    if (cachedDb) return cachedDb;
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    return db;
}

// Schema do User
const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: String,
    phone: { type: String, default: '' },
    address: {
        cep: { type: String, default: '' },
        street: { type: String, default: '' },
        number: { type: String, default: '' },
        complement: { type: String, default: '' },
        neighborhood: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' }
    },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    role: { type: String, default: 'customer' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ================================================
// HANDLER PRINCIPAL
// ================================================
module.exports = async (req, res) => {
    
    console.log(`📥 Request: ${req.method} ${req.url}`);

    // ================================================
    // CORS HEADERS - SEMPRE PRIMEIRO!
    // ================================================
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    res.setHeader('Content-Type', 'application/json');

    // ================================================
    // PREFLIGHT REQUEST (OPTIONS)
    // ================================================
    if (req.method === 'OPTIONS') {
        console.log('✅ Preflight OPTIONS - respondendo OK');
        return res.status(200).end();
    }

    // ================================================
    // ACEITA GET PARA TESTE
    // ================================================
    if (req.method === 'GET') {
        console.log('⚠️ GET request recebido (use POST)');
        return res.status(200).json({ 
            success: false,
            message: 'Esta rota aceita apenas POST',
            hint: 'Use método POST com Authorization header'
        });
    }

    // ================================================
    // VALIDA MÉTODO
    // ================================================
    if (req.method !== 'POST') {
        console.log(`❌ Método não permitido: ${req.method}`);
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed. Use POST.' 
        });
    }

    // ================================================
    // PROCESSA POST
    // ================================================
    try {
        console.log('🔐 Processando autenticação...');

        // 1. Valida token
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.log('❌ Authorization header ausente');
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido'
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.log('❌ Authorization header formato errado');
            return res.status(401).json({
                success: false,
                error: 'Token deve começar com "Bearer "'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        if (!token || token === 'null' || token === 'undefined') {
            console.log('❌ Token vazio');
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        console.log('🔑 Token recebido (primeiros 20 chars):', token.substring(0, 20) + '...');

        // 2. Verifica token com Firebase
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
            console.log('✅ Token verificado:', decodedToken.email);
        } catch (error) {
            console.error('❌ Token inválido:', error.code);
            return res.status(401).json({
                success: false,
                error: 'Token inválido: ' + error.code
            });
        }

        // 3. Conecta MongoDB
        try {
            await connectDB();
            console.log('✅ MongoDB conectado');
        } catch (error) {
            console.error('❌ MongoDB erro:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Erro ao conectar banco de dados'
            });
        }

        // 4. Pega dados do body
        const { firebaseUid, name, email, avatar } = req.body || {};

        console.log('📝 Dados recebidos:', { firebaseUid, name, email });

        // 5. Busca ou cria usuário
        let user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            console.log('📝 Criando novo usuário...');
            
            user = new User({
                firebaseUid: decodedToken.uid,
                name: name || decodedToken.name || email?.split('@')[0] || 'Usuário',
                email: email || decodedToken.email,
                avatar: avatar || decodedToken.picture
            });

            try {
                await user.save();
                console.log(`✅ Usuário criado: ${user.email}`);
            } catch (saveError) {
                // Se erro de duplicação, tenta buscar
                if (saveError.code === 11000) {
                    user = await User.findOne({ email: email || decodedToken.email });
                    console.log('ℹ️ Usuário já existia');
                } else {
                    throw saveError;
                }
            }

        } else {
            console.log('🔄 Atualizando usuário existente...');
            user.lastLogin = new Date();
            if (avatar) user.avatar = avatar;
            await user.save();
            console.log(`✅ Usuário atualizado: ${user.email}`);
        }

        // 6. Retorna resposta
        const response = {
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                phone: user.phone,
                address: user.address,
                role: user.role,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            },
            message: 'Autenticação bem-sucedida'
        };

        console.log('✅ Sucesso! Retornando usuário:', user.email);

        return res.status(200).json(response);

    } catch (error) {
        console.error('❌ Erro no handler:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};