/* Lógica das peças da aba Efeitos (hooks e funções puras), separada de pecas.jsx para o Fast Refresh. */
import { useLayoutEffect, useState } from "react";
import { parseTextoRico } from "../../afty-texto-rico";
import { estaLigado, Sessao, AFTY_TIPOS, AFTY_PATAMARES, ehPlayer, regraDo, sistemaDaFicha, rotuloDoNivel, getEspecializacao, addonsDaCriatura } from "./ponte";

/* O texto tem MARCAÇÃO do Afty (negrito, itálico, sublinhado, riscado, título
   ou tabela)? Quem decide é o parser do próprio motor (`afty-texto-rico.js`),
   com as regras dele: o marcador só vale com par na mesma linha, então
   "oficio__2" continua texto. Antes só o item marcado como rico passava pelo
   renderizador, e a descrição de um Feitiço mostrava os asteriscos crus. */
export function temMarcacao(texto) {
  return parseTextoRico(texto).some((b) => b.tipo === "titulo" || b.tipo === "tabela"
    || (b.trechos ?? []).some((t) => t.negrito || t.italico || t.sublinhado || t.riscado));
}

/* ---------------- identidade e recursos ---------------- */
/**
 * A linha de identidade do cabeçalho, com a MESMA regra de sempre: o jogador mostra a CLASSE inicial (no Player não há Tipo) e a criatura o
 * Tipo; o Patamar não existe no jogador; o Grau do Feiticeiro vem do Nível; o tamanho só aparece quando saiu de Médio; Sobrecarregado e a marca
 * de Addon (a ficha não é o livro puro) continuam à vista. Cada item é `{ texto, title?, aviso? }`.
 */
export function linhaDeIdentidade(ficha, derived) {
  const sistema = sistemaDaFicha(ficha);
  const escolhidas = derived.especializacoes?.escolhidas ?? [];
  const nomeDe = (e) => getEspecializacao(e.id)?.nome ?? e.id;
  const classe = escolhidas[0];
  const addons = addonsDaCriatura(ficha);
  const nivel = rotuloDoNivel(sistema);
  return {
    principal: [
      ehPlayer(ficha.rulesVersion)
        ? (classe ? { texto: nomeDe(classe), title: escolhidas.map((e) => `${nomeDe(e)} ${e.nivel}`).join(" · ") } : null)
        : { texto: AFTY_TIPOS.find((x) => x.value === ficha.core?.tipo)?.label },
      regraDo(sistema, "patamarDoJogador") !== "player" ? { texto: AFTY_PATAMARES.find((p) => p.value === ficha.core?.patamar)?.label } : null,
      { texto: `${nivel} ${derived.nd}` },
    ].filter((x) => x?.texto),
    extra: [
      derived.grauFeiticeiro?.label ? { texto: derived.grauFeiticeiro.label, title: `Grau do Feiticeiro, que vem do ${nivel}` } : null,
      derived.tamanhoDegraus !== 0
        ? { texto: `${derived.tamanhoLabel} · ${String(derived.tamanhoEspacoAlcance).replace(".", ",")}m`, title: "Mexe em Atletismo e Furtividade" }
        : null,
      derived.carga?.sobrecarregado ? { texto: "Sobrecarregado", title: `${derived.carga.cargaLimite} espaços de limite`, aviso: true } : null,
      addons.length
        ? { texto: addons.length === 1 ? addons[0].nome : `${addons.length} Addons`, title: addons.map((a) => `${a.nome} ${a.versao}`).join("\n") }
        : null,
    ].filter(Boolean),
  };
}

/** Os recursos correntes do cabeçalho, como a Ficha sempre mostrou: Vida, Energia (que o Bloodfeast troca pelo painel dele), Alma e, só para
 *  quem tem as Artes do Combate, o Preparo. Cada um opera pelo verbo próprio dele, e não tudo como Energia. */
export function recursos(m) {
  const { derived, sessao } = m;
  return [
    { tipo: "pv", rotulo: "Vida", atual: sessao.hpAtual, max: derived.hp, temp: Sessao.pvTempTotal(sessao) },
    ...(derived.bloodfeast?.tem ? [] : [{ tipo: "pe", rotulo: derived.recursoLabel || "Energia", atual: sessao.peAtual, max: derived.pe, temp: Sessao.peTempTotal(sessao) }]),
    { tipo: "alma", rotulo: "Alma", atual: sessao.almaAtual, max: derived.almaMax, temp: 0 },
    ...(derived.pontosPreparo > 0
      ? [{ tipo: "preparo", rotulo: "Preparo", atual: Sessao.preparoDe(sessao, derived.pontosPreparo), max: derived.pontosPreparo, temp: Sessao.preparoTempDe(sessao) }]
      : []),
  ];
}

