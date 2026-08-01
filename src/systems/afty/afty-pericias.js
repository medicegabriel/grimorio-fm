/**
 * ============================================================
 * PERÍCIAS E TESTES — GRIMÓRIO AFTY
 * ============================================================
 * Conteúdo é DADO (ver roadmap). Transcrição VERBATIM da seção "LISTA DE
 * PERÍCIAS" (tabela Perícia / Atributo Chave / Requer Treinamento? /
 * Complementar) e das descrições individuais, mandadas pelo autor em
 * 2026-07-27.
 *
 * Colunas do livro → campos:
 *   • atributo: chave do Atributo Chave (Força→forca, Presença→presenca, etc.).
 *   • requerTreinamento: a perícia só pode ser usada se a criatura for treinada
 *     nela (coluna "Requer Treinamento?" = Sim).
 *   • complementar: perícia que NÃO entra por padrão no jogo, opcional por
 *     campanha (coluna "Complementar" = Sim). Também é possível remover perícias
 *     padrão (ex.: Tecnologia numa campanha de época), a critério do Mestre.
 *   • descricao / exemplos / nota: os três parágrafos de cada verbete.
 *
 * Ordem = a da tabela do livro (alfabética). Ids estáveis, snake_case sem acento.
 *
 * ⚠ VERBATIM, com os deslizes do livro preservados: "quebrar amarras o
 * segurando" (Atletismo) e "mudar os fatos enquanto contra o que aconteceu"
 * (Enganação). O travessão em Tecnologia também é do original.
 *
 * ============================================================
 * OS TRÊS TIPOS DE TESTE (autor, 2026-07-27)
 * ============================================================
 * Perícias, Jogadas de Ataque e Testes de Resistência compartilham a MESMA
 * forma: `d20 + mod do atributo + metade do nível + bônus de treinamento
 * (se treinado) + outros bônus`. O que este arquivo devolve é a parte fixa
 * (tudo menos o d20). Ver `resolveTestes`.
 *
 * Os Testes de Resistência (os 5 nomeados) moram em AFTY_RESISTENCIAS, em
 * ./afty-schema.js, porque outros sistemas já os liam de lá.
 * ============================================================
 */

// As duas listas cruas vêm de um módulo FOLHA para não fechar ciclo com
// afty-origens.js, que as lê durante a própria inicialização. Ver o cabeçalho de lá.
import { AFTY_PERICIAS, AFTY_ATAQUES } from "./afty-pericias-catalogo";
export { AFTY_PERICIAS, AFTY_ATAQUES };
import { AFTY_ATTRS, AFTY_RESISTENCIAS } from "./afty-schema";
import {
  valorCanal, detalhesDoCanal, valorCanalEscopos, detalhesDoCanalEscopos, escoposDaArma,
} from "./afty-efeitos";

/* AFTY_PERICIAS mora em ./afty-pericias-catalogo.js e é reexportado no topo. */

const BY_ID = Object.fromEntries(AFTY_PERICIAS.map((p) => [p.id, p]));
export const getPericia = (id) => BY_ID[id] || null;

/* ============================================================ */
/* PROFICIÊNCIA                                                  */
/* ============================================================ */
/* Duas faixas: Treinado soma o Bônus de Treinamento (== Maestria) cheio,
   Mestre soma ele mais metade. Mora aqui porque vale para os três tipos de
   teste e para as Invocações, que re-exportam daqui. */

export const PROFICIENCIAS = [
  { value: "treinado", label: "Treinado" },
  { value: "mestre",   label: "Mestre" },
];

export const bonusProficiencia = (bt, prof) =>
  prof === "mestre" ? bt + Math.floor(bt / 2) : (prof === "treinado" ? bt : 0);

/** Custo em vagas: Mestre vale 2, Treinado vale 1, destreinado 0. */
export const custoProficiencia = (prof) => (prof === "mestre" ? 2 : prof === "treinado" ? 1 : 0);

/** Vagas gastas por um mapa { [id]: "treinado" | "mestre" }. */
export const usoPericias = (periciasProf = {}) =>
  Object.values(periciasProf || {}).reduce((s, p) => s + custoProficiencia(p), 0);

/** Perícias padrão (as que entram no jogo por default, sem as complementares). */
export const periciasPadrao = () => AFTY_PERICIAS.filter((p) => !p.complementar);
/** Perícias complementares (opcionais por campanha). */
export const periciasComplementares = () => AFTY_PERICIAS.filter((p) => p.complementar);

/**
 * Perícias que uma INVOCAÇÃO pode ser treinada: as comuns (padrão), exceto
 * Ofício (o livro proíbe treinar Invocação em Ofício). Complementares ficam de
 * fora por serem opcionais de campanha.
 */
