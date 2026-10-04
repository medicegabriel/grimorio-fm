/* REVISÃO DO SUPORTE CONTRA O LIVRO, 2026-09-29.

   A auditoria achou duas habilidades do Suporte que existiam no catálogo, no
   nível certo e com o texto certo, e não ligavam em NADA: o resolvedor
   consultava só os ids da especialização que chegou primeiro. É o mesmo buraco
   que o Controlador já tinha tido na Técnicas de Combate, e a correção é a
   mesma: registrar o id na estrutura que já era genérica.

     Sustentação Avançada (8) e Mestre (16)  o limite de feitiços sustentados
                                             lia só `cnj_*`
     Técnicas de Combate (2)                 o resolvedor lia só Conjurador e
                                             Controlador

   ⚠ O QUE ESTE ARQUIVO PRENDE NÃO É O NÚMERO NOVO, e sim os dois lados: que o
   Suporte passou a contar E que o Conjurador não mudou. Um conserto que
   consertasse o Suporte e quebrasse o Conjurador passaria num assert só do
   Suporte.

   ⚠ E prende o NÃO ACÚMULO. As duas famílias são degrau, não soma: quem tem a
   do Conjurador e a do Suporte na mesma ficha fica no teto do degrau, e não com
   a soma dos dois.

   Número e estrutura, nunca aparência. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");
const CC = await import(R + "afty-combate-conjurador.js");
const { AFTY_HABILIDADES } = await import(R + "afty-habilidades.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* O primeiro nível em que o efeito existe naquela duração, perguntado ao
   calculador em vez de cravado: a tabela é do livro. Mesmo padrão de
   `t-auxiliar-ligado.mjs`. */
const nivelValido = (duracao) => [1, 2, 3, 4, 5].find(
  (n) => F.calcularFeiticoAuxiliar(
    { tipo: "auxiliar", nivel: n, efeitoAux: "defesa", duracaoAux: duracao }, { nd: 20 },
  ).disponivel,
);
const nSus = nivelValido("sustentada");
const susAux = (id) => ({
  id, nome: `Aux ${id}`, tipo: "auxiliar", nivel: nSus, efeitoAux: "defesa", duracaoAux: "sustentada",
});

/* Uma ficha com TRÊS sustentados disponíveis, que é o que faz o teto aparecer:
   o resolvedor só desenha vaga enquanto houver feitiço para pôr nela. */
const fichaCom = (especId, habilidades) => {
  const f = createBlankAfty();
  f.core.nd = 20; f.core.nivel = 20;
  f.especializacoes = [{ id: especId, nivel: 20 }];
  f.habilidades = habilidades;
  f.feiticos = [susAux("s1"), susAux("s2"), susAux("s3")];
  f.combate = { ativo: true };
  return f;
};
const vagas = (especId, habilidades) => (deriveAfty(fichaCom(especId, habilidades)).combate?.estadosExtras ?? [])
  .filter((e) => String(e.id).startsWith("sustentacaoFeitico")).length;

/* ============================================================ */
/* 1. O CATÁLOGO DO SUPORTE, ANTES DE MEDIR EFEITO               */
/* ============================================================ */
/* Se um id mudar de nome, o resto do arquivo mediria outra coisa em silêncio. */
const sup = AFTY_HABILIDADES.filter((h) => h.especializacaoId === "suporte");
const achaSup = (id) => sup.find((h) => h.id === id);
t("Sustentação Avançada do Suporte é de nível 8", achaSup("sup_sustentacao_avancada")?.nivel, 8);
t("Sustentação Mestre do Suporte é de nível 16", achaSup("sup_sustentacao_mestre")?.nivel, 16);
t("e a Mestre exige a Avançada, como o livro manda",
  achaSup("sup_sustentacao_mestre")?.requisitos,
  [{ tipo: "habilidade", id: "sup_sustentacao_avancada" }]);
t("Técnicas de Combate do Suporte é de nível 2", achaSup("sup_tecnicas_de_combate")?.nivel, 2);

/* ============================================================ */
/* 2. AS VAGAS DE FEITIÇO SUSTENTADO                             */
/* ============================================================ */
/* Livro, nas duas especializações e com o MESMO texto: a Avançada dá "um
   feitiço sustentado adicional" e a Mestre deixa "manter três ao invés de
   dois". */
t("a tabela tem Defesa Sustentada em algum nível", !!nSus, true);
t("Suporte sem nenhuma das duas sustenta 1", vagas("suporte", []), 1);
t("Suporte com Sustentação Avançada sustenta 2",
  vagas("suporte", ["sup_sustentacao_avancada"]), 2);
