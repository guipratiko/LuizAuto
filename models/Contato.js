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

module.exports = mongoose.model('Contato', contatoSchema); 