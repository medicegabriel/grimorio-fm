/**
 * ============================================================
 * INVOCAÇÕES NA MESA: AUXÍLIO, PREJUÍZO POR REPETIÇÃO E FORMA DE ARMA (CL3, 2026-11-01)
 * ============================================================
 * Livro p.257 (comandar), p.267 a 270 (Ações de Auxílio, Prejuízo por Múltiplos Auxílios) e o pacote "Adicionais" do
 * autor (Forma de Arma, 2026-09-30). A invocação, o catálogo dela e os números continuam sendo do `derived` do DONO
 * (`derived.invocacoes.lista`, que `invocacaoDaMesa` acha por id). Aqui moram as OPERAÇÕES de mesa que faltavam.
 *
 * COMANDAR UM AUXÍLIO (`usaAuxilioDaInvocacao`)
 *   • gasta o comando do dono (Ação Comum para uma Ação Complexa, Ação Bônus para uma Simples, p.257), o PE que a ação
 *     custa e a identidade da operação, tudo pelo contrato de uso do CL1 (`usa`), com a política de cobrança dele;
 *   • CONTA a repetição: cada auxílio depois do primeiro que a MESMA invocação faz na rodada reduz o benefício (p.268 a
 *     270). Defesa, Acerto e RD descem 1 por passo e param em zero. O Dano Adicional desce 2 níveis por passo e para em
 *     1d4. A Cura não tem prejuízo na tabela. O Shikigami de Técnica é imune. A Horda pede 1 uso a mais para cada 2
 *     membros (`escala.prejuizoExtra`, p.258);
 *   • Defesa, Acerto e RD seguem SUSTENTADOS (decisão do autor, 2026-08-31): ligam o interruptor da invocação, que agora
 *     guarda o prejuízo (`auxilios[id] = { prejuizo }`). O Dano Adicional é um DISPARO: "efetivo durante o próximo ataque da
 *     criatura afetada" (p.269). Vira um Buff de Mesa (`dadosNomeados`) na sessão de QUEM RECEBE, armado como pendência do
 *     CL1 (`armaProximoAtaque`). O ataque elegível o consome e o Buff sai junto.
 *
 * FORMA DE ARMA (`transformaEmArma`, `linhaDeFormaArma`, `reacaoDoPortadorNaForma`)
 *   • "você usa suas ações para atacar, com o tipo de dano e o dado de dano da ação complexa da invocação": a linha de ataque
 *     NASCE da linha do dono (o acerto e o fixo são DELE) com o dado e o tipo da Ação Complexa trocados;
 *   • a invocação pode ter mais de uma Ação Complexa de ataque, e o texto diz "a ação complexa". Com mais de uma, a escolha é
 *     da pessoa, e sem ela a operação devolve as opções em vez de adivinhar a primeira;
 *   • a reação do portador leva o dano completo de um ataque de alvo único que mire na Arma, ignorando as RD dele.
 *
 * ⚠ DUAS SESSÕES, UMA IDENTIDADE. Cada lado grava no anel de operações da PRÓPRIA sessão, com `${opId}:dono` e
 * `${opId}:alvo`. Repetir a chamada devolve `repetida`. Recusa devolve as duas sessões como entraram, e uma falha no lado de
 * quem recebe desfaz também o lado do dono (tudo ou nada).
 *
 * ⚠ SEM VAZAMENTO ENTRE FICHAS. A sessão de quem recebe o Dano Adicional ganha um Buff de Mesa e uma pendência, com o nome
 * da invocação como rótulo. Nada do catálogo, do derive nem da sessão do dono atravessa.
 * ============================================================
 */
import { ARMAS, propriedadesDaArma } from "../afty-equipamentos";
import { AUXILIO_SUSTENTAVEL, dadosDaNotacao, subirNiveisDano } from "../afty-invocacoes";
import { invocacaoDaMesa, estadoDaInvocacao, alternaAuxilioInvocacao, defineFormaInvocacao } from "./ficha-sessao";
import { usa } from "./ficha-uso";
import { armaProximoAtaque } from "./ficha-combate-eventos";
import { gastaAcao } from "./ficha-acoes";
import { aplicaDanoRecebido } from "./ficha-dano-recebido";
import { jaAplicada, comOperacao } from "./ficha-uso-estado";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const lista = (v) => (Array.isArray(v) ? v : []);

