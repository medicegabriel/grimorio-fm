import {
  calcularFeiticoAuxiliar, defaultAcaoMult, resolverAcaoAux,
} from "./afty-feiticos";

export const TECNICAS_COMBATE_ID = "cnj_tecnicas_de_combate";
export const COMBATE_AMALDICOADO_ID = "cnj_combate_amaldicoado";
export const IMBUIR_TECNICA_ID = "cnj_imbuir_com_tecnica";
export const ESGRIMISTA_JUJUTSU_ID = "cnj_esgrimista_jujutsu";
export const SUSTENTACAO_AVANCADA_ID = "cnj_sustentacao_avancada";
export const SUSTENTACAO_MESTRE_ID = "cnj_sustentacao_mestre";

const ESTADO_COMBATE = "combateAmaldicoado";
const ESTADO_ESGRIMISTA = "esgrimistaJujutsu";
const ESTADO_IMBUIR = "imbuirTecnica";

const lista = (v) => (Array.isArray(v) ? v : []);
const tem = (habilidades, id) => lista(habilidades).includes(id);

export function resolveTecnicasCombate(creature, armasCatalogo = [], habilidades = []) {
  const ativa = tem(habilidades, TECNICAS_COMBATE_ID);
  const validas = new Set(lista(armasCatalogo).map((a) => a?.id).filter(Boolean));
  const brutas = lista(creature?.tecnicasCombate?.armas);
  const armas = [];
  for (const id of brutas) {
    if (!validas.has(id) || armas.includes(id)) continue;
    armas.push(id);
    if (armas.length === 2) break;
  }
  return {
    ativa,
    armas: ativa ? armas : [],
    atributo: creature?.tecnicasCombate?.atributo === "sabedoria"
      ? "sabedoria"
      : "inteligencia",
    max: 2,
  };
}

export function feiticoPodeSerImbuido(feitico) {
  if (feitico?.tipo !== "dano") return false;
  if (feitico?.alvo === "area") return false;
  if (!["nenhum", "vampirico"].includes(feitico?.subtipo ?? "nenhum")) return false;
  return ["bonus", "comum"].includes(feitico?.acao ?? "comum");
}

function acaoPadraoAuxiliar(feitico) {
  if (feitico?.tipo !== "auxiliar") return null;
  if (feitico.multiplosAtivo) {
    return defaultAcaoMult(feitico.efeitosMult, feitico.duracaoMult || "imediata");
  }
  return resolverAcaoAux(
    feitico.efeitoAux || "defesa",
    feitico.duracaoAux || "imediata",
    "padrao",
  );
}

const auxiliarBonus = (f) => f?.tipo === "auxiliar" && acaoPadraoAuxiliar(f) === "bonus";
const auxiliarSustentado = (f) => f?.tipo === "auxiliar"
  && (f.multiplosAtivo ? f.duracaoMult : f.duracaoAux) === "sustentada";

export function estadosCombateConjurador({ habilidades, tecnicas, armas = [], feiticos = [] } = {}) {
  const estados = [];
  const armasTecnicas = new Set(tecnicas?.armas ?? []);
  const opcoesArma = lista(armas)
    .filter((a) => armasTecnicas.has(a.id))
    .map((a) => ({ id: a.id, label: a.nome }));
  if (tem(habilidades, COMBATE_AMALDICOADO_ID) && opcoesArma.length > 0) {
    estados.push({
      id: ESTADO_COMBATE,
      label: "Combate Amaldiçoado",
      tipo: "opcao",
      opcoes: opcoesArma,
      custoPE: 2,
    });
  }

  const opcoesAuxBonus = lista(feiticos)
    .filter(auxiliarBonus)
    .map((f) => ({ id: f.id, label: f.nome || "Feitiço Sem Nome" }));
  if (tem(habilidades, ESGRIMISTA_JUJUTSU_ID) && opcoesAuxBonus.length > 0) {
    estados.push({
      id: ESTADO_ESGRIMISTA,
      label: "Esgrimista Jujutsu",
      tipo: "opcao",
      opcoes: opcoesAuxBonus,
      requerEstado: ESTADO_COMBATE,
    });
  }

  const opcoesSustentadas = lista(feiticos)
    .filter(auxiliarSustentado)
    .map((f) => ({ id: f.id, label: f.nome || "Feitiço Sem Nome" }));
  const maxSustentados = tem(habilidades, SUSTENTACAO_MESTRE_ID)
    ? 3
    : tem(habilidades, SUSTENTACAO_AVANCADA_ID) ? 2 : 1;
  if (opcoesSustentadas.length > 0) {
    for (let i = 1; i <= maxSustentados; i += 1) {
      estados.push({
        id: `sustentacaoFeitico${i}`,
        label: `Sustentação ${i}`,
        tipo: "opcao",
        opcoes: opcoesSustentadas,
      });
    }
  }
  return estados;
}

