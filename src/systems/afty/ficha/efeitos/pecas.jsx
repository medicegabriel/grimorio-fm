/* ============================================================
   PEÇAS DA MESA REFINADA
   ============================================================
   Nada aqui calcula regra: o número vem do derive, o texto do catálogo.

   Três regras de leitura que atravessam a tela inteira:
   1. NÚMERO QUE ROLA tem fundo de controle e o ícone de dado quando é
      grande. Número que só informa é texto puro.
   2. FONTES moram num botão próprio (ⓘ) no Leitor, e no hover ou toque
      longo nas linhas. Rolar e consultar nunca são o mesmo gesto.
   3. DESTAQUE tem três papéis: ação (preenchido), seleção (barra e fundo
      tênue) e estado ativo (losango e texto claro). Âmbar é só condição.
   ============================================================ */
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Minus, Plus, RotateCcw, Check } from "lucide-react";
import TextoRico from "../../ui/TextoRico";
import { ListaDeFontes } from "./ui-fontes";
import { estaLigado, Sessao } from "./ponte";
import { sinal } from "./util";

import { temMarcacao, rotuloOpcao } from "./pecas-logica";
export { ListaDeFontes };

/* ---------------- painel flutuante ---------------- */
function posicaoDoPainel(ancora, largura, lado) {
  const r = ancora?.getBoundingClientRect?.();
  if (!r) return null;
  const alto = window.innerHeight;
  const larg = Math.min(largura, window.innerWidth - 16);
  const left = Math.max(8, Math.min(r.left, window.innerWidth - larg - 8));
  const abaixo = lado === "baixo" || (lado === "auto" && r.bottom < alto * 0.6);
  return abaixo ? { top: r.bottom + 6, left, width: larg, maxHeight: alto - r.bottom - 16 } : { bottom: alto - r.top + 6, left, width: larg, maxHeight: r.top - 16 };
}

/* Portal para dentro de #afty-ficha (tokens e @scope valem). Esc e clique
   fora fecham e o foco volta para quem abriu. `dica`: aberto por hover,
   não rouba o foco e fecha quando o ponteiro sai. */
export function Flutuante({ ancora, onFechar, children, largura = 300, rotulo, classe = "", dica = false, lado = "auto" }) {
  const caixa = useRef(null);
  /* A posição é medida na abertura (o painel só existe aberto) e de novo se a âncora, a largura ou o lado mudarem: é função desses três,
     então acerta na renderização, sem efeito. */
  const [medida, setMedida] = useState(() => ({ ancora, largura, lado, pos: posicaoDoPainel(ancora, largura, lado) }));
  let pos = medida.pos;
  if (medida.ancora !== ancora || medida.largura !== largura || medida.lado !== lado) {
    pos = posicaoDoPainel(ancora, largura, lado);
    setMedida({ ancora, largura, lado, pos });
  }
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
  /* O invólucro `e-g2` leva o escopo do CSS dos Efeitos para o portal, que mora fora das superfícies deles (é filho direto da Ficha). */
  return createPortal(
    <div className="e-g2 e-portal">
      <div ref={caixa} role={dica ? "tooltip" : "dialog"} aria-label={rotulo} className={`m-flutuante ${classe}`} data-dica={dica ? "sim" : undefined}
        style={{ position: "fixed", ...pos }}>
        {children}
      </div>
    </div>,
    raiz,
  );
}

