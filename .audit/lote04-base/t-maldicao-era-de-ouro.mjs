/* MALDIÇÃO - ERA DE OURO v2 (2026-09-22): virou ORIGEM PRÓPRIA que se divide em
   Tipo, como o Herdado se divide em Clã. A v1 (7 Talentos soltos) tinha um
   problema real: o jogador tinha de ACHAR os Talentos numa lista de dezenas,
   sem nenhum seletor dedicado, e o autor pediu para mover tudo para a aba de
   escolher Origem.

   ⚠ POR QUE UMA ORIGEM NOVA, E NÃO A `maldicao` DO RAW REMENDADA: assim ela
   tem nome e Tipos próprios e some do seletor de quem não instala o Addon.
   `variacaoDe: "maldicao"` (mais `VARIACOES_ACEITAS` em afty-origens.js) faz
   `origemMae()` resolver para "maldicao" em toda pergunta estrutural, e é
   assim que as 18 Aptidões de Maldição do raw (`APTIDAO_CATEGORIAS`, categoria
   travada em `origemId: "maldicao"`) e qualquer Talento com
   `requisitos: [{tipo:"origem", id:"maldicao"}]` continuam alcançáveis.

   ⚠ O MURO NOVO, e como este addon o resolve: `getCla()` só conhecia
   `CLAS_HERDADO`. Uma origem de Addon que se divide declara os Tipos em DOIS
   lugares (`acrescenta.origens[].clas`, que a TELA lê para desenhar os
   botões, e `acrescenta.clas`, que entra em `CLAS_HERDADO` de verdade e é o
   que `getCla()` acha primeiro) com o MESMO id nos dois, e `afty-origens.js`
   ganhou `caminhosDeId: ["clas[].id"]` na família `origens` para o id nested
   ganhar o mesmo prefixo do pacote que o id do topo ganha, e os dois baterem.
   `getCla()` também ganhou uma segunda busca (varrer `origem.clas` de
   qualquer origem) como rede de segurança.

   v2.1 (2026-09-23), três blocos novos no fim do arquivo:
   • 6. ACESSO ÀS APTIDÕES DE MALDIÇÃO E SEM ENERGIA REVERSA. Prende as duas
     metades da regra da Maldição que a origem nova herda da mãe. ⚠ Fica
     VERMELHO contra o motor da v1 (`VARIACOES_ACEITAS` sem `maldicao`), e é
     assim que o relato do autor foi reproduzido: a origem aparecia, sobrava a
     aba de Energia Reversa e nenhuma de Maldição.
   • 7. As Características que pedem escolha (o atributo do Desenvolvimento, o
     tipo de dano da Carapaça, a perícia do Corpo Especializado) e as que
     faltavam número (o treino do Olhos Sombrios, a Atenção do Instinto
     Sanguinário). O MECANISMO está em t-caracteristicas-amaldicoadas.mjs.
   • 8. A Ficha Final, que antes não listava as Características de jeito
     nenhum. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const CA = await import(R + "afty-caracteristicas-amaldicoadas.js");
const O = await import(R + "afty-origens.js");
const AP = await import(R + "afty-aptidoes.js");
const TR = await import(R + "afty-treinamentos.js");
const FC = await import(R + "ficha/ficha-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/maldicao-era-de-ouro.json", import.meta.url), "utf8")));
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("o pacote so abre a tela do pool: permite caracteristicasAmaldicoadas", pacote.permite, ["caracteristicasAmaldicoadas"]);
t("a primitiva existe no catalogo", AD.PRIMITIVAS.some((p) => p.id === "caracteristicasAmaldicoadas"), true);
AD.aplicarAddons([pacote]);

const NS = "maldicao-era-de-ouro:";
const ORIGEM_ID = `${NS}maldicao_era_de_ouro`;
const TIPO = {
  comum: `${NS}tipo_comum`,
  medo: `${NS}tipo_medo`,
  vingativo: `${NS}tipo_vingativo`,
  vingativoImaginario: `${NS}tipo_vingativo_imaginario`,
  enfermo: `${NS}tipo_enfermo`,
};

/* ============================================================ */
/* 1. A ORIGEM E O MURO DO getCla                                */
/* ============================================================ */
const origem = O.getOrigem(ORIGEM_ID);
t("a origem existe, com o namespace do pacote", !!origem, true);
t("e diz de qual origem do raw ela varia", origem?.variacaoDe, "maldicao");
t("origemMae resolve para a origem do raw (destrava Aptidao de Maldicao e Talentos de Origem)",
  O.origemMae(ORIGEM_ID), "maldicao");
