/* A concessão do lado da SESSÃO: gravar, ler de volta, e a garantia de que ela
   NUNCA encosta na ficha salva (Addons 8.3, decisão do autor de 2026-08-20). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

/* localStorage de mentira, igual ao do t-biblioteca. */
const loja = new Map();
globalThis.localStorage = {
  getItem: (k) => (loja.has(k) ? loja.get(k) : null),
  setItem: (k, v) => loja.set(k, String(v)),
  removeItem: (k) => loja.delete(k),
};

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { AFTY_TALENTOS } = await import(R + "afty-talentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const TAL = AFTY_TALENTOS[0].id;

/* ============================================================ */
/* 1. O CAMPO NASCE E SOBREVIVE                                  */
/* ============================================================ */

t("sessao em branco tem o campo", S.sessaoEmBranco().concedido, []);
t("normaliza sessao vazia", S.normalizaSessao(null).concedido, []);
t("normaliza sessao sem o campo", S.normalizaSessao({ hpAtual: 5 }).concedido, []);
t("campo com lixo vira vazio", S.normalizaSessao({ concedido: "abc" }).concedido, []);
t("campo com entrada invalida a descarta",
  S.normalizaSessao({ concedido: [{ familia: "nao_existe", id: "x" }] }).concedido, []);

/* ============================================================ */
/* 2. OS ESCRITORES                                              */
/* ============================================================ */

const s0 = S.sessaoEmBranco();
const s1 = S.concedeNaSessao(s0, "talentos", TAL);
t("concede acrescenta", s1.concedido.length, 1);
t("concede NAO muda a sessao de entrada", s0.concedido.length, 0);
t("concede devolve sessao NOVA", s1 !== s0, true);
t("concede preserva o resto da sessao", s1.hpAtual, s0.hpAtual);

/* ⚠ IDENTIDADE NOVA IMPORTA: o cache do Encontro compara a lista por
   identidade, e um escritor que devolvesse a mesma referencia faria a concessao
   nao mudar numero nenhum. */
t("a LISTA tambem e nova", s1.concedido !== s0.concedido, true);

/* Nada a fazer devolve a MESMA sessao, para nao invalidar memo a toa. */
t("familia invalida devolve a mesma sessao", S.concedeNaSessao(s1, "xxx", "a"), s1);
t("id vazio devolve a mesma sessao", S.concedeNaSessao(s1, "talentos", ""), s1);
t("remover uid inexistente devolve a mesma sessao", S.removeConcessao(s1, "nada"), s1);

const s2 = S.removeConcessao(s1, s1.concedido[0].uid);
t("remove tira", s2.concedido.length, 0);
t("remove NAO muda a de entrada", s1.concedido.length, 1);

/* Repetivel: duas pegas iguais, e tirar uma deixa a outra. */
const sRep = S.concedeNaSessao(S.concedeNaSessao(s0, "gerais", "ger_x"), "gerais", "ger_x");
t("repetivel entra duas vezes", sRep.concedido.length, 2);
const sRepMenos = S.removeConcessao(sRep, sRep.concedido[1].uid);
t("tira so a apontada", sRepMenos.concedido.length, 1);
t("e sobra a outra", sRepMenos.concedido[0].uid, sRep.concedido[0].uid);

/* ============================================================ */
/* 3. GRAVAR E LER DE VOLTA                                      */
/* ============================================================ */

loja.clear();
S.salvarSessao("crt-1", s1);
const lida = S.carregarSessao("crt-1");
t("sobrevive ao armazenamento", lida.concedido.length, 1);
t("id sobrevive", lida.concedido[0].id, TAL);
t("familia sobrevive", lida.concedido[0].familia, "talentos");
t("uid sobrevive", lida.concedido[0].uid, s1.concedido[0].uid);

/* ⚠ "MORRE COM A SESSAO": limpar a sessao apaga a concessao junto. */
S.limparSessao("crt-1");
t("limpar a sessao mata a concessao", S.carregarSessao("crt-1").concedido, []);

/* JSON corrompido nao pode derrubar nada. */
loja.set("fm_ficha_sessao_afty_v1:crt-2", "{{{ nao e json");
t("json corrompido vira sessao nova", S.carregarSessao("crt-2").concedido, []);

/* ============================================================ */
/* 4. O APARO PRESERVA A CONCESSÃO                               */
/* ============================================================ */
/* O `aparaSessao` roda a cada escrita e a cada render da Ficha. Se ele perdesse
   o campo, a concessao sumiria no primeiro clique em qualquer outra coisa. */

const criatura = createBlankAfty();
criatura.core.nd = 20;
const d = deriveAfty(criatura);
const sAlta = { ...s1, hpAtual: 999999 };
const aparada = S.aparaSessao(sAlta, d);
t("o aparo mexeu no PV", aparada.hpAtual < 999999, true);
t("e PRESERVOU a concessao", aparada.concedido.length, 1);

/* Aparo que nao tem nada a fazer devolve a mesma sessao, com o campo intacto. */
const semAparar = S.aparaSessao(S.aparaSessao(sAlta, d), d);
t("aparo idempotente preserva", semAparar.concedido.length, 1);

/* Descansar enche os recursos e NAO desfaz a concessao: descanso nao e o fim
   da sessao, e a decisao do autor amarra a concessao a SESSAO. */
const descansada = S.descansar(aparada, d);
t("descansar preserva a concessao", descansada.concedido.length, 1);

/* Dano e cura passam pelo spread e nao podem perder o campo. */
t("dano preserva", S.aplicaDano(aparada, 5).concedido.length, 1);
t("cura preserva", S.aplicaCura(aparada, 5, d.hp).concedido.length, 1);
/* ⚠ A rodada NAO expira a concessao: buff e condicao descem o contador, a
   concessao nao tem contador nenhum. Ela vive ate a sessao acabar. */
t("proxima rodada preserva", S.proximaRodada(aparada).sessao.concedido.length, 1);
t("e nao a poe na lista de expirados",
  S.proximaRodada(aparada).expirou.some((x) => x.familia === "talentos"), false);

/* ============================================================ */
/* 5. A FICHA SALVA NUNCA É TOCADA                               */
/* ============================================================ */
/* É a decisão "morre com a sessão", vista do outro lado: se a concessão
   vazasse para a criatura, o Salvar do criador a gravaria para sempre. */

const antesJson = JSON.stringify(criatura);
const sConc = S.concedeNaSessao(S.sessaoEmBranco(d), "talentos", TAL);
const dCom = deriveAfty(
  { ...criatura, combate: sConc.combate },
  { almaAtual: sConc.almaAtual, concedido: sConc.concedido },
);
t("a concessao valeu", dCom.talentos.escolhidas.includes(TAL), true);
t("a ficha nao mudou UM BYTE", JSON.stringify(criatura), antesJson);
t("a ficha nao ganhou o campo", "concedido" in criatura, false);
t("e nao entrou na lista de talentos dela", criatura.talentos.length, 0);

/* E o caminho inverso: a concessao NAO aparece num export da criatura. */
t("export da criatura nao leva concessao",
  JSON.stringify(criatura).includes("concedido"), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
