import sqlite3 

conn = sqlite3.connect("C:\\Users\\user\\Documents\\Projeto_de_aprendizagem\\back_end\\database.db")
conn.execute("DROP TABLE IF EXISTS materias")

conn.execute(""""
CREATE TABLE materias(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL, 
    assunto TEXT NOT NULL, 
    material TEXT NOT NULL,
    link_material TEXT ,
    dificuldade = dados.get("dificuldade", "Média")
    prioridade INTEGER ,
    observacoes TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP)""""")

conn.commit()
conn.close()
print("Tabela rescriada com sucesso!")

import sqlite3
from pathlib import Path

# Pasta onde está este arquivo database.py
PASTA = Path(__file__).parent
CAMINHO_BANCO = PASTA / "studymetrics.db"


def get_db():
    conn = sqlite3.connect(CAMINHO_BANCO)
    conn.row_factory = sqlite3.Row
    return conn