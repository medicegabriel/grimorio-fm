/* ============================================================ */
/* TÉCNICAS MARCIAIS DO RESTRINGIDO                              */
/* ============================================================ */
/* O Estilo Marcial é o equivalente da técnica amaldiçoada para o Restringido
   (Livro, p. 124 e p. 247): um Fundamento Marcial, que ocupa o lugar do
   Funcionamento Básico, e as Técnicas Marciais, que ocupam o lugar dos
   Feitiços. Este módulo guarda as TABELAS do livro e o cálculo da Técnica
   Marcial de Ataque (p. 250 e 251), mais as regras de acesso e de quantidade.

   ⚠ É FOLHA, com zero imports (lista em asserts/t-ordem-modulos.mjs). O
   `afty-feiticos.js` o importa, e não o contrário. As tabelas de Condição vivem
   lá e mudam com Addon (`CONDICOES_CATALOGO`), então chegam aqui por PARÂMETRO.

   ⚠ A Técnica Marcial mora em `creature.feiticos`, com a marca `marcial`. Esta
   folha não lê ficha: recebe a lista e a resposta de "esta ficha é sem energia"
   já decididas. Ver `marcarTecnicasMarciais`. */

/** Os níveis das Técnicas Marciais. Não existe Nível 0, 5 nem Técnica Máxima. */
export const TM_NIVEIS = [1, 2, 3, 4];

export const TM_NIVEL_LABEL = {
  1: "Nível 1",
  2: "Nível 2",
  3: "Nível 3",
  4: "Nível 4",
};

/** Custo em Pontos de Estamina (p. 124 e 248). Os mesmos números do Feitiço de 1 a 4. */
export const TM_CUSTO_PE = { 1: 2, 2: 5, 3: 8, 4: 12 };

/** O nível de personagem que abre cada nível de Técnica (p. 124: 1, 5, 9 e 15). */
export const TM_ACESSO = { 1: 1, 2: 5, 3: 9, 4: 15 };

/* ---------------------------------------------------------------
   TABELAS DA TÉCNICA MARCIAL DE ATAQUE (p. 250 e 251), verbatim.
   --------------------------------------------------------------- */
/** Número de Ataques da Técnica em Ação Comum. */
export const TM_ATAQUES = { 1: 1, 2: 2, 3: 3, 4: 4 };
/** Bônus em Acerto, aplicado em todos os ataques. */
export const TM_ACERTO = { 1: 1, 2: 2, 3: 3, 4: 4 };
/** Dano Adicional, somado em todos os ataques. */
export const TM_DANO = { 1: 4, 2: 8, 3: 12, 4: 16 };
/** Redução de Dano ignorada em todos os ataques. */
export const TM_RD = { 1: 8, 2: 12, 3: 16, 4: 20 };
/** Cada ataque reduzido, sem reduzir a ação, soma +2 no acerto. */
export const TM_ACERTO_POR_REDUCAO = 2;
/** Cada ataque reduzido, sem reduzir a ação, soma +3 na RD ignorada. */
export const TM_RD_POR_REDUCAO = 3;

/** As forças de Condição, da mais fraca para a mais forte. O índice é o número de acertos menos 1. */
export const TM_FORCAS = ["fraca", "media", "forte", "extrema"];

export const TM_FORCA_LABEL = {
  fraca: "Fraca",
  media: "Média",
  forte: "Forte",
  extrema: "Extrema",
};

export const TM_ACOES = [
  { value: "comum", label: "Ação Comum" },
  { value: "completa", label: "Ação Completa" },
  { value: "bonus", label: "Ação Bônus" },
];

export const TM_ACAO_LABEL = Object.fromEntries(TM_ACOES.map((a) => [a.value, a.label]));

/** Os Efeitos Adicionais da Técnica de Ataque. A ordem é a do livro. */
export const TM_EFEITOS_ATAQUE = [
  { value: "acerto", label: "Bônus de Acerto" },
  { value: "dano", label: "Dano Adicional" },
  { value: "rd", label: "Ignorar Redução de Dano" },
  { value: "condicao", label: "Aplicar Condições" },
];

