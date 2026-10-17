import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { saneiaArmaCustom, propriedadesDaArma } = await import(R + "afty-equipamentos.js");
const P = await import(R + "afty-propriedades-armas.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarDano, rolarTeste } = await import(R + "ficha/ficha-rolagem.js");
let ok = 0; const bad = [];
const t = (n, r, e) => { if (JSON.stringify(r) === JSON.stringify(e)) ok++; else bad.push(n + ": " + JSON.stringify(r) + " != " + JSON.stringify(e)); };
function ficha(sistema, props = {}, dado = "1d6", extra = {}) {
  const c = createBlankAfty(); c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 1, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "combatente", nivel: 1 }]; c.attrMethod = "fixos";
  c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.ataquesProf = { corpo: true };
  c.armasCustom = [{ id: "armc_teste", nome: "Arma de Teste", classe: "simples", categoria: "corpo", dano: { dado, tipo: "ct" }, critico: 20, custo: 1, grupo: "espada", props }];
  c.equipamentos = { itens: [{ uid: "arma-1", tipo: "arma", refId: "armc_teste", qtd: 1, equipado: true, ...extra }] };
  return c;
}
const derivar = (c, s) => deriveAfty(c, { propriedadesArmas: s?.propriedadesArmas });
const linha = (c, s, id = "armc_teste") => derivar(c, s).dano.entradas.find((e) => e.id === id);
function acerto(s, e, rng = () => 0.5, modo = "normal") {
  const desc = P.preparaRolagemArma({ tipo: "teste", linhaArma: e, rotulo: e.nome, bonus: e.acerto, margem: e.margemCritico }, modo);
  if (!desc) return { sessao: s, r: null };
  const r = rolarTeste(desc, rng);
  return { sessao: P.registraRolagemArma(S.registraRolagem(s, r), desc, r), r };
}
function dano(s, e, modoDano = "normal") {
  const desc = P.preparaRolagemArma({ tipo: "dano", linhaArma: e, rotulo: e.nome, grupos: e.gruposDano, modoDano });
  if (!desc) return { sessao: s, r: null };
  const r = rolarDano(desc, () => 0.999);
  return { sessao: P.registraRolagemArma(S.registraRolagem(s, r), desc, r), r };
}
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema, { energica: true }); let s = S.sessaoEmBranco(deriveAfty(c));
  const totais = [], bonos = [];
  for (let i = 0; i < 3; i++) {
    s = acerto(s, linha(c, s)).sessao;
    const e = linha(c, s); bonos.push(e.armaPropriedades.energica);
    const r = dano(s, e); s = r.sessao; totais.push(r.r.total);
  }
  t(sistema + " Enérgica 0, 1, 2", bonos, [0, 1, 2]);
  t(sistema + " rolagens somam o fixo", totais.map((v) => v - totais[0]), [0, 1, 2]);
  t(sistema + " Acerto e Dano não duplicam contador", P.estadoDaArma(s.propriedadesArmas, linha(c, s)).ataques, 3);
  const proxima = linha(c, s); const normal = rolarDano({ grupos: proxima.gruposDano }, () => 0.999);
  const critico = rolarDano({ grupos: proxima.gruposDano, modoDano: "critico" }, () => 0.999);
  const semBonus = proxima.gruposDano.filter((g) => g.nome !== "Enérgica");
  t(sistema + " crítico conta dados dobrados e soma Enérgica uma vez", critico.total - rolarDano({ grupos: semBonus, modoDano: "critico" }, () => 0.999).total, 4);
  t(sistema + " Raio Negro não multiplica Enérgica", rolarDano({ grupos: proxima.gruposDano, modoDano: "raio_negro" }, () => 0.999).total - rolarDano({ grupos: semBonus, modoDano: "raio_negro" }, () => 0.999).total, 4);
  t(sistema + " fórmula e hover contêm Enérgica", [proxima.formulaNormal === normal.formula, proxima.hoverDano.partes.some((p) => p.label === "Enérgica" && p.valor === 3)], [true, true]);
  t(sistema + " novo turno zera Enérgica", linha(c, P.iniciaTurnoArmas(s)).armaPropriedades.energica, 0);
  t(sistema + " rodada também zera", linha(c, S.proximaRodada(s, derivar(c, s)).sessao).armaPropriedades.energica, 0);
  t(sistema + " sessão persistida preserva contador", linha(c, S.normalizaSessao(JSON.parse(JSON.stringify(s)), derivar(c, s))).armaPropriedades.energica, 3);
  let externo = P.configuraArmaNaSessao(s, proxima, "ataques", 7);
  t(sistema + " contador manual vale", linha(c, externo).armaPropriedades.energica, 7);
  t(sistema + " contador não fica negativo", P.estadoDaArma(P.configuraArmaNaSessao(externo, linha(c, externo), "ataques", -1).propriedadesArmas, proxima).ataques, 0);
  c.equipamentos.itens.push({ uid: "arma-2", tipo: "arma", refId: "armc_teste", qtd: 1, equipado: true });
  t(sistema + " duas cópias não compartilham bônus", derivar(c, s).dano.entradas.filter((e) => e.id === "armc_teste").map((e) => e.armaPropriedades.energica), [3, 0]);
  const pug = ficha(sistema); pug.equipamentos.itens = [{ uid: "soco", tipo: "arma", refId: "arm_soco_ingles", qtd: 1, equipado: true }];
  let sp = S.sessaoEmBranco(deriveAfty(pug)); sp = acerto(sp, linha(pug, sp, "basico")).sessao; sp = dano(sp, linha(pug, sp, "basico")).sessao;
  t(sistema + " Enérgica funciona no Pugilato", linha(pug, sp, "basico").armaPropriedades.energica, 1);
  const fin = ficha(sistema); fin.attributes.destreza = 18;
  fin.equipamentos.itens = ["arm_rapieira", "arm_clava"].map((refId, i) => ({ uid: "f" + i, tipo: "arma", refId, qtd: 1, equipado: true }));
  for (const global of [false, true]) {
    fin.ataqueFineza = global; const ds = deriveAfty(fin).dano.entradas;
    t(sistema + " Fineza por arma, marca global " + global, ds.find((e) => e.id === "arm_rapieira").acerto - ds.find((e) => e.id === "arm_clava").acerto, 4);
  }
  const pesada = ficha(sistema, { pesada: 14, estabilidade: 14 }); const ep = linha(pesada);
  t(sistema + " requisitos usam atributos efetivos", ep.armaPropriedades.requisitos, ["Força menor que 14", "Destreza menor que 14"]);
  t(sistema + " desvantagem automática", acerto(S.sessaoEmBranco(), ep).r.d20.length, 2);
  t(sistema + " vantagem anula desvantagem", acerto(S.sessaoEmBranco(), ep, () => 0.5, "vantagem").r.modo, "normal");
  pesada.attributes.forca = 14; pesada.attributes.destreza = 14;
  t(sistema + " cumprir requisito tira desvantagem", linha(pesada).armaPropriedades.desvantagem, false);
  const ap = ficha(sistema, { aparar: true, apunhaladora: true, modular: "pf" }); let sa = S.sessaoEmBranco();
  const sem = deriveAfty(ap).defesa;
  sa = P.configuraArmaNaSessao(sa, linha(ap, sa), "aparando", true);
  t(sistema + " Aparar soma Defesa", derivar(ap, sa).defesa - sem, 2);
  t(sistema + " Aparar aparece no hover", derivar(ap, sa).partes.defesa.some((p) => p.label === "Aparar (Arma de Teste)" && p.valor === 2), true);
  t(sistema + " Aparar acaba no próprio turno", derivar(ap, P.iniciaTurnoArmas(sa)).defesa, sem);
  t(sistema + " virada de rodada no encontro preserva Aparar", derivar(ap, S.proximaRodada(sa, derivar(ap, sa), { preservarTurnoArmas: true }).sessao).defesa - sem, 2);
  sa = P.configuraArmaNaSessao(sa, linha(ap, sa), "desprevenido", true);
  t(sistema + " Apunhaladora soma BT", linha(ap, sa).gruposDano.find((g) => g.nome === "Apunhaladora").fixo, derivar(ap, sa).maestria);
  sa = P.configuraArmaNaSessao(sa, linha(ap, sa), "tipoDano", "pf");
  t(sistema + " Modular troca tipo e rótulo", [linha(ap, sa).tipoDano, linha(ap, sa).tipoDanoLabel], ["pf", "Perfurante"]);
  sa = P.configuraArmaNaSessao(sa, linha(ap, sa), "tipoDano", "inexistente");
  t(sistema + " Modular rejeita tipo não oferecido", linha(ap, sa).tipoDano, "pf");
  const os = ficha(sistema, { oscilante: true }); let so = S.sessaoEmBranco();
  so = acerto(so, linha(os, so)).sessao; so = P.marcaErroDaArma(so, linha(os, so), true);
  t(sistema + " erro manual liga Oscilante", linha(os, so).armaPropriedades.oscilante, 2);
  so = acerto(so, linha(os, so)).sessao;
  t(sistema + " próximo acerto consome Oscilante", linha(os, so).armaPropriedades.oscilante, 0);
  so = acerto(so, linha(os, so), () => 0).sessao;
  t(sistema + " desastre liga Oscilante", linha(os, so).armaPropriedades.oscilante, 2);
  t(sistema + " fim do turno encerra Oscilante", linha(os, P.iniciaTurnoArmas(so)).armaPropriedades.oscilante, 0);
}
const c = ficha("player", { recarga: 1, emperrar: true, energica: true }); let s = S.sessaoEmBranco();
s = acerto(s, linha(c, s)).sessao;
t("Última munição bloqueia novo Acerto", acerto(s, linha(c, s)).r, null);
t("Última munição ainda permite Dano do ataque", dano(s, linha(c, s)).r.total, 6);
s = dano(s, linha(c, s)).sessao;
t("Dano não gasta segunda munição", P.estadoDaArma(s.propriedadesArmas, linha(c, s)).gastos, 1);
s = P.configuraArmaNaSessao(s, linha(c, s), "recarregar", true);
s = acerto(s, linha(c, s), () => 0).sessao;
t("Desastre emperra", linha(c, s).armaPropriedades.estado.emperrada, true);
s = P.configuraArmaNaSessao(s, linha(c, s), "recarregar", true);
t("Recarregar não desemperra", acerto(s, linha(c, s)).r, null);
s = P.iniciaTurnoArmas(s);
t("Novo turno não desemperra", linha(c, s).armaPropriedades.estado.emperrada, true);
s = P.configuraArmaNaSessao(s, linha(c, s), "desemperrar", true);
t("Desemperrar libera ataque", !!acerto(s, linha(c, s)).r, true);
const am = ficha("player", { ampla: true }); let sm = S.sessaoEmBranco();
sm = acerto(sm, linha(am, sm)).sessao; sm = dano(sm, linha(am, sm)).sessao;
sm = P.configuraArmaNaSessao(sm, linha(am, sm), "adjacente", true);
sm = P.configuraArmaNaSessao(sm, linha(am, sm), "defesaAmpla", 10);
t("Ampla funciona sem crítico e dá metade", P.danoDaAmpla(linha(am, sm), sm.rodada), 3);
sm = P.usaAmpla(sm, linha(am, sm));
t("Ampla só uma vez por rodada", P.danoDaAmpla(linha(am, sm), sm.rodada), null);
t("Novo turno não devolve Ampla na mesma rodada", P.estadoDaArma(P.iniciaTurnoArmas(sm).propriedadesArmas, linha(am, sm)).amplaRodada, 0);
const defesaIgual = P.configuraArmaNaSessao(sm, linha(am, sm), "defesaAmpla", 13);
t("Defesa igual não é elegível", P.danoDaAmpla(linha(am, defesaIgual), 1), null);
for (const v of ["d10", "1d10", 10]) t("Normaliza tamanho " + v, saneiaArmaCustom({ id: "armc_v", props: { fatal: v, mortal: v } }).props, { fatal: "1d10", mortal: "1d10" });
for (const v of ["2d12", "1d12 + 1d4", "inválido"]) { const a = saneiaArmaCustom({ id: "armc_v", props: { fatal: v, mortal: v } }); t("Rejeita parâmetro composto " + v, [a.props, a.avisosPropriedades.length], [{}, 2]); }
for (const [fatal, esperado] of [[null, "1d8"], ["1d8", "1d10"], ["1d10", "1d12"], ["1d12", "1d12"]]) t("Afiada " + fatal, propriedadesDaArma({ props: fatal ? { fatal } : {} }, { encantamentos: [{ id: "enc_arma_afiada", atende: true }] }).find((p) => p.id === "fatal").valor, esperado);
const af = ficha("player", {}, "1d6", { fa: { grau: "terceiro", encantamentos: ["enc_arma_afiada"] } });
t("Afiada chega ao crítico real", linha(af).formulaCritico, "2d8 + 2");
const df = ficha("player", { aparar: true }, "1d6", { fa: { grau: "terceiro", encantamentos: ["enc_arma_defensora"] } });
const sd = P.configuraArmaNaSessao(S.sessaoEmBranco(), linha(df), "aparando", true);
t("Defensora melhora Aparar para +3", derivar(df, sd).defesa - deriveAfty(df).defesa, 3);
// O turno termina para o ator anterior, enquanto Aparar espera o próximo início.
const { redutorDeEncontro, derivarComCache } = await import(R + "encontros/usar-encontro-afty.js");
const { criarCombatente, definirIniciativa } = await import(R + "encontros/afty-encontro.js");
const ce = ficha("player", { energica: true, aparar: true, oscilante: true });
let se = S.sessaoEmBranco(deriveAfty(ce)); se = acerto(se, linha(ce, se), () => 0).sessao;
se = P.configuraArmaNaSessao(se, linha(ce, se), "aparando", true);
const a = { ...definirIniciativa(criarCombatente(ce, deriveAfty(ce)), 20), sessao: se };
const b = definirIniciativa(criarCombatente(ficha("player"), deriveAfty(ficha("player"))), 10);
let encontro = { status: "ativo", rodada: 1, ativoId: a.id, combatentes: [a, b], log: [] };
const antesCache = derivarComCache(a, 0);
encontro = redutorDeEncontro(encontro, { tipo: "PROXIMO_TURNO" });
const depois = encontro.combatentes.find((c) => c.id === a.id);
t("Encontro encerra Enérgica e Oscilante do ator anterior", [linha(ce, depois.sessao).armaPropriedades.energica, linha(ce, depois.sessao).armaPropriedades.oscilante], [0, 0]);
t("Encontro preserva Aparar no fim do turno", derivar(ce, depois.sessao).defesa - deriveAfty(ce).defesa, 2);
t("Cache acompanha mudança das propriedades", derivarComCache(depois, 0) !== antesCache, true);
encontro = redutorDeEncontro(encontro, { tipo: "PROXIMO_TURNO" });
t("Aparar expira no próximo turno próprio", derivar(ce, encontro.combatentes.find((c) => c.id === a.id).sessao).defesa, deriveAfty(ce).defesa);
for (const sistema of ["player", "afty"]) {
 const natural = ficha(sistema); natural.equipamentos.itens = []; natural.attributes.destreza = 18;
 natural.core.origem = { id: "feto_amaldicoado_hibrido", anatomias: ["arma_natural"] };
 let sn = S.sessaoEmBranco(); const en = linha(natural, sn, "basico");
 t(sistema + " Anatomia concede Enérgica e Fineza", [en.propriedades.some((p) => p.id === "energica"), en.atributo], [true, "destreza"]);
 sn = acerto(sn, en).sessao; sn = dano(sn, linha(natural, sn, "basico")).sessao;
 t(sistema + " Anatomia soma Enérgica no segundo ataque", linha(natural, sn, "basico").armaPropriedades.energica, sistema === "player" ? 1 : 5);
 const dois = ficha(sistema, { energica: true }, "2d6"); let s2 = S.sessaoEmBranco();
 s2 = P.configuraArmaNaSessao(s2, linha(dois, s2), "ataques", 1);
 t(sistema + " Enérgica usa os dados efetivos de Durante Ataque", linha(dois, s2).armaPropriedades.energica, sistema === "player" ? 2 : 1);
 const modular = ficha(sistema, { modular: "pf" }); modular.core.nd = 8; modular.especializacoes[0].nivel = 8; modular.talentos = ["tal_especialista_em_perfuracao"];
 let st = P.configuraArmaNaSessao(S.sessaoEmBranco(), linha(modular), "tipoDano", "pf");
 t(sistema + " Modular recebe talento do tipo escolhido", [linha(modular).formulaNormal, linha(modular, st).formulaNormal], sistema === "player" ? ["1d6", "1d8"] : ["1d8 + 12", "1d8 + 14"]);
 st = P.configuraArmaNaSessao(st, linha(modular, st), "tipoDano", "ct");
 t(sistema + " Modular devolve o tipo original", linha(modular, st).tipoDano, "ct");
 const osc = ficha(sistema, { oscilante: true }); let so = S.sessaoEmBranco();
 so = acerto(so, linha(osc, so), () => 0).sessao;
 const atq = derivar(osc, so).testes.ataques[0];
 t(sistema + " Oscilante vale nos ataques da aba Perícias", atq.bonus - deriveAfty(osc).testes.ataques[0].bonus, 2);
 const desc = { tipo: "teste", ataqueId: atq.id, bonus: atq.bonus };
 so = P.registraRolagemArma(so, desc, rolarTeste(desc, () => 0.5));
 t(sistema + " Ataque de Perícias consome Oscilante", linha(osc, so).armaPropriedades.oscilante, 0);
 so = P.marcaErroDaArma(so, linha(osc, so), true);
 t(sistema + " Marcar um ataque anterior não devolve Oscilante", linha(osc, so).armaPropriedades.oscilante, 0);
}
// Enérgica considera a classificação Durante Ataque de toda fonte, incluindo
// dados não critáveis e os exclusivos do crítico. Contamos o dobro dos dados
// critáveis, mas o bônus fixo resultante soma somente uma vez.
const armaMista = {
  id: "mista", chaveArma: "mista-1", nome: "Arma Mista", propriedades: [{ id: "energica" }],
  gruposDano: [
    { nome: "Ataque", dados: 2, faces: 6, fixo: 4, momento: "durante" },
    { nome: "Fonte adicional", dados: 3, faces: 8, fixo: 0, momento: "durante", concentra: false },
    { nome: "Durante não critável", dados: 1, faces: 10, fixo: 0, momento: "durante", multiplica: false },
    { nome: "Após Ataque", dados: 4, faces: 12, fixo: 0, momento: "apos", multiplica: false },
    { nome: "Bônus fixo", dados: 0, faces: 6, fixo: 33, momento: "durante" },
  ],
};
const propriedadesMistas = (arma = armaMista, numero = 2) => P.aplicarPropriedadesNoDano({ entradas: [arma] }, {
  estado: { porArma: { [arma.chaveArma]: { ataques: numero - 1 } } },
}).entradas[0];
t("Enérgica mista: primeiro, segundo e terceiro golpes", [1, 2, 3].map((n) => propriedadesMistas(armaMista, n).armaPropriedades.energica), [0, 6, 7]);
t("Enérgica mista: soma na fórmula normal", propriedadesMistas().formulaNormal, "4d12 + 1d10 + 3d8 + 2d6 + 43");
t("Enérgica mista: hover identifica o bônus de todas as fontes", propriedadesMistas().hoverDano.partes.some((p) => p.label === "Enérgica" && p.valor === 6), true);
const critMista = { ...armaMista, gruposDano: [...armaMista.gruposDano,
  { nome: "Só no crítico", dados: 2, faces: 4, fixo: 0, momento: "durante", apenasCritico: true },
] };
for (const [modo, bonus] of [["normal", 6], ["critico", 15], ["raio_negro", 15]]) {
  const com = propriedadesMistas(critMista);
  const r = rolarDano({ grupos: com.gruposDano, modoDano: modo }, () => 0.999);
  const sem = rolarDano({ grupos: critMista.gruposDano, modoDano: modo }, () => 0.999);
  t("Enérgica mista em " + modo + ": dados ativos sem multiplicar o bônus", r.total - sem.total, bonus);
  t("Enérgica mista em " + modo + ": fórmula e rolagem coincidem", r.formula,
    modo === "normal" ? com.formulaNormal : modo === "critico" ? com.formulaCritico : com.formulaRaioNegro);
}
t("Enérgica mantém a diferença exclusiva do crítico identificada", propriedadesMistas(critMista).hoverDano.partes.some((p) => p.label === "Enérgica (Só no Crítico)" && p.valor === 9), true);
const concentrada = { ...critMista, gruposDano: [...critMista.gruposDano,
  { nome: "Ataque Concentrado", dados: 1, dadosCritico: 3, faces: 8, fixo: 0, momento: "durante" },
] };
t("Enérgica acompanha os dados normais e críticos do Ataque Concentrado", [propriedadesMistas(concentrada).armaPropriedades.energica, propriedadesMistas(concentrada).armaPropriedades.energicaCritico], [7, 21]);
t("Arma sem Enérgica não ganha bônus das fontes extras", propriedadesMistas({ ...armaMista, propriedades: [] }).armaPropriedades.energica, 0);
t("Linha antiga sem grupos usa os dados de Durante Ataque", propriedadesMistas({ ...armaMista, gruposDano: [], dados: 2, dado: "d6" }).armaPropriedades.energica, 2);

