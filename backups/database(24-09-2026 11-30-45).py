from flask import Flask

app = Flask(___name___)
@app.route("/")
def inicio():
    return "StudyMetrics"