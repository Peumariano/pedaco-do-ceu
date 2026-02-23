const WHATSAPP_LOJA = "11991084308";

const EMAILJS_CONFIG = {
    publicKey: "QJEsDhXmiLiWFglo_",
    serviceId: "service_6wpm9za",
    templateId: "template_7o5c8rc"
};

let products = [];
let cart = [];

async function carregarProdutosMongoDB(categoria = 'todos') {
    try {
        console.log('Buscando produtos do MongoDB...');
        
        const url = categoria === 'todos'
            ? '/api/products'
            : `/api/products?category=${categoria}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos');
        }
        
        const data = await response.json();

        if (data.success && data.products) {
            console.log(`${data.products.length} produtos carregados do MongoDB`);
            
            products = data.products.map(p => ({
                id: p._id,
                name: p.name,
                category: p.category,
                description: p.description,
                price: p.price,
                image: p.image
            }));
            
            renderProducts(products);
            return products;
        } else {
            throw new Error('Dados inválidos');
        }

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showNotification('Erro ao carregar produtos. Tente recarregar a página.');
        return [];
    }
}

function renderProducts(productsToRender = products) {
    const productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) {
        console.error('products-grid não encontrado');
        return;
    }
    
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
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                        Adicionar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId || p.id === String(productId));
    
    if (!product) {
        console.error('Produto não encontrado:', productId);
        showNotification('Erro ao adicionar produto');
        return;
    }
    
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
    showNotification('Produto adicionado à sacola!');
}

function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartCount || !cartTotal) {
        console.error('Elementos da sacola não encontrados');
        return;
    }
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
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
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
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

async function filterProducts(category, element) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    
    await carregarProdutosMongoDB(category);
}

function checkout() {
    if (cart.length === 0) {
        alert('Sua sacola está vazia!');
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

// ===== CHECKOUT =====

function openCheckout() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
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

// ===== ESCOLHER MÉTODO DE PAGAMENTO =====
function escolherMetodoPagamento() {
    return new Promise((resolve) => {
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
                <h2 style="margin: 0 0 20px 0; color: #4A2C2A;">Como deseja pagar?</h2>

                <button class="btn-pix" style="
                    width: 100%;
                    padding: 20px;
                    margin: 10px 0;
                    border: 2px solid #4A2C2A;
                    background: #4A2C2A;
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
                    Pix (Pagamento Instantâneo)
                </button>

                <button class="btn-dinheiro" style="
                    width: 100%;
                    padding: 20px;
                    margin: 10px 0;
                    border: 2px solid #4A2C2A;
                    background: white;
                    color: #4A2C2A;
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    Dinheiro ou Cartão na entrega
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.btn-pix').addEventListener('click', () => {
            modal.remove();
            resolve('pix');
        });

        modal.querySelector('.btn-dinheiro').addEventListener('click', () => {
            modal.remove();
            resolve('dinheiro');
        });
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
        status: status,
        paymentMethod: status === 'pending_payment' ? 'pix' : 'dinheiro'
    };
    
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
}

function showOrderConfirmation(customer, total, items) {
    console.log('Processando pedido...');
    
    const orderId = `ORD-${Date.now()}`;
    
    saveOrder(customer, items, total, 'pending', orderId);
    enviarEmailConfirmacao(customer, total, items);
    enviarConfirmacaoWhatsAppCliente(customer, items, total, orderId);
}

function enviarEmailConfirmacao(customer, total, items) {
    console.log('Iniciando envio de email...');
    
    if (!window.emailJsReady) {
        console.error('EmailJS não está pronto!');
        return;
    }
    
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS não disponível');
        return;
    }
    
    let order_items_html = '';
    items.forEach(item => {
        order_items_html += `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">R$ ${item.price.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
    });
    
    const delivery_address = `${customer.address.street}, ${customer.address.number}${customer.address.complement ? ' - ' + customer.address.complement : ''}, ${customer.address.neighborhood}, ${customer.address.city}/${customer.address.state} - CEP: ${customer.address.cep}`;
    
    const templateParams = {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        order_items_html: order_items_html,
        order_total: `R$ ${total.toFixed(2)}`,
        delivery_address: delivery_address,
        observations: customer.observations || 'Nenhuma observação',
        order_date: new Date().toLocaleString('pt-BR'),
        order_number: Date.now()
    };
    
    emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
    ).then(
        function(response) {
            console.log('Email enviado!', response.status);
            showNotification('Email de confirmação enviado!');
        },
        function(error) {
            console.error('Erro:', error);
        }
    );
}

const API_URL = '';