const { estadoLigadoDoFeitico } = await import(R + "afty-combate-conjurador.js");
const { tiposDeDanoDaCategoria } = await import(R + "afty-equipamentos.js");
for (const sistema of ["player", "afty"]) {
  const base = ficha(sistema, { energica: true });
  base.core.nd = 12; base.especializacoes[0].nivel = 12;
  base.aptidoes = { au: 3, cl: 3, bar: 0, dom: 0, er: 3 };
  base.combate = { ativo: true };
  const segundo = { propriedadesArmas: { porArma: { "arma-1": { ataques: 1 } } } };
  const antes = linha(base, segundo).armaPropriedades.energica;
  for (const [nome, aptidoes, combate, entra] of [
    ["Aura Elemental", ["aura_elemental"], { auraElemental: true }, true],
    ["Canalização Máxima", ["canalizar_em_golpe", "canalizacao_avancada", "canalizacao_maxima"], { canalizarEmGolpe: true, canalizacaoMaxima: true }, true],
    ["Canalizar Energia Reversa", ["energia_reversa", "liberacao_de_energia_reversa", "canalizar_energia_reversa"], { canalizarEnergiaReversa: true }, true],
    ["Concentrar Aura", ["aura_elemental", "concentrar_aura"], { concentrarAura: ["aura_elemental"] }, false],
  ]) {
    const c = structuredClone(base); c.aptidoesAmaldicoadas = aptidoes;
    c.aptidaoOpcoes = { aura_elemental: tiposDeDanoDaCategoria("elemental")[0].id };
    c.combate = { ...c.combate, ...combate };
    const e = linha(c, segundo); const extra = e.gruposDano.find((g) => g.nome === nome);
    t(sistema + " " + nome + " entrega dados reais", !!extra && extra.dados > 0, true);
    t(sistema + " Enérgica " + (entra ? "inclui " : "exclui ") + nome, e.armaPropriedades.energica - antes, entra ? extra?.dados : 0);
  }
  for (const [nome, efeitoAux, umGolpe, entra] of [
    ["Auxiliar Durante Ataque", "danoDurante", false, true],
    ["Auxiliar de um único golpe", "danoDurante", true, true],
    ["Auxiliar Após Ataque", "danoApos", false, false],
  ]) {
    const c = structuredClone(base);
    c.feiticos = [{ id: "extra", nome, tipo: "auxiliar", nivel: 3, efeitoAux, duracaoAux: "imediata", umGolpe }];
    c.combate[estadoLigadoDoFeitico("extra")] = true;
    const e = linha(c, segundo); const extra = e.gruposDano.find((g) => g.nome === nome);
    t(sistema + " " + nome + " entrega dados reais", !!extra && extra.dados > 0, true);
    t(sistema + " Enérgica " + (entra ? "inclui " : "exclui ") + nome, e.armaPropriedades.energica - antes, entra ? extra?.dados : 0);
  }
  const c = structuredClone(base);
  c.habilidades = ["cmb_ataque_extra", "cmb_ataque_concentrado"];
  c.core.tecnicaEfeitos = [{ canal: "dadosDano", expr: "6" }];
  c.combate.ataqueConcentrado = 1;
  const e = linha(c, segundo); const extra = e.gruposDano.find((g) => g.nome === "Ataque Concentrado");
  const sem = structuredClone(c); sem.combate.ataqueConcentrado = 0;
  t(sistema + " Ataque Concentrado entrega dados reais", !!extra && extra.dados > 0, true);
  t(sistema + " Enérgica inclui os dados de Ataque Concentrado", e.armaPropriedades.energica - linha(sem, segundo).armaPropriedades.energica, extra?.dados);
  const mortal = ficha(sistema, { energica: true, mortal: "1d10" });
  const lm = linha(mortal, segundo);
  t(sistema + " Enérgica conta os dados dobrados da arma e Mortal no crítico", lm.armaPropriedades.energicaCritico,
    2 * (lm.armaPropriedades.energica + lm.gruposDano.find((g) => g.nome === "Mortal").dados));
}

