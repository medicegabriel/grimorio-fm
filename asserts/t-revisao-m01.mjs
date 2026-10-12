/* REVISÃO M01 (2026-10-07): Motor, linguagem, variáveis, canais e validação.

   Prende os achados confirmados do lote:

   - VAL-01: número com dois pontos ("1.2.3") é erro de sintaxe, e não 1.2.
   - NUM-01: valor não finito no contexto cai no fallback, também no evalBoolean.
   - VAL-02: o portão de instalação confere canal, `expr` e `quando` dos efeitos
     de Funcionamento e de Técnica de Estilo de addon, nos dois catálogos de
     canal (criatura e invocação).
   - VAR-01: a escolha de uma Aptidão de addon vira `opt_<id normalizado>_<valor>`.
   - VAR-02: dois ids que viram a mesma variável são relatados.
   - PERSIST-01: o editor grava de volta `semCredito`, `quando` e `duracao`.
   - UI-01: os canais cujo alvo É o dado ou o gatilho declaram alvo obrigatório.

   Zero válido e erro com fallback ficam separados (o pedido do lote). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const DSL = await import(R + "afty-dsl.js");
const AD = await import(R + "afty-addons.js");
const EF = await import(R + "afty-efeitos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* VAL-01 e NUM-01: a linguagem                                  */
/* ============================================================ */

t("VAL-01 '1.2.3' é reprovado pelo editor", DSL.validateExpression("1.2.3").ok, false);
t("VAL-01 e o erro diz o número", /malformado/i.test(DSL.validateExpression("1.2.3").error ?? ""), true);
t("VAL-01 '1.2.3' cai no fallback", DSL.evalNumber("1.2.3", {}, -1), -1);
t("VAL-01 '1.5' continua valendo", DSL.evalNumber("1.5 * 2", {}, -1), 3);
t("VAL-01 '.5' continua valendo", DSL.evalNumber(".5 + 1", {}, -1), 1.5);
t("zero VÁLIDO não é confundido com erro", DSL.evalNumber("nd - nd", { nd: 4 }, -1), 0);
t("e a expressão inválida usa o fallback", DSL.evalNumber("nd +", { nd: 4 }, -1), -1);
t("NUM-01 evalBoolean com Infinity cai no fallback", DSL.evalBoolean("x", { x: Infinity }, false), false);
t("NUM-01 e o fallback escolhido manda", DSL.evalBoolean("x", { x: Infinity }, true), true);
t("NUM-01 comparação com Infinity não vira 1", DSL.evalNumber("x > 1", { x: Infinity }, -1), -1);
t("NUM-01 -Infinity também", DSL.evalNumber("x < 1", { x: -Infinity }, -1), -1);
t("NUM-01 NaN segue sendo zero, como sempre", DSL.evalNumber("x + 1", { x: NaN }, -1), 1);
t("NUM-01 evalBoolean finito continua normal", [DSL.evalBoolean("x > 1", { x: 2 }), DSL.evalBoolean("x > 1", { x: 0 })], [true, false]);

/* ============================================================ */
/* VAL-02: o portão de instalação                                */
/* ============================================================ */

const comFuncionamento = (efeito) => ({ id: "m01-repro", nome: "Repro", versao: "1",
  funcionamentos: [{ id: "nucleo", nome: "Núcleo Próprio", efeitos: [efeito] }] });
const reprova = (pacote, trecho) => AD.validarPacote(pacote).some((p) => p.includes(trecho));
t("VAL-02 canal inexistente é recusado", reprova(comFuncionamento({ canal: "canal_inexistente", expr: "1" }), "canal inexistente"), true);
t("VAL-02 expr fora da sintaxe é recusada", reprova(comFuncionamento({ canal: "defesa", expr: "nd +" }), "\"expr\" inválido"), true);
t("VAL-02 quando fora da sintaxe é recusado", reprova(comFuncionamento({ canal: "defesa", expr: "1", quando: "nd >" }), "\"quando\" inválido"), true);
t("VAL-02 expr vazia continua recusada", reprova(comFuncionamento({ canal: "defesa", expr: " " }), "falta o campo \"expr\""), true);
t("VAL-02 efeito válido passa", AD.validarPacote(comFuncionamento({ canal: "defesa", expr: "2", quando: "nd >= 1" })), []);
t("VAL-02 variável desconhecida NÃO reprova (pode existir só na ficha)",
  AD.validarPacote(comFuncionamento({ canal: "defesa", expr: "tem_outro_pacote_x * 2" })), []);
