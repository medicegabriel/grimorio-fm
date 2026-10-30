/* OS TREINOS DE ENERGIA FORA DE TODO RESTRINGIDO (2026-10-12).

   Pedido do autor: *"Para Restringidos, remova os seguintes Treinos: Barreiras,
   Compreensão, Controle de Energia, Domínios, Energia Reversa"*. As cinco
   linhas já tinham `foraDaOrigem: ["restringido"]` desde 2026-08-03, mas a
   trava lia só a ORIGEM. O Gêmeo Restringido (cópia do Físico Abençoado no
   jogador, Tipo na criatura) e a criatura de outra origem com o Tipo
   Restringido seguiam vendo as cinco. Decisões do autor no mesmo dia: vale nos
   dois sistemas, e o Não-Feiticeiro (sem energia, mas não Restringido) fica de
   fora. A trava mora em `origemDosTreinos`. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const TR = await import(R + "afty-treinamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const CINCO = ["barreiras", "compreensao", "controle_energia", "dominios", "energia_reversa"];
const FISICO = "vo_restringido_fisico_abencoado";

const ficha = ({ sistema, origem, tipo = "combatente", copia = null, classe = "lutador", treinos = {} }) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = {
    ...c.core, nd: 8, tipo, patamar: "comum",
    origem: { id: origem, escolhas: copia ? { verdadeiras_origens: [copia] } : {} },
  };
  c.especializacoes = [{ id: classe, nivel: 8 }];
  c.treinamentos = treinos;
  return c;
};
// O caminho da aba Interlúdios do criador.
const linhas = (c) => TR.treinamentosDaOrigem(TR.origemDosTreinos(c), O.origensQualificadas(c), c).map((l) => l.id);
const dosCinco = (c) => CINCO.filter((id) => linhas(c).includes(id));

/* ============================================================ */
/* 1. TODO RESTRINGIDO PERDE OS CINCO                            */
/* ============================================================ */
const restringidos = [
  ["criatura, origem Restringido", { sistema: "afty", origem: "restringido", tipo: "restringido", classe: "restringido" }],
  ["criatura, Inato com Tipo Restringido", { sistema: "afty", origem: "inato", tipo: "restringido" }],
  ["criatura, Gêmeo com Tipo Restringido", { sistema: "afty", origem: "gemeos", tipo: "restringido" }],
  ["jogador, origem Restringido", { sistema: "player", origem: "restringido", classe: "restringido" }],
  ["jogador, Gêmeo com a cópia do Físico", { sistema: "player", origem: "gemeos", copia: FISICO, classe: "restringido" }],
];
for (const [nome, cfg] of restringidos) {
  t(`${nome}: nenhum dos cinco`, dosCinco(ficha(cfg)), []);
  t(`${nome}: o Treino de Luta segue`, linhas(ficha(cfg)).includes("luta"), true);
}

/* ============================================================ */
/* 2. QUEM NÃO É RESTRINGIDO SEGUE VENDO                         */
/* ============================================================ */
t("criatura Inato Combatente vê os cinco", dosCinco(ficha({ sistema: "afty", origem: "inato" })), CINCO);
t("jogador Gêmeo sem a cópia é Feiticeiro e vê os cinco",
  dosCinco(ficha({ sistema: "player", origem: "gemeos" })), CINCO);
t("jogador Gêmeo com Tipo Restringido gravado e sem cópia: o campo escondido não decide",
  dosCinco(ficha({ sistema: "player", origem: "gemeos", tipo: "restringido" })), CINCO);
t("a Maldição segue perdendo só a Energia Reversa",
  dosCinco(ficha({ sistema: "afty", origem: "maldicao" })), CINCO.filter((id) => id !== "energia_reversa"));

/* ============================================================ */
/* 3. O FOCO PRESO VOLTA E O EFEITO SAI                          */
/* ============================================================ */
{
  const c = ficha({ sistema: "player", origem: "gemeos", copia: FISICO, classe: "restringido",
    treinos: { compreensao: 4, luta: 2 } });
  t("Gêmeo Restringido: os 5 Focos da Compreensão voltam",
    TR.focosGastos(c.treinamentos, TR.origemDosTreinos(c), O.origensQualificadas(c)), 2);
  t("Gêmeo Restringido: só a Luta rende efeito",
    [...new Set(TR.efeitosDeTreino(c).map((e) => e.origem))], ["luta"]);
  const tipo = ficha({ sistema: "afty", origem: "inato", tipo: "restringido", treinos: { controle_energia: 2 } });
  t("Tipo Restringido: o Controle de Energia gravado não rende efeito", TR.efeitosDeTreino(tipo), []);
}

/* ============================================================ */
/* 4. O POTENCIAL FÍSICO SEGUE DA ORIGEM                         */
/* ============================================================ */
// `soDaOrigem: ["restringido"]` abre pelas `qualificadas`. O Tipo sozinho não
// abre, e o Gêmeo abre porque a cópia é da origem Restringido.
t("origem Restringido vê o Potencial Físico",
  linhas(ficha({ sistema: "afty", origem: "restringido", tipo: "restringido", classe: "restringido" })).includes("potencial_fisico"), true);
t("Inato com Tipo Restringido não vê",
  linhas(ficha({ sistema: "afty", origem: "inato", tipo: "restringido" })).includes("potencial_fisico"), false);
{
  const semOrigem = ficha({ sistema: "afty", origem: null, tipo: "restringido" });
  semOrigem.core.origem = null;
  t("sem origem e Tipo Restringido: não vê (a lista vazia de qualificadas responde)",
    linhas(semOrigem).includes("potencial_fisico"), false);
}
t("Gêmeo com a cópia do Físico vê, pela origem copiada",
  linhas(ficha({ sistema: "player", origem: "gemeos", copia: FISICO, classe: "restringido" })).includes("potencial_fisico"), true);

/* ============================================================ */
/* 5. LINHA DE ADDON COM A MESMA MARCA                           */
/* ============================================================ */
{
  const JUJUTSU = JSON.parse(readFileSync(new URL("../addons/estudo-do-jujutsu.json", import.meta.url), "utf8"));
  A.aplicarAddons([A.normalizarPacote(JUJUTSU)]);
  const id = TR.AFTY_TREINAMENTOS.find((l) => l.id.endsWith("estudo_do_jujutsu"))?.id;
  t("o Estudo do Jujutsu entrou no catálogo", !!id, true);
  t("Inato vê o Estudo do Jujutsu", linhas(ficha({ sistema: "afty", origem: "inato" })).includes(id), true);
  t("Gêmeo Restringido não vê o Estudo do Jujutsu",
    linhas(ficha({ sistema: "player", origem: "gemeos", copia: FISICO, classe: "restringido" })).includes(id), false);
}

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`${bad.length} FALHA(S), ${ok} ok`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
