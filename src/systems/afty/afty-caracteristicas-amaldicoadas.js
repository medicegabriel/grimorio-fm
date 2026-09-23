/**
 * ============================================================
 * CARACTERÍSTICAS AMALDIÇOADAS — GRIMÓRIO AFTY
 * ============================================================
 * Nasceu em 2026-09-22, junto do addon "Maldição - Era de Ouro". A Origem
 * Maldição tem uma característica ("Anatomia Amaldiçoada", concedida pelo
 * addon) que dá "uma característica amaldiçoada no 1° nível, recebendo outra
 * a cada 5 níveis": um POOL de escolha livre, parecido com Aptidão (nível
 * libera vaga, a entrada em si não custa orçamento), mas SEM trilha nenhuma.
 *
 * ⚠ O CATÁLOGO NASCE VAZIO DE PROPÓSITO. As ~20 entradas do livro são conteúdo
 * do addon "Maldição - Era de Ouro" (`acrescenta.caracteristicasAmaldicoadas`),
 * não do raw: é a mesma divisão de sempre, o VERBO (o mecanismo de vaga por
 * nível, a validação, a tela) mora aqui, o SUBSTANTIVO (as ~20 características)
 * mora no pacote. Mesma forma da família `clas`/`origens` em afty-origens.js.
 *
 * ⚠ REQUISITO REUSA `avaliarRequisitoAptidao` (afty-aptidoes.js): o formato
 * `{ tipo, valor, ... }` é o mesmo, e as Características Amaldiçoadas só usam
 * `nd` (nível) e `nota` (lembrete, não bloqueia) por ora. Nada aqui pede
 * `trilha` nem `aptidao`.
 */

import { registrarFamilia, remendarLista } from "./afty-addons";
import { avaliarRequisitoAptidao } from "./afty-aptidoes";

export const AFTY_CARACTERISTICAS_AMALDICOADAS = [];

let BY_ID = {};
const CATALOGO_BASE = AFTY_CARACTERISTICAS_AMALDICOADAS.slice();

function aplicarExtras(extras = [], remendos = null) {
  AFTY_CARACTERISTICAS_AMALDICOADAS.splice(
    0, AFTY_CARACTERISTICAS_AMALDICOADAS.length,
    ...remendarLista(CATALOGO_BASE, remendos), ...extras,
  );
  BY_ID = Object.fromEntries(AFTY_CARACTERISTICAS_AMALDICOADAS.map((c) => [c.id, c]));
}

aplicarExtras();

export const getCaracteristicaAmaldicoada = (id) => BY_ID[id] ?? null;

function validarCatalogo() {
  const problemas = [];
  const ids = new Set();
  for (const c of AFTY_CARACTERISTICAS_AMALDICOADAS) {
    if (!c?.id) { problemas.push("característica sem id"); continue; }
    if (ids.has(c.id)) problemas.push(`id duplicado: ${c.id}`);
    ids.add(c.id);
    if (!c.nome?.trim()) problemas.push(`${c.id}: sem nome`);
    if (!c.descricao?.trim()) problemas.push(`${c.id}: sem descrição`);
  }
  return problemas;
}

registrarFamilia("caracteristicasAmaldicoadas", {
  rotulo: "Característica Amaldiçoada",
  chave: "id",
  obrigatorios: ["nome", "descricao"],
  aplicar: aplicarExtras,
  basicos: () => CATALOGO_BASE,
  validador: validarCatalogo,
  resolver: (id) => getCaracteristicaAmaldicoada(id),
  idsDaFicha: (c) => (Array.isArray(c?.caracteristicasAmaldicoadas) ? c.caracteristicasAmaldicoadas : []),
});

/**
 * As escolhas desta ficha, resolvidas contra o catálogo e a vaga disponível.
 *
 * `vagas` já vem PRONTA (canal `vagasCaracteristicaAmaldicoada`, somado pelo
 * `deriveAfty` como qualquer outro canal): esta função só confere contra o
 * catálogo e monta o que a tela mostra, o mesmo papel de `resolveMarcadoresInvocacao`
 * para as invocações.
 *
 * ⚠ EXCEDER A VAGA AVISA, NÃO TRAVA. Mesma regra do resto do sistema (Ações
 * com Custo, Ações e Características de Invocação): quem cortar depois
 * decide o que sai, e a ficha não perde a escolha calada.
 */
export function resolveCaracteristicasAmaldicoadas(creature, ctx = {}) {
  const brutas = Array.isArray(creature?.caracteristicasAmaldicoadas) ? creature.caracteristicasAmaldicoadas : [];
  const vagas = Math.max(0, Math.trunc(Number(ctx.vagas) || 0));
  const lista = brutas.map((id) => {
    const c = getCaracteristicaAmaldicoada(id);
    if (!c) return { id, nome: id, descricao: "", encontrada: false, requisitos: [] };
    return {
      id,
      nome: c.nome,
      descricao: c.descricao,
      encontrada: true,
      requisitos: (c.requisitos || []).map((r) => avaliarRequisitoAptidao(r, ctx)),
    };
  });
  return {
    lista,
    catalogo: AFTY_CARACTERISTICAS_AMALDICOADAS,
    escolhidas: brutas,
    vagas,
    usadas: lista.length,
    excedeu: lista.length > vagas,
  };
}
