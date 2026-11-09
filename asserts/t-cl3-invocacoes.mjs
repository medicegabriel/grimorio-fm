/* CL3: INVOCAÇÕES NA MESA. Auxílio com prejuízo por repetição, Dano Adicional consumido no próximo ataque elegível, Forma de
   Arma com a linha de ataque do dono, a reação do portador e as variáveis de sessão da Característica Livre, com duas fichas
   reais em sessões reais. Livro p.257, 267 a 270 e o pacote Adicionais. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const S = await import(R + "ficha/ficha-sessao.js");
const U = await import(R + "ficha/ficha-uso-estado.js");
const E = await import(R + "ficha/ficha-combate-eventos.js");
const IU = await import(R + "ficha/ficha-invocacao-uso.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
aplicarAddons([]);

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
let n = 0;
const op = () => `op_i_${(n += 1)}`;

/* ============================================================ */
/* FICHAS                                                         */
/* ============================================================ */
const aux = (id, sub, alvo, classe = "simples", extra = {}) => ({
  id, nome: `Aux ${id}`, familia: "auxilio", auxilioSub: sub, alvoAuxilio: alvo, classe, custoPE: 0, ...extra,
});
const ataque = (id, nome, tipoDano) => ({
  id, nome, familia: "ataque", classe: "complexa", tipoDano, atributoChave: "forca", alvo: "unico", ataqueTipo: "jogada",
});

function fichaDona({ forma = true, tipo = "shikigami", livres = [] } = {}) {
  const c = createBlankAfty();
  c.core.nd = 10;
  c.core.tipo = "misto";
  c.core.patamar = "comum";
  c.core.origem = { id: "inato" };
  c.especializacoes = [{ id: "controlador", nivel: 10 }];
  c.equipamentos = { itens: [{ uid: "e1", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }] };
  c.invocacoes = [{
    ...INV.createBlankInvocacao("segundo", tipo),
    id: "INV1",
    nome: "Nue",
    acoes: [
      aux("A_DONO", "defesa", "aliados"),
      aux("A_RD", "rd", "aliados"),
      aux("A_ACERTO", "acerto", "aliados"),
      aux("A_DADO", "danoAdicional", "aliados"),
      aux("A_DADO_SELF", "danoAdicional", "invocacao"),
      aux("A_CURA", "cura", "aliados", "complexa", { custoPE: 2 }),
      ataque("ATQ1", "Corte", "ct"),
      ataque("ATQ2", "Pancada", "im"),
    ],
    caracteristicas: [
      ...(forma ? [{ id: "C_FORMA", subtipo: "formaArma", nome: "Forma", parametros: { arma: "arm_espada_curta" } }] : []),
      ...livres,
    ],
  }];
  return c;
}

function fichaAliada() {
  const c = createBlankAfty();
  c.core.nd = 10;
  c.core.tipo = "combatente";
  c.core.patamar = "comum";
  c.core.origem = { id: "inato" };
  return c;
}

const derivar = (c, sessao) => deriveAfty({ ...c, buffsSessao: sessao?.buffs ?? [] }, sessao ? { invocacoes: sessao.invocacoes } : {});
const emCombate = (derived) => S.aplicaPatchCombate(S.sessaoEmBranco(derived), { ativo: true });
const emCampo = (sessao, derived, id = "INV1") => S.poeInvocacaoEmCampo(sessao, id, true, derived.invocacoes.lista.find((i) => i.id === id).pv);

const cA = fichaDona();
let dA = derivar(cA, null);
let sA = emCampo(emCombate(dA), dA);
t("a invocação entra em campo", S.estadoDaInvocacao(sA, "INV1").emCampo, true);
const invA = () => derivar(cA, sA).invocacoes.lista[0];

