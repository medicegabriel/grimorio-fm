import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import ContaNuvem from "../../nuvem/ContaNuvem";
import { baixarJson } from "../../systems/afty/ficha/efeitos/util";
import { buscarAutoria, buscarPublicacao, excluirPublicacao } from "./comunidade-api";
import { baixarCss, nomeDoArquivo, prepararFicha } from "./comunidade-conteudo";
import { useConsultaComunidade } from "./usar-consulta-comunidade";
import { DadosDaCriacao } from "./CartaDaCriacao";
import TextoDaPublicacao from "./TextoDaPublicacao";
import ComentariosComunidade from "./ComentariosComunidade";
import PreviaCssComunidade from "./PreviaCssComunidade";
import PublicarComunidade from "./PublicarComunidade";

const dataLocal = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

export default function DetalheComunidade({ id, abrirComentarios, conta, categorias, volta }) {
  const carregar = useCallback((sinal) => buscarPublicacao(id, sinal), [id]);
  const { dados: post, carregando, erro, recarregar } = useConsultaComunidade(carregar);
  const contaId = conta?.id;
  const carregarAutoria = useCallback((sinal) => contaId ? buscarAutoria(id, sinal) : null, [id, contaId]);
  const consultaAutoria = useConsultaComunidade(carregarAutoria, { ativa: Boolean(contaId && post) });
  const autoria = consultaAutoria.dados;
  const [editando, setEditando] = useState(false);
  const [retirando, setRetirando] = useState(false);
  const [erroAcao, setErroAcao] = useState("");

  async function retirar() {
    if (!autoria?.publicacao || retirando ||
      !window.confirm("Retirar esta publicação? Os comentários também serão excluídos.")) return;
    setRetirando(true);
    setErroAcao("");
    try {
      await excluirPublicacao(id);
      location.assign(volta);
    } catch (falha) {
      setErroAcao(falha.message);
    } finally {
      setRetirando(false);
    }
  }

  function baixarFicha() {
    try {
      baixarJson(`${nomeDoArquivo(post.titulo)}.json`, [prepararFicha(post.conteudo, post.categoria)]);
      setErroAcao("");
    } catch (falha) {
      setErroAcao(falha.message);
    }
  }

  if (editando && post && conta && autoria?.publicacao) {
    return <PublicarComunidade categorias={categorias} conta={conta} publicacao={post} autoriaDaPublicacao={consultaAutoria}
      aoCancelar={() => setEditando(false)} aoSalvar={() => { setEditando(false); recarregar(); }} />;
  }

  return (
    <div className="comunidade comunidade-detalhe">
      <a className="comunidade-voltar" href={volta}><ArrowLeft aria-hidden="true" /> Voltar ao Catálogo</a>
      {carregando && <p role="status">Carregando publicação…</p>}
      {erro && (
        <div className="comunidade-vazio">
          <p role="alert">{erro}</p>
          <button className="comunidade-acao-texto" type="button" onClick={recarregar}>Tentar Novamente</button>
        </div>
      )}
      {!carregando && !erro && !post && <h1>Publicação Não Encontrada</h1>}
      {post && (
        <article className="comunidade-topico" aria-labelledby="titulo-publicacao">
          <header className="comunidade-cabecalho">
            <div>
              <h1 id="titulo-publicacao">{post.titulo}</h1>
              <p>{categorias[post.categoria].tipo} · por {post.autor} · <time dateTime={post.criado_em}>{dataLocal.format(new Date(post.criado_em))}</time></p>
            </div>
            <div className="comunidade-acoes">
              <ContaNuvem />
              {conta && autoria?.publicacao && (
                <>
                  <button className="comunidade-acao-texto" type="button" disabled={retirando} onClick={() => setEditando(true)}>
                    Editar
                  </button>
                  <button className="comunidade-acao-texto" type="button" onClick={retirar} disabled={retirando}>
                    {retirando ? "Retirando…" : "Retirar Publicação"}
                  </button>
                </>
              )}
            </div>
          </header>
          {erroAcao && <p className="comunidade-erro" role="alert">{erroAcao}</p>}
          <section className="comunidade-ficha" aria-label="Sobre a Publicação">
            <TextoDaPublicacao texto={post.resumo} />
            {post.texto && <TextoDaPublicacao texto={post.texto} />}
            <DadosDaCriacao dados={post.dados} />
            {(post.categoria === "jogador" || post.categoria === "criatura") && (
              <div className="comunidade-download">
                <button className="comunidade-primario" type="button" onClick={baixarFicha}>
                  <Download aria-hidden="true" /> Baixar Ficha
                </button>
                <p className="comunidade-contagem">Abra o JSON em Importar, na biblioteca da edição indicada.</p>
              </div>
            )}
          </section>
          <DiscussaoDaPublicacao iniciarAberta={abrirComentarios} publicacao={post.id} conta={conta} autoria={consultaAutoria} />
          {post.categoria === "css" && <TemaPublicado post={post} />}
        </article>
      )}
    </div>
  );
}

function DiscussaoDaPublicacao({ iniciarAberta, publicacao, conta, autoria }) {
  const detalhes = useRef(null);
  const [visitada, setVisitada] = useState(iniciarAberta);

  useEffect(() => {
    if (iniciarAberta) detalhes.current?.scrollIntoView({ block: "start" });
  }, [iniciarAberta]);

  return (
    <details className="comunidade-discussao" ref={detalhes} open={iniciarAberta || undefined}
      onToggle={(evento) => { if (evento.currentTarget.open) setVisitada(true); }}>
      <summary>Comentários</summary>
      {visitada && <ComentariosComunidade publicacao={publicacao} conta={conta} autoria={autoria} />}
    </details>
  );
}

function TemaPublicado({ post }) {
  const [retorno, setRetorno] = useState("");
  const css = post.conteudo.css;
  const baixar = () => baixarCss(`${nomeDoArquivo(post.titulo)}.css`, css);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(css);
      setRetorno("CSS copiado.");
    } catch {
      setRetorno("Não foi possível copiar. Você pode baixar o arquivo CSS.");
    }
  }

  return (
    <>
      <PreviaCssComunidade css={css} />
      <section className="comunidade-ficha comunidade-codigo" aria-label="Código CSS">
        <h2>CSS Personalizado</h2>
        <p className="comunidade-contagem">Para aplicar o tema, cole o código no editor de CSS Personalizado da Ficha Final.</p>
        <pre><code>{css}</code></pre>
        <div className="comunidade-acoes">
          <button className="comunidade-primario" type="button" onClick={baixar}><Download aria-hidden="true" /> Baixar CSS</button>
          <button className="comunidade-acao-texto" type="button" onClick={copiar}>Copiar CSS</button>
          <span className="comunidade-contagem" role="status">{retorno}</span>
        </div>
      </section>
    </>
  );
}