async function criarPagamentoPix(customer, items, total) {
    try {
        console.log('Criando pagamento Pix...');
        
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
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            orderId: orderId
        };

        console.log('Enviando dados:', paymentData);

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

        console.log('Pagamento criado:', result);

        return {
            success: true,
            payment: result.payment,
            orderId: orderId
        };

    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function verificarStatusPagamento(paymentId) {
    try {
        const response = await fetch(`${API_URL}/api/check-payment/${paymentId}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao verificar pagamento');
        }

        return result.payment;

    } catch (error) {
        console.error('Erro ao verificar status:', error);
        return null;
    }
}

function mostrarModalPix(paymentData) {
    const modalExistente = document.getElementById('modal-pix');
    if (modalExistente) {
        modalExistente.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'modal-pix';
    modal.style.cssText = `
        font-family: "Grandstander", cursive;  
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
            <div style="
                background: linear-gradient(135deg, #4A2C2A 0%, #462b2a 100%);
                color: white;
                padding: 25px;
                border-radius: 15px 15px 0 0;
                text-align: center;
            ">
                <h2 style="margin: 0; font-size: 24px;">Pagamento Pix</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Escaneie o QR Code para pagar</p>
            </div>

            <div style="padding: 30px; text-align: center;">
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Valor a pagar:</div>
                    <div style="font-size: 32px; font-weight: bold; color: #4A2C2A;">
                        R$ ${paymentData.amount.toFixed(2)}
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <img src="data:image/png;base64,${paymentData.qrCodeBase64}" 
                         alt="QR Code Pix" 
                         style="width: 280px; height: 280px; border: 2px solid #ddd; border-radius: 10px;">
                </div>

                <div id="pix-status" style="
                    padding: 15px;
                    background: #f1f49625;
                    border: none;
                    border-radius: 18px;
                    margin-bottom: 20px;
                    color: #4A2C2A;
                ">
                    Aguardando pagamento...
                </div>

                <div style="margin-bottom: 20px;">
                    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                        Ou copie o código Pix:
                    </p>
                    <div style="
                        background: #4A2C2A;
                        padding: 15px;
                        border-radius: 18px;
                        border: 1px solid #3d2827;
                        word-break: break-all;
                        font-family: Grandstander, cursive;
                        font-size: 18px;
                        margin-bottom: 10px;
                    ">
                        ${paymentData.qrCode}
                    </div>
                    <button class="btn-copiar-pix" style="
                        background: #4A2C2A;
                        color: white;
                        border: 1px solid #3b2927;
                        padding: 12px 24px;
                        border-radius: 80px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all .4s ease;
                    ">
                        Copiar Código Pix
                    </button>
                </div>

                <div style="
                    background: #e8f5e9;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #4caf50;
                    text-align: left;
                    font-size: 13px;
                    margin-bottom: 20px;
                ">
                    <strong>Como pagar:</strong>
                    <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                        <li>Abra o app do seu banco</li>
                        <li>Escolha pagar com Pix</li>
                        <li>Escaneie o QR Code ou cole o código</li>
                        <li>Confirme o pagamento</li>
                    </ol>
                </div>

                <button class="btn-fechar-pix" style="
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

                <input type="hidden" id="current-payment-id" value="${paymentData.id}">
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.btn-copiar-pix').addEventListener('click', () => {
        copiarCodigoPix(paymentData.qrCode);
    });

    modal.querySelector('.btn-fechar-pix').addEventListener('click', () => {
        fecharModalPix();
    });

    iniciarVerificacaoPagamento(paymentData.id);
}

function copiarCodigoPix(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
        alert('Código Pix copiado! Cole no app do seu banco.');
    }).catch(err => {
        const input = document.createElement('input');
        input.value = codigo;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('Código Pix copiado!');
    });
}

function fecharModalPix() {
    const modal = document.getElementById('modal-pix');
    if (modal) {
        modal.remove();
    }
    if (window.verificacaoInterval) {
        clearInterval(window.verificacaoInterval);
    }
}

function iniciarVerificacaoPagamento(paymentId) {
    console.log('Iniciando verificação automática...');
    
    if (window.verificacaoInterval) {
        clearInterval(window.verificacaoInterval);
    }

    window.verificacaoInterval = setInterval(async () => {
        const payment = await verificarStatusPagamento(paymentId);
        
        if (payment) {
            const statusDiv = document.getElementById('pix-status');
            
            if (payment.status === 'approved') {
                if (statusDiv) {
                    statusDiv.style.background = '#d4edda';
                    statusDiv.style.borderColor = '#28a745';
                    statusDiv.style.color = '#155724';
                    statusDiv.innerHTML = 'Pagamento aprovado!';
                }
                
                clearInterval(window.verificacaoInterval);
                
                setTimeout(() => {
                    fecharModalPix();
                    alert('🎉 Pagamento aprovado! Seu pedido foi confirmado.');
                    cart = [];
                    updateCart();
                }, 2000);
            }
            
            if (payment.status === 'rejected' || payment.status === 'cancelled') {
                if (statusDiv) {
                    statusDiv.style.background = '#f8d7da';
                    statusDiv.style.borderColor = '#dc3545';
                    statusDiv.style.color = '#721c24';
                    statusDiv.innerHTML = 'Pagamento não aprovado';
                }
                
                clearInterval(window.verificacaoInterval);
            }
        }
    }, 3000);

    setTimeout(() => {
        if (window.verificacaoInterval) {
            clearInterval(window.verificacaoInterval);
        }
    }, 600000);
}

