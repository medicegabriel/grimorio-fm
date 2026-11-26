export const SECOES_EXEMPLO = {
  resumo: "Visão Geral",
  acoes: "Ações",
  habilidades: "Habilidades",
  pericias: "Perícias",
  equipamentos: "Equipamentos",
  efeitos: "Efeitos",
};

const VITAIS = [
  ["pv", "PV", 72, 84],
  ["pe", "PE", 48, 60],
  ["alma", "Alma", 30, 36],
];

const ATRIBUTOS = [
  ["forca", "Força", 12, "+1"],
  ["destreza", "Destreza", 16, "+3"],
  ["constituicao", "Constituição", 16, "+3"],
  ["inteligencia", "Inteligência", 20, "+5"],
  ["sabedoria", "Sabedoria", 14, "+2"],
  ["presenca", "Presença", 12, "+1"],
];

function cartao(titulo, corpo) {
  return `<section class="afty-card previa-cartao"><h2 class="afty-card-titulo">${titulo}</h2>${corpo}</section>`;
}

function linhas(itens) {
  return `<dl class="previa-linhas">${itens.map(([nome, valor, detalhe]) => `
    <div class="afty-linha">
      <dt><strong class="afty-rotulo">${nome}</strong>${detalhe ? `<small class="afty-texto">${detalhe}</small>` : ""}</dt>
      <dd class="afty-valor">${valor}</dd>
    </div>`).join("")}</dl>`;
}

const CONTEUDO = {
  resumo: [
    cartao("Atributos", `<dl class="previa-grade">${ATRIBUTOS.map(([id, nome, valor, mod]) => `
      <div class="afty-atributo" data-afty-atributo="${id}">
        <dt class="afty-atributo-rotulo">${nome}</dt>
        <dd><strong class="afty-atributo-valor">${valor}</strong><span class="afty-valor">${mod}</span></dd>
      </div>`).join("")}</dl>`),
    cartao("Testes de Resistência", linhas([
      ["Fortitude", "+9", "Constituição"],
      ["Reflexos", "+9", "Destreza"],
      ["Vontade", "+11", "Sabedoria"],
    ])),
    cartao("Resistências por Tipo de Dano", linhas([
      ["Cortante", "RD 3"],
      ["Impacto", "RD 2"],
    ])),
  ].join(""),
  acoes: [
    cartao("Ataques", linhas([
      ["Bastão Reforçado", "1d8+3", "Corpo a corpo · Impacto"],
      ["Adaga de Reserva", "1d4+3", "Corpo a corpo · Perfurante"],
    ])),
    cartao("Feitiços", linhas([
      ["Lâmina de Energia", "4 PE", "Nível 2 · Ação Comum · Alcance 12 m"],
      ["Barreira de Contenção", "3 PE", "Nível 1 · Reação · Alcance 6 m"],
      ["Selo de Imobilização", "6 PE", "Nível 3 · Ação Comum · Alcance 9 m"],
    ])),
  ].join(""),
  habilidades: [
    cartao("Habilidades de Especialização", linhas([
      ["Canalização Precisa", "Passiva", "Especialização · Conjurador"],
      ["Fluxo de Energia", "Reação", "Especialização · Manipulação de energia"],
      ["Reserva de Energia", "Passiva", "Especialização · Recuperação"],
    ])),
    cartao("Talentos", linhas([
      ["Iniciativa Aprimorada", "Passivo"],
      ["Perito em Feitiçaria", "Passivo"],
    ])),
  ].join(""),
  pericias: cartao("Perícias", linhas([
    ["Feitiçaria", "+12", "Inteligência"],
    ["Ocultismo", "+12", "Inteligência"],
    ["Percepção", "+9", "Sabedoria"],
    ["Investigação", "+9", "Inteligência"],
    ["Acrobacia", "+7", "Destreza"],
    ["Furtividade", "+7", "Destreza"],
    ["Intuição", "+6", "Sabedoria"],
    ["Atletismo", "+5", "Força"],
  ])),
  equipamentos: [
    cartao("Equipados", linhas([
      ["Bastão Reforçado", "1", "Arma · Mão principal"],
      ["Casaco Reforçado", "1", "Proteção · Vestimenta"],
      ["Talismã de Foco", "1", "Acessório"],
    ])),
    cartao("Inventário", linhas([
      ["Adaga de Reserva", "1", "Arma"],
      ["Kit de Primeiros Socorros", "1", "Ferramenta"],
      ["Selos de Papel", "5", "Consumível"],
    ])),
  ].join(""),
  efeitos: [
    cartao("Efeitos Ativos", `<ul class="previa-linhas">
      <li class="afty-linha afty-efeito" aria-current="true">
        <div><strong class="afty-rotulo">Barreira de Contenção</strong><small class="afty-texto">Proteção · 1 rodada restante</small></div>
        <span class="afty-chip" data-afty-tom="destaque">Ativo</span>
      </li>
    </ul>`),
    cartao("Condições", `<p class="afty-vazio">Nenhuma condição ativa</p>`),
  ].join(""),
};

const VITAIS_HTML = VITAIS.map(([id, rotulo, atual, maximo]) => `
  <div class="afty-vital" data-afty-vital="${id}">
    <dt class="afty-vital-rotulo">${rotulo}</dt>
    <dd><span class="afty-vital-numero">${atual}</span><small> / ${maximo}</small>
      <span class="afty-vital-trilho" aria-hidden="true">
        <span class="afty-vital-barra" style="width: ${atual / maximo * 100}%"></span>
      </span>
    </dd>
  </div>`).join("");

