/* Lógica das peças da aba Efeitos (hooks e funções puras), separada de pecas.jsx para o Fast Refresh. */
import { useLayoutEffect, useMemo, useState } from "react";
import { parseTextoRico } from "../../afty-texto-rico";
import { estaLigado, fichaDaCondicao, curaNoGasto, Sessao, AFTY_TIPOS, AFTY_PATAMARES, ehPlayer, regraDo, sistemaDaFicha, rotuloDoNivel, getEspecializacao, addonsDaCriatura, FILTROS_HABILIDADE } from "./ponte";
import { filtrarRepertorio } from "./repertorio";
import { sinal } from "./util";
import { slotsDoFeitico, acertoDoFeitico } from "./feitico";

/* ---------------- preferência de sessão ---------------- */
const MEMORIA = new Map();

export function usePreferencia(chave, padrao) {
  const [v, setV] = useState(() => {
    try { const cru = sessionStorage.getItem(`mesa_ref:${chave}`); if (cru != null) return JSON.parse(cru); } catch { /* bloqueado */ }
    return MEMORIA.has(chave) ? MEMORIA.get(chave) : padrao;
  });
  const muda = (novo) => {
    setV(novo);
    MEMORIA.set(chave, novo);
    try { sessionStorage.setItem(`mesa_ref:${chave}`, JSON.stringify(novo)); } catch { /* bloqueado */ }
  };
  return [v, muda];
}

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
export function linhaDeIdentidade(ficha, derived) {
  const sistema = sistemaDaFicha(ficha);
  const classe = (derived.especializacoes?.escolhidas ?? [])[0];
  const addons = addonsDaCriatura(ficha);
  return {
    principal: [
      ehPlayer(ficha.rulesVersion)
        ? (classe ? getEspecializacao(classe.id)?.nome ?? classe.id : null)
        : AFTY_TIPOS.find((t) => t.value === ficha.core?.tipo)?.label,
      regraDo(sistema, "patamarDoJogador") !== "player" ? AFTY_PATAMARES.find((p) => p.value === ficha.core?.patamar)?.label : null,
      `${rotuloDoNivel(sistema)} ${derived.nd}`,
    ].filter(Boolean),
    extra: [derived.grauFeiticeiro?.label, addons.length ? (addons.length === 1 ? addons[0].nome : `${addons.length} Addons`) : null].filter(Boolean),
  };
}

export function recursos(m) {
  const { derived, sessao } = m;
  return [
    { tipo: "pv", rotulo: "Vida", atual: sessao.hpAtual, max: derived.hp, temp: Sessao.pvTempTotal(sessao) },
    { tipo: "pe", rotulo: derived.recursoLabel || "Energia", atual: sessao.peAtual, max: derived.pe, temp: Sessao.peTempTotal(sessao) },
    { tipo: "alma", rotulo: "Alma", atual: sessao.almaAtual, max: derived.almaMax, temp: 0 },
  ];
}

export const pct = (atual, max) => (max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0);

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

/* ---------------- Feitiço: iniciar, continuar e rolar de novo ---------------- */
export function pendentesDe(at, f) {
  if (!at || at.desfeita) return 0;
  const ids = [...(acertoDoFeitico(f) ? ["acerto"] : []), ...slotsDoFeitico(f).map((s) => s.id)];
  return ids.filter((id) => !at.rolagens.some((x) => x.slot === id)).length;
}

