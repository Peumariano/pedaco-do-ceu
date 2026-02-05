// CONFIGURAÇÃO DA LOJA
const WHATSAPP_LOJA = "11991084308";

// CONFIGURAÇÃO DO EMAILJS
const EMAILJS_CONFIG = {
    publicKey: "QJEsDhXmiLiWFglo_",
    serviceId: "service_6wpm9za",
    templateId: "template_7o5c8rc"
};

// Base de dados dos produtos
const products = [
    {
        id: 1,
        name: "Brigadeiro Tradicional",
        category: "tradicional",
        description: "O clássico brigadeiro de chocolate granulado",
        price: 3.50,
        image: "assets/brigadeiro-tradicional.png"
    },
    {
        id: 2,
        name: "Brigadeiro de Beijinho",
        category: "tradicional",
        description: "Brigadeiro com sabor de prestigio",
        price: 3.50,
        image: "assets/brigadeiro-beijinho.png"
    },
    {
        id: 3,
        name: "Brigadeiro de Ninho",
        category: "tradicional",
        description: "Feito com leite ninho original e cobertura especial",
        price: 3.50,
        image: "assets/brigadeiro-ninho.png"
    },
    {
        id: 4,
        name: "Brigadeiro de Coco queimado",
        category: "tradicional",
        description: "Brigadeiro com sabor de coco queimado",
        price: 3.50,
        image: "assets/brigadeiro-coco-queimado.png"
    },
    {
        id: 5,
        name: "Bicho de Pé",
        category: "especial",
        description: "Sabor sofisticado de morango nesquik",
        price: 3.50,
        image: "assets/brigadeiro-morango.png"
    },
    {
        id: 6,
        name: "Brigadeiro de Paçoca",
        category: "especial",
        description: "Sabor de paçoca em formato de brigadeiro",
        price: 3.50,
        image: "assets/brigadeiro-pacoca.png"
    },
    {
        id: 7,
        name: "Brigadeiro de Limão",
        category: "especial",
        description: "Refrescante brigadeiro de limão",
        price: 3.50,
        image: "assets/brigadeiro-limao.png"
    },
    {
        id: 8,
        name: "Brigadeiro de Amendoim",
        category: "especial",
        description: "Massa cremosa de amendoim",
        price: 3.50,
        image: "assets/brigadeiro-amendoim.png"
    },
    {
        id: 9,
        name: "Brigadeiro Charge",
        category: "diferente",
        description: "Cremoso brigadeiro tradicional com amendoim",
        price: 3.50,
        image: "assets/brigadeiro-charge.png"
    },
    {
        id: 10,
        name: "Brigadeiro de Oreo",
        category: "diferente",
        description: "Brigadeiro branco com pedaços de Oreo",
        price: 5.50,
        image: "assets/brigadeiro-oreo.png"
    },
    {
        id: 11,
        name: "Brigadeiro Casadinho",
        category: "diferente",
        description: "Cremoso brigadeiro preto e ninho",
        price: 3.50,
        image: "assets/brigadeiro-casadinho.png"
    },
    {
        id: 12,
        name: "Brigadeiro M&M",
        category: "diferente",
        description: "Brigadeiro cremoso com sabor M&M",
        price: 3.50,
        image: "assets/brigadeiro-M&M.png"
    },

    {
        id: 13,
        name: "Caixa de brigadeiro",
        category: "Caixas",
        description: "Brigadeiros personalizados",
        price: 14.00,
        image: "assets/caixa-brigadeiro.png"
    }
  
];
let cart = [];

function renderProducts(productsToRender = products) {
    const productsGrid = document.getElementById('products-grid');
    
    productsGrid.innerHTML = productsToRender.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" class="product-img">
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">R$ ${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                        Adicionar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification('Produto adicionado ao carrinho!');
}

function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (!cartItems || !cartCount || !cartTotal) {
        console.error('Elementos do carrinho não encontrados');
        return;
    }
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        cartTotal.textContent = 'R$ 0,00';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" class="cart-img">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                Remover
            </button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `R$ ${total.toFixed(2)}`;
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    showNotification('Produto removido do carrinho');
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    
    cartSidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function filterProducts(category, element) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    
    if (category === 'todos') {
        renderProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
    }
}


function checkout() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    openCheckout();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

renderProducts();

// ===== CHECKOUT =====

