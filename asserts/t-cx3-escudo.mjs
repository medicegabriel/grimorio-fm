import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { prepararRolagem } = await import(R + "ficha/abas-g2/rolagem-g2.js");
const { rolaEmpurraoEscudo, aplicaEmpurraoEscudo } = await import(R + "ficha/ficha-conteudo-manobras.js");
const { rolaSorte, escolheSorte, rerrolaDanoTalento } = await import(R + "ficha/ficha-conteudo-uso.js");
const { usa } = await import(R + "ficha/ficha-uso.js");
const { getTalento } = await import(R + "afty-talentos.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `cx3-escudo-${++seq}`, registraAcao: true });
function ficha(sistema, alvo = false) {
  const c = createBlankAfty(); c.id = alvo ? "alvo-escudo" : "escudo"; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { atletismo: alvo ? "treinado" : "mestre", acrobacia: "treinado", feiticaria: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.talentos = alvo ? [] : ["tal_tecnicas_ofensivas_de_escudo", "tal_favorecido_pela_sorte"];
  c.equipamentos.itens = alvo ? [] : [{ uid: "escudo", tipo: "escudo", refId: "esc_medio", qtd: 1, equipado: true }]; return c;
}
function inicio(c, rng = () => 0) {
  const d = deriveAfty(c), ca = ficha(c.rulesVersion, true), da = deriveAfty(ca);
  let s = S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), sa = S.iniciaCombate(S.sessaoEmBranco(da), da);
  const linha = d.dano.entradas.find((l) => l.id === "basico");
  const prova = prepararRolagem({ tipo: "teste", rotulo: linha.nome, bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, { sessao: s, derived: d });
  if (!prova.ok) throw new Error(prova.etapa);
  const ataque = rolarTeste(prova.pronta, rng); s = S.registraRolagem(s, ataque);
  return { d, da, s, sa, ataque };
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema), { d, da, s, sa, ataque } = inicio(c);
  t(`${sistema} escolha e orçamento válidos`, [d.talentos.inacessiveis, d.habilidades.excedeu, d.testes.orcamento.excedeu], [[], false, false]);
  t(`${sistema} título da fonte com id preservado`, getTalento("tal_tecnicas_ofensivas_de_escudo").nome, "Técnicas Agressivas de Escudo");
  t(`${sistema} recibo captura o relógio existente`, [ataque.tipoTeste, ataque.contextoTurno], ["ataque", { rodada: s.rodada, turno: s.uso.acoes.turno }]);
  t(`${sistema} o gatilho deste caso realmente errou`, ataque.sucesso, false);
  const entrada = { ataqueId: ataque.id, alvoId: "alvo-escudo", emSeuTurno: true, emAlcanceEscudo: true, periciaAlvo: "acrobacia", rngAtacante: () => 0.999, rngAlvo: () => 0, escolha: "caido", rng: () => 0.999 };
  const pedido = p(), r = rolaEmpurraoEscudo(s, d, sa, da, entrada, pedido);
  if (!r.aplicado) throw new Error(`${sistema}: ${r.erro}`);
  t(`${sistema} pode empurrar após errar o ataque`, r.aplicado, true);
  t(`${sistema} Ação Bônus sem PE`, [r.sessao.uso.acoes.gastas.bonus, r.sessao.peAtual], [1, s.peAtual]);
  t(`${sistema} empurrão usa o bônus nativo, sem bônus de Briga`, r.atacante.bonus, d.testes.manobras.find((m) => m.id === "empurrar").executar);
  t(`${sistema} defesa escolhe Acrobacia`, r.alvo.periciaId, "acrobacia");
  t(`${sistema} disputa não aplica condição/dano antes da conclusão`, [r.sessaoAlvo.hpAtual, r.sessaoAlvo.condicoes], [sa.hpAtual, sa.condicoes]);
  t(`${sistema} repetir op não cobra de novo`, rolaEmpurraoEscudo(r.sessao, d, r.sessaoAlvo, da, entrada, pedido).repetida, true);
  t(`${sistema} não tenta duas vezes pelo mesmo ataque`, rolaEmpurraoEscudo(r.sessao, d, r.sessaoAlvo, da, entrada, p()).aplicado, false);
  const fimP = p(), fim = aplicaEmpurraoEscudo(r.sessao, d, r.sessaoAlvo, da, entrada, fimP);
  if (!fim.aplicado) throw new Error(`${sistema}: ${fim.erro}`);
  const base = d.testes.manobras.find((m) => m.id === "empurrar").distancia + 1.5 * Math.floor((r.atacante.total - r.alvo.total) / 5);
  t(`${sistema} decisão: Caído preserva empurrão normal com margem`, [fim.distancia, fim.sessaoAlvo.condicoes.at(-1).nome], [base, "Caído"]);
  t(`${sistema} dano próprio do escudo, sem crítico por Atletismo`, [fim.dano.critico, fim.dano.total, fim.calculo.base], [false, d.mods.forca * 6 + d.mods.forca, d.mods.forca * 6 + d.mods.forca]);
  t(`${sistema} o dano passa pelo núcleo vital`, fim.sessaoAlvo.hpAtual, sa.hpAtual - fim.calculo.final);
  t(`${sistema} ambos testes marcam consequências`, [fim.sessao.log.find((l) => l.id === r.atacante.id).consequenciasAplicadas, fim.sessaoAlvo.log.find((l) => l.id === r.alvo.id).consequenciasAplicadas], [true, true]);
  t(`${sistema} resultado idempotente`, aplicaEmpurraoEscudo(fim.sessao, d, fim.sessaoAlvo, da, entrada, fimP).repetida, true);
  t(`${sistema} resultado não duplica por outra operação`, aplicaEmpurraoEscudo(fim.sessao, d, fim.sessaoAlvo, da, entrada, p()).aplicado, false);
  const longe = aplicaEmpurraoEscudo(r.sessao, d, r.sessaoAlvo, da, { ...entrada, escolha: "distancia" }, p());
  t(`${sistema} alternativa soma 4,5m sem Caído`, [longe.distancia, longe.sessaoAlvo.condicoes], [base + 4.5, sa.condicoes]);
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d), alvoLido = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessaoAlvo)), da);
  t(`${sistema} disputa salva pode ser concluída`, aplicaEmpurraoEscudo(lida, d, alvoLido, da, entrada, p()).aplicado, true);
  t(`${sistema} fonte e vínculo da disputa persistem`, lida.log.find((l) => l.id === r.atacante.id), r.atacante);
  const focada = usa(sa, da, { id: "foco-escudo", nome: "Foco", concentracao: true, duracao: { ate: "cena" } }, p()).sessao;
  const rr = rolaEmpurraoEscudo(s, d, focada, da, entrada, p()), ff = aplicaEmpurraoEscudo(rr.sessao, d, rr.sessaoAlvo, da, entrada, p());
  t(`${sistema} empurrão abre concentração por Atletismo`, [ff.sessaoAlvo.uso.teste.cd, ff.sessaoAlvo.uso.teste.causa], [Math.max(10 + d.testes.pericias.find((l) => l.id === "atletismo").bonus, Math.floor(ff.calculo.final / 2)), "empurrado"]);
  const ruim = rolaEmpurraoEscudo(s, d, focada, da, { ...entrada, rngAtacante: () => 0, rngAlvo: () => 0.999 }, p()), resistida = aplicaEmpurraoEscudo(ruim.sessao, d, ruim.sessaoAlvo, da, entrada, p());
  t(`${sistema} defesa bem-sucedida não causa dano/movimento/condição`, [resistida.resistiu, resistida.distancia, resistida.dano, resistida.sessaoAlvo.hpAtual, resistida.sessaoAlvo.condicoes, resistida.sessaoAlvo.uso.teste], [true, 0, null, sa.hpAtual, sa.condicoes, null]);
  for (const [nome, alteracao] of [["fora do próprio turno", { emSeuTurno: false }], ["fora de alcance", { emAlcanceEscudo: false }], ["sem ataque", { ataqueId: "nenhum" }], ["perícia inválida", { periciaAlvo: "medicina" }]]) {
    t(`${sistema} ${nome} não gasta ação`, rolaEmpurraoEscudo(s, d, sa, da, { ...entrada, ...alteracao }, p()).sessao === s, true);
  }
  t(`${sistema} turno encerrado impede uso`, rolaEmpurraoEscudo(S.encerraTurnoFicha(s, d), d, sa, da, entrada, p()).aplicado, false);
  t(`${sistema} turno novo não aceita ataque antigo`, rolaEmpurraoEscudo(S.iniciaTurnoFicha(s, d), d, sa, da, entrada, p()).aplicado, false);
  const semEscudo = deriveAfty({ ...c, equipamentos: { ...c.equipamentos, itens: [] } });
  t(`${sistema} exige o equipamento real`, rolaEmpurraoEscudo(s, semEscudo, sa, da, entrada, p()).sessao === s, true);
  const semTalento = deriveAfty({ ...c, talentos: [] });
  t(`${sistema} exige o talento atual`, rolaEmpurraoEscudo(s, semTalento, sa, da, entrada, p()).sessao === s, true);
  const pendente = rolaSorte(r.sessao, d, { id: r.atacante.id, rng: () => 0.5 }, p());
  t(`${sistema} Sorte pendente impede consequência`, aplicaEmpurraoEscudo(pendente.sessao, d, r.sessaoAlvo, da, entrada, p()).sessao === pendente.sessao, true);
  const escolhida = escolheSorte(pendente.sessao, d, { id: r.atacante.id, escolha: "original" }, p());
  t(`${sistema} Sorte resolvida conserva a disputa`, aplicaEmpurraoEscudo(escolhida.sessao, d, r.sessaoAlvo, da, entrada, p()).aplicado, true);
  t(`${sistema} alvo trocado na conclusão é recusado`, aplicaEmpurraoEscudo(r.sessao, d, r.sessaoAlvo, da, { ...entrada, alvoId: "outro" }, p()).sessao === r.sessao, true);
  const outra = rolaEmpurraoEscudo(s, d, sa, da, { ...entrada, alvoId: "outro-alvo" }, p());
  t(`${sistema} o empurrão pode escolher outro alvo que o ataque`, outra.aplicado, true);
  const linhaEscudo = d.dano.entradas.find((l) => l.id === "tal_tecnicas_ofensivas_de_escudo");
  const danoRolado = rolarDano({ rotulo: linhaEscudo.nome, grupos: linhaEscudo.gruposDano, linhaArma: linhaEscudo, fontes: linhaEscudo.partes }, () => 0);
  const pronta = S.registraRolagem(r.sessao, danoRolado);
  const reutiliza = aplicaEmpurraoEscudo(pronta, d, r.sessaoAlvo, da, { ...entrada, danoId: danoRolado.id, rng: () => { throw new Error("Não Pode Sortear Outro Dano"); } }, p());
  t(`${sistema} dano escolhido é usado sem outro sorteio`, [reutiliza.aplicado, reutiliza.dano.id, reutiliza.calculo.base], [true, danoRolado.id, danoRolado.total]);
  t(`${sistema} dano não duplica no histórico`, reutiliza.sessao.log.filter((l) => l.id === danoRolado.id).length, 1);
  t(`${sistema} dano recebe marca de consequências`, reutiliza.sessao.log.find((l) => l.id === danoRolado.id).consequenciasAplicadas, true);
  const releituraDano = S.normalizaSessao(JSON.parse(JSON.stringify(pronta)), d);
  t(`${sistema} dano salvo ainda pode ser escolhido`, aplicaEmpurraoEscudo(releituraDano, d, alvoLido, da, { ...entrada, danoId: danoRolado.id }, p()).dano.id, danoRolado.id);
  for (const [nome, alteracao] of [["outra arma", { armaId: "basico" }], ["crítico", { critico: true }], ["cura", { tom: "cura" }], ["antes da disputa", { ts: r.atacante.ts - 1 }], ["já aplicado", { consequenciasAplicadas: true }]]) {
    const invalida = { ...pronta, log: pronta.log.map((l) => l.id === danoRolado.id ? { ...l, ...alteracao } : l) };
    t(`${sistema} dano ${nome} não altera a sessão`, aplicaEmpurraoEscudo(invalida, d, r.sessaoAlvo, da, { ...entrada, danoId: danoRolado.id }, p()).sessao === invalida, true);
  }
  const comInfalivel = deriveAfty({ ...c, talentos: [...c.talentos, "tal_ataque_infalivel"] });
  t(`${sistema} Infalível não repete dano da manobra`, rerrolaDanoTalento(pronta, comInfalivel, { id: danoRolado.id, talento: "tal_ataque_infalivel" }, p()).sessao === pronta, true);
  const basico = comInfalivel.dano.entradas.find((l) => l.id === "basico"), nomeLivre = rolarDano({ rotulo: "Concentração", grupos: basico.gruposDano, linhaArma: basico }, () => 0);
  const sNomeLivre = S.registraRolagem(s, nomeLivre);
  t(`${sistema} nome livre não muda o tipo de dano de ataque`, rerrolaDanoTalento(sNomeLivre, comInfalivel, { id: nomeLivre.id, talento: "tal_ataque_infalivel", rng: () => 0.999 }, p()).aplicado, true);
  const consumida = { ...sNomeLivre, log: sNomeLivre.log.map((l) => l.id === nomeLivre.id ? { ...l, consequenciasAplicadas: true } : l) };
  t(`${sistema} consequência efetiva impede repetir o dano`, rerrolaDanoTalento(consumida, comInfalivel, { id: nomeLivre.id, talento: "tal_ataque_infalivel" }, p()).sessao === consumida, true);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
