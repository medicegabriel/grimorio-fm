/* A REVISÃO DO ESPECIALISTA EM COMBATE (Combatente) CONTRA O LIVRO, 2026-09-23.

   Pedido do autor: conferir a classe inteira contra o Livro F&M 2.5.2 e corrigir
   o que estava comprovadamente errado, sem recriar a classe. Este arquivo prende
   o que a revisão mediu, em ordem:

     1. A PROGRESSÃO, num jogador Combatente puro nos níveis 1, 4, 6, 8, 12, 16 e
        20: PV, PE, Bases concedidas, Estilos, Posturas, Implemento Marcial,
        Estilo Defensivo, Duelista e Pontos de Preparo.

     2. ⚠ NADA DO COMBATENTE VAZA PARA FEITIÇO. Autossuficiente, Arsenal Cíclico,
        Estilo Duplo, Estilo do Duelista e Precisão Definitiva eram efeitos sem
        alvo, e a linha de Feitiço lê o valor sem alvo junto do dela: um Feitiço
        de Nível 1 saía com 5d8 em vez de 4d8 no nível 20. Agora eles miram arma e
        Ataque Básico (o Básico fica pela decisão do autor de 2026-09-16, presa em
        t-niveis-dano.mjs).

     3. ⚠ O ESPÍRITO INCANSÁVEL USA A RÉGUA DO SISTEMA. "Os pontos de vida
        temporários [...] se tornam o seu bônus de ataque", e no jogador a jogada
        usa metade do nível, e não Nível ÷ 1,5.

     4. ⚠ A POSTURA COM "PRÉ-REQUISITO: NÍVEL N" TRAVA. Nível de escalonamento
        (o do Combatente mais a metade das outras classes), por decisão do autor.
        A mesma trava vale para Feitiço Rápido e Apoio Estratégico.

     5. O GRUPO FAVORITO ESCOLHE O GRUPO.

     6. OS PONTOS DE PREPARO NA SESSÃO: gastar, recuperar, os dois limites,
        aparar quando o máximo cai e encher no descanso. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const H = await import(R + "afty-habilidades.js");
const FE = await import(R + "afty-feiticos.js");
const { ARMA_GRUPOS } = await import(R + "afty-equipamentos.js");
const S = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ARMA = "arm_espada_curta";
/* Jogador Combatente com uma arma e um Feitiço de dano de Nível 1, para os dois
   lados do vazamento aparecerem na mesma ficha. */
const ficha = (nivel, o = {}) => {
  const {
    sistema = "player", esp = null, habs = [], escolhas = {}, combate = null,
    attrs = {}, feitico = true,
  } = o;
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "combatente", patamar: "comum" };
  f.especializacoes = esp ?? [{ id: "combatente", nivel }];
  f.attributes = {
    forca: 16, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 14, presenca: 10, ...attrs,
  };
  f.habilidades = habs;
  f.escolhasHabilidade = escolhas;
  f.equipamentos = { itens: [{ id: "e0", tipo: "arma", refId: ARMA, qtd: 1, equipado: true }] };
  if (feitico) {
    f.feiticos = [{ ...FE.createBlankFeitico(), id: "fx", nome: "Raio", tipo: "dano", nivel: 1, resolucao: "ataque" }];
  }
  if (combate) f.combate = { ativo: true, ...combate };
  return f;
};
const d = (nivel, o) => deriveAfty(ficha(nivel, o));
const linha = (der, id) => der.dano.entradas.find((x) => x.id === id);
const feitico = (der) => der.feiticos.lista.find((x) => x.id === "fx").rolagens[0];
const NIVEIS = [1, 4, 6, 8, 12, 16, 20];

/* ============================================================ */
/* 1. A PROGRESSÃO                                               */
/* ============================================================ */

/* "No primeiro nível seu máximo de vida é 12 + Modificador de Constituição" e
   "aumenta em [...] 6 + Modificador de Constituição". Constituição 10. */
t("PV por nivel: 12 no primeiro e 6 por nivel seguinte",
  NIVEIS.map((n) => d(n).hp), NIVEIS.map((n) => 12 + 6 * (n - 1)));
t("PE: 4 por nivel, sem o modificador da tecnica",
  NIVEIS.map((n) => d(n).pe), NIVEIS.map((n) => 4 * n));

/* As Bases chegam sozinhas no jogador, nos níveis do texto: Repertório e Artes
   (1), Golpe Especial e Implemento Marcial (4), Renovação pelo Sangue (6) e
   Autossuficiente (20). */
