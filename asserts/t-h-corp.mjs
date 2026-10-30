/* ORIGEM H CORP E MORADOR DA CIDADE (addons, 2026-10-12).

   Os dois pacotes pedidos pelo autor, lidos de `addons/h-corp.json` e de
   `addons/morador-da-cidade.json`, o mesmo texto que se cola no Instalar:
     • Bônus em Atributo: 4 pontos, até 3 no mesmo atributo;
     • Boulos: +1 em Força, Destreza e Constituição, mais 2 pontos nos físicos;
     • Zodíaco: um dos 12 animais, cada um com um atributo. Ligado, o atributo
       vai a 30, e a 32 se já estiver em 30;
     • Morador da Cidade: 2 Pontos de Atributo livres para toda ficha com o
       Addon, num Funcionamento do pacote.

   O Zodíaco pediu duas mudanças no Motor, e são elas que este arquivo segura:
     1. `limiteAtributo` que lê a bancada DESCE ao estágio principal
        (`separarEfeitosDeBancada`). Preso no montante ele valia zero, e o
        atributo parava no 20 com o interruptor ligado.
     2. O estágio TEMPORÁRIO reconhece o `furaTeto` de um limite ativo, avaliado
        sobre o atributo permanente. O permanente segue sem furar. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const EFE = await import(R + "afty-efeitos.js");
const BUF = await import(R + "ficha/ficha-buffs.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const ler = (arq) => JSON.parse(readFileSync(new URL(`../addons/${arq}`, import.meta.url), "utf8"));

/* ============================================================ */
/* 1. OS PACOTES                                                 */
/* ============================================================ */
const CRU_H = ler("h-corp.json");
const CRU_M = ler("morador-da-cidade.json");
t("H Corp valida sem problema nenhum", A.validarPacote(CRU_H), []);
t("Morador da Cidade valida sem problema nenhum", A.validarPacote(CRU_M), []);
const H = A.normalizarPacote(CRU_H);
const M = A.normalizarPacote(CRU_M);
A.aplicarAddons([H, M]);
const ID = "h-corp:h_corp";
const ESTADO = "h-corp:zodiaco";
const origem = O.getOrigem(ID);
t("a origem existe, com o namespace", origem?.nome, "H Corp");
t("as três características, na ordem da carta",
  origem?.caracteristicas?.map((c) => c.nome), ["Bônus em Atributo", "Boulos", "Zodíaco"]);
t("Boulos fixo em Força, Destreza e Constituição", origem?.bonusAtributos, { forca: 1, destreza: 1, constituicao: 1 });
t("o bônus distribuível", origem?.caracteristicas?.[0]?.bonus, { distribuir: 4, maxPorAtributo: 3 });
t("a alocação física do Boulos", origem?.caracteristicas?.[1]?.alocacao,
  { id: "hcorp_boulos_fisicos", quantidade: 2, valor: 1, entre: ["forca", "destreza", "constituicao"], maxPorAtributo: 2 });

const opcoes = origem?.caracteristicas?.[2]?.escolhas?.[0]?.opcoes ?? [];
t("doze animais", opcoes.length, 12);
const porAtributo = {};
for (const o of opcoes) {
  const attr = o.efeitos?.[0]?.alvo;
  porAtributo[attr] = (porAtributo[attr] || 0) + 1;
}
t("dois animais por atributo", porAtributo,
  { inteligencia: 2, constituicao: 2, forca: 2, destreza: 2, presenca: 2, sabedoria: 2 });
t("cada animal mira um atributo só", opcoes.every((o) => new Set(o.efeitos.map((e) => e.alvo)).size === 1), true);
t("todo efeito do Zodíaco é temporário e lê o interruptor",
  opcoes.every((o) => o.efeitos.every((e) => e.duracao === "temporaria" && e.quando === "h_corp_zodiaco")), true);
t("a variável do interruptor é a que o Zodíaco lê", EFE.efeitoLeBancada({ quando: "h_corp_zodiaco" }, {}), true);

