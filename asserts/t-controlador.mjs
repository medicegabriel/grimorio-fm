/* CONTROLADOR: as 47 habilidades, o que cada uma liga e o que ela NÃO liga.

   ⚠ ESTE ARQUIVO NASCEU DE UM PODER MORTO. Em 2026-09-02, na revisão pedida
   pelo autor, `ctr_tecnicas_de_combate` estava no catálogo desde sempre e não
   fazia absolutamente nada: o resolvedor (`resolveTecnicasCombate`) conhecia só
   o id do CONJURADOR, e o seletor de armas da tela comparava com esse mesmo id.
   Pegar a habilidade num Controlador dava `ativa: false` e `armas: []`, ou seja,
   o resultado idêntico ao de não pegar nada. E junto morria a
   `ctr_combate_em_alcateia` (6°), que a exige como pré-requisito.

   Nenhum dos 2596 asserts pegou isso, porque nenhum media a PERGUNTA CERTA:
   "esta habilidade muda alguma coisa?". Os asserts mediam fórmulas de
   habilidades que já se sabia estarem ligadas.

   ------------------------------------------------------------
   O QUE ESTE ARQUIVO GARANTE
   ------------------------------------------------------------
   1. A LISTA FECHADA. Toda habilidade de Controlador está em UMA das duas
      listas abaixo: LIGADAS (muda número na ficha) ou DE_MESA (o efeito é
      procedimento, e não tem número que caiba numa ficha). Habilidade nova cai
      fora das duas e derruba o teste, que é a única forma de a próxima não
      nascer muda como esta nasceu.
   2. AS FÓRMULAS das ligadas, conferidas contra o texto do livro.
   3. OS PRÉ-REQUISITOS, conferidos contra a frase que os exige.

   ⚠ Estar em DE_MESA NÃO é atestado de qualidade: é a afirmação de que a
   ausência foi olhada e é intencional. Várias delas têm número (o Xd6 do
   Proteger Invocação, o +1 de Defesa por invocação adjacente da Guarda Viva) e
   estão anotadas em docs/a-fazer.md como lacuna de sistema, não como bug. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const D = await import(R + "afty-derive.js");
const S = await import(R + "afty-schema.js");
const H = await import(R + "afty-habilidades.js");
const I = await import(R + "afty-invocacoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const somaPartes = (l) => (l || []).reduce((a, p) => a + (Number(p.valor) || 0), 0);

/* ============================================================ */
/* 1. A LISTA FECHADA                                            */
/* ============================================================ */

/* Muda número na ficha, por qualquer uma das vias (efeito de invocação, canal
   do dono, marcador, roster, opção de uso). */
const LIGADAS = [
  "ctr_treinamento_em_controle", "ctr_apogeu", "ctr_controle_aprimorado",
  "ctr_reserva_para_invocacao", "ctr_apice_do_controle",
  "ctr_invocacoes_resistentes", "ctr_invocacoes_moveis", "ctr_invocacoes_treinadas",
  "ctr_visionario", "ctr_otimizacao_de_energia", "ctr_melhoria_de_controlador",
  "ctr_companheiro_amaldicoado", "ctr_tecnicas_de_combate",
  "ctr_potencial_superior", "ctr_autonomia", "ctr_critico_brutal", "ctr_invocacao_as",
  "ctr_concentrar_poder", "ctr_invocacoes_economicas", "ctr_aptidoes_de_controle",
  "ctr_buchas_de_canhao", "ctr_critico_aprimorado", "ctr_resistencia_sobrecarregada",
  "ctr_fantoche_supremo",
];

/* Procedimento de mesa: economia de ação, condição posicional, rolagem do
   inimigo, ou um custo em PE que a ficha não gasta sozinha. */
