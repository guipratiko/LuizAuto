document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupSidebar();
    setupModal();
    setupForm();
    setupFilters();
    loadVehicles();
    setupLogout();
});

let currentPage = 1;
const itemsPerPage = 12;
let selectedVehicle = null;
let uploadedPhotos = [];

// Mover estas funções para o escopo global
let draggedItem = null;

// Variável global para rastrear fotos
let currentPhotos = [];

function addDragListeners(preview) {
    preview.addEventListener('dragstart', handleDragStart);
    preview.addEventListener('dragend', handleDragEnd);
    preview.addEventListener('dragover', handleDragOver);
    preview.addEventListener('dragleave', handleDragLeave);
    preview.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    draggedItem = this;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const item = e.target.closest('.preview-item');
    if (!item || item === draggedItem) return;

    const container = item.parentElement;
    const children = [...container.children];
    const draggedIndex = children.indexOf(draggedItem);
    const dropIndex = children.indexOf(item);

    // Evitar duplicação durante o reordenamento
    if (draggedIndex === dropIndex) return;

    // Armazenar a posição original antes de remover
    const nextSibling = draggedItem.nextSibling;
    draggedItem.remove();

    // Inserir na nova posição
    if (draggedIndex < dropIndex) {
        item.parentNode.insertBefore(draggedItem, item.nextSibling);
    } else {
        item.parentNode.insertBefore(draggedItem, item);
    }

    // Se a inserção falhou, restaurar à posição original
    if (!draggedItem.parentNode) {
        if (nextSibling) {
            container.insertBefore(draggedItem, nextSibling);
        } else {
            container.appendChild(draggedItem);
        }
    }
}

function handleDragLeave(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('dragging');
    
    // Garantir que o item arrastado está na árvore DOM
    const container = document.querySelector('.upload-preview');
    if (draggedItem && !draggedItem.parentNode) {
        container.appendChild(draggedItem);
    }
    
    removeDuplicates();
    updatePreviewOrder();
    updateFormPhotos();
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Garantir que o item arrastado está na árvore DOM
    const container = document.querySelector('.upload-preview');
    if (draggedItem && !draggedItem.parentNode) {
        container.appendChild(draggedItem);
    }
    
    removeDuplicates();
    updatePreviewOrder();
    updateFormPhotos();
}

// Nova função para remover duplicatas
function removeDuplicates() {
    const container = document.querySelector('.upload-preview');
    const items = Array.from(container.querySelectorAll('.preview-item'));
    const seen = new Set();
    
    items.forEach(item => {
        const url = item.dataset.photoUrl;
        if (url) {
            if (seen.has(url)) {
                item.remove();
            } else {
                seen.add(url);
            }
        }
    });
}

function updatePreviewOrder() {
    const container = document.querySelector('.upload-preview');
    const items = Array.from(container.querySelectorAll('.preview-item'));
    
    items.forEach((item, index) => {
        item.dataset.index = index;
        const orderElement = item.querySelector('.preview-order');
        if (orderElement) {
            orderElement.textContent = index + 1;
        }
    });
    
    // Debug: mostrar fotos atuais
    console.log('Fotos após reordenação:');
    items.forEach(item => {
        console.log(`- Tipo: ${item.dataset.type}, URL: ${item.dataset.photoUrl}`);
    });
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
}

