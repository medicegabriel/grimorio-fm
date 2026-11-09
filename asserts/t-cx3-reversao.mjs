import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { createBlankFeitico } = await import(R + "afty-feiticos.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
let ok = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
function ficha(sistema) {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.name = "CX3 Reversão"; c.core.nd = 16;
  c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } };
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.especializacoes = [{ id: "conjurador", nivel: 16 }]; c.pericias = { feiticaria: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
  c.aptidoes = { cl: 3, er: 2, au: 0, bar: 0, dom: 0 };
  c.aptidoesAmaldicoadas = ["energia_reversa", "reversao_de_tecnica"];
  aplicarAddons(c.addons); return c;
}
const feitico = (id, nivel = 3) => ({ ...createBlankFeitico(), id, nome: id, nivel });
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema); c.feiticos = [feitico("f")];
  const normal = deriveAfty(c); c.feiticos[0].reversaoTecnica = true;
  const d = deriveAfty(c), linha = d.feiticos.lista.find((f) => f.id === "f");
  t(`${sistema} custo por nível`, [normal.feiticos.lista[0].custoPE, linha.custoPE], [8, 11]);
  t(`${sistema} fonte do custo`, linha.partesCustoPE.filter((p) => p.label === "Reversão de Técnica").map((p) => p.valor), [3]);
  t(`${sistema} uma vaga exclusiva`, [d.orcamentoHabilidades.exclusivasReversao, d.orcamentoHabilidades.exclusivasReversaoUsadas], [1, 1]);
  t(`${sistema} não dá vaga genérica`, d.orcamentoHabilidades.exclusivasFeitico, normal.orcamentoHabilidades.exclusivasFeitico);
  c.feiticos.push({ ...feitico("variacao", 2), variacaoDe: "f" });
  const variacao = deriveAfty(c);
  t(`${sistema} variação herda identidade e custo do nível atual`, variacao.feiticos.lista.find((f) => f.id === "variacao").custoPE, 7);
  t(`${sistema} variação não usa outra vaga`, variacao.orcamentoHabilidades.exclusivasReversaoUsadas, 1);
  t(`${sistema} serializar preserva marca e custo`, deriveAfty(JSON.parse(JSON.stringify(c))).feiticos.lista.find((f) => f.id === "f").custoPE, 11);
  const sem = deriveAfty({ ...c, aptidoesAmaldicoadas: ["energia_reversa"] });
  t(`${sistema} retirada da aptidão suspende custo e vaga`, [sem.feiticos.lista[0].custoPE, sem.orcamentoHabilidades.exclusivasReversao], [8, 0]);
  t(`${sistema} retirada mantém aviso de identidade`, sem.feiticos.lista[0].avisos.includes("Reversão de Técnica Indisponível"), true);
  const passiva = ficha(sistema); passiva.feiticos = [{ ...feitico("p"), tipo: "passivo", categoriaPassivo: "defesa" }];
  const pn = deriveAfty(passiva); passiva.feiticos[0].reversaoTecnica = true;
  const pr = deriveAfty(passiva);
  t(`${sistema} Passiva preserva diferença autorizada`, [pn.feiticos.lista[0].custoPeMaximo, pr.feiticos.lista[0].custoPeMaximo], sistema === "player" ? [6, 9] : [null, null]);
  t(`${sistema} Passiva chega à reserva de PE`, pn.pe - pr.pe, sistema === "player" ? 3 : 0);
  t(`${sistema} Passiva também pode usar vaga de Reversão`, pr.orcamentoHabilidades.exclusivasReversaoUsadas, 1);
  const limite = ficha(sistema), vazio = deriveAfty(limite), o = vazio.orcamentoHabilidades;
  const n = sistema === "player" ? o.proprioFeitico + o.exclusivasFeitico : o.comum + o.exclusivasFeitico - o.gerais;
  limite.feiticos = Array.from({ length: n + 1 }, (_, i) => feitico(`comum-${i}`, 1));
  const cheio = deriveAfty(limite);
  t(`${sistema} vaga reservada não cobre Feitiço comum`, sistema === "player" ? cheio.orcamentoHabilidades.excedeuFeitico : cheio.orcamentoHabilidades.excedeu, true);
  limite.feiticos[0].reversaoTecnica = true;
  const cabe = deriveAfty(limite);
  t(`${sistema} Reversão cabe na vaga própria`, sistema === "player" ? cabe.orcamentoHabilidades.excedeuFeitico : cabe.orcamentoHabilidades.excedeu, false);
  limite.feiticos.push({ ...feitico("segunda-reversao", 1), reversaoTecnica: true });
  const duas = deriveAfty(limite);
  t(`${sistema} segunda Reversão usa orçamento normal`, [duas.orcamentoHabilidades.exclusivasReversaoUsadas, sistema === "player" ? duas.orcamentoHabilidades.excedeuFeitico : duas.orcamentoHabilidades.excedeu], [1, true]);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