export const periciasParaInvocacao = () =>
  AFTY_PERICIAS.filter((p) => !p.complementar && p.id !== "oficio");

/* ============================================================ */
/* OS TRÊS TIPOS DE TESTE                                        */
/* ============================================================ */

/* AFTY_ATAQUES mora em ./afty-pericias-catalogo.js e é reexportado no topo. */

/* ============================================================ */
/* MANOBRAS                                                      */
/* ============================================================ */
/* "Manobras são as ações: Agarrar, Derrubar, Desarmar e Empurrar. Todas
   envolvendo Testes de Atletismo e Acrobacia." (autor, 2026-07-28)

   Texto verbatim de cada uma, na Lista de Ações Comuns:

   • AGARRAR  — "teste de Atletismo contra um teste de Atletismo ou Acrobacia
     do alvo [...] a criatura alvo recebe a condição Agarrado, podendo repetir
     o teste no começo do turno dela para escapar."
   • DERRUBAR — "teste de Atletismo contra o Atletismo ou Acrobacia do alvo
     [...] o alvo é derrubado, recebendo a condição Caído."
   • DESARMAR — "rolagem de Atletismo ou Acrobacia, forçando o alvo a realizar
     também uma rolagem com a mesma perícia."
   • EMPURRAR — "teste de Atletismo contra um teste de Atletismo ou Acrobacia
     do alvo [...] empurra a criatura em uma distância de 1,5 metros,
     aumentando em +1,5m para cada 5 pontos que seu resultado seja maior do
     que o do alvo."

   Quem EXECUTA usa Atletismo, menos o Desarmar, que deixa escolher. Quem
   RESISTE sempre escolhe entre as duas. Onde há escolha, vale o MAIOR: é a
   mesma leitura que o autor deu para "Int ou Sabedoria" e para o traço Fineza. */

export const EMPURRAO_BASE = 1.5;

export const AFTY_MANOBRAS = [
  { id: "agarrar",  nome: "Agarrar",  pericia: "atletismo" },
  { id: "derrubar", nome: "Derrubar", pericia: "atletismo" },
  { id: "desarmar", nome: "Desarmar", pericia: "melhor",
    nota: "o alvo resiste com a MESMA perícia que você escolher" },
  { id: "empurrar", nome: "Empurrar", pericia: "atletismo", empurrao: true },
];

/* ============================================================ */
/* DANO DO ATAQUE BÁSICO                                         */
/* ============================================================ */
/* Fórmulas da planilha do autor (2026-07-27). A lógica é ao contrário do
   habitual: primeiro se calcula o DANO TOTAL alvo, depois a quantidade de dados
   e o tipo de dado, e o DANO FIXO é o resto que falta para a média da rolagem
   bater no total. Por isso "4d10+7" e não "dado + modificador".

   Células da planilha, já resolvidas com o autor:
     A55 → atributo-chave do ataque (escolha da ficha). I55 é o modificador dele
     A57 → o dado, que sai do PATAMAR (Comum d8, Desafio d10, os dois de cima d12)
     A59 → grau da arma, que dá o dano adicional
   "Lacaio" e "Grau Zero" saíram do sistema, e "Maldição" é o Beyond. */

/** Média de cada dado, usada para converter o total em dano fixo. */
export const MEDIA_DADO = { d6: 3.5, d8: 4.5, d10: 5.5, d12: 6.5 };

/** O dado do ataque sai do Patamar. */
export const DADO_POR_PATAMAR = { comum: "d8", desafio: "d10", calamidade: "d12", beyond: "d12" };

/**
 * Coeficientes do Dano Total por Patamar: `nd × ND + escala × (mod + Aptidão CL)`.
 * O modificador e o Nível de Aptidão em Controle e Leitura andam sempre juntos.
 */
export const COEF_DANO_PATAMAR = {
  comum:      { nd: 2, escala: 1 },
  desafio:    { nd: 3, escala: 2 },
  calamidade: { nd: 4, escala: 2 },
  beyond:     { nd: 4, escala: 3 },
};

/**
 * Dano adicional pelo Grau da Ferramenta Amaldiçoada da arma.
 *
 * "Desarmado" é o caso sem Ferramenta nenhuma, e soma ZERO (autor,
 * 2026-07-27): arma comum, sem Ferramenta, não ganha nada aqui.
 * O Grau Especial é 20, não 40, depois que o Grau Zero saiu do sistema.
 */
