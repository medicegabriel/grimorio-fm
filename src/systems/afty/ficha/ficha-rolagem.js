/**
 * ============================================================
 * ROLAGEM — o motor de dados da Ficha Final
 * ============================================================
 * Puro e sem React, com o sorteio ENTRANDO POR PARÂMETRO: é o que deixa os
 * asserts rodarem com dado viciado, e um motor de dados que não dá para testar
 * é um motor em que ninguém confia.
 *
 * ⚠ Não há nada para parsear. O `deriveAfty` já entrega tudo estruturado, e é
 * de propósito: a linha de dano vem com `{ dados, dado, fixo, margemCritico }`,
 * a de cura com `{ dados, dado, fixo, blocos }` e todo teste com `{ bonus }`.
 * Ler "3d8+12" de volta de uma string seria desfazer trabalho já feito.
 *
 * As duas regras que o autor fechou em 2026-08-05:
 *
 *   • **CRÍTICO DOBRA OS DADOS ROLADOS.** `3d8+12` vira `6d8+12`. O valor fixo
 *     entra UMA vez, porque ele não é dado.
 *   • **VANTAGEM E DESVANTAGEM SÃO 2d20**, ficando o maior ou o menor. Os dois
 *     saem no registro, e o descartado aparece riscado.
 * ============================================================
 */

import { formulaModoDano, grupoMultiplicavel } from "../afty-dano";

let sequencia = 0;
const novoId = () => `rol_${Date.now().toString(36)}_${(sequencia += 1)}`;

export const MODOS = [
  { id: "desvantagem", label: "Desvantagem" },
  { id: "normal", label: "Normal" },
  { id: "vantagem", label: "Vantagem" },
];

/** Um dado de N faces. `rng` devolve [0, 1), igual ao `Math.random`. */
const umDado = (faces, rng) => 1 + Math.floor(rng() * Math.max(1, faces));

/** N dados de F faces, na ordem em que caíram. */
export function rolarDados(quantidade, faces, rng = Math.random) {
  const n = Math.max(0, Math.trunc(quantidade) || 0);
  return Array.from({ length: n }, () => umDado(faces, rng));
}

/**
 * Teste de d20: perícia, Teste de Resistência, Jogada de Ataque, manobra.
 *
 * `margem` é a margem de crítico DAQUELA linha (o motor já a calcula, com o piso
 * de 2 aplicado). Sem ela, crítico é só no 20 natural.
 */
export function rolarTeste({ rotulo, detalhe, bonus = 0, modo = "normal", margem = 20, cd = null }, rng = Math.random) {
  const bonusInt = Math.trunc(Number(bonus) || 0);
  const dupla = modo === "vantagem" || modo === "desvantagem";
  const d20 = rolarDados(dupla ? 2 : 1, 20, rng);
  const escolhido = !dupla ? d20[0]
    : modo === "vantagem" ? Math.max(...d20)
    : Math.min(...d20);
  // Qual dos dois foi descartado, para o painel poder riscá-lo. Com os dois
  // iguais não há descarte visível, e o índice 1 serve igual.
  const descartado = dupla ? (d20[0] === escolhido ? 1 : 0) : null;
  const total = escolhido + bonusInt;
  const cdFinal = cd == null ? null : Math.trunc(Number(cd));
  return {
    id: novoId(),
    ts: Date.now(),
    tipo: "teste",
    rotulo,
    detalhe: detalhe ?? null,
    formula: `d20${bonusInt >= 0 ? "+" : "−"}${Math.abs(bonusInt)}`,
    d20,
    descartado,
    natural: escolhido,
    bonus: bonusInt,
    total,
    cd: Number.isFinite(cdFinal) ? cdFinal : null,
    sucesso: Number.isFinite(cdFinal) ? total >= cdFinal : null,
    // ⚠ Crítico do d20 é do ACERTO, e o que ele faz é habilitar o dano dobrado.
    // Um 1 natural fica marcado também: quem lê o log quer ver a pedra.
    critico: escolhido >= Math.max(2, Math.trunc(margem) || 20),
    pifia: escolhido === 1,
    modo,
  };
}