/* ============================================================ */
/* 1. PREJUÍZO POR MÚLTIPLOS AUXÍLIOS (puro)                     */
/* ============================================================ */
t("1ª repetição: zero passos na primeira, 1 na segunda", [IU.passosDePrejuizo({}, {}, 0), IU.passosDePrejuizo({}, {}, 1), IU.passosDePrejuizo({}, {}, 3)], [0, 1, 3]);
t("Técnica é imune", IU.passosDePrejuizo({}, { imunePrejuizoMultiplos: true }, 5), 0);
t("Horda com 2 membros pede 1 uso a mais", [IU.passosDePrejuizo({ escala: { prejuizoExtra: 1 } }, {}, 1), IU.passosDePrejuizo({ escala: { prejuizoExtra: 1 } }, {}, 2)], [0, 1]);
t("Horda com 4 membros pede 2 usos a mais", IU.passosDePrejuizo({ escala: { prejuizoExtra: 2 } }, {}, 2), 0);
t("Dano Adicional desce 2 níveis por passo", IU.reduzDanoAdicional("1d10", 1), "1d6");
t("Dano Adicional para em 1d4", [IU.reduzDanoAdicional("1d6", 1), IU.reduzDanoAdicional("1d6", 9), IU.reduzDanoAdicional("2d6", 9)], ["1d4", "1d4", "1d4"]);
t("sem passos o dado não muda", IU.reduzDanoAdicional("2d8", 0), "2d8");
t("2d8 com um passo vale dois níveis a menos na escada", IU.reduzDanoAdicional("2d8", 1), "1d10");

/* ============================================================ */
/* 2. COMANDAR UM AUXÍLIO SUSTENTADO                              */
/* ============================================================ */
const base = derivar(cA, sA);
const inv0 = invA();
const acaoDe = (id) => inv0.acoes.find((a) => a.id === id);
t("Defesa de Segundo Grau, Simples, vale 3", acaoDe("A_DONO").valor, 3);
t("RD de Segundo Grau, Simples, vale 6", acaoDe("A_RD").valor, 6);
t("Acerto de Segundo Grau, Simples, vale 3", acaoDe("A_ACERTO").valor, 3);

const comando = (invId, acaoId, extra = {}) => IU.usaAuxilioDaInvocacao({ dono: { sessao: sA, derived: derivar(cA, sA) }, invId, acaoId, opId: op(), ...extra });
const o1 = op();
const u1 = IU.usaAuxilioDaInvocacao({ dono: { sessao: sA, derived: base }, invId: "INV1", acaoId: "A_DONO", opId: o1, registraAcao: true });
t("o 1º auxílio da rodada não tem prejuízo", [u1.aplicado, u1.auxilio.passos, u1.auxilio.valor], [true, 0, 3]);
t("o comando simples gasta a ação bônus do dono", u1.dono.uso.acoes.gastas.bonus, 1);
t("liga o interruptor de antes (true, sem prejuízo)", u1.dono.invocacoes.INV1.auxilios.A_DONO, true);
t("a Defesa do dono sobe os 3 cheios", derivar(cA, u1.dono).defesa - base.defesa, 3);
sA = u1.dono;
const u2 = comando("INV1", "A_RD");
t("o 2º auxílio da rodada perde 1", [u2.auxilio.passos, u2.auxilio.valor, u2.auxilio.repeticoes], [1, 5, 1]);
t("o interruptor guarda o prejuízo", u2.dono.invocacoes.INV1.auxilios.A_RD, { prejuizo: 1 });
t("a RD do dono sobe 5 e não 6", derivar(cA, u2.dono).rdGeral - base.rdGeral, 5);
const fonteRD = (derivar(cA, u2.dono).partes?.rdGeral ?? []).map((p) => p.nome ?? p.label ?? "");
t("a fonte da RD diz que houve prejuízo", fonteRD.some((x) => x.includes("Prejuízo por Repetição")), true);
sA = u2.dono;
const u3 = comando("INV1", "A_ACERTO");
t("o 3º perde 2", [u3.auxilio.passos, u3.auxilio.valor], [2, 1]);
sA = u3.dono;
t("o interruptor do Acerto guarda os 2 passos", sA.invocacoes.INV1.auxilios.A_ACERTO, { prejuizo: 2 });
const recontadoDefesa = comando("INV1", "A_DONO");
t("ligar o primeiro de novo conta a quarta e vai a zero passos de valor 0", [recontadoDefesa.auxilio.passos, recontadoDefesa.auxilio.valor], [3, 0]);
t("valor zero para de somar", derivar(cA, recontadoDefesa.dono).defesa - base.defesa, 0);
t("o mesmo opId não repete", IU.usaAuxilioDaInvocacao({ dono: { sessao: sA, derived: derivar(cA, sA) }, invId: "INV1", acaoId: "A_RD", opId: u3.dono.uso.ops[0].id.replace(/:dono$/, "") }).repetida, true);
t("sem opId recusa", IU.usaAuxilioDaInvocacao({ dono: { sessao: sA, derived: base }, invId: "INV1", acaoId: "A_RD" }).codigo, "sem-opid");
t("ação que não existe recusa", comando("INV1", "NADA").codigo, "acao-inexistente");
t("ataque não é auxílio", comando("INV1", "ATQ1").codigo, "nao-auxilio");
t("invocação que não existe recusa", comando("NADA", "A_RD").codigo, "invocacao-inexistente");
t("invocação fora de campo recusa", IU.usaAuxilioDaInvocacao({ dono: { sessao: emCombate(dA), derived: dA }, invId: "INV1", acaoId: "A_RD", opId: op() }).codigo, "fora-de-campo");
t("a recusa devolve a mesma sessão do dono", comando("INV1", "NADA").dono === sA, true);

