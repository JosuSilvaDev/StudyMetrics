document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-perfil");
    const status = document.getElementById("perfil-status");
    const botao = document.getElementById("salvar-perfil");
    const campos = ["nome", "email", "data_nascimento", "objetivo", "data_aprovacao"];
    let perfilSalvo = null;

    function atualizarResumo(perfil) {
        const nome = perfil.nome.trim();
        document.getElementById("resumo-nome").textContent = nome ? `Olá, ${nome.split(/\s+/)[0]}!` : "Olá, estudante!";
        document.getElementById("resumo-objetivo").textContent = perfil.objetivo || "Cada passo de hoje aproxima você do seu objetivo.";
        const avatar = document.getElementById("avatar-iniciais");
        if (nome) avatar.textContent = nome.split(/\s+/).slice(0, 2).map(parte => parte[0]).join("").toLocaleUpperCase("pt-BR");
        else { avatar.textContent = ""; const icone = document.createElement("i"); icone.className = "bi bi-person-fill"; avatar.appendChild(icone); }

        const resultado = document.getElementById("contagem-resultado");
        const data = document.getElementById("contagem-data");
        const mensagem = document.getElementById("contagem-mensagem");
        resultado.hidden = !perfil.data_aprovacao;
        data.hidden = !perfil.data_aprovacao;
        if (!perfil.data_aprovacao) {
            mensagem.textContent = "Defina sua data de aprovação para começar a contagem regressiva.";
            return;
        }
        const [ano, mes, dia] = perfil.data_aprovacao.split("-").map(Number);
        const hoje = new Date();
        const dias = Math.round((Date.UTC(ano, mes - 1, dia) - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
        data.querySelector("span").textContent = `Meta: ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
        document.getElementById("contagem-dias").textContent = Math.max(0, dias);
        document.getElementById("contagem-unidade").innerHTML = `${dias === 1 ? "dia" : "dias"}<br>para sua meta`;
        mensagem.textContent = dias > 0 ? "Continue avançando: cada dia de estudo conta." : dias === 0 ? "O grande dia chegou! Confie na sua preparação." : "A data da sua meta passou. Atualize-a para uma nova contagem.";
    }

    async function carregar() {
        botao.disabled = true;
        try {
            const resposta = await fetch("/api/perfil");
            if (!resposta.ok) throw new Error();
            perfilSalvo = await resposta.json();
            campos.forEach(campo => { form.elements[campo].value = perfilSalvo[campo] || ""; });
            form.querySelectorAll('[name="motivacao"]').forEach(input => { input.checked = perfilSalvo.motivacoes.includes(input.value); });
            atualizarResumo(perfilSalvo);
            botao.disabled = false;
        } catch (erro) {
            status.textContent = "Não foi possível carregar o perfil. Recarregue a página para tentar novamente.";
            status.className = "erro";
        }
    }
    form.addEventListener("submit", async evento => {
        evento.preventDefault();
        const dados = Object.fromEntries(campos.map(campo => [campo, form.elements[campo].value.trim()]));
        dados.motivacoes = Array.from(form.querySelectorAll('[name="motivacao"]:checked'), input => input.value);
        botao.disabled = true;
        status.className = "";
        status.textContent = "Salvando...";
        try {
            const resposta = await fetch("/api/perfil", {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(dados)});
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro);
            perfilSalvo = dados;
            atualizarResumo(dados);
            status.textContent = resultado.mensagem;
        } catch (erro) {
            status.className = "erro";
            status.textContent = erro.message || "Não foi possível salvar. Tente novamente.";
        } finally { botao.disabled = false; }
    });
    setInterval(() => { if (perfilSalvo) atualizarResumo(perfilSalvo); }, 60000);
    carregar();
});
