/**
 * ============================================================
 * EXPANSÕES DE DOMÍNIO — construtor
 * ============================================================
 * PORTADO de `src/components/fm-domain-calc.js` (grimório 2.5.2) em 2026-07-30,
 * a pedido do autor: "Faça a aba de Expansões de Domínio parecido com o quê foi
 * feito na 2.5.2. Lá ficou um ótimo resultado, e é bem próximo do que vamos
 * fazer aqui."
 *
 * ⚠ A 2.5.2 é SOMENTE-LEITURA, então isto é cópia adaptada, e não import. A
 * estrutura (versões, efeitos por categoria, Fortalecer, Acerto Garantido, texto
 * final) veio de lá inteira. O que MUDOU para o Afty está marcado com `⚠ AFTY:`
 * ao longo do arquivo, e é sempre por o livro do Afty dizer outra coisa.
 *
 * ------------------------------------------------------------
 * O QUE O LIVRO DO AFTY CONFIRMA (e bate com a 2.5.2)
 * ------------------------------------------------------------
 * De `afty-aptidoes.js`, verbatim:
 *
 *  • Incompleta: "pagar 15PE", "área igual a 4,5 metros multiplicado pelo seu
 *    bônus de treinamento", "dura, por padrão, uma quantidade de rodadas igual a
 *    1 + seu nível de aptidão em domínio".
 *  • Completa: "pagar 20PE", "cria uma área esférica de 9 metros", "dura, por
 *    padrão, uma quantidade de rodadas igual a 3 + seu nível de aptidão em
 *    domínio".
 *  • Acerto Garantido: "aumenta o seu custo em 5 pontos de energia amaldiçoada",
 *    e "não conta para o máximo" de efeitos.
 *  • Sem Barreiras: "mesmos efeitos e custo de uma expansão completa com acerto
 *    garantido, mas não levanta barreiras, tendo um alcance superior".
 *
 * ------------------------------------------------------------
 * ⚠ O QUE NÃO TEM FONTE NO AFTY (herdado da 2.5.2, a confirmar)
 * ------------------------------------------------------------
 * O "Guia de Criação de Expansões de Domínio" que as aptidões citam NUNCA foi
 * enviado para o lado do Afty. Então estes números são os da 2.5.2 e estão aqui
 * como ponto de partida, não como regra confirmada:
 *
 *  1. As TABELAS de efeito inteiras (DOMINIO_EFEITOS), com os valores por DOM.
 *  2. O limite de efeitos por DOM (1 no 1-2, 2 no 3-4, 3 no 5).
 *  3. Fortalecer: custa 2 vagas e multiplica as grandezas por 1,5.
 *  4. O teto de DOM 3 numa expansão Incompleta.
 *  5. Os 5 efeitos base de toda expansão.
 *  6. A Modificação Completa (inversão de resistência e mudança de tamanho).
 *
 * ⚠ E UM NÚMERO EM QUE AFTY E 2.5.2 JÁ DIVERGEM, ver `pvBarreira` abaixo.
 * ============================================================
 */

/* ------------------------------------------------------------ */
/* VERSÕES                                                       */
/* ------------------------------------------------------------ */
/**
 * ⚠ AFTY: a versão é destravada pela APTIDÃO, e não pelo ND solto como na
 * 2.5.2. No Afty cada versão é uma Aptidão de Domínio com pré-requisito próprio,
 * e ter o ND não basta: é preciso ter gastado a vaga. O ND continua no catálogo
 * como o mínimo da aptidão, e fica aqui só para a UI saber explicar o que falta.
 */
export const DOMINIO_VERSOES = [
  { key: "incompleta",    label: "Incompleta",    aptidao: "expansao_de_dominio_incompleta",  ndMin: 8 },
  { key: "completa",      label: "Completa",      aptidao: "expansao_de_dominio_completa",    ndMin: 10 },
  { key: "sem_barreiras", label: "Sem Barreiras", aptidao: "expansao_de_dominio_sem_barreiras", ndMin: 20 },
];

const VERSAO_BY_KEY = Object.fromEntries(DOMINIO_VERSOES.map((v) => [v.key, v]));
export const getVersaoDominio = (key) => VERSAO_BY_KEY[key] ?? null;
export const rotuloVersao = (key) => VERSAO_BY_KEY[key]?.label ?? "";

