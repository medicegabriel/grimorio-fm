/* Pacote Fórmula de Combate Entrópica (a Restrição Intelectual de Dr. Xeno),
   lido de `addons/formula-combate-entropica.json`, o mesmo JSON que a pessoa
   cola na aba Addons. Guia e decisões do autor em docs/afty-formula-entropica.md.

   Fase 2 (2026-09-28): a origem, as Dádivas Intelectuais do Céu, os Talentos de
   Origem e os estados de combate. REFEITO em 2026-11-14 (item 6 do autor): a
   herdeira do Restringido saiu, a origem é a dona de tudo, e quem tem o pacote
   escolhe Especialista em Técnica (Conjurador) e/ou Suporte, com o Suporte lendo
   a Inteligência. Segue sem energia (Estamina) e com as Dádivas do Céu do livro.
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
const E = await import(R + "afty-especializacoes.js");
const H = await import(R + "afty-habilidades.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { conteudoDaFicha, equipamentosDaFicha } = await import(R + "ficha/ficha-conteudo.js");
const { resolveEquipamentos } = await import(R + "afty-equipamentos.js");
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
const CONGENITA = "Restrição Congênita Intelectual";
const ESCOLHA = "dadiva_intelectual";
const DEFINITIVA = "origem:restricao_definitiva_intelectual";
const pacote = A.normalizarPacote(BRUTO);

t("pacote válido", A.validarPacote(BRUTO), []);
t("instala sem problema de validador", A.aplicarAddons([pacote]).problemas, []);
t("pede a primitiva do canal de ataque", pacote.permite, ["ataqueAtributo"]);
t("as recargas de cena e rodada existem", ["cena", "rodada"].every((r) => H.USOS_RECARGAS.includes(r)), true);

/* ---------------- a origem e as classes ---------------- */
const origemDef = O.getOrigem(ORIGEM);
t("a origem varia o Restringido", O.origemMae(ORIGEM), "restringido");
t("é sem energia", origemDef?.semEnergia, true);
t("alcança só Conjurador e Suporte", origemDef?.especializacoesPermitidas, ["conjurador", "suporte"]);
t("o Suporte lê a Inteligência", O.atributoSuporteDaOrigem(ORIGEM), "inteligencia");
t("não prende mais a uma herdeira", origemDef?.especializacaoExclusivaId ?? null, null);
t("e o pacote não traz Especialização", Object.keys(pacote.acrescenta ?? {}).includes("especializacoes"), false);
t("a lista de classes da origem", E.especializacoesDisponiveis(ORIGEM, []).map((e) => e.id), ["conjurador", "suporte"]);
t("sem obrigar uma", E.especializacaoObrigatoria(ORIGEM), null);
t("o Restringido do livro continua fechado para ela", E.especializacoesDisponiveis(ORIGEM, []).some((e) => e.id === "restringido"), false);
t("e a origem Restringido do livro segue presa ao Restringido", E.especializacoesDisponiveis("restringido", []).map((e) => e.id), ["restringido"]);
const escolhaDef = O.caracteristicasEfetivas({ core: { origem: { id: ORIGEM } } })
  .find((c) => c.id === "dadivas_do_ceu")?.escolhas?.[0];
t("são 11 Dádivas Intelectuais e 9 do Céu", [escolhaDef?.opcoes?.filter((o) => o.id.startsWith("dint_")).length,
  escolhaDef?.opcoes?.filter((o) => o.id.startsWith("res_dadiva_")).length], [11, 9]);
t("no calendário das Dádivas do Céu", escolhaDef?.niveis, [4, 8, 12, 16, 20]);
t("as do livro têm o texto do livro", escolhaDef?.opcoes?.find((o) => o.id === "res_dadiva_fisico_robusto")?.descricao,
  H.DADIVAS_DO_CEU.find((o) => o.id === "res_dadiva_fisico_robusto")?.descricao);
t("e não carregam efeito copiado (vem do mapa do livro)",
  escolhaDef?.opcoes?.filter((o) => o.id.startsWith("res_dadiva_")).some((o) => o.efeitos), false);
t("o requisito de Multiclasse do Suporte pede INT 16",
  [E.faltaRequisitoMulticlasse("suporte", { inteligencia: 15, presenca: 20 }, ORIGEM)?.attrs,
    E.faltaRequisitoMulticlasse("suporte", { inteligencia: 16 }, ORIGEM)],
  [["inteligencia"], null]);
t("sem a origem segue PRE ou SAB", E.faltaRequisitoMulticlasse("suporte", { inteligencia: 20, presenca: 10 }, "inato")?.attrs, ["presenca", "sabedoria"]);

