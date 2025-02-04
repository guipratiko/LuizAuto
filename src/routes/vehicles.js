const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const verificarToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/images/vehicles';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        files: 10, // Máximo de 10 arquivos
        fileSize: 20 * 1024 * 1024 // 20MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Apenas imagens são permitidas!'));
    }
});

// Listar todos os veículos
router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }
        const vehicles = await Vehicle.find(query).sort('-dataCadastro');
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

// Criar novo veículo
router.post('/', verificarToken, upload.array('fotos', 10), async (req, res) => {
    try {
        const vehicleData = req.body;
        vehicleData.fotos = req.files.map(file => `/images/vehicles/${file.filename}`);
        
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        res.status(201).json(vehicle);
    } catch (error) {
        // Remove as imagens se houver erro no cadastro
        if (req.files) {
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
        }
        res.status(400).json({ message: error.message });
    }
});

// Atualizar veículo
router.put('/:id', verificarToken, upload.array('fotos', 10), async (req, res) => {
    try {
        const vehicleData = req.body;
        const oldVehicle = await Vehicle.findById(req.params.id);

        if (req.files && req.files.length > 0) {
            // Remove imagens antigas
            oldVehicle.fotos.forEach(foto => {
                const filePath = path.join(__dirname, '../../public', foto);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            vehicleData.fotos = req.files.map(file => `/images/vehicles/${file.filename}`);
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

// Excluir veículo
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }

        // Remove as imagens do veículo
        vehicle.fotos.forEach(foto => {
            const filePath = path.join(__dirname, '../../public', foto);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        await Vehicle.findByIdAndDelete(req.params.id);
        res.json({ message: 'Veículo excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 