t("Suporte com Sustentação Mestre sustenta 3",
  vagas("suporte", ["sup_sustentacao_avancada", "sup_sustentacao_mestre"]), 3);

/* ⚠ O OUTRO LADO: o Conjurador não pode ter mudado. */
t("Conjurador sem nada continua em 1", vagas("conjurador", []), 1);
t("Conjurador com a Avançada continua em 2",
  vagas("conjurador", ["cnj_sustentacao_avancada"]), 2);
t("Conjurador com a Mestre continua em 3",
  vagas("conjurador", ["cnj_sustentacao_avancada", "cnj_sustentacao_mestre"]), 3);

/* ⚠ NÃO ACUMULA. Multiclasse com as duas famílias fica no teto do degrau. */
t("as duas Avançadas juntas continuam valendo 2",
  vagas("suporte", ["cnj_sustentacao_avancada", "sup_sustentacao_avancada"]), 2);
t("as duas Mestres juntas continuam valendo 3",
  vagas("suporte", ["cnj_sustentacao_avancada", "cnj_sustentacao_mestre",
    "sup_sustentacao_avancada", "sup_sustentacao_mestre"]), 3);
/* E a Mestre de uma especialização vale com a Avançada da outra: o degrau é do
   EFEITO, e não da classe que o concedeu. */
t("a Mestre do Suporte sobe o teto mesmo com a Avançada do Conjurador",
  vagas("suporte", ["cnj_sustentacao_avancada", "sup_sustentacao_mestre"]), 3);

/* ============================================================ */
/* 3. A REDUÇÃO DE UPKEEP DA SUSTENTAÇÃO MESTRE                  */
/* ============================================================ */
/* "seu custo para sustentar feitiços é diminuído em 1, com um mínimo de 1",
   verbatim nas duas especializações. */
/* O upkeep só existe com o feitiço REALMENTE posto numa vaga: a vaga é um
   estado de opção, e vazia ela não sustenta nada. */
const upkeepDe = (habilidades) => {
  const f = fichaCom("suporte", habilidades);
  f.combate = { ativo: true, sustentacaoFeitico1: "s1" };
  const d = deriveAfty(f);
  const ativo = (d.auxiliaresAtivos?.ativos ?? []).find((a) => a.id === "s1");
  return ativo ? ativo.sustentacaoPE : null;
};
const semMestre = upkeepDe(["sup_sustentacao_avancada"]);
const comMestre = upkeepDe(["sup_sustentacao_avancada", "sup_sustentacao_mestre"]);
if (semMestre == null || comMestre == null) {
  t("o feitiço sustentado precisa estar ativo para medir o upkeep", [semMestre, comMestre], "ativo");
} else {
  t("a Sustentação Mestre do Suporte abate 1 do upkeep, com piso 1",
    comMestre, Math.max(1, semMestre - 1));
}

/* ============================================================ */
/* 4. TÉCNICAS DE COMBATE                                        */
/* ============================================================ */
/* Livro, Suporte (Livro de Regras, p. 105): "escolher duas armas quaisquer para
   se tornar treinado, caso não seja, e para poder utilizar Presença ou Sabedoria
   nas jogadas de ataque e dano enquanto as manejando."

   ⚠ ATÉ 2026-10-02 ESTE BLOCO PRENDIA O PAR ERRADO. Ele citava o texto do
   Conjurador (Inteligência ou Sabedoria) e cobrava esse par, e o assert ficava
   verde em cima do erro. O autor viu na tela: a Inteligência gravada pela do
   Conjurador continuava valendo depois de trocar para a do Suporte. */
const armasCat = [{ id: "espada_curta" }, { id: "adaga" }, { id: "cajado" }];
const cru = { tecnicasCombate: { armas: ["espada_curta", "adaga"], atributo: "inteligencia" } };
const tec = (habs) => CC.resolveTecnicasCombate(cru, armasCat, habs);

t("sem a habilidade, a Técnicas de Combate fica desligada",
  [tec([]).ativa, tec([]).armas, tec([]).atributosOk], [false, [], []]);
t("o Suporte liga a habilidade", tec(["sup_tecnicas_de_combate"]).ativa, true);
t("e escolhe DUAS armas, nunca três",
  [tec(["sup_tecnicas_de_combate"]).armas, tec(["sup_tecnicas_de_combate"]).max],
  [["espada_curta", "adaga"], 2]);
t("o par do Suporte é Presença ou Sabedoria",
  tec(["sup_tecnicas_de_combate"]).atributosOk, ["presenca", "sabedoria"]);
/* O caso relatado: a Inteligência gravada pela do Conjurador não vale no
   Suporte, e cai no primeiro do texto dele. */