t("a origem tem 5 Tipos, na ordem do livro",
  O.clasDaOrigem(ORIGEM_ID)?.map((c) => c.id),
  [TIPO.comum, TIPO.medo, TIPO.vingativo, TIPO.vingativoImaginario, TIPO.enfermo]);

for (const [nome, id] of Object.entries(TIPO)) {
  const cla = O.getCla(id);
  t(`getCla acha o Tipo ${nome} de verdade (com caracteristicas, nao so o stub do picker)`,
    [!!cla, Array.isArray(cla?.caracteristicas) && cla.caracteristicas.length > 0], [true, true]);
}
t("o rotulo do seletor e Tipo, nao Cla (e o artigo e 'um')", [origem?.clasRotulo, origem?.clasArtigo], ["Tipo", "um"]);

/* ============================================================ */
/* 2. A FICHA                                                    */
/* ============================================================ */
const ficha = ({
  nd = 10, origemId = ORIGEM_ID, cla = null, caracteristicasAmaldicoadas = [],
  alvos = {}, aptidoes = [], combateAtivo = false,
} = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: origemId, ...(cla ? { cla } : {}) };
  c.addons = [pacote];
  // Aceita o id curto (`ca_pernas_extras`) ou o completo, com namespace.
  c.caracteristicasAmaldicoadas = caracteristicasAmaldicoadas.map((x) => (x.includes(":") ? x : `${NS}${x}`));
  // As respostas de quem pede escolha, chaveadas pelo id SEM o namespace.
  c.caracteristicasAmaldicoadasAlvos = Object.fromEntries(Object.entries(alvos).map(([k, v]) => [`${NS}${k}`, v]));
  c.aptidoesAmaldicoadas = aptidoes;
  if (combateAtivo) c.combate = { ...c.combate, ativo: true };
  return c;
};
const outraOrigem = () => deriveAfty(ficha({ origemId: "inato" }));

/* ============================================================ */
/* 3. A ORIGEM INTEIRA VALE MESMO SEM ESCOLHER TIPO               */
/* ============================================================ */
/* Nada aqui e doCla: Bonus em Atributo, Natureza, Restricao e Anatomia sao da
   ORIGEM, e so a caracteristica exclusiva de cada Tipo fica no cla. */
for (const nd of [1, 2, 3, 4, 5, 10, 11, 20]) {
  const d = deriveAfty(ficha({ nd }));
  const base = deriveAfty(ficha({ nd, origemId: "inato" }));
  t(`nivel ${nd}, sem Tipo: PE ja e o certo (nivel impar), so por ter a Origem`,
    d.pe - base.pe, Math.floor((nd + 1) / 2));
}
const dSemTipo = deriveAfty(ficha({ nd: 20 }));
t("sem Tipo: vagasAptidao 1 + (10) + (15), no nd 20 vale 3",
  dSemTipo.totalAptidoesAmaldicoadas - outraOrigem().totalAptidoesAmaldicoadas, 3);
t("sem Tipo: vaga de Caracteristica Amaldicoada ja abre (Anatomia e da Origem)",
  dSemTipo.caracteristicasAmaldicoadas.vagas, 1 + Math.floor(20 / 5));
t("sem Tipo: Bonus em Atributo (distribuir 4, max 3) ja esta na lista de caracteristicas efetivas",
  O.caracteristicasEfetivas(ficha({ nd: 1 })).some((c) => c.bonus?.distribuir === 4 && c.bonus?.maxPorAtributo === 3), true);
t("sem Tipo: reduzNivelAptidao continua zero (e so do Tipo De Medo)",
  dSemTipo.reduzNivelAptidao, 0);

/* ============================================================ */
/* 4. ESCOLHER UM TIPO                                            */
/* ============================================================ */
const dComum = deriveAfty(ficha({ nd: 10, cla: TIPO.comum }));
const dSemTipoNd10 = deriveAfty(ficha({ nd: 10 }));
t("Tipo Comum nao soma PE nem vaga a mais (e so identidade, mesmo total da Origem sozinha)",
  [dComum.pe, dComum.totalAptidoesAmaldicoadas], [dSemTipoNd10.pe, dSemTipoNd10.totalAptidoesAmaldicoadas]);

