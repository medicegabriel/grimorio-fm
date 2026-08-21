/**
 * CONCESSÃO VINDA DA SESSÃO — a primitiva 8.3 dos Addons.
 *
 * O caso que a pediu é o *Ciclo de Adaptação*, do Mahoraga: a cada condição em
 * combate, o mestre acrescenta na hora Habilidades, Talentos, Treinos ou o que
 * for na criatura, **já calculando**. Ver `docs/afty-addons.md` seção 8.3.
 *
 * ⚠ AS TRÊS DECISÕES DO AUTOR (2026-08-20) DIZEM UMA COISA SÓ:
 *
 *   • onde o mestre escolhe → na Ficha Final E no painel de combatente;
 *   • a concessão gasta vaga → NÃO, entra de graça;
 *   • sobrevive ao fim do combate → NÃO, morre com a sessão.
 *
 * Juntas: a concessão é estado de SESSÃO, nunca ficha. Ela não é gravada na
 * criatura, não passa por contador de orçamento nenhum, e limpar a sessão
 * desfaz tudo. É o mesmo estatuto que os buffs temporários já têm.
 *
 * Por isso este módulo não tem nada de armazenamento: quem guarda é a
 * `ficha-sessao.js`, no campo `concedido`, e o Encontro guarda a sessão dele
 * pelo mesmo caminho.
 *
 * COMO ELA ENTRA NO MOTOR
 * -----------------------
 * Por `deriveAfty(creature, { concedido })`, e o `deriveAfty` reparte a lista
 * pelas famílias e entrega a cada resolvedor o CANAL DE CONCESSÃO dele. Não é
 * um caminho paralelo inventado aqui: a `resolveHabilidades` já tinha um canal
 * assim desde sempre (as Bases que a Especialização concede entram em
 * `concedidas`, valem para tudo e não gastam vaga), e as outras famílias
 * ganharam o mesmo canal, com o mesmo nome e a mesma semântica.
 *
 * O efeito colateral bom é que o "já calculando" sai de graça: a derivação é
 * função pura da criatura, e o concedido entra antes de qualquer conta.
 *
 * ⚠ PRÉ-REQUISITO NÃO É VERIFICADO, e isso é o ponto. O Ciclo de Adaptação
 * concede coisas que a criatura não alcançaria comprando. O resolvedor continua
 * REPORTANDO o inacessível em `inacessiveis` (convenção do projeto: reporta,
 * não remove), então quem quiser mostrar, mostra.
 */

import { AFTY_HABILIDADES, getHabilidade } from "./afty-habilidades";
import { AFTY_TALENTOS, getTalento } from "./afty-talentos";
import { HABILIDADES_GERAIS, getHabilidadeGeral } from "./afty-gerais";
import {
  MELHORIAS_SUPERIORES, HABILIDADES_LENDARIAS,
  getMelhoriaSuperior, getHabilidadeLendaria,
} from "./afty-alto-nivel";
import { AFTY_TREINOS_ESPECIAIS, getTreinoEspecial } from "./afty-treinos-especiais";
import { AFTY_APTIDOES, getAptidao } from "./afty-aptidoes";

/**
 * As famílias que a sessão sabe conceder.
 *
 * ⚠ SÃO AS DE ID DE CATÁLOGO, e não é limitação de preguiça: conceder é
 * "acrescentar um id numa lista", que é exatamente o que o criador faz. O
 * Feitiço fica de fora porque ele NÃO é id de catálogo, é objeto criado na
 * ficha, e conceder um significa escolher de ONDE copiar. Está anotado em
 * `docs/a-fazer.md`.
 *
 * `catalogo` é função, e não a lista direta, porque um addon pode ter entrado
 * depois de este módulo ser importado.
 */
export const FAMILIAS_CONCESSAO = [
  {
    id: "habilidades",
    rotulo: "Habilidade de Especialização",
    catalogo: () => AFTY_HABILIDADES,
    get: getHabilidade,
    repetivel: false,
  },
  {
    id: "gerais",
    rotulo: "Habilidade Geral",
    catalogo: () => HABILIDADES_GERAIS,
    get: getHabilidadeGeral,
    repetivel: true,
  },
  {
    id: "talentos",
    rotulo: "Talento",
    catalogo: () => AFTY_TALENTOS,
    get: getTalento,
    repetivel: false,
  },
  {
    id: "treinosEspeciais",
    rotulo: "Treino Especial",
    catalogo: () => AFTY_TREINOS_ESPECIAIS,
    get: getTreinoEspecial,
    repetivel: true,
  },
  {
    id: "aptidoes",
    rotulo: "Aptidão Amaldiçoada",
    catalogo: () => AFTY_APTIDOES,
    get: getAptidao,
    repetivel: false,
  },
  {
    id: "melhoriasSuperiores",
    rotulo: "Melhoria Superior",
    catalogo: () => MELHORIAS_SUPERIORES,
    get: getMelhoriaSuperior,
    repetivel: true,
  },
  {
    id: "lendarias",
    rotulo: "Habilidade Lendária",
    catalogo: () => HABILIDADES_LENDARIAS,
    get: getHabilidadeLendaria,
    repetivel: false,
  },
];

