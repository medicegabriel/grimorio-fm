/* ============================================================
   G2 · CARTÃO ETIQUETA, NO PROTÓTIPO FUNCIONAL (Entrega 1)
   ============================================================
   A aba Efeitos do G2: os Ativos em cartões etiqueta (nome, estado atual e
   prazo curto quando pesa) e o detalhe numa faixa logo abaixo da linha do
   cartão, com Agora, Ajustar e Termina. Adicionar abre o catálogo.
   Os dados são os do gerenciador (`useGestor`), que é um estado só para a
   completa, a compacta e o G2.

   A faixa do detalhe fica no DOM logo depois do cartão aberto, ocupando a
   linha inteira; a grade usa `grid-auto-flow: dense`, e os cartões que
   vinham depois voltam para a linha de cima. Sem mover nó nenhum.

   Entrega 1: o ciclo do Ataque Concentrado é o conferido (Preparação, custo,
   confirmar, ajustar, encerrar). Os outros efeitos usam as peças de hoje.
   ============================================================ */
import React, { useLayoutEffect, useRef } from "react";
import { AlertTriangle, BookOpenText, Clock, Dices, Hand, Layers, Minus, Plus, Power, X } from "lucide-react";
import { Sessao } from "./ponte";
import { Controle } from "./pecas";
import { mapaDe, useRolagemPorChave } from "./rolagem-g2";
import { COBERTO_PELA_PROPRIA, detalhesDoAtivo, pvDoAtivo } from "./efeitos-dados";
import { ControlesDoGrupo, PvBeneficio } from "./Gestor";
import { consequenciasDaLinha } from "./gestor-logica";
import { fraseDoBeneficio, origemPorId, rotuloCanal, TIPOS_FONTE } from "./recebidos";
import CatalogoG2 from "./CatalogoG2";
import { EncerradosG2 } from "./EncerradosG2";
import { AcessoAoHistorico } from "./HistoricoSessao";
import { AcessoAExaustao } from "./ExaustaoG2";
import { LinhaDoTempoG2 } from "./LinhaDoTempoG2";
import { AjusteG2, AjusteGrupo, MontarOutroGolpe, TrocarSustentado, UsarNovamente } from "./PreparoG2";
import { semAjuste } from "./preparo-logica";
import { ehGolpe, ehPiloto, estadosDoCartao, foraDosNumeros, prazoCurto, prazoRelevante, preparoDe, temPreparo, terminaDe } from "./g2-dados";
import { CustoG2, GanhaPerde, Instrucao, Passos, ResultadoG2, SemNumeros } from "./PecasG2";

const sinal = (v) => `${v > 0 ? "+" : "−"}${Math.abs(v)}`;

/* ---------------- o cartão ---------------- */
function CartaoG2({ a, m, aberto, onAbrir }) {
  const d = detalhesDoAtivo(a, m);
  const estados = estadosDoCartao(a, m);
  const prazo = prazoRelevante(a, d);
  /* Altura fixa: o valor tem uma linha quando divide a etiqueta com rótulo e
     prazo, e duas quando sobra lugar. O resto fica no title e no detalhe. */
  const linhas = estados.length === 1 && !(estados[0].rotulo && prazo) ? 2 : 1;
  const atencao = d.atencao.length > 0;
  const etiqueta = estados.length > 0 || !!prazo;
  return (
    <button type="button" className="g2-cartao" data-chave-ativo={a.chave} aria-current={aberto} aria-expanded={aberto} onClick={onAbrir} data-sem-etiqueta={etiqueta ? undefined : ""}>
      {etiqueta && (
        <span className="g2-zona">
          {estados.length > 0 && (
            <span className="g2-zs">
              {estados.map((x, i) => (
                <span key={i} className="g2-z" title={x.titulo ?? [x.rotulo, x.valor].filter(Boolean).join(" ")} data-estado>
                  {x.rotulo && <small>{x.rotulo}</small>}<b data-linhas={linhas}>{x.valor}</b>{x.passos && <Passos {...x.passos} />}
                </span>
              ))}
            </span>
          )}
          {prazo && (
            /* O aviso do prazo usa a cor de destaque do tema. O texto do aviso fica no detalhe e no title. */
            <span className="g-tempo" data-mesa={prazo.contado ? undefined : ""} data-atencao={atencao ? "" : undefined} data-prazo
              title={atencao ? d.atencao.join(" · ") : prazo.contado ? "A ficha conta as rodadas" : "A ficha não conta este prazo: encerre quando acabar"}>
              {atencao ? <AlertTriangle aria-hidden="true" /> : prazo.contado ? <Clock aria-hidden="true" /> : <Hand aria-hidden="true" />}<span>{prazo.texto}</span>
            </span>
          )}
        </span>
      )}
      <span className="g2-conteudo"><span className="g2-nome" title={a.nome}>{a.nome}</span></span>
    </button>
  );
}

