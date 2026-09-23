/* CARACTERÍSTICAS AMALDIÇOADAS, O MECANISMO (2026-09-23): alvos escolhidos e
   incompatibilidade.

   O autor achou que algumas Características Amaldiçoadas *"não estão modificando
   corretamente, como selecionar [...] ou até mesmo atributos"*. O motivo era um só:
   as que pedem uma escolha (o atributo do Desenvolvimento Físico, o tipo de dano
   da Carapaça Mutante, a perícia do Corpo Especializado) eram checkbox puro, sem
   lugar para a resposta, e por isso não mexiam em número nenhum.

   Este arquivo mede o MECANISMO com um pacote de teste próprio, e não com o
   conteúdo da Maldição - Era de Ouro (esse mora em t-maldicao-era-de-ouro.mjs):
   se o mecanismo quebrar, o vermelho aparece aqui, sem depender do texto do livro.

   ⚠ O QUE FICA PRESO:
   1. `alvo: "escolha:<id>"` vira a resposta da ficha, e SEM resposta válida o
      efeito não entra (nem com o alvo cru, que mandaria o número para um
      atributo que não existe).
   2. `opcoes` recorta o que vale: resposta fora da lista é ignorada.
   3. O sufixo depois do id (`escolha:pericia:d4` vira `percepcao:d4`) é o que
      faz o canal `dadosPericia` carregar a perícia e o dado no mesmo alvo.
   4. `incompativeisIds` ganha o namespace do pacote e vale nos DOIS sentidos.
   5. Uma entrada repetida na ficha conta uma vez: característica não se pega
      duas vezes.
   6. O validador da família recusa alvo de tipo inexistente, efeito mirando alvo
      que a entrada não declarou e incompatibilidade com id que não existe. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const CA = await import(R + "afty-caracteristicas-amaldicoadas.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const PACOTE = {
  id: "teste-car",
  nome: "Teste de Características",
  versao: "1.0.0",
  paraRaw: "afty",
  permite: ["caracteristicasAmaldicoadas"],
  acrescenta: {
    caracteristicasAmaldicoadas: [
      {
        id: "forte",
        nome: "Forte",
        descricao: "Um atributo físico sobe, valor e limite juntos.",
        requisitos: [{ tipo: "nd", valor: 4 }],
        incompativeisIds: ["astuto"],
        alvos: [{ id: "atributo", tipo: "atributo", label: "Atributo", opcoes: ["forca", "destreza"] }],
        efeitos: [
          { canal: "atributo", alvo: "escolha:atributo", expr: "2 + (nd >= 10)" },
          { canal: "limiteAtributo", alvo: "escolha:atributo", expr: "2 + (nd >= 10)" },
        ],
      },
      {
        id: "astuto",
        nome: "Astuto",
        descricao: "Um atributo mental sobe.",
        incompativeisIds: ["forte"],
      },
      {
        id: "casca",
        nome: "Casca",
        descricao: "Resistência a um tipo de dano físico.",
        alvos: [{ id: "tipo", tipo: "tipoDano", label: "Tipo de Dano", opcoes: ["ct", "im"] }],
        efeitos: [{ canal: "resistenciaDano", alvo: "escolha:tipo", expr: "1" }],
      },
      {
        id: "foco",
        nome: "Foco",
        descricao: "Um dado numa perícia.",
        alvos: [{ id: "pericia", tipo: "pericia", label: "Perícia" }],
        efeitos: [{ canal: "dadosPericia", alvo: "escolha:pericia:d4", expr: "1" }],
      },
      {
        id: "fixa",
        nome: "Fixa",
        descricao: "Número fixo, sem escolha nenhuma.",
        mesa: true,
        parcial: "O resto fica na mesa.",
        efeitos: [{ canal: "movimento", expr: "3" }],
      },
    ],
  },
};

t("o pacote de teste valida sem problema", AD.validarPacote(PACOTE), []);
const aplicado = AD.aplicarAddons([PACOTE]);
t("e aplica sem problema em nenhum validador de familia", aplicado.problemas, []);

const NS = "teste-car:";
const id = (x) => NS + x;
const forte = CA.getCaracteristicaAmaldicoada(id("forte"));

/* ============================================================ */
/* 1. NAMESPACE E ALVOS DECLARADOS                                */
/* ============================================================ */
t("a entrada ganha o namespace do pacote", forte?.id, id("forte"));
t("incompativeisIds tambem ganha (a referencia acha a irma do mesmo pacote)", forte?.incompativeisIds, [id("astuto")]);
t("os alvos saem normalizados", CA.alvosDaCaracteristica(forte),
  [{ id: "atributo", tipo: "atributo", label: "Atributo", opcoes: ["forca", "destreza"] }]);
