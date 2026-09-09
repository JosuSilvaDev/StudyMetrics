const diasCalendario = document.getElementById("dias_calendario");
const tituloMesAno = document.getElementById("mes_ano");

const btnMesAnterior = document.getElementById("mes_anterior");
const btnProximoMes = document.getElementById("proximo_mes");

let dataCalendario = new Date();

const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];

const eventos = {
    "2026-09-09": ["estudo"],
    "2026-09-10": ["revisao"],
    "2026-09-12": ["simulado"],
    "2026-09-15": ["estudo", "revisao"]
};

function gerarCalendario() {
    diasCalendario.innerHTML = "";

    const ano = dataCalendario.getFullYear();
    const mes = dataCalendario.getMonth();

    tituloMesAno.textContent = `${meses[mes]} ${ano}`;

    const primeiroDia = new Date(ano, mes, 1).getDay();

    const totalDias = new Date(
        ano,
        mes + 1,
        0
    ).getDate();

    for (let i = 0; i < primeiroDia; i++) {
        const vazio = document.createElement("div");

        vazio.classList.add(
            "dia-calendario",
            "dia-vazio"
        );

        diasCalendario.appendChild(vazio);
    }

    for (let dia = 1; dia <= totalDias; dia++) {
        const elementoDia = document.createElement("div");

        elementoDia.classList.add("dia-calendario");

        const numero = document.createElement("span");

        numero.classList.add("numero-dia");

        numero.textContent = dia;

        elementoDia.appendChild(numero);

        const chave = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        if (eventos[chave]) {
            const marcadores = document.createElement("div");

            marcadores.classList.add("marcadores");

            eventos[chave].forEach(tipo => {
                const marcador = document.createElement("span");

                marcador.classList.add(
                    "marcador",
                    tipo
                );

                marcadores.appendChild(marcador);
            });

            elementoDia.appendChild(marcadores);
        }

        diasCalendario.appendChild(elementoDia);
    }
}

btnMesAnterior.addEventListener("click", function () {
    dataCalendario.setMonth(
        dataCalendario.getMonth() - 1
    );

    gerarCalendario();
});

btnProximoMes.addEventListener("click", function () {
    dataCalendario.setMonth(
        dataCalendario.getMonth() + 1
    );

    gerarCalendario();
});

gerarCalendario();




// ===============================
// CRONÔMETRO - STUDYMETRICS
// ===============================

// Elementos do HTML
const cronometro = document.getElementById("cronometro");
const btnIniciar = document.getElementById("btn_iniciar");
const btnPausar = document.getElementById("btn_pausar");
const btnZerar = document.getElementById("btn_zerar");
const statusCronometro = document.getElementById("status_cronometro");

// Controle do tempo
let segundos = 0;
let intervalo = null;


// ===============================
// FORMATA O TEMPO
// ===============================

function mostrarTempo() {

    const horas = Math.floor(segundos / 3600);

    const minutos = Math.floor(
        (segundos % 3600) / 60
    );

    const segundosRestantes = segundos % 60;

    cronometro.textContent =
        String(horas).padStart(2, "0")
        + ":" +
        String(minutos).padStart(2, "0")
        + ":" +
        String(segundosRestantes).padStart(2, "0");
}


// ===============================
// INICIAR
// ===============================

function iniciarCronometro() {

    // Evita criar vários cronômetros
    if (intervalo !== null) {
        return;
    }

    statusCronometro.textContent = "Estudando";

    intervalo = setInterval(function () {

        segundos++;

        mostrarTempo();

    }, 1000);
}


// ===============================
// PAUSAR
// ===============================

function pausarCronometro() {

    clearInterval(intervalo);

    intervalo = null;

    statusCronometro.textContent = "Pausado";
}


// ===============================
// ZERAR
// ===============================

function zerarCronometro() {

    clearInterval(intervalo);

    intervalo = null;

    segundos = 0;

    mostrarTempo();

    statusCronometro.textContent = "Aguardando";
}


// ===============================
// BOTÕES
// ===============================

btnIniciar.addEventListener(
    "click",
    iniciarCronometro
);

btnPausar.addEventListener(
    "click",
    pausarCronometro
);

btnZerar.addEventListener(
    "click",
    zerarCronometro
);