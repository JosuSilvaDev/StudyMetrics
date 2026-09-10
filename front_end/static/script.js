document.addEventListener("DOMContentLoaded", function () {
const calendario = document.querySelector(".calendario-premium");
const diasCalendario = document.getElementById("dias_calendario");
const tituloMesAno = document.getElementById("mes_ano");

const btnAnterior = document.getElementById("mes_anterior");
const btnProximo = document.getElementById("proximo_mes");

const btnToggle = document.getElementById("toggle_calendario");
const iconeToggle = document.getElementById("icone_toggle");

let dataCalendario = new Date();

let modoSemana = false;

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


// =========================
// CRIAR UM DIA
// =========================

function criarDia(data) {

    const elemento = document.createElement("div");

    elemento.classList.add("dia-premium");

    const hoje = new Date();

    if (
        data.getDate() === hoje.getDate() &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
    ) {
        elemento.classList.add("hoje");
    }


    const numero = document.createElement("span");

    numero.classList.add("numero-dia-premium");

    numero.textContent = data.getDate();

    elemento.appendChild(numero);


    const chave =
        `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;


    if (eventos[chave]) {

        const caixaEventos =
            document.createElement("div");

        caixaEventos.classList.add("eventos-dia");


        eventos[chave].forEach(function(tipo) {

            const ponto =
                document.createElement("span");

            ponto.classList.add(
                "evento-ponto",
                tipo
            );

            caixaEventos.appendChild(ponto);

        });


        elemento.appendChild(caixaEventos);
    }


    return elemento;
}


// =========================
// CALENDÁRIO MENSAL
// =========================

function gerarMes() {

    diasCalendario.innerHTML = "";

    const ano = dataCalendario.getFullYear();
    const mes = dataCalendario.getMonth();

    tituloMesAno.textContent =
        `${meses[mes]} ${ano}`;

    const primeiroDia =
        new Date(ano, mes, 1).getDay();

    const totalDias =
        new Date(ano, mes + 1, 0).getDate();


    for (let i = 0; i < primeiroDia; i++) {

        const vazio =
            document.createElement("div");

        vazio.classList.add(
            "dia-premium",
            "vazio"
        );

        diasCalendario.appendChild(vazio);
    }


    for (let dia = 1; dia <= totalDias; dia++) {

        const data =
            new Date(ano, mes, dia);

        diasCalendario.appendChild(
            criarDia(data)
        );
    }
}


// =========================
// CALENDÁRIO SEMANAL
// =========================

function gerarSemana() {

    diasCalendario.innerHTML = "";

    const dataInicio =
        new Date(dataCalendario);

    const diaSemana =
        dataInicio.getDay();


    // Vai para o domingo da semana atual
    dataInicio.setDate(
        dataInicio.getDate() - diaSemana
    );


    const dataFim =
        new Date(dataInicio);

    dataFim.setDate(
        dataInicio.getDate() + 6
    );


    // título
    if (
        dataInicio.getMonth() ===
        dataFim.getMonth()
    ) {

        tituloMesAno.textContent =
            `${dataInicio.getDate()} - ${dataFim.getDate()} de ${meses[dataFim.getMonth()]} ${dataFim.getFullYear()}`;

    } else {

        tituloMesAno.textContent =
            `${dataInicio.getDate()} ${meses[dataInicio.getMonth()]} - ${dataFim.getDate()} ${meses[dataFim.getMonth()]}`;

    }


    for (let i = 0; i < 7; i++) {

        const data =
            new Date(dataInicio);

        data.setDate(
            dataInicio.getDate() + i
        );

        diasCalendario.appendChild(
            criarDia(data)
        );
    }
}


// =========================
// ATUALIZAR
// =========================

function gerarCalendario() {

    if (modoSemana) {

        gerarSemana();

    } else {

        gerarMes();

    }
}


// =========================
// SETA PARA DIMINUIR
// =========================

btnToggle.addEventListener(
    "click",
    function() {

        modoSemana =
            !modoSemana;

        calendario.classList.toggle(
            "modo-semana",
            modoSemana
        );


        if (modoSemana) {

            btnToggle.title =
                "Mostrar calendário mensal";

            iconeToggle.textContent = "⌄";

        } else {

            btnToggle.title =
                "Mostrar somente a semana";

            iconeToggle.textContent = "⌃";

        }


        gerarCalendario();

    }
);


// =========================
// VOLTAR
// =========================

btnAnterior.addEventListener(
    "click",
    function() {

        if (modoSemana) {

            dataCalendario.setDate(
                dataCalendario.getDate() - 7
            );

        } else {

            dataCalendario.setMonth(
                dataCalendario.getMonth() - 1
            );

        }

        gerarCalendario();

    }
);


// =========================
// AVANÇAR
// =========================

btnProximo.addEventListener(
    "click",
    function() {

        if (modoSemana) {

            dataCalendario.setDate(
                dataCalendario.getDate() + 7
            );

        } else {

            dataCalendario.setMonth(
                dataCalendario.getMonth() + 1
            );

        }

        gerarCalendario();

    }
);


gerarCalendario();
    // ===============================
    // MENSAGEM DO DIA
    // ===============================

    const frases = [

        {
            texto: "A constância transforma pequenos esforços em grandes resultados.",
            categoria: "Constância"
        },

        {
            texto: "Você não precisa estar motivado todos os dias. Precisa continuar.",
            categoria: "Disciplina"
        },

        {
            texto: "Concentre sua energia no que você consegue fazer hoje.",
            categoria: "Foco"
        },

        {
            texto: "Um erro mostra exatamente onde o próximo aprendizado deve começar.",
            categoria: "Evolução"
        },

        {
            texto: "Uma tentativa difícil ainda é uma tentativa que faz você avançar.",
            categoria: "Persistência"
        },

        {
            texto: "Não conte apenas as horas estudadas. Observe o quanto você evoluiu.",
            categoria: "Evolução"
        }

    ];


    function carregarFraseDoDia() {

        const elementoFrase =
            document.getElementById("frase_do_dia");

        const elementoCategoria =
            document.getElementById("categoria_frase");

        if (!elementoFrase || !elementoCategoria) {
            return;
        }

        const hoje = new Date();

        const dia = hoje.getDate();

        const indice =
            dia % frases.length;

        const frase =
            frases[indice];

        elementoFrase.textContent =
            `“${frase.texto}”`;

        elementoCategoria.textContent =
            frase.categoria;
    }


    carregarFraseDoDia();


    // ===============================
    // MODO CLARO / ESCURO
    // ===============================

    const CHAVE_TEMA =
        "studymetrics-tema";

    const botaoTema =
        document.getElementById("botao_tema");


    function aplicarTema(tema) {

        document.documentElement.setAttribute(
            "data-tema",
            tema
        );
    }


    let temaSalvo = "claro";

    try {

        temaSalvo =
            localStorage.getItem(
                CHAVE_TEMA
            ) || "claro";

    } catch (erro) {

        console.log(
            "Não foi possível acessar localStorage."
        );
    }

    aplicarTema(
        temaSalvo
    );


    if (botaoTema) {

        botaoTema.addEventListener(
            "click",
            function () {

                const temaAtual =
                    document.documentElement.getAttribute(
                        "data-tema"
                    );

                const novoTema =
                    temaAtual === "escuro"
                        ? "claro"
                        : "escuro";

                aplicarTema(
                    novoTema
                );

                try {

                    localStorage.setItem(
                        CHAVE_TEMA,
                        novoTema
                    );

                } catch (erro) {

                    console.log(
                        "Não foi possível salvar o tema."
                    );
                }
            }
        );
    }

});