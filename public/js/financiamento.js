document.addEventListener('DOMContentLoaded', () => {
    setupMenuToggle();
    carregarVeiculos();
    setupForm();
    setupMasks();
});

async function carregarVeiculos() {
    try {
        const response = await fetch('/api/vehicles?status=disponivel');
        const veiculos = await response.json();
        displayVeiculos(veiculos);
    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
    }
}

function displayVeiculos(veiculos) {
    const grid = document.getElementById('vehicles-grid');
    
    grid.innerHTML = veiculos.map(veiculo => `
        <div class="vehicle-card" onclick="selecionarVeiculo(${JSON.stringify(veiculo).replace(/"/g, '&quot;')})">
            <img src="${veiculo.fotos[0] || '/images/no-image.jpg'}" alt="${veiculo.marca} ${veiculo.modelo}" class="vehicle-image">
            <div class="vehicle-info">
                <h3 class="vehicle-title">${veiculo.marca} ${veiculo.modelo}</h3>
                <p class="vehicle-price">R$ ${veiculo.preco.toLocaleString('pt-BR')}</p>
                <div class="vehicle-details">
                    <p><i class="fas fa-calendar"></i> ${veiculo.ano}</p>
                    <p><i class="fas fa-tachometer-alt"></i> ${veiculo.quilometragem.toLocaleString('pt-BR')} km</p>
                </div>
                <button class="select-btn">
                    <i class="fas fa-hand-point-right"></i>
                    Selecionar este veículo
                </button>
            </div>
        </div>
    `).join('');
}

function selecionarVeiculo(veiculo) {
    document.getElementById('veiculo_id').value = veiculo._id;
    document.getElementById('selected-vehicle-info').innerHTML = `
        <div class="selected-vehicle-card">
            <img src="${veiculo.fotos[0] || '/images/no-image.jpg'}" alt="${veiculo.marca} ${veiculo.modelo}">
            <div class="vehicle-details">
                <h4>${veiculo.marca} ${veiculo.modelo}</h4>
                <p class="price">R$ ${veiculo.preco.toLocaleString('pt-BR')}</p>
                <p>${veiculo.ano} | ${veiculo.quilometragem.toLocaleString('pt-BR')} km</p>
            </div>
        </div>
    `;
    
    document.getElementById('finance-form-container').style.display = 'block';
    document.getElementById('finance-form-container').scrollIntoView({ behavior: 'smooth' });
}

function setupForm() {
    const form = document.getElementById('finance-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Formatar valor da entrada
        data.entrada = parseFloat(data.entrada.replace(/\./g, '').replace(',', '.'));
        
        try {
            const response = await fetch('/api/financiamentos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Erro ao enviar solicitação');

            alert('Solicitação de financiamento enviada com sucesso!');
            form.reset();
            document.getElementById('finance-form-container').style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao enviar solicitação. Tente novamente.');
        }
    });
}

function setupMasks() {
    const telefoneInput = document.getElementById('telefone');
    const entradaInput = document.getElementById('entrada');

    IMask(telefoneInput, {
        mask: '(00) 00000-0000'
    });

    IMask(entradaInput, {
        mask: Number,
        scale: 2,
        thousandsSeparator: '.',
        padFractionalZeros: true,
        normalizeZeros: true,
        radix: ','
    });
}

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