import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { NumeroComFontes } from "../ui/fontes";
import { novaOperacao } from "./ficha-uso";
import { usosGastosDe } from "./ficha-sessao";
import { rolarTeste } from "./ficha-rolagem";
import {
  usaVigorMaldito, usaEnergiaAntinatural, usaVooAnatomia, novoDiaOrigem, recebeDanoOrigem,
  evitaDesmembramento, devoraEnergia, comandoInumaki, curaHerancaMaldita, origemComAlvo, testeVenenoOrigem,
} from "./ficha-origens";

const botao = "afty-botao px-2 py-1 text-xs disabled:opacity-40";
const campo = "afty-input min-w-0 rounded border px-2 py-1 text-xs";

export default function PainelOrigens({ derived, sessao, onSessao, alvos = [], onOperacaoAlvo = null }) {
  const [erro, setErro] = useState(null);
  const [usos, setUsos] = useState(1);
  const [reacao, setReacao] = useState(false);
  const [alvo, setAlvo] = useState("");
  const [aliado, setAliado] = useState("");
  const [total, setTotal] = useState(0);
  const [tipo, setTipo] = useState("ct");
  const [adicional, setAdicional] = useState(0);
  const [incompreensivel, setIncompreensivel] = useState(false);
  const [alma, setAlma] = useState(false);
  const [reduzir, setReduzir] = useState(false);
  const [corpo, setCorpo] = useState(false);
  const [tr, setTr] = useState("falha");
  const [primeiraVisao, setPrimeiraVisao] = useState(false);
  const [hostil, setHostil] = useState(false);
  const [cura, setCura] = useState(0);
  const [pontos, setPontos] = useState(1);
  const [cdTr, setCdTr] = useState(10);
  const [resistencia, setResistencia] = useState("fortitude");
  const o = derived.origensUso;
  if (!o || !(o.vigor || o.energia || o.inumaki || o.resiliencia || o.heranca || o.anatomias.length)) return null;
  const executar = (operacao, entrada = {}) => {
    const r = operacao(sessao, derived, entrada, { opId: novaOperacao(), registraAcao: true });
    setErro(r.erro ?? null);
    if (r.aplicado) onSessao(() => r.sessao);
    return r;
  };
  const executarAlvo = (entrada) => {
    const pedido = { opId: novaOperacao(), registraAcao: true };
    const r = onOperacaoAlvo?.(alvo, (s, d, a, da) => origemComAlvo(s, d, a, da, { ...entrada, alvoId: alvo }, pedido));
    setErro(r?.erro ?? null);
  };
  const restante = (u) => Math.max(0, u.max - usosGastosDe(sessao, u.chave));
  return <section className="afty-card p-3 space-y-3" aria-label="Recursos de Origem">
    <h2 className="afty-card-titulo">Origem</h2>
    {o.visaoNoEscuro && <span className="afty-rotulo text-xs">{o.ignoraEscuridao ? "Ignora Escuridão Leve e Total" : "Visão no Escuro"}</span>}
    {o.ignoraTerrenoSolo && <span className="afty-rotulo text-xs ml-2">Ignora Terreno Difícil no Solo</span>}
    {o.imuneDoencas && <span className="afty-rotulo text-xs">Imune a Doenças Mundanas</span>}
    {(o.inumaki || o.sangueToxico || o.presenca) && onOperacaoAlvo && <label className="flex items-center gap-2 text-xs">
      Alvo <select className={campo} aria-label="Alvo da Origem" value={alvo} onChange={(e) => setAlvo(e.target.value)}>
        <option value="">Escolher Alvo</option>{alvos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
      </select>
    </label>}
    {o.vigor && <div className="flex flex-wrap gap-2 items-center text-xs">
      <span>Vigor Maldito</span><NumeroComFontes valor={o.vigor.cura} partes={o.vigor.partes} />
      <span>{restante(o.vigor.usos)}/{o.vigor.usos.max}</span>
      <label>Usos <input className={`${campo} w-14`} aria-label="Usos de Vigor Maldito" type="number" min="1" max={restante(o.vigor.usos)} value={usos} onChange={(e) => setUsos(Number(e.target.value))} /></label>
      {o.vigor.reacao && <label className="flex gap-1 items-center"><input type="checkbox" checked={reacao} onChange={(e) => setReacao(e.target.checked)} />Reação ao Receber Dano</label>}
      <button type="button" className={botao} disabled={!restante(o.vigor.usos)} onClick={() => executar(usaVigorMaldito, { usos, reacao, recebeuDano: reacao })}>Curar</button>
    </div>}
    {o.energia && <div className="flex flex-wrap gap-2 items-center text-xs">
      <span>Energia Antinatural</span><NumeroComFontes valor={o.energia.pe} partes={o.energia.partes} /><span>PE</span>
      {o.energia.temporario > 0 && <><NumeroComFontes valor={o.energia.temporario} partes={o.energia.partesTemporario} /><span>PE Temporários</span></>}
      <span>{restante(o.energia.usos)}/{o.energia.usos.max}</span>
      <button type="button" className={botao} disabled={!restante(o.energia.usos)} onClick={() => executar(usaEnergiaAntinatural)}>Recuperar ({o.energia.acao === "livre" ? "Ação Livre" : "Ação Bônus"})</button>
    </div>}
    {o.anatomias.includes("capacidade_voo") && <button type="button" className={botao}
      disabled={!!sessao.uso?.ativos?.anatomia_voo} onClick={() => executar(usaVooAnatomia)}>Voar (1 PE)</button>}
    {(o.alma || o.energia?.usos.recarga === "manual") && <button type="button" className={`${botao} ml-2`} onClick={() => executar(novoDiaOrigem)}>Novo Dia</button>}
    {o.inumaki && <div className="flex flex-wrap gap-2 items-center text-xs">
      <span>Olhos de Cobra e Presas ({restante(o.inumaki.usos)}/{o.inumaki.usos.max})</span>
      {!onOperacaoAlvo && <input aria-label="Aliado do Comando" className={campo} value={aliado} onChange={(e) => setAliado(e.target.value)} placeholder="Aliado" />}
      <button type="button" className={botao} disabled={!restante(o.inumaki.usos) || !(onOperacaoAlvo ? alvo : aliado.trim())}
        onClick={() => onOperacaoAlvo ? executarAlvo({ operacao: "comando", aliado: alvos.find((a) => a.id === alvo)?.nome }) : executar(comandoInumaki, { aliado })}>Comandar Ação Bônus</button>
    </div>}
    {o.heranca && <div className="flex flex-wrap gap-2 items-center text-xs">
      <span>Herança Maldita</span>
      <input aria-label="Energia Reversa Recebida" className={`${campo} w-16`} type="number" min="0" value={cura} onChange={(e) => setCura(Number(e.target.value))} />
      <button type="button" className={botao} onClick={() => executar(curaHerancaMaldita, { externa: true, valor: cura })}>Receber Cura Reversa</button>
      {derived.cura?.linhas?.some((l) => l.id === "cura_energia_reversa") && <>
        <input aria-label="Pontos de Cura de Herança Maldita" className={`${campo} w-14`} type="number" min="1" value={pontos} onChange={(e) => setPontos(Number(e.target.value))} />
        <button type="button" className={botao} onClick={() => executar(curaHerancaMaldita, { pontos })}>Curar com Energia Amaldiçoada</button>
      </>}
    </div>}
    {(o.bonusVeneno || o.vantagemVeneno) && <div className="flex flex-wrap gap-2 items-center text-xs">
      <label>CD <input aria-label="CD de Veneno" className={`${campo} w-16`} type="number" value={cdTr} onChange={(e) => setCdTr(Number(e.target.value))} /></label>
      <button type="button" className={botao} onClick={() => executar(testeVenenoOrigem, { cd: cdTr })}>TR contra Veneno</button>
    </div>}
    {o.anatomias.includes("devorador_energia") && <div className="flex flex-wrap gap-2 items-center text-xs">
      <span>TR contra Feitiço</span>
      <select aria-label="TR de Devorador de Energia" className={campo} value={resistencia} onChange={(e) => setResistencia(e.target.value)}>
        {(derived.testes?.resistencias ?? []).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <label>CD <input aria-label="CD de Devorador de Energia" type="number" className={`${campo} w-16`} value={cdTr} onChange={(e) => setCdTr(Number(e.target.value))} /></label>
      <button type="button" className={botao} onClick={() => {
        const teste = derived.testes.resistencias.find((r) => r.value === resistencia);
        const r = rolarTeste({ rotulo: teste.label, bonus: teste.bonus, dados: teste.dadosExtras, cd: cdTr });
        const resultado = devoraEnergia(sessao, derived, { feitico: true, sucesso: r.sucesso, eventoId: r.id }, { opId: novaOperacao() });
        setErro(resultado.erro ?? null);
        onSessao(() => ({ ...resultado.sessao, log: [r, ...resultado.sessao.log] }));
      }}>Rolar TR</button>
    </div>}
    {(o.resiliencia || o.alma || o.chanceIncompreensivel || o.sangueToxico) && <details>
      <summary className="text-xs cursor-pointer">Dano Recebido</summary>
      <div className="flex flex-wrap gap-2 items-center mt-2 text-xs">
        <label>Dano <input aria-label="Dano Recebido da Origem" className={`${campo} w-20`} type="number" min="0" value={total} onChange={(e) => setTotal(Number(e.target.value))} /></label>
        <select aria-label="Tipo de Dano Recebido da Origem" className={campo} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {(derived.defesasDano?.linhas ?? []).map((l) => <option key={l.tipo} value={l.tipo}>{l.label}</option>)}
        </select>
        {tipo === "alma" && <select aria-label="Resultado de Integridade" className={campo} value={tr} onChange={(e) => setTr(e.target.value)}><option value="falha">Falha de Integridade</option><option value="sucesso">Sucesso de Integridade</option><option value="critico">Sucesso Crítico de Integridade</option></select>}
        {o.alma && tipo === "alma" && <label><input type="checkbox" checked={alma} onChange={(e) => setAlma(e.target.checked)} />Alma Maldita ({restante(o.alma.usos)})</label>}
        {o.resiliencia && <label><input type="checkbox" checked={reduzir} onChange={(e) => setReduzir(e.target.checked)} />Resiliência Imediata ({restante(o.resiliencia.usos)})</label>}
        {o.chanceIncompreensivel > 0 && <>
          <label><input type="checkbox" checked={incompreensivel} onChange={(e) => setIncompreensivel(e.target.checked)} />Crítico ou Ataque Furtivo</label>
          {incompreensivel && <label>Adicional <input aria-label="Dano Adicional de Crítico ou Furtivo" className={`${campo} w-16`} type="number" min="0" max={total} value={adicional} onChange={(e) => setAdicional(Number(e.target.value))} /></label>}
        </>}
        {o.sangueToxico > 0 && <label><input type="checkbox" checked={corpo} onChange={(e) => setCorpo(e.target.checked)} />Ataque Corpo a Corpo</label>}
        <button type="button" className={botao} disabled={!!(onOperacaoAlvo && corpo && o.sangueToxico && !alvo)} onClick={() => {
          const entrada = { total, tipo, adicional, incompreensivel, critico: incompreensivel, almaMaldita: alma && tipo === "alma", resiliencia: reduzir && tipo !== "alma", corpoACorpo: corpo,
            tr: tipo === "alma" ? { resultado: tr === "falha" ? "falha" : "sucesso", sucessoCritico: tr === "critico" } : null };
          if (onOperacaoAlvo && corpo && o.sangueToxico) executarAlvo(entrada);
          else executar(recebeDanoOrigem, entrada);
        }}>Aplicar Dano</button>
        {o.resiliencia && <button type="button" className={botao} disabled={!restante(o.resiliencia.usos)} onClick={() => executar(evitaDesmembramento)}>Evitar Desmembramento</button>}
      </div>
    </details>}
    {o.presenca && onOperacaoAlvo && <div className="flex flex-wrap gap-2 items-center text-xs">
      <span title="Presença Nefasta">Vontade CD {o.presenca.cd}</span>
      <label><input type="checkbox" checked={hostil} onChange={(e) => setHostil(e.target.checked)} />Hostil</label>
      <label><input type="checkbox" checked={primeiraVisao} onChange={(e) => setPrimeiraVisao(e.target.checked)} />Primeiro Avistamento</label>
      <select aria-label="TR de Presença Nefasta" className={campo} value={tr} onChange={(e) => setTr(e.target.value)}><option value="falha">Falha</option><option value="sucesso">Sucesso</option></select>
      <button type="button" className={botao} disabled={!alvo || !hostil || !primeiraVisao} onClick={() => executarAlvo({ operacao: "presenca", hostil, viu: primeiraVisao, sucesso: tr === "sucesso" })}>Aplicar Presença Nefasta</button>
    </div>}
    {erro && <p className="text-xs text-amber-400 flex items-center gap-1.5" role="alert"><AlertTriangle className="w-3 h-3" />{erro}</p>}
  </section>;
}