/** O tipo de uma Técnica Marcial, na ordem em que os chips aparecem. */
export const TIPOS_TECNICA_MARCIAL = [
  { value: "ataque", label: "Ataque" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "curativo", label: "Curativo" },
  { value: "passivo", label: "Passiva" },
  { value: "personalizado", label: "Personalizado" },
];

export const TIPO_TECNICA_MARCIAL_LABEL = Object.fromEntries(TIPOS_TECNICA_MARCIAL.map((t) => [t.value, t.label]));

/** Os efeitos do guia de Auxiliares que a Técnica Marcial NÃO usa (p. 249). */
export const TM_AUX_VETADOS = Object.freeze(["atributo", "alcanceCaC"]);

/** As categorias da Passiva que a Técnica Marcial NÃO usa (p. 249: sem Aumento de Atributo). */
export const TM_PASSIVO_VETADAS = Object.freeze(["atributo"]);

/* ---------------------------------------------------------------
   MARCA E LEITURA PADRÃO
   --------------------------------------------------------------- */
/**
 * Marca cada item da lista de Feitiços como Técnica Marcial, SEM gravar nada.
 *
 * `padraoMarcial` é a resposta do derive para "esta ficha não tem energia
 * amaldiçoada e não é Sem Técnica", ou "a origem é Restringido". Um item que já
 * tem a marca (`true` ou `false`) fica como está. Um item sem a marca assume o
 * padrão da ficha, e é isso que migra, na leitura, os Feitiços que o Addon
 * Estilo Marcial criou no Restringido.
 *
 * ⚠ A VARIAÇÃO FICA DE FORA. Quem tem `variacaoDe` é o mesmo Feitiço declarado
 * de outro jeito (a Liberação Máxima e a Passiva recebida de fora), e herda o
 * que o original é.
 *
 * Devolve a MESMA lista quando nada muda, para quem compara por referência.
 */
export function marcarTecnicasMarciais(feiticos, padraoMarcial) {
  if (!Array.isArray(feiticos)) return feiticos;
  let mudou = false;
  const marcados = feiticos.map((f) => {
    if (!f || typeof f !== "object") return f;
    if (typeof f.marcial === "boolean") return f;
    if (f.variacaoDe) return f;
    if (!padraoMarcial) return f;
    mudou = true;
    return { ...f, marcial: true };
  });
  return mudou ? marcados : feiticos;
}

/**
 * Os chips de tipo de UMA Técnica: os permitidos, na ordem do livro, mais o tipo
 * que a linha JÁ TEM no fim, mesmo proibido (um Dano ou Especial que veio de um
 * Feitiço migrado). Sem ele o chip aceso sumiria e o editor mostraria um tipo
 * sem nada dizendo que ele é um.
 */
export function tiposDaLinhaMarcial(permitidos, tipoAtual) {
  const ordem = TIPOS_TECNICA_MARCIAL.map((t) => t.value);
  const base = Array.isArray(permitidos) ? permitidos : ordem;
  const lista = ordem.filter((t) => base.includes(t));
  return tipoAtual && !lista.includes(tipoAtual) ? [...lista, tipoAtual] : lista;
}

/** A Técnica Marcial marcada. Lê só a marca, que o derive já normalizou. */
export const ehTecnicaMarcial = (f) => f?.marcial === true;

/* ---------------------------------------------------------------
   ACESSO E QUANTIDADE
   --------------------------------------------------------------- */
/**
 * O maior nível de Técnica Marcial que o personagem alcança (p. 124: o 1 no
 * início, o 2 no nível 5, o 3 no 9 e o 4 no 15), aparado por um teto da origem.
 * O Não-Feiticeiro, por exemplo, só chega ao Nível 2.
 */
export function nivelMaxTecnicaMarcial(nd, teto = null) {
  const n = Math.max(1, Math.trunc(Number(nd) || 1));
  const alcancado = TM_NIVEIS.reduce((maior, nivel) => (n >= TM_ACESSO[nivel] ? nivel : maior), 1);
  const limite = teto == null ? null : Math.max(1, Math.trunc(Number(teto) || 1));
  return limite == null ? alcancado : Math.min(limite, alcancado);
}