// A rodada vira: a contagem zera
const viradaSessao = S.proximaRodada(sA, derivar(cA, sA)).sessao;
t("a rodada nova zera a contagem", IU.repeticoesNaRodada(viradaSessao, "INV1"), 0);
const novaRodada = IU.usaAuxilioDaInvocacao({ dono: { sessao: viradaSessao, derived: derivar(cA, viradaSessao) }, invId: "INV1", acaoId: "A_RD", opId: op() });
t("na rodada nova o auxílio volta cheio", [novaRodada.auxilio.passos, novaRodada.auxilio.valor], [0, 6]);

// Cura: custo conferido, sem prejuízo, conta como auxílio
sA = emCampo(emCombate(dA), dA);
const cura = comando("INV1", "A_CURA");
t("a Cura custa 2 PE e a política manual não debita", [cura.custo.pe.pedido, cura.custo.pe.naoDescontado, cura.dono.peAtual === sA.peAtual], [2, 2, true]);
t("a Cura gasta a ação comum no comando complexo", comando("INV1", "A_CURA", { registraAcao: true }).dono.uso.acoes.gastas.comum, 1);
t("a Cura não tem prejuízo", comando("INV1", "A_CURA").auxilio.passos, 0);
t("sem Energia a Cura recusa", IU.usaAuxilioDaInvocacao({ dono: { sessao: { ...sA, peAtual: 1 }, derived: derivar(cA, sA) }, invId: "INV1", acaoId: "A_CURA", opId: op() }).codigo, "sem-energia");
const curaAntes = comando("INV1", "A_CURA");
const dadoDepois = IU.usaAuxilioDaInvocacao({ dono: { sessao: curaAntes.dono, derived: derivar(cA, curaAntes.dono) }, invId: "INV1", acaoId: "A_DADO", alvo: null, opId: op() });
t("a Cura conta como o 1º auxílio e o Dano Adicional seguinte já perde (leitura: qualquer auxílio)", [dadoDepois.auxilio.passos, dadoDepois.auxilio.dado], [1, IU.reduzDanoAdicional("2d6", 1)]);

// Técnica é imune
const cT = fichaDona({ tipo: "tecnica", forma: false });
const dT = derivar(cT, null);
let sT = emCampo(emCombate(dT), dT);
const comandoT = (acaoId) => IU.usaAuxilioDaInvocacao({ dono: { sessao: sT, derived: derivar(cT, sT) }, invId: "INV1", acaoId, opId: op() });
const t1 = comandoT("A_DONO"); sT = t1.dono;
const t2 = comandoT("A_RD"); sT = t2.dono;
const t3 = comandoT("A_ACERTO");
t("Shikigami de Técnica é imune ao prejuízo", [t1.auxilio.passos, t2.auxilio.passos, t3.auxilio.passos, t3.auxilio.imune], [0, 0, 0, true]);
t("Técnica: o valor segue cheio", [t2.auxilio.valor, t3.auxilio.valor], [6, 3]);

