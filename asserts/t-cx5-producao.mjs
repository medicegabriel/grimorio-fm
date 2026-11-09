/**
 * CX5: PRODUÇÃO DE INTERLÚDIO, nos DOIS sistemas (Livro p.336 e 337, p.142 e 143, p.167).
 *
 * Criação de Itens (testes, CD por Custo e Ofício, custo máximo por nível, limites do Alfaiate, troca por vantagem, Mestre da
 * Criação), Criação de Invocações (CD por grau, vias, acesso, vestígios), Adaptação (metade do nível, mesma Especialização) e a
 * ENTREGA do produto sem duplicar. O Caderno de Forja continua sendo anotação e não é tocado.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EQ = await import(R + "afty-equipamentos.js");
const AH = await import(R + "afty-habilidades.js");
const P = await import(R + "afty-producao.js");
const FORJA = await import(R + "afty-forja.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
let contador = 0;
const pid = () => `prod_t${++contador}`;
const tid = () => `tent_${++contador}`;

const OFICIOS = ["Ferreiro", "Alfaiate", "Entalhador", "Canalizador", "Alquimia", "Farmacêutico"];
const ficha = (sistema, { nd = 10, oficios = OFICIOS, extra = {} } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = [{ id: "combatente", nivel: nd }];
  if (oficios.length) {
    f.pericias = { ...f.pericias, oficio: "treinado" };
    f.periciaOficios = { oficio: oficios };
  }
  return Object.assign(f, extra);
};
const contexto = (f) => P.contextoDeProducao(f, deriveAfty(f));
const abre = (f, tipo, extra = {}) => {
  const id = pid();
  const r = P.iniciaProducao(f, { id, tipo, ...extra });
  return { f: r.creature, id };
};
const item = (tipo, refId) => ({ tipo, refId });
const ESPADA = item("arma", "arm_espada_longa");
const BRACELETE = item("item", "it_bracelete_do_vigor");
const PEROLA = item("item", "it_perola_carregada");
const MIX = item("item", "it_mix_energetico_medio");
const TALISMA = item("item", "it_simbolo_da_vida");
const ESCUDO_LEVE = item("escudo", "esc_leve");
const ANTIDOTO = item("item", "it_antidoto_simples");
const OLEO = item("item", "it_oleo_amolador");

/* ------------------------------------------------------------ A. As tabelas do livro */
{
  t("CD por custo: Alquimia, Canalizador e Ferreiro", [P.CD_POR_CUSTO.kit_alquimia, P.CD_POR_CUSTO.kit_canalizador, P.CD_POR_CUSTO.kit_ferreiro], [[15, 20, 25, 30], [15, 20, 25, 30], [15, 20, 25, 30]]);
  t("CD por custo: Entalhador e Farmacêutico", [P.CD_POR_CUSTO.kit_entalhador, P.CD_POR_CUSTO.kit_farmaceutico], [[15, 20, 25, 35], [15, 20, 25, 35]]);
  t("CD por custo: Alfaiate", P.CD_POR_CUSTO.kit_alfaiate, [15, 20, 30, 40]);
  t("CD por grau da Invocação", P.CD_POR_GRAU_DA_INVOCACAO, { quarto: 15, terceiro: 20, segundo: 30, primeiro: 40, especial: 50 });
  t("seis Ofícios criam itens e o Cozinheiro não entra na tabela", P.OFICIOS_DE_CRIACAO.map((o) => o.oficio).sort(), ["Alfaiate", "Alquimia", "Canalizador", "Entalhador", "Ferreiro", "Farmacêutico"].sort());
  t("o Ferreiro cria arma e escudo, e a Ferramenta Amaldiçoada é outro processo", P.OFICIOS_DE_CRIACAO.find((o) => o.oficio === "Ferreiro").cria, ["arma", "escudo"]);
  t("os kits da tabela existem no catálogo", P.OFICIOS_DE_CRIACAO.every((o) => EQ.KITS_FERRAMENTAS.some((k) => k.id === o.kit)), true);
  t("limite de acessórios do Alfaiate: 1 até o nível 9, 2 do 10 em diante", [P.limiteDeAcessorios(9), P.limiteDeAcessorios(10), P.limiteDeAcessorios(20)], [1, 2, 2]);
  t("Adaptação troca metade do nível, para baixo", [P.trocasDeAdaptacao(9), P.trocasDeAdaptacao(10), P.trocasDeAdaptacao(1)], [4, 5, 0]);
}