/* ---------------- o detalhe ---------------- */
export function Agora({ a, g, m, chips, contrib, pvb }) {
  const coberto = contrib.coberto ?? g.cobertos.get(a.chave);
  const cobertura = coberto ? (coberto === COBERTO_PELA_PROPRIA ? "Coberto pela Sua Própria" : `${contrib.coberto ? "Coberto por" : "Incluído em"} ${coberto}`) : null;
  const disputas = g.disputas.get(a.chave) ?? [];
  const an = a.tipo === "registro" ? g.analise[a.reg.id] ?? {} : null;
  const frases = an ? Object.entries(an).map(([canal, x]) => fraseDoBeneficio(canal, x)).filter(Boolean) : [];
  const d = detalhesDoAtivo(a, m);
  const partes = [];
  if (chips.length) partes.push(<GanhaPerde key="nums" chips={chips} />);
  if (pvb) partes.push(<div key="pv" className="g2-pv"><PvBeneficio b={pvb} g={g} /><span className="x-mesa">{pvb.textoRegra}</span></div>);
  if (cobertura) partes.push(<span key="cob" className="x-neutro"><Layers aria-hidden="true" />{cobertura}</span>);
  for (const p of disputas) {
    partes.push(<span key={`${p.canal}|${p.alvo ?? ""}`} className="x-neutro">{p.status === "empata"
      ? `Empata com ${p.com.nome} (${sinal(p.com.valor)}): a ${rotuloCanal(p.canal)} recebe ${sinal(p.valor)} uma vez só.`
      : `Não soma na ${rotuloCanal(p.canal)}: ${p.vencedor ? `${p.vencedor.nome} dá ${sinal(p.vencedor.valor)}.` : "outra fonte do mesmo grupo vale mais."}`}</span>);
  }
  for (const f of frases) partes.push(<span key={f.texto} className={f.tom === "atencao" ? "x-atencao" : "x-neutro"}>{f.tom === "atencao" && <AlertTriangle aria-hidden="true" />}{f.texto}</span>);
  if (a.tipo === "condicao" && a.ficha?.resumo) partes.push(<p key="res" className="x-texto" style={{ margin: 0 }}>{a.ficha.resumo}</p>);
  if (a.tipo === "buff" && a.buff.nota) partes.push(<p key="nota" className="x-texto" style={{ margin: 0 }}>{a.buff.nota}</p>);
  if (a.exemplo?.condicao) partes.push(<span key="cond" className="x-neutro" data-condicao><Hand aria-hidden="true" />{a.exemplo.condicao}</span>);
  /* O benefício que o comparador não cobre é DECLARADO, mesmo com a condição escrita: nada de silêncio nem de "Sem Mudança". */
  if (!chips.length && !pvb && foraDosNumeros(a.exemplo)) partes.unshift(<SemNumeros key="fora" exemplo={a.exemplo} />);
  if (!partes.length) {
    const t = a.semNumero ? "A Ficha Não Calcula Este Efeito" : a.tipo === "registro" && d.atencao.length ? "Ainda Fora da Conta"
      : a.tipo === "grupo" && !m.combate ? "Fora de Combate" : "Sem Mudança nos Seus Números";
    partes.push(t === "Sem Mudança nos Seus Números" ? <SemNumeros key="nada" exemplo={a.exemplo} /> : <span key="nada" className="x-mesa">{t}</span>);
  }
  return partes;
}

