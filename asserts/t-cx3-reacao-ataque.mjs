import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { encerraCobrirSe, reacoesAoDano } = await import(R + "ficha/ficha-conteudo-reacoes.js");
const { abreConcentracaoNaSessao } = await import(R + "ficha/ficha-uso-estado.js");
const { encerraUso } = await import(R + "ficha/ficha-uso.js");
const { gastaAcao } = await import(R + "ficha/ficha-acoes.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const S = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
function ficha(sistema, classe = "combatente") {
  const c = createBlankAfty();
  c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: classe, nivel: 12 }];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }];
  return c;
}
const inicia = (d) => S.iniciaTurnoFicha(S.iniciaCombate({ ...S.sessaoEmBranco(d), rodada: 1 }, d), d);
const atual = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const turnoEmCurso = { id: "origem", rodada: 1, turno: 1 };
const mesa = { origemId: "origem", turnoEmCurso };
const entrada = { ataqueId: "acerto", danoId: "dano", alvoId: "alvo", mesa };
const pedido = { opId: "confirma" };

aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema), d = deriveAfty(c), linha = d.dano.entradas.find((l) => l.id === "arm_espada_curta");
  const arma = { armaId: linha.id, chaveArma: linha.chaveArma };
  const ataque = { ...arma, id: "acerto", tipo: "teste", tipoTeste: "ataque", rotulo: linha.nome, ts: 1,
    total: 100, natural: 18, d20: [18], critico: false, contextoTurno: { emCurso: turnoEmCurso } };
  const dano = { ...arma, id: "dano", tipo: "dano", ts: 2, critico: false, total: 42,
    gruposRolados: [{ tipoDano: "ct", total: 20 }, { tipoDano: "im", total: 22 }] };
  const s = { ...inicia(d), log: [dano, ataque] };
  const ca = ficha(sistema);
  ca.habilidades = ["cmb_assumir_postura"];
  ca.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_lua", "cmb_postura_do_sol"] };
  ca.aptidoes.cl = 2;
  ca.aptidoesAmaldicoadas = ["cobrir_se", "cobertura_avancada"];
  const base = deriveAfty(ca);
  let sa = inicia(base);
  sa = S.alteraEstadoCombate(sa, { id: "postura" }, "lua");
  sa = abreConcentracaoNaSessao({ ...sa, pvTempFontes: { Outra: 2 } }, { id: "teste", nome: "Teste" });
  const da = atual(ca, sa), snapshot = JSON.stringify([s, sa]);
  const confirma = (e = {}, alvo = sa, atacante = s, derivado = da, p = pedido) =>
    confirmaAtaqueConteudo(atacante, d, alvo, derivado, { ...entrada, ...e }, p);
  const aberta = confirma();
  t(`${sistema} consulta não confirma nem modifica as sessões`, [aberta.aplicado, aberta.sessao === s, JSON.stringify([s, sa])], [false, true, snapshot]);
  t(`${sistema} opções e tipos reais`, aberta.janelaReacao?.opcoes.map((o) => [o.id, o.tipos?.map((x) => x.tipo)]), [["lua", ["ct", "im"]], ["cobrir", undefined]]);
  const chave = aberta.janelaReacao?.chave;
  const responde = (id, extra = {}, e = {}, alvo = sa) => confirma({ ...e, janelaReacao: { id, chave, ...extra } }, alvo);
  for (const [nome, result] of [
    ["opção inválida", responde("inventada")],
    ["tipo inválido", responde("lua", { tipo: "pf" })],
    ["PE acima do limite", responde("cobrir", { pe: 7 })],
    ["PE fracionário", responde("cobrir", { pe: 2.5 })],
    ["outro alvo", responde("lua", { tipo: "im" }, { alvoId: "outro" })],
    ["turno vencido", responde("lua", { tipo: "im" }, { mesa: { ...mesa, turnoEmCurso: { ...turnoEmCurso, turno: 2 } } })],
    ["reação gasta", responde("lua", { tipo: "im" }, {}, gastaAcao(sa, da, "reacao", { id: "outra" }).sessao)],
  ]) t(`${sistema} recusa ${nome} sem aplicar`, [result.aplicado, result.sessao === s, !!result.erro], [false, true, true]);
  const passou = responde("passar"), lua = responde("lua", { tipo: "im" });
  if (!passou.aplicado || !lua.aplicado) throw Error(passou.erro ?? lua.erro ?? "Sem Confirmação");
  t(`${sistema} passar mantém dano e reação`, [passou.calculos.map((x) => x.base), passou.sessaoAlvo.especializacaoSessao?.reacoesGastas ?? 0], [[20, 22], 0]);
  t(`${sistema} Lua reduz uma parcela líquida e conserva o outro tipo`, lua.calculos.map((x) => x.final),
    [passou.calculos[0].final, Math.max(0, passou.calculos[1].final - 12)]);
  t(`${sistema} Lua gasta reação CL1 sem PE`, [lua.sessaoAlvo.especializacaoSessao.reacoesGastas, lua.sessaoAlvo.peAtual], [1, sa.peAtual]);
  t(`${sistema} ataque resolvido não reabre por nova operação`, confirma({}, lua.sessaoAlvo, lua.sessao, da, { opId: "outro" }).aplicado, false);
  t(`${sistema} repetir operação`, confirma({}, lua.sessaoAlvo, lua.sessao).repetida, true);
  const cobriu = responde("cobrir", { pe: 6 });
  if (!cobriu.aplicado) throw Error(cobriu.erro ?? "Sem Cobertura");
  const sc = cobriu.sessaoAlvo;
  t(`${sistema} Cobertura Avançada entrega casca e paga uma vez`, [cobriu.sessao.log[0].reacaoDano.pv, sa.peAtual - sc.peAtual, sc.especializacaoSessao.reacoesGastas], [48, 6, 1]);
  t(`${sistema} CL1 drena a casca antes da vida e mantém a conta por tipo`, [sc.hpAtual, cobriu.calculos.map((x) => x.final)], [sa.hpAtual - Math.max(0, passou.calculos.reduce((n, g) => n + g.final, 0) - 50), passou.calculos.map((x) => x.final)]);
  t(`${sistema} concentrar recebe o dano que passou pela reação`, sc.uso.teste?.causa, "dano");
  const salvo = S.normalizaSessao(JSON.parse(JSON.stringify(sc)), da), mesaSalva = [{ id: "alvo", sessao: salvo }];
  t(`${sistema} casca e origem persistem`, [salvo.pvTempFontes, salvo.uso.ativos.cobrir_se?.parametros.fonteId], [sc.pvTempFontes, "origem"]);
  t(`${sistema} fim de outro turno preserva`, encerraCobrirSe(mesaSalva, "outro")[0].sessao === salvo, true);
  t(`${sistema} fim do turno certo remove a casca`, encerraCobrirSe(mesaSalva, "origem")[0].sessao.pvTempFontes["Cobrir-se"], undefined);
  t(`${sistema} encerramento nativo remove a casca`, encerraUso(salvo, da, "cobrir_se", { opId: "encerra" }).sessao.pvTempFontes["Cobrir-se"], undefined);
  const imune = { ...da, defesasDano: { porTipo: { ct: { estados: ["imune"] }, im: { estados: ["imune"] } } } };
  t(`${sistema} imunidade a ambos os tipos não abre janela`, confirma({}, sa, s, imune).janelaReacao, undefined);
  const semTurno = confirma({ mesa: null });
  t(`${sistema} chamada antiga conserva resultado sem janela`, [semTurno.aplicado, semTurno.calculos.map((x) => x.final)], [true, passou.calculos.map((x) => x.final)]);
  const danoDeTeste = [{ modo: "dano", tipo: "ct", calculo: { final: 4 } }];
  t(`${sistema} Cobrir-se exige turno da fonte`, reacoesAoDano(sa, da, { ...mesa, origemId: "terceiro", danos: danoDeTeste }).map((o) => o.id), ["lua"]);
  t(`${sistema} Alma não usa a casca nem abre janela`, reacoesAoDano(sa, da, { ...mesa, danos: [{ ...danoDeTeste[0], modo: "alma" }] }), []);

  const lutador = ficha(sistema, "lutador");
  lutador.habilidades = ["lut_aparar_ataque"];
  lutador.aptidoes.cl = 2;
  lutador.aptidoesAmaldicoadas = ["cobrir_se"];
  const dl = deriveAfty(lutador), sl = inicia(dl);
  const atacante = { ...s, log: [{ ...dano, critico: true }, { ...ataque, total: 24, natural: 20, d20: [20], critico: true }] };
  const tenta = (e, alvo = sl, fonte = atacante, p = pedido) =>
    confirmaAtaqueConteudo(fonte, d, alvo, dl, { ...entrada, ...e }, p);
  const antes = tenta({ danoId: "" });
  t(`${sistema} etapa do acerto abre antes de exigir dano`, [antes.aplicado, antes.janelaReacao?.etapa], [false, "ataque"]);
  const janela = tenta({}).janelaReacao;
  const armaDeParada = janela.opcoes[0].armas.find((a) => a.nome === "Espada Curta").chave;
  const aparar = { id: "apararAtaque", chave: janela.chave, arma: armaDeParada };
  t(`${sistema} descartar a etapa leva à reação de dano`, tenta({ janelaAntesDoAcerto: { id: "passar", chave: janela.chave } })
    .janelaReacao?.opcoes.map((o) => o.id), ["cobrir"]);
  t(`${sistema} rejeita arma inválida`, tenta({ janelaAntesDoAcerto: { ...aparar, arma: "outra" } }).aplicado, false);
  t(`${sistema} rejeita a etapa com reação gasta`, tenta({ janelaAntesDoAcerto: aparar },
    gastaAcao(sl, dl, "reacao", { id: "outra" }).sessao).aplicado, false);
  const parou = tenta({ janelaAntesDoAcerto: aparar, rngReacao: () => 0.99 });
  t(`${sistema} aparar vence o ataque e mantém os PV`, [parou.ataque?.motivo, parou.sessaoAlvo?.hpAtual, parou.calculos], ["aparado", sl.hpAtual, []]);
  t(`${sistema} aparar usa a mesma reação e desconta 1 PE`, [parou.sessaoAlvo?.especializacaoSessao.reacoesGastas,
    parou.sessaoAlvo?.peAtual], [1, sl.peAtual - 1]);
  t(`${sistema} confirmar o ataque aparado de novo recusa`, tenta({ janelaAntesDoAcerto: aparar },
    parou.sessaoAlvo, parou.sessao, { opId: "outra" }).aplicado, false);
  const extra = { ...sl, especializacaoSessao: { ...sl.especializacaoSessao, reacoesExtras: 1 } };
  const pendente = tenta({ janelaAntesDoAcerto: aparar, rngReacao: () => { throw Error("Rolou Antes da Escolha"); } }, extra);
  t(`${sistema} segunda reação é condicional e ainda sem escrita`, [pendente.aplicado, pendente.sessao === atacante,
    pendente.janelaReacao?.condicional], [false, true, true]);
  const junto = { janelaAntesDoAcerto: aparar, janelaReacao: { id: "cobrir", pe: 1, chave: pendente.janelaReacao.chave } };
  const defendeu = tenta({ ...junto, rngReacao: () => 0.99 }, extra);
  const falhou = tenta({ ...junto, rngReacao: () => 0 }, extra);
  t(`${sistema} com parada bem-sucedida não gasta cobertura`, [defendeu.ataque?.acertou, defendeu.sessaoAlvo?.peAtual], [false, sl.peAtual - 1]);
  t(`${sistema} na falha usa o saldo da reação de dano`, [falhou.ataque?.acertou, falhou.sessaoAlvo?.peAtual,
    falhou.sessaoAlvo?.especializacaoSessao.reacoesGastas, falhou.sessao.log[0].reacaoDano?.id], [true, sl.peAtual - 2, 2, "cobrir"]);

  c.aptidoes.cl = 3;
  c.aptidoesAmaldicoadas = ["raio_negro"];
  const dr = deriveAfty(c);
  const acertou = { ...ataque, natural: 20, d20: [20], critico: true };
  const grupos = [
    { nome: "Arma", tipoDano: "ct", dados: 1, faces: 6, fixo: 2, multiplica: true, momento: "durante" },
    { nome: "Aura", tipoDano: "queimante", dados: 1, faces: 6, multiplica: true, momento: "durante" },
    { nome: "Após", tipoDano: "ct", dados: 1, faces: 6, multiplica: false, momento: "apos" },
  ];
  const rolaRaio = (rng) => rolarDano({ linhaArma: linha, modoDano: "raio_negro", grupos }, rng);
  const raio = rolaRaio(() => 0);
  const defesaRaio = { ...da, defesasDano: { porTipo: {
    ct: { estados: ["resistente"], rd: 10 }, queimante: { estados: ["imune"], rd: 10 },
  } } };
  const confirmaRaio = (danoRaio, ataqueRaio = acertou, derivado = dr) =>
    confirmaAtaqueConteudo({ ...s, log: [danoRaio, ataqueRaio] }, derivado, sa, defesaRaio,
      { ...entrada, mesa: null, danoId: danoRaio.id }, pedido);
  const r = confirmaRaio(raio);
  t(`${sistema} Raio Negro conserva o total e mantém os tipos do Dano Após Ataque`,
    [raio.total, r.calculos?.map((g) => [g.tipoDano, g.base])], [9, [["ct", 6], ["queimante", 3]]]);
  t(`${sistema} Raio Negro ignora Resistência e RD, preserva Imunidade e derruba Guarda`,
    [r.calculos?.map((g) => g.final), r.sessaoAlvo?.guardaEncerrada, r.ataque?.raioNegro], [[6, 0], true, true]);
  t(`${sistema} exige acesso à Aptidão e d20 elegível`,
    [confirmaRaio(raio, acertou, d).aplicado, confirmaRaio(raio, { ...acertou, natural: 18 }).aplicado], [false, false]);
  const antigos = raio.gruposRolados.map(({ subtotalRaioNegro: _, ...g }) => g);
  t(`${sistema} recibo antigo misto é recusado`, confirmaRaio({ ...raio, gruposRolados: antigos }).erro,
    "Raio Negro Misto sem Recibo dos Dados Critáveis");
  t(`${sistema} recibo antigo de tipo único aplica o total gravado`,
    confirmaRaio({ ...raio, gruposRolados: antigos.map((g) => ({ ...g, tipoDano: "ct" })) }).calculos?.map((g) => g.base), [raio.total]);
  let i = 0;
  const resto = confirmaRaio(rolaRaio(() => [0, 0.2, 0, 0.2, 0][i++]));
  t(`${sistema} resto sem tipo definido conserva ambas as sessões`, [resto.aplicado, resto.sessaoAlvo, resto.erro],
    [false, undefined, "Raio Negro Misto com Resto Requer Resolução na Mesa"]);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
