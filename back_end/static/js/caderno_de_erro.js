// =========================
// ELEMENTOS DA PÁGINA
// =========================
const form = document.getElementById("form_erro");
const selectMateria = document.getElementById("disciplina");
const listaAssuntos = document.getElementById("lista_assuntos");
const corpoTabela = document.getElementById("tabela_erros");
const listaMotivos = document.getElementById("lista_motivos");
const botoesFiltro = document.querySelectorAll(".filtros-erros .filtro");

// Nome e ícone de cada motivo (os mesmos valores do formulário)
const MOTIVOS = {
    nao_sabia:     { nome: "Não sabia",       icone: "bi-question-circle" },
    esqueci:       { nome: "Esqueci",         icone: "bi-clock-history" },
    interpretacao: { nome: "Interpretação",   icone: "bi-book-half" },
    desatencao:    { nome: "Desatenção",      icone: "bi-eye" },
    confusao:      { nome: "Confusão",        icone: "bi-shuffle" },
    calculo:       { nome: "Erro de cálculo", icone: "bi-calculator" },
    chute:         { nome: "Chute",           icone: "bi-dice-5" }
};

let materias = [];
let erros = [];
let filtroAtual = "todos";

// Evita que um texto digitado vire código HTML
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function infoMotivo(chave) {
    return MOTIVOS[chave] || { nome: chave, icone: "bi-question-circle" };
}

// =========================
// MATÉRIAS DO BANCO
// =========================
async function carregarMaterias() {
    try {
        const resposta = await fetch("/api/materias");
        materias = await resposta.json();
    } catch (erro) {
        console.error("Erro ao carregar matérias:", erro);
        return;
    }

    // Uma matéria pode ter vários assuntos: mostra cada nome uma vez só
    const nomes = [...new Set(materias.map(m => m.nome))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));

    selectMateria.innerHTML = "";

    if (nomes.length === 0) {
        selectMateria.add(new Option("Nenhuma matéria cadastrada", ""));
        return;
    }

    selectMateria.add(new Option("Selecione uma matéria", ""));
    nomes.forEach(nome => selectMateria.add(new Option(nome, nome)));
}

// Ao escolher a matéria, sugere os assuntos dela
selectMateria.addEventListener("change", function () {
    listaAssuntos.innerHTML = "";

    const assuntos = [...new Set(
        materias
            .filter(m => m.nome === selectMateria.value)
            .map(m => m.assunto)
    )];

    assuntos.forEach(assunto => {
        const opcao = document.createElement("option");
        opcao.value = assunto;
        listaAssuntos.appendChild(opcao);
    });
});

// =========================
// TELA
// =========================
function formatarData(criadoEm) {
    // O banco guarda a hora em UTC; aqui vira a data local
    return new Date(criadoEm.replace(" ", "T") + "Z")
        .toLocaleDateString("pt-BR");
}

function desenharTabela() {
    const lista = filtroAtual === "revisar"
        ? erros.filter(e => e.para_revisar === 1)
        : erros;

    if (lista.length === 0) {
        corpoTabela.innerHTML =
            '<tr><td colspan="5">Nenhum erro encontrado.</td></tr>';
        return;
    }

    corpoTabela.innerHTML = lista.map(function (e) {
        const motivo = infoMotivo(e.motivo);

        const revisar = e.para_revisar === 1
            ? '<span class="badge-revisao"><i class="bi bi-arrow-repeat"></i> Sim</span>'
            : '<span class="badge-nao">Não</span>';

        return `
            <tr>
                <td>${formatarData(e.criado_em)}</td>
                <td>${escapar(e.materia)}</td>
                <td>${escapar(e.assunto)}</td>
                <td>
                    <span class="badge-motivo">
                        <i class="bi ${motivo.icone}"></i>
                        ${motivo.nome}
                    </span>
                </td>
                <td>${revisar}</td>
            </tr>`;
    }).join("");
}