t("sem o Tipo De Medo, reduzNivelAptidao e zero", dSemTipoNd10.reduzNivelAptidao, 0);
const dMedo = deriveAfty(ficha({ nd: 10, cla: TIPO.medo }));
t("com o Tipo De Medo, reduzNivelAptidao sobe 1 (mais largo que 'um grupo', nunca mais estreito)",
  dMedo.reduzNivelAptidao, 1);
t("e o PE do Tipo De Medo continua o da Origem (a caracteristica dele nao mexe em PE)",
  dMedo.pe, dSemTipoNd10.pe);

for (const [nome, id] of Object.entries(TIPO)) {
  t(`Tipo ${nome}: a ficha crua guarda o id certo em core.origem.cla`, ficha({ cla: id }).core.origem.cla, id);
  // Escolher o Tipo nao quebra o derive (todo mundo deriva sem excecao).
  t(`Tipo ${nome}: deriva sem excecao`, typeof deriveAfty(ficha({ nd: 7, cla: id })).pe, "number");
}

/* ============================================================ */
/* 5. O POOL DE CARACTERÍSTICAS AMALDIÇOADAS (18, sem mudanca)   */
/* ============================================================ */
t("sao 18 caracteristicas amaldicoadas no catalogo", CA.AFTY_CARACTERISTICAS_AMALDICOADAS.length, 18);
t("todas tem nome e descricao", CA.AFTY_CARACTERISTICAS_AMALDICOADAS.every((c) => c.nome && c.descricao), true);

const CA_ID = (id) => `${NS}ca_${id}`;
const comPool = (nd, escolhidas) => deriveAfty(ficha({ nd, caracteristicasAmaldicoadas: escolhidas }));

t("nivel 1: 1 vaga", comPool(1, []).caracteristicasAmaldicoadas.vagas, 1);
t("nivel 4: ainda 1 vaga (so sobe a cada 5)", comPool(4, []).caracteristicasAmaldicoadas.vagas, 1);
t("nivel 5: 2 vagas", comPool(5, []).caracteristicasAmaldicoadas.vagas, 2);
t("nivel 20: 5 vagas", comPool(20, []).caracteristicasAmaldicoadas.vagas, 5);

const dCarac = comPool(10, [CA_ID("pernas_extras"), CA_ID("olhos_adicionais"), CA_ID("instinto_sanguinario")]);
t("3 escolhidas, dentro da vaga (3 de 3): nao excede",
  [dCarac.caracteristicasAmaldicoadas.usadas, dCarac.caracteristicasAmaldicoadas.excedeu], [3, false]);
t("Pernas Extras soma 4,5m de deslocamento", dCarac.movimento - comPool(10, []).movimento, 4.5);
t("Instinto Sanguinario soma o BT na Iniciativa", dCarac.iniciativa - comPool(10, []).iniciativa, dCarac.maestria);

const dExcesso = comPool(1, [CA_ID("pernas_extras"), CA_ID("olhos_adicionais")]);
t("2 escolhidas com 1 vaga so: excede, mas NAO trava (mesma regra do resto do sistema)",
  [dExcesso.caracteristicasAmaldicoadas.usadas, dExcesso.caracteristicasAmaldicoadas.vagas, dExcesso.caracteristicasAmaldicoadas.excedeu],
  [2, 1, true]);
t("mesmo excedendo, os efeitos das duas continuam somando (a mesa que corta)",
  dExcesso.movimento - comPool(1, []).movimento, 4.5);

/* ============================================================ */
/* 6. ACESSO ÀS APTIDÕES DE MALDIÇÃO E SEM ENERGIA REVERSA        */
/* ============================================================ */
/* O autor testou a v2 e relatou: *"Ele perdeu acesso as aptidoes de maldicao"* e
   *"lembre de tirar acesso de energia reversa apos conseguir o acesso"*. Os dois
   sintomas eram UM SÓ e tinham uma causa fora do addon: o app no ar ainda era o
   da v1, cuja lista de mães aceitas (`VARIACOES_ACEITAS`) só tinha `sem_tecnica`.
   Com ela, o `variacaoDe: "maldicao"` é ignorado, a origem nova se comporta como
   uma origem comum, e sobram justamente a aba de Energia Reversa e nenhuma de
   Maldição. O app NÃO recusa o addon nesse caso: só relata, no retorno do
   `aplicarAddons`, o problema "variacaoDe ainda não aceita maldicao", e os três
   chamadores jogavam esse retorno fora (a aba Addons só o mostra desde
   2026-09-23).

   Este bloco prende as duas metades da regra da Maldição, que a origem nova
   herda da mãe: GANHA a categoria Maldição e PERDE a trilha, a aba e o treino de
   Energia Reversa. Vale para os cinco Tipos, para quem ainda não escolheu Tipo e
   para os dois sistemas. */
