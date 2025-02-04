document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupSidebar();
    loadVendas();
    setupLogout();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
}

function setupSidebar() {
    const toggleBtn = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

async function loadVendas() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/vendas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados');

        const vendas = await response.json();
        displayVendas(vendas);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar solicitações de venda');
    }
}

function displayVendas(vendas) {
    const tbody = document.getElementById('vendas-table-body');
    tbody.innerHTML = '';

    vendas.forEach(venda => {
        const tr = document.createElement('tr');
        const data = new Date(venda.dataEnvio).toLocaleDateString('pt-BR');
        
        tr.innerHTML = `
            <td>${data}</td>
            <td>${venda.nome}</td>
            <td>${venda.marca} ${venda.modelo} (${venda.ano})</td>
            <td>
                <div>📱 ${venda.telefone}</div>
                <div>📧 ${venda.email}</div>
            </td>
            <td>
                <select onchange="updateStatus('${venda._id}', this.value)" class="status-select ${venda.status.toLowerCase()}">
                    <option value="Pendente" ${venda.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Em análise" ${venda.status === 'Em análise' ? 'selected' : ''}>Em análise</option>
                    <option value="Avaliado" ${venda.status === 'Avaliado' ? 'selected' : ''}>Avaliado</option>
                    <option value="Finalizado" ${venda.status === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                </select>
            </td>
            <td>
                <button onclick="viewDetails('${venda._id}')" class="btn-icon">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteVenda('${venda._id}')" class="btn-icon delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

async function updateStatus(id, status) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/vendas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Erro ao atualizar status');
        
        loadVendas(); // Recarrega a lista
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status');
    }
}

async function deleteVenda(id) {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/vendas/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir solicitação');
        
        loadVendas(); // Recarrega a lista
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir solicitação');
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });
} 