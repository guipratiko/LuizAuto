const express = require('express');
const router = express.Router();
console.log('Carregando módulo vehicles.js...');

const multer = require('multer');
console.log('Multer carregado');

const path = require('path');
const fs = require('fs');
const Vehicle = require('../models/Vehicle');
console.log('Model Vehicle carregado');

const verificarToken = require('../middleware/auth');
console.log('Middleware auth carregado');

// Configuração do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = process.env.UPLOAD_DIR || 'public/uploads/vehicles';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
        files: 10 // Limite explícito de 10 arquivos
    }
});

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
        
        // Combinar fotos existentes com novas fotos
        const fotosExistentes = JSON.parse(vehicleData.fotosExistentes || '[]');
        if (req.files && req.files.length > 0) {
            const novasFotos = req.files.map(file => `/uploads/vehicles/${file.filename}`);
            vehicleData.fotos = [...fotosExistentes, ...novasFotos];
        } else {
            vehicleData.fotos = fotosExistentes;
        }
        
        // Remover campo auxiliar
        delete vehicleData.fotosExistentes;
        
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            vehicleData,
            { new: true }
        );
        
        res.json(vehicle);
    } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
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

// Adicione esta rota temporária para teste
router.get('/test-upload', (req, res) => {
    res.json({
        multerLimits: upload.limits,
        nginxLimit: '200MB',
        uploadDir: process.env.UPLOAD_DIR
    });
});

module.exports = router; 