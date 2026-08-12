import { sessaoEmBranco, normalizaSessao } from "../ficha/ficha-sessao";

/**
 * ============================================================
 * ENCONTRO DO AFTY — o modelo puro
 * ============================================================
 * Portado da 2.5.2 (`src/fm-encounter.js`) em 2026-08-08, a pedido do autor:
 * *"copie como funciona a da 2.5.2 e deixe adaptada para o Grimório do Afty"*.
 * A máquina de estados, a ordenação por iniciativa, a auto-numeração de cópias
 * e o log são os mesmos. O que MUDOU é o que cada combatente carrega dentro.
 *
 * ⚠ A DECISÃO QUE SEGURA TUDO: o estado de combate de um combatente **é uma
 * SESSÃO do Afty** (`ficha/ficha-sessao.js`), e não o `combatState` da 2.5.2.
 *
 * Isso não é economia de código, é a única forma de os dois lugares concordarem.
 * A Ficha Final já sabe aplicar dano com PV temporário comendo primeiro, virar
 * rodada expirando buffs e condições, aparar os correntes quando a Alma muda o
 * PV máximo. Um `combatState` paralelo teria de reimplementar tudo isso e
 * divergiria no primeiro ajuste de regra — e aí a mesma criatura teria PV
 * diferente conforme a tela em que o mestre a abriu.
 *
 * O preço é que o combatente NÃO guarda stats derivados: ele guarda a ficha e a
 * sessão, e quem quiser número roda `deriveAfty`. Ver `usarEncontroAfty`.
 *
 * ⚠ Este arquivo é PURO e não importa React. `Math.random` só aparece aqui,
 * confinado ao `d20`, para o resto poder ser testado sem sorteio.
 * ============================================================
 */

/* ============================================================ */
/* MÁQUINA DE ESTADOS                                            */
/* ============================================================ */

export const ENCONTRO_STATUS = {
  PLANEJANDO: "planejando",
  ATIVO: "ativo",
  FINALIZADO: "finalizado",
};

/* Planejando → Ativo → Finalizado, e Finalizado volta para Planejando (reabrir).
   ⚠ Ativo também volta para Planejando: encerrar sem querer acontece, e a
   alternativa seria duplicar o encontro para consertar um clique. */
const TRANSICOES = {
  planejando: ["ativo"],
  ativo: ["finalizado", "planejando"],
  finalizado: ["planejando"],
};

export const podeTransicionar = (de, para) => TRANSICOES[de]?.includes(para) ?? false;

export const STATUS_ORDEM = [
  ENCONTRO_STATUS.PLANEJANDO,
  ENCONTRO_STATUS.ATIVO,
  ENCONTRO_STATUS.FINALIZADO,
];

/* ============================================================ */
/* LADOS                                                         */
/* ============================================================ */

export const LADO = { INIMIGO: "inimigo", JOGADOR: "jogador", ALIADO: "aliado" };

export const LADO_ROTULO = {
  inimigo: "Inimigo",
  jogador: "Jogador",
  aliado: "Aliado",
};

/* ============================================================ */
/* UTILIDADES                                                    */
/* ============================================================ */

const novoId = (prefixo) =>
  `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const clonar = (o) =>
  (typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

const d20 = () => Math.floor(Math.random() * 20) + 1;

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

/* ============================================================ */
/* COMBATENTES                                                   */
/* ============================================================ */

/**
 * Um combatente a partir de uma criatura do grimório.
 *
 * ⚠ A ficha entra CLONADA (`snapshot`), e é isso que faz o encontro sobreviver a
 * uma edição no criador: o mestre pode subir o ND de um inimigo amanhã sem que a
 * luta de ontem mude de número no meio. Mesma escolha da 2.5.2.
 *
 * `derived` é opcional e serve só para a sessão nascer com os recursos CHEIOS.
 * Sem ele a criatura entra com 0 de PV, que é pior que não ter defesa nenhuma.
 */
export function criarCombatente(creature, { copia = null, lado = LADO.INIMIGO, derived = null } = {}) {
  const ficha = clonar(creature);
  const base = ficha.name ?? "Combatente";
  return {
    id: novoId("cmb"),
    criaturaId: ficha.id ?? null,
    nome: copia ? `${base} #${copia}` : base,
    ficha,
    iniciativa: {
      rolagem: 0,
      mod: inteiro(derived?.iniciativa, 0),
      total: 0,
      manual: false,
    },
    sessao: sessaoEmBranco(derived),
    flags: { abatido: false, oculto: false, lado },
  };
}

