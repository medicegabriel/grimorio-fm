import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { efeitosDeTalentosConfigurados } = await import(R + "afty-talentos.js");
const { definirEscolhaTreino } = await import(R + "afty-treinamentos.js");
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const ficha = (sistema, nd = 8) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.name = "CX3 Isolada";
  c.core.nd = nd;
  c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } };
  c.attrMethod = "fixos";
  c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.attrNivel.sabedoria = nd >= 8 ? 3 : 0;
  c.especializacoes = [{ id: "combatente", nivel: nd }];
  c.pericias = { medicina: "mestre" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  aplicarAddons(c.addons);
  return c;
};
const arma = (c, refId) => { c.equipamentos.itens = [{ uid: "cx3-arma", tipo: "arma", refId, qtd: 1, equipado: true }]; };
for (const sistema of ["player", "afty"]) {
  for (const [nd, dados, faces] of [[1, 2, 6], [4, 2, 12], [8, 3, 12], [12, 6, 8], [16, 6, 10]]) {
    const c = ficha(sistema, nd);
    c.talentos = ["tal_adepto_de_medicina"];
    const d = deriveAfty(c);
    const l = d.cura.linhas.find((l) => l.id === "tal_adepto_de_medicina");
    t(`${sistema} Medicina ${nd}: curva por personagem`, [l?.dados, l?.dado, l?.alcance], [dados, `d${faces}`, "Toque"]);
    t(`${sistema} Medicina ${nd}: usos pela metade`, l.usos, Math.floor(Math.max(d.mods.sabedoria, d.mods.presenca) / 2));
    t(`${sistema} Medicina ${nd}: não concede Suporte inteiro`, d.habilidades.efetivas.includes("sup_suporte_em_combate"), false);
  }
  const c = ficha(sistema);
  c.talentos = ["tal_adepto_de_medicina"];
  c.attrNivel.sabedoria = 0;
  c.attributes.sabedoria = 8;
  c.core.origem.bonusAtributos = { forca: 2, destreza: 1 };
  t(`${sistema} zero usos não vira ilimitado`, deriveAfty(c).cura.linhas.find((l) => l.id === "tal_adepto_de_medicina").usos, 0);
  for (const [ref, talentos, alcances] of [
    ["arm_azagaia", ["tal_tecnicas_de_arremesso", "tal_mestre_do_arremesso"], [18, 30]],
    ["arm_chicote", ["tal_mestre_dos_chicotes"], [4.5, 4.5]],
    ["arm_arco_curto", ["tal_tecnicas_de_arremesso", "tal_mestre_do_arremesso", "tal_mestre_dos_chicotes"], [24, 48]],
  ]) {
    const c = ficha(sistema); arma(c, ref); c.talentos = talentos;
    const d = deriveAfty(c), l = d.dano.entradas.find((l) => l.id === ref);
    t(`${sistema} ${ref}: alcance e contraprova`, [l.alcance.curto, l.alcance.longo], alcances);
    if (ref !== "arm_arco_curto") t(`${sistema} ${ref}: fonte no alcance`, l.alcance.partes.some((p) => /Mestre/.test(p.label)), true);
  }
  const treino = ficha(sistema);
  treino.core.tipo = "restringido"; treino.core.origem = { id: "restringido" };
  treino.especializacoes = [{ id: "restringido", nivel: 8 }];
  treino.focosLivres = 2;
  treino.treinamentos = { potencial_fisico: 2 };
  const base = deriveAfty(treino);
  let escolhida = definirEscolhaTreino(treino, "potencial_fisico", "atributo_1", "forca", sistema);
  escolhida = definirEscolhaTreino(escolhida, "potencial_fisico", "atributo_2", "forca", sistema);
  const d = deriveAfty(escolhida);
  t(`${sistema} Potencial: dois pontos no mesmo físico`, d.attrEff.forca - base.attrEff.forca, 2);
  escolhida.treinamentoEscolhas.potencial_fisico.atributo_2 = "sabedoria";
  t(`${sistema} Potencial: import inválido não aumenta mental`, deriveAfty(escolhida).attrEff.sabedoria, base.attrEff.sabedoria);
  escolhida.treinamentos.potencial_fisico = 1;
  t(`${sistema} Potencial: desfazer etapa suspende ganho`, deriveAfty(escolhida).attrEff.forca, base.attrEff.forca);
  escolhida.treinamentos.potencial_fisico = 2;
  escolhida.core.origem = { id: "inato" }; escolhida.core.tipo = "combatente";
  t(`${sistema} Potencial: trocar origem suspende ganho`, deriveAfty(escolhida).attrEff.forca, 14);
  const oficios = ficha(sistema);
  oficios.periciaOficios = { oficio: ["Ferreiro"], oficio__2: ["Canalizador"] };
  oficios.pericias = { oficio: "treinado", oficio__2: "treinado" };
  const sem = deriveAfty(oficios);
  oficios.talentos = ["tal_mestre_da_criacao"];
  oficios.talentosConfig.tal_mestre_da_criacao = { oficios: ["oficio", "oficio__2"] };
  const com = deriveAfty(oficios);
  for (const id of ["oficio", "oficio__2"]) t(`${sistema} Criação: +2 em ${id}`, com.testes.pericias.find((p) => p.id === id).bonus - sem.testes.pericias.find((p) => p.id === id).bonus, 2);
  t(`${sistema} Criação: outra perícia preservada`, com.testes.pericias.find((p) => p.id === "medicina").bonus, sem.testes.pericias.find((p) => p.id === "medicina").bonus);
  t(`${sistema} Criação: escolhas salvas`, deriveAfty(JSON.parse(JSON.stringify(oficios))).testes.pericias.find((p) => p.id === "oficio__2").bonus, com.testes.pericias.find((p) => p.id === "oficio__2").bonus);
  const infalivel = ficha(sistema, 16);
  infalivel.buffsSessao = [{ id: "positivo", nome: "Aumento", canal: "nivelDano", alvo: "basico", expr: "2" }];
  const positivo = deriveAfty(infalivel).dano.entradas.find((l) => l.id === "basico").formulaNormal;
  infalivel.buffsSessao.push({ id: "negativo", nome: "Redução", canal: "nivelDano", alvo: "basico", expr: "-3" });
  const reduzida = deriveAfty(infalivel).dano.entradas.find((l) => l.id === "basico");
  infalivel.talentos = ["tal_ataque_infalivel"];
  const protegida = deriveAfty(infalivel).dano.entradas.find((l) => l.id === "basico");
  t(`${sistema} Infalível ignora redução e preserva aumento`, protegida.formulaNormal, positivo);
  t(`${sistema} contraprova da redução`, reduzida.formulaNormal !== protegida.formulaNormal, true);
  t(`${sistema} imunidade de nível traz fonte`, protegida.partes.some((p) => p.label === "Ataque Infalível"), true);
}
t("Criação: duplicata e id inválido não duplicam", efeitosDeTalentosConfigurados({ talentos: ["tal_mestre_da_criacao"], talentosConfig: { tal_mestre_da_criacao: { oficios: ["oficio", "oficio", "medicina"] } } }).map((e) => [e.alvo, e.expr]), [["oficio", "2"]]);
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