const DE_MESA = [
  "ctr_aceleracao", "ctr_camuflagem_aprimorada", "ctr_chamado_destruidor",
  "ctr_dor_partilhada", "ctr_frenesi_da_invocacao", "ctr_guarda_viva",
  "ctr_proteger_invocacao", "ctr_rede_de_deteccao",
  "ctr_acao_corretiva", "ctr_acompanhamento_amaldicoado", "ctr_ataque_em_conjunto",
  "ctr_companheiro_avancado", "ctr_domador_de_maldicoes", "ctr_invocacao_parcial",
  "ctr_combate_em_alcateia", "ctr_hoste_amaldicoada",
  "ctr_protecao_avancada_de_invocacao", "ctr_taticas_de_alcateia",
  "ctr_atacar_e_invocar", "ctr_golpes_ageis", "ctr_tecnicas_de_oportunidade",
  "ctr_mestre_do_controle", "ctr_flanco_avancado",
];

const todas = H.AFTY_HABILIDADES.filter((h) => h.especializacaoId === "controlador").map((h) => h.id);
const classificadas = new Set([...LIGADAS, ...DE_MESA]);
t("toda habilidade de Controlador está classificada",
  todas.filter((id) => !classificadas.has(id)), []);
t("nenhuma classificação aponta para habilidade que não existe",
  [...classificadas].filter((id) => !todas.includes(id)), []);
t("nenhuma habilidade está nas duas listas",
  LIGADAS.filter((id) => DE_MESA.includes(id)), []);
t("total de habilidades de Controlador", todas.length, 47);

/* ============================================================ */
/* 2. TÉCNICAS DE COMBATE: são DUAS, e o par de atributos difere */
/* ============================================================ */
const CJ = await import(R + "afty-combate-conjurador.js");

const comArma = (espec, habs, atributo) => {
  const c = S.createBlankAfty();
  c.core.nivel = 8;
  c.core.atributos = { forca: 10, destreza: 10, constituicao: 12, inteligencia: 12, sabedoria: 14, presenca: 18 };
  c.especializacoes = espec;
  c.habilidades = habs;
  c.equipamentos = { itens: [{ id: "e0", tipo: "arma", refId: "arm_adaga", qtd: 1, equipado: true }] };
  c.tecnicasCombate = { armas: ["arm_adaga"], atributo };
  return D.deriveAfty(c);
};
const CTR8 = [{ id: "controlador", nivel: 8 }];
const CNJ8 = [{ id: "conjurador", nivel: 8 }];
const adaga = (d) => (d.dano?.entradas ?? []).find((e) => e.fonte === "arma");

t("sem a habilidade, Técnicas de Combate fica inativa",
  comArma(CTR8, [], "presenca").tecnicasCombate.ativa, false);

/* ⚠ O ASSERT QUE PEGARIA O BUG DE 2026-09-02. */
t("Controlador com ctr_tecnicas_de_combate ativa a habilidade",
  comArma(CTR8, ["ctr_tecnicas_de_combate"], "presenca").tecnicasCombate.ativa, true);
t("Conjurador com cnj_tecnicas_de_combate ativa a habilidade",
  comArma(CNJ8, ["cnj_tecnicas_de_combate"], "inteligencia").tecnicasCombate.ativa, true);

t("a arma escolhida chega ao resolvedor (Controlador)",
  comArma(CTR8, ["ctr_tecnicas_de_combate"], "presenca").tecnicasCombate.armas, ["arm_adaga"]);

/* "utilizar Presença ou Sabedoria" contra "utilizar Inteligência ou Sabedoria". */
t("o par de atributos do Controlador é Presença ou Sabedoria",
  comArma(CTR8, ["ctr_tecnicas_de_combate"], "presenca").tecnicasCombate.atributosOk,
  ["presenca", "sabedoria"]);
t("o par de atributos do Conjurador é Inteligência ou Sabedoria",
  comArma(CNJ8, ["cnj_tecnicas_de_combate"], "inteligencia").tecnicasCombate.atributosOk,
  ["inteligencia", "sabedoria"]);
t("na multiclasse os dois pares se somam, sem repetir Sabedoria",
  comArma([...CTR8, ...CNJ8], ["ctr_tecnicas_de_combate", "cnj_tecnicas_de_combate"], "presenca")
    .tecnicasCombate.atributosOk,
  ["inteligencia", "sabedoria", "presenca"]);

