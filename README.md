# StudyMetrics

📊 **Sistema de controle de métricas de estudos.** O StudyMetrics ajuda você a enxergar sua evolução de verdade: em vez de estudar "no escuro", você acompanha números reais da sua rotina e descobre onde precisa melhorar.

## 🎯 Para que serve?

Com um dashboard interativo, você acompanha:

- **Constância de estudo:** quantos dias seguidos você estudou
- **Questões desenvolvidas:** quantas questões você já resolveu
- **Tempo de estudo:** quanto tempo você dedica a cada matéria
- **Revisões:** o que já foi revisado e o que está pendente

Assim, você tem mais noção do seu desenvolvimento.

## 🧩 Páginas do projeto

Cada parte do estudo tem sua própria página.

### 📈 Dashboard

Mostra as métricas principais: constância, questões, tempo de estudo e revisões. Também exibe a contagem regressiva até a data da sua meta e uma frase do dia, de acordo com o tipo de motivação escolhido no perfil.

### 📅 Sessão de estudo

Registre cada sessão com um cronômetro: matéria, tempo estudado e, no final, as questões feitas e acertadas. Ao atingir o tempo planejado, o cronômetro toca um alarme. O calendário marca as matérias estudadas em cada dia.

*Exemplo: "Matemática – 1h30 – hoje".*

### 📚 Matérias

Aqui você cadastra **apenas as matérias importantes** que está estudando no momento. Isso evita o excesso de matérias (overdose) e mantém seu foco. Dá para cadastrar, listar, editar e excluir.

### ❌ Caderno de Erros

Você cadastra **somente as questões que errou**, porque a ciência mostra que aprendemos mais com os erros do que com os acertos. Cada erro recebe uma **categoria**, para você descobrir o principal motivo dos seus erros em cada matéria. Exemplos:

- Falta de atenção
- Não sabia o conteúdo
- Erro de cálculo
- Interpretação errada

Essas mesmas questões vão para a página de Revisões.

### 🔁 Revisões

Mostra o que revisar: **Para hoje**, **Atrasadas**, **Esta semana** e **Concluídas**, em etapas R1, R2 e R3, com a tabela de próximas revisões. As questões são respondidas em uma página própria de revisão.

### 👤 Perfil

Dados cadastrais com foto de perfil, a data da meta (que vira contagem regressiva no Dashboard) e o tipo de motivação: Disciplina, Foco, Persistência, Evolução ou Constância.

## 🔁 Revisão em 3 níveis

As questões que você errou entram em um sistema de revisão com **3 níveis**, de acordo com o tempo e a energia que você tem no dia:

| Nível | Duração | Quando usar |
|-------|---------|-------------|
| ⚡ **Rápido** | 30 min | Dia sem vontade de estudar. Você faz uma revisão curta e **não perde a constância** |
| 📘 **Normal** | 60 min | Dia comum de estudo |
| 🎯 **Longo** | 90 min | Dia com mais disposição, para revisar a fundo |

💡 **Exemplo:** chegou em casa cansado? Faça só a revisão rápida de 30 minutos. O dia conta como estudado e sua sequência continua.

## 💾 Salvando sua evolução

Tudo o que você faz é registrado automaticamente no **banco de dados**: sessões, questões erradas, revisões feitas e dias de constância. O dashboard atualiza sozinho e guarda **toda a sua evolução**, para você acompanhar seu progresso com o tempo.

## 🛠️ Tecnologias

Tecnologias usadas no projeto:

- Front-end: HTML, CSS e JavaScript
- Back-end: Python (Flask)
- Banco de dados: SQLite

## 📌 Próximos passos

- [x] Lógica em Python (Flask) e dados salvos no banco
- [x] Matérias, Sessão de estudo e Caderno de Erros ligados ao banco
- [ ] Finalizar a página de Revisões (lista e resposta das questões)
- [ ] Criar gráficos de evolução
- [ ] Criar paginas mais otimizada
- [ ] Subir para web

## 🚀 Como usar

1. Clone o repositório.
2. Instale o Flask: `pip install flask`.
3. Rode o servidor: `python back_end/app.py`.
4. Abra no navegador o endereço que aparecer no terminal (normalmente `http://127.0.0.1:5000`).

## 📁 Principais arquivos

- `back_end/app.py`: rotas do Flask e API (por exemplo `/api/materias` e `/api/sessoes`)
- `database.py`: funções do banco (`init_db`, `get_db`)
- `database/studymetrics.db`: banco SQLite com todas as tabelas
- `static/style.css` e `static/js/`: estilo e scripts das páginas
- Páginas: `index.html`, `materias.html`, `sessao.html`, `questao.html`, `revisoes.html`, `perfil.html`
