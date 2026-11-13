/**
 * ÓRBITAS DO RETRATO (2026-11-10).
 *
 * Um Addon pode dizer que o retrato da Ficha Final ganha uma gema pequena
 * circulando ao redor dele para CADA entrada de uma marca (`contar("marca")`).
 * Este módulo é a régua, e só ela. O verbo vive no motor, e o pacote guarda o
 * substantivo (qual marca, até quantas gemas e qual pele).
 *
 * O campo do pacote é `orbitas: { marca, maximo, pele }`:
 *   • `marca`  a marca contada (obrigatória);
 *   • `maximo` quantas gemas cabem na volta, padrão 20, no máximo 30;
 *   • `pele`   o nome de uma pele que EXISTE aqui (a pele é código, o pacote só a
 *              escolhe, como o `pele` da corrupção).
 *
 * É só apresentação: nenhum número da ficha muda.
 *
 * ⚠ MÓDULO FOLHA: zero imports, porque o `afty-addons.js` o importa para validar a
 * pele e o derive o importa para a régua. Ver `asserts/t-ordem-modulos.mjs`.
 */

/** As peles que existem. Cada uma é um bloco de CSS em `ui/orbitas.css`. */
export const ORBITAS_PELES = ["carmim"];
export const ORBITAS_PELE_PADRAO = "carmim";
export const ORBITAS_MAXIMO_PADRAO = 20;
/** O teto duro: mais gemas que isto não cabem na volta de um retrato. */
export const ORBITAS_TETO = 30;

/**
 * O estado das órbitas de UMA ficha, a partir da configuração do pacote (ou
 * `null` quando nenhum pacote a declara) e do mapa de marcas da ficha.
 *
 * `ativo` é o portão da TELA. `contagem` é o que a ficha tem e `gemas` o que se
 * desenha (a contagem aparada no máximo).
 */
export function resolveOrbitas(config, marcas = {}) {
  if (!config || typeof config !== "object") {
    return { ativo: false, contagem: 0, gemas: 0, maximo: ORBITAS_MAXIMO_PADRAO, pele: null };
  }
  const maximoBruto = Math.trunc(Number(config.maximo));
  const maximo = Number.isFinite(maximoBruto) && maximoBruto > 0
    ? Math.min(maximoBruto, ORBITAS_TETO)
    : ORBITAS_MAXIMO_PADRAO;
  const contagem = Math.max(0, Math.trunc(Number(marcas?.[config.marca]) || 0));
  return {
    ativo: true,
    marca: config.marca,
    contagem,
    gemas: Math.min(contagem, maximo),
    maximo,
    pele: ORBITAS_PELES.includes(config.pele) ? config.pele : ORBITAS_PELE_PADRAO,
  };
}