/* Atributo guardado fora do par permitido cai no primeiro do texto, e NÃO
   passa: é o caso de quem trocou de especialização com o campo já gravado. */
t("Inteligência gravada num Controlador puro cai em Presença",
  comArma(CTR8, ["ctr_tecnicas_de_combate"], "inteligencia").tecnicasCombate.atributo, "presenca");
t("Presença gravada num Conjurador puro cai em Inteligência",
  comArma(CNJ8, ["cnj_tecnicas_de_combate"], "presenca").tecnicasCombate.atributo, "inteligencia");

/* E o efeito CHEGA na linha de dano da arma, que é o ponto de tudo. */
t("a linha da arma passa a usar Presença no Controlador",
  adaga(comArma(CTR8, ["ctr_tecnicas_de_combate"], "presenca"))?.atributo, "presenca");
/* Sem a habilidade a linha volta ao atributo natural da arma. Vale como
   contraprova do de cima: não é a ficha que empurra Presença, é a habilidade. */
t("sem a habilidade, a linha da arma usa o atributo natural dela",
  adaga(comArma(CTR8, [], "presenca"))?.atributo, "forca");

/* ============================================================ */
/* 3. ÁPICE DO CONTROLE: a cláusula entre parênteses             */
/* ============================================================ */
/* "você passa a poder invocar ou ativar suas invocações como uma ação livre
   (caso ela já pudesse ser invocada como Ação Livre, ela tem seu custo reduzido
   em 2 PE)". A primeira metade sempre esteve no roster; a segunda ficou de fora
   até 2026-09-02, e quem tinha Controle Concentrado não ganhava nada por ela. */
const ctr20 = (habs, estilo) => {
  const c = S.createBlankAfty();
  c.core.nivel = 20;
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.habilidades = habs;
  c.escolhasHabilidade = estilo ? { ctr_apogeu: [estilo] } : {};
  const inv = I.createBlankInvocacao("especial");
  inv.nome = "Nue";
  c.invocacoes = [inv];
  return D.deriveAfty(c);
};
const BASE20 = ["ctr_treinamento_em_controle", "ctr_apogeu"];
const APICE = [...BASE20, "ctr_apice_do_controle"];
const custoDe = (d) => d.invocacoes.lista[0].custo;

t("Grau Especial custa 12 PE sem nada", custoDe(ctr20(BASE20, null)), 12);
t("Controle Concentrado sozinho não abate custo", custoDe(ctr20(BASE20, "ctr_controle_concentrado")), 12);
t("Ápice sem estilo não abate custo", custoDe(ctr20(APICE, null)), 12);
t("Ápice + Controle Concentrado abate 2 PE", custoDe(ctr20(APICE, "ctr_controle_concentrado")), 10);
t("Ápice + Controle Disperso não abate", custoDe(ctr20(APICE, "ctr_controle_disperso")), 12);
t("o Ápice concede Ação Livre sozinho", ctr20(APICE, null).invocacoes.controle.invocarAcaoLivre, true);
t("as duas ações/características grátis do Ápice",
  ctr20(APICE, null).invocacoes.lista[0].orcamento.total
  - ctr20(BASE20, null).invocacoes.lista[0].orcamento.total, 2);

/* ============================================================ */
/* 4. AS FÓRMULAS DAS LIGADAS, contra o texto                    */
/* ============================================================ */
/* ⚠ O NÍVEL DA ESPECIALIZAÇÃO VEM DO ND (`core.nd`), e não do `core.nivel`.
   Mexer só no `core.nivel` deixa a especialização em 20 e o teste mede o nível
   errado sem reclamar de nada. */
const so = (habs, grau = "especial", nd = 20) => {
  const c = S.createBlankAfty();
  c.core.nd = nd;
  c.core.nivel = nd;
  c.especializacoes = [{ id: "controlador", nivel: nd }];
  c.habilidades = habs;
  const inv = I.createBlankInvocacao(grau);
  c.invocacoes = [inv];
  return D.deriveAfty(c).invocacoes.lista[0];
};
const delta = (campo, habs, grau = "especial", nd = 20) =>
  so(habs, grau, nd)[campo] - so([], grau, nd)[campo];

