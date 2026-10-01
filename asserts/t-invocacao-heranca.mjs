/* A HERANÇA DAS SOMBRAS PERSISTENTE (Etapa 10 da atualização de 2026-09-30).

   Decisão do autor DA-12: a Herança do *Mecânicas para Invocações 2.5.2*, com
   persistência, várias Heranças, Nível de Dano, bônus escolhido, resistência ou
   imunidade, Ação, Característica, treinamentos, atributo e a transferência da
   própria Herança quando a herdeira morre. O exemplo antigo por marcador com
   `fontes` continua valendo (t-dez-sombras.mjs). PV-14: o que a Herança concede
   não ocupa vaga nem custa. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const I = await import(R + "afty-invocacoes.js");
const AD = await import(R + "afty-addons.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const DONO = { nd: 5, bt: 3, nivelControlador: 5, nivelControladorReal: 5 };
const inv = (id, nome, grau, extra = {}) => ({ ...I.createBlankInvocacao(grau, "tecnica"), id, nome, ...extra });
const acao = (id, nome, classe = "complexa") => ({ ...I.createBlankAcao(), id, nome, classe });
const resistencia = { ...I.createBlankCaracteristica(), id: "cr", nome: "Pele de Fogo", subtipo: "resistenciaDano", parametros: { tipoDano: "fogo" } };

/* A sombra: Força 14 (o maior), uma Ação, uma Característica e uma resistência. */
const sombra = inv("S", "Grande Serpente", "terceiro", {
  atributos: { forca: 14, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 },
  acoes: [acao("as", "Bote")],
  caracteristicas: [resistencia],
});
const resSombra = I.resolveInvocacao(sombra, { ...DONO, resistenciasDePassiva: ["fogo"] });
const h1 = I.criaHeranca(sombra, resSombra);
t("a copia e congelada na criacao: maior atributo, resistencias, Acoes e Caracteristicas",
  [h1.origemNome, h1.copia.maioresAtributos, h1.copia.resistencias.map((r) => r.tipo), h1.copia.acoes.map((a) => a.nome), h1.copia.caracteristicas.length],
  ["Grande Serpente", ["forca"], ["fogo"], ["Bote"], 1]);
t("a copia nao aponta para a ficha da sombra", h1.copia.acoes[0] !== sombra.acoes[0], true);
t("os atributos empatados no topo vao todos para a escolha",
  I.maioresAtributosDe(inv("E", "Empate", "quarto", { atributos: { forca: 12, destreza: 12, constituicao: 8, inteligencia: 8, sabedoria: 8, presenca: 8 } })),
  ["forca", "destreza"]);

/* A herdeira, sem e com a Herança. */
const herdeira = inv("H", "Cão Divino", "terceiro", { periciasProf: { atletismo: "treinado" }, acoes: [acao("ah", "Mordida")] });
const comH = (escolhas, extra = {}) => I.resolveInvocacao(
  { ...herdeira, herancas: [{ ...h1, escolhas: { ...h1.escolhas, ...escolhas } }], ...extra }, DONO);
const sem = I.resolveInvocacao(herdeira, DONO);
const tudo = comH({ bonus: "trs", resistencia: "tipo:fogo", acaoId: "as", caracteristicaId: "cr", treinos: [{ tipo: "pericia", id: "furtividade" }, { tipo: "ataque", id: "distancia" }] });

t("+1 de Nivel de Dano", tudo.efeitosHabilidade.danoNivel - sem.efeitosHabilidade.danoNivel, 1);
t("+2 no maior atributo da sombra (Forca)",
  tudo.atributos.valores.forca - sem.atributos.valores.forca, 2);
t("bonus em Todas as TRs",
  tudo.testes.resistencias.map((r) => r.bonus - sem.testes.resistencias.find((x) => x.value === r.value).bonus),
  [1, 1, 1, 1, 1]);
t("bonus em RD Geral", comH({ bonus: "rd" }).rd.geral - sem.rd.geral, 1);
/* O +2 na Força já sobe o modificador (e o Ataque e a Atletismo com ele): o bônus
   se mede contra a mesma Herança com outro bônus. */
