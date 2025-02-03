const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Importar rotas
const apiRoutes = require('./src/routes/api');

// Usar rotas - Note o /api antes
app.use('/api', apiRoutes);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal - sempre retorna o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Conexão MongoDB
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Conectado'))
    .catch(err => console.log('Erro na conexão MongoDB:', err));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 