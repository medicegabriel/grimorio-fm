// CX3, frente Aptidões e Treinos (Claude). Livro p.175, Absorção Elemental.
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { registraAtaqueRealizado } = await import(R + "ficha/ficha-combate-eventos.js");
const A = await import(R + "ficha/ficha-conteudo-absorcao-elemental.js");
const N = await import(R + "afty-conteudo-auras.js");
let ok = 0, seq = 0, e2e = 0, avisouSemPatch = false;
const erros = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : erros.push(n + ": " + JSON.stringify(a) + " != " + JSON.stringify(b));
const p = () => ({ opId: "absorcao-" + ++seq });
const tiposElementaisIds = () => A.tiposElementais().map((x) => x.id);
aplicarAddons([]);

const inicio = (d) => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });

function ficha(sistema, id, apts, au, nd = 12) {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.id = id; c.name = id; c.core.nd = nd; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: nd }];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
  c.aptidoes = { cl: 0, er: 0, au, dom: 0, bar: 0 }; c.aptidoesAmaldicoadas = apts;
  c.aptidaoOpcoes = { aura_elemental: "queimante" };
  c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }];
  return c;
}

// O erro real do Livro: a escada de dados desta Aptidão é 6, 8, 10 em 1, 3, 5.
t("escada de faces: 1 e 2 em d6, 3 e 4 em d8, 5 em d10", [0, 1, 2, 3, 4, 5, 6].map(N.facesAbsorcaoElemental), [6, 6, 6, 8, 8, 10, 10]);
t("X dados é o Nível de Aptidão em Aura", [0, 1, 3, 5].map(N.dadosAbsorcaoElemental), [0, 1, 3, 5]);
t("grupo no formato dos grupos de dano e sem dado com nível 0",
  [N.grupoDanoAbsorcaoElemental({ au: 3, tipo: "queimante" }), N.grupoDanoAbsorcaoElemental({ au: 0, tipo: "queimante" }), N.grupoDanoAbsorcaoElemental({ au: 3 })],
  [{ nome: "Absorção Elemental", dados: 3, faces: 8, fixo: 0, momento: "durante", multiplica: true, tipoDano: "queimante" }, null, null]);

