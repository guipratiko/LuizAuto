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
        required: true,
        enum: ['Flex', 'Gasolina', 'Álcool', 'Diesel', 'Elétrico', 'Híbrido']
    },
    transmissao: {
        type: String,
        required: true,
        enum: ['Manual', 'Automático', 'CVT', 'Semi-automático']
    },
    descricao: {
        type: String,
        required: true
    },
    fotos: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['disponivel', 'vendido', 'reservado'],
        default: 'disponivel'
    },
    finalPlaca: {
        type: Number,
        required: true,
        min: 0,
        max: 9
    },
    dataCadastro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Vehicle', vehicleSchema); 