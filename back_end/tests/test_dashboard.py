import sys
import tempfile
import unittest
import re
from contextlib import closing
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import database

# Importar o app inicializa apenas este banco temporário.
TEMP_DIR = tempfile.TemporaryDirectory()
database.DATABASE = Path(TEMP_DIR.name) / "dashboard.db"
import app


class DashboardTest(unittest.TestCase):
    def setUp(self):
        database.DATABASE.unlink(missing_ok=True)
        database.init_db()
        self.client = app.app.test_client()

    def registrar_sessao(self, dia, segundos, questoes, acertos):
        # Meio-dia local evita ambiguidade na mudança de data ao converter para UTC.
        momento = datetime.combine(dia, datetime.min.time()).replace(hour=12).astimezone(timezone.utc)
        with closing(database.get_db()) as conn, conn:
            conn.execute("""INSERT INTO sessoes
                (materia, assunto, tempo_segundos, questoes_realizadas, acertos, criado_em)
                VALUES (?, ?, ?, ?, ?, ?)""",
                ("Direito", "Lei", segundos, questoes, acertos, momento.strftime("%Y-%m-%d %H:%M:%S")))

    def test_dashboard_vazio(self):
        dados = self.client.get("/api/dashboard").get_json()
        self.assertEqual(dados["total_questoes"], 0)
        self.assertEqual(dados["perfil"]["data_aprovacao"], "")
        self.assertEqual(len(dados["grafico_horas"]), 30)
        self.assertEqual(dados["proximas_revisoes"], [])

    def test_paginas_principais_compartilham_menu_e_estilos(self):
        paginas = ("/", "/materias.html", "/sessao.html", "/historico-estudos",
                   "/caderno_de_questos.html", "/revisao.html", "/perfil.html",
                   "/calendario-estudos")
        for pagina in paginas:
            with self.subTest(pagina=pagina):
                resposta = self.client.get(pagina)
                html = resposta.get_data(as_text=True)
                self.assertEqual(resposta.status_code, 200)
                self.assertEqual(html.count('class="sidebar"'), 1)
                self.assertIn('css/tema.css', html)
                self.assertIn('menu-item ativo', html)
        for css in ("tema.css", "caderno.css", "revisao_questoes.css"):
            resposta_css = self.client.get('/static/css/' + css)
            self.assertEqual(resposta_css.status_code, 200)
            resposta_css.close()
        resposta = self.client.get('/revisao_questoes.html')
        self.assertEqual(resposta.status_code, 200)
        self.assertIn('css/tema.css', resposta.get_data(as_text=True))

    def test_elementos_usados_pelo_javascript_existem_na_pagina(self):
        class Ids(HTMLParser):
            def __init__(self):
                super().__init__()
                self.ids = set()

            def handle_starttag(self, tag, attrs):
                self.ids.update(value for name, value in attrs if name == "id")

        raiz = Path(__file__).resolve().parents[1]
        parser = Ids()
        parser.feed((raiz / "templates" / "index.html").read_text(encoding="utf-8"))
        script = (raiz / "static" / "js" / "dashboard.js").read_text(encoding="utf-8")
        ids = set(re.findall(r'el\("([\w]+)"\)', script))
        self.assertEqual(ids - parser.ids, set())

    def test_calculos_e_limite_da_semana(self):
        hoje = datetime.now().date()
        inicio = hoje - timedelta(days=(hoje.weekday() + 1) % 7)
        self.registrar_sessao(hoje, 3600, 10, 7)
        self.registrar_sessao(hoje - timedelta(days=7), 1800, 5, 3)
        self.registrar_sessao(hoje + timedelta(days=7), 1200, 4, 4)
        self.client.put("/api/perfil", json={"nome": "Ana", "data_aprovacao": "2030-01-01", "motivacoes": []})
        dados = self.client.get("/api/dashboard").get_json()
        self.assertEqual(dados["tempo_semana"], 3600)
        self.assertEqual(dados["tempo_semana_anterior"], 1800)
        self.assertEqual(dados["questoes_semana"], 10)
        self.assertEqual(dados["hoje_tempo"], 3600)
        self.assertEqual(dados["sequencia"], 1)
        self.assertEqual(dados["perfil"]["nome"], "Ana")
        self.assertEqual(dados["grafico_horas"][-1]["acertos"], 7)
        self.assertEqual(inicio.weekday(), 6)

    def test_todas_revisoes_aparecem_na_agenda(self):
        momento = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        with closing(database.get_db()) as conn, conn:
            for numero in range(6):
                conn.execute("""INSERT INTO erros (questao, materia, assunto, motivo,
                    resposta_correta, para_revisar, criado_em) VALUES (?, ?, ?, ?, ?, 1, ?)""",
                    ("Questao", "Direito", f"Assunto {numero}", "esqueci", "Resposta", momento))
        dados = self.client.get("/api/dashboard").get_json()
        self.assertEqual(len(dados["proximas_revisoes"]), 6)
        self.assertEqual(dados["total_erros"], 6)
        self.assertEqual(dados["erros_7_dias"], 6)


if __name__ == "__main__":
    unittest.main()
