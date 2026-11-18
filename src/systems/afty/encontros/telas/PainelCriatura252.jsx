import React, { useEffect, useMemo, useState } from "react";
import {
  Heart, Zap, Sparkles, ShieldHalf, Shield, Swords, ScrollText, Activity, Plus, X, Minus, Crosshair, Lock, ShieldAlert,
} from "lucide-react";

import * as V from "../motores/m252-vital";
import { Vital } from "../../ui/vital";
import { DicaDeTexto } from "../../ui/fontes";
import { Aviso, BarraCurta, Vazio } from "./pecas-encontro";

/**
 * ============================================================
 * O PAINEL DA CRIATURA DA 2.5.2 NO ENCONTRO NOVO (etapa 6a, 2026-11-17)
 * ============================================================
 * A criatura do `/` no visual da Ficha G2 (tokens `--afty-*`, `Vital`,
 * `afty-card`), por cima do adaptador da 2.5.2 (`motores/m252.js` e
 * `m252-vital.js`, cópia fiel da conta do `CombatantPanel`). Nada aqui importa de
 * `src/components`, e nenhuma conta mora aqui: cada controle manda uma operação
 * (os verbos tipados para Vida, PE, Alma e condições) ou um passo do motor
 * (`onPasso`, a operação genérica) para as outras chaves do `combatState`.
 *
 * Regiões (a lista do que o `/` não pode perder, etapa 4): Vitais com PV e PE
 * temporário, Guarda Inabalável, Desafiando a Morte com o
 * Suscetível, Defesas e RD com Ignorar RD, Testes de Resistência, Resistência
 * Parcial e Total, Condições com quem aplicou, Modificadores, Ações e
 * Habilidades. Sem campo de Dano Rápido (autor, 2026-11-17): a Vida aceita "-12" e "+5", que passam pelos
 * verbos tipados (com RD e Guarda), e a barra de ações em grupo faz o resto. Desde a 6b (2026-11-17) também: Habilidades Ativáveis
 * (`ativarRegra`, com o retorno de cada uso), Reações ao Sofrer Dano, o formulário de modificador manual, os Ajustes de Combate
 * (Guarda Absorve Primeiro, RD Reduz o Dano, gravados no snapshot pela ação `AJUSTAR_COMBATE`) e o aviso de condição imune.
 * O Atualizar da Ficha mora no cabeçalho do escolhido (`LutaDoMestre.jsx`).
 * ============================================================
 */

/* Origem: src/components/fm-action-calc.js:27 (`ACTION_TYPE_LABELS`), copiado para a tela não importar de src/components. */
const TIPO_DE_ACAO = {
  comum: "Ação Comum", bonus: "Ação Bônus", rapida: "Ação Rápida", reacao: "Reação", movimento: "Movimento", livre: "Livre",
};

const TR = [
  ["astucia", "Astúcia"], ["fortitude", "Fortitude"], ["reflexos", "Reflexos"], ["vontade", "Vontade"], ["integridade", "Integridade"],
];

const titulo = (s) => String(s ?? "").replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const numero = (v) => (typeof v === "number" ? (Number.isInteger(v) ? v : v.toLocaleString("pt-BR")) : v ?? "0");

function Secao({ titulo: t, icone: Icone, contagem: n, direita = null, children }) {
  return (
    <section className="afty-card ec-secao">
      <div className="ec-secao-topo">
        <h3 className="afty-card-titulo" data-afty-linha>{Icone && <Icone aria-hidden="true" />}{t}{n != null && <small>{n}</small>}</h3>
        {direita}
      </div>
      {children}
    </section>
  );
}

function Contador({ rotulo, usados, max, onMudar }) {
  const restam = Math.max(0, max - usados);
  return (
    <div className="ec-contador">
      <span className="ec-contador-rotulo">{rotulo}</span>
      <span className="ec-contador-num afty-base"><b>{restam}</b><small>/{max}</small></span>
      <span className="ec-contador-botoes">
        <button type="button" className="afty-botao" onClick={() => onMudar(V.contadorGastar(usados, max))} disabled={restam <= 0}>Gastar</button>
        <button type="button" className="afty-botao" onClick={() => onMudar(V.contadorRecuperar(usados))} disabled={usados <= 0}>Recuperar</button>
      </span>
    </div>
  );
}

