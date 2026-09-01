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

function LinhaTeste({ nome, atributo, bonus, textoBonus, dados, partes, prof, tag, margem, rolar, chave, destacado }) {
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
      {/* ⚠ COM DADO A LINHA MOSTRA A ROLAGEM, e não só o fixo. A Resiliência
          pela Adrenalina soma "2d3 ao resultado", e um "+7" sozinho leria como
          se fosse tudo. A caixa alarga porque "+7 + 2d3" não cabe em 10. */}
      <NumeroComFontes
        valor={textoBonus ?? bonus}
        partes={partes}
        total={textoBonus ?? sinalDe(bonus)}
        className={`afty-valor text-[13px] text-right ${textoBonus ? "w-20" : "w-10"}`}
        ancora="direita"
        onRolar={() => rolar({ tipo: "teste", rotulo: nome, bonus, dados, margem })}
      />
    </div>
  );
}

/**
 * OS SEIS ATRIBUTOS.
 *
 * ⚠ Eles nunca estiveram na Ficha, e isso era um buraco: o jogador via os
 * derivados (Defesa, CD, os testes) e não via de onde eles saem. Numa mesa,
 * "faz um teste de Força pura" acontece o tempo todo.
 *
 * Mostra o VALOR grande e o modificador embaixo, porque os dois se usam: o valor
 * em pré-requisito e em regra que lê atributo, o modificador em toda conta. O
 * modificador ROLA como teste puro, e o valor não rola nada.
 *
 * ⚠ O valor exibido é o EFETIVO (`attrEff`), já com o que o Motor soma e já
 * aparado no limite. As fontes ficam no hover, como em todo número da Ficha.
 */
function Atributos({ derived, rolar }) {
  return (
    <section className="afty-card p-3">
      <h2 className="afty-card-titulo mb-2">Atributos</h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {AFTY_ATTRS.map((a) => {
          const valor = derived.attrEff?.[a.key] ?? 0;
          const mod = derived.mods?.[a.key] ?? 0;
          return (
            <span key={a.key} className="afty-atributo" data-afty-atributo={a.key}>
              <span className="afty-atributo-rotulo" title={a.label}>{a.abbr}</span>
              <NumeroComFontes
                valor={valor}
                partes={derived.partesAtributo?.[a.key]}
                total={valor}
                formatar={false}
                className="afty-atributo-valor"
                titulo={a.label}
              />
              <NumeroComFontes
                valor={mod}
                total={sinalDe(mod)}
                className="afty-atributo-mod"
                ancora="direita"
                titulo={`Teste de ${a.label}`}
                onRolar={() => rolar({ tipo: "teste", rotulo: a.label, bonus: mod })}
              />
            </span>
          );
        })}
      </div>
    </section>
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
      <Atributos derived={derived} rolar={rolar} />

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
              textoBonus={r.textoBonus}
              dados={r.dadosExtras}
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
