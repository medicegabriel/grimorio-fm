/**
 * ============================================================
 * AS CARGAS E OS ENCANTAMENTOS ATIVOS DE UNIFORME E ESCUDO (CX5, 2026-11-06)
 * ============================================================
 * Livro p.154 (Cargas de Encantamento), p.158 a 160. A tabela do que cada um dos 16 FAZ está em
 * `afty-encantamentos-ativos.js`. Aqui mora a operação: conferir o acesso, gastar a carga e a reação
 * UMA vez, registrar o que ficou ligado e devolver os números. Nada é escrito na ficha.
 *
 * ------------------------------------------------------------
 * CARGAS (p.154)
 * ------------------------------------------------------------
 * *"Todo item que possua cargas possui um número de cargas igual ao seu bônus de Treinamento. Um mesmo
 * número de cargas é compartilhado por todos os Encantamentos que utilizem cargas em uma mesma
 * ferramenta. Depois de gasta, uma carga não pode ser recuperada até que o portador e o item tenham um
 * descanso longo."* O pool é UM por ferramenta (chave `cargas:<uid>` em `sessao.usos`, o contador que o
 * motor já tem) e o descanso o zera como zera todo contador. O descanso é um só (decisão do autor), então
 * o "descanso longo" do livro é o botão Descansar.
 *
 * O máximo vem de `derived.equip.entradas[i].fa.cargas`, que já é o BT. A ferramenta precisa estar
 * EQUIPADA (o encantamento só vale no portador) e o encantamento precisa atender ao pré-requisito.
 *
 * ------------------------------------------------------------
 * O QUE ESTE MÓDULO NÃO FAZ
 * ------------------------------------------------------------
 * O efeito em OUTRA criatura (o TR de quem foi empurrado pelo Repulsor, o dano em quem agarra o portador
 * do Escaldante) é da mesa: a ficha devolve a CD e os dados, e não decide por quem não está nela. O ataque
 * do escudo vira linha de Ações no derive (reservado por outro lote) e fica como ponto de integração.
 * ============================================================
 */
import { aparaSessao } from "./ficha-sessao";
import { usa, avaliaUso } from "./ficha-uso";
import { usoDe, jaAplicada } from "./ficha-uso-estado";
import { ENCANTAMENTOS_ATIVOS, encantamentoAtivo, IDS_ATIVOS } from "../afty-encantamentos-ativos";
import { moverNivel } from "../afty-niveis-dano";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const lista = (v) => (Array.isArray(v) ? v : []);
const recusa = (sessao, erro, codigo, extra = {}) => ({ sessao, aplicado: false, erro, codigo, ...extra });

/** O grau REAL de uma ferramenta em número: quarto 1 até especial 5. */
const RANK = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };

export const chaveDasCargas = (uid) => `cargas:${uid}`;

/* ============================================================ */
/* LEITURA                                                       */
/* ============================================================ */
const entradaDeDerived = (derived, uid) => lista(derived?.equip?.entradas).find((e) => e?.uid === uid) ?? null;

/** As cargas de cada ferramenta com encantamento de cargas: `[{ uid, nome, max, gastas, restantes, encantamentos }]`. */
export function resumoDeCargas(derived, sessao) {
  const usos = sessao?.usos ?? {};
  return lista(derived?.equip?.entradas)
    .filter((e) => e?.fa?.usaCargas)
    .map((e) => {
      const max = Math.max(0, inteiro(e.fa.cargas));
      const gastas = Math.min(max, Math.max(0, inteiro(usos[chaveDasCargas(e.uid)])));
      return {
        uid: e.uid, nome: e.def?.nome ?? e.refId, equipado: !!e.equipado, max, gastas, restantes: max - gastas,
        encantamentos: lista(e.fa.encantamentos).filter((x) => x.enc?.usaCargas).map((x) => x.id),
      };
    });
}

