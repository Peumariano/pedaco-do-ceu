// api/products.js
// Rota para buscar produtos do MongoDB

const mongoose = require('mongoose');

// Cache da conexão (importante para serverless!)
let cachedDb = null;

async function connectDB() {
    if (cachedDb) {
        console.log('✅ Usando conexão MongoDB em cache');
        return cachedDb;
    }
    
    console.log('🔌 Conectando ao MongoDB...');
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    console.log('✅ MongoDB conectado!');
    return db;
}

// Schema do Produto
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    active: { type: Boolean, default: true }
});

// Model (verifica se já existe antes de criar)
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
        // Conecta ao MongoDB
        await connectDB();

        // Filtra por categoria (opcional)
        const { category } = req.query;
        const filter = { active: true };
        
        if (category && category !== 'todos') {
            filter.category = category;
        }

        // Busca produtos
        const products = await Product.find(filter)
            .sort({ category: 1, name: 1 })
            .lean(); // .lean() retorna objetos simples (mais rápido)

        console.log(`📦 Retornando ${products.length} produtos`);

        res.status(200).json({ 
            success: true, 
            products: products,
            count: products.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};