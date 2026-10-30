/* ============================================================
   CONSULTA SOB DEMANDA
   ============================================================
   Abre por cima da área da aba, à direita, só quando alguém pede. A lista
   por baixo não se move nem muda de largura, e os nomes continuam à vista.
   Guarda até três consultas em abas: consultar Cobrir-se depois de Assumir
   Postura deixa as duas a um clique. Esc ou Fechar fecham e devolvem o foco
   à linha. Cada consulta lembra a própria posição de leitura.

   Ordem: o que é, a descrição do estudo, os controles (com o que eles
   EXECUTAM), as escolhas e a regra integral.
   ============================================================ */
import React, { useEffect, useRef, useState } from "react";
import { X, Star, ZapOff, Zap } from "lucide-react";
import { estaLigado, GRUPOS } from "./ponte";
import { useRolagemPorChave, mapaDe } from "./rolagem-g2";
import { Controle, Deltas, TextoRegra, Flutuante } from "./pecas";
import { deltasDoControle, nomeDoControle, valorDoControle } from "./pecas-logica";
import { CHAVE_GOLPE, exemploDoItem as descricaoDe, propriedadesDoGolpe } from "./efeitos-dados";
import { DescontarPainel } from "./Gestor";
import { ativaPorPreparacao } from "./g2-dados";
import { EntradaDoPreparo } from "./HabilidadesG2";
import { naoDescontaPE } from "./habilidades-logica";

function Controles({ m, e, g, onAbrirPainel }) {
  const [energia, setEnergia] = useState(null);
  const todos = [...m.doItem, ...m.relacionados];
  if (!todos.length) return null;
  /* Consolidação ampliada (2026-10-16): o controle de um grupo com Preparação não age por um caminho imediato. Vira a entrada
     discreta do grupo certo (o filho do Incansável vai ao Espírito de Luta), e o resto segue como estava. */
  const roteados = new Map();
  const cs = [];
  for (const c of todos) {
    const gr = g?.grupoDoEstado.get(c.estados[0].id);
    const o = gr ? g.opcoes.find((x) => x.chave === gr.chave) ?? null : null;
    if (o && ativaPorPreparacao(o)) roteados.set(o.chave, o);
    else cs.push(c);
  }
  const filhos = (c) => m.pacote.estados.filter((s) => s.requerEstado && c.estados.some((p) => p.id === s.requerEstado));
  const algumPE = cs.some((c) => m.doItem.includes(c) && naoDescontaPE(c, e));
  return (
    <section className="e-bloco e-bloco-controles" aria-label="Controles">
      <h3 className="e-bloco-titulo">Controles</h3>
      {!m.combate && (
        <p className="e-fora">Fora de Combate <button type="button" className="afty-botao e-botao" onClick={m.acoes.alternaCombate}>Entrar em Combate</button></p>
      )}
      {[...roteados.values()].map((o) => (
        <div key={o.chave} className="e-controle" data-roteado={o.chave}>
          <span className="e-controle-nome">{o.nome}</span>
          <EntradaDoPreparo o={o} g={g} onAbrirPainel={onAbrirPainel} />
        </div>
      ))}
      {cs.map((c) => {
        const chips = deltasDoControle(c, m.deltas);
        return (
          <div key={c.id} className="e-controle">
            <span className="e-controle-nome">{nomeDoControle(c)}{!m.doItem.includes(c) && <small className="e-controle-de">De {c.dono?.nome}</small>}</span>
            <Controle c={c} m={m} />
            {filhos(c).filter(() => estaLigado(c.estados[0], m.sessao.combate?.[c.estados[0].id])).map((s) => {
              const filho = { id: s.id, rotulo: s.label, estados: [s] };
              return (
                <div key={s.id} className="e-controle e-controle-filho">
                  <span className="e-controle-nome">{s.label}</span>
                  <Controle c={filho} m={m} />
                </div>
              );
            })}
            {chips.length > 0 && <div className="e-agora-item"><span>Agora</span><Deltas chips={chips} /></div>}
          </div>
        );
      })}
      {algumPE && (
        <div className="e-nota-pe">
          <ZapOff aria-hidden="true" />
          <span><b>Não desconta PE.</b> O controle aplica o efeito. O PE que a regra pede é gasto na Energia.</span>
          <button type="button" className="afty-botao e-botao" onClick={(ev) => setEnergia(ev.currentTarget)}><Zap aria-hidden="true" />Descontar na Energia</button>
        </div>
      )}
      {energia && (
        <Flutuante ancora={energia} onFechar={() => setEnergia(null)} largura={300} rotulo="Descontar da Energia">
          <DescontarPainel m={m} nome={e.nome} valor={null} onFechar={() => setEnergia(null)} />
        </Flutuante>
      )}
    </section>
  );
}

/* `soRegra`: aberta a partir do gerenciador, a consulta NÃO repete o resumo nem
   os controles que já estão na linha e no detalhe. Fica a regra integral. */
