/* ESPECIALISTA EM ESTILO: a herança de Especialização, e a prova de que ela
   não vaza para quem não instalou o Addon.

   O pedido do autor em 2026-09-07, nas palavras dele: *"Fecha Conjurador para
   Sem Tecnica, o Addon abre o Especialista em Estilo que HERDA as coisas de
   Conjurador"*, e *"Garanta que isso não vaze para quem não usa o Addon. Isso é
   algo bem especifico de um contexto especifico e não deve afetar o raw"*.

   Duas coisas ENTRARAM NO RAW de propósito, e as duas são regra do livro, não
   do Addon:
     • a origem Sem Técnica passou a VETAR o Conjurador de verdade. A restrição
       existia desde sempre no texto e era só um chip vermelho.
     • os três campos de Especialização (`herdaDe`, `restritaOrigemIds`,
       `incompativeisIds`) e o canal `reduzNivelAptidao` existem no motor. São
       VERBO, e verbo é do motor: nenhuma entrada do livro os usa, e o bloco 7
       mede exatamente isso. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const ESP = await import(R + "afty-especializacoes.js");
const HAB = await import(R + "afty-habilidades.js");
const APT = await import(R + "afty-aptidoes.js");
const OR = await import(R + "afty-origens.js");
const DSL = await import(R + "afty-dsl.js");
const EF = await import(R + "afty-efeitos.js");

const PACOTE = JSON.parse(
  readFileSync(new URL("../addons/especialista-em-estilo.json", import.meta.url), "utf8"),
);

const ID = "especialista-em-estilo:esp_estilo";

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (nd, espId, origem = "sem_tecnica", comAddon = true) => {
  const c = createBlankAfty();
  c.core.origem = { id: origem };
  c.core.nd = nd;
  c.core.tipo = "conjurador";
  if (espId) c.especializacoes = [{ id: espId, nivel: nd }];
  if (comAddon) c.addons = [PACOTE];
  return c;
};

/* ============================================================ */
/* 1. O RAW PURO, ANTES DE QUALQUER ADDON                        */
/* ============================================================ */

t("nenhuma Especializacao do livro herda", ESP.AFTY_ESPECIALIZACOES.filter((e) => e.herdaDe).length, 0);
t("nenhuma e restrita por origem", ESP.AFTY_ESPECIALIZACOES.filter((e) => e.restritaOrigemIds).length, 0);
t("nenhuma briga com outra", ESP.AFTY_ESPECIALIZACOES.filter((e) => e.incompativeisIds?.length).length, 0);
t("nenhuma habilidade do livro e clone", HAB.AFTY_HABILIDADES.filter((h) => h.herdadaDe).length, 0);
t("catalogo de Especializacao sao", ESP.validarCatalogoEspecializacoes(), []);

/* O VETO É A ÚNICA MUDANÇA DE REGRA no raw, e é o pedido 2 do autor. Até
   2026-09-07 a frase "Não pode ter a especialização Especialista em Técnicas"
   era só o chip de `restricoes`, e o criador deixava marcar. */
t("Sem Tecnica veta o Conjurador", OR.getOrigem("sem_tecnica").especializacoesVetadas, ["conjurador"]);
t("e so ele", ESP.especializacoesDisponiveis("sem_tecnica").map((e) => e.id),
  ["lutador", "combatente", "suporte", "controlador"]);
t("nenhuma outra origem veta nada",
  OR.AFTY_ORIGENS_CATALOG.filter((o) => o.especializacoesVetadas?.length).map((o) => o.id), ["sem_tecnica"]);
/* São 5 e não 6: o Restringido é `exclusivaOrigemId` e nunca aparece para
   origem nenhuma que não seja a dele. */
t("o Herdado continua com as 5 abertas", ESP.especializacoesDisponiveis("herdado").map((e) => e.id),
  ["lutador", "combatente", "conjurador", "suporte", "controlador"]);

