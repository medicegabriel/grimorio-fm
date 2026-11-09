/**
 * ============================================================
 * O USO DOS ITENS ESPECIAIS (CX5, 2026-11-06)
 * ============================================================
 * Livro p.146 a 149. A DESCRIÇÃO de cada item continua em `afty-equipamentos.js`,
 * verbatim. Aqui mora só o que a mesa FAZ ao usar: a ação, o que recupera, o que
 * liga e por quanto tempo. A operação que lê esta tabela é `ficha/ficha-itens.js`,
 * que delega cada efeito a um verbo que já existe (cura, Dados de Vida, PE, Buff de
 * Mesa, paredes). Esta tabela não calcula nada.
 *
 * ⚠ MÓDULO FOLHA, ZERO IMPORTS. A tabela é consultada pelo catálogo, pela sessão e pelas
 * abas, e um import aqui reabriria o ciclo de `afty-equipamentos.js`. A lista de folhas
 * vive em `asserts/t-ordem-modulos.mjs`. O assert `t-cx5-itens.mjs` confere que todo id
 * daqui existe no catálogo de itens, no sentido que o catálogo não pode mudar sem aviso.
 *
 * ⚠ ITEM SEM LINHA AQUI NÃO É AUSÊNCIA, é um destes três casos:
 *   - o efeito já vem do equipamento (Bracelete do Vigor, Anéis do Conhecimento, Faixas
 *     Céleres, Ombreiras, Apanhador de Saúde e todo Acessório de número): `efeito` do catálogo;
 *   - o item tem módulo próprio (Talismã do Ápice, em `afty-talisma-apice.js`);
 *   - o item é narrativo (Brinco da Comunicação) e nada mudaria na ficha.
 *
 * Campos de uma linha:
 *   acao        "comum" | "bonus" | "livre" | "reacao" | ["bonus", "reacao"] (o item aceita uma das duas)
 *   consome     false quando o item NÃO se gasta ao usar (padrão: gasta uma unidade)
 *   pe          PE recuperado (Energia e Estamina são o mesmo recurso, decisão de 2026-07-29)
 *   cura        { fixo } | { total: true }, cura de PV comum
 *   pvTemporario { porNivel }
 *   dadosDeVida { limite } | { todos: true, multiplicadorCon }
 *   antidoto    { custo } cura Envenenado e os venenos até esse custo
 *   buffs       [{ canal, alvo?, expr, nome? }], Buff de Mesa pelo contrato de uso. `alvo` pode ser
 *               { parametro, prefixo } para sair de um parâmetro escolhido no uso
 *   duracao     { ate: "cena" } | { rodadas }
 *   manual      true: sem prazo automático, o Buff de Mesa fica até a mesa o tirar (Injeção Estimulante)
 *   parametros  o formato de `ficha-uso.js`
 *   exaustao    { reduz } devolvido ao fim da duração | { aoFim } soma ao fim da duração
 *   paredes     { quantidade, pv } paredes comuns, sem RD
 *   registro    o uso fica anotado como ativo, sem efeito numérico (Domínio Simples Contido)
 *   diario      true: uma vez por dia (o descanso devolve)
 *   exigeEquipado true: o acessório precisa estar equipado (p.144: o acessório vale enquanto portado)
 *   mantemConcentracao true: usa no lugar do teste de concentração pendente (Faixa de Foco)
 *   aplicaEmArma { max, ate, traco? } óleos e venenos de contato: o uso escolhe as armas
 *   veneno      { custo, cd, aoFalhar, mesmoSePassar? } a CD sai da tabela de custo (p.145)
 *   lembretes   frases curtas da regra que a ficha NÃO resolve (vantagem, alvo em outra ficha)
 * ============================================================
 */

const ATRIBUTOS = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"];

/** Livro p.145: a CD do veneno pelo custo dele. */
export const CD_DO_VENENO = Object.freeze({ 1: 15, 2: 25, 3: 35, 4: 45 });

