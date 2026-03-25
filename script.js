// Configuração de cores para o gráfico (padrão Dark Mode)
const CHART_COLORS = {
    labels: ['Moradia', 'Mercado', 'Carne', 'Transporte', 'Lazer', 'Outros'],
    backgroundColor: ['#ff79c6', '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c', '#6272a4']
};

let dados = {
    salarioInicialConfigurado: 0,
    valeInicialConfigurado: 0,
    salarioOrcamento: 0, 
    salarioAtual: 0,
    valeAtual: 0,
    cofrinhoTotal: 0,
    cofrinhoMeta: 0, // NOVO
    historico: [],
    lightMode: false // NOVO
};

const limiteCritico = 400.00; 
let expenseChart; // Variável global do gráfico

function carregarDados() {
    const dadosSalvos = localStorage.getItem('appFinanceiroDataPro');
    if (dadosSalvos) {
        dados = JSON.parse(dadosSalvos);
        
        // Aplica o tema salvo
        if (dados.lightMode) document.body.classList.add('light-mode');
        else document.body.classList.remove('light-mode');
        
        atualizarTela();
    } else {
        iniciarNovoMes(true); 
    }
}

function salvarDados() {
    localStorage.setItem('appFinanceiroDataPro', JSON.stringify(dados));
}

function atualizarTela() {
    document.getElementById('txt-cofrinho').innerText = `R$ ${dados.cofrinhoTotal.toFixed(2)}`;
    document.getElementById('txt-salario').innerText = `R$ ${dados.salarioAtual.toFixed(2)}`;
    document.getElementById('txt-vale').innerText = `R$ ${dados.valeAtual.toFixed(2)}`;

    // Porcentagens
    let pctSalario = dados.salarioOrcamento > 0 ? (dados.salarioAtual / dados.salarioOrcamento) * 100 : 0;
    let pctVale = dados.valeInicialConfigurado > 0 ? (dados.valeAtual / dados.valeInicialConfigurado) * 100 : 0;

    // Atualiza Barras
    let barraSalario = document.getElementById('barra-salario');
    let barraVale = document.getElementById('barra-vale');

    barraSalario.style.width = `${Math.max(pctSalario, 0)}%`;
    barraVale.style.width = `${Math.max(pctVale, 0)}%`;

    // Atualiza Barra Meta Cofrinho
    if (dados.cofrinhoMeta > 0) {
        let pctCofrinho = (dados.cofrinhoTotal / dados.cofrinhoMeta) * 100;
        document.getElementById('barra-cofrinho-meta').style.width = `${Math.min(pctCofrinho, 100)}%`;
    }

    // Lógica da Trava
    let optSalario = document.getElementById('opt-salario');
    let selectFonte = document.getElementById('tipo-gasto');

    if (dados.salarioAtual <= limiteCritico) {
        barraSalario.style.backgroundColor = '#ff5555'; 
        optSalario.disabled = true; 
        optSalario.innerText = "Conta (BLOQUEADA)";
        selectFonte.value = "vale"; 
    } else if (pctSalario <= 50) {
        barraSalario.style.backgroundColor = '#f1fa8c'; 
        optSalario.disabled = false;
        optSalario.innerText = "Conta";
    } else {
        barraSalario.style.backgroundColor = '#50fa7b'; 
        optSalario.disabled = false;
        optSalario.innerText = "Conta";
    }

    barraVale.style.backgroundColor = dados.valeAtual <= 0 ? '#ff5555' : '#8be9fd';

    atualizarDailyAllowance();
    atualizarGraficoEResumo();
    atualizarListaHistorico();
}

// NOVO: Gráfico e Resumo Agrupado
function atualizarGraficoEResumo() {
    let resumo = {Moradia: 0, Mercado: 0, Carne: 0, Transporte: 0, Lazer: 0, Outros: 0};
    
    dados.historico.forEach(item => {
        if(resumo[item.categoria] !== undefined) resumo[item.categoria] += item.valor;
        else resumo['Outros'] += item.valor;
    });

    const dataArr = CHART_COLORS.labels.map(label => resumo[label]);

    if (expenseChart) expenseChart.destroy(); // Recria o gráfico se ele já existir

    const ctx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: CHART_COLORS.labels,
            datasets: [{
                data: dataArr,
                backgroundColor: CHART_COLORS.backgroundColor,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: dados.lightMode ? '#282a36' : '#f8f8f2' } }
            }
        }
    });
}

// NOVO: Orçamento Diário Inteligente
function atualizarDailyAllowance() {
    const totalDisponivel = dados.salarioAtual + dados.valeAtual;
    const dailyEl = document.getElementById('daily-allowance');
    const daysEl = document.getElementById('days-left');

    const hoje = new Date();
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    // Faltam pelo menos 1 dia (pra não dividir por zero se for o último dia)
    const diasFaltantes = Math.max((ultimoDia.getDate() - hoje.getDate()) + 1, 1);

    const dailyAllowance = diasFaltantes > 0 ? (totalDisponivel / diasFaltantes) : 0;

    dailyEl.innerText = `R$ ${dailyAllowance.toFixed(2)}`;
    daysEl.innerText = `Faltam ${diasFaltantes} dias (Mês acabará em ${ultimoDia.toLocaleDateString()})`;
}

