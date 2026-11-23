/**
 * A COLA DOS FEITIÇOS DE ECLESIASTES COM O DERIVE (2026-11-23)
 *
 * O `afty-derive.js` chama estas funções só quando `ehFichaEclesiastes(creature)`,
 * no mesmo padrão das outras diferenças da edição (checagem direta no derive).
 * Tudo que vem do motor compartilhado (BT, ND, CD, categorias de dano, Aptidões)
 * chega por parâmetro: este arquivo não importa o `afty-derive.js` nem nada do
 * ciclo do equipamentos.
 */
import { calcularFeiticoEcl } from "./orcamento";
import { feiticosEclDaFicha } from "./modelo";
import { linhasDoMotorEcl, estadosDosPassivosEcl } from "./motor";
import { linhaDoFeiticoEcl } from "./resumo";

/**
 * O descarte dos Feitiços antigos numa ficha de Eclesiastes. Roda DEPOIS de
 * `marcarTecnicasMarciais`, porque numa ficha sem energia ou Restringido o item
 * sem marca vira Técnica lá dentro. Fica no array: Técnica Marcial, Feitiço
 * recebido de fora (buff de aliado, `ficha-recebidos.js`) e a passiva de Olhos
 * de Agulha. O resto é o Feitiço por Nível que a pessoa criou, e sai.
 */
export function feiticosAntigosVigentesEcl(feiticos, { ehTecnicaMarcial, ehOlhosDeAgulha }) {
  if (!Array.isArray(feiticos)) return feiticos;
  const ficam = feiticos.filter((f) => ehTecnicaMarcial(f)
    || f?.variacaoDe === "recebido-externo" || String(f?.id ?? "").startsWith("rec_")
    || !!ehOlhosDeAgulha(f));
  return ficam.length === feiticos.length ? feiticos : ficam;
}

/** Cada Feitiço calculado, na ordem da ficha. */
export function calcularFeiticosEcl(creature, ctx) {
  return feiticosEclDaFicha(creature).map((f) => ({ f, calc: calcularFeiticoEcl(f, ctx) }));
}

/** Aquisições gastas: um por Feitiço, mais os aprimoramentos de Passivo. A Técnica Máxima vem da Aptidão. */
export function aquisicoesEcl(calculados) {
  return calculados.reduce((s, { calc }) => {
    const f = calc.feitico;
    if (f.natureza === "ativo" && f.tecnicaMaxima) return s;
    return s + 1 + (f.natureza === "passivo" ? f.passivo.aprimoramentos : 0);
  }, 0);
}

export { linhasDoMotorEcl, estadosDosPassivosEcl };

/** As linhas de resumo para `derived.feiticos.lista`. */
export function linhasDeResumoEcl(calculados, { cd = null, trLabel = (id) => id, tipoDanoLabel = (id) => id } = {}) {
  return calculados.map(({ calc }) => {
    const comRotulos = calc.dano ? { ...calc, dano: { ...calc.dano, trLabel: trLabel(calc.dano.tr), tipoLabel: tipoDanoLabel(calc.dano.tipo) } } : calc;
    return linhaDoFeiticoEcl(comRotulos, { cd });
  });
}