function setupSidebar() {
    const toggleBtn = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

function setupModal() {
    const modal = document.getElementById('vehicle-modal');
    const addBtn = document.getElementById('add-vehicle-btn');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-btn');

    // Verifica se os elementos existem
    if (!modal || !addBtn || !closeBtn || !cancelBtn) {
        console.error('Elementos do modal não encontrados');
        return;
    }

    // Abre o modal
    addBtn.addEventListener('click', () => {
        console.log('Abrindo modal...');
        selectedVehicle = null;
        resetForm();
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = 'Novo Veículo';
        modal.style.display = 'block';
        modal.classList.add('active');
    });

    // Fecha o modal
    const closeModal = () => {
        console.log('Fechando modal...');
        modal.style.display = 'none';
        modal.classList.remove('active');
        resetForm();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Fecha o modal ao clicar fora dele
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function setupForm() {
    const form = document.getElementById('vehicle-form');
    const uploadArea = document.getElementById('upload-area');
    const fotosInput = document.getElementById('fotos');
    const previewArea = document.getElementById('upload-preview');

    if (!form || !uploadArea || !fotosInput || !previewArea) {
        console.error('Elementos do formulário não encontrados');
        return;
    }

    // Modificar o envio do formulário para lidar com a ordem das fotos
    async function handleVehicleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData();
        const vehicleId = form.dataset.vehicleId;
        const token = localStorage.getItem('token');

        try {
            console.log('Iniciando envio do formulário...');
            
            // Adicionar campos básicos
            for (let field of form.elements) {
                if (field.name && field.name !== 'fotos' && field.name !== 'fotosExistentes') {
                    formData.append(field.name, field.value);
                }
            }

            // Coletar fotos existentes na ordem correta
            const existingPhotos = Array.from(document.querySelectorAll('.preview-item[data-type="existing"]'))
                .map(preview => preview.dataset.photoUrl)
                .filter(Boolean);
            
            formData.append('fotosExistentes', JSON.stringify(existingPhotos));

            // Adicionar novas fotos na ordem correta
            const newPreviews = Array.from(document.querySelectorAll('.preview-item[data-type="new"]'));
            for (const preview of newPreviews) {
                const fileData = preview.dataset.fileData;
                const fileName = preview.dataset.fileName;
                const fileType = preview.dataset.fileType;
                
                if (fileData && fileName && fileType) {
                    try {
                        const byteString = atob(fileData.split(',')[1]);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        const blob = new Blob([ab], { type: fileType });
                        const file = new File([blob], fileName, { 
                            type: fileType,
                            lastModified: new Date().getTime()
                        });
                        formData.append('fotos', file);
                    } catch (error) {
                        console.error('Erro ao processar arquivo:', error);
                    }
                }
            }

            // Debug: mostrar dados do formulário
            console.log('Dados sendo enviados:');
            for (let [key, value] of formData.entries()) {
                if (key === 'fotosExistentes') {
                    try {
                        console.log('fotosExistentes:', JSON.parse(value));
                    } catch (e) {
                        console.error('Erro ao fazer parse de fotosExistentes:', value);
                    }
                } else if (key === 'fotos') {
                    console.log('fotos:', value.name);
                } else {
                    console.log(key, ':', value);
                }
            }

            // Enviar requisição
            const url = vehicleId ? `/api/vehicles/${vehicleId}` : '/api/vehicles';
            const method = vehicleId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar veículo');
            }

            const result = await response.json();
            console.log('Resposta do servidor:', result);

            // Fechar modal e recarregar lista
            const modal = document.getElementById('vehicle-modal');
            modal.style.display = 'none';
            modal.classList.remove('active');
            resetForm();
            await loadVehicles();
            
            alert(vehicleId ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!');
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message || 'Erro ao salvar veículo');
        }
    }

    // Event Listeners
    form.addEventListener('submit', handleVehicleFormSubmit);
    fotosInput.addEventListener('change', (e) => handleFiles(e.target.files, previewArea));
    
    // Drag and drop na área de upload
    setupUploadArea(uploadArea, previewArea);

    // Adicionar opções de cores
    const cores = [
        'Branco', 'Preto', 'Prata', 'Cinza', 'Azul metálico', 
        'Verde metálico', 'Vermelho metálico', 'Bege metálico', 
        'Dourado metálico', 'Vermelho', 'Azul', 'Verde', 
        'Amarelo', 'Laranja', 'Champagne', 'Grafite', 'Marrom', 
        'Vinho', 'Azul royal', 'Verde esmeralda', 'Rosa', 
        'Fosco', 'Duotone', 'Perolizado', 'Glitter'
    ].sort();

    const corSelect = document.getElementById('cor');
    if (corSelect) {
        corSelect.innerHTML = `
            <option value="">Selecione a cor</option>
            ${cores.map(cor => `<option value="${cor}">${cor}</option>`).join('')}
        `;
    }
}

function setupInputMasks() {
    const precoInput = document.getElementById('preco');
    const quilometragemInput = document.getElementById('quilometragem');

    precoInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = (Number(value) / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        e.target.value = value.replace('R$ ', '');
    });

    quilometragemInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = parseInt(value).toLocaleString('pt-BR');
    });
}