/**
 * O QUE CONTA COMO "USO REPETIDO". O texto (p.270) diz "para cada Ação de Auxílio após a primeira que uma Invocação realizar,
 * na mesma rodada", com o tamanho do prejuízo dado na tabela do benefício de cada ação. Leitura adotada: conta QUALQUER
 * auxílio da mesma invocação (`qualquer`). A leitura alternativa é contar só o mesmo benefício (`mesmo`). A pergunta está
 * na fila, e trocar a constante troca a regra.
 */
export const CONTAGEM_DO_PREJUIZO = "qualquer";
/** Dano Adicional: cada passo tira dois níveis, e para em 1d4 (p.269). */
export const NIVEIS_POR_PASSO_DO_DANO_ADICIONAL = 2;
export const PISO_DO_DANO_ADICIONAL = 4;

const chaveDeUsos = (invId, sub = null) => (sub ? `rodada:aux:${invId}:${sub}` : `rodada:aux:${invId}`);

const rejeita = (dono, alvo, erro, codigo, extra = {}) => ({
  ok: false, aplicado: false, dono, alvo, erro, codigo, ...extra,
});

/* ============================================================ */
/* PREJUÍZO POR MÚLTIPLOS AUXÍLIOS                               */
/* ============================================================ */
/** Quantos auxílios esta invocação já fez nesta rodada (e, se `sub`, só os desse benefício). Puro. */
export function repeticoesNaRodada(sessao, invId, sub = null) {
  const chave = CONTAGEM_DO_PREJUIZO === "mesmo" ? chaveDeUsos(invId, sub) : chaveDeUsos(invId);
  return Math.max(0, inteiro(sessao?.usos?.[chave]));
}

/** Os passos de prejuízo de um uso novo, dadas as repetições que já houve. Imune: zero. Horda: descontam os usos a mais. */
export function passosDePrejuizo(inv, acao, repeticoes) {
  if (acao?.imunePrejuizoMultiplos) return 0;
  const extra = Math.max(0, inteiro(inv?.escala?.prejuizoExtra));
  return Math.max(0, inteiro(repeticoes) - extra);
}

/** O Dano Adicional depois do prejuízo: 2 níveis por passo, sem passar abaixo de 1d4. */
export function reduzDanoAdicional(dado, passos) {
  const p = Math.max(0, inteiro(passos));
  if (!p || !dado) return dado;
  const r = subirNiveisDano(dado, -NIVEIS_POR_PASSO_DO_DANO_ADICIONAL * p).dado;
  const max = dadosDaNotacao(r).reduce((s, g) => s + g.dados * g.faces, 0);
  return max < PISO_DO_DANO_ADICIONAL ? `1d${PISO_DO_DANO_ADICIONAL}` : r;
}

/** O auxílio com o prejuízo aplicado. Puro. Devolve o valor ou o dado que vale AGORA, sem mexer em nada. */
export function auxilioComPrejuizo(inv, acao, repeticoes) {
  const passos = passosDePrejuizo(inv, acao, repeticoes);
  const sub = acao?.auxilioSub;
  const base = { sub, passos, repeticoes: Math.max(0, inteiro(repeticoes)), imune: !!acao?.imunePrejuizoMultiplos };
  if (sub === "danoAdicional") {
    const dado = reduzDanoAdicional(acao.danoAdicional?.dado, passos);
    return { ...base, dado, dadoBase: acao.danoAdicional?.dado ?? null, grupos: dadosDaNotacao(dado) };
  }
  if (sub === "cura") return { ...base, passos: 0, cura: acao.cura ?? null };
  const valorBase = inteiro(acao?.valor);
  return { ...base, valorBase, valor: Math.max(0, valorBase - passos) };
}

/* ============================================================ */
/* COMANDAR UM AUXÍLIO                                           */
/* ============================================================ */
const descritorDoComando = (inv, acao, cobranca) => ({
  id: `invocacao-auxilio:${inv.id}:${acao.id}`,
  nome: acao.nome || "Auxílio",
  origem: "invocacao",
  acao: acao.classe === "complexa" ? "comum" : "bonus",
  custo: { pe: Math.max(0, inteiro(acao.custoPE)) },
  cobranca,
});

