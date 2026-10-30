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
import { AlertTriangle, BookOpenText, ChevronLeft, ChevronRight, Hand, Search, Star, X, Zap } from "lucide-react";
import { buscar } from "./repertorio";
import { custoAntes, verificacoes } from "./efeitos-dados";
import { ControlesDoGrupo, RegistroExterno, finalidadeCurta } from "./Gestor";
import { mapaDe, useRolagemPorChave } from "./rolagem-g2";
import { CATEGORIAS, categoriaDe, classeENivel, ehGolpe, ehPiloto, ehSustentacao, rotuloCategoria, simples, temPreparo } from "./g2-dados";
import { CustoG2, ResultadoG2 } from "./PecasG2";
import { PreparoG2, PreparoGolpe, PreparoGrupo, ResumoDoPreparo, faixaDoPiloto } from "./PreparoG2";
import { RegistrarUso } from "./UsoG2";
import { rascunhoDoCatalogo } from "./g2-preparo";
import { rascunhoDoGolpe } from "./g2-golpe";

const porNome = (a, b) => a.nome.localeCompare(b.nome, "pt-BR");
/* A Sustentação é um grupo de vagas: com uma vaga ocupada e outra livre, ainda se ativa (outro Feitiço numa vaga livre). */
const comVagaLivre = (o, m) => ehSustentacao(o) && o.grupo.estados.some((e) => !m.sessao.combate?.[e.id]);

function itensDaCategoria(g, m, cat) {
  const fav = m.sessao.favoritos ?? [];
  if (cat === "favoritos") return g.opcoes.filter((o) => fav.includes(o.chave));
  if (cat === "ativos") return g.opcoes.filter((o) => g.ligado(o));
  if (cat === "tudo") return g.opcoes;
  return g.opcoes.filter((o) => categoriaDe(o) === cat);
}

/* Uma linha só: a estrela (cheia no favorito), o nome inteiro no title e, à
   direita, Ativar ou Ativo. Sem ação não quer dizer passivo. Quem tem a
   Preparação comum (`temPreparo`) também tem Ativar: pode ser ativada. */
