import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, Plus, X, Dices, Play, Pause, SkipForward, Clock, Users, UserPlus,
  Search, Swords, Trophy, Skull, EyeOff, Copy, Edit3, Moon, AlertTriangle,
} from "lucide-react";

import "../ficha/ficha.css";
import "./encontros.css";
import { deriveAfty } from "../afty-derive";
import { AFTY_PATAMARES } from "../afty-schema";
import PainelDeCombatente from "./PainelDeCombatente";
import useEncontroAfty from "./usar-encontro-afty";
import { ENCONTRO_STATUS, LADO, LADO_ROTULO, LOG_TIPOS } from "./afty-encontro";

/**
 * ============================================================
 * RASTREADOR DE ENCONTRO DO AFTY
 * ============================================================
 * Uma view que delega para três renderizadores, por status: Planejando, Ativo e
 * Finalizado. Mesma arquitetura do `EncounterTracker` da 2.5.2 e mesmo layout
 * (coluna de iniciativa à esquerda, painel do combatente à direita).
 *
 * ⚠ PINTADO POR VARIÁVEL CSS, importando o `ficha.css`. A 2.5.2 escreve cor em
 * classe do Tailwind, e aqui isso não serve: o painel do combatente reusa as
 * abas da Ficha Final, que são tematizáveis. Duas linguagens de cor na mesma
 * tela ficaria remendo. O Tailwind aqui resolve só LAYOUT.
 * ============================================================
 */

const LADO_TOM = { inimigo: "aviso", jogador: "destaque", aliado: "cura" };

const rotuloPatamar = (v) => AFTY_PATAMARES.find((p) => p.value === v)?.label ?? v ?? "?";

/* ============================================================ */
/* PEÇAS COMPARTILHADAS                                          */
/* ============================================================ */

