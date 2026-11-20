/* O app de celular, etapa E6 (2026-11-20): o criador no telefone.

   1. As seções (`criador-celular/secoes.js`): a ordem, o Anterior e o Próxima dentro do grupo (principais ou Outros), e os quatro
      números da faixa de resumo.
   2. A origem pelo toque longo (`ui/fontes-toque.js`), com um documento de mentira: o grupo certo, só toque (nunca mouse), só
      dentro do criador, o clique do gesto engolido e o próximo toque livre.
   3. A camada de CSS (`criador-celular.css`): TODA regra começa em `[data-criador]`, então nada vaza para a Ficha, a lista ou a
      2.5.2. E as ligações no `AftyCreatureBuilder.jsx`. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const url = (p) => new URL(p, import.meta.url);
const lê = (p) => readFileSync(url(p), "utf8");
const S = await import(url("../src/systems/afty/criador-celular/secoes.js").href);
const T = await import(url("../src/systems/afty/ui/fontes-toque.js").href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. as seções ---------- */
const principais = [{ id: "identidade", label: "Identidade" }, { id: "pericias", label: "Perícias" }, { id: "habilidades", label: "Habilidades" }];
const outros = [{ id: "calculos", label: "Cálculos" }, { id: "votos", label: "Votos" }];
const L = S.listaDeSecoes(principais, outros);
t("ordem: principais e depois Outros", L.map((s) => `${s.grupo}:${s.id}`), ["principais:identidade", "principais:pericias", "principais:habilidades", "outros:calculos", "outros:votos"]);
const viz = (id) => { const v = S.vizinhas(L, id); return [v.anterior?.id ?? null, v.proxima?.id ?? null]; };
t("no meio", viz("pericias"), ["identidade", "habilidades"]);
t("na primeira não há anterior", viz("identidade"), [null, "pericias"]);
t("o fim das principais não cai no Outros", viz("habilidades"), ["pericias", null]);
t("o Outros anda entre si", [viz("calculos"), viz("votos")], [[null, "votos"], ["calculos", null]]);
t("seção que não existe", viz("aptidoes"), [null, null]);
t("lista vazia", S.listaDeSecoes(), []);
t("os números do resumo", S.numerosDoResumo({ hp: 194, pe: 28, defesa: 35, cd: 30, recursoLabel: "Estamina" }).map((n) => [n.k, n.v, n.p]),
  [["Vida", 194, "hp"], ["Estamina", 28, "pe"], ["Defesa", 35, "defesa"], ["CD", 30, "cd"]]);
t("o recurso sem rótulo é Energia", S.numerosDoResumo({}).map((n) => n.k)[1], "Energia");

/* ---------- 2. o toque longo ---------- */
/* Um DOM mínimo: elementos com classe, pai, `closest`, `querySelector` e `contains`, só o que o módulo usa. */
const no = (classes, pai = null, atributos = {}) => {
  const el = { classes: new Set(classes), pai, filhos: [], dataset: {}, atributos };
  if (pai) pai.filhos.push(el);
  const casa = (e, sel) => (sel.startsWith(".") ? e.classes.has(sel.slice(1)) : sel === "[data-criador]" ? "data-criador" in e.atributos : false);
  el.closest = (sel) => { for (let e = el; e; e = e.pai) if (casa(e, sel)) return e; return null; };
  el.querySelector = (sel) => { const pilha = [...el.filhos]; while (pilha.length) { const e = pilha.shift(); if (casa(e, sel)) return e; pilha.push(...e.filhos); } return null; };
  el.contains = (outro) => { for (let e = outro; e; e = e.pai) if (e === el) return true; return false; };
  Object.defineProperty(el, "parentElement", { get: () => el.pai });
  return el;
};
const raiz = no([], null, { "data-criador": "" });
const grupo = no(["group"], raiz);
const botao = no(["botao"], grupo);
no(["afty-fontes"], grupo);
const semFontes = no(["group"], raiz);
const botaoSemFontes = no(["botao"], semFontes);
const fora = no(["group"], null);
no(["afty-fontes"], fora);
const botaoFora = no(["botao"], fora);
t("acha o grupo dono do painel", T.grupoComFontes(botao) === grupo, true);
t("grupo sem painel, nada", T.grupoComFontes(botaoSemFontes), null);
t("fora do criador, nada", T.grupoComFontes(botaoFora), null);
t("o tempo do gesto é o do DESIGN.md", T.SEGURAR_MS, 450);

