/* TÉCNICA MÁXIMA: a escala Nível 5 → `max` e a porta única de cálculo
   (autor, 2026-10-08).

   DA-03: as TABELAS seguem a escala, as regras que dizem "caso seja uma Técnica
   Máxima" seguem a IDENTIDADE. A mesma Técnica Máxima usa os valores de Nível 5
   com acesso só ao 4 e os de Técnica Máxima com acesso ao 5, sempre a 25 PE.
   DA-07: o orçamento de Múltiplos Efeitos segue a escala, o custo não.
   DA-02: a LEGACY segue na tabela `max`, como sempre calculou. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const base = F.createBlankFeitico();
const oficial = (extra = {}) => ({ ...base, nivel: "max", regraTecnicaMaxima: "oficial", ...extra });
// Acesso 4 no ND 13, acesso 5 no ND 17 (`nivelMaxFeitico`).
const ctx = (nd) => ({ nd, nivelConjurador: 0, cdBase: 20, modTecnica: 4, efeitos: { detalhes: [] } });
const A4 = ctx(13);
const A5 = ctx(17);
const calc = (f, c) => F.calcularFeitico(f, c);

/* ============================================================ */
/* A ESCALA                                                      */
/* ============================================================ */
t("acesso 4 usa a escala de Nível 5", F.escalaDaTecnicaMaxima(4), 5);
t("acesso 5 usa a escala max", F.escalaDaTecnicaMaxima(5), "max");
t("o acesso da ficha nos dois NDs", [F.nivelMaxFeitico(13), F.nivelMaxFeitico(17)], [4, 5]);

/* ============================================================ */
/* A MESMA TÉCNICA MÁXIMA NAS DUAS ESCALAS                       */
/* ============================================================ */
const dano = oficial();
t("Dano: acesso 4 usa os dados de Nível 5", [calc(dano, A4).dados, calc(dano, A4).tipoDado], [18, 12]);
t("Dano: acesso 5 usa os dados de Técnica Máxima", [calc(dano, A5).dados, calc(dano, A5).tipoDado], [26, 12]);
t("Dano: custo 25 nas duas", [calc(dano, A4).custoPE, calc(dano, A5).custoPE], [25, 25]);
t("Dano: a escala vai junto do cálculo", [calc(dano, A4).tecnicaMaxima.escala, calc(dano, A5).tecnicaMaxima.escala], [5, "max"]);
t("Dano: a escala 5 não é 'inacessível'", calc(dano, A4).avisos, []);
t("Conjuração Aprimorada segue a escala (2× no 5, 3× na max)", [calc(dano, A4).dano, calc(dano, A5).dano], ["18d12+34", "26d12+63"]);
t("o registro não muda: a identidade continua max", dano.nivel, "max");

const cura = oficial({ tipo: "curativo" });
t("Curativo: 16d10 e 24d10", [calc(cura, A4).cura, calc(cura, A5).cura], ["16d10", "24d10"]);

const alma = oficial({ tipo: "especial", especialSubtipo: "danoAlma" });
t("Dano na Alma: 12d10 e 16d12", [calc(alma, A4).dano, calc(alma, A5).dano], ["12d10", "16d12"]);

const golpeador = oficial({ tipo: "especial", especialSubtipo: "golpeador", golpesGolpeador: 3 });
t("Golpeador: dados e golpes seguem a escala", [calc(golpeador, A4).dados, calc(golpeador, A5).dados], [14, 18]);
t("Golpeador: teto de golpes pela escala", [F.maxGolpesGolpeador(5), F.maxGolpesGolpeador("max")], [4, 5]);
const golpeadorComum = calc({ ...base, tipo: "especial", especialSubtipo: "golpeador", nivel: 5, golpesGolpeador: 3 }, A5);
t("Golpeador: a penalidade −2 é da IDENTIDADE, também na escala 5",
  [golpeadorComum.golpes.penalidadePorGolpe, calc(golpeador, A4).golpes.penalidadePorGolpe], [3, 2]);

const shikigami = oficial({ tipo: "especial", especialSubtipo: "shikigami" });
t("Shikigami: grau e ações pela escala",
  [calc(shikigami, A4).grau, calc(shikigami, A4).ajusteAcoes, calc(shikigami, A5).ajusteAcoes], ["especial", 0, 2]);
t("Shikigami: redução de PE pela escala", [calc(shikigami, A4).reducaoPE, calc(shikigami, A5).reducaoPE], [10, 12]);
t("Shikigami: recarga ao dissipar é da IDENTIDADE",
  [calc(shikigami, A4).tecnicaMaxima.inicioRecarga, calc(shikigami, A5).tecnicaMaxima.inicioRecarga], ["aoDissipar", "aoDissipar"]);
