import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Braces, ChevronDown, Ghost, LockKeyhole, MessageSquare, Plus, Search, SearchX, UserRound, X } from "lucide-react";
import ContaNuvem from "../../nuvem/ContaNuvem";
import { nuvemAtiva } from "../../nuvem/nuvem-config";
import { lerEstadoNuvem, ouvirNuvem } from "../../nuvem/nuvem-sync";
import DetalheComunidade from "./DetalheComunidade";
import CartaDaCriacao from "./CartaDaCriacao";
import PreviaCssComunidade from "./PreviaCssComunidade";
import PublicarComunidade from "./PublicarComunidade";
import { buscarPublicacoes } from "./comunidade-api";
import { useConsultaComunidade } from "./usar-consulta-comunidade";
import "./comunidade.css";

const CATEGORIAS = {
  jogador: { nome: "Fichas de Jogador", tipo: "Ficha de Jogador", Icone: UserRound },
  criatura: { nome: "Fichas de Criatura", tipo: "Ficha de Criatura", Icone: Ghost },
  css: { nome: "CSS Personalizado", tipo: "CSS Personalizado", Icone: Braces },
  topico: { nome: "Tópicos", tipo: "Tópico", Icone: MessageSquare },
};

const OPCOES_CATEGORIA = [["tudo", { nome: "Tudo" }], ...Object.entries(CATEGORIAS)];

function enderecoDaComunidade({ busca, categoria, ordem, pagina }, { criacao, publicar } = {}) {
  const query = new URLSearchParams();
  if (busca.trim()) query.set("busca", busca.trim());
  if (categoria !== "tudo") query.set("categoria", categoria);
  if (ordem !== "recentes") query.set("ordem", ordem);
  if (pagina > 0) query.set("pagina", String(pagina + 1));
  if (criacao) query.set("criacao", criacao);
  if (publicar) query.set("publicar", "1");
  const parametros = query.toString();
  return parametros ? `/Comunidade?${parametros}` : "/Comunidade";
}

function lerFiltros() {
  const query = new URLSearchParams(location.search);
  const categoria = query.get("categoria");
  const pagina = Number(query.get("pagina"));
  return {
    busca: (query.get("busca") ?? "").slice(0, 120),
    categoria: Object.hasOwn(CATEGORIAS, categoria) ? categoria : "tudo",
    ordem: query.get("ordem") === "nome" ? "nome" : "recentes",
    pagina: Number.isInteger(pagina) && pagina > 1 && pagina <= 10000 ? pagina - 1 : 0,
  };
}

export default function Comunidade() {
  const { usuario: conta } = useSyncExternalStore(ouvirNuvem, lerEstadoNuvem);
  const query = new URLSearchParams(location.search);
  const filtros = lerFiltros();
  const id = query.get("criacao");
  const volta = enderecoDaComunidade(filtros);
  if (id) {
    return <DetalheComunidade key={id} id={id} abrirComentarios={query.get("aba") === "comentarios"}
      conta={conta} categorias={CATEGORIAS} volta={volta} />;
  }
  if (query.get("publicar") === "1" && nuvemAtiva) {
    return <PublicarComunidade categorias={CATEGORIAS} conta={conta} volta={volta}
      categoriaInicial={filtros.categoria === "tudo" ? "jogador" : filtros.categoria}
      urlPublicada={(criacao) => enderecoDaComunidade(filtros, { criacao })} />;
  }
  return <CatalogoComunidade />;
}

