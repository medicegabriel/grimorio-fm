// CX3, frente Aptidões e Treinos (Claude). Números puros de Punho Divergente (p.181), Pétala (p.181),
// Revestimento de Domínio e Anular Técnica (p.182) e Anti-Domínios (p.246). Não prova janela nem recibo.
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { getAptidao } = await import(R + "afty-aptidoes.js");
const N = await import(R + "afty-conteudo-antidominio.js");
let ok = 0;
const erros = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : erros.push(n + ": " + JSON.stringify(a) + " != " + JSON.stringify(b));
aplicarAddons([]);

// Punho Divergente
t("metade para baixo e o resto guardado", [0, 1, 7, 10, 23].map((x) => N.metadesDoPunhoDivergente(x)),
  [{ imediato: 0, guardado: 0 }, { imediato: 0, guardado: 1 }, { imediato: 3, guardado: 4 }, { imediato: 5, guardado: 5 }, { imediato: 11, guardado: 12 }]);
t("o total nunca se perde", [1, 2, 9, 31, 100].every((x) => { const m = N.metadesDoPunhoDivergente(x); return m.imediato + m.guardado === x; }), true);
t("a CD sobe 1 a cada 5 pontos da primeira metade", [0, 4, 5, 9, 10, 24, 25].map(N.bonusCdPunhoDivergente), [0, 0, 1, 1, 2, 4, 5]);
t("só falhar no Fortitude liga a vulnerabilidade", [true, false, undefined, "sim"].map(N.segundaMetadeComVulnerabilidade), [true, false, false, false]);

for (const sistema of ["player", "afty"]) {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.core.nd = 10; c.attrMethod = "fixos";
  c.attributes = { forca: 12, destreza: 18, constituicao: 14, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { destreza: 2 } }; c.especializacoes = [{ id: "combatente", nivel: 10 }];
  const d = deriveAfty(c);
  const maior = Math.max(d.mods.forca, d.mods.destreza, d.mods.constituicao);
  const r = N.cdPunhoDivergente({ cd: d.cd, modTecnica: d.modTecnica, mods: d.mods, imediato: 13 });
  t(`${sistema} CD do Punho: troca o atributo da Técnica pelo maior físico e soma 13 ÷ 5`, [r.maiorFisico, r.base, r.bonus, r.cd],
    [maior, d.cd - d.modTecnica + maior, 2, d.cd - d.modTecnica + maior + 2]);
  t(`${sistema} o maior físico é o de Destreza`, d.mods.destreza === maior, true);
}

// Anular Técnica
t("usos por descanso longo = Nível de Aptidão em Domínio", [0, 3, 5].map(N.usosAnularTecnica), [0, 3, 5]);
t("só anula nível acessível", [[1, 3], [3, 3], [4, 3], [0, 3]].map(([f, m]) => N.podeAnularNivel(f, m)), [true, true, false, false]);
t("custo = energia gasta na conjuração", [0, 6, 12].map(N.custoAnularTecnica), [0, 6, 12]);
t("disputa de Feitiçaria, empate devolvido à mesa", [[15, 12], [10, 12], [12, 12], [NaN, 1]].map(([a, b]) => N.disputaAnularTecnica(a, b)), ["anula", "falha", "empate", null]);
t("Anular Técnica pede Domínio Simples, Domínio 3 e nível 8", getAptidao("anular_tecnica").requisitos,
  [{ tipo: "aptidao", id: "dominio_simples" }, { tipo: "trilha", trilha: "dom", valor: 3 }, { tipo: "nd", valor: 8 }]);

// Revestimento de Domínio
t("ativar custa 5 PE em Ação Bônus ou Reação", N.ATIVAR_REVESTIMENTO, { pe: 5, acoes: ["bonus", "reacao"] });
t("sustentação: 5 PE e +2 por rodada depois da primeira (leitura literal da p.246)", [1, 2, 3, 4, 5].map(N.custoSustentarRevestimento), [5, 7, 9, 11, 13]);
t("rodada inválida cai no custo base", [0, -2].map(N.custoSustentarRevestimento), [5, 5]);
t("redução de dano = nível de personagem, sem passar de zero", [[30, 10], [10, 10], [4, 10], [0, 10]].map(([d, n]) => N.danoAposRevestimento(d, n)), [20, 0, 0, 0]);
t("a metade do Nível de DOM arredonda PARA CIMA, por texto expresso", [0, 1, 2, 3, 4, 5].map(N.nivelMaximoAnuladoPeloRevestimento), [0, 1, 1, 2, 2, 3]);
t("anula a Técnica de nível até essa metade", [[1, 3], [2, 3], [3, 3], [1, 0]].map(([n, dom]) => N.revestimentoAnulaTecnica(n, dom)), [true, true, false, false]);
t("o Funcionamento Básico vale como Feitiço de primeiro nível", N.NIVEL_DO_FUNCIONAMENTO_BASICO, 1);
t("Revestimento pede Controle e Leitura 3, Domínio 1 e nível 10", getAptidao("revestimento_de_dominio").requisitos,
  [{ tipo: "trilha", trilha: "cl", valor: 3 }, { tipo: "trilha", trilha: "dom", valor: 1 }, { tipo: "nd", valor: 10 }]);

// Pétala
t("anular o acerto garantido custa o Nível de DOM de quem expandiu", [0, 2, 5].map(N.custoDeAnularAcertoGarantido), [0, 2, 5]);
t("contra-ataque: Livre e 5 PE", N.PETALA_CONTRA_ATAQUE, { pe: 5, acao: "livre" });
t("Pétala exige o Clã na origem Herdado e Cobrir-se (decisão de 16/07 preservada)", getAptidao("emocao_da_petala_decadente").requisitos,
  [{ tipo: "nd", valor: 5 }, { tipo: "origem", id: "herdado" }, { tipo: "aptidao", id: "cobrir_se" }, { tipo: "trilha", trilha: "cl", valor: 3 }]);

if (erros.length) { console.error(erros.join("\n")); process.exitCode = 1; } else console.log("TODOS OS " + ok + " ASSERTS PASSARAM");
