import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const F = await import(R + "ficha/ficha-votos.js");
const { validaVoto } = await import(R + "ficha/ficha-votos-regras.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const pedido = (d, s, ctx) => ({ opId: `cx3-voto-${++seq}`, derived: d, sessao: s, ctx, registraAcao: true });
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
  c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.talentos = ["tal_voto_malevolente"];
  const d = deriveAfty(c), s = S.iniciaCombate(S.sessaoEmBranco(d), d), ctx = { bt: d.maestria, aptidoes: [] };
  const voto = F.novoVotoTipado({ tipo: "emergencial", permanencia: "temporario", nome: "Emergência de Teste", duracao: { ate: "cena" },
    beneficio: { texto: "Benefício", peso: "medio", envolve: ["pe"], efeitos: [] }, maleficio: { texto: "Malefício", peso: "medio", envolve: ["pe"], efeitos: [] } });
  const votos = { mecanicos: [voto], contratuais: [] };
  t(`${sistema} talento acessível e sem excesso`, [d.talentos.inacessiveis, d.habilidades.excedeu], [[], false]);
  t(`${sistema} sem talento exige o peso adicional`, validaVoto(voto, ctx).ok, false);
  t(`${sistema} contexto explícito de talentos dispensa apenas o adicional`, validaVoto(voto, { ...ctx, talentos: ["tal_voto_malevolente"] }).ok, true);
  const p = pedido(d, s, ctx), r = F.realizaVoto(votos, voto.id, p);
  if (!r.aplicado) throw new Error(`${sistema}: ${r.erro}`);
  t(`${sistema} realiza usando a lista da ficha`, [r.aplicado, r.voto.estado, r.acao], [true, "vigente", "reacao"]);
  t(`${sistema} a reação continua sendo gasta`, r.sessao.especializacaoSessao.reacoesGastas, 1);
  t(`${sistema} não cria custo adicional`, r.sessao.peAtual, s.peAtual);
  t(`${sistema} preserva histórico e idempotência`, [r.voto.historico.at(-1).opId, F.realizaVoto(r.votos, voto.id, p).repetida], [p.opId, true]);
  const lida = mesclaFichaAfty({ ...c, votos: JSON.parse(JSON.stringify(r.votos)) });
  t(`${sistema} Voto e histórico viajam na ficha`, [lida.votos.mecanicos[0].estado, lida.votos.mecanicos[0].historico.at(-1).opId], ["vigente", p.opId]);
  const sem = deriveAfty({ ...c, talentos: [] });
  const fingida = F.realizaVoto(votos, voto.id, pedido(sem, s, { ...ctx, talentos: ["tal_voto_malevolente"] }));
  t(`${sistema} declaração não supera ausência real do talento`, [fingida.aplicado, fingida.votos === votos, fingida.codigo], [false, true, "emergencial-um-peso-acima"]);
  const baixo = deriveAfty({ ...c, core: { ...c.core, nd: 10 }, especializacoes: [{ id: "combatente", nivel: 10 }] });
  t(`${sistema} talento sem requisito não vale`, F.realizaVoto(votos, voto.id, pedido(baixo, s, ctx)).aplicado, false);
  const lotado = F.realizaVoto(votos, voto.id, pedido(d, s, { ...ctx, vigentes: d.maestria }));
  t(`${sistema} preserva limite de Votos`, [lotado.aplicado, lotado.codigo], [false, "limite-bt"]);
  const semReacao = { ...s, especializacaoSessao: { ...s.especializacaoSessao, reacoesGastas: 1 } };
  t(`${sistema} não realiza sem reação`, F.realizaVoto(votos, voto.id, pedido(d, semReacao, ctx)).aplicado, false);
  for (const [nome, alteracao, codigo] of [
    ["peso extremo temporário", { beneficio: { ...voto.beneficio, peso: "extremo" } }, "temporario-extremo-beneficio"],
    ["escopo proibido", { beneficio: { ...voto.beneficio, envolve: ["defesa"] } }, "escopo-beneficio"],
    ["Aptidão não possuída", { aptidoes: ["dominio_simples"] }, "aptidao-nao-possuida"],
  ]) {
    const vv = { ...voto, ...alteracao }, recusada = F.realizaVoto({ mecanicos: [vv], contratuais: [] }, vv.id, pedido(d, s, ctx));
    t(`${sistema} ${nome} continua recusado`, [recusada.aplicado, recusada.recusas?.some((e) => e.codigo === codigo)], [false, true]);
  }
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
