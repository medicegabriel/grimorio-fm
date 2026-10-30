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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpenText, Check, ChevronDown, Hand, Layers, Maximize2, Minus, Plus, PlusCircle, Power, RotateCcw, Search, Star, X, Zap, Equal } from "lucide-react";
import { Sessao, condicoesPorForca } from "./ponte";
import { buscar } from "./repertorio";
import { uid } from "./util";
import { Controle, Flutuante } from "./pecas";
import { detalhesDoAtivo, finalidadeDe, verificacoes, valoresDoGrupo, PARA, COMO, ORDEM_COMO, estaLigado, compararTudo, COMPARADOS, ordenarConsequencias, custoAntes, pvDoAtivo, COBERTO_PELA_PROPRIA } from "./efeitos-dados";
import { prepararCalculo, fraseDoBeneficio, rotuloCanal, CANAIS_EXTERNOS, TIPOS_FONTE, buscarOrigem, origemPorId } from "./recebidos";

import { marcasDoAtivo, consequenciasDaLinha, finalidadeCurta, energia, semPvTemp } from "./gestor-logica";
const focarDepois = (seletor) => setTimeout(() => document.querySelector(`#afty-ficha ${seletor}`)?.focus(), 60);
const sinal = (v) => `${v > 0 ? "+" : "−"}${Math.abs(v)}`;
/* PV Temporário calculado não é reserva: sai dos números "Na Ficha" e ganha bloco próprio. */

/* ============================================================
   PEÇAS
   ============================================================ */
/* Um número com o sinal escrito: entende-se sem cor. `destaque` pinta o
   negativo de vermelho, e só onde a consequência pede isso (o resultado). */
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

/* O DESCONTO CONTEXTUAL (consolidação ampliada, 2026-10-16). O atalho de pagamento de um custo à mão abre um painel
   enxuto que SUBTRAI da Energia (`acoes.descontarEnergia`, o verbo de gasto de sempre), e não o painel geral com Definir.
   `valor`: o que a operação que originou o resultado já sabe (1 PE adicional, 9 PE inteiros, 2 PE da escolha). Sem valor
   conhecido o campo vem vazio, e o jogador diz quanto desconta: nenhum número é presumido. Abrir, editar o campo ou
   fechar não desconta nada, e o botão só gasta ao clique (ou Enter) conferido contra a Energia que a tela viu. */
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