t("o app nao relata NENHUM problema ao aplicar o pacote (era aqui que a v1 reclamava da mae)",
  AD.aplicarAddons([pacote]).problemas, []);
t("a lista de maes aceitas conhece a Maldicao", O.VARIACOES_ACEITAS.includes("maldicao"), true);
t("e a tela nao tem nada a mostrar em Problemas (o relato guardado esta vazio)", AD.problemasDaAplicacao(), []);

/* O QUE A TELA GANHOU (2026-09-23): o relato dos validadores ficava so no retorno
   de `aplicarAddons`, que os tres chamadores jogam fora, e por isso o motor velho
   falhava calado. Agora a aba Addons le `problemasDaAplicacao()`. A prova e uma
   copia do pacote que cita uma mae que o app NAO aceita (a Inato). */
const daMaeRecusada = JSON.parse(JSON.stringify(pacote));
daMaeRecusada.acrescenta.origens[0].variacaoDe = "inato";
AD.aplicarAddons([daMaeRecusada]);
t("uma mae que o app nao aceita vira problema legivel para a tela",
  AD.problemasDaAplicacao().flatMap((r) => r.problemas).some((p) => p.includes("variacaoDe ainda não aceita inato")), true);
AD.aplicarAddons([pacote]);
t("e o relato some quando o pacote certo volta", AD.problemasDaAplicacao(), []);

const abasIds = (c) => AP.abasAptidao(c).map((a) => a.id);
const trilhasChaves = (c) => AP.trilhasDaCriatura(c).map((x) => x.key);
const SEM_ER = ["au", "cl", "bar", "dom"];
const ABAS_MALDICAO = ["aura", "controle_leitura", "barreiras", "dominio", "maldicao", "especiais"];
const ABAS_COMUM = ["aura", "controle_leitura", "barreiras", "dominio", "energia_reversa", "especiais"];

t("controle: a origem Inato tem a aba de Energia Reversa e nenhuma de Maldicao",
  abasIds(ficha({ origemId: "inato" })), ABAS_COMUM);
t("controle: a origem Maldicao do livro troca uma pela outra", abasIds(ficha({ origemId: "maldicao" })), ABAS_MALDICAO);
t("a origem nova faz a MESMA troca, sem escolher Tipo", abasIds(ficha()), ABAS_MALDICAO);
t("e a trilha de Energia Reversa some do nivel de aptidao", trilhasChaves(ficha()), SEM_ER);
t("controle: a Inato continua com as cinco trilhas", trilhasChaves(ficha({ origemId: "inato" })), [...SEM_ER, "er"]);

for (const [nome, tipo] of Object.entries(TIPO)) {
  const c = ficha({ nd: 12, cla: tipo });
  t(`Tipo ${nome}: ganha a aba Maldicao e perde a Energia Reversa`, abasIds(c), ABAS_MALDICAO);
  t(`Tipo ${nome}: a trilha ER tambem some no que o derive entrega`,
    deriveAfty(c).trilhasAptidao.map((x) => x.key), SEM_ER);
}

/* O Player usa o mesmo código e a mesma origem-mãe. */
const noPlayer = ficha();
noPlayer.rulesVersion = "player";
t("no Player vale o mesmo: aba Maldicao no lugar da Energia Reversa", abasIds(noPlayer), ABAS_MALDICAO);
t("e o derive do Player tambem entrega so quatro trilhas", deriveAfty(noPlayer).trilhasAptidao.map((x) => x.key), SEM_ER);

t("as 18 Aptidoes de Maldicao do livro continuam todas alcancaveis pela aba",
  AP.aptidoesDaCategoria("maldicao").length, 18);

/* A ESCOLHA VALE DE VERDADE: uma Aptidão de Maldição marcada rende o efeito dela.
   Estoque Ampliado soma o Bônus de Treinamento ao PE, e o pré-requisito dela é o
   Nível 10. */
