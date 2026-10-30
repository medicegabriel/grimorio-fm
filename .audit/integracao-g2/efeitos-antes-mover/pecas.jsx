/* ============================================================
   PEÇAS DA MESA REFINADA
   ============================================================
   Comportamento herdado (v2 e composições), aparência nova. Nada aqui
   calcula regra: o número vem do derive, o texto do catálogo.

   Três regras de leitura que atravessam a tela inteira:
   1. NÚMERO QUE ROLA tem fundo de controle e o ícone de dado quando é
      grande. Número que só informa é texto puro.
   2. FONTES moram num botão próprio (ⓘ) no Leitor, e no hover ou toque
      longo nas linhas. Rolar e consultar nunca são o mesmo gesto.
   3. DESTAQUE tem três papéis: ação (preenchido), seleção (barra e fundo
      tênue) e estado ativo (losango e texto claro). Âmbar é só condição.
   ============================================================ */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, ChevronDown, Minus, Plus, RotateCcw, Undo2, Zap, X, Check, Info, Dice5 as Dices,
} from "lucide-react";
import TextoRico from "../../ui/TextoRico";
import { parseTextoRico } from "../../afty-texto-rico";
import { ListaDeFontes } from "./ui-fontes";
import {
  estaLigado, fichaDaCondicao, curaNoGasto, Sessao, deltaDeEstados, AFTY_TIPOS, AFTY_PATAMARES, ehPlayer, regraDo,
  sistemaDaFicha, rotuloDoNivel, getEspecializacao, addonsDaCriatura, FILTROS_HABILIDADE,
} from "./ponte";
import { podeDesfazer } from "./mesa-verbos";
import { filtrarRepertorio } from "./repertorio";
import { sinal } from "./util";
import { slotsDoFeitico, acertoDoFeitico } from "./feitico";

export { ListaDeFontes };

/* ---------------- preferência de sessão ---------------- */
/** Um valor que dura a sessão do navegador (sessionStorage), com rede em memória. */
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

/* ---------------- painel flutuante ---------------- */
/* Portal para dentro de #afty-ficha (tokens e @scope valem). Esc e clique
   fora fecham e o foco volta para quem abriu. `dica`: aberto por hover,
   não rouba o foco e fecha quando o ponteiro sai. */
export function Flutuante({ ancora, onFechar, children, largura = 300, rotulo, classe = "", dica = false, lado = "auto" }) {
  const caixa = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    const r = ancora?.getBoundingClientRect?.();
    if (!r) return;
    const alto = window.innerHeight;
    const larg = Math.min(largura, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - larg - 8));
    const abaixo = lado === "baixo" || (lado === "auto" && r.bottom < alto * 0.6);
    setPos(abaixo ? { top: r.bottom + 6, left, width: larg, maxHeight: alto - r.bottom - 16 } : { bottom: alto - r.top + 6, left, width: larg, maxHeight: r.top - 16 });
  }, [ancora, largura, lado]);
  useEffect(() => {
    const anterior = document.activeElement;
    const tecla = (e) => { if (e.key === "Escape") { e.stopPropagation(); onFechar(); } };
    const fora = (e) => {
      if (caixa.current?.contains(e.target) || ancora?.contains?.(e.target)) return;
      onFechar();
    };
    window.addEventListener("keydown", tecla, true);
    window.addEventListener("pointerdown", fora, true);
    if (!dica) requestAnimationFrame(() => caixa.current?.querySelector("button:not(:disabled), input, select, [tabindex]")?.focus?.());
    return () => {
      window.removeEventListener("keydown", tecla, true);
      window.removeEventListener("pointerdown", fora, true);
      if (!dica && anterior && document.contains(anterior)) anterior.focus?.();
    };
  }, [onFechar, ancora, dica]);
  const raiz = document.getElementById("afty-ficha") ?? document.body;
  if (!pos) return null;
  return createPortal(
    <div ref={caixa} role={dica ? "tooltip" : "dialog"} aria-label={rotulo} className={`m-flutuante ${classe}`} data-dica={dica ? "sim" : undefined}
      style={{ position: "fixed", ...pos }}>
      {children}
    </div>,
    raiz,
  );
}