function desenharResumo() {
    // Conta quantos erros existem por motivo
    const contagem = {};

    erros.forEach(function (e) {
        contagem[e.motivo] = (contagem[e.motivo] || 0) + 1;
    });

    const ordenados = Object.entries(contagem).sort((a, b) => b[1] - a[1]);

    // Cartões do topo
    document.getElementById("total_erros").textContent = erros.length;
    document.getElementById("total_revisoes").textContent =
        erros.filter(e => e.para_revisar === 1).length;
    document.getElementById("motivo_principal").textContent =
        ordenados.length > 0 ? infoMotivo(ordenados[0][0]).nome : "-";

    // Barras dos motivos mais frequentes
    if (ordenados.length === 0) {
        listaMotivos.innerHTML = "<p>Nenhum erro registrado ainda.</p>";
        return;
    }

    const maior = ordenados[0][1];

    listaMotivos.innerHTML = ordenados.map(function (item) {
        const motivo = infoMotivo(item[0]);
        const largura = Math.round((item[1] / maior) * 100);

        return `
            <div class="linha-motivo">
                <div class="motivo-info">
                    <span>
                        <i class="bi ${motivo.icone}"></i>
                        ${motivo.nome}
                    </span>
                    <strong>${item[1]}</strong>
                </div>
                <div class="barra">
                    <div class="barra-progresso" style="width:${largura}%"></div>
                </div>
            </div>`;
    }).join("");
}

async function carregarErros() {
    try {
        const resposta = await fetch("/api/erros");
        erros = await resposta.json();
        desenharTabela();
        desenharResumo();
    } catch (erro) {
        console.error("Erro ao carregar erros:", erro);
    }
}

// =========================
// FILTROS
// =========================
botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {
        filtroAtual = botao.dataset.filtro;

        botoesFiltro.forEach(b => b.classList.remove("ativo"));
        botao.classList.add("ativo");

        desenharTabela();
    });
});

// =========================
// SALVAR ERRO
// =========================
form.addEventListener("submit", async function (evento) {
    // Impede o envio padrão (que só recarrega a página)
    evento.preventDefault();

    const motivoEscolhido = form.querySelector('input[name="motivo_erro"]:checked');

    const dados = {
        questao: document.getElementById("questao").value,
        materia: selectMateria.value,
        assunto: document.getElementById("assunto").value,
        motivo: motivoEscolhido ? motivoEscolhido.value : "",
        resposta_correta: document.getElementById("resposta_correta").value,
        observacao: document.getElementById("observacao_erro").value,
        para_revisar: document.getElementById("adicionar_revisao").checked
    };

    const resposta = await fetch("/api/erros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
        alert(resultado.erro);
        return;
    }

    form.reset();
    listaAssuntos.innerHTML = "";

    await carregarErros();
    alert("Erro registrado com sucesso!");
});

carregarMaterias();
carregarErros();

// Separa alternativas coladas e transforma em radio box.
// Preenche o campo "Resposta correta" sozinho.
// Roda ANTES do caderno_de_erro.js e não mexe nele.