export const DANO_ADICIONAL_ARMA = [
  { value: "desarmado", label: "Desarmado",     valor: 0 },
  { value: "quarto",    label: "Quarto Grau",   valor: 4 },
  { value: "terceiro",  label: "Terceiro Grau", valor: 8 },
  { value: "segundo",   label: "Segundo Grau",  valor: 12 },
  { value: "primeiro",  label: "Primeiro Grau", valor: 16 },
  { value: "especial",  label: "Grau Especial", valor: 20 },
];
const ARMA_BY_VALUE = Object.fromEntries(DANO_ADICIONAL_ARMA.map((a) => [a.value, a]));

/** Texto de exibição do dano: "4d10+7", "4d10-2" ou "4d10" quando o fixo é zero. */
export const textoDeDano = (dados, dado, fixo) =>
  `${dados}${dado}${fixo > 0 ? `+${fixo}` : fixo < 0 ? `−${Math.abs(fixo)}` : ""}`;

/**
 * Uma linha de dano. Todas as fontes usam ESTA conta: o dano listado na tabela
 * da arma e o "1d8" do Corpo Treinado não entram (autor, 2026-07-27). Da arma
 * vêm só o Alcance, as Propriedades e o grau da Ferramenta Amaldiçoada.
 *
 * `niveisDano` soma no ND, e SÓ para dano: "um ND 17 com 3 Níveis de Dano,
 * para unicamente DANO, seria considerado um ND 20" (autor, 2026-07-27).
 *
 * ⚠ A quantidade de dados é `modificador + 1`, então um atributo-chave com
 * modificador negativo zeraria a rolagem. Fica no piso de 1 dado (assumido, a
 * planilha não trata o caso).
 *
 * ⚠ DADO DE DANO ADICIONAL entra DEPOIS do dano fixo, e não antes. É a única
 * ordem em que ele aumenta o dano: o fixo é justamente o resto que falta para a
 * média bater no total, então um dado a mais dentro da conta só trocaria dano
 * fixo por variância, com a média intacta. Somando por fora, cada dado extra
 * acrescenta a média dele. Por isso "1 dado de dano adicional" (Lutador
 * Superior) e "Nível de Dano" (Corpo Treinado) são coisas DIFERENTES.
 */
function linhaDeDano({
  nd, patamar, modChave, atributo, cl, grauArma, niveisDano, bonus,
  dadosExtras = 0, margemBase = 20, reducaoMargem = 0, ignoraRD = 0, fontes = [],
}) {
  const coef = COEF_DANO_PATAMAR[patamar];
  const arma = ARMA_BY_VALUE[grauArma] ?? ARMA_BY_VALUE.desarmado;
  const ndDano = nd + niveisDano;

  const total = coef.nd * ndDano + coef.escala * modChave + coef.escala * cl + arma.valor + bonus;
  const dado = DADO_POR_PATAMAR[patamar] ?? "d8";
  const dadosBase = Math.max(1, modChave + 1);
  const fixo = Math.ceil(total - dadosBase * MEDIA_DADO[dado]);
  const dados = dadosBase + Math.max(0, dadosExtras);

  const rotuloAttr = (k) => AFTY_ATTRS.find((a) => a.key === k)?.label ?? k;
  return {
    atributo, dado, dados, dadosBase, dadosExtras, fixo, total, niveisDano,
    grauArma: arma.value,
    // Margem de crítico: o piso é 2 (crítico só em 20 natural seria margem 20,
    // e reduzir sem limite chegaria a acertar crítico em qualquer rolagem).
    margemCritico: Math.max(2, margemBase - reducaoMargem),
    ignoraRD,
    texto: textoDeDano(dados, dado, fixo),
    partes: [
      { label: niveisDano ? `Nível ${nd} + ${niveisDano} × ${coef.nd}` : `Nível × ${coef.nd}`,
        valor: coef.nd * ndDano },
      { label: `${rotuloAttr(atributo)} × ${coef.escala}`, valor: coef.escala * modChave },
      ...(cl ? [{ label: `Controle e Leitura × ${coef.escala}`, valor: coef.escala * cl }] : []),
      ...(arma.valor ? [{ label: arma.label, valor: arma.valor }] : []),
      ...fontes,
    ],
  };
}