/* ⚠ A OUTRA METADE DO NÃO VAZA: o canal existe no motor e não sai de ficha
   nenhuma sem alguém emitindo. */
const rawD = deriveAfty(ficha(12, "lutador", "herdado", false));
t("sem addon, reducao de requisito e zero", rawD.reduzNivelAptidao, 0);
t("sem addon, nenhuma vaga exclusiva de Estilo", rawD.orcamentoHabilidades.exclusivasEstilo, 0);

/* ============================================================ */
/* 2. `normalizarVariavel` É IDENTIDADE EM TODO ID DO RAW        */
/* ============================================================ */
/* O `esc_`, o `nivel_` e o `tem_` passaram a normalizar o nome em 2026-09-07,
   para o id de Addon (que traz `-` e `:`) virar identificador que o tokenizer
   aceita. Se a função mexesse num id do livro, TODA expressão do motor mudaria
   de alvo calada. Ela não mexe, e este bloco é o que garante. */
const idsDoRaw = [
  ...HAB.AFTY_HABILIDADES.map((h) => h.id),
  ...ESP.AFTY_ESPECIALIZACOES.map((e) => e.id),
  ...APT.AFTY_APTIDOES.map((a) => a.id),
];
t("nenhum id do raw muda ao normalizar",
  idsDoRaw.filter((id) => DSL.normalizarVariavel(id) !== id), []);
t("e um id de addon vira identificador legal",
  DSL.normalizarVariavel(ID), "especialista_em_estilo_esp_estilo");

/* ============================================================ */
/* 3. O PACOTE ENTRA                                             */
/* ============================================================ */

const aplicado = AD.aplicarAddons([PACOTE]);
t("instala sem problema", aplicado.problemas, []);
t("e o mundo o lista", aplicado.aplicados.map((p) => p.id), ["especialista-em-estilo"]);

const esp = ESP.getEspecializacao(ID);
t("a Especializacao existe", esp?.nome, "Especialista em Estilo");
t("e diz de quem herda", esp?.herdaDe, "conjurador");

/* ⚠ AS CARACTERÍSTICAS DESCEM INTEIRAS. O JSON do addon não repete um número
   sequer de PV, PE, perícia ou TR: se este bloco falhar, o addon virou uma
   classe sem corpo e a ficha calcularia PV de lugar nenhum. */
const mae = ESP.getEspecializacao("conjurador");
t("PE por nivel herdado", esp.caracteristicas.pePorNivel, mae.caracteristicas.pePorNivel);
t("mod de tecnica no PE herdado", esp.caracteristicas.peModTecnica, true);
t("PV herdado", esp.caracteristicas.pvPrimeiro, mae.caracteristicas.pvPrimeiro);
t("pericias herdadas", esp.caracteristicas.pericias, mae.caracteristicas.pericias);
t("treinamentos herdados", esp.treinamentos, mae.treinamentos);
t("mas o NOME e proprio", esp.nome !== mae.nome, true);

/* ============================================================ */
/* 4. A LISTA DE HABILIDADES CLONADA                             */
/* ============================================================ */

const clones = HAB.AFTY_HABILIDADES.filter((h) => h.especializacaoId === ID);
const doConjurador = HAB.AFTY_HABILIDADES.filter((h) => h.especializacaoId === "conjurador");
t("clonou as 65 do Conjurador", clones.length, 65);
t("e o Conjurador continua com as dele", doConjurador.length, 65);
t("o id do clone", clones[0].id, `${ID}__${doConjurador[0].id}`);
t("cada clone sabe de onde veio", clones.every((h) => h.herdadaDe && h.herdadaPor === ID), true);
t("o resolvedor de origem responde",
  HAB.habilidadeHerdadaDe(`${ID}__cnj_o_honrado`), "cnj_o_honrado");
t("e no raw ele nao responde", HAB.habilidadeHerdadaDe("cnj_o_honrado"), null);