/**
 * COMANDA o auxílio `acaoId` da invocação `invId`.
 *   dono   `{ sessao, derived }` de quem comanda
 *   alvo   `{ sessao, derived }` de QUEM RECEBE o Dano Adicional, ou `null`/ausente para o próprio dono. Defesa, Acerto e RD
 *          são interruptores do dono (o Pacote para Aliados leva o número aos outros)
 * Devolve `{ ok, aplicado, dono, alvo, auxilio, custo, evento }`, onde `auxilio` traz o benefício com o prejuízo já aplicado.
 */
export function usaAuxilioDaInvocacao({ dono, invId, acaoId, alvo = null, opId, registraAcao = false, cobranca = "manual" } = {}) {
  const sd = dono?.sessao;
  const dd = dono?.derived;
  const sa = alvo?.sessao ?? null;
  if (typeof opId !== "string" || !opId) return rejeita(sd, sa, "Sem Identidade da Operação", "sem-opid");
  const opDono = `${opId}:dono`;
  const opAlvo = `${opId}:alvo`;
  const mesmaSessao = !sa || sa === sd;
  if (jaAplicada(sd, opDono) && (mesmaSessao || jaAplicada(sa, opAlvo))) {
    return { ok: true, aplicado: false, repetida: true, dono: sd, alvo: sa };
  }
  const inv = invocacaoDaMesa(dd, invId);
  if (!inv) return rejeita(sd, sa, "Invocação Inexistente", "invocacao-inexistente");
  const acao = lista(inv.acoes).find((a) => a.id === acaoId);
  if (!acao) return rejeita(sd, sa, "Ação Inexistente", "acao-inexistente");
  if (acao.familia !== "auxilio") return rejeita(sd, sa, "Não É Uma Ação de Auxílio", "nao-auxilio");
  if (!estadoDaInvocacao(sd, invId).emCampo) return rejeita(sd, sa, "Invocação Fora de Campo", "fora-de-campo");

  /* Gravação pela metade: o lado do dono já foi aplicado (o id dele está no anel) e o de quem recebe não. Repetir a chamada
     cura, pulando o dono. A contagem da rodada já inclui este uso, então a repetição que vale é uma a menos. */
  const donoJaAplicado = jaAplicada(sd, opDono);
  const repeticoes = Math.max(0, repeticoesNaRodada(sd, invId, acao.auxilioSub) - (donoJaAplicado ? 1 : 0));
  const auxilio = { ...auxilioComPrejuizo(inv, acao, repeticoes), nome: acao.nome || "Auxílio", alvoAuxilio: acao.alvoAuxilio, classe: acao.classe };

  // O lado do dono: o comando, o PE, a identidade e a contagem da rodada.
  const r = donoJaAplicado
    ? { aplicado: true, sessao: sd, custo: null }
    : usa(sd, dd, descritorDoComando(inv, acao, cobranca), { opId: opDono, registraAcao });
  if (!r.aplicado) return { ...r, ok: false, dono: sd, alvo: sa, sessao: undefined };
  let novoDono = r.sessao;
  if (!donoJaAplicado) {
    const usos = { ...(novoDono.usos ?? {}) };
    for (const chave of [chaveDeUsos(invId), chaveDeUsos(invId, acao.auxilioSub)]) usos[chave] = inteiro(usos[chave]) + 1;
    novoDono = { ...novoDono, usos };
  }
  let novoAlvo = sa;
  const avisos = [];

  if (AUXILIO_SUSTENTAVEL.includes(acao.auxilioSub)) {
    // Interruptor do dono. Ligar um auxílio que já estava ligado renova o prejuízo.
    novoDono = alternaAuxilioInvocacao(novoDono, invId, acao.id, true);
    if (auxilio.passos > 0) {
      const linha = novoDono.invocacoes?.[invId];
      if (linha) novoDono = { ...novoDono, invocacoes: { ...novoDono.invocacoes, [invId]: { ...linha, auxilios: { ...linha.auxilios, [acao.id]: { prejuizo: auxilio.passos } } } } };
    }
    if (!mesmaSessao) avisos.push("Defesa, Acerto e RD Valem Para o Dono, o Pacote Leva Aos Aliados");
  } else if (acao.auxilioSub === "danoAdicional") {
    const nome = `Dano Adicional ${auxilio.dado} (${inv.nome || "Invocação"})`;
    const pendId = `aux-dano:${opId}`;
    if (acao.alvoAuxilio === "invocacao") {
      // O disparo é da própria invocação: lembrete consumido no ataque DELA (categoria `invocacao:<id>`).
      const p = armaProximoAtaque(novoDono, {
        id: pendId, nome, elegivel: { qualquer: [`invocacao:${invId}`] }, consome: "declaracao", expira: "descanso",
      }, { opId: `${opId}:arma` });
      if (!p.aplicado) return rejeita(sd, sa, p.erro ?? "Pendência Recusada", p.codigo ?? "pendencia-recusada");
      novoDono = p.sessao;
    } else {
      const destino = mesmaSessao ? novoDono : sa;
      const efeitos = auxilio.grupos.map((g) => ({ tipo: "buff", canal: "dadosNomeados", alvo: `d${g.faces}`, expr: String(g.dados), nome }));
      if (!efeitos.length) return rejeita(sd, sa, "Dano Adicional Sem Dado", "sem-dado");
      const d = { id: pendId, nome, origem: "invocacao", duracao: { ate: "cena" }, efeitos };
      const u = usa(destino, mesmaSessao ? dd : alvo?.derived ?? null, d, { opId: mesmaSessao ? `${opId}:buff` : opAlvo });
      if (!u.aplicado) return rejeita(sd, sa, u.erro ?? "Uso Recusado", u.codigo ?? "uso-recusado");
      const p = armaProximoAtaque(u.sessao, {
        id: pendId, usoId: pendId, nome, elegivel: {}, consome: "declaracao", expira: "descanso",
      }, { opId: mesmaSessao ? `${opId}:arma` : `${opAlvo}:arma` });
      if (!p.aplicado) return rejeita(sd, sa, p.erro ?? "Pendência Recusada", p.codigo ?? "pendencia-recusada");
      if (mesmaSessao) novoDono = p.sessao;
      else novoAlvo = p.sessao;
    }
  }
  return {
    ok: true, aplicado: true, dono: novoDono, alvo: mesmaSessao ? null : novoAlvo, auxilio, custo: r.custo, avisos,
    evento: { tipo: "auxilio-invocacao", invocacaoId: invId, acaoId, sub: acao.auxilioSub, passos: auxilio.passos },
  };
}

