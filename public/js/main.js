document.addEventListener('DOMContentLoaded', () => {
    setupMenuToggle();
    loadFeaturedVehicles();
    addSchemaOrg();
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

// Função para normalizar URL da imagem
function normalizeImageUrl(url) {
    if (!url) return '/images/no-image.svg';
    
    // Se a URL já começar com http ou https, retorna ela mesma
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Se começar com /uploads, adiciona o IP do servidor
    if (url.startsWith('/uploads')) {
        return `http://167.172.139.129${url}`;
    }
    
    // Se começar com uploads (sem /), adiciona a barra
    if (url.startsWith('uploads/')) {
        return `http://167.172.139.129/${url}`;
    }
    
    // Para outros casos, tenta construir a URL completa
    return url.startsWith('/') ? url : `/${url}`;
}

// Atualizar a função que carrega os veículos em destaque
async function loadFeaturedVehicles() {
    try {
        const response = await fetch('/api/vehicles?limit=9&sort=-dataCadastro');
        const data = await response.json();
        const vehicles = Array.isArray(data) ? data : data.vehicles || [];

        const grid = document.querySelector('.vehicles-grid');
        if (!grid) return;

        grid.innerHTML = vehicles.map(vehicle => `
            <div class="vehicle-card" onclick="showVehicleDetails('${vehicle._id}')">
                <img src="${normalizeImageUrl(vehicle.fotos?.[0])}" 
                     alt="${vehicle.marca} ${vehicle.modelo}"
                     class="vehicle-image"
                     onerror="this.src='/images/no-image.svg'">
                <div class="vehicle-info">
                    <h3 class="vehicle-title">${vehicle.marca} ${vehicle.modelo}</h3>
                    <p class="vehicle-price">R$ ${vehicle.preco?.toLocaleString('pt-BR')}</p>
                    <div class="vehicle-details">
                        <p><i class="fas fa-calendar"></i> ${vehicle.ano}</p>
                        <p><i class="fas fa-tachometer-alt"></i> ${vehicle.quilometragem?.toLocaleString('pt-BR')} km</p>
                        <p><i class="fas fa-gas-pump"></i> ${vehicle.combustivel}</p>
                        <p><i class="fas fa-cog"></i> ${vehicle.transmissao}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar veículos em destaque:', error);
    }
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

        // Atualizar a lista de especificações
        const specList = document.getElementById('spec-list');
        specList.innerHTML = `
            <div class="spec-item">
                <i class="fas fa-car"></i>
                <span>Marca/Modelo:</span>
                <strong>${vehicle.marca} ${vehicle.modelo}</strong>
            </div>
            <div class="spec-item">
                <i class="fas fa-calendar"></i>
                <span>Ano:</span>
                <strong>${vehicle.ano}</strong>
            </div>
            <div class="spec-item">
                <i class="fas fa-tachometer-alt"></i>
                <span>Quilometragem:</span>
                <strong>${vehicle.quilometragem.toLocaleString('pt-BR')} km</strong>
            </div>
            <div class="spec-item">
                <i class="fas fa-palette"></i>
                <span>Cor:</span>
                <strong>${vehicle.cor}</strong>
            </div>
            <div class="spec-item">
                <i class="fas fa-gas-pump"></i>
                <span>Combustível:</span>
                <strong>${vehicle.combustivel}</strong>
            </div>
            <div class="spec-item">
                <i class="fas fa-cog"></i>
                <span>Transmissão:</span>
                <strong>${vehicle.transmissao}</strong>
            </div>
            <div class="spec-item">
                <i class="fas fa-hashtag"></i>
                <span>Final da Placa:</span>
                <strong>${vehicle.finalPlaca}</strong>
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

// Adicionar Schema.org
function addSchemaOrg() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "AutoDealer",
        "name": "Luiz Automóveis",
        "image": "https://luizautomoveis.com/images/logo.png",
        "description": "A melhor loja de carros seminovos de Goiânia",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Av. T-63, 2074",
            "addressLocality": "Goiânia",
            "addressRegion": "GO",
            "postalCode": "74250-320",
            "addressCountry": "BR"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": -16.714476062178704,
            "longitude": -49.27808514646048
        },
        "url": "https://luizautomoveis.com",
        "telephone": "+556232470376",
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "18:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Saturday",
                "opens": "09:00",
                "closes": "14:00"
            }
        ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
} 