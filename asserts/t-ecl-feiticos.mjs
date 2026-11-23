/* FEITIÇOS DE ECLESIASTES: o extrato por pontos (2026-11-23).

   Cobre `src/systems/eclesiastes/feiticos/orcamento.js` contra os números do
   próprio texto (`docs/eclesiastes-feiticos.md`): orçamento ND + 2×BT, Ação,
   Requisitos, Fadiga e Exaustão, Técnica Máxima, Duradouro com ⌈BT/2⌉, faixas
   da Linha com ⌈soma/9⌉, Liberação, Destrutivo, Cataclísmico, Múltiplos
   Disparos (12d8 em quatro dá 3d8), Dano Contínuo (5d8 dá 2d8 por rodada),
   Reação ×1,5, Permuta, Semiativo e Condição Em Revisão. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const E = new URL("../src/systems/eclesiastes/feiticos/", import.meta.url).href;
await import(R + "afty-derive.js");
const { calcularFeiticoEcl } = await import(E + "orcamento.js");
const { criarFeiticoEcl } = await import(E + "modelo.js");
const { AUX_EFEITOS_ECL } = await import(E + "tabelas.js");
const { EFEITO_CANAIS } = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const calc = (extra, ctx) => calcularFeiticoEcl(criarFeiticoEcl(extra), { bt: 4, temEnergiaReversa: true, ...ctx });
const fonte = (c, id) => c.fontes.find((f) => f.id === id);

/* ---------- Orçamento e Ação ---------- */
t("ND 8 com BT 4 tem 16 pontos", calc({ nd: 8 }).geral.total, 16);
t("Ação Bônus tira um BT", calc({ nd: 8, acao: "bonus" }).geral.total, 12);
t("Ação Completa soma um BT", calc({ nd: 8, acao: "completa" }).geral.total, 20);
t("Reação usa o orçamento inicial", calc({ nd: 8, acao: "reacao" }).geral.total, 16);
t("PE de conjuração é o ND", calc({ nd: 8 }).pe.total, 8);
t("Requisitos somam", calc({ nd: 1, requisitos: [{ dificuldade: "facil" }, { dificuldade: "impossivel" }] }).geral.total, 1 + 8 + 12);
t("Fadiga 1 e Exaustão 4", calc({ nd: 1, fadiga: 3, exaustao: 2 }).geral.total, 1 + 8 + 3 + 8);

/* ---------- Dados ---------- */
t("dado d8 até BT 4", calc({ nd: 4, dano: { dados: 3 } }).dano.faces, 8);
t("dado d10 no BT 5", calc({ nd: 4, dano: { dados: 3 } }, { bt: 5 }).dano.faces, 10);
t("dado d12 no BT 7", calc({ nd: 4, dano: { dados: 3 } }, { bt: 7 }).dano.faces, 12);
t("faltam pontos sem cortar", calc({ nd: 1, dano: { dados: 12 } }, { bt: 2 }).falta, 7);
t("o aviso de falta", calc({ nd: 1, dano: { dados: 12 } }, { bt: 2 }).avisos.includes("Faltam 7 Pontos"), true);
t("sobra", calc({ nd: 8, dano: { dados: 10 } }).sobra, 6);

/* ---------- Múltiplos Disparos e Contínuo (exemplos do texto) ---------- */
const disparos = calc({ nd: 20, dano: { dados: 12 }, multiplos: { ativo: true, disparos: 4 } });
t("12d8 em quatro disparos dá 3d8", [disparos.dano.porParte, disparos.dano.resto], [3, 0]);
t("Múltiplos custa BT", disparos.gastos.find((g) => g.id === "multiplos").custo, 4);
const continuo = calc({ nd: 9, dano: { dados: 5, continuo: true, duracaoContinuo: "duradouro" }, duracao: { rodadas: 3, concentracaoDuradoura: true } });
t("5d8 contínuo dá 2d8 por rodada", continuo.dano.porRodada, 2);
t("rodadas 2 e 3 grátis com Concentração", continuo.gastos.some((g) => g.id === "duradouro"), false);

