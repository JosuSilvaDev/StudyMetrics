document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       CONFIGURAÇÕES
    ===================================================== */

    const STORAGE_ERROS = "studymetrics_erros";
    const STORAGE_REVISOES = "studymetrics_revisoes";

    const listaRevisoes =
        document.getElementById("lista_revisoes");

    const filtroRevisoes =
        document.getElementById("filtro_revisoes");

    const tabelaHistorico =
        document.getElementById("tabela_historico_revisoes");

    const modal =
        document.getElementById("escolher_modo_revisao");

    const totalParaRevisar =
        document.getElementById("total_para_revisar");

    const totalRevisoesHoje =
        document.getElementById("total_revisoes_hoje");

    const totalRevisadas =
        document.getElementById("total_revisadas");

    const mediaAproveitamento =
        document.getElementById("media_aproveitamento");


    /* =====================================================
       DADOS
    ===================================================== */

    let erros = carregarArray(STORAGE_ERROS);

    let historico =
        carregarArray(STORAGE_REVISOES);

    let selecaoAtual = {
        materia: "",
        assunto: ""
    };


    /* =====================================================
       INICIAR PÁGINA
    ===================================================== */

    atualizarResumo();

    montarFiltro();

    renderizarRevisoes();

    renderizarHistorico();


    /* =====================================================
       FILTRO DE MATÉRIAS
    ===================================================== */

    if (filtroRevisoes) {

        filtroRevisoes.addEventListener(
            "change",
            function () {

                renderizarRevisoes(
                    filtroRevisoes.value
                );

            }
        );

    }


    /* =====================================================
       CLIQUES
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            /* =============================================
               INICIAR REVISÃO
            ============================================= */

            const botaoIniciar =
                event.target.closest(
                    ".btn-iniciar-revisao"
                );


            if (botaoIniciar) {

                selecaoAtual = {

                    materia:
                        botaoIniciar.dataset.materia || "",

                    assunto:
                        botaoIniciar.dataset.assunto || ""

                };


                if (modal) {

                    modal.classList.remove(
                        "oculto"
                    );

                } else {

                    abrirRevisao(
                        "rapida",
                        10
                    );

                }


                return;

            }


            /* =============================================
               ESCOLHER MODO
            ============================================= */

            const botaoModo =
                event.target.closest(
                    ".modo-revisao"
                );


            if (botaoModo) {

                const modo =
                    botaoModo.dataset.modo ||
                    "rapida";


                const quantidade =
                    Number(
                        botaoModo.dataset.quantidade
                    ) || 10;


                abrirRevisao(
                    modo,
                    quantidade
                );


                return;

            }


            /* =============================================
               FECHAR MODAL
            ============================================= */

            const fecharModal =
                event.target.closest(
                    "[data-fechar-modal]"
                );


            if (
                fecharModal ||
                event.target === modal
            ) {

                fecharModalRevisao();

            }

        }
    );


    /* =====================================================
       RESUMO SUPERIOR
    ===================================================== */

    function atualizarResumo() {

        const questoesParaRevisar =
            erros.filter(
                function (erro) {

                    return (
                        erro &&
                        erro.revisar === true
                    );

                }
            );


        /* TOTAL PARA REVISAR */

        if (totalParaRevisar) {

            totalParaRevisar.textContent =
                questoesParaRevisar.length;

        }


        /* QUESTÕES JÁ REVISADAS */

        const revisadas =
            questoesParaRevisar.filter(
                function (erro) {

                    return (
                        Number(
                            erro.vezesRevisada || 0
                        ) > 0
                    );

                }
            );


        if (totalRevisadas) {

            totalRevisadas.textContent =
                revisadas.length;

        }


        /* REVISÕES DE HOJE */

        const hoje =
            dataHojeISO();


        const hojeQuantidade =
            questoesParaRevisar.filter(
                function (erro) {

                    const data =
                        erro.dataRevisao ||
                        erro.proximaRevisao ||
                        erro.proxima_revisao ||
                        "";


                    return normalizarData(
                        data
                    ) === hoje;

                }
            ).length;


        if (totalRevisoesHoje) {

            totalRevisoesHoje.textContent =
                hojeQuantidade;

        }


        /* APROVEITAMENTO */

        if (
            historico.length === 0
        ) {

            if (mediaAproveitamento) {

                mediaAproveitamento.textContent =
                    "0%";

            }

            return;

        }


        const valoresValidos =
            historico
                .map(
                    function (item) {

                        return Number(
                            item.aproveitamento
                        );

                    }
                )
                .filter(
                    function (valor) {

                        return !Number.isNaN(
                            valor
                        );

                    }
                );


        let media = 0;


        if (
            valoresValidos.length > 0
        ) {

            const soma =
                valoresValidos.reduce(
                    function (
                        total,
                        valor
                    ) {

                        return total + valor;

                    },
                    0
                );


            media =
                Math.round(
                    soma /
                    valoresValidos.length
                );

        }


        if (mediaAproveitamento) {

            mediaAproveitamento.textContent =
                `${media}%`;

        }

    }


    /* =====================================================
       MONTAR FILTRO
    ===================================================== */

    function montarFiltro() {

        if (!filtroRevisoes) {
            return;
        }


        const questoes =
            erros.filter(
                function (erro) {

                    return (
                        erro &&
                        erro.revisar === true
                    );

                }
            );


        const materias =
            [
                ...new Set(
                    questoes
                        .map(
                            function (erro) {

                                return (
                                    erro.materia ||
                                    erro.materiaValor ||
                                    ""
                                );

                            }
                        )
                        .filter(Boolean)
                )
            ];


        materias.sort(
            function (a, b) {

                return a.localeCompare(
                    b,
                    "pt-BR"
                );

            }
        );


        filtroRevisoes.innerHTML =
            `
                <option value="todas">
                    Todas as matérias
                </option>
            `;


        materias.forEach(
            function (materia) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    materia;


                option.textContent =
                    materia;


                filtroRevisoes.appendChild(
                    option
                );

            }
        );

    }


    /* =====================================================
       RENDERIZAR CARDS
    ===================================================== */

    function renderizarRevisoes(
        filtro = "todas"
    ) {

        if (!listaRevisoes) {
            return;
        }


        let questoes =
            erros.filter(
                function (erro) {

                    return (
                        erro &&
                        erro.revisar === true
                    );

                }
            );


        /* FILTRO */

        if (
            filtro &&
            filtro !== "todas"
        ) {

            questoes =
                questoes.filter(
                    function (erro) {

                        const materia =
                            erro.materia ||
                            erro.materiaValor ||
                            "";


                        return (
                            materia === filtro
                        );

                    }
                );

        }


        /* SEM QUESTÕES */

        if (
            questoes.length === 0
        ) {

            listaRevisoes.innerHTML =
                `
                    <div class="revisao-vazia">

                        <i class="bi bi-journal-check"></i>

                        <div>

                            <strong>
                                Nenhuma revisão disponível
                            </strong>

                            <p>
                                Adicione questões no Caderno de Erros
                                e marque-as para revisão.
                            </p>

                            <a
                                href="caderno_de_questoes.html"
                                class="btn-secundario"
                            >
                                Ir para o Caderno de Erros
                            </a>

                        </div>

                    </div>
                `;


            return;

        }


        /* AGRUPAR POR MATÉRIA + ASSUNTO */

        const grupos = {};


        questoes.forEach(
            function (erro) {

                const materia =
                    erro.materia ||
                    erro.materiaValor ||
                    "Sem matéria";


                const assunto =
                    erro.assunto ||
                    "Sem assunto";


                const chave =
                    `${materia}|||${assunto}`;


                if (!grupos[chave]) {

                    grupos[chave] = {

                        materia:
                            materia,

                        assunto:
                            assunto,

                        questoes:
                            []

                    };

                }


                grupos[chave]
                    .questoes
                    .push(
                        erro
                    );

            }
        );


        listaRevisoes.innerHTML =
            "";


        Object.values(
            grupos
        ).forEach(
            function (grupo) {

                const card =
                    criarCardRevisao(
                        grupo
                    );


                listaRevisoes.appendChild(
                    card
                );

            }
        );

    }


    /* =====================================================
       CRIAR CARD
    ===================================================== */

    function criarCardRevisao(
        grupo
    ) {

        const total =
            grupo.questoes.length;


        const revisadas =
            grupo.questoes.filter(
                function (questao) {

                    return (
                        Number(
                            questao.vezesRevisada || 0
                        ) > 0
                    );

                }
            ).length;


        const totalAcertos =
            grupo.questoes.reduce(
                function (
                    soma,
                    questao
                ) {

                    return (
                        soma +
                        Number(
                            questao.acertosRevisao || 0
                        )
                    );

                },
                0
            );


        const totalErros =
            grupo.questoes.reduce(
                function (
                    soma,
                    questao
                ) {

                    return (
                        soma +
                        Number(
                            questao.errosRevisao || 0
                        )
                    );

                },
                0
            );


        const tentativas =
            totalAcertos +
            totalErros;


        const desempenho =
            tentativas > 0

                ? Math.round(
                    (
                        totalAcertos /
                        tentativas
                    ) * 100
                )

                : 0;


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "card-revisao";


        card.dataset.materia =
            grupo.materia;


        card.dataset.assunto =
            grupo.assunto;


        card.innerHTML =
            `
                <div class="card-revisao-topo">

                    <span class="badge-materia">
                        ${escaparHTML(
                            grupo.materia
                        )}
                    </span>

                    <span class="badge-prioridade hoje">
                        ${total}
                        ${
                            total === 1
                                ? "questão"
                                : "questões"
                        }
                    </span>

                </div>


                <h3>
                    ${escaparHTML(
                        grupo.assunto
                    )}
                </h3>


                <p class="descricao-revisao">

                    Questões registradas no
                    Caderno de Erros para
                    reforçar este conteúdo.

                </p>


                <div class="dados-revisao">

                    <div>

                        <span>
                            DISPONÍVEIS
                        </span>

                        <strong>
                            ${total}
                        </strong>

                    </div>


                    <div>

                        <span>
                            REVISADAS
                        </span>

                        <strong>
                            ${revisadas}
                        </strong>

                    </div>


                    <div>

                        <span>
                            DESEMPENHO
                        </span>

                        <strong>
                            ${desempenho}%
                        </strong>

                    </div>

                </div>


                <div class="acoes-revisao">

                    <a
                        href="caderno_de_questoes.html"
                        class="btn-secundario"
                    >
                        Ver questões
                    </a>


                    <button
                        type="button"
                        class="btn-iniciar-revisao"
                        data-materia="${escaparAtributo(
                            grupo.materia
                        )}"
                        data-assunto="${escaparAtributo(
                            grupo.assunto
                        )}"
                    >

                        <i class="bi bi-play-fill"></i>

                        Iniciar revisão

                    </button>

                </div>
            `;


        return card;

    }


    /* =====================================================
       ABRIR REVISÃO
    ===================================================== */

    function abrirRevisao(
        modo,
        quantidade
    ) {

        if (
            !selecaoAtual.materia
        ) {

            alert(
                "Não foi possível identificar a matéria."
            );

            return;

        }


        const revisaoAtual = {

            materia:
                selecaoAtual.materia,

            assunto:
                selecaoAtual.assunto,

            modo:
                modo,

            quantidade:
                quantidade

        };


        sessionStorage.setItem(
            "revisaoAtual",
            JSON.stringify(
                revisaoAtual
            )
        );


        window.location.href =
            "revisao_questoes.html";

    }


    /* =====================================================
       FECHAR MODAL
    ===================================================== */

    function fecharModalRevisao() {

        if (!modal) {
            return;
        }


        modal.classList.add(
            "oculto"
        );

    }


    /* =====================================================
       HISTÓRICO
    ===================================================== */

    function renderizarHistorico() {

        if (!tabelaHistorico) {
            return;
        }


        if (
            historico.length === 0
        ) {

            tabelaHistorico.innerHTML =
                `
                    <tr>

                        <td
                            colspan="7"
                            style="text-align:center;"
                        >

                            Nenhuma revisão realizada ainda.

                        </td>

                    </tr>
                `;


            return;

        }


        /* MAIS RECENTE PRIMEIRO */

        const lista =
            [...historico]
                .reverse();


        tabelaHistorico.innerHTML =
            "";


        lista.forEach(
            function (item) {

                const linha =
                    document.createElement(
                        "tr"
                    );


                linha.innerHTML =
                    `
                        <td>
                            ${escaparHTML(
                                item.data || "-"
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                item.materia || "-"
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                item.assunto || "-"
                            )}
                        </td>

                        <td>
                            ${Number(
                                item.quantidade || 0
                            )}
                        </td>

                        <td>
                            ${Number(
                                item.acertos || 0
                            )}
                        </td>

                        <td>
                            ${Number(
                                item.erros || 0
                            )}
                        </td>

                        <td>

                            <span class="status-revisao">

                                ${Number(
                                    item.aproveitamento || 0
                                )}%

                            </span>

                        </td>
                    `;


                tabelaHistorico.appendChild(
                    linha
                );

            }
        );

    }


    /* =====================================================
       CARREGAR LOCALSTORAGE
    ===================================================== */

    function carregarArray(
        chave
    ) {

        try {

            const dados =
                JSON.parse(
                    localStorage.getItem(
                        chave
                    )
                );


            return Array.isArray(
                dados
            )
                ? dados
                : [];

        } catch (erro) {

            console.error(
                `Erro ao carregar ${chave}:`,
                erro
            );


            return [];

        }

    }


    /* =====================================================
       DATA
    ===================================================== */

    function dataHojeISO() {

        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();


        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const dia =
            String(
                hoje.getDate()
            ).padStart(
                2,
                "0"
            );


        return (
            `${ano}-${mes}-${dia}`
        );

    }


    function normalizarData(
        data
    ) {

        if (!data) {
            return "";
        }


        /* JÁ ESTÁ EM YYYY-MM-DD */

        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(data)
        ) {

            return data;

        }


        /* FORMATO DD/MM/YYYY */

        if (
            /^\d{2}\/\d{2}\/\d{4}$/
                .test(data)
        ) {

            const partes =
                data.split("/");


            return (
                `${partes[2]}-${partes[1]}-${partes[0]}`
            );

        }


        return "";

    }


    /* =====================================================
       SEGURANÇA DO HTML
    ===================================================== */

    function escaparHTML(
        texto
    ) {

        return String(
            texto ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    function escaparAtributo(
        texto
    ) {

        return escaparHTML(
            texto
        );

    }

});