t("Bases concedidas por nivel",
  NIVEIS.map((n) => H.habilidadesConcedidasPelasEspecializacoes([{ id: "combatente", nivel: n }], "player")
    .filter((id) => id.startsWith("cmb_")).length),
  [2, 4, 5, 5, 5, 5, 6]);

// "Você recebe um novo estilo de combate no nível 6 e outro no 12."
const vagas = (nivel, habId, o = {}) => d(nivel, o).habilidades.escolhas.porHab[habId]?.allowance ?? 0;
t("Estilos permitidos por nivel",
  NIVEIS.map((n) => vagas(n, "cmb_repertorio_do_especialista")), [1, 1, 2, 2, 3, 3, 3]);
t("Acervo Amplo soma mais um Estilo",
  vagas(12, "cmb_repertorio_do_especialista", { habs: ["cmb_acervo_amplo"] }), 4);
/* Assumir Postura: uma ao obter, "Nos níveis 8 e 16 você aprende outra". */
t("Posturas permitidas por nivel com Assumir Postura",
  NIVEIS.map((n) => vagas(n, "cmb_assumir_postura", { habs: ["cmb_assumir_postura"] })),
  [0, 1, 1, 2, 2, 3, 3]);
/* No 10 o Assumir já dá duas (2 e 8), e o Aprender soma as duas dele (4 e 10). */
t("Aprender Postura soma uma no 4 e outra no 10",
  [4, 10].map((n) => vagas(n, "cmb_assumir_postura", { habs: ["cmb_assumir_postura", "cmb_aprender_postura"] })),
  [2, 4]);

/* Implemento Marcial: "+2 na CD [...] aumenta em 1 nos níveis 8° e 16°". */
const parteCd = (der, rotulo) => (der.partes?.cd ?? []).find((p) => p.label === rotulo)?.valor ?? 0;
t("Implemento Marcial na CD por nivel",
  NIVEIS.map((n) => parteCd(d(n), "Implemento Marcial")), [0, 2, 2, 3, 3, 4, 4]);

/* Estilo Defensivo: "Sua Defesa aumenta em 2 e, nos níveis 4, 8, 12 e 16
   aumenta em +1." */
const defesaCom = (n) => d(n, { escolhas: { cmb_repertorio_do_especialista: ["cmb_estilo_defensivo"] } }).defesa;
t("Estilo Defensivo na Defesa por nivel",
  NIVEIS.map((n) => defesaCom(n) - d(n).defesa), [2, 3, 3, 4, 5, 6, 6]);

/* Estilo do Duelista: "+1 em rolagens de acerto e +2 em rolagens de dano. Nos
   níveis 4, 8, 12 e 16, o bônus em dano aumenta em +1; nos níveis 8 e 16, o
   bônus em acerto aumenta em +1." */
const duelo = (n, ligado) => d(n, {
  escolhas: { cmb_repertorio_do_especialista: ["cmb_estilo_do_duelista"] },
  combate: ligado ? { duelando: true } : {},
});
const deltaArma = (n, campo) => linha(duelo(n, true), ARMA)[campo] - linha(duelo(n, false), ARMA)[campo];
t("Duelista no acerto da arma por nivel", NIVEIS.map((n) => deltaArma(n, "acerto")), [1, 1, 1, 2, 2, 3, 3]);
t("Duelista no dano da arma por nivel", NIVEIS.map((n) => deltaArma(n, "fixo")), [2, 3, 3, 4, 5, 6, 6]);

/* Pontos de Preparo: "igual ao seu nível de Especialista em Combate +
   Modificador de Sabedoria", com piso de 1 (autor, 2026-09-01). */
t("Pontos de Preparo por nivel com Sabedoria 14",
  NIVEIS.map((n) => d(n).pontosPreparo), NIVEIS.map((n) => n + 2));
t("e o piso de 1 com Sabedoria 6 no primeiro nivel",
  d(1, { attrs: { sabedoria: 6 } }).pontosPreparo, 1);
/* ⚠ PONTO DE VERIFICAÇÃO, e não correção. O livro diz "nível de Especialista
   em Combate", e o efeito lê `esc_combatente`, o nível de ESCALONAMENTO (o do
   Combatente mais a metade das outras classes), que é a régua do projeto para
   todo efeito que escala (a mesma do Implemento Marcial e dos Estilos). Numa
   multiclasse Combatente 4 / Lutador 6 são 4 + 3 = 7, e não 4. Preso aqui para
   a mudança, se o autor decidir, aparecer. */
