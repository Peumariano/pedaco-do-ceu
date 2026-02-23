// api/create-payment.js
const { MercadoPagoConfig, Payment } = require('mercadopago');

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const payment = new Payment(client);

// Armazenamento temporário (em produção, use um banco de dados)
// Por enquanto, vamos usar apenas para criar o pagamento
const pedidos = new Map();

module.exports = async (req, res) => {
    // Habilita CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('📦 Nova solicitação de pagamento');
        console.log('Body:', req.body);

        const { 
            amount,
            description,
            customer,
            items,
            orderId
        } = req.body;

        // Validações
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valor inválido'
            });
        }

        if (!customer || !customer.email) {
            return res.status(400).json({
                success: false,
                error: 'Email do cliente é obrigatório'
            });
        }

        // Criar pagamento Pix
        const paymentData = {
            transaction_amount: parseFloat(amount),
            description: description || 'Pedido Brigaderia Delícia',
            payment_method_id: 'pix',
            payer: {
                email: customer.email,
                first_name: customer.name?.split(' ')[0] || 'Cliente',
                last_name: customer.name?.split(' ').slice(1).join(' ') || 'Brigaderia',
                identification: {
                    type: 'CPF',
                    number: customer.cpf?.replace(/\D/g, '') || '00000000000'
                }
            },
            metadata: {
                order_id: orderId,
                customer_phone: customer.phone || '',
                items: JSON.stringify(items || [])
            },
            notification_url: `${process.env.VERCEL_URL || 'https://seu-projeto.vercel.app'}/api/webhook`
        };

        console.log('💳 Criando pagamento no Mercado Pago...');

        const response = await payment.create({ body: paymentData });

        console.log('✅ Pagamento criado:', response.id);

        // Extrair dados do Pix
        const pixData = {
            paymentId: response.id,
            status: response.status,
            qrCode: response.point_of_interaction?.transaction_data?.qr_code || null,
            qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64 || null,
            expirationDate: response.date_of_expiration || null
        };

        // Retorna resposta
        return res.status(200).json({
            success: true,
            payment: {
                id: response.id,
                status: response.status,
                qrCode: pixData.qrCode,
                qrCodeBase64: pixData.qrCodeBase64,
                expirationDate: pixData.expirationDate,
                amount: response.transaction_amount
            }
        });

    } catch (error) {
        console.error('❌ Erro ao criar pagamento:', error);

        return res.status(500).json({
            success: false,
            error: 'Erro ao processar pagamento',
            message: error.message
        });
    }
};