// CX3: escolhas situacionais usam o teste nativo e os contadores de CL1.
import { usa } from "./ficha-uso";
import { jaAplicada, comOperacao } from "./ficha-uso-estado";
import { rolarTeste, rolarDados, recalculaTesteD20 } from "./ficha-rolagem";
import { registraRolagem } from "./ficha-sessao";
import { modoCombinado } from "../afty-propriedades-armas";
import { aptidaoDeConteudoDisponivel, testeComConsequencias } from "./ficha-conteudo-acesso";
import { aplicarEfeitos, valorCanal, detalhesDoCanal } from "../afty-efeitos";
import { rolaTesteDeConcentracao } from "./ficha-concentracao";
import { melhorRolagem } from "./ficha-ataque";

const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const talento = (d, id) => d.talentos?.escolhidas?.includes(id) && !d.talentos.inacessiveis?.includes(id);
const identidade = (s, p) => typeof p.opId !== "string" || !p.opId ? recusa(s, "Sem Identidade da Operação")
  : jaAplicada(s, p.opId) ? { sessao: s, aplicado: false, repetida: true } : null;

// Sorte e Treino só mudam a identidade quando um novo dado fica no recibo.
const chaveDadoFortuna = (r, indice) => `${r.sorte?.escolha === "novo" ? "sorte" : "base"}:${r.treinoRerrolado?.novo > r.treinoRerrolado?.original ? "treino" : "normal"}:${indice}`;

export function dadosDisponiveisFortuna(sessao, derived, r) {
  const fonte = derived.conteudoPosturaFortuna;
  if (!fonte?.ativa || !sessao.combate?.ativo || !derived.combate?.ativo
    || !(fonte.apice ? sessao.combate.invencivelSobOSol : [sessao.combate.postura, sessao.combate.postura2].includes("fortuna"))
    || r?.tipo !== "teste" || r.sorte?.escolha === null || testeComConsequencias(r)
    || jaAplicada(sessao, `ataque-confirmado:${r.id}`)) return [];
  return (r.d20 ?? []).flatMap((valor, indice) => Number.isInteger(valor) && valor >= 1 && valor <= 20 && valor <= derived.maestria
    && !r.fortuna?.some((t) => t.chave === chaveDadoFortuna(r, indice)) ? [{ indice, valor }] : []);
}

/** p.76. Repete um dado, mantém o maior e usa o contador comum da rodada. */
export function rerrolaFortuna(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const original = sessao.log?.find((r) => r.id === entrada.id);
  const dado = dadosDisponiveisFortuna(sessao, derived, original).find((d) => d.indice === entrada.indice);
  const fonte = derived.conteudoPosturaFortuna;
  if (!dado || !fonte?.max) return recusa(sessao, "Dado Indisponível para Fortuna");
  const uso = usa(sessao, derived, { id: fonte.id, nome: fonte.nome, emCombate: true,
    ...(!fonte.apice ? { proibidoCom: ["Caído", "Atordoado", "Inconsciente", "Paralisado", "Indefeso"] } : {}),
    limite: { por: "rodada", max: fonte.max } }, pedido);
  if (!uso.aplicado) return uso;
  const novo = rolarDados(1, 20, entrada.rng)[0], mantido = Math.max(dado.valor, novo);
  const d20 = original.d20.map((n, i) => i === dado.indice ? mantido : n);
  const tentativa = { chave: chaveDadoFortuna(original, dado.indice), indice: dado.indice, anterior: dado.valor, novo, mantido };
  const rolagem = { ...recalculaTesteD20(original, d20), fortuna: [...(original.fortuna ?? []), tentativa],
    fontes: [...(original.fontes ?? []), { label: fonte.nome, texto: `d20 ${dado.valor}, novo ${novo}, mantido ${mantido}` }] };
  return { ...uso, rolagem, sessao: { ...uso.sessao, log: uso.sessao.log.map((r) => r.id === original.id ? rolagem : r) } };
}