/** A aptidão que destrava o Acerto Garantido, que é opcional e some sem ela. */
export const APTIDAO_ACERTO_GARANTIDO = "acerto_garantido";

/** As versões que a criatura REALMENTE tem, pelas aptidões escolhidas. */
export function versoesDisponiveis(aptidoesEscolhidas = []) {
  const tem = new Set(aptidoesEscolhidas);
  return DOMINIO_VERSOES.filter((v) => tem.has(v.aptidao)).map((v) => ({ value: v.key, label: v.label }));
}

/** A melhor versão que a criatura tem, para o padrão de um domínio novo. */
export function versaoPadrao(aptidoesEscolhidas = []) {
  const disp = versoesDisponiveis(aptidoesEscolhidas);
  return disp.length ? disp[disp.length - 1].value : "";
}

/** A versão do domínio, caindo na melhor disponível se a gravada não valer mais. */
export function resolveVersao(dominio, aptidoesEscolhidas = []) {
  const disp = versoesDisponiveis(aptidoesEscolhidas).map((v) => v.value);
  if (dominio?.versao && disp.includes(dominio.versao)) return dominio.versao;
  return versaoPadrao(aptidoesEscolhidas);
}

/* ------------------------------------------------------------ */
/* CUSTO, DURAÇÃO E ÁREA (tudo confirmado pelo livro do Afty)    */
/* ------------------------------------------------------------ */
export const DOMINIO_CUSTO_BASE = { incompleta: 15, completa: 20, sem_barreiras: 20 };
export const CUSTO_ACERTO_GARANTIDO = 5;

export const custoDominio = (versao, comAcertoGarantido = false) =>
  (DOMINIO_CUSTO_BASE[versao] ?? 0) + (comAcertoGarantido ? CUSTO_ACERTO_GARANTIDO : 0);

/** Incompleta: 1 + DOM. Completa e Sem Barreiras: 3 + DOM. */
export const duracaoDominio = (dom = 0, versao) =>
  (versao === "incompleta" ? 1 : 3) + Math.max(0, Math.trunc(Number(dom) || 0));

const num = (n) => (Number.isInteger(n) ? `${n}` : String(n).replace(".", ","));
const metros = (n) => `${num(n)} metros`;

/**
 * Incompleta: 4,5 m × Bônus de Treinamento. Completa: 9 m.
 * Sem Barreiras: 9 m × BT (herdado da 2.5.2, o livro do Afty só diz "alcance
 * superior" sem dar o número).
 */
export function areaDominio(versao, bt = 2, dobraArea = false) {
  const b = Math.max(1, Math.trunc(Number(bt) || 1));
  if (versao === "incompleta") return metros(4.5 * b);
  if (versao === "completa") return "9 metros";
  if (versao === "sem_barreiras") return metros(9 * b * (dobraArea ? 2 : 1));
  return "";
}

/* ------------------------------------------------------------ */
/* PV DA BARREIRA                                                */
/* ------------------------------------------------------------ */
/**
 * ⚠ AQUI AFTY E 2.5.2 DIVERGEM, e é a divergência mais concreta que a leitura
 * achou. A derivação é a mesma nas duas: o domo vale o DOBRO das seis paredes da
 * aptidão Técnicas de Barreira, ou seja `12 × pvDaParede`. O que mudou foi o PV
 * da parede.
 *
 *   2.5.2: parede = 15 + BAR × metade do ND.
 *   AFTY (`afty-aptidoes.js`, verbatim):
 *     Técnicas de Barreira → "vida igual a 5 + seu nível de aptidão em Barreiras
 *       multiplicado por metade do seu nível de personagem"
 *     Paredes Resistentes  → "passam a ser 10 + seu nível de aptidão em Barreiras
 *       multiplicado pelo seu nível de personagem"
 *
 * Esta função segue o AFTY, porque é o texto que o autor mandou. E como Paredes
 * Resistentes existe no Afty e não muda nada na 2.5.2, ela entra aqui: quem a
 * pegou tem parede melhor, então tem domo melhor.
 *
 * ⚠ A CONFIRMAR: que o domo continua valendo 12 paredes no Afty. O "dobro das
 * seis paredes" é regra da 2.5.2, e o livro do Afty não repete a conta.
 */