function openCheckout() {
    const modal = document.getElementById('checkout-modal');
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total-value');
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = `R$ ${total.toFixed(2)}`;
    
    loadCustomerData();
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function loadCustomerData() {
    const savedData = localStorage.getItem('customerData');
    
    if (savedData) {
        const customer = JSON.parse(savedData);
        
        document.getElementById('name').value = customer.name || '';
        document.getElementById('email').value = customer.email || '';
        document.getElementById('phone').value = customer.phone || '';
        document.getElementById('cep').value = customer.cep || '';
        document.getElementById('street').value = customer.street || '';
        document.getElementById('number').value = customer.number || '';
        document.getElementById('complement').value = customer.complement || '';
        document.getElementById('neighborhood').value = customer.neighborhood || '';
        document.getElementById('city').value = customer.city || '';
        document.getElementById('state').value = customer.state || '';
    }
}

function saveCustomerData(formData) {
    const customer = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        cep: formData.get('cep'),
        street: formData.get('street'),
        number: formData.get('number'),
        complement: formData.get('complement'),
        neighborhood: formData.get('neighborhood'),
        city: formData.get('city'),
        state: formData.get('state')
    };
    
    localStorage.setItem('customerData', JSON.stringify(customer));
}

async function searchCEP(cep) {
    cep = cep.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        return;
    }
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
            document.getElementById('street').value = data.logradouro;
            document.getElementById('neighborhood').value = data.bairro;
            document.getElementById('city').value = data.localidade;
            document.getElementById('state').value = data.uf;
            
            document.getElementById('number').focus();
        } else {
            showNotification('CEP não encontrado');
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM carregado');
    
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 5) {
                value = value.slice(0, 5) + '-' + value.slice(5, 8);
            }
            
            e.target.value = value;
            
            if (value.replace(/\D/g, '').length === 8) {
                searchCEP(value);
            }
        });
    }

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            } else {
                value = value.replace(/^(\d*)/, '($1');
            }
            
            e.target.value = value;
        });
    }


    document.getElementById('checkout-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Coleta dados do cliente
    const customer = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        cpf: formData.get('cpf'), // NOVO: campo CPF
        address: {
            cep: formData.get('cep'),
            street: formData.get('street'),
            number: formData.get('number'),
            complement: formData.get('complement'),
            neighborhood: formData.get('neighborhood'),
            city: formData.get('city'),
            state: formData.get('state')
        },
        observations: formData.get('observations')
    };
    
    // Calcula total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const metodoPagamento = await escolherMetodoPagamento();
    
    if (metodoPagamento === 'pix') {
        // ========================================
        // PAGAMENTO VIA PIX (MERCADO PAGO)
        // ========================================
        
        showNotification('💳 Processando pagamento...');
        
        // Cria pagamento Pix
        const resultado = await criarPagamentoPix(customer, cart, total);
        
        if (resultado.success) {
            // Salva pedido no histórico (status: aguardando pagamento)
            saveOrder(customer, cart, total, 'pending_payment', resultado.orderId);
            
            // Mostra QR Code do Pix
            mostrarModalPix(resultado.payment);
            
            // Fecha modal de checkout
            closeCheckout();
            
            // Limpa carrinho
            cart = [];
            updateCart();
            
        } else {
            alert('❌ Erro ao processar pagamento: ' + resultado.error);
        }
        
    } else if (metodoPagamento === 'dinheiro') {
        // Salva pedido
        saveOrder(customer, cart, total, 'pending', Date.now());
        
        // Envia WhatsApp
        showOrderConfirmation(customer, total, cart);
        
        // Limpa carrinho
        cart = [];
        updateCart();
        
        // Fecha modal
        closeCheckout();
    }
    })

    
    document.getElementById('cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
        }
        
        e.target.value = value;
    });

});


function escolherMetodoPagamento() {
    return new Promise((resolve) => {
        // Cria modal de escolha
        const modal = document.createElement('div');
        modal.id = 'modal-pagamento';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                max-width: 500px;
                width: 100%;
                padding: 40px;
                text-align: center;
            ">
                <h2 style="margin: 0 0 20px 0; color: #8b4513;">Como deseja pagar?</h2>

                <button onclick="selecionarPagamento('pix')" style="
                    width: 100%;
                    padding: 20px;
                    margin: 10px 0;
                    border: 2px solid #8b4513;
                    background: #8b4513;
                    color: white;
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    💳 Pix (Pagamento Instantâneo)
                </button>

                <button onclick="selecionarPagamento('dinheiro')" style="
                    width: 100%;
                    padding: 20px;
                    margin: 10px 0;
                    border: 2px solid #8b4513;
                    background: white;
                    color: #8b4513;
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    💵 Dinheiro na Entrega
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Função para selecionar
        window.selecionarPagamento = function(metodo) {
            modal.remove();
            delete window.selecionarPagamento;
            resolve(metodo);
        };
    });
}