/* O valor que UMA habilidade emitiu num canal. É a régua certa para as
   AUTOMÁTICAS: `ctr_controle_aprimorado` é concedida sozinha a partir do nível
   4, então nenhum delta "com e sem" a isola. */
const emitido = (nome, canal, habs, grau = "especial", nd = 20) =>
  (so(habs, grau, nd).efeitosHabilidade?.detalhes ?? [])
    .filter((d) => d.nome === nome && d.canal === canal)
    .reduce((a, d) => a + d.valor, 0);

// "Pontos de Vida Máximos aumentam em BT x 5". BT no ND 20 é 6.
t("Invocações Resistentes: PV += BT x 5", delta("pv", ["ctr_invocacoes_resistentes"]), 30);
// "+1,5 metros. Nos níveis 6, 12 e 18 elas recebem +1,5 metros."
t("Invocações Móveis no nível 20: +6 m", delta("deslocamento", ["ctr_invocacoes_moveis"]), 6);
t("Invocações Móveis no nível 2: +1,5 m",
  delta("deslocamento", ["ctr_invocacoes_moveis"], "especial", 2), 1.5);
t("Invocações Móveis no nível 12: +4,5 m",
  delta("deslocamento", ["ctr_invocacoes_moveis"], "especial", 12), 4.5);
// "2 pontos de atributo adicionais por grau (2 para quarto grau, 10 para especial)"
t("Potencial Superior no Grau Especial: +10 pontos",
  so(["ctr_potencial_superior"]).atributos.total - so([]).atributos.total, 10);
t("Potencial Superior no Quarto Grau: +2 pontos",
  so(["ctr_potencial_superior"], "quarto").atributos.total - so([], "quarto").atributos.total, 2);
// "+2 em testes, aumentando +1 para cada grau acima do quarto"
t("Controle Aprimorado no Grau Especial: +6 em testes",
  emitido("Controle Aprimorado", "bonusTeste", []), 6);
t("Controle Aprimorado no Quarto Grau: +2 em testes",
  emitido("Controle Aprimorado", "bonusTeste", [], "quarto"), 2);
t("Controle Aprimorado não existe antes do nível 4",
  emitido("Controle Aprimorado", "bonusTeste", [], "especial", 3), 0);
// "perícias adicionais igual a metade do bônus de treinamento"
t("Invocações Treinadas: +3 vagas de perícia no ND 20",
  so(["ctr_invocacoes_treinadas"]).pericias.allowance - so([]).pericias.allowance, 3);
// "ações e/ou características aumenta em metade do BT, e o custo sobe normalmente"
t("Visionário: +3 no orçamento no ND 20",
  so(["ctr_visionario"]).orcamento.total - so([]).orcamento.total, 3);

/* ============================================================ */
/* 4b. AS QUATRO MELHORIAS CHEGAM NAS DUAS TELAS                 */
/* ============================================================ */
/* ⚠ ESTA SEÇÃO NASCEU DE UMA METADE MORTA (autor, 2026-09-04: *"Melhoria de
   Controlador: Precisão não está funcionando"*).

   A Precisão é a única habilidade do sistema que emite o canal `acerto` da
   invocação, e ele era lido em UM lugar só. O `resolveAcao` somava
   `dono.acertoHabilidade` na jogada de cada Ação, e o `resolveTestesInvocacao`,
   que monta a linha "Acerto" do stat block, não somava. Resultado: escolher
   "CD das Ações" mexia nos dois lugares (o `cd` já era lido nos dois) e
   escolher "Jogadas de Ataque" não mexia no número que a mesa olha primeiro.
   Metade de uma habilidade de escolha funcionava, e a outra metade não.

   ⚠ E O ASSERT DA SOMA NÃO PEGA ISSO. O `t-invocacoes-fontes.mjs` prende
   `soma(partes) == bonus` para a linha de Acerto, e ele passava: a parcela
   faltava nos DOIS lados da igualdade. O invariante prova que o painel explica
   o número que existe, e não que o número está certo.

   Por isso a régua aqui é outra: cada Melhoria tem de mover a SUA lista de
   números, e as duas superfícies (stat block e Ação) têm de andar juntas. */

