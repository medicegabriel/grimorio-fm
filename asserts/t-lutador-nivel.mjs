/* OS PODERES POR NÍVEL DO LUTADOR, medidos um a um.

   Começou no 2° e no 4° (29 poderes), na varredura de 2026-09-01. O arquivo
   cresce por nível conforme o autor pede a conferência dos de cima.

   O que ele mede, em ordem:

     1. OS PRÉ-REQUISITOS BLOQUEIAM. Três apontam para outra habilidade e um pede
        atributo, e os quatro têm de reprovar sem o que pedem.

     2. CADA EFEITO, NO SEU DEGRAU. Os números saem do deriveAfty, num nível de
        cada lado de cada degrau escrito no livro.

     3. ⚠ O ESCOPO DE "DESARMADO". Caminho da Mão Vazia e Impacto Misto dizem
        "desarmado" e miravam o TIPO de ataque `corpo`, que é toda arma de corpo
        a corpo. O Caminho ainda somava a Maestria no dano SEM alvo nenhum, então
        ela caía até no Arco Curto. Os dois miram `basico` desde 2026-09-01.

   ⚠ A régua de "não vazou" é sempre uma arma que NÃO é o alvo da regra, e não a
   ausência do bônus na linha certa: um efeito que some por engano passaria num
   teste que só olha para onde ele deveria estar. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { avaliarAcessoHabilidade, getHabilidade } = await import(R + "afty-habilidades.js");
const { degrausBrutalidade, varDoEstado } = await import(R + "afty-combate.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* As três armas de régua, e cada uma prova uma coisa diferente:
     arm_bastao         Marcial, corpo a corpo   (pega o que é "marcial")
     arm_espada_grande  NÃO Marcial, corpo a corpo (pega o que vaza por `corpo`)
     arm_arco_curto     a distância              (pega o que vaza sem alvo) */
const ARMAS = ["arm_bastao", "arm_espada_grande", "arm_arco_curto"];
const ficha = (nivel, habs = [], o = {}) => {
  const { forca = 10, destreza = 10, con = 10, armas = ARMAS, combate = null, dedicadas = null } = o;
  const c = createBlankAfty();
  c.rulesVersion = "player";
  c.core = { ...c.core, nd: nivel, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "lutador", nivel }];
  c.habilidades = habs;
  c.attributes = { forca, destreza, constituicao: con, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.equipamentos = { itens: armas.map((refId, i) => ({ id: `e${i}`, tipo: "arma", refId, qtd: 1, equipado: true })) };
  if (dedicadas) c.armasDedicadas = dedicadas;
  if (combate) c.combate = { ativo: true, ...combate };
  return c;
};
const linha = (d, id) => d.dano.entradas.find((x) => x.id === id);
const acertos = (d) => ["basico", ...ARMAS].map((id) => linha(d, id).acerto);
const fixos = (d) => ["basico", ...ARMAS].map((id) => linha(d, id).fixo);

/* ============================================================ */
/* 1. OS PRÉ-REQUISITOS                                          */
/* ============================================================ */

const ctx = (habs, con = 10) => ({
  niveisPorEspec: { lutador: 20 },
  escolhidas: habs,
  attrEff: { forca: 10, destreza: 10, constituicao: con, inteligencia: 10, sabedoria: 10, presenca: 10 },
});
for (const [id, dono, rotulo] of [
  ["lut_atacar_e_recuar", "lut_esquiva_rapida", "Esquiva Rápida"],
  ["lut_defesa_marcial", "lut_complementacao_marcial", "Complementação Marcial"],
  ["lut_devolver_projeteis", "lut_aparar_projeteis", "Aparar Projéteis"],
]) {
  const sem = avaliarAcessoHabilidade(getHabilidade(id), ctx([]));
  const com = avaliarAcessoHabilidade(getHabilidade(id), ctx([dono]));
  t(`${id} reprova sem ${dono}`, sem.ok, false);
  t(`e aprova com ele`, com.ok, true);
  t(`e o rotulo mostra o nome, e nao o id`, sem.extras[0].label, rotulo);
}
/* Sobrevivente é a única do Lutador com requisito de ATRIBUTO, e o valor é o
   EFETIVO (mesma leitura do requisito homônimo das Aptidões). */
t("Sobrevivente reprova com Constituicao 15",
  avaliarAcessoHabilidade(getHabilidade("lut_sobrevivente"), ctx([], 15)).ok, false);
