/* ORIGEM NÃO-FEITICEIRO (Regras Opcionais do Livro Básico, addon, 2026-10-09).

   Lida de `addons/nao-feiticeiro.json`, o mesmo texto que se cola no Instalar.
   Prende os cinco verbos que o pacote pediu ao motor, todos genéricos:
     • `semEnergia` na origem: Estamina, nenhuma trilha de Aptidão, nenhum Feitiço
       próprio, com QUALQUER classe (até aqui só a classe Restringido dizia isso);
     • `nivelMaximo` na origem: o nível trava em 10;
     • `tetoNivelFeitico` na origem: o Estilo e o Fundamento Marcial (os Feitiços
       Passivo e Personalizado da liberação `feiticosRestritos`) só até o Nível 2;
     • `concedeHabilidades` em opção de origem: a Percepção do Invisível dá o
       Perceber o Ar do Restringido sem a classe;
     • `armaEscolhida` com o alvo `@<id>` e o canal `treinoArmaCasoJa`: a Arma
       Masterizada do Grão Mestre e do ARMA!!!.
   E o contador de opção de escolha de ORIGEM (o ARMA!!!, uma vez por combate),
   que até aqui só existia em opção de Habilidade e de Talento. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const AP = await import(R + "afty-aptidoes.js");
const EFE = await import(R + "afty-efeitos.js");
const FC = await import(R + "ficha/ficha-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const CRU = JSON.parse(readFileSync(new URL("../addons/nao-feiticeiro.json", import.meta.url), "utf8"));
t("o pacote valida sem problema nenhum", A.validarPacote(CRU), []);
t("autor, sistema-alvo e a liberação do Estilo Marcial", [CRU.autor, CRU.paraRaw, CRU.libera], ["Templas", "afty", ["feiticosRestritos"]]);
t("o canal de treino na arma existe", !!EFE.getCanal("treinoArmaCasoJa"), true);
const pacote = A.normalizarPacote(CRU);
A.aplicarAddons([pacote]);
const ID = "nao-feiticeiro:nao_feiticeiro";
const origem = O.getOrigem(ID);
t("a origem, com os três campos", [origem?.nome, origem?.semEnergia, origem?.nivelMaximo, origem?.tetoNivelFeitico],
  ["Não-Feiticeiro", true, 10, 2]);
t("as classes vetadas", origem?.especializacoesVetadas, ["conjurador", "controlador", "restringido"]);
t("o alvo @arma sobrevive à normalização",
  origem?.caracteristicas?.[1]?.escolhas?.[0]?.opcoes?.[0]?.efeitos?.[0]?.alvo, "@arma_masterizada");
t("o validador de origem não reclama", O.validarCatalogoOrigens().filter((p) => p.includes("Não-Feiticeiro") || p.includes("nf_")), []);

/* ============================================================ */
/* 2. A FICHA                                                    */
/* ============================================================ */
const ESCOLHAS = {
  nf_artimanha_1: ["nf_a1_grao_mestre"],
  nf_artimanha_5: ["nf_a5_arma"],
  nf_artimanha_10: ["nf_a10_percepcao"],
};
const ficha = ({ sistema = "player", nd = 12, origemId = ID, escolhas = ESCOLHAS, arma = null, pools = {}, bonus = {} } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd, tipo: "combatente", patamar: "comum", origem: { id: origemId, escolhas, bonusAtributos: bonus, pools } };
  c.especializacoes = [{ id: "lutador", nivel: Math.min(nd, 10) }];
  c.aptidoesAmaldicoadas = ["aura_reforcada"];
  c.addons = [pacote];
  c.equipamentos = { itens: [
    { uid: "e1", tipo: "arma", refId: "arm_adaga", qtd: 1, equipado: true },
    { uid: "e2", tipo: "arma", refId: "arm_katana", qtd: 1, equipado: true },
  ] };
  if (arma) c.armasDaOrigem = { arma_masterizada: arma };
  return c;
};
const linha = (d, id) => d.dano.entradas.find((e) => e.id === id);

