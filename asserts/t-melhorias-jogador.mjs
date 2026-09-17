/**
 * AS MELHORIAS SUPERIORES DO JOGADOR, E A VERSATILIDADE EXTREMA QUE ELE PERDE
 * (autor, 2026-09-17).
 *
 * Pedidos: *"Na Ficha de Jogador, deixe as Melhorias Superiores assim. Elas são
 * diferentes de Jogador para Grimorio."*, com o texto das onze, e *"E remova
 * "Versatilidade Extrema" das Habilidades Lendarias de JOGADOR. Quem tinha isso,
 * deve ser REMOVIDO. [...] qlqr pessoa com isso, precisa PERDER esse poder."*
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O texto do jogador, verbatim, e a criatura com o dela.
 * 2. O teto de repetição de cada sistema, no mesmo id.
 * 3. Os números das quatro que mudam, na ficha inteira, nos dois sistemas.
 * 4. As sete iguais seguem iguais.
 * 5. A Versatilidade Extrema: fora da lista, fora da ficha que a tinha, sem os
 *    efeitos e sem a vaga, e de volta com o Addon que a libera.
 * 6. As duas divergências e o validador do bloco `jogador`.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AN = await import(R + "afty-alto-nivel.js");
const ADD = await import(R + "afty-addons.js");
const S = await import(R + "afty-sistema.js");
const EC = await import(R + "afty-efeitos-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Nível 26 e Maestria 8: metade da Maestria dá 4, e assim os números da
   criatura nunca coincidem com os +3 e +6 do jogador por acaso. */
const ficha = (sistema, { mel = [], len = [], addons = [] } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 26, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel: 26 }];
  f.melhoriasSuperiores = mel;
  f.habilidadesLendarias = len;
  f.escolhasAltoNivel = { len_versatilidade_extrema: ["dom"] };
  f.addons = addons;
  return f;
};
const d = (sistema, opcoes) => deriveAfty(ficha(sistema, opcoes));

/* ============================================================ */
/* 1. O TEXTO                                                    */
/* ============================================================ */
const mel = (id, sistema) => AN.getMelhoriaSuperior(id, sistema);
t("jogador: a Defesa se chama Classe de Armadura", mel("mel_defesa", "player").nome, "Melhoria de Classe de Armadura");
t("criatura: continua Melhoria de Defesa", mel("mel_defesa", "afty").nome, "Melhoria de Defesa");
t("sem sistema vale a da criatura", AN.getMelhoriaSuperior("mel_defesa").nome, "Melhoria de Defesa");
t("jogador: o texto da Classe de Armadura",
  mel("mel_defesa", "player").descricao,
  "Seja por resistência ou esquivando, te acertar é mais difícil. Sua Classe de Armadura aumenta em 3. Você pode pegar esta melhoria uma segunda vez, aumentando em mais 2.");
t("jogador: o texto da Classe de Dificuldade",
  mel("mel_classe_de_dificuldade", "player").descricao,
  "Com técnicas e habilidades refinadas, resistir a elas se torna mais difícil. A CD de todas suas habilidades de técnica, aptidões amaldiçoadas e habilidades de especialização aumenta em 3. Você pode pegar esta melhoria uma segunda vez, aumentando em mais 2.");
t("jogador: o texto da Energia",
  mel("mel_energia", "player").descricao,
  "A energia amaldiçoada é cultivada com mais facilidade e naturalidade em seu interior. Seu máximo de pontos de energia amaldiçoada aumenta em 6. Você pode pegar esta melhoria uma segunda vez, aumentando em mais 4.");
t("jogador: o texto do Movimento",
  mel("mel_movimento", "player").descricao,
  "Agilidade e velocidade são importantes. Seu valor de movimento aumenta em 6 metros.");
t("o bloco do jogador não vaza para o resultado",
  ["afty", "player"].map((s) => "jogador" in mel("mel_defesa", s)), [false, false]);