export const PAREDES_NO_DOMO = 12;

export function pvDaParede(bar = 0, nd = 0, temParedesResistentes = false) {
  const b = Math.max(0, Math.trunc(Number(bar) || 0));
  const n = Math.max(0, Math.trunc(Number(nd) || 0));
  return temParedesResistentes ? 10 + b * n : 5 + b * Math.floor(n / 2);
}

export const pvBarreira = (bar = 0, nd = 0, temParedesResistentes = false) =>
  PAREDES_NO_DOMO * pvDaParede(bar, nd, temParedesResistentes);

/* ------------------------------------------------------------ */
/* LIMITE DE EFEITOS                                             */
/* ------------------------------------------------------------ */
/** ⚠ SEM FONTE NO AFTY. Herdado da 2.5.2: DOM 1-2 → 1, 3-4 → 2, 5 → 3. */
export function maxEfeitos(dom = 0) {
  const d = Math.trunc(Number(dom) || 0);
  if (d >= 5) return 3;
  if (d >= 3) return 2;
  if (d >= 1) return 1;
  return 0;
}

/** ⚠ SEM FONTE NO AFTY. Herdado da 2.5.2: a Incompleta não passa de DOM 3. */
export function domEfetivo(dom = 0, versao) {
  const d = Math.max(0, Math.min(5, Math.trunc(Number(dom) || 0)));
  return versao === "incompleta" ? Math.min(d, 3) : d;
}

/** ⚠ SEM FONTE NO AFTY. Fortalecer custa 2 vagas e escala as grandezas por 1,5. */
export const custoEmVagas = (efeito) => (efeito?.fortalecido ? 2 : 1);
export const vagasUsadas = (efeitos = []) => efeitos.reduce((n, e) => n + custoEmVagas(e), 0);

const F = (n, fortalecido) => (fortalecido ? Math.round(n * 1.5) : n);
const plural = (n, um, varios) => (n === 1 ? um : varios);

/* ============================================================ */
/* TABELAS DE EFEITO (⚠ TODAS herdadas da 2.5.2, sem fonte Afty) */
/* ============================================================ */
/* Cada tipo tem `resolve(idx, fortalecido)` e devolve:
     valor  — a grandeza curta, que a UI mostra ao lado do seletor
     frase  — a frase inteira, que entra no Texto Final
     motor  — como o efeito vira canal do Motor de Automação (ou ausente,
              quando ele age sobre INIMIGO e não sobre a própria ficha)
   idx = domEfetivo - 1 (0 a 4). */
