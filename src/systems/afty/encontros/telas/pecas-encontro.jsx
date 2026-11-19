import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, EyeOff, X } from "lucide-react";

import { VISAO_ORDEM, VISAO_ROTULO } from "../modelo";
import { LADO_PECA, VISAO_ICONE } from "./pecas-dados";
import { useCamadaDeVoltar } from "../../../../celular/camadas";

/**
 * ============================================================
 * AS PEÇAS DAS TELAS DO ENCONTRO (etapa 6a, 2026-11-17)
 * ============================================================
 * O que a lista, o planejamento e a luta compartilham. Cor só por token
 * `--afty-*` (pintado no `encontro-g2.css`), ícone do lucide, texto em Title Case.
 *
 * ⚠ O LADO NÃO É COR. Na fila de hoje o lado era o vermelho do PV, o azul do PE e
 * o verde da cura, ao lado das barras de Vida e PE de verdade (D-32, D-33). Aqui
 * o lado é ícone e palavra.
 * ============================================================
 */

/* ---------- retrato ---------- */

/* Só letras e números entram: "Kenji (Sem Ficha)" vira "KS", e não "K(". */
const iniciais = (nome) => String(nome ?? "?").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean).slice(0, 2)
  .map((p) => p[0] ?? "").join("").toUpperCase() || "?";

/** O retrato da ficha, ou as iniciais do nome. Nunca uma caveira: abatido é estado, não rosto. */
export function Retrato({ url, foco, nome, tamanho = "md" }) {
  const [falhou, setFalhou] = useState(false);
  if (!url || falhou) {
    return <span className="ec-retrato" data-tamanho={tamanho} aria-hidden="true">{iniciais(nome)}</span>;
  }
  return (
    <img
      src={url}
      alt=""
      className="ec-retrato"
      data-tamanho={tamanho}
      style={{ objectPosition: `${foco?.x ?? 50}% ${foco?.y ?? 50}%` }}
      onError={() => setFalhou(true)}
    />
  );
}

/* ---------- lado ---------- */

export function RotuloLado({ lado, curto = false }) {
  const p = LADO_PECA[lado] ?? LADO_PECA.inimigo;
  const Icone = p.icone;
  return (
    <span className="ec-lado" data-lado={lado}>
      <Icone aria-hidden="true" />
      {!curto && p.rotulo}
      {curto && <span className="ec-sr">{p.rotulo}</span>}
    </span>
  );
}

/* ---------- a barra curta de um recurso ---------- */

/**
 * A barra da fila e dos cartões: trilho, casca temporária por cima e o número. A cor é a do recurso, e o vermelho
 * forte (o único que pulsa, D-34) é só da Vida abaixo de um quarto, como no `Vital`.
 */
export function BarraCurta({ tipo, atual, max, temp = 0, rotulo, semNumero = false }) {
  const teto = Math.max(1, max);
  const pct = Math.min(100, (Math.max(0, atual) / teto) * 100);
  const pctTemp = Math.min(100, (Math.max(0, temp) / teto) * 100);
  const nivel = max > 0 && tipo === "pv" ? ((atual / max) * 100 <= 25 ? "critico" : (atual / max) * 100 <= 50 ? "baixo" : "normal") : "normal";
  return (
    <span className="ec-barra" data-tipo={tipo} data-nivel={nivel}>
      <span className="ec-barra-rotulo">{rotulo}</span>
      <span className="ec-barra-trilho" aria-hidden="true">
        <span className="ec-barra-cheio" style={{ width: `${pct}%` }} />
        {pctTemp > 0 && <span className="ec-barra-casca" style={{ width: `${pctTemp}%` }} />}
      </span>
      {!semNumero && (
        <span className="ec-barra-num">
          {atual}<small>/{max}</small>{temp > 0 && <em>+{temp}</em>}
        </span>
      )}
    </span>
  );
}

/* ---------- aviso ---------- */