t("VAL-02 canal de INVOCAÇÃO vale com escopo invocacao",
  AD.validarPacote(comFuncionamento({ canal: "danoNivel", escopo: "invocacao", expr: "1" })), []);
t("VAL-02 e não vale sem o escopo", reprova(comFuncionamento({ canal: "danoNivel", expr: "1" }), "canal inexistente"), true);
t("VAL-02 canal da criatura com escopo invocacao é recusado",
  reprova(comFuncionamento({ canal: "rdAlma", escopo: "invocacao", expr: "1" }), "canal inexistente"), true);
{
  const estilo = (efeito) => ({ id: "m01-estilo", nome: "Estilo", versao: "1",
    estilos: [{ id: "garra", nome: "Garra", descricao: "d", efeitos: [efeito] }] });
  t("VAL-02 Técnica de Estilo com canal inexistente é recusada",
    reprova(estilo({ canal: "canal_inexistente", expr: "1" }), "canal inexistente"), true);
  t("VAL-02 Técnica de Estilo válida passa", AD.validarPacote(estilo({ canal: "danoBonus", expr: "2" })), []);
}

/* ============================================================ */
/* VAR-01: `opt_` de Aptidão de addon                            */
/* ============================================================ */

const aptPacote = { id: "mesa-x", nome: "Mesa", versao: "1", acrescenta: { aptidoes: [{
  id: "foco", nome: "Foco", categoria: "aura", trilha: "au", nivel: 1, descricao: "f", requisitos: [],
  opcoes: { id: "som", label: "Som", valores: [{ id: "eco", label: "Eco" }, { id: "grito", label: "Grito" }] },
}] } };
for (const sistema of ["afty", "player"]) {
  AD.aplicarAddons([aptPacote]);
  const mk = (valor, defesa) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.addons = [aptPacote];
    c.aptidaoOpcoes = valor ? { "mesa-x:foco": valor } : {};
    c.core = { ...c.core, tecnicaEfeitos: [{ canal: "defesa", expr: String(defesa), quando: "opt_mesa_x_foco_eco" }] };
    return c;
  };
  const base = deriveAfty(mk(null, 4)).defesa;
  t(`VAR-01 (${sistema}) opt_mesa_x_foco_eco liga com a opção escolhida`, deriveAfty(mk("eco", 4)).defesa - base, 4);
  t(`VAR-01 (${sistema}) e com outro valor`, deriveAfty(mk("eco", 6)).defesa - base, 6);
  t(`VAR-01 (${sistema}) a outra opção não liga`, deriveAfty(mk("grito", 4)).defesa - base, 0);
}
{
  t("VAR-01 pacote da Aptidão aceito", AD.aplicarAddons([aptPacote]).problemas, []);
  const d = deriveAfty(Object.assign(createBlankAfty(), { addons: [aptPacote] }));
  const nomes = Object.keys(d.contextoDsl ?? {});
  {
    t("VAR-01 a variável declarada a zero é a normalizada", nomes.includes("opt_mesa_x_foco_eco"), true);
    t("VAR-01 e a crua não existe", nomes.some((n) => n.includes(":")), false);
  }
}

/* ============================================================ */
/* VAR-02: colisão depois da normalização                        */
/* ============================================================ */

