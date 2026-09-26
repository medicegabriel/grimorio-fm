/**
 * ============================================================
 * O MONTADOR DO GOLPE ESPECIAL (Especialista em Combate, Base 4)
 * ============================================================
 * *"Quando realizar um ataque, ou arte do combate que envolva um ataque, você
 * pode o montar como um ataque especial, escolhendo entre as opções abaixo"*.
 * As onze propriedades do livro, o custo de cada uma e a conta do custo total.
 * Pedido do autor em 2026-09-23 (*"Montador completo"*).
 *
 * ⚠ MÓDULO FOLHA, zero imports: o catálogo e a conta são lidos pela sessão
 * (ficha-sessao.js, que paga) e pelo painel da Ficha, e nenhum dos dois pode
 * puxar o ciclo de afty-combate.js por aqui.
 *
 * ONDE CADA MARCA MORA, e por que são dois lugares:
 *   • Atroz, Letal, Penetrante, Desfocado e Longo viram NÚMERO na linha de dano
 *     (dado, margem, RD ignorada, acerto e alcance). Por isso são estados de
 *     bancada (`COMBATE_ESTADOS`, campo `estado` abaixo): o Motor lê
 *     `golpe_atroz` e companhia, e a marca mora em `sessao.combate`, valendo só
 *     em combate como todo estado.
 *   • Amplo, Impactante, Preciso, Sanguinário, Lento e Sacrifício não têm número
 *     na linha (alvo a mais, empurrão, vantagem, condição, ação e dano sofrido).
 *     Entram só no custo, e a marca mora em `sessao.golpeEspecial`. ⚠ NÃO são
 *     estados de bancada de propósito: `golpeImpactante` já é o estado do Golpe
 *     Impactante do Restringido, e uma linha sem número na aba Buffs seria
 *     interruptor morto.
 *
 * As marcas FICAM até a pessoa desmarcar (autor, 2026-09-23: *"Ficam marcadas
 * até desmarcar"*): o mesmo golpe costuma se repetir rodada após rodada.
 * ============================================================
 */

export const PROPRIEDADES_GOLPE = [
  // "O ataque atinge uma criatura a mais. +2PE"
  { id: "amplo", nome: "Amplo", custo: 2 },
  // "Em um acerto, o ataque causa 1 dado de dano adicional. +1PE"
  { id: "atroz", nome: "Atroz", custo: 1, estado: "golpeAtroz" },
  // "Empurra o alvo em 1,5 metros para cada 15 pontos de dano causados.
  // Fortitude reduz à metade. +1PE"
  { id: "impactante", nome: "Impactante", custo: 1 },
  // "Diminui em 1 a margem de crítico do ataque. +2PE"
  { id: "letal", nome: "Letal", custo: 2, estado: "golpeLetal" },
  // "Aumenta o alcance da arma em 1,5 metros para corpo-a-corpo ou 9 metros
  // para ataques a distância. +1PE"
  { id: "longo", nome: "Longo", custo: 1, estado: "golpeLongo" },
  // "Ignora redução a dano em um valor igual a metade do seu nível de
  // personagem. +2PE"
  { id: "penetrante", nome: "Penetrante", custo: 2, estado: "golpePenetrante" },
  // "Recebe vantagem no ataque. Após o primeiro uso na rodada, o custo aumenta
  // para 2PE. +1PE/+2PE"
  { id: "preciso", nome: "Preciso", custo: 1, custoRepetido: 2 },
  // "Uma criatura atingida sofre sangramento leve (CD de Especialização). Pode
  // ser pego uma segunda vez para causar sangramento médio ao invés de leve.
  // +2PE". Cada vez custa 2: pegar duas é pagar 4.
  { id: "sanguinario", nome: "Sanguinário", custo: 2, max: 2, niveis: ["Leve", "Médio"] },
  // "O ataque deve ser usado como ação completa. -2PE"
  { id: "lento", nome: "Lento", custo: -2 },
  // "Recebe 15 de dano ao efetuar o ataque. -1PE"
  { id: "sacrificio", nome: "Sacrifício", custo: -1, dano: 15 },
  // "O ataque recebe uma penalidade de 4 no acerto (cumulativo até três
  // vezes). -1PE". Cada vez devolve 1.
  { id: "desfocado", nome: "Desfocado", custo: -1, max: 3, estado: "golpeDesfocado" },
];

/** Quantas vezes a propriedade foi pega: 0 ou 1, ou até o `max` nas de contagem. */
export function vezesDaPropriedade(p, valor) {
  if (!p) return 0;
  if (!p.max) return valor ? 1 : 0;
  const n = Math.trunc(Number(valor) || 0);
  return Math.max(0, Math.min(p.max, n));
}

/** As marcas guardadas na sessão, pelas duas casas. Ver o cabeçalho. */
export function marcasDoGolpe(sessao) {
  const combate = sessao?.combate && typeof sessao.combate === "object" ? sessao.combate : {};
  const proprias = sessao?.golpeEspecial && typeof sessao.golpeEspecial === "object"
    ? sessao.golpeEspecial : {};
  return Object.fromEntries(PROPRIEDADES_GOLPE.map((p) => [
    p.id, vezesDaPropriedade(p, p.estado ? combate[p.estado] : proprias[p.id]),
  ]));
}

/** O que sobra de uma marca própria gravada: só os ids do catálogo, aparados. */
export function normalizaGolpeEspecial(bruto) {
  if (!bruto || typeof bruto !== "object") return {};
  const out = {};
  for (const p of PROPRIEDADES_GOLPE) {
    if (p.estado || bruto[p.id] == null) continue;
    const vezes = vezesDaPropriedade(p, bruto[p.id]);
    if (vezes) out[p.id] = p.max ? vezes : true;
  }
  return out;
}

/**
 * O custo do golpe montado. `marcas` é o mapa de `marcasDoGolpe`,
 * `precisoRepetido` diz se o Preciso já foi pago nesta rodada, e `abate` são os
 * PE temporários do Autossuficiente (0, 3 ou 6).
 *
 * *"ao terminar de montar o ataque especial, você paga o seu custo total; um
 * ataque especial deve custar no mínimo 1 ponto de energia amaldiçoada (PE)."*
 * O mínimo vale ANTES do Autossuficiente: os PE temporários pagam o golpe
 * (*"para serem usados no ataque"*), e não mudam quanto ele custa. O que sobra
 * deles se perde, porque não servem para mais nada (autor, 2026-09-23: *"Abatem
 * o custo do Golpe"*).
 */
export function custoDoGolpe(marcas = {}, { precisoRepetido = false, abate = 0 } = {}) {
  const partes = [];
  for (const p of PROPRIEDADES_GOLPE) {
    const vezes = vezesDaPropriedade(p, marcas?.[p.id]);
    if (!vezes) continue;
    const unidade = precisoRepetido && p.custoRepetido != null ? p.custoRepetido : p.custo;
    partes.push({ id: p.id, nome: p.nome, vezes, valor: unidade * vezes });
  }
  const soma = partes.reduce((total, p) => total + p.valor, 0);
  const total = Math.max(1, soma);
  const abatido = Math.min(total, Math.max(0, Math.trunc(Number(abate) || 0)));
  return {
    partes, soma, total, abatido,
    aPagar: total - abatido,
    // Golpe sem propriedade nenhuma não é golpe especial, e não se paga.
    montado: partes.length > 0,
  };
}
