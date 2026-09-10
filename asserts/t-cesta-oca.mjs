/**
 * ERA DA CESTA OCA DE VIME: o remendo que tira um pré-requisito.
 *
 * Pedido do autor em 2026-09-08: *"Faça um addon que quebre o Pre-Requisito de
 * 'Mestre em Historia' de Cesta Oca de Vime. Estou jogando em uma era aonde
 * isso não é necessario"*.
 *
 * ------------------------------------------------------------
 * POR QUE ESTE CASO EXISTE
 * ------------------------------------------------------------
 * O livro pede uma coisa OU a outra: *"Ser de uma época onde ela era utilizada
 * ou Mestre em História"*. O Grimório transcreveu só a metade conferível em
 * 2026-07-16, porque a época é da MESA e não da ficha, e não há campo onde ela
 * caiba. Este addon é a outra metade do "ou", declarada pela mesa que joga nela.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O remendo tira UM requisito e deixa os outros dois de pé. A prova mais
 *    importante daqui é a CONTRAPROVA: o pacote não pode abrir a aptidão para
 *    quem não tem BAR 1 ou não chegou ao ND 5.
 * 2. Ele troca só o campo `requisitos`. Nome, descrição, trilha e categoria
 *    continuam sendo as do livro, porque a substituição é rasa e por campo.
 * 3. Desinstalar devolve a entrada do livro, sem resto.
 * 4. Nenhuma outra aptidão é tocada.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const APT = await import(R + "afty-aptidoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ALVO = "cesta_oca_de_vime";
const pacote = JSON.parse(
  readFileSync(new URL("../addons/era-da-cesta-oca.json", import.meta.url), "utf8"),
);

/* O jeito que a aba decide, copiado do `AptidaoCard`: avalia todos os
   requisitos e bloqueia quando sobra algum verificável e não atendido. */
const trava = (ctx) => APT.getAptidao(ALVO).requisitos
  .map((r) => APT.avaliarRequisitoAptidao(r, ctx))
  .filter((r) => r.verificavel && !r.ok)
  .map((r) => r.label);

/* A ficha do autor: chegou ao ND 5, tem a trilha de Barreiras aberta, e não é
   Mestre em História (nem treinado). */
const NA_ERA = { niveis: { bar: 1 }, nd: 5, periciaProf: {} };

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("ele é só remendo, e não acrescenta entrada nenhuma",
  [Object.keys(pacote.substitui ?? {}), pacote.acrescenta ?? null], [["aptidoes"], null]);
t("e ele remenda uma aptidão só", pacote.substitui.aptidoes.length, 1);
t("o remendo troca só o campo requisitos",
  Object.keys(pacote.substitui.aptidoes[0]).sort(), ["id", "requisitos"]);

/* ============================================================ */
/* 2. ANTES: O LIVRO COBRA HISTÓRIA                              */
/* ============================================================ */
const ANTES = APT.getAptidao(ALVO);
t("o livro pede três requisitos", ANTES.requisitos.length, 3);
t("e um deles é Mestre em História",
  ANTES.requisitos.some((r) => r.tipo === "pericia" && r.pericia === "historia" && r.nivel === "mestre"),
  true);
/* ⚠ ESTE É O SINTOMA QUE O AUTOR DESCREVEU. Sem ele, o assert de depois não
   provaria nada: uma aptidão que já estivesse aberta continuaria aberta. */
t("na era certa, mas sem História, a aptidão trava", trava(NA_ERA), ["Mestre em História"]);

/* ============================================================ */
/* 3. DEPOIS: O REQUISITO SAI, E SÓ ELE                          */
/* ============================================================ */
AD.aplicarAddons([pacote]);
const DEPOIS = APT.getAptidao(ALVO);

t("sobram dois requisitos", DEPOIS.requisitos.length, 2);
t("História saiu", DEPOIS.requisitos.some((r) => r.tipo === "pericia"), false);
t("e os outros dois são os do livro, intactos",
  DEPOIS.requisitos, [{ tipo: "trilha", trilha: "bar", valor: 1 }, { tipo: "nd", valor: 5 }]);
t("a aptidão abre para quem está na era", trava(NA_ERA), []);

/* ⚠ A CONTRAPROVA, e ela é a razão de o remendo listar os outros dois em vez de
   mandar uma lista vazia. Um addon que "quebra o pré-requisito" e de quebra
   abre a aptidão no ND 1 não é o que o autor pediu: ele disse que a ÉPOCA não é
   necessária, e não que a aptidão virou gratuita. */
t("quem não chegou ao ND 5 continua travado",
  trava({ ...NA_ERA, nd: 4 }), ["Nível 5"]);
t("quem não tem a trilha de Barreiras continua travado",
  trava({ ...NA_ERA, niveis: {} }), ["BAR 1"]);

/* ============================================================ */
/* 4. O RESTO DA ENTRADA É O DO LIVRO                            */
/* ============================================================ */
/* A substituição é rasa e por campo, então tudo que o remendo não citou tem de
   sair igual. Um remendo que levasse a descrição junto seria o começo de uma
   cópia congelada do livro dentro do addon, que é o que o `substitui` existe
   para evitar. */
for (const campo of ["id", "nome", "descricao", "categoria", "trilha"]) {
  t(`${campo} continua o do livro`, DEPOIS[campo], ANTES[campo]);
}
/* A linha se declara remendada, para a tela poder dizer que ela não é mais a do
   livro. */
t("a entrada sabe de quem veio o remendo",
  DEPOIS.remendadoPor?.map((p) => p.id), ["era-da-cesta-oca"]);

/* ============================================================ */
/* 5. NINGUÉM MAIS FOI TOCADO                                    */
/* ============================================================ */
t("só uma aptidão do catálogo está remendada",
  APT.AFTY_APTIDOES.filter((a) => a.remendadoPor?.length).map((a) => a.id), [ALVO]);

/* ============================================================ */
/* 6. DESINSTALAR DEVOLVE O LIVRO                                */
/* ============================================================ */
AD.limparAddons();
const VOLTOU = APT.getAptidao(ALVO);
t("os três requisitos voltam", VOLTOU.requisitos, ANTES.requisitos);
t("e a marca de remendo some", VOLTOU.remendadoPor ?? null, null);
t("a trava volta com eles", trava(NA_ERA), ["Mestre em História"]);
t("mundo limpo no fim", AD.addonsAtivos().length, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