/* ============================================================ */
/* 3. DANO ADICIONAL: DISPARO NO PRÓXIMO ATAQUE ELEGÍVEL         */
/* ============================================================ */
const cB = fichaAliada();
const dB = derivar(cB, null);
const sB0 = emCombate(dB);
sA = emCampo(emCombate(dA), dA);
const oD = op();
const dano1 = IU.usaAuxilioDaInvocacao({ dono: { sessao: sA, derived: derivar(cA, sA) }, invId: "INV1", acaoId: "A_DADO", alvo: { sessao: sB0, derived: dB }, opId: oD });
t("Dano Adicional para um aliado aplica", dano1.aplicado, true);
t("o dado é o da tabela do grau (2d6 no Segundo, Simples)", dano1.auxilio.dado, "2d6");
t("a sessão do aliado ganha a pendência", U.usoDe(dano1.alvo).pendencias.map((p) => p.consome), ["declaracao"]);
t("a sessão do aliado ganha o Buff do dado", dano1.alvo.buffs.map((b) => [b.canal, b.alvo, b.expr]), [["dadosNomeados", "d6", "2"]]);
t("a sessão da dona não ganha pendência nem Buff", [U.usoDe(dano1.dono).pendencias.length, dano1.dono.buffs.length], [0, 0]);
t("o aliado fica com o uso ativo ligado à pendência", Object.keys(U.usoDe(dano1.alvo).ativos), [`aux-dano:${oD}`]);
const dBcom = derivar({ ...cB }, dano1.alvo);
const dBsem = derivar(cB, sB0);
t("o dano do aliado ganha o dado enquanto armado", JSON.stringify(dBcom.dano.entradas[0].gruposDano).length > JSON.stringify(dBsem.dano.entradas[0].gruposDano).length || dBcom.dano.entradas[0].texto !== dBsem.dano.entradas[0].texto, true);
t("a sessão do aliado não carrega a invocação nem o catálogo da dona", JSON.stringify(dano1.alvo).includes("Nue") && !JSON.stringify(dano1.alvo).includes("segundo"), true);
t("repetir o opId não repete nos dois lados", IU.usaAuxilioDaInvocacao({ dono: { sessao: dano1.dono, derived: derivar(cA, dano1.dono) }, invId: "INV1", acaoId: "A_DADO", alvo: { sessao: dano1.alvo, derived: dB }, opId: oD }).repetida, true);

// Gravação pela metade: só o lado do dono persistiu. Repetir o mesmo opId cura o lado de quem recebe, sem gastar de novo o do dono.
const metade = IU.usaAuxilioDaInvocacao({
  dono: { sessao: dano1.dono, derived: derivar(cA, dano1.dono) }, invId: "INV1", acaoId: "A_DADO",
  alvo: { sessao: sB0, derived: dB }, opId: oD,
});
t("só o dono tinha gravado: repetir o opId cura o alvo", [metade.aplicado, U.usoDe(metade.alvo).pendencias.length, metade.dono === dano1.dono], [true, 1, true]);
t("a cura não repete a contagem do dono nem muda o dado", [IU.repeticoesNaRodada(metade.dono, "INV1"), metade.auxilio.dado, metade.auxilio.passos], [IU.repeticoesNaRodada(dano1.dono, "INV1"), "2d6", 0]);

// O ataque elegível consome, mesmo errando (consome na declaração), e o Buff sai junto
const ataqueErrado = E.registraAtaqueRealizado(dano1.alvo, dB, { acertou: false, categorias: ["arma", "corpo"], alvo: { id: "X" } }, { opId: op() });
t("o ataque do aliado consome o disparo", ataqueErrado.consumidas.length, 1);
t("consumir tira o Buff do dado", [ataqueErrado.sessao.buffs.length, Object.keys(U.usoDe(ataqueErrado.sessao).ativos).length, U.usoDe(ataqueErrado.sessao).pendencias.length], [0, 0, 0]);
t("o dano do aliado volta ao de antes", derivar(cB, ataqueErrado.sessao).dano.entradas[0].texto, dBsem.dano.entradas[0].texto);
t("antes do ataque a pendência aparece como elegível", E.elegiveisParaAtaque(dano1.alvo, { categorias: ["arma"] }).length, 1);

// Dano Adicional do dono para si mesmo (alvo ausente): a mesma sessão
sA = emCampo(emCombate(dA), dA);
const proprio = IU.usaAuxilioDaInvocacao({ dono: { sessao: sA, derived: derivar(cA, sA) }, invId: "INV1", acaoId: "A_DADO", opId: op() });
t("sem alvo o Dano Adicional vai ao próprio dono", [proprio.alvo, proprio.dono.buffs.length, U.usoDe(proprio.dono).pendencias.length], [null, 1, 1]);
const oProprio = E.registraAtaqueRealizado(proprio.dono, derivar(cA, proprio.dono), { acertou: true, categorias: ["arma"] }, { opId: op() });
t("o dono consome no ataque dele", [oProprio.consumidas.length, oProprio.sessao.buffs.length], [1, 0]);

