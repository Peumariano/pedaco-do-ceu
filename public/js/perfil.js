// public/js/perfil.js
// Script da página de perfil do usuário

// ================================================
// PROTEÇÃO DA PÁGINA
// ================================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 Página de perfil carregada');

    // Aguarda o Firebase estar pronto
    await aguardarFirebaseAuth();

    // Verifica autenticação
    const autenticado = window.firebaseAuth?.verificarAutenticacao();
    
    if (!autenticado) {
        return; // O middleware já redireciona
    }

    // Carrega dados do usuário
    await carregarDadosUsuario();

    // Configura formulários
    configurarFormularioEndereco();

    // Carrega pedidos
    await carregarPedidosUsuario();

    // Mostra tab da URL (se houver hash)
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dados', 'endereco', 'pedidos'].includes(hash)) {
        showTab(hash);
    }
});

// ================================================
// AGUARDA FIREBASE ESTAR PRONTO
// ================================================
function aguardarFirebaseAuth() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.firebaseAuth && window.firebaseAuth.getCurrentUser) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);

        // Timeout de 5 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 5000);
    });
}

// ================================================
// CARREGA DADOS DO USUÁRIO
// ================================================
async function carregarDadosUsuario() {
    try {
        const userData = await window.firebaseAuth.buscarPerfilUsuario();

        if (userData) {
            // Atualiza sidebar
            document.getElementById('user-avatar').src = userData.avatar || 'assets/avatar-default.png';
            document.getElementById('user-name-sidebar').textContent = userData.name;
            document.getElementById('user-email-sidebar').textContent = userData.email;

            // Atualiza tab de dados
            document.getElementById('user-name').textContent = userData.name;
            document.getElementById('user-email').textContent = userData.email;
            document.getElementById('user-phone').textContent = userData.phone || 'Não cadastrado';
            
            const createdDate = new Date(userData.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            document.getElementById('user-created').textContent = createdDate;

            // Preenche formulário de endereço se já tiver dados
            if (userData.address) {
                preencherFormularioEndereco(userData);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        showNotification('Erro ao carregar seus dados');
    }
}

// ================================================
// PREENCHE FORMULÁRIO DE ENDEREÇO
// ================================================
function preencherFormularioEndereco(userData) {
    const addr = userData.address;
    const phone = userData.phone;

    document.getElementById('phone-endereco').value = phone || '';
    document.getElementById('cep-endereco').value = addr.cep || '';
    document.getElementById('street-endereco').value = addr.street || '';
    document.getElementById('number-endereco').value = addr.number || '';
    document.getElementById('complement-endereco').value = addr.complement || '';
    document.getElementById('neighborhood-endereco').value = addr.neighborhood || '';
    document.getElementById('city-endereco').value = addr.city || '';
    document.getElementById('state-endereco').value = addr.state || '';
}

// ================================================
// CONFIGURA FORMULÁRIO DE ENDEREÇO
// ================================================
function configurarFormularioEndereco() {
    const form = document.getElementById('form-endereco');
    const cepInput = document.getElementById('cep-endereco');
    const phoneInput = document.getElementById('phone-endereco');

    // Máscara de CEP
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.slice(0, 5) + '-' + value.slice(5, 8);
        }
        e.target.value = value;
        
        // Busca CEP automaticamente
        if (value.replace(/\D/g, '').length === 8) {
            buscarCEP(value);
        }
    });

    // Máscara de telefone
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

    // Submit do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(form);

        const addressData = {
            phone: formData.get('phone'),
            cep: formData.get('cep'),
            street: formData.get('street'),
            number: formData.get('number'),
            complement: formData.get('complement'),
            neighborhood: formData.get('neighborhood'),
            city: formData.get('city'),
            state: formData.get('state')
        };

        // Salva no MongoDB
        const sucesso = await window.firebaseAuth.atualizarEndereco(addressData);

        if (sucesso) {
            // Recarrega dados
            await carregarDadosUsuario();
        }
    });
}

