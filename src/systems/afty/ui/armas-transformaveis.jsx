import React from "react";
import { alteraArmaTransformavel, estadoForma } from "../afty-armas-transformaveis";
import { peTempTotal, gastaPe } from "../ficha/ficha-sessao";

export function ArmasTransformaveis({ derived, sessao, onSessao }) {
  return (derived.armasTransformaveis ?? []).map((arma) => {
    const s = estadoForma(sessao.combate, arma.id);
    const custo = s.usos ? arma.bt : 0;
    // Preserva o original no pacote. Na apresentação, separa as orações em linhas.
    const texto = arma.descricao?.replaceAll(";", "\n");
    const botao = (texto, evento, title, disabled = false) => (
      <button type="button" className="afty-guarda-botao" title={title} disabled={disabled}
        onClick={() => onSessao((atual) => alteraArmaTransformavel(atual, arma, evento, gastaPe))}>{texto}</button>
    );
    return <section key={arma.id} className="afty-card p-3 space-y-2">
      <h2 className="afty-card-titulo" title={texto}>{arma.nome}</h2>
      {arma.titulo && <h3 className="afty-card-titulo" title={texto}>{arma.titulo}</h3>}
      <div className="flex gap-2 flex-wrap items-center">
        <span>{s.reunida ? "Espada Colossal" : "Lâminas Separadas"}</span>
        {s.reunida
          ? botao("Dividir", "dividir", "Ação bônus")
          : botao(`Reunir · ${custo} PE`, "reunir", "Ação bônus", s.dividida === sessao.rodada || sessao.peAtual + peTempTotal(sessao) < custo)}
        {s.reunida && <>
          <span>Clones: {s.clones}</span><span>Acumulados: {s.reserva}</span>
          {botao("Errou contra mim", "golpe", "Dissipar um clone", !s.clones)}
          {botao("Fui atingido", "todos", "Dissipar todos os clones", !s.clones)}
          {botao("Área · Dissipar", "todos", "Use quando a área dissipar os clones. Se atingir o usuário, somente após falhar no TR", !s.clones)}
          {botao("Dissipar 1", "livre", "Ação livre", !s.clones)}
          {botao("Acertei · Consumir", "acerto", "Após rolar o dano do ataque que acertou, consumir os pares acumulados", s.reserva < 1)}
        </>}
      </div>
    </section>;
  });
}