function Linha({ o, g, m, atual, aoEscolher, aoAtivar }) {
  const fav = (m.sessao.favoritos ?? []).includes(o.chave);
  const ativo = g.ligado(o);
  const livre = comVagaLivre(o, m);
  const ativavel = (!ativo || livre) && (simples(o) || temPreparo(o) || ehGolpe(o));
  return (
    <div className="k-fila" aria-current={atual} data-chave-opcao={o.chave}>
      <button type="button" className="k-item" title={o.nome} aria-current={atual} onClick={aoEscolher}>
        <span className="k-nome">
          <span className="k-fav" data-favorito={fav ? "" : undefined} aria-label={fav ? "Favorito" : undefined} aria-hidden={fav ? undefined : "true"}><Star aria-hidden="true" /></span>
          <span className="k-texto">{o.nome}</span>
        </span>
      </button>
      {ativo && !livre && (
        <button type="button" className="k-acao" data-tom="ativo" title="Abrir nos Ativos" aria-label={`Abrir ${o.nome} nos Ativos`} onClick={() => g.irAoAtivo(o.chave)}>
          <span className="k-acao-texto">Ativo</span><span className="k-acao-seta"><ChevronRight aria-hidden="true" /></span>
        </button>
      )}
      {ativavel && (
        <button type="button" className="k-acao" data-tom="ativar" aria-label={`Ativar ${o.nome}`} onClick={aoAtivar}>
          <span className="k-acao-texto">Ativar</span><span className="k-acao-seta" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Lista({ g, m, itens, cat, busca, opcao, escolher, ativar }) {
  const linha = (o) => <Linha key={o.chave} o={o} g={g} m={m} atual={opcao === o.chave} aoEscolher={() => escolher(o)} aoAtivar={() => ativar(o)} />;
  if (busca) return itens.map(linha);
  if (cat === "favoritos" || cat === "ativos") return [...itens].sort(porNome).map(linha);
  const grupos = new Map();
  const ordem = cat === "tudo" ? CATEGORIAS.filter(Boolean).map((x) => x.rotulo) : null;
  const chave = (o) => (cat === "tudo" ? rotuloCategoria(categoriaDe(o)) : classeENivel(o).subgrupo ?? "");
  const nivel = (o) => classeENivel(o).nivel ?? 0;
  for (const o of [...itens].sort((a, b) => nivel(a) - nivel(b) || porNome(a, b))) {
    const k = chave(o);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(o);
  }
  const ks = [...grupos.keys()].sort((a, b) => (ordem ? ordem.indexOf(a) - ordem.indexOf(b) : a.localeCompare(b, "pt-BR")));
  return ks.map((k) => (
    <React.Fragment key={k || "sem"}>
      {k && <h3 className="k-grupo">{k}<small>{grupos.get(k).length}</small></h3>}
      {grupos.get(k).map(linha)}
    </React.Fragment>
  ));
}

/* O que fazer com a opção, com o custo SEMPRE antes da ação.
   `onde` e `depois`: aberto pelo Adicionar da compacta, confirmar volta à
   compacta com o efeito aberto (autor, 2026-10-15), também no piloto. */
function Acao({ o, g, m, onde = "completa", depois = null }) {
  const v = verificacoes(o, m);
  const custo = custoAntes(o, m);
  const usos = g.usosDe(o.chave);
  const voltaSeConfirmou = (ok) => { if (ok) depois?.(); return ok; };
  if (g.ligado(o) && !comVagaLivre(o, m)) {
    return (
      <div className="k-confirmar">
        <span className="x-linha"><button type="button" className="m-botao x-adicionar g2-primario" onClick={() => g.irAoAtivo(o.chave)} data-abrir-ativo><ChevronRight aria-hidden="true" />Abrir nos Ativos</button></span>
      </div>
    );
  }
  /* A Preparação comum: Concentrar Aura, Conhecimento Aplicado e Invencível sob o Sol. */
  if (temPreparo(o)) {
    const prep = g.tela.catalogo.preparo;
    if (prep?.chave === o.chave && prep.valores) {
      return (
        <PreparoGrupo o={o} m={m} valores={prep.valores}
          onValores={(valores) => g.mudaCatalogo((c) => ({ preparo: { ...c.preparo, valores } }))}
          onCancelar={() => g.mudaCatalogo({ preparo: null })}
          onConfirmar={(valores) => voltaSeConfirmou(g.acoes.confirmarPreparo(o, valores, { onde }))} />
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
          onConfirmar={(valores) => voltaSeConfirmou(g.acoes.confirmarGolpe(o, valores, { onde }))} />
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
    if (g.tela.catalogo.preparo?.chave === o.chave) return <PreparoG2 o={o} g={g} m={m} onConfirmar={(n) => voltaSeConfirmou(g.acoes.confirmarAtivacao(o, n, { onde }))} />;
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
  return (
    <div className="k-confirmar">
      {custo && <CustoG2 custo={custo} m={m} nome={o.nome} />}
      {o.como === "sempre" && <span className="x-neutro">Sempre Valendo</span>}
      {v.nao.map((t) => <span key={t} className="x-atencao"><AlertTriangle aria-hidden="true" />{t}</span>)}
      {corpo}
      {botao && <span className="x-linha">{botao}{usos > 0 && <span className="x-mesa">Usado {usos}×</span>}</span>}
      {!botao && !corpo && o.como !== "sempre" && <span className="x-instrucao"><Hand aria-hidden="true" />Para Usar, Siga a Regra Completa</span>}
    </div>
  );
}

function DetalheOpcao({ o, g, m, onConsultar, onVoltar = null }) {
  const fav = (m.sessao.favoritos ?? []).includes(o.chave);
  const { classe, nivel, subgrupo } = classeENivel(o);
  const meta = [rotuloCategoria(categoriaDe(o)), classe ?? subgrupo, nivel ? `Nível ${nivel}` : null, g.ligado(o) ? "Ativo" : null].filter(Boolean);
  const frase = finalidadeCurta(o);
  const r = g.resultado;
  const preparando = g.tela.catalogo.preparo?.chave === o.chave;
  return (
    <article className="k-detalhe" data-ativando={preparando ? "" : undefined} aria-label={o.nome} data-detalhe-opcao={o.chave}>
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
      <Acao o={o} g={g} m={m} onde={onVoltar ? "compacta" : "completa"} depois={onVoltar} />
      {r && r.alvo === o.chave && !g.ligado(o) && <ResultadoG2 r={r} g={g} m={m} />}
      <button type="button" className="m-link" style={{ justifySelf: "start" }} onClick={() => onConsultar(o.item?.chave ?? o.chave, "resumo")} data-regra-opcao={o.chave}><BookOpenText aria-hidden="true" />Regra Completa</button>
    </article>
  );
}

/* `onVoltar`: aberto pelo Adicionar do painel compacto, o catálogo volta para lá ("Voltar"), e não para os Ativos da completa. */
export default function CatalogoG2({ g, m, onConsultar, focoBusca, onVoltar = null }) {
  const fechar = onVoltar ?? (() => g.abrirCatalogo(null));
  const cat = g.tela.catalogo;
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

  const escolher = (x) => g.mudaCatalogo((c) => ({ opcao: c.opcao === x.chave ? null : x.chave, preparo: null }));
  /* Ativar na linha: o Ataque Concentrado e as opções da Preparação comum abrem a
     Preparação. As outras abrem o detalhe com o custo e a ação de hoje. */
  const ativar = (x) => g.mudaCatalogo({
    opcao: x.chave,
    preparo: ehPiloto(x) ? { chave: x.chave, valor: 1 } : temPreparo(x) ? { chave: x.chave, valores: rascunhoDoCatalogo(x, m) } : ehGolpe(x) ? { chave: x.chave, valores: rascunhoDoGolpe(m) } : null,
  });

  const topo = (
    <div className="k-topo">
      <button type="button" className="m-botao" onClick={fechar} data-voltar-ativos><ChevronLeft aria-hidden="true" />{onVoltar ? "Voltar" : "Ativos"}</button>
      <h2 className="x-titulo">Adicionar</h2>
      <span className="m-seg" role="tablist" aria-label="De onde vem">
        <button type="button" role="tab" className="m-seg-op" aria-pressed={cat.aba === "ficha"} aria-selected={cat.aba === "ficha"} onClick={() => g.mudaCatalogo({ aba: "ficha" })}>Da Ficha</button>
        <button type="button" role="tab" className="m-seg-op" aria-pressed={cat.aba === "externa"} aria-selected={cat.aba === "externa"} onClick={() => g.mudaCatalogo({ aba: "externa", preparo: null })} data-aba-externa>Fonte Externa</button>
      </span>
    </div>
  );
  if (cat.aba === "externa") {
    return (
      <div className="k-catalogo" data-aba="externa">
        {topo}
        <div className="k-externa"><RegistroExterno g={g} m={m} onFechar={fechar} /></div>
      </div>
    );
  }
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
          {CATEGORIAS.map((x, i) => (x ? (
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
        {o ? <DetalheOpcao o={o} g={g} m={m} onConsultar={onConsultar} onVoltar={onVoltar} /> : <div />}
      </div>
    </div>
  );
}
