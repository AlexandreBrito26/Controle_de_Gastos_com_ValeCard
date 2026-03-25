# 💰 HUD Financeiro Pro

Um dashboard financeiro pessoal ultra compacto e gamificado, construído com **HTML, CSS e Vanilla JavaScript**. 

O objetivo deste projeto é ir além de uma simples planilha de gastos, atuando como um "assistente de sobrevivência mensal". Ele calcula seu orçamento diário, cria travas de segurança para você não ficar no vermelho e incentiva o hábito de poupar através de metas visuais.

![Print do Projeto - Tema Escuro](link-da-sua-imagem-dark.png)
*(Coloque aqui uma imagem do seu projeto rodando)*

## ✨ Funcionalidades

- **🔒 Trava de Sobrevivência (Bloqueio Inteligente):** Se o saldo da Conta Corrente cair abaixo de um limite crítico (ex: R$ 400), o sistema emite um alerta e bloqueia novas saídas da conta, forçando o usuário a usar apenas o Vale Alimentação.
- **🎯 Orçamento Diário Dinâmico:** Calcula automaticamente o valor exato que você pode gastar no dia de hoje para que o dinheiro dure até o último dia do mês.
- **🐷 Cofrinho Gamificado ("Pague-se Primeiro"):** Ao iniciar o mês, o app incentiva a separar um valor para poupar antes de começar a gastar. Possui barra de progresso baseada em metas.
- **📊 Gráficos Interativos:** Resumo visual de gastos por categoria (Moradia, Mercado, Lazer, etc) gerado automaticamente via `Chart.js`.
- **💾 Persistência de Dados Local:** Salva tudo no navegador usando `localStorage`. Pode ser usado offline.
- **📦 Importação e Exportação de Backup:** Baixe seus dados em formato `.json` para não perder o histórico se trocar de dispositivo.
- **🌓 Temas Light e Dark Mode:** Alteração de cores dinâmica com salvamento de preferência.

## 🛠️ Tecnologias Utilizadas

- **HTML5** (Estrutura semântica)
- **CSS3** (Variáveis CSS, CSS Grid, Flexbox, Mobile First)
- **JavaScript (ES6+)** (Manipulação de DOM, LocalStorage, Lógica matemática)
- **Chart.js** (Biblioteca para renderização do gráfico de rosca)

## 🚀 Como Executar o Projeto

Este projeto é 100% Front-end e não requer instalação de pacotes ou servidores para rodar localmente.

1. Clone este repositório:
   ```bash
   git clone [https://github.com/SEU-USUARIO/hud-financeiro.git](https://github.com/SEU-USUARIO/hud-financeiro.git)
