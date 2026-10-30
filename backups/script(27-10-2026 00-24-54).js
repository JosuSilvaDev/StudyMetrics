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

/* StudyMetrics · Calendário da sessão de estudo
   Mostra, em cada dia, as matérias estudadas (vindas de /api/sessoes). */
(function () {
  'use strict';

  var MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var MESES_CURTOS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var DIAS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  // Mesmas cores do Dashboard
  var CORES = ['#14b8a6','#3b82f6','#8b5cf6','#f59e0b','#22c55e','#ef4444','#0ea5e9','#ec4899'];

  var elGrade = document.getElementById('cal_dias');
  if (!elGrade) return;
  var elTitulo = document.getElementById('cal_titulo');
  var elDetalhe = document.getElementById('cal_detalhe');
  var elLegenda = document.getElementById('cal_legenda');
  var btnAnt = document.getElementById('cal_anterior');
  var btnProx = document.getElementById('cal_proximo');
  var btnModo = document.getElementById('cal_modo');
  var iconeModo = document.getElementById('cal_icone_modo');

  var hoje = new Date();
  var estado = { ref: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()), modo: 'mes', selecionado: chave(hoje), sessoes: {} };
  var coresPorMateria = {};

  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function chave(d) { return d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate()); }
  function deChave(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  function paraChave(v) {
    if (!v) return null;
    var s = String(v), m;
    // Data do banco (UTC, "AAAA-MM-DD HH:MM:SS") -> dia local
    var mt = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?$/);
    if (mt) {
      var utc = new Date(mt[1] + 'T' + mt[2] + 'Z');
      if (!isNaN(utc.getTime())) return chave(utc);
    }
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[1] + '-' + m[2] + '-' + m[3];
    if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/))) return m[3] + '-' + m[2] + '-' + m[1];
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : chave(d);
  }

  function corDa(materia) {
    var nome = String(materia || 'Sem matéria').trim().toLowerCase();
    if (!(nome in coresPorMateria)) {
      var h = 0;
      for (var i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
      coresPorMateria[nome] = CORES[h % CORES.length];
    }
    return coresPorMateria[nome];
  }

  function formatarTempo(s) {
    var seg = null;
    if (s.tempo_segundos != null) seg = +s.tempo_segundos;
    else if (s.duracao_segundos != null) seg = +s.duracao_segundos;
    else if (s.segundos != null) seg = +s.segundos;
    else if (s.tempo_minutos != null) seg = +s.tempo_minutos * 60;
    else if (s.minutos != null) seg = +s.minutos * 60;
    else if (typeof s.tempo === 'string') return s.tempo;
    else if (typeof s.duracao === 'string') return s.duracao;
    if (seg == null || isNaN(seg)) return '';
    var h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60);
    return h ? h + 'h' + dois(m) : m + ' min';
  }

  function normalizar(lista) {
    var mapa = {};
    lista.forEach(function (s) {
      var k = paraChave(s.data != null ? s.data : (s.data_sessao || s.data_estudo || s.criado_em || s.created_at));
      if (!k) return;
      var materia = s.materia || s.materia_nome || s.nome_materia || s.disciplina || 'Sem matéria';
      var q = s.questoes_realizadas != null ? s.questoes_realizadas : s.questoes;
      (mapa[k] = mapa[k] || []).push({
        materia: String(materia),
        assunto: s.assunto || '',
        tempo: formatarTempo(s),
        questoes: q,
        acertos: s.acertos
      });
    });
    return mapa;
  }

  function materiasDoDia(k) {
    var vistos = {}, out = [];
    (estado.sessoes[k] || []).forEach(function (s) {
      if (!vistos[s.materia]) { vistos[s.materia] = 1; out.push(s.materia); }
    });
    return out;
  }

  function el(tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function diasVisiveis() {
    var r = estado.ref, dias = [], ini, total;
    if (estado.modo === 'semana') {
      ini = new Date(r.getFullYear(), r.getMonth(), r.getDate() - r.getDay());
      total = 7;
    } else {
      var primeiro = new Date(r.getFullYear(), r.getMonth(), 1);
      var qtd = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
      ini = new Date(r.getFullYear(), r.getMonth(), 1 - primeiro.getDay());
      total = Math.ceil((primeiro.getDay() + qtd) / 7) * 7;
    }
    for (var i = 0; i < total; i++) dias.push(new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i));
    return dias;
  }

  function desenhar() {
    var r = estado.ref, hojeK = chave(new Date());
    elTitulo.textContent = MESES[r.getMonth()] + ' ' + r.getFullYear();
    elGrade.textContent = '';
    var materiasMes = {};

    diasVisiveis().forEach(function (d) {
      var k = chave(d), mats = materiasDoDia(k);
      var fora = estado.modo === 'mes' && d.getMonth() !== r.getMonth();
      var b = el('button', 'cal-dia' + (fora ? ' fora' : '') + (k === hojeK ? ' hoje' : '') + (k === estado.selecionado ? ' ativo' : '') + (mats.length ? ' tem-estudo' : ''));
      b.type = 'button';
      b.setAttribute('aria-label', d.getDate() + ' de ' + MESES[d.getMonth()].toLowerCase() + (mats.length ? ': ' + mats.join(', ') : ': sem estudo'));
      b.appendChild(el('span', 'cal-num', d.getDate()));
      var chips = el('div', 'cal-chips');
      mats.slice(0, 2).forEach(function (m) {
        var c = el('span', 'cal-chip', m);
        c.title = m;
        c.style.setProperty('--cor', corDa(m));
        chips.appendChild(c);
      });
      if (mats.length > 2) chips.appendChild(el('span', 'cal-mais', '+' + (mats.length - 2)));
      b.appendChild(chips);
      b.addEventListener('click', function () { estado.selecionado = k; desenhar(); });
      elGrade.appendChild(b);
      if (!fora) mats.forEach(function (m) { materiasMes[m] = 1; });
    });

    desenharLegenda(Object.keys(materiasMes));
    desenharDetalhe();
  }

  function desenharLegenda(lista) {
    elLegenda.textContent = '';
    if (!lista.length) { elLegenda.appendChild(el('span', null, 'Nenhuma sessão registrada neste período.')); return; }
    lista.forEach(function (m) {
      var s = el('span');
      var p = el('i', 'ponto');
      p.style.setProperty('--cor', corDa(m));
      s.appendChild(p);
      s.appendChild(document.createTextNode(m));
      elLegenda.appendChild(s);
    });
  }

  function desenharDetalhe() {
    var d = deChave(estado.selecionado);
    elDetalhe.textContent = '';
    elDetalhe.appendChild(el('h4', null, DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()].toLowerCase()));
    var lista = estado.sessoes[estado.selecionado] || [];
    if (!lista.length) { elDetalhe.appendChild(el('p', 'cal-vazio', 'Nenhum estudo registrado neste dia.')); return; }
    lista.forEach(function (s) {
      var item = el('div', 'cal-item');
      item.style.setProperty('--cor', corDa(s.materia));
      item.appendChild(el('span', 'cal-item-barra'));
      var txt = el('div');
      txt.appendChild(el('strong', null, s.materia));
      if (s.assunto) txt.appendChild(el('small', null, s.assunto));
      item.appendChild(txt);
      var meta = [];
      if (s.tempo) meta.push(s.tempo);
      if (s.questoes != null && s.questoes !== '') meta.push(s.acertos != null ? s.acertos + '/' + s.questoes + ' questões' : s.questoes + ' questões');
      item.appendChild(el('span', 'cal-item-meta', meta.join(' · ')));
      elDetalhe.appendChild(item);
    });
  }

  function mover(passo) {
    var r = estado.ref;
    estado.ref = estado.modo === 'semana'
      ? new Date(r.getFullYear(), r.getMonth(), r.getDate() + 7 * passo)
      : new Date(r.getFullYear(), r.getMonth() + passo, 1);
    desenhar();
  }

  btnAnt.addEventListener('click', function () { mover(-1); });
  btnProx.addEventListener('click', function () { mover(1); });
  btnModo.addEventListener('click', function () {
    estado.modo = estado.modo === 'mes' ? 'semana' : 'mes';
    estado.ref = deChave(estado.selecionado);
    iconeModo.className = 'bi ' + (estado.modo === 'mes' ? 'bi-arrows-collapse' : 'bi-arrows-expand');
    desenhar();
  });

  function carregar() {
    fetch('/api/sessoes')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (dados) {
        var lista = Array.isArray(dados) ? dados : (dados && (dados.sessoes || dados.dados)) || [];
        estado.sessoes = normalizar(lista);
        desenhar();
      })
      .catch(function () { desenhar(); });
  }

  // Recarrega o calendário quando uma sessão é salva (POST/PUT/DELETE em /api/sessoes)
  var fetchOriginal = window.fetch;
  if (fetchOriginal) {
    window.fetch = function (entrada, opcoes) {
      var p = fetchOriginal.apply(this, arguments);
      try {
        var url = typeof entrada === 'string' ? entrada : entrada.url;
        var metodo = ((opcoes && opcoes.method) || (entrada && entrada.method) || 'GET').toUpperCase();
        if (metodo !== 'GET' && /\/api\/sessoes/.test(url)) {
          p.then(function () { setTimeout(carregar, 300); }, function () {});
        }
      } catch (e) {}
      return p;
    };
  }

  window.recarregarCalendario = carregar;
  desenhar();
  carregar();
})();
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
// =========================
// AVANÇAR
// =========================

btnProximo.addEventListener("click", function () {

    if (modoSemana) {

        dataCalendario.setDate(dataCalendario.getDate() + 7);

    } else {

        dataCalendario.setDate(1);
        dataCalendario.setMonth(dataCalendario.getMonth() + 1);

    }

    gerarCalendario();

});


// =========================
// AVANÇAR
// =========================

btnProximo.addEventListener("click", function () {

    if (modoSemana) {

        dataCalendario.setDate(dataCalendario.getDate() + 7);

    } else {

        dataCalendario.setDate(1);
        dataCalendario.setMonth(dataCalendario.getMonth() + 1);

    }

    gerarCalendario();

});

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



