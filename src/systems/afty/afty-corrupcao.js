/**
 * CORRUPÇÃO VISUAL DA FICHA (V8, 2026-11-07).
 *
 * Um Addon pode dizer que a ficha "se corrompe" conforme a CONTAGEM de uma marca
 * (`contar("marca")`): quanto mais entradas marcadas, mais a tela avermelha e mais
 * peças do site entram em glitch. Este módulo é a régua, e só ela. O verbo vive no
 * motor e o pacote guarda o substantivo (qual marca, até quantas e qual pele).
 *
 * O campo do pacote é `corrupcao: { marca, maximo, pele }`:
 *   • `marca`  a marca contada (obrigatória);
 *   • `maximo` quantas marcas levam à corrupção total, padrão 21;
 *   • `pele`   o nome de uma pele que EXISTE aqui (a pele é código, o pacote só a
 *              escolhe, como o `visual` do Espinho).
 *
 * ⚠ MÓDULO FOLHA: zero imports, porque o `afty-addons.js` o importa para validar a
 * pele e o derive o importa para a régua. Ver `asserts/t-ordem-modulos.mjs`.
 */

/** As peles que existem. Cada uma é uma folha de CSS em `ui/corrupcao.css`. */
export const CORRUPCAO_PELES = ["rubra"];
export const CORRUPCAO_PELE_PADRAO = "rubra";
export const CORRUPCAO_MAXIMO_PADRAO = 21;

/** Quantos marcos existem, de 0 (limpa) a 7 (tomada). */
export const CORRUPCAO_MARCOS = 7;

/**
 * O marco para uma fração (0 a 1) da corrupção, com o `maximo` padrão de 21
 * equivalendo aos cortes 1, 4, 7, 10, 13, 17 e 21. Para outro máximo os cortes
 * escalam na mesma proporção, e o marco 7 só vale com a corrupção cheia.
 */
const CORTES = [1, 4, 7, 10, 13, 17, 21];
export function marcoDaCorrupcao(contagem, maximo = CORRUPCAO_MAXIMO_PADRAO) {
  const n = Math.max(0, Number(contagem) || 0);
  const m = Math.max(1, Number(maximo) || CORRUPCAO_MAXIMO_PADRAO);
  if (n <= 0) return 0;
  if (n >= m) return CORRUPCAO_MARCOS;
  // Equivalente em escala de 21, para os cortes serem os mesmos de qualquer máximo.
  const equiv = (n / m) * CORRUPCAO_MAXIMO_PADRAO;
  let marco = 0;
  for (let i = 0; i < CORTES.length - 1; i++) if (equiv >= CORTES[i]) marco = i + 1;
  return marco;
}

/**
 * O estado da corrupção de UMA ficha, a partir da configuração do pacote (ou
 * `null` quando nenhum pacote a declara) e do mapa de marcas da ficha.
 *
 * `ativo` é o portão da TELA: sem pacote que declare, nada aparece. `nivel` é a
 * fração de 0 a 1 (arredondada em milésimos) que a folha de CSS lê em `--c`.
 */
export function resolveCorrupcao(config, marcas = {}) {
  if (!config || typeof config !== "object") return { ativo: false, contagem: 0, maximo: CORRUPCAO_MAXIMO_PADRAO, nivel: 0, marco: 0, pele: null };
  const maximoBruto = Math.trunc(Number(config.maximo));
  const maximo = Number.isFinite(maximoBruto) && maximoBruto > 0 ? maximoBruto : CORRUPCAO_MAXIMO_PADRAO;
  const contagem = Math.max(0, Math.trunc(Number(marcas?.[config.marca]) || 0));
  const nivel = Math.min(1, contagem / maximo);
  const pele = CORRUPCAO_PELES.includes(config.pele) ? config.pele : CORRUPCAO_PELE_PADRAO;
  return {
    ativo: true,
    marca: config.marca,
    contagem,
    maximo,
    nivel: Math.round(nivel * 1000) / 1000,
    marco: marcoDaCorrupcao(contagem, maximo),
    pele,
  };
}
