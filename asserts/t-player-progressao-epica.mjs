import { register } from "node:module";
import { readFileSync } from "node:fs";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const AN = await import(R + "afty-alto-nivel.js");
const EF = await import(R + "afty-efeitos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { createBlankFeitico } = await import(R + "afty-feiticos.js");
const { resumoAtributos } = await import(R + "afty-atributos.js");
const TE = await import(R + "afty-treinos-especiais.js");
const { focosGastos } = await import(R + "afty-treinamentos.js");
const { validarRegrasAfty } = await import(R + "afty-regras-addon.js");
const pacotes = ["player-progressao-epica", "player-alto-nivel-afty"]
  .map((id) => AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/" + id + ".json", import.meta.url), "utf8"))));
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
};
const ficha = (nd = 35, addons = pacotes) => {
  const f = createBlankAfty(); f.rulesVersion = "player"; f.core.nd = nd;
  f.core.origem = { id: "inato" }; f.addons = structuredClone(addons); return f;
};
const derive = (f) => { AD.aplicarAddons(f.addons); return deriveAfty(f); };
const com = (mel = [], len = [], escolhas = {}) => {
  const f = ficha(); f.melhoriasSuperiores = mel; f.habilidadesLendarias = len;
  f.escolhasAltoNivel = escolhas; return derive(f);
};
for (const p of pacotes) t("Pacote válido " + p.id, AD.validarPacote(p), []);
t("Chaves inválidas são recusadas", validarRegrasAfty({ nivelJogadorSemTeto: 1, focosPorNivel: -1, pontosAtributoPorCiclo: 1.5 }).length, 3);
for (const n of [30, 32, 35, 36, 40, 50]) {
  const f = ficha(n); const d = derive(f);
  t("Nível efetivo " + n, [AD.nivelDaFicha(f), d.nd], [n, n]);
  t("Interlúdios " + n, d.focosTotais, Math.floor(n * 1.5));
  t("Melhorias " + n, d.altoNivel.melhorias.total, Math.floor((n - 21) / 2) + 1);
  t("Lendárias " + n, d.altoNivel.lendarias.total, Math.floor((n - 22) / 2) + 1);
  t("Aptidão a cada dois níveis " + n, d.totalAptidao - derive(ficha(20)).totalAptidao, Math.floor((n - 20) / 2));
  t("Habilidade mantém teto Player " + n, TE.maxVezesTreinoEspecial("tes_habilidade", {nd:n,sistema:"player"}), 2);
  t("Aptidão mantém teto Player " + n, TE.maxVezesTreinoEspecial("tes_aptidao", {nd:n,sistema:"player"}), 2);
}
const sem = ficha(35, []);
AD.aplicarAddons(pacotes);
t("Encontro misto não libera nível alheio", [AD.nivelDaFicha(sem), deriveAfty(sem).nd], [30, 30]);
t("Campo tem teto normal", AD.nivelMaximoDaFicha(sem), 30);
t("Campo sem teto com addon", AD.nivelMaximoDaFicha(ficha()), null);
t("Pontos de atributo preservados", resumoAtributos(ficha()).pontosNivel, 24);
t("Pré-requisito de Ápice permanece 26", AN.getHabilidadeLendaria("len_atingir_apice", ficha()).requisitos, [{tipo:"nd",valor:26}]);
const zero = com();
const metade = Math.floor(zero.maestria / 2);
t("Defesa soma metade do BT", com(["mel_defesa"]).defesa - zero.defesa, metade);
t("CD soma metade do BT", com(["mel_classe_de_dificuldade"]).cd - zero.cd, metade);
t("Energia soma BT", com(["mel_energia"]).pe - zero.pe, zero.maestria);
t("Alma aumenta em 15 e 10", EF.valorCanal(com(["mel_alma","mel_alma","mel_alma"]).efeitos, "almaMax"), 25);
t("Vida aumenta em 20, 15 e 15", com(["mel_vida","mel_vida","mel_vida","mel_vida"]).hp - zero.hp, 50);
t("Defesa não se repete", com(["mel_defesa","mel_defesa"]).altoNivel.melhorias.gastos, 1);
const tr = com(["mel_resistencia"], [], {mel_resistencia:["vontade"]});
for (const linha of tr.testes.resistencias) {
  const antes = zero.testes.resistencias.find((r) => r.value === linha.value);
  t("Resistência soma em " + linha.value, linha.bonus - antes.bonus, metade);
  t("Margem só no TR escolhido " + linha.value, linha.margemCritico, linha.value === "vontade" ? 20-metade : 20);
}
const dano = ficha(); dano.melhoriasSuperiores = ["mel_dano"]; dano.feiticos = [createBlankFeitico()];
t("Feitiço de Dano soma nível em vez de BT", derive(dano).feiticos.lista[0].rolagens[0].fixo, 35);
t("Ataque ou Aptidão soma BT", EF.valorCanal(derive(dano).efeitos, "danoBonus"), zero.maestria);
const prof = ficha(); prof.pericias = {percepcao:"treinado"}; prof.habilidadesLendarias = ["len_conhecimento_iluminado"];
prof.escolhasAltoNivel = {len_conhecimento_iluminado:["percepcao","acrobacia"]};
const pd = derive(prof);
t("Conhecimento só oferece treinadas", pd.altoNivel.escolhas.opcoesPorItem.len_conhecimento_iluminado.map((p)=>p.id), ["percepcao"]);
t("Conhecimento recusa destreinada", pd.altoNivel.escolhas.mapa.len_conhecimento_iluminado, ["percepcao"]);
t("Conhecimento promove a Mestre", pd.periciaProf.percepcao, "mestre");
const dom = ficha(); dom.habilidadesLendarias = ["len_dominancia_em_tecnica"];
dom.escolhasAltoNivel = {len_dominancia_em_tecnica:["tecnicas"]};
t("Dominância concede 3 vagas compartilhadas", derive(dom).orcamentoHabilidades.exclusivasFeitico - zero.orcamentoHabilidades.exclusivasFeitico, 3);
dom.escolhasAltoNivel.len_dominancia_em_tecnica = ["variacoes"];
dom.feiticos = Array.from({length:5},(_,i)=>({...createBlankFeitico(),id:"var"+i,variacaoDeTecnica:true}));
let dd = derive(dom);
t("Dominância oferece cinco variações", [dd.orcamentoHabilidades.exclusivasVariacao,dd.orcamentoHabilidades.exclusivasVariacaoUsadas,dd.orcamentoHabilidades.proprioFeiticoUsado], [5,5,0]);
dom.feiticos[0].variacaoDeTecnica = false; dd = derive(dom);
t("Feitiço comum não usa vaga de variação", [dd.orcamentoHabilidades.exclusivasVariacaoUsadas,dd.orcamentoHabilidades.proprioFeiticoUsado], [4,1]);
dom.feiticos.push({...createBlankFeitico(),variacaoDe:"var1"});
t("Liberação continua gratuita e separada", derive(dom).orcamentoHabilidades.exclusivasVariacaoUsadas, 4);
const inv = "player-alto-nivel-afty:len_invencivel";
const manip = "player-alto-nivel-afty:len_manipulacao_avancada_de_energia";
AD.aplicarAddons(pacotes);
const acesso = (id,nd,lendarias) => AN.avaliarAcessoAltoNivel(AN.getHabilidadeLendaria(id,ficha()),{nd,lendarias}).ok;
t("Invencível exige outra Lendária", acesso(inv,35,[]), false);
t("Invencível exige nível 26", acesso(inv,25,["len_intocavel"]), false);
t("Invencível aceita Intocável", acesso(inv,26,["len_intocavel"]), true);
t("Invencível aceita Inquebrável", acesso(inv,26,["len_inquebravel"]), true);
const ivd = com([], [inv,"len_intocavel"]);
t("Invencível RD geral e alma", [EF.valorCanal(ivd.efeitos,"rdGeral"),EF.valorCanal(ivd.efeitos,"rdAlma")], [35,35]);
t("Manipulação exige Favorecido ou Inesgotável", acesso(manip,35,[]), false);
t("Manipulação aceita Inesgotável", acesso(manip,35,["len_inesgotavel"]), true);
const mf = ficha(); mf.aptidoes.cl = 6; mf.habilidadesLendarias = [manip,"len_inesgotavel","len_versatilidade_extrema"]; mf.escolhasAltoNivel = {len_versatilidade_extrema:["cl"]};
t("Manipulação reduz metade de Controle", EF.custoEmPe(10,derive(mf).efeitos).valor, 7);
const custo = (geral,extra=0) => EF.custoEmPe(10, EF.aplicarEfeitos([
  {canal:"custoPE",expr:"3",naoAcumulaReducaoGeral:true},
  {canal:"custoPE",expr:String(geral)},
  {canal:"custoPE",expr:String(extra),alvo:"feitico"},
]),"feitico").valor;
t("Redução maior dos Seis Olhos prevalece", custo(6), 4);
t("Manipulação prevalece sobre redução menor", custo(1), 7);
t("Redução específica ainda acumula", custo(6,2), 2);
t("Piso de custo continua 1", custo(20), 1);
const mesa = com([],["len_negar_a_morte","len_resistencia_lendaria","player-alto-nivel-afty:len_incansavel"]).mesa;
t("Negar a Morte uma vez por cena", [mesa["altoNivel:len:len_negar_a_morte"].usos.max,mesa["altoNivel:len:len_negar_a_morte"].usos.recarga,mesa["altoNivel:len:len_negar_a_morte"].resultados[0].valor], [1,"cena",70]);
t("Resistência Lendária dois usos", mesa["altoNivel:len:len_resistencia_lendaria"].usos.max, 2);
t("Incansável calcula metade do nível", mesa["altoNivel:len:player-alto-nivel-afty:len_incansavel"].resultados[0].valor, 17);
AD.aplicarAddons(pacotes);
t("Catálogo validado após remendos", AN.validarCatalogoAltoNivel(), []);
t("Remendo não vaza para Player comum", AN.getMelhoriaSuperior("mel_defesa","player",sem).nome, "Melhoria de Classe de Armadura");
t("Remendo pertence à ficha", AN.getMelhoriaSuperior("mel_defesa","player",ficha()).nome, "Melhoria de Defesa");
t("Novas Lendárias só na ficha com addon", AN.getHabilidadeLendaria(inv,sem), null);
const preview = JSON.parse(readFileSync(new URL("../previas/satoru-gojo-player.json",import.meta.url),"utf8")).creatures[0];
const prevd = derive(preview);
t("Prévia Player nível 35", [preview.rulesVersion,prevd.nd,preview.folderId], ["player",35,null]);
t("Atributos preservados", prevd.attrEff, {forca:16,destreza:22,constituicao:32,inteligencia:24,sabedoria:20,presenca:18});
t("Classes preservadas", prevd.especializacoes.escolhidas.map(e=>[e.id,e.nivel]), [["conjurador",20],["lutador",7],["combatente",8]]);
t("Treinos especiais aparados", [TE.vezesPorTreinoEspecial(preview).tes_habilidade,TE.vezesPorTreinoEspecial(preview).tes_aptidao], [2,2]);
t("Treinos continuam custando 82 de 52", [focosGastos(preview.treinamentos,preview.core.origem.id)+TE.focosDeTreinosEspeciais(preview),prevd.focosTotais], [82,52]);
t("Recursos atuais recalculados", [preview.stats.hpMax,preview.stats.peMax,preview.combatState.hpCurrent,preview.combatState.peCurrent,preview.combatState.almaCurrent], [prevd.hp,prevd.pe,prevd.hp,prevd.pe,prevd.almaMax]);
const removida = {...preview,addons:[]};AD.aplicarAddons([]);
t("Remover addon restaura teto 30", deriveAfty(removida).nd,30);
t("Escolhas gravadas continuam intactas", preview.core.nd,35);
console.log(bad.length ? "FALHAS (" + bad.length + "):\n" + bad.join("\n") : "TODOS OS " + ok + " ASSERTS PASSARAM");
process.exitCode = bad.length ? 1 : 0;
