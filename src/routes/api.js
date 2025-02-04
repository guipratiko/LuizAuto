const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// Importação das rotas
console.log('Carregando rotas...');
const vehiclesRoutes = require('./vehicles');
const financiamentosRoutes = require('./financiamentos');
const dashboardRoutes = require('./dashboard');
const contatosRoutes = require('./contatos');
console.log('Rotas carregadas com sucesso');

// Listar todos os veículos
router.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort('-dataCadastro');
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obter um veículo específico
router.get('/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Uso das rotas
router.use('/vehicles', vehiclesRoutes);
router.use('/financiamentos', financiamentosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/contatos', contatosRoutes);

module.exports = router; 