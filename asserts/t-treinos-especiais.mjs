/**
 * TREINOS ESPECIAIS NO JOGADOR (autor, 2026-09-16).
 *
 * Pedido: *"No atual momento falta espaço para colocar Quantos Interludios foram
 * gastos. Além de verdadeiramente quantas Habilidades ou Feitiços foram ganhos.
 * Por exemplo eu gastei 9 Interludios para conseguir 3 Feitiços. ISSO É SÓ PARA
 * JOGADOR"*, com as decisões por pergunta: Interlúdio e Foco são a mesma coisa,
 * a Habilidade para em 2, o Feitiço não tem teto, e a linha guarda também os
 * Sucessos e a CD.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O texto do Treinamento para Habilidade é o verbatim, e não a paráfrase.
 * 2. Os tetos: a criatura na régua de sempre, o jogador na escada do catálogo.
 * 3. O progresso da linha: Interlúdios nunca abaixo dos Ganhos, Sucessos
 *    aparados.
 * 4. Os Focos: no jogador são os Interlúdios, na criatura são as pegas.
 * 5. A CD por Nível.
 * 6. A vaga sai dos GANHOS, e Interlúdio sem Ganho não dá vaga.
 * 7. ⚠ A CRIATURA NÃO MUDA: o progresso gravado não move número nenhum nela.
 * 8. As duas divergências e o validador dos campos novos.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "afty-sistema.js");
const T = await import(R + "afty-treinos-especiais.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Com Classe de verdade e o nível somando: sem Especialização o jogador não
   teria orçamento de Habilidade para a vaga cair em cima. */
const ficha = (sistema, nivel, pegas = {}, progresso = null) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.name = "Cobaia";
  f.core = { ...f.core, nd: nivel };
  f.especializacoes = [{ id: "conjurador", nivel }];
  f.treinosEspeciais = Object.entries(pegas)
    .flatMap(([id, n]) => Array.from({ length: n }, () => ({ id, alvo: null })));
  if (progresso) f.treinoEspecialProgresso = progresso;
  return f;
};

/* ============================================================ */
/* 1. O TEXTO VERBATIM                                           */
/* ============================================================ */
const hab = T.getTreinoEspecial("tes_habilidade");
t("o texto abre com o do livro", hab.descricao.startsWith("O Treinamento já é uma opção presente no Livro Básico."), true);
t("e fecha com o teto",
  hab.descricao.endsWith("9° nível. A partir do 10° nível, pode obter uma habilidade a mais."), true);
t("e mantém os sucessos",
  hab.descricao.includes("Caso não consiga completar o treinamento, você mantém os seus sucessos, podendo tentar novamente em outro interlúdio."), true);
t("a paráfrase antiga saiu", hab.descricao.includes("três sucessos concluem"), false);

/* ============================================================ */
/* 2. OS TETOS                                                   */
/* ============================================================ */
const tetos = (sistema) => [9, 10, 20, 30].map((n) => T.tetosDeTreinoEspecial(ficha(sistema, n)));
t("a criatura segue 1 + ND/5 e 1 + ND/10", tetos("afty"), [
  { tes_feitico: 2, tes_habilidade: 1 },
  { tes_feitico: 3, tes_habilidade: 2 },
  { tes_feitico: 5, tes_habilidade: 3 },
  { tes_feitico: 7, tes_habilidade: 4 },
]);
t("o jogador: Feitiço sem teto, Habilidade 1 até o 9° e 2 daí em diante", tetos("player"), [
  { tes_feitico: null, tes_habilidade: 1 },
  { tes_feitico: null, tes_habilidade: 2 },
  { tes_feitico: null, tes_habilidade: 2 },
  { tes_feitico: null, tes_habilidade: 2 },
]);
t("sem sistema no contexto vale a régua da criatura",
  T.maxVezesTreinoEspecial("tes_habilidade", { nd: 30 }), 4);

