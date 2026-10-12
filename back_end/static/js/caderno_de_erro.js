// =========================
// ELEMENTOS DA PÁGINA
// =========================
const form = document.getElementById("form_erro");
const selectMateria = document.getElementById("disciplina");
const listaAssuntos = document.getElementById("lista_assuntos");
const corpoTabela = document.getElementById("tabela_erros");
const listaMotivos = document.getElementById("lista_motivos");
const botoesFiltro = document.querySelectorAll(".filtros-erros .filtro");

// Nome e ícone de cada motivo (os mesmos valores do formulário)
const MOTIVOS = {
    nao_sabia:     { nome: "Não sabia",       icone: "bi-question-circle" },
    esqueci:       { nome: "Esqueci",         icone: "bi-clock-history" },
    interpretacao: { nome: "Interpretação",   icone: "bi-book-half" },
    desatencao:    { nome: "Desatenção",      icone: "bi-eye" },
    confusao:      { nome: "Confusão",        icone: "bi-shuffle" },
    calculo:       { nome: "Erro de cálculo", icone: "bi-calculator" },
    chute:         { nome: "Chute",           icone: "bi-dice-5" }
};

let materias = [];
let erros = [];
let filtroAtual = "todos";

// Evita que um texto digitado vire código HTML
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function infoMotivo(chave) {
    return MOTIVOS[chave] || { nome: chave, icone: "bi-question-circle" };
}

// =========================
// MATÉRIAS DO BANCO
// =========================
async function carregarMaterias() {
    try {
        const resposta = await fetch("/api/materias");
        materias = await resposta.json();
    } catch (erro) {
        console.error("Erro ao carregar matérias:", erro);
        return;
    }

    // Uma matéria pode ter vários assuntos: mostra cada nome uma vez só
    const nomes = [...new Set(materias.map(m => m.nome))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));

    selectMateria.innerHTML = "";

    if (nomes.length === 0) {
        selectMateria.add(new Option("Nenhuma matéria cadastrada", ""));
        return;
    }

    selectMateria.add(new Option("Selecione uma matéria", ""));
    nomes.forEach(nome => selectMateria.add(new Option(nome, nome)));
}

// Ao escolher a matéria, sugere os assuntos dela
selectMateria.addEventListener("change", function () {
    listaAssuntos.innerHTML = "";

    const assuntos = [...new Set(
        materias
            .filter(m => m.nome === selectMateria.value)
            .map(m => m.assunto)
    )];

    assuntos.forEach(assunto => {
        const opcao = document.createElement("option");
        opcao.value = assunto;
        listaAssuntos.appendChild(opcao);
    });
});

// =========================
// TELA
// =========================
function formatarData(criadoEm) {
    // O banco guarda a hora em UTC; aqui vira a data local
    return new Date(criadoEm.replace(" ", "T") + "Z")
        .toLocaleDateString("pt-BR");
}

function desenharTabela() {
    const lista = filtroAtual === "revisar"
        ? erros.filter(e => e.para_revisar === 1)
        : erros;

    if (lista.length === 0) {
        corpoTabela.innerHTML =
            '<tr><td colspan="5">Nenhum erro encontrado.</td></tr>';
        return;
    }

    corpoTabela.innerHTML = lista.map(function (e) {
        const motivo = infoMotivo(e.motivo);

        const revisar = e.para_revisar === 1
            ? '<span class="badge-revisao"><i class="bi bi-arrow-repeat"></i> Sim</span>'
            : '<span class="badge-nao">Não</span>';

        return `
            <tr>
                <td>${formatarData(e.criado_em)}</td>
                <td>${escapar(e.materia)}</td>
                <td>${escapar(e.assunto)}</td>
                <td>
                    <span class="badge-motivo">
                        <i class="bi ${motivo.icone}"></i>
                        ${motivo.nome}
                    </span>
                </td>
                <td>${revisar}</td>
            </tr>`;
    }).join("");
}

function desenharResumo() {
    // Conta quantos erros existem por motivo
    const contagem = {};

    erros.forEach(function (e) {
        contagem[e.motivo] = (contagem[e.motivo] || 0) + 1;
    });

    const ordenados = Object.entries(contagem).sort((a, b) => b[1] - a[1]);

    // Cartões do topo
    document.getElementById("total_erros").textContent = erros.length;
    document.getElementById("total_revisoes").textContent =
        erros.filter(e => e.para_revisar === 1).length;
    document.getElementById("motivo_principal").textContent =
        ordenados.length > 0 ? infoMotivo(ordenados[0][0]).nome : "-";

    // Barras dos motivos mais frequentes
    if (ordenados.length === 0) {
        listaMotivos.innerHTML = "<p>Nenhum erro registrado ainda.</p>";
        return;
    }

    const maior = ordenados[0][1];

    listaMotivos.innerHTML = ordenados.map(function (item) {
        const motivo = infoMotivo(item[0]);
        const largura = Math.round((item[1] / maior) * 100);

        return `
            <div class="linha-motivo">
                <div class="motivo-info">
                    <span>
                        <i class="bi ${motivo.icone}"></i>
                        ${motivo.nome}
                    </span>
                    <strong>${item[1]}</strong>
                </div>
                <div class="barra">
                    <div class="barra-progresso" style="width:${largura}%"></div>
                </div>
            </div>`;
    }).join("");
}

async function carregarErros() {
    try {
        const resposta = await fetch("/api/erros");
        erros = await resposta.json();
        desenharTabela();
        desenharResumo();
    } catch (erro) {
        console.error("Erro ao carregar erros:", erro);
    }
}

// =========================
// FILTROS
// =========================
botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {
        filtroAtual = botao.dataset.filtro;

        botoesFiltro.forEach(b => b.classList.remove("ativo"));
        botao.classList.add("ativo");

        desenharTabela();
    });
});

// =========================
// SALVAR ERRO
// =========================
form.addEventListener("submit", async function (evento) {
    // Impede o envio padrão (que só recarrega a página)
    evento.preventDefault();

    const motivoEscolhido = form.querySelector('input[name="motivo_erro"]:checked');

    const dados = {
        questao: document.getElementById("questao").value,
        materia: selectMateria.value,
        assunto: document.getElementById("assunto").value,
        motivo: motivoEscolhido ? motivoEscolhido.value : "",
        resposta_correta: document.getElementById("resposta_correta").value,
        observacao: document.getElementById("observacao_erro").value,
        para_revisar: document.getElementById("adicionar_revisao").checked
    };

    const resposta = await fetch("/api/erros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
        alert(resultado.erro);
        return;
    }

    form.reset();
    listaAssuntos.innerHTML = "";

    await carregarErros();
    alert("Erro registrado com sucesso!");
});

carregarMaterias();
carregarErros();