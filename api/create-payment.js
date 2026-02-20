// api/create-payment.js
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { authMiddleware } = require('../middleware/auth');

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const payment = new Payment(client);

module.exports = async (req, res) => {

    await authMiddleware(req, res, () => {});
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Nova solicitação de pagamento');

        const { amount, description, customer, items, orderId } = req.body;

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

        const paymentData = {
            transaction_amount: parseFloat(amount),
            description: description || 'Pedido Pedaço do Céu',
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
            }
        };

        console.log('Criando pagamento no Mercado Pago...');

        const response = await payment.create({ body: paymentData });

        console.log('Pagamento criado:', response.id);

        return res.status(200).json({
            success: true,
            payment: {
                id: response.id,
                status: response.status,
                qrCode: response.point_of_interaction?.transaction_data?.qr_code,
                qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
                expirationDate: response.date_of_expiration,
                amount: response.transaction_amount
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao processar pagamento',
            message: error.message
        });
    }
};