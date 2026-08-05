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
  (e.tipo === "bool" ? false : e.tipo === "opcao" ? null : (e.min ?? 0));

/** Está ligado? Faixa conta a partir do mínimo, que é o piso dela. */
const estaLigado = (e, v) =>
  (e.tipo === "faixa" ? (v ?? 0) > (e.min ?? 0) : !!v);

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
 * @param ficha     a criatura já mesclada
 * @param combate   o estado da bancada da SESSÃO
 * @param opcoes    `{ almaAtual, buffs }`, o resto do que a Ficha injeta
 * @param atual     a ficha derivada AGORA, para não derivar duas vezes o mesmo
 */
export function deltaDosEstados(ficha, combate, opcoes = {}, atual = null) {
  const out = {};
  if (!combate?.ativo) return out;

  const base = { ...ficha, combate, buffsSessao: opcoes.buffs ?? [] };
  const comTudo = atual ?? deriveAfty(base, { almaAtual: opcoes.almaAtual });

  const ligados = COMBATE_ESTADOS.filter((e) => estaLigado(e, combate[e.id]));
  for (const e of ligados) {
    const semEle = deriveAfty(
      { ...base, combate: { ...combate, [e.id]: padraoDe(e) } },
      { almaAtual: opcoes.almaAtual },
    );
    const chips = comparar(comTudo, semEle);
    if (chips.length) out[e.id] = chips;
  }
  return out;
}

export { OBSERVADOS };
