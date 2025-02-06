const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Financiamento = require('../models/Financiamento');
const verificarToken = require('../middleware/auth');
const Atividade = require('../models/Atividade');

// Rota para estatísticas do dashboard
router.get('/stats', verificarToken, async (req, res) => {
    try {
        const totalVeiculos = await Vehicle.countDocuments();
        const veiculosDisponiveis = await Vehicle.countDocuments({ status: 'disponivel' });
        const veiculosVendidos = await Vehicle.countDocuments({ status: 'vendido' });
        const totalFinanciamentos = await Financiamento.countDocuments();
        
        res.json({
            totalVeiculos,
            veiculosDisponiveis,
            veiculosVendidos,
            totalFinanciamentos
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rota para buscar atividades recentes
router.get('/activities', verificarToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const [atividades, total] = await Promise.all([
            Atividade.find()
                .sort({ dataHora: -1 })
                .skip(skip)
                .limit(limit),
            Atividade.countDocuments()
        ]);

        res.json({
            atividades,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rota para limpar todas as atividades (protegido)
router.delete('/activities', verificarToken, async (req, res) => {
    try {
        await Atividade.deleteMany({});
        res.json({ message: 'Todas as atividades foram excluídas com sucesso' });
    } catch (error) {
        console.error('Erro ao limpar atividades:', error);
        res.status(500).json({ error: 'Erro ao limpar atividades' });
    }
});

module.exports = router; 