const comRd = comH({ bonus: "rd" });
t("bonus em Jogadas de Ataque", comH({ bonus: "ataque" }).testes.acerto.corpo.bonus - comRd.testes.acerto.corpo.bonus, 1);
t("bonus em Todas as Pericias: +1 em cada pericia da herdeira",
  comH({ bonus: "pericias" }).testes.pericias.find((p) => p.id === "atletismo").bonus
    - comRd.testes.pericias.find((p) => p.id === "atletismo").bonus, 1);
t("a resistencia herdada", tudo.resistencias.map((r) => r.tipo), ["fogo"]);
t("ou a imunidade", comH({ resistencia: "imunidade:Envenenado" }).imunidades, ["Envenenado"]);
t("a Acao e a Caracteristica herdadas entram nas listas",
  [tudo.acoes.map((a) => a.nome), tudo.caracteristicas.map((c) => c.nome)], [["Mordida", "Bote"], ["Pele de Fogo"]]);
t("e nao ocupam vaga nem custam (PV-14)",
  [tudo.custo, tudo.orcamento.usados], [sem.custo, sem.orcamento.usados]);
t("os treinos: a pericia e o ataque a distancia",
  [tudo.testes.pericias.find((p) => p.id === "furtividade")?.treinado, tudo.testes.acerto.distancia.treinado], [true, true]);
t("o treino herdado nao gasta a cota de pericias", tudo.pericias.usadas, sem.pericias.usadas);
t("sem bonus escolhido, avisa", comH({ bonus: "" }).warnings.some((w) => w.includes("escolha o bônus")), true);
t("mais de dois treinos avisam",
  comH({ bonus: "rd", treinos: [{ tipo: "tr", id: "fortitude" }, { tipo: "tr", id: "vontade" }, { tipo: "tr", id: "astucia" }] }).warnings
    .some((w) => w.includes("3 treinos")), true);

/* O teto de 30: passa do máximo do grau, e não de 30. */
const forte = { ...herdeira, grau: "quarto", atributos: { ...herdeira.atributos, forca: 16 } };
const fortissima = { ...herdeira, grau: "especial", atributos: { ...herdeira.atributos, forca: 30 } };
const comBonus = (base) => I.resolveInvocacao({ ...base, herancas: [{ ...h1, escolhas: { ...h1.escolhas, bonus: "rd" } }] }, DONO);
t("o +2 passa do maximo do grau (16 no Quarto)", comBonus(forte).atributos.valores.forca, 18);
t("e para em 30", comBonus(fortissima).atributos.valores.forca, 30);

/* Acumula por sombra, e passa adiante. */
const h2 = { ...I.criaHeranca(inv("T", "Tigre", "quarto"), null), escolhas: { bonus: "ataque", atributo: "forca", treinos: [] } };
const duas = I.resolveInvocacao({ ...herdeira, herancas: [{ ...h1, escolhas: { ...h1.escolhas, bonus: "rd" } }, h2] }, DONO);
t("duas Herancas: os efeitos se acumulam",
  [duas.efeitosHabilidade.danoNivel - sem.efeitosHabilidade.danoNivel, duas.atributos.valores.forca - sem.atributos.valores.forca],
  [2, 4]);
const herdeiraMorta = { ...herdeira, herancas: [{ ...h1, escolhas: { ...h1.escolhas, bonus: "rd" } }, h2] };
const h3 = I.criaHeranca(herdeiraMorta, I.resolveInvocacao(herdeiraMorta, DONO));
t("a Heranca de uma herdeira morta leva as dela", h3.herdadas.length, 2);
const nova = inv("N", "Nue", "terceiro");
const comTres = I.resolveInvocacao({ ...nova, herancas: [{ ...h3, escolhas: { ...h3.escolhas, bonus: "trs" } }] }, DONO);
t("e os efeitos herdados contam como dela (tres Niveis de Dano)",
  comTres.efeitosHabilidade.danoNivel - I.resolveInvocacao(nova, DONO).efeitosHabilidade.danoNivel, 3);
t("o resumo mostra a cadeia, com a profundidade",
  comTres.herancas.map((h) => [h.origemNome, h.profundidade]), [["Cão Divino", 0], ["Grande Serpente", 1], ["Tigre", 1]]);
t("sem Heranca, nada muda", JSON.stringify(I.resolveInvocacao(herdeira, DONO).herancas), "[]");
t("a primitiva de addon existe", AD.PRIMITIVAS.some((p) => p.id === "heranca"), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
