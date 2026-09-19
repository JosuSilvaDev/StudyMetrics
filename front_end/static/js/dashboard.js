document.addEventListener("DOMContentLoaded",function(){

// =========================================================
// DATA ATUAL
// =========================================================

const dataAtual=document.getElementById("data_atual");

const hoje=new Date();

dataAtual.textContent=
    hoje.toLocaleDateString("pt-BR",{
        day:"2-digit",
        month:"long",
        year:"numeric"
    });


// =========================================================
// CARREGAR DADOS DO LOCALSTORAGE
// =========================================================

function carregarDados(chave){

    try{

        return JSON.parse(
            localStorage.getItem(chave)
        )||[];

    }catch(erro){

        console.error(
            "Erro ao carregar:",
            chave
        );

        return[];

    }

}


const erros=
    carregarDados(
        "studymetrics_erros"
    );


const revisoes=
    carregarDados(
        "studymetrics_revisoes"
    );


const sessoes=
    carregarDados(
        "studymetrics_sessoes"
    );


// =========================================================
// ERROS REGISTRADOS
// =========================================================

const totalErros=
    document.getElementById(
        "total_erros_dashboard"
    );

totalErros.textContent=
    erros.length;


// =========================================================
// QUESTÕES REALIZADAS
// =========================================================

let quantidadeQuestoes=0;

sessoes.forEach(function(sessao){

    quantidadeQuestoes+=
        Number(
            sessao.questoes||0
        );

});

document.getElementById(
    "total_questoes"
).textContent=
    quantidadeQuestoes;


// =========================================================
// APROVEITAMENTO DAS REVISÕES
// =========================================================

let totalAcertos=0;
let totalQuestoesRevisao=0;


revisoes.forEach(function(revisao){

    totalAcertos+=
        Number(
            revisao.acertos||0
        );

    totalQuestoesRevisao+=
        Number(
            revisao.questoes||0
        );

});


let aproveitamento=0;


if(totalQuestoesRevisao>0){

    aproveitamento=
        Math.round(
            (
                totalAcertos/
                totalQuestoesRevisao
            )*100
        );

}


document.getElementById(
    "media_aproveitamento"
).textContent=
    aproveitamento+"%";


document.getElementById(
    "donut_porcentagem"
).textContent=
    aproveitamento+"%";


// =========================================================
// TEMPO TOTAL DE ESTUDO
// =========================================================

let minutosTotais=0;


sessoes.forEach(function(sessao){

    minutosTotais+=
        Number(
            sessao.minutosTotais||0
        );

});


const horas=
    Math.floor(
        minutosTotais/60
    );


const minutos=
    minutosTotais%60;


document.getElementById(
    "total_tempo"
).textContent=
    `${horas}h ${minutos}min`;


// =========================================================
// GRÁFICO DE HORAS
// =========================================================

const canvasHoras=
    document.getElementById(
        "grafico_horas"
    );


if(canvasHoras&&typeof Chart!=="undefined"){

    new Chart(
        canvasHoras,
        {
            type:"bar",

            data:{
                labels:[
                    "Seg",
                    "Ter",
                    "Qua",
                    "Qui",
                    "Sex",
                    "Sáb",
                    "Dom"
                ],

                datasets:[
                    {
                        label:"Horas",

                        data:[
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],

                        borderRadius:8,

                        backgroundColor:
                            "#46f0d2"
                    }
                ]
            },

            options:{
                responsive:true,

                maintainAspectRatio:false,

                plugins:{
                    legend:{
                        display:false
                    }
                },

                scales:{

                    x:{
                        grid:{
                            display:false
                        }
                    },

                    y:{
                        beginAtZero:true,

                        grid:{
                            color:
                                "rgba(15,42,67,.05)"
                        }
                    }

                }
            }
        }
    );

}


// =========================================================
// GRÁFICO DE APROVEITAMENTO
// =========================================================

const canvasAproveitamento=
    document.getElementById(
        "grafico_aproveitamento"
    );


if(
    canvasAproveitamento&&
    typeof Chart!=="undefined"
){

    new Chart(
        canvasAproveitamento,
        {
            type:"doughnut",

            data:{
                datasets:[
                    {
                        data:[
                            aproveitamento,
                            100-aproveitamento
                        ],

                        backgroundColor:[
                            "#46f0d2",
                            "#e8edf0"
                        ],

                        borderWidth:0
                    }
                ]
            },

            options:{
                responsive:true,

                maintainAspectRatio:false,

                cutout:"78%",

                plugins:{
                    legend:{
                        display:false
                    },

                    tooltip:{
                        enabled:false
                    }
                }
            }
        }
    );

}

});