function NovaCondicao({ combatentes, alvoId, imunes = [], ativas = [], onAdicionar }) {
  const [nome, setNome] = useState("");
  const [aplicador, setAplicador] = useState("");
  const faixas = V.CONDICOES_252 ?? {};
  const imune = !!nome && imunes.some((i) => V.normCond(i) === V.normCond(nome));
  const repetida = !!nome && ativas.some((a) => V.normCond(a) === V.normCond(nome));
  return (
    <div className="ec-nova-condicao">
      <select className="ec-campo" value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Condição">
        <option value="">Escolher Condição</option>
        {Object.entries(faixas).map(([faixa, nomes]) => (
          <optgroup key={faixa} label={titulo(faixa)}>
            {nomes.map((n) => <option key={n} value={n}>{titulo(n)}</option>)}
          </optgroup>
        ))}
      </select>
      <select className="ec-campo" value={aplicador} onChange={(e) => setAplicador(e.target.value)} aria-label="Aplicado Por" title="Aplicado Por">
        <option value="">Aplicado Pela Própria</option>
        {combatentes.filter((c) => c.id !== alvoId).map((c) => <option key={c.id} value={c.id}>Aplicado por {c.nome}</option>)}
      </select>
      <button type="button" className="afty-botao" disabled={!nome || repetida} onClick={() => { onAdicionar(nome, aplicador || null); setNome(""); }}>
        <Plus aria-hidden="true" />Adicionar
      </button>
      {imune && <Aviso>{titulo(nome)}: a criatura é imune a esta condição</Aviso>}
      {repetida && <Aviso>{titulo(nome)} já está ativa</Aviso>}
    </div>
  );
}

/* O formulário de modificador à mão. Origem: CombatantPanel.jsx:733-780 e 840-900 (`ModifierManager`), a conta em `novoModificadorManual`. */
function NovoModificador({ onAdicionar }) {
  const [f, setF] = useState({ nome: "", stat: "defesa", op: "add", valor: "2", empilha: "sum", duracao: "manual", rodadas: "3" });
  const muda = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const pronto = V.novoModificadorManual(f, V.rotuloDoAlvo);
  return (
    <div className="ec-novo-modificador">
      <input className="ec-campo" value={f.nome} onChange={muda("nome")} placeholder="Nome" aria-label="Nome do Modificador" />
      <select className="ec-campo" value={f.stat} onChange={muda("stat")} aria-label="Alvo do Modificador">
        {V.ALVOS_DO_MODIFICADOR.map((g) => (
          <optgroup key={g.label} label={g.label}>{g.items.map((t) => <option key={t.key} value={t.key}>{titulo(t.label)}</option>)}</optgroup>
        ))}
      </select>
      <select className="ec-campo ec-campo-curto" value={f.op} onChange={muda("op")} aria-label="Operação">
        {V.OPERACOES_DO_MODIFICADOR.map((o) => <option key={o.key} value={o.key}>{titulo(o.label)}</option>)}
      </select>
      <input className="ec-campo ec-campo-num" inputMode="numeric" value={f.valor} onChange={(e) => setF((x) => ({ ...x, valor: e.target.value.replace(/[^\d-]/g, "") }))} aria-label="Valor do Modificador" />
      <select className="ec-campo ec-campo-curto" value={f.empilha} onChange={muda("empilha")} aria-label="Empilhamento">
        {V.EMPILHAMENTOS.map((o) => <option key={o.key} value={o.key}>{titulo(o.label)}</option>)}
      </select>
      <select className="ec-campo ec-campo-curto" value={f.duracao} onChange={muda("duracao")} aria-label="Duração do Modificador">
        {V.DURACOES_DO_MODIFICADOR.map((o) => <option key={o.key} value={o.key}>{titulo(o.label)}</option>)}
      </select>
      {f.duracao === "rounds" && (
        <input className="ec-campo ec-campo-num" inputMode="numeric" value={f.rodadas} onChange={(e) => setF((x) => ({ ...x, rodadas: e.target.value.replace(/[^\d]/g, "") }))} aria-label="Rodadas do Modificador" />
      )}
      <button type="button" className="afty-botao" disabled={!pronto} onClick={() => { onAdicionar(pronto); setF((x) => ({ ...x, nome: "", valor: "2" })); }}>
        <Plus aria-hidden="true" />Adicionar
      </button>
    </div>
  );
}

