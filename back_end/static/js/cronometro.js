// =========================
// IDs DOS ELEMENTOS
// Se o id no sessao.html for diferente, troque só aqui
// =========================
// =========================
// IDs DOS ELEMENTOS
// =========================
const ID_TELA = "cronometro";
const ID_BTN_INICIAR = "btn_retomar";    // botão Retomar / Iniciar
const ID_BTN_PAUSAR = "btn_pausar";      // botão Pausar
const ID_BTN_ZERAR = "btn_finalizar";    // botão Finalizar
const ID_STATUS = "status_cronometro";

const cronometro = document.getElementById(ID_TELA);
const btnIniciar = document.getElementById(ID_BTN_INICIAR);
const btnPausar = document.getElementById(ID_BTN_PAUSAR);
const btnZerar = document.getElementById(ID_BTN_ZERAR);
const statusCronometro = document.getElementById(ID_STATUS);

// Avisa no Console qual id não foi encontrado
[
    [ID_TELA, cronometro],
    [ID_BTN_INICIAR, btnIniciar],
    [ID_BTN_PAUSAR, btnPausar],
    [ID_BTN_ZERAR, btnZerar],
    [ID_STATUS, statusCronometro]
].forEach(function (item) {
    if (!item[1]) {
        console.warn('cronometro.js: não achei o elemento com id "' + item[0] + '"');
    }
});

let segundos = 0;
let intervalo = null;

function atualizarTela() {
    if (!cronometro) {
        return;
    }

    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    cronometro.textContent =
        String(horas).padStart(2, "0") + ":" +
        String(minutos).padStart(2, "0") + ":" +
        String(segundosRestantes).padStart(2, "0");
}

function mudarStatus(texto) {
    if (statusCronometro) {
        statusCronometro.textContent = texto;
    }
}

function iniciar() {
    if (intervalo !== null) {
        return;
    }

    mudarStatus("Estudando");

    intervalo = setInterval(function () {
        segundos++;
        atualizarTela();
    }, 1000);
}

function pausar() {
    clearInterval(intervalo);
    intervalo = null;
    mudarStatus("Pausado");
}

function zerar() {
    clearInterval(intervalo);
    intervalo = null;
    segundos = 0;
    atualizarTela();
    mudarStatus("Aguardando");
}

// Só liga o clique se o botão existir
if (btnIniciar) btnIniciar.addEventListener("click", iniciar);
if (btnPausar) btnPausar.addEventListener("click", pausar);
if (btnZerar) btnZerar.addEventListener("click", zerar);