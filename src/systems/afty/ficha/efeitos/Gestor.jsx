/* ============================================================
   O GERENCIADOR DE EFEITOS: um estado, duas apresentações
   ============================================================
   COMPLETA (aba Efeitos): administrar vários efeitos, e encontrar mais.
     Ao entrar, SÓ os ativos, numa coluna. Encontrar e o registro de fonte
     externa abrem ao lado quando pedidos (`tela.lado`), e fecham no X.
   COMPACTA (painel ao lado das abas): acompanhar e ajustar enquanto se usa a
     ficha. Só os ativos, com um filtro que leva direto aos do personagem.
     Encontrar e Registrar abrem a completa, com a busca ou o formulário
     prontos, e o painel estreito não alterna entre duas listas.

   Três momentos para cada efeito:
     LISTA      nome, o estado, o que está valendo, a duração que resta e o
                controle. Na completa, acúmulo, empate e cobertura saem da
                linha e ficam no detalhe. Atenção continua na linha.
     DETALHE    tudo o que dá, empate ou disputa, descrição, origem, o que a
                ficha não acompanha e a regra
     OPERAÇÃO   custo ANTES do clique, e o resultado curto logo abaixo da linha
   ENCONTRAR: a primeira leitura é a finalidade curta (e a condição decisiva,
     quando a frase curta a perderia). O texto médio fica na consulta.
   PV TEMPORÁRIO: concede (calculado), registrado (a concessão foi para a
     Vida) e resta (o que sobra no pote) são três coisas. Ver `beneficiosPvTemp`.
   ============================================================ */
import React, { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Hand, RotateCcw, X, Zap } from "lucide-react";
import { Sessao, condicoesPorForca } from "./ponte";
import { SANGRAMENTO_FAIXAS } from "../../afty-condicoes";
import { uid } from "./util";
import { Controle, Flutuante } from "./pecas";
import { estaLigado, compararTudo, ordenarConsequencias } from "./efeitos-dados";
import { prepararCalculo, fraseDoBeneficio, CANAIS_EXTERNOS, TIPOS_FONTE, buscarOrigem } from "./recebidos";

import { energia, semPvTemp } from "./gestor-logica";
import { inteiro } from "./preparo-logica";
/* PV Temporário calculado não é reserva: sai dos números "Na Ficha" e ganha bloco próprio. */

/* ============================================================
   PEÇAS
   ============================================================ */

/* O DESCONTO CONTEXTUAL (consolidação ampliada, 2026-10-16). O atalho de pagamento de um custo à mão abre um painel
   enxuto que SUBTRAI da Energia (`acoes.descontarEnergia`, o verbo de gasto de sempre), e não o painel geral com Definir.
   `valor`: o que a operação que originou o resultado já sabe (1 PE adicional, 9 PE inteiros, 2 PE da escolha). Sem valor
   conhecido o campo vem vazio, e o jogador diz quanto desconta: nenhum número é presumido. Abrir, editar o campo ou
   fechar não desconta nada, e o botão só gasta ao clique (ou Enter) conferido contra a Energia que a tela viu. */
/* Um número com o sinal escrito: entende-se sem cor. `destaque` pinta o
   negativo de vermelho, e só onde a consequência pede isso (o resultado). */
/* Na coluna estreita, "4 PE" e "por Rodada" não se partem: a quebra cai entre os dois. */
const NB = String.fromCharCode(160);

export function Numeros({ chips, destaque = false, max = null }) {
  if (!chips?.length) return null;
  const lista = max ? chips.slice(0, max) : chips;
  return (
    <span className="g-numeros">
      {lista.map((c) => (
        <span key={c.chave ?? c.rotulo} className="g-num" data-sinal={destaque && (c.valor ?? 0) < 0 ? "menos" : undefined}>
          <span>{c.rotulo}</span> <b>{c.texto}</b>
        </span>
      ))}
    </span>
  );
}