// Substitui só a contribuição desta habilidade. A linha já contém o valor
// da bancada atual, e o Motor resolve o valor escolhido sem duplicar o antigo.
function parcelaDeTeste(d, id, variavel, pe, canal, alvo) {
  const propria = d.conteudoTestes?.[id];
  if (!propria) return null;
  const novo = aplicarEfeitos(propria.efeitos, { ...d.contextoDsl, [variavel]: pe });
  const atual = detalhesDoCanal(d.efeitos, canal, alvo).filter((e) => e.origem === propria.id)
    .reduce((s, e) => s + e.valor, 0);
  return { delta: valorCanal(novo, canal, alvo) - atual, valor: valorCanal(novo, canal, alvo), nome: propria.nome };
}

export function usaTesteConteudo(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const tr = ["guarda", "escudo", "resistir", "conhecimento"].includes(entrada.fonte);
  const linha = (tr ? derived.testes.resistencias : derived.testes.pericias).find((l) => (l.id ?? l.value) === entrada.id);
  if (!linha) return recusa(sessao, "Teste Indisponível");
  const treino = derived.conteudoTreinos?.pericias?.find((x) => x.alvo === entrada.id)?.progresso ?? 0;
  let desc = null, bonus = linha.bonus, margem = linha.margemCritico, vantagem = false, fontes = linha.partes ?? [];
  switch (entrada.fonte) {
    case "versatilidade": {
      const real = derived.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === "sup_versatilidade"
        && !derived.habilidades.inacessiveis?.includes(id));
      const usos = real && derived.usosHabilidades?.[real];
      if (!usos || !linha.versatilidade || linha.prof) break;
      bonus = linha.versatilidade.bonus; fontes = linha.versatilidade.partes;
      desc = { id: real, nome: "Versatilidade", custo: { pe: 1 }, usos, cobranca: entrada.descontarPE ? "confirmada" : "manual" };
      break;
    }
    case "resistir":
    case "conhecimento": {
      const resistir = entrada.fonte === "resistir", pe = Number(entrada.pe);
      if (!Number.isInteger(pe) || pe < 1 || pe > (resistir ? 2 : Math.floor(derived.maestria / 2))) break;
      if (resistir ? !["fortitude", "reflexos"].includes(entrada.id) : entrada.contraFeitico !== true) break;
      const id = resistir ? "lut_resistir" : "cnj_conhecimento_aplicado";
      const parcela = parcelaDeTeste(derived, id, resistir ? "resistir_pe" : "conhecimento_aplicado", pe, "bonusTR", entrada.id);
      if (!parcela) break;
      bonus += parcela.delta;
      desc = { id, nome: parcela.nome, custo: { pe }, cobranca: entrada.descontarPE ? "confirmada" : "manual" };
      break;
    }
    case "aura-controlada":
      if (entrada.id !== "furtividade" || !aptidaoDeConteudoDisponivel(derived, "aura_controlada") || derived.combate.concentrarAura?.includes("aura_controlada")) break;
      bonus += derived.aptidao.efetivo.au - Math.floor(derived.aptidao.efetivo.au / 2);
      desc = { id: "aura_controlada", nome: "Aura Controlada", custo: { pe: 1 }, cobranca: entrada.descontarPE ? "confirmada" : "manual" };
      break;
    case "treino":
      if (treino < 2) break;
      vantagem = true;
      desc = { id: `treino:pericia:${entrada.id}:vantagem`, nome: "Treino de Perícia",
        usos: { chave: `treino:pericia:${entrada.id}:vantagem`, max: 2 } };
      break;
    case "treino-sucesso":
      if (treino < 4 || entrada.oposto !== false) break;
      desc = { id: `treino:pericia:${entrada.id}:sucesso`, nome: "Treino de Perícia", limite: { por: "cena" } };
      break;
    case "luta":
      if (derived.conteudoTreinos?.luta < 4 || !["acrobacia", "atletismo"].includes(entrada.id)) break;
      vantagem = true;
      desc = { id: "treino:luta:vantagem", nome: "Treino de Luta", limite: { por: "rodada" } };
      break;
    case "tempestade":
      if (!talento(derived, "tal_tempestade_de_ideias") || entrada.id !== derived.conteudoTalentos?.vantagemTempestade || !["treinado", "mestre"].includes(derived.periciaProf?.[entrada.id])) break;
      vantagem = true;
      desc = { id: "tal_tempestade_de_ideias", nome: "Tempestade de Ideias",
        usos: { chave: "talento:tal_tempestade_de_ideias", max: Math.floor(derived.maestria / 2) } };
      break;
    case "guarda":
      if (!talento(derived, "tal_guarda_infalivel") || entrada.reduzDefesaOuTR !== true) break;
      bonus += 3;
      desc = { id: "tal_guarda_infalivel", nome: "Guarda Infalível" };
      break;
    case "escudo":
      if (!talento(derived, "tal_tecnicas_defensivas_de_escudo") || entrada.id !== "reflexos") break;
      margem = Math.max(2, (margem ?? 20) - 3);
      desc = { id: "tal_tecnicas_defensivas_de_escudo", nome: "Técnicas Defensivas de Escudo", acao: "reacao",
        usos: { chave: "talento:tal_tecnicas_defensivas_de_escudo", max: derived.maestria } };
      break;
    default: break;
  }
  if (!desc) return recusa(sessao, "Benefício Indisponível para este Teste");
  const r = usa(sessao, derived, desc, pedido);
  if (!r.aplicado) return r;
  const rolagem = entrada.fonte === "treino-sucesso"
    ? { id: `${pedido.opId}:sucesso`, ts: Date.now(), tipo: "info", rotulo: linha.nome, detalhe: "Sucesso Garantido", sucesso: true, periciaId: entrada.id }
    : { ...rolarTeste({ rotulo: linha.nome ?? linha.label, bonus, dados: linha.dadosExtras, margem,
      minimoNatural: linha.minimoNatural, cd: entrada.cd, modo: modoCombinado(entrada.modo, { vantagem }) }, entrada.rng),
      ...(tr ? { resistenciaId: entrada.id } : { periciaId: entrada.id }), fontes: [...fontes, { label: desc.nome, texto: vantagem ? "Vantagem" : entrada.fonte === "versatilidade" ? "Treinado" : entrada.fonte === "escudo" ? "Margem de Crítico -3" : `${bonus >= linha.bonus ? "+" : ""}${bonus - linha.bonus}` }] };
  return { ...r, sessao: registraRolagem(r.sessao, rolagem), rolagem };
}

