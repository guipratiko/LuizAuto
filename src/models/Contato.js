const mongoose = require('mongoose');

const contatoSchema = new mongoose.Schema({
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
    assunto: {
        type: String
    },
    mensagem: {
        type: String,
        required: true
    },
    dataEnvio: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Não lido', 'Lido', 'Respondido'],
        default: 'Não lido'
    }
});

// Verifica se o modelo já existe antes de criar
module.exports = mongoose.models.Contato || mongoose.model('Contato', contatoSchema); 