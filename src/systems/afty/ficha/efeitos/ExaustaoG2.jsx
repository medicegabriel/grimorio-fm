/* ============================================================
   EXAUSTÃO DESDE ZERO (fechamento funcional do G2, 2026-10-20)
   ============================================================
   O G2 só mostra o cartão de Exaustão quando o nível já é maior que zero, e o jogador precisava da Apresentação Anterior para começar o contador.
   Este é o acesso discreto: um botão pequeno nos Ativos (e no painel compacto) que abre um painel flutuante com o nível, os passos e o Zerar.

   ⚠ ABRIR O CONTROLE NÃO MUDA O CONTADOR. O nível é da SESSÃO (`sessao.exaustao`, inteiro não negativo, sem teto nem penalidade que o motor não
   modela) e não é a Exaustão de Técnica (`exaustaoTecnica`), que a virada entrega uma vez só. Os passos agem sobre o valor de AGORA.
   ============================================================ */
import React, { useCallback, useState } from "react";
import { Minus, Plus, Gauge } from "lucide-react";
import { Flutuante } from "./pecas";

export function AcessoAExaustao({ g, m, onde = "completa" }) {
  const [ancora, setAncora] = useState(null);
  /* O `Flutuante` refaz o foco quando o `onFechar` muda: ele tem de ser estável. */
  const fechar = useCallback(() => setAncora(null), []);
  const n = Math.max(0, Math.trunc(Number(m.sessao.exaustao) || 0));
  return (
    <>
      <button type="button" className={onde === "compacta" ? "m-botao c2-exaustao" : "m-botao x-exaustao"} aria-haspopup="dialog" aria-expanded={!!ancora}
        data-acesso-exaustao={onde} aria-label={`Exaustão, nível ${n}`} title="Exaustão" onClick={(e) => setAncora((a) => (a ? null : e.currentTarget))}>
        <Gauge aria-hidden="true" />{onde === "compacta" ? null : "Exaustão"}{n > 0 && <b data-exaustao-nivel>{n}</b>}
      </button>
      {ancora && (
        <Flutuante ancora={ancora} onFechar={fechar} largura={260} rotulo="Nível de Exaustão">
          <div className="x-ctrl" data-painel-exaustao>
            <span className="x-ctrl-nome">Nível de Exaustão</span>
            <span className="m-passos">
              <button type="button" className="m-passo" aria-label="Exaustão menos 1" disabled={n === 0} onClick={() => g.acoes.exaustaoMais(-1)} data-exaustao-menos><Minus aria-hidden="true" /></button>
              <span className="m-passos-valor" aria-live="polite" data-exaustao-valor={n}>{n}</span>
              <button type="button" className="m-passo" aria-label="Exaustão mais 1" onClick={() => g.acoes.exaustaoMais(1)} data-exaustao-mais><Plus aria-hidden="true" /></button>
            </span>
            <button type="button" className="m-link" disabled={n === 0} onClick={() => g.acoes.exaustao(0)} data-exaustao-zerar>Zerar</button>
          </div>
        </Flutuante>
      )}
    </>
  );
}
