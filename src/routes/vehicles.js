const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const verificarToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/vehicles')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Listar todos os veículos
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort('-dataCadastro');
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obter um veículo específico
router.get('/:id', async (req, res) => {
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

// Criar novo veículo (protegido)
router.post('/', verificarToken, upload.array('fotos', 10), async (req, res) => {
    try {
        const vehicleData = req.body;
        if (req.files) {
            vehicleData.fotos = req.files.map(file => `/uploads/vehicles/${file.filename}`);
        }
        
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Atualizar veículo (protegido)
router.put('/:id', verificarToken, upload.array('fotos', 10), async (req, res) => {
    try {
        const vehicleData = req.body;
        if (req.files && req.files.length > 0) {
            vehicleData.fotos = req.files.map(file => `/uploads/vehicles/${file.filename}`);
        }
        
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            vehicleData,
            { new: true }
        );
        res.json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Excluir veículo (protegido)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        await Vehicle.findByIdAndDelete(req.params.id);
        res.json({ message: 'Veículo excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 