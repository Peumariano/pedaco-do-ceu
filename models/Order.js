// models/Order.js
// Model de Pedidos - com integração Mercado Pago

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    // Referência ao usuário que fez o pedido
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Número do pedido (único e legível)
    orderNumber: {
        type: String,
        unique: true,
        default: function() {
            return `ORD-${Date.now()}`;
        }
    },

    // Items do pedido
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],

    // Valor total do pedido
    total: {
        type: Number,
        required: true,
        min: 0
    },

    // Endereço de entrega
    deliveryAddress: {
        cep: String,
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String
    },

    // Método de pagamento
    paymentMethod: {
        type: String,
        enum: ['pix', 'dinheiro', 'cartao'],
        required: true
    },

    // Status do pagamento
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

    // Status do pedido
    status: {
        type: String,
        enum: [
            'aguardando_pagamento',
            'confirmado',
            'em_preparo',
            'saiu_para_entrega',
            'entregue',
            'cancelado'
        ],
        default: 'aguardando_pagamento'
    },

    // Observações do cliente
    observations: {
        type: String,
        default: ''
    },

    // Datas
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }

});

// Índices para performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ mercadoPagoId: 1 });

// Atualiza updatedAt automaticamente
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método para atualizar status
orderSchema.methods.updateStatus = async function(newStatus) {
    this.status = newStatus;
    return await this.save();
};

// Método para aprovar pagamento
orderSchema.methods.approvePayment = async function() {
    this.paymentStatus = 'approved';
    this.status = 'confirmado';
    return await this.save();
};

// Método estático para buscar pedidos de um usuário
orderSchema.statics.findByUser = function(userId) {
    return this.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('items.product');
};

// Virtual para quantidade total de items
orderSchema.virtual('totalItems').get(function() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Configura JSON para incluir virtuals
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);