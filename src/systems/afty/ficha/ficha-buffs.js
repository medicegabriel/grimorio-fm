import { deriveAfty } from "../afty-derive";
import { COMBATE_ESTADOS } from "../afty-combate";
import { sinalDe, numeroBr } from "../ui/formato";

/**
 * ============================================================
 * DELTA DOS BUFFS — o que ligar aquilo está fazendo por você
 * ============================================================
 * Uma bancada que liga interruptores sem dizer o que mudou obriga o jogador a
 * decorar a ficha antes e depois. Aqui o número aparece na própria linha.
 *
 * ⚠ O MECANISMO NÃO PEDE NADA DO MOTOR: roda o `deriveAfty` de novo com aquele
 * estado desligado e compara. É exato por construção, porque quem calcula a
 * diferença é o mesmo código que calcula a ficha, e não uma segunda
 * implementação que envelheceria à parte.
 *
 * ⚠ E É EXATO SÓ ENQUANTO AS DUAS DERIVAÇÕES RECEBEREM A MESMA ENTRADA. Mesmo
 * código com opções diferentes mente igual a código diferente, e mente pior,
 * porque parece certo: a diferença que vem da opção esquecida sai carimbada
 * como bônus do estado medido, em TODA linha ligada de uma vez. Foi assim que a
 * Guarda Inabalável virou "+5 de Defesa" da Postura da Devastação. Por isso as
 * opções chegam prontas da Ficha, num objeto só, e ninguém aqui escolhe o que
 * repassar.
 *
 * ⚠ Só os estados LIGADOS entram na conta, e isso não é economia: a pergunta
 * útil é "o que a Brutalidade está me dando AGORA", e não "o que ela daria".
 * De quebra o custo cai de um derive por linha visível para um por linha ligada,
 * que na prática são três ou quatro. O derive de uma ficha de ND 40 com tudo
 * escolhido custa 1,75ms (medido em 2026-08-05).
 * ============================================================
 */

/** Os stats que valem virar chip. Mais que isto vira poluição na linha. */
const OBSERVADOS = [
  { chave: "hp", rotulo: "PV" },
  { chave: "pvTemporario", rotulo: "PV Temp" },
  { chave: "pe", rotulo: "PE" },
  { chave: "defesa", rotulo: "Defesa" },
  { chave: "cd", rotulo: "CD" },
  { chave: "rdGeral", rotulo: "RD" },
  { chave: "movimento", rotulo: "Mov", metros: true },
  { chave: "iniciativa", rotulo: "Inic" },
  { chave: "atencao", rotulo: "Atenção" },
  { chave: "resParcial", rotulo: "Res. Parcial" },
];

/** O valor "desligado" de cada tipo de estado. */
const padraoDe = (e) =>
  (e.tipo === "bool" ? false
    : ["opcao", "dominio"].includes(e.tipo) ? null
    // ⚠ O `multi` desliga com LISTA VAZIA, e não com zero. Ele chegou em
    // 2026-08-28 com o Concentrar Aura, e um zero aqui é o mesmo que vazio só
    // porque quem lê o campo passa por `Array.isArray`. Deixar o tipo errado é
    // esperar que o próximo leitor tenha a mesma gentileza.
    : e.tipo === "multi" ? []
    : (e.min ?? 0));

/** Está ligado? Faixa conta a partir do mínimo, que é o piso dela.
 *
 * ⚠ EXPORTADO desde 2026-08-28, e é de propósito que a aba Buffs importe DAQUI
 * em vez de reimplementar: a seção "Ligados Agora" mostra exatamente as linhas
 * para as quais este arquivo calcula um delta. Duas definições de "ligado" e a
 * seção listaria uma linha sem chip, ou esconderia uma que tem. */
export const estaLigado = (e, v) =>
  (e.tipo === "faixa" ? (v ?? 0) > (e.min ?? 0)
    // `!![]` é verdadeiro, então sem esta linha um `multi` sem nada escolhido
    // pagaria um derive inteiro para descobrir que não mudou coisa nenhuma.
    : e.tipo === "multi" ? Array.isArray(v) && v.length > 0
    : !!v);

/**
 * Compara duas fichas derivadas e devolve as diferenças em formato de chip.
 * Além dos stats simples, olha a PRIMEIRA linha de dano (o Ataque Básico), que
 * é onde a maioria dos estados de combate mexe.
 */
