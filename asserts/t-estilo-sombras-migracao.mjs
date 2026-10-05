/* NOVO ESTILO DAS SOMBRAS: a migração LEGACY e os Addons (Expansão, 2026-10-04).

   DA-05: a Técnica antiga (`{ tipo: "tabela" }`, a entrada sem `tipo`, a
   `{ tipo: "especial" }` com `custoImbuicao`, o recipiente `modificacao` de antes
   de 2026-08-10) calcula como antes, NUNCA é convertida sozinha e nunca perde
   dado. A conversão é um botão (`converterTecnicaLegacy`), e a convertida guarda
   o original inteiro em `legado`.
   DA-06: a Técnica de pacote sem `regra` segue `legacy` (Lime Neds), e o pacote
   que declara `regra: "expansao"` entra como Técnica da Expansão.

   ⚠ Os números LEGACY abaixo foram MEDIDOS no commit 8bc4b82 (antes da
   Expansão), com estas mesmas fichas e os mesmos estados de bancada. Eles não
   podem mudar: mudar um deles é mudar ficha salva de alguém. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EST = await import(R + "afty-estilo-sombras.js");
const CAT = await import(R + "afty-estilo-sombras-catalogo.js");
const AD = await import(R + "afty-addons.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = (nome) => JSON.parse(readFileSync(new URL(`../addons/${nome}.json`, import.meta.url), "utf8"));
const ficha = (sistema, estilos, combate, extra = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 9;
  c.core.origem = { id: "sem_tecnica" };
  c.aptidoes = { dom: 3 };
  c.estilosSombra = estilos;
  c.combate = { ativo: true, ...combate };
  return Object.assign(c, extra);
};
const copia = (x) => JSON.parse(JSON.stringify(x));

/* ============================================================ */
/* AS FICHAS ANTIGAS, NOS FORMATOS QUE EXISTEM GRAVADOS          */
/* ============================================================ */
// Tabela com e sem `tipo`, e a Especial com custo de imbuição próprio.
const tabelaEEspecial = () => [
  { id: "defesa", tipo: "tabela" },
  { id: "acerto", tipo: "tabela" },
  { id: "dano" },
  { id: "est_velha", tipo: "especial", nome: "Lâmina Nebulosa", descricao: "Lâmina de energia", efeitos: [{ canal: "iniciativa", expr: "2" }], custoImbuicao: 2 },
];
// O recipiente de antes de 2026-08-10, lido como tabela + Especial.
const recipiente = () => [{
  id: "rec", tipo: "modificacao", nome: "Recipiente", descricao: "Antigo",
  efeitosModificacao: [{ id: "defesa" }, { id: "dano" }],
  efeitos: [{ canal: "iniciativa", expr: "1" }],
}];
const resumo = (d) => ({
  defesa: d.defesa,
  acerto: d.testes.ataques.find((a) => a.id === "corpo").bonus,
  iniciativa: d.iniciativa,
  estilos: d.orcamentoHabilidades.estilos,
  gastos: d.orcamentoHabilidades.gastos,
  restante: d.orcamentoHabilidades.restante,
  exclusivasEstilo: d.orcamentoHabilidades.exclusivasEstilo,
  conhecidas: d.estilo.conhecidas.map((x) => x.id),
  vagas: d.estilo.vagas,
  gastoVagas: d.estilo.gastoVagas,
  estados: d.estilo.estados.map((e) => e.id),
});

// Medido no 8bc4b82 (ver o cabeçalho). Mesma ordem do resumo.
const MEDIDO = {
  afty: {
    tabela: [23, 8, 4, 4, 4, 4, 0, ["defesa", "acerto", "dano", "est_velha"], 3, 5, ["estilo_ativo", "estilo_defesa", "estilo_acerto", "estilo_dano", "estilo_est_velha"]],
    recipiente: [23, 6, 3, 3, 3, 5, 0, ["defesa", "dano", "rec"], 3, 4, ["estilo_ativo", "estilo_defesa", "estilo_dano", "estilo_rec"]],
    liberto: [22, 6, 2, 1, 1, 8, 1, ["defesa"], 3, 0, ["estilo_ativo", "estilo_defesa"]],
  },
  player: {
    tabela: [16, 6, 2, 4, 4, 10, 0, ["defesa", "acerto", "dano", "est_velha"], 3, 5, ["estilo_ativo", "estilo_defesa", "estilo_acerto", "estilo_dano", "estilo_est_velha"]],
    recipiente: [16, 4, 1, 3, 3, 11, 0, ["defesa", "dano", "rec"], 3, 4, ["estilo_ativo", "estilo_defesa", "estilo_dano", "estilo_rec"]],
    liberto: [15, 5, 0, 1, 1, 16, 1, ["defesa"], 3, 0, ["estilo_ativo", "estilo_defesa"]],
  },
};