export function efeitosCombateAmaldicoado(tecnicas, combate, habilidades = [], bt = 0) {
  if (!tem(habilidades, COMBATE_AMALDICOADO_ID)) return [];
  const efeitos = lista(tecnicas?.armas).map((id) => ({
    canal: "danoBonus",
    alvo: id,
    expr: String(Math.max(0, Math.trunc(Number(bt) || 0))),
    origem: COMBATE_AMALDICOADO_ID,
    nome: "Combate Amaldiçoado",
  }));
  if (combate?.ativo && lista(tecnicas?.armas).includes(combate?.[ESTADO_COMBATE])) {
    efeitos.push({
      canal: "nivelDano",
      alvo: combate[ESTADO_COMBATE],
      expr: "1",
      origem: COMBATE_AMALDICOADO_ID,
      nome: "Combate Amaldiçoado",
      duracao: "temporaria",
    });
  }
  return efeitos;
}

function idsAuxiliaresAtivos(combate, estados, feiticos) {
  if (!combate?.ativo) return [];
  const validos = new Set(lista(feiticos).map((f) => f.id));
  const ids = [];
  for (const estado of estados) {
    if (estado.id !== ESTADO_ESGRIMISTA && !estado.id.startsWith("sustentacaoFeitico")) continue;
    if (estado.requerEstado && !combate[estado.requerEstado]) continue;
    const id = combate[estado.id];
    if (validos.has(id) && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function efeitoNumerico(canal, valor, nome, alvo = null) {
  if (!Number.isFinite(Number(valor)) || Number(valor) === 0) return [];
  return [{
    canal,
    expr: String(Number(valor)),
    ...(alvo ? { alvo } : {}),
    origem: `feiticoAuxiliar:${nome}`,
    nome,
    exclusivo: "feiticoAuxiliarPassivo",
    duracao: "temporaria",
  }];
}

function efeitosDeAuxiliarResolvido(sub, config, nome) {
  if (!sub?.disponivel || sub.especial) return { efeitos: [], dados: [] };
  const valor = Number(sub.valor) || 0;
  const atributo = config?.alvoAuxAtributo || "forca";
  const resistencia = config?.alvoAuxTR || "reflexos";
  switch (sub.efeito) {
    case "defesa": return { efeitos: efeitoNumerico("defesa", valor, nome), dados: [] };
    case "rd": return { efeitos: efeitoNumerico("rdGeral", valor, nome), dados: [] };
    case "atributo": return { efeitos: efeitoNumerico("atributo", valor, nome, atributo), dados: [] };
    case "tr": return { efeitos: efeitoNumerico("bonusTR", valor, nome, resistencia), dados: [] };
    case "rolagem": return {
      efeitos: [
        ...efeitoNumerico("bonusPericia", valor, nome),
        ...efeitoNumerico("bonusTR", valor, nome),
        ...efeitoNumerico("bonusAcerto", valor, nome),
      ],
      dados: [],
    };
    case "movimento": return { efeitos: efeitoNumerico("movimento", valor, nome), dados: [] };
    case "danoDurante":
    case "danoApos": return {
      efeitos: [],
      dados: Array.isArray(sub.dado) ? [{
        nome,
        dados: sub.dado[0],
        faces: sub.dado[1],
        momento: sub.efeito === "danoApos" ? "apos" : "durante",
        multiplica: sub.efeito !== "danoApos",
      }] : [],
    };
    case "danoFixo": return { efeitos: efeitoNumerico("danoBonus", valor, nome), dados: [] };
    case "niveisDano": return { efeitos: efeitoNumerico("nivelDano", valor, nome), dados: [] };
    case "margemCritico": return { efeitos: efeitoNumerico("margemCritico", valor, nome), dados: [] };
    case "negacaoRd": return { efeitos: efeitoNumerico("ignoraRD", Math.abs(valor), nome), dados: [] };
    case "cd": return { efeitos: efeitoNumerico("cd", valor, nome), dados: [] };
    case "prejuizoRolagem": return {
      efeitos: [
        ...efeitoNumerico("bonusPericia", valor, nome),
        ...efeitoNumerico("bonusTR", valor, nome),
        ...efeitoNumerico("bonusAcerto", valor, nome),
      ],
      dados: [],
    };
    case "ataque": return { efeitos: efeitoNumerico("bonusAcerto", valor, nome), dados: [] };
    default: return { efeitos: [], dados: [] };
  }
}

export function resolveAuxiliaresAtivos(creature, combate, estados, ctx = {}) {
  const feiticos = lista(creature?.feiticos);
  const ids = idsAuxiliaresAtivos(combate, estados, feiticos);
  const efeitos = [];
  const dados = [];
  const ativos = [];
  for (const id of ids) {
    const f = feiticos.find((x) => x.id === id);
    if (!f) continue;
    const calc = calcularFeiticoAuxiliar(f, ctx);
    const nome = f.nome || "Feitiço Sem Nome";
    const subs = calc.multiplos ? calc.efeitos : [calc];
    for (const sub of subs) {
      const config = calc.multiplos
        ? lista(f.efeitosMult).find((e) => e.id === sub.id)
        : f;
      const resolvido = efeitosDeAuxiliarResolvido(sub, config, nome);
      efeitos.push(...resolvido.efeitos);
      dados.push(...resolvido.dados);
    }
    ativos.push({
      id,
      nome,
      custoPE: calc.custoPE ?? null,
      sustentacaoPE: calc.upkeepPE > 0
        ? Math.max(1, calc.upkeepPE - (tem(ctx.habilidades, SUSTENTACAO_MESTRE_ID) ? 1 : 0))
        : 0,
    });
  }
  return { ativos, efeitos, dados };
}

export function aplicarImbuicaoNoDano(dano, creature, combate, habilidades, feiticosResumo) {
  if (!tem(habilidades, IMBUIR_TECNICA_ID) || !combate?.ativo) return dano;
  const armaId = combate?.[ESTADO_COMBATE];
  if (!armaId) return dano;
  const brutos = lista(creature?.feiticos).filter(feiticoPodeSerImbuido);
  const resumos = new Map(lista(feiticosResumo).map((f) => [f.id, f]));
  const opcoes = brutos
    .map((f) => resumos.get(f.id))
    .filter(Boolean)
    .map((f) => ({ id: f.id, label: f.nome || "Feitiço Sem Nome" }));
  if (opcoes.length === 0) return dano;
  const imbuirId = creature?.combate?.[ESTADO_IMBUIR];
  const escolhidoId = opcoes.some((o) => o.id === imbuirId)
    ? imbuirId
    : null;
  const escolhido = escolhidoId ? resumos.get(escolhidoId) : null;
  return {
    ...dano,
    entradas: lista(dano?.entradas).map((entrada) => (entrada.id === armaId ? {
      ...entrada,
      imbuir: {
        estadoId: ESTADO_IMBUIR,
        opcoes,
        escolhido,
        custoAdicional: 2,
      },
    } : entrada)),
  };
}

export function dadosAuxiliaresNaLinha(entrada, dados = []) {
  if (!entrada || lista(dados).length === 0) return entrada;
  return { ...entrada, danoAuxiliar: lista(dados) };
}