/** O Dardo é especialmente efetivo para aplicar venenos: +2 na CD se o dardo atingir coberto de veneno (p.137). */
export const BONUS_CD_VENENO_DO_DARDO = 2;

/** Os Maldições e Fetos Híbridos têm +2 em Fortitude contra veneno, e Corpos Amaldiçoados são imunes (p.145). */
export const BONUS_FORTITUDE_CONTRA_VENENO = 2;

export const cdDoVeneno = (custo, { dardo = false } = {}) => {
  const base = CD_DO_VENENO[custo] ?? null;
  return base == null ? null : base + (dardo ? BONUS_CD_VENENO_DO_DARDO : 0);
};

const perola = (pe) => ({ acao: "bonus", pe });
const mix = (pe) => ({ acao: "bonus", pe, recurso: "Estamina" });
const remedio = (limite) => ({ acao: "comum", dadosDeVida: { limite } });
const antidoto = (custo) => ({ acao: "bonus", antidoto: { custo } });
/* Venenos (p.145 e p.146 a 149). `aoFalhar` vale para quem falha no TR de Fortitude. `mesmoSePassar` é o que o livro
   escreve ENTRE PARÊNTESES: "efeitos em parênteses afetam alvos mesmo que passem no teste de resistência". */
const veneno = (custo, efeitos) => ({
  acao: "bonus",
  aplicaEmArma: { max: 1, ate: "acerto" },
  veneno: { custo, cd: cdDoVeneno(custo), ...efeitos },
});