// O Sem Técnica Liberto (`vagasEstilo`) entra registrado, como na medição.
const liberto = AD.normalizarPacote(pacote("sem-tecnica-liberto"));
AD.aplicarAddons([liberto]);

for (const sistema of ["afty", "player"]) {
  const casos = {
    tabela: ficha(sistema, tabelaEEspecial(), { estilo_ativo: true, estilo_defesa: 2, estilo_acerto: 1, estilo_est_velha: 1 }),
    recipiente: ficha(sistema, recipiente(), { estilo_ativo: true, estilo_defesa: 1, estilo_dano: 2, estilo_rec: 1 }),
    liberto: ficha(sistema, [{ id: "defesa", tipo: "tabela" }], {}, {
      core: { nd: 10, origem: { id: "sem-tecnica-liberto:liberto" } }, addons: [liberto], aptidoes: { dom: 3 },
    }),
  };
  for (const [caso, c] of Object.entries(casos)) {
    const antes = copia(c.estilosSombra);
    const d = deriveAfty(c);
    t(`${sistema} ${caso}: os numeros LEGACY de antes da Expansao`, Object.values(resumo(d)), MEDIDO[sistema][caso]);
    t(`${sistema} ${caso}: nada vira Tecnica da Expansao sozinho`, d.estilo.tecnicas.length, 0);
    t(`${sistema} ${caso}: o cru da ficha fica intacto`, c.estilosSombra, antes);
    t(`${sistema} ${caso}: o seletor da Expansao nao aparece`, d.estilo.estados.some((e) => e.id === EST.ESTADO_TECNICA_ATIVA), false);
  }
  /* O rótulo do interruptor voltou a ser "Domínio Simples" (DA-04) também para
     a ficha só com Técnica antiga: é o mesmo interruptor. */
  t(`${sistema}: o rotulo do interruptor LEGACY`, deriveAfty(casos.tabela).estilo.estados[0].label, "Domínio Simples");
  // A variável que o remendo de custo do Estilo Liberado lê continua existindo.
  t(`${sistema}: a variavel estilo_<id> das LEGACY`, EST.estadoDaTecnica("acerto"), "estilo_acerto");
}

/* ============================================================ */
/* A REGRA EXPLÍCITA E AS DUAS LISTAS                            */
/* ============================================================ */
{
  const nova = { ...EST.createBlankTecnicaEstilo(), id: "nova", nome: "Nova", efeitos: [{ uid: "u1", efeitoId: "defesa" }] };
  const mista = ficha("afty", [
    { id: "defesa", tipo: "tabela", regra: CAT.REGRA_LEGACY },
    { id: "dano" },
    nova,
  ], {});
  t("regra: so \"expansao\" conta como Expansao", [
    CAT.regraDaTecnica({}), CAT.regraDaTecnica({ regra: "legacy" }), CAT.regraDaTecnica({ regra: "outra" }), CAT.regraDaTecnica(nova),
  ], ["legacy", "legacy", "legacy", "expansao"]);
  t("estilosDaFicha devolve so as LEGACY", EST.estilosDaFicha(mista).map((x) => x.id), ["defesa", "dano"]);
  t("tecnicasDaFicha devolve so as da Expansao", EST.tecnicasDaFicha(mista).map((x) => x.id), ["nova"]);
  t("tecnicasCruasDaExpansao devolve o objeto gravado", EST.tecnicasCruasDaExpansao(mista)[0] === nova, true);
  const d = deriveAfty(mista);
  t("ficha mista: as LEGACY seguem no contador, a nova nao", [d.estilo.conhecidas.map((x) => x.id), d.estilo.gastos], [["defesa", "dano"], 2]);
  t("ficha mista: a nova na progressao propria", [d.estilo.tecnicas.map((x) => x.id), d.estilo.progressao.usadas, d.estilo.progressao.total], [["nova"], 1, 3]);
}