const semEstoque = deriveAfty(ficha({ nd: 10 }));
const comEstoque = deriveAfty(ficha({ nd: 10, aptidoes: ["mal_estoque_ampliado"] }));
t("Estoque Ampliado, marcado com a origem nova, soma o BT no PE", comEstoque.pe - semEstoque.pe, semEstoque.maestria);
t("a Natureza Amaldicoada dá 2 vagas de Aptidao no nivel 10 (a primeira e a do 10o)",
  deriveAfty(ficha({ nd: 10, aptidoes: ["mal_estoque_ampliado"] })).totalAptidoesAmaldicoadas
    - deriveAfty(ficha({ nd: 10, origemId: "inato" })).totalAptidoesAmaldicoadas, 2);

/* O TREINO de Energia Reversa (a trilha inteira some da aba de Interludios). */
const treinoER = TR.getTreinamento("energia_reversa");
const disponivelPara = (c) => TR.treinoDisponivel(treinoER, O.origemEstrutural(c), O.origensQualificadas(c));
t("o Treino de Energia Reversa existe no livro", !!treinoER, true);
t("controle: a Inato pode fazer o Treino de Energia Reversa", disponivelPara(ficha({ origemId: "inato" })), true);
t("controle: a Maldicao do livro NAO pode", disponivelPara(ficha({ origemId: "maldicao" })), false);
t("a origem nova NAO pode, como a mae", disponivelPara(ficha()), false);

/* ============================================================ */
/* 7. AS CARACTERÍSTICAS QUE PEDEM ESCOLHA, COM O CONTEÚDO REAL   */
/* ============================================================ */
/* O autor: *"as Características amaldiçoadas, algumas não estão modificando
   corretamente, como selecionar [...] ou até mesmo atributos"*. O mecanismo
   está medido em t-caracteristicas-amaldicoadas.mjs, e aqui fica o que o LIVRO
   pede de cada uma. */
const cat = (d, x) => d.caracteristicasAmaldicoadas.catalogo.find((c) => c.id === `${NS}${x}`);

/* O Desenvolvimento Físico e o Mental: "um atributo a sua escolha aumenta em 2,
   essa aptidão ignora o limite natural. Nos níveis 15 e 20 aumentam em +1." */
const degrau = (nd) => 2 + (nd >= 15 ? 1 : 0) + (nd >= 20 ? 1 : 0);
for (const nd of [4, 14, 15, 19, 20]) {
  const sem = deriveAfty(ficha({ nd }));
  const com = deriveAfty(ficha({
    nd, caracteristicasAmaldicoadas: ["ca_desenvolvimento_fisico"],
    alvos: { ca_desenvolvimento_fisico: { atributo: "constituicao" } },
  }));
  t(`Desenvolvimento Fisico no nivel ${nd}: a Constituicao sobe ${degrau(nd)}`,
    com.attrEff.constituicao - sem.attrEff.constituicao, degrau(nd));
  t(`Desenvolvimento Fisico no nivel ${nd}: o LIMITE sobe junto (ignora o limite natural)`,
    com.attrLimiteEfetivo.constituicao - sem.attrLimiteEfetivo.constituicao, degrau(nd));
}
const mentalInt = deriveAfty(ficha({
  nd: 15, caracteristicasAmaldicoadas: ["ca_desenvolvimento_mental"],
  alvos: { ca_desenvolvimento_mental: { atributo: "inteligencia" } },
}));
const sem15 = deriveAfty(ficha({ nd: 15 }));
t("Desenvolvimento mental em Inteligencia no nivel 15 sobe 3", mentalInt.attrEff.inteligencia - sem15.attrEff.inteligencia, 3);

/* "um atributo FÍSICO (Força, Destreza ou Constituição)": Sabedoria não vale. */
const fisicoSab = deriveAfty(ficha({
  nd: 15, caracteristicasAmaldicoadas: ["ca_desenvolvimento_fisico"],
  alvos: { ca_desenvolvimento_fisico: { atributo: "sabedoria" } },
}));
t("o Fisico recusa um atributo mental (Sabedoria) e nada sobe", fisicoSab.attrEff.sabedoria, sem15.attrEff.sabedoria);
t("e a escolha invalida conta como pendente", fisicoSab.caracteristicasAmaldicoadas.pendentes.map((c) => c.id),
  [`${NS}ca_desenvolvimento_fisico`]);

