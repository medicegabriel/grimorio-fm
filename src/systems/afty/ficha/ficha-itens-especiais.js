/**
 * ============================================================
 * ITENS COM EVENTO PRÓPRIO: LAÇO DA VIDA, CHAVEIRO ABSORSOR E VENENO NO ALVO (CX5, 2026-11-06)
 * ============================================================
 * Livro p.145 (Regras de Veneno), p.148 (Chaveiro Absorsor) e p.149 (Laço da Vida). Estes três não se usam como um frasco: o
 * Laço reage à MORTE, o Chaveiro reage a ELIMINAR um inimigo, e o veneno reage ao Teste de Resistência de OUTRA ficha.
 * O uso comum dos Itens Especiais está em `ficha-itens.js`.
 *
 * ------------------------------------------------------------
 * LAÇO DA VIDA
 * ------------------------------------------------------------
 * *"Caso um personagem com um laço da vida vá morrer, tal morte é ignorada e o laço se desgasta, sumindo. Ao evitar a morte com este
 * item, o personagem cura metade dos seus pontos de vida, mas recebe 1 nível de exaustão. O Laço da Vida não funciona caso o
 * feiticeiro já esteja com 5 níveis de Exaustão."* A operação roda com o corpo JÁ morto (CL2 registra a morte e um corpo morto não
 * recebe cura) ou com a morte massiva pendente. Ela desfaz a morte, zera o saldo negativo e as falhas, cura metade do PV máximo,
 * soma 1 de Exaustão e gasta o laço. Com 5 de Exaustão recusa e o laço NÃO é gasto.
 *
 * ------------------------------------------------------------
 * VENENO NO ALVO (p.145)
 * ------------------------------------------------------------
 * A CD sai do Custo do veneno (15, 25, 35, 45), +2 se vier num Dardo. O alvo faz Fortitude, e quem informa o resultado é a mesa
 * (`tr.sucesso`): a ficha do alvo recebe o que falha E o que o livro escreve entre parênteses, que vale mesmo no sucesso. Maldição e
 * Feto Híbrido têm +2 em Fortitude contra veneno e Corpo Amaldiçoado é imune (`imune`): isso é informado pela mesa, a ficha não
 * enxerga a espécie do alvo na sessão. O efeito que dura vira um uso ativo `veneno:<item>` com o custo guardado, e é o que o Antídoto
 * encerra. Condição entra pela sessão como qualquer outra.
 * ============================================================
 */
import { aplicaCura, aparaSessao, aplicaPerdaDeVida, defineCondicoes, registraRolagem } from "./ficha-sessao";
import { usa } from "./ficha-uso";
import { usoDe, comUso, jaAplicada, comOperacao } from "./ficha-uso-estado";
import { vitalEmBranco } from "./ficha-vital";
import { rolarDano } from "./ficha-rolagem";
import { getEquipamento } from "../afty-equipamentos";
import { USO_DE_ITEM, cdDoVeneno } from "../afty-itens-uso";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const lista = (v) => (Array.isArray(v) ? v : []);
const recusa = (sessao, erro, codigo, extra = {}) => ({ sessao, aplicado: false, erro, codigo, ...extra });

export const EXAUSTAO_QUE_IMPEDE_O_LACO = 5;

function entradaDoItem(ficha, sessao, uid, especial) {
  const criado = usoDe(sessao).itens.criados.find((c) => c.uid === uid);
  const entrada = criado ?? lista(ficha?.equipamentos?.itens).find((e) => e?.uid === uid);
  if (!entrada) return null;
  const def = getEquipamento(entrada.tipo, entrada.refId, ficha);
  if (!def || USO_DE_ITEM[def.id]?.especial !== especial) return null;
  return { entrada, def, criado: criado ?? null };
}

const unidadesGastas = (sessao, uid) => usoDe(sessao).itens.consumidos[uid] ?? 0;
const baixa = (sessao, uid, criado) => comUso(sessao, (u) => (criado
  ? { ...u, itens: { ...u.itens, criados: u.itens.criados.filter((c) => c.uid !== uid) } }
  : { ...u, itens: { ...u.itens, consumidos: { ...u.itens.consumidos, [uid]: (u.itens.consumidos[uid] ?? 0) + 1 } } }));

/* ============================================================ */
/* LAÇO DA VIDA                                                  */
/* ============================================================ */
/** Por que o Laço não pode salvar AGORA, ou `null`. Puro. */
export function bloqueioDoLaco(ficha, sessao, { uid } = {}) {
  const achado = entradaDoItem(ficha, sessao, uid, "laco");
  if (!achado) return "Laço da Vida Não Encontrado";
  if (!achado.entrada.equipado) return "Item Guardado";
  if (!achado.criado && unidadesGastas(sessao, uid) >= Math.max(1, inteiro(achado.entrada.qtd, 1))) return "Sem Unidades";
  if (inteiro(sessao?.exaustao) >= EXAUSTAO_QUE_IMPEDE_O_LACO) return "Exaustão 5 Impede o Laço";
  const v = sessao?.vital;
  if (v?.estado !== "morto" && !v?.massivoPendente) return "Ninguém Vai Morrer";
  return null;
}