/* ---------------- estados ---------------- */
export const rotuloOpcao = (l) => String(l ?? "").replace(/^Postura d[oae]s? /, "");

export function valorDoControle(c, combate) {
  const ligado = c.estados.some((e) => estaLigado(e, combate?.[e.id]));
  if (c.partes) {
    const on = c.estados.map((e, i) => (estaLigado(e, combate?.[e.id]) ? c.partes[i] : null)).filter(Boolean);
    return { ligado, texto: on.length ? on.join(", ") : "Nenhum" };
  }
  const e = c.estados[0];
  const v = combate?.[e.id];
  if (e.tipo === "bool") return { ligado, texto: v ? "Ligado" : "Desligado" };
  if (e.tipo === "faixa") return { ligado, texto: String(Math.trunc(Number(v) || e.min || 0)) };
  const ops = e.opcoesVisiveis ?? e.opcoes ?? [];
  if (e.tipo === "multi") return { ligado, texto: (v ?? []).length ? ops.filter((o) => v.includes(o.id)).map((o) => rotuloOpcao(o.label)).join(", ") : "Nenhuma" };
  return { ligado, texto: rotuloOpcao(ops.find((o) => o.id === v)?.label) || "Nenhuma" };
}

export const nomeDoControle = (c) => (c.estados.length === 1 ? c.estados[0].label : c.rotulo);

export const deltasDoControle = (c, deltas) => c.estados.flatMap((e) => deltas?.[e.id] ?? []);

/** A navegação por setas de uma lista: o manipulador vai na própria lista, e `currentTarget` é ela. */
export const navegarLista = (seletor) => (ev) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(ev.key)) return;
  const botoes = [...(ev.currentTarget.querySelectorAll(seletor))];
  const i = botoes.indexOf(document.activeElement);
  if (i < 0) return;
  ev.preventDefault();
  const alvo = ev.key === "Home" ? 0 : ev.key === "End" ? botoes.length - 1 : Math.max(0, Math.min(botoes.length - 1, i + (ev.key === "ArrowDown" ? 1 : -1)));
  botoes[alvo]?.focus();
  botoes[alvo]?.scrollIntoView({ block: "nearest" });
};

export function estadoDaLinha(e, m) {
  const cs = m.controlesPorDono.get(e.chave);
  if (!cs?.length || !m.combate) return null;
  const on = cs.map((c) => ({ c, v: valorDoControle(c, m.sessao.combate) })).filter((x) => x.v.ligado);
  if (!on.length) return null;
  return on.map((x) => (x.c.estados.length === 1 && x.c.estados[0].tipo === "bool" ? x.c.rotulo : x.v.texto)).join(", ");
}

/* ---------------- medida de quanto cabe ---------------- */
/** Quantos `[data-cabe]` cabem numa fileira de `ref`, deixando `reserva` px para o "+N". */
export function useQuantosCabem(ref, chave, reserva = 56) {
  const [cabem, setCabem] = useState(Infinity);
  const [medindo, setMedindo] = useState(true);
  /* Mudou a chave: mede de novo. É estado derivado da própria entrada, então acerta na renderização e não num efeito. */
  const [chaveVista, setChaveVista] = useState(chave);
  if (chaveVista !== chave) { setChaveVista(chave); setMedindo(true); }
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => { if (Math.abs(el.clientWidth - w) > 2) { w = el.clientWidth; setMedindo(true); } });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  useLayoutEffect(() => {
    if (!medindo) return;
    const el = ref.current;
    const itens = [...(el?.querySelectorAll("[data-cabe]") ?? [])];
    if (!el || !itens.length) { setCabem(Infinity); setMedindo(false); return; }
    const base = el.getBoundingClientRect().left;
    const limite = el.clientWidth;
    let n = 0;
    for (const it of itens) {
      const r = it.getBoundingClientRect();
      if (r.right - base <= limite) n += 1; else break;
    }
    if (n < itens.length) {
      while (n > 0 && itens[n - 1].getBoundingClientRect().right - base + reserva > limite) n -= 1;
    }
    setCabem(n);
    setMedindo(false);
  }, [medindo, ref, reserva]);
  return medindo ? Infinity : cabem;
}
