from flask import flask

app = Flask(__name__)
@app.route("/")
def inicio():
    return "StudyMetrics"