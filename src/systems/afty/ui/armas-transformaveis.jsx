import React, { useState } from "react";
import { ChevronDown, ChevronRight, Sword, Swords } from "lucide-react";

import { alteraArmaTransformavel, bonusDaForma, estadoForma } from "../afty-armas-transformaveis";
import { peTempTotal, gastaPe } from "../ficha/ficha-sessao";
import TextoRico from "./TextoRico";

/**
 * ============================================================
 * ARMA TRANSFORMÁVEL — a tira de controle das duas formas
 * ============================================================
 * Painel COMPARTILHADO pela Ficha Final e pelo painel de Encontros, como a
 * Guarda ao lado dele: as duas telas mexem na MESMA sessão, e uma cópia por tela
 * faria o mestre e o jogador contarem clones diferentes na mesma criatura.
 *
 * ⚠ REDESENHADO EM 2026-09-07, a pedido do autor: *"ficou muito ruim de usar ela
 * na Ficha Final"*. O que estava errado, medido no código anterior:
 *
 *   • SEIS BOTÕES PARA TRÊS AÇÕES. "Errou contra mim" e "Dissipar 1" disparavam
 *     o mesmo evento com o mesmo resultado, e "Fui atingido" e "Área · Dissipar"
 *     também. O jogador tinha de descobrir sozinho quais pares eram sinônimos.
 *     Agora são três botões, e as situações de mesa moram no `title` de cada um.
 *   • O NÚMERO NÃO APARECIA. A tira mostrava "Clones: 4" e escondia o que aquilo
 *     valia. Os clones dão +2 de Defesa e +2 em Reflexos CADA, e a reserva vira
 *     dado de dano a cada dois. Esses três números já eram calculados e jogados
 *     fora. Agora eles são a segunda faixa, e saem do `bonusDaForma`, que é o
 *     mesmo dono da fórmula dos efeitos.
 *   • O TEXTO DA ARMA MORAVA NUM `title`. Um parágrafo de sete linhas dentro de
 *     um tooltip não se lê. Virou uma faixa que abre.
 *   • DOIS TÍTULOS. Um `h2` com o nome e um `h3` com o subtítulo, os dois com o
 *     mesmo tooltip. O subtítulo é identidade, não hierarquia.
 *
 * O arranjo segue as quatro faixas do card de Invocação: identidade, resultado
 * grudado nela, controles, e o detalhe por último.
 * ============================================================
 */

/* Os três eventos que existem de verdade. `golpe` e `livre` faziam a mesma
   coisa no motor (dissipar um), e por isso viraram um botão só: o que muda entre
   eles é a SITUAÇÃO DE MESA, e situação de mesa é `title`. */
const ACOES = [
  {
    evento: "golpe",
    rotulo: "Dissipar Um",
    titulo: "Um ataque errou contra você, ou você dissipou um clone de propósito (ação livre)",
    pode: (s) => s.clones > 0,
  },
  {
    evento: "todos",
    rotulo: "Dissipar Todos",
    titulo: "Você foi atingido por um ataque, ou um efeito em área alcançou os clones. "
      + "Se a área atingir você junto, só depois de falhar no Teste de Resistência",
    pode: (s) => s.clones > 0,
  },
  {
    evento: "acerto",
    rotulo: "Consumir Acumulados",
    titulo: "Depois de rolar o dano do ataque que acertou. Consome os pares acumulados e o ímpar sobra para a próxima rodada",
    pode: (s) => s.reserva > 0,
  },
];