for (const sistema of ["player", "afty"]) {
  const tag = (s) => `${sistema}: ${s}`;
  const d = deriveAfty(ficha({ sistema }));

  // Sem Energia Amaldiçoada com a classe Lutador.
  t(tag("o recurso é Estamina"), d.recursoLabel, "Estamina");
  t(tag("a origem diz sem energia"), d.origemSemEnergia, true);
  t(tag("nenhuma trilha de Aptidão"), AP.trilhasDaCriatura(ficha({ sistema })).length, 0);
  t(tag("e a Aptidão gravada não vale"), (d.aptidoesEscolhidas ?? []).includes("aura_reforcada"), false);
  t(tag("Feitiços só Passivo e Personalizado"), d.feiticos.tiposPermitidos, ["passivo", "personalizado"]);
  t(tag("até o Nível 2"), d.feiticos.nivelMax, 2);
  t(tag("e no nível 4, até onde o nível alcança"), deriveAfty(ficha({ sistema, nd: 4 })).feiticos.nivelMax, 1);
  t(tag("o nível trava em 10"), d.nd, 10);
  const inato = deriveAfty(ficha({ sistema, origemId: "inato", escolhas: {} }));
  t(tag("o Inato segue com Energia, trilhas e nível 12"),
    [inato.recursoLabel, AP.trilhasDaCriatura(ficha({ sistema, origemId: "inato" })).length > 0, inato.nd], ["Energia", true, 12]);

  // A Arma Masterizada.
  t(tag("o seletor da arma aparece, sem arma marcada"), d.armasDaOrigem, [{ id: "arma_masterizada", nome: "Arma Masterizada", armaId: null }]);
  const semArma = linha(d, "arm_adaga");
  const comAdaga = deriveAfty(ficha({ sistema, arma: "arm_adaga" }));
  const adaga = linha(comAdaga, "arm_adaga");
  const bt = maestria(10);
  const tipoCorpo = !!comAdaga.testes.ataques.find((a) => a.id === "corpo")?.treinado;
  const jaSoma = sistema === "player" ? true : tipoCorpo;
  t(tag("Grão Mestre na arma que já soma o BT: metade no acerto"),
    adaga.acerto - semArma.acerto, jaSoma ? Math.floor(bt / 2) : bt);
  t(tag("com o nome no hover"), (adaga.partesAcerto ?? []).some((p) => p.label.startsWith("Grão Mestre em Arma")), true);
  t(tag("ARMA!!! tira 1 da margem"), semArma.margemCritico - adaga.margemCritico, 1);
  t(tag("e soma 3 níveis de dano"), adaga.niveisDano - (semArma.niveisDano ?? 0), 3);
  t(tag("a outra arma não muda"), linha(comAdaga, "arm_katana").acerto, linha(d, "arm_katana").acerto);
  t(tag("a arma marcada vai para o seletor"), comAdaga.armasDaOrigem[0].armaId, "arm_adaga");
  const fora = deriveAfty(ficha({ sistema, arma: "arm_inexistente" }));
  t(tag("arma que saiu da ficha: nada muda, e o seletor esvazia"),
    [linha(fora, "arm_adaga").acerto, fora.armasDaOrigem[0].armaId], [semArma.acerto, null]);

  // Os contadores.
  t(tag("ARMA!!! uma vez por combate"), comAdaga.mesa["opcao:nf_artimanha_5:nf_a5_arma"]?.usos,
    { max: 1, recarga: "cena", chave: "cena:opcao:nf_artimanha_5:nf_a5_arma" });
  t(tag("Vontade Indomável uma vez por descanso"), d.mesa["origem:nf_vontade_indomavel"]?.usos,
    { max: 1, recarga: "descanso", chave: "origem:nf_vontade_indomavel" });

  // A Percepção do Invisível concede o Perceber o Ar, sem a classe Restringido.
  t(tag("Perceber o Ar concedido no nível 10"), d.habilidades.efetivas.includes("res_perceber_o_ar"), true);
  const nove = deriveAfty(ficha({ sistema, nd: 9 }));
  t(tag("no nível 9 a escolha do 10 nem abre"), nove.habilidades.efetivas.includes("res_perceber_o_ar"), false);
  t(tag("e não gasta vaga de Habilidade"),
    deriveAfty(ficha({ sistema, escolhas: { ...ESCOLHAS, nf_artimanha_10: ["nf_a10_mente_astuta"] } })).orcamentoHabilidades?.gastosNoComum,
    d.orcamentoHabilidades?.gastosNoComum);

  // A Ficha mostra a Artimanha escolhida, e o ARMA!!! ganha linha com contador.
  const lista = FC.conteudoDaFicha(ficha({ sistema, arma: "arm_adaga" }), comAdaga);
  const artimanhas = lista.find((i) => i.chave === "origem:nf_artimanhas");
  t(tag("a característica lista o Grão Mestre e a Percepção"),
    (artimanhas?.opcoes ?? []).map((o) => o.nome), ["Grão Mestre em Arma", "Percepção do Invisível"]);
  const armaLinha = lista.find((i) => i.chave === "opcao:nf_artimanha_5:nf_a5_arma");
  t(tag("o ARMA!!! vira linha própria com contador"), [armaLinha?.nome, armaLinha?.usos?.max], ["ARMA!!!", 1]);
}

/* ============================================================ */
/* 3. O BÔNUS EM ATRIBUTO                                        */
/* ============================================================ */
const comBonus = ficha({ bonus: { forca: 1 }, pools: { nf_mental: { inteligencia: 2 } } });
t("+1 num Físico e +2 num Mental", O.resolveOrigemAttrBonus(comBonus), { forca: 1, inteligencia: 2 });
t("a característica tem as duas partes",
  [origem.caracteristicas[0].bonus, origem.caracteristicas[0].alocacao],
  [{ distribuir: 1, maxPorAtributo: 1, entre: ["forca", "destreza", "constituicao"] },
    { id: "nf_mental", quantidade: 1, valor: 2, entre: ["inteligencia", "sabedoria", "presenca"] }]);

A.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