t("entrada sem alvo declarado devolve lista vazia", CA.alvosDaCaracteristica(CA.getCaracteristicaAmaldicoada(id("fixa"))), []);
t("os tipos de alvo que existem", CA.TIPOS_DE_ALVO, ["atributo", "pericia", "tipoDano"]);

/* ============================================================ */
/* 2. O EFEITO E A RESPOSTA                                       */
/* ============================================================ */
t("sem resposta o efeito NAO entra (nem com o alvo cru)", CA.efeitosDaCaracteristica(forte, {}), []);
t("com resposta valida o alvo vira o atributo escolhido, nos dois canais",
  CA.efeitosDaCaracteristica(forte, { atributo: "forca" }).map((e) => [e.canal, e.alvo]),
  [["atributo", "forca"], ["limiteAtributo", "forca"]]);
t("resposta fora das opcoes e ignorada (Sabedoria nao e fisico)",
  CA.efeitosDaCaracteristica(forte, { atributo: "sabedoria" }), []);
t("resposta so com espacos conta como vazia", CA.efeitosDaCaracteristica(forte, { atributo: "  " }), []);
t("o sufixo depois do id monta o alvo composto (perícia + dado)",
  CA.efeitosDaCaracteristica(CA.getCaracteristicaAmaldicoada(id("foco")), { pericia: "percepcao" }).map((e) => e.alvo),
  ["percepcao:d4"]);
t("efeito sem escolha passa direto, sem mexer no alvo",
  CA.efeitosDaCaracteristica(CA.getCaracteristicaAmaldicoada(id("fixa")), {}).map((e) => [e.canal, e.alvo ?? null]),
  [["movimento", null]]);

const varias = CA.efeitosDasCaracteristicasAmaldicoadas(
  [id("forte"), id("forte"), id("fixa"), "id_que_nao_existe"],
  { [id("forte")]: { atributo: "destreza" } },
);
t("entrada repetida conta uma vez e id inexistente some (3 linhas, nao 5)", varias.length, 3);
t("cada linha leva a origem e o nome da entrada", varias.map((e) => [e.origem, e.nome]),
  [[id("forte"), "Forte"], [id("forte"), "Forte"], [id("fixa"), "Fixa"]]);

/* ============================================================ */
/* 3. NO DERIVE                                                   */
/* ============================================================ */
const ficha = ({ nd = 6, ids = [], alvos = {} } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum" };
  c.addons = [PACOTE];
  c.caracteristicasAmaldicoadas = ids.map(id);
  c.caracteristicasAmaldicoadasAlvos = Object.fromEntries(Object.entries(alvos).map(([k, v]) => [id(k), v]));
  return c;
};

const base = deriveAfty(ficha());
t("o schema nasce com o mapa de respostas vazio", createBlankAfty().caracteristicasAmaldicoadasAlvos, {});

const comForca = deriveAfty(ficha({ nd: 6, ids: ["forte"], alvos: { forte: { atributo: "forca" } } }));
t("Forte em Forca no nivel 6: o valor sobe 2", comForca.attrEff.forca - base.attrEff.forca, 2);
t("e o LIMITE sobe junto, os mesmos 2 (ignora o limite natural)",
  comForca.attrLimiteEfetivo.forca - base.attrLimiteEfetivo.forca, 2);
t("os outros atributos nao mexem", comForca.attrEff.destreza, base.attrEff.destreza);

const comForca10 = deriveAfty(ficha({ nd: 10, ids: ["forte"], alvos: { forte: { atributo: "forca" } } }));
const base10 = deriveAfty(ficha({ nd: 10 }));
t("no nivel 10 o degrau da expressao entra (+3)", comForca10.attrEff.forca - base10.attrEff.forca, 3);

