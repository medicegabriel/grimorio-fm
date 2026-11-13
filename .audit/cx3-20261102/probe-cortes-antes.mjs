import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import fs from "node:fs";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { getTalento } = await import(new URL("afty-talentos.js", R));
const { catalogoDoTipo } = await import(new URL("afty-equipamentos.js", R));
const { efeitosDaSessao } = await import(new URL("afty-efeitos.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
const { opcoesDeriveDaSessao } = await import(new URL("ficha/ficha-opcoes-derive.js", R));
const { rolarTeste, rolarDano } = await import(new URL("ficha/ficha-rolagem.js", R));
const { prepararRolagem } = await import(new URL("ficha/abas-g2/rolagem-g2.js", R));
const { registraRolagemArma } = await import(new URL("afty-propriedades-armas.js", R));
const { confirmaAtaqueConteudo } = await import(new URL("ficha/ficha-conteudo-combate.js", R));
const { usa } = await import(new URL("ficha/ficha-uso.js", R));
const { comBuff } = await import(new URL("ficha/ficha-uso-estado.js", R));
const resultados = [];
for (const sistema of ["player", "afty"]) {
 const c = createBlankAfty(); c.id = "cortes"; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.talentos = ["tal_especialista_em_cortes"];
 c.escolhasTalento = { tal_especialista_em_cortes: [getTalento("tal_especialista_em_cortes").escolha.opcoes[0].id] };
 const arma = catalogoDoTipo("arma", c).find(a => a.classe === "simples" && a.categoria === "corpo" && a.dano?.tipo === "ct");
 c.equipamentos.itens = [{ uid: "cortante", tipo: "arma", refId: arma.id, equipado: true, qtd: 1 }];
 const ca = { ...c, id: "alvo", talentos: [], escolhasTalento: {} }, d = deriveAfty(c), da = deriveAfty(ca);
 let s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 }, sa = { ...S.iniciaCombate(S.sessaoEmBranco(da), da), rodada: 1 };
 const linha = d.dano.entradas.find(l => l.id === arma.id), desc = prepararRolagem({ tipo: "teste", rotulo: linha.nome, bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, { sessao: s, derived: d });
 const teste = rolarTeste(desc.pronta, () => 0.999); s = registraRolagemArma(S.registraRolagem(s, teste), desc.desc, teste);
 const danoDesc = prepararRolagem({ tipo: "dano", rotulo: linha.nome, grupos: linha.gruposDano, linhaArma: linha, modoDano: "critico" }, { sessao: s, derived: d });
 const dano = rolarDano(danoDesc.pronta, () => 0.5); s = registraRolagemArma(S.registraRolagem(s, dano), danoDesc.desc, dano);
 const ataque = confirmaAtaqueConteudo(s, d, sa, da, { ataqueId: teste.id, danoId: dano.id, alvoId: ca.id }, { opId: "confirmacao-cortes" });
 if (!ataque.aplicado) throw Error(ataque.erro);
 const derivar = s => deriveAfty({ ...ca, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
 const base = derivar(ataque.sessaoAlvo).movimento;
 let grupos = ataque.sessaoAlvo;
 for (const id of ["emissor-a", "emissor-b"]) {
  grupos = usa(grupos, derivar(grupos), { id, nome: "Especialista em Cortes", duracao: { ate: "cena" }, efeitos: [{ tipo: "buff", canal: "movimento", expr: "-4.5" }] }, { opId: id }).sessao;
  const fx = grupos.uso.ativos[id].efeitos[0]; grupos = comBuff(grupos, { ...grupos.buffs.find(b => b.id === fx.id), grupoNaoAcumula: "tal_especialista_em_cortes" });
 }
 resultados.push({ sistema, arma: arma.nome, talentosInacessiveis: d.talentos.inacessiveis, excedeu: d.talentos.excedeu,
  acerto: ataque.ataque.acertou, danoCortanteFinal: ataque.calculos.filter(x => x.tipoDano === "ct").map(x => x.final),
  movimentoAposAtaque: base, movimentoComDuasCopiasAgrupadas: derivar(grupos).movimento,
  gruposEncaminhadosAoMotor: efeitosDaSessao({ buffsSessao: grupos.buffs }).filter(x => x.canal === "movimento").map(x => x.grupoNaoAcumula ?? null) });
}
fs.writeFileSync(".audit/cx3-20261102/probe-cortes-depois.json", JSON.stringify(resultados, null, 2)); console.log(JSON.stringify(resultados, null, 2));
