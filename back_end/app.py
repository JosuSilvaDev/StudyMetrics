from flask import Flask

app = Flask(__name__)

@app.route("/")
def inicio():
    return "StudyMetrics"

import sqlite3
from flask import Flask, render_template

app = Flask(__name__)

def conectar_bd():
    conexao = sqlite3.connect("database/studymetrics.db")
    conexao.row_factory = sqlite3.Row  # permite acessar colunas pelo nome
    return conexao

@app.route("/caderno-de-erros")
def caderno_de_erros():
    conexao = conectar_bd()
    
    materias = conexao.execute("SELECT * FROM materias").fetchall()
    
    conexao.close()
    
    return render_template("caderno_de_questoes.html", lista_de_materias=materias)