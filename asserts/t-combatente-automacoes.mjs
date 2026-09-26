/* AS AUTOMAÇÕES DO ESPECIALISTA EM COMBATE (Combatente), 2026-09-23 e 24.

   Depois da revisão contra o livro (t-combatente-revisao.mjs), o autor pediu
   para automatizar tudo o que tinha ficado como "automação futura", e respondeu
   as dúvidas no caminho. Este arquivo prende cada peça, em ordem:

     1. O CANAL DE ALCANCE (`alcanceArma`): Extensão do Corpo, Sincronia
        Perfeita e o Longo do Golpe Especial, nos dois alcances da arma de
        distância e antes do dobro da Postura do Céu.
     2. O MANEJO ÚNICO soma uma propriedade no card do Manejo Especial.
     3. A BRUTALIDADE (Lutador) conta os degraus pelo nível de escalonamento.
     4. ⚠ NO JOGADOR SÓ A CLASSE INICIAL TREINA EQUIPAMENTO (livro: "Ao obter uma
        nova especialização, você não recebe novos treinamentos em perícias nem
        equipamentos"), e o Golpes Potentes mira só a arma treinada.
     5. A CASCA DE PREPARO DA POSTURA DO CÉU: topa em 2 a cada rodada, é gasta
        primeiro e some no descanso.
     6. O CONTADOR DE USOS das habilidades do Combatente.
     7. O MONTADOR DO GOLPE ESPECIAL: custo, mínimo de 1 PE, Preciso por rodada,
        Autossuficiente, Sacrifício e as marcas que ficam. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const C = await import(R + "afty-combate.js");
const G = await import(R + "afty-golpe-especial.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { conteudoDaFicha } = await import(R + "ficha/ficha-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* O mesmo molde do t-combatente-revisao.mjs: jogador Combatente com Força 16 e
   Sabedoria 14, e as armas que o caso pedir. */
