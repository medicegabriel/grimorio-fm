import Carregando from "./Carregando";

/* O esqueleto da lista no React (2026-11-26, fila "Carregamento").

   ⚠ A MESMA MARCAÇÃO DO index.html. O `#root` de lá já nasce com este desenho, e o `createRoot` o troca por este componente:
   se um mudar sem o outro, a troca pisca. O `asserts/t-app-rotas.mjs` compara os dois. O CSS (`fm-esq-*`) mora só no
   <head> do index.html, e quem escolhe o desenho é o script de lá, pelos atributos `data-fm-*`. Nada aqui repete a escolha.

   São formas paradas (D-90 a D-92), escondidas do leitor de tela, e um aviso só para ele. Nada usa `<header>`, `<h1>`, `<h2>`
   ou `role="button"`: a lista de verdade é reconhecida por eles. */

const ICONES = {
  menu: "M4 12h16M4 6h16M4 18h16",
  encontros: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2",
  modelos: "m16 6 4 14M12 6v14M8 8v12M4 4v16",
  importar: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  exportar: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  novo: "M5 12h14M12 5v14",
  busca: "M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0zM21 21l-4.3-4.3",
  filtro: "M22 3H2l8 9.46V19l4 2v-8.54z",
  selecionar: "m9 11 3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  livro: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  inicio: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  jogador: "M7 8a5 5 0 1 0 10 0a5 5 0 1 0-10 0zM20 21a8 8 0 0 0-16 0",
  criatura: "M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z",
  salas: "M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z",
  livros: "M4 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM7 3v18M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z",
  comunidade: "M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5ZM18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1",
  catarse: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7ZM12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66M18 15l-2-2M15 18l-2-2",
};

const Icone = ({ nome }) => (
  <svg className="fm-esq-i" viewBox="0 0 24 24"><path d={ICONES[nome]}></path></svg>
);

const SECOES = [
  [["inicio", "Início"], ["jogador", "Jogador"], ["criatura", "Criatura"], ["encontros", "Encontros"]],
  [["salas", "Salas"], ["livros", "Livros e Regras"], ["comunidade", "Comunidade"], ["catarse", "Catarse"]],
];

const CARDS = Array.from({ length: 12 }, (_, i) => i);

function Barra() {
  return (
    <div className="fm-esq-barra" aria-hidden="true">
      <div className="fm-esq-marca">
        <Icone nome="livro" />
        <div>fichafm<span>.com.br</span><small>Feiticeiros &amp; Maldições</small></div>
      </div>
      <div className="fm-esq-menu"><Icone nome="menu" />Menu</div>
      <div className="fm-esq-nav">
        {SECOES.map((secao) => (
          <div className="fm-esq-grupo" key={secao[0][0]}>
            {secao.map(([id, rotulo]) => (
              <div className={`fm-esq-link fm-esq-l-${id}`} key={id}><Icone nome={id} />{rotulo}</div>
            ))}
          </div>
        ))}
      </div>
      <div className="fm-esq-conta"></div>
    </div>
  );
}

function Painel() {
  return (
    <div className="fm-esq-painel" aria-hidden="true">
      <div className="fm-esq-topo">
        <div className="fm-esq-caixa">
          <div className="fm-esq-linha">
            <div className="fm-esq-botao fm-esq-pastas-abrir"><Icone nome="menu" /></div>
            <div className="fm-esq-titulo">
              <span className="fm-esq-t fm-esq-t-jogador">Jogador</span>
              <span className="fm-esq-t fm-esq-t-criatura">Criatura</span>
              <span className="fm-esq-t fm-esq-t-grimorio">Grimório</span>
              <span className="fm-esq-t fm-esq-t-eclesiastes">Eclesiastes</span>
              <span className="fm-esq-t fm-esq-t-guilda">Era de Ouro</span>
            </div>
            <div className="fm-esq-vao"></div>
            <div className="fm-esq-botao fm-esq-sala"><Icone nome="salas" /><span className="fm-esq-rotulo">Sala</span></div>
            <div className="fm-esq-botao fm-esq-conta-topo"><i></i></div>
            <div className="fm-esq-botao"><Icone nome="encontros" /><span className="fm-esq-rotulo">Encontros</span></div>
            <div className="fm-esq-botao"><Icone nome="modelos" /><span className="fm-esq-rotulo">Modelos</span></div>
            <div className="fm-esq-botao"><Icone nome="importar" /><span className="fm-esq-rotulo">Importar</span></div>
            <div className="fm-esq-botao"><Icone nome="exportar" /><span className="fm-esq-rotulo">Exportar</span></div>
            <div className="fm-esq-botao fm-esq-novo">
              <Icone nome="novo" />
              <span className="fm-esq-rotulo">
                <span className="fm-esq-n fm-esq-n-personagem">Novo Personagem</span>
                <span className="fm-esq-n fm-esq-n-criatura">Nova Criatura</span>
                <span className="fm-esq-n fm-esq-n-ficha">Nova Ficha</span>
              </span>
            </div>
          </div>
          <div className="fm-esq-medidor"><i></i><i></i><i></i></div>
        </div>
      </div>
      <div className="fm-esq-corpo">
        <div className="fm-esq-pastas"><i></i><i></i><i></i><i></i></div>
        <div>
          <div className="fm-esq-cabecalho">
            <div className="fm-esq-h2"><i></i></div>
            <div className="fm-esq-contagem"><i></i></div>
            <div className="fm-esq-ferramentas">
              <div className="fm-esq-tudo"><b></b>Selecionar tudo</div>
              <div className="fm-esq-busca-linha">
                <div className="fm-esq-busca"><Icone nome="busca" />Buscar...</div>
                <div className="fm-esq-quadrado"><Icone nome="filtro" /></div>
                <div className="fm-esq-quadrado fm-esq-selecionar"><Icone nome="selecionar" /><span className="fm-esq-rotulo-xl">Selecionar</span></div>
              </div>
            </div>
          </div>
          <div className="fm-esq-cards">
            {CARDS.map((i) => (
              <div className="fm-esq-card" key={i}><i></i><div><i></i><i></i><i></i></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A tela de abertura inteira, igual à do `#root` do index.html. */
export function Esqueleto() {
  return (
    <div className="fm-esq fm-esq-abertura" aria-busy="true">
      <div className="fm-esq-voz" role="status">
        <span className="fm-esq-voz-lista">Carregando Fichas</span>
        <span className="fm-esq-voz-neutro">Carregando</span>
      </div>
      <Barra />
      <Painel />
    </div>
  );
}

/** O fallback do `src/main.jsx`. Sem a marca do script no <html> (a Sala, a Guilda no celular), fica o Carregando. */
export default function EsqueletoDeAbertura() {
  if (typeof document === "undefined" || !document.documentElement.hasAttribute("data-fm-esq")) return <Carregando />;
  return <Esqueleto />;
}

/** Só o painel da lista de Criatura, para a espera do compêndio dentro do App, que já desenhou a barra do site. */
export function EsqueletoDoCompendio() {
  return (
    <div className="fm-esq fm-esq-no-app" data-fm-rota="criatura" data-fm-paleta="central" data-fm-card="alto" aria-busy="true">
      <div className="fm-esq-voz" role="status">Carregando Fichas</div>
      <Painel />
    </div>
  );
}