/**
 * Um combatente JOGADOR: só nome e iniciativa.
 *
 * ⚠ `ficha: null` é o sinal de "não tem ficha aqui", e o painel de combate
 * respeita isso. O personagem do jogador mora na ficha DELE, e inventar um PV
 * para ele no encontro do mestre seria um segundo número para manter sincronizado
 * com o que o jogador tem na mão.
 */
export function criarJogador({ nome, mod = 0 } = {}) {
  return {
    id: novoId("cmb"),
    criaturaId: null,
    nome: nome || "Jogador",
    ficha: null,
    iniciativa: { rolagem: 0, mod: inteiro(mod, 0), total: 0, manual: false },
    sessao: null,
    flags: { abatido: false, oculto: false, lado: LADO.JOGADOR },
  };
}

/* ============================================================ */
/* INICIATIVA                                                    */
/* ============================================================ */

export const rolarIniciativa = (mod = 0) => {
  const rolagem = d20();
  return { rolagem, total: rolagem + inteiro(mod, 0) };
};

export const rolarTodasIniciativas = (combatentes, { soVazias = false } = {}) =>
  combatentes.map((c) => {
    // Quem digitou a iniciativa à mão não é sorteado de novo: o número dele veio
    // do jogador na mesa, e um "Rolar Tudo" não pode apagá-lo.
    if (c.iniciativa.manual) return c;
    if (soVazias && c.iniciativa.rolagem > 0) return c;
    const { rolagem, total } = rolarIniciativa(c.iniciativa.mod);
    return { ...c, iniciativa: { ...c.iniciativa, rolagem, total, manual: false } };
  });

export const definirIniciativa = (combatente, total) => ({
  ...combatente,
  iniciativa: {
    ...combatente.iniciativa,
    total: inteiro(total, 0),
    rolagem: inteiro(total, 0) - combatente.iniciativa.mod,
    manual: true,
  },
});

/** Desempate: total, depois modificador, depois id. O id no fim torna a ordem
    ESTÁVEL, e sem isso dois empates trocariam de lugar a cada renderização. */
export const ordenarPorIniciativa = (combatentes) =>
  [...combatentes].sort((a, b) => {
    if (b.iniciativa.total !== a.iniciativa.total) return b.iniciativa.total - a.iniciativa.total;
    if (b.iniciativa.mod !== a.iniciativa.mod) return b.iniciativa.mod - a.iniciativa.mod;
    return a.id.localeCompare(b.id);
  });

/* ============================================================ */
/* TURNOS                                                        */
/* ============================================================ */

const jogaTurno = (c) => !c.flags.abatido && !c.flags.oculto;

/**
 * Quem joga agora. Devolve `{ proximoId, rodada, novaRodada }`.
 *
 * ⚠ A posição atual é procurada na ordem COMPLETA, e não entre os elegíveis.
 * Quando o combatente da vez cai, ele sai dos elegíveis mas continua na ordem: é
 * essa busca que impede o turno de "perder o lugar" e voltar para o começo.
 */
export function proximoTurno(encontro) {
  const ordem = ordenarPorIniciativa(encontro.combatentes);
  const elegiveis = ordem.filter(jogaTurno);
  if (elegiveis.length === 0) {
    return { proximoId: null, rodada: encontro.rodada, novaRodada: false };
  }

  const atual = ordem.findIndex((c) => c.id === encontro.ativoId);
  if (atual === -1) {
    return { proximoId: elegiveis[0].id, rodada: encontro.rodada, novaRodada: false };
  }

  for (let i = atual + 1; i < ordem.length; i += 1) {
    if (jogaTurno(ordem[i])) {
      return { proximoId: ordem[i].id, rodada: encontro.rodada, novaRodada: false };
    }
  }
  return { proximoId: elegiveis[0].id, rodada: encontro.rodada + 1, novaRodada: true };
}

