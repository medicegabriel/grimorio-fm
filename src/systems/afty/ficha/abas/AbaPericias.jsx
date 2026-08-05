import React from "react";

import { NumeroComFontes } from "../../ui/fontes";
import { sinalDe } from "../../ui/formato";
import { AFTY_ATTRS } from "../../afty-schema";
import { useDestaque } from "../usar-destaque";

/**
 * ============================================================
 * ABA PERÍCIAS — os três tipos de teste, prontos para rolar
 * ============================================================
 * Jogadas de Ataque, Testes de Resistência e Perícias. Os três somam
 * `mod do atributo + uma escala de nível + Maestria (se treinado)`, e a escala
 * NÃO é a mesma nos três: quem resolve isso é o `resolveTestes`, e aqui só se
 * exibe o número com as fontes dele.
 *
 * ⚠ Ao contrário do criador, a faixa NÃO é editável aqui. Treinar perícia é
 * escolha de ficha, e escolha mora no criador. O que a Ficha faz é rolar.
 *
 * ⚠ Os cinco TRs aparecem SEMPRE, inclusive os sem faixa, e as perícias também:
 * a regra do Preview (só quem tem faixa) serve a um resumo, e aqui o jogador
 * precisa achar a linha que ele vai rolar, mesmo sendo a que ele não treinou.
 * Quem tem faixa fica em destaque, o resto fica apagado.
 * ============================================================
 */

const ABREV = Object.fromEntries(AFTY_ATTRS.map((a) => [a.key, a.abbr]));

function LinhaTeste({ nome, atributo, bonus, partes, prof, tag, margem, rolar, chave, destacado }) {
  const raiz = useDestaque(destacado);
  return (
    <div
      ref={raiz}
      id={`afty-item-${chave}`}
      className="afty-linha px-2.5 py-1.5 flex items-center gap-2"
      data-afty-destacada={prof === "mestre" ? "sim" : "nao"}
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <span
        className="flex-1 min-w-0 text-[12px] font-semibold truncate"
        style={{ color: prof ? "var(--afty-texto)" : "var(--afty-texto-fraco)" }}
        title={nome}
      >
        {nome}
      </span>
      {atributo && (
        <span className="afty-rotulo text-[9px] uppercase tracking-wider flex-shrink-0">{ABREV[atributo] || ""}</span>
      )}
      {tag && <span className="afty-chip flex-shrink-0">{tag}</span>}
      <NumeroComFontes
        valor={bonus}
        partes={partes}
        total={sinalDe(bonus)}
        className="afty-valor text-[13px] w-10 text-right"
        ancora="direita"
        onRolar={() => rolar({ tipo: "teste", rotulo: nome, bonus, margem })}
      />
    </div>
  );
}

function Secao({ titulo, children, colunas = 1 }) {
  return (
    <section className="afty-card p-3">
      <h2 className="afty-card-titulo mb-2">{titulo}</h2>
      <div className={`grid gap-1 ${colunas === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
    </section>
  );
}

export default function AbaPericias({ derived, rolar, destaque }) {
  const { pericias = [], resistencias = [], ataques = [] } = derived.testes ?? {};

  return (
    <div className="space-y-3">
      {ataques.length > 0 && (
        <Secao titulo="Jogadas de Ataque" colunas={2}>
          {ataques.map((a) => (
            <LinhaTeste
              key={a.id}
              nome={a.nome}
              bonus={a.bonus}
              partes={a.partes}
              prof={a.treinado ? "treinado" : null}
              rolar={rolar}
              chave={`ataque:${a.id}`}
              destacado={destaque === `ataque:${a.id}`}
            />
          ))}
        </Secao>
      )}

      {resistencias.length > 0 && (
        <Secao titulo="Testes de Resistência" colunas={2}>
          {resistencias.map((r) => (
            <LinhaTeste
              key={r.value}
              nome={r.label}
              atributo={r.atributo}
              bonus={r.bonus}
              partes={r.partes}
              prof={r.prof}
              tag={r.prof === "mestre" ? "Mestre" : null}
              /* Só quem é mestre num TR consegue sucesso crítico nele, e a
                 margem já desce com as Melhorias e os Treinamentos Completos. */
              margem={r.critico ? r.margemCritico : 20}
              rolar={rolar}
              chave={`tr:${r.value}`}
              destacado={destaque === `tr:${r.value}`}
            />
          ))}
        </Secao>
      )}

      {pericias.length > 0 && (
        <Secao titulo="Perícias" colunas={2}>
          {pericias.map((p) => (
            <LinhaTeste
              key={p.id}
              nome={p.nome}
              atributo={p.atributo}
              bonus={p.bonus}
              partes={p.partes}
              prof={p.prof}
              tag={p.prof === "mestre" ? "Mestre" : null}
              rolar={rolar}
              chave={`pericia:${p.id}`}
              destacado={destaque === `pericia:${p.id}`}
            />
          ))}
        </Secao>
      )}
    </div>
  );
}