/* "Não pode ter a característica: Desenvolvimento mental" e o inverso. */
t("com o Fisico marcado, o Mental trava", cat(deriveAfty(ficha({ nd: 15, caracteristicasAmaldicoadas: ["ca_desenvolvimento_fisico"] })), "ca_desenvolvimento_mental").bloqueada, true);
t("com o Mental marcado, o Fisico trava", cat(deriveAfty(ficha({ nd: 15, caracteristicasAmaldicoadas: ["ca_desenvolvimento_mental"] })), "ca_desenvolvimento_fisico").bloqueada, true);
t("no nivel 3 o Fisico trava pelo requisito de nivel 4", cat(deriveAfty(ficha({ nd: 3 })), "ca_desenvolvimento_fisico").bloqueada, true);
t("no nivel 8 o Guia Espiritual ainda trava (pede nivel 9)", cat(deriveAfty(ficha({ nd: 8 })), "ca_guia_espiritual").bloqueada, true);
t("no nivel 9 ele abre", cat(deriveAfty(ficha({ nd: 9 })), "ca_guia_espiritual").bloqueada, false);

/* Carapaça Mutante: "resistência a um tipo de dano FÍSICO à sua escolha". */
const linhaDano = (d, tipo) => d.defesasDano.linhas.find((l) => l.tipo === tipo);
for (const tipo of ["ct", "im", "pf"]) {
  const d = deriveAfty(ficha({ caracteristicasAmaldicoadas: ["ca_carapaca_mutante"], alvos: { ca_carapaca_mutante: { tipo } } }));
  t(`Carapaca Mutante em ${tipo}: so esse tipo fica resistente`,
    ["ct", "im", "pf"].filter((x) => linhaDano(d, x).estados.includes("resistente")), [tipo]);
}
const carapacaAcido = deriveAfty(ficha({ caracteristicasAmaldicoadas: ["ca_carapaca_mutante"], alvos: { ca_carapaca_mutante: { tipo: "acido" } } }));
t("a Carapaca recusa um tipo elemental (Acido)", linhaDano(carapacaAcido, "acido").estados, []);
t("e o nome da fonte no estado e Carapaca Mutante",
  linhaDano(deriveAfty(ficha({ caracteristicasAmaldicoadas: ["ca_carapaca_mutante"], alvos: { ca_carapaca_mutante: { tipo: "ct" } } })), "ct")
    .fontesEstado.resistente.map((f) => f.label), ["Carapaça Mutante"]);

/* Corpo Especializado: "Escolha uma perícia: você recebe um bônus de 1d4 nela." */
const semCorpo = deriveAfty(ficha());
const corpo = deriveAfty(ficha({ caracteristicasAmaldicoadas: ["ca_corpo_especializado"], alvos: { ca_corpo_especializado: { pericia: "furtividade" } } }));
const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id);
t("Corpo Especializado em Furtividade: a linha ganha 1d4", pericia(corpo, "furtividade").dadosExtras, [{ faces: 4, qtd: 1 }]);
t("o numero fixo da pericia NAO muda (o dado e uma rolagem a mais)", pericia(corpo, "furtividade").bonus, pericia(semCorpo, "furtividade").bonus);
t("as outras pericias ficam como estavam", pericia(corpo, "percepcao").dadosExtras, undefined);

/* Olhos Sombrios: "você se torna treinado em Percepção e recebe um bônus de +2". */
const sombrios = deriveAfty(ficha({ caracteristicasAmaldicoadas: ["ca_olhos_sombrios"] }));
t("Olhos Sombrios torna a Percepcao Treinada", [pericia(semCorpo, "percepcao").prof, pericia(sombrios, "percepcao").prof], [null, "treinado"]);
t("e soma o Bonus de Treinamento mais os +2 no numero", pericia(sombrios, "percepcao").bonus - pericia(semCorpo, "percepcao").bonus, semCorpo.maestria + 2);

/* Instinto Sanguinário: Iniciativa + BT sempre, e Atenção + BT "em uma cena de combate". */
const instinto = deriveAfty(ficha({ caracteristicasAmaldicoadas: ["ca_instinto_sanguinario"] }));
const instintoCombate = deriveAfty(ficha({ caracteristicasAmaldicoadas: ["ca_instinto_sanguinario"], combateAtivo: true }));
t("Instinto Sanguinario soma o BT na Iniciativa", instinto.iniciativa - semCorpo.iniciativa, semCorpo.maestria);
t("fora de combate a Atencao nao muda", instinto.atencao - semCorpo.atencao, 0);
t("em combate a Atencao soma o BT", instintoCombate.atencao - semCorpo.atencao, semCorpo.maestria);