/**
 * Resolve UMA linha de dano por fonte (autor, 2026-07-27): o Ataque Básico
 * (que engloba Desarmado, Faixas, Manoplas e o Corpo Treinado) e mais uma para
 * cada arma equipada.
 *
 * ⚠ Nem o GRAU nem o ATRIBUTO são escolha da ficha (autor, 2026-07-27). O grau
 * é o da Ferramenta Amaldiçoada DAQUELA arma, e o Ataque Básico só sobe de grau
 * com Manoplas ou Faixas equipadas. O atributo vem da arma: Força no corpo a
 * corpo, Destreza a distância, e com o traço Fineza vale o maior dos dois.
 *
 * ctx = { nd, patamar, mods, aptidaoCL, efeitos, armas, grauBasico,
 *         acertoGrauBasico, ataques }.
 * `armas` = [{ id, nome, grauArma, acertoGrau, alcance, propriedades, fineza,
 * distancia }], montado pelo deriveAfty a partir dos equipamentos.
 *
 * `nivelDano` e `danoBonus` aceitam alvo: sem alvo valem para todas as fontes,
 * com alvo (`basico` ou o id da arma) valem só naquela linha.
 *
 * ⚠ O ACERTO fecha AQUI, e não na aba de Testes (autor, 2026-08-01). O grau da
 * Ferramenta dá +1 de Acerto por degrau, e esse bônus é DAQUELA arma: somá-lo no
 * Ataque da categoria faria duas armas de graus diferentes disputarem o mesmo
 * número. Então a linha mostra o ataque da categoria (Corpo a Corpo ou A
 * Distância, já resolvido em resolveTestes) mais o grau da própria arma.
 */
export function resolveDano(creature, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  const patamar = COEF_DANO_PATAMAR[ctx.patamar] ? ctx.patamar : "comum";
  const mods = ctx.mods || {};
  const ef = ctx.efeitos || null;
  const cl = Math.max(0, Math.trunc(Number(ctx.aptidaoCL) || 0));
  const modDe = (k) => Math.trunc(Number(mods[k]) || 0);

  // `alvo` aqui é sempre a LISTA de escopos da fonte (ver escoposDaArma): uma
  // arma responde pelo id, por "arma", pela categoria, pelo grupo e por cada
  // propriedade. O Ataque Básico responde só por "basico".
  const canal = (c, escopos) => (ef ? valorCanalEscopos(ef, c, escopos) : 0);
  // `true` no fim pede os SUPLANTADOS junto: são os perdedores do pool
  // exclusivo, que o hover mostra riscados. Só o hover os quer, e é por isso que
  // o `canal` logo acima segue sem eles: quem soma não pode contá-los.
  const fontesDe = (c, escopos) =>
    (ef ? detalhesDoCanalEscopos(ef, c, escopos, true) : []).map((dd) => ({
      label: dd.nome, valor: dd.valor, ...(dd.suplantado ? { suplantado: true } : {}),
    }));

  // Força por padrão, Destreza a distância, e o maior dos dois quando a arma
  // tem Fineza (ou quando uma habilidade concede a mesma permissão, como o
  // Corpo Treinado: "você pode escolher usar tanto Força quanto Destreza").
  const atributoDe = ({ distancia, fineza }) => {
    if (distancia) return "destreza";
    return fineza && modDe("destreza") > modDe("forca") ? "destreza" : "forca";
  };

  const monta = (escopos, atributo, grauArma, margemBase) => {
    const dadosExtras = Math.max(0, Math.trunc(canal("dadosDano", escopos)));
    const linha = linhaDeDano({
      nd, patamar, atributo, modChave: modDe(atributo), cl, grauArma,
      niveisDano: Math.max(0, Math.trunc(canal("nivelDano", escopos))),
      bonus: canal("danoBonus", escopos),
      dadosExtras,
      margemBase,
      reducaoMargem: Math.trunc(canal("margemCritico", escopos)),
      ignoraRD: Math.max(0, Math.trunc(canal("ignoraRD", escopos))),
      fontes: fontesDe("danoBonus", escopos),
    });
    // Dado extra não é número, então entra no detalhamento como texto.
    for (const d of ef ? detalhesDoCanalEscopos(ef, "dadosDano", escopos) : []) {
      linha.partes.push({ label: d.nome, texto: `+${d.valor}${linha.dado}` });
    }
    return linha;
  };

  // Ataque da categoria, já resolvido em resolveTestes. A linha soma o grau da
  // arma por cima disso para fechar o número que o jogador rola.
  const ataques = Array.isArray(ctx.ataques) ? ctx.ataques : [];
  const acertoDe = (ataqueId, grauBonus, fontes = []) => {
    const atq = ataques.find((a) => a.id === ataqueId);
    if (!atq) return null;
    // As fontes de encantamento saem do total do grau para aparecerem com o
    // nome delas no hover: o resto é o rank, que é a Ferramenta em si.
    const doEncantamento = fontes.reduce((s, f) => s + (f.valor ?? 0), 0);
    const doGrau = grauBonus - doEncantamento;
    return {
      acerto: atq.bonus + grauBonus,
      acertoAtaque: atq.nome,
      partesAcerto: [
        ...atq.partes,
        ...(doGrau ? [{ label: "Grau da Ferramenta", valor: doGrau }] : []),
        ...fontes,
      ],
    };
  };

  const finezaDesarmado = valorCanal(ef, "finezaAtaque", "corpo") > 0;
  const entradas = [
    // Desarmado não tem margem de crítico listada em lugar nenhum: é 20.
    { id: "basico", nome: "Ataque Básico", fonte: "basico", alcance: null, propriedades: [],
      ...monta(escoposDaArma(null), atributoDe({ fineza: finezaDesarmado }), ctx.grauBasico, 20),
      // Manoplas e Faixas são o Ataque Básico, então o grau delas entra aqui.
      ...acertoDe("corpo", Math.max(0, Math.trunc(Number(ctx.acertoGrauBasico) || 0))) },
  ];

  for (const a of Array.isArray(ctx.armas) ? ctx.armas : []) {
    // Marcial concedida (Arma Dedicada) entra na lista de propriedades como
    // qualquer outra, marcada como concedida para a UI poder diferenciar.
    // ⚠ Entra ANTES dos escopos: `prop:marcial` tem de valer para a concedida
    // também, senão a Arma Dedicada não seria alvo de quem mira Marcial.
    const dedicada = valorCanal(ef, "propMarcial", a.id) > 0;
    const propriedades = [...(a.propriedades ?? [])];
    if (dedicada && !propriedades.some((p) => p.id === "marcial")) {
      propriedades.push({ id: "marcial", nome: "Marcial", valor: true, rotulo: "Marcial", concedida: true });
    }
    entradas.push({
      id: a.id, nome: a.nome, fonte: "arma",
      alcance: a.alcance ?? null, propriedades,
      grupo: a.grupo ?? null, categoria: a.categoria ?? null, tipoDano: a.tipoDano ?? null,
      dedicada,
      elegivelDedicada: !!a.elegivelDedicada,
      ...monta(escoposDaArma({ ...a, propriedades }), atributoDe(a), a.grauArma, a.critico ?? 20),
      // A arma a distância rola o Ataque A Distância, a de corpo a corpo rola o
      // Corpo a Corpo. O atributo já seguiu a mesma regra logo acima.
      ...acertoDe(a.distancia ? "distancia" : "corpo",
        Math.max(0, Math.trunc(Number(a.acertoGrau) || 0)), a.fontesAcerto ?? []),
    });
  }
  return { entradas };
}