/* O requisito que aponta para uma IRMÃ é remapeado. Sem isto, Combate
   Amaldiçoado pediria a habilidade do Conjurador de verdade, que a criatura
   nunca vai ter, e ficaria travada para sempre. */
const comReq = clones.find((h) => h.herdadaDe === "cnj_combate_amaldicoado");
t("requisito de irma aponta para o clone",
  comReq.requisitos.map((r) => r.id), [`${ID}__cnj_tecnicas_de_combate`]);

/* ⚠ AS OPÇÕES DE ESCOLHA NÃO SÃO REMAPEADAS, e é decisão. Elas são as mesmas
   Mudanças de Fundamento do livro, e o efeito de cada uma está no
   ESCOLHA_EFEITOS chaveado pelo id da opção. Renomear mataria os sete. */
const fundamentos = clones.find((h) => h.herdadaDe === "cnj_dominio_dos_fundamentos");
t("as opcoes seguem com o id do livro",
  fundamentos.escolha.opcoes.map((o) => o.id),
  HAB.MUDANCAS_DE_FUNDAMENTO.map((o) => o.id));

/* O efeito do raw viaja DENTRO do clone, porque o HABILIDADE_EFEITOS é chaveado
   por id e o clone tem id novo. Sem esta cópia, as linhas ligadas do Conjurador
   sumiriam caladas. */
const honrado = clones.find((h) => h.herdadaDe === "cnj_o_honrado");
t("o efeito do raw acompanha o clone", honrado.efeitos?.[0]?.canal, "cd");
/* ⚠ 17 desde 2026-09-07, quando o Conhecimento Aplicado ganhou efeito no Motor.
   Este número subindo é a PROVA de que ligar uma habilidade do Conjurador chega
   sozinha à herdeira: ninguém tocou no addon para isso acontecer. */
t("quantos clones trazem efeito", clones.filter((h) => h.efeitos).length, 17);

/* O remendo por clone: troca campo de UMA herdada, sem encostar na do livro. */
const aprimorada = clones.find((h) => h.herdadaDe === "cnj_conjuracao_aprimorada");
t("o remendo trocou o efeito", aprimorada.efeitos, [{ canal: "vagasEstilo", expr: "piso(esc_conjurador / 2)" }]);
t("e o texto fala de Estilo", aprimorada.descricao.includes("Técnica de Estilo"), true);
t("a do livro NAO foi tocada",
  HAB.getHabilidade("cnj_conjuracao_aprimorada").descricao.includes("Feitiços em todo nível"), true);
t("e ela continua sem efeito no motor", HAB.getHabilidade("cnj_conjuracao_aprimorada").efeitos, undefined);

/* ⚠ A HABILIDADE LIGADA NO LIVRO CHEGA À HERDEIRA, e o Conhecimento Aplicado é
   o primeiro caso vivo disso (2026-09-07). Ele ganhou efeito e estado de combate
   no catálogo do Conjurador, e o Especialista em Estilo passou a ter os dois sem
   ninguém tocar no addon. Isto mede as DUAS pontas. */
const conhecimento = clones.find((h) => h.herdadaDe === "cnj_conhecimento_aplicado");
t("o clone do Conhecimento Aplicado existe", !!conhecimento, true);
t("e o efeito do livro veio junto",
  conhecimento.efeitos, [{ canal: "bonusTR", expr: "2 * conhecimento_aplicado", duracao: "temporaria" }]);
/* A outra ponta: o estado de combate cita o id do LIVRO, e quem tem o clone
   precisa passar pelo portão. É o que `expandeHerdadas` resolve. */
t("expandeHerdadas devolve o id do livro",
  HAB.expandeHerdadas([conhecimento.id]), [conhecimento.id, "cnj_conhecimento_aplicado"]);
t("e nao inventa nada para quem nao herdou",
  HAB.expandeHerdadas(["cnj_conhecimento_aplicado"]), ["cnj_conhecimento_aplicado"]);

