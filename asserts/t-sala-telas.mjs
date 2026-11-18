/* AS TELAS DA SALA (`src/nuvem/sala-telas.js` e `sala-frases.js`, Encontro Unificado, etapa 7c, 2026-11-18): a lógica pura.

   O que as telas mostram e mandam sem rede nenhuma:
     1. a faixa da luta do jogador: só a ordem que a RLS deixou ler, sem número de iniciativa inventado, a vez de uma
        criatura Oculta vira "não é a sua vez";
     2. colegas e criaturas pelo nível de visão: Barra de Vida só com a faixa, Só Nome sem barra, Oculta nem aparece;
     3. o Registro: a linha completa e a pública da mesma ação aparecem uma vez, a escondida só para quem a lê, e a
        frase não deixa escapar o número da Vida de quem está só em Barra;
     4. os pedidos: o que a conta pediu e o que ela recebe para aceitar;
     5. os sinais do jogador para o Mestre (iniciativa e Encerrar Meu Turno): agem uma vez, na vez certa, na rodada certa,
        e o que já foi tratado não volta (nem num aparelho que releu a Sala desde o começo);
     6. a rolagem de fórmula do Mestre e a rolagem da Ficha na forma que o banco aceita;
     7. o texto de tela dos arquivos novos: sem ponto e vírgula e sem travessão. */