/**
 * Quantas Técnicas Marciais o PERSONAGEM tem (p. 124 e 248): 2 no início e mais
 * uma nos níveis ímpares de 3 em diante. O livro lista até o 19, e a decisão do
 * autor (2026-10-26) é continuar nos ímpares depois dele, sem teto, como já
 * acontece com o Novo Estilo das Sombras.
 *
 * Devolve `{ total, partes }`, e as partes são o hover de fontes.
 */
export function tecnicasMarciaisDoJogador(nivel) {
  const n = Math.max(1, Math.trunc(Number(nivel) || 1));
  const impares = n >= 3 ? Math.floor((n - 1) / 2) : 0;
  const partes = [
    { label: "Inicial", valor: 2 },
    ...(impares > 0 ? [{ label: "Níveis Ímpares", valor: impares }] : []),
  ];
  return { total: partes.reduce((s, p) => s + p.valor, 0), partes };
}

/* ---------------------------------------------------------------
   A TÉCNICA MARCIAL DE ATAQUE
   --------------------------------------------------------------- */
const inteiro = (v, min, max) => Math.min(max, Math.max(min, Math.trunc(Number(v) || 0)));

/** Os níveis de uma Técnica, com o valor gravado mantido quando fora de 1 a 4 (aviso na tela). */
export const niveisDaTecnicaMarcial = (nivelAtual) => (
  TM_NIVEIS.includes(nivelAtual) || nivelAtual == null ? TM_NIVEIS : [nivelAtual, ...TM_NIVEIS]
);

/**
 * O número de ataques que a Ação dá (p. 250): Comum é o nível, Completa soma 1 e
 * Bônus reduz à metade, arredondada para baixo. A de Nível 1 não pode ser Bônus.
 * Devolve 0 quando a combinação não existe.
 */
export function ataquesNaAcao(nivel, acao) {
  const base = TM_ATAQUES[nivel] ?? 0;
  if (acao === "completa") return base > 0 ? base + 1 : 0;
  if (acao === "bonus") return nivel > 1 ? Math.floor(base / 2) : 0;
  return base;
}

/** As ações que o nível aceita. A de Nível 1 não tem Bônus. */
export const acoesDaTecnicaAtaque = (nivel) => TM_ACOES.map((a) => ({
  ...a,
  indisponivel: ataquesNaAcao(nivel, a.value) < 1,
}));

/**
 * Os Efeitos Adicionais que o nível ainda comporta, dado o que já foi escolhido.
 * Cada efeito depois do primeiro baixa TODOS os efeitos um nível (autor,
 * 2026-10-26), então o Nível N aceita no máximo N efeitos.
 */
export function efeitosAtaqueDisponiveis(nivel, escolhidos = []) {
  const lista = Array.isArray(escolhidos) ? escolhidos : [];
  const cheio = lista.length >= (TM_ATAQUES[nivel] ?? 0);
  return TM_EFEITOS_ATAQUE.map((e) => ({
    ...e,
    escolhido: lista.includes(e.value),
    indisponivel: !lista.includes(e.value) && cheio,
  }));
}

/** Os efeitos gravados, na ordem do livro, sem repetição e sem id desconhecido. */
export function efeitosAtaqueNormalizados(escolhidos) {
  const lista = Array.isArray(escolhidos) ? escolhidos : [];
  return TM_EFEITOS_ATAQUE.map((e) => e.value).filter((id) => lista.includes(id));
}

/** A força máxima de Condição que o nível de efeito permite (p. 251). */
export const forcaMaximaDaCondicao = (nivelEfeito) => TM_FORCAS[inteiro(nivelEfeito, 1, 4) - 1];

/**
 * A força da Condição para um número de ACERTOS (p. 251): um acerto vale Fraca,
 * dois Média, três Forte e quatro Extrema, e cada ataque reduzido tira um acerto
 * da conta. A Ação Completa não sobe o teto, que é o do nível dos efeitos.
 */
export function forcaPorAcertos(acertos, reducoes, nivelEfeito) {
  const indiceMaximo = inteiro(nivelEfeito, 1, 4) - 1;
  const indice = Math.min(indiceMaximo, Math.max(0, acertos + reducoes - 1));
  return TM_FORCAS[indice];
}