(function () {
    const $ = (id) => document.getElementById(id);

    const form = $('form_erro');
    const enunciado = $('questao');
    const colar = $('alternativas_colar');
    const tipoSel = $('tipo_questao');
    const lista = $('lista_alternativas');
    const area = $('area_alternativas');
    const resposta = $('resposta_correta');

    let atual = null; // { tipo, itens }

    /* ---------- SEPARAR O TEXTO ---------- */

    // A) B) C) ... mesmo que esteja tudo na mesma linha
    function separarMC(texto) {
        const limpo = texto.replace(/\r/g, '').replace(/\s+(?=\(?[A-Ea-e][\)\.]\s)/g, '\n');
        const alts = [];
        limpo.split('\n').forEach(linha => {
            const m = linha.match(/^\s*\(?([A-Ea-e])[\)\.\-:]\s*(.+)$/);
            if (m) alts.push({ letra: m[1].toUpperCase(), texto: m[2].trim() });
            else if (linha.trim() && alts.length) alts[alts.length - 1].texto += ' ' + linha.trim();
        });
        return alts;
    }

    // V ou F / Certo ou Errado: cada linha vira uma afirmação
    function separarAfirmacoes(texto) {
        return texto.replace(/\r/g, '').split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .map(l => l.replace(/^(\(\s*[VFCEvfce]?\s*\)|[IVXivx]+\s*[\-\.\)]|\d+\s*[\-\.\)]|[-•*])\s*/, '').trim())
            .filter(Boolean)
            .map((t, i) => ({ n: i + 1, texto: t }));
    }

    /* ---------- DESENHAR OS RADIOS ---------- */

    function desenhar() {
        lista.innerHTML = '';

        if (atual.tipo === 'mc') {
            atual.itens.forEach(a => {
                const l = document.createElement('label');
                l.className = 'motivo-card';
                l.innerHTML = '<input type="radio" name="gabarito_mc" value="' + a.letra + '"><b>' + a.letra + ')</b><span></span>';
                l.querySelector('span').textContent = a.texto;
                lista.appendChild(l);
            });
        } else {
            const op = atual.tipo === 'ce' ? ['Certo', 'Errado'] : ['V', 'F'];
            atual.itens.forEach(it => {
                const d = document.createElement('div');
                d.className = 'item-vf';
                d.innerHTML =
                    '<div class="texto-vf"></div>' +
                    '<div class="opcoes-vf">' +
                    '<label><input type="radio" name="gab_' + it.n + '" value="' + op[0] + '"> ' + op[0] + '</label>' +
                    '<label><input type="radio" name="gab_' + it.n + '" value="' + op[1] + '"> ' + op[1] + '</label>' +
                    '</div>';
                d.querySelector('.texto-vf').textContent = it.n + '. ' + it.texto;
                lista.appendChild(d);
            });
        }
        area.hidden = false;
    }

    /* ---------- PREENCHER "RESPOSTA CORRETA" ---------- */

    function atualizarResposta() {
        if (!atual) return;

        if (atual.tipo === 'mc') {
            const s = document.querySelector('input[name="gabarito_mc"]:checked');
            resposta.value = s ? 'Alternativa ' + s.value : '';
        } else {
            const partes = atual.itens.map(it => {
                const s = document.querySelector('input[name="gab_' + it.n + '"]:checked');
                return s ? it.n + '-' + s.value : null;
            });
            resposta.value = partes.every(Boolean) ? partes.join(', ') : '';
        }
    }

    lista.addEventListener('change', atualizarResposta);

    /* ---------- BOTÃO SEPARAR ---------- */

    $('btn_separar').addEventListener('click', () => {
        const texto = colar.value.trim();
        if (!texto) { alert('Cole as alternativas primeiro.'); return; }

        let tipo = tipoSel.value;
        if (tipo === 'auto') tipo = separarMC(texto).length >= 2 ? 'mc' : 'vf';

        const itens = tipo === 'mc' ? separarMC(texto) : separarAfirmacoes(texto);
        if (!itens.length) { alert('Não consegui separar. Confira o texto colado.'); return; }

        atual = { tipo, itens };
        resposta.value = '';
        desenhar();
    });

    /* ---------- AO SALVAR: junta as alternativas ao enunciado ---------- */
    // Assim as alternativas ficam guardadas junto com a questão,
    // sem precisar mudar o banco nem o caderno_de_erro.js.

    form.addEventListener('submit', () => {
        if (!atual) return;
        const extra = atual.tipo === 'mc'
            ? atual.itens.map(a => a.letra + ') ' + a.texto).join('\n')
            : atual.itens.map(a => a.n + '. ' + a.texto).join('\n');
        if (!enunciado.value.includes(extra)) {
            enunciado.value = enunciado.value.trim() + '\n\n' + extra;
        }
    }, true); // "true" = roda antes do seu outro script

    // Limpa os radios quando o formulário é limpo
    form.addEventListener('reset', () => {
        atual = null;
        lista.innerHTML = '';
        area.hidden = true;
    });
})();