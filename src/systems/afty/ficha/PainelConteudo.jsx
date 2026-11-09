import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { novaOperacao, pagaManutencao, encerraUso } from "./ficha-uso";
import { alteraEstadoCombate, usosGastosDe } from "./ficha-sessao";
import { NumeroComFontes } from "../ui/fontes";
import { TIPOS_DANO } from "../afty-equipamentos";
import { armaCanalizacao, confirmaAtaqueConteudo, usaAptidaoPessoal, armasParaAuraRedirecionadora,
  preparaAuraRedirecionadora, falhasParaAuraRedirecionadora, rolaRedirecionamentoAura, danoDoRedirecionamentoAura, bonusSaltadorContra } from "./ficha-conteudo-combate";
import { assumePosturaConteudo, posturasPropriasConteudo, posturaAtivaConteudo } from "./ficha-conteudo-posturas";
import { devastacaoContra } from "./ficha-conteudo-devastacao";
import { acertosParaTempestade, aplicaTempestade, rolaTempestade } from "./ficha-conteudo-tempestade";
import { limiteConcentrarAura, opcoesConcentrarAura, usaConcentrarAura } from "./ficha-conteudo-concentrar-aura";
import { alcancesDasAurasPassivas } from "./ficha-conteudo-expandir-aura";
import { ataquesParaDragao, rolaDragaoConteudo, aplicaDragaoConteudo, metadesDoDragao } from "./ficha-conteudo-dragao";
import { alcancePular, iniciaPulo, concluiPulo, puloLivreDisponivel, pulosPendentes, resultadoPulo } from "./ficha-conteudo-salto";
import { usaTesteConteudo, rerrolaTreinoPericia, usaMentePlacida, rerrolaTesteDeClasse, usaAnaliseProfunda, concluiAnaliseProfunda, rerrolaFortuna, dadosDisponiveisFortuna } from "./ficha-conteudo-testes";
import { deslocaAlvoTalento, usaMovimentosAcrobaticos, preparaOportunidadeConteudo,
  distanciaInvestidaConteudo, preparaInvestidaConteudo, danoDaInvestidaConteudo, rolaDisputaInvestida, aplicaDisputaInvestida, usaMobilidadeAvancada,
  rolaManobraDeBriga, aplicaManobraDeBriga, rolaEmpurraoEscudo, aplicaEmpurraoEscudo, preparaReacaoSentinela,
  rolaDisputaMobilidade, aplicaDisputaMobilidade, usaAcaoAgilConteudo, aplicaCorteConteudo, usaAcaoLuaConteudo } from "./ficha-conteudo-manobras";
import { aptidaoDeConteudoDisponivel, testeComConsequencias } from "./ficha-conteudo-acesso";
import { concluiProvocar, provocacoesPendentes, provocacoesSemAtaque, rolaProvocar, usosLivresDeProvocar } from "./ficha-conteudo-provocar";
import { concluiCuraComMedicina, curasMedicinaPendentes, dadosParaMedicina, usosMedicinaInfalivel } from "./ficha-conteudo-medicina";
import {
  usaCuraConteudo, conteudoComAlvo, regeneraFerimento, rolaSorte, escolheSorte,
  rerrolaDanoTalento, rerrolaIniciativa, testaSangramentoCritico, usaEspecializacaoConteudo, recursoDeCuraConteudo, usaIntervencaoConteudo, venenosParaRegenerar,
  usaIncitarVigor, dadosVidaDoConteudo, danoDeAtaqueParaRerrolar, usaSintonizacaoVital, curasParaSintonizar,
  alcanceCuraEmGrupo, rolaCuraEmGrupo, curasEmGrupoPendentes, aplicaCuraEmGrupo,
} from "./ficha-conteudo-uso";

const botao = "afty-botao px-2 py-1 text-xs disabled:opacity-40";
const campo = "afty-input min-w-0 max-w-full rounded border px-2 py-1 text-xs";
function Erro({ erro }) { return erro ? <p className="flex items-center gap-1 text-xs text-amber-400" role="alert"><AlertTriangle className="w-3 h-3" />{erro}</p> : null; }
function Alvo({ alvos, valor, onValor, rotulo = "Alvo do Efeito", vazio = "Selecione o Alvo", bloqueado = false }) {
  return <select aria-label={rotulo} className={campo} value={valor} disabled={bloqueado} onChange={(e) => onValor(e.target.value)}>
    <option value="">{vazio}</option>{alvos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
  </select>;
}
const pedido = () => ({ opId: novaOperacao(), registraAcao: true });

function CuraDoItem({ linha, derived, sessao, onSessao, alvos = [], onOperacaoAlvo, fluxo = false, turnoEmCurso, emSeuTurno = true }) {
  const [blocos, setBlocos] = useState(1), [alvo, setAlvo] = useState(""), [erro, setErro] = useState(null), [gatilho, setGatilho] = useState(""), [aliado, setAliado] = useState(false);
  const [aguardar, setAguardar] = useState(false), [indices, setIndices] = useState([]);
  const quota = usosMedicinaInfalivel(sessao, derived);
  const podeMaximizar = (emSeuTurno || (fluxo && gatilho === "dano")) && quota.restantes > 0
    && (linha.dados > 0 || linha.gruposCura?.some((g) => g.dados > 0));
  const pendente = curasMedicinaPendentes(sessao).find((r) => r.contextoCura.fonteId === linha.id);
  const sintoniza = derived.habilidades?.efetivas?.some((id) => id.replace(/^.*__/, "") === "sup_sintonizacao_vital" && !derived.habilidades.inacessiveis?.includes(id));
  const restantes = linha.usos == null ? null : Math.max(0, linha.usos - usosGastosDe(sessao,
    recursoDeCuraConteudo(linha.id, derived).chave));
  const executar = () => {
    const entrada = { operacao: "cura", id: linha.id, blocos, fluxo, inicioTurno: gatilho === "inicio", reduziuVida: gatilho === "dano",
      alvoId: alvo || null, aliado, turnoEmCurso, emSeuTurno, aguardarMedicina: aguardar && podeMaximizar }, p = pedido();
    const r = alvo && onOperacaoAlvo
      ? onOperacaoAlvo(alvo, (s, d, sa, da) => conteudoComAlvo(s, d, sa, da, entrada, p))
      : usaCuraConteudo(sessao, derived, entrada, p);
    setErro(r?.erro ?? null);
    if (r?.aplicado) {
      setIndices([]);
      if (!alvo) onSessao(() => r.sessao);
    }
  };
  if (pendente) {
    const alvoId = pendente.contextoCura.alvoId;
    const destino = alvos.find((a) => a.id === alvoId);
    const dados = dadosParaMedicina(pendente);
    const ganho = dados.filter((d) => indices.includes(d.indice)).reduce((s, d) => s + d.faces - d.valor, 0);
    const concluir = () => {
      const p = pedido(), entrada = { operacao: "concluiCuraMedicina", curaId: pendente.id, alvoId, turnoEmCurso, indices };
      const r = alvoId ? onOperacaoAlvo?.(alvoId, (s, d, sa, da) => conteudoComAlvo(s, d, sa, da, entrada, p))
        : concluiCuraComMedicina(sessao, derived, entrada, p);
      setErro(r?.erro ?? null);
      if (r?.aplicado) {
        setIndices([]); setAguardar(false);
        if (!alvoId) onSessao(() => r.sessao);
      }
    };
    return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      {destino && <span>{destino.nome}</span>}
      <span>Medicina Infalível ({quota.restantes}/{quota.max})</span>
      {dados.map(({ indice, faces, valor }) => <label key={indice} className="inline-flex items-center gap-1">
        <input type="checkbox" aria-label={`Maximizar Dado ${indice + 1} da Cura`} checked={indices.includes(indice)}
          disabled={!indices.includes(indice) && (indices.length >= quota.restantes || valor >= faces)}
          onChange={(e) => setIndices(e.target.checked ? [...indices, indice] : indices.filter((i) => i !== indice))} />
        {valor}/{faces}
      </label>)}
      <NumeroComFontes valor={pendente.total + ganho} total={pendente.total + ganho}
        partes={[{ label: "Rolagem de Cura", valor: pendente.total }, { label: "Medicina Infalível", valor: ganho }]} />
      <button type="button" className={botao} disabled={!!alvoId && (!destino || !onOperacaoAlvo) || indices.length > quota.restantes}
        onClick={concluir}>Aplicar Cura</button>
      <Erro erro={erro} />
    </div>;
  }
  return <div className="mt-2 flex flex-wrap items-center gap-2">
    <NumeroComFontes valor={linha.texto} formatar={false} partes={linha.partes} total={linha.texto} />
    {restantes != null && <span className="text-xs tabular-nums">{restantes}/{linha.usos}</span>}
    {linha.unidade && <label className="text-xs">{linha.unidade.rotulo} <input aria-label="Pontos da Cura" className={`${campo} w-16`} type="number" min="1" max={linha.blocos} value={blocos} onChange={(e) => setBlocos(Number(e.target.value))} /></label>}
    {fluxo && <select aria-label="Gatilho de Fluxo Constante" className={campo} value={gatilho} onChange={(e) => setGatilho(e.target.value)}><option value="">Selecione o Gatilho</option><option value="inicio">Início do Seu Turno</option><option value="dano">Após Perder PV</option></select>}
    {onOperacaoAlvo && !fluxo && linha.alcance !== "Você" && <select aria-label="Alvo da Cura" className={campo} value={alvo} onChange={(e) => { setAlvo(e.target.value); setAliado(false); }}>
      <option value="">Você</option>{alvos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
    </select>}
    {alvo && sintoniza && <label className="text-xs"><input type="checkbox" checked={aliado} onChange={(e) => setAliado(e.target.checked)} />Alvo é Aliado</label>}
    {podeMaximizar && <label className="inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={aguardar}
      onChange={(e) => setAguardar(e.target.checked)} />Medicina Infalível ({quota.restantes}/{quota.max})</label>}
    <button type="button" className={botao} disabled={restantes === 0} onClick={executar}>{aguardar && podeMaximizar ? "Rolar Cura" : "Curar"}</button>
    <Erro erro={erro} />
  </div>;
}

function CuraEmGrupoDoItem({ sessao, derived, alvos = [], onOperacaoGrupo, voceId, turnoEmCurso, emSeuTurno }) {
  const [ids, setIds] = useState([]), [blocos, setBlocos] = useState(1), [alcanceConfirmado, setAlcanceConfirmado] = useState(false),
    [parcelas, setParcelas] = useState({}), [erro, setErro] = useState(null);
  const linha = derived.cura?.linhas?.find((l) => l.id === "cura_energia_reversa");
  if (!linha || !onOperacaoGrupo) return null;
  const alcance = alcanceCuraEmGrupo(derived);
  const pendente = curasEmGrupoPendentes(sessao, turnoEmCurso)[0];
  const candidatos = [{ id: voceId, nome: "Você", podeReceberEnergiaReversa: sessao.vital?.estado !== "morto" }, ...alvos];
  const destinatarios = pendente?.contextoCuraGrupo.alvoIds ?? [];
  const total = Math.max(0, pendente?.total ?? 0);
  const distribuidas = destinatarios.reduce((s, id) => s + (parcelas[id] ?? 0), 0);
  const rolar = () => {
    const entrada = { alvoIds: ids, voceId, turnoEmCurso, blocos, todosEmAlcance: alcanceConfirmado };
    const p = pedido(), r = onOperacaoGrupo(ids, (s, d, grupo) => rolaCuraEmGrupo(s, d, grupo, entrada, p));
    setErro(r?.erro ?? null);
    if (r?.aplicado) setParcelas({});
  };
  const distribuir = () => {
    const p = pedido(), r = onOperacaoGrupo(destinatarios, (s, _d, grupo) => aplicaCuraEmGrupo(s, grupo,
      { curaId: pendente.id, voceId, turnoEmCurso, parcelas }, p));
    setErro(r?.erro ?? null);
    if (r?.aplicado) { setParcelas({}); setIds([]); setAlcanceConfirmado(false); }
  };
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {!pendente ? <>
      <NumeroComFontes valor={`${alcance.valor} m`} formatar={false} partes={alcance.partes} total={`${alcance.valor} m`} />
      <label>PER <input aria-label="PER da Cura em Grupo" className={`${campo} w-16`} type="number" min="1" max={linha.blocos} value={blocos} onChange={(e) => setBlocos(Number(e.target.value))} /></label>
      <fieldset className="flex basis-full flex-wrap gap-2">
        <legend>Destinatários</legend>
        {candidatos.map((a) => <label key={a.id} className="inline-flex items-center gap-1">
          <input type="checkbox" checked={ids.includes(a.id)} disabled={!a.podeReceberEnergiaReversa} onChange={(e) => {
            setIds(e.target.checked ? [...ids, a.id] : ids.filter((id) => id !== a.id)); setAlcanceConfirmado(false);
          }} />{a.nome}
        </label>)}
      </fieldset>
      <label className="inline-flex items-center gap-1"><input type="checkbox" checked={alcanceConfirmado} onChange={(e) => setAlcanceConfirmado(e.target.checked)} />Todos os Destinatários no Alcance</label>
      <button type="button" className={botao} disabled={!emSeuTurno || !ids.length || !alcanceConfirmado} onClick={rolar}>Rolar Cura em Grupo</button>
    </> : <>
      <NumeroComFontes valor={`${distribuidas}/${total} PV`} formatar={false} partes={[{ label: "Cura em Grupo", valor: total }]} total={total} />
      {destinatarios.map((id) => {
        const nome = candidatos.find((a) => a.id === id)?.nome ?? "Destinatário Indisponível";
        return <label key={id}>{nome} <input aria-label={`Parcela de ${nome}`} className={`${campo} w-16`} type="number" min="0" max={total} value={parcelas[id] ?? ""}
          onChange={(e) => { const n = e.target.value; setParcelas((p) => ({ ...p, [id]: n === "" ? undefined : Number(n) })); }} /></label>;
      })}
      <button type="button" className={botao} disabled={distribuidas !== total || destinatarios.some((id) => !Number.isInteger(parcelas[id]) || parcelas[id] < 0)} onClick={distribuir}>Aplicar Cura em Grupo</button>
    </>}
    <Erro erro={erro} />
  </div>;
}

function SintonizacaoVitalDoItem({ sessao, derived, onSessao, alvos = [], onOperacaoAlvo, turnoEmCurso }) {
  const [curaId, setCuraId] = useState(""), [alvo, setAlvo] = useState(""), [alcance, setAlcance] = useState(false),
    [descontarPE, setDescontarPE] = useState(false), [manual, setManual] = useState(0), [erro, setErro] = useState(null);
  const curas = curasParaSintonizar(sessao, turnoEmCurso), original = curas.find((r) => r.id === curaId);
  const valor = original ? Math.floor(original.contextoCura.valor / 2) : 0;
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Cura Original da Sintonização" className={campo} value={curaId} onChange={(e) => { setCuraId(e.target.value); setAlvo(""); }}>
      <option value="">Selecione a Cura</option>{curas.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.contextoCura.valor}</option>)}
    </select>
    {onOperacaoAlvo && <select aria-label="Destinatário da Sintonização" className={campo} value={alvo} onChange={(e) => { setAlvo(e.target.value); setAlcance(false); }}>
      <option value="">Você</option>{alvos.filter((a) => a.id !== original?.contextoCura.alvoId).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
    </select>}
    <label><input type="checkbox" checked={alcance} onChange={(e) => setAlcance(e.target.checked)} />Destinatário em 3m</label>
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    {original && <NumeroComFontes valor={`${valor} PV`} formatar={false} partes={[{ label: original.rotulo, valor: original.contextoCura.valor }, { label: "Sintonização Vital", texto: "Metade da Cura" }]} total={`${valor} PV`} />}
    <button type="button" className={botao} disabled={!original || !alcance || (!!alvo && !onOperacaoAlvo)} onClick={() => {
      const entrada = { curaId, alvoId: alvo || null, emAlcance: alcance, descontarPE, turnoEmCurso }, p = pedido();
      const r = alvo ? onOperacaoAlvo(alvo, (s, d, sa, da) => usaSintonizacaoVital(s, d, entrada, p, { sessao: sa, derived: da }))
        : usaSintonizacaoVital(sessao, derived, entrada, p);
      setErro(r?.erro ?? null); if (r?.aplicado) { setManual(r.custo.pe.naoDescontado); setCuraId(""); if (!alvo) onSessao(() => r.sessao); }
    }}>Aplicar Sintonização</button>
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}<Erro erro={erro} />
  </div>;
}

