/* EXPANSÃO DE DOMÍNIO: versões, custo, área, domo e Exaustão (2026-10-08).

   Livro: Incompleta 15 PE, 4,5 m × BT, 1 + DOM rodadas. Completa 20 PE, 9 m,
   3 + DOM. Acerto Garantido +5 na Completa. Sem Barreiras "mesmos efeitos e custo
   de uma expansão completa com acerto garantido", sem barreira.
   DA-11: a Sem Barreiras oficial não tem domo, Totem nem `9 m × BT`. A LEGACY
   (gravada sem `regra`) segue com eles. DA-14: Acerto Garantido proibido na
   Incompleta, e só com a Aptidão. O custo passa pelo `custoPE` com escopo
   `dominio`. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const DOM = await import(R + "afty-dominios.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* AS FUNÇÕES PURAS                                              */
/* ============================================================ */
t("sem Aptidão não há versão", DOM.versoesDisponiveis([]), []);
t("a versão vem da Aptidão",
  DOM.versoesDisponiveis(["expansao_de_dominio_incompleta", "expansao_de_dominio_completa"]).map((v) => v.value), ["incompleta", "completa"]);
t("custos 15, 20 e 25 com o Acerto Garantido",
  [DOM.custoDominio("incompleta"), DOM.custoDominio("completa"), DOM.custoDominio("completa", true)], [15, 20, 25]);
t("Sem Barreiras custa 25 sem botão nenhum", [DOM.custoDominio("sem_barreiras"), DOM.custoDominio("sem_barreiras", true)], [25, 25]);
t("duração 1 + DOM e 3 + DOM", [DOM.duracaoDominio(3, "incompleta"), DOM.duracaoDominio(3, "completa"), DOM.duracaoDominio(3, "sem_barreiras")], [4, 6, 6]);
t("área da Incompleta 4,5 m × BT", DOM.areaDominioMetros("incompleta", 4), 18);
t("área da Completa 9 m", DOM.areaDominioMetros("completa", 4), 9);
t("Sem Barreiras oficial sem número", [DOM.areaDominioMetros("sem_barreiras", 4, false, 0, { legacy: false }), DOM.areaDominio("sem_barreiras", 4, false, 0, { legacy: false })],
  [null, "Definida pela Mesa"]);
t("Sem Barreiras LEGACY com o 9 m × BT", DOM.areaDominioMetros("sem_barreiras", 4, false, 0, { legacy: true }), 36);
t("domo: Incompleta e Completa sim, Sem Barreiras oficial não, LEGACY tinha Totem",
  [DOM.temDomo("incompleta"), DOM.temDomo("completa"), DOM.temDomo("sem_barreiras", false), DOM.temDomo("sem_barreiras", true)], [true, true, false, true]);
t("Acerto Garantido: Aptidão obrigatória, nunca na Incompleta, inerente na Sem Barreiras", [
  DOM.acertoGarantidoValido({ acertoGarantido: { ativo: true } }, "completa", false),
  DOM.acertoGarantidoValido({ acertoGarantido: { ativo: true } }, "completa", true),
  DOM.acertoGarantidoValido({ acertoGarantido: { ativo: true } }, "incompleta", true),
  DOM.acertoGarantidoValido({ acertoGarantido: { ativo: false } }, "sem_barreiras", true),
], [false, true, false, true]);
t("Exaustão de Técnica 1, 2, 4 e 5", [
  DOM.exaustaoTecnicaDaVersao("incompleta"), DOM.exaustaoTecnicaDaVersao("completa"),
  DOM.exaustaoTecnicaDaVersao("completa", true), DOM.exaustaoTecnicaDaVersao("sem_barreiras", true),
], [1, 2, 4, 5]);
t("a Expansão nova nasce oficial", [DOM.novoDominio("completa").regra, DOM.ehDominioLegacy(DOM.novoDominio())], ["oficial", false]);
t("a gravada sem regra é LEGACY, e a leitura não a muda", [DOM.ehDominioLegacy({}), DOM.normalizeDominio({ id: "x" }).regra], [true, null]);