/* Uma Restrição Intelectual com as escolhas pedidas. */
const ficha = (nd, sistema, extra = {}, dadivas = []) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.addons = [pacote];
  c.core.nd = nd;
  c.core.tipo = "restringido";
  c.core.origem = {
    id: ORIGEM,
    bonusAtributos: { inteligencia: 3, destreza: 1 },
    pools: { restricao_congenita_intelectual: { inteligencia: 2 * Math.floor(nd / 6) } },
    escolhas: { [ESCOLHA]: dadivas },
  };
  c.attributes = { forca: 10, destreza: 14, constituicao: 12, inteligencia: 16, sabedoria: 12, presenca: 10 };
  c.especializacoes = [{ id: "conjurador", nivel: nd }];
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
  const escudo = { uid: "escudo-teste", tipo: "escudo", refId: "esc_medio", qtd: 1, equipado: true };
  const rdEscudo = (engenhoSuperior) => resolveEquipamentos(ficha(12, sistema, {
    equipamentos: { itens: [{ ...escudo, engenhoSuperior }] },
  })).entradas[0]?.def.rdEscudo;
  t(`${sistema}: escudo do catálogo modificado recebe RD 6`, rdEscudo(true), 6);
  t(`${sistema}: escudo sem marca conserva RD 4`, rdEscudo(false), 4);
  const recebido = createBlankAfty();
  recebido.rulesVersion = sistema;
  recebido.equipamentos = { itens: [{ ...escudo, engenhoRecebido: true }] };
  // Sem o Addon da Fórmula o Engenho Recebido não vale.
  const semAddon = deriveAfty(recebido).equip.entradas[0]?.def.rdEscudo;
  t(`${sistema}: Engenho Recebido sem o Addon conserva RD 4`, semAddon, 4);
  recebido.addons = [{ id: "formula-combate-entropica" }];
  const recebidoDerivado = deriveAfty(recebido);
  const [linha] = equipamentosDaFicha(recebidoDerivado);
  t(`${sistema}: aliado recebe o escudo com RD 6`, recebidoDerivado.equip.entradas[0]?.def.rdEscudo, 6);
  t(`${sistema}: aliado tem uma vantagem manual`, linha?.usos?.max, 1);
  const arma = {
    uid: "arma-teste", tipo: "arma", refId: "arm_adaga", qtd: 1, equipado: true,
    engenhoSuperior: true,
    fa: { grau: "especial", encantamentos: ["enc_arma_afiada", "enc_arma_balanceada", "enc_arma_certeira"] },
  };
  const fa = resolveEquipamentos(ficha(12, sistema, { equipamentos: { itens: [arma] } })).entradas[0]?.fa;
  t(`${sistema}: Engenho limita os encantamentos efetivos a dois`, fa?.escolhidos?.length, 2);
  /* Os bônus numéricos que ficavam de fora (2026-11-14, redesenho da 2b): só o
     número sobe 1,5x (para baixo), e o dado de dano da arma não muda. */
  const efeitoDoEnc = (tipo, refId, enc, engenho) => resolveEquipamentos(ficha(12, sistema, {
    equipamentos: { itens: [{ uid: "x", tipo, refId, qtd: 1, equipado: true, engenhoSuperior: engenho, fa: { grau: "especial", encantamentos: [enc] } }] },
  })).entradas[0]?.fa?.efeitos?.map((e) => `${e.canal}=${e.valor}`);
  for (const [enc, tipo, refId, sem, com] of [
    ["enc_arma_cruel", "arma", "arm_adaga", ["danoBonus=3"], ["danoBonus=4"]],
    ["enc_arma_penetrante", "arma", "arm_adaga", ["ignoraRD=2"], ["ignoraRD=3"]],
    ["enc_arma_otimizada", "arma", "arm_adaga", ["iniciativa=2"], ["iniciativa=3"]],
    ["enc_arma_balanceada", "arma", "arm_adaga", ["bonusManobra=2", "resistirManobra=2"], ["bonusManobra=3", "resistirManobra=3"]],
    ["enc_esc_reforcado", "escudo", "esc_medio", ["rdGeral=2"], ["rdGeral=3"]],
  ]) {
    t(`${sistema}: ${enc} sem Engenho`, efeitoDoEnc(tipo, refId, enc, false), sem);
    t(`${sistema}: ${enc} com Engenho sobe 1,5x`, efeitoDoEnc(tipo, refId, enc, true), com);
  }
  const dadoDaArma = (engenho) => resolveEquipamentos(ficha(12, sistema, {
    equipamentos: { itens: [{ uid: "x", tipo: "arma", refId: "arm_adaga", qtd: 1, equipado: true, engenhoSuperior: engenho }] },
  })).entradas[0]?.def?.dano;
  t(`${sistema}: o dado de dano da arma não muda com o Engenho`, dadoDaArma(true), dadoDaArma(false));
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
  t(`${tag} a Congênita soma a INT na Defesa`, soma(d, "defesa", (e) => e.nome === CONGENITA), 6);
  t(`${tag} limitada pelo nível`, soma(deriveAfty(ficha(3, sistema)), "defesa", (e) => e.nome === CONGENITA), 3);

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
    ...emCombate({ [`${P}falhas_alvo`]: falhas }),
  }, ["dint_inferencia_rapida"]));
  t(`${tag} Inferência: 1 falha dá +2`, daFonte(inferencia(1), "bonusAcerto", "Inferência Rápida"), 2);
  t(`${tag} Inferência: para no BT`, daFonte(inferencia(4), "bonusAcerto", "Inferência Rápida"), 4);
  t(`${tag} e soma com a Congênita`, [daFonte(inferencia(2), "bonusTR", CONTRA), daFonte(inferencia(2), "bonusTR", "Inferência Rápida")], [2, 4]);
  t(`${tag} sem a Dádiva não há Inferência`, daFonte(falhou, "bonusAcerto", "Inferência Rápida"), 0);

  /* Mesmo feitiço duas vezes: RD igual ao BT. */
  const repetido = deriveAfty(ficha(12, sistema, emCombate({ [`${P}feitico_repetido`]: true })));
  t(`${tag} mesmo feitiço dá RD igual ao BT`, daFonte(repetido, "rdGeral", "Restrição Congênita · Mesmo Feitiço"), 4);

  /* Hipótese Adaptativa: o número de mesa e o +2 de RD pelo estado. */
  const hipotese = (estados = {}) => deriveAfty(ficha(12, sistema, {
    ...emCombate(estados),
  }, ["dint_hipotese_adaptativa"]));
  t(`${tag} Hipótese: a Redução é mod INT + mod SAB`,
    hipotese().mesa?.[`opcao:${ESCOLHA}:dint_hipotese_adaptativa`]?.resultados, [{ label: "Redução", valor: 7 }]);
  t(`${tag} Hipótese: +2 de RD com o estado`, daFonte(hipotese({ [`${P}hipotese_tipo`]: true }), "rdGeral", "Hipótese Adaptativa"), 2);
  const estadosVisiveis = (x) => linhasDeEstado(x).map((e) => e.id).filter((id) => id.startsWith(P));
  t(`${tag} o estado da Hipótese só aparece com a Dádiva (requerEscolha)`,
    [estadosVisiveis(hipotese()).includes(`${P}hipotese_tipo`), estadosVisiveis(d).includes(`${P}hipotese_tipo`)], [true, false]);

  /* Contadores de mesa das Dádivas. */
  const memoria = (nd) => deriveAfty(ficha(nd, sistema, {}, ["dint_memoria_tatica", "dint_calculo_de_precisao"])).mesa ?? {};
  t(`${tag} Memória Tática: 1 por cena no 9`, memoria(9)[`opcao:${ESCOLHA}:dint_memoria_tatica`]?.usos?.max, 1);
  t(`${tag} e 2 no 10`, memoria(10)[`opcao:${ESCOLHA}:dint_memoria_tatica`]?.usos?.max, 2);
  t(`${tag} a chave dela leva a recarga`, memoria(10)[`opcao:${ESCOLHA}:dint_memoria_tatica`]?.usos?.chave,
    `cena:opcao:${ESCOLHA}:dint_memoria_tatica`);
  t(`${tag} Cálculo de Precisão: mod INT por descanso longo`,
    [memoria(12)[`opcao:${ESCOLHA}:dint_calculo_de_precisao`]?.usos?.max, memoria(12)[`opcao:${ESCOLHA}:dint_calculo_de_precisao`]?.usos?.recarga], [6, "longo"]);

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
  const d10 = deriveAfty(ficha(10, sistema));
  t(`${tag} a Definitiva Intelectual tem 1 uso por rodada no 10`, d10.mesa?.[DEFINITIVA]?.usos,
    { max: 1, recarga: "rodada", chave: `rodada:${DEFINITIVA}` });
  t(`${tag} e nenhum antes`, deriveAfty(ficha(9, sistema)).mesa?.[DEFINITIVA]?.usos?.max, 0);
  t(`${tag} e não dá o Nível de Dano nem os 3 m do livro`,
    [soma(d10, "nivelDano", (e) => e.nome === "Restrição Definitiva Intelectual"), soma(d10, "movimento", (e) => e.nome === "Restrição Definitiva Intelectual")], [0, 0]);

  /* Dádivas: o calendário, e as do livro pelo mapa do livro. */
  const vagasDadiva = (nd) => deriveAfty(ficha(nd, sistema)).origem?.porEscolha?.[ESCOLHA]?.vagas;
  t(`${tag} a Dádiva abre no 4, e as vagas são 1, 2, 3 e 5 nos níveis 4, 8, 12 e 20`,
    [3, 4, 8, 12, 20].map(vagasDadiva), [null, 1, 2, 3, 5]);
  const robusto = deriveAfty(ficha(12, sistema, {}, ["res_dadiva_fisico_robusto"]));
  t(`${tag} Físico Robusto do livro: RD igual à metade do nível`, daFonte(robusto, "rdGeral", "Físico Robusto"), 6);
  t(`${tag} e +2 em perícia ou TR de Constituição`, soma(robusto, "bonusPericia", (e) => e.nome === "Físico Robusto"), 2);
  t(`${tag} sem a Dádiva não há o efeito`, daFonte(d, "rdGeral", "Físico Robusto"), 0);

  /* Segue sem energia: Estamina, sem Feitiço e com a Técnica Marcial aberta. */
  t(`${tag} sem Feitiços`, [d.feiticos?.liberado, d.feiticos?.gastos], [false, 0]);
  t(`${tag} a Técnica Marcial está aberta`, d.tecnicasMarciais?.disponivel, true);

  /* O Suporte lê a Inteligência (INT 23, modificador 6), onde o livro lê PRE ou SAB. */
  const suporte = (origem) => {
    const c = ficha(12, sistema, {
      especializacoes: [{ id: "suporte", nivel: 12 }],
      habilidades: ["sup_suporte_em_combate", "sup_pronto_para_agir", "sup_fisico_controlado"],
    });
    if (origem) c.core.origem = { id: origem };
    return deriveAfty(c);
  };
  const sup = suporte();
  t(`${tag} a cura soma o modificador de INT`, daFonte(sup, "curaFixa", "Suporte em Combate"), 6);
  t(`${tag} os usos da cura pelo modificador de INT`, daFonte(sup, "curaUsos", "Suporte em Combate"), 6);
  t(`${tag} Pronto para Agir soma a INT na Iniciativa`, daFonte(sup, "iniciativa", "Pronto para Agir"), 6);
  t(`${tag} Físico Controlado troca a CON pela INT, com o teto de +4`,
    daFonte(sup, "hp", "Físico Controlado"), 12 * (4 - 1));
  const livro = suporte("inato");
  t(`${tag} em outra origem o Suporte segue PRE ou SAB`,
    [daFonte(livro, "curaFixa", "Suporte em Combate"), daFonte(livro, "iniciativa", "Pronto para Agir")], [1, 0]);
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
    talentos: [`${P}tal_diretivas_de_combate`],
  }, ["dint_inferencia_rapida", "dint_calculo_de_precisao", "dint_hipotese_adaptativa"]);
  const itens = conteudoDaFicha(c, deriveAfty(c));
  const chaves = itens.map((i) => i.chave);
  const mae = itens.find((i) => i.chave === "origem:dadivas_do_ceu");
  t("a Dádiva com contador vira linha própria", chaves.includes(`opcao:${ESCOLHA}:dint_calculo_de_precisao`), true);
  t("logo abaixo da mãe",
    chaves.indexOf(`opcao:${ESCOLHA}:dint_calculo_de_precisao`) > chaves.indexOf("origem:dadivas_do_ceu"), true);
  t("e sai da lista de opções da mãe, que fica com a que só tem efeito", mae?.opcoes?.map((o) => o.id), ["dint_inferencia_rapida"]);
  const hip = itens.find((i) => i.chave === `opcao:${ESCOLHA}:dint_hipotese_adaptativa`);
  t("o número de mesa vira chip, separado das marcas",
    [hip?.tags?.map((x) => x.label), hip?.numeros], [["Dádiva do Céu"], ["Redução: 7"]]);
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

