/* O QUE O JOGADOR FAZ NA SALA (`src/nuvem/sala-jogador.js`, Encontro Unificado, etapa 7c, 2026-11-18), com um cliente falso.

   O banco de verdade fica na prova de ponta a ponta com as duas contas. Aqui, o que decide sem rede:
     1. pedir Dano ou Cura num alvo vira uma linha de pedido com a intenção e SEM delta (quem mede é o dono do alvo);
     2. aceitar um pedido recebido: o banco responde primeiro, e só com o aceite a Vida do personagem muda (na loja do aparelho);
     3. o banco recusando (o Mestre aceitou na mesma hora) deixa a Vida como estava;
     4. o Desfazer de uma mudança que outra pessoa fez no personagem: a Vida volta e a operação vai para o Registro;
     5. a iniciativa e o Encerrar Meu Turno saem como linha de rolagem do combatente certo, e o chat sai cortado;
     6. a rolagem escondida do Mestre só vai marcada como escondida. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
const A = new URL("../src/systems/afty/", import.meta.url).href;
const N = new URL("../src/nuvem/", import.meta.url).href;
const { deriveAfty } = await import(A + "afty-derive.js");
const { createBlankAfty } = await import(A + "afty-schema.js");
const S = await import(A + "ficha/ficha-sessao.js");
const Loja = await import(A + "ficha/sessao-loja.js");
const J = await import(N + "sala-jogador.js");
const T = await import(N + "sala-telas.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const comCore = (core, extra) => {
  const f = createBlankAfty();
  return { ...f, ...extra, core: { ...f.core, ...core } };
};
const liaF = comCore({ nd: 5 }, { id: "lia-1", name: "Lia", rulesVersion: "player", system: "player", especializacoes: [{ id: "combatente", nivel: 5 }] });
const dLia = deriveAfty(liaF);
const COMB = "pj:lia-1";
const resumo = { combatente: COMB, tipo: "personagem", nome: "Lia", lado: "jogador", dono: "conta-lia" };

function clienteFalso({ recusa = false } = {}) {
  const chamadas = { registrar: [], responder: [] };
  return {
    chamadas,
    ler: () => ({ eu: { conta: "conta-lia", papel: "jogador" }, estado: { rodada: 2, status: "ativo" } }),
    registrar: async (especie, dados, opcoes = {}) => { chamadas.registrar.push({ especie, dados, opcoes }); return { id: "x" }; },
    responderPedido: async (id, aceitar, op) => {
      if (recusa) { const e = new Error("Pedido Ausente"); e.codigo = "Pedido Ausente"; throw e; }
      chamadas.responder.push({ id, aceitar, op });
      return { id };
    },
  };
}
const semear = () => {
  mem.clear();
  Loja.gravar("lia-1", S.sessaoEmBranco(dLia));
  return Loja.ler("lia-1", () => dLia);
};
const vidaDe = () => Loja.ler("lia-1", () => dLia).hpAtual;
const pedidoDoRui = (tipo, valor) => {
  const dados = T.pedidoDoJogador({ id: `pd_${tipo}_${valor}`, autor: { conta: "conta-rui", combatente: "pj:rui" }, alvo: COMB, tipo, valor, quando: 100 });
  return { id: dados.id, estado: "pendente", dados, criadoEm: "2026-11-18T10:00:00Z" };
};

/* ---------- 1. pedir ---------- */
{
  const c = clienteFalso();
  const p = await J.pedirNoAlvo(c, { meuCombatente: COMB, alvo: "gob1", tipo: "dano", valor: 9 });
  t("pedir registra um pedido", c.chamadas.registrar.map((x) => x.especie), ["pedido"]);
  t("o pedido leva a intenção e nenhum delta", [p.tipo, p.alvo, p.entrada, p.delta], ["dano", "gob1", { valor: 9 }, []]);
  t("o autor é o personagem dele", [p.autor.conta, p.autor.papel, p.autor.combatente], ["conta-lia", "jogador", COMB]);
  t("o id passa na regra do banco", /^[A-Za-z0-9_:.-]{1,120}$/.test(p.id), true);
}