/* ---------- Duração ---------- */
const dur = (conc) => calc({ nd: 12, auxiliares: [{ efeito: "defesa", unidades: 1, duracao: "duradouro" }], duracao: { rodadas: 4, concentracaoDuradoura: conc } }, { bt: 5 })
  .gastos.find((g) => g.id === "duradouro")?.custo ?? 0;
t("Duradouro: 3 rodadas a mais × ⌈5/2⌉", dur(false), 9);
t("Duradouro com Concentração: só a quarta", dur(true), 3);
const sust = (conc) => calc({ nd: 12, auxiliares: [{ efeito: "defesa", unidades: 5, duracao: "sustentado" }], duracao: { concentracaoSustentada: conc } }, { bt: 5 });
t("Sustentado custa BT", sust(false).gastos.find((g) => g.id === "sustentado").custo, 5);
t("Sustentado com Concentração dispensa a taxa", sust(true).gastos.some((g) => g.id === "sustentado"), false);
t("manutenção 1 + ⌊10/10⌋", sust(true).duracao.sustentado.manutencao, 2);

/* ---------- Alcance e Área ---------- */
t("9 m por ponto de alcance", calc({ nd: 8, alcance: { modo: "distancia", pontos: 2 } }).entrega.alcance.metros, 18);
const linha = calc({ nd: 12, area: { ativa: true, formato: "linha", pontos: 2, faixas: [{ metros: 9 }, { metros: 4.5 }] } });
t("Linha: principal 2 + ⌈13,5/9⌉ = 4", linha.gastos.find((g) => g.id === "areaDimensoes").custo, 4);
t("Habilitar Área custa BT", linha.gastos.find((g) => g.id === "areaHabilitar").custo, 4);
t("Esfera 3 m de raio por ponto", calc({ nd: 12, area: { ativa: true, formato: "esfera", pontos: 3 } }).entrega.area.metros, 9);
t("Auxiliar em Área custa BT", calc({ nd: 12, auxiliares: [{ efeito: "acerto", sentido: "debuff", unidades: 1, alvo: "area" }] })
  .gastos.find((g) => g.id === "auxEmArea").custo, 4);

/* ---------- Tipos especiais ---------- */
const destr = calc({ nd: 12, tipo: "destrutivo", dano: { dados: 10 }, area: { formato: "esfera", pontos: 4 } }, { bt: 5 });
t("Destrutivo ganha a Completa", destr.geral.total, 12 + 10 + 5);
t("Destrutivo +BT dados", destr.dano.dados, 15);
t("Destrutivo: metade dos pontos de área volta", destr.entrega.area.metros, 18);
t("Destrutivo liga a Área", destr.gastos.some((g) => g.id === "areaHabilitar"), true);
t("Destrutivo pede ND 12", calc({ nd: 10, tipo: "destrutivo" }, { bt: 5 }).avisos.includes("Destrutivo pede ND 12"), true);
const cata = calc({ nd: 18, tipo: "cataclismico", requisitos: [{ dificuldade: "dificil" }], dano: { dados: 5 } }, { bt: 6 });
t("Cataclísmico custa 3× BT", cata.gastos.find((g) => g.id === "cataclismico").custo, 18);
t("Cataclísmico ⌊1,5×BT⌋ dados", cata.dano.dados, 14);
t("Cataclísmico ignora resistências", cata.dano.ignorarResistencias, true);
t("Cataclísmico pede Requisito Difícil", calc({ nd: 18, tipo: "cataclismico" }, { bt: 6 }).avisos.includes("Cataclísmico pede um Requisito Difícil ou Impossível"), true);
const tm = calc({ nd: 12, tecnicaMaxima: true }, { bt: 5, temTecnicaMaxima: true });
t("Técnica Máxima: ND + 4× BT", tm.geral.total, 32);
t("Técnica Máxima: PE ND + BT", tm.pe.total, 17);
t("Técnica Máxima: recarga 6 − ⌊BT/2⌋", tm.recarga, 4);
t("Técnica Máxima: recarga mínima 2", calc({ nd: 40, tecnicaMaxima: true }, { bt: 10, temTecnicaMaxima: true }).recarga, 2);
t("Técnica Máxima sem a Aptidão avisa", calc({ nd: 12, tecnicaMaxima: true }, { bt: 5 }).avisos.includes("Técnica Máxima pede a Aptidão"), true);
t("Vampírico custa BT", calc({ nd: 8, dano: { dados: 2, vampirico: true } }).gastos.find((g) => g.id === "vampirico").custo, 4);

