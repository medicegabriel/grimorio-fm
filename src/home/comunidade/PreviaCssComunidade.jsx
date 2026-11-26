import { useDeferredValue, useState } from "react";
import { documentoDaFicha, SECOES_EXEMPLO } from "./ficha-exemplo-comunidade";
import CSS_EXEMPLO from "./dehya-exemplo.css?raw";

const FACES_DEHYA = ["Sekhmet", "Hator"];

export default function PreviaCssComunidade({ css }) {
  const cssAtual = useDeferredValue(css);
  const [comTema, setComTema] = useState(true);
  const [face, setFace] = useState(1);
  const [secao, setSecao] = useState("resumo");
  const rotuloDoTema = css ? "Com Tema" : "Com Tema · Dehya";
  const amostraComTema = cssAtual ? documentoDaFicha(secao, cssAtual) : documentoDaFicha(secao, CSS_EXEMPLO, face);
  return (
    <section className="comunidade-comparacao" aria-label="Prévia do CSS em uma ficha de nível 10" data-com-tema={comTema}>
      <h2>Ficha de Exemplo · Nível 10</h2>
      <div className="comunidade-filtros comunidade-alternar-tema" role="group" aria-label="Versão da Ficha">
        <button type="button" aria-pressed={!comTema} onClick={() => setComTema(false)}>Sem Tema</button>
        <button type="button" aria-pressed={comTema} onClick={() => setComTema(true)}>{rotuloDoTema}</button>
      </div>
      <div className="comunidade-controles-previa">
        <div className="comunidade-filtros" role="group" aria-label="Seções da ficha de exemplo">
          {Object.entries(SECOES_EXEMPLO).map(([id, nome]) => (
            <button key={id} type="button" aria-pressed={secao === id} onClick={() => setSecao(id)}>{nome}</button>
          ))}
        </div>
        {!css && (
          <div className="comunidade-filtros comunidade-faces-previa" role="group" aria-label="Faces do tema Dehya">
            {FACES_DEHYA.map((nome, indice) => (
              <button key={nome} type="button" aria-pressed={face === indice + 1} onClick={() => setFace(indice + 1)}>{nome}</button>
            ))}
          </div>
        )}
      </div>
      <div className="comunidade-amostras">
        <figure data-ativo={!comTema}>
          <figcaption>Sem Tema</figcaption>
          <iframe sandbox="" title={`Ficha sem tema: ${SECOES_EXEMPLO[secao]}`} srcDoc={documentoDaFicha(secao)} />
        </figure>
        <figure data-ativo={comTema}>
          <figcaption>{rotuloDoTema}</figcaption>
          <iframe sandbox="" title={`Ficha com tema: ${SECOES_EXEMPLO[secao]}`} srcDoc={amostraComTema} />
        </figure>
      </div>
    </section>
  );
}
