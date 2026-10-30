/* ============================================================
   CONCEDIDO PELO MESTRE NO G2: a lógica pura (fechamento funcional do G2, 2026-10-20)
   ============================================================
   O catálogo por família, a busca e os verbos são os de `afty-concessao.js` e `ficha-sessao.js` (`concedeNaSessao`, `removeConcessao`). A concessão
   vive em `sessao.concedido` e o derive a interpreta: NÃO é gravada na ficha, NÃO gasta orçamento de criação, NÃO exige o pré-requisito de compra e
   não tem prazo de rodada (morre com a sessão). Conceder uma Habilidade não a ATIVA: se ela pede ativação própria, o jogador a ativa pelo catálogo.
   ============================================================ */
import { FAMILIAS_CONCESSAO, familiaDeConcessao } from "../../afty-concessao";
import { concedeNaSessao, removeConcessao } from "../ficha-sessao";

/** Quantos resultados a busca mostra. Acima disto, refine (o mesmo teto do painel antigo). */
export const MAX_RESULTADOS_CONCESSAO = 40;

const normaliza = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** A tela de Concedido existe para esta ficha? A concessão é recurso de ADDON (`permite: ["concessao"]`), e a entrada que já está na sessão
 *  mantém a tela à vista mesmo depois de o addon sair: sem isso a linha morta ficaria presa, sem botão de tirar. */
export const concessaoDisponivel = (derived) => (derived?.primitivas ?? []).includes("concessao") || (derived?.concedido ?? []).length > 0;

export const familiasDeConcessao = () => FAMILIAS_CONCESSAO.map((f) => ({ id: f.id, rotulo: f.rotulo, repetivel: !!f.repetivel }));

/** A busca no catálogo da família (nome ou id), lida a CADA busca: o `aplicarAddons` reescreve a lista no lugar. */
export function buscarNaFamilia(familiaId, termo = "", max = MAX_RESULTADOS_CONCESSAO) {
  const familia = familiaDeConcessao(familiaId) ?? FAMILIAS_CONCESSAO[0];
  const lista = familia.catalogo() ?? [];
  const alvo = normaliza(termo).trim();
  const casa = alvo ? lista.filter((e) => normaliza(e.nome).includes(alvo) || normaliza(e.id).includes(alvo)) : lista;
  return { familia: familia.id, itens: casa.slice(0, max), sobrando: Math.max(0, casa.length - Math.min(casa.length, max)), total: lista.length };
}

/** A entrada que já está concedida? */
export const jaConcedida = (sessao, familiaId, id) => (sessao?.concedido ?? []).some((c) => c.familia === familiaId && c.id === id);

/** Concede pelo verbo da sessão. Uma família que NÃO repete (Habilidade de Especialização, Talento, Aptidão, Lendária) recusa a segunda pega igual,
 *  porque o derive a contaria como a mesma: o clique duplo não deixa duas linhas. A repetível (Geral, Treino Especial, Melhoria) aceita de novo. */
export function concederNaSessao(sessao, familiaId, id) {
  const familia = familiaDeConcessao(familiaId);
  if (!familia || typeof id !== "string" || !id.trim()) return { sessao, erro: "Entrada Desconhecida" };
  if (!familia.repetivel && jaConcedida(sessao, familiaId, id)) return { sessao, erro: "Já Concedido" };
  const depois = concedeNaSessao(sessao, familiaId, id);
  return depois === sessao ? { sessao, erro: "Entrada Desconhecida" } : { sessao: depois };
}

/** Tira UMA pega pelo uid (a repetível perde só a apontada). */
export const removerConcessaoDaSessao = (sessao, uid) => removeConcessao(sessao, uid);