// Números enviados pelo autor: 56 dados no normal e 132 no crítico.
const exemploDoAutor = { ...armaMista, gruposDano: [
  { nome: "Durante d12", dados: 42, dadosCritico: 52, faces: 12, fixo: 113, momento: "durante" },
  { nome: "Durante d10", dados: 9, faces: 10, fixo: 0, momento: "durante" },
  { nome: "Durante d6", dados: 5, faces: 6, fixo: 0, momento: "durante" },
] };
const autorSegundo = propriedadesMistas(exemploDoAutor);
t("Exemplo do autor: Enérgica normal e crítico", [autorSegundo.armaPropriedades.energica, autorSegundo.armaPropriedades.energicaCritico], [56, 132]);
t("Exemplo do autor: fórmula normal preservada", autorSegundo.formulaNormal, "42d12 + 9d10 + 5d6 + 169");
t("Exemplo do autor: fórmula crítica corrigida", autorSegundo.formulaCritico, "100d12 + 4d12 + 18d10 + 10d6 + 245");
t("Exemplo do autor: Raio Negro não multiplica Enérgica", autorSegundo.formulaRaioNegro, "(100d12 + 4d12 + 18d10 + 10d6)/2*3 + 245");
for (const modo of ["normal", "critico", "raio_negro"]) {
  const r = rolarDano({ grupos: autorSegundo.gruposDano, modoDano: modo }, () => 0);
  t("Exemplo do autor: rolagem " + modo + " usa o bônus uma vez", [r.dados.length, r.total],
    modo === "normal" ? [56, 225] : modo === "critico" ? [132, 377] : [132, 443]);
}
t("Terceiro golpe acrescenta apenas +1 também no crítico", propriedadesMistas(exemploDoAutor, 3).armaPropriedades.energicaCritico, 133);

console.log(bad.length ? "FALHAS (" + bad.length + "):\n" + bad.join("\n") : "TODOS OS " + ok + " ASSERTS PASSARAM");
process.exitCode = bad.length ? 1 : 0;