/* A perda de Vida do Sangramento, no detalhe da condição que sangra (e só nela). Uma ação explícita, uma rolagem: consultar, abrir o detalhe, selecionar
   o cartão ou avançar a rodada NUNCA a disparam. O dado é o da faixa que o derive resolveu, e a perda vai direto na Vida (sem a casca de PV Temporário). */
function PerdaDeSangramento({ a, g }) {
  const r = g.tela.sangramento?.[a.cond.id] ?? null;
  return (
    <div className="x-ctrl" data-sangramento={a.cond.id}>
      <span className="x-ctrl-nome">Sangramento</span>
      <button type="button" className="m-botao" onClick={() => g.acoes.sangrar(a)} data-sangrar={a.cond.id}
        title={`Rolar ${a.sangra.dados}d${a.sangra.faces} e descontar direto da Vida`}>
        <Dices aria-hidden="true" />Perda de Vida {a.sangra.dados}d{a.sangra.faces}
      </button>
      {r && <span className="x-mesa" role="status" data-sangramento-resultado data-total={r.total} data-vida={r.vida}>{r.vida ? `Perdeu ${Math.abs(r.vida)} de Vida` : "Sem Vida para Perder"} · {r.dados}d{r.faces} deu {r.total}</span>}
    </div>
  );
}

export function Ajustar({ a, g, m }) {
  /* A Sustentação: trocar o Feitiço da vaga é a Preparação das vagas, com o que fica e o que sai à vista. */
  if (a.tipo === "sustentado") return <TrocarSustentado a={a} g={g} m={m} />;
  if (a.tipo === "grupo") {
    const gr = a.grupo;
    if (ehPiloto(a)) return <AjusteG2 a={a} g={g} m={m} />;
    /* O Golpe Especial: não há ajuste das marcas de um golpe que já foi pago. Montar outro é um golpe novo. */
    if (ehGolpe(a)) return <MontarOutroGolpe a={a} g={g} m={m} />;
    /* A Preparação comum: o ajuste também é rascunho, com Confirmar Ajuste. Ligar sem mais nada (Invencível) não tem ajuste.
       Cobrir-se não tem ajuste do uso atual (autor, 2026-10-16): tem USAR NOVAMENTE, um uso novo pela Preparação. */
    if (temPreparo(a)) {
      if (preparoDe(a).reuso) return <UsarNovamente a={a} g={g} m={m} />;
      return semAjuste(a) ? <span className="x-mesa">Sem Ajuste na Ficha</span> : <AjusteGrupo a={a} g={g} m={m} />;
    }
    const c0 = gr.controles[0];
    const multiplos = gr.controles.length > 1 || gr.filhos.length > 0 || c0.partes || ["opcao", "multi"].includes(c0.estados[0].tipo);
    if (multiplos) return <ControlesDoGrupo gr={gr} m={g.mPara()} />;
    if (c0.estados[0].tipo === "faixa") return <div className="x-ctrl"><span className="x-ctrl-nome">{c0.rotulo ?? c0.estados[0].label}</span><Controle c={c0} m={g.mPara()} /></div>;
    return <span className="x-mesa">Sem Ajuste na Ficha</span>;
  }
  /* A instância de um Pacote para Aliados com prazo que a ficha não conta (alcance, manutenção, cena, uso): sem contagem de rodadas inventada. */
  if (a.tipo === "registro" && a.reg.pacote && (a.reg.pacote.duracao?.tipo !== "rodadas" || a.partes?.length)) return <span className="x-mesa">Sem Ajuste na Ficha</span>;
  if (a.tipo === "condicao" || a.tipo === "buff" || a.tipo === "registro") {
    return (
      <div className="x-ctrl">
        <span className="x-ctrl-nome">Rodadas</span>
        <span className="m-passos">
          <button type="button" className="m-passo" aria-label="Uma rodada a menos" disabled={a.rodadas == null || a.rodadas <= 1} onClick={() => g.acoes.rodadas(a, a.rodadas - 1)}><Minus aria-hidden="true" /></button>
          <span className="m-passos-valor">{a.rodadas ?? "Sem"}</span>
          <button type="button" className="m-passo" aria-label="Uma rodada a mais" onClick={() => g.acoes.rodadas(a, (a.rodadas ?? 0) + 1)}><Plus aria-hidden="true" /></button>
        </span>
        {a.rodadas != null && <button type="button" className="m-link" onClick={() => g.acoes.rodadas(a, null)}>Sem Duração</button>}
        {a.tipo === "condicao" && a.sangra && <PerdaDeSangramento a={a} g={g} />}
      </div>
    );
  }
  if (a.tipo === "exaustao") {
    return (
      <div className="x-ctrl">
        <span className="x-ctrl-nome">Nível</span>
        <span className="m-passos">
          <button type="button" className="m-passo" aria-label="Exaustão menos 1" onClick={() => g.acoes.exaustao(a.nivel - 1)}><Minus aria-hidden="true" /></button>
          <span className="m-passos-valor">{a.nivel}</span>
          <button type="button" className="m-passo" aria-label="Exaustão mais 1" onClick={() => g.acoes.exaustao(a.nivel + 1)}><Plus aria-hidden="true" /></button>
        </span>
      </div>
    );
  }
  return <span className="x-mesa">Sem Ajuste na Ficha</span>;
}