/* ---------------- números ---------------- */
function useFontesPorGesto(temFontes) {
  const [aberto, setAberto] = useState(null);
  const tempo = useRef(null);
  const longo = useRef(false);
  const eventos = (el) => ({
    onPointerDown: (e) => {
      if (e.pointerType !== "touch" || !temFontes) return;
      longo.current = false;
      clearTimeout(tempo.current);
      tempo.current = setTimeout(() => { longo.current = true; setAberto({ ancora: el(), dica: false }); }, 450);
    },
    onPointerUp: () => clearTimeout(tempo.current),
    onPointerEnter: (e) => {
      if (e.pointerType !== "mouse" || !temFontes) return;
      clearTimeout(tempo.current);
      tempo.current = setTimeout(() => setAberto({ ancora: el(), dica: true }), 550);
    },
    onPointerLeave: () => {
      clearTimeout(tempo.current);
      setAberto((a) => (a?.dica ? null : a));
    },
    onContextMenu: (e) => { if (temFontes) e.preventDefault(); },
  });
  return { aberto, setAberto, longo, eventos };
}

/** Número que ROLA. Fundo de controle; no tamanho grande, o dado aparece. */
export function Rolavel({ valor, partes, total, titulo, onRolar, classe = "", grande = false, fontes = "gesto", rotuloAria, tom }) {
  const botao = useRef(null);
  const infoRef = useRef(null);
  const temFontes = Array.isArray(partes) && partes.length > 0;
  const { aberto, setAberto, longo, eventos } = useFontesPorGesto(temFontes && fontes !== "botao");
  return (
    <span className={`m-num ${classe}`} data-grande={grande ? "sim" : undefined} data-tom={tom}>
      <button ref={botao} type="button" className="afty-rolavel m-rola" {...eventos(() => botao.current)}
        onClick={(e) => { if (longo.current) { longo.current = false; e.preventDefault(); return; } onRolar?.(); }}
        aria-label={rotuloAria ?? `Rolar ${titulo ?? ""} ${valor}`}>
        {grande && <Dices className="m-rola-dado" aria-hidden="true" />}
        <span className="m-rola-valor">{valor}</span>
      </button>
      {temFontes && fontes === "botao" && (
        <button ref={infoRef} type="button" className="m-fontes" aria-label={`Fontes de ${titulo ?? "este número"}`} title="De Onde Vem"
          aria-haspopup="dialog" onClick={() => setAberto((a) => (a ? null : { ancora: infoRef.current, dica: false }))}>
          <Info aria-hidden="true" />
        </button>
      )}
      {aberto && (
        <Flutuante ancora={aberto.ancora} onFechar={() => setAberto(null)} largura={300} rotulo={`Fontes de ${titulo ?? ""}`} dica={aberto.dica}>
          <ListaDeFontes partes={partes} total={total ?? valor} titulo={titulo} />
        </Flutuante>
      )}
    </span>
  );
}

/** Número que só INFORMA: texto; o clique (ou o hover) abre as fontes. */
export function Valor({ valor, partes, total, titulo, classe = "" }) {
  const botao = useRef(null);
  const temFontes = Array.isArray(partes) && partes.length > 0;
  const { aberto, setAberto, longo, eventos } = useFontesPorGesto(temFontes);
  if (!temFontes) return <span className={`m-valor ${classe}`}>{valor}</span>;
  return (
    <span className={`m-valor ${classe}`}>
      <button ref={botao} type="button" className="m-valor-botao" {...eventos(() => botao.current)} aria-haspopup="dialog"
        onClick={() => { if (longo.current) { longo.current = false; return; } setAberto((a) => (a && !a.dica ? null : { ancora: botao.current, dica: false })); }}
        aria-label={`${titulo}: ${valor}. Ver fontes`}>{valor}</button>
      {aberto && (
        <Flutuante ancora={aberto.ancora} onFechar={() => setAberto(null)} largura={290} rotulo={`Fontes de ${titulo}`} dica={aberto.dica}>
          <ListaDeFontes partes={partes} total={total ?? valor} titulo={titulo} />
        </Flutuante>
      )}
    </span>
  );
}

