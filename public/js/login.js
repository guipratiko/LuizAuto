document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm();
    setupPasswordToggle();
});

function setupLoginForm() {
    const form = document.getElementById('login-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = {
                username: document.getElementById('username').value,
                senha: document.getElementById('senha').value
            };

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard';
            } else {
                const error = await response.json();
                alert(error.message || 'Usuário ou senha incorretos');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao fazer login. Por favor, tente novamente.');
        }
    });
}

function setupPasswordToggle() {
    const toggleBtn = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('senha');
    
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleBtn.querySelector('i').classList.toggle('fa-eye');
        toggleBtn.querySelector('i').classList.toggle('fa-eye-slash');
    });
} 