/**
 * Calcula a Técnica Marcial de Ataque.
 *
 * `ctx`:
 *   - `cdBase`      a CD da Técnica (a de Feitiçaria da ficha);
 *   - `duracoes`    `CONDICAO_DURACAO` do afty-feiticos.js, por nível e força;
 *   - `condicoes`   `CONDICOES_CATALOGO`, para conferir o nome de cada Condição;
 *   - `acessoNivel` o maior nível que a ficha alcança (aviso, nunca trava).
 *
 * ⚠ NUNCA APAGA O QUE A PESSOA GRAVOU. Efeito demais, nível fora de 1 a 4 e
 * ação que não existe viram AVISO e o cálculo segue com o valor corrigido, que
 * é o mesmo caminho do aviso de "acima do acesso" dos Feitiços.
 */
export function calcularTecnicaAtaqueBase(f, ctx = {}) {
  const avisos = [];
  const nivelBruto = Math.trunc(Number(f?.nivel) || 0);
  const nivel = inteiro(nivelBruto, 1, 4);
  if (nivelBruto !== nivel) avisos.push("Técnicas Marciais vão do Nível 1 ao 4.");
  if (ctx.acessoNivel != null && nivel > ctx.acessoNivel) {
    avisos.push(`Acima do acesso: o nível máximo alcançado é ${ctx.acessoNivel}.`);
  }

  let acao = TM_ACAO_LABEL[f?.acaoAtaque] ? f.acaoAtaque : "comum";
  if (acao === "bonus" && nivel === 1) {
    avisos.push("A Técnica de Nível 1 não pode ser Ação Bônus.");
    acao = "comum";
  }
  const naAcao = ataquesNaAcao(nivel, acao);
  const reducoes = inteiro(f?.ataquesReduzidos, 0, Math.max(0, naAcao - 1));
  const ataques = naAcao - reducoes;

  const pedidos = efeitosAtaqueNormalizados(f?.efeitosAtaque);
  const efeitos = pedidos.slice(0, nivel);
  if (pedidos.length > efeitos.length) {
    avisos.push(`A Técnica de Nível ${nivel} aceita até ${nivel} Efeito${nivel === 1 ? "" : "s"} Adicional${nivel === 1 ? "" : "is"}.`);
  }
  const nivelEfeito = efeitos.length ? nivel - (efeitos.length - 1) : null;

  const tem = (id) => efeitos.includes(id);
  const acerto = tem("acerto") ? TM_ACERTO[nivelEfeito] + TM_ACERTO_POR_REDUCAO * reducoes : 0;
  const dano = tem("dano") ? TM_DANO[nivelEfeito] * (1 + reducoes) : 0;
  const rd = tem("rd") ? TM_RD[nivelEfeito] + TM_RD_POR_REDUCAO * reducoes : 0;
  /* As parcelas do hover: o valor da tabela no nível dos efeitos e, à parte, o
     que os ataques reduzidos somaram. `final` é o número que a linha mostra. */
  const partesDe = (id, tabela, final) => {
    if (!tem(id)) return [];
    const base = tabela[nivelEfeito];
    return [
      { label: `Nível ${nivelEfeito}`, valor: base },
      ...(final > base ? [{ label: "Ataques Reduzidos", valor: final - base }] : []),
    ];
  };

  // A Condição: uma escolhida por força, até a máxima que o nível de efeito permite.
  let condicao = null;
  if (tem("condicao")) {
    const forcaMax = forcaMaximaDaCondicao(nivelEfeito);
    const indiceMax = TM_FORCAS.indexOf(forcaMax);
    const escolhidas = f?.condicoesAtaque && typeof f.condicoesAtaque === "object" ? f.condicoesAtaque : {};
    const nomeDe = (forca) => String(escolhidas[forca] ?? "").trim();
    const faltando = TM_FORCAS.slice(0, indiceMax + 1).filter((forca) => !nomeDe(forca));
    for (const forca of faltando) avisos.push(`Falta a Condição ${TM_FORCA_LABEL[forca]}.`);
    for (const forca of TM_FORCAS.slice(0, indiceMax + 1)) {
      const nome = nomeDe(forca);
      if (nome && Array.isArray(ctx.condicoes?.[forca]) && !ctx.condicoes[forca].includes(nome)) {
        avisos.push(`${nome} não é uma Condição ${TM_FORCA_LABEL[forca]}.`);
      }
    }
    if (!f?.trCondicaoAtaque) avisos.push("Escolha o Teste de Resistência do alvo.");
    const escada = [];
    for (let acertos = 1; acertos <= ataques; acertos += 1) {
      const forca = forcaPorAcertos(acertos, reducoes, nivelEfeito);
      const rodadas = ctx.duracoes?.[nivel]?.[forca] ?? null;
      escada.push({ acertos, forca, nome: nomeDe(forca) || null, rodadas });
    }
    condicao = {
      forcaMax,
      tr: f?.trCondicaoAtaque || null,
      cd: ctx.cdBase ?? null,
      escolhidas: Object.fromEntries(TM_FORCAS.slice(0, indiceMax + 1).map((forca) => [forca, nomeDe(forca) || null])),
      escada,
    };
  }

  const custoPE = TM_CUSTO_PE[nivel];
  return {
    tipo: "ataque",
    nivel,
    acao,
    acaoRotulo: TM_ACAO_LABEL[acao],
    ataquesNaAcao: naAcao,
    ataquesReduzidos: reducoes,
    ataques,
    efeitos,
    nivelEfeito,
    bonusAcerto: acerto,
    danoAdicional: dano,
    rdIgnorada: rd,
    partesAcerto: partesDe("acerto", TM_ACERTO, acerto),
    partesDano: partesDe("dano", TM_DANO, dano),
    partesRd: partesDe("rd", TM_RD, rd),
    condicao,
    usosPorRodada: 1,
    // Os nomes que a linha da Ficha e as propriedades já leem de qualquer Feitiço.
    cd: condicao ? (ctx.cdBase ?? null) : null,
    ignoraRD: rd,
    acertoDelta: acerto,
    custoPE,
    custoPEBase: custoPE,
    custoPETexto: null,
    reducoesCustoPE: [],
    avisos,
  };
}