t("o catálogo do jogador tem as onze, na ordem do livro",
  AN.melhoriasSuperioresDe("player").map((m) => m.nome),
  ["Melhoria de Alma", "Melhoria de Atenção", "Melhoria de Classe de Armadura", "Melhoria de Classe de Dificuldade",
    "Melhoria de Dano", "Melhoria de Energia", "Melhoria de Movimento", "Melhoria de Perícia",
    "Melhoria de Precisão", "Melhoria de Resistência", "Melhoria de Vida"]);
t("e a ficha derivada entrega esse catálogo à tela",
  d("player").altoNivel.catalogo.melhorias.find((m) => m.id === "mel_defesa").nome, "Melhoria de Classe de Armadura");

/* ============================================================ */
/* 2. O TETO DE REPETIÇÃO                                        */
/* ============================================================ */
const vezes = (sistema, ids) => d(sistema, { mel: ids }).altoNivel.melhorias.escolhidas;
const duasDeCada = ["mel_defesa", "mel_defesa", "mel_classe_de_dificuldade", "mel_classe_de_dificuldade",
  "mel_energia", "mel_energia", "mel_movimento", "mel_movimento"];
t("jogador: três repetem duas vezes, e o Movimento não",
  vezes("player", duasDeCada).map((m) => [m.id, m.vezes]),
  [["mel_defesa", 2], ["mel_classe_de_dificuldade", 2], ["mel_energia", 2], ["mel_movimento", 1]]);
t("criatura: nenhuma das quatro repete",
  vezes("afty", duasDeCada).map((m) => m.vezes), [1, 1, 1, 1]);

/* ============================================================ */
/* 3. OS NÚMEROS                                                 */
/* ============================================================ */
const ganho = (sistema, ids) => {
  const base = d(sistema);
  const com = d(sistema, { mel: ids });
  return { def: com.defesa - base.defesa, cd: com.cd - base.cd, pe: com.pe - base.pe, mov: com.movimento - base.movimento };
};
const umaDeCada = ["mel_defesa", "mel_classe_de_dificuldade", "mel_energia", "mel_movimento"];
t("jogador: uma pega de cada", ganho("player", umaDeCada), { def: 3, cd: 3, pe: 6, mov: 6 });
t("jogador: a segunda pega soma 2, 2 e 4", ganho("player", duasDeCada), { def: 5, cd: 5, pe: 10, mov: 6 });
t("criatura: metade da Maestria, a Maestria e o movimento dela", ganho("afty", umaDeCada), { def: 4, cd: 4, pe: 8, mov: 6 });
t("criatura: a segunda pega não conta", ganho("afty", duasDeCada), { def: 4, cd: 4, pe: 8, mov: 6 });

/* O hover diz o nome do livro da ficha. */
const partesDef = d("player", { mel: ["mel_defesa"] }).partes.defesa.map((p) => p.label);
t("o hover de Defesa do jogador nomeia a Classe de Armadura", partesDef.some((l) => l.includes("Classe de Armadura")), true);

/* ============================================================ */
/* 4. AS SETE IGUAIS                                             */
/* ============================================================ */
for (const id of ["mel_alma", "mel_atencao", "mel_dano", "mel_pericia", "mel_precisao", "mel_resistencia", "mel_vida"]) {
  const [a, p] = ["afty", "player"].map((s) => mel(id, s));
  t(`${id}: mesmo texto e mesmo teto nos dois`, [p.nome, p.descricao, p.maxVezes], [a.nome, a.descricao, a.maxVezes]);
}
/* ⚠ O número de Vida e Alma NÃO sai igual nos dois, e não é por causa das
   Melhorias: no jogador a Alma É o PV (divergência `pvPePorEspecializacao`).
   O que prova "iguais" é a linha do motor, e o mapa do jogador ter só as quatro. */
t("o mapa do jogador troca só as quatro", Object.keys(EC.MELHORIA_EFEITOS_JOGADOR).sort(),
  ["mel_classe_de_dificuldade", "mel_defesa", "mel_energia", "mel_movimento"]);