const ficha = (nivel, o = {}) => {
  const {
    sistema = "player", esp = null, habs = [], escolhas = {}, combate = null,
    attrs = {}, armas = ["arm_espada_curta"],
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
  f.equipamentos = {
    itens: armas.map((ref, i) => ({ id: `e${i}`, tipo: "arma", refId: ref, qtd: 1, equipado: true })),
  };
  if (combate) f.combate = { ativo: true, ...combate };
  return f;
};
const d = (nivel, o) => deriveAfty(ficha(nivel, o));
const linha = (der, id) => der.dano.entradas.find((x) => x.id === id);
const nivelTotal = (esp) => esp.reduce((s, e) => s + e.nivel, 0);

/* ============================================================ */
/* 1. O CANAL DE ALCANCE                                         */
/* ============================================================ */
{
  const armas = ["arm_espada_curta", "arm_arco_longo", "arm_azagaia"];
  const base = d(12, { armas });
  const alc = (der, id) => [linha(der, id).alcance.curto, linha(der, id).alcance.longo];
  const delta = (der, id) => alc(der, id).map((v, i) => v - alc(base, id)[i]);

  /* "Seu alcance em ataques com armas corpo a corpo aumenta em 1,5 metros". */
  const extensao = d(12, { armas, habs: ["cmb_extensao_do_corpo"] });
  t("Extensao do Corpo: +1,5 na arma corpo a corpo", delta(extensao, "arm_espada_curta"), [1.5, 1.5]);
  t("e nada no arco, na azagaia nem no Ataque Basico", [
    delta(extensao, "arm_arco_longo"), delta(extensao, "arm_azagaia"), delta(extensao, "basico"),
  ], [[0, 0], [0, 0], [0, 0]]);
  t("o texto do alcance usa virgula", linha(extensao, "arm_espada_curta").alcance.texto, "3m");
  /* "O alcance adicional concedido por Extensão do Corpo aumenta para 3 metros". */
  const sincronia = d(12, { armas, habs: ["cmb_extensao_do_corpo", "cmb_sincronia_perfeita"] });
  t("Sincronia Perfeita leva o adicional a 3 metros", delta(sincronia, "arm_espada_curta"), [3, 3]);

  /* Longo: "1,5 metros para corpo-a-corpo ou 9 metros para ataques a
     distância", e os 9 valem nos dois alcances (autor, 2026-09-23). */
  const longo = d(12, { armas, combate: { golpeLongo: true } });
  t("Longo: +1,5 no corpo a corpo", delta(longo, "arm_espada_curta"), [1.5, 1.5]);
  t("Longo: +9 nos dois alcances do Arco Longo (30/60 vira 39/69)",
    [alc(longo, "arm_arco_longo"), linha(longo, "arm_arco_longo").alcance.texto], [[39, 69], "39m / 69m"]);
  t("Longo: +9 nos dois alcances da Azagaia de arremesso", delta(longo, "arm_azagaia"), [9, 9]);
  t("Longo: o Ataque Basico nao e arma", delta(longo, "basico"), [0, 0]);
  t("Longo: fora de combate nao vale", delta(d(12, { armas, combate: null }), "arm_arco_longo"), [0, 0]);
  t("Longo: o hover da linha nao muda de formato", typeof linha(longo, "arm_arco_longo").alcance.texto, "string");

  /* A Postura do Céu dobra "o alcance dos seus ataques", e o bônus já faz
     parte desse alcance: (30 + 9) × 2. */
  const ceu = d(12, {
    armas, habs: ["cmb_assumir_postura"],
    escolhas: { cmb_assumir_postura: ["cmb_postura_do_ceu"] },
    combate: { golpeLongo: true, postura: "ceu" },
  });
  t("Longo com a Postura do Ceu: o bonus entra antes do dobro", alc(ceu, "arm_arco_longo"), [78, 138]);
  t("o Longo e estado da familia do Golpe Especial",
    C.COMBATE_ESTADOS.find((e) => e.id === "golpeLongo")?.label, "Golpe Especial · Longo");
}

/* ============================================================ */
/* 2. MANEJO ÚNICO                                               */
/* ============================================================ */
/* "Você escolhe mais uma propriedade para ser aplicada em toda arma". Soma no
   card do Manejo Especial, como o Acervo Amplo soma um Estilo. */
{
  const vagas = (habs) => d(12, { habs }).habilidades.escolhas.porHab.cmb_manejo_especial?.allowance ?? 0;
  t("Manejo Especial sozinho escolhe uma propriedade", vagas(["cmb_manejo_especial"]), 1);
  t("com o Manejo Unico escolhe duas", vagas(["cmb_manejo_especial", "cmb_manejo_unico"]), 2);
}

/* ============================================================ */
/* 3. BRUTALIDADE PELO ESCALONAMENTO                             */
/* ============================================================ */
/* "Nos níveis 8, 12, 16 e 20": o nível é o de escalonamento (livro: "nível da
   Multiclasse + Metade do seu Nível em outras Especializações para efeitos de
   habilidades"), a mesma régua da Precisão Definitiva. */
{
  const teto = (esp) => {
    const der = d(nivelTotal(esp), {
      esp, habs: ["lut_brutalidade"], combate: { brutalidade: true, brutalidadePE: 4 },
    });
    const est = C.COMBATE_ESTADOS.find((e) => e.id === "brutalidadePE");
    return [der.combate.brutalidadePE, est.max(der)];
  };
  t("Brutalidade: Lutador 8 puro tem um degrau", teto([{ id: "lutador", nivel: 8 }]), [1, 1]);
  t("Brutalidade: Lutador 8 com Combatente 8 escala a 12 e tem dois",
    teto([{ id: "lutador", nivel: 8 }, { id: "combatente", nivel: 8 }]), [2, 2]);
}

/* ============================================================ */
/* 4. TREINO SÓ DA CLASSE INICIAL (jogador)                      */
/* ============================================================ */
{
  const SUP_CMB = [{ id: "suporte", nivel: 8 }, { id: "combatente", nivel: 4 }];
  const CMB_SUP = [{ id: "combatente", nivel: 4 }, { id: "suporte", nivel: 8 }];
  const armas = (sistema, esp) => d(12, { sistema, esp }).treinamentosEquipamento.armas;
  t("jogador Suporte e depois Combatente: so as Simples do Suporte", armas("player", SUP_CMB), ["simples"]);
  t("jogador Combatente primeiro: todas", armas("player", CMB_SUP), ["todas"]);
  t("criatura junta as classes, como sempre", armas("afty", SUP_CMB).includes("todas"), true);

  /* "Sempre que você estiver usando uma arma com a qual você seja treinado".
     A Espada Longa é Complexa: o Suporte não treina, o Combatente treina. */
  const potentes = (sistema, esp) => {
    const o = { sistema, esp, armas: ["arm_espada_longa"] };
    return linha(d(12, { ...o, habs: ["cmb_golpes_potentes"] }), "arm_espada_longa").fixo
      - linha(d(12, o), "arm_espada_longa").fixo;
  };
  t("Golpes Potentes: +2 na arma treinada (Combatente primeiro)", potentes("player", CMB_SUP), 2);
  t("Golpes Potentes: nada na arma sem treino (Suporte primeiro, no jogador)", potentes("player", SUP_CMB), 0);
  /* Na criatura o nível de dano a mais também sobe o fixo (a régua de dano de
     lá), então o número é outro: o que se prende é que a ordem não importa. */
  t("Golpes Potentes: na criatura a mesma ficha treina e soma igual",
    [potentes("afty", SUP_CMB) > 0, potentes("afty", SUP_CMB)], [true, potentes("afty", CMB_SUP)]);
}

/* ============================================================ */
/* 5. A CASCA DE PREPARO DA POSTURA DO CÉU                       */
/* ============================================================ */
/* "2 pontos de preparo temporários no começo de todo turno", topando em 2
   (autor, 2026-09-23). */
{
  const opCeu = {
    habs: ["cmb_assumir_postura"], escolhas: { cmb_assumir_postura: ["cmb_postura_do_ceu"] },
  };
  const ceu = d(12, { ...opCeu, combate: { postura: "ceu" } });
  const fora = d(12, { ...opCeu, combate: {} });
  const max = ceu.pontosPreparo;
  t("o derive entrega 2 na Postura do Ceu e 0 fora dela",
    [ceu.preparoTemporario, fora.preparoTemporario], [2, 0]);
  let s = { ...S.sessaoEmBranco(ceu), combate: { ativo: true, postura: "ceu" } };
  t("a sessao nasce sem casca", S.preparoTempDe(s), 0);
  s = S.proximaRodada(s, ceu).sessao;
  t("a virada de rodada topa a casca em 2", S.preparoTempDe(s), 2);
  s = S.alteraPreparo(s, -3, max);
  t("o gasto come a casca primeiro", [S.preparoTempDe(s), S.preparoDe(s, max)], [0, max - 1]);
  s = S.alteraPreparo(S.proximaRodada(s, ceu).sessao, -1, max);
  s = S.proximaRodada(s, ceu).sessao;
  t("topa e nao acumula: sobra 1, a rodada devolve a 2", S.preparoTempDe(s), 2);
  t("iniciar o combate ja entrega a casca",
    S.preparoTempDe(S.iniciaCombate(S.sessaoEmBranco(ceu), ceu)), 2);
  t("sair da Postura apara a casca a zero", S.preparoTempDe(S.aparaSessao(s, fora)), 0);
  t("e o descanso zera", S.preparoTempDe(S.descansar(s, ceu)), 0);
}

/* ============================================================ */
/* 6. O CONTADOR DE USOS                                         */
/* ============================================================ */
{
  const USADAS = [
    "cmb_assumir_postura", "cmb_indomavel", "cmb_revigorar",
    "cmb_marcar_inimigo", "cmb_surto_de_acao", "cmb_potencia_antes_de_cair",
  ];
  const der = d(10, { habs: USADAS });
  const bt = der.maestria;
  const max = Object.fromEntries(Object.entries(der.usosHabilidades).map(([id, u]) => [id, u.max]));
  t("os maximos saem do texto de cada habilidade", max, {
    cmb_assumir_postura: bt, // "igual ao seu bônus de treinamento"
    cmb_indomavel: 5, // "metade do seu nível de personagem"
    cmb_revigorar: bt, // "igual ao seu bônus de treinamento"
    cmb_marcar_inimigo: 3, // "modificador de Força, Destreza ou Sabedoria": o maior
    cmb_surto_de_acao: Math.floor(bt / 2), // "metade do seu bônus de treinamento"
    cmb_potencia_antes_de_cair: 1, // "uma vez por descanso longo"
  });
  t("cada contador diz a recarga do livro", Object.values(der.usosHabilidades).map((u) => u.recarga),
    ["descanso", "descanso", "longo", "curto", "longo", "longo"]);
  t("Marcar Inimigo nao fica negativo com os tres modificadores abaixo de zero",
    d(10, { habs: ["cmb_marcar_inimigo"], attrs: { forca: 8, destreza: 8, sabedoria: 8 } })
      .usosHabilidades.cmb_marcar_inimigo.max, 0);
  t("habilidade sem contador fica fora do mapa",
    Object.keys(d(10, { habs: ["cmb_extensao_do_corpo"] }).usosHabilidades), []);

  const item = conteudoDaFicha(ficha(10, { habs: USADAS }), der).find((i) => i.id === "cmb_surto_de_acao");
  t("a linha da habilidade na Ficha carrega o contador e a chave da sessao",
    item.usos, { max: Math.floor(bt / 2), recarga: "longo", chave: "hab:cmb_surto_de_acao" });
  let s = S.sessaoEmBranco(der);
  const u = { chave: "hab:cmb_indomavel", max: 5 };
  s = S.marcaUso(S.marcaUso(s, u, 1), u, 1);
  t("gastar dois deixa dois gastos", S.usosGastosDe(s, u.chave), 2);
  t("nao gasta alem do maximo", S.usosGastosDe(S.marcaUso(s, u, 99), u.chave), 5);
  t("devolver nao passa de zero", S.usosGastosDe(S.marcaUso(s, u, -99), u.chave), 0);
  t("sem chave nada muda", S.marcaUso(s, { max: 3 }, 1), s);
  t("o descanso devolve tudo", S.usosGastosDe(S.descansar(s, der), u.chave), 0);
}

/* ============================================================ */
/* 7. O MONTADOR DO GOLPE ESPECIAL                               */
/* ============================================================ */
{
  const custo = (marcas, o) => {
    const c = G.custoDoGolpe(marcas, o);
    return [c.total, c.aPagar];
  };
  t("sem propriedade nao ha golpe montado", G.custoDoGolpe({}).montado, false);
  t("Amplo e Atroz custam 3", custo({ amplo: 1, atroz: 1 }), [3, 3]);
  t("Lento sozinho vai ao minimo de 1 PE", custo({ lento: 1 }), [1, 1]);
  t("Letal, Penetrante e tres Desfocados custam 1", custo({ letal: 1, penetrante: 1, desfocado: 3 }), [1, 1]);
  t("Sanguinario duas vezes custa 4", custo({ sanguinario: 2 }), [4, 4]);
  t("as contagens aparam no maximo do livro", custo({ sanguinario: 9, desfocado: 9, letal: 1, amplo: 1, penetrante: 1 }), [7, 7]);
  t("Preciso custa 1, e 2 depois do primeiro na rodada",
    [custo({ preciso: 1 })[0], custo({ preciso: 1 }, { precisoRepetido: true })[0]], [1, 2]);
  t("o Autossuficiente abate do custo, e nunca abaixo de zero", [
    custo({ amplo: 1, letal: 1, atroz: 1 }, { abate: 3 }), custo({ amplo: 1 }, { abate: 6 }),
  ], [[5, 2], [2, 0]]);

  const der = d(8, {});
  const der20 = d(20, {});
  t("o derive diz quem monta o golpe", [
    d(3, {}).golpeEspecial, der.golpeEspecial, der20.golpeEspecial,
  ], [
    { disponivel: false, autossuficiente: false },
    { disponivel: true, autossuficiente: false },
    { disponivel: true, autossuficiente: true },
  ]);

  const emCombate = (derived) => ({
    ...S.sessaoEmBranco(derived), rodada: 1, combate: { ativo: true },
  });
  let s = emCombate(der);
  s = S.marcaPropriedadeGolpe(s, "atroz", true);
  s = S.marcaPropriedadeGolpe(s, "amplo", true);
  s = S.marcaPropriedadeGolpe(s, "sanguinario", 5);
  t("as numericas viram estado de bancada e as outras ficam no campo proprio",
    [s.combate.golpeAtroz, s.golpeEspecial], [true, { amplo: true, sanguinario: 2 }]);
  t("o Atroz marcado no montador soma o dado na linha", (() => {
    const f = ficha(8, {});
    const com = deriveAfty({ ...f, combate: s.combate });
    const sem = deriveAfty({ ...f, combate: { ativo: true } });
    return linha(com, "arm_espada_curta").dadosExtras - linha(sem, "arm_espada_curta").dadosExtras;
  })(), 1);
  t("desmarcar tira a chave", S.marcaPropriedadeGolpe(s, "amplo", false).golpeEspecial, { sanguinario: 2 });
  t("id desconhecido nao mexe", S.marcaPropriedadeGolpe(s, "voador", true), s);

  // Atroz 1 + Amplo 2 + Sanguinário 2 × 2 = 7.
  const pe0 = s.peAtual;
  const pago = S.pagaGolpeEspecial({ ...s, peTempFontes: { Treino: 2 } }, der);
  t("pagar gasta a casca de PE primeiro e depois o PE", [pago.peTempFontes.Treino ?? 0, pago.peAtual], [0, pe0 - 5]);
  t("as marcas ficam depois de pagar", [pago.combate.golpeAtroz, pago.golpeEspecial],
    [true, { amplo: true, sanguinario: 2 }]);
  t("sem PE para pagar nada muda", S.pagaGolpeEspecial({ ...s, peAtual: 6 }, der).peAtual, 6);
  t("fora de combate nada muda",
    S.pagaGolpeEspecial({ ...s, combate: { ...s.combate, ativo: false } }, der).peAtual, pe0);
  t("sem o Golpe Especial nada muda", S.pagaGolpeEspecial(s, d(3, {})).peAtual, pe0);

  /* Preciso: "Após o primeiro uso na rodada, o custo aumenta para 2PE." */
  let p = S.marcaPropriedadeGolpe(emCombate(der), "preciso", true);
  const peP = p.peAtual;
  p = S.pagaGolpeEspecial(p, der);
  t("o primeiro Preciso da rodada custa 1", peP - p.peAtual, 1);
  t("o segundo da mesma rodada custa 2", S.custoDoGolpeDaSessao(p, der).total, 2);
  p = S.proximaRodada(p, der).sessao;
  t("a rodada seguinte volta a 1", S.custoDoGolpeDaSessao(p, der).total, 1);

  /* Sacrifício: "Recebe 15 de dano ao efetuar o ataque." É dano, então a casca
     de PV come primeiro. */
  const sac = S.pagaGolpeEspecial({
    ...S.marcaPropriedadeGolpe(S.marcaPropriedadeGolpe(emCombate(der), "sacrificio", true), "amplo", true),
    pvTempFontes: { Escudo: 10 },
  }, der);
  t("Sacrificio cobra 15 de dano, a casca de PV primeiro",
    [sac.pvTempFontes.Escudo ?? 0, der.hp - sac.hpAtual], [0, 5]);
  t("e o Sacrificio abate 1 do custo", der.pe - sac.peAtual, 1);

  /* Autossuficiente: "recebe 3 PE temporários para serem usados no ataque. Uma
     vez por cena, você pode escolher transformar esse valor em 6." */
  let a = emCombate(der20);
  for (const id of ["amplo", "letal", "penetrante"]) a = S.marcaPropriedadeGolpe(a, id, true);
  t("Autossuficiente abate 3 de um golpe de 6", S.custoDoGolpeDaSessao(a, der20).aPagar, 3);
  t("e 6 quando a troca e escolhida", S.custoDoGolpeDaSessao(a, der20, { seis: true }).aPagar, 0);
  const peA = a.peAtual;
  a = S.pagaGolpeEspecial(a, der20, { seis: true });
  t("pagar com a troca nao gasta PE e a marca como usada",
    [peA - a.peAtual, S.seisDoAutossuficienteUsado(a)], [0, true]);
  t("usada na cena, a troca volta a abater 3", S.custoDoGolpeDaSessao(a, der20, { seis: true }).aPagar, 3);
  t("a cena nova devolve a troca", S.seisDoAutossuficienteUsado(S.iniciaCombate(a, der20)), false);
  t("o descanso tambem", S.seisDoAutossuficienteUsado(S.descansar(a, der20)), false);
  t("e a virada de rodada no meio da cena nao", S.seisDoAutossuficienteUsado(S.proximaRodada(a, der20).sessao), true);
  t("sem o Autossuficiente a troca nao vale nada",
    S.custoDoGolpeDaSessao(S.marcaPropriedadeGolpe(emCombate(der), "amplo", true), der, { seis: true }).aPagar, 2);

  /* A leitura do armazenamento. */
  t("a sessao gravada so guarda marca conhecida e aparada",
    S.normalizaSessao({ golpeEspecial: { amplo: 1, sanguinario: 7, atroz: true, voador: true } }, der).golpeEspecial,
    { amplo: true, sanguinario: 2 });
  t("sessao antiga sem o campo abre vazia", S.normalizaSessao({ hpAtual: 5 }, der).golpeEspecial, {});
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
