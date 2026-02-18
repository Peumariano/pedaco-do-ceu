// models/Order.js
// Model dos Pedidos - salvo no MongoDB

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    // ← Quem fez o pedido
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Número do pedido (legível para o cliente)
    orderNumber: {
        type: String,
        unique: true
    },

    // ← Itens do pedido (snapshot dos produtos no momento da compra)
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,       // Nome salvo no momento da compra
        price: Number,      // Preço no momento da compra
        quantity: Number,
        subtotal: Number
    }],

    // ← Valores
    total: {
        type: Number,
        required: true
    },

    // ← Endereço de entrega (copiado do usuário no momento)
    deliveryAddress: {
        cep: String,
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String
    },

    // ← Pagamento
    paymentMethod: {
        type: String,
        enum: ['pix', 'dinheiro'],
        required: true
    },

    // Status do pagamento (Mercado Pago)
    paymentStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },

    // ID do pagamento no Mercado Pago
    mercadoPagoId: {
        type: String,
        default: null
    },

    // ← Status do pedido
    status: {
        type: String,
        enum: ['aguardando_pagamento', 'confirmado', 'em_preparo', 'saiu_para_entrega', 'entregue', 'cancelado'],
        default: 'aguardando_pagamento'
    },

    observations: {
        type: String,
        default: ''
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }

});

// Gera número do pedido antes de salvar
orderSchema.pre('save', function(next) {
    if (!this.orderNumber) {
        this.orderNumber = `PDC-${Date.now()}`;
    }
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Order', orderSchema);