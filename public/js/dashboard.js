document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupSidebar();
    setupLogout();
    loadDashboardData();
    loadStats();
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

    // Fecha sidebar ao clicar em um link
    sidebar.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            sidebar.classList.remove('active');
        }
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

let currentPage = 1;

async function loadDashboardData(page = 1) {
    try {
        const token = localStorage.getItem('token');
        const [statsResponse, activitiesResponse] = await Promise.all([
            fetch('/api/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/api/dashboard/activities?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (!statsResponse.ok || !activitiesResponse.ok) throw new Error('Erro ao carregar dados');

        const stats = await statsResponse.json();
        const activitiesData = await activitiesResponse.json();

        updateStats(stats);
        displayActivities(activitiesData.atividades);
        displayPagination(activitiesData);
    } catch (error) {
        console.error('Erro:', error);
    }
}

function updateStats(stats) {
    const elements = {
        'total-veiculos': stats.totalVeiculos || 0,
        'total-financiamentos': stats.totalFinanciamentos || 0,
        'total-vendas': stats.totalVendas || 0,
        'total-mensagens': stats.totalMensagens || 0
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function displayActivities(activities) {
    const activitiesList = document.getElementById('activities-list');
    
    // Adicionar botão de limpar
    const headerSection = document.querySelector('.recent-section h2');
    if (headerSection && !document.getElementById('clear-activities')) {
        const clearButton = document.createElement('button');
        clearButton.id = 'clear-activities';
        clearButton.className = 'btn-clear';
        clearButton.innerHTML = '<i class="fas fa-trash"></i> Limpar';
        clearButton.onclick = clearActivities;
        headerSection.appendChild(clearButton);
    }

    if (!activities.length) {
        activitiesList.innerHTML = '<p class="no-activities">Nenhuma atividade recente</p>';
        return;
    }

    activitiesList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                ${getActivityIcon(activity.tipo)}
            </div>
            <div class="activity-details">
                <p class="activity-user">
                    <i class="fas fa-user"></i> ${activity.username}
                </p>
                <p class="activity-action">
                    ${activity.acao}
                </p>
                <p class="activity-info">
                    ${activity.detalhes}
                </p>
                <p class="activity-time">
                    <i class="far fa-clock"></i> 
                    ${formatDateTime(activity.dataHora)}
                </p>
            </div>
        </div>
    `).join('');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    if (date.toDateString() === hoje.toDateString()) {
        return `Hoje às ${date.toLocaleTimeString('pt-BR')}`;
    } else if (date.toDateString() === ontem.toDateString()) {
        return `Ontem às ${date.toLocaleTimeString('pt-BR')}`;
    } else {
        return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR')}`;
    }
}

function getActivityIcon(tipo) {
    const icons = {
        'veiculo': '<i class="fas fa-car"></i>',
        'financiamento': '<i class="fas fa-money-bill-wave"></i>',
        'contato': '<i class="fas fa-envelope"></i>',
        'venda': '<i class="fas fa-handshake"></i>'
    };
    return icons[tipo] || '<i class="fas fa-info-circle"></i>';
}

async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Carregar contagem de mensagens não lidas
        const responseContatos = await fetch('/api/contatos/nao-lidos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!responseContatos.ok) {
            if (responseContatos.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`Erro ${responseContatos.status}: ${await responseContatos.text()}`);
        }

        const dataContatos = await responseContatos.json();
        
        // Atualizar o stat-card de contatos
        const contatosCard = document.querySelector('.stat-card[data-type="contatos"]');
        if (contatosCard) {
            const countElement = contatosCard.querySelector('.stat-count');
            if (countElement) {
                countElement.textContent = dataContatos.count || '0';
            }
            
            // Adicionar badge se houver mensagens não lidas
            if (dataContatos.count > 0) {
                const title = contatosCard.querySelector('.stat-title');
                if (title && !title.querySelector('.new-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'new-badge';
                    badge.textContent = 'NOVO';
                    title.appendChild(badge);
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Atualizar o contador para 0 em caso de erro
        const countElement = document.querySelector('.stat-card[data-type="contatos"] .stat-count');
        if (countElement) {
            countElement.textContent = '0';
        }
    }
}

// Atualizar estatísticas periodicamente
setInterval(loadStats, 30000); // Atualiza a cada 30 segundos

// Atualizar a cada 30 segundos
setInterval(loadDashboardData, 30000);

async function clearActivities() {
    const senha = prompt('Digite a senha para limpar as atividades:');
    
    if (!senha) return; // Se cancelar ou não digitar nada
    
    if (senha !== '@genci4vx!') {
        alert('Senha incorreta!');
        return;
    }

    if (!confirm('Tem certeza que deseja limpar todas as atividades recentes?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard/activities', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao limpar atividades');

        loadDashboardData(); // Recarrega os dados
        alert('Atividades limpas com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao limpar atividades');
    }
}

function displayPagination(data) {
    const { currentPage, totalPages } = data;
    const paginationContainer = document.getElementById('activities-pagination');
    if (!paginationContainer) {
        const container = document.createElement('div');
        container.id = 'activities-pagination';
        container.className = 'pagination';
        document.querySelector('.activities-list').after(container);
    }

    const pagination = document.getElementById('activities-pagination');
    let paginationHTML = '';

    // Botão Anterior
    paginationHTML += `
        <button 
            class="pagination-btn" 
            onclick="changePage(${currentPage - 1})"
            ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Anterior
        </button>
    `;

    // Contador de páginas
    paginationHTML += `
        <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
    `;

    // Botão Próximo
    paginationHTML += `
        <button 
            class="pagination-btn" 
            onclick="changePage(${currentPage + 1})"
            ${currentPage === totalPages ? 'disabled' : ''}>
            Próximo <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = paginationHTML;
}

async function changePage(page) {
    if (page < 1) return;
    currentPage = page;
    await loadDashboardData(page);
    window.scrollTo(0, document.querySelector('.activities-list').offsetTop - 20);
}