import { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowUpRight, Check, ChevronDown } from "lucide-react";
import ContaNuvem from "../../nuvem/ContaNuvem";
import { buscarAutoria, editarPublicacao, publicarCriacao } from "./comunidade-api";
import {
  LIMITE_CSS, dadosDaFicha, lerFichasDaComunidade, prepararFicha, tamanhoEmBytes,
} from "./comunidade-conteudo";
import PreviaCssComunidade from "./PreviaCssComunidade";
import CartaDaCriacao from "./CartaDaCriacao";
import { EditorTextoPublicacao } from "./TextoDaPublicacao";
import AssinaturaDaConta from "./AssinaturaDaConta";
import { useConsultaComunidade } from "./usar-consulta-comunidade";

const LIMITE_TITULO = 100;
const LIMITE_RESUMO = 240;
const CSS_COMPATIBILIDADE = { Compatibilidade: "Ficha Final G2" };
const FORMATAR_NUMERO = new Intl.NumberFormat("pt-BR");
const EXEMPLOS_TEXTO = {
  jogador: "Build, estilo de jogo e escolhas da ficha",
  criatura: "Comportamento, habilidades e ideias de encontro",
  css: "Aparência, compatibilidade e instruções de instalação",
  topico: "Apresente o assunto ou a pergunta para discussão",
};

