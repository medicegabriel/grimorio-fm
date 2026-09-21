/**
 * ============================================================
 * VOTOS NATIVOS
 * ============================================================
 *
 * Votos Contratuais são anotações sem automação e não têm limite.
 * Votos Mecânicos têm narrativa, Benefício e Malefício. Os dois lados podem
 * escrever no Motor, e a quantidade ativa é igual ao BT da ficha.
 *
 * O formato antigo `pacto`, aberto por addon, continua sendo aceito na leitura
 * para que uma ficha salva não perca texto nem efeito. Na interface, todo o
 * recurso usa somente o nome Voto.
 */

import { normalizarRegrasAfty } from "./afty-regras-addon";

let uidCounter = 0;
const novoId = (tipo) => `voto_${tipo}_${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;

export function createBlankVotoContratual() {
  return { id: novoId("contratual"), texto: "" };
}

const ladoVazio = () => ({ texto: "", efeitos: [] });

export function createBlankVotoMecanico() {
  return {
    id: novoId("mecanico"),
    nome: "",
    narrativa: "",
    beneficio: ladoVazio(),
    maleficio: ladoVazio(),
  };
}

const sanitizarEfeitos = (efeitos) => Array.isArray(efeitos)
  ? efeitos.filter((efeito) => efeito && typeof efeito === "object" && typeof efeito.canal === "string")
  : [];

const sanitizarLado = (lado) => ({
  texto: typeof lado?.texto === "string" ? lado.texto : "",
  efeitos: sanitizarEfeitos(lado?.efeitos),
});

const sanitizarContratuais = (lista) => Array.isArray(lista)
  ? lista
    .filter((voto) => voto && typeof voto === "object")
    .map((voto) => ({
      id: typeof voto.id === "string" && voto.id ? voto.id : novoId("contratual"),
      texto: typeof voto.texto === "string" ? voto.texto : "",
    }))
  : [];

const sanitizarMecanicos = (lista) => Array.isArray(lista)
  ? lista
    .filter((voto) => voto && typeof voto === "object")
    .map((voto) => {
      const regrasAfty = normalizarRegrasAfty(voto.regrasAfty);
      return {
        id: typeof voto.id === "string" && voto.id ? voto.id : novoId("mecanico"),
        nome: typeof voto.nome === "string" ? voto.nome : "",
        narrativa: typeof voto.narrativa === "string" ? voto.narrativa : "",
        beneficio: sanitizarLado(voto.beneficio),
        maleficio: sanitizarLado(voto.maleficio),
        ...(typeof voto.origemAddon === "string" && voto.origemAddon
          ? { origemAddon: voto.origemAddon }
          : {}),
        ...(Object.keys(regrasAfty).length ? { regrasAfty } : {}),
      };
    })
  : [];

const juntarLadoLegado = (lista) => ({
  texto: Array.isArray(lista)
    ? lista.map((item) => item?.texto).filter((texto) => typeof texto === "string" && texto.trim()).join("\n\n")
    : "",
  efeitos: Array.isArray(lista)
    ? lista.flatMap((item) => sanitizarEfeitos(item?.efeitos))
    : [],
});

/** Converte o formato antigo de Pacto em um Voto Mecânico. */
export function votoMecanicoDePacto(pacto, id = "voto_pacto_legado") {
  if (!pacto || typeof pacto !== "object" || Array.isArray(pacto)) return null;
  return {
    id,
    nome: typeof pacto.nome === "string" ? pacto.nome : "",
    narrativa: typeof pacto.descricao === "string" ? pacto.descricao : "",
    beneficio: juntarLadoLegado(pacto.beneficios),
    maleficio: juntarLadoLegado(pacto.maleficios),
  };
}

const pactoTemConteudo = (pacto) => !!(
  pacto
  && typeof pacto === "object"
  && !Array.isArray(pacto)
  && (
    (typeof pacto.nome === "string" && pacto.nome.trim())
    || (typeof pacto.descricao === "string" && pacto.descricao.trim())
    || (Array.isArray(pacto.beneficios) && pacto.beneficios.length)
    || (Array.isArray(pacto.maleficios) && pacto.maleficios.length)
  )
);

export function createBlankVotos() {
  return { contratuais: [], mecanicos: [] };
}

/** Normaliza os Votos na leitura, sem alterar a criatura recebida. */
function votosSalvosDaFicha(creature) {
  const votos = creature?.votos;
  if (votos && typeof votos === "object" && !Array.isArray(votos)) {
    return {
      contratuais: sanitizarContratuais(votos.contratuais),
      mecanicos: sanitizarMecanicos(votos.mecanicos),
    };
  }

  if (pactoTemConteudo(creature?.pacto)) {
    return { contratuais: [], mecanicos: [votoMecanicoDePacto(creature.pacto)] };
  }

  return createBlankVotos();
}

const votoAutomaticoDoAddon = (addon) => {
  const cru = addon?.votoAutomatico;
  const addonId = typeof addon?.id === "string" ? addon.id.trim().toLowerCase() : "";
  if (!addonId || !cru || typeof cru !== "object" || Array.isArray(cru)) return null;
  const votoId = String(cru.id ?? "voto").trim().toLowerCase() || "voto";
  return sanitizarMecanicos([{
    ...cru,
    id: `voto_addon_${addonId}_${votoId}`,
    origemAddon: addonId,
  }])[0] ?? null;
};

/** Votos obrigatórios declarados pelos Addons ativos, na ordem dos pacotes. */
export function votosAutomaticosDeAddons(creature) {
  return (Array.isArray(creature?.addons) ? creature.addons : [])
    .map(votoAutomaticoDoAddon)
    .filter(Boolean);
}

/**
 * Normaliza e põe os Votos automáticos antes dos Votos criados pelo jogador.
 * Uma cópia já gravada vence o molde, então editar o texto não é desfeito por
 * uma nova derivação. Desligar o Addon também não apaga essa cópia.
 */
export function votosDaFicha(creature) {
  const salvos = votosSalvosDaFicha(creature);
  const automaticos = votosAutomaticosDeAddons(creature);
  if (!automaticos.length) return salvos;

  const origensAutomaticas = new Set(automaticos.map((voto) => voto.origemAddon));
  const porOrigem = new Map(
    salvos.mecanicos
      .filter((voto) => origensAutomaticas.has(voto.origemAddon))
      .map((voto) => [voto.origemAddon, voto]),
  );
  return {
    contratuais: salvos.contratuais,
    mecanicos: [
      ...automaticos.map((voto) => porOrigem.get(voto.origemAddon) ?? voto),
      ...salvos.mecanicos.filter((voto) => !origensAutomaticas.has(voto.origemAddon)),
    ],
  };
}

/** Materializa os Votos automáticos no rascunho ou na ficha saneada. */
export function sincronizarVotosAutomaticos(creature) {
  return { ...creature, votos: votosDaFicha(creature) };
}

export function limiteVotosMecanicos(bt) {
  return Math.max(0, Math.trunc(Number(bt) || 0));
}

/** Regras especiais emitidas somente pelos Votos que cabem no BT atual. */
export function regrasAftyDeVotosAtivos(creature, bt) {
  const addonsAtivos = new Set(
    (Array.isArray(creature?.addons) ? creature.addons : [])
      .map((addon) => String(addon?.id ?? "").trim().toLowerCase())
      .filter(Boolean),
  );
  const out = {
    multiplicadorPeMaximo: 1,
    passivasSemCustoPeMaximo: false,
    fontesMultiplicadorPeMaximo: [],
    fontesPassivasSemCusto: [],
  };
  const votos = votosDaFicha(creature).mecanicos.slice(0, limiteVotosMecanicos(bt));
  for (const voto of votos) {
    if (voto.origemAddon && !addonsAtivos.has(voto.origemAddon)) continue;
    const regras = normalizarRegrasAfty(voto.regrasAfty);
    const fonte = { id: voto.id, nome: `Voto ${voto.nome || "sem nome"}` };
    if (regras.multiplicadorPeMaximo != null) {
      out.multiplicadorPeMaximo *= regras.multiplicadorPeMaximo;
      out.fontesMultiplicadorPeMaximo.push({ ...fonte, valor: regras.multiplicadorPeMaximo });
    }
    if (regras.passivasSemCustoPeMaximo) {
      out.passivasSemCustoPeMaximo = true;
      out.fontesPassivasSemCusto.push(fonte);
    }
  }
  return out;
}

/**
 * Efeitos dos Votos Mecânicos ativos, prontos para o Motor.
 *
 * Se o BT cair, as entradas excedentes continuam salvas, mas deixam de emitir
 * efeitos. Assim o texto não é apagado por uma alteração temporária da ficha.
 */
export function efeitosDeVotos(creature, bt) {
  const votos = votosDaFicha(creature);
  const limite = limiteVotosMecanicos(bt);
  const out = [];

  const adicionar = (voto, lado, rotuloLado) => {
    const nomeVoto = voto.nome?.trim() || voto.narrativa?.trim()?.slice(0, 40) || "Sem nome";
    for (const efeito of lado.efeitos) {
      const canal = typeof efeito?.canal === "string" ? efeito.canal : "";
      const expr = String(efeito?.expr ?? "").trim();
      if (!canal || !expr) continue;
      const efeitoMotor = {
        canal,
        expr,
        ...(efeito.alvo ? { alvo: efeito.alvo } : {}),
        origem: "voto",
        nome: `Voto ${nomeVoto} (${rotuloLado})`,
      };
      if (efeito.quando) efeitoMotor.quando = String(efeito.quando).trim();
      if (efeito.duracao === "temporaria") efeitoMotor.duracao = "temporaria";
      if (efeito.semCredito) efeitoMotor.semCredito = true;
      out.push(efeitoMotor);
    }
  };

  for (const voto of votos.mecanicos.slice(0, limite)) {
    adicionar(voto, voto.beneficio, "Benefício");
    adicionar(voto, voto.maleficio, "Malefício");
  }
  return out;
}

/**
 * Converte o primeiro molde antigo `pactoPadrao` instalado em um Voto. O addon
 * vira apenas uma biblioteca opcional, nunca o portão da aba nativa.
 */
export function votoPadraoDeAddon(creature) {
  const addons = Array.isArray(creature?.addons) ? creature.addons : [];
  for (const addon of addons) {
    if (!addon?.pactoPadrao || typeof addon.pactoPadrao !== "object" || Array.isArray(addon.pactoPadrao)) continue;
    return {
      addonId: addon.id,
      addonNome: addon.nome || addon.id,
      voto: votoMecanicoDePacto(addon.pactoPadrao, `voto_modelo_${addon.id || "addon"}`),
    };
  }
  return null;
}