/* ============================================================ */
/* CÓPIAS                                                        */
/* ============================================================ */

/**
 * Renomeia as cópias da mesma criatura para "Nome #1", "Nome #2".
 *
 * ⚠ Roda na ADIÇÃO e na REMOÇÃO. Tirar o #2 de três precisa renumerar os que
 * ficaram, senão a mesa fica com "#1" e "#3" e ninguém sabe se o #2 fugiu.
 */
export function renumerarCopias(combatentes) {
  const grupos = new Map();
  for (const c of combatentes) {
    if (!c.criaturaId) continue;                 // jogadores ficam de fora
    if (!grupos.has(c.criaturaId)) grupos.set(c.criaturaId, []);
    grupos.get(c.criaturaId).push(c);
  }
  const nomes = {};
  for (const grupo of grupos.values()) {
    const base = grupo[0].ficha?.name ?? "Combatente";
    if (grupo.length <= 1) { nomes[grupo[0].id] = base; continue; }
    grupo.forEach((c, i) => { nomes[c.id] = `${base} #${i + 1}`; });
  }
  return combatentes.map((c) => (nomes[c.id] != null ? { ...c, nome: nomes[c.id] } : c));
}

/* ============================================================ */
/* ENCONTRO                                                      */
/* ============================================================ */

export function criarEncontro({ nome = "Novo Encontro", pastaId = null } = {}) {
  return {
    id: novoId("enc"),
    nome,
    pastaId,
    criadoEm: Date.now(),
    atualizadoEm: Date.now(),
    status: ENCONTRO_STATUS.PLANEJANDO,
    rodada: 1,
    ativoId: null,
    combatentes: [],
    log: [],
  };
}

/**
 * Duplica para uma sessão nova: mesma escalação, tudo zerado.
 *
 * ⚠ A SESSÃO NÃO VEM JUNTO, e é esse o ponto do botão. Duplicar existe para
 * rodar o mesmo encontro de novo, e um inimigo que chegasse com 3 de PV da luta
 * passada obrigaria o mestre a curar todo mundo à mão.
 */
export function duplicarEncontro(encontro) {
  const clone = clonar(encontro);
  return {
    ...clone,
    id: novoId("enc"),
    nome: `${clone.nome} (cópia)`,
    criadoEm: Date.now(),
    atualizadoEm: Date.now(),
    status: ENCONTRO_STATUS.PLANEJANDO,
    rodada: 1,
    ativoId: null,
    log: [],
    combatentes: clone.combatentes.map((c) => ({
      ...c,
      id: novoId("cmb"),
      // ⚠ A sessão vem INTEIRA do original (autor, 2026-08-09): PV, PE, buffs e
      // condições, inclusive o dano já tomado. Duplicar serve para ramificar uma
      // luta em andamento e testar dois desfechos.
      //
      // Era `sessaoEmBranco(null)`, e `sessaoEmBranco` sem `derived` não tem de
      // onde tirar o máximo: todo combatente da cópia nascia com 0 de PV e 0 de
      // PE. E a cópia abre em Planejando, onde não existe o botão que reenche
      // recursos, então o mestre tinha que digitar o PV de cada inimigo à mão.
      sessao: c.sessao ? clonar(c.sessao) : null,
      iniciativa: { rolagem: 0, mod: c.iniciativa.mod, total: 0, manual: false },
      // `abatido` acompanha a sessão: manter o PV em 0 e desmarcar o abatido
      // deixaria a cópia se contradizendo na primeira olhada.
      flags: { ...c.flags },
    })),
  };
}

/** O que falta para começar. Vira o `title` do botão, e não um alerta. */
export function validarInicio(encontro) {
  const erros = [];
  if (encontro.combatentes.length === 0) erros.push("Adicione pelo menos um combatente.");
  const semIniciativa = encontro.combatentes.filter(
    (c) => c.iniciativa.rolagem === 0 && !c.iniciativa.manual,
  );
  if (semIniciativa.length > 0) {
    erros.push(`${semIniciativa.length} combatente(s) sem iniciativa.`);
  }
  return { valido: erros.length === 0, erros };
}