t("e aprova com 16",
  avaliarAcessoHabilidade(getHabilidade("lut_sobrevivente"), ctx([], 16)).ok, true);

/* ============================================================ */
/* 2. O ESCOPO DE "DESARMADO"                                    */
/* ============================================================ */

/* Caminho da Mão Vazia (2°): "Todo ataque desarmado que você realizar causa dano
   adicional igual ao seu bônus de treinamento e você soma metade do seu bônus de
   treinamento em jogadas de ataque desarmados." Lutador 20, Maestria 6. */
const cmvSem = deriveAfty(ficha(20));
const cmvCom = deriveAfty(ficha(20, ["lut_caminho_da_mao_vazia"]));
t("o Caminho da Mao Vazia soma metade da Maestria no acerto DESARMADO",
  acertos(cmvCom).map((v, i) => v - acertos(cmvSem)[i]), [3, 0, 0, 0]);
t("e a Maestria cheia no dano DESARMADO, e so nele",
  fixos(cmvCom).map((v, i) => v - fixos(cmvSem)[i]), [6, 0, 0, 0]);

/* Impacto Misto (2°): "+2 em jogadas de ataque e dano desarmados até o começo do
   seu próximo turno. Nos níveis 5, 10, 15 e 20, o bônus em dano aumenta em +1,
   enquanto nos níveis 6, 12 e 18 o bônus em jogadas de ataque aumenta em +1." */
const imDe = (nivel, ligado) =>
  deriveAfty(ficha(nivel, ["lut_impacto_misto"], { combate: ligado ? { impactoMisto: true } : {} }));
t("o Impacto Misto sobe o acerto nos degraus 6, 12 e 18",
  [2, 5, 6, 11, 12, 17, 18, 20].map((n) =>
    linha(imDe(n, true), "basico").acerto - linha(imDe(n, false), "basico").acerto),
  [2, 2, 3, 3, 4, 4, 5, 5]);
t("e o dano nos degraus 5, 10, 15 e 20",
  [2, 4, 5, 9, 10, 14, 15, 19, 20].map((n) =>
    linha(imDe(n, true), "basico").fixo - linha(imDe(n, false), "basico").fixo),
  [2, 2, 3, 3, 4, 4, 5, 5, 6]);
/* ⚠ E NENHUMA DAS DUAS METADES TOCA ARMA. O acerto morava no tipo `corpo` até
   2026-09-01, então o Bastão e a Espada Grande levavam o bônus do desarmado. */
t("e nem o acerto nem o dano dele chegam nas armas", [
  acertos(imDe(20, true)).map((v, i) => v - acertos(imDe(20, false))[i]),
  fixos(imDe(20, true)).map((v, i) => v - fixos(imDe(20, false))[i]),
], [[5, 0, 0, 0], [6, 0, 0, 0]]);

/* ⚠ A CONTRAPROVA: "corpo a corpo" CONTINUA sendo o tipo `corpo`, e tem de pegar
   toda arma de corpo a corpo. A Brutalidade diz "+2 em jogadas de ataque corpo a
   corpo e dano", então ela alcança a Espada Grande e para no Arco. Se alguém
   trocar o canal dela achando que é o mesmo caso do Impacto Misto, este assert
   avisa. */
const brutDe = (ligado) =>
  deriveAfty(ficha(20, ["lut_brutalidade"], { combate: ligado ? { brutalidade: true } : {} }));
t("a Brutalidade alcanca TODA arma de corpo a corpo, e nao a distancia",
  acertos(brutDe(true)).map((v, i) => v - acertos(brutDe(false))[i]), [2, 2, 2, 0]);
t("e o dano dela nao tem recorte nenhum",
  fixos(brutDe(true)).map((v, i) => v - fixos(brutDe(false))[i]), [2, 2, 2, 2]);

/* ============================================================ */
/* 3. OS DEMAIS EFEITOS, NO SEU DEGRAU                           */
/* ============================================================ */

/* Brutalidade (4°): "Nos níveis 8, 12, 16 e 20 você pode gastar 2 PE a mais para
   aumentar o bônus em jogadas de ataque e dano em +1." O teto da faixa é o
   número de degraus alcançados. */