const contextoDe = (derived, entrada) => {
  const fa = entrada?.fa ?? {};
  return {
    bt: Math.max(0, inteiro(derived?.contextoDsl?.bt ?? fa.cargas)),
    cd: inteiro(derived?.cd),
    modCon: inteiro(derived?.mods?.constituicao),
    movimento: Number(derived?.movimento) || 0,
    grau: RANK[fa.grau] ?? 0,
    dadoDoEscudo: entrada?.def?.dano?.dado ?? null,
  };
};

/** Os números de um encantamento ativo ou gatilho passivo, com a CD e os dados já feitos. `null` se o id não é um dos 16. */
export function numerosDoEncantamento(derived, uid, encId, valores = {}) {
  const base = encantamentoAtivo(encId);
  const entrada = entradaDeDerived(derived, uid);
  if (!base || !entrada) return null;
  return base.numeros(contextoDe(derived, entrada), valores);
}

/** Os encantamentos ativos e passivos que a ferramenta TEM e atende, para a tela listar. */
export function encantamentosAtivosDaEntrada(derived, uid) {
  const entrada = entradaDeDerived(derived, uid);
  if (!entrada?.fa) return [];
  return lista(entrada.fa.encantamentos)
    .filter((x) => IDS_ATIVOS.includes(x.id))
    .map((x) => ({ id: x.id, nome: x.enc?.nome ?? x.id, atende: !!x.atende, ...encantamentoAtivo(x.id), ativaNaMesa: encantamentoAtivo(x.id)?.ativa !== false && !encantamentoAtivo(x.id)?.ataque }));
}

/* ============================================================ */
/* USAR O ENCANTAMENTO                                           */
/* ============================================================ */
const descritorDoEncantamento = (entrada, encId, base) => ({
  id: `enc:${encId}:${entrada.uid}`,
  nome: lista(entrada.fa?.encantamentos).find((x) => x.id === encId)?.enc?.nome ?? encId,
  origem: `item:${entrada.uid}`,
  ...(base.acao ? { acao: base.acao } : {}),
  ...(base.limite ? { limite: base.limite } : {}),
  ...(base.parametros ? { parametros: base.parametros } : {}),
  ...(base.cargas ? { usos: { chave: chaveDasCargas(entrada.uid), max: Math.max(0, inteiro(entrada.fa?.cargas)) } } : {}),
  ...(base.duracao ? { duracao: base.duracao } : {}),
  cobranca: "manual",
  efeitos: [],
});

function checagens(derived, sessao, uid, encId) {
  const base = encantamentoAtivo(encId);
  if (!base) return { erro: "Encantamento Sem Ação", codigo: "sem-acao" };
  if (base.ativa === false) return { erro: "Gatilho Passivo", codigo: "passivo" };
  if (base.ataque) return { erro: "Ataque do Escudo", codigo: "ataque-do-escudo" };
  const entrada = entradaDeDerived(derived, uid);
  if (!entrada?.fa) return { erro: "Ferramenta Não Encontrada", codigo: "ferramenta-ausente" };
  if (!entrada.equipado) return { erro: "Equipamento Guardado", codigo: "guardado" };
  const enc = lista(entrada.fa.encantamentos).find((x) => x.id === encId);
  if (!enc) return { erro: "Ferramenta Sem o Encantamento", codigo: "sem-encantamento" };
  if (!enc.atende) return { erro: "Pré-Requisito Não Atendido", codigo: "requisito" };
  return { base, entrada };
}

/** Por que o encantamento não pode ser usado AGORA, ou `null`. Puro, para desabilitar o botão. */
export function bloqueioDeEncantamento(sessao, derived, { uid, encId, parametros } = {}) {
  const c = checagens(derived, sessao, uid, encId);
  if (c.erro) return c.erro;
  const pedido = { opId: "bloqueio", registraAcao: true, parametros: parametros ?? {} };
  return avaliaUso(sessao, derived, descritorDoEncantamento(c.entrada, encId, c.base), pedido).motivo;
}

