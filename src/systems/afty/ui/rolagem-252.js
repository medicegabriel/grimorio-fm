/**
 * ============================================================
 * ROLAGEM NA FICHA DE CRIATURA DA 2.5.2 (2026-11-23)
 * ============================================================
 * Nasceu de um feedback do lançamento: "para criaturas tivesse como girar o dado direto na ficha. Pra player tem,
 * mas pra criatura tem que copiar e girar em outro lugar". A ficha da 2.5.2 (`src/components/CombatantPanel.jsx`)
 * é somente-leitura, e a exceção autorizada pelo autor é de Forma 1: a prop opcional `onRolar`. O painel só diz O QUE
 * rolar (um PEDIDO), e quem rola é este módulo, com o mesmo rolador da Ficha do Afty (`ficha/ficha-rolagem.js`).
 *
 * O PEDIDO que o painel manda:
 *   { tipo: "teste", rotulo, bonus, margem? }   d20 + bonus (Perícia, Teste de Resistência, Iniciativa, Acerto)
 *   { tipo: "dano",  rotulo, notacao }           a notação da Ação, como a ficha mostra ("4d10+26")
 *
 * ⚠ A NOTAÇÃO VEM COMO TEXTO porque é o que a 2.5.2 guarda (`action.damage.roll`) e o que o botão Copiar copia. Nas
 * Criaturas Base só existem `NdN+N` e `NdN`, mas a ficha feita à mão pode somar grupos ("2d6+1d8+3") ou subtrair.
 * Texto que não é notação devolve `null`, e o botão nem aparece.
 * ============================================================
 */
import { rolarTeste, rolarDano } from "../ficha/ficha-rolagem";

/** "4d10+26" -> { grupos: [{ dados: 4, faces: 10 }], fixo: 26 }. Texto que não é notação devolve null. */
export function gruposDaNotacao(texto) {
  const limpo = String(texto ?? "").replace(/\s+/g, "").toLowerCase();
  if (!limpo || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(limpo)) return null;
  const grupos = [];
  let fixo = 0;
  for (const [, sinal, termo] of limpo.matchAll(/([+-]?)(\d*d\d+|\d+)/g)) {
    const negativo = sinal === "-";
    if (termo.includes("d")) {
      const [q, f] = termo.split("d");
      const dados = q === "" ? 1 : Number(q);
      const faces = Number(f);
      if (!(faces > 1) || !(dados > 0) || negativo) return null;
      grupos.push({ dados, faces });
    } else {
      fixo += (negativo ? -1 : 1) * Number(termo);
    }
  }
  return grupos.length ? { grupos, fixo } : null;
}

/** O pedido do painel vira uma rolagem no formato da Ficha do Afty (o mesmo `textoDaRolagem` lê). */
export function rolarPedido252(pedido, { modo = "normal" } = {}, rng = Math.random) {
  if (!pedido?.rotulo) return null;
  if (pedido.tipo === "teste") {
    return rolarTeste({ rotulo: pedido.rotulo, bonus: pedido.bonus ?? 0, modo, margem: pedido.margem ?? 20 }, rng);
  }
  if (pedido.tipo === "dano") {
    const lido = gruposDaNotacao(pedido.notacao);
    if (!lido) return null;
    return {
      ...rolarDano({ rotulo: pedido.rotulo, grupos: lido.grupos, fixo: lido.fixo, detalhe: pedido.notacao }, rng),
      formula: String(pedido.notacao).replace(/\s+/g, ""),
    };
  }
  return null;
}