/**
 * O maior dado de uma pilha de grupos de dano, ou 6 quando não há dado nenhum. É o
 * dado que a Amplificadora usa na linha da arma ("dados de dano a mais").
 */
export function maiorDadoDosGrupos(grupos) {
  const faces = (Array.isArray(grupos) ? grupos : [])
    .filter((g) => Number(g?.dados) > 0)
    .map((g) => Math.trunc(Number(g.faces) || 0))
    .filter((f) => f >= 2);
  return faces.length ? Math.max(...faces) : 6;
}

/**
 * Os dados APÓS ATAQUE do PRIMEIRO ataque (Elementalista e Amplificadora): "com
 * vários ataques, só no primeiro", e nenhum dobra no crítico. `elementalista` é a
 * lista `{ nome, dados, faces }` que o derive tirou do canal `dadosNomeados`, e a
 * Amplificadora vem como a quantidade de dados (metade do Bônus de Treinamento)
 * no `faces` da linha onde ela cai.
 */
export function gruposDoPrimeiroAtaque({ elementalista = [], amplificadoraDados = 0, faces = 6 } = {}) {
  const grupos = (Array.isArray(elementalista) ? elementalista : [])
    .filter((g) => Number(g?.dados) > 0)
    .map((g) => ({ nome: g.nome, dados: Math.trunc(Number(g.dados)), faces: g.faces, fixo: 0 }));
  if (amplificadoraDados > 0) grupos.push({ nome: "Amplificadora", dados: amplificadoraDados, faces, fixo: 0 });
  return grupos;
}

/**
 * O texto de uma linha da escada de Condição, para a Ficha e o criador:
 * "2 Acertos: Amedrontado (Média, 1 rodada)".
 */