/* Na coluna estreita, "4 PE" e "por Rodada" não se partem: a quebra cai entre os dois. */
const NB = String.fromCharCode(160);
const inteiro = (t) => t.replace(/(\d+) PE/g, `$1${NB}PE`).replace(/por (\S+)/g, `por${NB}$1`);
export function Custo({ custo, m, nome, curto = false }) {
  if (!custo) return null;
  const texto = curto ? inteiro(custo.texto) : custo.texto;
  return custo.cobra
    ? <span className="g-custo" data-cobra="sim" title="A ficha desconta da Energia"><Zap aria-hidden="true" />{`Cobra ${texto}`}</span>
    : <span className="g-custo" title="A ficha não desconta: pague na Energia"><Hand aria-hidden="true" />{texto}{curto ? `${NB}à Parte` : <> à Parte <GastarNaEnergia m={m} nome={nome} /></>}</span>;
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

function LinhaAtiva({ a, g, m, compacto, selecionado, onSelecionar, onConsultar }) {
  const d = detalhesDoAtivo(a, m);
  const { chips, marginais, contrib } = consequenciasDaLinha(a, g, m);
  const pvb = pvDoAtivo(a, g.pv);
  const principal = chips[0] ?? null;
  const mais = chips.length - (principal ? 1 : 0) + (principal && pvb ? 1 : 0);
  const mOp = g.mPara();
  /* Na completa a linha fica com o essencial: nome, estado, o que vale e a
     duração. Acúmulo, empate e cobertura vão para o detalhe. Atenção fica. */
  const essencial = !compacto;
  const faixa = a.tipo === "grupo" && a.grupo.controles.length === 1 && a.grupo.controles[0].estados.length === 1 && a.grupo.controles[0].estados[0].tipo === "faixa" ? a.grupo.controles[0] : null;
  const valores = (faixa ? [] : a.tipo === "grupo" ? valoresDoGrupo(a.grupo, m.sessao.combate) : a.tipo === "sustentado" ? [{ texto: "Sustentado" }] : [])
    .filter((v) => !(essencial && !v.rotulo && v.texto === "Ligado"));
  const marcas = marcasDoAtivo(a, g, d, contrib);
  const coberto = contrib.coberto ?? g.cobertos.get(a.chave);
  /* O PV Temporário ocupa a consequência, e a cobertura dos outros números vira marca. */
  const cobertura = coberto === COBERTO_PELA_PROPRIA ? "Coberto pela Sua Própria" : `${contrib.coberto ? "Coberto por" : "Incluído em"} ${coberto}`;
  if (!principal && pvb && coberto) marcas.unshift({ tom: "disputa", texto: cobertura });
  const marcasDaLinha = essencial ? marcas.filter((x) => x.tom === "atencao") : marcas;
  const empate = contrib.empates[0];
  let consequencia;
  if (principal) consequencia = <><Numeros chips={[principal]} />{!essencial && empate && <span className="g-empate"><Equal aria-hidden="true" />Empata com {empate.com?.nome}</span>}{mais > 0 && <span className="g-mais">· Mais {mais}</span>}</>;
  else if (pvb) consequencia = <PvBeneficio b={pvb} g={g} lista={essencial} />;
  else if (coberto) consequencia = <span className="g-suave" title={contrib.coberto ? undefined : COMPARADOS}>{cobertura}</span>;
  else if (a.semNumero) consequencia = <span className="g-suave">Anotado na Mesa</span>;
  else if (a.tipo === "registro" && d.atencao.length) consequencia = <span className="g-suave">Ainda Fora da Conta</span>;
  else if (a.tipo === "grupo" && !m.combate) consequencia = <span className="g-suave">Fora de Combate</span>;
  else consequencia = <span className="g-suave" title={COMPARADOS}>Sem Mudança nos Seus Números</span>;
  const duracao = d.contador ?? d.duracao;
  const r = g.resultado;
  /* A origem fica na linha só onde ela distingue: quem aplicou um recebido. */
  const mostraOrigem = a.tipo === "registro" || a.tipo === "buff";
  return (
    <li className="g-ativo" data-classe={a.classe} data-selecionado={selecionado ? "sim" : undefined} data-chave-ativo={a.chave}>
      <div className="g-ativo-linha">
        <button type="button" className="g-ativo-nome" aria-expanded={a.tipo !== "exaustao" ? selecionado : undefined} onClick={a.tipo !== "exaustao" ? onSelecionar : undefined} data-chave-foco={a.chave}>
          <span className="g-nome">{a.nome}</span>
          {(mostraOrigem || duracao) && (
            <span className="g-origem">{[mostraOrigem ? a.origem?.curta ?? a.origem?.rotulo : null, duracao].filter(Boolean).map((t, i) => <span key={i} data-duracao={t === duracao ? "sim" : undefined}>{t}</span>)}</span>
          )}
        </button>
        {(() => {
          const valor = <span className="g-valor">{valores.map((v, i) => <span key={i}>{v.rotulo && <small>{v.rotulo} </small>}{v.texto}</span>)}{a.tipo === "exaustao" && <span>Nível {a.nivel}</span>}</span>;
          const cons = <span className="g-consequencia">{consequencia}</span>;
          return compacto ? <span className="g-sub">{(valores.length > 0 || a.tipo === "exaustao") && valor}{cons}</span> : <>{valor}{cons}</>;
        })()}
        <span className="g-acoes">
          {faixa && <Controle c={faixa} m={mOp} compacto />}
          {a.tipo === "exaustao" && (
            <span className="m-passos">
              <button type="button" className="m-passo" aria-label="Exaustão menos 1" onClick={() => g.acoes.exaustao(a.nivel - 1)}><Minus aria-hidden="true" /></button>
              <button type="button" className="m-passo" aria-label="Exaustão mais 1" onClick={() => g.acoes.exaustao(a.nivel + 1)}><Plus aria-hidden="true" /></button>
            </span>
          )}
          <button type="button" className="g-encerrar" onClick={() => { g.acoes.encerrar(a); focarDepois(`[data-reativar="${CSS.escape(a.chave)}"]`); }} aria-label={`Encerrar ${a.nome}`} title="Encerrar"><Power aria-hidden="true" /></button>
        </span>
      </div>
      {marcasDaLinha.length > 0 && (
        <div className="g-marcas">
          {marcasDaLinha.map((x) => <span key={x.texto} className="g-marca" data-tom={x.tom}>{x.tom === "atencao" ? <AlertTriangle aria-hidden="true" /> : <Layers aria-hidden="true" />}{x.texto}</span>)}
        </div>
      )}
      {r && r.alvo === a.chave && <Resultado r={r} g={g} m={m} pvb={pvb} />}
      {selecionado && <DetalheAtivo a={a} g={g} m={m} d={d} chips={chips} marginais={marginais} contrib={contrib} pvb={pvb} mOp={mOp} onConsultar={onConsultar}
        cobertura={essencial && !principal && pvb && coberto ? cobertura : null} />}
    </li>
  );
}

function DetalheAtivo({ a, g, m, d, chips, marginais, contrib, pvb, mOp, onConsultar, cobertura }) {
  const multiplos = a.tipo === "grupo" && (a.grupo.controles.length > 1 || a.grupo.filhos.length > 0 || a.grupo.controles[0].partes || ["opcao", "multi"].includes(a.grupo.controles[0].estados[0].tipo));
  const an = a.tipo === "registro" ? g.analise[a.reg.id] ?? {} : null;
  const disputas = g.disputas.get(a.chave) ?? [];
  return (
    <div className="g-detalhe">
      {(chips.length > 0 || pvb) && (
        <div className="g-bloco">
          <span className="g-rotulo">Dá Agora</span>
          <Numeros chips={chips} />
        </div>
      )}
      {pvb && (
        <div className="g-bloco g-bloco-pv">
          <PvBeneficio b={pvb} g={g} />
          <span className="g-suave">{pvb.textoRegra}</span>
        </div>
      )}
      {cobertura && <div className="g-marcas"><span className="g-marca" data-tom="disputa"><Layers aria-hidden="true" />{cobertura}</span></div>}
      {[...contrib.vale.values()].map((v) => {
        const mg = marginais.find((c) => c.chave === v.chave);
        const empatado = contrib.empates.some((x) => (x.canal === v.chave || rotuloCanal(x.canal) === v.rotulo));
        return mg && mg.valor !== v.valor && !empatado ? <p key={v.chave} className="g-descricao">{`Se encerrar, ${v.rotulo} ${mg.valor > 0 ? "cai" : "sobe"} ${Math.abs(mg.valor)}, porque outra fonte do mesmo tipo passa a valer.`}</p> : null;
      })}
      {an && Object.keys(an).length > 0 && (
        <ul className="g-frases">{Object.entries(an).map(([canal, x]) => { const f = fraseDoBeneficio(canal, x); return f && <li key={canal} data-tom={f.tom}>{f.texto}</li>; })}</ul>
      )}
      {disputas.length > 0 && (
        <ul className="g-frases">{disputas.map((p) => (
          <li key={`${p.canal}|${p.alvo ?? ""}`}>{p.status === "empata"
            ? `Empata com ${p.com.nome} (${sinal(p.com.valor)}): a ${rotuloCanal(p.canal)} recebe ${sinal(p.valor)} uma vez só, e continua com ${sinal(p.valor)} se um dos dois terminar.`
            : `Não soma na ${rotuloCanal(p.canal)}: ${p.vencedor ? `${p.vencedor.nome} dá ${sinal(p.vencedor.valor)}, e fontes do mesmo grupo não somam entre si.` : "outra fonte do mesmo grupo vale mais."}`}</li>
        ))}</ul>
      )}
      {multiplos && <ControlesDoGrupo gr={a.grupo} m={mOp} />}
      {(a.tipo === "condicao" || a.tipo === "buff" || a.tipo === "registro") && (
        <div className="g-controle">
          <span className="g-controle-nome">Rodadas</span>
          <span className="m-passos">
            <button type="button" className="m-passo" aria-label="Uma rodada a menos" disabled={a.rodadas == null || a.rodadas <= 1} onClick={() => g.acoes.rodadas(a, a.rodadas - 1)}><Minus aria-hidden="true" /></button>
            <span className="m-passos-valor">{a.rodadas ?? "Sem"}</span>
            <button type="button" className="m-passo" aria-label="Uma rodada a mais" onClick={() => g.acoes.rodadas(a, (a.rodadas ?? 0) + 1)}><Plus aria-hidden="true" /></button>
            {a.rodadas != null && <button type="button" className="g-link" onClick={() => g.acoes.rodadas(a, null)}>Sem Duração</button>}
          </span>
        </div>
      )}
      <dl className="g-ficha">
        {d.custo && <div><dt>Custo</dt><dd><Custo custo={d.custo} m={m} nome={a.nome} /></dd></div>}
        {(d.contador || d.duracao) && <div><dt>Duração</dt><dd>{d.contador ?? d.duracao}</dd></div>}
        {d.naMesa.map((x) => <div key={x.rotulo}><dt>{x.rotulo}</dt><dd>{x.texto} <span className="g-suave">· Na Mesa</span></dd></div>)}
        {a.tipo === "registro" && <div><dt>Origem</dt><dd>{a.reg.origemNome}{a.reg.origemId ? "" : " (Personalizada)"} · {origemPorId(a.reg.origemId)?.rotuloTipo ?? TIPOS_FONTE.find((t) => t.id === a.reg.tipoFonte)?.rotulo}{a.reg.aplicadoPor ? ` · Aplicado por ${a.reg.aplicadoPor}` : ""}</dd></div>}
        {a.tipo === "registro" && a.reg.exemplo && <div><dt>Exemplo</dt><dd>Registro de exemplo do estudo</dd></div>}
        {a.tipo === "buff" && a.buff.nota && <div><dt>Nota</dt><dd>{a.buff.nota}</dd></div>}
        {a.tipo === "condicao" && a.ficha?.resumo && <div><dt>Efeito</dt><dd>{a.ficha.resumo}</dd></div>}
        {a.tipo !== "registro" && a.origem?.rotulo && <div><dt>Origem</dt><dd>{[a.origem.rotulo, a.origem.detalhe].filter(Boolean).join(" · ")}</dd></div>}
      </dl>
      {a.exemplo?.texto && <p className="g-descricao">{a.exemplo.texto}</p>}
      {a.consulta && <button type="button" className="g-link g-regra" onClick={() => onConsultar(a.consulta, "regra")} data-regra={a.chave}><BookOpenText aria-hidden="true" />Regra Completa</button>}
    </div>
  );
}

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

const FILTROS_COMPACTA = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "proprio", rotulo: "Personagem" },
  { id: "recebido", rotulo: "Recebidos" },
  { id: "condicao", rotulo: "Condições" },
];
const DIVISAO = { condicao: "Condições", recebido: "Recebidos e Registrados", proprio: "Do Personagem" };