const comMelhoria = (opcao, marcOpcao) => {
  const c = S.createBlankAfty();
  c.core.nd = 20; c.core.nivel = 20;
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.habilidades = opcao ? ["ctr_melhoria_de_controlador"] : [];
  if (opcao) c.escolhasHabilidade = { ctr_melhoria_de_controlador: [opcao] };
  const inv = I.createBlankInvocacao("especial");
  inv.id = "i1"; inv.ataqueTreinado = "corpo";
  /* Duas Ações, porque as duas metades da Precisão saem em lugares diferentes:
     a jogada de ataque numa, a CD na que força Teste de Resistência. */
  const jogada = I.createBlankAcao();
  jogada.id = "a1"; jogada.familia = "ataque"; jogada.ataqueTipo = "jogada"; jogada.classe = "simples";
  const porTR = I.createBlankAcao();
  porTR.id = "a2"; porTR.familia = "ataque"; porTR.ataqueTipo = "tr"; porTR.classe = "simples";
  inv.acoes = [jogada, porTR];
  const marc = { mel_agressividade: "mel_agressividade", mel_resistencia: "mel_resistencia",
    mel_mobilidade: "mel_mobilidade", mel_precisao: "mel_precisao" };
  const id = Object.keys(marc).find((k) => opcao && opcao.includes(k.replace("mel_", "")));
  if (id) { inv.marcadores = { [id]: true }; if (marcOpcao) inv.marcadorOpcoes = { [id]: marcOpcao }; }
  c.invocacoes = [inv];
  const r = D.deriveAfty(c).invocacoes.lista[0];
  return {
    acertoBloco: r.testes.acerto.corpo.bonus,
    acertoAcao: r.acoes[0].bonusAtaque,
    cdBloco: r.testes.cd,
    cdAcao: r.acoes[1].cd,
    defesa: r.defesa,
    rd: r.rd.geral,
    desloc: r.deslocamento,
    danoBonus: r.acoes[0].dano?.bonus ?? 0,
    dadoExtra: r.acoes[0].danoExtraAtaque?.dado ?? null,
  };
};
const semMelhoria = comMelhoria(null, null);

/* "+2 em Jogadas de Ataque ou CD", subindo nos níveis 4, 8, 16 e 18. No nível
   20 a fórmula fecha em 9, e a ESCOLHA decide qual dos dois recebe. */
const precAcerto = comMelhoria("ctr_melhoria_precisao", "acerto");
const precCd = comMelhoria("ctr_melhoria_precisao", "cd");

t("Precisao 'Jogadas de Ataque': o stat block E a Acao sobem os mesmos 9",
  [precAcerto.acertoBloco - semMelhoria.acertoBloco,
    precAcerto.acertoAcao - semMelhoria.acertoAcao], [9, 9]);
t("Precisao 'CD das Acoes': o stat block E a Acao por TR sobem os mesmos 9",
  [precCd.cdBloco - semMelhoria.cdBloco,
    precCd.cdAcao - semMelhoria.cdAcao], [9, 9]);
/* ⚠ E A ESCOLHA TEM DE EXCLUIR O OUTRO LADO. O `quando` de cada linha cita a
   variável da opção (`marc_mel_precisao_acerto` / `_cd`), e sem ela a Melhoria
   daria as duas coisas de graça, que é o dobro do que o livro escreve. */
t("e cada opcao deixa o outro lado exatamente onde estava",
  [precAcerto.cdBloco - semMelhoria.cdBloco, precAcerto.cdAcao - semMelhoria.cdAcao,
    precCd.acertoBloco - semMelhoria.acertoBloco, precCd.acertoAcao - semMelhoria.acertoAcao],
  [0, 0, 0, 0]);

/* As outras três, para a seção medir as quatro e não só a que quebrou. */
const agr = comMelhoria("ctr_melhoria_agressividade", null);
t("Agressividade: +6 no dano e 1d12 de dado extra no nivel 20",
  [agr.danoBonus - semMelhoria.danoBonus, agr.dadoExtra], [6, "1d12"]);