export const DOMINIO_EFEITOS = {
  amp_tecnica: {
    label: "Amplificação de Técnica",
    desc: "Amplifica diretamente a sua técnica amaldiçoada dentro da expansão.",
    tipos: {
      dano: {
        label: "Aumento de Dano",
        resolve: (i, f) => {
          const dados = F([1, 2, 3, 4, 5][i], f);
          const fixo = F([5, 5, 10, 10, 15][i], f);
          const valor = `+${dados} ${plural(dados, "dado", "dados")} de dano e +${fixo} de dano fixo`;
          return {
            valor,
            frase: `Todos os seus Feitiços de dano recebem ${valor}.`,
            motor: [
              { canal: "dadosDano", alvo: "feitico", expr: String(dados) },
              { canal: "danoBonus", alvo: "feitico", expr: String(fixo) },
            ],
          };
        },
      },
      cd: {
        label: "Aumento de CD",
        resolve: (i, f) => {
          const n = F([2, 4, 6, 8, 10][i], f);
          return {
            valor: `+${n} de CD`,
            frase: `Todos os seus Feitiços têm a CD para resistir aumentada em ${n}.`,
            motor: [{ canal: "cd", expr: String(n) }],
          };
        },
      },
      negacao_rd: {
        label: "Negação de Redução de Dano",
        resolve: (i, f) => {
          const rd = F([3, 6, 10, 12, 15][i], f);
          const resist = i >= 3;
          const valor = `${resist ? "resistentes perdem a resistência, " : ""}-${rd} RD`;
          return {
            valor,
            frase: `Seus Feitiços ignoram ${rd} de RD dos alvos${resist ? ", e inimigos resistentes perdem a resistência" : ""}.`,
            motor: [
              { canal: "ignoraRD", alvo: "feitico", expr: String(rd) },
              ...(resist ? [{ canal: "removeResistencia", alvo: "feitico", expr: "1" }] : []),
            ],
          };
        },
      },
    },
  },
  amp_corporal: {
    label: "Amplificação Corporal",
    desc: "Afeta diretamente o usuário, deixando-o mais forte.",
    tipos: {
      dano: {
        label: "Aumento de Dano",
        resolve: (i, f) => {
          const niveis = F([2, 4, 6, 8, 10][i], f);
          const fixo = F([5, 5, 10, 10, 15][i], f);
          const valor = `+${niveis} níveis de dano e +${fixo} de dano fixo`;
          return {
            valor,
            frase: `Todos os seus ataques armados e desarmados recebem ${valor}.`,
            motor: [
              { canal: "nivelDano", alvo: "arma", expr: String(niveis) },
              { canal: "nivelDano", alvo: "basico", expr: String(niveis) },
              { canal: "danoBonus", alvo: "arma", expr: String(fixo) },
              { canal: "danoBonus", alvo: "basico", expr: String(fixo) },
            ],
          };
        },
      },
      atributo: {
        label: "Aumento de Atributo",
        resolve: (i, f) => {
          const n = F([2, 4, 6, 8, 10][i], f);
          const valor = `+${n} em dois atributos físicos distintos`;
          return {
            valor,
            frase: `Você recebe ${valor} (até o limite de 30).`,
            // O alvo sai da escolha do jogador (`atributos`), não da tabela.
            motorAtributo: n,
          };
        },
      },
      rd: {
        label: "Redução de Dano",
        resolve: (i, f) => {
          const rd = F([3, 6, 9, 12, 15][i], f);
          const tipos = [3, 3, 4, 4, 5][i];
          const valor = `+${rd} de RD contra ${tipos} tipos de dano`;
          return {
            valor,
            frase: `Você recebe ${valor} (escolhidos na criação).`,
            // ⚠ Entra como RD GERAL enquanto RD por tipo não existir. O autor
            // sinalizou em 2026-07-30 que quer trocar a RD Específica por uma RD
            // por tipo de dano, e quando isso existir esta linha muda de canal.
            motor: [{ canal: "rdGeral", expr: String(rd) }],
            tiposMax: tipos,
          };
        },
      },
      defesa: {
        label: "Defesa",
        resolve: (i, f) => {
          const n = F([3, 5, 7, 9, 12][i], f);
          return {
            valor: `+${n} de Defesa`,
            frase: `Você recebe +${n} de Defesa enquanto a expansão durar.`,
            motor: [{ canal: "defesa", expr: String(n) }],
          };
        },
      },
      negacao_rd: {
        label: "Negação de Redução de Dano (golpes)",
        resolve: (i, f) => {
          const rd = F([3, 6, 10, 12, 15][i], f);
          const resist = i >= 3;
          const valor = `${resist ? "resistentes perdem a resistência, " : ""}-${rd} RD`;
          return {
            valor,
            frase: `Seus golpes ignoram ${rd} de RD dos alvos${resist ? ", e inimigos resistentes perdem a resistência" : ""}.`,
            motor: [
              { canal: "ignoraRD", alvo: "arma", expr: String(rd) },
              { canal: "ignoraRD", alvo: "basico", expr: String(rd) },
              ...(resist ? [
                { canal: "removeResistencia", alvo: "arma", expr: "1" },
                { canal: "removeResistencia", alvo: "basico", expr: "1" },
              ] : []),
            ],
          };
        },
      },
    },
  },
  ambiental: {
    label: "Efeito Ambiental",
    desc: "Efeito passivo e constante dentro do ambiente da expansão.",
    // Nenhum entra no Motor: os três agem sobre as criaturas hostis, e não
    // sobre a ficha de quem expandiu.
    tipos: {
      dano: {
        label: "Dano Ambiental",
        resolve: (i, f) => {
          const n = F([1, 2, 2, 2, 3][i], f);
          const d = [10, 8, 10, 12, 10][i];
          const fixo = F([10, 15, 20, 25, 35][i], f);
          const valor = `${n}d${d} + ${fixo}`;
          return {
            valor,
            frase: `Todas as criaturas hostis dentro do domínio recebem ${valor} de dano (tipo a escolher) a cada rodada.`,
          };
        },
      },
      condicoes: {
        label: "Condições",
        resolve: (i, f) => {
          const dados = F([2, 4, 6, 8, 12][i], f);
          const faixas = [
            "fracas",
            "fracas ou médias",
            "fracas, médias ou fortes",
            "fracas, médias ou fortes",
            "fracas, médias ou fortes",
          ][i];
          return {
            valor: `condições ${faixas} (${dados} dados)`,
            frase: `Toda criatura hostil faz um TR no começo do turno, e em uma falha recebe uma condição (${faixas}). São ${dados} dados para distribuir, e as condições duram 1 rodada.`,
          };
        },
      },
      lentidao: {
        label: "Lentidão",
        resolve: (i, f) => {
          // Os valores base já são múltiplos de 1,5, então o ×1,5 do Fortalecer
          // não precisa de arredondamento (ao contrário dos outros efeitos).
          const m = [3, 6, 9, 12, 18][i] * (f ? 1.5 : 1);
          return {
            valor: `reduz ${num(m)} m`,
            frase: `Toda criatura hostil no domínio tem o movimento reduzido em ${num(m)} m, e fica incapaz de se mover se chegar a 0.`,
          };
        },
      },
    },
  },
  especial: {
    label: "Efeito Especial",
    desc: "Mecânica única definida entre jogador e Narrador.",
    tipos: {},
    livre: true,
  },
};

