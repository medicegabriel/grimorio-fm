/* O Encontro entra PRIMEIRO: ele importa o `afty-derive.js` antes de tudo, que é a porta que resolve o ciclo
   de módulos na ordem que funciona (ver asserts/t-ordem-modulos.mjs). */
import { derivarComCache } from "../usar-encontro-afty";
import {
  sessaoEmBranco, normalizaSessao, aparaSessao, aplicaDano, aplicaCura, aplicaDanoNaAlma, curaAlma, defineAlma,
  gastaPe, descansar, defineCondicoes, iniciaCombate, aplicaPatchCombate, iniciaTurnoFicha, encerraTurnoFicha,
  proximaRodada, pvTempTotal, peTempTotal, desceDuracoesDe, marcaAplicador, repassaAplicador,
} from "../../ficha/ficha-sessao";
import { encerraTurnoArmas } from "../../afty-propriedades-armas";
import { maximosRecursosNaSessao } from "../../afty-addons";

/**
 * ============================================================
 * O MOTOR DO AFTY NO ENCONTRO (etapa 3, 2026-11-17)
 * ============================================================
 * Cada verbo é o MESMO que a Ficha Final e o Encontro de hoje já chamam em
 * `ficha/ficha-sessao.js`. Nenhuma regra mora aqui: o adaptador só põe os verbos
 * na forma da interface (`motores/interface.js`), estado primeiro e derivado
 * depois.
 *
 * Os verbos das ações em grupo (Dano, Dano pela Metade, Cura, Gastar PE,
 * Recuperar PE, Descansar) vieram do `aplicarNaMesa` da Mesa do Mestre da
 * Guilda, que saiu na etapa 6b (2026-11-17). O Recuperar PE é a cópia daquele:
 * ele não passa do máximo e não corta quem já está acima. O
 * `t-encontro-unificado.mjs` guarda os seis resultados como valores literais.
 *
 * O começo e os turnos repetem o que o `redutorDeEncontro` faz em
 * `usar-encontro-afty.js`. A virada NÃO: desde a etapa 5 (2026-11-17) ela faz só o
 * que é por rodada (`descerDuracoes: false`), e as durações descem no fim do turno
 * de quem aplicou (`desceDuracoesDe`, chamado pelo redutor em todo combatente).
 * ============================================================
 */

const inteiroPositivo = (v) => Math.max(0, Math.trunc(Number(v) || 0));

/** Metade arredondada para baixo, a regra do Afty. Veio da Mesa do Mestre, que saiu na etapa 6b. */
export const metade = (valor) => Math.floor(inteiroPositivo(valor) / 2);

const nomeDaCondicao = (c) => (typeof c === "string" ? c : c?.nome ?? "");