export const USO_DE_ITEM = Object.freeze({
  /* ---------- Espirituais: PE ---------- */
  it_perola_carregada: perola(3),
  it_conjunto_de_perolas_carregadas: perola(6),
  it_terco_de_perolas_carregadas: perola(10),

  /* ---------- Fármacos: Estamina (o mesmo recurso do PE) ---------- */
  it_mix_energetico_pequeno: mix(3),
  it_mix_energetico_medio: mix(6),
  it_mix_energetico_grande: mix(10),

  /* ---------- Fármacos: Dados de Vida ---------- */
  it_remedio_simples: remedio(4),
  it_remedio_intermediario: remedio(8),
  it_remedio_complexo: remedio(12),
  it_elixir_da_vida: {
    acao: "bonus",
    dadosDeVida: { todos: true, multiplicadorCon: 2 },
    buffs: [
      { canal: "bonusTR", alvo: "fortitude", expr: "5", nome: "Elixir da Vida" },
      { canal: "bonusTR", alvo: "integridade", expr: "5", nome: "Elixir da Vida" },
    ],
    duracao: { ate: "cena" },
    lembretes: ["Vantagem em Fortitude e Integridade pelo resto da cena"],
  },

  /* ---------- Talismãs: cura ---------- */
  it_simbolo_da_vida: { acao: "bonus", cura: { fixo: 10 } },
  it_simbolo_de_vida_florescente: { acao: "bonus", cura: { fixo: 25 } },
  /* ⚠ "Recuperando todos os seus pontos de vida, até o máximo, ALÉM de receber pontos de vida temporários igual ao
     triplo do seu nível": a cura não encerra o item, ele também dá a casca. O teto e a substituição do PV temporário
     (p.366) são de CX4: a casca entra pela fonte própria do item. */
  it_simbolo_de_vida_absoluta: { acao: "livre", cura: { total: true }, pvTemporario: { porNivel: 3 } },

  /* ---------- Fármacos: antídotos ---------- */
  it_antidoto_simples: antidoto(1),
  it_antidoto_intermediario: antidoto(2),
  it_antidoto_superior: antidoto(3),
  it_antidoto_absoluto: antidoto(4),

  /* ---------- Fármacos: injeções ---------- */
  it_injecao_estimulante: {
    acao: "bonus",
    parametros: [{ id: "atributo", tipo: "opcao", opcoes: ATRIBUTOS, rotulo: "Atributo" }],
    buffs: [{ canal: "bonusPericia", alvo: { parametro: "atributo", prefixo: "atr:" }, expr: "2", nome: "Injeção Estimulante" }],
    // "durante 10 minutos": a ficha não tem relógio. Prazo MANUAL (decisão do autor, 2026-11-06): o Buff de Mesa fica até a mesa tirá-lo
    // pela aba Buffs. Duas cópias do item não somam enquanto o buff estiver lá (`manual: true`).
    manual: true,
  },
  it_injecao_de_adrenalina: {
    acao: "bonus",
    exaustao: { reduz: 1 },
    duracao: { ate: "cena" },
  },

  /* ---------- Misturas ---------- */
  it_mistura_profana: {
    acao: "comum",
    buffs: [{ canal: "custoPE", expr: "1", nome: "Mistura Profana" }],
    duracao: { ate: "cena" },
    exaustao: { aoFim: 1 },
  },
  it_oleo_amolador: {
    acao: "bonus",
    aplicaEmArma: { max: 2, ate: "descanso", traco: "Mortal d6" },
  },
  it_oleo_flamejante: {
    acao: "bonus",
    aplicaEmArma: { max: 2, ate: "cena", traco: "Modular Queimante" },
  },
  // "o alvo terá seu deslocamento reduzido pela metade" é a definição da condição Lento (p.329), sem prazo escrito.
  it_veneno_debilitante: veneno(1, { aoFalhar: { condicoes: ["Lento"] } }),
  it_veneno_intenso: veneno(1, { aoFalhar: { condicoes: ["Envenenado"], rodadas: 1 } }),
  it_veneno_desnorteante: veneno(2, { aoFalhar: { condicoes: ["Desprevenido"], rodadas: 1 } }),
  it_veneno_maldito: veneno(3, {
    aoFalhar: { condicoes: ["Exposto"], rodadas: 3 },
    mesmoSePassar: { condicoes: ["Envenenado"], rodadas: 3 },
  }),
  it_lagrima_de_shinigami: veneno(4, {
    aoFalhar: { perdaDeVida: "2d10", defesa: -4, peAdicional: 2, ate: "cena" },
    mesmoSePassar: { perdaDeVida: "2d10", condicoes: ["Amedrontado", "Exposto"], rodadas: 2 },
  }),

  /* ---------- Talismãs: barreira e domínio ---------- */
  it_talisma_de_barreira: { acao: "bonus", paredes: { quantidade: 4, pv: 15 } },
  it_talisma_de_barreira_superior: { acao: ["bonus", "reacao"], paredes: { quantidade: 4, pv: 25 } },
  it_dominio_simples_contido: { acao: "comum", registro: true, duracao: { rodadas: 2 } },

  /* ---------- Acessórios com uso, sem gastar o item ---------- */
  it_faixa_de_foco: { consome: false, exigeEquipado: true, diario: true, acao: "livre", mantemConcentracao: true },
  it_amuleto_do_vislumbre: { consome: false, exigeEquipado: true, diario: true, acao: "bonus", duracao: { rodadas: 10 } },
  /* O Laço da Vida se desgasta ao evitar a morte: o item some, a cura é metade do PV e custa 1 Exaustão. A operação
     precisa do estado vital (CL2) e é própria, em `usaLacoDaVida`. */
  it_laco_da_vida: { acao: "livre", exigeEquipado: true, especial: "laco" },
  /* O Chaveiro Absorsor não se usa: ele reage a um evento (eliminar um inimigo elegível), em `eliminouInimigo`. */
  it_chaveiro_absorsor: { consome: false, exigeEquipado: true, acao: "livre", especial: "chaveiro" },
});

export const usoDoItem = (id) => USO_DE_ITEM[id] ?? null;
export const itemTemUso = (id) => id in USO_DE_ITEM;
export const idsDeItensComUso = () => Object.keys(USO_DE_ITEM);
