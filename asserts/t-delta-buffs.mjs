/* DELTA DOS BUFFS, 2026-08-28.

   A aba Buffs da Ficha Final põe um chip em cada estado LIGADO dizendo o que
   ele está fazendo agora ("Defesa +3", "Dano +4"). O número sai de derivar a
   ficha outra vez com aquele estado desligado e subtrair.

   O bug que este arquivo tranca: o derive de comparação recebia SÓ
   `{ almaAtual }`, enquanto a ficha da tela recebia mais seis opções (Guarda
   Inabalável, concessão do mestre e os três de Ritual). A diferença entre as
   duas LISTAS DE OPÇÃO não tinha dono, então ia inteira para o estado que
   estava sendo medido, e ia para TODOS eles ao mesmo tempo.

   Na prática, numa criatura de patamar Calamidade com a Guarda erguida:

     Postura da Devastação ....... Defesa +5   (não dá Defesa nenhuma)
     Postura do Céu .............. Defesa +5 e Atenção +2   (só os +2 são dela)

   ⚠ Este arquivo prova NÚMERO, e não aparência. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { deltaDosEstados } = await import(R + "ficha/ficha-buffs.js");
const { COMBATE_ESTADOS } = await import(R + "afty-combate.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* A CRIATURA: Combatente Calamidade com duas posturas assumidas */
/* ============================================================ */

const cria = (patamar = "calamidade") => {
  const c = createBlankAfty();
  c.core.nd = 20;
  c.core.patamar = patamar;
  c.core.origem = { id: "herdado" };
  c.classes = [{ id: "combatente", nivel: 20 }];
  c.habilidades = ["cmb_assumir_postura", "cmb_mestre_da_postura"];
  c.escolhasHabilidade = {
    cmb_assumir_postura: ["cmb_postura_da_devastacao", "cmb_postura_do_ceu"],
  };
  return c;
};

const combateDe = (c) => ({ ...c.combate, ativo: true, postura: "devastacao", postura2: "ceu" });

/* A Guarda CORRENTE, no shape que o `entradaDaGuarda` monta: erguida, cheia e
   sem golpe nenhum sofrido. É o estado do primeiro turno de uma luta. */
const GUARDA_ERGUIDA = { golpes: 0, vida: 100, encerrada: false, condicao: null };

const rotulos = (chips) => (chips ?? []).map((x) => `${x.rotulo} ${x.texto}`);

/* ============================================================ */
/* 1. A GUARDA EXISTE, E VALE 5 DE DEFESA                        */
/* ============================================================ */
/* Sem este degrau os testes de baixo passariam por não haver nada a vazar. */

const c = cria();
const base = { ...c, combate: combateDe(c), buffsSessao: [] };
const semGuarda = deriveAfty(base, {});
const comGuarda = deriveAfty(base, { guarda: GUARDA_ERGUIDA });
t("a Guarda do Calamidade soma 5 na Defesa", comGuarda.defesa - semGuarda.defesa, 5);

/* ============================================================ */
/* 2. O CHIP NÃO CARREGA O QUE NÃO É DELE                        */
/* ============================================================ */

const delta = deltaDosEstados(
  c, combateDe(c),
  { guarda: GUARDA_ERGUIDA },
  comGuarda,
);

t("a Postura da Devastação não dá Defesa", rotulos(delta.postura).includes("Defesa +5"), false);
t("e não dá chip nenhum", rotulos(delta.postura), []);
t("a Postura do Céu dá só o que é dela", rotulos(delta.postura2), ["Atenção +2"]);

/* O mesmo derive, agora com o `atual` de dentro: quem não passa `atual` nunca
   viu o bug, e é essa a prova de que as duas rotas concordam. */
const semAtual = deltaDosEstados(c, combateDe(c), { guarda: GUARDA_ERGUIDA });
t("com e sem o `atual` pronto dá o mesmo", semAtual, delta);

/* E sem Guarda alguma (patamar comum) nada muda, que é o caso que já funcionava
   e que o conserto não podia quebrar. */
const cm = cria("ameaca");
const comum = deltaDosEstados(cm, combateDe(cm), {});
t("sem Guarda a Devastação segue sem chip", rotulos(comum.postura), []);
t("e o Céu segue com os dele", rotulos(comum.postura2), ["Atenção +2"]);

/* ============================================================ */
/* 3. FORA DE COMBATE NÃO HÁ DELTA                               */
/* ============================================================ */

t("bancada desligada devolve vazio",
  deltaDosEstados(c, { ...combateDe(c), ativo: false }, { guarda: GUARDA_ERGUIDA }), {});

/* ============================================================ */
/* 4. O TIPO `multi` DESLIGA COM LISTA VAZIA                     */
/* ============================================================ */
/* O Concentrar Aura chegou em 2026-08-28 com um tipo novo, e o `padraoDe` daqui
   não o conhecia: desligava com `0`, que só não virou bug porque quem lê o
   campo passa por `Array.isArray`. Prova pela borda: um `multi` VAZIO não é
   "ligado", e portanto não paga um derive para descobrir que não mudou nada. */

const multiVazio = deltaDosEstados(
  { ...c, combate: { ...combateDe(c), concentrarAura: [] } },
  { ...combateDe(c), concentrarAura: [] },
  { guarda: GUARDA_ERGUIDA },
  comGuarda,
);
t("multi vazio não inventa chip", multiVazio.concentrarAura, undefined);

/* ============================================================ */
/* 5. O CATÁLOGO NÃO GANHOU TIPO SEM AVISAR                      */
/* ============================================================ */
/* O `padraoDe` mapeia tipo por tipo. Um tipo novo no catálogo cairia calado no
   ramo final (`e.min ?? 0`), que é o da faixa, e o delta sairia errado sem
   sintoma. Esta linha é o alarme. */

const TIPOS_CONHECIDOS = new Set(["bool", "faixa", "opcao", "dominio", "multi"]);
t("todo tipo de estado é conhecido pelo delta",
  [...new Set(COMBATE_ESTADOS.map((e) => e.tipo))].filter((x) => !TIPOS_CONHECIDOS.has(x)), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
