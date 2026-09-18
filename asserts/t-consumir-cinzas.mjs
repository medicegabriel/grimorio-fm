/* CONSUMIR CINZAS, A HABILIDADE ÁPICE DO LOCKE (2026-09-18).

   Addon puro na família `apices`. O motor só alcança dois números dela, e eles
   dependem de DUAS coisas ao mesmo tempo: a Ápice estar escolhida (dentro de
   Atingir Ápice) e o interruptor da bancada estar ligado.

   ⚠ O interruptor de Addon aparece para quem instala o pacote, sem portão de
   Ápice (o `comDono` dos estados de Addon só conhece Talento, Habilidade e
   Aptidão). Por isso o que impede o bônus sem a Ápice é o efeito morar na
   entrada da Ápice, que só é coletada quando ela é a escolhida. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const AN = await import(R + "afty-alto-nivel.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/consumir-cinzas.json", import.meta.url), "utf8")));
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
AD.aplicarAddons([pacote]);

const ID = "consumir-cinzas:consumir_cinzas";
const ESTADO = "consumir-cinzas:ativo";

t("a Ápice entra no catálogo com o namespace", AN.getHabilidadeApice(ID)?.nome, "Consumir Cinzas");
t("e o texto do livro chega inteiro", AN.getHabilidadeApice(ID).descricao.includes("8 meses de vida"), true);
t("Malefícios e Benefícios estão no texto",
  ["Malefícios", "Benefícios"].every((s) => AN.getHabilidadeApice(ID).descricao.includes(s)), true);

t("ela aparece no pool de Atingir Ápice",
  AN.getHabilidadeLendaria("len_atingir_apice").escolha.opcoes.some((o) => o.id === ID), true);
t("sem requisito escrito no livro ela esta aberta", AN.avaliarAcessoAltoNivel(AN.getHabilidadeApice(ID)).ok, true);

const base = () => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 30, tipo: "combatente", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel: 20 }];
  f.habilidadesLendarias = ["len_atingir_apice"];
  f.addons = [pacote];
  return f;
};
const comApice = () => ({ ...base(), escolhasAltoNivel: { len_atingir_apice: [ID] } });
const linha0 = (d) => d.dano.entradas[0];

const sem = deriveAfty({ ...comApice(), combate: { ativo: true } });
const com = deriveAfty({ ...comApice(), combate: { ativo: true, [ESTADO]: true } });

t("a Ápice fica escolhida pela ficha", com.altoNivel.apiceId, ID);
t("o interruptor existe na bancada", com.combate.estadosExtras.some((e) => e.id === ESTADO), true);
t("ligado: +2 Dados de Dano Adicional", linha0(com).dados - linha0(sem).dados, 2);
t("ligado: +12 em Testes de Acerto", linha0(com).acerto - linha0(sem).acerto, 12);
t("desligado: nada muda", [linha0(sem).dados, linha0(sem).acerto],
  [linha0(deriveAfty({ ...comApice(), combate: { ativo: true } })).dados,
    linha0(deriveAfty({ ...comApice(), combate: { ativo: true } })).acerto]);

/* Sem a Ápice escolhida, o interruptor ligado não dá nada. */
const semApice = deriveAfty({ ...base(), combate: { ativo: true, [ESTADO]: true } });
const semApiceDesl = deriveAfty({ ...base(), combate: { ativo: true } });
t("sem a Ápice escolhida o interruptor ligado nao da dados",
  linha0(semApice).dados - linha0(semApiceDesl).dados, 0);
t("nem acerto", linha0(semApice).acerto - linha0(semApiceDesl).acerto, 0);

/* Fora de combate o estado zera, como todo estado de bancada. */
const foraDeCombate = deriveAfty({ ...comApice(), combate: { ativo: false, [ESTADO]: true } });
t("fora de combate nada vale", linha0(foraDeCombate).dados, linha0(deriveAfty({ ...comApice(), combate: { ativo: false } })).dados);

/* O efeito de outra Ápice nativa nao vaza para esta. */
const outra = deriveAfty({ ...base(), escolhasAltoNivel: { len_atingir_apice: ["api_invencivel_sob_o_sol"] },
  combate: { ativo: true, [ESTADO]: true } });
t("com outra Ápice escolhida o interruptor nao da dados", linha0(outra).dados - linha0(semApiceDesl).dados, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