/* ---------------- o item em blocos ---------------- */
export function useBlocosDoItem(m, e) {
  const r = e?.ref ?? {};
  const [blocos, setBlocos] = useState(1);
  const [rodadasCond, setRodadasCond] = useState("");
  const condicao = useMemo(() => (e?.tipo === "condicao" ? fichaDaCondicao(e.nome) : null), [e]);
  if (!e) return null;
  const tipo = e.tipo;
  /* Os controles são DO ITEM MOSTRADO: na prévia da busca, os da prévia. O
     "Agora" só existe para o item aberto (é o derive que o modelo já fez). */
  const ehAberto = e === m.item;
  const controles = ehAberto ? m.doItem : (tipo === "estado" ? (e.controle ? [e.controle] : []) : m.controlesPorDono.get(e.chave) ?? []);
  const b = {
    tipo, e, r, figuras: [], props: [], fontes: [], escolhas: [], avisos: [], acao: null, critico: null,
    ativacoes: [], texto: null, extra: null, controles, temControles: controles.length > 0, deltas: ehAberto ? m.deltas : {},
    fixavel: !["condicao", "estado", "invocacao"].includes(tipo), representado: [],
  };
  if (e.aviso) b.avisos.push(e.aviso);

  if (tipo === "feitico") {
    b.custo = e.custoPE;
    b.custoPartes = r.partesCustoPE;
    b.falta = e.custoPE != null ? Math.max(0, e.custoPE - m.disponivel) : 0;
    b.ativacoes = m.ativacoesDe(e.chave);
    b.pendentes = pendentesDe(b.ativacoes[0], r);
    b.props = (r.propriedades ?? []).filter((p) => p.valor != null && p.valor !== "" && p.id !== "acerto").map((p) => ({ id: p.id, nome: p.nome, valor: p.valor }));
    const ac = acertoDoFeitico(r);
    if (ac) b.props.unshift({ id: "acerto", nome: "Acerto", valor: ac.texto });
    b.avisos.push(...(r.avisos ?? []));
    b.texto = e.texto;
    b.rico = true;
    b.representado = [r.liberacao ? `Liberação Máxima · até ${r.liberacao.max} · ${r.liberacao.custoPE} PE` : null, r.ritual ? "Ritual" : null].filter(Boolean);
  }

  if (tipo === "ataque") {
    const crit = !!m.ui.criticos?.[e.chave];
    b.figuras = [
      { id: "acerto", rotulo: "Acerto", valor: sinal(r.acerto), partes: r.partesAcerto, titulo: `${e.nome} · Acerto`, onRolar: () => m.rolar.acerto(e) },
      { id: "dano", rotulo: crit ? "Dano Crítico" : "Dano", valor: r.texto, partes: r.partes, titulo: `${e.nome} · Dano`, onRolar: () => m.rolar.dano(e), tom: crit ? "critico" : undefined },
    ];
    b.critico = { ativo: crit, alterna: () => m.rolar.alternaCritico(e) };
    b.props = [
      r.margemCritico != null ? { id: "margem", nome: "Margem de Crítico", valor: String(r.margemCritico) } : null,
      r.alcance?.texto ? { id: "alcance", nome: "Alcance", valor: r.alcance.texto } : null,
      r.tipoDanoLabel ? { id: "tipo", nome: "Tipo de Dano", valor: r.tipoDanoLabel } : null,
      ...(r.propriedades ?? []).map((p, i) => ({ id: `p${i}`, nome: "Propriedade", valor: p.nome ?? p.label ?? String(p) })),
    ].filter(Boolean);
    b.fontes = [
      { id: "acerto", titulo: "Acerto", partes: r.partesAcerto, total: sinal(r.acerto) },
      { id: "dano", titulo: "Dano", partes: r.partes, total: r.texto },
    ];
  }

  if (tipo === "cura") {
    const c = curaNoGasto(r, blocos);
    b.figuras = [{ id: "cura", rotulo: "Cura", valor: `${c.dados}${r.dado}${c.fixo ? `+${c.fixo}` : ""}`, partes: r.partes, titulo: e.nome, onRolar: () => m.rolar.curaBlocos(e, c), tom: "cura" }];
    if (r.unidade) {
      b.extra = (
        <span className="m-passos">
          <button type="button" className="m-passo" aria-label="Menos pontos" onClick={() => setBlocos(Math.max(1, blocos - 1))}><Minus aria-hidden="true" /></button>
          <span className="m-passos-valor">{Math.min(blocos, Math.max(1, r.blocos))} {r.unidade}</span>
          <button type="button" className="m-passo" aria-label="Mais pontos" onClick={() => setBlocos(Math.min(Math.max(1, r.blocos), blocos + 1))}><Plus aria-hidden="true" /></button>
        </span>
      );
    }
    if (r.usos != null) b.props.push({ id: "usos", nome: "Usos", valor: String(r.usos) });
    b.fontes = [{ id: "cura", titulo: "Cura", partes: r.partes, total: b.figuras[0].valor }];
  }

  if (tipo === "manobra") {
    b.figuras = [
      { id: "executar", rotulo: r.resistir != null ? "Executar" : "Teste", valor: sinal(r.executar), partes: r.partesExecutar, titulo: e.nome, onRolar: () => m.rolar.teste({ rotulo: r.resistir != null ? `${e.nome} · Executar` : e.nome, bonus: r.executar }) },
      ...(r.resistir != null ? [{ id: "resistir", rotulo: "Resistir", valor: sinal(r.resistir), partes: r.partesResistir, titulo: `${e.nome} · Resistir`, onRolar: () => m.rolar.teste({ rotulo: `${e.nome} · Resistir`, bonus: r.resistir }) }] : []),
    ];
    if (r.periciaUsada) b.props.push({ id: "pericia", nome: "Perícia", valor: r.periciaUsada });
    b.fontes = b.figuras.map((f) => ({ id: f.id, titulo: f.rotulo, partes: f.partes, total: f.valor }));
  }

  if (tipo === "teste") {
    b.figuras = [{ id: "teste", rotulo: e.valor != null ? "Modificador" : "Bônus", valor: e.textoBonus ?? sinal(e.bonus), partes: e.partes, titulo: e.nome, onRolar: () => m.rolar.teste({ rotulo: e.rotuloRolagem ?? e.nome, bonus: e.bonus, dados: e.dados, margem: e.margem }) }];
    if (e.valor != null) b.props.push({ id: "valor", nome: "Valor", valor: String(e.valor) });
    if (e.margem != null) b.props.push({ id: "margem", nome: "Margem de Crítico", valor: String(e.margem) });
    if (e.prof) b.props.push({ id: "prof", nome: "Treino", valor: e.prof === "mestre" ? "Mestre" : e.prof === "especialista" ? "Especialista" : "Treinado" });
    if (e.falha?.length) b.avisos.push(`Falha: ${e.falha.join(", ")}`);
    b.fontes = [{ id: "teste", titulo: "De Onde Vem", partes: e.partes, total: e.textoBonus ?? sinal(e.bonus) }];
  }

  if (tipo === "estado" && e.dono) b.extra = <button type="button" className="m-link" onClick={() => m.selecionar(e.dono.chave)}>Abrir {e.dono.nome}</button>;

  if (tipo === "condicao" && condicao) {
    b.acao = e.aplicada
      ? <button type="button" className="afty-botao m-botao" onClick={() => m.condicoesAcoes.tirar(e.nome)}><X aria-hidden="true" />Tirar</button>
      : (
        <span className="m-aplicar">
          <input className="afty-campo m-campo-num" inputMode="numeric" placeholder="Rod." value={rodadasCond} aria-label="Rodadas da condição"
            onChange={(ev) => setRodadasCond(ev.target.value.replace(/[^\d]/g, ""))} />
          <button type="button" className="afty-botao m-usar" data-nivel="primario" onClick={() => m.condicoesAcoes.aplicar(condicao, rodadasCond ? Math.max(1, Number(rodadasCond)) : null)}>Aplicar</button>
        </span>
      );
    if (condicao.forcaLabel) b.props.push({ id: "forca", nome: "Força", valor: condicao.forcaLabel });
    if (condicao.resumo) b.props.push({ id: "numero", nome: "No Número", valor: condicao.resumo });
    b.texto = condicao.descricao;
  }

  if (["habilidade", "item", "funcionamento", "dominio"].includes(tipo)) {
    b.texto = e.texto;
    b.rico = e.rico;
    const combate = m.sessao.combate;
    b.escolhas = (e.opcoes ?? []).map((o) => ({
      id: o.id, nome: o.nome, descricao: o.descricao,
      ligada: controles.some((c) => c.estados.some((st) => (st.opcoesVisiveis ?? []).some((ov) => ov.id === combate?.[st.id] && ov.requerEscolha === o.id))),
    }));
  }
  return b;
}

