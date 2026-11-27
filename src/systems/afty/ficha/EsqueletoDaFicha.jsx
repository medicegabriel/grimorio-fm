import "./esqueleto-ficha.css";

/* O esqueleto da Ficha G2 enquanto ela e o motor chegam (2026-11-26, fila "Carregamento"): o cabeçalho e a linha das abas,
   com as medidas da Ficha no tema Padrão (esqueleto-ficha.css). É carregamento, e não regra: serve à criatura e ao
   personagem.

   Formas paradas (D-90 a D-92), escondidas do leitor de tela, e um aviso só para ele. Sem `id="afty-ficha"` nem
   `role="tablist"`: é por eles que a Ficha de verdade é reconhecida. */

const RECURSOS = ["pv", "pe", "alma", "preparo"];

export default function EsqueletoDaFicha() {
  return (
    <div className="afty-esq" aria-busy="true">
      <div className="afty-esq-voz" role="status">Carregando Ficha</div>
      <div className="afty-esq-cabecalho" aria-hidden="true">
        <div className="afty-esq-pagina">
          <div className="afty-esq-placa">
            <i className="afty-esq-voltar"></i>
            <i className="afty-esq-retrato"></i>
            <div className="afty-esq-nome"><i></i><i></i></div>
            <div className="afty-esq-controles"><i></i><i></i><i></i></div>
            <div className="afty-esq-recursos">
              {RECURSOS.map((r) => (
                <div key={r} data-recurso={r}><i></i><i></i><i></i></div>
              ))}
            </div>
            <div className="afty-esq-valores"><i></i><i></i><i></i><i></i><i></i></div>
            <div className="afty-esq-agora"><i></i><i></i><i></i></div>
          </div>
          <div className="afty-esq-linha">
            <div className="afty-esq-abas"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <i className="afty-esq-rolagens"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