// Segundo uso na mesma rodada: o dado desce
const seg = IU.usaAuxilioDaInvocacao({ dono: { sessao: proprio.dono, derived: derivar(cA, proprio.dono) }, invId: "INV1", acaoId: "A_DADO", opId: op() });
t("o 2º Dano Adicional na rodada tem o dado reduzido dois níveis (2d6 vale 12 e desce a 1d8)", [seg.auxilio.passos, seg.auxilio.dado], [1, "1d8"]);
t("os dois dados se acumulam no próximo ataque", seg.dono.buffs.map((b) => `${b.expr}d${b.alvo.slice(1)}`), ["2d6", "1d8"]);

/* ============================================================ */
/* 4. FORMA DE ARMA                                               */
/* ============================================================ */
sA = emCampo(emCombate(dA), dA);
const dFA = () => derivar(cA, sA);
t("sem Forma ligada não há linha de ataque", IU.linhaDeFormaArma(sA, dFA(), "INV1"), null);
t("a invocação tem duas Ações Complexas de ataque", IU.acoesDaFormaDeArma(dFA().invocacoes.lista[0]).map((a) => a.id), ["ATQ1", "ATQ2"]);
const semEscolha = IU.transformaEmArma(sA, dFA(), "INV1", { opId: op() });
t("com duas Ações Complexas é preciso escolher", [semEscolha.codigo, semEscolha.opcoes.map((o) => o.id), semEscolha.sessao === sA], ["escolher-acao", ["ATQ1", "ATQ2"], true]);
t("a escolha deve ser uma das candidatas", IU.transformaEmArma(sA, dFA(), "INV1", { acaoId: "A_DONO", opId: op() }).codigo, "escolher-acao");
const oF = op();
const forma = IU.transformaEmArma(sA, dFA(), "INV1", { acaoId: "ATQ2", opId: oF, registraAcao: true });
t("vestir a Forma de Arma aplica e gasta a ação bônus", [forma.aplicado, forma.sessao.uso.acoes.gastas.bonus, forma.sessao.invocacoes.INV1.forma], [true, 1, "arma"]);
t("a invocação segue em campo", S.estadoDaInvocacao(forma.sessao, "INV1").emCampo, true);
t("repetir o opId é repetida", IU.transformaEmArma(forma.sessao, dFA(), "INV1", { acaoId: "ATQ2", opId: oF }).repetida, true);
sA = forma.sessao;
const linha = IU.linhaDeFormaArma(sA, dFA(), "INV1");
const entradaEspada = dFA().dano.entradas.find((e) => e.id === "arm_espada_curta");
t("a linha usa o TIPO da Ação Complexa escolhida (impacto)", linha.tipoDano, "im");
const gruposAtq2 = INV.dadosDaNotacao(dFA().invocacoes.lista[0].acoes.find((a) => a.id === "ATQ2").dano.dado);
t("a linha usa o DADO da Ação Complexa (o do Segundo Grau)", [linha.gruposDano.map((g) => [g.dados, g.faces]), linha.dado], [gruposAtq2.map((g) => [g.dados, g.faces]), "d" + gruposAtq2[0].faces]);
t("o acerto e o fixo são os do dono com a espada", [linha.acerto, linha.fixo], [entradaEspada.acerto, entradaEspada.fixo]);
t("a margem de crítico é a da arma", linha.margemCritico, 19);
t("a linha traz a origem", [linha.formaArma.invocacaoId, linha.formaArma.armaId, linha.formaArma.acaoId, linha.formaArma.aproximada], ["INV1", "arm_espada_curta", "ATQ2", false]);
t("a linha tem identidade própria", [linha.id, linha.fonte], ["forma-arma:INV1", "forma_arma"]);
t("a fórmula do crítico dobra o dado e mantém o fixo", linha.formulaCritico, gruposAtq2.map((g) => `${g.dados * 2}d${g.faces}`).join(" + ") + " + " + linha.fixo);
t("o total é o fixo mais a média do dado", linha.total, linha.fixo + gruposAtq2.reduce((n, g) => n + Math.floor((g.dados * (g.faces + 1)) / 2), 0));
t("as propriedades vêm da arma", linha.propriedades.map((p) => p.id).sort(), entradaEspada.propriedades.map((p) => p.id).sort());
const trocou = IU.transformaEmArma(sA, dFA(), "INV1", { acaoId: "ATQ1", opId: op() });
t("trocar a Ação Complexa troca o tipo", IU.linhaDeFormaArma(trocou.sessao, dFA(), "INV1").tipoDano, "ct");
t("a escolha viaja no JSON da sessão", IU.linhaDeFormaArma(S.normalizaSessao(JSON.parse(JSON.stringify(sA)), dFA()), dFA(), "INV1").formaArma.acaoId, "ATQ2");
const caiu = S.aplicaDanoInvocacao(sA, "INV1", 999, dFA().invocacoes.lista[0].pv, dFA().invocacoes.lista[0].regras);
t("invocação dissipada deixa de ser arma", IU.linhaDeFormaArma(caiu, dFA(), "INV1"), null);
const volta = IU.voltaDaForma(sA, dFA(), "INV1", { opId: op(), registraAcao: true });
t("voltar da Forma limpa a escolha e a linha", [volta.aplicado, IU.linhaDeFormaArma(volta.sessao, dFA(), "INV1"), volta.sessao.formaArmaAcao], [true, null, {}]);
t("fora da Forma não há como voltar", IU.voltaDaForma(volta.sessao, dFA(), "INV1", { opId: op() }).codigo, "sem-forma");
const cSemCar = fichaDona({ forma: false });
const dSemCar = derivar(cSemCar, null);
t("sem a Característica não veste", IU.transformaEmArma(emCampo(emCombate(dSemCar), dSemCar), dSemCar, "INV1", { opId: op() }).codigo, "sem-forma");
t("fora de campo não veste", IU.transformaEmArma(emCombate(dA), dA, "INV1", { acaoId: "ATQ1", opId: op() }).codigo, "fora-de-campo");
t("sem opId recusa", IU.transformaEmArma(sA, dFA(), "INV1", { acaoId: "ATQ1" }).codigo, "sem-opid");
const cUma = fichaDona();
cUma.invocacoes[0].acoes = cUma.invocacoes[0].acoes.filter((a) => a.id !== "ATQ2");
const dUma = derivar(cUma, null);
t("com uma só Ação Complexa a escolha é dela", IU.transformaEmArma(emCampo(emCombate(dUma), dUma), dUma, "INV1", { opId: op() }).acaoId, "ATQ1");
const cSem = fichaDona();
cSem.equipamentos = { itens: [] };
const dSem = derivar(cSem, null);
const sSem = IU.transformaEmArma(emCampo(emCombate(dSem), dSem), dSem, "INV1", { acaoId: "ATQ1", opId: op() }).sessao;
t("sem a arma empunhada a linha sai do Ataque Básico e avisa", IU.linhaDeFormaArma(sSem, dSem, "INV1")?.formaArma.aproximada, true);
t("mesmo aproximada, a margem de crítico é a da arma e não a do Ataque Básico", [dSem.dano.entradas[0].margemCritico, IU.linhaDeFormaArma(sSem, dSem, "INV1").margemCritico], [20, 19]);