function Custo({ custo, m, nome, curto = false }) {
  if (!custo) return null;
  const texto = curto ? inteiro(custo.texto) : custo.texto;
  return custo.cobra
    ? <span className="g-custo" data-cobra="sim" title="A ficha desconta da Energia"><Zap aria-hidden="true" />{`Cobra ${texto}`}</span>
    : <span className="g-custo" title="A ficha não desconta: pague na Energia"><Hand aria-hidden="true" />{texto}{curto ? `${NB}à Parte` : <> à Parte <GastarNaEnergia m={m} nome={nome} /></>}</span>;
}

export function DescontarPainel({ m, nome, valor, onFechar }) {
  const rotulo = m.derived.recursoLabel || "Energia";
  const disponivel = energia(m.sessao);
  const casca = Sessao.peTempTotal(m.sessao);
  const [texto, setTexto] = useState(valor != null ? String(valor) : "");
  const [vista, setVista] = useState(disponivel);
  const [erro, setErro] = useState(null);
  const enviado = useRef(false);
  const n = Math.max(0, Math.trunc(Number(texto) || 0));
  const falta = n > disponivel ? n - disponivel : 0;
  const descontar = () => {
    if (enviado.current || !n || falta) return;
    enviado.current = true;
    const r = m.acoes.descontarEnergia({ valor: n, motivo: nome, energiaVista: vista });
    if (r.erro) {
      enviado.current = false;
      if (/Energia Mudou/.test(r.erro)) setVista(disponivel);
      setErro(r.erro);
      return;
    }
    onFechar();
  };
  return (
    <div className="m-painel-vital" data-descontar-painel>
      <div className="m-pv-titulo"><b>Descontar {rotulo}</b><span className="m-pv-numero" data-energia-agora={disponivel}>{m.sessao.peAtual}<small>/{m.derived.pe}{casca > 0 ? ` +${casca}` : ""}</small></span></div>
      <div className="m-pv-linha">
        <input className="afty-campo m-campo-num" inputMode="numeric" value={texto} placeholder="0" aria-label="Valor para Descontar" data-descontar-valor
          onChange={(e) => { setTexto(e.target.value.replace(/[^\d]/g, "")); setErro(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); descontar(); } }} />
        <button type="button" className="afty-botao m-botao" disabled={!n || falta > 0} onClick={descontar} data-descontar-confirmar>{n ? `Descontar ${n} PE` : "Descontar"}</button>
      </div>
      <div className="m-pv-motivo"><span>Registrar como <b>{nome}</b></span></div>
      {(falta > 0 || erro) && <div className="m-erro" role="alert" data-descontar-erro>{falta > 0 ? `Faltam ${falta} PE` : erro}</div>}
      <div className="m-pv-rodape"><button type="button" className="afty-botao m-botao" onClick={onFechar} data-descontar-fechar>Fechar</button></div>
    </div>
  );
}

export function GastarNaEnergia({ m, nome, rotulo = "Descontar", valor = null }) {
  const [ancora, setAncora] = useState(null);
  return (
    <>
      <button type="button" className="g-link" onClick={(e) => setAncora(e.currentTarget)} data-descontar-abrir>{rotulo}</button>
      {ancora && (
        <Flutuante ancora={ancora} onFechar={() => setAncora(null)} largura={300} rotulo="Descontar da Energia">
          <DescontarPainel m={m} nome={nome} valor={valor} onFechar={() => setAncora(null)} />
        </Flutuante>
      )}
    </>
  );
}