export const DOMINIO_CATEGORIAS = Object.entries(DOMINIO_EFEITOS)
  .map(([value, cat]) => ({ value, label: cat.label }));

export const tiposDaCategoria = (categoria) => {
  const cat = DOMINIO_EFEITOS[categoria];
  if (!cat || cat.livre) return [];
  return Object.entries(cat.tipos).map(([value, t]) => ({ value, label: t.label }));
};

export const categoriaLivre = (categoria) => !!DOMINIO_EFEITOS[categoria]?.livre;

/**
 * ⚠ SEM FONTE NO AFTY. Herdados da 2.5.2, e só texto: nenhum entra no Motor.
 *
 * Cada um tem TÍTULO separado do corpo porque o texto final é renderizado em
 * bullets de "Título. corpo", com o título em destaque. Sem a separação o bullet
 * inteiro sairia em negrito, que é o que acontece quando a frase não tem ponto
 * no meio.
 */
export const DOMINIO_EFEITOS_BASE = [
  { titulo: "Níveis de Aptidão", texto: "Você recebe +2 em todos os níveis de aptidão, exceto Barreira e Domínio, podendo passar do limite. Exige ter ao menos Nível 1 na aptidão." },
  { titulo: "Confronto de Domínio", texto: "Você recebe +2 em testes de Confronto de Domínio." },
  { titulo: "Movimento", texto: "Seu movimento dobra dentro da própria expansão." },
  { titulo: "Custo de Feitiço", texto: "O custo dos seus Feitiços dentro da expansão é reduzido em um valor igual ao seu Nível de DOM." },
  { titulo: "Benefício de Ritual", texto: "Todos os seus Feitiços recebem um benefício de ritual, escolhido por categoria (Dano, Especiais, Auxiliares e Cura)." },
];

export const DOMINIO_RITUAL_CATEGORIAS = [
  { key: "dano", label: "Dano" },
  { key: "especial", label: "Especiais" },
  { key: "auxiliar", label: "Auxiliares" },
  { key: "curativo", label: "Cura" },
];

const normalizaBeneficiosRitual = (beneficios) => Object.fromEntries(
  DOMINIO_RITUAL_CATEGORIAS.map(({ key }) => [key, String(beneficios?.[key] ?? "")]),
);

/**
 * O benefício básico "Níveis de Aptidão" precisa entrar ANTES do contexto
 * principal do Motor, porque `au`, `cl` e `er` são variáveis do próprio DSL.
 * Por isso ele fica separado dos efeitos escolhidos da expansão, que dependem
 * do DOM efetivo e são resolvidos mais tarde.
 *
 * A regra só alcança uma trilha em que a criatura já tenha ao menos Nível 1.
 * O chamador entrega os níveis resolvidos sem a própria expansão, evitando que
 * o bônus se habilite sozinho numa trilha zerada.
 */
