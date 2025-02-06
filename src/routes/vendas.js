const express = require('express');
const router = express.Router();
const Venda = require('../models/Venda');
const Atividade = require('../models/Atividade');
const verificarToken = require('../middleware/auth');

// Criar nova solicitação de venda
router.post('/', async (req, res) => {
    try {
        const venda = new Venda(req.body);
        await venda.save();

        // Removido o registro de atividade para novas solicitações
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
router.put('/:id/status', verificarToken, async (req, res) => {
    try {
        // Primeiro, verificar se a venda existe
        const vendaExistente = await Venda.findById(req.params.id);
        if (!vendaExistente) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        // Atualizar o status
        const venda = await Venda.findByIdAndUpdate(
            req.params.id,
            { 
                status: req.body.status,
                dataAtualizacao: new Date() // Adicionar data de atualização
            },
            { new: true }
        );

        // Registrar atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Atualizou status de venda',
            tipo: 'venda',
            detalhes: `Cliente: ${venda.nome} - Novo status: ${req.body.status}`
        });
        await novaAtividade.save();

        res.json({
            success: true,
            message: 'Status atualizado com sucesso',
            venda: venda
        });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ 
            error: 'Erro ao atualizar status',
            details: error.message 
        });
    }
});

// Excluir venda
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const venda = await Venda.findById(req.params.id);
        if (!venda) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        await Venda.findByIdAndDelete(req.params.id);

        // Registrar atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Excluiu solicitação de venda',
            tipo: 'venda',
            detalhes: `Cliente: ${venda.nome} - Veículo: ${venda.marca} ${venda.modelo}`
        });
        await novaAtividade.save();

        res.json({ message: 'Solicitação excluída com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir solicitação' });
    }
});

module.exports = router; 