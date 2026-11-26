/* A AÇÃO PERSONALIZADA DA INVOCAÇÃO (2026-11-24, feedback do lançamento).

   "Não dá para criar característica/ação de invocação personalizada de forma eficiente e bem feita como dá para fazer
   com feitiço." A Ação ganhou a família `personalizada`, no molde do Feitiço Personalizado: textos de mesa (alcance, alvo,
   duração), resolução opcional pelos números nativos da invocação (Acerto da Jogada de Ataque ou CD do ataque por TR) e
   rolagens próprias. Decisão do autor: ocupa vaga de Ação, e o custo em PE é à mão, com o teto do grau. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const I = await import(R + "afty-invocacoes.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const DONO = { nd: 9, bt: 4 };
const inv = (grau = "segundo") => ({ ...I.createBlankInvocacao(grau, "shikigami"), id: "X", nome: "Cão" });
const acao = (extra) => ({ ...I.createBlankAcao(), id: "p", nome: "Uivo", familia: "personalizada", ...extra });
const res = (a, grau) => I.resolveAcao(a, inv(grau), DONO);

t("a Acao em branco traz os campos da Personalizada",
  (({ resolucao, alcanceTexto, alvoTexto, duracaoTexto, rolagens }) => [resolucao, alcanceTexto, alvoTexto, duracaoTexto, rolagens])(I.createBlankAcao()),
  ["nenhuma", "", "", "", []]);

const tr = res(acao({ resolucao: "tr", trTipo: "vontade", atributoChave: "presenca" }));
const ataqueTr = res({ ...I.createBlankAcao(), id: "a", familia: "ataque", ataqueTipo: "tr", trTipo: "vontade", atributoChave: "presenca" });
t("por TR, a CD e a mesma do ataque por TR", [tr.familia, tr.cd, tr.trTipoLabel], ["personalizada", ataqueTr.cd, "Vontade"]);

const jogada = res(acao({ resolucao: "jogada", atributoChave: "destreza" }));
const ataqueJogada = res({ ...I.createBlankAcao(), id: "a", familia: "ataque", ataqueTipo: "jogada", atributoChave: "destreza" });
t("por Jogada, o Acerto e o mesmo da Jogada de Ataque", jogada.bonusAtaque, ataqueJogada.bonusAtaque);
t("e o Auxilio de Acerto proprio soma igual",
  I.resolveAcao(acao({ resolucao: "jogada", atributoChave: "destreza" }), inv(), { ...DONO, auxilioAcertoProprio: 2 }).bonusAtaque, ataqueJogada.bonusAtaque + 2);
const nenhuma = res(acao({}));
t("sem resolucao nao ha Acerto nem CD", [nenhuma.bonusAtaque, nenhuma.cd, nenhuma.dano], [undefined, undefined, undefined]);

const textos = res(acao({ alcanceTexto: " 9 m ", alvoTexto: "Uma criatura", duracaoTexto: "" }));
t("os textos de mesa chegam aparados", [textos.alcance, textos.alvoTexto, textos.duracaoTexto], ["9 m", "Uma criatura", null]);

const comRolagens = res(acao({ rolagens: [
  { rotulo: "Dano Psíquico", dados: 2, faces: 8, fixo: 3, vezes: 2, tom: "dano" },
  { rotulo: "", dados: 1, faces: 6, tom: "cura" },
  { rotulo: "Vazia", dados: 0, faces: 6 },
  { rotulo: "d1", dados: 2, faces: 1 },
] }));
t("as rolagens validas chegam com grupos, e as invalidas saem", comRolagens.rolagens, [
  { rotulo: "Dano Psíquico", dados: 2, faces: 8, fixo: 3, vezes: 2, tom: "dano", grupos: [{ dados: 2, faces: 8 }] },
  { rotulo: "Rolagem", dados: 1, faces: 6, fixo: 0, vezes: 1, tom: "cura", grupos: [{ dados: 1, faces: 6 }] },
]);

/* O custo à mão, com o teto do grau, e sem as regras da Ação com Custo. */
const max = I.custoMaxAcao("segundo");
t("o custo a mao fica como escrito", res(acao({ custoPE: max, classe: "simples" })).custoPE, max);
t("e Simples pode ter custo (nao e a Acao com Custo do livro)",
  res(acao({ custoPE: 2, classe: "simples" })).warnings.includes("Ação com Custo deve custar ao menos uma Ação Complexa."), false);
t("passar do teto do grau avisa",
  res(acao({ custoPE: max + 1 })).warnings.includes(`Custo ${max + 1} PE passa do máximo ${max} do grau.`), true);