export function efeitosDeAptidaoDoDominio(
  creature,
  { aptidoesEscolhidas = [], niveisAptidao = {} } = {},
) {
  const combate = creature?.combate;
  if (!combate?.ativo || !combate?.dominioAtivo) return [];

  const ativo = dominioEmUso(creature, aptidoesEscolhidas);
  if (!ativo) return [];

  const nome = `${ativo.nome || "Expansão de Domínio"}: Níveis de Aptidão`;
  return ["au", "cl", "er"].flatMap((alvo) => {
    if ((niveisAptidao?.[alvo] ?? 0) < 1) return [];
    const base = {
      alvo,
      expr: "2",
      nome,
      origem: ativo.id,
      duracao: "temporaria",
    };
    return [
      { ...base, canal: "nivelAptidao" },
      { ...base, canal: "limiteAptidao" },
    ];
  });
}

/* ------------------------------------------------------------ */
/* RESOLUÇÃO DE UM EFEITO                                        */
/* ------------------------------------------------------------ */
const defDoTipo = (efeito) => DOMINIO_EFEITOS[efeito?.categoria]?.tipos?.[efeito?.tipo] ?? null;

const resolvido = (efeito, dom, versao) => {
  const t = defDoTipo(efeito);
  if (!t) return null;
  return t.resolve(Math.max(0, domEfetivo(dom, versao) - 1), !!efeito.fortalecido);
};

/** Grandeza curta do efeito. Vazia no Efeito Especial, que não tem tabela. */
export function valorDoEfeito(efeito, dom, versao) {
  if (!efeito || categoriaLivre(efeito.categoria)) return "";
  return resolvido(efeito, dom, versao)?.valor ?? "";
}

export function rotuloDoEfeito(efeito) {
  const cat = DOMINIO_EFEITOS[efeito?.categoria];
  if (!cat) return "Efeito";
  if (cat.livre) return cat.label;
  const t = cat.tipos?.[efeito?.tipo];
  return t ? `${cat.label}: ${t.label}` : cat.label;
}

/* ------------------------------------------------------------ */
/* MODELO DE DADOS                                               */
/* ------------------------------------------------------------ */
let seq = 0;
export function novoEfeitoDominio(categoria = "amp_tecnica") {
  seq += 1;
  return {
    id: `dfx_${Date.now().toString(36)}_${seq}`,
    categoria,
    tipo: categoriaLivre(categoria) ? "" : Object.keys(DOMINIO_EFEITOS[categoria].tipos)[0],
    nome: "",
    descricao: "",
    fortalecido: false,
    // Escolhas que a tabela não captura:
    //  atributos — os dois físicos do "Aumento de Atributo"
    //  rdTipos   — os tipos de dano protegidos pela "Redução de Dano"
    atributos: [],
    rdTipos: "",
  };
}

/** Os atributos físicos elegíveis para o Aumento de Atributo. */
export const ATRIBUTOS_FISICOS = [
  { value: "forca",        label: "Força" },
  { value: "destreza",     label: "Destreza" },
  { value: "constituicao", label: "Constituição" },
];

export function novoDominio(versao = "") {
  seq += 1;
  return {
    id: `dom_${Date.now().toString(36)}_${seq}`,
    nome: "",
    versao,
    aparencia: "",
    efeitos: [],
    beneficiosRitual: normalizaBeneficiosRitual(null),
    acertoGarantido: { ativo: false, escopo: "" },
  };
}

export function normalizeDominio(d = {}) {
  return {
    ...novoDominio(),
    ...d,
    efeitos: Array.isArray(d.efeitos)
      ? d.efeitos.map((e) => ({ ...novoEfeitoDominio(e.categoria), ...e }))
      : [],
    beneficiosRitual: normalizaBeneficiosRitual(d.beneficiosRitual),
    acertoGarantido: { ativo: false, escopo: "", ...(d.acertoGarantido ?? {}) },
  };
}

export const listaDominios = (creature) =>
  (Array.isArray(creature?.dominios) ? creature.dominios : []).map(normalizeDominio);

/**
 * Qual expansão a sessão está usando. A ficha final grava o id diretamente no
 * estado `dominioAtivo`. O booleano antigo continua válido: usa a escolha do
 * criador ou, quando só existe uma expansão, a única opção possível.
 */