function AcaoAgilDoItem({ id, sessao, derived, onSessao, emSeuTurno = true }) {
  const [comando, setComando] = useState("andar"), [distancia, setDistancia] = useState(derived.movimento), [modo, setModo] = useState("normal"),
    [descontarPE, setDescontarPE] = useState(false), [manual, setManual] = useState(0), [erro, setErro] = useState(null);
  const desengajado = sessao.uso?.ativos?.acao_agil?.parametros?.comando === "desengajar";
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Uso da Ação Ágil" className={campo} value={comando} onChange={(e) => setComando(e.target.value)}><option value="andar">Andar</option><option value="desengajar">Desengajar</option><option value="esconder">Esconder</option></select>
    {comando === "andar" && <><label>Distância <input aria-label="Distância da Ação Ágil" className={`${campo} w-20`} type="number" min="0" max={derived.movimento} step="0.5" value={distancia} onChange={(e) => setDistancia(Number(e.target.value))} /></label>
      <span>Máximo <NumeroComFontes valor={`${derived.movimento}m`} formatar={false} partes={[{ label: "Movimento", valor: derived.movimento }]} total={`${derived.movimento}m`} /></span></>}
    {comando === "esconder" && <select aria-label="Modo de Furtividade da Ação Ágil" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select>}
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    <button type="button" className={botao} disabled={!emSeuTurno} onClick={() => {
      const r = usaAcaoAgilConteudo(sessao, derived, { id, comando, distancia, modo, emSeuTurno, descontarPE }, pedido());
      setErro(r.erro ?? null); if (r.aplicado) { setManual(r.custo.pe.naoDescontado); onSessao(() => r.sessao); }
    }}>Usar Ação Ágil</button>
    {desengajado && <span>Desengajado</span>}
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}<Erro erro={erro} />
  </div>;
}

function LuaDoItem({ sessao, derived, onSessao, emSeuTurno = true }) {
  const [comando, setComando] = useState("andar"), [distancia, setDistancia] = useState(derived.movimento), [erro, setErro] = useState(null);
  if (!posturaAtivaConteudo(sessao, derived, "lua")) return null;
  const desengajado = sessao.uso?.ativos?.["cmb_postura_da_lua:desengajar"];
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Ação Livre da Lua" className={campo} value={comando} onChange={(e) => setComando(e.target.value)}><option value="andar">Andar</option><option value="desengajar">Desengajar</option></select>
    {comando === "andar" && <><label>Distância <input aria-label="Distância da Lua" className={`${campo} w-20`} type="number" min="0" max={derived.movimento} step="0.5" value={distancia} onChange={(e) => setDistancia(Number(e.target.value))} /></label>
      <span>Máximo <NumeroComFontes valor={`${derived.movimento}m`} formatar={false} partes={derived.partes?.movimento ?? [{ label: "Movimento", valor: derived.movimento }]} total={`${derived.movimento}m`} /></span></>}
    <button type="button" className={botao} disabled={!emSeuTurno} onClick={() => {
      const r = usaAcaoLuaConteudo(sessao, derived, { comando, distancia, emSeuTurno }, pedido());
      setErro(r.erro ?? null); if (r.aplicado) onSessao(() => r.sessao);
    }}>Usar Ação Livre da Lua</button>
    {desengajado && <span>Desengajado</span>}<Erro erro={erro} />
  </div>;
}

function TempestadeDoItem({ sessao, derived, alvos = [], onOperacaoAlvo, turnoEmCurso }) {
  const [ataqueId, setAtaqueId] = useState(""), [modo, setModo] = useState("normal"), [erro, setErro] = useState(null);
  if (!onOperacaoAlvo || !posturaAtivaConteudo(sessao, derived, "tempestade")) return null;
  const acertos = acertosParaTempestade(sessao, derived, turnoEmCurso);
  const acerto = acertos.find((r) => r.ataqueId === ataqueId), alvoId = acerto?.ataque.alvo.id;
  const alvo = alvos.find((a) => a.id === alvoId);
  const pendente = sessao.log.find((r) => r.contextoTempestade?.ataqueId === ataqueId && r.contextoTempestade.alvoId === alvoId);
  const teste = alvo?.rolagens?.find((r) => r.id === pendente?.testeId);
  const resolvido = teste && testeComConsequencias(teste);
  const executar = () => {
    const fn = pendente ? aplicaTempestade : rolaTempestade, p = pedido();
    const r = onOperacaoAlvo(alvoId, (s, d, sa, da) => fn(s, d, sa, da, { ataqueId, alvoId, turnoEmCurso, modoAlvo: modo }, p));
    setErro(r?.erro ?? null);
    if (r?.aplicado && pendente) setAtaqueId("");
  };
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Acerto da Tempestade" className={campo} value={ataqueId} onChange={(e) => setAtaqueId(e.target.value)}>
      <option value="">Acerto da Tempestade</option>{acertos.map((r) => <option key={r.ataqueId} value={r.ataqueId}>
        {alvos.find((a) => a.id === r.ataque.alvo.id)?.nome ?? "Alvo"} · {r.detalhe}
      </option>)}
    </select>
    {pendente ? <span>Fortitude {teste?.total ?? "…"} / CD {pendente.contextoTempestade.cd}</span> :
      <select aria-label="Modo da Fortitude da Tempestade" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}>
        <option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option>
      </select>}
    <button type="button" className={botao} disabled={!alvo || (pendente && (!teste || resolvido || teste.sorte?.escolha === null))} onClick={executar}>
      {pendente ? "Aplicar Tempestade" : "Rolar Fortitude da Tempestade"}
    </button>
    <Erro erro={erro} />
  </div>;
}

function DragaoDoItem({ sessao, derived, alvos = [], onOperacaoAlvo, voceId, turnoEmCurso }) {
  const [ataqueId, setAtaqueId] = useState(""), [alvoId, setAlvoId] = useState(""), [alcance, setAlcance] = useState(false),
    [inimigo, setInimigo] = useState(false), [modo, setModo] = useState("normal"), [desempates, setDesempates] = useState({}), [erro, setErro] = useState(null);
  const [janela, setJanela] = useState(null);
  if (!posturaAtivaConteudo(sessao, derived, "dragao")) return null;
  const ataques = ataquesParaDragao(sessao, derived, turnoEmCurso), ataque = ataques.find((r) => r.ataqueId === ataqueId);
  const pendente = sessao.log?.find((r) => r.contextoDragao?.ataqueId === ataqueId && r.contextoDragao.alvoId === alvoId);
  const resolvido = pendente && sessao.log.some((r) => r.testeId === pendente.testeId && r.tr && r.rotulo === "Postura do Dragão");
  const valor = metadesDoDragao(ataque?.calculos)?.reduce((s, g) => s + g.total, 0);
  const concluir = (p, resposta) => {
    const entrada = { testeId: pendente.testeId, alvoId, voceId, turnoEmCurso, desempatesPorTipo: desempates, janelaReacao: resposta };
    const r = onOperacaoAlvo(alvoId, (s, d, sa, da, mesa) => aplicaDragaoConteudo(s, d, sa, da, { ...entrada, mesa }, p));
    setErro(r?.erro ?? null);
    setJanela(r?.janelaReacao ? { ...r.janelaReacao, pedido: p } : null);
  };
  return <div className="mt-2 space-y-2">
    <div className="flex flex-wrap items-center gap-2 text-xs" onChangeCapture={() => setJanela(null)}>
    <select aria-label="Ataque Original do Dragão" className={campo} value={ataqueId} onChange={(e) => { setAtaqueId(e.target.value); setAlvoId(""); setAlcance(false); setInimigo(false); }}>
      <option value="">Selecione o Ataque</option>{ataques.map((r) => <option key={r.ataqueId} value={r.ataqueId}>{alvos.find((a) => a.id === r.ataque.alvo.id)?.nome ?? "Alvo"}: {r.detalhe}</option>)}
    </select>
    <select aria-label="Inimigo Próximo do Alvo do Dragão" className={campo} value={alvoId} onChange={(e) => { setAlvoId(e.target.value); setAlcance(false); setInimigo(false); setDesempates({}); }}>
      <option value="">Selecione o Inimigo</option>{alvos.filter((a) => a.id !== ataque?.ataque.alvo.id && a.id !== voceId).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
    </select>
    <label><input type="checkbox" checked={alcance} onChange={(e) => setAlcance(e.target.checked)} />Em 1,5m do Alvo Original</label>
    <label><input type="checkbox" checked={inimigo} onChange={(e) => setInimigo(e.target.checked)} />Inimigo</label>
    <select aria-label="Modo da Fortitude do Dragão" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select>
    {(alvos.find((a) => a.id === alvoId)?.conflitosDano ?? []).filter((c) => ataque?.calculos?.some((g) => g.tipoDano === c.tipo && g.final >= 2)).map((c) =>
      <select key={c.tipo} aria-label={`Desempate do Dragão: ${c.label}`} className={campo} value={desempates[c.tipo] ?? ""} onChange={(e) => setDesempates((d) => ({ ...d, [c.tipo]: e.target.value }))}>
        <option value="">Desempate: {c.label}</option><option value="imune">Imunidade</option><option value="resistente">Resistência</option><option value="vulneravel">Vulnerabilidade</option><option value="nenhum">Nenhum</option>
      </select>)}
    {ataque && valor != null && <NumeroComFontes valor={valor} partes={[{ label: "Dano Recebido pelo Alvo Original", valor: ataque.calculos.reduce((s, c) => s + c.final, 0) }, { label: "Postura do Dragão", texto: "Metade" }]} total={valor} />}
    <button type="button" className={botao} disabled={!ataque || !alvoId || !alcance || !inimigo || !onOperacaoAlvo || !!pendente} onClick={() => {
      const p = pedido(), entrada = { ataqueId, alvoId, voceId, turnoEmCurso, em1_5mDoAlvo: alcance, inimigo, modoAlvo: modo };
      const r = onOperacaoAlvo(alvoId, (s, d, sa, da) => rolaDragaoConteudo(s, d, sa, da, entrada, p)); setErro(r?.erro ?? null);
    }}>Rolar Fortitude do Dragão</button>
    <button type="button" className={botao} disabled={!pendente || !!resolvido || !onOperacaoAlvo || !!janela}
      onClick={() => concluir(pedido())}>Concluir Dragão</button>
    </div>
    {janela && pendente && !resolvido && <EscolhaDeReacao key={janela.chave} janela={janela} nomeAlvo={alvos.find((a) => a.id === alvoId)?.nome}
      onResponder={concluir} onCancelar={() => setJanela(null)} />}
    <Erro erro={erro} />
  </div>;
}

function CortesDoItem({ sessao, alvos = [], onOperacaoAlvo, voceId, turnoEmCurso }) {
  const [ataqueId, setAtaqueId] = useState(""), [erro, setErro] = useState(null);
  const acertos = (sessao.log ?? []).filter((r) => r.rotulo === "Ataque Confirmado" && r.ataque?.acertou && r.calculos?.some((c) => c.tipoDano === "ct" && c.final > 0));
  const acerto = acertos.find((r) => r.ataqueId === ataqueId), alvoId = acerto?.ataque.alvo?.id;
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Ataque Cortante Confirmado" className={campo} value={ataqueId} onChange={(e) => setAtaqueId(e.target.value)}><option value="">Selecione o Acerto</option>{acertos.map((r) => <option key={r.id} value={r.ataqueId}>{alvos.find((a) => a.id === r.ataque.alvo?.id)?.nome ?? "Alvo"}: {r.detalhe}</option>)}</select>
    <button type="button" className={botao} disabled={!alvoId || !onOperacaoAlvo || !voceId || !turnoEmCurso} onClick={() => {
      const p = pedido(), entrada = { ataqueId, alvoId, voceId, turnoEmCurso };
      const r = onOperacaoAlvo(alvoId, (s, d, sa, da) => aplicaCorteConteudo(s, d, sa, da, entrada, p)); setErro(r?.erro ?? null);
    }}>Reduzir Movimento</button><Erro erro={erro} />
  </div>;
}

function AuraRedirecionadoraDoItem({ sessao, derived, onSessao, onRolar, alvos = [], turnoEmCurso }) {
  const [indice, setIndice] = useState(""), [alvo, setAlvo] = useState(""), [modo, setModo] = useState("normal"),
    [descontarPE, setDescontarPE] = useState(false), [falhaId, setFalhaId] = useState(""), [segundoAlvo, setSegundoAlvo] = useState(""),
    [alcance, setAlcance] = useState(false), [manual, setManual] = useState(0), [erro, setErro] = useState(null);
  const armas = armasParaAuraRedirecionadora(derived), falhas = falhasParaAuraRedirecionadora(sessao);
  const primeiroAlvo = sessao.log?.find((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === falhaId)?.ataque?.alvo?.id;
  const dano = danoDoRedirecionamentoAura(sessao, derived);
  return <div className="mt-2 space-y-2 text-xs">
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Arma da Aura Redirecionadora" className={campo} value={indice} onChange={(e) => setIndice(e.target.value)}><option value="">Selecione a Arma</option>{armas.map((l, i) => <option key={`${l.chaveArma ?? l.id}:${i}`} value={i}>{l.nome}</option>)}</select>
      {alvos.length > 0 && <Alvo alvos={alvos} valor={alvo} onValor={setAlvo} rotulo="Primeiro Alvo da Aura" />}
      <select aria-label="Modo do Ataque da Aura" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select>
      <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
      <button type="button" className={botao} disabled={indice === "" || !onRolar || (alvos.length > 0 && !alvo)} onClick={() => {
        const linha = armas[Number(indice)];
        const r = preparaAuraRedirecionadora(sessao, derived, { armaId: linha.id, chaveArma: linha.chaveArma, alvoId: alvo, modo, descontarPE }, pedido());
        setErro(r.erro ?? null); if (!r.aplicado) return; setManual(r.custo.pe.naoDescontado);
        onSessao(() => r.sessao); if (!onRolar(r.pedidoRolagem, r.sessao)) { onSessao(() => sessao); setManual(0); setErro("Ataque Indisponível"); }
      }}>Imbuir e Atacar</button>
      {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Primeira Falha da Aura" className={campo} value={falhaId} onChange={(e) => { setFalhaId(e.target.value); setSegundoAlvo(""); }}><option value="">Selecione a Falha</option>{falhas.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
      <Alvo alvos={alvos.filter((a) => a.id !== primeiroAlvo)} valor={segundoAlvo} onValor={(v) => { setSegundoAlvo(v); setAlcance(false); }} rotulo="Segundo Alvo da Aura" />
      <label><input type="checkbox" checked={alcance} onChange={(e) => setAlcance(e.target.checked)} />Segundo Alvo em 6m do Primeiro</label>
      <button type="button" className={botao} disabled={!falhaId || !segundoAlvo || !alcance} onClick={() => {
        const r = rolaRedirecionamentoAura(sessao, derived, { ataqueId: falhaId, alvoId: segundoAlvo, em6mDoPrimeiro: alcance, turnoEmCurso }, pedido());
        setErro(r.erro ?? null); if (r.aplicado) { onSessao(() => r.sessao); setFalhaId(""); }
      }}>Redirecionar Projétil</button>
      {dano && <button type="button" className={botao} disabled={!onRolar} onClick={() => setErro(onRolar(dano) ? null : "Dano Indisponível")}>Rolar Dano Redirecionado</button>}
    </div><Erro erro={erro} />
  </div>;
}

function IncitarVigorDoItem({ derived, sessao, onSessao, alvos = [], onOperacaoAlvo }) {
  const [alvo, setAlvo] = useState(""), [classeId, setClasseId] = useState(""), [quantidade, setQuantidade] = useState(1),
    [toque, setToque] = useState(false), [descontarPE, setDescontarPE] = useState(false), [manual, setManual] = useState(0), [erro, setErro] = useState(null);
  const resumo = alvo ? alvos.find((a) => a.id === alvo)?.dadosVida : dadosVidaDoConteudo(sessao, derived);
  const pilha = resumo?.pilha ?? [], linha = pilha.find((l) => l.id === classeId);
  const fixo = quantidade * (resumo?.modCon ?? 0);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {onOperacaoAlvo && <select aria-label="Destinatário de Incitar Vigor" className={campo} value={alvo} onChange={(e) => { setAlvo(e.target.value); setClasseId(""); }}>
      <option value="">Você</option>{alvos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
    </select>}
    <select aria-label="Pilha de Dados de Vida" className={campo} value={classeId} onChange={(e) => setClasseId(e.target.value)}>
      <option value="">Selecione os Dados</option>{pilha.map((l) => <option key={l.id} value={l.id} disabled={l.restantes === 0}>{l.nome}: {l.restantes}/{l.total}d{l.faces}</option>)}
    </select>
    <label>Dados <input aria-label="Quantidade de Dados de Vida" className={`${campo} w-16`} type="number" min="1" max={linha?.restantes ?? 0} step="1" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} /></label>
    {alvo && <label><input type="checkbox" checked={toque} onChange={(e) => setToque(e.target.checked)} />Destinatário em Toque</label>}
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    {linha && <NumeroComFontes valor={`${quantidade}d${linha.faces} ${fixo < 0 ? "-" : "+"} ${Math.abs(fixo)}`} formatar={false}
      partes={[{ label: linha.nome, texto: `${quantidade}d${linha.faces}` }, { label: "Constituição do Destinatário", texto: `${resumo?.modCon ?? 0} por Dado` }]} total="Dados de Vida" />}
    <button type="button" className={botao} disabled={!linha || linha.restantes < quantidade || quantidade < 1 || (!!alvo && (!toque || !onOperacaoAlvo))} onClick={() => {
      const entrada = { classeId, quantidade, emToque: !alvo || toque, descontarPE, alvoId: alvo || null }, p = pedido();
      const r = alvo ? onOperacaoAlvo(alvo, (s, d, sa, da) => usaIncitarVigor(s, d, entrada, p, { sessao: sa, derived: da })) : usaIncitarVigor(sessao, derived, entrada, p);
      setErro(r?.erro ?? null); if (r?.aplicado) { setManual(r.custo.pe.naoDescontado); if (!alvo) onSessao(() => r.sessao); }
    }}>Gastar Dados de Vida</button>
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}<Erro erro={erro} />
  </div>;
}

function IntervencaoDoItem({ alvos = [], onOperacaoAlvo }) {
  const [alvo, setAlvo] = useState(""), [condicaoId, setCondicaoId] = useState(""), [toque, setToque] = useState(false),
    [descontarPE, setDescontarPE] = useState(false), [manual, setManual] = useState(0), [erro, setErro] = useState(null);
  const condicoes = alvos.find((a) => a.id === alvo)?.condicoes ?? [], condicao = condicoes.find((c) => c.id === condicaoId);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <Alvo alvos={alvos} valor={alvo} onValor={(v) => { setAlvo(v); setCondicaoId(""); }} rotulo="Aliado da Intervenção" />
    <select aria-label="Condição da Intervenção" className={campo} value={condicaoId} onChange={(e) => setCondicaoId(e.target.value)}>
      <option value="">Selecione a Condição</option>{condicoes.filter((c) => c.nivel > 0 && c.nome !== "Desmembramento").map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.forcaLabel})</option>)}
    </select>
    <label><input type="checkbox" checked={toque} onChange={(e) => setToque(e.target.checked)} />Aliado em Alcance de Toque</label>
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    {condicao && <NumeroComFontes valor={`${3 * condicao.nivel} PE`} formatar={false} partes={[{ label: "Intervenção", texto: condicao.forcaLabel }]} total={`${3 * condicao.nivel} PE`} />}
    <button type="button" className={botao} disabled={!onOperacaoAlvo || !alvo || !condicao || !toque} onClick={() => {
      const p = pedido(), entrada = { alvoId: alvo, condicaoId, aliadoEmToque: toque, descontarPE };
      const r = onOperacaoAlvo(alvo, (s, d, sa, da) => usaIntervencaoConteudo(s, d, sa, da, entrada, p));
      setErro(r?.erro ?? null); if (r?.aplicado) { setManual(r.custo.pe.naoDescontado); setCondicaoId(""); }
    }}>Encerrar Condição</button>
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    <Erro erro={erro} />
  </div>;
}