t("catalogo de Habilidade sao com o addon", HAB.validarCatalogoHabilidades(), []);

/* ============================================================ */
/* 5. QUEM ENXERGA, E QUEM NÃO                                   */
/* ============================================================ */

t("o Sem Tecnica ganha a variacao", ESP.especializacoesDisponiveis("sem_tecnica").map((e) => e.id),
  ["lutador", "combatente", "suporte", "controlador", ID]);
t("e continua sem o Conjurador",
  ESP.especializacoesDisponiveis("sem_tecnica").some((e) => e.id === "conjurador"), false);
/* ⚠ O `restritaOrigemIds` é o que segura isto. Um Herdado com o addon
   instalado na ficha dele NÃO vê a variação: ela é do Sem Técnica. */
t("o Herdado nao ve a variacao",
  ESP.especializacoesDisponiveis("herdado").some((e) => e.id === ID), false);
t("e continua com as 5 do livro", ESP.especializacoesDisponiveis("herdado").length, 5);
t("o Restringido continua trancado nele mesmo",
  ESP.especializacoesDisponiveis("restringido").map((e) => e.id), ["restringido"]);

/* A briga com a mãe, nos dois sentidos, com o campo declarado de um lado só. */
t("a variacao briga com o Conjurador", ESP.especializacaoIncompativel(ID, ["conjurador"]), "conjurador");
t("e o Conjurador briga com ela", ESP.especializacaoIncompativel("conjurador", [ID]), ID);
t("com o Lutador nao briga", ESP.especializacaoIncompativel(ID, ["lutador"]), null);
t("multiclasse com Lutador passa no normalize",
  ESP.normalizeEspecializacoes([{ id: ID, nivel: 6 }, { id: "lutador", nivel: 6 }], "sem_tecnica").map((e) => e.id),
  [ID, "lutador"]);
/* Ficha importada com o par proibido: entra a primeira e a segunda cai. */
t("o par proibido nao passa nem por JSON",
  ESP.normalizeEspecializacoes([{ id: ID, nivel: 6 }, { id: "conjurador", nivel: 6 }], "sem_tecnica").map((e) => e.id),
  [ID]);

/* A ficha velha de Sem Técnica com Conjurador: some da conta e é DITA. */
const velha = ficha(12, "conjurador");
t("a Especializacao vetada sai da ficha", deriveAfty(velha).especializacoes.escolhidas, []);
t("e a aba diz qual saiu", ESP.especializacoesRecusadas(velha).map((r) => r.id), ["conjurador"]);
t("com o motivo escrito", ESP.especializacoesRecusadas(velha)[0].motivo.includes("Sem Técnica"), true);
t("ficha normal nao acusa nada", ESP.especializacoesRecusadas(ficha(12, ID)), []);

/* ============================================================ */
/* 6. OS DOIS NÚMEROS QUE ELA MUDA                               */
/* ============================================================ */

/* Uma nova Técnica de Estilo a cada nível PAR. A expressão cita
   `esc_conjurador`, que é a outra metade da herança: o `deriveAfty` publica o
   nível da herdeira também sob o nome da mãe, e por isso as 16 expressões
   clonadas continuam valendo sem uma busca e troca em texto de DSL. */
for (const [nd, vagas] of [[4, 2], [7, 3], [8, 4], [20, 10]]) {
  t(`ND ${nd} da ${vagas} vagas de Estilo`,
    deriveAfty(ficha(nd, ID)).orcamentoHabilidades.exclusivasEstilo, vagas);
}
const d12 = deriveAfty(ficha(12, ID));
t("o nivel sai sob o nome da mae", d12.contextoDsl.esc_conjurador, 12);
t("e tambem sob o nome proprio", d12.contextoDsl[`esc_${DSL.normalizarVariavel(ID)}`], 12);
t("o nivel real tambem", d12.contextoDsl.nivel_conjurador, 12);