function populateSelects() {
    // Mesmas listas do arquivo venda.js
    const marcas = [
        'Fiat', 'Chevrolet', 'Volkswagen', 'Ford', 'Toyota', 'Honda', 'Hyundai',
        'Renault', 'Nissan', 'Jeep', 'Peugeot', 'Citroën', 'Mitsubishi', 'Kia',
        'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Land Rover', 'Jaguar', 'Porsche'
    ].sort();

    const combustiveis = [
        'Flex', 'Gasolina', 'Etanol', 'Diesel', 'Elétrico', 'Híbrido'
    ];

    populateSelect('marca', marcas);
    populateSelect('cor', cores);
    populateSelect('combustivel', combustiveis);
    populateSelect('filter-marca', ['Todas as Marcas', ...marcas]);
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = options.map(option => 
        `<option value="${option}">${option}</option>`
    ).join('');
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const filterMarca = document.getElementById('filter-marca');
    const filterStatus = document.getElementById('filter-status');

    [searchInput, filterMarca, filterStatus].forEach(element => {
        element.addEventListener('change', () => {
            currentPage = 1;
            loadVehicles();
        });
    });

    searchInput.addEventListener('keyup', debounce(() => {
        currentPage = 1;
        loadVehicles();
    }, 300));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadVehicles() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/vehicles', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados');

        const vehicles = await response.json();
        if (!Array.isArray(vehicles)) throw new Error('Dados inválidos');
        
        displayVehicles(vehicles);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar veículos');
    }
}

