/* A ALMA DO JOGADOR: o efeito que a aumenta, e o Dano na Alma que encolhe a Vida
   junto (autor, 2026-09-18).

   ------------------------------------------------------------
   OS TRÊS BUGS QUE ESTE ARQUIVO PRENDE
   ------------------------------------------------------------
   1. O MÁXIMO QUE SOBE NÃO LEVAVA A CORRENTE. Comprar a Consciência Absoluta da
      Alma levava o máximo de 162 para 187 e deixava a corrente em 162, calada. A
      barra abria em 162 de 187 e o efeito parecia não ter funcionado. O livro
      manda o contrário, verbatim: *"Sempre que seu máximo de Pontos de Vida
      aumentar, sua Integridade deve ser atualizada."*

   2. O DANO NA ALMA NÃO ENCOSTAVA NA VIDA. No jogador o `almaMult` vale 1, então
      `opcoes.almaAtual` não entrava na conta do PV: a Alma caía sozinha, e o PV
      máximo ficava parado. Pedido do autor: *"Vida Máxima de Jogador é igual a
      Alma Atual. E Dano na Alma também é Dano na Vida."*

   3. O +25 ERA INVISÍVEL NO HOVER. O canal `almaMax` somava no PV do jogador sem
      aparecer nas parcelas, e elas fechavam em 162 contra um total de 187. Número
      certo com detalhamento errado é bug, e é a mesma regra do `defesaAtributo`.

   ⚠ A CRIATURA É O CONTROLE, e está aqui de propósito: a Alma dela é PORCENTAGEM
   e já multiplica o PV pelo `almaMult`. Descontar de novo cobraria a mesma perda
   duas vezes, e é o erro mais fácil de cometer neste arquivo. Metade dos asserts
   abaixo existe só para provar que nada do lado dela mudou. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const SE = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Nível 26, Combatente: 162 de PV base. O `extra` entra pelo canal `hp` de um
   Funcionamento Básico adicional, que é a porta mais curta para um número
   redondo. Com 338 a ficha fica com os 500 do exemplo do autor. */
const ficha = (sistema, { len = [], extra = 0 } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 26, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel: 26 }];
  f.habilidadesLendarias = len;
  if (extra) {
    f.core.funcionamentosAdicionais = [
      { id: "fb_escala", nome: "Escala do teste", efeitos: [{ canal: "hp", expr: String(extra) }] },
    ];
  }
  return f;
};
/* Deriva com a Alma corrente da sessão, que é o que a Ficha Final faz. */
const comAlma = (f, sessao) => deriveAfty(f, { almaAtual: sessao.almaAtual });

/* ============================================================ */
/* 1. O EFEITO QUE AUMENTA A ALMA                                */
/* ============================================================ */
const semLenda = deriveAfty(ficha("player"));
const comLenda = deriveAfty(ficha("player", { len: ["len_consciencia_absoluta_da_alma"] }));

t("a ficha base do teste tem 162 de PV", semLenda.hp, 162);
t("o máximo da Alma é o PV", semLenda.almaMax, semLenda.hp);
t("a Lendária soma 25 na Alma", comLenda.almaMax, 187);
t("e os mesmos 25 na Vida", comLenda.hp, 187);

/* O HOVER. A parcela precisa existir, ter o nome da fonte, e as parcelas
   precisam somar o total: era o bug 3. */
const somaPartes = (d) => d.partes.hp.reduce(
  (a, p) => a + (typeof p.valor === "number" ? p.valor : 0), 0);
t("o hover nomeia a Lendária",
  comLenda.partes.hp.some((p) => p.label === "Consciência Absoluta da Alma" && p.valor === 25), true);
t("as parcelas do PV somam o total, com a Lendária", somaPartes(comLenda), comLenda.hp);
t("e sem ela também", somaPartes(semLenda), semLenda.hp);
/* ⚠ CONTRAPROVA: na criatura o mesmo canal é porcentagem e NÃO pode virar uma
   parcela somada, senão ele entraria duas vezes (uma aqui e outra no `almaMult`). */
