const express = require('express');
const router = express.Router();
const Contato = require('../models/Contato');
const verificarToken = require('../middleware/auth');

// Criar novo contato
router.post('/', async (req, res) => {
    try {
        const contato = new Contato(req.body);
        await contato.save();
        res.status(201).json(contato);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Listar todos os contatos (protegido)
router.get('/', verificarToken, async (req, res) => {
    try {
        const contatos = await Contato.find().sort('-createdAt');
        res.json(contatos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Atualizar status (protegido)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const contato = await Contato.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(contato);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Excluir contato (protegido)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        await Contato.findByIdAndDelete(req.params.id);
        res.json({ message: 'Contato excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 