/* Os botões de uma regra: Ativar, Desativar ou Usar, com o custo e o motivo do bloqueio. Origem: CombatantPanel.jsx:576-618. */
function BotoesDeRegra({ entidade, grupo, regras, estado, contexto, onAtivar }) {
  return (
    <div className="ec-regras">
      {regras.map((r) => {
        const e = V.estadoDaRegra(r, estado, contexto);
        return (
          <button
            key={r.id} type="button" className="ec-alternar" aria-pressed={e.ativa} disabled={e.bloqueada}
            title={e.motivo ?? e.rotulo} onClick={() => onAtivar(r, entidade, grupo)}
          >
            <Zap aria-hidden="true" />{e.rotulo}: {r.name}{e.custo > 0 && <small>{e.custo} PE</small>}{e.bloqueada && <Lock aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

/* O retorno de um uso (o toast do painel de antes): some sozinho depois de 2,6 s. */
function Retorno({ retorno, onLimpar }) {
  useEffect(() => {
    if (!retorno) return undefined;
    const t = setTimeout(onLimpar, 2600);
    return () => clearTimeout(t);
  }, [retorno, onLimpar]);
  if (!retorno) return null;
  return retorno.kind === "block"
    ? <Aviso onFechar={onLimpar}>{retorno.text}</Aviso>
    : <p className="ec-retorno" role="status" data-kind={retorno.kind}><Zap aria-hidden="true" />{retorno.text}</p>;
}

export default function PainelCriatura252({ combatente: c, derivado: d, estado: cs, resumo, combatentes, acoes }) {
  const passo = (fn) => acoes.sessao(c.id, (s) => fn(s));
  const morte = useMemo(() => V.desafiandoAMorte(cs, { abatido: c.flags.abatido }), [cs, c.flags.abatido]);
  const nomes = useMemo(() => new Map(combatentes.map((x) => [x.id, x.nome])), [combatentes]);
  const extras = useMemo(() => (cs && d ? V.extrasDoPainel(d, cs) : null), [d, cs]);
  const [retorno, setRetorno] = useState(null);
  const limparRetorno = useMemo(() => () => setRetorno(null), []);
  const ativar = (regra, entidade, grupo) => {
    let feito = null;
    acoes.sessao(c.id, (x) => {
      const r = V.ativarRegra(x, d, regra, entidade, grupo, { combatenteId: c.id });
      feito = r.feedback;
      return r.estado;
    });
    if (feito) setRetorno(feito);
  };

  if (!d || !cs) {
    return (
      <section className="afty-card ec-secao">
        <Aviso>Ficha sem Cálculo: os números de {c.nome} não puderam ser montados</Aviso>
      </section>
    );
  }
  const s = d.stats ?? {};
  const snap = d.snapshot ?? {};
  const acoesDaFicha = snap.actions?.list ?? [];
  const habilidades = (snap.features ?? []).filter(Boolean);
  const condicoes = cs.activeConditions ?? [];
  const daAlma = d.almaEstado?.condicoes ?? [];
  const modificadores = (cs.activeModifiers ?? []).filter(Boolean);
  const guardaMax = s.guardaInabavalMax ?? 0;
  const ajustes = d.combatSettings ?? {};
  const rdReduz = ajustes.rdReducao ?? true;
  const guardaAbsorve = ajustes.guardaAbsorbsFirst ?? true;

  return (
    <div className="ec-p252">
      <section className="afty-card ec-secao">
        <div className="ec-p252-vitais">
          <Vital
            tipo="pv" icone={Heart} rotulo="PV"
            atual={resumo?.pv ?? cs.hpCurrent} max={resumo?.pvMax ?? 0} temp={resumo?.pvTemp ?? 0}
            onSet={(v) => passo((x) => V.emVital(x, d, "hp", v))}
            onDelta={(n) => (n < 0 ? acoes.dano(c.id, -n) : acoes.cura(c.id, n))}
          />
          <Vital
            tipo="pe" icone={Zap} rotulo="PE"
            atual={resumo?.pe ?? cs.peCurrent} max={resumo?.peMax ?? 0} temp={resumo?.peTemp ?? 0} rotuloTemp="PE Temporário"
            onSet={(v) => passo((x) => V.emVital(x, d, "pe", v))}
            onDelta={(n) => acoes.operar({ tipo: n < 0 ? "gastarPe" : "recuperarPe", alvo: c.id, entrada: { valor: Math.abs(n) } })}
          />
          <Vital
            tipo="alma" icone={Sparkles} rotulo="Alma"
            atual={resumo?.alma ?? 0} max={resumo?.almaMax ?? 0}
            aviso={d.almaEstado?.penalidade ? `Estado da Alma: ${d.almaEstado.label}` : null}
            onSet={(v) => acoes.operar({ tipo: "alma", alvo: c.id, entrada: { modo: "definir", valor: v } })}
            onDelta={(n) => acoes.operar({ tipo: "alma", alvo: c.id, entrada: { modo: n < 0 ? "dano" : "cura", valor: Math.abs(n) } })}
          />
        </div>
        {guardaMax > 0 && (
          <div className="ec-guarda">
            <BarraCurta tipo="guarda" rotulo="Guarda Inabalável" atual={cs.guardaInabavalCurrent ?? 0} max={guardaMax} />
            <span className="ec-guarda-botoes">
              <button type="button" className="afty-passo" onClick={() => passo((x) => V.emVital(x, d, "guarda", (x.guardaInabavalCurrent ?? 0) - 1))} aria-label="Guarda Menos 1" title="Guarda Menos 1"><Minus aria-hidden="true" /></button>
              <button type="button" className="afty-passo" onClick={() => passo((x) => V.emVital(x, d, "guarda", (x.guardaInabavalCurrent ?? 0) + 1))} aria-label="Guarda Mais 1" title="Guarda Mais 1"><Plus aria-hidden="true" /></button>
            </span>
          </div>
        )}
        {morte.ativo && (
          <Aviso acao={(
            <button type="button" className="ec-alternar" aria-pressed={morte.suscetivel} onClick={() => passo((x) => V.emSuscetivel(x, !morte.suscetivel))}>
              Suscetível à Finalização
            </button>
          )}>
            Desafiando a Morte: CD {morte.cd}
          </Aviso>
        )}
      </section>

      {extras.ativaveis.length > 0 && (
        <Secao titulo="Habilidades Ativáveis" icone={Zap} contagem={extras.ativaveis.reduce((n, e) => n + e.regras.length, 0)}>
          <ul className="ec-ativaveis">
            {extras.ativaveis.map((e) => (
              <li key={e.id}>
                <span className="ec-ativavel-nome" title={e.nome}>{e.nome}</span>
                <BotoesDeRegra entidade={e.nome} grupo={e.grupo} regras={e.regras} estado={cs} contexto={extras.contexto} onAtivar={ativar} />
              </li>
            ))}
          </ul>
          <Retorno retorno={retorno} onLimpar={limparRetorno} />
        </Secao>
      )}
      {extras.ativaveis.length === 0 && <Retorno retorno={retorno} onLimpar={limparRetorno} />}

      {extras.reacoes.length > 0 && (cs.lastDamage ?? 0) > 0 && (
        <Secao titulo="Reações ao Sofrer Dano" icone={ShieldAlert} direita={<span className="afty-base">Último Dano <b className="afty-valor">{cs.lastDamage}</b></span>}>
          <div className="ec-regras">
            {extras.reacoes.map(({ rule, entityName, group }) => {
              const fx = V.efeitoDaRegra(rule, extras.contexto);
              return (
                <button key={rule.id} type="button" className="ec-alternar" title={`${entityName}: Reagir`} onClick={() => ativar(rule, entityName, group)}>
                  <Zap aria-hidden="true" />Reagir: {rule.name}{fx && <small>{fx}</small>}
                </button>
              );
            })}
          </div>
        </Secao>
      )}

      <div className="ec-p252-grade">
        <Secao titulo="Defesas" icone={Shield}>
          <dl className="ec-stats">
            {[["Defesa", s.defesa], ["Atenção", s.atencao], ["Iniciativa", s.iniciativa], ["Deslocamento", `${numero(s.deslocamento)}m`],
              ["RD Geral", s.rdGeral], ["RD Irredutível", s.rdIrredutivel],
              ...(rdReduz ? [["RD no Próximo Dano", V.rdNoProximoDano(s, cs)]] : []), ["Acerto", s.acerto], ["CD", s.cdBase]].map(([k, v]) => (
              <div key={k} className="ec-stat"><dt>{k}</dt><dd className="afty-valor">{numero(v)}</dd></div>
            ))}
          </dl>
          <div className="ec-linha-controles">
            <button type="button" className="ec-alternar" aria-pressed={!!cs.ignorarRdAtivo} onClick={() => passo((x) => V.emIgnorarRdAtivo(x, !x.ignorarRdAtivo))}>
              Ignorar RD
            </button>
            <label className="ec-rotulado ec-rotulado-linha">
              <span>Ignorar Parte</span>
              <input
                className="ec-campo ec-campo-num" inputMode="numeric" disabled={!!cs.ignorarRdAtivo}
                value={cs.ignorarRdValor ?? 0}
                onChange={(e) => passo((x) => V.emIgnorarRdValor(x, Math.trunc(Number(e.target.value.replace(/[^\d]/g, "")) || 0)))}
              />
            </label>
          </div>
          <div className="ec-linha-controles">
            <button type="button" className="ec-alternar" aria-pressed={guardaAbsorve} onClick={() => acoes.ajustarCombate(c.id, { guardaAbsorbsFirst: !guardaAbsorve })}>
              Guarda Absorve Primeiro
            </button>
            <button type="button" className="ec-alternar" aria-pressed={rdReduz} onClick={() => acoes.ajustarCombate(c.id, { rdReducao: !rdReduz })}>
              RD Reduz o Dano
            </button>
          </div>
        </Secao>

        <Secao titulo="Testes de Resistência" icone={ShieldHalf}>
          <dl className="ec-stats">
            {TR.map(([k, r]) => <div key={k} className="ec-stat"><dt>{r}</dt><dd className="afty-valor">+{numero(d.saves?.[k] ?? 0)}</dd></div>)}
          </dl>
          {(s.resistenciaParcialMax > 0 || s.resistenciaTotalMax > 0) && (
            <div className="ec-contadores">
              {s.resistenciaParcialMax > 0 && (
                <Contador rotulo="Resistência Parcial" usados={cs.resistenciaParcialUsed ?? 0} max={s.resistenciaParcialMax} onMudar={(v) => passo((x) => V.emResistenciaParcial(x, v))} />
              )}
              {s.resistenciaTotalMax > 0 && (
                <Contador rotulo="Resistência Total" usados={cs.resistenciaTotalUsed ?? 0} max={s.resistenciaTotalMax} onMudar={(v) => passo((x) => V.emResistenciaTotal(x, v))} />
              )}
            </div>
          )}
        </Secao>
      </div>

      <Secao titulo="Condições" icone={Activity} contagem={condicoes.length + daAlma.length}>
        {condicoes.length + daAlma.length === 0 ? <p className="ec-vazio-linha">Nenhuma Condição</p> : (
          <ul className="ec-condicoes">
            {condicoes.map((x) => (
              <li key={x.id} className="ec-condicao">
                <span className="ec-condicao-nome">{titulo(x.name)}</span>
                <span className="ec-condicao-meta">
                  {x.duracao == null ? "Permanente" : `${x.duracao} ${x.duracao === 1 ? "Rodada" : "Rodadas"}`}
                  {x.aplicadorId && nomes.has(x.aplicadorId) ? ` · De ${nomes.get(x.aplicadorId)}` : ""}
                </span>
                <button type="button" className="afty-passo" onClick={() => acoes.operar({ tipo: "condicao", alvo: c.id, entrada: { modo: "remover", condicao: { id: x.id, name: x.name } } })} aria-label={`Tirar ${titulo(x.name)}`} title={`Tirar ${titulo(x.name)}`}>
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
            {daAlma.map((n) => (
              <li key={`alma:${n}`} className="ec-condicao" data-origem="alma">
                <span className="ec-condicao-nome">{titulo(n)}</span>
                <span className="ec-condicao-meta">Estado da Alma</span>
              </li>
            ))}
          </ul>
        )}
        <NovaCondicao
          combatentes={combatentes} alvoId={c.id}
          imunes={extras.imunes} ativas={[...condicoes.map((x) => x.name), ...daAlma]}
          onAdicionar={(nome, aplicadorId) => acoes.operar({ tipo: "condicao", alvo: c.id, entrada: { modo: "adicionar", condicao: nome, ...(aplicadorId ? { aplicadorId } : {}) } })}
        />
      </Secao>

      <Secao titulo="Modificadores" icone={Crosshair} contagem={modificadores.filter(V.modificadorVisivel).length}>
        <ul className="ec-condicoes">
          {extras.passivos.map((m) => (
            <li key={m.id} className="ec-condicao" data-origem="passivo">
              <span className="ec-condicao-nome">{m.name}</span>
              <span className="ec-condicao-meta afty-base">{V.rotuloDoAlvo(m.stat)} {m.op === "set" ? `= ${m.value}` : `${m.value >= 0 ? "+" : ""}${m.value}`} · Passivo</span>
            </li>
          ))}
          {modificadores.filter(V.modificadorVisivel).map((m) => (
            <li key={m.id} className="ec-condicao">
              <span className="ec-condicao-nome">{m.name || m.stat}</span>
              <span className="ec-condicao-meta afty-base">
                {m.op === "set" ? `= ${m.value}` : `${m.value > 0 ? "+" : ""}${m.value}`} {V.rotuloDoAlvo(m.stat)}
                {m.duration?.kind === "rounds" ? ` · ${m.duration.rounds} ${m.duration.rounds === 1 ? "Rodada" : "Rodadas"}` : m.duration?.kind === "scene" ? " · Combate Inteiro" : ""}
                {m.aplicadorId && nomes.has(m.aplicadorId) ? ` · De ${nomes.get(m.aplicadorId)}` : ""}
              </span>
              <button type="button" className="afty-passo" onClick={() => passo((x) => V.emModificadorRemovido(x, m.id))} aria-label={`Tirar ${m.name || m.stat}`} title={`Tirar ${m.name || m.stat}`}>
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        {extras.passivos.length + modificadores.filter(V.modificadorVisivel).length === 0 && <p className="ec-vazio-linha">Nenhum Modificador</p>}
        <NovoModificador onAdicionar={(m) => passo((x) => V.emModificadorAdicionado(x, m))} />
      </Secao>

      <Secao titulo="Ações" icone={Swords} contagem={acoesDaFicha.length}>
        {acoesDaFicha.length === 0 ? <Vazio titulo="Nenhuma Ação na Ficha" /> : (
          <ul className="ec-acoes">
            {acoesDaFicha.map((a) => (
              <li key={a.id ?? a.name} className="ec-acao">
                <div className="ec-acao-topo">
                  <DicaDeTexto titulo={a.name} texto={a.description || a.finalTextManual || ""}>
                    <span className="ec-acao-nome">{a.name || "Ação"}</span>
                  </DicaDeTexto>
                  <span className="afty-chip">{TIPO_DE_ACAO[a.type] ?? titulo(a.type)}</span>
                </div>
                <div className="ec-acao-numeros afty-base">
                  {a.attackType === "acerto" && <span>Acerto <b className="afty-valor">+{a.toHit ?? 0}</b></span>}
                  {a.attackType !== "acerto" && a.cd != null && <span>CD <b className="afty-valor">{a.cd}</b>{a.trType ? ` ${titulo(a.trType)}` : ""}</span>}
                  {a.damage?.roll && <span>Dano <b className="afty-valor">{a.damage.roll}</b>{a.damage.type ? ` ${titulo(a.damage.type)}` : ""}</span>}
                  {a.range && <span>{a.range}</span>}
                  {a.cost > 0 && <span>Custo <b className="afty-valor ec-pe">{a.cost} PE</b></span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {habilidades.length > 0 && (
        <Secao titulo="Habilidades" icone={ScrollText} contagem={habilidades.length}>
          <ul className="ec-habilidades">
            {habilidades.map((h) => (
              <li key={h.id ?? h.name}>
                <DicaDeTexto titulo={h.name} texto={h.description || ""}>
                  <span className="ec-habilidade">{h.name}</span>
                </DicaDeTexto>
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </div>
  );
}
