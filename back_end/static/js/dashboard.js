// =========================================================
// DASHBOARD: busca os dados em /api/dashboard e desenha a página
// =========================================================
 
const el = id => document.getElementById(id);
 
// Nome de cada motivo de erro (mesmos valores do Caderno de Erros)
const MOTIVOS = {
    nao_sabia: "Não sabia",
    esqueci: "Esqueci",
    interpretacao: "Interpretação",
    desatencao: "Desatenção",
    confusao: "Confusão",
    calculo: "Erro de cálculo",
    chute: "Chute"
};
 
const VERDE = "#1ae163";
const AMARELO = "#f59e0b";
const VERMELHO = "#ef4444";
const AZUL = "#3b82f6";
const MARCA = "#2dd4bf";
 
let dados = null;
let graficoHoras = null;
let graficoAproveitamento = null;
 
// =========================
// ESTILOS DOS ITENS DAS LISTAS
// (funcionam no tema claro e no escuro)
// =========================
function adicionarEstilos() {
    const estilo = document.createElement("style");
 
    estilo.textContent = `
        .dx-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 14px;
            border-radius: 16px;
            background: rgba(127, 127, 127, 0.07);
            border: 1px solid rgba(127, 127, 127, 0.18);
            color: inherit;
            text-decoration: none;
        }
        .dx-item + .dx-item { margin-top: 10px; }
        a.dx-item:hover { border-color: var(--dx-cor); }
        .dx-icone {
            display: grid;
            place-items: center;
            flex-shrink: 0;
            width: 42px;
            height: 42px;
            border-radius: 12px;
            font-size: 1.1rem;
            background: color-mix(in srgb, var(--dx-cor) 16%, transparent);
            color: var(--dx-cor);
        }
        .dx-texto { flex: 1; min-width: 0; }
        .dx-texto strong {
            display: block;
            overflow: hidden;
            font-size: 0.92rem;
            font-weight: 600;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .dx-texto small {
            display: block;
            margin-top: 2px;
            font-size: 0.8rem;
            opacity: 0.7;
        }
        .dx-selo {
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            white-space: nowrap;
            background: color-mix(in srgb, var(--dx-cor) 16%, transparent);
            color: var(--dx-cor);
        }
        .dx-hora {
            font-size: 0.78rem;
            white-space: nowrap;
            opacity: 0.65;
        }
    `;
 
    document.head.appendChild(estilo);
}
 
// =========================
// FUNÇÕES AUXILIARES
// =========================
// Evita que um texto digitado vire código HTML
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}
 
// 5400 -> "1h 30min"
function formatarTempo(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
 
    return h + "h " + String(m).padStart(2, "0") + "min";
}
 
// 5400 -> "1h30" | 1800 -> "30min"
function formatarTempoCurto(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
 
    if (h > 0) {
        return h + "h" + String(m).padStart(2, "0");
    }
 
    return m + "min";
}
 
function tempoRelativo(criadoEm) {
    // O banco guarda a hora em UTC
    const momento = new Date(criadoEm.replace(" ", "T") + "Z");
    const minutos = Math.floor((Date.now() - momento.getTime()) / 60000);
 
    if (minutos < 1) return "agora";
    if (minutos < 60) return "há " + minutos + " min";
 
    const horas = Math.floor(minutos / 60);
 
    if (horas < 24) return "há " + horas + " h";
 
    const dias = Math.floor(horas / 24);
 
    if (dias === 1) return "ontem";
    if (dias < 7) return "há " + dias + " dias";
 
    return momento.toLocaleDateString("pt-BR");
}
 
function corDesempenho(pct) {
    if (pct === null) return "rgba(127, 127, 127, 0.4)";
    if (pct >= 80) return VERDE;
    if (pct >= 60) return AMARELO;
 
    return VERMELHO;
}
 
// =========================
// TOPO: DATA E MÉTRICAS
// =========================
function mostrarData() {
    const texto = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
 
    el("data_atual").textContent =
        texto.charAt(0).toUpperCase() + texto.slice(1);
}
 
function mostrarMetricas() {
    el("total_tempo").textContent = formatarTempo(dados.tempo_semana);
    el("total_questoes").textContent = dados.questoes_semana;
    el("media_aproveitamento").textContent = dados.aproveitamento + "%";
    el("total_erros_dashboard").textContent = dados.total_erros;
    el("donut_porcentagem").textContent = dados.aproveitamento + "%";
}
 
// =========================
// GRÁFICOS
// =========================
// Garante que o gráfico tenha uma área com altura para se desenhar
function prepararArea(canvas, altura) {
    const pai = canvas.parentElement;
 
    if (getComputedStyle(pai).position === "static") {
        pai.style.position = "relative";
    }
 
    if (pai.getBoundingClientRect().height <= 160) {
        pai.style.height = altura + "px";
    }
}
 