t("o teto de PE extra da Brutalidade sobe em 8, 12, 16 e 20",
  [4, 7, 8, 11, 12, 15, 16, 19, 20].map((n) => degrausBrutalidade(deriveAfty(ficha(n, ["lut_brutalidade"])))),
  [0, 0, 1, 1, 2, 2, 3, 3, 4]);
t("e cada PE extra vale +1 no acerto e no dano",
  [0, 1, 2, 3, 4].map((pe) => {
    const d = deriveAfty(ficha(20, ["lut_brutalidade"], { combate: { brutalidade: true, brutalidadePE: pe } }));
    return linha(d, "basico").acerto - linha(brutDe(false), "basico").acerto;
  }),
  [2, 3, 4, 5, 6]);

/* Ataque Inconsequente (2°): "+5 na rolagem de dano dele", sem recorte de arma. */
const aiSem = deriveAfty(ficha(20, ["lut_ataque_inconsequente"], { combate: {} }));
const aiCom = deriveAfty(ficha(20, ["lut_ataque_inconsequente"], { combate: { ataqueInconsequente: true } }));
t("o Ataque Inconsequente soma 5 de dano em toda linha",
  fixos(aiCom).map((v, i) => v - fixos(aiSem)[i]), [5, 5, 5, 5]);

/* Complementação Marcial (2°): "+2 em testes para Desarmar, Derrubar ou
   Empurrar, assim como para resistir a esses efeitos". ⚠ Agarrar fica DE FORA,
   que é o detalhe que o texto realmente diz. O Bastão do inventário padrão é
   Marcial, então a condição de manejo está atendida aqui. */
const manobrasDe = (d) => Object.fromEntries(d.testes.manobras.map((m) => [m.id, m]));
const cmSem = manobrasDe(deriveAfty(ficha(20)));
const cmCom = manobrasDe(deriveAfty(ficha(20, ["lut_complementacao_marcial"])));
/* As DUAS metades, porque o texto tem duas: "em testes para Desarmar, Derrubar
   ou Empurrar, assim como para resistir a esses efeitos". */
t("a Complementacao Marcial soma 2 para EXECUTAR Desarmar, Derrubar e Empurrar",
  ["desarmar", "derrubar", "empurrar"].map((k) => cmCom[k].executar - cmSem[k].executar), [2, 2, 2]);
t("e 2 para RESISTIR aos tres",
  ["desarmar", "derrubar", "empurrar"].map((k) => cmCom[k].resistir - cmSem[k].resistir), [2, 2, 2]);
t("e nada em Agarrar, que o texto nao cita",
  [cmCom.agarrar.executar - cmSem.agarrar.executar, cmCom.agarrar.resistir - cmSem.agarrar.resistir], [0, 0]);

/* Defesa Marcial (4°): "você soma 1 + metade do seu Bônus de Treinamento à sua
   Defesa". Medido em dois níveis para a metade da Maestria aparecer. */
for (const [nivel, bonus] of [[4, 1 + 1], [12, 1 + 2], [20, 1 + 3]]) {
  const d0 = deriveAfty(ficha(nivel, ["lut_complementacao_marcial"]));
  const d1 = deriveAfty(ficha(nivel, ["lut_complementacao_marcial", "lut_defesa_marcial"]));
  t(`a Defesa Marcial soma ${bonus} no nivel ${nivel}`, d1.defesa - d0.defesa, bonus);
}

/* ============================================================ */
/* 4. "ENQUANTO ESTIVER DESARMADO OU EMPUNHANDO UMA ARMA MARCIAL" */
/* ============================================================ */

/* A frase abre a Complementação Marcial E a Defesa Marcial, verbatim e igual nas
   duas, e não era cobrada por ninguém até 2026-09-01: um Lutador com Espada
   Colossal recebia os dois inteiros.

   ⚠ NÃO DAVA PARA RESOLVER POR ESCOPO DE ARMA, que é como o recorte de "marcial"
   foi resolvido nas linhas de dano no mesmo dia. Os alvos aqui são a Defesa e as
   Manobras, que são números da CRIATURA: não existe "a arma desta Defesa". Por
   isso virou condição, com duas variáveis novas de DSL. */
