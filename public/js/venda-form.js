function validateForm() {
    const form = document.getElementById('venda-form');
    const ano = parseInt(form.ano.value);
    const quilometragem = parseFloat(form.quilometragem.value);

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

    return true;
}

document.getElementById('venda-form').onsubmit = function(e) {
    e.preventDefault();
    if (validateForm()) {
        // continua com o envio do formulário
        submitForm();
    }
}; 