function Secao({ titulo, icone: Icone, children, direita, className = "" }) {
  return (
    <section className={`afty-card p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="afty-card-titulo flex-1 flex items-center gap-1.5">
          {Icone && <Icone className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
          {titulo}
        </h3>
        {direita}
      </div>
      {children}
    </section>
  );
}

function Retrato({ url, foco, nome }) {
  const [falhou, setFalhou] = useState(false);
  if (!url || falhou) {
    return (
      <span className="afty-encontro-retrato flex items-center justify-center" aria-hidden="true">
        <Skull className="w-3.5 h-3.5" style={{ color: "var(--afty-texto-fraco)" }} />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      title={nome}
      className="afty-encontro-retrato object-cover"
      style={{ objectPosition: `${foco?.x ?? 50}% ${foco?.y ?? 50}%` }}
      onError={() => setFalhou(true)}
    />
  );
}

/* Seletor de criatura do grimório, com filtro de pasta e busca. */
function EscolherCriatura({ criaturas, pastas = [], onAdicionar, compacto = false, rotuloBotao = "Adicionar" }) {
  const [busca, setBusca] = useState("");
  const [pasta, setPasta] = useState("__todas__");

  const lista = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return criaturas.filter((c) => {
      if (pasta === "__sem__" && c.folderId != null) return false;
      if (pasta !== "__todas__" && pasta !== "__sem__" && c.folderId !== pasta) return false;
      if (q && !String(c.name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [criaturas, busca, pasta]);

  return (
    <>
      {pastas.length > 0 && (
        <select
          value={pasta}
          onChange={(e) => setPasta(e.target.value)}
          aria-label="Filtrar por pasta"
          className="afty-campo bg-transparent outline-none w-full mb-2"
          style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "4px 6px" }}
        >
          <option value="__todas__" style={{ background: "var(--afty-card)" }}>Todas as Pastas</option>
          <option value="__sem__" style={{ background: "var(--afty-card)" }}>Sem Pasta</option>
          {pastas.map((f) => (
            <option key={f.id} value={f.id} style={{ background: "var(--afty-card)" }}>{f.name}</option>
          ))}
        </select>
      )}
      <div className="afty-linha px-2 py-1.5 flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setBusca(""); }}
          placeholder="Buscar criatura"
          aria-label="Buscar criatura"
          className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
        />
      </div>
      {lista.length === 0 ? (
        <div className="afty-rotulo text-[11px] text-center py-4">
          {criaturas.length === 0 ? "Nenhuma criatura no grimório ainda." : "Nenhum resultado."}
        </div>
      ) : (
        <ul className={`space-y-1 overflow-y-auto pr-1 ${compacto ? "max-h-48" : "max-h-80"}`}>
          {lista.map((c) => (
            <li key={c.id} className="afty-linha px-2 py-1.5 flex items-center gap-2">
              <span className="afty-chip flex-shrink-0">{rotuloPatamar(c.core?.patamar)}</span>
              <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{c.name}</span>
              <span className="afty-rotulo text-[10px] tabular-nums flex-shrink-0">ND {c.core?.nd ?? "?"}</span>
              <button
                type="button"
                className="afty-botao flex-shrink-0"
                onClick={() => onAdicionar(c)}
                aria-label={`${rotuloBotao} ${c.name}`}
              >
                <Plus className="w-3 h-3" /> {rotuloBotao}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function AdicionarJogador({ onAdicionar, comIniciativa = false }) {
  const [nome, setNome] = useState("");
  const [mod, setMod] = useState("");
  const [inic, setInic] = useState("");

  const cria = () => {
    if (!nome.trim()) return;
    onAdicionar(nome.trim(), Math.trunc(Number(mod) || 0), comIniciativa && inic !== "" ? Math.trunc(Number(inic) || 0) : null);
    setNome(""); setMod(""); setInic("");
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="Nome do personagem"
        aria-label="Nome do personagem"
        className="afty-campo bg-transparent outline-none w-full"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "4px 6px" }}
      />
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="afty-rotulo text-[10px] block mb-0.5">Mod. Iniciativa</span>
          <input
            type="text" inputMode="numeric" value={mod}
            onChange={(e) => setMod(e.target.value.replace(/[^\d+-]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
            placeholder="0"
            className="afty-campo bg-transparent outline-none w-full text-center"
            style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "4px 6px" }}
          />
        </label>
        {comIniciativa && (
          <label className="flex-1">
            <span className="afty-rotulo text-[10px] block mb-0.5">Iniciativa</span>
            <input
              type="text" inputMode="numeric" value={inic}
              onChange={(e) => setInic(e.target.value.replace(/[^\d+-]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
              placeholder="0"
              className="afty-campo bg-transparent outline-none w-full text-center"
              style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "4px 6px" }}
            />
          </label>
        )}
        <button type="button" className="afty-botao" onClick={cria} disabled={!nome.trim()}>
          Adicionar
        </button>
      </div>
    </div>
  );
}

/**
 * Campo numérico que aceita SINAL.
 *
 * ⚠ Um input controlado pelo NÚMERO não deixa digitar negativo: o mestre digita
 * "-", o `Number("-")` dá NaN, o `|| 0` transforma em 0 e o campo repinta "0"
 * antes do dígito seguinte chegar. Resultado: era impossível registrar
 * modificador de iniciativa negativo, e "-2" virava "+2".
 *
 * A saída é guardar a STRING enquanto o campo está sendo digitado e só usar o
 * valor de fora quando ele não está. É o que o `AdicionarJogador` já fazia, e a
 * divergência entre os dois era a prova de qual estava certo.
 */
function CampoNumerico({ valor, onChange, onBlur, ...resto }) {
  const [rascunho, setRascunho] = useState(null);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={rascunho ?? String(valor)}
      onChange={(e) => {
        const cru = e.target.value.replace(/[^\d+-]/g, "");
        setRascunho(cru);
        onChange(Math.trunc(Number(cru) || 0));
      }}
      // Solto o rascunho ao sair: daí em diante quem manda é o valor de fora,
      // que pode ter sido normalizado (uma rolagem, por exemplo).
      onBlur={(e) => { setRascunho(null); onBlur?.(e); }}
      {...resto}
    />
  );
}

/* ============================================================ */
/* PLANEJANDO                                                    */
/* ============================================================ */

function LinhaDePlanejamento({ combatente, onRolar, onIniciativa, onMod, onLado, onRemover }) {
  const [editando, setEditando] = useState(false);
  return (
    <li className="afty-linha px-2.5 py-2" data-afty-lado={combatente.flags.lado}>
      <div className="flex items-center gap-2 mb-2">
        <span className="afty-chip" data-afty-tom={LADO_TOM[combatente.flags.lado]}>
          {LADO_ROTULO[combatente.flags.lado]}
        </span>
        <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{combatente.nome}</span>
        <button type="button" className="afty-passo" onClick={onRemover} aria-label={`Remover ${combatente.nome}`}>
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-end gap-2 flex-wrap">
        <label>
          <span className="afty-rotulo text-[10px] block mb-0.5">Mod</span>
          <CampoNumerico
            valor={combatente.iniciativa.mod}
            onChange={onMod}
            aria-label="Modificador de iniciativa"
            className="afty-campo bg-transparent outline-none w-14 text-center"
            style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "3px 4px" }}
          />
        </label>
        <label>
          <span className="afty-rotulo text-[10px] block mb-0.5">Iniciativa</span>
          {editando ? (
            <CampoNumerico
              autoFocus
              valor={combatente.iniciativa.total}
              onChange={onIniciativa}
              onBlur={() => setEditando(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditando(false); }}
              aria-label="Iniciativa"
              className="afty-campo bg-transparent outline-none w-14 text-center"
              style={{ border: "1px solid var(--afty-destaque)", borderRadius: "var(--afty-raio-peq)", padding: "3px 4px" }}
            />
          ) : (
            /* Iniciativa DIGITADA fica marcada, e não é enfeite: ela é a única
               que o "Rolar Tudo" não sobrescreve. Sem a marca, o mestre não
               teria como saber por que aquele número não mudou. */
            <button
              type="button"
              className="afty-botao w-14 justify-center"
              data-afty-tom={combatente.iniciativa.manual ? "aviso" : undefined}
              onClick={() => setEditando(true)}
              aria-label="Editar iniciativa"
            >
              {combatente.iniciativa.total || "—"}
            </button>
          )}
        </label>
        <button type="button" className="afty-botao" onClick={onRolar}>
          <Dices className="w-3.5 h-3.5" /> Rolar
        </button>
        <select
          value={combatente.flags.lado}
          onChange={(e) => onLado(e.target.value)}
          aria-label="Lado do combatente"
          className="afty-campo bg-transparent outline-none"
          style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "4px 6px" }}
        >
          {Object.values(LADO).map((l) => (
            <option key={l} value={l} style={{ background: "var(--afty-card)" }}>{LADO_ROTULO[l]}</option>
          ))}
        </select>
      </div>
    </li>
  );
}

function Planejando({ encontro, derivado, acoes, criaturas, pastas, onVoltar }) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState(encontro.nome);

  const confirma = () => {
    if (nome.trim() && nome !== encontro.nome) acoes.renomear(nome.trim());
    setEditandoNome(false);
  };

  return (
    <>
      <header className="afty-cabecalho">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button type="button" className="afty-botao" onClick={onVoltar}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex-1 min-w-0">
            {editandoNome ? (
              <input
                type="text" autoFocus value={nome}
                onChange={(e) => setNome(e.target.value)}
                onBlur={confirma}
                onKeyDown={(e) => { if (e.key === "Enter") confirma(); }}
                className="afty-campo bg-transparent outline-none w-full text-xl font-bold"
                style={{ borderBottom: "1px solid var(--afty-destaque)" }}
                aria-label="Nome do encontro"
              />
            ) : (
              <button
                type="button"
                className="text-xl font-bold inline-flex items-center gap-2 max-w-full"
                onClick={() => { setNome(encontro.nome); setEditandoNome(true); }}
                aria-label="Renomear encontro"
              >
                <span className="truncate">{encontro.nome}</span>
                <Edit3 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} />
              </button>
            )}
            <div className="afty-rotulo text-[11px]">
              Planejando · {derivado.total} combatente(s)
            </div>
          </div>
          <div className="afty-encontro-acoes">
            <button
              type="button" className="afty-botao"
              onClick={() => acoes.rolarTodas(true)}
              disabled={derivado.total === 0}
              title="Rola só quem ainda não tem iniciativa"
            >
              <Dices className="w-4 h-4" /> Rolar Vazios
            </button>
            <button
              type="button" className="afty-botao"
              onClick={() => acoes.rolarTodas(false)}
              disabled={derivado.total === 0}
            >
              <Dices className="w-4 h-4" /> Rolar Tudo
            </button>
            <button
              type="button" className="afty-botao" data-afty-tom="destaque"
              onClick={acoes.comecar}
              disabled={!derivado.validacao.valido}
              title={derivado.validacao.valido ? "Começar combate" : derivado.validacao.erros.join(" · ")}
            >
              <Play className="w-4 h-4" /> Começar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            <Secao titulo="Adicionar do Grimório" icone={Users}>
              <EscolherCriatura
                criaturas={criaturas}
                pastas={pastas}
                onAdicionar={(c) => acoes.adicionar(c)}
              />
            </Secao>
            <Secao titulo="Adicionar Jogador" icone={UserPlus}>
              <AdicionarJogador onAdicionar={acoes.adicionarJogador} />
            </Secao>
          </div>

          <div className="lg:col-span-2">
            <Secao
              titulo={`Combatentes (${derivado.total})`}
              icone={Swords}
              direita={!derivado.validacao.valido && derivado.total > 0 ? (
                <span className="afty-chip" data-afty-tom="aviso">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                  {derivado.validacao.erros[0]}
                </span>
              ) : null}
            >
              {derivado.total === 0 ? (
                <div className="afty-rotulo text-[12px] text-center py-10">
                  Adicione combatentes pelo painel ao lado.
                </div>
              ) : (
                <ul className="space-y-2">
                  {derivado.ordem.map((c) => (
                    <LinhaDePlanejamento
                      key={c.id}
                      combatente={c}
                      onRolar={() => acoes.rolarUma(c.id)}
                      onIniciativa={(v) => acoes.definirIniciativa(c.id, v)}
                      onMod={(v) => acoes.definirMod(c.id, v)}
                      onLado={(v) => acoes.definirLado(c.id, v)}
                      onRemover={() => acoes.remover(c.id)}
                    />
                  ))}
                </ul>
              )}
            </Secao>
          </div>
        </div>
      </main>
    </>
  );
}

/* ============================================================ */
/* ATIVO                                                         */
/* ============================================================ */

function ListaDeIniciativa({ encontro, derivado, focoId, onFocar, onRemover }) {
  return (
    <aside className="afty-card p-3 flex flex-col min-h-0 max-h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <h3 className="afty-card-titulo flex-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Rodada {encontro.rodada}
        </h3>
        <span className="afty-rotulo text-[10px] tabular-nums">
          {derivado.elegiveis.length} / {derivado.total}
        </span>
      </div>
      <ul className="space-y-1.5 overflow-y-auto min-h-0 flex-1 pr-1">
        {derivado.ordem.map((c) => {
          const naVez = c.id === encontro.ativoId;
          const d = derivado.derivados[c.id] ?? null;
          const hpMax = d?.hp ?? 0;
          const hpAtual = c.sessao?.hpAtual ?? 0;
          const pct = hpMax > 0 ? Math.max(0, Math.min(100, (hpAtual / hpMax) * 100)) : 0;
          return (
            <li key={c.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onFocar(c.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFocar(c.id); } }}
                className="afty-encontro-fila px-2 py-1.5 group"
                data-afty-lado={c.flags.lado}
                data-afty-vez={naVez ? "sim" : undefined}
                data-afty-foco={c.id === focoId ? "sim" : undefined}
                data-afty-fora={c.flags.abatido ? "abatido" : c.flags.oculto ? "oculto" : undefined}
              >
                <div className="flex items-center gap-2 pr-4">
                  <span className="afty-valor text-[13px] w-7 flex-shrink-0 text-center">
                    {c.iniciativa.total}
                  </span>
                  <Retrato url={c.ficha?.portraitUrl} foco={c.ficha?.portraitFocus} nome={c.nome} />
                  <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{c.nome}</span>
                  {c.flags.abatido && <Skull className="w-3.5 h-3.5 flex-shrink-0" aria-label="Abatido" />}
                  {c.flags.oculto && <EyeOff className="w-3.5 h-3.5 flex-shrink-0" aria-label="Oculto" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="afty-chip" data-afty-tom={LADO_TOM[c.flags.lado]}>
                    {LADO_ROTULO[c.flags.lado]}
                  </span>
                  {c.sessao && hpMax > 0 && (
                    <>
                      <span className="afty-encontro-trilho flex-1">
                        <span
                          className="afty-encontro-barra"
                          data-afty-nivel={pct <= 25 ? "critico" : pct <= 50 ? "baixo" : "normal"}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="afty-rotulo text-[10px] tabular-nums flex-shrink-0">
                        {hpAtual}/{hpMax}
                      </span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="afty-passo absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onRemover(c); }}
                  aria-label={`Remover ${c.nome}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function ConfirmarRemocao({ combatente, onConfirmar, onCancelar }) {
  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === "Escape") onCancelar(); };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  if (!combatente) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "var(--afty-veu, rgb(0 0 0 / 0.55))" }}
      onClick={onCancelar}
      role="dialog"
      aria-modal="true"
      aria-label="Remover combatente"
    >
      <div className="afty-ficha afty-card p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="afty-card-titulo mb-2">Remover Combatente?</h3>
        <p className="afty-texto mb-4">
          <strong>{combatente.nome}</strong> sai do encontro, e o estado de combate dele vai junto.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" className="afty-botao" onClick={onCancelar}>Cancelar</button>
          <button type="button" className="afty-botao" data-afty-tom="aviso" autoFocus onClick={onConfirmar}>
            Remover
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Ativo({ encontro, derivado, acoes, criaturas, pastas, onVoltar }) {
  const [focoId, setFocoId] = useState(null);
  const [filaAberta, setFilaAberta] = useState(false);
  const [reforcos, setReforcos] = useState(false);
  const [aRemover, setARemover] = useState(null);

  // Sem foco escolhido, o painel segue o turno. Escolher um trava até o próximo
  // "Próximo Turno", que é quando o mestre volta a querer ver quem joga.
  const focoEfetivo = focoId ?? encontro.ativoId;
  const focado = encontro.combatentes.find((c) => c.id === focoEfetivo) ?? derivado.ativo;

  const avancar = useCallback(() => {
    acoes.proximoTurno();
    setFocoId(null);
  }, [acoes]);

  /* Reforço entra com a iniciativa que o mestre disser. O padrão oferecido é o
     modificador da criatura, e não um d20 sorteado: quem chega no meio da luta
     costuma entrar num lugar combinado da ordem. */
  const adicionarReforco = (c) => {
    let padrao = 0;
    try { padrao = deriveAfty(c)?.iniciativa ?? 0; } catch { padrao = 0; }
    const texto = window.prompt(`Iniciativa de ${c.name}:`, String(padrao));
    if (texto === null) return;
    acoes.adicionar(c, { iniciativa: Math.trunc(Number(texto) || 0) });
    setReforcos(false);
  };

  return (
    <>
      <header className="afty-cabecalho">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button type="button" className="afty-botao flex-shrink-0" onClick={onVoltar}>
              <ArrowLeft className="w-4 h-4" /> Sair
            </button>
            <div className="min-w-0">
              <div className="text-lg font-bold truncate">{encontro.nome}</div>
              <div className="afty-rotulo text-[11px]">
                Rodada {encontro.rodada} · {derivado.elegiveis.length} em combate
              </div>
            </div>
          </div>
          <div className="afty-encontro-acoes grid grid-cols-2 sm:flex">
            <button
              type="button" className="afty-botao lg:hidden"
              onClick={() => setFilaAberta((v) => !v)}
              aria-pressed={filaAberta}
            >
              <Users className="w-4 h-4" /> Iniciativa
            </button>
            <button
              type="button" className="afty-botao"
              data-afty-tom={reforcos ? "destaque" : undefined}
              onClick={() => setReforcos((v) => !v)}
              aria-pressed={reforcos}
            >
              <UserPlus className="w-4 h-4" /> Reforços
            </button>
            <button
              type="button" className="afty-botao"
              onClick={acoes.novaRodada}
              title="Força a virada da rodada sem passar por todos os turnos"
            >
              <Clock className="w-4 h-4" /> Nova Rodada
            </button>
            <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={avancar}>
              <SkipForward className="w-4 h-4" /> Próximo Turno
            </button>
            <button type="button" className="afty-botao" data-afty-tom="aviso" onClick={acoes.encerrar}>
              <Pause className="w-4 h-4" /> Encerrar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
              <ListaDeIniciativa
                encontro={encontro} derivado={derivado}
                focoId={focoEfetivo} onFocar={setFocoId} onRemover={setARemover}
              />
            </div>
          </div>
          {filaAberta && (
            <div className="lg:hidden">
              <ListaDeIniciativa
                encontro={encontro} derivado={derivado}
                focoId={focoEfetivo}
                onFocar={(id) => { setFocoId(id); setFilaAberta(false); }}
                onRemover={setARemover}
              />
            </div>
          )}

          <div className="lg:col-span-3 space-y-3">
            {reforcos && (
              <Secao titulo="Reforços" icone={UserPlus}>
                <EscolherCriatura
                  criaturas={criaturas} pastas={pastas} compacto
                  rotuloBotao="Add"
                  onAdicionar={adicionarReforco}
                />
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--afty-borda)" }}>
                  <AdicionarJogador
                    comIniciativa
                    onAdicionar={(nome, mod, inic) => {
                      acoes.adicionarJogador(nome, mod, inic);
                      setReforcos(false);
                    }}
                  />
                </div>
              </Secao>
            )}

            {focado ? (
              <PainelDeCombatente
                key={focado.id}
                combatente={focado}
                derived={derivado.derivados[focado.id] ?? null}
                sessao={focado.sessao}
                ativo={focado.id === encontro.ativoId}
                onSessao={(fn) => acoes.patchSessao(focado.id, fn)}
                onFlag={(chave, valor) => acoes.definirFlag(focado.id, chave, valor)}
              />
            ) : (
              <section className="afty-card p-10 text-center">
                <div className="afty-rotulo text-[12px]">Selecione um combatente na lista.</div>
              </section>
            )}
          </div>
        </div>
      </main>

      <ConfirmarRemocao
        combatente={aRemover}
        onConfirmar={() => { acoes.remover(aRemover.id); setARemover(null); }}
        onCancelar={() => setARemover(null)}
      />
    </>
  );
}

