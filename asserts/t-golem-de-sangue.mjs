/* GOLEM DE SANGUE (addon, 2026-10-15).

   A origem da Briar, lida de `addons/golem-de-sangue.json`: Bônus de Origem,
   Corpo Morto, Físico Amaldiçoado, Incompatibilidade com a Feitiçaria e
   Artificial, os 3 Talentos de Origem, o Hemólito de Sangue e o Voto automático
   Restrição Congênita: Prisão da Besta. Decisões do autor:
     • o Frenesi Sanguinário (da Maldição Carmesim, que o app não tem) é só um
       interruptor de combate: ativa o Hemólito e solta as amarras;
     • a Prisão da Besta é Voto automático, como a Restrição Celestial;
     • o Corpo Morto fica em texto (o Descansar segue enchendo o PV);
     • as 5 Aptidões Especiais de Maldição entram no lugar da Energia Reversa.
   Nenhum verbo novo: o pacote usa só o que o motor já sabia dizer. */
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
const V = await import(R + "afty-votos.js");
const FEI = await import(R + "afty-feiticos.js");
const SES = await import(R + "ficha/ficha-sessao.js");
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
const GOLEM = JSON.parse(readFileSync(new URL("../addons/golem-de-sangue.json", import.meta.url), "utf8"));
t("o pacote valida", A.validarPacote(GOLEM), []);
t("autor, sistema-alvo e versão", [GOLEM.autor, GOLEM.paraRaw, GOLEM.versao], ["Templas", "afty", "1.1.0"]);
t("sem travessão no pacote", /\u2014/.test(JSON.stringify(GOLEM)), false);
const P = A.normalizarPacote(GOLEM);
t("aplicar não relata problema", A.aplicarAddons([P]).problemas, []);

const PK = "golem-de-sangue";
const id = (x) => `${PK}:${x}`;
const ORIGEM = id("golem_de_sangue");
const HEMOLITO = id("hemolito_de_sangue");
const origem = O.getOrigem(ORIGEM);
t("a origem, com as 6 características", [origem?.nome, origem?.caracteristicas.map((c) => c.id)],
  ["Golem de Sangue", ["bonus_de_origem", "corpo_morto", "fisico_amaldicoado", "incompatibilidade_feiticaria", "frenesi_incontrolavel", "artificial"]]);
t("3 pontos só nos atributos físicos", origem.caracteristicas[0].bonus,
  { distribuir: 3, maxPorAtributo: 3, entre: ["forca", "destreza", "constituicao"] });
t("o requisito da Maldição Carmesim fica em restrição", origem.restricoes.length, 1);
t("os 3 Talentos, no grupo Origem, presos à origem",
  ["tal_bebada_de_sangue", "tal_valorizar_alimento", "tal_preciosas_amarras"]
    .map((x) => [TAL.getTalento(id(x))?.grupo, TAL.getTalento(id(x))?.requisitos?.[0]?.id]),
  Array(3).fill(["origem", ORIGEM]));