t("na multiclasse o Preparo segue o nivel de escalonamento",
  d(10, { esp: [{ id: "combatente", nivel: 4 }, { id: "lutador", nivel: 6 }] }).pontosPreparo, 7 + 2);

/* ============================================================ */
/* 2. NADA VAZA PARA O FEITIÇO                                   */
/* ============================================================ */
const base19 = d(19);
const base20 = d(20);
t("Autossuficiente soma um dado na arma",
  linha(base20, ARMA).dadosExtras - linha(base19, ARMA).dadosExtras, 1);
t("e no Ataque Basico",
  linha(base20, "basico").dadosExtras - linha(base19, "basico").dadosExtras, 1);
t("e NAO no Feitico de dano", [feitico(base19).dados, feitico(base20).dados], [4, 4]);
t("nem aparece no hover do Feitico", feitico(base20).partes.map((p) => p.label), []);

const CASOS = {
  "Arsenal Ciclico": { habs: ["cmb_arsenal_ciclico"], combate: { arsenalCiclico: true } },
  "Estilo do Duelista": { escolhas: { cmb_repertorio_do_especialista: ["cmb_estilo_do_duelista"] }, combate: { duelando: true } },
  "Estilo Duplo": { escolhas: { cmb_repertorio_do_especialista: ["cmb_estilo_duplo"] }, combate: { lutandoComDuasArmas: true } },
  "Precisao Definitiva no dano": { habs: ["cmb_precisao_definitiva"], combate: { precisaoPE: 2, precisaoModo: "dano" } },
  "Precisao Definitiva no acerto": { habs: ["cmb_precisao_definitiva"], combate: { precisaoPE: 2, precisaoModo: "acerto" } },
};
const assinatura = (der, id) => {
  const l = linha(der, id);
  return [l.acerto, l.fixo, l.dadosExtras];
};
for (const [nome, o] of Object.entries(CASOS)) {
  const com = d(20, o);
  const sem = d(20, { ...o, combate: {} });
  t(`${nome} mexe na arma`, JSON.stringify(assinatura(com, ARMA)) !== JSON.stringify(assinatura(sem, ARMA)), true);
  t(`${nome} mexe no Ataque Basico`, JSON.stringify(assinatura(com, "basico")) !== JSON.stringify(assinatura(sem, "basico")), true);
  t(`${nome} NAO mexe no Feitico`,
    [feitico(com).dados, feitico(com).fixo, feitico(com).partes.length],
    [feitico(sem).dados, feitico(sem).fixo, feitico(sem).partes.length]);
  const amaldicoado = (der) => der.testes.ataques.find((a) => a.id === "amaldicoado").bonus;
  t(`${nome} NAO mexe na jogada Amaldicoada`, amaldicoado(com), amaldicoado(sem));
}
/* Precisão: "+2 na rolagem para acertar [...] +4 ao invés de +2" no dano, por PE. */
t("Precisao Definitiva: +2 por PE no acerto e +4 no dano", [
  linha(d(20, CASOS["Precisao Definitiva no acerto"]), ARMA).acerto - linha(base20, ARMA).acerto,
  linha(d(20, CASOS["Precisao Definitiva no dano"]), ARMA).fixo - linha(base20, ARMA).fixo,
], [4, 8]);

/* ============================================================ */
/* 3. ESPÍRITO INCANSÁVEL                                        */
/* ============================================================ */
const incansavel = (nivel, sistema) => d(nivel, {
  sistema, feitico: false,
  habs: ["cmb_espirito_de_luta", "cmb_espirito_incansavel"],
  combate: { espiritoDeLuta: true, espiritoIncansavel: true },
});
/* No jogador o combatente é treinado na arma, então o bônus de ataque da linha
   É o número que o texto manda virar PV temporário. */
t("no jogador os PV temporarios sao o bonus de ataque da arma",
  [8, 12, 20].map((n) => incansavel(n, "player").pvTemporario),
  [8, 12, 20].map((n) => linha(incansavel(n, "player"), ARMA).acerto));
t("e o acerto sobe para +5 no total", linha(incansavel(20, "player"), ARMA).acerto
  - linha(d(20, { sistema: "player", feitico: false }), ARMA).acerto, 5);
/* Na criatura a régua é Nível ÷ 1,5, e o número não mudou com a revisão. */
t("na criatura continua Nivel / 1,5 + Maestria + Forca + 5",
  [8, 12, 20].map((n) => incansavel(n, "afty").pvTemporario),
  [8, 12, 20].map((n) => Math.floor(n / 1.5) + incansavel(n, "afty").maestria + 3 + 5));
