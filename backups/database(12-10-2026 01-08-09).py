import sqlite3
from pathlib import Path

# O banco fica sempre dentro de back_end/database/
DATABASE = Path(__file__).parent / "database" / "studymetrics.db"


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DATABASE.parent.mkdir(parents=True, exist_ok=True)

    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS materias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            assunto TEXT NOT NULL,
            material TEXT,
            link_material TEXT,
            dificuldade TEXT DEFAULT 'medio',
            prioridade TEXT DEFAULT 'normal',
            observacao TEXT,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS sessoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            materia TEXT NOT NULL,
            assunto TEXT NOT NULL,
            tempo_planejado INTEGER DEFAULT 0,
            tempo_segundos INTEGER DEFAULT 0,
            meta_questoes INTEGER DEFAULT 0,
            questoes_realizadas INTEGER DEFAULT 0,
            acertos INTEGER DEFAULT 0,
            observacao TEXT,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()