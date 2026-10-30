/* ============================================================
   IMITAÇÃO NO G2: a lógica pura (fechamento funcional do G2, 2026-10-20)
   ============================================================
   O painel antigo (`PainelDeImitacao.jsx`) guarda a lógica dentro do componente. Aqui ela é função pura sobre a SESSÃO, para o G2 operar a
   Imitação pelo catálogo sem outro motor: tudo passa por `trocarCopiaImitacao`, `tentarAprenderImitacao`, `cdAprenderImitacao` e o catálogo de
   `afty-imitacao.js`. O estado mora em `sessao.combate.imitacao`, e `aplicaPatchCombate` o grava (o mesmo verbo do painel antigo).

   ⚠ Copiar NÃO cobra PE e NÃO compra nada: é estado de mesa. Selecionar ou consultar um candidato nunca troca a cópia (só `copiarNaSessao` troca,
   e ela só roda por uma ação explícita da tela). O aprendizado é da sessão, e não vira compra permanente da ficha.
   ============================================================ */
import { catalogoImitacao, cdAprenderImitacao, idsPossuidosNaImitacao, tentarAprenderImitacao, trocarCopiaImitacao } from "../../afty-imitacao";
import { filtraHabilidades } from "../../afty-filtro-habilidades";
import { abasDeOpcoes } from "../../afty-habilidades";
import { aplicaPatchCombate } from "../ficha-sessao";

export const TIPOS_DE_COPIA = [
  { id: "postura", rotulo: "Posturas" },
  { id: "manobra", rotulo: "Manobras" },
  { id: "ativa", rotulo: "Habilidades Ativas" },
  { id: "passiva", rotulo: "Habilidades Passivas" },
  { id: "estilo", rotulo: "Estilos" },
];
const ROTULO_DO_TIPO = Object.fromEntries(TIPOS_DE_COPIA.map((t) => [t.id, t.rotulo]));
export const rotuloDoTipoDeCopia = (id) => ROTULO_DO_TIPO[id] ?? id;

/** Os tipos que ESTA ficha pode copiar: a Imitação comum só vai até Habilidades Ativas, e a Perfeita também copia passivas e estilos. */
export const tiposDaImitacao = (derived) => (derived?.imitacao?.perfeita ? TIPOS_DE_COPIA : TIPOS_DE_COPIA.slice(0, 3));
export const imitacaoDisponivel = (derived) => !!derived?.imitacao?.disponivel;
/** Habilidade ativa e passiva pedem a confirmação do jogador de que a copiada é do tipo certo e não gasta PE (o painel antigo pede o mesmo). */
export const pedeElegibilidade = (tipo) => tipo === "ativa" || tipo === "passiva";

/** O estado de mesa da Imitação, com as aprendidas que o derive já resolveu. */
export const estadoDaImitacao = (sessao, derived) => ({ ...sessao?.combate?.imitacao, aprendidas: derived?.imitacao?.aprendidas ?? [] });

/** As opções de um tipo que a ficha ainda NÃO possui (nem aprendeu), com a busca e o filtro de efeito. Habilidades ativas e passivas saem
 *  agrupadas por especialização e nível, como as abas do painel antigo. */
export function candidatasDoTipo(derived, estado, tipo, { efeito = "todos", termo = "" } = {}) {
  const possuidas = idsPossuidosNaImitacao(derived, estado?.aprendidas ?? []);
  const todas = catalogoImitacao(tipo).filter((h) => !possuidas.has(h.id));
  const itens = filtraHabilidades(todas, efeito, termo);
  let grupos;
  if (pedeElegibilidade(tipo)) {
    grupos = abasDeOpcoes(itens.map((h) => ({ ...h, nivelMin: h.nivel })), "especializacao").flatMap((e) => (
      abasDeOpcoes(e.opcoes, "nivel").map((n) => ({ rotulo: `${e.label} · Nível ${n.id}`, itens: n.opcoes }))
    ));
  } else grupos = [{ rotulo: "", itens }];
  return { total: todas.length, itens, grupos };
}