const { aplicaDanoRecebido } = await import(R + "ficha/ficha-dano-recebido.js");
const cRd = fichaDona();
cRd.votos = { contratuais: [], mecanicos: [{ id: "rd", nome: "RD", narrativa: "", beneficio: { texto: "", efeitos: [{ canal: "rdGeral", expr: "5" }] }, maleficio: { texto: "", efeitos: [] } }] };
const dRd = derivar(cRd, null);
const sRd = IU.transformaEmArma(emCampo(emCombate(dRd), dRd), dRd, "INV1", { acaoId: "ATQ1", opId: op() }).sessao;
t("o dono tem RD 5", dRd.rdGeral >= 5, true);
const normal = aplicaDanoRecebido(sRd, dRd, { total: 30, tipo: "ct" }, { opId: op() });
const reacao = IU.reacaoDoPortadorNaForma(sRd, dRd, { invId: "INV1", dano: 30, tipo: "ct", opId: op() });
t("o dano normal é reduzido pela RD do dono", -normal.mudou.vida, 30 - dRd.rdGeral);
t("a reação leva o dano COMPLETO, ignorando as RD", [reacao.aplicado, -reacao.mudou.vida, reacao.poupouAInvocacao], [true, 30, true]);
t("a reação gasta a reação da rodada", Object.keys(reacao.sessao.uso.acoes.reacoes), ["forma-arma:INV1"]);
t("não há segunda reação na mesma rodada", IU.reacaoDoPortadorNaForma(reacao.sessao, dRd, { invId: "INV1", dano: 10, opId: op() }).codigo, "reacao-repetida");
t("fora da Forma de Arma não há reação", IU.reacaoDoPortadorNaForma(emCampo(emCombate(dRd), dRd), dRd, { invId: "INV1", dano: 10, opId: op() }).codigo, "sem-forma");
t("o PV da invocação não muda com a reação", reacao.sessao.invocacoes.INV1.pvAtual, sRd.invocacoes.INV1.pvAtual);

