/* NOVO ESTILO DAS SOMBRAS: a sessão, a Ficha Final e o Encontro (Expansão, 2026-10-04).

   Técnicas ligadas: com o Domínio Simples no ar, QUANTAS a ficha conhecer, ao mesmo
   tempo (2026-10-11, revoga a DA-04, que era uma por vez). O mesmo bônus de duas
   Técnicas SOMA, e o total disputa com o resto do pool como um bloco só.
   DA-08: a Exaustão entra quando o Domínio FECHA, uma vez por fechamento, nunca ao
   ligar nem ao trocar. A sessão é a mesma na Ficha e no Encontro
   (`alteraEstadoCombate`, ficha/ficha-sessao.js). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EST = await import(R + "afty-estilo-sombras.js");
const { sessaoEmBranco, alteraEstadoCombate } = await import(R + "ficha/ficha-sessao.js");
const { conteudoDaFicha } = await import(R + "ficha/ficha-conteudo.js");
const EFE = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

let seq = 0;
const compra = (efeitoId, escolha = null) => ({ uid: `u${++seq}`, efeitoId, ...(escolha ? { escolha } : {}) });
const tecnica = (id, efeitos, extra = {}) => ({ ...EST.createBlankTecnicaEstilo(), id, nome: id, efeitos, ...extra });
const ficha = (sistema, estilos, combate = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 9;
  c.core.origem = { id: "sem_tecnica" };
  c.aptidoes = { dom: 3, bar: 3 };
  c.estilosSombra = estilos;
  c.combate = { ativo: true, ...combate };
  return c;
};

for (const sistema of ["afty", "player"]) {
  const A = tecnica("A", [compra("defesa")], { exaustao: 2 });
  const B = tecnica("B", [compra("dano")], { exaustao: 1 });
  const ruim = tecnica("ruim", [compra("defesa"), compra("defesa"), compra("defesa")], { exaustao: 4 });
  const estilos = [A, B, ruim];
  const d = deriveAfty(ficha(sistema, estilos));
  const [dominio, seletor] = d.estilo.estados;

  /* Os estados da tela: o Domínio Simples, e as Técnicas Ativas dentro dele. */
  t(`${sistema}: o interruptor e o Dominio Simples`, [dominio.id, dominio.label, seletor.label], ["estilo_ativo", "Domínio Simples", "Técnicas Ativas"]);
  t(`${sistema}: o seletor liga todas as conhecidas`, [seletor.tipo, seletor.maxSelecionados], ["multi", 3]);
  t(`${sistema}: a Tecnica invalida aparece marcada`, seletor.opcoes.map((o) => o.label), ["A", "B", "ruim (Inválida)"]);
  t(`${sistema}: a Exaustao por Tecnica, e a invalida nao gera`, dominio.exaustaoPorTecnica, { A: 2, B: 1, ruim: 0 });

  /* A sessão: ligar, imbuir, fechar. */
  const base = { ...sessaoEmBranco(d), exaustao: 0, combate: { ativo: true } };
  const passo = (s, estado, valor) => alteraEstadoCombate(s, estado, valor);
  let s = passo(base, dominio, true);
  t(`${sistema}: ligar nao gera Exaustao`, s.exaustao, 0);
  s = passo(s, seletor, ["A"]);
  t(`${sistema}: imbuir nao gera Exaustao`, [s.exaustao, s.combate.estilo_tecnica], [0, ["A"]]);
  s = passo(s, dominio, false);
  t(`${sistema}: fechar gera a Exaustao da Tecnica`, [s.exaustao, s.combate.estiloUltimoFechamento.tecnicas], [2, ["A"]]);
  t(`${sistema}: fechar de novo nao gera de novo`, passo(s, dominio, false).exaustao, 2);
  s = passo(passo(s, dominio, true), dominio, false);
  t(`${sistema}: nova ativacao com a mesma Tecnica selecionada gera de novo`, s.exaustao, 4);

  /* Trocar no meio: as duas usadas somam, cada uma uma vez (NOVA DECISÃO). */
  let tr = passo(passo(base, seletor, ["A"]), dominio, true);
  tr = passo(tr, seletor, ["B"]);
  tr = passo(tr, seletor, ["A"]);
  t(`${sistema}: trocar nao gera Exaustao`, tr.exaustao, 0);
  tr = passo(tr, dominio, false);
  t(`${sistema}: ao fechar, A e B somam uma vez cada`, [tr.exaustao, tr.combate.estiloUltimoFechamento.tecnicas], [3, ["A", "B"]]);

  /* A inválida e o Domínio sem Técnica não geram nada. */
  t(`${sistema}: Tecnica invalida nao gera Exaustao`,
    passo(passo(passo(base, dominio, true), seletor, ["ruim"]), dominio, false).exaustao, 0);
  t(`${sistema}: Dominio sem Tecnica nao gera Exaustao`,
    passo(passo(base, dominio, true), dominio, false).exaustao, 0);

  /* O derive com a sessão: o que está no ar. */
  const C = tecnica("C", [compra("gatilho"), compra("gatilho")], { contraAtaque: { quantidade: 1 } });
  const noAr = deriveAfty(ficha(sistema, [C], { estilo_ativo: true, estilo_tecnica: "C" }));
  /* ⚠ A sessão gravada antes de 2026-10-11 guarda um TEXTO, e ele vale como lista de um. */
  t(`${sistema}: o derive diz o que esta no ar, lendo o texto de antes`,
    [noAr.estilo.dominioAtivo, noAr.estilo.tecnicasAtivas, noAr.estilo.reacaoIndisponivel], [true, ["C"], true]);
  t(`${sistema}: e a lista de hoje da o mesmo`,
    deriveAfty(ficha(sistema, [C], { estilo_ativo: true, estilo_tecnica: ["C"] })).estilo.tecnicasAtivas, ["C"]);
  t(`${sistema}: fora de combate nada esta no ar`,
    deriveAfty(ficha(sistema, [C], { ativo: false, estilo_ativo: true, estilo_tecnica: "C" })).estilo.dominioAtivo, false);
  t(`${sistema}: o contador dos Ataques com Gatilho e por rodada`,
    noAr.mesa["estilo:C"]?.usos, { max: 2, recarga: "rodada", chave: "rodada:estilo:C" });

  /* A Ficha Final: a linha da Técnica com os números, e a do Domínio Simples. */
  const fichaC = ficha(sistema, [C], { estilo_ativo: true, estilo_tecnica: "C" });
  fichaC.aptidoesAmaldicoadas = [];
  const conteudo = conteudoDaFicha(fichaC, deriveAfty(fichaC));
  const linha = conteudo.find((i) => i.id === "C");
  t(`${sistema}: a Tecnica na Ficha`, [linha.tags.map((x) => x.label ?? x), linha.numeros, !!linha.usos],
    [["Modificação", "Ativa", "Reação Indisponível"], ["Contra-Ataques: 1"], true]);
  const dom = conteudo.find((i) => i.id === "dominio_simples");
  t(`${sistema}: a linha do Dominio Simples diz o que esta no ar`,
    (dom?.tags ?? []).map((x) => x.label ?? x).filter((x) => ["Ativo", "Técnica: C", "Reação Indisponível"].includes(x)),
    ["Ativo", "Técnica: C", "Reação Indisponível"]);

  /* ============================================================ */
  /* VÁRIAS TÉCNICAS AO MESMO TEMPO (autor, 2026-10-11)            */
  /* ============================================================ */
  const ataque = (x) => x.testes.ataques.find((a) => a.id === "corpo")?.bonus;
  const D = tecnica("D", [compra("defesa")]);
  const X = tecnica("X", [compra("acerto", { ataque: "corpo" })]);
  const Y = tecnica("Y", [compra("acerto", { ataque: "corpo" })]);
  const todas = [D, X, Y];
  const com = (ids) => deriveAfty(ficha(sistema, todas, { estilo_ativo: true, estilo_tecnica: ids }));
  const nenhuma = com([]);
  const meio = Math.floor(nenhuma.maestria / 2);
  t(`${sistema}: duas Tecnicas ligadas, os dois numeros valem`,
    [com(["D", "X"]).defesa - nenhuma.defesa, ataque(com(["D", "X"])) - ataque(nenhuma)], [meio, meio]);
  t(`${sistema}: o mesmo bonus de duas Tecnicas soma`,
    [ataque(com(["X"])) - ataque(nenhuma), ataque(com(["X", "Y"])) - ataque(nenhuma)], [meio, 2 * meio]);
  t(`${sistema}: o derive lista as ligadas, na ordem da ficha`, com(["Y", "D"]).estilo.tecnicasAtivas, ["D", "Y"]);
  t(`${sistema}: o hover mostra as duas parcelas sem suplantar`,
    (com(["X", "Y"]).efeitos.detalhes ?? [])
      .filter((l) => l.canal === "bonusAcerto" && l.exclusivo === "estiloSombra")
      .map((l) => [l.nome.split(":")[0], l.suplantado]),
    [["X", false], ["Y", false]]);

  /* A Exaustão ao fechar soma todas as ligadas, cada uma uma vez. */
  let mx = passo(passo(base, dominio, true), seletor, ["A", "B"]);
  t(`${sistema}: ligar duas nao gera Exaustao`, mx.exaustao, 0);
  mx = passo(mx, dominio, false);
  t(`${sistema}: ao fechar, as duas ligadas somam`, [mx.exaustao, mx.combate.estiloUltimoFechamento.tecnicas], [3, ["A", "B"]]);
  t(`${sistema}: o Dominio aberto com o texto de antes conta a Tecnica dele`,
    passo({ ...base, combate: { ativo: true, estilo_tecnica: "A" } }, dominio, true).combate.estiloUsadas, ["A"]);

  /* A Reação some se QUALQUER ligada tiver Contra-Ataque. */
  t(`${sistema}: a Reacao some com o Contra-Ataque de uma das ligadas`,
    deriveAfty(ficha(sistema, [C, D], { estilo_ativo: true, estilo_tecnica: ["D", "C"] })).estilo.reacaoIndisponivel, true);

  /* A linha do Domínio Simples lista as ligadas. */
  const fichaDX = ficha(sistema, todas, { estilo_ativo: true, estilo_tecnica: ["D", "X"] });
  fichaDX.aptidoesAmaldicoadas = [];
  const conteudoDX = conteudoDaFicha(fichaDX, deriveAfty(fichaDX));
  t(`${sistema}: a linha do Dominio Simples lista as ligadas`,
    (conteudoDX.find((i) => i.id === "dominio_simples")?.tags ?? []).map((x) => x.label ?? x).filter((x) => /^Técnicas?:/.test(x)),
    ["Técnicas: D, X"]);
  t(`${sistema}: as duas linhas de Tecnica marcadas Ativa`,
    ["D", "X", "Y"].map((id) => (conteudoDX.find((i) => i.id === id)?.tags ?? []).map((x) => x.label ?? x).includes("Ativa")),
    [true, true, false]);

  /* O Funcionamento Básico do Estilo aparece na Ficha, só com texto. */
  const comFunc = ficha(sistema, []);
  comFunc.estiloFuncionamento = { texto: "Corte de saque", durabilidadeTrilha: "au" };
  const f = conteudoDaFicha(comFunc, deriveAfty(comFunc)).find((i) => i.id === "estilo_funcionamento");
  t(`${sistema}: o Funcionamento Basico na Ficha`, [f?.nome, (f?.tags ?? []).map((x) => x.label ?? x)],
    ["Funcionamento Básico do Estilo", ["Durabilidade: Aura"]]);
}