/* ---------- Liberação Máxima ---------- */
const lib = calc({ nd: 9, dano: { dados: 6 }, liberacao: { dados: 8 } });
t("Liberação: ⌊ND/2⌋ PE e pontos", lib.liberacao.peExtra, 4);
t("Liberação: + 4 pontos", fonte(lib, "liberacao").total, 8);
t("Liberação: 1 Fadiga a cada ⌊BT/2⌋ PE", lib.liberacao.fadiga, 2);
t("Liberação soma dados", lib.liberacao.dadosDano, 14);
t("Liberação não vaza para o orçamento geral", lib.geral.gasto, 6);
t("Liberação pede BT 4", calc({ nd: 9, liberacao: { dados: 1 } }, { bt: 3 }).avisos.includes("Liberação Máxima pede BT 4"), true);
t("Liberação: PE total junto", lib.liberacao.pe.total, 13);

/* Camada genérica (autor, 2026-11-23: "Pode Tudo"). Feitiço de Toque, só Dano. */
const { aplicarLiberacaoEcl, diferencaLiberacaoEcl } = await import(E + "modelo.js");
const gLib = (c, id) => c.gastos.find((g) => g.id === `lib:${id}`)?.custo ?? 0;
const tudo = calc({
  nd: 10, dano: { dados: 4 },
  liberacao: {
    alcance: { distancia: true, pontos: 1 },
    area: { ativa: true, formato: "esfera", pontos: 1 },
    auxiliaresNovos: [{ id: "x1", efeito: "acerto", unidades: 2 }],
    condicoesNovas: [{ id: "c1", condicao: "lento" }],
  },
});
t("Liberação liga Distância e cobra o alcance", gLib(tudo, "alcance"), 1);
t("Liberação liga Área: habilitar BT + dimensão", [gLib(tudo, "areaHabilitar"), gLib(tudo, "areaDimensoes")], [4, 1]);
t("Liberação compra efeito novo", gLib(tudo, "aux:x1") > 0, true);
t("Liberação compra Condição nova", gLib(tudo, "cond:c1") > 0, true);
t("Gasto da Liberação guarda a aba de origem", tudo.gastos.find((g) => g.id === "lib:alcance").abaOrigem, "alcance");
t("Feitiço liberado alcança 9 m", tudo.liberacao.alcanceMetros, 9);
t("Base continua de Toque", tudo.entrega.alcance.texto, "Toque");
t("Efeito só da Liberação não entra no base", tudo.efeitos.length, 0);
const reforco = calc({ nd: 10, auxiliares: [{ id: "a1", efeito: "defesa", unidades: 1 }], liberacao: { auxiliares: { a1: 1 } } });
t("Reforço de efeito do base cobra só a diferença", gLib(reforco, "aux:a1"), reforco.gastos.find((g) => g.id === "aux:a1").custo);
t("Teto vale no Feitiço liberado", calc({ nd: 10, auxiliares: [{ id: "a1", efeito: "margem", unidades: 2 }], liberacao: { auxiliares: { a1: 5 } } })
  .avisos.some((a) => a.startsWith("Na Liberação: ")), true);
const baseIda = criarFeiticoEcl({ nd: 10, dano: { dados: 4 }, auxiliares: [{ id: "a1", efeito: "defesa", unidades: 1 }] });
const editado = { ...aplicarLiberacaoEcl(baseIda), dano: { ...aplicarLiberacaoEcl(baseIda).dano, dados: 7 } };
const volta = diferencaLiberacaoEcl(baseIda, editado);
t("Ida e volta: 3 dados a mais", volta.dano.dados, 3);
const abaixo = diferencaLiberacaoEcl(baseIda, { ...editado, dano: { ...editado.dano, dados: 1 }, auxiliares: [] });
t("Ida e volta: nada fica abaixo do base", [abaixo.dano.dados, abaixo.auxiliares, abaixo.auxiliaresNovos.length], [0, {}, 0]);

