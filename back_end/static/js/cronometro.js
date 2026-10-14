
// CONFIGURAÇÃO
// =========================
// true  = ao sair da página, o cronômetro PAUSA
// false = ao sair da página, o cronômetro CONTINUA contando
const PAUSAR_AO_SAIR = false;
 
// Nome com que a sessão fica guardada no navegador
const CHAVE_ESTADO = "studymetrics-sessao-em-andamento";
 
// =========================
// ELEMENTOS DA PÁGINA
// =========================
const formPlanejamento = document.getElementById("form_planejamento");
const selectMateria = document.getElementById("materia_sessao");
const inputAssunto = document.getElementById("assunto_sessao");
const listaAssuntos = document.getElementById("lista_assuntos");
const inputHoras = document.getElementById("horas_planejadas");
const inputMinutos = document.getElementById("minutos_planejados");
const inputMeta = document.getElementById("meta_questoes");
 
const telaCronometro = document.getElementById("cronometro");
const statusCronometro = document.getElementById("status_cronometro");
const btnRetomar = document.getElementById("btn_retomar");
const btnPausar = document.getElementById("btn_pausar");
const btnFinalizar = document.getElementById("btn_finalizar");
 
const secaoResultado = document.getElementById("resultado_sessao");
const formResultado = document.getElementById("form_resultado");
 
// =========================
// VARIÁVEIS
// =========================
let materias = [];
let sessao = null;            // sessão em andamento
let sessaoFinalizada = null;  // sessão aguardando o resultado
 
let msAcumulados = 0;         // tempo já contado (em milissegundos)
let inicioTrecho = null;      // momento em que começou/retomou
let intervalo = null;
let metaSegundos = 0;         // tempo planejado (0 = sem alarme)
let alarmeTocou = false;
let alarmePendente = false;   // alarme esperando um clique para poder tocar
let audioCtx = null;
 
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
 
// Ao escolher a matéria, sugere os assuntos dela no campo Assunto
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
// SOM DO ALARME
// =========================
// O navegador só libera som depois de um clique do usuário.
function prepararAudio() {
    if (!audioCtx) {
        const AudioContexto = window.AudioContext || window.webkitAudioContext;
 
        if (!AudioContexto) {
            return;
        }
 
        audioCtx = new AudioContexto();
    }
 
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}
 
function tocarAlarme() {
    if (!audioCtx) {
        return;
    }
 
    const agora = audioCtx.currentTime;
 
    // 6 bipes alternando entre dois tons
    for (let i = 0; i < 6; i++) {
        const oscilador = audioCtx.createOscillator();
        const volume = audioCtx.createGain();
        const inicio = agora + i * 0.4;
 
        oscilador.type = "sine";
        oscilador.frequency.value = i % 2 === 0 ? 880 : 1100;
 
        volume.gain.setValueAtTime(0.0001, inicio);
        volume.gain.exponentialRampToValueAtTime(0.4, inicio + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.3);
 
        oscilador.connect(volume);
        volume.connect(audioCtx.destination);
 
        oscilador.start(inicio);
        oscilador.stop(inicio + 0.32);
    }
}
 
// Chegou no tempo planejado
function dispararAlarme() {
    mudarStatus("Tempo concluído!");
 
    if (audioCtx && audioCtx.state === "running") {
        tocarAlarme();
        return;
    }
 
    // Se a página foi aberta de novo, o navegador ainda não liberou o som.
    // O alarme toca no primeiro clique ou tecla.
    alarmePendente = true;
}
 
function liberarAlarmePendente() {
    prepararAudio();
 
    if (alarmePendente) {
        alarmePendente = false;
        tocarAlarme();
    }
}
 
document.addEventListener("pointerdown", liberarAlarmePendente);
document.addEventListener("keydown", liberarAlarmePendente);
 
// =========================
// CRONÔMETRO
// =========================
function mudarStatus(texto) {
    statusCronometro.textContent = texto;
}
 
function segundosDecorridos() {
    let ms = msAcumulados;
 
    if (inicioTrecho !== null) {
        ms += Date.now() - inicioTrecho;
    }
 
    return Math.floor(ms / 1000);
}
 
function formatar(totalSegundos) {
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.floor((totalSegundos % 3600) / 60);
    const s = totalSegundos % 60;
 
    return String(h).padStart(2, "0") + ":" +
           String(m).padStart(2, "0") + ":" +
           String(s).padStart(2, "0");
}
 
function atualizarTela() {
    const segundos = segundosDecorridos();
 
    telaCronometro.textContent = formatar(segundos);
 
    // Chegou no tempo planejado: toca uma vez só
    if (metaSegundos > 0 && !alarmeTocou && segundos >= metaSegundos) {
        alarmeTocou = true;
        dispararAlarme();
        salvarEstado();
    }
}
 
function iniciarContagem() {
    if (intervalo !== null) {
        return;
    }
 
    inicioTrecho = Date.now();
    intervalo = setInterval(atualizarTela, 250);
    mudarStatus(alarmeTocou ? "Tempo concluído!" : "Estudando");
 
    salvarEstado();
}
 
