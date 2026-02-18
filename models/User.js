// models/User.js
// Model do Usuário - salvo no MongoDB

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    // ← Dados do Google (Firebase Auth)
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },

    // ← Dados básicos
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // Foto do Google
    avatar: {
        type: String,
        default: null
    },

    // ← Endereço salvo (não precisa digitar toda vez)
    address: {
        cep: { type: String, default: '' },
        street: { type: String, default: '' },
        number: { type: String, default: '' },
        complement: { type: String, default: '' },
        neighborhood: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' }
    },

    phone: {
        type: String,
        default: ''
    },

    // ← Histórico de pedidos (referência à collection de pedidos)
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],

    // ← Controle de acesso
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },

    // ← Datas automáticas
    createdAt: {
        type: Date,
        default: Date.now
    },

    lastLogin: {
        type: Date,
        default: Date.now
    }

});

// Atualiza o lastLogin sempre que o usuário logar
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

module.exports = mongoose.model('User', userSchema);