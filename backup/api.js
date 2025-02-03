const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

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

// Criar novo veículo
router.post('/vehicles', async (req, res) => {
    const vehicle = new Vehicle(req.body);
    try {
        const newVehicle = await vehicle.save();
        res.status(201).json(newVehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Atualizar veículo
router.put('/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        res.json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Deletar veículo
router.delete('/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        res.json({ message: 'Veículo removido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 