function pausarContagem() {
    if (inicioTrecho === null) {
        return;
    }
 
    msAcumulados += Date.now() - inicioTrecho;
    inicioTrecho = null;
 
    clearInterval(intervalo);
    intervalo = null;
 
    atualizarTela();
    salvarEstado();
}
 
// =========================
// GUARDAR A SESSÃO NO NAVEGADOR
// =========================
// Assim o tempo não se perde quando você troca de página.
function salvarEstado() {
    try {
        if (!sessao && !sessaoFinalizada) {
            localStorage.removeItem(CHAVE_ESTADO);
            return;
        }
 
        localStorage.setItem(CHAVE_ESTADO, JSON.stringify({
            sessao: sessao,
            sessaoFinalizada: sessaoFinalizada,
            msAcumulados: msAcumulados,
            inicioTrecho: inicioTrecho,
            metaSegundos: metaSegundos,
            alarmeTocou: alarmeTocou
        }));
    } catch (erro) {
        console.warn("Não foi possível guardar a sessão:", erro);
    }
}
 
function lerEstado() {
    try {
        const texto = localStorage.getItem(CHAVE_ESTADO);
        return texto ? JSON.parse(texto) : null;
    } catch (erro) {
        return null;
    }
}
 
// Coloca de volta, no formulário, os dados da sessão
function preencherPlanejamento(dados) {
    const existe = Array.from(selectMateria.options)
        .some(opcao => opcao.value === dados.materia);
 
    // A matéria pode ter sido apagada depois: mantém ela na lista
    if (!existe) {
        selectMateria.add(new Option(dados.materia, dados.materia));
    }
 
    selectMateria.value = dados.materia;
    selectMateria.dispatchEvent(new Event("change"));
 
    inputAssunto.value = dados.assunto;
    inputHoras.value = dados.horas || "";
    inputMinutos.value = dados.minutos || "";
    inputMeta.value = dados.meta || "";
}
 
