document.addEventListener('DOMContentLoaded', () => {
    setupMenuToggle();
    setupForm();
    setupMasks();
    initMap();
});

function setupMenuToggle() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

function setupForm() {
    const form = document.getElementById('contact-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Pegar os dados do formulário
                const formData = new FormData(form);
                const data = {
                    nome: formData.get('nome'),
                    email: formData.get('email'),
                    telefone: formData.get('telefone'),
                    assunto: formData.get('assunto'),
                    mensagem: formData.get('mensagem')
                };

                // Validar dados
                if (!data.nome || !data.email || !data.telefone || !data.mensagem) {
                    throw new Error('Por favor, preencha todos os campos obrigatórios.');
                }

                // Enviar requisição
                const response = await fetch('/api/contatos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error('Erro ao enviar mensagem');
                }

                // Sucesso
                alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
                form.reset();

            } catch (error) {
                console.error('Erro:', error);
                alert(error.message || 'Erro ao enviar mensagem. Por favor, tente novamente.');
            }
        });
    }
}

function setupMasks() {
    const telefoneInput = document.getElementById('telefone');

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
}

// Adicionar função para inicializar o mapa
function initMap() {
    const luizAutomoveis = { lat: -16.714476062178704, lng: -49.27808514646048 };
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
        center: luizAutomoveis,
    });
    const marker = new google.maps.Marker({
        position: luizAutomoveis,
        map: map,
        title: 'Luiz Automóveis'
    });
} 