{
  const ouvintes = {};
  const documento = { addEventListener: (tipo, f) => { ouvintes[tipo] = f; }, removeEventListener: (tipo) => { delete ouvintes[tipo]; } };
  const relogios = [];
  const setTimeoutOriginal = globalThis.setTimeout;
  const clearTimeoutOriginal = globalThis.clearTimeout;
  globalThis.setTimeout = (f) => { relogios.push(f); return relogios.length; };
  globalThis.clearTimeout = (id) => { if (id) relogios[id - 1] = null; };
  const desligar = T.ligarFontesPorToque(documento);
  const disparaRelogio = () => { const f = relogios.pop(); if (f) f(); };
  let impedido = 0;
  const clique = { preventDefault: () => { impedido++; }, stopPropagation: () => {} };

  ouvintes.pointerdown({ pointerType: "mouse", target: botao, clientX: 0, clientY: 0 });
  t("o mouse não arma o gesto", relogios.filter(Boolean).length, 0);

  ouvintes.pointerdown({ pointerType: "touch", target: botao, clientX: 10, clientY: 10 });
  disparaRelogio();
  t("segurar abre o painel do grupo", grupo.dataset.fontesToque, "aberto");
  ouvintes.click(clique);
  t("o clique do gesto é engolido", impedido, 1);
  ouvintes.click(clique);
  t("só um clique", impedido, 1);

  ouvintes.pointerdown({ pointerType: "touch", target: botaoSemFontes, clientX: 0, clientY: 0 });
  t("o próximo toque fecha", grupo.dataset.fontesToque, undefined);

  ouvintes.pointerdown({ pointerType: "touch", target: botao, clientX: 10, clientY: 10 });
  disparaRelogio();
  ouvintes.pointerdown({ pointerType: "touch", target: botaoSemFontes, clientX: 0, clientY: 0 });
  ouvintes.click(clique);
  t("sem clique no gesto, o próximo toque não é engolido", impedido, 1);

  ouvintes.pointerdown({ pointerType: "touch", target: botao, clientX: 10, clientY: 10 });
  ouvintes.pointermove({ clientX: 40, clientY: 10 });
  disparaRelogio();
  t("arrastar (rolar) cancela", grupo.dataset.fontesToque, undefined);

  desligar();
  t("desligar tira todas as escutas", Object.keys(ouvintes), []);
  globalThis.setTimeout = setTimeoutOriginal;
  globalThis.clearTimeout = clearTimeoutOriginal;
}

