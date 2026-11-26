/* ROLAR NA FICHA DE CRIATURA DA 2.5.2 (2026-11-23).

   Feedback do lançamento: "pra criatura tem que copiar e girar em outro lugar". A ficha da 2.5.2 ganhou a prop opcional
   `onRolar` (exceção de Forma 1, AGENTS.md seção 6): ela só manda o PEDIDO, e quem rola é `rolagem-252.js`. Este arquivo
   prende três coisas:
     1. a leitura da notação (`gruposDaNotacao`) e a rolagem do pedido, com um sorteio fixo;
     2. que sem `onRolar` a ficha da 2.5.2 não ganha botão nenhum (o padrão de hoje fica preservado);
     3. que o `/` carrega a casca com rolagem e o Encontro rola no próprio painel. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { gruposDaNotacao, rolarPedido252 } = await import(R + "ui/rolagem-252.js");
const { textoDaRolagem } = await import(R + "ficha/ficha-rolagem.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const lê = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");

/* 1. A notação. */
t("NdN+N, o formato das Criaturas Base", gruposDaNotacao("4d10+26"), { grupos: [{ dados: 4, faces: 10 }], fixo: 26 });
t("NdN sozinho", gruposDaNotacao("7d8"), { grupos: [{ dados: 7, faces: 8 }], fixo: 0 });
t("grupos somados e fixo negativo", gruposDaNotacao("2d6 + 1d8 - 3"), { grupos: [{ dados: 2, faces: 6 }, { dados: 1, faces: 8 }], fixo: -3 });
t("d6 vale 1d6", gruposDaNotacao("d6+1"), { grupos: [{ dados: 1, faces: 6 }], fixo: 1 });
t("texto que não é notação", gruposDaNotacao("metade do dano"), null);
t("só número não rola", gruposDaNotacao("12"), null);
t("dado subtraído não é aceito", gruposDaNotacao("2d6-1d4"), null);
t("vazio", gruposDaNotacao(""), null);

/* O sorteio fixo: 0,5 dá o dado do meio de cima (d10 -> 6, d20 -> 11). */
const meio = () => 0.5;
const dano = rolarPedido252({ tipo: "dano", rotulo: "Sopro Carbonizador · Dano", notacao: "4d10+26" }, {}, meio);
t("o dano rola 4d10 e soma o fixo", [dano.dados, dano.fixo, dano.total], [[6, 6, 6, 6], 26, 50]);
t("e mostra a notação da ficha", dano.formula, "4d10+26");
t("e o texto curto de sempre", textoDaRolagem(dano), "24 + 26");

const tr = rolarPedido252({ tipo: "teste", rotulo: "Fortitude", bonus: 37, margem: 18 }, {}, meio);
t("o teste soma o bônus ao d20", [tr.natural, tr.total, tr.formula], [11, 48, "d20+37"]);
const crit = rolarPedido252({ tipo: "teste", rotulo: "Fortitude", bonus: 37, margem: 18 }, {}, () => 0.9);
t("a margem de crítico da ficha vale (18 com margem 18)", [crit.natural, crit.critico], [19, true]);
const van = rolarPedido252({ tipo: "teste", rotulo: "Reflexos", bonus: 1 }, { modo: "vantagem" }, (() => { const s = [0.1, 0.8]; return () => s.shift(); })());
t("a Vantagem fica com o maior d20", [van.d20, van.natural], [[3, 17], 17]);
t("pedido sem rótulo não rola", rolarPedido252({ tipo: "teste", bonus: 2 }), null);
t("dano com notação ruim não rola", rolarPedido252({ tipo: "dano", rotulo: "X", notacao: "especial" }), null);

/* 2. Sem `onRolar`, a ficha da 2.5.2 é a de sempre. */
const PAINEL = lê("../src/components/CombatantPanel.jsx");
t("o painel recebe onRolar como prop opcional", PAINEL.includes("  isTrackerMode = false, onRolar "), true);
t("o pedido de teste só existe com onRolar", PAINEL.includes("const pedeTeste = onRolar ? "), true);
t("o Rolar Acerto só aparece com onRolar", PAINEL.includes("{onRolar && <RolarAcerto "), true);
t("o Rolar do dano só aparece com onRolar", PAINEL.includes("{onRolar && <RolarDano "), true);
t("o bloco de stat só vira botão com onClick", PAINEL.includes("const Rolavel = ({ onClick, children }) => (onClick ? ("), true);
t("o StatBlock da 2.5.2 segue intocado",
  PAINEL.includes("const StatBlock = ({ icon: Icon, label, value, sublabel, accent = 'text-slate-300', modified = false }) => ("), true);
t("o chip de Perícia só vira botão com onRolar", PAINEL.includes("const Chip = pedeTeste ? 'button' : 'span';"), true);
const TRACKER = lê("../src/components/CombatTracker.jsx");
t("o CombatTracker só repassa", [TRACKER.includes("onExit, onRolar })"), TRACKER.includes("onRolar={onRolar}")], [true, true]);

/* 3. Quem passa a prop. */
const APP = lê("../src/App.jsx");
t("o / carrega a casca com rolagem", APP.includes('const CombatTracker = telaSobDemanda(() => import("./systems/afty/ui/CriaturaComRolagem252"));'), true);
const CASCA = lê("../src/systems/afty/ui/CriaturaComRolagem252.jsx");
t("e a casca passa o onRolar", CASCA.includes("<CombatTracker {...props} onRolar={rolar} />"), true);
const P252 = lê("../src/systems/afty/encontros/telas/PainelCriatura252.jsx");
t("o painel do Encontro rola no próprio painel", [P252.includes("useRolagens252()"), P252.includes('variante="embutida"')], [true, true]);
t("e continua sem importar de src/components", /from "[./]*components\//.test(P252), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
