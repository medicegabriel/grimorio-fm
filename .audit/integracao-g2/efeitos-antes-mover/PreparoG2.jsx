/* ============================================================
   G2 · PREPARAÇÃO E AJUSTE (Entrega 1: o Ataque Concentrado)
   ============================================================
   PREPARAÇÃO  o que escolher antes de ativar, o custo dessa escolha, o que
               muda nos números e só então Confirmar. Nada toca a sessão até
               confirmar: o rascunho mora no estado de tela (`catalogo.preparo`).
   AJUSTE      no detalhe do cartão ativo, o passo muda um rascunho, e a
               diferença aparece antes de confirmar. Subir cobra só a diferença
               do acumulado. Descer não devolve.
   Tudo o que tem valor sai do motor:
     - o controle e o teto: `o.grupo.controles[0]`, `max(derived)`
       (3 com Surto de Ação, 1 sem ele);
     - o custo: `estado.custoPE(v)`, o acumulado 1, 3 e 4 PE;
     - o que muda: o derive com o rascunho contra o derive de agora.
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Hand, Minus, Plus, Repeat, Zap } from "lucide-react";
import { energiaDisponivel } from "./mesa-verbos";
import { Controle } from "./pecas";
import { compararTudo, custoAntes, derivarCom, estaLigado, maxDe, verificacoes } from "./efeitos-dados";
import { GastarNaEnergia } from "./Gestor";
import { NOME_DO_FILHO, custoDe, custoEmJogo, preparoDe, rotuloDaFaixa } from "./g2-dados";
import { GanhaPerde, SemNumeros } from "./PecasG2";
import { planoDoPreparo, previaDoPlano, raizDo, rascunhoInicial, saneia } from "./g2-preparo";
import { planoDoGolpe, previaDoGolpe, rascunhoDoGolpe } from "./g2-golpe";

const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));

/** O que a ficha diz deste controle: o estado, o rótulo, o teto e o custo de cada passo. */
export function faixaDoPiloto(gr, derived) {
  const c = gr.controles[0];
  const e = c.estados[0];
  const max = inteiro(maxDe(e, derived));
  const passos = Array.from({ length: max }, (_, i) => i + 1);
  return { c, e, max, passos, rotulo: rotuloDaFaixa(e, gr), custo: (v) => inteiro(custoDe(e, v)) };
}

/* O que muda nos números com o rascunho, pelo motor. Dois derives por escolha. */
function usePrevia(m, e, valor) {
  return useMemo(() => {
    if (valor == null) return [];
    const base = m.sessao;
    const antes = derivarCom(m.ficha, base);
    const depois = derivarCom(m.ficha, { ...base, combate: { ...(base.combate ?? {}), [e.id]: valor } });
    return compararTudo(depois, antes);
  }, [m.ficha, m.sessao, e.id, valor]);
}

/* Por padrão, a Preparação do catálogo (o rascunho em `catalogo.preparo`).
   Reativar um encerrado usa a MESMA Preparação, com o rascunho dele: reativar
   é uma ativação nova, que mostra a escolha e o custo e cobra ao confirmar. */
export function PreparoG2({ o, g, m, valor: valorDe = undefined, onValor = null, onCancelar = null, onConfirmar = null, rotuloConfirmar = "Confirmar Ativação" }) {
  const f = faixaDoPiloto(o.grupo, m.derived);
  const bruto = valorDe !== undefined ? valorDe : g.tela.catalogo.preparo?.valor;
  const valor = Math.min(f.max, Math.max(1, inteiro(bruto) || 1));
  const custo = f.custo(valor);
  const disponivel = energiaDisponivel(m.sessao);
  const bloqueios = [...verificacoes(o, m).nao, ...(disponivel < custo ? [`Faltam ${custo - disponivel} PE`] : [])];
  const previa = usePrevia(m, f.e, valor);
  const escolher = onValor ?? ((n) => g.mudaCatalogo((c) => ({ preparo: { ...c.preparo, valor: n } })));
  const cancelar = onCancelar ?? (() => g.mudaCatalogo({ preparo: null }));
  const confirmar = onConfirmar ?? ((v) => g.acoes.confirmarAtivacao(o, v));
  /* O Confirmar à vista: o detalhe rola sozinho até ele quando a Preparação abre. */
  const botoes = useRef(null);
  useEffect(() => { botoes.current?.scrollIntoView({ block: "nearest" }); }, []);
  /* Um clique só: o segundo de um clique duplo não chega à mesa (2026-10-15).
     Se a confirmação não passar, o botão volta a valer. */
  const enviado = useRef(false);
  const aoConfirmar = () => {
    if (enviado.current) return;
    enviado.current = true;
    if (confirmar(valor) === false) enviado.current = false;
  };
  return (
    <div className="k-confirmar g2-preparo" data-ativando="">
      <h3 className="k-sub">Preparação</h3>
      <div className="g2-preparo-linha">
        <span className="x-ctrl-nome">{f.rotulo}</span>
        <span className="m-seg g2-escolha" role="radiogroup" aria-label={f.rotulo} data-preparo-intensidade>
          {f.passos.map((n) => (
            <button key={n} type="button" role="radio" className="m-seg-op" aria-checked={n === valor} data-valor={n} onClick={() => escolher(n)}>{n}</button>
          ))}
        </span>
      </div>
      <span className="x-custo-jogo" data-auto="" data-custo-preparo={custo}><Zap aria-hidden="true" />{custo ? `Desconta ${custo} PE da Energia ao Confirmar` : "Sem Custo"}</span>
      <h3 className="k-sub">Ao Confirmar</h3>
      <div className="g2-previa" data-previa>
        {previa.length ? <GanhaPerde chips={previa} /> : <span className="x-mesa">Sem Mudança nos Seus Números</span>}
      </div>
      {bloqueios.map((t) => <span key={t} className="x-atencao" data-bloqueio><AlertTriangle aria-hidden="true" />{t}</span>)}
      <span ref={botoes} className="x-linha">
        <button type="button" className="m-botao x-adicionar g2-primario" disabled={bloqueios.length > 0} onClick={aoConfirmar} data-confirmar>{rotuloConfirmar}</button>
        <button type="button" className="m-botao" onClick={cancelar} data-voltar-preparo>Voltar</button>
      </span>
    </div>
  );
}