export function ListaAtivos({ g, m, compacto = false, onConsultar }) {
  const filtro = compacto ? g.tela.filtro : "tudo";
  const lista = g.ativos.filter((a) => filtro === "tudo" || a.classe === filtro);
  const r = g.resultado;
  const orfao = r && r.alvo && !g.ativos.some((a) => a.chave === r.alvo) && !String(r.alvo).startsWith("enc:") && !g.opcoes.some((o) => o.chave === r.alvo) ? r : null;
  return (
    <section className="g-ativos" aria-label="Efeitos ativos">
      {compacto && (
        <div className="g-filtro-compacta" role="tablist" aria-label="Quais efeitos">
          {FILTROS_COMPACTA.map((f) => {
            const n = f.id === "tudo" ? g.ativos.length : g.ativos.filter((a) => a.classe === f.id).length;
            return (
              <button key={f.id} type="button" role="tab" aria-selected={filtro === f.id} className="g-segmento" disabled={!n && f.id !== "tudo"} onClick={() => g.mudaTela({ filtro: f.id })}>
                {f.rotulo}<small>{n}</small>
              </button>
            );
          })}
        </div>
      )}
      {orfao && <Resultado r={orfao} g={g} m={m} />}
      {lista.length === 0 ? <p className="g-vazio">Nenhum Efeito Ativo</p> : (
        <ul className="g-lista" data-compacta={compacto ? "sim" : undefined}>
          {lista.map((a, i) => {
            const bloco = DIVISAO[a.classe];
            const novo = filtro === "tudo" && (i === 0 || DIVISAO[lista[i - 1].classe] !== bloco);
            return (
              <React.Fragment key={a.chave}>
                {novo && <li className="g-divisao" aria-hidden="true">{bloco}</li>}
                <LinhaAtiva a={a} g={g} m={m} compacto={compacto} selecionado={g.tela.selecionado === a.chave}
                  onSelecionar={() => g.mudaTela((t) => ({ selecionado: t.selecionado === a.chave ? null : a.chave }))} onConsultar={onConsultar} />
              </React.Fragment>
            );
          })}
        </ul>
      )}
      <Encerrados g={g} m={m} />
    </section>
  );
}

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

