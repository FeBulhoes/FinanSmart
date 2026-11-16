# FinanSmart

Aplicação web de controle financeiro pessoal desenvolvida para um projeto acadêmico de Front-end.
(Inicie através do Live Server)

## Tecnologias
- HTML5
- CSS3 com layout responsivo
- JavaScript
- Canvas API para gráfico de fluxo financeiro

## Funcionalidades
- Dashboard com saldo, receitas e despesas
- Cadastro, edição e exclusão de transações
- Validação de formulários
- Pesquisa e filtros por tipo e categoria
- Relatórios com distribuição de despesas
- Gráficos atualizados conforme as transações
- Navegação entre seções
- Layout adaptável para desktop, tablet e celular

## Como executar
1. Baixe ou clone este repositório
2. Abra a pasta no Visual Studio Code
3. Inicie um servidor local pela extensão Live Server
4. Abra `index.html` pelo servidor local

> O sistema inicia sem transações cadastradas. As movimentações adicionadas ficam apenas em memória durante a execução; ao recarregar a página, elas são apagadas. Não contém vínculo com banco de dados.

## Estrutura
```text
FinanSmart/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── data.js
│   ├── dashboard.js
│   └── transactions.js
│
└── README.md
```