t("Beneficios por PE nao entram na Personalizada",
  res(acao({ custoPE: 2, beneficiosCusto: [{ tipo: "danoCura", pe: 2 }] })).beneficiosPE, undefined);

/* O Modificador cai no número que existe. */
t("o Modificador mira o Acerto na Jogada", I.alvosDeModificador({ familia: "personalizada", resolucao: "jogada" }).map((o) => o.value), ["acerto"]);
t("e a CD no TR", I.alvosDeModificador({ familia: "personalizada", resolucao: "tr" }).map((o) => o.value), ["cd"]);
t("e nada sem resolucao", I.alvosDeModificador({ familia: "personalizada" }), []);
t("o Modificador soma na CD",
  res(acao({ resolucao: "tr", atributoChave: "presenca", trTipo: "vontade", modificadorExpr: "2" })).cd, ataqueTr.cd + 2);
t("o catalogo segue valido", I.validarCatalogoInvocacoes(), []);

/* Ela ocupa vaga de Ação no orçamento da invocação. */
const f = createBlankAfty();
f.core = { ...f.core, nd: 9 };
f.especializacoes = [{ id: "controlador", nivel: 9 }];
f.invocacoes = [{ ...inv(), acoes: [acao({ classe: "simples", custoPE: 3, rolagens: [{ rotulo: "Dano", dados: 2, faces: 8 }] })] }];
const resolvida = deriveAfty(f).invocacoes.lista[0];
t("na ficha derivada ela ocupa uma vaga de Acao Simples", [resolvida.orcamento.usados, resolvida.orcamento.uso.simples], [1, 1]);
t("e chega com as rolagens", resolvida.acoes[0].rolagens.map((r) => r.rotulo), ["Dano"]);

/* O MOTOR DA AÇÃO PERSONALIZADA (2026-11-24). As linhas resolvem antes das Ações, então mexem nos números de verdade, e
   entram na disputa das Características: duas fontes do mesmo efeito não acumulam. */
const linha = (canal, expr, extra) => ({ canal, expr, ...extra });
const comAcoes = (acoes, caracteristicas = []) => I.resolveInvocacao({ ...inv(), acoes, caracteristicas }, DONO);
const base = comAcoes([acao({ resolucao: "jogada" })]);
const comDefesa = comAcoes([acao({ resolucao: "jogada", efeitos: [linha("defesa", "2")] })]);
t("a Acao em branco traz a lista do Motor", I.createBlankAcao().efeitos, []);
t("+2 Defesa pelo Motor sobe a Defesa da invocacao", comDefesa.defesa - base.defesa, 2);
const comAcerto = comAcoes([acao({ resolucao: "jogada", efeitos: [linha("acerto", "1")] })]);
t("+1 Acerto pelo Motor sobe a jogada da propria Acao", comAcerto.acoes[0].bonusAtaque - base.acoes[0].bonusAtaque, 1);
t("a Acao resolvida traz as linhas e o resumo", [comDefesa.acoes[0].efeitos[0].valor, comDefesa.acoes[0].resumoMotor], [2, "+2 Defesa"]);
const duas = comAcoes([
  acao({ id: "p1", efeitos: [linha("defesa", "2")] }),
  acao({ id: "p2", efeitos: [linha("defesa", "2")] }),
]);
t("duas Acoes com +2 Defesa nao acumulam", duas.defesa - base.defesa, 2);
t("e a ficha avisa", duas.warnings.some((w) => w.includes("não acumulam")), true);
const livre = { ...I.createBlankCaracteristica(), id: "c", nome: "Couro", subtipo: "livre", efeitos: [linha("defesa", "3")] };
const mista = comAcoes([acao({ efeitos: [linha("defesa", "2")] })], [livre]);
const soLivre = comAcoes([acao({})], [livre]);
t("com uma Livre de +3 e uma Acao de +2 vale a maior", mista.defesa, soLivre.defesa);
const dado = comAcoes([acao({ efeitos: [linha("ataqueDanoAdicional", "6")] })]);
t("dado extra pelo Motor avisa e nao entra", dado.warnings.some((w) => w.includes("Ação Personalizada não pode dar dado extra")), true);
const vazia = comAcoes([acao({ efeitos: [linha("defesa", "")] })]);
t("a linha vazia volta na lista", vazia.acoes[0].efeitos.length, 1);
const ataque = comAcoes([{ ...I.createBlankAcao(), id: "a", familia: "ataque", efeitos: [linha("defesa", "2")] }]);
t("Acao de Ataque ignora o campo", [ataque.defesa, ataque.acoes[0].efeitos], [comAcoes([{ ...I.createBlankAcao(), id: "a", familia: "ataque" }]).defesa, undefined]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