/* ---------------- lista ---------------- */
export function useFiltros(m) {
  const { pacote, ui, fixados, ligadosChaves } = m;
  const { rep } = pacote;
  const termo = ui.termo ?? "";
  const filtradas = useMemo(
    () => filtrarRepertorio(rep, { termo, efeito: ui.efeito, faceta: ui.faceta, fixados, ligadosChaves }),
    [rep, termo, ui.efeito, ui.faceta, fixados, ligadosChaves],
  );
  const visiveis = filtradas.reduce((n, s) => n + s.itens.length, 0);
  const grupos = [
    { id: "tudo", rotulo: "Tudo", n: rep.total },
    ...(fixados.length ? [{ id: "fixados", rotulo: "Fixados", n: fixados.length }] : []),
    ...(ligadosChaves.size ? [{ id: "ligados", rotulo: "Ligados", n: ligadosChaves.size }] : []),
    ...rep.secoes.map((s) => ({ id: s.id, rotulo: s.rotulo, n: s.itens.length })),
  ];
  const refs = fixados.map((k) => rep.porChave.get(k) ?? pacote.testes.porChave.get(k)).filter(Boolean);
  const ativos = [
    ui.faceta !== "tudo" ? { id: "faceta", rotulo: grupos.find((g) => g.id === ui.faceta)?.rotulo ?? ui.faceta, limpa: () => m.setUi((u) => ({ ...u, faceta: "tudo" })) } : null,
    ui.efeito !== "todos" ? { id: "efeito", rotulo: FILTROS_HABILIDADE.find((f) => f.id === ui.efeito)?.label ?? ui.efeito, limpa: () => m.setUi((u) => ({ ...u, efeito: "todos" })) } : null,
  ].filter(Boolean);
  return {
    termo, filtradas, visiveis, total: rep.total, grupos, refs, ativos, filtroAtual: ui.faceta, efeitoAtual: ui.efeito,
    setTermo: (t) => m.setUi((u) => ({ ...u, termo: t })),
    setFaceta: (id) => m.setUi((u) => ({ ...u, faceta: id })),
    setEfeito: (id) => m.setUi((u) => ({ ...u, efeito: id })),
    limpar: () => m.setUi((u) => ({ ...u, termo: "", efeito: "todos", faceta: "tudo" })),
  };
}

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

export function valorDaLinha(e) {
  const r = e.ref ?? {};
  if (e.tipo === "ataque") return { a: sinal(r.acerto), b: (r.texto ?? "").replace(/\s/g, "") };
  if (e.tipo === "cura") return { a: r.texto };
  if (e.tipo === "manobra") return { a: sinal(r.executar), b: r.resistir != null ? sinal(r.resistir) : null };
  if (e.tipo === "teste") return { a: e.textoBonus ?? sinal(e.bonus) };
  if (e.tipo === "feitico") return { a: r.valor ?? null, custo: e.custoPE };
  return {};
}

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
