const form = document.getElementById("formMateria");
const botaoSalvar = form.querySelector('button[type="submit"]');
const corpoTabela = document.getElementById("listaMaterias");
const campoPesquisa = document.getElementById("pesquisarMateria");
const filtroDificuldade = document.getElementById("filtroDificuldade");
const filtroPrioridade = document.getElementById("filtroPrioridade");

const nomesDificuldade = { dificil: "Difícil", medio: "Médio", facil: "Fácil" };
const nomesPrioridade = { alta: "Alta", media: "Média", baixa: "Baixa" };

const TEXTO_SALVAR = '<i class="bi bi-check-lg"></i> Salvar matéria';
const TEXTO_ATUALIZAR = '<i class="bi bi-check-lg"></i> Atualizar matéria';

let materias = [];
let editandoId = null;

// Evita que um texto digitado vire código HTML
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function desenharTabela() {
    const busca = campoPesquisa.value.toLowerCase();

    const filtradas = materias.filter(function (m) {
        const texto = (m.nome + " " + m.assunto).toLowerCase();
        return texto.includes(busca)
            && (!filtroDificuldade.value || m.dificuldade === filtroDificuldade.value)
            && (!filtroPrioridade.value || m.prioridade === filtroPrioridade.value);
    });

    if (filtradas.length === 0) {
        corpoTabela.innerHTML =
            '<tr><td colspan="6">Nenhuma matéria encontrada.</td></tr>';
    } else {
        corpoTabela.innerHTML = filtradas.map(function (m) {
            return `
                <tr>
                    <td>
                        <div class="materia-nome">
                            <div class="materia-icone"><i class="bi bi-book"></i></div>
                            <span>${escapar(m.nome)}</span>
                        </div>
                    </td>
                    <td>${escapar(m.assunto)}</td>
                    <td>
                        <span class="badge dificuldade-${escapar(m.dificuldade)}">
                            ${nomesDificuldade[m.dificuldade] || "-"}
                        </span>
                    </td>
                    <td>
                        <span class="badge prioridade-${escapar(m.prioridade)}">
                            ${nomesPrioridade[m.prioridade] || "-"}
                        </span>
                    </td>
                    <td>-</td>
                    <td>
                        <div class="acoes-tabela">
                            <button type="button" class="btn-acao"
                                    data-acao="editar" data-id="${m.id}"
                                    title="Editar matéria">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn-acao excluir"
                                    data-acao="excluir" data-id="${m.id}"
                                    title="Excluir matéria">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join("");
    }

    // Cartões de resumo (usam todas as matérias, sem filtro)
    document.getElementById("totalMaterias").textContent = materias.length;
    document.getElementById("totalPrioridadeAlta").textContent =
        materias.filter(m => m.prioridade === "alta").length;
}

async function carregarMaterias() {
    try {
        const resposta = await fetch("/api/materias");
        materias = await resposta.json();
        desenharTabela();
    } catch (erro) {
        console.error("Erro ao carregar matérias:", erro);
    }
}

// Volta o formulário para o modo "cadastrar"
function sairModoEdicao() {
    editandoId = null;
    botaoSalvar.innerHTML = TEXTO_SALVAR;
}

// Coloca os dados da matéria dentro do formulário
function iniciarEdicao(materia) {
    editandoId = materia.id;

    // Aceita tanto os nomes novos quanto os antigos dos campos
    const campoNome = form.elements["nome"] || form.elements["materia"];
    const campoDificuldade =
        form.elements["dificuldade"] || form.elements["nivel_dificuldade"];

    campoNome.value = materia.nome;
    form.elements["assunto"].value = materia.assunto;
    form.elements["material"].value = materia.material ?? "";
    form.elements["link_material"].value = materia.link_material ?? "";
    form.elements["prioridade"].value = materia.prioridade ?? "";
    form.elements["observacao"].value = materia.observacao ?? "";

    if (campoDificuldade) {
        campoDificuldade.value = materia.dificuldade;
    }

    botaoSalvar.innerHTML = TEXTO_ATUALIZAR;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function excluirMateria(materia) {
    const certeza = confirm(
        'Excluir a matéria "' + materia.nome + '" (' + materia.assunto + ')?'
    );

    if (!certeza) {
        return;
    }

    const resposta = await fetch("/api/materias/" + materia.id, {
        method: "DELETE"
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
        alert(resultado.erro);
        return;
    }

    // Se estava editando justamente essa matéria, cancela a edição
    if (editandoId === materia.id) {
        form.reset();
    }

    await carregarMaterias();
}

// Cliques nos botões de editar e excluir da tabela
corpoTabela.addEventListener("click", function (evento) {
    const botao = evento.target.closest("button[data-acao]");

    if (!botao) {
        return;
    }

    const id = Number(botao.dataset.id);
    const materia = materias.find(m => m.id === id);

    if (!materia) {
        return;
    }

    if (botao.dataset.acao === "editar") {
        iniciarEdicao(materia);
    } else if (botao.dataset.acao === "excluir") {
        excluirMateria(materia);
    }
});

// Botão "Limpar" também cancela a edição
form.addEventListener("reset", sairModoEdicao);

form.addEventListener("submit", async function (evento) {
    // Impede o envio padrão (que só recarrega a página)
    evento.preventDefault();

    const dados = Object.fromEntries(new FormData(form));

    const url = editandoId
        ? "/api/materias/" + editandoId
        : "/api/materias";

    const resposta = await fetch(url, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
        alert(resultado.erro);
        return;
    }

    const mensagem = editandoId
        ? "Matéria atualizada com sucesso!"
        : "Matéria cadastrada com sucesso!";

    form.reset();
    await carregarMaterias();
    alert(mensagem);
});

campoPesquisa.addEventListener("input", desenharTabela);
filtroDificuldade.addEventListener("change", desenharTabela);
filtroPrioridade.addEventListener("change", desenharTabela);

carregarMaterias();