export function Termina({ a, d, m, g = null }) {
  /* Só quem ATIVAR gasta o contador real (`usos` do descritor da Preparação): os outros seguem "acompanhe você". */
  const usoId = preparoDe(a)?.usos;
  const u = usoId && m ? m.derived.usosHabilidades?.[usoId] ?? null : null;
  const t = terminaDe(a, d, u ? { max: u.max, restam: Math.max(0, u.max - Sessao.usosGastosDe(m.sessao, u.chave)) } : null);
  if (!t.length) return <span className="x-mesa">Sem Duração na Ficha</span>;
  return t.map((x, i) => (
    <React.Fragment key={i}>
      <span className="x-texto" data-termina>{x.texto}</span>
      {x.instrucao && <Instrucao {...x.instrucao} />}
      {/* A parte que a ficha não conta (o benefício de um ataque, PA-I3) encerra sozinha: a de rodadas segue. */}
      {x.parte && g && <button type="button" className="m-link" onClick={() => g.acoes.encerrarParte(a, x.parte)} data-encerrar-parte={x.parte}>Encerrar Parte</button>}
    </React.Fragment>
  ));
}

export function Rodape({ a, m, d, onConsultar }) {
  const itens = [];
  const p = a.tipo === "registro" ? a.reg.pacote : null;
  if (p) {
    /* De onde veio e quanto custa para QUEM EMITE. O custo é informação: a ficha do aliado não desconta nada por ele. */
    const naBiblioteca = (m?.biblioteca ?? []).some((x) => x.chave === p.chave && x.opcoes.some((o) => o.id === p.opcaoId));
    itens.push(`${p.nome} · Revisão ${p.revisao} · De ${p.emissorNome}${p.calculo === "manual" ? " · Definido à Mão" : ""}`);
    if (p.custoEmissor) itens.push(`Custo do Emissor: ${p.custoEmissor}`);
    if (!naBiblioteca) itens.push("Fora da Revisão Atual");
  } else if (a.tipo === "registro") {
    itens.push(`${a.reg.origemNome}${a.reg.origemId ? "" : " (Personalizada)"} · ${origemPorId(a.reg.origemId)?.rotuloTipo ?? TIPOS_FONTE.find((t) => t.id === a.reg.tipoFonte)?.rotulo ?? "Recebido"}${a.reg.aplicadoPor ? ` · Aplicado por ${a.reg.aplicadoPor}` : ""}`);
  } else if (a.origem?.rotulo) itens.push([a.origem.rotulo, a.origem.detalhe].filter(Boolean).join(" · "));
  const ex = a.exemplo;
  if (ex?.quando && !/um ataque só/i.test(ex.quando)) itens.push(ex.quando);
  /* No piloto o custo do passo atual mora no Ajustar, junto do controle. Na
     Preparação comum, o custo à mão também (o total do efeito e o Descontar),
     para o rodapé não pedir de novo o total depois de um ajuste. Sem custo
     registrado, ela diz isso: custo ausente não é grátis. */
  const preparo = temPreparo(a);
  /* O Ajustar mostra o total e o Descontar só quando há o que ajustar (faixa, escolhas). Ligar sem mais nada,
     ou uma opção só, não tem ajuste: o custo à mão fica aqui, com o Descontar (E2). */
  const ajusteCobre = preparo && !semAjuste(a) && !preparoDe(a).reuso;
  let custo = null;
  if (!ehPiloto(a) && d.custo && !(ajusteCobre && !d.custo.cobra)) custo = <CustoG2 custo={d.custo} m={m} nome={a.nome} />;
  else if (preparo && !d.custo) custo = <span className="x-mesa" data-sem-custo="">Sem Custo Registrado</span>;
  return (
    <div className="x-rodape">
      {itens.map((t) => <span key={t}>{t}</span>)}
      {custo}
      {a.consulta && <button type="button" className="m-link x-regra" onClick={() => onConsultar(a.consulta, "regra")} data-regra={a.chave}><BookOpenText aria-hidden="true" />Regra Completa</button>}
    </div>
  );
}