/* ---------------- PV Temporário: concede, registrado, resta ---------------- */
export function PvBeneficio({ b, g, lista = false }) {
  if (!b) return null;
  /* Na linha da completa: o valor e UM estado curto. A regra da concessão e
     Registrar na Vida ficam no detalhe (e no resultado de quem acabou de ativar). */
  if (lista) {
    const resta = b.resta > 0 ? `Restam ${b.resta}` : "Consumidos";
    const daFicha = b.regra === "ficha" && !(b.resta > 0) && !(b.registro && !b.registro.pelaFicha);
    const estado = b.podeRegistrar ? (b.registro ? `Nova Rodada · ${resta}` : "Não Registrado") : daFicha ? "No Começo da Rodada" : resta;
    return <span className="g-pv" data-pv={b.beneficio}><span>PV Temporário <b>{b.concede}</b></span><span className="g-suave">{estado}</span></span>;
  }
  const acao = b.podeRegistrar && <button type="button" className="g-link" onClick={() => g.acoes.pvRegistrar(b)} data-pv-registrar={b.beneficio}>Registrar na Vida</button>;
  const restam = b.resta > 0 ? `Restam ${b.resta}` : "Consumidos";
  const manual = b.registro && !b.registro.pelaFicha;
  let estado;
  if (b.regra === "ficha") estado = manual ? <span className="g-suave">Registrado {b.registro.valor} · {restam}</span>
    : b.resta > 0 ? <span className="g-suave">Concedido pela Ficha · Restam {b.resta}</span> : <span className="g-suave">A Ficha Concede no Começo da Rodada</span>;
  else if (b.podeRegistrar && !b.registro) estado = <><span className="g-suave">Não Registrado</span>{acao}</>;
  else if (b.podeRegistrar) estado = <><span className="g-suave">Nova Rodada · {restam}</span>{acao}</>;
  else if (b.registro?.pelaFicha) estado = <span className="g-suave">Concedido pela Ficha · {restam}</span>;
  else estado = <span className="g-suave">Registrado {b.registro?.valor ?? b.concede} · {restam}</span>;
  /* Os três números, também para quem confere: o que concede, o que foi registrado e o que resta no pote. */
  return (
    <span className="g-pv" data-pv={b.beneficio} data-concede={b.concede} data-registrado={b.registro?.valor ?? ""} data-resta={b.resta} data-pode-registrar={b.podeRegistrar ? "" : undefined}>
      <span>PV Temporário <b>{b.concede}</b></span>
      {estado}
    </span>
  );
}
/* Ao encerrar: o que foi registrado continua no pote até alguém tirar. */
export function PvQueFica({ fontes, g, m }) {
  const lista = (fontes ?? []).map((f) => [f, m.sessao.pvTempFontes?.[f] ?? 0]).filter(([, v]) => v > 0);
  if (!lista.length) return null;
  return lista.map(([f, v]) => (
    <span key={f} className="g-pv"><span className="g-suave">{v} PV Temporários Registrados Continuam na Vida</span>
      <button type="button" className="g-link" onClick={() => g.acoes.pvTirar(f)}>Tirar da Vida</button></span>
  ));
}

/* ---------------- o resultado, curto, logo abaixo do que foi operado ---------------- */
function Resultado({ r, g, m, pvb }) {
  if (!r) return null;
  const resto = semPvTemp(r.chips);
  const manual = !r.cobrado && r.custo && !r.custo.cobra;
  const idRec = String(r.alvo ?? "").startsWith("rec:") ? String(r.alvo).slice(4) : null;
  const razoes = idRec && !resto.length ? Object.entries(g.analise[idRec] ?? {}).map(([canal, x]) => fraseDoBeneficio(canal, x)?.texto).filter(Boolean) : [];
  const encerrou = r.verbo?.startsWith("Encerrad");
  return (
    <div className="g-resultado" role="status" data-tom={r.nadaMudou ? "nada" : undefined} key={r.ts}>
      <span className="g-resultado-verbo">{r.nadaMudou ? <AlertTriangle aria-hidden="true" /> : <Check aria-hidden="true" />}{r.nadaMudou ? "Nada Mudou" : r.verbo}</span>
      {resto.length > 0 && <span className="g-na-ficha"><span className="g-suave">Na Ficha</span><Numeros chips={resto} destaque /></span>}
      {razoes.map((t) => <span key={t} className="g-razao">{t}</span>)}
      {!encerrou && pvb && <PvBeneficio b={pvb} g={g} />}
      {encerrou && <PvQueFica fontes={r.fontesPv} g={g} m={m} />}
      {!resto.length && !pvb && !r.nadaMudou && !r.instantaneo && !razoes.length && !encerrou && <span className="g-suave">Sem Mudança nos Seus Números</span>}
      {r.instantaneo && <span className="g-suave">Não Fica Ativo</span>}
      {r.cobrado > 0 && <span className="g-custo" data-cobra="sim"><Zap aria-hidden="true" />Cobrou {r.cobrado} PE</span>}
      {manual && <span className="g-custo"><Hand aria-hidden="true" />{r.custo.texto} à Parte <GastarNaEnergia m={m} nome={r.nome} /></span>}
      <button type="button" className="g-x" onClick={g.fecharResultado} aria-label="Fechar o resultado"><X aria-hidden="true" /></button>
    </div>
  );
}

