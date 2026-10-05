/* NOVO ESTILO DAS SOMBRAS: as métricas e os efeitos da Expansão (2026-10-04).

   Cada efeito é conferido no número FINAL da ficha (Defesa, TR, Acerto, CD,
   Movimento), com o Domínio no ar e a Técnica selecionada, e não só no resolvido.
   O comportamento de repetição é o do catálogo (decisão do autor: "não assumir
   que repetir sempre dobra"). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EST = await import(R + "afty-estilo-sombras.js");
const CAT = await import(R + "afty-estilo-sombras-catalogo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

let seq = 0;
const compra = (efeitoId, escolha = null) => ({ uid: `u${++seq}`, efeitoId, ...(escolha ? { escolha } : {}) });
const tecnica = (id, efeitos, extra = {}) => ({ ...EST.createBlankTecnicaEstilo(), id, nome: id, efeitos, ...extra });
const ficha = (sistema, { nd = 9, dom = 3, estilos = [], ativa = null, ligado = true } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = nd;
  c.core.origem = { id: "sem_tecnica" };
  c.aptidoes = { dom };
  c.estilosSombra = estilos;
  c.combate = { ativo: true, estilo_ativo: ligado, ...(ativa ? { estilo_tecnica: ativa } : {}) };
  return c;
};
const delta = (sistema, opts, ler) => ler(deriveAfty(ficha(sistema, opts))) - ler(deriveAfty(ficha(sistema, { ...opts, ativa: null })));
const reflexos = (d) => d.testes.resistencias.find((r) => r.value === "reflexos").bonus;
const acertoCorpo = (d) => d.testes.ataques.find((a) => a.id === "corpo").bonus;
const percepcao = (d) => d.testes.pericias.find((p) => p.id === "percepcao").bonus;

/* O catálogo: os 11 efeitos da Expansão, com repetição definida em cada um. */
t("os onze efeitos", CAT.EFEITOS_ESTILO.map((e) => e.id),
  ["defesa", "tr", "acerto", "margem", "pericia", "dano", "alcance", "deslocamento", "gatilho", "cd", "especial"]);
t("a repeticao vem do catalogo", Object.fromEntries(CAT.EFEITOS_ESTILO.map((e) => [e.id, e.repeticao])), {
  defesa: "aliados", tr: "aliados", acerto: "soma", margem: "aliados", pericia: "aliados",
  dano: "soma", alcance: "unica", deslocamento: "aliados", gatilho: "soma", cd: "soma", especial: "unica",
});
t("o Pre-Requisito e proibido so no Ataque com Gatilho",
  CAT.EFEITOS_ESTILO.filter((e) => !e.aceitaBonusPreRequisito).map((e) => e.id), ["gatilho"]);

