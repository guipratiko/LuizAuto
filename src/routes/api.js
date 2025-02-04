const express = require('express');
const router = express.Router();

// Primeiro, importe os modelos
const Vehicle = require('../models/Vehicle');

// Depois, importe as rotas
console.log('Carregando rotas...');
const vehiclesRoutes = require('./vehicles');
const financiamentosRoutes = require('./financiamentos');
const dashboardRoutes = require('./dashboard');
const contatosRoutes = require('./contatos');
console.log('Rotas carregadas com sucesso');

// Use as rotas
router.use('/vehicles', vehiclesRoutes);
router.use('/financiamentos', financiamentosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/contatos', contatosRoutes);

module.exports = router; 