export const motorAfty = {
  motor: "afty",
  campoDoEstado: "sessao",
  campoDoRegistro: "log",
  /* Mapas cujas entradas não dependem umas das outras: o diff desce um nível neles, e assim desfazer o uso de uma
     habilidade não depende de outra habilidade ter sido usada depois. O resto é comparado inteiro, porque um pedaço
     de `vital` ou de `uso` sozinho não faz sentido. */
  porChave: ["pvTempFontes", "peTempFontes", "usos", "combate", "treinosAtivos", "contadoresSessao", "recargas", "invocacoes"],
  /* O Desfazer relativo (autor, 2026-11-17, "Relativo nos Números"): Vida, PE, Alma e as cascas voltam pelo delta
     mesmo com mudança no meio, desde que caibam entre 0 e o máximo. */
  relativos: [["hpAtual"], ["peAtual"], ["almaAtual"], ["pvTempFontes", "*"], ["peTempFontes", "*"]],
  ignorados: ["log", "historico", "atualizadoEm"],

  estadoInicial: (_ficha, derived = null) => sessaoEmBranco(derived),
  normalizarEstado: (bruto, derived = null) => normalizaSessao(bruto, derived),
  derivar: (ficha, sessao, epoca) => (ficha && sessao ? derivarComCache({ ficha, sessao }, epoca) : null),
  aparar: (sessao, derived) => (derived ? aparaSessao(sessao, derived) : sessao),

  aplicarDano: (sessao, derived, valor, { ataqueId = null } = {}) =>
    aplicaDano(sessao, inteiroPositivo(valor), derived, { ataqueId }),
  aplicarCura: (sessao, derived, valor, { externa = false } = {}) =>
    aplicaCura(sessao, inteiroPositivo(valor), inteiroPositivo(derived?.hp), { externa }),
  gastarPe: (sessao, _derived, valor) => gastaPe(sessao, inteiroPositivo(valor)),
  recuperarPe: (sessao, derived, valor) => {
    const v = inteiroPositivo(valor);
    if (!v) return sessao;
    const teto = inteiroPositivo(derived?.pe);
    const atual = inteiroPositivo(sessao.peAtual);
    return { ...sessao, peAtual: Math.max(atual, Math.min(teto, atual + v)) };
  },
  descansar: (sessao, derived, { marioneteId = null } = {}) => descansar(sessao, derived, { marioneteId }),

  alma: (sessao, derived, { modo = "dano", valor = 0 } = {}) => {
    if (modo === "cura") return curaAlma(sessao, valor, derived);
    if (modo === "definir") return defineAlma(sessao, valor, derived);
    return aplicaDanoNaAlma(sessao, valor, derived);
  },
  condicao: (sessao, _derived, { modo = "definir", condicao = null, condicoes = [] } = {}) => {
    const atuais = Array.isArray(sessao.condicoes) ? sessao.condicoes : [];
    if (modo === "adicionar") return condicao ? defineCondicoes(sessao, [...atuais, condicao]) : sessao;
    if (modo === "remover") {
      const nome = nomeDaCondicao(condicao);
      return defineCondicoes(sessao, atuais.filter((c) => nomeDaCondicao(c) !== nome));
    }
    return defineCondicoes(sessao, condicoes);
  },

  /* O começo zera a rodada da sessão (ela contava a luta anterior) e entrega as cascas da cena, como o COMECAR. */
  iniciaCombate: (sessao, derived = null) => iniciaCombate({ ...sessao, rodada: 1 }, derived),
  encerraCombate: (sessao) => aplicaPatchCombate(sessao, { ativo: false }),
  /* O Reabrir quando o retorno exato do Encerrar não fecha (rework, etapa 2): só religa a bancada. O que o encerrar desmanchou
     (Expansão, Invencível, ações de Addon) não volta, e a Exaustão que ele cobrou fica. */
  retomaCombate: (sessao) => aplicaPatchCombate(sessao, { ativo: true }),
  iniciaTurno: (sessao, derived = null) => iniciaTurnoFicha(sessao, derived),
  encerraTurno: (sessao, derived = null) => encerraTurnoArmas(encerraTurnoFicha(sessao, derived)),
  viraRodada: (sessao, derived = null) => {
    const r = proximaRodada(sessao, derived, { preservarTurnoArmas: true, descerDuracoes: false });
    return { estado: r.sessao, expirou: r.expirou, registro: r.registro };
  },
  desceDuracoesDe: (sessao, derived = null, { vale = null } = {}) => {
    const r = desceDuracoesDe(sessao, vale, { derived });
    return { estado: r.sessao, expirou: r.expirou, registro: r.registro };
  },
  marcarAplicador: (antes, depois, opcoes = {}) => marcaAplicador(antes, depois, opcoes),
  repassarAplicador: (sessao, deId) => repassaAplicador(sessao, deId),

  /* O que o colega e a linha da iniciativa mostram: Vida, PE, Alma, condições e Efeitos. É a base do resumo que a Sala
     publica (etapa 7a), por isso só números e nomes, nunca a sessão. */
  resumo: (sessao, derived) => {
    const maximos = maximosRecursosNaSessao(derived, sessao?.combate);
    const pv = Math.trunc(Number(sessao?.hpAtual) || 0);
    const pvMax = inteiroPositivo(maximos.hp);
    return {
      pv,
      pvMax,
      pvTemp: pvTempTotal(sessao),
      pe: inteiroPositivo(sessao?.peAtual),
      peMax: inteiroPositivo(maximos.pe),
      peTemp: peTempTotal(sessao),
      alma: inteiroPositivo(sessao?.almaAtual),
      almaMax: inteiroPositivo(derived?.almaMax ?? 100),
      condicoes: (sessao?.condicoes ?? []).map(nomeDaCondicao).filter(Boolean),
      efeitos: (sessao?.buffs ?? []).map((b) => b?.nome ?? b?.origemNome ?? "").filter(Boolean),
      // A ficha sem Vida máxima (incompleta) não está caída, só vazia.
      caido: pvMax > 0 && pv <= 0,
      morto: sessao?.vital?.estado === "morto",
    };
  },

  /* O teto de cada número relativo, o MESMO que o `aparaSessao` usa. As cascas não têm teto aqui: quem limita a casca
     é o valor que ela tinha antes da operação (ver `inversoDoDelta` em operacoes.js). */
  limite: (caminho, sessao, derived) => {
    if (!derived) return null;
    const maximos = maximosRecursosNaSessao(derived, sessao?.combate);
    if (caminho.length !== 1) return null;
    if (caminho[0] === "hpAtual") return Math.max(0, maximos.hp ?? 0);
    if (caminho[0] === "peAtual") return Math.max(0, maximos.pe ?? 0);
    if (caminho[0] === "almaAtual") return Math.max(0, derived.almaMax ?? 100);
    return null;
  },
};
