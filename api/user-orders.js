// api/user-orders.js
// Busca pedidos do usuário do MongoDB

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

// Schemas
const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    name: String,
    email: String,
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderNumber: String,
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
        subtotal: Number
    }],
    total: Number,
    deliveryAddress: {
        cep: String,
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String
    },
    paymentMethod: String,
    paymentStatus: { type: String, default: 'pending' },
    mercadoPagoId: String,
    status: { type: String, default: 'aguardando_pagamento' },
    observations: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
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

        // Busca usuário
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Busca pedidos do usuário
        const orders = await Order.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(50); // Limita a 50 pedidos mais recentes

        console.log(`📦 Retornando ${orders.length} pedidos para ${user.email}`);

        return res.status(200).json({
            success: true,
            orders: orders,
            count: orders.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
};