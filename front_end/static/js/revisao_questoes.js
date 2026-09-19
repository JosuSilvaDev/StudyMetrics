document.addEventListener("DOMContentLoaded", function () {

    const STORAGE_ERROS = "studymetrics_erros";
    const STORAGE_REVISOES = "studymetrics_revisoes";

    const $ = (id) => document.getElementById(id);

    const tituloMateria = $("titulo_materia");
    const tituloAssunto = $("titulo_assunto");
    const modoRevisao = $("modo_revisao");
    const quantidadeRevisao = $("quantidade_revisao");

    const contadorQuestoes = $("contador_questoes");
    const porcentagemRevisao = $("porcentagem_revisao");
    const barraRevisao = $("barra_revisao");

    const materiaQuestao = $("materia_questao");
    const enunciadoQuestao = $("enunciado_questao");
    const assuntoAtual = $("assunto_atual");

    const formResposta = $("form_resposta_revisao");
    const respostaUsuario = $("resposta_usuario");
    const observacaoRevisao = $("observacao_revisao");
    const btnResponder = $("btn_responder");

    const resultadoResposta = $("resultado_resposta");
    const iconeResultado = $("icone_resultado");
    const statusResultado = $("status_resultado");
    const mensagemResultado = $("mensagem_resultado");

    const resultadoRespostaUsuario =
        $("resultado_resposta_usuario");

    const resultadoRespostaCorreta =
        $("resultado_resposta_correta");

    const observacaoOriginal =
        $("observacao_original");

    const observacaoAtual =
        $("observacao_atual");

    const blocoObservacaoOriginal =
        $("bloco_observacao_original");

    const blocoObservacaoAtual =
        $("bloco_observacao_atual");

    const btnProximaQuestao =
        $("btn_proxima_questao");

    const totalRespondidas =
        $("total_respondidas");

    const totalAcertos =
        $("total_acertos");

    const totalErros =
        $("total_erros_revisao");

    const aproveitamento =
        $("aproveitamento_revisao");

    const fimRevisao =
        $("fim_revisao");

    const finalQuestoes =
        $("final_questoes");

    const finalAcertos =
        $("final_acertos");

    const finalErros =
        $("final_erros");

    const finalAproveitamento =
        $("final_aproveitamento");

    const btnRevisarErros =
        $("btn_revisar_erros");


    /* =========================================
       CONFIGURAÇÃO DA REVISÃO
    ========================================= */

    let config =
        carregarJSONSession("revisaoAtual") || {

            materia: "",
            assunto: "",
            modo: "rapida",
            quantidade: 10

        };


    /* =========================================
       BUSCA QUESTÕES DO CADERNO DE ERROS
    ========================================= */

    let bancoErros =
        carregarJSONLocal(STORAGE_ERROS);

    let fila =
        prepararQuestoes(
            bancoErros,
            config
        );


    let indiceAtual = 0;

    let acertos = 0;

    let erros = 0;

    let respondidas = 0;

    let errosDaRevisao = [];

    let respostaProcessada = false;


    preencherCabecalho();


    if (fila.length === 0) {

        mostrarSemQuestoes();

        return;
    }


    renderizarQuestao();


    /* =========================================
       RESPONDER QUESTÃO
    ========================================= */

    formResposta.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            if (respostaProcessada) {
                return;
            }

            const resposta =
                respostaUsuario.value.trim();

            if (!resposta) {
                return;
            }

            const questao =
                fila[indiceAtual];


            const correta =
                respostasEquivalentes(
                    resposta,
                    questao.respostaCorreta || ""
                );


            respondidas++;

            respostaProcessada = true;


            if (correta) {

                acertos++;

                atualizarEstatisticaErro(
                    questao.id,
                    true
                );

            } else {

                erros++;

                errosDaRevisao.push(
                    questao
                );

                atualizarEstatisticaErro(
                    questao.id,
                    false
                );

            }


            atualizarPainel();


            mostrarResultado(
                questao,
                resposta,
                correta
            );


            respostaUsuario.disabled =
                true;

            observacaoRevisao.disabled =
                true;

            btnResponder.disabled =
                true;

        }
    );


    /* =========================================
       PRÓXIMA QUESTÃO
    ========================================= */

    btnProximaQuestao.addEventListener(
        "click",
        function () {

            if (!respostaProcessada) {
                return;
            }


            indiceAtual++;


            if (
                indiceAtual >=
                fila.length
            ) {

                finalizarRevisao();

                return;
            }


            renderizarQuestao();

        }
    );


    /* =========================================
       REVISAR SOMENTE OS ERROS
    ========================================= */

    btnRevisarErros.addEventListener(
        "click",
        function () {

            if (
                errosDaRevisao.length === 0
            ) {
                return;
            }


            fila =
                embaralhar(
                    [...errosDaRevisao]
                );


            indiceAtual = 0;

            acertos = 0;

            erros = 0;

            respondidas = 0;

            errosDaRevisao = [];


            fimRevisao.classList.add(
                "oculto"
            );


            document
                .querySelector(
                    ".area-questao-revisao"
                )
                ?.classList.remove(
                    "oculto"
                );


            document
                .querySelector(
                    ".progresso-revisao"
                )
                ?.classList.remove(
                    "oculto"
                );


            renderizarQuestao();

            atualizarPainel();

        }
    );


    /* =========================================
       PREPARAR QUESTÕES
    ========================================= */

    function prepararQuestoes(
        errosSalvos,
        configuracao
    ) {

        const materia =
            normalizar(
                configuracao.materia || ""
            );


        const assunto =
            normalizar(
                configuracao.assunto || ""
            );


        let elegiveis =
            errosSalvos.filter(
                function (erro) {

                    return (
                        erro &&
                        erro.revisar === true
                    );

                }
            );


        /* FILTRO POR MATÉRIA */

        if (materia) {

            elegiveis =
                elegiveis.filter(
                    function (erro) {

                        return (

                            normalizar(
                                erro.materia
                            ) === materia ||

                            normalizar(
                                erro.materiaValor
                            ) === materia

                        );

                    }
                );

        }


        /* FILTRO POR ASSUNTO */

        if (assunto) {

            elegiveis =
                elegiveis.filter(
                    function (erro) {

                        return (

                            normalizar(
                                erro.assunto
                            ) === assunto

                        );

                    }
                );

        }


        const limite =
            Number(
                configuracao.quantidade
            ) || 10;


        return embaralhar(
            elegiveis
        ).slice(
            0,
            Math.min(
                limite,
                elegiveis.length
            )
        );

    }


    /* =========================================
       CABEÇALHO
    ========================================= */

    function preencherCabecalho() {

        const nomesModo = {

            rapida:
                "Revisão rápida",

            normal:
                "Revisão normal",

            completa:
                "Revisão completa"

        };


        tituloMateria.textContent =
            config.materia ||
            "Revisão";


        tituloAssunto.textContent =
            config.assunto ||
            "Questões marcadas para revisão";


        modoRevisao.textContent =
            nomesModo[
                config.modo
            ] || "Revisão";


        quantidadeRevisao.textContent =
            `${fila.length} ${
                fila.length === 1
                    ? "questão"
                    : "questões"
            }`;

    }


    /* =========================================
       MOSTRAR QUESTÃO
    ========================================= */

    function renderizarQuestao() {

        const questao =
            fila[indiceAtual];


        respostaProcessada =
            false;


        tituloMateria.textContent =
            questao.materia ||
            config.materia ||
            "Revisão";


        tituloAssunto.textContent =
            questao.assunto ||
            config.assunto ||
            "Sem assunto";


        materiaQuestao.textContent =
            questao.materia ||
            "Matéria";


        assuntoAtual.textContent =
            questao.assunto ||
            "Sem assunto";


        enunciadoQuestao.textContent =
            questao.enunciado ||
            "Questão sem enunciado.";


        respostaUsuario.value = "";

        observacaoRevisao.value = "";


        respostaUsuario.disabled =
            false;

        observacaoRevisao.disabled =
            false;

        btnResponder.disabled =
            false;


        respostaUsuario.focus();


        resultadoResposta.classList.add(
            "oculto"
        );


        const atual =
            indiceAtual + 1;

        const total =
            fila.length;


        const percentual =
            Math.round(
                (atual / total) * 100
            );


        contadorQuestoes.textContent =
            `Questão ${atual} de ${total}`;


        porcentagemRevisao.textContent =
            `${percentual}%`;


        barraRevisao.style.width =
            `${percentual}%`;

    }


    /* =========================================
       RESULTADO DA QUESTÃO
    ========================================= */

    function mostrarResultado(
        questao,
        resposta,
        correta
    ) {

        resultadoResposta.classList.remove(
            "oculto"
        );


        iconeResultado.textContent =
            correta
                ? "✓"
                : "✕";


        statusResultado.textContent =
            correta
                ? "RESPOSTA CORRETA"
                : "RESPOSTA INCORRETA";


        mensagemResultado.textContent =
            correta
                ? "Muito bem!"
                : "Revise este ponto antes de seguir.";


        resultadoRespostaUsuario.textContent =
            resposta;


        resultadoRespostaCorreta.textContent =
            questao.respostaCorreta ||
            "Não informada";


        /* OBSERVAÇÃO DO CADERNO */

        if (
            questao.observacao &&
            questao.observacao.trim()
        ) {

            blocoObservacaoOriginal
                .classList.remove(
                    "oculto"
                );


            observacaoOriginal.textContent =
                questao.observacao;

        } else {

            blocoObservacaoOriginal
                .classList.add(
                    "oculto"
                );

        }


        /* OBSERVAÇÃO DA REVISÃO */

        const anotacaoAtual =
            observacaoRevisao
                .value
                .trim();


        if (anotacaoAtual) {

            blocoObservacaoAtual
                .classList.remove(
                    "oculto"
                );


            observacaoAtual.textContent =
                anotacaoAtual;

        } else {

            blocoObservacaoAtual
                .classList.add(
                    "oculto"
                );

        }


        if (
            indiceAtual ===
            fila.length - 1
        ) {

            btnProximaQuestao.textContent =
                "Finalizar revisão";

        } else {

            btnProximaQuestao.textContent =
                "Próxima questão →";

        }

    }


    /* =========================================
       ESTATÍSTICAS
    ========================================= */

    function atualizarPainel() {

        totalRespondidas.textContent =
            respondidas;


        totalAcertos.textContent =
            acertos;


        totalErros.textContent =
            erros;


        const percentual =
            respondidas > 0
                ? Math.round(
                    (acertos /
                    respondidas)
                    * 100
                )
                : 0;


        aproveitamento.textContent =
            `${percentual}%`;

    }


    /* =========================================
       FINALIZAR
    ========================================= */

    function finalizarRevisao() {

        const percentual =
            respondidas > 0
                ? Math.round(
                    (acertos /
                    respondidas)
                    * 100
                )
                : 0;


        finalQuestoes.textContent =
            respondidas;


        finalAcertos.textContent =
            acertos;


        finalErros.textContent =
            erros;


        finalAproveitamento.textContent =
            `${percentual}%`;


        document
            .querySelector(
                ".area-questao-revisao"
            )
            ?.classList.add(
                "oculto"
            );


        document
            .querySelector(
                ".progresso-revisao"
            )
            ?.classList.add(
                "oculto"
            );


        resultadoResposta.classList.add(
            "oculto"
        );


        fimRevisao.classList.remove(
            "oculto"
        );


        btnRevisarErros.disabled =
            errosDaRevisao.length === 0;


        if (
            errosDaRevisao.length
        ) {

            btnRevisarErros.textContent =
                `Revisar ${
                    errosDaRevisao.length
                } erro${
                    errosDaRevisao.length > 1
                        ? "s"
                        : ""
                } novamente`;

        } else {

            btnRevisarErros.textContent =
                "Nenhum erro para revisar";

        }


        salvarResumoRevisao(
            percentual
        );

    }


    /* =========================================
       SALVAR RESULTADO DA REVISÃO
    ========================================= */

    function salvarResumoRevisao(
        percentual
    ) {

        const historico =
            carregarJSONLocal(
                STORAGE_REVISOES
            );


        historico.push({

            id:
                Date.now(),

            data:
                new Date()
                    .toLocaleDateString(
                        "pt-BR"
                    ),

            materia:
                config.materia ||
                "Geral",

            assunto:
                config.assunto ||
                "Questões marcadas",

            modo:
                config.modo ||
                "rapida",

            quantidade:
                respondidas,

            acertos:
                acertos,

            erros:
                erros,

            aproveitamento:
                percentual

        });


        localStorage.setItem(
            STORAGE_REVISOES,
            JSON.stringify(
                historico
            )
        );

    }


    /* =========================================
       ATUALIZA QUESTÃO NO CADERNO
    ========================================= */

    function atualizarEstatisticaErro(
        id,
        acertou
    ) {

        const indice =
            bancoErros.findIndex(
                function (item) {

                    return (
                        item.id === id
                    );

                }
            );


        if (indice === -1) {
            return;
        }


        bancoErros[indice]
            .vezesRevisada =

            Number(
                bancoErros[indice]
                    .vezesRevisada || 0
            ) + 1;


        if (acertou) {

            bancoErros[indice]
                .acertosRevisao =

                Number(
                    bancoErros[indice]
                        .acertosRevisao || 0
                ) + 1;

        } else {

            bancoErros[indice]
                .errosRevisao =

                Number(
                    bancoErros[indice]
                        .errosRevisao || 0
                ) + 1;

        }


        localStorage.setItem(
            STORAGE_ERROS,
            JSON.stringify(
                bancoErros
            )
        );

    }


    /* =========================================
       SEM QUESTÕES
    ========================================= */

    function mostrarSemQuestoes() {

        tituloMateria.textContent =
            config.materia ||
            "Revisão";


        tituloAssunto.textContent =
            config.assunto ||
            "Questões marcadas para revisão";


        materiaQuestao.textContent =
            "Sem questões";


        assuntoAtual.textContent =
            config.assunto ||
            "—";


        enunciadoQuestao.textContent =
            "Nenhuma questão marcada para revisão foi encontrada para esta matéria e assunto.";


        contadorQuestoes.textContent =
            "Questão 0 de 0";


        porcentagemRevisao.textContent =
            "0%";


        barraRevisao.style.width =
            "0%";


        quantidadeRevisao.textContent =
            "0 questões";


        respostaUsuario.disabled =
            true;


        observacaoRevisao.disabled =
            true;


        btnResponder.disabled =
            true;

    }


    /* =========================================
       COMPARAÇÃO DAS RESPOSTAS
    ========================================= */

    function respostasEquivalentes(
        respostaA,
        respostaB
    ) {

        const a =
            normalizarResposta(
                respostaA
            );


        const b =
            normalizarResposta(
                respostaB
            );


        if (a === b) {
            return true;
        }


        const letraA =
            extrairAlternativa(a);


        const letraB =
            extrairAlternativa(b);


        return Boolean(
            letraA &&
            letraB &&
            letraA === letraB
        );

    }


    function normalizarResposta(
        valor
    ) {

        return normalizar(
            valor
        )
            .replace(
                /^alternativa\s+/,
                ""
            )
            .replace(
                /^opcao\s+/,
                ""
            )
            .trim();

    }


    function extrairAlternativa(
        valor
    ) {

        const match =
            valor.match(
                /\b([a-e])\b/i
            );


        return match
            ? match[1].toLowerCase()
            : "";

    }


    function normalizar(valor) {

        return String(
            valor ?? ""
        )
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                " "
            );

    }


    /* =========================================
       EMBARALHAR QUESTÕES
    ========================================= */

    function embaralhar(array) {

        for (
            let i =
                array.length - 1;

            i > 0;

            i--
        ) {

            const j =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );


            [
                array[i],
                array[j]
            ] = [
                array[j],
                array[i]
            ];

        }


        return array;

    }


    /* =========================================
       LOCAL STORAGE
    ========================================= */

    function carregarJSONLocal(
        chave
    ) {

        try {

            const valor =
                JSON.parse(
                    localStorage.getItem(
                        chave
                    )
                );


            return Array.isArray(
                valor
            )
                ? valor
                : [];

        } catch {

            return [];

        }

    }


    /* =========================================
       SESSION STORAGE
    ========================================= */

    function carregarJSONSession(
        chave
    ) {

        try {

            return JSON.parse(
                sessionStorage.getItem(
                    chave
                )
            );

        } catch {

            return null;

        }

    }

});