const criaturaLenda = deriveAfty(ficha("afty", { len: ["len_consciencia_absoluta_da_alma"] }));
t("na criatura a Lendária não vira parcela somada do PV",
  criaturaLenda.partes.hp.some((p) => p.label === "Consciência Absoluta da Alma"), false);
t("na criatura ela vira o multiplicador de sempre",
  criaturaLenda.partes.hp.some((p) => p.label === "Integridade da Alma" && p.texto === "×1,25"), true);

/* ============================================================ */
/* 2. O MÁXIMO QUE SOBE LEVA A CORRENTE JUNTO                    */
/* ============================================================ */
/* A ficha do dia 1 joga, grava, e no dia 2 o jogador compra a Lendária. */
const f1 = ficha("player");
const f2 = ficha("player", { len: ["len_consciencia_absoluta_da_alma"] });
let dia1 = SE.normalizaSessao(null, deriveAfty(f1));
t("dia 1: a sessão nasce com a Alma cheia", [dia1.almaAtual, dia1.almaMaxVisto], [162, 162]);

const reabre = (sessao, f) => {
  const d = deriveAfty(f, { almaAtual: sessao.almaAtual });
  return SE.aparaSessao(SE.normalizaSessao(sessao, d), d);
};
let dia2 = reabre(dia1, f2);
t("dia 2: a Alma corrente sobe os 25 junto com o máximo", dia2.almaAtual, 187);
t("e o máximo visto acompanha", dia2.almaMaxVisto, 187);
t("dia 2: o PV máximo chega nos 187", comAlma(f2, dia2).hp, 187);

/* ⚠ ALMA FERIDA CONTINUA FERIDA DO MESMO TANTO (autor, 2026-09-18): a subida é
   SOMADA, e não usada para encher. 400 de 500 que ganha 25 vira 425 de 525. */
const g500 = ficha("player", { extra: 338 });
const g525 = ficha("player", { extra: 338, len: ["len_consciencia_absoluta_da_alma"] });
t("a ficha grande do teste tem os 500 do exemplo", deriveAfty(g500).hp, 500);
let ferida = SE.normalizaSessao(null, deriveAfty(g500));
ferida = SE.aplicaDanoNaAlma(ferida, 100, deriveAfty(g500));
t("ferida: 400 de 500", [ferida.almaAtual, comAlma(g500, ferida).almaMax], [400, 500]);
const feridaDepois = reabre(ferida, g525);
t("ferida que ganha 25: vira 425 de 525, e não 525 de 525",
  [feridaDepois.almaAtual, comAlma(g525, feridaDepois).almaMax], [425, 525]);

/* O máximo que DESCE (a Lendária removida) não inventa ganho nenhum, e a
   corrente é aparada. */
const voltou = reabre(feridaDepois, g500);
t("o máximo que desce apara a corrente", voltou.almaAtual, 425);
t("e o máximo visto desce junto", voltou.almaMaxVisto, 500);

/* ============================================================ */
/* 3. OS DOIS EXEMPLOS DO AUTOR, LITERAIS                        */
/* ============================================================ */
/* *"caso eu tenha 500 de HP e Alma. e tome 100 de Dano na Alma. É para eu ficar
   com 400 de 500 de Alma e 400 de 400 de Vida Máxima."* */
let A = SE.normalizaSessao(null, deriveAfty(g500));
t("A: começa em 500 de 500 de Vida", [A.hpAtual, deriveAfty(g500).hp], [500, 500]);
A = SE.aplicaDanoNaAlma(A, 100, deriveAfty(g500));
let dA = comAlma(g500, A);
A = SE.aparaSessao(A, dA);
t("A: Alma 400 de 500", [A.almaAtual, dA.almaMax], [400, 500]);
t("A: Vida 400 de 400", [A.hpAtual, dA.hp], [400, 400]);

