const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mover arquivos estáticos para pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Configurar diretório de views
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Conexão MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luizautomoveis';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Conectado'))
.catch(err => console.log('Erro na conexão MongoDB:', err));

// Rotas básicas
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 