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
    card.innerHTML = 
        <img src="\" alt="\ \">
        <div class="car-info">
            <h3>\ \</h3>
            <p>Ano: \</p>
            <p>Km: \</p>
            <p class="price">R$ \</p>
            <a href="/veiculo/\" class="view-details">Ver Detalhes</a>
        </div>
    ;
    return card;
}
