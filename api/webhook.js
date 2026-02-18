// api/webhook.js
const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const payment = new Payment(client);

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Webhook recebido do Mercado Pago');
        console.log('Body:', req.body);

        const { type, data } = req.body;

        // Responde imediatamente (200 OK)
        res.status(200).send('OK');

        // Processa notificação de pagamento
        if (type === 'payment' && data?.id) {
            console.log(`Processando notificação de pagamento: ${data.id}`);

            const paymentInfo = await payment.get({ id: data.id });

            console.log(`Status: ${paymentInfo.status}`);

            // AQUI: Adicione sua lógica
            if (paymentInfo.status === 'approved') {
                console.log('🎉 PAGAMENTO APROVADO!');
                // TODO: Enviar email
                // TODO: Atualizar banco de dados
                // TODO: Notificar WhatsApp
            }

            if (paymentInfo.status === 'rejected') {
                console.log('Pagamento rejeitado');
            }

            if (paymentInfo.status === 'cancelled') {
                console.log('Pagamento cancelado');
            }
        }

    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        // Não retorna erro 500 para não fazer o MP retentar
    }
};