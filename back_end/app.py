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


if __name__ == "__main__":
    app.run(debug=True)