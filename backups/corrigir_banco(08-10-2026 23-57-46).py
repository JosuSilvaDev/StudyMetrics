import sqlite3 

conn = sqlite3.connect("C:\\Users\\user\\Documents\\Projeto_de_aprendizagem\\back_end\\database.db")
conn.execute("DROP TABLE IF EXISTS materias")

conn.execute(""""
CREATE TABLE materias(
    id INTEGER PRIMARY KEY AUTOICREMENT,
    nome TEXT NOT NULL, 
    assunto TEXT NOT NULL, 
    material TEXT NOT NULL,
    link_material TEXT ,
    dificuldade TEXT DEFAULT "Normal",
    prioridade INTEGER ,
    observacoes TEXT