/**
 * O Laço da Vida evita a morte. Tudo ou nada: recusa devolve a MESMA sessão e o laço continua no inventário.
 *   pedido { uid, opId }
 * Retorno: `{ sessao, aplicado, repetida?, erro?, codigo?, curou?, exaustao? }`.
 */
export function usaLacoDaVida(ficha, sessao, derived, pedido = {}) {
  const { uid, opId } = pedido;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const bloqueio = bloqueioDoLaco(ficha, sessao, { uid });
  if (bloqueio) return recusa(sessao, bloqueio, "laco-indisponivel");
  const achado = entradaDoItem(ficha, sessao, uid, "laco");
  const hpMax = Math.max(0, inteiro(derived?.hp));
  const metade = Math.floor(hpMax / 2);
  // A morte é ignorada: o corpo volta ao estado vivo, sem saldo nem falhas, e SÓ ENTÃO recebe a cura (corpo morto não recebe).
  const vital = { ...vitalEmBranco(), ...sessao.vital, estado: "vivo", saldo: 0, sucessos: 0, falhas: 0, testePendente: false, causa: null, massivoPendente: false };
  let s = { ...sessao, vital, hpAtual: 0 };
  s = aplicaCura(s, metade, hpMax);
  s = { ...s, exaustao: Math.max(0, inteiro(s.exaustao)) + 1 };
  s = baixa(s, uid, achado.criado);
  s = comOperacao(s, { id: opId, tipo: "laco-da-vida" });
  if (derived) s = aparaSessao(s, derived);
  return { sessao: s, aplicado: true, curou: s.hpAtual, exaustao: s.exaustao, evento: { tipo: "laco-da-vida", nome: achado.def.nome } };
}

/* ============================================================ */
/* CHAVEIRO ABSORSOR                                             */
/* ============================================================ */
export const PE_DO_CHAVEIRO_ABSORSOR = 2;

/**
 * *"Sempre que eliminar um inimigo que possua energia amaldiçoada ou seja formado por energia, você recupera 2 pontos de energia
 * amaldiçoada."* A mesa confirma que o inimigo é elegível (`energia: true`), porque a sessão não conhece a natureza do abatido. O
 * chaveiro precisa estar equipado e NÃO se gasta. Cada eliminação é uma operação (um `opId`).
 *   pedido { uid, opId, parametros: { energia: true } }
 */
export function eliminouInimigoComChaveiro(ficha, sessao, derived, pedido = {}) {
  const { uid, opId } = pedido;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const achado = entradaDoItem(ficha, sessao, uid, "chaveiro");
  if (!achado) return recusa(sessao, "Chaveiro Absorsor Não Encontrado", "item-ausente");
  if (!achado.entrada.equipado) return recusa(sessao, "Item Guardado", "item-guardado");
  const d = {
    id: `item:${achado.def.id}:abate`, nome: achado.def.nome, origem: `item:${uid}`, cobranca: "manual",
    parametros: [{ id: "energia", tipo: "bool", exige: true, rotulo: "Inimigo com Energia ou Feito de Energia" }],
  };
  const r = usa(sessao, derived, d, { opId, parametros: pedido.parametros ?? {} });
  if (!r.aplicado) return recusa(sessao, r.erro ?? "Uso Recusado", r.codigo ?? "uso", { recusas: r.recusas });
  const peMax = Math.max(0, inteiro(derived?.pe));
  const antes = Math.max(0, inteiro(r.sessao.peAtual));
  const depois = Math.min(Math.max(antes, peMax), antes + PE_DO_CHAVEIRO_ABSORSOR);
  return { sessao: { ...r.sessao, peAtual: depois }, aplicado: true, ganho: depois - antes, evento: { tipo: "chaveiro-absorsor", nome: achado.def.nome } };
}

/* ============================================================ */
/* VENENO NO ALVO                                                */
/* ============================================================ */
const ROLA = (texto, rng) => {
  const m = /^(\d+)d(\d+)$/.exec(String(texto));
  if (!m) return null;
  return rolarDano({ rotulo: "Veneno", detalhe: texto, dados: Number(m[1]), faces: Number(m[2]), fixo: 0, tom: "dano" }, rng);
};

const condicaoObjeto = (nome, rodadas) => (rodadas == null ? { nome } : { nome, rodadas });

/**
 * A CD do veneno de um item, ou `null` se o item não é veneno. `dardo` soma os +2 do Dardo (p.137).
 */
