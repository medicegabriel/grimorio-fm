/**
 * ============================================================
 * REGRAS POR TIPO DE INVOCAÇÃO (FOLHA: zero imports)
 * ============================================================
 * Decisão do autor, 2026-09-30 (ver o topo de docs/afty-invocacoes.md): os tipos
 * separados do *Mecânicas para Invocações 2.5.2* passam a existir mecanicamente.
 * Marionete, Corpo Amaldiçoado, Maldição Domada e Shikigami, com o Shikigami de
 * Técnica como subtipo do Shikigami. Eles diferem de verdade em cura, alma,
 * custo, ativação, dissipação, destruição, exorcismo, evolução e reparo.
 *
 * ⚠ TIPO É DADO, e não `if` solto. Toda regra que muda por tipo mora numa linha
 * desta tabela, e quem a lê passa por `regrasDoTipo` (afty-invocacoes.js). Uma
 * regra genérica que um dia precisar distinguir tipo ganha um campo aqui, e o
 * campo novo vale para os cinco de uma vez, com o padrão escrito no `shikigami`.
 *
 * ⚠ FOLHA. O `afty-invocacoes.js` importa este arquivo, e o criador importa o
 * `afty-invocacoes.js` no topo: um import aqui dentro poderia fechar o ciclo que
 * derrubou o app em 2026-09-02. A lista de folhas está em asserts/t-ordem-modulos.mjs.
 *
 * ⚠ OS `value` NÃO MUDAM. `shikigami`, `tecnica` e `maldicao` estão gravados em
 * toda ficha salva e viram variável de DSL. Os rótulos voltam a "Shikigami" e
 * "Shikigami de Técnica", com curto "Técnica" (autor, 2026-10-03).
 *
 * Campos (o Shikigami escreve o padrão de cada um):
 *   label, curto        rótulo do chip e rótulo curto do filtro da lista
 *   herda               subtipo: os campos ausentes vêm do tipo citado
 *   familia             o tipo-raiz (a Técnica é da família do Shikigami)
 *   verbo               "invocar" | "ativar". Ativar conta como Invocar (Mecânicas)
 *   intermediario       rótulo do Intermediário, ou null quando não há
 *   retirada            texto curto de como ela sai de campo
 *   dissipavel          pode ser dissipada
 *   talisma             pode ser guardada num Talismã
 *   cura                { comum, er }: recebe cura comum, recebe Energia Reversa
 *   alma                "pv" (Integridade = PV) | "nenhuma" | "nucleo"
 *   custoBase           "grau" (tabela do grau) | 0
 *   grauFixo            o grau não muda depois de criada
 *   visionario          Visionário e efeitos parecidos se aplicam
 *   horda               pode compor uma Horda
 *   autonomia           "entrada" | "inicioCombate" | false
 *   aZero               estado ao chegar a 0 PV
 *   terminal            estado da morte permanente
 *   aptidoes            pode ter Aptidão como Característica
 *   imunidade           "nenhuma" | "passivaDeTecnica" | "propria"
 *   excedenteForaDeCombate  o que passar do limite em campo fica fora de combate
 *   turnoProprio        tem turno próprio na Iniciativa
 *   atributoBase, atributoMin  base e piso do point-buy
 *   especialNivelReal   nível REAL de Controlador para criar no Grau Especial
 *   imunidadesNaturais  rótulos das imunidades que o tipo já traz
 *   trsDoInvocador      TRs cujos efeitos vão direto ao invocador
 *   psiquicoNoInvocador o Dano Psíquico vai direto ao invocador
 *   fichaAdaptada       a ficha vem de outra criatura (Maldição): atributos,
 *                       perícias e treinos são os dela, fora do point-buy e da cota
 *   duracaoPorCL        dura CL rodadas em combate, e depois pede manutenção (Corpo)
 *   reparo              de onde sai o reparo do Desmembramento: "canalizador",
 *                       "material" (o Ofício da Marionete), "natureza" (o do
 *                       Corpo) ou null (não se repara)
 */
