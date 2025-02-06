document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupSidebar();
    loadContacts();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
}

async function loadContacts() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const response = await fetch('/api/contatos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error('Erro ao carregar contatos');
        }
        
        const contatos = await response.json();
        displayContacts(contatos);
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao carregar contatos');
    }
}

function displayContacts(contatos) {
    const tbody = document.getElementById('contacts-table-body');
    
    tbody.innerHTML = contatos.map(contato => `
        <tr>
            <td>${new Date(contato.dataEnvio).toLocaleDateString('pt-BR')}</td>
            <td>${contato.nome}</td>
            <td>${contato.email}</td>
            <td>${contato.telefone}</td>
            <td>${contato.assunto || '-'}</td>
            <td>
                <span class="status-badge ${getStatusClass(contato.status)}">
                    ${contato.status}
                </span>
            </td>
            <td class="actions">
                <button onclick="viewMessage('${contato._id}')" class="btn-icon" title="Ver mensagem">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="markAsRead('${contato._id}')" class="btn-icon" title="Marcar como lido">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="deleteContact('${contato._id}')" class="btn-icon" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch (status) {
        case 'Não lido': return 'status-unread';
        case 'Lido': return 'status-read';
        case 'Respondido': return 'status-replied';
        default: return '';
    }
}

async function viewMessage(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/contatos/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erro ao carregar mensagem');
        
        const contato = await response.json();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Detalhes da Mensagem</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="message-details">
                        <p><strong>Nome:</strong> ${contato.nome}</p>
                        <p><strong>Email:</strong> ${contato.email}</p>
                        <p><strong>Telefone:</strong> ${contato.telefone}</p>
                        <p><strong>Assunto:</strong> ${contato.assunto || '-'}</p>
                        <p><strong>Data:</strong> ${new Date(contato.dataEnvio).toLocaleString('pt-BR')}</p>
                        <p><strong>Status:</strong> ${contato.status}</p>
                        <div class="message-content">
                            <strong>Mensagem:</strong>
                            <p>${contato.mensagem}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Marcar como lido se estiver não lido
        if (contato.status === 'Não lido') {
            await updateStatus(id, 'Lido');
        }
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao carregar mensagem');
    }
}

async function updateStatus(id, newStatus) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/contatos/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus || 'Lido' })
        });

        if (!response.ok) throw new Error('Erro ao atualizar status');
        
        // Recarregar contatos para atualizar a lista
        loadContacts();
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao atualizar status');
    }
}

async function deleteContact(id) {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/contatos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir mensagem');
        
        // Recarregar contatos para atualizar a lista
        loadContacts();
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao excluir mensagem');
    }
}

function showError(message) {
    alert(message);
}

function setupSidebar() {
    const toggleBtn = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
} 