/* O ajuste do cartão ativo. O passo muda o rascunho; a sessão só muda ao confirmar. */
export function AjusteG2({ a, g, m }) {
  const f = faixaDoPiloto(a.grupo, m.derived);
  const atual = inteiro(m.sessao.combate?.[f.e.id]);
  const [valor, setValor] = useState(atual);
  const enviado = useRef(false);
  useEffect(() => { setValor(atual); enviado.current = false; }, [atual]);
  const aoConfirmar = () => {
    if (enviado.current) return;
    enviado.current = true;
    if (g.acoes.confirmarAjuste(a, valor) === false) enviado.current = false;
  };
  const dif = f.custo(valor) - f.custo(atual);
  const disponivel = energiaDisponivel(m.sessao);
  const falta = dif > 0 && disponivel < dif ? dif - disponivel : 0;
  const bloqueios = [...(!m.combate ? ["Pede Em Combate"] : []), ...(falta ? [`Faltam ${falta} PE`] : [])];
  const mudou = valor !== atual;
  /* A confirmação do ajuste à vista quando ela aparece (a lista dos Ativos rola). */
  const pendente = useRef(null);
  useEffect(() => { if (mudou) pendente.current?.scrollIntoView({ block: "nearest" }); }, [mudou]);
  return (
    <div className="x-ctrl" data-ajuste>
      <span className="x-ctrl-nome">{f.rotulo}</span>
      <span className="x-ctrl-linha">
        <span className="m-passos">
          <button type="button" className="m-passo" aria-label={`${f.rotulo} menos 1`} disabled={valor <= 1} onClick={() => setValor(valor - 1)}><Minus aria-hidden="true" /></button>
          <span className="m-passos-valor" aria-live="polite" data-ajuste-valor={valor}>{valor}<small>/{f.max}</small></span>
          <button type="button" className="m-passo" aria-label={`${f.rotulo} mais 1`} disabled={valor >= f.max} onClick={() => setValor(valor + 1)}><Plus aria-hidden="true" /></button>
        </span>
        {!mudou && <span className="x-custo">Custo da {f.rotulo} {atual}: {f.custo(atual)} PE</span>}
      </span>
      {mudou && (
        <div ref={pendente} className="g2-ajuste" data-ajuste-pendente>
          {dif > 0
            ? <span className="x-custo-jogo" data-auto="" data-custo-ajuste={dif}><Zap aria-hidden="true" />Desconta {dif} PE da Energia ao Confirmar</span>
            : <span className="x-custo-jogo" data-custo-ajuste="0">Sem Devolução de PE</span>}
          {bloqueios.map((t) => <span key={t} className="x-atencao" data-bloqueio><AlertTriangle aria-hidden="true" />{t}</span>)}
          <span className="x-linha">
            <button type="button" className="m-botao x-adicionar g2-primario" disabled={bloqueios.length > 0} onClick={aoConfirmar} data-confirmar-ajuste>Confirmar Ajuste</button>
            <button type="button" className="m-botao" onClick={() => setValor(atual)} data-voltar-ajuste>Voltar</button>
          </span>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   A PREPARAÇÃO COMUM (Catálogo, primeira entrega, 2026-10-15)
   ============================================================
   Concentrar Aura, Conhecimento Aplicado e Invencível sob o Sol, com as
   MESMAS peças e classes da Preparação do piloto. O que confirmar faz vem do
   plano (`preparo.js`), refeito a cada escolha e de novo ao confirmar.
   ⚠ NO RASCUNHO, O CUSTO À MÃO É SÓ TEXTO. O Descontar abre o painel de
   Energia de verdade, e pagar antes de confirmar e depois cancelar quebraria
   a sessão intacta. O Descontar aparece no resultado e no detalhe, depois.
   ============================================================ */

/* O `m` do rascunho: a sessão com os valores escolhidos por cima, e o
   `estadoMuda` escrevendo no rascunho. Os controles de hoje servem sem mudar. */
const mDoRascunho = (m, valores, aoMudar) => ({
  ...m,
  sessao: { ...m.sessao, combate: { ...(m.sessao.combate ?? {}), ...valores } },
  estadoMuda: (e, v) => aoMudar(e, v),
});
const limiteDe = (e) => (e.maxSelecionados != null ? inteiro(e.maxSelecionados) : null);
const RotuloEscolhas = ({ e }) => <>Escolhas{limiteDe(e) != null && <small> · Até {limiteDe(e)}</small>}</>;
/* "Nenhuma Escolha" bloqueia o Confirmar, mas não vira aviso enquanto o rascunho
   está vazio de saída: ainda não é um problema. Num ajuste que tira tudo, é. */
const avisosDe = (plano) => (plano.mudou ? plano.bloqueios : plano.bloqueios.filter((t) => t !== "Nenhuma Escolha"));

/** Antes de abrir a Preparação: só o custo e quem desconta. Nada clicável. */
export function ResumoDoPreparo({ o, m }) {
  const raiz = raizDo(o.grupo);
  const c = custoAntes(o, m);
  if (c?.cobra) return <span className="x-custo-jogo" data-auto="" data-custo-resumo><Zap aria-hidden="true" />{custoEmJogo(c).texto}</span>;
  /* O custo por PARTES do estudo (E3): uma linha por parte, com o teto real do motor na parte que é o valor. */
  if (o.exemplo?.custoDoEstado) {
    const partes = o.exemplo.custoDoEstado;
    const textos = partes.filter((p) => !p.substitui).map((p) => {
      const e = o.grupo.estados.find((x) => x.id === p.estado);
      if (!e) return null;
      const quanto = p.valor ? (() => { const max = inteiro(maxDe(e, m.derived)); return max > 1 ? `de 1 a ${max} PE` : "1 PE"; })() : `${inteiro(p.pe)} PE`;
      /* A habilidade que SUBSTITUI esta parte (o Espírito Incansável, no lugar do Espírito de Luta) vai na mesma linha. */
      const versao = partes.find((x) => x.substitui === p.estado);
      return `Desconte ${quanto} da Energia${p.rotulo ? ` ${p.rotulo}` : ""}${versao ? `, ou ${inteiro(versao.pe)} PE com ${NOME_DO_FILHO[versao.estado] ?? versao.rotulo ?? versao.estado}` : ""}`;
    }).filter(Boolean);
    return textos.map((t) => <span key={t} className="x-custo-jogo" data-custo-resumo><Hand aria-hidden="true" />{t}</span>);
  }
  if (o.exemplo?.custoDoValor && raiz.tipo === "faixa") {
    const max = inteiro(maxDe(raiz, m.derived));
    return <span className="x-custo-jogo" data-custo-resumo><Hand aria-hidden="true" />{max > 1 ? `Desconte de 1 a ${max} PE da Energia` : "Desconte 1 PE da Energia"}</span>;
  }
  if (c) return <span className="x-custo-jogo" data-custo-resumo><Hand aria-hidden="true" />{custoEmJogo(c).texto}</span>;
  return <span className="x-mesa" data-custo-resumo data-sem-custo="">Sem Custo Registrado</span>;
}

/** Quem desconta o quê. A ficha: o que a simulação cobrou e o "por Rodada". À mão: só texto. No ajuste, o adicional desta operação e o total do efeito, separados. */
function CustoDoPlano({ plano, ajuste = false }) {
  const c = plano.custo;
  const out = [];
  if (c.ficha > 0) out.push(<span key="agora" className="x-custo-jogo" data-auto="" data-custo-preparo={c.ficha}><Zap aria-hidden="true" />Desconta {c.ficha} PE da Energia ao Confirmar</span>);
  if (c.rodada) out.push(<span key="rodada" className="x-custo-jogo" data-auto="" data-custo-rodada=""><Zap aria-hidden="true" />{custoEmJogo(c.rodada).texto}</span>);
  /* A Sustentação: o custo por rodada de cada Feitiço que entra, à mão (a política de pagar a manutenção é da mesa). */
  for (const x of c.sustentacao ?? []) {
    if (x.pe) out.push(<span key={`sust-${x.estado}`} className="x-custo-jogo" data-custo-sustentacao={x.pe}><Hand aria-hidden="true" />{c.sustentacao.length > 1 ? `${x.nome}: ` : ""}{custoEmJogo({ texto: `${x.pe} PE por Rodada`, cobra: false }).texto}</span>);
  }
  if (c.total != null) {
    if (c.manual > 0) out.push(<span key="mao" className="x-custo-jogo" data-custo-preparo={c.manual} data-a-mao=""><Hand aria-hidden="true" />Desconte {c.manual} PE da Energia</span>);
    else if (ajuste && c.totalAntes != null && c.total < c.totalAntes) out.push(<span key="sem" className="x-custo-jogo" data-custo-preparo="0"><Hand aria-hidden="true" />Sem Devolução de PE</span>);
    if (ajuste) out.push(<span key="total" className="x-custo" data-custo-total={c.total}>Total do Efeito: {c.total} PE</span>);
  } else if (!c.automatico && !c.ficha && !(c.sustentacao ?? []).some((x) => x.pe)) out.push(<span key="nada" className="x-mesa" data-sem-custo="">Sem Custo Registrado</span>);
  return out;
}

/* `reuso`: no USAR NOVAMENTE o que resta da reserva do uso anterior fica à vista, porque a reserva guarda o MAIOR entre ele e a concessão nova. */
/* SUSTENTAÇÃO: o que fica, o que sai e o que entra em cada vaga, antes de confirmar. Nada some calado. */
function TrocasDaSustentacao({ trocas }) {
  if (!trocas || (!trocas.saem.length && !trocas.entram.length && !trocas.ficam.length)) return null;
  return (
    <div className="g2-previa" data-trocas>
      {trocas.ficam.map((x) => <span key={`f${x.estado}`} className="x-mesa" data-fica={x.estado}>Fica: {x.nome} · {x.vaga}</span>)}
      {trocas.saem.map((x) => <span key={`s${x.estado}`} className="x-atencao" data-sai={x.estado}><AlertTriangle aria-hidden="true" />Sai: {x.nome} · {x.vaga}</span>)}
      {trocas.entram.map((x) => <span key={`e${x.estado}`} className="x-neutro" data-entra={x.estado}>Entra: {x.nome} · {x.vaga}</span>)}
    </div>
  );
}

function Previa({ previa, exemplo, reuso = false }) {
  return (
    <div className="g2-previa" data-previa>
      {previa.chips.length > 0 ? <GanhaPerde chips={previa.chips} /> : !previa.pv && <SemNumeros exemplo={exemplo} />}
      {previa.pv && (
        <span className="g-pv" data-pv-previa>
          <span>PV Temporário <b>{previa.pv.concede}</b></span>
          {previa.pv.registrado != null && previa.pv.registrado !== previa.pv.concede && <span className="g-suave" data-pv-registrado={previa.pv.registrado}>Registrado {previa.pv.registrado}</span>}
          {reuso && previa.pv.resta > 0 && <span className="g-suave" data-pv-resta={previa.pv.resta}>Restam {previa.pv.resta}</span>}
          <span className="g-suave">{previa.pv.texto}</span>
        </span>
      )}
    </div>
  );
}

/* Os usos que ATIVAR gasta (a Postura), lidos do contador real do motor. Nada é gasto antes de confirmar. */
function UsosDoPlano({ plano }) {
  const u = plano.usos;
  if (!u) return null;
  return <span className="x-custo" data-usos-restam={u.restam} data-usos-max={u.max}>Gasta 1 Uso ao Confirmar · Restam {u.restam} de {u.max}</span>;
}

/* Ligar, sem mais nada, não tem controle: é o próprio efeito. No Repertório (`exigeUm`) a raiz também é escolha. */
const ehLigarSimples = (c, raiz, exigeUm) => !exigeUm && c.estados.length === 1 && c.estados[0].id === raiz.id && c.estados[0].tipo === "bool";
/** Sem nada a ajustar: ligar sem mais nada, ou uma opção só (Golpe com Aura com uma aura). O filho que é uma ESCOLHA ao
 *  utilizar (o Espírito Incansável, `escolhaNoUso`) não é ajuste do efeito ativo: a escolha se faz na Preparação. */
export const semAjuste = (o) => {
  const gr = o.grupo;
  const escolha = preparoDe(o)?.escolhaNoUso;
  const filhos = gr.filhos.filter((f) => f.id !== escolha);
  return gr.controles.length === 1 && gr.controles[0].estados.length === 1 && !filhos.length
    && (gr.controles[0].estados[0].tipo === "bool"
      || (gr.controles[0].estados[0].tipo === "opcao" && (gr.controles[0].estados[0].opcoesVisiveis ?? gr.controles[0].estados[0].opcoes ?? []).length <= 1));
};
/* O nome do controle na linha: o do próprio controle quando ele tem partes (Duelando) ou é escolha de opção. */
const nomeDoControle = (c, e, gr) => {
  if (c.partes) return c.rotulo;
  if (e.tipo === "opcao" && e.label === gr.nome) return "Escolha";
  return c.estados.length === 1 ? rotuloDaFaixa(e, gr) : c.rotulo;
};

/* As escolhas do rascunho. `semRaiz`: o controle da raiz já está desenhado fora (o passo do ajuste). Os filhos só
   aparecem com o pai ligado no rascunho. `escolhaNoUso`: o filho que é escolhido ao UTILIZAR a habilidade (o Espírito
   Incansável) vira uma escolha entre as habilidades, pelos nomes delas, e nunca um interruptor de upgrade. */
function EscolhasDoRascunho({ gr, m, valores, aoMudar, exigeUm = false, semRaiz = false, escolhaNoUso = null }) {
  const raiz = raizDo(gr);
  const mm = mDoRascunho(m, valores, aoMudar);
  const controles = gr.controles.map((c) => {
    const e = c.estados[0];
    if (ehLigarSimples(c, raiz, exigeUm)) return null;
    if (semRaiz && c.estados.some((x) => x.id === raiz.id)) return null;
    if (c.estados.length === 1 && e.tipo === "faixa" && inteiro(maxDe(e, m.derived)) <= 6) {
      const rotulo = rotuloDaFaixa(e, gr);
      /* No Estímulo Muscular o teste pode ficar em zero (só o Empurrão). */
      const zero = exigeUm && e.id === raiz.id;
      const passos = Array.from({ length: inteiro(maxDe(e, m.derived)) + (zero ? 1 : 0) }, (_, i) => i + (zero ? 0 : 1));
      return (
        <div key={c.id} className="g2-preparo-linha">
          <span className="x-ctrl-nome">{rotulo}</span>
          <span className="m-seg g2-escolha" role="radiogroup" aria-label={rotulo} data-preparo-faixa={e.id}>
            {passos.map((n) => (
              <button key={n} type="button" role="radio" className="m-seg-op" aria-checked={n === inteiro(valores[e.id])} data-valor={n} onClick={() => aoMudar(e, n)}>{n}</button>
            ))}
          </span>
        </div>
      );
    }
    if (c.estados.length === 1 && e.tipo === "multi") {
      return (
        <div key={c.id} className="g2-preparo-linha g2-rascunho-multi">
          <span className="x-ctrl-nome"><RotuloEscolhas e={e} /></span>
          <Controle c={c} m={mm} limite={limiteDe(e)} />
        </div>
      );
    }
    return (
      <div key={c.id} className="g2-preparo-linha">
        <span className="x-ctrl-nome">{nomeDoControle(c, e, gr)}</span>
        <Controle c={c} m={mm} />
      </div>
    );
  });
  const filhos = gr.filhos.filter((f) => !gr.controles.some((c) => c.estados.some((x) => x.id === f.id))
    && gr.estados.some((p) => p.id === f.requerEstado && estaLigado(p, valores[p.id]))).map((f) => {
    if (f.id === escolhaNoUso) {
      const incansavel = estaLigado(f, valores[f.id]);
      const opcoes = [{ id: "base", nome: gr.nome, marcada: !incansavel, valor: false }, { id: f.id, nome: NOME_DO_FILHO[f.id] ?? f.label, marcada: incansavel, valor: true }];
      return (
        <div key={f.id} className="g2-preparo-linha" data-escolha-uso={f.id}>
          <span className="x-ctrl-nome">Escolha</span>
          <span className="m-seg g2-escolha" role="radiogroup" aria-label="Escolha" data-preparo-escolha-uso>
            {opcoes.map((x) => (
              <button key={x.id} type="button" role="radio" className="m-seg-op" aria-checked={x.marcada} data-opcao={x.id} onClick={() => aoMudar(f, x.valor)}>{x.nome}</button>
            ))}
          </span>
        </div>
      );
    }
    return (
      <div key={f.id} className="g2-preparo-linha" data-filho={f.id}>
        <span className="x-ctrl-nome">{NOME_DO_FILHO[f.id] ?? f.label}</span>
        <Controle c={{ id: f.id, rotulo: f.label, estados: [f] }} m={mm} />
      </div>
    );
  });
  return [...controles, ...filhos];
}

/**
 * A Preparação comum, no catálogo, no Reativar e no Usar Novamente (`modo`: "ativar" ou "reuso"). O rascunho mora fora
 * (`valores`, na tela do gerenciador), e sair dela o descarta. `onConfirmar`
 * devolve se a confirmação passou: só então o botão fica gasto.
 */
export function PreparoGrupo({ o, m, valores, onValores, onCancelar, onConfirmar, rotuloConfirmar = "Confirmar Ativação", modo = "ativar", encerrado = null }) {
  const gr = o.grupo;
  const raiz = raizDo(gr);
  const plano = useMemo(() => planoDoPreparo({ o, valores, m, modo, encerrado }), [o, valores, modo, encerrado, m.mesa, m.sessao, m.derived, m.combate]); // eslint-disable-line react-hooks/exhaustive-deps
  const antes = useMemo(() => derivarCom(m.ficha, m.sessao), [m.ficha, m.sessao]);
  const previa = useMemo(() => previaDoPlano(plano, m, antes), [plano, antes]); // eslint-disable-line react-hooks/exhaustive-deps
  const botoes = useRef(null);
  useEffect(() => { botoes.current?.scrollIntoView({ block: "nearest" }); }, []);
  const enviado = useRef(false);
  const confirmar = () => {
    if (enviado.current) return;
    enviado.current = true;
    if (!onConfirmar(valores)) enviado.current = false;
  };
  const aoMudar = (e, v) => onValores({ ...valores, [e.id]: saneia(e, v, m.derived, { raiz: e.id === raiz.id && !preparoDe(o)?.exigeUm }) });
  const exigeUm = !!preparoDe(o)?.exigeUm;
  const temEscolha = gr.controles.some((c) => !ehLigarSimples(c, raiz, exigeUm)) || gr.filhos.length > 0;
  return (
    <div className="k-confirmar g2-preparo" data-ativando="" data-preparo-grupo={o.chave}>
      {temEscolha && <h3 className="k-sub">Preparação</h3>}
      {temEscolha && <EscolhasDoRascunho gr={gr} m={m} valores={plano.alvo} aoMudar={aoMudar} exigeUm={exigeUm} escolhaNoUso={preparoDe(o)?.escolhaNoUso} />}
      <TrocasDaSustentacao trocas={plano.trocas} />
      <CustoDoPlano plano={plano} />
      <UsosDoPlano plano={plano} />
      <h3 className="k-sub">Ao Confirmar</h3>
      <Previa previa={previa} exemplo={o.exemplo} reuso={modo === "reuso"} />
      {avisosDe(plano).map((t) => <span key={t} className="x-atencao" data-bloqueio><AlertTriangle aria-hidden="true" />{t}</span>)}
      <span ref={botoes} className="x-linha">
        <button type="button" className="m-botao x-adicionar g2-primario" disabled={plano.bloqueios.length > 0 || !plano.mudou} onClick={confirmar} data-confirmar>{rotuloConfirmar}</button>
        <button type="button" className="m-botao" onClick={onCancelar} data-voltar-preparo>Voltar</button>
      </span>
    </div>
  );
}

/**
 * SUSTENTAÇÃO, no cartão da vaga (consolidação ampliada, 2026-10-16): Trocar abre a MESMA Preparação das vagas, com o que
 * fica e o que sai à vista, e Encerrar é o do cartão. O rascunho é local, parte das vagas de agora e fecha quando elas mudam.
 */
export function TrocarSustentado({ a, g, m }) {
  const o = g.opcoes.find((x) => x.chave === a.grupo.chave) ?? null;
  const combate = m.sessao.combate ?? {};
  const atuais = o ? Object.fromEntries(o.grupo.estados.map((e) => [e.id, combate[e.id] ?? null])) : {};
  const chaveAtual = JSON.stringify(atuais);
  const [valores, setValores] = useState(null);
  useEffect(() => { setValores(null); }, [chaveAtual]);
  if (!o) return <span className="x-mesa">Sem Ajuste na Ficha</span>;
  if (valores === null) {
    return (
      <span className="x-ctrl" data-trocar-sustentado={a.chave}>
        <button type="button" className="m-botao" onClick={() => setValores(rascunhoInicial(o.grupo, m.derived, atuais))} data-trocar-abrir><Repeat aria-hidden="true" />Trocar</button>
      </span>
    );
  }
  const onde = g.tela.compactaAberto === a.chave ? "compacta" : "completa";
  return (
    <PreparoGrupo o={o} m={m} valores={valores} rotuloConfirmar="Confirmar Troca"
      onValores={setValores}
      onCancelar={() => setValores(null)}
      onConfirmar={(v) => { const ok = g.acoes.confirmarPreparo(o, v, { onde }); if (ok) setValores(null); return ok; }} />
  );
}

/* ============================================================
   O MONTADOR DO GOLPE ESPECIAL (consolidação ampliada, 2026-10-16)
   ============================================================
   As marcas em rascunho, o custo que a FICHA calcula (`custoDoGolpeDaSessao`) e cobra ao confirmar (`pagaGolpeEspecial`, pelo
   `aplicaGolpe`), a prévia pelo derive e os bloqueios. Ver `g2/golpe.js`. O que cobra aqui é o contrato do montador, e não a
   regra geral de confirmar: o custo aparece como "A Ficha Desconta", sem Descontar à mão.
   ============================================================ */
const sinalDe = (n) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);

export function PreparoGolpe({ o, m, valores, onValores, onCancelar, onConfirmar, rotuloConfirmar = "Confirmar Golpe" }) {
  const plano = useMemo(() => planoDoGolpe({ valores, m, simula: m.simularGolpe }), [valores, m.mesa, m.sessao, m.derived, m.combate]); // eslint-disable-line react-hooks/exhaustive-deps
  const antes = useMemo(() => derivarCom(m.ficha, m.sessao), [m.ficha, m.sessao]);
  const chips = useMemo(() => previaDoGolpe(plano, m, antes), [plano, antes]); // eslint-disable-line react-hooks/exhaustive-deps
  const botoes = useRef(null);
  useEffect(() => { botoes.current?.scrollIntoView({ block: "nearest" }); }, []);
  const enviado = useRef(false);
  const confirmar = () => {
    if (enviado.current) return;
    enviado.current = true;
    if (!onConfirmar(valores)) enviado.current = false;
  };
  const marca = (id, v) => onValores({ ...valores, marcas: { ...plano.marcas, [id]: v } });
  /* As cinco propriedades sem estado de bancada não têm número na linha de dano: entram só no custo. */
  const semNumero = plano.propriedades.filter((p) => !p.estado && p.vezes > 0).map((p) => p.nome);
  const fora = semNumero.length ? `${semNumero.join(", ")}: entram só no custo, e a linha de dano do motor não tem número para elas` : null;
  const c = plano.custo;
  return (
    <div className="k-confirmar g2-preparo" data-ativando="" data-preparo-golpe={o.chave}>
      <h3 className="k-sub">Preparação</h3>
      <div className="g2-preparo-linha g2-rascunho-multi" data-golpe-propriedades>
        <span className="x-ctrl-nome">Propriedades</span>
        <span className="m-seg" role="group" aria-label="Propriedades do Golpe">
          {plano.propriedades.filter((p) => !p.max).map((p) => (
            <button key={p.id} type="button" className="m-seg-op" aria-pressed={p.vezes > 0} data-golpe={p.id} onClick={() => marca(p.id, p.vezes ? 0 : 1)}>{p.nome} {sinalDe(p.unidade)}</button>
          ))}
        </span>
      </div>
      {plano.propriedades.filter((p) => p.max).map((p) => (
        <div key={p.id} className="g2-preparo-linha" data-golpe-contagem={p.id}>
          <span className="x-ctrl-nome">{p.nome} {sinalDe(p.unidade)}</span>
          <span className="m-passos">
            <button type="button" className="m-passo" aria-label={`${p.nome} menos 1`} disabled={p.vezes <= 0} onClick={() => marca(p.id, p.vezes - 1)}><Minus aria-hidden="true" /></button>
            <span className="m-passos-valor" aria-live="polite" data-valor={p.vezes}>{p.vezes ? (p.niveis?.[p.vezes - 1] ?? p.vezes) : 0}<small>/{p.max}</small></span>
            <button type="button" className="m-passo" aria-label={`${p.nome} mais 1`} disabled={p.vezes >= p.max} onClick={() => marca(p.id, p.vezes + 1)}><Plus aria-hidden="true" /></button>
          </span>
        </div>
      ))}
      {plano.auto && (
        <div className="g2-preparo-linha" data-golpe-autossuficiente>
          <span className="x-ctrl-nome">Autossuficiente</span>
          <span className="m-seg g2-escolha" role="radiogroup" aria-label="Autossuficiente">
            <button type="button" role="radio" className="m-seg-op" aria-checked={!plano.seis} data-valor="3" onClick={() => onValores({ ...valores, marcas: plano.marcas, seis: false })}>3 PE</button>
            <button type="button" role="radio" className="m-seg-op" aria-checked={plano.seis} data-valor="6" disabled={plano.seisUsado} title={plano.seisUsado ? "Usado Nesta Cena" : undefined} onClick={() => onValores({ ...valores, marcas: plano.marcas, seis: true })}>6 PE</button>
          </span>
        </div>
      )}
      {c.montado && (
        <>
          <span className="x-custo-jogo" data-auto="" data-custo-golpe={c.aPagar}><Zap aria-hidden="true" />A Ficha Desconta {c.aPagar} PE{plano.sacrificio ? " e 15 de Dano" : ""}</span>
          <span className="x-custo" data-golpe-partes>
            {/* Cada parte é inteira ("Atroz +1" não se parte), e o resumo quebra linha ENTRE as partes: o texto continua o mesmo de antes. */}
            {[...c.partes.map((p) => `${p.nome}${p.vezes > 1 ? ` ×${p.vezes}` : ""} ${sinalDe(p.valor)}`), ...(c.soma !== c.total ? [`Mínimo ${c.total}`] : []), ...(c.abatido ? [`Autossuficiente −${c.abatido}`] : [])]
              .map((t, i) => <React.Fragment key={`${i}-${t}`}>{i > 0 && " · "}<span className="g2-parte">{t}</span></React.Fragment>)}
          </span>
        </>
      )}
      <h3 className="k-sub">Ao Confirmar</h3>
      <div className="g2-previa" data-previa>
        {chips.length > 0 && <GanhaPerde chips={chips} />}
        {fora ? <SemNumeros fora={fora} /> : chips.length === 0 && <SemNumeros exemplo={o.exemplo} />}
      </div>
      {plano.bloqueios.filter((t) => plano.mudou || t !== "Nenhuma Propriedade").map((t) => <span key={t} className="x-atencao" data-bloqueio><AlertTriangle aria-hidden="true" />{t}</span>)}
      <span ref={botoes} className="x-linha">
        <button type="button" className="m-botao x-adicionar g2-primario" disabled={plano.bloqueios.length > 0 || !plano.mudou} onClick={confirmar} data-confirmar>{rotuloConfirmar}</button>
        <button type="button" className="m-botao" onClick={onCancelar} data-voltar-preparo>Voltar</button>
      </span>
    </div>
  );
}

/** O Golpe Especial ativo: montar OUTRO golpe é um golpe novo, de custo inteiro, pela mesma Preparação das marcas de agora. */
export function MontarOutroGolpe({ a, g, m }) {
  const combate = m.sessao.combate ?? {};
  const chaveAtual = JSON.stringify(a.grupo.estados.map((e) => combate[e.id] ?? null)) + JSON.stringify(m.sessao.golpeEspecial ?? {});
  const [valores, setValores] = useState(null);
  useEffect(() => { setValores(null); }, [chaveAtual]);
  if (valores === null) {
    return (
      <span className="x-ctrl" data-montar-outro={a.chave}>
        <button type="button" className="m-botao" onClick={() => setValores(rascunhoDoGolpe(m))} data-montar-outro-abrir><Repeat aria-hidden="true" />Montar Outro Golpe</button>
      </span>
    );
  }
  const onde = g.tela.compactaAberto === a.chave ? "compacta" : "completa";
  return (
    <PreparoGolpe o={a} m={m} valores={valores} rotuloConfirmar="Confirmar Golpe"
      onValores={setValores}
      onCancelar={() => setValores(null)}
      onConfirmar={(v) => { const ok = g.acoes.confirmarGolpe(a, v, { onde }); if (ok) setValores(null); return ok; }} />
  );
}

/**
 * USAR NOVAMENTE (autor, 2026-10-16): não existe aumentar o uso atual. Existe um uso novo, com o valor que o jogador
 * escolher, e a Preparação é a mesma da ativação, com o custo INTEIRO (9 PE de novo custam 9) e o pagamento à mão.
 * Cancelar não toca o uso anterior nem a reserva de PV. O rascunho é local e começa no valor de agora (pode ser o mesmo).
 */
export function UsarNovamente({ a, g, m }) {
  const gr = a.grupo;
  const combate = m.sessao.combate ?? {};
  const atuais = Object.fromEntries(gr.estados.map((e) => [e.id, combate[e.id]]));
  const chaveAtual = JSON.stringify(atuais);
  const [valores, setValores] = useState(null);
  /* O uso mudou (confirmou aqui ou na outra apresentação): o rascunho fecha, e o próximo recomeça do valor de agora. */
  useEffect(() => { setValores(null); }, [chaveAtual]);
  if (valores === null) {
    return (
      <span className="x-ctrl" data-usar-novamente={a.chave}>
        <button type="button" className="m-botao" onClick={() => setValores(rascunhoInicial(gr, m.derived, atuais))} data-usar-novamente-abrir><Repeat aria-hidden="true" />Usar Novamente</button>
      </span>
    );
  }
  return (
    <PreparoGrupo o={a} m={m} valores={valores} modo="reuso" rotuloConfirmar="Confirmar Novo Uso"
      onValores={setValores}
      onCancelar={() => setValores(null)}
      onConfirmar={(v) => { const ok = g.acoes.confirmarNovoUso(a, v); if (ok) setValores(null); return ok; }} />
  );
}

/**
 * O ajuste do cartão ativo, em rascunho: nada muda até Confirmar Ajuste.
 * Faixa em passos (como o piloto), escolhas com o limite. Parado, o custo à
 * mão mostra o TOTAL do efeito e o Descontar (o efeito já foi confirmado).
 */
export function AjusteGrupo({ a, g, m }) {
  const gr = a.grupo;
  const raiz = raizDo(gr);
  const combate = m.sessao.combate ?? {};
  const atuais = Object.fromEntries(gr.estados.map((e) => [e.id, combate[e.id]]));
  const chaveAtual = JSON.stringify(atuais);
  const [valores, setValores] = useState(() => rascunhoInicial(gr, m.derived, atuais));
  const enviado = useRef(false);
  /* A sessão mudou (confirmou aqui ou na outra apresentação): o rascunho recomeça dela. */
  useEffect(() => { setValores(rascunhoInicial(gr, m.derived, atuais)); enviado.current = false; }, [chaveAtual]); // eslint-disable-line react-hooks/exhaustive-deps
  const plano = useMemo(() => planoDoPreparo({ o: a, valores, m, modo: "ajuste" }), [a, valores, m.mesa, m.sessao, m.derived, m.combate]); // eslint-disable-line react-hooks/exhaustive-deps
  /* Parado, nada a comparar: os dois derives só rodam com o rascunho mudado. */
  const previa = useMemo(() => (plano.mudou ? previaDoPlano(plano, m, derivarCom(m.ficha, m.sessao)) : null), [plano]); // eslint-disable-line react-hooks/exhaustive-deps
  const pendente = useRef(null);
  useEffect(() => { if (plano.mudou) pendente.current?.scrollIntoView({ block: "nearest" }); }, [plano.mudou]);
  const aoMudar = (e, v) => setValores((x) => ({ ...x, [e.id]: saneia(e, v, m.derived, { raiz: e.id === raiz.id && !preparoDe(a)?.exigeUm }) }));
  const confirmar = () => {
    if (enviado.current) return;
    enviado.current = true;
    if (!g.acoes.confirmarAjustePreparo(a, valores)) enviado.current = false;
  };
  const exigeUm = !!preparoDe(a)?.exigeUm;
  let rotulo = null;
  let controle;
  if (raiz.tipo === "faixa") {
    rotulo = rotuloDaFaixa(raiz, gr);
    const max = inteiro(maxDe(raiz, m.derived));
    const n = inteiro(plano.alvo[raiz.id]);
    controle = (
      <span className="m-passos">
        <button type="button" className="m-passo" aria-label={`${rotulo} menos 1`} disabled={n <= (exigeUm ? 0 : 1)} onClick={() => aoMudar(raiz, n - 1)}><Minus aria-hidden="true" /></button>
        <span className="m-passos-valor" aria-live="polite" data-ajuste-valor={n}>{n}<small>/{max}</small></span>
        <button type="button" className="m-passo" aria-label={`${rotulo} mais 1`} disabled={n >= max} onClick={() => aoMudar(raiz, n + 1)}><Plus aria-hidden="true" /></button>
      </span>
    );
  } else if (raiz.tipo === "multi") {
    rotulo = <RotuloEscolhas e={raiz} />;
    controle = <Controle c={gr.controles[0]} m={mDoRascunho(m, plano.alvo, aoMudar)} limite={limiteDe(raiz)} />;
  } else if (semAjuste(a)) {
    return <span className="x-mesa">Sem Ajuste na Ficha</span>;
  }
  /* Os interruptores e a opção (Repertório, Golpe com Aura): uma linha por controle, os mesmos do rascunho do catálogo. */
  const escolhas = controle === undefined;
  return (
    <div className="x-ctrl" data-ajuste-grupo={a.chave}>
      {escolhas
        ? <EscolhasDoRascunho gr={gr} m={m} valores={plano.alvo} aoMudar={aoMudar} exigeUm={exigeUm} />
        : (
          <>
            <span className="x-ctrl-nome">{rotulo}</span>
            <span className={`x-ctrl-linha${raiz.tipo === "multi" ? " g2-rascunho-multi" : ""}`}>
              {controle}
              {!plano.mudou && plano.custo.total != null && (
                <>
                  <span className="x-custo" data-custo-total={plano.custo.total}>Total do Efeito: {plano.custo.total} PE</span>
                  <GastarNaEnergia m={m} nome={a.nome} rotulo="Descontar" />
                </>
              )}
            </span>
            {(gr.controles.length > 1 || gr.filhos.length > 0) && <EscolhasDoRascunho gr={gr} m={m} valores={plano.alvo} aoMudar={aoMudar} exigeUm={exigeUm} semRaiz />}
          </>
        )}
      {escolhas && !plano.mudou && plano.custo.total != null && (
        <span className="x-linha">
          <span className="x-custo" data-custo-total={plano.custo.total}>Total do Efeito: {plano.custo.total} PE</span>
          <GastarNaEnergia m={m} nome={a.nome} rotulo="Descontar" />
        </span>
      )}
      {plano.mudou && (
        <div ref={pendente} className="g2-ajuste" data-ajuste-pendente>
          <CustoDoPlano plano={plano} ajuste />
          {previa && <Previa previa={previa} exemplo={a.exemplo} />}
          {avisosDe(plano).map((t) => <span key={t} className="x-atencao" data-bloqueio><AlertTriangle aria-hidden="true" />{t}</span>)}
          <span className="x-linha">
            <button type="button" className="m-botao x-adicionar g2-primario" disabled={plano.bloqueios.length > 0} onClick={confirmar} data-confirmar-ajuste>Confirmar Ajuste</button>
            <button type="button" className="m-botao" onClick={() => setValores(rascunhoInicial(gr, m.derived, atuais))} data-voltar-ajuste>Voltar</button>
          </span>
        </div>
      )}
    </div>
  );
}