t("a Inteligência gravada pelo Conjurador cai em Presença no Suporte",
  tec(["sup_tecnicas_de_combate"]).atributo, "presenca");
t("e volta a valer quando a do Conjurador é religada",
  tec(["cnj_tecnicas_de_combate"]).atributo, "inteligencia");
t("o par de cada card sai do motor, um por habilidade",
  [CC.atributosDasTecnicas(["cnj_tecnicas_de_combate"]),
    CC.atributosDasTecnicas(["ctr_tecnicas_de_combate"]),
    CC.atributosDasTecnicas(["sup_tecnicas_de_combate"]),
    CC.atributosDasTecnicas([])],
  [["inteligencia", "sabedoria"], ["presenca", "sabedoria"], ["presenca", "sabedoria"], []]);

/* ⚠ O OUTRO LADO, de novo: as duas que já existiam não podem ter mudado. */
t("o Conjurador continua com Inteligência ou Sabedoria",
  tec(["cnj_tecnicas_de_combate"]).atributosOk, ["inteligencia", "sabedoria"]);
t("o Controlador continua com Presença ou Sabedoria",
  tec(["ctr_tecnicas_de_combate"]).atributosOk, ["presenca", "sabedoria"]);
/* Multiclasse soma os pares sem repetir, na ordem do texto de cada uma. */
t("Suporte com Conjurador soma os dois pares, sem repetir Sabedoria",
  tec(["cnj_tecnicas_de_combate", "sup_tecnicas_de_combate"]).atributosOk,
  ["inteligencia", "sabedoria", "presenca"]);
t("Suporte com Controlador fica no mesmo par, porque é o mesmo texto",
  tec(["ctr_tecnicas_de_combate", "sup_tecnicas_de_combate"]).atributosOk,
  ["presenca", "sabedoria"]);

/* ============================================================ */
/* 5. E NÃO VAZA PARA O QUE A HABILIDADE NÃO COBRE               */
/* ============================================================ */
/* ⚠ ESTE É O BLOCO QUE IMPORTA MAIS. O texto diz "enquanto as manejando", então
   a troca de atributo vale SÓ nas duas armas escolhidas. O Combatente já teve o
   bug oposto em 2026-09-23, com bônus de classe vazando para o Feitiço, e o
   desenho por arma é o que impede isso aqui: a escolha é um Set de ids, lido
   dentro do laço das armas. */
const r = tec(["sup_tecnicas_de_combate"]);
t("a arma de fora não entra na lista", r.armas.includes("cajado"), false);
t("a lista é exatamente as escolhidas", r.armas.length, 2);
/* Uma arma inexistente no catálogo é descartada: o id gravado não vira efeito
   sozinho. */
const sujo = { tecnicasCombate: { armas: ["espada_curta", "arma_que_nao_existe"], atributo: "sabedoria" } };
t("id de arma que não existe no catálogo é descartado",
  CC.resolveTecnicasCombate(sujo, armasCat, ["sup_tecnicas_de_combate"]).armas, ["espada_curta"]);
/* Atributo gravado fora do par permitido cai no primeiro do texto, em vez de
   valer calado. */
const fora = { tecnicasCombate: { armas: ["adaga"], atributo: "forca" } };
t("atributo fora do par permitido cai no primeiro do texto",
  CC.resolveTecnicasCombate(fora, armasCat, ["sup_tecnicas_de_combate"]).atributo, "presenca");

/* ============================================================ */
/* 6. TÁTICAS DEFENSIVAS, SÓ A METADE DE QUEM TEM A HABILIDADE   */
/* ============================================================ */
/* Livro: "Você pode escolher um tipo de dano Elemental para que você e dois
   aliados sejam resistentes. Em um descanso longo, você pode trocar esses tipos
   de dano e os aliados recebendo o benefício."

   A sua resistência entra no motor. A dos dois aliados fica de mesa: ela mora na
   ficha deles e depende de quem são e de onde estão. */
const { ESCOLHA_EFEITOS } = await import(R + "afty-efeitos-conteudo.js");
const TATICAS = achaSup("sup_taticas_defensivas");

const fichaTaticas = (escolha) => {
  const c = createBlankAfty();
  c.core.nd = 10; c.core.nivel = 10;
  c.especializacoes = [{ id: "suporte", nivel: 10 }];
  c.habilidades = ["sup_taticas_defensivas"];
  if (escolha) c.escolhasHabilidade = { sup_taticas_defensivas: [escolha] };
  return deriveAfty(c);
};
/* Os tipos marcados como resistentes, lidos da aba de Resistências, que é quem
   resolve meia-dano por tipo. O canal é sinalizador e quem decide é ela. */