/* ---------- Efeitos Auxiliares ---------- */
t("RD Geral 3 unidades vale 6", calc({ nd: 8, auxiliares: [{ efeito: "rdGeral", unidades: 3 }] }).efeitos[0].valor, 6);
t("Reação: 6 de RD vira 9", calc({ nd: 8, acao: "reacao", auxiliares: [{ efeito: "rdGeral", unidades: 3 }] }).efeitos[0].valor, 9);
t("Reação em metros arredonda no passo", calc({ nd: 8, acao: "reacao", auxiliares: [{ efeito: "deslocamento", unidades: 1 }] }).efeitos[0].valor, 1.5);
t("Reação não compra dado", calc({ nd: 8, acao: "reacao", dano: { dados: 5 } }).dano, null);
t("teto da Margem é ⌊BT/2⌋", calc({ nd: 8, auxiliares: [{ efeito: "margem", unidades: 3 }] }).avisos.includes("Margem de Crítico passa do teto (3 de 2)"), true);
t("teto do Nível de Dano é 2× BT", calc({ nd: 8, auxiliares: [{ efeito: "nivelDano", unidades: 8 }] }).efeitos[0].teto, 8);
t("efeito repetido no mesmo sentido avisa", calc({ nd: 8, auxiliares: [{ efeito: "defesa" }, { efeito: "defesa" }] }).avisos.includes("Defesa repetido como Bônus"), true);
t("bônus e debuff do mesmo efeito convivem", calc({ nd: 8, auxiliares: [{ efeito: "defesa" }, { efeito: "defesa", sentido: "debuff", alvo: "alvo" }] }).avisos.length, 0);
const perm = calc({ nd: 20, auxiliares: [{ efeito: "defesa", unidades: 6, permuta: { contrapartidas: [{ efeito: "deslocamento", unidades: 8 }] } }] });
t("Permuta: ⌊8/2⌋ pontos", fonte(perm, "permuta:" + perm.feitico.auxiliares[0].id).total, 4);
t("Permuta: teto ⌊1,5× BT⌋", perm.efeitos[0].teto, 6);
t("Permuta paga primeiro", perm.geral.gasto, 8);
t("Grupo Temático indisponível", calc({ nd: 8, auxiliares: [{ efeito: "grupoPericias" }] }).bloqueios.length, 1);
t("todo canal existe no Motor", AUX_EFEITOS_ECL.filter((e) => e.canal && !EFEITO_CANAIS.some((c) => c.id === e.canal)).map((e) => e.value), []);

/* ---------- Condições ---------- */
t("Condição custa a tabela", calc({ nd: 20, condicoes: [{ condicao: "lento" }] }).gastos.find((g) => g.id.startsWith("cond:")).custo, 5);
const cego = calc({ nd: 20, condicoes: [{ condicao: "cego" }] });
t("Condição Em Revisão é bloqueio, nunca zero", [cego.bloqueios, cego.gastos.length], [["Cego está Em Revisão"], 0]);

/* ---------- Passivos ---------- */
const semi = calc({ natureza: "passivo", passivo: { modo: "semiativo", usos: "um" }, auxiliares: [{ efeito: "acerto", unidades: 2, ativado: true }] }, { bt: 6 });
t("Passivo: orçamento BT", semi.geral.total, 6);
t("Semiativo: 1,5× BT e Um Uso", fonte(semi, "semiativo").total, 3 + 2);
t("Semiativo paga o ativado primeiro", [fonte(semi, "semiativo").gasto, semi.geral.gasto], [4, 0]);
t("Semiativo: usos", semi.usosSemiativo, 1);
t("Um Uso não rende quando o padrão já é 1", fonte(calc({ natureza: "passivo", passivo: { modo: "semiativo", usos: "um" } }, { bt: 3 }), "semiativo").total, 1);
t("Aprimoramento soma ⌊BT/2⌋", calc({ natureza: "passivo", passivo: { aprimoramentos: 2 } }, { bt: 5 }).geral.total, 9);
const cond = calc({ natureza: "passivo", passivo: { modo: "condicional", requisitos: [{ dificuldade: "medio" }] }, auxiliares: [{ efeito: "defesa", unidades: 2, condicional: true }, { efeito: "acerto", unidades: 2 }] });
t("Condicional só paga o efeito dependente", [fonte(cond, "condicional").gasto, cond.geral.gasto], [4, 4]);
t("Passivo não tem PE", semi.pe, null);

