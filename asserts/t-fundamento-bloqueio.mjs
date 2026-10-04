/* Fundamento bloqueia toda a Técnica Inata na mesa (autor, 2026-10-03).
   O criador não tem o estado de campo. Buffs e catálogos continuam no Motor. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const I = await import(R + "afty-invocacoes.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
aplicarAddons([]);
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const inv = (d) => d.invocacoes.lista.find((i) => i.id === "S");
const fonte = (partes, nome) => partes.some((p) => p.label === nome);
for (const sistema of ["afty", "player"]) {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 10;
  c.core.nivel = 10;
  c.especializacoes = [{ id: "controlador", nivel: 10 }];
  c.core.tecnicaEfeitos = [
    { canal: "defesa", expr: "2" },
    { canal: "pv", expr: "12", escopo: "invocacao", invocacaoAlvo: "S" },
  ];
  c.core.funcionamentosAdicionais = [{
    id: "adicional", nome: "Olhar Adicional", efeitos: [{ canal: "iniciativa", expr: "3" }],
  }];
  c.feiticos = [
    { id: "passiva", tipo: "passivo", nivel: 1, nome: "Corpo Rígido", efeitosPassivo: [
      { canal: "rdGeral", expr: "3" },
      { canal: "defesa", expr: "4", escopo: "invocacao", invocacaoAlvo: "S" },
      { canal: "resistenciaDano", alvo: "fogo", expr: "1" },
    ] },
    { id: "raio", tipo: "dano", nivel: 1, nome: "Raio", alvo: "unico", acao: "comum" },
  ];
  c.invocacoes = [
    { ...I.createBlankInvocacao("quarto", "tecnica"), id: "F", nome: "Divino", fundamento: true },
    { ...I.createBlankInvocacao("quarto", "shikigami"), id: "S", nome: "Sapo" },
  ];
  c.buffsSessao = [
    { nome: "Bênção da Mesa", canal: "iniciativa", expr: "5" },
    { nome: "Elo da Mesa", canal: "acerto", expr: "1", escopo: "invocacao" },
  ];
  const salvo = JSON.stringify(c);
  const criar = deriveAfty(c);
  const emCampo = deriveAfty(c, { invocacoes: { F: { estado: "ativa" } } });
  const fora = deriveAfty(c, { invocacoes: {} });
  const numeros = (d) => [d.defesa, d.rdGeral, d.iniciativa, inv(d).pv, inv(d).defesa];
  const semEfeitos = structuredClone(c);
  semEfeitos.core.tecnicaEfeitos = [];
  semEfeitos.core.funcionamentosAdicionais = [];
  semEfeitos.feiticos[0].efeitosPassivo = [];
  const base = deriveAfty(semEfeitos, { invocacoes: {} });
  t(`${sistema}: criador mantém todos os efeitos`, numeros(criar), numeros(emCampo));
  t(`${sistema}: fora de campo remove os efeitos do dono e da outra invocação`, numeros(fora), numeros(base));
  t(`${sistema}: Funcionamento principal, adicional e Passiva alteram os números`,
    numeros(emCampo).map((v, i) => v - numeros(fora)[i]), [2, 3, 3, 12, 4]);
  t(`${sistema}: os Feitiços ficam marcados, sem apagar a lista`,
    fora.feiticos.lista.map((f) => [f.id, f.bloqueado]),
    [["passiva", "Fundamento Fora de Campo"], ["raio", "Fundamento Fora de Campo"]]);
  t(`${sistema}: volta ao campo restaura os efeitos`, numeros(deriveAfty(c, { invocacoes: { F: { estado: "ativa" } } })), numeros(emCampo));
  t(`${sistema}: fora de campo não registra perda`, [fora.tecnicaInata.perdida, fora.tecnicaInata.aRegistrar], [false, null]);
  t(`${sistema}: o buff do dono continua com fonte`, fonte(fora.partes.iniciativa, "Bênção da Mesa"), true);
  t(`${sistema}: o buff da invocação continua com fonte`, fonte(inv(fora).testes.acerto.corpo.partes, "Elo da Mesa"), true);
  t(`${sistema}: fontes do Funcionamento e da Passiva somem`,
    [fonte(fora.partes.defesa, "Técnica"), fonte(inv(fora).fontes.defesa, "Corpo Rígido")], [false, false]);
  for (const estado of ["guardada", "dissipada", "morta"]) {
    const d = deriveAfty(c, { invocacoes: { F: { estado } } });
    t(`${sistema}: ${estado} bloqueia os mesmos números`, numeros(d), numeros(fora));
  }
  const perdida = deriveAfty({ ...c, fundamentosPerdidos: [{ invocacaoId: "F", nome: "Divino" }] });
  t(`${sistema}: perda gravada bloqueia no criador`, numeros(perdida), numeros(fora));
  t(`${sistema}: perda persiste com Fundamento ativo`,
    deriveAfty({ ...c, fundamentosPerdidos: [{ invocacaoId: "F" }] }, { invocacoes: { F: { estado: "ativa" } } }).tecnicaInata.bloqueada, true);
  t(`${sistema}: estado antigo em campo continua válido`, numeros(deriveAfty(c, { invocacoes: { F: { emCampo: true } } })), numeros(emCampo));
  const semPassivas = deriveAfty({ ...c, feiticos: [] }, { invocacoes: {} });
  t(sistema + ": reserva de PE continua fora de campo e com a Técnica perdida",
    [emCampo.pe, perdida.pe], [fora.pe, fora.pe]);
  t(sistema + ": custo da Passiva só no jogador", semPassivas.pe - fora.pe, sistema === "player" ? 2 : 0);
  t(sistema + ": fonte da reserva persiste nos dois bloqueios",
    [fora, perdida].map((d) => d.partes.pe.filter((p) => p.label === "Corpo Rígido (Passiva)").map((p) => p.valor)),
    sistema === "player" ? [[-2], [-2]] : [[], []]);
  t(sistema + ": fontes de PE fecham em todos os estados",
    [criar, emCampo, fora, perdida].map((d) => d.partes.pe.reduce((n, p) => n + (p.valor || 0), 0) === d.pe),
    [true, true, true, true]);
  t(`${sistema}: nenhuma derivação altera a ficha`, JSON.stringify(c), salvo);
}
console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;