export default function Consulta({ m, g = null, onAbrirPainel = null, pilha, ativa, onAtivar, onFecharUma, onFechar, soRegra = false, semControles = soRegra }) {
  const corpo = useRef(null);
  const titulo = useRef(null);
  const e = m.resolver(ativa);
  useRolagemPorChave(corpo, ativa ?? "nada", mapaDe(`${m.mesaId}:consulta`));
  useEffect(() => { titulo.current?.focus({ preventScroll: true }); }, [ativa]);
  useEffect(() => {
    const tecla = (ev) => {
      if (ev.key !== "Escape") return;
      if (document.querySelector("#afty-ficha .m-flutuante")) return;
      ev.preventDefault();
      onFechar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onFechar]);
  if (!e) return null;
  const desc = descricaoDe(e);
  const fixado = m.fixados.includes(e.chave);
  const ligada = (o) => [...m.doItem, ...m.relacionados].some((c) => c.estados.some((st) => (st.opcoesVisiveis ?? []).some((ov) => ov.id === m.sessao.combate?.[st.id] && ov.requerEscolha === o.id)));
  const marcas = [e.sub?.label, ...(e.tags ?? []).map((t) => t.label).filter((l) => l !== e.sub?.label)].filter(Boolean);
  /* Sem classe nem marcas (as Aptidões), o grupo diz de onde vem. */
  const sobre = e.tipo === "condicao" ? ["Condição", e.forcaLabel].filter(Boolean)
    : e.tipo === "estado" ? ["Estado", ...(e.marcas ?? [])]
      : e.tipo === "feitico" ? ["Feitiço", ...(e.marcas ?? [])]
        : !e.grupo ? ["Técnica"] : marcas.length ? marcas : [GRUPOS.find((g) => g.id === e.grupo)?.label].filter(Boolean);
  const nomes = new Map(pilha.map((k) => [k, m.resolver(k)?.nome ?? k]));

  return (
    <aside className="e-consulta" role="dialog" aria-label={`Consulta: ${e.nome}`}>
      <div className="e-consulta-topo">
        <div className="e-consulta-abas" role="tablist" aria-label="Consultas abertas">
          {pilha.map((k) => (
            <span key={k} className="e-consulta-aba" data-ativa={k === ativa ? "sim" : undefined}>
              <button type="button" role="tab" aria-selected={k === ativa} onClick={() => onAtivar(k)} title={nomes.get(k)}>{nomes.get(k)}</button>
              <button type="button" className="e-consulta-aba-x" onClick={() => onFecharUma(k)} aria-label={`Fechar ${nomes.get(k)}`}><X aria-hidden="true" /></button>
            </span>
          ))}
        </div>
        <button type="button" className="e-fechar" onClick={onFechar} aria-label="Fechar a consulta e voltar à lista">
          <X aria-hidden="true" />Fechar<kbd>Esc</kbd>
        </button>
      </div>
      <div className="e-consulta-corpo" ref={corpo} tabIndex={-1}>
        <header className="e-consulta-cabeca">
          <div>
            {sobre.length > 0 && <p className="e-sobre">{sobre.join(" · ")}</p>}
            <h2 ref={titulo} tabIndex={-1} className="afty-leitor-titulo e-consulta-titulo">{e.nome}</h2>
            {(() => {
              /* O Golpe Especial: as propriedades marcadas nas duas casas do montador, e não só as dos estados. */
              if (e.chave === CHAVE_GOLPE) { const props = m.combate ? propriedadesDoGolpe(m.sessao) : []; return props.length ? <p className="e-ativo">◆ {props.map((x) => x.texto).join(", ")}</p> : null; }
              const on = m.doItem.map((c) => ({ c, v: valorDoControle(c, m.sessao.combate) })).filter((x) => x.v.ligado && m.combate);
              return on.length ? <p className="e-ativo">◆ {on.map((x) => x.v.texto).join(", ")}</p> : null;
            })()}
          </div>
          {e.grupo && (
            <button type="button" className="e-fixar" aria-pressed={fixado} onClick={() => m.fixar(e.chave)}>
              <Star aria-hidden="true" fill={fixado ? "currentColor" : "none"} />{fixado ? "Fixado" : "Fixar"}
            </button>
          )}
        </header>
        {desc && !soRegra && (
          <section className="e-bloco e-resumo" aria-label="Descrição do estudo">
            <h3 className="e-bloco-titulo">Em Resumo</h3>
            <p>{desc.texto}</p>
          </section>
        )}
        {!semControles && <Controles m={m} e={e} g={g} onAbrirPainel={onAbrirPainel} />}
        {e.opcoes?.length > 0 && (
          <section className="e-bloco" aria-label="Escolhas">
            <h3 className="e-bloco-titulo">Escolhas</h3>
            {e.opcoes.map((o) => (
              <div key={o.id} className="e-escolha" data-ligada={ligada(o) ? "sim" : undefined}>
                <h4>{o.nome}{ligada(o) && <span className="e-ativo">◆ Ligada</span>}</h4>
                {o.descricao && <TextoRegra texto={o.descricao} classe="e-texto" />}
              </div>
            ))}
          </section>
        )}
        <section className="e-bloco e-bloco-regra" aria-label="Regra completa">
          <h3 className="e-bloco-titulo">Regra</h3>
          <TextoRegra texto={e.texto} rico={e.rico} classe="e-texto" />
        </section>
      </div>
    </aside>
  );
}