export function textoDaEscada(degrau) {
  if (!degrau) return "";
  const acertos = `${degrau.acertos} Acerto${degrau.acertos === 1 ? "" : "s"}`;
  const nome = degrau.nome || "Sem Condição";
  const rodadas = typeof degrau.rodadas === "number"
    ? `${degrau.rodadas} rodada${degrau.rodadas === 1 ? "" : "s"}`
    : degrau.rodadas === "cena" ? "cena" : null;
  const detalhe = [TM_FORCA_LABEL[degrau.forca], rodadas].filter(Boolean).join(", ");
  return `${acertos}: ${nome}${detalhe ? ` (${detalhe})` : ""}`;
}

/**
 * Uma linha de arma da Ficha, com os bônus da Técnica de Ataque somados.
 *
 * ⚠ NÃO MONTA FÓRMULA. A linha chega crua (o `dano.entradas` do derive, antes
 * do `comFormulasDeDano`) e volta crua, com o acerto, o grupo de Dano Adicional
 * e a RD ignorada já dentro, e o derive passa a linha pela função de fórmula
 * que o resto do Dano usa. Assim o hover, o crítico e o Raio Negro funcionam
 * sem uma cópia da conta aqui.
 *
 * `extras` são os dados de "Após Ataque" do primeiro ataque (Elementalista e
 * Amplificadora), já no formato de grupo de dano.
 */
export function linhaDeArmaDaTecnica(entrada, calc, { id, nome, extras = [] } = {}) {
  if (!entrada || !calc) return null;
  const idLinha = `tm:${id}:${entrada.id}`;
  const grupos = Array.isArray(entrada.gruposDano) ? [...entrada.gruposDano] : [];
  const partesAcerto = Array.isArray(entrada.partesAcerto) ? [...entrada.partesAcerto] : [];
  const rotulo = nome || "Técnica Marcial";
  const base = {
    ...entrada,
    id: idLinha,
    linhaDeOrigem: entrada.id,
    tecnicaId: id,
    chaveArma: entrada.chaveArma ?? entrada.id,
  };
  if (calc.bonusAcerto > 0 && entrada.acerto != null) {
    base.acerto = entrada.acerto + calc.bonusAcerto;
    base.partesAcerto = [...partesAcerto, { label: rotulo, valor: calc.bonusAcerto }];
    // Com dado somado à jogada (Manobra de Ajuste) a linha mostra a rolagem inteira.
    if (entrada.acertoTexto && Array.isArray(entrada.acertoDados) && entrada.acertoDados.length) {
      const dados = entrada.acertoDados.map((d) => `${d.qtd}d${d.faces}`).join(" + ");
      base.acertoTexto = `${base.acerto >= 0 ? "+" : "−"}${Math.abs(base.acerto)} + ${dados}`;
    }
  }
  /* O Dano Adicional é FIXO, então não dobra no crítico nem entra no Raio Negro
     (autor: "o Dano Fixo não é Critável"). No PERSONAGEM o hover lista o grupo
     pelo nome da Técnica. Na CRIATURA o número nasce ao contrário (o dano TOTAL é a
     soma das parcelas, e o fixo sai dele), então a Técnica entra como parcela do
     total, o total e o fixo da linha sobem juntos, e o grupo leva `naPartes` para
     o hover não listar a mesma coisa duas vezes. */
  if (calc.danoAdicional > 0) {
    const naCriatura = Array.isArray(entrada.partes) && entrada.partes.some((p) => p.categoria === "total");
    grupos.push({
      nome: rotulo, dados: 0, faces: 6, fixo: calc.danoAdicional, momento: "durante", multiplica: false,
      ...(naCriatura ? { naPartes: true } : {}),
    });
    if (naCriatura) {
      base.total = (Number(entrada.total) || 0) + calc.danoAdicional;
      base.fixo = (Number(entrada.fixo) || 0) + calc.danoAdicional;
      base.partes = [...entrada.partes, { label: rotulo, valor: calc.danoAdicional, categoria: "total" }];
    }
  }
  for (const extra of extras) {
    grupos.push({ ...extra, momento: "apos", multiplica: false });
  }
  base.gruposDano = grupos;
  if (calc.rdIgnorada > 0) base.ignoraRD = (Number(entrada.ignoraRD) || 0) + calc.rdIgnorada;
  return base;
}
