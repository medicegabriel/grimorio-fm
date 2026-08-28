import { AFTY_APTIDOES, getAptidao } from "./afty-aptidoes";
import { TIPOS_DANO } from "./afty-equipamentos";
import { comFormulasDeDano, gruposDaLinha } from "./afty-dano";

const tem = (ids, id) => Array.isArray(ids) && ids.includes(id);
const lista = (valor) => (Array.isArray(valor) ? valor : []);

const AURAS_GOLPE = new Set([
  "aura_chamativa",
  "enganacao_projetada",
  "aura_lacerante",
  "aura_macabra",
]);

export function aptidoesAuraDesabilitadas(creature, aptidoesIds) {
  if (!creature?.combate?.ativo || !tem(aptidoesIds, "concentrar_aura")) return [];
  const escolhidas = new Set(aptidoesIds);
  return [...new Set(lista(creature?.combate?.concentrarAura))]
    .filter((id) => escolhidas.has(id) && getAptidao(id)?.categoria === "aura")
    .slice(0, 1 + Math.max(0, Math.trunc(Number(creature?.aptidoes?.au) || 0)));
}

export function estadosCombateAptidoes({ aptidoesIds = [], au = 0, cl = 0 } = {}) {
  const estados = [];
  if (tem(aptidoesIds, "aura_elemental")) {
    estados.push({
      id: "auraElemental",
      label: "Aura Elemental",
      tipo: "bool",
      padrao: true,
      foraCombate: true,
    });
  }
  if (tem(aptidoesIds, "concentrar_aura")) {
    const opcoes = AFTY_APTIDOES
      .filter((a) => a.categoria === "aura" && a.id !== "concentrar_aura" && tem(aptidoesIds, a.id))
      .map((a) => ({ id: a.id, label: a.nome }));
    if (opcoes.length) {
      estados.push({
        id: "concentrarAura",
        label: "Concentrar Aura",
        tipo: "multi",
        opcoes,
        maxSelecionados: 1 + Math.max(0, Math.trunc(Number(au) || 0)),
      });
    }
  }
  if (tem(aptidoesIds, "golpe_com_aura")) {
    const opcoes = aptidoesIds
      .filter((id) => AURAS_GOLPE.has(id))
      .map((id) => ({ id, label: getAptidao(id)?.nome ?? id }));
    if (opcoes.length) {
      estados.push({
        id: "golpeComAura",
        label: "Golpe com Aura",
        tipo: "opcao",
        opcoes,
        custoPE: 1,
      });
    }
  }
  if (tem(aptidoesIds, "canalizar_em_golpe")) {
    estados.push({
      id: "canalizarEmGolpe",
      label: "Canalizar em Golpe",
      tipo: "bool",
      custoPE: Math.max(0, Math.trunc(Number(cl) || 0)),
    });
  }
  if (tem(aptidoesIds, "canalizacao_maxima")) {
    estados.push({
      id: "canalizacaoMaxima",
      label: "Canalização Máxima",
      tipo: "bool",
      custoPE: 1,
      requerEstado: "canalizarEmGolpe",
    });
  }
  return estados;
}

const escolhaDano = (creature, id) => {
  const escolha = creature?.aptidaoOpcoes?.[id];
  return escolha && Object.prototype.hasOwnProperty.call(TIPOS_DANO, escolha) ? escolha : null;
};

export function aplicarAptidoesNoDano(dano, creature, combate, ctx = {}) {
  const aptidoesIds = ctx.aptidoesIds ?? [];
  const au = Math.max(0, Math.trunc(Number(ctx.au) || 0));
  const cl = Math.max(0, Math.trunc(Number(ctx.cl) || 0));
  const tipoAura = escolhaDano(creature, "aura_elemental");
  const tipoAfinidade = escolhaDano(creature, "afinidade_ampliada");
  const concentradas = lista(combate?.concentrarAura);
  const desabilitadas = new Set(concentradas);
  const auraAtiva = tem(aptidoesIds, "aura_elemental")
    && !desabilitadas.has("aura_elemental") && !!combate?.auraElemental && !!tipoAura;
  const golpeAuraId = desabilitadas.has("golpe_com_aura") || desabilitadas.has(combate?.golpeComAura)
    ? null
    : combate?.golpeComAura;
  const canaliza = tem(aptidoesIds, "canalizar_em_golpe") && !!combate?.canalizarEmGolpe;
  const maxima = canaliza && tem(aptidoesIds, "canalizacao_maxima") && !!combate?.canalizacaoMaxima;

  return {
    ...dano,
    entradas: lista(dano?.entradas).map((entrada) => {
      const gruposDano = [...gruposDaLinha(entrada)];
      for (const extra of lista(entrada.danoAuxiliar)) {
        gruposDano.push({
          nome: extra.nome,
          dados: extra.dados,
          faces: extra.faces,
          fixo: extra.fixo ?? 0,
          momento: extra.momento ?? "durante",
          multiplica: extra.multiplica !== false && extra.momento !== "apos",
        });
      }
      for (const extra of lista(entrada.imbuir?.escolhido?.rolagens)) {
        gruposDano.push({
          nome: entrada.imbuir.escolhido.nome || "Feitiço Sem Nome",
          dados: extra.dados,
          faces: extra.faces,
          fixo: extra.fixo ?? 0,
          momento: "apos",
          multiplica: false,
        });
      }
      const tipoDano = auraAtiva ? tipoAura : entrada.tipoDano;
      if (auraAtiva) {
        const faces = au >= 5 ? 10 : au >= 3 ? 8 : au >= 2 ? 6 : 4;
        gruposDano.push({
          nome: "Aura Elemental", dados: 1, faces, fixo: 0,
          momento: "durante", multiplica: true, tipoDano: tipoAura,
        });
      }
      if (tem(aptidoesIds, "afinidade_ampliada") && !desabilitadas.has("afinidade_ampliada")
        && tipoAfinidade && tipoDano === tipoAfinidade) {
        gruposDano.push({
          nome: "Afinidade Ampliada", dados: 0, faces: 6, fixo: 1 + au,
          momento: "durante", multiplica: true, tipoDano: tipoAfinidade,
        });
      }
      if (concentradas.length) {
        gruposDano.push({
          nome: "Concentrar Aura", dados: concentradas.length, faces: 8, fixo: 0,
          momento: "apos", multiplica: false,
        });
      }
      if (canaliza && cl > 0) {
        gruposDano.push({
          nome: maxima ? "Canalização Máxima" : "Canalizar em Golpe",
          dados: cl,
          faces: maxima ? 10 : tem(aptidoesIds, "canalizacao_avancada") ? 8 : 6,
          fixo: maxima ? au : 0,
          momento: "apos",
          multiplica: false,
        });
      }
      if (golpeAuraId === "aura_lacerante") {
        gruposDano.push({
          nome: "Aura Lacerante", dados: au, faces: au >= 5 ? 10 : au >= 3 ? 8 : 6,
          fixo: Math.trunc(Number(ctx.modTecnica) || 0), momento: "apos", multiplica: false,
        });
      }
      return comFormulasDeDano({
        ...entrada,
        gruposDano,
        tipoDano,
        tipoDanoLabel: tipoDano ? TIPOS_DANO[tipoDano] ?? tipoDano : null,
        golpeComAura: golpeAuraId ? {
          id: golpeAuraId,
          nome: getAptidao(golpeAuraId)?.nome ?? golpeAuraId,
          cd: Math.trunc(Number(ctx.cd) || 0) + au,
        } : null,
      });
    }),
  };
}