const FAM_BY_ID = Object.fromEntries(FAMILIAS_CONCESSAO.map((f) => [f.id, f]));

export const familiaDeConcessao = (id) => FAM_BY_ID[id] ?? null;

/** Lista vazia por família, para o `deriveAfty` nunca precisar testar chave. */
export const CONCEDIDO_VAZIO = Object.freeze(
  Object.fromEntries(FAMILIAS_CONCESSAO.map((f) => [f.id, Object.freeze([])])),
);

let contador = 0;
/**
 * Identificador de UMA pega. Existe porque família repetível aceita o mesmo id
 * duas vezes, e sem ele o botão de remover não saberia QUAL das duas tirar.
 * Não precisa ser único no mundo, só dentro de uma sessão.
 */
const novoUid = () => `c${Date.now().toString(36)}${(contador += 1).toString(36)}`;

/**
 * Uma pega nova. O `alvo` só existe para o Treino Especial, que tem escolha
 * própria (qual perícia, qual atributo), e vai junto por ser parte da pega.
 */
export function novaConcessao(familia, id, alvo = null) {
  if (!FAM_BY_ID[familia] || typeof id !== "string" || !id.trim()) return null;
  return { uid: novoUid(), familia, id: id.trim(), alvo: alvo ? String(alvo) : null, em: Date.now() };
}

/**
 * Sanea o que veio do armazenamento. Família desconhecida e id vazio caem fora,
 * shape errado cai fora, e o resto passa MESMO QUE O ID NÃO EXISTA NO CATÁLOGO:
 * id órfão é linha morta, e linha morta é mostrada, não apagada (decisão 4 dos
 * Addons). Quem separa uma coisa da outra é o `problemasDeConcessao`.
 */
export function normalizaConcedido(bruta) {
  if (!Array.isArray(bruta)) return [];
  const out = [];
  for (const b of bruta) {
    if (!b || typeof b !== "object") continue;
    if (!FAM_BY_ID[b.familia]) continue;
    const id = typeof b.id === "string" ? b.id.trim() : "";
    if (!id) continue;
    out.push({
      uid: typeof b.uid === "string" && b.uid ? b.uid : novoUid(),
      familia: b.familia,
      id,
      alvo: b.alvo ? String(b.alvo) : null,
      em: Number.isFinite(b.em) ? b.em : 0,
    });
  }
  return out;
}

/**
 * Reparte a lista por família, no shape que cada resolvedor espera.
 *
 * ⚠ O Treino Especial sai como `{ id, alvo }`, e não como id cru, porque é o
 * shape da lista dele na ficha. As outras seis saem como id.
 */
export function agrupaConcedido(bruta) {
  const lista = normalizaConcedido(bruta);
  const out = {};
  for (const f of FAMILIAS_CONCESSAO) out[f.id] = [];
  for (const c of lista) {
    out[c.familia].push(c.familia === "treinosEspeciais" ? { id: c.id, alvo: c.alvo } : c.id);
  }
  return out;
}

/**
 * As pegas cujo id não existe em catálogo nenhum: LINHA MORTA. Quase sempre é
 * addon que saiu do ar depois de a sessão ter sido gravada.
 *
 * Devolve `[{ uid, familia, rotulo, id }]`, pronto para a tela listar.
 */
export function problemasDeConcessao(bruta) {
  const out = [];
  for (const c of normalizaConcedido(bruta)) {
    const fam = FAM_BY_ID[c.familia];
    if (fam.get(c.id)) continue;
    out.push({ uid: c.uid, familia: c.familia, rotulo: fam.rotulo, id: c.id });
  }
  return out;
}

/**
 * A lista pronta para a tela: nome resolvido, rótulo da família, e `morta`
 * quando o catálogo não conhece mais o id.
 */
export function concessoesDaSessao(bruta) {
  return normalizaConcedido(bruta).map((c) => {
    const fam = FAM_BY_ID[c.familia];
    const def = fam.get(c.id);
    return {
      ...c,
      rotuloFamilia: fam.rotulo,
      nome: def?.nome ?? c.id,
      morta: !def,
    };
  });
}

/** Acrescenta uma pega. Devolve lista NOVA, e a de entrada não é tocada. */
export function comConcessao(bruta, familia, id, alvo = null) {
  const nova = novaConcessao(familia, id, alvo);
  if (!nova) return normalizaConcedido(bruta);
  return [...normalizaConcedido(bruta), nova];
}

/** Tira UMA pega, pelo uid. Repetível perde só a que foi apontada. */
export function semConcessao(bruta, uid) {
  return normalizaConcedido(bruta).filter((c) => c.uid !== uid);
}