export const REGRAS_POR_TIPO = {
  shikigami: {
    label: "Shikigami", curto: "Shikigami", familia: "shikigami",
    verbo: "invocar", intermediario: "Talismã", retirada: "dissipar / exorcizar",
    dissipavel: true, talisma: true, cura: { comum: true, er: true }, alma: "pv",
    custoBase: "grau", grauFixo: false, visionario: true, horda: true,
    autonomia: "entrada", aZero: "dissipada", terminal: "exorcizada",
    aptidoes: false, imunidade: "nenhuma", excedenteForaDeCombate: false,
    turnoProprio: false, atributoBase: 8, atributoMin: 6, especialNivelReal: null,
    imunidadesNaturais: [], trsDoInvocador: [], psiquicoNoInvocador: false,
    fichaAdaptada: false, duracaoPorCL: false, reparo: "canalizador",
  },
  /* Subtipo do Shikigami. A técnica inata dispensa o Talismã ("substituindo-a
     apenas por movimentos ou sinais de mão, como é o caso da Dez Sombras"), e o
     Mecânicas dá a ele turno próprio, sem Autonomia, e a morte no 2º exorcismo. */
  tecnica: {
    herda: "shikigami",
    label: "Shikigami de Técnica", curto: "Técnica",
    intermediario: null, talisma: false,
    autonomia: false, terminal: "morta",
    imunidade: "passivaDeTecnica", turnoProprio: true,
    atributoBase: 10, atributoMin: 8,
  },
  /* Mecânicas: não dissipa, sem talismã, grau fixo, sem cura por ER, exorcizada a
     0 PV, sem custo base, Autonomia paga no início do combate, sem Visionário,
     Aptidão vira Característica, imunidades mantidas. A ficha é ADAPTADA da
     maldição subjugada: "Seus atributos Base são mantidos", "Seus Treinamentos e
     Masterizações são mantidos", então o point-buy e a cota de perícias do guia
     de criação não se aplicam. */
  maldicao: {
    label: "Maldição", curto: "Maldição", familia: "maldicao",
    verbo: "ativar", intermediario: null, retirada: "exorcizar",
    dissipavel: false, talisma: false, cura: { comum: true, er: false }, alma: "pv",
    custoBase: 0, grauFixo: true, visionario: false, horda: true,
    autonomia: "inicioCombate", aZero: "exorcizada", terminal: "exorcizada",
    aptidoes: true, imunidade: "propria", excedenteForaDeCombate: true,
    turnoProprio: false, atributoBase: 8, atributoMin: 6, especialNivelReal: null,
    imunidadesNaturais: [], trsDoInvocador: [], psiquicoNoInvocador: false,
    fichaAdaptada: true, duracaoPorCL: false, reparo: null,
  },
  /* Mecânicas: não cura de forma nenhuma (só reparo), imune a dano na alma, não
     dissipa, sem talismã, quebrada a 0 PV e destruída na 3ª queda, sem custo base.
     O Intermediário é ela mesma (Livro: o dispositivo é o próprio Intermediário).
     "Marionetes são imunes a dano na alma, condição Envenenado e a venenos não
     amaldiçoados", e "Caso ela receba Dano Psíquico ou TRs de Vontade ou Astúcia,
     os efeitos e danos são aplicados diretamente ao Invocador". */
  marionete: {
    label: "Marionete", curto: "Marionete", familia: "marionete",
    verbo: "ativar", intermediario: "Ela Mesma", retirada: "quebrar / destruir",
    dissipavel: false, talisma: false, cura: { comum: false, er: false }, alma: "nenhuma",
    custoBase: 0, grauFixo: false, visionario: true, horda: true,
    autonomia: "entrada", aZero: "quebrada", terminal: "destruida",
    aptidoes: false, imunidade: "nenhuma", excedenteForaDeCombate: true,
    turnoProprio: false, atributoBase: 8, atributoMin: 6, especialNivelReal: 17,
    imunidadesNaturais: ["Dano na Alma", "Envenenado", "Venenos Não Amaldiçoados"],
    trsDoInvocador: ["vontade", "astucia"], psiquicoNoInvocador: true,
    fichaAdaptada: false, duracaoPorCL: false, reparo: "material",
  },
  /* Mecânicas: cura com ER, alma no núcleo, não dissipa, "ele próprio já funciona
     como um talismã", núcleo desativado a 0 PV e quebrado a −PV máximo, sem custo
     de ativação (mas dura CL rodadas). A imunidade do boneco e a refeição do
     biológico dependem da NATUREZA da ficha, e quem as lê é o resolvedor. */
  corpo: {
    label: "Corpo Amaldiçoado", curto: "Corpo", familia: "corpo",
    verbo: "ativar", intermediario: "Ele Mesmo", retirada: "desativar / destruir",
    dissipavel: false, talisma: false, cura: { comum: true, er: true }, alma: "nucleo",
    custoBase: 0, grauFixo: false, visionario: true, horda: true,
    autonomia: "entrada", aZero: "desativada", terminal: "destruida",
    aptidoes: false, imunidade: "nenhuma", excedenteForaDeCombate: true,
    turnoProprio: false, atributoBase: 8, atributoMin: 6, especialNivelReal: 17,
    imunidadesNaturais: [], trsDoInvocador: [], psiquicoNoInvocador: false,
    fichaAdaptada: false, duracaoPorCL: true, reparo: "natureza",
  },
};