/* ============================================================ */
/* FORMA DE ARMA                                                 */
/* ============================================================ */
const armaDaCaracteristica = (inv) => inv?.efeitosIntrinsecos?.formaArma?.arma ?? null;

/** As Ações Complexas de ataque da invocação: as candidatas a "a ação complexa" da Forma de Arma. */
export const acoesDaFormaDeArma = (inv) => lista(inv?.acoes).filter((a) => a.familia === "ataque" && a.classe === "complexa" && a.dano?.dado);

/** A Ação Complexa gravada para a Forma desta invocação, ou a única candidata. `null` se ainda há que escolher. */
export function acaoDaForma(sessao, inv) {
  const candidatas = acoesDaFormaDeArma(inv);
  const gravada = sessao?.formaArmaAcao?.[inv?.id];
  const achada = candidatas.find((a) => a.id === gravada);
  if (achada) return achada;
  return candidatas.length === 1 ? candidatas[0] : null;
}

/**
 * VESTE a Forma de Arma (Ação Simples, comando por Ação Bônus). Exige a Característica válida (custo e treino conferidos
 * pelo derive), a invocação em campo e UMA Ação Complexa de ataque escolhida. Com mais de uma e sem `acaoId`, devolve as
 * `opcoes` e nada muda. A invocação segue em campo (p. Adicionais).
 */
