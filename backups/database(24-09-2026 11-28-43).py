from Flask import Flask

app = Flask(___name___)
@app.route("/")
def inicio():
    return "<p>Hello , World!</p>"