/* *"estou com 250 de 500 de HP Máximo. Tomo 100 de Dano na Alma, eu fico com 150
   de 400 de HP máximo."* ⚠ É ESTE que prova a necessidade do verbo: só aparar no
   novo máximo deixaria 250 de 400, porque 250 já cabe em 400. */
let B = SE.normalizaSessao(null, deriveAfty(g500));
B = { ...B, hpAtual: 250 };
B = SE.aplicaDanoNaAlma(B, 100, deriveAfty(g500));
let dB = comAlma(g500, B);
B = SE.aparaSessao(B, dB);
t("B: Vida 150 de 400", [B.hpAtual, dB.hp], [150, 400]);
t("B: Alma 400 de 500", [B.almaAtual, dB.almaMax], [400, 500]);

/* ============================================================ */
/* 4. A CURA NA ALMA SÓ DEVOLVE O TETO                           */
/* ============================================================ */
/* Autor, 2026-09-18: o máximo volta, e o PV que faltava se cura pelos meios
   normais. Ela NÃO é o dano com o sinal trocado. */
B = SE.curaAlma(B, 100, dB);
dB = comAlma(g500, B);
t("cura na Alma devolve o máximo", [B.almaAtual, dB.almaMax, dB.hp], [500, 500, 500]);
t("e NÃO devolve a Vida corrente", B.hpAtual, 150);
t("a cura não passa do máximo", SE.curaAlma(B, 999, dB).almaAtual, 500);

/* ============================================================ */
/* 5. A CASCA DE PV NÃO PROTEGE A ALMA                           */
/* ============================================================ */
/* Autor, 2026-09-18. É a diferença para o `aplicaDano`, que drena a casca
   primeiro: a casca é vida emprestada por fora, e a alma encolhe por dentro. */
let C = SE.normalizaSessao(null, deriveAfty(g500));
C = { ...C, pvTempFontes: { "Guarda Inabalável": 50 } };
const cDepois = SE.aplicaDanoNaAlma(C, 100, deriveAfty(g500));
t("o PV temporário sai intacto do Dano na Alma",
  cDepois.pvTempFontes, { "Guarda Inabalável": 50 });
t("e o PV corrente desce o valor cheio", cDepois.hpAtual, 400);
/* Contraprova com o dano COMUM, que come a casca. ⚠ A fonte esgotada é APAGADA
   do mapa pelo `drenaPvTemp`, e não zerada: por isso a chave some. */
t("o dano comum continua comendo a casca",
  [SE.aplicaDano(C, 100).hpAtual, SE.aplicaDano(C, 100).pvTempFontes], [450, {}]);

/* ============================================================ */
/* 6. O CAMPO ABSOLUTO CONCORDA COM O BOTÃO                      */
/* ============================================================ */
/* `defineAlma` existe para digitar 400 numa Alma de 500 valer o mesmo que clicar
   em -100. Sem ele o campo mexia só na Alma e o jogador fugia do dano digitando. */
let D = SE.normalizaSessao(null, deriveAfty(g500));
const porCampo = SE.defineAlma(D, 400, deriveAfty(g500));
const porBotao = SE.aplicaDanoNaAlma(D, 100, deriveAfty(g500));
t("digitar 400 é o mesmo que clicar em -100",
  [porCampo.almaAtual, porCampo.hpAtual], [porBotao.almaAtual, porBotao.hpAtual]);
t("digitar para CIMA cura, e não devolve Vida",
  [SE.defineAlma(porCampo, 500, deriveAfty(g500)).almaAtual,
    SE.defineAlma(porCampo, 500, deriveAfty(g500)).hpAtual], [500, 400]);

