/**
 * ============================================================
 * INVOCAÇÕES — GRIMÓRIO AFTY (motor, Fatia 1: esqueleto)
 * ============================================================
 * Regras VERBATIM em docs/afty-invocacoes.md (fonte da verdade dos números).
 * Conteúdo é DADO: as tabelas por grau ficam aqui como constantes, os
 * resolvers são puros e o builder só exibe (padrão de Aptidões/Habilidades).
 *
 * A invocação NÃO é isolada: PV, Defesa e Bônus de Teste dela leem valores do
 * DONO. Decisões do autor (2026-07-17, ver o doc):
 *   - "Nível do Usuário" nas fórmulas de PV/Defesa = o ND do dono. PV usa o ND,
 *     Defesa usa maestria(ND) (o Bônus de Treinamento).
 *   - O Bônus de Teste usa Metade do Nível de Controlador (o lado da multiclasse).
 *   - O acesso a graus é travado pelo Nível de Controlador, não pelo ND.
 *   - Os TIPOS são cinco desde 2026-09-30 (Mecânicas para Invocações 2.5.2):
 *     Shikigami ("Invocação"), Shikigami de Técnica, Maldição Domada, Marionete
 *     e Corpo Amaldiçoado. As regras de cada um são DADO, em
 *     afty-invocacoes-tipos.js, e quem as lê passa por `regrasDoTipo`. O antigo
 *     "dispositivo" segue lido como Shikigami por `tipoMecanicoDaInvocacao`.
 *
 * DSL: esta camada monta um contexto de variáveis próprio (buildInvocacaoDslContext)
 * e delega ao evalNumber/evalBoolean de fm-dsl.js, que são agnósticos de variável.
 * NENHUMA edição em src/components/. Namespace próprio da invocação: as vars da
 * INVOCAÇÃO usam nomes diretos (forca, mod_destreza, pv_max, grau...) e as do DONO
 * entram como nd, bt, nivel_controlador.
 *
 * FATIA 1 (este arquivo, esqueleto): tipos, graus, atributos, PV/Defesa,
 * Deslocamento, custo, orçamento de ações/características, contexto de DSL e
 * validador. FATIA 2: Ações e Características com dano/cura/alcance/área/RD pelas
 * tabelas + Ações com Custo. FATIA 3: matemática de Horda.
 * ============================================================
 */

import { evalNumber, CHAVE_FONTES, normalizarMarca } from "./afty-dsl";
import { AFTY_ATTRS, AFTY_TAMANHOS, AFTY_RESISTENCIAS, funcionamentosDaFicha } from "./afty-schema";
import {
  AFTY_PERICIAS, bonusProficiencia, usoPericias, ehPericiaOficio, periciasParaInvocacao,
} from "./afty-pericias";
import { TIPOS_DANO, ARMAS } from "./afty-equipamentos";
import {
  TIPOS_INVOCACAO_ORDEM, regrasDoTipoValor, validarRegrasPorTipo, estadoDaLinha,
  FONTE_PV_MECHA, entradaDeMesaDaHorda,
} from "./afty-invocacoes-tipos";
// Moram na folha porque a sessão de mesa também os lê (2026-10-01, Etapa 9).
export { FONTE_PV_MECHA, entradaDeMesaDaHorda };
import {
  CARACTERISTICAS_INVOCACAO, caracteristicaDoCatalogo, valorPorGrau, validarCatalogoCaracteristicasInvocacao,
} from "./afty-invocacoes-caracteristicas";

export const mod = (attr) => Math.floor(((attr ?? 10) - 10) / 2);

/**
 * ============================================================
 * PARCELAS DE UM NÚMERO — o que o hover da Ficha mostra
 * ============================================================
 * ⚠ ESCRITAS AQUI, e não na aba. Todo número derivado do Afty mostra as fontes
 * dele no hover (ver `afty-fontes-visiveis-ui`), e os da Invocação eram os
 * únicos que não: a aba passava `valor` e `total` ao `NumeroComFontes` e nunca
 * um `partes`, então a lista saía vazia e o painel não abria. Da tela, isso é
 * exatamente *"quando eu passo o mouse em cima, não aparece os valores"*.
 *
 * Ficam no resolvedor porque a conta é daqui: montar as parcelas na aba seria a
 * mesma fórmula escrita duas vezes, e a segunda cópia envelhece na primeira
 * errata. O formato é o do painel: `{ label, valor }`, ou `{ label, texto }`
 * quando a parcela não é um número que soma.
 */
const rotuloAttrInv = (k) => AFTY_ATTRS.find((a) => a.key === k)?.label ?? k;

/** As parcelas nomeadas de um ou mais canais de efeito, na ordem em que entraram.

    ⚠ SÓ AS SEM ALVO. Um efeito com alvo (+2 em Fortitude, RD contra Queimante)
    vale para UM destino, e a parcela dele não pode aparecer no hover dos outros:
    quem as lê é `parcelasDoAlvo`. */
const parcelasDoCanal = (detalhes, ...canais) =>
  (detalhes || [])
    .filter((d) => canais.includes(d.canal) && !d.alvo)
    .map((d) => ({ label: d.nome, valor: d.valor }));

/** As parcelas de um canal com alvo, só as daquele destino. */
const parcelasDoAlvo = (detalhes, canal, alvo) =>
  (detalhes || [])
    .filter((d) => d.canal === canal && d.alvo === alvo)
    .map((d) => ({ label: d.nome, valor: d.valor }));

/** A parcela de proficiência de um teste. Sem faixa, não existe parcela.
    `fonte` nomeia quem concedeu a faixa, quando não foi a própria ficha. */
const parcelaProficiencia = (bt, prof, fonte = null) => {
  if (!prof) return [];
  const faixa = prof === "mestre" ? "Maestria (Mestre)" : "Maestria";
  return [{ label: fonte ? `${faixa} · ${fonte}` : faixa, valor: bonusProficiencia(bt, prof) }];
};

/**
 * Tipos de dano que uma RD de Invocação pode cobrir. Os quatro primeiros são o
 * `TIPOS_DANO` das armas (afty-equipamentos.js), que é a única lista de tipos
 * catalogada do Afty. "Outro" abre um campo livre de propósito: o livro deixa o
 * tipo aberto ("qualquer tipo exceto Energia Reversa e Dano na Alma") e o resto
 * da lista nunca foi transcrito. Fechar a lista aqui esconderia tipo que existe.
 */
export const INV_RD_TIPOS = [
  ...Object.entries(TIPOS_DANO).map(([value, label]) => ({ value, label })),
  { value: "outro", label: "Outro" },
];

/** Rótulo do tipo de dano de uma RD, com o texto livre quando for "outro". */
export function rdTipoLabel(tipo, outro = "") {
  if (tipo === "outro") return (outro || "").trim() || "Outro";
  return TIPOS_DANO[tipo] ?? "";
}

/** Chave de comparação de tipo de RD (é o que decide se duas RDs colidem). */
const rdTipoChave = (tipo, outro = "") =>
  tipo === "outro"
    ? `outro:${String(outro || "").trim().toLowerCase()}`
    : String(tipo || "");

const TAMANHO_ORDEM = AFTY_TAMANHOS.map((t) => t.value);

/** Testes de Resistência que uma Invocação pode treinar / um ataque pode exigir:
 *  todos menos Integridade (regra do capítulo de Invocações). */
export const resistenciasTreinaveis = () => AFTY_RESISTENCIAS.filter((r) => r.value !== "integridade");

export const INV_ATTR_KEYS = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"];

/**
 * Os tipos mecânicos (2026-09-30): Invocação (o Shikigami), Invocação de Técnica,
 * Maldição, Marionete e Corpo Amaldiçoado. As regras de cada um estão em
 * `REGRAS_POR_TIPO` (afty-invocacoes-tipos.js).
 *
 * ⚠ INVOCAÇÃO DE TÉCNICA é um tipo à parte, e não um rótulo: ele muda números
 * (base de atributo, PV, bônus, orçamento) e a economia de ação. O capítulo já o
 * tratava como categoria, na limitação de Características sobre imunidade a tipo
 * de dano, e a seção de Intermediários diz que "certas técnicas inatas permitem
 * que a necessidade de Talismãs seja ignorada... como é o caso da Dez Sombras".
 * Por isso ele é o único sem Intermediário, e o único que não ocupa espaço de
 * inventário.
 */
/* ⚠ RÓTULO ≠ `value`. O autor renomeou os dois primeiros para "Invocação" e
   "Invocação de Técnica" em 2026-09-02, e os `value` seguem `shikigami` e
   `tecnica`: eles estão gravados em toda ficha salva, viram variável de DSL e são
   citados por `quando` de habilidade. Trocar o value seria migração de dado.

   ⚠ A LISTA SAI DA TABELA DE REGRAS desde 2026-09-30. Antes ela era escrita à
   mão aqui, com o Intermediário e a retirada de cada tipo, e a Maldição tinha o
   Talismã e a dissipação de uma invocação comum. O Mecânicas tirou as duas coisas
   dela, e a fonte de cada campo passou a ser `REGRAS_POR_TIPO`. */
export const AFTY_INV_TIPOS = TIPOS_INVOCACAO_ORDEM.map((value) => {
  const r = regrasDoTipoValor(value);
  return { value, label: r.label, curto: r.curto, intermediario: r.intermediario, retirada: r.retirada };
});

/**
 * ⚠ O TIPO GRAVADO NA FICHA PODE NÃO EXISTIR MAIS. "dispositivo" foi um terceiro
 * tipo até 2026-09-02, quando o autor tirou ("não existe Dispositivo, não muda
 * nada saber qual tipo da invocação"). Ficha salva antes disso ainda traz o
 * valor, e sem este normalizador os chips de Tipo apareceriam TODOS apagados,
 * sem nenhum selecionado e sem nada dizendo por quê.
 *
 * Ele cai em "shikigami", que é o tipo com Intermediário, que é o que o
 * Dispositivo era. Ninguém migra a ficha: ela conserta sozinha no primeiro
 * salvamento, e continua legível até lá.
 */
export const tipoMecanicoDaInvocacao = (inv) =>
  (TIPO_BY_VALUE[inv?.tipoMecanico] ? inv.tipoMecanico : "shikigami");

/** Este é um Shikigami de Técnica? É a chave de quase toda regra própria dele.
    Lê o tipo NORMALIZADO, como todo leitor de tipo deste arquivo. */
export const ehShikigamiDeTecnica = (inv) => tipoMecanicoDaInvocacao(inv) === "tecnica";

/**
 * As regras do tipo desta invocação, com a herança do subtipo resolvida. Todo
 * leitor de regra por tipo passa por aqui, e nunca por um `if` no valor cru.
 */
export const regrasDoTipo = (inv) => regrasDoTipoValor(tipoMecanicoDaInvocacao(inv));

/** A ficha ainda traz o tipo "dispositivo", que saiu em 2026-09-02. Ela é lida
    como Shikigami, e nada a converte sozinho: a Marionete e o Corpo voltaram como
    tipos próprios, e escolher entre eles é do dono da ficha. */
export const tipoLegadoDispositivo = (inv) => inv?.tipoMecanico === "dispositivo";

/* ⚠ `AFTY_INV_SABORES` (Corpo Amaldiçoado e Marionete) SAIU JUNTO. Ele só
   existia para dar dois rótulos ao Dispositivo, e sem o Dispositivo não sobra
   nada para ele rotular. O campo `saborNarrativo` de fichas antigas fica onde
   está, morto e inofensivo: apagá-lo pediria migração de dado. */
const TIPO_BY_VALUE = Object.fromEntries(AFTY_INV_TIPOS.map((t) => [t.value, t]));

/** Metadados do tipo mecânico (rótulo, Intermediário, regra de retirada). */
export const tipoInvocacaoMeta = (tipo) => TIPO_BY_VALUE[tipo] || AFTY_INV_TIPOS[0];

/** O nome que a ficha mostra para o tipo. */
export function tipoInvocacaoLabel(inv) {
  return tipoInvocacaoMeta(tipoMecanicoDaInvocacao(inv)).label;
}

/**
 * Espaços de inventário que os Intermediários ocupam.
 *
 * ⚠ "Todo Intermediário ocupa meio espaço no inventário de um personagem"
 * (capítulo de Invocações). O número é CALCULADO e ainda NÃO entra no
 * `resolveCarga`: ligar isso mexe em Defesa e Movimento de toda ficha que já
 * existe, e a decisão é do autor. Ver docs/a-fazer.md.
 *
 * ⚠ O SHIKIGAMI DE TÉCNICA não conta: ele não tem Intermediário, porque a
 * técnica inata dispensa o Talismã ("substituindo-a apenas por movimentos ou
 * sinais de mão, como é o caso da Dez Sombras"). A Maldição também não, desde
 * 2026-09-30 (Mecânicas: sem Talismã, "sempre caminhará ao lado").
 */
export const espacosDeIntermediario = (lista) =>
  (Array.isArray(lista) ? lista : [])
    .filter((inv) => regrasDoTipo(inv).intermediario != null)
    .length * 0.5;

/**
 * Graus. `rank` cresce com o poder (1 = mais fraco), `num` é o número do livro
 * ("Grau 2" = Segundo, usado na Horda). `custoBase` é o custo em PE para invocar.
 * A ordem do array é da mais fraca para a mais forte (ordem de exibição).
 */
export const AFTY_INV_GRAUS = [
  { value: "quarto",   label: "Quarto Grau",   rank: 1, num: 4, custoBase: 2 },
  { value: "terceiro", label: "Terceiro Grau", rank: 2, num: 3, custoBase: 4 },
  { value: "segundo",  label: "Segundo Grau",  rank: 3, num: 2, custoBase: 6 },
  { value: "primeiro", label: "Primeiro Grau", rank: 4, num: 1, custoBase: 8 },
  { value: "especial", label: "Grau Especial", rank: 5, num: 0, custoBase: 12 },
];

const GRAU_BY_VALUE = Object.fromEntries(AFTY_INV_GRAUS.map((g) => [g.value, g]));
export const grauMeta = (grau) => GRAU_BY_VALUE[grau] || AFTY_INV_GRAUS[0];

/**
 * Atributos: base 8, point-buy LINEAR (cada +1 custa 1 ponto, reduzir até 6
 * devolve 1:1). `pontos` = orçamento, `max` = teto por atributo.
 */
export const INV_ATRIBUTOS_POR_GRAU = {
  quarto:   { pontos: 10, max: 16 },
  terceiro: { pontos: 15, max: 20 },
  segundo:  { pontos: 20, max: 24 },
  primeiro: { pontos: 30, max: 26 },
  especial: { pontos: 40, max: 30 },
};
export const INV_ATTR_MIN = 6; // pode reduzir de 8 até 6, devolvendo pontos.

/**
 * Base e piso de atributo. O Shikigami de Técnica começa em 10 e reduz só até 8
 * (autor, 2026-08-16): a base sobe e o piso acompanha, então a margem de
 * redução continua sendo de 2 pontos, como em toda outra invocação.
 */
export const INV_ATTR_BASE = 8;
export const INV_ATTR_BASE_TECNICA = 10;
export const atributoBaseInvocacao = (inv) => regrasDoTipo(inv).atributoBase;
export const atributoMinInvocacao = (inv) => regrasDoTipo(inv).atributoMin;

/** Quantidade base de Ações/Características por grau (some com adicionais). */
export const INV_ACOES_CARACT_BASE = {
  quarto: 2, terceiro: 2, segundo: 3, primeiro: 3, especial: 4,
};

/** Perícias treinadas adicionais por grau (além do ganho por INT/SAB). */
export const INV_PERICIAS_ADICIONAIS = {
  quarto: 1, terceiro: 1, segundo: 2, primeiro: 2, especial: 3,
};

/** Limite de Ações com Custo por grau (usado na Fatia 2). */
export const INV_ACOES_COM_CUSTO_MAX = {
  quarto: 1, terceiro: 1, segundo: 2, primeiro: 2, especial: 3,
};

/** Deslocamento padrão de caminhada (metros), antes de características. */
export const INV_DESLOCAMENTO_PADRAO = 9;

// ------------------------------------------------------------
// Acesso a graus pelo Nível de Controlador (tabela CLASSIFICAÇÃO)
// ------------------------------------------------------------
// Nível 1-4: Quarto. 5-8: +Terceiro. 9-12: +Segundo. 13-16: +Primeiro.
// 17+: +Especial. Quem não é Controlador (nível 0) cria via Interlúdio, com o
// grau definido lá, então não é travado por esta tabela: liberamos todos.
export function grausDisponiveis(nivelControlador = 0) {
  if (!nivelControlador || nivelControlador <= 0) return AFTY_INV_GRAUS.map((g) => g.value);
  let rankMax = 1;
  if (nivelControlador >= 17) rankMax = 5;
  else if (nivelControlador >= 13) rankMax = 4;
  else if (nivelControlador >= 9) rankMax = 3;
  else if (nivelControlador >= 5) rankMax = 2;
  return AFTY_INV_GRAUS.filter((g) => g.rank <= rankMax).map((g) => g.value);
}

// ------------------------------------------------------------
// Ficha em branco de uma invocação
// ------------------------------------------------------------
let _uidCounter = 0;
const novoId = (prefixo = "inv") => `${prefixo}_${Date.now().toString(36)}_${(_uidCounter++).toString(36)}`;

/** Tamanhos acessíveis por uma Característica de Tamanho no grau (faixa inteira). */
export function tamanhosNaFaixa(grau) {
  const faixa = INV_CARACT_TAMANHO[grauMeta(grau).value];
  if (!faixa) return [];
  const i = TAMANHO_ORDEM.indexOf(faixa[0]);
  const j = TAMANHO_ORDEM.indexOf(faixa[1]);
  if (i < 0 || j < 0) return [];
  return TAMANHO_ORDEM.slice(i, j + 1);
}

export function createBlankAcao() {
  return {
    id: novoId("acao"),
    nome: "",
    descricao: "",
    classe: "complexa",       // "simples" | "complexa"
    familia: "ataque",        // "ataque" | "auxilio"
    // Ataque
    ataqueTipo: "jogada",     // "jogada" | "tr"
    alvo: "unico",            // "unico" | "multiplos" | "area"
    atributoChave: "forca",
    tipoDano: "",
    corpoACorpo: false,
    formaArea: "",
    trTipo: "reflexos",        // save que o ataque força (exceto Integridade)
    // Auxílio
    auxilioSub: "defesa",     // "cura" | "defesa" | "acerto" | "danoAdicional" | "rd"
    alvoAuxilio: "invocacao", // "invocacao" | "aliados"
    curaAttr: "sabedoria",    // "sabedoria" | "presenca"
    rdTiposExtras: 0,
    // Ação com Custo
    custoPE: 0,
    beneficiosCusto: [],
    // Otimização de Energia (Controlador 2°): UMA ação com custo por invocação
    // fica 1 PE mais barata. É por AÇÃO, e não por invocação, então não entra no
    // registro de marcadores.
    custoOtimizado: false,
    // Escape hatch de DSL. `modificadorAlvo` diz ONDE o número cai: sem ele a
    // expressão era avaliada e o resultado descartado (ver MODIFICADOR_ALVOS).
    modificadorExpr: "",
    modificadorAlvo: "",
    /* As marcas do Adicionais (2026-10-01, Etapa 11), opcionais:
         reacao       é uma Reação (a Simples Auxiliar vale 1,5 vez)
         manobra      é uma Manobra (não pode ser Simples)
         especial     "" | "reducaoCura" | "cobertura"
         reducaoCura  "terco" | "metade"
         cobertura    "meia" | "tresQuartos" */
    reacao: false,
    manobra: false,
    especial: "",
    reducaoCura: "terco",
    cobertura: "meia",
  };
}

export function createBlankCaracteristica() {
  return {
    id: novoId("carac"),
    nome: "",
    descricao: "",
    subtipo: "vida",          // "vida" | "teste" | "resistencia" | "rd" | "tamanho" | "livre"
    alvoTeste: "pericia",     // "pericia" | "ataque" | "tr"
    periciaId: "",            // qual perícia, quando alvoTeste === "pericia"
    trTipo: "",               // qual TR, quando alvoTeste === "tr"
    rdTipo: "",               // tipo de dano coberto (INV_RD_TIPOS)
    rdTipoOutro: "",          // texto livre quando rdTipo === "outro"
    rdTiposExtras: 0,
    tamanho: "",
    modificadorExpr: "",
    modificadorAlvo: "",
    /* O Motor de Automação da Característica LIVRE (2026-09-10): linhas
       `{ canal, alvo?, expr, quando? }` nos canais da invocação. Os outros
       subtipos ignoram o campo. Ver `resolverMotorDaCaracteristica`. */
    efeitos: [],
  };
}

/** Clona uma invocação com novos ids (dela e de cada ação/característica). */
export function cloneInvocacao(inv) {
  const c = JSON.parse(JSON.stringify(inv || {}));
  c.id = novoId();
  c.acoes = (c.acoes || []).map((a) => ({ ...a, id: novoId("acao") }));
  c.caracteristicas = (c.caracteristicas || []).map((ch) => ({ ...ch, id: novoId("carac") }));
  return c;
}

export function createBlankInvocacao(grau = "quarto", tipoMecanico = "shikigami") {
  // A base de atributo depende do TIPO: o Shikigami de Técnica começa em 10.
  const b = regrasDoTipoValor(tipoMecanico).atributoBase;
  return {
    id: novoId(),
    nome: "",
    tipoMecanico,
    grau,
    atributos: { forca: b, destreza: b, constituicao: b, inteligencia: b, sabedoria: b, presenca: b },
    ataqueTreinado: "corpo",   // "corpo" | "distancia"
    /* MAPA de Testes de Resistência: { [id]: "treinado" | "mestre" }, igual ao
       `periciasProf`. Era UM save só (`trTreinado` + `trMestre`) até 2026-09-02,
       e o autor mandou virar mapa para a Herança das Sombras poder herdar vários
       ("se torna treinado nas mesmas perícias e TRs da sombra de herança").
       ⚠ Ficha antiga continua valendo: `trProfDaInvocacao` lê os dois formatos. */
    trProf: { reflexos: "treinado" },
    periciasProf: {},          // { [periciaId]: "treinado" | "mestre" }
    tamanho: "medio",          // só muda por Característica de Tamanho
    marcadores: {},            // { [marcadorId]: true } — ver MARCADORES_INVOCACAO
    marcadorOpcoes: {},        // { [marcadorId]: opcaoValue } — marcador que pede escolha
    /* { [marcadorId]: [invocacaoId] } — as outras invocações que esta declara
       como FONTE. Só marcador com `fontes` no registro usa. Ver `marcadorFontes`
       e as funções `fontes()` / `fontesTopo()` do DSL. */
    marcadorFontes: {},
    acoes: [],                 // Fatia 2
    caracteristicas: [],       // Fatia 2
    /* RETRATO PRÓPRIO (2026-08-31). Mesmo par de campos do retrato da criatura
       (`portraitUrl` + `portraitFocus`), e de propósito: o componente de foco do
       criador é o mesmo, e uma invocação com o retrato guardado noutro formato
       obrigaria a uma segunda cópia dele. Ver `RetratoCampo`. */
    portraitUrl: "",
    portraitFocus: { x: 50, y: 50 },
    /* APARÊNCIA PRÓPRIA na Ficha Final: o mesmo objeto de tema de
       `creature.aparencia`, com preset, tokens, imagem e CSS livre. Nasce nulo
       porque tema ausente é o tema herdado da ficha do dono, e um objeto vazio
       aqui já seria uma escolha (a de sobrescrever com o padrão). */
    aparencia: null,
    /* OS CAMPOS DOS TIPOS ESPECIAIS (2026-09-30, Etapa 8). Opcionais: ficha sem
       eles lê o padrão, e cada um só vale no tipo dele.
         fundamento   Shikigami de Técnica que É a Técnica Inata (PV-15)
         oficio       Marionete: o Ofício do material (reparo e reconstrução)
         natureza     Corpo: "boneco" | "biologico"
         refeicao     Corpo Biológico: a refeição de Cozinheiro permanente
         refeicaoTrs  os TRs da refeição Nutritiva */
    fundamento: false,
    oficio: "",
    natureza: "",
    refeicao: "",
    refeicaoTrs: [],
  };
}

// ------------------------------------------------------------
// Atributos: point-buy linear
// ------------------------------------------------------------
/** Pontos gastos = soma de (valor - base) por atributo (redução vira negativo). */
export function pontosAtributoUsados(inv) {
  const at = inv?.atributos || {};
  const base = atributoBaseInvocacao(inv);
  return INV_ATTR_KEYS.reduce((s, k) => s + ((at[k] ?? base) - base), 0);
}

// bonusPontos: pontos de atributo extras (ex.: Potencial Superior do Controlador).
// bonusMax: quanto o canal `limiteAtributo` subiu o teto POR atributo (2026-09-15).
// Antes dele o teto do grau era fixo, e por isso uma Técnica que quisesse um
// shikigami acima da tabela não tinha canal nenhum para pedir isso.
export function resumoAtributosInvocacao(inv, bonusPontos = 0, bonusMax = 0) {
  const g = grauMeta(inv?.grau);
  const tab = INV_ATRIBUTOS_POR_GRAU[g.value] || INV_ATRIBUTOS_POR_GRAU.quarto;
  const at = inv?.atributos || {};
  const base = atributoBaseInvocacao(inv);
  const min = atributoMinInvocacao(inv);
  const total = tab.pontos + (bonusPontos || 0);
  const maxPorAtributo = tab.max + Math.max(0, Math.trunc(Number(bonusMax) || 0));
  const usados = pontosAtributoUsados(inv);
  const warnings = [];
  if (usados > total) warnings.push(`Atributos: ${usados} de ${total} pontos (excedeu).`);
  for (const k of INV_ATTR_KEYS) {
    const v = at[k] ?? base;
    if (v < min) warnings.push(`${k}: ${v} abaixo do mínimo ${min}.`);
    if (v > maxPorAtributo) warnings.push(`${k}: ${v} passa do máximo ${maxPorAtributo} do grau.`);
  }
  // `base` e `min` saem daqui porque o editor precisa deles e eles dependem do
  // TIPO da invocação, não do grau.
  //
  // ⚠ `valores` e `mods` saem junto porque este objeto é TUDO que a Ficha recebe
  // sobre os atributos da invocação. Sem eles ela tinha só o orçamento gasto, e
  // os seis atributos da criatura invocada não apareciam em lugar nenhum na mesa.
  return {
    usados, total, max: maxPorAtributo, maxDoGrau: tab.max, base, min, restante: total - usados, warnings,
    valores: Object.fromEntries(INV_ATTR_KEYS.map((k) => [k, at[k] ?? base])),
    mods: Object.fromEntries(INV_ATTR_KEYS.map((k) => [k, mod(at[k] ?? base)])),
  };
}

// ------------------------------------------------------------
// PV, Defesa, Deslocamento
// ------------------------------------------------------------
// dono = { nd, bt, nivelControlador }. "Nível do Usuário" = dono.nd (decisão do
// autor). "Metade do Valor de Constituição" usa o VALOR do atributo, não o mod.
/**
 * As três parcelas do PV base, NOMEADAS. A tabela do grau soma sempre os mesmos
 * três termos, e quem os separa é esta função: o `pvInvocacao` é a soma dela, e
 * o hover da Ficha é a lista dela. Uma fórmula só, dois consumidores.
 */
export function partesPvInvocacao(inv, dono = {}, atributoPv = "constituicao") {
  /* ⚠ `atributoPv` é a Resiliência Alternativa (2026-09-30): "o atributo usado
     para definir os pontos de vida da invocação é trocado". Troca o VALOR, e a
     fórmula do grau (metade ou inteiro) continua a mesma. */
  const chave = INV_ATTR_KEYS.includes(atributoPv) ? atributoPv : "constituicao";
  const con = inv?.atributos?.[chave] ?? 8;
  const nd = Math.max(1, dono.nd ?? 1);
  const g = grauMeta(inv?.grau);
  const linha = (base, deCon, deNd) => [
    { label: `${g.label} (Base)`, valor: base },
    { label: rotuloAttrInv(chave), valor: deCon },
    { label: "Nível de Desafio", valor: deNd },
  ];
  switch (g.value) {
    case "terceiro": return linha(25, Math.floor(con / 2), nd);
    case "segundo":  return linha(40, con, nd);
    // 1.5x Nível do Usuário, arredondado para baixo (regra do autor, 2026-07-18).
    case "primeiro": return linha(60, con, Math.floor(1.5 * nd));
    case "especial": return linha(80, con, 2 * nd);
    case "quarto":
    default:         return linha(10, Math.floor(con / 2), nd);
  }
}

export function pvInvocacao(inv, dono = {}, atributoPv = "constituicao") {
  return partesPvInvocacao(inv, dono, atributoPv).reduce((t, x) => t + x.valor, 0);
}

/** O atributo de combate: Destreza, ou o do Estilo de Combate quando ele dá mais.
    O Estilo "PERMITE que sua invocação utilize outro Atributo" (Adicionais), então
    ele entra como opção, e vale o melhor dos dois. */
function atributoDeCombate(inv, alternativo, padrao = "destreza") {
  const at = inv?.atributos || {};
  if (!INV_ATTR_KEYS.includes(alternativo)) return padrao;
  return mod(at[alternativo] ?? 8) > mod(at[padrao] ?? 8) ? alternativo : padrao;
}

/** As parcelas da Defesa base, nomeadas. Ver `partesPvInvocacao`. */
export function partesDefesaInvocacao(inv, dono = {}, atributoAlternativo = null) {
  const base = { quarto: 10, terceiro: 12, segundo: 16, primeiro: 20, especial: 24 };
  const g = grauMeta(inv?.grau);
  const attr = atributoDeCombate(inv, atributoAlternativo);
  return [
    { label: `${g.label} (Base)`, valor: base[g.value] ?? 10 },
    { label: rotuloAttrInv(attr), valor: mod(inv?.atributos?.[attr] ?? 8) },
    ...(dono.bt ? [{ label: "Maestria", valor: dono.bt }] : []),
  ];
}

export function defesaInvocacao(inv, dono = {}, atributoAlternativo = null) {
  return partesDefesaInvocacao(inv, dono, atributoAlternativo).reduce((t, x) => t + x.valor, 0);
}

export function deslocamentoInvocacao() {
  // Características que expandem o deslocamento entram na Fatia 2.
  return INV_DESLOCAMENTO_PADRAO;
}

// Bônus de teste = Mod. do Atributo Chave + BT do Usuário (só se treinado) +
// Metade do Nível de Controlador + bônus de Habilidade (ex.: Controle Aprimorado).
// Perícia sem treino não soma o BT.
export function bonusTesteInvocacao(inv, dono = {}, { atributo = "forca", treinado = true } = {}) {
  const modAttr = mod(inv?.atributos?.[atributo] ?? 8);
  const meioControlador = Math.floor((dono.nivelControlador ?? 0) / 2);
  return modAttr + (treinado ? (dono.bt ?? 0) : 0) + meioControlador + (dono.bonusTesteHabilidade ?? 0);
}

/* ============================================================ */
/* AUXÍLIOS LIGADOS NA MESA (2026-08-31)                         */
/* ============================================================ */
/**
 * "Quando criar uma ação de auxílio, você deve escolher se ela pode afetar a
 * Invocação ou Aliados, limitando-se a um deles, por padrão."
 *
 * O alvo é escolha de CRIAÇÃO, e o que a mesa escolhe é QUAL ação usar. Ligar
 * uma delas na Ficha Final passou a mexer no número de verdade (autor,
 * 2026-08-31): *"Mexe na ficha do DONO de verdade e na ficha da INVOCAÇÃO de
 * verdade. Por exemplo, um shikigami pode escolher entre me BUFFAR ou se BUFFAR
 * com +5 de Defesa usando suas ações."*
 *
 * ⚠ SÓ TRÊS DOS CINCO SUB-TIPOS VIRAM INTERRUPTOR, e não é recorte de
 * conveniência: os outros dois não são estado, são evento.
 *
 * | Sub-tipo | Por que |
 * |---|---|
 * | Defesa, Acerto, RD | número que fica de pé enquanto durar. É buff |
 * | Cura | ela ROLA e devolve PV. Ligar uma cura não quer dizer nada |
 * | Dano Adicional | "em um próximo ataque", e é um DADO. Um disparo, não estado |
 *
 * O Dano Adicional continua aparecendo na Ficha com o dado dele, para a mesa
 * somar no golpe. Ele é o único auxílio de valor que não vira canal, e o motivo
 * é o texto do livro, não o motor.
 *
 * ⚠ E O `emCampo` MANDA EM TODOS. Uma invocação dissipada não sustenta bônus
 * nenhum, e sem essa porta o jogador que guardasse o shikigami ficaria com a
 * Defesa dele para sempre, calado. É a mesma razão de a Guarda perder a casca
 * junto do bônus: benefício que sobrevive à fonte é bug com cara de número.
 */

/** Os sub-tipos de auxílio que se sustentam, e por isso podem ser ligados. */
export const AUXILIO_SUSTENTAVEL = ["defesa", "acerto", "rd"];

/**
 * Em que canal do Motor cada auxílio sustentável cai quando o alvo é ALIADOS.
 * ⚠ Acerto é `bonusAcerto` e não `acerto`: o primeiro é o canal, o segundo é a
 * variável de leitura do DSL. Trocar os dois emite um efeito que ninguém lê.
 */
export const AUXILIO_CANAL = { defesa: "defesa", acerto: "bonusAcerto", rd: "rdGeral" };

/** Rótulo de mesa de cada sub-tipo. Sai daqui porque a Ficha e o criador usam o mesmo. */
export const AUXILIO_ROTULO = {
  cura: "Cura", defesa: "Defesa", acerto: "Acerto", danoAdicional: "Dano Adicional", rd: "RD",
};

export const ALVO_AUXILIO_ROTULO = { invocacao: "Nela Mesma", aliados: "Aliados" };

/** O estado de mesa desta invocação, saneado. Sem sessão, ela está fora de campo. */
export function sessaoDaInvocacao(dono, invId) {
  const mapa = dono?.sessaoInvocacoes;
  const e = (mapa && typeof mapa === "object") ? mapa[invId] : null;
  return {
    emCampo: !!e?.emCampo,
    auxilios: (e?.auxilios && typeof e.auxilios === "object") ? e.auxilios : {},
    /* O estado de mesa das Intrínsecas e Auras (2026-09-30, Etapa 6): as Auras em
       que o dono está, a tarefa da Bem Treinada e a Forma (arma ou armadura). */
    auras: (e?.auras && typeof e.auras === "object") ? e.auras : {},
    emTarefa: !!e?.emTarefa,
    forma: e?.forma === "arma" || e?.forma === "armadura" ? e.forma : null,
    /* O que a ENTRADA deixou (2026-09-30, Etapa 7): o PV a mais da Resistência
       Sobrecarregada, que vale enquanto ela está em campo, e a Autonomia paga. */
    sobrecargaPv: Math.max(0, Math.trunc(Number(e?.sobrecargaPv) || 0)),
    autonomia: !!e?.autonomia,
  };
}

/** Aquele auxílio está sustentando um bônus agora? */
export const auxilioLigado = (sessao, acaoId) => !!sessao?.emCampo && !!sessao?.auxilios?.[acaoId];

/** Uma ação crua é um auxílio que pode ser ligado? */
export const ehAuxilioSustentavel = (acao) =>
  acao?.familia === "auxilio" && AUXILIO_SUSTENTAVEL.includes(acao?.auxilioSub ?? "defesa");

/**
 * Os auxílios LIGADOS desta invocação, já resolvidos e separados por alvo.
 *
 * ⚠ É um PRÉ-PASSE, e ele existe por causa de um laço curto: o Acerto que a
 * invocação dá a si mesma tem de entrar nas Jogadas de Ataque DELA, e essas
 * jogadas saem do `resolveAcao`, que é justamente quem calcula o valor do
 * auxílio. Resolver a ação de auxílio duas vezes custa uma tabela e uma soma, e
 * é mais barato que carregar o resultado por um segundo caminho.
 */
export function auxiliosLigadosDa(inv, dono = {}) {
  const sess = sessaoDaInvocacao(dono, inv?.id);
  /* ⚠ `fontes` ANDA JUNTO DOS NÚMEROS desde 2026-09-03. Os três canais eram só
     totais, e o hover da Ficha mostrava a Defesa somada sem dizer que 5 dela
     vinham de um auxílio LIGADO agora: o jogador desligava a Guarda de Escamas e
     via o número cair sem nada explicando. Uma linha por auxílio ligado. */
  const proprio = { defesa: 0, bonusAcerto: 0, rdGeral: 0, fontes: [] };
  const paraAliados = [];
  if (!sess.emCampo) return { proprio, paraAliados, sessao: sess };
  for (const a of Array.isArray(inv?.acoes) ? inv.acoes : []) {
    if (!ehAuxilioSustentavel(a) || !auxilioLigado(sess, a.id)) continue;
    const r = resolveAcao(a, inv, dono);
    const canal = AUXILIO_CANAL[r.auxilioSub];
    const valor = Math.trunc(Number(r.valor) || 0);
    if (!canal || !valor) continue;
    if (r.alvoAuxilio === "aliados") {
      paraAliados.push({ id: a.id, nome: r.nome || "Auxílio", sub: r.auxilioSub, canal, valor });
    } else {
      proprio[canal] += valor;
      proprio.fontes.push({ canal, label: r.nome || "Auxílio", valor });
    }
  }
  return { proprio, paraAliados, sessao: sess };
}