/* ---------------- os controles de um grupo, juntos ---------------- */
export function ControlesDoGrupo({ gr, m }) {
  const combate = m.sessao.combate ?? {};
  return (
    <div className="g-controles">
      {gr.controles.map((c) => {
        const nome = c.estados.length === 1 ? c.estados[0].label : c.rotulo;
        const filhos = gr.filhos.filter((f) => c.estados.some((p) => p.id === f.requerEstado));
        return (
          <div key={c.id} className="g-controle">
            <span className="g-controle-nome">{nome === gr.nome ? "Estado" : nome}{c.dono && c.dono.chave !== gr.chave ? <small> · De {c.dono.nome}</small> : null}</span>
            <Controle c={c} m={m} />
            {filhos.filter(() => c.estados.some((p) => estaLigado(p, combate[p.id]))).map((f) => (
              <div key={f.id} className="g-controle g-controle-filho">
                <span className="g-controle-nome">{f.label}</span>
                <Controle c={{ id: f.id, rotulo: f.label, estados: [f] }} m={m} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   ATIVOS
   ============================================================ */

function Encerrados({ g, m }) {
  if (!g.encerrados.length) return null;
  const r = g.resultado;
  return (
    <section className="g-encerrados" aria-label="Encerrados nesta sessão">
      <h3 className="g-subtitulo">Encerrados Nesta Sessão</h3>
      <ul>
        {g.encerrados.map((x) => {
          const custo = g.custoDeReativar(x);
          return (
            <li key={x.chave}>
              <div className="g-encerrado-linha">
                <span className="g-nome">{x.nome}</span>
                <span className="g-reativar">
                  {custo && <Custo custo={custo} m={m} nome={x.nome} curto />}
                  <button type="button" className="g-botao" data-reativar={x.chave} onClick={() => g.acoes.reativar(x)} aria-label={`Reativar ${x.nome}${custo ? `, ${custo.cobra ? `cobra ${custo.texto}` : `${custo.texto} à parte`}` : ""}`}><RotateCcw aria-hidden="true" />Reativar</button>
                </span>
              </div>
              {r && r.alvo === `enc:${x.chave}` && <Resultado r={r} g={g} m={m} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const DIVISAO = { condicao: "Condições", recebido: "Recebidos e Registrados", proprio: "Do Personagem" };

/* ============================================================
   ENCONTRAR (só na completa)
   ============================================================ */
function Trecho({ t }) {
  if (!t) return null;
  return (
    <span className="g-trecho">
      {t.cortadoAntes && "…"}
      {t.partes.map((p, i) => (p.marca ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>))}
      {t.cortadoDepois && "…"}
    </span>
  );
}

/* ============================================================
   REGISTRAR UMA FONTE EXTERNA, com prévia
   ============================================================ */
export function RegistroExterno({ g, m, onFechar }) {
  const [tipo, setTipo] = useState("feitico");
  const [nome, setNome] = useState("");
  const [origemId, setOrigemId] = useState(null);
  const [por, setPor] = useState("");
  const [beneficios, setBeneficios] = useState([{ canal: "defesa", valor: "" }]);
  const [rodadas, setRodadas] = useState("");
  const [cond, setCond] = useState("");
  /* A faixa do Sangramento (o dado da perda de Vida): ela vale só para essa condição e pede escolha, como na gaveta antiga. */
  const [faixa, setFaixa] = useState("fraco");
  const [presumir, setPresumir] = useState(false);
  const [sugestoes, setSugestoes] = useState(false);
  const gruposCond = useMemo(() => condicoesPorForca({ especiais: true }), []);
  const nRodadas = rodadas.trim() ? Math.max(1, Math.trunc(Number(rodadas)) || 1) : null;
  const achados = tipo === "catalogo" && sugestoes && !origemId ? buscarOrigem(nome) : [];
  const bens = beneficios.filter((b) => b.canal && String(b.valor).trim() && Number(b.valor)).map((b) => ({ canal: b.canal, valor: Number(b.valor) }));
  const tipoFonte = tipo === "catalogo" && !origemId ? "outro" : tipo;
  const candidato = tipo === "condicao" ? null : {
    id: `r${uid()}`, rec: true, tipoFonte, origemId: tipoFonte === "catalogo" ? origemId : null, origemNome: nome.trim(),
    aplicadoPor: por.trim() || null, beneficios: bens, rodadas: nRodadas, somaPresumida: tipoFonte === "outro" && presumir,
  };
  const pronto = tipo === "condicao" ? !!cond : !!nome.trim();

  /* A prévia: a MESMA conta, com o candidato dentro. */
  const chaveDoCandidato = JSON.stringify({ tipoFonte, origemId, nome, por, bens, presumir });
  const previa = useMemo(() => {
    if (!candidato || !candidato.origemNome || !bens.length) return null;
    const s1 = { ...m.sessao, buffs: [...m.sessao.buffs, candidato] };
    const calc = prepararCalculo(m.ficha, s1);
    return { chips: ordenarConsequencias(compararTudo(calc.derived, m.derived)), analise: calc.analise[candidato.id] ?? {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDoCandidato, m.sessao, m.derived]);

  const registrar = (e) => {
    e.preventDefault();
    if (!pronto) return;
    if (tipo === "condicao") {
      const c = gruposCond.flatMap((x) => x.condicoes).find((x) => x.nome === cond);
      if (c) g.acoes.registrarCondicao(c, nRodadas, c.nome === "Sangramento" ? faixa : null);
    } else g.acoes.registrarFonte(candidato);
    onFechar();
  };
  const muda = (i, patch) => setBeneficios((l) => l.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  return (
    <form className="g-registro" onSubmit={registrar} aria-label="Registrar fonte externa">
      <div className="g-registro-topo">
        <h2 className="g-titulo">Registrar Fonte Externa</h2>
        <button type="button" className="g-x" onClick={onFechar} aria-label="Cancelar o registro"><X aria-hidden="true" /></button>
      </div>
      <span className="m-seg g-tipos" role="radiogroup" aria-label="Tipo de fonte">
        {[...TIPOS_FONTE.filter((t) => t.id !== "outro"), { id: "condicao", rotulo: "Condição" }].map((t) => (
          <button key={t.id} type="button" role="radio" className="m-seg-op" aria-checked={tipo === t.id} data-tipo={t.id} onClick={() => { setTipo(t.id); setOrigemId(null); }}>{t.rotulo}</button>
        ))}
      </span>
      {tipo === "condicao" ? (
        <>
          <label className="g-campo"><span>Condição</span>
            <span className="m-select"><select className="afty-campo" value={cond} onChange={(e) => setCond(e.target.value)} data-campo="condicao">
              <option value="">Escolher</option>
              {gruposCond.map((gr) => <optgroup key={gr.id} label={gr.label}>{gr.condicoes.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}</optgroup>)}
            </select><ChevronDown aria-hidden="true" /></span>
          </label>
          {cond === "Sangramento" && (
            <label className="g-campo"><span>Faixa do Sangramento</span>
              <span className="m-select"><select className="afty-campo" value={faixa} onChange={(e) => setFaixa(e.target.value)} data-campo="faixa-sangramento">
                {SANGRAMENTO_FAIXAS.map((x) => <option key={x.id} value={x.id}>{x.label} ({x.dados}d{x.faces})</option>)}
              </select><ChevronDown aria-hidden="true" /></span>
            </label>
          )}
        </>
      ) : (
        <>
          <label className="g-campo g-campo-origem"><span>{tipo === "feitico" ? "Feitiço de Origem" : "Efeito de Origem"}</span>
            <input className="afty-campo" value={nome} data-campo="origem" placeholder={tipo === "feitico" ? "Nome do Feitiço" : "Buscar no catálogo ou escrever"}
              onChange={(e) => { setNome(e.target.value); setOrigemId(null); setSugestoes(true); }} onBlur={() => setTimeout(() => setSugestoes(false), 150)} onFocus={() => setSugestoes(true)} autoComplete="off" />
            {origemId && <span className="g-suave">Do Catálogo</span>}
            {tipo === "catalogo" && nome.trim().length > 1 && !origemId && !achados.length && <span className="g-suave">Origem Personalizada</span>}
            {achados.length > 0 && (
              <ul className="g-sugestoes" role="listbox" aria-label="Origens do catálogo">
                {achados.map((x) => (
                  <li key={x.id}><button type="button" role="option" aria-selected="false" data-origem-id={x.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { setNome(x.nome); setOrigemId(x.id); setSugestoes(false); }}>
                    <b>{x.nome}</b><span className="g-suave">{x.rotuloTipo}</span>
                  </button></li>
                ))}
              </ul>
            )}
          </label>
          <label className="g-campo"><span>Aplicado Por</span><input className="afty-campo" value={por} onChange={(e) => setPor(e.target.value)} placeholder="Quem aplicou" data-campo="por" /></label>
          <div className="g-campo"><span>Benefícios</span>
            {beneficios.map((b, i) => (
              <div key={i} className="g-beneficio">
                <span className="m-select"><select className="afty-campo" value={b.canal} onChange={(e) => muda(i, { canal: e.target.value })} aria-label="Valor afetado" data-campo={`canal-${i}`}>
                  {CANAIS_EXTERNOS.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
                </select><ChevronDown aria-hidden="true" /></span>
                <input className="afty-campo m-campo-num" value={b.valor} onChange={(e) => muda(i, { valor: e.target.value.replace(/[^\d-]/g, "") })} inputMode="numeric" aria-label="Quanto" placeholder="0" data-campo={`valor-${i}`} />
                {beneficios.length > 1 && <button type="button" className="g-icone" onClick={() => setBeneficios((l) => l.filter((_, j) => j !== i))} aria-label="Tirar este valor"><X aria-hidden="true" /></button>}
              </div>
            ))}
            <button type="button" className="g-link" onClick={() => setBeneficios((l) => [...l, { canal: "rdGeral", valor: "" }])} data-mais-beneficio>Outro Valor</button>
          </div>
        </>
      )}
      <label className="g-campo g-campo-curto"><span>Rodadas</span><input className="afty-campo m-campo-num" value={rodadas} onChange={(e) => setRodadas(e.target.value.replace(/[^\d]/g, ""))} placeholder="Sem" inputMode="numeric" data-campo="rodadas" /></label>
      {previa && (
        <div className="g-previa" aria-live="polite" data-previa>
          <span className="g-rotulo">Se Registrar</span>
          <ul className="g-frases">{Object.entries(previa.analise).map(([canal, x]) => { const f = fraseDoBeneficio(canal, x); return f && <li key={canal} data-tom={f.tom}>{f.texto}</li>; })}</ul>
          {semPvTemp(previa.chips).length > 0 ? <Numeros chips={semPvTemp(previa.chips)} destaque /> : <span className="g-suave">Nenhum dos Seus Números Muda</span>}
          {tipoFonte === "outro" && (
            <label className="g-presumir"><input type="checkbox" checked={presumir} onChange={(e) => setPresumir(e.target.checked)} data-campo="presumir" /> Somar Mesmo Assim</label>
          )}
        </div>
      )}
      <div className="g-registro-rodape">
        <button type="submit" className="g-botao" data-primaria="sim" disabled={!pronto}>Registrar</button>
      </div>
    </form>
  );
}

/* ============================================================
   AS DUAS APRESENTAÇÕES
   ============================================================ */
