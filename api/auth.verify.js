// api/auth-verify.js
// Verifica token Firebase e sincroniza usuário com MongoDB

const admin = require('firebase-admin');
const mongoose = require('mongoose');

// Inicializa Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

// Cache de conexão MongoDB
let cachedDb = null;

async function connectDB() {
    if (cachedDb) return cachedDb;
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    return db;
}

// Schema do Usuário (inline para serverless)
const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
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

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

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
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
        } catch (error) {
            console.error('Token inválido:', error.message);
            return res.status(401).json({
                success: false,
                error: 'Token inválido ou expirado'
            });
        }

        // Conecta ao MongoDB
        await connectDB();

        // Dados do usuário vindos do body
        const { firebaseUid, name, email, avatar } = req.body;

        // Busca ou cria usuário no MongoDB
        let user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            // Primeira vez logando → cria usuário
            user = new User({
                firebaseUid: decodedToken.uid,
                name: name || decodedToken.name || 'Usuário',
                email: email || decodedToken.email,
                avatar: avatar || decodedToken.picture || null
            });

            await user.save();
            console.log('✅ Novo usuário criado:', user.email);

        } else {
            // Já existe → atualiza último login e avatar
            user.lastLogin = new Date();
            
            // Atualiza avatar se mudou
            if (avatar && avatar !== user.avatar) {
                user.avatar = avatar;
            }

            await user.save();
            console.log('✅ Usuário atualizado:', user.email);
        }

        // Retorna usuário (sem firebaseUid por segurança)
        const userResponse = user.toObject();
        delete userResponse.firebaseUid;

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
            message: error.message
        });
    }
};