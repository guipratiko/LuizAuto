function validateForm() {
    const form = document.getElementById('vehicle-form');
    const marca = form.marca.value;
    const modelo = form.modelo.value;
    const ano = parseInt(form.ano.value);
    const quilometragem = parseFloat(form.quilometragem.value);
    const preco = parseFloat(form.preco.value);
    const finalPlaca = parseInt(form.finalPlaca.value);

    // Validações básicas
    if (!marca || !modelo || !ano || isNaN(quilometragem) || !preco || isNaN(finalPlaca)) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return false;
    }

    // Validação do ano
    const anoAtual = new Date().getFullYear();
    const anoMaximo = anoAtual + 2; // Permite até 2 anos no futuro
    if (ano < 1900 || ano > anoMaximo) {
        alert(`O ano deve estar entre 1900 e ${anoMaximo}`);
        return false;
    }

    // Validação da quilometragem
    if (quilometragem < 0) {
        alert('A quilometragem não pode ser negativa.');
        return false;
    }

    // Validação do preço
    if (preco <= 0) {
        alert('O preço deve ser maior que zero.');
        return false;
    }

    // Validação do final da placa
    if (finalPlaca < 0 || finalPlaca > 9) {
        alert('O final da placa deve ser um número entre 0 e 9.');
        return false;
    }

    return true;
} 