/* ============================================================ */
/* 7. A MIGRAÇÃO ÚNICA DAS SESSÕES JÁ GRAVADAS                   */
/* ============================================================ */
/* Sessão anterior a 2026-09-18 não tem `almaMaxVisto`. A de JOGADOR abre CHEIA
   (autor, 2026-09-18), porque o número gravado não distingue alma ferida de alma
   que ficou para trás, e preservá-lo deixaria toda ficha existente com menos Vida
   máxima do que tem direito. */
const velhaJogador = { ...SE.normalizaSessao(null, deriveAfty(f1)), almaAtual: 162 };
delete velhaJogador.almaMaxVisto;
const migrada = SE.normalizaSessao(velhaJogador, comLenda);
t("sessão velha de jogador abre com a Alma cheia", migrada.almaAtual, 187);
t("e passa a registrar o máximo visto", migrada.almaMaxVisto, 187);

/* ⚠ A CRIATURA NÃO É TOCADA: lá o número gravado é ferida de verdade. */
const dCriatura = deriveAfty(ficha("afty"));
const velhaCriatura = { ...SE.normalizaSessao(null, dCriatura), almaAtual: 60 };
delete velhaCriatura.almaMaxVisto;
const migradaC = SE.normalizaSessao(velhaCriatura, dCriatura);
t("sessão velha de criatura mantém a ferida", migradaC.almaAtual, 60);
/* E a segunda leitura não mexe mais em ninguém: a migração é de uma vez só. */
t("a migração não se repete", SE.normalizaSessao(migrada, comLenda).almaAtual, 187);

/* ============================================================ */
/* 8. A CRIATURA, DO COMEÇO AO FIM, NÃO MUDOU                    */
/* ============================================================ */
const fc = ficha("afty");
t("criatura: a Alma segue com máximo 100", deriveAfty(fc).almaMax, 100);
t("criatura: a Alma segue multiplicando o PV",
  [60, 80, 100].map((a) => deriveAfty(fc, { almaAtual: a }).hp), [81, 108, 135]);
t("criatura: o máximo da Alma NÃO é o PV", deriveAfty(fc).almaMax === deriveAfty(fc).hp, false);
/* ⚠ O ASSERT MAIS IMPORTANTE DO ARQUIVO: Dano na Alma na criatura NÃO desce o PV
   corrente. O teto dela já caiu pelo `almaMult`, e descontar aqui cobraria a
   mesma perda duas vezes. */
let E = SE.normalizaSessao(null, deriveAfty(fc));
const eDepois = SE.aplicaDanoNaAlma(E, 20, deriveAfty(fc));
t("criatura: o Dano na Alma não toca o PV corrente", eDepois.hpAtual, E.hpAtual);
t("criatura: mas a Alma cai", eDepois.almaAtual, 80);
t("criatura: e o PV máximo cai pelo multiplicador, como sempre",
  deriveAfty(fc, { almaAtual: eDepois.almaAtual }).hp, 108);

/* ============================================================ */
/* 9. O CRIADOR NUNCA VÊ NADA DISSO                              */
/* ============================================================ */
/* Sem `opcoes.almaAtual` a ficha é montada íntegra, que é a promessa antiga do
   `almaMult` e continua valendo para o ramo novo. */
t("sem almaAtual o jogador sai íntegro", [deriveAfty(g500).hp, deriveAfty(g500).almaMax], [500, 500]);
t("sem almaAtual a criatura sai íntegra", [deriveAfty(fc).hp, deriveAfty(fc).almaMax], [135, 100]);
t("e o hover não inventa a linha de Dano na Alma",
  deriveAfty(g500).partes.hp.some((p) => p.label === "Dano na Alma"), false);
t("que aparece, negativa, quando a Alma está ferida",
  comAlma(g500, A).partes.hp.some((p) => p.label === "Dano na Alma" && p.valor === -100), true);
t("e as parcelas continuam somando o total com ela", somaPartes(comAlma(g500, A)), comAlma(g500, A).hp);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