/* ============================================================ */
/* 5. A VERSATILIDADE EXTREMA                                    */
/* ============================================================ */
const VE = "len_versatilidade_extrema";
const LIBERA = { id: "casa", nome: "Casa", versao: "1.0.0", acrescenta: {}, libera: [ADD.liberacaoSoPorAddon(VE)] };
const OUTRA = { id: "outra", nome: "Outra", versao: "1.0.0", acrescenta: {}, libera: ["estiloSombras"] };
const naLista = (dd) => dd.altoNivel.catalogo.lendarias.some((l) => l.id === VE);

const jogSem = d("player");
const jogCom = d("player", { len: [VE] });
const criCom = d("afty", { len: [VE] });
const criSem = d("afty");

t("criatura: continua na lista", naLista(criSem), true);
t("criatura: quem tem continua tendo", criCom.altoNivel.lendarias.escolhidas, [VE]);
t("criatura: e ganha o limite 6", criCom.aptidao.limite.dom, 6);
t("jogador: sai da lista", naLista(jogSem), false);
t("jogador: e sai da lista de quem JÁ TINHA", naLista(jogCom), false);
t("jogador: quem tinha perde", jogCom.altoNivel.lendarias.escolhidas, []);
t("jogador: e a vaga volta", jogCom.altoNivel.lendarias.gastos, 0);
t("jogador: sem o limite 6", jogCom.aptidao.limite.dom, jogSem.aptidao.limite.dom);
t("jogador: sem os 2 níveis de aptidão", jogCom.totalAptidao, jogSem.totalAptidao);
t("jogador: sem a escolha aninhada dela", jogCom.altoNivel.escolhas.mapa[VE], undefined);
t("jogador: o id continua gravado na ficha", ficha("player", { len: [VE] }).habilidadesLendarias, [VE]);

const jogLiberado = d("player", { len: [VE], addons: [LIBERA] });
t("com o Addon que a libera, volta à lista", naLista(jogLiberado), true);
t("e quem tinha volta a ter", jogLiberado.altoNivel.lendarias.escolhidas, [VE]);
t("com o limite 6", jogLiberado.aptidao.limite.dom, 6);
t("um Addon que libera outra coisa não a devolve", d("player", { len: [VE], addons: [OUTRA] }).altoNivel.lendarias.escolhidas, []);

/* As outras Lendárias não são tocadas. */
const outraLendaria = AN.HABILIDADES_LENDARIAS.find((l) => l.id !== VE && !(l.requisitos ?? []).length);
t("uma Lendária vizinha segue na lista do jogador", jogSem.altoNivel.catalogo.lendarias.some((l) => l.id === outraLendaria.id), true);
t("a lista do jogador tem exatamente uma a menos",
  criSem.altoNivel.catalogo.lendarias.length - jogSem.altoNivel.catalogo.lendarias.length, 1);

t("perdidaNoJogador: só com a marca, no jogador, sem o Addon",
  [ADD.perdidaNoJogador(AN.getHabilidadeLendaria(VE), ficha("player")),
    ADD.perdidaNoJogador(AN.getHabilidadeLendaria(VE), ficha("afty")),
    ADD.perdidaNoJogador(AN.getHabilidadeLendaria(VE), ficha("player", { addons: [LIBERA] })),
    ADD.perdidaNoJogador(outraLendaria, ficha("player"))],
  [true, false, false, false]);

/* ============================================================ */
/* 6. AS DIVERGÊNCIAS E O VALIDADOR                              */
/* ============================================================ */
for (const id of ["melhoriasSuperioresDoJogador", "perdidoNoJogador"]) {
  const div = S.DIVERGENCIAS.find((x) => x.id === id);
  t(`${id} é regra ligada`, [div?.tipo, div?.ativa], ["regra", true]);
}
t("o catálogo passa no validador", AN.validarCatalogoAltoNivel(), []);
const defesa = AN.MELHORIAS_SUPERIORES.find((m) => m.id === "mel_defesa");
const guardado = defesa.jogador;
defesa.jogador = { nome: "", descricao: "x", maxVezes: 0 };
const reprovado = AN.validarCatalogoAltoNivel();
defesa.jogador = guardado;
t("bloco do jogador incompleto é reprovado", reprovado.length, 2);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
