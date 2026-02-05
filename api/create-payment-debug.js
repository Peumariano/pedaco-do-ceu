// api/create-payment-debug.js
// Versão simplificada para DEBUG

module.exports = async (req, res) => {
    console.log('🔧 DEBUG: Rota chamada!');
    console.log('Method:', req.method);
    console.log('Body:', req.body);

    // SEMPRE retorna JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            method: req.method 
        });
    }

    try {
        // Verifica se recebeu os dados
        const { amount, customer } = req.body;

        console.log('Amount:', amount);
        console.log('Customer:', customer);

        // Retorna sucesso FAKE para testar
        return res.status(200).json({
            success: true,
            message: 'DEBUG: Rota funcionando!',
            receivedData: {
                amount,
                customerEmail: customer?.email
            },
            payment: {
                id: 'FAKE-123456',
                status: 'pending',
                qrCode: 'FAKE-QR-CODE',
                qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                amount: amount
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};