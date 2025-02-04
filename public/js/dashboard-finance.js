document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupSidebar();
    loadFinanceRequests();
    setupLogout();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
}

async function loadFinanceRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/financiamentos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados');

        const requests = await response.json();
        if (!Array.isArray(requests)) throw new Error('Dados inválidos');
        
        displayFinanceRequests(requests);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar solicitações de financiamento');
    }
}

function displayFinanceRequests(requests) {
    const tbody = document.getElementById('finance-table-body');
    if (!tbody) return;

    tbody.innerHTML = requests.map(request => `
        <tr>
            <td>${new Date(request.createdAt).toLocaleDateString('pt-BR')}</td>
            <td>
                <div class="client-info">
                    <strong>${request.nome}</strong>
                    <small>${request.email}</small>
                    <small>${request.telefone}</small>
                </div>
            </td>
            <td>${request.veiculo_id?.marca} ${request.veiculo_id?.modelo}</td>
            <td>R$ ${parseFloat(request.entrada).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td>
                <span class="status-badge ${request.status}">${request.status}</span>
            </td>
            <td>
                <button onclick="updateStatus('${request._id}')" class="btn-action">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteRequest('${request._id}')" class="btn-action delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateStatus(id) {
    const newStatus = prompt('Digite o novo status (aprovado/reprovado/pendente):');
    if (!newStatus) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/financiamentos/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus.toLowerCase() })
        });

        if (!response.ok) throw new Error('Erro ao atualizar status');

        loadFinanceRequests();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status do financiamento');
    }
}

async function deleteRequest(id) {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/financiamentos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir solicitação');

        loadFinanceRequests();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir solicitação de financiamento');
    }
}

function setupSidebar() {
    const toggleBtn = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });
} 