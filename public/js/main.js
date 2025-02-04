document.addEventListener('DOMContentLoaded', () => {
    setupMenuToggle();
    loadFeaturedVehicles();
});

function setupMenuToggle() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Previne comportamento padrão
        navLinks.classList.toggle('active');
    });

    // Adiciona evento para fechar menu ao clicar em um link
    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            navLinks.classList.remove('active');
        }
    });
}

async function loadFeaturedVehicles() {
    try {
        // Busca os 9 veículos mais recentes usando sort por dataCadastro decrescente
        const response = await fetch('/api/vehicles?limit=9&sort=-dataCadastro');
        if (!response.ok) throw new Error('Erro ao carregar veículos');
        
        const data = await response.json();
        
        // Se data for um array, usa ele diretamente, senão pega data.vehicles
        const vehicles = Array.isArray(data) ? data : data.vehicles;
        
        // Se não houver veículos, mostra mensagem apropriada
        if (!vehicles || vehicles.length === 0) {
            const grid = document.getElementById('vehicles-grid');
            if (grid) {
                grid.innerHTML = '<p class="no-vehicles">Nenhum veículo disponível no momento.</p>';
            }
            return;
        }

        // Pega apenas os 9 primeiros veículos (mais recentes)
        const recentVehicles = vehicles.slice(0, 9);
        displayVehicles(recentVehicles);
    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
        const grid = document.getElementById('vehicles-grid');
        if (grid) {
            grid.innerHTML = '<p class="error-message">Erro ao carregar veículos. Por favor, tente novamente mais tarde.</p>';
        }
    }
}

function displayVehicles(vehicles) {
    const grid = document.getElementById('vehicles-grid');
    if (!grid) return;

    grid.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-card" onclick="showVehicleDetails('${vehicle._id}')">
            <img src="${vehicle.fotos?.[0] || '/images/no-image.svg'}" alt="${vehicle.marca} ${vehicle.modelo}" class="vehicle-image">
            <div class="vehicle-info">
                <h3 class="vehicle-title">${vehicle.marca} ${vehicle.modelo}</h3>
                <p class="vehicle-price">R$ ${vehicle.preco?.toLocaleString('pt-BR') || '0'}</p>
                <div class="vehicle-details">
                    <p><i class="fas fa-calendar"></i> ${vehicle.ano}</p>
                    <p><i class="fas fa-tachometer-alt"></i> ${vehicle.quilometragem?.toLocaleString('pt-BR') || '0'} km</p>
                    <p><i class="fas fa-gas-pump"></i> ${vehicle.combustivel}</p>
                    <p><i class="fas fa-cog"></i> ${vehicle.transmissao}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Função para mostrar detalhes do veículo em um modal
async function showVehicleDetails(id) {
    try {
        const response = await fetch(`/api/vehicles/${id}`);
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
                            <div class="contact-buttons">
                                <a href="#" class="btn-whatsapp" id="whatsapp-btn">
                                    <i class="fab fa-whatsapp"></i>
                                    Contato via WhatsApp
                                </a>
                                <button class="btn-contact" onclick="showContactForm()">
                                    <i class="fas fa-envelope"></i>
                                    Solicitar Informações
                                </button>
                            </div>
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
        const whatsappBtn = document.getElementById('whatsapp-btn');

        // Configurar galeria de fotos
        if (vehicle.fotos && vehicle.fotos.length > 0) {
            mainPhoto.src = vehicle.fotos[0];
            thumbnails.innerHTML = vehicle.fotos.map((foto, index) => `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainPhoto('${foto}', this)">
                    <img src="${foto}" alt="Foto ${index + 1}">
                </div>
            `).join('');
        }

        // Configurar link do WhatsApp com novo número e mensagem
        const whatsappMessage = encodeURIComponent(
            `Achei um veículo no site de vocês, gostaria de saber mais\n\n${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`
        );
        whatsappBtn.href = `https://wa.me/556232470376?text=${whatsappMessage}`;

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
                <div class="spec-item price-item">
                    <i class="fas fa-tag"></i>
                    <span>R$ ${vehicle.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
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
    if (modal) {
        modal.classList.remove('active');
        // Remover o modal do DOM após a animação
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Adicionar evento para fechar o modal ao clicar fora dele
document.addEventListener('click', (e) => {
    const modal = document.getElementById('vehicle-details-modal');
    if (modal && e.target === modal) {
        closeDetailsModal();
    }
});

// Prevenir que o clique dentro do modal feche ele
document.addEventListener('click', (e) => {
    if (e.target.closest('.modal-content')) {
        e.stopPropagation();
    }
});

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

function changeMainPhoto(src, thumbnail) {
    const mainPhoto = document.getElementById('detail-main-photo');
    if (!mainPhoto) return;

    mainPhoto.src = src;
    
    // Atualizar thumbnail ativa
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
} 