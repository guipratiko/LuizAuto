const express = require('express');
const router = express.Router();
const Financiamento = require('../models/Financiamento');
const verificarToken = require('../middleware/auth');

// Criar nova solicitação de financiamento
router.post('/', async (req, res) => {
    try {
        const financiamento = new Financiamento(req.body);
        await financiamento.save();
        res.status(201).json(financiamento);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Listar todas as solicitações (protegido)
router.get('/', verificarToken, async (req, res) => {
    try {
        const financiamentos = await Financiamento.find()
            .populate('veiculo_id')
            .sort('-createdAt');
        res.json(financiamentos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Atualizar status (protegido)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const financiamento = await Financiamento.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(financiamento);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Excluir solicitação (protegido)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        await Financiamento.findByIdAndDelete(req.params.id);
        res.json({ message: 'Solicitação excluída com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 