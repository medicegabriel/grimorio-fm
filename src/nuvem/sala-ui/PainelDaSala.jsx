import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Activity, Check, Clock, Dices, EyeOff, FileText, Heart, History, Inbox, MessageSquare, ScrollText, Send, SkipForward, Swords,
  Undo2, Users, X,
} from "lucide-react";

import { mensagemDaOperacao, historicoDe } from "../../systems/afty/encontros/operacoes";
import { ler as lerDaLoja, ouvir as ouvirDaLoja } from "../../systems/afty/ficha/sessao-loja";
import { Aviso, BarraCurta, MarcaDeVisao, Retrato, RotuloLado, Vazio } from "../../systems/afty/encontros/telas/pecas-encontro";
import LinhasDoRegistro from "../../systems/afty/encontros/telas/LinhasDoRegistro";
import {
  colegasDaSala, criaturasDaSala, linhasDoRegistro, nomesDosMembros, pedidosDoJogador,
} from "../sala-telas";
import {
  aceitarPedidoRecebido, desfazerNoMeuPersonagem, enviarChat, pedirNoAlvo, recusarPedidoRecebido, rolarEscondido,
} from "../sala-jogador";
import { PontoOnline } from "./PecasSala";
import { horaDe, ROTULO_PAPEL } from "./sala-ui-dados";

/**
 * ============================================================
 * O PAINEL DA SALA (etapa 7c, 2026-11-18)
 * ============================================================
 * Tudo o que o jogador e o espectador veem da Sala fora da própria Ficha, em abas: Colegas (resumo e Ficha compartilhada),
 * Criaturas (pelo nível de visão que o Mestre deu), Pedidos, Histórico (com Desfazer) e Registro (com o chat). O Mestre usa só
 * o Registro, com a rolagem escondida.
 *
 * ⚠ SÓ O QUE A RLS DEIXOU LER. Nenhuma aba deriva nada de criatura: o que aparece vem do resumo cortado pelo banco
 * (`sala_resumos.publico`) e das linhas do Registro. A criatura Oculta nem chega aqui.
 * ============================================================
 */

const ROTULO_TIPO = { dano: "Dano", cura: "Cura" };
const ROTULO_ESTADO = { pendente: "Pendente", aceito: "Aceito", recusado: "Recusado" };
const MOTIVO_ROTULO = { mudou: "Mudou Depois", foraDoLimite: "Passa do Limite", semCalculo: "Sem Cálculo" };

/* A sessão de uma ficha do aparelho, pela loja (a mesma que a Ficha lê). */
const useSessaoDoAparelho = (fichaId) => useSyncExternalStore(
  (fn) => ouvirDaLoja(String(fichaId), fn),
  () => lerDaLoja(String(fichaId)),
);

/* ---------- pedir Dano ou Cura ---------- */

