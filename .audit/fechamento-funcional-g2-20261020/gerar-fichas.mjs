/* FECHAMENTO FUNCIONAL DO G2: as fichas SINTÉTICAS de teste (2026-10-20). Nenhuma é ficha do autor: todas levam "(Teste G2)" no nome e ids próprios, e só entram
   em contextos isolados do navegador. Cobrem as cinco rotinas sem depender de o Minamoto ter todas:
     ima        Imitação comum (restringido), só a habilidade, sem outro efeito catalogado
     perfeita   Imitação Perfeita com a Técnica de Memorização
     mestre     o addon da concessão, com uma concessão já existente, uma de Talento e uma cujo addon saiu
     sangrador  as quatro faixas de Sangramento, uma condição que não sangra, e Exaustão zero
     invocador  duas invocações (buff de criatura e de invocação, alvo específico ou todas), e Exaustão 3
     cria       criatura do Afty (/Afty), com o addon da concessão e uma invocação
     minamoto, player30  as amostras densas do protótipo, para o cabeçalho e o desempenho
   Uso: node .audit/fechamento-funcional-g2-20261020/gerar-fichas.mjs  (escreve fichas.json ao lado). */
import fs from "node:fs";
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const R = new URL("../../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const COND = await import(R + "afty-condicoes.js");
const S = await import(R + "ficha/ficha-sessao.js");

const ADDON_CONCESSAO = { id: "teste-concessao", nome: "Concessão de Teste", acrescenta: { habilidades: [] }, permite: ["concessao"] };
const nova = (id, nome, extra = {}) => {
  const f = createBlankAfty();
  f.id = id; f.name = `${nome} (Teste G2)`; f.rulesVersion = "player"; f.system = "afty";
  return { ...f, ...extra };
};
const combatente = (id, nome, extra = {}) => nova(id, nome, {
  core: { ...createBlankAfty().core, nd: 12, patamar: "comum", origem: { id: "inato" } },
  attributes: { ...createBlankAfty().attributes, forca: 16, destreza: 14, constituicao: 14 },
  especializacoes: [{ id: "combatente", nivel: 12 }],
  ...extra,
});
const invocacoes = () => [
  { ...INV.createBlankInvocacao("primeiro"), id: "g2-inv-a", nome: "Nue" },
  { ...INV.createBlankInvocacao("terceiro"), id: "g2-inv-b", nome: "Sapo de Teste Com um Nome Bem Comprido" },
];

const fichas = {};
fichas.ima = nova("teste-g2-ima", "Ima", {
  core: { ...createBlankAfty().core, nd: 20, patamar: "comum", origem: { id: "restringido" } },
  especializacoes: [{ id: "restringido", nivel: 20 }],
  habilidades: ["res_imitacao"],
});
fichas.perfeita = nova("teste-g2-perfeita", "Perfeita", {
  core: { ...createBlankAfty().core, nd: 20, patamar: "comum", origem: { id: "restringido" } },
  especializacoes: [{ id: "restringido", nivel: 20 }],
  habilidades: ["res_imitacao", "res_imitacao_perfeita", "res_tecnicas_de_memorizacao"],
});
fichas.mestre = combatente("teste-g2-mestre", "Mestre", { addons: [ADDON_CONCESSAO], habilidades: ["cmb_assumir_postura", "cmb_ataque_concentrado"] });
fichas.sangrador = combatente("teste-g2-sangrador", "Sangrador");
fichas.invocador = combatente("teste-g2-invocador", "Invocador", { invocacoes: invocacoes() });
fichas.cria = nova("teste-g2-cria", "Cria", {
  rulesVersion: "afty",
  core: { ...createBlankAfty().core, nd: 14, patamar: "comum", tipo: "combatente" },
  especializacoes: [{ id: "combatente", nivel: 14 }],
  attributes: { ...createBlankAfty().attributes, forca: 18, constituicao: 16 },
  addons: [ADDON_CONCESSAO],
  invocacoes: invocacoes().slice(0, 1),
});
const amostras = JSON.parse(fs.readFileSync("C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json", "utf8")).amostras;
for (const id of ["minamoto", "player30"]) {
  const f = amostras.find((a) => a.id === id).ficha;
  fichas[id] = { ...f, id: `teste-g2-${id}`, name: `${f.name} (Teste G2)` };
}

/* As sessões semeadas: só as que precisam de estado inicial. As outras nascem em branco. */
const sessoes = {};
const sem = (f) => S.sessaoEmBranco(deriveAfty(f));
{
  const f = fichas.mestre;
  let s = sem(f);
  s = S.concedeNaSessao(s, "habilidades", "cmb_critico_melhorado");
  s = S.concedeNaSessao(s, "talentos", "tal_adepto_de_combate");
  s = { ...s, concedido: [...s.concedido, { uid: "morta-1", familia: "habilidades", id: "habilidade_de_addon_que_saiu", alvo: null, escolhas: [], em: 0 }] };
  sessoes[f.id] = s;
}
{
  const f = fichas.sangrador;
  const conds = ["fraco", "medio", "forte", "extremo"].map((faixa, i) => ({ id: `cond_${i + 1}`, nome: "Sangramento", forca: COND.faixaDeSangramento(faixa).forca, rodadas: null, sangramento: faixa }));
  let s = S.defineCondicoes(sem(f), [...conds, { id: "cond_5", nome: "Atordoado", forca: null, rodadas: null }]);
  /* A casca de PV Temporário (8) tem de ficar intacta: o Sangramento vai direto na Vida. */
  s = { ...s, hpAtual: Math.max(1, s.hpAtual), pvTempFontes: { "g2-teste": 8 } };
  sessoes[f.id] = s;
}
{
  const f = fichas.invocador;
  /* Uma instância de Pacote para Aliados já ativa (Defesa +3 do Bastião): criar e tirar buff de mesa não pode tocá-la. */
  const instPacote = { id: "g2-inst1", rec: true, tipoFonte: "catalogo", origemId: "aptidao:aura_do_bastiao", origemNome: "Aura do Bastião", aplicadoPor: "Yuki (Teste)", beneficios: [{ canal: "defesa", valor: 3 }], rodadas: null, somaPresumida: false, terminaNoDescanso: true,
    pacote: { chave: "emi-g2:pac-g2", id: "pac-g2", nome: "Apoio", revisao: 1, opcaoId: "o1", emissorId: "emi-g2", emissorNome: "Yuki (Teste)", familia: "aptidaoAura", calculo: "automatico", duracao: { tipo: "alcance" }, condicoes: [], custoEmissor: null } };
  sessoes[f.id] = { ...sem(f), exaustao: 3, buffs: [instPacote] };
}
fs.writeFileSync(new URL("./fichas.json", import.meta.url), JSON.stringify({ geradoEm: new Date().toISOString(), fichas, sessoes }, null, 1));
console.log(Object.values(fichas).map((f) => `${f.id}: ${f.name} (${f.rulesVersion})`).join("\n"));
console.log("sessões semeadas:", Object.keys(sessoes).join(", "));