for (const sistema of ["afty", "player"]) {
  const bt = deriveAfty(ficha(sistema)).maestria;
  const metade = Math.floor(bt / 2);
  t(`${sistema}: o Nivel 9 tem BT 4`, bt, 4);
  t(`${sistema}: o DOM alocado e o da ficha`, deriveAfty(ficha(sistema)).aptidao.efetivo.dom, 3);

  /* Orçamento: DOM + Exaustão, e as compras somadas pelo custo. */
  const tec = tecnica("t1", [compra("defesa"), compra("acerto", { ataque: "corpo" }), compra("acerto", { ataque: "corpo" })], { exaustao: 2 });
  const r = deriveAfty(ficha(sistema, { estilos: [tec] })).estilo.tecnicas[0];
  t(`${sistema}: Efeitos Base 3, Exaustao +2, Limite 5, Usados 3`,
    [r.limite.base, r.limite.exaustao, r.limite.total, r.usados], [3, 2, 5, 3]);
  t(`${sistema}: as parcelas do limite`, r.limite.partes.map((p) => p.label), ["Nível de Aptidão em Domínio", "Exaustão"]);

  /* Defesa: a 2ª compra estende aos aliados e não soma no usuário. */
  const def1 = tecnica("d1", [compra("defesa")]);
  const def2 = tecnica("d2", [compra("defesa"), compra("defesa")]);
  t(`${sistema}: Defesa soma metade do BT`, delta(sistema, { estilos: [def1], ativa: "d1" }, (d) => d.defesa), metade);
  t(`${sistema}: a 2a Defesa nao soma no usuario`, delta(sistema, { estilos: [def2], ativa: "d2" }, (d) => d.defesa), metade);
  t(`${sistema}: a 2a Defesa vai para os aliados`,
    deriveAfty(ficha(sistema, { estilos: [def2] })).estilo.tecnicas[0].aliadosCalculados,
    [{ efeitoId: "defesa", rotulo: "Defesa dos Aliados no Domínio", valor: metade }]);

  /* TR: só no TR escolhido. */
  const tr = tecnica("tr", [compra("tr", { tr: "reflexos" })]);
  t(`${sistema}: TR soma no escolhido`, delta(sistema, { estilos: [tr], ativa: "tr" }, reflexos), metade);
  t(`${sistema}: e nao nos outros`,
    delta(sistema, { estilos: [tr], ativa: "tr" }, (d) => d.testes.resistencias.find((x) => x.value === "vontade").bonus), 0);

  /* Acerto: cada compra soma outra metade do BT. */
  const ac = tecnica("ac", [compra("acerto", { ataque: "corpo" }), compra("acerto", { ataque: "corpo" })]);
  t(`${sistema}: duas compras de Acerto somam duas metades`, delta(sistema, { estilos: [ac], ativa: "ac" }, acertoCorpo), 2 * metade);

  /* Perícia, CD, Deslocamento. */
  const pe = tecnica("pe", [compra("pericia", { pericia: "percepcao" })]);
  t(`${sistema}: Pericia soma na escolhida`, delta(sistema, { estilos: [pe], ativa: "pe" }, percepcao), metade);
  const cd = tecnica("cd", [compra("cd"), compra("cd")]);
  t(`${sistema}: Bonus de CD soma na CD, duas vezes`, delta(sistema, { estilos: [cd], ativa: "cd" }, (d) => d.cd), 2 * metade);
  const mv = tecnica("mv", [compra("deslocamento")]);
  t(`${sistema}: Deslocamento soma 4,5 m`, delta(sistema, { estilos: [mv], ativa: "mv" }, (d) => d.movimento), 4.5);

  /* Os números prontos da Técnica: Dano, Alcance, Margem e o Gatilho. */
  const nums = tecnica("nums", [compra("dano"), compra("dano"), compra("alcance"), compra("margem"), compra("gatilho"), compra("gatilho")]);
  const rn = deriveAfty(ficha(sistema, { estilos: [nums] })).estilo.tecnicas[0];
  t(`${sistema}: Dano +2 por compra, Alcance 3, Margem 1 no Nivel 9`,
    rn.numeros.map((n) => [n.efeitoId, n.valor]), [["dano", 4], ["alcance", 3], ["margem", 1]]);
  t(`${sistema}: dois Ataques com Gatilho`, rn.ataquesComGatilho, 2);
  t(`${sistema}: Margem 2 no Nivel 13 e nada no Nivel 4`,
    [13, 4].map((nd) => deriveAfty(ficha(sistema, { nd, estilos: [nums] })).estilo.tecnicas[0].numeros.find((n) => n.efeitoId === "margem").valor),
    [2, 0]);

  /* Uma Técnica por vez: outra selecionada não liga esta, e o Domínio desligado
     não liga nenhuma. */
  t(`${sistema}: outra Tecnica selecionada nao liga esta`,
    delta(sistema, { estilos: [def1, cd], ativa: "cd" }, (d) => d.defesa), 0);
  t(`${sistema}: com o Dominio desligado nada vale`,
    deriveAfty(ficha(sistema, { estilos: [def1], ativa: "d1", ligado: false })).defesa
      - deriveAfty(ficha(sistema, { estilos: [def1], ligado: false })).defesa, 0);

  /* Os estados da bancada: o Domínio, e o seletor com as Técnicas. */
  const estados = deriveAfty(ficha(sistema, { estilos: [def1, cd] })).estilo.estados;
  t(`${sistema}: o seletor da Tecnica Atual dentro do Dominio`,
    estados.map((e) => [e.id, e.tipo, e.requerEstado ?? null]),
    [["estilo_ativo", "bool", null], ["estilo_tecnica", "opcao", "estilo_ativo"]]);

  /* E-03: o Sem Técnica de Nível 4 sem Técnica nenhuma liga o Domínio. */
  const so = deriveAfty(ficha(sistema, { nd: 4, dom: 1 }));
  t(`${sistema}: E-03, o Dominio liga sem Tecnica`,
    [so.aptidoesEscolhidas.includes("dominio_simples"), so.estilo.estados.map((e) => e.id)], [true, ["estilo_ativo"]]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