function rotuloDia(iso, periodo) {
    const data = new Date(iso + "T00:00:00");
 
    if (periodo <= 7) {
        const dia = data.toLocaleDateString("pt-BR", { weekday: "short" });
        return (dia.charAt(0).toUpperCase() + dia.slice(1)).replace(".", "");
    }
 
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
 
function corDaLegenda(seletor, padrao) {
    const elemento = document.querySelector(seletor);
 
    if (!elemento) {
        return padrao;
    }
 
    const cor = getComputedStyle(elemento).backgroundColor;
 
    if (!cor || cor === "transparent" || cor === "rgba(0, 0, 0, 0)") {
        return padrao;
    }
 
    return cor;
}
 
function desenharGraficoHoras() {
    if (typeof Chart === "undefined") {
        return;
    }
 
    const canvas = el("grafico_horas");
    const periodo = Number(el("periodo_grafico").value) || 7;
    const pontos = dados.grafico_horas.slice(-periodo);
 
    const rotulos = pontos.map(p => rotuloDia(p.data, periodo));
    const horas = pontos.map(p => Math.round(p.segundos / 36) / 100);
 
    if (graficoHoras) {
        graficoHoras.destroy();
    }
 
    prepararArea(canvas, 300);
 
    graficoHoras = new Chart(canvas, {
        type: "bar",
        data: {
            labels: rotulos,
            datasets: [{
                label: "Horas estudadas",
                data: horas,
                backgroundColor: MARCA,
                borderRadius: 8,
                maxBarThickness: 36
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: contexto =>
                            " " + formatarTempoCurto(pontos[contexto.dataIndex].segundos)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: valor => valor + "h" },
                    grid: { color: "rgba(127, 127, 127, 0.18)" }
                },
                x: { grid: { display: false } }
            }
        }
    });
}
 
function desenharGraficoAproveitamento() {
    if (typeof Chart === "undefined") {
        return;
    }
 
    const canvas = el("grafico_aproveitamento");
    const acertos = dados.total_acertos;
    const erros = dados.total_questoes - dados.total_acertos;
    const semDados = dados.total_questoes === 0;
 
    if (graficoAproveitamento) {
        graficoAproveitamento.destroy();
    }
 
    prepararArea(canvas, 240);
 
    graficoAproveitamento = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Acertos", "Erros"],
            datasets: [{
                data: semDados ? [1] : [acertos, erros],
                backgroundColor: semDados
                    ? ["rgba(127, 127, 127, 0.25)"]
                    : [
                        corDaLegenda(".legenda-circulo.acertos", VERDE),
                        corDaLegenda(".legenda-circulo.erros", VERMELHO)
                    ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            plugins: {
                legend: { display: false },
                tooltip: { enabled: !semDados }
            }
        }
    });
}
 
// =========================
// DESEMPENHO POR MATÉRIA
// =========================
function desenharMaterias() {
    const caixa = el("lista_desempenho_materias");
    const lista = dados.desempenho_materias;
 
    if (lista.length === 0) {
        caixa.innerHTML = `
            <div class="dashboard-vazio">
                <i class="bi bi-journal-bookmark"></i>
                <p>Cadastre matérias para ver o desempenho.</p>
            </div>`;
        return;
    }
 
    caixa.innerHTML = lista.map(function (m) {
        const pct = m.aproveitamento;
        const largura = pct === null ? 0 : pct;
        const texto = pct === null ? "sem dados" : pct + "%";
 
        return `
            <div class="materia-desempenho">
                <div class="materia-info">
                    <span>${escapar(m.materia)}</span>
                    <strong>${texto}</strong>
                </div>
                <div class="materia-barra">
                    <div class="materia-progresso"
                         style="width:${largura}%; background:${corDesempenho(pct)}"></div>
                </div>
            </div>`;
    }).join("");
}
 
// =========================
// PRECISA DE ATENÇÃO
// =========================
function desenharAtencao() {
    const caixa = el("lista_atencao");
    const lista = dados.atencao;
 
    if (lista.length === 0) {
        caixa.innerHTML = `
            <div class="atencao-vazia">
                <i class="bi bi-check-circle"></i>
                <div>
                    <strong>Nenhum alerta ainda</strong>
                    <span>Seus dados aparecerão aqui conforme você estudar.</span>
                </div>
            </div>`;
        return;
    }
 
    caixa.innerHTML = lista.map(function (a) {
        const grave = a.erros >= 3 ||
            (a.aproveitamento !== null && a.aproveitamento < 50);
 
        const cor = grave ? VERMELHO : AMARELO;
 
        const partes = [];
 
        if (a.erros > 0) {
            partes.push(a.erros + (a.erros === 1 ? " erro" : " erros") + " no caderno");
        }
 
        if (a.aproveitamento !== null) {
            partes.push(a.aproveitamento + "% nas sessões");
        }
 
        const selo = a.erros > 0
            ? a.erros + (a.erros === 1 ? " erro" : " erros")
            : a.aproveitamento + "%";
 
        return `
            <div class="dx-item" style="--dx-cor:${cor}">
                <span class="dx-icone"><i class="bi bi-exclamation-triangle"></i></span>
                <span class="dx-texto">
                    <strong>${escapar(a.materia)} · ${escapar(a.assunto)}</strong>
                    <small>${partes.join(" · ")}</small>
                </span>
                <span class="dx-selo">${selo}</span>
            </div>`;
    }).join("");
}
 