function DetalheG2({ a, g, m, onConsultar }) {
  const faixa = useRef(null);
  const d = detalhesDoAtivo(a, m);
  const { chips, contrib } = consequenciasDaLinha(a, g, m);
  const pvb = pvDoAtivo(a, g.pv);
  const estados = estadosDoCartao(a, m, { curto: false });
  const prazo = prazoCurto(a, d);
  const r = g.resultado;
  /* A seta da faixa aponta para o centro do cartão aberto. Medida direto no
     nó, sem estado: a medida não muda o leiaute. */
  useLayoutEffect(() => {
    const el = faixa.current;
    const cartao = el?.parentElement?.querySelector(`[data-chave-ativo="${CSS.escape(a.chave)}"]`);
    if (!el || !cartao) return undefined;
    const mede = () => el.style.setProperty("--seta", `${cartao.offsetLeft + cartao.offsetWidth / 2 - 7}px`);
    mede();
    window.addEventListener("resize", mede);
    return () => window.removeEventListener("resize", mede);
  });
  const meta = [...estados.map((x) => [x.rotulo, x.valor].filter(Boolean).join(" ")), prazo?.texto, a.origem?.curta].filter(Boolean);
  const fechar = () => g.mudaTela({ selecionado: null });
  return (
    <div ref={faixa} className="d-exp" role="region" aria-label={a.nome} data-exp={a.chave}>
      <div className="x-cartao-topo">
        <div><h2 className="x-cartao-nome">{a.nome}</h2>{meta.length > 0 && <p className="x-cartao-meta">{meta.map((t) => <span key={t}>{t}</span>)}</p>}</div>
        <span className="x-cartao-acoes">
          <button type="button" className="m-botao" onClick={() => g.acoes.encerrar(a)} data-encerrar={a.chave}><Power aria-hidden="true" />{a.tipo === "exaustao" ? "Zerar" : "Encerrar"}</button>
          <button type="button" className="e-icone" aria-label={`Fechar ${a.nome}`} onClick={fechar}><X aria-hidden="true" /></button>
        </span>
      </div>
      {r && r.alvo === a.chave && <ResultadoG2 r={r} g={g} m={m} pvb={pvb} />}
      {d.atencao.length > 0 && <div className="x-atencao-bloco">{d.atencao.map((t) => <span key={t} className="x-atencao"><AlertTriangle aria-hidden="true" />{t}</span>)}</div>}
      <div className="x-colunas">
        <section className="x-col" data-col="agora"><h4>Agora</h4><Agora a={a} g={g} m={m} chips={chips} contrib={contrib} pvb={pvb} /></section>
        <section className="x-col" data-col="ajustar"><h4>Ajustar</h4><Ajustar a={a} g={g} m={m} /></section>
        <section className="x-col" data-col="termina"><h4>Termina</h4><Termina a={a} d={d} m={m} g={g} /></section>
      </div>
      <Rodape a={a} m={m} d={d} onConsultar={onConsultar} />
    </div>
  );
}