for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema}: ${nome}`;

  /* ------------------------------------------------------------ B. Contexto e testes por foco */
  {
    const f = ficha(sistema);
    const ctx = contexto(f);
    t(tag("o contexto lê BT e nível da ficha"), [ctx.bt, ctx.nd], [4, 10]);
    t(tag("e os Ofícios treinados"), ["ferreiro", "alfaiate", "entalhador"].every((o) => ctx.oficiosTreinados.has(o)), true);
    t(tag("Ofício sem treino fica de fora"), contexto(ficha(sistema, { oficios: [] })).oficiosTreinados.size, 0);
    // O Artesão Amaldiçoado concede o treino no Ofício (Ferreiro ou Canalizador) por Talento, sem marcar a perícia na ficha.
    const artesao = ficha(sistema, { oficios: [], extra: { talentos: ["tal_artesao_amaldicoado"], talentosConfig: { tal_artesao_amaldicoado: { ferramenta: "Ferreiro" } } } });
    t(tag("o Ofício concedido por Talento (Artesão Amaldiçoado) conta como treinado"), [...contexto(artesao).oficiosTreinados], ["ferreiro"]);
    const ab = abre(artesao, "itens");
    const viaTalento = P.registraTentativaDeItem(ab.f, contexto(artesao), { producaoId: ab.id, id: tid(), oficio: "Ferreiro", resultado: 15, itemRef: ESPADA });
    t(tag("e a tentativa de Ferreiro é aceita sem treino marcado na ficha"), viaTalento.aplicado, true);
    t(tag("mas o Alfaiate, que o Talento não concede, segue recusado"), P.registraTentativaDeItem(ab.f, contexto(artesao), { producaoId: ab.id, id: tid(), oficio: "Alfaiate", resultado: 30, itemRef: BRACELETE }).erro, "Falta Treino em Alfaiate");
    t(tag("1 + BT testes por foco"), P.testesPermitidos({ tipo: "itens", focos: 1 }, ctx), 5);
    t(tag("duas vezes o foco, o dobro"), P.testesPermitidos({ tipo: "itens", focos: 2 }, ctx), 10);
    const mestre = ficha(sistema, { extra: { talentos: ["tal_mestre_da_criacao"] } });
    t(tag("Mestre da Criação soma 2 testes por foco de itens"), [P.testesPermitidos({ tipo: "itens", focos: 1 }, contexto(mestre)), P.testesPermitidos({ tipo: "itens", focos: 2 }, contexto(mestre))], [7, 14]);
    t(tag("mas não nos testes de Invocação"), P.testesPermitidos({ tipo: "invocacoes", focos: 1 }, contexto(mestre)), 5);
  }

  /* ------------------------------------------------------------ C. Criação de Itens: CD, nível e kit */
  {
    const { f, id } = abre(ficha(sistema), "itens");
    const ctx = contexto(f);
    t(tag("abrir a mesma produção duas vezes não gasta outro Foco"), P.iniciaProducao(f, { id, tipo: "itens" }).repetida, true);
    t(tag("a produção gasta o Foco informado"), P.focosDeProducoes(f), 1);
    const tenta = (ff, dados) => P.registraTentativaDeItem(ff, ctx, { producaoId: id, id: tid(), ...dados });

    const a = tenta(f, { oficio: "Ferreiro", resultado: 15, itemRef: ESPADA });
    t(tag("CD 15 de Custo 1 aceita 15"), [a.aplicado, a.tentativa.cd, a.restantes], [true, 15, 4]);
    const abaixo = tenta(f, { oficio: "Ferreiro", resultado: 14, itemRef: ESPADA });
    t(tag("14 não alcança a CD 15 e a ficha não muda"), [abaixo.aplicado, abaixo.erro, abaixo.creature === f], [false, "Resultado Abaixo da CD 15", true]);
    t(tag("Custo 2 pede CD 20"), tenta(f, { oficio: "Ferreiro", resultado: 19, itemRef: ESCUDO_LEVE.refId === "esc_leve" ? item("escudo", "esc_medio") : ESCUDO_LEVE }).erro, "Resultado Abaixo da CD 20");
    t(tag("Custo 2 com 20 passa"), tenta(f, { oficio: "Ferreiro", resultado: 20, itemRef: item("escudo", "esc_medio") }).aplicado, true);
    const caro = tenta(f, { oficio: "Ferreiro", resultado: 99, itemRef: item("arma", "arm_chicote_espinhento") });
    t(tag("Custo 3 passa do nível 10 (só Custo 1 e 2) mesmo com resultado alto"), [caro.aplicado, caro.erro], [false, "Nível 10 Cria Itens de Custo 2 no Máximo"]);
    t(tag("Ofício que não é do kit"), tenta(f, { oficio: "Ferreiro", resultado: 30, itemRef: TALISMA }).erro, "Ferreiro Não Cria Este Item");
    t(tag("Entalhador cria talismã com CD 15"), tenta(f, { oficio: "Entalhador", resultado: 15, itemRef: TALISMA }).aplicado, true);
    t(tag("Alquimia cria mistura"), tenta(f, { oficio: "Alquimia", resultado: 15, itemRef: OLEO }).aplicado, true);
    t(tag("Farmacêutico cria fármaco"), tenta(f, { oficio: "Farmacêutico", resultado: 20, itemRef: item("item", "it_remedio_intermediario") }).aplicado, true);
    t(tag("Canalizador cria espiritual"), tenta(f, { oficio: "Canalizador", resultado: 15, itemRef: PEROLA }).aplicado, true);
    t(tag("Alfaiate cria acessório de Custo 2 com CD 20"), tenta(f, { oficio: "Alfaiate", resultado: 20, itemRef: BRACELETE }).aplicado, true);
    t(tag("e com 19 não"), tenta(f, { oficio: "Alfaiate", resultado: 19, itemRef: BRACELETE }).erro, "Resultado Abaixo da CD 20");
    t(tag("Ofício sem treino"), P.registraTentativaDeItem(f, contexto(ficha(sistema, { oficios: ["Ferreiro"] })), { producaoId: id, id: tid(), oficio: "Alquimia", resultado: 30, itemRef: OLEO }).erro, "Falta Treino em Alquimia");
    t(tag("Cozinheiro não entra neste foco"), tenta(f, { oficio: "Cozinheiro", resultado: 30, itemRef: OLEO }).erro, "Ofício Não Cria Itens");
    t(tag("item desconhecido"), tenta(f, { oficio: "Ferreiro", resultado: 30, itemRef: item("arma", "nada") }).erro, "Item Não Encontrado");
    t(tag("o uniforme comum já vem com a ficha"), tenta(f, { oficio: "Alfaiate", resultado: 30, itemRef: item("uniforme", "unif_comum") }).erro, "Uniforme Comum Já Vem com a Ficha");
    t(tag("sem resultado"), tenta(f, { oficio: "Ferreiro", itemRef: ESPADA }).erro, "Informe o Resultado do Teste");
    t(tag("tentativa sem itemRef é só um teste gasto"), (({ aplicado, tentativa }) => [aplicado, tentativa.itemRef])(tenta(f, { oficio: "Ferreiro", resultado: 3 })), [true, null]);
    t(tag("produção desconhecida"), P.registraTentativaDeItem(f, ctx, { producaoId: "prod_zzz", id: tid(), oficio: "Ferreiro", resultado: 15 }).codigo, "producao-ausente");
  }

  /* ------------------------------------------------------------ D. Quantidade de testes e identidade da tentativa */
  {
    let { f, id } = abre(ficha(sistema), "itens");
    const ctx = contexto(f);
    const fixa = "tent_fixa";
    const um = P.registraTentativaDeItem(f, ctx, { producaoId: id, id: fixa, oficio: "Ferreiro", resultado: 15, itemRef: ESPADA });
    const dois = P.registraTentativaDeItem(um.creature, ctx, { producaoId: id, id: fixa, oficio: "Ferreiro", resultado: 15, itemRef: ESPADA });
    t(tag("o mesmo id de tentativa não conta duas vezes"), [dois.aplicado, dois.repetida, dois.creature === um.creature], [false, true, true]);
    f = um.creature;
    for (let i = 0; i < 4; i += 1) f = P.registraTentativaDeItem(f, ctx, { producaoId: id, id: tid(), oficio: "Ferreiro", resultado: 5 }).creature;
    t(tag("cinco testes (1 + BT) e acabou"), P.producoesDaFicha(f)[0].tentativas.length, 5);
    const sexto = P.registraTentativaDeItem(f, ctx, { producaoId: id, id: tid(), oficio: "Ferreiro", resultado: 15, itemRef: ESPADA });
    t(tag("o sexto teste é recusado"), [sexto.aplicado, sexto.erro, sexto.creature === f], [false, "Só 5 Testes por Foco", true]);
    t(tag("o resumo conta o que sobrou"), P.resumoDaProducao(P.producoesDaFicha(f)[0], ctx), { permitidos: 5, feitos: 5, restantes: 0, rendeu: 1, aEntregar: 1 });

    // Dois focos na mesma produção (escolher o foco duas vezes) dobram os testes.
    const dobro = abre(ficha(sistema), "itens", { focos: 2 });
    t(tag("dois focos permitem dez testes"), P.testesPermitidos(P.producoesDaFicha(dobro.f)[0], ctx), 10);
    t(tag("e gastam dois Focos"), P.focosDeProducoes(dobro.f), 2);

    // Mestre da Criação: sete testes por foco.
    const m = ficha(sistema, { extra: { talentos: ["tal_mestre_da_criacao"] } });
    const mm = abre(m, "itens");
    const mctx = contexto(m);
    let g = mm.f;
    for (let i = 0; i < 7; i += 1) g = P.registraTentativaDeItem(g, mctx, { producaoId: mm.id, id: tid(), oficio: "Ferreiro", resultado: 1 }).creature;
    t(tag("com Mestre da Criação cabem sete testes"), P.producoesDaFicha(g)[0].tentativas.length, 7);
    t(tag("e o oitavo não"), P.registraTentativaDeItem(g, mctx, { producaoId: mm.id, id: tid(), oficio: "Ferreiro", resultado: 1 }).erro, "Só 7 Testes por Foco");
  }

  /* ------------------------------------------------------------ E. Troca por vantagem */
  {
    const { f, id } = abre(ficha(sistema), "itens");
    const ctx = contexto(f);
    const troca = P.registraTentativaDeItem(f, ctx, { producaoId: id, id: "t1", oficio: "Ferreiro", troca: "vantagem" });
    t(tag("trocar um teste por vantagem não rende item nem pede resultado"), [troca.aplicado, troca.tentativa.itemRef, troca.tentativa.resultado, troca.tentativa.troca], [true, null, null, "vantagem"]);
    const outro = P.registraTentativaDeItem(troca.creature, ctx, { producaoId: id, id: "t2", oficio: "Alquimia", resultado: 15, itemRef: OLEO });
    t(tag("a vantagem é do MESMO Ofício, não de outro"), outro.tentativa.vantagem, false);
    const mesmo = P.registraTentativaDeItem(outro.creature, ctx, { producaoId: id, id: "t3", oficio: "Ferreiro", resultado: 15, itemRef: ESPADA });
    t(tag("a próxima rolagem do mesmo Ofício nasce com vantagem"), mesmo.tentativa.vantagem, true);
    const depois = P.registraTentativaDeItem(mesmo.creature, ctx, { producaoId: id, id: "t4", oficio: "Ferreiro", resultado: 15, itemRef: ESPADA });
    t(tag("e só a próxima: a seguinte volta ao normal"), depois.tentativa.vantagem, false);
    t(tag("a troca que serviu fica marcada como usada"), P.producoesDaFicha(depois.creature)[0].tentativas.find((x) => x.id === "t1").trocaUsada, true);
    const duas = P.registraTentativaDeItem(P.registraTentativaDeItem(f, ctx, { producaoId: id, id: "a", oficio: "Ferreiro", troca: "vantagem" }).creature, ctx, { producaoId: id, id: "b", oficio: "Ferreiro", troca: "vantagem" });
    const primeira = P.registraTentativaDeItem(duas.creature, ctx, { producaoId: id, id: "c", oficio: "Ferreiro", resultado: 1 });
    const segunda = P.registraTentativaDeItem(primeira.creature, ctx, { producaoId: id, id: "d", oficio: "Ferreiro", resultado: 1 });
    t(tag("duas trocas valem uma vantagem cada, uma por tentativa seguinte"), [duas.tentativa.vantagem, primeira.tentativa.vantagem, segunda.tentativa.vantagem], [true, true, false]);
    const sem = P.registraTentativaDeItem(f, contexto(ficha(sistema, { oficios: [] })), { producaoId: id, id: "z", oficio: "Ferreiro", troca: "vantagem" });
    t(tag("sem treino nem a troca vale"), sem.erro, "Falta Treino em Ferreiro");
  }

  /* ------------------------------------------------------------ F. Limites do Alfaiate */
  {
    const acessorios = [BRACELETE, item("item", "it_faixa_de_foco"), item("item", "it_apanhador_de_saude")];
    const tentaTodos = (nd, interludioA = null, interludioB = null) => {
      const f0 = ficha(sistema, { nd });
      const ctx = contexto(f0);
      const a = abre(f0, "itens", { interludio: interludioA });
      const b = interludioB === interludioA ? a : abre(a.f, "itens", { interludio: interludioB });
      let f = b.f;
      const r1 = P.registraTentativaDeItem(f, ctx, { producaoId: a.id, id: tid(), oficio: "Alfaiate", resultado: 30, itemRef: acessorios[0] });
      f = r1.creature;
      const r2 = P.registraTentativaDeItem(f, ctx, { producaoId: interludioB === interludioA ? a.id : b.id, id: tid(), oficio: "Alfaiate", resultado: 30, itemRef: acessorios[1] });
      f = r2.creature;
      const r3 = P.registraTentativaDeItem(f, ctx, { producaoId: a.id, id: tid(), oficio: "Alfaiate", resultado: 30, itemRef: acessorios[2] });
      return [r1.aplicado, r2.aplicado, r3.aplicado, r2.erro ?? r3.erro ?? null];
    };
    t(tag("nível 9: um acessório por interlúdio"), tentaTodos(9).slice(0, 2), [true, false]);
    t(tag("e a recusa diz o limite"), tentaTodos(9)[3], "Alfaiate Cria 1 Acessório por Interlúdio");
    t(tag("nível 10: dois acessórios"), tentaTodos(10).slice(0, 3), [true, true, false]);
    t(tag("duas produções do MESMO interlúdio dividem o limite"), tentaTodos(9, "int1", "int1").slice(0, 2), [true, false]);
    t(tag("interlúdios diferentes não dividem"), tentaTodos(9, "int1", "int2").slice(0, 2), [true, true]);

    const f0 = ficha(sistema, { nd: 6 });
    const ctx = contexto(f0);
    const a = abre(f0, "itens");
    const u1 = P.registraTentativaDeItem(a.f, ctx, { producaoId: a.id, id: tid(), oficio: "Alfaiate", resultado: 20, itemRef: item("uniforme", "unif_revestimento_medio") });
    const u2 = P.registraTentativaDeItem(u1.creature, ctx, { producaoId: a.id, id: tid(), oficio: "Alfaiate", resultado: 20, itemRef: item("uniforme", "unif_sob_medida") });
    t(tag("um uniforme com revestimento por interlúdio"), [u1.aplicado, u2.aplicado, u2.erro], [true, false, "Um Uniforme com Revestimento por Interlúdio"]);
    const nivel5 = contexto(ficha(sistema, { nd: 5 }));
    t(tag("no nível 5 só há Custo 1: o revestimento médio (2) fica de fora"), P.registraTentativaDeItem(a.f, nivel5, { producaoId: a.id, id: tid(), oficio: "Alfaiate", resultado: 40, itemRef: item("uniforme", "unif_revestimento_medio") }).erro, "Nível 5 Cria Itens de Custo 1 no Máximo");
  }

  /* ------------------------------------------------------------ G. As opções de item que a tela oferece */
  {
    const f = ficha(sistema, { nd: 10 });
    const ctx = contexto(f);
    const ferreiro = P.itensCriaveis(f, ctx, "Ferreiro");
    t(tag("o Ferreiro oferece armas e escudos até o Custo 2"), [ferreiro.length > 0, ferreiro.every((x) => ["arma", "escudo"].includes(x.tipo) && x.custo <= 2)], [true, true]);
    t(tag("com a CD da tabela"), ferreiro.every((x) => x.cd === [15, 20][x.custo - 1]), true);
    const alfaiate = P.itensCriaveis(f, ctx, "Alfaiate");
    t(tag("o Alfaiate oferece acessórios e uniformes, sem o comum"), [alfaiate.some((x) => x.tipo === "item"), alfaiate.some((x) => x.tipo === "uniforme"), alfaiate.some((x) => x.refId === "unif_comum")], [true, true, false]);
    t(tag("Ofício desconhecido não oferece nada"), P.itensCriaveis(f, ctx, "Cozinheiro"), []);
    t(tag("nível 1 só oferece Custo 1"), P.itensCriaveis(ficha(sistema, { nd: 1 }), contexto(ficha(sistema, { nd: 1 })), "Ferreiro").every((x) => x.custo === 1), true);
  }

  /* ------------------------------------------------------------ H. Entrega sem duplicar */
  {
    const { f: f0, id } = abre(ficha(sistema), "itens");
    const ctx = contexto(f0);
    let f = f0;
    for (const [oficio, resultado, itemRef, tentativaId] of [["Ferreiro", 15, ESPADA, "ta"], ["Alquimia", 15, OLEO, "tb"], ["Ferreiro", 2, null, "tc"]]) {
      f = P.registraTentativaDeItem(f, ctx, { producaoId: id, id: tentativaId, oficio, resultado, ...(itemRef ? { itemRef } : {}) }).creature;
    }
    t(tag("antes de entregar o inventário está vazio"), (f.equipamentos?.itens ?? []).length, 0);
    const e1 = P.entregaProducao(f, id);
    t(tag("a entrega põe um item por teste que rendeu"), [e1.aplicado, e1.entregues.sort()], [true, [`${id}_ta`, `${id}_tb`].sort()]);
    t(tag("o item entra no inventário com o uid do produto"), e1.creature.equipamentos.itens.map((e) => [e.uid, e.tipo, e.refId, e.qtd, e.equipado]), [[`${id}_ta`, "arma", "arm_espada_longa", 1, false], [`${id}_tb`, "item", "it_oleo_amolador", 1, false]]);
    t(tag("a tentativa fica marcada como entregue"), P.producoesDaFicha(e1.creature)[0].tentativas.map((x) => x.entregue), [true, true, false]);
    const e2 = P.entregaProducao(e1.creature, id);
    t(tag("entregar de novo não duplica"), [e2.aplicado, e2.erro, e2.creature === e1.creature, e2.creature.equipamentos.itens.length], [false, "Nada a Entregar", true, 2]);

    // Reabrir a ficha: o JSON volta, e a entrega repetida continua sem duplicar.
    const reaberta = JSON.parse(JSON.stringify(e1.creature));
    t(tag("reabrir e entregar de novo continua sem duplicar"), P.entregaProducao(reaberta, id).creature.equipamentos.itens.length, 2);
    // Mesmo se o marcador de entrega se perder, o uid do produto segura a duplicata.
    const semMarca = JSON.parse(JSON.stringify(e1.creature));
    semMarca.producoes[0].tentativas.forEach((x) => { x.entregue = false; });
    const e3 = P.entregaProducao(semMarca, id);
    t(tag("sem o marcador o uid determinístico ainda segura"), [e3.creature.equipamentos.itens.length, e3.jaEntregues.length], [2, 2]);

    // O produto é item de verdade para o derive.
    const d = deriveAfty(e1.creature);
    t(tag("o inventário derivado enxerga o que foi entregue"), d.equip.entradas.map((e) => e.refId), ["arm_espada_longa", "it_oleo_amolador"]);
    t(tag("o item da produção não entra equipado"), d.equip.entradas.every((e) => !e.equipado), true);
    t(tag("o inventário antigo é preservado ao lado do novo"), P.entregaProducao({ ...e1.creature, equipamentos: { itens: [{ uid: "velho", tipo: "item", refId: "it_perola_carregada", qtd: 2, equipado: false }, ...e1.creature.equipamentos.itens] } }, id).creature.equipamentos.itens.length, 3);
    t(tag("produção desconhecida"), P.entregaProducao(f, "prod_zzz").codigo, "producao-ausente");
  }

  /* ------------------------------------------------------------ I. Criação de Invocações */
  {
    const nd = 10;
    const f0 = ficha(sistema, { nd });
    const ctx = contexto(f0);
    const { f, id } = abre(f0, "invocacoes");
    const tenta = (ff, dados) => P.registraTentativaDeInvocacao(ff, ctx, { producaoId: id, id: tid(), ...dados });
    const ok1 = tenta(f, { via: "talisma", grau: "quarto", resultado: 15 });
    t(tag("Quarto Grau com CD 15"), [ok1.aplicado, ok1.tentativa.cd, ok1.tentativa.sucesso], [true, 15, true]);
    const falhou = tenta(f, { via: "talisma", grau: "terceiro", resultado: 19 });
    t(tag("Terceiro Grau pede 20: 19 falha mas a tentativa fica registrada"), [falhou.aplicado, falhou.tentativa.sucesso], [true, false]);
    t(tag("a via marionete usa o Canalizador"), tenta(f, { via: "marionete", grau: "quarto", resultado: 15 }).tentativa.via, "marionete");
    t(tag("via desconhecida"), tenta(f, { via: "x", grau: "quarto", resultado: 15 }).codigo, "via");
    t(tag("grau desconhecido"), tenta(f, { via: "talisma", grau: "nono", resultado: 15 }).codigo, "grau");
    t(tag("sem treino no Ofício da via"), P.registraTentativaDeInvocacao(f, contexto(ficha(sistema, { oficios: ["Canalizador"] })), { producaoId: id, id: tid(), via: "talisma", grau: "quarto", resultado: 15 }).erro, "Falta Treino em Entalhador");
    t(tag("quem é Controlador só cria até o grau do nível dele (nível 4: Quarto)"),
      P.registraTentativaDeInvocacao(f, { ...ctx, nivelControlador: 4 }, { producaoId: id, id: tid(), via: "talisma", grau: "terceiro", resultado: 99 }).erro, "Sem Acesso a Este Grau");
    t(tag("e no nível 5 o Terceiro abre"), P.registraTentativaDeInvocacao(f, { ...ctx, nivelControlador: 5 }, { producaoId: id, id: tid(), via: "talisma", grau: "terceiro", resultado: 20 }).aplicado, true);
    t(tag("quem não é Controlador tem todos os graus (regra já adotada)"), P.registraTentativaDeInvocacao(f, ctx, { producaoId: id, id: tid(), via: "talisma", grau: "especial", resultado: 50 }).aplicado, true);

    // Vestígios.
    const guardou = tenta(f, { via: "talisma", grau: "segundo", resultado: 12, guardarVestigio: true });
    t(tag("sem alcançar a CD, guardar o vestígio soma ao estoque DA VIA"), [guardou.aplicado, guardou.vestigios, P.vestigiosDaFicha(guardou.creature)], [true, 1, { talisma: 1, marionete: 0 }]);
    const sucessoGuarda = tenta(f, { via: "talisma", grau: "quarto", resultado: 20, guardarVestigio: true });
    t(tag("quem alcançou a CD não guarda vestígio"), sucessoGuarda.erro, "Só Guarda Vestígio Quem Não Alcançou a CD");
    let g = guardou.creature;
    g = tenta(g, { via: "talisma", grau: "segundo", resultado: 12, guardarVestigio: true }).creature;
    g = tenta(g, { via: "talisma", grau: "segundo", resultado: 12, guardarVestigio: true }).creature;
    t(tag("três falhas guardadas dão três vestígios de Talismã"), P.vestigiosDaFicha(g, "talisma"), 3);
    // Um estoque por via (decisão do autor, 2026-11-06): vestígio de Talismã não ajuda Marionete.
    const marSem = P.registraTentativaDeInvocacao(g, ctx, { producaoId: id, id: tid(), via: "marionete", grau: "quarto", resultado: 15, vestigios: 1 });
    t(tag("vestígio de Talismã não vale para a Marionete"), [marSem.aplicado, marSem.erro, marSem.creature === g], [false, "Vestígios Insuficientes", true]);
    const marGuarda = P.registraTentativaDeInvocacao(g, ctx, { producaoId: id, id: tid(), via: "marionete", grau: "terceiro", resultado: 5, guardarVestigio: true });
    t(tag("guardar vestígio de Marionete soma no estoque dela e não no do Talismã"), P.vestigiosDaFicha(marGuarda.creature), { talisma: 3, marionete: 1 });
    const marUsa = P.registraTentativaDeInvocacao(marGuarda.creature, ctx, { producaoId: id, id: tid(), via: "marionete", grau: "terceiro", resultado: 20, vestigios: 1 });
    t(tag("e usar o da Marionete gasta só dele"), [marUsa.aplicado, P.vestigiosDaFicha(marUsa.creature)], [true, { talisma: 3, marionete: 0 }]);
    const usoUm = P.registraTentativaDeInvocacao(g, ctx, { producaoId: id, id: tid(), via: "talisma", grau: "segundo", resultado: 30, vestigios: 1 });
    t(tag("um vestígio dá vantagem e não soma"), [usoUm.tentativa.vantagem, usoUm.tentativa.resultado, usoUm.vestigios], [true, 30, 2]);
    const usoTres = P.registraTentativaDeInvocacao(g, ctx, { producaoId: id, id: tid(), via: "talisma", grau: "segundo", resultado: 26, vestigios: 3 });
    t(tag("três vestígios: vantagem e +2 por vestígio além do primeiro"), [usoTres.tentativa.resultado, usoTres.tentativa.sucesso, usoTres.vestigios], [30, true, 0]);
    const sem = P.registraTentativaDeInvocacao(g, ctx, { producaoId: id, id: tid(), via: "talisma", grau: "segundo", resultado: 30, vestigios: 4 });
    t(tag("não usa mais vestígio do que tem"), [sem.aplicado, sem.erro, sem.creature === g], [false, "Vestígios Insuficientes", true]);
    t(tag("o estoque de vestígios é da ficha e sobrevive ao JSON"), P.vestigiosDaFicha(JSON.parse(JSON.stringify(g)), "talisma"), 3);

    // Testes por foco e entrega.
    let h = f;
    for (let i = 0; i < 5; i += 1) h = tenta(h, { via: "talisma", grau: "quarto", resultado: 15 }).creature;
    t(tag("cinco testes e acabou (Mestre da Criação não vale aqui)"), tenta(h, { via: "talisma", grau: "quarto", resultado: 15 }).erro, "Só 5 Testes por Foco");
    const ent = P.entregaProducao(h, id);
    t(tag("a entrega cria uma Invocação por sucesso"), [ent.aplicado, ent.entregues.length, ent.creature.invocacoes.length], [true, 5, 5]);
    const inv = ent.creature.invocacoes[0];
    t(tag("do grau e do tipo da via, com id determinístico"), [inv.grau, inv.tipoMecanico, inv.id.startsWith(`${id}_`), inv.nome], ["quarto", "shikigami", true, "Talismã de Quarto Grau"]);
    t(tag("entregar de novo não duplica"), P.entregaProducao(ent.creature, id).creature.invocacoes.length, 5);
    t(tag("nem depois de reabrir"), P.entregaProducao(JSON.parse(JSON.stringify(ent.creature)), id).creature.invocacoes.length, 5);
    const mar = P.entregaProducao(tenta(f, { via: "marionete", grau: "terceiro", resultado: 20 }).creature, id);
    t(tag("a Marionete nasce com o tipo Marionete"), [mar.creature.invocacoes[0].tipoMecanico, mar.creature.invocacoes[0].grau], ["marionete", "terceiro"]);
    const falhasSo = P.entregaProducao(guardou.creature, id);
    t(tag("tentativa que falhou não entrega nada"), [falhasSo.aplicado, falhasSo.erro], [false, "Nada a Entregar"]);
  }

  /* ------------------------------------------------------------ J. Adaptação */
  {
    const lutadoras = AH.habilidadesDaEspecializacao("lutador").slice(0, 8).map((h) => h.id);
    const combatentes = AH.habilidadesDaEspecializacao("combatente").slice(0, 2).map((h) => h.id);
    const f0 = ficha(sistema, { nd: 10, extra: { habilidades: [lutadoras[0], lutadoras[1], lutadoras[2]], escolhasHabilidade: { [lutadoras[0]]: { x: "y" }, [lutadoras[1]]: { z: "w" } } } });
    const ctx = contexto(f0);
    const { f, id } = abre(f0, "adaptacao");
    const troca = (ff, dados) => P.registraTrocaDeAdaptacao(ff, ctx, { producaoId: id, id: tid(), ...dados });
    const a = troca(f, { de: lutadoras[0], para: lutadoras[3] });
    t(tag("troca na mesma posição da lista"), [a.aplicado, a.creature.habilidades], [true, [lutadoras[3], lutadoras[1], lutadoras[2]]]);
    t(tag("as escolhas aninhadas da antiga saem com ela, as outras ficam"), a.creature.escolhasHabilidade, { [lutadoras[1]]: { z: "w" } });
    t(tag("a troca fica no registro do Foco"), P.producoesDaFicha(a.creature)[0].trocas.map((x) => [x.de, x.para]), [[lutadoras[0], lutadoras[3]]]);
    t(tag("restam quatro das cinco"), a.restantes, 4);
    t(tag("outra Especialização não vale"), troca(f, { de: lutadoras[0], para: combatentes[0] }).erro, "Só Troca Por Habilidade da Mesma Especialização");
    t(tag("a ficha precisa ter a antiga"), troca(f, { de: lutadoras[5], para: lutadoras[6] }).erro, "A Ficha Não Tem a Habilidade");
    t(tag("e não ter a nova"), troca(f, { de: lutadoras[0], para: lutadoras[1] }).erro, "A Ficha Já Tem Esta Habilidade");
    t(tag("trocar por ela mesma"), troca(f, { de: lutadoras[0], para: lutadoras[0] }).erro, "Escolha Outra Habilidade");
    t(tag("habilidade que não existe"), troca(f, { de: lutadoras[0], para: "hab_nada" }).erro, "Habilidade Não Encontrada");
    const fixa = "troca_fixa";
    const t1 = P.registraTrocaDeAdaptacao(f, ctx, { producaoId: id, id: fixa, de: lutadoras[0], para: lutadoras[3] });
    const t2 = P.registraTrocaDeAdaptacao(t1.creature, ctx, { producaoId: id, id: fixa, de: lutadoras[0], para: lutadoras[3] });
    t(tag("o mesmo id de troca não se aplica duas vezes"), [t2.aplicado, t2.repetida, t2.creature === t1.creature], [false, true, true]);
    // Limite: nível 3 troca 1.
    const pequena = ficha(sistema, { nd: 3, extra: { habilidades: [lutadoras[0], lutadoras[1]] } });
    const pc = contexto(pequena);
    const pa = abre(pequena, "adaptacao");
    const p1 = P.registraTrocaDeAdaptacao(pa.f, pc, { producaoId: pa.id, id: tid(), de: lutadoras[0], para: lutadoras[3] });
    const p2 = P.registraTrocaDeAdaptacao(p1.creature, pc, { producaoId: pa.id, id: tid(), de: lutadoras[1], para: lutadoras[4] });
    t(tag("nível 3 troca uma só (metade para baixo)"), [p1.aplicado, p2.aplicado, p2.erro], [true, false, "Só 1 Trocas"]);
    const nivel1 = ficha(sistema, { nd: 1, extra: { habilidades: [lutadoras[0]] } });
    const n1 = abre(nivel1, "adaptacao");
    t(tag("nível 1 não troca nenhuma"), P.registraTrocaDeAdaptacao(n1.f, contexto(nivel1), { producaoId: n1.id, id: tid(), de: lutadoras[0], para: lutadoras[3] }).erro, "Só 0 Trocas");
    const dois = abre(pequena, "adaptacao", { focos: 2 });
    const d1 = P.registraTrocaDeAdaptacao(dois.f, pc, { producaoId: dois.id, id: tid(), de: lutadoras[0], para: lutadoras[3] });
    const d2 = P.registraTrocaDeAdaptacao(d1.creature, pc, { producaoId: dois.id, id: tid(), de: lutadoras[1], para: lutadoras[4] });
    t(tag("dois focos de Adaptação dobram as trocas"), [d1.aplicado, d2.aplicado], [true, true]);
    const antiga = JSON.parse(JSON.stringify(a.creature));
    t(tag("a ficha trocada sobrevive ao JSON"), antiga.habilidades, [lutadoras[3], lutadoras[1], lutadoras[2]]);
  }

  /* ------------------------------------------------------------ K. Compatibilidade e saneamento */
  {
    const velha = ficha(sistema);
    t(tag("ficha sem produções lê lista vazia"), [P.producoesDaFicha(velha), P.focosDeProducoes(velha), P.vestigiosDaFicha(velha)], [[], 0, { talisma: 0, marionete: 0 }]);
    const lixo = { ...velha, producoes: [null, 3, { id: "sem_prefixo", tipo: "itens" }, { id: "prod_x", tipo: "inexistente" }, { id: "prod_ok", tipo: "itens", focos: -4, tentativas: [null, { id: "t", oficio: 9 }, { id: "t" }] }], vestigios: "muitos" };
    const sane = P.producoesDaFicha(lixo);
    t(tag("lixo é descartado e o válido é aparado"), sane.map((p) => [p.id, p.focos, p.tentativas.length]), [["prod_ok", 1, 1]]);
    t(tag("vestígios inválidos viram zero"), [P.vestigiosDaFicha(lixo), P.vestigiosDaFicha({ ...velha, vestigios: { talisma: "x", marionete: -4 } })], [{ talisma: 0, marionete: 0 }, { talisma: 0, marionete: 0 }]);
    t(tag("o Caderno de Forja segue separado: nenhum campo dele muda"), [FORJA.forjasDaFicha(velha), FORJA.focosDeForja(velha)], [[], 0]);
    const ambos = { ...velha, forjas: [FORJA.novaForja({ focos: 2 })], producoes: [P.novaProducao("itens", { focos: 3 })] };
    t(tag("os Focos de forja e de produção se somam em contadores irmãos, sem se misturar"), [FORJA.focosDeForja(ambos), P.focosDeProducoes(ambos)], [2, 3]);
  }
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