const res = comMelhoria("ctr_melhoria_resistencia", null);
t("Resistencia: +6 de Defesa e 5 de RD no nivel 20",
  [res.defesa - semMelhoria.defesa, res.rd - semMelhoria.rd], [6, 5]);
const mob = comMelhoria("ctr_melhoria_mobilidade", null);
t("Mobilidade: +9 m no nivel 20", mob.desloc - semMelhoria.desloc, 9);

/* ⚠ O COMPANHEIRO AMALDIÇOADO NÃO MOVE NÚMERO, e isso é o estado certo: o que
   ele concede é Apoiar como Ação Livre, que é economia de ação. O marcador
   existe para o Companheiro Avançado e a Invocação Ás saberem QUAL invocação é
   a companheira. Está prendido aqui para o silêncio dele ser declarado, e não
   confundido com o defeito que a Precisão tinha. */
t("Companheiro Amaldicoado nao emite canal nenhum",
  (H.MELHORIA_EFEITOS_INVOCACAO?.ctr_companheiro_amaldicoado ?? null), null);

/* ============================================================ */
/* 4c. "NÍVEL DO CONTROLADOR" É O ND                             */
/* ============================================================ */
/* Autor, 2026-09-04: *"Nível do Controlador é o ND e não o Nível da
   Especialização Controlador"*.

   ⚠ E NENHUM DOS 2744 ASSERTS PEGOU A TROCA, porque todos montam Controlador
   PURO com `nivel: nd`, e aí o nível da Especialização JÁ ERA o ND. O `so()`
   logo acima faz exatamente isso. A mudança só aparece em ficha onde os dois
   números se separam, que é o que esta seção monta.

   ⚠ Isto NÃO é o nível de pré-requisito. O que decide se a ficha PODE pegar uma
   Habilidade de Controlador continua sendo o nível REAL da Especialização, e há
   assert disso na seção 5. O ND diz o quanto ela ESCALA. */

const meioNivelDe = (esps, nd = 20) => {
  const c = S.createBlankAfty();
  c.core.nd = nd; c.core.nivel = nd;
  c.especializacoes = esps;
  const inv = I.createBlankInvocacao("especial");
  inv.id = "i1";
  c.invocacoes = [inv];
  const r = D.deriveAfty(c).invocacoes.lista[0];
  return r.testes.acerto.corpo.partes.find((p) => p.label === "Nível de Controlador")?.valor ?? 0;
};

/* Num Controlador puro os dois números batem, e é por isso que a troca passou
   despercebida: este caso vale 10 antes e depois. */
t("Controlador puro no ND 20: metade do nivel e 10",
  meioNivelDe([{ id: "controlador", nivel: 20 }]), 10);
/* ⚠ AQUI ELES SE SEPARAM. Na multiclasse o escalonamento do Controlador 6 era
   13 (6 real, mais metade dos 14 de Lutador), e a parcela valia 6. Agora é o ND
   inteiro nos dois. */
t("Controlador 6 / Lutador 14 no ND 20: vale o ND, e nao os 13 do escalonamento",
  meioNivelDe([{ id: "controlador", nivel: 6 }, { id: "lutador", nivel: 14 }]), 10);
t("Controlador 2 / Lutador 18 no ND 20: idem",
  meioNivelDe([{ id: "controlador", nivel: 2 }, { id: "lutador", nivel: 18 }]), 10);
/* ⚠ O CASO QUE MAIS MUDA, e o autor confirmou que vale: um shikigami de Feitiço
   ou de clã, num dono que nunca pegou a Especialização. A parcela valia ZERO. */
t("Lutador 20 com zero Controlador: a invocacao dele escala pelo ND do mesmo jeito",
  meioNivelDe([{ id: "lutador", nivel: 20 }]), 10);
/* E ele acompanha o ND, e não um degrau fixo. */
t("e a parcela segue o ND em outras faixas",
  [8, 12, 30].map((nd) => meioNivelDe([{ id: "lutador", nivel: nd }], nd)), [4, 6, 15]);

