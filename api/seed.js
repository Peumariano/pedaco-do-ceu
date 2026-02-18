// api/seed.js
// Rota para popular o MongoDB com os produtos iniciais
// ATENÇÃO: Use esta rota APENAS UMA VEZ para inserir os produtos!

const mongoose = require('mongoose');

let cachedDb = null;

async function connectDB() {
    if (cachedDb) return cachedDb;
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    return db;
}

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    active: { type: Boolean, default: true }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Proteção: só aceita POST (para evitar chamadas acidentais)
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ 
            success: false, 
            error: 'Use POST para popular o banco' 
        });
    }

    try {
        console.log('🌱 Iniciando seed do banco...');
        await connectDB();

        // Todos os seus produtos
        const brigadeiros = [
            { name: "Brigadeiro Tradicional", category: "tradicional", description: "O clássico brigadeiro de chocolate granulado", price: 3.50, image: "assets/brigadeiro-tradicional.png" },
            { name: "Brigadeiro de Beijinho", category: "tradicional", description: "Brigadeiro com sabor de prestígio", price: 3.50, image: "assets/brigadeiro-beijinho.png" },
            { name: "Brigadeiro de Ninho", category: "tradicional", description: "Feito com leite ninho original e cobertura especial", price: 3.50, image: "assets/brigadeiro-ninho.png" },
            { name: "Brigadeiro de Coco queimado", category: "tradicional", description: "Brigadeiro com sabor de coco queimado", price: 3.50, image: "assets/brigadeiro-coco-queimado.png" },
            { name: "Bicho de Pé", category: "especial", description: "Sabor sofisticado de morango nesquik", price: 3.50, image: "assets/brigadeiro-morango.png" },
            { name: "Brigadeiro de Paçoca", category: "especial", description: "Sabor de paçoca em formato de brigadeiro", price: 3.50, image: "assets/brigadeiro-pacoca.png" },
            { name: "Brigadeiro de Limão", category: "especial", description: "Refrescante brigadeiro de limão, feito com a própria fruta", price: 3.50, image: "assets/brigadeiro-limao.png" },
            { name: "Brigadeiro de Amendoim", category: "especial", description: "Massa cremosa de amendoim", price: 3.50, image: "assets/brigadeiro-amendoim.png" },
            { name: "Brigadeiro Ferrero Rocher", category: "diferente", description: "Cremoso brigadeiro tradicional com amendoim", price: 3.50, image: "assets/brigadeiro-charge.png" },
            { name: "Brigadeiro de Oreo", category: "diferente", description: "Brigadeiro com pedaços de Oreo", price: 5.50, image: "assets/brigadeiro-oreo.png" },
            { name: "Brigadeiro Casadinho", category: "diferente", description: "Cremoso brigadeiro preto e ninho", price: 3.50, image: "assets/brigadeiro-casadinho.png" },
            { name: "Brigadeiro M&M", category: "diferente", description: "Brigadeiro tradicional com M&M", price: 3.50, image: "assets/brigadeiro-M&M.png" },
            { name: "Caixa de Brigadeiro", category: "Caixas", description: "Brigadeiros personalizados", price: 42.00, image: "assets/caixa-brigadeiro.png" },
            { name: "Caixa com 4 brigadeiros", category: "Caixas", description: "Caixa com 4 brigadeiros a sua escolha", price: 14.00, image: "assets/caixa-brigadeiro2.png" },
            { name: "Coxinha de Morango", category: "diferente", description: "Coxinha de morango em formato de coração", price: 15.00, image: "assets/coxinha-morango.png" },
            { name: "Coxinha de Morango", category: "diferente", description: "Coxinha de morango", price: 12.00, image: "assets/coxinha-morango2.png" },
            { name: "Coxinha de Morango de Ninho", category: "diferente", description: "Coxinha de morango em formato de coração com sabor ninho", price: 15.00, image: "assets/coxinha-morango-ninho.png" },
            { name: "Coxinha de Morango de Ninho", category: "diferente", description: "Coxinha de morango com sabor ninho", price: 12.00, image: "assets/coxinha-morango-ninho2.png" }
        ];

        // LIMPA O BANCO (cuidado em produção!)
        console.log('Limpando produtos existentes...');
        await Product.deleteMany({});

        // INSERE OS PRODUTOS
        console.log('Inserindo produtos...');
        const inserted = await Product.insertMany(brigadeiros);

        console.log(`${inserted.length} produtos inseridos com sucesso!`);

        res.status(200).json({ 
            success: true, 
            message: `${inserted.length} produtos inseridos no MongoDB!`,
            count: inserted.length,
            products: inserted.map(p => ({ name: p.name, category: p.category }))
        });

    } catch (error) {
        console.error('Erro ao popular banco:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};