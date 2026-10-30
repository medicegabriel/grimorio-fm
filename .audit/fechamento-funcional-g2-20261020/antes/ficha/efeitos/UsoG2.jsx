/* ============================================================
   G2 · REGISTRAR USO (E2, 2026-10-15)
   ============================================================
   Habilidades de uso instantâneo (Ataque Extra, Indomável, Surto de Ação): nada
   fica ativo. O clique gasta um uso do contador REAL do motor e anota o evento.
   Um clique só, como o autor decidiu: a tela mostra antes o custo à mão e quantos
   usos restam, e bloqueia por Energia, por usos esgotados e pela regra de uma
   vez por rodada. O PE continua à mão: o resultado traz o Descontar, e a ficha
   não cobra nada.
   ============================================================ */
import React from "react";
import { AlertTriangle, Hand } from "lucide-react";
import { custoEmJogo } from "./g2-dados";
import { planoDoUso } from "./g2-uso";

export function RegistrarUso({ o, g, m }) {
  const p = planoDoUso({ o, m });
  const custo = p.custoPE ? custoEmJogo({ texto: `${p.custoPE} PE`, cobra: false }) : null;
  const contados = g.usosDe(o.chave);
  return (
    <div className="k-confirmar" data-registrar-uso={o.chave}>
      {custo && <span className="x-custo-jogo" data-custo-resumo><Hand aria-hidden="true" />{custo.texto}</span>}
      {p.usos && <span className="x-custo" data-usos-restam={p.usos.restam} data-usos-max={p.usos.max} title={o.exemplo?.usos ?? undefined}>Restam {p.usos.restam} de {p.usos.max}</span>}
      {p.bloqueios.map((t) => <span key={t} className="x-atencao" data-bloqueio><AlertTriangle aria-hidden="true" />{t}</span>)}
      <span className="x-linha">
        <button type="button" className="m-botao x-adicionar g2-primario" disabled={p.bloqueios.length > 0} onClick={() => g.acoes.registrarUsoReal(o)} data-registrar-uso-botao>Registrar Uso</button>
        {!p.usos && contados > 0 && <span className="x-mesa">Registrado {contados}×</span>}
      </span>
    </div>
  );
}
