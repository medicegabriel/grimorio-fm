/* Contexto e leitura do Histórico (funções puras e hook), separados de HistoricoSessao.jsx para o Fast Refresh. */

import { createContext, useEffect, useState } from "react";
const sinal = (v) => `${v > 0 ? "+" : "−"}${Math.abs(v)}`;
const doisDigitos = (n) => String(n).padStart(2, "0");

export const HistoricoCtx = createContext(null);

/** O horário REAL do evento (`ev.ts`, gravado quando ele aconteceu). Com a data quando não é de hoje. */
export function horaDoEvento(ts, agora = new Date()) {
  const d = new Date(ts);
  const hora = `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}:${doisDigitos(d.getSeconds())}`;
  const hoje = d.toDateString() === agora.toDateString();
  return hoje ? hora : `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)} ${hora}`;
}

/** O que o evento diz, com a redação do v2 (`Historico.jsx`), mais o que o protótipo registra além dele. */
export function resumoDoEvento(ev) {
  if (ev.tipo === "rolagem") return `${ev.r.rotulo}${ev.r.detalhe ? ` · ${ev.r.detalhe}` : ""}${ev.deNovo ? " · de novo" : ""}`;
  if (ev.tipo === "ativacao") return `${ev.nome} · ${ev.estado ? "ligou" : "usou"} · ${ev.custo} PE`;
  if (ev.tipo === "gasto") return `${ev.nome} · gastou ${ev.custo} PE${ev.dano > 0 ? ` e ${ev.dano} de dano` : ""}`;
  if (ev.tipo === "desfazer") return `${ev.nome} · estorno · ${ev.devolvido} PE de volta`;
  if (ev.tipo === "uso") return `${ev.nome} · uso registrado${ev.usos ? ` · restam ${ev.usos.restam} de ${ev.usos.max}` : ""}`;
  if (ev.tipo === "dano" || ev.tipo === "cura") {
    const partes = [];
    if (ev.mudou.casca) partes.push(`Temporário ${sinal(ev.mudou.casca)}`);
    if (ev.mudou.vida) partes.push(`Vida ${sinal(ev.mudou.vida)}`);
    if (ev.mudou.alma) partes.push(`Alma ${sinal(ev.mudou.alma)}`);
    return `${ev.tipo === "dano" ? "Dano" : "Cura"}${ev.naAlma ? " na Alma" : ""} ${ev.valor}: ${partes.join(" · ") || "sem mudança"}${ev.tipo === "dano" && !ev.naAlma ? " · sem abater RD" : ""}`;
  }
  if (ev.tipo === "rodada") {
    const n = ev.nota;
    /* O Buff de Mesa (a fonte externa registrada) chega sem `nome` no evento do v2: o tipo que o evento traz diz o que foi, sem inventar um nome. */
    return `Rodada ${n.rodada} · Expirou: ${n.expirou.length ? n.expirou.map((x) => x.nome || x.tipo || "Efeito").join(", ") : "nada"}${n.cobrado.length ? ` · Cobrado: ${n.cobrado.map((c) => `${c.nome} −${c.valor} PE`).join(", ")}` : ""}`;
  }
  if (ev.tipo === "info") return ev.texto;
  return ev.tipo;
}

/** O tamanho da janela, para o painel (posicionado uma vez) ser refeito quando ela é redimensionada, sem fechar. */
export function useTamanhoDaJanela() {
  const [t, setT] = useState(() => `${window.innerWidth}x${window.innerHeight}`);
  useEffect(() => {
    const f = () => setT(`${window.innerWidth}x${window.innerHeight}`);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return t;
}
