from flask import Flask, render_template, jsonify, request

from database import init_db, get_db


app = Flask(__name__)

# Cria o banco e as tabelas quando o sistema inicia
init_db()


# =========================================================
# PÁGINAS
# =========================================================

@app.route("/")
@app.route("/index.html")
def index():
    return render_template("index.html")


@app.route("/materias.html")
def pagina_materias():
    return render_template("materias.html")


@app.route("/sessao.html")
def pagina_sessao():
    return render_template("sessao.html")


@app.route("/caderno_de_questos.html")
def pagina_caderno():
    return render_template("caderno_de_questos.html")


@app.route("/revisoes.html")
@app.route("/revisao.html")
def pagina_revisoes():
    return render_template("revisao.html")


@app.route("/revisao_questoes.html")
def pagina_revisao_questoes():
    return render_template("revisao_questoes.html")


@app.route("/perfil.html")
def pagina_perfil():
    return render_template("perfil.html")


# =========================================================
# API DE MATÉRIAS
# =========================================================

@app.route("/api/materias", methods=["GET"])
def listar_materias():
    conn = get_db()

    try:
        materias = conn.execute("""
            SELECT
                id,
                nome,
                assunto,
                material,
                link_material,
                dificuldade,
                prioridade,
                observacao,
                criado_em
            FROM materias
            ORDER BY nome
        """).fetchall()
    finally:
        conn.close()

    return jsonify([dict(materia) for materia in materias])