/**
 * Orçamento de treinos (autor, 2026-07-27):
 * `3 + maior modificador entre Inteligência e Sabedoria + rank do Grau + outros`.
 * O rank do Grau do Feiticeiro é 1 no Quarto e vai até 5 no Especial, e sai do
 * ND (ver grauFeiticeiro em ./afty-equipamentos.js). Mestre custa 2 vagas.
 *
 * ⚠ **Perícias E Testes de Resistência gastam deste mesmo caixa** (autor,
 * 2026-07-27). Jogadas de Ataque não.
 */
export function totalPericias({ modInt = 0, modSab = 0, grauRank = 1, bonus = 0 } = {}) {
  return 3 + Math.max(modInt, modSab) + Math.max(0, Math.trunc(grauRank)) + Math.max(0, Math.trunc(bonus));
}

/**
 * Resolve os três tipos de teste da criatura. Os três somam
 * `mod do atributo + uma escala de nível + bônus de treinamento + outros`,
 * e o que sai daqui é essa parte fixa (tudo menos o d20).
 *
 * ⚠ A ESCALA DE NÍVEL NÃO É A MESMA NOS TRÊS (planilha do autor, 2026-07-27):
 *   • **Testes de Resistência** usam a escala por TIPO, a mesma da CD e da
 *     Defesa. Ver `escala` em AFTY_RESISTENCIAS.
 *   • **Jogadas de Ataque** usam `INT(ND/1,5)`, igual para todo Tipo (a mesma
 *     escala fixa da Integridade), mais a Maestria cheia se treinado. Sem
 *     faixa de Mestre: a fórmula do autor só testa "treinado".
 *   • **Perícias** seguem em `metade do ND`, que é a fórmula do JOGADOR no
 *     livro. **PENDENTE:** as outras duas tinham fórmula própria da criatura,
 *     então esta provavelmente também tem. Perguntado, sem resposta ainda.
 *
 * ctx = { nd, bt, mods, tecnicaAttr, grauRank, escalaCD, escalaDefesa, bonusVagas,
 *         efeitos, penalidadeDestreza }.
 */