// O aparo é de LEITURA: a pega excedente volta quando o nível sobe.
const excedente = ficha("player", 9, { tes_habilidade: 2, tes_feitico: 12 });
t("no 9° a segunda Habilidade não conta", T.vezesPorTreinoEspecial(excedente).tes_habilidade, 1);
t("e doze Feitiços contam, sem teto", T.vezesPorTreinoEspecial(excedente).tes_feitico, 12);
t("e a pega não saiu da ficha", excedente.treinosEspeciais.length, 14);
excedente.core.nd = 10;
t("no 10° ela volta", T.vezesPorTreinoEspecial(excedente).tes_habilidade, 2);
t("a Habilidade não passa de 2 no jogador de nível 30",
  T.vezesPorTreinoEspecial(ficha("player", 30, { tes_habilidade: 4 })).tes_habilidade, 2);

/* ============================================================ */
/* 3. O PROGRESSO DA LINHA                                       */
/* ============================================================ */
// O exemplo do autor: 9 Interlúdios para 3 Feitiços.
const exemplo = ficha("player", 10, { tes_feitico: 3 }, { tes_feitico: { interludios: 9, sucessos: 1 } });
t("9 Interlúdios, 1 Sucesso e 3 Ganhos",
  T.progressoTreinoEspecial(exemplo, "tes_feitico"), { interludios: 9, sucessos: 1, ganhos: 3 });
t("a linha sem nada anotado", T.progressoTreinoEspecial(exemplo, "tes_habilidade"),
  { interludios: 0, sucessos: 0, ganhos: 0 });
/* ⚠ A ficha anterior a 2026-09-16 tem pegas e nenhum Interlúdio: cada Ganho vale
   ao menos um Interlúdio, senão os Focos daquelas pegas voltariam calados. */
t("Ganhos sem Interlúdio anotado contam um Interlúdio cada",
  T.progressoTreinoEspecial(ficha("player", 10, { tes_feitico: 3 }), "tes_feitico").interludios, 3);
t("e o anotado abaixo dos Ganhos sobe até eles",
  T.progressoTreinoEspecial(ficha("player", 10, { tes_feitico: 3 }, { tes_feitico: { interludios: 1 } }), "tes_feitico").interludios, 3);
t("Sucessos param em um a menos que os três necessários",
  T.progressoTreinoEspecial(ficha("player", 10, {}, { tes_feitico: { interludios: 2, sucessos: 7 } }), "tes_feitico").sucessos, 2);
t("lixo vira zero",
  T.progressoTreinoEspecial(ficha("player", 10, {}, { tes_feitico: { interludios: "abc", sucessos: -3 } }), "tes_feitico"),
  { interludios: 0, sucessos: 0, ganhos: 0 });
t("Interlúdio quebrado é aparado",
  T.progressoTreinoEspecial(ficha("player", 10, {}, { tes_feitico: { interludios: 4.9 } }), "tes_feitico").interludios, 4);
t("id desconhecido não quebra", T.progressoTreinoEspecial(exemplo, "tes_nada"), { interludios: 0, sucessos: 0, ganhos: 0 });
t("os Sucessos guardados de cada Treino", [T.maxSucessosGuardados(hab), T.maxSucessosGuardados({})], [2, 0]);

/* ============================================================ */
/* 4. OS FOCOS                                                   */
/* ============================================================ */
const misto = { tes_feitico: { interludios: 9, sucessos: 2 }, tes_habilidade: { interludios: 4 } };
t("no jogador os Focos são os Interlúdios",
  T.focosDeTreinosEspeciais(ficha("player", 10, { tes_feitico: 3, tes_habilidade: 1 }, misto)), 13);
t("na criatura são as pegas, e o anotado não conta",
  T.focosDeTreinosEspeciais(ficha("afty", 10, { tes_feitico: 3, tes_habilidade: 1 }, misto)), 4);
t("Interlúdio sem Ganho também gasta Foco no jogador",
  T.focosDeTreinosEspeciais(ficha("player", 10, {}, { tes_habilidade: { interludios: 2 } })), 2);