// Bônus de proficiência num teste: treinado soma o BT, mestre soma 1,5x o BT
// (BT + metade do BT, arredondando para baixo). Ex.: BT +2 -> mestre +3.
// Proficiência (Treinado / Mestre) e o custo em vagas moram em afty-pericias.js,
// que é o dono da regra e serve os três tipos de teste. Re-exportados aqui
// porque é daqui que a aba de Invocações sempre os importou.
export { bonusProficiencia, usoPericias };

// Perícias comuns treináveis: 1 + metade do melhor mod entre INT e SAB, mais o
// ganho por grau. Não conta Ofício (regra de mesa, não travada aqui).
export function periciasAllowanceInvocacao(inv) {
  const at = inv?.atributos || {};
  const melhor = Math.max(mod(at.inteligencia ?? 8), mod(at.sabedoria ?? 8));
  const base = 1 + Math.floor(melhor / 2);
  const adic = INV_PERICIAS_ADICIONAIS[grauMeta(inv?.grau).value] ?? 0;
  return Math.max(0, base + adic);
}

/**
 * As parcelas da conta acima, no formato do painel de fontes.
 *
 * ⚠ MORA COLADO NA FÓRMULA de propósito. A tela montava a explicação dela
 * própria a partir dos canais, e por isso mostrava só o que as Habilidades
 * deram: a base ficava invisível e o "Total" do painel não era nenhum número da
 * tela. Repetir a fórmula na aba seria a mesma conta escrita duas vezes, que é
 * a razão de `partesPvInvocacao` e `partesDefesaInvocacao` existirem aqui.
 *
 * ⚠ O `Math.max(0, ...)` da allowance é reproduzido como PARCELA, e não
 * ignorado. Com Inteligência e Sabedoria bem baixas a soma crua fica negativa e
 * a função corta em zero: sem esta linha o painel somaria menos do que o número
 * mostrado, e o assert de fechamento pegaria uma diferença que não é erro.
 */
export function partesPericiasInvocacao(inv) {
  const at = inv?.atributos || {};
  const melhor = Math.max(mod(at.inteligencia ?? 8), mod(at.sabedoria ?? 8));
  const g = grauMeta(inv?.grau);
  const deAtributo = Math.floor(melhor / 2);
  const adic = INV_PERICIAS_ADICIONAIS[g.value] ?? 0;
  const cru = 1 + deAtributo + adic;
  return [
    { label: "Base", valor: 1 },
    ...(deAtributo ? [{ label: "Inteligência ou Sabedoria", valor: deAtributo }] : []),
    ...(adic ? [{ label: g.label, valor: adic }] : []),
    ...(cru < 0 ? [{ label: "Piso em zero", valor: -cru }] : []),
  ];
}

// ------------------------------------------------------------
// Custo em PE e orçamento de Ações/Características
// ------------------------------------------------------------
// Capacidade = base do grau + adicionais (1 por rank de grau: 4°=1 ... especial=5).
// Habilidades de Controlador ampliam depois (passada de efeitos pendente).
// extra: slots adicionais de Habilidade (Ápice do Controle, Visionário).
/**
 * `livresCaract` são vagas que SÓ uma Característica pode ocupar (Shikigami de
 * Técnica). O orçamento normal é um pool único ("A quantidade serve tanto para
 * ações quanto características"), então uma vaga exclusiva não pode entrar nele:
 * ela absorve as primeiras N características e o resto disputa o pool comum.
 */
export function orcamentoAcoesCaract(inv, extra = 0, livresCaract = 0) {
  const g = grauMeta(inv?.grau);
  const base = INV_ACOES_CARACT_BASE[g.value] ?? 2;
  const maxAdicionais = g.rank; // 4°=1, 3°=2, 2°=3, 1°=4, especial=5
  /* O que a Herança CONCEDE não ocupa vaga (decisão do autor, PV-14): os itens
     marcados `concedida` ficam fora da conta. */
  const nAcoes = (inv?.acoes ?? []).filter((a) => !a?.concedida).length;
  const nCaract = (inv?.caracteristicas ?? []).filter((c) => !c?.concedida).length;
  const exclusivas = Math.max(0, livresCaract || 0);
  const caractNoPool = Math.max(0, nCaract - exclusivas);
  const usados = nAcoes + caractNoPool;
  const total = base + maxAdicionais + (extra || 0);
  return {
    base, maxAdicionais, extra: extra || 0, exclusivas,
    // Quantas das vagas exclusivas estão realmente ocupadas, para a tela mostrar.
    exclusivasUsadas: Math.min(exclusivas, nCaract),
    total, usados, restante: total - usados,
  };
}

// Custo total em PE para invocar = custo base + acréscimos das escolhas:
// Ação Simples ou Característica = +1, Ação Complexa = +2.
// `gratis` = itens que NÃO custam ALÉM da quantidade base do grau (ex.: Ápice
// do Controle dá 2 grátis a mais). Abatemos os itens mais caros primeiro, que
// é o que o jogador escolheria.
//
// ⚠ A QUANTIDADE BASE (`INV_ACOES_CARACT_BASE` — 2 no Quarto/Terceiro, 3 no
// Segundo/Primeiro, 4 no Especial) NÃO CUSTA PE NENHUM, verbatim do livro: só
// as Ações/Características ALÉM dela custam (achado em 2026-09-14 — o cálculo
// cobrava PE pela ficha inteira e só abatia os grátis de Habilidade por cima,
// então toda invocação pagava PE mesmo dentro da cota base).
export function custoInvocacao(inv, gratis = 0, gratisCaract = 0) {
  return detalheCustoInvocacao(inv, gratis, gratisCaract).total;
}

/**
 * O CUSTO EM PARTES (2026-09-30, Etapa 4). O `custoInvocacao` devolvia só o
 * número, e o hover mostrava uma parcela "(Base)" que já trazia os itens dentro:
 * a mesa não tinha como saber quanto era o grau e quanto eram as escolhas.
 *
 * ⚠ O CUSTO BASE É DO TIPO (decisão do autor, Mecânicas): Marionete, Corpo e
 * Maldição não têm custo base de ativação (`regras.custoBase: 0`). As Ações e
 * Características além da cota continuam custando, e são pagas na entrada.
 * O Corpo também: o livro diz dele só "não possuem custo de ativação", sem falar
 * das extras, e o autor confirmou em 2026-10-03 que ele paga como a Marionete.
 * A cota isenta (a quantidade base do grau) foi confirmada no mesmo dia.
 *
 * Devolve `{ base, baseLabel, itens, nItens, poupadoGratis, total }`:
 *   base           o custo do grau, ou zero pelo tipo
 *   itens          o que as Ações e Características além da cota custam
 *   poupadoGratis  o que o `gratis` (Ápice do Controle) deixou de cobrar
 */
export function detalheCustoInvocacao(inv, gratis = 0, gratisCaract = 0) {
  const g = grauMeta(inv?.grau);
  const regras = regrasDoTipo(inv);
  const cota = INV_ACOES_CARACT_BASE[g.value] ?? 2;
  // O concedido pela Herança não custa (PV-14), igual ao orçamento acima.
  const nCaract = (inv?.caracteristicas ?? []).filter((c) => !c?.concedida).length;
  /* ⚠ `gratisCaract` (Shikigami de Técnica) abate CARACTERÍSTICA, e não "o item
     mais caro". O `gratis` genérico do Ápice do Controle abate os maiores
     primeiro, que é o que o jogador escolheria; aqui o texto diz qual item é de
     graça, então ele sai da conta antes da ordenação. */
  const caractPagas = Math.max(0, nCaract - Math.max(0, gratisCaract));
  const custos = [];
  for (const a of inv?.acoes || []) if (!a?.concedida) custos.push(a?.classe === "complexa" ? 2 : 1);
  for (let i = 0; i < caractPagas; i++) custos.push(1);
  custos.sort((a, b) => b - a); // maiores primeiro
  const soma = (lista) => lista.reduce((s, c) => s + c, 0);
  const livres = Math.max(0, gratis);
  const pagos = custos.slice(livres + cota);
  const comBase = regras.custoBase === "grau";
  /* ⚠ `custoBaseFixo` é da Quimera do Mecânicas (2026-10-01, Etapa 9): "O custo em
     PE é calculado somando o custo de PE base das Invocações". Só existe na cópia
     sintética que o `resolveQuimera` monta, nunca numa ficha salva. */
  const baseFixa = Number.isFinite(inv?.custoBaseFixo) ? Math.max(0, Math.trunc(inv.custoBaseFixo)) : null;
  const base = baseFixa ?? (comBase ? g.custoBase : 0);
  const itens = soma(pagos);
  return {
    base,
    baseLabel: baseFixa != null ? "Quimera (Soma dos Custos Base)"
      : comBase ? `${g.label} (Base)` : `${regras.label} (Sem Custo Base)`,
    itens,
    nItens: pagos.length,
    poupadoGratis: soma(custos.slice(cota, cota + livres)),
    total: base + itens,
  };
}

// ============================================================
// FATIA 2 — Ações e Características (tabelas + resolvers)
// ============================================================
// Números VERBATIM do doc. Várias tabelas COMEÇAM no Terceiro Grau (Alvos
// Múltiplos, Área, Cura Múltiplos): Quarto Grau não aparece nelas de propósito.
//
// ESCADA DE NÍVEIS DE DADO: regras como "corpo a corpo aumenta o dano em 3
// níveis", "dano adicional complexo +3 níveis" e o benefício de Ação com Custo
// "+2 níveis por PE" andam nesta escada canônica (regra geral de armas, tabela
// verbatim no doc). Implementada em subirNiveisDano (ver abaixo).

/** Dano por grau (dado base, a distância). Bônus de atributo é 1x, 2x no Especial. */
export const INV_DANO = {
  jogadaUnico: { quarto: "1d12", terceiro: "1d12 + 1d6", segundo: "2d12", primeiro: "2d12 + 1d6", especial: "3d12" },
  trUnico:     { quarto: "1d8",  terceiro: "1d12",        segundo: "1d12 + 1d6", primeiro: "2d12", especial: "2d12 + 1d6" },
  multiplos:   { terceiro: "1d10", segundo: "1d12", primeiro: "1d12 + 1d6", especial: "2d12" },
  area:        { terceiro: "1d8",  segundo: "1d10", primeiro: "1d12", especial: "1d12 + 1d8" },
};

/** Cura por grau (só Ação Complexa). Bônus de atributo 1x, 2x no Especial. */
export const INV_CURA = {
  unico:     { quarto: "1d4", terceiro: "1d8", segundo: "1d12", primeiro: "1d12 + 1d8", especial: "2d12 + 1d6" },
  multiplos: { terceiro: "1d4", segundo: "1d6", primeiro: "1d8", especial: "1d12 + 1d4" },
};

export const INV_ALCANCE = { quarto: 6, terceiro: 9, segundo: 15, primeiro: 21, especial: 30 };      // metros
export const INV_AREA = { terceiro: 3, segundo: 4.5, primeiro: 6, especial: 7.5 };                    // metros
export const INV_BONUS_DEFESA = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };     // Simples; Complexa x1.5
export const INV_BONUS_ACERTO = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };     // Simples; Complexa x1.5
export const INV_DANO_ADICIONAL = { quarto: "1d6", terceiro: "1d10", segundo: "2d6", primeiro: "2d8", especial: "2d12" };
export const INV_RD_ACAO = { quarto: 2, terceiro: 4, segundo: 6, primeiro: 8, especial: 10 };         // Simples; Complexa x1.5; -2 por tipo extra

// Características (passivas).
export const INV_CARACT_VIDA = { quarto: 5, terceiro: 10, segundo: 15, primeiro: 20, especial: 30 };
export const INV_CARACT_TESTE = { quarto: 2, terceiro: 4, segundo: 6, primeiro: 8, especial: 10 };    // Perícia: cheio. Ataque/TR: metade
export const INV_CARACT_RD = { quarto: 2, terceiro: 4, segundo: 6, primeiro: 8, especial: 12 };       // note: Especial 12 (difere do RD de Ação)

/**
 * ============================================================
 * CARACTERÍSTICA DE PROFICIÊNCIA EM TESTE DE RESISTÊNCIA
 * ============================================================
 * Autor, 2026-09-03: *"Invocações de Segundo Grau podem fazer uma Característica
 * pra se tornar Treinado em um TR. Invocações de Grau Especial podem fazer uma
 * Característica para se tornar Mestre em um TR."*
 *
 * Três decisões dele, na mesma conversa, e nenhuma é derivável do texto:
 *
 *   1. **"de Segundo Grau" é "de Segundo Grau OU SUPERIOR"**, então o Primeiro
 *      também treina. O Quarto e o Terceiro não têm acesso.
 *   2. **No Especial ela SÓ dá Mestre.** Não existe a opção de gastar a
 *      Característica de um Especial para apenas treinar um TR novo.
 *   3. **O Mestre não cobra Treinado antes.** Ela aponta para um TR qualquer e
 *      ele passa a Mestre de uma vez.
 *
 * ⚠ E ELA NÃO GASTA A VAGA BASE DE TR (`TR_VAGAS_BASE`). A vaga é a escolha da
 * ficha, e esta faixa vem de fora dela, do mesmo jeito que a fusão da Herança
 * das Sombras vem. Quem conta a vaga é o editor, que lê `inv.trProf`; quem
 * concede é o agregado das Características, que entra depois.
 */
export const INV_CARACT_TR_PROF = {
  quarto: null, terceiro: null, segundo: "treinado", primeiro: "treinado", especial: "mestre",
};
export const INV_CARACT_TAMANHO = {
  quarto:   ["medio", "grande"],
  terceiro: ["medio", "grande"],
  segundo:  ["pequeno", "enorme"],
  primeiro: ["pequeno", "enorme"],
  especial: ["minusculo", "colossal"],
};

// Ação com Custo: mínimo 1 PE, máximo 2 por rank de grau (2/4/6/8/10). Benefícios por PE.
export const custoMaxAcao = (grau) => 2 * grauMeta(grau).rank;
export const INV_CUSTO_CONDICAO = { fraca: 2, media: 4, forte: 6 };
export const INV_CUSTO_BENEFICIOS = [
  { id: "alcance",  label: "Aumento de Alcance", porPE: "+6 metros de alcance" },
  { id: "area",     label: "Aumento de Área",    porPE: "+3 metros de área" },
  { id: "danoCura", label: "Aumento de Dano/Cura", porPE: "+2 níveis de dano ou cura" },
  { id: "acertoCd", label: "Bônus em Acerto ou CD", porPE: "+1 na jogada de ataque ou na CD" },
  { id: "condicao", label: "Causar Condição", porPE: "aplica Condição (Fraca 2, Média 4, Forte 6 PE)" },
];

/** Alvos de Ataque disponíveis num grau (Múltiplos/Área começam no Terceiro Grau). */
export function alvosDanoDisponiveis(grau) {
  const g = grauMeta(grau).value;
  return { unico: true, multiplos: INV_DANO.multiplos[g] != null, area: INV_DANO.area[g] != null };
}
/** Cura de alvos múltiplos existe a partir do Terceiro Grau. */
export function curaMultiplosDisponivel(grau) {
  return INV_CURA.multiplos[grauMeta(grau).value] != null;
}

// Multiplicador do bônus de atributo em dano/cura: 2x só no Grau Especial.
const bonusAttrMult = (grau) => (grauMeta(grau).value === "especial" ? 2 : 1);
// Ação Complexa aumenta bônus fixos (Defesa/Acerto/RD) em 1,5x, arredondando
// para BAIXO (regra geral do autor, 2026-07-18: sempre piso salvo o texto dizer
// o contrário). Base ímpar como 1 (Defesa/Acerto de Quarto Grau) segue em 1.
const complexaMult = (base) => Math.floor(base * 1.5);

// Escada canônica de dados. Degraus 0..7 são a base (1, 1d2, 1d3, 1d4, 1d6, 1d8,
// 1d10, 1d12). Acima do d12: kd12, depois +1d4/+1d6/+1d8/+1d10, depois (k+1)d12,
// iniciando o dado adicional no d4 e subindo até o d12, quando vira mais um d12.
const DADO_LADDER_BAIXO = ["1", "1d2", "1d3", "1d4", "1d6", "1d8", "1d10", "1d12"];
const DADO_LADDER_BAIXO_MAX = [1, 2, 3, 4, 6, 8, 10, 12];
const DADO_ADICIONAL = [4, 6, 8, 10]; // dado extra sobe d4 -> d6 -> d8 -> d10 -> (vira +1 d12)

function degrau(i) {
  if (i <= 7) return { str: DADO_LADDER_BAIXO[i], max: DADO_LADDER_BAIXO_MAX[i] };
  const m = i - 7;
  const k = Math.floor(m / 5) + 1;
  const within = m % 5;
  if (within === 0) return { str: `${k}d12`, max: k * 12 };
  const add = DADO_ADICIONAL[within - 1];
  return { str: `${k}d12 + 1d${add}`, max: k * 12 + add };
}

