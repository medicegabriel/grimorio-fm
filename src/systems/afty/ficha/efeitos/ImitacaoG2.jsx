/* ============================================================
   IMITAÇÃO NO G2 (fechamento funcional do G2, 2026-10-20)
   ============================================================
   Uma aba do catálogo (Adicionar > Imitação), que só existe para a ficha que pode copiar (`derived.imitacao.disponivel`, inclusive a Perfeita).
   Faz o ciclo da Apresentação Anterior pelos MESMOS verbos do motor (`imitacao-logica.js`): escolher e confirmar uma cópia, encerrar a atual,
   configurar as escolhas dela, tentar aprender com o resultado que o jogador informa, reutilizar uma aprendida e esquecer.

   ⚠ SELECIONAR OU CONSULTAR UM CANDIDATO NÃO TROCA A CÓPIA. A linha só abre o detalhe, e quem troca é o Confirmar Cópia (uma ação explícita, sobre a
   sessão de agora). Cancelar fecha o detalhe e deixa tudo igual. A cópia não cobra PE e o aprendizado é da sessão: não vira compra da ficha.
   O estado de tela (tipo, busca, filtro, o candidato aberto, a confirmação e o resultado digitado) fica em `tela.catalogo.imit`, e nunca na sessão.
   ============================================================ */
import React, { useMemo } from "react";
import { AlertTriangle, ChevronDown, Search, X } from "lucide-react";
import { FILTROS_HABILIDADE } from "../../afty-filtro-habilidades";
import { textoPuro } from "../../afty-texto-rico";
import { aprendidasDaImitacao, candidatasDoTipo, cdDaCopia, copiaAtual, escolhasDaCopia, estadoDaImitacao, pedeElegibilidade, podeCopiar, rotuloDoTipoDeCopia, tiposDaImitacao } from "./imitacao-logica";

const VAZIO = Object.freeze({ tipo: "postura", termo: "", efeito: "todos", sel: null, elegivel: false, resultado: "" });

/* O estado de tela da Imitação, e como mudá-lo (sempre em cima do que estiver valendo). */
function useTelaDaImitacao(g) {
  const imit = { ...VAZIO, ...(g.tela.catalogo.imit ?? {}) };
  const muda = (patch) => g.mudaCatalogo((c) => ({ imit: { ...VAZIO, ...(c.imit ?? {}), ...(typeof patch === "function" ? patch({ ...VAZIO, ...(c.imit ?? {}) }) : patch) } }));
  return [imit, muda];
}

/* A cópia atual: o nome, de onde ela vem, e o que se faz com ela (escolhas, aprender, encerrar). */
function CopiaAtual({ m, imit, muda }) {
  const { sessao, derived } = m;
  const copia = copiaAtual(derived);
  const estado = estadoDaImitacao(sessao, derived);
  const escolhas = escolhasDaCopia(sessao, derived);
  const origem = copia && (estado.copia?.aprendida ? "Aprendida" : "Vista no Combate");
  return (
    <section className="im-atual" aria-label="Cópia atual" data-copia-atual={copia ? copia.id : ""}>
      <div className="im-atual-linha">
        <span className="im-rotulo">{derived.imitacao.perfeita ? "Imitação Perfeita" : "Imitação"}</span>
        {copia ? (
          <>
            <b className="im-nome" data-nome-copia>{copia.nome}</b>
            <span className="x-neutro">{rotuloDoTipoDeCopia(copia.tipo)}</span>
            <span className="x-neutro" data-origem-copia>{origem}</span>
            <button type="button" className="m-botao" onClick={() => m.acoes.imitacao.encerrar()} data-encerrar-copia>Encerrar Cópia</button>
          </>
        ) : (
          <>
            <span className="x-mesa" data-sem-copia>Nenhuma Cópia</span>
            {!derived.combate?.ativo && <span className="x-atencao"><AlertTriangle aria-hidden="true" />Pede Em Combate</span>}
          </>
        )}
      </div>
      {copia && escolhas && (
        <div className="im-atual-linha" role="group" aria-label="Escolhas da cópia">
          <span className="im-rotulo">Escolhas</span>
          {escolhas.opcoes.map((o) => (
            <button key={o.id} type="button" className="m-botao" aria-pressed={escolhas.escolhidas.includes(o.id)} onClick={() => m.acoes.imitacao.escolher(o.id)} data-escolha-copia={o.id}>{o.nome}</button>
          ))}
          <span className="x-mesa" data-escolhas-limite>{escolhas.escolhidas.length} de {escolhas.limite}</span>
        </div>
      )}
      {copia && (
        <div className="im-atual-linha">
          <span className="im-rotulo">Aprender</span>
          <span className="x-neutro" data-cd-copia>CD {cdDaCopia(derived, estado)}</span>
          <input className="afty-campo im-resultado" type="number" inputMode="numeric" aria-label="Resultado de Percepção" placeholder="Percepção" value={imit.resultado}
            onChange={(e) => muda({ resultado: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (imit.resultado.trim() !== "") { m.acoes.imitacao.aprender(imit.resultado); muda({ resultado: "" }); } } }} data-resultado-percepcao />
          <button type="button" className="m-botao" disabled={imit.resultado.trim() === ""} onClick={() => { m.acoes.imitacao.aprender(imit.resultado); muda({ resultado: "" }); }} data-tentar-aprender>Tentar Aprender</button>
          {estado.aviso && <span role="status" className="x-neutro" data-aviso-imitacao>{estado.aviso}</span>}
        </div>
      )}
    </section>
  );
}

