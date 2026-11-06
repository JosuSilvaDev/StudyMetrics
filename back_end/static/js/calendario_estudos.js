
let sessoesCalendario = [];
let mesExibido = new Date();
let diaSelecionado = null;

const nomesMeses = [
    "Janeiro", "Fevereiro", "Março",
    "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro",
    "Outubro", "Novembro", "Dezembro"
];

function chaveData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function converterDataUTC(valor) {
    return new Date(valor.replace(" ", "T") + "Z");
}

function formatarTempo(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);

    return `${h}h ${String(m).padStart(2, "0")}min`;
}

function formatarTempoCurto(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);

    if (h > 0) {
        return `${h}h${String(m).padStart(2, "0")}`;
    }

    return `${m}min`;
}

function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}


// AGRUPAR SESSÕES POR DIA
function agruparSessoes() {
    const grupos = {};

    sessoesCalendario.forEach(sessao => {
        const data = converterDataUTC(sessao.criado_em);
        const chave = chaveData(data);

        if (!grupos[chave]) {
            grupos[chave] = [];
        }

        grupos[chave].push(sessao);
    });

    return grupos;
}


// CARREGAR DADOS DO BANCO
async function carregarCalendario() {

    const ano = mesExibido.getFullYear();
    const mes = String(mesExibido.getMonth() + 1).padStart(2, "0");

    try {
        const resposta = await fetch(
            `/api/calendario-estudos?mes=${ano}-${mes}`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao buscar sessões.");
        }

        sessoesCalendario = await resposta.json();

        const grupos = agruparSessoes();

        atualizarResumo(grupos);
        montarCalendario(grupos);

        if (diaSelecionado &&
            diaSelecionado.startsWith(`${ano}-${mes}`)) {
            mostrarDetalhes(diaSelecionado, grupos);
        } else {
            const hoje = chaveData(new Date());

            diaSelecionado = hoje.startsWith(`${ano}-${mes}`)
                ? hoje
                : null;

            if (diaSelecionado) {
                mostrarDetalhes(diaSelecionado, grupos);
            } else {
                limparDetalhes();
            }
        }

    } catch (erro) {
        console.error("Erro no calendário:", erro);

        document.getElementById("grade_calendario").innerHTML =
            '<p class="cal-vazio">Não foi possível carregar o calendário.</p>';
    }
}


// RESUMO MENSAL
function atualizarResumo(grupos) {

    let totalSegundos = 0;
    const dias = Object.keys(grupos);

    dias.forEach(dia => {
        grupos[dia].forEach(sessao => {
            totalSegundos += Number(sessao.tempo_segundos) || 0;
        });
    });

    const quantidadeDias = dias.length;

    const media = quantidadeDias > 0
        ? Math.floor(totalSegundos / quantidadeDias)
        : 0;

    document.getElementById("total_mes").textContent =
        formatarTempo(totalSegundos);

    document.getElementById("dias_estudados").textContent =
        `${quantidadeDias} ${quantidadeDias === 1 ? "dia" : "dias"}`;

    document.getElementById("media_diaria").textContent =
        formatarTempo(media);
}


// MONTAR CALENDÁRIO
function montarCalendario(grupos) {

    const ano = mesExibido.getFullYear();
    const mes = mesExibido.getMonth();

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const quantidadeDias = new Date(ano, mes + 1, 0).getDate();

    const hoje = chaveData(new Date());

    document.getElementById("mes_atual").textContent =
        `${nomesMeses[mes]} ${ano}`;

    const grade = document.getElementById("grade_calendario");

    let html = "";

    for (let i = 0; i < primeiroDia; i++) {
        html += '<div class="cal-dia vazio"></div>';
    }

    for (let dia = 1; dia <= quantidadeDias; dia++) {

        const data = new Date(ano, mes, dia);
        const chave = chaveData(data);

        const sessoes = grupos[chave] || [];

        const total = sessoes.reduce((soma, sessao) => {
            return soma + (Number(sessao.tempo_segundos) || 0);
        }, 0);

        const classes = ["cal-dia"];

        if (total > 0) classes.push("estudado");
        if (chave === diaSelecionado) classes.push("selecionado");
        if (chave === hoje) classes.push("hoje");

        html += `
            <button
                type="button"
                class="${classes.join(" ")}"
                data-dia="${chave}"
                aria-label="${dia}, ${formatarTempo(total)}"
            >
                <span class="cal-dia-numero">${dia}</span>

                ${total > 0
                    ? `<span class="cal-dia-tempo">${formatarTempoCurto(total)}</span>`
                    : ""}
            </button>
        `;
    }

    grade.innerHTML = html;

    grade.querySelectorAll("[data-dia]").forEach(botao => {
        botao.addEventListener("click", () => {

            diaSelecionado = botao.dataset.dia;

            montarCalendario(grupos);
            mostrarDetalhes(diaSelecionado, grupos);

        });
    });
}


// DETALHES DO DIA
function mostrarDetalhes(chave, grupos) {

    const sessoes = grupos[chave] || [];

    const [ano, mes, dia] = chave.split("-").map(Number);

    const data = new Date(ano, mes - 1, dia);

    document.getElementById("titulo_dia").textContent =
        data.toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    document.getElementById("subtitulo_dia").textContent =
        sessoes.length > 0
            ? `${sessoes.length} sessão(ões) registrada(s)`
            : "Nenhuma sessão registrada neste dia.";

    const total = sessoes.reduce((soma, sessao) => {
        return soma + (Number(sessao.tempo_segundos) || 0);
    }, 0);

    document.getElementById("tempo_dia").textContent =
        formatarTempo(total);

    const lista = document.getElementById("lista_sessoes");

    if (sessoes.length === 0) {
        lista.innerHTML = `
            <p class="cal-vazio">
                Nenhuma sessão registrada nesta data.
            </p>
        `;
        return;
    }

    lista.innerHTML = sessoes.map(sessao => `
        <article class="cal-sessao">

            <div>
                <h3>${escapar(sessao.materia)}</h3>

                <p>${escapar(sessao.assunto)}</p>

                <p>
                    ${Number(sessao.questoes_realizadas) || 0}
                    questões |
                    ${Number(sessao.acertos) || 0}
                    acertos
                </p>
            </div>

            <span class="cal-sessao-tempo">
                ${formatarTempo(Number(sessao.tempo_segundos) || 0)}
            </span>

        </article>
    `).join("");
}


// LIMPAR DETALHES
function limparDetalhes() {

    document.getElementById("titulo_dia").textContent =
        "Detalhes do dia";

    document.getElementById("subtitulo_dia").textContent =
        "Selecione uma data no calendário.";

    document.getElementById("tempo_dia").textContent =
        "0h 00min";

    document.getElementById("lista_sessoes").innerHTML = `
        <p class="cal-vazio">
            Selecione uma data para visualizar suas sessões.
        </p>
    `;
}


// NAVEGAÇÃO ENTRE MESES
document.getElementById("mes_anterior").addEventListener("click", () => {

    mesExibido = new Date(
        mesExibido.getFullYear(),
        mesExibido.getMonth() - 1,
        1
    );

    diaSelecionado = null;

    carregarCalendario();
});


document.getElementById("mes_proximo").addEventListener("click", () => {

    mesExibido = new Date(
        mesExibido.getFullYear(),
        mesExibido.getMonth() + 1,
        1
    );

    diaSelecionado = null;

    carregarCalendario();
});


// INICIAR
carregarCalendario();
