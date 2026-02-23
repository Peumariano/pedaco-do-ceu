// api/auth-verify.js
// Verifica token Firebase e sincroniza usuário com MongoDB
// ATENÇÃO: Este arquivo deve estar em /api/auth-verify.js

const admin = require('firebase-admin');
const mongoose = require('mongoose');

// ================================================
// INICIALIZA FIREBASE ADMIN
// ================================================
if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        if (!privateKey) {
            throw new Error('FIREBASE_PRIVATE_KEY não encontrada nas variáveis de ambiente');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey.replace(/\\n/g, '\n')
            })
        });
        
        console.log('✅ Firebase Admin inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
    }
}

// ================================================
// CONEXÃO MONGODB
// ================================================
let cachedDb = null;

async function connectDB() {
    if (cachedDb) {
        console.log('📦 Usando conexão MongoDB em cache');
        return cachedDb;
    }
    
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        cachedDb = db;
        console.log('✅ MongoDB conectado');
        return db;
    } catch (error) {
        console.error('❌ Erro ao conectar MongoDB:', error.message);
        throw error;
    }
}

// ================================================
// SCHEMA DO USUÁRIO (INLINE)
// ================================================
const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, default: null },
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
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ================================================
// HANDLER PRINCIPAL
// ================================================
module.exports = async (req, res) => {
    
    // ================================================
    // CORS
    // ================================================
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Só aceita POST
    if (req.method !== 'POST') {
        console.log(`❌ Método ${req.method} não permitido`);
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        console.log('🔐 Nova requisição de autenticação');

        // ================================================
        // 1. VALIDA TOKEN
        // ================================================
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Token não fornecido');
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido. Header deve conter: Authorization: Bearer <token>'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        if (!token || token === 'null' || token === 'undefined') {
            console.log('❌ Token inválido');
            return res.status(401).json({
                success: false,
                error: 'Token inválido ou vazio'
            });
        }

        // ================================================
        // 2. VERIFICA TOKEN COM FIREBASE
        // ================================================
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
            console.log(`✅ Token verificado: ${decodedToken.email}`);
        } catch (error) {
            console.error('❌ Erro ao verificar token:', error.code);
            
            if (error.code === 'auth/id-token-expired') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado. Faça login novamente.'
                });
            }
            
            if (error.code === 'auth/argument-error') {
                return res.status(401).json({
                    success: false,
                    error: 'Token malformado ou inválido'
                });
            }
            
            return res.status(401).json({
                success: false,
                error: 'Token inválido: ' + error.message
            });
        }

        // ================================================
        // 3. CONECTA AO MONGODB
        // ================================================
        try {
            await connectDB();
        } catch (error) {
            console.error('❌ Erro ao conectar MongoDB:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao conectar ao banco de dados',
                message: error.message
            });
        }

        // ================================================
        // 4. PEGA DADOS DO BODY
        // ================================================
        const { firebaseUid, name, email, avatar } = req.body;

        // Valida dados mínimos
        if (!decodedToken.uid) {
            return res.status(400).json({
                success: false,
                error: 'UID do Firebase não encontrado no token'
            });
        }

        // ================================================
        // 5. BUSCA OU CRIA USUÁRIO
        // ================================================
        let user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            // ========== CRIA NOVO USUÁRIO ==========
            console.log('📝 Criando novo usuário...');
            
            user = new User({
                firebaseUid: decodedToken.uid,
                name: name || decodedToken.name || email?.split('@')[0] || 'Usuário',
                email: email || decodedToken.email,
                avatar: avatar || decodedToken.picture || null
            });

            try {
                await user.save();
                console.log(`✅ Usuário criado: ${user.email} (${user._id})`);
            } catch (saveError) {
                console.error('❌ Erro ao salvar usuário:', saveError);
                
                // Se foi erro de duplicação de email, tenta buscar novamente
                if (saveError.code === 11000) {
                    user = await User.findOne({ email: email || decodedToken.email });
                    if (user) {
                        console.log('ℹ️ Usuário já existia com esse email');
                    } else {
                        throw saveError;
                    }
                } else {
                    throw saveError;
                }
            }

        } else {
            // ========== ATUALIZA USUÁRIO EXISTENTE ==========
            console.log('🔄 Atualizando usuário existente...');
            
            user.lastLogin = new Date();
            
            // Atualiza avatar se mudou
            if (avatar && avatar !== user.avatar) {
                user.avatar = avatar;
            }

            // Atualiza nome se veio vazio
            if (!user.name && name) {
                user.name = name;
            }

            try {
                await user.save();
                console.log(`✅ Usuário atualizado: ${user.email}`);
            } catch (updateError) {
                console.error('❌ Erro ao atualizar usuário:', updateError);
                // Continua mesmo se der erro ao atualizar
            }
        }

        // ================================================
        // 6. RETORNA USUÁRIO (SEM DADOS SENSÍVEIS)
        // ================================================
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address,
            role: user.role,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        };

        console.log(`✅ Autenticação bem-sucedida: ${user.email}`);

        return res.status(200).json({
            success: true,
            user: userResponse,
            message: 'Autenticação bem-sucedida'
        });

    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Erro ao processar autenticação'
        });
    }
};