/* ---------------- Fase 3: a Doutrina e as Técnicas Marciais ---------------- */
for (const sistema of ["afty", "player"]) {
  const tag = `[${sistema}]`;
  const doutrina = "origem:doutrina_da_guerra_matematica";
  const d = deriveAfty(ficha(12, sistema));
  t(`${tag} a Doutrina tem 1 instrução por rodada`, d.mesa?.[doutrina]?.usos, { max: 1, recarga: "rodada", chave: `rodada:${doutrina}` });
  t(`${tag} e os números prontos (BT 4)`, d.mesa?.[doutrina]?.resultados, [
    { label: "Prejuízo do Alvo Previsível", valor: 2 }, { label: "Máximo de Leitura Tática", valor: 4 },
    { label: "Custo da Instrução em Estamina", valor: 4 }, { label: "Bônus do Aliado", valor: 2 }]);
  const PREV = "Doutrina · Alvo Previsível";
  const LEIT = "Doutrina · Leitura Tática";
  const previsivel = deriveAfty(ficha(12, sistema, emCombate({ [`${P}alvo_previsivel`]: true })));
  t(`${tag} Previsível: o prejuízo do alvo vira bônus de acerto e Defesa, metade do BT`,
    [daFonte(previsivel, "bonusAcerto", PREV), daFonte(previsivel, "defesa", PREV)], [2, 2]);
  t(`${tag} sem o estado não há bônus`, daFonte(d, "bonusAcerto", PREV), 0);
  const leitura = deriveAfty(ficha(12, sistema, emCombate({ [`${P}leitura_tatica`]: 3, [`${P}leitura_em_tr`]: 1 })));
  t(`${tag} Leitura Tática: 3 acúmulos, 1 deles em TR, 2 em ataque`,
    [daFonte(leitura, "bonusAcerto", LEIT), daFonte(leitura, "bonusTR", LEIT)], [2, 1]);
  const tudoTR = deriveAfty(ficha(12, sistema, emCombate({ [`${P}leitura_tatica`]: 2, [`${P}leitura_em_tr`]: 4 })));
  t(`${tag} o TR nunca passa do total`, [daFonte(tudoTR, "bonusAcerto", LEIT), daFonte(tudoTR, "bonusTR", LEIT)], [0, 2]);
  const faixa = (x, id) => (x.combate?.estadosExtras ?? []).find((e) => e.id === `${P}${id}`);
  t(`${tag} as duas faixas vão até o BT`, [faixa(d, "leitura_tatica")?.max, faixa(d, "leitura_em_tr")?.max], [4, 4]);
  const outra = createBlankAfty();
  outra.rulesVersion = sistema;
  outra.addons = [pacote];
  outra.core.origem = { id: "inato" };
  t(`${tag} quem não tem a origem não vê os estados da Doutrina`,
    deriveAfty(outra).combate?.estadosExtras?.some((e) => e.id === `${P}alvo_previsivel`), false);

  /* As 12 Técnicas Marciais, como modelos do pacote. */
  const modelos = (nivel) => A.feiticosDeAddon(ficha(12, sistema), nivel);
  t(`${tag} são 12 modelos, 3 por nível`, [1, 2, 3, 4].map((n) => modelos(n).filter((m) => m.nivel === n).length), [3, 3, 3, 3]);
  t(`${tag} o teto do nível filtra`, [modelos(1).length, modelos(2).length, modelos(4).length], [3, 6, 12]);
  t(`${tag} todos são Técnica Marcial Personalizada`, modelos(4).every((m) => m.marcial === true && m.tipo === "personalizado"), true);
  t(`${tag} as duas sem título do PDF têm nome`,
    modelos(4).filter((m) => m.nivel === 4).map((m) => m.nome).sort(), ["Comando de Saturação", "Interrupção de Padrão", "Salva de Precisão"]);
  t(`${tag} a Técnica Marcial está disponível e sem Feitiço`, [d.tecnicasMarciais?.disponivel, d.feiticos?.liberado], [true, false]);
}
{
  const nivelMax = (nd) => deriveAfty(ficha(nd, "player")).tecnicasMarciais?.nivelMax;
  t("o acesso ao nível da Técnica é o do Restringido (1, 2, 3 e 4 no 1, 5, 9 e 15)", [1, 5, 9, 15].map(nivelMax), [1, 2, 3, 4]);
  const total = (nd) => deriveAfty(ficha(nd, "player")).orcamentoHabilidades?.proprioMarcial;
  const livro = (nd) => {
    const c = createBlankAfty();
    c.rulesVersion = "player"; c.core.nd = nd; c.core.tipo = "restringido";
    c.core.origem = { id: "restringido" };
    c.especializacoes = [{ id: "restringido", nivel: nd }];
    return deriveAfty(c).orcamentoHabilidades?.proprioMarcial;
  };
  t("e a quantidade que o personagem conhece é a do Restringido", [3, 9, 15, 20].map(total), [3, 9, 15, 20].map(livro));
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
