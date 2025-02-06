const mongoose = require('mongoose');

const vendaSchema = new mongoose.Schema({
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
    marca: {
        type: String,
        required: true
    },
    modelo: {
        type: String,
        required: true
    },
    ano: {
        type: String,
        required: true
    },
    quilometragem: {
        type: Number,
        required: true
    },
    cor: String,
    combustivel: String,
    observacoes: String,
    status: {
        type: String,
        enum: ['Pendente', 'Em análise', 'Aprovada', 'Recusada'],
        default: 'Pendente'
    },
    dataEnvio: {
        type: Date,
        default: Date.now
    },
    dataAtualizacao: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Venda', vendaSchema); 