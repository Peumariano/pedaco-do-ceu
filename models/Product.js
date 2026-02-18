// models/Product.js
// Model dos Brigadeiros - salvo no MongoDB

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Nome do produto é obrigatório'],
        trim: true
    },

    // tradicional | especial | diferente | Caixas
    category: {
        type: String,
        required: true,
        enum: ['tradicional', 'especial', 'diferente', 'Caixas'],
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    price: {
        type: Number,
        required: [true, 'Preço é obrigatório'],
        min: [0, 'Preço não pode ser negativo']
    },

    // Caminho da imagem (ex: "assets/brigadeiro-tradicional.png")
    image: {
        type: String,
        required: true
    },

    // Controla se aparece no site
    active: {
        type: Boolean,
        default: true
    },

    // Estoque (opcional - para controle futuro)
    stock: {
        type: Number,
        default: 999
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Product', productSchema);