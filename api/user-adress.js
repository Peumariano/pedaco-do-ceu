// api/user-address.js
// Atualiza endereço do usuário no MongoDB

const admin = require('firebase-admin');
const mongoose = require('mongoose');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

let cachedDb = null;

async function connectDB() {
    if (cachedDb) return cachedDb;
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    return db;
}

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
    role: { type: String, default: 'customer' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'PUT') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verifica token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Conecta ao MongoDB
        await connectDB();

        // Dados do endereço
        const { cep, street, number, complement, neighborhood, city, state, phone } = req.body;

        // Atualiza usuário
        const user = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            {
                address: {
                    cep: cep || '',
                    street: street || '',
                    number: number || '',
                    complement: complement || '',
                    neighborhood: neighborhood || '',
                    city: city || '',
                    state: state || ''
                },
                phone: phone || ''
            },
            { new: true, runValidators: true }
        ).select('-firebaseUid');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        console.log('✅ Endereço atualizado:', user.email);

        return res.status(200).json({
            success: true,
            user: user,
            message: 'Endereço atualizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar endereço:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
};