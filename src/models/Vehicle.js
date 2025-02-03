const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    marca: {
        type: String,
        required: true,
        enum: ['Fiat', 'Chevrolet', 'Volkswagen', 'Ford', 'Toyota', 'Honda', 'Hyundai', 'Renault', 'Nissan', 'Jeep']
    },
    modelo: {
        type: String,
        required: true
    },
    cor: {
        type: String,
        required: true,
        enum: ['Branco', 'Preto', 'Prata', 'Cinza', 'Azul metálico', 'Verde metálico', 'Vermelho metálico']
    },
    anoFabricacao: {
        type: Number,
        required: true,
        min: 1960,
        max: new Date().getFullYear() + 1
    },
    finalPlaca: {
        type: Number,
        required: true,
        min: 0,
        max: 9
    },
    quilometragem: {
        type: Number,
        required: true,
        min: 0
    },
    combustivel: {
        type: String,
        required: true,
        enum: ['Elétrico', 'Híbrido', 'Flex', 'Álcool', 'Gasolina', 'Diesel']
    },
    transmissao: {
        type: String,
        required: true,
        enum: ['Manual', 'Automático', 'CVT', 'Semi-automático']
    },
    fotos: [{
        type: String,
        required: true
    }],
    preco: {
        type: Number,
        required: true
    },
    descricao: String,
    destaque: {
        type: Boolean,
        default: false
    },
    dataCadastro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Vehicle', vehicleSchema); 