/* O detalhe de um candidato (ou de uma aprendida): a regra, a confirmação do tipo e o Confirmar Cópia. */
function DetalheDaCopia({ m, def, tipo, aprendida, imit, muda }) {
  const { derived } = m;
  const confere = pedeElegibilidade(tipo) && !aprendida;
  const pode = podeCopiar(derived, { tipo, elegivel: confere ? imit.elegivel : true });
  const copiar = () => {
    /* A aprendida entra COMO a sessão a guarda (`{ tipo, id, escolhas, ... }`), e não com o nome e a regra que a tela juntou para mostrar. */
    const bruta = aprendida ? estadoDaImitacao(m.sessao, derived).aprendidas.find((c) => c.id === aprendida.id) : null;
    if (aprendida && !bruta) return;
    const r = m.acoes.imitacao.copiar(bruta ? { ...bruta, aprendida: true } : { tipo, id: def.id }, { elegivel: confere ? imit.elegivel : true });
    if (!r.erro) muda({ sel: null, elegivel: false });
  };
  const nivel = def.nivel ? `Nível ${def.nivel}` : null;
  const classe = def.especializacaoId ? def.especializacaoId[0].toUpperCase() + def.especializacaoId.slice(1) : null;
  return (
    <article className="k-detalhe" aria-label={def.nome} data-detalhe-imitacao={def.id}>
      <div className="x-cartao-topo">
        <div><h2 className="x-cartao-nome">{def.nome}</h2><p className="x-cartao-meta">{[rotuloDoTipoDeCopia(tipo), classe, nivel, aprendida ? "Aprendida" : null].filter(Boolean).map((t) => <span key={t}>{t}</span>)}</p></div>
        <span className="x-cartao-acoes"><button type="button" className="e-icone" aria-label="Fechar a cópia" onClick={() => muda({ sel: null, elegivel: false })}><X aria-hidden="true" /></button></span>
      </div>
      {def.descricao ? <p className="x-texto im-regra" style={{ margin: 0 }}>{textoPuro(def.descricao)}</p> : null}
      {confere && (
        <label className="g-presumir"><input type="checkbox" checked={imit.elegivel} onChange={(e) => muda({ elegivel: e.target.checked })} data-elegivel />Habilidade do Tipo Selecionado, Sem Gasto de PE</label>
      )}
      {!pode.ok && !(confere && pode.motivo === "Confirme o Tipo e o Gasto de PE") && <span className="x-atencao" data-bloqueio-copia><AlertTriangle aria-hidden="true" />{pode.motivo}</span>}
      <span className="x-linha">
        <button type="button" className="m-botao x-adicionar g2-primario" disabled={!pode.ok} onClick={copiar} data-confirmar-copia>Confirmar Cópia</button>
        <button type="button" className="m-botao" onClick={() => muda({ sel: null, elegivel: false })} data-cancelar-copia>Cancelar</button>
        {aprendida && <button type="button" className="m-botao" onClick={() => { m.acoes.imitacao.esquecer(aprendida.id); muda({ sel: null }); }} data-esquecer-copia>Esquecer</button>}
      </span>
    </article>
  );
}

