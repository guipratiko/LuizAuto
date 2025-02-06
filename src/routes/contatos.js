const express = require('express');
const router = express.Router();
const Contato = require('../models/Contato');
const Atividade = require('../models/Atividade');
const verificarToken = require('../middleware/auth');

// Ao receber nova mensagem de contato
router.post('/', async (req, res) => {
    try {
        const contato = new Contato(req.body);
        await contato.save();

        // Registrar atividade
        const novaAtividade = new Atividade({
            username: 'Sistema',
            acao: 'Nova mensagem de contato',
            tipo: 'contato',
            detalhes: `De: ${contato.nome} - Assunto: ${contato.assunto || 'Não especificado'}`
        });
        await novaAtividade.save();

        res.status(201).json({ message: 'Mensagem enviada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// Ao atualizar status da mensagem
router.put('/:id/status', verificarToken, async (req, res) => {
    try {
        const contato = await Contato.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        // Registrar atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Atualizou status de mensagem',
            tipo: 'contato',
            detalhes: `De: ${contato.nome} - Novo status: ${req.body.status}`
        });
        await novaAtividade.save();

        res.json(contato);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// Ao excluir uma mensagem
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const contato = await Contato.findById(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }

        await Contato.findByIdAndDelete(req.params.id);

        // Registrar atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Excluiu mensagem',
            tipo: 'contato',
            detalhes: `De: ${contato.nome} - Assunto: ${contato.assunto || 'Não especificado'}`
        });
        await novaAtividade.save();

        res.json({ message: 'Mensagem excluída com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir mensagem' });
    }
});

module.exports = router; 