const resistentes = (d) => (d.defesasDano?.linhas ?? [])
  .filter((l) => (l.estados ?? []).includes("resistente"))
  .map((l) => l.tipo);

t("a habilidade é de nível 10 e pede uma escolha nesse nível",
  [TATICAS?.nivel, TATICAS?.escolha?.niveis], [10, [10]]);
t("as opções são os cinco tipos Elementais do livro",
  (TATICAS?.escolha?.opcoes ?? []).map((o) => o.id),
  ["sup_taticas_acido", "sup_taticas_congelante", "sup_taticas_chocante",
    "sup_taticas_queimante", "sup_taticas_sonico"]);
/* ⚠ A GUARDA DE DERIVA: as opções saem da categoria "elemental" e os efeitos
   estão escritos à mão no conteúdo, porque aquele arquivo não importa nada.
   Acrescentar um elemento sem acrescentar o efeito quebra AQUI, e não calado na
   mesa de alguém. */
t("toda opção da habilidade tem efeito declarado",
  (TATICAS?.escolha?.opcoes ?? []).filter((o) => !ESCOLHA_EFEITOS[o.id]?.length).map((o) => o.id),
  []);

t("sem escolher, nenhuma resistência", resistentes(fichaTaticas(null)), []);
t("escolhendo Queimante, só Queimante fica resistente",
  resistentes(fichaTaticas("sup_taticas_queimante")), ["queimante"]);
/* A troca do descanso longo É a própria escolha: o motor não guarda a anterior,
   então trocar não duplica nem deixa a antiga de pé. */
t("trocar para Ácido tira a resistência antiga",
  resistentes(fichaTaticas("sup_taticas_acido")), ["acido"]);
t("e nunca sobra mais de um tipo por escolha",
  resistentes(fichaTaticas("sup_taticas_sonico")).length, 1);

/* A fonte aparece com o nome da habilidade, que é a regra do projeto para todo
   número derivado. */
const dQuei = fichaTaticas("sup_taticas_queimante");
t("a resistência diz de onde veio",
  (dQuei.defesasDano.porTipo.queimante.fontesEstado.resistente ?? []).map((f) => f.label),
  ["Táticas Defensivas (Queimante)"]);

/* ⚠ E NÃO VAZA. Um tipo de fora da escolha continua sem estado nenhum, e a
   habilidade não mexe em RD, que é outra pilha. */
t("o tipo não escolhido continua sem estado",
  dQuei.defesasDano.porTipo.acido.estados, []);
t("e a habilidade não mexe na RD do tipo escolhido",
  dQuei.defesasDano.porTipo.queimante.rdProprio, 0);
/* Quem não tem a habilidade não recebe nada, mesmo com a escolha gravada na
   ficha (o caso de quem trocou de especialização). */
const semHab = (() => {
  const c = createBlankAfty();
  c.core.nd = 10; c.core.nivel = 10;
  c.especializacoes = [{ id: "suporte", nivel: 10 }];
  c.escolhasHabilidade = { sup_taticas_defensivas: ["sup_taticas_queimante"] };
  return deriveAfty(c);
})();
t("escolha gravada sem a habilidade não vale", resistentes(semHab), []);

/* 7. SUPORTE ABSOLUTO, ATRIBUTO DA CD DE ESPECIALIZAÇÃO.
   Autor, 2026-10-03: Presença ou Sabedoria nos dois sistemas. A Técnica em
   Inteligência tem modificador diferente para expor a regressão no número. */
for (const sistema of ["afty", "player"]) {
  for (const [presenca, sabedoria, esperado] of [[18, 14, 4], [12, 16, 3]]) {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 20; c.core.nivel = 20; c.core.tecnicaAttr = "inteligencia";
    c.especializacoes = [{ id: "suporte", nivel: 20 }];
    c.habilidades = ["sup_suporte_em_combate", "sup_suporte_absoluto"];
    c.attrMethod = "fixos";
    c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 20, presenca, sabedoria };
    const d = deriveAfty(c);
    const cura = d.cura.linhas.find((l) => l.id === "cura_suporte_em_combate");
    const tag = `[${sistema}] PRE ${presenca}, SAB ${sabedoria}`;
    t(`${tag}: Técnica em Inteligência tem modificador diferente`, d.modTecnica, 5);
    t(`${tag}: Suporte Absoluto soma Presença ou Sabedoria com fonte única`,
      cura?.partesFixas.filter((p) => p.label === "Suporte Absoluto").map((p) => p.valor), [esperado]);
  }
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
