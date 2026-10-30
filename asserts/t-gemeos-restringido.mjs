/* GÊMEO RESTRINGIDO (2026-10-12).

   Relato do autor: *"Eu não consigo selecionar RESTRINGIDO em Gêmeos. Só
   Feiticeiros"*. O ramo da Restrição Celestial é decidido pelo Tipo, e o
   jogador não tem o campo Tipo. Decisão do autor: no jogador o Gêmeo vira
   Restringido pela cópia do Físico Abençoado nas Verdadeiras Origens
   (divergência `gemeoRestringidoPelaCopia`, lida em `tipoDaFicha`).

   Junto, a Restrição Definitiva nos dois sistemas:
     • irmão vivo: "você é incapaz de receber a habilidade Restrição
       Definitiva" (`vetaHabilidades`). No jogador a Classe a concedia sozinha
       no Nível 10;
     • irmão morto: "Você recebe a habilidade Restrição Definitiva,
       independente de seu nível" (`concedeHabilidades`). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const O = await import(R + "afty-origens.js");
const S = await import(R + "afty-sistema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const DEF = "res_restricao_definitiva";
const FISICO = "vo_restringido_fisico_abencoado";
t("a divergência existe e está ativa", S.DIVERGENCIAS.find((d) => d.id === "gemeoRestringidoPelaCopia")?.ativa, true);
t("a opção do Físico Abençoado existe",
  O.getOrigem("gemeos").caracteristicas.find((c) => c.id === "verdadeiras_origens").escolha.opcoes.some((o) => o.id === FISICO), true);

const ficha = ({ sistema, tipo = "combatente", copia = null, morto = false, nd = 12, classe = "restringido", habilidades = [] }) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = {
    ...c.core, nd, tipo, patamar: "comum",
    origem: { id: "gemeos", irmaoMorto: morto, escolhas: copia ? { verdadeiras_origens: [copia] } : {} },
  };
  c.especializacoes = [{ id: classe, nivel: nd }];
  c.attrMethod = "fixos";
  c.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.habilidades = habilidades;
  return c;
};
const carac = (c) => O.caracteristicasEfetivas(c).map((x) => x.id).filter((id) => id.startsWith("restricao_celestial_"));
const tem = (d) => (d.habilidades?.efetivas ?? []).includes(DEF);

/* ============================================================ */
/* 1. JOGADOR: O RAMO SAI DA CÓPIA                               */
/* ============================================================ */
{
  const semCopia = ficha({ sistema: "player" });
  t("player sem cópia: Feiticeiro", O.tipoDaFicha(semCopia), "combatente");
  t("player sem cópia: card dos Feiticeiros", carac(semCopia), ["restricao_celestial_feiticeiro"]);
  const gravadoErrado = ficha({ sistema: "player", tipo: "restringido" });
  t("player com Tipo Restringido gravado e sem cópia: Feiticeiro", O.tipoDaFicha(gravadoErrado), "combatente");

  const vivo = ficha({ sistema: "player", copia: FISICO });
  t("player com a cópia: Restringido", O.tipoDaFicha(vivo), "restringido");
  t("player com a cópia: card do Restringido", carac(vivo), ["restricao_celestial_restringido"]);
  const d = deriveAfty(vivo);
  t("Força e Destreza 14 + 1 − 2", [d.attrEff.forca, d.attrEff.destreza, d.attrEff.constituicao], [13, 13, 15]);
  t("2 de vigor por nível", d.pe, 24);
  t("a Classe Restringido abre", d.especializacoes.escolhidas.map((e) => e.id), ["restringido"]);
  t("sem aba de Aptidões (sem energia)", d.totalAptidao ?? 0, 0);
  t("irmão vivo: a Classe não concede a Restrição Definitiva", tem(d), false);
  t("e ela aparece como vetada", d.habilidades.vetadas, [DEF]);
  t("escolhida à mão também não vale", tem(deriveAfty(ficha({ sistema: "player", copia: FISICO, habilidades: [DEF] }))), false);

  const morto = deriveAfty(ficha({ sistema: "player", copia: FISICO, morto: true, nd: 6 }));
  // "+2 pontos de vigor por nível" sobre a base 4 (autor, 2026-10-12): 6 por nível.
  t("irmão morto: 6 de vigor por nível", morto.pe, 36);
  t("com a parcela nomeada no hover", morto.partes.pe.find((p) => p.label === "Gêmeos: Restrição Celestial")?.valor, 12);
  t("irmão morto: Força e Destreza sem a redução", [morto.attrEff.forca, morto.attrEff.destreza], [15, 15]);
  t("irmão morto: Restrição Definitiva no Nível 6", tem(morto), true);
  t("concedida, sem gastar vaga", morto.habilidades.concedidas.includes(DEF), true);
  t("e o veto caiu", morto.habilidades.vetadas, []);

  const feiticeiro = deriveAfty(ficha({ sistema: "player", morto: true, classe: "lutador", nd: 6 }));
  t("Gêmeo Feiticeiro morto não recebe a Restrição Definitiva", tem(feiticeiro), false);
}

/* ============================================================ */
/* 2. CRIATURA: O CAMPO TIPO CONTINUA MANDANDO                   */
/* ============================================================ */
{
  t("afty: a cópia não muda o Tipo", O.tipoDaFicha(ficha({ sistema: "afty", copia: FISICO })), "combatente");
  t("afty: Tipo Restringido sem cópia é Restringido", O.tipoDaFicha(ficha({ sistema: "afty", tipo: "restringido" })), "restringido");

  const vivo = deriveAfty(ficha({ sistema: "afty", tipo: "restringido", copia: FISICO, habilidades: [DEF] }));
  t("afty vivo: escolhida à mão não vale", tem(vivo), false);
  t("afty vivo: vetada", vivo.habilidades.vetadas, [DEF]);
  const morto = deriveAfty(ficha({ sistema: "afty", tipo: "restringido", morto: true, nd: 6 }));
  t("afty morto: Restrição Definitiva no ND 6", tem(morto), true);
  t("afty morto: 6 de vigor por nível", morto.pe, 36);
}

/* ============================================================ */
/* 3. NINGUÉM MAIS É ATINGIDO                                    */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 12, tipo: "restringido", patamar: "comum", origem: { id: "restringido" } };
  c.especializacoes = [{ id: "restringido", nivel: 12 }];
  t(`${sistema}: Origem Restringido segue Restringido`, O.tipoDaFicha(c), "restringido");
  t(`${sistema}: e a Restrição Definitiva dela não é vetada`, deriveAfty(c).habilidades.vetadas, []);
}

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`${bad.length} FALHA(S), ${ok} ok`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
