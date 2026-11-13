/* Reprodução dos defeitos ANTES da correção. Somente leitura: não grava nada
   no repositório, só imprime o observado contra o esperado. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = "file:///C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/";
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const DSL = await import(R + "afty-dsl.js");
const H = await import(R + "afty-habilidades.js");
const AN = await import(R + "afty-alto-nivel.js");
const FE = await import(R + "afty-feiticos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

const linhas = [];
const caso = (id, esperado, observado) => {
  const ok = JSON.stringify(esperado) === JSON.stringify(observado);
  linhas.push(`${ok ? "OK   " : "FALHA"} ${id}: esperado ${JSON.stringify(esperado)}, observado ${JSON.stringify(observado)}`);
};

/* ---------- ISO-1: remendo de A alcança B no Encontro misto ---------- */
const TAL = "tal_nocao_e_preparacao";
const remendo = { id: "m05-remendo", nome: "Remendo de Teste", versao: "1",
  substitui: { talentos: [{ id: TAL, efeitos: [{ canal: "defesa", expr: "7" }] }] } };
const fichaTal = (sistema, addons) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 12, tipo: "combatente", patamar: "comum", origem: { id: "sem_tecnica" } };
  c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.talentos = [TAL];
  c.addons = addons;
  return c;
};
for (const [sa, sb] of [["afty", "player"], ["player", "afty"]]) {
  const A = fichaTal(sa, [remendo]);
  const B = fichaTal(sb, []);
  AD.aplicarAddons([]);
  const bSozinha = deriveAfty(B).defesa;
  AD.aplicarAddons(AD.unirAddons([A, B]).pacotes);
  const bNoEncontro = deriveAfty(B).defesa;
  caso(`ISO-1 B (${sb}) sem o pacote não muda no Encontro com A (${sa})`, bSozinha, bNoEncontro);
}

/* ---------- ISO-2: Base de addon concedida a quem não tem o pacote ---------- */
const base = { id: "m05-base", nome: "Base de Teste", versao: "1",
  acrescenta: { habilidades: [{ id: "bonus_base", nome: "Base da Mesa", descricao: "Teste",
    especializacaoId: "lutador", tipo: "base", nivel: 1, requisitos: [],
    efeitos: [{ canal: "defesa", expr: "3" }] }] } };
const fichaLut = (sistema, addons) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 1, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "lutador", nivel: 1 }];
  c.addons = addons;
  return c;
};
{
  const A = fichaLut("player", [base]);
  const B = fichaLut("player", []);
  AD.aplicarAddons(AD.unirAddons([A, B]).pacotes);
  const conc = H.habilidadesConcedidasPelasEspecializacoes([{ id: "lutador", nivel: 1 }], "player");
  caso("ISO-2 Base de addon NÃO concedida a B (player, sem pacote)", false, conc.includes("m05-base:bonus_base"));
  AD.aplicarAddons([]);
  const sozinha = deriveAfty(B).defesa;
  AD.aplicarAddons(AD.unirAddons([A, B]).pacotes);
  caso("ISO-2 Defesa de B igual com e sem o vizinho", sozinha, deriveAfty(B).defesa);
}

/* ---------- NS-1: requisitos[].ids[] fica cru ---------- */
{
  const p = { id: "m05-refs", nome: "Refs", versao: "1", acrescenta: { lendarias: [
    { id: "a", nome: "A", descricao: "a" }, { id: "b", nome: "B", descricao: "b" },
    { id: "c", nome: "C", descricao: "c", requisitos: [{ tipo: "lendariaOr", ids: ["a", "b"] }] },
  ] } };
  const r = AD.aplicarAddons([p]);
  caso("NS-1 pacote aceito", [], r.problemas);
  caso("NS-1 lendariaOr com namespace", ["m05-refs:a", "m05-refs:b"], AN.getHabilidadeLendaria("m05-refs:c")?.requisitos?.[0]?.ids);
}

/* ---------- NS-2: requisitos[].habId fica cru ---------- */
{
  const p = { id: "m05-esc", nome: "Esc", versao: "1", acrescenta: { habilidades: [
    { id: "mae", nome: "Mae", descricao: "m", especializacaoId: "lutador", tipo: "base", nivel: 1, requisitos: [],
      escolha: { id: "e", label: "E", opcoes: [{ id: "o1", nome: "O1", descricao: "o" }] } },
    { id: "irma", nome: "Irma", descricao: "i", especializacaoId: "lutador", tipo: "habilidade", nivel: 2,
      requisitos: [{ tipo: "escolha", habId: "mae", opcaoId: "o1", label: "Mae O1" }] },
  ] } };
  const r = AD.aplicarAddons([p]);
  caso("NS-2 habId com namespace", "m05-esc:mae", H.getHabilidade("m05-esc:irma")?.requisitos?.[0]?.habId);
  caso("NS-2 sem problema de validador", 0, r.problemas.length);
}

/* ---------- VAL-1: decimal malformado ---------- */
caso("VAL-1 validateExpression('1.2.3') reprova", false, DSL.validateExpression("1.2.3").ok);
caso("VAL-1 evalNumber('1.2.3') cai no fallback", -1, DSL.evalNumber("1.2.3", {}, -1));

