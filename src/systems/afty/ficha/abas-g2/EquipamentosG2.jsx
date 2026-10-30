/* ============================================================
   ABA EQUIPAMENTOS DO G2 (prévia isolada, 2026-10-21; decisão 1A)
   ============================================================
   Inventário de CONSULTA: carga, sobrecarga e penalidade no topo, busca e categorias com contagem, lista e detalhe lado a lado quando
   há largura (900 px úteis), detalhe no lugar quando não há. Nada aqui compra, equipa ou encanta, e nenhum número do item é repetido:
   o que ele dá já está na Defesa, na RD e na linha de Dano, com as fontes no hover de cada um.

   Identidade por `uid` (`equipamento:<uid>`): duas Katanas iguais com encantamentos diferentes são duas linhas, dois detalhes e dois
   favoritos. A estrela grava em `sessao.favoritos`, e o Rápido do G2 mostra o item (correção desta prévia, só no G2).
   Inventário vazio ("Nada Carregado") e busca sem resultado ("Nenhum Item Encontrado") são estados diferentes.
   ============================================================ */
import React, { useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Search, Star, X } from "lucide-react";

import { NumeroComFontes } from "../../ui/fontes";
import { numeroBr } from "../../ui/formato";
import { filtraConteudo } from "../ficha-conteudo";
import { Secao, Vazio } from "./pecas-mesa";
import { useDestaqueG2 } from "./usar-destaque-g2";