export function dominioEmUso(creature, aptidoesEscolhidas = []) {
  const lista = listaDominios(creature);
  const estado = creature?.combate?.dominioAtivo;
  const candidatos = [
    typeof estado === "string" ? estado : null,
    creature?.dominioAtivoId,
    lista.length === 1 ? lista[0].id : null,
  ].filter(Boolean);
  const ativo = candidatos
    .map((id) => lista.find((dominio) => dominio.id === id))
    .find((dominio) => dominio && resolveVersao(dominio, aptidoesEscolhidas));
  return ativo ?? null;
}

/** Benefícios gratuitos de Ritual da expansão que está realmente em uso. */
export function beneficiosRitualDoDominio(creature, aptidoesEscolhidas = []) {
  const combate = creature?.combate;
  if (!combate?.ativo || !combate?.dominioAtivo) return normalizaBeneficiosRitual(null);
  const ativo = dominioEmUso(creature, aptidoesEscolhidas);
  if (!ativo) return normalizaBeneficiosRitual(null);
  return normalizaBeneficiosRitual(ativo.beneficiosRitual);
}

/* ------------------------------------------------------------ */
/* TEXTO FINAL                                                   */
/* ------------------------------------------------------------ */
function linhaDoEfeito(efeito, dom, versao) {
  const cat = DOMINIO_EFEITOS[efeito?.categoria];
  if (!cat) return "";
  const nome = efeito.nome?.trim();
  if (cat.livre) {
    return `● ${cat.label}: ${nome || "Efeito Especial"}. ${efeito.descricao?.trim() || "(efeito a descrever)"}`;
  }
  const t = cat.tipos?.[efeito.tipo];
  if (!t) return "";
  const r = resolvido(efeito, dom, versao);
  return `● ${cat.label}: ${nome || t.label}. ${efeito.descricao?.trim() || r.frase}`;
}

function linhaAcertoGarantido(ag) {
  const escopo = ag.escopo?.trim();
  const alvo = escopo
    ? `Enquanto dentro do seu domínio, ${escopo} se torna garantido`
    : "Enquanto dentro do seu domínio, você escolhe antecipadamente um efeito (uma técnica, ataque ou condição) para se tornar garantido";
  return (
    `● ${escopo ? `Acerto Garantido: ${escopo}` : "Acerto Garantido"}. ${alvo}: ele é aplicado no ` +
    "início de cada turno contra todos os alvos legíveis dentro do alcance, uma vez por rodada para " +
    "cada um. Jogadas de ataque sempre acertam e Testes de Resistência sempre falham, e qualquer " +
    "condição causada por ele dura 1 rodada."
  );
}

/**
 * O texto pronto da expansão, em parágrafos. É o que o jogador lê na mesa, e o
 * formato veio da 2.5.2 sem mudança.
 */
export function textoDoDominio(dominio, { dom = 0, nd = 0, bt = 2, bar = 0, versao, paredesResistentes = false } = {}) {
  const d = normalizeDominio(dominio);
  const v = versao || d.versao;
  if (!v) return "";
  const paras = [
    `Sua expansão cria um espaço próprio que ocupa uma área esférica de ${areaDominio(v, bt)}, ` +
      `a qual dura uma quantidade de rodadas igual a ${duracaoDominio(dom, v)}.`,
  ];

  const hp = pvBarreira(bar, nd, paredesResistentes);
  if (v === "sem_barreiras") {
    paras.push(`O Totem no centro da expansão possui ${hp} pontos de vida.`);
  } else {
    paras.push(
      `A barreira (domo) do domínio possui ${hp} pontos de vida. Caso a expansão seja atacada pelo ` +
        "seu interior, ela é resistente a todos os tipos de dano. A resistência do interior de " +
        "domínios não pode ser ignorada.",
    );
  }

  // ⚠ DIFERENÇA DELIBERADA PARA A 2.5.2 (autor, 2026-07-30): lá os efeitos base
  // ficavam só num `<details>` do formulário e NÃO entravam no texto final. O
  // autor pediu que o retorno já venha com eles prontos, então eles entram aqui,
  // na frente dos escolhidos, como qualquer outro bullet.
  paras.push("Toda expansão aberta aplica os seguintes efeitos:");
  paras.push(...DOMINIO_EFEITOS_BASE.map((b) => `● ${b.titulo}. ${b.texto}`));

  const linhas = d.efeitos.map((e) => linhaDoEfeito(e, dom, v)).filter(Boolean);
  if (d.acertoGarantido?.ativo) linhas.push(linhaAcertoGarantido(d.acertoGarantido));
  if (linhas.length) {
    paras.push("Além deles, esta expansão possui:");
    paras.push(...linhas);
  }
  return paras.join("\n\n");
}