/* ============================================================
   OS ESTADOS DE MESA (2026-09-30, Etapa 3; movidos para cá na Etapa 7)
   ============================================================
   Moram nesta folha porque a sessão (ficha/ficha-sessao.js) E o derive precisam
   deles: o derive conta quem está em campo para o Concentrar Poder e o Controle
   Sintonizado, e não pode importar a sessão. */
export const ESTADOS_INVOCACAO = [
  "fora", "guardada", "ativa", "dissipada", "desativada", "quebrada", "recolhida",
  "exorcizada", "destruida", "morta",
];

/** Morte permanente: a ficha fica, e a invocação não volta mais. */
export const ESTADOS_TERMINAIS = new Set(["exorcizada", "destruida", "morta"]);

/** Os estados que ocupam vaga no limite em campo. A Marionete quebrada conta
    até ser recolhida (Mecânicas: "ela ainda conta como uma Invocação em campo
    até ser recolhida"). O Corpo desativado não conta. */
export const ESTADOS_EM_CAMPO = new Set(["ativa", "quebrada"]);

/** O estado de uma linha gravada, lendo também o formato antigo (três booleanos). */
export function estadoDaLinha(e) {
  if (ESTADOS_INVOCACAO.includes(e?.estado)) return e.estado;
  if (e?.exorcizada) return "exorcizada";
  if (e?.emCampo) return "ativa";
  if (e?.abatida) return "dissipada";
  return "fora";
}

/**
 * Quantas invocações ocupam vaga em campo agora, pelo mapa da sessão
 * (`sessao.invocacoes`). `ids` limita a conta a quem existe na ficha (a sessão
 * guarda linha órfã de propósito). A Quimera entra pelo id `quimera:<id>` e
 * conta 1 (decisão do autor). A Bem Treinada em tarefa não conta.
 */
export function contaInvocacoesEmCampo(mapa, ids = null) {
  if (!mapa || typeof mapa !== "object") return 0;
  const validos = ids ? new Set(ids) : null;
  let n = 0;
  for (const [id, e] of Object.entries(mapa)) {
    if (validos && !validos.has(id)) continue;
    if (ESTADOS_EM_CAMPO.has(estadoDaLinha(e)) && !e?.emTarefa) n += 1;
  }
  return n;
}

