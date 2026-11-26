// Dashboard: todos os valores vêm da API e refletem os registros salvos.
const el = id => document.getElementById(id);
let dados = null;
let periodo = 7;
let diaAgenda = 0;
let filtroAgenda = "dia";
const graficos = {};

// Textos vindos do banco são escapados antes de serem inseridos em HTML.
function escapar(valor) {
    const elemento = document.createElement("div");
    elemento.textContent = valor ?? "";
    return elemento.innerHTML;
}
function tempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return horas ? `${horas}h ${String(minutos).padStart(2, "0")}min` : `${minutos}min`;
}
function dataIso(data) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}
function dataLocal(iso) { return new Date(`${iso}T00:00:00`); }
function vazio(texto) { return `<div class="db-vazio"><span>${escapar(texto)}</span></div>`; }
function porcentagem(acertos, total) { return total ? Math.round(acertos * 100 / total) : null; }
// Destruir o gráfico anterior evita sobreposição ao trocar o período ou atualizar.
// Se a biblioteca externa não carregar, os demais indicadores continuam visíveis.
function grafico(id, opcoes) {
    if (graficos[id]) { graficos[id].destroy(); delete graficos[id]; }
    el(id).innerHTML = "";
    if (typeof ApexCharts === "undefined") {
        el(id).innerHTML = vazio("Gráfico indisponível. Verifique sua conexão com a internet.");
        return;
    }
    graficos[id] = new ApexCharts(el(id), opcoes);
    graficos[id].render();
}
// Tempo e questões variam em porcentagem; aproveitamento varia em pontos
// percentuais, pois já é uma porcentagem. Sem base anterior, não há comparação.
function tendencia(id, atual, anterior, pontos = false) {
    const elemento = el(id);
    elemento.className = "db-tend";
    if (atual === null || anterior === null || (!pontos && anterior === 0)) {
        elemento.textContent = "Sem comparação";
        return;
    }
    const diferenca = pontos ? atual - anterior : Math.round((atual - anterior) * 100 / anterior);
    elemento.textContent = `${diferenca > 0 ? "+" : ""}${diferenca}${pontos ? " p.p." : "%"}`;
    if (diferenca) elemento.classList.add(diferenca > 0 ? "alta" : "baixa");
}
// A meta vem do perfil salvo. A diferença usa apenas datas, sem contar horas.
function mostrarDestaque() {
    const perfil = dados.perfil;
    const nome = perfil.nome.trim().split(/\s+/)[0];
    el("db_saudacao").textContent = nome ? `Olá, ${nome}!` : "Olá, estudante!";
    el("db_mensagem").textContent = dados.revisoes_pendentes
        ? `Você tem ${dados.revisoes_pendentes} ${dados.revisoes_pendentes === 1 ? "revisão pendente" : "revisões pendentes"} para hoje ou atrasadas.`
        : "Continue sua jornada: cada sessão de estudo conta.";
    el("db_hoje_tempo").textContent = tempo(dados.hoje_tempo);
    el("db_hoje_questoes").textContent = dados.hoje_questoes;
    el("db_sequencia").textContent = `${dados.sequencia} ${dados.sequencia === 1 ? "dia" : "dias"}`;
    const badge = el("db_badge_revisoes");
    badge.textContent = dados.revisoes_pendentes;
    badge.classList.toggle("oculto", !dados.revisoes_pendentes);
    if (!perfil.data_aprovacao) {
        el("db_meta").innerHTML = `<div class="db-meta-vazio"><i class="bi bi-flag"></i><div><strong>Sua meta de aprovação</strong><span>Defina uma data no perfil para acompanhar sua contagem regressiva.</span></div><a href="perfil.html">Definir meta</a></div>`;
        return;
    }
    const alvo = dataLocal(perfil.data_aprovacao);
    const hoje = new Date();
    const dias = Math.round((Date.UTC(alvo.getFullYear(), alvo.getMonth(), alvo.getDate()) - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
    const descricao = dias < 0 ? "A data passou. Atualize sua meta no perfil." : dias === 0 ? "O grande dia chegou!" : `até ${alvo.toLocaleDateString("pt-BR")}`;
    el("db_meta").innerHTML = `<div class="db-meta-topo"><span><i class="bi bi-flag-fill"></i> Rumo à aprovação</span><a href="perfil.html">Editar meta</a></div><div class="db-meta-numero"><strong>${Math.max(0, dias)}</strong><span>${dias === 1 ? "dia" : "dias"}</span></div><div class="db-meta-data">${descricao}</div>`;
}
function mostrarMetricas() {
    el("total_tempo").textContent = tempo(dados.tempo_semana);
    el("total_questoes").textContent = dados.questoes_semana;
    el("media_aproveitamento").textContent = dados.total_questoes ? `${dados.aproveitamento}%` : "Sem dados";
    el("total_erros_dashboard").textContent = dados.total_erros;
    tendencia("tend_tempo", dados.tempo_semana, dados.tempo_semana_anterior);
    tendencia("tend_questoes", dados.questoes_semana, dados.questoes_semana_anterior);
    tendencia("tend_aprov", porcentagem(dados.acertos_semana_atual, dados.questoes_semana_atual), porcentagem(dados.acertos_semana_anterior, dados.questoes_semana_anterior_total), true);
    el("nota_aprov").textContent = "geral nas sessões · variação semanal";
    el("tend_erros").textContent = `+${dados.erros_7_dias}`;
    const series = [["spark_tempo", "segundos", "#3b82f6"], ["spark_questoes", "questoes", "#22c55e"], ["spark_aprov", "aprov", "#8b5cf6"], ["spark_erros", "erros", "#ef4444"]];
    series.forEach(([id, chave, cor]) => {
        const valores = dados.grafico_horas.slice(-7).map(d => chave === "aprov" ? porcentagem(d.acertos, d.questoes) : d[chave]);
        if (typeof ApexCharts === "undefined") { el(id).textContent = ""; return; }
        grafico(id, {chart: {type: "area", height: 64, sparkline: {enabled: true}, animations: {enabled: false}}, series: [{data: valores}], stroke: {curve: "smooth", width: 2}, colors: [cor], fill: {opacity: .15}, tooltip: {enabled: false}});
    });
}
// Os 30 pontos já vêm da API: o filtro de 7 dias usa os últimos sete deles.
function mostrarHoras() {
    const pontos = dados.grafico_horas.slice(-periodo);
    const total = pontos.reduce((soma, p) => soma + p.segundos, 0);
    const melhor = pontos.reduce((a, b) => b.segundos > a.segundos ? b : a, pontos[0]);
    el("h_total").textContent = tempo(total);
    el("h_media").textContent = tempo(total / pontos.length);
    el("h_melhor").textContent = melhor.segundos ? `${dataLocal(melhor.data).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})} · ${tempo(melhor.segundos)}` : "Sem registros";
    grafico("grafico_horas", {chart: {type: "bar", height: 280, toolbar: {show: false}}, series: [{name: "Horas estudadas", data: pontos.map(p => +(p.segundos / 3600).toFixed(2))}], colors: ["#14b8a6"], plotOptions: {bar: {borderRadius: 4, columnWidth: "60%"}}, dataLabels: {enabled: false}, xaxis: {categories: pontos.map(p => dataLocal(p.data).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"}))}, yaxis: {labels: {formatter: n => `${n.toFixed(1)}h`}}, tooltip: {y: {formatter: (_, info) => tempo(pontos[info.dataPointIndex].segundos)}}});
}
function mostrarAproveitamento() {
    const acertos = dados.total_acertos;
    const erros = Math.max(0, dados.total_questoes - acertos);
    el("leg_acertos").textContent = acertos;
    el("leg_erros").textContent = erros;
    el("barra_acertos").style.width = `${dados.total_questoes ? dados.aproveitamento : 0}%`;
    const pct = porcentagem(dados.acertos_semana_atual, dados.questoes_semana_atual);
    el("aprov_semana").textContent = pct === null ? "Ainda não há questões registradas nesta semana." : `Nesta semana: ${pct}% de acertos em ${dados.questoes_semana_atual} questões.`;
    if (!dados.total_questoes) { el("grafico_aproveitamento").innerHTML = vazio("Registre questões em uma sessão para ver o aproveitamento."); return; }
    grafico("grafico_aproveitamento", {chart: {type: "donut", height: 260}, series: [acertos, erros], labels: ["Acertos", "Erros"], colors: ["#14b8a6", "#ef4444"], legend: {show: false}, dataLabels: {enabled: false}, plotOptions: {pie: {donut: {size: "72%", labels: {show: true, total: {show: true, label: "Aproveitamento", formatter: () => `${dados.aproveitamento}%`}}}}}});
}
// Matérias sem questões são listadas separadamente: ausência não significa 0%.
function mostrarMaterias() {
    const comDados = dados.desempenho_materias.filter(m => m.aproveitamento !== null);
    const semDados = dados.desempenho_materias.filter(m => m.aproveitamento === null);
    el("materias_sem_dados").innerHTML = semDados.map(m => `<span class="db-chip">${escapar(m.materia)} · sem questões</span>`).join("");
    if (!comDados.length) { el("grafico_materias").innerHTML = vazio("Registre questões nas sessões para acompanhar o desempenho por matéria."); return; }
    el("grafico_materias").innerHTML = comDados.map(m => `<div class="db-desempenho"><div><strong>${escapar(m.materia)}</strong><span>${m.aproveitamento}% · ${m.questoes} questões</span></div><div class="db-desempenho-trilho"><span style="width:${Math.min(100, Math.max(0, m.aproveitamento))}%"></span></div></div>`).join("");
}
function mostrarAtencao() {
    el("lista_atencao").innerHTML = dados.atencao.length ? dados.atencao.map(a => `<a class="db-atencao-item" style="--cor:#ef4444" href="caderno_de_questos.html"><span class="db-atencao-icone"><i class="bi bi-exclamation-triangle"></i></span><span class="db-atencao-texto"><strong>${escapar(a.materia)} · ${escapar(a.assunto)}</strong><small>${a.erros} ${a.erros === 1 ? "erro registrado" : "erros registrados"}${a.aproveitamento === null ? "" : ` · ${a.aproveitamento}% nas sessões`}</small></span></a>`).join("") : vazio("Nenhum assunto precisa de atenção no momento.");
}
// A agenda filtra todos os grupos retornados pela API pelo dia selecionado;
// revisões atrasadas possuem um filtro próprio para não desaparecerem da lista.
function mostrarAgenda() {
    const hoje = new Date();
    const dias = Array.from({length: 7}, (_, i) => { const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i); return d; });
    el("agenda_semana").innerHTML = dias.map((d, i) => `<button type="button" class="db-dia ${i === 0 ? "hoje" : ""} ${filtroAgenda === "dia" && diaAgenda === i ? "ativo" : ""}" data-dia="${i}" aria-label="${d.toLocaleDateString("pt-BR")}"><small>${d.toLocaleDateString("pt-BR", {weekday: "short"}).replace(".", "")}</small><strong>${d.getDate()}</strong><span class="db-pontos">${dados.proximas_revisoes.some(g => g.vence === dataIso(d)) ? "<i></i>" : ""}</span></button>`).join("");
    const atrasadas = dados.proximas_revisoes.filter(g => g.dias < 0);
    el("agenda_filtros").innerHTML = `<button type="button" class="db-chip-agenda alerta ${filtroAgenda === "atrasadas" ? "ativo" : ""}" id="agenda_atrasadas">Atrasadas (${atrasadas.length})</button>`;
    const lista = filtroAgenda === "atrasadas" ? atrasadas : dados.proximas_revisoes.filter(g => g.vence === dataIso(dias[diaAgenda]));
    el("agenda_lista").innerHTML = lista.length ? lista.map(g => `<a href="revisao.html" class="db-agenda-item" style="--cor:${g.dias < 0 ? "#ef4444" : "#14b8a6"}"><span class="db-agenda-etapa">R${g.etapa}</span><span class="db-agenda-texto"><strong>${escapar(g.materia)} · ${escapar(g.assunto)}</strong><small>${g.pendentes} ${g.pendentes === 1 ? "questão" : "questões"} · ${g.dias < 0 ? "atrasada desde " + escapar(dataLocal(g.vence).toLocaleDateString("pt-BR")) : "revisão programada"}</small></span><i class="bi bi-arrow-right db-agenda-ir"></i></a>`).join("") : vazio(filtroAgenda === "atrasadas" ? "Nenhuma revisão atrasada." : "Nenhuma revisão programada para este dia.");
}
function mostrarAtividade() {
    el("atividade_recente").innerHTML = dados.atividade.length ? dados.atividade.map(a => {
        const titulo = a.tipo === "sessao" ? `Sessão de ${a.materia}` : a.tipo === "erro" ? `Erro em ${a.materia}` : `Revisão de ${a.materia}`;
        const detalhe = a.tipo === "sessao" ? `${tempo(a.segundos)} · ${a.questoes} questões` : a.tipo === "erro" ? "Erro registrado no caderno" : `${a.acertos}/${a.questoes} acertos`;
        const data = new Date(a.criado_em.replace(" ", "T") + "Z");
        return `<div class="db-tl-item" style="--cor:#14b8a6"><span class="db-tl-no"><i class="bi ${a.tipo === "sessao" ? "bi-stopwatch" : a.tipo === "erro" ? "bi-x-circle" : "bi-arrow-repeat"}"></i></span><div class="db-tl-corpo"><div class="db-tl-linha"><strong>${escapar(titulo)}</strong><span class="db-tl-hora">${escapar(data.toLocaleDateString("pt-BR"))}</span></div><small>${escapar(a.assunto)} · ${escapar(detalhe)}</small></div></div>`;
    }).join("") : vazio("Nenhuma atividade registrada.");
}
// Uma única requisição abastece todos os blocos; falhas ficam visíveis na página.
async function carregarDashboard() {
    try {
        const resposta = await fetch("/api/dashboard");
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        dados = await resposta.json();
        mostrarDestaque(); mostrarMetricas(); mostrarHoras(); mostrarAproveitamento(); mostrarMaterias(); mostrarAtencao(); mostrarAgenda(); mostrarAtividade();
        el("db_erro").classList.add("oculto");
    } catch (erro) {
        console.error("Erro ao carregar o dashboard:", erro);
        el("db_erro").classList.remove("oculto");
        el("db_mensagem").textContent = "Não foi possível carregar seus dados.";
    }
}
// Os botões são filhos do contêiner: a delegação trata cliques mesmo após redesenho.
el("periodo_grafico").addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-periodo]");
    if (!botao || !dados) return;
    periodo = Number(botao.dataset.periodo);
    el("periodo_grafico").querySelectorAll("button").forEach(b => b.classList.toggle("ativo", b === botao));
    mostrarHoras();
});
el("agenda_semana").addEventListener("click", evento => { const botao = evento.target.closest("button[data-dia]"); if (botao && dados) { diaAgenda = Number(botao.dataset.dia); filtroAgenda = "dia"; mostrarAgenda(); } });
el("agenda_filtros").addEventListener("click", evento => { if (evento.target.closest("#agenda_atrasadas") && dados) { filtroAgenda = "atrasadas"; mostrarAgenda(); } });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") carregarDashboard(); });
window.addEventListener("pageshow", evento => { if (evento.persisted) carregarDashboard(); });
el("data_atual").textContent = new Date().toLocaleDateString("pt-BR", {weekday: "long", day: "numeric", month: "long"});
carregarDashboard();
