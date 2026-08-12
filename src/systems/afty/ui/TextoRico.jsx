import React, { useMemo } from "react";

import { parseTextoRico } from "../afty-texto-rico";

/**
 * ============================================================
 * TEXTO RICO — a marcação do Funcionamento Básico, renderizada
 * ============================================================
 * Extraído do `AftyCreatureBuilder.jsx` em 2026-08-08, quando o autor apontou
 * que o Funcionamento Básico não aparecia na Ficha Final: o texto existia, a
 * formatação existia, e nada disso chegava à tela de jogo.
 *
 * ⚠ Devolve NÓS REACT, nunca HTML. O parser em `afty-texto-rico.js` entrega
 * dados e aqui eles viram <strong>/<em>/<u>/<s>. É o que deixa o campo continuar
 * sendo uma `string` na ficha, sem `dangerouslySetInnerHTML` em lugar nenhum.
 *
 * ⚠ COR POR VARIÁVEL, e não por classe do Tailwind, porque o mesmo componente
 * serve dois donos: o criador (slate + roxo, tela do app) e a Ficha (pintada por
 * variável, com CSS do usuário por cima). O fallback de cada `var()` é o tom do
 * criador, então lá nada precisa ser declarado, e na Ficha o tema manda.
 *
 * As classes `afty-tr-*` são CONTRATO: o CSS personalizado da Ficha se pendura
 * nelas. Renomear uma delas quebra folha de usuário, que é código que não está
 * neste repositório. Ver `docs/afty-ficha-final.md`.
 * ============================================================
 */

const COR = {
  forte:  "var(--afty-texto, #ffffff)",
  corpo:  "var(--afty-texto-suave, #cbd5e1)",
  borda:  "var(--afty-borda-forte, #334155)",
  filete: "var(--afty-borda, #1e293b)",
  cabeca: "var(--afty-poco, #0f172a)",
  titulo: "var(--afty-destaque-texto, #d8b4fe)",
};

/* Os trechos de uma linha ou célula viram nós. */
function trechosEmNos(trechos) {
  return trechos.map((t, i) => {
    let no = t.texto;
    if (t.riscado) no = <s>{no}</s>;
    if (t.sublinhado) no = <u>{no}</u>;
    if (t.italico) no = <em>{no}</em>;
    if (t.negrito) no = <strong className="afty-tr-forte font-semibold" style={{ color: COR.forte }}>{no}</strong>;
    return <React.Fragment key={i}>{no}</React.Fragment>;
  });
}

const ALINHA_CELULA = { esquerda: "left", centro: "center", direita: "right" };

/* ⚠ SEM `max-width`, e isso é decisão do autor (2026-08-08), tomada duas vezes.

   O texto herdava `max-width: 78ch` da classe `afty-texto` da Ficha — a medida
   de leitura clássica, que existe para o olho achar o começo da linha seguinte.
   Num cartão de 1300px ela deixa metade da largura vazia, e o autor leu isso
   como cartão quebrado, primeiro no container e depois no parágrafo.

   Quem manda na largura é o CONTAINER. Se um dia a linha longa incomodar, o
   conserto é estreitar o cartão, e não recolocar a medida aqui: o Funcionamento
   Básico tem tabela dentro, e tabela quer a largura toda. */

/**
 * Texto com marcação renderizado, bloco a bloco.
 *
 * ⚠ O modelo é de BLOCOS, e não de linhas soltas com "\n": título quer margem e
 * filete, e tabela ocupa várias linhas de origem e vira um elemento só. A linha
 * comum leva `whitespace-pre-wrap` para a indentação que o autor tenha digitado
 * sobreviver.
 *
 * A tabela rola sozinha no eixo X, porque o campo é estreito e uma tabela de
 * cinco colunas não pode empurrar o card inteiro.
 */
export default function TextoRico({ texto, className = "" }) {
  const blocos = useMemo(() => parseTextoRico(texto), [texto]);
  return (
    <div
      className={`afty-tr ${className}`}
      style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: COR.corpo }}
    >
      {blocos.map((b, bi) => {
        // Linha em branco: o parágrafo vazio é do autor, então ele fica.
        if (b.tipo === "vazio") return <div key={bi} className="afty-tr-vazio h-3" aria-hidden="true" />;

        if (b.tipo === "tabela") {
          const alinha = (ci) => ALINHA_CELULA[b.alinhamentos[ci]] ?? "left";
          return (
            <div key={bi} className="afty-tr-tabela-caixa my-2 overflow-x-auto">
              <table className="afty-tr-tabela w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {b.cabecalho.map((c, ci) => (
                      <th
                        key={ci}
                        className="px-2 py-1 font-semibold"
                        style={{
                          border: `1px solid ${COR.borda}`,
                          background: COR.cabeca,
                          color: COR.forte,
                          textAlign: alinha(ci),
                        }}
                      >
                        {trechosEmNos(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.linhas.map((linha, li) => (
                    <tr key={li}>
                      {/* A linha pode ter menos células que o cabeçalho, e é o
                          cabeçalho que manda: sem isso a tabela sai torta. */}
                      {b.cabecalho.map((_, ci) => (
                        <td
                          key={ci}
                          className="px-2 py-1"
                          style={{ border: `1px solid ${COR.filete}`, color: COR.corpo, textAlign: alinha(ci) }}
                        >
                          {trechosEmNos(linha[ci] ?? [])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // `first:mt-0` para o texto não começar com um buraco quando a primeira
        // linha já é um título, que é justamente o caso comum.
        if (b.tipo === "titulo" && b.nivel === 1) {
          return (
            <div
              key={bi}
              className="afty-tr-h1 text-[15px] font-bold mt-4 first:mt-0 mb-1.5 pb-1"
              style={{ color: COR.forte, borderBottom: `1px solid ${COR.borda}` }}
            >
              {trechosEmNos(b.trechos)}
            </div>
          );
        }
        if (b.tipo === "titulo") {
          return (
            <div key={bi} className="afty-tr-h2 text-[13px] font-semibold mt-3 first:mt-0 mb-1" style={{ color: COR.titulo }}>
              {trechosEmNos(b.trechos)}
            </div>
          );
        }
        return <div key={bi} className="afty-tr-p whitespace-pre-wrap">{trechosEmNos(b.trechos)}</div>;
      })}
    </div>
  );
}

