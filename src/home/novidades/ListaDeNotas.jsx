import { dataNaTela } from "./data-na-tela";

/* As notas de uma versão, iguais na aberta e na recolhida do histórico (2026-11-27). */
export default function ListaDeNotas({ notas }) {
  return (
    <ul className="novidades-notas">
      {notas.map(({ data, texto, onde }) => (
        <li key={data + texto}>
          <time dateTime={data}>{dataNaTela(data)}</time>
          <div>
            <p>{texto}</p>
            {onde && (
              <p className="novidades-onde">
                Onde: {onde.href ? <a href={onde.href}>{onde.rotulo}</a> : onde.rotulo}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
