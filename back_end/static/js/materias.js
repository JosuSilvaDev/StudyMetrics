const form = document.querySelector("form");

form.addEventListener("submit", async function (evento) {
    // Impede o envio padrão (que só recarrega a página)
    evento.preventDefault();

    const dados = Object.fromEntries(new FormData(form));

    // Aceita o nome antigo do campo de dificuldade
    dados.dificuldade = dados.dificuldade || dados.nivel_dificuldade || "medio";

    const resposta = await fetch("/api/materias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
        alert(resultado.erro);
        return;
    }

    alert("Matéria cadastrada com sucesso!");
    form.reset();
});