/* ------------------------------------------------------------ */
/* PONTE COM O MOTOR DE AUTOMAÇÃO                                */
/* ------------------------------------------------------------ */
/**
 * Os efeitos do domínio que caem sobre a PRÓPRIA ficha viram efeitos do Motor,
 * ligados ao estado `dominio_ativo` da bancada de Simulação de Combate. Os que
 * agem sobre criaturas hostis (todos os Ambientais) e os que não têm canal
 * (Negação de RD dos Feitiços) seguem só como texto, igual à 2.5.2.
 *
 * ⚠ Só o domínio marcado como ATIVO na ficha entra. Uma criatura pode ter várias
 * expansões escritas, e expandir é uma de cada vez.
 */
export function efeitosDoDominio(creature, { dom = 0, aptidoesEscolhidas = [] } = {}) {
  const ativo = dominioEmUso(creature, aptidoesEscolhidas);
  if (!ativo) return [];
  const versao = resolveVersao(ativo, aptidoesEscolhidas);
  if (!versao) return [];

  const out = [];
  const marca = (canal, expr, nome) => ({
    canal, expr, nome, origem: ativo.id,
    quando: "dominio_ativo", duracao: "temporaria",
  });

  const nomeBase = `${ativo.nome || "Expansão de Domínio"}: Efeito básico`;
  out.push(marca("movimentoMult", "2", nomeBase));
  out.push(marca("custoPE", "dom", nomeBase));

  for (const efeito of ativo.efeitos) {
    const r = resolvido(efeito, dom, versao);
    if (!r) continue;
    const nome = `${ativo.nome || "Expansão de Domínio"}: ${rotuloDoEfeito(efeito)}`;
    for (const m of r.motor ?? []) {
      out.push({ ...marca(m.canal, m.expr, nome), ...(m.alvo ? { alvo: m.alvo } : {}) });
    }
    // O Aumento de Atributo precisa dos dois atributos que o jogador escolheu,
    // então ele não cabe no `motor` da tabela, que é fixo.
    if (r.motorAtributo) {
      const alvos = (Array.isArray(efeito.atributos) ? efeito.atributos.filter(Boolean) : []).slice(0, 2);
      for (const alvo of alvos) out.push({ ...marca("atributo", String(r.motorAtributo), nome), alvo });
    }
  }
  return out;
}

/* ------------------------------------------------------------ */
/* VALIDADOR                                                     */
/* ------------------------------------------------------------ */
export function validarCatalogoDominios() {
  const erros = [];
  for (const [catId, cat] of Object.entries(DOMINIO_EFEITOS)) {
    if (!cat.label) erros.push(`categoria ${catId} sem label`);
    if (cat.livre) continue;
    if (!Object.keys(cat.tipos ?? {}).length) erros.push(`categoria ${catId} sem tipos`);
    for (const [tipoId, t] of Object.entries(cat.tipos ?? {})) {
      if (typeof t.resolve !== "function") { erros.push(`${catId}.${tipoId} sem resolve`); continue; }
      // As tabelas têm cinco degraus (DOM 1 a 5), e um buraco viraria NaN calado.
      for (let i = 0; i < 5; i++) {
        for (const f of [false, true]) {
          const r = t.resolve(i, f);
          if (!r?.valor || !r?.frase) erros.push(`${catId}.${tipoId} no DOM ${i + 1}${f ? " fortalecido" : ""} sem valor ou frase`);
          if (/NaN|undefined/.test(`${r?.valor}${r?.frase}`)) erros.push(`${catId}.${tipoId} no DOM ${i + 1}${f ? " fortalecido" : ""} produz NaN`);
        }
      }
    }
  }
  for (const v of DOMINIO_VERSOES) {
    if (DOMINIO_CUSTO_BASE[v.key] == null) erros.push(`versão ${v.key} sem custo base`);
  }
  return erros;
}
