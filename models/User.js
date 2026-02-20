// models/User.js
// Model do Usuário - integrado com Firebase Auth

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    // UID do Firebase (identificador único)
    firebaseUid: {
        type: String,
        required: [true, 'Firebase UID é obrigatório'],
        unique: true,
        index: true
    },

    // Dados básicos
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },

    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        lowercase: true,
        trim: true
    },

    // Foto do perfil (URL do Google)
    avatar: {
        type: String,
        default: null
    },

    // Telefone/WhatsApp
    phone: {
        type: String,
        default: ''
    },

    // Endereço de entrega
    address: {
        cep: { type: String, default: '' },
        street: { type: String, default: '' },
        number: { type: String, default: '' },
        complement: { type: String, default: '' },
        neighborhood: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' }
    },

    // Histórico de pedidos (referência)
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],

    // Nível de acesso
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },

    // Datas
    createdAt: {
        type: Date,
        default: Date.now
    },

    lastLogin: {
        type: Date,
        default: Date.now
    }

});

// Índices para performance
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });

// Método virtual para nome curto
userSchema.virtual('firstName').get(function() {
    return this.name.split(' ')[0];
});

// Método para adicionar pedido ao histórico
userSchema.methods.addOrder = async function(orderId) {
    this.orders.push(orderId);
    return await this.save();
};

// Não exporta o firebaseUid no JSON (segurança)
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.firebaseUid;
    return obj;
};

module.exports = mongoose.model('User', userSchema);