/** p.82. Usa o teste pendente real e conserva Durabilidade e concentração de CL1/CL3. */
export function usaMentePlacida(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const pe = Number(entrada.pe);
  if (!Number.isInteger(pe) || pe < 0 || pe > 2) return recusa(sessao, "Gasto Fora do Limite");
  const parcela = parcelaDeTeste(derived, "cnj_mente_placida", "mente_placida", pe, "bonusManobra", "concentracao");
  if (!parcela) return recusa(sessao, "Mente Plácida Indisponível");
  const uso = usa(sessao, derived, { id: "cnj_mente_placida", nome: parcela.nome,
    custo: { pe }, cobranca: entrada.descontarPE ? "confirmada" : "manual" }, pedido);
  if (!uso.aplicado) return uso;
  const reducaoCd = Math.max(0, derived.mods.inteligencia, derived.mods.sabedoria);
  const r = rolaTesteDeConcentracao(uso.sessao, derived, { bonusExtra: parcela.delta, reducaoCd,
    modo: entrada.modo ?? "normal", rng: entrada.rng, opId: `${pedido.opId}:concentracao` });
  if (!r.aplicado) return recusa(sessao, r.erro);
  const rolagem = { ...r.rolagem, consequenciasAplicadas: true, fontes: [{ label: parcela.nome, texto: `CD -${reducaoCd}` },
    { label: parcela.nome, texto: `${parcela.delta >= 0 ? "+" : ""}${parcela.delta}` }] };
  return { ...r, sessao: { ...r.sessao, log: r.sessao.log.map((x) => x.id === rolagem.id ? rolagem : x) }, rolagem, custo: uso.custo };
}

