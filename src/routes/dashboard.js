const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Financiamento = require('../models/Financiamento');
const verificarToken = require('../middleware/auth');
const Atividade = require('../models/Atividade');
const fs = require('fs');

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

// Rota para gerar sitemap.xml dinamicamente
router.get('/generate-sitemap', verificarToken, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'disponivel' });
        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Páginas estáticas
        const staticPages = [
            { url: '', priority: '1.0' },
            { url: 'estoque', priority: '0.9' },
            { url: 'financiamento', priority: '0.8' },
            { url: 'venda', priority: '0.8' },
            { url: 'contato', priority: '0.7' }
        ];

        staticPages.forEach(page => {
            sitemap += `  <url>\n`;
            sitemap += `    <loc>https://luizautomoveis.com/${page.url}</loc>\n`;
            sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
            sitemap += `    <changefreq>daily</changefreq>\n`;
            sitemap += `    <priority>${page.priority}</priority>\n`;
            sitemap += `  </url>\n`;
        });

        // Páginas de veículos
        vehicles.forEach(vehicle => {
            const slug = `${generateSlug(vehicle.marca)}-${generateSlug(vehicle.modelo)}-${vehicle.ano}`;
            sitemap += `  <url>\n`;
            sitemap += `    <loc>https://luizautomoveis.com/veiculo/${slug}/${vehicle._id}</loc>\n`;
            sitemap += `    <lastmod>${vehicle.dataCadastro.toISOString().split('T')[0]}</lastmod>\n`;
            sitemap += `    <changefreq>daily</changefreq>\n`;
            sitemap += `    <priority>0.8</priority>\n`;
            sitemap += `  </url>\n`;
        });

        sitemap += '</urlset>';

        // Salvar o sitemap.xml
        fs.writeFileSync('public/sitemap.xml', sitemap);
        res.json({ message: 'Sitemap gerado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 