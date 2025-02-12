document.addEventListener('DOMContentLoaded', () => {
    loadMarcasDisponiveis();
    loadCoresDisponiveis();
    setupFilters();
    loadVehicles();
});

let currentPage = 1;
const ITEMS_PER_PAGE = 20;

// Função para carregar cores disponíveis
async function loadCoresDisponiveis() {
    try {
        const response = await fetch('/api/vehicles');
        const data = await response.json();
        const vehicles = Array.isArray(data) ? data : data.vehicles || [];

        // Extrair cores únicas dos veículos
        const cores = [...new Set(vehicles.map(v => v.cor))].filter(cor => cor);
        cores.sort(); // Ordenar cores alfabeticamente

        // Preencher select de cores
        const corSelect = document.getElementById('filter-cor');
        if (corSelect) {
            corSelect.innerHTML = `
                <option value="">Todas as Cores</option>
                ${cores.map(cor => `<option value="${cor}">${cor}</option>`).join('')}
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar cores:', error);
    }
}

// Adicionar esta nova função
async function loadMarcasDisponiveis() {
    try {
        const response = await fetch('/api/vehicles');
        const data = await response.json();
        const vehicles = Array.isArray(data) ? data : data.vehicles || [];

        // Extrair marcas únicas dos veículos
        const marcas = [...new Set(vehicles.map(v => v.marca))].filter(marca => marca);
        marcas.sort(); // Ordenar marcas alfabeticamente

        // Preencher select de marcas
        const marcaSelect = document.getElementById('filter-marca');
        if (marcaSelect) {
            marcaSelect.innerHTML = `
                <option value="">Todas as Marcas</option>
                ${marcas.map(marca => `<option value="${marca}">${marca}</option>`).join('')}
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar marcas:', error);
    }
}

// Configuração dos filtros
function setupFilters() {
    // Preencher anos dinamicamente
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('filter-ano');
    for (let year = currentYear; year >= 1960; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Adicionar eventos aos filtros
    document.querySelectorAll('.filter-select').forEach(filter => {
        filter.addEventListener('change', () => {
            currentPage = 1;
            loadVehicles();
        });
    });
}

// Carregar veículos com filtros
async function loadVehicles(page = 1) {
    try {
        const params = new URLSearchParams();
        currentPage = page;
        
        // Pegar valores dos filtros
        const marca = document.getElementById('filter-marca').value;
        const ano = document.getElementById('filter-ano').value;
        const cor = document.getElementById('filter-cor').value;
        const precoRange = document.getElementById('filter-preco').value;

        // Adicionar filtros de forma simples
        if (marca) {
            params.append('marca', marca);
        }
        
        if (ano) {
            params.append('ano', ano);
        }
        
        if (cor) {
            params.append('cor', cor);
        }

        // Tratar faixa de preço
        if (precoRange) {
            const [min, max] = precoRange.split('-');
            if (min) {
                params.append('precoMin', min);
            }
            if (max) {
                params.append('precoMax', max);
            }
        }

        // Garantir que o limite seja sempre 20
        params.set('limit', ITEMS_PER_PAGE);
        params.set('page', currentPage);
        params.append('sort', '-dataCadastro');

        const response = await fetch(`/api/vehicles?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Erro na requisição');
        }

        const data = await response.json();
        let filteredVehicles = Array.isArray(data) ? data : data.vehicles || [];
        
        // Aplicar filtros manualmente se necessário
        if (marca) {
            filteredVehicles = filteredVehicles.filter(v => v.marca === marca);
        }
        if (ano) {
            filteredVehicles = filteredVehicles.filter(v => v.ano === parseInt(ano));
        }
        if (cor) {
            filteredVehicles = filteredVehicles.filter(v => v.cor === cor);
        }
        if (precoRange) {
            const [min, max] = precoRange.split('-').map(Number);
            filteredVehicles = filteredVehicles.filter(v => {
                if (min && max) {
                    return v.preco >= min && v.preco <= max;
                } else if (min) {
                    return v.preco >= min;
                } else if (max) {
                    return v.preco <= max;
                }
                return true;
            });
        }

        // Garantir que a paginação use sempre 20 itens
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedVehicles = filteredVehicles.slice(start, end);

        // Exibir resultados filtrados
        displayVehicles(paginatedVehicles);
        updatePagination(filteredVehicles.length);

    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
        displayVehicles([]);
        updatePagination(0);
    }
}

// Exibir veículos
function displayVehicles(vehicles) {
    const grid = document.getElementById('vehicles-grid');
    if (!grid) return;

    if (!vehicles || vehicles.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Nenhum veículo encontrado</h3>
                <p>Tente ajustar os filtros de busca</p>
            </div>`;
        return;
    }

    grid.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-card" onclick="showVehicleDetails('${vehicle._id}')">
            <img src="${vehicle.fotos?.[0] || '/images/no-image.svg'}" 
                 alt="${vehicle.marca} ${vehicle.modelo}" 
                 class="vehicle-image">
            <div class="vehicle-info">
                <h3 class="vehicle-title">${vehicle.marca} ${vehicle.modelo}</h3>
                <p class="vehicle-price">R$ ${vehicle.preco?.toLocaleString('pt-BR')}</p>
                <div class="vehicle-details">
                    <p><i class="fas fa-calendar"></i> ${vehicle.ano}</p>
                    <p><i class="fas fa-tachometer-alt"></i> ${vehicle.quilometragem?.toLocaleString('pt-BR')} km</p>
                    <p><i class="fas fa-gas-pump"></i> ${vehicle.combustivel}</p>
                    <p><i class="fas fa-cog"></i> ${vehicle.transmissao}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function updatePagination(total) {
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    if (!pagination || totalPages <= 1) return;

    let html = '';
    
    // Botão anterior
    html += `
        <button onclick="changePage(${currentPage - 1})" 
                class="page-btn" 
                ${currentPage <= 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button onclick="changePage(${i})" 
                        class="page-btn ${currentPage === i ? 'active' : ''}">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<span class="page-dots">...</span>';
        }
    }

    // Botão próximo
    html += `
        <button onclick="changePage(${currentPage + 1})" 
                class="page-btn" 
                ${currentPage >= totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = html;
}

// Função global para paginação
window.changePage = function(page) {
    currentPage = page;
    loadVehicles();
}; 