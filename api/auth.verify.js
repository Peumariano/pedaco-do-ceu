// api/auth-verify.js
// VERSÃO SIMPLIFICADA PARA TESTE
// Coloque este arquivo em: api/auth-verify.js (NA RAIZ DO PROJETO)

const admin = require('firebase-admin');
const mongoose = require('mongoose');

// Inicializa Firebase (apenas uma vez)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
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
    firebaseUid: String,
    name: String,
    email: String,
    avatar: String,
    phone: String,
    address: {
        cep: String,
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String
    },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    role: { type: String, default: 'customer' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// HANDLER
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
        return res.status(405).json({ error: 'Use POST' });
    }

    try {
        // Pega token
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verifica token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Conecta MongoDB
        await connectDB();

        const { firebaseUid, name, email, avatar } = req.body;

        // Busca ou cria usuário
        let user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            user = new User({
                firebaseUid: decodedToken.uid,
                name: name || decodedToken.name || 'Usuário',
                email: email || decodedToken.email,
                avatar: avatar || decodedToken.picture
            });
            await user.save();
        } else {
            user.lastLogin = new Date();
            if (avatar) user.avatar = avatar;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                phone: user.phone,
                address: user.address,
                role: user.role,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};