/* ---------------- números ---------------- */
function useFontesPorGesto(temFontes) {
  const [aberto, setAberto] = useState(null);
  const tempo = useRef(null);
  const longo = useRef(false);
  const eventos = {
    onPointerDown: (e) => {
      if (e.pointerType !== "touch" || !temFontes) return;
      const el = e.currentTarget;
      longo.current = false;
      clearTimeout(tempo.current);
      tempo.current = setTimeout(() => { longo.current = true; setAberto({ ancora: el, dica: false }); }, 450);
    },
    onPointerUp: () => clearTimeout(tempo.current),
    onPointerEnter: (e) => {
      if (e.pointerType !== "mouse" || !temFontes) return;
      const el = e.currentTarget;
      clearTimeout(tempo.current);
      tempo.current = setTimeout(() => setAberto({ ancora: el, dica: true }), 550);
    },
    onPointerLeave: () => {
      clearTimeout(tempo.current);
      setAberto((a) => (a?.dica ? null : a));
    },
    onContextMenu: (e) => { if (temFontes) e.preventDefault(); },
  };
  /* O clique que vem junto do toque longo já abriu as fontes e não age: devolve se foi esse, e zera. */
  const toqueLongoConsumido = () => { const foi = longo.current; longo.current = false; return foi; };
  return { aberto, setAberto, toqueLongoConsumido, eventos };
}

/** Número que só INFORMA: texto; o clique (ou o hover) abre as fontes. */
export function Valor({ valor, partes, total, titulo, classe = "" }) {
  const botao = useRef(null);
  const temFontes = Array.isArray(partes) && partes.length > 0;
  const { aberto, setAberto, toqueLongoConsumido, eventos } = useFontesPorGesto(temFontes);
  if (!temFontes) return <span className={`m-valor ${classe}`}>{valor}</span>;
  return (
    <span className={`m-valor ${classe}`}>
      <button ref={botao} type="button" className="m-valor-botao" {...eventos} aria-haspopup="dialog"
        onClick={(e) => { if (toqueLongoConsumido()) return; const alvo = e.currentTarget; setAberto((a) => (a && !a.dica ? null : { ancora: alvo, dica: false })); }}
        aria-label={`${titulo}: ${valor}. Ver fontes`}>{valor}</button>
      {aberto && (
        <Flutuante ancora={aberto.ancora} onFechar={() => setAberto(null)} largura={290} rotulo={`Fontes de ${titulo}`} dica={aberto.dica}>
          <ListaDeFontes partes={partes} total={total ?? valor} titulo={titulo} />
        </Flutuante>
      )}
    </span>
  );
}