/* ============================================================ */
/* FINALIZADO                                                    */
/* ============================================================ */

function Finalizado({ encontro, derivado, acoes, onVoltar, onDuplicar }) {
  return (
    <>
      <header className="afty-cabecalho">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button type="button" className="afty-botao" onClick={onVoltar}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold truncate">{encontro.nome}</div>
            <div className="afty-rotulo text-[11px]">Encontro encerrado</div>
          </div>
          <button type="button" className="afty-botao" onClick={onDuplicar}>
            <Copy className="w-4 h-4" /> Duplicar
          </button>
          {/* Descansar e Levantar existem para rodar o MESMO encontro de novo,
              sem duplicar: é o caso de repetir uma luta que não funcionou. */}
          <button type="button" className="afty-botao" onClick={acoes.descansarTodos} title="Recursos cheios em todos">
            <Moon className="w-4 h-4" /> Descansar Todos
          </button>
          <button type="button" className="afty-botao" onClick={acoes.levantarTodos} title="Tira a marca de abatido de todos">
            <Skull className="w-4 h-4" /> Levantar Todos
          </button>
          <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={acoes.reabrir}>
            <Edit3 className="w-4 h-4" /> Reabrir
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-3">
        <Secao titulo="Resumo" icone={Trophy}>
          <div className="afty-rotulo text-[11px] mb-2">
            {encontro.rodada} rodada(s) · {derivado.total} combatente(s) · {derivado.abatidos} abatido(s)
          </div>
          <ul className="space-y-1">
            {derivado.ordem.map((c) => {
              const d = derivado.derivados[c.id] ?? null;
              return (
                <li
                  key={c.id}
                  className="afty-linha px-2.5 py-1.5 flex items-center gap-2"
                  data-afty-fora={c.flags.abatido ? "abatido" : undefined}
                >
                  <span className="afty-chip" data-afty-tom={LADO_TOM[c.flags.lado]}>
                    {LADO_ROTULO[c.flags.lado]}
                  </span>
                  <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{c.nome}</span>
                  {c.flags.abatido ? (
                    <span className="afty-chip" data-afty-tom="aviso">
                      <Skull className="w-3 h-3 flex-shrink-0" aria-hidden="true" /> Abatido
                    </span>
                  ) : c.sessao && d ? (
                    <span className="afty-rotulo text-[11px] tabular-nums">
                      PV {c.sessao.hpAtual}/{d.hp}
                    </span>
                  ) : (
                    <span className="afty-rotulo text-[11px]">—</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Secao>

        {encontro.log.length > 0 && (
          <Secao titulo={`Log (${encontro.log.length})`} icone={Clock}>
            <ul className="max-h-80 overflow-y-auto space-y-0.5">
              {encontro.log.map((e) => (
                <li key={e.id} className="py-1 text-[11px] flex items-baseline gap-2">
                  <span
                    className="afty-rotulo text-[10px] flex-shrink-0 tabular-nums"
                    style={e.tipo === LOG_TIPOS.CONDICAO ? { color: "var(--afty-aviso)" } : undefined}
                  >
                    R{e.rodada}
                  </span>
                  <span className="flex-1 min-w-0">{e.mensagem}</span>
                </li>
              ))}
            </ul>
          </Secao>
        )}
      </main>
    </>
  );
}

/* ============================================================ */
/* ROTEADOR POR STATUS                                           */
/* ============================================================ */

const POR_STATUS = {
  [ENCONTRO_STATUS.PLANEJANDO]: Planejando,
  [ENCONTRO_STATUS.ATIVO]: Ativo,
  [ENCONTRO_STATUS.FINALIZADO]: Finalizado,
};

export default function AftyEncontro({ encontroId, gerenciador, criaturas = [], pastas = [], onVoltar, onDuplicar }) {
  const { encontro, derivado, acoes } = useEncontroAfty(encontroId, gerenciador);

  if (!encontro) {
    return (
      <div className="afty-ficha min-h-screen flex items-center justify-center">
        <div className="afty-card p-6 text-center space-y-3">
          <div className="afty-rotulo text-[12px]">Encontro não encontrado.</div>
          <button type="button" className="afty-botao" onClick={onVoltar}>Voltar</button>
        </div>
      </div>
    );
  }

  const Tela = POR_STATUS[encontro.status] ?? Planejando;
  return (
    <div className="afty-ficha min-h-screen">
      <Tela
        encontro={encontro}
        derivado={derivado}
        acoes={acoes}
        criaturas={criaturas}
        pastas={pastas}
        onVoltar={onVoltar}
        onDuplicar={() => onDuplicar?.(encontro.id)}
      />
    </div>
  );
}