const MARCIAIS = ["lut_complementacao_marcial", "lut_defesa_marcial"];
const manejo = (armas, dedicadas = null) => {
  /* A Dedicação em Arma entra dos DOIS lados quando o caso é de arma dedicada:
     sem ela na ficha o `resolveArmasDedicadas` nem abre as vagas, e o teste
     mediria a ausência da habilidade em vez da condição de manejo. */
  const base = dedicadas ? ["lut_dedicacao_em_arma"] : [];
  const d0 = deriveAfty(ficha(20, base, { armas, dedicadas }));
  const d1 = deriveAfty(ficha(20, [...base, ...MARCIAIS], { armas, dedicadas }));
  const m = (d) => d.testes.manobras.find((x) => x.id === "derrubar").executar;
  return [d1.defesa - d0.defesa, m(d1) - m(d0)];
};
const LIGADO = [4, 2];      // Defesa 1 + metade da Maestria (6), e +2 na manobra
const DESLIGADO = [0, 0];

t("desarmado LIGA as duas", manejo([]), LIGADO);
/* ⚠ ITEM DE PUGILATO É ESTAR DESARMADO. Faixas e Manoplas não viram linha de
   arma, elas SÃO o Ataque Básico, e quem luta com elas está desarmado para toda
   regra do livro. */
t("Manoplas contam como desarmado", manejo(["arm_manoplas"]), LIGADO);
t("e Faixas tambem", manejo(["arm_faixas"]), LIGADO);
t("arma MARCIAL liga (Bastao, sem Fineza)", manejo(["arm_bastao"]), LIGADO);
t("e a Adaga, que e Marcial com Fineza", manejo(["arm_adaga"]), LIGADO);
t("Espada Colossal DESLIGA as duas", manejo(["arm_espada_colossal"]), DESLIGADO);
t("Lanca desliga", manejo(["arm_lanca"]), DESLIGADO);
t("Arco Curto desliga", manejo(["arm_arco_curto"]), DESLIGADO);
/* Uma Marcial no meio das outras basta: a frase é sobre o que você EMPUNHA. */
t("Espada Colossal MAIS Bastao liga", manejo(["arm_espada_colossal", "arm_bastao"]), LIGADO);

/* ⚠ E A ARMA DEDICADA CONTA, porque a Dedicação em Arma diz "passam a ser
   contadas como marciais". Ela chega pela lista da FICHA, e não pelo canal
   `propMarcial`, que só existe depois da passada de efeitos: o contexto do DSL é
   montado antes dela. */
t("a Lanca DEDICADA passa a ligar", manejo(["arm_lanca"], ["arm_lanca"]), LIGADO);
t("e sem dedicar continua desligada", manejo(["arm_lanca"], []), DESLIGADO);

/* As duas variáveis existem no contexto, então o editor do Motor as aceita e o
   seletor { } as mostra. */
const ctxManejo = deriveAfty(ficha(20, [], { armas: ["arm_bastao"] })).contextoDsl;
t("as duas variaveis estao no contexto",
  [ctxManejo.desarmado, ctxManejo.arma_marcial], [0, 1]);
t("e desarmado inverte", (() => {
  const c = deriveAfty(ficha(20, [], { armas: [] })).contextoDsl;
  return [c.desarmado, c.arma_marcial];
})(), [1, 0]);

/* Músculos Desenvolvidos (4°): "você PODE OPTAR por somar seu Modificador de
   Força ao invés de Destreza em sua Defesa". ⚠ É opção, então trocar por um
   modificador PIOR nunca acontece: o canal `defesaAtributo` substitui pelo
   maior, e não cegamente. */
for (const [forca, destreza, delta] of [[18, 10, 4], [10, 18, 0], [14, 14, 0]]) {
  const d0 = deriveAfty(ficha(20, [], { forca, destreza }));
  const d1 = deriveAfty(ficha(20, ["lut_musculos_desenvolvidos"], { forca, destreza }));
  t(`Musculos com Forca ${forca} e Destreza ${destreza}`, d1.defesa - d0.defesa, delta);
}

/* Sobrevivente (4°): "você recupera 1d6 + seu modificador de Constituição em
   pontos de vida [...] Nos níveis 8, 12, 16 e 20, a cura aumenta em 1d6." */
