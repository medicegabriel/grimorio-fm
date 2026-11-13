/* ============================================================
   G2 · ADICIONAR (o catálogo aprovado pelo autor, com os dados reais)
   ============================================================
   Busca no topo; à esquerda, categorias com nome de jogador (pelo prefixo
   da chave da opção); no meio, uma linha de 44 px por opção, com a estrela
   e, à direita, só "Ativar" ou "Ativo"; à direita, a opção escolhida.
   Categoria, busca, opção e rolagem sobrevivem a fechar e reabrir.

   Entrega 1: o Ataque Concentrado tem a Preparação que cobra ao confirmar.
   Catálogo, primeira entrega (2026-10-15): Concentrar Aura, Conhecimento
   Aplicado e Invencível sob o Sol têm a Preparação comum (`PreparoGrupo`),
   que NÃO cobra o que é à mão. O Ativar das outras opções abre o detalhe com
   o custo e a ação de hoje do gerenciador.
   ============================================================ */
import React, { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, BookOpenText, ChevronLeft, ChevronRight, Hand, Power, Search, Star, X, Zap } from "lucide-react";
import { buscar } from "./repertorio";
import { custoAntes, detalhesDoAtivo, pvDoAtivo, verificacoes } from "./efeitos-dados";
import { ControlesDoGrupo } from "./Gestor";
import { consequenciasDaLinha, finalidadeCurta } from "./gestor-logica";
import { Agora } from "./AgoraG2";
import { TextoRegra } from "./pecas";
import { mapaDe, useRolagemPorChave } from "./rolagem-g2";
import { CATEGORIAS, categoriaDe, classeENivel, ehGolpe, ehPiloto, ehRecebidoDePacote, ehSustentacao, rotuloCategoria, simples, temPreparo } from "./g2-dados";
import { acaoDaLinha, ativarOpcao, comVagaLivre, ordenaPorAcao, porNome } from "./catalogo-logica";

/* O resultado da última operação é desta opção? A Sustentação responde pela vaga que recebeu o Feitiço (`sust:<vaga>`), e não pela chave
   da opção nem pela primeira vaga ocupada: sem isto, confirmar a segunda vaga no catálogo não mostrava resultado nem custo (revisão de 2026-11-10). */
const resultadoDaOpcao = (r, o) => !!r && (r.alvo === o.chave || (ehSustentacao(o) && String(r.alvo ?? "").startsWith("sust:")));
import RecebidosG2, { DetalheRecebido } from "./RecebidosG2";
import ParaAliadosG2 from "./ParaAliadosG2";
import ImitacaoG2 from "./ImitacaoG2";
import { imitacaoDisponivel } from "./imitacao-logica";
import { CustoG2, ResultadoG2 } from "./PecasG2";
import { PreparoG2, PreparoGolpe, PreparoGrupo, ResumoDoPreparo } from "./PreparoG2";
import { faixaDoPiloto } from "./preparo-logica";
import { RegistrarUso } from "./UsoG2";
import { rascunhoDoCatalogo } from "./g2-preparo";
import { rascunhoDoGolpe } from "./g2-golpe";

function itensDaCategoria(g, m, cat) {
  const fav = m.sessao.favoritos ?? [];
  if (cat === "favoritos") return g.opcoes.filter((o) => fav.includes(o.chave));
  if (cat === "ativos") return g.opcoes.filter((o) => g.ligado(o));
  if (cat === "tudo") return g.opcoes;
  return g.opcoes.filter((o) => categoriaDe(o) === cat);
}

/* Uma linha só: a estrela (cheia no favorito), o nome inteiro no title e, à
   direita, a ação. Quem tem a Preparação comum (`temPreparo`) também tem Ativar. */
