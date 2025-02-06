const mongoose = require('mongoose');

const financiamentoSchema = new mongoose.Schema({
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
    veiculo_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    entrada: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pendente', 'Em análise', 'Aprovado', 'Recusado'],
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

module.exports = mongoose.model('Financiamento', financiamentoSchema); 