/* ============================================================ */
/* A CONVERSÃO MANUAL (DA-05)                                    */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const c = ficha(sistema, tabelaEEspecial(), {});
  const legado = EST.estilosDaFicha(c);
  const antes = copia(legado);
  const [defesa, acerto, dano, especial] = legado.map((x) => EST.converterTecnicaLegacy(x));
  t(`${sistema}: converter nao mexe na Tecnica de origem`, legado, antes);

  t(`${sistema}: a de tabela vira Modificacao com aquele efeito`,
    [defesa.regra, defesa.tipo, defesa.nome, defesa.efeitos.map((e) => e.efeitoId)],
    ["expansao", "modificacao", CAT.getEfeitoEstilo("defesa").nome, ["defesa"]]);
  t(`${sistema}: a de tabela guarda o original`, defesa.legado, { id: "defesa", tipo: "tabela" });
  t(`${sistema}: a entrada sem tipo tambem converte`, [dano.efeitos.map((e) => e.efeitoId), dano.legado.id], [["dano"], "dano"]);
  t(`${sistema}: a Especial continua Especial, com as mesmas linhas`,
    [especial.tipo, especial.nome, especial.descricao, especial.especial.linhas],
    ["especial", "Lâmina Nebulosa", "Lâmina de energia", [{ canal: "iniciativa", expr: "2" }]]);
  t(`${sistema}: a Especial guarda o custo antigo no legado`, especial.legado.custoImbuicao, 2);

  /* A troca que o botão faz: a antiga sai da lista e a convertida entra. */
  const trocada = ficha(sistema, [defesa, ...tabelaEEspecial().slice(1)], {});
  const dt = deriveAfty(trocada);
  const tec = dt.estilo.tecnicas[0];
  t(`${sistema}: a convertida e a unica Tecnica da Expansao`, dt.estilo.tecnicas.map((x) => x.id), [defesa.id]);
  t(`${sistema}: a convertida e valida e guarda o legado`, [tec.mecanicamenteValida, tec.legado], [true, { id: "defesa", tipo: "tabela" }]);
  t(`${sistema}: as outras LEGACY seguem como antes`, dt.estilo.conhecidas.map((x) => x.id), ["acerto", "dano", "est_velha"]);
  t(`${sistema}: a LEGACY convertida sai do contador`, dt.estilo.gastos, 3);

  /* A convertida funciona: Domínio no ar e ela imbuída. */
  const bt = dt.maestria;
  const desligada = deriveAfty(ficha(sistema, [defesa], { estilo_ativo: true }));
  const ligada = deriveAfty(ficha(sistema, [defesa], { estilo_ativo: true, estilo_tecnica: defesa.id }));
  t(`${sistema}: a convertida da a Defesa do efeito`, ligada.defesa - desligada.defesa, Math.floor(bt / 2));

  /* O Bônus de Acerto antigo não tinha escolha de ataque: volta pedindo. */
  const da = deriveAfty(ficha(sistema, [acerto], {}));
  t(`${sistema}: o Acerto convertido pede a escolha`,
    [da.estilo.tecnicas[0].mecanicamenteValida, da.estilo.tecnicas[0].validacao.filter((v) => v.nivel === "erro").map((v) => v.codigo)],
    [false, ["escolha"]]);
  /* A Especial convertida passa a pedir a aprovação do Narrador. */
  const de = deriveAfty(ficha(sistema, [especial], {}));
  t(`${sistema}: a Especial convertida avisa e vale`,
    [de.estilo.tecnicas[0].mecanicamenteValida, de.estilo.tecnicas[0].validacao.map((v) => `${v.nivel}:${v.codigo}`).includes("aviso:especial")],
    [true, true]);
}

/* ============================================================ */
/* ADDONS (DA-06)                                                */
/* ============================================================ */
/* O Lime Neds não declara regra: segue LEGACY inteiro, sem agrupar nada. */
{
  const lime = pacote("lime-neds");
  t("Lime Neds: o pacote segue valido", AD.validarPacote(lime), []);
  AD.aplicarAddons([lime]);
  const c = ficha("afty", [], { estilo_ativo: true }, {
    addons: [lime], core: { nd: 10, tipo: "combatente", origem: { id: "sem_tecnica" } },
    aptidoes: { dom: 4, au: 3 }, aptidoesAmaldicoadas: ["dominio_simples", "aura_reforcada", "aura_macica"],
  });
  const d = deriveAfty(c);
  t("Lime Neds: cinco Tecnicas LEGACY de pacote", [d.estilo.conhecidas.length, d.estilo.conhecidas.every((x) => x.deAddon)], [5, true]);
  t("Lime Neds: nenhuma vira Tecnica da Expansao", d.estilo.tecnicas.length, 0);
  t("Lime Neds: o contador LEGACY de sempre", d.estilo.gastos, 5);
  t("Lime Neds: o editor nao copia o pacote", [EST.estilosDaFicha(c).length, EST.tecnicasDaFicha(c).length], [0, 0]);
}

