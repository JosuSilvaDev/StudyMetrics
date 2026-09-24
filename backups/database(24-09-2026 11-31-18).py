from flask import flask

app = flaskask(__name__)
@app.route("/")
def inicio():
    return "StudyMetrics"