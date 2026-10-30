/* ============================================================
   BUFF DE MESA MANUAL NO G2: a lógica pura (fechamento funcional do G2, 2026-10-20)
   ============================================================
   O mesmo registro do formulário antigo (`NovoBuff`, em `abas/AbaBuffs.jsx`) e a mesma leitura do motor (`efeitosDaSessao`):

     { id, nome, canal, expr, rodadas | null, escopo?: "invocacao", invocacaoAlvo? }

   ⚠ NÃO É Fonte Externa. Um registro `rec` é número fixo (benefícios `{ canal, valor }`), e perderia a EXPRESSÃO do DSL, o canal próprio e o escopo.
   O buff de mesa guarda a expressão como o jogador escreveu e o motor a avalia (com o contexto da ficha) a cada derive.

   ⚠ `sessao.buffs` também guarda os registros recebidos (`rec`, inclusive as instâncias de Pacote para Aliados) e os gerados na tradução: criar ou
   tirar um buff de mesa mexe SÓ nele, por id, na sessão que estiver valendo, e deixa todo o resto da lista como estava.
   ============================================================ */
import { EFEITO_CANAL_GRUPOS, getCanal } from "../../afty-efeitos";
import { INV_EFEITO_CANAL_GRUPOS } from "../../afty-invocacoes";
import { validateExpression } from "../../afty-dsl";
import { uid } from "./util";

export const ESCOPOS_DE_BUFF = [
  { id: "criatura", rotulo: "Na Criatura" },
  { id: "invocacao", rotulo: "Na Invocação" },
];

/** O rascunho vazio: só existe na tela, e criar o esvazia. */
export const rascunhoDeBuff = () => ({ nome: "", escopo: "criatura", invocacaoAlvo: "", canal: "defesa", expr: "", rodadas: "" });

/** Os canais do escopo: a criatura e a invocação repetem nomes (`pv` aqui e `pv` lá são números diferentes), cada uma com o seu catálogo. */
export const catalogoDeCanais = (escopo) => (escopo === "invocacao" ? INV_EFEITO_CANAL_GRUPOS : EFEITO_CANAL_GRUPOS);
/** O rótulo de um canal no catálogo do escopo certo. */
export function rotuloDoCanal(canal, escopo = "criatura") {
  if (escopo === "invocacao") return INV_EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens).find((c) => c.id === canal)?.label ?? canal;
  return getCanal(canal)?.label ?? canal;
}

/** Trocar o escopo recomeça o canal e a mira: o id do catálogo antigo não existe no novo (`defesa` existe nos dois e é o padrão dos dois). */
export const comEscopo = (rascunho, escopo) => ({ ...rascunho, escopo, invocacaoAlvo: "", canal: "defesa" });

/** As rodadas digitadas: só dígitos, e vazio é sem contador. Menos de 1 vira 1. */
export const rodadasDoRascunho = (texto) => {
  const t = String(texto ?? "").trim();
  return t ? Math.max(1, Math.trunc(Number(t)) || 1) : null;
};

/**
 * Valida o rascunho e devolve `{ buff }` pronto para a sessão, ou `{ erro, campo }`. Nada é gravado aqui.
 * A expressão tem de existir e passar pelo avaliador do DSL (sintaxe e funções conhecidas): uma expressão inválida cairia calada em zero.
 * `invocacoes` são as da ficha, para a mira numa só.
 */
export function montarBuff(rascunho, { invocacoes = [], novoId = () => `buff_${uid()}` } = {}) {
  /* O "+2" do campo é o jeito natural de escrever um bônus, mas o DSL não aceita o sinal à frente (`+2` não passa pelo avaliador e o buff valeria 0 calado).
     O sinal de mais inicial sai, e o resto segue para a conferência como o jogador escreveu. */
  const expr = String(rascunho?.expr ?? "").trim().replace(/^\+\s*/, "");
  if (!expr) return { erro: "Falta o Valor ou a Expressão", campo: "expr" };
  const v = validateExpression(expr);
  if (!v.ok) return { erro: "Expressão Inválida", detalhe: v.error, campo: "expr" };
  const naInvocacao = rascunho.escopo === "invocacao";
  const catalogo = catalogoDeCanais(naInvocacao ? "invocacao" : "criatura").flatMap((g) => g.itens);
  const def = catalogo.find((c) => c.id === rascunho.canal);
  if (!def) return { erro: "Canal Desconhecido", campo: "canal" };
  if (naInvocacao && rascunho.invocacaoAlvo && !invocacoes.some((i) => i.id === rascunho.invocacaoAlvo)) return { erro: "Invocação Desconhecida", campo: "invocacaoAlvo" };
  return {
    buff: {
      id: novoId(),
      nome: String(rascunho.nome ?? "").trim() || def.label || "Buff",
      canal: rascunho.canal,
      expr,
      rodadas: rodadasDoRascunho(rascunho.rodadas),
      ...(naInvocacao ? { escopo: "invocacao" } : {}),
      ...(naInvocacao && rascunho.invocacaoAlvo ? { invocacaoAlvo: rascunho.invocacaoAlvo } : {}),
    },
  };
}

/** É um buff de mesa manual (e não um registro recebido, uma instância de pacote ou uma linha gerada)? */
export const ehBuffDeMesa = (b) => !!b && !b.rec && !b.gerado && typeof b.canal === "string" && b.canal !== "";

/** Acrescenta o buff à sessão de AGORA. Um id que já existe (dois cliques no mesmo instante) não entra de novo. */
export function comBuffDeMesa(sessao, buff) {
  const buffs = sessao.buffs ?? [];
  if (buffs.some((x) => x.id === buff.id)) return sessao;
  return { ...sessao, buffs: [...buffs, buff] };
}
/** Tira SÓ o buff apontado, por id, deixando os registros recebidos, as instâncias e os gerados como estavam. */
export function semBuffDeMesa(sessao, id) {
  const buffs = sessao.buffs ?? [];
  if (!buffs.some((x) => x.id === id)) return sessao;
  return { ...sessao, buffs: buffs.filter((x) => x.id !== id) };
}
/** Muda as rodadas de UM buff pelo id (`null` é sem contador). */
export function comRodadasDoBuff(sessao, id, rodadas) {
  const buffs = sessao.buffs ?? [];
  if (!buffs.some((x) => x.id === id)) return sessao;
  const v = rodadas == null ? null : Math.max(1, Math.trunc(Number(rodadas)) || 1);
  return { ...sessao, buffs: buffs.map((x) => (x.id === id ? { ...x, rodadas: v } : x)) };
}

/** O que o buff diz de si, para o detalhe: o canal no catálogo do escopo certo, a expressão e onde cai. */
export function descricaoDoBuff(b, invocacoes = []) {
  if (!b) return null;
  const naInvocacao = b.escopo === "invocacao";
  const alvo = naInvocacao ? (b.invocacaoAlvo ? (invocacoes.find((i) => i.id === b.invocacaoAlvo)?.nome || "Invocação") : "Todas as Invocações") : null;
  return { canal: rotuloDoCanal(b.canal, naInvocacao ? "invocacao" : "criatura"), expr: String(b.expr ?? ""), onde: naInvocacao ? `Na Invocação · ${alvo}` : null, naInvocacao, alvo };
}