const trocado = deriveAfty(ficha({ nd: 6, ids: ["forte"], alvos: { forte: { atributo: "destreza" } } }));
t("trocar a resposta leva o bonus para o outro atributo",
  [trocado.attrEff.forca - base.attrEff.forca, trocado.attrEff.destreza - base.attrEff.destreza], [0, 2]);

const semResposta = deriveAfty(ficha({ nd: 6, ids: ["forte"] }));
t("sem resposta nenhum atributo sobe", semResposta.attrEff.forca, base.attrEff.forca);
t("e a resposta que falta vem dita em `pendentes`",
  semResposta.caracteristicasAmaldicoadas.pendentes.map((c) => [c.id, c.pendentes]), [[id("forte"), ["Atributo"]]]);
t("com a resposta dada nao ha pendencia", comForca.caracteristicasAmaldicoadas.pendentes, []);

const tirada = deriveAfty(ficha({ nd: 6, ids: [], alvos: { forte: { atributo: "forca" } } }));
t("resposta gravada de uma caracteristica que nao esta na lista nao vale", tirada.attrEff.forca, base.attrEff.forca);

/* ============================================================ */
/* 4. TIPO DE DANO E PERICIA                                      */
/* ============================================================ */
const linhaDano = (d, tipo) => d.defesasDano.linhas.find((l) => l.tipo === tipo);
const comCasca = deriveAfty(ficha({ ids: ["casca"], alvos: { casca: { tipo: "ct" } } }));
t("Casca em Cortante marca a resistencia so nesse tipo",
  [linhaDano(comCasca, "ct").estados, linhaDano(comCasca, "im").estados], [["resistente"], []]);
t("e a fonte do estado leva o nome da caracteristica",
  linhaDano(comCasca, "ct").fontesEstado.resistente.map((f) => f.label), ["Casca"]);
const cascaForaDaLista = deriveAfty(ficha({ ids: ["casca"], alvos: { casca: { tipo: "acido" } } }));
t("tipo de dano fora das opcoes (Acido) e ignorado", linhaDano(cascaForaDaLista, "acido").estados, []);

const periciaDe = (d, pid) => d.testes.pericias.find((p) => p.id === pid);
const comFoco = deriveAfty(ficha({ ids: ["foco"], alvos: { foco: { pericia: "percepcao" } } }));
const percB = periciaDe(base, "percepcao");
const percF = periciaDe(comFoco, "percepcao");
t("o dado NAO mexe no bonus numerico da pericia", percF.bonus, percB.bonus);
t("a linha da pericia devolve o dado ao lado do bonus", percF.dadosExtras, [{ faces: 4, qtd: 1 }]);
t("e o texto mostra a rolagem inteira (+bonus + 1d4)",
  percF.textoBonus, `${percB.bonus >= 0 ? "+" : "−"}${Math.abs(percB.bonus)} + 1d4`);
t("o hover ganha a parcela do dado, com o nome da caracteristica",
  percF.partes.filter((p) => p.texto).map((p) => [p.label, p.texto]), [["Foco", "1d4"]]);
t("outra pericia nao ganha dado", periciaDe(comFoco, "furtividade").dadosExtras, undefined);
t("e o formato da linha SEM dado nao mudou (nenhuma chave nova)",
  ["dadosExtras" in periciaDe(base, "percepcao"), "textoBonus" in periciaDe(base, "percepcao")], [false, false]);
const focoSemResposta = deriveAfty(ficha({ ids: ["foco"] }));
t("sem a pericia escolhida nao ha dado em pericia nenhuma",
  focoSemResposta.testes.pericias.some((p) => p.dadosExtras), false);

/* ============================================================ */
/* 5. INCOMPATIBILIDADE E REQUISITO                               */
/* ============================================================ */
const linhaCat = (d, x) => d.caracteristicasAmaldicoadas.catalogo.find((c) => c.id === id(x));
const soForte = deriveAfty(ficha({ ids: ["forte"] }));
t("com Forte marcado, Astuto trava", linhaCat(soForte, "astuto").bloqueada, true);
t("e o motivo vira um chip de requisito, com a dica",
  linhaCat(soForte, "astuto").requisitos.filter((r) => !r.ok).map((r) => [r.label, r.titulo]),
  [["Sem Forte", "Incompatível com Forte"]]);