/* ============================================================ */
/* 5. CARACTERÍSTICA LIVRE: O ESTADO DE MESA NO "ENQUANTO"        */
/* ============================================================ */
const livre = (quando) => ({
  id: "LIV", subtipo: "livre", nome: "Livre",
  efeitos: [{ canal: "defesa", expr: "3", quando }],
});
const defesaLivre = (c, sessao) => derivar(c, sessao).invocacoes.lista[0].caracteristicas.find((x) => x.id === "LIV").efeitos[0].ativo;
const ctxDe = (c, sessao) => derivar(c, sessao).invocacoes.lista[0].contextoDsl;
const cL = fichaDona({ livres: [livre("forma_arma")] });
const dL = derivar(cL, null);
t("no criador (sem sessão) o estado vale como em campo e cheio", [ctxDe(cL, null).em_campo, ctxDe(cL, null).pv_percentual, ctxDe(cL, null).forma_arma], [1, 100, 0]);
t("no criador a Forma não está ligada", defesaLivre(cL, null), false);
const sL0 = emCombate(dL);
t("fora de campo o estado vale zero", [ctxDe(cL, sL0).em_campo, ctxDe(cL, sL0).forma_arma], [0, 0]);
const sL1 = emCampo(sL0, dL);
t("em campo, sem Forma, a condição falha", [ctxDe(cL, sL1).em_campo, defesaLivre(cL, sL1)], [1, false]);
const sL2 = IU.transformaEmArma(sL1, dL, "INV1", { acaoId: "ATQ1", opId: op() }).sessao;
t("em Forma de Arma a condição liga", [ctxDe(cL, sL2).forma_arma, defesaLivre(cL, sL2)], [1, true]);
t("e a Forma de Armadura continua zero", ctxDe(cL, sL2).forma_armadura, 0);
const cPv = fichaDona({ livres: [livre("pv_percentual <= 50")] });
const dPv = derivar(cPv, null);
const pvMax = dPv.invocacoes.lista[0].pv;
const sPvCheio = emCampo(emCombate(dPv), dPv);
t("PV cheio: 100 por cento e a condição falha", [ctxDe(cPv, sPvCheio).pv_percentual, defesaLivre(cPv, sPvCheio)], [100, false]);
const sPvMeio = { ...sPvCheio, invocacoes: { ...sPvCheio.invocacoes, INV1: { ...sPvCheio.invocacoes.INV1, pvAtual: Math.floor(pvMax / 2) } } };
t("metade do PV: a condição liga", [ctxDe(cPv, sPvMeio).pv_percentual <= 50, defesaLivre(cPv, sPvMeio)], [true, true]);
t("o PV atual é lido da sessão", ctxDe(cPv, sPvMeio).pv_atual, Math.floor(pvMax / 2));
const cAux = fichaDona({ livres: [livre("auxilios_ligados >= 1")] });
const dAux = derivar(cAux, null);
const sAux0 = emCampo(emCombate(dAux), dAux);
const sAux1 = IU.usaAuxilioDaInvocacao({ dono: { sessao: sAux0, derived: derivar(cAux, sAux0) }, invId: "INV1", acaoId: "A_DONO", opId: op() }).dono;
t("auxílio ligado liga a condição", [defesaLivre(cAux, sAux0), defesaLivre(cAux, sAux1), ctxDe(cAux, sAux1).auxilios_ligados], [false, true, 1]);
const compostoMapa = { INV1: { emCampo: false, estado: "fora", auxilios: {} }, "horda:H": { emCampo: true, estado: "ativa", componentes: ["INV1"], auxilios: {} } };
const invFalsa = { id: "INV1", grau: "segundo", atributos: {}, acoes: [], caracteristicas: [] };
const ctxComposto = INV.buildInvocacaoDslContext(invFalsa, { sessaoInvocacoes: compostoMapa });
t("dentro de um composto ativo a invocação conta em campo", [ctxComposto.em_campo, ctxComposto.em_composto], [1, 1]);
const ctxFora = INV.buildInvocacaoDslContext(invFalsa, { sessaoInvocacoes: { ...compostoMapa, "horda:H": { ...compostoMapa["horda:H"], emCampo: false } } });
t("composto desfeito não conta", [ctxFora.em_campo, ctxFora.em_composto], [0, 0]);