/* Adiantar a Evolução: −2 no pré-requisito de NÍVEL, e nada mais. */
t("a reducao chega ao derived", d12.reduzNivelAptidao, 2);
const ctxReq = { nd: 8, niveis: { au: 0, cl: 0, dom: 0, bar: 0, er: 0 }, reduzNivelAptidao: 2 };
t("Nivel 10 vira Nivel 8", APT.avaliarRequisitoAptidao({ tipo: "nd", valor: 10 }, ctxReq).ok, true);
t("e o rotulo mostra o numero efetivo",
  APT.avaliarRequisitoAptidao({ tipo: "nd", valor: 10 }, ctxReq).label, "Nível 8");
t("com o do livro no titulo",
  APT.avaliarRequisitoAptidao({ tipo: "nd", valor: 10 }, ctxReq).titulo, "Nível 10 no livro, reduzido para 8");
t("Nivel 11 ainda trava num ND 8",
  APT.avaliarRequisitoAptidao({ tipo: "nd", valor: 11 }, ctxReq).ok, false);
/* ⚠ O PISO É 1. Sem ele um requisito de Nível 2 viraria Nível 0, que não existe. */
t("o piso e Nivel 1", APT.avaliarRequisitoAptidao({ tipo: "nd", valor: 2 }, ctxReq).label, "Nível 1");
/* ⚠ E NUNCA A TRILHA (autor: *"Só requisito de Nível"*). */
t("a trilha NAO desce",
  APT.avaliarRequisitoAptidao({ tipo: "trilha", trilha: "au", valor: 3 }, { ...ctxReq, niveis: { au: 1 } }).ok, false);
t("nem o rotulo dela",
  APT.avaliarRequisitoAptidao({ tipo: "trilha", trilha: "au", valor: 3 }, ctxReq).label, "AU 3");

/* ============================================================ */
/* 7. O VERBO NÃO APARECE PARA QUEM NÃO PEDIU                    */
/* ============================================================ */
/* A lição do `hpAtributo`, escrita em `PRIMITIVAS`: acrescentar o verbo ao
   motor não é a tarefa inteira, falta dizer quem enxerga o verbo. */

t("o canal existe no motor", EF.EFEITO_CANAIS.some((c) => c.id === "reduzNivelAptidao"), true);
t("a primitiva que o mostra existe", AD.PRIMITIVAS.some((p) => p.id === "requisitoAptidao"), true);
t("e o pacote a pede", AD.normalizarPacote(PACOTE).permite, ["requisitoAptidao"]);
t("uma criatura sem addon nao ve primitiva nenhuma", AD.primitivasDaCriatura(ficha(12, "lutador", "herdado", false)), []);
t("e a com o addon ve so a que ele pediu", AD.primitivasDaCriatura(ficha(12, ID)), ["requisitoAptidao"]);
/* Nenhuma entrada do LIVRO emite o canal novo: ele é escape hatch de Addon. */
const EFC = await import(R + "afty-efeitos-conteudo.js");
const todosEfeitosDoRaw = [
  ...Object.values(EFC.HABILIDADE_EFEITOS),
  ...Object.values(EFC.ESCOLHA_EFEITOS),
  ...Object.values(EFC.TALENTO_EFEITOS),
  ...Object.values(EFC.APTIDAO_EFEITOS),
].flat();
t("nenhum efeito do livro emite o canal novo",
  todosEfeitosDoRaw.filter((e) => e?.canal === "reduzNivelAptidao"), []);

/* ============================================================ */
/* 8. A ORDEM DE RELIGAÇÃO, E O `caminhosDeId` DE LISTA DE STRING */
/* ============================================================ */
/* A herança só funciona porque `especializacoes` religa ANTES de `habilidades`.
   Até 2026-09-07 a ordem era a de import dos módulos, que ninguém controla. */
const familias = AD.familiasDeAddon().map((f) => f.id);
t("as duas familias estao registradas",
  familias.includes("especializacoes") && familias.includes("habilidades"), true);