/* ============================================================
   OS COMPOSTOS NA MESA (2026-10-01, Etapa 9)
   ============================================================
   Moram nesta folha pela mesma razão dos estados: a sessão (ficha/ficha-sessao.js)
   e o resolvedor (afty-invocacoes.js) os leem, e a sessão não pode importar o
   resolvedor sem fechar o ciclo de módulos. */

/** A fonte da casca do Mecha: o PV da Marionete menor ("com o menor PV sendo
    utilizada como PV Temporário, a qual quebra o limite e não é cumulativo"). */
export const FONTE_PV_MECHA = "Mecha · Marionete Menor";

/**
 * A ENTRADA DE MESA de uma Horda resolvida: o formato que a sessão usa para
 * entrar em campo, cair e aparar (`invocacoesDaMesa`). A Horda tem tela própria
 * na Ficha, então a entrada carrega só o que a mesa lê: o PV e o custo da horda,
 * as regras do líder, quem está dentro e os membros com o PV e o tipo de cada um.
 */
export function entradaDeMesaDaHorda(h) {
  if (!h?.valido) return null;
  return {
    id: h.mesaId, nome: h.nome || h.lider?.nome || "Horda", horda: true,
    pv: h.pv, almaMax: 0, temAlma: false, custo: h.custo, regras: h.regras,
    componentesIds: h.componentesIds, membrosDetalhe: h.membrosDetalhe,
    liderId: h.liderId, liderPv: h.liderPv, hoste: h.hoste, parId: h.parId,
    fontes: { custo: [{ label: h.nome || "Horda", valor: h.custo }], pv: h.fontesPv },
    opcoesDeUso: [], marcadores: [],
  };
}

/** A ordem em que os tipos aparecem na tela. */
export const TIPOS_INVOCACAO_ORDEM = ["shikigami", "tecnica", "maldicao", "marionete", "corpo"];

/** O tipo usado quando a ficha traz um valor que não existe (ou nenhum). */
export const TIPO_INVOCACAO_PADRAO = "shikigami";

/**
 * As regras de um tipo, já com a herança do subtipo resolvida. Valor que não
 * existe cai no padrão, e é por isso que esta função nunca devolve vazio.
 */
export function regrasDoTipoValor(tipo) {
  const valor = REGRAS_POR_TIPO[tipo] ? tipo : TIPO_INVOCACAO_PADRAO;
  const linha = REGRAS_POR_TIPO[valor];
  const base = linha.herda ? regrasDoTipoValor(linha.herda) : {};
  const { herda, ...proprio } = linha;
  return { ...base, ...proprio, value: valor, ...(herda ? { herda } : {}) };
}

/**
 * Confere a tabela: todo tipo, depois de herdar, tem todos os campos do
 * padrão, e todo `herda` aponta para um tipo que existe. Campo novo esquecido
 * num tipo viraria `undefined` lido como "não", calado.
 */
export function validarRegrasPorTipo() {
  const erros = [];
  const campos = Object.keys(REGRAS_POR_TIPO[TIPO_INVOCACAO_PADRAO]);
  for (const [valor, linha] of Object.entries(REGRAS_POR_TIPO)) {
    if (linha.herda && !REGRAS_POR_TIPO[linha.herda]) erros.push(`${valor}: herda de "${linha.herda}", que não existe`);
    const r = regrasDoTipoValor(valor);
    for (const c of campos) if (!(c in r)) erros.push(`${valor}: falta o campo "${c}"`);
    if (!TIPOS_INVOCACAO_ORDEM.includes(valor)) erros.push(`${valor}: fora de TIPOS_INVOCACAO_ORDEM`);
  }
  for (const v of TIPOS_INVOCACAO_ORDEM) if (!REGRAS_POR_TIPO[v]) erros.push(`TIPOS_INVOCACAO_ORDEM cita "${v}", que não existe`);
  return erros;
}