const ESTATISTICAS_HTML = [
  ["defesa", "Defesa", "22"],
  ["cd", "CD", "21"],
  ["rd", "RD", "3"],
  ["atencao", "Atenção", "18"],
  ["iniciativa", "Iniciativa", "+8"],
  ["deslocamento", "Deslocamento", "9 m"],
].map(([id, rotulo, valor]) => `
  <div class="afty-stat" data-afty-stat="${id}">
    <dt class="afty-stat-rotulo">${rotulo}</dt><dd class="afty-stat-valor">${valor}</dd>
  </div>`).join("");

const CSS_PADRAO = `
  * { box-sizing: border-box }
  :root { color-scheme: dark }
  body { margin: 0; padding: 9px; background: #0b0c15; font: 14px/1.4 system-ui, sans-serif }
  .afty-ficha {
    --afty-fundo: #0f172a; --afty-card: #1e293b; --afty-poco: #10182a; --afty-borda: #3c4c6b;
    --afty-texto: #f1f5f9; --afty-texto-suave: #c1cce1; --afty-destaque: #cda5ff;
    --afty-pv: #f87171; --afty-pe: #60a5fa; --afty-alma: #c084fc;
    display: grid; align-content: start; gap: 10px; min-height: calc(100vh - 18px);
    position: relative; isolation: isolate; overflow: clip; padding: 12px;
    border: 1px solid var(--afty-borda); border-radius: 10px;
    color: var(--afty-texto); background: var(--afty-fundo)
  }
  .afty-ficha[data-afty-face] { contain: paint; font-family: var(--afty-fonte, inherit) }
  .afty-ficha[data-afty-face]::before { content: ""; position: absolute; pointer-events: none }
  .afty-ficha > * { position: relative; z-index: 1; min-width: 0 }
  p, dl, dd, h1, h2, ul { margin: 0 }
  p, dt { color: var(--afty-texto-suave); overflow-wrap: anywhere }
  dd { font-weight: 700; font-variant-numeric: tabular-nums }
  small { display: block; color: var(--afty-texto-suave); font-size: 11px; font-weight: 400 }
  .afty-placa { display: grid; gap: 10px; padding: 10px;
    background: var(--afty-card); border: 1px solid var(--afty-borda); border-radius: 8px }
  .previa-identidade { display: flex; gap: 11px; align-items: center }
  .afty-nome { font-size: 21px; line-height: 1.2; overflow-wrap: anywhere }
  .previa-identidade p { margin-top: 3px; font-size: 12px }
  .afty-retrato { display: grid; place-items: center; flex: none; width: 42px; height: 44px;
    border-radius: 7px; color: var(--afty-destaque); background: var(--afty-poco); font-weight: 700 }
  .afty-vitais, .previa-grade { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px }
  .afty-vital, .afty-atributo { min-width: 0; padding: 5px; border: 1px solid var(--afty-borda);
    border-radius: 6px; background: var(--afty-card) }
  .afty-vital dt, .afty-stat dt, .afty-atributo dt { font-size: 11px }
  .afty-vital small { display: inline }
  .afty-vital[data-afty-vital="pv"] { --afty-vital-cor: var(--afty-pv) }
  .afty-vital[data-afty-vital="pe"] { --afty-vital-cor: var(--afty-pe) }
  .afty-vital[data-afty-vital="alma"] { --afty-vital-cor: var(--afty-alma) }
  .afty-vital-trilho, .afty-vital-barra { display: block; height: 4px; border-radius: 8px }
  .afty-vital-trilho { margin-top: 5px; background: var(--afty-poco) }
  .afty-vital-barra { background: var(--afty-vital-cor) }
  .afty-stat, .afty-atributo { display: grid; gap: 3px; align-content: start }
  .afty-stat { padding: 3px 5px }
  .afty-atributo dd { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 7px }
  .afty-atributo-valor { font-size: 16px }
  .afty-atributo .afty-valor { color: var(--afty-destaque); font-size: 11px }
  .previa-cartao { padding: 9px; border: 1px solid var(--afty-borda); border-radius: 8px; background: var(--afty-card) }
  .afty-card-titulo { margin-bottom: 7px; color: var(--afty-destaque); font-size: 13px }
  .previa-linhas { padding: 0; list-style: none }
  .previa-linhas > .afty-linha { display: flex; justify-content: space-between; align-items: baseline;
    gap: 8px; min-width: 0; padding: 5px 2px; font-size: 12px }
  .previa-linhas > .afty-linha + .afty-linha { border-top: 1px solid var(--afty-borda) }
  .previa-linhas .afty-rotulo { color: var(--afty-texto); overflow-wrap: anywhere }
  .previa-linhas :is(dd, .afty-chip) { flex: none; text-align: right }
  .afty-chip { padding: 2px 6px; border: 1px solid var(--afty-borda); border-radius: 6px }
  .afty-vazio { font-size: 12px }
  @media (max-width: 310px) {
    .previa-grade { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  }
`;

export function documentoDaFicha(secao, css = "", face) {
  // CSS público só entra em um documento sem scripts, acesso à origem ou rede.
  const seguroParaHtml = css.replaceAll("<", "\\3c ");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${CSS_PADRAO}\n@scope (#afty-ficha) {\n${seguroParaHtml}\n}</style>
    </head><body>
      <article class="afty-ficha e-ficha-g2" id="afty-ficha"${face ? ` data-afty-face="${face}"` : ""}>
        <header class="afty-cabecalho afty-placa">
          <div class="previa-identidade">
            <div class="afty-retrato" aria-hidden="true">RM</div>
            <div><h1 class="afty-nome">Rei Mori</h1><p>Conjurador · Nível 10</p></div>
          </div>
          <dl class="afty-vitais">${VITAIS_HTML}</dl>
          <dl class="afty-stats previa-grade">${ESTATISTICAS_HTML}</dl>
        </header>
        ${CONTEUDO[secao]}
      </article>
    </body></html>`;
}