// ===== WHATSAPP =====
function enviarConfirmacaoWhatsAppCliente(customer, items, total, orderId) {
    const mensagem = `*CONFIRMAÇÃO DE PEDIDO*

Olá! Gostaria de confirmar meu pedido:

*Dados:*
Nome: ${customer.name}
Email: ${customer.email}
Telefone: ${customer.phone}

*Pedido #${orderId}:*
${items.map(item => `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}

*Total:* R$ ${total.toFixed(2)}

*Endereço de Entrega:*
${customer.address.street}, ${customer.address.number}
${customer.address.neighborhood}
${customer.address.city}/${customer.address.state}
CEP: ${customer.address.cep}

${customer.observations ? `Observações: ${customer.observations}` : ''}

Aguardo confirmação do pedido!`;

    const numeroLoja = WHATSAPP_LOJA;
    const mensagemCodificada = encodeURIComponent(mensagem);
    const urlWhatsApp = `https://wa.me/${numeroLoja}?text=${mensagemCodificada}`;
    
    mostrarModalConfirmacaoWhatsApp(urlWhatsApp, customer.name);
}

function mostrarModalConfirmacaoWhatsApp(urlWhatsApp, nomeCliente) {
    const modal = document.createElement('div');
    modal.id = 'modal-whatsapp-confirmacao';
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
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <h2 style="margin: 0 0 15px 0; color: #25D366;">Pedido Recebido!</h2>
            <p style="color: #666; margin-bottom: 25px;">
                Olá <strong>${nomeCliente}</strong>!<br>
                Seu pedido foi registrado com sucesso.
            </p>

            <div style="
                background: #f0f0f0;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 25px;
                text-align: left;
            ">
                <p style="margin: 0 0 10px 0; font-weight: bold;"> Próximo passo:</p>
                <p style="margin: 0; font-size: 14px; color: #555;">
                    Clique no botão abaixo para confirmar via WhatsApp.
                </p>
            </div>

            <button class="btn-whatsapp" style="
                width: 100%;
                padding: 18px;
                margin-bottom: 10px;
                border: none;
                background: #25D366;
                color: white;
                border-radius: 10px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
            ">
                 Confirmar via WhatsApp
            </button>

            <button class="btn-fechar-whatsapp" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                background: white;
                color: #666;
                border-radius: 10px;
                font-size: 14px;
                cursor: pointer;
            ">
                Fechar
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.btn-whatsapp').addEventListener('click', () => {
        window.open(urlWhatsApp, '_blank');
        modal.remove();
    });

    modal.querySelector('.btn-fechar-whatsapp').addEventListener('click', () => {
        modal.remove();
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    await carregarProdutosMongoDB();
    configurarMascaras();
    configurarFormulario();
});

function configurarMascaras() {
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
    
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
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
    }
}

function configurarFormulario() {
    const form = document.getElementById('checkout-form').addEventListener('submit', async function(e) {
        e.preventDefault();
         if (window.firebaseAuth && window.firebaseAuth.getCurrentUser()) {
        await window.firebaseAuth.preencherFormularioComDadosSalvos();
    }
        
    });
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }
            
            const formData = new FormData(e.target);
            
            const customer = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                cpf: formData.get('cpf'),
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
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const metodoPagamento = await escolherMetodoPagamento();
            
            if (metodoPagamento === 'pix') {
                showNotification('Processando pagamento...');
                const resultado = await criarPagamentoPix(customer, cart, total);
                
                if (resultado.success) {
                    saveOrder(customer, cart, total, 'pending_payment', resultado.orderId);
                    mostrarModalPix(resultado.payment);
                    closeCheckout();
                    cart = [];
                    updateCart();
                } else {
                    alert('Erro: ' + resultado.error);
                }
            } else if (metodoPagamento === 'dinheiro') {
                saveOrder(customer, cart, total, 'pending', Date.now());
                showOrderConfirmation(customer, total, cart);
                cart = [];
                updateCart();
                closeCheckout();
            }
        });
    }
}