/**
 * Usa um encantamento ativo: gasta a carga (quando o texto pede), a reação ou a ação, respeita o "uma vez por turno" e deixa
 * ligado o que durar (Ricochete a 50% até o próximo turno, Aeronauta planando, Expansão de Escudo na cena).
 *
 *   pedido { uid, encId, opId, registraAcao?, parametros? }   parametros: Estimulante `{ tr }`, Esponja `{ queda: true }`
 *
 * Retorno: `{ sessao, aplicado, repetida?, erro?, codigo?, resultado?, cargas? }`. `resultado` traz os números do encantamento
 * (CD, dados, distância, chance de falha) e os `lembretes` da regra que a ficha não resolve.
 * Recusa devolve a MESMA sessão, sem carga nem reação gastas.
 */
export function usaEncantamento(sessao, derived, pedido = {}) {
  const { uid, encId, opId } = pedido;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const c = checagens(derived, sessao, uid, encId);
  if (c.erro) return recusa(sessao, c.erro, c.codigo);
  const { base, entrada } = c;

  const d = descritorDoEncantamento(entrada, encId, base);
  const r = usa(sessao, derived, d, { opId, registraAcao: pedido.registraAcao !== false, parametros: pedido.parametros ?? {} });
  if (!r.aplicado) {
    // A falta de carga é do pool compartilhado: o texto do contrato diz "Sem Usos Restantes", e aqui ele diz o que é.
    const semCarga = r.codigo === "sem-usos";
    return recusa(sessao, semCarga ? "Sem Cargas" : r.erro ?? "Uso Recusado", semCarga ? "sem-cargas" : r.codigo ?? "uso", { recusas: r.recusas });
  }
  const valores = avaliaUso(sessao, derived, d, { opId, parametros: pedido.parametros ?? {} }).valores;
  const resultado = { ...base.numeros(contextoDe(derived, entrada), valores) };
  if (lista(base.lembretes).length) resultado.lembretes = [...base.lembretes];
  const s = derived ? aparaSessao(r.sessao, derived) : r.sessao;
  const cargas = base.cargas ? resumoDeCargas(derived, s).find((x) => x.uid === uid) ?? null : null;
  return { sessao: s, aplicado: true, resultado, cargas, ativoId: r.ativoId ?? null, ...(r.acao ? { acao: r.acao } : {}), evento: { tipo: "encantamento", nome: d.nome, encId } };
}

/* ============================================================ */
/* RICOCHETE                                                     */
/* ============================================================ */
/** A chance de falha contra ataque a distância: 20% de base e 50% depois de gastar a carga, até o início do próximo turno. */
export function chanceDeRicochete(sessao, derived) {
  const doUniforme = lista(derived?.equip?.entradas).filter((e) => e?.equipado && lista(e.fa?.encantamentos).some((x) => x.id === "enc_unif_ricochete" && x.atende));
  if (!doUniforme.length) return null;
  const elevado = doUniforme.some((e) => usoDe(sessao).ativos[`enc:enc_unif_ricochete:${e.uid}`]);
  return elevado ? { chance: 50, d10AteOu: 5, elevado: true } : { chance: 20, d10AteOu: 2, elevado: false };
}

/** Rola o d10 do Ricochete contra um ataque a distância. `falhou` quando o d10 fica no limite da chance. */
export function rolaRicochete(sessao, derived, { rng = Math.random } = {}) {
  const chance = chanceDeRicochete(sessao, derived);
  if (!chance) return null;
  const d10 = 1 + Math.floor(rng() * 10);
  return { ...chance, d10, falhou: d10 <= chance.d10AteOu };
}

/* ============================================================ */
/* ESCUDO: ATAQUE E RD                                           */
/* ============================================================ */
const NIVEIS_DO_ESCUDO = { enc_esc_espinhoso: 1, enc_esc_destruidor: 2, enc_esc_avassalador: 3 };

/**
 * O dano do ataque com o escudo (p.141 e p.158). Espinhoso conta como um nível acima, Destruidor como dois e Avassalador como
 * três. Cada texto diz "conta como N níveis acima", então vale o MAIOR entre os que o escudo tem e atende, e não a soma
 * (leitura adotada, pergunta registrada). O dado do escudo vem do catálogo e sobe pela escada de Níveis de Dano, que é regra de
 * FICHA DE JOGADOR: na criatura o dano é fórmula fechada e `dado` volta nulo.
 */