export default function ImitacaoG2({ g, m, topo }) {
  const [imit, muda] = useTelaDaImitacao(g);
  const { derived, sessao } = m;
  const estado = estadoDaImitacao(sessao, derived);
  const tipos = tiposDaImitacao(derived);
  const aprendidas = useMemo(() => aprendidasDaImitacao(derived, estado), [derived, estado.aprendidas]); // eslint-disable-line react-hooks/exhaustive-deps
  const emAprendidas = imit.tipo === "aprendidas";
  const atual = emAprendidas || tipos.some((t) => t.id === imit.tipo) ? imit.tipo : "postura";
  /* A contagem de cada tipo, com a busca e o filtro de agora. */
  const porTipo = useMemo(
    () => Object.fromEntries(tipos.map((t) => [t.id, candidatasDoTipo(derived, estado, t.id, { efeito: imit.efeito, termo: imit.termo })])),
    [derived, estado.aprendidas, imit.efeito, imit.termo, tipos.length], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const lista = emAprendidas ? null : porTipo[atual];
  const copiaId = copiaAtual(derived)?.id ?? null;
  const defSel = (() => {
    if (!imit.sel) return null;
    if (emAprendidas) { const a = aprendidas.find((x) => x.id === imit.sel); return a ? { def: { id: a.id, nome: a.nome, descricao: a.descricao }, tipo: a.tipo, aprendida: a } : null; }
    const h = lista?.itens.find((x) => x.id === imit.sel);
    return h ? { def: h, tipo: atual, aprendida: null } : null;
  })();
  const trocaTipo = (id) => muda({ tipo: id, sel: null, elegivel: false });
  const abre = (id) => muda((a) => ({ sel: a.sel === id ? null : id, elegivel: false }));
  const linha = (id, nome, extra = null) => (
    <div key={id} className="k-fila" aria-current={imit.sel === id} data-chave-copia={id}>
      <button type="button" className="k-item" title={nome} aria-current={imit.sel === id} onClick={() => abre(id)}>
        <span className="k-nome"><span className="k-texto">{nome}</span>{extra}</span>
      </button>
      {copiaId === id && <span className="k-acao" data-tom="ativo" data-copia-ativa><span className="k-acao-texto">Copiando</span></span>}
      <button type="button" className="k-acao" data-largo data-tom="ativar" aria-label={`Escolher ${nome} para copiar`} onClick={() => abre(id)}>
        <span className="k-acao-texto">Copiar</span><span className="k-acao-seta" aria-hidden="true" />
      </button>
    </div>
  );
  return (
    <div className="k-catalogo" data-aba="imitacao" data-imitacao>
      {topo}
      <CopiaAtual m={m} imit={imit} muda={muda} />
      <div className="k-corpo">
        <nav className="k-trilho" aria-label="Tipos de cópia">
          {tipos.map((t) => (
            <button key={t.id} type="button" className="k-cat" aria-current={atual === t.id} data-tipo-copia={t.id} onClick={() => trocaTipo(t.id)}>
              <span>{t.rotulo}</span><small>{porTipo[t.id]?.itens.length ?? 0}</small>
            </button>
          ))}
          <span className="k-sep" aria-hidden="true" />
          <button type="button" className="k-cat" aria-current={emAprendidas} data-tipo-copia="aprendidas" onClick={() => trocaTipo("aprendidas")}>
            <span>Aprendidas</span><small>{aprendidas.length}</small>
          </button>
        </nav>
        <section className="k-lista" aria-label="Opções de cópia" data-lista-imitacao>
          {!emAprendidas && (
            <div className="im-filtros">
              <label className="e-busca k-busca">
                <Search aria-hidden="true" />
                <input className="afty-campo" type="search" value={imit.termo} placeholder="Buscar cópia" aria-label="Buscar cópia" onChange={(e) => muda({ termo: e.target.value, sel: null })} data-busca-copia />
                {imit.termo && <button type="button" className="e-limpar" onClick={() => muda({ termo: "", sel: null })} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
              </label>
              <span className="m-select im-efeito"><select className="afty-campo" value={imit.efeito} aria-label="Filtrar por efeito" onChange={(e) => muda({ efeito: e.target.value, sel: null })} data-filtro-efeito>
                <option value="todos">Todos os Efeitos</option>
                {FILTROS_HABILIDADE.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select><ChevronDown aria-hidden="true" /></span>
            </div>
          )}
          {emAprendidas ? (
            aprendidas.length ? aprendidas.map((a) => linha(a.id, a.nome, <span className="x-neutro im-tipo">{rotuloDoTipoDeCopia(a.tipo)}</span>)) : <p className="x-mesa">Nenhuma Aprendida</p>
          ) : (
            lista.itens.length ? lista.grupos.map((gr) => (
              <React.Fragment key={gr.rotulo || "sem"}>
                {gr.rotulo && <h3 className="k-grupo">{gr.rotulo}<small>{gr.itens.length}</small></h3>}
                {gr.itens.map((h) => linha(h.id, h.nome))}
              </React.Fragment>
            )) : <p className="x-mesa">Nenhuma Opção</p>
          )}
        </section>
        {defSel ? <DetalheDaCopia m={m} def={defSel.def} tipo={defSel.tipo} aprendida={defSel.aprendida} imit={imit} muda={muda} /> : <div />}
      </div>
    </div>
  );
}