/* ============================================================ */
/* O BLOCO NO POOL QUE NÃO ACUMULA (2026-10-11)                  */
/* ============================================================ */
/* As Técnicas ligadas somam entre si e o total disputa com o resto do pool como
   UM candidato. Dentro de uma Técnica (mesma `origem`) a disputa é a de antes.
   Sem bloco, nada muda. */
const pool = (linhas) => {
  const r = EFE.resolverExclusivos(EFE.aplicarEfeitos(linhas.map(([valor, extra]) => ({
    canal: "bonusAcerto", alvo: "corpo", expr: String(valor), duracao: "temporaria", ...extra,
  }))));
  return [r.porAlvo.bonusAcerto?.corpo ?? 0, r.detalhes.filter((d) => d.suplantado).map((d) => d.nome)];
};
const tec = (nome) => ({ exclusivo: "estiloSombra", blocoExclusivo: EST.BLOCO_TECNICAS_ESTILO, origem: `estilo:${nome}`, nome });
const aux = (nome) => ({ exclusivo: "feiticoAuxiliarAtivo", origem: `aux:${nome}`, nome });
t("o bloco de duas Tecnicas vence um Auxiliar menor que a soma", pool([[2, tec("X")], [2, tec("Y")], [3, aux("Aux")]]), [4, ["Aux"]]);
t("e perde inteiro para um maior", pool([[2, tec("X")], [2, tec("Y")], [5, aux("Aux")]]), [5, ["X", "Y"]]);
t("dentro de uma Tecnica vale a maior linha dela", pool([[2, tec("X")], [3, tec("X")], [2, tec("Y")]]), [5, ["X"]]);
t("sem bloco a disputa e a de sempre",
  pool([[2, { exclusivo: "estiloSombra", origem: "estilo:a", nome: "a" }], [2, { exclusivo: "estiloSombra", origem: "estilo:b", nome: "b" }]]), [2, ["b"]]);

/* As LEGACY ficam fora do bloco (DA-05): só a Expansão o carrega. */
{
  const c = ficha("afty", [
    { id: "acerto", tipo: "tabela" },
    tecnica("E", [compra("defesa")]),
  ]);
  const linhas = EST.efeitosDoEstilo(c, { origemId: "sem_tecnica", nd: 9, dom: 3, temDominioSimples: true });
  t("a LEGACY sai sem bloco e a da Expansao com ele",
    [linhas.find((l) => l.origem === "estilo:acerto")?.blocoExclusivo ?? null,
      linhas.find((l) => l.origem === "estilo:E")?.blocoExclusivo ?? null],
    [null, EST.BLOCO_TECNICAS_ESTILO]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