/* ---------- 2 e 3. aceitar ---------- */
{
  const sessao = semear();
  const vida0 = vidaDe();
  t("a Vida começa cheia", vida0 > 0, true);
  const c = clienteFalso();
  const pedido = pedidoDoRui("dano", 10);
  const r = await J.aceitarPedidoRecebido(c, { pedido, meu: { resumo, ficha: liaF, sessao } });
  t("aceitar deu certo", r.ok, true);
  t("o banco foi perguntado com a operação medida", [c.chamadas.responder[0].id, c.chamadas.responder[0].aceitar, c.chamadas.responder[0].op.tipo], [pedido.id, true, "dano"]);
  t("a operação tem o delta da Vida", c.chamadas.responder[0].op.delta.some((d) => d.caminho.join(".") === "hpAtual"), true);
  t("a Vida do personagem caiu", vidaDe() < vida0, true);
  const hist = Loja.ler("lia-1", () => dLia).historico ?? [];
  t("o histórico da Ficha guarda quem pediu", hist[0]?.autor?.combatente, "pj:rui");

  // Desfazer.
  const c2 = clienteFalso();
  const d = await J.desfazerNoMeuPersonagem(c2, { meu: { resumo, ficha: liaF, sessao: Loja.ler("lia-1", () => dLia) }, operacaoId: hist[0].id });
  t("desfazer deu certo", d.ok, true);
  t("a Vida voltou", vidaDe(), vida0);
  t("o Desfazer vai para o Registro como operação", c2.chamadas.registrar.map((x) => [x.especie, x.dados.tipo, x.dados.desfaz]), [["operacao", "desfazer", hist[0].id]]);
  const de2 = await J.desfazerNoMeuPersonagem(c2, { meu: { resumo, ficha: liaF, sessao: Loja.ler("lia-1", () => dLia) }, operacaoId: hist[0].id });
  t("desfazer de novo é recusado", [de2.ok, de2.erro], [false, "Já Desfeita"]);
}
{
  const sessao = semear();
  const vida0 = vidaDe();
  const c = clienteFalso({ recusa: true });
  const r = await J.aceitarPedidoRecebido(c, { pedido: pedidoDoRui("dano", 10), meu: { resumo, ficha: liaF, sessao } });
  t("o banco recusando (o Mestre aceitou antes) não muda a Vida", [r.ok, r.erro, vidaDe()], [false, "Pedido Ausente", vida0]);
  const rec = await J.recusarPedidoRecebido(clienteFalso(), { pedido: pedidoDoRui("dano", 10) });
  t("recusar chama o banco", rec.ok, true);
}
{
  const sessao = semear();
  const vida0 = vidaDe();
  const c = clienteFalso();
  const r = await J.aceitarPedidoRecebido(c, { pedido: pedidoDoRui("cura", 5), meu: { resumo, ficha: liaF, sessao } });
  t("Cura com a Vida cheia não inventa nada", [r.ok === false ? "sem efeito" : "mudou", vidaDe()], [r.ok === false ? "sem efeito" : "mudou", vida0]);
}

/* ---------- 5 e 6. os avisos e o chat ---------- */
{
  const c = clienteFalso();
  const ini = await J.enviarIniciativa(c, { combatente: COMB, ficha: liaF });
  t("a iniciativa sai como rolagem do combatente", [c.chamadas.registrar[0].especie, c.chamadas.registrar[0].dados.combatente], ["rolagem", COMB]);
  t("com o total entre 1 e 20 mais o modificador", ini.iniciativa.total >= 1 + Math.trunc(Number(dLia.iniciativa) || 0) && ini.iniciativa.total <= 20 + Math.trunc(Number(dLia.iniciativa) || 0), true);
  const escrita = await J.enviarIniciativa(c, { combatente: COMB, ficha: liaF, total: 18 });
  t("a iniciativa escrita vai como está", [escrita.iniciativa.total, escrita.rolagem.d20], [18, undefined]);
  const fim = await J.enviarFimDeTurno(c, { combatente: COMB, rodada: 2 });
  t("Encerrar Meu Turno leva a rodada", [fim.fimDeTurno.rodada, fim.rolagem.tipo], [2, "info"]);
  const chat = await J.enviarChat(c, `  ${"a".repeat(1100)}  `);
  t("o chat é cortado em mil caracteres", chat.texto.length, 1000);
  t("chat vazio não sai", await J.enviarChat(c, "   "), null);
  const esc = await J.rolarEscondido(c, "2d6+1");
  const ultima = c.chamadas.registrar.at(-1);
  t("a rolagem escondida vai marcada e sem combatente", [ultima.especie, ultima.opcoes.escondida, ultima.dados.combatente, esc.ok], ["rolagem", true, undefined, true]);
  const ruim = await J.rolarEscondido(c, "dois");
  t("fórmula ruim não grava nada", [ruim.ok, c.chamadas.registrar.length], [false, 5]);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
