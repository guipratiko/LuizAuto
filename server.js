const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configurar MIME types
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.type('application/javascript');
    }
    if (req.path.endsWith('.css')) {
        res.type('text/css');
    }
    if (req.path.endsWith('.svg')) {
        res.type('image/svg+xml');
    }
    next();
});

// Importar rotas
const apiRoutes = require('./src/routes/api');

// Usar rotas
app.use('/api', apiRoutes);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para página de detalhes do veículo
app.get('/veiculo/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'veiculo.html'));
});

// Rota principal
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Conexão MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Conectado'))
    .catch(err => console.log('Erro na conexão MongoDB:', err));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 