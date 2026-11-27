import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, ArrowRight, ArrowUpRight, DoorOpen, Ghost, Swords, UserRound,
} from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { telaSobDemanda } from "../celular/sob-demanda";
import { preCarregarQuandoOcioso } from "../celular/pre-carga";
import { PDF_DOCS } from "../components/fm-docs";
import { codigoDoTexto } from "../nuvem/sala-ui/sala-ui-dados";
import { caminhoDe, guardarOrigemDaSala } from "../systems/afty/encontros/rota-encontros";
import BarraLateralSite from "./BarraLateralSite";
import "./central-de-jogo.css";

const Comunidade = telaSobDemanda(() => import("./comunidade/Comunidade"));

const ATALHOS = [
  { titulo: "Jogador", detalhe: "Minhas Fichas", href: caminhoDe("player", { name: "dashboard" }), Icone: UserRound },
  { titulo: "Criatura", detalhe: "Criador e Compêndio", href: caminhoDe(null, { name: "dashboard" }), Icone: Ghost },
  { titulo: "Encontros", detalhe: "Preparar um Encontro", href: caminhoDe(null, { name: "encounters" }), Icone: Swords },
];

export default function CentralDeJogo({ comunidade = false }) {
  return (
    <div className="central-de-jogo fichafm-tema">
      <a className="central-pular" href="#conteudo-central">Ir para o Conteúdo</a>
      <BarraLateralSite atual={comunidade ? "comunidade" : "inicio"} />

      <main id="conteudo-central" className="central-conteudo" tabIndex={-1}>
        {comunidade ? <Comunidade /> : <Inicio />}
      </main>
      <Analytics />
    </div>
  );
}

function Inicio() {
  /* Os atalhos recarregam a página, e o `/` não baixa o App. No ocioso, os arquivos dele descem SEM executar (`pre-carga.js`):
     um `import()` aqui penduraria na Central o CSS global do App (2026-11-26, fila "Carregamento"). */
  useEffect(() => preCarregarQuandoOcioso("app"), []);
  return (
    <>
      <h1>Fichas e Mesas</h1>
      <nav className="central-atalhos" aria-label="Ferramentas de Jogo">
        {ATALHOS.map(({ titulo, detalhe, href, Icone }) => (
          <a className="central-atalho" href={href} key={href}>
            <Icone aria-hidden="true" />
            <ArrowRight className="central-seta-atalho" aria-hidden="true" />
            <span><strong>{titulo}</strong><small>{detalhe}</small></span>
          </a>
        ))}
      </nav>

      <EntradaNaSala />

      <section id="livros-e-regras" className="central-livros" aria-labelledby="titulo-livros" tabIndex={-1}>
        <h2 id="titulo-livros">Livros e Regras</h2>
        <ul>
          {[...PDF_DOCS].reverse().map(({ id, label, file }) => (
            <li key={id}>
              <a href={encodeURI(file)} target="_blank" rel="noreferrer">
                {label} <ArrowUpRight aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function EntradaNaSala() {
  const [invalido, setInvalido] = useState(false);
  const campo = useRef(null);

  function entrar(evento) {
    evento.preventDefault();
    const codigo = codigoDoTexto(campo.current.value);
    if (!codigo) {
      setInvalido(true);
      campo.current.focus();
      return;
    }
    guardarOrigemDaSala(codigo, "/");
    location.assign(`/Sala/${codigo}`);
  }

  return (
    <section id="salas" className="central-sala" aria-labelledby="titulo-sala" tabIndex={-1}>
      <h2 id="titulo-sala"><DoorOpen aria-hidden="true" /> Entrar em uma Sala</h2>
      <form onSubmit={entrar}>
        <div className="central-campo-sala">
          <label htmlFor="codigo-da-sala">Código ou Link da Sala</label>
          <input
            id="codigo-da-sala"
            ref={campo}
            name="codigo"
            placeholder="Ex. K7QX2M"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={invalido || undefined}
            aria-describedby={invalido ? "erro-sala" : undefined}
            onChange={() => setInvalido(false)}
          />
        </div>
        <button type="submit">Continuar <ArrowRight aria-hidden="true" /></button>
      </form>
      {invalido && (
        <p id="erro-sala" className="central-erro-sala" role="alert"><AlertTriangle aria-hidden="true" /> Código ou Link Inválido</p>
      )}
    </section>
  );
}
