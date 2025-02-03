document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    const vehicleId = window.location.pathname.split('/').pop();
    const container = document.getElementById('vehicle-container');

    fetch(`/api/vehicles/${vehicleId}`)
        .then(response => response.json())
        .then(vehicle => {
            const mainImage = vehicle.fotos && vehicle.fotos.length > 0 ? vehicle.fotos[0] : '/images/no-image.svg';
            
            container.innerHTML = `
                <div class="vehicle-gallery">
                    <div class="main-image">
                        <img src="${mainImage}" 
                             alt="${vehicle.marca} ${vehicle.modelo}"
                             onerror="this.src='/images/no-image.jpg'">
                    </div>
                    <div class="thumbnails">
                        ${vehicle.fotos ? vehicle.fotos.map(foto => `
                            <img src="${foto}" 
                                 alt="${vehicle.marca} ${vehicle.modelo}" 
                                 onclick="updateMainImage(this.src)"
                                 onerror="this.src='/images/no-image.jpg'">
                        `).join('') : ''}
                    </div>
                </div>
                <div class="vehicle-info">
                    <h1>${vehicle.marca} ${vehicle.modelo}</h1>
                    <div class="specs">
                        <p><strong>Ano:</strong> ${vehicle.anoFabricacao}</p>
                        <p><strong>Quilometragem:</strong> ${vehicle.quilometragem.toLocaleString()} km</p>
                        <p><strong>Combustível:</strong> ${vehicle.combustivel}</p>
                        <p><strong>Transmissão:</strong> ${vehicle.transmissao}</p>
                        <p><strong>Cor:</strong> ${vehicle.cor}</p>
                        <p><strong>Final da Placa:</strong> ${vehicle.finalPlaca}</p>
                    </div>
                    <div class="price">
                        <h2>R$ ${vehicle.preco.toLocaleString()}</h2>
                    </div>
                    <div class="description">
                        <h3>Descrição</h3>
                        <p>${vehicle.descricao || 'Sem descrição disponível'}</p>
                    </div>
                    <div class="contact">
                        <a href="https://wa.me/5511999999999?text=Olá, tenho interesse no ${vehicle.marca} ${vehicle.modelo}" 
                           class="whatsapp-button">
                            <i class="fab fa-whatsapp"></i> Entrar em Contato
                        </a>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Erro ao carregar veículo:', error);
            container.innerHTML = '<p class="error">Erro ao carregar detalhes do veículo. Tente novamente mais tarde.</p>';
        });
});

function updateMainImage(src) {
    document.querySelector('.main-image img').src = src;
}