/* TODA entrada do pool ou tem número no Motor, ou se declara Mesa. Uma entrada que
   não é nenhuma das duas seria checkbox que não faz nada e não avisa, que é o
   defeito que o autor relatou. */
const entradas = CA.AFTY_CARACTERISTICAS_AMALDICOADAS;
t("nenhuma entrada fica muda: ou tem efeito, ou e Mesa",
  entradas.filter((c) => !(c.efeitos?.length > 0) && !c.mesa).map((c) => c.id), []);
t("nenhuma entrada e as duas coisas ao mesmo tempo (Mesa e efeito se excluem)",
  entradas.filter((c) => c.efeitos?.length > 0 && c.mesa).map((c) => c.id), []);
t("as nove com numero no Motor",
  entradas.filter((c) => c.efeitos?.length > 0).map((c) => c.id.slice(NS.length)),
  ["ca_bracos_extras", "ca_carapaca_mutante", "ca_corpo_especializado", "ca_olhos_adicionais", "ca_instinto_sanguinario",
    "ca_olhos_sombrios", "ca_pernas_extras", "ca_desenvolvimento_fisico", "ca_desenvolvimento_mental"]);
t("as tres que so cobrem um pedaco dizem qual pedaco nao entra (parcial)",
  entradas.filter((c) => c.parcial).map((c) => c.id.slice(NS.length)),
  ["ca_bracos_extras", "ca_olhos_sombrios", "ca_pernas_extras"]);
t("as que pedem escolha declaram o alvo",
  entradas.filter((c) => c.alvos?.length > 0).map((c) => c.id.slice(NS.length)),
  ["ca_carapaca_mutante", "ca_corpo_especializado", "ca_desenvolvimento_fisico", "ca_desenvolvimento_mental"]);

/* ============================================================ */
/* 8. A FICHA FINAL MOSTRA O QUE FOI ESCOLHIDO                    */
/* ============================================================ */
/* Antes desta mudança a Ficha nao listava as Caracteristicas Amaldicoadas de
   jeito nenhum: o jogador marcava no criador e, na mesa, nao havia onde ler. */
t("a Ficha tem um grupo proprio, logo depois das Aptidoes Amaldicoadas",
  FC.GRUPOS.map((g) => g.id).slice(FC.GRUPOS.findIndex((g) => g.id === "aptidao"), FC.GRUPOS.findIndex((g) => g.id === "aptidao") + 2),
  ["aptidao", "caracteristicaAmaldicoada"]);
const fichaDoJogador = ficha({
  nd: 15,
  caracteristicasAmaldicoadas: ["ca_desenvolvimento_fisico", "ca_bracos_extras", "ca_pernas_extras"],
  alvos: { ca_desenvolvimento_fisico: { atributo: "forca" } },
});
const itensFicha = FC.conteudoDaFicha(fichaDoJogador, deriveAfty(fichaDoJogador))
  .filter((i) => i.grupo === "caracteristicaAmaldicoada");
t("as tres escolhidas aparecem, na ordem da escolha", itensFicha.map((i) => i.nome),
  ["Desenvolvimento Físico", "Braços Extras", "Pernas Extras"]);
t("a resposta vira a opcao da linha (Atributo: Forca)", itensFicha[0].opcoes.map((o) => o.nome), ["Atributo: Força"]);
t("o texto do livro sai inteiro, verbatim", itensFicha[1].texto.startsWith("Seu corpo possui um par de braços adicionais."), true);
t("o pedaço que o Motor nao cobre vira o aviso da linha",
  itensFicha[1].aviso.startsWith("O +2 em Prestidigitação já está no número."), true);
const semRespostaFicha = ficha({ nd: 15, caracteristicasAmaldicoadas: ["ca_desenvolvimento_fisico"] });
t("sem a escolha feita a linha avisa o que falta",
  FC.conteudoDaFicha(semRespostaFicha, deriveAfty(semRespostaFicha)).find((i) => i.grupo === "caracteristicaAmaldicoada").aviso,
  "Falta escolher Atributo");
t("sem nenhuma escolhida o grupo nao tem linha",
  FC.conteudoDaFicha(ficha(), deriveAfty(ficha())).some((i) => i.grupo === "caracteristicaAmaldicoada"), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