export function danoDoEscudoAtacando(derived, uid) {
  const entrada = entradaDeDerived(derived, uid);
  if (!entrada || entrada.tipo !== "escudo") return null;
  const niveis = Math.max(0, ...lista(entrada.fa?.encantamentos)
    .filter((x) => x.atende && NIVEIS_DO_ESCUDO[x.id])
    .map((x) => NIVEIS_DO_ESCUDO[x.id]));
  const base = entrada.def?.dano?.dado ?? null;
  const jogador = derived?.sistema === "player";
  const subido = jogador && base ? moverNivel(base, niveis) : null;
  return { base, niveis, dado: subido?.texto ?? null, dados: subido?.dados ?? null, tipo: entrada.def?.dano?.tipo ?? "im" };
}

const ID_ATAQUE_DO_ESCUDO = (uid) => `escudo:atacou:${uid}`;

/**
 * Atacar com o escudo: *"Caso ataque utilizando um escudo, ele deixa de fornecer RD até o início do seu próximo turno"* (p.141).
 * Registra a suspensão como um uso ativo que cai no início do próximo turno desta ficha. Quem soma a RD do escudo no derive
 * deve ler `escudoSuspenso` (ponto de integração, o derive é reservado por outro lote).
 */
export function atacaComEscudo(sessao, derived, { uid, opId, registraAcao = false } = {}) {
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const entrada = entradaDeDerived(derived, uid);
  if (!entrada || entrada.tipo !== "escudo") return recusa(sessao, "Escudo Não Encontrado", "escudo-ausente");
  if (!entrada.equipado) return recusa(sessao, "Equipamento Guardado", "guardado");
  const d = { id: ID_ATAQUE_DO_ESCUDO(uid), nome: `${entrada.def?.nome ?? "Escudo"} Atacando`, origem: `item:${uid}`, duracao: { ate: "inicioDoProximoTurno" }, cobranca: "manual" };
  const r = usa(sessao, derived, d, { opId, registraAcao });
  if (!r.aplicado) return recusa(sessao, r.erro ?? "Uso Recusado", r.codigo ?? "uso", { recusas: r.recusas });
  return { sessao: r.sessao, aplicado: true, dano: danoDoEscudoAtacando(derived, uid), rdSuspensa: true, evento: { tipo: "ataque-do-escudo", uid } };
}

/** O escudo está sem fornecer RD porque atacou neste turno? */
export const escudoSuspenso = (sessao, uid) => !!usoDe(sessao).ativos[ID_ATAQUE_DO_ESCUDO(uid)];

/* ============================================================ */
/* ESPONJA                                                       */
/* ============================================================ */
/**
 * Esponja: *"sempre que cair ou sofrer dano de uma estrutura, o portador pode gastar sua reação para reduzir o dano recebido
 * em 10. Se for uma ferramenta de segundo grau mude o dano reduzido para 15 e se for de primeiro o dano reduzido se torna 20"*.
 * Gasta a reação e devolve quanto do `dano` informado é absorvido. A mesa confirma que a origem é queda ou estrutura.
 */
export function usaEsponja(sessao, derived, { uid, dano, opId, registraAcao = true, parametros = { queda: true } } = {}) {
  const r = usaEncantamento(sessao, derived, { uid, encId: "enc_esc_esponja", opId, registraAcao, parametros });
  if (!r.aplicado) return r;
  const bruto = Math.max(0, inteiro(dano));
  const reducao = Math.min(bruto, r.resultado.reducao);
  return { ...r, resultado: { ...r.resultado, danoRecebido: bruto, reducao, danoFinal: bruto - reducao } };
}

/** Algum escudo equipado com Intangível: o escudo não ocupa a mão para fins de habilidades (p.158). */
export const escudoIntangivelEquipado = (derived) => lista(derived?.equip?.entradas)
  .some((e) => e?.equipado && e.tipo === "escudo" && lista(e.fa?.encantamentos).some((x) => x.id === "enc_esc_intangivel" && x.atende));

export { ENCANTAMENTOS_ATIVOS, IDS_ATIVOS };