/** p.68/105. Só troca um teste antes das consequências, mantendo a melhor rolagem nativa. */
export function rerrolaTesteDeClasse(sessao, derived, entrada = {}, pedido = {}, alvo = null) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const id = alvo ? "sup_conceder_outra_chance" : "cmb_indomavel", fonte = derived.conteudoRerrolagens?.[id];
  if (!fonte?.usos) return recusa(sessao, "Rerrolagem de Classe Indisponível");
  if (alvo && entrada.aliadoVisivelAte6m !== true) return recusa(sessao, "Falta Confirmar Aliado Visível a Até 6m");
  const destino = alvo?.sessao ?? sessao, dd = alvo?.derived ?? derived;
  const original = destino.log?.find((r) => r.id === entrada.id && r.tipo === "teste");
  if (!original || original.sorte?.escolha === null || testeComConsequencias(original)
    || jaAplicada(destino, `ataque-confirmado:${original.id}`) || entrada.antesConsequencias !== true) return recusa(sessao, "Teste Indisponível antes das Consequências");
  if (original.sucesso === true || (original.sucesso !== false && entrada.falhou !== true)) return recusa(sessao, "Exige Teste Falho");
  const tr = dd.testes.resistencias.find((t) => t.value === original.resistenciaId || t.label === original.rotulo);
  if (!alvo && !tr) return recusa(sessao, "Indomável Exige Teste de Resistência");
  const uso = usa(sessao, derived, { id: fonte.id, nome: fonte.nome, usos: fonte.usos,
    custo: { pe: alvo ? 3 : 1 }, cobranca: entrada.descontarPE ? "confirmada" : "manual" }, pedido);
  if (!uso.aplicado) return uso;
  const nova = rolarTeste({ rotulo: original.rotulo, detalhe: original.detalhe, bonus: original.bonus,
    dados: original.extras?.map((e) => ({ qtd: e.qtd, faces: e.faces })), modo: original.modo,
    margem: original.margemCritico, minimoNatural: original.minimoNatural, cd: original.cd, tipoTeste: original.tipoTeste }, entrada.rng);
  const { escolhida } = melhorRolagem(original, nova);
  const rolagem = { ...escolhida, id: original.id, ts: original.ts,
    ...Object.fromEntries(["periciaId", "resistenciaId", "armaId", "chaveArma", "contextoConteudo", "contextoTurno", "fontes"].filter((k) => original[k] != null).map((k) => [k, original[k]])),
    rerrolagensClasse: [...(original.rerrolagensClasse ?? []), { fonte: fonte.nome, anterior: original.total, novo: nova.total, manteveAnterior: escolhida === original }] };
  const alterada = { ...(alvo ? destino : uso.sessao), log: destino.log.map((r) => r.id === original.id ? rolagem : r) };
  return { ...uso, sessao: alvo ? uso.sessao : alterada, ...(alvo ? { sessaoAlvo: alterada } : {}), rolagem };
}