/* ============================================================ */
/* PELO DERIVE, NOS DOIS SISTEMAS                                */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const ficha = ({ versao = "completa", dom = 3, aptidoes = [], extra = {}, dominio = {} } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 20;
    c.aptidoes = { dom, bar: 5 };
    c.aptidoesAmaldicoadas = ["tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa", ...aptidoes];
    c.dominios = [{ id: "d1", nome: "Teste", versao, efeitos: [], ...dominio }];
    return Object.assign(c, extra);
  };
  const linha = (c) => deriveAfty(c).dominios.lista[0];

  const completa = linha(ficha());
  t(`${sistema}: Completa 20 PE, 9 m, domo`, [completa.custo, completa.area, completa.temDomo, completa.pvBarreira > 0], [20, "9 metros", true, true]);
  t(`${sistema}: e a Exaustão de 2`, completa.exaustaoTecnica, 2);
  const comAG = linha(ficha({ aptidoes: ["acerto_garantido"], dominio: { acertoGarantido: { ativo: true, escopo: "x" } } }));
  t(`${sistema}: com o Acerto Garantido 25 e Exaustão 4`, [comAG.custo, comAG.acertoGarantidoValido, comAG.exaustaoTecnica], [25, true, 4]);
  const agSemApt = linha(ficha({ dominio: { acertoGarantido: { ativo: true, escopo: "x" } } }));
  t(`${sistema}: o JSON com AG ligado sem a Aptidão não paga nem vale`,
    [agSemApt.custo, agSemApt.acertoGarantidoValido, agSemApt.validacao.map((v) => v.codigo)], [20, false, ["acertoAptidao"]]);
  const incompletaAG = linha(ficha({ versao: "incompleta", aptidoes: ["acerto_garantido"], dominio: { acertoGarantido: { ativo: true } } }));
  t(`${sistema}: AG na Incompleta é proibido (DA-14)`,
    [incompletaAG.custo, incompletaAG.acertoGarantidoValido, incompletaAG.validacao.map((v) => v.codigo), incompletaAG.exaustaoTecnica],
    [15, false, ["acertoIncompleta"], 1]);

  const semBarreiras = linha(ficha({
    versao: "sem_barreiras", dom: 5, aptidoes: ["acerto_garantido", "expansao_de_dominio_sem_barreiras"], dominio: { regra: "oficial" },
  }));
  t(`${sistema}: Sem Barreiras oficial: 25 PE, sem domo, área da mesa, Exaustão 5`,
    [semBarreiras.custo, semBarreiras.temDomo, semBarreiras.pvBarreira, semBarreiras.area, semBarreiras.exaustaoTecnica],
    [25, false, null, "Definida pela Mesa", 5]);
  t(`${sistema}: e o alcance do Acerto Garantido no corpo`,
    semBarreiras.corpo.base.some((b) => b.titulo === "Alcance do Acerto Garantido"), true);
  t(`${sistema}: e o Acerto Garantido inerente`, semBarreiras.acertoGarantidoValido, true);
  const legacy = linha(ficha({
    versao: "sem_barreiras", dom: 5, aptidoes: ["acerto_garantido", "expansao_de_dominio_sem_barreiras"],
  }));
  const bt = deriveAfty(ficha()).maestria;
  t(`${sistema}: Sem Barreiras LEGACY mantém o Totem e o 9 m × BT`,
    [legacy.legacy, legacy.temDomo, legacy.pvBarreira > 0, legacy.area], [true, true, true, `${9 * bt} metros`]);

  /* O custo pelo `custoPE` (E-08): a redução de Domínio alcança, a de Feitiço não,
     e o aumento sem alvo (o Condenado) também. */
  const comEfeitos = (efeitos) => {
    const c = ficha();
    c.core.tecnicaEfeitos = efeitos;
    return linha(c);
  };
  t(`${sistema}: custoPE de Domínio reduz`, comEfeitos([{ canal: "custoPE", alvo: "dominio", expr: "2" }]).custo, 18);
  t(`${sistema}: custoPE de Feitiço não alcança a Expansão`, comEfeitos([{ canal: "custoPE", alvo: "feitico", expr: "3" }]).custo, 20);
  t(`${sistema}: aumento sem alvo alcança`, comEfeitos([{ canal: "custoPE", expr: "-1" }]).custo, 21);
  const reduzida = comEfeitos([{ canal: "custoPE", alvo: "dominio", expr: "2" }]);
  t(`${sistema}: as parcelas do hover fecham com o custo`, reduzida.partesCusto.reduce((s, p) => s + p.valor, 0), reduzida.custo);

  /* Versão sem Aptidão cai na melhor que sobrou, e agora AVISA (E-17). */
  const perdida = linha(ficha({ versao: "sem_barreiras" }));
  t(`${sistema}: versão sem Aptidão avisa`, [perdida.versao, perdida.validacao.map((v) => v.codigo)], ["completa", ["versao"]]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
