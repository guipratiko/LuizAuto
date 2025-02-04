const mongoose = require('mongoose');

const vendaSchema = new mongoose.Schema({
    marca: {
        type: String,
        required: true
    },
    modelo: {
        type: String,
        required: true
    },
    ano: {
        type: Number,
        required: true
    },
    quilometragem: {
        type: Number,
        required: true
    },
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    telefone: {
        type: String,
        required: true
    },
    observacoes: String,
    dataEnvio: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pendente', 'Em análise', 'Avaliado', 'Finalizado'],
        default: 'Pendente'
    }
});

module.exports = mongoose.model('Venda', vendaSchema); 