export default function PublicarComunidade({
  categorias, categoriaInicial, conta, volta, urlPublicada, publicacao, autoriaDaPublicacao, aoCancelar, aoSalvar,
}) {
  const editando = Boolean(publicacao);
  const [categoria, setCategoria] = useState(publicacao?.categoria ?? categoriaInicial);
  const [tituloEditado, setTitulo] = useState(publicacao?.titulo ?? null);
  const [resumo, setResumo] = useState(publicacao?.resumo ?? "");
  const [texto, setTexto] = useState(publicacao?.texto ?? "");
  const [escolha, setEscolha] = useState("");
  const [css, setCss] = useState(publicacao?.conteudo?.css ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const pedido = useRef(null);
  const contaId = conta?.id;
  const carregarAutoria = useCallback((sinal) => contaId ? buscarAutoria(null, sinal) : null, [contaId]);
  const autoriaNovaPublicacao = useConsultaComunidade(carregarAutoria, { ativa: Boolean(contaId && !editando) });
  const consultaAutoria = autoriaDaPublicacao ?? autoriaNovaPublicacao;
  const autor = consultaAutoria.dados?.nome;
  const podeSalvar = editando ? consultaAutoria.dados?.publicacao : Boolean(autor);
  const usaFicha = categoria === "jogador" || categoria === "criatura";
  const fichasDoAparelho = useMemo(() => conta ? lerFichasDaComunidade() : [], [conta]);
  const fichas = usaFicha ? fichasDoAparelho.filter((ficha) => ficha.categoria === categoria) : [];
  const selecionada = fichas.find((item) => item.id === escolha)?.ficha;
  const titulo = tituloEditado ?? selecionada?.name.slice(0, LIMITE_TITULO) ?? "";
  const dados = selecionada ? dadosDaFicha(selecionada, categoria)
    : publicacao?.dados ?? (categoria === "css" ? CSS_COMPATIBILIDADE : {});
  const codigo = css.trim();
  const bytes = tamanhoEmBytes(codigo);
  const cssExcede = categoria === "css" && bytes > LIMITE_CSS;

  async function salvar(evento) {
    evento.preventDefault();
    if (enviando || !podeSalvar) return;
    const textoPublico = texto.trim();
    const tituloPublico = titulo.trim();
    const resumoPublico = resumo.trim();
    setErro("");
    try {
      if (!resumoPublico || !tituloPublico || (categoria === "topico" && !textoPublico)) {
        throw new Error("Preencha os campos obrigatórios.");
      }
      let conteudo = publicacao?.conteudo ?? null;
      if (usaFicha && (!editando || selecionada)) {
        conteudo = prepararFicha(selecionada, categoria);
      }
      if (categoria === "css") {
        if (!codigo || cssExcede) throw new Error("Informe um CSS com até 32 KB.");
        conteudo = { css: codigo };
      }
      const campos = { titulo: tituloPublico, resumo: resumoPublico, texto: textoPublico };
      if (editando) {
        const alteracoes = Object.fromEntries(Object.entries(campos).filter(([campo, valor]) => valor !== publicacao[campo]));
        if (selecionada) Object.assign(alteracoes, { dados, conteudo });
        if (categoria === "css" && codigo !== publicacao.conteudo.css) alteracoes.conteudo = conteudo;
        if (Object.keys(alteracoes).length) {
          setEnviando(true);
          await editarPublicacao(publicacao.id, alteracoes);
        }
        aoSalvar();
        return;
      }
      const novaPublicacao = { categoria, ...campos, dados, conteudo };
      const chavePedido = JSON.stringify([contaId, novaPublicacao]);
      if (pedido.current?.assinatura !== chavePedido) pedido.current = { assinatura: chavePedido, id: crypto.randomUUID() };
      setEnviando(true);
      const id = await publicarCriacao({ ...novaPublicacao, id: pedido.current.id });
      location.assign(urlPublicada(id));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="comunidade comunidade-detalhe comunidade-publicar">
      <div className="comunidade-topo-publicacao">
        {editando ? (
          <button className="comunidade-voltar" type="button" onClick={aoCancelar} disabled={enviando}>
            <ArrowLeft aria-hidden="true" /> Voltar à Publicação
          </button>
        ) : <a className="comunidade-voltar" href={volta}><ArrowLeft aria-hidden="true" /> Voltar ao Catálogo</a>}
        {conta && <ContaNuvem />}
      </div>
      <h1>{editando ? "Editar Publicação" : "Publicar na Comunidade"}</h1>
      {!conta ? (
        <section className="comunidade-ficha comunidade-entrar-publicacao">
          <p>Entre com sua conta do fichafm para publicar.</p>
          <ContaNuvem />
        </section>
      ) : (
        <>
          <form onSubmit={salvar} className="comunidade-formulario comunidade-editor-publicacao">
            {!editando && (
              <fieldset className="comunidade-tipos-publicacao" disabled={enviando}>
                <legend>Tipo de Publicação</legend>
                <div className="comunidade-opcoes-publicacao">
                  {Object.entries(categorias).map(([id, { tipo, Icone }]) => (
                    <label key={id}>
                      <input className="sr-only" type="radio" name="categoria" value={id} checked={categoria === id}
                        onChange={() => { setCategoria(id); setEscolha(""); setErro(""); }} />
                      <span><Icone aria-hidden="true" /> {tipo}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="comunidade-composicao">
              <fieldset className="comunidade-corpo-publicacao" disabled={enviando}>
                {usaFicha && (
                  <>
                    <label>{editando ? "Ficha da Publicação" : "Ficha para Compartilhar"}
                      <span className="comunidade-ordem comunidade-seletor-publicacao">
                        <select name="ficha" required={!editando} value={escolha} disabled={!fichas.length}
                          onChange={(e) => { setEscolha(e.target.value); if (!tituloEditado?.trim()) setTitulo(null); }}>
                          <option value="">{editando ? "Manter ficha publicada" : fichas.length ? "Selecione uma ficha" : "Nenhuma ficha neste aparelho"}</option>
                          {fichas.map((item) => <option key={item.id} value={item.id}>{item.ficha.name} · {item.rotulo}</option>)}
                        </select>
                        <ChevronDown className="comunidade-icone-ordem" aria-hidden="true" />
                      </span>
                    </label>
                    {!editando && !fichas.length && <p className="comunidade-contagem">Crie ou importe uma ficha em {categoria === "jogador" ? "Jogador" : "Criatura"} para compartilhar.</p>}
                  </>
                )}
                <div className="comunidade-duas-colunas comunidade-identidade-publicacao">
                  <label>Título
                    <input name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Título da publicação" maxLength={LIMITE_TITULO} required />
                  </label>
                  <AssinaturaDaConta consulta={consultaAutoria} />
                </div>
                <EditorTextoPublicacao rotulo="Resumo" nome="resumo" texto={resumo} onChange={setResumo} linhas={2}
                  placeholder="Descreva a publicação em poucas palavras" maxLength={LIMITE_RESUMO} obrigatorio />
                {categoria === "css" && (
                  <label>
                    <span className="comunidade-rotulo-publicacao">CSS Personalizado
                      <span className={cssExcede ? "comunidade-erro" : undefined} id="comunidade-limite-css" aria-hidden="true">
                        {FORMATAR_NUMERO.format(bytes)} / {FORMATAR_NUMERO.format(LIMITE_CSS)} bytes
                      </span>
                    </span>
                    <textarea value={css} onChange={(e) => setCss(e.target.value)} className="comunidade-editor-css"
                      aria-describedby="comunidade-limite-css" aria-invalid={cssExcede || undefined}
                      maxLength={LIMITE_CSS} spellCheck={false} rows={7} required />
                  </label>
                )}
                <EditorTextoPublicacao rotulo={categoria === "topico" ? "Texto do Tópico" : "Sobre a Criação (Opcional)"}
                  texto={texto} onChange={setTexto} placeholder={EXEMPLOS_TEXTO[categoria]} obrigatorio={categoria === "topico"} />
                {erro && <p className="comunidade-erro comunidade-erro-publicacao" role="alert"><AlertTriangle aria-hidden="true" />{erro}</p>}
              </fieldset>
              <section className="comunidade-previa-publicacao" aria-labelledby="comunidade-titulo-previa">
                <h2 id="comunidade-titulo-previa">Prévia no Catálogo</h2>
                <CartaDaCriacao categoria={categorias[categoria]} criacao={{
                  id: "previa", titulo: titulo.trim() || "Título da publicação", autor: publicacao?.autor ?? (autor || "Sua conta"),
                  resumo: resumo.trim() || "O resumo da publicação aparece aqui.", dados,
                }} />
              </section>
            </div>
            <footer className="comunidade-enviar-publicacao">
              {editando ? (
                <button className="comunidade-acao-texto" type="button" disabled={enviando} onClick={aoCancelar}>Cancelar</button>
              ) : <p className="comunidade-contagem">O usuário da sua conta e o conteúdo enviado ficarão visíveis na Comunidade.</p>}
              <button className="comunidade-primario" type="submit" disabled={enviando || !podeSalvar || (!editando && usaFicha && !fichas.length) || cssExcede}>
                {editando ? (enviando ? "Salvando…" : "Salvar Alterações") : (enviando ? "Publicando…" : "Publicar")}
                {editando ? <Check aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
              </button>
            </footer>
          </form>
          {categoria === "css" && <PreviaCssComunidade css={codigo} />}
        </>
      )}
    </div>
  );
}
