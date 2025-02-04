const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Financiamento = require('../models/Financiamento');
const verificarToken = require('../middleware/auth');

// Rota para estatísticas do dashboard
router.get('/stats', verificarToken, async (req, res) => {
    try {
        const totalVeiculos = await Vehicle.countDocuments();
        const veiculosDisponiveis = await Vehicle.countDocuments({ status: 'disponivel' });
        const veiculosVendidos = await Vehicle.countDocuments({ status: 'vendido' });
        const totalFinanciamentos = await Financiamento.countDocuments();
        
        res.json({
            totalVeiculos,
            veiculosDisponiveis,
            veiculosVendidos,
            totalFinanciamentos
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 