const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const Contato = require('./src/models/Contato');

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
    if (req.path.endsWith('.png')) {
        res.type('image/png');
    }
    if (req.path.endsWith('.jpg') || req.path.endsWith('.jpeg')) {
        res.type('image/jpeg');
    }
    next();
});

// Importar rotas
const apiRoutes = require('./src/routes/api');
const vendasRoutes = require('./src/routes/vendas');

// Usar rotas
app.use('/api', apiRoutes);
app.use('/api/vendas', vendasRoutes);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para página de detalhes do veículo
app.get('/veiculo/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'veiculo.html'));
});

// Rotas para as páginas estáticas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/estoque', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'estoque.html'));
});

app.get('/financiamento', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'financiamento.html'));
});

app.get('/venda', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'venda.html'));
});

app.get('/contato', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contato.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rotas do dashboard (protegidas)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

app.get('/dashboard/veiculos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'veiculos.html'));
});

app.get('/dashboard/financiamentos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'financiamentos.html'));
});

app.get('/dashboard/contatos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'contatos.html'));
});

app.get('/dashboard/vendas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'vendas.html'));
});

// Middleware de autenticação para rotas protegidas
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Rotas de contato protegidas por autenticação
// Rota para contar mensagens não lidas (deve vir antes das rotas com parâmetros)
app.get('/api/contatos/nao-lidos', authMiddleware, async (req, res) => {
    try {
        const count = await Contato.countDocuments({ status: 'Não lido' });
        res.json({ count });
    } catch (error) {
        console.error('Erro ao contar mensagens:', error);
        res.status(500).json({ error: 'Erro ao buscar contatos não lidos' });
    }
});

// Rota para listar todos os contatos
app.get('/api/contatos', authMiddleware, async (req, res) => {
    try {
        const contatos = await Contato.find().sort({ dataEnvio: -1 });
        res.json(contatos);
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
});

// Rota para buscar um contato específico
app.get('/api/contatos/:id', authMiddleware, async (req, res) => {
    try {
        const contato = await Contato.findById(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }
        res.json(contato);
    } catch (error) {
        console.error('Erro ao buscar contato:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagem' });
    }
});

app.put('/api/contatos/:id/status', authMiddleware, async (req, res) => {
    try {
        const contato = await Contato.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!contato) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }
        res.json(contato);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

app.delete('/api/contatos/:id', authMiddleware, async (req, res) => {
    try {
        const contato = await Contato.findByIdAndDelete(req.params.id);
        if (!contato) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }
        res.json({ message: 'Mensagem excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir contato:', error);
        res.status(500).json({ error: 'Erro ao excluir mensagem' });
    }
});

// Rota de autenticação
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    // Credenciais fixas para teste
    const credenciaisValidas = {
        email: 'admin@premiummotors.com',
        senha: 'admin123'
    };

    if (email === credenciaisValidas.email && senha === credenciaisValidas.senha) {
        // Gerar token JWT
        const token = jwt.sign(
            { email: credenciaisValidas.email },
            process.env.JWT_SECRET || 'sua_chave_secreta',
            { expiresIn: '24h' }
        );

        res.json({ token });
    } else {
        res.status(401).json({ mensagem: 'Credenciais inválidas' });
    }
});

// Rota para enviar mensagem de contato
app.post('/api/contatos', async (req, res) => {
    try {
        const { nome, email, telefone, assunto, mensagem } = req.body;

        // Validar dados
        if (!nome || !email || !telefone || !mensagem) {
            return res.status(400).json({ 
                error: 'Por favor, preencha todos os campos obrigatórios.' 
            });
        }

        // Criar novo contato no banco de dados
        const novoContato = new Contato({
            nome,
            email,
            telefone,
            assunto,
            mensagem,
            dataEnvio: new Date(),
            status: 'Não lido'
        });

        await novoContato.save();
        res.status(201).json({ message: 'Mensagem enviada com sucesso!' });

    } catch (error) {
        console.error('Erro ao salvar contato:', error);
        res.status(500).json({ 
            error: 'Erro ao processar sua mensagem. Por favor, tente novamente.' 
        });
    }
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