function mostrarResultado(rolarAteLa) {
    let tempoPlanejado = "-";
 
    if (sessaoFinalizada.horas > 0) {
        tempoPlanejado = sessaoFinalizada.horas + "h" +
            String(sessaoFinalizada.minutos).padStart(2, "0");
    } else if (sessaoFinalizada.minutos > 0) {
        tempoPlanejado = sessaoFinalizada.minutos + " min";
    }
 
    document.getElementById("resultado_materia").textContent =
        sessaoFinalizada.materia;
    document.getElementById("resultado_assunto").textContent =
        sessaoFinalizada.assunto;
    document.getElementById("resultado_tempo_planejado").textContent =
        tempoPlanejado;
    document.getElementById("resultado_meta_questoes").textContent =
        sessaoFinalizada.meta || "-";
 
    secaoResultado.classList.remove("oculto");
 
    if (rolarAteLa) {
        secaoResultado.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}
 
// Ao abrir a página, continua de onde parou
function restaurarSessao() {
    const estado = lerEstado();
 
    if (!estado || (!estado.sessao && !estado.sessaoFinalizada)) {
        return;
    }
 
    sessao = estado.sessao;
    sessaoFinalizada = estado.sessaoFinalizada;
    msAcumulados = estado.msAcumulados || 0;
    metaSegundos = estado.metaSegundos || 0;
    alarmeTocou = Boolean(estado.alarmeTocou);
 
    preencherPlanejamento(sessao || sessaoFinalizada);
 
    // Sessão já finalizada, esperando o resultado
    if (sessaoFinalizada) {
        telaCronometro.textContent = formatar(Math.floor(msAcumulados / 1000));
        mudarStatus("Finalizada");
        mostrarResultado(false);
        return;
    }
 
    if (estado.inicioTrecho) {
        // Estava contando: o tempo que passou fora da página já entra na conta
        inicioTrecho = estado.inicioTrecho;
        intervalo = setInterval(atualizarTela, 250);
        mudarStatus(alarmeTocou ? "Tempo concluído!" : "Estudando");
    } else {
        mudarStatus("Pausado");
    }
 
    atualizarTela();
}
 
// Ao sair da página
window.addEventListener("pagehide", function () {
    if (PAUSAR_AO_SAIR && inicioTrecho !== null) {
        pausarContagem();
    }
 
    salvarEstado();
});
 
// Ao voltar usando o botão "voltar" do navegador
window.addEventListener("pageshow", atualizarTela);
 
// =========================
// BOTÕES
// =========================
 
// Iniciar sessão (formulário de planejamento)
formPlanejamento.addEventListener("submit", function (evento) {
    evento.preventDefault();
 
    // Evita perder uma sessão sem querer
    if ((sessao && segundosDecorridos() > 0) || sessaoFinalizada) {
        const continuar = confirm(
            "Já existe uma sessão que ainda não foi salva.\n" +
            "Começar uma nova vai descartar o tempo atual. Continuar?"
        );
 
        if (!continuar) {
            return;
        }
    }
 
    prepararAudio();
 
    const horas = Number(inputHoras.value) || 0;
    const minutos = Number(inputMinutos.value) || 0;
 
    sessao = {
        materia: selectMateria.value,
        assunto: inputAssunto.value.trim(),
        horas: horas,
        minutos: minutos,
        meta: inputMeta.value
    };
 
    sessaoFinalizada = null;
    metaSegundos = horas * 3600 + minutos * 60;
    alarmeTocou = false;
    alarmePendente = false;
    msAcumulados = 0;
    inicioTrecho = null;
 
    clearInterval(intervalo);
    intervalo = null;
 
    secaoResultado.classList.add("oculto");
 
    iniciarContagem();
    atualizarTela();
});
 
// Retomar
btnRetomar.addEventListener("click", function () {
    if (!sessao) {
        alert("Preencha o planejamento e clique em Iniciar sessão.");
        return;
    }
 
    prepararAudio();
    iniciarContagem();
});
 
// Pausar
btnPausar.addEventListener("click", function () {
    if (!sessao) {
        return;
    }
 
    pausarContagem();
    mudarStatus("Pausado");
});
 
// Finalizar: para o tempo e mostra o resultado
btnFinalizar.addEventListener("click", function () {
    if (!sessao) {
        alert("Nenhuma sessão em andamento.");
        return;
    }
 
    pausarContagem();
    mudarStatus("Finalizada");
 
    sessaoFinalizada = sessao;
    sessao = null;
 
    salvarEstado();
    mostrarResultado(true);
});
 
// Salvar resultado
formResultado.addEventListener("submit", async function (evento) {
    evento.preventDefault();
 
    if (!sessaoFinalizada) {
        return;
    }
 
    const questoes = Number(document.getElementById("questoes_realizadas").value);
    const acertos = Number(document.getElementById("acertos").value);
 
    if (acertos > questoes) {
        alert("Os acertos não podem ser maiores que as questões realizadas.");
        return;
    }
 
    const dados = {
        materia: sessaoFinalizada.materia,
        assunto: sessaoFinalizada.assunto,
        tempo_planejado: sessaoFinalizada.horas * 3600 + sessaoFinalizada.minutos * 60,
        tempo_segundos: Math.floor(msAcumulados / 1000),
        meta_questoes: Number(sessaoFinalizada.meta) || 0,
        questoes_realizadas: questoes,
        acertos: acertos,
        observacao: document.getElementById("observacao_sessao").value
    };
 
    const resposta = await fetch("/api/sessoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });
 
    const resultado = await resposta.json();
 
    if (!resposta.ok) {
        alert(resultado.erro);
        return;
    }
 
    formResultado.reset();
    formPlanejamento.reset();
    secaoResultado.classList.add("oculto");
 
    sessaoFinalizada = null;
    msAcumulados = 0;
    metaSegundos = 0;
    alarmeTocou = false;
    alarmePendente = false;
 
    telaCronometro.textContent = "00:00:00";
    mudarStatus("Aguardando");
 
    // Sessão salva no banco: não precisa mais ficar guardada no navegador
    salvarEstado();
 
    await carregarHistorico();
    alert("Sessão salva com sucesso!");
});
 
// =========================
// HISTÓRICO DE SESSÕES
// =========================
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}
 
function formatarTempoHistorico(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
 
    if (h > 0) {
        return h + "h" + String(m).padStart(2, "0");
    }
 
    if (m > 0) {
        return m + "min";
    }
 
    return segundos + "s";
}
 
async function carregarHistorico() {
    const corpo = document.getElementById("historico_sessoes");
 
    if (!corpo) {
        return;
    }
 
    try {
        const resposta = await fetch("/api/sessoes");
        const sessoes = await resposta.json();
 
        if (sessoes.length === 0) {
            corpo.innerHTML =
                '<tr><td colspan="7">Nenhuma sessão registrada ainda.</td></tr>';
            return;
        }
 
        corpo.innerHTML = sessoes.map(function (s) {
            // O banco guarda a hora em UTC; aqui vira a data local
            const data = new Date(
                s.criado_em.replace(" ", "T") + "Z"
            ).toLocaleDateString("pt-BR");
 
            let desempenho = "-";
 
            if (s.questoes_realizadas > 0) {
                const pct = Math.round(
                    (s.acertos / s.questoes_realizadas) * 100
                );
                const classe = pct >= 80 ? "bom" : pct >= 60 ? "medio" : "ruim";
 
                desempenho =
                    '<span class="desempenho ' + classe + '">' + pct + "%</span>";
            }
 
            return `
                <tr>
                    <td>${data}</td>
                    <td>${escapar(s.materia)}</td>
                    <td>${escapar(s.assunto)}</td>
                    <td>${formatarTempoHistorico(s.tempo_segundos)}</td>
                    <td>${s.questoes_realizadas}</td>
                    <td>${s.acertos}</td>
                    <td>${desempenho}</td>
                </tr>`;
        }).join("");
    } catch (erro) {
        console.error("Erro ao carregar histórico:", erro);
    }
}
 
// =========================
// INÍCIO
// =========================
async function iniciarPagina() {
    // Espera as matérias carregarem para poder escolher a da sessão guardada
    await carregarMaterias();
    restaurarSessao();
    carregarHistorico();
}
 
iniciarPagina();
 