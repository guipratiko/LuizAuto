document.addEventListener('DOMContentLoaded', () => {
    setupMenuToggle();
    loadFeaturedVehicles();
});

function setupMenuToggle() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuToggle || !navLinks) return;

    // Criar overlay se não existir
    if (!document.querySelector('.menu-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);
    }

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        document.querySelector('.menu-overlay').classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Fechar menu ao clicar no overlay
    document.querySelector('.menu-overlay').addEventListener('click', () => {
        navLinks.classList.remove('active');
        document.querySelector('.menu-overlay').classList.remove('active');
        document.body.style.overflow = '';
    });

    // Fechar menu ao clicar em um link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            document.querySelector('.menu-overlay').classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            document.querySelector('.menu-overlay').classList.remove('active');
            document.body.style.overflow = '';
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
            <img src="${vehicle.fotos[0] || '/images/no-image.svg'}" alt="${vehicle.marca} ${vehicle.modelo}">
            <div class="vehicle-info">
                <h3>${vehicle.marca} ${vehicle.modelo}</h3>
                <p class="price">R$ ${vehicle.preco.toLocaleString('pt-BR')}</p>
                <div class="specs">
                    <span><i class="fas fa-calendar"></i> ${vehicle.ano}</span>
                    <span><i class="fas fa-tachometer-alt"></i> ${vehicle.quilometragem.toLocaleString('pt-BR')} km</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Função para mostrar detalhes do veículo
async function showVehicleDetails(id) {
    try {
        const response = await fetch(`/api/vehicles/${id}`);
        if (!response.ok) throw new Error('Erro ao carregar veículo');

        const vehicle = await response.json();
        
        // Atualizar os elementos do modal
        document.getElementById('vehicle-title').textContent = `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`;
        document.getElementById('vehicle-price').textContent = `R$ ${vehicle.preco.toLocaleString('pt-BR')}`;
        
        // Configurar galeria de fotos
        if (vehicle.fotos && vehicle.fotos.length > 0) {
            const mainPhoto = document.getElementById('detail-main-photo');
            mainPhoto.src = vehicle.fotos[0];
            mainPhoto.onerror = () => {
                mainPhoto.src = '/images/no-image.svg';
            };

            document.getElementById('detail-thumbnails').innerHTML = vehicle.fotos.map((foto, index) => `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainPhoto('${foto}', this)">
                    <img src="${foto}" alt="Foto ${index + 1}" onerror="this.src='/images/no-image.svg'">
                </div>
            `).join('');
        }

        // Preencher especificações
        document.getElementById('spec-list').innerHTML = `
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
            </div>
        `;

        // Preencher descrição
        document.getElementById('vehicle-description').textContent = vehicle.descricao;

        // Configurar link do WhatsApp
        const whatsappMessage = encodeURIComponent(
            `Achei um veículo no site de vocês, gostaria de saber mais\n\n${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`
        );
        document.getElementById('btn-whatsapp').href = `https://wa.me/556232470376?text=${whatsappMessage}`;

        // Mostrar o modal
        document.getElementById('vehicle-details-modal').classList.add('active');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar detalhes do veículo');
    }
}

// Função para fechar o modal
function closeDetailsModal() {
    const modal = document.getElementById('vehicle-details-modal');
    if (modal) {
        modal.classList.remove('active');
        // Limpar conteúdo do modal
        document.getElementById('detail-main-photo').src = '';
        document.getElementById('detail-thumbnails').innerHTML = '';
        document.getElementById('vehicle-title').textContent = '';
        document.getElementById('vehicle-price').textContent = '';
        document.getElementById('spec-list').innerHTML = '';
        document.getElementById('vehicle-description').textContent = '';
    }
}

// Evento para fechar o modal ao clicar fora
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
    
    // Loop circular nas fotos
    if (currentPhotoIndex >= thumbnails.length) {
        currentPhotoIndex = 0;
    } else if (currentPhotoIndex < 0) {
        currentPhotoIndex = thumbnails.length - 1;
    }
    
    const newSrc = thumbnails[currentPhotoIndex].querySelector('img').src;
    mainPhoto.src = newSrc;
    
    // Atualizar thumbnail ativa
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnails[currentPhotoIndex].classList.add('active');
    
    // Scroll para a thumbnail ativa
    const activeThumb = thumbnails[currentPhotoIndex];
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function changeMainPhoto(src, thumbnail) {
    const mainPhoto = document.getElementById('detail-main-photo');
    if (!mainPhoto) return;

    mainPhoto.src = src;
    mainPhoto.onerror = () => {
        mainPhoto.src = '/images/no-image.svg';
    };
    
    // Atualizar thumbnail ativa
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

// Adicionar suporte para navegação com teclado
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('vehicle-details-modal');
    if (modal && modal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            changePhoto(-1);
        } else if (e.key === 'ArrowRight') {
            changePhoto(1);
        } else if (e.key === 'Escape') {
            closeDetailsModal();
        }
    }
}); 