const ROTULO_DA_ACAO = { ativar: "Ativar", usar: "Usar", abrir: "Abrir" };
export function LinhaDeOpcao({ o, g, m, atual, aoEscolher, aoAtivar }) {
  const fav = (m.sessao.favoritos ?? []).includes(o.chave);
  const acao = acaoDaLinha(o, g, m);
  return (
    <div className="k-fila afty-catalogo-linha" aria-current={atual} data-chave-opcao={o.chave} data-acao={acao ?? undefined}>
      <button type="button" className="k-item" title={o.nome} aria-current={atual} onClick={aoEscolher}>
        <span className="k-nome">
          <span className="k-fav" data-favorito={fav ? "" : undefined} aria-label={fav ? "Favorito" : undefined} aria-hidden={fav ? undefined : "true"}><Star aria-hidden="true" /></span>
          <span className="k-texto">{o.nome}</span>
        </span>
      </button>
      {acao === "ativo" && (
        <button type="button" className="k-acao" data-tom="ativo" title="Abrir nos Ativos" aria-label={`Abrir ${o.nome} nos Ativos`} onClick={() => g.irAoAtivo(o.chave)}>
          <span className="k-acao-texto">Ativo</span><span className="k-acao-seta"><ChevronRight aria-hidden="true" /></span>
        </button>
      )}
      {acao && acao !== "ativo" && (
        <button type="button" className="k-acao" data-tom="ativar" aria-label={`${ROTULO_DA_ACAO[acao]} ${o.nome}`} onClick={acao === "ativar" ? aoAtivar : aoEscolher}>
          <span className="k-acao-texto">{ROTULO_DA_ACAO[acao]}</span><span className="k-acao-seta" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Lista({ g, m, itens, cat, busca, opcao, escolher, ativar }) {
  const linha = (o) => <LinhaDeOpcao key={o.chave} o={o} g={g} m={m} atual={opcao === o.chave} aoEscolher={() => escolher(o)} aoAtivar={() => ativar(o)} />;
  if (busca) return itens.map(linha);
  if (cat === "favoritos" || cat === "ativos") return ordenaPorAcao(itens, g, m).map(linha);
  /* O QUE SE ATIVA VEM PRIMEIRO (autor, 2026-11-09), num bloco só e por nome. O resto fica embaixo, nos grupos de sempre. */
  const com = itens.filter((o) => acaoDaLinha(o, g, m)).sort(porNome);
  const sem = com.length ? itens.filter((o) => !acaoDaLinha(o, g, m)) : itens;
  const grupos = new Map();
  const ordem = cat === "tudo" ? CATEGORIAS.filter(Boolean).map((x) => x.rotulo) : null;
  const chave = (o) => (cat === "tudo" ? rotuloCategoria(categoriaDe(o)) : classeENivel(o).subgrupo ?? "");
  const nivel = (o) => classeENivel(o).nivel ?? 0;
  for (const o of [...sem].sort((x, y) => nivel(x) - nivel(y) || porNome(x, y))) {
    const k = chave(o);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(o);
  }
  const ks = [...grupos.keys()].sort((x, y) => (ordem ? ordem.indexOf(x) - ordem.indexOf(y) : x.localeCompare(y, "pt-BR")));
  return (
    <>
      {com.length > 0 && <h3 className="k-bloco" data-bloco="ativar">Para Ativar<small>{com.length}</small></h3>}
      {com.map(linha)}
      {com.length > 0 && sem.length > 0 && <h3 className="k-bloco" data-bloco="demais">Demais Opções<small>{sem.length}</small></h3>}
      {ks.map((k) => (
        <React.Fragment key={k || "sem"}>
          {k && <h3 className="k-grupo">{k}<small>{grupos.get(k).length}</small></h3>}
          {grupos.get(k).map(linha)}
        </React.Fragment>
      ))}
    </>
  );
}

/* O EFEITO JÁ ATIVO, ABERTO PELO CATÁLOGO (autor, 2026-11-09): o que ele vale agora e o Encerrar ficam aqui mesmo. Antes o painel só mandava
   para os Ativos, sem dizer nada do efeito. O resultado da última operação aparece aqui também, porque confirmar não sai mais do catálogo. */
function AtivoNoCatalogo({ o, g, m }) {
  const a = g.ativoDaOpcao(o.chave);
  const abrir = <button type="button" className="m-botao" onClick={() => g.irAoAtivo(o.chave)} data-abrir-ativo><ChevronRight aria-hidden="true" />Abrir nos Ativos</button>;
  if (!a) return <div className="k-confirmar"><span className="x-linha">{abrir}</span></div>;
  const d = detalhesDoAtivo(a, m);
  const { chips, contrib } = consequenciasDaLinha(a, g, m);
  const pvb = pvDoAtivo(a, g.pv);
  const r = g.resultado;
  const doAlvo = !!r && (r.alvo === a.chave || resultadoDaOpcao(r, o));
  return (
    <div className="k-confirmar" data-ativo-no-catalogo={a.chave}>
      {d.atencao.map((t) => <span key={t} className="x-atencao"><AlertTriangle aria-hidden="true" />{t}</span>)}
      {/* Logo depois de ligar, o resultado da operação já diz o que mudou (e traz o Descontar do custo à mão): o Agora não o repete. */}
      {doAlvo ? <ResultadoG2 r={r} g={g} m={m} pvb={pvb} />
        : <div className="x-col" data-col="agora"><Agora a={a} g={g} m={m} chips={chips} contrib={contrib} pvb={pvb} /></div>}
      <span className="x-linha">
        <button type="button" className="m-botao" onClick={() => g.acoes.encerrar(a)} data-encerrar={a.chave}><Power aria-hidden="true" />Encerrar</button>
        {abrir}
      </span>
    </div>
  );
}

/* O que fazer com a opção, com o custo SEMPRE antes da ação.
   `onde`: aberto pelo Adicionar da compacta ou pela completa. Desde 2026-11-09 confirmar NÃO sai do catálogo em nenhum dos dois casos
   (autor: ligar vários efeitos seguidos não pode pedir reabrir o Adicionar). Quem volta é o botão do topo. */
function Acao({ o, g, m, onde = "completa" }) {
  const v = verificacoes(o, m);
  const custo = custoAntes(o);
  const usos = g.usosDe(o.chave);
  const voltaSeConfirmou = (ok) => ok;
  if (g.ligado(o) && !comVagaLivre(o, m)) return <AtivoNoCatalogo o={o} g={g} m={m} />;
  /* A Preparação comum: Concentrar Aura, Conhecimento Aplicado e Invencível sob o Sol. */
  if (temPreparo(o)) {
    const prep = g.tela.catalogo.preparo;
    if (prep?.chave === o.chave && prep.valores) {
      return (
        <PreparoGrupo o={o} m={m} valores={prep.valores}
          onValores={(valores) => g.mudaCatalogo((c) => ({ preparo: { ...c.preparo, valores } }))}
          onCancelar={() => g.mudaCatalogo({ preparo: null })}
          onConfirmar={(valores) => voltaSeConfirmou(g.acoes.confirmarPreparo(o, valores, { onde, doCatalogo: true }))} />
      );
    }
    return (
      <div className="k-confirmar">
        <ResumoDoPreparo o={o} m={m} />
        <span className="x-linha">
          <button type="button" className="m-botao x-adicionar g2-primario" onClick={() => g.mudaCatalogo({ preparo: { chave: o.chave, valores: rascunhoDoCatalogo(o, m) } })} data-ativar-detalhe>Ativar</button>
        </span>
      </div>
    );
  }
  /* O montador do Golpe Especial: as marcas em rascunho, o custo que a ficha calcula e cobra ao confirmar. */
  if (ehGolpe(o)) {
    const prep = g.tela.catalogo.preparo;
    if (prep?.chave === o.chave && prep.valores) {
      return (
        <PreparoGolpe o={o} m={m} valores={prep.valores}
          onValores={(valores) => g.mudaCatalogo((c) => ({ preparo: { ...c.preparo, valores } }))}
          onCancelar={() => g.mudaCatalogo({ preparo: null })}
          onConfirmar={(valores) => voltaSeConfirmou(g.acoes.confirmarGolpe(o, valores, { onde, doCatalogo: true }))} />
      );
    }
    return (
      <div className="k-confirmar">
        <span className="x-custo-jogo" data-auto="" data-custo-resumo><Zap aria-hidden="true" />A Ficha Desconta a Soma das Propriedades, no Mínimo 1 PE</span>
        <span className="x-linha">
          <button type="button" className="m-botao x-adicionar g2-primario" onClick={() => g.mudaCatalogo({ preparo: { chave: o.chave, valores: rascunhoDoGolpe(m) } })} data-ativar-detalhe>Ativar</button>
        </span>
      </div>
    );
  }
  if (ehPiloto(o)) {
    if (g.tela.catalogo.preparo?.chave === o.chave) return <PreparoG2 o={o} g={g} m={m} onConfirmar={(n) => voltaSeConfirmou(g.acoes.confirmarAtivacao(o, n, { onde, doCatalogo: true }))} />;
    const f = faixaDoPiloto(o.grupo, m.derived);
    const custos = f.passos.map((n) => f.custo(n));
    return (
      <div className="k-confirmar">
        <span className="x-custo-jogo" data-auto=""><Zap aria-hidden="true" />{`${custos.length > 1 ? `${custos.slice(0, -1).join(", ")} ou ${custos.at(-1)}` : custos[0]} PE, pela ${f.rotulo}`}</span>
        <span className="x-linha">
          <button type="button" className="m-botao x-adicionar g2-primario" onClick={() => g.mudaCatalogo({ preparo: { chave: o.chave, valor: 1 } })} data-ativar-detalhe>Ativar</button>
        </span>
      </div>
    );
  }
  /* Uso instantâneo: o Registrar Uso gasta o contador real do motor (E2). */
  if (o.como === "registrar") return <RegistrarUso o={o} g={g} m={m} />;
  const bloqueado = v.nao.length > 0;
  let botao = null;
  let corpo = null;
  if (o.grupo && simples(o)) botao = <button type="button" className="m-botao x-adicionar g2-primario" disabled={!m.combate || bloqueado} onClick={() => g.acoes.ativar(o)}>Ativar</button>;
  else if (o.grupo) corpo = <ControlesDoGrupo gr={o.grupo} m={g.mPara()} />;
  else if (o.como === "usar") botao = <button type="button" className="m-botao x-adicionar g2-primario" disabled={bloqueado} onClick={() => g.acoes.usar(o)}>Usar</button>;
  else if (o.como === "registrar") botao = <button type="button" className="m-botao" onClick={() => g.acoes.registrarUso(o)}>Registrar Uso</button>;
  /* Sem custo, sem bloqueio e sem controle não há o que dizer aqui: a regra da opção vem logo abaixo, no próprio painel. */
  if (!custo && o.como !== "sempre" && !v.nao.length && !corpo && !botao) return null;
  return (
    <div className="k-confirmar">
      {custo && <CustoG2 custo={custo} m={m} nome={o.nome} />}
      {o.como === "sempre" && <span className="x-neutro">Sempre Valendo</span>}
      {v.nao.map((t) => <span key={t} className="x-atencao"><AlertTriangle aria-hidden="true" />{t}</span>)}
      {corpo}
      {botao && <span className="x-linha">{botao}{usos > 0 && <span className="x-mesa">Usado {usos}×</span>}</span>}
    </div>
  );
}

function DetalheOpcao({ o, g, m, onConsultar, onVoltar = null, renderOperacao = null }) {
  if (ehRecebidoDePacote(o)) return <DetalheRecebido o={o} g={g} m={m} onFechar={() => g.mudaCatalogo({ opcao: null, preparo: null })} />;
  return <DetalheDaFicha o={o} g={g} m={m} onConsultar={onConsultar} onVoltar={onVoltar} renderOperacao={renderOperacao} />;
}

/* O item da ficha por trás da opção, com o texto da regra. O estado sem item próprio traz o texto no `title` (como na consulta). */
function itemDaOpcao(o, m) {
  const chave = o.item?.chave ?? o.chave;
  const e = m.resolver?.(chave) ?? null;
  if (e?.tipo !== "estado") return e;
  return { ...e, texto: m.pacote?.estados.find((x) => `estado:${x.id}` === chave)?.title ?? "" };
}

function DetalheDaFicha({ o, g, m, onConsultar, onVoltar = null, renderOperacao = null }) {
  const fav = (m.sessao.favoritos ?? []).includes(o.chave);
  /* A REGRA NO PRÓPRIO PAINEL (autor, 2026-11-09): quem não tem ação na linha mostra a regra aqui, sem pedir outro clique. A operação
     do item (escolher a Postura, canalizar) também entra aqui: a consulta aberta pelo catálogo não traz controles. */
  const item = itemDaOpcao(o, m);
  const semAcao = !acaoDaLinha(o, g, m);
  const regraAqui = semAcao && !!item?.texto;
  /* Só para quem não tem ação na linha: um grupo com Preparação não ganha um segundo caminho ao lado dela. */
  const operacao = semAcao && item && typeof item.id === "string" && item.grupo ? renderOperacao?.(item) : null;
  const { classe, nivel, subgrupo } = classeENivel(o);
  const meta = [rotuloCategoria(categoriaDe(o)), classe ?? subgrupo, nivel ? `Nível ${nivel}` : null, g.ligado(o) ? "Ativo" : null].filter(Boolean);
  const frase = finalidadeCurta(o);
  const r = g.resultado;
  const preparando = g.tela.catalogo.preparo?.chave === o.chave;
  return (
    <article className="k-detalhe afty-catalogo-painel" data-ativando={preparando ? "" : undefined} aria-label={o.nome} data-detalhe-opcao={o.chave}>
      <div className="x-cartao-topo">
        <div><h2 className="x-cartao-nome">{o.nome}</h2><p className="x-cartao-meta">{meta.map((t) => <span key={t}>{t}</span>)}</p></div>
        <span className="x-cartao-acoes">
          <button type="button" className="e-icone" aria-pressed={fav} aria-label={fav ? `Tirar ${o.nome} dos Favoritos` : `Favoritar ${o.nome}`} title={fav ? "Tirar dos Favoritos" : "Favoritar"} onClick={() => m.fixar(o.chave)}>
            <Star aria-hidden="true" fill={fav ? "currentColor" : "none"} />
          </button>
          <button type="button" className="e-icone" aria-label="Fechar a opção" onClick={() => g.mudaCatalogo({ opcao: null, preparo: null })}><X aria-hidden="true" /></button>
        </span>
      </div>
      {frase && <p className="x-texto" style={{ margin: 0 }}>{frase}</p>}
      {o.exemplo?.condicao && <span className="x-neutro"><Hand aria-hidden="true" />{o.exemplo.condicao}</span>}
      <Acao o={o} g={g} m={m} onde={onVoltar ? "compacta" : "completa"} />
      {/* Quem está ativo e sem vaga livre mostra o resultado no `AtivoNoCatalogo`. A Sustentação com vaga livre continua aqui. */}
      {resultadoDaOpcao(r, o) && !(g.ligado(o) && !comVagaLivre(o, m)) && <ResultadoG2 r={r} g={g} m={m} />}
      {operacao && <div className="k-operacao" data-operacao-opcao={o.chave}>{operacao}</div>}
      {regraAqui
        ? <section className="k-regra" aria-label="Regra" data-regra-no-painel={o.chave}><TextoRegra texto={item.texto} rico={item.rico} classe="e-texto" /></section>
        : <button type="button" className="m-link" style={{ justifySelf: "start" }} onClick={() => onConsultar(o.item?.chave ?? o.chave, "resumo")} data-regra-opcao={o.chave}><BookOpenText aria-hidden="true" />Regra Completa</button>}
    </article>
  );
}

/* `onVoltar`: aberto pelo Adicionar do painel compacto, o catálogo volta para lá ("Voltar"), e não para os Ativos da completa. */
export default function CatalogoG2({ g, m, onConsultar, focoBusca, onVoltar = null, renderOperacao = null }) {
  const fechar = onVoltar ?? (() => g.abrirCatalogo(null));
  /* A Imitação é uma aba só para quem pode copiar: sem ela, uma aba guardada como "imitacao" cai em Da Ficha. */
  const temImitacao = imitacaoDisponivel(m.derived);
  const cat = g.tela.catalogo.aba === "imitacao" && !temImitacao ? { ...g.tela.catalogo, aba: "ficha" } : g.tela.catalogo;
  const campo = useRef(null);
  const lista = useRef(null);
  const termo = cat.termo;
  const achados = useMemo(() => (termo.trim() ? buscar(g.opcoes, termo).map((x) => x.e) : null), [g.opcoes, termo]);
  const itens = achados ?? itensDaCategoria(g, m, cat.cat);
  const titulo = achados ? `${achados.length} ${achados.length === 1 ? "Resultado" : "Resultados"}` : rotuloCategoria(cat.cat);
  const o = cat.opcao ? g.opcoes.find((x) => x.chave === cat.opcao) ?? null : null;
  /* A rolagem da lista, por categoria ou por busca, e por mesa. */
  useRolagemPorChave(lista, `${m.mesaId}:${achados ? `busca:${termo}` : `cat:${cat.cat}`}`, mapaDe("g2-catalogo"));
  useEffect(() => { if (focoBusca && cat.aba === "ficha") campo.current?.focus(); }, [focoBusca]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Esc desfaz um passo: a Preparação, a opção, a busca, e por fim o catálogo. */
  useEffect(() => {
    const aoTeclar = (ev) => {
      if (ev.key !== "Escape" || ev.defaultPrevented) return;
      if (document.querySelector("#afty-ficha .e-consulta")) return;
      const c = g.tela.catalogo;
      /* Para Aliados tem rascunho próprio (o pacote em edição): o Esc não fecha por cima dele. */
      if (c.aba === "aliados") return;
      /* Na Imitação o Esc desfaz um passo: o candidato aberto, e por fim o catálogo. */
      if (c.aba === "imitacao" && temImitacao) {
        if (c.imit?.sel) g.mudaCatalogo((x) => ({ imit: { ...x.imit, sel: null, elegivel: false } }));
        else fechar();
        ev.preventDefault();
        return;
      }
      if (c.aba === "externa") fechar();
      else if (c.preparo) g.mudaCatalogo({ preparo: null });
      else if (c.opcao) g.mudaCatalogo({ opcao: null });
      else if (ev.target === campo.current && c.termo) g.mudaCatalogo({ termo: "" });
      else fechar();
      ev.preventDefault();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  /* `voltar` só vale para a Preparação aberta pelos Favoritos dos Ativos: qualquer escolha feita aqui dentro o desfaz. */
  const escolher = (x) => g.mudaCatalogo((c) => ({ opcao: c.opcao === x.chave ? null : x.chave, preparo: null, voltar: false }));
  /* Ativar na linha: quem liga sem escolha nem custo liga na hora, e o painel mostra o que passou a valer. O Ataque Concentrado, a
     Preparação comum e o Golpe abrem a Preparação. As outras abrem o detalhe com o custo ou o bloqueio antes da ação. */
  const ativar = (x) => {
    const ligou = ativarOpcao(x, g, m, (o, preparo) => g.mudaCatalogo({ opcao: o.chave, preparo, voltar: false }));
    if (ligou) g.mudaCatalogo({ opcao: x.chave, preparo: null, voltar: false });
  };

  const topo = (
    <div className="k-topo">
      <button type="button" className="m-botao" onClick={fechar} data-voltar-ativos><ChevronLeft aria-hidden="true" />{onVoltar ? "Voltar" : "Ativos"}</button>
      <h2 className="x-titulo">{cat.aba === "aliados" ? "Para Aliados" : cat.aba === "imitacao" ? (m.derived.imitacao?.perfeita ? "Imitação Perfeita" : "Imitação") : "Adicionar"}</h2>
      <span className="m-seg" role="tablist" aria-label="De onde vem">
        <button type="button" role="tab" className="m-seg-op" aria-pressed={cat.aba === "ficha"} aria-selected={cat.aba === "ficha"} onClick={() => g.mudaCatalogo({ aba: "ficha" })}>Da Ficha</button>
        {/* A Imitação (fechamento funcional do G2): só para a ficha que pode copiar, no mesmo lugar do Adicionar. */}
        {temImitacao && <button type="button" role="tab" className="m-seg-op" aria-pressed={cat.aba === "imitacao"} aria-selected={cat.aba === "imitacao"} onClick={() => g.mudaCatalogo({ aba: "imitacao", preparo: null })} data-aba-imitacao>Imitação</button>}
        <button type="button" role="tab" className="m-seg-op" aria-pressed={cat.aba === "externa"} aria-selected={cat.aba === "externa"} onClick={() => g.mudaCatalogo({ aba: "externa", preparo: null })} data-aba-externa>Fonte Externa</button>
        {/* Pacotes para Aliados (2026-10-19): o acesso discreto do suporte, no mesmo lugar do Adicionar, sem navegação nova. */}
        <button type="button" role="tab" className="m-seg-op" aria-pressed={cat.aba === "aliados"} aria-selected={cat.aba === "aliados"} onClick={() => g.mudaCatalogo({ aba: "aliados", preparo: null })} data-aba-aliados>Para Aliados</button>
      </span>
    </div>
  );
  if (cat.aba === "externa") return <RecebidosG2 g={g} m={m} topo={topo} onFechar={fechar} />;
  if (cat.aba === "aliados") return <ParaAliadosG2 m={m} topo={topo} />;
  if (cat.aba === "imitacao") return <ImitacaoG2 g={g} m={m} topo={topo} />;
  return (
    <div className="k-catalogo" data-catalogo>
      {topo}
      <label className="e-busca k-busca">
        <Search aria-hidden="true" />
        <input ref={campo} className="afty-campo" type="search" value={termo} placeholder="Buscar pelo nome ou pela finalidade" aria-label="Buscar no catálogo" data-busca-catalogo
          onChange={(e) => g.mudaCatalogo({ termo: e.target.value, opcao: null, preparo: null })} />
        {termo && <button type="button" className="e-limpar" onClick={() => g.mudaCatalogo({ termo: "", opcao: null, preparo: null })} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
      </label>
      <div className="k-corpo">
        <nav className="k-trilho" aria-label="Categorias">
          {CATEGORIAS.filter((x) => x?.id !== "recebido" || g.opcoes.some(ehRecebidoDePacote)).map((x, i) => (x ? (
            <button key={x.id} type="button" className="k-cat" aria-current={!achados && cat.cat === x.id} data-cat={x.id}
              onClick={() => g.mudaCatalogo({ cat: x.id, termo: "", opcao: null, preparo: null })}>
              {x.id === "favoritos" && <Star aria-hidden="true" />}<span>{x.rotulo}</span><small>{itensDaCategoria(g, m, x.id).length}</small>
            </button>
          ) : <span key={`sep${i}`} className="k-sep" aria-hidden="true" />))}
        </nav>
        <section ref={lista} className="k-lista" aria-label={titulo} data-lista-catalogo>
          <h3 className="k-titulo-lista">{titulo}</h3>
          {itens.length ? <Lista g={g} m={m} itens={itens} cat={cat.cat} busca={!!achados} opcao={cat.opcao} escolher={escolher} ativar={ativar} />
            : <p className="x-mesa">Nenhuma Opção</p>}
        </section>
        {o ? <DetalheOpcao o={o} g={g} m={m} onConsultar={onConsultar} onVoltar={onVoltar} renderOperacao={renderOperacao} /> : <div />}
      </div>
    </div>
  );
}
