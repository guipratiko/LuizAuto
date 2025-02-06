document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupSidebar();
    loadFinanciamentos();
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

async function loadFinanciamentos() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/financiamentos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados');

        const financiamentos = await response.json();
        displayFinanciamentos(financiamentos);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar solicitações de financiamento');
    }
}

function displayFinanciamentos(financiamentos) {
    const tbody = document.getElementById('financiamentos-table-body');
    tbody.innerHTML = '';

    financiamentos.forEach(financiamento => {
        const tr = document.createElement('tr');
        const data = new Date(financiamento.dataEnvio).toLocaleDateString('pt-BR');
        
        tr.innerHTML = `
            <td>${data}</td>
            <td>${financiamento.nome}</td>
            <td>${financiamento.veiculo_id ? `${financiamento.veiculo_id.marca} ${financiamento.veiculo_id.modelo}` : 'N/A'}</td>
            <td>
                <div>📱 ${financiamento.telefone}</div>
                <div>📧 ${financiamento.email}</div>
            </td>
            <td>R$ ${parseFloat(financiamento.entrada).toLocaleString('pt-BR')}</td>
            <td>
                <select onchange="updateStatus('${financiamento._id}', this.value)" class="status-select ${financiamento.status.toLowerCase()}">
                    <option value="Pendente" ${financiamento.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Em análise" ${financiamento.status === 'Em análise' ? 'selected' : ''}>Em análise</option>
                    <option value="Aprovado" ${financiamento.status === 'Aprovado' ? 'selected' : ''}>Aprovado</option>
                    <option value="Recusado" ${financiamento.status === 'Recusado' ? 'selected' : ''}>Recusado</option>
                </select>
            </td>
            <td class="actions">
                <button onclick="viewDetails('${financiamento._id}')" class="btn-icon" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteFinanciamento('${financiamento._id}')" class="btn-icon delete" title="Excluir">
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
        const response = await fetch(`/api/financiamentos/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao atualizar status');
        }

        const data = await response.json();
        loadFinanciamentos(); // Recarrega a lista após atualização
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status: ' + error.message);
    }
}

async function deleteFinanciamento(id) {
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
        
        loadFinanciamentos(); // Recarrega a lista
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

// Função para visualizar detalhes (implementar conforme necessário)
function viewDetails(id) {
    // Implementar visualização de detalhes
    console.log('Ver detalhes do financiamento:', id);
} 