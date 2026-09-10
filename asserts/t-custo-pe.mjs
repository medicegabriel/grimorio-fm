/**
 * O CUSTO EM PE, e o alcance do canal `custoPE`.
 *
 * Até 2026-09-09 este canal era lido em UM lugar: o custo do Feitiço. O
 * Vislumbre Celeste pediu *"Sempre que gastar PE, você reduzirá o valor
 * gasto"*, e o autor confirmou o alcance: **todo gasto que a ficha calcula**.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O PISO DE 1 PE VALE POR GASTO. Dois gastos de 1 PE com redução 5 custam 1
 *    cada, e não zero. E base ZERO continua zero: quem não gasta não passa a
 *    gastar 1 por causa do piso.
 * 2. SEM ALVO VALE PARA TODOS, COM ALVO VALE PARA UM. É o que separa a redução
 *    ampla do Vislumbre da dirigida da Expansão de Domínio.
 * 3. ⚠ A EXPANSÃO DE DOMÍNIO NOMEIA O ALVO DELA. O texto é *"O custo dos seus
 *    FEITIÇOS dentro da expansão"*, e quando o canal ganhou alcance ela passaria
 *    a baratear Domínio Simples, Estilo e Invocação de lambuja. Este é o assert
 *    que impede a regressão silenciosa.
 * 4. Os cinco gastos são uma lista FECHADA, e um alvo fora dela é recusado pelo
 *    validador em vez de virar redução que nunca acontece.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { normalizarPacote, aplicarAddons } = await import(R + "afty-addons.js");
const EF = await import(R + "afty-efeitos.js");
const { CUSTO_PE_MINIMO } = await import(R + "afty-dominio-simples.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Um agregado de efeitos falso, no formato que os leitores comem. */
const efeitos = (...detalhes) => ({ detalhes });
const reducao = (valor, alvo = null, nome = "Teste") => ({
  canal: "custoPE", valor, nome, ...(alvo ? { alvo } : {}),
});

/* ============================================================ */
/* 1. OS CINCO GASTOS                                            */
/* ============================================================ */
t("são cinco gastos", EF.CUSTOS_PE.length, 5);
t("e são estes", EF.CUSTOS_PE.map((c) => c.value).sort(),
  ["aptidao", "dominio", "estilo", "feitico", "invocacao"]);
t("todo gasto tem rótulo", EF.CUSTOS_PE.every((c) => !!c.label), true);
t("sem alvo é válido, porque é a redução ampla", EF.custoPeValido(null), true);
t("um alvo da lista é válido", EF.custoPeValido("dominio"), true);
t("e um alvo inventado não é", EF.custoPeValido("mesada"), false);

/* ============================================================ */
/* 2. O PISO, POR GASTO                                          */
/* ============================================================ */
t("o piso é 1", CUSTO_PE_MINIMO, 1);
t("sem redução, o custo é o custo", EF.custoEmPe(4, efeitos()).valor, 4);
t("a redução desce o custo", EF.custoEmPe(4, efeitos(reducao(2))).valor, 2);
/* ⚠ O PISO É POR GASTO. Uma redução de 5 num gasto de 3 dá 1, e não menos dois:
   quem gasta continua gastando. */
t("o piso segura", EF.custoEmPe(3, efeitos(reducao(5))).valor, 1);
/* ⚠ E BASE ZERO CONTINUA ZERO. Sem isto, toda ação de graça passaria a custar 1
   PE por causa do piso, que é o contrário do que o piso quer dizer. */
t("o que não custa não passa a custar", EF.custoEmPe(0, efeitos(reducao(5))).valor, 0);
t("redução negativa é ignorada", EF.custoEmPe(4, efeitos(reducao(-3))).valor, 4);
t("as parcelas viajam para o hover",
  EF.custoEmPe(4, efeitos(reducao(2, null, "Vislumbre"))).partes, [{ label: "Vislumbre", valor: 2 }]);

/* ============================================================ */
/* 3. SEM ALVO VALE PARA TODOS, COM ALVO VALE PARA UM            */
/* ============================================================ */
const ampla = efeitos(reducao(2));
t("a redução ampla alcança os cinco gastos",
  EF.CUSTOS_PE.map((c) => EF.custoEmPe(6, ampla, c.value).valor), [4, 4, 4, 4, 4]);