export function transformaEmArma(sessao, derived, invId, { acaoId = null, opId, registraAcao = false } = {}) {
  if (typeof opId !== "string" || !opId) return { sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const inv = invocacaoDaMesa(derived, invId);
  if (!inv) return { sessao, aplicado: false, erro: "Invocação Inexistente", codigo: "invocacao-inexistente" };
  if (!armaDaCaracteristica(inv)) return { sessao, aplicado: false, erro: "Sem Forma de Arma Válida", codigo: "sem-forma" };
  if (!estadoDaInvocacao(sessao, invId).emCampo) return { sessao, aplicado: false, erro: "Invocação Fora de Campo", codigo: "fora-de-campo" };
  const candidatas = acoesDaFormaDeArma(inv);
  if (!candidatas.length) return { sessao, aplicado: false, erro: "Sem Ação Complexa de Ataque", codigo: "sem-ataque-complexo" };
  let escolhida = candidatas.length === 1 ? candidatas[0] : candidatas.find((a) => a.id === acaoId);
  if (!escolhida) {
    return {
      sessao, aplicado: false, erro: "Escolha a Ação Complexa da Forma", codigo: "escolher-acao",
      opcoes: candidatas.map((a) => ({ id: a.id, nome: a.nome || "Ataque", dado: a.dano.dado, tipoDano: a.tipoDano })),
    };
  }
  let s = sessao;
  if (registraAcao) {
    const g = gastaAcao(s, derived, "bonus", { id: `forma-arma:${invId}` });
    if (g.erro) return { sessao, aplicado: false, erro: g.erro, codigo: g.codigo };
    s = g.sessao;
  }
  s = defineFormaInvocacao(s, invId, "arma");
  if (s === sessao || s === undefined) return { sessao, aplicado: false, erro: "A Forma Não Mudou", codigo: "forma-nao-mudou" };
  s = { ...s, formaArmaAcao: { ...(s.formaArmaAcao ?? {}), [invId]: escolhida.id } };
  return {
    sessao: comOperacao(s, { id: opId, tipo: "forma-arma" }), aplicado: true, acaoId: escolhida.id,
    evento: { tipo: "forma-arma", invocacaoId: invId, acaoId: escolhida.id },
  };
}

/** A invocação volta à forma própria. */
export function voltaDaForma(sessao, derived, invId, { opId, registraAcao = false } = {}) {
  if (typeof opId !== "string" || !opId) return { sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  if (estadoDaInvocacao(sessao, invId).forma !== "arma") return { sessao, aplicado: false, erro: "Não Está Em Forma de Arma", codigo: "sem-forma" };
  let s = sessao;
  if (registraAcao) {
    const g = gastaAcao(s, derived, "bonus", { id: `forma-arma:${invId}` });
    if (g.erro) return { sessao, aplicado: false, erro: g.erro, codigo: g.codigo };
    s = g.sessao;
  }
  s = defineFormaInvocacao(s, invId, null);
  const { [invId]: _x, ...resto } = s.formaArmaAcao ?? {};
  return { sessao: comOperacao({ ...s, formaArmaAcao: resto }, { id: opId, tipo: "forma-arma-fim" }), aplicado: true };
}

const somaMedia = (grupos) => grupos.reduce((n, g) => n + Math.floor((g.dados * (g.faces + 1)) / 2), 0);
const notacao = (grupos) => grupos.map((g) => `${g.dados}d${g.faces}`).join(" + ");

/**
 * A LINHA DE ATAQUE da Forma de Arma, no formato das linhas de dano do dono (`derived.dano.entradas`), para a Ficha
 * desenhar e rolar com o que já tem. Puro.
 *
 * Nasce da linha do dono para a MESMA arma, se ele a empunha, ou do Ataque Básico dele (e então `formaArma.aproximada` é
 * verdadeiro: o acerto e o fixo são os do dono sem a arma). Troca o dado, o tipo de dano e a margem de crítico (a da arma), e
 * guarda de onde veio. Devolve `null` se a invocação não está em Forma de Arma, ou `{ pendente }` se a Ação Complexa
 * ainda não foi escolhida.
 */
export function linhaDeFormaArma(sessao, derived, invId) {
  const inv = invocacaoDaMesa(derived, invId);
  const arma = armaDaCaracteristica(inv);
  if (!inv || !arma || estadoDaInvocacao(sessao, invId).forma !== "arma") return null;
  const acao = acaoDaForma(sessao, inv);
  if (!acao) return { pendente: "acao", opcoes: acoesDaFormaDeArma(inv).map((a) => ({ id: a.id, nome: a.nome || "Ataque" })) };
  const catalogo = ARMAS.find((a) => a.id === arma.id) ?? null;
  const entradas = lista(derived?.dano?.entradas);
  const propria = entradas.find((e) => e.fonte !== "basico" && [e.id, e.armaId, e.refId].includes(arma.id));
  const basica = entradas.find((e) => e.id === "basico") ?? entradas[0] ?? null;
  const origem = propria ?? basica;
  if (!origem) return { pendente: "linha-do-dono" };
  const grupos = lista(acao.dano.grupos).length ? acao.dano.grupos : dadosDaNotacao(acao.dano.dado);
  if (!grupos.length) return { pendente: "dado" };
  const fixo = inteiro(origem.fixo);
  const gruposDano = grupos.map((g, i) => ({
    ...(origem.gruposDano?.[0] ?? { nome: "Ataque", momento: "durante", multiplica: true, naPartes: true }),
    dados: g.dados, dadosConcentraveis: g.dados, faces: g.faces, fixo: i === 0 ? fixo : 0,
  }));
  const dobro = grupos.map((g) => ({ ...g, dados: g.dados * 2 }));
  const margemArma = Number.isFinite(Number(catalogo?.critico)) ? Number(catalogo.critico) : null;
  return {
    ...origem,
    id: `forma-arma:${invId}`,
    nome: `${arma.nome} (${inv.nome || "Invocação"})`,
    fonte: "forma_arma",
    chaveArma: `forma-arma:${invId}`,
    tipoDano: acao.tipoDano || origem.tipoDano,
    tipoDanoLabel: acao.tipoDanoLabel ?? origem.tipoDanoLabel,
    dado: `d${grupos[0].faces}`,
    dados: grupos[0].dados,
    dadosBase: grupos[0].dados,
    dadosExtras: 0,
    fixo,
    total: fixo + somaMedia(grupos),
    texto: `${notacao(grupos)}+${fixo}`,
    formulaNormal: `${notacao(grupos)} + ${fixo}`,
    formulaCritico: `${notacao(dobro)} + ${fixo}`,
    gruposDano,
    margemCritico: margemArma != null ? Math.min(margemArma, origem.margemCritico ?? 20) : origem.margemCritico,
    propriedades: catalogo ? propriedadesDaArma({ props: catalogo.props }) : origem.propriedades,
    formaArma: {
      invocacaoId: invId, invocacaoNome: inv.nome || "", armaId: arma.id, armaNome: arma.nome, grupo: catalogo?.grupo ?? null,
      acaoId: acao.id, acaoNome: acao.nome || "", aproximada: !propria,
    },
  };
}

/**
 * A REAÇÃO DO PORTADOR (Adicionais): "pode gastar sua Reação para levar o dano completo de um ataque de alvo único que mire
 * na Arma, ignorando suas RDs". Gasta a reação (uma por rodada) e aplica o dano ao DONO pelo contrato do CL1, sem
 * Redução de Dano. O dano NÃO vai à invocação. Resistência e Vulnerabilidade do tipo seguem valendo (o texto só ignora RD).
 */
export function reacaoDoPortadorNaForma(sessao, derived, { invId, dano, tipo = null, opId, registraAcao = true } = {}) {
  if (typeof opId !== "string" || !opId) return { sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  if (estadoDaInvocacao(sessao, invId).forma !== "arma") return { sessao, aplicado: false, erro: "Não Está Em Forma de Arma", codigo: "sem-forma" };
  let s = sessao;
  if (registraAcao) {
    const g = gastaAcao(s, derived, "reacao", { id: `forma-arma:${invId}` });
    if (g.erro) return { sessao, aplicado: false, erro: g.erro, codigo: g.codigo };
    s = g.sessao;
  }
  const r = aplicaDanoRecebido(s, derived, { total: Math.max(0, inteiro(dano)), tipo, rdIgnorada: Number.MAX_SAFE_INTEGER }, { opId });
  if (!r.aplicado) return { ...r, sessao };
  return { ...r, aplicado: true, poupouAInvocacao: true };
}
