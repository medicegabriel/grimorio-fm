import { Suspense, useState } from "react";
import { ChevronDown } from "lucide-react";
import { telaSobDemanda } from "../../celular/sob-demanda";
import ListaDeNotas from "./ListaDeNotas";
import { NOVIDADES_RECENTES } from "./notas-recentes";
import "./novidades.css";

const HistoricoDeNovidades = telaSobDemanda(() => import("./HistoricoDeNovidades"));

export default function Novidades() {
  const [aberto, setAberto] = useState(false);

  return (
    <section id="novidades" className="central-novidades" aria-labelledby="titulo-novidades" tabIndex={-1}>
      <h2 id="titulo-novidades">Novidades</h2>

      {NOVIDADES_RECENTES.map(({ versao, titulo, notas }) => (
        <article className="novidades-versao" key={versao}>
          <h3>
            {titulo} <span>Versão {versao}</span>
          </h3>
          <ListaDeNotas notas={notas} />
        </article>
      ))}

      <button type="button" className="novidades-mais" aria-expanded={aberto} onClick={() => setAberto((antes) => !antes)}>
        {aberto ? "Ocultar Atualizações Anteriores" : "Ver Atualizações Anteriores"}
        <ChevronDown aria-hidden="true" />
      </button>

      {aberto && (
        <Suspense fallback={<p className="novidades-carregando" role="status">Carregando Atualizações…</p>}>
          <HistoricoDeNovidades />
        </Suspense>
      )}
    </section>
  );
}