/* ---------- Integração com o derive ---------- */
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const branca = createBlankAfty("player");
const ficha = (extra = {}) => ({
  ...branca, rulesVersion: "player", edicaoDeRegras: "eclesiastes", core: { ...branca.core, nd: 9, nivel: 9 }, ...extra,
});
const comFeiticos = ficha({
  feiticos: [{ id: "velho", nome: "Velho", tipo: "dano", nivel: 2 }, { id: "tec", nome: "Técnica", tipo: "passivo", nivel: 1, marcial: true }],
  feiticosEcl: [
    { id: "p1", nome: "Pele", natureza: "passivo", passivo: { aprimoramentos: 1 }, auxiliares: [{ efeito: "defesa", unidades: 2 }] },
    { id: "a1", nome: "Raio", nd: 5, dano: { dados: 6, tipo: "queimante" } },
  ],
});
const dEcl = deriveAfty(comFeiticos);
const dSem = deriveAfty({ ...comFeiticos, feiticosEcl: [] });
t("Passivo Permanente soma Defesa", dEcl.defesa - dSem.defesa, 2);
t("lista traz as linhas novas", dEcl.feiticos.lista.filter((l) => l.edicao === "eclesiastes").map((l) => [l.id, l.nivelLabel, l.valor, l.custoPE]),
  [["p1", "Passivo", "+2 Defesa", null], ["a1", "ND 5", "6d8", 5]]);
t("Feitiço antigo criado sai da lista", dEcl.feiticos.lista.some((l) => l.id === "velho"), false);
t("Técnica Marcial fica", dEcl.tecnicasMarciais?.ids?.includes("tec") ?? true, true);
t("aquisições: dois Feitiços e um aprimoramento", dEcl.feiticos.gastos, 3);
t("extrato em feiticos.ecl", dEcl.feiticos.ecl.length, 2);
t("Possuir Feitiços conta os novos", deriveAfty(ficha({ feiticosEcl: [{ id: "x" }] })).feiticos.gastos, 1);
const fora = { ...comFeiticos, edicaoDeRegras: undefined };
t("fora de Eclesiastes não há extrato", deriveAfty(fora).feiticos.ecl, undefined);
t("fora de Eclesiastes o Feitiço novo não entra", deriveAfty(fora).defesa, deriveAfty({ ...fora, feiticosEcl: [] }).defesa);
const rdDois = deriveAfty(ficha({ feiticosEcl: [
  { id: "g", natureza: "passivo", auxiliares: [{ efeito: "rdGeral", unidades: 4 }] },
  { id: "q", natureza: "passivo", auxiliares: [{ efeito: "rdTipo", unidades: 3, escolha: "queimante" }] },
] }));
const rdBase = deriveAfty(ficha());
const linhasRd = (await import(E + "motor.js")).linhasDoMotorEcl(ficha(), [
  { calc: calc({ natureza: "passivo", nome: "G", auxiliares: [{ efeito: "rdGeral", unidades: 4 }] }) },
  { calc: calc({ natureza: "passivo", nome: "Q", auxiliares: [{ efeito: "rdTipo", unidades: 3, escolha: "queimante" }] }) },
]).map((l) => [l.canal, l.alvo ?? null, l.expr]);
t("RD de dois Feitiços: Geral 8 e Fogo líquido 4 (maior vale 12)", linhasRd, [["rdGeral", null, "8"], ["rdTipo", "queimante", "4"]]);
t("RD Geral de Feitiço chega ao derive", rdDois.rdGeral - rdBase.rdGeral, 8);

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
