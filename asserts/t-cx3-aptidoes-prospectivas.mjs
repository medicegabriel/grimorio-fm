import { register } from "node:module";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const U = await import(R + "ficha/ficha-uso-estado.js");
const { pagaManutencao } = await import(R + "ficha/ficha-uso.js");
const { usaExpandirAura } = await import(R + "ficha/ficha-conteudo-expandir-aura.js");
const { usaConcentrarAura } = await import(R + "ficha/ficha-conteudo-concentrar-aura.js");
const { preparaDanoRecebido, aplicaDanoRecebido } = await import(R + "ficha/ficha-dano-recebido.js");
const { registraAtaqueRealizado } = await import(R + "ficha/ficha-combate-eventos.js");
const { preparaReacaoAoDano } = await import(R + "ficha/ficha-conteudo-reacoes.js");
const { rolaSorte, escolheSorte } = await import(R + "ficha/ficha-conteudo-uso.js");
const { perdeConcentracao } = await import(R + "ficha/ficha-concentracao.js");
const A = await import(R + "ficha/ficha-cx3-absorcao-prospectiva.js");
const D = await import(R + "ficha/ficha-cx3-antidominios.js");
const P = await import(R + "ficha/ficha-cx3-punho-divergente.js");
const M = await import(R + "ficha/ficha-cx3-auras-na-mesa.js");
const G = await import(R + "ficha/ficha-cx3-aptidao-no-gatilho.js");
const V = await import(R + "ficha/ficha-cx3-morte-em-etapas.js");

let ok = 0, seq = 0;
const p = () => ({ opId: "cx3-prospectivo-" + ++seq });
const verificaPatches = process.argv.includes("--patches");
const t = (nome, atual, esperado) => { assert.deepEqual(atual, esperado, nome); ok++; };
const vivo = (d) => S.iniciaTurnoFicha(S.iniciaCombate({ ...S.sessaoEmBranco(d), rodada: 1 }, d), d);
const reload = (s, d) => S.normalizaSessao(JSON.parse(JSON.stringify(s)), d);
const origemId = "origem", alvoId = "alvo";
const turno = { id: origemId, rodada: 1, turno: 1 };
const mesa = { origemId, alvoId, turno };
const r = (tipo, extras, m = mesa) => ({ tipo, id: p().opId, estado: "pendente", origemId: m.origemId,
  turno: m.turno, afetados: [m.alvoId], ...extras });

function ficha(sistema, aptidoes, config = {}) {
  const c = createBlankAfty();
  c.rulesVersion = sistema; c.core.nd = 20; c.attrMethod = "fixos";
  c.attributes = { forca: 16, destreza: 14, constituicao: 16, inteligencia: 12, sabedoria: 14, presenca: 18 };
  c.core.origem = config.herdado ? { id: "herdado", cla: "cla_gojo" } : { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 20 }];
  c.pericias = { feiticaria: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
  c.aptidoes = { cl: 4, au: 5, dom: 3, er: 0, bar: 0, ...config.niveis };
  c.aptidoesAmaldicoadas = aptidoes;
  c.aptidaoOpcoes = { aura_elemental: "queimante" };
  if (config.treino) { c.treinamentos = { resistencia: config.treino }; c.focosLivres = 10; }
  if (config.sorte) c.talentos = ["tal_favorecido_pela_sorte"];
  return c;
}

const derivada = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs });
const inicia = (sistema, ids, config) => {
  const c = ficha(sistema, ids, config), d = deriveAfty(c);
  t(`${sistema} acesso ${ids.join(", ")}`, ids.filter((id) => !d.aptidoesEscolhidas.includes(id)), []);
  return [c, d, vivo(d)];
};

aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  {
    const [c, d, s] = inicia(sistema, ["aura_elemental", "absorcao_elemental"]);
    const parametros = { tipo: "queimante", total: 80 };
    const tipoDano = "queimante", prova = preparaDanoRecebido(d, parametros);
    const recibo = r("dano", { danos: [{ ...prova, tipo: tipoDano }, { modo: "dano", tipo: "chocante", calculo: { final: 0 } }] });
    const pedido = p(), entrada = { recibo, mesa, tipoDano };
    t("consulta filtra tipo zerado", A.tiposParaAbsorcaoProspectiva(s, d, recibo, mesa, pedido), [tipoDano]);
    t("recibo de outro alvo", A.absorveAntesDoDano(s, d, { ...entrada, mesa: { ...mesa, alvoId: "outro" } }, pedido).sessao, s);
    t("recibo de turno anterior", A.absorveAntesDoDano(s, d, { ...entrada, mesa: { ...mesa, turno: { ...turno, turno: 2 } } }, pedido).aplicado, false);
    const a = A.absorveAntesDoDano(s, d, entrada, pedido);
    t("reação arma a carga antes de tocar nos PV ou PE", [a.aplicado, a.recibo, a.sessao.hpAtual, a.sessao.peAtual,
      a.sessao.especializacaoSessao.reacoesGastas], [true, recibo, s.hpAtual, s.peAtual, 1]);
    const da = aplicaDanoRecebido(a.sessao, d, parametros, p()), db = aplicaDanoRecebido(s, d, parametros, p());
    t("dano original preservado", [da.calculo, da.sessao.hpAtual, da.sessao.vital], [db.calculo, db.sessao.hpAtual, db.sessao.vital]);
    const ar = reload(a.sessao, d);
    const grupo = (x) => derivada(c, x).dano.entradas.flatMap((l) => l.gruposDano).find((g) => g.nome === "Absorção Elemental");
    t("recarrega com grupo derivado", [grupo(ar)?.tipoDano, grupo(ar)?.dados, grupo(ar)?.faces], [tipoDano, 5, 10]);
    const gasto = registraAtaqueRealizado(ar, d, { categorias: ["desarmado"], acertou: false }, p());
    t("ataque gasta uma vez mesmo quando erra", [gasto.consumidas, grupo(gasto.sessao)], [["absorcao_elemental"], undefined]);
    t("mesmo recibo não gera outra carga", A.absorveAntesDoDano(gasto.sessao, d, entrada, p()).aplicado, false);
    const outra = { ...recibo, id: "dano-posterior", danos: [...recibo.danos, { modo: "dano", tipo: "chocante", calculo: { final: 4 } }] };
    t("tipos distintos permitem uma escolha, nunca duas cargas", A.tiposParaAbsorcaoProspectiva(s, d, outra, mesa), ["queimante", "chocante"]);
    t("carga existente recusa um novo dano", A.tiposParaAbsorcaoProspectiva(a.sessao, d, outra, mesa), []);
    if (verificaPatches) {
      const contexto = { opId: p().opId, origemId, turnoEmCurso: turno, danos: recibo.danos, absorcao: { recibo, mesa } };
      const janela = preparaReacaoAoDano(s, d, contexto, null, [recibo.id]).janelaReacao;
      const resposta = { id: "absorcao", tipo: tipoDano, chave: janela.chave };
      const integ = preparaReacaoAoDano(s, d, contexto, resposta, [recibo.id]).aplicar();
      t("janela usa uma reação e devolve só a carga", [integ.reacao.carga, integ.reacao.valor, integ.sessao.especializacaoSessao.reacoesGastas],
        [tipoDano, undefined, 1]);
      t("a mesma etapa aplica o mesmo dano após a reação", aplicaDanoRecebido(integ.sessao, d, parametros, p()).calculo, db.calculo);
      const conta = preparaDanoRecebido(d, { ...parametros, rdIgnorada: Number.MAX_SAFE_INTEGER, reducaoFixa: 10 });
      t("redução fixa depois da RD permanece se a RD é ignorada", [conta.calculo.final, conta.calculo.passos.at(-1)?.id], [70, "revestimento"]);
    }
  }
  {
    const [, d, s] = inicia(sistema, ["punho_divergente"]);
    const linha = d.dano.entradas.find((l) => l.fonte === "basico" && (l.ataqueId ?? l.categoria) === "corpo");
    const recibo = r("ataque", { acertou: true, desarmado: true, danos: [{ tipo: "im", total: 40 }] });
    const proximoTurno = { donoId: alvoId, turno: 2 };
    const entrada = { recibo, mesa, linha, proximoTurno };
    const punho = P.preparaPunhoDivergente(d, entrada);
    t("duas metades de um tipo", [punho.imediato.total, punho.guardado.total], [20, 20]);
    t("Raio Negro excluído", P.preparaPunhoDivergente(d, { ...entrada, recibo: { ...recibo, raioNegro: true } }).erro,
      "Raio Negro Impede Punho Divergente");
    t("total ímpar e misto pedem decisão", [
      P.preparaPunhoDivergente(d, { ...entrada, recibo: { ...recibo, danos: [{ tipo: "im", total: 7 }] } }).pendente,
      P.preparaPunhoDivergente(d, { ...entrada, recibo: { ...recibo, danos: [...recibo.danos, { tipo: "ct", total: 1 }] } }).pendente,
    ], ["resto", "danoMisto"]);
    const gd = P.guardaPunhoDivergente(s, punho.guardado);
    const e = { id: recibo.id, alvoId, turno: proximoTurno, rng: () => 0 };
    t("turno anterior recusa", P.rolaFortitudeDoPunho(gd.sessao, d, { ...e, turno: { ...proximoTurno, turno: 1 } }).aplicado, false);
    const tr = P.rolaFortitudeDoPunho(reload(gd.sessao, d), d, e);
    const fim = P.resolveFortitudeDoPunho(tr.sessao, d, { ...e, testeId: tr.teste.id });
    t("Fortitude falha e acrescenta vulnerabilidade", [fim.tr?.resultado, fim.calculo?.base,
      fim.calculo?.passos.some((pas) => pas.id === "vulnerabilidade")], ["falha", 20, true]);
    t("consequência só uma vez", P.resolveFortitudeDoPunho(fim.sessao, d, { ...e, testeId: tr.teste.id }).repetida, true);
    const resistente = { ...d, defesasDano: { ...d.defesasDano, porTipo: { ...d.defesasDano.porTipo, im: { estados: ["resistente"], rd: 0 } } } };
    t("conflito explícito", P.resolveFortitudeDoPunho(tr.sessao, resistente, { ...e, testeId: tr.teste.id }).codigo, "defesa-conflito");
  }
  {
    const [, d, s] = inicia(sistema, ["dominio_simples", "anular_tecnica", "revestimento_de_dominio"]);
    const recibo = r("feitico", { nivel: 1, custoBase: 7, custoEfetivo: 4, afetados: [alvoId, "terceiro"], ofensivo: true, afetaEnergia: false });
    const disputa = { feiticoId: recibo.id, origemId, alvoId, conjurador: 13, defensor: 15 };
    const e = { recibo, mesa, disputa };
    t("custos distintos aguardam política", D.tentaAnularTecnica(s, d, e).pendente, "custo");
    t("empate sem decisão", D.tentaAnularTecnica(s, d, { ...e, regraCusto: "efetivo", disputa: { ...disputa, defensor: 13 } }).pendente, "empate");
    const a = D.tentaAnularTecnica(s, d, { ...e, regraCusto: "efetivo" });
    t("reação paga custo e devolve cancelamento da área inteira", [a.sessao.peAtual, a.sessao.especializacaoSessao.reacoesGastas,
      a.cancelamento], [s.peAtual - 4, 1, { feiticoId: recibo.id, afetados: [alvoId, "terceiro"] }]);
    const semQuota = { ...s, usos: { "aptidao:anular_tecnica": 3 } };
    t("quota por descanso", D.tentaAnularTecnica(semQuota, d, { ...e, regraCusto: "efetivo" }).aplicado, false);
    const revest = D.ativaRevestimento(s, d, { acao: "reacao", recibo, mesa }, p());
    t("revestimento gasta cinco", revest.sessao.peAtual, s.peAtual - 5);
    t("efeito baixo anulado", D.efeitoContraRevestimento(revest.sessao, d, e), { anula: true, reducaoFixa: 0 });
    t("efeito alto recebe redução própria", D.efeitoContraRevestimento(revest.sessao, d, { ...e, recibo: { ...recibo, nivel: 3 } }),
      { anula: false, reducaoFixa: 20 });
    t("exceção de energia", D.efeitoContraRevestimento(revest.sessao, d, { ...e, recibo: { ...recibo, afetaEnergia: true } }),
      { anula: false, reducaoFixa: 0 });
    t("golpe suprime efeito pelo seu nível", D.efeitosSuprimidosPorGolpeRevestido(revest.sessao, d, { acertou: true, efeitos: [
      { id: "fb", tipo: "funcionamentoBasico" }, { id: "alto", tipo: "feitico", nivel: 4, duracao: "ativo" },
      { id: "baixo", tipo: "feitico", nivel: 1, duracao: "sustentado" },
    ] }), ["fb", "baixo"]);
    const virou = U.iniciaTurnoNoUso(reload(revest.sessao, d));
    t("sustentação devida no próprio início", D.efeitoContraRevestimento(virou, d, e), null);
    t("escalada em aberto bloqueia", D.sustentaRevestimento(virou, d, { inicioDoTurno: true, rodadaDaExpansao: 2 }, p()).pendente, "escalada");
    const pagou = D.sustentaRevestimento(virou, d, { inicioDoTurno: true, rodadaDaExpansao: 2, escalada: "segunda" }, p());
    t("sustentação explícita paga sete", pagou.sessao.peAtual, revest.sessao.peAtual - 7);
    const saltou = U.iniciaTurnoNoUso(virou);
    t("sustentação pulada exige nova ativação", [
      D.sustentaRevestimento(saltou, d, { inicioDoTurno: true }, p()).aplicado,
      D.ativaRevestimento(saltou, d, { acao: "bonus", emSeuTurno: true }, p()).aplicado,
    ], [false, true]);
  }
  {
    const [, d, s] = inicia(sistema, ["cobrir_se", "emocao_da_petala_decadente"], { herdado: true });
    const abertura = r("aberturaExpansao");
    const a = D.ativaPetala(s, d, { acao: "reacao", recibo: abertura, mesa }, p());
    t("abre concentração na reação", a.sessao.uso.concentracao.id, "emocao_da_petala_decadente");
    const recibo = r("acertoGarantido", { expansaoId: abertura.id, contatoFisico: true, dom: 4 });
    t("intangible passa", D.protegeComPetala(a.sessao, d, { mesa, recibo: { ...recibo, contatoFisico: false } }).aplicado, false);
    const anulou = D.protegeComPetala(a.sessao, d, { recibo, mesa });
    t("anulação identificada e custo DOM", [anulou.cancelaAcertoId, anulou.sessao.peAtual], [recibo.id, s.peAtual - 4]);
    const perdeu = perdeConcentracao(a.sessao, d, "falha", p());
    t("perder concentração tira a defesa", D.protegeComPetala(perdeu.sessao, d, { recibo, mesa }).aplicado, false);
    const linha = d.dano.entradas.find((l) => l.fonte === "basico" && (l.ataqueId ?? l.categoria) === "corpo");
    const contra = D.contraAtacaComPetala(a.sessao, d, { mesa, linha, recibo: r("alcancePetala", { gatilho: "entrou", aoAlcance: true }) });
    t("ataque livre garantido por cinco", [contra.ataque?.acertoGarantido, contra.sessao.peAtual], [true, s.peAtual - 5]);
    t("uso ofensivo impede a defesa até próprio turno", [D.protegeComPetala(contra.sessao, d, { recibo, mesa }).aplicado,
      D.protegeComPetala(U.iniciaTurnoNoUso(contra.sessao), d, { recibo, mesa }).aplicado], [false, true]);
  }
  {
    const [c, d, s] = inicia(sistema, ["expandir_aura", "concentrar_aura", "aura_do_bastiao", "aura_movedica", "aura_macabra", "aura_chamativa"]);
    const consulta = (ss, dd, id, distancia, outro = {}) => M.auraParaDestinatario(ss, dd, { id, distancia, aliado: true, ...outro });
    const exp = usaExpandirAura(s, d, { emSeuTurno: true }, p()).sessao;
    t("Bastião somente até o alcance atual", [consulta(s, d, "aura_do_bastiao", 7), consulta(exp, d, "aura_do_bastiao", 9)],
      [null, { alcance: 9, beneficios: [{ canal: "defesa", valor: 5 }] }]);
    t("Movediça nunca dobra", [consulta(exp, d, "aura_movedica", 6), consulta(exp, d, "aura_movedica", 7)], [{ alcance: 6 }, null]);
    const conc = usaConcentrarAura(exp, d, { auras: ["aura_do_bastiao"], emSeuTurno: true }, p()).sessao;
    t("suspensão impede a concessão", consulta(conc, derivada(c, conc), "aura_do_bastiao", 1), null);
    const devida = U.avancaUsoNaRodada(U.avancaUsoNaRodada(exp)), paga = pagaManutencao(devida, d, "expandir_aura", p());
    t("duas rodadas devidas suspendem alcance até CL1 resolver", [consulta(devida, d, "aura_do_bastiao", 7),
      consulta(paga.sessao, d, "aura_do_bastiao", 7)?.alcance, paga.atrasadas], [null, 9, 1]);
    const mac = M.ativaAuraDeMesa(exp, d, { id: "aura_macabra", emSeuTurno: true }, p());
    t("Macabra com duas expansões requer decisão", [mac.sessao.peAtual, consulta(mac.sessao, d, "aura_macabra", 2, { agressivo: true })],
      [exp.peAtual - 1, { pendente: "alcanceMacabra" }]);
    const m = { ...mesa, turno: { ...turno, id: alvoId } };
    const recibo = r("inicioTurnoAura", {}, m);
    const e = { id: "aura_chamativa", recibo, mesa: m, posicao: { distancia: 8, aliado: false }, imune: false };
    const gatilho = M.preparaTrDaAura({ sessao: exp, derived: d }, s, e);
    const mal = M.aplicaTrDaAura({ sessao: exp, derived: d }, s, d, { ...e,
      teste: { gatilhoId: gatilho.id, bonusDaAura: 0, resistenciaId: "vontade", total: 1 } });
    t("Chamativa impõe condição e deduplica o turno", [mal.sessao.condicoes.at(-1)?.nome,
      M.preparaTrDaAura({ sessao: exp, derived: d }, mal.sessao, e)], ["Enfeitiçado", null]);
    const novo = U.iniciaTurnoNoUso(mal.sessao), m2 = { ...m, turno: { ...m.turno, turno: 2 } };
    const seguinte = { ...e, mesa: m2, recibo: r("inicioTurnoAura", {}, m2), posicao: { distancia: 99 } };
    const tr2 = M.preparaTrDaAura({ sessao: exp, derived: d }, novo, seguinte);
    t("novo turno permite repetir e lê +2 por falha", tr2?.bonus, 2);
    const livre = M.aplicaTrDaAura({ sessao: exp, derived: d }, novo, d, { ...seguinte,
      teste: { gatilhoId: tr2.id, bonusDaAura: 2, resistenciaId: "vontade", total: 99 } });
    t("sucesso tira só a condição da fonte", livre.sessao.condicoes.some((c) => c.nome === "Enfeitiçado"), false);
  }
  {
    const [, d, s] = inicia(sistema, ["aura_lacerante", "golpe_com_aura", "estimulo_muscular", "estimulo_muscular_avancado", "aura_anuladora",
      "aura_reforcada", "aura_impenetravel", "casulo_de_energia", "aura_do_comandante", "aura_do_comandante_evoluida"]);
    const a = G.armaGolpeComAura(s, d, { aura: "aura_lacerante", consome: "acerto" }, p());
    const recibo = r("ataque", { acertou: true, categoria: "arma" });
    const golpe = G.trDoGolpeComAura(reload(a.sessao, d), d, { recibo, mesa });
    t("Golpe paga um PE e prepara o TR e dano após ataque", [a.sessao.peAtual, golpe.cd, golpe.resistencia, golpe.dano.tipoDano, golpe.dano.multiplica],
      [s.peAtual - 1, d.cd + 5, "fortitude", "energetico", false]);
    t("Golpe exclui Feitiço", G.trDoGolpeComAura(a.sessao, d, { mesa, recibo: { ...recibo, categoria: "feitico" } }), null);
    const caso = M.ativaAuraDeMesa(s, d, { id: "casulo_de_energia", emSeuTurno: true }, p()).sessao;
    t("Casulo distingue fonte e expira", [caso.peAtual, M.defesaDoCasulo(caso, d, { tipo: "ct", origem: "mundana" }),
      M.defesaDoCasulo(caso, d, { tipo: "pf", origem: "tecnica" }),
      M.defesaDoCasulo(U.avancaUsoNaRodada(caso), d, { tipo: "ct", origem: "mundana" })],
    [s.peAtual - 6, { imune: true }, { rdAdicional: 10 }, null]);
    const ativo = M.ativaAuraDeMesa(s, d, { id: "aura_lacerante", emSeuTurno: true }, p()).sessao;
    const m = { ...mesa, turno: { ...turno, id: alvoId } };
    const e = { id: "aura_lacerante", recibo: r("inicioTurnoAura", {}, m), mesa: m, posicao: { distancia: 3 }, imune: false,
      rolaDanoLacerante: (qtd, faces) => Array(qtd).fill(faces) };
    const gatilho = M.preparaTrDaAura({ sessao: ativo, derived: d }, s, e);
    const dano = M.aplicaTrDaAura({ sessao: ativo, derived: d }, s, d, { ...e,
      teste: { gatilhoId: gatilho.id, resistenciaId: "fortitude", bonusDaAura: 0, total: 1 } });
    t("Lacerante falhou Fortitude e usa 5d10 + Técnica", [dano.aplicado, dano.dano.base], [true, 50 + d.modTecnica]);
    const c = M.ativaAuraDeMesa(s, d, { id: "aura_do_comandante", evoluida: true, emSeuTurno: true }, p()).sessao;
    const consulta = (ss) => M.auraParaDestinatario(ss, d, { id: "aura_do_comandante", distancia: 4.5, aliado: true });
    const cv = U.iniciaTurnoNoUso(c);
    const cm = M.sustentaComandante(cv, d, { inicioDoTurno: true }, p()).sessao;
    t("Comandante Evoluída usa seu turno e cobra quatro", [consulta(c).beneficios.map((b) => b.valor), consulta(cv), cm.peAtual, consulta(cm).alcance],
      [[5, 5, 2, 2], null, s.peAtual - 4, 4.5]);
    const cond = r("condicao", { condicao: { nome: "Caído" }, manobra: false, origemFisica: false });
    t("Aura Anuladora recusa manobra física", M.anulaCondicaoComAura(s, d, { mesa, recibo: { ...cond, manobra: true } }).aplicado, false);
    const anulada = M.anulaCondicaoComAura(s, d, { mesa, recibo: cond });
    t("Aura Anuladora filtra uma condição antes de a aplicar", [anulada.ignoraCondicaoId, anulada.sessao.condicoes], [cond.id, s.condicoes]);
    const movimento = r("acao", { acao: "movimento" });
    const estim = G.estimulaAcaoConfirmada(s, d, { recibo: movimento, mesa, modo: "movimento", pe: 2 });
    t("Estímulo avança o movimento e o mesmo recibo não cobra duas vezes", [estim.resultado.valor, estim.sessao.peAtual,
      G.estimulaAcaoConfirmada(estim.sessao, d, { recibo: movimento, mesa, modo: "movimento", pe: 2 }).repetida], [d.movimento * 2, s.peAtual - 2, true]);
    t("teste sem perícia física recusa", G.estimulaAcaoConfirmada(s, d, { recibo: movimento, mesa, modo: "teste", pe: 1 }).aplicado, false);
  }
  {
    const [, d, s] = inicia(sistema, [], { treino: 4, sorte: true });
    const caido = S.iniciaTurnoFicha(S.aplicaDano({ ...s, hpAtual: 5 }, 5, d), d);
    const a = V.preparaMorteEmEtapas(caido, { rng: () => 0 });
    t("rolagem de morte salva sem aplicar falhas", [a.rolagem.natural, a.sessao.vital, V.preparaMorteEmEtapas(a.sessao).repetida],
      [1, caido.vital, true]);
    const relida = reload(a.sessao, d);
    t("d20 1 pede política de falha", V.concluiMorteEmEtapas(relida, d, { rolagemId: a.rolagem.id }, p()).pendente, "d20Um");
    const fim = V.concluiMorteEmEtapas(relida, d, { rolagemId: a.rolagem.id, d20Um: "ignoraUma" }, p());
    t("d20 final aplica somente a falha que restou", [fim.falhaIgnorada, fim.sessao.vital.falhas], [true, 1]);
    t("a rolagem não reaplica a consequência", V.concluiMorteEmEtapas(fim.sessao, d, { rolagemId: a.rolagem.id }, p()).aplicado, false);
    const sorte = rolaSorte(relida, d, { id: a.rolagem.id, rng: () => 0.99 }, p());
    t("Sorte pendente adia a consequência", V.concluiMorteEmEtapas(sorte.sessao, d, { rolagemId: a.rolagem.id }, p()).aplicado, false);
    const escolhida = escolheSorte(sorte.sessao, d, { id: a.rolagem.id, escolha: "novo" }, p());
    const sucesso = V.concluiMorteEmEtapas(escolhida.sessao, d, { rolagemId: a.rolagem.id }, p());
    t("d20 escolhido por Sorte chega a CL2", [sucesso.aplicado, sucesso.natural, sucesso.sucessos, sucesso.falhaIgnorada], [true, 20, 2, undefined]);
  }
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