function PedirNoAlvo({ alvo, meuCombatente, cliente, desabilitado = false }) {
  const [tipo, setTipo] = useState(null);
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const n = Math.max(0, Math.trunc(Number(valor) || 0));
  const enviar = async (ev) => {
    ev?.preventDefault?.();
    if (!tipo || !n || enviando) return;
    setEnviando(true);
    try {
      await pedirNoAlvo(cliente, { meuCombatente, alvo, tipo, valor: n });
      setResultado({ frase: `Pedido de ${ROTULO_TIPO[tipo]} ${n} Enviado` });
      setTipo(null);
      setValor("");
    } catch (e) {
      setResultado({ frase: e?.codigo ?? "Falha ao Pedir", falhou: true });
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="sl-pedir">
      {tipo == null ? (
        <>
          <button type="button" className="afty-botao" data-afty-tom="dano" disabled={desabilitado} onClick={() => { setResultado(null); setTipo("dano"); }}><Swords aria-hidden="true" />Pedir Dano</button>
          <button type="button" className="afty-botao" data-afty-tom="cura" disabled={desabilitado} onClick={() => { setResultado(null); setTipo("cura"); }}><Heart aria-hidden="true" />Pedir Cura</button>
        </>
      ) : (
        <form className="sl-pedir" onSubmit={enviar}>
          <input
            className="ec-campo ec-campo-num" inputMode="numeric" value={valor} placeholder="0" autoFocus
            aria-label={`Valor de ${ROTULO_TIPO[tipo]}`} onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Escape") { setTipo(null); setValor(""); } }}
          />
          <button type="submit" className="afty-botao" data-afty-tom={tipo === "cura" ? "cura" : "dano"} disabled={!n || enviando}><Send aria-hidden="true" />{ROTULO_TIPO[tipo]}</button>
          <button type="button" className="afty-botao ec-icone" aria-label="Cancelar o Pedido" title="Cancelar o Pedido" onClick={() => { setTipo(null); setValor(""); }}><X aria-hidden="true" /></button>
        </form>
      )}
      {resultado && <p className="sl-resultado" data-falhou={resultado.falhou ? "sim" : undefined} role="status">{resultado.frase}</p>}
    </div>
  );
}

/* ---------- barras de um resumo ---------- */

function BarrasDoResumo({ r }) {
  return (
    <div className="sl-cartao-barras">
      <BarraCurta tipo="pv" rotulo="PV" atual={r.pv} max={r.pvMax} temp={r.pvTemp} />
      {r.peMax > 0 && <BarraCurta tipo="pe" rotulo="PE" atual={r.pe} max={r.peMax} temp={r.peTemp} />}
      {r.almaMax > 0 && <BarraCurta tipo="alma" rotulo="Alma" atual={r.alma} max={r.almaMax} />}
    </div>
  );
}

const Listas = ({ resumo }) => (
  <>
    {resumo.condicoes.length > 0 && <p className="sl-cartao-extra"><b>Condições</b> {resumo.condicoes.join(", ")}</p>}
    {resumo.efeitos.length > 0 && <p className="sl-cartao-extra"><b>Efeitos</b> {resumo.efeitos.join(", ")}</p>}
  </>
);

/* ---------- colegas e criaturas ---------- */

function AbaColegas({ retrato, cliente, meuCombatente, podePedir, onAbrirColega }) {
  const colegas = colegasDaSala(retrato);
  if (!colegas.length) return <Vazio icone={Users} titulo="Nenhum Colega na Sala" />;
  return (
    <ul className="sl-cartoes" aria-label="Colegas">
      {colegas.map((c) => {
        const foto = retrato.fichas?.[c.id]?.ficha?.dados;
        return (
          <li key={c.id} className="sl-cartao" data-vez={c.naVez ? "sim" : undefined}>
            <div className="sl-cartao-topo">
              <Retrato url={foto?.portraitUrl} foco={foto?.portraitFocus} nome={c.nome} tamanho="sm" />
              <span className="sl-cartao-texto">
                <span className="sl-cartao-nome" title={c.nome}>{c.nome}</span>
                <span className="sl-cartao-meta"><span>{c.donoNome ?? "Sem Jogador"}</span><PontoOnline online={c.online} /></span>
              </span>
              {c.naVez && <span className="afty-chip" data-afty-tom="destaque">Vez</span>}
            </div>
            {c.resumo.temNumeros ? <BarrasDoResumo r={c.resumo} /> : <p className="sl-cartao-extra">Sem Resumo Ainda</p>}
            <Listas resumo={c.resumo} />
            <div className="sl-cartao-acoes">
              {c.compartilhada && <button type="button" className="afty-botao" onClick={() => onAbrirColega(c.id)}><FileText aria-hidden="true" />Abrir Ficha</button>}
              {podePedir && <PedirNoAlvo alvo={c.id} meuCombatente={meuCombatente} cliente={cliente} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AbaCriaturas({ retrato, cliente, meuCombatente, podePedir, onAbrirColega }) {
  const criaturas = criaturasDaSala(retrato);
  if (!criaturas.length) return <Vazio icone={Swords} titulo="Nenhuma Criatura à Vista" />;
  return (
    <ul className="sl-cartoes" aria-label="Criaturas">
      {criaturas.map((c) => {
        const ficha = retrato.fichas?.[c.id]?.ficha?.dados;
        return (
          <li key={c.id} className="sl-cartao" data-vez={c.naVez ? "sim" : undefined}>
            <div className="sl-cartao-topo">
              <Retrato url={ficha?.portraitUrl} foco={ficha?.portraitFocus} nome={c.nome} tamanho="sm" />
              <span className="sl-cartao-texto">
                <span className="sl-cartao-nome" title={c.nome}>{c.nome}</span>
                <span className="sl-cartao-meta"><RotuloLado lado={c.lado} /><MarcaDeVisao visao={c.visao} /></span>
              </span>
              {c.naVez && <span className="afty-chip" data-afty-tom="destaque">Vez</span>}
            </div>
            {c.resumo?.temNumeros && <BarrasDoResumo r={c.resumo} />}
            {c.barra?.faixa && (
              <div className="sl-cartao-barras">
                <BarraCurta tipo="pv" rotulo="PV" atual={Math.round(c.barra.fracao * 100)} max={100} semNumero />
                <span className="sl-faixa-vida">{c.barra.rotulo}</span>
              </div>
            )}
            {c.resumo && <Listas resumo={c.resumo} />}
            <div className="sl-cartao-acoes">
              {c.visao === "aberta" && ficha && <button type="button" className="afty-botao" onClick={() => onAbrirColega(c.id)}><FileText aria-hidden="true" />Abrir Ficha</button>}
              {podePedir && <PedirNoAlvo alvo={c.id} meuCombatente={meuCombatente} cliente={cliente} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- pedidos ---------- */

function PedidoRecebido({ p, cliente, meus }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const meu = meus.find((m) => m.resumo.combatente === p.alvo);
  const v = p.valor != null ? ` ${Math.max(0, Math.trunc(Number(p.valor) || 0))}` : "";
  const aceitar = async () => {
    if (!meu) return;
    setBusy(true);
    setMsg(null);
    const r = await aceitarPedidoRecebido(cliente, { pedido: p, meu: { resumo: meu.resumo, ficha: meu.ficha, sessao: lerDaLoja(String(meu.ficha.id)) } });
    setBusy(false);
    if (!r.ok) setMsg(r.erro === "Não Fecha" ? `Não Fecha: ${(r.conflitos ?? []).map((x) => MOTIVO_ROTULO[x.motivo] ?? x.motivo).join(", ")}` : r.erro);
  };
  const recusar = async () => {
    setBusy(true);
    const r = await recusarPedidoRecebido(cliente, { pedido: p });
    setBusy(false);
    if (!r.ok) setMsg(r.erro);
  };
  return (
    <li className="sl-item">
      <p className="sl-item-texto"><b>{ROTULO_TIPO[p.tipo] ?? "Operação"}{v}</b> em {p.alvoNome}</p>
      <p className="sl-item-meta">De {p.autorNome}</p>
      <span className="sl-item-botoes">
        <button type="button" className="afty-botao" data-afty-tom="cura" disabled={busy || !meu} onClick={aceitar}><Check aria-hidden="true" />Aceitar</button>
        <button type="button" className="afty-botao" disabled={busy} onClick={recusar}><X aria-hidden="true" />Recusar</button>
      </span>
      {msg && <Aviso onFechar={() => setMsg(null)}>{msg}</Aviso>}
    </li>
  );
}

function AbaPedidos({ retrato, cliente, meus }) {
  const { feitos, recebidos } = pedidosDoJogador(retrato);
  if (!feitos.length && !recebidos.length) return <Vazio icone={Inbox} titulo="Nenhum Pedido" />;
  return (
    <>
      <h3 className="sl-secao-titulo"><Inbox aria-hidden="true" />Recebidos<small>{recebidos.length}</small></h3>
      {recebidos.length ? (
        <ul className="sl-cartoes">{recebidos.map((p) => <PedidoRecebido key={p.id} p={p} cliente={cliente} meus={meus} />)}</ul>
      ) : <p className="ec-vazio-linha">Nenhum Pedido Pendente</p>}
      <h3 className="sl-secao-titulo"><Send aria-hidden="true" />Meus Pedidos<small>{feitos.length}</small></h3>
      {feitos.length ? (
        <ul className="sl-cartoes">
          {feitos.map((p) => (
            <li key={p.id} className="sl-item">
              <p className="sl-item-texto"><b>{ROTULO_TIPO[p.tipo] ?? "Operação"}{p.valor != null ? ` ${p.valor}` : ""}</b> em {p.alvoNome}</p>
              <span className="sl-estado" data-estado={p.estado}>{ROTULO_ESTADO[p.estado] ?? p.estado}</span>
            </li>
          ))}
        </ul>
      ) : <p className="ec-vazio-linha">Nenhum Pedido Feito</p>}
    </>
  );
}

/* ---------- histórico com Desfazer ---------- */

function HistoricoDaFicha({ meu, retrato, cliente }) {
  const sessao = useSessaoDoAparelho(meu.ficha.id);
  const membros = nomesDosMembros(retrato);
  const [falhas, setFalhas] = useState({});
  const lista = historicoDe(sessao);
  if (!lista.length) return null;
  return (
    <>
      <h3 className="sl-secao-titulo"><History aria-hidden="true" />{meu.resumo.nome}<small>{lista.length}</small></h3>
      <ul className="sl-cartoes">
        {lista.map((op) => {
          const falha = falhas[op.id];
          const nome = op.autor?.conta ? membros[op.autor.conta] : null;
          const quem = op.autor?.papel === "mestre" ? `${nome ?? "Mestre"} (Mestre)` : nome ?? ROTULO_PAPEL[op.autor?.papel] ?? "Outra Pessoa";
          return (
            <li key={op.id} className="sl-item" data-desfeita={op.desfeita ? "sim" : undefined}>
              <p className="sl-item-texto">{mensagemDaOperacao(op, { nome: meu.resumo.nome })}</p>
              <p className="sl-item-meta">{quem} · {horaDe(op.quando)}</p>
              {op.desfeita ? <span className="afty-chip">Desfeita</span> : op.tipo !== "desfazer" && (
                <button
                  type="button" className="afty-botao"
                  onClick={async () => {
                    const r = await desfazerNoMeuPersonagem(cliente, { meu: { resumo: meu.resumo, ficha: meu.ficha, sessao: lerDaLoja(String(meu.ficha.id)) }, operacaoId: op.id });
                    setFalhas((f) => ({ ...f, [op.id]: r.ok ? null : r }));
                  }}
                ><Undo2 aria-hidden="true" />Desfazer</button>
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
    </>
  );
}

function AbaHistorico({ retrato, cliente, meus }) {
  if (!meus.length) return <Vazio icone={History} titulo="Nenhuma Ficha na Sala" />;
  return <>{meus.map((m) => <HistoricoDaFicha key={m.resumo.combatente} meu={m} retrato={retrato} cliente={cliente} />)}</>;
}

/* ---------- o Registro e o chat ---------- */

export function RegistroDaSala({ retrato, cliente, podeEscrever = true, comEscondida = false }) {
  const linhas = useMemo(() => linhasDoRegistro(retrato), [retrato.operacoes, retrato.publicas, retrato.membros, retrato.resumos]); // eslint-disable-line react-hooks/exhaustive-deps
  const feed = useRef(null);
  const [texto, setTexto] = useState("");
  const [formula, setFormula] = useState("");
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);
  useEffect(() => { const el = feed.current; if (el) el.scrollTop = el.scrollHeight; }, [linhas.length]);

  const falar = async (ev) => {
    ev.preventDefault();
    const t = texto;
    if (!t.trim()) return;
    setTexto("");
    setErro(null);
    try { await enviarChat(cliente, t); } catch (e) { setTexto(t); setErro(e?.codigo ?? "Falha ao Enviar"); }
  };
  const rolar = async (ev) => {
    ev.preventDefault();
    setErro(null);
    try {
      const r = await rolarEscondido(cliente, formula);
      if (!r.ok) { setResultado(null); setErro(r.erro); return; }
      setResultado(`${r.rolagem.formula}: ${r.rolagem.total}`);
      setFormula("");
    } catch (e) { setErro(e?.codigo ?? "Falha ao Rolar"); }
  };

  return (
    <div className="sl-registro">
      {linhas.length === 0 ? (
        <div className="sl-feed"><Vazio icone={ScrollText} titulo="Nada Registrado Ainda" /></div>
      ) : (
        <LinhasDoRegistro linhas={linhas} refLista={feed} className="sl-feed" />
      )}
      {erro && <div className="sl-aviso-pad"><Aviso onFechar={() => setErro(null)}>{erro}</Aviso></div>}
      {comEscondida && (
        <form className="sl-escondida" onSubmit={rolar}>
          <input className="ec-campo" value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="d20+5" aria-label="Fórmula da Rolagem Escondida" maxLength={20} />
          <button type="submit" className="afty-botao" disabled={!formula.trim()}><EyeOff aria-hidden="true" />Rolar Escondido</button>
          {resultado && <span className="sl-resultado" role="status">{resultado}</span>}
        </form>
      )}
      {podeEscrever && (
        <form className="sl-chat" onSubmit={falar}>
          <input className="ec-campo" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} aria-label="Mensagem para a Sala" placeholder="Mensagem" />
          <button type="submit" className="afty-botao ec-icone" disabled={!texto.trim()} aria-label="Enviar a Mensagem" title="Enviar a Mensagem"><Send aria-hidden="true" /></button>
        </form>
      )}
    </div>
  );
}

/* ---------- o painel ---------- */

/**
 * `meus`: `[{ resumo, ficha }]` dos personagens desta conta na Sala (do aparelho). `meuCombatente`: o que age nos pedidos (o da
 * Ficha aberta, ou o primeiro). `abas`: quais mostrar, na ordem. `podePedir`: só quem é jogador. `onFechar`: o painel que se fecha
 * (a gaveta do celular).
 */
export default function PainelDaSala({
  retrato, cliente, meus = [], meuCombatente = null, podePedir = false, abas = ["colegas", "criaturas", "pedidos", "historico", "registro"],
  abaInicial = null, onAbrirColega = () => {}, onFechar = null,
}) {
  const [aba, setAba] = useState(abaInicial ?? abas[0]);
  const { recebidos } = pedidosDoJogador(retrato);
  const defs = {
    colegas: { rotulo: "Colegas", icone: Users, n: colegasDaSala(retrato).length },
    criaturas: { rotulo: "Criaturas", icone: Swords, n: criaturasDaSala(retrato).length },
    pedidos: { rotulo: "Pedidos", icone: Inbox, n: recebidos.length, alerta: true },
    historico: { rotulo: "Histórico", icone: History, n: 0 },
    registro: { rotulo: "Registro", icone: ScrollText, n: 0 },
  };
  const atual = abas.includes(aba) ? aba : abas[0];
  const props = { retrato, cliente, meuCombatente, podePedir, onAbrirColega };
  return (
    <aside className="sl-painel" aria-label="Sala">
      <div className="sl-painel-topo">
        <div className="sl-abas" role="tablist" aria-label="Sala">
          {abas.map((id) => {
            const d = defs[id];
            const Icone = d.icone;
            return (
              <button key={id} type="button" role="tab" aria-selected={atual === id} aria-label={d.rotulo} title={d.rotulo} className="ec-aba-mini" onClick={() => setAba(id)}>
                <Icone aria-hidden="true" />{atual === id && d.rotulo}{d.n > 0 && <small data-alerta={d.alerta ? "sim" : undefined}>{d.n}</small>}
              </button>
            );
          })}
        </div>
        {onFechar && <button type="button" className="afty-passo" onClick={onFechar} aria-label="Fechar o Painel" title="Fechar o Painel"><X aria-hidden="true" /></button>}
      </div>
      <div className="sl-painel-corpo" data-aba={atual}>
        {atual === "colegas" && <AbaColegas {...props} />}
        {atual === "criaturas" && <AbaCriaturas {...props} />}
        {atual === "pedidos" && <AbaPedidos retrato={retrato} cliente={cliente} meus={meus} />}
        {atual === "historico" && <AbaHistorico retrato={retrato} cliente={cliente} meus={meus} />}
        {atual === "registro" && <RegistroDaSala retrato={retrato} cliente={cliente} podeEscrever comEscondida={retrato.eu?.papel === "mestre"} />}
      </div>
    </aside>
  );
}