function AnaliseDoItem({ derived, sessao, onSessao, alvos = [], onOperacaoAlvo }) {
  const [alvo, setAlvo] = useState(""), [testeId, setTesteId] = useState(""), [modo, setModo] = useState("normal"),
    [descontarPE, setDescontarPE] = useState(false), [manual, setManual] = useState(0), [erro, setErro] = useState(null);
  const testes = (sessao.log ?? []).filter((r) => r.contextoConteudo?.tipo === "analiseProfunda" && !testeComConsequencias(r));
  const resultado = sessao.log?.find((r) => r.rotulo === "Análise Profunda" && r.alvoId === alvo && r.quantidade != null);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <Alvo alvos={alvos} valor={alvo} onValor={setAlvo} rotulo="Alvo da Análise Profunda" />
    <select aria-label="Modo da Análise Profunda" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select>
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    <button type="button" className={botao} disabled={!alvo || !onOperacaoAlvo} onClick={() => {
      const p = pedido(), entrada = { alvoId: alvo, modo, descontarPE };
      const r = onOperacaoAlvo(alvo, (s, d, sa, da) => usaAnaliseProfunda(s, d, sa, da, entrada, p));
      setErro(r?.erro ?? null); if (r?.aplicado) { setManual(r.custo.pe.naoDescontado); setTesteId(r.rolagem.id); }
    }}>Analisar</button>
    <select aria-label="Teste da Análise Profunda" className={campo} value={testeId} onChange={(e) => {
      setTesteId(e.target.value); const r = testes.find((r) => r.id === e.target.value); if (r) setAlvo(r.contextoConteudo.alvoId);
    }}><option value="">Selecione a Análise</option>{testes.map((r) => <option key={r.id} value={r.id}>{alvos.find((a) => a.id === r.contextoConteudo.alvoId)?.nome ?? r.rotulo}: {r.total}</option>)}</select>
    <button type="button" className={botao} disabled={!testes.some((r) => r.id === testeId)} onClick={() => {
      const r = concluiAnaliseProfunda(sessao, derived, { id: testeId }, pedido()); setErro(r.erro ?? null); if (r.aplicado) { onSessao(() => r.sessao); setTesteId(""); }
    }}>Concluir Análise</button>
    {resultado && <span>Características: <NumeroComFontes valor={resultado.quantidade} formatar={false} partes={resultado.fontes} total={resultado.quantidade} /></span>}
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    <Erro erro={erro} />
  </div>;
}

function MobilidadeDoItem({ derived, sessao, alvos = [], onOperacaoAlvo }) {
  const [alvo, setAlvo] = useState(""), [quedaId, setQuedaId] = useState(""), [direcao, setDirecao] = useState(false), [erro, setErro] = useState(null);
  const quedas = (alvos.find((a) => a.id === alvo)?.rolagens ?? []).filter((r) => r.abateu && r.estadoVitalAlvo === "morrendo" && r.rodada === sessao.rodada);
  const fontes = [...(derived.partes?.movimento ?? []), { label: "Mobilidade Avançada", texto: "Metade" }];
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <Alvo alvos={alvos} valor={alvo} onValor={(v) => { setAlvo(v); setQuedaId(""); }} rotulo="Aliado da Mobilidade Avançada" />
    <select aria-label="Queda do Aliado" className={campo} value={quedaId} onChange={(e) => setQuedaId(e.target.value)}><option value="">Selecione a Queda</option>{quedas.map((r) => <option key={r.id} value={r.id}>{r.detalhe}</option>)}</select>
    <label><input type="checkbox" checked={direcao} onChange={(e) => setDirecao(e.target.checked)} />Em Direção ao Aliado</label>
    <NumeroComFontes valor={`${derived.movimento / 2}m`} formatar={false} partes={fontes} total={`${derived.movimento / 2}m`} />
    <button type="button" className={botao} disabled={!onOperacaoAlvo || !alvo || !quedaId || !direcao} onClick={() => {
      const p = pedido(), entrada = { alvoId: alvo, quedaId, aliadoEmDirecao: direcao };
      const r = onOperacaoAlvo(alvo, (s, d, sa, da) => usaMobilidadeAvancada(s, d, sa, da, entrada, p)); setErro(r?.erro ?? null);
    }}>Usar Reação de Movimento</button>
    <Erro erro={erro} />
  </div>;
}

function SorteDoItem({ derived, sessao, onSessao }) {
  const [id, setId] = useState(""), [erro, setErro] = useState(null);
  const rolagens = (sessao.log ?? []).filter((r) => r.tipo === "teste");
  const atual = rolagens.find((r) => r.id === id);
  const executar = (fn, entrada) => { const r = fn(sessao, derived, entrada, pedido()); setErro(r.erro ?? null); if (r.aplicado) onSessao(() => r.sessao); };
  return <div className="mt-2 flex flex-wrap items-center gap-2">
    <select aria-label="Rolagem de Sorte" className={campo} value={id} onChange={(e) => setId(e.target.value)}><option value="">Selecione a Rolagem</option>
      {rolagens.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}
    </select>
    <button type="button" className={botao} disabled={!atual || !!atual.sorte} onClick={() => executar(rolaSorte, { id })}>Gastar Sorte</button>
    {atual?.sorte && atual.sorte.escolha == null && <>
      <button type="button" className={botao} onClick={() => executar(escolheSorte, { id, escolha: "original" })}>Original: {atual.sorte.original.natural}</button>
      <button type="button" className={botao} onClick={() => executar(escolheSorte, { id, escolha: "novo" })}>Novo: {atual.sorte.d20}</button>
    </>}
    <Erro erro={erro} />
  </div>;
}