/* ============================================================ */
/* 2. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
const soma = (d, canal, alvo = null) =>
  EFE.detalhesDoCanal(d.efeitos, canal, alvo).reduce((s, l) => s + (Number(l.valor) || 0), 0);
const parte = (d, stat, label) => (d.partes?.[stat] ?? []).find((p) => p.label.includes(label))?.valor ?? 0;
const ESTADO = (x) => id(x);
const { valorContadorSessao: valorC } = await import(R + "afty-recursos-addon.js");

for (const sistema of ["player", "afty"]) {
  const tag = (s) => `${sistema}: ${s}`;
  /* O Frenesi Sanguinário é um Feitiço de Transformação Duradouro da ficha,
     ligado ao vínculo "frenesi" do pacote (1.1.0). */
  const FRENESI_ID = "feit_frenesi";
  const frenesiFeitico = (extra = {}) => ({
    ...FEI.createBlankFeitico(), id: FRENESI_ID, nome: "Frenesi Sanguinário",
    tipo: "especial", especialSubtipo: "transformacao", nivel: 3, transfDuracao: "duradoura", transfAcao: "comum", ...extra,
  });
  const ficha = ({ nd = 10, escolhas = {}, talentos = [], combate, vinculado = true, feitico = frenesiFeitico() } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd, tipo: "combatente", patamar: "comum", origem: { id: ORIGEM, escolhas } };
    c.especializacoes = [{ id: "lutador", nivel: nd }];
    c.attrMethod = "fixos";
    c.attributes = { forca: 14, destreza: 16, constituicao: 14, inteligencia: 8, sabedoria: 10, presenca: 10 };
    c.addons = [P];
    c.talentos = talentos;
    c.equipamentos = { itens: [{ uid: "h1", tipo: "arma", refId: HEMOLITO, qtd: 1, equipado: true }] };
    c.feiticos = feitico ? [feitico] : [];
    if (vinculado) c.feiticosVinculados = { [id("frenesi")]: FRENESI_ID };
    if (combate) c.combate = combate;
    return c;
  };
  // O Frenesi no ar: o interruptor por Feitiço da Transformação Duradoura.
  const frenesi = (extra = {}) => ({ ativo: true, [`feiticoLigado_${FRENESI_ID}`]: true, ...extra });
  const hemolito = (d) => d.dano.entradas.find((e) => e.id === HEMOLITO);

  // Físico Amaldiçoado
  t(tag("nível 4: só as Armas Naturais"), deriveAfty(ficha({ nd: 4 })).aptidoesConcedidasOrigem, ["mal_armas_naturais"]);
  const d10 = deriveAfty(ficha());
  t(tag("nível 5 em diante: as Aprimoradas também"), d10.aptidoesConcedidasOrigem, ["mal_armas_naturais", "mal_armas_naturais_aprimoradas"]);
  t(tag("+1 PV por nível só do 5 em diante"),
    [parte(deriveAfty(ficha({ nd: 4 })), "hp", "Físico Amaldiçoado"), parte(d10, "hp", "Físico Amaldiçoado")], [0, 10]);
  t(tag("Instinto Sanguinário só no 10: BT na Iniciativa"),
    [soma(deriveAfty(ficha({ nd: 9 })), "iniciativa"), soma(d10, "iniciativa")], [0, d10.maestria]);
  t(tag("e na Atenção em combate"), soma(deriveAfty(ficha({ combate: { ativo: true } })), "atencao"), d10.maestria);
  t(tag("Anatomia Incompreensível pelo nome"),
    [d10.mesa["origem:fisico_amaldicoado"].resultados[0].texto, deriveAfty(ficha({ nd: 15 })).mesa["origem:fisico_amaldicoado"].resultados[0].texto],
    ["1 em 1d4", "1 ou 2 em 1d4"]);
  const d15 = deriveAfty(ficha({ nd: 15, escolhas: {
    golem_desenvolvimento_fisico: ["golem_desenvolvimento_destreza"], golem_carapaca_mutante: ["golem_carapaca_ct"],
  } }));
  t(tag("nível 15: Desenvolvimento Físico (+3 no 15, passando o limite) e Carapaça Mutante"),
    [soma(d15, "atributo", "destreza"), soma(d15, "limiteAtributo", "destreza"), soma(d15, "resistenciaDano", "ct")], [3, 3, 1]);

  // Incompatibilidade com a Feitiçaria
  t(tag("sem a trilha de Energia Reversa"), d10.trilhasAptidao.map((x) => x.key), ["au", "cl", "bar", "dom"]);

  // Prisão da Besta
  t(tag("o Voto automático está na ficha"),
    V.votosDaFicha(ficha()).mecanicos.map((x) => x.nome), ["Restriçao Congenita: Prisao da Besta"]);
  t(tag("+6 PV e -2 PE por nível"),
    [parte(d10, "hp", "Prisao da Besta"), parte(d10, "pe", "Prisao da Besta")], [60, -20]);
  t(tag("amarrada: -2 nas perícias físicas"),
    ["forca", "destreza", "constituicao"].map((a) => soma(d10, "bonusPericia", `atr:${a}`)), [-2, -2, -2]);
  const df = deriveAfty(ficha({ combate: frenesi() }));
  t(tag("no Frenesi as amarras soltam"),
    ["forca", "destreza", "constituicao"].map((a) => soma(df, "bonusPericia", `atr:${a}`)), [0, 0, 0]);

  // Hemólito de Sangue
  t(tag("fora do Frenesi o Hemólito é só o dado desarmado"), hemolito(d10).niveisDano, 0);
  const modDes = Math.floor((16 - 10) / 2);
  t(tag("no Frenesi: +6 níveis e +1 a cada 2 de mod. de Destreza"), hemolito(df).niveisDano, 6 + Math.floor(modDes / 2));
  t(tag("Cortante, Duas Mãos, Dupla e Fineza"),
    [hemolito(df).tipoDano, hemolito(df).propriedades.map((p) => p.id)], ["ct", ["duas_maos", "dupla", "fineza"]]);
  t(tag("crítico 20, e 19 contra quem sangra no Frenesi"),
    [hemolito(df).margemCritico, hemolito(deriveAfty(ficha({ combate: frenesi({ [ESTADO("alvo_sangrando")]: true }) }))).margemCritico,
      hemolito(deriveAfty(ficha({ combate: { ativo: true, [ESTADO("alvo_sangrando")]: true } }))).margemCritico],
    [20, 19, 20]);

  // Talentos
  const comPreciosas = deriveAfty(ficha({ talentos: [id("tal_preciosas_amarras")], combate: frenesi() }));
  t(tag("Preciosas Amarras: +1 passo no Hemólito"), hemolito(comPreciosas).niveisDano, hemolito(df).niveisDano + 1);
  const bebada = (ligado) => deriveAfty(ficha({ talentos: [id("tal_bebada_de_sangue")], combate: { ativo: true, [ESTADO("alvo_sangue_absorvido")]: ligado } }));
  const doTalento = (d, canal) => EFE.detalhesDoCanal(d.efeitos, canal)
    .filter((l) => l.nome === "Bêbada de Sangue").reduce((s, l) => s + (Number(l.valor) || 0), 0);
  t(tag("Bêbada de Sangue: +2 no acerto e no dano contra o alvo"),
    [doTalento(bebada(true), "bonusAcerto"), doTalento(bebada(true), "danoBonus"), doTalento(bebada(false), "bonusAcerto")], [2, 2, 0]);
  t(tag("o interruptor do alvo só aparece com o Talento"),
    [BUF.linhasDeEstado(bebada(false)).some((e) => e.id === ESTADO("alvo_sangue_absorvido")),
      BUF.linhasDeEstado(d10).some((e) => e.id === ESTADO("alvo_sangue_absorvido"))], [true, false]);
  t(tag("o Frenesi não é mais interruptor do pacote"), BUF.linhasDeEstado(d10).some((e) => e.id === ESTADO("frenesi_sanguinario")), false);
  t(tag("o interruptor do Frenesi é o da própria Transformação"),
    BUF.linhasDeEstado(deriveAfty(ficha({ combate: { ativo: true } }))).some((e) => e.id === `feiticoLigado_${FRENESI_ID}`), true);

  // O vínculo do Frenesi (1.1.0)
  const vinc = d10.feiticosVinculados.find((x) => x.id === id("frenesi"));
  t(tag("o vínculo aponta o Feitiço da ficha"), [vinc?.label, vinc?.tipo, vinc?.feiticoId], ["Feitiço do Frenesi", "transformacao", FRENESI_ID]);
  t(tag("sem vínculo o Frenesi no ar não solta as amarras"),
    soma(deriveAfty(ficha({ vinculado: false, combate: frenesi() })), "bonusPericia", "atr:forca"), -2);
  t(tag("vínculo com um Feitiço que não é Transformação fica vazio"),
    deriveAfty(ficha({ feitico: frenesiFeitico({ tipo: "dano", especialSubtipo: null }) })).feiticosVinculados[0].feiticoId, null);

  // O Voto: +1 nível nos efeitos do Frenesi (acima do acesso) e +BT/2 rodadas
  const bonus = d10.bonusFeitico?.[FRENESI_ID];
  t(tag("o Voto dá +1 nível e BT/2 rodadas ao Feitiço vinculado"), [bonus?.nivel, bonus?.rodadas], [1, Math.floor(d10.maestria / 2)]);
  const ctxF = { nd: 10, bonusFeitico: d10.bonusFeitico };
  const comBonus = FEI.calcularFeitico(frenesiFeitico(), ctxF);
  const semBonus = FEI.calcularFeitico(frenesiFeitico(), { nd: 10 });
  t(tag("acesso 3 no nível 10, e o Frenesi de nível 3 sai com os efeitos do nível 4"),
    [FEI.nivelMaxFeitico(10), comBonus.nivelEfeitos, comBonus.slots, semBonus.slots], [3, 4, [2, 2, 2, 2], [2, 1, 1, 1]]);
  t(tag("o nível acima do acesso não gera aviso"), comBonus.avisos, []);
  t(tag("rodadas: as do nível 3 mais BT/2, e a Exaustão do nível 3"),
    [comBonus.duracaoRodadas, comBonus.exaustaoFim, semBonus.duracaoRodadas, semBonus.exaustaoFim],
    [2 + Math.floor(d10.maestria / 2), 1, 2, 1]);
  t(tag("e o custo segue o do nível 3"), comBonus.custoPE, semBonus.custoPE);
  t(tag("o hover do bônus diz de onde veio"),
    comBonus.partesBonus.map((p) => p.campo), ["nivel", "rodadas"]);
  const linhaFrenesi = d10.feiticos.lista.find((x) => x.id === FRENESI_ID);
  const prop = (pid) => linhaFrenesi?.propriedades.find((p) => p.id === pid)?.valor ?? null;
  t(tag("a linha da Ficha mostra o nível dos efeitos e as rodadas extras, com a fonte"),
    [prop("nivelEfeitos")?.startsWith("Nível 4 ("), prop("rodadasExtras")?.startsWith(`+${Math.floor(d10.maestria / 2)} (`)],
    [true, true]);
  t(tag("sem o vínculo a linha não mostra bônus"),
    deriveAfty(ficha({ vinculado: false })).feiticos.lista.find((x) => x.id === FRENESI_ID)
      .propriedades.some((p) => p.id === "nivelEfeitos" || p.id === "rodadasExtras"), false);

  // A Maldição Carmesim: o PE Máximo vira PV, 3 por PE
  t(tag("o PE Máximo zera"), d10.pe, 0);
  const convertido = parte(d10, "hp", "energia convertida");
  t(tag("e cada PE vira 3 PV, com a fonte no hover"),
    [convertido > 0, convertido === 3 * -parte(d10, "pe", "convertido em Vida")], [true, true]);
  t(tag("o Funcionamento Básico do pacote"), P.funcionamentos.map((x) => x.nome), ["Maldição Carmesim"]);
  t(tag("sem o pacote o PE fica"), deriveAfty({ ...ficha(), addons: [] }).pe > 0, true);

  // Os contadores de sessão
  t(tag("os três contadores, com as ações"),
    d10.contadoresSessao.map((c) => [c.local, c.acoes.map((a) => a.id)]),
    [["pontos_de_sangue", ["sangrar"]], ["sangue_guardado", ["recuperar", "converter"]], ["fome", ["pv_inicial"]]]);
  const C = (local) => d10.contadoresSessao.find((c) => c.local === local);
  const A = (local, acao) => C(local).acoes.find((a) => a.id === acao);
  let ses = { ...SES.sessaoEmBranco(d10), hpAtual: d10.hp };
  t(tag("Pontos de Sangue e Sangue Guardado começam em 0, a Fome em 1"),
    ["pontos_de_sangue", "sangue_guardado", "fome"].map((l) => valorC(ses, C(l))), [0, 0, 1]);
  ses = SES.aplicaAcaoContador(ses, d10.contadoresSessao, C("pontos_de_sangue"), A("pontos_de_sangue", "sangrar"), d10.hp);
  t(tag("Sangrar: 5 PV viram 1 Ponto de Sangue"), [ses.hpAtual, valorC(ses, C("pontos_de_sangue"))], [d10.hp - 5, 1]);
  ses = SES.defineContadorSessao(ses, C("sangue_guardado"), 12);
  ses = SES.aplicaAcaoContador(ses, d10.contadoresSessao, C("sangue_guardado"), A("sangue_guardado", "converter"), d10.hp);
  t(tag("5 do sangue guardado viram 1 Ponto de Sangue"), [valorC(ses, C("sangue_guardado")), valorC(ses, C("pontos_de_sangue"))], [7, 2]);
  ses = SES.aplicaAcaoContador(ses, d10.contadoresSessao, C("sangue_guardado"), A("sangue_guardado", "recuperar"), d10.hp);
  t(tag("Recuperar cura o total guardado e zera"), [ses.hpAtual, valorC(ses, C("sangue_guardado"))], [d10.hp, 0]);
  t(tag("sem sangue guardado não há o que recuperar"),
    SES.bloqueioAcaoContador(ses, d10.contadoresSessao, C("sangue_guardado"), A("sangue_guardado", "recuperar")), "Nada a Recuperar");
  t(tag("a conversão pede 5 de sangue guardado"),
    SES.bloqueioAcaoContador(ses, d10.contadoresSessao, C("sangue_guardado"), A("sangue_guardado", "converter")), "Sangue Guardado Insuficiente");
  const fome = (n) => SES.aplicaAcaoContador(SES.defineContadorSessao(ses, C("fome"), n), d10.contadoresSessao, C("fome"), A("fome", "pv_inicial"), d10.hp).hpAtual;
  t(tag("a Fome escreve o PV inicial: 100, 75, 50 e 25%"),
    [1, 2, 3, 4].map(fome), [d10.hp, Math.floor(d10.hp * 0.75), Math.floor(d10.hp * 0.5), Math.floor(d10.hp * 0.25)]);
  t(tag("a Fome fica entre 1 e 4"),
    [valorC(SES.defineContadorSessao(ses, C("fome"), 9), C("fome")), valorC(SES.defineContadorSessao(ses, C("fome"), 0), C("fome"))], [4, 1]);
  const descansou = SES.descansar(SES.defineContadorSessao(ses, C("fome"), 3), d10);
  t(tag("o descanso zera os Pontos de Sangue e o Sangue Guardado, e a Fome fica"),
    ["pontos_de_sangue", "sangue_guardado", "fome"].map((l) => valorC(descansou, C(l))), [0, 0, 3]);
  t(tag("Frenesi Incontrolável: CD de Vontade 10 + metade do nível"),
    d10.mesa["origem:frenesi_incontrolavel"].resultados[0].valor, 15);
  const valorizar = deriveAfty(ficha({ talentos: [id("tal_valorizar_alimento")] }));
  t(tag("Valorizar Alimento: BT usos"), valorizar.mesa[`talento:${id("tal_valorizar_alimento")}`]?.usos?.max, valorizar.maestria);
}

/* ============================================================ */
/* 3. OS VERBOS NOVOS, SEM O PACOTE                              */
/* ============================================================ */
const pacoteX = (extra) => ({ id: "x", nome: "X", versao: "1.0.0", paraRaw: "afty", ...extra });
t("validador recusa ação que cita contador inexistente",
  A.validarPacote(pacoteX({ contadoresSessao: [{ id: "a", label: "A", acoes: [{ id: "b", label: "B", outros: { fantasma: 1 } }] }] }))
    .some((p) => p.includes("contador inexistente")), true);
t("validador recusa vínculo de tipo desconhecido",
  A.validarPacote(pacoteX({ feiticosVinculados: [{ id: "a", label: "A", tipo: "bomba" }] })).some((p) => p.includes("tipo inválido")), true);
t("validador recusa energiaEmVida que não é número",
  A.validarPacote(pacoteX({ regrasAfty: { energiaEmVida: "tres" } })).some((p) => p.includes("energiaEmVida")), true);

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
