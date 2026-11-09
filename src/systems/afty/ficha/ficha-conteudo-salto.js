// Livro p.303 e 164. Distância declarada e aterrissagem sobre os verbos nativos.
import { usa } from "./ficha-uso";
import { usoDe, jaAplicada, comOperacao } from "./ficha-uso-estado";
import { defineCondicoes, registraRolagem } from "./ficha-sessao";
import { rolarTeste } from "./ficha-rolagem";
import { recursosDeEspecializacao } from "./ficha-especializacoes";
import { usaAptidaoPessoal } from "./ficha-conteudo-combate";
import { armaProximoAtaque } from "./ficha-combate-eventos";
import { aptidaoDeConteudoDisponivel, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";

const FAIXAS = [[-5, -4, 1.5], [-1, 0, 3], [1, 2, 4.5], [3, 4, 6], [5, 5, 7.5], [6, 7, 9], [8, 9, 10.5], [10, 10, 12]];
const SALTADOR = "tal_saltador_constante";
const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const guard = (s, p) => typeof p.opId !== "string" || !p.opId ? recusa(s, "Sem Identidade da Operação")
  : jaAplicada(s, p.opId) ? { sessao: s, aplicado: false, repetida: true } : null;
const habilidade = (d, id) => d.habilidades?.efetivas?.some((h) => h.replace(/^.*__/, "") === id && !d.habilidades.inacessiveis?.includes(h));
const talento = (d, id) => d.talentos?.escolhidas?.includes(id) && !d.talentos.inacessiveis?.includes(id);
const proibidoCom = ["Caído", "Imóvel", "Agarrado", "Atordoado", "Inconsciente", "Paralisado", "Indefeso"];

export function alcancePular(sessao, derived, { livre = false, estimulo = false } = {}) {
  const acrobata = habilidade(derived, "lut_acrobata");
  const atributo = acrobata ? "destreza" : "forca";
  const mod = derived.mods[atributo];
  const i = FAIXAS.findIndex(([a, b]) => mod >= a && mod <= b);
  if (i < 0) return { erro: "A Tabela de Pular Não Define a Distância para este Modificador", atributo, mod };
  const adicional = recursosDeEspecializacao(sessao, derived).saltoAdicional;
  const fisico = talento(derived, "tal_fisico_aperfeicoado") && derived.talentos?.escolhas?.mapa?.tal_fisico_aperfeicoado?.includes("tal_fisico_pulo");
  const fator = (fisico ? 1.5 : 1) * (livre ? 0.5 : 1) * (estimulo ? 2 : 1);
  const partes = [{ label: acrobata ? "Tabela de Pular, Destreza (Acrobata)" : "Tabela de Pular, Força", valor: FAIXAS[i][2] },
    ...(adicional ? [{ label: "Força Devastadora", valor: adicional }] : []),
    ...(fisico ? [{ label: "Físico Aperfeiçoado", texto: "× 1,5" }] : []),
    ...(estimulo ? [{ label: "Estímulo Muscular", texto: "× 2" }] : []),
    ...(livre ? [{ label: "Saltador Constante", texto: "× 0,5" }] : [])];
  return { comum: (FAIXAS[i][2] + adicional) * fator, superior: FAIXAS[i + 1] ? (FAIXAS[i + 1][2] + adicional) * fator : null,
    atributo, mod, pericias: acrobata ? ["atletismo", "acrobacia"] : ["atletismo"], partes };
}

const turnoAberto = (s) => s.especializacaoSessao?.turnoEncerrado == null || s.especializacaoSessao.turnoEncerrado !== s.especializacaoSessao.turno;
const atual = (s, r) => turnoAberto(s) && r.contextoPulo && r.contextoPulo.rodada === s.rodada && r.contextoPulo.turno === usoDe(s).acoes.turno
  && jaAplicada(s, r.contextoPulo.operacaoId);
export const pulosPendentes = (s) => (s.log ?? []).filter((r) => atual(s, r) && !r.consequenciasAplicadas);

export function puloLivreDisponivel(sessao, derived) {
  if (!talento(derived, SALTADOR)) return null;
  const ultimo = (sessao.log ?? []).find((r) => atual(sessao, r) && r.consequenciasAplicadas);
  return ultimo?.contextoPulo?.paredeAoFim && !ultimo.contextoPulo.livre && !jaAplicada(sessao, `pulo-livre:${ultimo.id}`) ? ultimo : null;
}

export function iniciaPulo(sessao, derived, entrada = {}, pedido = {}) {
  const erro = guard(sessao, pedido); if (erro) return erro;
  if (entrada.emSeuTurno !== true || !turnoAberto(sessao) || !["horizontal", "vertical"].includes(entrada.direcao)) return recusa(sessao, "Pular Exige Seu Turno e uma Direção");
  if (pulosPendentes(sessao).length) return recusa(sessao, "Conclua o Pulo Pendente");
  const livre = entrada.livre === true, estimulo = entrada.estimulo === true;
  const anterior = livre ? puloLivreDisponivel(sessao, derived) : null;
  if (livre && !anterior) return recusa(sessao, "Falta Pulo Concluído Junto a Parede ou Objeto");
  if (estimulo && !aptidaoDeConteudoDisponivel(derived, "estimulo_muscular")) return recusa(sessao, "Estímulo Muscular Indisponível");
  const alcance = alcancePular(sessao, derived, { livre, estimulo });
  if (alcance.erro) return recusa(sessao, alcance.erro);
  const pericia = entrada.pericia ? derived.testes.pericias.find((p) => p.id === entrada.pericia && alcance.pericias.includes(p.id)) : null;
  if (entrada.pericia && (!pericia || alcance.superior == null)) return recusa(sessao, "Teste para Faixa Superior Indisponível");
  const uso = usa(sessao, derived, { id: livre ? "pular-saltador" : "pular", origem: livre ? SALTADOR : "pular", nome: "Pular", emCombate: true,
    acesso: impedimentoParaAgirConteudo, acao: livre ? "livre" : "movimento", proibidoCom }, { ...pedido, registraAcao: true });
  if (!uso.aplicado) return uso;
  let nova = uso.sessao;
  if (estimulo) {
    const r = usaAptidaoPessoal(nova, derived, { id: "estimulo_muscular", modo: "pulo", pe: 1, descontarPE: true }, { opId: `${pedido.opId}:estimulo` });
    if (!r.aplicado) return recusa(sessao, r.erro);
    nova = r.sessao;
  }
  const registro = pericia ? { ...rolarTeste({ rotulo: "Pular", detalhe: pericia.nome, bonus: pericia.bonus, dados: pericia.dadosExtras,
    minimoNatural: pericia.minimoNatural, margem: pericia.margemCritico, cd: 15, modo: entrada.modo ?? "normal", fontes: pericia.partes }, entrada.rng),
    periciaId: pericia.id } : { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Pular" };
  const rolagem = { ...registro, contextoPulo: { operacaoId: pedido.opId, rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno,
    direcao: entrada.direcao, livre, alcance, anteriorId: anterior?.id ?? null } };
  if (anterior) nova = comOperacao(nova, { id: `pulo-livre:${anterior.id}`, tipo: "pulo-livre" });
  return { ...uso, rolagem, sessao: registraRolagem(nova, rolagem) };
}

export function resultadoPulo(rolagem) {
  const alcance = rolagem.contextoPulo.alcance;
  const caiu = rolagem.tipo === "teste" && rolagem.total < 15;
  const subiu = rolagem.tipo === "teste" && !caiu;
  return { caiu, maximo: subiu ? alcance.superior : alcance.comum, partes: [...alcance.partes,
    ...(subiu ? [{ label: "Atletismo ou Acrobacia, CD 15", texto: "Faixa Superior" }] : [])] };
}

export function concluiPulo(sessao, derived, entrada = {}, pedido = {}) {
  const erro = guard(sessao, pedido); if (erro) return erro;
  const rolagem = pulosPendentes(sessao).find((r) => r.id === entrada.puloId);
  if (!rolagem || rolagem.sorte?.escolha === null) return recusa(sessao, "Falta Pulo Pendente ou Escolha de Sorte");
  const { caiu, maximo, partes } = resultadoPulo(rolagem);
  const distancia = caiu ? maximo : entrada.distancia;
  if (!Number.isFinite(distancia) || distancia <= 0 || distancia > maximo) return recusa(sessao, "Distância Fora do Alcance do Pulo");
  const alvoId = typeof entrada.alvoId === "string" && entrada.alvoId ? entrada.alvoId : null;
  if (alvoId && !talento(derived, SALTADOR)) return recusa(sessao, "Saltador Constante Indisponível");
  const registro = { ...rolagem, consequenciasAplicadas: true, contextoPulo: { ...rolagem.contextoPulo,
    distancia, caiu, paredeAoFim: entrada.paredeAoFim === true, alvoId }, deslocamento: distancia, fontesPulo: partes };
  // O log ordena a aterrissagem após as jogadas que ocorreram durante a pendência.
  let nova = registraRolagem({ ...sessao, log: sessao.log.filter((r) => r.id !== rolagem.id) }, registro);
  if (alvoId) {
    const id = "saltador:" + registro.id;
    const armado = armaProximoAtaque(nova, { id, nome: "Saltador Constante", elegivel: { contraAlvo: alvoId, qualquer: [id] },
      consome: "declaracao", expira: "fimDoTurno" }, { opId: pedido.opId + ":saltador" });
    if (!armado.aplicado) return recusa(sessao, armado.erro);
    nova = armado.sessao;
  }
  nova = comOperacao(nova, { id: pedido.opId, tipo: "pulo-concluido" });
  if (caiu) nova = defineCondicoes(nova, [...(nova.condicoes ?? []), { id: `${pedido.opId}:caido`, nome: "Caído", rodadas: null }]);
  return { aplicado: true, sessao: nova, registro, caiu, distancia };
}