// Máximo de um dado escrito como "AdB + CdD ..." (ou um número solto como "1").
function dadoMax(str) {
  return String(str).split("+").reduce((s, term) => {
    const t = term.trim();
    const m = t.match(/^(\d+)\s*d\s*(\d+)$/i);
    if (m) return s + Number(m[1]) * Number(m[2]);
    const n = Number(t);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
}

// Degrau cujo "maior resultado" é o mais próximo de `alvo`. A escada é
// monotônica e distinta, então dá para varrer.
function degrauDoMaximo(alvo) {
  let prev = 0;
  for (let i = 0; i < 300; i++) {
    const cur = degrau(i).max;
    if (cur === alvo) return i;
    if (cur > alvo) {
      if (i === 0) return 0;
      return (cur - alvo) < Math.abs(alvo - degrau(prev).max) ? i : prev;
    }
    prev = i;
  }
  return prev;
}

// Degrau de um dado pela regra do "maior resultado": soma o máximo e acha o
// degrau mais próximo.
function degrauDe(str) {
  return degrauDoMaximo(dadoMax(str));
}

/**
 * O dado da escada cujo maior resultado é `maximo`. É o caminho de volta do
 * canal `ataqueDanoAdicional`, que trafega o MÁXIMO do dado em vez do dado.
 *
 * ⚠ O canal viaja como máximo, e não como um índice de degrau, porque o Motor
 * SOMA os valores de um mesmo canal. Somar índices de degrau daria a escada
 * errada (duas fontes de 1d6 virariam 1d10). Somar máximos é a própria regra de
 * conversão do livro: 6 + 6 = 12 = 1d12, o degrau de mesmo maior resultado.
 */
export function dadoDoMaximo(maximo) {
  const n = Math.max(0, Math.floor(Number(maximo) || 0));
  if (n <= 0) return null;
  return degrau(degrauDoMaximo(n)).str;
}

/**
 * A notação de dano, ESTRUTURADA: `"3d12 + 1d8"` vira
 * `[{ dados: 3, faces: 12 }, { dados: 1, faces: 8 }]`.
 *
 * ⚠ EXISTE PARA A FICHA ROLAR, e é o mesmo remédio do `rolagensDoFeitico`: quem
 * tem o número entrega o número, e ninguém relê notação de volta de uma string.
 *
 * ⚠ E é uma LISTA porque a escada de dano do Afty tem degraus de DOIS dados
 * diferentes (`degrau()` devolve `"2d12 + 1d6"` a partir do oitavo). Um parser
 * ingênuo que quebrasse no "d" leria `"3d12 + 1d8"` como 3 dados de face
 * inválida, e a Invocação rolaria um dano errado sem avisar ninguém. Isso quase
 * chegou à mesa em 2026-08-06.
 *
 * Degrau de dado fixo (`"1"`, o piso da escada) devolve lista vazia: não há dado
 * a rolar ali, e um `{ dados: 1, faces: 1 }` inventado rolaria um d1.
 */
export function dadosDaNotacao(str) {
  const grupos = [];
  for (const m of String(str ?? "").matchAll(/(\d+)\s*d\s*(\d+)/gi)) {
    const dados = Number(m[1]);
    const faces = Number(m[2]);
    if (dados > 0 && faces > 1) grupos.push({ dados, faces });
  }
  return grupos;
}

/** Sobe (ou baixa) N níveis de dano num dado, pela escada canônica. Piso em "1". */
export function subirNiveisDano(dado, n) {
  if (!n) return { dado, niveisPendentes: false };
  const idx = degrauDe(dado);
  return { dado: degrau(Math.max(0, idx + n)).str, base: dado, niveis: n, niveisPendentes: false };
}

/** CD de um ataque por Teste de Resistência: 10 + metade(ND) (mín 1) + mod do atributo. */
export function cdAtaqueInvocacao(inv, dono = {}, atributo = "inteligencia") {
  const nd = Math.max(1, dono.nd ?? 1);
  return 10 + Math.max(1, Math.floor(nd / 2)) + mod(inv?.atributos?.[atributo] ?? 8);
}

/** Contexto de DSL de UMA invocação, para avaliar `modificadorExpr` de efeitos. */
function ctxParaExpr(inv, dono) {
  return buildInvocacaoDslContext(inv, dono);
}

/**
 * ============================================================
 * ONDE O MODIFICADOR DA DSL CAI
 * ============================================================
 * ⚠ ATÉ 2026-08-17 ELE NÃO CAÍA EM LUGAR NENHUM. O `modificadorExpr` era
 * avaliado, guardado em `out.modificador`, e nada lia esse campo: o editor
 * pintava o resultado em verde e a invocação saía idêntica. É o escape hatch que
 * `docs/afty-invocacoes.md` promete ("DSL para os modificadores") e o pior caso
 * do padrão de sempre, porque a tela CONFIRMAVA um número que não existia.
 *
 * O alvo é explícito e não adivinhado: numa Ação de Ataque "modificador" tanto
 * pode ser dano quanto acerto, e escolher por conta própria seria supor. Quem
 * não escolhe fica com o primeiro alvo da lista, que é o número principal da
 * ação (Dano, Cura ou Valor).
 */
/* ⚠ Rótulo e APLICADOR na mesma entrada, de propósito. Com um `switch` à parte,
   um alvo novo entraria na lista de opções, apareceria no editor e cairia no
   `default` sem fazer nada, que é exatamente o bug que este bloco conserta. O
   validador confere que toda entrada tem os dois. */
const MODIFICADOR_ALVOS = {
  dano: {
    label: "Dano",
    aplica: (out, v) => { if (out.dano) out.dano.bonus = (out.dano.bonus ?? 0) + v; },
  },
  danoNivel: {
    // Sobe degraus na escada, e não soma no total: um nível de dano NÃO é
    // "+1 de dano" (ver `subirNiveisDano` e a escada canônica).
    label: "Níveis de Dano",
    aplica: (out, v) => { if (out.dano?.dado) out.dano = { ...out.dano, ...subirNiveisDano(out.dano.dado, v) }; },
  },
  acerto: {
    label: "Acerto",
    aplica: (out, v) => { if (out.bonusAtaque != null) out.bonusAtaque += v; },
  },
  cd: {
    label: "CD",
    aplica: (out, v) => { if (out.cd != null) out.cd += v; },
  },
  cura: {
    label: "Cura",
    aplica: (out, v) => { if (out.cura) out.cura.bonus = (out.cura.bonus ?? 0) + v; },
  },
  curaNivel: {
    label: "Níveis de Cura",
    aplica: (out, v) => { if (out.cura?.dado) out.cura = { ...out.cura, ...subirNiveisDano(out.cura.dado, v) }; },
  },
  valor: {
    label: "Valor",
    aplica: (out, v) => { if (out.valor != null) out.valor += v; },
  },
};

const comLabel = (ids) => ids.map((v) => ({ value: v, label: MODIFICADOR_ALVOS[v].label }));

/**
 * Os alvos válidos para a Ação, na ordem: o primeiro é o padrão. Uma Ação de
 * Auxílio de valor fixo só tem um, e a de Ataque tem quatro.
 */
export function alvosDeModificador(acao) {
  const familia = acao?.familia === "auxilio" ? "auxilio" : "ataque";
  if (familia === "ataque") {
    return comLabel(["dano", "danoNivel", acao?.ataqueTipo === "tr" ? "cd" : "acerto"]);
  }
  if (acao?.auxilioSub === "cura") return comLabel(["cura", "curaNivel"]);
  return comLabel(["valor"]);
}

/**
 * Os alvos de uma Característica. As de Vida, Teste e RD concedem um número e o
 * modificador entra nele. As de Tamanho e as livres NÃO têm número, então a
 * expressão não teria onde cair: em vez de somer calada, ela vira aviso.
 */
export function alvosDeModificadorCaract(carac) {
  return ["vida", "teste", "rd"].includes(carac?.subtipo) ? comLabel(["valor"]) : [];
}

/**
 * Avalia o `modificadorExpr` e SOMA no alvo escolhido. Devolve o que a tela
 * precisa para dizer onde o número caiu, porque um modificador invisível é
 * indistinguível de um modificador que não funciona.
 */
function aplicaModificador(out, item, inv, dono, warnings, alvos) {
  if (!item?.modificadorExpr) return;
  const valor = evalNumber(item.modificadorExpr, ctxParaExpr(inv, dono), 0);
  out.modificador = valor;
  if (!alvos.length) {
    warnings.push("O Modificador não tem onde ser aplicado neste tipo.");
    return;
  }
  const escolhido = alvos.find((a) => a.value === item.modificadorAlvo) ?? alvos[0];
  out.modificadorAlvo = escolhido.value;
  out.modificadorLabel = escolhido.label;
  if (!valor) return;
  MODIFICADOR_ALVOS[escolhido.value].aplica(out, valor);
}

/**
 * Resolve uma Ação: devolve os valores concretos pelas tabelas do grau. `dado`
 * de dano/cura sai como base (a distância), com `niveisPendentes` quando um
 * "+N níveis" (corpo a corpo etc.) se aplica e a escada ainda não existe.
 */
export function resolveAcao(acao, inv, dono = {}, invCtx = inv) {
  const grau = grauMeta(inv?.grau).value;
  const classe = acao?.classe === "complexa" ? "complexa" : "simples";
  const familia = acao?.familia === "auxilio" ? "auxilio" : "ataque";
  // Ação com Custo é uma escolha do jogador (custoPE > 0 na ficha da ação). Não
  // confundir com o custo obrigatório de 2 PE que a Cura ganha embaixo: aquele
  // é um custo por uso, não a mecânica opcional de Ação com Custo.
  const acaoComCusto = (acao?.custoPE ?? 0) > 0;
  // A `descricao` viaja junto pelo mesmo motivo da Característica: é o texto da
  // ação, e a Ficha não tem outra fonte para ele.
  const out = {
    id: acao?.id, nome: acao?.nome || "", descricao: acao?.descricao || "",
    classe, familia, custoPE: acao?.custoPE ?? 0, acaoComCusto,
    // A Ação recebida por Herança das Sombras leva o nome da sombra (Etapa 10).
    ...(acao?.herancaDe ? { herancaDe: acao.herancaDe } : {}),
  };
  const warnings = [];

  // Benefícios da Ação com Custo, agregados por tipo (cada PE compra o efeito da
  // tabela). Aplicados no dano/cura/alcance/área/acerto abaixo.
  const bens = { alcance: 0, area: 0, danoCura: 0, acertoCd: 0, condicoes: [] };
  let peBeneficios = 0;
  if (acaoComCusto) {
    for (const b of Array.isArray(acao?.beneficiosCusto) ? acao.beneficiosCusto : []) {
      if (b?.tipo === "condicao") {
        peBeneficios += INV_CUSTO_CONDICAO[b.nivel] ?? 0;
        if (b.nivel) bens.condicoes.push(b.nivel);
      } else if (b?.tipo && b.tipo in bens) {
        const pe = Math.max(0, Math.floor(Number(b.pe) || 0));
        bens[b.tipo] += pe;
        peBeneficios += pe;
      }
    }
  }

  let alcanceMetros = null;  // number | "corpo" | null
  let areaMetros = null;     // number | null

  if (familia === "ataque") {
    // Ação de Ataque é sempre Complexa.
    if (classe !== "complexa") warnings.push("Ação de Ataque deve ser Complexa.");
    const alvo = acao?.alvo === "multiplos" || acao?.alvo === "area" ? acao.alvo : "unico";
    const ataqueTipo = acao?.ataqueTipo === "tr" ? "tr" : "jogada";
    out.alvo = alvo; out.ataqueTipo = ataqueTipo;
    /* ⚠ DOIS CAMPOS, o id e o rótulo. O `tipoDano` virou id do `TIPOS_DANO`
       em 2026-09-02 (era texto livre), e quem MOSTRA não pode ficar traduzindo
       id à mão em cada tela. O fallback devolve o próprio valor, e é o que
       segura ficha antiga com "corte, impacto" escrito à mão. */
    out.tipoDano = acao?.tipoDano || "";
    out.tipoDanoLabel = TIPOS_DANO[out.tipoDano] ?? out.tipoDano;

    // Tabela de dano por (ataqueTipo, alvo).
    const tabela =
      alvo === "unico" ? (ataqueTipo === "tr" ? INV_DANO.trUnico : INV_DANO.jogadaUnico) :
      alvo === "multiplos" ? INV_DANO.multiplos : INV_DANO.area;
    const base = tabela[grau];
    const atributoChave = acao?.atributoChave || (ataqueTipo === "jogada" ? "forca" : "inteligencia");
    const danoBonus = bonusAttrMult(grau) * mod(inv?.atributos?.[atributoChave] ?? 8);
    if (base == null) {
      // Alvos Múltiplos/Área começam no Terceiro Grau: Quarto Grau não os tem.
      warnings.push(`Grau ${grauMeta(inv?.grau).label} não tem ataque de alvos ${alvo === "area" ? "em área" : "múltiplos"}.`);
      out.dano = { dado: null, bonus: danoBonus, atributoChave, indisponivel: true };
    } else {
      // Corpo a corpo: +3 níveis no dado.
      out.dano = { ...subirNiveisDano(base, acao?.corpoACorpo ? 3 : 0), bonus: danoBonus, atributoChave };
    }

    if (ataqueTipo === "jogada") {
      const treinado = (acao?.corpoACorpo ? "corpo" : "distancia") === inv?.ataqueTreinado;
      /* Auxílio de Acerto que a invocação ligou EM SI MESMA. Ele sobe a jogada
         de ataque dela, que é o único lugar onde "Acerto" quer dizer alguma
         coisa. Chega pelo dono local, montado no pré-passe do `resolveInvocacao`. */
      out.bonusAtaque = bonusTesteInvocacao(inv, dono, { atributo: atributoChave, treinado })
        + (dono.auxilioAcertoProprio ?? 0);
    } else {
      out.cd = cdAtaqueInvocacao(inv, dono, atributoChave);
      out.trTipo = acao?.trTipo || "reflexos";
      // O rótulo sai resolvido: a Ficha mostra "CD 18 Reflexos", e quem tem o
      // catálogo dos Testes de Resistência é este lado, não a tela.
      out.trTipoLabel = AFTY_RESISTENCIAS.find((r) => r.value === out.trTipo)?.label ?? out.trTipo;
    }

    alcanceMetros = acao?.corpoACorpo ? "corpo" : INV_ALCANCE[grau];
    if (alvo === "area") {
      areaMetros = INV_AREA[grau] ?? null;
      out.formaArea = acao?.formaArea || "";
    }
  } else {
    // Ação de Auxílio. Por padrão os auxílios têm alcance corpo a corpo (o livro
    // exige uma característica para estendê-lo), exceto a Cura, que segue a tabela.
    const sub = ["cura", "defesa", "acerto", "danoAdicional", "rd"].includes(acao?.auxilioSub) ? acao.auxilioSub : "defesa";
    out.auxilioSub = sub;
    out.alvoAuxilio = acao?.alvoAuxilio === "aliados" ? "aliados" : "invocacao";
    /* ⚠ ALCANCE AUXILIAR (2026-09-30, Adicionais): "Suas ações de auxílio usam o
       alcance normal sem precisar seguir a regra de redução". A redução é este
       corpo a corpo, e a Característica a tira: o auxílio passa a usar o alcance
       da tabela do grau, como a Cura. Não soma metro nenhum. */
    alcanceMetros = dono?.alcanceAuxiliar ? INV_ALCANCE[grau] : "corpo";

    if (sub === "cura") {
      const multi = acao?.alvo === "multiplos";
      const base = (multi ? INV_CURA.multiplos : INV_CURA.unico)[grau];
      const curaAttr = acao?.curaAttr === "presenca" ? "presenca" : "sabedoria";
      const curaBonus = bonusAttrMult(grau) * mod(inv?.atributos?.[curaAttr] ?? 8);
      if (base == null) {
        warnings.push(`Grau ${grauMeta(inv?.grau).label} não tem cura de alvos múltiplos.`);
        out.cura = { dado: null, bonus: curaBonus, curaAttr, indisponivel: true };
      } else {
        out.cura = { dado: base, bonus: curaBonus, curaAttr };
      }
      out.custoPE = Math.max(out.custoPE, 2); // recuperar PV custa 2 PE por uso (não é Ação com Custo)
      alcanceMetros = INV_ALCANCE[grau];
    } else if (sub === "defesa") {
      out.valor = classe === "complexa" ? complexaMult(INV_BONUS_DEFESA[grau]) : INV_BONUS_DEFESA[grau];
      out.prejuizoMultiplos = "-1 por uso repetido na rodada (até 0)";
    } else if (sub === "acerto") {
      out.valor = classe === "complexa" ? complexaMult(INV_BONUS_ACERTO[grau]) : INV_BONUS_ACERTO[grau];
      out.prejuizoMultiplos = "-1 por uso repetido na rodada (até 0)";
    } else if (sub === "rd") {
      const tiposExtras = Math.max(0, acao?.rdTiposExtras ?? 0);
      const base = classe === "complexa" ? complexaMult(INV_RD_ACAO[grau]) : INV_RD_ACAO[grau];
      out.valor = Math.max(0, base - 2 * tiposExtras);
      out.tiposExtras = tiposExtras;
      out.prejuizoMultiplos = "-1 por uso repetido na rodada (até 0)";
    } else if (sub === "danoAdicional") {
      // Complexa: +3 níveis.
      out.danoAdicional = subirNiveisDano(INV_DANO_ADICIONAL[grau], classe === "complexa" ? 3 : 0);
      out.prejuizoMultiplos = "-2 níveis por uso repetido na rodada (até 1d4)";
    }
    // "Recebe imunidade à mecânica Prejuízo por Múltiplos Auxílios."
    // Sai depois de os quatro sub-tipos escreverem, para pegar todos de uma vez.
    if (ehShikigamiDeTecnica(inv)) {
      out.prejuizoMultiplos = null;
      out.imunePrejuizoMultiplos = true;
    }
  }

  // Aplica os benefícios da Ação com Custo aos valores já resolvidos.
  if (bens.danoCura > 0) {
    const add = 2 * bens.danoCura;
    if (out.dano?.dado) out.dano = { ...out.dano, dado: subirNiveisDano(out.dano.dado, add).dado };
    if (out.cura?.dado) out.cura = { ...out.cura, dado: subirNiveisDano(out.cura.dado, add).dado };
    if (out.danoAdicional?.dado) out.danoAdicional = { ...out.danoAdicional, dado: subirNiveisDano(out.danoAdicional.dado, add).dado };
  }
  if (bens.acertoCd > 0) {
    if (out.bonusAtaque != null) out.bonusAtaque += bens.acertoCd;
    if (out.cd != null) out.cd += bens.acertoCd;
  }
  if (bens.condicoes.length) out.condicoes = bens.condicoes;

  // Escalonamento vindo de Habilidade do Controlador (Concentrar Poder,
  // Melhorias). Já chega 0 quando o marcador que o condiciona está desligado (o
  // `quando` filtra antes). DANO e CURA são canais separados: Concentrar Poder
  // alimenta os quatro, Agressividade só os dois de dano.
  /* ⚠ O BALDE DESTA AÇÃO (2026-09-14). O que veio mirado em `acaoAlvo` não
     entrou no total do canal de propósito (ver `efeitosHabilidade`): ele soma
     AQUI, e só na Ação de id igual. É o que faz *"escolha uma Ação de sua
     invocação"* virar número em vez de valer para todas as irmãs.

     ⚠ SÓ OS SETE DE `CANAIS_POR_ACAO` SÃO LIDOS AQUI, e essa lista não é
     estilo: o balde é um mapa por canal, e canal que ninguém vem buscar fica
     no mapa sem nunca virar número. Quem escreve `acaoAlvo` num canal de fora
     (Defesa, orçamento, custo) perde o efeito em SILÊNCIO. Ver a checagem em
     `efeitosInvocacaoEscritos` e o `soInvocacao` de afty-treinamentos.js. */
  const daAcao = (canal) => dono.porAcao?.[acao?.id]?.[canal] ?? 0;
  const danoNivel = (dono.danoNivelHabilidade ?? 0) + daAcao("danoNivel");
  const danoBonusHab = (dono.danoBonusHabilidade ?? 0) + daAcao("danoBonus");
  if (out.dano?.dado && (danoNivel > 0 || danoBonusHab > 0)) {
    out.dano = { ...out.dano, dado: subirNiveisDano(out.dano.dado, danoNivel).dado, bonus: (out.dano.bonus || 0) + danoBonusHab };
  }
  const curaNivel = (dono.curaNivelHabilidade ?? 0) + daAcao("curaNivel");
  const curaBonusHab = (dono.curaBonusHabilidade ?? 0) + daAcao("curaBonus");
  if (out.cura?.dado && (curaNivel > 0 || curaBonusHab > 0)) {
    out.cura = { ...out.cura, dado: subirNiveisDano(out.cura.dado, curaNivel).dado, bonus: (out.cura.bonus || 0) + curaBonusHab };
  }

  // Dado extra que todo ataque da invocação carrega (Melhoria Agressividade).
  // Vale para as duas formas de ataque: a Jogada de Ataque e o Teste de
  // Resistência são "ações de ataque" iguais para o texto da Melhoria.
  const extraMax = Math.max(dono.ataqueDanoAdicionalHabilidade ?? 0, daAcao("ataqueDanoAdicional"));
  if (familia === "ataque" && extraMax > 0) {
    const dado = dadoDoMaximo(extraMax);
    if (dado) out.danoExtraAtaque = { dado, grupos: dadosDaNotacao(dado) };
  }

  // Acerto e CD concedidos por Habilidade (Melhoria Precisão). Entram depois
  // dos benefícios da Ação com Custo, no mesmo lugar em que ela mexe.
  const acertoTotal = (dono.acertoHabilidade ?? 0) + daAcao("acerto");
  const cdTotal = (dono.cdHabilidade ?? 0) + daAcao("cd");
  if (out.bonusAtaque != null && acertoTotal) out.bonusAtaque += acertoTotal;
  if (out.cd != null && cdTotal) out.cd += cdTotal;

  // Alcance / área finais (base + benefícios por PE).
  if (alcanceMetros === "corpo") {
    out.alcance = bens.alcance > 0 ? `corpo a corpo (+${6 * bens.alcance} m)` : "corpo a corpo";
  } else if (alcanceMetros != null) {
    out.alcance = `${alcanceMetros + 6 * bens.alcance} m`;
  }
  if (areaMetros != null) {
    out.area = `${areaMetros + 3 * bens.area} m${acao?.formaArea === "linha" ? " (linha, dobrada)" : ""}`;
  }

  // Ação com Custo (opt-in do jogador): valida faixa de PE e a soma dos benefícios.
  // O custo obrigatório de 2 PE da Cura NÃO entra aqui, não é uma Ação com Custo.
  if (acaoComCusto) {
    const max = custoMaxAcao(grau);
    const custoUsuario = acao?.custoPE ?? 0;
    if (custoUsuario > max) warnings.push(`Custo ${custoUsuario} PE passa do máximo ${max} do grau.`);
    if (classe !== "complexa") warnings.push("Ação com Custo deve custar ao menos uma Ação Complexa.");
    if (peBeneficios > custoUsuario) warnings.push(`Benefícios usam ${peBeneficios} PE, mais que os ${custoUsuario} PE da ação.`);
    out.beneficiosCusto = Array.isArray(acao?.beneficiosCusto) ? acao.beneficiosCusto : [];
    out.beneficiosPE = peBeneficios;
  }

  /* Otimização de Energia (Controlador 2°): "escolher uma habilidade com custo
     de cada invocação para ter esse custo reduzido em 1PE".

     ⚠ Vale só para AÇÃO COM CUSTO, que é o termo definido do capítulo. Os 2 PE
     obrigatórios da Cura são custo de regra, e não a mecânica opcional, então
     ficam de fora. Está anotado em docs/a-fazer.md como assunção.

     O piso é 1 PE, que é o mínimo que uma Ação com Custo pode gastar. */
  /* ⚠ A REDUÇÃO AMPLA DE PE (canal `custoPE`, alvo `invocacao`) chega PRONTA do
     derive, no formato `[{ label, valor }]`, pela mesma razão do Domínio
     Simples: este módulo não importa `afty-efeitos.js`, e um import daqui para
     lá fecharia ciclo. Quem lê o canal é quem já tem o agregado na mão. */
  out.reducoesCustoPE = [];
  out.custoOtimizado = false;
  if (dono.otimizacaoEnergia && acao?.custoOtimizado) {
    if (acaoComCusto) {
      out.custoOtimizado = true;
      out.custoAntesDaOtimizacao = out.custoPE;
      out.custoPE = Math.max(1, out.custoPE - 1);
    } else {
      warnings.push("Otimização de Energia só vale para uma Ação com Custo.");
    }
  }

  /* A redução ampla entra DEPOIS da Otimização, e o piso de 1 PE vale no fim:
     as duas reduzem o mesmo gasto, e o piso é do gasto, não de cada parcela. */
  /* ⚠ O NEGATIVO É AUMENTO (condição Condenado, 2026-09-21), e soma DEPOIS do
     piso: ver `custoEmPe` em afty-efeitos.js. */
  const amplas = Array.isArray(dono.reducaoCustoPe) ? dono.reducaoCustoPe : [];
  const reducaoAmpla = amplas.filter((r) => (Number(r?.valor) || 0) > 0);
  const aumentoAmplo = amplas.filter((r) => (Number(r?.valor) || 0) < 0);
  if ((reducaoAmpla.length || aumentoAmplo.length) && out.custoPE > 0) {
    const total = reducaoAmpla.reduce((soma, r) => soma + Math.trunc(Number(r.valor) || 0), 0);
    const aumento = aumentoAmplo.reduce((soma, r) => soma - Math.trunc(Number(r.valor) || 0), 0);
    out.reducoesCustoPE = [...reducaoAmpla, ...aumentoAmplo].map((r) => ({ label: r.label, valor: r.valor }));
    out.custoPE = Math.max(1, out.custoPE - total) + aumento;
  }

  // Escape hatch DSL: um modificador numérico livre no contexto da invocação,
  // somado no alvo escolhido (Dano, Níveis de Dano, Acerto/CD, Cura ou Valor).
  //
  // ⚠ O contexto é o de `invCtx`, a invocação CRUA. O `inv` que chega aqui pode
  // trazer os atributos somados pelo canal `atributo`, e a expressão tem de ler
  // o mesmo valor base que o seletor de variáveis mostra (ver `atributosEfetivos`).
  aplicaModificador(out, acao, invCtx, dono, warnings, alvosDeModificador(acao));

  /* AS REGRAS DE AÇÃO DO ADICIONAIS (2026-10-01, Etapa 11). */
  // "Não é possível utilizar Manobras ou aplicar Condições como Ação Simples."
  if (classe === "simples" && acao?.manobra) warnings.push("Manobra não pode ser Ação Simples.");
  if (classe === "simples" && bens.condicoes.length) warnings.push("Condição não pode ser aplicada por Ação Simples.");
  out.manobra = !!acao?.manobra;
  /* "Ao criar uma Reação para sua Invocação, caso ela seja uma Ação Simples
     Auxiliar, seu valor é multiplicado por 1.5x." O valor numérico (Defesa,
     Acerto, RD), para baixo. */
  // A Cobertura é sempre Reação, e o multiplicador vale nela também.
  out.reacao = !!acao?.reacao || acao?.especial === "cobertura";
  if (out.reacao && classe === "simples" && familia === "auxilio" && Number.isFinite(out.valor)) {
    out.valorSemReacao = out.valor;
    out.valor = Math.floor(out.valor * 1.5);
  }
  /* As duas Ações especiais. ⚠ O PE delas é custo de uso, como os 2 PE da Cura, e
     não Ação com Custo: não entram no limite por grau. */
  if (acao?.especial === "reducaoCura") {
    // "reduzem a cura recebida pelo Alvo em 1/3. Ela é uma Ação Complexa que
    // custa 8 PE [...] reduz a cura pela metade por 10 PE [...] Esta Ação deve
    // pedir TR." Dura até o início do próximo turno do invocador (ou dela).
    const metade = acao.reducaoCura === "metade";
    out.especial = { tipo: "reducaoCura", rotulo: metade ? "Reduz Cura pela Metade" : "Reduz Cura em 1/3", custo: metade ? 10 : 8 };
    out.custoPE = Math.max(out.custoPE, out.especial.custo);
    if (classe !== "complexa") warnings.push("Reduzir Cura é Ação Complexa.");
    if (familia !== "ataque" || acao?.ataqueTipo !== "tr") warnings.push("Reduzir Cura deve pedir TR.");
  } else if (acao?.especial === "cobertura") {
    /* "Meia Cobertura e Cobertura 3/4, com um custo de 4PE (Grau 3) e 6 PE (Grau
       2), respectivamente como uma Reação": o custo e o grau mínimo (PV-04). Sem
       Cobertura Total. */
    const tres = acao.cobertura === "tresQuartos";
    const grauMin = tres ? "segundo" : "terceiro";
    out.especial = { tipo: "cobertura", rotulo: tres ? "Cobertura 3/4" : "Meia Cobertura", custo: tres ? 6 : 4 };
    out.custoPE = Math.max(out.custoPE, out.especial.custo);
    if (grauMeta(inv?.grau).rank < grauMeta(grauMin).rank) {
      warnings.push(`${out.especial.rotulo} pede ${grauMeta(grauMin).label} ou acima.`);
    }
  }

  out.warnings = warnings;
  return out;
}

/** Resolve uma Característica passiva pelas tabelas do grau. */
/** O custo máximo da arma ou armadura de uma Forma, pelo grau (decisão do autor,
    2026-09-30): Custo 1 no Quarto, 2 no Terceiro, 3 no Segundo, 4 no Primeiro e
    no Especial. */
export const CUSTO_DE_FORMA_POR_GRAU = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 4 };

/** Os tipos de ataque que a Aura de Acerto pode especificar (os do dono). */
const ROTULO_ATAQUE_DE_AURA = { corpo: "Corpo a Corpo", distancia: "A Distância", amaldicoado: "Amaldiçoado" };

/** O rótulo do alvo de uma Aura, pelo tipo de alvo dela. */
function rotuloDoAlvoDeAura(tipo, alvo) {
  if (!tipo || !alvo) return "";
  if (tipo === "ataque") return ROTULO_ATAQUE_DE_AURA[alvo] ?? alvo;
  if (tipo === "tr") return AFTY_RESISTENCIAS.find((r) => r.value === alvo)?.label ?? alvo;
  if (tipo === "pericia") return AFTY_PERICIAS.find((p) => p.id === alvo)?.nome ?? alvo;
  if (tipo === "tipoDano") return TIPOS_DANO[alvo] ?? alvo;
  return alvo;
}

export function resolveCaracteristica(carac, inv, dono = {}) {
  const grau = grauMeta(inv?.grau).value;
  /* ⚠ O SUBTIPO É O ID DO CATÁLOGO desde 2026-09-30 (Etapa 5). Os seis de antes
     estão no catálogo com o mesmo id, e por isso ficha salva não muda. Id que o
     catálogo não conhece segue caindo na Livre, como sempre caiu. */
  const entrada = caracteristicaDoCatalogo(carac?.subtipo);
  const sub = entrada ? entrada.id : "livre";
  // ⚠ A `descricao` viaja resolvida: é o texto que a pessoa escreveu para dizer
  // o que a Característica faz, e sem ela a Ficha mostrava só o nome, deixando
  // toda Característica "livre" (a que não tem número) sem conteúdo nenhum.
  const out = {
    id: carac?.id, nome: carac?.nome || "", subtipo: sub, descricao: carac?.descricao || "",
    catalogoNome: entrada?.nome ?? "Livre", grupoEfeito: entrada?.grupoEfeito ?? null,
  };
  const warnings = [];
  const parametros = (carac?.parametros && typeof carac.parametros === "object") ? carac.parametros : {};

  if (sub === "vida") {
    out.valor = INV_CARACT_VIDA[grau];
  } else if (sub === "teste") {
    const cheio = INV_CARACT_TESTE[grau];
    const emPericia = carac?.alvoTeste !== "ataque" && carac?.alvoTeste !== "tr";
    // Perícia: bônus cheio. Jogada de Ataque ou TR: metade (e exige gatilho).
    out.valor = emPericia ? cheio : Math.floor(cheio / 2);
    out.alvoTeste = carac?.alvoTeste || "pericia";
    // O livro diz "bônus fixo em um teste ESPECÍFICO", então o alvo viaja
    // resolvido: qual perícia, ou qual Teste de Resistência. Em Jogadas de
    // Ataque vale para todas, com o gatilho que o livro exige.
    if (emPericia) {
      out.periciaId = carac?.periciaId || "";
      if (!out.periciaId) warnings.push("Escolha a perícia deste bônus.");
    } else if (carac?.alvoTeste === "tr") {
      out.trTipo = carac?.trTipo || "";
      out.requerGatilho = true;
      if (!out.trTipo) warnings.push("Escolha o Teste de Resistência deste bônus.");
    } else {
      out.requerGatilho = true;
    }
  } else if (sub === "resistencia") {
    /* ⚠ TR TREINADA E TR MESTRE (decisão do autor, 2026-09-30, Adicionais): a
       faixa é ESCOLHA da Característica (`prof`), e não sai mais do grau. A
       Treinada vale em qualquer grau, e a Mestre só num TR em que a invocação já
       é treinada (quem confere é o `resolveInvocacao`, que enxerga a ficha).

       ⚠ A Característica salva antes, sem `prof`, lê a faixa que ela concedia:
       Mestre no Grau Especial e Treinado nos outros. Nada é convertido. O TR alvo
       reusa o campo `trTipo`, o mesmo do subtipo `teste`. */
    out.prof = carac?.prof === "mestre" || carac?.prof === "treinado"
      ? carac.prof
      : (grau === "especial" ? "mestre" : "treinado");
    out.profLabel = out.prof === "mestre" ? "Mestre" : "Treinado";
    out.trTipo = carac?.trTipo || "";
    out.trTipoLabel = AFTY_RESISTENCIAS.find((r) => r.value === out.trTipo)?.label ?? "";
    if (!out.trTipo) warnings.push("Escolha o Teste de Resistência desta Característica.");
    else if (!resistenciasTreinaveis().some((r) => r.value === out.trTipo)) {
      warnings.push(`${out.trTipoLabel || out.trTipo} não pode ser treinado por uma Invocação.`);
    }
  } else if (sub === "rd") {
    const tiposExtras = Math.max(0, carac?.rdTiposExtras ?? 0);
    out.valor = Math.max(0, INV_CARACT_RD[grau] - 2 * tiposExtras);
    out.tiposExtras = tiposExtras;
    // A RD da Característica cobre UM tipo de dano, escolhido na criação. O
    // tipo é o que decide se duas Características colidem (o livro proíbe
    // acumular RD ao mesmo tipo), então viaja resolvido.
    out.rdTipo = carac?.rdTipo || "";
    out.rdTipoLabel = rdTipoLabel(carac?.rdTipo, carac?.rdTipoOutro);
    out.rdChave = rdTipoChave(carac?.rdTipo, carac?.rdTipoOutro);
    if (!out.rdTipo) warnings.push("Escolha o tipo de dano desta RD.");
  } else if (sub === "tamanho") {
    out.faixa = tamanhosNaFaixa(grau);
    out.tamanho = carac?.tamanho || "";
    out.tamanhoLabel = AFTY_TAMANHOS.find((t) => t.value === out.tamanho)?.label ?? out.tamanho;
    if (out.tamanho && !out.faixa.includes(out.tamanho)) {
      warnings.push(`Tamanho "${out.tamanho}" fora da faixa do grau.`);
    }
  } else if (entrada?.categoria === "aura") {
    /* AS AURAS (2026-09-30, Etapa 6). Só do Segundo Grau em diante, e o valor sai
       da escala do grau. Ela não vale sozinha em ninguém: quem a liga no dono é a
       mesa ("Na Aura"), e o efeito vai pelo `canalDono`. Ver `aurasLigadasDa`. */
    out.aura = true;
    out.canalDono = entrada.canalDono;
    out.alvoParam = entrada.alvoParam ?? null;
    out.alvo = out.alvoParam ? (parametros[out.alvoParam] || "") : null;
    out.alvoLabel = rotuloDoAlvoDeAura(out.alvoParam, out.alvo);
    out.valor = valorPorGrau(entrada, grau) ?? 0;
    if (grauMeta(inv?.grau).rank < grauMeta(entrada.grauMin || "segundo").rank) {
      warnings.push("Aura só a partir do Segundo Grau.");
      out.valor = 0;
      out.bloqueada = true;
    } else if (out.alvoParam && !out.alvo) {
      warnings.push("Escolha o alvo desta Aura.");
      out.bloqueada = true;
    }
  } else if (entrada?.categoria === "intrinseca") {
    /* AS INTRÍNSECAS (2026-09-30, Etapa 6). A maioria é regra de mesa, e a ficha
       mostra o texto. As que viram número ou estado dizem qual no `efeito`, e o
       `agregarCaracteristicas` as junta. Requisito que falta trava o efeito e
       vira aviso, e a Característica continua na ficha. */
    out.intrinseca = true;
    out.efeito = entrada.efeito ?? null;
    const req = entrada.requisitos || {};
    const irmas = (inv?.caracteristicas || []).filter((c) => c !== carac).map((c) => c?.subtipo);
    const trava = (msg) => { warnings.push(msg); out.bloqueada = true; };
    if (req.tamanhoMin) {
      const tam = tamanhoBrutoDaInvocacao(inv);
      if (TAMANHO_ORDEM.indexOf(tam) < TAMANHO_ORDEM.indexOf(req.tamanhoMin)) {
        trava(`Pede tamanho ${AFTY_TAMANHOS.find((t) => t.value === req.tamanhoMin)?.label ?? req.tamanhoMin} ou maior.`);
      }
    }
    if (Array.isArray(req.requer) && !req.requer.some((id) => irmas.includes(id))) {
      trava(`Pede ${req.requer.map((id) => caracteristicaDoCatalogo(id)?.nome ?? id).join(" ou ")}.`);
    }
    if (Array.isArray(req.tipos) && !req.tipos.includes(regrasDoTipo(inv).value)) {
      trava(`Só em ${req.tipos.map((x) => regrasDoTipoValor(x).label).join(" ou ")}.`);
    }
    if (req.confirmacao && !parametros[req.confirmacao]) {
      trava("Pede o requisito do dono confirmado.");
    }
    if (out.efeito === "formaArma") {
      /* A arma: o custo segue o grau (Custo 1 no Quarto, 2 no Terceiro, 3 no
         Segundo, 4 no Primeiro e no Especial, decisão do autor), e o dono tem de
         ser treinado nela. */
      const arma = ARMAS.find((a) => a.id === parametros.arma) ?? null;
      out.arma = arma ? { id: arma.id, nome: arma.nome, custo: arma.custo } : null;
      out.custoMaximo = CUSTO_DE_FORMA_POR_GRAU[grau] ?? 1;
      if (!arma) trava("Escolha a arma.");
      else {
        if ((arma.custo ?? 1) > out.custoMaximo) trava(`${arma.nome} custa ${arma.custo}, e o grau aceita até ${out.custoMaximo}.`);
        if (Array.isArray(dono?.armasTreinadas) && !dono.armasTreinadas.includes(arma.id)) {
          trava(`O dono não é treinado em ${arma.nome}.`);
        }
      }
    } else if (out.efeito === "formaArmadura") {
      out.armadura = String(parametros.armadura || "").trim();
      out.custoMaximo = CUSTO_DE_FORMA_POR_GRAU[grau] ?? 1;
      if (!out.armadura) warnings.push("Escreva a armadura ou o uniforme.");
    } else if (out.efeito === "laceracao") {
      // "Grau da Invocação × 5, com o mínimo de 1", com o grau pelo rank (decisão do autor).
      out.valor = Math.max(1, grauMeta(inv?.grau).rank * 5);
    } else if (out.efeito === "corridaPerfurante") {
      // O teto de dados: o modificador do atributo de dano (o melhor de Força e Destreza).
      const at = inv?.atributos || {};
      out.valor = Math.max(0, mod(at.forca ?? 8), mod(at.destreza ?? 8));
    }
    if (entrada.parametros?.includes("percepcao")) out.percepcao = String(parametros.percepcao || "").trim();
    if (entrada.parametros?.includes("encantamento")) out.encantamento = String(parametros.encantamento || "").trim();
  } else if (entrada?.canal && entrada?.escala) {
    /* As MODIFICADORAS NUMÉRICAS do catálogo (Defesa, Nível de Dano, Dano Durante
       o Ataque, Aumento de Cura, e as de Addon): o valor sai da escala do grau
       e cai num canal da invocação. Quem soma e decide o "mesmo efeito" é o
       `agregarCaracteristicas`. */
    out.valor = valorPorGrau(entrada, grau);
    out.canal = entrada.canal;
  } else if (sub === "arsenal") {
    out.valor = valorPorGrau(entrada, grau);
  } else if (sub === "estiloCombate" || sub === "resilienciaAlternativa") {
    out.atributo = INV_ATTR_KEYS.includes(parametros.atributo) ? parametros.atributo : "";
    out.atributoLabel = out.atributo ? rotuloAttrInv(out.atributo) : "";
    if (!out.atributo) warnings.push("Escolha o atributo desta Característica.");
  } else if (sub === "resistenciaDano") {
    out.tipoDano = parametros.tipoDano || "";
    out.tipoDanoLabel = TIPOS_DANO[out.tipoDano] ?? out.tipoDano;
    if (!out.tipoDano) {
      warnings.push("Escolha o tipo de dano desta Resistência.");
    } else if (Array.isArray(dono?.resistenciasDePassiva) && !dono.resistenciasDePassiva.includes(out.tipoDano)) {
      /* "Possuir um Feitiço Passivo que garante Resistência, a resistência deve
         ser a mesma da passiva" (Adicionais). O Feitiço é do DONO (decisão do
         autor, 2026-09-30). Sem a lista no dono, ninguém confere. */
      warnings.push(`O dono não tem Feitiço Passivo com Resistência a ${out.tipoDanoLabel}.`);
    }
  } else if (sub === "livre") {
    /* ⚠ A LIVRE GANHOU O MOTOR em 2026-09-10. Autor: *"Faça igual Feitiços
       Passivas para Característica"*. A Passiva é o Feitiço cujo corpo é o
       Motor, e a Livre é a Característica cujo corpo é o Motor: ela continua
       ocupando uma vaga e somando 1 no custo, como toda Característica.

       As linhas saem TODAS, na ordem, até as vazias e as quebradas: o editor
       devolve a lista inteira a partir desta, e uma linha que sumisse aqui
       sumiria da ficha no próximo toque. Quem decide o que entra no número é o
       `ativo`, e a disputa com as outras Características é do
       `agregarCaracteristicas`. */
    out.efeitos = resolverMotorDaCaracteristica(carac?.efeitos, inv, dono, warnings);
    out.resumoMotor = out.efeitos
      .filter((e) => e.ativo && e.valor)
      .map((e) => resumoEfeitoInv(e.canal, e.alvo, e.valor))
      .join(" · ");
  }

  aplicaModificador(out, carac, inv, dono, warnings, alvosDeModificadorCaract(carac));

  out.warnings = warnings;
  return out;
}

// ------------------------------------------------------------
// Contexto de DSL (namespace próprio da invocação) + delega a fm-dsl
// ------------------------------------------------------------
/**
 * Um marcador está LIGADO nesta invocação? O registro dos marcadores é conteúdo
 * do Controlador e mora em `afty-habilidades.js`: aqui só se lê o estado.
 *
 * ⚠ Compat: antes do registro existia um marcador só, o booleano `inv.marcada`
 * do Concentrar Poder. Rascunho salvo com o shape velho continua valendo.
 */
export function marcadorLigado(inv, id) {
  const m = inv?.marcadores;
  if (m && typeof m === "object" && id in m) return !!m[id];
  if (id === "concentrar_poder") return !!inv?.marcada;
  return false;
}

/**
 * O mapa de Testes de Resistência treinados, aceitando os DOIS formatos.
 *
 * ⚠ A ficha antiga guardava `trTreinado` (um id) e `trMestre` (booleana). Ela
 * continua valendo sem migração de escrita, do mesmo jeito que o `marcadorLigado`
 * ainda entende o `marcada` do tempo do Concentrar Poder. Quem salva de novo
 * grava no formato novo, e quem nunca reabrir a ficha não perde nada.
 */
export function trProfDaInvocacao(inv) {
  const m = inv?.trProf;
  if (m && typeof m === "object") return m;
  const antigo = inv?.trTreinado;
  if (!antigo) return {};
  return { [antigo]: inv?.trMestre ? "mestre" : "treinado" };
}

/** Quantas vagas de TR o mapa gasta. Mestre custa 2, igual às perícias. */
export const usoTR = (prof = {}) =>
  Object.values(prof).reduce((s, v) => s + (v === "mestre" ? 2 : v ? 1 : 0), 0);

/* ⚠ O TETO É 1, que é EXATAMENTE o que o modelo antigo permitia (um save, com
   ou sem mestre). Virar mapa sem teto seria dar TR de graça a toda invocação já
   existente, calado. O que a Herança e a Quimera concedem entra por FUSÃO, que
   não passa por aqui e por isso não é aparado. */
export const TR_VAGAS_BASE = 1;

/* A escada das faixas de proficiência de uma Invocação. Serve para comparar
   duas concessões e ficar com a maior, e é lida em três lugares: a fusão da
   Herança das Sombras, a Quimera e a Característica de Teste de Resistência. */
const RANK_PROF_INV = { treinado: 1, mestre: 2 };

/** A opção escolhida de um marcador que tem `opcoes` (ex.: Precisão: acerto ou CD). */
export function marcadorOpcao(inv, id) {
  const p = inv?.marcadorOpcoes;
  return (p && typeof p === "object" ? p[id] : null) || null;
}

/**
 * As FONTES de um marcador: os ids de outras invocações da mesma ficha que esta
 * declarou como origem (as sombras mortas de quem ela herdou, as sombras
 * fundidas numa Quimera).
 *
 * ⚠ Só existe para marcador que pede (`fontes` no registro). Um marcador comum
 * devolve lista vazia, e as funções `fontes()` do DSL viram zero, que é o certo:
 * ausência de fonte é ausência do bônus, e não erro.
 */
export function marcadorFontes(inv, id) {
  const f = inv?.marcadorFontes;
  const lista = (f && typeof f === "object") ? f[id] : null;
  return Array.isArray(lista) ? lista.filter((x) => typeof x === "string" && x) : [];
}

// Variáveis `marc_*` do contexto: uma booleana por marcador ligado e, para os
// que têm opção, uma por opção (`marc_<id>_<opcao>`). É assim que um efeito
// como Precisão escolhe entre Acerto e CD sem precisar de canal condicional.
/* ⚠ O NOME DA VARIÁVEL É SANEADO, e não é firula (2026-08-31). O tokenizador da
   DSL só aceita `[a-zA-Z0-9_À-ſ]` num identificador, e o id de um marcador vindo
   de Addon carrega o namespace do pacote: `estrela-zenin:economia` viraria
   `marc_estrela-zenin:economia`, que não passa do parser. Todo caractere fora do
   conjunto vira `_`, então o `quando` daquele marcador se escreve
   `marc_estrela_zenin_economia`. Para os marcadores do raw isto não muda nada:
   os ids deles já são `[a-z_]`. */
export const varDeMarcador = (id) => `marc_${String(id ?? "").replace(/[^a-zA-Z0-9_]/g, "_")}`;

function varsDeMarcador(inv, dono) {
  const out = {};
  for (const m of Array.isArray(dono?.marcadores) ? dono.marcadores : []) {
    if (!m?.id) continue;
    /* ⚠ A CONDIÇÃO DE MESA (2026-09-30): o Concentrar Poder vale "enquanto
       estiver com apenas UMA invocação em campo". `dono.invocacoesEmCampo` só
       existe com mesa (Ficha e Encontro). No criador ele é `null`, e a marca vale
       sempre, como valia antes. */
    const condicaoOk = m.condicao !== "unicaEmCampo"
      || dono?.invocacoesEmCampo == null
      || dono.invocacoesEmCampo === 1;
    const on = condicaoOk && marcadorLigado(inv, m.id) ? 1 : 0;
    const base = varDeMarcador(m.id);
    out[base] = on;
    for (const o of Array.isArray(m.opcoes) ? m.opcoes : []) {
      out[`${base}_${String(o.value).replace(/[^a-zA-Z0-9_]/g, "_")}`] =
        on && marcadorOpcao(inv, m.id) === o.value ? 1 : 0;
    }
  }
  return out;
}

/**
 * O tamanho da invocação SEM resolver nada: quem manda é a Característica de
 * Tamanho, e o campo `inv.tamanho` é só o padrão.
 *
 * ⚠ Existe separado do `resolveInvocacao` de propósito. O contexto de DSL é
 * montado ANTES das Características resolverem (uma delas pode ler `tamanho`),
 * então ler o resultado delas aqui seria circular. O valor bruto da
 * Característica não depende de expressão nenhuma, e por isso é seguro.
 */
function tamanhoBrutoDaInvocacao(inv) {
  const c = (inv?.caracteristicas || []).find((x) => x?.subtipo === "tamanho" && x?.tamanho);
  return c?.tamanho || inv?.tamanho || "medio";
}

export function buildInvocacaoDslContext(inv, dono = {}, resolved = {}) {
  const at = inv?.atributos || {};
  const g = grauMeta(inv?.grau);
  const tipo = tipoInvocacaoMeta(inv?.tipoMecanico).value;
  const tam = resolved.tamanho ?? tamanhoBrutoDaInvocacao(inv);
  const marcas = varsDeMarcador(inv, dono);
  return {
    /* ⚠ AS FONTES ENTRAM PRIMEIRO e sob chave ilegível (`#fontes`), montadas
       pelo passe 1 do `resolveInvocacoesList`. Sem elas o objeto é o de sempre e
       as funções `fontes()` devolvem zero, que é o comportamento correto de uma
       invocação que não declarou origem nenhuma. */
    ...(dono?.[CHAVE_FONTES] ? { [CHAVE_FONTES]: dono[CHAVE_FONTES] } : {}),
    /* `sempre` e `nunca`, as duas constantes do Motor. Existiam só no contexto
       da CRIATURA (afty-efeitos.js), e o editor mostra "sempre" como exemplo no
       campo "enquanto": escrita numa Característica Livre, a palavra caía no
       zero e DESLIGAVA a linha, que é o engano de 2026-08-31 de novo. */
    sempre: 1,
    nunca: 0,
    ...marcas,
    // Invocação (nomes diretos)
    forca: at.forca ?? 8, destreza: at.destreza ?? 8, constituicao: at.constituicao ?? 8,
    inteligencia: at.inteligencia ?? 8, sabedoria: at.sabedoria ?? 8, presenca: at.presenca ?? 8,
    mod_forca: mod(at.forca), mod_destreza: mod(at.destreza), mod_constituicao: mod(at.constituicao),
    mod_inteligencia: mod(at.inteligencia), mod_sabedoria: mod(at.sabedoria), mod_presenca: mod(at.presenca),
    grau: g.rank, grau_num: g.num,
    pv_max: resolved.pv ?? pvInvocacao(inv, dono),
    defesa: resolved.defesa ?? defesaInvocacao(inv, dono),
    deslocamento: resolved.deslocamento ?? deslocamentoInvocacao(),
    /* TIPO MECÂNICO como booleana. Sem isto não dava para escrever efeito que
       vale só para um tipo, e o próprio `TECNICA_EFEITOS` precisou de um desvio
       em código (`efeitosDoTipo`) por falta de `quando: "tipo_tecnica"`.

       ⚠ OS SINAIS ESPECÍFICOS (2026-09-30, decisão do autor). Cada tipo tem o
       seu, e só ele liga: `tipo_shikigami_puro` (o Shikigami que não é de
       Técnica), `tipo_tecnica`, `tipo_maldicao`, `tipo_marionete`, `tipo_corpo`.
       Código oficial novo usa SÓ estes. */
    tipo_shikigami_puro: tipo === "shikigami" ? 1 : 0,
    tipo_tecnica: tipo === "tecnica" ? 1 : 0,
    tipo_maldicao: tipo === "maldicao" ? 1 : 0,
    tipo_marionete: tipo === "marionete" ? 1 : 0,
    tipo_corpo: tipo === "corpo" ? 1 : 0,
    /* ⚠ LEGACY. `tipo_shikigami` liga no Shikigami E na Maldição, porque nasceu
       quando a Maldição era "uma invocação de Talismã como a normal". Addon antigo
       pode tê-lo escrito com esse sentido, e por isso ele fica, com o sentido de
       sempre (e desligado na Marionete e no Corpo, que não existiam). Código
       oficial não o lê. */
    tipo_shikigami: tipo === "shikigami" || tipo === "maldicao" ? 1 : 0,
    /* Tamanho como DEGRAU (Miúdo 1 ... Colossal N), porque é assim que ele se
       move: a Característica de Tamanho sobe degraus, não centímetros. */
    tamanho: Math.max(0, TAMANHO_ORDEM.indexOf(tam)) + 1,
    // Quantas Ações e Características ela tem, para efeito que escala com isso.
    acoes: (inv?.acoes || []).length,
    caracteristicas: (inv?.caracteristicas || []).length,
    /* O custo em PE para invocar, ANTES de redução. Entrou em 2026-09-02 junto
       das fontes: a Quimera diz *"o Custo em PE é a soma de todas as invocações
       fundidas"*, e sem isto a soma não tinha o que somar. */
    custo: custoInvocacao(inv),
    // Alias herdado do tempo em que Concentrar Poder era o único marcador.
    // Prefira `marc_concentrar_poder`, que é o nome do registro.
    // ⚠ Segue a variável do marcador, com a condição de mesa (2026-09-30).
    marcada: marcas.marc_concentrar_poder ?? (marcadorLigado(inv, "concentrar_poder") ? 1 : 0),
    // Dono
    nd: dono.nd ?? 0, bt: dono.bt ?? 0, nivel_controlador: dono.nivelControlador ?? 0,
    /* O estilo do Apogeu como booleana. O Ápice do Controle precisa saber se a
       invocação JÁ podia ser trazida como Ação Livre, e quem dá isso é o
       Controle Concentrado. Os outros dois entram junto porque estão no mesmo
       campo e custam uma linha cada: sem eles, a próxima regra que citar estilo
       vira outro desvio em código. */
    apogeu_concentrado: dono.apogeuEstilo === "ctr_controle_concentrado" ? 1 : 0,
    apogeu_disperso: dono.apogeuEstilo === "ctr_controle_disperso" ? 1 : 0,
    apogeu_sintonizado: dono.apogeuEstilo === "ctr_controle_sintonizado" ? 1 : 0,
  };
}

// ------------------------------------------------------------
// Efeitos de Habilidade (Controlador) sobre a invocação
// ------------------------------------------------------------
// dono.efeitos é uma lista { canal, expr, quando? } vinda das Habilidades de
// Controlador escolhidas (ver afty-habilidades.js). Cada expr é avaliada pelo
// Motor no contexto DESTA invocação (grau, bt, nd, nivel_controlador, marcada...).
// `quando` (opcional) é uma expressão-condição: o efeito só entra se avaliar
// diferente de zero (ex.: "marc_concentrar_poder"). Aplicação canal a canal.
//
// ⚠ DANO e CURA têm canais SEPARADOS desde 2026-08-15. Concentrar Poder diz
// "toda rolagem de dano ou cura" e emite os quatro; Agressividade diz só dano e
// emite os dois de dano. Enquanto era um par só, Agressividade engordava a cura
// de graça.
/**
 * ============================================================
 * O CATÁLOGO DOS CANAIS DA INVOCAÇÃO
 * ============================================================
 * ⚠ ERA UMA LISTA DE IDS, com o sentido de cada um num comentário e o rótulo
 * que a tela mostrava morando no criador (`EFEITO_CANAL_LABEL`). Virou dado em
 * 2026-09-10, quando a Característica Livre ganhou o Motor: o seletor de canal
 * precisa do rótulo e do grupo, e a Ficha precisa do rótulo para resumir a
 * Característica. Duas listas envelheceriam separadas.
 *
 * `alvo` diz que o canal nomeia um destino, e qual é o vocabulário dele. Com
 * `alvoOpcional`, ficar sem alvo é o comportamento de sempre (RD contra todos
 * os tipos, bônus em todos os TRs). Sem ele o alvo é OBRIGATÓRIO: um bônus de
 * atributo sem atributo não tem onde cair, e vira aviso em vez de sumir.
 *
 * ⚠ `label` e `nota` aparecem na tela (a nota no `title` do seletor), e seguem
 * a regra dela: sem travessão e sem ponto-e-vírgula. O validador confere.
 */
export const INV_EFEITO_CANAIS = [
  { id: "pv",           label: "PV",           grupo: "Vida e Defesa", nota: "Pontos de Vida máximos" },
  /* ⚠ MULTIPLICADOR (2026-09-19), e não soma. Multiplica o PV FINAL, depois do PV
     base, do canal `pv` e da Característica de Vida, e por isso os bônus de vida
     das Habilidades também são multiplicados. VALE UMA VEZ SÓ: com várias fontes
     vale a MAIOR, nunca o produto nem a soma (autor: "não pode aumentar de novo o
     bônus de vida"). O valor é o multiplicador, então 1,5 vale uma vez e meia. */
  { id: "pvMult",       label: "Multiplicador de PV", grupo: "Vida e Defesa", nota: "Multiplica o PV final, já com os bônus de vida. Vale uma vez só: com mais de uma fonte vale a maior" },
  { id: "defesa",       label: "Defesa",       grupo: "Vida e Defesa" },
  { id: "rd",           label: "RD",           grupo: "Vida e Defesa", alvo: "rdTipo", alvoOpcional: true, nota: "Sem alvo vale contra todos os tipos. Com alvo, só contra aquele tipo de dano" },
  { id: "deslocamento", label: "Deslocamento", grupo: "Vida e Defesa", nota: "Em metros" },
  { id: "bonusTeste",   label: "Em Testes",    grupo: "Testes", nota: "Todos os testes da invocação" },
  { id: "bonusTR",      label: "Em TRs",       grupo: "Testes", alvo: "tr", alvoOpcional: true, nota: "Sem alvo vale em todos os Testes de Resistência" },
  { id: "bonusPericia", label: "Em Perícia",   grupo: "Testes", alvo: "pericia", nota: "Uma perícia, treinada ou não" },
  { id: "acerto",       label: "Em Acerto",    grupo: "Testes", nota: "Jogadas de Ataque das Ações" },
  { id: "cd",           label: "Em CD",        grupo: "Testes", nota: "CD das Ações por Teste de Resistência" },
  { id: "atributo",       label: "Atributo",           grupo: "Atributos e Perícias", alvo: "atributo", nota: "Soma no valor do atributo, até o máximo do grau" },
  { id: "atributoPontos", label: "Pontos de Atributo", grupo: "Atributos e Perícias", nota: "Pontos para distribuir" },
  { id: "limiteAtributo", label: "Limite de Atributo", grupo: "Atributos e Perícias", alvo: "atributo", alvoOpcional: true, nota: "Sobe o máximo por atributo do grau. Sem alvo vale para todos os atributos" },
  { id: "pericias",       label: "Perícias",           grupo: "Atributos e Perícias", nota: "Vagas de perícia treinada" },
  // ⚠ DANO e CURA são canais separados (ver o comentário de cima).
  { id: "danoNivel",  label: "Dano (níveis)", grupo: "Dano e Cura", nota: "Níveis na rolagem de dano" },
  { id: "danoBonus",  label: "Dano (total)",  grupo: "Dano e Cura", nota: "Soma no total da rolagem de dano" },
  { id: "curaNivel",  label: "Cura (níveis)", grupo: "Dano e Cura", nota: "Níveis na rolagem de cura" },
  { id: "curaBonus",  label: "Cura (total)",  grupo: "Dano e Cura", nota: "Soma no total da rolagem de cura" },
  // Trafega o MÁXIMO do dado, e não o dado (ver `dadoDoMaximo`).
  { id: "ataqueDanoAdicional", label: "Dado Extra no Ataque", grupo: "Dano e Cura", nota: "O máximo do dado: 6 é 1d6, 8 é 1d8" },
  { id: "orcamentoLivre",        label: "Ações/Caract. Grátis",   grupo: "Orçamento e Custo", nota: "Vagas que não entram no custo" },
  { id: "orcamentoPago",         label: "Ações/Caract.",          grupo: "Orçamento e Custo", nota: "Vagas que entram no custo" },
  { id: "caracteristicasLivres", label: "Características Grátis", grupo: "Orçamento e Custo", nota: "Vagas só de Característica, fora do custo" },
  { id: "custoReducao",          label: "Custo (abate)",          grupo: "Orçamento e Custo", nota: "Abate do custo em PE para invocar" },
];

/** Os ids, na forma que o resto do arquivo sempre leu. */
export const EFEITO_CANAIS = INV_EFEITO_CANAIS.map((c) => c.id);
const CANAL_VALIDO = new Set(EFEITO_CANAIS);
const CANAL_INV_BY_ID = Object.fromEntries(INV_EFEITO_CANAIS.map((c) => [c.id, c]));

/** O rótulo de cada canal, para o hover do criador e o resumo da Característica. */
export const INV_EFEITO_CANAL_LABEL = Object.fromEntries(INV_EFEITO_CANAIS.map((c) => [c.id, c.label]));

/** Os canais agrupados, no formato do seletor de canal do Motor. */
export const INV_EFEITO_CANAL_GRUPOS = (() => {
  const grupos = [];
  for (const c of INV_EFEITO_CANAIS) {
    let g = grupos.find((x) => x.label === c.grupo);
    if (!g) { g = { label: c.grupo, itens: [] }; grupos.push(g); }
    g.itens.push(c);
  }
  return grupos;
})();

/**
 * Os canais que um efeito mirado numa AÇÃO consegue entregar: são os que o
 * `resolveAcao` vai buscar no balde `porAcao` (ver o aviso ao lado do
 * `daAcao`). Qualquer outro canal com `acaoAlvo` entra num balde que ninguém
 * lê, e o efeito some sem erro nenhum.
 *
 * ⚠ Esta lista e o `daAcao` mudam JUNTOS. Quem ligar um canal novo por Ação
 * precisa acrescentá-lo aqui, senão a UI continuará escondendo o seletor e o
 * coletor continuará derrubando a mira.
 */
export const CANAIS_POR_ACAO = new Set([
  "danoNivel", "danoBonus", "curaNivel", "curaBonus", "ataqueDanoAdicional", "acerto", "cd",
]);

/**
 * ============================================================
 * O QUE O JOGADOR ESCREVE, MIRADO NA INVOCAÇÃO
 * ============================================================
 * Nasceu em 2026-09-15, a pedido do autor: *"a parte de shikigami é muito
 * pouco acessível pelas demais partes do site [...] desta forma sua técnica
 * poderia adicionar coisas em Shikigames"*.
 *
 * ⚠ O PROBLEMA NÃO ERA O CANAL, E SIM A PORTA. O espaço de canais da invocação
 * (`INV_EFEITO_CANAIS`) já cobria PV, Defesa, Acerto, TR, Perícia, orçamento de
 * Ações e custo em PE. O que faltava era quem podia escrever nele: até aqui só
 * CATÁLOGO chegava na invocação (Habilidade de Controlador, Talento,
 * Característica de Origem e Linha de Treinamento, todos pelo campo
 * `efeitosInvocacao` da entrada). Nada do que o JOGADOR escreve na própria
 * ficha tinha caminho.
 *
 * ⚠ A MARCA É `escopo: "invocacao"` NA LINHA, e não um campo separado por
 * fonte. A alternativa era dar a cada fonte um segundo array (a Técnica com
 * `tecnicaEfeitosInvocacao`, a Passiva com outro, o buff com outro), que é o
 * padrão do catálogo. Ela foi recusada porque são quatro esquemas para manter
 * em sincronia, e porque um Addon futuro precisaria de um quinto: com a marca
 * na linha, qualquer lista de efeitos do jogador ganha a porta de graça.
 *
 * ⚠ O PREÇO DA MARCA É O FILTRO DO OUTRO LADO, e ele não é opcional: os dois
 * espaços de canal repetem nomes com sentidos diferentes (`pv` da criatura
 * contra `pv` do shikigami). Uma linha de invocação que vazasse para o coletor
 * da criatura engordaria o PV do personagem calada, que é exatamente o risco
 * que o campo separado do catálogo evita. Por isso `efeitosDaTecnica`,
 * `efeitosDosPassivos` e `efeitosDaSessao` (afty-efeitos.js) DESCARTAM a linha
 * marcada, e há assert prendendo os dois lados.
 *
 * `invocacaoAlvo` mira UMA invocação, e vem do mesmo campo que a Linha de
 * Treinamento já usa: sem ele a linha vale para TODAS, que é o padrão.
 */
export function efeitosInvocacaoEscritos(creature) {
  const out = [];
  const colhe = (lista, origem, nome) => {
    for (const e of Array.isArray(lista) ? lista : []) {
      if (e?.escopo !== "invocacao") continue;
      const expr = String(e?.expr ?? "").trim();
      if (!expr || !CANAL_VALIDO.has(e?.canal)) continue;
      /* ⚠ A MIRA EM AÇÃO SÓ VIAJA NOS CANAIS QUE A AÇÃO LÊ. Num canal de fora
         (Defesa, orçamento, custo) o balde `porAcao` nunca é consultado, e o
         efeito sumiria sem erro. Aqui ela é DESCARTADA em vez de viajar, e a
         linha vale para a invocação inteira: perder a precisão da mira é
         visível na tela, perder o efeito não é. Mesmo problema que o
         `soInvocacao` resolve do lado das Linhas de Treinamento. */
      const miraAcao = e.acaoAlvo && CANAIS_POR_ACAO.has(e.canal) ? e.acaoAlvo : null;
      out.push({
        canal: e.canal,
        expr,
        origem,
        nome: String(e?.nome ?? "").trim() || nome,
        ...(e.alvo ? { alvo: e.alvo } : {}),
        ...(e.quando ? { quando: String(e.quando).trim() } : {}),
        ...(e.invocacaoAlvo ? { invocacaoAlvo: e.invocacaoAlvo } : {}),
        ...(miraAcao ? { acaoAlvo: miraAcao } : {}),
      });
    }
  };

  // 1. Funcionamento Básico: o principal, os adicionais do jogador e os de
  //    Addon, todos na lista que o `funcionamentosDaFicha` já entrega junta.
  for (const fb of funcionamentosDaFicha(creature)) {
    colhe(fb.efeitos, `funcionamento:${fb.id}`, fb.principal ? "Técnica" : (fb.nome || "Funcionamento Básico"));
  }
  // 2. Feitiço Passivo criado pelo jogador.
  for (const f of Array.isArray(creature?.feiticos) ? creature.feiticos : []) {
    if (f?.tipo !== "passivo") continue;
    colhe(f.efeitosPassivo, `feitico:${f.id}`, String(f.nome ?? "").trim() || "Passivo");
  }
  // 3. Buff de mesa, escrito na Ficha Final durante o jogo.
  colhe(creature?.buffsSessao, "sessao", "Buff");
  return out;
}

/** O vocabulário de alvo de um canal da invocação, no formato `{ value, label }`. */
export function alvoOpcoesInvocacao(tipo) {
  if (tipo === "atributo") return INV_ATTR_KEYS.map((k) => ({ value: k, label: rotuloAttrInv(k) }));
  // Os mesmos da Característica de Teste: todos menos Integridade.
  if (tipo === "tr") return resistenciasTreinaveis().map((r) => ({ value: r.value, label: r.label }));
  if (tipo === "pericia") return periciasParaInvocacao().map((p) => ({ value: p.id, label: p.nome }));
  // Sem o "Outro" livre da Característica de RD: um alvo de Motor tem de ser id.
  if (tipo === "rdTipo") return Object.entries(TIPOS_DANO).map(([value, label]) => ({ value, label }));
  return null;
}

/**
 * O alvo de um efeito, conferido contra o canal. Devolve `null` quando o canal
 * não tem alvo ou quando o alvo é opcional e ficou vazio, o id quando ele vale,
 * e `false` quando falta um alvo obrigatório ou ele não existe no vocabulário.
 */
function alvoDoEfeitoInv(canal, alvo) {
  const def = CANAL_INV_BY_ID[canal];
  if (!def?.alvo) return null;
  const id = String(alvo ?? "").trim();
  if (!id) return def.alvoOpcional ? null : false;
  return (alvoOpcoesInvocacao(def.alvo) || []).some((o) => o.value === id) ? id : false;
}

/** Soma um valor no acumulador de canais, no canal ou no alvo, e anota a parcela. */
function somaNoAcumulador(acc, canal, alvo, valor, nome) {
  if (alvo) {
    if (!acc.porAlvo[canal]) acc.porAlvo[canal] = {};
    acc.porAlvo[canal][alvo] = (acc.porAlvo[canal][alvo] || 0) + valor;
  } else {
    acc[canal] += valor;
  }
  if (valor) acc.detalhes.push({ nome, canal, ...(alvo ? { alvo } : {}), valor });
}

/** O nome curto do que um efeito mexe: "Defesa", "Força", "Acrobacia", "RD Queimante". */
function nomeDoEfeitoInv(canal, alvo) {
  const def = CANAL_INV_BY_ID[canal];
  if (!def) return String(canal ?? "");
  if (alvo) {
    const rotulo = (alvoOpcoesInvocacao(def.alvo) || []).find((o) => o.value === alvo)?.label ?? alvo;
    return canal === "rd" ? `RD ${rotulo}` : rotulo;
  }
  return def.label.replace(/^Em /, "");
}

/** Uma linha do Motor em texto curto, no formato que a Característica tipada já usa. */
function resumoEfeitoInv(canal, alvo, valor) {
  const nome = nomeDoEfeitoInv(canal, alvo);
  if (canal === "ataqueDanoAdicional") return `${dadoDoMaximo(valor) || valor} ${nome}`;
  if (canal === "rd") return `${valor} ${nome}`;
  return `${valor >= 0 ? "+" : "−"}${Math.abs(valor)} ${nome}`;
}

const AVISO_SEM_ALVO = {
  atributo: "Escolha o atributo deste efeito.",
  pericia: "Escolha a perícia deste efeito.",
  tr: "Escolha o Teste de Resistência deste efeito.",
  rdTipo: "Escolha o tipo de dano deste efeito.",
};

/**
 * As linhas do Motor de uma Característica Livre, RESOLVIDAS: cada uma volta
 * com `valor`, `ativo` e o vocabulário de alvo, que é o que o editor do criador
 * lê (o mesmo formato do Funcionamento Básico).
 *
 * O contexto é o da invocação CRUA, o mesmo dos efeitos de Habilidade e do
 * Modificador: é o que o seletor de variáveis mostra.
 */
function resolverMotorDaCaracteristica(lista, inv, dono, warnings) {
  const linhas = Array.isArray(lista) ? lista : [];
  if (!linhas.length) return [];
  const ctx = buildInvocacaoDslContext(inv, dono);
  return linhas.map((e) => {
    const def = CANAL_INV_BY_ID[e?.canal];
    const expr = String(e?.expr ?? "").trim();
    const quando = String(e?.quando ?? "").trim();
    const linha = {
      canal: e?.canal,
      expr: e?.expr ?? "",
      ...(e?.alvo ? { alvo: e.alvo } : {}),
      ...(e?.quando ? { quando: e.quando } : {}),
      alvoTipo: def?.alvo ?? null,
      alvoObrigatorio: !!def?.alvo && !def.alvoOpcional,
      valor: null,
      ativo: false,
    };
    // Linha vazia não avisa: é a que o botão acabou de criar.
    if (!def) {
      if (expr) warnings.push(`Canal de efeito desconhecido "${e?.canal}".`);
      return linha;
    }
    if (alvoDoEfeitoInv(e.canal, e.alvo) === false) {
      if (expr) warnings.push(AVISO_SEM_ALVO[def.alvo] ?? "Escolha o alvo deste efeito.");
      return linha;
    }
    if (!expr) return linha;
    linha.valor = evalNumber(expr, ctx, 0);
    linha.ativo = !quando || evalNumber(quando, ctx, 0) !== 0;
    return linha;
  });
}

/**
 * Os atributos da invocação com o canal `atributo` somado.
 *
 * ⚠ PARA NO MÁXIMO DO GRAU (autor, 2026-09-10), como o canal da criatura para
 * no limite de 20. O que passa do máximo vai para `perdas`, que vira aviso e
 * parcela negativa no hover: bônus perdido calado é o bug de julho dos
 * atributos da criatura. Um valor que JÁ passava do máximo (ficha fora da
 * regra) não é rebaixado aqui, porque o aviso dele é outro.
 *
 * ⚠ Só entram as chaves com bônus. Sem nenhum, a invocação volta a MESMA, e
 * nada muda para quem não usa o canal.
 */
function atributosEfetivos(inv, efe) {
  const bonus = efe.porAlvo?.atributo || {};
  const chaves = Object.keys(bonus).filter((k) => bonus[k]);
  if (!chaves.length) return { invEf: inv, aplicado: {}, perdas: [] };
  const tab = INV_ATRIBUTOS_POR_GRAU[grauMeta(inv?.grau).value] || INV_ATRIBUTOS_POR_GRAU.quarto;
  const base = atributoBaseInvocacao(inv);
  const at = { ...(inv?.atributos || {}) };
  const aplicado = {};
  const perdas = [];
  /* O canal `limiteAtributo` sobe o teto do grau (2026-09-15). Sem alvo vale
     para os seis; com alvo, só para aquele atributo. Os dois somam, então uma
     Técnica que suba o geral em 2 e a Força em mais 2 dá Força 4 acima. */
  const limiteGeral = Math.max(0, Math.trunc(Number(efe.limiteAtributo) || 0));
  const limitePorAtributo = efe.porAlvo?.limiteAtributo || {};
  for (const k of chaves) {
    const bruto = at[k] ?? base;
    let v = bruto + bonus[k];
    const max = tab.max + limiteGeral + Math.max(0, Math.trunc(Number(limitePorAtributo[k]) || 0));
    const teto = Math.max(bruto, max);
    if (bonus[k] > 0 && v > teto) {
      perdas.push({ k, perdido: v - teto, max });
      v = teto;
    }
    at[k] = v;
    aplicado[k] = v - bruto;
  }
  return { invEf: { ...inv, atributos: at }, aplicado, perdas };
}

/**
 * ============================================================
 * SHIKIGAMI DE TÉCNICA — o que o TIPO concede
 * ============================================================
 * Escrito como efeito de canal, e não como conta solta no `resolveInvocacao`,
 * por dois motivos: a `expr` enxerga `grau` (o rank, 1 no Quarto e 5 no
 * Especial), que é exatamente como as três regras escalam, e assim as parcelas
 * aparecem nomeadas no hover de fontes junto das Habilidades de Controlador.
 *
 * As regras que NÃO têm canal (turno próprio, desvantagem alheia e a imunidade
 * ao Prejuízo por Múltiplos Auxílios) saem em `tracosDeTecnica` e no
 * `resolveAcao`. A regra do exorcismo (Mecânicas, 2026-09-30) é estado de mesa,
 * e mora na sessão.
 */
/**
 * ⚠ Eles são efeitos NORMAIS, com `quando`, e não um caso especial. Até a
 * variável `tipo_tecnica` existir (2026-08-17) o motor não tinha como dizer
 * "este efeito vale só para este tipo", e a seleção precisava de um desvio em
 * código. Agora a regra de tipo se escreve como qualquer outra, o que vale para
 * o próximo tipo que o autor inventar.
 */
export const TECNICA_EFEITOS = [
  // "Sua Vida base aumenta em 10, aumentado em +5 para cada grau subsequente."
  { canal: "pv", expr: "10 + 5 * (grau - 1)", quando: "tipo_tecnica" },
  // "Recebe um bônus em todas as rolagens igual seu grau (G4 = +1, até GE = +5)."
  // ⚠ Só TESTES (autor, 2026-08-16): acerto, Testes de Resistência e perícias.
  { canal: "bonusTeste", expr: "grau", quando: "tipo_tecnica" },
  // "Recebe +1 Característica no 4º Grau (que não aumenta o custo da Invocação)."
  // ⚠ ACUMULA por grau (autor): 1 no Quarto e 5 no Especial. Vai num canal
  // próprio porque a vaga é exclusiva de Característica, e o orçamento comum
  // aceitaria uma Ação no lugar.
  { canal: "caracteristicasLivres", expr: "grau", quando: "tipo_tecnica" },
];

/** Os efeitos do TIPO da invocação, que se somam aos das Habilidades do dono.

    ⚠ O `nome` SAI DA TABELA DE TIPOS, e não é escrito à mão: ele aparece no
    hover de fontes de PV, Defesa e Orçamento, e escrito à mão divergiria do
    rótulo do chip na primeira renomeação. Foi o que quase aconteceu em
    2026-09-02, quando o autor trocou "Shikigami de Técnica" por
    "Invocação de Técnica". */
const NOME_TIPO_TECNICA = AFTY_INV_TIPOS.find((t) => t.value === "tecnica")?.label ?? "Técnica";
const NOME_TIPO_MALDICAO = AFTY_INV_TIPOS.find((t) => t.value === "maldicao")?.label ?? "Maldição";
/* A Maldição: a vida vale 1,5 vez o PV já somado (base, canal `pv` e Característica
   de Vida), então os bônus de vida das Habilidades também são multiplicados. O
   canal `pvMult` vale uma vez só: com outra fonte de multiplicador vale a maior. */
const MALDICAO_EFEITOS = [
  { canal: "pvMult", expr: "1.5", quando: "tipo_maldicao" },
];
const EFEITOS_DE_TIPO = [
  ...TECNICA_EFEITOS.map((e) => ({ ...e, origem: "tecnica", nome: NOME_TIPO_TECNICA })),
  ...MALDICAO_EFEITOS.map((e) => ({ ...e, origem: "maldicao", nome: NOME_TIPO_MALDICAO })),
];

/* ============================================================
   OS TIPOS ESPECIAIS (2026-09-30, Etapa 8)
   ============================================================ */

/** Os canais que AUMENTAM Ações e Características. A Maldição Domada não os
    recebe: "Efeitos que aumentam ações e características como 'Visionário' não
    podem ser aplicados em maldições Domadas" (Mecânicas). Quem diz é o tipo
    (`regras.visionario`), e os efeitos do próprio tipo passam. */
const CANAIS_DE_ORCAMENTO = new Set(["orcamentoLivre", "orcamentoPago", "caracteristicasLivres"]);

/** As naturezas do Corpo Amaldiçoado (Mecânicas): o boneco, que se repara por
    Ofício (Alfaiate), e o biológico, por Cura Aprimorada ou Medicina. */
export const NATUREZAS_DE_CORPO = [
  { value: "boneco", label: "Boneco" },
  { value: "biologico", label: "Biológico" },
];
const NATUREZA_VALIDA = new Set(NATUREZAS_DE_CORPO.map((n) => n.value));

/** A natureza gravada na ficha do Corpo, ou "" quando não escolhida (ou quando
    a ficha nem é de Corpo: o campo sobra de uma troca de tipo e não vale nada). */
export const naturezaDoCorpo = (inv) =>
  (regrasDoTipo(inv).familia === "corpo" && NATUREZA_VALIDA.has(inv?.natureza) ? inv.natureza : "");

/**
 * As refeições do Ofício (Cozinheiro) que um Corpo Biológico pode receber: as do
 * Livro (Ferramentas de Cozinheiro, conferidas em 2026-10-01 pela decisão PV-20),
 * menos a Energética ("O efeito de Energética não pode ser aplicado em Corpos
 * Amaldiçoados").
 */
export const REFEICOES_DE_CORPO = [
  { value: "leve", label: "Leve" },
  { value: "nutritiva", label: "Nutritiva" },
  { value: "picante", label: "Picante" },
  { value: "reforcada", label: "Reforçada" },
  { value: "refrescante", label: "Refrescante" },
  { value: "revigorante", label: "Revigorante" },
];
const REFEICAO_POR_VALOR = Object.fromEntries(REFEICOES_DE_CORPO.map((r) => [r.value, r]));

/**
 * A refeição do Corpo Biológico, resolvida: "ele recebe um dos efeitos do Ofício
 * Cozinheiro permanentemente, considerando a BT de seu Criador" (Mecânicas). O
 * Criador é o dono, então o "grau do cozinheiro" das refeições Leve e Revigorante
 * é o grau do dono (rank 1 a 5), e a "metade do bônus de treinamento" da Nutritiva
 * é a BT dele. Devolve `null` sem refeição, ou `{ id, nome, texto, efeitos }`.
 *
 * As quatro de número viram efeito de canal, no mesmo cano das Habilidades. A
 * Refrescante e a Revigorante são de uso ("Efeitos que garantem bônus temporários
 * são recuperados num Descanso Curto ou Longo"), e saem como texto com o número.
 */
export function refeicaoDoCorpo(inv, dono = {}) {
  if (naturezaDoCorpo(inv) !== "biologico") return null;
  const meta = REFEICAO_POR_VALOR[inv?.refeicao];
  if (!meta) return null;
  const rank = Math.max(1, Math.min(5, Math.trunc(Number(dono.grauRankDono) || 1)));
  const bt = Math.max(0, Math.trunc(Number(dono.bt) || 0));
  const nome = `Refeição ${meta.label}`;
  const linha = (canal, valor, alvo = null) => ({
    canal, expr: String(valor), nome, origem: "refeicao", ...(alvo ? { alvo } : {}),
  });
  switch (meta.value) {
    case "leve":
      return { id: meta.value, nome, texto: `+${3 * rank} m de Deslocamento`, efeitos: [linha("deslocamento", 3 * rank)] };
    case "nutritiva": {
      // "+2 em um número de TRs igual a metade do bônus de treinamento do cozinheiro".
      const limite = Math.floor(bt / 2);
      const validos = new Set(AFTY_RESISTENCIAS.map((r) => r.value));
      const trs = [...new Set((Array.isArray(inv?.refeicaoTrs) ? inv.refeicaoTrs : []).filter((t) => validos.has(t)))]
        .slice(0, limite);
      return {
        id: meta.value, nome, limiteTrs: limite, trs,
        texto: `+2 em ${limite} ${limite === 1 ? "TR" : "TRs"}`,
        efeitos: trs.map((t) => linha("bonusTR", 2, t)),
      };
    }
    case "picante":
      return { id: meta.value, nome, texto: "+2 em Jogadas de Ataque", efeitos: [linha("acerto", 2)] };
    case "reforcada":
      return { id: meta.value, nome, texto: "+2 na Defesa", efeitos: [linha("defesa", 2)] };
    case "refrescante":
      return { id: meta.value, nome, texto: "Um Teste com Vantagem por Descanso", efeitos: [] };
    case "revigorante":
      return { id: meta.value, nome, texto: `${5 * rank} PV Temporários por Descanso`, pvTemp: 5 * rank, efeitos: [] };
    default:
      return null;
  }
}

/** As imunidades que a invocação traz pelo tipo: as da Marionete, e as do Corpo
    boneco ("Caso o Corpo Amaldiçoado seja um boneco, ele é imune à condição
    Envenenado e a venenos não amaldiçoados"). */
export function imunidadesDoTipo(inv) {
  const out = [...regrasDoTipo(inv).imunidadesNaturais];
  if (naturezaDoCorpo(inv) === "boneco") out.push("Envenenado", "Venenos Não Amaldiçoados");
  return [...new Set(out)];
}

/**
 * A CD de Criação de Itens do Livro (Interlúdio), por Ofício e Custo 1 a 4. São
 * três colunas: Alquimia, Canalizador e Ferreiro, depois Entalhador e
 * Farmacêutico, e o Alfaiate sozinho.
 */
const CD_DE_CRIACAO_POR_OFICIO = {
  Alquimia: [15, 20, 25, 30], Canalizador: [15, 20, 25, 30], Ferreiro: [15, 20, 25, 30],
  Entalhador: [15, 20, 25, 35], "Farmacêutico": [15, 20, 25, 35],
  Alfaiate: [15, 20, 30, 40],
};
/** Os Ofícios com que uma Marionete pode ser feita (e reparada). O Mecânicas dá
    o Ferreiro (robô) e o Entalhador (madeira) como exemplo, e manda seguir "as
    regras do Ofício correspondente": a lista é a da tabela de Criação de Itens. */
export const OFICIOS_DE_MARIONETE = Object.keys(CD_DE_CRIACAO_POR_OFICIO);

/**
 * O reparo do Desmembramento (ou a reconstrução da Marionete), pelo tipo. O Custo
 * vem do grau, igual nos três tipos do Mecânicas: "Custo 1 = Grau 4, Custo 2 =
 * Grau 3, Custo 3 = Grau 2, Custo 4 = Grau 1 e Especial". A CD sai da tabela de
 * Criação de Itens, pela coluna do Ofício do reparo, e fica `null` só quando
 * falta escolher o material.
 *
 * ⚠ O Corpo biológico não se repara por Ofício ("através de Cura Aprimorada ou
 * pela perícia Medicina"), mas o Mecânicas manda a CD seguir a mesma tabela "em
 * ambos os casos". A coluna é a do Farmacêutico, o Ofício médico da tabela
 * (decisão do autor, 2026-10-03). O `oficio` dele fica vazio, porque nenhum
 * Ofício é via de reparo: a coluna aparece só na parcela do hover.
 *
 * Devolve `null` para quem não se repara (a Maldição), ou
 * `{ vias: [rótulos], oficio, custo, cd, partesCd, quando, falta }`, com
 * `partesCd` sendo a parcela do hover da CD (a coluna e o Custo que a escolheram).
 */
export function reparoDaInvocacao(inv) {
  const r = regrasDoTipo(inv);
  if (!r.reparo) return null;
  const custo = CUSTO_DE_FORMA_POR_GRAU[grauMeta(inv?.grau).value] ?? 1;
  const cdDo = (coluna) => {
    const cd = coluna ? CD_DE_CRIACAO_POR_OFICIO[coluna]?.[custo - 1] ?? null : null;
    const partesCd = cd == null ? [] : [{ label: `Criação de Itens · ${coluna} (Custo ${custo})`, valor: cd, texto: String(cd) }];
    return { cd, partesCd };
  };
  if (r.reparo === "material") {
    const oficio = OFICIOS_DE_MARIONETE.includes(inv?.oficio) ? inv.oficio : "";
    return {
      vias: oficio ? [`Ofício (${oficio})`] : [], oficio, custo, ...cdDo(oficio),
      quando: "Ação Comum", falta: !oficio,
    };
  }
  if (r.reparo === "natureza") {
    const natureza = naturezaDoCorpo(inv);
    if (natureza === "boneco") {
      return { vias: ["Ofício (Alfaiate)"], oficio: "Alfaiate", custo, ...cdDo("Alfaiate"), quando: "Descanso Longo", falta: false };
    }
    if (natureza === "biologico") {
      return { vias: ["Cura Aprimorada", "Medicina"], oficio: "", custo, ...cdDo("Farmacêutico"), quando: "Descanso Longo", falta: false };
    }
    return { vias: [], oficio: "", custo, ...cdDo(""), quando: "Descanso Longo", falta: true };
  }
  // Shikigami (e a Técnica, que herda): "Cura Aprimorada ou do Ofício de Canalizador".
  return {
    vias: ["Cura Aprimorada", "Ofício (Canalizador)"], oficio: "Canalizador", custo, ...cdDo("Canalizador"),
    quando: "Descanso Longo", falta: false,
  };
}

/**
 * A TÉCNICA INATA E O FUNDAMENTO (decisões do autor DA-04, DA-07 e PV-15,
 * 2026-09-30). O Mecânicas: "Para utilizar sua Técnica Inata, o feiticeiro deve
 * manter esse shikigami invocado. Caso ele seja exorcizado, o invocador perde
 * acesso à sua Técnica Inata", e o 2º exorcismo antes do descanso longo o mata.
 *
 * Pura: lê a ficha e o mapa de mesa (`sessao.invocacoes`, ou `null` no criador).
 * Dois bloqueios, com pesos diferentes:
 *
 *   perdida      o Fundamento morreu. PERMANENTE: gravado na ficha em
 *                `creature.fundamentosPerdidos` (nada é apagado, e a Técnica e os
 *                Feitiços continuam lá, marcados como indisponíveis). Antes da
 *                gravação, a mesa já mostra a perda pelo estado "morta".
 *   foraDeCampo  há mesa, e o Fundamento não está em campo. Bloqueia Feitiços,
 *                Funcionamento e Passivas enquanto ele estiver fora. Só a mesa
 *                sabe disso, e o criador nunca vê (autor, 2026-10-03).
 *
 * `aRegistrar` diz à Ficha que a morte aconteceu e ainda não foi gravada.
 */
export function estadoDaTecnicaInata(creature, mapaSessao = null) {
  const fundamentos = (Array.isArray(creature?.invocacoes) ? creature.invocacoes : [])
    .filter((i) => i?.fundamento && ehShikigamiDeTecnica(i));
  const registros = (Array.isArray(creature?.fundamentosPerdidos) ? creature.fundamentosPerdidos : [])
    .filter((r) => r && typeof r === "object" && r.invocacaoId);
  const temMesa = !!mapaSessao && typeof mapaSessao === "object";
  const estadoDe = (f) => (temMesa ? estadoDaLinha(mapaSessao[f.id]) : null);
  const morto = fundamentos.find((f) => estadoDe(f) === "morta") ?? null;
  const perdida = registros.length > 0 || !!morto;
  const foraDeCampo = !perdida && temMesa && fundamentos.length > 0
    && !fundamentos.some((f) => estadoDe(f) === "ativa");
  return {
    fundamentoIds: fundamentos.map((f) => f.id),
    perdida, foraDeCampo,
    bloqueada: perdida || foraDeCampo,
    motivo: perdida ? "Fundamento Perdido" : foraDeCampo ? "Fundamento Fora de Campo" : null,
    registros,
    aRegistrar: morto && !registros.some((r) => r.invocacaoId === morto.id)
      ? { invocacaoId: morto.id, nome: morto.nome || "" }
      : null,
  };
}

/** Os efeitos que a ficha DESTA invocação gera pelo tipo dela: hoje, a refeição
    do Corpo Biológico. Entram no acumulador junto dos efeitos do tipo. */
function efeitosDaFichaDoTipo(inv, dono) {
  return [...(refeicaoDoCorpo(inv, dono)?.efeitos ?? []), ...efeitosDeHeranca(inv)];
}

/**
 * A duração do Corpo Amaldiçoado: "eles duram uma quantidade de rodadas em
 * combate igual ao seu CL. Você pode mantê-los ativos após isso gastando 1 de PE,
 * caso eles sejam de Quarto a Segundo Grau, ou 2 de PE, caso eles sejam de
 * Primeiro a Grau Especial por rodada. Fora de combate, Corpos Amaldiçoados duram
 * uma quantidade de horas igual ao seu CL" (Mecânicas). O CL é o do Controlador,
 * sem mínimo (decisão do autor, PV-01). Quem conta as rodadas é a sessão.
 */
function duracaoDoCorpo(regras, g, dono) {
  if (!regras.duracaoPorCL) return null;
  const cl = Math.max(0, Math.trunc(Number(dono.clControlador) || 0));
  return {
    rodadas: cl, horas: cl, manutencao: g.rank >= 4 ? 2 : 1,
    partes: [{ label: "CL do Controlador", valor: cl }],
  };
}

/** O Nível de Aptidão da Maldição Domada: "igual à metade do modificador de
    Presença do controlador" (Mecânicas), para baixo e com mínimo 0 (PV-11). */
function nivelAptidaoDaMaldicao(regras, dono) {
  if (!regras.aptidoes) return null;
  const valor = Math.max(0, Math.floor(Math.trunc(Number(dono.modPresenca) || 0) / 2));
  return { valor, partes: [{ label: "Metade da Presença do Controlador", valor }] };
}

/**
 * Os TRs que o tipo manda para o INVOCADOR: "Caso ela receba Dano Psíquico ou TRs
 * de Vontade ou Astúcia, os efeitos e danos são aplicados diretamente ao
 * Invocador" (Marionete). A linha continua no stat block, com o número do dono e
 * a marca `doInvocador`, para a mesa rolar o teste certo.
 */
function trsPeloInvocador(testes, regras, dono) {
  const ids = regras.trsDoInvocador ?? [];
  if (!ids.length) return testes;
  const doDono = dono.trsDoDono ?? {};
  return {
    ...testes,
    resistencias: testes.resistencias.map((r) => {
      if (!ids.includes(r.value)) return r;
      const d = doDono[r.value];
      if (!d) return { ...r, doInvocador: true };
      return {
        ...r, doInvocador: true, treinado: !!d.prof, mestre: d.prof === "mestre", bonus: d.bonus,
        partes: [{ label: "TR do Invocador", valor: d.bonus }],
      };
    }),
  };
}

/**
 * A Iniciativa de quem tem turno próprio (o Shikigami de Técnica: "devendo
 * realizar uma Jogada de Iniciativa ao ser Invocado"). O Livro: "Iniciativa =
 * Modificador de Destreza + Outros Bônus", e os outros bônus de uma invocação são
 * os do canal de todos os testes (o grau da Técnica, o Controle Aprimorado).
 */
function iniciativaDaInvocacao(inv, regras, efe) {
  if (!regras.turnoProprio) return null;
  const des = mod(inv?.atributos?.destreza ?? 8);
  return {
    bonus: des + (efe.bonusTeste || 0),
    partes: [{ label: "Destreza", valor: des }, ...parcelasDoCanal(efe.detalhes, "bonusTeste")],
  };
}

function efeitosHabilidade(inv, dono) {
  const acc = Object.fromEntries(EFEITO_CANAIS.map((c) => [c, 0]));
  acc.detalhes = []; // { nome (fonte), canal, valor } por efeito aplicado
  // ⚠ Canal que não existe some CALADO se ninguém olhar: o `continue` abaixo
  // descartava o efeito inteiro sem deixar rastro, e um erro de digitação num
  // nome de canal viraria uma habilidade que simplesmente não faz nada. Vira
  // aviso na ficha (resolveInvocacao) em vez de silêncio.
  acc.canaisDesconhecidos = [];
  /* Os canais com ALVO somam por destino, fora do número do canal: um +2 em
     Fortitude não pode entrar nos outros quatro TRs. */
  acc.porAlvo = {};
  /* Efeito de canal com alvo obrigatório que chegou sem ele (ou com um que não
     existe). Mesma família do canal desconhecido: sem aviso, a habilidade
     simplesmente não faria nada. */
  acc.semAlvo = [];
  /* ⚠ `acaoAlvo` (2026-09-14): o segundo nível da mira. Enquanto o
     `invocacaoAlvo` diz QUAL invocação, este diz QUAL AÇÃO dentro dela, e é o
     que o livro pede quando escreve *"escolha uma Ação de sua invocação"*.

     Ele NÃO pode entrar no acumulador comum: aquele é um total por canal, lido
     de uma vez por todas as Ações (é assim que a Melhoria Agressividade sobe o
     dado de TODO ataque). Um bônus de uma Ação só precisa de balde próprio,
     senão vazaria para as irmãs. Quem soma os dois é o `resolveAcao`, que é o
     único lugar que sabe qual Ação está resolvendo. */
  acc.porAcao = {};
  // Os efeitos do TIPO entram junto dos das Habilidades, no mesmo acumulador,
  // para o hover mostrar as duas origens lado a lado.
  //
  // ⚠ `invocacaoAlvo` (2026-09-14): uma Linha de Treinamento `alvoTipo:
  // "invocacao"` treina UMA invocação por pega (mesmo padrão do Manejo de
  // Arma, que treina UMA arma por pega). O efeito chega em `dono.efeitos`
  // marcado com o id da invocação escolhida, e só vale para ELA — as outras
  // não veem nada, ao contrário de todo efeito de Habilidade/Talento/
  // Característica/Treino sem alvo, que vale para todas por igual.
  /* ⚠ A MALDIÇÃO NÃO RECEBE VAGA A MAIS (2026-09-30, Etapa 8). O efeito do dono
     num canal de orçamento é posto de lado, e não some calado: ele vai para
     `vetadosPeloTipo`, que o hover do orçamento mostra. Os do tipo nunca são
     vetados, porque o tipo é quem dita a regra. */
  acc.vetadosPeloTipo = [];
  const regras = regrasDoTipo(inv);
  const doDono = (Array.isArray(dono?.efeitos) ? dono.efeitos : []).filter((e) => {
    if (regras.visionario || !CANAIS_DE_ORCAMENTO.has(e?.canal)) return true;
    if (!e?.invocacaoAlvo || e.invocacaoAlvo === inv?.id) {
      acc.vetadosPeloTipo.push({ nome: e.nome || e.origem || "Habilidade", canal: e.canal });
    }
    return false;
  });
  const efeitos = [...EFEITOS_DE_TIPO, ...efeitosDaFichaDoTipo(inv, dono), ...doDono]
    .filter((e) => !e?.invocacaoAlvo || e.invocacaoAlvo === inv?.id);
  if (!efeitos.length) return acc;
  const ctx = buildInvocacaoDslContext(inv, dono);
  for (const e of efeitos) {
    if (!e) continue;
    const nome = e.nome || e.origem || "Habilidade";
    // Contra a lista, não contra as chaves do acumulador: `detalhes` e
    // `canaisDesconhecidos` também são chaves dele e não são canais.
    if (!CANAL_VALIDO.has(e.canal)) {
      acc.canaisDesconhecidos.push({ nome, canal: e.canal });
      continue;
    }
    const alvo = alvoDoEfeitoInv(e.canal, e.alvo);
    if (alvo === false) {
      acc.semAlvo.push({ nome, canal: e.canal });
      continue;
    }
    // Condição do efeito: sem `quando`, sempre aplica; com, só se != 0.
    if (e.quando && evalNumber(e.quando, ctx, 0) === 0) continue;
    const valor = evalNumber(e.expr, ctx, 0);
    // Mira numa Ação específica: vai para o balde dela e NÃO entra no total do
    // canal, que é o que as outras Ações leem.
    if (e.acaoAlvo) {
      const balde = acc.porAcao[e.acaoAlvo] || (acc.porAcao[e.acaoAlvo] = { detalhes: [] });
      balde[e.canal] = (balde[e.canal] || 0) + valor;
      balde.detalhes.push({ nome, canal: e.canal, valor });
      continue;
    }
    somaNoAcumulador(acc, e.canal, alvo, valor, nome);
  }
  return acc;
}

// ------------------------------------------------------------
// Agregado das Características passivas
// ------------------------------------------------------------
/**
 * As Características são PASSIVAS e estão "sempre em efeito", então o que elas
 * concedem tem de chegar no stat block. Esta função junta as resolvidas num
 * pacote que o `resolveInvocacao` aplica.
 *
 * ⚠ Até 2026-08-15 elas eram resolvidas e JOGADAS FORA: a Característica de
 * Vida calculava "+15 PV" e o PV da invocação não mudava, a de Tamanho não
 * mexia no tamanho e a de Teste não entrava em teste nenhum. Só o texto do card
 * mostrava o número.
 */
export function agregarCaracteristicas(resolvidas = []) {
  const out = {
    pv: 0,
    tamanho: null,
    rdPorTipo: [],                                   // [{ chave, label, nome, valor }]
    testes: { pericias: {}, resistencias: {}, ataque: 0 },
    /* Profíciência de TR concedida por Característica: { [trId]: { prof, nome } }.
       Fica FORA de `testes` porque não é um bônus numérico, é uma faixa, e quem
       a aplica é o `resolveTestesInvocacao` ao montar o mapa de proficiência. */
    trProf: {},
    /* As modificadoras do catálogo de 2026-09-30 (Etapa 5). */
    arsenal: 0,
    atributoCombate: null,   // Estilo de Combate: { atributo, nome }
    atributoPv: null,        // Resiliência Alternativa: { atributo, nome }
    resistencias: [],        // Resistência: [{ tipo, label, nome }]
    /* As Intrínsecas e as Auras de 2026-09-30 (Etapa 6). `efeitosIntrinsecos` é
       o que vira número ou estado (voo, nado, alcanceAuxiliar, emTarefa, as Formas,
       laceracao, corridaPerfurante, percebeAlma), só das que cumprem o requisito. */
    intrinsecas: [],
    efeitosIntrinsecos: {},
    auras: [],
    warnings: [],
  };
  const vistasIntrinsecas = new Set();
  const rdIndex = new Map();
  const vistosTeste = new Set();
  /* As numéricas do catálogo entram na MESMA disputa da Livre (mais abaixo), e o
     grupo de efeito barra o que é "o mesmo efeito" em canais diferentes: Nível
     de Dano e Dado de Dano não se acumulam (Adicionais). Vale a primeira. */
  const numericas = [];
  const gruposUsados = new Map();
  for (const c of resolvidas) {
    if (c.aura) {
      if (c.bloqueada || !c.valor) continue;
      /* Duas Auras iguais não acumulam: vale a maior (decisão do autor). Iguais
         é o mesmo tipo de Aura com o mesmo alvo; de alvos diferentes convivem. */
      const chave = `${c.subtipo}|${c.alvo ?? ""}`;
      const antes = out.auras.find((a) => a.chave === chave);
      const linha = {
        chave, caracId: c.id, subtipo: c.subtipo, nome: c.nome || c.catalogoNome,
        canalDono: c.canalDono, alvo: c.alvo, alvoLabel: c.alvoLabel, valor: c.valor,
      };
      if (antes) {
        out.warnings.push(`Duas ${c.catalogoNome} no mesmo alvo: elas não acumulam.`);
        if (c.valor > antes.valor) Object.assign(antes, linha);
        continue;
      }
      out.auras.push(linha);
      continue;
    }
    if (c.intrinseca) {
      if (vistasIntrinsecas.has(c.subtipo)) {
        out.warnings.push(`Duas Características de ${c.catalogoNome}: elas não acumulam.`);
        continue;
      }
      vistasIntrinsecas.add(c.subtipo);
      out.intrinsecas.push({ id: c.id, subtipo: c.subtipo, nome: c.nome || c.catalogoNome, efeito: c.efeito, bloqueada: !!c.bloqueada });
      if (c.efeito && !c.bloqueada) {
        out.efeitosIntrinsecos[c.efeito] = c.efeito === "formaArma"
          ? { arma: c.arma, caracId: c.id }
          : c.efeito === "formaArmadura"
            ? { armadura: c.armadura, caracId: c.id }
            : (Number.isFinite(c.valor) ? c.valor : true);
      }
      continue;
    }
    if (c.canal && Number.isFinite(c.valor) && c.valor) {
      const dono = c.grupoEfeito ? gruposUsados.get(c.grupoEfeito) : null;
      if (dono && dono.subtipo !== c.subtipo) {
        out.warnings.push(`${c.nome || c.catalogoNome} e ${dono.nome || dono.catalogoNome} dão o mesmo efeito: elas não acumulam.`);
        continue;
      }
      if (c.grupoEfeito && !dono) gruposUsados.set(c.grupoEfeito, c);
      numericas.push({ canal: c.canal, alvo: null, valor: c.valor, nome: c.nome || c.catalogoNome });
      continue;
    }
    if (c.subtipo === "arsenal") {
      if (out.arsenal) out.warnings.push("Duas Características de Arsenal: elas não acumulam.");
      out.arsenal = Math.max(out.arsenal, c.valor ?? 0);
      continue;
    }
    if (c.subtipo === "estiloCombate" || c.subtipo === "resilienciaAlternativa") {
      if (!c.atributo) continue;
      const chave = c.subtipo === "estiloCombate" ? "atributoCombate" : "atributoPv";
      if (out[chave]) { out.warnings.push(`Duas Características de ${c.catalogoNome}: vale a primeira.`); continue; }
      out[chave] = { atributo: c.atributo, nome: c.nome || c.catalogoNome };
      continue;
    }
    if (c.subtipo === "resistenciaDano") {
      if (!c.tipoDano) continue;
      if (out.resistencias.some((r) => r.tipo === c.tipoDano)) {
        out.warnings.push(`Duas Características dão Resistência a ${c.tipoDanoLabel}: elas não acumulam.`);
        continue;
      }
      out.resistencias.push({ tipo: c.tipoDano, label: c.tipoDanoLabel, nome: c.nome || c.catalogoNome });
      continue;
    }
    if (c.subtipo === "vida") {
      // Duas Características de Vida não acumulam (o livro proíbe efeitos
      // iguais): vale a maior. O aviso de duplicata sai no resolveInvocacao.
      // O nome de quem venceu vai junto, para a parcela do hover.
      if ((c.valor ?? 0) > out.pv) { out.pv = c.valor; out.pvFonte = c.nome || "Característica"; }
    } else if (c.subtipo === "tamanho") {
      // Mesma regra: a primeira manda, e a duplicata vira aviso.
      if (c.tamanho && !out.tamanho) out.tamanho = c.tamanho;
    } else if (c.subtipo === "rd") {
      if (!c.rdTipo) continue;
      // "É impossível acumular RD ao mesmo tipo": a segunda do mesmo tipo não
      // soma, e o aviso sai no resolveInvocacao.
      if (rdIndex.has(c.rdChave)) {
        out.warnings.push(`Duas Características dão RD contra ${c.rdTipoLabel}: elas não acumulam.`);
        const atual = rdIndex.get(c.rdChave);
        atual.valor = Math.max(atual.valor, c.valor ?? 0);
        continue;
      }
      // `nome` é o da Característica, e não o do tipo de dano: é ele que o hover
      // da Ficha mostra como fonte da parcela.
      const linha = { chave: c.rdChave, label: c.rdTipoLabel, nome: c.nome || "Característica", valor: c.valor ?? 0 };
      rdIndex.set(c.rdChave, linha);
      out.rdPorTipo.push(linha);
    } else if (c.subtipo === "resistencia") {
      // Sem faixa (grau baixo) ou sem alvo, ela não concede nada: o aviso já
      // saiu do `resolveCaracteristica` e repeti-lo aqui duplicaria a linha.
      if (!c.prof || !c.trTipo) continue;
      /* Duas Características no MESMO TR com a MESMA faixa são o mesmo efeito, e
         não acumulam: vale a maior, com aviso. ⚠ A Treinada e a Mestre no mesmo
         TR NÃO são o mesmo efeito (2026-09-30): a Mestre pede o TR já treinado, e
         a Treinada é um dos jeitos de cumprir isso. */
      const antes = out.trProf[c.trTipo];
      const temTreinada = c.prof === "treinado" || !!antes?.temTreinada;
      if (antes) {
        if (antes.prof === c.prof) {
          out.warnings.push(`Duas Características treinam ${c.trTipoLabel || c.trTipo}: elas não acumulam.`);
        }
        if (RANK_PROF_INV[c.prof] <= RANK_PROF_INV[antes.prof]) { antes.temTreinada = temTreinada; continue; }
      }
      out.trProf[c.trTipo] = { prof: c.prof, nome: c.nome || "Característica", temTreinada };
    } else if (c.subtipo === "teste") {
      // Mesmo teste duas vezes é o mesmo efeito, e o livro proíbe: vale a maior.
      // ⚠ `ataque` já nasce 0 no acumulador, então quem decide se é repetição é
      // o conjunto de vistos, e não o valor guardado.
      const v = c.valor ?? 0;
      const guardar = (mapa, chave, marca) => {
        if (vistosTeste.has(marca)) {
          out.warnings.push("Duas Características dão bônus no mesmo teste: elas não acumulam.");
          mapa[chave] = Math.max(mapa[chave] ?? 0, v);
          return;
        }
        vistosTeste.add(marca);
        mapa[chave] = v;
      };
      if (c.alvoTeste === "ataque") guardar(out.testes, "ataque", "ataque");
      else if (c.alvoTeste === "tr") {
        if (c.trTipo) guardar(out.testes.resistencias, c.trTipo, `tr:${c.trTipo}`);
      } else if (c.periciaId) {
        guardar(out.testes.pericias, c.periciaId, `per:${c.periciaId}`);
      }
    }
  }

  /* ============================================================
     O MOTOR DAS CARACTERÍSTICAS LIVRES (2026-09-10)
     ============================================================
     Duas Características com o mesmo efeito, uma delas pelo Motor, NÃO
     acumulam: vale a maior (autor). É a regra do livro para Características, e
     o critério é o do pool das Passivas (`resolverExclusivos`): a disputa é por
     canal, alvo e sinal, o bônus fica com o MAIOR e a penalidade com a PIOR.

     Dentro de UMA Característica as linhas do mesmo canal somam primeiro,
     porque juntas elas são o efeito dela, e é esse total que disputa.

     Onde o efeito tem par num subtipo (PV com Vida, RD de um tipo com RD, bônus
     numa perícia ou num TR com Teste), a disputa atravessa os dois e o vencedor
     cai no mesmo lugar em que a Característica tipada cairia. O resto sai em
     `motor`, e o `resolveInvocacao` o soma no acumulador dos canais, onde as
     Habilidades de Controlador seguem somando por cima.

     ⚠ O bônus de Teste em ATAQUE não disputa com o canal `acerto`, e não é
     descuido: a Característica sobe só a jogada da criatura, e o canal sobe as
     Ações também. Os dois não mexem no mesmo número. */
  out.motor = [];
  out.testesNomes = { pericias: {}, resistencias: {} };
  const disputa = new Map();
  /* Cada Característica vira um grupo de candidatos: a Livre, com as linhas do
     Motor somadas por canal, e cada numérica do catálogo, com a linha dela. */
  const grupos = numericas.map((cand) => [cand]);
  for (const c of resolvidas) {
    if (c.subtipo !== "livre" || !Array.isArray(c.efeitos)) continue;
    const proprio = new Map();
    for (const ef of c.efeitos) {
      if (!ef.ativo || !Number.isFinite(ef.valor) || !ef.valor) continue;
      /* ⚠ DADO EXTRA SÓ NAS AUTORIZADAS (decisão do autor, 2026-09-30): o Livro
         diz que "Características não podem garantir dados extras", e o Adicionais
         abre exceção só em algumas, catalogadas (`CARACTERISTICAS_COM_DADO_EXTRA`).
         A Livre não é uma delas. */
      if (ef.canal === "ataqueDanoAdicional") {
        out.warnings.push(`${c.nome || "Característica Livre"}: Característica Livre não pode dar dado extra.`);
        continue;
      }
      const k = `${ef.canal}|${ef.alvo || ""}`;
      const atual = proprio.get(k);
      if (atual) atual.valor += ef.valor;
      else proprio.set(k, { canal: ef.canal, alvo: ef.alvo || null, valor: ef.valor, nome: c.nome || "Característica" });
    }
    grupos.push([...proprio.values()]);
  }
  for (const candidatos of grupos) {
    for (const cand of candidatos) {
      if (!cand.valor) continue;
      const k = `${cand.canal}|${cand.alvo || ""}|${cand.valor < 0 ? "-" : "+"}`;
      const atual = disputa.get(k);
      if (!atual) { disputa.set(k, { ...cand, n: 1 }); continue; }
      atual.n += 1;
      if (cand.valor < 0 ? cand.valor < atual.valor : cand.valor > atual.valor) Object.assign(atual, cand);
    }
  }
  for (const v of disputa.values()) {
    let n = v.n;
    if (v.valor > 0 && v.canal === "pv") {
      if (out.pv) n += 1;
      if (v.valor > out.pv) { out.pv = v.valor; out.pvFonte = v.nome; }
    } else if (v.valor > 0 && v.canal === "rd" && v.alvo) {
      const linha = rdIndex.get(v.alvo);
      if (linha) {
        n += 1;
        if (v.valor > linha.valor) { linha.valor = v.valor; linha.nome = v.nome; }
      } else {
        const nova = { chave: v.alvo, label: TIPOS_DANO[v.alvo] ?? v.alvo, nome: v.nome, valor: v.valor };
        rdIndex.set(v.alvo, nova);
        out.rdPorTipo.push(nova);
      }
    } else if (v.valor > 0 && (v.canal === "bonusPericia" || (v.canal === "bonusTR" && v.alvo))) {
      const pericia = v.canal === "bonusPericia";
      const mapa = pericia ? out.testes.pericias : out.testes.resistencias;
      const nomes = pericia ? out.testesNomes.pericias : out.testesNomes.resistencias;
      const marca = `${pericia ? "per" : "tr"}:${v.alvo}`;
      const tinha = vistosTeste.has(marca);
      if (tinha) n += 1;
      if (!tinha || v.valor > (mapa[v.alvo] ?? 0)) { mapa[v.alvo] = v.valor; nomes[v.alvo] = v.nome; }
      vistosTeste.add(marca);
    } else {
      out.motor.push({ canal: v.canal, alvo: v.alvo, valor: v.valor, nome: v.nome });
    }
    if (n > 1) out.warnings.push(`Duas Características dão ${nomeDoEfeitoInv(v.canal, v.alvo)}: elas não acumulam.`);
  }
  return out;
}

// ------------------------------------------------------------
// Testes da invocação (Acerto / TR / Perícias / CD) para o stat block
// ------------------------------------------------------------
// Bônus de teste = mod(atributo) + BT (se treinado) + metade do Nível de
// Controlador + bônus de Habilidade. `dono` deve trazer bonusTesteHabilidade
// (o donoLocal do resolveInvocacao) para incluir Controle Aprimorado etc.
export function resolveTestesInvocacao(inv, dono = {}, caract = null) {
  const at = inv?.atributos || {};
  const bt = dono.bt ?? 0;
  const meio = Math.floor((dono.nivelControlador ?? 0) / 2);
  const hab = dono.bonusTesteHabilidade ?? 0;
  const base = meio + hab; // parte comum a todos os testes da invocação
  const baseTR = base + (dono.bonusTRHabilidade ?? 0); // TRs recebem um bônus extra (Concentrar Poder)
  // Bônus fixos vindos de Característica de Teste (passivas, sempre em efeito).
  const cTes = caract?.testes || { pericias: {}, resistencias: {}, ataque: 0 };
  /* Quem venceu cada bônus de Teste, quando o vencedor foi o Motor de uma
     Característica Livre. A tipada segue saindo como "Característica". */
  const nomesCTes = caract?.testesNomes || { pericias: {}, resistencias: {} };
  // Bônus de Habilidade num TR ou numa perícia SÓ (canais com alvo).
  const trPorAlvo = dono.bonusTRPorAlvo || {};
  const periciaPorAlvo = dono.bonusPericiaPorAlvo || {};
  /* ⚠ O BÔNUS DE FUSÃO TEM CAMINHO PRÓPRIO, e não entra pelo `cTes`. Os dois
     somam no mesmo lugar hoje (o `comGatilho` morreu em 2026-09-04), mas a
     PARCELA de cada um leva um nome diferente no hover: a da fusão leva o nome
     do marcador que a gerou, e a da passiva diz "Característica". Misturá-los
     daria um painel em que o jogador não sabe qual das duas mexeu. */
  const fus = inv?.bonusDeFusao || { pericias: {}, resistencias: {} };

  /* AS PARCELAS DO HOVER. `detalhesEfeito` é o `efe.detalhes` do
     `resolveInvocacao`, uma linha por efeito de Habilidade aplicado, e a soma
     das do canal `bonusTeste` é exatamente o `hab` acima. Ver `parcelasDoCanal`. */
  const detalhes = Array.isArray(dono.detalhesEfeito) ? dono.detalhesEfeito : [];
  const auxFontes = Array.isArray(dono.auxilioFontes) ? dono.auxilioFontes : [];
  const parteNivel = meio ? [{ label: "Nível de Controlador", valor: meio }] : [];
  const parcelasComuns = [...parteNivel, ...parcelasDoCanal(detalhes, "bonusTeste")];
  const parcelasTR = [...parcelasComuns, ...parcelasDoCanal(detalhes, "bonusTR")];
  /* ⚠ O CANAL `acerto` FALTAVA AQUI, e a Melhoria Precisão era a única emissora
     dele: escolher "Jogadas de Ataque" não mexia no Acerto do stat block, e
     escolher "CD das Ações" mexia na CD, porque o `cd` já era lido logo abaixo.
     Metade de uma habilidade de escolha funcionava e a outra não.

     ⚠ E O ASSERT DA SOMA PASSAVA. `soma(partes) == bonus` fecha igual quando a
     parcela falta nos DOIS lados: o invariante prova que o painel explica o
     número, e não que o número está certo. Ver `t-controlador.mjs`. */
  const parcelasAcerto = [...parcelasComuns, ...parcelasDoCanal(detalhes, "acerto")];

  // Acerto: jogada usa Força OU Destreza (o melhor), com BT no tipo treinado.
  const modFor = mod(at.forca ?? 8);
  const modDes = mod(at.destreza ?? 8);
  let best = modFor >= modDes ? { m: modFor, attr: "forca" } : { m: modDes, attr: "destreza" };
  /* O Estilo de Combate (2026-09-30) entra como mais uma opção de atributo, para
     o Acerto e a CD de referência: vale o melhor. Cada Ação já escolhe o dela. */
  const alt = caract?.atributoCombate?.atributo;
  if (INV_ATTR_KEYS.includes(alt) && mod(at[alt] ?? 8) > best.m) best = { m: mod(at[alt] ?? 8), attr: alt };
  /* ⚠ A CARACTERÍSTICA DE TESTE ENTRA NO NÚMERO desde 2026-09-04, e o `comGatilho`
     morreu junto. Autor: *"o Corpo a Corpo com Gatilho, vc pode remover a parte
     do Gatilho. Somando o +5 da Caracteristica"*, e ele estendeu ao TR na mesma
     conversa.

     O que valia antes: o livro diz *"Caso seja em Jogadas de Ataque ou Testes de
     Resistência, o bônus é reduzido pela metade, assim como é necessário um
     gatilho específico"*, e o valor saía à parte, num campo próprio, para a
     ficha desenhá-lo como condicional. A METADE CONTINUA VALENDO (é o
     `Math.floor(cheio / 2)` do `resolveCaracteristica`), e o que saiu foi só a
     separação na tela: o gatilho virou combinado de mesa, como o resto das
     condições que a ficha não sabe conferir.

     ⚠ AS DUAS FILAS MUDAM JUNTAS, porque a frase do livro é uma só. Somar no
     Ataque e deixar o TR de fora seria uma assimetria sem fonte. */
  // O ataque treinado da ficha, e o que a Herança treinou (`ataquesHerdados`).
  const treinadoEm = (tipo) => inv?.ataqueTreinado === tipo || (inv?.ataquesHerdados ?? []).includes(tipo);
  const acertoDe = (tipo) => ({
    bonus: best.m + (treinadoEm(tipo) ? bt : 0) + base
      + (dono.acertoHabilidade ?? 0) + (dono.auxilioAcertoProprio ?? 0) + (cTes.ataque || 0),
    attr: best.attr,
    treinado: treinadoEm(tipo),
    partes: [
      { label: rotuloAttrInv(best.attr), valor: best.m },
      ...(treinadoEm(tipo) ? [{ label: "Maestria", valor: bt }] : []),
      ...parcelasAcerto,
      ...auxFontes.filter((f) => f.canal === "bonusAcerto").map((f) => ({ label: f.label, valor: f.valor })),
      ...(cTes.ataque ? [{ label: "Característica", valor: cTes.ataque }] : []),
    ],
  });

  // Testes de Resistência: os 5 saves. Treinado soma BT, Mestre soma 1,5x BT.
  // ⚠ MAPA desde 2026-09-02 (era um save só). Ver `trProfDaInvocacao`.
  /* ⚠ E A CARACTERÍSTICA ENTRA POR CIMA desde 2026-09-03, sem gastar a vaga
     base: `TR_VAGAS_BASE` conta o que a FICHA escolheu, e esta faixa vem de
     fora dela. Vale sempre a MAIOR das duas, para a Característica nunca
     rebaixar um TR que a ficha já dominava. Ver `INV_CARACT_TR_PROF`. */
  const trDaFicha = trProfDaInvocacao(inv);
  const trConcedido = caract?.trProf || {};
  const trProf = { ...trDaFicha };
  for (const [id, dado] of Object.entries(trConcedido)) {
    if ((RANK_PROF_INV[dado.prof] ?? 0) > (RANK_PROF_INV[trProf[id]] ?? 0)) trProf[id] = dado.prof;
  }
  const resistencias = AFTY_RESISTENCIAS.map((r) => {
    const p = trProf[r.value] || null;
    return {
      value: r.value, label: r.label, treinado: !!p, mestre: p === "mestre",
      bonus: mod(at[r.atributo] ?? 8) + bonusProficiencia(bt, p) + baseTR
        + (fus.resistencias?.[r.value] || 0) + (cTes.resistencias[r.value] || 0)
        + (trPorAlvo[r.value] || 0),
      /* Quando a faixa veio de Característica, a parcela leva o NOME dela: sem
         isso o jogador vê a Maestria num TR que ele não treinou na ficha e não
         tem como descobrir de onde ela saiu. */
      partes: [
        { label: rotuloAttrInv(r.atributo), valor: mod(at[r.atributo] ?? 8) },
        ...parcelaProficiencia(bt, p, trConcedido[r.value] && trProf[r.value] === trConcedido[r.value].prof
          && (RANK_PROF_INV[trConcedido[r.value].prof] ?? 0) > (RANK_PROF_INV[trDaFicha[r.value]] ?? 0)
          ? trConcedido[r.value].nome : null),
        ...parcelasTR,
        ...parcelasDoAlvo(detalhes, "bonusTR", r.value),
        ...(fus.resistencias?.[r.value]
          ? [{ label: fus.fonte || "Fusão", valor: fus.resistencias[r.value] }] : []),
        ...(cTes.resistencias[r.value]
          ? [{ label: nomesCTes.resistencias[r.value] || "Característica", valor: cTes.resistencias[r.value] }] : []),
      ],
    };
  });

  // Perícias: proficiência por perícia (treinado ou mestre). Uma Característica
  // de Teste pode dar bônus numa perícia em que a invocação NÃO é treinada, e
  // nesse caso a linha existe mesmo assim (o bônus vale, o BT é que não soma).
  const prof = (inv?.periciasProf && typeof inv.periciasProf === "object") ? inv.periciasProf : {};
  const pericias = AFTY_PERICIAS
    .filter((p) => prof[p.id] || cTes.pericias[p.id] || fus.pericias?.[p.id] || periciaPorAlvo[p.id])
    .map((p) => ({
      id: p.id, nome: p.nome, mestre: prof[p.id] === "mestre", treinado: !!prof[p.id],
      atributo: p.atributo,
      bonus: mod(at[p.atributo] ?? 8) + bonusProficiencia(bt, prof[p.id] || null) + base
        + (cTes.pericias[p.id] || 0) + (fus.pericias?.[p.id] || 0) + (periciaPorAlvo[p.id] || 0),
      partes: [
        { label: rotuloAttrInv(p.atributo), valor: mod(at[p.atributo] ?? 8) },
        ...parcelaProficiencia(bt, prof[p.id] || null),
        ...parcelasComuns,
        ...parcelasDoAlvo(detalhes, "bonusPericia", p.id),
        ...(cTes.pericias[p.id]
          ? [{ label: nomesCTes.pericias[p.id] || "Característica", valor: cTes.pericias[p.id] }] : []),
        ...(fus.pericias?.[p.id] ? [{ label: fus.fonte || "Fusão", valor: fus.pericias[p.id] }] : []),
      ],
    }));

  // CD representativa de um ataque por TR (usa o melhor atributo; cada Ação por
  // TR mostra a sua CD exata pelo atributo chave dela). Não soma bônus de teste.
  const nd = Math.max(1, dono.nd ?? 1);
  const cd = 10 + Math.max(1, Math.floor(nd / 2)) + best.m + (dono.cdHabilidade ?? 0);
  const cdPartes = [
    { label: "Base", valor: 10 },
    { label: "Metade do Nível", valor: Math.max(1, Math.floor(nd / 2)) },
    { label: rotuloAttrInv(best.attr), valor: best.m },
    ...parcelasDoCanal(detalhes, "cd"),
  ];

  return {
    acerto: { corpo: acertoDe("corpo"), distancia: acertoDe("distancia") },
    cd, cdPartes, resistencias, pericias,
  };
}

// ------------------------------------------------------------
// Resolver principal
// ------------------------------------------------------------
/* ============================================================
   A HERANÇA DAS SOMBRAS (decisão do autor DA-12, 2026-10-01, Etapa 10)
   ============================================================
   "Uma Herança é a fusão permanente de um Shikigami exorcizado em um Shikigami
   vivo", e cada entrada dá (Mecânicas):
     +1 de Nível de Dano;
     +1 em Todas as Perícias, Todas as TRs, RD (Geral) ou Jogadas de Ataque;
     1 resistência ou imunidade da sombra;
     até 1 Ação e 1 Característica da sombra;
     +2 Treinamentos em Perícia, TR ou Jogada de Ataque;
     +2 no maior atributo da sombra, até 30, passando do limite do grau.
   "Os efeitos acima se acumulam para cada Shikigami exorcizado", e a Herança de
   uma herdeira que morre passa adiante ("adicionar todos os efeitos de Herança
   que ela possuia em vida"), em `herdadas`.

   ⚠ A CÓPIA É CONGELADA na criação (`copia`): a sombra está morta e pode sair da
   lista. É o oposto da Quimera, que lê as componentes vivas a cada derive.
   ⚠ O que a Herança concede não ocupa vaga nem custa (PV-14): marca `concedida`.
   ⚠ Convive com o exemplo antigo por marcador com `fontes`: os dois mecanismos
   são independentes, e um addon próprio de Herança segue funcionando. */

/** Os bônus que a Herança deixa escolher, um por entrada. */
export const HERANCA_BONUS = [
  { value: "pericias", label: "Todas as Perícias" },
  { value: "trs", label: "Todas as TRs" },
  { value: "rd", label: "RD Geral" },
  { value: "ataque", label: "Jogadas de Ataque" },
];
const HERANCA_BONUS_VALIDO = new Set(HERANCA_BONUS.map((b) => b.value));

/** O teto absoluto de atributo da Herança ("até um máximo de 30"). */
export const HERANCA_ATRIBUTO_TETO = 30;

const clonarJson = (x) => JSON.parse(JSON.stringify(x ?? null));

/** Os atributos de maior valor da sombra (empate deixa a pessoa escolher). */
export function maioresAtributosDe(origem) {
  const at = origem?.atributos || {};
  const base = atributoBaseInvocacao(origem);
  const valor = (k) => Number(at[k] ?? base) || 0;
  const maior = Math.max(...INV_ATTR_KEYS.map(valor));
  return INV_ATTR_KEYS.filter((k) => valor(k) === maior);
}

/**
 * Uma Herança nova a partir da sombra exorcizada, com a cópia congelada: o maior
 * atributo, as resistências e imunidades (da resolvida, que é o que a mesa vê),
 * as Ações, as Características e as Heranças que ela já carregava.
 */
export function criaHeranca(origem, resolvida = null) {
  const maiores = maioresAtributosDe(origem);
  const base = atributoBaseInvocacao(origem);
  return {
    id: novoId("heranca"),
    origemId: origem?.id ?? "",
    origemNome: origem?.nome || "",
    criadaEm: new Date().toISOString(),
    copia: {
      maioresAtributos: maiores,
      valorMaiorAtributo: Number(origem?.atributos?.[maiores[0]] ?? base) || 0,
      resistencias: (resolvida?.resistencias ?? []).map((r) => ({ tipo: r.tipo, label: r.label })),
      imunidades: [...(resolvida?.imunidades ?? [])],
      acoes: clonarJson(origem?.acoes ?? []),
      caracteristicas: clonarJson(origem?.caracteristicas ?? []),
    },
    escolhas: { bonus: "", atributo: maiores[0] ?? "", resistencia: "", acaoId: "", caracteristicaId: "", treinos: [] },
    herdadas: clonarJson(Array.isArray(origem?.herancas) ? origem.herancas : []),
  };
}

/** As Heranças achatadas: cada entrada e, depois dela, as que ela herdou. */
export function herancasAchatadas(lista, profundidade = 0) {
  const out = [];
  for (const h of Array.isArray(lista) ? lista : []) {
    if (!h || typeof h !== "object") continue;
    out.push({ h, profundidade });
    out.push(...herancasAchatadas(h.herdadas, profundidade + 1));
  }
  return out;
}

/**
 * A invocação lida com as Heranças: as Ações e Características herdadas (com a
 * marca `concedida`), os treinos (Perícia, TR ou Ataque viram treinados), as
 * resistências e imunidades, o resumo para a tela e os avisos. Pura.
 */
export function herancasDa(inv) {
  const vazio = { inv, resistencias: [], imunidades: [], resumo: [], warnings: [] };
  const todas = herancasAchatadas(inv?.herancas);
  if (!todas.length) return vazio;
  const acoes = [];
  const caracteristicas = [];
  const periciasProf = { ...(inv?.periciasProf || {}) };
  const trProf = { ...trProfDaInvocacao(inv) };
  const ataques = new Set(inv?.ataqueTreinado ? [inv.ataqueTreinado] : []);
  const resistencias = [];
  const imunidades = [];
  const resumo = [];
  const warnings = [];
  for (const { h, profundidade } of todas) {
    const nome = h.origemNome || "Sombra";
    const e = h.escolhas || {};
    const copia = h.copia || {};
    if (!HERANCA_BONUS_VALIDO.has(e.bonus)) warnings.push(`Herança de ${nome}: escolha o bônus.`);
    const acao = (copia.acoes ?? []).find((a) => a?.id === e.acaoId);
    if (acao) acoes.push({ ...acao, id: `heranca:${h.id}:${acao.id}`, concedida: true, herancaDe: nome });
    const carac = (copia.caracteristicas ?? []).find((c) => c?.id === e.caracteristicaId);
    if (carac) caracteristicas.push({ ...carac, id: `heranca:${h.id}:${carac.id}`, concedida: true, herancaDe: nome });
    const [tipoRes, valorRes] = String(e.resistencia || "").split(":");
    if (tipoRes === "tipo" && valorRes) {
      const r = (copia.resistencias ?? []).find((x) => x.tipo === valorRes);
      if (r) resistencias.push({ tipo: r.tipo, label: r.label, nome: `Herança de ${nome}` });
    } else if (tipoRes === "imunidade" && valorRes) {
      imunidades.push(valorRes);
    }
    const treinos = Array.isArray(e.treinos) ? e.treinos : [];
    if (treinos.length > 2) warnings.push(`Herança de ${nome}: ${treinos.length} treinos, e a Herança dá dois.`);
    for (const tr of treinos.slice(0, 2)) {
      if (tr?.tipo === "pericia" && tr.id && !periciasProf[tr.id]) periciasProf[tr.id] = "treinado";
      else if (tr?.tipo === "tr" && tr.id && !trProf[tr.id]) trProf[tr.id] = "treinado";
      else if (tr?.tipo === "ataque" && (tr.id === "corpo" || tr.id === "distancia")) ataques.add(tr.id);
    }
    resumo.push({
      id: h.id, origemId: h.origemId ?? null, origemNome: nome, profundidade,
      bonus: HERANCA_BONUS.find((b) => b.value === e.bonus)?.label ?? null,
      atributo: e.atributo || (copia.maioresAtributos ?? [])[0] || null,
      acao: acao?.nome || null, caracteristica: carac?.nome || null,
    });
  }
  const ataquesHerdados = [...ataques].filter((a) => a !== inv?.ataqueTreinado);
  return {
    inv: {
      ...inv,
      acoes: [...(inv?.acoes ?? []), ...acoes],
      caracteristicas: [...(inv?.caracteristicas ?? []), ...caracteristicas],
      periciasProf, trProf,
      ...(ataquesHerdados.length ? { ataquesHerdados } : {}),
    },
    resistencias, imunidades, resumo, warnings,
  };
}

/**
 * Os NÚMEROS da Herança, como efeito de canal: +1 Nível de Dano, o bônus
 * escolhido e o +2 no maior atributo da sombra, com o teto desse atributo
 * subindo até 30. "Todas as Perícias" vale como +1 em cada perícia que a
 * herdeira tem na ficha (a lista que a mesa vê).
 */
function efeitosDeHeranca(inv) {
  const todas = herancasAchatadas(inv?.herancas);
  if (!todas.length) return [];
  const out = [];
  const tab = INV_ATRIBUTOS_POR_GRAU[grauMeta(inv?.grau).value] || INV_ATRIBUTOS_POR_GRAU.quarto;
  const comTeto = new Set();
  for (const { h } of todas) {
    const nome = `Herança · ${h.origemNome || "Sombra"}`;
    const e = h.escolhas || {};
    const linha = (canal, valor, alvo = null) => ({ canal, expr: String(valor), nome, origem: "heranca", ...(alvo ? { alvo } : {}) });
    out.push(linha("danoNivel", 1));
    if (e.bonus === "trs") out.push(linha("bonusTR", 1));
    else if (e.bonus === "rd") out.push(linha("rd", 1));
    else if (e.bonus === "ataque") out.push(linha("acerto", 1));
    else if (e.bonus === "pericias") {
      for (const id of Object.keys(inv?.periciasProf || {})) out.push(linha("bonusPericia", 1, id));
    }
    const maiores = h.copia?.maioresAtributos ?? [];
    const k = maiores.includes(e.atributo) ? e.atributo : maiores[0];
    if (INV_ATTR_KEYS.includes(k)) {
      out.push(linha("atributo", 2, k));
      if (!comTeto.has(k)) {
        comTeto.add(k);
        out.push({ ...linha("limiteAtributo", Math.max(0, HERANCA_ATRIBUTO_TETO - tab.max), k), nome: "Herança · Até 30" });
      }
    }
  }
  return out;
}

/**
 * As Habilidades de USO que o dono pode gastar NESTA invocação, com o número já
 * fechado. Elas não mudam a ficha dela (dependem de uma decisão no momento do
 * uso), mas têm valor calculável, e sem isso a mesa reabre o livro para saber
 * quanto custa um turno próprio de uma invocação de Segundo Grau.
 */
/**
 * As regras do Shikigami de Técnica que NÃO têm canal: elas mudam a economia de
 * ação, o estado de sessão ou pedem vantagem/desvantagem, e nenhuma das três
 * existe no motor. Saem como MARCAS, com o texto da regra no `title` da tela.
 */
export function tracosDeTecnica(inv) {
  if (!ehShikigamiDeTecnica(inv)) return [];
  return [
    {
      id: "turno_proprio",
      nome: "Turno Próprio",
      regra: "Possui um turno próprio na Iniciativa, com uma Ação para realizar uma ação complexa ou simples, além de uma ação de movimento. Não se beneficia de Autonomia.",
    },
    /* ⚠ O "RETORNO COMPLETO" SAIU em 2026-09-30 (decisão do autor). Ele dizia que
       a primeira dissipação no combate voltava com a vida cheia, e o Mecânicas o
       substitui pela regra do exorcismo: o 1º vira dissipação com metade da vida,
       e o 2º antes do descanso longo mata. Quem aplica é a sessão
       (`transicaoDeQueda`, em ficha/ficha-sessao.js). */
    {
      id: "desvantagem_alheia",
      nome: "Desvantagem Alheia",
      regra: "Outras invocações de até 1 grau abaixo dele possuem desvantagem em rolagens ofensivas contra ele.",
    },
    {
      id: "imune_prejuizo",
      nome: "Imune a Prejuízo por Repetição",
      regra: "Recebe imunidade à mecânica de Prejuízo por Múltiplos Auxílios.",
    },
  ];
}

function opcoesDeUso(inv, dono) {
  const out = [];
  const g = grauMeta(inv?.grau);
  // ⚠ "A Invocação não se beneficia da habilidade Autonomia": ela já tem turno
  // próprio, então pagar por um seria pagar duas vezes pela mesma coisa.
  if (dono?.autonomia && !ehShikigamiDeTecnica(inv)) {
    // "pagar uma quantidade adicional de PE igual a 2 para cada grau dela
    // (2 para quarto grau, 10 para grau especial)".
    /* ⚠ Os números saem SEPARADOS do texto desde 2026-09-30 (Etapa 7): a entrada
       em campo cobra o `custo` quando a mesa marca a opção, e a Ficha mostra o
       `valor`. O tipo diz se a Autonomia é paga na entrada (a Maldição paga no
       início do combate, e a Técnica não usa). */
    const paga = regrasDoTipo(inv).autonomia;
    if (paga) {
      out.push({ id: "autonomia", nome: "Autonomia", valor: `${2 * g.rank} PE`, custo: 2 * g.rank, quando: paga });
    }
  }
  if (dono?.resistenciaSobrecarregada) {
    // "gastar uma quantidade de PE igual a metade do seu bônus de treinamento e,
    // para cada ponto gasto, a invocação tem seus pontos de vida aumentados em 10".
    // O aumento é do PV MÁXIMO enquanto ela está em campo (decisão do autor).
    const pe = Math.floor((dono.bt ?? 0) / 2);
    out.push({ id: "sobrecarga", nome: "Resistência Sobrecarregada", valor: `${pe} PE, +${pe * 10} PV`, custo: pe, pv: pe * 10, quando: "entrada" });
  }
  return out;
}

/**
 * Os marcadores LIGADOS nesta invocação, já com rótulo e a opção escolhida.
 * A Ficha precisa disso para dizer, no card, por que esta invocação é diferente
 * das outras: sem isso o jogador vê um PV maior e nenhuma pista da origem.
 */
function marcadoresDaInvocacao(inv, dono) {
  const out = [];
  for (const m of Array.isArray(dono?.marcadores) ? dono.marcadores : []) {
    if (!marcadorLigado(inv, m.id)) continue;
    const escolha = marcadorOpcao(inv, m.id);
    const opcao = (m.opcoes || []).find((o) => o.value === escolha) || null;
    out.push({ id: m.id, label: m.label, opcao: opcao?.label ?? null, faltaOpcao: !!m.opcoes?.length && !opcao });
  }
  return out;
}

export function resolveInvocacao(invCru, dono = {}) {
  /* A HERANÇA DAS SOMBRAS (2026-10-01, Etapa 10): a invocação herdeira é lida com
     o que as Heranças concedem (Ações, Características, treinos), e os números
     (Nível de Dano, bônus, atributo) entram como efeito. Ver `herancasDa`. */
  const her = herancasDa(invCru);
  const inv = her.inv;
  const g = grauMeta(inv?.grau);
  const regras = regrasDoTipo(inv);
  const efe = efeitosHabilidade(inv, dono);

  /* As Características são passivas e resolvem ANTES dos stats, porque o PV, o
     tamanho, a RD e os testes leem o que elas concedem.

     ⚠ E ANTES DO DONO LOCAL desde 2026-09-10. O Motor da Característica Livre
     escreve nos mesmos canais das Habilidades (Acerto, CD, Níveis de Dano...), e
     esses canais chegam às Ações e aos testes pelo `donoLocal`. Resolvidas
     depois dele, as linhas do Motor apareceriam no card e não mexeriam em nada,
     que é o "calculado e jogado fora" de agosto outra vez. */
  const caracteristicas = (inv?.caracteristicas || []).map((c) => resolveCaracteristica(c, inv, dono));
  const caract = agregarCaracteristicas(caracteristicas);
  for (const m of caract.motor) somaNoAcumulador(efe, m.canal, m.alvo, m.valor, m.nome);
  /* ⚠ TR MESTRE SÓ NUM TR JÁ TREINADO (decisão do autor, 2026-09-30, Adicionais:
     "Permite que sua invocação se torne mestre em um TR em que ela é Treinada").
     Treinado pela ficha ou por uma TR Treinada. Sem isso, a Mestre não concede
     nada, e a ficha avisa. */
  const trDaFichaCru = trProfDaInvocacao(inv);
  for (const [id, dado] of Object.entries(caract.trProf)) {
    if (dado.prof !== "mestre" || dado.temTreinada || trDaFichaCru[id]) continue;
    const rotulo = AFTY_RESISTENCIAS.find((r) => r.value === id)?.label ?? id;
    caract.warnings.push(`${dado.nome}: TR Mestre em ${rotulo} pede a invocação já treinada nele.`);
    delete caract.trProf[id];
  }

  // Efeitos per-invocação que as Ações/Testes precisam ler vão num dono local:
  // bonusTeste (Controle Aprimorado, todos os testes), bonusTR (Concentrar
  // Poder, só TRs) e o escalonamento de dano/cura (Concentrar Poder).
  const donoLocal = { ...dono };
  if (efe.bonusTeste) donoLocal.bonusTesteHabilidade = efe.bonusTeste;
  if (efe.bonusTR) donoLocal.bonusTRHabilidade = efe.bonusTR;
  if (efe.acerto) donoLocal.acertoHabilidade = efe.acerto;
  if (efe.cd) donoLocal.cdHabilidade = efe.cd;
  if (efe.danoNivel) donoLocal.danoNivelHabilidade = efe.danoNivel;
  if (efe.danoBonus) donoLocal.danoBonusHabilidade = efe.danoBonus;
  if (efe.curaNivel) donoLocal.curaNivelHabilidade = efe.curaNivel;
  if (efe.curaBonus) donoLocal.curaBonusHabilidade = efe.curaBonus;
  if (efe.ataqueDanoAdicional) donoLocal.ataqueDanoAdicionalHabilidade = efe.ataqueDanoAdicional;
  if (efe.porAlvo.bonusTR) donoLocal.bonusTRPorAlvo = efe.porAlvo.bonusTR;
  if (efe.porAlvo.bonusPericia) donoLocal.bonusPericiaPorAlvo = efe.porAlvo.bonusPericia;
  // Alcance Auxiliar (2026-09-30): o auxílio deixa de usar o alcance reduzido.
  if (caract.efeitosIntrinsecos.alcanceAuxiliar) donoLocal.alcanceAuxiliar = true;
  // Os baldes de Ação específica viajam inteiros: quem soma é o `resolveAcao`,
  // por `acao.id`, porque só ele sabe qual Ação está na mão. Ver `acaoAlvo`.
  if (efe.porAcao && Object.keys(efe.porAcao).length) donoLocal.porAcao = efe.porAcao;

  // Override de Feitiço de Criação de Shikigamis: quando esta invocação É o
  // shikigami de um Feitiço, o NÍVEL do Feitiço manda no grau, no orçamento e
  // no custo. Ver `overridesShikigami` no fim deste arquivo.
  const ovr = dono.overridesPorInvocacao?.[inv?.id] || null;

  /* AUXÍLIOS LIGADOS NA MESA. Pré-passe, porque o Acerto que ela dá a si mesma
     entra nas jogadas de ataque dela, e essas jogadas saem do `resolveAcao` que
     resolve os próprios auxílios. Ver `auxiliosLigadosDa`. */
  const aux = auxiliosLigadosDa(inv, dono);
  if (aux.proprio.bonusAcerto) donoLocal.auxilioAcertoProprio = aux.proprio.bonusAcerto;
  /* As duas listas que o `resolveTestesInvocacao` transforma em parcelas de
     hover: os efeitos de Habilidade aplicados e os auxílios ligados na mesa. */
  donoLocal.detalhesEfeito = efe.detalhes;
  donoLocal.auxilioFontes = aux.proprio.fontes;

  /* O ATRIBUTO DO MOTOR (canal `atributo`). `invEf` é a invocação com os
     atributos SOMADOS, e é ela que PV, Defesa, perícias, testes e Ações leem.
     O orçamento de pontos continua no cru, porque bônus não é ponto gasto, e o
     contexto de DSL também, porque é o valor que o seletor de variáveis mostra
     e uma expressão que lesse o bônus que ela mesma dá seria um laço. */
  const attrEf = atributosEfetivos(inv, efe);
  const invEf = attrEf.invEf;
  const resumoAttr = resumoAtributosInvocacao(inv, efe.atributoPontos, efe.limiteAtributo);
  const chavesAttr = Object.keys(attrEf.aplicado);
  const atributos = chavesAttr.length
    ? {
      ...resumoAttr,
      valores: { ...resumoAttr.valores, ...Object.fromEntries(chavesAttr.map((k) => [k, invEf.atributos[k]])) },
      mods: { ...resumoAttr.mods, ...Object.fromEntries(chavesAttr.map((k) => [k, mod(invEf.atributos[k])])) },
      bonus: attrEf.aplicado,
      // A soma de cada lista fecha com o valor: base, bônus e o que passou do máximo.
      partes: Object.fromEntries(chavesAttr.map((k) => {
        const perda = attrEf.perdas.find((p) => p.k === k);
        return [k, [
          { label: "Base", valor: resumoAttr.valores[k] },
          ...parcelasDoAlvo(efe.detalhes, "atributo", k),
          ...(perda ? [{ label: "Acima do Máximo do Grau", valor: -perda.perdido }] : []),
        ]];
      })),
    }
    : resumoAttr;
  /* O canal `pvMult` multiplica o PV JÁ SOMADO (base, canal `pv` e Característica
     de Vida), arredondado para baixo. Vale a MAIOR fonte, uma vez só: o
     acumulador soma, então o multiplicador sai dos detalhes, e não de `efe.pvMult`. */
  const fontesPvMult = (efe.detalhes || []).filter((d) => d.canal === "pvMult" && !d.alvo && Number(d.valor) > 1);
  const pvMultVencedor = fontesPvMult.reduce((m, d) => (Number(d.valor) > Number(m?.valor ?? 0) ? d : m), null);
  const pvMult = pvMultVencedor ? Number(pvMultVencedor.valor) : 1;
  /* ⚠ O PV FIXO É DA QUIMERA, e ele PULA a conta de cima inteira (2026-09-23). O
     livro diz *"a Vida Máxima de uma Quimera é igual a soma do HP de cada
     Invocação fundido - 10"*, e é igual mesmo: o PV de cada fundida já carrega o
     que o dono deu a ela (Invocações Resistentes, Característica de Vida, o
     multiplicador da Maldição). Deixar a fusão passar pela conta normal de novo
     somava esse bônus outra vez POR CIMA da soma, e o multiplicador multiplicava
     a soma que já vinha multiplicada: uma Quimera de três Maldições saía com 450
     de vida onde o livro manda 300. O campo só existe na CÓPIA sintética que o
     `resolveQuimera` monta, nunca numa ficha salva. */
  const pvFixo = inv?.pvFixo == null ? null : Math.max(0, Math.trunc(Number(inv.pvFixo) || 0));
  /* A Resiliência Alternativa troca o atributo do PV, e o Estilo de Combate entra
     na Defesa (2026-09-30). Ver `agregarCaracteristicas`. */
  const atributoPv = caract.atributoPv?.atributo ?? "constituicao";
  const atributoCombate = caract.atributoCombate?.atributo ?? null;
  /* A Resistência Sobrecarregada aumenta o PV MÁXIMO enquanto ela está em campo
     (decisão do autor, 2026-09-30), e não é PV temporário. Fora de campo, some. */
  const pvSobrecarga = aux.sessao.emCampo ? aux.sessao.sobrecargaPv : 0;
  const pv = (pvFixo ?? Math.floor((pvInvocacao(invEf, dono, atributoPv) + efe.pv + caract.pv) * pvMult)) + pvSobrecarga;
  const defesa = defesaInvocacao(invEf, dono, atributoCombate) + efe.defesa + aux.proprio.defesa;
  const deslocamento = deslocamentoInvocacao() + efe.deslocamento;
  /* Alado e Nadador (2026-09-30): o deslocamento novo parte do de caminhada
     (decisão do autor, na falta de outro valor na fonte). */
  const deslocamentos = {
    caminhada: deslocamento,
    ...(caract.efeitosIntrinsecos.voo ? { voo: deslocamento } : {}),
    ...(caract.efeitosIntrinsecos.nado ? { nado: deslocamento } : {}),
  };
  // Tamanho: Médio até que uma Característica de Tamanho diga outro.
  const tamanho = caract.tamanho || inv?.tamanho || "medio";
  // RD: a Geral (Melhoria Resistência, "contra todos os tipos") cobre tudo, e
  // cada Característica soma no tipo dela. A linha por tipo mostra o total que
  // vale contra aquele tipo, que é o número que a mesa usa.
  //
  // ⚠ A RD DE UM TIPO tem duas fontes desde 2026-09-10: a Característica (que
  // disputa com as outras, e já chega decidida) e o canal `rd` com alvo das
  // Habilidades, que soma por cima. Um tipo que só a Habilidade cobre ganha
  // linha própria, senão o número existiria sem célula na tela.
  const rdGeralTotal = efe.rd + aux.proprio.rdGeral;
  const rdAlvo = efe.porAlvo.rd || {};
  const linhasRd = [...caract.rdPorTipo];
  for (const tipo of Object.keys(rdAlvo)) {
    if (!linhasRd.some((l) => l.chave === tipo)) {
      linhasRd.push({ chave: tipo, label: TIPOS_DANO[tipo] ?? tipo, nome: null, valor: 0 });
    }
  }
  const rd = {
    /* Piso em zero (2026-10-01): a Quimera do Mecânicas tira RD ("-1 em [...] RD"),
       e RD negativa não existe na mesa. */
    geral: Math.max(0, rdGeralTotal),
    porTipo: linhasRd.map((l) => ({ ...l, total: Math.max(0, l.valor + (rdAlvo[l.chave] || 0) + rdGeralTotal) })),
  };
  // Ápice do Controle (efe.orcamentoLivre) dá slots que NÃO influenciam no custo.
  // Invocações Econômicas abate o custo, com piso em zero.
  const detCusto = detalheCustoInvocacao(inv, efe.orcamentoLivre, efe.caracteristicasLivres);
  const custoBruto = ovr?.custoFixo != null ? ovr.custoFixo : detCusto.total;
  /* ⚠ O CUSTO FIXO É DA QUIMERA do addon (2026-09-30, E-11), como o `pvFixo`:
     *"o Custo em PE é a soma de todas as invocações fundidas"*, e a soma é a do
     custo que o CARTÃO de cada uma mostra, já com as reduções dela. Antes saía da
     variável `custo` crua do DSL, sem as reduções, e uma fundida com Invocações
     Econômicas entrava na soma 2 PE mais cara do que o cartão dela dizia. */
  const custoFixoQ = inv?.custoFixo == null ? null : Math.max(0, Math.trunc(Number(inv.custoFixo) || 0));
  const custoSemPiso = custoBruto - efe.custoReducao;
  const custo = custoFixoQ ?? Math.max(0, custoSemPiso);
  const orcamento = orcamentoAcoesCaract(
    inv,
    efe.orcamentoLivre + efe.orcamentoPago + (ovr?.ajusteAcoes ?? 0),
    efe.caracteristicasLivres,
  );
  /* O ORÇAMENTO SEPARADO (2026-09-30, Etapa 4): a cota gratuita do grau, o que
     se COMPRA pagando PE (os adicionais do grau e as vagas pagas, como as do
     Visionário), e o que uma Habilidade CONCEDE sem custo (Ápice do Controle).
     O total de antes continua o mesmo número. */
  const nAcoesSimples = (inv?.acoes || []).filter((a) => a?.classe !== "complexa").length;
  orcamento.partes = {
    gratuitas: orcamento.base,
    compradas: { max: orcamento.maxAdicionais, pagas: detCusto.nItens },
    concedidasGratis: parcelasDoCanal(efe.detalhes, "orcamentoLivre"),
    concedidasPagas: parcelasDoCanal(efe.detalhes, "orcamentoPago"),
    feitico: ovr?.ajusteAcoes ?? 0,
    exclusivasCaract: orcamento.exclusivas,
  };
  orcamento.uso = {
    simples: nAcoesSimples,
    complexas: (inv?.acoes || []).length - nAcoesSimples,
    caracteristicas: (inv?.caracteristicas || []).length,
  };
  /* ============================================================
     AS FONTES DE CADA NÚMERO DO STAT BLOCK
     ============================================================
     Uma lista por número, no formato do painel de fontes (`{ label, valor }`),
     e a soma de cada uma bate com o número que a Ficha mostra. Montadas aqui
     porque a conta é daqui: repetir as parcelas na aba seria a mesma fórmula
     escrita duas vezes. Ver `parcelasDoCanal`. */
  const auxDoCanal = (canal) => aux.proprio.fontes
    .filter((f) => f.canal === canal)
    .map((f) => ({ label: f.label, valor: f.valor }));
  const partesRdGeral = [...parcelasDoCanal(efe.detalhes, "rd"), ...auxDoCanal("rdGeral")];
  const fontes = {
    /* Na Quimera as parcelas são o PV de cada fundida, mais o desconto da fusão:
       a soma delas fecha com o número, e é o que o hover precisa mostrar. */
    pv: [...(pvFixo != null ? (Array.isArray(inv?.pvFixoPartes) ? inv.pvFixoPartes : []) : [
      ...partesPvInvocacao(invEf, dono, atributoPv),
      ...parcelasDoCanal(efe.detalhes, "pv"),
      /* Duas Características de Vida não acumulam: vale a MAIOR, e a parcela
         leva o nome de quem venceu, que pode ser o Motor de uma Livre. Ver
         `agregarCaracteristicas`. */
      ...(caract.pv ? [{ label: caract.pvFonte || "Característica", valor: caract.pv }] : []),
      // A fonte que venceu, por último: o multiplicador age sobre a soma acima.
      ...(pvMultVencedor ? [{ label: pvMultVencedor.nome, texto: `× ${pvMult}` }] : []),
    ]),
      ...(pvSobrecarga ? [{ label: "Resistência Sobrecarregada", valor: pvSobrecarga }] : []),
    ],
    defesa: [
      ...partesDefesaInvocacao(invEf, dono, atributoCombate),
      ...parcelasDoCanal(efe.detalhes, "defesa"),
      ...auxDoCanal("defesa"),
    ],
    deslocamento: [
      { label: "Base", valor: deslocamentoInvocacao() },
      ...parcelasDoCanal(efe.detalhes, "deslocamento"),
    ],
    rdGeral: partesRdGeral,
    /* A RD por tipo é a da Característica MAIS a Geral: o número que vale contra
       aquele tipo. As duas parcelas aparecem, senão o jogador soma de cabeça. */
    rdPorTipo: Object.fromEntries(linhasRd.map((l) => [
      l.chave,
      [
        // A linha que só a Habilidade abriu não tem Característica atrás.
        ...(l.nome ? [{ label: l.nome, valor: l.valor }] : []),
        ...parcelasDoAlvo(efe.detalhes, "rd", l.chave),
        ...partesRdGeral,
      ],
    ])),
    /* O custo em partes (2026-09-30): o base do grau (ou zero pelo tipo), os
       itens além da cota, as reduções, e o piso quando a redução passa do custo.
       A Quimera do addon traz as parcelas dela (o cartão de cada fundida). */
    custo: custoFixoQ != null ? (Array.isArray(inv?.custoFixoPartes) ? inv.custoFixoPartes : []) : [
      ...(ovr?.custoFixo != null
        ? [{ label: ovr.fonte || "Feitiço de Criação", valor: ovr.custoFixo }]
        : [
          { label: detCusto.baseLabel, valor: detCusto.base },
          ...(detCusto.itens ? [{ label: "Ações e Características Extras", valor: detCusto.itens }] : []),
        ]),
      ...parcelasDoCanal(efe.detalhes, "custoReducao").map((x) => ({ label: x.label, valor: -x.valor })),
      ...(custoSemPiso < 0 ? [{ label: "Piso em Zero", valor: -custoSemPiso }] : []),
    ],
    /* ⚠ `caracteristicasLivres` NÃO ENTRA AQUI, e a ausência é a regra. Ele é o
       pool EXCLUSIVO de Característica (`orcamento.exclusivas`), que corre por
       fora do `total`: somá-lo faria o painel fechar num número maior que o
       mostrado. Quem o exibe é a contagem de exclusivas da própria fila. */
    orcamento: [
      { label: `${g.label} (Base)`, valor: orcamento.base },
      { label: "Adicionais do Grau", valor: orcamento.maxAdicionais },
      ...parcelasDoCanal(efe.detalhes, "orcamentoLivre", "orcamentoPago"),
      ...(ovr?.ajusteAcoes ? [{ label: "Feitiço de Criação", valor: ovr.ajusteAcoes }] : []),
      // O que o tipo vetou (a Maldição não recebe vaga a mais), com o nome da fonte.
      ...efe.vetadosPeloTipo.map((v) => ({ label: `${v.nome} (Não se Aplica)`, valor: 0 })),
    ],
    vagasPericia: [
      ...partesPericiasInvocacao(invEf),
      ...parcelasDoCanal(efe.detalhes, "pericias"),
    ],
  };

  // A cota de perícia conta o que a FICHA treinou: o treino da Herança é concedido.
  const perProf = (invCru?.periciasProf && typeof invCru.periciasProf === "object") ? invCru.periciasProf : {};
  const pericias = {
    allowance: periciasAllowanceInvocacao(invEf) + efe.pericias,
    usadas: usoPericias(perProf), // Mestre gasta 2, Treinado gasta 1
  };
  /* ⚠ A notação sai daqui JÁ ESTRUTURADA, num lugar só. O `resolveAcao` remonta
     o dado em vários pontos (níveis de dano, habilidades da Invocação), e
     estruturar em cada um deles seria quatro cópias da mesma conta. Ver
     `dadosDaNotacao` para o porquê de ser uma LISTA. */
  const comGrupos = (bloco) =>
    (bloco?.dado ? { ...bloco, grupos: dadosDaNotacao(bloco.dado) } : bloco);
  const acoes = (inv?.acoes || []).map((a) => {
    const r = resolveAcao(a, invEf, donoLocal, inv);
    return {
      ...r,
      dano: comGrupos(r.dano),
      cura: comGrupos(r.cura),
      danoAdicional: comGrupos(r.danoAdicional),
    };
  });
  /* A lista de AUXÍLIOS que a mesa liga e desliga, com o estado de cada um. Sai
     das ações já resolvidas para o número da linha ser o mesmo que a ação
     mostra, e traz o não-sustentável junto (`sustentavel: false`) porque a Ficha
     precisa saber que ele EXISTE para desenhá-lo sem interruptor. */
  const auxilios = acoes
    .filter((a) => a.familia === "auxilio")
    .map((a) => ({
      id: a.id,
      nome: a.nome || "Auxílio",
      sub: a.auxilioSub,
      subLabel: AUXILIO_ROTULO[a.auxilioSub] ?? a.auxilioSub,
      alvo: a.alvoAuxilio,
      alvoLabel: ALVO_AUXILIO_ROTULO[a.alvoAuxilio] ?? a.alvoAuxilio,
      valor: a.valor ?? null,
      dado: a.danoAdicional?.dado ?? null,
      custoPE: a.custoPE ?? 0,
      sustentavel: AUXILIO_SUSTENTAVEL.includes(a.auxilioSub),
      ligado: AUXILIO_SUSTENTAVEL.includes(a.auxilioSub) && auxilioLigado(aux.sessao, a.id),
    }));

  /* ⚠ A MALDIÇÃO TEM FICHA ADAPTADA (2026-09-30, Etapa 8): "Seus atributos Base
     são mantidos" e "Seus Treinamentos e Masterizações são mantidos", então os
     avisos do point-buy e da cota de perícias do guia de criação não valem nela.
     O limite de Ações e Características continua ("Elas ainda devem seguir o seu
     limite máximo de Características e Ações"). */
  const warnings = [...(regras.fichaAdaptada ? [] : atributos.warnings), ...caract.warnings, ...her.warnings];
  // Tipo antigo, lido como Shikigami e nunca convertido sozinho.
  if (tipoLegadoDispositivo(inv)) warnings.push("Tipo antigo Dispositivo lido como Invocação.");
  /* Pré-requisito de classe, pelo nível REAL (DA-13): "É preciso ter nível 17
     para criar Marionetes de Grau Especial" (e Corpos). Aviso, nunca bloqueio. */
  if (g.value === "especial" && regras.especialNivelReal
    && (dono.nivelControladorReal ?? 0) < regras.especialNivelReal) {
    warnings.push(`${regras.label} de Grau Especial pede nível ${regras.especialNivelReal} de Controlador.`);
  }
  // Fundamento só existe no Shikigami de Técnica, e é um por ficha.
  if (inv?.fundamento && ehShikigamiDeTecnica(inv) && (dono.fundamentos ?? 0) > 1) {
    warnings.push(`${dono.fundamentos} Invocações marcadas como Fundamento, e a Técnica Inata tem um só.`);
  }
  // Grau ditado pelo Feitiço de Criação de Shikigamis: o nível do Feitiço manda,
  // e a invocação que não bate com ele é um erro de ficha.
  if (ovr?.grauExigido && ovr.grauExigido !== g.value) {
    warnings.push(`${ovr.fonte || "Feitiço de Shikigami"} exige ${grauMeta(ovr.grauExigido).label}.`);
  }
  // Mais de um Feitiço de Shikigami apontando para esta mesma invocação: vale o
  // primeiro, e os outros ficam sem shikigami nenhum.
  if (ovr?.disputa?.length > 1) {
    warnings.push(`${ovr.disputa.length} Feitiços apontam para esta invocação (${ovr.disputa.join(", ")}), e só o primeiro vale.`);
  }
  if (orcamento.usados > orcamento.total) {
    warnings.push(`Ações/Características: ${orcamento.usados} de ${orcamento.total} (excedeu).`);
  }
  // Perícias treinadas: uma Invocação não pode ser treinada em Ofício, e o total
  // segue o limite (1 + metade do melhor mod entre INT/SAB + ganho por grau).
  // Qualquer linha de Ofício, e não só a do livro: a ficha pode ter Ofícios
  // repetidos desde 2026-08-30, e o aviso vale para todos.
  if (!regras.fichaAdaptada && Object.keys(perProf).some(ehPericiaOficio)) {
    warnings.push("Invocação não pode ser treinada em Ofício.");
  }
  if (!regras.fichaAdaptada && pericias.usadas > pericias.allowance) {
    warnings.push(`Perícias treinadas: ${pericias.usadas} de ${pericias.allowance} (excedeu).`);
  }
  // Efeitos passivos que NÃO acumulam: no máximo uma Característica de Vida e uma
  // de Tamanho (o livro proíbe duas características com o mesmo efeito). RD e
  // Teste podem repetir, desde que em tipos de dano / testes diferentes.
  const porSubtipo = {};
  for (const c of caracteristicas) porSubtipo[c.subtipo] = (porSubtipo[c.subtipo] || 0) + 1;
  if (porSubtipo.vida > 1) warnings.push("Mais de uma Característica de Vida: efeitos iguais não acumulam.");
  if (porSubtipo.tamanho > 1) warnings.push("Mais de uma Característica de Tamanho: escolha só uma.");
  // Limite de Ações com Custo por grau. Só as opt-in do jogador contam: o custo
  // obrigatório de 2 PE da Cura não é uma Ação com Custo.
  const comCusto = acoes.filter((a) => a.acaoComCusto).length;
  if (comCusto > (INV_ACOES_COM_CUSTO_MAX[g.value] ?? 0)) {
    warnings.push(`Ações com Custo: ${comCusto} de ${INV_ACOES_COM_CUSTO_MAX[g.value]} (excedeu).`);
  }
  // Otimização de Energia: "UMA habilidade com custo de CADA invocação".
  const otimizadas = acoes.filter((a) => a.custoOtimizado).length;
  if (otimizadas > 1) {
    warnings.push(`Otimização de Energia: ${otimizadas} ações marcadas, e vale só uma por invocação.`);
  }
  for (const a of acoes) for (const w of a.warnings || []) warnings.push(`${a.nome || "Ação"}: ${w}`);
  for (const c of caracteristicas) for (const w of c.warnings || []) warnings.push(`${c.nome || "Característica"}: ${w}`);
  // Canal de efeito que não existe: erro de catálogo, não de ficha, mas aparece
  // aqui porque é o único lugar que enxerga o efeito aplicado.
  for (const d of efe.canaisDesconhecidos || []) {
    warnings.push(`${d.nome}: canal de efeito desconhecido "${d.canal}".`);
  }
  for (const d of efe.semAlvo || []) {
    warnings.push(`${d.nome}: ${INV_EFEITO_CANAL_LABEL[d.canal] ?? d.canal} sem alvo.`);
  }
  for (const p of attrEf.perdas) {
    warnings.push(`${rotuloAttrInv(p.k)}: ${p.perdido} de bônus acima do máximo ${p.max} do grau.`);
  }

  return {
    id: inv?.id,
    nome: inv?.nome || "",
    grau: g.value,
    grauLabel: g.label,
    /* ⚠ O TIPO SAI NORMALIZADO desde 2026-09-30. Saía o valor cru, e uma ficha
       com o antigo "dispositivo" chegava à tela com esse tipo enquanto o rótulo
       dizia "Invocação": cada leitor normalizava de um jeito. */
    tipoMecanico: tipoMecanicoDaInvocacao(inv),
    familia: regrasDoTipo(inv).familia,
    regras: regrasDoTipo(inv),
    tipoLabel: tipoInvocacaoLabel(inv),
    intermediario: regrasDoTipo(inv).intermediario,
    retirada: regrasDoTipo(inv).retirada,
    pv, defesa, deslocamento, custo, tamanho, rd,
    /* INTEGRIDADE DA ALMA da invocação = o máximo de PV dela (autor,
       2026-08-31). É a régua do livro do JOGADOR, e não a da criatura: lá a
       Alma é uma porcentagem de 0 a 100 que MULTIPLICA o PV, e aqui ela
       acompanha o PV em pontos. Uma invocação com escala de porcentagem teria
       dois números medindo a mesma casca.

       ⚠ A MARIONETE NÃO TEM ALMA (2026-09-30, Etapa 8): "Marionetes são imunes a
       dano na alma". O máximo vira zero e `temAlma` some, e a Ficha esconde a
       barra. O Corpo tem a alma no núcleo, com a mesma régua do PV. */
    almaMax: regras.alma === "nenhuma" ? 0 : pv,
    temAlma: regras.alma !== "nenhuma",
    imunidades: [...new Set([...imunidadesDoTipo(inv), ...her.imunidades])],
    /* Os tipos especiais (2026-09-30, Etapa 8). Cada campo existe só no tipo que o
       usa, e vale `null` nos outros, para a Ficha não ter de saber a regra. */
    fundamento: ehShikigamiDeTecnica(inv) && !!inv?.fundamento,
    natureza: naturezaDoCorpo(inv) || null,
    refeicao: refeicaoDoCorpo(inv, dono),
    reparo: reparoDaInvocacao(inv),
    duracao: duracaoDoCorpo(regras, g, dono),
    nivelAptidao: nivelAptidaoDaMaldicao(regras, dono),
    psiquicoNoInvocador: !!regras.psiquicoNoInvocador,
    /* As modificadoras de 2026-09-30 que não são número de canal: a Resistência a
       dano (lista de tipos) e o Arsenal (quantos itens ela guarda). */
    resistencias: [
      ...caract.resistencias,
      ...her.resistencias.filter((r) => !caract.resistencias.some((x) => x.tipo === r.tipo)),
    ],
    arsenal: caract.arsenal,
    // As Heranças, achatadas (as herdadas de uma herança morta entram junto).
    herancas: her.resumo,
    /* As Intrínsecas e as Auras (2026-09-30, Etapa 6). A Aura sai com o estado de
       mesa: `ligada` quando o dono está nela e ela está em campo. */
    deslocamentos,
    intrinsecas: caract.intrinsecas,
    efeitosIntrinsecos: caract.efeitosIntrinsecos,
    auras: caract.auras.map((a) => ({ ...a, ligada: !!aux.sessao.emCampo && !!aux.sessao.auras?.[a.caracId] })),
    emTarefa: !!aux.sessao.emTarefa && !!caract.efeitosIntrinsecos.emTarefa,
    /* A Autonomia paga na entrada (turno próprio enquanto em campo), e as
       Aptidões de Controle e Leitura do dono que ela pode usar (Controle
       Aprimorado, E-04). As duas de 2026-09-30, Etapa 7. */
    autonomiaAtiva: !!aux.sessao.emCampo && !!aux.sessao.autonomia,
    aptidoesDoControlador: Array.isArray(dono.aptidoesPelaInvocacao) ? dono.aptidoesPelaInvocacao : [],
    forma: aux.sessao.forma && caract.efeitosIntrinsecos[aux.sessao.forma === "arma" ? "formaArma" : "formaArmadura"]
      ? aux.sessao.forma : null,
    /* Estado de mesa: em campo, os auxílios com o interruptor de cada um, e o
       que ela está entregando ao DONO agora (que o `deriveAfty` transforma em
       efeito de Motor, com o nome dela como fonte). */
    emCampo: aux.sessao.emCampo,
    auxilios,
    auxiliosParaAliados: aux.paraAliados,
    auxilioProprio: aux.proprio,
    /* Retrato e tema próprios. Viajam resolvidos porque a Ficha e o criador leem
       do mesmo lugar, e a invocação sem retrato cai no desenho de sempre. */
    portraitUrl: typeof inv?.portraitUrl === "string" ? inv.portraitUrl : "",
    portraitFocus: inv?.portraitFocus || { x: 50, y: 50 },
    aparencia: inv?.aparencia || null,
    // O rótulo sai resolvido, como o `grauLabel`: quem tem o catálogo de
    // tamanhos é este lado.
    tamanhoLabel: AFTY_TAMANHOS.find((t) => t.value === tamanho)?.label ?? tamanho,
    atributos, orcamento, pericias, fontes,
    bonusTesteHabilidade: efe.bonusTeste,
    efeitosHabilidade: efe,
    caract,
    marcadores: marcadoresDaInvocacao(inv, dono),
    tracos: tracosDeTecnica(inv),
    opcoesDeUso: opcoesDeUso(inv, dono),
    // O editor precisa saber se a marca de Otimização de Energia sequer existe
    // para esta ficha, e isso vem do dono, não da invocação.
    otimizacaoEnergia: !!dono.otimizacaoEnergia,
    // Crítico Aprimorado desce a margem das jogadas DELA para 19, e a Ficha
    // precisa do número na hora de rolar o acerto.
    margemCritico: dono.margemCritico ?? 20,
    criticoBrutal: !!dono.criticoBrutal,
    shikigami: ovr || null,
    testes: trsPeloInvocador(resolveTestesInvocacao(invEf, donoLocal, caract), regras, dono),
    iniciativa: iniciativaDaInvocacao(invEf, regras, efe),
    acoes, caracteristicas,
    /* O contexto que o `modificadorExpr` enxerga, para o seletor de variáveis do
       editor. Sai SEM os valores resolvidos de propósito: é exatamente o que o
       `ctxParaExpr` avalia, e um seletor mostrando o PV final enquanto a
       expressão lê o PV base seria um seletor que mente. */
    contextoDsl: buildInvocacaoDslContext(inv, dono),
    warnings,
  };
}

/**
 * Lista de invocações do dono, resolvida. `dono` traz nd/bt/nivelControlador,
 * os `efeitos` das Habilidades, os `marcadores` disponíveis (com o limite já
 * avaliado) e os `overridesPorInvocacao` dos Feitiços de Shikigami.
 */
/**
 * ============================================================
 * FUSÃO ESTRUTURAL: o que NÃO cabe num canal
 * ============================================================
 * Canal carrega NÚMERO. "A Quimera recebe todos os Treinamentos de Perícia das
 * sombras fundidas" e "recebe o maior atributo entre as sombras fundidas"
 * carregam LISTA e MAPA, e por isso nunca teriam como sair de um `efeitosInvocacao`.
 *
 * ⚠ A POLÍTICA É DADO DO ADDON, e a execução é do motor. O marcador declara
 * `herdaDaFonte: { pericias: "uniao", atributos: "maior" }`, e é este arquivo que
 * sabe o que "união" e "maior" querem dizer. É a mesma divisão de sempre: o
 * verbo no motor, o substantivo no addon.
 *
 * As políticas, e de onde cada uma saiu:
 *
 *   pericias: "uniao"       — Quimera: "recebe todos os Treinamentos de Perícia
 *                             das sombras fundidas". Vale a MAIOR faixa.
 *   pericias: "escalonado"  — sobe um degrau a partir do que já tem, e o que
 *                             passa do mestre vira bônus. NENHUM PACOTE PEDE ESTA
 *                             POLÍTICA HOJE, e ver o aviso logo abaixo.
 *   atributos: "maior"      — Quimera: "recebe o maior atributo entre as sombras
 *                             fundidas [...] sempre do maior valor". Vale o MAIOR
 *                             entre a ficha da própria invocação e as fontes.
 *   atributos: "maiorFixo"  : o mesmo texto, lido como valor FIXO (2026-09-19,
 *                             pedido do autor): cada atributo passa a ser
 *                             EXATAMENTE o maior valor daquele atributo entre as
 *                             invocações fundidas, e a ficha da própria invocação
 *                             deixa de contar. Sem fonte declarada, nada muda.
 *   ataque: "uniao"         — Quimera: "recebe todos os Treinamentos de [...]
 *                             Acerto". Quem já tem um treino mantém o dele.
 *   tr: "uniao"/"escalonado" — os mesmos dois modos das perícias, agora que o TR
 *                             é MAPA (2026-09-02, a pedido do autor).
 *
 * ------------------------------------------------------------
 * ⚠ O `escalonado` ESTÁ SEM DONO DESDE 2026-09-04, E DE PROPÓSITO
 * ------------------------------------------------------------
 * Ele nasceu para a Herança das Sombras, que dizia *"se torna treinado nas
 * mesmas perícias e TRs da sombra de herança. Caso já seja treinado, se torna
 * mestre. Caso já seja mestre, recebe um bônus de +3 para cada sombra com a
 * mesma perícia, e +2 em TR para cada sombra com os mesmos TRs"*. O autor trocou
 * a frase inteira por *"+1 em TRs, Perícias e Acerto para cada Sombra Herdada"*,
 * que é o canal `bonusTeste` e não fusão de faixa, e o marcador da Herança
 * perdeu o `herdaDaFonte`.
 *
 * A política ficou porque ela é VERBO: este arquivo sabe o que "escalonado"
 * quer dizer, e um addon futuro a alcança escrevendo uma linha de JSON. Apagá-la
 * seria jogar fora capacidade para não deixar código sem chamador hoje.
 *
 * ⚠ Só o `uniao`, o `maior` e o `ataque` têm dono agora, os três na Quimera. Um
 * conserto no `escalonado` daqui em diante não tem assert de ponta a ponta
 * cobrindo, porque nenhum pacote o exercita.
 *
 * O EXCEDENTE, que só o `escalonado` usa: mestre é o teto da escada, então a
 * partir dele cada fonte a mais não tem degrau para subir. `usados` é quantas
 * fontes a escada consome até o mestre, e o que sobra paga bônus.
 */
const BONUS_EXCEDENTE = { pericias: 3, tr: 2 };
const PROF_POR_RANK = { 0: null, 1: "treinado", 2: "mestre" };

export function aplicarFusaoDeFontes(inv, marcadores = [], porId = new Map()) {
  const comPolitica = marcadores.filter((m) => m?.herdaDaFonte && marcadorLigado(inv, m.id));
  if (!comPolitica.length) return inv;

  const periciasProf = { ...(inv?.periciasProf || {}) };
  const trProf = { ...trProfDaInvocacao(inv) };
  const atributos = { ...(inv?.atributos || {}) };
  let ataqueTreinado = inv?.ataqueTreinado ?? null;
  const bonus = { pericias: {}, resistencias: {} };
  let mexeu = false;

  /* Um passo, servindo perícia e TR: os dois são mapa `id -> faixa` e a regra
     escrita para eles é a mesma frase. */
  const fundirFaixas = (destino, mapasDaFonte, modo, tipo, sacola, rotulo) => {
    // Quantas fontes têm CADA id, que é o "para cada sombra com a mesma perícia".
    const quantas = {};
    for (const mapa of mapasDaFonte) {
      for (const [id, nivel] of Object.entries(mapa || {})) {
        if (RANK_PROF_INV[nivel]) quantas[id] = (quantas[id] || 0) + 1;
      }
    }
    for (const [id, n] of Object.entries(quantas)) {
      const atual = RANK_PROF_INV[destino[id]] ?? 0;
      if (modo === "uniao") {
        // Vale a MAIOR faixa vista, sem promover e sem excedente.
        const melhor = Math.max(atual, ...mapasDaFonte.map((mp) => RANK_PROF_INV[mp?.[id]] ?? 0));
        if (melhor !== atual) { destino[id] = PROF_POR_RANK[melhor]; mexeu = true; }
        continue;
      }
      // Escalonado: sobe a escada e o que passar do mestre vira bônus.
      const usados = Math.max(0, 2 - atual);
      const novo = Math.min(2, atual + n);
      if (novo !== atual) { destino[id] = PROF_POR_RANK[novo]; mexeu = true; }
      const excedente = Math.max(0, n - usados);
      if (excedente) {
        sacola[id] = (sacola[id] || 0) + excedente * BONUS_EXCEDENTE[tipo];
        // Quem gerou o excedente dá o nome à parcela no hover da Ficha. Sem
        // isso o jogador via um "+2" avulso no TR sem saber de qual marcador.
        bonus.fonte = bonus.fonte || rotulo;
        mexeu = true;
      }
    }
  };

  for (const m of comPolitica) {
    const fontes = marcadorFontes(inv, m.id)
      .filter((fid) => fid !== inv?.id)
      .map((fid) => porId.get(fid))
      .filter(Boolean);
    if (!fontes.length) continue;
    const pol = m.herdaDaFonte;

    if (pol.pericias === "uniao" || pol.pericias === "escalonado") {
      fundirFaixas(periciasProf, fontes.map((f) => f?.periciasProf), pol.pericias, "pericias", bonus.pericias, m.label);
    }
    if (pol.tr === "uniao" || pol.tr === "escalonado") {
      fundirFaixas(trProf, fontes.map(trProfDaInvocacao), pol.tr, "tr", bonus.resistencias, m.label);
    }

    if (pol.atributos === "maior") {
      for (const f of fontes) {
        for (const [k, v] of Object.entries(f?.atributos || {})) {
          const n = Number(v);
          if (Number.isFinite(n) && n > (Number(atributos[k]) || 0)) { atributos[k] = n; mexeu = true; }
        }
      }
    }

    /* ⚠ `maiorFixo` SUBSTITUI, e não compara com a ficha da própria invocação: o
       atributo vira o maior valor entre as FONTES, mesmo que a ficha dela tenha
       um número maior ou menor. Só troca o atributo que alguma fonte declara. */
    if (pol.atributos === "maiorFixo") {
      const maiores = {};
      for (const f of fontes) {
        for (const [k, v] of Object.entries(f?.atributos || {})) {
          const n = Number(v);
          if (Number.isFinite(n) && n > (maiores[k] ?? -Infinity)) maiores[k] = n;
        }
      }
      for (const [k, n] of Object.entries(maiores)) {
        if (atributos[k] !== n) { atributos[k] = n; mexeu = true; }
      }
    }

    if (pol.ataque === "uniao" && !ataqueTreinado) {
      const daFonte = fontes.find((f) => f?.ataqueTreinado)?.ataqueTreinado;
      if (daFonte) { ataqueTreinado = daFonte; mexeu = true; }
    }
  }

  /* ⚠ `bonusDeFusao` é CALCULADO e nunca salvo: ele vive só nesta cópia, que o
     `resolveInvocacao` consome logo em seguida. Guardá-lo na ficha faria o bônus
     dobrar no dia em que a fusão rodasse de novo. */
  return mexeu ? { ...inv, periciasProf, trProf, atributos, ataqueTreinado, bonusDeFusao: bonus } : inv;
}

/**
 * ============================================================
 * OS DOIS PASSES, E POR QUE ELES EXISTEM
 * ============================================================
 * ⚠ Uma invocação pode LER OUTRA da mesma ficha desde 2026-09-02 (a Herança das
 * Sombras herda o PV da sombra morta, a Quimera soma o das fundidas). Isso é uma
 * relação, e relação não cabe num `map` de uma passada só.
 *
 * PASSE 1 resolve todas sem vínculo nenhum, e guarda o CONTEXTO de cada uma.
 * PASSE 2 refaz só as que declararam fonte, agora com os contextos do passe 1
 * pendurados em `#fontes`.
 *
 * ⚠ O CICLO MORRE SOZINHO, e é o motivo de o passe 1 existir mesmo para quem tem
 * fonte: se A declara B e B declara A, os dois leem o contexto de passe 1 do
 * outro, que não tem `#fontes`. O resultado é definido, não recorre e não
 * depende da ordem da lista. Uma passada só, resolvendo sob demanda, entraria em
 * laço infinito nesse caso.
 */
export function resolveInvocacoesList(lista, dono = {}) {
  const arr = Array.isArray(lista) ? lista : [];
  const marcadoresComFonte = (Array.isArray(dono.marcadores) ? dono.marcadores : [])
    .filter((m) => m?.fontes);

  /* PASSE 1: sem vínculo, e RESOLVIDO. O contexto de cada invocação é montado
     em cima do resultado dela, e não do cru.

     ⚠ A DIFERENÇA IMPORTA. `buildInvocacaoDslContext` sem `resolved` devolve
     `pv_max` e `defesa` BASE, sem as Características. A Herança diz "+1/3 dos
     Pontos de Vida da sombra de herança", e os Pontos de Vida dela incluem a
     Característica de Vida que ela tem: herdar do número base pagaria menos do
     que o livro manda. */
  const ctxPasse1 = new Map();
  for (const inv of arr) {
    if (!inv?.id) continue;
    const r = resolveInvocacao(inv, dono);
    ctxPasse1.set(inv.id, buildInvocacaoDslContext(inv, dono, {
      pv: r.pv, defesa: r.defesa, deslocamento: r.deslocamento, tamanho: r.tamanho,
    }));
  }

  /* PASSE 2: quem declarou fonte ganha `#fontes` no contexto. A chave é o id do
     marcador SANEADO, igual ao nome da variável, para o addon escrever
     `fontes("dez_sombras_heranca", ...)` do mesmo jeito que escreve
     `marc_dez_sombras_heranca`. */
  const donoDe = (inv) => {
    if (!marcadoresComFonte.length) return dono;
    const mapa = {};
    for (const m of marcadoresComFonte) {
      if (!marcadorLigado(inv, m.id)) continue;
      const ctxs = marcadorFontes(inv, m.id)
        .filter((fid) => fid !== inv?.id)          // ninguém é fonte de si mesmo
        .map((fid) => ctxPasse1.get(fid))
        .filter(Boolean);
      if (ctxs.length) mapa[normalizarMarca(varDeMarcador(m.id).replace(/^marc_/, ""))] = ctxs;
    }
    return Object.keys(mapa).length ? { ...dono, [CHAVE_FONTES]: mapa } : dono;
  };
  const porId = new Map(arr.filter((i) => i?.id).map((i) => [i.id, i]));
  const resolvidas = arr.map((inv) =>
    resolveInvocacao(aplicarFusaoDeFontes(inv, marcadoresComFonte, porId), donoDe(inv)));
  // Contagem por marcador: quantas invocações estão marcadas contra o limite
  // daquele marcador. É o que a aba mostra e o que dispara o aviso de excesso.
  const marcadores = (Array.isArray(dono.marcadores) ? dono.marcadores : []).map((m) => {
    const marcadas = arr.filter((inv) => marcadorLigado(inv, m.id)).length;
    const semOpcao = Array.isArray(m.opcoes) && m.opcoes.length
      ? arr.filter((inv) => marcadorLigado(inv, m.id) && !marcadorOpcao(inv, m.id)).length
      : 0;
    return { ...m, marcadas, semOpcao, excedeu: marcadas > (m.limite ?? 0) };
  });
  return {
    lista: resolvidas,
    total: resolvidas.length,
    custoTotal: resolvidas.reduce((s, r) => s + r.custo, 0),
    temWarnings: resolvidas.some((r) => r.warnings.length > 0),
    marcadores,
    espacosIntermediarios: espacosDeIntermediario(arr),
  };
}

/**
 * Os auxílios que as invocações LIGADAS estão entregando ao dono, como efeitos
 * do Motor de Automação.
 *
 * ⚠ ELES ENTRAM PELO MOTOR, e não somados à mão no `deriveAfty`, por três
 * razões que já custaram bug neste repositório:
 *   1. o hover de fontes mostra "Nue · Escudo de Raios +3" de graça, porque todo
 *      canal já carrega a fonte (ver `afty-fontes-visiveis-ui`);
 *   2. o delta da aba Buffs mede um estado ligando e desligando o MESMO derive,
 *      então um bônus somado por fora sairia como bônus de outra coisa;
 *   3. `duracao: "temporaria"` já diz ao motor que isto não conta para
 *      pré-requisito, que é exatamente a regra de um bônus de mesa.
 *
 * ⚠ O CONTEXTO É LEVE DE PROPÓSITO. O valor de um auxílio de Defesa, Acerto ou
 * RD sai da tabela do grau e da classe da ação, e não lê stat nenhum do dono.
 * Se lesse, isto seria um laço: o dono precisaria da Defesa dele para calcular
 * o que sobe a Defesa dele.
 */
/**
 * As AURAS que o dono está recebendo desta invocação agora (2026-09-30, Etapa 6).
 *
 * ⚠ O APP NÃO TEM POSIÇÃO, e por isso a aura não vale sozinha: só a que a mesa
 * marcou "Na Aura" (`sessao.invocacoes[id].auras[caracId]`), com a invocação em
 * campo, do Segundo Grau em diante e com o alvo escolhido. A aura não vale na
 * própria invocação (decisão do autor). Leve como os auxílios: lê o grau, a
 * escolha e a sessão, e nenhum número que a resolução mexe.
 */
export function aurasLigadasDa(inv, dono = {}) {
  const sess = sessaoDaInvocacao(dono, inv?.id);
  if (!sess.emCampo) return [];
  const g = grauMeta(inv?.grau);
  const out = [];
  for (const c of Array.isArray(inv?.caracteristicas) ? inv.caracteristicas : []) {
    const entrada = caracteristicaDoCatalogo(c?.subtipo);
    if (entrada?.categoria !== "aura" || !sess.auras?.[c.id]) continue;
    if (g.rank < grauMeta(entrada.grauMin || "segundo").rank) continue;
    const alvo = entrada.alvoParam ? (c.parametros?.[entrada.alvoParam] || "") : null;
    if (entrada.alvoParam && !alvo) continue;
    const valor = valorPorGrau(entrada, g.value) ?? 0;
    if (!valor) continue;
    out.push({ subtipo: entrada.id, canal: entrada.canalDono, alvo, valor, nome: c.nome || entrada.nome });
  }
  return out;
}

export function efeitosDeInvocacao(creature, ctx = {}) {
  const lista = Array.isArray(creature?.invocacoes) ? creature.invocacoes : [];
  if (!lista.length) return [];
  const dono = {
    nd: ctx.nd,
    bt: ctx.bt,
    nivelControlador: ctx.nivelControlador,
    sessaoInvocacoes: ctx.sessaoInvocacoes,
  };
  const out = [];
  /* ⚠ A QUIMERA TAMBÉM ENTREGA AUXÍLIO (2026-09-23). Ela ganhou ficha na mesa, com
     o interruptor de cada auxílio, e um interruptor que acende sem mexer no número
     do dono é pior que nenhum. Entra a mesma cópia leve que o `resolveQuimera`
     monta (id `quimera:<id>`, Ações próprias ou as da principal), sem resolver a
     fusão inteira: o valor do auxílio sai do grau e da classe da ação, e não lê
     nenhum número que a fusão mexe. */
  const quimeras = (Array.isArray(creature?.quimeras) ? creature.quimeras : []).flatMap((q) => {
    const principal = lista.find((x) => x.id === q?.principalId);
    const fundidas = (Array.isArray(q?.fundidasIds) ? q.fundidasIds : [])
      .filter((id) => id !== principal?.id && lista.some((x) => x.id === id));
    if (!principal || !fundidas.length) return [];
    return [{
      ...principal,
      id: `quimera:${q.id}`,
      nome: q.nome || principal.nome,
      acoes: Array.isArray(q.acoes) ? q.acoes : principal.acoes,
    }];
  });
  /* As auras de TODAS as invocações, para a disputa: duas Auras iguais (o mesmo
     tipo de Aura no mesmo alvo) não acumulam, vale a maior (decisão do autor),
     mesmo vindo de invocações diferentes. ⚠ Não usa o pool exclusivo do Motor: na
     criatura ele é um só, e a aura brigaria com os bônus de Técnica do dono. */
  const aurasPorChave = new Map();
  for (const inv of [...lista, ...quimeras]) {
    for (const a of auxiliosLigadosDa(inv, dono).paraAliados) {
      out.push({
        canal: a.canal,
        expr: String(a.valor),
        duracao: "temporaria",
        origem: "invocacao",
        nome: `${inv?.nome || "Invocação"} · ${a.nome}`,
      });
    }
    for (const a of aurasLigadasDa(inv, dono)) {
      const chave = `${a.subtipo}|${a.alvo ?? ""}`;
      const antes = aurasPorChave.get(chave);
      if (!antes || a.valor > antes.valor) aurasPorChave.set(chave, { ...a, dono: inv?.nome || "Invocação" });
    }
  }
  for (const a of aurasPorChave.values()) {
    // A Aura de Dano é um DADO nomeado (1d4, 1d6, 1d8): o alvo é o dado, o valor é 1.
    const dado = a.canal === "dadosNomeados";
    out.push({
      canal: a.canal,
      ...(dado ? { alvo: `d${a.valor}` } : a.alvo ? { alvo: a.alvo } : {}),
      expr: dado ? "1" : String(a.valor),
      duracao: "temporaria",
      origem: "invocacao",
      nome: `${a.dono} · ${a.nome}`,
    });
  }
  return out;
}


// ============================================================
// FATIA 3 — Hordas
// ============================================================
// Uma Horda escolhe uma Invocação sua como LÍDER (Primeiro Grau ou inferior, ou
// seja, não Especial) e adiciona MEMBROS de grau estritamente INFERIOR ao líder.
// A maioria dos valores (deslocamento, ações) segue o líder. Custo e PV crescem
// com os membros, e as ações do líder ganham escalonamento pelas notas "Caso
// seja uma Horda" das tabelas. Ver "CRIANDO HORDAS" no doc.

/** Custo adicional em PE por membro, conforme o grau do membro. */
export const INV_HORDA_CUSTO_MEMBRO = { quarto: 1, terceiro: 2, segundo: 3 };

/**
 * Uma Horda em branco (2026-10-01, Etapa 9, campos novos opcionais):
 *   hoste       criada pela Hoste Amaldiçoada: o líder desce um grau, e o par
 *               (`parId`, a outra horda da mesma ação) conta como UMA no limite
 *               de hordas em campo
 *   liderHorda  a Característica Líder de Horda do líder: `membroId` e o `caracId`
 *               da Característica desse membro que o líder recebe
 */
export function createBlankHorda() {
  return {
    id: novoId("horda"), nome: "", liderId: "", membroIds: [],
    hoste: false, parId: "", liderHorda: { membroId: "", caracId: "" },
  };
}

/** O teto de grau do líder: Primeiro Grau (rank 4), e um abaixo com a Hoste. */
const rankMaxDoLider = (hoste) => (hoste ? 3 : 4);

/** Quem nunca compõe Horda: o tipo que a recusa e os núcleos de um Corpo de
    Múltiplos Núcleos ("Quimeras, Mechas e Corpos Amaldiçoados de Múltiplos
    Núcleos não podem compor Hordas"). A Quimera e o Mecha nem estão na lista. */
const podeComporHorda = (inv, excluidos) => regrasDoTipo(inv).horda && !excluidos.has(inv?.id);

/** Invocações que podem LIDERAR (Primeiro Grau ou inferior, Segundo com a Hoste). */
export function lideresElegiveis(invocacoes = [], { hoste = false, excluidos = [] } = {}) {
  const fora = new Set(excluidos);
  return (Array.isArray(invocacoes) ? invocacoes : [])
    .filter((inv) => grauMeta(inv.grau).rank <= rankMaxDoLider(hoste) && podeComporHorda(inv, fora));
}

/** Invocações que podem ser MEMBRO de um líder (grau estritamente inferior). */
export function membrosElegiveis(invocacoes = [], lider, { excluidos = [] } = {}) {
  if (!lider) return [];
  const rl = grauMeta(lider.grau).rank;
  const fora = new Set(excluidos);
  return (Array.isArray(invocacoes) ? invocacoes : []).filter(
    (inv) => inv.id !== lider.id && grauMeta(inv.grau).rank < rl && podeComporHorda(inv, fora),
  );
}

/**
 * Os membros que SAEM quando a horda chega à metade da vida: "ela perde metade
 * dos seus membros, iniciando pelos de grau menor". Metade para baixo (a regra
 * da casa), e no mesmo grau sai primeiro o último que entrou. Pura: recebe os
 * membros ativos (`[{ id, rank }]`) e devolve os ids que saem.
 */
export function membrosQueSaem(ativos = []) {
  const n = Math.floor(ativos.length / 2);
  if (!n) return [];
  return ativos
    .map((m, i) => ({ ...m, i }))
    .sort((a, b) => a.rank - b.rank || b.i - a.i)
    .slice(0, n)
    .map((m) => m.id);
}

// Sobe N categorias de tamanho a partir de um tamanho (clamp em Colossal).
function subirTamanho(tam, n) {
  const i = TAMANHO_ORDEM.indexOf(tam);
  if (i < 0) return tam;
  return TAMANHO_ORDEM[Math.min(TAMANHO_ORDEM.length - 1, i + n)];
}

// Ajusta o resultado de UMA ação do líder pelo escalonamento da horda.
function ajusteHordaAcao(base, escala) {
  const h = {};
  /* O dado sai com os `grupos` junto, pela mesma razão do `resolveInvocacao`:
     quem tem o número entrega o número, e ninguém relê notação de volta de uma
     string. Ver `dadosDaNotacao`. */
  const comDado = (dado) => ({ dado, grupos: dadosDaNotacao(dado) });
  if (base.familia === "ataque" && base.dano?.dado && escala.danoNiveis > 0) {
    h.dano = subirNiveisDano(base.dano.dado, escala.danoNiveis).dado;
    h.danoGrupos = comDado(h.dano).grupos;
  }
  if (base.auxilioSub === "cura" && base.cura?.dado && escala.curaNiveis > 0) {
    h.cura = subirNiveisDano(base.cura.dado, escala.curaNiveis).dado;
    h.curaGrupos = comDado(h.cura).grupos;
  }
  if (base.auxilioSub === "danoAdicional" && base.danoAdicional?.dado && escala.danoAdicionalNiveis > 0) {
    h.danoAdicional = subirNiveisDano(base.danoAdicional.dado, escala.danoAdicionalNiveis).dado;
    h.danoAdicionalGrupos = comDado(h.danoAdicional).grupos;
  }
  if ((base.auxilioSub === "defesa" || base.auxilioSub === "acerto") && escala.defesaAcertoBonus > 0) {
    h.valor = (base.valor ?? 0) + escala.defesaAcertoBonus;
  }
  if (base.auxilioSub === "rd" && escala.rdBonus > 0) {
    h.valor = (base.valor ?? 0) + escala.rdBonus;
  }
  return Object.keys(h).length ? h : null;
}

/**
 * Resolve uma Horda a partir das fichas de invocação do dono.
 *
 * ⚠ O LÍDER E OS MEMBROS SAEM DA LISTA RESOLVIDA (E-07, 2026-10-01), e não de um
 * `resolveInvocacao` solto. A resolução solta pulava o passe de fontes, e o bônus
 * que um marcador com `fontes()` dava ao líder sumia dentro da horda: a mesma
 * invocação tinha um número no cartão e outro na horda. `base` é essa lista, e
 * quem resolve várias hordas a passa pronta (`resolveHordasList`).
 *
 * A MESA (2026-10-01, Etapa 9): a horda tem linha própria na sessão
 * (`horda:<id>`). Os membros ativos (`membrosAtivos`) mudam as escalas, e a
 * marca `pvMaxMetade` corta o PV máximo da horda nova cujo líder liderou outra
 * dissipada no mesmo combate. O PV máximo NÃO cai com os membros perdidos
 * (confirmado pelo autor em 2026-10-03).
 */
export function resolveHorda(horda, invocacoes = [], dono = {}, base = null) {
  const fichas = Array.isArray(invocacoes) ? invocacoes : [];
  const resolvidas = Array.isArray(base) ? base : resolveInvocacoesList(fichas, dono).lista;
  const resDe = (id) => resolvidas.find((r) => r.id === id) ?? null;
  const lider = fichas.find((x) => x.id === horda?.liderId) || null;
  const membros = (horda?.membroIds || []).map((id) => fichas.find((x) => x.id === id)).filter(Boolean);
  const warnings = [];
  const hoste = !!horda?.hoste;
  const mesaId = `horda:${horda?.id}`;
  const out = {
    id: horda?.id, mesaId, nome: horda?.nome || "", liderId: horda?.liderId || "",
    membros: membros.map((m) => m.id), membrosCount: membros.length, valido: true, warnings,
    hoste, parId: hoste ? (horda?.parId || "") : "",
  };

  if (!lider) { warnings.push("Escolha um líder para a horda."); out.valido = false; return out; }
  const rl = grauMeta(lider.grau).rank;
  const excluidos = new Set(Array.isArray(dono.nucleosIds) ? dono.nucleosIds : []);
  if (rl > rankMaxDoLider(hoste)) {
    warnings.push(hoste
      ? "Na Hoste Amaldiçoada o líder deve ser de Segundo Grau ou inferior."
      : "O líder deve ser de Primeiro Grau ou inferior.");
    out.valido = false;
  }
  if (hoste && !dono.hosteAmaldicoada) warnings.push("Hoste Amaldiçoada sem a Habilidade.");
  if (!podeComporHorda(lider, excluidos)) {
    warnings.push(`${lider.nome || "Líder"} não pode compor uma Horda.`);
    out.valido = false;
  }
  /* E-02: "possuindo um limite igual ao seu máximo possível em campo,
     desconsiderando o líder". O limite vem do roster; sem ele (dono sem
     Controlador), não há o que conferir. */
  if (Number.isFinite(dono.limiteCampo) && membros.length > dono.limiteCampo) {
    warnings.push(`Membros: ${membros.length} de ${dono.limiteCampo} (o limite em campo, sem o líder).`);
  }
  for (const m of membros) {
    if (grauMeta(m.grau).rank >= rl) {
      warnings.push(`${m.nome || "Membro"} não pode ser de grau igual ou superior ao líder.`);
      out.valido = false;
    }
    if (!podeComporHorda(m, excluidos)) {
      warnings.push(`${m.nome || "Membro"} não pode compor uma Horda.`);
      out.valido = false;
    }
  }

  /* OS MEMBROS ATIVOS, pela mesa. Sem linha (o criador), todos. */
  const sess = dono.sessaoInvocacoes?.[mesaId] ?? null;
  const ativosIds = Array.isArray(sess?.membrosAtivos)
    ? new Set(sess.membrosAtivos)
    : new Set(membros.map((m) => m.id));
  const ativos = membros.filter((m) => ativosIds.has(m.id));

  /* LÍDER DE HORDA (Adicionais): "Escolha uma invocação que esteja na horda: você
     recebe uma característica desse shikigami a sua escolha enquanto ele se
     mantiver na horda". A Característica entra numa CÓPIA do líder, resolvida
     pela lista, e só enquanto o membro escolhido está ativo. */
  let liderRes = resDe(lider.id) ?? resolveInvocacao(lider, dono);
  const escolha = horda?.liderHorda ?? {};
  const temLiderHorda = (liderRes.intrinsecas ?? []).some((i) => i.subtipo === "liderHorda" && !i.bloqueada);
  out.liderHorda = null;
  if (temLiderHorda && escolha.membroId) {
    const fonte = membros.find((m) => m.id === escolha.membroId) ?? null;
    const carac = (fonte?.caracteristicas ?? []).find((c) => c.id === escolha.caracId) ?? null;
    if (!fonte || !carac) {
      warnings.push("Líder de Horda: escolha o membro e a Característica.");
    } else if (ativosIds.has(fonte.id)) {
      const herdada = { ...carac, id: `liderHorda:${carac.id}`, nome: `${carac.nome || "Característica"} (Líder de Horda)` };
      const copia = { ...lider, caracteristicas: [...(lider.caracteristicas ?? []), herdada] };
      liderRes = resolveInvocacoesList(fichas.map((f) => (f.id === lider.id ? copia : f)), dono).lista
        .find((r) => r.id === lider.id) ?? liderRes;
      out.liderHorda = { membroId: fonte.id, membroNome: fonte.nome || "", caracNome: carac.nome || "" };
    }
  } else if (escolha.membroId && !temLiderHorda) {
    warnings.push("Líder de Horda escolhido sem a Característica no líder.");
  }

  let pvExtra = 0, custoMembros = 0;
  for (const m of membros) {
    const mRes = resDe(m.id) ?? resolveInvocacao(m, dono);
    pvExtra += Math.floor(mRes.pv / 2);                                   // metade do PV do membro
    // Buchas de Canhão (10°): membro de quarto grau para de cobrar PE extra.
    const grauMembro = grauMeta(m.grau).value;
    const gratis = dono.membroQuartoGrauGratis && grauMembro === "quarto";
    custoMembros += gratis ? 0 : (INV_HORDA_CUSTO_MEMBRO[grauMembro] ?? 0);
  }
  /* As ESCALAS contam só os membros ativos: "perde metade dos seus membros [...]
     diminuindo todos os efeitos baseados no número de membros". */
  let danoNiveis = 0, curaNiveis = 0, nGrau2 = 0;
  for (const m of ativos) {
    const g2 = grauMeta(m.grau).value === "segundo";
    if (g2) nGrau2 += 1;
    danoNiveis += g2 ? 2 : 1;   // +1 por membro, dobrado para membro de Grau 2
    curaNiveis += g2 ? 2 : 1;
  }
  const n = ativos.length;
  const escala = {
    danoNiveis, curaNiveis,
    danoAdicionalNiveis: Math.floor(n / 2),   // +1 nível por 2 membros
    defesaAcertoBonus: Math.floor(nGrau2 / 2), // +1 por 2 membros de Grau 2
    rdBonus: n,                                // +1 por membro
    prejuizoExtra: Math.floor(n / 2),          // +1 uso de prejuízo por 2 membros
    tamanhoCategorias: Math.floor(n / 2),      // +1 categoria por 2 membros
  };

  const pvCheio = liderRes.pv + pvExtra;
  const metade = !!sess?.pvMaxMetade;
  out.lider = { id: lider.id, nome: lider.nome, grau: lider.grau };
  out.liderPv = liderRes.pv;
  out.pv = metade ? Math.floor(pvCheio / 2) : pvCheio;
  out.fontesPv = [
    { label: lider.nome || "Líder", valor: liderRes.pv },
    ...membros.map((m) => ({ label: `${m.nome || "Membro"} (Metade)`, valor: Math.floor((resDe(m.id)?.pv ?? 0) / 2) })),
    ...(metade ? [{ label: "Líder Reaproveitado", valor: out.pv - pvCheio }] : []),
  ];
  out.custo = liderRes.custo + custoMembros;
  out.deslocamento = liderRes.deslocamento;
  // ⚠ O tamanho parte do RESOLVIDO do líder, não do `lider.tamanho` cru: quem
  // define o tamanho de uma invocação é a Característica de Tamanho, e ler o
  // campo bruto fazia toda horda subir a partir de Médio.
  out.tamanho = subirTamanho(liderRes.tamanho, escala.tamanhoCategorias);
  out.tamanhoLabel = AFTY_TAMANHOS.find((t) => t.value === out.tamanho)?.label ?? out.tamanho;
  out.escala = escala;
  /* A Defesa, a RD, a CD e os testes do LÍDER (2026-10-01): "Outros valores [...]
     consideram apenas as do líder da horda". A RD contra alvo único (o nível do
     usuário) e o Fragilizado contra área são de mesa. */
  out.defesa = liderRes.defesa;
  out.rd = liderRes.rd;
  out.testes = liderRes.testes;
  out.rdContraAlvoUnico = Math.max(1, Math.trunc(Number(dono.nd) || 1));
  out.regras = liderRes.regras;
  out.componentesIds = [lider.id, ...membros.map((m) => m.id)];
  out.membrosDetalhe = membros.map((m) => ({
    id: m.id, nome: m.nome || grauMeta(m.grau).label, grau: m.grau, rank: grauMeta(m.grau).rank,
    ativo: ativosIds.has(m.id), pv: resDe(m.id)?.pv ?? 0, regras: regrasDoTipo(m),
  }));
  /* ⚠ As ações vêm do `liderRes`, e NÃO de um `resolveAcao` refeito aqui.
     Refazer perdia tudo que mora no `donoLocal` do líder (Concentrar Poder,
     Agressividade, Precisão) e também os `grupos` estruturados: a mesma ação
     rolava um dano dentro da horda e outro fora dela. */
  out.acoes = (liderRes.acoes || []).map((acaoBase) => ({
    nome: acaoBase.nome, familia: acaoBase.familia, auxilioSub: acaoBase.auxilioSub,
    base: acaoBase, horda: ajusteHordaAcao(acaoBase, escala),
  }));

  return out;
}

/**
 * Lista de hordas do dono, resolvida. A lista das invocações é resolvida UMA vez
 * (E-07), e o par da Hoste é conferido aqui, porque é relação entre duas hordas.
 */
export function resolveHordasList(hordas, invocacoes = [], dono = {}) {
  const arr = Array.isArray(hordas) ? hordas : [];
  const base = arr.length ? resolveInvocacoesList(Array.isArray(invocacoes) ? invocacoes : [], dono).lista : [];
  const lista = arr.map((h) => resolveHorda(h, invocacoes, dono, base));
  /* A Hoste cria DUAS hordas numa ação, e elas contam como uma: as duas marcadas
     e apontando uma para a outra. */
  for (const h of lista) {
    if (!h.hoste) continue;
    const par = lista.find((o) => o.id === h.parId && o.id !== h.id);
    if (!par) h.warnings.push("Hoste Amaldiçoada: escolha a outra horda do par.");
    else if (!par.hoste || par.parId !== h.id) h.warnings.push(`Hoste Amaldiçoada: ${par.nome || "a outra horda"} não aponta de volta para esta.`);
  }
  return { lista, total: lista.length, custoTotal: lista.reduce((s, h) => s + (h.custo || 0), 0) };
}

// ============================================================
// Quimeras
// ============================================================
// Uma Quimera funde de 2 a 4 Invocações da mesma ficha (Passiva de Nível 2, 3
// ou 4). A Invocação PRINCIPAL dá a base (Grau, Ações, Características), e o
// resto vem da fusão:
//   PV        = soma do PV de cada fundida - 10
//   Custo     = soma do custo de cada fundida
//   Treinos   = união de Perícia, Acerto e TR
//   Atributos = o MAIOR valor de cada atributo entre as fundidas (fixo)
//   +1 em Acerto, CD, Defesa, Nível de Dano, TRs e Perícia por fundida além da
//   primeira, e +1 Ação ou Característica por fundida além da primeira.
//
// ⚠ NÃO HÁ CÓDIGO NOVO DE FUSÃO. A Quimera é uma invocação sintética resolvida
// pelo mesmo mecanismo de fontes da Quimera das Dez Sombras (marcador com
// `fontes`, política `herdaDaFonte` e as funções `fontes()` do DSL). O
// marcador e os efeitos abaixo são NATIVOS, e só existem dentro desta função:
// nenhuma outra invocação da ficha enxerga nem paga nada disto.

export const INV_QUIMERA_NIVEIS = [2, 3, 4];
const QUIMERA_MARCADOR = "quimera_fusao";

/**
 * ⚠ DUAS REGRAS DE QUIMERA (decisão do autor DA-06, 2026-09-30):
 *   "addon"      a do addon `quimera.json` (Passiva de Nível 2 a 4), LEGACY. É a
 *                regra de toda Quimera gravada SEM o campo, e nada a converte.
 *   "mecanicas"  a do *Mecânicas para Invocações 2.5.2*, a oficial. Toda Quimera
 *                NOVA nasce com ela. Ver `resolveQuimera`.
 */
export const QUIMERA_REGRAS = [
  { value: "mecanicas", label: "Mecânicas" },
  { value: "addon", label: "Addon" },
];
export const regraDaQuimera = (q) => (q?.regra === "mecanicas" ? "mecanicas" : "addon");

export function createBlankQuimera(regra = "mecanicas") {
  /* `acoes` e `caracteristicas` são da PRÓPRIA Quimera do addon: "podem ser
     escolhidas entre quaisquer Ações/Características das invocações fundidas,
     além de criar únicas". Quimera gravada sem elas (antes de 2026-09-20) usa as
     da principal. Na do Mecânicas valem as da principal mais as `escolhas`: até
     DUAS Ações ou Características de cada componente adicional (PV-03),
     `{ [componenteId]: [{ tipo: "acao" | "caracteristica", id }] }`. */
  return {
    id: novoId("quimera"), nome: "", principalId: "", fundidasIds: [], nivel: 2,
    regra: regra === "addon" ? "addon" : "mecanicas", escolhas: {},
    acoes: [], caracteristicas: [], portraitUrl: "", portraitFocus: { x: 50, y: 50 },
  };
}

/** Quantas invocações (contando a principal) o Controlador funde pelo nível REAL
    (DA-13): "No nível 5, [...] até 2 Shikigamis. No nível 9, [...] até 3. No
    nível 13, [...] até 4". Zero abaixo do 5. */
export function limiteDeQuimeraMecanicas(nivelControladorReal = 0) {
  const n = Math.trunc(Number(nivelControladorReal) || 0);
  return n >= 13 ? 4 : n >= 9 ? 3 : n >= 5 ? 2 : 0;
}

const QUIMERA_MARCADOR_DEF = {
  id: QUIMERA_MARCADOR, label: "Quimera", limite: 1, fontes: true,
  herdaDaFonte: { pericias: "uniao", tr: "uniao", ataque: "uniao", atributos: "maiorFixo" },
};
const quimeraQtd = `fontes_qtd("${QUIMERA_MARCADOR}")`;
const quimeraExtras = `max(0, ${quimeraQtd} - 1)`;

/** O que o livro tira da soma dos PV: *"a soma do HP de cada Invocação fundido - 10"*. */
export const QUIMERA_PV_ABATE = 10;

/* ⚠ O PV NÃO É EFEITO DAQUI (2026-09-23). Era `soma - 10 - pv_max` no canal `pv`,
   e o canal soma na conta normal do PV, que ainda multiplicava por cima e ainda
   somava o que o dono dá a toda invocação. A Quimera saía com vida a mais em
   quatro jeitos: as Invocações Resistentes contadas de novo, a Característica de
   Vida da principal contada de novo, o multiplicador da Maldição multiplicando a
   soma que já vinha multiplicada, e o bônus do tipo Técnica. O número agora é FIXO
   (`pvFixo`, calculado em `resolveQuimera`) e a conta normal não roda. */
/* ⚠ O CUSTO TAMBÉM SAIU DAQUI (2026-09-30, E-11). Era um `custoReducao` de
   `custo - soma do custo das fundidas`, lido da variável `custo` crua do DSL,
   sem as reduções de cada uma. Agora é FIXO como o PV (`custoFixo`, somado do
   custo que o cartão de cada fundida mostra). */
const QUIMERA_EFEITOS = [
  { canal: "bonusTeste", expr: quimeraExtras, nome: "Quimera · Acerto, TR e Perícia" },
  { canal: "cd", expr: quimeraExtras, nome: "Quimera · CD" },
  { canal: "defesa", expr: quimeraExtras, nome: "Quimera · Defesa" },
  { canal: "danoNivel", expr: quimeraExtras, nome: "Quimera · Nível de Dano" },
  { canal: "orcamentoLivre", expr: quimeraExtras, nome: "Quimera · Ações e Características" },
].map((e) => ({ ...e, origem: "quimera" }));

/* A QUIMERA DO MECÂNICAS: "+1 em Jogadas de Ataque, CD e Perícias, mas recebendo
   -1 em Defesa, TR e RD para cada shikigami que componha a Quimera", e "para cada"
   conta TODAS as componentes (PV-03). O canal de todos os testes soma em Ataque,
   TR e Perícia, e o de TR tira o dobro, para o TR fechar em -1 por componente. */
const QUIMERA_EFEITOS_MECANICAS = [
  { canal: "bonusTeste", expr: quimeraQtd, nome: "Quimera · Ataque, TR e Perícias" },
  { canal: "bonusTR", expr: `0 - 2 * ${quimeraQtd}`, nome: "Quimera · TR" },
  { canal: "cd", expr: quimeraQtd, nome: "Quimera · CD" },
  { canal: "defesa", expr: `0 - ${quimeraQtd}`, nome: "Quimera · Defesa" },
  { canal: "rd", expr: `0 - ${quimeraQtd}`, nome: "Quimera · RD" },
].map((e) => ({ ...e, origem: "quimera" }));

/**
 * Resolve UMA Quimera a partir das fichas de invocação do dono.
 *
 * `base` é a lista das invocações do dono JÁ RESOLVIDA, do jeito que a Ficha a
 * mostra. Quem chama várias Quimeras em sequência (`resolveQuimerasList`) a
 * resolve uma vez só e a passa adiante, porque ela não depende da Quimera.
 */
export function resolveQuimera(quimera, invocacoes = [], dono = {}, base = null) {
  if (regraDaQuimera(quimera) === "mecanicas") return resolveQuimeraMecanicas(quimera, invocacoes, dono, base);
  const fichas = Array.isArray(invocacoes) ? invocacoes : [];
  const principal = fichas.find((x) => x.id === quimera?.principalId) || null;
  const nivel = INV_QUIMERA_NIVEIS.includes(Number(quimera?.nivel)) ? Number(quimera.nivel) : 2;
  const warnings = [];
  const vistos = new Set(principal ? [principal.id] : []);
  const fundidas = [];
  for (const id of Array.isArray(quimera?.fundidasIds) ? quimera.fundidasIds : []) {
    const f = fichas.find((x) => x.id === id);
    if (f && !vistos.has(f.id)) { vistos.add(f.id); fundidas.push(f); }
  }
  const out = {
    id: quimera?.id, nome: quimera?.nome || "", principalId: quimera?.principalId || "",
    fundidasIds: fundidas.map((f) => f.id), nivel, valido: false, warnings, resolvida: null,
    total: 0, limite: nivel,
  };
  if (!principal) { warnings.push("Escolha a Invocação principal da Quimera."); return out; }
  if (fundidas.length + 1 > nivel) {
    warnings.push(`Uma Passiva de Nível ${nivel} funde até ${nivel} Invocações, contando a principal.`);
  }
  const usadas = fundidas.slice(0, nivel - 1);
  out.total = usadas.length + 1;
  if (!usadas.length) { warnings.push("Escolha ao menos uma Invocação para fundir com a principal."); return out; }

  /* A VIDA MÁXIMA É A SOMA DO PV DE CADA FUNDIDA MENOS 10, e "o PV de cada
     fundida" é o que o CARTÃO dela mostra, com tudo que o dono deu a ela. Por isso
     a soma sai da lista resolvida do jeito que a Ficha a resolve, e não de uma
     conta refeita aqui: refazer a conta daria dois números para a mesma
     invocação assim que alguém mexesse numa das duas. As parcelas viajam junto,
     para o hover mostrar "Cervo Circular 76, Tigre Fúnebre 78, Quimera -10". */
  const resolvidasBase = Array.isArray(base) ? base : resolveInvocacoesList(fichas, dono).lista;
  const pvDe = (id) => resolvidasBase.find((r) => r.id === id)?.pv ?? 0;
  const partesPv = [principal, ...usadas].map((f) => ({
    label: f.nome || grauMeta(f.grau).label, valor: pvDe(f.id),
  }));
  const somaPv = partesPv.reduce((t, p) => t + p.valor, 0);
  const pvFixo = Math.max(0, somaPv - QUIMERA_PV_ABATE);
  // O custo, do mesmo jeito: o de cada cartão, somado (E-11).
  const custoDe = (id) => resolvidasBase.find((r) => r.id === id)?.custo ?? 0;
  const partesCusto = [principal, ...usadas].map((f) => ({
    label: f.nome || grauMeta(f.grau).label, valor: custoDe(f.id),
  }));
  const custoFixo = partesCusto.reduce((t, p) => t + p.valor, 0);

  const sintetica = {
    ...principal,
    id: `quimera:${quimera.id}`,
    nome: quimera.nome || principal.nome,
    acoes: Array.isArray(quimera.acoes) ? quimera.acoes : principal.acoes,
    caracteristicas: Array.isArray(quimera.caracteristicas) ? quimera.caracteristicas : principal.caracteristicas,
    portraitUrl: typeof quimera.portraitUrl === "string" ? quimera.portraitUrl : "",
    portraitFocus: quimera.portraitFocus || { x: 50, y: 50 },
    /* O tema da principal NÃO vem junto. Ele é ancorado no id dela, e a Quimera
       não tem editor de aparência: herdar pintaria a ficha da Quimera com o CSS
       de outra criatura, que o dono nunca escreveu para ela. */
    aparencia: null,
    // A Quimera nunca é o Fundamento da Técnica Inata, mesmo com a principal sendo.
    fundamento: false,
    marcadores: { ...(principal.marcadores || {}), [QUIMERA_MARCADOR]: true },
    marcadorFontes: { ...(principal.marcadorFontes || {}), [QUIMERA_MARCADOR]: [principal.id, ...usadas.map((f) => f.id)] },
    // CALCULADOS e nunca salvos: vivem só nesta cópia. Ver o `pvFixo` do resolveInvocacao.
    pvFixo,
    pvFixoPartes: [...partesPv, { label: "Quimera", valor: pvFixo - somaPv }],
    custoFixo,
    custoFixoPartes: partesCusto,
  };
  const donoQ = {
    ...dono,
    marcadores: [...(Array.isArray(dono.marcadores) ? dono.marcadores : []), QUIMERA_MARCADOR_DEF],
    efeitos: [...(Array.isArray(dono.efeitos) ? dono.efeitos : []), ...QUIMERA_EFEITOS],
  };
  const lista = resolveInvocacoesList([...fichas, sintetica], donoQ).lista;
  // As componentes viajam na resolvida: a mesa as confere na entrada e na queda.
  out.resolvida = { ...lista[lista.length - 1], componentesIds: [principal.id, ...usadas.map((f) => f.id)], regraQuimera: "addon" };
  out.regra = "addon";
  out.valido = true;
  out.fundidasIds = usadas.map((f) => f.id);
  out.principal = { id: principal.id, nome: principal.nome };
  out.fundidas = [principal, ...usadas].map((f) => ({ id: f.id, nome: f.nome || grauMeta(f.grau).label }));
  out.pv = out.resolvida.pv;
  out.custo = out.resolvida.custo;
  out.defesa = out.resolvida.defesa;
  out.deslocamento = out.resolvida.deslocamento;
  return out;
}

/**
 * A QUIMERA DO MECÂNICAS (DA-06 e PV-03, 2026-10-01, Etapa 9). Monta a mesma
 * cópia sintética da do addon, com as regras do *Mecânicas*:
 *   quantas      pelo nível REAL de Controlador (`limiteDeQuimeraMecanicas`)
 *   quem         só Shikigamis ("fusões realizadas entre Shikigamis")
 *   grau         o maior entre as componentes
 *   atributos    o maior de cada; treinos e masterizações: a união
 *   PV           "Shikigami Base + 1/3 dos PVs dos outros Shikigamis - (Grau da
 *                Invocação * Shikigamis adicionais)", com a principal como base e
 *                o grau pelo rank (PV-02). Os PVs são os dos cartões
 *   bônus        +1 Ataque, CD e Perícias, -1 Defesa, TR e RD, por componente
 *   Ações/Caract.todas as da principal e até duas de cada adicional (`escolhas`),
 *                que entram como vagas concedidas, sem custo
 *   custo        a soma dos custos BASE dos graus, e o que passar das vagas paga
 *                por cima ("Efeitos como Visionário e Autonomia são aplicados após")
 */
function resolveQuimeraMecanicas(quimera, invocacoes = [], dono = {}, base = null) {
  const fichas = Array.isArray(invocacoes) ? invocacoes : [];
  const principal = fichas.find((x) => x.id === quimera?.principalId) || null;
  const limite = limiteDeQuimeraMecanicas(dono.nivelControladorReal);
  const warnings = [];
  const vistos = new Set(principal ? [principal.id] : []);
  const fundidas = [];
  for (const id of Array.isArray(quimera?.fundidasIds) ? quimera.fundidasIds : []) {
    const f = fichas.find((x) => x.id === id);
    if (f && !vistos.has(f.id)) { vistos.add(f.id); fundidas.push(f); }
  }
  const out = {
    id: quimera?.id, nome: quimera?.nome || "", principalId: quimera?.principalId || "",
    fundidasIds: fundidas.map((f) => f.id), nivel: limite, regra: "mecanicas",
    valido: false, warnings, resolvida: null, total: 0, limite,
  };
  if (!limite) warnings.push("Quimera pede 5 níveis de Controlador.");
  if (!principal) { warnings.push("Escolha a Invocação principal da Quimera."); return out; }
  const teto = Math.max(2, limite || 4);
  if (fundidas.length + 1 > teto) warnings.push(`O Controlador funde até ${teto} Invocações, contando a principal.`);
  const usadas = fundidas.slice(0, teto - 1);
  out.total = usadas.length + 1;
  if (!usadas.length) { warnings.push("Escolha ao menos uma Invocação para fundir com a principal."); return out; }
  const componentes = [principal, ...usadas];
  for (const c of componentes) {
    if (regrasDoTipo(c).familia !== "shikigami") warnings.push(`${c.nome || "Componente"}: Quimera só funde Shikigamis.`);
  }

  const resolvidasBase = Array.isArray(base) ? base : resolveInvocacoesList(fichas, dono).lista;
  const pvDe = (id) => resolvidasBase.find((r) => r.id === id)?.pv ?? 0;
  const grauQ = componentes.reduce((m, c) => (grauMeta(c.grau).rank > grauMeta(m).rank ? c.grau : m), principal.grau);
  const rankQ = grauMeta(grauQ).rank;
  const pvBase = pvDe(principal.id);
  const somaOutros = usadas.reduce((t, f) => t + pvDe(f.id), 0);
  const terco = Math.floor(somaOutros / 3);
  const abate = rankQ * usadas.length;
  const pvFixo = Math.max(0, pvBase + terco - abate);

  /* As escolhas: até duas Ações ou Características de cada adicional. O item
     copiado ganha id próprio (`componente:item`), e quem passar de duas avisa e
     fica de fora. */
  const escolhas = (quimera?.escolhas && typeof quimera.escolhas === "object") ? quimera.escolhas : {};
  const acoesEscolhidas = [];
  const caractEscolhidas = [];
  for (const f of usadas) {
    const lista = (Array.isArray(escolhas[f.id]) ? escolhas[f.id] : []);
    if (lista.length > 2) warnings.push(`${f.nome || "Componente"}: ${lista.length} escolhas, e a Quimera recebe até duas.`);
    for (const e of lista.slice(0, 2)) {
      const campo = e?.tipo === "caracteristica" ? "caracteristicas" : "acoes";
      const item = (f[campo] ?? []).find((x) => x.id === e?.id);
      if (!item) continue;
      const copia = { ...item, id: `${f.id}:${item.id}` };
      (campo === "acoes" ? acoesEscolhidas : caractEscolhidas).push(copia);
    }
  }
  const nEscolhas = acoesEscolhidas.length + caractEscolhidas.length;
  const custoBaseFixo = componentes.reduce(
    (t, c) => t + (regrasDoTipo(c).custoBase === "grau" ? grauMeta(c.grau).custoBase : 0), 0);

  const sintetica = {
    ...principal,
    id: `quimera:${quimera.id}`,
    nome: quimera.nome || principal.nome,
    grau: grauQ,
    acoes: [...(principal.acoes ?? []), ...acoesEscolhidas],
    caracteristicas: [...(principal.caracteristicas ?? []), ...caractEscolhidas],
    portraitUrl: typeof quimera.portraitUrl === "string" ? quimera.portraitUrl : "",
    portraitFocus: quimera.portraitFocus || { x: 50, y: 50 },
    aparencia: null,
    // A Quimera nunca é o Fundamento da Técnica Inata, mesmo com a principal sendo.
    fundamento: false,
    marcadores: { ...(principal.marcadores || {}), [QUIMERA_MARCADOR]: true },
    marcadorFontes: { ...(principal.marcadorFontes || {}), [QUIMERA_MARCADOR]: componentes.map((f) => f.id) },
    // CALCULADOS e nunca salvos: vivem só nesta cópia.
    pvFixo,
    pvFixoPartes: [
      { label: `${principal.nome || "Principal"} (Base)`, valor: pvBase },
      ...(terco ? [{ label: "Um Terço dos Outros", valor: terco }] : []),
      ...(abate ? [{ label: "Grau × Adicionais", valor: -abate }] : []),
      ...(pvBase + terco - abate < 0 ? [{ label: "Piso em Zero", valor: -(pvBase + terco - abate) }] : []),
    ],
    custoBaseFixo,
  };
  const efeitosEscolhas = nEscolhas
    ? [{ canal: "orcamentoLivre", expr: String(nEscolhas), nome: "Quimera · Ações e Características dos Componentes", origem: "quimera" }]
    : [];
  const donoQ = {
    ...dono,
    marcadores: [...(Array.isArray(dono.marcadores) ? dono.marcadores : []), QUIMERA_MARCADOR_DEF],
    efeitos: [...(Array.isArray(dono.efeitos) ? dono.efeitos : []), ...QUIMERA_EFEITOS_MECANICAS, ...efeitosEscolhas],
  };
  const lista = resolveInvocacoesList([...fichas, sintetica], donoQ).lista;
  out.resolvida = { ...lista[lista.length - 1], componentesIds: componentes.map((f) => f.id), regraQuimera: "mecanicas" };
  out.valido = true;
  out.fundidasIds = usadas.map((f) => f.id);
  out.principal = { id: principal.id, nome: principal.nome };
  out.fundidas = componentes.map((f) => ({ id: f.id, nome: f.nome || grauMeta(f.grau).label }));
  out.pv = out.resolvida.pv;
  out.custo = out.resolvida.custo;
  out.defesa = out.resolvida.defesa;
  out.deslocamento = out.resolvida.deslocamento;
  return out;
}

/** Lista de Quimeras do dono, resolvida. */
export function resolveQuimerasList(quimeras, invocacoes = [], dono = {}) {
  const arr = Array.isArray(quimeras) ? quimeras : [];
  // A lista das invocações resolvida UMA vez, e não uma por Quimera: ela não
  // depende de nenhuma delas.
  const base = arr.length ? resolveInvocacoesList(Array.isArray(invocacoes) ? invocacoes : [], dono).lista : [];
  const lista = arr.map((q) => resolveQuimera(q, invocacoes, dono, base));
  return { lista, total: lista.length, custoTotal: lista.reduce((s, q) => s + (q.custo || 0), 0) };
}

// ============================================================
// Corpos de Múltiplos Núcleos (2026-10-01, Etapa 9)
// ============================================================
// "Duas fichas de invocação são criadas, ambas são consideradas como Núcleos",
// do mesmo tipo de Corpo, do mesmo grau, com o mesmo mod de CON e o mesmo PV.
// Cada núcleo é uma ficha comum de Corpo em `creature.invocacoes`, e o grupo
// mora em `creature.multiplosNucleos`. Na mesa, o grupo é UMA entidade
// (`nucleos:<id>`): conta como 1, só um núcleo está ativo, e o PV e o estado
// moram na linha do grupo, então trocar de núcleo mantém o PV atual.
//
// ⚠ A Ação "Trocar Núcleo" é parte do subtipo (PV-13): não ocupa vaga, não custa,
// e a Ficha a desenha como botão do grupo, sem a ficha precisar criá-la.

export function createBlankNucleos() {
  return { id: novoId("nucleos"), nome: "", nucleoIds: [] };
}

/** Os ids que estão em algum grupo de Múltiplos Núcleos (não compõem Horda). */
export const idsDeNucleos = (grupos) =>
  (Array.isArray(grupos) ? grupos : []).flatMap((g) => (Array.isArray(g?.nucleoIds) ? g.nucleoIds : []));

export function resolveMultiplosNucleos(grupo, invocacoes = [], dono = {}, base = null) {
  const fichas = Array.isArray(invocacoes) ? invocacoes : [];
  const resolvidas = Array.isArray(base) ? base : resolveInvocacoesList(fichas, dono).lista;
  const resDe = (id) => resolvidas.find((r) => r.id === id) ?? null;
  const mesaId = `nucleos:${grupo?.id}`;
  const nucleos = (Array.isArray(grupo?.nucleoIds) ? grupo.nucleoIds : [])
    .map((id) => fichas.find((x) => x.id === id)).filter(Boolean);
  const warnings = [];
  const out = {
    id: grupo?.id, mesaId, nome: grupo?.nome || "", nucleoIds: nucleos.map((n) => n.id),
    valido: false, warnings, resolvida: null,
  };
  if ((dono.nivelControladorReal ?? 0) < 5) warnings.push("Múltiplos Núcleos pede 5 níveis de Controlador.");
  if (nucleos.length !== 2) { warnings.push("Escolha os dois núcleos."); return out; }
  const [a, b] = nucleos;
  const [ra, rb] = [resDe(a.id), resDe(b.id)];
  if (!ra || !rb) return out;
  if (nucleos.some((n) => regrasDoTipo(n).familia !== "corpo")) warnings.push("Os dois núcleos têm de ser Corpos Amaldiçoados.");
  if (naturezaDoCorpo(a) !== naturezaDoCorpo(b)) warnings.push("Os núcleos têm de ser do mesmo tipo de Corpo (boneco ou biológico).");
  if (grauMeta(a.grau).value !== grauMeta(b.grau).value) warnings.push("Os núcleos têm de ser do mesmo grau.");
  if ((ra.atributos?.mods?.constituicao ?? 0) !== (rb.atributos?.mods?.constituicao ?? 0)) {
    warnings.push("Os núcleos têm de ter o mesmo modificador de Constituição.");
  }
  if (ra.pv !== rb.pv) warnings.push(`Os núcleos têm de ter o mesmo PV (${ra.pv} e ${rb.pv}).`);
  const sess = dono.sessaoInvocacoes?.[mesaId] ?? null;
  const ativoId = out.nucleoIds.includes(sess?.nucleoAtivo) ? sess.nucleoAtivo : a.id;
  const resAtivo = ativoId === a.id ? ra : rb;
  out.valido = true;
  out.nucleoAtivo = ativoId;
  out.resolvida = {
    ...resAtivo,
    id: mesaId,
    nome: grupo?.nome || resAtivo.nome,
    componentesIds: out.nucleoIds,
    nucleos: nucleos.map((n) => ({ id: n.id, nome: n.nome || grauMeta(n.grau).label })),
    nucleoAtivo: ativoId,
    multiplosNucleos: true,
    warnings: [...resAtivo.warnings, ...warnings],
  };
  out.pv = resAtivo.pv;
  return out;
}

/** Lista dos grupos de Múltiplos Núcleos, resolvida. Um núcleo em dois grupos avisa. */
export function resolveMultiplosNucleosList(grupos, invocacoes = [], dono = {}) {
  const arr = Array.isArray(grupos) ? grupos : [];
  const base = arr.length ? resolveInvocacoesList(Array.isArray(invocacoes) ? invocacoes : [], dono).lista : [];
  const lista = arr.map((g) => resolveMultiplosNucleos(g, invocacoes, dono, base));
  const vistos = new Map();
  for (const g of lista) {
    for (const id of g.nucleoIds) {
      if (vistos.has(id)) g.warnings.push(`Um núcleo já está em ${vistos.get(id) || "outro grupo"}.`);
      else vistos.set(id, g.nome);
    }
  }
  return { lista, total: lista.length };
}

// ============================================================
// Mecha (2026-10-01, Etapa 9)
// ============================================================
// O Mecha nasce em combate, então mora na SESSÃO, e não na ficha: a linha
// `mecha` de `sessao.invocacoes` guarda as duas Marionetes (`maiorId`,
// `menorId`), o PV do Mecha e a casca da menor (`pvTempFontes`). Ver
// `formaMecha` em ficha/ficha-sessao.js. Daqui sai só a ficha resolvida dele,
// montada das duas componentes já resolvidas.

/**
 * A ficha do Mecha, das duas Marionetes resolvidas:
 *   "O Mecha é um tamanho acima dos seus componentes"
 *   "O Mecha recebe todas as Ações e Características de seus constituintes. As
 *    Ações e Características não são modificadas para comportar o maior Grau"
 *   "O Mecha possui as maiores Defesas, TRs, Jogada de Ataque e Perícias de seus
 *    componentes e os atributos da Marionete de maior PV"
 * Com a menor quebrada (a casca acabou), as Ações e Características dela saem, e
 * os números voltam a ser os da maior.
 */
export function resolveMecha(linhaMecha, resolvidas = []) {
  if (!linhaMecha?.maiorId || !linhaMecha?.menorId) return null;
  const a = resolvidas.find((r) => r.id === linhaMecha.maiorId);
  const b = resolvidas.find((r) => r.id === linhaMecha.menorId);
  if (!a || !b) return null;
  const sem = !!linhaMecha.menorQuebrada;
  const melhor = (x, y) => (!sem && y && (y.bonus ?? 0) > (x?.bonus ?? 0) ? y : x);
  const ta = a.testes ?? {};
  const tb = b.testes ?? {};
  const pericias = [...(ta.pericias ?? [])];
  if (!sem) {
    for (const p of tb.pericias ?? []) {
      const i = pericias.findIndex((x) => x.id === p.id);
      if (i < 0) pericias.push(p);
      else pericias[i] = melhor(pericias[i], p);
    }
  }
  const defesa = sem ? a.defesa : Math.max(a.defesa, b.defesa);
  const tamanho = subirTamanho(a.tamanho, 1);
  return {
    ...a,
    id: "mecha",
    nome: `Mecha · ${a.nome || "Marionete"} e ${b.nome || "Marionete"}`,
    mecha: true,
    componentesIds: [a.id, b.id],
    maiorId: a.id,
    menorId: b.id,
    menorQuebrada: sem,
    pvTempMax: b.pv,
    // As regras de Marionete valem normalmente: sem alma.
    almaMax: 0,
    temAlma: false,
    tamanho,
    tamanhoLabel: AFTY_TAMANHOS.find((t) => t.value === tamanho)?.label ?? tamanho,
    defesa,
    acoes: sem ? a.acoes : [...(a.acoes ?? []), ...(b.acoes ?? [])],
    caracteristicas: sem ? a.caracteristicas : [...(a.caracteristicas ?? []), ...(b.caracteristicas ?? [])],
    auxilios: sem ? a.auxilios : [...(a.auxilios ?? []), ...(b.auxilios ?? [])],
    testes: {
      ...ta,
      acerto: { corpo: melhor(ta.acerto?.corpo, tb.acerto?.corpo), distancia: melhor(ta.acerto?.distancia, tb.acerto?.distancia) },
      cd: sem ? ta.cd : Math.max(ta.cd ?? 0, tb.cd ?? 0),
      cdPartes: !sem && (tb.cd ?? 0) > (ta.cd ?? 0) ? tb.cdPartes : ta.cdPartes,
      resistencias: (ta.resistencias ?? []).map((r) => melhor(r, (tb.resistencias ?? []).find((x) => x.value === r.value))),
      pericias,
    },
    fontes: {
      ...(a.fontes ?? {}),
      defesa: !sem && b.defesa > a.defesa ? (b.fontes?.defesa ?? []) : (a.fontes?.defesa ?? []),
      pv: [{ label: a.nome || "Marionete Maior", valor: a.pv }],
    },
    custo: 0,
    warnings: [],
  };
}


// ------------------------------------------------------------
// Validador de conteúdo (mesmo papel de validarCatalogoAptidoes): confere que
// as tabelas por grau estão completas e consistentes. Não há catálogo de texto
// do livro aqui, o "conteúdo" validado são as tabelas numéricas.
// ------------------------------------------------------------
export function validarCatalogoInvocacoes() {
  const erros = [];
  const graus = AFTY_INV_GRAUS.map((g) => g.value);

  // A tabela de regras por tipo: campos completos depois da herança.
  erros.push(...validarRegrasPorTipo());
  // O catálogo de Características: escala completa, e canal que existe.
  erros.push(...validarCatalogoCaracteristicasInvocacao());
  for (const c of CARACTERISTICAS_INVOCACAO) {
    if (c.canal && !EFEITO_CANAIS.includes(c.canal)) {
      erros.push(`Característica "${c.id}": canal desconhecido "${c.canal}"`);
    }
  }
  // As constantes antigas de atributo continuam batendo com a tabela.
  if (regrasDoTipoValor("shikigami").atributoBase !== INV_ATTR_BASE) erros.push("REGRAS_POR_TIPO: base de atributo do Shikigami diverge de INV_ATTR_BASE");
  if (regrasDoTipoValor("tecnica").atributoBase !== INV_ATTR_BASE_TECNICA) erros.push("REGRAS_POR_TIPO: base de atributo da Técnica diverge de INV_ATTR_BASE_TECNICA");

  // Ranks e nums únicos e cobrindo 1..5 e 0..4.
  const ranks = AFTY_INV_GRAUS.map((g) => g.rank).sort((a, b) => a - b);
  if (JSON.stringify(ranks) !== JSON.stringify([1, 2, 3, 4, 5])) erros.push("ranks de grau inconsistentes");

  // Toda tabela por grau cobre exatamente os 5 graus.
  const tabelas = {
    INV_ATRIBUTOS_POR_GRAU,
    INV_ACOES_CARACT_BASE,
    INV_PERICIAS_ADICIONAIS,
    INV_ACOES_COM_CUSTO_MAX,
  };
  for (const [nome, tab] of Object.entries(tabelas)) {
    for (const gr of graus) if (!(gr in tab)) erros.push(`${nome}: falta o grau "${gr}"`);
    for (const k of Object.keys(tab)) if (!graus.includes(k)) erros.push(`${nome}: grau extra "${k}"`);
  }

  // Atributos: pontos e max crescentes por rank.
  let prevP = -1, prevM = -1;
  for (const g of AFTY_INV_GRAUS) {
    const t = INV_ATRIBUTOS_POR_GRAU[g.value];
    if (t.pontos <= prevP) erros.push(`INV_ATRIBUTOS_POR_GRAU: pontos não crescem em "${g.value}"`);
    if (t.max < prevM) erros.push(`INV_ATRIBUTOS_POR_GRAU: max regride em "${g.value}"`);
    prevP = t.pontos; prevM = t.max;
  }

  // Tabelas da Fatia 2. Algumas COMEÇAM no Terceiro Grau (sem Quarto).
  const cobre = (nome, tab, esperado) => {
    for (const gr of esperado) if (!(gr in tab)) erros.push(`${nome}: falta o grau "${gr}"`);
    for (const k of Object.keys(tab)) if (!esperado.includes(k)) erros.push(`${nome}: grau extra "${k}"`);
  };
  const cinco = graus;                                   // todos os 5
  const semQuarto = ["terceiro", "segundo", "primeiro", "especial"]; // começa no Terceiro
  cobre("INV_DANO.jogadaUnico", INV_DANO.jogadaUnico, cinco);
  cobre("INV_DANO.trUnico", INV_DANO.trUnico, cinco);
  cobre("INV_DANO.multiplos", INV_DANO.multiplos, semQuarto);
  cobre("INV_DANO.area", INV_DANO.area, semQuarto);
  cobre("INV_CURA.unico", INV_CURA.unico, cinco);
  cobre("INV_CURA.multiplos", INV_CURA.multiplos, semQuarto);
  cobre("INV_ALCANCE", INV_ALCANCE, cinco);
  cobre("INV_AREA", INV_AREA, semQuarto);
  cobre("INV_BONUS_DEFESA", INV_BONUS_DEFESA, cinco);
  cobre("INV_BONUS_ACERTO", INV_BONUS_ACERTO, cinco);
  cobre("INV_DANO_ADICIONAL", INV_DANO_ADICIONAL, cinco);
  cobre("INV_RD_ACAO", INV_RD_ACAO, cinco);
  cobre("INV_CARACT_VIDA", INV_CARACT_VIDA, cinco);
  cobre("INV_CARACT_TESTE", INV_CARACT_TESTE, cinco);
  cobre("INV_CARACT_RD", INV_CARACT_RD, cinco);
  cobre("INV_CARACT_TAMANHO", INV_CARACT_TAMANHO, cinco);
  /* ⚠ Esta tem os cinco graus COM valor nulo nos dois de baixo, e não quatro
     chaves. O `null` é a resposta "este grau não tem a Característica", e uma
     chave ausente viraria `undefined` com o mesmo efeito por acidente: quem lê
     um grau novo saberia que ele foi esquecido. */
  cobre("INV_CARACT_TR_PROF", INV_CARACT_TR_PROF, cinco);
  for (const [g, v] of Object.entries(INV_CARACT_TR_PROF)) {
    if (v !== null && v !== "treinado" && v !== "mestre") {
      erros.push(`INV_CARACT_TR_PROF: faixa inválida "${v}" no grau "${g}"`);
    }
  }

  /* Alvos de modificador: rótulo e aplicador. Um alvo sem `aplica` entraria no
     seletor do editor e não faria nada, que é o bug que o alvo veio consertar. */
  for (const [id, a] of Object.entries(MODIFICADOR_ALVOS)) {
    if (!a.label) erros.push(`MODIFICADOR_ALVOS: "${id}" sem rótulo`);
    if (typeof a.aplica !== "function") erros.push(`MODIFICADOR_ALVOS: "${id}" sem aplicador`);
  }
  /* Todo alvo OFERECIDO tem de existir no registro. As duas listas são geradas
     por família, e uma família nova poderia oferecer um alvo que não existe. */
  const amostras = [
    { familia: "ataque", ataqueTipo: "jogada" },
    { familia: "ataque", ataqueTipo: "tr" },
    { familia: "auxilio", auxilioSub: "cura" },
    { familia: "auxilio", auxilioSub: "defesa" },
  ];
  for (const a of amostras) {
    for (const o of alvosDeModificador(a)) {
      if (!MODIFICADOR_ALVOS[o.value]) erros.push(`alvosDeModificador: alvo desconhecido "${o.value}"`);
    }
  }
  for (const sub of ["vida", "teste", "rd", "tamanho", "livre"]) {
    for (const o of alvosDeModificadorCaract({ subtipo: sub })) {
      if (!MODIFICADOR_ALVOS[o.value]) erros.push(`alvosDeModificadorCaract: alvo desconhecido "${o.value}"`);
    }
  }

  /* Efeitos de TIPO: canal existente e `quando` que o contexto realmente expõe.
     Um canal com erro de digitação só apareceria como aviso numa ficha que por
     acaso tivesse aquele tipo, e um `quando` inexistente avalia 0 e apaga o
     efeito inteiro CALADO (o mesmo buraco de `validarMarcadoresInvocacao`). */
  const ctxAmostra = buildInvocacaoDslContext(createBlankInvocacao(), {});
  for (const e of EFEITOS_DE_TIPO) {
    if (!CANAL_VALIDO.has(e.canal)) erros.push(`TECNICA_EFEITOS: canal desconhecido "${e.canal}"`);
    if (e.quando && !(e.quando in ctxAmostra)) {
      erros.push(`TECNICA_EFEITOS: "quando" usa variável inexistente "${e.quando}"`);
    }
  }

  /* O catálogo de canais (2026-09-10): rótulo e grupo em todos, alvo com
     vocabulário, e a regra da tela nos dois textos que o seletor mostra. */
  const vistosCanal = new Set();
  for (const c of INV_EFEITO_CANAIS) {
    if (vistosCanal.has(c.id)) erros.push(`INV_EFEITO_CANAIS: canal repetido "${c.id}"`);
    vistosCanal.add(c.id);
    if (!c.label) erros.push(`INV_EFEITO_CANAIS: "${c.id}" sem rótulo`);
    if (!c.grupo) erros.push(`INV_EFEITO_CANAIS: "${c.id}" sem grupo`);
    if (c.alvo && !(alvoOpcoesInvocacao(c.alvo) || []).length) {
      erros.push(`INV_EFEITO_CANAIS: "${c.id}" pede alvo "${c.alvo}" sem vocabulário`);
    }
    if (/[—;]/.test(`${c.label} ${c.nota ?? ""}`)) {
      erros.push(`INV_EFEITO_CANAIS: "${c.id}" tem travessão ou ponto-e-vírgula no texto de tela`);
    }
  }

  return erros;
}