for (const [nivel, dados] of [[4, 1], [7, 1], [8, 2], [12, 3], [16, 4], [20, 5]]) {
  const d = deriveAfty(ficha(nivel, ["lut_sobrevivente"], { con: 16, combate: { machucado: true } }));
  t(`Sobrevivente no nivel ${nivel} regenera ${dados}d6 + 3`,
    [d.regeneracao.dados, d.regeneracao.dado, d.regeneracao.fixo], [dados, "d6", 3]);
}
t("e desligado ele nao regenera nada",
  deriveAfty(ficha(20, ["lut_sobrevivente"], { con: 16, combate: {} })).regeneracao.dados, 0);

/* Fúria da Vingança (4°): "seus ataques causam 4 de dano adicional; sua Defesa
   aumenta em 2; você recebe +2 em TRs de Fortitude e Vontade." */
const fvSem = deriveAfty(ficha(20, ["lut_furia_da_vinganca"], { combate: {} }));
const fvCom = deriveAfty(ficha(20, ["lut_furia_da_vinganca"], { combate: { furiaVinganca: true } }));
const trDe = (d, id) => d.testes.resistencias.find((r) => (r.id ?? r.value) === id).bonus;
t("a Furia da Vinganca entrega os quatro numeros do texto", [
  linha(fvCom, "basico").fixo - linha(fvSem, "basico").fixo,
  fvCom.defesa - fvSem.defesa,
  trDe(fvCom, "fortitude") - trDe(fvSem, "fortitude"),
  trDe(fvCom, "vontade") - trDe(fvSem, "vontade"),
], [4, 2, 2, 2]);
t("e nao toca os outros TRs",
  ["reflexos", "astucia"].map((k) => trDe(fvCom, k) - trDe(fvSem, k)), [0, 0]);

/* Resistir (2°): "gastar até 2PE para receber um bônus de +2 para cada PE gasto"
   em Fortitude ou Reflexos. */
const resDe = (pe) => deriveAfty(ficha(20, ["lut_resistir"], { combate: pe ? { resistirPE: pe } : {} }));
t("Resistir vale 2 por PE, ate 2 PE",
  [1, 2].map((pe) => trDe(resDe(pe), "fortitude") - trDe(resDe(0), "fortitude")), [2, 4]);
t("e o mesmo em Reflexos",
  [1, 2].map((pe) => trDe(resDe(pe), "reflexos") - trDe(resDe(0), "reflexos")), [2, 4]);
t("e em nenhum outro TR",
  ["vontade", "astucia", "integridade"].map((k) => trDe(resDe(2), k) - trDe(resDe(0), k)), [0, 0, 0]);

/* Fluxo (4°): "A cada nível de empolgação que você subir, você recebe +1 em
   rolagens de dano e, no começo de toda rodada, recebe 4 pontos de vida
   temporários para cada nível de empolgação acima do primeiro." */
const fluxoDe = (nivelEmp) => deriveAfty(ficha(20, ["lut_fluxo"], { combate: { empolgacao: nivelEmp } }));
t("o Fluxo soma 1 de dano por nivel de empolgacao acima do primeiro",
  [1, 2, 3, 4, 5].map((n) => linha(fluxoDe(n), "basico").fixo - linha(fluxoDe(1), "basico").fixo),
  [0, 1, 2, 3, 4]);

/* Imprudência Motivadora (4°): "+2 em rolagens de ataque e tem sua margem de
   crítico reduzida em 1". Sem recorte, então alcança até o Arco. */
const imprSem = deriveAfty(ficha(20, ["lut_imprudencia_motivadora"], { combate: {} }));
const imprCom = deriveAfty(ficha(20, ["lut_imprudencia_motivadora"], { combate: { imprudenciaMotivadora: true } }));
t("a Imprudencia soma 2 de acerto em TODA linha",
  acertos(imprCom).map((v, i) => v - acertos(imprSem)[i]), [2, 2, 2, 2]);
t("e desce 1 na margem de critico do desarmado",
  linha(imprSem, "basico").margemCritico - linha(imprCom, "basico").margemCritico, 1);

/* Puxar um Ar (2°): "realizar uma rolagem do seu dano desarmado e se curar nesse
   valor [...] uma quantidade de vezes igual ao seu bônus de treinamento." A
   linha ESPELHA o Ataque Básico, então ela não tem número próprio. */
const puxar = deriveAfty(ficha(20, ["lut_puxar_um_ar"])).cura.linhas.find((l) => l.id === "cura_puxar_um_ar");
t("Puxar um Ar existe e espelha o Ataque Basico", [puxar?.espelhaNome, puxar?.usos], ["Ataque Básico", 6]);
t("e o texto dele bate com a linha do desarmado",
  puxar?.texto, linha(deriveAfty(ficha(20, ["lut_puxar_um_ar"])), "basico").texto.replace(/ /g, ""));