/* ---------------- os Ativos ---------------- */
function AtivosG2({ g, m, onConsultar }) {
  const rola = useRef(null);
  useRolagemPorChave(rola, `${m.mesaId}:g2-ativos`, mapaDe("g2"));
  const sel = g.tela.selecionado;
  /* Depois de uma operação (ou de abrir um cartão), o cartão e o detalhe dele à vista. */
  useLayoutEffect(() => {
    const chave = g.tela.revelar;
    if (!chave) return;
    const caixa = rola.current;
    /* "encerrado:<chave>": a Linha do Tempo de um efeito já encerrado leva à entrada dele nos Encerrados. */
    const el = chave.startsWith("encerrado:")
      ? caixa?.querySelector(`[data-encerrado="${CSS.escape(chave.slice(10))}"]`)
      : caixa?.querySelector(`[data-chave-ativo="${CSS.escape(chave)}"]`);
    if (el) {
      const c = caixa.getBoundingClientRect();
      const topo = el.getBoundingClientRect().top - c.top;
      const fundo = (caixa.querySelector(".d-exp") ?? el).getBoundingClientRect().bottom - c.top;
      if (topo < 56 || fundo > caixa.clientHeight) caixa.scrollTop += topo - 64;
    }
    g.mudaTela({ revelar: null });
  }, [g.tela.revelar, g.ativos]); // eslint-disable-line react-hooks/exhaustive-deps
  const secoes = [
    { id: "fora", rotulo: "Condições e Recebidos", itens: g.ativos.filter((a) => a.classe !== "proprio") },
    { id: "proprio", rotulo: "Do Personagem", itens: g.ativos.filter((a) => a.classe === "proprio") },
  ].filter((s) => s.itens.length);
  const r = g.resultado;
  const avulso = r && String(r.alvo ?? "").startsWith("enc:") ? r : null;
  const abrir = (chave) => g.mudaTela((t) => ({ selecionado: t.selecionado === chave ? null : chave, revelar: t.selecionado === chave ? null : chave }));
  return (
    <div ref={rola} className="x-rola g2-ativos" data-rolavel="ativos">
      <div className="x-cabeca">
        <h2 className="x-titulo">Ativos</h2>
        <span className="x-cabeca-acoes">
          <AcessoAExaustao g={g} m={m} onde="completa" />
          <button type="button" className="m-botao x-adicionar" onClick={() => g.abrirCatalogo("ficha")} data-adicionar><Plus aria-hidden="true" />Adicionar</button>
        </span>
      </div>
      {avulso && <ResultadoG2 r={avulso} g={g} m={m} />}
      <LinhaDoTempoG2 g={g} m={m} />
      {!secoes.length && <p className="x-mesa g2-vazio">Nenhum Efeito Ativo</p>}
      {secoes.map((s) => (
        <section key={s.id} aria-label={s.rotulo}>
          <h3 className="d-secao">{s.rotulo}</h3>
          <div className="g-grade" data-variante="2">
            {s.itens.map((a) => (
              <React.Fragment key={a.chave}>
                <CartaoG2 a={a} m={m} aberto={sel === a.chave} onAbrir={() => abrir(a.chave)} />
                {sel === a.chave && <DetalheG2 a={a} g={g} m={m} onConsultar={onConsultar} />}
              </React.Fragment>
            ))}
          </div>
        </section>
      ))}
      <EncerradosG2 g={g} m={m} onde="completa" />
      <AcessoAoHistorico onde="completa" />
    </div>
  );
}

export function VisaoG2({ g, m, onConsultar, focoBusca, onVoltarDoCatalogo = null }) {
  return (
    <div className="g2-raiz" data-g2>
      {g.tela.catalogo.aberto ? <CatalogoG2 g={g} m={m} onConsultar={onConsultar} focoBusca={focoBusca} onVoltar={onVoltarDoCatalogo} /> : <AtivosG2 g={g} m={m} onConsultar={onConsultar} />}
    </div>
  );
}