/* "O seu bônus de ataque" é o MELHOR (autor, 2026-09-23): um Combatente de
   Destreza 18 e Força 10 recebe pela Destreza (+4), e não pela Força (+0). */
{
  const destro = d(12, {
    feitico: false, attrs: { forca: 10, destreza: 18 },
    habs: ["cmb_espirito_de_luta", "cmb_espirito_incansavel"],
    combate: { espiritoDeLuta: true, espiritoIncansavel: true },
  });
  t("o Espirito Incansavel le o maior entre FOR e DES",
    destro.pvTemporario, Math.floor(12 / 2) + destro.maestria + 4 + 5);
}

/* ============================================================ */
/* 4. A TRAVA DE NÍVEL DAS OPÇÕES                                */
/* ============================================================ */
const posturas = (esp, nivel, escolhidas = []) => d(nivel, {
  esp, feitico: false, habs: ["cmb_assumir_postura"],
  escolhas: { cmb_assumir_postura: escolhidas },
}).habilidades.escolhas.porHab.cmb_assumir_postura;
const curto = (ids) => ids.map((id) => id.replace("cmb_postura_", ""));
t("Combatente 2 trava Devastacao (6), Tempestade (10) e Ceu (12)",
  curto(posturas([{ id: "combatente", nivel: 2 }], 2).bloqueadas),
  ["da_devastacao", "da_tempestade", "do_ceu"]);
t("Combatente 6 libera a Devastacao",
  curto(posturas([{ id: "combatente", nivel: 6 }], 6).bloqueadas), ["da_tempestade", "do_ceu"]);
t("Combatente 11 ainda trava o Ceu",
  curto(posturas([{ id: "combatente", nivel: 11 }], 11).bloqueadas), ["do_ceu"]);
t("Combatente 12 libera todas", posturas([{ id: "combatente", nivel: 12 }], 12).bloqueadas, []);
/* Escalonamento: Combatente 8 + metade de Lutador 8 = 12. */
t("Combatente 8 com Lutador 8 escala a 12 e libera o Ceu",
  posturas([{ id: "combatente", nivel: 8 }, { id: "lutador", nivel: 8 }], 16).bloqueadas, []);
t("Combatente 8 com Lutador 7 escala a 11 e trava o Ceu",
  curto(posturas([{ id: "combatente", nivel: 8 }, { id: "lutador", nivel: 7 }], 15).bloqueadas), ["do_ceu"]);
/* A gravada abaixo do nível é REPORTADA e fica na ficha, igual aos
   `inacessiveis` das habilidades. */
{
  const e = posturas([{ id: "combatente", nivel: 4 }], 4, ["cmb_postura_do_ceu"]);
  t("a Postura do Ceu gravada no 4 e reportada", e.abaixoDoNivel, ["cmb_postura_do_ceu"]);
  t("e continua na ficha", e.opcoes, ["cmb_postura_do_ceu"]);
}
/* O mesmo "Pré-Requisito: Nível 6" nos dois outros pools que o têm. */
const outra = (espId, nivel, habId) => {
  const f = ficha(nivel, { esp: [{ id: espId, nivel }], feitico: false, habs: [habId] });
  return deriveAfty(f).habilidades.escolhas.porHab[habId]?.bloqueadas ?? null;
};
t("Feitico Rapido (Conjurador) trava no 5 e libera no 6", [
  outra("conjurador", 5, "cnj_dominio_dos_fundamentos"),
  outra("conjurador", 6, "cnj_dominio_dos_fundamentos"),
], [["cnj_fundamento_feitico_rapido"], []]);
t("Apoio Estrategico (Suporte) trava no 5 e libera no 6", [
  outra("suporte", 5, "sup_apoio_avancado"),
  outra("suporte", 6, "sup_apoio_avancado"),
], [["sup_apoio_estrategico"], []]);

