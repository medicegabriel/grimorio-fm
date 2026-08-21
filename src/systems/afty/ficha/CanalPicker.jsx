import React, { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { EFEITO_CANAL_GRUPOS } from "../afty-efeitos";
import { semAcento } from "./ficha-conteudo";
import { usePrimitiva } from "../ui/usar-primitiva";

/**
 * ============================================================
 * SELETOR DE CANAL — o mesmo do Motor, na pintura da Ficha
 * ============================================================
 * Portado do `CanalPicker` do `AftyCreatureBuilder.jsx` (Habilidades >
 * Funcionamento Básico) a pedido do autor em 2026-08-06. O de lá é uma função
 * LOCAL do criador, sem export, e a pintura dele é classe de cor do Tailwind,
 * que não sobrevive ao tema da Ficha: por isso ele foi copiado e repintado por
 * token em vez de importado. A LÓGICA é a mesma, de propósito.
 *
 * ⚠ O QUE ELE SUBSTITUIU e por quê: um `<select>` nativo com os canais numa
 * lista corrida. São dezenas deles, e um `<select>` os despeja num tubo de 300px
 * sem grupo nenhum: achar "Margem de Crítico" virava rolar até topar com ele.
 *
 * A saída é a LARGURA. Em três colunas os grupos cabem quase todos na tela de
 * uma vez, e procurar vira varrer com o olho. A busca continua, mas como atalho
 * e não como única saída.
 *
 * Teclado: setas andam, Enter escolhe, Esc fecha.
 * ============================================================
 */
export default function CanalPicker({ value, onChange, ancora = "esquerda" }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [cursor, setCursor] = useState(0);
  const campo = useRef(null);

  const atual = useMemo(
    () => EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens).find((c) => c.id === value),
    [value],
  );

  /* O `hpAtributo` é canal de Addon, e some para quem não pediu a primitiva.
     Igual ao CanalPicker do criador, o canal JÁ ESCOLHIDO continua à vista: um
     campo em branco com efeito ativo por trás seria pior. Ver
     `ui/usar-primitiva.js`. */
  const veHpAtributo = usePrimitiva("hpAtributo") || value === "hpAtributo";

  // Busca SEM acento dos dois lados: ninguém digita acento numa caixa de busca,
  // e sem isso "critico" não acha "Margem de Crítico".
  const grupos = useMemo(() => {
    const termo = semAcento(busca.trim());
    return EFEITO_CANAL_GRUPOS
      .map((g) => ({
        label: g.label,
        itens: g.itens.filter((c) =>
          (veHpAtributo || c.id !== "hpAtributo")
          && (!termo
          || semAcento(c.label).includes(termo)
          || semAcento(g.label).includes(termo)
          || semAcento(c.nota).includes(termo))),
      }))
      .filter((g) => g.itens.length);
  }, [busca, veHpAtributo]);

  const chapada = useMemo(() => grupos.flatMap((g) => g.itens), [grupos]);

  const fechar = () => { setAberto(false); setBusca(""); setCursor(0); };
  const escolher = (id) => { onChange(id); fechar(); };

  const teclado = (e) => {
    if (e.key === "Escape") { e.preventDefault(); fechar(); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setCursor((c) => (chapada.length ? (c + passo + chapada.length) % chapada.length : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (chapada[cursor]) escolher(chapada[cursor].id);
    }
  };

  return (
    <div className="afty-canal relative flex-shrink-0">
      <button
        ref={campo}
        type="button"
        onClick={() => (aberto ? fechar() : setAberto(true))}
        className="afty-canal-gatilho flex items-center gap-1 w-full text-left"
        aria-label="Canal do buff"
        aria-expanded={aberto}
      >
        <span className="truncate flex-1">{atual?.label ?? "Escolher"}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60" aria-hidden="true" />
      </button>

      {aberto && (
        <>
          {/* Camada de fundo: clicar fora fecha, sem listener global. */}
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            onClick={fechar}
            aria-hidden="true"
            tabIndex={-1}
          />
          <div
            className={`afty-canal-painel absolute z-30 mt-1 w-[38rem] max-w-[92vw] ${
              ancora === "direita" ? "right-0" : "left-0"
            }`}
          >
            <div className="afty-canal-busca p-1.5">
              <input
                type="text"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setCursor(0); }}
                onKeyDown={teclado}
                placeholder="Buscar"
                spellCheck={false}
                autoFocus
                className="afty-campo w-full bg-transparent outline-none"
              />
            </div>
            {/* ⚠ Colunas de CSS, e não grid: os grupos têm tamanhos diferentes e
                o `columns` empacota sozinho, sem buraco. `break-inside-avoid`
                impede um grupo de ser partido no meio entre duas colunas. */}
            <div className="afty-canal-lista max-h-[60vh] overflow-y-auto p-2 columns-2 sm:columns-3 gap-3">
              {chapada.length === 0 && (
                <p className="afty-vazio">Nenhum Canal Com Esse Termo</p>
              )}
              {grupos.map((g) => (
                <div key={g.label} className="break-inside-avoid mb-2.5">
                  <div className="afty-canal-grupo">{g.label}</div>
                  {g.itens.map((c) => {
                    const idx = chapada.indexOf(c);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => escolher(c.id)}
                        onMouseEnter={() => setCursor(idx)}
                        title={c.nota || undefined}
                        className="afty-canal-item block w-full text-left truncate"
                        data-afty-escolhido={c.id === value ? "sim" : undefined}
                        data-afty-cursor={idx === cursor ? "sim" : undefined}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
