document.addEventListener("DOMContentLoaded",function(){

// =========================================================
// ELEMENTOS DA PÁGINA
// =========================================================

const tituloMateria=document.getElementById("titulo_materia");
const tituloAssunto=document.getElementById("titulo_assunto");
const modoRevisao=document.getElementById("modo_revisao");
const quantidadeRevisao=document.getElementById("quantidade_revisao");

const contadorQuestoes=document.getElementById("contador_questoes");
const porcentagemRevisao=document.getElementById("porcentagem_revisao");
const barraRevisao=document.getElementById("barra_revisao");

const materiaQuestao=document.getElementById("materia_questao");
const enunciadoQuestao=document.getElementById("enunciado_questao");
const assuntoAtual=document.getElementById("assunto_atual");

const formResposta=document.getElementById("form_resposta_revisao");
const respostaUsuario=document.getElementById("resposta_usuario");
const observacaoRevisao=document.getElementById("observacao_revisao");
const btnResponder=document.getElementById("btn_responder");

const totalRespondidas=document.getElementById("total_respondidas");
const totalAcertos=document.getElementById("total_acertos");
const totalErros=document.getElementById("total_erros_revisao");
const aproveitamentoRevisao=document.getElementById("aproveitamento_revisao");

const resultadoResposta=document.getElementById("resultado_resposta");
const iconeResultado=document.getElementById("icone_resultado");
const statusResultado=document.getElementById("status_resultado");
const mensagemResultado=document.getElementById("mensagem_resultado");

const resultadoRespostaUsuario=document.getElementById("resultado_resposta_usuario");
const resultadoRespostaCorreta=document.getElementById("resultado_resposta_correta");

const observacaoOriginal=document.getElementById("observacao_original");
const observacaoAtual=document.getElementById("observacao_atual");

const btnProxima=document.getElementById("btn_proxima_questao");

const areaQuestao=document.querySelector(".area-questao-revisao");
const progressoRevisao=document.querySelector(".progresso-revisao");
const fimRevisao=document.getElementById("fim_revisao");

const finalQuestoes=document.getElementById("final_questoes");
const finalAcertos=document.getElementById("final_acertos");
const finalErros=document.getElementById("final_erros");
const finalAproveitamento=document.getElementById("final_aproveitamento");

const btnRevisarErros=document.getElementById("btn_revisar_erros");


// =========================================================
// DADOS RECEBIDOS DA PÁGINA DE REVISÕES
// =========================================================

let revisaoSalva=null;

try{
    revisaoSalva=JSON.parse(
        sessionStorage.getItem("revisaoAtual")
    );
}catch(erro){
    console.error("Erro ao carregar revisão:",erro);
}


// Caso abra revisao_questoes.html diretamente
// usamos estes dados apenas para teste.

const configuracao=revisaoSalva||{
    materia:"Português",
    assunto:"Interpretação de texto",
    modo:"rapida",
    quantidade:10
};


// =========================================================
// QUESTÕES DE TESTE
//
// Futuramente serão substituídas pelas questões salvas
// no Caderno de Erros.
// =========================================================

const questoesTeste=[
    {
        id:1,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 1. Digite A para responder corretamente.",
        respostaCorreta:"A",
        observacaoOriginal:"Questão cadastrada anteriormente no Caderno de Erros."
    },
    {
        id:2,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 2. Digite C para responder corretamente.",
        respostaCorreta:"C",
        observacaoOriginal:"Revisar o conceito relacionado a esta questão."
    },
    {
        id:3,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 3. Digite B para responder corretamente.",
        respostaCorreta:"B",
        observacaoOriginal:"Houve confusão entre conceitos."
    },
    {
        id:4,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 4. Digite D para responder corretamente.",
        respostaCorreta:"D",
        observacaoOriginal:"Questão marcada para revisão."
    },
    {
        id:5,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 5. Digite A para responder corretamente.",
        respostaCorreta:"A",
        observacaoOriginal:"Erro anterior causado por desatenção."
    },
    {
        id:6,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 6. Digite E para responder corretamente.",
        respostaCorreta:"E",
        observacaoOriginal:"Revisar novamente antes da prova."
    },
    {
        id:7,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 7. Digite B para responder corretamente.",
        respostaCorreta:"B",
        observacaoOriginal:"Questão importante."
    },
    {
        id:8,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 8. Digite C para responder corretamente.",
        respostaCorreta:"C",
        observacaoOriginal:"Conteúdo precisa de reforço."
    },
    {
        id:9,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 9. Digite D para responder corretamente.",
        respostaCorreta:"D",
        observacaoOriginal:"Erro de interpretação na primeira tentativa."
    },
    {
        id:10,
        materia:configuracao.materia,
        assunto:configuracao.assunto,
        enunciado:"Questão de teste 10. Digite A para responder corretamente.",
        respostaCorreta:"A",
        observacaoOriginal:"Última questão de teste."
    }
];


// =========================================================
// VARIÁVEIS DA REVISÃO
// =========================================================

let questoes=[];
let indiceAtual=0;

let respondidas=0;
let acertos=0;
let erros=0;

let questaoRespondida=false;

let questoesErradas=[];


// =========================================================
// NORMALIZAR TEXTO
//
// Permite aceitar:
// A
// a
// Alternativa A
// alternativa a
// =========================================================

function normalizarResposta(texto){

    return texto
        .trim()
        .toLowerCase()
        .replace("alternativa","")
        .trim();

}


// =========================================================
// EMBARALHAR QUESTÕES
// =========================================================

function embaralhar(lista){

    const copia=[...lista];

    for(let i=copia.length-1;i>0;i--){

        const indiceAleatorio=
            Math.floor(
                Math.random()*(i+1)
            );

        [copia[i],copia[indiceAleatorio]]=
        [copia[indiceAleatorio],copia[i]];
    }

    return copia;

}


// =========================================================
// NOME DO MODO
// =========================================================

function nomeModo(modo){

    if(modo==="rapida"){
        return "Revisão rápida";
    }

    if(modo==="normal"){
        return "Revisão normal";
    }

    if(modo==="completa"){
        return "Revisão completa";
    }

    return "Revisão";
}


// =========================================================
// PREPARAR REVISÃO
// =========================================================

function prepararRevisao(){

    tituloMateria.textContent=
        configuracao.materia;

    tituloAssunto.textContent=
        configuracao.assunto;

    materiaQuestao.textContent=
        configuracao.materia;

    assuntoAtual.textContent=
        configuracao.assunto;

    modoRevisao.textContent=
        nomeModo(configuracao.modo);


    // Embaralha as questões

    const embaralhadas=
        embaralhar(questoesTeste);


    // Se pediu 30 questões mas só existem 10,
    // utiliza somente as disponíveis.

    const quantidadeFinal=
        Math.min(
            configuracao.quantidade,
            embaralhadas.length
        );


    questoes=
        embaralhadas.slice(
            0,
            quantidadeFinal
        );


    quantidadeRevisao.textContent=
        questoes.length+" questões";


    carregarQuestao();

}


// =========================================================
// CARREGAR QUESTÃO
// =========================================================

function carregarQuestao(){

    questaoRespondida=false;

    resultadoResposta.classList.add(
        "oculto"
    );


    formResposta.style.display="block";


    respostaUsuario.disabled=false;

    observacaoRevisao.disabled=false;

    btnResponder.disabled=false;


    respostaUsuario.value="";

    observacaoRevisao.value="";


    const questao=
        questoes[indiceAtual];


    enunciadoQuestao.textContent=
        questao.enunciado;


    materiaQuestao.textContent=
        questao.materia;


    assuntoAtual.textContent=
        questao.assunto;


    atualizarProgresso();


    respostaUsuario.focus();

}


// =========================================================
// ATUALIZAR PROGRESSO
// =========================================================

function atualizarProgresso(){

    const numeroAtual=
        indiceAtual+1;


    const total=
        questoes.length;


    const porcentagem=
        Math.round(
            (numeroAtual/total)*100
        );


    contadorQuestoes.textContent=
        `Questão ${numeroAtual} de ${total}`;


    porcentagemRevisao.textContent=
        porcentagem+"%";


    barraRevisao.style.width=
        porcentagem+"%";

}


// =========================================================
// RESPONDER QUESTÃO
// =========================================================

formResposta.addEventListener(
    "submit",
    function(event){

        event.preventDefault();


        if(questaoRespondida){
            return;
        }


        const resposta=
            respostaUsuario.value.trim();


        if(resposta===""){

            alert(
                "Digite sua resposta."
            );

            return;
        }


        const questao=
            questoes[indiceAtual];


        const respostaNormalizada=
            normalizarResposta(resposta);


        const corretaNormalizada=
            normalizarResposta(
                questao.respostaCorreta
            );


        const acertou=
            respostaNormalizada===
            corretaNormalizada;


        respondidas++;


        if(acertou){

            acertos++;

        }else{

            erros++;

            questoesErradas.push(
                questao
            );

        }


        questaoRespondida=true;


        mostrarResultado(
            questao,
            resposta,
            acertou
        );


        atualizarEstatisticas();

    }
);


// =========================================================
// MOSTRAR RESULTADO
// =========================================================

function mostrarResultado(
    questao,
    resposta,
    acertou
){

    resultadoResposta.classList.remove(
        "oculto"
    );


    resultadoRespostaUsuario.textContent=
        resposta;


    resultadoRespostaCorreta.textContent=
        questao.respostaCorreta;


    observacaoOriginal.textContent=
        questao.observacaoOriginal||
        "Nenhuma anotação anterior.";


    const novaObservacao=
        observacaoRevisao.value.trim();


    observacaoAtual.textContent=
        novaObservacao||
        "Nenhuma observação registrada.";


    if(acertou){

        iconeResultado.textContent="✓";

        statusResultado.textContent=
            "RESPOSTA CORRETA";

        mensagemResultado.textContent=
            "Muito bem!";

        resultadoResposta.classList.remove(
            "resultado-errado"
        );

        resultadoResposta.classList.add(
            "resultado-correto"
        );

    }else{

        iconeResultado.textContent="×";

        statusResultado.textContent=
            "RESPOSTA INCORRETA";

        mensagemResultado.textContent=
            "Essa questão ainda precisa de atenção.";

        resultadoResposta.classList.remove(
            "resultado-correto"
        );

        resultadoResposta.classList.add(
            "resultado-errado"
        );

    }


    respostaUsuario.disabled=true;

    observacaoRevisao.disabled=true;

    btnResponder.disabled=true;


    resultadoResposta.scrollIntoView({
        behavior:"smooth",
        block:"center"
    });

}


// =========================================================
// ESTATÍSTICAS
// =========================================================

function atualizarEstatisticas(){

    totalRespondidas.textContent=
        respondidas;


    totalAcertos.textContent=
        acertos;


    totalErros.textContent=
        erros;


    let porcentagem=0;


    if(respondidas>0){

        porcentagem=
            Math.round(
                (acertos/respondidas)*100
            );

    }


    aproveitamentoRevisao.textContent=
        porcentagem+"%";

}


// =========================================================
// PRÓXIMA QUESTÃO
// =========================================================

btnProxima.addEventListener(
    "click",
    function(){

        indiceAtual++;


        if(
            indiceAtual>=questoes.length
        ){

            finalizarRevisao();

            return;

        }


        carregarQuestao();


        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    }
);


// =========================================================
// FINALIZAR REVISÃO
// =========================================================

function finalizarRevisao(){

    areaQuestao.style.display="none";

    resultadoResposta.classList.add(
        "oculto"
    );


    progressoRevisao.style.display="none";


    fimRevisao.classList.remove(
        "oculto"
    );


    const aproveitamento=
        respondidas>0
        ?Math.round(
            (acertos/respondidas)*100
        )
        :0;


    finalQuestoes.textContent=
        respondidas;


    finalAcertos.textContent=
        acertos;


    finalErros.textContent=
        erros;


    finalAproveitamento.textContent=
        aproveitamento+"%";


    salvarResultadoRevisao(
        aproveitamento
    );


    fimRevisao.scrollIntoView({
        behavior:"smooth"
    });

}


// =========================================================
// SALVAR RESUMO LOCALMENTE
// =========================================================

function salvarResultadoRevisao(
    aproveitamento
){

    const resultado={
        data:new Date().toLocaleDateString(
            "pt-BR"
        ),

        materia:configuracao.materia,

        assunto:configuracao.assunto,

        modo:configuracao.modo,

        questoes:respondidas,

        acertos:acertos,

        erros:erros,

        aproveitamento:
            aproveitamento
    };


    let historico=[];


    try{

        historico=
            JSON.parse(
                localStorage.getItem(
                    "studymetrics_revisoes"
                )
            )||[];

    }catch(erro){

        historico=[];

    }


    historico.push(
        resultado
    );


    localStorage.setItem(
        "studymetrics_revisoes",
        JSON.stringify(historico)
    );

}


// =========================================================
// REVISAR SOMENTE OS ERROS
// =========================================================

btnRevisarErros.addEventListener(
    "click",
    function(){

        if(
            questoesErradas.length===0
        ){

            alert(
                "Você não errou nenhuma questão nesta revisão."
            );

            return;

        }


        questoes=
            embaralhar(
                questoesErradas
            );


        indiceAtual=0;

        respondidas=0;

        acertos=0;

        erros=0;

        questoesErradas=[];


        fimRevisao.classList.add(
            "oculto"
        );


        areaQuestao.style.display="grid";

        progressoRevisao.style.display="block";


        atualizarEstatisticas();

        carregarQuestao();


        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    }
);


// =========================================================
// INICIAR
// =========================================================

prepararRevisao();

});