function saveOrder(customer, items, total, status = 'pending', orderId = null) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    const order = {
        id: orderId || Date.now(),
        date: new Date().toLocaleString('pt-BR'),
        customer: customer,
        items: items,
        total: total,
        status: status, // 'pending', 'pending_payment', 'approved', 'rejected'
        paymentMethod: status === 'pending_payment' ? 'pix' : 'dinheiro'
    };
    
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
}



function showOrderConfirmation(customer, total, items) {
    console.log('✅ Processando pedido...');
    
    const message = montarMensagemWhatsApp(customer, total, items);
    enviarParaWhatsApp(message);
    enviarEmailConfirmacao(customer, total, items);
    showNotification('Pedido enviado! Você será redirecionado para o WhatsApp...');
}

function montarMensagemWhatsApp(customer, total, items) {
    let message = `🍫 *NOVO PEDIDO - Pedaço do Céu*\n\n`;
    message += `👤 *DADOS DO CLIENTE*\n`;
    message += `Nome: ${customer.name}\n`;
    message += `E-mail: ${customer.email}\n`;
    message += `Telefone: ${customer.phone}\n\n`;
    
    message += `📦 *ITENS DO PEDIDO*\n`;
    items.forEach(item => {
        message += `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n💰 *TOTAL: R$ ${total.toFixed(2)}*\n\n`;
    
    message += `📍 *ENDEREÇO PARA ENTREGA*\n`;
    message += `${customer.address.street}, ${customer.address.number}`;
    if (customer.address.complement) {
        message += ` - ${customer.address.complement}`;
    }
    message += `\n${customer.address.neighborhood}\n`;
    message += `${customer.address.city}/${customer.address.state}\n`;
    message += `CEP: ${customer.address.cep}\n\n`;
    
    if (customer.observations) {
        message += `📝 *OBSERVAÇÕES*\n${customer.observations}\n\n`;
    }
    
    message += `✅ *Pedido confirmado!*\n`;
    message += `Aguardando cálculo do frete para o endereço informado.\n`;
    message += `Em breve entraremos em contato! 🚚`;
    
    return message;
}

function enviarParaWhatsApp(message) {
    const mensagemCodificada = encodeURIComponent(message);
    const urlWhatsApp = `https://wa.me/${WHATSAPP_LOJA}?text=${mensagemCodificada}`;
    
    setTimeout(() => {
        window.open(urlWhatsApp, '_blank');
    }, 1000);
}

// ===== ENVIO DE EMAIL - LÓGICA IDÊNTICA AO DIAGNÓSTICO QUE FUNCIONOU =====
function enviarEmailConfirmacao(customer, total, items) {
    console.log('📧 Iniciando envio de email...');
    
    // Verifica se EmailJS está pronto (igual ao diagnóstico)
    if (!window.emailJsReady) {
        console.error('❌ EmailJS não está pronto!');
        showNotification('⚠️ Sistema de email não inicializado');
        return;
    }
    
    if (typeof emailjs === 'undefined') {
        console.error('❌ EmailJS não disponível');
        showNotification('⚠️ Email não pôde ser enviado');
        return;
    }
    
    console.log('✅ EmailJS disponível e pronto');
    
    // Monta lista de produtos em TEXTO (igual ao diagnóstico)
    let order_items = '';
    items.forEach(item => {
        order_items += `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    // Monta lista de produtos em HTML (igual ao diagnóstico)
    let order_items_html = '';
    items.forEach(item => {
        order_items_html += `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.price.toFixed(2)}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                `;
    });
    
    // Endereço completo
    const delivery_address = `${customer.address.street}, ${customer.address.number}${customer.address.complement ? ' - ' + customer.address.complement : ''}, ${customer.address.neighborhood}, ${customer.address.city}/${customer.address.state} - CEP: ${customer.address.cep}`;
    
    // Parâmetros IDÊNTICOS ao diagnóstico que funcionou
    const templateParams = {
        to_email: customer.email,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        order_items: order_items,
        order_items_html: order_items_html,
        order_total: `R$ ${total.toFixed(2)}`,
        delivery_address: delivery_address,
        observations: customer.observations || 'Nenhuma observação',
        order_date: new Date().toLocaleString('pt-BR'),
        order_number: Date.now()
    };
    
    console.log('📦 Parâmetros preparados:', templateParams);
    console.log('🚀 Enviando email...');
    
    // ENVIA - exatamente como no diagnóstico
    emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
    ).then(
        function(response) {
            console.log('✅ Email enviado com sucesso!', response.status, response.text);
            showNotification('✅ Email de confirmação enviado!');
        },
        function(error) {
            console.error('❌ Erro ao enviar email:', error);
            showNotification('⚠️ Erro ao enviar email: ' + (error.text || 'Verifique o console'));
        }
    );
}



// ============================================
// MERCADO PAGO - INTEGRAÇÃO FRONTEND
// Adicione este código ao seu script.js
// ============================================

// CONFIGURAÇÃO
const API_URL = ''; 

// ============================================
// FUNÇÃO: CRIAR PAGAMENTO PIX
// ============================================

async function criarPagamentoPix(customer, items, total) {
    try {
        console.log('💳 Criando pagamento Pix...');
        
        // Gera um ID único para o pedido
        const orderId = `ORD-${Date.now()}`;
        
        // Monta descrição do pedido
        const descricao = items.map(item => 
            `${item.quantity}x ${item.name}`
        ).join(', ');

        // Dados que serão enviados para o backend
        const paymentData = {
            amount: total,
            description: descricao,
            customer: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                cpf: customer.cpf || null, // Adicione campo CPF no formulário se necessário
            },
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            orderId: orderId
        };

        console.log('Enviando dados:', paymentData);

        // Faz requisição para o backend
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

        console.log('✅ Pagamento criado:', result);

        return {
            success: true,
            payment: result.payment,
            orderId: orderId
        };

    } catch (error) {
        console.error('❌ Erro ao criar pagamento:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// FUNÇÃO: VERIFICAR STATUS DO PAGAMENTO
// ============================================

async function verificarStatusPagamento(paymentId) {
    try {
        const response = await fetch(`${API_URL}/api/check-payment/${paymentId}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao verificar pagamento');
        }

        return result.payment;

    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        return null;
    }
}

// ============================================
// FUNÇÃO: MOSTRAR MODAL DE PAGAMENTO PIX
// ============================================

function mostrarModalPix(paymentData) {
    // Remove modal anterior se existir
    const modalExistente = document.getElementById('modal-pix');
    if (modalExistente) {
        modalExistente.remove();
    }

    // Cria o modal
    const modal = document.createElement('div');
    modal.id = 'modal-pix';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 15px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        ">
            <!-- Header -->
            <div style="
                background: linear-gradient(135deg, #8b4513 0%, #5c2e0a 100%);
                color: white;
                padding: 25px;
                border-radius: 15px 15px 0 0;
                text-align: center;
            ">
                <h2 style="margin: 0; font-size: 24px;">💳 Pagamento Pix</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Escaneie o QR Code para pagar</p>
            </div>

            <!-- Body -->
            <div style="padding: 30px; text-align: center;">
                
                <!-- Status -->
                <div id="pix-status" style="
                    padding: 15px;
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    color: #856404;
                ">
                    ⏳ Aguardando pagamento...
                </div>

                <!-- Valor -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Valor a pagar:</div>
                    <div style="font-size: 32px; font-weight: bold; color: #8b4513;">
                        R$ ${paymentData.amount.toFixed(2)}
                    </div>
                </div>

                <!-- QR Code -->
                <div style="margin-bottom: 20px;">
                    <img src="data:image/png;base64,${paymentData.qrCodeBase64}" 
                         alt="QR Code Pix" 
                         style="width: 280px; height: 280px; border: 2px solid #ddd; border-radius: 10px;">
                </div>

                <!-- Código Pix Copia e Cola -->
                <div style="margin-bottom: 20px;">
                    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                        Ou copie o código Pix:
                    </p>
                    <div style="
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #ddd;
                        word-break: break-all;
                        font-family: monospace;
                        font-size: 12px;
                        margin-bottom: 10px;
                    ">
                        ${paymentData.qrCode}
                    </div>
                    <button onclick="copiarCodigoPix('${paymentData.qrCode}')" style="
                        background: #8b4513;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">
                        📋 Copiar Código Pix
                    </button>
                </div>

                <!-- Instruções -->
                <div style="
                    background: #e8f5e9;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #4caf50;
                    text-align: left;
                    font-size: 13px;
                    margin-bottom: 20px;
                ">
                    <strong>📱 Como pagar:</strong>
                    <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                        <li>Abra o app do seu banco</li>
                        <li>Escolha pagar com Pix</li>
                        <li>Escaneie o QR Code ou cole o código</li>
                        <li>Confirme o pagamento</li>
                    </ol>
                </div>

                <!-- Botão Fechar -->
                <button onclick="fecharModalPix()" style="
                    background: #e0e0e0;
                    color: #333;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    width: 100%;
                ">
                    Fechar
                </button>

                <!-- Payment ID (oculto para referência) -->
                <input type="hidden" id="current-payment-id" value="${paymentData.id}">
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Inicia verificação automática do status
    iniciarVerificacaoPagamento(paymentData.id);
}

// ============================================
// FUNÇÃO: COPIAR CÓDIGO PIX
// ============================================

function copiarCodigoPix(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
        alert('✅ Código Pix copiado! Cole no app do seu banco.');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        // Fallback: criar input temporário
        const input = document.createElement('input');
        input.value = codigo;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('✅ Código Pix copiado!');
    });
}