function LinhaOpcao({ o, g, m, para, achado, onConsultar, aberta, onAbrir }) {
  const ativo = g.ligado(o);
  const fixado = (m.sessao.favoritos ?? []).includes(o.chave);
  const v = verificacoes(o, m);
  const usos = g.usosDe(o.chave);
  const custo = custoAntes(o);
  const simples = o.grupo && (o.como === "ligar" || o.como === "intensidade") && o.grupo.controles[0].estados.length === 1 && !o.grupo.sustentacao;
  const frase = finalidadeCurta(o);
  let acao = null;
  if (o.grupo) {
    acao = ativo || !simples
      ? <button type="button" className="g-botao" aria-expanded={aberta} onClick={onAbrir}>{ativo ? "Ajustar" : "Escolher"}<ChevronDown aria-hidden="true" /></button>
      : <button type="button" className="g-botao" data-primaria="sim" disabled={!m.combate || v.nao.length > 0} onClick={() => g.acoes.ativar(o)}>Ativar</button>;
  } else if (o.como === "usar") {
    acao = <button type="button" className="g-botao" data-primaria="sim" disabled={v.nao.length > 0} onClick={() => g.acoes.usar(o)}>Usar</button>;
  } else if (o.como === "registrar") {
    acao = <button type="button" className="g-botao" onClick={() => g.acoes.registrarUso(o)}>Registrar Uso</button>;
  }
  let evidencia = null;
  if (para) {
    const f = finalidadeDe(o, para, g.simulacao);
    if (f?.prova === "calculo") {
      const k = f.casos[0];
      const ch = k.chips.filter((c) => para.calc(c) && c.valor > 0);
      evidencia = <span className="g-evidencia">{k.rotulo ? `${k.rotulo}: ` : "Ao Ligar: "}{ch.map((c) => `${c.rotulo} ${c.texto}`).join(", ")}{f.casos.length > 1 ? ` · Mais ${f.casos.length - 1}` : ""}</span>;
    } else if (f?.prova === "regra") evidencia = <span className="g-evidencia" data-prova="regra">A Regra Fala em {para.rotulo}</span>;
  }
  const condicao = o.exemplo?.condicao;
  const r = g.resultado;
  return (
    <li className="g-opcao" data-aberta={aberta ? "sim" : undefined} data-chave-opcao={o.chave}>
      <button type="button" className="g-estrela" aria-pressed={fixado} onClick={() => m.fixar(o.chave)} aria-label={fixado ? `Tirar ${o.nome} dos Favoritos` : `Favoritar ${o.nome}`} title={fixado ? "Tirar dos Favoritos" : "Favoritar"}>
        <Star aria-hidden="true" fill={fixado ? "currentColor" : "none"} />
      </button>
      <div className="g-opcao-corpo">
        <div className="g-opcao-topo">
          <span className="g-nome">{o.nome}</span>
          {ativo && <span className="g-ativo-marca">Ativo</span>}
          {usos > 0 && <span className="g-suave">Usado {usos}×</span>}
          {achado && achado.onde !== "nome" && <span className="g-suave">{achado.onde === "opção" ? "Na Escolha" : "No Texto"}</span>}
        </div>
        {achado && achado.onde !== "nome" ? <Trecho t={achado.trecho} />
          : frase ? <span className="g-frase" data-finalidade>{frase}</span>
            : <span className="g-origem">{[o.origem?.rotulo, o.origem?.detalhe].filter(Boolean).join(" · ")}</span>}
        {(evidencia || v.nao.length > 0 || condicao) && (
          <div className="g-opcao-sub">
            {evidencia}
            {condicao && <span className="g-condicao" data-condicao><Hand aria-hidden="true" />{condicao}</span>}
            {v.nao.map((t) => <span key={t} className="g-marca" data-tom="atencao"><AlertTriangle aria-hidden="true" />{t}</span>)}
          </div>
        )}
        {aberta && o.grupo && (
          <div className="g-detalhe"><ControlesDoGrupo gr={o.grupo} m={g.mPara()} /></div>
        )}
        {r && r.alvo === o.chave && !g.ativos.some((a) => a.chave === o.chave) && <Resultado r={r} g={g} m={m} />}
      </div>
      {/* O controle de uso fica numa coluna própria, separada da leitura. */}
      <div className="g-opcao-acoes" data-controle>
        {acao}
        {custo && <Custo custo={custo} m={m} nome={o.nome} curto />}
        {o.como === "sempre" && <span className="g-suave">Sempre Valendo</span>}
      </div>
      <button type="button" className="g-icone g-opcao-regra" onClick={() => onConsultar(o.item?.chave ?? o.chave, "resumo")} aria-label={`Consultar ${o.nome}`} title="Consultar" data-regra-opcao={o.chave}><BookOpenText aria-hidden="true" /></button>
    </li>
  );
}

