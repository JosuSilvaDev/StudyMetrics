const cronometro = document.getElementById("cronometro");
const btnIniciar = document.getElementById("btn_iniciar");
const btnPausar = document.getElementById("btn_pausar");
const btnZerar = document.getElementById("btn_zerar");
const statusCronometro = document.getElementById("status_cronometro");

let segundos = 0;
let intervalo = null;

function atualizarTela() {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    cronometro.textContent =
        String(horas).padStart(2, "0") + ":" +
        String(minutos).padStart(2, "0") + ":" +
        String(segundosRestantes).padStart(2, "0");
}

function iniciar() {
    if (intervalo !== null) {
        return;
    }

    statusCronometro.textContent = "Estudando";

    intervalo = setInterval(function () {
        segundos++;
        atualizarTela();
    }, 1000);
}

function pausar() {
    clearInterval(intervalo);
    intervalo = null;
    statusCronometro.textContent = "Pausado";
}

function zerar() {
    clearInterval(intervalo);
    intervalo = null;
    segundos = 0;
    atualizarTela();
    statusCronometro.textContent = "Aguardando";
}

btnIniciar.addEventListener("click", iniciar);
btnPausar.addEventListener("click", pausar);
btnZerar.addEventListener("click", zerar);