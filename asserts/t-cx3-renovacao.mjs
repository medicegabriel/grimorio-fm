import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `cx3-renovacao-${++seq}`, registraAcao: true });
function ficha(sistema, nivel = 12, classe = "combatente") {
  const c = createBlankAfty(); c.id = `renovacao-${++seq}`; c.rulesVersion = sistema; c.core.nd = nivel; c.attrMethod = "fixos";
  c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } }; c.especializacoes = [{ id: classe, nivel }];
  c.pericias = { atletismo: "treinado", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
function prepara(c, { rng = 0.999, queda = false, cheio = false, rd = false, inimigo = true } = {}) {
  const d = deriveAfty(c), alvoC = ficha(c.rulesVersion), da = deriveAfty({ ...alvoC, ...(rd ? { buffsSessao: [{ id: "rd", nome: "RD de Teste", canal: "rdGeral", expr: "1000" }] } : {}) });
  const linha = d.dano.entradas.find((l) => l.id === "basico");
  let s = { ...S.iniciaCombate(S.sessaoEmBranco(d), d), peAtual: cheio ? d.pe : d.pe - 5, peTempFontes: { reserva: 3 } };
  const sa = { ...S.iniciaCombate(S.sessaoEmBranco(da), da), ...(queda ? { hpAtual: 1 } : {}) };
  const ataque = rolarTeste({ rotulo: linha.nome, tipoTeste: "ataque", bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, () => rng);
  const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: ataque.critico, linhaArma: linha }, () => 0.5);
  s = S.registraRolagem(S.registraRolagem(s, ataque), dano);
  const entrada = { ataqueId: ataque.id, danoId: dano.id, alvoId: alvoC.id, inimigo }, pedido = p();
  const r = confirmaAtaqueConteudo(s, d, sa, da, entrada, pedido);
  if (!r.aplicado) throw new Error(r.erro);
  return { s, sa, d, da, ataque, entrada, pedido, r };
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema);
  if (sistema === "afty") c.habilidades = ["cmb_renovacao_pelo_sangue"];
  t(`${sistema} escolha de base sem excesso`, [deriveAfty(c).habilidades.inacessiveis, deriveAfty(c).habilidades.excedeu], [[], false]);
  if (sistema === "afty") t("Afty não recebe automaticamente a base de Player", prepara(ficha(sistema)).r.energiaRecuperada, 0);
  for (const [nome, op] of [["crítico", {}], ["abate sem crítico", { rng: 0.75, queda: true }], ["crítico e abate", { queda: true }], ["crítico sem dano", { rd: true }]]) {
    const { s, d, da, entrada, pedido, r } = prepara(c, op);
    t(`${sistema} ${nome} recupera um PE`, [r.energiaRecuperada, r.sessao.peAtual - s.peAtual], [1, 1]);
    t(`${sistema} ${nome} não altera PE temporário/ações`, [r.sessao.peTempFontes, r.sessao.uso.acoes], [s.peTempFontes, s.uso.acoes]);
    const recibo = r.sessao.log.find((l) => l.rotulo === "Ataque Confirmado");
    t(`${sistema} ${nome} fonte no recibo real`, [recibo.energiaRecuperada, recibo.fontes], [1, [{ label: "Renovação pelo Sangue", valor: 1 }]]);
    t(`${sistema} ${nome} repetir a confirmação não recupera`, confirmaAtaqueConteudo(r.sessao, d, r.sessaoAlvo, da, entrada, p()).sessao === r.sessao, true);
    t(`${sistema} ${nome} identidade original é idempotente`, confirmaAtaqueConteudo(r.sessao, d, r.sessaoAlvo, da, entrada, pedido).repetida, true);
    if (nome === "abate sem crítico") t(`${sistema} gatilho é abate real sem crítico`, [r.ataque.critico, recibo.abateu], [false, true]);
    if (nome === "crítico sem dano") t(`${sistema} crítico basta mesmo absorvido`, recibo.calculos.every((l) => l.final === 0), true);
  }
  for (const [nome, op] of [["erro", { rng: 0 }], ["acerto normal", { rng: 0.75 }], ["aliado", { inimigo: false }], ["declaração inválida de inimigo", { inimigo: "sim" }]]) {
    const { s, r } = prepara(c, op);
    t(`${sistema} ${nome} não recupera energia`, [r.energiaRecuperada, r.sessao.peAtual], [0, s.peAtual]);
  }
  const cheia = prepara(c, { cheio: true });
  t(`${sistema} não passa do PE máximo`, [cheia.r.energiaRecuperada, cheia.r.sessao.peAtual], [0, cheia.d.pe]);
  for (const cc of [ficha(sistema, 5), ficha(sistema, 12, "lutador")]) {
    const { s, r } = prepara(cc);
    t(`${sistema} sem a base de Combatente 6 não recupera`, [r.energiaRecuperada, r.sessao.peAtual], [0, s.peAtual]);
  }
  const { s, d, r } = prepara(c);
  const relida = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d);
  t(`${sistema} energia e fonte persistem`, [relida.peAtual, relida.log[0].energiaRecuperada, relida.log[0].fontes], [s.peAtual + 1, 1, [{ label: "Renovação pelo Sangue", valor: 1 }]]);
  const pacote = { id: "cx3-renovacao-remendo", nome: "Requisito de Teste", paraRaw: "afty", substitui: { habilidades: [{ id: "cmb_renovacao_pelo_sangue", requisitos: [{ tipo: "atributo", attr: "constituicao", valor: 30 }] }] } };
  c.addons = [pacote]; aplicarAddons([pacote]);
  const inac = prepara(c);
  t(`${sistema} base inacessível no escopo próprio não recupera`, [inac.d.habilidades.inacessiveis.includes("cmb_renovacao_pelo_sangue"), inac.r.energiaRecuperada], [true, 0]);
  aplicarAddons([]);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
