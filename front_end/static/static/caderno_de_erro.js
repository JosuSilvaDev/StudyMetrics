document.addEventListener("DOMContentLoaded",function(){

const formErro=document.getElementById("form_erro");
const questao=document.getElementById("questao");
const disciplina=document.getElementById("disciplina");
const assunto=document.getElementById("assunto");
const respostaCorreta=document.getElementById("resposta_correta");
const observacao=document.getElementById("observacao_erro");
const adicionarRevisao=document.getElementById("adicionar_revisao");

formErro.addEventListener("submit",function(event){

    event.preventDefault();

    const motivoSelecionado=
        document.querySelector(
            'input[name="motivo_erro"]:checked'
        );

    if(!motivoSelecionado){
        alert("Selecione o motivo do erro.");
        return;
    }

    const novoErro={
        id:Date.now(),

        data:new Date().toLocaleDateString(
            "pt-BR"
        ),

        enunciado:questao.value.trim(),

        materia:disciplina.options[
            disciplina.selectedIndex
        ].text,

        materiaValor:disciplina.value,

        assunto:assunto.value.trim(),

        motivo:motivoSelecionado.value,

        respostaCorreta:
            respostaCorreta.value.trim(),

        observacao:
            observacao.value.trim(),

        revisar:
            adicionarRevisao.checked,

        vezesRevisada:0,

        acertosRevisao:0,

        errosRevisao:0
    };


    let erros=[];

    try{
        erros=
            JSON.parse(
                localStorage.getItem(
                    "studymetrics_erros"
                )
            )||[];
    }catch(erro){
        erros=[];
    }


    erros.push(novoErro);


    localStorage.setItem(
        "studymetrics_erros",
        JSON.stringify(erros)
    );


    alert(
        "Erro salvo com sucesso!"
    );


    formErro.reset();

});

});