import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { semAcento, ROTULO_GRUPO } from "./ficha-conteudo";

/**
 * ============================================================
 * BUSCA GLOBAL (Ctrl+K) — o maior ganho contra a carga cognitiva
 * ============================================================
 * Numa criatura de ND 40 com 40 itens escolhidos, 20 perícias, 5 Testes de
 * Resistência, várias linhas de dano e de cura, achar a coisa certa é o trabalho
 * que mais consome tempo na mesa. A busca varre TUDO de uma vez e navega até o
 * resultado, trocando de aba sozinha.
 *
 * ⚠ Todos os termos precisam bater, e não qualquer um: é o que deixa
 * "postura sol" achar a Postura do Sol sem trazer as outras sete.
 *
 * Sem acento e sem caixa, porque ninguém digita "Aptidão" com til no meio de uma
 * luta.
 * ============================================================
 */

const TETO = 40;

/* ⚠ Quem monta e desmonta é o pai. Ficar montado com um `if (!aberta) return
   null` obrigaria a ZERAR o termo e o cursor num efeito ao abrir, e efeito que
   chama setState é renderização em cascata (o `react-hooks` reprova, com razão).
   Montando na hora, o estado já nasce limpo. */
export default function BuscaGlobal({ onFechar, itens, alvos, onIr }) {
  const [termo, setTermo] = useState("");
  const [cursor, setCursor] = useState(0);
  const campo = useRef(null);

  // Foco é DOM, não estado: pode entrar em efeito sem cascata nenhuma.
  useEffect(() => { campo.current?.focus(); }, []);

  const resultados = useMemo(() => {
    const partes = semAcento(termo).split(/\s+/).filter(Boolean);
    if (!partes.length) return [];
    const casa = (x) => partes.every((p) => x.busca.includes(p));
    return [
      ...itens.filter(casa).map((i) => ({
        chave: i.chave, nome: i.nome, grupo: i.grupo, aba: "habilidades", detalhe: null,
      })),
      ...alvos.filter(casa).map((a) => ({
        chave: a.chave, nome: a.nome, grupo: a.grupo, aba: a.aba, detalhe: a.detalhe,
      })),
    ].slice(0, TETO);
  }, [termo, itens, alvos]);

  const escolhe = (r) => { if (r) { onIr(r); onFechar(); } };

  const aoTeclar = (e) => {
    if (e.key === "Escape") { onFechar(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(resultados.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      escolhe(resultados[cursor]);
    }
  };

  return (
    <div className="afty-busca-fundo" onPointerDown={onFechar}>
      {/* O clique de dentro não pode fechar junto com o de fora. */}
      <div className="afty-busca" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
          <input
            ref={campo}
            type="text"
            value={termo}
            onChange={(e) => { setTermo(e.target.value); setCursor(0); }}
            onKeyDown={aoTeclar}
            placeholder="Buscar na ficha"
            aria-label="Buscar na ficha"
            className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
          />
        </div>

        {resultados.length > 0 && (
          <div className="afty-busca-lista">
            {resultados.map((r, i) => (
              <button
                key={r.chave}
                type="button"
                className="afty-busca-item"
                data-afty-cursor={i === cursor ? "sim" : undefined}
                onPointerEnter={() => setCursor(i)}
                onClick={() => escolhe(r)}
              >
                <span className="flex-1 min-w-0 truncate text-[12px] font-semibold">{r.nome}</span>
                {r.detalhe && <span className="afty-valor text-[11px] flex-shrink-0">{r.detalhe}</span>}
                <span className="afty-chip flex-shrink-0">{ROTULO_GRUPO[r.grupo] ?? r.grupo}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