/* ---------- 3. o CSS e as ligações ---------- */
const CSS = lê("../src/systems/afty/criador-celular/criador-celular.css").replace(/\/\*[\s\S]*?\*\//g, "");
const separaNoTopo = (texto) => {
  const partes = [];
  let fundo = 0;
  let atual = "";
  for (const c of texto) {
    if (c === "(" || c === "[") fundo++;
    if (c === ")" || c === "]") fundo--;
    if (c === "," && fundo === 0) { partes.push(atual.trim()); atual = ""; } else atual += c;
  }
  if (atual.trim()) partes.push(atual.trim());
  return partes;
};
const seletores = [...CSS.matchAll(/([^{};]+)\{/g)].map((m) => m[1].trim()).filter((s) => !s.startsWith("@")).flatMap(separaNoTopo);
t("o CSS tem regras", seletores.length > 10, true);
t("toda regra começa em [data-criador]", seletores.filter((s) => !s.startsWith("[data-criador]")), []);
const noTopo = [];
{
  let fundo = 0;
  let cabeca = "";
  for (const c of CSS) {
    if (c === "{") { if (fundo === 0 && !cabeca.trim().startsWith("@")) noTopo.push(cabeca.trim()); fundo++; cabeca = ""; } else if (c === "}") { fundo--; cabeca = ""; } else cabeca += c;
  }
}
t("nenhuma regra fora de uma largura de celular ou da trava do iPhone", noTopo, []);
t("o texto miúdo sobe para 12 e o rótulo para 11", [/\.text-\\\[10px\\\][^{]*\)\s*\{\s*font-size: 12px/.test(CSS), /\.uppercase\s*\{\s*font-size: 11px/.test(CSS)], [true, true]);
t("os controles de toque com 36 px", /\(pointer: coarse\)[\s\S]*min-height: 36px/.test(CSS), true);
t("o campo de 16 px só no iPhone", /@supports \(-webkit-touch-callout: none\)[\s\S]*font-size: 16px/.test(CSS), true);
t("o painel do toque longo vence o hidden", CSS.includes("[data-criador] .group[data-fontes-toque] .afty-fontes { display: block; }"), true);

const B = lê("../src/systems/afty/AftyCreatureBuilder.jsx");
t("a raiz do criador é [data-criador]", B.includes('<div data-criador="" className="min-h-screen'), true);
t("o cabeçalho, a faixa de abas e a prévia somem no celular", (B.match(/max-\[720px\]:hidden/g) ?? []).length, 3);
t("as peças do celular entram no cabeçalho", [B.includes("<CabecalhoCelular"), B.includes("<ResumoDoCriador"), B.includes("previa={<AftyPreview draft={draft} derived={derived} />}")], [true, true, true]);
t("as seções do celular são as da faixa (sem a Aptidões do Restringido)", B.includes('listaDeSecoes(abasPrincipais.filter((t) => !(t.id === "aptidoes" && semEnergia)), abasOutros)'), true);
const CAB = lê("../src/systems/afty/criador-celular/CabecalhoCelular.jsx");
const RES = lê("../src/systems/afty/criador-celular/ResumoDoCriador.jsx");
const NAV = lê("../src/systems/afty/criador-celular/NavegadorDeSecoes.jsx");
t("as peças só aparecem até 720 px", [CAB, RES].map((s) => s.includes("min-[721px]:hidden")), [true, true]);
t("o cabeçalho liga o toque longo", CAB.includes("useEffect(() => ligarFontesPorToque(), [])"), true);
t("o título e o rascunho vão para a folha das seções", [CAB.includes("titulo={titulo}"), CAB.includes("rodape={rascunho}")], [true, true]);
t("sem travessão", [CAB, RES, NAV, CSS, lê("../src/systems/afty/criador-celular/secoes.js"), lê("../src/systems/afty/ui/fontes-toque.js")].some((s) => new RegExp("\\u2014").test(s)), false);

/* ---------- 4. a Carteira no celular (autor, 2026-11-20: "o Addon de carteira no era de ouro está sendo coberto") ---------- */
const CART_CSS = lê("../src/systems/afty/AftyTabCarteira.css");
const CART = lê("../src/systems/afty/AftyTabCarteira.jsx");
t("a faixa de totais fica em três colunas com o card estreito", /@container carteira \(max-width: 34\.999rem\)\s*\{\s*\.faixa-carteira__grade\s*\{\s*grid-template-columns: repeat\(3/.test(CART_CSS), true);
t("o valor quebra no espaço, nunca some", /> :last-child\s*\{[^}]*white-space: normal/.test(CART_CSS), true);
t("as linhas têm os ganchos do celular", [CART.includes('GRADE_ENTRADA = "carteira-grade-entrada '), CART.includes('GRADE_GASTO = "carteira-grade-gasto ')], [true, true]);
const linhasNoCelular = CART_CSS.slice(CART_CSS.indexOf("AS LINHAS NO CELULAR"));
t("no celular a sessão vira duas linhas, o nome em cima", [/@media \(max-width: 720px\)/.test(linhasNoCelular), linhasNoCelular.includes(".carteira-grade-entrada > :nth-child(2) { grid-area: 1 / 2 / 2 / 6; }"), (linhasNoCelular.match(/\.carteira-grade-entrada > :nth-child\(\d\)/g) ?? []).length], [true, true, 7]);
t("e o gasto também", (linhasNoCelular.match(/\.carteira-grade-gasto > :nth-child\(\d\)/g) ?? []).length, 6);

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