function atualizarListaHistorico() {
    const lista = document.getElementById('lista-historico');
    lista.innerHTML = '';
    
    let ultimosLancamentos = dados.historico.slice(0, 5); // Apenas últimos 5 na tela

    ultimosLancamentos.forEach(item => {
        let li = document.createElement('li');
        li.innerHTML = `
            <span>${item.categoria} <small>(${item.fonte})</small></span>
            <span class="valor-gasto">- R$ ${item.valor.toFixed(2)}</span>
        `;
        lista.appendChild(li);
    });
}

function registrarGasto() {
    let fonte = document.getElementById('tipo-gasto').value;
    let categoria = document.getElementById('categoria-gasto').value;
    let valor = parseFloat(document.getElementById('valor-gasto').value);

    if (isNaN(valor) || valor <= 0) {
        alert("Digite um valor válido!");
        return;
    }

    if (fonte === 'salario') {
        if (dados.salarioAtual - valor < 0) {
            alert("Saldo insuficiente na conta!");
            return;
        }
        let salarioAnterior = dados.salarioAtual;
        dados.salarioAtual -= valor;

        if (salarioAnterior > limiteCritico && dados.salarioAtual <= limiteCritico) {
            document.getElementById('modal-bloqueio').style.display = 'flex';
        }
    } else if (fonte === 'vale') {
        if (dados.valeAtual - valor < 0) {
            alert("Saldo insuficiente no Vale Card!");
            return;
        }
        dados.valeAtual -= valor;
    }

    dados.historico.unshift({ fonte: fonte === 'salario' ? 'Conta' : 'Vale', categoria: categoria, valor: valor, data: new Date().toLocaleDateString() });

    salvarDados();
    document.getElementById('valor-gasto').value = ''; 
    atualizarTela();
}

// NOVO: Desfazer
function desfazerUltimoGasto() {
    if (dados.historico.length === 0) return;

    if (confirm("Tem certeza que deseja desfazer o último lançamento registrado?")) {
        const ultimo = dados.historico.shift(); // Remove do início
        
        // Devolve o dinheiro
        if (ultimo.fonte === 'Conta') dados.salarioAtual += ultimo.valor;
        else if (ultimo.fonte === 'Vale') dados.valeAtual += ultimo.valor;

        salvarDados();
        atualizarTela();
    }
}

// NOVO: Meta Cofrinho
function definirMeta() {
    let meta = prompt("Qual o valor total da sua nova meta para o Cofrinho? (Ex: R$ 2000.00)", dados.cofrinhoMeta || "1000.00");
    meta = parseFloat(meta);
    if (!isNaN(meta) && meta >= 0) {
        dados.cofrinhoMeta = meta;
        salvarDados();
        atualizarTela();
    }
}

// NOVO: Backup
function exportarBackup() {
    const backupStr = JSON.stringify(dados);
    const blob = new Blob([backupStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_financeiro_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = readerEvent => {
            const content = readerEvent.target.result;
            try {
                dados = JSON.parse(content);
                salvarDados();
                atualizarTela();
                alert("Backup importado com sucesso! Seus dados foram restaurados.");
            } catch (err) {
                alert("Erro ao importar o arquivo. Formato inválido.");
            }
        }
    }
    input.click();
}

// NOVO: Temas
function alternarTema() {
    dados.lightMode = !dados.lightMode;
    const body = document.body;
    const btn = document.getElementById('theme-toggle');

    if (dados.lightMode) {
        body.classList.add('light-mode');
        btn.innerText = '☀️';
    } else {
        body.classList.remove('light-mode');
        btn.innerText = '🌙';
    }
    salvarDados();
    atualizarTela(); // Recria o gráfico com as cores da legenda corretas
}

// Função de Novo Mês (igual)
function iniciarNovoMes(primeiraVez = false) {
    if (primeiraVez || confirm("Fechar o mês atual? Os dados atuais serão zerados para um novo início.")) {
        
        let valorSalario = prompt("Qual o Salário líquido este mês?", "2000.00");
        let valorVale = prompt("Qual o valor do Vale Card?", "800.00");
        let valorGuardar = prompt("Quanto vai pro Cofrinho ANTES?", "50.00");

        dados.salarioInicialConfigurado = parseFloat(valorSalario) || 0;
        dados.valeInicialConfigurado = parseFloat(valorVale) || 0;
        dados.cofrinhoTotal += parseFloat(valorGuardar) || 0; 
        
        dados.salarioOrcamento = dados.salarioInicialConfigurado - (parseFloat(valorGuardar) || 0); 
        dados.salarioAtual = dados.salarioOrcamento;
        dados.valeAtual = dados.valeInicialConfigurado;
        dados.historico = []; // Zera os lançamentos do mês novo

        if(valorGuardar > 0 && !primeiraVez) {
            alert(`Show! Guardou R$ ${parseFloat(valorGuardar).toFixed(2)}. Saldo disponível: R$ ${dados.salarioAtual.toFixed(2)}.`);
        }

        salvarDados();
        atualizarTela();
    }
}

function fecharModal() { document.getElementById('modal-bloqueio').style.display = 'none'; }

carregarDados();