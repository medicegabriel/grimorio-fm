import { ChevronDown } from "lucide-react";
import { dataNaTela } from "./data-na-tela";
import ListaDeNotas from "./ListaDeNotas";
import { NOVIDADES_ANTERIORES } from "./notas-anteriores";

/* Cada versão antiga chega recolhida, com a data à vista: são muitas, e a pessoa abre a que procura. O `details` já traz o
   teclado e o leitor de tela. A data do resumo é a da nota mais nova da versão. */
export default function HistoricoDeNovidades() {
  return (
    <div className="novidades-historico">
      {NOVIDADES_ANTERIORES.map(({ versao, titulo, notas }) => (
        <details key={versao}>
          <summary>
            <h3>
              {titulo} <span>Versão {versao}</span>
            </h3>
            <time dateTime={notas[0].data}>{dataNaTela(notas[0].data)}</time>
            <ChevronDown aria-hidden="true" />
          </summary>
          <ListaDeNotas notas={notas} />
        </details>
      ))}
    </div>
  );
}
