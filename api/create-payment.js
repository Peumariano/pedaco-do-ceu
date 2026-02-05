// api/create-payment.js
// Versão corrigida - Mercado Pago Pix

const { MercadoPagoConfig, Payment } = require('mercadopago');

module.exports = async (req, res) => {
    console.log('🔧 Rota /api/create-payment chamada');

    // SEMPRE define Content-Type como JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde OPTIONS (preflight CORS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas aceita POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            method: req.method 
        });
    }

    try {
        console.log('📦 Body recebido:', req.body);

        // Verifica se o token está configurado
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            console.error('❌ Token do Mercado Pago não configurado!');
            return res.status(500).json({
                success: false,
                error: 'Configuração incompleta no servidor'
            });
        }

        console.log('✅ Token encontrado');

        // Extrai dados do body
        const { amount, description, customer, items, orderId } = req.body;

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

        console.log('✅ Dados validados');
        console.log(`Criando pagamento de R$ ${amount} para ${customer.email}`);

        // Inicializa Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        });

        const payment = new Payment(client);

        // Prepara dados do pagamento
        const paymentData = {
            transaction_amount: parseFloat(amount),
            description: description || 'Pedido Pedaço do Céu',
            payment_method_id: 'pix',
            payer: {
                email: customer.email,
                first_name: customer.name?.split(' ')[0] || 'Cliente',
                last_name: customer.name?.split(' ').slice(1).join(' ') || '',
                identification: {
                    type: 'CPF',
                    number: customer.cpf?.replace(/\D/g, '') || '00000000000'
                }
            },
            metadata: {
                order_id: orderId || Date.now().toString(),
                customer_phone: customer.phone || '',
                items_summary: items ? items.length + ' itens' : 'N/A'
            }
        };

        console.log('💳 Enviando para Mercado Pago...');

        // Cria o pagamento
        const response = await payment.create({ body: paymentData });

        console.log('✅ Pagamento criado! ID:', response.id);
        console.log('Status:', response.status);

        // Extrai dados do Pix
        const qrCode = response.point_of_interaction?.transaction_data?.qr_code || null;
        const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64 || null;

        if (!qrCode || !qrCodeBase64) {
            console.warn('⚠️ QR Code não retornado pelo Mercado Pago');
        }

        // Retorna sucesso
        return res.status(200).json({
            success: true,
            payment: {
                id: response.id,
                status: response.status,
                qrCode: qrCode,
                qrCodeBase64: qrCodeBase64,
                expirationDate: response.date_of_expiration || null,
                amount: response.transaction_amount
            }
        });

    } catch (error) {
        console.error('❌ Erro ao criar pagamento:', error);
        console.error('Stack:', error.stack);

        // Tratamento específico de erros do Mercado Pago
        if (error.cause) {
            console.error('Causa do erro:', JSON.stringify(error.cause, null, 2));
        }

        return res.status(500).json({
            success: false,
            error: 'Erro ao processar pagamento',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};