/* Dedicação em Arma (2°): "Escolha três armas [...] as quais não podem possuir
   as propriedades Duas Mãos ou Pesada, exceto caso já possuam a propriedade
   Marcial. Suas armas escolhidas passam a ser contadas como marciais, se não
   forem, e enquanto empunhar uma Arma Dedicada, o dano dela aumenta em 1 nível." */
const dedSem = deriveAfty(ficha(20, ["lut_dedicacao_em_arma"], { armas: ["arm_lanca"] }));
const dedCom = deriveAfty(ficha(20, ["lut_dedicacao_em_arma"], { armas: ["arm_lanca"], dedicadas: ["arm_lanca"] }));
t("a Dedicacao abre tres vagas", dedSem.dedicadas.max, 3);
t("a Lanca dedicada passa a contar como Marcial",
  linha(dedCom, "arm_lanca").propriedades.some((p) => p.id === "marcial"), true);
t("e sem dedicar ela nao e Marcial",
  linha(dedSem, "arm_lanca").propriedades.some((p) => p.id === "marcial"), false);
t("o dano dela sobe um nivel",
  [linha(dedSem, "arm_lanca").texto, linha(dedCom, "arm_lanca").texto], ["1d6 + 4", "1d8 + 4"]);
/* ⚠ E A ESPADA GRANDE NÃO É ELEGÍVEL: Duas Mãos e Pesada, e não é Marcial. */
t("a Espada Grande nao pode ser Dedicada",
  deriveAfty(ficha(20, ["lut_dedicacao_em_arma"], { armas: ["arm_espada_grande"] })).dedicadas.elegiveis, []);
/* ============================================================ */
/* 4. OS PODERES DE 6° A 16°                                     */
/* ============================================================ */
/* Varredura de 2026-09-02. Só o que virou NÚMERO entra aqui: 18 dos 33 são
   economia de ação, vantagem em condição nomeada ou debuff no inimigo, e a
   ausência deles no Motor é o estado correto. */

/* ⚠ BRUTALIDADE SANGUINÁRIA: "você aumenta o nível de dano dos seus ataques
   CORPO A CORPO em 1". Ficou sem alvo de julho até 2026-09-02, e o Arco Curto
   subia de d6 a d12 com 3 pilhas. A régua é a arma que a regra NÃO menciona. */
const bsDe = (pilha) => deriveAfty(ficha(20, ["lut_brutalidade", "lut_brutalidade_sanguinaria"],
  { combate: { brutalidade: true, brutalidadePilha: pilha } }));
t("a Brutalidade Sanguinaria sobe o desarmado e as armas de corpo a corpo",
  ["basico", "arm_bastao", "arm_espada_grande"].map((id) => linha(bsDe(3), id).dado),
  ["d12", "d12", "d12"]);
t("e NAO alcanca a arma a distancia",
  [linha(bsDe(0), "arm_arco_curto").dado, linha(bsDe(3), "arm_arco_curto").dado], ["d6", "d6"]);

/* ⚠ CORPO CALEJADO tem PISO DE 1 na Defesa (autor, 2026-09-02: *"Mínimo 1"*),
   mesma decisão das Artes do Combate. Sem ele, Constituição 8 fazia uma
   habilidade DEFENSIVA tirar 1 de Defesa. */
const ccDe = (con) => deriveAfty(ficha(20, ["lut_corpo_calejado"], { con })).calc.defesa
  - deriveAfty(ficha(20, [], { con })).calc.defesa;
t("o Corpo Calejado nunca TIRA Defesa, nem com Constituicao 6",
  [6, 8, 10, 14, 20].map(ccDe), [1, 1, 1, 1, 2]);

/* ⚠ ATAQUE CIRCULAR: 5 POR INIMIGO (autor, 2026-09-02: *"+5 por Inimigo, logo 3
   inimigos dão +15"*), e o recorte é corpo a corpo, porque o golpe é um giro
   dentro do alcance corpo a corpo. */
const circDe = (alvos) => deriveAfty(ficha(20, ["lut_manobras_finalizadoras"],
  { combate: { empolgacao: 5, manobraFinalizadora: "circular", circularAlvos: alvos } }));
