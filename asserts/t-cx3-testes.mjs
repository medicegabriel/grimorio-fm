import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const O = await import(R + "ficha/ficha-conteudo-testes.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste } = await import(R + "ficha/ficha-rolagem.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `cx3-testes-${++seq}` });
function ficha(sistema) {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.name = "CX3 Testes"; c.core.nd = 16;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 16 }]; c.pericias = { feiticaria: "treinado", acrobacia: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
  aplicarAddons(c.addons); return c;
}
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema); c.treinamentos = { pericia: [{ alvo: "acrobacia", progresso: 4 }], luta: 4 }; c.focosLivres = 10;
  const d = deriveAfty(c); let s = S.sessaoEmBranco(d);
  const pedido = p(), um = O.usaTesteConteudo(s, d, { fonte: "treino", id: "acrobacia", rng: () => 0.1 }, pedido);
  t(`${sistema} treino usa vantagem nativa`, [um.aplicado, um.rolagem?.d20.length, um.rolagem?.modo], [true, 2, "vantagem"]);
  t(`${sistema} treino repete op sem contar`, O.usaTesteConteudo(um.sessao, d, { fonte: "treino", id: "acrobacia" }, pedido).repetida, true);
  const dois = O.usaTesteConteudo(um.sessao, d, { fonte: "treino", id: "acrobacia", modo: "desvantagem" }, p());
  t(`${sistema} desvantagem cancela vantagem`, dois.rolagem.modo, "normal");
  const tres = O.usaTesteConteudo(dois.sessao, d, { fonte: "treino", id: "acrobacia" }, p());
  t(`${sistema} dois usos por descanso`, [tres.aplicado, tres.sessao === dois.sessao], [false, true]);
  t(`${sistema} descanso devolve uso`, O.usaTesteConteudo(S.descansar(dois.sessao, d), d, { fonte: "treino", id: "acrobacia" }, p()).aplicado, true);
  t(`${sistema} outra perícia não herda benefício`, O.usaTesteConteudo(s, d, { fonte: "treino", id: "atletismo" }, p()).sessao === s, true);
  t(`${sistema} sucesso não permite teste oposto`, O.usaTesteConteudo(s, d, { fonte: "treino-sucesso", id: "acrobacia", oposto: true }, p()).sessao === s, true);
  const sucesso = O.usaTesteConteudo(s, d, { fonte: "treino-sucesso", id: "acrobacia", oposto: false }, p());
  t(`${sistema} sucesso sem d20 inventado`, [sucesso.aplicado, sucesso.rolagem.sucesso, sucesso.rolagem.tipo], [true, true, "info"]);
  t(`${sistema} sucesso uma vez por cena`, O.usaTesteConteudo(sucesso.sessao, d, { fonte: "treino-sucesso", id: "acrobacia", oposto: false }, p()).aplicado, false);
  const baixo = rolarTeste({ rotulo: "Acrobacia", periciaId: "acrobacia", bonus: 8, dados: [{ qtd: 1, faces: 3 }], cd: 20 }, () => 0.1);
  const original = S.registraRolagem(s, baixo), repetido = O.rerrolaTreinoPericia(original, d, { id: baixo.id, rng: () => 0.99 }, p());
  t(`${sistema} completo repete apenas d20`, [repetido.aplicado, repetido.rolagem.natural, repetido.rolagem.somaExtras], [true, 20, baixo.somaExtras]);
  t(`${sistema} completo mantém o melhor`, O.rerrolaTreinoPericia(original, d, { id: baixo.id, rng: () => 0 }, p()).rolagem.natural, baixo.natural);
  t(`${sistema} completo não repete duas vezes`, O.rerrolaTreinoPericia(repetido.sessao, d, { id: baixo.id }, p()).aplicado, false);
  const l = O.usaTesteConteudo(s, d, { fonte: "luta", id: "atletismo" }, p());
  t(`${sistema} Luta garante vantagem`, l.rolagem.modo, "vantagem");
  t(`${sistema} Luta usa limite conjunto da rodada`, O.usaTesteConteudo(l.sessao, d, { fonte: "luta", id: "acrobacia" }, p()).aplicado, false);
  const sem = deriveAfty({ ...c, treinamentos: {} });
  t(`${sistema} retirar treino suspende usos`, O.usaTesteConteudo(s, sem, { fonte: "treino", id: "acrobacia" }, p()).aplicado, false);

  const talentos = ficha(sistema); talentos.talentos = ["tal_tempestade_de_ideias", "tal_guarda_infalivel", "tal_tecnicas_defensivas_de_escudo"];
  talentos.talentosConfig.tal_tempestade_de_ideias = { vantagemPericia: "acrobacia" };
  const dt = deriveAfty(talentos); s = S.sessaoEmBranco(dt);
  const temp = O.usaTesteConteudo(s, dt, { fonte: "tempestade", id: "acrobacia" }, p());
  t(`${sistema} Tempestade usa perícia configurada`, [temp.aplicado, temp.rolagem?.modo], [true, "vantagem"]);
  t(`${sistema} Tempestade recusa outra perícia`, O.usaTesteConteudo(s, dt, { fonte: "tempestade", id: "feiticaria" }, p()).aplicado, false);
  t(`${sistema} Guarda exige situação`, O.usaTesteConteudo(s, dt, { fonte: "guarda", id: "vontade" }, p()).aplicado, false);
  const guarda = O.usaTesteConteudo(s, dt, { fonte: "guarda", id: "vontade", reduzDefesaOuTR: true }, p());
  t(`${sistema} Guarda adiciona três apenas nesse TR`, guarda.rolagem.bonus, dt.testes.resistencias.find((r) => r.value === "vontade").bonus + 3);
  const escudo = O.usaTesteConteudo(s, dt, { fonte: "escudo", id: "reflexos", rng: () => 0.85 }, p());
  t(`${sistema} Escudo reduz margem só no teste`, [escudo.rolagem.margemCritico, dt.testes.resistencias.find((r) => r.value === "reflexos").margemCritico], [17, 20]);
  t(`${sistema} Escudo não altera outro TR`, O.usaTesteConteudo(s, dt, { fonte: "escudo", id: "fortitude" }, p()).aplicado, false);
  const aura = ficha(sistema); aura.attrNivel.destreza = 3; aura.aptidoes.au = 3;
  aura.pericias.furtividade = "treinado"; aura.aptidoesAmaldicoadas = ["aura_controlada"];
  const da = deriveAfty(aura), sa = S.sessaoEmBranco(da), furtividade = da.testes.pericias.find((l) => l.id === "furtividade");
  const cheia = O.usaTesteConteudo(sa, da, { fonte: "aura-controlada", id: "furtividade", descontarPE: true }, p());
  t(`${sistema} Aura Controlada completa o bônus sem dobrar a metade`, [cheia.aplicado, cheia.rolagem?.bonus - furtividade.bonus, sa.peAtual - cheia.sessao.peAtual], [true, 2, 1]);
  t(`${sistema} Aura Controlada não muda outras perícias`, O.usaTesteConteudo(sa, da, { fonte: "aura-controlada", id: "acrobacia" }, p()).aplicado, false);
  const semReq = deriveAfty({ ...aura, attrNivel: {} });
  t(`${sistema} Aura Controlada exige os atributos permanentes`, O.usaTesteConteudo(sa, semReq, { fonte: "aura-controlada", id: "furtividade" }, p()).aplicado, false);

  const sup = ficha(sistema); sup.especializacoes = [{ id: "suporte", nivel: 16 }]; sup.habilidades = ["sup_versatilidade"];
  const ds = deriveAfty(sup), ss = S.sessaoEmBranco(ds), atletismo = ds.testes.pericias.find((l) => l.id === "atletismo");
  const pedidoVersa = p(), versa = O.usaTesteConteudo(ss, ds, { fonte: "versatilidade", id: "atletismo", descontarPE: true, rng: () => 0.5 }, pedidoVersa);
  if (!versa.aplicado) throw new Error(`${sistema} Versatilidade: ${versa.erro}`);
  t(`${sistema} Versatilidade admissível`, ds.habilidades.inacessiveis, []);
  t(`${sistema} Versatilidade usa conta nativa de treinado`, [versa.rolagem.bonus, versa.rolagem.natural], [atletismo.bonus + ds.maestria, 11]);
  t(`${sistema} Versatilidade preserva fonte`, versa.rolagem.fontes.at(-1), { label: "Versatilidade", texto: "Treinado" });
  t(`${sistema} Versatilidade paga um PE e um uso`, [ss.peAtual - versa.sessao.peAtual, versa.sessao.usos["hab:sup_versatilidade"]], [1, 1]);
  t(`${sistema} Versatilidade não gasta ação`, versa.sessao.uso.acoes, ss.uso.acoes);
  t(`${sistema} Versatilidade não muda proficiência ou orçamento`, [ds.periciaProf.atletismo, ds.testes.pericias.find((l) => l.id === "atletismo").prof], [null, null]);
  t(`${sistema} Versatilidade não duplica operação`, O.usaTesteConteudo(versa.sessao, ds, { fonte: "versatilidade", id: "atletismo" }, pedidoVersa).repetida, true);
  t(`${sistema} Versatilidade não melhora perícia treinada`, O.usaTesteConteudo(ss, ds, { fonte: "versatilidade", id: "acrobacia" }, p()).sessao === ss, true);
  t(`${sistema} Versatilidade não vira TR`, O.usaTesteConteudo(ss, ds, { fonte: "versatilidade", id: "fortitude" }, p()).sessao === ss, true);
  const esgotada = S.marcaUso(ss, ds.usosHabilidades.sup_versatilidade, ds.mods.sabedoria);
  t(`${sistema} Versatilidade respeita MOD SAB usos`, O.usaTesteConteudo(esgotada, ds, { fonte: "versatilidade", id: "atletismo" }, p()).sessao === esgotada, true);
  t(`${sistema} Versatilidade recupera no descanso único`, O.usaTesteConteudo(S.descansar(esgotada, ds), ds, { fonte: "versatilidade", id: "atletismo" }, p()).aplicado, true);
  const relida = S.normalizaSessao(JSON.parse(JSON.stringify(versa.sessao)), ds);
  t(`${sistema} Versatilidade preserva uso e rolagem ao salvar`, [relida.usos["hab:sup_versatilidade"], relida.log[0].bonus], [1, versa.rolagem.bonus]);
  const pobre = { ...ss, peAtual: 0 };
  t(`${sistema} Versatilidade sem PE não consome`, O.usaTesteConteudo(pobre, ds, { fonte: "versatilidade", id: "atletismo", descontarPE: true }, p()).sessao === pobre, true);
  const manual = O.usaTesteConteudo(ss, ds, { fonte: "versatilidade", id: "atletismo" }, p());
  t(`${sistema} Versatilidade mantém política manual`, [manual.sessao.peAtual, manual.custo.pe.naoDescontado], [ss.peAtual, 1]);
  const semVersa = deriveAfty({ ...sup, especializacoes: [{ id: "combatente", nivel: 16 }], habilidades: [] });
  t(`${sistema} Versatilidade exige fonte atual`, O.usaTesteConteudo(ss, semVersa, { fonte: "versatilidade", id: "atletismo" }, p()).sessao === ss, true);
  const semSab = deriveAfty({ ...sup, attributes: { ...sup.attributes, sabedoria: 8 }, core: { ...sup.core, origem: { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } } } });
  t(`${sistema} Versatilidade com MOD SAB negativo não usa`, O.usaTesteConteudo(S.sessaoEmBranco(semSab), semSab, { fonte: "versatilidade", id: "atletismo" }, p()).aplicado, false);
  const treinadaPorFonte = deriveAfty({ ...sup, treinamentos: { pericia: [{ alvo: "atletismo", progresso: 1 }] }, focosLivres: 5 });
  t(`${sistema} Versatilidade não ignora treino concedido`, [treinadaPorFonte.testes.pericias.find((l) => l.id === "atletismo").prof, O.usaTesteConteudo(ss, treinadaPorFonte, { fonte: "versatilidade", id: "atletismo" }, p()).aplicado], ["treinado", false]);
  for (const oferta of [atletismo.bonus + 2, atletismo.bonus + 30]) {
    const fixo = deriveAfty({ ...sup, buffsSessao: [{ id: "oferta", nome: "Oferta de Teste", canal: "periciaFixa", alvo: "atletismo", expr: String(oferta) },
      { id: "dados", nome: "Dado de Teste", canal: "dadosPericia", alvo: "atletismo:d6", expr: "1" }] });
    const f = fixo.testes.pericias.find((l) => l.id === "atletismo"), r = O.usaTesteConteudo(ss, fixo, { fonte: "versatilidade", id: "atletismo", rng: () => 0.5 }, p());
    t(`${sistema} Versatilidade compara oferta ${oferta} antes de escolher`, r.rolagem.bonus, Math.max(oferta, atletismo.bonus + ds.maestria));
    t(`${sistema} Versatilidade conserva dados extras com oferta ${oferta}`, [r.rolagem.somaExtras, r.rolagem.extras[0].valores], [4, [4]]);
    t(`${sistema} Versatilidade soma das fontes ${oferta}`, f.versatilidade.partes.filter((x) => x.valor != null).reduce((a, x) => a + x.valor, 0), r.rolagem.bonus);
  }
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