function LinhaDeForma({ arma, sessao, onSessao }) {
  const [aberto, setAberto] = useState(false);
  const s = estadoForma(sessao.combate, arma.id);
  const custo = s.usos ? arma.bt : 0;
  const bonus = bonusDaForma(s);
  const semPe = sessao.peAtual + peTempTotal(sessao) < custo;
  const naMesmaRodada = s.dividida === sessao.rodada;
  const disparar = (evento) => onSessao((atual) =>
    alteraArmaTransformavel(atual, arma, evento, gastaPe));

  const botao = (rotulo, evento, titulo, desligado = false) => (
    <button
      type="button"
      className="afty-forma-botao"
      title={titulo}
      disabled={desligado}
      onClick={() => disparar(evento)}
    >
      {rotulo}
    </button>
  );

  return (
    <div className="afty-forma" data-afty-forma={s.reunida ? "reunida" : "dividida"}>
      {/* ---------- 1. IDENTIDADE ---------- */}
      <div className="afty-forma-topo">
        {s.reunida
          ? <Sword className="afty-forma-icone" aria-hidden="true" />
          : <Swords className="afty-forma-icone" aria-hidden="true" />}
        <span className="afty-forma-nome">{arma.nome}</span>
        {/* ⚠ PALAVRA SOLTA, sem pílula. Mesma decisão do "Quebrada" da Guarda:
            o estado se lê pelo texto e pela borda do bloco, e um chip aqui
            competiria com os números logo abaixo. */}
        <span className="afty-forma-estado">
          {s.reunida ? "Espada Colossal" : "Lâminas Separadas"}
        </span>

        <div className="afty-forma-controles">
          {s.reunida
            ? botao("Dividir", "dividir", "Ação bônus. Não pode reunir de novo na mesma rodada")
            : botao(
              custo ? `Reunir · ${custo} PE` : "Reunir",
              "reunir",
              naMesmaRodada
                ? "Foi dividida nesta rodada: só na próxima"
                : semPe
                  ? `Faltam Pontos de Energia (custa ${custo})`
                  : custo
                    ? `Ação bônus. Custa ${custo} PE porque não é o primeiro uso do combate`
                    : "Ação bônus. O primeiro uso de cada combate é grátis",
              naMesmaRodada || semPe,
            )}
        </div>
      </div>

      {/* ---------- 2. O QUE ELA DÁ AGORA ----------
          Só na forma reunida, porque dividida ela não dá nada disto. Os três
          números JÁ ESTÃO somados na Defesa, nos Reflexos e na linha de dano do
          cabeçalho: isto é o painel de controle deles, e não uma segunda conta
          para o jogador somar de cabeça. Mesma regra da Guarda. */}
      {s.reunida && (
        <div className="afty-forma-numeros">
          <span className="afty-forma-numero" title="Clones ilusórios no ar">
            <b>{s.clones}</b> Clones
          </span>
          <span className="afty-forma-numero" title="Já somado na Defesa do cabeçalho">
            <b>+{bonus.defesa}</b> Defesa
          </span>
          <span className="afty-forma-numero" title="Já somado no Teste de Resistência de Reflexos">
            <b>+{bonus.reflexos}</b> Reflexos
          </span>
          <span
            className="afty-forma-numero"
            title={`${s.reserva} clone(s) dissipado(s) acumulado(s), que valem 1 dado a cada 2`}
          >
            <b>+{bonus.dados}</b> Dados
          </span>
        </div>
      )}

      {/* ---------- 3. OS TRÊS CONTROLES DE CLONE ---------- */}
      {s.reunida && (
        <div className="afty-forma-acoes">
          {ACOES.map((a) => botao(a.rotulo, a.evento, a.titulo, !a.pode(s)))}
        </div>
      )}

      {/* ---------- 4. O DETALHE ----------
          O texto da arma, que antes só existia como tooltip. Fechado por padrão:
          o que se faz com uma arma conhecida é usar, e ler é de vez em quando. */}
      {arma.descricao && (
        <>
          <button
            type="button"
            className="afty-forma-detalhe"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
          >
            {aberto
              ? <ChevronDown className="afty-forma-detalhe-icone" aria-hidden="true" />
              : <ChevronRight className="afty-forma-detalhe-icone" aria-hidden="true" />}
            {arma.titulo || "Como Funciona"}
          </button>
          {aberto && <TextoRico texto={arma.descricao} className="afty-forma-texto" />}
        </>
      )}
    </div>
  );
}

export function ArmasTransformaveis({ derived, sessao, onSessao }) {
  const armas = derived?.armasTransformaveis ?? [];
  if (!armas.length) return null;
  return armas.map((arma) => (
    <LinhaDeForma key={arma.id} arma={arma} sessao={sessao} onSessao={onSessao} />
  ));
}