/* ============================================================ */
/* 5. GRUPO FAVORITO                                             */
/* ============================================================ */
{
  const hab = H.getHabilidade("cmb_grupo_favorito");
  t("o Grupo Favorito tem a escolha de grupo", [hab.escolha?.id, hab.escolha?.niveis], ["grupo_favorito", [4]]);
  t("com um grupo por opcao", hab.escolha.opcoes.map((o) => o.id),
    ARMA_GRUPOS.map((g) => `cmb_favorito_${g.value}`));
  const der = d(4, { feitico: false, habs: ["cmb_grupo_favorito"], escolhas: { cmb_grupo_favorito: ["cmb_favorito_espada"] } });
  t("a escolha e guardada e cabe uma", [
    der.habilidades.escolhas.porHab.cmb_grupo_favorito.opcoes,
    der.habilidades.escolhas.porHab.cmb_grupo_favorito.allowance,
  ], [["cmb_favorito_espada"], 1]);
  t("e nao divide chave com o Armas Escolhidas",
    hab.escolha.opcoes.some((o) => o.id.startsWith("cmb_grupo_")), false);
}
t("o catalogo segue valido", H.validarCatalogoHabilidades?.() ?? [], []);

/* ============================================================ */
/* 6. PONTOS DE PREPARO NA SESSÃO                                */
/* ============================================================ */
{
  const der = d(8, { feitico: false });
  const max = der.pontosPreparo;
  let s = S.sessaoEmBranco(der);
  t("a sessao nasce com o Preparo cheio", [s.preparoAtual, S.preparoDe(s, max)], [null, max]);
  s = S.alteraPreparo(s, -3, max);
  t("gastar 3 desce 3", S.preparoDe(s, max), max - 3);
  s = S.alteraPreparo(s, 1, max);
  t("eliminar um inimigo devolve 1", S.preparoDe(s, max), max - 2);
  t("nunca desce de zero", S.preparoDe(S.alteraPreparo(s, -999, max), max), 0);
  t("nunca passa do maximo", S.preparoDe(S.alteraPreparo(s, 999, max), max), max);
  t("o campo tambem apara nos dois lados", [
    S.preparoDe(S.definePreparo(s, -5, max), max), S.preparoDe(S.definePreparo(s, 99, max), max),
  ], [0, max]);
  const cheio = S.definePreparo(s, max, max);
  const menor = d(6, { feitico: false });
  t("o maximo que cai leva o corrente junto",
    S.aparaSessao(cheio, menor).preparoAtual, menor.pontosPreparo);
  t("e o descanso enche", S.descansar(s, der).preparoAtual, null);
  t("sessao gravada sem o campo abre cheia",
    S.normalizaSessao({ hpAtual: 10, peAtual: 5 }, der).preparoAtual, null);
  t("e quem nao tem Artes do Combate fica em zero", d(8, { esp: [{ id: "lutador", nivel: 8 }], feitico: false }).pontosPreparo, 0);
}

/* ============================================================ */
/* 7. OS PONTOS DE VERIFICAÇÃO QUE ERAM ERRO (2026-09-23)        */
/* ============================================================ */
/* Fechamento dos pontos que a revisão deixou abertos. Só três eram diferença
   objetiva contra o livro, e é o que se mede aqui. O resto (decisão do autor,
   automação futura, manual) está classificado em docs/a-fazer.md. */
const comArmas = (nivel, armas, o = {}) => {
  const f = ficha(nivel, { ...o, feitico: o.feitico ?? true });
  f.equipamentos = {
    itens: armas.map((a, i) => ({
      id: `e${i}`, tipo: "arma", refId: a.ref, qtd: 1, equipado: true, ...(a.duas ? { duasMaos: true } : {}),
    })),
  };
  return deriveAfty(f);
};
const linhaDe = (der) => der.dano.entradas.find((x) => x.id !== "basico");

/* ---- Estilo Massivo: "+1 em rolagens de dano com a arma", UMA vez, numa arma
   "que esteja usando em duas mãos ou que possua a propriedade pesada". ---- */
{
  const massivo = { escolhas: { cmb_repertorio_do_especialista: ["cmb_estilo_massivo"] } };
  const delta = (arma) => linhaDe(comArmas(16, [arma], massivo)).fixo - linhaDe(comArmas(16, [arma])).fixo;
  t("Massivo: Pesada E de Duas Maos soma +5 uma vez so, e nao +10",
    delta({ ref: "arm_espada_grande" }), 5);
  t("Massivo: so Pesada, so Duas Maos e Versatil nas duas maos somam +5", [
    delta({ ref: "arm_corrente_de_aco" }), delta({ ref: "arm_adagas_duplas" }),
    delta({ ref: "arm_espada_longa", duas: true }),
  ], [5, 5, 5]);
  t("Massivo: Versatil numa mao e arma comum nao somam", [
    delta({ ref: "arm_espada_longa" }), delta({ ref: "arm_espada_curta" }),
  ], [0, 0]);
  t("Massivo: a parcela aparece uma vez no hover da Espada Grande",
    linhaDe(comArmas(16, [{ ref: "arm_espada_grande" }], massivo)).partes
      .filter((p) => /Massivo/.test(p.label)).map((p) => p.valor), [5]);
  t("Massivo: o Feiticio nao recebe nada",
    feitico(comArmas(16, [{ ref: "arm_espada_grande" }], massivo)).fixo,
    feitico(comArmas(16, [{ ref: "arm_espada_grande" }])).fixo);
}