export function cdDoVenenoDoItem(itemId, { dardo = false } = {}) {
  const veneno = USO_DE_ITEM[itemId]?.veneno;
  return veneno ? cdDoVeneno(veneno.custo, { dardo }) : null;
}

/**
 * Aplica o veneno na ficha do ALVO (a sessão passada é a dele). A mesa informa o resultado do Teste de Resistência de Fortitude.
 *
 *   pedido { itemId, tr: { sucesso }, opId, imune?, rng? }
 *
 * - `imune` (Corpo Amaldiçoado): nada acontece, e a operação diz isso em vez de fingir que aplicou
 * - falha no TR: vale `aoFalhar` e, junto, `mesmoSePassar`
 * - sucesso no TR: vale só `mesmoSePassar`, o que o livro escreve entre parênteses
 * Retorno: `{ sessao, aplicado, repetida?, erro?, codigo?, aplicou: { condicoes, perdaDeVida, ativoId } }`.
 */
export function aplicaVenenoNoAlvo(sessao, derived, pedido = {}) {
  const { itemId, opId } = pedido;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const veneno = USO_DE_ITEM[itemId]?.veneno;
  if (!veneno) return recusa(sessao, "Item Não É Veneno", "nao-veneno");
  if (pedido.imune) return recusa(sessao, "Alvo Imune a Veneno", "imune");
  if (typeof pedido.tr?.sucesso !== "boolean") return recusa(sessao, "Informe o Resultado do Teste de Resistência", "sem-tr");
  const efeitos = pedido.tr.sucesso ? { ...(veneno.mesmoSePassar ?? {}) } : { ...(veneno.aoFalhar ?? {}), ...Object.fromEntries(Object.entries(veneno.mesmoSePassar ?? {}).filter(([k]) => k !== "condicoes" && k !== "rodadas")) };
  const condicoes = [
    ...lista(!pedido.tr.sucesso ? veneno.aoFalhar?.condicoes : []).map((n) => condicaoObjeto(n, veneno.aoFalhar?.rodadas ?? null)),
    ...lista(veneno.mesmoSePassar?.condicoes).map((n) => condicaoObjeto(n, veneno.mesmoSePassar?.rodadas ?? null)),
  ];
  const rng = pedido.rng ?? Math.random;
  let s = sessao;
  const aplicou = { condicoes: condicoes.map((c) => c.nome), perdaDeVida: 0, ativoId: null };

  const perda = efeitos.perdaDeVida ? ROLA(efeitos.perdaDeVida, rng) : null;
  if (perda) {
    s = registraRolagem(s, perda);
    s = aplicaPerdaDeVida(s, perda.total, derived);
    aplicou.perdaDeVida = perda.total;
  }
  if (condicoes.length) {
    const atuais = lista(s.condicoes);
    s = defineCondicoes(s, [...atuais.filter((c) => !condicoes.some((n) => n.nome === (typeof c === "string" ? c : c?.nome))), ...condicoes]);
  }

  const buffs = [];
  if (efeitos.defesa) buffs.push({ tipo: "buff", canal: "defesa", expr: String(efeitos.defesa), nome: "Veneno" });
  if (efeitos.peAdicional) buffs.push({ tipo: "buff", canal: "custoPE", expr: String(-efeitos.peAdicional), nome: "Veneno" });
  /* Todo veneno deixa um uso ativo marcado com o Custo e as condições que ele pôs: é por ele que o Antídoto sabe o que encerra.
     O prazo só é a CENA quando o texto escreve cena (o efeito da Lágrima, `ate: "cena"`). Nos demais o prazo é MANUAL (decisão do autor,
     2026-11-06): o marcador fica até o descanso e quem o tira antes é o Antídoto ou a mesa, sem fim de combate automático. */
  const d = {
    id: `veneno:${itemId}`, nome: getEquipamento("item", itemId)?.nome ?? "Veneno", origem: `veneno:${itemId}`, cobranca: "manual", renova: true,
    duracao: { ate: efeitos.ate === "cena" ? "cena" : "descanso" }, efeitos: buffs,
  };
  const r = usa(s, derived, d, { opId: `${opId}:veneno` });
  if (!r.aplicado) return recusa(sessao, r.erro ?? "Veneno Recusado", r.codigo ?? "uso");
  s = comUso(r.sessao, (u) => ({
    ...u, ativos: { ...u.ativos, [d.id]: { ...u.ativos[d.id], parametros: { custo: veneno.custo, condicoes: condicoes.map((c) => c.nome) } } },
  }));
  aplicou.ativoId = d.id;
  s = comOperacao(s, { id: opId, tipo: "veneno" });
  if (derived) s = aparaSessao(s, derived);
  return { sessao: s, aplicado: true, aplicou, evento: { tipo: "veneno", itemId } };
}