for (const sistema of ["player", "afty"]) {
  const teste = (n, a, b) => t(sistema + " " + n, a, b);
  const ndAlvo = sistema === "afty" ? 6 : 12; // a RD geral do Afty é o ND, e o dado de 1d4 precisa vencê-la
  const atk = ficha(sistema, "atk", ["aura_elemental"], 5), def = ficha(sistema, "def", ["aura_elemental", "absorcao_elemental"], 3, ndAlvo);
  const so = ficha(sistema, "so", ["aura_elemental", "mal_absorcao_elemental"], 3, ndAlvo), semApt = ficha(sistema, "sem", ["aura_elemental"], 3, ndAlvo);
  const da = deriveAfty(atk), dd = deriveAfty(def), dso = deriveAfty(so), dsem = deriveAfty(semApt);
  const sa = inicio(da), sd = inicio(dd);
  teste("a Aptidão de Aura está disponível e a de Maldição não conta", [dd.aptidao.disponiveisConteudo.includes("absorcao_elemental"), dso.aptidao.disponiveisConteudo.includes("absorcao_elemental")], [true, false]);

  // Um ataque elemental real: o recibo vem da confirmação nativa do CL1, nas duas sessões.
  const linha = da.dano.entradas.find((l) => l.id === "arm_espada_curta");
  const ataque = rolarTeste({ rotulo: linha.nome, tipoTeste: "ataque", linhaArma: linha, bonus: linha.acerto }, () => 0.7);
  const dano = rolarDano({ rotulo: linha.nome, linhaArma: linha, grupos: linha.gruposDano }, () => 0.999);
  const conf = confirmaAtaqueConteudo(S.registraRolagem(S.registraRolagem(sa, ataque), dano), da, sd, dd, { ataqueId: ataque.id, danoId: dano.id, alvoId: "def", inimigo: true }, p());
  if (!conf.aplicado) throw Error(conf.erro);
  const alvo = conf.sessaoAlvo, atacante = conf.sessao;
  const recibos = A.recibosElementais(alvo, "def");
  teste("só o dano elemental que passou pela RD é recibo, o físico não", recibos.map((r) => [r.ataqueId === ataque.id, r.tipoDano, r.final > 0]), [[true, "queimante", true]]);
  teste("a sessão do atacante guarda o mesmo registro e não o reconhece como alvo", [A.recibosElementais(atacante, "atk"), A.recibosElementais(alvo, "atk"), A.recibosElementais(alvo, null)], [[], [], []]);

  const entrada = { ataqueId: ataque.id, tipoDano: "queimante", meuId: "def" };
  const ab = A.absorveElemental(alvo, dd, entrada, p());
  if (!ab.aplicado) throw Error(ab.erro);
  teste("não reduz o dano: PV, casca e Alma idênticos aos de antes", [ab.sessao.hpAtual, ab.sessao.almaAtual, S.pvTempTotal?.(ab.sessao) ?? 0], [alvo.hpAtual, alvo.almaAtual, S.pvTempTotal?.(alvo) ?? 0]);
  teste("gasta a Reação e nenhum PE", [ab.sessao.uso.acoes.reacoes.absorcao_elemental, ab.sessao.peAtual, ab.custo.pe.pedido], [alvo.rodada, alvo.peAtual, 0]);
  teste("guarda o tipo absorvido no estado de combate", ab.sessao.combate.absorcaoElemental, "queimante");
  teste("pendência de CL1 que qualquer ataque de arma ou desarmado consome, ligada ao uso ativo", ab.sessao.uso.pendencias.map((x) => [x.id, x.usoId, x.consome, x.estado, x.elegivel.qualquer, x.elegivel.exceto, x.expira]),
    [["absorcao_elemental", "absorcao_elemental", "declaracao", "absorcaoElemental", [], ["feitico"], null]]);
  teste("o uso ativo dura até o descanso e é de combate", [ab.sessao.uso.ativos.absorcao_elemental.duracao.tipo, ab.sessao.uso.ativos.absorcao_elemental.emCombate], ["descanso", true]);
  teste("carga guardada lida do estado e da pendência", A.cargaDeAbsorcao(ab.sessao), { tipo: "queimante" });
  teste("grupo de dano da carga: X = Nível de Aptidão em Aura 3, d8, mesmo tipo", A.grupoDeAbsorcaoPendente(ab.sessao, dd),
    { nome: "Absorção Elemental", dados: 3, faces: 8, fixo: 0, momento: "durante", multiplica: true, tipoDano: "queimante" });
  teste("sem carga não há grupo", A.grupoDeAbsorcaoPendente(alvo, dd), null);
  teste("repetir a identidade é inerte", A.absorveElemental(ab.sessao, dd, entrada, { opId: ab.sessao.uso.ops.find((o) => o.tipo === "uso").id }).repetida, true);

  // Não cumulativa: a segunda absorção é recusada ANTES de gastar a Reação.
  const outraRodada = S.proximaRodada(ab.sessao, dd).sessao;
  const segunda = A.absorveElemental(outraRodada, dd, entrada, p());
  teste("a Reação não alcança o dano de uma rodada anterior", [segunda.aplicado, segunda.erro, segunda.sessao === outraRodada], [false, "Falta Dano Elemental Recebido", true]);
  teste("o dano de uma rodada anterior também não aparece como recibo", [A.recibosElementais(alvo, "def").length, A.recibosElementais(outraRodada, "def").length], [1, 0]);
  const ataque2 = rolarTeste({ rotulo: linha.nome, tipoTeste: "ataque", linhaArma: linha, bonus: linha.acerto }, () => 0.7);
  const dano2 = rolarDano({ rotulo: linha.nome, linhaArma: linha, grupos: linha.gruposDano }, () => 0.999);
  const conf2 = confirmaAtaqueConteudo(S.registraRolagem(S.registraRolagem(S.proximaRodada(sa, da).sessao, ataque2), dano2), da, outraRodada, dd,
    { ataqueId: ataque2.id, danoId: dano2.id, alvoId: "def", inimigo: true }, p());
  if (!conf2.aplicado) throw Error(conf2.erro);
  const reacoesAntes = JSON.stringify(conf2.sessaoAlvo.uso.acoes.reacoes);
  const cumul = A.absorveElemental(conf2.sessaoAlvo, dd, { ataqueId: ataque2.id, tipoDano: "queimante", meuId: "def" }, p());
  teste("com uma carga guardada, outra absorção é recusada e a Reação não é gasta",
    [cumul.aplicado, cumul.erro, JSON.stringify(cumul.sessao.uso.acoes.reacoes) === reacoesAntes, cumul.sessao.combate.absorcaoElemental], [false, "Já Existe uma Carga Guardada", true, "queimante"]);

  // Recusas por elegibilidade, todas devolvendo a MESMA sessão.
  const recusado = (r, erro) => [r.aplicado, r.erro, r.sessao === alvo];
  teste("tipo que não foi recebido", recusado(A.absorveElemental(alvo, dd, { ...entrada, tipoDano: "ct" }, p())), [false, "Falta Dano Elemental Recebido", true]);
  teste("ataque desconhecido", recusado(A.absorveElemental(alvo, dd, { ...entrada, ataqueId: "nada" }, p())), [false, "Falta Dano Elemental Recebido", true]);
  teste("outro participante não absorve o dano do alvo", recusado(A.absorveElemental(alvo, dd, { ...entrada, meuId: "atk" }, p())), [false, "Falta Dano Elemental Recebido", true]);
  teste("sem a Aptidão", recusado(A.absorveElemental(alvo, dsem, entrada, p())), [false, "Absorção Elemental Indisponível", true]);
  teste("a Absorção Elemental de Maldição não dispara a de Aura", recusado(A.absorveElemental(alvo, dso, entrada, p())), [false, "Absorção Elemental Indisponível", true]);
  teste("sem identidade de operação", recusado(A.absorveElemental(alvo, dd, entrada, {})), [false, "Sem Identidade da Operação", true]);
  const fora = S.sessaoEmBranco(dd);
  teste("fora de combate a Reação não existe", A.absorveElemental({ ...fora, rodada: alvo.rodada, log: alvo.log }, dd, entrada, p()).erro, "Pede Em Combate");
  const atordoado = { ...alvo, condicoes: [...(alvo.condicoes ?? []), "Atordoado"] };
  const impedido = A.absorveElemental(atordoado, dd, entrada, p());
  teste("condição que impede reações recusa sem gastar", [impedido.aplicado, impedido.erro, impedido.sessao === atordoado], [false, "Atordoado Impede", true]);
  const usada = { ...alvo, especializacaoSessao: { ...alvo.especializacaoSessao, reacoesGastas: 1 } };
  const semReacao = A.absorveElemental(usada, dd, entrada, p());
  teste("a Reação da rodada já gasta recusa e nada é armado", [semReacao.aplicado, semReacao.erro, semReacao.sessao === usada], [false, "Sem Reação Disponível", true]);
  const zero = deriveAfty({ ...def, aptidoes: { cl: 0, er: 0, au: 0, dom: 0, bar: 0 } });
  teste("Nível de Aptidão em Aura 0 não rende dado", A.absorveElemental(alvo, { ...zero, aptidao: { ...zero.aptidao, disponiveisConteudo: ["absorcao_elemental"] } }, entrada, p()).erro, "Nível de Aptidão em Aura 0: Sem Dados");

  // O consumo é o do CL1: errar também gasta (consome: "declaracao"), e qualquer categoria de ataque a serve.
  const consome = (ataque) => registraAtaqueRealizado(ab.sessao, dd, ataque, p());
  const erro = consome({ acertou: false, categorias: ["arma"], alvo: { id: "atk" } });
  teste("errar um ataque gasta a carga e o estado volta a desligado", [erro.consumidas, erro.sessao.uso.pendencias.length, erro.sessao.combate.absorcaoElemental, A.cargaDeAbsorcao(erro.sessao)], [["absorcao_elemental"], 0, false, null]);
  const acerto = consome({ acertou: true, categorias: ["desarmado"], alvo: { id: "atk" } });
  teste("acertar um ataque desarmado também gasta", [acerto.consumidas, acerto.sessao.combate.absorcaoElemental], [["absorcao_elemental"], false]);
  const feitico = consome({ acertou: true, categorias: ["feitico"], alvo: { id: "atk" } });
  teste("ataque de Feitiço não gasta a carga até o autor responder (D3), porque o dado só entra no golpe de arma", [feitico.consumidas, A.cargaDeAbsorcao(feitico.sessao)], [[], { tipo: "queimante" }]);
  const depois = A.absorveElemental(erro.sessao, dd, entrada, p());
  teste("depois de gasta a carga o mesmo recibo continua absorvido", [depois.aplicado, depois.erro], [false, "Este Dano Já Foi Absorvido"]);

  // Prazo: sem expiração própria. CL1 limpa no fim do combate e no descanso, e a decisão do prazo está aberta.
  teste("a virada de rodada não expira a carga", A.cargaDeAbsorcao(S.proximaRodada(ab.sessao, dd).sessao), { tipo: "queimante" });
  const fim = S.aplicaPatchCombate(ab.sessao, { ativo: false });
  teste("o fim do combate limpa a pendência, o uso ativo E o estado", [fim.uso.pendencias.length, Object.keys(fim.uso.ativos), fim.combate.absorcaoElemental], [0, [], false]);
  const descansada = S.descansar(ab.sessao, dd);
  teste("descansar limpa a pendência, o uso ativo E o estado", [descansada.uso.pendencias.length, Object.keys(descansada.uso.ativos), descansada.combate.absorcaoElemental], [0, [], false]);
  teste("um combate novo não herda a carga", [A.cargaDeAbsorcao(S.iniciaCombate(fim, dd)), S.iniciaCombate(fim, dd).combate.absorcaoElemental], [null, false]);
  teste("a carga gasta também desliga o estado pelo uso ativo", [erro.sessao.combate.absorcaoElemental, Object.keys(erro.sessao.uso.ativos)], [false, []]);
  teste("o recibo já gasto não rende outra carga depois do desligamento pelo uso ativo", (() => {
    const novo = A.absorveElemental(erro.sessao, dd, entrada, p());
    return [novo.aplicado, novo.erro];
  })(), [false, "Este Dano Já Foi Absorvido"]);

  // Salvar e recarregar preserva a carga e o tipo.
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(ab.sessao)), dd);
  teste("recarregar conserva a carga", A.cargaDeAbsorcao(lida), { tipo: "queimante" });
  // A conta do derive não pode cair com o estado novo em combate, mesmo antes de o patch ligá-lo.
  teste("o derive aceita o estado extra", typeof deriveAfty({ ...def, combate: ab.sessao.combate, buffsSessao: ab.sessao.buffs }).dano, "object");

  // Ponta a ponta. Só roda depois que o patch de afty-combate-aptidoes.js (entrega CX3-aptidoes-treinos.md) entrar:
  // o estado `absorcaoElemental` passa a existir no derive e o grupo de dano entra na linha da arma.
  if (dd.combate.estadosExtras.some((e) => e.id === "absorcaoElemental")) {
    const comCarga = (sessao) => deriveAfty({ ...def, combate: sessao.combate, buffsSessao: sessao.buffs });
    const grupo = (derivado) => derivado.dano.entradas.find((l) => l.id === "arm_espada_curta").gruposDano.find((g) => g.nome === "Absorção Elemental");
    teste("o estado aceita só tipos elementais", dd.combate.estadosExtras.find((e) => e.id === "absorcaoElemental").opcoes.map((o) => o.id).sort(), tiposElementaisIds().sort());
    teste("com a carga o golpe ganha Xd6 do tipo absorvido (d8 no nível 3), dobrando no crítico", (({ dados, faces, tipoDano, multiplica, momento }) => [dados, faces, tipoDano, multiplica, momento])(grupo(comCarga(ab.sessao))),
      [3, 8, "queimante", true, "durante"]);
    teste("a Aura Elemental própria continua no mesmo golpe", deriveAfty({ ...def, combate: ab.sessao.combate }).dano.entradas.find((l) => l.id === "arm_espada_curta").gruposDano.some((g) => g.nome === "Aura Elemental"), true);
    teste("depois de gasta a carga o dado some", grupo(comCarga(erro.sessao)) ?? null, null);
    teste("o fim do combate não deixa o dado para o combate seguinte", grupo(comCarga(S.iniciaCombate(S.aplicaPatchCombate(ab.sessao, { ativo: false }), dd))) ?? null, null);
    teste("o descanso também não", grupo(comCarga(S.iniciaCombate(S.descansar(ab.sessao, dd), dd))) ?? null, null);
    teste("o tipo gravado que não é elemental é ignorado", grupo(comCarga({ ...ab.sessao, combate: { ...ab.sessao.combate, absorcaoElemental: "ct" } })) ?? null, null);
    teste("sem a Aptidão o estado gravado não faz nada", deriveAfty({ ...semApt, combate: ab.sessao.combate }).dano.entradas.find((l) => l.id === "arm_espada_curta").gruposDano.some((g) => g.nome === "Absorção Elemental"), false);
    const nivel5 = deriveAfty({ ...def, aptidoes: { ...def.aptidoes, au: 5 }, combate: ab.sessao.combate });
    teste("nível 5 vira 5d10", (({ dados, faces }) => [dados, faces])(grupo(nivel5)), [5, 10]);
    e2e++;
  } else if (!avisouSemPatch) {
    avisouSemPatch = true;
    console.log("Aviso: patch de afty-combate-aptidoes.js ainda não aplicado, a prova de ponta a ponta da Absorção Elemental foi pulada.");
  }
}

if (erros.length) { console.error(erros.join("\n")); process.exitCode = 1; } else console.log("TODOS OS " + ok + " ASSERTS PASSARAM");
