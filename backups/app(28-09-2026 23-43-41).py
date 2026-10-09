from flask import Flask, render_template, jsonify
from database import init_db, get_db

app = Flask(__name__)

init_db()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/materias")
def listar_materias():
    conn = get_db()

    materias = conn.execute("""
        SELECT *
        FROM materias
        ORDER BY nome
    """).fetchall()

    conn.close()

    return jsonify([
        dict(materia)
        for materia in materias
    ])


if __name__ == "__main__":
    app.run(debug=True)


@app.route("/api/materias", methods=["POST"])
def cadastrar_materia():
    from flask import request

    dados = request.get_json()

    nome = dados.get("nome")
    dificuldade = dados.get("dificuldade")
    prioridade = dados.get("prioridade")
    observacoes = dados.get("observacoes")

    if not nome:
        return jsonify({
            "erro": "O nome da matéria é obrigatório"
        }), 400

    conn = get_db()

    cursor = conn.execute("""
        INSERT INTO materias (
            nome,
            dificuldade,
            prioridade,
            observacoes
        )
        VALUES (?, ?, ?, ?)
    """, (
        nome,
        dificuldade,
        prioridade,
        observacoes
    ))

    conn.commit()

    materia_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "id": materia_id,
        "mensagem": "Matéria cadastrada com sucesso"
    }), 201    