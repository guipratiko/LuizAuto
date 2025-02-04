document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm();
    setupPasswordToggle();
});

function setupLoginForm() {
    const form = document.getElementById('login-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('token', result.token);
                window.location.href = '/dashboard';
            } else {
                throw new Error('Credenciais inválidas');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('E-mail ou senha incorretos. Por favor, tente novamente.');
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