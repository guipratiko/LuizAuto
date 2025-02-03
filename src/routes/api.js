const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

router.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort('-dataCadastro');
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Ve�culo n�o encontrado' });
        }
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