import { readFileSync, readdirSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const N =new URL("../src/nuvem/", import.meta.url).href;
const T = await import(N + "sala-telas.js");
const F = await import(N + "sala-frases.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else bad.push(`FALHOU ${nome}\n   real:     ${a}\n   esperado: ${b}`);
};

const EU = "conta-lia";
const RUI = "conta-rui";
const resumo = (combatente, extra = {}) => ({
  id: `r_${combatente}`, combatente, tipo: "criatura", dono: null, visao: "oculta", nome: combatente, lado: "inimigo",
  posicao: null, na_vez: false, publico: {}, ...extra,
});
const retratoBase = () => ({
  salaId: "s1",
  eu: { conta: EU, papel: "jogador", nome: "Lia" },
  sala: { id: "s1", codigo: "K7QX2M", dono: "conta-mestre" },
  membros: {
    "conta-mestre": { conta: "conta-mestre", papel: "mestre", nome: "Gabi" },
    [EU]: { conta: EU, papel: "jogador", nome: "Lia" },
    [RUI]: { conta: RUI, papel: "jogador", nome: "Rui" },
  },
  estado: { status: "ativo", rodada: 3 },
  online: ["conta-mestre", EU],
  resumos: {
    pj_lia: resumo("pj_lia", { tipo: "personagem", dono: EU, visao: null, nome: "Lia Tsukino", lado: "jogador", posicao: 1, na_vez: true,
      publico: { pv: 40, pvMax: 60, pe: 8, peMax: 10, condicoes: ["Sangrando"], efeitos: [] } }),
    gob1: resumo("gob1", { visao: "barra", nome: "Goblin 1", posicao: 2, publico: { faixa: "ate_a_metade" } }),
    pj_rui: resumo("pj_rui", { tipo: "personagem", dono: RUI, visao: null, nome: "Rui", lado: "jogador", posicao: 3,
      publico: { pv: 20, pvMax: 20, pe: 4, peMax: 4 } }),
    gob2: resumo("gob2", { visao: "nome", nome: "Goblin 2", posicao: 4 }),
    sombra: resumo("sombra", { visao: "oculta", nome: "Sombra Oculta", posicao: null }),
    boss: resumo("boss", { visao: "aberta", nome: "Ogro", posicao: 5, publico: { pv: 90, pvMax: 120, pe: 0, peMax: 0, condicoes: ["Lento"], efeitos: [] } }),
  },
  compartilhamentos: [{ id: "c1", combatente: "pj_rui", para: EU }],
  operacoes: {},
  publicas: {},
});

/* ---------- 1. a faixa ---------- */
{
  const f = T.faixaDoJogador(retratoBase());
  t("faixa: rodada e luta ativa", [f.rodada, f.ativa], [3, true]);
  t("faixa: a vez é a minha", [f.vezId, f.minhas], ["pj_lia", ["pj_lia"]]);
  t("faixa: ordem só dos visíveis, por posição (a Oculta não entra)", f.ordem.map((c) => c.id), ["pj_lia", "gob1", "pj_rui", "gob2", "boss"]);
  t("faixa: o tipo de cada um", f.ordem.map((c) => c.tipo), ["minha", "criatura", "colega", "criatura", "criatura"]);
  t("faixa: sem número de iniciativa", f.ordem.some((c) => "iniciativa" in c), false);
  t("faixa: barra de números no personagem", f.ordem[0].barra, { atual: 40, max: 60, temp: 0 });
  t("faixa: Barra de Vida é só a faixa", f.ordem[1].barra, { faixa: "ate_a_metade", rotulo: "Até a Metade", fracao: 0.5 });
  t("faixa: Só Nome não tem barra", f.ordem[3].barra, null);

  // Na vez de uma criatura Oculta nenhum resumo visível está na vez.
  const r = retratoBase();
  r.resumos.pj_lia.na_vez = false;
  r.resumos.sombra.na_vez = true;
  const f2 = T.faixaDoJogador(r);
  t("faixa: na vez da Oculta ninguém visível está na vez", f2.vezId, null);
  t("faixa: planejando não está ativa", T.faixaDoJogador({ ...r, estado: { status: "planejando", rodada: 1 } }).ativa, false);
}

/* ---------- 2. colegas e criaturas ---------- */
{
  const r = retratoBase();
  const colegas = T.colegasDaSala(r);
  t("colegas: só os outros personagens", colegas.map((c) => c.id), ["pj_rui"]);
  t("colegas: dono, online e compartilhada", [colegas[0].donoNome, colegas[0].online, colegas[0].compartilhada], ["Rui", false, true]);
  t("colegas: resumo com Vida e PE", [colegas[0].resumo.pv, colegas[0].resumo.pvMax, colegas[0].resumo.peMax], [20, 20, 4]);
  const cr = T.criaturasDaSala(r);
  t("criaturas: a Oculta nem aparece", cr.map((c) => c.id), ["gob1", "gob2", "boss"]);
  t("criaturas: Barra só com a faixa e sem resumo", [cr[0].barra.faixa, cr[0].resumo], ["ate_a_metade", null]);
  t("criaturas: Só Nome sem barra", cr[1].barra, null);
  t("criaturas: Aberta com os números", [cr[2].resumo.pv, cr[2].resumo.pvMax, cr[2].resumo.condicoes], [90, 120, ["Lento"]]);
  t("alvos de pedido: colegas e criaturas visíveis", T.alvosDePedido(r).map((a) => `${a.tipo}:${a.id}`), ["colega:pj_rui", "criatura:gob1", "criatura:gob2", "criatura:boss"]);
  const semFicha = retratoBase();
  semFicha.eu = { conta: "conta-espectador", papel: "espectador" };
  t("espectador: nenhum personagem é dele", T.colegasDaSala(semFicha).map((c) => c.id), ["pj_lia", "pj_rui"]);
}

/* ---------- 3. o Registro ---------- */
{
  const r = retratoBase();
  r.operacoes = {
    10: { seq: 10, id: "o10", especie: "operacao", operacao_id: "op1", autor: "conta-mestre", papel: "mestre", publica_id: "p1", criado_em: "2026-11-18T10:00:02Z",
      dados: { id: "op1", tipo: "dano", alvo: "pj_lia", entrada: { valor: 12 }, delta: [{ caminho: ["hpAtual"], antes: 52, depois: 40 }] } },
    11: { seq: 11, id: "o11", especie: "rolagem", operacao_id: "rol1", autor: "conta-mestre", papel: "mestre", escondida: true, publica_id: null, criado_em: "2026-11-18T10:00:03Z",
      dados: { id: "rol1", rolagem: { tipo: "dano", rotulo: "Emboscada", total: 17 } } },
    12: { seq: 12, id: "o12", especie: "chat", operacao_id: "ch1", autor: EU, papel: "jogador", publica_id: "p3", criado_em: "2026-11-18T10:00:04Z", dados: { id: "ch1", texto: "Vou curar o Rui" } },
  };
  r.publicas = {
    1: { id: "p1", seq: 1, especie: "operacao", criado_em: "2026-11-18T10:00:02Z", publica: { autor: { conta: "conta-mestre", papel: "mestre" }, tipo: "dano", alvo: { id: "pj_lia", nome: "Lia Tsukino" }, valor: 12 } },
    2: { id: "p2", seq: 2, especie: "operacao", criado_em: "2026-11-18T10:00:01Z", publica: { autor: { conta: "conta-mestre", papel: "mestre" }, tipo: "dano", alvo: { id: "gob1", nome: "Goblin 1" }, valor: 7, vida: { antes: "inteira", depois: "ate_a_metade" } } },
    3: { id: "p3", seq: 3, especie: "chat", criado_em: "2026-11-18T10:00:04Z", publica: { autor: { conta: EU, papel: "jogador" }, texto: "Vou curar o Rui" } },
  };
  const l = T.linhasDoRegistro(r);
  t("registro: a mesma ação não aparece duas vezes", l.length, 4);
  t("registro: em ordem de hora", l.map((x) => x.chave), ["p2", "c10", "c11", "c12"]);
  t("registro: a rolagem escondida vem marcada", l.find((x) => x.chave === "c11").escondida, true);
  t("registro: frase da pública de uma criatura em Barra não tem número de Vida", l[0].texto, "Dano: 7 em Goblin 1.");
  t("registro: frase da completa", l[1].texto, "Dano: 12 em Lia Tsukino.");
  t("registro: o autor do Mestre diz Mestre", l[1].autor, "Gabi (Mestre)");
  t("registro: o chat leva o nome de quem escreveu", l[3].texto, "Lia: Vou curar o Rui");
  t("registro: nada da Vida vaza no texto", l.some((x) => /52|\bantes\b|depois/.test(x.texto)), false);
  t("frase: rolagem de info não tem total", F.fraseDaPublica({ especie: "rolagem", publica: { combatente: { nome: "Lia" }, tipo: "info", rotulo: "Encerrar Meu Turno", total: 0 } }), "Lia: Encerrar Meu Turno.");
  t("frase: iniciativa tem total", F.fraseDaPublica({ especie: "rolagem", publica: { combatente: { nome: "Lia" }, tipo: "teste", rotulo: "Iniciativa", total: 19 } }), "Lia: Iniciativa 19.");
  t("frase: pedido aceito", F.fraseDaPublica({ especie: "pedido", estado_pedido: "aceito", publica: { tipo: "cura", alvo: { nome: "Rui" }, valor: 5 } }), "Pedido Aceito: Cura 5 em Rui.");
}

/* ---------- 4. os pedidos ---------- */
{
  const r = retratoBase();
  r.operacoes = {
    1: { seq: 1, especie: "pedido", operacao_id: "pd1", autor: EU, estado_pedido: "pendente", criado_em: "t", dados: { tipo: "dano", alvo: "gob1", entrada: { valor: 9 }, autor: { combatente: "pj_lia" } } },
    2: { seq: 2, especie: "pedido", operacao_id: "pd2", autor: RUI, estado_pedido: "pendente", criado_em: "t", dados: { tipo: "cura", alvo: "pj_lia", entrada: { valor: 4 }, autor: { combatente: "pj_rui" } } },
    3: { seq: 3, especie: "pedido", operacao_id: "pd3", autor: RUI, estado_pedido: "aceito", criado_em: "t", dados: { tipo: "cura", alvo: "pj_lia", entrada: { valor: 4 }, autor: { combatente: "pj_rui" } } },
    4: { seq: 4, especie: "pedido", operacao_id: "pd4", autor: RUI, estado_pedido: "pendente", criado_em: "t", dados: { tipo: "dano", alvo: "pj_rui", entrada: { valor: 4 }, autor: { combatente: "pj_rui" } } },
  };
  const p = T.pedidosDoJogador(r);
  t("pedidos: os que a conta fez", p.feitos.map((x) => x.id), ["pd1"]);
  t("pedidos: os recebidos são os pendentes em personagem dela, de outra pessoa", p.recebidos.map((x) => x.id), ["pd2"]);
  t("pedidos: nome do alvo e do autor", [p.recebidos[0].alvoNome, p.recebidos[0].autorNome], ["Lia Tsukino", "Rui"]);
  const novo = T.pedidoDoJogador({ id: "op_x", autor: { conta: EU, combatente: "pj_lia" }, alvo: "gob1", tipo: "dano", valor: -3.7, quando: 5 });
  t("pedido do jogador: forma do banco (intenção sem delta)", novo, {
    id: "op_x", versao: 1, tipo: "dano", autor: { conta: EU, papel: "jogador", combatente: "pj_lia" }, alvo: "gob1", entrada: { valor: 0 }, delta: [], quando: 5,
  });
}

/* ---------- 5. os sinais ---------- */
{
  const enc = (extra = {}) => ({
    status: "ativo", rodada: 3, ativoId: "pj_lia", sala: { sinais: [] },
    combatentes: [{ id: "pj_lia", iniciativa: { rolagem: 15, mod: 2, total: 17, manual: false } }, { id: "pj_rui", iniciativa: { rolagem: 0, mod: 1, total: 1, manual: false } }],
    ...extra,
  });
  const linha = (seq, autor, dados) => ({ seq, especie: "rolagem", autor, dados, criado_em: "t" });
  const resumos = { pj_lia: { dono: EU }, pj_rui: { dono: RUI } };
  const fim = T.sinalDeFimDeTurno({ combatente: "pj_lia", rodada: 3, quando: 1000 });
  const ops = { 1: linha(1, EU, fim) };
  let r = T.sinaisDoJogador({ operacoes: ops, resumos, encontro: enc() });
  t("sinal: Encerrar Meu Turno de quem está na vez age", r.agir.map((x) => `${x.tipo}:${x.combatente}`), ["fimDeTurno:pj_lia"]);
  t("sinal: o id sai da linha", r.tratados, [fim.id]);
  t("sinal: o que já foi tratado não volta", T.sinaisDoJogador({ operacoes: ops, resumos, encontro: enc({ sala: { sinais: [fim.id] } }) }), { agir: [], tratados: [] });
  r = T.sinaisDoJogador({ operacoes: ops, resumos, encontro: enc({ ativoId: "gob1" }) });
  t("sinal: fora da vez não age, mas fica tratado (não volta no próximo turno dele)", [r.agir.length, r.tratados.length], [0, 1]);
  r = T.sinaisDoJogador({ operacoes: ops, resumos, encontro: enc({ rodada: 4 }) });
  t("sinal: de outra rodada não age", r.agir.length, 0);
  r = T.sinaisDoJogador({ operacoes: { 1: linha(1, RUI, fim) }, resumos, encontro: enc() });
  t("sinal: de quem não é o dono do combatente não age", r.agir.length, 0);
  r = T.sinaisDoJogador({ operacoes: ops, resumos, encontro: enc({ status: "finalizado" }) });
  t("sinal: com a luta encerrada não age", r.agir.length, 0);

  const ini = T.sinalDeIniciativa({ combatente: "pj_rui", total: 14, mod: 1, natural: 13, quando: 2000 });
  r = T.sinaisDoJogador({ operacoes: { 1: linha(1, RUI, ini) }, resumos, encontro: enc({ status: "planejando", ativoId: null }) });
  t("sinal: iniciativa enquanto planeja age", r.agir, [{ id: ini.id, tipo: "iniciativa", combatente: "pj_rui", total: 14 }]);
  r = T.sinaisDoJogador({ operacoes: { 1: linha(1, RUI, ini) }, resumos, encontro: enc() });
  t("sinal: iniciativa com a luta andando age só em quem ainda não tem", r.agir.length, 1);
  const ini2 = T.sinalDeIniciativa({ combatente: "pj_lia", total: 3, quando: 3000 });
  r = T.sinaisDoJogador({ operacoes: { 1: linha(1, EU, ini2) }, resumos, encontro: enc() });
  t("sinal: iniciativa com a luta andando não troca a de quem já tem", r.agir.length, 0);
  r = T.sinaisDoJogador({ operacoes: { 1: linha(1, RUI, ini) }, resumos, encontro: enc({ status: "planejando", ativoId: null, combatentes: [] }) });
  t("sinal: de personagem que ainda não está no Encontro espera, e não é dado como tratado", [r.agir.length, r.tratados.length], [0, 0]);
  t("sinal: escondida nunca é sinal", T.sinaisDoJogador({ operacoes: { 1: { ...linha(1, EU, fim), escondida: true } }, resumos, encontro: enc() }).agir.length, 0);
  t("sinal: rolagem comum não é sinal", T.sinaisDoJogador({ operacoes: { 1: linha(1, EU, { id: "rol_1", combatente: "pj_lia", rolagem: { tipo: "teste", total: 9 } }) }, resumos, encontro: enc() }), { agir: [], tratados: [] });
  t("sinal: o id é aceito pelo banco", /^[A-Za-z0-9_:.-]{1,120}$/.test(fim.id) && /^[A-Za-z0-9_:.-]{1,120}$/.test(ini.id), true);
  t("sinal: guardar mantém os mais recentes", T.guardarSinais(Array.from({ length: 200 }, (_, i) => `a${i}`), ["b"]).slice(-2), ["a199", "b"]);
  t("sinal: guardar corta em 200", T.guardarSinais(Array.from({ length: 200 }, (_, i) => `a${i}`), ["b"]).length, 200);
}

/* ---------- 6. as rolagens ---------- */
{
  const seq = [0.0, 0.95, 0.5];
  let i = 0;
  const rng = () => seq[i++ % seq.length];
  const r = T.rolarFormula("d20+5", { rotulo: "Emboscada", rng });
  t("fórmula: d20 é teste com natural", [r.ok, r.rolagem.tipo, r.rolagem.natural, r.rolagem.total, r.rolagem.formula], [true, "teste", 1, 6, "d20+5"]);
  i = 0;
  const d = T.rolarFormula("3d6 - 2", { rng });
  t("fórmula: 3d6-2 é dano com os dados", [d.rolagem.tipo, d.rolagem.dados, d.rolagem.total, d.rolagem.formula], ["dano", [1, 6, 4], 9, "3d6-2"]);
  t("fórmula: texto solto é inválido", T.rolarFormula("oito").ok, false);
  t("fórmula: dado demais é inválido", T.rolarFormula("500d6").ok, false);
  const j = T.rolagemParaASala({ tipo: "teste", rotulo: "Acerto", formula: "d20+7", total: 21, natural: 14, d20: [14], critico: false, detalhe: "não vai", fontes: [1] });
  t("rolagem da Ficha: só os campos que o banco lê", j, { tipo: "teste", rotulo: "Acerto", formula: "d20+7", total: 21, natural: 14, d20: [14], critico: false });
  t("rolagem da Ficha: tipo desconhecido vira info", T.rolagemParaASala({ tipo: "cura", total: 3 }).tipo, "info");
  const antes = { log: [{ id: "a" }, { id: "b" }] };
  const depois = { log: [{ id: "d" }, { id: "c" }, { id: "a" }, { id: "b" }] };
  t("rolagens novas: da mais antiga para a mais nova", T.rolagensNovas(antes, depois).map((x) => x.id), ["c", "d"]);
  t("rolagens novas: sem diferença não há nenhuma", T.rolagensNovas(depois, depois), []);
}

/* ---------- 7. texto de tela ---------- */
{
  const pasta = new URL("../src/nuvem/", import.meta.url);
  const arquivos = readdirSync(pasta).filter((f) => /^sala-(telas|frases)\.js$/.test(f));
  t("os dois arquivos existem", arquivos.length, 2);
  t("nenhum U+2014 neles", arquivos.filter((f) => readFileSync(new URL(f, pasta), "utf8").includes(String.fromCharCode(0x2014))), []);
  // Os dois são FOLHA: só importam folhas.
  const imports = arquivos.flatMap((f) => [...readFileSync(new URL(f, pasta), "utf8").matchAll(/^import .* from "(.*)";$/gm)].map((m) => m[1]));
  t("só importam folhas da Sala", [...new Set(imports)].sort(), ["./sala-frases", "./sala-projecao"]);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