/** O detalhe de um item: marcas, texto e encantamentos. Leitura pura. */
export function DetalheDoItem({ item, favorito, onFavorito, onFechar = null }) {
  return (
    <div className="m-item-detalhe" data-m-item-detalhe={item.chave}>
      <div className="m-item-detalhe-topo">
        <h3 className="m-item-detalhe-nome">{item.nome}</h3>
        <button type="button" className="e-fixar" aria-pressed={!!favorito} onClick={() => onFavorito(item.chave)}>
          <Star aria-hidden="true" fill={favorito ? "currentColor" : "none"} />{favorito ? "Tirar do Rápido" : "Fixar no Rápido"}
        </button>
        {onFechar && <button type="button" className="e-fechar" onClick={onFechar} aria-label={`Fechar ${item.nome}`}><X aria-hidden="true" /></button>}
      </div>
      {(item.sub || item.tags.length > 0) && (
        <p className="m-item-marcas">
          {[item.sub?.label, ...item.tags.map((t) => t.label)].filter(Boolean).map((t) => <span key={t} className="m-meta">{t}</span>)}
        </p>
      )}
      {item.aviso && <p className="m-aviso-chip"><AlertTriangle aria-hidden="true" />{item.aviso}</p>}
      {item.texto ? <p className="m-texto">{item.texto}</p> : <p className="m-sem-detalhe">Sem Descrição</p>}
      {item.opcoes.length > 0 && (
        <div className="m-bloco">
          <h4 className="m-bloco-titulo">{item.opcoes.length === 1 ? "Encantamento" : "Encantamentos"} <small>{item.opcoes.length}</small></h4>
          {item.opcoes.map((o) => (
            <div key={o.id} className="m-encantamento">
              <span className="m-encantamento-nome">{o.nome}</span>
              {o.descricao && <p className="m-texto">{o.descricao}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** A linha de um item, na aba e no Rápido. `aberto` mostra o detalhe abaixo dela (lista estreita e Rápido). */
export function LinhaDeItem({ item, selecionado = false, aberto = false, favorito, onFavorito, onAbrir, destaque = null, noRapido = false }) {
  const raiz = useDestaqueG2(destaque?.chave === item.chave, destaque?.seq);
  const nome = useRef(null);
  const encantamentos = item.opcoes.length;
  const idDetalhe = `m-item-${noRapido ? "rapido-" : ""}${item.chave}`;
  return (
    <div ref={raiz} id={noRapido ? undefined : `afty-item-${item.chave}`} className="afty-linha e-linha m-item" data-m-linha={noRapido ? undefined : item.chave}
      data-selecionado={selecionado ? "sim" : undefined} data-afty-alvo={destaque?.chave === item.chave ? "sim" : undefined}
      onKeyDown={(ev) => { if (ev.key === "Escape" && aberto && !document.querySelector("#afty-ficha .afty-fontes-flutuante, .afty-busca-fundo")) { ev.stopPropagation(); onAbrir(item.chave); requestAnimationFrame(() => nome.current?.focus({ preventScroll: true })); } }}>
      <button type="button" className="e-estrela" aria-pressed={!!favorito} onClick={() => onFavorito(item.chave)}
        aria-label={favorito ? `Tirar ${item.nome} do Rápido` : `Fixar ${item.nome} no Rápido`} title={favorito ? "Tirar do Rápido" : "Fixar no Rápido"}>
        <Star aria-hidden="true" fill={favorito ? "currentColor" : "none"} />
      </button>
      <button ref={nome} type="button" className="m-item-corpo" aria-expanded={aberto || selecionado} aria-controls={aberto ? idDetalhe : undefined} onClick={() => onAbrir(item.chave)}>
        <span className="m-nome">{item.nome}</span>
        <span className="m-metas">
          {item.tags.map((t) => <span key={t.label} className="m-meta" data-afty-tag={t.tipo ?? undefined}>{t.label}</span>)}
          {encantamentos > 0 && <span className="m-meta">{encantamentos === 1 ? "1 Encantamento" : `${encantamentos} Encantamentos`}</span>}
          {item.aviso && <span className="m-chip" data-tom="aviso" title={item.aviso}><AlertTriangle aria-hidden="true" />Aviso</span>}
        </span>
        <ChevronDown aria-hidden="true" className="m-seta m-seta-fim" />
      </button>
      {aberto && (
        <div id={idDetalhe} className="m-detalhe m-item-no-lugar">
          <DetalheDoItem item={item} favorito={favorito} onFavorito={onFavorito} />
        </div>
      )}
    </div>
  );
}

function Carga({ carga, penalidade, partesPenalidade }) {
  const limite = Math.max(1, carga.cargaLimite || 1);
  const pct = Math.min(100, (carga.espacosUsados / limite) * 100);
  const nivel = carga.acimaDoMaximo ? "critico" : carga.sobrecarregado ? "baixo" : "normal";
  return (
    <section className="afty-card m-carga" data-afty-carga={nivel} aria-label="Carga">
      <div className="m-carga-topo">
        <span className="m-carga-rotulo">Carga</span>
        <span className="m-carga-num">{carga.espacosUsados} <small>/ {carga.cargaLimite}</small></span>
        {carga.sobrecarregado && (
          <span className="m-pendente"><AlertTriangle aria-hidden="true" />Sobrecarregado</span>
        )}
        {penalidade !== 0 && (
          <span className="m-meta m-penalidade">Penalidade de Armadura{" "}
            <NumeroComFontes valor={penalidade} partes={partesPenalidade} total={penalidade} className="m-meta-num" ancora="direita" titulo="Penalidade de Armadura nas perícias de Destreza" />
          </span>
        )}
      </div>
      <div className="afty-vital-trilho m-carga-trilho" data-afty-vital="carga">
        <span className="afty-vital-barra" style={{ width: `${pct}%`, "--afty-vital-cor": carga.sobrecarregado ? "var(--afty-aviso)" : "var(--afty-destaque)" }} />
      </div>
      {carga.sobrecarregado && (
        <p className="m-carga-penalidades">
          <span className="m-meta">Defesa {carga.defesa}</span>
          <span className="m-meta">Deslocamento {numeroBr(carga.movimento)}m</span>
          {carga.acimaDoMaximo && <span className="m-meta">Máximo {carga.cargaMaxima}</span>}
        </p>
      )}
    </section>
  );
}

export default function EquipamentosG2({ derived, itens, favoritos, onFavorito, destaque = null }) {
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [selecionado, setSelecionado] = useState(null);
  const carga = derived.carga ?? null;
  const avisos = derived.equip?.avisos ?? [];
  const penalidade = derived.penalidadeDestreza ?? 0;
  const categorias = useMemo(() => {
    const mapa = new Map();
    for (const i of itens) {
      const s = i.sub ?? { id: "outros", label: "Outros" };
      if (!mapa.has(s.id)) mapa.set(s.id, { ...s, n: 0 });
      mapa.get(s.id).n += 1;
    }
    return [...mapa.values()];
  }, [itens]);
  const porTermo = useMemo(() => filtraConteudo(itens, termo), [itens, termo]);
  /* A busca global que aponta um item: seleciona-o e limpa o filtro que o escondesse. Ajuste no render, uma vez por busca. */
  const [seqVisto, setSeqVisto] = useState(0);
  if (destaque?.seq && destaque.seq !== seqVisto) {
    setSeqVisto(destaque.seq);
    const alvo = itens.find((i) => i.chave === destaque.chave);
    if (alvo) {
      const escondido = !porTermo.includes(alvo) || (categoria !== "todos" && (alvo.sub?.id ?? "outros") !== categoria);
      if (escondido) { setTermo(""); setCategoria("todos"); }
      setSelecionado(alvo.chave);
    }
  }
  const categoriaValida = categoria === "todos" || categorias.some((c) => c.id === categoria) ? categoria : "todos";
  const visiveis = porTermo.filter((i) => categoriaValida === "todos" || (i.sub?.id ?? "outros") === categoriaValida);
  const itemSelecionado = visiveis.find((i) => i.chave === selecionado) ?? null;
  const contagemDe = (id) => porTermo.filter((i) => id === "todos" || (i.sub?.id ?? "outros") === id).length;
  const alterna = (chave) => setSelecionado((s) => (s === chave ? null : chave));
  /* Fechar o detalhe lateral devolve o foco à linha do item. */
  const fecharDetalhe = () => {
    const chave = selecionado;
    setSelecionado(null);
    requestAnimationFrame(() => document.querySelector(`[data-m-linha="${CSS.escape(chave ?? "")}"] .m-item-corpo`)?.focus({ preventScroll: true }));
  };
  const filtrando = !!termo.trim() || categoriaValida !== "todos";

  return (
    <div className="e-g2 m-aba m-equip-aba" data-m-aba="equipamentos">
      {carga && <Carga carga={carga} penalidade={penalidade} partesPenalidade={derived.partes?.penalidadeDestreza} />}
      {avisos.length > 0 && (
        <ul className="afty-card m-avisos m-avisos-equip" aria-label="Avisos do equipamento">
          {avisos.map((a) => <li key={a}><AlertTriangle aria-hidden="true" />{a}</li>)}
        </ul>
      )}
      <Secao id="inventario" titulo="Inventário" contagem={filtrando ? `${visiveis.length} de ${itens.length}` : itens.length} controles={itens.length > 0 && (
        <div className="m-ferramentas">
          <label className="e-busca m-busca">
            <Search aria-hidden="true" />
            <input className="afty-campo" type="search" value={termo} placeholder="Buscar no Inventário" aria-label="Buscar no inventário pelo nome, texto ou encantamento"
              onChange={(ev) => setTermo(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Escape" && termo) { ev.stopPropagation(); setTermo(""); } }} />
            {termo && <button type="button" className="e-limpar" onClick={() => setTermo("")} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
          </label>
          {categorias.length > 1 && (
            <span className="m-seg m-categorias" role="radiogroup" aria-label="Categoria do inventário">
              {[{ id: "todos", label: "Todos" }, ...categorias].map((c) => (
                <button key={c.id} type="button" role="radio" className="m-seg-op" aria-checked={categoriaValida === c.id} onClick={() => setCategoria(c.id)}>
                  {c.label}<small>{contagemDe(c.id)}</small>
                </button>
              ))}
            </span>
          )}
        </div>
      )}>
        {itens.length === 0 ? (
          <Vazio texto="Nada Carregado" />
        ) : visiveis.length === 0 ? (
          <Vazio texto="Nenhum Item Encontrado" acao={<button type="button" className="m-botao" onClick={() => { setTermo(""); setCategoria("todos"); }}>Limpar Busca</button>} />
        ) : (
          <div className="m-inventario" data-com-detalhe={itemSelecionado ? "sim" : undefined}>
            <div className="m-inventario-lista e-grupo-lista">
              {visiveis.map((i) => (
                <LinhaDeItem key={i.chave} item={i} selecionado={selecionado === i.chave} aberto={selecionado === i.chave}
                  favorito={favoritos.includes(i.chave)} onFavorito={onFavorito} onAbrir={alterna} destaque={destaque} />
              ))}
            </div>
            {itemSelecionado && (
              <aside className="m-inventario-detalhe" aria-label={`Detalhe de ${itemSelecionado.nome}`}
                onKeyDown={(ev) => { if (ev.key === "Escape" && !document.querySelector("#afty-ficha .afty-fontes-flutuante, .afty-busca-fundo")) { ev.stopPropagation(); fecharDetalhe(); } }}>
                <DetalheDoItem item={itemSelecionado} favorito={favoritos.includes(itemSelecionado.chave)} onFavorito={onFavorito} onFechar={fecharDetalhe} />
              </aside>
            )}
          </div>
        )}
      </Secao>
    </div>
  );
}
