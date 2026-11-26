import { ArrowRight } from "lucide-react";
import TextoDaPublicacao from "./TextoDaPublicacao";

export function DadosDaCriacao({ dados }) {
  const itens = Object.entries(dados ?? {});
  if (!itens.length) return null;
  return (
    <dl className="comunidade-dados">
      {itens.map(([chave, valor]) => (
        <div key={chave}>
          <dt>{chave}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function CartaDaCriacao({ criacao, categoria, href }) {
  const { Icone, tipo } = categoria;
  const tituloId = `titulo-${criacao.id}`;
  const tipoId = `tipo-${criacao.id}`;
  const Carta = href ? "a" : "article";
  const Titulo = href ? "h2" : "h3";

  return (
    <Carta className="comunidade-carta" href={href} aria-labelledby={`${tituloId} ${tipoId}`}>
      <div className="comunidade-carta-topo">
        <span className="comunidade-tipo" id={tipoId}><Icone aria-hidden="true" /> {tipo}</span>
        {href && <ArrowRight aria-hidden="true" />}
      </div>
      <Titulo id={tituloId}>{criacao.titulo}</Titulo>
      <p className="comunidade-contagem">por {criacao.autor}</p>
      <TextoDaPublicacao className="comunidade-resumo" texto={criacao.resumo} />
      {Object.keys(criacao.dados).length > 0 && (
        <div className="comunidade-carta-dados"><DadosDaCriacao dados={criacao.dados} /></div>
      )}
    </Carta>
  );
}
