// =========================
// ELEMENTOS DA PÁGINA
// =========================
const listaRevisoes = document.getElementById("lista_revisoes");
const filtroRevisoes = document.getElementById("filtro_revisoes");
const tabelaProximas = document.getElementById("tabela_proximas");
const modal = document.getElementById("escolher_modo_revisao");
 
let grupos = [];            // assuntos com questões pendentes
let grupoEscolhido = null;  // assunto escolhido em "Iniciar revisão"
 
// Evita que um texto digitado vire código HTML
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}
 
// Data guardada pelo banco (UTC) -> data local
function formatarData(criadoEm) {
    return new Date(criadoEm.replace(" ", "T") + "Z")
        .toLocaleDateString("pt-BR");
}
 
// "2026-10-14" -> "14/10/2026"
function formatarDataIso(iso) {
    const partes = iso.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}
 
function textoEtapa(g) {
    return "R" + g.etapa + " • " + g.intervalo +
        (g.intervalo === 1 ? " dia" : " dias");
}
 
// Situação da revisão: atrasada, hoje, prioridade alta ou futura
function situacao(g) {
    if (g.dias < 0) {
        return { classe: "alta", texto: "Atrasada" };
    }
 
    if (g.dias === 0) {
        return { classe: "hoje", texto: "Hoje" };
    }
 
    if (g.prioridade === "alta") {
        return { classe: "alta", texto: "Prioridade alta" };
    }
 
    return {
        classe: "",
        texto: g.dias === 1 ? "Amanhã" : "Em " + g.dias + " dias"
    };
}
 
// =========================
// CARDS
// =========================
function desenharCards() {
    const filtro = filtroRevisoes.value;
 
    const visiveis = grupos.filter(function (g) {
        if (filtro === "alta") return g.prioridade === "alta";
        if (filtro === "hoje") return g.dias === 0;
        if (filtro === "atrasadas") return g.dias < 0;
        return true;
    });
 
    if (visiveis.length === 0) {
        listaRevisoes.innerHTML = `
            <p>
                Nenhuma revisão para mostrar. Marque erros com
                "Adicionar às revisões" no
                <a href="caderno_de_questos.html">Caderno de Erros</a>.
            </p>`;
        return;
    }
 
    listaRevisoes.innerHTML = visiveis.map(function (g) {
        const indice = grupos.indexOf(g);
        const sit = situacao(g);
 
        const desempenho = g.respondidas > 0
            ? Math.round((g.acertos / g.respondidas) * 100) + "%"
            : "-";
 
        const ultima = g.ultima ? formatarData(g.ultima) : "Nunca";
        const palavra = g.pendentes === 1 ? "questão" : "questões";
 
        return `
            <article class="card-revisao ${g.prioridade === "alta" ? "prioridade-alta" : ""}">
 
                <div class="card-revisao-topo">
 
                    <span class="badge-materia">
                        ${escapar(g.materia)}
                    </span>
 
                    <span class="badge-prioridade ${sit.classe}">
                        ${sit.texto}
                    </span>
 
                </div>
 
                <h3>
                    ${escapar(g.assunto)}
                </h3>
 
                <p class="descricao-revisao">
                    ${g.pendentes} ${palavra} para revisar.
                    Teste novamente seus conhecimentos.
                </p>
 
                <div class="dados-revisao">
 
                    <div>
                        <span>Etapa</span>
                        <strong>${textoEtapa(g)}</strong>
                    </div>
 
                    <div>
                        <span>Desempenho</span>
                        <strong>${desempenho}</strong>
                    </div>
 
                    <div>
                        <span>Última revisão</span>
                        <strong>${ultima}</strong>
                    </div>
 
                </div>
 
                <div class="acoes-revisao">
 
                    <a href="caderno_de_questos.html" class="btn-secundario">
                        Ver erros
                    </a>
 
                    <button
                        type="button"
                        class="btn-iniciar-revisao"
                        data-indice="${indice}"
                    >
                        Iniciar revisão
                    </button>
 
                </div>
 
            </article>`;
    }).join("");
}
 
// =========================
// PRÓXIMAS REVISÕES
// =========================
function desenharProximas() {
    const futuras = grupos.filter(g => g.dias > 0).slice(0, 10);
 
    if (futuras.length === 0) {
        tabelaProximas.innerHTML =
            '<tr><td colspan="5">Nenhuma revisão programada.</td></tr>';
        return;
    }
 
    tabelaProximas.innerHTML = futuras.map(function (g) {
        return `
            <tr>
                <td>${formatarDataIso(g.vence)}</td>
                <td>${escapar(g.materia)}</td>
                <td>${escapar(g.assunto)}</td>
                <td>R${g.etapa}</td>
                <td>
                    <span class="status-revisao">
                        Programada
                    </span>
                </td>
            </tr>`;
    }).join("");
}
 
// =========================
// CARREGAR DADOS DO BANCO
// =========================
async function carregarResumo() {
    try {
        const resposta = await fetch("/api/revisoes/resumo");
        const dados = await resposta.json();
 
        document.getElementById("total_hoje").textContent = dados.para_hoje;
        document.getElementById("total_atrasadas").textContent = dados.atrasadas;
        document.getElementById("total_semana").textContent = dados.esta_semana;
        document.getElementById("total_concluidas").textContent = dados.concluidas;
 
        grupos = dados.grupos;
 
        desenharCards();
        desenharProximas();
    } catch (erro) {
        console.error("Erro ao carregar revisões:", erro);
    }
}
 
filtroRevisoes.addEventListener("change", desenharCards);
 
// =========================
// MODAL: ESCOLHER O MODO
// =========================
function fecharModal() {
    modal.classList.add("oculto");
    grupoEscolhido = null;
}
 
// Clique em "Iniciar revisão": abre a janela de modos
listaRevisoes.addEventListener("click", function (evento) {
    const botao = evento.target.closest(".btn-iniciar-revisao");
 
    if (!botao) {
        return;
    }
 
    grupoEscolhido = grupos[Number(botao.dataset.indice)];
 
    if (grupoEscolhido) {
        modal.classList.remove("oculto");
    }
});
 
// Clique em um dos modos: abre a página das questões
modal.addEventListener("click", function (evento) {
    // Clicou no fundo escuro (fora da janela)
    if (evento.target === modal) {
        fecharModal();
        return;
    }
 
    const botao = evento.target.closest(".modo-revisao");
 
    if (!botao || !grupoEscolhido) {
        return;
    }
 
    const parametros = new URLSearchParams({
        materia: grupoEscolhido.materia,
        assunto: grupoEscolhido.assunto,
        quantidade: botao.dataset.quantidade,
        modo: botao.dataset.modo
    });
 
    window.location.href = "/revisao_questoes.html?" + parametros.toString();
});
 
document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
        fecharModal();
    }
});
 
carregarResumo();
 