import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, UserPlus, Settings, RotateCw, SkipForward, Flag, PanelRightClose, PanelRightOpen, MoreHorizontal,
  Skull, CircleSlash, Trash2, ScrollText, Inbox, History, Undo2, Check, X, Swords, Heart, Activity, Clock, Users,
  ListOrdered, FileText, RefreshCw,
} from "lucide-react";

import { TIPO, MOTOR, ehLigado, estadoDoCombatente, fichaDoCombatente } from "../modelo";
import { mensagemDaOperacao, ROTULO_OPERACAO } from "../operacoes";
import { LOG_TIPOS } from "../afty-encontro";
import {
  Retrato, RotuloLado, BarraCurta, Aviso, CampoNumero, SeletorDeVisao, MarcaDeVisao, Dialogo, Confirmar, Vazio,
} from "./pecas-encontro";
import { useFaixaDeLargura, contagem } from "./pecas-dados";
import PainelCriatura252 from "./PainelCriatura252";
import AdicionarCombatentes from "./AdicionarCombatentes";

/**
 * ============================================================
 * A LUTA DO MESTRE EM TRÊS COLUNAS (etapa 6a, 2026-11-17)
 * ============================================================
 *   esquerda  a ORDEM: iniciativa, Vida e PE de cada um e a seleção de vários (a
 *             barra de ações em grupo aparece embaixo). O campo de Dano e Cura por
 *             linha saiu (autor, 2026-11-17, "fica efetivamente bem feia"): o dano
 *             vai pela seleção com a barra de grupo, ou pela Vida da Ficha ("-12").
 *   meio      o ESCOLHIDO: a Ficha G2 inteira (modo embutido) para a ficha do
 *             Afty e do Player, o painel da 2.5.2 para a criatura do `/`.
 *   direita   o REGISTRO, recolhível: o que aconteceu, os pedidos e o Histórico
 *             com Desfazer.
 *
 * Sem escolha, o meio segue a VEZ. Clicar numa linha prende o meio nela até o
 * próximo Próximo Turno.
 *
 * ⚠ A LARGURA É A DA TELA DO ENCONTRO, medida por `ResizeObserver`
 * (`useFaixaDeLargura`), e não por `@container`: a coluna do meio carrega a Ficha
 * G2, cujo painel de fontes é `position: fixed` e sairia deslocado dentro de um
 * contêiner. Até 760 px a tela vira três painéis com uma faixa de troca (Ordem,
 * Ficha, Registro). De 760 a 1180, duas colunas e o Registro por cima.
 * ============================================================
 */

/* Carregada sob demanda, como no `AftyFicha.jsx`: o pedaço da G2 só baixa quando alguém abre uma ficha. */
const AftyFichaG2 = lazy(() => import("../../ficha/AftyFichaG2"));

const FAIXAS = [["estreita", 0], ["media", 760], ["larga", 1180]];

const TIPO_DO_COMBATENTE = (c) => (c.tipo === TIPO.PERSONAGEM ? "Personagem"
  : c.tipo === TIPO.MARCADOR ? "Sem Ficha"
    : c.motor === MOTOR.M252 ? "Criatura da 2.5.2" : "Criatura do Afty");

const ICONE_DO_REGISTRO = {
  [LOG_TIPOS.RODADA]: Clock, [LOG_TIPOS.TURNO]: SkipForward, [LOG_TIPOS.DANO]: Swords,
  [LOG_TIPOS.CURA]: Heart, [LOG_TIPOS.CONDICAO]: Activity,
};

const PAPEL_ROTULO = { mestre: "Mestre", jogador: "Jogador", sistema: "Aceite Automático", espectador: "Espectador" };
const MOTIVO_ROTULO = { mudou: "Mudou Depois", foraDoLimite: "Passa do Limite", semCalculo: "Sem Cálculo" };

const hora = (t) => (t ? new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

/* ============================================================ */
/* O TOPO                                                        */
/* ============================================================ */

function MenuMais({ itens }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);
  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => { if (!raiz.current?.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);
  return (
    <span className="ec-menu" ref={raiz}>
      <button type="button" className="afty-botao ec-icone" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)} aria-label="Mais Ações" title="Mais Ações">
        <MoreHorizontal aria-hidden="true" />
      </button>
      {aberto && (
        <span className="ec-menu-lista" role="menu">
          {itens.filter(Boolean).map((it) => {
            const Icone = it.icone;
            return (
              <button key={it.rotulo} type="button" role="menuitem" className="ec-menu-item" data-separado={it.separado ? "sim" : undefined} onClick={() => { setAberto(false); it.onClick(); }}>
                <Icone aria-hidden="true" />{it.rotulo}
              </button>
            );
          })}
        </span>
      )}
    </span>
  );
}

