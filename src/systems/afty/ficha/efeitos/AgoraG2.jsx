/* ============================================================
   G2 · AGORA (o que um efeito ativo vale neste momento)
   ============================================================
   Saiu do VisaoG2 em 2026-11-09 para o catálogo também mostrar o que um efeito
   ativo vale sem importar a aba inteira (o VisaoG2 importa o catálogo).
   ============================================================ */
import React from "react";
import { AlertTriangle, Hand, Layers } from "lucide-react";
import { COBERTO_PELA_PROPRIA, detalhesDoAtivo } from "./efeitos-dados";
import { PvBeneficio } from "./Gestor";
import { fraseDoBeneficio, rotuloCanal } from "./recebidos";
import { foraDosNumeros } from "./g2-dados";
import { GanhaPerde, SemNumeros } from "./PecasG2";

const sinal = (v) => `${v > 0 ? "+" : "−"}${Math.abs(v)}`;

export function Agora({ a, g, m, chips, contrib, pvb }) {
  const coberto = contrib.coberto ?? g.cobertos.get(a.chave);
  const cobertura = coberto ? (coberto === COBERTO_PELA_PROPRIA ? "Coberto pela Sua Própria" : `${contrib.coberto ? "Coberto por" : "Incluído em"} ${coberto}`) : null;
  const disputas = g.disputas.get(a.chave) ?? [];
  const an = a.tipo === "registro" ? g.analise[a.reg.id] ?? {} : null;
  const frases = an ? Object.entries(an).map(([canal, x]) => fraseDoBeneficio(canal, x)).filter(Boolean) : [];
  const d = detalhesDoAtivo(a, m);
  const partes = [];
  if (chips.length) partes.push(<GanhaPerde key="nums" chips={chips} />);
  if (pvb) partes.push(<div key="pv" className="g2-pv"><PvBeneficio b={pvb} g={g} /><span className="x-mesa">{pvb.textoRegra}</span></div>);
  if (cobertura) partes.push(<span key="cob" className="x-neutro"><Layers aria-hidden="true" />{cobertura}</span>);
  for (const p of disputas) {
    partes.push(<span key={`${p.canal}|${p.alvo ?? ""}`} className="x-neutro">{p.status === "empata"
      ? `Empata com ${p.com.nome} (${sinal(p.com.valor)}): a ${rotuloCanal(p.canal)} recebe ${sinal(p.valor)} uma vez só.`
      : `Não soma na ${rotuloCanal(p.canal)}: ${p.vencedor ? `${p.vencedor.nome} dá ${sinal(p.vencedor.valor)}.` : "outra fonte do mesmo grupo vale mais."}`}</span>);
  }
  for (const f of frases) partes.push(<span key={f.texto} className={f.tom === "atencao" ? "x-atencao" : "x-neutro"}>{f.tom === "atencao" && <AlertTriangle aria-hidden="true" />}{f.texto}</span>);
  if (a.tipo === "condicao" && a.ficha?.resumo) partes.push(<p key="res" className="x-texto" style={{ margin: 0 }}>{a.ficha.resumo}</p>);
  if (a.tipo === "buff" && a.buff.nota) partes.push(<p key="nota" className="x-texto" style={{ margin: 0 }}>{a.buff.nota}</p>);
  if (a.exemplo?.condicao) partes.push(<span key="cond" className="x-neutro" data-condicao><Hand aria-hidden="true" />{a.exemplo.condicao}</span>);
  /* O benefício que o comparador não cobre é DECLARADO, mesmo com a condição escrita: nada de silêncio nem de "Sem Mudança". */
  if (!chips.length && !pvb && foraDosNumeros(a.exemplo)) partes.unshift(<SemNumeros key="fora" exemplo={a.exemplo} />);
  if (!partes.length) {
    const t = a.semNumero ? "A Ficha Não Calcula Este Efeito" : a.tipo === "registro" && d.atencao.length ? "Ainda Fora da Conta"
      : a.tipo === "grupo" && !m.combate ? "Fora de Combate" : "Sem Mudança nos Seus Números";
    partes.push(t === "Sem Mudança nos Seus Números" ? <SemNumeros key="nada" exemplo={a.exemplo} /> : <span key="nada" className="x-mesa">{t}</span>);
  }
  return partes;
}