/* ============================================================ */
/* 6. DUAS FICHAS, MESMO ID, SEM VAZAMENTO                         */
/* ============================================================ */
const cX = fichaDona({ livres: [livre("forma_arma")] });
const cY = fichaDona({ livres: [livre("forma_arma")] });
const dX = derivar(cX, null);
let sX = IU.transformaEmArma(emCampo(emCombate(dX), dX), dX, "INV1", { acaoId: "ATQ1", opId: op() }).sessao;
const dY = derivar(cY, null);
const sY = emCampo(emCombate(dY), dY);
const x1 = defesaLivre(cX, sX);
const y1 = defesaLivre(cY, sY);
const x2 = defesaLivre(cX, sX);
t("X em Forma, Y não, X de novo: cada um vê o seu", [x1, y1, x2], [true, false, true]);
t("a linha de Forma de X não aparece na sessão de Y", IU.linhaDeFormaArma(sY, derivar(cY, sY), "INV1"), null);
sX = IU.usaAuxilioDaInvocacao({ dono: { sessao: sX, derived: derivar(cX, sX) }, invId: "INV1", acaoId: "A_DONO", opId: op() }).dono;
t("a contagem de X não conta para Y", [IU.repeticoesNaRodada(sX, "INV1"), IU.repeticoesNaRodada(sY, "INV1")], [1, 0]);

/* ============================================================ */
/* 7. O CATÁLOGO NÃO VAZA: A COM ADDON REAL, B SEM NENHUM          */
/* ============================================================ */
/* O risco de catálogo é o `aplicarAddons` reescrever as listas globais quando duas fichas carregam pacotes diferentes. O Stark
   traz `estadosCombate` e um `votoAutomatico` (O Covarde). A ganha o pacote, B não ganha nada, num Encontro (a união). */
const { readFileSync } = await import("node:fs");
const AD = await import(R + "afty-addons.js");
const VT = await import(R + "afty-votos.js");
const stark = JSON.parse(readFileSync(new URL("../addons/stark.json", import.meta.url), "utf8"));
const fAddon = fichaDona();
fAddon.addons = [stark];
const fSem = fichaAliada();
AD.aplicarAddons(AD.unirAddons([fAddon, fSem]).pacotes);
const estadosIds = (d) => d.combate.estadosExtras.map((e) => e.id);
const retrato = (c, sessao) => {
  const d = derivar(c, sessao);
  return JSON.stringify({ defesa: d.defesa, rd: d.rdGeral, inv: d.invocacoes.lista[0]?.defesa, votos: d.votosEfeitos, estados: estadosIds(d) });
};
const dComAddon0 = derivar(fAddon, null);
const sComAddon = emCampo(emCombate(dComAddon0), dComAddon0);
const dSemAddon0 = derivar(fSem, null);
const sSemAddon = emCombate(dSemAddon0);
const antesA = retrato(fAddon, sComAddon);
const retratoB = retrato(fSem, sSemAddon);
const depoisA = retrato(fAddon, sComAddon);
t("A, B, A com o pacote real: A não muda", antesA, depoisA);
t("A tem o estado do pacote e B não", [estadosIds(dComAddon0).includes("stark:covarde"), estadosIds(dSemAddon0).includes("stark:covarde")], [true, false]);
t("A tem o Voto automático do pacote e B não", [VT.votosDaFicha(fAddon).mecanicos.map((v) => v.id), VT.votosDaFicha(fSem).mecanicos.length], [["voto_addon_stark_o_covarde"], 0]);
t("B não traz nenhum rastro do pacote", /stark|covarde/i.test(retratoB), false);
const entrega = IU.usaAuxilioDaInvocacao({
  dono: { sessao: sComAddon, derived: derivar(fAddon, sComAddon) }, invId: "INV1", acaoId: "A_DADO",
  alvo: { sessao: sSemAddon, derived: dSemAddon0 }, opId: op(),
});
t("o Dano Adicional chega a B", [entrega.aplicado, U.usoDe(entrega.alvo).pendencias.length], [true, 1]);
t("a sessão que B recebeu não carrega conteúdo do pacote da dona", /stark|covarde/i.test(JSON.stringify(entrega.alvo)), false);
t("e a sessão da dona não ganhou o Buff do aliado", entrega.dono.buffs.length, 0);
t("o derive de B com o Buff recebido segue sem rastro do pacote", /stark|covarde/i.test(retrato(fSem, entrega.alvo)), false);
t("depois da entrega A continua o mesmo", retrato(fAddon, sComAddon), antesA);
AD.aplicarAddons([]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