export function resolveTestes(creature, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  const bt = Math.max(0, Math.trunc(Number(ctx.bt) || 0));
  const mods = ctx.mods || {};
  const meioNivel = Math.floor(nd / 2);
  const modDe = (attr) => Math.trunc(Number(mods[attr]) || 0);
  const bonusDe = (attr, prof) => modDe(attr) + meioNivel + bonusProficiencia(bt, prof);

  // Escalas de nível. `cd` e `defesa` vêm prontas do deriveAfty (são as mesmas
  // da CD e da Defesa, não recalculo aqui), e a `fixa` é INT(ND/1,5), usada
  // pela Integridade e por TODAS as Jogadas de Ataque.
  const escalaFixa = Math.floor(nd / 1.5);
  const ESCALA_TR = {
    cd: Math.trunc(Number(ctx.escalaCD) || 0),
    defesa: Math.trunc(Number(ctx.escalaDefesa) || 0),
    fixa: escalaFixa,
  };
  // A fonte que a UI mostra é a DIVISÃO de verdade, não o nome da escala
  // (autor, 2026-07-27): os cinco TRs aparecem como "Nível ÷ N", e o N muda
  // com o Tipo nos quatro primeiros. Integridade é sempre ÷ 1,5.
  const divisorTexto = (d) => String(d).replace(".", ",");
  const ESCALA_ROTULO = {
    cd: `Nível ÷ ${divisorTexto(ctx.divisorCD ?? 1.5)}`,
    defesa: `Nível ÷ ${divisorTexto(ctx.divisorDefesa ?? 1.5)}`,
    fixa: "Nível ÷ 1,5",
  };

  const profBruta = creature?.pericias && typeof creature.pericias === "object" ? creature.pericias : {};
  const valida = (p) => (p === "treinado" || p === "mestre" ? p : null);

  // Motor de Automação: bônus e proficiência concedidos por Treinamentos,
  // Habilidades e afins. `ef` é o resultado já aplicado, vindo do deriveAfty.
  const ef = ctx.efeitos || null;
  const bonusDeEfeito = (canal, alvo) => (ef ? valorCanal(ef, canal, alvo) : 0);
  // Uma parcela por FONTE, para o hover mostrar de onde veio cada número.
  // Com os suplantados (perdedores do pool exclusivo), que o hover risca.
  const partesDeEfeito = (canal, alvo) =>
    (ef ? detalhesDoCanal(ef, canal, alvo, true) : []).map((d) => ({
      label: d.nome, valor: d.valor, ...(d.suplantado ? { suplantado: true } : {}),
    }));

  /* Perícia e TR respondem por DOIS alvos: o próprio id e o atributo que usam
     (`atr:destreza`). As Dádivas do Céu do Restringido são escritas assim,
     "bônus em teste de perícia ou resistência usando destreza", e listar as
     perícias uma a uma no conteúdo seria lista copiada à mão que envelhece. */
  const escoposDe = (id, atributo) => [id, `atr:${atributo}`];
  const bonusPorAtributo = (canal, id, atributo) =>
    (ef ? valorCanalEscopos(ef, canal, escoposDe(id, atributo)) : 0);
  const partesPorAtributo = (canal, id, atributo) =>
    (ef ? detalhesDoCanalEscopos(ef, canal, escoposDe(id, atributo), true) : [])
      .map((d) => ({ label: d.nome, valor: d.valor, ...(d.suplantado ? { suplantado: true } : {}) }));
  const rotuloAttr = (k) => AFTY_ATTRS.find((a) => a.key === k)?.label ?? k;

  /* Penalidade de armadura e escudo, cumulativa (autor, 2026-08-01). Vale só em
     "testes de perícia que utilizam Destreza", que é o que o livro escreve:
     não pega Teste de Resistência nem Jogada de Ataque. Chega como número
     negativo. */
  const penalidadeEquip = Math.min(0, Math.trunc(Number(ctx.penalidadeDestreza) || 0));
  const penalidadeDe = (atributo) => (atributo === "destreza" ? penalidadeEquip : 0);
  const partePenalidade = (atributo) =>
    (penalidadeDe(atributo) ? [{ label: "Armadura e Escudo", valor: penalidadeEquip }] : []);

  const parteProficiencia = (prof) => {
    const v = bonusProficiencia(bt, prof);
    if (!prof) return [];
    return [{ label: prof === "mestre" ? "Maestria (Mestre)" : "Maestria", valor: v }];
  };
  // Proficiência concedida NUNCA rebaixa a escolhida: fica a maior das duas.
  const FAIXA = { treinado: 1, mestre: 2 };
  const NOME_FAIXA = { 1: "treinado", 2: "mestre" };
  const profComEfeito = (canal, id, escolhida) => {
    const concedida = Math.trunc(bonusDeEfeito(canal, id));
    const nivel = Math.max(FAIXA[escolhida] ?? 0, Math.min(2, Math.max(0, concedida)));
    return NOME_FAIXA[nivel] ?? null;
  };

  // `requerTreinamento` e `complementar` seguem no catálogo (são a tabela do
  // livro e o filtro das Invocações depende deles), mas NÃO viram marcação na
  // tela: o autor tirou as duas da UI em 2026-07-27. Quem precisa da regra lê
  // a `nota` verbatim dentro da descrição.
  const pericias = AFTY_PERICIAS.map((p) => {
    const escolhida = valida(profBruta[p.id]);
    const prof = profComEfeito("proficienciaPericia", p.id, escolhida);
    return {
      ...p,
      prof,
      // A faixa que a FICHA escolheu, separada da resolvida: é ela que gasta
      // vaga. O treino concedido de fora já foi pago (com Focos, no caso do
      // Treino de Perícia) e não pode cobrar de novo.
      profEscolhida: escolhida,
      // `concedida` marca o treino que veio de fora, para a UI poder mostrar
      // que aquela faixa não é desmarcável ali.
      concedida: !!prof && prof !== escolhida,
      bonus: bonusDe(p.atributo, prof) + bonusPorAtributo("bonusPericia", p.id, p.atributo)
        + penalidadeDe(p.atributo),
      partes: [
        { label: rotuloAttr(p.atributo), valor: modDe(p.atributo) },
        { label: "Metade do ND", valor: meioNivel },
        ...parteProficiencia(prof),
        ...partePenalidade(p.atributo),
        ...partesPorAtributo("bonusPericia", p.id, p.atributo),
      ],
    };
  });

  const trBruta = creature?.resistenciasProf && typeof creature.resistenciasProf === "object"
    ? creature.resistenciasProf : {};
  const resistencias = AFTY_RESISTENCIAS.map((r) => {
    // Mesma anatomia das perícias: a faixa ESCOLHIDA é a que gasta vaga, e a
    // resolvida ainda soma o que foi concedido de fora (Teste de Resistência
    // Mestre e afins). Sem os dois campos a UI trataria todo TR treinado como
    // concessão externa, pintava de verde e não deixava desmarcar.
    const escolhida = valida(trBruta[r.value]);
    const prof = profComEfeito("proficienciaTR", r.value, escolhida);
    return {
      ...r,
      prof,
      profEscolhida: escolhida,
      concedida: !!prof && prof !== escolhida,
      // Escala por Tipo no lugar da metade do nível, ver o cabeçalho da função.
      bonus: modDe(r.atributo) + (ESCALA_TR[r.escala] ?? 0) + bonusProficiencia(bt, prof)
        + bonusPorAtributo("bonusTR", r.value, r.atributo),
      // Só quem é mestre num TR consegue sucesso crítico nele (superar a CD
      // por 10 ou mais ignora dano e condições).
      critico: prof === "mestre",
      // Margem necessária para o sucesso crítico. Parte de 20 e desce com a
      // Melhoria de Resistência e os Treinamentos Completos de Agilidade e
      // Resistência. Piso de 2, igual à margem do ataque.
      margemCritico: Math.max(2, 20 - Math.trunc(bonusDeEfeito("margemCriticoTR", r.value))),
      partes: [
        { label: rotuloAttr(r.atributo), valor: modDe(r.atributo) },
        { label: ESCALA_ROTULO[r.escala] ?? "Escala de Nível", valor: ESCALA_TR[r.escala] ?? 0 },
        ...parteProficiencia(prof),
        ...partesPorAtributo("bonusTR", r.value, r.atributo),
      ],
    };
  });

  // Ataque = mod do atributo + INT(ND/1,5) + Maestria se treinado. Sem faixa de
  // Mestre: a fórmula do autor só testa "treinado", e é a Maestria cheia.
  const atqBruta = creature?.ataquesProf && typeof creature.ataquesProf === "object" ? creature.ataquesProf : {};
  const fineza = !!creature?.ataqueFineza;
  const ataques = AFTY_ATAQUES.map((a) => {
    const treinado = a.sempreTreinado || !!atqBruta[a.id];
    // Fineza libera o atributo alternativo do ataque. Vem da arma manejada
    // (a marcação da ficha) ou de uma habilidade que dá a mesma permissão
    // ("você pode escolher usar tanto Força quanto Destreza", Corpo Treinado).
    // Sendo escolha livre e sem custo, vale o MAIOR dos dois modificadores.
    const liberado = a.atributoFineza
      && (fineza || bonusDeEfeito("finezaAtaque", a.id) > 0);
    const attr = a.id === "amaldicoado"
      ? (ctx.tecnicaAttr || "inteligencia")
      : (liberado && modDe(a.atributoFineza) > modDe(a.atributo) ? a.atributoFineza : a.atributo);
    return {
      ...a,
      atributo: attr,
      treinado,
      bonus: modDe(attr) + escalaFixa + (treinado ? bt : 0) + bonusDeEfeito("bonusAcerto", a.id),
      partes: [
        { label: rotuloAttr(attr), valor: modDe(attr) },
        { label: "Nível ÷ 1,5", valor: escalaFixa },
        ...(treinado ? [{ label: "Maestria", valor: bt }] : []),
        ...partesDeEfeito("bonusAcerto", a.id),
      ],
    };
  });

  // ---------- Manobras (Agarrar, Derrubar, Desarmar, Empurrar) ----------
  // São testes de perícia, então aproveitam o bônus de perícia já resolvido
  // acima (atributo + escala + treino + efeitos). O que entra por cima é o
  // canal próprio delas.
  const bonusPericiaDe = (id) => pericias.find((p) => p.id === id)?.bonus ?? 0;
  const atletismo = bonusPericiaDe("atletismo");
  const acrobacia = bonusPericiaDe("acrobacia");
  const melhorDasDuas = Math.max(atletismo, acrobacia);
  const nomePericia = (id) => AFTY_PERICIAS.find((p) => p.id === id)?.nome ?? id;

  const manobras = AFTY_MANOBRAS.map((m) => {
    const usaMelhor = m.pericia === "melhor";
    const baseExec = usaMelhor ? melhorDasDuas : bonusPericiaDe(m.pericia);
    const rotuloExec = usaMelhor
      ? (acrobacia > atletismo ? nomePericia("acrobacia") : nomePericia("atletismo"))
      : nomePericia(m.pericia);
    return {
      ...m,
      // Executar a manobra.
      executar: baseExec + bonusDeEfeito("bonusManobra", m.id),
      periciaUsada: rotuloExec,
      partesExecutar: [
        { label: rotuloExec, valor: baseExec },
        ...partesDeEfeito("bonusManobra", m.id),
      ],
      // Resistir a ela: quem resiste sempre escolhe entre as duas.
      resistir: melhorDasDuas + bonusDeEfeito("resistirManobra", m.id),
      partesResistir: [
        { label: acrobacia > atletismo ? nomePericia("acrobacia") : nomePericia("atletismo"), valor: melhorDasDuas },
        ...partesDeEfeito("resistirManobra", m.id),
      ],
      // Só o Empurrar tem distância. "+1,5m para cada 5 pontos" fica na mesa:
      // depende da margem da rolagem.
      distancia: m.empurrao ? EMPURRAO_BASE + bonusDeEfeito("distanciaEmpurrao") : null,
    };
  });

  const total = totalPericias({
    modInt: modDe("inteligencia"),
    modSab: modDe("sabedoria"),
    grauRank: ctx.grauRank ?? 1,
    bonus: ctx.bonusVagas ?? 0,
  });
  // Perícias E Testes de Resistência dividem as mesmas vagas (autor,
  // 2026-07-27). Jogadas de Ataque ficam fora: elas não têm faixa de Mestre e
  // o treino delas é com a arma que a criatura maneja.
  const gastoPericias = pericias.reduce((s, p) => s + custoProficiencia(p.profEscolhida), 0);
  const gastoResistencias = resistencias.reduce((s, r) => s + custoProficiencia(r.profEscolhida), 0);
  const gastos = gastoPericias + gastoResistencias;

  return {
    pericias,
    resistencias,
    ataques,
    manobras,
    orcamento: {
      total, gastos, pericias: gastoPericias, resistencias: gastoResistencias,
      restante: total - gastos, excedeu: gastos > total,
    },
    // Atenção = 10 + o bônus de Percepção (Percepção passiva).
    atencao: 10 + (pericias.find((p) => p.id === "percepcao")?.bonus ?? 0),
  };
}

/** Validador de conteúdo (mesmo papel de validarCatalogoAptidoes). */
export function validarCatalogoPericias() {
  const erros = [];
  const ids = new Set();
  const nomes = new Set();
  const attrKeys = new Set(AFTY_ATTRS.map((a) => a.key));
  for (const p of AFTY_PERICIAS) {
    if (ids.has(p.id)) erros.push(`id duplicado: ${p.id}`);
    ids.add(p.id);
    if (nomes.has(p.nome)) erros.push(`nome duplicado: ${p.nome}`);
    nomes.add(p.nome);
    if (!p.nome) erros.push(`${p.id}: sem nome`);
    if (!attrKeys.has(p.atributo)) erros.push(`${p.id}: atributo inválido "${p.atributo}"`);
  }
  return erros;
}
