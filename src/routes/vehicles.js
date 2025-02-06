const express = require('express');
const router = express.Router();
console.log('Carregando módulo vehicles.js...');

const multer = require('multer');
console.log('Multer carregado');

const path = require('path');
const fs = require('fs');
const Vehicle = require('../models/Vehicle');
const Atividade = require('../models/Atividade');
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

        // Registrar a atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Adicionou um novo veículo',
            tipo: 'veiculo',
            detalhes: `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`
        });
        await novaAtividade.save();

        res.status(201).json(vehicle);
    } catch (error) {
        console.error('Erro ao adicionar veículo:', error);
        res.status(500).json({ error: 'Erro ao adicionar veículo' });
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
        
        // Registrar a atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Atualizou um veículo',
            tipo: 'veiculo',
            detalhes: `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`
        });
        await novaAtividade.save();

        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar veículo' });
    }
});

// Excluir veículo (protegido)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        await Vehicle.findByIdAndDelete(req.params.id);

        // Registrar a atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Excluiu um veículo',
            tipo: 'veiculo',
            detalhes: `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`
        });
        await novaAtividade.save();

        res.json({ message: 'Veículo excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir veículo' });
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

// Rota para detalhes do veículo com URL amigável
router.get('/:marca/:modelo/:ano/:id', async (req, res) => {
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

module.exports = router; 