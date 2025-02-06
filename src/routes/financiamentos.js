const express = require('express');
const router = express.Router();
const Financiamento = require('../models/Financiamento');
const Atividade = require('../models/Atividade');
const verificarToken = require('../middleware/auth');

// Criar nova solicitação de financiamento
router.post('/', async (req, res) => {
    try {
        const financiamento = new Financiamento(req.body);
        await financiamento.save();

        // Removido o registro de atividade para novas solicitações
        res.status(201).json({ message: 'Solicitação enviada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar solicitação' });
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

// Atualizar status do financiamento
router.put('/:id/status', verificarToken, async (req, res) => {
    try {
        // Primeiro, verificar se o financiamento existe
        const financiamentoExistente = await Financiamento.findById(req.params.id);
        if (!financiamentoExistente) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        // Atualizar o status
        const financiamento = await Financiamento.findByIdAndUpdate(
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
            acao: 'Atualizou status de financiamento',
            tipo: 'financiamento',
            detalhes: `Cliente: ${financiamento.nome} - Novo status: ${req.body.status}`
        });
        await novaAtividade.save();

        res.json({
            success: true,
            message: 'Status atualizado com sucesso',
            financiamento: financiamento
        });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ 
            error: 'Erro ao atualizar status',
            details: error.message 
        });
    }
});

// Excluir solicitação (protegido)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        // Buscar o financiamento antes de excluir para ter os dados para o registro
        const financiamento = await Financiamento.findById(req.params.id);
        if (!financiamento) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        await Financiamento.findByIdAndDelete(req.params.id);

        // Registrar atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Excluiu solicitação de financiamento',
            tipo: 'financiamento',
            detalhes: `Cliente: ${financiamento.nome}`
        });
        await novaAtividade.save();

        res.json({ message: 'Solicitação excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir financiamento:', error);
        res.status(500).json({ error: 'Erro ao excluir solicitação' });
    }
});

module.exports = router; 