const soFeitico = efeitos(reducao(2, "feitico"));
t("a dirigida alcança só o alvo dela",
  EF.CUSTOS_PE.map((c) => EF.custoEmPe(6, soFeitico, c.value).valor), [4, 6, 6, 6, 6]);
t("e as duas somam no alvo em comum",
  EF.custoEmPe(6, efeitos(reducao(2), reducao(2, "feitico")), "feitico").valor, 2);

/* ============================================================ */
/* 4. A EXPANSÃO DE DOMÍNIO NOMEIA O ALVO DELA                   */
/* ============================================================ */
/* ⚠ ESTE É O ASSERT DE REGRESSÃO. O efeito básico da Expansão é *"O custo dos
   seus Feitiços dentro da expansão é reduzido em um valor igual ao seu Nível de
   DOM"*, e ele é o único emissor de `custoPE` do livro. No dia em que o canal
   ganhou alcance, tirar o alvo dele passaria a baratear Domínio Simples, Estilo
   e Invocação junto, e ninguém veria. */
const dominios = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/afty-dominios.js", import.meta.url)),
  "utf8",
);
t("a Expansão emite custoPE mirando o Feitiço",
  /marca\("custoPE", "dom", nomeBase\), alvo: "feitico"/.test(dominios), true);

/* ============================================================ */
/* 5. DE PONTA A PONTA, NA FICHA                                 */
/* ============================================================ */
/* Um pacote sintético com um Talento que reduz PE. Ele não é conteúdo de mesa
   nenhum: existe para provar que o canal chega em cada gasto. */
const pacote = (alvo) => normalizarPacote({
  id: "teste-custo-pe",
  nome: "Teste de Custo",
  acrescenta: {
    talentos: [{
      id: "tal_teste_custo",
      nome: "Teste de Custo",
      grupo: "geral",
      descricao: "Reduz o custo em PE.",
      requisitos: [],
      efeitos: [{ canal: "custoPE", expr: "3", nome: "Teste de Custo", ...(alvo ? { alvo } : {}) }],
    }],
  },
});

const base = (addon) => {
  const f = createBlankAfty();
  f.core.nd = 20;
  f.core.tipo = "conjurador";
  f.core.origem = { id: "herdado" };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.aptidoes = { au: 0, cl: 0, bar: 0, dom: 3, er: 0 };
  f.aptidoesEscolhidas = ["dominio_simples"];
  if (addon) {
    f.addons = [addon];
    f.talentos = ["teste-custo-pe:tal_teste_custo"];
  }
  return f;
};

/* ⚠ O MUNDO É RECONSTRUÍDO A CADA CASO. `aplicarAddons` é global e reescreve os
   catálogos no lugar, então derivar as três fichas de uma vez leria o mundo da
   última. Cada `deriveAfty` sai logo depois do `aplicarAddons` dele. */
const derivarCom = (addon) => {
  aplicarAddons(addon ? [addon] : []);
  return deriveAfty(base(addon));
};
const crua = derivarCom(null);
const comAmpla = derivarCom(pacote(null));
const comFeitico = derivarCom(pacote("feitico"));

t("a criatura crua tem Domínio Simples com custo", crua.dominioSimples.custoErguer > 0, true);
/* ⚠ A REDUÇÃO AMPLA CHEGA NO DOMÍNIO SIMPLES, que antes de 2026-09-09 nenhum
   `custoPE` alcançava. */
t("a redução ampla desce o custo de erguer",
  comAmpla.dominioSimples.custoErguer, Math.max(1, crua.dominioSimples.custoErguer - 3));
/* E a dirigida ao Feitiço NÃO desce, que é a outra metade da promessa. */
t("a dirigida ao Feitiço não encosta no Domínio Simples",
  comFeitico.dominioSimples.custoErguer, crua.dominioSimples.custoErguer);
t("a parcela aparece no hover do custo",
  comAmpla.dominioSimples.partesErguer.some((p) => p.label === "Teste de Custo"), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