@app.route("/api/materias", methods=["POST"])
def cadastrar_materia():
    dados = request.get_json(silent=True)

    if not dados:
        return jsonify({"erro": "Nenhum dado foi enviado."}), 400

    nome = (dados.get("nome") or dados.get("materia") or "").strip()
    assunto = (dados.get("assunto") or "").strip()
    material = dados.get("material")
    link_material = dados.get("link_material")
    dificuldade = dados.get("dificuldade") or dados.get("nivel_dificuldade") or "medio"
    prioridade = dados.get("prioridade") or "media"
    observacao = dados.get("observacao")

    if not nome:
        return jsonify({"erro": "O nome da matéria é obrigatório."}), 400

    if not assunto:
        return jsonify({"erro": "O assunto é obrigatório."}), 400

    conn = get_db()

    try:
        cursor = conn.execute("""
            INSERT INTO materias (
                nome,
                assunto,
                material,
                link_material,
                dificuldade,
                prioridade,
                observacao
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            nome,
            assunto,
            material,
            link_material,
            dificuldade,
            prioridade,
            observacao
        ))

        conn.commit()
        materia_id = cursor.lastrowid
    finally:
        conn.close()

    return jsonify({
        "id": materia_id,
        "mensagem": "Matéria cadastrada com sucesso."
    }), 201


@app.route("/api/materias/<int:materia_id>", methods=["PUT"])
def editar_materia(materia_id):
    dados = request.get_json(silent=True)

    if not dados:
        return jsonify({"erro": "Nenhum dado foi enviado."}), 400

    nome = (dados.get("nome") or dados.get("materia") or "").strip()
    assunto = (dados.get("assunto") or "").strip()
    material = dados.get("material")
    link_material = dados.get("link_material")
    dificuldade = dados.get("dificuldade") or dados.get("nivel_dificuldade") or "medio"
    prioridade = dados.get("prioridade") or "media"
    observacao = dados.get("observacao")

    if not nome:
        return jsonify({"erro": "O nome da matéria é obrigatório."}), 400

    if not assunto:
        return jsonify({"erro": "O assunto é obrigatório."}), 400

    conn = get_db()

    try:
        cursor = conn.execute("""
            UPDATE materias
            SET nome = ?,
                assunto = ?,
                material = ?,
                link_material = ?,
                dificuldade = ?,
                prioridade = ?,
                observacao = ?
            WHERE id = ?
        """, (
            nome,
            assunto,
            material,
            link_material,
            dificuldade,
            prioridade,
            observacao,
            materia_id
        ))

        conn.commit()
        alteradas = cursor.rowcount
    finally:
        conn.close()

    if alteradas == 0:
        return jsonify({"erro": "Matéria não encontrada."}), 404

    return jsonify({"mensagem": "Matéria atualizada com sucesso."})


@app.route("/api/materias/<int:materia_id>", methods=["DELETE"])
def excluir_materia(materia_id):
    conn = get_db()

    try:
        cursor = conn.execute(
            "DELETE FROM materias WHERE id = ?",
            (materia_id,)
        )

        conn.commit()
        apagadas = cursor.rowcount
    finally:
        conn.close()

    if apagadas == 0:
        return jsonify({"erro": "Matéria não encontrada."}), 404

    return jsonify({"mensagem": "Matéria excluída com sucesso."})


# =========================================================
# API DE SESSÕES DE ESTUDO
# =========================================================

def para_inteiro(valor):
    try:
        return max(int(valor), 0)
    except (TypeError, ValueError):
        return 0


@app.route("/api/sessoes", methods=["GET"])
def listar_sessoes():
    conn = get_db()

    try:
        sessoes = conn.execute("""
            SELECT
                id,
                materia,
                assunto,
                tempo_planejado,
                tempo_segundos,
                meta_questoes,
                questoes_realizadas,
                acertos,
                observacao,
                criado_em
            FROM sessoes
            ORDER BY id DESC
            LIMIT 50
        """).fetchall()
    finally:
        conn.close()

    return jsonify([dict(sessao) for sessao in sessoes])


@app.route("/api/sessoes", methods=["POST"])
def cadastrar_sessao():
    dados = request.get_json(silent=True)

    if not dados:
        return jsonify({"erro": "Nenhum dado foi enviado."}), 400

    materia = (dados.get("materia") or "").strip()
    assunto = (dados.get("assunto") or "").strip()
    tempo_planejado = para_inteiro(dados.get("tempo_planejado"))
    tempo_segundos = para_inteiro(dados.get("tempo_segundos"))
    meta_questoes = para_inteiro(dados.get("meta_questoes"))
    questoes_realizadas = para_inteiro(dados.get("questoes_realizadas"))
    acertos = para_inteiro(dados.get("acertos"))
    observacao = dados.get("observacao")

    if not materia:
        return jsonify({"erro": "A matéria é obrigatória."}), 400

    if not assunto:
        return jsonify({"erro": "O assunto é obrigatório."}), 400

    if acertos > questoes_realizadas:
        return jsonify({
            "erro": "Os acertos não podem ser maiores que as questões."
        }), 400

    conn = get_db()

    try:
        cursor = conn.execute("""
            INSERT INTO sessoes (
                materia,
                assunto,
                tempo_planejado,
                tempo_segundos,
                meta_questoes,
                questoes_realizadas,
                acertos,
                observacao
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            materia,
            assunto,
            tempo_planejado,
            tempo_segundos,
            meta_questoes,
            questoes_realizadas,
            acertos,
            observacao
        ))

        conn.commit()
        sessao_id = cursor.lastrowid
    finally:
        conn.close()

    return jsonify({
        "id": sessao_id,
        "mensagem": "Sessão salva com sucesso."
    }), 201



# =========================================================
# API DO CADERNO DE ERROS
# =========================================================

MOTIVOS_ERRO = {
    "nao_sabia", "esqueci", "interpretacao",
    "desatencao", "confusao", "calculo", "chute"
}


@app.route("/api/erros", methods=["GET"])
def listar_erros():
    conn = get_db()

    try:
        erros = conn.execute("""
            SELECT
                id,
                questao,
                materia,
                assunto,
                motivo,
                resposta_correta,
                observacao,
                para_revisar,
                criado_em
            FROM erros
            ORDER BY id DESC
        """).fetchall()
    finally:
        conn.close()

    return jsonify([dict(erro) for erro in erros])