/** p.345. Repete apenas o d20 baixo e preserva os dados extras já rolados. */
export function rerrolaTreinoPericia(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const r = sessao.log?.find((r) => r.id === entrada.id && r.tipo === "teste");
  const treino = derived.conteudoTreinos?.pericias?.find((t) => t.alvo === r?.periciaId);
  if (!r || r.natural >= 5 || treino?.progresso !== 4 || r.treinoRerrolado || r.sorte?.escolha === null || testeComConsequencias(r)) return recusa(sessao, "Rerrolagem do Treino Indisponível");
  const d20 = rolarDados(1, 20, entrada.rng)[0], natural = Math.max(r.natural, d20), total = natural + r.bonus + (r.somaExtras ?? 0);
  const rolagem = { ...r, natural, total, critico: natural >= (r.margemCritico ?? 20), pifia: natural === 1,
    ...(d20 > r.natural ? { d20: [d20], descartado: null } : {}),
    sucesso: r.cd == null ? null : total >= r.cd, treinoRerrolado: { original: r.natural, novo: d20, dadosOriginais: r.d20 } };
  return { aplicado: true, rolagem, sessao: comOperacao({ ...sessao, log: sessao.log.map((x) => x.id === r.id ? rolagem : x) }, { id: pedido.opId, tipo: "treino-pericia" }) };
}

/** p.105. O teste precede a descoberta para permitir rerrolagens nativas. */
export function usaAnaliseProfunda(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const real = derived.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === "sup_analise_profunda"
    && !derived.habilidades.inacessiveis?.includes(id));
  const linha = derived.testes.pericias.find((p) => p.id === "percepcao");
  if (!real || !linha || typeof entrada.alvoId !== "string" || !entrada.alvoId || !Number.isFinite(derivedAlvo.nd)) return recusa(sessao, "Análise Indisponível");
  const uso = usa(sessao, derived, { id: `${real}:${entrada.alvoId}`, nome: "Análise Profunda", acao: "comum",
    proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"], limite: { por: "cena" },
    custo: { pe: 1 }, cobranca: entrada.descontarPE ? "confirmada" : "manual" }, pedido);
  if (!uso.aplicado) return uso;
  const rolagem = { ...rolarTeste({ rotulo: linha.nome, detalhe: "Análise Profunda", periciaId: linha.id, bonus: linha.bonus,
    dados: linha.dadosExtras, margem: linha.margemCritico, minimoNatural: linha.minimoNatural, modo: entrada.modo ?? "normal",
    cd: 15 + derivedAlvo.nd, contextoConteudo: { tipo: "analiseProfunda", operacaoId: pedido.opId, alvoId: entrada.alvoId } }, entrada.rng),
    fontes: [...(linha.partes ?? []), { label: "Análise Profunda", texto: `CD ${15 + derivedAlvo.nd}` }] };
  return { ...uso, sessao: registraRolagem(uso.sessao, rolagem), sessaoAlvo, rolagem };
}

export function concluiAnaliseProfunda(sessao, _derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const teste = sessao.log?.find((r) => r.id === entrada.id && r.tipo === "teste" && r.contextoConteudo?.tipo === "analiseProfunda");
  if (!teste || !jaAplicada(sessao, teste.contextoConteudo.operacaoId) || testeComConsequencias(teste)
    || teste.sorte?.escolha === null || !Number.isFinite(teste.cd) || !Number.isFinite(teste.total)) return recusa(sessao, "Análise Já Resolvida ou Escolha Pendente");
  const quantidade = teste.total < teste.cd ? 0 : 1 + Math.floor((teste.total - teste.cd) / 5);
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Análise Profunda", analiseId: teste.id,
    alvoId: teste.contextoConteudo.alvoId, quantidade, detalhe: `Características Descobertas: ${quantidade}`,
    fontes: [{ label: "Análise Profunda", texto: quantidade ? `Total ${teste.total}, CD ${teste.cd}` : "Falha" }] };
  const marcada = { ...sessao, log: sessao.log.map((r) => r.id === teste.id ? { ...r, consequenciasAplicadas: true } : r) };
  return { sessao: comOperacao(registraRolagem(marcada, registro), { id: pedido.opId, tipo: "analise-profunda" }), aplicado: true, quantidade };
}
