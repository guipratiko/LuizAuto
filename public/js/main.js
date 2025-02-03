document.addEventListener('DOMContentLoaded', function() {
    // Menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Carregar veículos
    const carsContainer = document.getElementById('cars-container');
    if (carsContainer) {
        fetch('/api/vehicles')
            .then(response => response.json())
            .then(vehicles => {
                if (vehicles.length === 0) {
                    carsContainer.innerHTML = '<p class="no-cars">Nenhum veículo disponível no momento.</p>';
                    return;
                }
                vehicles.forEach(vehicle => {
                    const card = createVehicleCard(vehicle);
                    carsContainer.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar veículos:', error);
                carsContainer.innerHTML = '<p class="error">Erro ao carregar veículos. Tente novamente mais tarde.</p>';
            });
    }
});

function createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'car-card';
    
    const mainImage = vehicle.fotos && vehicle.fotos.length > 0 ? vehicle.fotos[0] : '/images/no-image.svg';
    
    card.innerHTML = `
        <img src="${mainImage}" 
             alt="${vehicle.marca} ${vehicle.modelo}"
             onerror="this.src='/images/no-image.svg'">
        <div class="car-info">
            <h3>${vehicle.marca} ${vehicle.modelo}</h3>
            <p>Ano: ${vehicle.anoFabricacao}</p>
            <p>Km: ${vehicle.quilometragem.toLocaleString()}</p>
            <p class="price">R$ ${vehicle.preco.toLocaleString()}</p>
            <a href="/veiculo/${vehicle._id}" class="view-details">Ver Detalhes</a>
        </div>
    `;
    return card;
} 