/* ---------- VAL-2: Funcionamento de addon sem validação de canal/expr ---------- */
{
  const p = (ef) => ({ id: "m04-repro", nome: "Repro", versao: "1",
    funcionamentos: [{ id: "nucleo", nome: "Núcleo Próprio", efeitos: [ef] }] });
  caso("VAL-2 canal inexistente reprovado", true, AD.validarPacote(p({ canal: "canal_inexistente", expr: "1" })).length > 0);
  caso("VAL-2 expr inválida reprovada", true, AD.validarPacote(p({ canal: "defesa", expr: "nd +" })).length > 0);
  caso("VAL-2 quando inválido reprovado", true, AD.validarPacote(p({ canal: "defesa", expr: "1", quando: "nd >" })).length > 0);
  caso("VAL-2 válido passa", 0, AD.validarPacote(p({ canal: "defesa", expr: "2", quando: "nd >= 1" })).length);
}

/* ---------- VAL-3: evalBoolean com valor não finito ---------- */
caso("VAL-3 evalBoolean(Infinity) cai no fallback", false, DSL.evalBoolean("x", { x: Infinity }, false));

/* ---------- VAL-4: opt_ de Aptidão de addon ---------- */
{
  const p = { id: "mesa", nome: "Mesa", versao: "1", acrescenta: { aptidoes: [
    { id: "foco", nome: "Foco", descricao: "f", trilha: "au", nivel: 1, requisitos: [],
      opcoes: { label: "Eco", valores: [{ id: "eco", nome: "Eco" }, { id: "som", nome: "Som" }] } },
  ] } };
  const r = AD.aplicarAddons([p]);
  caso("VAL-4 pacote de aptidão aceito", 0, r.problemas.length);
  const c = createBlankAfty();
  c.addons = [p];
  c.aptidaoOpcoes = { "mesa:foco": "eco" };
  c.core = { ...c.core, tecnicaEfeitos: [{ canal: "defesa", expr: "4", quando: "opt_mesa_foco_eco" }] };
  const semOpcao = createBlankAfty(); semOpcao.addons = [p];
  semOpcao.core = { ...semOpcao.core, tecnicaEfeitos: [{ canal: "defesa", expr: "4", quando: "opt_mesa_foco_eco" }] };
  caso("VAL-4 opt_mesa_foco_eco liga a condição", 4, deriveAfty(c).defesa - deriveAfty(semOpcao).defesa);
}

/* ---------- ACU-1: fontes de atributo entre estágios ---------- */
for (const sistema of ["afty", "player"]) {
  AD.aplicarAddons([]);
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 5, tecnicaEfeitos: [
    { canal: "atributo", alvo: "forca", expr: "2" },
    { canal: "atributo", alvo: "forca", expr: "5", duracao: "temporaria" },
  ] };
  c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  const d = deriveAfty(c);
  const efetivo = d.atributos?.forca ?? d.attrEff?.forca;
  const soma = (d.partesAtributo?.forca ?? []).filter((p) => !p.suplantado && typeof p.valor === "number").reduce((s, p) => s + p.valor, 0);
  caso(`ACU-1 (${sistema}) parcelas somam o atributo efetivo`, efetivo, soma);
}

/* ---------- ACU-2: Estilo pelo Repertório e pelo Adepto ---------- */
for (const sistema of ["player", "afty"]) {
  AD.aplicarAddons([]);
  const mk = (comAdepto) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd: 16, tipo: "combatente", patamar: "comum" };
    c.especializacoes = [{ id: "combatente", nivel: 16 }];
    c.habilidades = ["cmb_repertorio_do_especialista"];
    c.escolhasHabilidade = { cmb_repertorio_do_especialista: ["cmb_estilo_defensivo"] };
    if (comAdepto) {
      c.talentos = ["tal_adepto_de_combate"];
      c.escolhasTalento = { tal_adepto_de_combate: ["cmb_estilo_defensivo"] };
      c.pericias = { ...(c.pericias || {}), intuicao: { treino: "mestre" } };
    }
    return c;
  };
  const sem = deriveAfty(mk(false));
  const com = deriveAfty(mk(true));
  const defensivo = (d) => (d.efeitos?.detalhes ?? []).filter((x) => x.canal === "defesa" && x.origem === "cmb_estilo_defensivo" && !x.suplantado).reduce((s, x) => s + x.valor, 0);
  caso(`ACU-2 (${sistema}) Defensivo pelos dois rende uma vez`, defensivo(sem), defensivo(com));
}

/* ---------- ALV-1: Atroz chega a Feitiço só de TR ---------- */
for (const sistema of ["player", "afty"]) {
  AD.aplicarAddons([]);
  const mk = (resolucao, atroz) => {
    const f = createBlankAfty();
    f.rulesVersion = sistema;
    f.core = { ...f.core, nd: 8, tipo: "combatente", patamar: "comum" };
    f.especializacoes = [{ id: "combatente", nivel: 8 }];
    f.habilidades = ["cmb_golpe_especial"];
    f.attributes = { forca: 16, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 14, presenca: 10 };
    f.feiticos = [{ ...FE.createBlankFeitico(), id: "fx", nome: "Raio", tipo: "dano", nivel: 1, resolucao }];
    f.combate = { ativo: true, golpeAtroz: atroz };
    return f;
  };
  const dados = (d) => d.feiticos.lista.find((x) => x.id === "fx").rolagens[0].dados;
  caso(`ALV-1 (${sistema}) Atroz NÃO soma dado em Feitiço de TR`, dados(deriveAfty(mk("tr", false))), dados(deriveAfty(mk("tr", true))));
  caso(`ALV-1 (${sistema}) Atroz conserva o Feitiço de ataque (leitura atual)`, dados(deriveAfty(mk("ataque", false))) + 1, dados(deriveAfty(mk("ataque", true))));
}

AD.aplicarAddons([]);
console.log(linhas.join("\n"));
console.log(`\n${linhas.filter((l) => l.startsWith("FALHA")).length} falhas de ${linhas.length} casos.`);
