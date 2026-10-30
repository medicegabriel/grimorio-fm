import { register } from "node:module";
import { readFileSync } from "node:fs";

register(
  'data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const T = await import(R + "afty-talentos.js");
const H = await import(R + "afty-habilidades.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { valorCanal } = await import(R + "afty-efeitos.js");

const base = JSON.parse(readFileSync(new URL("../addons/talentos-de-estilo.json", import.meta.url), "utf8"));
const PROPRIO = "talentos-de-estilo:tal_estilo_proprio";
const INOVAR = "talentos-de-estilo:tal_inovar_estilo";
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

/* Conteúdo sintético, sem acrescentar variantes à biblioteca entregue. A tag
   "forca" prova que a troca de atributo respeita literais de contar(). O canal
   Atenção cobra também a transformação de quando, além da expressão numérica. */
const habilidade = (id, nome, efeitos, extra = {}) => ({
  id, nome, especializacaoId: "lutador", tipo: "nivel", nivel: 2,
  descricao: nome, requisitos: [], efeitos, ...extra,
});
const pacoteA = {
  id: "estilos-a", nome: "Estilos A", versao: "1.0.0", paraRaw: "afty",
  acrescenta: {
    habilidades: [
      habilidade("alvo", "Alvo A", [
        { canal: "rdGeral", expr: 'mod_forca + contar("forca")' },
        { canal: "atencao", expr: "forca", quando: "forca >= 14" },
      ], {
        tags: ["forca"],
        escolha: {
          id: "escolha_alvo_a", label: "Opção", niveis: [2, 4],
          opcoes: [
            { id: "opcao_forca_a", nome: "Opção de Força A", descricao: "Escala com o alvo.",
              efeitos: [{ canal: "rdGeral", expr: "mod_forca", grupoNaoAcumula: "estilos-a-aninhada" }] },
            { id: "opcao_concorrente_a", nome: "Opção Concorrente A", descricao: "Disputa com a primeira.",
              efeitos: [{ canal: "rdGeral", expr: "3", grupoNaoAcumula: "estilos-a-aninhada" }] },
          ],
        },
      }),
      habilidade("propria", "Habilidade Própria A", [{ canal: "rdGeral", expr: "mod_inteligencia" }]),
    ],
    opcoesTalento: [
      { id: "proprio", nome: "Próprio A", descricao: "Concede a habilidade A.", talentoId: PROPRIO, habilidadeId: "propria" },
      { id: "inovar", nome: "Inovar A", descricao: "O alvo A escala por Inteligência.", talentoId: INOVAR,
        requerHabilidade: "alvo", trocaAtributo: { de: "forca", para: "inteligencia" } },
    ],
  },
};
const pacoteB = {
  id: "estilos-b", nome: "Estilos B", versao: "1.0.0", paraRaw: "afty",
  acrescenta: {
    habilidades: [
      habilidade("alvo", "Alvo B", [{ canal: "rdGeral", expr: "mod_forca" }], {
        escolha: {
          id: "escolha_alvo_b", label: "Opção", niveis: [2],
          opcoes: [{ id: "opcao_forca_a", nome: "Opção Compartilhada B", descricao: "Outro pai para o mesmo id de opção.",
            efeitos: [{ canal: "rdGeral", expr: "mod_forca" }] }],
        },
      }),
      habilidade("propria", "Habilidade Própria B", [{ canal: "rdGeral", expr: "mod_sabedoria" }]),
    ],
    opcoesTalento: [
      { id: "proprio", nome: "Próprio B", descricao: "Concede a habilidade B.", talentoId: PROPRIO, habilidadeId: "propria" },
      { id: "inovar", nome: "Inovar B", descricao: "O alvo B escala por Sabedoria.", talentoId: INOVAR,
        requerHabilidade: "alvo", trocaAtributo: { de: "forca", para: "sabedoria" },
        efeitos: [{ canal: "movimento", expr: "2" }] },
    ],
  },
};
const todos = [base, pacoteA, pacoteB];
const ficha = (sistema, addons = todos) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 12, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.attributes = { forca: 12, destreza: 10, constituicao: 10, inteligencia: 18, sabedoria: 16, presenca: 10 };
  c.addons = structuredClone(addons);
  c.habilidades = ["estilos-a:alvo", "estilos-b:alvo"];
  c.talentos = [];
  c.escolhasTalento = {};
  return c;
};
const derive = (c) => { AD.aplicarAddons(c.addons); return deriveAfty(c); };
const canal = (d, nome) => valorCanal(d.efeitos, nome);
const escolhas = (d, talento) => d.talentos.escolhas.mapa[talento] ?? [];
const disponiveis = (d, talento) => d.talentos.escolhas.porTal[talento]?.disponiveis ?? [];

try {
  t("JSON base instalável", AD.validarPacote(base), []);
  t("Base só acrescenta dois talentos", (base.acrescenta.talentos ?? []).map((x) => x.id).sort(),
    ["tal_estilo_proprio", "tal_inovar_estilo"]);
  AD.aplicarAddons([base]);
  for (const id of [PROPRIO, INOVAR]) {
    t(id + ": escolha repetível", T.getTalento(id)?.escolha?.repetivel, true);
    t(id + ": caixa aberta por padrão", T.getTalento(id)?.escolha?.abertaPorPadrao, true);
    t(id + ": aceita opções vindas de addons", T.getTalento(id)?.escolha?.aceitaOpcoesAddon, true);
    t(id + ": catálogo inicial vazio", T.getTalento(id)?.escolha?.opcoes, []);
  }
  t("Pacote A instalável", AD.validarPacote(pacoteA), []);
  t("Pacote B instalável", AD.validarPacote(pacoteB), []);
  t("Dois pacotes são cumulativos", AD.aplicarAddons(todos).problemas, []);
  for (const id of [PROPRIO, INOVAR]) {
    const sufixo = id === PROPRIO ? "proprio" : "inovar";
    t(id + ": recebe opções dos dois addons", T.getTalento(id)?.escolha?.opcoes.map((o) => o.id),
      [`estilos-a:${sufixo}`, `estilos-b:${sufixo}`]);
  }
  t("Referência local ganha namespace", T.getOpcaoTalento("estilos-a:proprio")?.habilidadeId, "estilos-a:propria");
  t("Alvo local ganha namespace", T.getOpcaoTalento("estilos-a:inovar")?.requerHabilidade, "estilos-a:alvo");

  const trocaRuim = structuredClone(pacoteA);
  trocaRuim.acrescenta.opcoesTalento[1].trocaAtributo.para = "carisma";
  t("Instalação recusa atributo inválido", AD.validarPacote(trocaRuim).length > 0, true);
  const semAlvoDeclarado = structuredClone(pacoteA);
  delete semAlvoDeclarado.acrescenta.opcoesTalento[1].requerHabilidade;
  t("Troca exige declarar habilidade alvo", AD.validarPacote(semAlvoDeclarado).length > 0, true);

  for (const sistema of ["afty", "player"]) {
    const c = ficha(sistema);
    const inicial = derive(c);
    c.talentos = [PROPRIO];
    c.escolhasTalento = { [PROPRIO]: ["estilos-a:proprio"] };
    const propria = derive(c);
    t(sistema + ": talento concede habilidade real", propria.habilidades.efetivas.includes("estilos-a:propria"), true);
    t(sistema + ": concessão fica identificada", propria.habilidades.concedidas.includes("estilos-a:propria"), true);
    t(sistema + ": concessão não cobra habilidade extra", propria.habilidades.gastosHabilidade, inicial.habilidades.gastosHabilidade);
    t(sistema + ": uma variante custa uma vaga de talento", propria.talentos.gastos, 1);
    t(sistema + ": habilidade concedida produz efeito", canal(propria, "rdGeral") - canal(inicial, "rdGeral"), propria.mods.inteligencia);

    c.escolhasTalento[PROPRIO].push("estilos-b:proprio");
    const duas = derive(c);
    t(sistema + ": segunda variante custa outra vaga", duas.talentos.gastos, 2);
    t(sistema + ": duas habilidades concedidas sem vagas extras", duas.habilidades.gastosHabilidade, inicial.habilidades.gastosHabilidade);
    t(sistema + ": variantes dos dois addons acumulam", canal(duas, "rdGeral") - canal(inicial, "rdGeral"),
      duas.mods.inteligencia + duas.mods.sabedoria);

    c.talentos = [INOVAR];
    c.escolhasTalento = { [INOVAR]: ["estilos-a:inovar"] };
    const inovada = derive(c);
    t(sistema + ": inovação troca somente a fonte alvo e preserva literal", canal(inovada, "rdGeral") - canal(inicial, "rdGeral"),
      inovada.mods.inteligencia - inicial.mods.forca);
    t(sistema + ": atributo bruto e condição também mudam", canal(inovada, "atencao") - canal(inicial, "atencao"), inovada.attrEff.inteligencia);
    t(sistema + ": inovação não altera atributos da ficha", inovada.attrEff, inicial.attrEff);
    t(sistema + ": inovação não altera catálogo compartilhado", H.getHabilidade("estilos-a:alvo")?.efeitos[0].expr,
      'mod_forca + contar("forca")');
    t(sistema + ": inovação custa uma vaga", inovada.talentos.gastos, 1);

    const aninhada = structuredClone(c);
    aninhada.escolhasHabilidade = { "estilos-a:alvo": ["opcao_forca_a", "opcao_concorrente_a"] };
    const aninhadaD = derive(aninhada);
    t(sistema + ": inovação alcança opção aninhada sem perder seu grupo", canal(aninhadaD, "rdGeral") - canal(inovada, "rdGeral"),
      Math.max(3, aninhadaD.mods.inteligencia));
    t(sistema + ": fonte da inovação aparece no detalhe da habilidade", inovada.efeitos.detalhes.some((e) =>
      e.origem === "estilos-a:alvo" && e.canal === "rdGeral" && e.nome.includes("Inovar Estilo")), true);
    t(sistema + ": fonte aninhada conserva inovação e vencedor", aninhadaD.efeitos.detalhes.some((e) =>
      e.origem === "opcao_forca_a" && e.canal === "rdGeral" && !e.suplantado && e.nome.includes("Inovar Estilo")), true);
    const compartilhada = structuredClone(c);
    compartilhada.escolhasHabilidade = {
      "estilos-a:alvo": ["opcao_forca_a"], "estilos-b:alvo": ["opcao_forca_a"],
    };
    const compartilhadaD = derive(compartilhada);
    t(sistema + ": opção com id compartilhado só muda sob a habilidade alvo",
      canal(compartilhadaD, "rdGeral") - canal(inovada, "rdGeral"),
      compartilhadaD.mods.inteligencia + compartilhadaD.mods.forca);

    const pacoteDaCriada = structuredClone(pacoteA);
    pacoteDaCriada.acrescenta.opcoesTalento[1].requerHabilidade = "propria";
    pacoteDaCriada.acrescenta.opcoesTalento[1].trocaAtributo = { de: "inteligencia", para: "sabedoria" };
    const criada = ficha(sistema, [base, pacoteDaCriada, pacoteB]);
    criada.talentos = [PROPRIO, INOVAR];
    criada.escolhasTalento = { [PROPRIO]: ["estilos-a:proprio"], [INOVAR]: [] };
    const criadaBase = derive(criada);
    criada.escolhasTalento[INOVAR] = ["estilos-a:inovar"];
    const criadaInovada = derive(criada);
    t(sistema + ": inovação enxerga habilidade concedida no mesmo cálculo", escolhas(criadaInovada, INOVAR), ["estilos-a:inovar"]);
    t(sistema + ": habilidade própria também pode ser inovada", canal(criadaInovada, "rdGeral") - canal(criadaBase, "rdGeral"),
      criadaInovada.mods.sabedoria - criadaBase.mods.inteligencia);

    c.escolhasTalento[INOVAR].push("estilos-b:inovar");
    const inovadas = derive(c);
    t(sistema + ": inovações diferentes acumulam", canal(inovadas, "rdGeral") - canal(inicial, "rdGeral"),
      inovadas.mods.inteligencia + inovadas.mods.sabedoria - 2 * inicial.mods.forca);
    t(sistema + ": efeito adicional da opção chega ao motor", canal(inovadas, "movimento") - canal(inicial, "movimento"), 2);
    t(sistema + ": duas inovações custam duas vagas", inovadas.talentos.gastos, 2);
    const salva = JSON.parse(JSON.stringify(c));
    const reaberta = derive(salva);
    t(sistema + ": escolhas sobrevivem à exportação", salva.escolhasTalento, c.escolhasTalento);
    t(sistema + ": efeito sobrevive à reimportação", canal(reaberta, "rdGeral"), canal(inovadas, "rdGeral"));

    const semAlvo = structuredClone(c);
    semAlvo.habilidades = [];
    const semAlvoBase = structuredClone(semAlvo);
    semAlvoBase.talentos = [];
    const semAlvoD = derive(semAlvo);
    const semAlvoBaseD = derive(semAlvoBase);
    t(sistema + ": alvo ausente deixa inovação inativa", canal(semAlvoD, "rdGeral"), canal(semAlvoBaseD, "rdGeral"));
    t(sistema + ": alvo ausente desliga também efeitos próprios da opção", canal(semAlvoD, "movimento"), canal(semAlvoBaseD, "movimento"));
    t(sistema + ": alvo ausente conserva seleção gravada", semAlvo.escolhasTalento, c.escolhasTalento);

    const removida = structuredClone(c);
    removida.addons = [structuredClone(base), structuredClone(pacoteB)];
    const depoisDeRemover = derive(removida);
    t(sistema + ": remover pacote A retira só sua opção", escolhas(depoisDeRemover, INOVAR), ["estilos-b:inovar"]);
    t(sistema + ": remoção preserva ids salvos", removida.escolhasTalento, c.escolhasTalento);
    t(sistema + ": remoção informa linha de addon ausente", depoisDeRemover.addonProblemas.length > 0, true);
    removida.addons = structuredClone(todos);
    t(sistema + ": reativar pacote recupera efeito", canal(derive(removida), "rdGeral"), canal(inovadas, "rdGeral"));

    const soOpcao = { id: "estilos-so-opcoes", nome: "Somente Opções", versao: "1.0.0", paraRaw: "afty",
      acrescenta: { opcoesTalento: [{ id: "extra", nome: "Variante Extra", descricao: "Variante sem habilidade no pacote.",
        talentoId: PROPRIO, efeitos: [{ canal: "rdGeral", expr: "2" }] }] } };
    const opcaoSemHabilidade = ficha(sistema, [...todos, soOpcao]);
    opcaoSemHabilidade.talentos = [PROPRIO];
    opcaoSemHabilidade.escolhasTalento = { [PROPRIO]: ["estilos-so-opcoes:extra"] };
    derive(opcaoSemHabilidade);
    opcaoSemHabilidade.addons = structuredClone(todos);
    const opcaoRemovida = derive(opcaoSemHabilidade);
    t(sistema + ": remoção de pacote só com opções informa id órfão", opcaoRemovida.addonProblemas.some((p) =>
      p.id === "estilos-so-opcoes:extra" && p.familia === "opcoesTalento"), true);

    /* Encontro: os catálogos contêm a união, mas opções e concessões pertencem
       à ficha que tem o pacote. Os ids estrangeiros ficam salvos para permitir
       religar o addon depois, sem emprestar os benefícios da outra ficha. */
    const soA = ficha(sistema, [base, pacoteA]);
    soA.habilidades = ["estilos-a:alvo"];
    soA.talentos = [PROPRIO, INOVAR];
    soA.escolhasTalento = { [PROPRIO]: ["estilos-a:proprio", "estilos-b:proprio"], [INOVAR]: ["estilos-a:inovar", "estilos-b:inovar"] };
    const soB = ficha(sistema, [base, pacoteB]);
    soB.habilidades = ["estilos-b:alvo"];
    soB.talentos = [PROPRIO, INOVAR];
    const soAD = derive(soA);
    const uniao = AD.unirAddons([soA, soB]);
    t(sistema + ": união de encontro aceita os três pacotes", AD.aplicarAddons(uniao.pacotes).problemas, []);
    const encontroA = deriveAfty(soA);
    const encontroB = deriveAfty(soB);
    t(sistema + ": encontro mostra só opções da ficha A", disponiveis(encontroA, PROPRIO), ["estilos-a:proprio"]);
    t(sistema + ": encontro mostra só opções da ficha B", disponiveis(encontroB, PROPRIO), ["estilos-b:proprio"]);
    t(sistema + ": seleção estrangeira não concede habilidade no encontro", encontroA.habilidades.efetivas.includes("estilos-b:propria"), false);
    t(sistema + ": encontro conserva efeito individual", canal(encontroA, "rdGeral"), canal(soAD, "rdGeral"));
    t(sistema + ": derivar encontro preserva união dos catálogos", !!H.getHabilidade("estilos-b:propria"), true);

    const semBase = ficha(sistema, [pacoteA]);
    semBase.habilidades = ["estilos-a:alvo"];
    semBase.talentos = [PROPRIO, INOVAR];
    semBase.escolhasTalento = { [PROPRIO]: ["estilos-a:proprio"], [INOVAR]: ["estilos-a:inovar"] };
    const semBaseIndividual = derive(semBase);
    AD.aplicarAddons([base, pacoteA]);
    const semBaseNoEncontro = deriveAfty(semBase);
    t(sistema + ": base só no mundo unido não concede habilidade", semBaseNoEncontro.habilidades.efetivas.includes("estilos-a:propria"), false);
    t(sistema + ": base só no mundo unido não cobra os talentos", semBaseNoEncontro.talentos.gastos, 0);
    t(sistema + ": base desligada também custa zero individualmente", semBaseIndividual.talentos.gastos, 0);
    t(sistema + ": base só no mundo unido não emite inovação", [canal(semBaseNoEncontro, "rdGeral"), canal(semBaseNoEncontro, "atencao")],
      [canal(semBaseIndividual, "rdGeral"), canal(semBaseIndividual, "atencao")]);
    t(sistema + ": base ausente conserva escolhas guardadas", semBase.escolhasTalento,
      { [PROPRIO]: ["estilos-a:proprio"], [INOVAR]: ["estilos-a:inovar"] });

    const pacoteDependente = structuredClone(pacoteA);
    pacoteDependente.acrescenta.opcoesTalento[0].habilidadeId = "estilos-b:propria";
    pacoteDependente.acrescenta.opcoesTalento[1].requerHabilidade = "estilos-b:alvo";
    const dependente = ficha(sistema, [base, pacoteDependente]);
    dependente.talentos = [PROPRIO];
    dependente.habilidades = ["estilos-a:alvo"];
    dependente.escolhasTalento = { [PROPRIO]: ["estilos-a:proprio"] };
    AD.aplicarAddons([base, pacoteDependente, pacoteB]);
    const dependenteD = deriveAfty(dependente);
    t(sistema + ": opção local não concede habilidade de addon externo desligado", dependenteD.habilidades.efetivas.includes("estilos-b:propria"), false);
    t(sistema + ": opção com dependência externa desligada não aparece disponível", disponiveis(dependenteD, PROPRIO), []);
    dependente.talentos = [INOVAR];
    dependente.habilidades.push("estilos-b:alvo");
    dependente.escolhasTalento = { [INOVAR]: ["estilos-a:inovar"] };
    const dependenteSemInovacao = structuredClone(dependente);
    dependenteSemInovacao.talentos = [];
    const dependenteSemInovacaoD = deriveAfty(dependenteSemInovacao);
    const dependenteInovadaD = deriveAfty(dependente);
    t(sistema + ": alvo estrangeiro guardado não habilita inovação sem seu addon", escolhas(dependenteInovadaD, INOVAR), []);
    t(sistema + ": addon externo só no mundo unido não muda escalonamento", canal(dependenteInovadaD, "rdGeral"),
      canal(dependenteSemInovacaoD, "rdGeral"));
  }
} finally {
  AD.limparAddons();
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
