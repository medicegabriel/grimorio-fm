import { useCallback, useRef, useState } from "react";
import { buscarComentarios, excluirComentario, publicarComentario } from "./comunidade-api";
import { LIMITE_COMENTARIO } from "./comunidade-conteudo";
import { useConsultaComunidade } from "./usar-consulta-comunidade";
import AssinaturaDaConta from "./AssinaturaDaConta";
import TextoDaPublicacao, { EditorTextoPublicacao } from "./TextoDaPublicacao";

const dataLocal = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

export default function ComentariosComunidade({ publicacao, conta, autoria }) {
  const [pagina, setPagina] = useState(0);
  const [pendente, setPendente] = useState(null);
  const [erro, setErro] = useState("");
  const [texto, setTexto] = useState("");
  const nome = autoria.dados?.nome;
  const pedido = useRef(null);
  const carregar = useCallback((sinal) => buscarComentarios(publicacao, pagina, sinal), [publicacao, pagina]);
  const { dados, erro: erroDeLeitura, carregando, recarregar } = useConsultaComunidade(carregar);

  async function enviar(evento) {
    evento.preventDefault();
    if (!nome || pendente) return;
    const mensagem = texto.trim();
    if (!mensagem) {
      setErro("Escreva seu comentário.");
      return;
    }
    setErro("");
    const assinatura = JSON.stringify([conta.id, mensagem]);
    if (pedido.current?.assinatura !== assinatura) pedido.current = { assinatura, id: crypto.randomUUID() };
    setPendente("envio");
    try {
      await publicarComentario({ id: pedido.current.id, publicacao_id: publicacao, texto: mensagem });
      pedido.current = null;
      setTexto("");
      setPagina(0);
      recarregar();
      autoria.recarregar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setPendente(null);
    }
  }

  async function apagar(id) {
    if (pendente || !window.confirm("Excluir este comentário?")) return;
    setErro("");
    setPendente(id);
    try {
      await excluirComentario(id);
      if (pagina > 0 && dados?.itens.length === 1) setPagina(pagina - 1);
      recarregar();
      autoria.recarregar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setPendente(null);
    }
  }

  return (
    <section className="comunidade-comentarios" aria-labelledby="titulo-comentarios">
      <h2 id="titulo-comentarios" className="sr-only">Comentários</h2>
      {conta ? (
        <form className="comunidade-formulario" onSubmit={enviar}>
          <fieldset disabled={pendente === "envio"}>
            <AssinaturaDaConta consulta={autoria} />
            <EditorTextoPublicacao rotulo="Seu Comentário" nome="comentario" texto={texto} onChange={setTexto}
              maxLength={LIMITE_COMENTARIO} linhas={3} obrigatorio />
            <button className="comunidade-primario" type="submit" disabled={!nome || Boolean(pendente)}>
              {pendente === "envio" ? "Enviando…" : "Comentar"}
            </button>
          </fieldset>
        </form>
      ) : <p className="comunidade-contagem">Entre com sua conta para comentar.</p>}
      {erro && <p className="comunidade-erro" role="alert">{erro}</p>}
      {carregando && <p role="status">Carregando comentários…</p>}
      {erroDeLeitura && (
        <div className="comunidade-vazio">
          <p role="alert">{erroDeLeitura}</p>
          <button type="button" className="comunidade-acao-texto" onClick={recarregar}>Tentar Novamente</button>
        </div>
      )}
      {dados && (
        <>
          {!dados.itens.length && <p className="comunidade-contagem">Nenhum comentário nesta página.</p>}
          <ul className="comunidade-lista-comentarios">
            {dados.itens.map((item) => (
              <li key={item.id}>
                <div className="comunidade-comentario-topo">
                  <strong>{item.autor}</strong>
                  <time dateTime={item.criado_em}>{dataLocal.format(new Date(item.criado_em))}</time>
                  {conta && autoria.dados?.comentarios?.includes(item.id) && (
                    <button type="button" className="comunidade-acao-texto" disabled={Boolean(pendente)}
                      onClick={() => apagar(item.id)} aria-label={`Excluir comentário de ${item.autor}`}>
                      {pendente === item.id ? "Excluindo…" : "Excluir"}
                    </button>
                  )}
                </div>
                <TextoDaPublicacao texto={item.texto} />
              </li>
            ))}
          </ul>
          {(pagina > 0 || dados.mais) && (
            <nav className="comunidade-paginacao" aria-label="Páginas dos Comentários">
              <button type="button" className="comunidade-acao-texto" disabled={!pagina}
                onClick={() => setPagina(pagina - 1)}>Anterior</button>
              <span>Página {pagina + 1}</span>
              <button type="button" className="comunidade-acao-texto" disabled={!dados.mais}
                onClick={() => setPagina(pagina + 1)}>Próxima</button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
