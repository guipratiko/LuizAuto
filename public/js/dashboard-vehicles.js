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

    // Drag and drop
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
        handleFiles(files);
    });

    fotosInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        if (!files) return;
        
        if (files.length > 10) {
            alert('Máximo de 10 imagens permitidas');
            return;
        }

        // Limpa preview anterior
        previewArea.innerHTML = '';

        Array.from(files).forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                alert(`Arquivo ${file.name} excede 20MB`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-btn">&times;</button>
                `;
                previewArea.appendChild(preview);

                preview.querySelector('.remove-btn').addEventListener('click', () => {
                    preview.remove();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Enviando formulário...');

        const formData = new FormData(e.target);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Sucesso:', data);
            alert('Veículo cadastrado com sucesso!');
            resetForm();
            if (e.target.closest('.modal')) e.target.closest('.modal').classList.remove('active');
            loadVehicles();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao cadastrar veículo. Por favor, tente novamente.');
        }
    });

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
                        <img src="${vehicle.fotos?.[0] || '/images/no-image.jpg'}" 
                             alt="${vehicle.marca} ${vehicle.modelo}" 
                             class="vehicle-thumbnail"
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

async function editVehicle(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/vehicles/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar veículo');

        selectedVehicle = await response.json();
        fillForm(selectedVehicle);
        document.getElementById('modal-title').textContent = 'Editar Veículo';
        document.getElementById('vehicle-modal').classList.add('active');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados do veículo');
    }
}

async function fillForm(vehicle) {
    const form = document.getElementById('vehicle-form');
    Object.keys(vehicle).forEach(key => {
        const input = form.elements[key];
        if (input) input.value = vehicle[key];
    });

    uploadedPhotos = vehicle.fotos || [];
    
    // Limpar o input de fotos
    document.getElementById('fotos').value = '';
    
    // Mostrar imagens existentes
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    imagePreviewContainer.innerHTML = '';
    
    if (vehicle.fotos && vehicle.fotos.length > 0) {
        const existingImagesDiv = document.createElement('div');
        existingImagesDiv.className = 'existing-images';
        existingImagesDiv.innerHTML = '<h4>Imagens Atuais:</h4>';
        
        vehicle.fotos.forEach((foto, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-container';
            
            const img = document.createElement('img');
            img.src = foto;
            img.className = 'thumbnail';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '❌';
            deleteBtn.className = 'delete-image';
            deleteBtn.onclick = () => removeImage(index);
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(deleteBtn);
            existingImagesDiv.appendChild(imgContainer);
        });
        
        imagePreviewContainer.appendChild(existingImagesDiv);
    }
}

// Função para remover imagem
function removeImage(index) {
    const vehicle = currentVehicle; // Variável global para armazenar o veículo atual
    if (vehicle && vehicle.fotos) {
        vehicle.fotos.splice(index, 1);
        fillForm(vehicle); // Atualizar preview
    }
}

// Atualizar a função de envio do formulário
async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const vehicleId = document.getElementById('vehicleId').value;
    
    // Se estiver editando, adicionar fotos existentes
    if (vehicleId && currentVehicle && currentVehicle.fotos) {
        formData.append('fotosExistentes', JSON.stringify(currentVehicle.fotos));
    }
    
    try {
        const url = vehicleId ? 
            `/api/vehicles/${vehicleId}` : 
            '/api/vehicles';
            
        const response = await fetch(url, {
            method: vehicleId ? 'PUT' : 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        alert(vehicleId ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!');
        closeModal();
        loadVehicles();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar veículo');
    }
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

function resetForm() {
    const form = document.getElementById('vehicle-form');
    const previewArea = document.getElementById('upload-preview');
    
    if (form) form.reset();
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