/* ============================================================ */
/* 2. O MOTOR: O LIMITE DE COMBATE DESCE                          */
/* ============================================================ */
const limBancada = { canal: "limiteAtributo", alvo: "forca", expr: "10", quando: "h_corp_zodiaco" };
const limFixo = { canal: "limiteAtributo", alvo: "forca", expr: "2" };
const vagaBancada = { canal: "vagasHabilidade", expr: "1", quando: "h_corp_zodiaco" };
const sep = EFE.separarEfeitosDeBancada([limBancada, limFixo, vagaBancada], { nd: 1 });
t("limite que lê a bancada desce", sep.bancada, [limBancada]);
t("limite permanente e vaga ficam no montante", sep.montante, [limFixo, vagaBancada]);

/* ============================================================ */
/* 3. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const ficha = ({ forca = 14, tipo = "conjurador", animal = "tigre", ligado = false, addons = [H], origemId = ID } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = {
      ...c.core, nd: 10, tipo, patamar: "comum",
      origem: {
        id: origemId,
        bonusAtributos: { forca: 3, presenca: 1 },
        pools: { hcorp_boulos_fisicos: { destreza: 2 } },
        escolhas: animal ? { hcorp_zodiaco_animal: [`hcorp_zodiaco_${animal}`] } : {},
      },
    };
    c.attrMethod = "fixos";
    c.attributes = { forca, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
    c.addons = addons;
    c.combate = { ativo: ligado, [ESTADO]: ligado };
    return c;
  };
  const tag = (s) => `${sistema}: ${s}`;

  const d = deriveAfty(ficha());
  t(tag("Boulos fixo, Bônus livre e Boulos físico somam"), d.attrEff,
    { forca: 18, destreza: 13, constituicao: 11, inteligencia: 10, sabedoria: 10, presenca: 11 });
  /* Pela MESMA função da aba Buffs, que confere a opção escolhida. Ela não
     enxergava escolha de origem até 2026-10-12, e o interruptor sumia. */
  const temInterruptor = (der) => BUF.linhasDeEstado(der).some((e) => e.id === ESTADO);
  t(tag("o interruptor aparece para quem escolheu o animal"), temInterruptor(d), true);
  t(tag("e some para quem não escolheu"), temInterruptor(deriveAfty(ficha({ animal: null }))), false);

  const tigre = deriveAfty(ficha({ ligado: true }));
  t(tag("Tigre ligado leva a Força de 18 a 30"), tigre.attrEff.forca, 30);
  t(tag("o resto não muda"), { ...tigre.attrEff, forca: 0 }, { ...d.attrEff, forca: 0 });
  t(tag("o limite permanente segue 20"), tigre.attrLimiteEfetivo.forca, 20);
  t(tag("a Força permanente segue 18"), tigre.attrPermanente.forca, 18);

  const dragao = deriveAfty(ficha({ animal: "dragao", ligado: true }));
  t(tag("Dragão ligado leva a Presença de 11 a 30"), [dragao.attrEff.presenca, dragao.attrEff.forca], [30, 18]);

  // Restringido: Força 26 + 1 + 3 = 30, pelo Ápice Corporal Humano.
  const restr = deriveAfty(ficha({ forca: 26, tipo: "restringido" }));
  t(tag("Restringido desligado está em 30"), restr.attrEff.forca, 30);
  const restrOn = deriveAfty(ficha({ forca: 26, tipo: "restringido", ligado: true }));
  t(tag("já em 30, o Zodíaco quebra o limite e chega a 32"), restrOn.attrEff.forca, 32);
  t(tag("o teto aplicado diz 32"), restrOn.attrTetoAplicado.forca, 32);

  // Fora de combate o interruptor não vale, mesmo marcado.
  const fora = ficha({ ligado: true });
  fora.combate = { ativo: false, [ESTADO]: true };
  t(tag("fora de combate não muda nada"), deriveAfty(fora).attrEff.forca, 18);

  // Morador da Cidade: 2 Pontos de Atributo livres.
  const mor = deriveAfty(ficha({ addons: [H, M] }));
  t(tag("Morador da Cidade dá 2 Pontos de Atributo"), mor.pontosAtributoExtra, 2);
  t(tag("com a fonte no hover"), mor.partes.pontosAtributoExtra.map((p) => [p.label, p.valor]), [["Morador da Cidade", 2]]);
  t(tag("vale fora da H Corp"), deriveAfty(ficha({ addons: [M], origemId: "inato", animal: null })).pontosAtributoExtra, 2);
  t(tag("sem o Addon, zero"), deriveAfty(ficha()).pontosAtributoExtra, 0);
}

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`${bad.length} FALHA(S), ${ok} ok`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