/** As fontes num botão ⓘ próprio, para o número que mora dentro de outro botão. */
export function BotaoFontes({ partes, total, titulo, classe = "" }) {
  const [aberto, setAberto] = useState(null);
  if (!Array.isArray(partes) || !partes.length) return null;
  return (
    <>
      <button type="button" className={`m-fontes ${classe}`} aria-label={`Fontes de ${titulo}`} title="De Onde Vem" aria-haspopup="dialog"
        onClick={(e) => { const alvo = e.currentTarget; setAberto((a) => (a ? null : alvo)); }}>
        <Info aria-hidden="true" />
      </button>
      {aberto && (
        <Flutuante ancora={aberto} onFechar={() => setAberto(null)} largura={290} rotulo={`Fontes de ${titulo}`}>
          <ListaDeFontes partes={partes} total={total} titulo={titulo} />
        </Flutuante>
      )}
    </>
  );
}

/* ---------------- texto ---------------- */
const paragrafos = (texto) => String(texto ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
/* O texto tem MARCAÇÃO do Afty (negrito, itálico, sublinhado, riscado, título
   ou tabela)? Quem decide é o parser do próprio motor (`afty-texto-rico.js`),
   com as regras dele: o marcador só vale com par na mesma linha, então
   "oficio__2" continua texto. Antes só o item marcado como rico passava pelo
   renderizador, e a descrição de um Feitiço mostrava os asteriscos crus. */
export function temMarcacao(texto) {
  return parseTextoRico(texto).some((b) => b.tipo === "titulo" || b.tipo === "tabela"
    || (b.trechos ?? []).some((t) => t.negrito || t.italico || t.sublinhado || t.riscado));
}
/* O texto de uma regra, em TODA consulta. Com marcação, pelo MESMO renderizador
   do criador e da Ficha (`TextoRico`), em nós React, nunca HTML. Sem ela, os
   parágrafos de sempre. */
export function TextoRegra({ texto, rico, classe = "" }) {
  if (!String(texto ?? "").trim()) return null;
  if (rico || temMarcacao(texto)) return <div className={`afty-texto m-texto ${classe}`} data-texto-rico><TextoRico texto={texto} /></div>;
  return <div className={`afty-texto m-texto ${classe}`}>{paragrafos(texto).map((p, i) => <p key={i}>{p}</p>)}</div>;
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

export function Retrato({ ficha, classe = "" }) {
  if (!ficha.portraitUrl) {
    const iniciais = String(ficha.name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("");
    return <span className={`afty-retrato m-retrato m-retrato-vazio ${classe}`} aria-hidden="true">{iniciais}</span>;
  }
  return (
    <img className={`afty-retrato m-retrato ${classe}`} src={ficha.portraitUrl} alt={`Retrato de ${ficha.name}`}
      style={{ objectPosition: `${ficha.portraitFocus?.x ?? 50}% ${ficha.portraitFocus?.y ?? 50}%` }} />
  );
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

export function Barra({ r, classe = "" }) {
  const p = pct(r.atual, r.max);
  const t = r.max > 0 ? Math.max(0, Math.min(100 - p, (r.temp / r.max) * 100)) : 0;
  return (
    <span className={`afty-vital-trilho m-barra ${classe}`} data-recurso={r.tipo} aria-hidden="true">
      <span className="afty-vital-barra m-barra-cheia" style={{ width: `${p}%` }} />
      {t > 0 && <span className="m-barra-temp" style={{ left: `${p}%`, width: `${t}%` }} />}
    </span>
  );
}

/** Um recurso: rótulo, número, máximo, temporário e a barra. Abre o painel. */
export function Medidor({ r, m, onAbrir, classe = "" }) {
  const fl = m.flash?.[r.tipo];
  const alerta = r.max > 0 && r.atual / r.max <= 0.25 ? "critico" : undefined;
  return (
    <button type="button" className={`afty-vital m-medidor ${classe}`} data-afty-vital={r.tipo} data-recurso={r.tipo} data-alerta={alerta} onClick={onAbrir}
      aria-label={`${r.rotulo}: ${r.atual} de ${r.max}${r.temp ? `, mais ${r.temp} temporário` : ""}. Abrir painel`}>
      <span className="m-medidor-topo">
        <span className="afty-vital-rotulo m-medidor-rotulo">{r.rotulo}</span>
        <span className="m-medidor-num">
          <b className="afty-vital-numero">{r.atual}</b><span className="afty-vital-max">/{r.max}</span>
          {r.temp > 0 && <em>+{r.temp}</em>}
        </span>
        {fl && <i key={fl.ts} className="m-flash" data-sinal={fl.valor < 0 ? "menos" : "mais"}>{sinal(fl.valor)}</i>}
      </span>
      <Barra r={r} />
    </button>
  );
}

export function PainelVital({ tipo, m, onFechar }) {
  const { derived, sessao, acoes, item } = m;
  const motivo = item && item.tipo !== "teste" ? item.nome : null;
  const [valor, setValor] = useState("");
  const [comMotivo, setComMotivo] = useState(!!motivo);
  const [erro, setErro] = useState(null);
  const n = Math.max(0, Math.trunc(Number(valor) || 0));
  const max = tipo === "pv" ? derived.hp : tipo === "pe" ? derived.pe : derived.almaMax;
  const atual = tipo === "pv" ? sessao.hpAtual : tipo === "pe" ? sessao.peAtual : sessao.almaAtual;
  const fontes = tipo === "pv" ? sessao.pvTempFontes : tipo === "pe" ? sessao.peTempFontes : null;
  const partes = derived.partes?.[tipo === "pv" ? "hp" : tipo === "pe" ? "pe" : "almaMax"] ?? null;
  const rotulo = tipo === "pv" ? "Vida" : tipo === "pe" ? derived.recursoLabel : "Alma";
  const faz = (fn) => { const r = fn(); if (r?.erro) setErro(r.erro); else { setErro(null); setValor(""); } };
  const principal = () => (tipo === "pe" ? acoes.gastar(n, comMotivo ? motivo : null) : acoes.dano(n, tipo === "alma"));
  return (
    <div className="m-painel-vital">
      <div className="m-pv-titulo"><b>{rotulo}</b><span className="m-pv-numero">{atual}<small>/{max}</small></span></div>
      <div className="m-pv-linha">
        <input className="afty-campo m-campo-num" inputMode="numeric" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ""))}
          aria-label={`Valor para ${rotulo}`} placeholder="0" onKeyDown={(e) => { if (e.key === "Enter" && n) faz(principal); }} />
        {tipo === "pe" ? (
          <>
            <button type="button" className="afty-botao m-botao" disabled={!n} onClick={() => faz(principal)}>Gastar</button>
            <button type="button" className="afty-botao m-botao" disabled={!n} onClick={() => faz(() => acoes.recuperarPe(n))}>Recuperar</button>
          </>
        ) : (
          <>
            <button type="button" className="afty-botao m-botao m-botao-dano" disabled={!n} onClick={() => faz(principal)}>Dano</button>
            <button type="button" className="afty-botao m-botao m-botao-cura" disabled={!n} onClick={() => faz(() => acoes.cura(n, tipo === "alma"))}>Cura</button>
          </>
        )}
      </div>
      {tipo === "pe" && motivo && (
        <label className="m-pv-motivo">
          <input type="checkbox" checked={comMotivo} onChange={(e) => setComMotivo(e.target.checked)} />
          <span>Registrar como <b>{motivo}</b></span>
        </label>
      )}
      {erro && <div className="m-erro" role="alert">{erro}</div>}
      <button type="button" className="afty-botao m-botao m-pv-definir" onClick={() => faz(() => acoes.definir(tipo, n))} disabled={valor === ""}>Definir {rotulo} em {valor || "…"}</button>
      {fontes && Object.keys(fontes).length > 0 && (
        <div className="m-pv-bloco">
          <div className="m-rotulo">{rotulo} Temporário</div>
          {Object.entries(fontes).map(([nome, v]) => <div key={nome} className="pf-fontes-linha"><span>{nome}</span><b>{v}</b></div>)}
        </div>
      )}
      <div className="m-pv-bloco">
        <div className="m-rotulo">Máximo</div>
        <ListaDeFontes partes={partes} total={max} />
      </div>
      <div className="m-pv-rodape"><button type="button" className="afty-botao m-botao" onClick={onFechar}>Fechar</button></div>
    </div>
  );
}

export function DanoCura({ m, classe = "" }) {
  const [v, setV] = useState("");
  const n = Math.max(0, Math.trunc(Number(v) || 0));
  return (
    <form className={`m-danocura ${classe}`} onSubmit={(e) => { e.preventDefault(); if (n) { m.acoes.dano(n); setV(""); } }}>
      <input className="afty-campo m-campo-num" inputMode="numeric" placeholder="0" value={v} aria-label="Valor de dano ou cura na Vida"
        onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ""))} />
      <button type="submit" className="afty-botao m-botao m-botao-dano" disabled={!n}>Dano</button>
      <button type="button" className="afty-botao m-botao m-botao-cura" disabled={!n} onClick={() => { m.acoes.cura(n); setV(""); }}>Cura</button>
    </form>
  );
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

