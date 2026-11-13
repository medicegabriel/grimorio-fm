import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { deslocaAlvoTalento } = await import(R + "ficha/ficha-conteudo-manobras.js");
const { recursosDeEspecializacao } = await import(R + "ficha/ficha-especializacoes.js");
for (const sistema of ["player", "afty"]) {
  const a = createBlankAfty(); a.rulesVersion = sistema; a.id = "imunidade-atacante"; a.name = "CX3 Imunidade"; a.core.nd = 12;
  a.attrMethod = "fixos"; a.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  a.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  a.especializacoes = [{ id: "combatente", nivel: 12 }]; a.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  a.talentos = ["tal_especialista_em_concussao"];
  const b = structuredClone(a); b.id = "imunidade-alvo"; b.talentos = []; b.habilidades = ["cmb_assumir_postura"];
  b.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_terra"] }; b.combate = { ativo: true, postura: "terra" };
  aplicarAddons([]); const d = deriveAfty(a), da = deriveAfty(b), linha = d.dano.entradas.find(l => l.id === "basico");
  let s = S.iniciaCombate(S.sessaoEmBranco(d), d), sa = { ...S.iniciaCombate(S.sessaoEmBranco(da), da), combate: b.combate };
  const ataque = rolarTeste({ rotulo: "Ataque", bonus: linha.acerto, margem: linha.margemCritico, tipoTeste: "ataque", linhaArma: linha }, () => 0.8);
  const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, linhaArma: linha }, () => 0.5);
  s = S.registraRolagem(S.registraRolagem(s, ataque), dano);
  const r = confirmaAtaqueConteudo(s, d, sa, da, { ataqueId: ataque.id, danoId: dano.id, alvoId: b.id }, { opId: "imunidade-acerto" });
  if (!r.aplicado) throw Error(r.erro);
  const mov = deslocaAlvoTalento(r.sessao, d, r.sessaoAlvo, da, { talento: "tal_especialista_em_concussao", ataqueId: ataque.id, alvoId: b.id, distancia: 3, espacoDesocupado: true }, { opId: "imunidade-movimento" });
  console.log(JSON.stringify({ sistema, requisitos: [d.talentos.inacessiveis, da.habilidades.inacessiveis], postura: da.combate.postura,
    fortitude: da.efeitos.detalhes.filter(x => x.origem === "cmb_postura_da_terra"),
    imune: recursosDeEspecializacao(sa, da).imuneMovimentoForcado, movimento: { aplicado: mov.aplicado, distancia: mov.deslocamento, erro: mov.erro } }));
}