// ============================================
// FUNÇÃO: FECHAR MODAL PIX
// ============================================

function fecharModalPix() {
    const modal = document.getElementById('modal-pix');
    if (modal) {
        modal.remove();
    }
    // Para a verificação automática
    if (window.verificacaoInterval) {
        clearInterval(window.verificacaoInterval);
    }
}

// ============================================
// FUNÇÃO: VERIFICAÇÃO AUTOMÁTICA DO PAGAMENTO
// ============================================

function iniciarVerificacaoPagamento(paymentId) {
    console.log('🔄 Iniciando verificação automática do pagamento...');
    
    // Limpa intervalo anterior se existir
    if (window.verificacaoInterval) {
        clearInterval(window.verificacaoInterval);
    }

    // Verifica a cada 3 segundos
    window.verificacaoInterval = setInterval(async () => {
        const payment = await verificarStatusPagamento(paymentId);
        
        if (payment) {
            console.log('Status atual:', payment.status);
            
            const statusDiv = document.getElementById('pix-status');
            
            if (payment.status === 'approved') {
                // PAGAMENTO APROVADO! 🎉
                if (statusDiv) {
                    statusDiv.style.background = '#d4edda';
                    statusDiv.style.borderColor = '#28a745';
                    statusDiv.style.color = '#155724';
                    statusDiv.innerHTML = '✅ Pagamento aprovado!';
                }
                
                clearInterval(window.verificacaoInterval);
                
                // Aguarda 2 segundos e fecha o modal
                setTimeout(() => {
                    fecharModalPix();
                    mostrarConfirmacaoPagamento();
                }, 2000);
            }
            
            if (payment.status === 'rejected' || payment.status === 'cancelled') {
                // PAGAMENTO REJEITADO/CANCELADO
                if (statusDiv) {
                    statusDiv.style.background = '#f8d7da';
                    statusDiv.style.borderColor = '#dc3545';
                    statusDiv.style.color = '#721c24';
                    statusDiv.innerHTML = '❌ Pagamento não aprovado';
                }
                
                clearInterval(window.verificacaoInterval);
            }
        }
    }, 3000); // Verifica a cada 3 segundos

    // Para a verificação após 10 minutos (timeout)
    setTimeout(() => {
        if (window.verificacaoInterval) {
            clearInterval(window.verificacaoInterval);
            console.log('⏱️ Timeout: Verificação automática encerrada');
        }
    }, 600000); // 10 minutos
}

// ============================================
// FUNÇÃO: MOSTRAR CONFIRMAÇÃO DE PAGAMENTO
// ============================================

function mostrarConfirmacaoPagamento() {
    alert('🎉 Pagamento aprovado com sucesso!\n\nSeu pedido foi confirmado e já está sendo preparado.\n\nEm breve você receberá uma confirmação por email e WhatsApp.');
    
    // Limpa o carrinho
    cart = [];
    updateCart();
    
    // Opcional: Redirecionar para página de confirmação
    // window.location.href = 'pedido-confirmado.html';
}