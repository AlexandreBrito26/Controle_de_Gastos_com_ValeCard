// =============================================
//  CARTEIRA — Script Principal
// =============================================

const CHART_COLORS = {
    labels: ['Moradia', 'Mercado', 'Carne', 'Transporte', 'Lazer', 'Outros'],
    colors: ['#4a7c28','#c9a84c','#d4715a','#4a7fa5','#8b6ba8','#7a7268']
};

let dados = {
    salarioInicialConfigurado: 0,
    valeInicialConfigurado: 0,
    salarioOrcamento: 0,
    salarioAtual: 0,
    valeAtual: 0,
    cofrinhoTotal: 0,
    cofrinhoMeta: 0,
    historico: [],
    darkMode: false
};

const LIMITE_CRITICO = 400.00;
let expenseChart;

// ========================
//  INICIALIZAÇÃO
// ========================

function carregarDados() {
    const salvo = localStorage.getItem('carteira_v2');
    if (salvo) {
        dados = JSON.parse(salvo);
        aplicarTema();
        atualizarTela();
    } else {
        iniciarNovoMes(true);
    }
}

function salvarDados() {
    localStorage.setItem('carteira_v2', JSON.stringify(dados));
}

function aplicarTema() {
    const btn = document.getElementById('theme-toggle');
    if (dados.darkMode) {
        document.body.classList.add('dark');
        btn.innerText = '☀️';
    } else {
        document.body.classList.remove('dark');
        btn.innerText = '🌙';
    }
}

// ========================
//  ATUALIZAR TELA
// ========================

function atualizarTela() {
    const total = dados.salarioAtual + dados.valeAtual;
    document.getElementById('saldo-total').innerText = formatBRL(total);
    document.getElementById('txt-salario').innerText = formatBRL(dados.salarioAtual);
    document.getElementById('txt-vale').innerText = formatBRL(dados.valeAtual);
    document.getElementById('txt-cofrinho').innerText = formatBRL(dados.cofrinhoTotal);

    // Barras
    const pctSalario = dados.salarioOrcamento > 0 ? (dados.salarioAtual / dados.salarioOrcamento) * 100 : 0;
    const pctVale = dados.valeInicialConfigurado > 0 ? (dados.valeAtual / dados.valeInicialConfigurado) * 100 : 0;

    setBarWidth('barra-salario', pctSalario);
    setBarWidth('barra-vale', pctVale);

    // Cor e status da barra de conta
    const barraSal = document.getElementById('barra-salario');
    const optSalario = document.getElementById('opt-salario');
    const selectFonte = document.getElementById('tipo-gasto');
    const statusConta = document.getElementById('status-conta');

    if (dados.salarioAtual <= LIMITE_CRITICO) {
        barraSal.style.background = '#c0392b';
        optSalario.disabled = true;
        optSalario.innerText = 'Conta (bloqueada)';
        selectFonte.value = 'vale';
        statusConta.innerText = '⛔ Bloqueada';
        statusConta.className = 'card-status status-critico';
    } else if (pctSalario <= 40) {
        barraSal.style.background = '#c9a84c';
        optSalario.disabled = false;
        optSalario.innerText = 'Conta';
        statusConta.innerText = `⚠️ ${pctSalario.toFixed(0)}% restante`;
        statusConta.className = 'card-status status-aviso';
    } else {
        barraSal.style.background = '#4a7c28';
        optSalario.disabled = false;
        optSalario.innerText = 'Conta';
        statusConta.innerText = `✓ ${pctSalario.toFixed(0)}% restante`;
        statusConta.className = 'card-status status-ok';
    }

    const barraVale = document.getElementById('barra-vale');
    barraVale.style.background = dados.valeAtual <= 0 ? '#c0392b' : '#4a7fa5';
    const statusVale = document.getElementById('status-vale');
    statusVale.innerText = dados.valeAtual <= 0 ? '⛔ Zerado' : `✓ ${pctVale.toFixed(0)}% restante`;
    statusVale.className = `card-status ${dados.valeAtual <= 0 ? 'status-critico' : 'status-ok'}`;

    // Cofrinho meta
    if (dados.cofrinhoMeta > 0) {
        const pctCofrinho = Math.min((dados.cofrinhoTotal / dados.cofrinhoMeta) * 100, 100);
        document.getElementById('barra-cofrinho').style.width = pctCofrinho + '%';
        document.getElementById('txt-meta-label').innerText = `Meta: ${formatBRL(dados.cofrinhoMeta)} (${pctCofrinho.toFixed(0)}%)`;
    } else {
        document.getElementById('barra-cofrinho').style.width = '0%';
        document.getElementById('txt-meta-label').innerText = 'Meta: não definida';
    }

    atualizarOrcamentoDiario();
    atualizarGrafico();
    atualizarHistorico();
}

