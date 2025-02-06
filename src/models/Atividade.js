const mongoose = require('mongoose');

const atividadeSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    acao: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        enum: ['veiculo', 'financiamento', 'contato', 'venda'],
        required: true
    },
    detalhes: {
        type: String,
        required: true
    },
    dataHora: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Atividade', atividadeSchema); 