/* O pacote novo que declara a Expansão. */
const pacoteExpansao = (estilos) => ({
  id: "estilo-teste", nome: "Estilo de Teste", versao: "1.0.0", paraRaw: "afty", autor: "Templas",
  libera: ["estiloSombras"],
  estilos,
});
const muralha = {
  id: "muralha", nome: "Muralha", regra: "expansao", tipo: "modificacao", descricao: "Muralha de sombra",
  efeitos: [{ uid: "a", efeitoId: "defesa" }, { uid: "b", efeitoId: "dano" }],
};
const velha = {
  id: "velha", nome: "Velha", descricao: "Técnica de pacote antiga", maxImbuicoes: 1, custoImbuicao: 1,
  efeitos: [{ canal: "iniciativa", expr: "1" }],
};
{
  const p = pacoteExpansao([muralha, velha]);
  t("pacote: a Tecnica da Expansao passa no validador", AD.validarPacote(p), []);
  const erros = (estilo) => AD.validarPacote(pacoteExpansao([{ ...muralha, ...estilo }]));
  t("pacote: efeito fora do catalogo e recusado",
    erros({ efeitos: [{ uid: "a", efeitoId: "voar" }] }), ["Muralha: compra de efeito inválida ou repetida em efeitos."]);
  t("pacote: uid repetido e recusado",
    erros({ efeitos: [{ uid: "a", efeitoId: "defesa" }, { uid: "a", efeitoId: "dano" }] }), ["Muralha: compra de efeito inválida ou repetida em efeitos."]);
  t("pacote: tipo desconhecido e recusado", erros({ tipo: "outro" }), ["Muralha: tipo de Técnica desconhecido."]);
  t("pacote: linha de Especial sem canal e recusada",
    erros({ tipo: "especial", efeitos: [], especial: { texto: "x", linhas: [{ expr: "2" }] } }), ["Muralha: linha inválida no Efeito Especial."]);
  t("pacote: efeitos que nao sao lista sao recusados", erros({ efeitos: "defesa" }), ["Muralha: efeitos precisa ser uma lista."]);

  AD.aplicarAddons([p]);
  for (const sistema of ["afty", "player"]) {
    const c = (combate, aptidoes = { dom: 3 }) => ficha(sistema, [], combate, { addons: [p], aptidoes });
    const d = deriveAfty(c({}));
    const tec = d.estilo.tecnicas[0];
    t(`${sistema} pacote: a Tecnica entra com o id do pacote`, [d.estilo.tecnicas.map((x) => x.id), tec.deAddon, tec.pacote], [["estilo-teste:muralha"], true, "Estilo de Teste"]);
    t(`${sistema} pacote: e vale`, [tec.mecanicamenteValida, tec.usados, tec.limite.total], [true, 2, 3]);
    t(`${sistema} pacote: a sem regra segue LEGACY`, d.estilo.conhecidas.map((x) => x.id), ["estilo-teste:velha"]);
    t(`${sistema} pacote: so a LEGACY gasta o contador`, d.estilo.gastos, 1);
    t(`${sistema} pacote: o editor nao copia o pacote`, [EST.estilosDaFicha(c({})).length, EST.tecnicasDaFicha(c({})).length], [0, 0]);
    t(`${sistema} pacote: o seletor oferece a Tecnica do pacote`,
      d.estilo.estados.find((e) => e.id === EST.ESTADO_TECNICA_ATIVA)?.opcoes, [{ id: "estilo-teste:muralha", label: "Muralha" }]);

    const bt = d.maestria;
    const desligada = deriveAfty(c({ estilo_ativo: true }));
    const ligada = deriveAfty(c({ estilo_ativo: true, estilo_tecnica: "estilo-teste:muralha" }));
    t(`${sistema} pacote: a Defesa da Tecnica do pacote`, ligada.defesa - desligada.defesa, Math.floor(bt / 2));
    t(`${sistema} pacote: a Tecnica ativa e a do pacote`, ligada.estilo.tecnicaAtiva, "estilo-teste:muralha");

    /* Com DOM 1 o limite é 1, e a Técnica de 2 efeitos fica inválida inteira (DA-07). */
    const pobre = deriveAfty(c({ estilo_ativo: true, estilo_tecnica: "estilo-teste:muralha" }, { dom: 1 }));
    const pobreOff = deriveAfty(c({ estilo_ativo: true }, { dom: 1 }));
    t(`${sistema} pacote: acima do limite fica invalida`,
      [pobre.estilo.tecnicas[0].mecanicamenteValida, pobre.estilo.tecnicas[0].validacao.some((v) => v.codigo === "limite")], [false, true]);
    t(`${sistema} pacote: e nao da nada`, [pobre.defesa - pobreOff.defesa, pobre.estilo.tecnicaAtiva], [0, null]);
  }
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