const ORIGENS = [
  { id: "todas", rotulo: "Todas as Origens" },
  { id: "habilidade", rotulo: "Habilidades" },
  { id: "aptidao", rotulo: "Aptidões" },
  { id: "feitico", rotulo: "Feitiços" },
  { id: "recebido", rotulo: "Recebidos e Outros" },
];
const passaOrigem = (o, id) => id === "todas" || (id === "recebido" ? ["recebido", "outros"].includes(o.origem?.tipo) : o.origem?.tipo === id);

export function Encontrar({ g, m, onConsultar, focoBusca }) {
  const { termo, paraId, como, origem, soFav, aberta, mostrarTudo } = g.tela;
  const campo = useRef(null);
  useEffect(() => { g.pedirSimulacao(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (focoBusca) campo.current?.focus(); }, [focoBusca]);
  const para = PARA.find((p) => p.id === paraId) ?? null;
  const favoritos = m.sessao.favoritos ?? [];
  const achados = useMemo(() => (termo.trim() ? new Map(buscar(g.opcoes, termo).map((r) => [r.e.chave, r])) : null), [g.opcoes, termo]);
  const filtrando = !!achados || !!para || !!como || origem !== "todas" || soFav;
  const lista = g.opcoes.filter((o) => (!achados || achados.has(o.chave)) && (!como || o.como === como) && passaOrigem(o, origem)
    && (!soFav || favoritos.includes(o.chave)) && (!para || finalidadeDe(o, para, g.simulacao)));
  const ordenada = achados ? [...lista].sort((a, b) => achados.get(a.chave).rank - achados.get(b.chave).rank)
    : para ? [...lista].sort((a, b) => (finalidadeDe(a, para, g.simulacao)?.prova === "calculo" ? 0 : 1) - (finalidadeDe(b, para, g.simulacao)?.prova === "calculo" ? 0 : 1)) : lista;
  const linha = (o) => (
    <LinhaOpcao key={o.chave} o={o} g={g} m={m} para={para} achado={achados?.get(o.chave)} onConsultar={onConsultar}
      aberta={aberta === o.chave} onAbrir={() => g.mudaTela((t) => ({ aberta: t.aberta === o.chave ? null : o.chave }))} />
  );
  const secoes = filtrando ? null : [
    { id: "favoritos", rotulo: "Favoritos", itens: g.opcoes.filter((o) => favoritos.includes(o.chave)) },
    ...ORDEM_COMO.map((k) => ({ id: k, rotulo: COMO[k], itens: g.opcoes.filter((o) => o.como === k && !favoritos.includes(o.chave)) })),
  ].filter((s) => s.itens.length);
  const LIMITE = 6;
  const calculados = para && g.simulacao ? ordenada.filter((o) => finalidadeDe(o, para, g.simulacao)?.prova === "calculo").length : 0;
  return (
    <section className="g-encontrar" aria-label="Encontrar opções">
      <div className="g-ferramentas">
        <label className="g-busca">
          <Search aria-hidden="true" />
          <input ref={campo} className="afty-campo" type="search" value={termo} placeholder="Nome, texto ou finalidade" data-busca-efeitos
            onChange={(e) => g.mudaTela({ termo: e.target.value })} onKeyDown={(e) => { if (e.key === "Escape" && termo) { e.stopPropagation(); g.mudaTela({ termo: "" }); } }} aria-label="Buscar opções pelo nome ou pelo texto" />
          {termo && <button type="button" className="g-limpar" onClick={() => g.mudaTela({ termo: "" })} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
        </label>
        <div className="g-filtros">
          <span className="m-select g-select"><select className="afty-campo" value={paraId ?? ""} onChange={(e) => g.mudaTela({ paraId: e.target.value || null })} aria-label="Para quê" data-filtro-para>
            <option value="">Para Qualquer Coisa</option>{PARA.map((p) => <option key={p.id} value={p.id}>Para {p.rotulo}</option>)}
          </select><ChevronDown aria-hidden="true" /></span>
          <span className="m-select g-select"><select className="afty-campo" value={como ?? ""} onChange={(e) => g.mudaTela({ como: e.target.value || null })} aria-label="Como se usa" data-filtro-como>
            <option value="">Qualquer Uso</option>{ORDEM_COMO.filter((k) => g.opcoes.some((o) => o.como === k)).map((k) => <option key={k} value={k}>{COMO[k]}</option>)}
          </select><ChevronDown aria-hidden="true" /></span>
          <span className="m-select g-select"><select className="afty-campo" value={origem} onChange={(e) => g.mudaTela({ origem: e.target.value })} aria-label="Origem">
            {ORIGENS.map((x) => <option key={x.id} value={x.id}>{x.rotulo}</option>)}
          </select><ChevronDown aria-hidden="true" /></span>
          <button type="button" className="g-alterna" aria-pressed={soFav} onClick={() => g.mudaTela({ soFav: !soFav })} title="Só Favoritos" aria-label="Só Favoritos"><Star aria-hidden="true" fill={soFav ? "currentColor" : "none"} /></button>
        </div>
        {filtrando && (
          <p className="g-contagem" aria-live="polite">
            <b>{ordenada.length}</b> {ordenada.length === 1 ? "Opção" : "Opções"}
            {para && (g.simulacao ? <> · <b>{calculados}</b> Aumentam {para.rotulo} Agora</> : " · Calculando")}
            <button type="button" className="g-link" onClick={() => g.mudaTela({ termo: "", paraId: null, como: null, origem: "todas", soFav: false })}>Limpar</button>
          </p>
        )}
      </div>
      {filtrando ? (
        ordenada.length ? <ul className="g-lista">{ordenada.map(linha)}</ul> : <p className="g-vazio">Nenhuma Opção</p>
      ) : secoes.map((s) => {
        const tudo = mostrarTudo[s.id] || s.itens.length <= LIMITE + 2;
        return (
          <section key={s.id} className="g-secao" aria-label={s.rotulo} data-secao={s.id}>
            <h3 className="g-subtitulo">{s.rotulo}<small>{s.itens.length}</small></h3>
            <ul className="g-lista">{(tudo ? s.itens : s.itens.slice(0, LIMITE)).map(linha)}</ul>
            {!tudo && <button type="button" className="g-link g-mais-itens" onClick={() => g.mudaTela((t) => ({ mostrarTudo: { ...t.mostrarTudo, [s.id]: true } }))}>Mostrar Mais {s.itens.length - LIMITE}</button>}
          </section>
        );
      })}
    </section>
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
      if (c) g.acoes.registrarCondicao(c, nRodadas);
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
        <label className="g-campo"><span>Condição</span>
          <span className="m-select"><select className="afty-campo" value={cond} onChange={(e) => setCond(e.target.value)} data-campo="condicao">
            <option value="">Escolher</option>
            {gruposCond.map((gr) => <optgroup key={gr.id} label={gr.label}>{gr.condicoes.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}</optgroup>)}
          </select><ChevronDown aria-hidden="true" /></span>
        </label>
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
/* Ao entrar, uma coluna: os ativos. Encontrar e o registro abrem ao lado pelos
   dois botões do cabeçalho, e o botão aceso diz o que está aberto. */
export function VisaoCompleta({ g, m, onConsultar, onRecolher, onEncontrar, onRegistrar, focoBusca }) {
  const lado = g.tela.lado;
  const fechar = (volta) => { g.mudaTela({ lado: null }); focarDepois(volta); };
  return (
    <div className="g-completa" data-lado={lado ?? undefined}>
      <div className="g-col" data-rolavel="ativos">
        <header className="g-cabeca">
          <h2 className="g-titulo">Ativos<small>{g.ativos.length}</small></h2>
          <span className="g-cabeca-acoes">
            <button type="button" className="g-botao" aria-pressed={lado === "encontrar"} aria-controls={lado === "encontrar" ? "g-lado" : undefined}
              onClick={lado === "encontrar" ? () => fechar("[data-abrir-encontrar]") : onEncontrar} data-abrir-encontrar><Search aria-hidden="true" />Encontrar</button>
            <button type="button" className="g-botao" aria-pressed={lado === "registrar"} aria-controls={lado === "registrar" ? "g-lado" : undefined}
              onClick={lado === "registrar" ? () => fechar("[data-registrar]") : onRegistrar} data-registrar><PlusCircle aria-hidden="true" />Registrar Fonte Externa</button>
            {onRecolher && <button type="button" className="g-botao" onClick={onRecolher} data-recolher>Recolher no Painel</button>}
          </span>
        </header>
        <ListaAtivos g={g} m={m} onConsultar={onConsultar} />
      </div>
      {lado && (
        <div key={lado} id="g-lado" className="g-col" data-rolavel={lado}>
          {lado === "registrar" ? <RegistroExterno g={g} m={m} onFechar={() => fechar("[data-registrar]")} /> : (
            <>
              <header className="g-cabeca">
                <h2 className="g-titulo">Encontrar<small>{g.opcoes.length}</small></h2>
                <button type="button" className="g-x" onClick={() => fechar("[data-abrir-encontrar]")} aria-label="Fechar Encontrar" title="Fechar" data-fechar-encontrar><X aria-hidden="true" /></button>
              </header>
              <Encontrar g={g} m={m} onConsultar={onConsultar} focoBusca={focoBusca} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function VisaoCompacta({ g, m, onConsultar, onExpandir, onEncontrar, onRegistrar }) {
  return (
    <aside id="g-painel" className="g-painel" aria-label="Efeitos, compacto">
      <div className="g-painel-topo">
        <h2 className="g-titulo">Efeitos<small>{g.ativos.length}</small></h2>
        <button type="button" className="g-botao" onClick={onExpandir} aria-label="Expandir para a visão completa" data-expandir><Maximize2 aria-hidden="true" />Expandir</button>
      </div>
      <div className="g-painel-corpo" data-rolavel="compacta">
        <ListaAtivos g={g} m={m} compacto onConsultar={onConsultar} />
      </div>
      <div className="g-painel-rodape">
        <button type="button" className="g-botao" onClick={onEncontrar} data-encontrar><Search aria-hidden="true" />Encontrar</button>
        <button type="button" className="g-botao" onClick={onRegistrar} data-registrar-compacta><PlusCircle aria-hidden="true" />Registrar Fonte</button>
      </div>
    </aside>
  );
}