function setBarWidth(id, pct) {
    document.getElementById(id).style.width = Math.max(0, Math.min(pct, 100)) + '%';
}

function formatBRL(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ========================
//  ORÇAMENTO DIÁRIO
// ========================

function atualizarOrcamentoDiario() {
    const total = dados.salarioAtual + dados.valeAtual;
    const hoje = new Date();
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const diasRestantes = Math.max((ultimoDia.getDate() - hoje.getDate()) + 1, 1);
    const porDia = total / diasRestantes;

    document.getElementById('txt-orcamento-diario').innerText = `${formatBRL(porDia)} por dia`;
    document.getElementById('txt-dias-faltam').innerHTML = `— Faltam <strong>${diasRestantes}</strong> dias`;
}

// ========================
//  GRÁFICO
// ========================

function atualizarGrafico() {
    const resumo = {Moradia: 0, Mercado: 0, Carne: 0, Transporte: 0, Lazer: 0, Outros: 0};
    dados.historico.forEach(item => {
        if (resumo[item.categoria] !== undefined) resumo[item.categoria] += item.valor;
        else resumo['Outros'] += item.valor;
    });

    const dataArr = CHART_COLORS.labels.map(l => resumo[l]);
    const total = dataArr.reduce((a,b) => a+b, 0);
    const temDados = total > 0;

    if (expenseChart) expenseChart.destroy();

    const textColor = dados.darkMode ? '#ede8df' : '#1a1714';
    const subColor = dados.darkMode ? '#7a7268' : '#8a8278';

    const ctx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: CHART_COLORS.labels,
            datasets: [{
                data: temDados ? dataArr : [1],
                backgroundColor: temDados ? CHART_COLORS.colors : ['rgba(0,0,0,0.08)'],
                borderWidth: 3,
                borderColor: dados.darkMode ? '#211e17' : '#ffffff',
                hoverBorderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: temDados,
                    position: 'bottom',
                    labels: {
                        color: subColor,
                        boxWidth: 10,
                        padding: 12,
                        font: { family: 'DM Sans', size: 11 }
                    }
                },
                tooltip: {
                    enabled: temDados,
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${formatBRL(ctx.parsed)}`
                    }
                }
            }
        },
        plugins: temDados ? [] : [{
            id: 'emptyText',
            afterDraw(chart) {
                const { ctx, chartArea: { left, top, width, height } } = chart;
                ctx.save();
                ctx.fillStyle = subColor;
                ctx.font = '13px DM Sans';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Nenhum gasto ainda', left + width / 2, top + height / 2);
                ctx.restore();
            }
        }]
    });
}

// ========================
//  HISTÓRICO
// ========================

function atualizarHistorico() {
    const lista = document.getElementById('lista-historico');
    const vazio = document.getElementById('historico-vazio');
    lista.innerHTML = '';

    if (dados.historico.length === 0) {
        vazio.style.display = 'block';
        return;
    }
    vazio.style.display = 'none';

    dados.historico.slice(0, 8).forEach(item => {
        const li = document.createElement('li');
        li.className = 'historico-item';
        li.innerHTML = `
            <div>
                <p class="historico-cat">${item.categoria}</p>
                <p class="historico-fonte">${item.fonte} · ${item.data}</p>
            </div>
            <div style="display:flex;align-items:center;">
                <span class="historico-valor">− ${formatBRL(item.valor)}</span>
            </div>
        `;
        lista.appendChild(li);
    });
}

// ========================
//  REGISTRAR GASTO
// ========================

function registrarGasto() {
    const fonte = document.getElementById('tipo-gasto').value;
    const categoria = document.getElementById('categoria-gasto').value;
    const valor = parseFloat(document.getElementById('valor-gasto').value);

    if (isNaN(valor) || valor <= 0) {
        alert('Digite um valor válido.');
        return;
    }

    if (fonte === 'salario') {
        if (dados.salarioAtual - valor < 0) { alert('Saldo insuficiente na conta!'); return; }
        const ant = dados.salarioAtual;
        dados.salarioAtual -= valor;
        if (ant > LIMITE_CRITICO && dados.salarioAtual <= LIMITE_CRITICO) {
            document.getElementById('modal-bloqueio').style.display = 'flex';
        }
    } else {
        if (dados.valeAtual - valor < 0) { alert('Saldo insuficiente no Vale Card!'); return; }
        dados.valeAtual -= valor;
    }

    dados.historico.unshift({
        fonte: fonte === 'salario' ? 'Conta' : 'Vale',
        categoria,
        valor,
        data: new Date().toLocaleDateString('pt-BR')
    });

    document.getElementById('valor-gasto').value = '';
    salvarDados();
    atualizarTela();
}

// ========================
//  DESFAZER
// ========================

function desfazerUltimoGasto() {
    if (dados.historico.length === 0) return;
    if (!confirm('Desfazer o último lançamento?')) return;
    const ultimo = dados.historico.shift();
    if (ultimo.fonte === 'Conta') dados.salarioAtual += ultimo.valor;
    else dados.valeAtual += ultimo.valor;
    salvarDados();
    atualizarTela();
}

// ========================
//  META COFRINHO
// ========================

function definirMeta() {
    let meta = prompt('Qual o valor da sua meta no Cofrinho? (Ex: 2000)', dados.cofrinhoMeta || '1000');
    meta = parseFloat(meta);
    if (!isNaN(meta) && meta >= 0) {
        dados.cofrinhoMeta = meta;
        salvarDados();
        atualizarTela();
    }
}

// ========================
//  NOVO MÊS
// ========================

function iniciarNovoMes(primeira = false) {
    if (!primeira && !confirm('Fechar o mês atual e começar novo? Os lançamentos serão zerados.')) return;

    const salario = parseFloat(prompt('Salário líquido deste mês:', '2000.00')) || 0;
    const vale = parseFloat(prompt('Valor do Vale Card:', '800.00')) || 0;
    const guardar = parseFloat(prompt('Quanto vai direto pro Cofrinho?', '50.00')) || 0;

    dados.salarioInicialConfigurado = salario;
    dados.valeInicialConfigurado = vale;
    dados.cofrinhoTotal += guardar;
    dados.salarioOrcamento = salario - guardar;
    dados.salarioAtual = dados.salarioOrcamento;
    dados.valeAtual = vale;
    dados.historico = [];

    salvarDados();
    atualizarTela();

    if (!primeira && guardar > 0) {
        alert(`✅ ${formatBRL(guardar)} adicionados ao cofrinho!\nSaldo disponível: ${formatBRL(dados.salarioAtual)}`);
    }
}

// ========================
//  TEMA
// ========================

function alternarTema() {
    dados.darkMode = !dados.darkMode;
    aplicarTema();
    salvarDados();
    atualizarTela(); // recria gráfico com cores corretas
}

// ========================
//  MODAL
// ========================

function fecharModal() {
    document.getElementById('modal-bloqueio').style.display = 'none';
}

// ========================
//  EXPORTAR PDF
// ========================

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });

    const mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const dataGeracao = new Date().toLocaleDateString('pt-BR');

    // Cabeçalho
    doc.setFillColor(45, 80, 22);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('Carteira — Controle Mensal', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 230, 180);
    doc.text(`${mes.charAt(0).toUpperCase() + mes.slice(1)}  ·  Gerado em ${dataGeracao}`, 14, 30);

    // Resumo financeiro
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro', 14, 50);

    const resumoItems = [
        ['Saldo em Conta', formatBRL(dados.salarioAtual)],
        ['Vale Card', formatBRL(dados.valeAtual)],
        ['Total Disponível', formatBRL(dados.salarioAtual + dados.valeAtual)],
        ['Cofrinho', formatBRL(dados.cofrinhoTotal)],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    let y = 60;
    resumoItems.forEach(([label, valor], i) => {
        if (i % 2 === 0) doc.setFillColor(247, 244, 239);
        else doc.setFillColor(255, 255, 255);
        doc.rect(14, y - 5, 182, 9, 'F');
        doc.setTextColor(80, 80, 80);
        doc.text(label, 18, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(valor, 196 - doc.getTextWidth(valor), y);
        doc.setFont('helvetica', 'normal');
        y += 9;
    });

    // Gastos por categoria
    y += 10;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Gastos por Categoria', 14, y);
    y += 8;

    const resumoCat = {};
    dados.historico.forEach(item => {
        resumoCat[item.categoria] = (resumoCat[item.categoria] || 0) + item.valor;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    Object.entries(resumoCat).sort((a,b) => b[1]-a[1]).forEach(([cat, val], i) => {
        if (i % 2 === 0) doc.setFillColor(247, 244, 239);
        else doc.setFillColor(255, 255, 255);
        doc.rect(14, y - 4.5, 182, 8, 'F');
        doc.setTextColor(80,80,80);
        doc.text(cat, 18, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 60, 40);
        const vStr = `− ${formatBRL(val)}`;
        doc.text(vStr, 196 - doc.getTextWidth(vStr), y);
        doc.setFont('helvetica', 'normal');
        y += 8;
    });

    if (Object.keys(resumoCat).length === 0) {
        doc.setTextColor(160,160,160);
        doc.text('Nenhum lançamento registrado.', 18, y);
        y += 8;
    }

    // Todos os lançamentos
    y += 10;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30,30,30);
    doc.text('Todos os Lançamentos', 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(45, 80, 22);
    doc.rect(14, y - 5, 182, 7, 'F');
    doc.setTextColor(255,255,255);
    doc.text('Data', 18, y);
    doc.text('Categoria', 48, y);
    doc.text('Fonte', 110, y);
    doc.text('Valor', 190, y, { align: 'right' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    dados.historico.forEach((item, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (i % 2 === 0) doc.setFillColor(247, 244, 239);
        else doc.setFillColor(255,255,255);
        doc.rect(14, y - 4, 182, 7, 'F');
        doc.setTextColor(80,80,80);
        doc.text(item.data || '—', 18, y);
        doc.text(item.categoria, 48, y);
        doc.text(item.fonte, 110, y);
        doc.setTextColor(180,60,40);
        doc.setFont('helvetica', 'bold');
        doc.text(`− ${formatBRL(item.valor)}`, 190, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 7;
    });

    if (dados.historico.length === 0) {
        doc.setTextColor(160,160,160);
        doc.text('Nenhum lançamento.', 18, y);
    }

    // Rodapé
    const totalPags = doc.getNumberOfPages();
    for (let p = 1; p <= totalPags; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(180,180,180);
        doc.text(`Carteira — Controle Mensal · Página ${p} de ${totalPags}`, 105, 290, { align: 'center' });
    }

    doc.save(`carteira_${new Date().toISOString().slice(0,7)}.pdf`);
}

// ========================
//  EXPORTAR EXCEL
// ========================

function exportarExcel() {
    const wb = XLSX.utils.book_new();

    // Aba de resumo
    const resumoData = [
        ['CARTEIRA — CONTROLE MENSAL', ''],
        ['Gerado em', new Date().toLocaleDateString('pt-BR')],
        [''],
        ['RESUMO FINANCEIRO', ''],
        ['Saldo em Conta', dados.salarioAtual],
        ['Vale Card', dados.valeAtual],
        ['Total Disponível', dados.salarioAtual + dados.valeAtual],
        ['Cofrinho', dados.cofrinhoTotal],
        [''],
        ['GASTOS POR CATEGORIA', ''],
    ];

    const resumoCat = {};
    dados.historico.forEach(item => {
        resumoCat[item.categoria] = (resumoCat[item.categoria] || 0) + item.valor;
    });
    Object.entries(resumoCat).sort((a,b) => b[1]-a[1]).forEach(([cat, val]) => {
        resumoData.push([cat, val]);
    });

    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    wsResumo['!cols'] = [{ wch: 28 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Aba de lançamentos
    const lancHeaders = [['Data', 'Categoria', 'Fonte', 'Valor (R$)']];
    const lancData = dados.historico.map(item => [
        item.data || '',
        item.categoria,
        item.fonte,
        item.valor
    ]);
    const wsLanc = XLSX.utils.aoa_to_sheet([...lancHeaders, ...lancData]);
    wsLanc['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsLanc, 'Lançamentos');

    XLSX.writeFile(wb, `carteira_${new Date().toISOString().slice(0,7)}.xlsx`);
}

// ========================
//  BACKUP JSON
// ========================

function exportarBackup() {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_carteira_${new Date().toISOString().slice(0,10)}.json`;
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
        reader.readAsText(file, 'UTF-8');
        reader.onload = ev => {
            try {
                dados = JSON.parse(ev.target.result);
                salvarDados();
                aplicarTema();
                atualizarTela();
                alert('Backup restaurado com sucesso! ✅');
            } catch {
                alert('Arquivo inválido. Formato incorreto.');
            }
        };
    };
    input.click();
}

// ========================
//  START
// ========================

carregarDados();