t("Shikigami: custo 25 nas duas", [calc(shikigami, A4).custoPE, calc(shikigami, A5).custoPE], [25, 25]);
const shikigamiComum = calc({ ...base, tipo: "especial", especialSubtipo: "shikigami", nivel: 5 }, A5);
t("Shikigami de Nível 5 comum não segura a recarga", shikigamiComum.inicioRecarga, undefined);

const transformacao = oficial({ tipo: "especial", especialSubtipo: "transformacao", transfDuracao: "cena" });
t("Transformação: a tabela segue a escala", [calc(transformacao, A4).slots, calc(transformacao, A5).slots], [[3, 3, 3], [4, 4, 4]]);
t("Transformação: os 5 acúmulos na cena são da IDENTIDADE", [calc(transformacao, A4).exaustaoFim, calc(transformacao, A5).exaustaoFim], [5, 5]);

const defesa = oficial({ tipo: "auxiliar", efeitoAux: "defesa", duracaoAux: "imediata" });
t("Auxiliar: a célula de Nível 5 na escala 5", calc(defesa, A4).valor, 12);
t("Auxiliar: a célula de Técnica Máxima na escala max", calc(defesa, A5).especial, "2 Esquivas Garantidas");
const margem = oficial({ tipo: "auxiliar", efeitoAux: "margemCritico", duracaoAux: "imediata", umGolpe: true });
const margemComum = calc({ ...base, tipo: "auxiliar", nivel: 5, efeitoAux: "margemCritico", duracaoAux: "imediata", umGolpe: true }, A5);
t("Margem: os 3 Críticos Garantidos são da IDENTIDADE",
  [margemComum.especial, calc(margem, A4).especial], ["Crítico Garantido", "3 Críticos Garantidos"]);

const multiplos = oficial({ tipo: "auxiliar", multiplosAtivo: true });
t("Múltiplos Efeitos: orçamento pela escala (20 e 25)",
  [F.orcamentoMultiplos(F.feiticoNaEscala(multiplos, A4)).total, F.orcamentoMultiplos(F.feiticoNaEscala(multiplos, A5)).total], [20, 25]);
t("Múltiplos Efeitos: custo real 25 nas duas", [calc(multiplos, A4).custoPE, calc(multiplos, A5).custoPE], [25, 25]);
t("Múltiplos Efeitos LEGACY também custa 25 (conserto do nBase)", calc({ ...base, tipo: "auxiliar", nivel: "max", multiplosAtivo: true }, A5).custoPE, 25);

t("Invisibilidade: custo 25", calc(oficial({ tipo: "especial", especialSubtipo: "invisibilidade" }), A4).custoPE, 25);
t("Personalizado: custo 25", calc(oficial({ tipo: "personalizado" }), A4).custoPE, 25);

/* ============================================================ */
/* LEGACY E FEITIÇO COMUM                                        */
/* ============================================================ */
const legacy = { ...base, nivel: "max" };
t("LEGACY: tabela max mesmo com acesso 4", [calc(legacy, A4).dados, calc(legacy, A4).custoPE], [26, 25]);
t("LEGACY: sem escala derivada", calc(legacy, A4).tecnicaMaxima, undefined);
t("Feitiço comum: a porta não muda nada",
  JSON.stringify(calc({ ...base, nivel: 3 }, A4)), JSON.stringify(F.calcularFeiticoDano({ ...base, nivel: 3 }, A4)));
t("Feitiço comum acima do acesso continua inacessível", calc({ ...base, nivel: 5 }, A4).avisos.length > 0, true);

/* ============================================================ */
/* A LINHA DA FICHA (pelo derive), NOS DOIS SISTEMAS             */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const ficha = (nd) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = nd;
    c.core.origem = { id: "inato" };
    c.pericias = { feiticaria: "mestre" };
    c.aptidoesAmaldicoadas = ["tecnica_maxima"];
    c.feiticos = [{ ...oficial(), id: "tm", nome: "TM" }];
    return c;
  };
  const l13 = deriveAfty(ficha(13)).feiticos.lista[0];
  const l17 = deriveAfty(ficha(17)).feiticos.lista[0];
  t(`${sistema}: a linha usa 18d12 no acesso 4`, /^18d12/.test(l13.valor), true);
  t(`${sistema}: a mesma linha usa 26d12 no acesso 5`, /^26d12/.test(l17.valor), true);
  t(`${sistema}: custo 25 nas duas`, [l13.custoPE, l17.custoPE], [25, 25]);
  t(`${sistema}: escala e validade na linha`,
    [l13.tecnicaMaxima.escala, l13.tecnicaMaxima.valida, l17.tecnicaMaxima.escala], [5, true, "max"]);
  t(`${sistema}: o rótulo continua Técnica Máxima`, l13.nivelLabel, "Técnica Máxima");
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
