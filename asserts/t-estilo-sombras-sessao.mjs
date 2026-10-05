/* NOVO ESTILO DAS SOMBRAS: a sessão, a Ficha Final e o Encontro (Expansão, 2026-10-04).

   DA-04: com o Domínio Simples no ar, UMA Técnica imbuída por vez, trocada à mão.
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

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

let seq = 0;
const compra = (efeitoId) => ({ uid: `u${++seq}`, efeitoId });
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

  /* Os estados da tela: "Domínio Simples ativo, Técnica atual: X" (DA-04). */
  t(`${sistema}: o interruptor e o Dominio Simples`, [dominio.id, dominio.label, seletor.label], ["estilo_ativo", "Domínio Simples", "Técnica Atual"]);
  t(`${sistema}: a Tecnica invalida aparece marcada`, seletor.opcoes.map((o) => o.label), ["A", "B", "ruim (Inválida)"]);
  t(`${sistema}: a Exaustao por Tecnica, e a invalida nao gera`, dominio.exaustaoPorTecnica, { A: 2, B: 1, ruim: 0 });

  /* A sessão: ligar, imbuir, fechar. */
  const base = { ...sessaoEmBranco(d), exaustao: 0, combate: { ativo: true } };
  const passo = (s, estado, valor) => alteraEstadoCombate(s, estado, valor);
  let s = passo(base, dominio, true);
  t(`${sistema}: ligar nao gera Exaustao`, s.exaustao, 0);
  s = passo(s, seletor, "A");
  t(`${sistema}: imbuir nao gera Exaustao`, [s.exaustao, s.combate.estilo_tecnica], [0, "A"]);
  s = passo(s, dominio, false);
  t(`${sistema}: fechar gera a Exaustao da Tecnica`, [s.exaustao, s.combate.estiloUltimoFechamento.tecnicas], [2, ["A"]]);
  t(`${sistema}: fechar de novo nao gera de novo`, passo(s, dominio, false).exaustao, 2);
  s = passo(passo(s, dominio, true), dominio, false);
  t(`${sistema}: nova ativacao com a mesma Tecnica selecionada gera de novo`, s.exaustao, 4);

  /* Trocar no meio: as duas usadas somam, cada uma uma vez (NOVA DECISÃO). */
  let tr = passo(passo(base, seletor, "A"), dominio, true);
  tr = passo(tr, seletor, "B");
  tr = passo(tr, seletor, "A");
  t(`${sistema}: trocar nao gera Exaustao`, tr.exaustao, 0);
  tr = passo(tr, dominio, false);
  t(`${sistema}: ao fechar, A e B somam uma vez cada`, [tr.exaustao, tr.combate.estiloUltimoFechamento.tecnicas], [3, ["A", "B"]]);

  /* A inválida e o Domínio sem Técnica não geram nada. */
  t(`${sistema}: Tecnica invalida nao gera Exaustao`,
    passo(passo(passo(base, dominio, true), seletor, "ruim"), dominio, false).exaustao, 0);
  t(`${sistema}: Dominio sem Tecnica nao gera Exaustao`,
    passo(passo(base, dominio, true), dominio, false).exaustao, 0);

  /* O derive com a sessão: o que está no ar. */
  const C = tecnica("C", [compra("gatilho"), compra("gatilho")], { contraAtaque: { quantidade: 1 } });
  const noAr = deriveAfty(ficha(sistema, [C], { estilo_ativo: true, estilo_tecnica: "C" }));
  t(`${sistema}: o derive diz o que esta no ar`,
    [noAr.estilo.dominioAtivo, noAr.estilo.tecnicaAtiva, noAr.estilo.reacaoIndisponivel], [true, "C", true]);
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

  /* O Funcionamento Básico do Estilo aparece na Ficha, só com texto. */
  const comFunc = ficha(sistema, []);
  comFunc.estiloFuncionamento = { texto: "Corte de saque", durabilidadeTrilha: "au" };
  const f = conteudoDaFicha(comFunc, deriveAfty(comFunc)).find((i) => i.id === "estilo_funcionamento");
  t(`${sistema}: o Funcionamento Basico na Ficha`, [f?.nome, (f?.tags ?? []).map((x) => x.label ?? x)],
    ["Funcionamento Básico do Estilo", ["Durabilidade: Aura"]]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