t("Forte, ja escolhido, nunca trava", linhaCat(soForte, "forte").bloqueada, false);
t("sem Forte, Astuto esta livre", linhaCat(base, "astuto").bloqueada, false);

const soAstuto = deriveAfty(ficha({ ids: ["astuto"] }));
t("vale nos DOIS sentidos: com Astuto marcado, Forte trava", linhaCat(soAstuto, "forte").bloqueada, true);

const ficouAmbas = deriveAfty(ficha({ ids: ["forte", "astuto"] }));
t("uma ficha que ja carrega as duas abre e nenhuma trava (a escolha nao some calada)",
  [linhaCat(ficouAmbas, "forte").bloqueada, linhaCat(ficouAmbas, "astuto").bloqueada], [false, false]);
t("mas as duas mostram o cadeado do motivo",
  [linhaCat(ficouAmbas, "forte"), linhaCat(ficouAmbas, "astuto")]
    .map((c) => c.requisitos.some((r) => r.verificavel && !r.ok)), [true, true]);

t("no nivel 3 o requisito de nivel 4 trava Forte", linhaCat(deriveAfty(ficha({ nd: 3 })), "forte").bloqueada, true);
t("no nivel 4 ele abre", linhaCat(deriveAfty(ficha({ nd: 4 })), "forte").bloqueada, false);

t("os recados do autor da entrada chegam na linha (mesa e parcial)",
  [linhaCat(base, "fixa").mesa, linhaCat(base, "fixa").parcial], [true, "O resto fica na mesa."]);
t("entrada sem recado devolve falso e nulo", [linhaCat(base, "forte").mesa, linhaCat(base, "forte").parcial], [false, null]);

const duas = deriveAfty(ficha({ ids: ["forte", "forte", "fixa"], alvos: { forte: { atributo: "forca" } } }));
t("entrada duplicada na ficha conta uma vez nas vagas usadas", duas.caracteristicasAmaldicoadas.usadas, 2);
t("e nao soma o bonus em dobro", duas.attrEff.forca - base.attrEff.forca, 2);

/* ============================================================ */
/* 6. O VALIDADOR DA FAMILIA                                      */
/* ============================================================ */
const QUEBRADO = {
  id: "quebrado-car",
  nome: "Quebrado",
  versao: "1.0.0",
  paraRaw: "afty",
  permite: ["caracteristicasAmaldicoadas"],
  acrescenta: {
    caracteristicasAmaldicoadas: [
      { id: "tipo_ruim", nome: "Tipo Ruim", descricao: "x", alvos: [{ id: "a", tipo: "planeta", label: "A" }] },
      { id: "alvo_orfao", nome: "Alvo Orfao", descricao: "x", efeitos: [{ canal: "atributo", alvo: "escolha:nada", expr: "1" }] },
      { id: "briga_fantasma", nome: "Briga Fantasma", descricao: "x", incompativeisIds: ["nao_existe"] },
      { id: "lista_vazia", nome: "Lista Vazia", descricao: "x", alvos: [{ id: "b", tipo: "atributo", label: "B", opcoes: [] }] },
    ],
  },
};
const ruim = AD.aplicarAddons([QUEBRADO]);
const textos = ruim.problemas.flatMap((p) => p.problemas).join(" | ");
t("alvo de tipo inexistente e reportado", textos.includes("tipo inválido (planeta)"), true);
t("efeito que mira alvo nao declarado e reportado", textos.includes('não declara o alvo "nada"'), true);
t("incompatibilidade com id inexistente e reportada", textos.includes("incompativeisIds cita característica inexistente"), true);
t("opcoes vazias sao reportadas", textos.includes("precisam ser uma lista com pelo menos um id"), true);

t("o relato fica guardado para a aba Addons mostrar (problemasDaAplicacao)", AD.problemasDaAplicacao(), ruim.problemas);

AD.aplicarAddons([]);
t("sem addon o catalogo volta vazio (nada vaza para a proxima ficha)", CA.AFTY_CARACTERISTICAS_AMALDICOADAS.length, 0);
t("e o relato tambem zera", AD.problemasDaAplicacao(), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
