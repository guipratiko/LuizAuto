const express = require('express');
const router = express.Router();
const Venda = require('../models/Venda');
const verificarToken = require('../middleware/auth');

// Criar nova solicitação de venda
router.post('/', async (req, res) => {
    try {
        const venda = new Venda(req.body);
        await venda.save();
        res.status(201).json({ message: 'Solicitação enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar venda:', error);
        res.status(500).json({ message: 'Erro ao processar solicitação' });
    }
});

// Listar todas as solicitações (protegido)
router.get('/', verificarToken, async (req, res) => {
    try {
        const vendas = await Venda.find().sort('-dataEnvio');
        res.json(vendas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Atualizar status da venda
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const venda = await Venda.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(venda);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Excluir venda
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        await Venda.findByIdAndDelete(req.params.id);
        res.json({ message: 'Solicitação excluída com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 