/* Pacote Fórmula de Combate Entrópica (a Restrição Intelectual de Dr. Xeno),
   lido de `addons/formula-combate-entropica.json`, o mesmo JSON que a pessoa
   cola na aba Addons. Guia e decisões do autor em docs/afty-formula-entropica.md.

   Fase 2 (2026-09-28): a origem, a Especialização herdeira do Restringido, as
   Dádivas Intelectuais do Céu, os Talentos de Origem e os estados de combate.
   Mede também os verbos de motor que a fase pediu, cada um pelo conteúdo que o
   usa:
     • `bonus.livres` na distribuição de atributo da origem;
     • o canal `ataqueAtributo` (INT no acerto E no dano);
     • o teto de faixa por expressão (`max: "bt"`);
     • `efeitos` escritos na opção de escolha aninhada;
     • `usos` e `resultados` em origem, Talento, Habilidade e opção, com as
       recargas `cena` e `rodada` devolvidas pela sessão;
     • a porta `requerEscolha` nos estados de Addon;
     • a variação que NÃO recebe a escada do desarmado do Restringido.

   Tudo nos DOIS sistemas (decisão 4 do autor). */
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
const H = await import(R + "afty-habilidades.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { conteudoDaFicha } = await import(R + "ficha/ficha-conteudo.js");
const { linhasDeEstado } = await import(R + "ficha/ficha-buffs.js");

const BRUTO = JSON.parse(readFileSync(new URL("../addons/formula-combate-entropica.json", import.meta.url), "utf8"));

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const P = "formula-combate-entropica:";
const ORIGEM = `${P}restricao_intelectual`;
const ESP = `${P}res_intelectual`;
const clone = (id) => `${ESP}__${id}`;
const CONGENITA = clone("res_restrito_pelos_ceus");
const DEFINITIVA = clone("res_restricao_definitiva");
const pacote = A.normalizarPacote(BRUTO);

t("pacote válido", A.validarPacote(BRUTO), []);
t("instala sem problema de validador", A.aplicarAddons([pacote]).problemas, []);
t("pede a primitiva do canal de ataque", pacote.permite, ["ataqueAtributo"]);
t("as recargas de cena e rodada existem", ["cena", "rodada"].every((r) => H.USOS_RECARGAS.includes(r)), true);

/* ---------------- a origem e a classe ---------------- */
t("a origem varia o Restringido", O.origemMae(ORIGEM), "restringido");
t("e fica presa à herdeira", O.getOrigem(ORIGEM)?.especializacaoExclusivaId, ESP);
t("a Restrição Congênita troca o Restrito pelos Céus", H.getHabilidade(CONGENITA)?.nome, "Restrição Congênita Intelectual");
t("a Definitiva é a Intelectual", H.getHabilidade(DEFINITIVA)?.nome, "Restrição Definitiva Intelectual");
t("e ela substitui a do livro inteira, sem efeito", H.getHabilidade(DEFINITIVA)?.efeitos, []);
t("são 11 Dádivas Intelectuais", H.getHabilidade(CONGENITA)?.escolha?.opcoes?.length, 11);
t("no calendário das Dádivas do Céu", H.getHabilidade(CONGENITA)?.escolha?.niveis, [4, 8, 12, 16, 20]);
t("o Respeito Celeste da herdeira dá Dádiva Intelectual",
  H.getHabilidade(clone("res_respeito_celeste"))?.concedeEscolha?.habilidade, CONGENITA);

/* Uma Restrição Intelectual com as escolhas pedidas. */
const ficha = (nd, sistema, extra = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.addons = [pacote];
  c.core.nd = nd;
  c.core.tipo = "restringido";
  c.core.origem = {
    id: ORIGEM,
    bonusAtributos: { inteligencia: 3, destreza: 1 },
    pools: { restricao_congenita_intelectual: { inteligencia: 2 * Math.floor(nd / 6) } },
  };
  c.attributes = { forca: 10, destreza: 14, constituicao: 12, inteligencia: 16, sabedoria: 12, presenca: 10 };
  c.especializacoes = [{ id: ESP, nivel: nd }];
  // Na criatura as Bases não são automáticas, então a Congênita entra à mão.
  c.habilidades = [CONGENITA];
  return Object.assign(c, extra);
};
const linhas = (d) => d.efeitos?.detalhes ?? [];
const soma = (d, canal, filtro) => linhas(d)
  .filter((e) => e.canal === canal && filtro(e))
  .reduce((s, e) => s + e.valor, 0);
const daFonte = (d, canal, nome) => soma(d, canal, (e) => e.nome === nome);
const emCombate = (estados) => ({ combate: { ativo: true, ...estados } });
const ataque = (d, id = "corpo") => (d.testes?.ataques ?? []).find((a) => a.id === id);
const basico = (d) => (d.dano?.entradas ?? []).find((e) => e.id === "basico");
const pericia = (d, id) => (d.testes?.pericias ?? []).find((p) => p.id === id);

for (const sistema of ["afty", "player"]) {
  const tag = `[${sistema}]`;
  const d = deriveAfty(ficha(12, sistema));

  /* A origem: 4 pontos (um livre), INT a 30, +2 de INT a cada 6 níveis. */
  t(`${tag} INT 16 + 3 da origem + 4 da Congênita`, d.attrEff?.inteligencia, 23);
  t(`${tag} o limite da INT é 30, e os físicos ficam em 20`,
    [d.attrLimiteEfetivo?.inteligencia, d.attrLimiteEfetivo?.forca, d.attrLimiteEfetivo?.destreza], [30, 20, 20]);
  t(`${tag} o recurso é Estamina`, d.recursoLabel, "Estamina");
  t(`${tag} o Bônus em Atributo tem 1 ponto livre`,
    O.caracteristicasEfetivas(ficha(12, sistema)).find((c) => c.id === "bonus_atributo")?.bonus?.livres, 1);

  /* Defesa: "+ Inteligência, limitado pelo nível" (decisão 7). */
  t(`${tag} a Congênita soma a INT na Defesa`, soma(d, "defesa", (e) => e.origem === CONGENITA), 6);
  t(`${tag} limitada pelo nível`, soma(deriveAfty(ficha(3, sistema)), "defesa", (e) => e.origem === CONGENITA), 3);

  /* INT no acerto e no dano (decisão 16), vale o maior. */
  t(`${tag} o ataque corpo a corpo usa INT`, ataque(d)?.atributo, "inteligencia");
  t(`${tag} e o hover diz de onde veio`, ataque(d)?.partes?.[0]?.label, "Inteligência (Restrição Congênita Intelectual)");
  t(`${tag} a distância também`, ataque(d, "distancia")?.atributo, "inteligencia");
  t(`${tag} o Amaldiçoado não é tocado`, ataque(d, "amaldicoado")?.partes?.[0]?.label === "Inteligência (Restrição Congênita Intelectual)", false);
  t(`${tag} o dano do golpe básico usa INT`, basico(d)?.atributo, "inteligencia");
  const forte = deriveAfty(ficha(12, sistema, { attributes: { forca: 20, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 } }));
  t(`${tag} com FOR maior, a FOR fica`, [ataque(forte)?.atributo, basico(forte)?.atributo], ["forca", "forca"]);

  /* O contador de falhas contra o mesmo inimigo: faixa até o BT, e o bônus em
     ataque, TR e perícia (decisão 18). */
  const faixa = (x) => (x.combate?.estadosExtras ?? []).find((e) => e.id === `${P}falhas_alvo`);
  t(`${tag} a faixa vai até o BT (4 no 12)`, faixa(d)?.max, 4);
  t(`${tag} e até 2 no 1`, faixa(deriveAfty(ficha(1, sistema)))?.max, 2);
  const falhou = deriveAfty(ficha(12, sistema, emCombate({ [`${P}falhas_alvo`]: 3 })));
  const CONTRA = "Restrição Congênita · Contra o Alvo";
  t(`${tag} 3 falhas dão +3 no ataque, no TR e na perícia`,
    [daFonte(falhou, "bonusAcerto", CONTRA), daFonte(falhou, "bonusTR", CONTRA), daFonte(falhou, "bonusPericia", CONTRA)], [3, 3, 3]);
  const foraDeCombate = deriveAfty(ficha(12, sistema, { combate: { ativo: false, [`${P}falhas_alvo`]: 3 } }));
  t(`${tag} fora de combate não conta`, daFonte(foraDeCombate, "bonusAcerto", CONTRA), 0);

  /* A Inferência Rápida SOMA (decisão 13): +2 por falha, até o BT. */
  const inferencia = (falhas) => deriveAfty(ficha(12, sistema, {
    escolhasHabilidade: { [CONGENITA]: ["dint_inferencia_rapida"] },
    ...emCombate({ [`${P}falhas_alvo`]: falhas }),
  }));
  t(`${tag} Inferência: 1 falha dá +2`, daFonte(inferencia(1), "bonusAcerto", "Inferência Rápida"), 2);
  t(`${tag} Inferência: para no BT`, daFonte(inferencia(4), "bonusAcerto", "Inferência Rápida"), 4);
  t(`${tag} e soma com a Congênita`, [daFonte(inferencia(2), "bonusTR", CONTRA), daFonte(inferencia(2), "bonusTR", "Inferência Rápida")], [2, 4]);
  t(`${tag} sem a Dádiva não há Inferência`, daFonte(falhou, "bonusAcerto", "Inferência Rápida"), 0);

  /* Mesmo feitiço duas vezes: RD igual ao BT. */
  const repetido = deriveAfty(ficha(12, sistema, emCombate({ [`${P}feitico_repetido`]: true })));
  t(`${tag} mesmo feitiço dá RD igual ao BT`, daFonte(repetido, "rdGeral", "Restrição Congênita · Mesmo Feitiço"), 4);

  /* Hipótese Adaptativa: o número de mesa e o +2 de RD pelo estado. */
  const hipotese = (estados = {}) => deriveAfty(ficha(12, sistema, {
    escolhasHabilidade: { [CONGENITA]: ["dint_hipotese_adaptativa"] },
    ...emCombate(estados),
  }));
  t(`${tag} Hipótese: a Redução é mod INT + mod SAB`,
    hipotese().mesa?.[`opcao:${CONGENITA}:dint_hipotese_adaptativa`]?.resultados, [{ label: "Redução", valor: 7 }]);
  t(`${tag} Hipótese: +2 de RD com o estado`, daFonte(hipotese({ [`${P}hipotese_tipo`]: true }), "rdGeral", "Hipótese Adaptativa"), 2);
  const estadosVisiveis = (x) => linhasDeEstado(x).map((e) => e.id).filter((id) => id.startsWith(P));
  t(`${tag} o estado da Hipótese só aparece com a Dádiva (requerEscolha)`,
    [estadosVisiveis(hipotese()).includes(`${P}hipotese_tipo`), estadosVisiveis(d).includes(`${P}hipotese_tipo`)], [true, false]);

  /* Contadores de mesa das Dádivas. */
  const memoria = (nd) => deriveAfty(ficha(nd, sistema, {
    escolhasHabilidade: { [CONGENITA]: ["dint_memoria_tatica", "dint_calculo_de_precisao"] },
  })).mesa ?? {};
  t(`${tag} Memória Tática: 1 por cena no 9`, memoria(9)[`opcao:${CONGENITA}:dint_memoria_tatica`]?.usos?.max, 1);
  t(`${tag} e 2 no 10`, memoria(10)[`opcao:${CONGENITA}:dint_memoria_tatica`]?.usos?.max, 2);
  t(`${tag} a chave dela leva a recarga`, memoria(10)[`opcao:${CONGENITA}:dint_memoria_tatica`]?.usos?.chave,
    `cena:opcao:${CONGENITA}:dint_memoria_tatica`);
  t(`${tag} Cálculo de Precisão: mod INT por descanso longo`,
    [memoria(12)[`opcao:${CONGENITA}:dint_calculo_de_precisao`]?.usos?.max, memoria(12)[`opcao:${CONGENITA}:dint_calculo_de_precisao`]?.usos?.recarga], [6, "longo"]);

  /* Origem: Análise de Campo e Estratagema de Guerra. */
  t(`${tag} Análise de Campo: 1 por combate, bônus e turnos prontos`, d.mesa?.["origem:analise_de_campo"],
    { usos: { max: 1, recarga: "cena", chave: "cena:origem:analise_de_campo" },
      resultados: [{ label: "Bônus dos Aliados", valor: 2 }, { label: "Turnos", valor: 6 }] });
  t(`${tag} Estratagema: aliados e bônus`, d.mesa?.["origem:estratagema_de_guerra"]?.resultados,
    [{ label: "Aliados", valor: 1 }, { label: "Bônus do Aliado", valor: 4 }]);

  /* Talentos de Origem. */
  const comTalentos = (talentos, extra = {}) => deriveAfty(ficha(12, sistema, {
    talentos: talentos.map((id) => `${P}${id}`),
    pericias: { percepcao: "mestre", intuicao: "treinado" },
    ...extra,
  }));
  const obs = comTalentos(["tal_observador_incansavel"]);
  t(`${tag} Observador: BT inteiro na perícia de Mestre, metade na outra`,
    [daFonte(obs, "bonusPericia", "Observador Incansável"), soma(obs, "bonusPericia", (e) => e.nome === "Observador Incansável" && e.alvo === "intuicao")], [6, 2]);
  const plan = (primeira) => comTalentos(["tal_planejamento_perfeito"], emCombate({ [`${P}primeira_cena`]: primeira }));
  t(`${tag} Planejamento Perfeito: metade do BT na Iniciativa na primeira cena`,
    [daFonte(plan(true), "iniciativa", "Planejamento Perfeito"), daFonte(plan(false), "iniciativa", "Planejamento Perfeito")], [2, 0]);
  const leitura = comTalentos(["tal_leitura_antecipada"], emCombate({ [`${P}leitura_antecipada`]: true }));
  t(`${tag} Leitura Antecipada: +2 de Defesa na reação`, daFonte(leitura, "defesa", "Leitura Antecipada"), 2);
  t(`${tag} e 1 por rodada`, leitura.mesa?.[`talento:${P}tal_leitura_antecipada`]?.usos?.chave, `rodada:talento:${P}tal_leitura_antecipada`);
  const contra = comTalentos(["tal_contra_medida_rapida"], emCombate({ [`${P}contra_medida`]: true }));
  t(`${tag} Contra-Medida Rápida: metade do BT no TR`, daFonte(contra, "bonusTR", "Contra-Medida Rápida"), 2);
  t(`${tag} Análise Balística: metade do mod de INT`,
    comTalentos(["tal_analise_balistica"]).mesa?.[`talento:${P}tal_analise_balistica`]?.resultados, [{ label: "Dano Adicional", valor: 3 }]);

  /* A Restrição Definitiva Intelectual: 1 reação por rodada, e sem efeito do livro. */
  const d10 = deriveAfty(ficha(10, sistema, { habilidades: [CONGENITA, DEFINITIVA] }));
  t(`${tag} a Definitiva Intelectual tem 1 uso por rodada`, d10.usosHabilidades?.[DEFINITIVA]?.chave, `rodada:hab:${DEFINITIVA}`);
  t(`${tag} e não dá o Nível de Dano nem os 3 m do livro`,
    [soma(d10, "nivelDano", (e) => e.origem === DEFINITIVA), soma(d10, "movimento", (e) => e.origem === DEFINITIVA)], [0, 0]);
}

/* ---------------- a escada do desarmado não desce (decisão 9) ---------------- */
{
  const d = deriveAfty(ficha(12, "player"));
  const livro = createBlankAfty();
  livro.rulesVersion = "player";
  livro.core.nd = 12;
  livro.core.tipo = "restringido";
  livro.core.origem = { id: "restringido" };
  livro.especializacoes = [{ id: "restringido", nivel: 12 }];
  const dado = (x) => String(basico(x)?.texto ?? "").split(" ")[0];
  t("o Restringido do livro tem a escada (1d12 no 12)", dado(deriveAfty(livro)), "1d12");
  t("a Restrição Intelectual não tem", dado(d) !== "1d12", true);
}

/* ---------------- a Ficha Final ---------------- */
{
  const c = ficha(12, "player", {
    escolhasHabilidade: { [CONGENITA]: ["dint_inferencia_rapida", "dint_calculo_de_precisao", "dint_hipotese_adaptativa"] },
    talentos: [`${P}tal_diretivas_de_combate`],
  });
  const itens = conteudoDaFicha(c, deriveAfty(c));
  const chaves = itens.map((i) => i.chave);
  const mae = itens.find((i) => i.chave === `especializacao:${CONGENITA}`);
  t("a Dádiva com contador vira linha própria", chaves.includes(`opcao:${CONGENITA}:dint_calculo_de_precisao`), true);
  t("logo abaixo da mãe",
    chaves.indexOf(`opcao:${CONGENITA}:dint_calculo_de_precisao`) > chaves.indexOf(`especializacao:${CONGENITA}`), true);
  t("e sai da lista de opções da mãe, que fica com a que só tem efeito", mae?.opcoes?.map((o) => o.id), ["dint_inferencia_rapida"]);
  const hip = itens.find((i) => i.chave === `opcao:${CONGENITA}:dint_hipotese_adaptativa`);
  t("o número de mesa vira chip, separado das marcas",
    [hip?.tags?.map((x) => x.label), hip?.numeros], [["Dádiva Intelectual do Céu"], ["Redução: 7"]]);
  const analise = itens.find((i) => i.chave === "origem:analise_de_campo");
  t("a característica de origem ganha contador e números",
    [analise?.usos?.chave, analise?.numeros],
    ["cena:origem:analise_de_campo", ["Bônus dos Aliados: 2", "Turnos: 6"]]);
  const dir = itens.find((i) => i.chave === `talento:${P}tal_diretivas_de_combate`);
  t("o Talento também", [dir?.usos?.max, dir?.numeros], [1, ["Bônus do Aliado: 2"]]);
}

/* ---------------- a sessão devolve por recarga ---------------- */
{
  const usos = { "cena:origem:analise_de_campo": 1, "rodada:talento:x": 1, "origem:estratagema_de_guerra": 1 };
  const base = { rodada: 3, usos, buffs: [], condicoes: [], combate: {} };
  t("a virada da rodada devolve só os de rodada",
    Object.keys(S.proximaRodada(base, null).sessao.usos).sort(), ["cena:origem:analise_de_campo", "origem:estratagema_de_guerra"]);
  t("a cena nova devolve os de cena (e os de rodada, pela virada)",
    Object.keys(S.proximaRodada({ ...base, rodada: 0 }, null).sessao.usos), ["origem:estratagema_de_guerra"]);
  t("iniciar o combate devolve os de cena",
    Object.keys(S.iniciaCombate({ ...base, usos: { ...usos } }).usos).sort(), ["origem:estratagema_de_guerra", "rodada:talento:x"]);
}

/* ---------------- sem o pacote, nada vaza ---------------- */
{
  const lutador = createBlankAfty();
  lutador.rulesVersion = "player";
  lutador.core.nd = 12;
  lutador.core.origem = { id: "inato" };
  lutador.especializacoes = [{ id: "lutador", nivel: 12 }];
  lutador.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 20, sabedoria: 10, presenca: 10 };
  A.aplicarAddons([pacote]);
  const comPacote = deriveAfty({ ...lutador, addons: [pacote] });
  t("quem não tem a Congênita não usa INT no ataque", ataque(comPacote)?.atributo, "forca");
  t("nem ganha os estados da classe", linhasDeEstado(comPacote).some((e) => e.id === `${P}falhas_alvo`), false);
  A.aplicarAddons([]);
  t("sem o pacote a origem some", O.getOrigem(ORIGEM), null);
}

if (falhas.length) {
  console.error(`FALHOU ${falhas.length} de ${ok + falhas.length}:\n  - ${falhas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