/* Um pacote que traz a classe-mãe E a variação no mesmo JSON: a referência
   `herdaDe` acha o irmão e ganha o namespace, e a `incompativeisIds` também.
   ⚠ A segunda é uma LISTA DE STRING, forma que o `prefixarEntrada` ignorava
   calada até esta data. */
const irmas = {
  id: "duas-classes",
  nome: "Duas",
  paraRaw: "afty",
  acrescenta: {
    especializacoes: [
      { id: "esp_mae", nome: "Mãe", caracteristicas: ESP.getEspecializacao("lutador").caracteristicas },
      { id: "esp_filha", nome: "Filha", herdaDe: "esp_mae", incompativeisIds: ["esp_mae"] },
    ],
    habilidades: [{
      id: "hab_da_mae", nome: "Da Mãe", especializacaoId: "esp_mae",
      tipo: "base", nivel: 1, descricao: "x", requisitos: [],
    }],
  },
};
t("o pacote com as duas entra", AD.aplicarAddons([irmas]).problemas, []);
t("o herdaDe achou a irma", ESP.getEspecializacao("duas-classes:esp_filha").herdaDe, "duas-classes:esp_mae");
t("o incompativeisIds tambem", ESP.getEspecializacao("duas-classes:esp_filha").incompativeisIds,
  ["duas-classes:esp_mae"]);
t("e a filha herdou as caracteristicas da mae de addon",
  ESP.getEspecializacao("duas-classes:esp_filha").caracteristicas.pvPrimeiro, 12);
t("a habilidade da mae foi clonada para a filha",
  HAB.AFTY_HABILIDADES.filter((h) => h.especializacaoId === "duas-classes:esp_filha").map((h) => h.herdadaDe),
  ["duas-classes:hab_da_mae"]);

/* Herança de herança é REPROVADA, e não resolvida em cadeia. */
const neta = {
  id: "tres-classes", nome: "Tres", paraRaw: "afty",
  acrescenta: {
    especializacoes: [
      { id: "esp_a", nome: "A", caracteristicas: ESP.getEspecializacao("lutador").caracteristicas },
      { id: "esp_b", nome: "B", herdaDe: "esp_a" },
      { id: "esp_c", nome: "C", herdaDe: "esp_b" },
    ],
  },
};
const probsNeta = AD.aplicarAddons([neta]).problemas;
t("cadeia de heranca e reprovada", probsNeta.length > 0, true);
t("e a mensagem diz o motivo",
  JSON.stringify(probsNeta).includes("herança é de um degrau só"), true);

/* ============================================================ */
/* 9. DESINSTALAR NÃO DEIXA RESTO                                */
/* ============================================================ */

AD.limparAddons();
t("a Especializacao sumiu", ESP.getEspecializacao(ID), null);
t("os 65 clones sumiram", HAB.AFTY_HABILIDADES.filter((h) => h.herdadaDe).length, 0);
t("o resolvedor de origem esqueceu", HAB.habilidadeHerdadaDe(`${ID}__cnj_o_honrado`), null);
t("o Conjurador segue inteiro",
  HAB.AFTY_HABILIDADES.filter((h) => h.especializacaoId === "conjurador").length, 65);
t("e com o texto do livro",
  HAB.getHabilidade("cnj_conjuracao_aprimorada").descricao.includes("Feitiços em todo nível"), true);
t("o Sem Tecnica volta as 4", ESP.especializacoesDisponiveis("sem_tecnica").map((e) => e.id),
  ["lutador", "combatente", "suporte", "controlador"]);
t("catalogos sao depois de limpar",
  [...ESP.validarCatalogoEspecializacoes(), ...HAB.validarCatalogoHabilidades()], []);

/* ============================================================ */

if (bad.length) {
  console.error(`FALHAS (${bad.length}):`);
  for (const b of bad) console.error("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
