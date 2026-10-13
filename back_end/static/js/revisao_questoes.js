// =========================
// DADOS QUE VÊM DA URL
// Exemplo: /revisao_questoes.html?materia=Geografia&assunto=terra&quantidade=10&modo=rapida
// =========================
const parametros = new URLSearchParams(window.location.search);
 
const materia = (parametros.get("materia") || "").trim();
const assunto = (parametros.get("assunto") || "").trim();
const modo = parametros.get("modo") || "";
const quantidade = Number(parametros.get("quantidade")) || 10;
 
// =========================
// ELEMENTOS DA PÁGINA
// =========================
const subtitulo = document.getElementById("rv_subtitulo");
 
const areaQuestao = document.getElementById("rv_questao_area");
const areaResultado = document.getElementById("rv_resultado_area");
const areaVazia = document.getElementById("rv_vazio_area");
 
const contador = document.getElementById("rv_contador");
const placar = document.getElementById("rv_placar");
const barra = document.getElementById("rv_barra");
 
const tagMateria = document.getElementById("rv_materia");
const tagAssunto = document.getElementById("rv_assunto");
const enunciado = document.getElementById("rv_enunciado");
 
const inputResposta = document.getElementById("rv_sua_resposta");
const btnMostrar = document.getElementById("rv_btn_mostrar");
 
const gabarito = document.getElementById("rv_gabarito");
const textoSua = document.getElementById("rv_texto_sua");
const textoCorreta = document.getElementById("rv_texto_correta");
const linhaObs = document.getElementById("rv_linha_obs");
const textoObs = document.getElementById("rv_texto_obs");
 
const btnErrei = document.getElementById("rv_btn_errei");
const btnAcertei = document.getElementById("rv_btn_acertei");
const btnNovamente = document.getElementById("rv_btn_novamente");
 
// =========================
// ESTADO DA REVISÃO
// =========================
let questoes = [];   // questões sorteadas
let indice = 0;      // questão atual
let respostas = [];  // { erro_id, acertou } de cada questão respondida
 
// =========================
// INICIAR
// =========================
async function iniciar() {
    subtitulo.textContent = materia
        ? materia + (assunto ? " · " + assunto : "")
        : "Todas as matérias";
 
    try {
        const consulta = new URLSearchParams({
            materia: materia,
            assunto: assunto,
            limite: quantidade
        });
 
        const resposta = await fetch("/api/revisoes/questoes?" + consulta.toString());
        questoes = await resposta.json();
    } catch (erro) {
        console.error("Erro ao carregar questões:", erro);
        subtitulo.textContent = "Não foi possível carregar as questões.";
        return;
    }
 
    if (questoes.length === 0) {
        areaVazia.classList.remove("oculto");
        return;
    }
 
    areaQuestao.classList.remove("oculto");
    mostrarQuestao();
}
 
// =========================
// MOSTRAR UMA QUESTÃO
// =========================
function mostrarQuestao() {
    const questao = questoes[indice];
 
    const acertos = respostas.filter(r => r.acertou).length;
    const erros = respostas.length - acertos;
 
    contador.textContent = "Questão " + (indice + 1) + " de " + questoes.length;
    placar.textContent = acertos + " acertos · " + erros + " erros";
    barra.style.width = Math.round((indice / questoes.length) * 100) + "%";
 
    tagMateria.textContent = questao.materia;
    tagAssunto.textContent = questao.assunto;
    enunciado.textContent = questao.questao;
 
    inputResposta.value = "";
    inputResposta.readOnly = false;
 
    gabarito.classList.add("oculto");
    btnMostrar.classList.remove("oculto");
 
    inputResposta.focus();
}
 
// =========================
// MOSTRAR A RESPOSTA CORRETA
// =========================
btnMostrar.addEventListener("click", function () {
    const questao = questoes[indice];
 
    textoSua.textContent = inputResposta.value.trim() || "(não informada)";
    textoCorreta.textContent = questao.resposta_correta;
 
    if (questao.observacao && questao.observacao.trim()) {
        textoObs.textContent = questao.observacao;
        linhaObs.classList.remove("oculto");
    } else {
        linhaObs.classList.add("oculto");
    }
 
    inputResposta.readOnly = true;
 
    btnMostrar.classList.add("oculto");
    gabarito.classList.remove("oculto");
});
 
// =========================
// ACERTEI / ERREI
// =========================
function registrar(acertou) {
    respostas.push({
        erro_id: questoes[indice].id,
        acertou: acertou
    });
 
    indice++;
 
    if (indice < questoes.length) {
        mostrarQuestao();
    } else {
        finalizar();
    }
}
 
btnAcertei.addEventListener("click", function () {
    registrar(true);
});
 
btnErrei.addEventListener("click", function () {
    registrar(false);
});
 
// =========================
// FINALIZAR: MOSTRA E SALVA O RESULTADO
// =========================
async function finalizar() {
    areaQuestao.classList.add("oculto");
 
    const total = respostas.length;
    const acertos = respostas.filter(r => r.acertou).length;
    const erros = total - acertos;
    const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
 
    document.getElementById("rv_res_total").textContent = total;
    document.getElementById("rv_res_acertos").textContent = acertos;
    document.getElementById("rv_res_erros").textContent = erros;
    document.getElementById("rv_res_pct").textContent = pct + "%";
 
    const textoSalvo = document.getElementById("rv_res_salvo");
 
    areaResultado.classList.remove("oculto");
    textoSalvo.textContent = "Salvando resultado...";
 
    try {
        const resposta = await fetch("/api/revisoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                materia: materia,
                assunto: assunto,
                modo: modo,
                itens: respostas
            })
        });
 
        const resultado = await resposta.json();
 
        if (!resposta.ok) {
            throw new Error(resultado.erro);
        }
 
        textoSalvo.textContent = "Resultado salvo no histórico de revisões.";
    } catch (erro) {
        textoSalvo.textContent =
            "Não foi possível salvar o resultado: " + erro.message;
    }
}
 
// Revisar novamente: recarrega a página e sorteia as questões que ainda faltam
btnNovamente.addEventListener("click", function () {
    window.location.reload();
});
 
iniciar();
 