const circBase = deriveAfty(ficha(20, ["lut_manobras_finalizadoras"], { combate: { empolgacao: 5 } }));
t("o Ataque Circular escala com o numero de alvos",
  [1, 2, 3, 5].map((n) => linha(circDe(n), "basico").fixo - linha(circBase, "basico").fixo), [5, 10, 15, 25]);
t("e nao alcanca a arma a distancia",
  linha(circDe(3), "arm_arco_curto").fixo - linha(circBase, "arm_arco_curto").fixo, 0);

/* UM COM A ARMA (6°): "suas armas dedicadas conseguem superar resistência ao
   tipo de dano delas em um ataque." A CONTA DE USOS fica na mesa (autor,
   2026-09-02), então só o gatilho da bancada entra. */
const ucaDe = (ligado) => deriveAfty(ficha(20, ["lut_dedicacao_em_arma", "lut_um_com_a_arma"],
  { armas: ["arm_bastao", "arm_espada_grande"], dedicadas: ["arm_bastao"], combate: ligado ? { umComArma: true } : {} }));
t("Um com a Arma remove resistencia SO na arma dedicada",
  ["arm_bastao", "arm_espada_grande"].map((id) => linha(ucaDe(true), id).removeResistencia), [true, false]);
t("e so com o gatilho ligado",
  linha(ucaDe(false), "arm_bastao").removeResistencia, false);

/* ⚠ O ID DO ESTADO É `umComArma`, e não `umComAArma`: o `varDoEstado` corta
   antes de maiúscula PRECEDIDA de minúscula, então "AA" não abre separador e a
   variável viraria `um_com_aarma`, com o `quando` casando em nada, calado. */
t("o estado da bancada evita a armadilha das duas maiusculas",
  varDoEstado("umComArma"), "um_com_arma");

/* Os efeitos simples de 6° a 16°, cada um no seu número. */
const semNada = deriveAfty(ficha(20));
const ganhoDe = (habs, campo) => campo.split(".").reduce((a, k) => a?.[k], deriveAfty(ficha(20, habs)))
  - campo.split(".").reduce((a, k) => a?.[k], semNada);
t("Aprimoramento Marcial soma metade da Maestria na CD", ganhoDe(["lut_aprimoramento_marcial"], "calc.cd"), 3);
t("Corpo Calejado da PV igual ao nivel de Lutador", ganhoDe(["lut_corpo_calejado"], "calc.hp"), 20);
t("Seja Agua da 3 metros", ganhoDe(["lut_seja_agua"], "calc.movimento"), 3);
t("Corpo Supremo da 3 metros e 4 de Defesa",
  [ganhoDe(["lut_corpo_supremo"], "calc.movimento"), ganhoDe(["lut_corpo_supremo"], "calc.defesa")], [3, 4]);

/* Eliminar e Continuar (6°): 2d6 no 6°, 3d6 no 8°, 4d6 no 12°, 4d8 no 16° e
   4d12 no 20°, mais nível de personagem. O dado entra pela MÉDIA, para baixo. */
const eecDe = (n) => deriveAfty(ficha(n, ["lut_eliminar_e_continuar"], { combate: { abates: 1 } })).pvTemporario;
t("Eliminar e Continuar troca de dado nos cinco degraus",
  [6, 7, 8, 11, 12, 15, 16, 19, 20].map(eecDe), [13, 14, 18, 21, 26, 29, 34, 37, 46]);

/* Ignorar Dor (6°): "redução de danos contra todos os tipos, menos alma, igual
   ao seu nível de empolgação atual. Contra danos físicos, a redução é dobrada."
   As duas RDs SOMAM, então o mesmo valor nos dois canais dá o dobro no físico. */
const idDe = (e) => {
  const s = deriveAfty(ficha(10, [], { combate: { empolgacao: e } }));
  const c = deriveAfty(ficha(10, ["lut_ignorar_dor"], { combate: { empolgacao: e } }));
  return [c.rdGeral - s.rdGeral, (c.rdGeral - s.rdGeral) + (c.rdFisico - s.rdFisico)];
};
t("Ignorar Dor da a empolgacao de RD, e o dobro contra fisico",
  [1, 3, 5].map(idDe), [[1, 2], [3, 6], [5, 10]]);


/* ============================================================ */


/* ============================================================ */

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