/* ============================================================ */
/* 4d. A CARACTERÍSTICA DE TESTE ENTRA NO NÚMERO                 */
/* ============================================================ */
/* Autor, 2026-09-04: *"o Corpo a Corpo com Gatilho, vc pode remover a parte do
   Gatilho. Somando o +5 da Caracteristica"*, estendido ao TR na mesma conversa.

   ⚠ A METADE CONTINUA VALENDO. O livro diz *"Caso seja em Jogadas de Ataque ou
   Testes de Resistência, o bônus é reduzido pela metade, assim como é necessário
   um gatilho específico"*, e o que saiu foi só a SEPARAÇÃO na tela: a tabela do
   Grau Especial dá +10 e o Ataque leva +5, não +10. O gatilho virou combinado
   de mesa, como o resto das condições que a ficha não confere. */

const comCaract = (usar) => {
  const i = I.createBlankInvocacao("especial");
  i.atributos = { forca: 10, destreza: 20, constituicao: 18, inteligencia: 16, sabedoria: 18, presenca: 10 };
  i.ataqueTreinado = "corpo";
  i.trProf = { fortitude: "treinado" };
  if (usar) {
    const a = I.createBlankCaracteristica();
    a.nome = "Olho Aguçado"; a.subtipo = "teste"; a.alvoTeste = "ataque";
    const b = I.createBlankCaracteristica();
    b.nome = "Couro Rijo"; b.subtipo = "teste"; b.alvoTeste = "tr"; b.trTipo = "fortitude";
    i.caracteristicas = [a, b];
  }
  const r = I.resolveInvocacao(i, { nd: 20, bt: 6 });
  return { r, acerto: r.testes.acerto.corpo, tr: r.testes.resistencias.find((x) => x.value === "fortitude") };
};
const semC = comCaract(false);
const comC = comCaract(true);

t("a Caracteristica soma no Acerto e no TR, e vale METADE da tabela do grau",
  [comC.acerto.bonus - semC.acerto.bonus, comC.tr.bonus - semC.tr.bonus], [5, 5]);
/* ⚠ O CAMPO `comGatilho` MORREU, e o assert prende a morte: enquanto ele
   existisse, uma tela poderia voltar a desenhar a pílula e mostrar o bônus
   DUAS vezes, uma no número e outra ao lado. */
t("o campo comGatilho nao existe mais em nenhuma das duas linhas",
  ["comGatilho" in comC.acerto, "comGatilho" in comC.tr], [false, false]);
/* E o painel fecha, com a parcela nomeada. */
t("o hover mostra a Caracteristica e fecha nos dois",
  [somaPartes(comC.acerto.partes) === comC.acerto.bonus,
    somaPartes(comC.tr.partes) === comC.tr.bonus,
    comC.acerto.partes.some((p) => p.label === "Característica"),
    comC.tr.partes.some((p) => p.label === "Característica")],
  [true, true, true, true]);
/* Contraprova: em PERÍCIA o bônus é CHEIO, e essa metade do livro não mudou. */
t("e na Pericia o bonus continua cheio, sem metade",
  (() => {
    const i = I.createBlankInvocacao("especial");
    i.periciasProf = { acrobacia: "treinado" };
    const c = I.createBlankCaracteristica();
    c.nome = "Pés Leves"; c.subtipo = "teste"; c.alvoTeste = "pericia"; c.periciaId = "acrobacia";
    i.caracteristicas = [c];
    const semP = I.resolveInvocacao({ ...i, caracteristicas: [] }, { nd: 20, bt: 6 });
    const comP = I.resolveInvocacao(i, { nd: 20, bt: 6 });
    const b = (x) => x.testes.pericias.find((p) => p.id === "acrobacia").bonus;
    return b(comP) - b(semP);
  })(), 10);

/* ============================================================ */
/* 5. OS PRÉ-REQUISITOS                                          */
/* ============================================================ */
/* Cada frase abaixo é a que EXIGE o pré-requisito, e está no texto da própria
   habilidade. Pré-requisito que suma daqui é galho solto: a habilidade passa a
   poder ser pega sem a base que ela cita. */
