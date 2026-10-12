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
// Por isso o áudio é preparado ao clicar em "Iniciar sessão".
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
        tocarAlarme();
        mudarStatus("Tempo concluído!");
    }
}

function iniciarContagem() {
    if (intervalo !== null) {
        return;
    }

    inicioTrecho = Date.now();
    intervalo = setInterval(atualizarTela, 250);
    mudarStatus(alarmeTocou ? "Tempo concluído!" : "Estudando");
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
}

// =========================
// BOTÕES
// =========================

// Iniciar sessão (formulário de planejamento)
formPlanejamento.addEventListener("submit", function (evento) {
    evento.preventDefault();
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

    metaSegundos = horas * 3600 + minutos * 60;
    alarmeTocou = false;
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
    secaoResultado.scrollIntoView({ behavior: "smooth", block: "center" });
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
    alarmeTocou = false;

    telaCronometro.textContent = "00:00:00";
    mudarStatus("Aguardando");

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

carregarHistorico();

carregarMaterias();