/* ============================================================ */
/* LOG                                                           */
/* ============================================================ */

export const LOG_TIPOS = {
  RODADA: "rodada",
  TURNO: "turno",
  CONDICAO: "condicao",
  DANO: "dano",
  CURA: "cura",
  LIVRE: "livre",
};

export const LOG_MAX = 200;

export const entradaDeLog = ({ rodada, tipo, mensagem, combatenteId = null }) => ({
  id: novoId("log"),
  rodada,
  em: Date.now(),
  tipo,
  mensagem,
  combatenteId,
});

/* ============================================================ */
/* SANEAMENTO NA LEITURA                                         */
/* ============================================================ */

/**
 * Um encontro vindo do armazenamento pode ter sido gravado por uma versão
 * anterior, editado à mão ou salvo pela metade. Tudo passa por aqui.
 *
 * ⚠ Saneia na LEITURA, e não na escrita, pela mesma razão das armas criadas pelo
 * jogador (ver `afty-equipamentos.js`): a escrita tem um caminho, a leitura tem
 * todos.
 */
export function normalizarEncontro(bruto) {
  if (!bruto || typeof bruto !== "object") return null;
  const status = STATUS_ORDEM.includes(bruto.status) ? bruto.status : ENCONTRO_STATUS.PLANEJANDO;
  const combatentes = (Array.isArray(bruto.combatentes) ? bruto.combatentes : [])
    .filter((c) => c && typeof c === "object" && c.id)
    .map((c) => ({
      ...c,
      nome: c.nome || "Combatente",
      ficha: c.ficha ?? null,
      iniciativa: {
        rolagem: inteiro(c.iniciativa?.rolagem, 0),
        mod: inteiro(c.iniciativa?.mod, 0),
        total: inteiro(c.iniciativa?.total, 0),
        manual: !!c.iniciativa?.manual,
      },
      // Combatente COM ficha sempre tem sessão, e sem ficha nunca tem: é o que
      // decide se o painel de combate aparece para ele.
      sessao: c.ficha ? normalizaSessao(c.sessao) : null,
      flags: {
        abatido: !!c.flags?.abatido,
        oculto: !!c.flags?.oculto,
        lado: Object.values(LADO).includes(c.flags?.lado) ? c.flags.lado : LADO.INIMIGO,
      },
    }));
  return {
    ...bruto,
    nome: bruto.nome || "Encontro",
    pastaId: bruto.pastaId ?? null,
    status,
    rodada: Math.max(1, inteiro(bruto.rodada, 1)),
    // Um `ativoId` apontando para alguém que já saiu deixaria o turno preso.
    ativoId: combatentes.some((c) => c.id === bruto.ativoId) ? bruto.ativoId : null,
    combatentes,
    log: (Array.isArray(bruto.log) ? bruto.log : []).slice(0, LOG_MAX),
  };
}

/* ============================================================ */
/* VALIDADOR DE MESA                                             */
/* ============================================================ */

/** Confere o que o próprio arquivo promete. Roda nos testes de fumaça. */
export function validarEncontroModelo() {
  const erros = [];
  for (const s of STATUS_ORDEM) {
    if (!TRANSICOES[s]) erros.push(`Status "${s}" sem transições declaradas.`);
  }
  for (const [de, paras] of Object.entries(TRANSICOES)) {
    if (!STATUS_ORDEM.includes(de)) erros.push(`Transição a partir de status desconhecido "${de}".`);
    for (const p of paras) {
      if (!STATUS_ORDEM.includes(p)) erros.push(`Transição "${de}" → status desconhecido "${p}".`);
    }
  }
  for (const [k, v] of Object.entries(LADO)) {
    if (!LADO_ROTULO[v]) erros.push(`Lado ${k} ("${v}") sem rótulo.`);
  }
  return erros;
}