// ================================================
// BUSCA CEP NA API
// ================================================
async function buscarCEP(cep) {
    cep = cep.replace(/\D/g, '');

    if (cep.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
            document.getElementById('street-endereco').value = data.logradouro;
            document.getElementById('neighborhood-endereco').value = data.bairro;
            document.getElementById('city-endereco').value = data.localidade;
            document.getElementById('state-endereco').value = data.uf;

            document.getElementById('number-endereco').focus();
        } else {
            showNotification('⚠️ CEP não encontrado');
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
    }
}

// ================================================
// CARREGA PEDIDOS DO USUÁRIO
// ================================================
async function carregarPedidosUsuario() {
    const pedidosList = document.getElementById('pedidos-list');

    try {
        const orders = await window.firebaseAuth.buscarPedidosUsuario();

        pedidosList.innerHTML = '';

        if (!orders || orders.length === 0) {
            pedidosList.innerHTML = `
                <div class="no-pedidos">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    <p>Você ainda não fez nenhum pedido.</p>
                    <a href="index.html" class="btn-save" style="max-width: 300px; margin: 1rem auto;">Ver Produtos</a>
                </div>
            `;
            return;
        }

        orders.forEach(order => {
            const orderCard = criarCardPedido(order);
            pedidosList.appendChild(orderCard);
        });

    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        pedidosList.innerHTML = '<div class="loading">Erro ao carregar pedidos</div>';
    }
}

// ================================================
// CRIA CARD DE PEDIDO
// ================================================
function criarCardPedido(order) {
    const card = document.createElement('div');
    card.className = 'pedido-card';

    // Status em português
    const statusMap = {
        'aguardando_pagamento': { label: 'Aguardando Pagamento', class: 'aguardando' },
        'confirmado': { label: 'Confirmado', class: 'confirmado' },
        'em_preparo': { label: 'Em Preparo', class: 'em_preparo' },
        'saiu_para_entrega': { label: 'Saiu para Entrega', class: 'em_preparo' },
        'entregue': { label: 'Entregue', class: 'entregue' },
        'cancelado': { label: 'Cancelado', class: 'cancelado' }
    };

    const status = statusMap[order.status] || { label: order.status, class: 'aguardando' };

    // Data formatada
    const data = new Date(order.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Items do pedido
    const itemsHTML = order.items.map(item => `
        <div class="pedido-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>R$ ${item.subtotal.toFixed(2)}</span>
        </div>
    `).join('');

    card.innerHTML = `
        <div class="pedido-header">
            <div>
                <div class="pedido-numero">Pedido ${order.orderNumber}</div>
                <div class="pedido-data">${data}</div>
            </div>
            <span class="pedido-status ${status.class}">${status.label}</span>
        </div>

        <div class="pedido-items">
            ${itemsHTML}
        </div>

        <div class="pedido-footer">
            <span class="pedido-total">Total: R$ ${order.total.toFixed(2)}</span>
            <span style="font-size: 0.9rem; color: var(--color-chocolate-medium);">
                ${order.paymentMethod === 'pix' ? '💳 Pix' : '💵 Dinheiro'}
            </span>
        </div>
    `;

    return card;
}

// ================================================
// TROCA DE TABS
// ================================================
function showTab(tabName) {
    // Remove active de todas as tabs
    document.querySelectorAll('.perfil-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.perfil-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Ativa a tab selecionada
    const tab = document.getElementById(`tab-${tabName}`);
    const navItem = document.querySelector(`[onclick="showTab('${tabName}')"]`);

    if (tab) tab.classList.add('active');
    if (navItem) navItem.classList.add('active');

    // Atualiza URL
    window.history.replaceState(null, null, `#${tabName}`);
}

// Torna função global
window.showTab = showTab;

// ================================================
// NOTIFICAÇÕES
// ================================================
function showNotification(message) {
    // Usa a função do script.js se disponível
    if (window.showNotification) {
        window.showNotification(message);
    } else {
        alert(message);
    }
}