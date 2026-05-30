
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Models
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');

// Middleware de autenticação
const { authMiddleware, adminMiddleware } = require('./middleware/auth');

// Mercado Pago
const { MercadoPagoConfig, Payment } = require('mercadopago');
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});
const payment = new Payment(mpClient);

const app = express();
const PORT = process.env.PORT || 3000;

// ================================================
// MIDDLEWARES
// ================================================
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================================================
// CONEXÃO COM MONGODB ATLAS
// ================================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Atlas conectado!'))
    .catch(err => console.error('Erro MongoDB:', err));

// ================================================
// ROTAS PÚBLICAS - PRODUTOS
// ================================================

// GET /api/products → Lista todos os brigadeiros
app.get('/api/products', async (req, res) => {
    try {
        const { category } = req.query;

        // Filtra por categoria se informada
        const filter = { active: true };
        if (category && category !== 'todos') {
            filter.category = category;
        }

        const products = await Product.find(filter).sort({ category: 1, name: 1 });

        res.json({ success: true, products });

    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================
// ROTAS AUTENTICADAS - USUÁRIO
// ================================================

// GET /api/user/me → Dados do usuário logado
app.get('/api/user/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('orders')
            .select('-firebaseUid');

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/user/address → Salva endereço do usuário
app.put('/api/user/address', authMiddleware, async (req, res) => {
    try {
        const { cep, street, number, complement, neighborhood, city, state, phone } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                address: { cep, street, number, complement, neighborhood, city, state },
                phone
            },
            { new: true }
        );

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================
// ROTAS AUTENTICADAS - PEDIDOS
// ================================================

// POST /api/orders → Cria novo pedido
app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const { items, paymentMethod, deliveryAddress, observations } = req.body;

        // Calcula total e monta itens
        let total = 0;
        const orderItems = items.map(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            return {
                product: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal
            };
        });

        const order = new Order({
            user: req.user._id,
            items: orderItems,
            total,
            deliveryAddress,
            paymentMethod,
            observations: observations || ''
        });

        await order.save();

        // Adiciona pedido ao histórico do usuário
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { orders: order._id } }
        );

        console.log(`Pedido ${order.orderNumber} criado!`);

        res.json({ success: true, order });

    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/orders → Histórico de pedidos do usuário
app.get('/api/orders', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================
// ROTAS - PAGAMENTO (MERCADO PAGO)
// ================================================

// POST /api/create-payment → Cria pagamento Pix
app.post('/api/create-payment', authMiddleware, async (req, res) => {
    try {
        const { amount, description, customer, items, orderId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, error: 'Valor inválido' });
        }

        const paymentData = {
            transaction_amount: parseFloat(amount),
            description: description || 'Pedido Pedaço do Céu',
            payment_method_id: 'pix',
            payer: {
                email: req.user.email,
                first_name: req.user.name.split(' ')[0],
                last_name: req.user.name.split(' ').slice(1).join(' ') || '',
                identification: {
                    type: 'CPF',
                    number: customer?.cpf?.replace(/\D/g, '') || '00000000000'
                }
            }
        };

        const response = await payment.create({ body: paymentData });

        // Atualiza pedido com ID do Mercado Pago
        if (orderId) {
            await Order.findOneAndUpdate(
                { orderNumber: orderId },
                { mercadoPagoId: response.id.toString() }
            );
        }

        res.json({
            success: true,
            payment: {
                id: response.id,
                status: response.status,
                qrCode: response.point_of_interaction?.transaction_data?.qr_code,
                qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
                amount: response.transaction_amount
            }
        });

    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/check-payment/:id → Verifica status do pagamento
app.get('/api/check-payment/:id', authMiddleware, async (req, res) => {
    try {
        const paymentInfo = await payment.get({ id: req.params.id });
        res.json({ success: true, payment: { id: paymentInfo.id, status: paymentInfo.status } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/webhook → Recebe notificações do Mercado Pago
app.post('/api/webhook', async (req, res) => {
    res.status(200).send('OK');
    try {
        const { type, data } = req.body;
        if (type === 'payment' && data?.id) {
            const paymentInfo = await payment.get({ id: data.id });
            if (paymentInfo.status === 'approved') {
                // Atualiza o pedido no banco
                await Order.findOneAndUpdate(
                    { mercadoPagoId: data.id.toString() },
                    { paymentStatus: 'approved', status: 'confirmado' }
                );
                console.log(`🎉 Pagamento ${data.id} aprovado!`);
            }
        }
    } catch (error) {
        console.error('Erro no webhook:', error);
    }
});

// ================================================
// ROTAS ADMIN - PRODUTOS (PROTEGIDAS)
// ================================================

// POST /api/admin/products → Adiciona produto
app.post('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================
// SEED: Popular produtos iniciais no MongoDB
// ================================================

app.post('/api/admin/seed', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const brigadeiros = [
            { name: "Brigadeiro Tradicional", category: "tradicional", description: "O clássico brigadeiro de chocolate granulado", price: 3.50, image: "assets/brigadeiro-tradicional.png" },
            { name: "Brigadeiro de Beijinho", category: "tradicional", description: "Brigadeiro com sabor de prestígio", price: 3.50, image: "assets/brigadeiro-beijinho.png" },
            { name: "Brigadeiro de Ninho", category: "tradicional", description: "Feito com leite ninho original", price: 3.50, image: "assets/brigadeiro-ninho.png" },
            { name: "Brigadeiro de Coco Queimado", category: "tradicional", description: "Brigadeiro com sabor de coco queimado", price: 3.50, image: "assets/brigadeiro-coco-queimado.png" },
            { name: "Bicho de Pé", category: "especial", description: "Sabor sofisticado de morango nesquik", price: 3.50, image: "assets/brigadeiro-morango.png" },
            { name: "Brigadeiro de Paçoca", category: "especial", description: "Sabor de paçoca em formato de brigadeiro", price: 3.50, image: "assets/brigadeiro-pacoca.png" },
            { name: "Brigadeiro de Limão", category: "especial", description: "Refrescante brigadeiro de limão", price: 3.50, image: "assets/brigadeiro-limao.png" },
            { name: "Brigadeiro de Amendoim", category: "especial", description: "Massa cremosa de amendoim", price: 3.50, image: "assets/brigadeiro-amendoim.png" },
            { name: "Brigadeiro Charge", category: "diferente", description: "Cremoso brigadeiro tradicional com amendoim", price: 3.50, image: "assets/brigadeiro-charge.png" },
            { name: "Brigadeiro de Oreo", category: "diferente", description: "Brigadeiro branco com pedaços de Oreo", price: 5.50, image: "assets/brigadeiro-oreo.png" },
            { name: "Brigadeiro Casadinho", category: "diferente", description: "Cremoso brigadeiro preto e ninho", price: 3.50, image: "assets/brigadeiro-casadinho.png" },
            { name: "Brigadeiro M&M", category: "diferente", description: "Brigadeiro cremoso com sabor M&M", price: 3.50, image: "assets/brigadeiro-M&M.png" },
            { name: "Caixa de Brigadeiro", category: "Caixas", description: "Brigadeiros personalizados", price: 27.00, image: "assets/caixa-brigadeiro.png" }
        ];

        await Product.deleteMany({});
        await Product.insertMany(brigadeiros);

        res.json({ success: true, message: `${brigadeiros.length} produtos inseridos!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================
// INICIA SERVIDOR
// ================================================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('PEDAÇO DO CÉU - SERVIDOR INICIADO');
    console.log('='.repeat(50));
    console.log(`Porta: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log('='.repeat(50) + '\n');
});

module.exports = app;