{
  const hab = (id) => ({ id, nome: id, descricao: "x", especializacaoId: "lutador", tipo: "nivel", nivel: 2, requisitos: [] });
  const a = { id: "ab-cd", nome: "A", versao: "1", acrescenta: { habilidades: [hab("ef")] } };
  const b = { id: "ab", nome: "B", versao: "1", acrescenta: { habilidades: [hab("cd_ef")] } };
  const r = AD.aplicarAddons([a, b]);
  const colisao = r.problemas.find((p) => p.pacote === "(variáveis da DSL)");
  t("VAR-02 ab-cd:ef e ab:cd_ef são relatados", colisao?.problemas?.[0]?.includes("ab_cd_ef"), true);
  t("VAR-02 e os dois pacotes continuam aplicados", r.aplicados.map((p) => p.id), ["ab-cd", "ab"]);
  const lut = { id: "lut", nome: "L", versao: "1", acrescenta: { habilidades: [hab("corpo_treinado")] } };
  const r2 = AD.aplicarAddons([lut]);
  t("VAR-02 pacote 'lut' com 'corpo_treinado' colide com o livro",
    r2.problemas.some((p) => p.pacote === "(variáveis da DSL)" && p.problemas.some((x) => x.includes("lut_corpo_treinado"))), true);
  t("VAR-02 sem colisão, nada é relatado", AD.aplicarAddons([a]).problemas, []);
}

/* ============================================================ */
/* PERSIST-01: o que o editor grava de volta                     */
/* ============================================================ */

{
  const linha = {
    canal: "proficienciaPericia", alvo: "percepcao", expr: "1", quando: "nd >= 2", duracao: "temporaria",
    semCredito: true, valor: 1, ativo: true, alvoTipo: "pericia", nota: "x",
  };
  t("PERSIST-01 semCredito sobrevive à edição de outra linha",
    EF.efeitoGravavel(linha).semCredito, true);
  t("PERSIST-01 e os campos resolvidos não são gravados",
    ["valor", "ativo", "alvoTipo", "nota"].filter((k) => k in EF.efeitoGravavel(linha)), []);
  t("PERSIST-01 o editor da Habilidade Única conserva quando e duração",
    EF.efeitoGravavel({ canal: "defesa", expr: "2", quando: "golpe_atroz", duracao: "temporaria" }, { modo: "soAtiva" }),
    { canal: "defesa", expr: "2", quando: "golpe_atroz", duracao: "temporaria" });
  t("PERSIST-01 modo explícito grava passiva por padrão",
    EF.efeitoGravavel({ canal: "defesa", expr: "1" }, { modo: "explicito" }).modo, "passiva");
  t("PERSIST-01 mira em Ação só com canal lido pela Ação",
    [
      EF.efeitoGravavel({ canal: "defesa", expr: "1", escopo: "invocacao", invocacaoAlvo: "i1", acaoAlvo: "a1" },
        { canaisPorAcao: new Set(["danoBonus"]) }).acaoAlvo ?? null,
      EF.efeitoGravavel({ canal: "danoBonus", expr: "1", escopo: "invocacao", invocacaoAlvo: "i1", acaoAlvo: "a1" },
        { canaisPorAcao: new Set(["danoBonus"]) }).acaoAlvo ?? null,
    ],
    [null, "a1"]);
  // E o derive devolve o campo para o editor, para a próxima gravação ter o que copiar.
  const c = createBlankAfty();
  c.core = { ...c.core, tecnicaEfeitos: [linha] };
  const editaveis = deriveAfty(c).tecnicaEfeitos;
  {
    t("PERSIST-01 a ida e volta pelo derive conserva semCredito",
      EF.efeitoGravavel(editaveis[0]).semCredito, true);
  }
}

/* ============================================================ */
/* UI-01: alvo obrigatório nos canais de dado e de gatilho       */
/* ============================================================ */

t("UI-01 os cinco canais declaram alvo obrigatório",
  ["peTemporario", "dadosTR", "dadosPericia", "dadosNomeados", "dadosAtaque"].map((id) => EF.getCanal(id)?.alvoObrigatorio),
  [true, true, true, true, true]);
t("UI-01 canal de alvo opcional segue sem a marca",
  ["atributo", "rdTipo", "custoPE"].map((id) => !!EF.getCanal(id)?.alvoObrigatorio), [false, false, false]);
{
  const c = createBlankAfty();
  c.core = { ...c.core, tecnicaEfeitos: [{ canal: "dadosPericia", alvo: "percepcao:d4", expr: "1" }] };
  const d = deriveAfty(c);
  const ed = d.tecnicaEfeitos.find((e) => e.canal === "dadosPericia");
  t("UI-01 o derive avisa o editor", [ed.alvoTipo, ed.alvoObrigatorio], ["periciaDado", true]);
}

AD.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
