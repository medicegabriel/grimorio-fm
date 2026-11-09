/**
 * CX5: PULSEIRA MAGISTRAL E PULSEIRA PRIMACIAL (Livro p.147 e p.149, p.365)
 *
 * Magistral: *"o usuário se torna treinado em uma perícia a sua escolha"*.
 * Primacial: *"se torna mestre em uma perícia a sua escolha, desde que já seja
 * treinado nela"*. Duas cópias do mesmo acessório são uma fonte (p.365).
 *
 * A escolha mora na ENTRADA do inventário (`escolhaPericia`) e o treino viaja pelo
 * canal `proficienciaPericia` do Motor. Nada é presumido sem a escolha.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (sistema, itens, pericias = null) => {
  const c = createBlankAfty();
  if (sistema === "player") c.rulesVersion = "player";
  c.core.nd = 8;
  c.core.tipo = "misto";
  c.core.patamar = "comum";
  c.core.origem = { id: "inato" };
  if (pericias) c.pericias = pericias;
  c.equipamentos = { itens: itens.map((x, i) => ({ uid: `u${i}`, tipo: "item", qtd: 1, equipado: true, ...x })) };
  return c;
};
const MAG = (pericia, extra = {}) => ({ refId: "it_pulseira_magistral", ...(pericia ? { escolhaPericia: pericia } : {}), ...extra });
const PRI = (pericia, extra = {}) => ({ refId: "it_pulseira_primacial", ...(pericia ? { escolhaPericia: pericia } : {}), ...extra });
const faixa = (c, id) => deriveAfty(c).testes.pericias.find((p) => p.id === id)?.prof ?? null;
const avisos = (c) => deriveAfty(c).equip.avisos;
const falta = (c) => deriveAfty(c).equip.entradas.map((e) => e.faltaEscolha ?? null);

for (const sistema of ["afty", "player"]) {
  const r = (s) => `${sistema}: ${s}`;

  t(r("sem pulseira a perícia não tem faixa"), faixa(ficha(sistema, []), "atletismo"), null);
  t(r("Magistral treina a perícia escolhida"), faixa(ficha(sistema, [MAG("atletismo")]), "atletismo"), "treinado");
  t(r("e só ela"), faixa(ficha(sistema, [MAG("atletismo")]), "acrobacia"), null);
  t(r("Magistral guardada não treina"), faixa(ficha(sistema, [MAG("atletismo", { equipado: false })]), "atletismo"), null);
  t(r("Magistral sem escolha não presume perícia"), ficha(sistema, [MAG(null)]) && deriveAfty(ficha(sistema, [MAG(null)])).testes.pericias.filter((p) => p.prof).length, 0);
  t(r("e marca a entrada para o seletor ler"), falta(ficha(sistema, [MAG(null)])), ["pericia"]);
  t(r("sem virar aviso na aba, que o jogador não conseguiria resolver sem o seletor"), avisos(ficha(sistema, [MAG(null)])), []);
  t(r("com a escolha a marca some"), falta(ficha(sistema, [MAG("atletismo")])), [null]);
  t(r("pulseira guardada não pede escolha"), falta(ficha(sistema, [MAG(null, { equipado: false })])), [null]);
  t(r("a escolha é aparada"), faixa(ficha(sistema, [MAG("  atletismo ")]), "atletismo"), "treinado");

  // Primacial: só onde já há treino.
  t(r("Primacial sozinha em perícia sem treino não dá nada"), faixa(ficha(sistema, [PRI("atletismo")]), "atletismo"), null);
  t(r("Primacial em perícia treinada na ficha dá Mestre"), faixa(ficha(sistema, [PRI("atletismo")], { atletismo: "treinado" }), "atletismo"), "mestre");
  t(r("Primacial não rebaixa quem já é Mestre"), faixa(ficha(sistema, [PRI("atletismo")], { atletismo: "mestre" }), "atletismo"), "mestre");
  t(r("Primacial sem escolha marca a entrada e não treina"), [falta(ficha(sistema, [PRI(null)], { atletismo: "treinado" })), avisos(ficha(sistema, [PRI(null)], { atletismo: "treinado" }))], [["pericia"], []]);
  t(r("Primacial sem escolha deixa a faixa da ficha como estava"), faixa(ficha(sistema, [PRI(null)], { atletismo: "treinado" }), "atletismo"), "treinado");

  // As duas juntas na mesma perícia: o treino da Magistral basta para a Primacial.
  t(r("Magistral e Primacial na mesma perícia dão Mestre"),
    faixa(ficha(sistema, [MAG("atletismo"), PRI("atletismo")]), "atletismo"), "mestre");
  t(r("a ordem das entradas não muda o resultado"),
    faixa(ficha(sistema, [PRI("atletismo"), MAG("atletismo")]), "atletismo"), "mestre");
  t(r("Magistral numa perícia e Primacial noutra não se ajudam"),
    faixa(ficha(sistema, [MAG("atletismo"), PRI("acrobacia")]), "acrobacia"), null);

  // p.365: duas cópias do mesmo acessório são UMA fonte. Vale a primeira equipada.
  const duas = ficha(sistema, [MAG("atletismo"), MAG("acrobacia")]);
  t(r("duas Magistrais valem uma só, a primeira"), [faixa(duas, "atletismo"), faixa(duas, "acrobacia")], ["treinado", null]);
  const guardadaPrimeiro = ficha(sistema, [MAG("atletismo", { equipado: false }), MAG("acrobacia")]);
  t(r("a cópia guardada não cobre a equipada"), [faixa(guardadaPrimeiro, "atletismo"), faixa(guardadaPrimeiro, "acrobacia")], [null, "treinado"]);
  t(r("as duas cópias seguem no inventário"), deriveAfty(duas).equip.entradas.length, 2);

  // O Primacial não é servido por uma Magistral que a p.365 deixou de fora.
  const foraDaFonte = ficha(sistema, [MAG("atletismo"), MAG("acrobacia"), PRI("acrobacia")]);
  t(r("Primacial não usa a Magistral repetida como treino"), faixa(foraDaFonte, "acrobacia"), null);

  // Persistência: a escolha viaja no JSON da ficha.
  const volta = JSON.parse(JSON.stringify(ficha(sistema, [MAG("atletismo")])));
  t(r("a escolha sobrevive ao ida e volta em JSON"), faixa(volta, "atletismo"), "treinado");
  t(r("e ao preenchimento de campos novos"), volta.equipamentos.itens[0].escolhaPericia, "atletismo");
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