function TopoDaLuta({ encontro, ativo, faixa, onVoltar, acoes, onReforcos, onConfig, onEncerrar, registroAberto, onRegistro, acoesSala = null }) {
  const estreita = faixa === "estreita";
  return (
    <header className="ec-topo">
      <button type="button" className="afty-botao ec-icone" onClick={onVoltar} aria-label="Voltar aos Encontros" title="Voltar aos Encontros">
        <ArrowLeft aria-hidden="true" />
      </button>
      <div className="ec-topo-titulo">
        <h1 className="ec-titulo" title={encontro.nome}>{encontro.nome}</h1>
        <p className="ec-subtitulo">
          <span>Rodada <b className="afty-valor">{encontro.rodada}</b></span>
          {ativo ? <span className="ec-vez-de">Vez de <b title={ativo.nome}>{ativo.nome}</b></span> : <span>Ninguém na Vez</span>}
        </p>
      </div>
      <div className="ec-topo-acoes">
        {acoesSala}
        {!estreita && <button type="button" className="afty-botao" onClick={onReforcos}><UserPlus aria-hidden="true" />Reforços</button>}
        {!estreita && <button type="button" className="afty-botao" onClick={acoes.novaRodada} title="Encerra os turnos que faltam e vira a rodada"><RotateCw aria-hidden="true" />Nova Rodada</button>}
        <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={acoes.proximoTurno}>
          <SkipForward aria-hidden="true" />{estreita ? "Próximo" : "Próximo Turno"}
        </button>
        {!estreita && <button type="button" className="afty-botao ec-icone" onClick={onConfig} aria-label="Configurações do Encontro" title="Configurações do Encontro"><Settings aria-hidden="true" /></button>}
        {faixa === "media" && (
          <button type="button" className="afty-botao ec-icone" aria-pressed={registroAberto} onClick={onRegistro} aria-label="Registro" title="Registro">
            {registroAberto ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
          </button>
        )}
        {!estreita && <span className="ec-topo-sep" aria-hidden="true" />}
        {!estreita && <button type="button" className="afty-botao" data-afty-tom="perigo" onClick={onEncerrar}><Flag aria-hidden="true" />Encerrar</button>}
        {estreita && (
          <MenuMais itens={[
            { rotulo: "Reforços", icone: UserPlus, onClick: onReforcos },
            { rotulo: "Nova Rodada", icone: RotateCw, onClick: acoes.novaRodada },
            { rotulo: "Configurações", icone: Settings, onClick: onConfig },
            { rotulo: "Encerrar Encontro", icone: Flag, onClick: onEncerrar, separado: true },
          ]} />
        )}
      </div>
    </header>
  );
}

/* ============================================================ */
/* A ORDEM                                                       */
/* ============================================================ */

function LinhaDaOrdem({ c, resumo, erro, vez, foco, selecionado, onFocar, onSelecionar }) {
  // Sem cálculo, o resumo degrada (máximos 0) e a barra mentiria: a linha mostra o aviso no lugar dela.
  const temNumero = !!resumo && c.tipo !== TIPO.MARCADOR && !erro;
  const fora = c.flags.abatido ? "abatido" : c.flags.foraDaOrdem ? "ordem" : undefined;
  const ficha = c.motor === MOTOR.M252 ? c.snapshot : c.ficha;
  return (
    <li className="ec-fila" data-vez={vez ? "sim" : undefined} data-foco={foco ? "sim" : undefined} data-selecionado={selecionado ? "sim" : undefined} data-fora={fora}>
      <label className="ec-caixa" title={selecionado ? "Tirar da Seleção" : "Selecionar"}>
        <input type="checkbox" checked={selecionado} onChange={(e) => onSelecionar(c.id, e.nativeEvent.shiftKey)} aria-label={`Selecionar ${c.nome}`} />
      </label>
      <button type="button" className="ec-fila-corpo" onClick={() => onFocar(c.id)} aria-current={foco ? "true" : undefined}>
        <span className="ec-ini afty-valor" title="Iniciativa">{c.iniciativa.total}</span>
        <Retrato url={ficha?.portraitUrl} foco={ficha?.portraitFocus} nome={c.nome} tamanho="sm" />
        <span className="ec-fila-texto">
          <span className="ec-fila-nome" title={c.nome}>{c.nome}</span>
          <span className="ec-fila-meta">
            <RotuloLado lado={c.flags.lado} />
            {c.flags.abatido && <span className="ec-estado"><Skull aria-hidden="true" />Abatido</span>}
            {!c.flags.abatido && c.flags.foraDaOrdem && <span className="ec-estado"><CircleSlash aria-hidden="true" />Fora da Ordem</span>}
            <MarcaDeVisao visao={c.visao} />
          </span>
        </span>
        {vez && <span className="afty-chip" data-afty-tom="destaque">Vez</span>}
      </button>
      {temNumero ? (
        <div className="ec-fila-barras">
          <BarraCurta tipo="pv" rotulo="PV" atual={resumo.pv} max={resumo.pvMax} temp={resumo.pvTemp} />
          {resumo.peMax > 0 && <BarraCurta tipo="pe" rotulo="PE" atual={resumo.pe} max={resumo.peMax} temp={resumo.peTemp} />}
        </div>
      ) : erro ? (
        <div className="ec-fila-erro"><Aviso>{erro}</Aviso></div>
      ) : null}
    </li>
  );
}

function ColunaOrdem({ encontro, derivado, focoId, selecionados, onFocar, onSelecionar, onSelecionarTodos }) {
  const todos = derivado.ordem.filter((c) => c.tipo !== TIPO.MARCADOR);
  const todosMarcados = todos.length > 0 && todos.every((c) => selecionados.has(c.id));
  return (
    <section className="ec-coluna ec-ordem" aria-label="Ordem de Iniciativa">
      <div className="ec-coluna-topo">
        <h2 className="afty-card-titulo" data-afty-linha><ListOrdered aria-hidden="true" />Ordem</h2>
        <span className="ec-contagem">{derivado.elegiveis.length} de {contagem(derivado.total, "Combatente", "Combatentes")}</span>
        <label className="ec-caixa ec-caixa-todos" title="Selecionar Todos com Ficha">
          <input type="checkbox" checked={todosMarcados} onChange={() => onSelecionarTodos(!todosMarcados)} aria-label="Selecionar Todos com Ficha" disabled={!todos.length} />
        </label>
      </div>
      {derivado.ordem.length === 0 ? (
        <Vazio icone={Users} titulo="Nenhum Combatente" />
      ) : (
        <ol className="ec-fila-lista">
          {derivado.ordem.map((c) => (
            <LinhaDaOrdem
              key={c.id} c={c}
              resumo={derivado.resumos[c.id]} erro={derivado.erros[c.id]}
              vez={c.id === encontro.ativoId} foco={c.id === focoId} selecionado={selecionados.has(c.id)}
              onFocar={onFocar} onSelecionar={onSelecionar}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

/* ============================================================ */
/* A BARRA DE AÇÕES EM GRUPO                                     */
/* ============================================================ */

const VERBOS_DE_GRUPO = [
  ["dano", "Dano", "dano"], ["danoMetade", "Dano pela Metade", "dano"], ["cura", "Cura", "cura"],
  ["gastarPe", "Gastar PE"], ["recuperarPe", "Recuperar PE"],
];

function BarraDeGrupo({ ids, nomes, acoes, onLimpar }) {
  const [valor, setValor] = useState("");
  const [resultado, setResultado] = useState(null);
  const [descansar, setDescansar] = useState(false);
  const n = Math.max(0, Math.trunc(Number(valor) || 0));
  const roda = (acao) => {
    const r = acoes.emGrupo(acao, n, ids);
    const ok = (r?.resultados ?? []).filter((x) => x.ok).length;
    const falhas = (r?.resultados ?? []).filter((x) => !x.ok);
    const frase = `${ROTULO_OPERACAO[acao]} em ${contagem(ok, "Combatente", "Combatentes")}.`
      + (falhas.length ? ` ${contagem(falhas.length, "Ficou", "Ficaram")} de Fora (${[...new Set(falhas.map((f) => f.erro))].join(", ")})` : "");
    setResultado({ frase, falhou: falhas.length > 0 });
    if (acao !== "descansar") setValor("");
  };
  return (
    <div className="ec-grupo" role="region" aria-label="Ações em Grupo">
      <span className="ec-grupo-conta"><b>{ids.length}</b> {ids.length === 1 ? "Selecionado" : "Selecionados"}</span>
      <input
        type="text" inputMode="numeric" className="ec-campo ec-campo-num" value={valor} placeholder="0" data-largura="media"
        onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter" && n) roda("dano"); if (e.key === "Escape") setValor(""); }}
        aria-label="Valor da Ação em Grupo"
      />
      <span className="ec-grupo-verbos">
        {VERBOS_DE_GRUPO.map(([acao, rotulo, tom]) => (
          <button key={acao} type="button" className="afty-botao" data-afty-tom={tom} disabled={!n} onClick={() => roda(acao)}>{rotulo}</button>
        ))}
        <button type="button" className="afty-botao" onClick={() => setDescansar(true)}>Descansar</button>
      </span>
      <button type="button" className="afty-botao" onClick={onLimpar}><X aria-hidden="true" />Limpar</button>
      {resultado && <p className="ec-grupo-resultado" data-falhou={resultado.falhou ? "sim" : undefined} role="status">{resultado.frase}</p>}
      {descansar && (
        <Confirmar
          titulo={`Descansar ${contagem(ids.length, "Combatente", "Combatentes")}?`}
          rotulo="Descansar"
          onCancelar={() => setDescansar(false)}
          onConfirmar={() => { setDescansar(false); roda("descansar"); }}
        >
          <p className="ec-texto">Vida, PE e Alma voltam ao máximo em {nomes.join(", ")}. A criatura da 2.5.2 perde condições e modificadores.</p>
        </Confirmar>
      )}
    </div>
  );
}

/* ============================================================ */
/* O ESCOLHIDO                                                   */
/* ============================================================ */

function CabecaDoEscolhido({ c, vez, acoes, onRemover }) {
  const ficha = c.motor === MOTOR.M252 ? c.snapshot : c.ficha;
  return (
    <div className="ec-escolhido">
      <Retrato url={ficha?.portraitUrl} foco={ficha?.portraitFocus} nome={c.nome} tamanho="md" />
      <div className="ec-escolhido-texto">
        <h2 className="ec-escolhido-nome" title={c.nome}>{c.nome}</h2>
        <p className="ec-escolhido-meta">
          <RotuloLado lado={c.flags.lado} />
          <span>{TIPO_DO_COMBATENTE(c)}</span>
          {vez && <span className="afty-chip" data-afty-tom="destaque">Vez</span>}
        </p>
      </div>
      <div className="ec-escolhido-controles">
        <label className="ec-rotulado ec-rotulado-linha">
          <span>Iniciativa</span>
          <CampoNumero valor={c.iniciativa.total} rotulo={`Iniciativa de ${c.nome}`} onConfirmar={(v) => acoes.definirIniciativa(c.id, v)} />
        </label>
        <button type="button" className="ec-alternar" aria-pressed={c.flags.abatido} onClick={() => acoes.definirFlag(c.id, "abatido", !c.flags.abatido)}>
          <Skull aria-hidden="true" />Abatido
        </button>
        <button type="button" className="ec-alternar" aria-pressed={c.flags.foraDaOrdem} onClick={() => acoes.definirFlag(c.id, "foraDaOrdem", !c.flags.foraDaOrdem)}>
          <CircleSlash aria-hidden="true" />Fora da Ordem
        </button>
        {c.tipo !== TIPO.PERSONAGEM && <SeletorDeVisao visao={c.visao} compacto onEscolher={(v) => acoes.definirVisao(c.id, v)} />}
        <button type="button" className="afty-botao ec-icone ec-remover" onClick={onRemover} aria-label={`Tirar ${c.nome} do Encontro`} title={`Tirar ${c.nome} do Encontro`}>
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* A coluna da Ficha mede a si mesma: abaixo de 1120 px a placa da G2 usa o leiaute que a Ficha sozinha usa abaixo de 1120 px de
   janela (os recursos descem para a segunda fileira). Sem isto, numa coluna de 760 px dentro de uma janela de 1440 px, o nome
   passava por cima da Vida. */
function FichaEmbutida({ children }) {
  const ref = useRef(null);
  const largura = useFaixaDeLargura(ref, [["estreita", 0], ["larga", 1120]]);
  return <div ref={ref} className="ec-g2" data-largura={largura}>{children}</div>;
}

function PainelDoEscolhido({ c, encontro, derivado, mundo, acoes, onRemover }) {
  if (!c) return <Vazio icone={FileText} titulo="Escolha um Combatente na Ordem" />;
  const estado = estadoDoCombatente(c, mundo.sessoes);
  const ficha = fichaDoCombatente(c, mundo.fichas);
  const erro = derivado.erros[c.id];
  let corpo;
  if (c.tipo === TIPO.MARCADOR) {
    corpo = <section className="afty-card ec-secao"><Vazio icone={Users} titulo="Combatente sem Ficha" /></section>;
  } else if (ehLigado(c) && !ficha) {
    corpo = <section className="afty-card ec-secao"><Aviso>A ficha de {c.nome} não está mais no grimório</Aviso></section>;
  } else if (c.motor === MOTOR.M252) {
    corpo = (
      <PainelCriatura252
        combatente={c} derivado={derivado.derivados[c.id]} estado={estado} resumo={derivado.resumos[c.id]}
        combatentes={encontro.combatentes} acoes={acoes}
      />
    );
  } else if (erro || !estado) {
    corpo = <section className="afty-card ec-secao"><Aviso>Ficha sem Cálculo: {erro ?? "sessão ausente"}</Aviso></section>;
  } else {
    corpo = (
      <FichaEmbutida>
        <Suspense fallback={null}>
        <AftyFichaG2
          key={c.id}
          creature={ficha}
          sessao={estado}
          onSessao={(passo) => acoes.sessao(c.id, passo)}
          onVoltar={() => {}}
          onEditar={() => {}}
        />
        </Suspense>
      </FichaEmbutida>
    );
  }
  return (
    <>
      <CabecaDoEscolhido c={c} vez={c.id === encontro.ativoId} acoes={acoes} onRemover={onRemover} />
      {derivado.desatualizados?.[c.id] && (
        <Aviso acao={(
          <button type="button" className="afty-botao" onClick={() => acoes.atualizarFicha(c.id)} title={`Trazer a ficha nova de ${c.nome} para a luta`}>
            <RefreshCw aria-hidden="true" />Atualizar da Ficha
          </button>
        )}>
          A ficha de {c.nome} mudou na biblioteca
        </Aviso>
      )}
      {corpo}
    </>
  );
}

/* ============================================================ */
/* O REGISTRO                                                    */
/* ============================================================ */

export function ListaDoRegistro({ log }) {
  if (!log.length) return <Vazio icone={ScrollText} titulo="Nada Registrado Ainda" />;
  const itens = [];
  let rodada = null;
  for (const e of log) {
    if (e.rodada !== rodada) {
      rodada = e.rodada;
      itens.push(<li key={`r${rodada}:${e.id}`} className="ec-reg-rodada">Rodada {rodada}</li>);
    }
    const Icone = ICONE_DO_REGISTRO[e.tipo] ?? ScrollText;
    itens.push(
      <li key={e.id} className="ec-reg" data-tipo={e.tipo} data-pedido={e.pedido}>
        <Icone aria-hidden="true" />
        <span className="ec-reg-texto">{e.mensagem}</span>
        <time className="ec-reg-hora">{hora(e.em)}</time>
      </li>,
    );
  }
  return <ol className="ec-reg-lista">{itens}</ol>;
}

function ListaDePedidos({ pedidos, encontro, acoes }) {
  if (!pedidos.length) return <Vazio icone={Inbox} titulo="Nenhum Pedido Pendente" />;
  return (
    <ul className="ec-pedidos">
      {pedidos.map((p) => {
        const alvo = encontro.combatentes.find((c) => c.id === p.alvo);
        const de = encontro.combatentes.find((c) => c.id === p.autor?.combatente);
        // O personagem de um jogador da Sala: o Mestre aceita no lugar dele (jogador ausente, ou a vez dele demora).
        const doJogador = alvo?.tipo === TIPO.PERSONAGEM && !!alvo?.dono?.conta;
        const v = p.entrada?.valor != null ? ` ${Math.max(0, Math.trunc(Number(p.entrada.valor) || 0))}` : "";
        return (
          <li key={p.id} className="ec-pedido">
            <p className="ec-pedido-texto"><b>{ROTULO_OPERACAO[p.tipo] ?? "Operação"}{v}</b> em {alvo?.nome ?? "Combatente"}</p>
            <p className="ec-pedido-meta">De {de?.nome ?? PAPEL_ROTULO[p.autor?.papel] ?? "Jogador"} · {hora(p.quando)}</p>
            <span className="ec-pedido-botoes">
              <button type="button" className="afty-botao" data-afty-tom="cura" onClick={() => acoes.aceitar(p.id)}><Check aria-hidden="true" />{doJogador ? "Aceitar pelo Jogador" : "Aceitar"}</button>
              <button type="button" className="afty-botao" onClick={() => acoes.recusar(p.id)}><X aria-hidden="true" />Recusar</button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ListaDoHistorico({ historico, acoes }) {
  const [falhas, setFalhas] = useState({});
  if (!historico.length) return <Vazio icone={History} titulo="Nenhuma Mudança de Outra Pessoa" />;
  return (
    <ul className="ec-hist">
      {historico.map((op) => {
        const falha = falhas[op.id];
        const desfazivel = !op.desfeita && op.tipo !== "desfazer";
        return (
          <li key={`${op.combatente.id}:${op.id}`} className="ec-hist-item" data-desfeita={op.desfeita ? "sim" : undefined}>
            <p className="ec-hist-texto">{mensagemDaOperacao(op, op.combatente)}</p>
            <p className="ec-hist-meta">{PAPEL_ROTULO[op.autor?.papel] ?? "Outra Pessoa"} · {hora(op.quando)}</p>
            {op.desfeita ? <span className="afty-chip">Desfeita</span> : desfazivel && (
              <button
                type="button" className="afty-botao ec-hist-desfazer"
                onClick={() => {
                  const r = acoes.desfazer(op.combatente.id, op.id);
                  setFalhas((f) => ({ ...f, [op.id]: r?.ok ? null : r }));
                }}
              >
                <Undo2 aria-hidden="true" />Desfazer
              </button>
            )}
            {falha && (
              <Aviso onFechar={() => setFalhas((f) => ({ ...f, [op.id]: null }))}>
                {falha.erro === "Não Fecha"
                  ? `Não Fecha: ${(falha.conflitos ?? []).map((x) => `${x.caminho?.join(".") || "Estado"} (${MOTIVO_ROTULO[x.motivo] ?? x.motivo})`).join(", ")}`
                  : falha.erro}
              </Aviso>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ColunaRegistro({ encontro, derivado, acoes, onRecolher, recolhivel, painelSala = null }) {
  const [aba, setAba] = useState("registro");
  const abas = [
    { id: "registro", rotulo: "Registro", icone: ScrollText, n: encontro.log.length },
    { id: "pedidos", rotulo: "Pedidos", icone: Inbox, n: derivado.pedidos.length },
    { id: "historico", rotulo: "Histórico", icone: History, n: derivado.historico.length },
    // A Sala online (etapa 7c): o Registro dela com o chat e a rolagem escondida. Quem monta é a página da Sala.
    ...(painelSala ? [{ id: "sala", rotulo: "Sala", icone: Users, n: 0 }] : []),
  ];
  return (
    <section className="ec-coluna ec-registro" aria-label="Registro do Encontro">
      <div className="ec-coluna-topo">
        <div className="ec-abas-mini" role="tablist" aria-label="Registro">
          {abas.map((a) => {
            const Icone = a.icone;
            return (
              <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} className="ec-aba-mini" onClick={() => setAba(a.id)}>
                <Icone aria-hidden="true" />{a.rotulo}{a.n > 0 && <small data-alerta={a.id === "pedidos" ? "sim" : undefined}>{a.n}</small>}
              </button>
            );
          })}
        </div>
        {recolhivel && (
          <button type="button" className="afty-passo" onClick={onRecolher} aria-label="Recolher o Registro" title="Recolher o Registro">
            <PanelRightClose aria-hidden="true" />
          </button>
        )}
      </div>
      {encontro.config?.aceitarSozinho && aba === "pedidos" && <p className="ec-nota-chip"><span className="afty-chip" data-afty-tom="destaque">Aceitar Sozinho Ligado</span></p>}
      <div className="ec-registro-corpo">
        {aba === "registro" && <ListaDoRegistro log={encontro.log} />}
        {aba === "pedidos" && <ListaDePedidos pedidos={derivado.pedidos} encontro={encontro} acoes={acoes} />}
        {aba === "historico" && <ListaDoHistorico historico={derivado.historico} acoes={acoes} />}
        {aba === "sala" && painelSala}
      </div>
    </section>
  );
}

function RegistroRecolhido({ encontro, derivado, onAbrir }) {
  return (
    <aside className="ec-coluna ec-registro-fino" aria-label="Registro Recolhido">
      <button type="button" className="afty-passo" onClick={onAbrir} aria-label="Abrir o Registro" title="Abrir o Registro"><PanelRightOpen aria-hidden="true" /></button>
      <span className="ec-fino-item" title="Registro"><ScrollText aria-hidden="true" /><small>{encontro.log.length}</small></span>
      <span className="ec-fino-item" title="Pedidos" data-alerta={derivado.pedidos.length ? "sim" : undefined}><Inbox aria-hidden="true" /><small>{derivado.pedidos.length}</small></span>
      <span className="ec-fino-item" title="Histórico"><History aria-hidden="true" /><small>{derivado.historico.length}</small></span>
    </aside>
  );
}

/* ============================================================ */
/* A TELA                                                        */
/* ============================================================ */

export default function LutaDoMestre({ estado, onVoltar, onConfig, onEncerrar, acoesSala = null, painelSala = null }) {
  const { encontro, derivado, acoes, mundo, inventario } = estado;
  const raiz = useRef(null);
  const faixa = useFaixaDeLargura(raiz, FAIXAS);
  const [focoId, setFocoId] = useState(null);
  const [selecionados, setSelecionados] = useState(() => new Set());
  const ultimoSel = useRef(null);
  const [painel, setPainel] = useState("ordem");
  const [registroLargo, setRegistroLargo] = useState(true);
  const [registroMedio, setRegistroMedio] = useState(false);
  const [reforcos, setReforcos] = useState(false);
  const [iniReforco, setIniReforco] = useState("");
  const [aRemover, setARemover] = useState(null);

  /* O meio segue a vez até alguém escolher. O Próximo Turno solta a escolha. */
  const vezAnterior = useRef(encontro.ativoId);
  useEffect(() => {
    if (vezAnterior.current !== encontro.ativoId) { vezAnterior.current = encontro.ativoId; setFocoId(null); }
  }, [encontro.ativoId]);
  const existe = (id) => encontro.combatentes.some((c) => c.id === id);
  const focoEfetivo = focoId && existe(focoId) ? focoId : encontro.ativoId ?? derivado.ordem[0]?.id ?? null;
  const escolhido = encontro.combatentes.find((c) => c.id === focoEfetivo) ?? null;

  const selecionadosVivos = useMemo(() => [...selecionados].filter(existe), [selecionados, encontro.combatentes]); // eslint-disable-line react-hooks/exhaustive-deps
  const selecionar = (id, comShift) => {
    setSelecionados((s) => {
      const n = new Set(s);
      if (comShift && ultimoSel.current) {
        const ordem = derivado.ordem.map((c) => c.id);
        const [a, b] = [ordem.indexOf(ultimoSel.current), ordem.indexOf(id)].sort((x, y) => x - y);
        if (a >= 0 && b >= 0) { ordem.slice(a, b + 1).forEach((x) => n.add(x)); return n; }
      }
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    ultimoSel.current = id;
  };
  const selecionarTodos = (sim) => setSelecionados(sim ? new Set(derivado.ordem.filter((c) => c.tipo !== TIPO.MARCADOR).map((c) => c.id)) : new Set());
  const focar = (id) => { setFocoId(id); if (faixa === "estreita") setPainel("ficha"); };

  const naLuta = useMemo(() => new Set(encontro.combatentes.filter(ehLigado).map((c) => String(c.fichaRef.id))), [encontro.combatentes]);
  const iniciativaReforco = iniReforco === "" ? null : Math.trunc(Number(iniReforco) || 0);

  const registroAberto = faixa === "larga" ? registroLargo : faixa === "media" ? registroMedio : painel === "registro";
  const ordem = (
    <ColunaOrdem
      encontro={encontro} derivado={derivado} focoId={focoEfetivo} selecionados={new Set(selecionadosVivos)}
      onFocar={focar} onSelecionar={selecionar} onSelecionarTodos={selecionarTodos}
    />
  );
  const meio = (
    <section className="ec-coluna ec-meio" data-afty-rolagem aria-label="Combatente Escolhido">
      <PainelDoEscolhido c={escolhido} encontro={encontro} derivado={derivado} mundo={mundo} acoes={acoes} onRemover={() => setARemover(escolhido)} />
    </section>
  );
  const registro = (
    <ColunaRegistro
      encontro={encontro} derivado={derivado} acoes={acoes}
      recolhivel={faixa !== "estreita"} painelSala={painelSala}
      onRecolher={() => (faixa === "larga" ? setRegistroLargo(false) : setRegistroMedio(false))}
    />
  );

  return (
    <div ref={raiz} className="ec-luta" data-faixa={faixa} data-registro={registroAberto ? "aberto" : "fechado"} data-grupo={selecionadosVivos.length ? "sim" : undefined}>
      <TopoDaLuta
        encontro={encontro} ativo={derivado.ativo} faixa={faixa} onVoltar={onVoltar} acoes={acoes}
        onReforcos={() => setReforcos(true)} onConfig={onConfig} onEncerrar={onEncerrar}
        registroAberto={registroMedio} onRegistro={() => setRegistroMedio((v) => !v)} acoesSala={acoesSala}
      />
      {faixa === "estreita" && (
        <div className="ec-paineis" role="tablist" aria-label="Painéis da Luta">
          {[["ordem", "Ordem", ListOrdered, derivado.total], ["ficha", "Ficha", FileText, null], ["registro", "Registro", ScrollText, derivado.pedidos.length || null]].map(([id, rotulo, Icone, n]) => (
            <button key={id} type="button" role="tab" aria-selected={painel === id} className="ec-painel-botao" onClick={() => setPainel(id)}>
              <Icone aria-hidden="true" />{rotulo}{n != null && <small>{n}</small>}
            </button>
          ))}
        </div>
      )}
      <div className="ec-colunas">
        {faixa === "estreita" ? (
          <>
            {painel === "ordem" && ordem}
            {painel === "ficha" && meio}
            {painel === "registro" && registro}
          </>
        ) : (
          <>
            {ordem}
            {meio}
            {faixa === "larga" && (registroLargo ? registro : <RegistroRecolhido encontro={encontro} derivado={derivado} onAbrir={() => setRegistroLargo(true)} />)}
            {faixa === "media" && registroMedio && <div className="ec-registro-flutuante">{registro}</div>}
          </>
        )}
      </div>

      {selecionadosVivos.length > 0 && (
        <BarraDeGrupo
          ids={selecionadosVivos}
          nomes={selecionadosVivos.map((id) => encontro.combatentes.find((c) => c.id === id)?.nome).filter(Boolean)}
          acoes={acoes}
          onLimpar={() => setSelecionados(new Set())}
        />
      )}

      {reforcos && (
        <Dialogo titulo="Reforços" icone={UserPlus} onFechar={() => setReforcos(false)} largura="34rem">
          <AdicionarCombatentes
            inventario={inventario} naLuta={naLuta} abaInicial="criatura"
            iniciativa={(
              <label className="ec-rotulado ec-rotulado-linha">
                <span>Entra com Iniciativa</span>
                <input className="ec-campo ec-campo-num" inputMode="numeric" value={iniReforco} placeholder="Mod." data-largura="larga"
                  onChange={(e) => setIniReforco(e.target.value.replace(/[^\d+-]/g, ""))} data-foco-inicial />
              </label>
            )}
            onAdicionarFicha={(entrada, { quantidade }) => acoes.adicionarFicha(entrada, { quantidade, iniciativa: iniciativaReforco })}
            onAdicionarMarcador={(m) => acoes.adicionarMarcador({ ...m, iniciativa: iniciativaReforco })}
          />
        </Dialogo>
      )}
      {aRemover && (
        <Confirmar
          titulo={`Tirar ${aRemover.nome} do Encontro?`} rotulo="Tirar do Encontro"
          onCancelar={() => setARemover(null)}
          onConfirmar={() => { acoes.remover(aRemover.id); setARemover(null); }}
        >
          <p className="ec-texto">
            {aRemover.tipo === TIPO.PERSONAGEM ? "Sai da ordem." : "Sai da ordem, e a cópia dele vai junto."}
          </p>
        </Confirmar>
      )}
    </div>
  );
}
