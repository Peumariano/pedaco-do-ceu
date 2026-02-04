// Detecta automaticamente se é local ou produção
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'  // Desenvolvimento local
    : 'https://pedaco-do-ceu-app.vercel.app/';  // Produção - usa a mesma URL (Vercel)

// Função para criar pagamento
async function criarPagamentoPix(customer, items, total) {
    try {
        console.log('💳 Criando pagamento Pix...');
        
        const orderId = `ORD-${Date.now()}`;
        const descricao = items.map(item => 
            `${item.quantity}x ${item.name}`
        ).join(', ');

        const paymentData = {
            amount: total,
            description: descricao,
            customer: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                cpf: customer.cpf || null,
            },
            items: items,
            orderId: orderId
        };

        // Chama a API
        const response = await fetch(`${API_URL}/api/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao criar pagamento');
        }

        return {
            success: true,
            payment: result.payment,
            orderId: orderId
        };

    } catch (error) {
        console.error('❌ Erro:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Função para verificar status
async function verificarStatusPagamento(paymentId) {
    try {
        const response = await fetch(`${API_URL}/api/check-payment?id=${paymentId}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        return result.payment;

    } catch (error) {
        console.error('❌ Erro:', error);
        return null;
    }
}