/** O controle inteiro, horizontal: segmentos até cinco opções, seletor acima disso.
    `limite` (só no rascunho de uma Preparação): no multi, com o limite cheio, as
    opções não escolhidas ficam desabilitadas, e desmarcar continua livre. */
export function Controle({ c, m, compacto = false, limite = null }) {
  const { sessao, derived } = m;
  const fora = !m.combate;
  if (c.partes) {
    return (
      <span className="m-seg" role="group" aria-label={c.rotulo}>
        {c.estados.map((e, i) => {
          const on = estaLigado(e, sessao.combate?.[e.id]);
          return <button key={e.id} type="button" className="m-seg-op" aria-pressed={on} disabled={fora} onClick={() => m.estadoMuda(e, !on, c.id)}>{c.partes[i]}</button>;
        })}
      </span>
    );
  }
  const e = c.estados[0];
  const v = sessao.combate?.[e.id];
  const custo = typeof e.custoPE === "function" ? e.custoPE(v) : e.custoPE;
  if (e.tipo === "bool") {
    return (
      <span className="m-ctrl">
        <button type="button" className="m-chave" role="switch" aria-checked={!!v} disabled={fora} onClick={() => m.estadoMuda(e, !v, c.id)} aria-label={e.label}>
          <span className="m-chave-trilho" aria-hidden="true"><span /></span>{v ? "Ligado" : "Desligado"}
        </button>
        {custo != null && <span className="m-custo">{custo} PE{e.id === "invencivelSobOSol" ? " por Rodada" : ""}</span>}
      </span>
    );
  }
  if (e.tipo === "faixa") {
    const min = e.min ?? 0;
    const max = typeof e.max === "function" ? e.max(derived) : (e.max ?? 99);
    const n = Math.max(min, Math.trunc(Number(v) || min));
    return (
      <span className="m-passos">
        <button type="button" className="m-passo" aria-label={`${e.label} menos 1`} disabled={fora || n <= min} onClick={() => m.estadoMuda(e, n - 1, c.id)}><Minus aria-hidden="true" /></button>
        <span className="m-passos-valor" aria-live="polite">{n}{Number.isFinite(max) ? <small>/{max}</small> : null}</span>
        <button type="button" className="m-passo" aria-label={`${e.label} mais 1`} disabled={fora || n >= max} onClick={() => m.estadoMuda(e, n + 1, c.id)}><Plus aria-hidden="true" /></button>
        {custo != null && <span className="m-custo">{custo} PE</span>}
      </span>
    );
  }
  const ops = e.opcoesVisiveis ?? e.opcoes ?? [];
  if (e.tipo === "multi") {
    const lista = Array.isArray(v) ? v : [];
    const cheio = limite != null && lista.length >= limite;
    return (
      <span className="m-seg" role="group" aria-label={e.label}>
        {ops.map((o) => {
          const on = lista.includes(o.id);
          return <button key={o.id} type="button" className="m-seg-op" aria-pressed={on} disabled={fora || (cheio && !on)} data-opcao={o.id} onClick={() => m.estadoMuda(e, on ? lista.filter((x) => x !== o.id) : [...lista, o.id], c.id)}>{rotuloOpcao(o.label)}</button>;
        })}
      </span>
    );
  }
  if (ops.length <= (compacto ? 3 : 5)) {
    return (
      <span className="m-seg" role="radiogroup" aria-label={e.label}>
        {[{ id: null, label: "Nenhuma" }, ...ops].map((o) => (
          <button key={o.id ?? "nenhuma"} type="button" className="m-seg-op" role="radio" aria-checked={(v ?? null) === o.id} disabled={fora} onClick={() => m.estadoMuda(e, o.id, c.id)}>
            {rotuloOpcao(o.label)}
          </button>
        ))}
      </span>
    );
  }
  return (
    <span className="m-ctrl m-select">
      <select className="afty-campo" value={v ?? ""} disabled={fora} aria-label={e.label} onChange={(ev) => m.estadoMuda(e, ev.target.value || null, c.id)}>
        <option value="">Nenhuma</option>
        {ops.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown aria-hidden="true" />
    </span>
  );
}

export function Deltas({ chips, classe = "" }) {
  if (!chips?.length) return null;
  return (
    <ul className={`m-deltas ${classe}`} aria-live="polite">
      {chips.map((ch) => (
        <li key={ch.chave ?? ch.rotulo} data-sinal={(ch.valor ?? 0) < 0 ? "menos" : "mais"}><span>{ch.rotulo}</span><b>{ch.texto}</b></li>
      ))}
    </ul>
  );
}
export const deltasDoControle = (c, deltas) => c.estados.flatMap((e) => deltas?.[e.id] ?? []);

/* Um controle do Em Jogo em forma curta. Ativo: losango e valor. Desligado:
   só o nome, apagado. Interruptor liga direto; o resto abre o controle. */
export function ChipEstado({ c, m, classe = "" }) {
  const [aberto, setAberto] = useState(null);
  const combate = m.sessao.combate;
  const fora = !m.combate;
  const unico = c.estados.length === 1 ? c.estados[0] : null;
  const { ligado, texto } = valorDoControle(c, combate);
  const estado = ligado ? "ativo" : "desligado";
  const agora = useMemo(() => (aberto ? deltaDeEstados(m.ficha, m.sessao, m.derived, c.estados) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aberto, m.sessao, m.derived]);
  if (unico?.tipo === "bool") {
    return (
      <button type="button" className={`m-chip ${classe}`} data-estado={estado} aria-pressed={ligado} disabled={fora}
        onClick={() => m.estadoMuda(unico, !combate?.[unico.id], c.id)} title={c.rotulo}>
        <span className="m-chip-nome">{c.rotulo}</span>
      </button>
    );
  }
  return (
    <>
      <button type="button" className={`m-chip ${classe}`} data-estado={estado} aria-haspopup="dialog" disabled={fora}
        onClick={(e) => setAberto(e.currentTarget)} aria-label={`${c.rotulo}: ${texto}. Mudar`} title={`${c.rotulo}: ${texto}`}>
        <span className="m-chip-nome">{c.rotulo}</span>
        {ligado && <b className="m-chip-valor">{texto}</b>}
        <ChevronDown aria-hidden="true" />
      </button>
      {aberto && (
        <Flutuante ancora={aberto} onFechar={() => setAberto(null)} largura={320} rotulo={c.rotulo}>
          <div className="m-chip-painel">
            <div className="m-rotulo">{nomeDoControle(c)}</div>
            <Controle c={c} m={m} />
            <Deltas chips={deltasDoControle(c, agora)} />
            {c.dono && <button type="button" className="m-link" onClick={() => { setAberto(null); m.selecionar(c.dono.chave); }}>Abrir {c.dono.nome}</button>}
          </div>
        </Flutuante>
      )}
    </>
  );
}

/* ---------------- Feitiço: iniciar, continuar e rolar de novo ---------------- */
export function pendentesDe(at, f) {
  if (!at || at.desfeita) return 0;
  const ids = [...(acertoDoFeitico(f) ? ["acerto"] : []), ...slotsDoFeitico(f).map((s) => s.id)];
  return ids.filter((id) => !at.rolagens.some((x) => x.slot === id)).length;
}

/** O botão que INICIA uma utilização. Na segunda em diante, diz que cobra de novo. */
export function BotaoUsar({ e, m, classe = "", curto = false, secundario = false }) {
  const falta = e.custoPE != null ? Math.max(0, e.custoPE - m.disponivel) : 0;
  const ja = m.ativacoesDe(e.chave).length > 0;
  const verbo = curto ? "Usar" : ja ? "Usar de Novo" : "Usar";
  return (
    <button type="button" className={`afty-botao m-usar ${classe}`} data-nivel={secundario ? "secundario" : "primario"} disabled={falta > 0}
      onClick={() => m.acoesFeitico.usar(e)} aria-label={`${verbo} ${e.nome}, cobra ${e.custoPE} PE`} title={falta > 0 ? `Faltam ${falta} PE` : `Cobra ${e.custoPE} PE`}>
      <Zap aria-hidden="true" /><span className="m-usar-verbo">{verbo}</span>
      <span className="m-usar-custo">{ja && !curto ? "Cobra " : ""}{e.custoPE} PE</span>
    </button>
  );
}

export function Ativacao({ at, f, m, atual }) {
  const pode = podeDesfazer(m.mesa, at.id);
  const casca = Object.values(at.pago?.casca ?? {}).reduce((a, b) => a + b, 0);
  const slots = slotsDoFeitico(f);
  const acerto = acertoDoFeitico(f);
  const ultimaDe = (slot) => [...at.rolagens].reverse().find((x) => x.slot === slot);
  const pendentes = pendentesDe(at, f);
  const linha = ({ id, rotulo, formula, desc, meta, aviso }) => {
    const u = ultimaDe(id);
    return (
      <li key={id} className="m-slot" data-estado={u ? "rolado" : "pendente"}>
        <span className="m-slot-rotulo">{rotulo}{aviso}</span>
        {u ? (
          <>
            <span className="m-slot-resultado"><b>{u.r.total}</b><span className="m-dados">{(u.r.d20 ?? u.r.dados ?? []).slice(0, 12).map((d, i) => <span key={i} data-descartado={u.r.descartado === i ? "sim" : undefined}>{d}</span>)}</span>
              {u.r.critico && u.r.tipo === "teste" && <span className="m-tag m-tag-critico">Crítico</span>}</span>
            <button type="button" className="m-de-novo" onClick={() => m.acoesFeitico.rolar(at.id, desc, { slot: id, deNovo: true })} aria-label={`Rolar de novo ${rotulo}, sem cobrar`} title="Rolar de Novo">
              <RotateCcw aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" className="m-slot-rolar" onClick={() => m.acoesFeitico.rolar(at.id, desc, meta)} aria-label={`Rolar ${rotulo}, ${formula}`}>
            <Dices aria-hidden="true" /><span>Rolar</span><b>{formula}</b>
          </button>
        )}
      </li>
    );
  };
  return (
    <section className="m-ativacao" data-desfeita={at.desfeita ? "sim" : undefined} data-atual={atual ? "sim" : undefined} data-pendente={atual && pendentes > 0 ? "sim" : undefined}
      aria-label={atual ? "Utilização atual" : "Utilização anterior"}>
      <div className="m-ativacao-topo">
        <span className="m-ativacao-titulo">{atual ? "Em Uso" : "Anterior"}<span> · Rodada {at.rodada}</span>{atual && pendentes > 0 && <span className="m-ativacao-falta"> · {pendentes} {pendentes === 1 ? "Rolagem Pendente" : "Rolagens Pendentes"}</span>}</span>
        <button type="button" className="m-link m-desfazer" disabled={!pode.ok} onClick={() => m.acoesFeitico.desfazer(at.id)} title={pode.ok ? "Devolve o que esta utilização gastou" : pode.motivo}>
          <Undo2 aria-hidden="true" />{at.desfeita ? "Desfeita" : "Desfazer"}
        </button>
        <span className="m-ativacao-pago">{at.custo === 0 ? "Sem custo" : casca > 0 ? `Pago com ${at.pago.reserva} da Reserva e ${casca} Temporário` : "Pago da Reserva"}</span>
      </div>
      {at.desfeita && at.limites?.length > 0 && <ul className="m-limites">{at.limites.map((l) => <li key={l}><AlertTriangle aria-hidden="true" />{l}</li>)}</ul>}
      {!at.desfeita && atual && (
        <ol className="m-slots">
          {acerto && linha({
            id: "acerto", rotulo: "Acerto", formula: acerto.texto,
            desc: { tipo: "teste", rotulo: `${f.nome} · Acerto`, bonus: acerto.bonus }, meta: { slot: "acerto" },
            aviso: <AlertTriangle className="m-aviso-icone" aria-label="O ajuste de acerto por golpe não é calculado"><title>O ajuste de acerto por golpe não é calculado</title></AlertTriangle>,
          })}
          {slots.map((s) => linha({
            id: s.id, rotulo: s.rotulo, formula: s.formula, desc: s.desc,
            meta: { slot: s.id, consomeEstado: s.primeira ? f.consomeEstado : null, feiticoDanoId: s.primeira && f.tipo === "dano" ? f.id : null },
          }))}
        </ol>
      )}
    </section>
  );
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

export function PainelFiltros({ f, onFechar }) {
  return (
    <div className="m-filtros">
      <div className="m-rotulo">Grupo</div>
      <div className="m-filtros-grupos" role="radiogroup" aria-label="Grupo">
        {f.grupos.map((g) => (
          <button key={g.id} type="button" role="radio" aria-checked={f.filtroAtual === g.id} className="m-filtro-grupo" onClick={() => { f.setFaceta(g.id); onFechar?.(); }}>
            <span>{g.rotulo}</span><small>{g.n}</small>
          </button>
        ))}
      </div>
      <label className="m-filtros-efeito">
        <span className="m-rotulo">Efeito</span>
        <span className="m-select">
          <select className="afty-campo" value={f.efeitoAtual} onChange={(ev) => f.setEfeito(ev.target.value)} aria-label="Filtrar por efeito">
            <option value="todos">Todos</option>
            {FILTROS_HABILIDADE.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
          <ChevronDown aria-hidden="true" />
        </span>
      </label>
    </div>
  );
}

export const navegarLista = (listaRef, seletor) => (ev) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(ev.key)) return;
  const botoes = [...(listaRef.current?.querySelectorAll(seletor) ?? [])];
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

/** Os números de uma linha: roláveis com fundo; custo e valor só texto. */
export function ValoresDaLinha({ e, m, curto = false }) {
  const v = valorDaLinha(e);
  const r = e.ref ?? {};
  if (e.tipo === "ataque") {
    return (
      <>
        <Rolavel valor={v.a} partes={r.partesAcerto} titulo={`${e.nome} · Acerto`} onRolar={() => m.rolar.acerto(e)} />
        {!curto && <Rolavel valor={v.b} partes={r.partes} titulo={`${e.nome} · Dano`} onRolar={() => m.rolar.dano(e)} />}
      </>
    );
  }
  if (e.tipo === "teste") return <Rolavel valor={v.a} partes={e.partes} titulo={e.nome} onRolar={() => m.rolar.teste({ rotulo: e.rotuloRolagem ?? e.nome, bonus: e.bonus, dados: e.dados, margem: e.margem })} />;
  if (e.tipo === "manobra") {
    return (
      <>
        <Rolavel valor={v.a} partes={r.partesExecutar} titulo={v.b ? `${e.nome} · Executar` : e.nome} onRolar={() => m.rolar.teste({ rotulo: v.b ? `${e.nome} · Executar` : e.nome, bonus: r.executar })} />
        {v.b && !curto && <Rolavel valor={v.b} partes={r.partesResistir} titulo={`${e.nome} · Resistir`} onRolar={() => m.rolar.teste({ rotulo: `${e.nome} · Resistir`, bonus: r.resistir })} />}
      </>
    );
  }
  if (e.tipo === "cura") return <Rolavel valor={v.a} partes={r.partes} titulo={e.nome} onRolar={() => m.rolar.cura(e)} tom="cura" />;
  if (e.tipo === "feitico" && v.custo != null) return <span className="m-custo-linha">{v.custo} PE</span>;
  return null;
}

/* ---------------- medida de quanto cabe ---------------- */
/** Quantos `[data-cabe]` cabem numa fileira de `ref`, deixando `reserva` px para o "+N". */
export function useQuantosCabem(ref, chave, reserva = 56) {
  const [cabem, setCabem] = useState(Infinity);
  const [medindo, setMedindo] = useState(true);
  useLayoutEffect(() => { setMedindo(true); }, [chave]);
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

/* ---------------- avisos ---------------- */
export function AvisoFlutuante({ m, classe = "" }) {
  const a = m.aviso;
  if (!a) return null;
  return (
    <div className={`m-aviso-flutuante ${classe}`} role="status">
      {a.rolagem ? (
        <>
          <span className="m-aviso-rotulo">{a.rolagem.r.rotulo}{a.rolagem.r.detalhe ? ` · ${a.rolagem.r.detalhe}` : ""}</span>
          <b className="m-aviso-total">{a.rolagem.r.total}</b>
          <span className="m-dados">{(a.rolagem.r.d20 ?? a.rolagem.r.dados ?? []).slice(0, 8).map((d, i) => <span key={i}>{d}</span>)}</span>
          <button type="button" className="m-de-novo" onClick={() => m.rolarDesc(a.rolagem.desc, { deNovo: true })} aria-label="Rolar de novo" title="Rolar de Novo"><RotateCcw aria-hidden="true" /></button>
        </>
      ) : <span>{a.texto}</span>}
    </div>
  );
}

export function Limites({ avisos }) {
  if (!avisos?.length) return null;
  return <ul className="m-limites">{avisos.map((a) => <li key={a}><AlertTriangle aria-hidden="true" />{a}</li>)}</ul>;
}

export { Check };
