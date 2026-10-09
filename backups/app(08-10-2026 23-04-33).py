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


@app.route("/reviso_questoes.html")
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

    nome = (dados.get("nome") or "").strip()
    assunto = (dados.get("assunto") or "").strip()
    material = dados.get("material")
    link_material = dados.get("link_material")
    dificuldade = dados.get("dificuldade")
    prioridade = dados.get("prioridade")
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


if __name__ == "__main__":
    app.run(debug=True)