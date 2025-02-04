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

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados');

        const data = await response.json();
        
        // Verifica se os dados são válidos
        if (!data || typeof data !== 'object') {
            throw new Error('Dados inválidos recebidos do servidor');
        }

        updateDashboardStats(data);
        updateBadges(data);
        loadRecentActivities();
    } catch (error) {
        console.error('Erro:', error);
        // Não mostra alert para não incomodar o usuário
        // Apenas registra o erro no console
    }
}

function updateDashboardStats(data) {
    const elements = {
        'total-veiculos': data.totalVeiculos || 0,
        'total-financiamentos': data.totalFinanciamentos || 0,
        'total-vendas': data.totalVendas || 0,
        'total-mensagens': data.totalMensagens || 0
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function updateBadges(data) {
    // Verifica se o elemento existe antes de tentar acessá-lo
    const financiamentosBadge = document.getElementById('financiamentos-badge');
    if (financiamentosBadge) {
        financiamentosBadge.textContent = data.totalFinanciamentos || 0;
    }

    // Oculta badges se valor for 0
    ['financiamentos'].forEach(type => {
        const badge = document.getElementById(`${type}-badge`);
        if (badge) {
            badge.style.display = (data[type] > 0) ? 'inline' : 'none';
        }
    });
}

function loadRecentActivities() {
    const activitiesList = document.getElementById('activities-list');
    if (!activitiesList) return;

    // Por enquanto, vamos apenas mostrar uma mensagem padrão
    activitiesList.innerHTML = `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="activity-info">
                <p class="activity-text">Nenhuma atividade recente</p>
            </div>
        </div>
    `;
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