/**
 * Rolagem de dados sem d20: dano, cura, regeneração.
 *
 * `blocos` multiplica só os DADOS, e serve à cura que escala por ponto gasto
 * (a escada de 10/15/20 vale por ponto, autor 2026-08-03, e o modificador entra
 * uma vez porque o texto diz "ao TOTAL de cura"). O crítico faz o mesmo com o
 * dobro, então os dois se compõem sem regra nova.
 */
export function rolarDano(
  {
    rotulo, detalhe, dados, faces, grupos, fixo = 0, blocos = 1,
    critico = false, modoDano = null, explosiva = false, tom = "dano",
  },
  rng = Math.random,
) {
  const fixoInt = Math.trunc(Number(fixo) || 0);
  const multBlocos = Math.max(1, Math.trunc(blocos) || 1);
  const modo = modoDano ?? (critico ? "critico" : "normal");

  /* ⚠ `grupos` existe porque a escada de dano do Afty tem degraus de DOIS dados
     diferentes: `"2d12 + 1d6"`. Sem ele, quem quisesse rolar isso teria de
     chamar duas vezes e somar de cabeça, e o log mostraria duas rolagens onde a
     regra vê uma. O caminho de UM grupo (`dados`/`faces`) continua igual, porque
     é o de quase toda linha da Ficha. */
  const bruta = Array.isArray(grupos) && grupos.length
    ? grupos
    : [{ dados, faces, fixo: fixoInt, momento: "durante", multiplica: true }];
  const lista = bruta
    .filter((g) => modo === "critico" || !g.apenasCritico)
    .map((g, indice) => ({
      ...g,
      dados: Math.max(0, Math.trunc(Number(g.dados) || 0)) * multBlocos,
      faces: Math.max(2, Math.trunc(Number(modo === "critico" && g.facesCritico ? g.facesCritico : g.faces) || 6)),
      fixo: Math.trunc(Number(g.fixo) || 0) + (Array.isArray(grupos) && indice === 0 ? fixoInt : 0),
    }));

  const rolados = [];
  let total = 0;
  for (const g of lista) {
    const multDados = modo === "critico" && grupoMultiplicavel(g) ? 2 : 1;
    const dadosGrupo = rolarDados(g.dados * multDados, g.faces, rng);
    rolados.push(...dadosGrupo);
    const subtotal = dadosGrupo.reduce((s, n) => s + n, 0) + g.fixo;
    total += modo === "raio_negro" && grupoMultiplicavel(g)
      ? 0
      : subtotal;
  }
  if (modo === "raio_negro") {
    let cursor = 0;
    let subtotal = 0;
    for (const g of lista) {
      const resultados = rolados.slice(cursor, cursor + g.dados);
      cursor += g.dados;
      if (grupoMultiplicavel(g)) subtotal += resultados.reduce((s, n) => s + n, 0) + g.fixo;
    }
    total += Math.floor(subtotal / 2) * 3;
  }
  const soma = rolados.reduce((s, n) => s + n, 0);
  const ajuste = total - soma;
  const formulaBase = formulaModoDano(lista, modo);
  return {
    id: novoId(),
    ts: Date.now(),
    tipo: "dano",
    tom,
    rotulo,
    detalhe: detalhe ?? null,
    formula: explosiva ? formulaBase.replace(/d(\d+)/g, "d$1!") : formulaBase,
    dados: rolados,
    // O `faces` do registro é o do PRIMEIRO grupo. Ele só serve ao painel para
    // rotular a rolagem, e a fórmula acima é quem conta a história inteira.
    faces: lista[0]?.faces ?? faces,
    fixo: ajuste,
    total,
    critico: modo === "critico",
    raioNegro: modo === "raio_negro",
  };
}

/** `d8` vira 8. As linhas de dano e cura guardam o dado como texto. */
export function facesDe(dado) {
  const n = Math.trunc(Number(String(dado ?? "").replace(/^d/i, "")));
  return Number.isFinite(n) && n > 1 ? n : 6;
}

/** O texto curto de uma rolagem, para o painel: `17 + 21`. */
export function textoDaRolagem(r) {
  if (r.tipo === "teste") {
    return `${r.natural} ${r.bonus >= 0 ? "+" : "−"} ${Math.abs(r.bonus)}`;
  }
  const soma = r.dados.reduce((s, n) => s + n, 0);
  return r.fixo ? `${soma} ${r.fixo > 0 ? "+" : "−"} ${Math.abs(r.fixo)}` : String(soma);
}