function displayVehicles(vehicles) {
    const container = document.getElementById('vehicles-grid');
    if (!container) return;

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Foto</th>
                    <th>Veículo</th>
                    <th>Ano</th>
                    <th>Preço</th>
                    <th>Quilometragem</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody id="vehicles-table-body">
            ${vehicles.map(vehicle => `
                <tr>
                    <td>
                        <img src="${vehicle.fotos?.[0] || '/images/no-image.svg'}" 
                             alt="${vehicle.marca} ${vehicle.modelo}" 
                             class="vehicle-thumbnail"
                             onerror="this.src='/images/no-image.svg'"
                             onclick="showVehicleDetails('${vehicle._id}')">
                    </td>
                    <td>${vehicle.marca} ${vehicle.modelo}</td>
                    <td>${vehicle.ano}</td>
                    <td>R$ ${vehicle.preco?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td>${vehicle.quilometragem?.toLocaleString('pt-BR')} km</td>
                    <td>
                        <span class="status-badge ${vehicle.status}">${vehicle.status}</span>
                    </td>
                    <td>
                        <button onclick="editVehicle('${vehicle._id}')" class="btn-action">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteVehicle('${vehicle._id}')" class="btn-action delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('')}
            </tbody>
        </table>
    `;
}

// Função para preencher o formulário com os dados do veículo
function fillForm(vehicle) {
    const form = document.getElementById('vehicle-form');
    const previewArea = document.getElementById('upload-preview');
    
    console.log('Preenchendo formulário com dados:', vehicle);
    
    // Remover classe new-vehicle se for edição
    form.classList.remove('new-vehicle');
    form.dataset.vehicleId = vehicle._id;

    // Preencher campos do formulário
    Object.keys(vehicle).forEach(key => {
        const input = form.elements[key];
        if (input && key !== 'fotos') {
            input.value = vehicle[key];
        }
    });

    // Limpar área de preview
    previewArea.innerHTML = '';

    // Garantir que as fotos são válidas e não vazias
    const validPhotos = Array.isArray(vehicle.fotos) ? vehicle.fotos.filter(foto => foto && foto.trim() !== '') : [];
    console.log('Fotos válidas encontradas:', validPhotos);

    // Criar previews para fotos existentes
    if (validPhotos.length > 0) {
        validPhotos.forEach((foto, index) => {
            createPhotoPreview(foto, index, previewArea, true, foto);
        });
        console.log('Previews criados para fotos:', validPhotos);
    } else {
        console.log('Nenhuma foto válida encontrada');
    }

    // Atualizar campo oculto de fotos
    updateFormPhotos();

    // Limpar input de arquivo
    const fotosInput = document.getElementById('fotos');
    if (fotosInput) {
        fotosInput.value = '';
    }

    console.log('Formulário preenchido com sucesso');
}

// Função para editar veículo
async function editVehicle(id) {
    try {
        const response = await fetch(`/api/vehicles/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar veículo');
        }
        
        const vehicle = await response.json();
        console.log('Dados do veículo recebidos:', vehicle);
        
        // Garantir que vehicle.fotos seja um array
        if (!Array.isArray(vehicle.fotos)) {
            vehicle.fotos = vehicle.fotos ? [vehicle.fotos] : [];
        }
        
        // Preencher formulário
        fillForm(vehicle);
        
        // Mostrar modal
        const modal = document.getElementById('vehicle-modal');
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = 'Editar Veículo';
        modal.style.display = 'block';
        modal.classList.add('active');
        
        // Atualizar campo oculto de fotos
        updateFormPhotos();
        
    } catch (error) {
        console.error('Erro ao carregar veículo:', error);
        alert('Erro ao carregar dados do veículo');
    }
}

// Função para lidar com arquivos
function handleFiles(files, previewArea) {
    if (!files || !previewArea) return;
    
    // Verificar número total de fotos (existentes + novas)
    const existingPhotos = document.querySelectorAll('.preview-item[data-type="existing"]').length;
    const newPhotos = document.querySelectorAll('.preview-item[data-type="new"]').length;
    const totalPhotos = existingPhotos + newPhotos + files.length;
    
    if (totalPhotos > 10) {
        alert(`Limite de 10 fotos excedido. Você já tem ${existingPhotos + newPhotos} foto(s) e está tentando adicionar mais ${files.length}.`);
        return;
    }

    // Pegar o índice atual
    const startIndex = previewArea.children.length;

    // Atualizar input de arquivo
    const fotosInput = document.getElementById('fotos');
    if (fotosInput) {
        const newFileList = new DataTransfer();
        // Manter arquivos existentes
        if (fotosInput.files) {
            Array.from(fotosInput.files).forEach(file => {
                // Verificar se o arquivo já não existe
                const existingPreview = document.querySelector(`.preview-item[data-file-name="${file.name}"]`);
                if (!existingPreview) {
                    newFileList.items.add(file);
                }
            });
        }
        // Adicionar novos arquivos
        Array.from(files).forEach(file => {
            // Verificar se o arquivo já não existe em qualquer preview
            const existingPreview = document.querySelector(`.preview-item[data-file-name="${file.name}"]`) ||
                                  document.querySelector(`.preview-item[data-photo-url*="${file.name}"]`);
            if (!existingPreview && file.size <= 5 * 1024 * 1024 && file.type.startsWith('image/')) {
                newFileList.items.add(file);
            }
        });
        fotosInput.files = newFileList.files;
    }

    // Processar cada arquivo
    Array.from(files).forEach((file, index) => {
        // Verificar se o arquivo já existe em qualquer preview
        const existingPreview = document.querySelector(`.preview-item[data-file-name="${file.name}"]`) ||
                              document.querySelector(`.preview-item[data-photo-url*="${file.name}"]`);
        if (existingPreview) {
            console.log('Arquivo já existe:', file.name);
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            alert(`Arquivo ${file.name} excede 5MB`);
            return;
        }

        // Verificar se é uma imagem válida
        if (!file.type.startsWith('image/')) {
            alert(`Arquivo ${file.name} não é uma imagem válida`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const currentIndex = startIndex + index;
            const preview = createPhotoPreview(e.target.result, currentIndex, previewArea, false);
            if (preview) {
                preview.dataset.fileName = file.name;
                preview.dataset.fileType = file.type;
                preview.dataset.fileSize = file.size;
                preview.dataset.fileData = e.target.result;
                updatePreviewOrder();
                updateFormPhotos();
            }
        };
        reader.readAsDataURL(file);
    });
}

// Função para criar preview de foto
function createPhotoPreview(src, index, previewArea, isExisting = false, photoUrl = '') {
    console.log('Criando preview para:', { src, index, isExisting, photoUrl });
    
    // Verificar se já existe um preview com esta URL ou src
    if (photoUrl) {
        const existingPreview = Array.from(previewArea.children)
            .find(child => child.dataset.photoUrl === photoUrl);
        if (existingPreview) {
            console.log('Preview já existe para:', photoUrl);
            return null;
        }
    } else {
        const existingPreview = Array.from(previewArea.children)
            .find(child => child.dataset.src === src);
        if (existingPreview) {
            console.log('Preview já existe para src:', src);
            return null;
        }
    }
    
    // Verificar limite total de fotos
    const totalPhotos = previewArea.children.length;
    if (totalPhotos >= 10) {
        console.log('Limite de 10 fotos atingido');
        return null;
    }
    
    const preview = document.createElement('div');
    preview.className = 'preview-item';
    preview.draggable = true;
    preview.dataset.index = index;
    preview.dataset.photoUrl = isExisting ? photoUrl : '';
    preview.dataset.type = isExisting ? 'existing' : 'new';
    preview.dataset.src = src;
    
    preview.innerHTML = `
        <div class="preview-order">${index + 1}</div>
        <img src="${src}" alt="Preview ${index + 1}" 
             onerror="this.src='/images/no-image.svg'">
        <button type="button" class="remove-btn" title="Remover foto">&times;</button>
    `;

    addDragListeners(preview);
    
    preview.querySelector('.remove-btn').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja remover esta foto?')) {
            console.log('Removendo foto:', preview.dataset.photoUrl || preview.dataset.fileName);
            console.log('Tipo da foto:', preview.dataset.type);
            preview.remove();
            updatePreviewOrder();
            updateFormPhotos();
        }
    });
    
    previewArea.appendChild(preview);
    console.log('Preview criado:', preview.dataset);
    return preview;
}

// Função para atualizar as fotos no formulário
function updateFormPhotos() {
    const form = document.getElementById('vehicle-form');
    
    // Coletar fotos na ordem correta
    const allPreviews = Array.from(document.querySelectorAll('.preview-item'));
    const existingPhotos = allPreviews
        .filter(preview => preview.dataset.type === 'existing')
        .map(preview => preview.dataset.photoUrl)
        .filter(Boolean);

    console.log('Atualizando campo de fotos com:', existingPhotos);

    // Criar ou atualizar campo oculto para fotos existentes
    let fotosExistentesInput = form.querySelector('input[name="fotosExistentes"]');
    if (!fotosExistentesInput) {
        fotosExistentesInput = document.createElement('input');
        fotosExistentesInput.type = 'hidden';
        fotosExistentesInput.name = 'fotosExistentes';
        form.appendChild(fotosExistentesInput);
    }
    fotosExistentesInput.value = JSON.stringify(existingPhotos);
    console.log('Campo fotosExistentes atualizado:', JSON.parse(fotosExistentesInput.value));

    // Atualizar input de arquivo com a ordem correta
    const fotosInput = document.getElementById('fotos');
    if (fotosInput) {
        const newFileList = new DataTransfer();
        const newPreviews = allPreviews.filter(preview => preview.dataset.type === 'new');
        
        // Criar novos arquivos a partir dos dados armazenados
        newPreviews.forEach(preview => {
            const fileData = preview.dataset.fileData;
            const fileName = preview.dataset.fileName;
            const fileType = preview.dataset.fileType;
            const fileSize = preview.dataset.fileSize;
            
            if (fileData && fileName && fileType) {
                try {
                    // Converter base64 para Blob
                    const byteString = atob(fileData.split(',')[1]);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    const blob = new Blob([ab], { type: fileType });
                    
                    // Criar arquivo
                    const file = new File([blob], fileName, { 
                        type: fileType,
                        lastModified: new Date().getTime()
                    });
                    
                    // Verificar se o arquivo já existe
                    const exists = Array.from(newFileList.files)
                        .some(f => f.name === fileName);
                    
                    if (!exists) {
                        newFileList.items.add(file);
                    }
                } catch (error) {
                    console.error('Erro ao processar arquivo:', error);
                }
            }
        });
        
        fotosInput.files = newFileList.files;
    }
}

// Função para obter todas as fotos
function getAllPhotos() {
    const previews = document.querySelectorAll('.preview-item');
    const photos = Array.from(previews).map(preview => ({
        url: preview.dataset.photoUrl,
        type: preview.dataset.type
    }));
    return photos;
}

// Função para obter fotos existentes
function getExistingPhotos() {
    const previews = document.querySelectorAll('.preview-item[data-existing-photo="true"]');
    const existingPhotos = [];

    previews.forEach(preview => {
        if (preview.isConnected && preview.dataset.photoUrl) {
            existingPhotos.push(preview.dataset.photoUrl);
        }
    });

    console.log('Fotos existentes coletadas:', existingPhotos);
    return existingPhotos;
}

// Função para configurar área de upload
function setupUploadArea(uploadArea, previewArea) {
    if (!uploadArea || !previewArea) return;

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files, previewArea);
    });
}

// Função para remover imagem
function removeImage(index) {
    const vehicle = currentVehicle; // Variável global para armazenar o veículo atual
    if (vehicle && vehicle.fotos) {
        vehicle.fotos.splice(index, 1);
        fillForm(vehicle); // Atualizar preview
    }
}

function openEditVehicleModal(vehicle) {
    const form = document.getElementById('vehicle-form');
    form.dataset.vehicleId = vehicle._id;
    
    // Preenche os campos do formulário
    document.getElementById('marca').value = vehicle.marca;
    document.getElementById('modelo').value = vehicle.modelo;
    document.getElementById('ano').value = vehicle.ano;
    // ... preencher outros campos ...

    document.getElementById('modal-title').textContent = 'Editar Veículo';
    openVehicleModal();
}

function openNewVehicleModal() {
    const form = document.getElementById('vehicle-form');
    form.dataset.vehicleId = '';
    form.reset();
    document.getElementById('modal-title').textContent = 'Novo Veículo';
    openVehicleModal();
}

async function deleteVehicle(id) {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/vehicles/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir veículo');

        loadVehicles();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir veículo');
    }
}

// Função para resetar o formulário
function resetForm() {
    const form = document.getElementById('vehicle-form');
    const previewArea = document.getElementById('upload-preview');
    
    // Adicionar classe new-vehicle para novo cadastro
    form.classList.add('new-vehicle');
    
    // Resetar array global de fotos
    currentPhotos = [];
    
    if (form) {
        form.reset();
        form.dataset.vehicleId = '';
        
        // Limpar campo oculto de fotos
        let fotosExistentesInput = form.querySelector('input[name="fotosExistentes"]');
        if (fotosExistentesInput) {
            fotosExistentesInput.value = '[]';
        }
    }
    if (previewArea) previewArea.innerHTML = '';
    selectedVehicle = null;
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });
}

// Função para mostrar detalhes do veículo em um modal
async function showVehicleDetails(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/vehicles/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar veículo');

        const vehicle = await response.json();
        const modal = document.getElementById('vehicle-details-modal');
        
        if (!modal) {
            console.error('Modal não encontrado');
            return;
        }

        // Atualizar conteúdo do modal
        document.getElementById('vehicle-title').textContent = `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`;
        document.getElementById('vehicle-price').textContent = `R$ ${vehicle.preco.toLocaleString('pt-BR')}`;
        document.getElementById('vehicle-description').textContent = vehicle.descricao || 'Sem descrição disponível';

        // Atualizar especificações
        const specList = document.getElementById('spec-list');
        specList.innerHTML = `
            <div class="spec-item">
                <i class="fas fa-calendar"></i>
                <span>Ano: ${vehicle.ano}</span>
            </div>
            <div class="spec-item">
                <i class="fas fa-tachometer-alt"></i>
                <span>${vehicle.quilometragem.toLocaleString('pt-BR')} km</span>
            </div>
            <div class="spec-item">
                <i class="fas fa-gas-pump"></i>
                <span>${vehicle.combustivel}</span>
            </div>
            <div class="spec-item">
                <i class="fas fa-cog"></i>
                <span>${vehicle.transmissao}</span>
            </div>
            <div class="spec-item">
                <i class="fas fa-palette"></i>
                <span>${vehicle.cor}</span>
            </div>
        `;

        // Atualizar botões de ação
        document.getElementById('btn-financiamento').onclick = () => 
            window.location.href = `/financiamento?id=${vehicle._id}`;

        // Atualizar galeria de fotos
        updateGallery(vehicle.fotos);
        
        // Mostrar modal
        modal.classList.add('active');

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar detalhes do veículo');
    }
}

function closeDetailsModal() {
    const modal = document.getElementById('vehicle-details-modal');
    if (modal) {
        modal.classList.remove('active');
        // Limpar variáveis globais
        currentPhotoIndex = 0;
        vehiclePhotos = [];
    }
}

// Variáveis para controle da galeria
let currentPhotoIndex = 0;
let vehiclePhotos = [];

function changePhoto(direction) {
    if (!vehiclePhotos || vehiclePhotos.length === 0) return;
    
    currentPhotoIndex += direction;
    if (currentPhotoIndex >= vehiclePhotos.length) currentPhotoIndex = 0;
    if (currentPhotoIndex < 0) currentPhotoIndex = vehiclePhotos.length - 1;
    
    const mainPhoto = document.getElementById('detail-main-photo');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (!mainPhoto || thumbnails.length === 0) return;
    
    mainPhoto.src = vehiclePhotos[currentPhotoIndex];
    
    // Atualizar thumbnail ativa
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnails[currentPhotoIndex].classList.add('active');
}

// Adicione esta função após a função showVehicleDetails
function updateGallery(fotos) {
    const mainPhoto = document.getElementById('detail-main-photo');
    const thumbnails = document.getElementById('detail-thumbnails');
    
    if (!mainPhoto || !thumbnails || !fotos || fotos.length === 0) return;

    // Atualizar foto principal
    mainPhoto.src = fotos[0];
    
    // Atualizar thumbnails
    thumbnails.innerHTML = fotos.map((foto, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainPhoto('${foto}', this)">
            <img src="${foto}" alt="Foto ${index + 1}">
        </div>
    `).join('');

    // Atualizar variáveis globais para controle da galeria
    currentPhotoIndex = 0;
    vehiclePhotos = fotos;
}

// Adicione esta função para mudar a foto principal ao clicar na thumbnail
function changeMainPhoto(src, thumbElement) {
    const mainPhoto = document.getElementById('detail-main-photo');
    if (!mainPhoto) return;

    mainPhoto.src = src;
    
    // Atualizar thumbnail ativa
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbElement.classList.add('active');
    
    // Atualizar índice atual
    currentPhotoIndex = Array.from(thumbnails).indexOf(thumbElement);
}

// Função para obter fotos removidas
function getRemovedPhotos() {
    const stored = localStorage.getItem('removedPhotos');
    return stored ? JSON.parse(stored) : [];
} 