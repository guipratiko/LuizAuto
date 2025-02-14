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
    descricao: String,
    fotos: [{
        type: String
    }],
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

// Middleware pre-save para garantir que fotos seja sempre um array
vehicleSchema.pre('save', function(next) {
    if (!Array.isArray(this.fotos)) {
        this.fotos = this.fotos ? [this.fotos] : [];
    }
    next();
});

// Middleware pre-findOneAndUpdate para garantir que fotos seja sempre um array
vehicleSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.fotos && !Array.isArray(update.fotos)) {
        update.fotos = [update.fotos];
    }
    next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle; 