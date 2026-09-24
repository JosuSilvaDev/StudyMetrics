document.addEventListener("DOMContentLoaded", () => {

    // Descobre qual página está aberta
    let paginaAtual = window.location.pathname.split("/").pop();

    // Caso esteja na raiz
    if (!paginaAtual) {
        paginaAtual = "index.html";
    }


    // Algumas páginas secundárias pertencem
    // a uma página principal do menu
    const paginasRelacionadas = {

        "revisao_questoes.html": "revisao.html"

    };


    // Se for uma página secundária,
    // usa a página principal correspondente
    const paginaMenu =
        paginasRelacionadas[paginaAtual] || paginaAtual;


    // Pega todos os itens do menu
    const itensMenu =
        document.querySelectorAll(".sidebar .menu-item");


    itensMenu.forEach((item) => {

        const destino = item.getAttribute("href");


        // Primeiro remove ativo de todos
        item.classList.remove("ativo");


        // Depois ativa somente a página correta
        if (destino === paginaMenu) {

            item.classList.add("ativo");

        }

    });

});