/* ---------------- texto ---------------- */
const paragrafos = (texto) => String(texto ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
/* O texto de uma regra, em TODA consulta. Com marcação, pelo MESMO renderizador
   do criador e da Ficha (`TextoRico`), em nós React, nunca HTML. Sem ela, os
   parágrafos de sempre. */
export function TextoRegra({ texto, rico, classe = "" }) {
  if (!String(texto ?? "").trim()) return null;
  if (rico || temMarcacao(texto)) return <div className={`afty-texto m-texto ${classe}`} data-texto-rico><TextoRico texto={texto} /></div>;
  return <div className={`afty-texto m-texto ${classe}`}>{paragrafos(texto).map((p, i) => <p key={i}>{p}</p>)}</div>;
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

/* ⚠ A CASCA SOBREPÕE A BARRA, e não fica ao lado (regra da Ficha desde 2026-08-26, ver `ui/vital.jsx`): ao lado ela dividia os 100% do trilho com o recurso,
   e com o recurso cheio sobrava 0% e a faixa não aparecia. A cor da casca segue o recurso: a de PE é a `--afty-petemp`, as outras a `--afty-pvtemp`. */
function Barra({ r, classe = "" }) {
  const teto = Math.max(1, r.max);
  const pctVida = Math.min(100, (Math.max(0, r.atual) / teto) * 100);
  const pctTemp = Math.min(100, (Math.max(0, r.temp) / teto) * 100);
  return (
    <span className={`afty-vital-trilho m-barra ${classe}`} data-recurso={r.tipo} aria-hidden="true">
      <span className="afty-vital-barra m-barra-cheia" style={{ width: `${pctVida}%` }} />
      {pctTemp > 0 && (
        <span className="afty-vital-barra afty-vital-casca m-barra-temp"
          style={{ width: `${pctTemp}%`, "--afty-vital-cor": r.tipo === "pe" ? "var(--afty-petemp)" : "var(--afty-pvtemp)" }} />
      )}
    </span>
  );
}

/** Um recurso: rótulo, número, máximo, temporário e a barra. Abre o painel. */
export function Medidor({ r, m, onAbrir, classe = "" }) {
  const fl = m.flash?.[r.tipo];
  /* As duas faixas da Ficha, como na 2.5.2: âmbar abaixo da metade e vermelho abaixo de um quarto, e o pulso é só do vermelho. */
  const pctAtual = r.max > 0 ? (r.atual / r.max) * 100 : 100;
  const nivel = pctAtual <= 25 ? "critico" : pctAtual <= 50 ? "baixo" : "normal";
  return (
    <button type="button" className={`afty-vital m-medidor ${classe}`} data-afty-vital={r.tipo} data-afty-nivel={nivel} data-recurso={r.tipo} data-alerta={nivel === "critico" ? "critico" : undefined} onClick={onAbrir}
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
  const motivo = tipo === "pe" && item && item.tipo !== "teste" ? item.nome : null;
  const [valor, setValor] = useState("");
  const [comMotivo, setComMotivo] = useState(!!motivo);
  const [erro, setErro] = useState(null);
  const n = Math.max(0, Math.trunc(Number(valor) || 0));
  /* Cada recurso tem o verbo dele. Energia e Preparo se GASTAM e se recuperam; Vida e Alma levam dano e cura. */
  const gasta = tipo === "pe" || tipo === "preparo";
  const max = { pv: derived.hp, pe: derived.pe, alma: derived.almaMax, preparo: derived.pontosPreparo }[tipo];
  const atual = { pv: sessao.hpAtual, pe: sessao.peAtual, alma: sessao.almaAtual, preparo: Sessao.preparoDe(sessao, derived.pontosPreparo) }[tipo];
  const fontes = tipo === "pv" ? sessao.pvTempFontes : tipo === "pe" ? sessao.peTempFontes : null;
  const partes = derived.partes?.[{ pv: "hp", pe: "pe", alma: "almaMax", preparo: "pontosPreparo" }[tipo]] ?? null;
  const rotulo = { pv: "Vida", pe: derived.recursoLabel || "Energia", alma: "Alma", preparo: "Preparo" }[tipo];
  const faz = (fn) => { const r = fn(); if (r?.erro) setErro(r.erro); else { setErro(null); setValor(""); } };
  const principal = () => (tipo === "pe" ? acoes.gastar(n, comMotivo ? motivo : null) : tipo === "preparo" ? acoes.gastarPreparo(n) : acoes.dano(n, tipo === "alma"));
  const recupera = () => (tipo === "preparo" ? acoes.recuperarPreparo(n) : acoes.recuperarPe(n));
  return (
    <div className="m-painel-vital">
      <div className="m-pv-titulo"><b>{rotulo}</b><span className="m-pv-numero">{atual}<small>/{max}</small></span></div>
      <div className="m-pv-linha">
        <input className="afty-campo m-campo-num" inputMode="numeric" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ""))}
          aria-label={`Valor para ${rotulo}`} placeholder="0" onKeyDown={(e) => { if (e.key === "Enter" && n) faz(principal); }} />
        {gasta ? (
          <>
            <button type="button" className="afty-botao m-botao" disabled={!n} onClick={() => faz(principal)}>Gastar</button>
            <button type="button" className="afty-botao m-botao" disabled={!n} onClick={() => faz(recupera)}>Recuperar</button>
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
          {Object.entries(fontes).map(([nome, v]) => <div key={nome} className="m-pv-fonte"><span>{nome}</span><b>{v}</b></div>)}
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

/* ---------------- avisos ---------------- */
/** O aviso de uma operação que recusou (falta de Energia, por exemplo). Só texto: as rolagens têm o painel de rolagens da Ficha. */
export function AvisoFlutuante({ m, classe = "" }) {
  const a = m.aviso;
  if (!a) return null;
  return (
    <div className="e-g2 e-portal">
      <div className={`m-aviso-flutuante ${classe}`} role="status"><span>{a.texto}</span></div>
    </div>
  );
}

export { Check };
