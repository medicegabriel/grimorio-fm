// Livro p.27, 31, 169 e 200. Folha: vínculos são dados da ficha.
export const MODOS_FOCO_ZENIN = [
  { value: "dano", label: "Dado de Dano" },
  { value: "cura", label: "Dado de Cura" },
  { value: "alcance", label: "Dobro do Alcance" },
  { value: "cd", label: "CD do Teste de Resistência" },
];

export function baseDoFeitico(f, lista = []) {
  const vistos = new Set();
  let atual = f;
  while (atual?.variacaoDe) {
    if (vistos.has(atual.id)) return null;
    vistos.add(atual.id);
    atual = lista.find((x) => x.id === atual.variacaoDe);
    if (!atual) return null;
  }
  return atual ?? null;
}

export function resolveBeneficiosFeiticos(creature, { caracteristicas = [], talentos = [], nd = 1, bt = 2, acesso = 1 } = {}) {
  const tem = (id) => caracteristicas.some((c) => c.id === id || c.id === `vo_${id}`);
  const lista = Array.isArray(creature?.feiticos) ? creature.feiticos : [];
  const bases = lista.filter((f) => f.id && !f.variacaoDe && !f.marcial && f.nivel !== "max" && !f.regraTecnicaMaxima);
  const marca = tem("marca_registrada");
  const familiaridade = marca && talentos.includes("tal_familiaridade_com_tecnica") && nd >= 12;
  const foco = tem("foco_no_poder");
  const focadosTotal = foco ? [1, 5, 10, 15, 20].filter((n) => nd >= n).length : 0;
  const manual = talentos.includes("tal_manual_de_tecnica") && nd >= 5;
  const principal = marca ? bases.find((f) => f.marcaRegistrada === "inicial")?.id : null;
  const adicionais = familiaridade && principal ? bases.filter((f) => f.id !== principal && f.marcaRegistrada === "adicional")
    .slice(0, Math.floor(bt / 2)).map((f) => f.id) : [];
  const focados = bases.filter((f) => MODOS_FOCO_ZENIN.some((m) => m.value === f.focoZenin)).slice(0, focadosTotal);
  const pendentesManual = manual ? bases.filter((f) => f.manualTecnica && !f.manualTecnica.aprendido
    && Number.isInteger(f.manualTecnica.acessoCriacao) && f.manualTecnica.acessoCriacao < 5
    && f.manualTecnica.acessoCriacao <= acesso && f.nivel === f.manualTecnica.acessoCriacao + 1) : [];
  const atualManual = pendentesManual[0];
  const porFeitico = {};
  for (const f of lista) {
    const base = baseDoFeitico(f, lista);
    if (!base || f.marcial) continue;
    const inicial = base.id === principal;
    const registrada = inicial || adicionais.includes(base.id);
    const sustentado = (f.tipo === "auxiliar" && f.duracaoAux === "sustentada")
      || (f.tipo === "especial" && f.especialSubtipo === "transformacao" && (!f.transfDuracao || f.transfDuracao === "sustentada"))
      || (f.tipo === "dano" && f.subtipo === "continuo" && f.continuoModo !== "concentrado");
    const sustentacaoEscolhida = registrada && inicial && familiaridade && base.familiaridadeSustentacao === true;
    const sustenta = sustentacaoEscolhida && sustentado;
    const manualAtual = base.id === atualManual?.id;
    porFeitico[f.id] = {
      baseId: base.id,
      reducao: registrada ? (inicial && familiaridade && !sustentacaoEscolhida ? 2 : 1) : 0,
      sustentacao: sustenta ? 1 : 0,
      foco: focados.find((x) => x.id === base.id)?.focoZenin ?? null,
      focoDestino: f.focoZeninDestino ?? base.focoZeninDestino ?? "",
      bt,
      manual: manualAtual,
      acesso: manualAtual && !f.variacaoDe ? Math.min(5, acesso + 1) : acesso,
      aprender: manualAtual && base.nivel <= acesso,
    };
  }
  return { marca, familiaridade, principal, adicionais, adicionaisTotal: familiaridade ? Math.floor(bt / 2) : 0,
    focadosTotal, focados: focados.map((f) => f.id), manual, acesso,
    manualId: atualManual?.id ?? null, porFeitico };
}

export const beneficioDoFeitico = (f, ctx) => f?.marcial ? null : ctx?.beneficiosOrigem?.porFeitico?.[f?.id] ?? null;
