import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { rolaManobraDeBriga, aplicaManobraDeBriga } = await import(R + "ficha/ficha-conteudo-manobras.js");
const { rolaSorte, escolheSorte } = await import(R + "ficha/ficha-conteudo-uso.js");
const { usa } = await import(R + "ficha/ficha-uso.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `cx3-briga-${++seq}`, registraAcao: true });
function ficha(sistema, id, briga = true) {
  const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 20;
  c.attrMethod = "fixos"; c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { atletismo: briga ? "mestre" : "treinado", acrobacia: "treinado", feiticaria: "treinado" };
  c.talentos = [...(briga ? ["tal_adepto_de_briga"] : []), "tal_favorecido_pela_sorte"];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
function acerto(c, ca, { danoZero = true, arma = "basico", rngAtaque = () => 0.999 } = {}) {
  if (arma !== "basico") c = { ...c, equipamentos: { ...c.equipamentos, itens: [{ uid: "espada", tipo: "arma", refId: arma, qtd: 1, equipado: true }] } };
  if (danoZero) ca = { ...ca, buffsSessao: [...(ca.buffsSessao ?? []), { id: "protecao", nome: "Proteção de Teste", canal: "rdGeral", expr: "1000" }] };
  const d = deriveAfty(c), da = deriveAfty(ca), linha = d.dano.entradas.find((l) => l.id === arma);
  let s = S.iniciaCombate(S.sessaoEmBranco(d), d), sa = S.iniciaCombate(S.sessaoEmBranco(da), da);
  const ataque = rolarTeste({ rotulo: linha.nome, bonus: linha.acerto, margem: linha.margemCritico, tipoTeste: "ataque", linhaArma: linha }, rngAtaque);
  const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: ataque.critico, linhaArma: linha }, () => 0.2);
  s = S.registraRolagem(S.registraRolagem(s, ataque), dano);
  const r = confirmaAtaqueConteudo(s, d, sa, da, { ataqueId: ataque.id, danoId: dano.id, alvoId: ca.id }, p());
  if (!r.aplicado) throw new Error(r.erro);
  return { s: r.sessao, sa: r.sessaoAlvo, d, da, ataque, dano };
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema, "briga"), ca = ficha(sistema, "alvo", false);
  const f = acerto(c, ca), { s, sa, d, da, ataque } = f;
  t(`${sistema} talento e orçamento admissíveis`, [d.talentos.inacessiveis, d.habilidades.excedeu, d.testes.orcamento.excedeu], [[], false, false]);
  t(`${sistema} dano zero vem da confirmação real`, s.log.find((r) => r.rotulo === "Ataque Confirmado").calculos.every((v) => v.final === 0), true);
  const entrada = { ataqueId: ataque.id, alvoId: ca.id, manobra: "derrubar", periciaAlvo: "acrobacia", rngAtacante: () => 0.999, rngAlvo: () => 0 };
  const pedido = p(), r = rolaManobraDeBriga(s, d, sa, da, entrada, pedido);
  if (!r.aplicado) throw new Error(`${sistema}: ${r.erro}`);
  t(`${sistema} metade de BT somente no teste da manobra`, r.atacante.bonus, d.testes.manobras.find((m) => m.id === "derrubar").executar + Math.floor(d.maestria / 2));
  t(`${sistema} defesa usa a perícia escolhida`, [r.alvo.periciaId, r.alvo.bonus], ["acrobacia", da.testes.pericias.find((l) => l.id === "acrobacia").bonus]);
  t(`${sistema} fonte do talento no teste`, r.atacante.fontes.at(-1), { label: "Adepto de Briga", valor: Math.floor(d.maestria / 2) });
  t(`${sistema} rolar ainda não derruba`, r.sessaoAlvo.condicoes, sa.condicoes);
  t(`${sistema} ação livre nativa, sem PE/comum/bônus`, [r.sessao.uso.acoes.livres.tal_adepto_de_briga, r.sessao.peAtual, r.sessao.uso.acoes.gastas], [s.rodada, s.peAtual, s.uso.acoes.gastas]);
  t(`${sistema} idempotência da rolagem`, rolaManobraDeBriga(r.sessao, d, r.sessaoAlvo, da, entrada, pedido).repetida, true);
  t(`${sistema} não troca manobra para repetir o mesmo acerto`, rolaManobraDeBriga(r.sessao, d, r.sessaoAlvo, da, { ...entrada, manobra: "empurrar" }, p()).aplicado, false);
  const resultadoPedido = p(), fim = aplicaManobraDeBriga(r.sessao, d, r.sessaoAlvo, da, entrada, resultadoPedido);
  t(`${sistema} sucesso derruba só na aplicação`, [fim.aplicado, fim.resistiu, fim.sessaoAlvo.condicoes.at(-1).nome], [true, false, "Caído"]);
  t(`${sistema} ambos testes têm consequência`, [fim.sessao.log.find((v) => v.id === r.atacante.id).consequenciasAplicadas, fim.sessaoAlvo.log.find((v) => v.id === r.alvo.id).consequenciasAplicadas], [true, true]);
  t(`${sistema} aplicação idempotente`, aplicaManobraDeBriga(fim.sessao, d, fim.sessaoAlvo, da, entrada, resultadoPedido).repetida, true);
  t(`${sistema} nova operação não duplica Caído`, aplicaManobraDeBriga(fim.sessao, d, fim.sessaoAlvo, da, entrada, p()).aplicado, false);
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d), lidaAlvo = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessaoAlvo)), da);
  t(`${sistema} pode concluir depois de salvar`, aplicaManobraDeBriga(lida, d, lidaAlvo, da, entrada, p()).aplicado, true);
  t(`${sistema} salvar mantém o vínculo e fonte`, lida.log.find((v) => v.id === r.atacante.id), r.atacante);
  for (const [nome, ee] of [["outro alvo", { alvoId: "vizinho" }], ["outro ataque", { ataqueId: "qualquer" }], ["manobra sem núcleo", { manobra: "agarrar" }], ["outra perícia", { periciaAlvo: "medicina" }]]) {
    const erro = rolaManobraDeBriga(s, d, sa, da, { ...entrada, ...ee }, p());
    t(`${sistema} ${nome} recusa sem consumo`, [erro.aplicado, erro.sessao === s], [false, true]);
  }
  t(`${sistema} não aplica antes de rolar`, aplicaManobraDeBriga(s, d, sa, da, entrada, p()).sessao === s, true);
  t(`${sistema} turno encerrado invalida o acerto`, rolaManobraDeBriga(S.iniciaTurnoFicha(s, d), d, sa, da, entrada, p()).aplicado, false);
  t(`${sistema} atributo/requisito do Talento continua válido`, rolaManobraDeBriga(s, deriveAfty({ ...c, pericias: { ...c.pericias, atletismo: "treinado" } }), sa, da, entrada, p()).sessao === s, true);
  const impedida = S.defineCondicoes(s, [{ id: "inconsciente", nome: "Inconsciente" }]);
  t(`${sistema} inconsciente não age`, rolaManobraDeBriga(impedida, d, sa, da, entrada, p()).sessao === impedida, true);
  for (const op of [{ danoZero: false }, { arma: "arm_espada_longa" }, { rngAtaque: () => 0 }]) {
    const neg = acerto(c, ca, op);
    t(`${sistema} sem gatilho ${JSON.stringify(Object.keys(op))}`, rolaManobraDeBriga(neg.s, neg.d, neg.sa, neg.da, { ...entrada, ataqueId: neg.ataque.id }, p()).sessao === neg.s, true);
  }
  const foco = usa(sa, da, { id: "foco", nome: "Foco", duracao: { ate: "cena" }, concentracao: true }, p()).sessao;
  const emp = rolaManobraDeBriga(s, d, foco, da, { ...entrada, manobra: "empurrar" }, p());
  const empFim = aplicaManobraDeBriga(emp.sessao, d, emp.sessaoAlvo, da, entrada, p());
  const margem = emp.atacante.total - emp.alvo.total;
  t(`${sistema} empurrão usa margem e base nativa`, empFim.distancia, d.testes.manobras.find((m) => m.id === "empurrar").distancia + 1.5 * Math.floor(margem / 5));
  t(`${sistema} empurrão ameaça concentração com Atletismo do responsável`, [empFim.sessaoAlvo.uso.teste.cd, empFim.sessaoAlvo.uso.teste.causa, empFim.sessaoAlvo.uso.concentracao.id], [10 + d.testes.pericias.find((l) => l.id === "atletismo").bonus, "empurrado", "foco"]);
  t(`${sistema} empurrar não aplica Caído`, empFim.sessaoAlvo.condicoes, sa.condicoes);
  const ruim = rolaManobraDeBriga(s, d, foco, da, { ...entrada, manobra: "empurrar", rngAtacante: () => 0, rngAlvo: () => 0.999 }, p());
  const resistida = aplicaManobraDeBriga(ruim.sessao, d, ruim.sessaoAlvo, da, entrada, p());
  t(`${sistema} resistiu sem movimento/concentração`, [resistida.resistiu, resistida.distancia, resistida.sessaoAlvo.uso.teste], [true, 0, null]);
  const sorte = rolaSorte(r.sessao, d, { id: r.atacante.id, rng: () => 0.1 }, p());
  if (!sorte.aplicado) throw new Error(sorte.erro);
  t(`${sistema} Sorte pendente impede consequência`, aplicaManobraDeBriga(sorte.sessao, d, r.sessaoAlvo, da, entrada, p()).sessao === sorte.sessao, true);
  const escolhida = escolheSorte(sorte.sessao, d, { id: r.atacante.id, escolha: "original" }, p());
  t(`${sistema} após Sorte conserva vínculo e aplica`, aplicaManobraDeBriga(escolhida.sessao, d, r.sessaoAlvo, da, entrada, p()).aplicado, true);
  const total = r.atacante.total;
  const empate = { ...r.sessaoAlvo, log: r.sessaoAlvo.log.map((v) => v.id === r.alvo.id ? { ...v, total } : v) };
  t(`${sistema} empate mantém a situação`, aplicaManobraDeBriga(r.sessao, d, empate, da, entrada, p()).resistiu, true);
  const linha = d.dano.entradas.find((l) => l.id === "basico");
  const ataque2 = rolarTeste({ rotulo: linha.nome, bonus: linha.acerto, margem: linha.margemCritico, tipoTeste: "ataque", linhaArma: linha }, () => 0.999);
  const dano2 = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: true, linhaArma: linha }, () => 0.2);
  const pronto2 = S.registraRolagem(S.registraRolagem(fim.sessao, ataque2), dano2);
  const segundo = confirmaAtaqueConteudo(pronto2, d, fim.sessaoAlvo, da, { ataqueId: ataque2.id, danoId: dano2.id, alvoId: ca.id }, p());
  t(`${sistema} outro acerto na rodada não repete a mesma ação livre`, rolaManobraDeBriga(segundo.sessao, d, segundo.sessaoAlvo, da, { ...entrada, ataqueId: ataque2.id }, p()).aplicado, false);
  const ef = acerto({ ...c, buffsSessao: [{ id: "manobra", nome: "Bônus de Manobra", canal: "bonusManobra", alvo: "derrubar", expr: "4" }, { id: "dados", nome: "Dado de Atletismo", canal: "dadosPericia", alvo: "atletismo:d6", expr: "1" }] },
    { ...ca, buffsSessao: [{ id: "resistir", nome: "Resistência à Manobra", canal: "resistirManobra", alvo: "derrubar", expr: "2" }] });
  const extra = rolaManobraDeBriga(ef.s, ef.d, ef.sa, ef.da, { ...entrada, ataqueId: ef.ataque.id }, p());
  t(`${sistema} manobra conserva bônus nativo e dado de perícia`, [extra.atacante.bonus - r.atacante.bonus, extra.atacante.somaExtras], [4, 6]);
  t(`${sistema} resistência própria conserva bônus ao trocar a perícia`, [extra.alvo.bonus - r.alvo.bonus, extra.alvo.fontes.at(-1)], [2, { label: "Resistência à Manobra", valor: 2 }]);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