/* ============================================================ */
/* 5. A CD                                                       */
/* ============================================================ */
t("CD 12 + metade do Nível, para baixo",
  [1, 9, 10, 30].map((n) => T.cdDoTreinoEspecial(hab, ficha("player", n))), [12, 16, 17, 27]);
t("e a do Feitiço é a mesma", T.cdDoTreinoEspecial(T.getTreinoEspecial("tes_feitico"), ficha("player", 10)), 17);
t("entrada sem CD não tem CD", T.cdDoTreinoEspecial({ id: "tes_x" }, ficha("player", 10)), null);

/* ============================================================ */
/* 6. A VAGA SAI DOS GANHOS                                      */
/* ============================================================ */
const vagasFeitico = (f) => deriveAfty(f).orcamentoHabilidades.exclusivasFeitico;
const totalHabilidades = (f) => deriveAfty(f).habilidades.total;
const baseF = vagasFeitico(ficha("player", 10));
t("3 Ganhos de Feitiço são 3 vagas, com 9 Interlúdios",
  vagasFeitico(exemplo) - baseF, 3);
t("Interlúdios sem Ganho não dão vaga",
  vagasFeitico(ficha("player", 10, {}, { tes_feitico: { interludios: 9, sucessos: 2 } })), baseF);
const baseH = totalHabilidades(ficha("player", 10));
t("um Ganho de Habilidade é uma vaga",
  totalHabilidades(ficha("player", 10, { tes_habilidade: 1 }, { tes_habilidade: { interludios: 3 } })) - baseH, 1);

/* ============================================================ */
/* 7. A CRIATURA NÃO MUDA                                        */
/* ============================================================ */
const foto = (d) => JSON.stringify({ ...d, isOverridden: undefined });
for (const nivel of [4, 10, 25]) {
  const sem = deriveAfty(ficha("afty", nivel, { tes_feitico: 2, tes_habilidade: 1 }));
  const com = deriveAfty(ficha("afty", nivel, { tes_feitico: 2, tes_habilidade: 1 }, misto));
  t(`criatura ND ${nivel}: o progresso gravado não move número nenhum`, foto(com), foto(sem));
}

/* ============================================================ */
/* 8. AS DIVERGÊNCIAS E O VALIDADOR                              */
/* ============================================================ */
for (const id of ["interludioComTeste", "tetoDeTreinoEspecial"]) {
  const d = S.DIVERGENCIAS.find((x) => x.id === id);
  t(`${id} é regra ligada`, [d?.tipo, d?.ativa], ["regra", true]);
}
t("o catálogo do livro passa no validador", T.validarCatalogoTreinosEspeciais(), []);

const comEntrada = (extra) => {
  T.AFTY_TREINOS_ESPECIAIS.push({ id: "tes_teste", nome: "Teste", focos: 1, concede: "Nada", descricao: "x", ...extra });
  try { return T.validarCatalogoTreinosEspeciais(); } finally { T.AFTY_TREINOS_ESPECIAIS.pop(); }
};
t("CD com nome que não existe é reprovada", comEntrada({ cdTeste: "12 + nivel" }), ["tes_teste com cdTeste inválida"]);
t("escada fora de ordem é reprovada",
  comEntrada({ tetoJogador: [{ nivel: 10, max: 2 }, { nivel: 1, max: 1 }] }), ["tes_teste com tetoJogador inválido"]);
t("escada vazia é reprovada", comEntrada({ tetoJogador: [] }), ["tes_teste com tetoJogador inválido"]);
t("zero sucessos é reprovado", comEntrada({ sucessosNecessarios: 0 }), ["tes_teste com sucessosNecessarios inválido"]);
t("a entrada completa passa",
  comEntrada({ cdTeste: "15 + nd", sucessosNecessarios: 2, tetoJogador: [{ nivel: 1, max: 3 }] }), []);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