function PosturasDoItem({ item, derived, sessao, onSessao }) {
  const [postura, setPostura] = useState(""), [segunda, setSegunda] = useState(""), [erro, setErro] = useState(null);
  const fonte = posturasPropriasConteudo(derived, item.id);
  if (!fonte) return null;
  const restante = Math.max(0, fonte.usos.max - usosGastosDe(sessao, fonte.usos.chave));
  const ativo = sessao.uso?.ativos?.cmb_assumir_postura;
  const emPostura = !!ativo || !!sessao.combate.postura || !!sessao.combate.postura2;
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <NumeroComFontes valor={`${restante}/${fonte.usos.max}`} formatar={false} partes={fonte.partes} total={fonte.usos.max} />
    <NumeroComFontes valor={fonte.acao === "livre" ? "Ação Livre" : "Ação Bônus"} formatar={false} partes={fonte.acaoPartes} total={fonte.acao === "livre" ? "Ação Livre" : "Ação Bônus"} />
    <select aria-label="Postura para Assumir" className={campo} value={postura} onChange={(e) => { setPostura(e.target.value); if (segunda === e.target.value) setSegunda(""); }}><option value="">Selecione a Postura</option>{fonte.opcoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>
    {fonte.mestre && <select aria-label="Segunda Postura para Assumir" className={campo} value={segunda} onChange={(e) => setSegunda(e.target.value)}><option value="">Sem Segunda Postura</option>{fonte.opcoes.filter((o) => o.id !== postura).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select>}
    <button type="button" className={botao} disabled={!postura || !restante} onClick={() => {
      const r = assumePosturaConteudo(sessao, derived, { habilidadeId: fonte.id, postura, postura2: fonte.mestre ? segunda : null }, pedido());
      setErro(r.erro ?? null); if (r.aplicado) onSessao(() => r.sessao);
    }}>{emPostura ? "Trocar Postura" : "Entrar em Postura"}</button>
    {ativo && <button type="button" className={botao} onClick={() => {
      const r = encerraUso(sessao, derived, ativo.id, pedido()); setErro(r.erro ?? null); if (r.aplicado) onSessao(() => r.sessao);
    }}>Encerrar Postura</button>}
    {ativo?.duracao.tipo === "rodadas" && <NumeroComFontes valor={`${ativo.duracao.restantes} Rodadas`} formatar={false} partes={[{ label: fonte.nome, valor: 10 }, { label: "Rodadas Transcorridas", valor: ativo.duracao.restantes - 10 }]} total={ativo.duracao.restantes} />}
    <Erro erro={erro} />
  </div>;
}

function FortunaDoItem({ derived, sessao, onSessao }) {
  const [id, setId] = useState(""), [indice, setIndice] = useState(""), [erro, setErro] = useState(null);
  const fonte = derived.conteudoPosturaFortuna;
  const testes = (sessao.log ?? []).filter((r) => r.tipo === "teste" && (r.id === id || dadosDisponiveisFortuna(sessao, derived, r).length));
  const atual = testes.find((r) => r.id === id), dados = dadosDisponiveisFortuna(sessao, derived, atual);
  const restantes = Math.max(0, fonte.max - usosGastosDe(sessao, `rodada:uso:${fonte.id}`));
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <span>{fonte.nome}</span><NumeroComFontes valor={`${restantes}/${fonte.max}`} formatar={false} partes={fonte.partes} total={`${restantes}/${fonte.max}`} />
    <select aria-label="Teste de Fortuna" className={campo} value={id} onChange={(e) => { setId(e.target.value); setIndice(""); }}>
      <option value="">Selecione o Teste</option>{testes.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}
    </select>
    <select aria-label="Dado de Fortuna" className={campo} value={indice} onChange={(e) => setIndice(e.target.value)}>
      <option value="">Selecione o D20</option>{dados.map((d) => <option key={d.indice} value={d.indice}>D20 {d.indice + 1}: {d.valor}</option>)}
    </select>
    <button type="button" className={botao} disabled={!restantes || indice === "" || !dados.some((d) => d.indice === Number(indice))} onClick={() => {
      const r = rerrolaFortuna(sessao, derived, { id, indice: Number(indice) }, pedido());
      setErro(r.erro ?? null); if (r.aplicado) { onSessao(() => r.sessao); setIndice(""); }
    }}>Rerrolar D20</button>
    {atual?.fortuna?.length > 0 && <NumeroComFontes valor={atual.total} partes={atual.fontes} total={atual.total} />}
    <Erro erro={erro} />
  </div>;
}

function RerrolagemDoItem({ id: talento, derived, sessao, onSessao }) {
  const [id, setId] = useState(""), [confirmado, setConfirmado] = useState(false), [erro, setErro] = useState(null);
  const iniciativa = talento === "tal_tecnicas_de_reacao_rapida", perf = talento === "tal_especialista_em_perfuracao";
  const lista = (sessao.log ?? []).filter((r) => iniciativa ? r.tipo === "teste" && r.rotulo === "Iniciativa" : danoDeAtaqueParaRerrolar(sessao, derived, r, perf));
  return <div className="mt-2 flex flex-wrap items-center gap-2">
    <select aria-label="Rolagem para Repetir" className={campo} value={id} onChange={(e) => setId(e.target.value)}><option value="">Selecione a Rolagem</option>{lista.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
    {(iniciativa || perf) && <label className="text-xs"><input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />{iniciativa ? "Não Foi o Primeiro" : "Acertou"}</label>}
    <button type="button" className={botao} disabled={!lista.some((r) => r.id === id)} onClick={() => {
      const r = (iniciativa ? rerrolaIniciativa : rerrolaDanoTalento)(sessao, derived, { id, talento, naoPrimeiro: confirmado, acertou: confirmado }, pedido());
      setErro(r.erro ?? null); if (r.aplicado) onSessao(() => r.sessao);
    }}>Rolar Novamente</button>
    <Erro erro={erro} />
  </div>;
}

function DeslocamentoDoItem({ id, sessao, alvos = [], onOperacaoAlvo }) {
  const [ataqueId, setAtaqueId] = useState(""), [alvo, setAlvo] = useState(""), [distancia, setDistancia] = useState(3),
    [espacoDesocupado, setEspacoDesocupado] = useState(false), [erro, setErro] = useState(null);
  const ataques = (sessao.log ?? []).filter((r) => r.rotulo === "Ataque Confirmado" && r.ataque?.acertou);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Acerto para Deslocar" className={campo} value={ataqueId} onChange={(e) => setAtaqueId(e.target.value)}><option value="">Selecione o Acerto</option>{ataques.map((r) => <option key={r.id} value={r.ataqueId}>{r.detalhe}</option>)}</select>
    <Alvo alvos={alvos} valor={alvo} onValor={setAlvo} rotulo="Alvo do Deslocamento" />
    <label>Metros <input aria-label="Distância do Deslocamento" className={`${campo} w-16`} type="number" min="0" max="3" step="0.5" value={distancia} onChange={(e) => setDistancia(Number(e.target.value))} /></label>
    {id === "tal_especialista_em_concussao" && <label><input type="checkbox" checked={espacoDesocupado} onChange={(e) => setEspacoDesocupado(e.target.checked)} />Espaço Desocupado</label>}
    <button type="button" className={botao} disabled={!onOperacaoAlvo || !alvo || !ataqueId} onClick={() => {
      const p = pedido();
      const r = onOperacaoAlvo(alvo, (s, d, sa, da) => deslocaAlvoTalento(s, d, sa, da, { talento: id, ataqueId, alvoId: alvo, distancia, espacoDesocupado }, p));
      setErro(r?.erro ?? null);
    }}>{id === "tal_mestre_dos_chicotes" ? "Puxar Alvo" : "Mover Alvo"}</button>
    <Erro erro={erro} />
  </div>;
}

function AcrobaciaDoItem({ derived, sessao, onSessao }) {
  const [origem, setOrigem] = useState("atletismo"), [dificuldade, setDificuldade] = useState(""), [erro, setErro] = useState(null);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Origem da Queda" className={campo} value={origem} onChange={(e) => setOrigem(e.target.value)}><option value="atletismo">Atletismo do Oponente</option><option value="tecnica">CD da Técnica</option></select>
    <label>{origem === "tecnica" ? "CD" : "Total do Oponente"} <input aria-label="Dificuldade para Levantar" className={`${campo} w-20`} type="number" value={dificuldade} onChange={(e) => setDificuldade(e.target.value)} /></label>
    <button type="button" className={botao} disabled={dificuldade === ""} onClick={() => {
      const r = usaMovimentosAcrobaticos(sessao, derived, { origem, dificuldade }, pedido());
      setErro(r.erro ?? null); if (r.aplicado) onSessao(() => r.sessao);
    }}>Testar para Levantar</button>
    <Erro erro={erro} />
  </div>;
}

function OportunidadeDoItem({ derived, sessao, onSessao, onRolar, alvos = [], fonte = "perceber", onOperacaoAlvo, voceId }) {
  const [indice, setIndice] = useState(""), [gatilho, setGatilho] = useState(false), [modo, setModo] = useState("normal"), [erro, setErro] = useState(null), [alvoId, setAlvoId] = useState("");
  const armas = derived.dano.entradas.filter((l) => ["basico", "arma", "escudo"].includes(l.fonte));
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {alvos.length > 0 && <Alvo alvos={alvos} valor={alvoId} onValor={setAlvoId} rotulo="Alvo do Golpe de Oportunidade" />}
    <select aria-label="Arma do Golpe de Oportunidade" className={campo} value={indice} onChange={(e) => setIndice(e.target.value)}><option value="">Selecione a Arma</option>{armas.map((l, i) => <option key={`${l.chaveArma ?? l.id}:${i}`} value={i}>{l.nome}</option>)}</select>
    <select aria-label="Modo do Golpe de Oportunidade" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="normal">Normal</option><option value="desvantagem">Desvantagem</option></select>
    <label><input type="checkbox" checked={gatilho} onChange={(e) => setGatilho(e.target.checked)} />Gatilho de Oportunidade</label>
    <button type="button" className={botao} disabled={indice === "" || !gatilho || !onRolar || (alvos.length > 0 && !alvoId)} onClick={() => {
      const linha = armas[Number(indice)];
      const entrada = { fonte, voceId, alvoId: alvoId || null, armaId: linha.id, chaveArma: linha.chaveArma, modo, gatilhoValido: gatilho }, p = pedido();
      const externo = alvoId && onOperacaoAlvo;
      const r = externo ? onOperacaoAlvo(alvoId, (s, d, sa, da) => preparaOportunidadeConteudo(s, d, entrada, p, { sessao: sa, derived: da }))
        : preparaOportunidadeConteudo(sessao, derived, entrada, p);
      setErro(r.erro ?? null); if (!r.aplicado) return;
      if (!externo) onSessao(() => r.sessao);
      if (!onRolar(r.pedidoRolagem, r.sessao)) { onSessao(() => sessao); setErro("Ataque Indisponível"); }
    }}>Rolar Golpe de Oportunidade</button>
    <Erro erro={erro} />
  </div>;
}

function SentinelaDoItem(props) {
  const { derived, sessao, onSessao, onRolar, alvos = [], onOperacaoAlvo, voceId } = props;
  const [atacanteId, setAtacanteId] = useState(""), [ataqueId, setAtaqueId] = useState(""), [indice, setIndice] = useState(""),
    [gatilho, setGatilho] = useState(false), [modo, setModo] = useState("normal"), [erro, setErro] = useState(null);
  const armas = derived.dano.entradas.filter((l) => ["basico", "arma", "escudo"].includes(l.fonte));
  const ataques = (alvos.find((a) => a.id === atacanteId)?.rolagens ?? []).filter((r) => r.rotulo === "Ataque Confirmado" && r.ataque?.alvo?.id && r.ataque.alvo.id !== voceId);
  return <>
    <OportunidadeDoItem {...props} fonte="sentinela" />
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <Alvo alvos={alvos} valor={atacanteId} onValor={(v) => { setAtacanteId(v); setAtaqueId(""); }} rotulo="Atacante do Gatilho de Sentinela" />
      <select aria-label="Ataque contra Outra Criatura" className={campo} value={ataqueId} onChange={(e) => setAtaqueId(e.target.value)}>
        <option value="">Selecione o Ataque</option>{ataques.map((r) => <option key={r.id} value={r.ataqueId}>{r.detalhe}</option>)}
      </select>
      <select aria-label="Arma da Reação de Sentinela" className={campo} value={indice} onChange={(e) => setIndice(e.target.value)}>
        <option value="">Selecione a Arma</option>{armas.map((l, i) => <option key={`${l.chaveArma ?? l.id}:${i}`} value={i}>{l.nome}</option>)}
      </select>
      <select aria-label="Modo da Reação de Sentinela" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}>
        <option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option>
      </select>
      <label><input type="checkbox" checked={gatilho} onChange={(e) => setGatilho(e.target.checked)} />Atacante a Até 1,5m e Gatilho Atual</label>
      <button type="button" className={botao} disabled={!voceId || !atacanteId || !ataqueId || indice === "" || !gatilho || !onOperacaoAlvo || !onRolar} onClick={() => {
        const linha = armas[Number(indice)], p = pedido();
        const entrada = { voceId, atacanteId, ataqueId, armaId: linha.id, chaveArma: linha.chaveArma, modo, emAlcanceEGatilhoAtual: gatilho };
        const r = onOperacaoAlvo(atacanteId, (s, d, sa, da) => preparaReacaoSentinela(s, d, sa, da, entrada, p));
        setErro(r?.erro ?? null); if (!r?.aplicado) return;
        if (!onRolar(r.pedidoRolagem, r.sessao)) { onSessao(() => sessao); setErro("Ataque Indisponível"); }
      }}>Rolar Reação de Sentinela</button>
      <Erro erro={erro} />
    </div>
  </>;
}

function TecnicasMobilidadeDoItem({ sessao, alvos = [], onOperacaoAlvo, turnoEmCurso }) {
  const [ataqueId, setAtaqueId] = useState(""), [modoAtacante, setModoAtacante] = useState("normal"),
    [modoAlvo, setModoAlvo] = useState("normal"), [erro, setErro] = useState(null);
  const ataques = (sessao.log ?? []).filter((r) => r.rotulo === "Ataque Confirmado" && r.turnoEmCurso
    && r.turnoEmCurso.id === turnoEmCurso?.id && r.turnoEmCurso.turno === turnoEmCurso?.turno && r.turnoEmCurso.rodada === turnoEmCurso?.rodada
    && sessao.log.some((t) => t.id === r.ataqueId && t.tipoTeste === "ataque"));
  const ataque = ataques.find((r) => r.ataqueId === ataqueId), alvoId = ataque?.ataque?.alvo?.id;
  const resultado = sessao.log?.find((r) => r.rotulo === "Técnicas de Mobilidade" && r.ataqueId === ataqueId);
  const ativa = sessao.uso?.ativos?.[`tal_tecnicas_de_mobilidade:${alvoId}`];
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Ataque de Técnicas de Mobilidade" className={campo} value={ataqueId} onChange={(e) => setAtaqueId(e.target.value)}>
      <option value="">Selecione o Ataque</option>{ataques.map((r) => <option key={r.id} value={r.ataqueId}>{r.detalhe} ({alvos.find((a) => a.id === r.ataque?.alvo?.id)?.nome ?? r.ataque?.alvo?.id})</option>)}
    </select>
    {[{ rotulo: "Seus Reflexos de Mobilidade", valor: modoAtacante, mudar: setModoAtacante }, { rotulo: "Reflexos do Alvo de Mobilidade", valor: modoAlvo, mudar: setModoAlvo }].map(({ rotulo, valor, mudar }) =>
      <label key={rotulo}>{rotulo} <select aria-label={rotulo} className={campo} value={valor} onChange={(e) => mudar(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select></label>)}
    {[{ nome: "Rolar Disputa de Mobilidade", fn: rolaDisputaMobilidade }, { nome: "Aplicar Mobilidade", fn: aplicaDisputaMobilidade }].map(({ nome, fn }) =>
      <button key={nome} type="button" className={botao} disabled={!ataque || !alvoId || !onOperacaoAlvo || !turnoEmCurso || !!resultado} onClick={() => {
        const entrada = { ataqueId, alvoId, turnoEmCurso, modoAtacante, modoAlvo }, p = pedido();
        const r = onOperacaoAlvo(alvoId, (s, d, sa, da) => fn(s, d, sa, da, entrada, p)); setErro(r?.erro ?? null);
      }}>{nome}</button>)}
    {resultado && <NumeroComFontes valor={resultado.resistiu ? "Alvo Resistiu" : ativa ? resultado.detalhe : "Proteção Encerrada"} formatar={false} partes={resultado.fontes} total={resultado.detalhe} />}
    <Erro erro={erro} />
  </div>;
}

function EscudoDoItem({ derived, sessao, alvos = [], onOperacaoAlvo, onRolar, emSeuTurno = false }) {
  const [ataqueId, setAtaqueId] = useState(""), [alvoId, setAlvoId] = useState(""), [periciaAlvo, setPericiaAlvo] = useState("atletismo"),
    [escolha, setEscolha] = useState("caido"), [alcance, setAlcance] = useState(false), [inimigo, setInimigo] = useState(true),
    [modoAtacante, setModoAtacante] = useState("normal"), [modoAlvo, setModoAlvo] = useState("normal"), [desempate, setDesempate] = useState(""), [danoId, setDanoId] = useState(""), [erro, setErro] = useState(null);
  const ataques = (sessao.log ?? []).filter((r) => r.tipoTeste === "ataque" && r.contextoTurno?.rodada === sessao.rodada && r.contextoTurno.turno === (sessao.uso?.acoes?.turno ?? 0));
  const resultado = sessao.log?.find((r) => r.rotulo === "Técnicas Agressivas de Escudo" && r.ataqueId === ataqueId);
  const disputa = sessao.log?.find((r) => r.contextoConteudo?.tipo === "manobraEscudo" && r.contextoConteudo.ataqueId === ataqueId && r.contextoConteudo.alvoId === alvoId && r.contextoConteudo.papel === "Atacante");
  const opositor = alvos.find((a) => a.id === alvoId)?.rolagens?.find((r) => r.contextoConteudo?.tipo === "manobraEscudo" && r.contextoConteudo.disputaId === disputa?.contextoConteudo.disputaId && r.contextoConteudo.papel === "Alvo");
  const danoDisponivel = disputa && opositor && disputa.total > opositor.total && disputa.sorte?.escolha !== null && opositor.sorte?.escolha !== null && !testeComConsequencias(disputa) && !testeComConsequencias(opositor);
  const dados = (sessao.log ?? []).filter((r) => r.tipo === "dano" && r.armaId === "tal_tecnicas_ofensivas_de_escudo" && !r.critico && !r.raioNegro && r.ts >= (disputa?.ts ?? Infinity) && !testeComConsequencias(r));
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Ataque do Gatilho de Escudo" className={campo} value={ataqueId} onChange={(e) => setAtaqueId(e.target.value)}>
      <option value="">Selecione o Ataque deste Turno</option>{ataques.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}
    </select>
    <Alvo alvos={alvos} valor={alvoId} onValor={(v) => { setAlvoId(v); setDesempate(""); }} rotulo="Alvo do Empurrão de Escudo" />
    <select aria-label="Resistência ao Escudo" className={campo} value={periciaAlvo} onChange={(e) => setPericiaAlvo(e.target.value)}><option value="atletismo">Atletismo do Alvo</option><option value="acrobacia">Acrobacia do Alvo</option></select>
    <select aria-label="Benefício do Empurrão de Escudo" className={campo} value={escolha} onChange={(e) => setEscolha(e.target.value)}><option value="caido">Derrubar</option><option value="distancia">Distância +4,5m</option></select>
    {[{ rotulo: "Seu Teste de Escudo", valor: modoAtacante, mudar: setModoAtacante }, { rotulo: "Teste do Alvo do Escudo", valor: modoAlvo, mudar: setModoAlvo }].map(({ rotulo, valor, mudar }) =>
      <label key={rotulo}>{rotulo} <select aria-label={rotulo} className={campo} value={valor} onChange={(e) => mudar(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select></label>)}
    <label><input type="checkbox" checked={alcance} onChange={(e) => setAlcance(e.target.checked)} />Alvo no Alcance do Escudo</label>
    <label><input type="checkbox" checked={inimigo} onChange={(e) => setInimigo(e.target.checked)} />Alvo Inimigo</label>
    <select aria-label="Dano Rolado do Escudo" className={campo} value={danoId} onChange={(e) => setDanoId(e.target.value)}><option value="">Rolar ao Aplicar</option>{dados.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
    <button type="button" className={botao} disabled={!danoDisponivel || !onRolar || !emSeuTurno || !!resultado} onClick={() => {
      const linha = derived.dano.entradas.find((l) => l.id === "tal_tecnicas_ofensivas_de_escudo");
      if (!linha) return;
      const r = onRolar({ tipo: "dano", rotulo: linha.nome, grupos: linha.gruposDano, linhaArma: linha, modoDano: "normal", fontes: linha.partes });
      if (r) setDanoId(r.id); else setErro("Dano do Escudo Indisponível");
    }}>Rolar Dano do Escudo</button>
    {alvos.find((a) => a.id === alvoId)?.conflitoImpacto && <select aria-label="Desempate do Dano do Escudo" className={campo} value={desempate} onChange={(e) => setDesempate(e.target.value)}><option value="">Desempate da Mesa</option><option value="imune">Imunidade</option><option value="resistente">Resistência</option><option value="vulneravel">Vulnerabilidade</option><option value="nenhum">Nenhum</option></select>}
    {[{ nome: "Rolar Empurrão de Escudo", fn: rolaEmpurraoEscudo }, { nome: "Aplicar Empurrão de Escudo", fn: aplicaEmpurraoEscudo }].map(({ nome, fn }) =>
      <button key={nome} type="button" className={botao} disabled={!ataqueId || !alvoId || !alcance || !onOperacaoAlvo || !emSeuTurno} onClick={() => {
        const p = pedido(), entrada = { ataqueId, alvoId, periciaAlvo, escolha, emAlcanceEscudo: alcance, emSeuTurno, inimigo, modoAtacante, modoAlvo, desempate: desempate || null, danoId: danoId || null };
        const r = onOperacaoAlvo(alvoId, (s, d, sa, da) => fn(s, d, sa, da, entrada, p)); setErro(r?.erro ?? null);
      }}>{nome}</button>)}
    {resultado && <NumeroComFontes valor={resultado.detalhe} formatar={false} partes={resultado.fontes} total={resultado.detalhe} />}
    <Erro erro={erro} />
  </div>;
}

function BrigaDoItem({ sessao, alvos = [], onOperacaoAlvo }) {
  const [ataqueId, setAtaqueId] = useState(""), [manobra, setManobra] = useState("derrubar"), [periciaAlvo, setPericiaAlvo] = useState("atletismo"),
    [modoAtacante, setModoAtacante] = useState("normal"), [modoAlvo, setModoAlvo] = useState("normal"), [erro, setErro] = useState(null);
  const acertos = (sessao.log ?? []).filter((r) => r.rotulo === "Ataque Confirmado" && r.ataque?.acertou && r.calculos?.length > 0 && r.calculos.every((c) => c.final === 0));
  const acerto = acertos.find((r) => r.ataqueId === ataqueId), alvoId = acerto?.ataque.alvo?.id;
  const resultado = sessao.log?.find((r) => r.rotulo === "Adepto de Briga" && r.ataqueId === ataqueId && r.manobra);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <select aria-label="Acerto sem Dano de Briga" className={campo} value={ataqueId} onChange={(e) => setAtaqueId(e.target.value)}>
      <option value="">Selecione o Acerto sem Dano</option>{acertos.map((r) => <option key={r.id} value={r.ataqueId}>{r.detalhe} ({alvos.find((a) => a.id === r.ataque.alvo.id)?.nome ?? r.ataque.alvo.id})</option>)}
    </select>
    <select aria-label="Manobra de Briga" className={campo} value={manobra} onChange={(e) => setManobra(e.target.value)}><option value="derrubar">Derrubar</option><option value="empurrar">Empurrar</option></select>
    <select aria-label="Resistência à Briga" className={campo} value={periciaAlvo} onChange={(e) => setPericiaAlvo(e.target.value)}><option value="atletismo">Atletismo do Alvo</option><option value="acrobacia">Acrobacia do Alvo</option></select>
    {[{ rotulo: "Seu Teste de Briga", valor: modoAtacante, mudar: setModoAtacante }, { rotulo: "Teste do Alvo da Briga", valor: modoAlvo, mudar: setModoAlvo }].map(({ rotulo, valor, mudar }) =>
      <label key={rotulo}>{rotulo} <select aria-label={rotulo} className={campo} value={valor} onChange={(e) => mudar(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select></label>)}
    {[{ nome: "Rolar Manobra de Briga", fn: rolaManobraDeBriga }, { nome: "Aplicar Manobra de Briga", fn: aplicaManobraDeBriga }].map(({ nome, fn }) =>
      <button key={nome} type="button" className={botao} disabled={!ataqueId || !alvos.some((a) => a.id === alvoId) || !onOperacaoAlvo} onClick={() => {
        const p = pedido(), entrada = { ataqueId, alvoId, manobra, periciaAlvo, modoAtacante, modoAlvo };
        const r = onOperacaoAlvo(alvoId, (s, d, sa, da) => fn(s, d, sa, da, entrada, p)); setErro(r?.erro ?? null);
      }}>{nome}</button>)}
    {resultado && <NumeroComFontes valor={resultado.detalhe} formatar={false} partes={resultado.fontes} total={resultado.detalhe} />}
    <Erro erro={erro} />
  </div>;
}

function InvestidaDoItem({ derived, sessao, onSessao, onRolar, alvos = [], onOperacaoAlvo, voadora = false }) {
  const [indice, setIndice] = useState(""), [alvo, setAlvo] = useState(""), [distancia, setDistancia] = useState(0), [trajeto, setTrajeto] = useState(false),
    [modo, setModo] = useState("normal"), [ataqueId, setAtaqueId] = useState(""), [seuTeste, setSeuTeste] = useState(""), [testeAlvo, setTesteAlvo] = useState(""), [erro, setErro] = useState(null),
    [descontarPE, setDescontarPE] = useState(false), [manual, setManual] = useState(0);
  const aprimorada = derived.talentos.escolhidas.includes("tal_investida_aprimorada") && !derived.talentos.inacessiveis.includes("tal_investida_aprimorada");
  const armas = derived.dano.entradas.filter((l) => (voadora ? l.fonte === "basico" : ["basico", "arma", "escudo"].includes(l.fonte)) && (l.ataqueId === "corpo" || l.categoria === "corpo"));
  const alcance = distanciaInvestidaConteudo(derived, aprimorada);
  const danoPendente = danoDaInvestidaConteudo(sessao, derived);
  const ataques = (sessao.log ?? []).filter((r) => r.contextoConteudo?.tipo === "investida"
    && sessao.log.some((c) => c.ataqueId === r.id && c.ataque?.acertou));
  const acerto = sessao.log?.find((r) => r.ataqueId === ataqueId && r.ataque?.acertou);
  const disponiveis = (lista = []) => lista.filter((r) => r.tipo === "teste" && (r.periciaId === "atletismo" || r.rotulo === "Atletismo")
    && r.ts >= (acerto?.ts ?? Infinity) && !testeComConsequencias(r) && r.contextoConteudo?.tipo !== "disputaInvestida");
  const testesSeus = disponiveis(sessao.log), testesAlvo = disponiveis(alvos.find((a) => a.id === alvo)?.rolagens);
  return <div className="mt-2 space-y-2 text-xs">
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Arma da Investida" className={campo} value={indice} onChange={(e) => setIndice(e.target.value)}><option value="">Selecione a Arma</option>{armas.map((l, i) => <option key={`${l.chaveArma ?? l.id}:${i}`} value={i}>{l.nome}</option>)}</select>
      {onOperacaoAlvo && <Alvo alvos={alvos} valor={alvo} onValor={(v) => { setAlvo(v); setTesteAlvo(""); }} rotulo="Alvo da Investida" />}
      <label>Avanço <input aria-label="Distância da Investida" className={`${campo} w-20`} type="number" min="0" max={alcance.maximo} step="0.5" value={distancia} onChange={(e) => setDistancia(Number(e.target.value))} /></label>
      <span>Máximo <NumeroComFontes valor={`${alcance.maximo}m`} formatar={false} partes={alcance.partes} total={`${alcance.maximo}m`} /></span>
      <select aria-label="Modo da Investida" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select>
      <label><input type="checkbox" checked={trajeto} onChange={(e) => setTrajeto(e.target.checked)} />Linha Reta sem Terreno Difícil</label>
      {voadora && <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>}
      <button type="button" className={botao} disabled={indice === "" || !trajeto || !onRolar || (!!onOperacaoAlvo && !alvo)} onClick={() => {
        const linha = armas[Number(indice)];
        const r = preparaInvestidaConteudo(sessao, derived, { armaId: linha.id, chaveArma: linha.chaveArma, alvoId: alvo,
          distancia, linhaReta: trajeto, terrenoDificil: !trajeto, modo, voadora, descontarPE }, pedido());
        setErro(r.erro ?? null); if (!r.aplicado) return;
        setManual(r.custo?.pe.naoDescontado ?? 0);
        onSessao(() => r.sessao); if (!onRolar(r.pedidoRolagem, r.sessao)) { onSessao(() => sessao); setManual(0); setErro("Ataque Indisponível"); }
      }}>Realizar Investida</button>
      {danoPendente && <button type="button" className={botao} disabled={!onRolar} onClick={() => {
        setErro(onRolar(danoPendente) ? null : "Dano Indisponível");
      }}>Rolar Dano da Investida</button>}
      {danoPendente?.grupos.some((g) => g.nome === "Voadora") && <NumeroComFontes valor={`${danoPendente.grupos.find((g) => g.nome === "Voadora").dados}d8`} formatar={false}
        partes={[{ label: "Voadora", texto: "1d8 por 3m, limitado pelo maior MOD entre Força e Destreza" }]} total={`${danoPendente.grupos.find((g) => g.nome === "Voadora").dados}d8`} />}
      {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    </div>
    {onOperacaoAlvo && aprimorada && <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Acerto da Investida" className={campo} value={ataqueId} onChange={(e) => {
        const id = e.target.value, confirmado = sessao.log.find((r) => r.ataqueId === id && r.ataque?.acertou);
        setAtaqueId(id); setAlvo(confirmado?.ataque.alvo?.id ?? ""); setSeuTeste(""); setTesteAlvo("");
      }}><option value="">Selecione o Acerto Confirmado</option>{ataques.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
      <label>Seu Atletismo <select aria-label="Seu Atletismo da Disputa" className={campo} value={seuTeste} onChange={(e) => setSeuTeste(e.target.value)}><option value="">Rolar Agora</option>{testesSeus.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select></label>
      <label>Atletismo do Alvo <select aria-label="Atletismo do Alvo na Disputa" className={campo} value={testeAlvo} onChange={(e) => setTesteAlvo(e.target.value)}><option value="">Rolar Agora</option>{testesAlvo.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select></label>
      {[{ nome: "Rolar Disputa", fn: rolaDisputaInvestida }, { nome: "Aplicar Resultado", fn: aplicaDisputaInvestida }].map(({ nome, fn }) => <button key={nome} type="button" className={botao} disabled={!alvo || !ataqueId} onClick={() => {
        const p = pedido(), entrada = { ataqueId, alvoId: alvo, rolagemAtacanteId: seuTeste || null, rolagemAlvoId: testeAlvo || null };
        const r = onOperacaoAlvo(alvo, (s, d, sa, da) => fn(s, d, sa, da, entrada, p)); setErro(r?.erro ?? null);
      }}>{nome}</button>)}
    </div>}
    <Erro erro={erro} />
  </div>;
}

function SurtoDeAcaoDoItem({ derived, sessao, onSessao }) {
  const [descontarPE, setDescontarPE] = useState(false), [erro, setErro] = useState(null), [manual, setManual] = useState(0);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    <button type="button" className={botao} onClick={() => {
      const r = usaEspecializacaoConteudo(sessao, derived, { id: "cmb_surto_de_acao", descontarPE }, pedido());
      setErro(r.erro ?? null); if (r.aplicado) { setManual(r.custo.pe.naoDescontado); onSessao(() => r.sessao); }
    }}>Usar Surto de Ação</button>
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    <Erro erro={erro} />
  </div>;
}

function ConcentracaoDoItem({ derived, sessao, onSessao }) {
  const [pe, setPe] = useState(0), [descontarPE, setDescontarPE] = useState(false), [erro, setErro] = useState(null), [manual, setManual] = useState(0);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    <label>PE <input aria-label="PE de Mente Plácida" type="number" min="0" max="2" value={pe} className={`${campo} w-16`} onChange={(e) => setPe(Number(e.target.value))} /></label>
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    <button type="button" className={botao} disabled={!sessao.uso?.teste} onClick={() => {
      const r = usaMentePlacida(sessao, derived, { pe, descontarPE }, pedido()); setErro(r.erro ?? null);
      if (r.aplicado) { setManual(r.custo.pe.naoDescontado); onSessao(() => r.sessao); }
    }}>Testar Concentração</button>
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    <Erro erro={erro} />
  </div>;
}

function RerrolagemDeClasseDoItem({ id: habilidade, derived, sessao, onSessao, alvos = [], onOperacaoAlvo }) {
  const [alvo, setAlvo] = useState(""), [id, setId] = useState(""), [falhou, setFalhou] = useState(false),
    [antesConsequencias, setAntesConsequencias] = useState(false), [visivel, setVisivel] = useState(false),
    [descontarPE, setDescontarPE] = useState(false), [erro, setErro] = useState(null), [manual, setManual] = useState(0);
  const externo = habilidade === "sup_conceder_outra_chance";
  const testes = (externo ? alvos.find((a) => a.id === alvo)?.rolagens ?? [] : sessao.log ?? []).filter((r) =>
    r.tipo === "teste" && r.sucesso !== true && !testeComConsequencias(r) && r.sorte?.escolha !== null
    && (externo || derived.testes.resistencias.some((t) => t.value === r.resistenciaId || t.label === r.rotulo)));
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {externo && <Alvo alvos={alvos} valor={alvo} onValor={(v) => { setAlvo(v); setId(""); }} rotulo="Aliado da Rerrolagem" />}
    <select aria-label="Teste para Rerrolagem de Classe" className={campo} value={id} onChange={(e) => setId(e.target.value)}><option value="">Selecione o Teste Falho</option>{testes.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
    <label><input type="checkbox" checked={falhou} onChange={(e) => setFalhou(e.target.checked)} />Falhou</label>
    <label><input type="checkbox" checked={antesConsequencias} onChange={(e) => setAntesConsequencias(e.target.checked)} />Consequências Ainda Não Aplicadas</label>
    {externo && <label><input type="checkbox" checked={visivel} onChange={(e) => setVisivel(e.target.checked)} />Aliado Visível a Até 6m</label>}
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    <button type="button" className={botao} disabled={!id || !antesConsequencias || (externo && (!onOperacaoAlvo || !alvo || !visivel))} onClick={() => {
      const entrada = { id, falhou, antesConsequencias, aliadoVisivelAte6m: visivel, descontarPE }, p = pedido();
      const r = externo ? onOperacaoAlvo(alvo, (s, d, sa, da) => rerrolaTesteDeClasse(s, d, entrada, p, { sessao: sa, derived: da }))
        : rerrolaTesteDeClasse(sessao, derived, entrada, p);
      setErro(r?.erro ?? null); if (r?.aplicado) { setManual(r.custo?.pe.naoDescontado ?? 0); if (!externo) onSessao(() => r.sessao); }
    }}>Repetir Teste de Classe</button>
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    <Erro erro={erro} />
  </div>;
}

function RegeneracaoDoItem({ derived, sessao, onSessao }) {
  const [id, setId] = useState(""), [modo, setModo] = useState("regenerar"), [recente, setRecente] = useState(false),
    [maos, setMaos] = useState(false), [livre, setLivre] = useState(false), [turnos, setTurnos] = useState(1), [erro, setErro] = useState(null), [fluxo, setFluxo] = useState(""), [venenoId, setVenenoId] = useState("");
  const ferimentos = sessao.vital?.ferimentos ?? [];
  const venenos = venenosParaRegenerar(sessao);
  return <div className="mt-2 space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Uso de Regeneração Aprimorada" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="regenerar">Regenerar Ferimento</option><option value="veneno">Remover Veneno</option>
        {derived.conteudoTreinos?.energiaReversa >= 4 && <option value="exaustao">Exaustão após Domínio</option>}
      </select>
      {modo === "regenerar" && <select aria-label="Ferimento a Regenerar" className={campo} value={id} onChange={(e) => setId(e.target.value)}><option value="">Selecione o Ferimento</option>{ferimentos.filter((f) => !f.permanente).map((f) => <option key={f.uid} value={f.uid}>{f.membro}</option>)}</select>}
      {modo === "veneno" && <select aria-label="Veneno a Remover" className={campo} value={venenos.some((v) => v.id === venenoId) ? venenoId : venenos.length === 1 ? venenos[0].id : ""} onChange={(e) => setVenenoId(e.target.value)}><option value="">Selecione o Veneno</option>{venenos.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>}
      {modo === "exaustao" && <label className="text-xs">Turnos <input aria-label="Turnos de Exaustão a Recuperar" type="number" min="1" max={sessao.exaustaoTecnica?.restantes ?? 1} className={`${campo} w-16`} value={turnos} onChange={(e) => setTurnos(Number(e.target.value))} /></label>}
      <button type="button" className={botao} onClick={() => {
        const r = regeneraFerimento(sessao, derived, { id, modo, venenoId: venenos.some((v) => v.id === venenoId) ? venenoId : null, recenteOuAberto: recente, membroEmMaos: maos, livre, turnos, aposDominio: modo === "exaustao",
          fluxo: modo === "regenerar" && !!fluxo, inicioTurno: fluxo === "inicio", reduziuVida: fluxo === "dano" }, pedido());
        setErro(r.erro ?? null); if (r.aplicado) onSessao(() => r.sessao);
      }}>Usar Regeneração</button>
    </div>
    {modo === "regenerar" && <div className="flex flex-wrap gap-3 text-xs">
      <label><input type="checkbox" checked={recente} onChange={(e) => setRecente(e.target.checked)} />Membro Perdido há Menos de Um Dia ou Não Cicatrizado</label>
      <label><input type="checkbox" checked={maos} onChange={(e) => setMaos(e.target.checked)} />Membro em Mãos</label>
      {derived.aptidao?.efetivo?.er >= 5 && <label><input type="checkbox" checked={livre} onChange={(e) => setLivre(e.target.checked)} />Ação Livre</label>}
      {derived.conteudoTreinos?.energiaReversa >= 4 && derived.aptidoesEscolhidas.includes("fluxo_constante") && <select aria-label="Regenerar por Fluxo Constante" className={campo} value={fluxo} onChange={(e) => { setFluxo(e.target.value); if (e.target.value) setLivre(false); }}><option value="">Sem Fluxo Constante</option><option value="inicio">Fluxo no Início do Seu Turno</option><option value="dano">Fluxo após Perder PV</option></select>}
    </div>}
    <Erro erro={erro} />
  </div>;
}

function CanalizacaoDoItem({ id, derived, sessao, onSessao }) {
  const [maxima, setMaxima] = useState(id === "canalizacao_maxima"), [reacao, setReacao] = useState(false),
    [descontarPE, setDescontarPE] = useState(false), [erro, setErro] = useState(null), [custoManual, setCustoManual] = useState(null);
  const reversa = id === "canalizar_energia_reversa";
  const ativo = sessao.uso?.ativos?.[reversa ? "canalizarEnergiaReversa" : "canalizarEmGolpe"];
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {!reversa && derived.aptidoesEscolhidas.includes("canalizacao_maxima") && <label><input type="checkbox" checked={maxima} onChange={(e) => setMaxima(e.target.checked)} />Canalização Máxima</label>}
    {!reversa && derived.aptidoesEscolhidas.includes("canalizacao_avancada") && <label><input type="checkbox" checked={reacao} onChange={(e) => setReacao(e.target.checked)} />Reação ao Atacar</label>}
    <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>
    <button type="button" className={botao} disabled={!!ativo} onClick={() => {
      const r = armaCanalizacao(sessao, derived, { reversa, maxima, reacao, descontarPE }, pedido());
      setErro(r.erro ?? null); if (r.aplicado) { setCustoManual(r.custo.pe.naoDescontado); onSessao(() => r.sessao); }
    }}>{ativo ? "Canalização Armada" : "Armar Próximo Acerto"}</button>
    {custoManual > 0 && <span>PE Não Descontado: {custoManual}</span>}
    <Erro erro={erro} />
  </div>;
}

function ConfirmacaoAtaque({ sessao, derived, alvos, onOperacaoAlvo }) {
  const [id, setId] = useState(""), [danoId, setDanoId] = useState(""), [alvo, setAlvo] = useState(""),
    [cobertura, setCobertura] = useState(""), [camuflagem, setCamuflagem] = useState(""), [d10, setD10] = useState(""),
    [flanqueado, setFlanqueado] = useState(false), [inimigo, setInimigo] = useState(true), [erro, setErro] = useState(null);
  const [janela, setJanela] = useState(null);
  const ataques = (sessao.log ?? []).filter((r) => r.tipoTeste === "ataque" && r.armaId);
  const ataque = ataques.find((r) => r.id === id);
  const alvoVinculado = ataque?.contextoConteudo?.alvoProvocacao;
  const alvoId = alvoVinculado || alvo;
  const saltador = ataque && bonusSaltadorContra(sessao, derived, ataque.id, alvoId);
  const devastacao = ataque && devastacaoContra(sessao, derived, ataque, alvoId);
  const bonus = (saltador?.acerto ?? 0) + (devastacao?.acerto ?? 0);
  const danos = (sessao.log ?? []).filter((r) => r.tipo === "dano" && r.tom !== "cura" && r.armaId === ataque?.armaId && r.chaveArma === ataque?.chaveArma && r.ts >= ataque?.ts);
  const dano = danos.find((r) => r.id === danoId);
  const antesDoAcerto = janela?.etapa === "ataque";
  const resolver = (p, resposta) => {
    const respostaAtaque = antesDoAcerto ? resposta : janela?.respostaAtaque;
    const r = onOperacaoAlvo(alvoId, (s, d, sa, da, mesa) => confirmaAtaqueConteudo(s, d, sa, da, {
      ataqueId: id, danoId, alvoId, cobertura: cobertura || null, camuflagem: camuflagem || null,
      camuflagemD10: d10, flanqueado, inimigo, mesa, janelaAntesDoAcerto: respostaAtaque,
      janelaReacao: antesDoAcerto ? undefined : resposta,
    }, p));
    setErro(r?.erro ?? null);
    setJanela(r?.janelaReacao ? { ...r.janelaReacao, pedido: p, respostaAtaque } : null);
  };
  if (!onOperacaoAlvo || !ataques.length) return null;
  return <div className="space-y-2">
    <h2 className="afty-card-titulo">Ataque com Alvo</h2>
    <div className="flex flex-wrap items-center gap-2 text-xs" onChangeCapture={() => setJanela(null)}>
      <select aria-label="Ataque a Confirmar" className={campo} value={id} onChange={(e) => { setId(e.target.value); setDanoId(""); }}><option value="">Selecione o Ataque</option>{ataques.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
      <Alvo alvos={alvos} valor={alvoId} onValor={setAlvo} rotulo="Alvo do Ataque" bloqueado={!!alvoVinculado} />
      {bonus > 0 && <NumeroComFontes valor={ataque.total + bonus} total={ataque.total + bonus}
        partes={[{ label: "Rolagem de Ataque", valor: ataque.total },
          ...(saltador ? [{ label: "Saltador Constante", valor: saltador.acerto }] : []),
          ...(devastacao?.acerto ? [{ label: "Postura da Devastação", valor: devastacao.acerto }] : [])]} />}
      <select aria-label="Dano do Ataque" className={campo} value={danoId} onChange={(e) => setDanoId(e.target.value)}><option value="">Sem Rolagem de Dano</option>{danos.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
      {saltador && dano && <NumeroComFontes valor={Math.max(0, dano.total + saltador.dano)} total={Math.max(0, dano.total + saltador.dano)}
        partes={[{ label: "Rolagem de Dano", valor: dano.total }, { label: "Saltador Constante", valor: saltador.dano }]} />}
      <select aria-label="Cobertura do Alvo" className={campo} value={cobertura} onChange={(e) => setCobertura(e.target.value)}><option value="">Sem Cobertura</option><option value="meia">Meia Cobertura</option><option value="tres_quartos">Três Quartos</option><option value="total">Cobertura Total</option></select>
      <select aria-label="Camuflagem do Alvo" className={campo} value={camuflagem} onChange={(e) => setCamuflagem(e.target.value)}><option value="">Sem Camuflagem</option><option value="leve">Camuflagem Leve</option><option value="total">Camuflagem Total</option></select>
      <label>d10 da Camuflagem <input aria-label="d10 da Camuflagem" className={`${campo} w-16`} type="number" min="1" max="10" value={d10} onChange={(e) => setD10(e.target.value === "" ? "" : Number(e.target.value))} /></label>
      <label><input type="checkbox" checked={flanqueado} onChange={(e) => setFlanqueado(e.target.checked)} />Flanqueado</label>
      <label><input type="checkbox" checked={inimigo} onChange={(e) => setInimigo(e.target.checked)} />Alvo Inimigo</label>
      <button type="button" className={botao} disabled={!alvoId || !ataque || !!janela}
        onClick={() => resolver(pedido())}>Confirmar Ataque e Aplicar Dano</button>
    </div>
    {janela && <EscolhaDeReacao key={janela.chave} janela={janela} nomeAlvo={alvos.find((a) => a.id === alvoId)?.nome}
      onResponder={resolver} onCancelar={() => setJanela(null)} />}
    <Erro erro={erro} />
  </div>;
}

function EscolhaDeReacao({ janela, nomeAlvo, onResponder, onCancelar }) {
  const [escolha, setEscolha] = useState({ id: "" });
  const antesDoAcerto = janela.etapa === "ataque";
  const reacao = janela.opcoes.find((o) => o.id === escolha.id);
  return <fieldset className="flex flex-wrap items-center gap-2 text-xs">
      <legend>Reação de {nomeAlvo}{janela.condicional ? " se o Ataque Acertar" : ""}</legend>
      <select aria-label={antesDoAcerto ? "Reação ao Ataque" : "Reação ao Dano"} className={campo} value={escolha.id} onChange={(e) => {
        const opcao = janela.opcoes.find((o) => o.id === e.target.value);
        setEscolha({ id: e.target.value, tipo: opcao?.tipos?.length === 1 ? opcao.tipos[0].tipo : undefined, pe: opcao?.maxPe ? 1 : undefined });
      }}>
        <option value="">Selecione a Reação</option>
        <option value="passar">Sem Reação</option>
        {janela.opcoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
      </select>
      {reacao?.armas && <select aria-label="Arma para Aparar Ataque" className={campo}
        value={escolha.arma ?? ""} onChange={(e) => setEscolha({ ...escolha, arma: e.target.value })}>
        <option value="">Selecione o Ataque</option>
        {reacao.armas.map((a) => <option key={a.chave} value={a.chave}>{a.nome}</option>)}
      </select>}
      {reacao?.tipos?.length > 1 && <select aria-label="Tipo de Dano para Reduzir" className={campo}
        value={escolha.tipo === null ? "sem-tipo" : escolha.tipo ?? ""} onChange={(e) => {
          const tipo = e.target.value === "sem-tipo" ? null : e.target.value || undefined;
          setEscolha({ ...escolha, tipo });
        }}>
        <option value="">Selecione o Tipo de Dano</option>
        {reacao.tipos.map((d) => <option key={d.tipo ?? "sem-tipo"} value={d.tipo ?? "sem-tipo"}>{TIPOS_DANO[d.tipo] ?? d.tipo ?? "Sem Tipo"}: {d.valor}</option>)}
      </select>}
      {reacao?.maxPe && <label>PE <input type="number" aria-label="PE da Reação" className={`${campo} w-16`}
        min="1" max={reacao.maxPe} value={escolha.pe} onChange={(e) => setEscolha({ ...escolha, pe: e.target.value })} /></label>}
      <button type="button" className={botao} disabled={!escolha.id || (!!reacao?.tipos && escolha.tipo === undefined) || (!!reacao?.armas && !escolha.arma)}
        onClick={() => onResponder(janela.pedido, { ...escolha, chave: janela.chave })}>{antesDoAcerto ? "Resolver Acerto" : "Aplicar Dano"}</button>
      <button type="button" className={botao} onClick={onCancelar}>Cancelar</button>
    </fieldset>;
}

function ConcentrarAuraDoItem({ derived, sessao, onSessao, emSeuTurno = true }) {
  const [selecionadas, setSelecionadas] = useState([]), [erro, setErro] = useState(null);
  const opcoes = opcoesConcentrarAura(derived), limite = limiteConcentrarAura(derived);
  const ativo = sessao.uso?.ativos?.concentrar_aura;
  const selecaoManual = !ativo && sessao.combate?.concentrarAura?.length > 0;
  const ids = selecionadas.filter((id) => opcoes.some((a) => a.id === id));
  if (!opcoes.length && !selecaoManual) return null;
  if (ativo) {
    const auras = derived.combate.concentrarAura ?? [];
    return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      {opcoes.filter((a) => auras.includes(a.id)).map((a) => <span key={a.id}>{a.nome} Suspensa</span>)}
      <NumeroComFontes valor={`${auras.length}d8`} formatar={false} total={`${auras.length}d8`}
        partes={[{ label: "Concentrar Aura", texto: "Energético Após Ataque" }]} />
      <span>{ativo.duracao.restantes} Rodada</span>
    </div>;
  }
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {selecaoManual && <button type="button" className={botao} onClick={() => onSessao((s) => s.uso?.ativos?.concentrar_aura
      ? s : alteraEstadoCombate(s, { id: "concentrarAura" }, []))}>Limpar Seleção Manual</button>}
    {opcoes.map((a) => <label key={a.id} className="inline-flex items-center gap-1"><input type="checkbox" checked={ids.includes(a.id)}
      disabled={!ids.includes(a.id) && ids.length >= limite}
      onChange={(e) => setSelecionadas(e.target.checked ? [...ids, a.id] : ids.filter((id) => id !== a.id))} />{a.nome}</label>)}
    <span>{ids.length}/{limite}</span>
    <button type="button" className={botao} disabled={!sessao.combate?.ativo || !emSeuTurno || !ids.length || ids.length > limite} onClick={() => {
      const r = usaConcentrarAura(sessao, derived, { auras: ids, emSeuTurno }, pedido());
      setErro(r.erro ?? null);
      if (r.aplicado) { onSessao(() => r.sessao); setSelecionadas([]); }
    }}>Concentrar Aura</button>
    <Erro erro={erro} />
  </div>;
}

function AptidaoPessoalDoItem({ id, derived, sessao, onSessao, emSeuTurno = true }) {
  const [modo, setModo] = useState("teste"), [pe, setPe] = useState(1), [descontarPE, setDescontarPE] = useState(false),
    [inicioRodada, setInicioRodada] = useState(false), [erro, setErro] = useState(null), [resultado, setResultado] = useState(null), [manual, setManual] = useState(0);
  const estimulo = id === "estimulo_muscular";
  const expandir = id === "expandir_aura";
  const estadoId = { aura_impenetravel: "auraImpenetravel", aura_excessiva: "auraExcessiva", aura_embacada: "auraEmbacada", expandir_aura: id }[id];
  const ativo = sessao.uso?.ativos?.[estadoId];
  const devida = ativo?.manutencao?.devidas > 0;
  const alcances = expandir ? alcancesDasAurasPassivas(sessao, derived) : [];
  const recebe = (r) => { setErro(r.erro ?? null); if (r.aplicado) { setResultado(r.resultado ?? null); setManual(r.custo?.pe.naoDescontado ?? 0); onSessao(() => r.sessao); } };
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {estimulo && <>
      <select aria-label="Estímulo Muscular" className={campo} value={modo} onChange={(e) => { setModo(e.target.value); setPe(e.target.value === "empurrao" ? 2 : 1); }}><option value="teste">Teste de Acrobacia ou Atletismo</option><option value="movimento">Movimento</option><option value="empurrao">Empurrar ou Desarmar</option></select>
      <label>PE <input aria-label="PE do Estímulo" type="number" min="1" max={modo === "teste" ? derived.aptidao.efetivo.cl : 2} className={`${campo} w-16`} value={pe} onChange={(e) => setPe(Number(e.target.value))} /></label>
    </>}
    {id === "aura_excessiva" && <label><input type="checkbox" checked={inicioRodada} onChange={(e) => setInicioRodada(e.target.checked)} />Início da Rodada</label>}
    {!expandir && <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>}
    <button type="button" className={botao} disabled={!!ativo || (expandir && !emSeuTurno)} onClick={() =>
      recebe(usaAptidaoPessoal(sessao, derived, { id, modo, pe, descontarPE: expandir || descontarPE, inicioRodada, emSeuTurno }, pedido()))
    }>{expandir ? "Expandir Aura" : estimulo ? "Usar Estímulo" : "Ativar Aura"}</button>
    {devida && <button type="button" className={botao} disabled={expandir && !emSeuTurno}
      onClick={() => recebe(pagaManutencao(sessao, derived, estadoId, pedido()))}>Pagar Manutenção</button>}
    {ativo && <button type="button" className={botao} onClick={() => recebe(encerraUso(sessao, derived, estadoId, pedido()))}>Encerrar Aura</button>}
    {resultado && <NumeroComFontes valor={`${resultado.valor}${resultado.unidade}`} formatar={false} partes={[{ label: "Estímulo Muscular", texto: resultado.label }]} total={resultado.valor} />}
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    {alcances.map((a) => <span key={a.id} className="inline-flex items-center gap-1">
      {a.nome}
      {a.suspensa ? " Suspensa" : <NumeroComFontes valor={`${a.atual} m`} formatar={false}
        partes={[{ label: a.nome, valor: a.base }, ...(a.expandido ? [{ label: "Expandir Aura", valor: a.base }] : [])]} />}
    </span>)}
    <Erro erro={erro} />
  </div>;
}

function TesteDoItem({ fonte, periciaId = null, derived, sessao, onSessao }) {
  const [id, setId] = useState(periciaId ?? ""), [cd, setCd] = useState(""), [modo, setModo] = useState("normal"),
    [confirmado, setConfirmado] = useState(false), [rolagemId, setRolagemId] = useState(""), [erro, setErro] = useState(null), [descontarPE, setDescontarPE] = useState(false), [manual, setManual] = useState(0), [pe, setPe] = useState(1);
  const tr = ["guarda", "escudo", "resistir", "conhecimento"].includes(fonte), repetir = fonte === "treino-rerrolar";
  const gasto = ["resistir", "conhecimento"].includes(fonte);
  const lista = (tr ? derived.testes.resistencias : derived.testes.pericias).filter((p) =>
    periciaId ? (p.id ?? p.value) === periciaId : fonte === "versatilidade" ? !!p.versatilidade : fonte === "resistir" ? ["fortitude", "reflexos"].includes(p.value) : fonte === "luta" ? ["acrobacia", "atletismo"].includes(p.id) : true);
  const testes = (sessao.log ?? []).filter((r) => r.tipo === "teste" && r.periciaId === periciaId && r.natural < 5 && !r.treinoRerrolado && r.sorte?.escolha !== null);
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
    {repetir ? <select aria-label="Teste do Treino a Repetir" className={campo} value={rolagemId} onChange={(e) => setRolagemId(e.target.value)}><option value="">Selecione a Rolagem</option>{testes.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
      : <>
        {!periciaId && <select aria-label="Teste do Benefício" className={campo} value={id} onChange={(e) => setId(e.target.value)}><option value="">Selecione o Teste</option>{lista.map((r) => <option key={r.id ?? r.value} value={r.id ?? r.value}>{r.nome ?? r.label}</option>)}</select>}
        <label>CD <input aria-label="CD do Teste" className={`${campo} w-16`} type="number" value={cd} onChange={(e) => setCd(e.target.value)} /></label>
        <select aria-label="Modo do Teste" className={campo} value={modo} onChange={(e) => setModo(e.target.value)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select>
      </>}
    {["guarda", "treino-sucesso"].includes(fonte) && <label><input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />{fonte === "guarda" ? "Resistir à Redução de Defesa ou TR" : "Teste Não Oposto"}</label>}
    {gasto && <label>PE <input aria-label="PE do Teste" type="number" min="1" max={fonte === "resistir" ? 2 : Math.floor(derived.maestria / 2)} className={`${campo} w-16`} value={pe} onChange={(e) => setPe(Number(e.target.value))} /></label>}
    {fonte === "conhecimento" && <label><input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />Contra Efeito de Feitiço</label>}
    {(["aura-controlada", "versatilidade"].includes(fonte) || gasto) && <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>}
    <button type="button" className={botao} disabled={repetir ? !rolagemId : !id} onClick={() => {
      const r = repetir ? rerrolaTreinoPericia(sessao, derived, { id: rolagemId }, pedido()) : usaTesteConteudo(sessao, derived, {
        fonte, id, cd: cd === "" ? null : Number(cd), modo, oposto: !confirmado, reduzDefesaOuTR: confirmado, descontarPE, pe, contraFeitico: confirmado,
      }, pedido()); setErro(r.erro ?? null); if (r.aplicado) { setManual(r.custo?.pe.naoDescontado ?? 0); onSessao(() => r.sessao); }
    }}>{repetir ? "Rolar Novamente" : fonte === "treino-sucesso" ? "Sucesso Garantido" : "Realizar Teste"}</button>
    {manual > 0 && <span>PE Não Descontado: {manual}</span>}
    <Erro erro={erro} />
  </div>;
}

/** A operação fica dentro da Habilidade já existente. Não recria um painel de Restringido. */
export function OperacaoConteudoDoItem(props) {
  const { item, derived, sessao, onSessao } = props;
  const [erro, setErro] = useState(null), [descontarPE, setDescontarPE] = useState(false), [manual, setManual] = useState(0);
  const id = item.id.replace(/^.*__/, "");
  if (item.grupo === "treinamento") {
    const [linha, alvo, etapa] = item.id.split(":");
    if (linha === "luta" && etapa === "completo") return <TesteDoItem {...props} fonte="luta" />;
    if (linha === "pericia" && ["2", "4", "completo"].includes(etapa)) return <TesteDoItem {...props}
      fonte={etapa === "2" ? "treino" : etapa === "4" ? "treino-sucesso" : "treino-rerrolar"} periciaId={alvo} />;
  }
  if (id === "tal_tempestade_de_ideias") return <TesteDoItem {...props} fonte="tempestade" periciaId={derived.conteudoTalentos?.vantagemTempestade} />;
  if (id === "aura_controlada") return <TesteDoItem {...props} fonte="aura-controlada" periciaId="furtividade" />;
  if (id === "tal_guarda_infalivel") return <TesteDoItem {...props} fonte="guarda" />;
  if (id === "tal_tecnicas_defensivas_de_escudo") return <TesteDoItem {...props} fonte="escudo" periciaId="reflexos" />;
  if (id === "lut_resistir") return <TesteDoItem {...props} fonte="resistir" />;
  if (id === "sup_versatilidade") return <TesteDoItem {...props} fonte="versatilidade" />;
  if (id === "cnj_conhecimento_aplicado") return <TesteDoItem {...props} fonte="conhecimento" />;
  if (id === "cnj_mente_placida") return <ConcentracaoDoItem {...props} />;
  if (id === "cmb_assumir_postura") return <>
    <PosturasDoItem {...props} />
    <LuaDoItem {...props} />
    <DragaoDoItem {...props} />
    <TempestadeDoItem {...props} />
    {derived.conteudoPosturaFortuna && <FortunaDoItem {...props} />}
  </>;
  if (id === "cmb_postura_da_lua") return <LuaDoItem {...props} />;
  if (id === "cmb_postura_do_dragao") return <DragaoDoItem {...props} />;
  if (id === "cmb_postura_da_tempestade") return <TempestadeDoItem {...props} />;
  if (id === "api_invencivel_sob_o_sol" || (["cmb_mestre_da_postura", "cmb_aprender_postura"].includes(id) && derived.imitacao.copia?.id === item.id)) return <>
    <LuaDoItem {...props} />
    <DragaoDoItem {...props} />
    <TempestadeDoItem {...props} />
    {derived.conteudoPosturaFortuna && <FortunaDoItem {...props} />}
  </>;
  if ((["cmb_assumir_postura", "cmb_postura_da_fortuna"].includes(id)
    || (["cmb_mestre_da_postura", "cmb_aprender_postura"].includes(id) && derived.imitacao.copia?.id === item.id))
    && derived.conteudoPosturaFortuna) return <FortunaDoItem {...props} />;
  if (["cmb_indomavel", "sup_conceder_outra_chance"].includes(id)) return <RerrolagemDeClasseDoItem {...props} id={id} />;
  if (id === "sup_intervencao") return <IntervencaoDoItem {...props} />;
  if (id === "sup_incitar_vigor") return <IncitarVigorDoItem {...props} />;
  if (id === "sup_sintonizacao_vital") return <SintonizacaoVitalDoItem {...props} />;
  if (id === "aura_redirecionadora") return <AuraRedirecionadoraDoItem {...props} />;
  if (id === "concentrar_aura") return <ConcentrarAuraDoItem {...props} />;
  if (["lut_acao_agil", "res_acao_agil"].includes(id)) return <AcaoAgilDoItem {...props} id={id} />;
  if (id === "tal_especialista_em_cortes") return <CortesDoItem {...props} />;
  if (id === "sup_analise_profunda") return <AnaliseDoItem {...props} />;
  if (id === "sup_mobilidade_avancada") return <MobilidadeDoItem {...props} />;
  if (id === "tal_favorecido_pela_sorte") return <SorteDoItem {...props} />;
  if (["tal_ataque_infalivel", "tal_especialista_em_perfuracao", "tal_tecnicas_de_reacao_rapida"].includes(id)) return <RerrolagemDoItem {...props} id={id} />;
  if (["tal_mestre_dos_chicotes", "tal_especialista_em_concussao"].includes(id)) return <DeslocamentoDoItem {...props} id={id} />;
  if (id === "tal_movimentos_acrobaticos") return <AcrobaciaDoItem {...props} />;
  if (id === "tal_perceber_oportunidade") return <OportunidadeDoItem {...props} />;
  if (id === "tal_tecnicas_do_sentinela") return <SentinelaDoItem {...props} />;
  if (id === "tal_tecnicas_de_mobilidade") return <TecnicasMobilidadeDoItem {...props} />;
  if (id === "tal_adepto_de_briga") return <BrigaDoItem {...props} />;
  if (id === "tal_tecnicas_ofensivas_de_escudo") return <EscudoDoItem {...props} />;
  if (id === "tal_investida_aprimorada") return <InvestidaDoItem {...props} />;
  if (id === "lut_voadora") return <InvestidaDoItem {...props} voadora />;
  if (["aura_impenetravel", "aura_excessiva", "aura_embacada", "expandir_aura", "estimulo_muscular", "estimulo_muscular_avancado"].includes(id)) return <AptidaoPessoalDoItem {...props} id={id === "estimulo_muscular_avancado" ? "estimulo_muscular" : id} />;
  const curaId = id === "tal_adepto_de_medicina" ? id : {
    sup_suporte_em_combate: "cura_suporte_em_combate", cmb_revigorar: "cura_revigorar", lut_puxar_um_ar: "cura_puxar_um_ar",
    energia_reversa: "cura_energia_reversa", fluxo_constante: "cura_energia_reversa",
  }[id];
  const linha = derived.cura?.linhas?.find((l) => l.id === curaId);
  if (id === "cura_em_grupo") return <CuraEmGrupoDoItem {...props} />;
  if (linha) return <CuraDoItem {...props} linha={linha} fluxo={id === "fluxo_constante"} />;
  if (id === "cmb_surto_de_acao") return <SurtoDeAcaoDoItem {...props} />;
  if (id === "regeneracao_aprimorada") return <RegeneracaoDoItem {...props} />;
  if (["canalizar_em_golpe", "canalizacao_avancada", "canalizacao_maxima", "canalizar_energia_reversa"].includes(id)) return <CanalizacaoDoItem {...props} id={id} />;
  if (["res_reacao_rapida", "res_forca_imparavel", "res_barreira_inamovivel", "res_precisao_forcada", "res_ainda_de_pe", "res_rejeitar_a_morte"].includes(id)) {
    const executar = (acao) => { const r = usaEspecializacaoConteudo(sessao, derived, { id: acao, descontarPE }, pedido()); setErro(r.erro ?? null); if (r.aplicado) { setManual(r.custo?.pe.naoDescontado ?? 0); onSessao(() => r.sessao); } };
    return <div className="mt-2 flex flex-wrap gap-2 text-xs">
      {["res_reacao_rapida", "res_forca_imparavel", "res_barreira_inamovivel", "res_precisao_forcada"].includes(id) && <label><input type="checkbox" checked={descontarPE} onChange={(e) => setDescontarPE(e.target.checked)} />Descontar PE</label>}
      <button type="button" className={botao} onClick={() => executar(id)}>Usar {item.nome}</button>
      {id === "res_ainda_de_pe" && <button type="button" className={botao} onClick={() => executar("res_ainda_de_pe_letal")}>Manter o Dano Letal</button>}
      {manual > 0 && <span>PE Não Descontado: {manual}</span>}<Erro erro={erro} /></div>;
  }
  return null;
}

export function ProvocarDoItem({ sessao, derived, alvos, onOperacaoAlvo, emSeuTurno, voceId }) {
  const [alvo, setAlvo] = useState(""), [distancia, setDistancia] = useState(""), [oposicao, setOposicao] = useState("intuicao"),
    [livre, setLivre] = useState(false), [erro, setErro] = useState(null);
  const pendente = provocacoesPendentes(sessao)[0], contexto = pendente?.contextoConteudo;
  const alvoId = contexto?.alvoId || alvo;
  const destinatario = alvos.find((a) => a.id === alvoId);
  const defesa = contexto && destinatario?.rolagens?.find((r) => r.contextoConteudo?.operacaoId === contexto.operacaoId && r.contextoConteudo.papel === "alvo");
  const quota = usosLivresDeProvocar(sessao, derived);
  const executar = () => {
    const fn = pendente ? concluiProvocar : rolaProvocar, p = pedido();
    const entrada = { emSeuTurno, voceId, alvoId, rolagemId: pendente?.id, livre: livre && quota.restantes > 0, oposicao, distancia: Number(distancia) };
    const r = onOperacaoAlvo(alvoId, (s, d, sa, da) => fn(s, d, sa, da, entrada, p));
    setErro(r?.erro ?? null);
    if (r?.aplicado && pendente) { setLivre(false); setDistancia(""); setAlvo(""); }
  };
  return <div className="flex flex-wrap items-center gap-2 text-xs">
    <Alvo alvos={alvos} valor={alvoId} onValor={setAlvo} rotulo="Alvo de Provocar" bloqueado={!!pendente} />
    {!pendente ? <>
      <label>Distância <input aria-label="Distância para Provocar" type="number" min="0" max="9" step="any" className={`${campo} w-16`}
        value={distancia} onChange={(e) => setDistancia(e.target.value)} /></label>
      <select aria-label="Perícia de Oposição a Provocar" className={campo} value={oposicao} onChange={(e) => setOposicao(e.target.value)}>
        <option value="intuicao">Intuição do Alvo</option><option value="intimidacao">Intimidação do Alvo</option>
      </select>
      {quota.max > 0 && <label className="inline-flex items-center gap-1"><input type="checkbox" disabled={!quota.restantes} checked={livre && quota.restantes > 0}
        onChange={(e) => setLivre(e.target.checked)} />Ação Livre ({quota.restantes}/{quota.max})</label>}
    </> : <span>{pendente.total} × {defesa?.total ?? "…"}</span>}
    <button type="button" className={botao} disabled={!emSeuTurno || !destinatario || (pendente
      ? !defesa || [pendente, defesa].some((r) => r.sorte?.escolha === null) : distancia === "")} onClick={executar}>
      {pendente ? "Concluir Provocação" : "Rolar Provocar"}
    </button>
    <Erro erro={erro} />
  </div>;
}

export function PainelSobProvocacao({ sessao, alvos, alvo, onAlvo, erro }) {
  const pendentes = provocacoesSemAtaque(sessao);
  return <section className="afty-card p-3 space-y-2">
    <h2 className="afty-card-titulo">Provocado</h2>
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Alvo alvos={alvos} valor={alvo} onValor={onAlvo} rotulo="Alvo Antes de Rolar Ataque" vazio="Alvo Antes de Rolar Ataque" />
      {pendentes.map((p) => {
        const fonte = alvos.find((a) => a.id === p.parametros.fonteId);
        return fonte && <span key={p.id}>Ataque Pendente Contra {fonte.nome}</span>;
      })}
      <Erro erro={erro} />
    </div>
  </section>;
}

function PularDoItem({ sessao, derived, onSessao, emSeuTurno, alvos, g2 = false }) {
  const [direcao, setDirecao] = useState("horizontal"), [pericia, setPericia] = useState(""), [livre, setLivre] = useState(false),
    [estimulo, setEstimulo] = useState(false), [distancia, setDistancia] = useState(""), [paredeAoFim, setParede] = useState(false),
    [alvoId, setAlvoId] = useState(""), [erro, setErro] = useState(null);
  const extra = puloLivreDisponivel(sessao, derived);
  const podeEstimular = aptidaoDeConteudoDisponivel(derived, "estimulo_muscular");
  const alcance = alcancePular(sessao, derived, { livre: livre && !!extra, estimulo: estimulo && podeEstimular });
  const pendente = pulosPendentes(sessao)[0];
  const resultado = pendente ? resultadoPulo(pendente) : null;
  const saltador = derived.talentos?.escolhidas?.includes("tal_saltador_constante") && !derived.talentos.inacessiveis?.includes("tal_saltador_constante");
  const iniciar = () => {
    const teste = alcance.superior != null && alcance.pericias.includes(pericia) ? pericia : "";
    const r = iniciaPulo(sessao, derived, { direcao, pericia: teste, livre: livre && !!extra, estimulo: estimulo && podeEstimular, emSeuTurno }, pedido());
    setErro(r.erro ?? null);
    if (r.aplicado) { setDistancia(""); setParede(false); setAlvoId(""); onSessao(() => r.sessao); }
  };
  const concluir = () => {
    const r = concluiPulo(sessao, derived, { puloId: pendente.id, distancia: distancia === "" ? resultado.maximo : Number(distancia),
      paredeAoFim, alvoId: saltador && alvos.some((a) => a.id === alvoId) ? alvoId : null }, pedido());
    setErro(r.erro ?? null);
    if (r.aplicado) { setLivre(false); setDistancia(""); onSessao(() => r.sessao); }
  };
  /* Na Ficha G2 o Pular é uma seção como as outras (título e controles na mesma fileira), com segmentos no lugar das listas e das caixas.
     Os verbos são os mesmos (`iniciaPulo`, `concluiPulo`): só a apresentação muda. */
  if (g2) {
    const seg = (rotulo, valor, onValor, opcoes) => (
      <span className="m-seg" role="group" aria-label={rotulo}>
        {opcoes.map(([v, l]) => <button key={v} type="button" className="m-seg-op" aria-pressed={valor === v} onClick={() => onValor(v)}>{l}</button>)}
      </span>
    );
    const opcao = (rotulo, ligado, onLigado) => <button type="button" className="m-seg-op" aria-pressed={ligado} onClick={() => onLigado(!ligado)}>{rotulo}</button>;
    return (
      <section className="afty-card e-grupo m-secao m-pular" data-m-secao="pular" aria-label="Pular">
        <header className="e-grupo-topo m-secao-topo">
          <h2 className="afty-card-titulo e-grupo-titulo" tabIndex={-1}>Pular</h2>
          <div className="m-secao-controles">
            {!pendente ? <>
              {seg("Direção do Pulo", direcao, setDirecao, [["horizontal", "Horizontal"], ["vertical", "Vertical"]])}
              {!alcance.erro && <span className="m-pular-alcance"><NumeroComFontes valor={`${alcance.comum} m`} formatar={false} partes={alcance.partes} total={`${alcance.comum} m`} /></span>}
              {alcance.superior != null && seg("Teste do Pulo", pericia, setPericia,
                [["", "Sem Teste"], ...alcance.pericias.map((id) => [id, id === "acrobacia" ? "Acrobacia" : "Atletismo"])])}
              {(podeEstimular || extra) && (
                <span className="m-seg" role="group" aria-label="Opções do Pulo">
                  {podeEstimular && opcao("Estímulo Muscular (1 PE)", estimulo, setEstimulo)}
                  {extra && opcao("Pulo Livre de Saltador", livre, setLivre)}
                </span>
              )}
              <button type="button" className="m-botao" data-m-primario="" disabled={!emSeuTurno || !!alcance.erro} onClick={iniciar}>Iniciar Pulo</button>
            </> : <>
              <span className="m-pular-alcance"><NumeroComFontes valor={`${resultado.maximo} m`} formatar={false} partes={resultado.partes} total={`${resultado.maximo} m`} /></span>
              {resultado.caiu ? <span className="m-pular-alcance">Caído</span> : (
                <label className="m-campo">Distância
                  <input aria-label="Distância Percorrida no Pulo" className="afty-campo" type="number" min="0.01" max={resultado.maximo} step="any"
                    value={distancia === "" ? resultado.maximo : distancia} onChange={(e) => setDistancia(e.target.value)} />
                </label>
              )}
              {saltador && (
                <span className="m-seg" role="group" aria-label="Opções do Pouso">{opcao("Junto a Parede ou Objeto", paredeAoFim, setParede)}</span>
              )}
              {saltador && alvos.length > 0 && <Alvo alvos={alvos} valor={alvoId} onValor={setAlvoId} rotulo="Alvo em Alcance Corpo a Corpo ao Aterrissar" vazio="Alvo em Alcance Corpo a Corpo" />}
              <button type="button" className="m-botao" data-m-primario="" disabled={!emSeuTurno || pendente.sorte?.escolha === null} onClick={concluir}>Concluir Pulo</button>
            </>}
          </div>
        </header>
        {(erro ?? (!pendente ? alcance.erro : null)) && <div className="m-faixa"><Erro erro={erro ?? (!pendente ? alcance.erro : null)} /></div>}
      </section>
    );
  }
  return <div className="flex flex-wrap items-center gap-2 text-xs">
    {!pendente ? <>
      <select aria-label="Direção do Pulo" className={campo} value={direcao} onChange={(e) => setDirecao(e.target.value)}><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select>
      {!alcance.erro && <NumeroComFontes valor={`${alcance.comum} m`} formatar={false} partes={alcance.partes} total={`${alcance.comum} m`} />}
      {alcance.superior != null && <select aria-label="Teste do Pulo" className={campo} value={pericia} onChange={(e) => setPericia(e.target.value)}>
        <option value="">Sem Teste</option>{alcance.pericias.map((id) => <option key={id} value={id}>{id === "acrobacia" ? "Acrobacia" : "Atletismo"}</option>)}
      </select>}
      {podeEstimular && <label className="inline-flex items-center gap-1"><input type="checkbox" checked={estimulo} onChange={(e) => setEstimulo(e.target.checked)} />Estímulo Muscular (1 PE)</label>}
      {extra && <label className="inline-flex items-center gap-1"><input type="checkbox" checked={livre} onChange={(e) => setLivre(e.target.checked)} />Pulo Livre de Saltador</label>}
      <button type="button" className={botao} disabled={!emSeuTurno || !!alcance.erro} onClick={iniciar}>Iniciar Pulo</button>
    </> : <>
      <NumeroComFontes valor={`${resultado.maximo} m`} formatar={false} partes={resultado.partes} total={`${resultado.maximo} m`} />
      {resultado.caiu ? <span>Caído</span> : <label>Distância <input aria-label="Distância Percorrida no Pulo" className={`${campo} w-20`} type="number" min="0.01" max={resultado.maximo} step="any" value={distancia === "" ? resultado.maximo : distancia} onChange={(e) => setDistancia(e.target.value)} /></label>}
      {saltador && <label className="inline-flex items-center gap-1"><input type="checkbox" checked={paredeAoFim} onChange={(e) => setParede(e.target.checked)} />Junto a Parede ou Objeto</label>}
      {saltador && alvos.length > 0 && <Alvo alvos={alvos} valor={alvoId} onValor={setAlvoId} rotulo="Alvo em Alcance Corpo a Corpo ao Aterrissar" vazio="Alvo em Alcance Corpo a Corpo" />}
      <button type="button" className={botao} disabled={!emSeuTurno || pendente.sorte?.escolha === null} onClick={concluir}>Concluir Pulo</button>
    </>}
    <Erro erro={erro ?? (!pendente ? alcance.erro : null)} />
  </div>;
}

/** Efeitos adicionais concedidos na arma e testes do Sangramento resultante. */
export default function PainelConteudo({ derived, sessao, onSessao, alvos = [], onOperacaoAlvo = null, emSeuTurno = true, g2 = false }) {
  const [ataqueId, setAtaqueId] = useState(""), [danoId, setDanoId] = useState(""), [alvo, setAlvo] = useState(""),
    [acertou, setAcertou] = useState(false), [superficie, setSuperficie] = useState(false), [erro, setErro] = useState(null), [distancia, setDistancia] = useState(3);
  const criticos = (sessao.log ?? []).filter((r) => r.tipoTeste === "ataque" && r.critico && derived.dano.entradas.some((l) => l.id === r.armaId && l.efeitoCritico));
  const ataque = criticos.find((r) => r.id === ataqueId), linha = derived.dano.entradas.find((l) => l.id === ataque?.armaId);
  const sangramentos = (sessao.condicoes ?? []).filter((c) => c.sangramento?.origem === "criticoArma");
  const temAtaque = onOperacaoAlvo && (sessao.log ?? []).some((r) => r.tipoTeste === "ataque" && r.armaId);
  if (!criticos.length && !sangramentos.length && !temAtaque && !sessao.combate?.ativo) return null;
  /* G2: o Pular é a própria seção. O que sobra (confirmação, Efeito de Crítico, Sangramento) fica no cartão de sempre, só quando existe. */
  const pularG2 = g2 && sessao.combate?.ativo ? <PularDoItem g2 derived={derived} sessao={sessao} onSessao={onSessao} emSeuTurno={emSeuTurno} alvos={alvos} /> : null;
  if (g2 && !criticos.length && !sangramentos.length && !temAtaque) return pularG2;
  return <>
    {pularG2}
  <section className={g2 ? "afty-card m-conteudo-g2 p-3 space-y-2" : "afty-card p-3 space-y-2"}>
    {!g2 && sessao.combate?.ativo && <div className="space-y-2"><h2 className="afty-card-titulo">Pular</h2><PularDoItem derived={derived} sessao={sessao} onSessao={onSessao} emSeuTurno={emSeuTurno} alvos={alvos} /></div>}
    <ConfirmacaoAtaque derived={derived} sessao={sessao} alvos={alvos} onOperacaoAlvo={onOperacaoAlvo} />
    {criticos.length > 0 && <>
      <h2 className="afty-card-titulo">Efeito de Crítico</h2>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select aria-label="Crítico da Arma" className={campo} value={ataqueId} onChange={(e) => setAtaqueId(e.target.value)}><option value="">Selecione o Crítico</option>{criticos.map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
        <Alvo alvos={alvos} valor={alvo} onValor={setAlvo} rotulo="Alvo do Crítico" />
        <label><input type="checkbox" checked={acertou} onChange={(e) => setAcertou(e.target.checked)} />Acertou</label>
        {linha?.efeitoCritico?.superficie && <label><input type="checkbox" checked={superficie} onChange={(e) => setSuperficie(e.target.checked)} />Adjacente à Superfície</label>}
        {linha?.efeitoCritico?.grupo === "bastao" && <label>Metros <input aria-label="Distância do Crítico de Bastão" className={`${campo} w-16`} type="number" min="0" max="3" step="0.5" value={distancia} onChange={(e) => setDistancia(Number(e.target.value))} /></label>}
        {linha?.efeitoCritico?.secundario && <>
          <label><input type="checkbox" checked={superficie} onChange={(e) => setSuperficie(e.target.checked)} />Adjacente ao Alvo do Crítico</label>
          <select aria-label="Dano do Crítico" className={campo} value={danoId} onChange={(e) => setDanoId(e.target.value)}><option value="">Selecione o Dano</option>{(sessao.log ?? []).filter((r) => r.tipo === "dano" && r.critico && r.armaId === linha.id).map((r) => <option key={r.id} value={r.id}>{r.rotulo}: {r.total}</option>)}</select>
        </>}
        <button type="button" className={botao} disabled={!onOperacaoAlvo || !alvo || !ataque || !acertou} onClick={() => {
          const p = pedido(), entrada = { operacao: "critico", ataqueId, danoId, acertou, superficie, adjacente: superficie,
            ...(linha.efeitoCritico.grupo === "bastao" ? { distancia } : {}) };
          const r = onOperacaoAlvo(alvo, (s, d, sa, da) => conteudoComAlvo(s, d, sa, da, entrada, p)); setErro(r?.erro ?? null);
        }}>Aplicar Efeito de Crítico</button>
      </div>
    </>}
    {sangramentos.map((c) => <div key={c.id} className="flex flex-wrap items-center gap-2 text-xs"><span>Sangramento {c.sangramento.dados}d{c.sangramento.faces}</span>
      <button type="button" className={botao} onClick={() => { const r = testaSangramentoCritico(sessao, derived, { id: c.id, fimTurno: true }, pedido()); setErro(r.erro ?? null); if (r.aplicado) onSessao(() => r.sessao); }}>Fortitude CD {c.sangramento.cd} no Fim do Turno</button>
    </div>)}
    <Erro erro={erro} />
  </section>
  </>;
}