/* ---- Postura da Lua: "não recebem seu bônus de atributo no dano". Só no
   jogador, onde o atributo é parcela da linha. ---- */
{
  const lua = (sistema, combate) => comArmas(8, [{ ref: ARMA }], {
    sistema, habs: ["cmb_assumir_postura"],
    escolhas: { cmb_assumir_postura: ["cmb_postura_da_lua"] }, combate,
  });
  const fora = linhaDe(lua("player", {}));
  const dentro = linhaDe(lua("player", { postura: "lua" }));
  t("Lua no jogador: a linha perde o modificador de Forca (+3) e o acerto cai 4",
    [fora.fixo - dentro.fixo, fora.acerto - dentro.acerto], [3, 4]);
  t("Lua no jogador: o hover diz de onde veio o zero",
    (({ label, valor }) => ({ label, valor }))(dentro.partes.find((p) => /^Força/.test(p.label))),
    { label: "Força (Postura da Lua)", valor: 0 });
  /* O Invencível sob o Sol dá "todos os efeitos positivos das suas posturas":
     a perda do atributo, como o −4, não vale sob ele. Mesma ficha do
     t-invencivel-sob-o-sol.mjs (Combatente 20 / Conjurador 10, Atingir o Ápice). */
  const apice = (combate) => {
    const f = ficha(30, {
      feitico: false,
      esp: [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }],
      habs: ["cmb_assumir_postura", "cmb_preparacao_rapida", "cmb_mestre_da_postura"],
      escolhas: { cmb_assumir_postura: ["cmb_postura_da_lua"] },
    });
    f.habilidadesLendarias = ["len_atingir_apice"];
    f.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
    f.equipamentos = { itens: [{ id: "e0", tipo: "arma", refId: ARMA, qtd: 1, equipado: true }] };
    f.combate = { ativo: true, ...combate };
    return deriveAfty(f);
  };
  const soLua = apice({ postura: "lua" });
  const luaInvencivel = apice({ postura: "lua", invencivelSobOSol: true, invencivelRodadas: 1 });
  t("Lua sob o Invencivel sob o Sol: o Apice esta valendo", luaInvencivel.combate.invencivelSobOSol, true);
  t("e o atributo volta ao dano (so a Lua o tirava)", [
    linhaDe(soLua).partes.find((p) => /^Força/.test(p.label)).valor,
    linhaDe(luaInvencivel).partes.find((p) => /^Força/.test(p.label)).label,
    linhaDe(luaInvencivel).partes.find((p) => /^Força/.test(p.label)).valor,
  ], [0, "Força", 3]);
  const cFora = linhaDe(lua("afty", {}));
  const cDentro = linhaDe(lua("afty", { postura: "lua" }));
  t("Lua na criatura: o fixo nao muda (a leitura ali e pergunta ao autor), so o -4",
    [cFora.fixo - cDentro.fixo, cFora.acerto - cDentro.acerto], [0, 4]);
}

/* ---- Precisão Definitiva: "A cada quatro níveis", pelo escalonamento, que é
   como o livro manda a multiclasse contar os efeitos de habilidade. ---- */
{
  const C = await import(R + "afty-combate.js");
  const est = C.COMBATE_ESTADOS.find((e) => e.id === "precisaoPE");
  const teto = (esp) => {
    const der = d(esp.reduce((s, e) => s + e.nivel, 0), {
      esp, feitico: false, habs: ["cmb_precisao_definitiva"],
      combate: { precisaoPE: 3, precisaoModo: "acerto" },
    });
    return [der.combate.precisaoPE, est.max(der)];
  };
  t("Precisao: Combatente 4 / Lutador 8 (escalonamento 8) tem teto 3 no derive e na tela",
    teto([{ id: "combatente", nivel: 4 }, { id: "lutador", nivel: 8 }]), [3, 3]);
  t("Precisao: Combatente 4 puro segue com 2 e Combatente 8 com 3", [
    teto([{ id: "combatente", nivel: 4 }]), teto([{ id: "combatente", nivel: 8 }]),
  ], [[2, 2], [3, 3]]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
