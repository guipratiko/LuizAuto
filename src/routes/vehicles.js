const express = require('express');
const router = express.Router();
console.log('Carregando módulo vehicles.js...');

const multer = require('multer');
console.log('Multer carregado');

const path = require('path');
const fs = require('fs').promises;
const Vehicle = require('../models/Vehicle');
const Atividade = require('../models/Atividade');
console.log('Model Vehicle carregado');

const verificarToken = require('../middleware/auth');
console.log('Middleware auth carregado');

// Adicionar esta função de inicialização
async function ensureDirectories() {
    const dirs = [
        path.join(__dirname, '../../public/images'),
        path.join(__dirname, '../../public/uploads/vehicles')
    ];

    for (const dir of dirs) {
        try {
            await fs.access(dir);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`Criando diretório: ${dir}`);
                await fs.mkdir(dir, { recursive: true });
            }
        }
    }
}

// Chamar a função no início do arquivo
ensureDirectories().catch(console.error);

// Configuração do Multer
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const uploadDir = path.join(__dirname, '../../public/uploads/vehicles');
            console.log('Upload directory:', uploadDir);
            try {
                await fs.access(uploadDir);
            } catch (error) {
                await fs.mkdir(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        } catch (error) {
            console.error('Erro no upload:', error);
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${uniqueSuffix}${ext}`;
        console.log('Saving file:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não suportado. Use apenas JPG, PNG ou WEBP.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

const uploadOptional = upload.array('fotos', 10); // Máximo de 10 fotos

// Middleware para tratar erros do Multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Número máximo de arquivos excedido' });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};

// Listar todos os veículos
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort('-dataCadastro');
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obter um veículo específico
router.get('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Criar novo veículo (protegido)
router.post('/', verificarToken, uploadOptional, async (req, res) => {
    try {
        const vehicleData = req.body;
        if (req.files) {
            vehicleData.fotos = req.files.map(file => `/uploads/vehicles/${file.filename}`);
        }
        
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();

        // Registrar a atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Adicionou um novo veículo',
            tipo: 'veiculo',
            detalhes: `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`
        });
        await novaAtividade.save();

        res.status(201).json(vehicle);
    } catch (error) {
        console.error('Erro ao adicionar veículo:', error);
        res.status(500).json({ error: 'Erro ao adicionar veículo' });
    }
});

// Atualizar veículo (protegido)
router.put('/:id', verificarToken, (req, res, next) => {
    uploadOptional(req, res, (err) => {
        if (err) {
            console.error('Erro no upload:', err);
            return handleMulterError(err, req, res, next);
        }
        next();
    });
}, async (req, res) => {
    try {
        const vehicleData = { ...req.body };
        console.log('Iniciando atualização do veículo:', req.params.id);
        console.log('Arquivos recebidos:', req.files);
        
        // Buscar veículo atual
        const currentVehicle = await Vehicle.findById(req.params.id);
        if (!currentVehicle) {
            console.log('Veículo não encontrado:', req.params.id);
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        // Processar fotos existentes
        let fotosExistentes = [];
        try {
            if (vehicleData.fotosExistentes) {
                fotosExistentes = JSON.parse(vehicleData.fotosExistentes);
                console.log('Fotos existentes recebidas:', fotosExistentes);
                if (!Array.isArray(fotosExistentes)) {
                    console.log('fotosExistentes não é um array, inicializando vazio');
                    fotosExistentes = [];
                }
            }
        } catch (err) {
            console.error('Erro ao processar fotos existentes:', err);
            return res.status(400).json({ error: 'Erro ao processar fotos existentes' });
        }

        // Identificar fotos que foram removidas
        const fotosAtuais = currentVehicle.fotos || [];
        const fotosParaRemover = fotosAtuais.filter(foto => !fotosExistentes.includes(foto));
        
        console.log('Fotos atuais:', fotosAtuais);
        console.log('Fotos mantidas:', fotosExistentes);
        console.log('Fotos para remover:', fotosParaRemover);

        // Remover arquivos físicos das fotos excluídas
        for (const foto of fotosParaRemover) {
            try {
                if (!foto) continue;
                
                const fotoPath = path.join(__dirname, '../../public', foto.replace(/^\//, ''));
                console.log('Tentando remover arquivo:', fotoPath);
                
                try {
                    await fs.access(fotoPath);
                    await fs.unlink(fotoPath);
                    console.log('Arquivo removido com sucesso:', fotoPath);
                } catch (err) {
                    if (err.code === 'ENOENT') {
                        console.log('Arquivo não encontrado:', fotoPath);
                    } else {
                        console.error('Erro ao excluir arquivo:', err);
                    }
                }
            } catch (err) {
                console.error('Erro ao processar remoção do arquivo:', err);
            }
        }

        // Processar novas fotos
        let novasFotos = [];
        if (req.files && req.files.length > 0) {
            console.log('Processando novas fotos:', req.files.length);
            novasFotos = req.files.map(file => `/uploads/vehicles/${file.filename}`);
            console.log('Novas fotos processadas:', novasFotos);
        }

        // Atualizar array de fotos no veículo
        const todasFotos = [...fotosExistentes, ...novasFotos];
        console.log('Array final de fotos:', todasFotos);

        // Criar objeto de atualização
        const updateData = {
            ...vehicleData,
            fotos: todasFotos
        };
        delete updateData.fotosExistentes;

        console.log('Dados de atualização:', updateData);

        // Atualizar veículo no banco
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            updateData,
            { 
                new: true,
                runValidators: true
            }
        ).lean();

        if (!vehicle) {
            console.log('Veículo não encontrado após atualização');
            return res.status(404).json({ error: 'Veículo não encontrado após atualização' });
        }

        // Verificar se as fotos foram salvas corretamente
        console.log('Veículo após atualização:', JSON.stringify(vehicle, null, 2));
        console.log('Fotos salvas:', vehicle.fotos);

        // Registrar a atividade
        const novaAtividade = new Atividade({
            username: req.user.username,
            acao: 'Atualizou um veículo',
            tipo: 'veiculo',
            detalhes: `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`
        });
        await novaAtividade.save();

        res.json(vehicle);
    } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
        res.status(500).json({ error: 'Erro ao atualizar veículo' });
    }
});

// Função auxiliar para verificar se arquivo existe
async function fileExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

// Excluir veículo (protegido)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        // Primeiro buscar o veículo para obter as fotos
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }

        // Excluir as fotos do servidor
        if (vehicle.fotos && Array.isArray(vehicle.fotos)) {
            for (const foto of vehicle.fotos) {
                try {
                    const fotoPath = path.join(__dirname, '../../public', foto.replace(/^\//, ''));
                    try {
                        await fs.access(fotoPath);
                        await fs.unlink(fotoPath);
                        console.log('Foto removida:', fotoPath);
                    } catch (err) {
                        if (err.code !== 'ENOENT') {
                            console.error('Erro ao excluir foto:', err);
                        }
                    }
                } catch (err) {
                    console.error('Erro ao processar caminho da foto:', err);
                }
            }
        }

        // Excluir o veículo do banco de dados
        await Vehicle.findByIdAndDelete(req.params.id);
        res.json({ message: 'Veículo excluído com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        res.status(500).json({ error: 'Erro ao excluir veículo' });
    }
});

// Adicione esta rota temporária para teste
router.get('/test-upload', (req, res) => {
    res.json({
        multerLimits: upload.limits,
        nginxLimit: '200MB',
        uploadDir: process.env.UPLOAD_DIR
    });
});

// Rota para limpar fotos duplicadas
router.post('/cleanup-photos', verificarToken, async (req, res) => {
    try {
        // Buscar todos os veículos
        const vehicles = await Vehicle.find();
        let totalFixed = 0;

        for (const vehicle of vehicles) {
            if (vehicle.fotos && Array.isArray(vehicle.fotos)) {
                // Remover duplicatas
                const uniquePhotos = [...new Set(vehicle.fotos)];
                
                // Remover fotos vazias ou inválidas
                const validPhotos = uniquePhotos.filter(foto => 
                    foto && 
                    foto.trim() !== '' && 
                    !foto.includes('undefined') &&
                    !foto.includes('null')
                );

                // Se houve alteração, atualizar o veículo
                if (validPhotos.length !== vehicle.fotos.length) {
                    await Vehicle.findByIdAndUpdate(vehicle._id, {
                        fotos: validPhotos
                    });
                    totalFixed++;
                    console.log(`Veículo ${vehicle._id} atualizado: ${validPhotos.length} fotos válidas`);
                }
            }
        }

        res.json({ 
            message: `Limpeza concluída. ${totalFixed} veículos atualizados.`,
            totalVehicles: vehicles.length,
            vehiclesFixed: totalFixed
        });

    } catch (error) {
        console.error('Erro na limpeza:', error);
        res.status(500).json({ error: 'Erro ao limpar fotos' });
    }
});

// Rota para limpar fotos órfãs
router.post('/cleanup-orphans', verificarToken, async (req, res) => {
    try {
        // Buscar todos os veículos e suas fotos
        const vehicles = await Vehicle.find();
        const fotosUsadas = new Set(vehicles.flatMap(v => v.fotos || []));
        
        // Ler diretório de uploads
        const uploadDir = path.join(__dirname, '../../public/uploads/vehicles');
        const files = await fs.readdir(uploadDir);
        
        let removidos = 0;
        
        // Verificar cada arquivo
        for (const file of files) {
            const fotoPath = `/uploads/vehicles/${file}`;
            if (!fotosUsadas.has(fotoPath)) {
                try {
                    await fs.unlink(path.join(uploadDir, file));
                    console.log('Foto órfã removida:', file);
                    removidos++;
                } catch (err) {
                    console.error('Erro ao remover foto órfã:', err);
                }
            }
        }
        
        res.json({
            message: `Limpeza concluída. ${removidos} fotos órfãs removidas.`,
            totalFiles: files.length,
            fotosUsadas: fotosUsadas.size,
            fotosRemovidas: removidos
        });
        
    } catch (error) {
        console.error('Erro na limpeza de órfãs:', error);
        res.status(500).json({ error: 'Erro ao limpar fotos órfãs' });
    }
});

module.exports = router; 