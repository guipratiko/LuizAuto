document.addEventListener('DOMContentLoaded', () => {
    setupMenuToggle();
    setupForm();
    setupMasks();
    populateSelects();
});

function setupMenuToggle() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

function populateSelects() {
    // Lista de marcas
    const marcas = [
        'Fiat', 'Chevrolet', 'Volkswagen', 'Ford', 'Toyota', 'Honda', 'Hyundai',
        'Renault', 'Nissan', 'Jeep', 'Peugeot', 'Citroën', 'Mitsubishi', 'Kia',
        'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Land Rover', 'Jaguar', 'Porsche',
        'Mini', 'Chery', 'BYD', 'JAC', 'Subaru', 'Suzuki', 'Ram', 'Maserati',
        'Ferrari', 'Lamborghini', 'Rolls-Royce', 'Bentley'
    ].sort();

    // Lista de cores
    const cores = [
        'Branco', 'Preto', 'Prata', 'Cinza', 'Azul metálico', 'Verde metálico',
        'Vermelho metálico', 'Bege metálico', 'Dourado metálico', 'Vermelho',
        'Azul', 'Verde', 'Amarelo', 'Laranja', 'Champagne', 'Grafite', 'Marrom',
        'Vinho', 'Azul royal', 'Verde esmeralda', 'Rosa', 'Fosco', 'Duotone',
        'Perolizado', 'Glitter'
    ].sort();

    // Lista de combustíveis
    const combustiveis = [
        'Elétrico', 'Híbrido', 'Flex', 'Álcool', 'Gasolina', 'Diesel'
    ];

    // Preenche os selects
    populateSelect('marca', marcas);
    populateSelect('cor', cores);
    populateSelect('combustivel', combustiveis);
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

function setupForm() {
    const form = document.getElementById('sell-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch('/api/venda', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Solicitação enviada com sucesso! Em breve entraremos em contato para avaliação.');
                form.reset();
            } else {
                throw new Error('Erro ao enviar formulário');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao enviar formulário. Por favor, tente novamente.');
        }
    });
}

function setupMasks() {
    const telefoneInput = document.getElementById('telefone');
    const quilometragemInput = document.getElementById('quilometragem');

    // Máscara para telefone
    telefoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        if (value.length > 9) {
            value = `${value.slice(0, 9)}-${value.slice(9)}`;
        }
        
        e.target.value = value;
    });

    // Máscara para quilometragem
    quilometragemInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = parseInt(value).toLocaleString('pt-BR');
    });
} 