/** A cópia ativa, como o derive a entende (só existe em combate e quando a ficha pode copiar). */
export const copiaAtual = (derived) => derived?.imitacao?.copia ?? null;
/** As aprendidas, com o nome do catálogo e se ainda podem ser copiadas por esta ficha. */
export function aprendidasDaImitacao(derived, estado) {
  const tipos = new Set(tiposDaImitacao(derived).map((t) => t.id));
  return (estado?.aprendidas ?? []).map((c) => {
    const def = catalogoImitacao(c.tipo).find((h) => h.id === c.id);
    return { ...c, nome: def?.nome ?? "Cópia indisponível", descricao: def?.descricao ?? "", utilizavel: tipos.has(c.tipo) && !!def };
  });
}
/** A CD de aprender a cópia atual (35, ou 40 em passiva e estilo, menos 2 por tentativa). */
export const cdDaCopia = (derived, estado) => (estado?.copia ? cdAprenderImitacao(estado, estado.copia) : null);
/** As opções que a cópia pede (Mestre da Postura, por exemplo), com as escolhidas e o limite. */
export function escolhasDaCopia(sessao, derived) {
  const def = derived?.imitacao?.def?.escolha ?? null;
  if (!derived?.imitacao?.copia || !def) return null;
  const estado = estadoDaImitacao(sessao, derived);
  return {
    opcoes: def.opcoes ?? [],
    escolhidas: derived.imitacao.copia?.escolhas ?? [],
    limite: derived.habilidades?.escolhas?.porHab?.[estado.copia?.id]?.allowance ?? 1,
  };
}

/** Pode copiar agora? A cópia só vale em combate, o tipo tem de ser um dos da ficha, e ativa e passiva pedem a confirmação do jogador. */
export function podeCopiar(derived, { tipo, elegivel = false }) {
  if (!imitacaoDisponivel(derived)) return { ok: false, motivo: "Imitação Indisponível" };
  if (!derived?.combate?.ativo) return { ok: false, motivo: "Pede Em Combate" };
  if (!tiposDaImitacao(derived).some((t) => t.id === tipo)) return { ok: false, motivo: "Tipo Fora da Imitação" };
  if (pedeElegibilidade(tipo) && !elegivel) return { ok: false, motivo: "Confirme o Tipo e o Gasto de PE" };
  return { ok: true };
}

/* ---------------- as operações sobre a sessão ---------------- */
/** Troca a cópia (ou a encerra, com `null`): a transição que o painel antigo usa, inclusive a Postura copiada que entra e sai. */
export const copiarNaSessao = (sessao, copia) => aplicaPatchCombate(sessao, trocarCopiaImitacao(sessao.combate, copia));

/** Tenta aprender a cópia atual com o resultado que o JOGADOR informou. Sem cópia, sem resultado numérico ou sem a Imitação, não muda nada. */
export function aprenderNaSessao(sessao, derived, resultado) {
  const n = typeof resultado === "string" && resultado.trim() === "" ? NaN : Number(resultado);
  if (!Number.isFinite(n)) return sessao;
  const estado = estadoDaImitacao(sessao, derived);
  const novo = tentarAprenderImitacao(estado, n, derived.imitacao);
  /* O motor devolve o MESMO estado quando não há o que tentar (sem cópia, ou sem a Imitação): nada a gravar, e a sessão não ganha cópia à toa. */
  return novo === estado ? sessao : aplicaPatchCombate(sessao, { imitacao: novo });
}

/** Liga ou desliga uma escolha da cópia, até o limite que o motor define. Nada muda quando o limite já foi atingido. */
export function alternarEscolhaNaSessao(sessao, derived, id) {
  const estado = estadoDaImitacao(sessao, derived);
  if (!estado.copia) return sessao;
  const antes = derived.imitacao?.copia?.escolhas ?? [];
  const limite = derived.habilidades?.escolhas?.porHab?.[estado.copia.id]?.allowance ?? 1;
  if (!antes.includes(id) && antes.length >= limite) return sessao;
  const escolhas = antes.includes(id) ? antes.filter((o) => o !== id) : [...antes, id];
  return aplicaPatchCombate(sessao, {
    imitacao: { ...estado, copia: { ...estado.copia, escolhas }, aprendidas: estado.aprendidas.map((c) => (c.id === estado.copia.id ? { ...c, escolhas } : c)) },
  });
}

/** Esquece uma aprendida (e só ela). A cópia atual não é encerrada por isso. */
export function esquecerNaSessao(sessao, derived, id) {
  const estado = estadoDaImitacao(sessao, derived);
  if (!estado.aprendidas.some((c) => c.id === id)) return sessao;
  return aplicaPatchCombate(sessao, { imitacao: { ...estado, aprendidas: estado.aprendidas.filter((h) => h.id !== id) } });
}
