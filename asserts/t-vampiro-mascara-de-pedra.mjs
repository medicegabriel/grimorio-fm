/* VAMPIRO DA MÁSCARA DE PEDRA (addon, 2026-10-12).

   A origem lida de `addons/vampiro-mascara-de-pedra.json`: Regeneração
   Vampírica com Doses, 17 Características de Anatomia, Fraquezas, Consumir
   Sangue, Patente, Criar Vampiro, Máscara de Pedra, Pedra Aja, Coleta de Sangue
   e 5 Talentos de Origem. Prende os verbos que ela pediu, todos genéricos:
     • `usos.recarga: "manual"` e `usos.rotulo`: o estoque de Doses, que nem o
       Descansar devolve, com "Doses" no lugar de "Usos";
     • `resultados[].textos`: o número vira nome ("Patente: Conde");
     • contador e números de mesa nas Características Amaldiçoadas, e `tem_<id>`
       delas na DSL;
     • `opcao_<id>`: a opção escolhida numa escolha de origem como booleana;
     • `rotuloCaracteristicasAmaldicoadas` na origem, e as fontes das vagas.
   As leituras do autor (2026-10-12): as penalidades de atributo da fome se
   substituem, a Aprimorada dá +10 na cura, só os 5 Talentos do texto, e a
   Pedra Aja tira também a vulnerabilidade a Energia Reversa do Rei. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const TAL = await import(R + "afty-talentos.js");
const EFE = await import(R + "afty-efeitos.js");
const CA = await import(R + "afty-caracteristicas-amaldicoadas.js");
const SES = await import(R + "ficha/ficha-sessao.js");
const FC = await import(R + "ficha/ficha-conteudo.js");
const BUF = await import(R + "ficha/ficha-buffs.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const ler = (n) => JSON.parse(readFileSync(new URL(`../addons/${n}.json`, import.meta.url), "utf8"));
const VMP = ler("vampiro-mascara-de-pedra");
t("o pacote valida", A.validarPacote(VMP), []);
t("autor, sistema-alvo e versão", [VMP.autor, VMP.paraRaw, VMP.versao], ["Templas", "afty", "1.0.0"]);
t("sem travessão no pacote", /\u2014/.test(JSON.stringify(VMP)), false);
const P = A.normalizarPacote(VMP);
t("aplicar não relata problema", A.aplicarAddons([P]).problemas, []);

const PK = "vampiro-mascara-de-pedra";
const id = (x) => `${PK}:${x}`;
const ORIGEM = id("vampiro");
const origem = O.getOrigem(ORIGEM);
t("a origem existe, com o nome", origem?.nome, "Vampiro da Máscara de Pedra");
t("é origem própria", O.origemMae(ORIGEM), ORIGEM);
t("as 12 características, na ordem do texto", origem.caracteristicas.map((c) => c.id), [
  "bonus_atributo", "regeneracao_vampirica", "fisico_amaldicoado", "heranca_maldita", "fraquezas_vampiricas",
  "consumir_sangue", "doses_de_sangue", "patente", "criar_vampiro", "mascara_de_pedra", "pedra_aja", "coleta_de_sangue",
]);
t("3 pontos, no máximo 2 no mesmo", origem.caracteristicas[0].bonus, { distribuir: 3, maxPorAtributo: 2 });
t("não se começa com ela", origem.restricoes.length, 1);
t("o pool se chama Características de Anatomia", O.rotuloCaracteristicasDaOrigem({ core: { origem: { id: ORIGEM } } }),
  "Características de Anatomia");
t("origem do livro não tem rótulo próprio", O.rotuloCaracteristicasDaOrigem({ core: { origem: { id: "feto_amaldicoado_hibrido" } } }), null);
t("as 17 Características de Anatomia", CA.AFTY_CARACTERISTICAS_AMALDICOADAS.filter((c) => c.id.startsWith(`${PK}:`)).length, 17);
t("os requisitos de nível (Carapaça 10, Servo 9, Aprimorada 12)",
  ["va_carapaca_mutante", "va_servo", "va_regeneracao_aprimorada"]
    .map((x) => CA.getCaracteristicaAmaldicoada(id(x)).requisitos.find((r) => r.tipo === "nd")?.valor),
  [10, 9, 12]);
const TALENTOS = ["tal_ruptura_da_carne_imortal", "tal_reposicao_vampirica", "tal_forma_de_morcego", "tal_servos", "tal_fisico_aperfeicoado_vampiro"];
t("os 5 Talentos, no grupo Origem", TALENTOS.map((x) => TAL.getTalento(id(x))?.grupo), Array(5).fill("origem"));
t("o requisito de origem ganha o prefixo", TAL.getTalento(id("tal_servos")).requisitos[0], { tipo: "origem", id: ORIGEM });
t("o Físico Aperfeiçoado do livro segue preso ao Feto",
  TAL.getTalento("tal_fisico_aperfeicoado").requisitos[0], { tipo: "origem", id: "feto_amaldicoado_hibrido" });
t("os contadores de origem do pacote", P.contadoresOrigem.map((c) => [c.id, c.tipo ?? "contador"]),
  [["doses_consumidas", "contador"], ["dias_sem_sangue", "contador"], ["pedra_aja", "bool"]]);

/* ============================================================ */
/* 2. A DSL: `opcao_<id>` E `tem_<característica>`               */
/* ============================================================ */
const ctx = EFE.buildCriaturaDslContext({ opcoesOrigem: { todas: ["vmp_ignora_luz", "vmp_ignora_reflexo"], escolhidas: ["vmp_ignora_reflexo"] } });
t("opção oferecida e não escolhida vale 0", ctx.opcao_vmp_ignora_luz, 0);
t("opção escolhida vale 1", ctx.opcao_vmp_ignora_reflexo, 1);
t("o id com namespace vira variável escrevível",
  EFE.buildCriaturaDslContext({ opcoesOrigem: { todas: [], escolhidas: ["pacote-x:op_y"] } }).opcao_pacote_x_op_y, 1);