export function Aviso({ children, tom = "aviso", acao = null, onFechar = null, papel = "status" }) {
  return (
    <div className="ec-aviso" data-tom={tom} role={papel}>
      <AlertTriangle aria-hidden="true" />
      <span className="ec-aviso-texto">{children}</span>
      {acao}
      {onFechar && (
        <button type="button" className="afty-passo" onClick={onFechar} aria-label="Fechar o Aviso" title="Fechar o Aviso">
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ---------- campo numérico com sinal ---------- */

/**
 * Campo de número que aceita sinal e o campo vazio. O rascunho é texto enquanto o foco está nele (o "-" sozinho não
 * vira 0 antes do dígito seguinte), como o `CampoNumerico` da tela de antes.
 */
export function CampoNumero({ valor, onConfirmar, rotulo, comSinal = true, ...resto }) {
  const [rascunho, setRascunho] = useState(null);
  const confirma = (cru) => {
    setRascunho(null);
    const t = String(cru ?? "").trim();
    if (!t) return;
    const n = Math.trunc(Number(t));
    if (Number.isFinite(n) && n !== valor) onConfirmar(n);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      className="ec-campo ec-campo-num"
      value={rascunho ?? String(valor ?? "")}
      aria-label={rotulo}
      title={rotulo}
      onChange={(e) => setRascunho(e.target.value.replace(comSinal ? /[^\d+-]/g : /[^\d]/g, ""))}
      onBlur={(e) => confirma(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") { setRascunho(null); e.currentTarget.blur(); }
      }}
      {...resto}
    />
  );
}

/* ---------- o seletor de visão ---------- */

/**
 * O que os jogadores veem de uma criatura na Sala: Oculta, Só Nome, Barra de Vida ou Aberta. Grupo de quatro botões
 * com `aria-pressed` (o escolhido tem fundo e borda de destaque). `compacto` mostra só os ícones, com o nome no
 * `aria-label`.
 */
export function SeletorDeVisao({ visao, onEscolher, compacto = false, desabilitado = false, rotulo = "Visão dos Jogadores" }) {
  return (
    <span className="ec-visao" role="group" aria-label={rotulo} data-compacto={compacto ? "sim" : undefined}>
      {VISAO_ORDEM.map((v) => {
        const Icone = VISAO_ICONE[v];
        return (
          <button
            key={v}
            type="button"
            className="ec-visao-opcao"
            aria-pressed={visao === v}
            disabled={desabilitado}
            onClick={() => onEscolher(v)}
            aria-label={VISAO_ROTULO[v]}
            title={VISAO_ROTULO[v]}
          >
            <Icone aria-hidden="true" />
            {!compacto && <span>{VISAO_ROTULO[v]}</span>}
          </button>
        );
      })}
    </span>
  );
}

/** O ícone da visão de agora, para a fila (só leitura). */
export function MarcaDeVisao({ visao }) {
  if (!visao) return null;
  const Icone = VISAO_ICONE[visao] ?? EyeOff;
  return (
    <span className="ec-marca" data-visao={visao} title={`Visão: ${VISAO_ROTULO[visao]}`}>
      <Icone aria-hidden="true" /><span className="ec-sr">{`Visão: ${VISAO_ROTULO[visao]}`}</span>
    </span>
  );
}

/* ---------- diálogo ---------- */

/**
 * Painel por cima da tela (D-28): fecha no Esc e no clique fora, e põe o foco no primeiro controle marcado com
 * `data-foco-inicial`, senão no primeiro botão. Vai por portal para a raiz do Encontro (`.afty-ficha`), onde os tokens
 * valem.
 */
export function Dialogo({ titulo, onFechar, children, rodape = null, largura = "28rem", icone: Icone = null }) {
  const caixa = useRef(null);
  // O diálogo é uma camada da pilha: o Voltar do aparelho o fecha (o mesmo que Cancelar).
  useCamadaDeVoltar(true, onFechar);
  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", aoTeclar);
    const el = caixa.current;
    (el?.querySelector("[data-foco-inicial]") ?? el?.querySelector("button, input, select"))?.focus();
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);
  const destino = (typeof document !== "undefined" && document.querySelector(".ec-raiz")) || document.body;
  return createPortal(
    <div className="ec-veu" onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div ref={caixa} className="ec-dialogo afty-card" role="dialog" aria-modal="true" aria-label={titulo} style={{ maxWidth: largura }}>
        <div className="ec-dialogo-topo">
          {Icone && <Icone aria-hidden="true" />}
          <h2 className="ec-dialogo-titulo">{titulo}</h2>
          <button type="button" className="afty-passo" onClick={onFechar} aria-label="Fechar" title="Fechar"><X aria-hidden="true" /></button>
        </div>
        <div className="ec-dialogo-corpo">{children}</div>
        {rodape && <div className="ec-dialogo-rodape">{rodape}</div>}
      </div>
    </div>,
    destino,
  );
}

/** A confirmação de uma ação sem volta: diz o que some e o que fica (D-25). */
export function Confirmar({ titulo, children, rotulo, onConfirmar, onCancelar }) {
  return (
    <Dialogo
      titulo={titulo}
      onFechar={onCancelar}
      icone={AlertTriangle}
      rodape={(
        <>
          <button type="button" className="afty-botao" onClick={onCancelar} data-foco-inicial>Cancelar</button>
          <button type="button" className="afty-botao" data-afty-tom="perigo" onClick={onConfirmar}>{rotulo}</button>
        </>
      )}
    >
      {children}
    </Dialogo>
  );
}

/* ---------- vazio ---------- */

export function Vazio({ icone: Icone, titulo, children }) {
  return (
    <div className="ec-vazio">
      {Icone && <Icone aria-hidden="true" />}
      <p className="ec-vazio-titulo">{titulo}</p>
      {children && <div className="ec-vazio-acoes">{children}</div>}
    </div>
  );
}