function CatalogoComunidade() {
  const [filtros, setFiltros] = useState(lerFiltros);
  const campoBusca = useRef(null);
  const carregar = useCallback((sinal) => buscarPublicacoes(filtros, sinal), [filtros]);
  const { dados, erro, carregando, recarregar } = useConsultaComunidade(carregar, { ativa: nuvemAtiva, espera: filtros.busca ? 220 : 0 });

  function atualizarFiltros(campos) {
    const novosFiltros = { ...filtros, pagina: 0, ...campos };
    setFiltros(novosFiltros);
    history.replaceState(history.state, "", enderecoDaComunidade(novosFiltros));
  }

  function limparBusca() {
    atualizarFiltros({ busca: "" });
    campoBusca.current?.focus();
  }

  function limparFiltros() {
    atualizarFiltros({ busca: "", categoria: "tudo" });
    campoBusca.current?.focus();
  }

  const resultados = dados?.itens ?? [];
  const temFiltros = Boolean(filtros.busca.trim()) || filtros.categoria !== "tudo";

  return (
    <div className="comunidade">
      <header className="comunidade-cabecalho">
        <div>
          <h1>Comunidade</h1>
          <p>Fichas, temas e conversas de Feiticeiros &amp; Maldições para compartilhar e usar na mesa.</p>
        </div>
        {nuvemAtiva && (
          <div className="comunidade-acoes">
            <ContaNuvem />
            <a href={enderecoDaComunidade(filtros, { publicar: true })} className="comunidade-primario">
              <Plus aria-hidden="true" /> Publicar
            </a>
          </div>
        )}
      </header>
      <section className="comunidade-catalogo" aria-label="Catálogo da Comunidade">
        <div className="comunidade-ferramentas">
          <div className="comunidade-busca">
            <Search className="comunidade-icone-busca" aria-hidden="true" />
            <input ref={campoBusca} type="search" aria-label="Buscar Publicações" placeholder="Buscar publicações"
              maxLength={120} value={filtros.busca} onChange={(e) => atualizarFiltros({ busca: e.target.value })} />
            {filtros.busca && (
              <button type="button" aria-label="Limpar Busca" onClick={limparBusca}><X aria-hidden="true" /></button>
            )}
          </div>
          <div className="comunidade-ordem">
            <select aria-label="Ordenar Publicações" value={filtros.ordem} onChange={(e) => atualizarFiltros({ ordem: e.target.value })}>
              <option value="recentes">Mais Recentes</option>
              <option value="nome">Nome de A a Z</option>
            </select>
            <ChevronDown className="comunidade-icone-ordem" aria-hidden="true" />
          </div>
        </div>
        <fieldset className="comunidade-filtros comunidade-categorias">
          <legend className="sr-only">Categorias da Comunidade</legend>
          {OPCOES_CATEGORIA.map(([id, { nome }]) => (
            <label className="comunidade-opcao" key={id}>
              <input className="sr-only" type="radio" name="categoria-comunidade" value={id}
                checked={filtros.categoria === id} onChange={() => atualizarFiltros({ categoria: id })} />
              <span>{nome}</span>
            </label>
          ))}
          <span className="comunidade-trancado"><LockKeyhole aria-hidden="true" /> Addons<span className="sr-only"> em breve</span></span>
        </fieldset>
        {filtros.categoria === "css" && <PreviaCssComunidade />}
        {!nuvemAtiva && <p className="comunidade-contagem">O catálogo e a publicação ainda não estão disponíveis neste ambiente.</p>}
        {carregando && <p className="comunidade-contagem" role="status">Carregando publicações…</p>}
        {erro && (
          <div className="comunidade-vazio">
            <p role="alert">{erro}</p>
            <button type="button" className="comunidade-acao-texto" onClick={recarregar}>Tentar Novamente</button>
          </div>
        )}
        {dados && (
          <>
            <div className="comunidade-resultados">
              <p className="comunidade-contagem" role="status">
                {resultados.length === 1 ? "1 publicação nesta página" : `${resultados.length} publicações nesta página`}
              </p>
              {temFiltros && resultados.length > 0 && (
                <button type="button" className="comunidade-acao-texto" onClick={limparFiltros}>Limpar Filtros</button>
              )}
            </div>
            {resultados.length ? (
              <ul className="comunidade-grade">
                {resultados.map((criacao) => (
                  <li key={criacao.id}>
                    <CartaDaCriacao criacao={criacao} categoria={CATEGORIAS[criacao.categoria]}
                      href={enderecoDaComunidade(filtros, { criacao: criacao.id })} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="comunidade-vazio">
                <SearchX aria-hidden="true" />
                <div>
                  <h2>{temFiltros ? "Nenhuma Publicação Encontrada" : "Nenhuma Publicação Nesta Página"}</h2>
                  {temFiltros && <p>Tente outro termo ou veja todas as categorias.</p>}
                </div>
                {temFiltros && <button type="button" className="comunidade-acao-texto" onClick={limparFiltros}>Limpar Filtros</button>}
              </div>
            )}
            {(filtros.pagina > 0 || dados.mais) && (
              <nav className="comunidade-paginacao" aria-label="Páginas do Catálogo">
                <button type="button" className="comunidade-acao-texto" disabled={!filtros.pagina}
                  onClick={() => atualizarFiltros({ pagina: filtros.pagina - 1 })}>Anterior</button>
                <span>Página {filtros.pagina + 1}</span>
                <button type="button" className="comunidade-acao-texto" disabled={!dados.mais}
                  onClick={() => atualizarFiltros({ pagina: filtros.pagina + 1 })}>Próxima</button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
