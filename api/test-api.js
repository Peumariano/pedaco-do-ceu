// api/test-api.js
// Arquivo de TESTE para verificar se a API da Vercel funciona

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Retorna sucesso para qualquer método
    return res.status(200).json({
        success: true,
        message: '✅ API funcionando!',
        method: req.method,
        timestamp: new Date().toISOString()
    });
};