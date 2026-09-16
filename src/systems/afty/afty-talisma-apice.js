/* ============================================================ */
/* TALISMÃ DO ÁPICE, e o Maximizar Atributo do item criado        */
/* ============================================================ */
/*
 * O item do livro: *"Ao usar o talismã, o valor de um atributo a sua escolha se
 * torna 30 durante um minuto (10 rodadas dentro de um combate) e ele se quebra."*
 * E o do guia Criação de Equipamentos: *"No custo 4 itens ativos podem maximizar
 * um atributo por 10m ou 10 rodadas."* O autor, em 2026-09-14: são a mesma regra,
 * e as duas são programadas.
 *
 * As decisões dele, na mesma data:
 *   • "Vira 30, se possuir a Habilidade Lendaria que aumenta em +2. Fica como
 *     32." O atributo sobe até o TETO DO SISTEMA daquele atributo, que é 30, ou
 *     32 onde o Aperfeiçoamento de Atributo bateu. Bônus que já somavam não
 *     passam desse teto, que é a regra de sempre.
 *   • Conta 10 rodadas e desliga sozinho.
 *   • Ligar NÃO desconta o talismã do inventário: a quantidade é à mão, como a
 *     de todo item de uso.
 *
 * ⚠ É ESTADO DE COMBATE, e por isso só vale com o combate ativo: fora dele a
 * bancada zera todo estado. O "um minuto" fora de combate fica com a mesa.
 *
 * ⚠ MÓDULO FOLHA, sem import nenhum. O derive, a sessão e o equipamento o leem.
 */

export const ESTADO_APICE = "talismaApice";
export const RODADAS_APICE = 10;
export const ITEM_TALISMA_APICE = "it_talisma_do_apice";

/** Os seis atributos, na ordem da ficha. O assert compara com `AFTY_ATTRS`. */
export const OPCOES_APICE = [
  { id: "forca", label: "Força" },
  { id: "destreza", label: "Destreza" },
  { id: "constituicao", label: "Constituição" },
  { id: "inteligencia", label: "Inteligência" },
  { id: "sabedoria", label: "Sabedoria" },
  { id: "presenca", label: "Presença" },
];

/** O estado que a aba Buffs mostra quando a ficha carrega um talismã. */
export const ESTADO_APICE_DEF = {
  id: ESTADO_APICE,
  label: "Talismã do Ápice",
  tipo: "opcao",
  opcoes: OPCOES_APICE,
};

/** O atributo que o Ápice está elevando agora, ou `null`. */
export function atributoDoApice(combate) {
  if (!combate?.ativo) return null;
  const id = combate[ESTADO_APICE];
  return OPCOES_APICE.some((o) => o.id === id) ? id : null;
}
