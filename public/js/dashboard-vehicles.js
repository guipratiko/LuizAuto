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

function fillForm(vehicle) {
    const form = document.getElementById('vehicle-form');
    Object.keys(vehicle).forEach(key => {
        const input = form.elements[key];
        if (input) input.value = vehicle[key];
    });

    uploadedPhotos = vehicle.fotos || [];
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
        const detailsModal = document.getElementById('vehicle-details-modal');
        
        // Criar modal se não existir
        if (!detailsModal) {
            const modal = document.createElement('div');
            modal.id = 'vehicle-details-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content details-modal">
                    <div class="modal-header">
                        <h2>Detalhes do Veículo</h2>
                        <button class="close-modal" onclick="closeDetailsModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="vehicle-gallery">
                            <div class="main-photo">
                                <img id="detail-main-photo" src="" alt="Foto principal">
                                <button class="gallery-nav prev" onclick="changePhoto(-1)">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button class="gallery-nav next" onclick="changePhoto(1)">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                            <div class="thumbnails" id="detail-thumbnails"></div>
                        </div>
                        <div class="vehicle-details">
                            <h3 id="detail-title"></h3>
                            <div class="detail-specs"></div>
                            <div class="detail-description"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Preencher dados do veículo
        const modal = document.getElementById('vehicle-details-modal');
        const mainPhoto = document.getElementById('detail-main-photo');
        const thumbnails = document.getElementById('detail-thumbnails');
        const title = document.getElementById('detail-title');
        const specs = document.querySelector('.detail-specs');
        const description = document.querySelector('.detail-description');

        // Configurar galeria de fotos
        if (vehicle.fotos && vehicle.fotos.length > 0) {
            mainPhoto.src = vehicle.fotos[0];
            thumbnails.innerHTML = vehicle.fotos.map((foto, index) => `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainPhoto('${foto}', this)">
                    <img src="${foto}" alt="Foto ${index + 1}">
                </div>
            `).join('');
        }

        // Preencher informações
        title.textContent = `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`;
        specs.innerHTML = `
            <div class="spec-row">
                <div class="spec-item">
                    <i class="fas fa-calendar"></i>
                    <span>Ano: ${vehicle.ano}</span>
                </div>
                <div class="spec-item">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Quilometragem: ${vehicle.quilometragem.toLocaleString('pt-BR')} km</span>
                </div>
                <div class="spec-item">
                    <i class="fas fa-gas-pump"></i>
                    <span>Combustível: ${vehicle.combustivel}</span>
                </div>
                <div class="spec-item">
                    <i class="fas fa-cog"></i>
                    <span>Transmissão: ${vehicle.transmissao}</span>
                </div>
                <div class="spec-item">
                    <i class="fas fa-palette"></i>
                    <span>Cor: ${vehicle.cor}</span>
                </div>
                <div class="spec-item">
                    <i class="fas fa-tag"></i>
                    <span>Preço: R$ ${vehicle.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
        `;
        description.innerHTML = `
            <h4>Descrição</h4>
            <p>${vehicle.descricao}</p>
        `;

        modal.classList.add('active');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar detalhes do veículo');
    }
}

function closeDetailsModal() {
    const modal = document.getElementById('vehicle-details-modal');
    if (modal) modal.classList.remove('active');
}

// Variáveis para controle da galeria
let currentPhotoIndex = 0;
let vehiclePhotos = [];

function changePhoto(direction) {
    const mainPhoto = document.getElementById('detail-main-photo');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (!mainPhoto || thumbnails.length === 0) return;
    
    currentPhotoIndex += direction;
    if (currentPhotoIndex >= thumbnails.length) currentPhotoIndex = 0;
    if (currentPhotoIndex < 0) currentPhotoIndex = thumbnails.length - 1;
    
    const newSrc = thumbnails[currentPhotoIndex].querySelector('img').src;
    mainPhoto.src = newSrc;
    
    // Atualizar thumbnail ativa
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnails[currentPhotoIndex].classList.add('active');
} 