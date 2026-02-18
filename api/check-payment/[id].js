// api/check-payment.js
const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const payment = new Payment(client);

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Pega o ID do pagamento da URL
        // URL será: /api/check-payment?id=123456789
        const paymentId = req.query.id;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID is required'
            });
        }

        console.log(`Verificando pagamento: ${paymentId}`);

        const paymentInfo = await payment.get({ id: paymentId });

        console.log(`Status: ${paymentInfo.status}`);

        return res.status(200).json({
            success: true,
            payment: {
                id: paymentInfo.id,
                status: paymentInfo.status,
                statusDetail: paymentInfo.status_detail,
                amount: paymentInfo.transaction_amount,
                dateCreated: paymentInfo.date_created,
                dateApproved: paymentInfo.date_approved
            }
        });

    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);

        return res.status(500).json({
            success: false,
            error: 'Erro ao verificar status do pagamento',
            message: error.message
        });
    }
};