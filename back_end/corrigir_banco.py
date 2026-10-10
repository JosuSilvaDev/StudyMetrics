from database import DATABASE, get_db

# Guarda o arquivo corrompido com outro nome, por segurança
DATABASE.parent.mkdir(parents=True, exist_ok=True)
if DATABASE.exists():
    DATABASE.rename(DATABASE.with_name("studymetrics_corrompido.db"))

# Cria um banco novo e limpo
conn = get_db()

conn.execute("""
    CREATE TABLE materias (
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

conn.commit()
conn.close()
print("Banco novo criado em:", DATABASE)