/* ============================================================
   PREFERÊNCIAS DA FICHA QUE MORAM NO PERSONAGEM
   ============================================================
   `creature.preferenciasFicha` é o campo próprio das preferências de apresentação da Ficha. Mora NA CRIATURA, e não no navegador nem na
   sessão, pelo mesmo motivo do tema (`aparencia`): viaja no export e no import, porque os dois copiam a criatura inteira, e sobrevive a
   editar a ficha no criador, que preserva o que não conhece. Não guarda orçamento, atributos nem combate, só apresentação.

   Hoje tem um subcampo:
     estatisticasCabecalho   { versao, ordem: [ids], ocultas: [ids] }   o que o cabeçalho mostra e em que ordem (`efeitos/estatisticas.js`)

   Módulo FOLHA e sem React: o App e a Ficha o leem, e nada daqui importa a Ficha.
   ============================================================ */
import { normalizaPreferencia } from "./efeitos/estatisticas";

const objeto = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

/** As preferências da criatura, sempre um objeto (lixo e ausência viram `{}`). */
export const preferenciasDaFicha = (ficha) => objeto(ficha?.preferenciasFicha) ?? {};

/** A preferência de estatísticas do cabeçalho já validada, ou `null` ("nunca configurou"). */
export const estatisticasDoCabecalho = (ficha) => normalizaPreferencia(preferenciasDaFicha(ficha).estatisticasCabecalho);

/**
 * As preferências com a de estatísticas trocada, preservando todos os outros subcampos. `pref` nulo apaga o subcampo ("Restaurar Padrão"), e
 * sem nenhum subcampo sobrando o campo todo vira `null`, como numa criatura que nunca configurou nada.
 */
export function comEstatisticasDoCabecalho(preferenciasFicha, pref) {
  const { estatisticasCabecalho: _antiga, ...resto } = objeto(preferenciasFicha) ?? {};
  const nova = normalizaPreferencia(pref);
  if (!nova) return Object.keys(resto).length ? resto : null;
  return { ...resto, estatisticasCabecalho: nova };
}