/* ============================================================ */
/* 3. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
const soma = (d, canal, alvo = null) =>
  EFE.detalhesDoCanal(d.efeitos, canal, alvo).reduce((s, l) => s + (Number(l.valor) || 0), 0);
const resultado = (d, chave, label) => d.mesa[chave]?.resultados?.find((r) => r.label === label);
const estado = (d, tipo) => (d.defesasDano?.linhas ?? d.defesasDano ?? []).find((l) => l.tipo === tipo)?.estados ?? [];

for (const sistema of ["player", "afty"]) {
  const ficha = ({ nd = 10, cont = {}, escolhas = {}, talentos = [], escolhasTalento = {}, carac = [], alvos = {}, combate, attrs } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd, tipo: "combatente", patamar: "comum", origem: { id: ORIGEM, escolhas } };
    c.especializacoes = [{ id: "lutador", nivel: nd }];
    c.attrMethod = "fixos";
    c.attributes = attrs ?? { forca: 10, destreza: 10, constituicao: 14, inteligencia: 10, sabedoria: 10, presenca: 10 };
    c.addons = [P];
    c.talentos = talentos;
    c.escolhasTalento = escolhasTalento;
    c.caracteristicasAmaldicoadas = carac;
    c.caracteristicasAmaldicoadasAlvos = alvos;
    c.origemContadores = Object.fromEntries(Object.entries(cont).map(([k, v]) => [id(k), v]));
    if (combate) c.combate = combate;
    return c;
  };
  const tag = (s) => `${sistema}: ${s}`;
  const base = deriveAfty(ficha());
  const bt = base.maestria;

  // Físico Amaldiçoado e as vagas
  t(tag("Físico Amaldiçoado: 1 + 1 a cada 5 níveis"), base.caracteristicasAmaldicoadas.vagas, 3);
  t(tag("as vagas mostram de onde vêm"), base.caracteristicasAmaldicoadas.partes, [{ label: "Físico Amaldiçoado", valor: 3 }]);
  t(tag("o rótulo do pool chega ao derivado"), base.caracteristicasAmaldicoadas.rotulo, "Características de Anatomia");
  t(tag("o catálogo do pacote está na aba"), base.caracteristicasAmaldicoadas.catalogo.length, 17);

  // Regeneração Vampírica
  t(tag("Regeneração: 17 + mod. Con + 5 nos níveis 4 e 8"), resultado(base, "origem:regeneracao_vampirica", "Cura por Dose")?.valor, 17 + 2 + 10);
  t(tag("Doses Extras: metade do BT"), resultado(base, "origem:regeneracao_vampirica", "Doses Extras")?.valor, Math.floor(bt / 2));

  // O estoque de Doses
  const doses = base.mesa["origem:doses_de_sangue"]?.usos;
  t(tag("o estoque: 4 Doses, recarga manual, rótulo Doses"), [doses?.max, doses?.recarga, doses?.rotulo, doses?.chave],
    [4, "manual", "Doses", "manual:origem:doses_de_sangue"]);

  // Patente
  const patente = (cont, escolhas = {}) => deriveAfty(ficha({ cont, escolhas }));
  const nomeDa = (d) => resultado(d, "origem:patente", "Patente")?.texto;
  const vul = (d) => [soma(d, "vulnerabilidadeDano", "radiante"), soma(d, "vulnerabilidadeDano", "energia_reversa")];
  t(tag("Novato: sem bônus, vulnerável ao radiante"),
    [nomeDa(base), base.caracteristicasAmaldicoadas.vagas, vul(base)], ["Vampiro Novato", 3, [1, 0]]);
  t(tag("a Vulnerabilidade à Luz chega à tabela de defesas"), estado(base, "radiante").includes("vulneravel"), true);
  const inter = patente({ doses_consumidas: 40 });
  t(tag("Intermediário (40): +1 Anatomia e o mod. de Con em Doses"),
    [nomeDa(inter), inter.caracteristicasAmaldicoadas.vagas, inter.mesa["origem:doses_de_sangue"].usos.max],
    ["Vampiro Intermediário", 4, 6]);
  t(tag("a Patente aparece nas fontes das vagas"),
    inter.caracteristicasAmaldicoadas.partes.map((p) => p.label), ["Físico Amaldiçoado", "Patente: Vampiro Intermediário"]);
  t(tag("Experiente ignora a Luz escolhida"),
    vul(patente({ doses_consumidas: 100 }, { vmp_fraqueza_ignorada: ["vmp_ignora_luz"] })), [0, 0]);
  t(tag("antes do Experiente a escolha não vale"),
    vul(patente({ doses_consumidas: 99 }, { vmp_fraqueza_ignorada: ["vmp_ignora_luz"] })), [1, 0]);
  t(tag("ignorar outra Fraqueza não tira a Luz"),
    vul(patente({ doses_consumidas: 150 }, { vmp_fraqueza_ignorada: ["vmp_ignora_reflexo"] })), [1, 0]);
  const conde = patente({ doses_consumidas: 200 });
  t(tag("Conde (200): mais 1 Anatomia"), [nomeDa(conde), conde.caracteristicasAmaldicoadas.vagas], ["Conde", 5]);
  const rei = patente({ doses_consumidas: 500 });
  t(tag("Rei (500): mais 1 Anatomia e vulnerável a E.R."), [nomeDa(rei), rei.caracteristicasAmaldicoadas.vagas, vul(rei)], ["Rei", 6, [1, 1]]);
  t(tag("Pedra Aja tira as duas vulnerabilidades"), vul(patente({ doses_consumidas: 500, pedra_aja: 1 })), [0, 0]);
  t(tag("Pedra Aja sem ser Rei também tira a Luz"), vul(patente({ pedra_aja: 1 })), [0, 0]);

  // Consumir Sangue
  const fome = (dias) => deriveAfty(ficha({ cont: { dias_sem_sangue: dias } }));
  const penal = (d) => [soma(d, "atributo", "forca"), soma(d, "atributo", "destreza"), soma(d, "atributo", "constituicao"),
    soma(d, "bonusPericia"), soma(d, "bonusTR"), soma(d, "bonusAcerto"), soma(d, "iniciativa")];
  const sanidade = (d) => resultado(d, "origem:consumir_sangue", "Sanidade")?.texto;
  const cura = (d) => resultado(d, "origem:regeneracao_vampirica", "Cura por Dose")?.valor;
  t(tag("alimentado (1 no 1d4): nada"), [penal(fome(1)), sanidade(fome(1)), cura(fome(1)) > 0], [[0, 0, 0, 0, 0, 0, 0], "100%", true]);
  t(tag("2-3 dias: -1 nos físicos, 90%, sem Regeneração"), [penal(fome(3)), sanidade(fome(3)), cura(fome(3))], [[-1, -1, -1, 0, 0, 0, 0], "90%", 0]);
  t(tag("4-6 dias: -2"), [penal(fome(5)).slice(0, 3), sanidade(fome(5))], [[-2, -2, -2], "75%"]);
  t(tag("7-9 dias: -3, sem somar com as faixas de antes"), [penal(fome(9)).slice(0, 3), sanidade(fome(9))], [[-3, -3, -3], "50%"]);
  t(tag("10-11 dias: o -3 continua e -4 em todas as rolagens"), [penal(fome(10)), sanidade(fome(10))], [[-3, -3, -3, -4, -4, -4, -4], "25%"]);
  t(tag("12-13 dias: igual, 10%"), [penal(fome(13)), sanidade(fome(13))], [[-3, -3, -3, -4, -4, -4, -4], "10%"]);
  t(tag("14+: o frenesi remove os debuffs"), [penal(fome(14)), sanidade(fome(14))], [[0, 0, 0, 0, 0, 0, 0], "0%"]);
  t(tag("a penalidade de fome é temporária"),
    EFE.detalhesDoCanal(fome(3).efeitos, "atributo", "forca").map((l) => l.duracao), ["temporaria"]);
  t(tag("CD do teste de Vontade: 16 + nível"), resultado(base, "origem:consumir_sangue", "CD de Vontade")?.valor, 26);

  // Criar Vampiro e Coleta de Sangue
  t(tag("Criar Vampiro: CD 15 + nível + BT"), resultado(base, "origem:criar_vampiro", "CD da Transformação")?.valor, 25 + bt);
  t(tag("Coleta de Sangue: 1 + BT testes"), resultado(base, "origem:coleta_de_sangue", "Testes")?.valor, 1 + bt);

  // Talentos e a Aprimorada
  const T = (x) => id(x);
  const forte = deriveAfty(ficha({
    nd: 12,
    attrs: { forca: 20, destreza: 10, constituicao: 20, inteligencia: 10, sabedoria: 10, presenca: 10 },
    talentos: [T("tal_reposicao_vampirica"), T("tal_ruptura_da_carne_imortal"), T("tal_servos"), T("tal_fisico_aperfeicoado_vampiro")],
    escolhasTalento: {
      [T("tal_ruptura_da_carne_imortal")]: ["vmp_ruptura_forca", "vmp_ruptura_constituicao"],
      [T("tal_fisico_aperfeicoado_vampiro")]: ["vmp_fisico_empurrao"],
    },
    carac: [T("va_regeneracao_aprimorada"), T("va_alma_maldita"), T("va_bracos_extras")],
  }));
  const btF = forte.maestria;
  t(tag("os 4 Talentos valem"), forte.talentos.escolhidas.length, 4);
  t(tag("Ruptura: +2 no valor e no limite, passando de 20"), [forte.attrEff.forca, forte.attrEff.constituicao], [22, 22]);
  t(tag("Regeneração com Reposição e Aprimorada: +10 e +10"),
    resultado(forte, "origem:regeneracao_vampirica", "Cura por Dose")?.valor, 17 + 6 + 15 + 10 + 10);
  t(tag("Reposição: +2 Doses no limite"), resultado(forte, "origem:regeneracao_vampirica", "Doses Extras")?.valor, Math.floor(btF / 2) + 2);
  t(tag("Servos: uma Invocação a cada três níveis"), resultado(forte, `talento:${T("tal_servos")}`, "Invocações")?.valor, 4);
  t(tag("Físico Aperfeiçoado: Empurrão +3 m"), soma(forte, "distanciaEmpurrao"), 3);
  const ca = (x) => forte.mesa[`caracteristicaAmaldicoada:${T(x)}`];
  t(tag("Aprimorada: metade do BT em usos"), ca("va_regeneracao_aprimorada")?.usos?.max, Math.floor(btF / 2));
  t(tag("Alma Maldita: 4 usos no 12, e metade do dano"),
    [ca("va_alma_maldita")?.usos?.max, ca("va_alma_maldita")?.resultados?.[0]?.texto], [4, "Metade"]);
  t(tag("Braços Extras: uma vez por cena, com a chave da cena"), ca("va_bracos_extras")?.usos?.chave,
    `cena:caracteristicaAmaldicoada:${T("va_bracos_extras")}`);

  // Forma de Morcego
  const morcegoFicha = (ligado) => ficha({ nd: 12, talentos: [T("tal_forma_de_morcego")], combate: { ativo: true, [T("forma_de_morcego")]: ligado } });
  const off = deriveAfty(morcegoFicha(false));
  const on = deriveAfty(morcegoFicha(true));
  t(tag("Forma de Morcego: o interruptor aparece com o Talento"),
    BUF.linhasDeEstado(off).some((e) => e.id === T("forma_de_morcego")), true);
  t(tag("desligada: anda e é Médio"), [off.voo, off.tamanho], [0, "medio"]);
  t(tag("ligada: voa 9 m e é Minúsculo"), [on.voo, on.tamanho], [9, "minusculo"]);
  t(tag("usos: metade do BT por dia"), on.mesa[`talento:${T("tal_forma_de_morcego")}`]?.usos?.max, Math.floor(on.maestria / 2));
  t(tag("sem o Talento não há interruptor"),
    BUF.linhasDeEstado(deriveAfty(ficha({ combate: { ativo: true } }))).some((e) => e.id === T("forma_de_morcego")), false);

  // A Ficha: contador e números das Características, e o nome do resultado
  const itens = FC.conteudoDaFicha(ficha({ nd: 12, carac: [T("va_alma_maldita")] }),
    deriveAfty(ficha({ nd: 12, carac: [T("va_alma_maldita")] })));
  const lista = Array.isArray(itens) ? itens : itens.itens;
  const alma = lista.find((i) => i.chave === `caracteristicaAmaldicoada:${T("va_alma_maldita")}`);
  t(tag("a linha da Característica traz o contador e o número"), [alma?.usos?.max, alma?.numeros], [4, ["Dano na Alma: Metade"]]);
  const pat = lista.find((i) => i.chave === "origem:patente");
  t(tag("o resultado com textos aparece pelo nome"), pat?.numeros, ["Patente: Vampiro Novato", "Doses Consumidas: 0"]);
  const comFraqueza = { cont: { doses_consumidas: 120 }, escolhas: { vmp_fraqueza_ignorada: ["vmp_ignora_luz"] } };
  const linhaPatente = FC.conteudoDaFicha(ficha(comFraqueza), deriveAfty(ficha(comFraqueza)))
    .find?.((i) => i.chave === "origem:patente");
  t(tag("a Fraqueza escolhida aparece na linha da Patente (mapa pela escolha)"),
    linhaPatente?.opcoes?.map((o) => o.nome), ["Vulnerabilidade à Luz"]);
  const est = lista.find((i) => i.chave === "origem:doses_de_sangue");
  t(tag("a linha das Doses traz o contador com o rótulo"), [est?.usos?.rotulo, est?.usos?.max], ["Doses", 4]);
}

/* ============================================================ */
/* 4. A SESSÃO: O ESTOQUE `manual` SOBREVIVE AO DESCANSO         */
/* ============================================================ */
{
  const c = createBlankAfty();
  c.rulesVersion = "player";
  c.core = { ...c.core, nd: 5, origem: { id: ORIGEM } };
  c.addons = [P];
  const d = deriveAfty(c);
  const doses = d.mesa["origem:doses_de_sangue"].usos;
  let s = SES.sessaoEmBranco(d);
  s = SES.marcaUso(s, doses, 3);
  s = SES.marcaUso(s, { max: 2, chave: "hab:qualquer" }, 1);
  s = SES.marcaUso(s, { max: 1, chave: "cena:origem:x" }, 1);
  t("gastar 3 Doses deixa 1", doses.max - SES.usosGastosDe(s, doses.chave), 1);
  const depois = SES.descansar(s, d);
  t("o descanso NÃO devolve as Doses", SES.usosGastosDe(depois, doses.chave), 3);
  t("e devolve os outros contadores", [SES.usosGastosDe(depois, "hab:qualquer"), SES.usosGastosDe(depois, "cena:origem:x")], [0, 0]);
  t("o mais anota a Dose bebida", SES.usosGastosDe(SES.marcaUso(depois, doses, -2), doses.chave), 1);
  t("a recarga manual é aceita pelo catálogo", (await import(R + "afty-habilidades.js")).USOS_RECARGAS.includes("manual"), true);
}

/* ============================================================ */
/* 5. QUEM NÃO TEM O PACOTE NÃO MUDA                             */
/* ============================================================ */
{
  A.aplicarAddons([A.normalizarPacote(ler("maldicao-era-de-ouro"))]);
  const c = createBlankAfty();
  c.rulesVersion = "afty";
  c.core = { ...c.core, nd: 10, origem: { id: "maldicao-era-de-ouro:maldicao_era_de_ouro" } };
  c.addons = [A.normalizarPacote(ler("maldicao-era-de-ouro"))];
  const d = deriveAfty(c);
  t("a Maldição Era de Ouro segue sem rótulo próprio", d.caracteristicasAmaldicoadas.rotulo, null);
  t("e com a fonte das vagas dela", d.caracteristicasAmaldicoadas.partes, [{ label: "Anatomia Amaldiçoada", valor: 3 }]);
}

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