@app.route("/api/erros", methods=["POST"])
def cadastrar_erro():
    dados = request.get_json(silent=True)

    if not dados:
        return jsonify({"erro": "Nenhum dado foi enviado."}), 400

    questao = (dados.get("questao") or "").strip()
    materia = (dados.get("materia") or "").strip()
    assunto = (dados.get("assunto") or "").strip()
    motivo = (dados.get("motivo") or "").strip()
    resposta_correta = (dados.get("resposta_correta") or "").strip()
    observacao = dados.get("observacao")
    para_revisar = 1 if dados.get("para_revisar") else 0

    if not questao:
        return jsonify({"erro": "O enunciado da questão é obrigatório."}), 400

    if not materia:
        return jsonify({"erro": "A matéria é obrigatória."}), 400

    if not assunto:
        return jsonify({"erro": "O assunto é obrigatório."}), 400

    if motivo not in MOTIVOS_ERRO:
        return jsonify({"erro": "Escolha o motivo do erro."}), 400

    if not resposta_correta:
        return jsonify({"erro": "A resposta correta é obrigatória."}), 400

    conn = get_db()

    try:
        cursor = conn.execute("""
            INSERT INTO erros (
                questao,
                materia,
                assunto,
                motivo,
                resposta_correta,
                observacao,
                para_revisar
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            questao,
            materia,
            assunto,
            motivo,
            resposta_correta,
            observacao,
            para_revisar
        ))

        conn.commit()
        erro_id = cursor.lastrowid
    finally:
        conn.close()

    return jsonify({
        "id": erro_id,
        "mensagem": "Erro registrado com sucesso."
    }), 201


    conn.execute("""
        CREATE TABLE IF NOT EXISTS revisoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            materia TEXT NOT NULL,
            assunto TEXT,
            modo TEXT,
            total_questoes INTEGER DEFAULT 0,
            acertos INTEGER DEFAULT 0,
            erros INTEGER DEFAULT 0,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS revisoes_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            revisao_id INTEGER NOT NULL,
            erro_id INTEGER NOT NULL,
            acertou INTEGER NOT NULL,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

# =========================================================
# API DE REVISÕES
# =========================================================

# Questão pendente = marcada para revisar e que não foi acertada
# na última vez em que apareceu em uma revisão.
SQL_PENDENTES = """
    FROM erros e
    WHERE e.para_revisar = 1
    AND COALESCE((
        SELECT acertou FROM revisoes_itens
        WHERE erro_id = e.id
        ORDER BY id DESC
        LIMIT 1
    ), 0) = 0
"""


@app.route("/api/revisoes/resumo", methods=["GET"])
def resumo_revisoes():
    conn = get_db()

    try:
        marcados = conn.execute("""
            SELECT
                e.id,
                e.materia,
                e.assunto,
                (SELECT acertou FROM revisoes_itens
                 WHERE erro_id = e.id
                 ORDER BY id DESC LIMIT 1) AS ultimo,
                (SELECT COUNT(*) FROM revisoes_itens
                 WHERE erro_id = e.id) AS respondidas,
                (SELECT COALESCE(SUM(acertou), 0) FROM revisoes_itens
                 WHERE erro_id = e.id) AS acertos,
                (SELECT MAX(criado_em) FROM revisoes_itens
                 WHERE erro_id = e.id) AS ultima
            FROM erros e
            WHERE e.para_revisar = 1
        """).fetchall()

        totais = conn.execute("""
            SELECT COUNT(*) AS total, COALESCE(SUM(acertou), 0) AS acertos
            FROM revisoes_itens
        """).fetchone()

        hoje = conn.execute("""
            SELECT COUNT(*) AS total
            FROM revisoes_itens
            WHERE date(criado_em, 'localtime') = date('now', 'localtime')
        """).fetchone()

        historico = conn.execute("""
            SELECT id, materia, assunto, total_questoes,
                   acertos, erros, criado_em
            FROM revisoes
            ORDER BY id DESC
            LIMIT 30
        """).fetchall()
    finally:
        conn.close()

    grupos = {}
    para_revisar = 0
    revisadas = 0

    for m in marcados:
        pendente = m["ultimo"] is None or m["ultimo"] == 0

        grupo = grupos.setdefault((m["materia"], m["assunto"]), {
            "materia": m["materia"],
            "assunto": m["assunto"],
            "pendentes": 0,
            "respondidas": 0,
            "acertos": 0,
            "ultima": None
        })

        if pendente:
            grupo["pendentes"] += 1
            para_revisar += 1
        else:
            revisadas += 1

        grupo["respondidas"] += m["respondidas"]
        grupo["acertos"] += m["acertos"]

        if m["ultima"] and (grupo["ultima"] is None or m["ultima"] > grupo["ultima"]):
            grupo["ultima"] = m["ultima"]

    lista = [g for g in grupos.values() if g["pendentes"] > 0]
    lista.sort(key=lambda g: (g["materia"], g["assunto"]))

    aproveitamento = 0

    if totais["total"] > 0:
        aproveitamento = round(totais["acertos"] * 100 / totais["total"])

    return jsonify({
        "para_revisar": para_revisar,
        "revisadas_hoje": hoje["total"],
        "revisadas": revisadas,
        "aproveitamento": aproveitamento,
        "grupos": lista,
        "historico": [dict(h) for h in historico]
    })


@app.route("/api/revisoes/questoes", methods=["GET"])
def questoes_para_revisar():
    materia = request.args.get("materia", "").strip()
    assunto = request.args.get("assunto", "").strip()
    limite = min(para_inteiro(request.args.get("limite")) or 10, 100)

    filtros = ""
    parametros = []

    if materia:
        filtros += " AND e.materia = ?"
        parametros.append(materia)

    if assunto:
        filtros += " AND e.assunto = ?"
        parametros.append(assunto)

    parametros.append(limite)

    conn = get_db()

    try:
        questoes = conn.execute(
            """SELECT e.id, e.materia, e.assunto, e.questao, e.motivo,
                      e.resposta_correta, e.observacao"""
            + SQL_PENDENTES
            + filtros
            + " ORDER BY RANDOM() LIMIT ?",
            parametros
        ).fetchall()
    finally:
        conn.close()

    return jsonify([dict(q) for q in questoes])


@app.route("/api/revisoes", methods=["POST"])
def registrar_revisao():
    dados = request.get_json(silent=True)

    if not dados:
        return jsonify({"erro": "Nenhum dado foi enviado."}), 400

    materia = (dados.get("materia") or "").strip()
    assunto = (dados.get("assunto") or "").strip()
    modo = (dados.get("modo") or "").strip()
    itens = dados.get("itens")

    if not isinstance(itens, list) or len(itens) == 0:
        return jsonify({"erro": "Nenhuma questão foi respondida."}), 400

    conn = get_db()

    try:
        ids_validos = {
            linha["id"] for linha in conn.execute("SELECT id FROM erros")
        }

        validos = []

        for item in itens:
            if not isinstance(item, dict):
                continue

            erro_id = para_inteiro(item.get("erro_id"))

            if erro_id in ids_validos:
                validos.append((erro_id, 1 if item.get("acertou") else 0))

        if not validos:
            return jsonify({"erro": "Nenhuma questão válida."}), 400

        total = len(validos)
        acertos = sum(v[1] for v in validos)

        cursor = conn.execute("""
            INSERT INTO revisoes (
                materia, assunto, modo, total_questoes, acertos, erros
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (materia or "Todas", assunto, modo, total, acertos, total - acertos))

        revisao_id = cursor.lastrowid

        conn.executemany(
            "INSERT INTO revisoes_itens (revisao_id, erro_id, acertou) VALUES (?, ?, ?)",
            [(revisao_id, erro_id, acertou) for erro_id, acertou in validos]
        )

        conn.commit()
    finally:
        conn.close()

    return jsonify({
        "id": revisao_id,
        "total": total,
        "acertos": acertos,
        "mensagem": "Revisão registrada com sucesso."
    }), 201    

if __name__ == "__main__":
    app.run(debug=True)