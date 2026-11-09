import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons, validarPacote } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const M = await import(R + "ficha/ficha-conteudo-manobras.js");
const { bloqueioDeOportunidadeConteudo, impedimentoParaAgirConteudo } = await import(R + "ficha/ficha-conteudo-acesso.js");
const { gastaAcao } = await import(R + "ficha/ficha-acoes.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { rolaSorte, escolheSorte } = await import(R + "ficha/ficha-conteudo-uso.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `acao-agil-${++seq}`, registraAcao: true });
function ficha(sistema, classe = "lutador") {
  const c = createBlankAfty(); c.id = `agil-${++seq}`; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 20;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 15, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = classe === "restringido" ? { id: "restringido" } : { id: "inato", bonusAtributos: { forca: 1, destreza: 2 } };
  if (classe === "restringido") c.core.tipo = "restringido";
  c.especializacoes = [{ id: classe, nivel: 20 }]; c.pericias = { furtividade: "mestre", feiticaria: "treinado" };
  c.habilidades = [classe === "lutador" ? "lut_acao_agil" : "res_acao_agil"];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
const inicio = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
aplicarAddons([]);
for (const sistema of ["player", "afty"]) for (const classe of ["lutador", "restringido"]) {
  const c = ficha(sistema, classe), d = deriveAfty(c), id = c.habilidades[0], s = inicio(d), marca = `${sistema} ${classe}`;
  let esgotada = s; for (const a of ["comum", "bonus", "movimento"]) esgotada = gastaAcao(esgotada, d, a).sessao;
  const entrada = { id, comando: "andar", distancia: d.movimento, emSeuTurno: true, descontarPE: true }, pedido = p();
  const r = M.usaAcaoAgilConteudo(esgotada, d, entrada, pedido); if (!r.aplicado) throw Error(`${marca}: ${r.erro}`);
  t(`${marca} escolhas e orçamento válidos`, [d.habilidades.inacessiveis, d.habilidades.excedeu], [[], false]);
  t(`${marca} Andar extra registra Movimento real e fonte`, [r.registro.deslocamento, r.registro.fontes], [d.movimento, [{ label: "Movimento", valor: d.movimento }]]);
  t(`${marca} custa dois sem gastar ou devolver ações normais`, [esgotada.peAtual - r.sessao.peAtual, r.sessao.uso.acoes], [2, esgotada.uso.acoes]);
  t(`${marca} limite tem prefixo nativo da classe`, r.sessao.usos[`${classe === "lutador" ? "rodada" : "turno"}:uso:acao_agil`], 1);
  t(`${marca} identidade repetida não cobra`, M.usaAcaoAgilConteudo(r.sessao, d, entrada, pedido).repetida, true);
  t(`${marca} trocar o comando não burla o limite`, M.usaAcaoAgilConteudo(r.sessao, d, { ...entrada, comando: "esconder", rng: () => { throw Error("Não Deve Rolar"); } }, p()).sessao === r.sessao, true);
  const turno = S.iniciaTurnoFicha(r.sessao, d);
  t(`${marca} novo turno na mesma rodada respeita cadência`, M.usaAcaoAgilConteudo(turno, d, entrada, p()).aplicado, classe === "restringido");
  const rodada = S.proximaRodada(r.sessao, d).sessao;
  t(`${marca} próxima rodada recupera o uso`, M.usaAcaoAgilConteudo(rodada, d, entrada, p()).aplicado, true);
  const manual = M.usaAcaoAgilConteudo(s, d, { ...entrada, descontarPE: false, distancia: 1.5 }, p());
  t(`${marca} política manual conserva PE e informa dois`, [manual.aplicado, manual.sessao.peAtual, manual.custo.pe.naoDescontado, manual.registro.deslocamento], [true, s.peAtual, 2, 1.5]);
  for (const [nome, e] of [["ação arbitrária", { comando: "atacar" }], ["Pular não está na lista", { comando: "pular" }], ["fora do próprio turno", { emSeuTurno: false }], ["acima do Movimento", { distancia: d.movimento + 0.5 }], ["negativo", { distancia: -1 }], ["sem distância", { distancia: null }], ["outra Habilidade", { id: "cmb_surto_de_acao" }]]) t(`${marca} ${nome} não cobra`, M.usaAcaoAgilConteudo(s, d, { ...entrada, ...e }, p()).sessao === s, true);
  const pobre = { ...s, peAtual: 1 };
  t(`${marca} PE/Estamina insuficiente recusa`, M.usaAcaoAgilConteudo(pobre, d, entrada, p()).sessao === pobre, true);
  for (const estado of ["morto", "morrendo"]) {
    const incapaz = { ...s, hpAtual: 0, vital: { ...s.vital, estado } };
    t(`${marca} ${estado} não realiza ação adicional`, M.usaAcaoAgilConteudo(incapaz, d, entrada, p()).sessao === incapaz, true);
  }
  for (const nome of ["Atordoado", "Paralisado", "Indefeso", "Inconsciente"]) {
    const incapaz = S.defineCondicoes(s, [{ id: nome, nome }]);
    t(`${marca} ${nome} impede os três verbos`, ["andar", "desengajar", "esconder"].map(comando => M.usaAcaoAgilConteudo(incapaz, d, { ...entrada, comando }, p()).sessao === incapaz), [true, true, true]);
  }
  t(`${marca} falta identidade não escreve`, M.usaAcaoAgilConteudo(s, d, entrada).sessao === s, true);
  const fora = S.aplicaPatchCombate(s, { ativo: false });
  t(`${marca} fora de combate recusa`, M.usaAcaoAgilConteudo(fora, d, entrada, p()).sessao === fora, true);
  const encerrada = S.encerraTurnoFicha(s, d);
  t(`${marca} turno encerrado não permite usar a ação extra`, M.usaAcaoAgilConteudo(encerrada, d, entrada, p()).sessao === encerrada, true);
  const sem = deriveAfty({ ...c, habilidades: [] });
  t(`${marca} retirar a Habilidade impede`, M.usaAcaoAgilConteudo(s, sem, entrada, p()).sessao === s, true);
  const baixo = deriveAfty({ ...c, core: { ...c.core, nd: 2 }, especializacoes: [{ id: classe, nivel: 2 }] });
  t(`${marca} nível inacessível impede`, M.usaAcaoAgilConteudo(s, baixo, entrada, p()).sessao === s, true);
  const des = M.usaAcaoAgilConteudo(esgotada, d, { ...entrada, comando: "desengajar" }, p()); if (!des.aplicado) throw Error(des.erro);
  t(`${marca} Desengajar usa duração fimDoTurno`, [des.sessao.uso.ativos.acao_agil.duracao.tipo, bloqueioDeOportunidadeConteudo(des.sessao, "qualquer")], ["fimDoTurno", "Desengajar Impede esta Oportunidade"]);
  const relida = S.normalizaSessao(JSON.parse(JSON.stringify(des.sessao)), d);
  t(`${marca} proteção e gasto persistem`, [bloqueioDeOportunidadeConteudo(relida, null), relida.peAtual, relida.uso.acoes], ["Desengajar Impede esta Oportunidade", des.sessao.peAtual, esgotada.uso.acoes]);
  const fim = S.encerraTurnoFicha(des.sessao, d);
  t(`${marca} fim do próprio turno encerra a proteção`, [bloqueioDeOportunidadeConteudo(fim, "qualquer"), fim.uso.ativos.acao_agil], [null, undefined]);
  t(`${marca} próxima rodada da ficha encerra proteção sem outro relógio`, bloqueioDeOportunidadeConteudo(S.proximaRodada(des.sessao, d).sessao, "qualquer"), null);
  t(`${marca} encerrar combate limpa a proteção`, bloqueioDeOportunidadeConteudo(S.aplicaPatchCombate(des.sessao, { ativo: false }), "qualquer"), null);
  const furtividade = d.testes.pericias.find(l => l.id === "furtividade");
  const escondida = M.usaAcaoAgilConteudo(esgotada, d, { ...entrada, comando: "esconder", modo: "vantagem", rng: () => 0.999 }, p());
  t(`${marca} Esconder usa Furtividade real com vantagem`, [escondida.rolagem.periciaId, escondida.rolagem.bonus, escondida.rolagem.d20, escondida.rolagem.total], ["furtividade", furtividade.bonus, [20, 20], 20 + furtividade.bonus]);
  t(`${marca} Esconder não aplica condição de posição sem observadores`, [escondida.sessao.condicoes, escondida.sessao.uso.acoes, escondida.registro.testeId], [esgotada.condicoes, esgotada.uso.acoes, escondida.rolagem.id]);
  const dc = deriveAfty({ ...c, talentos: ["tal_favorecido_pela_sorte"] });
  const sorte = rolaSorte(escondida.sessao, dc, { id: escondida.rolagem.id, rng: () => 0.5 }, p());
  t(`${marca} teste ainda permite Sorte antes das consequências`, [sorte.aplicado, escolheSorte(sorte.sessao, dc, { id: escondida.rolagem.id, escolha: "original" }, p()).aplicado], [true, true]);
  const atacante = ficha(sistema); atacante.talentos = ["tal_perceber_oportunidade"];
  const dd = deriveAfty(atacante), ss = inicio(dd), arma = dd.dano.entradas.find(l => l.id === "basico");
  const e = { armaId: arma.id, chaveArma: arma.chaveArma, voceId: atacante.id, alvoId: c.id, gatilhoValido: true };
  t(`${marca} oportunidade é recusada antes de reação/contador`, M.preparaOportunidadeConteudo(ss, dd, e, p(), { sessao: des.sessao, derived: d }).sessao === ss, true);
  const pr = M.preparaOportunidadeConteudo(ss, dd, e, p(), { sessao: s, derived: d }); if (!pr.aplicado) throw Error(pr.erro);
  const oportunidade = rolarTeste(pr.pedidoRolagem, () => 0.999), dano = rolarDano({ grupos: arma.gruposDano, critico: true, linhaArma: arma }, () => 0.5);
  const rolada = S.registraRolagem(S.registraRolagem(pr.sessao, oportunidade), dano);
  t(`${marca} Desengajar posterior também barra confirmação preparada`, confirmaAtaqueConteudo(rolada, dd, des.sessao, d, { ataqueId: oportunidade.id, danoId: dano.id, alvoId: c.id }, p()).sessao === rolada, true);
 }
for (const sistema of ["player", "afty"]) {
  const addon = { id: "alma-livre-agil", nome: "Alma Livre na Mesa", paraRaw: "afty", libera: ["soPorAddon:tal_alma_livre"] };
  t(`${sistema} liberação explícita de Alma Livre é válida`, validarPacote(addon), []); aplicarAddons([addon]);
  const c = ficha(sistema, "restringido"); c.addons = [addon]; c.talentos = ["tal_alma_livre"];
  c.escolhasTalento = { tal_alma_livre: ["tal_alma_livre_esp_lutador"] }; c.habilidades.push("lut_acao_agil");
  const d = deriveAfty(c), s = inicio(d), entrada = { id: "lut_acao_agil", comando: "andar", distancia: 1.5, emSeuTurno: true, descontarPE: true };
  t(`${sistema} duas origens com concessão legítima e orçamento válido`, [d.habilidades.inacessiveis, d.habilidades.excedeu, d.talentos.inacessiveis], [[], false, []]);
  t(`${sistema} mesmo nome usa a cadência melhor disponível`, M.fonteAcaoAgilConteudo(d, "lut_acao_agil"), { id: "res_acao_agil", por: "turno" });
  const r = M.usaAcaoAgilConteudo(s, d, entrada, p()); if (!r.aplicado) throw Error(r.erro);
  t(`${sistema} fonte efetiva e limites compartilham uma identidade`, [r.registro.habilidade, r.sessao.usos["turno:uso:acao_agil"], r.sessao.usos["rodada:uso:acao_agil"]], ["res_acao_agil", 1, 1]);
  t(`${sistema} não recebe segunda ação pelo outro nome de catálogo`, M.usaAcaoAgilConteudo(r.sessao, d, { ...entrada, id: "res_acao_agil" }, p()).sessao === r.sessao, true);
  const soLutador = deriveAfty({ ...c, habilidades: ["lut_acao_agil"] });
  t(`${sistema} perder a fonte Restringido não devolve uso na rodada`, M.usaAcaoAgilConteudo(r.sessao, soLutador, entrada, p()).sessao === r.sessao, true);
  const turno = S.iniciaTurnoFicha(r.sessao, d), outra = M.usaAcaoAgilConteudo(turno, d, entrada, p());
  t(`${sistema} próxima entrada de turno permite a cadência Restringido`, [outra.aplicado, outra.sessao.usos["turno:uso:acao_agil"], outra.sessao.usos["rodada:uso:acao_agil"]], [true, 1, 1]);
  const antesDeConceder = M.usaAcaoAgilConteudo(s, soLutador, entrada, p());
  t(`${sistema} ganhar outra fonte no mesmo turno não devolve a ação`, M.usaAcaoAgilConteudo(antesDeConceder.sessao, d, { ...entrada, id: "res_acao_agil" }, p()).sessao === antesDeConceder.sessao, true);
  aplicarAddons([]);
}
t("Mesmo Morto conserva a exceção vital nativa", impedimentoParaAgirConteudo({ vital: { estado: "morrendo" }, especializacaoSessao: { modoMorte: "mesmo_morto" } }), null);
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