function comparar(comEle, semEle) {
  const chips = [];
  for (const o of OBSERVADOS) {
    const d = (comEle[o.chave] ?? 0) - (semEle[o.chave] ?? 0);
    if (!d) continue;
    chips.push({ rotulo: o.rotulo, texto: o.metros ? `${d > 0 ? "+" : "−"}${numeroBr(Math.abs(d))}m` : sinalDe(d) });
  }

  const danoCom = comEle.dano?.entradas?.[0];
  const danoSem = semEle.dano?.entradas?.[0];
  if (danoCom && danoSem) {
    const dTotal = (danoCom.total ?? 0) - (danoSem.total ?? 0);
    if (dTotal) chips.push({ rotulo: "Dano", texto: sinalDe(dTotal) });
    const dAcerto = (danoCom.acerto ?? 0) - (danoSem.acerto ?? 0);
    if (dAcerto) chips.push({ rotulo: "Acerto", texto: sinalDe(dAcerto) });
    const dDados = (danoCom.dados ?? 0) - (danoSem.dados ?? 0);
    if (dDados) chips.push({ rotulo: "Dados", texto: `${sinalDe(dDados)}${danoCom.dado}` });
  }
  return chips;
}

/**
 * O delta de cada estado LIGADO, como `{ [estadoId]: [chip, ...] }`.
 *
 * ⚠ AS `opcoes` SÃO AS DA FICHA INTEIRAS, e o `buffs` é o único campo daqui que
 * não é opção do derive: ele entra NA CRIATURA, como `buffsSessao`. Todo o
 * resto é repassado ao `deriveAfty` sem ninguém escolher o que passa.
 *
 * Isso não é frescura de assinatura, é o conserto de 2026-08-28. Antes daqui só
 * saía `{ almaAtual }`, então cada derive de comparação rodava SEM a Guarda
 * Inabalável, SEM o que o mestre concedeu e SEM os três campos de Ritual — e a
 * diferença entre as duas listas de opção era creditada por inteiro ao estado
 * que estava sendo medido. Numa criatura de patamar Calamidade toda linha ligada
 * exibia "Defesa +5" (a Guarda), e a Postura da Devastação, que não dá Defesa
 * nenhuma, aparecia dando +5. Quem escolhe o que passa é a Ficha, num objeto só,
 * e a diferença cancela sozinha.
 *
 * @param ficha     a criatura já mesclada
 * @param combate   o estado da bancada da SESSÃO
 * @param opcoes    as opções do derive da Ficha, mais `buffs`
 * @param atual     a ficha derivada AGORA, para não derivar duas vezes o mesmo
 */
export function deltaDosEstados(ficha, combate, opcoes = {}, atual = null) {
  const out = {};
  if (!combate?.ativo) return out;

  const { buffs, ...opcoesDerive } = opcoes;
  const base = { ...ficha, combate, buffsSessao: buffs ?? [] };
  const comTudo = atual ?? deriveAfty(base, opcoesDerive);

  /* Os DINÂMICOS entram junto com os de catálogo. Habilidade Única, Técnica de
     Estilo, Conjurador e as Auras (2026-08-28) nascem no derive como
     `estadosExtras`, e até aqui nenhum deles ganhava chip: a bancada os
     desenhava e a linha ficava muda. O `tipo` vem antes do espalhamento pelo
     mesmo motivo da AbaBuffs, que é o extra sem tipo cair em `bool`. */
  const extras = (comTudo.combate?.estadosExtras ?? []).map((e) => ({ tipo: "bool", ...e }));
  /* Um por id: se um extra repetir um id do catálogo, vale a definição de quem
     chegou depois, que é a viva. */
  const todos = [...new Map([...COMBATE_ESTADOS, ...extras].map((e) => [e.id, e])).values()];

  const ligados = todos.filter((e) => estaLigado(e, combate[e.id]));
  for (const e of ligados) {
    const semEle = deriveAfty(
      { ...base, combate: { ...combate, [e.id]: padraoDe(e) } },
      opcoesDerive,
    );
    const chips = comparar(comTudo, semEle);
    if (chips.length) out[e.id] = chips;
  }
  return out;
}

export { OBSERVADOS };
