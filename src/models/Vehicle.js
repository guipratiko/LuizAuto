const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
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
    preco: {
        type: Number,
        required: true
    },
    cor: {
        type: String,
        required: true
    },
    combustivel: {
        type: String,
        required: true
    },
    transmissao: {
        type: String,
        required: true
    },
    finalPlaca: {
        type: Number,
        required: true
    },
    descricao: {
        type: String,
        required: true
    },
    fotos: [String],
    status: {
        type: String,
        enum: ['disponivel', 'vendido', 'reservado'],
        default: 'disponivel'
    },
    dataCadastro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Vehicle', vehicleSchema); 