const req = (id) => (H.AFTY_HABILIDADES.find((h) => h.id === id)?.requisitos ?? [])
  .map((r) => r.id ?? `${r.habId}:${r.opcaoId}`).sort();

t("Companheiro Avançado exige Companheiro Amaldiçoado",
  req("ctr_companheiro_avancado"), ["ctr_companheiro_amaldicoado"]);
t("Invocação Às exige Companheiro Amaldiçoado",
  req("ctr_invocacao_as"), ["ctr_companheiro_amaldicoado"]);
t("Crítico Aprimorado exige Crítico Brutal",
  req("ctr_critico_aprimorado"), ["ctr_critico_brutal"]);
t("Resistência Sobrecarregada exige Invocações Resistentes",
  req("ctr_resistencia_sobrecarregada"), ["ctr_invocacoes_resistentes"]);
t("Proteção Avançada exige Proteger Invocação",
  req("ctr_protecao_avancada_de_invocacao"), ["ctr_proteger_invocacao"]);
t("Golpes Ágeis exige Acompanhamento Amaldiçoado",
  req("ctr_golpes_ageis"), ["ctr_acompanhamento_amaldicoado"]);
t("Flanco Avançado exige Táticas de Alcateia",
  req("ctr_flanco_avancado"), ["ctr_taticas_de_alcateia"]);
/* "Enquanto manejando uma arma escolhida em Técnicas de Combate" + o estilo. */
t("Combate em Alcateia exige Técnicas de Combate e o Controle Sintonizado",
  req("ctr_combate_em_alcateia"),
  ["ctr_apogeu:ctr_controle_sintonizado", "ctr_tecnicas_de_combate"]);
/* "Ao utilizar Criar Horda", e Criar Horda vem do Controle Disperso. */
t("Hoste Amaldiçoada exige o Controle Disperso",
  req("ctr_hoste_amaldicoada"), ["ctr_apogeu:ctr_controle_disperso"]);
/* "Caso possua a habilidade Concentrar Poder, enquanto estiver com apenas uma
   invocação marcada ativa": o benefício é do Controle Concentrado. */
t("Concentrar Poder exige o Controle Concentrado",
  req("ctr_concentrar_poder"), ["ctr_apogeu:ctr_controle_concentrado"]);

/* ⚠ E O PRÉ-REQUISITO BLOQUEIA DE VERDADE. Ter a linha no catálogo não prova
   nada: quem cobra é o `avaliarAcessoHabilidade`, e é ele que responde aqui. */
const acessoDe = (habs, alvo, escolhas = {}) => {
  const hab = H.AFTY_HABILIDADES.find((h) => h.id === alvo);
  return H.avaliarAcessoHabilidade(hab, {
    niveisPorEspec: { controlador: 20 },
    escolhidas: habs,
    escolhasHabilidade: escolhas,
  }).ok;
};
t("Crítico Aprimorado fica bloqueado sem Crítico Brutal",
  acessoDe([], "ctr_critico_aprimorado"), false);
t("Crítico Aprimorado libera com Crítico Brutal",
  acessoDe(["ctr_critico_brutal"], "ctr_critico_aprimorado"), true);
t("Combate em Alcateia fica bloqueado só com Técnicas de Combate",
  acessoDe(["ctr_tecnicas_de_combate"], "ctr_combate_em_alcateia"), false);
t("Combate em Alcateia libera com Técnicas de Combate e o Controle Sintonizado",
  acessoDe(["ctr_tecnicas_de_combate", "ctr_apogeu"], "ctr_combate_em_alcateia",
    { ctr_apogeu: ["ctr_controle_sintonizado"] }), true);
t("Hoste Amaldiçoada fica bloqueada com o estilo errado",
  acessoDe(["ctr_apogeu"], "ctr_hoste_amaldicoada",
    { ctr_apogeu: ["ctr_controle_concentrado"] }), false);
t("Hoste Amaldiçoada libera com o Controle Disperso",
  acessoDe(["ctr_apogeu"], "ctr_hoste_amaldicoada",
    { ctr_apogeu: ["ctr_controle_disperso"] }), true);

if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
