import { AFTY_PERICIAS } from "./afty-pericias-catalogo";

// Escolhas permanentes. Custos e usos pertencem à sessão, não a este estado.
export function resolveConfiguracaoEspecializacao(creature = {}, habilidades = {}, canonicas = []) {
  creature ??= {};
  const ids = new Set(canonicas);
  const opcoes = new Set(Object.values(habilidades.escolhas?.mapa ?? {}).flat());
  const config = creature.especializacaoConfig ?? {};
  const efeitos = [];
  const add = (origem, nome, canal, alvo, expr, quando) => efeitos.push({ origem, nome, canal, alvo, expr, ...(quando ? { quando } : {}) });
  const validaPericia = (id) => AFTY_PERICIAS.some((p) => p.id === id);
  if (opcoes.has("res_dadiva_mente_afiada")) {
    const treinadas = [...new Set(config.menteAfiadaTreinadas ?? [])].filter(validaPericia).slice(0, 2);
    for (const p of treinadas) add("res_dadiva_mente_afiada", "Mente Afiada", "proficienciaPericia", p, "1");
    if (validaPericia(config.menteAfiadaMestre)) add("res_dadiva_mente_afiada", "Mente Afiada", "proficienciaPericia", config.menteAfiadaMestre, "2");
  }
  if (opcoes.has("res_dadiva_semblante_cativante") && AFTY_PERICIAS.some((p) => p.id === config.semblanteMestre && p.atributo === "presenca")) {
    add("res_dadiva_semblante_cativante", "Semblante Cativante", "proficienciaPericia", config.semblanteMestre, "2");
  }
  const totalAdrenalina = ids.has("res_restricao_definitiva") ? 8 : 4;
  const atletismo = Math.min(totalAdrenalina, Math.max(0, Math.trunc(Number(config.adrenalinaAtletismo ?? creature.combate?.adrenalinaAtletismo) || 0)));
  return { config, efeitos, totalAdrenalina, atletismo, acrobacia: totalAdrenalina - atletismo,
    forcaDevastadora: opcoes.has("res_dadiva_forca_devastadora"),
    agilidadeEximia: opcoes.has("res_dadiva_agilidade_exima"),
    menteAfiada: opcoes.has("res_dadiva_mente_afiada"), semblante: opcoes.has("res_dadiva_semblante_cativante"),
    intensificadora: ids.has("res_adrenalina_intensificadora"), imparavel: ids.has("res_forca_imparavel"),
    restrito: ids.has("res_restrito_pelos_ceus"),
    defesaAtributo: ["forca", "constituicao"].includes(config.defesaAtributo) ? config.defesaAtributo : null,
  };
}