// =========================
// PRÓXIMAS REVISÕES
// =========================
function seloRevisao(g) {
    if (g.dias < 0) return { texto: "Atrasada", cor: VERMELHO };
    if (g.dias === 0) return { texto: "Hoje", cor: AMARELO };
    if (g.dias === 1) return { texto: "Amanhã", cor: MARCA };
 
    return { texto: "Em " + g.dias + " dias", cor: MARCA };
}
 
function desenharProximasRevisoes() {
    const caixa = el("proximas_revisoes");
    const lista = dados.proximas_revisoes;
 
    if (lista.length === 0) {
        caixa.innerHTML = `
            <div class="dashboard-vazio">
                <i class="bi bi-calendar-check"></i>
                <p>Nenhuma revisão programada.</p>
            </div>`;
        return;
    }
 
    caixa.innerHTML = lista.map(function (g) {
        const selo = seloRevisao(g);
        const palavra = g.pendentes === 1 ? "questão" : "questões";
 
        return `
            <a class="dx-item" href="revisao.html" style="--dx-cor:${selo.cor}">
                <span class="dx-icone"><i class="bi bi-arrow-repeat"></i></span>
                <span class="dx-texto">
                    <strong>${escapar(g.materia)} · ${escapar(g.assunto)}</strong>
                    <small>R${g.etapa} • ${g.intervalo} ${g.intervalo === 1 ? "dia" : "dias"} · ${g.pendentes} ${palavra}</small>
                </span>
                <span class="dx-selo">${selo.texto}</span>
            </a>`;
    }).join("");
}
 
// =========================
// ATIVIDADE RECENTE
// =========================
function itemAtividade(a) {
    if (a.tipo === "sessao") {
        let detalhe = escapar(a.assunto) + " · " + formatarTempoCurto(a.segundos);
 
        if (a.questoes > 0) {
            const pct = Math.round((a.acertos / a.questoes) * 100);
            detalhe += " · " + a.questoes + " questões (" + pct + "%)";
        }
 
        return {
            icone: "bi-stopwatch",
            cor: AZUL,
            titulo: "Estudou " + escapar(a.materia),
            detalhe: detalhe
        };
    }
 
    if (a.tipo === "erro") {
        return {
            icone: "bi-x-circle",
            cor: VERMELHO,
            titulo: "Erro registrado em " + escapar(a.materia),
            detalhe: escapar(a.assunto) + " · " + escapar(MOTIVOS[a.motivo] || a.motivo)
        };
    }
 
    return {
        icone: "bi-arrow-repeat",
        cor: MARCA,
        titulo: "Revisão de " + escapar(a.materia),
        detalhe: escapar(a.assunto) + " · " + a.acertos + "/" + a.questoes + " acertos"
    };
}
 
function desenharAtividade() {
    const caixa = el("atividade_recente");
    const lista = dados.atividade;
 
    if (lista.length === 0) {
        caixa.innerHTML = `
            <div class="dashboard-vazio">
                <i class="bi bi-clock-history"></i>
                <p>Nenhuma atividade registrada.</p>
            </div>`;
        return;
    }
 
    caixa.innerHTML = lista.map(function (a) {
        const item = itemAtividade(a);
 
        return `
            <div class="dx-item" style="--dx-cor:${item.cor}">
                <span class="dx-icone"><i class="bi ${item.icone}"></i></span>
                <span class="dx-texto">
                    <strong>${item.titulo}</strong>
                    <small>${item.detalhe}</small>
                </span>
                <span class="dx-hora">${tempoRelativo(a.criado_em)}</span>
            </div>`;
    }).join("");
}
 
// =========================
// CARREGAR E DESENHAR TUDO
// =========================
function desenharTudo() {
    if (typeof Chart !== "undefined") {
        Chart.defaults.color = getComputedStyle(document.body).color;
        Chart.defaults.font.family = "Poppins, sans-serif";
    }
 
    mostrarMetricas();
    desenharGraficoHoras();
    desenharGraficoAproveitamento();
    desenharMaterias();
    desenharAtencao();
    desenharProximasRevisoes();
    desenharAtividade();
}
 
async function carregarDashboard() {
    try {
        const resposta = await fetch("/api/dashboard");
 
        if (!resposta.ok) {
            throw new Error("Erro " + resposta.status);
        }
 
        dados = await resposta.json();
    } catch (erro) {
        console.error("Erro ao carregar o dashboard:", erro);
        return;
    }
 
    desenharTudo();
}
 
// Trocar entre 7 e 30 dias não precisa buscar de novo
el("periodo_grafico").addEventListener("change", function () {
    if (dados) {
        desenharGraficoHoras();
    }
});
 
// Atualiza os números quando você volta para esta aba ou página
document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
        carregarDashboard();
    }
});
 
window.addEventListener("pageshow", function (evento) {
    if (evento.persisted) {
        carregarDashboard();
    }
});
 
adicionarEstilos();
mostrarData();
carregarDashboard();
 